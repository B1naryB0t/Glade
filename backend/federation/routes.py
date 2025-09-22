# backend/federation/routes.py
import json

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import JSONResponse

from backend.core.config import settings
from backend.federation.handlers import ActorHandler, InboxHandler, OutboxHandler

router = APIRouter()

# Well-known endpoints


@router.get("/.well-known/webfinger")
async def webfinger(resource: str):
    """WebFinger endpoint for user discovery"""
    if not resource.startswith("acct:"):
        raise HTTPException(status_code=400, detail="Invalid resource format")

    # Parse acct:username@domain
    account = resource[5:]  # Remove 'acct:'
    if "@" not in account:
        raise HTTPException(status_code=400, detail="Invalid account format")

    username, domain = account.split("@", 1)

    if domain != settings.INSTANCE_DOMAIN:
        raise HTTPException(status_code=404, detail="User not found")

    # TODO: Check if user exists in database

    return {
        "subject": resource,
        "links": [
            {
                "rel": "self",
                "type": "application/activity+json",
                "href": f"https://{settings.INSTANCE_DOMAIN}/users/{username}",
            }
        ],
    }


@router.get("/.well-known/nodeinfo")
async def nodeinfo_discovery():
    """NodeInfo discovery endpoint"""
    return {
        "links": [
            {
                "rel": "http://nodeinfo.diaspora.software/ns/schema/2.0",
                "href": f"https://{settings.INSTANCE_DOMAIN}/nodeinfo/2.0",
            }
        ]
    }


@router.get("/nodeinfo/2.0")
async def nodeinfo():
    """NodeInfo endpoint"""
    return {
        "version": "2.0",
        "software": {"name": "glade", "version": "0.1.0"},
        "protocols": ["activitypub"],
        "services": {"inbound": [], "outbound": []},
        "openRegistrations": True,
        "usage": {
            "users": {"total": 1, "activeMonth": 1, "activeHalfyear": 1},
            "localPosts": 0,
        },
        "metadata": {
            "nodeName": settings.INSTANCE_NAME,
            "nodeDescription": settings.INSTANCE_DESCRIPTION,
            "privacyFocused": True,
            "locationAware": True,
        },
    }


# ActivityPub endpoints


@router.get("/users/{username}")
async def get_actor(username: str):
    """Get ActivityPub actor"""
    handler = ActorHandler()
    return await handler.get_actor(username)


@router.post("/users/{username}/inbox")
async def user_inbox(username: str, request: Request):
    """User inbox for ActivityPub activities"""
    handler = InboxHandler()
    activity = await request.json()
    return await handler.handle_activity(username, activity)


@router.get("/users/{username}/outbox")
async def user_outbox(username: str):
    """User outbox"""
    handler = OutboxHandler()
    return await handler.get_outbox(username)


@router.post("/inbox")
async def shared_inbox(request: Request):
    """Shared inbox for the instance"""
    handler = InboxHandler()
    activity = await request.json()
    return await handler.handle_shared_activity(activity)
