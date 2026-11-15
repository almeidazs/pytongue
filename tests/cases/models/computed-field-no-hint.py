# @strict: true
# A computed field without a return hint is `unknown`, an error in strict mode.
from pydantic import BaseModel, computed_field


class Rect(BaseModel):
    width: float

    @computed_field
    @property
    def double(self):  # E:9 pytongue1002
        return self.width * 2
