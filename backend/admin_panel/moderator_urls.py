"""
Add to admin_panel/urls.py
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from admin_panel.moderator_management_views import AdminModeratorViewSet

router = DefaultRouter()
router.register(r'moderators', AdminModeratorViewSet, basename='admin-moderator')

urlpatterns = [
    path('', include(router.urls)),
]
