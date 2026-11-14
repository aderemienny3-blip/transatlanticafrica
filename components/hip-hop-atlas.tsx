"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AttributionControl, getVersion, Map as MapLibreMap, Marker, setWorkerUrl } from "maplibre-gl"

setWorkerUrl(`https://cdn.jsdelivr.net/npm/maplibre-gl@${getVersion()}/dist/maplibre-gl-worker.mjs`)
import "maplibre-gl/dist/maplibre-gl.css"
import { ArrowDownRight, ArrowUpRight, AudioLines, ChevronDown, Compass, Disc3, Globe2, Headphones, Layers3, MapPin, Minus, Plus, Radio, Search, SlidersHorizontal, Volume2 } from "lucide-react"

type Language = "All" | "Francophone" | "Anglophone" | "Lusophone"
type City = { name: string; country: string; code: string; coords: [number, number]; languages: Exclude<Language, "All">[]; genre: string; artists: string[]; era: string; story: string; venues: string[]; count: string }

const cities: City[] = [
  { name: "Dakar", country: "Senegal", code: "SN", coords: [-17.45, 14.69], languages: ["Francophone"], genre: "Rap wolof", artists: ["Didier Awadi", "Daara J"], era: "The pioneers · 1980s", story: "Dakar made hip-hop its own: a generation of MCs traded imported sounds for Wolof lyrics, political urgency, and a movement rooted in the streets.", venues: ["Just 4 U", "Thiossane"], count: "38 artists" },
  { name: "Abidjan", country: "Côte d’Ivoire", code: "CI", coords: [-4.01, 5.36], languages: ["Francophone"], genre: "Rap ivoire", artists: ["Ruth Tonde", "Didi B"], era: "The new wave · 2010s", story: "From the maquis to the mainstream, Abidjan’s scene turns Nouchi slang, coupé-décalé rhythms, and fearless storytelling into a distinctly Ivorian sound.", venues: ["Palais de la Culture", "Le Yelam’s"], count: "52 artists" },
  { name: "Accra", country: "Ghana", code: "GH", coords: [-0.19, 5.56], languages: ["Anglophone"], genre: "Hiplife · Azonto", artists: ["Reggie Rockstone", "Sarkodie"], era: "Hiplife rises · 1990s", story: "Hiplife fused rap with highlife and local languages, creating a Ghanaian sound that traveled from Accra’s studios to dance floors across the continent.", venues: ["Alliance Française", "Republic Bar"], count: "46 artists" },
  { name: "Lagos", country: "Nigeria", code: "NG", coords: [3.38, 6.52], languages: ["Anglophone"], genre: "Afrobeats · Drill", artists: ["Eedris Abdulkareem", "Olamide"], era: "A city finds its voice · 2000s", story: "Lagos moves at its own tempo. From indigenous rap and street-hop to drill, artists turn the city’s restless scale into a sound all its own.", venues: ["New Afrika Shrine", "Freedom Park"], count: "64 artists" },
  { name: "Kinshasa", country: "DR Congo", code: "CD", coords: [15.27, -4.32], languages: ["Francophone"], genre: "Rap congolais", artists: ["Youssoupha", "Lexxus Legal"], era: "A new generation · 1990s", story: "Kinshasa’s lyrical ingenuity draws from rumba, Lingala wordplay, and the city’s fierce creative energy—making every bar a conversation with home.", venues: ["Institut Français", "Halle de la Gombe"], count: "27 artists" },
  { name: "Johannesburg", country: "South Africa", code: "ZA", coords: [28.05, -26.2], languages: ["Anglophone"], genre: "Kwaito · SA Drill", artists: ["Zola", "Nasty C"], era: "Kwaito breaks through · 1990s", story: "Johannesburg’s sound carries the weight and possibility of a changing city: kwaito’s township pulse, sharp lyricism, and a new generation of drill.", venues: ["Bassline", "The Orbit"], count: "71 artists" },
  { name: "Maputo", country: "Mozambique", code: "MZ", coords: [32.58, -25.97], languages: ["Lusophone"], genre: "Hip-hop moçambicano", artists: ["Azagaia", "Laylizzy"], era: "Independent voices · 2000s", story: "Maputo’s MCs have long used hip-hop as a tool for civic reflection, balancing Portuguese lyricism with local languages and a deeply independent spirit.", venues: ["Centro Cultural Franco-Moçambicano", "Coconuts Live"], count: "19 artists" },
  { name: "Luanda", country: "Angola", code: "AO", coords: [13.23, -8.84], languages: ["Lusophone"], genre: "Rap angolano · Kuduro", artists: ["MCK", "Eva RapDiva"], era: "Rap de intervenção · 1990s", story: "Luanda’s hip-hop is both party and public record. Rappers pair the pulse of kuduro with stories of resilience, identity, and life in a city remade.", venues: ["Elinga Teatro", "Casa 70"], count: "24 artists" },
  { name: "Nairobi", country: "Kenya", code: "KE", coords: [36.82, -1.29], languages: ["Anglophone"], genre: "Gengetone · Kenyan drill", artists: ["Kalamashaka", "Octopizzo"], era: "Ukoo Flani Mau Mau · 1990s", story: "Nairobi’s MCs have built a scene in Sheng, Swahili, and English—always reflecting the city back to itself, and pushing the sound forward.", venues: ["Bomas of Kenya", "Kilimani"], count: "33 artists" },
  { name: "Dar es Salaam", country: "Tanzania", code: "TZ", coords: [39.28, -6.8], languages: ["Anglophone"], genre: "Bongo Flava", artists: ["Professor Jay", "Nikki Mbishi"], era: "Bongo Flava begins · 1990s", story: "Born in Dar’s neighborhoods, Bongo Flava made Swahili rap a regional force—mixing hip-hop with local melodies, wit, and everyday life.", venues: ["Mlimani City", "Bilicanas"], count: "29 artists" },
]

