import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "primary" | "confirmed" | "pending" | "cancelled" | "inProgress";
  loading?: boolean;
}

const accentStyles: Record<
  NonNullable<StatCardProps["accent"]>,
  {
    icon: string;
    glow: string;
    line: string;
  }
> = {
  primary: {
    icon: "bg-blue-50 text-primary",
    glow: "bg-primary/10",
    line: "from-primary to-blue-400",
  },
  confirmed: {
    icon: "bg-emerald-50 text-emerald-700",
    glow: "bg-emerald-300/15",
    line: "from-emerald-400 to-cyan-400",
  },
  pending: {
    icon: "bg-amber-50 text-amber-700",
    glow: "bg-amber-300/15",
    line: "from-amber-400 to-orange-400",
  },
  cancelled: {
    icon: "bg-red-50 text-red-600",
    glow: "bg-red-300/10",
    line: "from-red-300 to-red-500",
  },
  inProgress: {
    icon: "bg-cyan-50 text-cyan-700",
    glow: "bg-cyan-300/15",
    line: "from-cyan-400 to-primary",
  },
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = "primary",
  loading = false,
}: StatCardProps) {
  const styles = accentStyles[accent];

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="group relative min-h-[150px] overflow-hidden rounded-[1.6rem] border border-white bg-white/95 p-5 shadow-[0_15px_45px_rgba(11,37,69,0.07)] transition hover:border-primary/15 hover:shadow-[0_22px_55px_rgba(11,37,69,0.11)]"
    >
      <div
        aria-hidden="true"
        className={`absolute -right-10 -top-12 h-32 w-32 rounded-full transition-transform duration-500 group-hover:scale-110 ${styles.glow}`}
      />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-primary">
            {label}
          </span>
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${styles.icon}`}>
            <Icon className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-navy/10" />
          ) : (
            <span className="font-heading text-3xl font-black tracking-[-0.035em] text-navy">
              {value}
            </span>
          )}
        </div>
      </div>

      <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${styles.line}`} />
    </motion.article>
  );
}
