"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  LoaderCircle,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import type { CleanerAvailabilityDay } from "@/services/cleanerAvailabilityService";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function dayLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function CleanerAvailabilityPage() {
  const reduceMotion = useReducedMotion();
  const [days, setDays] = useState<CleanerAvailabilityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/cleaner/availability", {
        cache: "no-store",
      });
      const payload = (await response.json()) as ApiEnvelope<CleanerAvailabilityDay[]>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Could not load availability");
      }
      setDays(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load availability");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function updateDay(index: number, patch: Partial<CleanerAvailabilityDay>) {
    setSaved(false);
    setDays((current) =>
      current.map((day, dayIndex) => (dayIndex === index ? { ...day, ...patch } : day))
    );
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch("/api/cleaner/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      const payload = (await response.json()) as ApiEnvelope<CleanerAvailabilityDay[]>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Availability could not be saved");
      }
      setDays(payload.data);
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Availability could not be saved");
    } finally {
      setSaving(false);
    }
  }

  const availableDays = useMemo(() => days.filter((day) => day.isAvailable).length, [days]);
  const totalHours = useMemo(
    () =>
      days.reduce((total, day) => {
        if (!day.isAvailable) return total;
        const [startHour = 0, startMinute = 0] = day.startTime.split(":").map(Number);
        const [endHour = 0, endMinute = 0] = day.endTime.split(":").map(Number);
        return total + Math.max(0, endHour + endMinute / 60 - (startHour + startMinute / 60));
      }, 0),
    [days]
  );

  return (
    <div className="relative isolate min-h-[calc(100vh-76px)] overflow-hidden pb-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[430px] bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.18),transparent_28%),linear-gradient(135deg,#071f3d,#0b4163)]" />
      <div className="mx-auto max-w-[1120px] px-4 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[32px] border border-white/15 bg-white/[0.08] p-6 text-white shadow-[0_35px_85px_rgba(3,18,37,0.28)] backdrop-blur-md sm:p-8"
        >
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border-[50px] border-cyan-300/10" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Work preferences
              </span>
              <h1 className="mt-5 font-heading text-3xl font-black sm:text-4xl">
                Set your weekly availability.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100/75">
                Tell operations when you can work. Your schedule helps prevent conflicting
                assignments and keeps your routes predictable.
              </p>
            </div>
            <div className="grid gap-3 min-[400px]:grid-cols-2">
              <HeroMetric label="Available days" value={`${availableDays}/7`} />
              <HeroMetric label="Weekly hours" value={`${Math.round(totalHours)}h`} />
            </div>
          </div>
        </motion.section>

        <div className="mt-7 rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,42,72,0.09)] sm:p-7">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
              <CalendarClock className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">
                Regular schedule
              </p>
              <h2 className="mt-1 font-heading text-xl font-black text-navy">
                When are you ready to clean?
              </h2>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading || saving}
              className="ml-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-600 transition hover:border-primary/20 hover:text-primary disabled:opacity-50"
            >
              <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Reset
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700"
            >
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-6 space-y-3">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="h-[86px] animate-pulse rounded-2xl bg-slate-50" />
              ))}
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {days.map((day, index) => (
                <motion.div
                  key={day.dayOfWeek}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.035 }}
                  className={`grid gap-4 rounded-2xl border p-4 transition sm:grid-cols-[190px_1fr_auto] sm:items-center ${
                    day.isAvailable
                      ? "border-primary/15 bg-primary-light/25"
                      : "border-slate-200 bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={day.isAvailable}
                      onClick={() => updateDay(index, { isAvailable: !day.isAvailable })}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                        day.isAvailable ? "bg-primary" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                          day.isAvailable ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                    <div>
                      <p className="text-sm font-black text-navy">{dayLabel(day.dayOfWeek)}</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-400">
                        {day.isAvailable ? "Available" : "Day off"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <TimeField
                      value={day.startTime}
                      disabled={!day.isAvailable}
                      label={`${dayLabel(day.dayOfWeek)} start time`}
                      onChange={(value) => updateDay(index, { startTime: value })}
                    />
                    <span className="text-xs font-black text-slate-300">TO</span>
                    <TimeField
                      value={day.endTime}
                      disabled={!day.isAvailable}
                      label={`${dayLabel(day.dayOfWeek)} end time`}
                      onChange={(value) => updateDay(index, { endTime: value })}
                    />
                  </div>

                  <span
                    className={`inline-flex min-w-24 items-center justify-center rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] ${
                      day.isAvailable
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {day.isAvailable ? "On schedule" : "Unavailable"}
                  </span>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-7 flex flex-col gap-4 rounded-2xl bg-navy p-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
              <p className="text-xs font-semibold leading-5 text-blue-100/70">
                Changes guide future assignments. Existing confirmed jobs remain on your schedule,
                so contact operations if you cannot attend one.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void save()}
              disabled={loading || saving || days.length !== 7}
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-black text-white shadow-lg shadow-primary/20 transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-55"
            >
              {saving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving…" : saved ? "Schedule saved" : "Save availability"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-28 rounded-2xl border border-white/10 bg-white/[0.07] p-4">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-100/55">
        {label}
      </p>
    </div>
  );
}

function TimeField({
  value,
  disabled,
  label,
  onChange,
}: {
  value: string;
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
      <input
        type="time"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-2 text-sm font-extrabold text-navy outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      />
    </label>
  );
}
