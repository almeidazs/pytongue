"""One call per process: reads `{"fn": ..., "args": [...]}` from stdin, prints the result."""

import json
import sys

from bench import add, cpu, echo

FUNCTIONS = {"add": add, "echo": echo, "cpu": cpu}

request = json.load(sys.stdin)

sys.stdout.write(json.dumps({"value": FUNCTIONS[request["fn"]](*request["args"])}))
