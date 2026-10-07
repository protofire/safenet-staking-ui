import { LegalPage } from './legal/LegalPage'
import termsContent from '@/resources/legal/Terms.md?raw'

export default function Terms() {
  return <LegalPage content={termsContent} />
}
