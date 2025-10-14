```bash

# Clone repository
git clone https://github.com/B1naryB0t/Glade

# Make script executable
chmod +x scripts/quick-setup.sh

# Run setup
./scripts/quick-setup.sh

# Add demo data
cd infrastructure/docker
docker-compose exec backend python /app/scripts/demo-data.py
```

```mermaid
sequenceDiagram
    participant Client as Client/User
    participant API as Django API
    participant Middleware as Privacy & RateLimit Middleware
    participant UserService as UserService
    participant LocationService as LocationService
    participant PrivacyService as PrivacyService
    participant Serializer as PostSerializer / PostCreateSerializer
    participant PostModel as Django
    participant LikeModel as Like Model
    participant DB as Database
    participant Celery as Celery

    %% === Middleware & Request Start ===
    Client->>API: Request (create post / like / fetch nearby posts/users)
    API->>Middleware: __call__() checks rate limits & headers
    Middleware-->>API: Request passes or 429 error

    %% === User registration & authentication ===
    Client->>API: POST /users/ {username, email, password}
    API->>UserService: create_user(username, email, password, ...)
    UserService->>UserService: hash password & email, generate keypair
    UserService->>DB: INSERT new User
    DB-->>UserService: return User
    UserService-->>API: return created User
    API-->>Client: 201 Created

    Client->>API: POST /auth/token {username, password}
    API->>UserService: authenticate_user(username, password)
    UserService->>DB: SELECT User WHERE username=username
    DB-->>UserService: return User
    UserService->>UserService: verify password
    UserService-->>API: return User or None
    API-->>Client: 200 OK or 401 Unauthorized

    %% === Post creation & serialization ===
    Client->>API: POST /posts/ {content, visibility, location, ...}
    API->>Serializer: PostCreateSerializer.validate()
    Serializer->>LocationService: apply_location_fuzzing(lat, lon)
    LocationService-->>Serializer: fuzzed lat/lon
    Serializer->>PostModel: create(post fields + author + location)
    PostModel->>DB: INSERT Post
    DB-->>PostModel: saved Post
    PostModel-->>Serializer: post instance
    Serializer-->>API: serialized Post JSON
    API-->>Client: 201 Created {post data}

    %% === Privacy check before retrieval ===
    Client->>API: GET /posts/
    API->>PostModel: SELECT posts
    PostModel->>PrivacyService: can_user_see_post(user, post)
    PrivacyService-->>PostModel: True/False
    PostModel-->>Serializer: filtered posts
    Serializer-->>API: serialized list of posts
    API-->>Client: JSON list

    %% === Liking a post ===
    Client->>API: POST /posts/{id}/like
    API->>PostModel: get(post_id)
    PostModel->>PrivacyService: can_user_see_post(user, post)
    PrivacyService-->>API: True/False
    API->>LikeModel: get_or_create(user, post)
    LikeModel->>DB: INSERT Like if new
    DB-->>LikeModel: saved Like
    API-->>Client: {"liked": True}

    %% === Nearby posts/users retrieval ===
    Client->>API: GET /posts/nearby?lat=..&lng=..&radius=..
    API->>LocationService: get_nearby_posts(user, radius)
    LocationService->>DB: SELECT posts WHERE ST_DWithin(post.location, user.location, radius)
    DB-->>LocationService: list of posts
    LocationService-->>API: return posts
    API-->>Client: JSON list of nearby posts

    Client->>API: GET /users/nearby?lat=..&lng=..&radius=..
    API->>LocationService: get_nearby_users(user, radius)
    LocationService->>DB: SELECT users WHERE ST_DWithin(user.location, user.location, radius) AND privacy_level<=2
    DB-->>LocationService: list of users
    LocationService-->>API: return users
    API-->>Client: JSON list of nearby users

    %% === Federation of posts ===
    PostModel->>Celery: federate_post.delay(post.id)
    Celery->>API: fetch post details + ActivityPub conversion
    API->>PostModel: to_activitypub_note()
    API->>DB: fetch post & author
    DB-->>API: Post + author
    API-->>Celery: send federated post to other instances
```