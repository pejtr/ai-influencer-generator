# Fanvue API Integration Notes

## Business Model - AI Influencers (Aitana Lopez Case Study)

### Výdělky
- Aitana Lopez: až €10,000/měsíc (průměr €3,000)
- $1,000 za Instagram post (sponzorované)
- 300,000+ followers na Instagramu
- Monetizace přes Fanvue subscription model

### Monetizační kanály
1. **Fanvue předplatné** - měsíční subscription od fanů
2. **Instagram sponzorované posty** - $1,000+ za post
3. **Brand deals** - spolupráce se značkami
4. **Pay-per-view obsah** - exkluzivní fotky/videa
5. **Tips** - příspěvky od fanů

---

## Fanvue API - Klíčové Endpointy

### Authentication
- OAuth 2.0
- Bearer token
- API Version header: `X-Fanvue-API-Version: 2025-06-26`

### Users API
```
GET /users/me - Get current user info
- uuid, email, handle, bio, displayName
- isCreator, avatarUrl, bannerUrl
- fanCounts: followersCount, subscribersCount
- contentCounts: imageCount, videoCount, postCount
```

### Posts API (Klíčové pro automatizaci)
```
POST /posts - Create a new post
Request:
- audience: "subscribers" | "followers-and-subscribers" (Required)
- text: string (Optional, max 5000 chars)
- mediaUuids: string[] (Optional - array of uploaded media)
- price: number (Optional, min 300 cents = $3)
- publishAt: ISO 8601 datetime (Optional - scheduling!)
- expiresAt: ISO 8601 datetime (Optional)

GET /posts - Get list of posts
GET /posts/{uuid} - Get specific post
GET /posts/{uuid}/tips - Get tips for post
GET /posts/{uuid}/likes - Get likes
GET /posts/{uuid}/comments - Get comments
```

### Media API
- Upload media pro posty
- Multipart upload support

### Chats API
- GET /chats - List chats
- Chat Messages, Templates
- Smart Lists, Custom Lists
- **AI automated messaging support**

### Insights API
- Analytics a statistiky
- Earnings data

### Webhooks
- Subscription events
- Message events
- Payment events

---

## Automatizace Workflow

### Možný pipeline:
1. **AI Influencer Generator** → Generuje obrázky influencera
2. **Content Scheduler** → Plánuje posty (publishAt)
3. **Fanvue API** → Automaticky publikuje na Fanvue
4. **AI Chat** → Fanvue AI messaging odpovídá fanům 24/7
5. **Analytics** → Sledování výkonu a optimalizace

### n8n Integration
- Fanvue má oficiální n8n node
- Automatizace workflows
- Webhooks pro real-time eventy

### MCP (AI Assistants)
- Fanvue podporuje MCP integraci
- Možnost propojení s AI asistenty

---

## Implementační plán pro naši platformu

### Fáze 1: Základní integrace
- [ ] OAuth 2.0 flow pro Fanvue
- [ ] Uložení access/refresh tokenů
- [ ] Základní API volání (get user, list posts)

### Fáze 2: Content Publishing
- [ ] Upload media endpoint
- [ ] Create post s plánováním
- [ ] Batch posting support

### Fáze 3: Automatizace
- [ ] Content calendar/scheduler
- [ ] Auto-posting z generovaných obrázků
- [ ] Performance tracking

### Fáze 4: AI Chat Integration
- [ ] Využití Fanvue AI messaging
- [ ] Custom chatbot training
- [ ] 24/7 fan engagement

---

## Právní poznámky
- Fanvue explicitně podporuje AI-generated content
- World AI Creator Awards (WAICA) ve spolupráci s Fanvue
- AI influencers jsou legitimní business model
- Nutno označit jako AI-generated (transparentnost)
