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


## Knowledge Base Enhancements - NEW

### RAG Database Integration
- [x] Update chatRAG.ts to fetch from database instead of hardcoded
- [x] Update SQL queries to use knowledge_base table
- [x] Test RAG system with database knowledge

### Bulk Import/Export
- [x] Create CSV export endpoint
- [x] Create JSON export endpoint
- [x] Create CSV import endpoint with validation
- [x] Create JSON import endpoint with validation
- [x] Preview import functionality
- [x] Add export button in admin UI
- [x] Add import button with file upload in admin UI
- [x] Handle duplicate entries on import (skip or overwrite options)

### Version History
- [x] Create knowledge_base_history table
- [x] Track who made changes (user_id)
- [x] Track what changed (old/new values)
- [x] Create history endpoints (get history, get recent, restore)
- [x] Integrate history tracking into create/update/delete
- [x] Add "View History" button in admin UI
- [x] Show history dialog with timeline
- [x] Add "Restore Version" functionality (backend)


## Chatbot Analytics Dashboard - COMPLETED

### Backend Analytics
- [x] Create analytics aggregation queries
- [x] Total conversations count endpoint
- [x] Active users count endpoint
- [x] Average messages per conversation endpoint
- [x] Top topics/keywords endpoint
- [x] Sentiment distribution endpoint
- [x] Engagement metrics (satisfaction score) endpoint
- [x] Time-series data for charts (daily/weekly/monthly)
- [x] Memory usage statistics endpoint

### Dashboard UI
- [x] Create AdminChatAnalytics page
- [x] Overview cards (total conversations, active users, avg messages, satisfaction score)
- [x] Conversations over time chart (line chart with recharts)
- [x] Top topics bar chart
- [x] Sentiment distribution pie chart
- [x] Memory insights section with category breakdown
- [x] Recent conversations table with mood and engagement badges
- [ ] Date range filter (UI placeholder added)
- [ ] Export analytics report button (UI placeholder added)

### Integration
- [x] Add link from Admin Dashboard to Chat Analytics
- [x] Add route in App.tsx (/admin/chat-analytics)
- [x] Style with consistent design system


## Explore/Discovery Section (Foxy.ai Inspired) - NEW

### Database Schema
- [ ] Create public_characters table (shared AI influencers)
- [ ] Create preset_marketplace table (shareable prompt presets)
- [ ] Create character_likes table (user engagement tracking)
- [ ] Create character_views table (analytics)
- [ ] Add is_public flag to existing characters table

### Character Gallery
- [ ] Public character gallery with grid/list view
- [ ] Character detail modal with stats and preview images
- [ ] Filter by category (fashion, fitness, lifestyle, business, etc.)
- [ ] Filter by style (realistic, anime, artistic, cinematic)
- [ ] Search by name, tags, creator
- [ ] Sort by trending, newest, most liked, most viewed
- [ ] "Use This Character" button to clone to user's account

### Preset Marketplace
- [ ] Browse prompt presets created by community
- [ ] Preset categories (portrait, action, scene, product, etc.)
- [ ] Preview images for each preset
- [ ] "Try This Preset" button to apply to user's character
- [ ] Like and save favorite presets
- [ ] Creator attribution and stats

### Trending & Discovery
- [ ] Trending characters section (most views/likes in 7 days)
- [ ] Featured creators spotlight
- [ ] "New This Week" section
- [ ] Personalized recommendations based on user's style

### Collaboration Features
- [ ] Share character publicly toggle in Studio
- [ ] Share preset publicly toggle
- [ ] Creator profile pages with their public characters
- [ ] Follow/unfollow creators
- [ ] Activity feed showing new public characters

### Batch Generation
- [ ] Select multiple presets at once
- [ ] Generate all selected presets in one batch
- [ ] Progress indicator for batch jobs
- [ ] Download all results as ZIP

### Integration
- [ ] Add "Explore" link to main navigation
- [ ] Add "Share Publicly" button in Studio
- [ ] Add "My Public Characters" section in user dashboard


## APOB.ai Inspired Features - PRIORITY ⭐

### Model Library System (Phase 1 - Core) ✅
- [x] Create "My Models" page to manage multiple AI characters
- [x] Save character settings as reusable models
- [x] Model cards with preview image, name, description
- [x] Edit/delete/duplicate models
- [x] Set model as private or public
- [x] Model usage statistics (times used, images generated)
- [x] Quick-load model into Studio
- [x] Backend API (create, read, update, delete, duplicate)
- [x] Database table (ai_models)
- [x] Public models endpoint for marketplace

