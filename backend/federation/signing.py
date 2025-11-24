# backend/federation/signing.py
"""
HTTP Signature utilities for ActivityPub federation.
Consolidates signing/verification from activitypub app.
"""

import base64
import hashlib
import logging
from typing import Callable, Tuple

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

logger = logging.getLogger(__name__)


def digest_payload(body_bytes: bytes) -> str:
    """Return Digest header value for the body."""
    sha256 = hashlib.sha256(body_bytes).digest()
    return "SHA-256=" + base64.b64encode(sha256).decode("ascii")


def sign_bytes_rsa(private_key_pem: bytes, signing_string: bytes) -> str:
    """Sign bytes with RSA-SHA256 and return base64 signature string."""
    private_key = serialization.load_pem_private_key(
        private_key_pem, password=None)
    sig = private_key.sign(signing_string, padding.PKCS1v15(), hashes.SHA256())
    return base64.b64encode(sig).decode("ascii")


def verify_bytes_rsa(
    public_key_pem: bytes, signing_string: bytes, signature_b64: str
) -> bool:
    """Verify RSA-SHA256 signature. Return True if valid."""
    try:
        public_key = serialization.load_pem_public_key(public_key_pem)
        signature = base64.b64decode(signature_b64)
        public_key.verify(
            signature, signing_string, padding.PKCS1v15(), hashes.SHA256()
        )
        return True
    except InvalidSignature:
        return False
    except Exception as e:
        logger.error(f"Signature verification error: {e}")
        return False


def build_signing_string(headers: dict) -> bytes:
    """
    Build the signing string for headers.
    Includes: (request-target), host, date, digest if present.
    """
    pieces = []
    if "(request-target)" in headers:
        pieces.append(f"(request-target): {headers['(request-target)']}")
    if "host" in headers:
        pieces.append(f"host: {headers['host']}")
    if "date" in headers:
        pieces.append(f"date: {headers['date']}")
    if "digest" in headers:
        pieces.append(f"digest: {headers['digest']}")
    return "\n".join(pieces).encode("utf-8")


def sign_request(
    private_key_pem: bytes,
    key_id: str,
    method: str,
    path: str,
    host: str,
    body: bytes,
    date: str,
) -> dict:
    """
    Produce headers: Date, Digest, Signature for an outbound HTTP request.
    Returns headers dict to attach to the request.
    """
    headers = {
        "(request-target)": f"{method.lower()} {path}",
        "host": host,
        "date": date,
    }
    
    # Only include digest for requests with body (POST, PUT, etc.)
    result_headers = {
        "Date": date,
    }
    
    if body:
        digest = digest_payload(body)
        headers["digest"] = digest
        result_headers["Digest"] = digest
        headers_list = "(request-target) host date digest"
    else:
        headers_list = "(request-target) host date"
    
    signing_string = build_signing_string(headers)
    signature_b64 = sign_bytes_rsa(private_key_pem, signing_string)
    
    sig_header = (
        f'keyId="{key_id}",'
        f'algorithm="rsa-sha256",'
        f'headers="{headers_list}",'
        f'signature="{signature_b64}"'
    )
    result_headers["Signature"] = sig_header
    
    return result_headers


def verify_request_signature(
    request_headers: dict,
    method: str,
    path: str,
    body: bytes,
    public_key_lookup_fn: Callable[[str], bytes],
) -> Tuple[bool, str]:
    """
    Verify an incoming request signature.
    - request_headers: dict-like (keys lowercased)
    - method: HTTP method (POST, GET, etc.)
    - path: request path
    - body: request body bytes
    - public_key_lookup_fn: function(keyId) -> public_key_pem bytes or None
    Returns (True/False, reason)
    """
    sig_header = request_headers.get(
        "signature") or request_headers.get("Signature")
    if not sig_header:
        return False, "no signature header"

    # Parse signature header
    parts = {}
    for part in sig_header.split(","):
        if "=" in part:
            k, v = part.strip().split("=", 1)
            parts[k] = v.strip().strip('"')

    key_id = parts.get("keyId")
    signature_b64 = parts.get("signature")
    headers_list = parts.get("headers", "(request-target) host date").split()
    
    if not key_id or not signature_b64:
        return False, "invalid signature header"

    # Build signing string using the headers specified in the signature
    headers_to_use = {}
    
    for header_name in headers_list:
        if header_name == "(request-target)":
            headers_to_use["(request-target)"] = f"{method.lower()} {path}"
        else:
            # Look up the header value (case-insensitive)
            header_value = request_headers.get(header_name.lower())
            if header_value:
                headers_to_use[header_name.lower()] = header_value
            else:
                # Header specified in signature but not present in request
                logger.warning(f"Header '{header_name}' specified in signature but not found in request")

    # Build signing string in the order specified
    signing_parts = []
    for header_name in headers_list:
        header_key = header_name.lower()
        if header_key in headers_to_use:
            signing_parts.append(f"{header_key}: {headers_to_use[header_key]}")
    
    signing_string = "\n".join(signing_parts).encode("utf-8")

    # Get public key
    public_key_pem = public_key_lookup_fn(key_id)
    if not public_key_pem:
        return False, "unknown keyId"

    # Verify
    ok = verify_bytes_rsa(public_key_pem, signing_string, signature_b64)
    return (ok, "verified" if ok else "invalid signature")
