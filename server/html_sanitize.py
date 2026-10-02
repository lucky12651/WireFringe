from __future__ import annotations

import bleach

# Tags the editor and news bot actually emit. Scripts, embeds, and event
# handlers are not in this list, so Bleach drops them.
_ALLOWED_TAGS = [
    "p",
    "br",
    "hr",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "strong",
    "em",
    "b",
    "i",
    "a",
    "img",
    "figure",
    "figcaption",
    "blockquote",
    "pre",
    "code",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "div",
    "span",
    "section",
]

_ALLOWED_ATTRIBUTES = {
    "*": ["class"],
    "a": ["href", "title", "rel", "target"],
    "img": ["src", "alt", "title", "width", "height"],
    "td": ["colspan", "rowspan"],
    "th": ["colspan", "rowspan"],
}


def sanitize_article_html(value: str | None) -> str:
    """Keep article markup and drop anything that can execute in the browser."""
    if not value:
        return ""
    return bleach.clean(
        value,
        tags=_ALLOWED_TAGS,
        attributes=_ALLOWED_ATTRIBUTES,
        protocols=["http", "https", "mailto"],
        strip=True,
    )
