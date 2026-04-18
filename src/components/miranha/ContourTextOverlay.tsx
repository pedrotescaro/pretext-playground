import type { PointerEvent as ReactPointerEvent } from 'react'
import { useRef } from 'react'
import type {
  DesignRect,
  LayoutDebugFlags,
  NarrativeBlockBlueprint,
  StoryLayout,
} from '../../lib/miranha-types'

type ContourTextOverlayProps = {
  blocks: NarrativeBlockBlueprint[]
  debugFlags?: LayoutDebugFlags
  editMode: boolean
  layout: StoryLayout
  onBlockFrameChange: (blockId: string, nextRect: DesignRect) => void
  onBlockSelect?: (blockId: string) => void
  selectedBlockId?: string | null
}

type ActiveInteraction = {
  blockId: string
  mode: 'drag' | 'resize'
  pointerId: number
  startX: number
  startY: number
  originLeft: number
  originTop: number
  originWidth: number
  originHeight: number
}

function getGuideRect(block: NarrativeBlockBlueprint, layout: StoryLayout): DesignRect {
  const resolvedPosition = layout.blockPositions[block.id]

  return {
    height: layout.blockHeights[block.id] ?? block.height,
    width: block.width,
    x: block.x,
    y: resolvedPosition?.y ?? block.y,
  }
}

function describeRegion(block: NarrativeBlockBlueprint) {
  return `${block.type}${block.columnCount && block.columnCount > 1 ? ` / ${block.columnCount} cols` : ''}`
}

