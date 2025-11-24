# backend/privacy/middleware.py
import time

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse


class PrivacyMiddleware:
    """Middleware for privacy and rate limiting"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Apply rate limiting
        if not self._check_rate_limit(request):
            return JsonResponse({"error": "Rate limit exceeded"}, status=429)

        response = self.get_response(request)

        # Add privacy headers
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"] = "DENY"
        response["X-XSS-Protection"] = "1; mode=block"
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"

        return response

    @staticmethod
    def _check_rate_limit(request):
        """
        Global rate limiting as a safety net.
        Note: Most endpoints should use DRF throttling for more granular control.
        This catches any endpoints that don't have specific throttling.
        """
        # Skip for static files and media
        if request.path.startswith('/static/') or request.path.startswith('/media/'):
            return True
        
        # Get client IP
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            # Take the last IP in the chain (most trustworthy in reverse proxy setup)
            ip = x_forwarded_for.split(",")[-1].strip()
        else:
            ip = request.META.get("REMOTE_ADDR")

        # Global rate limit: 200 requests per minute per IP (safety net)
        # Individual endpoints have stricter limits via DRF throttling
        key = f"global_rate_limit:{ip}"
        current = cache.get(key, 0)

        if current >= 200:
            return False

        cache.set(key, current + 1, 60)  # 60 seconds
        return True
