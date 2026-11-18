export const SUBSTACK_PUBLICATION_URL = "https://transatlanticwestafrica.substack.com"
export const SUBSTACK_FEED_URL = `${SUBSTACK_PUBLICATION_URL}/feed`

export type SubstackPost = {
  title: string
  date: string | null
  excerpt: string
  url: string
}

export type SubstackFeed = {
  posts: SubstackPost[]
  available: boolean
  publicationUrl: string
}

function decodeXml(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  }

  return value
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&([a-z]+);/gi, (entity, name: string) => namedEntities[name.toLowerCase()] ?? entity)
}

function getTag(item: string, tagName: string) {
  const escapedName = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = item.match(new RegExp(`<${escapedName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapedName}\\s*>`, "i"))
  if (!match) return ""

  return match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim()
}

function toPlainText(value: string) {
  const withoutHiddenContent = value
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")

  return decodeXml(withoutHiddenContent).replace(/\s+/g, " ").trim()
}

function safePostUrl(value: string) {
  try {
    const url = new URL(decodeXml(value))
    if (url.protocol === "https:" && url.hostname === "transatlanticwestafrica.substack.com") {
      return url.toString()
    }
  } catch {
    return SUBSTACK_PUBLICATION_URL
  }

  return SUBSTACK_PUBLICATION_URL
}

function parseDate(value: string): string | null {
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null
}

function parseItem(item: string): SubstackPost | null {
  const title = toPlainText(getTag(item, "title"))
  const link = safePostUrl(getTag(item, "link"))
  const publishedDate = parseDate(getTag(item, "pubDate"))
  const content = getTag(item, "content:encoded") || getTag(item, "description")
  const excerpt = toPlainText(content).slice(0, 260)

  if (!title) return null

  return {
    title,
    date: publishedDate,
    excerpt: excerpt.length === 260 ? `${excerpt.trimEnd()}…` : excerpt,
    url: link,
  }
}

export async function getSubstackFeed(): Promise<SubstackFeed> {
  try {
    const response = await fetch(SUBSTACK_FEED_URL, {
      headers: { Accept: "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8" },
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      return { posts: [], available: false, publicationUrl: SUBSTACK_PUBLICATION_URL }
    }

    const xml = await response.text()
    const items = xml.match(/<item\b[^>]*>[\s\S]*?<\/item\s*>/gi) ?? []
    const posts = items.map(parseItem).filter((post): post is SubstackPost => post !== null)

    return { posts, available: true, publicationUrl: SUBSTACK_PUBLICATION_URL }
  } catch {
    return { posts: [], available: false, publicationUrl: SUBSTACK_PUBLICATION_URL }
  }
}
