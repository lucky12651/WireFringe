"""Validate content-based bot categories and category-specific placements."""

from __future__ import annotations


def resolve_category(value: str | None, categories: list[str]) -> str | None:
    """Return the site's canonical category name, never an invented label."""
    name = str(value or "").strip().casefold()
    return next((category for category in categories if category.casefold() == name), None)


def category_is_selected(category: str, sections: list[str]) -> bool:
    if not sections:
        return True
    # Gadgets is part of the Tech desk in the bot's editorial section picker.
    return category in sections or (category == "Gadgets" and "Tech" in sections)


def compatible_section(section_id: str | None, category: str, catalog: dict) -> str | None:
    for section in catalog.get("sections", []):
        if section.get("id") != section_id or not section.get("enabled", True):
            continue
        categories = section.get("categories") or []
        if not categories or category in categories:
            return section_id
    return None
