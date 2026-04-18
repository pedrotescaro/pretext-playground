import type {
  DesignRect,
  NarrativeBlockBlueprint,
  OrbitTagBlueprint,
  ViewportState,
} from './miranha-types'

export const DESIGN_STAGE = {
  width: 1600,
  height: 920,
} as const

export function getInitialViewport(): ViewportState {
  if (typeof window === 'undefined') {
    return { width: 1440, height: 920 }
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

function getStageScale(viewport: ViewportState) {
  return {
    scaleX: viewport.width / DESIGN_STAGE.width,
    scaleY: viewport.height / DESIGN_STAGE.height,
    scale: Math.min(
      viewport.width / DESIGN_STAGE.width,
      viewport.height / DESIGN_STAGE.height,
    ),
  }
}

export function resolveBlocksForViewport(
  blocks: NarrativeBlockBlueprint[],
  viewport: ViewportState,
): NarrativeBlockBlueprint[] {
  const { scaleX, scaleY, scale } = getStageScale(viewport)

  return blocks.map(block => ({
    ...block,
    x: block.x * scaleX,
    y: block.y * scaleY,
    width: block.width * scaleX,
    height: block.height * scaleY,
    columnGap: block.columnGap !== undefined ? block.columnGap * scale : undefined,
    minLineWidth: block.minLineWidth !== undefined ? block.minLineWidth * scaleX : undefined,
    padding: block.padding !== undefined ? block.padding * scale : undefined,
  }))
}

export function resolveTagsForViewport(
  tags: OrbitTagBlueprint[],
  viewport: ViewportState,
): OrbitTagBlueprint[] {
  const { scaleX, scaleY } = getStageScale(viewport)

  return tags.map(tag => ({
    ...tag,
    x: tag.x * scaleX,
    y: tag.y * scaleY,
  }))
}

export function viewportRectToDesignRect(
  rect: DesignRect,
  viewport: ViewportState,
): DesignRect {
  const { scaleX, scaleY } = getStageScale(viewport)

  return {
    x: rect.x / Math.max(scaleX, 0.0001),
    y: rect.y / Math.max(scaleY, 0.0001),
    width: rect.width / Math.max(scaleX, 0.0001),
    height: rect.height / Math.max(scaleY, 0.0001),
  }
}
