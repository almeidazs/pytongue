"""The same three functions behind FastAPI, served by uvicorn and called with fetch."""

from typing import Any

from fastapi import FastAPI

import bench

app = FastAPI()


@app.get("/health")
async def health() -> dict[str, bool]:
    """Answers once the server is ready."""
    return {"ok": True}


@app.post("/add")
async def add(body: dict[str, int]) -> int:
    """Calls `bench.add` with `{a, b}`."""
    return bench.add(body["a"], body["b"])


@app.post("/echo")
async def echo(body: dict[str, Any]) -> dict[str, Any]:
    """Calls `bench.echo` with the JSON body."""
    return bench.echo(body)


@app.post("/cpu")
async def cpu(body: dict[str, int]) -> int:
    """Calls `bench.cpu` with `{n}`."""
    return bench.cpu(body["n"])
