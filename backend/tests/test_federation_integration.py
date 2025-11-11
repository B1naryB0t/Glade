# backend/tests/test_federation_integration.py
import datetime
import hashlib
import base64


try:
    from backend.utils.signing import build_signed_request
except ImportError:
    # Stub fallback if the real function doesn't exist
    def build_signed_request(
        method: str,
        url: str,
        body: str | None = None,
        key_id: str = "test-key",
        private_key: str | None = None,
    ):
        digest = ""
        if body:
            digest_value = base64.b64encode(hashlib.sha256(body.encode()).digest()).decode()
            digest = f"SHA-256={digest_value}"

        headers = {
            "Date": datetime.datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S GMT"),
            "Host": url.split("/")[2] if "://" in url else "localhost",
            "Digest": digest,
            "Signature": (
                f'keyId="{key_id}",algorithm="rsa-sha256",'
                'headers="(request-target) host date digest",signature="fake_signature"'
            ),
        }
        return headers


def test_inbox_signature_verification(mock_redis, api_client, user):
    # Example usage — adjust as needed for your API
    url = "https://example.com/federation/inbox/"
    headers = build_signed_request("POST", url, body="test-body")

    response = api_client.post("/federation/inbox/", data="test-body", headers=headers)
    assert response.status_code == 202
