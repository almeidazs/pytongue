# @strict: true
# A missing relative module is pytongue1005 at every use in strict mode.
from .nowhere import Token


def first(token: Token) -> Token:  # E:18 pytongue1005 # E:28 pytongue1005
    return token
