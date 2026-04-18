import { useEffect, useState } from 'react'
import { cloneScenes } from '../../data/miranha-scenes'
import { MIRANHA_THEME } from '../../data/miranha-theme'
import {
  getInitialViewport,
  resolveBlocksForViewport,
  viewportRectToDesignRect,
} from '../../lib/miranha-design-space'
import type { DesignRect, StoryLayout } from '../../lib/miranha-types'
import { ContourTextOverlay } from './ContourTextOverlay'
import { EditorDock } from './EditorDock'
import { EditorialHeading } from './EditorialHeading'
import { PlushViewport } from './PlushViewport'

const EMPTY_LAYOUT: StoryLayout = {
  lines: [],
  blockHeights: {},
  blockPositions: {},
  lastLineBottom: 0,
  lastRightPx: 0,
  debug: {
    baselines: [],
    carvedLines: [],
    columns: [],
    flowConnections: [],
    silhouetteRows: [],
  },
}

export function MiranhaEditorialExperience() {
  const [viewport, setViewport] = useState(getInitialViewport)
  const [scenes, setScenes] = useState(cloneScenes)
  const [sceneIndex, setSceneIndex] = useState(0)
  const [layout, setLayout] = useState<StoryLayout>(EMPTY_LAYOUT)
  const [editMode, setEditMode] = useState(false)
  const [fontScale, setFontScale] = useState(1)
  const [sceneStatus, setSceneStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isInteracting, setIsInteracting] = useState(false)
  const [, setParallax] = useState({ x: 0, y: 0 })
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

  const [cameraState, setCameraState] = useState<any>(null)

  const activeScene = scenes[sceneIndex] ?? scenes[0]!
  const resolvedBlocks = resolveBlocksForViewport(activeScene.blocks, viewport)

  useEffect(() => {
    setSelectedBlockId(null)
  }, [sceneIndex, editMode])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        const currentCam = cameraState || activeScene.camera
        console.log(`Current model properties:
Scale: ${currentCam.modelScale || currentCam.scale}
OffsetX: ${currentCam.modelOffsetX || currentCam.offsetX}
OffsetY: ${currentCam.modelOffsetY || currentCam.offsetY}
Target: [${currentCam.target.join(', ')}]
Position: [${currentCam.position.join(', ')}]`);
        alert(`Scale: ${currentCam.modelScale || currentCam.scale}\nOffset X/Y: ${currentCam.modelOffsetX || currentCam.offsetX} / ${currentCam.modelOffsetY || currentCam.offsetY}\nPos: [${[...(currentCam.position)].map(n => n.toFixed(2)).join(', ')}]\nTarget: [${[...(currentCam.target)].map(n => n.toFixed(2)).join(', ')}]`);
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeScene.camera, cameraState])

  const updateSceneBlock = (blockId: string, nextRect: DesignRect) => {
    const designRect = viewportRectToDesignRect(nextRect, viewport)

    setScenes(previousScenes =>
      previousScenes.map((scene, index) => {
        if (index !== sceneIndex) return scene

        return {
          ...scene,
          blocks: scene.blocks.map(block =>
            block.id === blockId ? { ...block, ...designRect } : block,
          ),
        }
      }),
    )
  }

  const updateSceneStatus = (
    status: 'loading' | 'ready' | 'error',
    nextErrorMessage?: string,
  ) => {
    setSceneStatus(status)
    setErrorMessage(nextErrorMessage ?? null)
  }

  return (
    <main className="miranha-shell">
      <PlushViewport
        blocks={resolvedBlocks}
        editMode={editMode}
        fontScale={fontScale}
        onInteractionChange={setIsInteracting}
        onLayoutChange={setLayout}
        onParallaxChange={setParallax}
        onSceneStatusChange={updateSceneStatus}
        onViewportChange={setViewport}
        onCameraChange={setCameraState}
        scene={activeScene}
      />

      <EditorialHeading
        isInteracting={isInteracting}
        sceneCount={scenes.length}
        sceneIndex={sceneIndex}
      />
      <ContourTextOverlay
        blocks={resolvedBlocks}
        editMode={editMode}
        layout={layout}
        onBlockFrameChange={updateSceneBlock}
        onBlockSelect={setSelectedBlockId}
        selectedBlockId={selectedBlockId}
      />
      <EditorDock
        editMode={editMode}
        fontScale={fontScale}
        onFontScaleChange={direction =>
          setFontScale(current => Math.min(1.42, Math.max(0.78, current + direction * 0.06)))
        }
        onModelScaleChange={direction =>
          setScenes(previousScenes =>
            previousScenes.map((scene, index) => {
              if (index !== sceneIndex) return scene

              return {
                ...scene,
                camera: {
                  ...scene.camera,
                  modelScale: Math.min(
                    1.2,
                    Math.max(0.58, scene.camera.modelScale + direction * 0.06),
                  ),
                },
              }
            }),
          )
        }
        onNextScene={() => setSceneIndex(current => Math.min(scenes.length - 1, current + 1))}
        onPreviousScene={() => setSceneIndex(current => Math.max(0, current - 1))}
        onSceneSelect={setSceneIndex}
        onToggleEdit={() => setEditMode(current => !current)}
        scene={activeScene}
        sceneIndex={sceneIndex}
        scenes={scenes}
      />

      {sceneStatus === 'loading' ? (
        <section className="miranha-status-panel" aria-live="polite">
          <p className="miranha-status-panel__copy">Loading scene...</p>
        </section>
      ) : null}

      {sceneStatus === 'error' ? (
        <section className="miranha-status-panel miranha-status-panel--error" aria-live="assertive">
          <p className="miranha-status-panel__copy">{errorMessage ?? MIRANHA_THEME.errorCopy}</p>
        </section>
      ) : null}
    </main>
  )
}
