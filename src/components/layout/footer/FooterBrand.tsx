import { APP_BRAND_NAME, LOGO_SRC } from '@/config/app'

export function FooterBrand({
  brandName = APP_BRAND_NAME,
  description,
}: {
  brandName?: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5 text-md font-semibold tracking-tight text-text">
        <img
          src={LOGO_SRC}
          alt=""
          width={32}
          height={32}
          decoding="async"
          className="size-8 shrink-0"
        />
        <span>{brandName}</span>
      </div>
      <p className="m-0 max-w-80 text-caption leading-relaxed text-text-muted [text-wrap:pretty]">
        {description}
      </p>
    </div>
  )
}
