import { Express, Request, Response } from "express";
import { getDb } from "./db";
import { blogArticles } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "https://aiinfluencer.ai";

const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/studio", priority: "0.9", changefreq: "weekly" },
  { path: "/pricing", priority: "0.8", changefreq: "monthly" },
  { path: "/blog", priority: "0.8", changefreq: "daily" },
  { path: "/affiliate", priority: "0.7", changefreq: "monthly" },
  { path: "/gallery", priority: "0.7", changefreq: "weekly" },
  { path: "/models", priority: "0.7", changefreq: "weekly" },
  { path: "/companions", priority: "0.6", changefreq: "weekly" },
];

export function registerSeoRoutes(app: Express) {
  app.get("/sitemap.xml", async (_req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) {
        res.set("Content-Type", "application/xml");
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
        for (const page of STATIC_PAGES) {
          xml += `\n  <url><loc>${BASE_URL}${page.path}</loc></url>`;
        }
        xml += `\n</urlset>`;
        return res.send(xml);
      }
      const articles = await db
        .select({ slug: blogArticles.slug, updatedAt: blogArticles.updatedAt })
        .from(blogArticles)
        .where(eq(blogArticles.status, "published"));

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

      for (const page of STATIC_PAGES) {
        xml += `
  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
      }

      for (const article of articles) {
        xml += `
  <url>
    <loc>${BASE_URL}/blog/${article.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    ${article.updatedAt ? `<lastmod>${new Date(article.updatedAt).toISOString().split("T")[0]}</lastmod>` : ""}
  </url>`;
      }

      xml += `
</urlset>`;

      res.set("Content-Type", "application/xml");
      res.send(xml);
    } catch (error) {
      console.error("[SEO] Sitemap error:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  app.get("/robots.txt", (_req: Request, res: Response) => {
    const robots = `User-agent: *
Allow: /
Allow: /blog/
Allow: /pricing
Allow: /affiliate

Disallow: /api/
Disallow: /admin/
Disallow: /studio
Disallow: /chat/

Sitemap: ${BASE_URL}/sitemap.xml
`;
    res.set("Content-Type", "text/plain");
    res.send(robots);
  });
}
