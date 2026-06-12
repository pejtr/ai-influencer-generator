# AI Influencer Generator — Google Antigravity Development Handoff

## Project Overview
**Name:** AI Influencer Generator  
**Stack:** React 19 + Tailwind 4 + Express 4 + tRPC 11 + Drizzle ORM + MySQL  
**GitHub:** https://github.com/PejtrView/ai-influencer-generator  
**Current Status:** Production-ready on Manus (checkpoint: a8c14ac0)  
**Test Suite:** 716 tests passing (vitest)  
**TypeScript:** Clean, no errors

---

## Architecture

### Frontend (`client/src/`)
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS 4 + shadcn/ui components
- **State Management:** tRPC hooks (useQuery/useMutation)
- **Auth:** Manus OAuth (useAuth hook)
- **Pages:** 12 core pages + admin dashboard

### Backend (`server/`)
- **Framework:** Express 4 + tRPC 11
- **Database:** MySQL via Drizzle ORM
- **Auth:** JWT session cookies
- **LLM:** Built-in Forge API (Claude)
- **Storage:** S3 (storagePut/storageGet helpers)
- **Payments:** Stripe integration (test mode)

### Database (`drizzle/schema.ts`)
- **Tables:** 40+ (users, generations, workflows, funnels, etc.)
- **Migrations:** Drizzle Kit (pnpm db:push)
- **Connection:** TiDB/MySQL (DATABASE_URL env)

---

## Core Features (Completed)

### 1. Higgsfield Workflow Builder (`/video-workflow`)
- 4-step JSON prompt builder (Composition → Subject → Camera → Mood)
- 8 AI model selector (Kling 3.0, Cinema Studio 3.0, Veo 3, Seedance 2.0, etc.)
- 15+ camera movements library
- Cinematic Bible generator
- ElevenLabs voiceover script generator
- VIP tips panel (budget tricks, batch generation, comment-to-DM funnel)

### 2. Comment-to-DM Funnel (`/funnel`)
- Campaign manager (Instagram/TikTok/YouTube/Facebook/Twitter)
- Keyword trigger editor (exact/contains/starts_with)
- DM template editor with variables (`{name}`, `{keyword}`, `{link}`)
- Simulation mode with real-time preview
- Analytics dashboard (conversion rate tracking)

### 3. Instagram Graph API Webhook (`/instagram-connect`)
- OAuth flow for Instagram Business Account
- Webhook endpoint (`GET/POST /api/instagram/webhook`)
- SHA-256 signature verification
- Automatic Private Reply DM sending
- DM logs and statistics

### 4. POV Scene Rebuild (`/pov-rebuild`)
- AI prompt generator (7 POV perspectives)
- 8 emotion variations
- 4 AI model support
- Batch mode (up to 4 POV simultaneously)
- Send-to-Workflow-Builder integration

### 5. Monetization Hub (`/monetize`)
- dreamfall.art 3-stream model (freelance/products/brand deals)
- Interactive MRR calculator (drag sliders)
- Pre-built funnel templates
- Claude×Higgsfield automation guide (5 steps)
- 90-day action plan

### 6. AI Content System (Nicola Urbini 4-Step)

#### Step 1: Viral Idea Finder (`/idea-finder`)
- Hook swipe file manager (save/tag/search)
- Loop Detector (engagement rate calculator)
- Outlier score filter (70+ = viral)
- Send-to-Script-Studio integration

#### Step 2: AI Script Studio (`/script-studio`)
- Brand voice doc editor
- Spoken-word rules enforcer
- 3 script variations generator
- Script history with performance tracking

#### Step 3-4: Content Calendar (`/content-calendar`)
- 5-stage pipeline (Idea → Published)
- AI week plan generator (7-day content)
- Multi-platform scheduling
- Status progression tracking

### 7. Navigation & Analytics
- Creator Tools dropdown in Navbar
- Weekly Analytics Report (Monday 8:00 UTC)
- Admin Dashboard with Creator Tools stats
- Weekly report widget with manual trigger

---

## Database Schema (Key Tables)

```
users                          — Core user data
generations                    — AI image generations
workflowProjects              — Workflow Builder projects
workflowPrompts               — Saved prompts
funnelCampaigns               — Comment funnel campaigns
funnelKeywords                — Trigger keywords
funnelTemplates               — DM templates
instagramConnections          — OAuth tokens
instagramDmLogs               — Sent DM history
povRebuildHistory             — POV rebuild results
hooks                         — Viral idea hooks
brandVoice                    — Script studio brand docs
scripts                       — Generated scripts
calendarItems                 — Content calendar posts
course_enrollments            — Course access
course_modules                — Course content
course_bonuses                — Bonus materials
testimonials                  — Social proof
```

