import type { CSSProperties } from 'react'

export type NarrativeBlockType = 'eyebrow' | 'body' | 'quote' | 'list'

export type DesignRect = {
  x: number
  y: number
  width: number
  height: number
}

export type NarrativeBlockBlueprint = DesignRect & {
  id: string
  type: NarrativeBlockType
  text: string
  columnCount?: number
  columnGap?: number
  padding?: number
  flowOrder?: number
  priority?: number
  minLineWidth?: number
}

export type OrbitTagTone = 'crimson' | 'azure' | 'ice'

export type OrbitTagBlueprint = {
  id: string
  label: string
  x: number
  y: number
  tone: OrbitTagTone
}

export type MetricItem = {
  label: string
  value: string
}

export type HeadingContent = {
  overline: string
  titleLead: string
  titleAccent: string
  deck: string
  sideNote: string
}

export type SceneCameraPreset = {
  target: [number, number, number]
  position: [number, number, number]
  modelRotation: number
  modelScale: number
  modelOffsetX: number
  modelOffsetY: number
}

export type MiranhaSceneBlueprint = {
  id: string
  label: string
  capsule: string
  chapter: string
  heading: HeadingContent
  callout: string
  footerNote: string
  metrics: MetricItem[]
  blocks: NarrativeBlockBlueprint[]
  tags: OrbitTagBlueprint[]
  camera: SceneCameraPreset
}

export type ViewportState = {
  width: number
  height: number
}

export type CameraTelemetry = {
  distance: number
  polar: number
  azimuth: number
}

export type PositionedNarrativeLine = {
  key: string
  text: string
  x: number
  y: number
  width: number
  slotWidth: number
  type: NarrativeBlockType
  regionId: string
  style: CSSProperties
}

export type DebugLayoutSlot = {
  left: number
  right: number
}

export type DebugLayoutColumn = {
  regionId: string
  x: number
  y: number
  width: number
  height: number
  columnIndex: number
}

export type DebugCarvedLine = {
  regionId: string
  y: number
  lineHeight: number
  columnIndex: number
  segments: DebugLayoutSlot[]
  chosen: DebugLayoutSlot | null
}

export type DebugSilhouetteRow = {
  y: number
  left: number
  right: number
}

export type DebugFlowConnection = {
  label: string
  fromX: number
  fromY: number
  toX: number
  toY: number
}

export type DebugLineBox = {
  regionId: string
  x: number
  y: number
  width: number
  lineHeight: number
}

export type StoryLayoutDebug = {
  baselines: DebugLineBox[]
  carvedLines: DebugCarvedLine[]
  columns: DebugLayoutColumn[]
  flowConnections: DebugFlowConnection[]
  silhouetteRows: DebugSilhouetteRow[]
}

export type StoryLayout = {
  lines: PositionedNarrativeLine[]
  blockHeights: Record<string, number>
  blockPositions: Record<string, { x: number, y: number }>
  lastLineBottom: number
  lastRightPx: number
  debug: StoryLayoutDebug
}

export type LayoutDebugFlags = {
  showColumns: boolean
  showFlowOrder: boolean
  showFreeSegments: boolean
  showLineBoxes: boolean
  showRegionBounds: boolean
  showSilhouette: boolean
}
