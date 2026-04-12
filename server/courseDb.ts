import { eq, and, desc, asc, count } from "drizzle-orm";
import { getDb } from "./db";
import {
  courseModules, courseLessons, courseEnrollments, courseProgress,
  testimonials, courseBonuses,
  type CourseModule, type CourseLesson, type CourseEnrollment,
  type CourseProgress, type Testimonial, type CourseBonus,
} from "../drizzle/schema";

async function getDbOrThrow() {
  const d = await getDb();
  if (!d) throw new Error("Database not available");
  return d;
}

// ─── Modules ─────────────────────────────────────────────────────────────────

export async function getCourseModules(): Promise<CourseModule[]> {
  const d = await getDbOrThrow();
  return d.select().from(courseModules)
    .where(eq(courseModules.isActive, true))
    .orderBy(asc(courseModules.order));
}

export async function getCourseModuleById(id: number): Promise<CourseModule | null> {
  const d = await getDbOrThrow();
  const rows = await d.select().from(courseModules).where(eq(courseModules.id, id));
  return rows[0] ?? null;
}

export async function createCourseModule(data: {
  title: string; description?: string; order?: number; duration?: string;
}): Promise<CourseModule> {
  const d = await getDbOrThrow();
  const result = await d.insert(courseModules).values({
    title: data.title,
    description: data.description,
    order: data.order ?? 0,
    duration: data.duration,
  });
  const id = (result as any)[0]?.insertId;
  const row = await getCourseModuleById(Number(id));
  if (!row) throw new Error("Failed to create module");
  return row;
}

export async function updateCourseModule(id: number, data: Partial<{
  title: string; description: string; order: number; duration: string; isActive: boolean;
}>): Promise<void> {
  const d = await getDbOrThrow();
  await d.update(courseModules).set(data).where(eq(courseModules.id, id));
}

export async function deleteCourseModule(id: number): Promise<void> {
  const d = await getDbOrThrow();
  await d.update(courseModules).set({ isActive: false }).where(eq(courseModules.id, id));
}

// ─── Lessons ─────────────────────────────────────────────────────────────────

export async function getLessonsByModule(moduleId: number): Promise<CourseLesson[]> {
  const d = await getDbOrThrow();
  return d.select().from(courseLessons)
    .where(and(eq(courseLessons.moduleId, moduleId), eq(courseLessons.isActive, true)))
    .orderBy(asc(courseLessons.order));
}

export async function getLessonById(id: number): Promise<CourseLesson | null> {
  const d = await getDbOrThrow();
  const rows = await d.select().from(courseLessons).where(eq(courseLessons.id, id));
  return rows[0] ?? null;
}

export async function createLesson(data: {
  moduleId: number; title: string; description?: string; videoUrl?: string;
  content?: string; order?: number; duration?: string; isPreview?: boolean;
}): Promise<CourseLesson> {
  const d = await getDbOrThrow();
  const result = await d.insert(courseLessons).values({
    moduleId: data.moduleId,
    title: data.title,
    description: data.description,
    videoUrl: data.videoUrl,
    content: data.content,
    order: data.order ?? 0,
    duration: data.duration,
    isPreview: data.isPreview ?? false,
  });
  const id = (result as any)[0]?.insertId;
  const row = await getLessonById(Number(id));
  if (!row) throw new Error("Failed to create lesson");
  return row;
}

export async function updateLesson(id: number, data: Partial<{
  title: string; description: string; videoUrl: string; content: string;
  order: number; duration: string; isPreview: boolean; isActive: boolean;
}>): Promise<void> {
  const d = await getDbOrThrow();
  await d.update(courseLessons).set(data).where(eq(courseLessons.id, id));
}

// ─── Enrollments ─────────────────────────────────────────────────────────────

export async function isUserEnrolled(userId: number): Promise<boolean> {
  const d = await getDbOrThrow();
  const rows = await d.select({ id: courseEnrollments.id })
    .from(courseEnrollments)
    .where(eq(courseEnrollments.userId, userId));
  return rows.length > 0;
}

export async function getEnrollment(userId: number): Promise<CourseEnrollment | null> {
  const d = await getDbOrThrow();
  const rows = await d.select().from(courseEnrollments)
    .where(eq(courseEnrollments.userId, userId));
  return rows[0] ?? null;
}