---

## Development Workflow

### Setup
```bash
git clone https://github.com/PejtrView/ai-influencer-generator.git
cd ai-influencer-generator
pnpm install
pnpm dev
```

### Key Commands
```bash
pnpm dev              # Start dev server (Vite + Express)
pnpm test             # Run vitest suite (716 tests)
pnpm db:push          # Apply Drizzle migrations
pnpm build            # Production build
```

### File Structure
```
client/src/
  pages/              — 12 feature pages
  components/         — Reusable UI (shadcn/ui)
  lib/trpc.ts         — tRPC client setup
  App.tsx             — Routes & layout
  
server/
  routers.ts          — tRPC procedures (all endpoints)
  db.ts               — Query helpers (Drizzle)
  *Router.ts          — Feature-specific routers
  _core/              — Framework plumbing (DO NOT EDIT)
  
drizzle/
  schema.ts           — Database tables
  migrations/         — Applied migrations
```

---

## tRPC Procedures (Backend API)

### Workflow Builder
- `workflowBuilder.createProject` — Save workflow project
- `workflowBuilder.getProjects` — List user projects
- `workflowBuilder.generatePrompt` — LLM-powered prompt generation
- `workflowBuilder.getModels` — AI model comparison data

### Comment Funnel
- `commentFunnel.createCampaign` — New funnel campaign
- `commentFunnel.getCampaigns` — List campaigns
- `commentFunnel.simulateFunnel` — Preview DM flow
- `commentFunnel.getAnalytics` — Conversion stats

### Instagram
- `instagram.getConnectUrl` — OAuth URL
- `instagram.disconnect` — Revoke token
- `instagram.getDmLogs` — Sent messages history
- `instagram.getDmStats` — Performance metrics
- `instagram.testDm` — Send test DM

### POV Rebuild
- `povRebuild.generateVariations` — Create POV rewrites
- `povRebuild.getHistory` — User's past generations
- `povRebuild.sendToWorkflow` — Export to Workflow Builder

### Content System
- `contentSystem.hooks.*` — Idea Finder CRUD
- `contentSystem.scripts.*` — Script Studio CRUD
- `contentSystem.calendar.*` — Content Calendar CRUD
- `contentSystem.generateWeekPlan` — AI week planner

### Admin
- `pwaAnalytics.triggerWeeklyReport` — Manual report send
- `pwaAnalytics.getCreatorToolsStats` — Metrics dashboard

---

## Environment Variables (Required)

```
DATABASE_URL                    — MySQL connection
JWT_SECRET                      — Session signing key
VITE_APP_ID                     — Manus OAuth app ID
OAUTH_SERVER_URL                — Manus OAuth backend
VITE_OAUTH_PORTAL_URL           — Manus login portal
BUILT_IN_FORGE_API_URL          — LLM API endpoint
BUILT_IN_FORGE_API_KEY          — LLM API key (server)
VITE_FRONTEND_FORGE_API_KEY     — LLM API key (client)
STRIPE_SECRET_KEY               — Stripe test key
STRIPE_WEBHOOK_SECRET           — Webhook signing key
INSTAGRAM_APP_SECRET            — Meta app secret (for webhook verification)
```

---

## Next Phase: Uncompleted Features (339 items in todo.md)

### High Priority
1. **A/B Testing DM Templates** — Variant A/B with auto-tracking
2. **Paywall System** — 5 free/day, then upgrade to Pro
3. **Onboarding Wizard** — 3-step setup (niche → Instagram → first funnel)
4. **Multi-Page Selector** — If user has multiple Facebook Pages
5. **Webhook Reliability** — Retry logic, dead letter queue

### Medium Priority
6. **Advanced Analytics** — Cohort analysis, LTV tracking
7. **Batch Export** — Download all results as CSV/JSON
8. **Content Collaboration** — Share projects with team
9. **Custom Integrations** — Zapier, Make.com webhooks
10. **Mobile App** — React Native version

### Low Priority
11. **AI Coaching** — Personalized growth recommendations
12. **Marketplace** — Buy/sell templates & scripts
13. **Community** — Creator forum & tips sharing
14. **White Label** — Reseller program

---

## Testing Strategy

### Current Coverage
- **716 tests** across all routers
- **Unit tests** for LLM integration
- **Integration tests** for Instagram webhook
- **Database tests** for Drizzle queries

