import { redirect } from "next/navigation";

export default async function LegacyCleanerJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/cleaner/jobs/${id}`);
}