const accents: Record<Language, string> = { All: "#d5ff00", Francophone: "#ff7657", Anglophone: "#c8ff36", Lusophone: "#b39aff" }
const filters: Language[] = ["All", "Francophone", "Anglophone", "Lusophone"]
const decades = ["1980", "1990", "2000", "2010", "2020"]

function CityMap({ visibleCities, selected, onSelect, accent, zoom, setZoom }: { visibleCities: City[]; selected: City; onSelect: (city: City) => void; accent: string; zoom: number; setZoom: (zoom: number) => void }) {
  const host = useRef<HTMLDivElement>(null)
  const map = useRef<MapLibreMap | null>(null)
  const markers = useRef<Marker[]>([])

  useEffect(() => {
    if (!host.current || map.current) return
    const instance = new MapLibreMap({
      container: host.current,
      style: "https://tiles.openfreemap.org/styles/dark",
      center: [18, -4],
      zoom: 2.35,
      minZoom: 2,
      maxZoom: 8,
      attributionControl: false,
      maxBounds: [[-28, -42], [58, 40]],
    })
    instance.addControl(new AttributionControl({ compact: true }), "bottom-right")
    map.current = instance
    return () => { markers.current.forEach((marker) => marker.remove()); instance.remove(); map.current = null }
  }, [])

  useEffect(() => {
    const instance = map.current
    if (!instance) return
    markers.current.forEach((marker) => marker.remove())
    markers.current = visibleCities.map((city) => {
      const element = document.createElement("button")
      const active = city.name === selected.name
      element.className = `city-marker${active ? " city-marker-active" : ""}`
      element.type = "button"
      element.setAttribute("aria-label", `${city.name}, ${city.country}`)
      element.style.setProperty("--marker-color", accent)
      element.innerHTML = `<span class="marker-dot"></span><span class="marker-label">${city.name}</span>`
      element.addEventListener("click", () => onSelect(city))
      return new Marker({ element, anchor: "center" }).setLngLat(city.coords).addTo(instance)
    })
  }, [visibleCities, selected, onSelect, accent])

  useEffect(() => { map.current?.zoomTo(zoom, { duration: 450 }) }, [zoom])
  useEffect(() => {
    const selectedCity = map.current
    if (selectedCity) selectedCity.easeTo({ center: selected.coords, duration: 700, offset: [-80, 0] })
  }, [selected])

  return <div className="map-canvas" ref={host} aria-label="Interactive map of Sub-Saharan African hip-hop cities">
    <div className="map-coordinate" aria-hidden="true"><Compass size={13} /> 04° 20’ S &nbsp;·&nbsp; 18° 35’ E</div>
    <div className="map-controls" aria-label="Map controls"><button aria-label="Zoom in" onClick={() => setZoom(Math.min(zoom + 0.5, 7))}><Plus size={15} /></button><button aria-label="Zoom out" onClick={() => setZoom(Math.max(zoom - 0.5, 2))}><Minus size={15} /></button><span /><button aria-label="Reset map view" onClick={() => { setZoom(2.35); map.current?.easeTo({ center: [18, -4], duration: 550 }) }}><Layers3 size={15} /></button></div>
  </div>
}