### Adding Tests
```typescript
// server/feature.test.ts
import { describe, it, expect } from 'vitest';
import { trpc } from './test-utils';

describe('featureRouter', () => {
  it('should create item', async () => {
    const result = await trpc.feature.create.mutate({ name: 'test' });
    expect(result.id).toBeDefined();
  });
});
```

---

## Performance Optimization Tips

1. **Use optimistic updates** in mutations (onMutate/onError pattern)
2. **Batch queries** where possible (reduce round trips)
3. **Lazy load pages** — use React.lazy() for code splitting
4. **Cache LLM responses** — store in DB to avoid re-generation
5. **Implement rate limiting** — prevent abuse of free credits

---

## Debugging

### Server Logs
```bash
tail -f .manus-logs/devserver.log      # Server startup
tail -f .manus-logs/browserConsole.log # Client errors
tail -f .manus-logs/networkRequests.log # API calls
```

### Database Debugging
```bash
# Check connection
node -e "require('mysql2/promise').createConnection(process.env.DATABASE_URL)"

# Run raw SQL
pnpm db:studio  # Drizzle Studio (visual DB explorer)
```

### tRPC Debugging
```typescript
// Add logging to procedures
export const exampleRouter = router({
  query: publicProcedure.query(async ({ ctx }) => {
    console.log('[tRPC] query called', { userId: ctx.user?.id });
    return result;
  }),
});
```

---

## Deployment Notes

### Manus Production
- **Current:** Live on ai-influencer.manus.space
- **Auto-deploy:** On git push to main
- **Database:** Managed TiDB (auto-backups)
- **Secrets:** Managed via Settings → Secrets panel

### For External Hosting (if needed)
- Use `pnpm build` for production build
- Set `NODE_ENV=production`
- Ensure DATABASE_URL points to production DB
- Configure CORS for frontend domain
- Set up webhook HTTPS endpoint for Instagram

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `server/routers.ts` | All tRPC endpoints (main API) |
| `drizzle/schema.ts` | Database table definitions |
| `client/src/App.tsx` | Routes & navigation |
| `client/src/lib/trpc.ts` | tRPC client config |
| `server/_core/llm.ts` | LLM integration helpers |
| `server/_core/map.ts` | Google Maps integration |
| `server/storage.ts` | S3 file upload helpers |
| `todo.md` | Feature tracking & roadmap |

---

## Common Patterns

### Adding a New Feature
1. Add DB table to `drizzle/schema.ts`
2. Create query helpers in `server/db.ts`
3. Add tRPC procedures in `server/routers.ts` (or new `server/featureRouter.ts`)
4. Create frontend page in `client/src/pages/Feature.tsx`
5. Add route to `client/src/App.tsx`
6. Write vitest tests in `server/feature.test.ts`
7. Update `todo.md` with completion status

### Calling Backend from Frontend
```typescript
// In React component
const { data, isLoading } = trpc.feature.getItems.useQuery({ limit: 10 });
const mutation = trpc.feature.create.useMutation({
  onSuccess: () => trpc.useUtils().feature.getItems.invalidate(),
});

// Use optimistic update
const mutation = trpc.feature.update.useMutation({
  onMutate: async (newData) => {
    await trpc.useUtils().feature.getItems.cancel();
    const prev = trpc.useUtils().feature.getItems.getData();
    trpc.useUtils().feature.getItems.setData(prev => [...prev, newData]);
    return { prev };
  },
  onError: (err, newData, ctx) => {
    trpc.useUtils().feature.getItems.setData(ctx.prev);
  },
});
```

---

## Success Metrics

- **Activation:** 3-step onboarding completion rate
- **Engagement:** Weekly active users, feature usage
- **Monetization:** Conversion to Pro tier, MRR growth
- **Retention:** 30-day retention rate
- **Viral Loop:** Comment funnel conversion rate (target: 15%+)

---

## Contact & Support

- **GitHub Issues:** Report bugs via GitHub
- **Manus Support:** https://help.manus.im
- **Database:** Managed via Manus Dashboard
- **Secrets:** Managed via Manus Settings → Secrets

---

## Final Notes

✅ **Production Ready:** All core features tested and deployed  
✅ **Scalable:** tRPC + Drizzle + S3 architecture  
✅ **Maintainable:** 716 tests, TypeScript strict mode  
✅ **Extensible:** 339 uncompleted features in roadmap  

**Next Developer:** Start with `todo.md` to see what's next. Pick high-priority items and follow the "Adding a New Feature" pattern above.

Good luck! 🚀
