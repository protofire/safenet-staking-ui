import { MarkdownContent } from '@/components/content/MarkdownContent'

export function LegalPage({ title, content }: { title?: string; content?: string }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 lg:px-12">
      {content ? (
        <article className="legal-content">
          <MarkdownContent content={content} />
        </article>
      ) : (
        <h1>{title}</h1>
      )}
    </main>
  )
}
