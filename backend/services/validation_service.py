# backend/services/validation_service.py
import re
from io import BytesIO

import bleach
from django.core.exceptions import ValidationError
from django.core.validators import URLValidator
from PIL import Image


class InputValidationService:
    """Service for validating and sanitizing user inputs"""

    # Allowed HTML tags for rich text (very limited)
    ALLOWED_TAGS = ["p", "br", "strong", "em", "a", "ul", "ol", "li"]
    ALLOWED_ATTRIBUTES = {"a": ["href", "title"]}
    ALLOWED_PROTOCOLS = ["http", "https"]

    # Field length limits
    MAX_USERNAME_LENGTH = 50
    MAX_DISPLAY_NAME_LENGTH = 100
    MAX_BIO_LENGTH = 500
    MAX_POST_LENGTH = 5000
    MAX_CONTENT_WARNING_LENGTH = 200

    # File upload limits
    MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5MB
    ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    MAX_IMAGE_DIMENSIONS = (4096, 4096)

    @staticmethod
    def sanitize_html(text):
        """Sanitize HTML content, removing dangerous tags"""
        if not text:
            return text

        return bleach.clean(
            text,
            tags=InputValidationService.ALLOWED_TAGS,
            attributes=InputValidationService.ALLOWED_ATTRIBUTES,
            protocols=InputValidationService.ALLOWED_PROTOCOLS,
            strip=True,
        )

    @staticmethod
    def sanitize_plain_text(text):
        """Sanitize plain text, removing all HTML"""
        if not text:
            return text

        return bleach.clean(text, tags=[], strip=True)

    @staticmethod
    def validate_username(username):
        """Validate username format"""
        if not username:
            raise ValidationError("Username is required")

        if len(username) > InputValidationService.MAX_USERNAME_LENGTH:
            raise ValidationError(
                f"Username must be less than {InputValidationService.MAX_USERNAME_LENGTH} characters"
            )

        # Only allow alphanumeric, underscore, and hyphen
        if not re.match(r"^[a-zA-Z0-9_-]+$", username):
            raise ValidationError(
                "Username can only contain letters, numbers, underscores, and hyphens"
            )

        # Must start with a letter or number
        if not re.match(r"^[a-zA-Z0-9]", username):
            raise ValidationError("Username must start with a letter or number")

        return username.lower()

    @staticmethod
    def validate_display_name(display_name):
        """Validate and sanitize display name"""
        if not display_name:
            return display_name

        display_name = InputValidationService.sanitize_plain_text(display_name)

        if len(display_name) > InputValidationService.MAX_DISPLAY_NAME_LENGTH:
            raise ValidationError(
                f"Display name must be less than {InputValidationService.MAX_DISPLAY_NAME_LENGTH} characters"
            )

        return display_name.strip()

    @staticmethod
    def validate_bio(bio):
        """Validate and sanitize bio"""
        if not bio:
            return bio

        bio = InputValidationService.sanitize_plain_text(bio)

        if len(bio) > InputValidationService.MAX_BIO_LENGTH:
            raise ValidationError(
                f"Bio must be less than {InputValidationService.MAX_BIO_LENGTH} characters"
            )

        return bio.strip()

    @staticmethod
    def validate_post_content(content):
        """Validate post content"""
        if not content:
            raise ValidationError("Post content is required")

        content = InputValidationService.sanitize_plain_text(content)

        if len(content) > InputValidationService.MAX_POST_LENGTH:
            raise ValidationError(
                f"Post must be less than {InputValidationService.MAX_POST_LENGTH} characters"
            )

        return content.strip()

    @staticmethod
    def validate_image_file(image_file, max_size=None, is_avatar=False):
        """Validate uploaded image file"""
        if max_size is None:
            max_size = (
                InputValidationService.MAX_AVATAR_SIZE
                if is_avatar
                else InputValidationService.MAX_IMAGE_SIZE
            )

        # Check file size
        if image_file.size > max_size:
            raise ValidationError(
                f"File size must be less than {max_size / (1024 * 1024):.1f}MB"
            )

        # Check content type
        if image_file.content_type not in InputValidationService.ALLOWED_IMAGE_TYPES:
            raise ValidationError(
                f"File type must be one of: {', '.join(InputValidationService.ALLOWED_IMAGE_TYPES)}"
            )

        # Validate actual image content
        try:
            image = Image.open(image_file)
            image.verify()

            # Re-open after verify (verify closes the file)
            image_file.seek(0)
            image = Image.open(image_file)

            # Check dimensions
            if (
                image.width > InputValidationService.MAX_IMAGE_DIMENSIONS[0]
                or image.height > InputValidationService.MAX_IMAGE_DIMENSIONS[1]
            ):
                raise ValidationError(
                    f"Image dimensions must be less than {InputValidationService.MAX_IMAGE_DIMENSIONS[0]}x{InputValidationService.MAX_IMAGE_DIMENSIONS[1]}"
                )

            # Reset file pointer
            image_file.seek(0)

        except Exception as e:
            raise ValidationError(f"Invalid image file: {str(e)}")

        return True

    @staticmethod
    def validate_url(url):
        """Validate URL format"""
        if not url:
            return url

        validator = URLValidator()
        try:
            validator(url)
            return url
        except ValidationError:
            raise ValidationError("Invalid URL format")


class RateLimitService:
    """Service for rate limiting operations"""

    @staticmethod
    def check_rate_limit(user, action, limit=10, window=60):
        """Check if user has exceeded rate limit for an action"""
        from django.core.cache import cache

        key = f"rate_limit:{user.id}:{action}"
        current = cache.get(key, 0)

        if current >= limit:
            return False

        cache.set(key, current + 1, window)
        return True