### Enhanced History Page (Phase 1 - Core)
- [ ] Comprehensive history with all generations
- [ ] Filter by date range, model, type (image/video)
- [ ] Search by prompt or tags
- [ ] Bulk actions (delete, download, publish)
- [ ] Private/public toggle for each generation
- [ ] Watermark removal option (paid tiers)
- [ ] Export history as CSV/JSON

### Voice Cloning Integration (Phase 2 - Advanced)
- [ ] Integrate ElevenLabs or similar voice API
- [ ] Create voice model from audio sample (1-5 min)
- [ ] Store voice model ID per character
- [ ] Text-to-speech with custom voice
- [ ] Voice preview before generation
- [ ] Voice library management
- [ ] Assign voice to AI influencer model

### ReVideo System (Phase 2 - Game Changer) 🔥
- [ ] Research motion transfer technology options
- [ ] Implement ReMotion: transfer motion from video to AI model
- [ ] Implement ReCharacter: swap character in video
- [ ] Implement ReStyle: change video artistic style
- [ ] Talking avatar with lip sync (Wav2Lip or similar)
- [ ] Video face swap functionality
- [ ] Preview before full generation

### Chat-to-Edit Images (Phase 2 - Advanced)
- [ ] Natural language image editing interface
- [ ] Parse edit commands ("change dress to red", "add sunglasses")
- [ ] Use DALL-E edit or SD inpainting
- [ ] Show before/after comparison
- [ ] Edit history with undo/redo
- [ ] Save edited versions

### Clothing Editor (Phase 2 - Advanced)
- [ ] Segment clothing area automatically
- [ ] Browse clothing presets (dresses, tops, pants, etc.)
- [ ] Custom clothing from text prompt
- [ ] Preserve face/body consistency
- [ ] Try-on multiple outfits quickly
- [ ] Save favorite outfits to model

### Monetization Dashboard (Phase 3 - Revenue) 💰
- [ ] Creator earnings overview
- [ ] Revenue per model analytics
- [ ] Integration with OnlyFans/Fanvue API
- [ ] Stripe Connect for direct payouts
- [ ] Revenue sharing for public models (marketplace)
- [ ] Performance metrics (views, likes, conversions)
- [ ] A/B testing for different content styles
- [ ] AI recommendations for profitable content

### Community & Marketplace (Phase 4 - Future)
- [ ] Public model marketplace
- [ ] Browse community creations
- [ ] Filter by category, style, popularity
- [ ] Clone/remix public models
- [ ] Revenue sharing (70/30 split)
- [ ] Creator profiles with followers
- [ ] Trending models section
- [ ] Featured creators spotlight

### Concurrent Generation (Technical)
- [ ] Queue system for multiple generations
- [ ] Background processing with progress tracking
- [ ] Tier-based concurrent limits (1/3/7/18)
- [ ] Priority queue for paid tiers
- [ ] Real-time progress updates via WebSocket
- [ ] Cancel/pause generation

### Advanced Pricing Tiers (Update)
- [ ] Update pricing to match APOB model
- [ ] Free: 10 credits/day, 1 model, watermark
- [ ] Pro: $10/month, 5,000 credits, 3 models
- [ ] Creator: $25/month, 50,000 credits, 10 models
- [ ] Enterprise: $75/month, 150,000 credits, 25 models, revenue sharing
- [ ] Credits rollover option
- [ ] Buy additional credit packs


## Landing Page Redesign (APOB.ai Style) - PRIORITY ⭐

### Hero Section
- [ ] Full-screen hero with AI influencer background image
- [ ] Rotating background images (slider/carousel)
- [ ] Left-aligned headline "Create your AI Influencer"
- [ ] CTA button "CREATE FOR FREE" with "No credit card needed"
- [ ] Bullet points: Scale Impact | Monetize Influence
- [ ] Stats: "#1 AI Influencer Platform" + "X+ AI Influencers"
- [ ] Minimal top navigation (Affiliates, Pricing, Blog, Language, Launch App)

### Features Section
- [ ] Two-column layout (image grid + text)
- [ ] "Studio-Quality AI Influencer Generator" headline
- [ ] Expandable text with "Expand" toggle
- [ ] "CREATE NOW" CTA button
- [ ] Instagram-style image grid showcase

### Additional Sections
- [ ] Testimonials/social proof section
- [ ] Feature highlights with icons
- [ ] Pricing preview cards
- [ ] FAQ accordion
- [ ] Footer with links

### Technical
- [ ] Responsive design (mobile-first)
- [ ] Image optimization and lazy loading
- [ ] Smooth scroll animations
- [ ] Dark/light theme support


## SEO & Marketing System - PRIORITY ⭐

