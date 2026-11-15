"""Worker main module: splits the RPC channel off stdin/stdout, then serves the user module.

Protocol (one JSON object per line):

  worker -> node   {"ready": true} | {"ready": false, "error": {...}}        once, after the import
  node -> worker   {"id": 1, "op": "call", "fn": "f", "args": [...], "rest": [...], "kwargs": {...}}
                   {"id": 2, "op": "open", "stream": 7, "fn": "g", "args": ..., "rest": ..., "kwargs": ...}
                   {"id": 3, "op": "next", "stream": 7}
                   {"op": "cancel", "stream": 7}                              no reply
  worker -> node   {"id": 1, "ok": true, "value": ...}
                   {"id": 3, "ok": true, "done": false, "value": ...} | {"id": 3, "ok": true, "done": true}
                   {"id": 1, "ok": false, "error": {"type", "module", "message", "traceback", "validation"?}}
"""

import io
import os
import sys

# The channels are split off at the fd level before anything else runs. The original stdin and
# stdout become the RPC channel; fd 1 is pointed at stderr, so print() and C extensions writing to
# fd 1 cannot corrupt the protocol; fd 0 reads from devnull.
rpc_in_fd = os.dup(0)
rpc_out_fd = os.dup(1)
_ = os.dup2(2, 1)
null_fd = os.open(os.devnull, os.O_RDONLY)
_ = os.dup2(null_fd, 0)
os.close(null_fd)

if isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout.reconfigure(line_buffering=True)

from .main import main  # noqa: E402 - must run after the descriptors are split

main(rpc_in_fd, rpc_out_fd, sys.argv[1])
