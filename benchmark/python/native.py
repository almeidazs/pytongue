"""The floor: the same calls made directly in-process, timed with `time.perf_counter_ns`.

Usage: `python native.py <scenario> [--quick]`. Prints one `@@RESULT@@ {json}` line, like the
JS children do, so the driver treats every tool the same way.
"""

import json
import sys
import time

from bench import add, cpu, echo

MARK = "@@RESULT@@ "


def percentile(sorted_values: list[float], p: float) -> float:
    """Returns the nearest-rank percentile of an ascending list."""
    index = min(len(sorted_values) - 1, max(0, round(p / 100 * len(sorted_values) + 0.5) - 1))

    return sorted_values[index]


def records(target_bytes: int) -> dict[str, list[dict[str, object]]]:
    """Builds an object with a list of records of about `target_bytes` of JSON."""
    out: list[dict[str, object]] = []
    size = 2

    while size < target_bytes:
        record = {
            "id": len(out),
            "name": f"record-{len(out)}",
            "price": len(out) * 1.25,
            "active": len(out) % 2 == 0,
            "tags": ["alpha", "beta", "gamma"],
        }

        out.append(record)
        size += len(json.dumps(record, separators=(",", ":"))) + 2

    return {"records": out}


def latency(quick: bool) -> dict[str, object]:
    """Sequential `add(1, 2)`: p50/p95/p99 and mean, in microseconds."""
    n, warmup = (200, 20) if quick else (2000, 200)

    for _ in range(warmup):
        add(1, 2)

    samples: list[float] = []

    for _ in range(n):
        start = time.perf_counter_ns()

        add(1, 2)
        samples.append((time.perf_counter_ns() - start) / 1000)

    samples.sort()

    return {
        "n": n,
        "p50": percentile(samples, 50),
        "p95": percentile(samples, 95),
        "p99": percentile(samples, 99),
        "mean": sum(samples) / n,
    }


def throughput(quick: bool) -> dict[str, object]:
    """Sequential `add` calls per second; there is no concurrent variant in-process."""
    n = 2000 if quick else 20000
    start = time.perf_counter_ns()

    for _ in range(n):
        add(1, 2)

    seconds = (time.perf_counter_ns() - start) / 1e9

    return {
        "sequential": {"n": n, "opsPerSec": n / seconds},
        "concurrent": None,
    }


def payload(quick: bool) -> dict[str, object]:
    """Median `echo` latency for ~1 KB, ~100 KB and ~1 MB objects."""
    sizes = []

    for label, size, count in (("1 KB", 1_000, 50), ("100 KB", 100_000, 50), ("1 MB", 1_000_000, 10)):
        body = records(size)
        times: list[float] = []

        for _ in range(count if not quick else max(3, count // 5)):
            start = time.perf_counter_ns()

            echo(body)
            times.append((time.perf_counter_ns() - start) / 1e6)

        times.sort()
        sizes.append(
            {"label": label, "bytes": len(json.dumps(body, separators=(",", ":"))), "n": len(times), "medianMs": times[len(times) // 2]}
        )

    return {"sizes": sizes}


def cpu_bound(quick: bool) -> dict[str, object]:
    """Five calls of the pure-Python sum of squares."""
    n = 1_000_000 if quick else 5_000_000
    times: list[float] = []

    for _ in range(5):
        start = time.perf_counter_ns()

        cpu(n)
        times.append((time.perf_counter_ns() - start) / 1e6)

    times.sort()

    return {"n": n, "calls": 5, "medianMs": times[2], "minMs": times[0]}


def cold(_quick: bool) -> dict[str, object]:
    """First `add`, timed from inside the process: the driver measures the process wall time."""
    start = time.perf_counter_ns()
    value = add(1, 2)
    elapsed = (time.perf_counter_ns() - start) / 1e6

    print(MARK + json.dumps({"event": "first"}), flush=True)

    return {"clientMs": elapsed, "value": value}


SCENARIOS = {
    "cold": cold,
    "latency": latency,
    "throughput": throughput,
    "payload": payload,
    "cpu": cpu_bound,
}

if __name__ == "__main__":
    scenario = sys.argv[1]
    quick = "--quick" in sys.argv

    print(MARK + json.dumps({"status": "ok", "data": SCENARIOS[scenario](quick)}), flush=True)
