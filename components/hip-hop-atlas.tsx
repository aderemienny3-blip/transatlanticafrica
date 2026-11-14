"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AttributionControl, GeoJSONSource, getVersion, LngLatBounds, Map as MapLibreMap, Marker, setWorkerUrl } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { ArrowDownRight, ArrowUpRight, AudioLines, ChevronDown, Compass, Disc3, Globe2, Layers3, MapPin, Minus, Plus, Radio, Search, SlidersHorizontal, Volume2 } from "lucide-react"
import sceneRecords from "@/data/scenes.json"
import artistRecords from "@/data/artists.json"
import timelineRecords from "@/data/timeline.json"
import diasporaRecords from "@/data/diaspora.json"

type Language = "All" | "Francophone" | "Anglophone" | "Lusophone"
type Status = "verified" | "draft"
type Source = { title: string; url: string }
type Scene = {
  country: string
  city: string
  coordinates: [number, number] | null
  definingEra: string | null
  localSubgenres: string[]
  keyVenuesOrEvents: string[]
  sources: Source[]
  status: Status
  lastChecked: string
}
type Artist = {
  name: string
  country: string
  city: string | null
  sceneCity?: string | null
  languagesRappedIn: string[]
  yearsActive: string | null
  bio: string
  keyReleases: { title: string; year: number | null }[]
  officialLinks: { spotify: string | null; youtube: string | null; audiomack: string | null }
  sources: Source[]
  status: Status
  lastChecked: string
}
type TimelineEntry = {
  year: number
  country: string
  city: string
  title: string
  description: string
  sources: Source[]
  status: Status
  lastChecked: string
}
type DiasporaRoute = {
  fromCity: string
  toCity: string
  toCoordinates: [number, number]
  label: string
  description: string
  sources: Source[]
  status: Status
  lastChecked: string
}
type MapLayer = "scenes" | "diaspora"

setWorkerUrl(`https://cdn.jsdelivr.net/npm/maplibre-gl@${getVersion()}/dist/maplibre-gl-worker.mjs`)

const scenes = sceneRecords as Scene[]
const artists = artistRecords as Artist[]
const timeline = timelineRecords as TimelineEntry[]
const diasporaRoutes = diasporaRecords as DiasporaRoute[]
const languageByCountry: Record<string, Exclude<Language, "All">> = {
  Senegal: "Francophone",
  "Côte d’Ivoire": "Francophone",
  "DR Congo": "Francophone",
  Ghana: "Anglophone",
  Nigeria: "Anglophone",
  "South Africa": "Anglophone",
  Kenya: "Anglophone",
  Tanzania: "Anglophone",
  Mozambique: "Lusophone",
  Angola: "Lusophone",
}
const accentByLanguage: Record<Language, string> = {
  All: "#d5ff00",
  Francophone: "#ff7657",
  Anglophone: "#c8ff36",
  Lusophone: "#b39aff",
}
const languageFilters: Language[] = ["All", "Francophone", "Anglophone", "Lusophone"]
const formatCount = (value: number) => String(value).padStart(2, "0")

function StatusBadge({ status }: { status: Status }) {
  if (status !== "draft") return null
  return <span className="verification-badge">Needs verification</span>
}

