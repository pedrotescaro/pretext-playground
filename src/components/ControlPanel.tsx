import {
  FONT_PRESETS,
  TEXT_PRESETS,
  type FontPresetId,
} from '../lib/playground-data'
import { getFontPreset } from '../lib/pretext-models'
import { Panel } from './Panel'

type ControlPanelProps = {
  text: string
  onTextChange: (value: string) => void
  fontId: FontPresetId
  onFontChange: (value: FontPresetId) => void
  fontSize: number
  onFontSizeChange: (value: number) => void
  lineHeight: number
  onLineHeightChange: (value: number) => void
  containerWidth: number
  onContainerWidthChange: (value: number) => void
  fontsReady: boolean
  syncing: boolean
}

type RangeFieldProps = {
  label: string
  valueLabel: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
}

function RangeField({
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
}: RangeFieldProps) {
  return (
    <label className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 font-mono text-xs text-cyan-100">
          {valueLabel}
        </span>
      </div>
      <input
        className="w-full cursor-ew-resize"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={event => onChange(Number(event.target.value))}
      />
    </label>
  )
}

export function ControlPanel({
  text,
  onTextChange,
  fontId,
  onFontChange,
  fontSize,
  onFontSizeChange,
  lineHeight,
  onLineHeightChange,
  containerWidth,
  onContainerWidthChange,
  fontsReady,
  syncing,
}: ControlPanelProps) {
  const activeFont = getFontPreset(fontId)

  return (
    <Panel
      eyebrow="Command Deck"
      title="Editor e parametros"
      subtitle="Digite, mude fonte, reajuste largura e deixe o Pretext dirigir toda a simulacao de layout em tempo real."
      className="xl:sticky xl:top-6"
      actions={(
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${fontsReady ? 'bg-emerald-400' : 'bg-amber-300'}`} />
          <span className="text-xs uppercase tracking-[0.25em] text-slate-300/65">
            {fontsReady ? 'Font metrics ready' : 'Carregando fontes'}
          </span>
        </div>
      )}
    >
      <div className="space-y-5">
        <div className="rounded-[26px] border border-cyan-400/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(2,8,23,0.86))] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-cyan-100/60">
                Active face
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                {activeFont.label}
              </h3>
              <p className="mt-1 text-sm text-slate-300/70">{activeFont.vibe}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-2 text-right">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">status</p>
              <p className="mt-1 font-mono text-sm text-slate-100">
                {syncing ? 'reflowing...' : 'hot path ready'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-200">Presets</p>
            <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
              pre-wrap
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            {TEXT_PRESETS.map(preset => (
              <button
                key={preset.id}
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-left transition hover:border-cyan-300/30 hover:bg-cyan-400/[0.06]"
                onClick={() => onTextChange(preset.body)}
                type="button"
              >
                <div className="text-sm font-medium text-slate-100">{preset.label}</div>
                <div className="mt-1 text-xs leading-5 text-slate-400">
                  {preset.body.slice(0, 74)}...
                </div>
              </button>
            ))}
          </div>
        </div>

        <label className="block space-y-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-slate-200">Texto</span>
            <span className="font-mono text-xs text-slate-500">
              {text.length} chars
            </span>
          </div>
          <textarea
            className="min-h-[220px] w-full resize-y rounded-[24px] border border-white/8 bg-slate-950/60 px-4 py-4 text-sm leading-7 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/15"
            value={text}
            onChange={event => onTextChange(event.target.value)}
            placeholder="Cole um paragrafo, um manifesto, um verso ou um bloco de UI copy."
          />
        </label>

        <div className="grid gap-4">
          <label className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-300">Fonte</span>
              <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
                canvas shorthand
              </span>
            </div>
            <select
              className="w-full rounded-xl border border-white/8 bg-slate-900/90 px-3 py-3 text-sm text-slate-100 outline-none focus:border-cyan-300/40"
              value={fontId}
              onChange={event => onFontChange(event.target.value as FontPresetId)}
            >
              {FONT_PRESETS.map(font => (
                <option key={font.id} value={font.id}>
                  {font.label} - {font.vibe}
                </option>
              ))}
            </select>
          </label>

          <RangeField
            label="Font size"
            valueLabel={`${fontSize}px`}
            min={16}
            max={54}
            step={1}
            value={fontSize}
            onChange={onFontSizeChange}
          />
          <RangeField
            label="Line height"
            valueLabel={`${lineHeight}px`}
            min={20}
            max={72}
            step={1}
            value={lineHeight}
            onChange={onLineHeightChange}
          />
          <RangeField
            label="Container width"
            valueLabel={`${containerWidth}px`}
            min={220}
            max={720}
            step={2}
            value={containerWidth}
            onChange={onContainerWidthChange}
          />
        </div>
      </div>
    </Panel>
  )
}
