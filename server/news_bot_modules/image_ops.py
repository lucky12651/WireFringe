from __future__ import annotations

import hashlib
import logging
import re
from io import BytesIO
from pathlib import Path
from urllib.parse import urljoin, urlparse

import httpx
from ..config import settings

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    Image = None

logger = logging.getLogger(__name__)

JUNK_RE = re.compile(
    r"logo|icon|favicon|sprite|banner|award|shop-now|apple-touch|placeholder|"
    r"default[-_]?image|brand|watermark|pixel|1x1|spacer|avatar|profile|"
    r"share|whatsapp|facebook|twitter-card-default|og-default",
    re.I,
)
MIN_BYTES = 8_000
MIN_SIDE = 240


def _uploads_dir() -> Path:
    path = Path(settings.uploads_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def is_junk_image_url(url: str | None) -> bool:
    if not url:
        return True
    raw = str(url).strip()
    if not raw.startswith(("http://", "https://", "/")):
        return True
    path = urlparse(raw).path or raw
    if JUNK_RE.search(raw) or JUNK_RE.search(path):
        return True
    if raw.lower().endswith((".svg", ".gif", ".ico")):
        return True
    return False


def collect_html_images(html: str, base_url: str) -> list[str]:
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html or "", "html.parser")
    found: list[str] = []

    def add(raw: str | None) -> None:
        if not raw:
            return
        url = urljoin(base_url, raw.strip())
        if url and url not in found:
            found.append(url)

    for key in ("og:image", "og:image:url", "twitter:image", "twitter:image:src"):
        tag = soup.find("meta", property=key) or soup.find("meta", attrs={"name": key})
        if tag:
            add(tag.get("content"))

    for img in soup.select("article img, main img, .article-content img, .story-image img, figure img"):
        add(img.get("data-src") or img.get("data-original") or img.get("src"))

    return [u for u in found if not is_junk_image_url(u)]


def already_used(db, url: str) -> bool:
    from ..models import Post

    if not url:
        return False
    return db.query(Post.id).filter(Post.og_img == url).first() is not None


def save_image_bytes(data: bytes, hint: str = "img") -> str | None:
    if not data or len(data) < MIN_BYTES:
        return None
    suffix = ".jpg"
    if data.startswith(b"\x89PNG"):
        suffix = ".png"
    elif data.startswith(b"RIFF") and b"WEBP" in data[:16]:
        suffix = ".webp"
    elif data.startswith(b"\xff\xd8"):
        suffix = ".jpg"
    else:
        return None

    if Image is not None:
        try:
            with Image.open(BytesIO(data)) as im:
                w, h = im.size
                if min(w, h) < MIN_SIDE:
                    return None
        except Exception:
            logger.info("Could not inspect image dimensions; saving by magic bytes.")

    digest = hashlib.sha256(data).hexdigest()[:16]
    name = f"{re.sub(r'[^a-z0-9]+', '-', hint.lower())[:28].strip('-') or 'img'}-{digest}{suffix}"
    dest = _uploads_dir() / name
    if not dest.exists():
        dest.write_bytes(data)
    return f"/static/uploads/{name}"


async def download_image(http_client: httpx.AsyncClient, url: str) -> bytes | None:
    try:
        res = await http_client.get(
            url,
            timeout=20.0,
            follow_redirects=True,
            headers={"Accept": "image/avif,image/webp,image/*,*/*;q=0.8"},
        )
        res.raise_for_status()
        ctype = (res.headers.get("content-type") or "").lower()
        if "image" not in ctype and not url.lower().split("?")[0].endswith(
            (".jpg", ".jpeg", ".png", ".webp")
        ):
            return None
        return res.content
    except Exception as exc:
        logger.info("Image download failed %s: %s", url, exc)
        return None


async def resolve_story_image(
    db,
    *,
    candidates: list[str | None],
    title: str,
    category: str,
    http_client: httpx.AsyncClient,
    unique: str = "",
) -> str:
    seen: set[str] = set()
    for raw in candidates:
        url = (raw or "").strip()
        if not url or url in seen or is_junk_image_url(url):
            continue
        seen.add(url)
        if already_used(db, url):
            continue
        data = await download_image(http_client, url)
        saved = save_image_bytes(data or b"", hint=title[:24]) if data else None
        if saved and not already_used(db, saved):
            logger.info("Saved unique story image %s", saved)
            return saved
        # Keep a remote photo rather than dropping the whole story.
        if data and len(data) >= MIN_BYTES and not already_used(db, url):
            logger.info("Using remote story image %s", url)
            return url

    first_remote = next((u for u in seen if u.startswith(("http://", "https://"))), "")
    if first_remote:
        logger.info("Falling back to candidate image URL for %r", title[:80])
        return first_remote

    logger.info("No photo candidates for %r", title[:80])
    return None
