import { LegalPage } from './legal/LegalPage'
import cookieContent from '@/resources/legal/Cookie.md?raw'

export default function Cookies() {
  return <LegalPage content={cookieContent} />
}
