import {
  layoutNextLine,
  prepareWithSegments,
  type LayoutCursor,
  type PreparedTextWithSegments,
} from '@chenglou/pretext'
import type { CSSProperties } from 'react'
import type { StoryBlock, StoryBlockType } from './spiderman-content'

export type SilhouetteInterval = {
  left: number
  right: number
} | null

type LayoutSlot = {
  left: number
  right: number
}

type BlockStyle = {
  font: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  fontStyle: 'normal' | 'italic'
  lineHeight: number
  marginTop: number
  color: string
  letterSpacing: string
  textTransform: 'none' | 'uppercase'
  opacity: number
}

type PreparedBlock = {
  id: string
  type: StoryBlockType
  prepared: PreparedTextWithSegments
  style: BlockStyle
}

export type PositionedStoryLine = {
  key: string
  text: string
  x: number
  y: number
  width: number
  slotWidth: number
  type: StoryBlockType
  style: CSSProperties
}

export type StoryLayout = {
  lines: PositionedStoryLine[]
  blockHeights: Record<string, number>
  blockPositions: Record<string, { x: number, y: number }>
  lastLineBottom: number
  lastRightPx: number
}

const preparedCache = new Map<string, PreparedTextWithSegments>()
const BASE_BACKGROUND = { r: 6, g: 6, b: 8 }

function getPrepared(text: string, font: string): PreparedTextWithSegments {
  const key = `${font}::${text}`
  const cached = preparedCache.get(key)
  if (cached !== undefined) return cached

  const prepared = prepareWithSegments(text, font, { whiteSpace: 'normal' })
  preparedCache.set(key, prepared)
  return prepared
}

function getBlockStyle(
  type: StoryBlockType,
  viewportWidth: number,
  fontScale: number,
): BlockStyle {
  const compact = viewportWidth < 920
  const bodySize = (compact ? 14 : 17) * fontScale
  const bodyLineHeight = (compact ? 24 : 28) * fontScale
  const eyebrowSize = (compact ? 10 : 11) * fontScale
  const quoteSize = (compact ? 24 : 30) * fontScale

  switch (type) {
    case 'eyebrow':
      return {
        font: `700 ${eyebrowSize}px "Space Grotesk", sans-serif`,
        fontFamily: '"Space Grotesk", sans-serif',
        fontSize: eyebrowSize,
        fontWeight: 700,
        fontStyle: 'normal',
        lineHeight: (compact ? 16 : 18) * fontScale,
        marginTop: (compact ? 18 : 24) * fontScale,
        color: '#8d8d8d',
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        opacity: 0.92,
      }
    case 'quote':
      return {
        font: `italic 500 ${quoteSize}px "Newsreader", serif`,
        fontFamily: '"Newsreader", serif',
        fontSize: quoteSize,
        fontWeight: 500,
        fontStyle: 'italic',
        lineHeight: (compact ? 28 : 34) * fontScale,
        marginTop: (compact ? 12 : 18) * fontScale,
        color: '#d8c8b1',
        letterSpacing: '0.01em',
        textTransform: 'none',
        opacity: 0.98,
      }
    case 'list':
      return {
        font: `500 ${bodySize}px "IBM Plex Mono", monospace`,
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: bodySize,
        fontWeight: 500,
        fontStyle: 'normal',
        lineHeight: bodyLineHeight,
        marginTop: 8 * fontScale,
        color: '#b4b4b4',
        letterSpacing: '0.01em',
        textTransform: 'none',
        opacity: 0.88,
      }
    case 'body':
      return {
        font: `450 ${bodySize}px "Newsreader", serif`,
        fontFamily: '"Newsreader", serif',
        fontSize: bodySize,
        fontWeight: 450,
        fontStyle: 'normal',
        lineHeight: bodyLineHeight,
        marginTop: 12 * fontScale,
        color: '#ded9d0',
        letterSpacing: '0.005em',
        textTransform: 'none',
        opacity: 0.94,
      }
  }
}

