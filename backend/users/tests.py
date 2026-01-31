"""
Test suite for moderator role system.
Run with: python manage.py test users.tests.ModeratorTests
"""
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from users.moderator_models import (
    ModeratorPermissionHelper, ModeratorProfile, ModerationAction,
    ModeratorRole, ModeratorPermission
)
from admin_panel.models import AuditLog
from chat.models import Message, Conversation

User = get_user_model()


class ModeratorModelTests(TestCase):
    """Test moderator models and permissions."""
    
    def setUp(self):
        """Set up test data."""
        self.admin = User.objects.create_user(
            username='admin_user',
            email='admin@test.com',
            password='testpass123',
            role='admin'
        )
        self.moderator = User.objects.create_user(
            username='moderator_user',
            email='mod@test.com',
            password='testpass123'
        )
        self.regular_user = User.objects.create_user(
            username='regular_user',
            email='user@test.com',
            password='testpass123'
        )
    
    def test_create_default_roles(self):
        """Test creating default moderator roles."""
        junior_role = ModeratorPermissionHelper.create_moderator_role('junior')
        senior_role = ModeratorPermissionHelper.create_moderator_role('senior')
        lead_role = ModeratorPermissionHelper.create_moderator_role('lead')
        
        self.assertEqual(junior_role.role_type, 'junior')
        self.assertEqual(senior_role.role_type, 'senior')
        self.assertEqual(lead_role.role_type, 'lead')
        
        # Check permissions
        self.assertTrue(junior_role.permissions.filter(permission='warn_users').exists())
        self.assertTrue(senior_role.permissions.filter(permission='suspend_users').exists())
        self.assertTrue(lead_role.permissions.filter(permission='ban_users').exists())
    
    def test_assign_junior_moderator(self):
        """Test assigning junior moderator role."""
        ModeratorPermissionHelper.assign_moderator_role(self.moderator, 'junior')
        
        self.moderator.refresh_from_db()
        self.assertEqual(self.moderator.role, 'moderator')
        self.assertTrue(hasattr(self.moderator, 'moderator_profile'))
        self.assertTrue(self.moderator.moderator_profile.is_active_moderator)
        self.assertEqual(self.moderator.moderator_profile.role.role_type, 'junior')
    
    def test_assign_senior_moderator(self):
        """Test assigning senior moderator role."""
        ModeratorPermissionHelper.assign_moderator_role(self.moderator, 'senior')
        
        self.moderator.refresh_from_db()
        self.assertEqual(self.moderator.role, 'moderator')
        self.assertEqual(self.moderator.moderator_profile.role.role_type, 'senior')
    
    def test_assign_lead_moderator(self):
        """Test assigning lead moderator role."""
        ModeratorPermissionHelper.assign_moderator_role(self.moderator, 'lead')
        
        self.moderator.refresh_from_db()
        self.assertEqual(self.moderator.role, 'moderator')
        self.assertEqual(self.moderator.moderator_profile.role.role_type, 'lead')
    
    def test_junior_permissions(self):
        """Test junior moderator permissions."""
        ModeratorPermissionHelper.assign_moderator_role(self.moderator, 'junior')
        
        self.assertTrue(ModeratorPermissionHelper.can_warn_user(self.moderator))
        self.assertTrue(ModeratorPermissionHelper.can_delete_message(self.moderator))
        self.assertFalse(ModeratorPermissionHelper.can_suspend_user(self.moderator))
        self.assertFalse(ModeratorPermissionHelper.can_ban_user(self.moderator))
    
    def test_senior_permissions(self):
        """Test senior moderator permissions."""
        ModeratorPermissionHelper.assign_moderator_role(self.moderator, 'senior')
        
        self.assertTrue(ModeratorPermissionHelper.can_warn_user(self.moderator))
        self.assertTrue(ModeratorPermissionHelper.can_delete_message(self.moderator))
        self.assertTrue(ModeratorPermissionHelper.can_suspend_user(self.moderator))
        self.assertFalse(ModeratorPermissionHelper.can_ban_user(self.moderator))
    
    def test_lead_permissions(self):
        """Test lead moderator permissions."""
        ModeratorPermissionHelper.assign_moderator_role(self.moderator, 'lead')
        
        self.assertTrue(ModeratorPermissionHelper.can_warn_user(self.moderator))
        self.assertTrue(ModeratorPermissionHelper.can_delete_message(self.moderator))
        self.assertTrue(ModeratorPermissionHelper.can_suspend_user(self.moderator))
        self.assertTrue(ModeratorPermissionHelper.can_ban_user(self.moderator))
    
    def test_cannot_moderate_admin(self):
        """Test that moderators cannot moderate admins."""
        ModeratorPermissionHelper.assign_moderator_role(self.moderator, 'lead')
        
        can_moderate = ModeratorPermissionHelper.can_moderate_user(self.moderator, self.admin)
        self.assertFalse(can_moderate)
    
    def test_can_moderate_regular_user(self):
        """Test that moderators can moderate regular users."""
        ModeratorPermissionHelper.assign_moderator_role(self.moderator, 'junior')
        
        can_moderate = ModeratorPermissionHelper.can_moderate_user(self.moderator, self.regular_user)
        self.assertTrue(can_moderate)
    
    def test_remove_moderator_role(self):
        """Test removing moderator role."""
        ModeratorPermissionHelper.assign_moderator_role(self.moderator, 'junior')
        ModeratorPermissionHelper.remove_moderator_role(self.moderator)
        
        self.moderator.refresh_from_db()
        self.assertEqual(self.moderator.role, 'user')
        self.assertFalse(self.moderator.moderator_profile.is_active_moderator)


