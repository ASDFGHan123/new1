"""
Custom exceptions for users app.
"""


class UserManagementError(Exception):
    """Base exception for user management operations."""
    pass


class UserNotFoundError(UserManagementError):
    """Raised when a user is not found."""
    pass


class UserAlreadyExistsError(UserManagementError):
    """Raised when trying to create a user that already exists."""
    pass


class InvalidUserStatusError(UserManagementError):
    """Raised when an invalid user status is provided."""
    pass


class InvalidUserRoleError(UserManagementError):
    """Raised when an invalid user role is provided."""
    pass


class UserApprovalError(UserManagementError):
    """Raised when user approval fails."""
    pass


class UserSuspensionError(UserManagementError):
    """Raised when user suspension fails."""
    pass


class UserBanError(UserManagementError):
    """Raised when user banning fails."""
    pass


class UserActivationError(UserManagementError):
    """Raised when user activation fails."""
    pass


class IPTrackingError(Exception):
    """Base exception for IP tracking operations."""
    pass


class SuspiciousActivityError(IPTrackingError):
    """Raised when suspicious activity is detected."""
    pass


class IPBlockedError(IPTrackingError):
    """Raised when an IP address is blocked."""
    pass


class RateLimitError(Exception):
    """Base exception for rate limiting operations."""
    pass


class RateLimitExceededError(RateLimitError):
    """Raised when rate limit is exceeded."""
    pass


class AbuseDetectionError(Exception):
    """Raised when abuse is detected."""
    pass