import { LegalPage } from './legal/LegalPage'
import privacyContent from '@/legal/Privacy.md?raw'

export default function Privacy() {
  return <LegalPage content={privacyContent} />
}