class ModerationActionTests(TestCase):
    """Test moderation actions."""
    
    def setUp(self):
        """Set up test data."""
        self.moderator = User.objects.create_user(
            username='moderator',
            email='mod@test.com',
            password='testpass123'
        )
        self.user = User.objects.create_user(
            username='user',
            email='user@test.com',
            password='testpass123'
        )
        ModeratorPermissionHelper.assign_moderator_role(self.moderator, 'lead')
    
    def test_create_warning_action(self):
        """Test creating a warning action."""
        action = ModerationAction.objects.create(
            moderator=self.moderator,
            action_type='warning',
            target_user=self.user,
            reason='Spam messages'
        )
        
        self.assertEqual(action.action_type, 'warning')
        self.assertEqual(action.target_user, self.user)
        self.assertTrue(action.is_active)
        
        # Check moderator stats updated
        self.moderator.moderator_profile.refresh_from_db()
        self.assertEqual(self.moderator.moderator_profile.warnings_issued, 1)
    
    def test_create_suspension_action(self):
        """Test creating a suspension action."""
        expires_at = timezone.now() + timedelta(hours=24)
        action = ModerationAction.objects.create(
            moderator=self.moderator,
            action_type='suspend',
            target_user=self.user,
            reason='Harassment',
            duration='24h',
            expires_at=expires_at
        )
        
        self.assertEqual(action.action_type, 'suspend')
        self.assertIsNotNone(action.expires_at)
        
        # Check user suspended
        self.user.refresh_from_db()
        self.assertEqual(self.user.status, 'suspended')
    
    def test_create_ban_action(self):
        """Test creating a ban action."""
        action = ModerationAction.objects.create(
            moderator=self.moderator,
            action_type='ban',
            target_user=self.user,
            reason='Repeated violations'
        )
        
        self.assertEqual(action.action_type, 'ban')
        
        # Check user banned
        self.user.refresh_from_db()
        self.assertEqual(self.user.status, 'banned')
        self.assertFalse(self.user.is_active)
    
    def test_audit_log_created(self):
        """Test that audit log is created for moderation action."""
        ModerationAction.objects.create(
            moderator=self.moderator,
            action_type='warning',
            target_user=self.user,
            reason='Test warning'
        )
        
        # Check audit log exists
        audit_logs = AuditLog.objects.filter(actor=self.moderator)
        self.assertTrue(audit_logs.exists())


