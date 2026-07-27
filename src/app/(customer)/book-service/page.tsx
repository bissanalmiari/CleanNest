import type { Metadata } from "next";

import BookingRouteBuilder from "../../../components/booking/BookingRouteBuilder";

export const metadata: Metadata = {
  title: "Build Your Cleaning Route | CleanNest",
  description:
    "Create and schedule your personalized CleanNest cleaning route.",
};

type BookServicePageProps = {
  searchParams: Promise<{
    service?: string | string[];
  }>;
};

export default async function BookServicePage({
  searchParams,
}: BookServicePageProps) {
  const parameters = await searchParams;
  const requestedService = Array.isArray(parameters.service)
    ? parameters.service[0]
    : parameters.service;
  const preferredServiceSlug =
    requestedService && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(requestedService)
      ? requestedService
      : undefined;

  return <BookingRouteBuilder preferredServiceSlug={preferredServiceSlug} />;
}
