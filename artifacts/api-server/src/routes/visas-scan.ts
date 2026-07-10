import { Router, type IRouter, json } from "express";
import OpenAI from "openai";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

// ─── Large-body parser scoped to this router only ────────────────────────────
const largeJson = json({ limit: "20mb" });

// ─── OpenAI client ────────────────────────────────────────────────────────────
function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not configured");
  return new OpenAI({ apiKey: key });
}

// ─── Safe JSON parse with strict schema defaults ──────────────────────────────
function parsePhotoValidation(text: string): {
  valid: boolean;
  issues: string[];
  checks: Record<string, boolean>;
} {
  try {
    const clean = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```\s*$/m, "").trim();
    const parsed = JSON.parse(clean);
    return {
      valid: parsed.valid === true,
      issues: Array.isArray(parsed.issues) ? parsed.issues.map(String) : [],
      checks: parsed.checks && typeof parsed.checks === "object" ? parsed.checks : {},
    };
  } catch {
    return { valid: false, issues: ["تعذر تحليل استجابة النظام، يرجى المحاولة مجدداً"], checks: {} };
  }
}

function parsePassportScan(text: string): {
  valid: boolean;
  issues: string[];
  data: Record<string, string>;
} {
  const emptyData = {
    firstName: "", middleName: "", lastName: "", fullName: "",
    passportNumber: "", nationality: "", nationalityAr: "", gender: "",
    dateOfBirth: "", placeOfBirth: "", issuingCountry: "", issueDate: "",
    expiryDate: "", nationalId: "", mrz: "",
  };
  try {
    const clean = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```\s*$/m, "").trim();
    const parsed = JSON.parse(clean);
    return {
      valid: parsed.valid === true,
      issues: Array.isArray(parsed.issues) ? parsed.issues.map(String) : [],
      data: parsed.data && typeof parsed.data === "object"
        ? { ...emptyData, ...Object.fromEntries(Object.entries(parsed.data).map(([k, v]) => [k, String(v ?? "")])) }
        : emptyData,
    };
  } catch {
    return {
      valid: false,
      issues: ["تعذر تحليل استجابة النظام، يرجى المحاولة مجدداً"],
      data: emptyData,
    };
  }
}

// ─── POST /api/visas/validate-photo ──────────────────────────────────────────
router.post("/visas/validate-photo", requireAuth, largeJson, async (req, res): Promise<void> => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body as {
      imageBase64?: string;
      mimeType?: string;
    };

    if (!imageBase64 || typeof imageBase64 !== "string") {
      res.status(400).json({ error: "imageBase64 is required" });
      return;
    }

    // Sanity-check: base64 string shouldn't exceed ~15 MB after encoding
    if (imageBase64.length > 20_000_000) {
      res.status(413).json({ error: "الصورة كبيرة جداً، يرجى اختيار صورة أصغر" });
      return;
    }

    const safeMime = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType)
      ? mimeType
      : "image/jpeg";

    const openai = getOpenAI();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 600,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a visa photo validator. Analyze this photo and check if it meets international visa/passport photo requirements.

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "valid": boolean,
  "issues": string[],
  "checks": {
    "faceVisible": boolean,
    "faceFacingForward": boolean,
    "whiteOrLightBackground": boolean,
    "noSunglasses": boolean,
    "highQuality": boolean,
    "fullFaceVisible": boolean,
    "noCovering": boolean
  }
}

Rules:
- "valid" = true only if ALL checks pass
- Religious head coverings are acceptable (set "noCovering" = true if only face is covered for religious reasons)
- "issues": each issue in Arabic only, e.g. "الخلفية يجب أن تكون بيضاء", "الوجه غير واضح"
- Be strict but fair`,
            },
            {
              type: "image_url",
              image_url: { url: `data:${safeMime};base64,${imageBase64}`, detail: "high" },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    res.json(parsePhotoValidation(content));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "فشل التحقق من الصورة";
    res.status(500).json({ error: message });
  }
});

// ─── POST /api/visas/scan-passport ───────────────────────────────────────────
router.post("/visas/scan-passport", requireAuth, largeJson, async (req, res): Promise<void> => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body as {
      imageBase64?: string;
      mimeType?: string;
    };

    if (!imageBase64 || typeof imageBase64 !== "string") {
      res.status(400).json({ error: "imageBase64 is required" });
      return;
    }

    if (imageBase64.length > 20_000_000) {
      res.status(413).json({ error: "الصورة كبيرة جداً، يرجى اختيار صورة أصغر" });
      return;
    }

    const safeMime = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType)
      ? mimeType
      : "image/jpeg";

    const openai = getOpenAI();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 1200,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a passport OCR system compliant with ICAO 9303. Extract all data from this passport image.

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "valid": boolean,
  "issues": string[],
  "data": {
    "firstName": string,
    "middleName": string,
    "lastName": string,
    "fullName": string,
    "passportNumber": string,
    "nationality": string,
    "nationalityAr": string,
    "gender": string,
    "dateOfBirth": string,
    "placeOfBirth": string,
    "issuingCountry": string,
    "issueDate": string,
    "expiryDate": string,
    "nationalId": string,
    "mrz": string
  }
}

Rules:
- "valid" = false if image is blurry, has glare, not fully visible, or not a passport
- "issues": each problem in Arabic only, e.g. "الصورة غير واضحة", "يوجد انعكاس للإضاءة"
- All dates in YYYY-MM-DD format; empty string "" if unreadable
- "gender": use "M" for male, "F" for female; empty string if unclear
- "nationalityAr": nationality in Arabic (e.g. عراقي)
- Extract from MRZ if printed text is unclear
- Use empty string "" for all missing/unreadable fields`,
            },
            {
              type: "image_url",
              image_url: { url: `data:${safeMime};base64,${imageBase64}`, detail: "high" },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    res.json(parsePassportScan(content));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "فشل قراءة الجواز";
    res.status(500).json({ error: message });
  }
});

export default router;
