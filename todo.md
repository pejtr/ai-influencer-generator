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



## Professional Prompt System (from Alisha Lewis video) - COMPLETED
Based on video: https://www.youtube.com/watch?v=ZekexseCSxA

### Prompt Templates
- [x] Create base portrait prompt template (neutral background, no accessories)
- [x] Create angle variation prompts (front, profile, 3/4 view)
- [x] Create full body prompts with outfit variations
- [x] Create emotion composite card (6 basic emotions)
- [x] Create outfit variation prompts (casual, formal, sporty, etc.)
- [x] Create scene templates (cafe, beach, city, luxury)
- [x] 35+ professional prompt templates total

### One-Click Prompt System
- [x] Add "Quick Prompts" tab in Studio (3rd tab)
- [x] Implement one-click prompt application
- [x] Add prompt categories (Portrait, Angles, Full Body, Emotions, Outfits, Scenes, Character Sheets)
- [x] Add 4K/HD quality presets in templates

### Character Consistency
- [x] Character sheet generation (multiple angles)
- [x] Emotion sheet generation (6 emotions grid)
- [x] "Generate Character Sheet" button
- [x] "Generate Emotion Sheet" button

### UI Improvements
- [x] Add prompt template category selector
- [x] Add aspect ratio presets (1:1, 4:3, 3:4, 16:9, 9:16, 2:3, 3:2)
- [x] Template preview with truncated prompt
- [x] Copy to clipboard functionality

### Unit Tests
- [x] 133 unit tests passing (including 33 for prompt templates)


## AI Chat Companion (Glambase-style) - COMPLETED
Based on Glambase analysis - automatic fan engagement and content monetization

### Database Schema
- [x] Create chat_conversations table (user_id, influencer_id, created_at)
- [x] Create chat_messages table (conversation_id, role, content, timestamp)
- [x] Create exclusive_content table (influencer_id, title, price, preview_url, full_url)
- [x] Create content_purchases table (user_id, content_id, amount, purchased_at)
- [x] Create influencer_personalities table (influencer_id, name, bio, personality_traits, chat_style)
- [x] Create creator_earnings table for revenue tracking

### AI Chat Backend
- [x] Integrate LLM for chat responses
- [x] Create personality system (6 types: flirty, friendly, mysterious, playful, sophisticated, bold)
- [x] Implement context-aware responses (remember conversation history)
- [x] Add 5 chat styles (casual, formal, romantic, witty, seductive)
- [x] Implement content recommendation during chat
- [x] Add "unlock content" prompts in conversation

### Chat UI Component
- [x] Create chat interface with message bubbles
- [x] Add typing indicator for AI responses
- [x] Implement message history scroll
- [x] Add "Send tip" button
- [x] Add "Unlock exclusive content" cards in chat
- [x] Show content previews (blurred) with unlock button

### Payment Integration
- [x] Implement pay-per-message option ($0.50/message)
- [x] Implement content unlock purchases (Stripe)
- [x] Add tip/donate functionality
- [x] Creator receives 90% of revenue (10% platform fee)

### Creator Dashboard
- [x] Personality editor (name, bio, traits, chat style)
- [x] Exclusive content upload and pricing
- [x] Chat analytics (messages, revenue, popular content)
- [x] Earnings overview (total, pending, paid)

### Revenue Model
- [x] Pay-per-message: $0.50 per message
- [x] Exclusive content: Creator sets price ($1-$1000)
- [x] Tips: Any amount
- [x] Platform fee: 10% (creator gets 90%)

### Unit Tests
- [x] 164 unit tests passing


## A/B Testing & Multi-Language Landing Pages - COMPLETED
- [x] A/B testing context and hooks (ABTestContext.tsx)
- [x] 6 landing page variants (3 EN + 3 CZ)
  - [x] EN-A: Dark Neon Lime (current)
  - [x] EN-B: Luxury Gold NYC
  - [x] EN-C: Fresh Blue Light
  - [x] CZ-A: Světlý Čistý
  - [x] CZ-B: Urgence (countdown + sleva)
  - [x] CZ-C: Lifestyle Luxury
