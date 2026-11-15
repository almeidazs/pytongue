# should not generate diagnostics
# Outside strict mode, unknowns only get a hover note, never a diagnostic.
import numpy as np


def f(x, data: bytes, arr: np.ndarray, other: Ghost):
    return x
