import cookieContent from '@/legal/Cookie.md?raw'

import { LegalPage } from './legal/LegalPage'

export default function Cookies() {
  return <LegalPage content={cookieContent} />
}
