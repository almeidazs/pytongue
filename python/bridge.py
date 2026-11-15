"""pytongue worker entry point: ``python bridge.py <file.py>``, started by the Node runtime via uv.

The worker itself is the ``pytongue_bridge`` package next to this file (see its ``__main__``).
This directory is on ``sys.path`` while it runs, and holds nothing but this file and that
uniquely named package, so it cannot shadow user modules.
"""

import runpy

if __name__ == "__main__":
    _ = runpy.run_module("pytongue_bridge", run_name="__main__", alter_sys=True)
