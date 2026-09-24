import { FaqAccordion } from '@/components/faq/FaqAccordion'
import { parseFaqMarkdown } from '@/lib/parseFaqMarkdown'
import faqContent from '@/resources/FAQ.md?raw'

const faqDocument = parseFaqMarkdown(faqContent)

export function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 lg:px-12">
      <header className="mb-10 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text lg:text-3xl">
          Frequently Asked Questions
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-text-muted">
          Common questions about staking SAFE through this interface.
        </p>
      </header>
      <FaqAccordion document={faqDocument} />
    </main>
  )
}
