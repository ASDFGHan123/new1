from .models_notification import Notification


def send_notification(user, notification_type, title, message, data=None):
    """Send a notification to a user."""
    return Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        data=data or {}
    )


def send_bulk_notification(users, notification_type, title, message, data=None):
    """Send notification to multiple users."""
    notifications = [
        Notification(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            data=data or {}
        )
        for user in users
    ]
    return Notification.objects.bulk_create(notifications)