function getRenderableText(block: StoryBlock): string {
  if (block.type === 'list') return block.text
  return block.text
}

function prepareBlocks(
  blocks: StoryBlock[],
  viewportWidth: number,
  fontScale: number,
): PreparedBlock[] {
  return blocks.map(block => {
    const style = getBlockStyle(block.type, viewportWidth, fontScale)
    return {
      id: block.id,
      type: block.type,
      style,
      prepared: getPrepared(getRenderableText(block), style.font),
    }
  })
}

function toLineStyle(style: BlockStyle): CSSProperties {
  return {
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    fontSize: `${style.fontSize}px`,
    lineHeight: `${style.lineHeight}px`,
    color: style.color,
    letterSpacing: style.letterSpacing,
    textTransform: style.textTransform,
    opacity: style.opacity,
    textShadow: '0 1px 10px rgba(0, 0, 0, 0.2)',
  }
}

function carveSlots(base: LayoutSlot, blocked: LayoutSlot[], minWidth = 24): LayoutSlot[] {
  let slots: LayoutSlot[] = [base]

  for (let index = 0; index < blocked.length; index += 1) {
    const block = blocked[index]!
    const next: LayoutSlot[] = []

    for (let slotIndex = 0; slotIndex < slots.length; slotIndex += 1) {
      const slot = slots[slotIndex]!
      if (block.right <= slot.left || block.left >= slot.right) {
        next.push(slot)
        continue
      }

      if (block.left > slot.left) {
        next.push({ left: slot.left, right: block.left })
      }
      if (block.right < slot.right) {
        next.push({ left: block.right, right: slot.right })
      }
    }

    slots = next
  }

  return slots
    .filter(slot => slot.right > slot.left)
    .filter(slot => slot.right - slot.left >= minWidth)
}

function getSlotWidth(slot: LayoutSlot): number {
  return slot.right - slot.left
}

function getSlotCenter(slot: LayoutSlot): number {
  return slot.left + getSlotWidth(slot) / 2
}

function samplePercentile(values: number[], ratio: number): number {
  if (values.length === 0) return 0

  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.round((sorted.length - 1) * ratio)),
  )
  return sorted[index]!
}

function chooseBestSlot(
  slots: LayoutSlot[],
  preferredCenter: number,
): LayoutSlot | null {
  if (slots.length === 0) return null

  return [...slots].sort((left, right) => {
    const widthDelta = getSlotWidth(right) - getSlotWidth(left)
    if (Math.abs(widthDelta) > 24) return widthDelta

    return (
      Math.abs(getSlotCenter(left) - preferredCenter) -
      Math.abs(getSlotCenter(right) - preferredCenter)
    )
  })[0] ?? null
}

function getBandSilhouette(
  rows: SilhouetteInterval[],
  viewportWidth: number,
  viewportHeight: number,
  bandTop: number,
  bandBottom: number,
  horizontalPadding: number,
  verticalPadding: number,
): LayoutSlot | null {
  const sampleScale = rows.length / viewportHeight
  const bandHeight = Math.max(1, bandBottom - bandTop)
  const effectiveTop = bandTop + bandHeight * 0.22
  const effectiveBottom = bandBottom - bandHeight * 0.22
  const from = Math.max(0, Math.floor((effectiveTop - verticalPadding) * sampleScale))
  const to = Math.min(
    rows.length - 1,
    Math.ceil((effectiveBottom + verticalPadding) * sampleScale),
  )

  const leftEdges: number[] = []
  const rightEdges: number[] = []

  for (let index = from; index <= to; index += 1) {
    const row = rows[index]
    if (row === null || row === undefined) continue
    leftEdges.push(row.left)
    rightEdges.push(row.right)
  }

  if (leftEdges.length === 0 || rightEdges.length === 0) return null

  const left = samplePercentile(leftEdges, leftEdges.length > 3 ? 0.42 : 0.25)
  const right = samplePercentile(rightEdges, rightEdges.length > 3 ? 0.58 : 0.75)

  if (!Number.isFinite(left) || !Number.isFinite(right) || right <= left) {
    return null
  }

  return {
    left: Math.max(0, left * viewportWidth - horizontalPadding),
    right: Math.min(viewportWidth, right * viewportWidth + horizontalPadding),
  }
}

