import { useEffect, useRef, useState } from 'react'
import type { BenchmarkResult } from '../lib/benchmark'
import { runBenchmarks } from '../lib/benchmark'
import { Panel } from './Panel'

type PerformancePanelProps = {
  text: string
  font: string
  width: number
  lineHeight: number
  fontsReady: boolean
}

function formatMs(value: number): string {
  return `${value.toFixed(value < 1 ? 2 : 1)}ms`
}

export function PerformancePanel({
  text,
  font,
  width,
  lineHeight,
  fontsReady,
}: PerformancePanelProps) {
  const probeRef = useRef<HTMLDivElement | null>(null)
  const [result, setResult] = useState<BenchmarkResult | null>(null)
  const [completedKey, setCompletedKey] = useState('')
  const [seed, setSeed] = useState(0)
  const runKey = `${seed}::${text}::${font}::${width}::${lineHeight}::${fontsReady}`
  const running = fontsReady && completedKey !== runKey

  useEffect(() => {
    if (!fontsReady || probeRef.current === null) return undefined

    let cancelled = false
    const timer = window.setTimeout(() => {
      if (probeRef.current === null || cancelled) return
      const next = runBenchmarks(probeRef.current, text, font, width, lineHeight)
      if (!cancelled) {
        setResult(next)
        setCompletedKey(runKey)
      }
    }, 120)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [font, fontsReady, lineHeight, runKey, text, width])

  const maxValue = Math.max(
    result?.domMs ?? 0,
    result?.pretextPrepareMs ?? 0,
    result?.pretextLayoutMs ?? 0,
    1,
  )

  const bars = result === null
    ? []
    : [
        { label: 'DOM / getBoundingClientRect', value: result.domMs, tone: 'from-rose-400 to-orange-300' },
        { label: 'Pretext prepare()', value: result.pretextPrepareMs, tone: 'from-cyan-400 to-sky-300' },
        { label: 'Pretext layout()', value: result.pretextLayoutMs, tone: 'from-emerald-400 to-lime-300' },
      ]

  return (
    <Panel
      eyebrow="Performance"
      title="DOM vs Pretext"
      subtitle="A comparacao muda a largura em varios ciclos, forcando leituras de layout no DOM e reaproveitando o hot path do Pretext para o mesmo conjunto de larguras."
      actions={(
        <button
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs uppercase tracking-[0.24em] text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.08]"
          onClick={() => setSeed(value => value + 1)}
          type="button"
        >
          rerun
        </button>
      )}
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Speedup</div>
            <div className="mt-2 text-xl font-semibold text-white">
              {result ? `${result.ratio.toFixed(1)}x` : running ? '...' : '--'}
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Iterations</div>
            <div className="mt-2 text-xl font-semibold text-white">
              {result ? result.iterations : 64}
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Height parity</div>
            <div className="mt-2 text-xl font-semibold text-white">
              {result ? `${Math.round(result.domHeight)} / ${Math.round(result.pretextHeight)}` : '...'}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {running && result === null ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-6 text-sm text-slate-300/75">
              Rodando benchmark visual...
            </div>
          ) : null}

          {bars.map(bar => (
            <div key={bar.label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-slate-300">{bar.label}</span>
                <span className="font-mono text-slate-100">{formatMs(bar.value)}</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-900/80">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${bar.tone}`}
                  style={{ width: `${(bar.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[24px] border border-white/8 bg-slate-950/65 p-4 text-sm leading-6 text-slate-300/75">
          {result ? (
            <p>
              O DOM precisou de {formatMs(result.domMs)} para fechar {result.iterations} leituras de layout.
              No mesmo cenario, o Pretext somou {formatMs(result.pretextTotalMs)} entre
              preparacao e hot path, com o passo de layout puro em {formatMs(result.pretextLayoutMs)}.
            </p>
          ) : (
            <p>Preparando comparacao...</p>
          )}
        </div>
      </div>

      <div
        ref={probeRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-[-9999px] top-0 whitespace-pre-wrap opacity-0"
      />
    </Panel>
  )
}
