import { redirect } from "next/navigation"

export default async function ({ params }: { params: Promise<{ arxivId: string }> }) {
  const { arxivId } = await params
  redirect(`/${arxivId.replace(/\.pdf$/, "").replace(/v\d+$/, "")}`)
}
