import imprintContent from '@/legal/Imprint.md?raw'

import { LegalPage } from './legal/LegalPage'

export default function Imprint() {
  return <LegalPage content={imprintContent} />
}
