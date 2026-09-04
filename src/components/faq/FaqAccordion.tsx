import { Plus, X } from 'lucide-react'

import { MarkdownContent } from '@/components/content/MarkdownContent'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { FaqDocument } from '@/lib/parseFaqMarkdown'

export function FaqAccordion({ document }: { document: FaqDocument }) {
  return (
    <div className="space-y-10">
      {document.sections.map((section) => (
        <section key={section.title}>
          <h2 className="mb-2 text-xl font-semibold tracking-tight text-text">
            {section.title}
          </h2>
          <Accordion type="multiple" className="w-full">
            {section.items.map((item) => (
              <AccordionItem key={item.id} value={item.id} className="border-0">
                <AccordionTrigger
                  showChevron={false}
                  className="py-3.5 hover:no-underline data-[state=open]:pb-2"
                >
                  <span className="flex-1 pr-4 font-medium text-text">{item.question}</span>
                  <Plus
                    aria-hidden
                    className="size-4 shrink-0 text-text-subtle transition-opacity group-data-[state=open]/trigger:hidden"
                  />
                  <X
                    aria-hidden
                    className="hidden size-4 shrink-0 text-text-subtle group-data-[state=open]/trigger:block"
                  />
                </AccordionTrigger>
                <AccordionContent className="pb-3.5">
                  <MarkdownContent content={item.answer} compact />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}
    </div>
  )
}
