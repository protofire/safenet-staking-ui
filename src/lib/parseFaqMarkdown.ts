export type FaqItem = {
  id: string
  question: string
  answer: string
}

export type FaqSection = {
  title: string
  items: FaqItem[]
}

export type FaqDocument = {
  title: string
  sections: FaqSection[]
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function cleanMarkdownText(value: string): string {
  return value.replace(/\\-/g, '-').replace(/\\!/g, '!').trim()
}

export function parseFaqMarkdown(markdown: string): FaqDocument {
  const lines = markdown.split('\n')
  let title = 'FAQ'
  const sections: FaqSection[] = []
  let currentSection: FaqSection | null = null
  let currentQuestion: string | null = null
  let answerLines: string[] = []
  let itemIndex = 0

  function flushItem() {
    const question = cleanMarkdownText(currentQuestion ?? '')
    const answer = answerLines.join('\n').trim()
    currentQuestion = null
    answerLines = []
    if (!currentSection || !question) return

    itemIndex += 1
    currentSection.items.push({
      id: `${slugify(currentSection.title)}-${itemIndex}`,
      question,
      answer,
    })
  }

  function flushSection() {
    flushItem()
    if (currentSection) {
      sections.push(currentSection)
    }
    currentSection = null
  }

  for (const line of lines) {
    if (line.startsWith('# ')) {
      title = cleanMarkdownText(line.slice(2))
      continue
    }

    if (line.startsWith('## ')) {
      flushSection()
      currentSection = { title: cleanMarkdownText(line.slice(3)), items: [] }
      continue
    }

    const questionMatch = line.match(/^\*\*(.+)\*\*$/)
    if (questionMatch?.[1]) {
      flushItem()
      currentQuestion = questionMatch[1]
      continue
    }

    if (currentQuestion) {
      answerLines.push(line)
    }
  }

  flushSection()

  return { title, sections }
}
