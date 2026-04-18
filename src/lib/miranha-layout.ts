import {
  layoutNextLine,
  prepareWithSegments,
  type LayoutCursor,
  type PreparedTextWithSegments,
} from '@chenglou/pretext'
import type { CSSProperties } from 'react'
import type {
  CameraTelemetry,
  DebugCarvedLine,
  DebugFlowConnection,
  DebugLayoutColumn,
  DebugLineBox,
  DebugSilhouetteRow,
  NarrativeBlockBlueprint,
  NarrativeBlockType,
  StoryLayout,
} from './miranha-types'

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
  type: NarrativeBlockType
  prepared: PreparedTextWithSegments
  style: BlockStyle
}

type ColumnFrame = {
  bottom: number
  columnIndex: number
  left: number
  right: number
  top: number
}

const preparedCache = new Map<string, PreparedTextWithSegments>()
const BASE_BACKGROUND = { r: 5, g: 6, b: 10 }

function getPrepared(text: string, font: string): PreparedTextWithSegments {
  const key = `${font}::${text}`
  const cached = preparedCache.get(key)
  if (cached !== undefined) return cached

  const prepared = prepareWithSegments(text, font, { whiteSpace: 'normal' })
  preparedCache.set(key, prepared)
  return prepared
}

function getBlockStyle(
  type: NarrativeBlockType,
  viewportWidth: number,
  fontScale: number,
): BlockStyle {
  const compact = viewportWidth < 1080
  const bodySize = (compact ? 13 : 15.5) * fontScale
  const bodyLineHeight = (compact ? 20 : 23.5) * fontScale
  const eyebrowSize = (compact ? 9 : 10) * fontScale
  const quoteSize = (compact ? 18 : 24) * fontScale
  const listSize = (compact ? 11 : 12.5) * fontScale

  switch (type) {
    case 'eyebrow':
      return {
        font: `700 ${eyebrowSize}px "Space Grotesk", sans-serif`,
        fontFamily: '"Space Grotesk", sans-serif',
        fontSize: eyebrowSize,
        fontWeight: 700,
        fontStyle: 'normal',
        lineHeight: (compact ? 14 : 16) * fontScale,
        marginTop: (compact ? 16 : 20) * fontScale,
        color: '#847768',
        letterSpacing: '0.32em',
        textTransform: 'uppercase',
        opacity: 0.9,
      }
    case 'quote':
      return {
        font: `italic 600 ${quoteSize}px "Newsreader", serif`,
        fontFamily: '"Newsreader", serif',
        fontSize: quoteSize,
        fontWeight: 600,
        fontStyle: 'italic',
        lineHeight: (compact ? 24 : 30) * fontScale,
        marginTop: (compact ? 10 : 14) * fontScale,
        color: '#efe7de',
        letterSpacing: '0.005em',
        textTransform: 'none',
        opacity: 0.98,
      }
    case 'list':
      return {
        font: `500 ${listSize}px "IBM Plex Mono", monospace`,
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: listSize,
        fontWeight: 500,
        fontStyle: 'normal',
        lineHeight: (compact ? 18 : 21) * fontScale,
        marginTop: 8 * fontScale,
        color: '#b8afa6',
        letterSpacing: '0.015em',
        textTransform: 'none',
        opacity: 0.9,
      }
    case 'body':
      return {
        font: `500 ${bodySize}px "Newsreader", serif`,
        fontFamily: '"Newsreader", serif',
        fontSize: bodySize,
        fontWeight: 500,
        fontStyle: 'normal',
        lineHeight: bodyLineHeight,
        marginTop: 10 * fontScale,
        color: '#e9e0d7',
        letterSpacing: '0.005em',
        textTransform: 'none',
        opacity: 0.96,
      }
  }
}

function prepareBlocks(
  blocks: NarrativeBlockBlueprint[],
  viewportWidth: number,
  fontScale: number,
): PreparedBlock[] {
  return blocks.map(block => {
    const style = getBlockStyle(block.type, viewportWidth, fontScale)

    return {
      id: block.id,
      type: block.type,
      style,
      prepared: getPrepared(block.text, style.font),
    }
  })
}

function toLineStyle(style: BlockStyle): CSSProperties {
  return {
    color: style.color,
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    fontStyle: style.fontStyle,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing,
    lineHeight: `${style.lineHeight}px`,
    opacity: style.opacity,
    textShadow: '0 1px 14px rgba(0, 0, 0, 0.24)',
    textTransform: style.textTransform,
  }
}

