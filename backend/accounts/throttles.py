# backend/accounts/throttles.py
from rest_framework.throttling import AnonRateThrottle


class RegistrationRateThrottle(AnonRateThrottle):
    """
    Throttle for user registration to prevent spam account creation.
    Limits registration attempts per IP address.
    
    Inherits from AnonRateThrottle which automatically skips
    throttling for authenticated users.
    """
    scope = 'registration'
