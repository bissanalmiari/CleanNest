// src/app/api/admin/reports/export/route.ts
// GET /api/admin/reports/export?range=week|month|year|all
// Admin-only. Builds the same revenue / booking / popular-services report
// shown on the admin reports dashboard and returns it as a downloadable
// Word (.docx) document.

import { NextRequest, NextResponse } from "next/server";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import { requireUser } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/apiError";
import {
  getBookingReport,
  getPopularServicesReport,
  getRevenueReport,
  type ReportRange,
} from "@/services/reportsService";
import type { BookingStatus } from "@/types/enums";

const VALID_RANGES: ReportRange[] = ["week", "month", "year", "all"];

const RANGE_LABELS: Record<ReportRange, string> = {
  week: "Last 7 days",
  month: "Last 30 days",
  year: "Last 12 months",
  all: "All time",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new AppError("Admins only", 403);
  }
  return user;
}

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function sectionHeading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, bold: true })],
  });
}

function headerCell(text: string) {
  return new TableCell({
    width: { size: 25, type: WidthType.PERCENTAGE },
    shading: { fill: "1F2937" },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, color: "FFFFFF" })],
      }),
    ],
  });
}

function bodyCell(text: string) {
  return new TableCell({
    width: { size: 25, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ children: [new TextRun({ text })] })],
  });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const rangeParam = (searchParams.get("range") as ReportRange) || "month";

    if (!VALID_RANGES.includes(rangeParam)) {
      throw new AppError("Invalid range. Use week, month, year, or all.", 422);
    }

    const [revenue, bookings, popularServices] = await Promise.all([
      getRevenueReport(rangeParam),
      getBookingReport(rangeParam),
      getPopularServicesReport(rangeParam, 10),
    ]);

    const generatedAt = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              heading: HeadingLevel.TITLE,
              children: [new TextRun({ text: "CleanNest Admin Report" })],
            }),
            new Paragraph({
              spacing: { after: 240 },
              children: [
                new TextRun({
                  text: `${RANGE_LABELS[rangeParam]} · Generated ${generatedAt}`,
                  color: "6B7280",
                }),
              ],
            }),

            // --- Revenue ---------------------------------------------------
            sectionHeading("Revenue"),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    headerCell("Total revenue"),
                    headerCell("Transactions"),
                    headerCell("Avg. transaction value"),
                  ],
                }),
                new TableRow({
                  children: [
                    bodyCell(money(revenue.totalRevenue)),
                    bodyCell(String(revenue.transactionCount)),
                    bodyCell(money(revenue.averageTransactionValue)),
                  ],
                }),
              ],
            }),

            // --- Bookings ----------------------------------------------------
            sectionHeading("Bookings"),
            new Paragraph({
              spacing: { after: 160 },
              children: [
                new TextRun({
                  text: `Total bookings: ${bookings.totalBookings}   ·   Completion rate: ${bookings.completionRate}%`,
                }),
              ],
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [headerCell("Status"), headerCell("Count")],
                }),
                ...(Object.keys(bookings.statusBreakdown) as BookingStatus[]).map(
                  (status) =>
                    new TableRow({
                      children: [
                        bodyCell(STATUS_LABELS[status]),
                        bodyCell(String(bookings.statusBreakdown[status])),
                      ],
                    }),
                ),
              ],
            }),

            // --- Popular services --------------------------------------------
            sectionHeading("Popular Services"),
            popularServices.length === 0
              ? new Paragraph({
                  children: [
                    new TextRun({ text: "No service activity in this period." }),
                  ],
                })
              : new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        headerCell("Service"),
                        headerCell("Category"),
                        headerCell("Bookings"),
                        headerCell("Revenue"),
                      ],
                    }),
                    ...popularServices.map(
                      (service) =>
                        new TableRow({
                          children: [
                            bodyCell(service.serviceName),
                            bodyCell(service.category),
                            bodyCell(String(service.bookingCount)),
                            bodyCell(money(service.revenue)),
                          ],
                        }),
                    ),
                  ],
                }),

            new Paragraph({
              spacing: { before: 320 },
              alignment: AlignmentType.LEFT,
              children: [
                new TextRun({
                  text: "Generated automatically from the CleanNest admin dashboard.",
                  italics: true,
                  color: "9CA3AF",
                }),
              ],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const body = new Uint8Array(buffer);
    const filename = `cleannest-report-${rangeParam}-${new Date()
      .toISOString()
      .slice(0, 10)}.docx`;

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
