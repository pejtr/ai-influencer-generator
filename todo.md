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