function MapCanvas({
  visibleScenes,
  selected,
  accent,
  zoom,
  setZoom,
  onSelect,
  layer,
  routes,
}: {
  visibleScenes: Scene[]
  selected: Scene
  accent: string
  zoom: number
  setZoom: (value: number) => void
  onSelect: (scene: Scene) => void
  layer: MapLayer
  routes: DiasporaRoute[]
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Marker[]>([])
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    const host = hostRef.current
    if (!host || mapRef.current) return

    const map = new MapLibreMap({
      container: host,
      style: {
        version: 8,
        sources: {
          carto: {
            type: "raster",
            tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors © CARTO",
          },
        },
        layers: [{ id: "carto-dark-basemap", type: "raster", source: "carto" }],
      },
      center: [15, -3],
      zoom: 2.2,
      minZoom: 1.7,
      maxZoom: 8,
      attributionControl: false,
      maxBounds: [[-130, -55], [60, 75]],
    })
    map.addControl(new AttributionControl({ compact: true }), "bottom-right")
    mapRef.current = map

    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(host)
    map.once("load", () => map.resize())

    return () => {
      resizeObserver.disconnect()
      markersRef.current.forEach((marker) => marker.remove())
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = visibleScenes.flatMap((scene) => {
      if (!scene.coordinates) return []
      const button = document.createElement("button")
      const isSelected = scene.city === selected.city
      button.type = "button"
      button.className = `city-marker${isSelected ? " city-marker-active" : ""}${scene.status === "draft" ? " city-marker-draft" : ""}`
      button.setAttribute("aria-label", `${scene.city}, ${scene.country}${scene.status === "draft" ? ", coming soon" : ""}`)
      button.style.setProperty("--marker-color", accent)
      const dot = document.createElement("span")
      dot.className = "marker-dot"
      const label = document.createElement("span")
      label.className = "marker-label"
      label.textContent = scene.city
      const status = document.createElement("span")
      status.className = "marker-coming-soon"
      status.textContent = scene.status === "draft" ? "Coming soon" : ""
      button.append(dot, label, status)
      button.addEventListener("click", () => onSelectRef.current(scene))
      return [new Marker({ element: button, anchor: "center" }).setLngLat(scene.coordinates).addTo(map)]
    })
    if (layer === "diaspora") {
      markersRef.current.push(...routes.map((route) => {
        const hub = document.createElement("button")
        hub.type = "button"
        hub.className = "diaspora-marker"
        hub.setAttribute("aria-label", `${route.toCity}: ${route.label}`)
        hub.title = route.description
        const hubDot = document.createElement("span")
        hubDot.className = "diaspora-marker-dot"
        const hubLabel = document.createElement("span")
        hubLabel.className = "marker-label"
        hubLabel.textContent = route.toCity
        hub.append(hubDot, hubLabel)
        return new Marker({ element: hub, anchor: "center" }).setLngLat(route.toCoordinates).addTo(map)
      }))
    }
  }, [visibleScenes, selected, accent, layer, routes])

  useEffect(() => { mapRef.current?.zoomTo(zoom, { duration: 400 }) }, [zoom])
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const updateRoutes = () => {
      if (!map.isStyleLoaded()) return
      const features = layer === "diaspora" && selected.coordinates ? routes.map((route) => ({
        type: "Feature" as const,
        properties: { label: route.label },
        geometry: { type: "LineString" as const, coordinates: [selected.coordinates!, route.toCoordinates] },
      })) : []
      const data: Parameters<GeoJSONSource["setData"]>[0] = { type: "FeatureCollection", features }
      const existingSource = map.getSource("diaspora-routes") as GeoJSONSource | undefined
      if (existingSource) {
        existingSource.setData(data)
        map.setPaintProperty("diaspora-route-lines", "line-color", accent)
      } else {
        map.addSource("diaspora-routes", { type: "geojson", data })
        map.addLayer({
          id: "diaspora-route-lines",
          type: "line",
          source: "diaspora-routes",
          paint: { "line-color": accent, "line-width": 2, "line-opacity": 0.82, "line-dasharray": [1.5, 1.5] },
        })
      }
    }
    if (map.isStyleLoaded()) updateRoutes()
    else map.once("load", updateRoutes)
    return () => { map.off("load", updateRoutes) }
  }, [layer, routes, selected, accent])
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selected.coordinates) return
    if (layer === "diaspora" && routes.length) {
      const bounds = new LngLatBounds(selected.coordinates, selected.coordinates)
      routes.forEach((route) => bounds.extend(route.toCoordinates))
      map.fitBounds(bounds, { padding: 64, maxZoom: 3, duration: 650 })
    } else {
      map.easeTo({ center: selected.coordinates, duration: 550 })
    }
  }, [selected, layer, routes])

  return <div className="map-canvas" ref={hostRef} aria-label={layer === "diaspora" ? "Map of documented African and diaspora hip-hop connections" : "Interactive map of Sub-Saharan African hip-hop scenes"}>
    <div className="map-coordinate" aria-hidden="true"><Compass size={13} /> {layer === "diaspora" ? "AFRICA ↔ DIASPORA" : "SUB-SAHARAN AFRICA"}</div>
    <div className="map-controls" aria-label="Map controls">
      <button aria-label="Zoom in" onClick={() => setZoom(Math.min(zoom + 0.5, 7))}><Plus size={15} /></button>
      <button aria-label="Zoom out" onClick={() => setZoom(Math.max(zoom - 0.5, 1.7))}><Minus size={15} /></button>
      <span />
      <button aria-label="Reset map view" onClick={() => { setZoom(2.2); mapRef.current?.easeTo({ center: [15, -3], duration: 450 }) }}><Layers3 size={15} /></button>
    </div>
  </div>
}