function CountryPanel({ city, accent, language }: { city: City; accent: string; language: "en" | "fr" }) {
  const french = language === "fr"
  return <aside className="story-panel" aria-label={`${city.country} hip-hop story`}>
    <div className="panel-topline"><span><MapPin size={12} /> {french ? "SCÈNE SÉLECTIONNÉE" : "SELECTED SCENE"}</span><span className="panel-code">{city.code} / 01</span></div>
    <div className="country-title"><div><p className="eyebrow">{city.country}</p><h2>{city.name}</h2></div><span className="country-orb" style={{ "--accent": accent } as React.CSSProperties}>{city.code}</span></div>
    <p className="story-copy">{city.story}</p>
    <div className="panel-tags"><span>{city.genre}</span><span>{city.era}</span></div>
    <div className="panel-rule" />
    <div className="panel-section-head"><h3>{french ? "ARTISTES À CONNAÎTRE" : "ARTISTS TO KNOW"}</h3><button aria-label="View all artists">{french ? "TOUT VOIR" : "VIEW ALL"} <ArrowUpRight size={12} /></button></div>
    <div className="artist-list">{city.artists.map((artist, index) => <button className="artist-row" key={artist}><span className="artist-index">0{index + 1}</span><span className="artist-disc"><Disc3 size={16} /></span><span className="artist-name">{artist}<small>{city.name} · {city.languages[0]}</small></span><ArrowUpRight className="artist-arrow" size={14} /></button>)}</div>
    <div className="panel-rule" />
    <div className="panel-meta-grid"><div><span className="meta-label">{french ? "ÉPOQUE CLÉ" : "DEFINING ERA"}</span><strong>{city.era.split(" · ")[0]}</strong><small>{city.era.split(" · ")[1]}</small></div><div><span className="meta-label">{french ? "LIEUX & SCÈNES" : "VENUES & SPACES"}</span><strong>{city.venues[0]}</strong><small>{city.venues[1]}</small></div></div>
    <button className="explore-city" style={{ "--accent": accent } as React.CSSProperties}>{french ? "EXPLORER LA SCÈNE" : "EXPLORE THE SCENE"}<ArrowUpRight size={15} /></button>
  </aside>
}

