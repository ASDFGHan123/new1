from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json
from users.models import User


@method_decorator(csrf_exempt, name='dispatch')
class HeartbeatView(APIView):
    """
    Receive heartbeat from active users to keep them marked as online.
    Expected to be called every 10 seconds from the frontend.
    Supports POST with logout flag for page unload.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Update user's last_seen and keep them online. If logout flag, mark offline."""
        user = request.user
        logout = False
        if request.content_type == 'application/json':
            try:
                body = json.loads(request.body)
                logout = body.get('logout', False)
            except (json.JSONDecodeError, TypeError):
                pass

        if logout:
            user.set_offline()
        else:
            user.set_online()

        return Response({
            'message': 'Heartbeat recorded',
            'online_status': user.online_status,
            'last_seen': user.last_seen.isoformat()
        })

    def get(self, request):
        """Return current online status and last_seen."""
        user = request.user
        return Response({
            'online_status': user.online_status,
            'last_seen': user.last_seen.isoformat()
        })
