import { NextResponse } from "next/server";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function messageResponse(message: string, status = 200) {
  return NextResponse.json({ success: true, message }, { status });
}