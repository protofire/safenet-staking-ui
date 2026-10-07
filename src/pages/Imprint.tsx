import { LegalPage } from './legal/LegalPage'
import imprintContent from '@/resources/legal/Imprint.md?raw'

export default function Imprint() {
  return <LegalPage content={imprintContent} />
}
