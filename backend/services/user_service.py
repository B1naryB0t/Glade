# backend/services/user_service.py
import hashlib
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.security import get_password_hash, verify_password
from backend.models.user import User
from backend.services.crypto_service import generate_keypair


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user(
        self, username: str, email: str, password: str, **kwargs
    ) -> User:
        # Check if user exists
        existing = await self.get_user_by_username(username)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists",
            )

        # Generate keypair for federation
        public_key, private_key = generate_keypair()

        user = User(
            username=username,
            email_hash=hashlib.sha256(email.encode()).hexdigest(),
            password_hash=get_password_hash(password),
            public_key=public_key,
            private_key=private_key,
            actor_url=f"https://{settings.INSTANCE_DOMAIN}/users/{username}",
            **kwargs,
        )

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def authenticate_user(self, username: str, password: str) -> Optional[User]:
        user = await self.get_user_by_username(username)
        if not user or not verify_password(password, user.password_hash):
            return None
        return user

    async def get_user_by_username(self, username: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
