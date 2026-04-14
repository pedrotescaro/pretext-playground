import type { ReactNode } from 'react'

type PanelProps = {
  eyebrow: string
  title: string
  subtitle: string
  actions?: ReactNode
  className?: string
  children: ReactNode
}

export function Panel({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
  children,
}: PanelProps) {
  const classes = [
    'rounded-[28px] border border-white/10 bg-slate-950/65 shadow-[0_20px_80px_rgba(4,12,24,0.45)] backdrop-blur-xl',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={classes}>
      <div className="border-b border-white/6 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-cyan-200/70">
              {eyebrow}
            </p>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight text-slate-50">
                {title}
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-300/75">
                {subtitle}
              </p>
            </div>
          </div>
          {actions}
        </div>
      </div>
      <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
    </section>
  )
}
