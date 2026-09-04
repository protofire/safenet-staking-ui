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
