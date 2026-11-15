# Standard-library types whose JSON form is a string become string.
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from ipaddress import IPv4Address, IPv4Interface, IPv4Network, IPv6Address, IPv6Interface, IPv6Network
from pathlib import Path, PosixPath, PurePath, WindowsPath
from uuid import UUID


def f(
    a: datetime,
    b: date,
    c: time,
    d: timedelta,
    e: UUID,
    f: Decimal,
    g: Path,
    h: PurePath,
    i: PosixPath,
    j: WindowsPath,
    k: IPv4Address,
    l: IPv6Address,
    m: IPv4Network,
    n: IPv6Network,
    o: IPv4Interface,
    p: IPv6Interface,
) -> datetime: ...
