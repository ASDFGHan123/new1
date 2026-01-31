"""
Custom middleware for CORS and media file handling.
"""
from django.conf import settings

class MediaCORSMiddleware:
    """Add CORS headers to media file responses."""
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
    
    def __call__(self, request):
        response = self.get_response(request)
        
        if request.path.startswith('/media/'):
            origin = request.META.get('HTTP_ORIGIN', '')
            if origin in self.allowed_origins or not self.allowed_origins:
                response['Access-Control-Allow-Origin'] = origin or '*'
            response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type'
            response['Cache-Control'] = 'public, max-age=3600'
        
        return response
