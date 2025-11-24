# backend/oauth_app/views.py
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from oauth2_provider.models import Application
import secrets


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_oauth_app(request):
    """Register a new OAuth application for the current user"""
    name = request.data.get('name')
    redirect_uris = request.data.get('redirect_uris', 'urn:ietf:wg:oauth:2.0:oob')
    scopes = request.data.get('scopes', 'read write follow')
    
    if not name:
        return JsonResponse({'error': 'Application name is required'}, status=400)
    
    # Create OAuth application
    app = Application.objects.create(
        user=request.user,
        name=name,
        client_type=Application.CLIENT_CONFIDENTIAL,
        authorization_grant_type=Application.GRANT_AUTHORIZATION_CODE,
        redirect_uris=redirect_uris,
        client_id=secrets.token_urlsafe(32),
        client_secret=secrets.token_urlsafe(64),
    )
    
    return JsonResponse({
        'id': str(app.id),
        'name': app.name,
        'client_id': app.client_id,
        'client_secret': app.client_secret,
        'redirect_uri': redirect_uris,
        'scopes': scopes,
    }, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_oauth_apps(request):
    """List OAuth applications for the current user"""
    apps = Application.objects.filter(user=request.user)
    
    return JsonResponse({
        'applications': [
            {
                'id': str(app.id),
                'name': app.name,
                'client_id': app.client_id,
                'redirect_uri': app.redirect_uris,
                'created': app.created.isoformat(),
            }
            for app in apps
        ]
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_oauth_app(request, app_id):
    """Delete an OAuth application"""
    try:
        app = Application.objects.get(id=app_id, user=request.user)
        app.delete()
        return JsonResponse({'message': 'Application deleted'})
    except Application.DoesNotExist:
        return JsonResponse({'error': 'Application not found'}, status=404)
