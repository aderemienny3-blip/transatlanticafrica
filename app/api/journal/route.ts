import { getSubstackFeed } from "@/lib/substack"

export const revalidate = 3600

export async function GET() {
  return Response.json(await getSubstackFeed())
}
