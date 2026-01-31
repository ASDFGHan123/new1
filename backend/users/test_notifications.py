"""
Comprehensive test suite for the notification system.
"""
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from users.models_notification import Notification
from users.notification_utils import send_notification, send_bulk_notification
from users.notification_tasks import send_notification_async, cleanup_old_notifications
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class NotificationModelTests(TestCase):
    """Test Notification model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_notification(self):
        """Test creating a notification."""
        notification = Notification.objects.create(
            user=self.user,
            notification_type='message',
            title='Test Notification',
            message='This is a test notification'
        )
        self.assertEqual(notification.user, self.user)
        self.assertEqual(notification.notification_type, 'message')
        self.assertFalse(notification.is_read)
    
    def test_mark_as_read(self):
        """Test marking notification as read."""
        notification = Notification.objects.create(
            user=self.user,
            notification_type='system',
            title='Test',
            message='Test message'
        )
        self.assertFalse(notification.is_read)
        notification.mark_as_read()
        self.assertTrue(notification.is_read)
    
    def test_notification_ordering(self):
        """Test notifications are ordered by creation date."""
        notif1 = Notification.objects.create(
            user=self.user,
            notification_type='system',
            title='First',
            message='First notification'
        )
        notif2 = Notification.objects.create(
            user=self.user,
            notification_type='system',
            title='Second',
            message='Second notification'
        )
        notifications = Notification.objects.filter(user=self.user)
        self.assertEqual(notifications[0].id, notif2.id)
        self.assertEqual(notifications[1].id, notif1.id)


class NotificationUtilsTests(TestCase):
    """Test notification utility functions."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_send_notification(self):
        """Test sending a single notification."""
        notification = send_notification(
            user=self.user,
            notification_type='message',
            title='Test',
            message='Test message'
        )
        self.assertIsNotNone(notification)
        self.assertEqual(notification.user, self.user)
        self.assertEqual(notification.title, 'Test')
    
    def test_send_bulk_notification(self):
        """Test sending bulk notifications."""
        user2 = User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpass123'
        )
        users = [self.user, user2]
        notifications = send_bulk_notification(
            users=users,
            notification_type='system',
            title='Bulk Test',
            message='Bulk notification'
        )
        self.assertEqual(len(notifications), 2)
        self.assertEqual(Notification.objects.filter(title='Bulk Test').count(), 2)
    
    def test_send_notification_with_data(self):
        """Test sending notification with custom data."""
        data = {'user_id': 123, 'action': 'login'}
        notification = send_notification(
            user=self.user,
            notification_type='system',
            title='Test',
            message='Test',
            data=data
        )
        self.assertEqual(notification.data, data)


