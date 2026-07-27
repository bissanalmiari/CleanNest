"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageIcon, Sparkles } from "lucide-react";

type ServiceCoverImageProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

export default function ServiceCoverImage({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
}: ServiceCoverImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_70%_20%,rgba(34,211,238,0.2),transparent_28%),linear-gradient(135deg,#0b315d,#1268b9)] text-white">
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
            {failed ? <ImageIcon className="h-7 w-7" /> : <Sparkles className="h-7 w-7" />}
          </span>
          <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.15em] text-blue-100/70">
            CleanNest service
          </p>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => {
        setFailed(true);
      }}
      className={`object-cover ${className}`}
    />
  );
}
