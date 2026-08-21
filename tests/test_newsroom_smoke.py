from server.identity import is_email, normalize_login_email
from server.services.newsroom_service import SECTIONS
from server.services.post_service import (
    DEFAULT_POST_DESIGN,
    POST_DESIGNS,
    normalize_post_design,
    random_post_design,
)


def test_email_helper():
    assert is_email("team@wirefringe.com")
    assert not is_email("wirefringe")
    assert normalize_login_email("  A@B.co  ") == "a@b.co"


def test_sections_exist():
    assert "tech" in SECTIONS
    assert "india" in SECTIONS


def test_post_designs():
    assert POST_DESIGNS == ("magazine", "split", "banner", "dark")
    assert normalize_post_design(None) == DEFAULT_POST_DESIGN
    assert normalize_post_design("DARK") == "dark"
    assert normalize_post_design("nope") == "magazine"
    assert random_post_design() in POST_DESIGNS
