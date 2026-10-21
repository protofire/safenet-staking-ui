import type { FooterColumn, FooterLink } from './types'
import { chain } from '@/config/chains'
import { getStakingContractAddress } from '@/config/contracts'
import { getExplorerAddressUrl } from '@/lib/explorer'

const HELP_SUPPORT_HREF = 'mailto:safenet-staking-support@protofire.io'
const INCIDENT_LOG_HREF =
  'https://github.com/protofire/safenet-staking-ui/blob/main/docs/INCIDENTS.md'
const STAKING_CONTRACT_HREF = getExplorerAddressUrl(getStakingContractAddress(chain.id))
const STAKING_CONTRACT_LINKS: FooterLink[] =
  STAKING_CONTRACT_HREF === undefined
    ? []
    : [{ label: 'Staking Contract', href: STAKING_CONTRACT_HREF }]

export const RESOURCE_LINKS: FooterLink[] = [
  { label: 'FAQ', to: '/faq' },
  { label: 'Help and Support', href: HELP_SUPPORT_HREF },
]

export const LEGAL_LINKS: FooterLink[] = [
  { label: 'Imprint', to: '/imprint' },
  { label: 'Terms of Service', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Cookie Policy', to: '/cookies' },
]

const MOBILE_LEGAL_LINKS: FooterLink[] = [
  { label: 'Imprint', to: '/imprint' },
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Cookies', to: '/cookies' },
]

export const MOBILE_FOOTER_BAR_LINKS: FooterLink[] = [
  { label: 'FAQ', to: '/faq' },
  { label: 'Support', href: HELP_SUPPORT_HREF },
  ...MOBILE_LEGAL_LINKS,
]

export function buildFooterColumns(): FooterColumn[] {
  return [
    {
      head: 'Staking',
      links: [
        { label: 'Home', to: '/' },
        { label: 'Validators', to: '/validators' },
        { label: 'Portfolio', to: '/portfolio' },
        { label: 'Withdrawals', to: '/withdrawals' },
      ],
    },
    {
      head: 'Resources',
      links: [
        ...RESOURCE_LINKS,
        { label: 'GitHub / Incident Log', href: INCIDENT_LOG_HREF },
        ...STAKING_CONTRACT_LINKS,
      ],
    },
    {
      head: 'Legal',
      links: LEGAL_LINKS,
    },
  ]
}
