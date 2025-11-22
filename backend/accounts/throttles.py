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
    rate = '1/5min'  # 1 request per 5 minutes
