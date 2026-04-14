import type { CSSProperties } from 'react'
import type { LiveLayoutModel } from '../lib/pretext-models'
import { Panel } from './Panel'

type LiveLayoutPanelProps = {
  model: LiveLayoutModel
  width: number
  lineHeight: number
  textStyle: CSSProperties
}

function Metric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-semibold tracking-tight text-white">{value}</div>
    </div>
  )
}

export function LiveLayoutPanel({
  model,
  width,
  lineHeight,
  textStyle,
}: LiveLayoutPanelProps) {
  const firstLine = model.lines[0] ?? null

  return (
    <Panel
      eyebrow="Realtime"
      title="prepare() + layout()"
      subtitle="A largura do container entra como dado. O DOM so recebe o resultado final ja quebrado em linhas, bounding boxes e metrica agregada."
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="overflow-auto rounded-[24px] border border-white/8 bg-slate-950/70 p-4">
          <div className="mx-auto" style={{ width: `${width + 96}px` }}>
            <div className="relative rounded-[24px] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(8,15,28,0.94),rgba(4,10,22,0.86))] p-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div
                className="absolute inset-0 rounded-[24px] opacity-60"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.07) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              <div
                className="relative mx-auto rounded-[20px] border border-cyan-300/20 bg-slate-950/70"
                style={{ width: `${width}px`, height: `${Math.max(model.height, lineHeight * 5)}px` }}
              >
                {model.lines.map(line => {
                  const isHero = line.index === 0
                  return (
                    <div
                      key={`${line.index}-${line.start.segmentIndex}-${line.start.graphemeIndex}`}
                      className={`absolute left-0 rounded-xl border px-3 transition ${
                        isHero
                          ? 'border-cyan-300/45 bg-cyan-300/10 shadow-[0_0_0_1px_rgba(103,232,249,0.12)]'
                          : 'border-white/12 bg-white/[0.03]'
                      }`}
                      style={{
                        top: `${line.y}px`,
                        width: `${line.width}px`,
                        height: `${lineHeight}px`,
                        ...textStyle,
                      }}
                    >
                      <span className="absolute -left-10 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-slate-950/85 px-2 py-1 font-mono text-[11px] text-slate-300">
                        {String(line.index + 1).padStart(2, '0')}
                      </span>
                      <span className="block whitespace-pre text-slate-100">{line.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <Metric label="Linhas" value={String(model.lineCount)} />
            <Metric label="Altura total" value={`${model.height}px`} />
            <Metric label="Maior linha" value={`${Math.round(model.maxLineWidth)}px`} />
          </div>

          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Snapshot
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-300/80">
              <div className="flex items-center justify-between gap-4">
                <span>Largura util</span>
                <span className="font-mono text-slate-100">{width}px</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Natural width</span>
                <span className="font-mono text-slate-100">
                  {Math.round(model.naturalWidth)}px
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Primeira linha</span>
                <span className="font-mono text-slate-100">
                  {firstLine ? `${Math.round(firstLine.width)}px` : '--'}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/65 p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-500">
                Bounding box
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300/75">
                Cada linha eh renderizada separadamente. A caixa representa a largura medida
                pelo Pretext, nao uma inferencia posterior do browser.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  )
}
