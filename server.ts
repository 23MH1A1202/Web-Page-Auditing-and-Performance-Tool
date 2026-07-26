import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MongoClient, Collection } from "mongodb";

let auditsCollection: Collection | null = null;
async function connectToMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("MONGODB_URI is not set. Audits will not be stored.");
    return;
  }
  try {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
    await client.connect();
    const db = client.db("lighthouse_clone");
    auditsCollection = db.collection("audits");
    console.log("Connected to MongoDB successfully");
  } catch (e) {
    console.error("Failed to connect to MongoDB", e);
  }
}

async function startServer() {
  await connectToMongo();
  
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for auditing
  app.post("/api/audit", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // 1. Fetch the HTML content
      let htmlContent = "";
      try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        if (!response.ok) {
           return res.status(400).json({ error: `Failed to fetch URL: ${response.statusText}` });
        }
        htmlContent = await response.text();
      } catch (e: any) {
        return res.status(400).json({ error: `Network error when fetching URL: ${e.message}` });
      }

      // Truncate HTML to avoid token limits (e.g., first 30,000 chars)
      const truncatedHtml = htmlContent.substring(0, 30000);

      // 2. Initialize Gemini
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
      }
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      // 3. Define the response schema
      const auditSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          scores: {
            type: Type.OBJECT,
            properties: {
              performance: { type: Type.INTEGER, description: "Score from 0 to 100" },
              accessibility: { type: Type.INTEGER, description: "Score from 0 to 100" },
              bestPractices: { type: Type.INTEGER, description: "Score from 0 to 100" },
              seo: { type: Type.INTEGER, description: "Score from 0 to 100" }
            },
            required: ["performance", "accessibility", "bestPractices", "seo"]
          },
          metrics: {
            type: Type.ARRAY,
            description: "Core Web Vitals and key metrics for performance.",
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "e.g., 'First Contentful Paint', 'Largest Contentful Paint', 'Cumulative Layout Shift', 'Total Blocking Time', 'Speed Index'" },
                value: { type: Type.STRING, description: "e.g., '1.2 s', '0.05'" },
                status: { type: Type.STRING, description: "One of: pass, average, fail" },
                description: { type: Type.STRING, description: "Brief explanation" }
              },
              required: ["title", "value", "status"]
            }
          },
          audits: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING, description: "One of: performance, accessibility, bestPractices, seo" },
                title: { type: Type.STRING, description: "Short title of the audit metric, e.g., 'First Contentful Paint', 'Images have alt attributes'" },
                description: { type: Type.STRING, description: "Explanation of why this matters." },
                displayValue: { type: Type.STRING, description: "Value to display, e.g., '1.2 s', '100%'" },
                status: { type: Type.STRING, description: "One of: pass, average, fail" }
              },
              required: ["category", "title", "description", "displayValue", "status"]
            }
          }
        },
        required: ["scores", "metrics", "audits"]
      };

      // 4. Generate the audit with Gemini
      const prompt = `Act as a web performance and best practices auditor (like Lighthouse). 
I will provide you with the HTML source code of a website (truncated for length).
Analyze this HTML and provide a realistic-looking audit report including scores (0-100) for Performance, Accessibility, Best Practices, and SEO.
Generate 5 detailed core metrics (First Contentful Paint, Largest Contentful Paint, Total Blocking Time, Cumulative Layout Shift, Speed Index) based on what you can infer.
Generate 2-3 specific audit items for each category (Performance, Accessibility, Best Practices, SEO) based on what you can infer from the HTML structure, meta tags, script tags, img tags, etc.
If the HTML lacks certain things (e.g. no meta description), flag it in SEO.
If it has many blocking scripts in the head, flag it in Performance.

URL: ${url}

HTML Content:
${truncatedHtml}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: auditSchema,
            temperature: 0.2
        }
      });

      if (!response.text) {
        throw new Error("No response from Gemini");
      }

      const result = JSON.parse(response.text);
      
      if (auditsCollection) {
        try {
          await auditsCollection.insertOne({
            url,
            result,
            createdAt: new Date()
          });
        } catch (e) {
          console.error("Failed to store audit in MongoDB:", e);
        }
      }

      res.json(result);

    } catch (error: any) {
      console.error("Audit error:", error);
      res.status(500).json({ error: error.message || "Failed to run audit" });
    }
  });

  // API route for history
  app.get("/api/history", async (req, res) => {
    try {
      if (!auditsCollection) {
        return res.status(503).json({ error: "Database not connected" });
      }
      const history = await auditsCollection.find({}).sort({ createdAt: -1 }).limit(20).toArray();
      res.json(history);
    } catch (error: any) {
      console.error("History error:", error);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
