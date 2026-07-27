"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Home,
  Paintbrush,
  Sofa,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";

import type { Service } from "@/types/service";
import ServiceCoverImage from "@/components/services/ServiceCoverImage";

type ServiceCardProps = {
  service: Service;
  index?: number;
};

type ServiceVisual = {
  icon: LucideIcon;
  gradient: string;
  iconBackground: string;
  iconColor: string;
};

function getServiceVisual(service: Service): ServiceVisual {
  const slug = service.slug.toLowerCase();

  if (slug.includes("office")) {
    return {
      icon: Building2,
      gradient: "from-blue-50 via-white to-cyan-50",
      iconBackground: "bg-blue-100",
      iconColor: "text-blue-600",
    };
  }

  if (slug.includes("sofa") || slug.includes("upholstery")) {
    return {
      icon: Sofa,
      gradient: "from-violet-50 via-white to-purple-50",
      iconBackground: "bg-violet-100",
      iconColor: "text-violet-600",
    };
  }

  if (slug.includes("construction")) {
    return {
      icon: Paintbrush,
      gradient: "from-amber-50 via-white to-orange-50",
      iconBackground: "bg-amber-100",
      iconColor: "text-amber-600",
    };
  }

  if (slug.includes("move-in") || slug.includes("move-out")) {
    return {
      icon: Home,
      gradient: "from-emerald-50 via-white to-teal-50",
      iconBackground: "bg-emerald-100",
      iconColor: "text-emerald-600",
    };
  }

  if (slug.includes("deep")) {
    return {
      icon: Sparkles,
      gradient: "from-cyan-50 via-white to-blue-50",
      iconBackground: "bg-cyan-100",
      iconColor: "text-cyan-600",
    };
  }

  return {
    icon: Home,
    gradient: "from-primary-light via-white to-blue-50",
    iconBackground: "bg-primary-light",
    iconColor: "text-primary",
  };
}

function formatDuration(durationMinutes: number) {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `${hours}h ${minutes}m`;
}

export default function ServiceCard({ service, index = 0 }: ServiceCardProps) {
  const visual = getServiceVisual(service);
  const Icon = visual.icon;

  const displayedFeatures = service.features.slice(0, 3);

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 35,
        scale: 0.96,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      viewport={{
        once: true,
        amount: 0.15,
      }}
      transition={{
        duration: 0.65,
        delay: Math.min(index * 0.08, 0.4),
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -9,
      }}
      className={`group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-primary/10 bg-gradient-to-br ${visual.gradient} shadow-[0_18px_50px_rgba(11,37,69,0.08)] transition-shadow duration-300 hover:shadow-[0_28px_70px_rgba(11,37,69,0.15)]`}
    >
      {service.imageUrl && (
        <div className="relative h-52 overflow-hidden bg-navy">
          <ServiceCoverImage
            src={service.imageUrl}
            alt={`${service.name} professional cleaning service`}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="transition duration-700 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/45 via-transparent to-transparent" />
        </div>
      )}

      {/* Animated glow */}
      <motion.div
        aria-hidden="true"
        className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl"
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 6 + index,
          repeat: 0,
          ease: "easeInOut",
        }}
      />

      {/* Moving shine */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-y-0 -left-1/2 w-28 skew-x-[-20deg] bg-white/35 blur-xl"
        animate={{
          left: ["-50%", "140%"],
        }}
        transition={{
          duration: 3,
          repeat: 0,
          repeatDelay: 4 + index * 0.4,
          ease: "easeInOut",
        }}
      />

      <div className="relative flex flex-1 flex-col p-6 sm:p-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <motion.span
            whileHover={{
              rotate: 6,
              scale: 1.1,
            }}
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${visual.iconBackground} ${visual.iconColor}`}
          >
            <Icon className="h-7 w-7" />
          </motion.span>

          <span className="rounded-full border border-primary/10 bg-white/80 px-3 py-1.5 text-xs font-bold text-primary shadow-sm backdrop-blur">
            {service.category}
          </span>
        </div>

        {/* Content */}
        <h2 className="mt-6 font-heading text-2xl font-extrabold leading-tight text-navy">
          {service.name}
        </h2>

        <p className="mt-3 text-sm leading-7 text-slate-600">{service.shortDescription}</p>

        {/* Price and duration */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="rounded-xl bg-navy px-4 py-2.5 text-white shadow-lg">
            <span className="text-xs font-semibold text-blue-200">Starting from</span>

            <p className="mt-0.5 font-heading text-xl font-extrabold">${service.price}</p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-primary/10 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-600">
            <Clock3 className="h-4 w-4 text-primary" />
            {formatDuration(service.durationMinutes)}
          </div>
        </div>

        {/* Features */}
        <div className="mt-6 space-y-3">
          {displayedFeatures.map((feature) => (
            <div key={feature} className="flex items-start gap-3 text-sm text-slate-600">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Details link */}
        <div className="mt-auto pt-7">
          <Link
            href={`/services/${service.slug}`}
            className="group/link flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-white shadow-[0_14px_32px_rgba(30,111,217,0.25)] transition-colors hover:bg-primary-dark"
          >
            View Service Details
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
