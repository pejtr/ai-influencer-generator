# AI Influencer Generator - Project TODO

## Core Features

### Database & Backend
- [x] Database schema (users, credits, generations, subscriptions, affiliates)
- [x] Credit system with tier enforcement
- [x] User authentication integration
- [x] API endpoints for all features

### Character Builder UI
- [x] Character type selector (Human, Elf, Alien, Robot, Vampire, Angel, Demon, Fairy, Mermaid, Cyborg)
- [x] Gender selector (Female, Male, Non-binary)
- [x] Ethnicity/Origin selector (European, African, Asian, Indian, Middle Eastern, Latino, Mixed)
- [x] Eye color selector with visual color buttons
- [x] Skin tone selector with visual color buttons
- [x] Skin features selector (Freckles, Vitiligo, Scars, Birthmarks, Tattoos, Piercings)
- [x] Age slider (18-70)
- [x] Text prompt input for customization
- [x] Random character generator button
- [x] Reset button
- [x] Builder/Prompt tabs
- [x] Generated prompt preview

### AI Image Generation
- [ ] MiniMax API integration for image generation
- [x] Prompt building from character selections
- [ ] Generation queue management
- [ ] Error handling and retry logic

### User Gallery
- [x] Display generated influencers
- [x] HD download capability
- [x] Delete functionality
- [x] Share functionality
- [x] Image preview dialog

### Watermark System
- [x] Watermark overlay for free tier (CSS implementation)
- [ ] Server-side watermark application
- [x] No watermark for paid tiers logic

### Credit System & Pricing
- [x] Free tier: 5 credits/month with watermark
- [x] Starter: $9/month - 50 credits
- [x] Pro: $29/month - 300 credits
- [x] Business: $99/month - 1000 credits
- [x] Credit pack purchases (one-time) UI
- [x] Credit balance display in navbar
- [x] Usage tracking

### Stripe Integration
- [ ] Subscription management
- [ ] One-time credit pack purchases
- [ ] Webhook handling
- [ ] Invoice generation
- [ ] Payment history

### Affiliate Program
- [x] Affiliate registration
- [x] Unique referral links
- [x] 30% recurring commission tracking
- [x] Partner dashboard
- [ ] Payout management
- [x] Commission reports

### Admin Dashboard
- [x] User management table
- [x] Credit management
- [x] Revenue metrics (MRR, ARPU, LTV)
- [x] Generation statistics
- [ ] Affiliate management

### SEO & Landing Pages
- [x] SEO-optimized homepage with hero section
- [x] Meta tags for 'ai influencer', 'ai influencer generator'
- [x] Structured data (JSON-LD)
- [x] Sitemap.xml
- [x] Robots.txt
- [x] Custom 404 page

### Design & UX
- [x] Dark theme (Higgsfield-inspired with neon lime accent)
- [x] Responsive design
- [x] Loading states
- [x] Error states
- [x] Toast notifications
- [x] Neon glow effects
- [x] Glass morphism elements

## Bugs & Issues
(None yet)

## Next Steps
- [ ] Implement MiniMax AI image generation
- [ ] Add Stripe integration for payments
- [ ] Add server-side watermark processing
- [ ] Add SEO structured data
- [x] Write unit tests (credits.test.ts)


## Stripe Integration (New)
- [x] Add Stripe feature to project
- [x] Create Stripe products and prices for tiers
- [x] Implement subscription checkout flow
- [x] Implement one-time credit pack checkout
- [x] Handle Stripe webhooks (subscription created/updated/cancelled)
- [x] Handle payment success/failure callbacks
- [x] Update user credits on successful payment
- [ ] Add payment history to user profile
- [x] Test subscription flow (unit tests passing)
- [x] Test credit pack purchase flow (unit tests passing)


## Tier System BASIC/PREMIUM/VIP (New)
- [x] Update subscription tiers from Starter/Pro/Business to BASIC/PREMIUM/VIP
- [x] Define feature matrix per tier
- [x] Implement feature gating middleware
- [x] Update database schema for new tiers
- [x] Update Stripe products for new tier names

## Feature Gating per Tier
- [x] BASIC: Standard generation, watermark, 50 credits/month ($9)
- [x] PREMIUM: HD download, no watermark, Fanvue OAuth, 300 credits/month ($29)
- [x] VIP: All Premium + Auto-publish, Content Scheduler, Batch Generation, 1000 credits/month ($99)

## Fanvue Integration (PREMIUM/VIP only)
- [x] Fanvue OAuth 2.0 flow implementation
- [x] Store Fanvue access/refresh tokens
- [x] Auto-publish generated images to Fanvue
- [x] Fanvue account connection UI

## Content Scheduler (VIP only)
- [x] Content calendar UI
- [x] Scheduled posts queue
- [x] Batch generation (30 images at once)
- [x] Auto-posting workflow


## Multi-Level Affiliate System (New)
- [x] Multi-level referral tracking (Level 1: 30%, Level 2: 10%, Level 3: 5%)
- [x] Affiliate network visualization (tree view)
- [x] Affiliate dashboard with earnings breakdown by level
- [x] Referral chain tracking in database

