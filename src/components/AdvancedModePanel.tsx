import type { CSSProperties } from 'react'
import type {
  LiveLayoutModel,
  ManualLayoutModel,
} from '../lib/pretext-models'
import { formatSegmentLabel } from '../lib/pretext-models'
import { Panel } from './Panel'

type AdvancedModePanelProps = {
  live: LiveLayoutModel
  manual: ManualLayoutModel
  width: number
  lineHeight: number
  textStyle: CSSProperties
  selectedLine: number
  onSelectedLineChange: (value: number) => void
  widthScale: number
  onWidthScaleChange: (value: number) => void
  xOffset: number
  onXOffsetChange: (value: number) => void
}

export function AdvancedModePanel({
  live,
  manual,
  width,
  lineHeight,
  textStyle,
  selectedLine,
  onSelectedLineChange,
  widthScale,
  onWidthScaleChange,
  xOffset,
  onXOffsetChange,
}: AdvancedModePanelProps) {
  const selected = manual.lines[Math.min(selectedLine, manual.lines.length - 1)] ?? null
  const previewWidth = Math.max(
    width + 180,
    ...manual.lines.map(line => line.x + line.slotWidth + 120),
  )

  return (
    <Panel
      eyebrow="Advanced Mode"
      title="prepareWithSegments() + layoutWithLines()"
      subtitle="Inspecione segmentos, receba a versao base do layout e injete intervencoes manuais linha a linha com largura e deslocamento customizados."
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Linha alvo</span>
              <span className="font-mono text-cyan-100">{selectedLine + 1}</span>
            </div>
            <input
              className="w-full"
              type="range"
              min={0}
              max={Math.max(live.lines.length - 1, 0)}
              step={1}
              value={Math.min(selectedLine, Math.max(live.lines.length - 1, 0))}
              onChange={event => onSelectedLineChange(Number(event.target.value))}
            />
          </label>
          <label className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Width scale</span>
              <span className="font-mono text-cyan-100">{widthScale.toFixed(2)}x</span>
            </div>
            <input
              className="w-full"
              type="range"
              min={0.6}
              max={1.4}
              step={0.01}
              value={widthScale}
              onChange={event => onWidthScaleChange(Number(event.target.value))}
            />
          </label>
          <label className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">X offset</span>
              <span className="font-mono text-cyan-100">{xOffset}px</span>
            </div>
            <input
              className="w-full"
              type="range"
              min={-40}
              max={120}
              step={1}
              value={xOffset}
              onChange={event => onXOffsetChange(Number(event.target.value))}
            />
          </label>
        </div>

        <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-[24px] border border-white/8 bg-slate-950/65 p-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                Base lines
              </p>
              <div className="mt-4 max-h-[320px] space-y-2 overflow-auto pr-1">
                {live.lines.map(line => (
                  <button
                    key={line.index}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                      line.index === selectedLine
                        ? 'border-cyan-300/35 bg-cyan-300/[0.08]'
                        : 'border-white/8 bg-white/[0.03] hover:border-white/15'
                    }`}
                    onClick={() => onSelectedLineChange(line.index)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <span>Line {line.index + 1}</span>
                      <span>{Math.round(line.width)}px</span>
                    </div>
                    <div className="mt-2 line-clamp-2 text-sm leading-6 text-slate-200">
                      {line.text}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                Segments
              </p>
              <div className="mt-4 flex max-h-[190px] flex-wrap gap-2 overflow-auto">
                {live.prepared.segments.slice(0, 28).map((segment, index) => (
                  <span
                    key={`${segment}-${index}`}
                    className="rounded-full border border-white/8 bg-slate-950/75 px-3 py-1.5 font-mono text-[11px] text-slate-300"
                  >
                    {formatSegmentLabel(segment)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="overflow-auto rounded-[24px] border border-white/8 bg-slate-950/70 p-4">
              <div
                className="relative rounded-[24px] border border-dashed border-cyan-300/18 bg-[linear-gradient(180deg,rgba(8,15,28,0.94),rgba(3,8,18,0.84))] p-6"
                style={{ width: `${previewWidth}px`, height: `${Math.max(manual.height, lineHeight * 6) + 48}px` }}
              >
                <div
                  className="absolute bottom-6 top-6 rounded-[18px] border border-white/10 bg-slate-950/55"
                  style={{ left: '72px', width: `${width}px` }}
                />

                {manual.lines.map(line => {
                  const isSelected = line.index === selectedLine
                  return (
                    <div
                      key={`${line.index}-${line.start.segmentIndex}-${line.start.graphemeIndex}`}
                      className={`absolute rounded-xl border px-3 ${
                        isSelected
                          ? 'border-fuchsia-300/55 bg-fuchsia-300/[0.10] shadow-[0_0_36px_rgba(217,70,239,0.18)]'
                          : 'border-white/12 bg-white/[0.03]'
                      }`}
                      style={{
                        left: `${72 + line.x}px`,
                        top: `${24 + line.y}px`,
                        width: `${line.width}px`,
                        height: `${lineHeight}px`,
                        ...textStyle,
                      }}
                    >
                      <span className="block whitespace-pre text-slate-100">{line.text}</span>
                      <span className="absolute -right-2 -top-2 rounded-full border border-white/10 bg-slate-950 px-2 py-1 font-mono text-[10px] text-slate-300">
                        {Math.round(line.slotWidth)}px
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                  Manual lines
                </div>
                <div className="mt-2 text-xl font-semibold text-white">{manual.lineCount}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                  Selected slot
                </div>
                <div className="mt-2 text-xl font-semibold text-white">
                  {selected ? `${Math.round(selected.slotWidth)}px` : '--'}
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                  Shift
                </div>
                <div className="mt-2 text-xl font-semibold text-white">
                  {selected ? `${selected.x}px` : '--'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  )
}
