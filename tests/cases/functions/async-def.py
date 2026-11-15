# An async def emits the same Promise signature as a plain def.
async def fetch(url: str) -> str:
    return url