export function HipHopAtlas() {
  const [language, setLanguage] = useState<Language>("All")
  const [selected, setSelected] = useState(cities[3])
  const [zoom, setZoom] = useState(2.35)
  const [decade, setDecade] = useState(3)
  const [interfaceLanguage, setInterfaceLanguage] = useState<"en" | "fr">("en")
  const [search, setSearch] = useState("")
  const accent = accents[language]
  const visibleCities = useMemo(() => cities.filter((city) => (language === "All" || city.languages.includes(language)) && `${city.name} ${city.country}`.toLowerCase().includes(search.toLowerCase())), [language, search])
  const chooseLanguage = (next: Language) => { setLanguage(next); const nextCity = cities.find((city) => next === "All" || city.languages.includes(next)); if (nextCity) setSelected(nextCity) }
  const french = interfaceLanguage === "fr"

  return <main className="atlas-shell" style={{ "--accent": accent } as React.CSSProperties}>
    <header className="topbar"><a className="brand" href="#top" aria-label="Off The Map home"><span className="brand-mark"><AudioLines size={18} /></span><span>OFF THE<span className="brand-soft"> MAP</span></span><span className="brand-period">.</span></a><nav className="main-nav" aria-label="Main navigation"><a className="nav-active" href="#atlas">{french ? "L’ATLAS" : "THE ATLAS"}</a><a href="#artists">{french ? "ARTISTES" : "ARTISTS"}</a><a href="#sounds">{french ? "LES SONS" : "SOUNDS"}</a><a href="#about">{french ? "À PROPOS" : "ABOUT"}</a></nav><div className="top-actions"><button className="language-switch" onClick={() => setInterfaceLanguage(french ? "en" : "fr")} aria-label="Switch interface language"><Globe2 size={14} /> {french ? "FR" : "EN"}<ChevronDown size={12} /></button><button className="submit-button">{french ? "PROPOSER UN ARTISTE" : "SUBMIT AN ARTIST"}<ArrowUpRight size={13} /></button><button className="mobile-menu" aria-label="Open navigation"><SlidersHorizontal size={17} /></button></div></header>
    <section className="intro-row" id="top"><div className="intro-copy"><div className="kicker"><span className="live-dot" /> {french ? "UN ATLAS VIVANT DE LA CULTURE HIP-HOP" : "A LIVING ATLAS OF HIP-HOP CULTURE"}</div><h1>{french ? <>Le hip-hop<br /><em>sans frontières.</em></> : <>Hip-hop<br /><em>without borders.</em></>}</h1><p>{french ? "Des rues de Dakar aux studios de Lagos — explorez les scènes qui font bouger le continent." : "From Dakar’s street cyphers to Lagos studio sessions — discover the scenes moving a continent."}</p><div className="intro-foot"><span><span className="tiny-bars">▂ ▄ ▆</span> {String(cities.length).padStart(2, "0")} CITIES MAPPED</span><span className="foot-divider" /> <span>EST. 1980 — NOW</span></div></div><div className="intro-side"><div className="chapter-label">01 <span>—</span> THE SOUND OF A CONTINENT</div><p>Different languages.<br />One shared frequency.</p><span className="side-coordinate">06° 27′ N &nbsp;·&nbsp; 03° 23′ E</span><ArrowDownRight className="side-arrow" size={18} /></div></section>
    <section className="atlas-section" id="atlas" aria-label="Interactive hip-hop atlas"><div className="atlas-toolbar"><div className="view-title"><span className="section-number">01</span><h2>{french ? "EXPLORER L’ATLAS" : "EXPLORE THE ATLAS"}</h2><span className="live-label"><span /> LIVE MAP</span></div><div className="map-tools"><label className="search-field"><Search size={14} /><input aria-label="Search city or country" placeholder="Find a city or country" value={search} onChange={(event) => setSearch(event.target.value)} /></label><span className="map-tools-divider" /><button className="map-tool-button"><SlidersHorizontal size={14} /> <span>{french ? "FILTRES" : "FILTERS"}</span></button></div></div>
      <div className="atlas-layout"><div className="map-column"><div className="filter-bar" role="group" aria-label="Filter by language"><span className="filter-label">{french ? "SCÈNES PAR LANGUE" : "SCENES BY LANGUAGE"}</span><div className="filter-options">{filters.map((item) => <button key={item} onClick={() => chooseLanguage(item)} className={`filter-chip${language === item ? " selected" : ""}`} style={language === item ? { "--accent": accents[item] } as React.CSSProperties : undefined} aria-pressed={language === item}>{item === "All" ? (french ? "Tout" : "All scenes") : item}</button>)}</div><span className="scene-count">{String(visibleCities.length).padStart(2, "0")} <span>SCENES</span></span></div>
        <div className="map-frame"><CityMap visibleCities={visibleCities} selected={selected} onSelect={setSelected} accent={accent} zoom={zoom} setZoom={setZoom} /><div className="map-top-label"><span className="map-live"><i /> INTERACTIVE ATLAS</span><span>WEST AFRICA&nbsp; / &nbsp;EAST AFRICA&nbsp; / &nbsp;SOUTHERN AFRICA</span></div><div className="map-legend"><span><i style={{ background: accent }} /> {language === "All" ? "HIP-HOP SCENE" : `${language.toUpperCase()} SCENE`}</span><span className="legend-divider" />{visibleCities.length} LOCATIONS</div><button className="map-compass" aria-label="Compass"><span>N</span><Compass size={17} /></button></div>
        <div className="timeline"><div className="timeline-title"><span className="timeline-icon"><Radio size={15} /></span><div><strong>{french ? "REMBOBINER LE TEMPS" : "REWIND THE CULTURE"}</strong><small>{french ? "Les scènes évoluent au fil des décennies" : "Watch the scene grow, decade by decade"}</small></div></div><div className="timeline-track"><input aria-label="Select a decade" type="range" min="0" max="4" value={decade} onChange={(event) => setDecade(Number(event.target.value))} style={{ "--range-progress": `${decade * 25}%` } as React.CSSProperties} /><div className="decade-labels">{decades.map((year, index) => <button key={year} className={index === decade ? "decade-active" : ""} onClick={() => setDecade(index)}>{year}</button>)}</div></div><span className="timeline-era">{decades[decade]}<small> — {decade < 2 ? "ROOTS & RESISTANCE" : decade === 2 ? "A NEW WAVE" : decade === 3 ? "GLOBAL FREQUENCY" : "THE NEXT SOUND"}</small></span></div>
      </div><CountryPanel city={selected} accent={accent} language={interfaceLanguage} /></div>
      <div className="bottom-note"><span><Volume2 size={13} /> {french ? "LE SON DE CHAQUE VILLE VOUS ATTEND" : "SOUNDTRACKS FOR EVERY CITY ARE COMING"}</span><button>{french ? "ÉCOUTER LES MIX" : "LISTEN TO THE MIXES"} <ArrowUpRight size={12} /></button></div>
    </section>
    <footer className="page-footer" id="about"><span>OFF THE MAP © 2025</span><span>A FIELD GUIDE TO AFRICAN HIP-HOP</span><span>BUILT ON RHYTHM <span className="footer-star">✳</span></span></footer>
  </main>
}
