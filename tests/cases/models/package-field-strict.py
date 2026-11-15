# @strict: true
# A field typed with a third-party package type is an error in strict mode.
import numpy as np
from pydantic import BaseModel


class Sample(BaseModel):
    data: np.ndarray  # E:11 pytongue1004
