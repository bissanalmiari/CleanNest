// src/lib/openai.ts
// Singleton OpenAI client. Requires OPENAI_API_KEY in the environment.
// Mirrors src/lib/stripe.ts: warn (don't throw) at import time if missing,
// so the app still boots — callers see the real error only when they
// actually try to use it.

import "server-only";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn(
    "[openai] OPENAI_API_KEY is not set. AI review summaries will fail until it is configured in .env.local."
  );
}

export const openai = new OpenAI({ apiKey: apiKey ?? "sk-placeholder" });

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

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    max_tokens: 150,
    messages: [
      {
        role: "system",
        content:
          "You summarize customer reviews of a home-cleaning service's cleaner for that cleaner's profile page. " +
          "Write exactly 2-3 sentences, in a neutral and factual tone, highlighting recurring strengths and any " +
          "recurring concerns actually present in the reviews. No bullet points, no preamble like 'Here is a " +
          "summary', and never invent details that aren't in the reviews.",
      },
      {
        role: "user",
        content: `Summarize these ${reviews.length} customer reviews:\n\n${reviewText}`,
      },
    ],
  });

  const summary = completion.choices[0]?.message?.content?.trim();
  if (!summary) throw new Error("OpenAI returned an empty summary");
  return summary;
}
