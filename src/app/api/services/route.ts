// src/app/api/services/route.ts

import { NextResponse } from "next/server";
import { getActiveServices } from "@/services/serviceService";

export async function GET() {
  try {
    const services = await getActiveServices();

    return NextResponse.json(
      {
        success: true,
        data: services,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/services failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve services",
      },
      { status: 500 }
    );
  }
}