export function ContourTextOverlay({
  blocks,
  debugFlags = {
    showColumns: false,
    showFlowOrder: false,
    showFreeSegments: false,
    showLineBoxes: false,
    showRegionBounds: false,
    showSilhouette: false,
  },
  editMode,
  layout,
  onBlockFrameChange,
  onBlockSelect,
  selectedBlockId,
}: ContourTextOverlayProps) {
  const activeInteractionRef = useRef<ActiveInteraction | null>(null)

  const clearInteraction = () => {
    activeInteractionRef.current = null
  }

  const beginInteraction = (
    event: ReactPointerEvent<HTMLDivElement>,
    block: NarrativeBlockBlueprint,
    mode: ActiveInteraction['mode'],
  ) => {
    const guideRect = getGuideRect(block, layout)

    activeInteractionRef.current = {
      blockId: block.id,
      mode,
      originHeight: layout.blockHeights[block.id] ?? block.height,
      originLeft: block.x,
      originTop: guideRect.y,
      originWidth: block.width,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    }
  }

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
    block: NarrativeBlockBlueprint,
  ) => {
    const current = activeInteractionRef.current
    if (
      current === null ||
      current.blockId !== block.id ||
      current.pointerId !== event.pointerId ||
      !event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      return
    }

    if (current.mode === 'drag') {
      onBlockFrameChange(block.id, {
        height: current.originHeight,
        width: current.originWidth,
        x: current.originLeft + (event.clientX - current.startX),
        y: current.originTop + (event.clientY - current.startY),
      })
      return
    }

    onBlockFrameChange(block.id, {
      height: Math.max(84, current.originHeight + (event.clientY - current.startY)),
      width: Math.max(180, current.originWidth + (event.clientX - current.startX)),
      x: current.originLeft,
      y: current.originTop,
    })
  }

  const endInteraction = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    clearInteraction()
  }

  const showGuides = editMode || debugFlags.showRegionBounds

  return (
    <div
      className="miranha-overlay"
    >
      {layout.lines.map(line => (
        <div
          key={line.key}
          className={`miranha-line miranha-line--${line.type}`}
          style={{
            ...line.style,
            maxWidth: `${Math.round(line.slotWidth)}px`,
            transform: `translate3d(${line.x}px, ${line.y}px, 0)`,
          }}
        >
          {line.text}
        </div>
      ))}

      {debugFlags.showSilhouette ? (
        <div className="miranha-overlay__debug-layer" aria-hidden="true">
          {layout.debug.silhouetteRows.map((row, index) => (
            <div
              key={`silhouette-${row.y}-${index}`}
              className="miranha-debug__silhouette-row"
              style={{
                left: `${row.left}px`,
                top: `${row.y}px`,
                width: `${Math.max(1, row.right - row.left)}px`,
              }}
            />
          ))}
        </div>
      ) : null}

      {debugFlags.showColumns ? (
        <div className="miranha-overlay__debug-layer" aria-hidden="true">
          {layout.debug.columns.map(column => (
            <div
              key={`${column.regionId}-${column.columnIndex}`}
              className="miranha-debug__column"
              style={{
                height: `${column.height}px`,
                left: `${column.x}px`,
                top: `${column.y}px`,
                width: `${column.width}px`,
              }}
            />
          ))}
        </div>
      ) : null}

      {debugFlags.showFreeSegments ? (
        <div className="miranha-overlay__debug-layer" aria-hidden="true">
          {layout.debug.carvedLines.flatMap((line, lineIndex) =>
            line.segments.map((segment, segmentIndex) => {
              const isChosen =
                line.chosen !== null &&
                Math.abs(line.chosen.left - segment.left) < 0.5 &&
                Math.abs(line.chosen.right - segment.right) < 0.5

              return (
                <div
                  key={`${line.regionId}-${lineIndex}-${segmentIndex}`}
                  className={`miranha-debug__segment ${isChosen ? 'miranha-debug__segment--chosen' : ''}`}
                  style={{
                    height: `${line.lineHeight - 1}px`,
                    left: `${segment.left}px`,
                    top: `${line.y}px`,
                    width: `${Math.max(1, segment.right - segment.left)}px`,
                  }}
                />
              )
            }),
          )}
        </div>
      ) : null}

      {debugFlags.showLineBoxes ? (
        <div className="miranha-overlay__debug-layer" aria-hidden="true">
          {layout.debug.baselines.map((line, index) => (
            <div key={`${line.regionId}-${index}`} className="miranha-debug__linebox-wrap">
              <div
                className="miranha-debug__linebox"
                style={{
                  height: `${line.lineHeight}px`,
                  left: `${line.x}px`,
                  top: `${line.y}px`,
                  width: `${line.width}px`,
                }}
              />
              <div
                className="miranha-debug__baseline"
                style={{
                  left: `${line.x}px`,
                  top: `${line.y + line.lineHeight * 0.82}px`,
                  width: `${line.width}px`,
                }}
              />
            </div>
          ))}
        </div>
      ) : null}

      {debugFlags.showFlowOrder ? (
        <svg className="miranha-debug__flow" aria-hidden="true">
          {layout.debug.flowConnections.map(connection => (
            <g key={`${connection.fromX}-${connection.fromY}-${connection.toX}-${connection.toY}`}>
              <line
                className="miranha-debug__flow-line"
                x1={connection.fromX}
                x2={connection.toX}
                y1={connection.fromY}
                y2={connection.toY}
              />
              <circle
                className="miranha-debug__flow-node"
                cx={connection.toX}
                cy={connection.toY}
                r="8"
              />
              <text
                className="miranha-debug__flow-label"
                x={connection.toX}
                y={connection.toY + 3}
              >
                {connection.label}
              </text>
            </g>
          ))}
        </svg>
      ) : null}

      {showGuides ? (
        <div className="miranha-overlay__guides">
          {blocks.map(block => {
            const guideRect = getGuideRect(block, layout)
            const isSelected = selectedBlockId === block.id

            return (
              <div
                key={block.id}
                className={`miranha-guide ${isSelected ? 'miranha-guide--selected' : ''}`}
                style={{
                  height: `${guideRect.height}px`,
                  left: `${guideRect.x}px`,
                  top: `${guideRect.y}px`,
                  width: `${guideRect.width}px`,
                }}
                onPointerDown={event => {
                  onBlockSelect?.(block.id)
                  if (!editMode) return
                  beginInteraction(event, block, 'drag')
                  event.currentTarget.setPointerCapture(event.pointerId)
                  event.stopPropagation()
                }}
                onPointerMove={event => handlePointerMove(event, block)}
                onPointerUp={endInteraction}
                onPointerCancel={endInteraction}
              >
                <div className="miranha-guide__label">{describeRegion(block)}</div>
                {editMode ? (
                  <>
                    <span className="miranha-guide__handle miranha-guide__handle--tl" />
                    <span className="miranha-guide__handle miranha-guide__handle--tr" />
                    <span className="miranha-guide__handle miranha-guide__handle--bl" />
                    <span className="miranha-guide__handle miranha-guide__handle--br" />
                    <div
                      className="miranha-guide__resize"
                      onPointerDown={event => {
                        onBlockSelect?.(block.id)
                        beginInteraction(event, block, 'resize')
                        const guide = event.currentTarget.parentElement
                        guide?.setPointerCapture(event.pointerId)
                        event.stopPropagation()
                      }}
                    />
                  </>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
