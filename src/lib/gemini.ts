// src/lib/gemini.ts
// Singleton Google Gemini client. Requires GEMINI_API_KEY in the environment.
// Mirrors src/lib/stripe.ts: warn (don't throw) at import time if missing,
// so the app still boots — callers see the real error only when they
// actually try to use it.

import "server-only";
import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn(
    "[gemini] GEMINI_API_KEY is not set. AI review summaries will fail until it is configured in .env.local."
  );
}

const genAI = new GoogleGenerativeAI(apiKey ?? "placeholder");

// The installed SDK (@google/generative-ai 0.24.1) predates `thinkingConfig`
// in its types, but the API itself accepts it for thinking-capable flash
// models. Without it, the model spends its maxOutputTokens budget on hidden
// "thinking" tokens first and silently truncates the actual summary
// (finishReason: MAX_TOKENS with near-zero visible output) — disabling it
// is also the right call for a short, non-reasoning summarization task.
type GenerationConfigWithThinking = GenerationConfig & {
  thinkingConfig?: { thinkingBudget: number };
};

const generationConfig: GenerationConfigWithThinking = {
  temperature: 0.4,
  maxOutputTokens: 200,
  thinkingConfig: { thinkingBudget: 0 },
};

const model = genAI.getGenerativeModel({
  // "gemini-flash-latest" is a Google-maintained alias for the current
  // recommended flash model — pinned versions like "gemini-1.5-flash" and
  // "gemini-2.0-flash" have since been retired from the API and now 404.
  model: "gemini-flash-latest",
  generationConfig,
  systemInstruction:
    "You summarize customer reviews of a home-cleaning service's cleaner for that cleaner's profile page. " +
    "Write exactly 2-3 sentences, in a neutral and factual tone, highlighting recurring strengths and any " +
    "recurring concerns actually present in the reviews. No bullet points, no preamble like 'Here is a " +
    "summary', and never invent details that aren't in the reviews.",
});

interface ReviewInput {
  rating: number;
  comment: string;
}

/** Summarizes a cleaner's recent reviews into 2-3 sentences for their profile card. */
export async function summarizeReviews(reviews: ReviewInput[]): Promise<string> {
  const reviewText = reviews
    .map((review, index) => {
      const comment = review.comment.trim();
      return `${index + 1}. Rating: ${review.rating}/5${comment ? ` — "${comment}"` : ""}`;
    })
    .join("\n");

  const result = await model.generateContent(
    `Summarize these ${reviews.length} customer reviews:\n\n${reviewText}`
  );

  const summary = result.response.text()?.trim();
  if (!summary) throw new Error("Gemini returned an empty summary");
  return summary;
}
