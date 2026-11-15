# Strict: types from third-party packages are reported with the package code.
# @strict: true
import numpy as np
import pandas as pd
from numpy.typing import NDArray
from sqlalchemy.orm import Session


def f(
    a: np.ndarray,  # E:8 pytongue1004
    b: pd.Series[int],  # E:8 pytongue1004
    c: NDArray,  # E:8 pytongue1004
    d: Session,  # E:8 pytongue1004
) -> None: ...