- [x] Theme switching system
- [x] Variant persistence in localStorage
- [x] Analytics tracking ready

## Influencer Marketplace - COMPLETED
- [x] Database tables for marketplace (influencer_follows, influencer_tips)
- [x] Marketplace browse page (/marketplace)
- [x] Category filtering (lifestyle, fashion, fitness, beauty, travel, gaming, art, music)
- [x] Search functionality
- [x] Follow/Unfollow system
- [x] Tip functionality with Stripe
- [x] Navbar link added

## Push Notifications - COMPLETED
- [x] Database table for notifications
- [x] Notification service with 6 types (new_message, new_follower, content_purchase, tip_received, subscription, system)
- [x] NotificationBell component in navbar
- [x] Unread count badge
- [x] Mark as read functionality
- [x] Notification dropdown with scroll area

## Unit Tests Summary
- [x] 193 unit tests passing across all features


## Advanced Marketplace Filtering - New
- [ ] Filter by category (lifestyle, fashion, fitness, beauty, travel, gaming, art, music)
- [ ] Filter by follower count range (0-100, 100-1k, 1k-10k, 10k+)
- [ ] Filter by content price range (free, $1-10, $10-50, $50+)
- [ ] Sort options (popularity, newest, price low-high, price high-low)
- [ ] Advanced filter panel UI with sliders and checkboxes
- [ ] Save filter preferences

## Analytics Dashboard for A/B Testing - New
- [ ] Create analytics database tables (page_views, conversions, variant_stats)
- [ ] Track page views per variant
- [ ] Track conversions per variant (signups, purchases)
- [ ] Calculate conversion rates
- [ ] Build analytics dashboard UI
- [ ] Show charts for variant performance
- [ ] Statistical significance indicator
- [ ] Date range selector

## Creator Payout System (Stripe Connect) - New
- [ ] Integrate Stripe Connect for creator accounts
- [ ] Creator onboarding flow for Stripe Connect
- [ ] Track pending payouts per creator
- [ ] Implement payout request functionality
- [ ] Automatic weekly/monthly payout option
- [ ] Payout history page
- [ ] Minimum payout threshold ($10)
- [ ] Platform fee deduction (10%)


## JSON Structured Prompts & Character Consistency - New
Based on video: https://www.youtube.com/watch?v=_uI9eGpc_Ts

### JSON Structured Prompt System
- [ ] Create JSON prompt schema for structured scene description
- [ ] Define JSON fields: subject, face, hair, outfit, pose, scene, lighting, camera
- [ ] Build JSON prompt builder UI component
- [ ] Convert JSON to optimized text prompt for image generation
- [ ] Add JSON prompt mode toggle in Studio

### Reference Image Lock (Character Identity)
- [ ] Add reference image upload for character consistency
- [ ] Store reference images per character preset
- [ ] Pass reference image to image generation API
- [ ] Implement face/identity preservation in generation

### AI Prompt Generator (Simple to JSON)
- [ ] Create LLM-powered prompt generator endpoint
- [ ] Accept simple text description as input
- [ ] Output structured JSON prompt
- [ ] Add "Generate JSON from description" button in Studio
- [ ] Show generated JSON for user review/edit

### Studio UI Updates
- [ ] Add JSON Prompt tab in builder panel
- [ ] Add reference image upload section
- [ ] Add "Lock Character" toggle
- [ ] Show JSON preview with syntax highlighting
- [ ] Add copy JSON button


## Nano Banana Pro Cinematography Features - NEW
Based on video: https://www.youtube.com/watch?v=-mTYBgQLPOw

