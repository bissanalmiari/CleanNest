import type { Metadata } from "next";

import BookingRouteBuilder from "../../../components/booking/BookingRouteBuilder";

export const metadata: Metadata = {
  title: "Build Your Cleaning Route | CleanNest",
  description:
    "Create and schedule your personalized CleanNest cleaning route.",
};

export default function BookServicePage() {
  return <BookingRouteBuilder />;
}