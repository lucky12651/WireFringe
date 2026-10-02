import socket

import pytest
from fastapi import HTTPException

from server.core.config import settings
from server.security.html import sanitize_article_html
from server.services.newsroom_service import NewsroomService, _norm_path, public_auth_link
from server.services.post_service import clamp_author_status
from server.security.urls import UnsafeUrlError, assert_public_http_url, public_url_syntax_ok


def test_author_cannot_publish_or_schedule():
    assert clamp_author_status("published") == "review"
    assert clamp_author_status("scheduled") == "review"
    assert clamp_author_status("draft") == "draft"
    assert clamp_author_status("review") == "review"
    assert clamp_author_status("scheduled", "published") == "published"


def test_redirect_paths_stay_on_site():
    assert _norm_path("post/hello") == "/post/hello"
    assert _norm_path("/section/tech") == "/section/tech"
    for bad in ("//evil.com", "/%2f%2fevil.com", "/https://evil.com", "/foo\\bar"):
        with pytest.raises(HTTPException):
            _norm_path(bad)


def test_article_html_strips_active_content():
    raw = (
        '<p class="lede">Hi</p>'
        '<script>alert(1)</script>'
        '<a href="https://example.com/story" class="x">link</a>'
        '<img src="https://cdn.example.com/a.jpg" alt="A">'
        '<img src="javascript:alert(1)" alt="bad">'
        '<p onclick="alert(1)">There</p>'
    )
    cleaned = sanitize_article_html(raw)
    assert "<p" in cleaned and "Hi" in cleaned
    assert "https://example.com/story" in cleaned
    assert "https://cdn.example.com/a.jpg" in cleaned
    assert "<script" not in cleaned.lower()
    assert "onclick" not in cleaned.lower()
    assert "javascript:" not in cleaned.lower()


def test_public_urls_reject_private_targets(monkeypatch):
    def public_dns(host, port, *args, **kwargs):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", port))]

    monkeypatch.setattr("server.security.urls.socket.getaddrinfo", public_dns)
    assert assert_public_http_url("https://example.com/rss.xml") == "https://example.com/rss.xml"
    assert public_url_syntax_ok("https://example.com/rss.xml")

    for blocked in (
        "http://127.0.0.1/latest",
        "http://10.1.2.3/admin",
        "http://192.168.1.5/",
        "http://169.254.169.254/latest/meta-data",
        "https://user:pass@example.com/rss",
        "file:///etc/passwd",
    ):
        with pytest.raises(UnsafeUrlError):
            assert_public_http_url(blocked)

    def mixed_dns(host, port, *args, **kwargs):
        return [
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", port)),
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("127.0.0.1", port)),
        ]

    monkeypatch.setattr("server.security.urls.socket.getaddrinfo", mixed_dns)
    with pytest.raises(UnsafeUrlError):
        assert_public_http_url("https://example.com/feed")


def test_auth_links_are_hidden_unless_dev_flag(monkeypatch):
    link = "http://127.0.0.1:3000/reset-password?token=secret-token"
    monkeypatch.setattr(settings, "dev_return_auth_links", False)
    hidden = public_auth_link(link, "resetUrl")
    assert hidden == {"ok": True}
    assert "secret-token" not in str(hidden)

    monkeypatch.setattr(settings, "dev_return_auth_links", True)
    shown = public_auth_link(link, "resetUrl")
    assert shown["resetUrl"] == link


class _FakeDb:
    def __init__(self):
        self.executed = []
        self.added = []

    def execute(self, stmt):
        self.executed.append(stmt)
        return self

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        return None


def test_issue_token_retires_older_unused_tokens():
    db = _FakeDb()
    token = NewsroomService(db).issue_token(7, "reset", hours=2)
    assert token
    assert len(db.executed) == 1
    compiled = str(db.executed[0].compile(compile_kwargs={"literal_binds": True}))
    assert "used_at" in compiled
    assert "reset" in compiled
    issued = db.added[0]
    assert issued.user_id == 7
    assert issued.purpose == "reset"
    assert issued.used_at is None
    assert issued.token == token
