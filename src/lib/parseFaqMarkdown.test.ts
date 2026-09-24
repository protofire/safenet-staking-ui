import { describe, expect, it } from 'vitest'

import { parseFaqMarkdown } from './parseFaqMarkdown'

const sample = `# FAQ \\- Example

## General

**What is staking?**

Staking means locking tokens.

**How do I stake?**

Connect a wallet and choose a validator.

## Rewards

**Are rewards guaranteed?**

No rewards are guaranteed.
`

describe('parseFaqMarkdown', () => {
  it('parses title, sections, and question-answer pairs', () => {
    const doc = parseFaqMarkdown(sample)

    expect(doc.title).toBe('FAQ - Example')
    expect(doc.sections).toHaveLength(2)
    expect(doc.sections[0]?.title).toBe('General')
    expect(doc.sections[0]?.items).toEqual([
      {
        id: 'general-1',
        question: 'What is staking?',
        answer: 'Staking means locking tokens.',
      },
      {
        id: 'general-2',
        question: 'How do I stake?',
        answer: 'Connect a wallet and choose a validator.',
      },
    ])
    expect(doc.sections[1]?.items[0]?.question).toBe('Are rewards guaranteed?')
  })
})

describe('parseFaqMarkdown edge cases', () => {
  it('defaults the title when the document has no h1', () => {
    expect(parseFaqMarkdown('## Only\n\n**Q?**\n\nA').title).toBe('FAQ')
  })

  it('keeps sections that have no questions', () => {
    const doc = parseFaqMarkdown('## Empty\n\n## Full\n\n**Q?**\n\nA')

    expect(doc.sections.map((s) => [s.title, s.items.length])).toEqual([
      ['Empty', 0],
      ['Full', 1],
    ])
  })

  it('keeps a question without an answer with an empty answer', () => {
    const doc = parseFaqMarkdown('## Sec\n\n**Unanswered?**\n')

    expect(doc.sections[0]?.items).toEqual([{ id: 'sec-1', question: 'Unanswered?', answer: '' }])
  })

  it('joins multi-paragraph answers and trims surrounding blank lines', () => {
    const doc = parseFaqMarkdown('## Sec\n\n**Q?**\n\npara one\n\npara two\n\n')

    expect(doc.sections[0]?.items[0]?.answer).toBe('para one\n\npara two')
  })

  it('slugs section titles by dropping punctuation', () => {
    const doc = parseFaqMarkdown("## What's New? (2024)\n\n**Q?**\n\nA")

    expect(doc.sections[0]?.items[0]?.id).toBe('whats-new-2024-1')
  })

  it('numbers item ids across the whole document, not per section', () => {
    const doc = parseFaqMarkdown('## A\n\n**Q1?**\n\nA1\n\n## B\n\n**Q2?**\n\nA2')

    expect(doc.sections.flatMap((s) => s.items.map((i) => i.id))).toEqual(['a-1', 'b-2'])
  })

  it('unescapes markdown dashes and bangs in questions', () => {
    const doc = parseFaqMarkdown('## Sec\n\n**Is it opt\\-in\\!**\n\nA')

    expect(doc.sections[0]?.items[0]?.question).toBe('Is it opt-in!')
  })

  it('drops questions that appear before any section', () => {
    const doc = parseFaqMarkdown('**Orphan?**\n\nlost\n\n## Sec\n\nintro\n\n**Real?**\n\nyes')

    expect(doc.sections[0]?.items.map((i) => i.question)).toEqual(['Real?'])
  })

  it('does not leak lines from a blank question into the next answer', () => {
    const doc = parseFaqMarkdown('## Sec\n\n**  **\n\ngarbage\n\n**Real?**\n\nyes')

    expect(doc.sections[0]?.items[0]?.answer).toBe('yes')
  })
})