export function sampleSilhouetteIntervals(
  sourceCanvas: HTMLCanvasElement,
  workCanvas: HTMLCanvasElement,
  sampleWidth = 360,
  sampleHeight = 220,
  threshold = 54,
): SilhouetteInterval[] {
  workCanvas.width = sampleWidth
  workCanvas.height = sampleHeight

  const context = workCanvas.getContext('2d', { willReadFrequently: true })
  if (context === null) return Array.from({ length: sampleHeight }, () => null)

  context.clearRect(0, 0, sampleWidth, sampleHeight)
  context.drawImage(sourceCanvas, 0, 0, sampleWidth, sampleHeight)

  const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight)
  const rows: SilhouetteInterval[] = []

  for (let y = 0; y < sampleHeight; y += 1) {
    let left = sampleWidth
    let right = -1

    for (let x = 0; x < sampleWidth; x += 1) {
      const offset = (y * sampleWidth + x) * 4
      const diff =
        Math.abs(data[offset]! - BASE_BACKGROUND.r) +
        Math.abs(data[offset + 1]! - BASE_BACKGROUND.g) +
        Math.abs(data[offset + 2]! - BASE_BACKGROUND.b)

      if (diff <= threshold) continue
      if (x < left) left = x
      if (x > right) right = x
    }

    rows.push(
      right >= left
        ? {
            left: left / sampleWidth,
            right: (right + 1) / sampleWidth,
          }
        : null,
    )
  }

  return rows
}

function getReadableSlotWidth(style: BlockStyle, type: StoryBlockType, maxWidth: number): number {
  let minimum = 180

  switch (type) {
    case 'eyebrow':
      minimum = Math.max(style.fontSize * 9, 132)
      break
    case 'quote':
      minimum = Math.max(style.fontSize * 8.5, 250)
      break
    case 'list':
      minimum = Math.max(style.fontSize * 12, 260)
      break
    case 'body':
      minimum = Math.max(style.fontSize * 10.2, 180)
      break
  }

  return Math.min(maxWidth, minimum)
}

