"use client";

import { useState } from "react";

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void; // omit for read-only display
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };

export function RatingStars({ value, onChange, size = "md" }: RatingStarsProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const interactive = !!onChange;
  const displayValue = hovered ?? value;

  return (
    <div
      className="flex items-center gap-1"
      role={interactive ? "radiogroup" : "img"}
      aria-label={interactive ? "Rate this cleaning" : `Rated ${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayValue;
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(null)}
            className={`${interactive ? "cursor-pointer" : "cursor-default"} transition-transform ${
              interactive ? "hover:scale-110" : ""
            }`}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            <svg
              viewBox="0 0 20 20"
              className={`${SIZE_CLASSES[size]} ${filled ? "text-amber-400" : "text-navy/15"}`}
              fill="currentColor"
            >
              <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8L10 1.5z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
