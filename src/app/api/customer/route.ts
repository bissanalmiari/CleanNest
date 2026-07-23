export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    success: true,
    marker: "CUSTOMER_SERVICES_ROUTE_WORKS",
  });
}