export function layoutStoryAroundSilhouette(options: {
  blocks: StoryBlock[]
  viewportWidth: number
  viewportHeight: number
  rows: SilhouetteInterval[]
  fontSizeMult?: number
}): StoryLayout {
  const { blocks, viewportWidth, viewportHeight, rows, fontSizeMult = 1 } = options

  const preparedBlocks = prepareBlocks(blocks, viewportWidth, fontSizeMult)
  const horizontalPadding = viewportWidth < 920 ? 0 : 1
  const verticalPadding = 0
  const lines: PositionedStoryLine[] = []
  const blockHeights: Record<string, number> = {}
  const blockPositions: Record<string, { x: number, y: number }> = {}
  let lastLineBottom = 0
  let lastRightPx = 0

  const sortedIndices = Array.from({ length: blocks.length }, (_, index) => index).sort(
    (left, right) => blocks[left]!.y - blocks[right]!.y,
  )
  const columns: { x: number, bottomY: number, lastType: StoryBlockType }[] = []

  for (let orderIndex = 0; orderIndex < sortedIndices.length; orderIndex += 1) {
    const blockIndex = sortedIndices[orderIndex]!
    const block = blocks[blockIndex]!
    const preparedBlock = preparedBlocks[blockIndex]!
    const lineStyle = toLineStyle(preparedBlock.style)
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
    let startY = block.y
    let matchedColumn = columns.find(column => Math.abs(column.x - block.x) <= 40)

    if (matchedColumn !== undefined) {
      let gap = 16 * fontSizeMult
      if (matchedColumn.lastType === 'eyebrow' && preparedBlock.type === 'body') gap = 8 * fontSizeMult
      if (matchedColumn.lastType === 'quote' || preparedBlock.type === 'quote') gap = 22 * fontSizeMult

      startY = Math.max(startY, matchedColumn.bottomY + gap)
      matchedColumn.x = block.x
      matchedColumn.lastType = preparedBlock.type
    } else {
      matchedColumn = { x: block.x, bottomY: startY, lastType: preparedBlock.type }
      columns.push(matchedColumn)
    }

    blockPositions[preparedBlock.id] = { x: block.x, y: startY }

    const baseSlot = {
      left: Math.max(0, block.x),
      right: Math.min(viewportWidth, block.x + block.width),
    }
    const preferredReadableWidth = getReadableSlotWidth(
      preparedBlock.style,
      preparedBlock.type,
      getSlotWidth(baseSlot),
    )
    let preferredCenter = getSlotCenter(baseSlot)
    let y = startY + preparedBlock.style.marginTop
    let stalledBands = 0
    const hardStopY = viewportHeight + preparedBlock.style.lineHeight * 12

    while (y <= hardStopY) {
      const silhouette = getBandSilhouette(
        rows,
        viewportWidth,
        viewportHeight,
        y,
        y + preparedBlock.style.lineHeight,
        horizontalPadding,
        verticalPadding,
      )

      const candidateSlots = carveSlots(
        baseSlot,
        silhouette === null ? [] : [silhouette],
        Math.max(24, preferredReadableWidth * 0.38),
      )
      const readableSlots = candidateSlots.filter(
        slot => getSlotWidth(slot) >= preferredReadableWidth,
      )
      const relaxedWidth = Math.max(112, preferredReadableWidth * 0.72)
      const relaxedSlots = candidateSlots.filter(
        slot => getSlotWidth(slot) >= relaxedWidth,
      )
      let targetSlot = chooseBestSlot(readableSlots, preferredCenter)

      if (targetSlot === null && stalledBands >= 4) {
        targetSlot = chooseBestSlot(relaxedSlots, preferredCenter)
      }

      if (targetSlot === null && stalledBands >= 9) {
        targetSlot = chooseBestSlot(candidateSlots, preferredCenter)
      }

      if (targetSlot === null) {
        y += preparedBlock.style.lineHeight
        stalledBands += 1
        if (stalledBands > Math.ceil(viewportHeight / Math.max(preparedBlock.style.lineHeight, 1))) {
          break
        }
        continue
      }

      const nextLine = layoutNextLine(preparedBlock.prepared, cursor, getSlotWidth(targetSlot))
      if (nextLine === null) break

      stalledBands = 0
      preferredCenter = getSlotCenter(targetSlot)
      cursor = nextLine.end

      lines.push({
        key: `${preparedBlock.id}-${lines.length}`,
        text: nextLine.text,
        x: targetSlot.left,
        y,
        width: nextLine.width,
        slotWidth: getSlotWidth(targetSlot),
        type: preparedBlock.type,
        style: lineStyle,
      })
      lastLineBottom = Math.max(lastLineBottom, y + preparedBlock.style.lineHeight)
      lastRightPx = Math.max(lastRightPx, targetSlot.left + nextLine.width)

      y += preparedBlock.style.lineHeight

      if (cursor.segmentIndex >= preparedBlock.prepared.segments.length) break
    }

    blockHeights[preparedBlock.id] = Math.max(
      block.height,
      y - startY + preparedBlock.style.lineHeight * 0.35,
    )
    matchedColumn.bottomY = startY + blockHeights[preparedBlock.id]!
  }

  return {
    lines,
    blockHeights,
    blockPositions,
    lastLineBottom,
    lastRightPx,
  }
}
