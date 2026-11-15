"""Importing the user module so relative imports work the way the content mapper resolves them."""

import hashlib
import importlib
import os
import sys
import types


def import_user_module(path: str) -> types.ModuleType:
    """Imports a Python file as part of a package.

    A directory with ``__init__.py`` is a real package: walk up to its root and import by dotted
    name. Otherwise a synthetic package whose ``__path__`` is the directory is registered, so
    relative imports still resolve without putting the directory on ``sys.path``.

    Args:
        path: The file's path.

    Returns:
        The imported module.
    """
    path = os.path.abspath(path)
    directory = os.path.dirname(path)
    stem = os.path.splitext(os.path.basename(path))[0]
    if os.path.exists(os.path.join(directory, "__init__.py")):
        return _import_from_package(directory, stem)
    name = "_pytongue_" + hashlib.sha1(directory.encode("utf-8")).hexdigest()[:12]
    if name not in sys.modules:
        package = types.ModuleType(name)
        package.__path__ = [directory]
        package.__package__ = name
        package.__file__ = None
        sys.modules[name] = package
    return importlib.import_module(f"{name}.{stem}")


def _import_from_package(directory: str, stem: str) -> types.ModuleType:
    """Imports a module of a real package by its dotted name.

    Args:
        directory: The module's directory, which holds an ``__init__.py``.
        stem: The module's file name without ``.py`` (``__init__`` for the package itself).

    Returns:
        The imported module.
    """
    parts = [] if stem == "__init__" else [stem]
    root = directory
    while True:
        parts.insert(0, os.path.basename(root))
        parent = os.path.dirname(root)
        if parent == root or not os.path.exists(os.path.join(parent, "__init__.py")):
            break
        root = parent
    sys.path.insert(0, os.path.dirname(root))
    return importlib.import_module(".".join(parts))
