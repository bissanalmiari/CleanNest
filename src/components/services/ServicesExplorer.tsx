"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Filter,
  LoaderCircle,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";

import ServiceCard from "@/components/services/ServiceCard";
import { fetchServices } from "@/services/serviceApi";
import type { Service, ServiceFilters, ServicesPagination, ServiceSort } from "@/types/service";

const initialFilters: ServiceFilters = {
  search: "",
  category: "",
  minPrice: "",
  maxPrice: "",
  sort: "newest",
  page: 1,
};

const initialPagination: ServicesPagination = {
  page: 1,
  limit: 6,
  totalServices: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

const sortOptions: Array<{
  label: string;
  value: ServiceSort;
}> = [
  {
    label: "Newest first",
    value: "newest",
  },
  {
    label: "Oldest first",
    value: "oldest",
  },
  {
    label: "Price: Low to high",
    value: "price-asc",
  },
  {
    label: "Price: High to low",
    value: "price-desc",
  },
  {
    label: "Name: A to Z",
    value: "name-asc",
  },
  {
    label: "Name: Z to A",
    value: "name-desc",
  },
];

function ServiceCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white p-7 shadow-[0_18px_50px_rgba(11,37,69,0.08)]">
      <div className="animate-pulse">
        <div className="flex items-start justify-between gap-4">
          <div className="h-14 w-14 rounded-2xl bg-slate-200" />
          <div className="h-7 w-28 rounded-full bg-slate-200" />
        </div>

        <div className="mt-6 h-7 w-3/4 rounded-lg bg-slate-200" />

        <div className="mt-4 space-y-2">
          <div className="h-4 w-full rounded bg-slate-100" />
          <div className="h-4 w-5/6 rounded bg-slate-100" />
        </div>

        <div className="mt-6 flex gap-3">
          <div className="h-16 w-28 rounded-xl bg-slate-200" />
          <div className="h-12 w-28 rounded-xl bg-slate-100" />
        </div>

        <div className="mt-7 space-y-3">
          <div className="h-4 w-4/5 rounded bg-slate-100" />
          <div className="h-4 w-3/4 rounded bg-slate-100" />
          <div className="h-4 w-2/3 rounded bg-slate-100" />
        </div>

        <div className="mt-8 h-12 w-full rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

export default function ServicesExplorer() {
  const resultsSectionRef = useRef<HTMLDivElement>(null);

  /*
   * This ref remembers whether the next API response
   * should move the screen to the results section.
   */
  const shouldScrollToResultsRef = useRef(false);

  const [draftFilters, setDraftFilters] = useState<ServiceFilters>(initialFilters);

  const [appliedFilters, setAppliedFilters] = useState<ServiceFilters>(initialFilters);

  const [services, setServices] = useState<Service[]>([]);

  const [categories, setCategories] = useState<string[]>([]);

  const [pagination, setPagination] = useState<ServicesPagination>(initialPagination);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  const loadServices = useCallback(async (filters: ServiceFilters, signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetchServices(filters, signal);

      setServices(response.data.services);
      setCategories(response.data.categories);
      setPagination(response.data.pagination);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setServices([]);

      setErrorMessage(error instanceof Error ? error.message : "Unable to load services.");
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    /*
     * Read and reset the scrolling request for this
     * particular service request.
     */
    const shouldScroll = shouldScrollToResultsRef.current;

    shouldScrollToResultsRef.current = false;

    let scrollTimer: number | undefined;

    void loadServices(appliedFilters, controller.signal).then(() => {
      if (controller.signal.aborted || !shouldScroll) {
        return;
      }

      /*
       * Give React enough time to render the new
       * cards before starting the smooth scroll.
       */
      scrollTimer = window.setTimeout(() => {
        resultsSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    });

    return () => {
      controller.abort();

      if (scrollTimer !== undefined) {
        window.clearTimeout(scrollTimer);
      }
    };
  }, [appliedFilters, loadServices]);

  function requestResultsScroll() {
    shouldScrollToResultsRef.current = true;
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const fieldName = event.target.name as keyof ServiceFilters;

    const fieldValue = event.target.value;

    setDraftFilters((currentFilters) => ({
      ...currentFilters,
      [fieldName]: fieldValue,
      page: 1,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    requestResultsScroll();

    setAppliedFilters({
      ...draftFilters,
      page: 1,
    });
  }

  function handleReset() {
    requestResultsScroll();

    setDraftFilters(initialFilters);

    setAppliedFilters({
      ...initialFilters,
    });
  }

  function handleCategoryChange(category: string) {
    const updatedFilters: ServiceFilters = {
      ...draftFilters,
      category,
      page: 1,
    };

    requestResultsScroll();

    setDraftFilters(updatedFilters);
    setAppliedFilters(updatedFilters);
  }

  function handleSortChange(event: ChangeEvent<HTMLSelectElement>) {
    const sortValue = event.target.value as ServiceSort;

    const updatedFilters: ServiceFilters = {
      ...draftFilters,
      sort: sortValue,
      page: 1,
    };

    requestResultsScroll();

    setDraftFilters(updatedFilters);
    setAppliedFilters(updatedFilters);
  }

  function handlePageChange(page: number) {
    if (page < 1 || page > pagination.totalPages || page === appliedFilters.page) {
      return;
    }

    const updatedFilters: ServiceFilters = {
      ...appliedFilters,
      page,
    };

    requestResultsScroll();

    setAppliedFilters(updatedFilters);

    setDraftFilters((currentFilters) => ({
      ...currentFilters,
      page,
    }));
  }

  const hasActiveFilters =
    Boolean(appliedFilters.search) ||
    Boolean(appliedFilters.category) ||
    Boolean(appliedFilters.minPrice) ||
    Boolean(appliedFilters.maxPrice) ||
    appliedFilters.sort !== "newest";

  return (
    <MotionConfig reducedMotion="always">
      <section className="relative isolate overflow-hidden bg-surface-soft py-20 sm:py-24">
        {/* Background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(30,111,217,0.12),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(34,211,238,0.12),transparent_28%)]"
        />

        <motion.div
          aria-hidden="true"
          className="absolute -left-64 top-20 h-[38rem] w-[38rem] rounded-full bg-primary/10 blur-3xl"
          animate={{
            x: [0, 90, 0],
            y: [0, -40, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 14,
            repeat: 0,
            ease: "easeInOut",
          }}
        />

        <motion.div
          aria-hidden="true"
          className="absolute -right-64 bottom-0 h-[40rem] w-[40rem] rounded-full bg-cyan-300/10 blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 50, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 16,
            repeat: 0,
            ease: "easeInOut",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          {/* Heading */}
          <motion.div
            initial={{
              opacity: 0,
              y: 35,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.75,
            }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white px-4 py-2 text-sm font-bold text-primary shadow-card">
              <Sparkles className="h-4 w-4" />
              Cleaning Services
            </div>

            <h1 className="mt-6 font-heading text-4xl font-extrabold tracking-tight text-navy sm:text-5xl lg:text-6xl">
              Find the Right Cleaning
              <span className="mt-2 block bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Service for Your Space
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Search, filter, and compare CleanNest services before choosing the option that fits
              your home, office, or special cleaning needs.
            </p>
          </motion.div>

          {/* Search and filters */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{
              opacity: 0,
              y: 40,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              duration: 0.8,
              delay: 0.15,
            }}
            className="mt-12 rounded-[2rem] border border-primary/10 bg-white/90 p-5 shadow-[0_24px_70px_rgba(11,37,69,0.11)] backdrop-blur-md sm:p-7"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
                <SlidersHorizontal className="h-5 w-5" />
              </span>

              <div>
                <h2 className="font-heading text-lg font-bold text-navy">Search and filter</h2>

                <p className="text-sm text-slate-500">
                  Narrow the results to find the most suitable service.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
              {/* Search */}
              <div>
                <label htmlFor="service-search" className="text-sm font-semibold text-navy">
                  Search
                </label>

                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <input
                    id="service-search"
                    name="search"
                    type="search"
                    value={draftFilters.search}
                    onChange={handleInputChange}
                    placeholder="Search deep cleaning, office..."
                    className="min-h-[52px] w-full rounded-xl border border-primary/10 bg-white px-4 py-3 pl-12 text-sm text-navy outline-none transition-all placeholder:text-slate-400 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </div>

              {/* Minimum price */}
              <div>
                <label htmlFor="minimum-price" className="text-sm font-semibold text-navy">
                  Minimum price
                </label>

                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-primary">
                    $
                  </span>

                  <input
                    id="minimum-price"
                    name="minPrice"
                    type="number"
                    min="0"
                    step="1"
                    value={draftFilters.minPrice}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="min-h-[52px] w-full rounded-xl border border-primary/10 bg-white px-4 py-3 pl-9 text-sm text-navy outline-none transition-all placeholder:text-slate-400 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </div>

              {/* Maximum price */}
              <div>
                <label htmlFor="maximum-price" className="text-sm font-semibold text-navy">
                  Maximum price
                </label>

                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-primary">
                    $
                  </span>

                  <input
                    id="maximum-price"
                    name="maxPrice"
                    type="number"
                    min="0"
                    step="1"
                    value={draftFilters.maxPrice}
                    onChange={handleInputChange}
                    placeholder="150"
                    className="min-h-[52px] w-full rounded-xl border border-primary/10 bg-white px-4 py-3 pl-9 text-sm text-navy outline-none transition-all placeholder:text-slate-400 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </div>

              {/* Apply button */}
              <div className="flex items-end">
                <motion.button
                  type="submit"
                  whileHover={{
                    y: -3,
                    scale: 1.02,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                  className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-[0_14px_32px_rgba(30,111,217,0.25)] transition-colors hover:bg-primary-dark lg:w-auto"
                >
                  <Search className="h-5 w-5" />
                  Apply
                </motion.button>
              </div>
            </div>

            {/* Categories and sort */}
            <div className="mt-6 flex flex-col gap-5 border-t border-primary/10 pt-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-navy">Category</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("")}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                      draftFilters.category === ""
                        ? "border-primary bg-primary text-white shadow-md"
                        : "border-primary/10 bg-white text-slate-600 hover:border-primary/30 hover:text-primary"
                    }`}
                  >
                    All services
                  </button>

                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategoryChange(category)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                        draftFilters.category === category
                          ? "border-primary bg-primary text-white shadow-md"
                          : "border-primary/10 bg-white text-slate-600 hover:border-primary/30 hover:text-primary"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div>
                  <label htmlFor="service-sort" className="text-sm font-semibold text-navy">
                    Sort services
                  </label>

                  <select
                    id="service-sort"
                    name="sort"
                    value={draftFilters.sort}
                    onChange={handleSortChange}
                    className="mt-2 min-h-[46px] w-full rounded-xl border border-primary/10 bg-white px-4 py-2.5 text-sm font-semibold text-navy outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/10 sm:w-52"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!hasActiveFilters}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white px-4 py-2.5 text-sm font-semibold text-navy transition-all hover:bg-primary-light hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>
          </motion.form>

          {/* Results section */}
          <div ref={resultsSectionRef} className="mt-10 scroll-mt-28">
            {/* Results heading */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
                  Available options
                </p>

                <h2
                  aria-live="polite"
                  className="mt-2 font-heading text-2xl font-extrabold text-navy sm:text-3xl"
                >
                  {isLoading
                    ? "Loading services..."
                    : `${pagination.totalServices} ${
                        pagination.totalServices === 1 ? "service" : "services"
                      } found`}
                </h2>
              </div>

              {hasActiveFilters && (
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/10 bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm">
                  <Filter className="h-4 w-4" />
                  Filters applied
                </div>
              )}
            </div>

            {/* Results */}
            <div className="mt-8">
              {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({
                    length: 6,
                  }).map((_, index) => (
                    <ServiceCardSkeleton key={`service-skeleton-${index}`} />
                  ))}
                </div>
              ) : errorMessage ? (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="rounded-[1.75rem] border border-red-200 bg-red-50 px-6 py-12 text-center"
                >
                  <AlertCircle className="mx-auto h-12 w-12 text-red-500" />

                  <h3 className="mt-4 font-heading text-2xl font-bold text-red-700">
                    Services could not be loaded
                  </h3>

                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-red-600">
                    {errorMessage}
                  </p>

                  <button
                    type="button"
                    onClick={() => void loadServices(appliedFilters)}
                    className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-bold text-white transition-colors hover:bg-red-700"
                  >
                    <LoaderCircle className="h-5 w-5" />
                    Try Again
                  </button>
                </motion.div>
              ) : services.length === 0 ? (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="rounded-[1.75rem] border border-primary/10 bg-white px-6 py-14 text-center shadow-card"
                >
                  <Search className="mx-auto h-12 w-12 text-primary" />

                  <h3 className="mt-4 font-heading text-2xl font-bold text-navy">
                    No services found
                  </h3>

                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
                    Try changing the search term, category, or price range.
                  </p>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-primary-dark"
                  >
                    <RotateCcw className="h-5 w-5" />
                    Clear Filters
                  </button>
                </motion.div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${appliedFilters.search}-${appliedFilters.category}-${appliedFilters.sort}-${appliedFilters.page}`}
                    initial={{
                      opacity: 0,
                      y: 20,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: -20,
                    }}
                    className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
                  >
                    {services.map((service, index) => (
                      <ServiceCard key={service.id} service={service} index={index} />
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {/* Pagination */}
            {!isLoading && !errorMessage && services.length > 0 && pagination.totalPages > 1 && (
              <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white px-5 py-2.5 text-sm font-bold text-navy transition-all hover:bg-primary-light hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </button>

                {Array.from(
                  {
                    length: pagination.totalPages,
                  },
                  (_, index) => index + 1
                ).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => handlePageChange(pageNumber)}
                    aria-label={`Open page ${pageNumber}`}
                    aria-current={pagination.page === pageNumber ? "page" : undefined}
                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold transition-all ${
                      pagination.page === pageNumber
                        ? "bg-primary text-white shadow-[0_10px_25px_rgba(30,111,217,0.25)]"
                        : "border border-primary/10 bg-white text-navy hover:bg-primary-light hover:text-primary"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white px-5 py-2.5 text-sm font-bold text-navy transition-all hover:bg-primary-light hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
