"""A minimal hand-written NDJSON worker: one request per line, one response per line.

Protocol: `{"id": 1, "fn": "add", "args": [1, 2]}` in, `{"id": 1, "value": 3}` out. No
validation and no concurrency: it isolates the cost of the pipe and the JSON round trip.
"""

import json
import sys

from bench import add, cpu, echo

FUNCTIONS = {"add": add, "echo": echo, "cpu": cpu}


def main() -> None:
    """Serves requests from stdin until it closes."""
    out = sys.stdout

    for line in sys.stdin:
        request = json.loads(line)
        value = FUNCTIONS[request["fn"]](*request["args"])

        out.write(json.dumps({"id": request["id"], "value": value}) + "\n")
        out.flush()


if __name__ == "__main__":
    main()
