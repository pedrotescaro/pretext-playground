import { useEffect, useState } from 'react'
import type { CSSProperties, Dispatch, SetStateAction } from 'react'
import type {
  CircleObstacle,
  ObstacleLayoutModel,
} from '../lib/pretext-models'
import { clamp } from '../lib/pretext-models'
import { Panel } from './Panel'

type DragState = {
  startX: number
  startY: number
  originX: number
  originY: number
}

type ObstacleAwarePanelProps = {
  model: ObstacleLayoutModel
  width: number
  height: number
  lineHeight: number
  textStyle: CSSProperties
  obstacle: CircleObstacle
  setObstacle: Dispatch<SetStateAction<CircleObstacle>>
  enabled: boolean
  setEnabled: Dispatch<SetStateAction<boolean>>
}

export function ObstacleAwarePanel({
  model,
  width,
  height,
  lineHeight,
  textStyle,
  obstacle,
  setObstacle,
  enabled,
  setEnabled,
}: ObstacleAwarePanelProps) {
  const [drag, setDrag] = useState<DragState | null>(null)

  useEffect(() => {
    if (drag === null) return undefined
    const activeDrag = drag

    function handleMove(event: PointerEvent) {
      setObstacle(current => ({
        ...current,
        x: clamp(
          activeDrag.originX + event.clientX - activeDrag.startX,
          current.radius + 18,
          width - current.radius - 18,
        ),
        y: clamp(
          activeDrag.originY + event.clientY - activeDrag.startY,
          current.radius + 18,
          height - current.radius - 18,
        ),
      }))
    }

    function handleUp() {
      setDrag(null)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [drag, height, setObstacle, width])

  return (
    <Panel
      eyebrow="Obstacle Aware"
      title="Texto contornando um circulo dinamico"
      subtitle="Cada banda horizontal calcula as faixas bloqueadas pelo obstaculo e abre slots livres para o texto preencher dos dois lados."
      actions={(
        <button
          className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.24em] transition ${
            enabled
              ? 'border-cyan-300/35 bg-cyan-300/10 text-cyan-50'
              : 'border-white/10 bg-white/[0.04] text-slate-300'
          }`}
          onClick={() => setEnabled(value => !value)}
          type="button"
        >
          {enabled ? 'Obstacle on' : 'Obstacle off'}
        </button>
      )}
    >
      <div className="space-y-4">
        <label className="block rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-slate-300">Raio do obstaculo</span>
            <span className="font-mono text-cyan-100">{obstacle.radius}px</span>
          </div>
          <input
            className="mt-3 w-full"
            type="range"
            min={34}
            max={150}
            step={1}
            value={obstacle.radius}
            onChange={event =>
              setObstacle(current => ({
                ...current,
                radius: Number(event.target.value),
              }))
            }
          />
        </label>

        <div className="overflow-auto rounded-[24px] border border-white/8 bg-slate-950/70 p-4">
          <div
            className="relative mx-auto rounded-[24px] border border-cyan-300/12 bg-[linear-gradient(180deg,rgba(7,13,24,0.96),rgba(2,7,17,0.88))]"
            style={{ width: `${width}px`, height: `${height}px` }}
          >
            {model.slots.map((slot, index) => (
              <div
                key={`${slot.top}-${slot.left}-${index}`}
                className="absolute rounded-lg border border-dashed border-cyan-300/14 bg-cyan-300/[0.03]"
                style={{
                  top: `${slot.top + 4}px`,
                  left: `${slot.left}px`,
                  width: `${slot.width}px`,
                  height: `${Math.max(8, slot.height - 8)}px`,
                }}
              />
            ))}

            {model.fragments.map(fragment => (
              <div
                key={`${fragment.index}-${fragment.start.segmentIndex}-${fragment.start.graphemeIndex}`}
                className="absolute rounded-xl border border-white/12 bg-white/[0.04] px-3"
                style={{
                  left: `${fragment.x}px`,
                  top: `${fragment.y}px`,
                  width: `${fragment.width}px`,
                  height: `${lineHeight}px`,
                  ...textStyle,
                }}
              >
                <span className="block whitespace-pre text-slate-100">{fragment.text}</span>
              </div>
            ))}

            {enabled ? (
              <button
                className="absolute cursor-grab rounded-full border border-cyan-200/40 bg-cyan-200/10 shadow-[0_0_60px_rgba(103,232,249,0.28)] backdrop-blur"
                onPointerDown={event => {
                  event.preventDefault()
                  setDrag({
                    startX: event.clientX,
                    startY: event.clientY,
                    originX: obstacle.x,
                    originY: obstacle.y,
                  })
                }}
                style={{
                  left: `${obstacle.x - obstacle.radius}px`,
                  top: `${obstacle.y - obstacle.radius}px`,
                  width: `${obstacle.radius * 2}px`,
                  height: `${obstacle.radius * 2}px`,
                  background:
                    'radial-gradient(circle at 35% 35%, rgba(103,232,249,0.55), rgba(34,211,238,0.15) 50%, rgba(8,47,73,0.08) 75%)',
                }}
                type="button"
              >
                <span className="sr-only">Arrastar obstaculo</span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Fragments</div>
            <div className="mt-2 text-xl font-semibold text-white">{model.fragments.length}</div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Slots</div>
            <div className="mt-2 text-xl font-semibold text-white">{model.slots.length}</div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Status</div>
            <div className="mt-2 text-xl font-semibold text-white">
              {model.exhausted ? 'fully routed' : 'clipped'}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  )
}