class NotificationViewSetTests(APITestCase):
    """Test NotificationViewSet API endpoints."""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create test notifications
        self.notif1 = Notification.objects.create(
            user=self.user,
            notification_type='message',
            title='Message 1',
            message='Test message 1',
            is_read=False
        )
        self.notif2 = Notification.objects.create(
            user=self.user,
            notification_type='system',
            title='System 1',
            message='Test system 1',
            is_read=True
        )
    
    def test_list_notifications(self):
        """Test listing notifications."""
        response = self.client.get('/api/users/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_get_unread_notifications(self):
        """Test getting unread notifications."""
        response = self.client.get('/api/users/notifications/unread/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], str(self.notif1.id))
    
    def test_get_unread_count(self):
        """Test getting unread count."""
        response = self.client.get('/api/users/notifications/unread_count/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['unread_count'], 1)
    
    def test_mark_as_read(self):
        """Test marking notification as read."""
        response = self.client.post(
            f'/api/users/notifications/{self.notif1.id}/mark_as_read/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notif1.refresh_from_db()
        self.assertTrue(self.notif1.is_read)
    
    def test_mark_all_as_read(self):
        """Test marking all notifications as read."""
        response = self.client.post('/api/users/notifications/mark_all_as_read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        unread_count = Notification.objects.filter(
            user=self.user,
            is_read=False
        ).count()
        self.assertEqual(unread_count, 0)
    
    def test_delete_notification(self):
        """Test deleting a notification."""
        response = self.client.delete(
            f'/api/users/notifications/{self.notif1.id}/'
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            Notification.objects.filter(id=self.notif1.id).exists()
        )
    
    def test_delete_all_notifications(self):
        """Test deleting all notifications."""
        response = self.client.post('/api/users/notifications/delete_all/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        count = Notification.objects.filter(user=self.user).count()
        self.assertEqual(count, 0)
    
    def test_filter_by_type(self):
        """Test filtering notifications by type."""
        response = self.client.get(
            '/api/users/notifications/by_type/?type=message'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['notification_type'], 'message')
    
    def test_filter_by_type_missing_param(self):
        """Test filtering without type parameter."""
        response = self.client.get('/api/users/notifications/by_type/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot access."""
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/users/notifications/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class NotificationTasksTests(TestCase):
    """Test Celery notification tasks."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_send_notification_async_task(self):
        """Test async notification sending task."""
        result = send_notification_async.apply_async(
            args=[
                self.user.id,
                'system',
                'Async Test',
                'Async notification'
            ]
        )
        # Task should complete successfully
        self.assertIsNotNone(result)
    
    def test_cleanup_old_notifications_task(self):
        """Test cleanup task for old notifications."""
        # Create old notification
        old_date = timezone.now() - timedelta(days=31)
        old_notif = Notification.objects.create(
            user=self.user,
            notification_type='system',
            title='Old',
            message='Old notification',
            is_read=True,
            created_at=old_date
        )
        
        # Create recent notification
        recent_notif = Notification.objects.create(
            user=self.user,
            notification_type='system',
            title='Recent',
            message='Recent notification',
            is_read=True
        )
        
        # Run cleanup
        result = cleanup_old_notifications.apply_async(kwargs={'days': 30})
        self.assertIsNotNone(result)
        
        # Old notification should be deleted
        self.assertFalse(
            Notification.objects.filter(id=old_notif.id).exists()
        )
        # Recent notification should remain
        self.assertTrue(
            Notification.objects.filter(id=recent_notif.id).exists()
        )


class NotificationSecurityTests(APITestCase):
    """Test security aspects of notifications."""
    
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='testpass123'
        )
        
        # Create notification for user1
        self.notif = Notification.objects.create(
            user=self.user1,
            notification_type='message',
            title='Private',
            message='Private notification'
        )
    
    def test_user_cannot_see_other_users_notifications(self):
        """Test that users cannot see other users' notifications."""
        self.client.force_authenticate(user=self.user2)
        response = self.client.get('/api/users/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
    
    def test_user_cannot_delete_other_users_notifications(self):
        """Test that users cannot delete other users' notifications."""
        self.client.force_authenticate(user=self.user2)
        response = self.client.delete(
            f'/api/users/notifications/{self.notif.id}/'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        # Notification should still exist
        self.assertTrue(
            Notification.objects.filter(id=self.notif.id).exists()
        )


class NotificationPerformanceTests(TestCase):
    """Test performance aspects of notifications."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_bulk_notification_creation(self):
        """Test creating many notifications efficiently."""
        users = [
            User.objects.create_user(
                username=f'user{i}',
                email=f'user{i}@example.com',
                password='testpass123'
            )
            for i in range(100)
        ]
        
        notifications = send_bulk_notification(
            users=users,
            notification_type='system',
            title='Bulk',
            message='Bulk notification'
        )
        
        self.assertEqual(len(notifications), 100)
        self.assertEqual(
            Notification.objects.filter(title='Bulk').count(),
            100
        )
    
    def test_unread_count_query_performance(self):
        """Test that unread count query is optimized."""
        # Create many notifications
        for i in range(1000):
            Notification.objects.create(
                user=self.user,
                notification_type='system',
                title=f'Notif {i}',
                message=f'Message {i}',
                is_read=(i % 2 == 0)
            )
        
        # Query should be fast (no ordering)
        unread_count = Notification.objects.filter(
            user=self.user,
            is_read=False
        ).order_by().count()
        
        self.assertEqual(unread_count, 500)
