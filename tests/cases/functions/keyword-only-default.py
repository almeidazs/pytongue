# A keyword-only parameter with a default is an optional kwargs field.
def render(template: str, *, escape: bool = True) -> str:
    return template
