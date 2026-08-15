from server.identity import is_email, normalize_login_email
from server.services.newsroom_service import SECTIONS


def test_email_helper():
    assert is_email("team@wirefringe.com")
    assert not is_email("wirefringe")
    assert normalize_login_email("  A@B.co  ") == "a@b.co"


def test_sections_exist():
    assert "tech" in SECTIONS
    assert "india" in SECTIONS
