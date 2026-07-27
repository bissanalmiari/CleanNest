import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Home,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type AuthLayoutProps = {
  children: ReactNode;
};

const trustFeatures = [
  {
    icon: BadgeCheck,
    title: "Trusted professionals",
    description: "Carefully managed cleaning services.",
  },
  {
    icon: CalendarCheck2,
    title: "Simple scheduling",
    description: "Choose the service and time that suits you.",
  },
  {
    icon: ShieldCheck,
    title: "Secure accounts",
    description: "Protected authentication and email verification.",
  },
];

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_8%_10%,rgba(30,111,217,0.12),transparent_27%),radial-gradient(circle_at_92%_90%,rgba(34,211,238,0.1),transparent_25%),linear-gradient(135deg,#ffffff_0%,#f5f9fe_48%,#edf6ff_100%)] font-body">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,111,217,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.055) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-[1540px] flex-col px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="group inline-flex items-center gap-3 rounded-2xl bg-white/90 px-3 py-2 shadow-[0_12px_35px_rgba(11,37,69,0.08)] transition hover:bg-white"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-blue-600 to-cyan-500 text-white shadow-[0_10px_25px_rgba(30,111,217,0.25)]">
              <Sparkles className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-heading text-lg font-black leading-none text-navy">
                CleanNest
              </span>
              <span className="mt-1 block text-[8px] font-extrabold uppercase tracking-[0.18em] text-primary">
                Cleaning made simple
              </span>
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/10 bg-white/85 px-4 text-xs font-extrabold text-slate-600 transition hover:border-primary/25 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </header>

        <div className="my-5 grid flex-1 overflow-hidden rounded-[2rem] border border-white bg-white/95 shadow-[0_30px_90px_rgba(11,37,69,0.16)] lg:grid-cols-[1.02fr_0.98fr]">
          <section className="relative hidden overflow-hidden bg-[linear-gradient(140deg,#061a33_0%,#0b315d_52%,#146fc5_100%)] p-9 text-white lg:flex lg:min-h-[720px] lg:flex-col lg:justify-between xl:p-12">
            <div
              aria-hidden="true"
              className="absolute -right-28 -top-32 h-80 w-80 rounded-full border border-cyan-200/15 bg-cyan-300/[0.08]"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full border border-white/10 bg-primary/15"
            />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-cyan-200">
                <ShieldCheck className="h-4 w-4" />
                Your clean route starts here
              </div>

              <h1 className="mt-7 max-w-xl font-heading text-4xl font-black leading-[1.05] tracking-[-0.045em] xl:text-5xl">
                A cleaner home,
                <span className="block text-cyan-300">without the complexity.</span>
              </h1>

              <p className="mt-5 max-w-lg text-sm font-medium leading-7 text-blue-100/65">
                Sign in once to manage your homes, choose trusted services, and follow every
                cleaning visit from request to completion.
              </p>
            </div>

            <div className="border-white/12 relative my-8 rounded-[1.8rem] border bg-white/[0.08] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-cyan-300">
                    Clean route preview
                  </p>
                  <h2 className="mt-3 font-heading text-2xl font-black">Home refresh</h2>
                  <p className="mt-2 text-xs font-semibold text-blue-100/55">
                    Everything organized in one visit
                  </p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-navy">
                  <Home className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <RoutePoint icon={CheckCircle2} label="Home" value="Saved" />
                <RoutePoint icon={Clock3} label="Arrival" value="On time" />
                <RoutePoint icon={ShieldCheck} label="Account" value="Secure" />
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.08] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                <span className="text-xs font-extrabold text-emerald-100">
                  CleanNest services are ready when you are
                </span>
              </div>
            </div>

            <div className="relative grid gap-3 xl:grid-cols-3">
              {trustFeatures.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/[0.07] p-4"
                >
                  <Icon className="h-5 w-5 text-cyan-300" />
                  <h3 className="mt-3 text-sm font-extrabold">{title}</h3>
                  <p className="mt-2 text-[11px] font-medium leading-5 text-blue-100/55">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="relative flex min-h-[650px] flex-col bg-white px-5 py-6 sm:px-9 sm:py-8 lg:px-12 xl:px-16">
            <div className="mb-7 flex items-center justify-between border-b border-primary/10 pb-5 lg:hidden">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold text-primary">
                <ShieldCheck className="h-4 w-4" />
                Secure CleanNest access
              </div>
              <CalendarCheck2 className="h-5 w-5 text-cyan-500" />
            </div>

            <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center">
              <div className="rounded-[1.8rem] border border-primary/10 bg-white p-6 shadow-[0_20px_60px_rgba(11,37,69,0.09)] sm:p-8">
                {children}
              </div>
            </div>

            <p className="mt-6 text-center text-[10px] font-semibold text-slate-400">
              Secure authentication · CleanNest customer protection
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

function RoutePoint({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-navy/30 p-4">
      <Icon className="h-4 w-4 text-cyan-300" />
      <p className="mt-3 text-[8px] font-extrabold uppercase tracking-[0.12em] text-blue-100/40">
        {label}
      </p>
      <p className="mt-1 text-xs font-black text-white">{value}</p>
    </div>
  );
}
