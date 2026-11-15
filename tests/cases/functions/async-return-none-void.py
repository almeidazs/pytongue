# `-> None` on an async def also becomes Promise<void>.
async def notify(user_id: str) -> None:
    pass
