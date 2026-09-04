import privacyContent from '@/legal/Privacy.md?raw'

import { LegalPage } from './legal/LegalPage'

export default function Privacy() {
  return <LegalPage content={privacyContent} />
}
