"""Writes random but valid Python files with pysource-codegen: generate.py <seed> <count> <dir>."""

import sys
import warnings

from pysource_codegen import generate

warnings.simplefilter("ignore")
seed, count, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]

for index in range(count):
    with open(f"{out}/gen{index}.py", "w", encoding="utf-8") as file:
        _ = file.write(generate(seed + index))