function carveSlots(base: LayoutSlot, blocked: LayoutSlot[], minWidth = 24): LayoutSlot[] {
  let slots: LayoutSlot[] = [base]

  for (let index = 0; index < blocked.length; index += 1) {
    const blockedSlot = blocked[index]!
    const next: LayoutSlot[] = []

    for (let slotIndex = 0; slotIndex < slots.length; slotIndex += 1) {
      const slot = slots[slotIndex]!

      if (blockedSlot.right <= slot.left || blockedSlot.left >= slot.right) {
        next.push(slot)
        continue
      }

      if (blockedSlot.left > slot.left) {
        next.push({ left: slot.left, right: blockedSlot.left })
      }

      if (blockedSlot.right < slot.right) {
        next.push({ left: blockedSlot.right, right: slot.right })
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

function chooseBestSlot(slots: LayoutSlot[], preferredCenter: number): LayoutSlot | null {
  if (slots.length === 0) return null

  return [...slots].sort((left, right) => {
    const widthDelta = getSlotWidth(right) - getSlotWidth(left)
    if (Math.abs(widthDelta) > 28) return widthDelta

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
  const effectiveBottom = bandBottom - bandHeight * 0.18
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

  const left = samplePercentile(leftEdges, leftEdges.length > 4 ? 0.4 : 0.25)
  const right = samplePercentile(rightEdges, rightEdges.length > 4 ? 0.6 : 0.75)

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
  sampleWidth = 420,
  sampleHeight = 280,
  threshold = 34,
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

function getReadableSlotWidth(
  block: NarrativeBlockBlueprint,
  style: BlockStyle,
  type: NarrativeBlockType,
  maxWidth: number,
): number {
  if (block.minLineWidth !== undefined) {
    return Math.min(maxWidth, block.minLineWidth)
  }

  let minimum = 180

  switch (type) {
    case 'eyebrow':
      minimum = Math.max(style.fontSize * 10, 140)
      break
    case 'quote':
      minimum = Math.max(style.fontSize * 8.4, 220)
      break
    case 'list':
      minimum = Math.max(style.fontSize * 13.5, 220)
      break
    case 'body':
      minimum = Math.max(style.fontSize * 11.2, 180)
      break
  }

  return Math.min(maxWidth, minimum)
}

function createColumnFrames(block: NarrativeBlockBlueprint, startY: number): ColumnFrame[] {
  const padding = Math.max(0, block.padding ?? 0)
  const requestedColumnCount = Math.max(1, Math.round(block.columnCount ?? 1))
  const gap = Math.max(0, block.columnGap ?? 22)
  const innerLeft = block.x + padding
  const innerTop = startY + padding
  const innerWidth = Math.max(120, block.width - padding * 2)
  const innerHeight = Math.max(60, block.height - padding * 2)

  let columnCount = requestedColumnCount
  let columnWidth =
    (innerWidth - gap * Math.max(0, requestedColumnCount - 1)) / requestedColumnCount

  while (columnCount > 1 && columnWidth < 120) {
    columnCount -= 1
    columnWidth = (innerWidth - gap * Math.max(0, columnCount - 1)) / columnCount
  }

  return Array.from({ length: columnCount }, (_, columnIndex) => {
    const left = innerLeft + columnIndex * (columnWidth + gap)

    return {
      bottom: innerTop + innerHeight,
      columnIndex,
      left,
      right: left + columnWidth,
      top: innerTop,
    }
  })
}

function createSilhouetteDebugRows(
  rows: SilhouetteInterval[],
  viewportWidth: number,
  viewportHeight: number,
): DebugSilhouetteRow[] {
  const debugRows: DebugSilhouetteRow[] = []
  const sampleEvery = Math.max(1, Math.round(rows.length / 72))

  for (let index = 0; index < rows.length; index += sampleEvery) {
    const row = rows[index]
    if (row === null || row === undefined) continue

    debugRows.push({
      left: row.left * viewportWidth,
      right: row.right * viewportWidth,
      y: (index / rows.length) * viewportHeight,
    })
  }

  return debugRows
}

function getBlockSortValue(block: NarrativeBlockBlueprint) {
  return block.flowOrder ?? block.priority ?? block.y
}

export function layoutStoryAroundSilhouette(options: {
  blocks: NarrativeBlockBlueprint[]
  viewportWidth: number
  viewportHeight: number
  rows: SilhouetteInterval[]
  fontScale?: number
}): StoryLayout {
  const { blocks, viewportWidth, viewportHeight, rows, fontScale = 1 } = options
  const preparedBlocks = prepareBlocks(blocks, viewportWidth, fontScale)
  const horizontalPadding = viewportWidth < 920 ? 20 : 44
  const verticalPadding = viewportHeight < 820 ? 6 : 12
  const lines = []
  const blockHeights: Record<string, number> = {}
  const blockPositions: Record<string, { x: number, y: number }> = {}
  const baselines: DebugLineBox[] = []
  const carvedLines: DebugCarvedLine[] = []
  const columnsDebug: DebugLayoutColumn[] = []
  const flowConnections: DebugFlowConnection[] = []
  let lastLineBottom = 0
  let lastRightPx = 0

  const sortedIndices = Array.from({ length: blocks.length }, (_, index) => index).sort((left, right) => {
    const leftBlock = blocks[left]!
    const rightBlock = blocks[right]!
    const orderDelta = getBlockSortValue(leftBlock) - getBlockSortValue(rightBlock)
    if (orderDelta !== 0) return orderDelta
    if (leftBlock.y !== rightBlock.y) return leftBlock.y - rightBlock.y
    return leftBlock.x - rightBlock.x
  })
  const stackedColumns: { x: number, bottomY: number, lastType: NarrativeBlockType }[] = []

  for (let orderIndex = 0; orderIndex < sortedIndices.length; orderIndex += 1) {
    const blockIndex = sortedIndices[orderIndex]!
    const block = blocks[blockIndex]!
    const preparedBlock = preparedBlocks[blockIndex]!
    const lineStyle = toLineStyle(preparedBlock.style)
    const matchingColumn = stackedColumns.find(column => Math.abs(column.x - block.x) <= 64)
    let startY = block.y

    if (matchingColumn !== undefined) {
      let gap = 18 * fontScale
      if (matchingColumn.lastType === 'eyebrow' && preparedBlock.type === 'body') gap = 8 * fontScale
      if (matchingColumn.lastType === 'quote' || preparedBlock.type === 'quote') gap = 26 * fontScale

      startY = Math.max(startY, matchingColumn.bottomY + gap)
      matchingColumn.x = block.x
      matchingColumn.lastType = preparedBlock.type
    } else {
      stackedColumns.push({ x: block.x, bottomY: startY, lastType: preparedBlock.type })
    }

    blockPositions[preparedBlock.id] = { x: block.x, y: startY }

    if (orderIndex > 0) {
      const previousBlock = blocks[sortedIndices[orderIndex - 1]!]!
      const previousPosition = blockPositions[previousBlock.id] ?? { x: previousBlock.x, y: previousBlock.y }

      flowConnections.push({
        fromX: previousPosition.x + previousBlock.width * 0.5,
        fromY: previousPosition.y + Math.min(previousBlock.height, 48),
        label: `${orderIndex + 1}`,
        toX: block.x + block.width * 0.5,
        toY: startY,
      })
    }

    const columnFrames = createColumnFrames({ ...block, y: startY }, startY)
    const preferredReadableWidth = getReadableSlotWidth(
      block,
      preparedBlock.style,
      preparedBlock.type,
      Math.max(...columnFrames.map(column => column.right - column.left)),
    )
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
    let renderedBottom = startY

    for (let columnIndex = 0; columnIndex < columnFrames.length; columnIndex += 1) {
      if (cursor.segmentIndex >= preparedBlock.prepared.segments.length) break

      const column = columnFrames[columnIndex]!
      columnsDebug.push({
        columnIndex: column.columnIndex,
        height: column.bottom - column.top,
        regionId: block.id,
        width: column.right - column.left,
        x: column.left,
        y: column.top,
      })

      let preferredCenter = (column.left + column.right) * 0.5
      let y = column.top + (columnIndex === 0 ? preparedBlock.style.marginTop : 0)
      let stalledBands = 0
      let linesInColumn = 0

      while (y + preparedBlock.style.lineHeight <= column.bottom + preparedBlock.style.lineHeight * 0.3) {
        const silhouette = getBandSilhouette(
          rows,
          viewportWidth,
          viewportHeight,
          y,
          y + preparedBlock.style.lineHeight,
          horizontalPadding,
          verticalPadding,
        )

        const baseSlot = { left: column.left, right: column.right }
        const candidateSlots = carveSlots(
          baseSlot,
          silhouette === null ? [] : [silhouette],
          Math.max(24, preferredReadableWidth * 0.15),
        )
        const relaxedWidth = Math.max(40, preferredReadableWidth * 0.25)
        const readableSlots = candidateSlots.filter(
          slot => getSlotWidth(slot) >= preferredReadableWidth * 0.5,
        )
        const relaxedSlots = candidateSlots.filter(slot => getSlotWidth(slot) >= relaxedWidth)
        let targetSlot = chooseBestSlot(readableSlots, preferredCenter)

        if (targetSlot === null && stalledBands >= 1) {
          targetSlot = chooseBestSlot(relaxedSlots, preferredCenter)
        }

        if (targetSlot === null && stalledBands >= 2) {
          targetSlot = chooseBestSlot(candidateSlots, preferredCenter)
        }

        carvedLines.push({
          chosen: targetSlot,
          columnIndex: column.columnIndex,
          lineHeight: preparedBlock.style.lineHeight,
          regionId: block.id,
          segments: candidateSlots,
          y,
        })

        if (targetSlot === null) {
          stalledBands += 1
          y += preparedBlock.style.lineHeight

          if (linesInColumn === 0 && stalledBands > 2) break
          if (stalledBands > 6) break
          continue
        }

        const nextLine = layoutNextLine(preparedBlock.prepared, cursor, getSlotWidth(targetSlot))
        if (nextLine === null) break

        cursor = nextLine.end
        linesInColumn += 1
        stalledBands = 0
        preferredCenter = getSlotCenter(targetSlot)

        lines.push({
          key: `${preparedBlock.id}-${column.columnIndex}-${lines.length}`,
          regionId: preparedBlock.id,
          slotWidth: getSlotWidth(targetSlot),
          style: lineStyle,
          text: nextLine.text,
          type: preparedBlock.type,
          width: nextLine.width,
          x: targetSlot.left,
          y,
        })
        baselines.push({
          lineHeight: preparedBlock.style.lineHeight,
          regionId: block.id,
          width: getSlotWidth(targetSlot),
          x: targetSlot.left,
          y,
        })
        lastLineBottom = Math.max(lastLineBottom, y + preparedBlock.style.lineHeight)
        lastRightPx = Math.max(lastRightPx, targetSlot.left + nextLine.width)
        renderedBottom = Math.max(renderedBottom, y + preparedBlock.style.lineHeight)
        y += preparedBlock.style.lineHeight

        if (cursor.segmentIndex >= preparedBlock.prepared.segments.length) {
          break
        }
      }
    }

    blockHeights[preparedBlock.id] = Math.max(
      block.height,
      renderedBottom - startY + preparedBlock.style.lineHeight * 0.35,
    )

    const stackedEntry = stackedColumns.find(column => Math.abs(column.x - block.x) <= 64)
    if (stackedEntry !== undefined) {
      stackedEntry.bottomY = startY + blockHeights[preparedBlock.id]!
      stackedEntry.lastType = preparedBlock.type
    }
  }

  return {
    blockHeights,
    blockPositions,
    debug: {
      baselines,
      carvedLines,
      columns: columnsDebug,
      flowConnections,
      silhouetteRows: createSilhouetteDebugRows(rows, viewportWidth, viewportHeight),
    },
    lastLineBottom,
    lastRightPx,
    lines,
  }
}

export function buildLayoutHash(
  layout: StoryLayout,
  telemetry: CameraTelemetry,
  fontScale: number,
  blocks: NarrativeBlockBlueprint[],
): string {
  const telemetryHash = [
    Math.round(telemetry.distance * 100),
    Math.round(telemetry.polar * 100),
    Math.round(telemetry.azimuth * 100),
  ].join(':')

  const linesHash = layout.lines
    .map(line =>
      [
        line.key,
        Math.round(line.x),
        Math.round(line.y),
        Math.round(line.width),
        line.text,
      ].join(':'),
    )
    .join('|')

  const blocksHash = blocks
    .map(
      block =>
        [
          Math.round(block.x),
          Math.round(block.y),
          Math.round(block.width),
          Math.round(block.height),
          block.columnCount ?? 1,
          Math.round(block.columnGap ?? 0),
          Math.round(block.padding ?? 0),
        ].join(':'),
    )
    .join('-')

  return `${layout.lines.length}:${Math.round(layout.lastLineBottom)}:${telemetryHash}:${linesHash}:${fontScale}:${blocksHash}`
}