function SourceList({ sources }: { sources: Source[] }) {
  const uniqueSources = Array.from(new Map(sources.map((source) => [source.url, source])).values())
  if (!uniqueSources.length) return null
  return <div className="source-list">
    <span className="meta-label">SOURCES</span>
    <ul>{uniqueSources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRight size={11} /></a></li>)}</ul>
  </div>
}

function ScenePanel({ scene, accent, language, routes }: { scene: Scene; accent: string; language: "en" | "fr"; routes: DiasporaRoute[] }) {
  const relatedArtists = artists.filter((artist) => artist.country === scene.country && (artist.sceneCity === scene.city || artist.city === scene.city))
  const sceneTimeline = timeline.filter((entry) => entry.country === scene.country && entry.city === scene.city)
  const sceneSources = [
    ...scene.sources,
    ...sceneTimeline.flatMap((entry) => entry.sources),
    ...routes.flatMap((route) => route.sources),
  ]
  const french = language === "fr"
  const isBeingResearched = scene.status === "draft"

  return <aside className="story-panel" aria-label={`${scene.country} hip-hop story`}>
    <div className="panel-topline">
      <span><MapPin size={12} /> {french ? "SCÈNE SÉLECTIONNÉE" : "SELECTED SCENE"}</span>
      <StatusBadge status={scene.status} />
    </div>
    <div className="country-title">
      <div><p className="eyebrow">{scene.country}</p><h2>{scene.city}</h2></div>
      <span className="country-orb" style={{ "--accent": accent } as React.CSSProperties}>{scene.country.slice(0, 2).toUpperCase()}</span>
    </div>

    {isBeingResearched ? <div className="research-state"><span className="research-state-dot" />
      <div><strong>{french ? "SCÈNE EN COURS DE RECHERCHE" : "SCENE BEING RESEARCHED"}</strong><p>We’re gathering verifiable sources for this city. Check back as the record grows.</p></div>
    </div> : <p className="story-copy">{scene.localSubgenres.length ? `Documented local sound: ${scene.localSubgenres.join(", ")}.` : "Source-checked scene information is being gathered."}</p>}

    {scene.localSubgenres.length > 0 && <div className="panel-tags">{scene.localSubgenres.map((genre) => <span key={genre}>{genre}</span>)}</div>}
    {scene.definingEra && <div className="scene-detail-row"><span className="meta-label">DEFINING ERA</span><strong>{scene.definingEra}</strong></div>}
    {scene.keyVenuesOrEvents.length > 0 && <div className="scene-detail-row"><span className="meta-label">VENUES & EVENTS</span><strong>{scene.keyVenuesOrEvents.join(" · ")}</strong></div>}

    {relatedArtists.length > 0 && <>
      <div className="panel-rule" />
      <div className="panel-section-head"><h3>{french ? "ARTISTES DOCUMENTÉS" : "DOCUMENTED ARTISTS"}</h3><span>{formatCount(relatedArtists.length)}</span></div>
      <div className="artist-list">{relatedArtists.map((artist) => <article className="artist-record" key={artist.name}>
        <div className="artist-record-heading"><span className="artist-disc"><Disc3 size={16} /></span><div className="artist-name">{artist.name}<small>{artist.city ?? artist.country}{artist.languagesRappedIn.length ? ` · ${artist.languagesRappedIn.join(", ")}` : ""}</small></div><StatusBadge status={artist.status} /></div>
        <p>{artist.bio}</p>
        {artist.keyReleases.length > 0 && <div className="release-list"><span className="meta-label">KEY RELEASES</span>{artist.keyReleases.map((release) => <span key={`${release.title}-${release.year}`}>{release.title}{release.year ? ` · ${release.year}` : ""}</span>)}</div>}
        <small className="last-checked">Checked {artist.lastChecked}</small>
        <SourceList sources={artist.sources} />
      </article>)}</div>
    </>}

    {sceneTimeline.length > 0 && <div className="scene-timeline-list">{sceneTimeline.map((entry) => <div className="scene-timeline-entry" key={`${entry.year}-${entry.title}`}><span>{entry.year}</span><div><strong>{entry.title}</strong><p>{entry.description}</p></div></div>)}</div>}
    {routes.length > 0 && <div className="diaspora-panel"><span className="meta-label">DOCUMENTED ATLANTIC CONNECTIONS</span>{routes.map((route) => <article key={route.toCity}><strong>{route.toCity}</strong><p>{route.description}</p><StatusBadge status={route.status} /></article>)}</div>}

    <SourceList sources={sceneSources} />
    <div className="panel-footer-meta">LAST CHECKED <time dateTime={scene.lastChecked}>{scene.lastChecked}</time></div>
  </aside>
}

