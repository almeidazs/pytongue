# @strict: true
# An unresolved field type is an error in strict mode.
from pydantic import BaseModel


class Report(BaseModel):
    chart: Figure  # E:12 pytongue1005
