# A parameter with a default moves into an optional trailing kwargs object.
def greet(name: str, greeting: str = "hello") -> str:
    return f"{greeting} {name}"
