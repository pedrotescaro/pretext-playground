import {
  layout,
  layoutNextLine,
  layoutNextLineRange,
  layoutWithLines,
  materializeLineRange,
  measureLineStats,
  measureNaturalWidth,
  prepare,
  prepareWithSegments,
  type LayoutCursor,
  type LayoutLine,
  type PrepareOptions,
  type PreparedText,
  type PreparedTextWithSegments,
} from '@chenglou/pretext'
import type { CSSProperties } from 'react'
import {
  FONT_PRESETS,
  TEXT_CARDS,
  type FontPreset,
  type FontPresetId,
} from './playground-data'

const PREPARE_OPTIONS: PrepareOptions = { whiteSpace: 'pre-wrap' }
const preparedCache = new Map<string, PreparedText>()
const preparedSegmentCache = new Map<string, PreparedTextWithSegments>()

export type VisualLine = LayoutLine & {
  index: number
  x: number
  y: number
  slotWidth: number
}

export type LiveLayoutModel = {
  height: number
  lineCount: number
  maxLineWidth: number
  naturalWidth: number
  lines: VisualLine[]
  prepared: PreparedTextWithSegments
}

export type ManualLayoutModel = {
  height: number
  lineCount: number
  lines: VisualLine[]
}

export type SlotInterval = {
  left: number
  right: number
}

export type DebugSlot = {
  top: number
  left: number
  width: number
  height: number
}

export type CircleObstacle = {
  x: number
  y: number
  radius: number
}

export type ObstacleLayoutModel = {
  height: number
  fragments: VisualLine[]
  slots: DebugSlot[]
  exhausted: boolean
}

export type PositionedTextCard = {
  id: string
  title: string
  body: string
  accent: string
  x: number
  y: number
  width: number
  height: number
  lineCount: number
}