export function HipHopAtlas() {
  const [language, setLanguage] = useState<Language>("All")
  const [selected, setSelected] = useState(scenes.find((scene) => scene.city === "Dakar") ?? scenes[0])
  const [zoom, setZoom] = useState(2.2)
  const [interfaceLanguage, setInterfaceLanguage] = useState<"en" | "fr">("en")
  const [search, setSearch] = useState("")
  const [mapLayer, setMapLayer] = useState<MapLayer>("scenes")
  const accent = accentByLanguage[language]
  const french = interfaceLanguage === "fr"
  const verifiedArtistCount = artists.filter((artist) => artist.status === "verified").length
  const visibleScenes = useMemo(() => scenes.filter((scene) => {
    const languageMatches = language === "All" || languageByCountry[scene.country] === language
    const searchMatches = `${scene.city} ${scene.country}`.toLowerCase().includes(search.toLowerCase())
    return languageMatches && searchMatches
  }), [language, search])
  const activeRoutes = useMemo(() => diasporaRoutes.filter((route) => route.fromCity === selected.city && route.status === "verified"), [selected])
  const handleSelect = useCallback((scene: Scene) => {
    setSelected(scene)
    const sceneLanguage = languageByCountry[scene.country]
    if (sceneLanguage) setLanguage(sceneLanguage)
  }, [])
  const selectLanguage = (next: Language) => {
    setLanguage(next)
    const visible = scenes.filter((scene) => next === "All" || languageByCountry[scene.country] === next)
    if (!visible.some((scene) => scene.city === selected.city) && visible[0]) setSelected(visible[0])
  }
  const selectTimelineEntry = (entry: TimelineEntry) => {
    const target = scenes.find((scene) => scene.city === entry.city && scene.country === entry.country)
      ?? (entry.country === "France" ? scenes.find((scene) => scene.city === "Dakar") : undefined)
    if (!target) return
    handleSelect(target)
    setMapLayer(entry.country === "France" ? "diaspora" : "scenes")
  }

  return <main className="atlas-shell" style={{ "--accent": accent } as React.CSSProperties}>
    <header className="topbar"><a className="brand" href="#top" aria-label="Transatlantic Africa home"><span className="brand-mark"><AudioLines size={18} /></span><span>TRANSATLANTIC<br className="brand-break" /><span className="brand-soft"> AFRICA</span></span><span className="brand-period">.</span></a>
      <nav className="main-nav" aria-label="Main navigation"><a className="nav-active" href="#atlas">{french ? "L’ATLAS" : "THE ATLAS"}</a><a href="#artists">{french ? "ARTISTES" : "ARTISTS"}</a><a href="#sounds">{french ? "LES SONS" : "SOUNDS"}</a><a href="/about-method">{french ? "MÉTHODE" : "ABOUT & METHOD"}</a></nav>
      <div className="top-actions"><button className="language-switch" onClick={() => setInterfaceLanguage(french ? "en" : "fr")} aria-label="Switch interface language"><Globe2 size={14} /> {french ? "FR" : "EN"}<ChevronDown size={12} /></button><button className="submit-button">{french ? "PROPOSER UN ARTISTE" : "SUBMIT AN ARTIST"}<ArrowUpRight size={13} /></button></div>
    </header>
    <section className="intro-row" id="top"><div className="intro-copy"><div className="kicker"><span className="live-dot" /> {french ? "UN ATLAS VIVANT DES CULTURES HIP-HOP" : "A LIVING ATLAS OF HIP-HOP CULTURE"}</div><h1>{french ? <>Le hip-hop<br /><em>sans frontières.</em></> : <>Across the ocean,<br /><em>back to the source.</em></>}</h1><p>{french ? "Du Bronx à Dakar, des rythmes et des idées traversent l’Atlantique dans les deux sens." : "From the Bronx to Dakar and back, hip-hop carries rhythms, stories, and influence in both directions."}</p>
      <div className="intro-foot"><span><span className="tiny-bars">▂ ▄ ▆</span> {formatCount(scenes.length)} CITY RECORDS</span><span className="foot-divider" /><span>{formatCount(verifiedArtistCount)} VERIFIED ARTISTS</span></div></div>
      <div className="intro-side"><div className="chapter-label">01 <span>—</span> A TWO-WAY EXCHANGE</div><p>Different origins.<br />One shared frequency.</p><span className="side-coordinate">AFRICA ↔ ATLANTIC</span><ArrowDownRight className="side-arrow" size={18} /></div>
    </section>
    <section className="atlas-section" id="atlas" aria-label="Interactive hip-hop atlas"><div className="atlas-toolbar"><div className="view-title"><span className="section-number">01</span><h2>{french ? "EXPLORER L’ATLAS" : "EXPLORE THE ATLAS"}</h2><span className="live-label"><span /> SOURCE-LED MAP</span></div><div className="map-tools"><label className="search-field"><Search size={14} /><input aria-label="Search city or country" placeholder="Find a city or country" value={search} onChange={(event) => setSearch(event.target.value)} /></label><span className="map-tools-divider" /><button className="map-tool-button"><SlidersHorizontal size={14} /> <span>{french ? "FILTRES" : "FILTERS"}</span></button></div></div>
      <div className="atlas-layout"><div className="map-column"><div className="filter-bar" role="group" aria-label="Filter by language"><span className="filter-label">{french ? "SCÈNES PAR LANGUE" : "SCENES BY LANGUAGE"}</span><div className="filter-options">{languageFilters.map((item) => <button key={item} onClick={() => selectLanguage(item)} className={`filter-chip${language === item ? " selected" : ""}`} style={language === item ? { "--accent": accentByLanguage[item] } as React.CSSProperties : undefined} aria-pressed={language === item}>{item === "All" ? (french ? "Toutes" : "All scenes") : item}</button>)}</div><span className="scene-count">{formatCount(visibleScenes.length)} <span>CITY RECORDS</span></span></div>
        <div className="map-layer-tabs" role="group" aria-label="Map layer"><button className={mapLayer === "scenes" ? "layer-active" : ""} onClick={() => setMapLayer("scenes")} aria-pressed={mapLayer === "scenes"}>AFRICAN SCENES</button><button className={mapLayer === "diaspora" ? "layer-active" : ""} onClick={() => setMapLayer("diaspora")} aria-pressed={mapLayer === "diaspora"}>DIASPORA LINKS <span>{diasporaRoutes.length}</span></button></div>
        <div className="map-frame"><MapCanvas visibleScenes={visibleScenes} selected={selected} onSelect={handleSelect} accent={accent} zoom={zoom} setZoom={setZoom} layer={mapLayer} routes={activeRoutes} /><div className="map-top-label"><span className="map-live"><i /> INTERACTIVE ATLAS</span><span>ATLANTIC&nbsp; / &nbsp;WEST&nbsp; / &nbsp;EAST&nbsp; / &nbsp;SOUTHERN AFRICA</span></div><div className="map-legend"><span><i style={{ background: accent }} /> {language === "All" ? "AFRICAN HIP-HOP" : `${language.toUpperCase()} SCENES`}</span><span className="legend-divider" />{visibleScenes.length} LOCATIONS</div><button className="map-compass" aria-label="Compass"><span>N</span><Compass size={17} /></button>{mapLayer === "diaspora" && activeRoutes.length === 0 && <div className="diaspora-empty">No sourced connections for this scene yet.</div>}</div>
        {visibleScenes.length === 0 && <p className="no-results">No sourced city records match that search.</p>}
        {timeline.length > 0 ? <div className="timeline"><div className="timeline-title"><span className="timeline-icon"><Radio size={15} /></span><div><strong>{french ? "REPÈRES DOCUMENTÉS" : "DOCUMENTED MOMENTS"}</strong><small>{french ? "Événements datés et sourcés" : "Dated moments with sources"}</small></div></div><div className="timeline-event-list">{timeline.map((entry) => <button className="timeline-event" key={`${entry.year}-${entry.title}`} onClick={() => selectTimelineEntry(entry)}><span>{entry.year}</span><strong>{entry.title}</strong><ArrowUpRight size={13} /></button>)}</div></div> : <div className="timeline timeline-empty"><Radio size={15} /><span>No verified timeline entries yet. The scrubber will appear when sourced dates are added.</span></div>}
      </div><ScenePanel scene={selected} accent={accent} language={interfaceLanguage} routes={activeRoutes} /></div>
      <div className="bottom-note"><span><Volume2 size={13} /> {french ? "DES HISTOIRES, DES SOURCES, UN ATLANTIQUE" : "STORIES, SOURCES, AND A SHARED ATLANTIC"}</span><a href="/about-method">{french ? "VOIR LA MÉTHODE" : "HOW WE RESEARCH"} <ArrowUpRight size={12} /></a></div>
    </section>
    <footer className="page-footer" id="about"><span>TRANSATLANTIC AFRICA © 2026</span><span>A SOURCE-LED FIELD GUIDE TO HIP-HOP</span><span>AFRICA ↔ ATLANTIC</span></footer>
  </main>
}
