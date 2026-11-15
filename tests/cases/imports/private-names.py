# Without `__all__`, names starting with `_` are not exported (classes stay on the surface).
from pydantic import BaseModel


class _Draft(BaseModel):
    text: str


class Note(BaseModel):
    text: str


def _normalize(draft: _Draft) -> Note:
    return Note(text=draft.text)


def publish(note: Note) -> str:
    return note.text
