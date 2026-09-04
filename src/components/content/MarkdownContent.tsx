import type { Components } from 'react-markdown'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const linkComponent: Components['a'] = ({ href, children }) => {
  const external = href?.startsWith('http')
  return (
    <a
      href={href}
      className="text-brand underline-offset-4 hover:underline"
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  )
}

const markdownComponents: Components = {
  a: linkComponent,
  h1: ({ children }) => (
    <h1 className="text-2xl font-semibold tracking-tight text-text lg:text-3xl">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-10 text-xl font-semibold tracking-tight text-text first:mt-0">{children}</h2>
  ),
  p: ({ children }) => <p className="mt-4 text-base leading-relaxed text-text-muted">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
  ol: ({ children }) => (
    <ol className="mt-4 list-decimal space-y-2 pl-6 text-base leading-relaxed text-text-muted">{children}</ol>
  ),
  ul: ({ children }) => (
    <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-relaxed text-text-muted">{children}</ul>
  ),
  li: ({ children }) => <li>{children}</li>,
}

const compactMarkdownComponents: Components = {
  a: linkComponent,
  p: ({ children }) => <p className="text-text-muted">{children}</p>,
  strong: ({ children }) => <strong className="font-medium text-text">{children}</strong>,
  ol: ({ children }) => <ol className="list-decimal space-y-2 pl-6 text-text-muted">{children}</ol>,
  ul: ({ children }) => <ul className="list-disc space-y-2 pl-6 text-text-muted">{children}</ul>,
  li: ({ children }) => <li>{children}</li>,
}

export function MarkdownContent({
  content,
  compact = false,
}: {
  content: string
  compact?: boolean
}) {
  const rendered = (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={compact ? compactMarkdownComponents : markdownComponents}
    >
      {content}
    </Markdown>
  )

  if (compact) {
    return <div className="[&_ol+p]:mt-3 [&_p+p]:mt-3 [&_ul+p]:mt-3">{rendered}</div>
  }

  return rendered
}
