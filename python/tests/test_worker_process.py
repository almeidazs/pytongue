"""The worker as Node starts it: `python bridge.py <file>`, talking NDJSON over stdin/stdout."""

import json
import subprocess
import sys
import textwrap
from collections.abc import Callable, Iterator
from pathlib import Path

import pytest

BRIDGE = Path(__file__).resolve().parents[1] / "bridge.py"


class Worker:
    """A running worker with line-oriented helpers."""

    def __init__(self, file: Path) -> None:
        self.process = subprocess.Popen(
            [sys.executable, str(BRIDGE), str(file)],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
        )

    def read(self) -> dict[str, object]:
        assert self.process.stdout is not None

        return json.loads(self.process.stdout.readline())

    def send(self, message: dict[str, object]) -> None:
        assert self.process.stdin is not None
        _ = self.process.stdin.write(json.dumps(message) + "\n")
        self.process.stdin.flush()

    def close(self) -> str:
        """Closes stdin as Node does when it leaves, waits for the exit, and returns stderr."""
        assert self.process.stdin is not None
        assert self.process.stdout is not None
        assert self.process.stderr is not None

        if not self.process.stdin.closed:
            self.process.stdin.close()

        _ = self.process.wait(timeout=10)
        stderr = self.process.stderr.read()

        self.process.stdout.close()
        self.process.stderr.close()

        return stderr


@pytest.fixture
def start(tmp_path: Path) -> Iterator[Callable[[str], Worker]]:
    workers: list[Worker] = []

    def run(source: str) -> Worker:
        file = tmp_path / "user.py"
        _ = file.write_text(textwrap.dedent(source))
        worker = Worker(file)

        workers.append(worker)

        return worker

    yield run

    for worker in workers:
        if worker.process.poll() is None:
            worker.process.kill()

        _ = worker.process.wait()

        for pipe in (worker.process.stdin, worker.process.stdout, worker.process.stderr):
            if pipe is not None and not pipe.closed:
                pipe.close()


def test_ready_then_a_call(start: Callable[[str], Worker]) -> None:
    worker = start("def double(x: int) -> int:\n    return x * 2\n")

    assert worker.read() == {"ready": True}

    worker.send({"id": 1, "op": "call", "fn": "double", "args": [21]})

    assert worker.read() == {"id": 1, "ok": True, "value": 42}

    _ = worker.close()

    assert worker.process.returncode == 0


def test_print_goes_to_stderr_and_never_into_the_protocol(start: Callable[[str], Worker]) -> None:
    worker = start(
        """
        import os, sys

        def noisy(x: int) -> int:
            print("from print")
            sys.stdout.write("from sys.stdout\\n")
            os.write(1, b"raw write to fd 1\\n")
            return x
        """,
    )

    assert worker.read() == {"ready": True}

    worker.send({"id": 1, "op": "call", "fn": "noisy", "args": [5]})

    assert worker.read() == {"id": 1, "ok": True, "value": 5}

    stderr = worker.close()

    assert "from print" in stderr
    assert "from sys.stdout" in stderr
    assert "raw write to fd 1" in stderr


def test_stdin_inside_user_code_reads_nothing(start: Callable[[str], Worker]) -> None:
    worker = start(
        """
        import sys

        def read_stdin() -> str:
            return sys.stdin.read()
        """,
    )

    assert worker.read() == {"ready": True}

    worker.send({"id": 1, "op": "call", "fn": "read_stdin"})

    assert worker.read() == {"id": 1, "ok": True, "value": ""}

    _ = worker.close()


def test_an_import_failure_sends_ready_false_and_exits_1(start: Callable[[str], Worker]) -> None:
    worker = start("import no_such_module_anywhere\n")
    message = worker.read()

    assert message["ready"] is False
    assert isinstance(message["error"], dict)
    assert message["error"]["type"] == "ModuleNotFoundError"

    _ = worker.close()

    assert worker.process.returncode == 1


def test_a_syntax_error_in_user_code_is_reported_as_a_startup_failure(
    start: Callable[[str], Worker],
) -> None:
    worker = start("def broken(:\n    pass\n")
    message = worker.read()

    assert message["ready"] is False
    assert isinstance(message["error"], dict)
    assert message["error"]["type"] == "SyntaxError"

    _ = worker.close()


def test_the_worker_exits_cleanly_when_node_closes_stdin(start: Callable[[str], Worker]) -> None:
    worker = start("def f() -> int:\n    return 1\n")

    assert worker.read() == {"ready": True}

    _ = worker.close()

    assert worker.process.returncode == 0


def test_requests_in_flight_all_get_replies(start: Callable[[str], Worker]) -> None:
    worker = start("def echo(x: int) -> int:\n    return x\n")

    assert worker.read() == {"ready": True}

    for n in range(50):
        worker.send({"id": n, "op": "call", "fn": "echo", "args": [n]})

    replies = {worker.read()["id"]: None for _ in range(50)}

    assert set(replies) == set(range(50))

    _ = worker.close()
