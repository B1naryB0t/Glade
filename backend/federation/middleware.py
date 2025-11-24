# backend/federation/middleware.py
"""
Middleware for ActivityPub content negotiation.
"""
import logging

from django.http import JsonResponse

logger = logging.getLogger(__name__)


class ActivityPubMiddleware:
    """
    Middleware to handle ActivityPub content negotiation.
    Ensures proper Accept headers are handled for federation endpoints.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check if this is an ActivityPub request
        accept = request.META.get("HTTP_ACCEPT", "")
        is_activitypub = (
            "application/activity+json" in accept or "application/ld+json" in accept
        )

        # Add flag to request
        request.is_activitypub = is_activitypub

        response = self.get_response(request)

        # Add ActivityPub headers to federation endpoints
        if request.path.startswith(("/users/", "/.well-known/", "/nodeinfo/")):
            if is_activitypub and hasattr(response, "content_type"):
                if "json" in response.get("Content-Type", ""):
                    response["Content-Type"] = "application/activity+json"

        return response
