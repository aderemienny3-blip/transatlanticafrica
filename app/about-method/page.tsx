import Link from "next/link"
import { ArrowLeft, ArrowUpRight, AudioLines } from "lucide-react"
import { SiteFooter } from "@/components/site-footer"

export const metadata = {
  title: "About & Method | Transatlantic Africa",
  description: "How Transatlantic Africa researches, sources, and reviews its hip-hop atlas entries.",
}

const standards = [
  {
    number: "01",
    title: "Sources before stories",
    detail: "Artist biographies and scene details are written from checkable references. Each entry carries source URLs and the date it was last checked.",
  },
  {
    number: "02",
    title: "Unknown means unknown",
    detail: "Unconfirmed details remain null or empty. Draft records are marked Needs verification and are never presented as established fact.",
  },
  {
    number: "03",
    title: "Independent confirmation",
    detail: "An artist is marked verified only when at least two independent sources support the record and a documented language field is present. Streaming links never count as the only evidence.",
  },
]

export default function AboutMethodPage() {
  return <main className="method-page">
    <header className="method-header">
      <Link className="brand" href="/" aria-label="Transatlantic Africa home"><span className="brand-mark"><AudioLines size={18} /></span><span>TRANSATLANTIC <span className="brand-soft">AFRICA</span></span><span className="brand-period">.</span></Link>
      <Link href="/" className="method-back"><ArrowLeft size={14} /> BACK TO THE ATLAS</Link>
    </header>
    <section className="method-hero">
      <p className="kicker"><span className="live-dot" /> ABOUT THE PROJECT</p>
      <h1>A living record.<br /><em>Always in dialogue.</em></h1>
      <p className="method-lead">Transatlantic Africa follows hip-hop’s two-way movement across the ocean: the people, sounds, and local scenes that carry it in both directions.</p>
    </section>
    <section className="method-content" aria-labelledby="method-heading">
      <div className="method-intro"><span className="section-number">01</span><div><h2 id="method-heading">HOW WE RESEARCH</h2><p>Entries are assembled from sources you can follow and check. The atlas is editorial, not exhaustive: an empty field is more honest than an unsupported claim.</p></div></div>
      <div className="method-standards">{standards.map((item) => <article className="method-standard" key={item.number}><span>{item.number}</span><div><h3>{item.title}</h3><p>{item.detail}</p></div></article>)}</div>
    </section>
    <section className="method-corrections" id="corrections"><span className="section-number">02</span><div><p className="eyebrow">CORRECTIONS & CONTRIBUTIONS</p><h2>Bring a source with you.</h2><p>For a useful correction, note the city or artist, the exact detail to review, and a non-streaming source that supports the change. Suggestions are not published automatically; each update is checked and dated before it appears in the atlas.</p><Link className="method-atlas-link" href="/#atlas">Return to the atlas <ArrowUpRight size={14} /></Link></div></section>
    <SiteFooter />
  </main>
}
