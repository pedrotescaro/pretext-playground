import type { CSSProperties } from 'react'
import type { MasonryLayoutModel } from '../lib/pretext-models'
import { Panel } from './Panel'

type MasonryPanelProps = {
  layout: MasonryLayoutModel
  boardWidth: number
  textStyle: CSSProperties
}

export function MasonryPanel({
  layout,
  boardWidth,
  textStyle,
}: MasonryPanelProps) {
  return (
    <Panel
      eyebrow="Smart Cards"
      title="Masonry sem medir texto no DOM"
      subtitle="Cada card nasce com altura conhecida via Pretext. O algoritmo posiciona no menor eixo disponivel e evita o ciclo medir -> reposicionar."
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Columns</div>
            <div className="mt-2 text-xl font-semibold text-white">{layout.columnCount}</div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Card width</div>
            <div className="mt-2 text-xl font-semibold text-white">{layout.cardWidth}px</div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Board</div>
            <div className="mt-2 text-xl font-semibold text-white">{boardWidth}px</div>
          </div>
        </div>

        <div className="overflow-auto rounded-[24px] border border-white/8 bg-slate-950/70 p-4">
          <div
            className="relative mx-auto rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(9,15,28,0.94),rgba(3,8,18,0.86))] p-2"
            style={{ width: `${boardWidth}px`, height: `${layout.height + 16}px` }}
          >
            {layout.cards.map(card => (
              <article
                key={card.id}
                className="absolute overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/90 px-4 py-4 shadow-[0_20px_45px_rgba(2,6,23,0.48)]"
                style={{
                  left: `${card.x + 8}px`,
                  top: `${card.y + 8}px`,
                  width: `${card.width}px`,
                  height: `${card.height}px`,
                  boxShadow: `0 18px 38px color-mix(in srgb, ${card.accent} 20%, transparent)`,
                }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-16 opacity-55"
                  style={{
                    background: `radial-gradient(circle at top left, ${card.accent}55, transparent 70%)`,
                  }}
                />
                <div className="relative flex h-full flex-col">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.26em] text-slate-300">
                      {card.title}
                    </span>
                    <span className="font-mono text-xs text-slate-500">{card.lineCount} lines</span>
                  </div>
                  <p
                    className="mt-5 whitespace-pre-wrap text-slate-100"
                    style={textStyle}
                  >
                    {card.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  )
}
