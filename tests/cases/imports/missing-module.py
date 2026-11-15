# A missing relative module types its names as `unknown`, silently outside strict mode.
from .nowhere import Token


def first(tokens: list[Token]) -> Token:
    return tokens[0]
