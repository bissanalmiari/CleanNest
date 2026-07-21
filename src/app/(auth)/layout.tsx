import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-soft px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex flex-col items-center gap-1 text-center">
          <span className="font-heading text-2xl font-bold text-primary">CleanNest</span>
          <span className="text-xs font-medium text-navy/50">
            Book Trusted Cleaning Services in Minutes.
          </span>
        </Link>

        <div className="rounded-card border border-navy/10 bg-surface p-7 shadow-card sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}