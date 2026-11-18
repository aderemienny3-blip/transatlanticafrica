import Link from "next/link"
import { ArrowUpRight, AudioLines } from "lucide-react"
import { SiteFooter } from "@/components/site-footer"
import { getSubstackFeed } from "@/lib/substack"

export const metadata = {
  title: "Journal | Transatlantic Africa",
  description: "Latest writing from Transatlantic West Africa on music and culture across the Atlantic.",
}

function formatDate(date: string | null) {
  if (!date) return "Date unavailable"

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date))
}

export default async function JournalPage() {
  const feed = await getSubstackFeed()

  return <main className="atlas-shell journal-shell">
    <header className="journal-header">
      <Link className="brand" href="/" aria-label="Transatlantic Africa home"><span className="brand-mark"><AudioLines size={18} /></span><span>TRANSATLANTIC <span className="brand-soft">AFRICA</span></span><span className="brand-period">.</span></Link>
      <nav className="journal-nav" aria-label="Journal navigation"><Link href="/">THE ATLAS</Link><Link href="/journal" aria-current="page">JOURNAL</Link></nav>
    </header>

    <section className="journal-hero" aria-labelledby="journal-title">
      <p className="kicker"><span className="live-dot" /> NOTES FROM THE PUBLICATION</p>
      <h1 id="journal-title">The <em>Journal.</em></h1>
      <p>Writing from Transatlantic West Africa on music, memory, and movement across the Atlantic.</p>
    </section>

    <section className="journal-content" aria-label="Latest Substack posts">
      <div className="journal-section-heading"><span className="section-number">01</span><h2>LATEST POSTS</h2><span className="journal-feed-status">{feed.available ? "SUBSTACK FEED" : "PUBLICATION LINK"}</span></div>
      {feed.posts.length > 0 ? <div className="journal-post-list">
        {feed.posts.map((post) => <article className="journal-post" key={post.url}>
          <time dateTime={post.date ?? undefined}>{formatDate(post.date)}</time>
          <h3><a href={post.url} target="_blank" rel="noreferrer">{post.title}<ArrowUpRight size={15} /></a></h3>
          {post.excerpt && <p>{post.excerpt}</p>}
        </article>)}
      </div> : <div className="journal-fallback">
        <p>{feed.available ? "There are no recent posts in the feed yet." : "The latest posts are temporarily unavailable here."}</p>
        <a href={feed.publicationUrl} target="_blank" rel="noreferrer">Read on Substack <ArrowUpRight size={14} /></a>
      </div>}
      {feed.posts.length > 0 && <a className="journal-publication-link" href={feed.publicationUrl} target="_blank" rel="noreferrer">Read on Substack <ArrowUpRight size={13} /></a>}
    </section>

    <SiteFooter />
  </main>
}