### Camera Gear Presets
- [x] Professional camera body presets (Sony A7, Canon R5, RED, ARRI, Blackmagic)
- [x] Lens presets (24mm wide, 35mm, 50mm, 85mm portrait, 135mm telephoto)
- [x] Aperture settings (f/1.4 bokeh, f/2.8 balanced, f/8 sharp)
- [x] Film stock/sensor emulation (Kodak Portra, Fuji, CineStill, Digital clean)

### Lighting Setups
- [x] Studio lighting presets (Rembrandt, Butterfly, Split, Loop, Broad)
- [x] Natural lighting presets (Golden hour, Blue hour, Overcast, Harsh noon)
- [x] Cinematic lighting (Noir, Neon, Practical, Motivated)
- [x] Color temperature controls (Warm 3200K, Daylight 5600K, Cool 7000K)

### Film Style Aesthetics
- [x] Movie director styles (Wes Anderson, Christopher Nolan, Denis Villeneuve, Ridley Scott)
- [x] Photographer styles (Annie Leibovitz, Peter Lindbergh, Mario Testino)
- [x] Film genre looks (Noir, Sci-Fi, Romance, Horror, Documentary)
- [x] Color grading presets (Teal/Orange, Vintage, Desaturated, Vibrant)

### Scene Generator (Storyboard Mode)
- [x] Multi-angle scene generation (same character, different angles)
- [x] Action sequence generator (walking, sitting, turning, gesturing)
- [x] Storyboard grid view (2x2, 3x3, 4x4 layouts)
- [x] Scene continuity tracking (maintain character across shots)
- [ ] Export storyboard as PDF/image grid

### Elements Tool (Reference Image Workflow)
- [x] Character reference upload (lock face/body identity)
- [x] Outfit reference upload (apply specific clothing)
- [x] Scene/background reference upload
- [x] Object reference upload (props, accessories)
- [x] Reference strength slider (0-100%)
- [x] Multi-reference blending

### Advanced Prompt Export
- [ ] Export as JSON structured data
- [ ] Export as plain text prompt
- [ ] Copy to clipboard functionality
- [ ] Prompt history with favorites
- [ ] Share prompt templates


## Chatbot Persistent Memory & RAG System - COMPLETED

### Persistent Memory System
- [x] Add conversation summaries table for long-term memory
- [x] Implement user preferences/facts extraction and storage
- [x] Create memory retrieval system for context-aware responses
- [x] Add memory indicators in chat UI (show what AI remembers)
- [x] Implement memory management (view, edit, delete memories)

### RAG (Retrieval-Augmented Generation) System
- [x] Create knowledge base for AI influencer domain expertise
- [x] Implement keyword-based search (vector embeddings not needed for MVP)
- [x] Build knowledge retrieval pipeline for relevant context
- [x] Add platform features knowledge (pricing, features, how-to)
- [x] Include best practices for content creation and engagement

### Enhanced Chat Features
- [x] Proactive internal linking to relevant pages (Studio, Gallery, Pricing)
- [x] Context-aware content recommendations based on conversation
- [x] Improved personality consistency with memory
- [x] Multi-session conversation continuity



## Knowledge Base Admin Panel - COMPLETED

### Database
- [x] Create knowledge_base table in database
- [x] Migration for existing hardcoded knowledge items (19 items)

### Backend API
- [x] List all knowledge items endpoint
- [x] Create new knowledge item endpoint
- [x] Update knowledge item endpoint
- [x] Delete knowledge item endpoint
- [x] Search knowledge items endpoint
- [x] Get stats endpoint
- [x] Get categories endpoint

### Admin UI
- [x] Knowledge base management page (/admin/knowledge)
- [x] Data table with all knowledge items
- [x] Add new item dialog with form
- [x] Edit item dialog with form
- [x] Delete confirmation dialog
- [x] Category and content type filters
- [x] Search functionality
- [x] Priority ordering (slider 1-10)
- [x] Stats cards (total, active, categories, types)
- [x] Toggle active/inactive status
- [x] Tags management (comma-separated)
- [x] Link from Admin Dashboard