### Technical SEO
- [ ] Dynamic meta tags per page (title, description, og:image)
- [ ] XML sitemap generation (/sitemap.xml)
- [ ] Robots.txt configuration
- [ ] Canonical URLs
- [ ] Schema.org structured data (Organization, Product, FAQ)
- [ ] Open Graph tags for social sharing
- [ ] Twitter Card meta tags

### Blog System
- [ ] Create blog page with article listing
- [ ] Individual blog post pages
- [ ] Categories and tags
- [ ] Author profiles
- [ ] Related posts suggestions
- [ ] SEO-optimized URLs (/blog/how-to-create-ai-influencer)

### Content Strategy
- [ ] Keyword research integration
- [ ] Content calendar management
- [ ] AI-generated blog post drafts
- [ ] Internal linking suggestions
- [ ] Content performance analytics

### Marketing Dashboard
- [ ] Traffic sources overview
- [ ] Keyword rankings tracker
- [ ] Conversion funnel analytics
- [ ] A/B test results
- [ ] Social media metrics integration
- [ ] Email campaign performance


## Video Features (from YouTube tutorial) - NEW

### ReVideo Motion Transfer
- [ ] Upload source video for motion extraction
- [ ] Apply motion to AI character
- [ ] Lip sync with audio
- [ ] Expression transfer
- [ ] Body pose transfer
- [ ] Preview before generation

### Talking Avatar
- [ ] Text-to-speech with custom voice
- [ ] Lip sync animation
- [ ] Expression presets (happy, sad, excited, etc.)
- [ ] Background selection
- [ ] Export as MP4/GIF

### Video Templates
- [ ] Pre-made video templates (TikTok, Instagram Reels, YouTube Shorts)
- [ ] Aspect ratio presets (9:16, 16:9, 1:1)
- [ ] Duration presets (15s, 30s, 60s)
- [ ] Music/audio library
- [ ] Text overlay templates



## APOB.ai Style Landing Page Redesign - COMPLETED
- [x] Fullscreen hero section with AI influencer background
- [x] Rotating background images (3 images)
- [x] Lime-green accent color scheme
- [x] Left-aligned headline "Create your AI Influencer"
- [x] Clear CTA buttons (CREATE FOR FREE, Watch Demo)
- [x] Minimal top navigation (AFFILIATES, PRICING, BLOG, LAUNCH APP)
- [x] Stats section (600K+ influencers, 50K+ creators, 4.9/5 rating, $2M+ earnings)
- [x] Two-column features section with image grid
- [x] Use cases section (Instagram, Twitter/X, YouTube, OnlyFans)
- [x] Features grid (6 features)
- [x] How it works (3 steps)
- [x] Final CTA section
- [x] Footer with links

## SEO System & Blog - COMPLETED
- [x] Create Blog page with article listing
- [x] Create BlogPost page for individual articles
- [x] Add blog articles database schema
- [x] Add seed blog articles (3 SEO-optimized articles)
- [x] Blog API endpoints (list, getBySlug, getCategories, getRecent, search)
- [x] Blog unit tests (345 tests passing)
- [ ] Implement SEO meta tags per page
- [ ] Add Open Graph tags for social sharing
- [ ] Create sitemap.xml generator
- [ ] Add robots.txt
- [ ] Implement structured data (JSON-LD)

## Video Features (ReVideo, Talking Avatar) - PLANNED
- [ ] Research ReVideo integration
- [ ] Implement talking avatar feature
- [ ] Add lip sync capabilities
- [ ] Create video generation UI