export type MasonryLayoutModel = {
  cardWidth: number
  columnCount: number
  height: number
  cards: PositionedTextCard[]
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function getFontPreset(fontId: FontPresetId): FontPreset {
  return FONT_PRESETS.find(font => font.id === fontId) ?? FONT_PRESETS[0]!
}

export function buildCanvasFont(fontId: FontPresetId, size: number): string {
  const preset = getFontPreset(fontId)
  return `${preset.weight} ${size}px ${preset.family}`
}

export function buildTextStyle(
  fontId: FontPresetId,
  size: number,
  lineHeight: number,
): CSSProperties {
  const preset = getFontPreset(fontId)
  return {
    fontFamily: preset.family,
    fontWeight: preset.weight,
    fontSize: `${size}px`,
    lineHeight: `${lineHeight}px`,
  }
}

function makeCacheKey(text: string, font: string): string {
  return `${font}::${text}`
}

function getPrepared(text: string, font: string): PreparedText {
  const key = makeCacheKey(text, font)
  const cached = preparedCache.get(key)
  if (cached !== undefined) return cached
  const next = prepare(text, font, PREPARE_OPTIONS)
  preparedCache.set(key, next)
  return next
}

function getPreparedWithSegments(text: string, font: string): PreparedTextWithSegments {
  const key = makeCacheKey(text, font)
  const cached = preparedSegmentCache.get(key)
  if (cached !== undefined) return cached
  const next = prepareWithSegments(text, font, PREPARE_OPTIONS)
  preparedSegmentCache.set(key, next)
  return next
}

export function computeLiveLayout(
  text: string,
  font: string,
  width: number,
  lineHeight: number,
): LiveLayoutModel {
  const prepared = getPreparedWithSegments(text, font)
  const measured = layout(getPrepared(text, font), width, lineHeight)
  const stats = measureLineStats(prepared, width)
  const withLines = layoutWithLines(prepared, width, lineHeight)

  return {
    prepared,
    height: measured.height,
    lineCount: measured.lineCount,
    maxLineWidth: stats.maxLineWidth,
    naturalWidth: measureNaturalWidth(prepared),
    lines: withLines.lines.map((line, index) => ({
      ...line,
      index,
      x: 0,
      y: index * lineHeight,
      slotWidth: width,
    })),
  }
}

export function computeManualLayout(
  prepared: PreparedTextWithSegments,
  width: number,
  lineHeight: number,
  selectedLine: number,
  widthScale: number,
  xOffset: number,
): ManualLayoutModel {
  const lines: VisualLine[] = []
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
  let index = 0

  while (index < 500) {
    const isSelected = index === selectedLine
    const slotWidth = clamp(
      Math.round(width * (isSelected ? widthScale : 1) - Math.max(0, xOffset)),
      96,
      width + 220,
    )
    const range = layoutNextLineRange(prepared, cursor, slotWidth)
    if (range === null) break
    const line = materializeLineRange(prepared, range)
    lines.push({
      ...line,
      index,
      x: isSelected ? xOffset : 0,
      y: index * lineHeight,
      slotWidth,
    })
    cursor = range.end
    index += 1
  }

  return {
    height: lines.length * lineHeight,
    lineCount: lines.length,
    lines,
  }
}

function circleIntervalForBand(
  obstacle: CircleObstacle,
  bandTop: number,
  bandBottom: number,
  horizontalPadding: number,
  verticalPadding: number,
): SlotInterval | null {
  const top = bandTop - verticalPadding
  const bottom = bandBottom + verticalPadding
  if (top >= obstacle.y + obstacle.radius || bottom <= obstacle.y - obstacle.radius) {
    return null
  }

  const minDy =
    obstacle.y >= top && obstacle.y <= bottom
      ? 0
      : obstacle.y < top
        ? top - obstacle.y
        : obstacle.y - bottom

  if (minDy >= obstacle.radius) return null
  const halfWidth = Math.sqrt(obstacle.radius * obstacle.radius - minDy * minDy)
  return {
    left: obstacle.x - halfWidth - horizontalPadding,
    right: obstacle.x + halfWidth + horizontalPadding,
  }
}

function carveSlots(base: SlotInterval, blocked: SlotInterval[]): SlotInterval[] {
  let slots: SlotInterval[] = [base]

  for (let index = 0; index < blocked.length; index += 1) {
    const interval = blocked[index]!
    const next: SlotInterval[] = []

    for (let slotIndex = 0; slotIndex < slots.length; slotIndex += 1) {
      const slot = slots[slotIndex]!
      if (interval.right <= slot.left || interval.left >= slot.right) {
        next.push(slot)
        continue
      }
      if (interval.left > slot.left) next.push({ left: slot.left, right: interval.left })
      if (interval.right < slot.right) next.push({ left: interval.right, right: slot.right })
    }

    slots = next
  }

  return slots.filter(slot => slot.right - slot.left >= 48)
}

export function computeObstacleLayout(
  prepared: PreparedTextWithSegments,
  width: number,
  lineHeight: number,
  obstacle: CircleObstacle | null,
  maxHeight = 520,
): ObstacleLayoutModel {
  const fragments: VisualLine[] = []
  const slots: DebugSlot[] = []
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
  let exhausted = false
  let bandTop = 0

  while (bandTop + lineHeight <= maxHeight && fragments.length < 900) {
    const blocked = obstacle === null
      ? []
      : [circleIntervalForBand(obstacle, bandTop, bandTop + lineHeight, 16, 4)].filter(
          (value): value is SlotInterval => value !== null,
        )

    const bandSlots = carveSlots({ left: 0, right: width }, blocked).sort((left, right) => left.left - right.left)

    if (bandSlots.length === 0) {
      bandTop += lineHeight
      continue
    }

    for (let slotIndex = 0; slotIndex < bandSlots.length; slotIndex += 1) {
      const slot = bandSlots[slotIndex]!
      const slotWidth = slot.right - slot.left
      slots.push({
        top: bandTop,
        left: slot.left,
        width: slotWidth,
        height: lineHeight,
      })

      const line = layoutNextLine(prepared, cursor, slotWidth)
      if (line === null) {
        exhausted = true
        break
      }

      fragments.push({
        ...line,
        index: fragments.length,
        x: slot.left,
        y: bandTop,
        slotWidth,
      })
      cursor = line.end
    }

    if (exhausted) break
    bandTop += lineHeight
  }

  const lastBottom = fragments.length === 0
    ? lineHeight * 4
    : fragments[fragments.length - 1]!.y + lineHeight

  return {
    height: Math.max(lastBottom, obstacle === null ? 0 : obstacle.y + obstacle.radius + 36),
    fragments,
    slots,
    exhausted,
  }
}

export function computeMasonryLayout(
  font: string,
  lineHeight: number,
  boardWidth: number,
): MasonryLayoutModel {
  const safeBoardWidth = Math.max(420, boardWidth)
  const gap = 18
  const padding = 18
  const columnCount = safeBoardWidth >= 900 ? 3 : safeBoardWidth >= 620 ? 2 : 1
  const cardWidth = Math.floor((safeBoardWidth - gap * (columnCount - 1)) / columnCount)
  const columnHeights = new Array<number>(columnCount).fill(0)
  const cards: PositionedTextCard[] = []

  for (let index = 0; index < TEXT_CARDS.length; index += 1) {
    const card = TEXT_CARDS[index]!
    let shortestColumn = 0

    for (let column = 1; column < columnCount; column += 1) {
      if (columnHeights[column]! < columnHeights[shortestColumn]!) {
        shortestColumn = column
      }
    }

    const textWidth = cardWidth - padding * 2
    const measured = layout(getPrepared(card.body, font), textWidth, lineHeight)
    const totalHeight = measured.height + padding * 2 + 70

    cards.push({
      ...card,
      x: shortestColumn * (cardWidth + gap),
      y: columnHeights[shortestColumn]!,
      width: cardWidth,
      height: totalHeight,
      lineCount: measured.lineCount,
    })

    columnHeights[shortestColumn]! += totalHeight + gap
  }

  return {
    cardWidth,
    columnCount,
    height: Math.max(...columnHeights) - gap,
    cards,
  }
}

export function formatSegmentLabel(segment: string): string {
  return segment
    .replaceAll('\n', '<NL>')
    .replaceAll('\t', '<TAB>')
    .replaceAll(' ', '<SP>')
}