export async function createEnrollment(data: {
  userId: number; stripePaymentIntentId?: string;
  paymentPlan?: "full" | "installment"; amountPaid?: string;
}): Promise<CourseEnrollment> {
  const d = await getDbOrThrow();
  const result = await d.insert(courseEnrollments).values({
    userId: data.userId,
    stripePaymentIntentId: data.stripePaymentIntentId,
    paymentPlan: data.paymentPlan ?? "full",
    amountPaid: data.amountPaid ?? "0",
  });
  const id = (result as any)[0]?.insertId;
  const rows = await d.select().from(courseEnrollments).where(eq(courseEnrollments.id, Number(id)));
  if (!rows[0]) throw new Error("Failed to create enrollment");
  return rows[0];
}

export async function getEnrollmentCount(): Promise<number> {
  const d = await getDbOrThrow();
  const rows = await d.select({ cnt: count() }).from(courseEnrollments);
  return Number(rows[0]?.cnt ?? 0);
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export async function getUserProgress(userId: number): Promise<CourseProgress[]> {
  const d = await getDbOrThrow();
  return d.select().from(courseProgress).where(eq(courseProgress.userId, userId));
}

export async function markLessonComplete(userId: number, lessonId: number): Promise<void> {
  const d = await getDbOrThrow();
  const existing = await d.select({ id: courseProgress.id })
    .from(courseProgress)
    .where(and(eq(courseProgress.userId, userId), eq(courseProgress.lessonId, lessonId)));
  if (existing.length === 0) {
    await d.insert(courseProgress).values({ userId, lessonId });
  }
}

export async function unmarkLessonComplete(userId: number, lessonId: number): Promise<void> {
  const d = await getDbOrThrow();
  await d.delete(courseProgress)
    .where(and(eq(courseProgress.userId, userId), eq(courseProgress.lessonId, lessonId)));
}

export async function getUserProgressPercent(userId: number): Promise<number> {
  const d = await getDbOrThrow();
  const totalRows = await d.select({ cnt: count() }).from(courseLessons)
    .where(eq(courseLessons.isActive, true));
  const total = Number(totalRows[0]?.cnt ?? 0);
  if (total === 0) return 0;
  const completedRows = await d.select({ cnt: count() }).from(courseProgress)
    .where(eq(courseProgress.userId, userId));
  const completed = Number(completedRows[0]?.cnt ?? 0);
  return Math.round((completed / total) * 100);
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

export async function getTestimonials(featuredOnly = false): Promise<Testimonial[]> {
  const d = await getDbOrThrow();
  const conditions = featuredOnly
    ? and(eq(testimonials.isActive, true), eq(testimonials.isFeatured, true))
    : eq(testimonials.isActive, true);
  return d.select().from(testimonials).where(conditions).orderBy(desc(testimonials.createdAt));
}

export async function createTestimonial(data: {
  name: string; role?: string; content: string; avatarUrl?: string;
  rating?: number; isFeatured?: boolean;
}): Promise<Testimonial> {
  const d = await getDbOrThrow();
  const result = await d.insert(testimonials).values({
    name: data.name,
    role: data.role,
    content: data.content,
    avatarUrl: data.avatarUrl,
    rating: data.rating ?? 5,
    isFeatured: data.isFeatured ?? false,
  });
  const id = (result as any)[0]?.insertId;
  const rows = await d.select().from(testimonials).where(eq(testimonials.id, Number(id)));
  if (!rows[0]) throw new Error("Failed to create testimonial");
  return rows[0];
}

export async function updateTestimonial(id: number, data: Partial<{
  name: string; role: string; content: string; avatarUrl: string;
  rating: number; isFeatured: boolean; isActive: boolean;
}>): Promise<void> {
  const d = await getDbOrThrow();
  await d.update(testimonials).set(data).where(eq(testimonials.id, id));
}

export async function deleteTestimonial(id: number): Promise<void> {
  const d = await getDbOrThrow();
  await d.update(testimonials).set({ isActive: false }).where(eq(testimonials.id, id));
}

// ─── Bonuses ─────────────────────────────────────────────────────────────────

export async function getCourseBonuses(): Promise<CourseBonus[]> {
  const d = await getDbOrThrow();
  return d.select().from(courseBonuses)
    .where(eq(courseBonuses.isActive, true))
    .orderBy(asc(courseBonuses.order));
}

export async function createCourseBonus(data: {
  title: string; description?: string; value?: string; icon?: string; order?: number;
}): Promise<CourseBonus> {
  const d = await getDbOrThrow();
  const result = await d.insert(courseBonuses).values({
    title: data.title,
    description: data.description,
    value: data.value ?? "0",
    icon: data.icon,
    order: data.order ?? 0,
  });
  const id = (result as any)[0]?.insertId;
  const rows = await d.select().from(courseBonuses).where(eq(courseBonuses.id, Number(id)));
  if (!rows[0]) throw new Error("Failed to create bonus");
  return rows[0];
}

// ─── Seed data ────────────────────────────────────────────────────────────────

export const SEED_COURSE_MODULES = [
  {
    title: "Module 1: Meet Your AI Influencer",
    description: "Understand the AI influencer landscape, tools, and the business opportunity. Learn what makes a successful AI persona and how to position yourself.",
    order: 1,
    duration: "45 min",
  },
  {
    title: "Module 2: Creating Your AI Persona",
    description: "Build a hyper-realistic AI influencer from scratch. Master face generation, voice cloning, and persona customization for maximum authenticity.",
    order: 2,
    duration: "90 min",
  },
  {
    title: "Module 3: Content Creation at Scale",
    description: "Generate unlimited photos, videos, and content without ever being on camera. Learn batch production, scheduling, and content calendar strategies.",
    order: 3,
    duration: "75 min",
  },
  {
    title: "Module 4: Monetization & Revenue Streams",
    description: "Turn your AI influencer into a revenue machine. Explore OnlyFans, brand deals, affiliate marketing, digital products, and fan subscriptions.",
    order: 4,
    duration: "60 min",
  },
  {
    title: "Module 5: Growth & Automation",
    description: "Scale your AI influencer business with automation tools, fan engagement systems, and multi-platform distribution strategies.",
    order: 5,
    duration: "80 min",
  },
];

export const SEED_TESTIMONIALS = [
  {
    name: "Sarah K.",
    role: "AI Creator, 12k followers",
    content: "I went from zero to $3,200/month in my first 60 days using the exact system from this course. The AI tools are insane — I create a week's worth of content in 2 hours.",
    rating: 5,
    isFeatured: true,
  },
  {
    name: "Marcus T.",
    role: "Digital Entrepreneur",
    content: "The monetization module alone was worth 10x the price. I had no idea how many revenue streams were available. Now running 3 AI influencer accounts simultaneously.",
    rating: 5,
    isFeatured: true,
  },
  {
    name: "Priya M.",
    role: "Content Creator",
    content: "As someone with zero tech background, I was nervous. But the step-by-step tutorials made everything crystal clear. Had my first AI influencer live within a week.",
    rating: 5,
    isFeatured: true,
  },
  {
    name: "Jake R.",
    role: "Affiliate Marketer",
    content: "The affiliate marketing integration is genius. My AI influencer promotes products 24/7 without me lifting a finger. Passive income is real.",
    rating: 5,
    isFeatured: false,
  },
  {
    name: "Emma L.",
    role: "Social Media Manager",
    content: "I manage AI influencers for 5 clients now. This course gave me the skills to build a whole agency around this. Best investment of 2024.",
    rating: 5,
    isFeatured: false,
  },
];

export const SEED_BONUSES = [
  {
    title: "AI Influencer Prompt Vault",
    description: "500+ proven image and video prompts organized by niche, style, and platform. Copy-paste ready for instant content creation.",
    value: "197",
    icon: "Sparkles",
    order: 1,
  },
  {
    title: "Monetization Blueprint PDF",
    description: "Step-by-step revenue roadmap showing exactly how to set up 5 income streams in your first 30 days. Includes platform comparison and rate cards.",
    value: "97",
    icon: "TrendingUp",
    order: 2,
  },
  {
    title: "Private Community Access",
    description: "Join 500+ AI creators in our exclusive community. Share wins, get feedback, access weekly live Q&As, and network with top earners.",
    value: "297",
    icon: "Users",
    order: 3,
  },
];
