import { LegalPage } from './legal/LegalPage'
import cookieContent from '@/legal/Cookie.md?raw'

export default function Cookies() {
  return <LegalPage content={cookieContent} />
}
