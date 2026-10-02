from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urljoin, urlparse

import httpx

MAX_REDIRECTS = 5


class UnsafeUrlError(ValueError):
    """The URL is missing, credentialed, or not a public http(s) address."""


def _blocked_ip(value: str) -> bool:
    text = (value or "").split("%", 1)[0]
    try:
        addr = ipaddress.ip_address(text)
    except ValueError:
        return True
    return bool(
        addr.is_private
        or addr.is_loopback
        or addr.is_link_local
        or addr.is_multicast
        or addr.is_reserved
        or addr.is_unspecified
    )


def _parsed_host(url: str):
    raw = (url or "").strip()
    parsed = urlparse(raw)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise UnsafeUrlError("URL must be http or https")
    if parsed.username or parsed.password:
        raise UnsafeUrlError("URL credentials are not allowed")
    return raw, parsed


def public_url_syntax_ok(url: str) -> bool:
    """Cheap check used before a URL is stored. DNS is checked at fetch time."""
    try:
        _raw, parsed = _parsed_host(url)
    except UnsafeUrlError:
        return False
    try:
        ip = ipaddress.ip_address(parsed.hostname)
    except ValueError:
        return True
    return not _blocked_ip(str(ip))


def assert_public_http_url(url: str) -> str:
    """Return the URL when every resolved address is a public http(s) host."""
    raw, parsed = _parsed_host(url)
    host = parsed.hostname
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    try:
        literal = ipaddress.ip_address(host)
        addresses = [str(literal)]
    except ValueError:
        try:
            infos = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
        except socket.gaierror as exc:
            raise UnsafeUrlError("URL host did not resolve") from exc
        addresses = [item[4][0] for item in infos if item[4]]
    if not addresses or any(_blocked_ip(addr) for addr in addresses):
        raise UnsafeUrlError("URL host is not public")
    return raw


async def fetch_public(
    client: httpx.AsyncClient,
    url: str,
    *,
    headers: dict | None = None,
    timeout: float = 20.0,
    max_bytes: int = 2_000_000,
) -> tuple[str, bytes, str]:
    """GET a public URL, checking each redirect, and stop past max_bytes."""
    current = assert_public_http_url(url)
    for _ in range(MAX_REDIRECTS + 1):
        async with client.stream(
            "GET",
            current,
            headers=headers,
            timeout=timeout,
            follow_redirects=False,
        ) as response:
            if response.status_code in {301, 302, 303, 307, 308}:
                location = (response.headers.get("location") or "").strip()
                if not location:
                    raise UnsafeUrlError("Redirect missing location")
                current = assert_public_http_url(urljoin(current, location))
                continue
            response.raise_for_status()
            declared = response.headers.get("content-length")
            if declared and declared.isdigit() and int(declared) > max_bytes:
                raise UnsafeUrlError("Response is too large")
            buf = bytearray()
            async for chunk in response.aiter_bytes():
                if len(buf) + len(chunk) > max_bytes:
                    raise UnsafeUrlError("Response is too large")
                buf.extend(chunk)
            ctype = (response.headers.get("content-type") or "").split(";", 1)[0].strip().lower()
            return current, bytes(buf), ctype
    raise UnsafeUrlError("Too many redirects")
