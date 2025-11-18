import datetime
import hashlib
import base64

def build_signed_request(method: str, url: str, body: str | None = None, key_id: str = "test-key", private_key: str | None = None):
    """
    Minimal mock implementation of a signed request builder.
    Returns headers you'd expect in a signed ActivityPub-style request.
    """
    # Compute a simple digest header for body
    digest = ""
    if body:
        digest_value = base64.b64encode(hashlib.sha256(body.encode()).digest()).decode()
        digest = f"SHA-256={digest_value}"

    headers = {
        "Date": datetime.datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S GMT"),
        "Host": url.split("/")[2],
        "Digest": digest,
        "Signature": f'keyId="{key_id}",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="fake_signature"',
    }
    return headers
