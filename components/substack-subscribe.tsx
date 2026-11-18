type SubstackSubscribeProps = {
  title: string
  className?: string
}

export function SubstackSubscribe({ title, className = "" }: SubstackSubscribeProps) {
  return <iframe
    className={`substack-embed ${className}`.trim()}
    src="https://transatlanticwestafrica.substack.com/embed"
    title={title}
    loading="lazy"
    width="480"
    height="320"
    frameBorder="0"
    scrolling="no"
  />
}
