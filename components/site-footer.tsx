import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { SubstackSubscribe } from "@/components/substack-subscribe"

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="site-footer-meta">
      <span>TRANSATLANTIC AFRICA © 2026</span>
      <span>A SOURCE-LED FIELD GUIDE TO HIP-HOP</span>
      <span>AFRICA ↔ ATLANTIC</span>
      <Link href="/journal">JOURNAL <ArrowUpRight size={11} /></Link>
    </div>
    <div className="site-footer-subscribe">
      <span className="meta-label">FOLLOW THE DISPATCH</span>
      <SubstackSubscribe title="Subscribe to Transatlantic West Africa on Substack" className="substack-embed-footer" />
    </div>
  </footer>
}
