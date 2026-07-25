import { LoaderCircle, ShieldCheck } from "lucide-react";

export default function AdminAreaLoading() {
  return (
    <main className="min-h-[calc(100vh-76px)] bg-[#f3f7fc] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1450px]">
        <div className="flex items-center gap-4 rounded-[2rem] bg-navy p-7 text-white shadow-[0_24px_70px_rgba(11,37,69,0.2)]">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-cyan-300">
              CleanNest operations
            </p>
            <p className="mt-2 font-heading text-xl font-black">Preparing admin workspace</p>
          </div>
          <LoaderCircle className="ml-auto h-6 w-6 animate-spin text-cyan-300" />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-[1.5rem] border border-white bg-white/90 shadow-[0_12px_35px_rgba(11,37,69,0.06)]"
            />
          ))}
        </div>

        <div className="mt-5 h-80 animate-pulse rounded-[2rem] border border-white bg-white/90 shadow-[0_16px_45px_rgba(11,37,69,0.07)]" />
      </div>
    </main>
  );
}
