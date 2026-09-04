export interface FooterLink {
  label: string
  to?: string
  href?: string
  placeholder?: boolean
}

export interface FooterColumn {
  head: string
  links: FooterLink[]
}
