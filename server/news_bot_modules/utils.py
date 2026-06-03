import base64
import logging
import re
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

logger = logging.getLogger(__name__)


def clean_url(url: str) -> str:
    """Remove common tracking parameters from URL."""
    try:
        parsed = urlparse(url)
        q_params = parse_qsl(parsed.query)
        clean_params = [
            (k, v) for k, v in q_params
            if not k.startswith('utm_')
            and k not in ['ref', 'source', 'feedburner', 'oc']
        ]
        return urlunparse(parsed._replace(query=urlencode(clean_params)))
    except Exception:
        return url


def extract_clean_url(google_url: str) -> str:
    """
    Decodes complex modern Google News tracking tokens down to the original URL
    by parsing binary payload strings directly to prevent redirect trapping.
    """
    try:
        if "articles/" in google_url:
            base64_str = google_url.split("articles/")[1].split("?")[0]
            base64_str += "=" * (-len(base64_str) % 4)
            decoded_bytes = base64.urlsafe_b64decode(base64_str)

            urls = re.findall(r'https?://[^\s\x00-\x1f\x7f-\xff"\'><()]+', decoded_bytes.decode('latin-1', errors='ignore'))
            for url in urls:
                clean_url = re.split(r'[\x00-\x1f\x7f-\xff\s"\'><()]', url)[0]
                if "google.com" not in clean_url and len(clean_url) > 12:
                    logger.info(f"🎯 Structural Extraction Success: Found destination link -> {clean_url}")
                    return clean_url
    except Exception as e:
        logger.debug(f"Protobuf binary extraction fallback skipped: {e}")
    return google_url