## Affiliate Leaderboard
- [x] Top affiliates ranking by earnings
- [x] Top affiliates by referral count
- [x] Monthly/All-time leaderboard toggle
- [x] Public leaderboard page

## Affiliate Badges & Achievements
- [x] Bronze Partner: 10+ referrals
- [x] Silver Partner: 50+ referrals  
- [x] Gold Partner: 100+ referrals
- [x] Diamond Partner: 500+ referrals
- [x] Rising Star: First $100 earned
- [x] Top Earner: $1000+ monthly
- [x] Badge display on profile
- [x] Achievement notifications


## Fanvue OAuth Auto-Publishing (PREMIUM/VIP) - New
- [x] Research Fanvue API documentation
- [x] Create Fanvue OAuth 2.0 connection flow
- [x] Store Fanvue access/refresh tokens securely
- [x] Create Fanvue connection UI in user settings
- [x] Implement auto-publish endpoint for generated images
- [x] Add Fanvue connection status indicator
- [x] Test OAuth flow and token refresh

## Content Scheduler with Batch Generation (VIP) - New
- [x] Create content calendar database schema
- [x] Build calendar UI component for scheduling posts
- [x] Implement batch generation (up to 30 images at once)
- [x] Create scheduled posts queue system
- [x] Add auto-posting workflow to Fanvue
- [x] Implement post preview before publishing
- [x] Add scheduling time picker

## Homepage Showcase Gallery - New
- [x] Create showcase gallery component
- [x] Add pre-generated AI influencer images
- [x] Implement carousel/grid display
- [x] Add hover effects and image details
- [x] Include social proof elements
- [x] Make gallery responsive


## Hybrid Monetization Model - COMPLETED
- [x] Update database schema for credit system
  - [x] Add credit_balance field to users table
  - [x] Add free_credits_today field with daily reset
  - [x] Add last_free_credits_reset timestamp
  - [x] Create credit_transactions table for history
  - [x] Create credit_packs table for products
- [x] Implement Credit Pack purchases (Stripe one-time)
  - [x] Small Pack: $9.99 = 100 credits
  - [x] Medium Pack: $29.99 = 400 credits (+33% bonus)
  - [x] Large Pack: $99.99 = 1500 credits (+50% bonus)
- [x] Update Subscription tiers with monthly credits
  - [x] FREE: 5 credits/day, watermark, basic styles
  - [x] PRO ($19.99/mo): 500 credits/mo, no watermark, HD, Fanvue
  - [x] CREATOR ($49.99/mo): 1500 credits/mo, batch, scheduler, AI chat
- [x] Implement free daily credits system
  - [x] 5 free credits per day for all users
  - [x] Reset at midnight UTC
  - [x] Show remaining free credits in UI
- [x] Update Pricing page UI
  - [x] Credit packs section with tabs
  - [x] Subscription comparison table
  - [x] Savings calculator (bonus credits display)
  - [x] FAQ section explaining credit system
- [x] Credit deduction on generation
  - [x] Check balance before generation
  - [x] Deduct from free credits first, then subscription, then paid
  - [x] Show low balance warning
- [x] Credit transaction history page
- [x] Write unit tests for credit system (77 tests passing)


## Higgsfield-Style Interface Upgrade - COMPLETED
Based on video analysis: https://www.youtube.com/watch?v=S3tlyCslYlY

### Interface Redesign
- [x] Redesign Studio to 3-panel layout (Left: Character Library, Center: Preview, Right: Builder)
- [x] Add character thumbnails gallery in left panel
- [x] Improve preview area with larger display
- [x] Add real-time preview updates

### Body Type Customization
- [x] Add body type selector (Slim, Athletic, Average, Curvy, Plus-size, Muscular)
- [x] Integrate with prompt builder

### Hair Customization Panel
- [x] Add hair style selector with visual options (10+ styles)
- [x] Add hair color picker (12 colors)
- [x] Add hair length options integrated in styles
- [x] Add hair texture options integrated in styles

### Clothing/Outfit Editor
- [x] Add outfit style selector (Casual, Formal, Sporty, Elegant, Streetwear, Bohemian, Business, Swimwear, Lingerie, Vintage)
- [x] Add clothing color customization (12 colors)
- [x] Add accessory options (Sunglasses, Necklace, Earrings, Watch, Hat, Scarf, Handbag)

### Character Persistence
- [x] Implement save character preset functionality (localStorage)
- [x] Implement load character preset functionality
- [x] Add character library management UI in left panel
- [x] Add "Create new" button in character library
- [x] Add delete preset functionality

### Motion Control / Video Generation (Major Feature)
- [x] MiniMax MCP video generation integration
- [x] Create video generation API endpoint
- [x] Build Motion Control UI panel with dialog
- [x] Add 15 camera movement options (Truck, Pan, Push, Pull, Pedestal, Tilt, Zoom, Shake, Tracking, Static)
- [x] Add video preview in dialog
- [x] Support I2V (Image to Video) and T2V (Text to Video) models

### Post-Generation Editing
- [x] Add "Edit with prompt" button on generated images
- [x] Implement edit dialog with text prompt input
- [x] Create variation generation by appending edit prompts

### Unit Tests
- [x] 100 unit tests passing for all features

