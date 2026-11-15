"""import_user_module: relative imports must work as the content mapper resolves them."""

import sys
from collections.abc import Callable
from pathlib import Path

from pytongue_bridge.importer import import_user_module


def test_plain_file_gets_a_synthetic_package(
    write_module: Callable[[str, str], Path],
) -> None:
    path = write_module("solo.py", "VALUE = 41 + 1\n")
    module = import_user_module(str(path))

    assert module.VALUE == 42  # type: ignore[attr-defined]
    assert module.__name__.startswith("_pytongue_")
    assert module.__name__.endswith(".solo")
    assert str(path.parent) not in sys.path


def test_relative_import_between_sibling_files(
    write_module: Callable[[str, str], Path],
) -> None:
    _ = write_module("helpers.py", "def double(x: int) -> int:\n    return x * 2\n")
    path = write_module("main.py", "from .helpers import double\n\nRESULT = double(21)\n")

    assert import_user_module(str(path)).RESULT == 42  # type: ignore[attr-defined]


def test_two_files_of_one_directory_share_the_package(
    write_module: Callable[[str, str], Path],
) -> None:
    first = write_module("a.py", "from . import b\n\nB = b\n")
    _ = write_module("b.py", "X = 1\n")
    second = write_module("b.py", "X = 1\n")

    a = import_user_module(str(first))
    b = import_user_module(str(second))

    assert a.__package__ == b.__package__
    assert a.B is b  # type: ignore[attr-defined]


def test_real_package_is_imported_by_dotted_name(
    write_module: Callable[[str, str], Path],
) -> None:
    _ = write_module("pkg/__init__.py", "")
    _ = write_module("pkg/lib.py", "NAME = 'lib'\n")
    path = write_module("pkg/mod.py", "from .lib import NAME\n\nGOT = NAME\n")

    module = import_user_module(str(path))

    assert module.__name__ == "pkg.mod"
    assert module.GOT == "lib"  # type: ignore[attr-defined]


def test_nested_packages_walk_up_to_the_root(
    write_module: Callable[[str, str], Path],
) -> None:
    _ = write_module("top/__init__.py", "")
    _ = write_module("top/sub/__init__.py", "")
    _ = write_module("top/sub/leaf.py", "from .. import SENTINEL\n")
    _ = write_module("top/__init__.py", "SENTINEL = 7\n")
    path = write_module("top/sub/leaf2.py", "from ..sub import leaf\n\nOK = leaf.SENTINEL\n")

    module = import_user_module(str(path))

    assert module.__name__ == "top.sub.leaf2"
    assert module.OK == 7  # type: ignore[attr-defined]


def test_the_package_init_itself(write_module: Callable[[str, str], Path]) -> None:
    path = write_module("solo_pkg/__init__.py", "FLAG = True\n")

    module = import_user_module(str(path))

    assert module.__name__ == "solo_pkg"
    assert module.FLAG is True  # type: ignore[attr-defined]


def test_import_errors_propagate(write_module: Callable[[str, str], Path]) -> None:
    import pytest

    path = write_module("broken.py", "import definitely_not_a_real_module_xyz\n")

    with pytest.raises(ModuleNotFoundError):
        _ = import_user_module(str(path))