## Enhancor.ai Design Integration - IN PROGRESS
- [ ] Redesign landing page in Enhancor.ai style (hero carousel, blue accents, bold condensed typography)
- [ ] Update navigation: Face Gen, Upscaler, Voice Clone, Motion + ENTER APP button
- [ ] Add hero carousel with 3 slides rotating (Face Gen, Voice Clone, Build Influencers)
- [ ] Add "What's New" AI models section with horizontal scrollable cards
- [ ] Add mission statement section (large italic text + description + CTA)
- [ ] Add before/after comparison section
- [ ] Update color scheme to royal blue (#3B5BFE) accent on black background
- [ ] Add "SCROLL" indicator at bottom of hero
- [ ] Bold condensed uppercase headlines

## AI Clone Workflow Integration (from nicola.ai docs)
- [ ] Add Prompt Library page with template categories
- [ ] Add AI Clone Workflow guide (6-step process)
- [ ] Add Historical Prompts template section (16 eras)
- [ ] Add Skyfall-style creative prompt templates
- [ ] Add prompt template cards with copy-to-clipboard


## Enhancor.ai Design Integration - COMPLETED
- [x] Redesign landing page with Enhancor.ai-style hero carousel
- [x] Bold condensed Oswald typography for headlines
- [x] Blue accent color scheme
- [x] Feature-based navigation (Face Gen, Upscaler, Voice Clone, Motion)
- [x] White pill ENTER APP button
- [x] Core Technologies sidebar
- [x] What's New AI Models section with horizontal scrollable cards
- [x] Mission statement section
- [x] Features grid, 3-step workflow, platform icons
- [x] Dynamic sitemap.xml and robots.txt
- [x] Blog comments & ratings database tables
- [x] 6 SEO-optimized blog articles in database


## Blog Comments UI & Star Rating - COMPLETED
- [x] Comment form component with text input
- [x] Star rating component (1-5 stars)
- [x] Comments list with user avatars and timestamps
- [x] Reply to comments functionality
- [x] Average rating display on article cards
- [x] Integration with existing blog API endpoints

## Google Docs Features Integration - COMPLETED
- [x] Analyze and implement features from 3 Google documents
- [x] Prompt Library page with 12 templates (Skyfall, Historical, Portrait, Fashion, Fantasy, Commercial)
- [x] AI Clone Workflow page (6-step guided process)
- [x] Category filtering and search in Prompt Library
- [x] Copy-to-clipboard for all prompts
- [x] Routes added: /prompts, /workflow

## A/B Testing CTA Buttons - COMPLETED
- [x] CREATE NOW vs START FREE A/B test
- [x] Track click events and conversion rates (impressions + clicks)
- [x] Store variant assignments in localStorage
- [x] ABTestCTA component with analytics beacon
- [x] getABTestStats() utility for reading results
- [ ] Display conversion data in admin dashboard (future)


## Bug: Generation fails with empty imageUrl - FIXED
- [x] Fix INSERT into generations failing because imageUrl is empty string
- [x] Replaced MCP CLI (sandbox-only) with built-in generateImage helper
- [x] Ensure image generation completes before saving to database


## Loading Indicator - COMPLETED
- [x] Add animated loading indicator to Studio image preview area
- [x] Show generation progress steps (Analyzing prompt → Creating image → Enhancing details → Uploading)
- [x] Progress bar with smooth animation
- [x] Step-by-step status with checkmarks

## Gallery with Filtering - PLANNED
- [ ] Add filtering by date (newest, oldest)
- [ ] Add filtering by status (completed, failed, pending)
- [ ] Add search by prompt text
- [ ] Grid layout with lazy loading
- [ ] Image preview modal

## Share to Social Media - COMPLETED
- [x] Share button on generated images (dropdown menu)
- [x] Share to Twitter/X, Facebook, LinkedIn
- [x] Copy link to clipboard
- [x] Native share API integration
- [x] Full share section in image preview dialog
- [ ] Copy link to clipboard
- [ ] Download image button


## Higgsfield AI Video Features (from YouTube: BEa0jyDuTrM) - COMPLETED
- [x] Motion Control: Upload reference video → animate AI character with same motion (already existed)
- [x] Talking Avatar: Script input → talking video with lip-sync (MiniMax TTS + I2V)
- [x] Consistent Character: Same face across different poses/outfits/scenes (character presets)
- [x] Content Strategy Guide page (Pinterest strategy, monetization tips)
- [x] Enhanced monetization workflow (Earn program with 5 tiers, 6 monetization strategies)
- [ ] Video export options (MP4, GIF, WebM)

## Talking Avatar Features (New)
- [x] Voice tab in Studio with 8 voice presets
- [x] 16 supported languages including Czech
- [x] 6 emotion options (happy, neutral, sad, angry, surprised, fearful)
- [x] Speed control (0.5x - 2.0x)
- [x] Script templates (Product Review, Daily Vlog, Brand Promo, Tutorial, Motivational)
- [x] Audio generation via MiniMax text_to_audio
- [x] Video generation via MiniMax I2V model
- [x] Credit deduction (2 credits for audio, 5 for video)
- [x] Audio preview with download
- [x] tRPC router with getVoices, generateAudio, generateVideo endpoints

## Earn Program & Content Strategy (New)
- [x] Earn Program with 5 tiers (Starter → Legend)
- [x] Increasing rates per view ($0.001 → $0.008)
- [x] 6 monetization strategies with step-by-step guides
- [x] Content Strategy Playbook (5 categories)
- [x] Pinterest Strategy guide (6 steps)
- [x] Platform domination section (Instagram, YouTube, Twitter, Pinterest)
- [x] Earnings calculator
- [x] Navigation link to /earn page
- [x] 385 tests passing (20 test files)

## Bug Fixes
- [x] Fix mobile responsive: "What's New" cards cut off on right side on mobile
- [x] Add swipe indicator (dots/arrows) for What's New cards on mobile
- [x] Implement sticky bottom navigation bar on mobile
- [x] Review entire landing page for mobile overflow issues and fix them
- [x] Implement lazy loading for all images across the site (15 img tags)
- [x] Redesign mobile hamburger menu into full-screen overlay with large touch targets
- [x] Add pull-to-refresh feature on Gallery and Studio pages
- [x] Add decoding="async" to all 15 img tags + ResponsiveImage component with size presets
- [x] Add PWA manifest, Service Worker (cache-first images, stale-while-revalidate assets, network-first HTML), offline banner
- [x] Integrate haptic feedback: pull-to-refresh (progressive + threshold), swipe cards, bottom nav, dot indicators
- [x] Custom "Add to Home Screen" PWA install banner for mobile devices
- [x] Push notifications via Service Worker for image/video generation completion
- [x] Server-side image processing for automatic WebP/AVIF conversion (sharp + auto-convert on generation)
- [x] PWA analytics dashboard (installs, offline sessions, notification engagement) - /admin/pwa-analytics
- [x] Integrate NotificationSettings into Studio Voice tab
- [x] Image CDN endpoint for dynamic resize and format conversion (generation.transformImage tRPC endpoint)

## Mobile Device Behavior Tracking & Optimizations
- [x] Enhanced mobile device tracking (touch events, viewport, device info, session duration, scroll depth)
- [x] A/B test for PWA install banner (3 variants: Speed/Offline, Creative Studio, Exclusive Features)
- [x] In-memory cache layer for transformed images (500 entries, 24h TTL, LRU eviction)
- [x] Connect push notifications with generation completion webhook on backend (notifyGenerationComplete)

## Statistical Significance & Heatmap & Weekly Report
- [x] A/B test statistical significance: chi-squared test, p-value, confidence interval, winner detection
- [x] Server-side per-variant A/B analytics query (getPwaABTestResults)
- [x] Updated PwaAnalytics dashboard with statistical significance cards
- [x] Touch heatmap visualization component (canvas-based)
- [x] Heatmap data collection endpoint (per-page touch coordinates)
- [x] Heatmap section in PWA Analytics dashboard
- [x] Automated weekly report via scheduled task (PWA metrics, A/B results, mobile engagement)
- [x] Weekly report notifyOwner integration
- [x] Unit tests for statistical significance calculations (13 tests, 398 total passing)

## Report Export, A/B Auto-Optimization & Scroll Depth Heatmap
- [x] Weekly report PDF export (HTML-based, print-to-PDF in new tab)
- [x] Weekly report CSV export with proper escaping
- [x] Export buttons in PWA Analytics dashboard (Report tab)
- [x] Server-side export endpoints (exportReportCSV, exportReportHTML)
- [x] Thompson Sampling multi-armed bandit algorithm (shared/abAutoOptimize.ts)
- [x] Auto-optimize toggle in admin panel (A/B Test tab)
- [x] Weighted variant selection in client-side A/B test library
- [x] Traffic allocation visualization with P(best) and Beta params
- [x] Cached weights with 30min TTL for client-side use
- [x] Scroll depth tracking at every 10% increment (enhanced useMobileTracking)
- [x] ScrollDepthHeatmap component with per-page visualization
- [x] Fold line detection (50% drop-off point)
- [x] New "Scroll Depth" tab in PWA Analytics dashboard
- [x] Server-side scroll depth data query endpoint
- [x] Unit tests for all 3 features (31 new tests, 429 total passing)

## Cohort Analysis
- [x] Shared cohort analysis types and utility functions (shared/cohortAnalysis.ts)
- [x] Server-side cohort retention query (group users by registration week/month, track activity per period)
- [x] Server-side cohort revenue query (credit purchases + subscription revenue per cohort)
- [x] Server-side cohort engagement query (generations, sessions, PWA events per cohort)
- [x] tRPC endpoint for cohort data (admin-only, cohort.getAnalysis)
- [x] Cohort retention heatmap component (color-coded grid with retention/revenue/generations views)
- [x] Cohort summary cards (avg retention, best/worst cohort, LTV, trend detection)
- [x] Average retention curve SVG visualization
- [x] Period selector (weekly/monthly) + time range selector (3/6/12 months)
- [x] Key insights section with actionable recommendations
- [x] New Cohort Analysis page at /admin/cohort-analysis
- [x] Route registration in App.tsx + admin dashboard navigation link
- [x] Unit tests for cohort analysis (31 tests, 460 total passing)
