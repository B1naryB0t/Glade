# backend/accounts/views.py
from django.contrib.auth import authenticate
from models import Follow, User
from rest_framework import generics, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from serializers import (
    UserProfileSerializer,
    UserRegistrationSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""

    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Create auth token
        token, created = Token.objects.get_or_create(user=user)

        return Response(
            {"user": UserSerializer(user).data, "token": token.key},
            status=status.HTTP_201_CREATED,
        )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """User login endpoint"""
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"error": "Username and password required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(username=username, password=password)
    if user:
        token, created = Token.objects.get_or_create(user=user)
        return Response({"user": UserSerializer(user).data, "token": token.key})

    return Response(
        {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
    )


class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile view"""

    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    lookup_field = "username"

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_object(self):
        if self.kwargs.get("username") == "me":
            return self.request.user
        return super().get_object()


@api_view(["POST", "DELETE"])
@permission_classes([permissions.IsAuthenticated])
def follow_user(request, username):
    """Follow or unfollow a user"""
    try:
        target_user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    if target_user == request.user:
        return Response({"error": "Cannot follow yourself"}, status=400)

    if request.method == "POST":
        follow, created = Follow.objects.get_or_create(
            follower=request.user, following=target_user
        )

        if created:
            # TODO: Send federation follow request if remote user
            # TODO: Send notification to target user
            return Response({"following": True}, status=201)
        return Response({"following": True}, status=200)

    else:  # DELETE
        try:
            follow = Follow.objects.get(follower=request.user, following=target_user)
            follow.delete()
            # TODO: Send federation unfollow if remote user
            return Response({"following": False}, status=200)
        except Follow.DoesNotExist:
            return Response({"following": False}, status=200)
