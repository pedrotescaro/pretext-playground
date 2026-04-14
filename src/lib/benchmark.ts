import { layout } from '@chenglou/pretext'
import { computeLiveLayout } from './pretext-models'

export type BenchmarkResult = {
  domMs: number
  pretextPrepareMs: number
  pretextLayoutMs: number
  pretextTotalMs: number
  domHeight: number
  pretextHeight: number
  iterations: number
  ratio: number
}

export function runBenchmarks(
  probe: HTMLDivElement,
  text: string,
  font: string,
  width: number,
  lineHeight: number,
): BenchmarkResult {
  const widths = Array.from({ length: 64 }, (_, index) => {
    const wave = [-42, -18, 0, 24][index % 4]!
    return Math.max(180, width + wave)
  })

  const prepareStart = performance.now()
  const live = computeLiveLayout(text, font, width, lineHeight)
  const pretextPrepareMs = performance.now() - prepareStart

  let pretextHeight = 0
  const pretextLayoutStart = performance.now()
  for (let index = 0; index < widths.length; index += 1) {
    pretextHeight = layout(live.prepared, widths[index]!, lineHeight).height
  }
  const pretextLayoutMs = performance.now() - pretextLayoutStart

  probe.style.font = font
  probe.style.lineHeight = `${lineHeight}px`
  probe.style.whiteSpace = 'pre-wrap'
  probe.textContent = text

  let domHeight = 0
  const domStart = performance.now()
  for (let index = 0; index < widths.length; index += 1) {
    probe.style.width = `${widths[index]}px`
    domHeight = probe.getBoundingClientRect().height
  }
  const domMs = performance.now() - domStart

  const pretextTotalMs = pretextPrepareMs + pretextLayoutMs
  return {
    domMs,
    pretextPrepareMs,
    pretextLayoutMs,
    pretextTotalMs,
    domHeight,
    pretextHeight,
    iterations: widths.length,
    ratio: domMs / Math.max(pretextTotalMs, 0.001),
  }
}
