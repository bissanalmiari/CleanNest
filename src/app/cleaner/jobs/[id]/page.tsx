import CleanerJobDetail from "@/components/cleaner/CleanerJobDetail";

export default async function CleanerJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CleanerJobDetail bookingId={id} />;
}
