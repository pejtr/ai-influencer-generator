# Fanvue API Integration Notes

## OAuth 2.0 Flow (PKCE Required)

### Endpoints
- Authorization: `https://auth.fanvue.com/oauth2/auth`
- Token Exchange: `https://auth.fanvue.com/oauth2/token`
- API Base: `https://api.fanvue.com`

### Required Scopes
- `openid` - Basic authentication
- `offline_access` - Refresh tokens
- `offline` - Offline access
- `read:self` - Read user profile
- `write:post` - Create posts
- `write:media` - Upload media

### Implementation Steps
1. Generate PKCE code_verifier and code_challenge (SHA256)
2. Store code_verifier in session/cookie
3. Redirect to auth URL with code_challenge
4. User consents on Fanvue
5. Fanvue redirects back with authorization code
6. Exchange code for tokens (include code_verifier)
7. Use access_token for API calls
8. Refresh tokens when expired

## Key API Endpoints

### Get Current User
```
GET https://api.fanvue.com/users/me
Headers:
  - X-Fanvue-API-Version: 2025-06-26
  - Authorization: Bearer <token>
```

### Create Post
```
POST https://api.fanvue.com/posts
Headers:
  - X-Fanvue-API-Version: 2025-06-26
  - Authorization: Bearer <token>
  - Content-Type: application/json
Body:
{
  "audience": "subscribers" | "followers-and-subscribers",
  "text": "Post content (max 5000 chars)",
  "mediaUuids": ["uuid1", "uuid2"],
  "price": 300, // cents, optional for paid posts
  "publishAt": "2025-01-15T09:30:00Z", // optional scheduled post
  "expiresAt": "2025-02-15T09:30:00Z" // optional expiration
}
```

### Media Upload (Multipart)
1. `POST /media/upload-session` - Create upload session
2. `GET /media/upload-session/{id}/part` - Get signed URL for each part
3. `PATCH /media/upload-session/{id}` - Complete upload session
4. Returns mediaUuid to use in posts

## Integration Plan

### Phase 1: OAuth Connection
- Add Fanvue OAuth credentials to env
- Create OAuth flow endpoints
- Store tokens securely in database
- Implement token refresh logic

### Phase 2: Auto-Publish Feature
- Upload generated image to Fanvue via multipart upload
- Create post with media UUID
- Support scheduled publishing (publishAt)
- Track published posts in database

### Phase 3: Content Scheduler (VIP)
- Calendar UI for scheduling posts
- Batch generation (30 images)
- Queue system for scheduled posts
- Auto-publish at scheduled times
