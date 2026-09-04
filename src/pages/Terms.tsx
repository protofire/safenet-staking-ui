import termsContent from '@/legal/Terms.md?raw'

import { LegalPage } from './legal/LegalPage'

export default function Terms() {
  return <LegalPage content={termsContent} />
}