class ModeratorAPITests(APITestCase):
    """Test moderator API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.moderator = User.objects.create_user(
            username='moderator',
            email='mod@test.com',
            password='testpass123'
        )
        self.user = User.objects.create_user(
            username='user',
            email='user@test.com',
            password='testpass123'
        )
        ModeratorPermissionHelper.assign_moderator_role(self.moderator, 'lead')
        self.client.force_authenticate(user=self.moderator)
    
    def test_warn_user_endpoint(self):
        """Test warn user API endpoint."""
        response = self.client.post('/api/moderators/warn_user/', {
            'user_id': str(self.user.id),
            'reason': 'Spam messages'
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ModerationAction.objects.filter(
            action_type='warning',
            target_user=self.user
        ).exists())
    
    def test_suspend_user_endpoint(self):
        """Test suspend user API endpoint."""
        response = self.client.post('/api/moderators/suspend_user/', {
            'user_id': str(self.user.id),
            'reason': 'Harassment',
            'duration': '24h'
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.user.refresh_from_db()
        self.assertEqual(self.user.status, 'suspended')
    
    def test_ban_user_endpoint(self):
        """Test ban user API endpoint."""
        response = self.client.post('/api/moderators/ban_user/', {
            'user_id': str(self.user.id),
            'reason': 'Repeated violations'
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.user.refresh_from_db()
        self.assertEqual(self.user.status, 'banned')
    
    def test_my_actions_endpoint(self):
        """Test get my actions endpoint."""
        ModerationAction.objects.create(
            moderator=self.moderator,
            action_type='warning',
            target_user=self.user,
            reason='Test'
        )
        
        response = self.client.get('/api/moderators/my_actions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_active_actions_endpoint(self):
        """Test get active actions endpoint."""
        ModerationAction.objects.create(
            moderator=self.moderator,
            action_type='warning',
            target_user=self.user,
            reason='Test'
        )
        
        response = self.client.get('/api/moderators/active_actions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
    
    def test_junior_cannot_ban(self):
        """Test that junior moderators cannot ban users."""
        junior_mod = User.objects.create_user(
            username='junior_mod',
            email='junior@test.com',
            password='testpass123'
        )
        ModeratorPermissionHelper.assign_moderator_role(junior_mod, 'junior')
        self.client.force_authenticate(user=junior_mod)
        
        response = self.client.post('/api/moderators/ban_user/', {
            'user_id': str(self.user.id),
            'reason': 'Test'
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_cannot_moderate_admin(self):
        """Test that moderators cannot moderate admins."""
        admin = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            role='admin'
        )
        
        response = self.client.post('/api/moderators/warn_user/', {
            'user_id': str(admin.id),
            'reason': 'Test'
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ModeratorIntegrationTests(TestCase):
    """Integration tests for moderator system."""
    
    def setUp(self):
        """Set up test data."""
        self.moderator = User.objects.create_user(
            username='moderator',
            email='mod@test.com',
            password='testpass123'
        )
        self.user = User.objects.create_user(
            username='user',
            email='user@test.com',
            password='testpass123'
        )
    
    def test_full_moderation_workflow(self):
        """Test complete moderation workflow."""
        # 1. Assign moderator role
        ModeratorPermissionHelper.assign_moderator_role(self.moderator, 'senior')
        self.assertEqual(self.moderator.role, 'moderator')
        
        # 2. Issue warning
        warning = ModerationAction.objects.create(
            moderator=self.moderator,
            action_type='warning',
            target_user=self.user,
            reason='First warning'
        )
        self.assertTrue(warning.is_active)
        
        # 3. Suspend user
        expires_at = timezone.now() + timedelta(hours=24)
        suspension = ModerationAction.objects.create(
            moderator=self.moderator,
            action_type='suspend',
            target_user=self.user,
            reason='Continued violations',
            duration='24h',
            expires_at=expires_at
        )
        
        self.user.refresh_from_db()
        self.assertEqual(self.user.status, 'suspended')
        
        # 4. Check moderator stats
        self.moderator.moderator_profile.refresh_from_db()
        self.assertEqual(self.moderator.moderator_profile.warnings_issued, 1)
        self.assertEqual(self.moderator.moderator_profile.suspensions_issued, 1)
        
        # 5. Check audit logs
        audit_logs = AuditLog.objects.filter(actor=self.moderator)
        self.assertGreaterEqual(audit_logs.count(), 2)
    
    def test_moderator_hierarchy(self):
        """Test moderator role hierarchy."""
        junior = User.objects.create_user(username='junior', email='j@test.com', password='pass')
        senior = User.objects.create_user(username='senior', email='s@test.com', password='pass')
        lead = User.objects.create_user(username='lead', email='l@test.com', password='pass')
        
        ModeratorPermissionHelper.assign_moderator_role(junior, 'junior')
        ModeratorPermissionHelper.assign_moderator_role(senior, 'senior')
        ModeratorPermissionHelper.assign_moderator_role(lead, 'lead')
        
        # Junior can warn
        self.assertTrue(ModeratorPermissionHelper.can_warn_user(junior))
        # Junior cannot suspend
        self.assertFalse(ModeratorPermissionHelper.can_suspend_user(junior))
        
        # Senior can suspend
        self.assertTrue(ModeratorPermissionHelper.can_suspend_user(senior))
        # Senior cannot ban
        self.assertFalse(ModeratorPermissionHelper.can_ban_user(senior))
        
        # Lead can ban
        self.assertTrue(ModeratorPermissionHelper.can_ban_user(lead))
