# backend/accounts/throttles.py
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class RegistrationRateThrottle(AnonRateThrottle):
    """
    Throttle for user registration to prevent spam account creation.
    Limits registration attempts per IP address.
    
    Inherits from AnonRateThrottle which automatically skips
    throttling for authenticated users.
    """
    scope = 'registration'


class ResendVerificationThrottle(UserRateThrottle):
    """
    Throttle for resending verification emails.
    Enforces 5 minute wait between requests.
    """
    scope = 'resend_verification'


class LoginRateThrottle(AnonRateThrottle):
    """
    Throttle for login attempts to prevent brute force attacks.
    Only counts FAILED login attempts, not successful ones.
    Limits to 3 failed attempts per hour per IP.
    """
    scope = 'login'
    
    def allow_request(self, request, view):
        """
        Override to only throttle failed login attempts.
        We check this AFTER the login attempt in the view.
        """
        # For login endpoint, we handle throttling manually in the view
        # to distinguish between successful and failed attempts
        return True


class FollowRateThrottle(UserRateThrottle):
    """
    Throttle for follow/unfollow actions to prevent spam following.
    """
    scope = 'follow'


class CommentRateThrottle(UserRateThrottle):
    """
    Throttle for comment creation to prevent spam.
    """
    scope = 'comment'


class UploadRateThrottle(UserRateThrottle):
    """
    Throttle for file uploads to prevent abuse.
    """
    scope = 'upload'


class SearchRateThrottle(UserRateThrottle):
    """
    Throttle for search requests to prevent scraping.
    """
    scope = 'search'


class FederationInboxThrottle(AnonRateThrottle):
    """
    Throttle for incoming federation activities to prevent DoS.
    """
    scope = 'federation_inbox'
