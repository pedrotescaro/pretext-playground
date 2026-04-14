import { startTransition, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import {
  STORY_SCENES,
  cloneBlocks,
  type StoryBlock,
} from '../lib/spiderman-content'
import {
  layoutStoryAroundSilhouette,
  sampleSilhouetteIntervals,
  type StoryLayout,
} from '../lib/spiderman-layout'

export type SceneData = {
  id: string
  label: string
  target: THREE.Vector3
  pos: THREE.Vector3
  modelRotation: number
  modelScale: number
  modelOffsetX: number
  modelOffsetY: number
  blocks: StoryBlock[]
}

const initialScenes: SceneData[] = [
  {
    id: STORY_SCENES[0]!.id,
    label: STORY_SCENES[0]!.label,
    target: new THREE.Vector3(1.05, 0.52, 0),
    pos: new THREE.Vector3(1.4, 0.92, 8.45),
    modelRotation: 0,
    modelScale: 0.92,
    modelOffsetX: -0.34,
    modelOffsetY: -0.12,
    blocks: cloneBlocks(STORY_SCENES[0]!.blocks),
  },
  {
    id: STORY_SCENES[1]!.id,
    label: STORY_SCENES[1]!.label,
    target: new THREE.Vector3(2.15, 0.42, 0),
    pos: new THREE.Vector3(1.45, 0.76, 9.8),
    modelRotation: 0,
    modelScale: 0.86,
    modelOffsetX: -0.58,
    modelOffsetY: -0.18,
    blocks: cloneBlocks(STORY_SCENES[1]!.blocks),
  },
  {
    id: STORY_SCENES[2]!.id,
    label: STORY_SCENES[2]!.label,
    target: new THREE.Vector3(1.45, 0.38, 0),
    pos: new THREE.Vector3(2.9, 0.88, 7.25),
    modelRotation: -Math.PI / 2.4,
    modelScale: 0.74,
    modelOffsetX: -0.26,
    modelOffsetY: -0.1,
    blocks: cloneBlocks(STORY_SCENES[2]!.blocks),
  },
  {
    id: STORY_SCENES[3]!.id,
    label: STORY_SCENES[3]!.label,
    target: new THREE.Vector3(1.1, 0.72, 0),
    pos: new THREE.Vector3(1.9, 1.52, 6.9),
    modelRotation: Math.PI * 0.08,
    modelScale: 0.68,
    modelOffsetX: -0.06,
    modelOffsetY: -0.04,
    blocks: cloneBlocks(STORY_SCENES[3]!.blocks),
  },
]

const BACKGROUND_HEX = 0x060608
const MODEL_DIRECTORY = '/spiderman/'
const MODEL_BASENAME = 'Meshy_AI_Spider_Man_Plush_0414171926_texture'
const EMPTY_LAYOUT: StoryLayout = {
  lines: [],
  blockHeights: {},
  blockPositions: {},
  lastLineBottom: 0,
  lastRightPx: 0,
}

type ViewportState = {
  width: number
  height: number
}

type CameraTelemetry = {
  distance: number
  polar: number
  azimuth: number
}

function getInitialViewport(): ViewportState {
  if (typeof window === 'undefined') {
    return { width: 1440, height: 900 }
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

function buildLayoutHash(
  layout: StoryLayout,
  telemetry: CameraTelemetry,
  fontSizeMult: number,
  blocks: StoryBlock[],
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
    
  const blocksHash = blocks.map(b => `${b.x}:${b.y}:${b.width}:${b.height}`).join('-')

  return `${layout.lines.length}:${Math.round(layout.lastLineBottom)}:${telemetryHash}:${linesHash}:${fontSizeMult}:${blocksHash}`
}

function disposeMaterial(material: THREE.Material): void {
  const disposableMaterial = material as THREE.Material & Record<string, unknown>

  for (const value of Object.values(disposableMaterial)) {
    if (value instanceof THREE.Texture) value.dispose()
  }

  material.dispose()
}

function disposeObject(root: THREE.Object3D): void {
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return

    object.geometry.dispose()

    if (Array.isArray(object.material)) {
      object.material.forEach(disposeMaterial)
      return
    }

    disposeMaterial(object.material)
  })
}

function polishObject(root: THREE.Object3D): void {
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return

    object.castShadow = false
    object.receiveShadow = false

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material]

    for (let index = 0; index < materials.length; index += 1) {
      const material = materials[index]
      if (material === undefined) continue

      const phongMaterial = material as THREE.MeshPhongMaterial
      if (phongMaterial.map !== null && phongMaterial.map !== undefined) {
        phongMaterial.map.colorSpace = THREE.SRGBColorSpace
        phongMaterial.map.anisotropy = 8
      }
      phongMaterial.shininess = 18
      phongMaterial.reflectivity = 0.18
      phongMaterial.specular = new THREE.Color(0x191919)
    }
  })
}

function applySceneToModel(model: THREE.Object3D, scene: SceneData, baseScale: number, basePosition: THREE.Vector3): void {
  model.scale.setScalar(baseScale * scene.modelScale)
  model.rotation.set(0.08, scene.modelRotation, 0)
  model.position.set(
    basePosition.x + scene.modelOffsetX,
    basePosition.y + scene.modelOffsetY,
    basePosition.z,
  )
  model.updateMatrixWorld(true)
}

export function SpidermanPretextExperience() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const modelRef = useRef<THREE.Object3D | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const workCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const viewportRef = useRef(getInitialViewport())
  const layoutHashRef = useRef('')
  const baseModelScaleRef = useRef(1)
  const baseModelPositionRef = useRef(new THREE.Vector3(0, -0.14, 0))
  const activeSceneRef = useRef<SceneData>(initialScenes[0]!)

  const [viewport, setViewport] = useState(getInitialViewport)
  const [layout, setLayout] = useState<StoryLayout>(EMPTY_LAYOUT)
  const [sceneState, setSceneState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [isDragging, setIsDragging] = useState(false)
  const [introOpen, setIntroOpen] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sceneIndex, setSceneStateIndex] = useState(0)
  const [isEditing, setIsEditing] = useState(false)

  const [scenes, setScenes] = useState<SceneData[]>(initialScenes)
  const activeScene = scenes[sceneIndex] ?? scenes[0]!
  const blocks = activeScene.blocks
  const [fontSizeMult, setFontSizeMult] = useState(1)

  const addScene = () => {
    const nextIndex = scenes.length
    setScenes(prev => {
      const current = prev[sceneIndex]!
      const newScene = {
        ...current,
        id: `${current.id}-copy-${prev.length + 1}`,
        label: `${current.label} Copy`,
        target: current.target.clone(),
        pos: current.pos.clone(),
        blocks: cloneBlocks(current.blocks),
      }
      return [...prev, newScene]
    })
    setSceneStateIndex(nextIndex)
  }

  const addBlock = () => {
    setScenes(prev => {
      const nextScenes = [...prev]
      const current = nextScenes[sceneIndex]!
      current.blocks = [
        ...current.blocks,
        {
          id: `custom-${current.blocks.length + 1}-${Date.now()}`,
          type: 'body',
          text: 'New region ready for editing.',
          x: 1080,
          y: 120 + current.blocks.length * 24,
          width: 420,
          height: 140,
        },
      ]
      nextScenes[sceneIndex] = { ...current }
      return nextScenes
    })
  }

  const removeScene = () => {
    if (scenes.length <= 1) return
    setScenes(prev => prev.filter((_, i) => i !== sceneIndex))
    setSceneStateIndex(prev => (prev >= scenes.length - 1 ? Math.max(0, scenes.length - 2) : prev))
  }
  
  const blocksRef = useRef(blocks)
  const fontSizeMultRef = useRef(1)

  useEffect(() => {
    blocksRef.current = (scenes[sceneIndex] ?? scenes[0]!).blocks
    fontSizeMultRef.current = fontSizeMult
  }, [fontSizeMult, sceneIndex, scenes])

  useEffect(() => {
    activeSceneRef.current = activeScene
  }, [activeScene])

  // Drag & drop / resize state
  const draggingBlockId = useRef<string | null>(null)
  const resizingBlockId = useRef<string | null>(null)
  const startDragPos = useRef({ x: 0, y: 0, startLeft: 0, startTop: 0, startWidth: 0, startHeight: 0 })
  const isDraggingModel = useRef(false)

  // Camera views instead of model positions
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0.05, 0))
  const cameraPosRef = useRef(new THREE.Vector3(0.18, 0.45, 6.2))
  const sceneIndexRef = useRef(0)
  const isSceneTransitioning = useRef(true)

  useEffect(() => {
    sceneIndexRef.current = sceneIndex
    const state = scenes[sceneIndex] || scenes[0]!
    cameraTargetRef.current.copy(state.target)
    cameraPosRef.current.copy(state.pos)

    isSceneTransitioning.current = true

    // 🔥 ROTACIONA O MODELO CONFORME A CENA
    if (modelRef.current) {
      applySceneToModel(
        modelRef.current,
        state,
        baseModelScaleRef.current,
        baseModelPositionRef.current,
      )
    }
  }, [sceneIndex, scenes])

  useEffect(() => {
    viewportRef.current = viewport
  }, [viewport])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current

    if (container === null || canvas === null) return

    let disposed = false
    let animationFrame = 0
    let lastLayoutAt = 0

    const workCanvas = document.createElement('canvas')
    workCanvasRef.current = workCanvas

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    })
    renderer.setClearColor(BACKGROUND_HEX, 1)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(BACKGROUND_HEX)

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40)
    camera.position.set(0.18, 0.45, viewportRef.current.width < 920 ? 7.4 : 6.2)
    cameraRef.current = camera

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.7)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.7)
    const rimLight = new THREE.DirectionalLight(0x6faeff, 1.3)
    const fillLight = new THREE.PointLight(0xff9f60, 19, 12, 2)

    keyLight.position.set(3.4, 4.2, 5.4)
    rimLight.position.set(-4.8, 2.1, -3.6)
    fillLight.position.set(1.6, -0.5, 4.8)

    scene.add(ambientLight, keyLight, rimLight, fillLight)

    const controls = new OrbitControls(camera, renderer.domElement)
    controlsRef.current = controls
    controls.enableDamping = true
    controls.enabled = false
    controls.dampingFactor = 0.065
    controls.screenSpacePanning = true
    controls.rotateSpeed = 0.78
    controls.panSpeed = 0.84
    controls.zoomSpeed = 0.92
    controls.minDistance = 2.2
    controls.maxDistance = 18
    controls.minPolarAngle = 0.45
    controls.maxPolarAngle = 2.2
    controls.target.set(0, 0.05, 0)
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    }
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    }
    controls.update()

    const syncViewport = () => {
      const nextViewport = {
        width: container.clientWidth || window.innerWidth,
        height: container.clientHeight || window.innerHeight,
      }

      viewportRef.current = nextViewport
      setViewport(previous =>
        previous.width === nextViewport.width && previous.height === nextViewport.height
          ? previous
          : nextViewport,
      )

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8))
      renderer.setSize(nextViewport.width, nextViewport.height, false)
      camera.aspect = nextViewport.width / Math.max(nextViewport.height, 1)
      camera.updateProjectionMatrix()
    }

    const handlePointerDown = () => {
      setIntroOpen(false)
      isSceneTransitioning.current = false
    }

    const handleWheel = () => {
      setIntroOpen(false)
      isSceneTransitioning.current = false
    }

    const handleContextMenu = (event: Event) => {
      event.preventDefault()
    }

    const handleControlStart = () => {
      setIsDragging(true)
      isDraggingModel.current = true
      setIntroOpen(false)
      isSceneTransitioning.current = false
    }

    const handleControlEnd = () => {
      setIsDragging(false)
      isDraggingModel.current = false
    }

    renderer.domElement.addEventListener('pointerdown', handlePointerDown)
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: true })
    renderer.domElement.addEventListener('contextmenu', handleContextMenu)
    controls.addEventListener('start', handleControlStart)
    controls.addEventListener('end', handleControlEnd)
    window.addEventListener('resize', syncViewport)

    syncViewport()

    const materialLoader = new MTLLoader()
    materialLoader.setPath(MODEL_DIRECTORY)
    materialLoader.setResourcePath(MODEL_DIRECTORY)
    materialLoader.load(
      `${MODEL_BASENAME}.mtl`,
      materials => {
        if (disposed) return

        materials.preload()

        const objectLoader = new OBJLoader()
        objectLoader.setMaterials(materials)
        objectLoader.setPath(MODEL_DIRECTORY)
        objectLoader.load(
          `${MODEL_BASENAME}.obj`,
          object => {
            if (disposed) {
              disposeObject(object)
              return
            }

            polishObject(object)

            const unscaledBox = new THREE.Box3().setFromObject(object)
            const unscaledSize = unscaledBox.getSize(new THREE.Vector3())
            const targetHeight = viewportRef.current.width < 920 ? 2.9 : 3.65
            const scale = targetHeight / Math.max(unscaledSize.y, 0.001)

            baseModelScaleRef.current = scale
            object.scale.setScalar(scale)
            
            // 🔥 ROTAÇÃO INICIAL (frente)
            object.rotation.set(0.08, 0, 0)
            
            object.updateMatrixWorld(true)

            const centeredBox = new THREE.Box3().setFromObject(object)
            const centeredOffset = centeredBox.getCenter(new THREE.Vector3())
            object.position.sub(centeredOffset)
            object.position.y = -0.14
            baseModelPositionRef.current.copy(object.position)
            applySceneToModel(
              object,
              activeSceneRef.current,
              baseModelScaleRef.current,
              baseModelPositionRef.current,
            )
            object.updateMatrixWorld(true)

            modelRef.current = object
            scene.add(object)
            setSceneState('ready')
          },
          undefined,
          error => {
            if (disposed) return
            setSceneState('error')
            setErrorMessage(error instanceof Error ? error.message : 'Failed to load OBJ asset.')
          },
        )
      },
      undefined,
      error => {
        if (disposed) return
        setSceneState('error')
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load material file.')
      },
    )

    const renderLoop = (timestamp: number) => {
      if (disposed) return

      animationFrame = window.requestAnimationFrame(renderLoop)

      const model = modelRef.current

      // Animate camera only when transitioning and not actively dragged
      if (isSceneTransitioning.current && !isDraggingModel.current) {
        camera.position.lerp(cameraPosRef.current, 0.05)
        controls.target.lerp(cameraTargetRef.current, 0.05)

        if (
          camera.position.distanceToSquared(cameraPosRef.current) < 0.001 &&
          controls.target.distanceToSquared(cameraTargetRef.current) < 0.001
        ) {
          isSceneTransitioning.current = false
        }
      } else if (isDraggingModel.current) {
        // Sync refs if user dragged to avoid snapping back if transition restarts
        cameraPosRef.current.copy(camera.position)
        cameraTargetRef.current.copy(controls.target)
      }

      controls.update()
      renderer.render(scene, camera)

      if (model === null) return

      const currentViewport = viewportRef.current
      if (currentViewport.width <= 0 || currentViewport.height <= 0) return

      if (timestamp - lastLayoutAt < 32) return
      lastLayoutAt = timestamp

      const sampleWidth = Math.min(520, Math.max(280, Math.round(currentViewport.width * 0.34)))
      const sampleHeight = Math.min(340, Math.max(190, Math.round(currentViewport.height * 0.3)))
      const rows = sampleSilhouetteIntervals(
        renderer.domElement,
        workCanvas,
        sampleWidth,
        sampleHeight,
      )
      const nextLayout = layoutStoryAroundSilhouette({
        blocks: blocksRef.current,
        viewportWidth: currentViewport.width,
        viewportHeight: currentViewport.height,
        rows,
        fontSizeMult: fontSizeMultRef.current,
      })
      const nextTelemetry = {
        distance: camera.position.distanceTo(controls.target),
        polar: controls.getPolarAngle(),
        azimuth: controls.getAzimuthalAngle(),
      }

      const nextHash = buildLayoutHash(nextLayout, nextTelemetry, fontSizeMultRef.current, blocksRef.current)
      if (nextHash === layoutHashRef.current) return

      layoutHashRef.current = nextHash
      startTransition(() => {
        setLayout(nextLayout)
      })
    }

    animationFrame = window.requestAnimationFrame(renderLoop)

    return () => {
      disposed = true
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', syncViewport)
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
      renderer.domElement.removeEventListener('wheel', handleWheel)
      renderer.domElement.removeEventListener('contextmenu', handleContextMenu)
      controls.removeEventListener('start', handleControlStart)
      controls.removeEventListener('end', handleControlEnd)
      controls.dispose()
      if (modelRef.current !== null) {
        disposeObject(modelRef.current)
        modelRef.current = null
      }
      workCanvasRef.current = null
      scene.clear()
      renderer.dispose()
      rendererRef.current = null
    }
  }, [])

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = !isEditing
    }
  }, [isEditing])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'p') {
        const camera = cameraRef.current
        const controls = controlsRef.current
        const model = modelRef.current

        if (camera && controls && model) {
          console.log(`=== POSIÇÃO DA CENA (COPIAR) ===
target: new THREE.Vector3(${controls.target.x.toFixed(4)}, ${controls.target.y.toFixed(4)}, ${controls.target.z.toFixed(4)}),
pos: new THREE.Vector3(${camera.position.x.toFixed(4)}, ${camera.position.y.toFixed(4)}, ${camera.position.z.toFixed(4)}),
modelRotation: ${model.rotation.y.toFixed(4)},
================================`)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const compact = viewport.width < 920

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-screen overflow-hidden bg-[#060608] text-white"
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full touch-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,92,42,0.1),transparent_18%),radial-gradient(circle_at_50%_58%,rgba(255,255,255,0.06),transparent_14%),linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.22)_45%,rgba(0,0,0,0.6))]" />
        
        {/* Make gradients subtle or hidden in edit mode */}
        <div className={`absolute inset-x-0 top-0 h-44 bg-[linear-gradient(180deg,rgba(0,0,0,0.78),rgba(0,0,0,0))] transition-opacity duration-300 ${isEditing ? 'opacity-20' : 'opacity-100'}`} />
        <div className={`absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(0deg,rgba(0,0,0,0.84),rgba(0,0,0,0))] transition-opacity duration-300 ${isEditing ? 'opacity-20' : 'opacity-100'}`} />

        <div className={`absolute left-5 top-5 sm:left-8 sm:top-7 transition-opacity duration-300 pointer-events-none z-10 ${isEditing ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex flex-col gap-2">
            <div className="text-[12px] font-medium uppercase tracking-[0.25em] text-white/80">
              Spider-Man OBJ
            </div>
            <div className="text-[11px] uppercase tracking-[0.15em] text-white/40">
              Live Contour Text Layout · Local 3D Asset
            </div>
          </div>
        </div>

        <div className="absolute right-5 top-5 sm:right-8 sm:top-7 transition-opacity duration-300">
          <div className="rounded-full border border-red-400/20 bg-black/34 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-white/62 backdrop-blur-xl">
            {compact
              ? `Scene ${sceneIndex + 1} / ${scenes.length}`
              : `Scene ${sceneIndex + 1} / ${scenes.length} - Rotate / Pan / Zoom`}
          </div>
        </div>

        {isEditing && blocks.map(block => (
          <div 
            key={block.id}
            className="absolute border border-red-300/50 border-dashed bg-[rgba(127,29,29,0.08)] cursor-move z-10 transition-colors hover:border-red-200/80 pointer-events-auto touch-none"
            style={{
              left: block.x,
              top: layout.blockPositions[block.id]?.y || block.y,
              width: block.width,
              height: layout.blockHeights[block.id] || block.height,
            }}
            onPointerDown={(e) => {
              if (controlsRef.current) controlsRef.current.enabled = false
              draggingBlockId.current = block.id
              startDragPos.current = { x: e.clientX, y: e.clientY, startLeft: block.x, startTop: block.y, startWidth: block.width, startHeight: block.height }
              e.currentTarget.setPointerCapture(e.pointerId)
              e.stopPropagation()
            }}
            onPointerMove={(e) => {
              if (draggingBlockId.current === block.id && e.currentTarget.hasPointerCapture(e.pointerId)) {
                const newX = startDragPos.current.startLeft + (e.clientX - startDragPos.current.x)
                const newY = startDragPos.current.startTop + (e.clientY - startDragPos.current.y)
                setScenes(prev => {
                  const newScenes = [...prev]
                  newScenes[sceneIndex] = {
                    ...newScenes[sceneIndex]!,
                    blocks: newScenes[sceneIndex]!.blocks.map(b => b.id === block.id ? { ...b, x: newX, y: newY } : b)
                  }
                  return newScenes
                })
              } else if (resizingBlockId.current === block.id && e.currentTarget.hasPointerCapture(e.pointerId)) {
                const newWidth = Math.max(120, startDragPos.current.startWidth + (e.clientX - startDragPos.current.x))
                const newHeight = Math.max(20, startDragPos.current.startHeight + (e.clientY - startDragPos.current.y))
                setScenes(prev => {
                  const newScenes = [...prev]
                  newScenes[sceneIndex] = {
                    ...newScenes[sceneIndex]!,
                    blocks: newScenes[sceneIndex]!.blocks.map(b => b.id === block.id ? { ...b, width: newWidth, height: newHeight } : b)
                  }
                  return newScenes
                })
              }
            }}
            onPointerUp={(e) => {
              if (controlsRef.current) controlsRef.current.enabled = !isEditing
              draggingBlockId.current = null
              resizingBlockId.current = null
              e.currentTarget.releasePointerCapture(e.pointerId)
            }}
            onPointerCancel={(e) => {
              if (controlsRef.current) controlsRef.current.enabled = !isEditing
              draggingBlockId.current = null
              resizingBlockId.current = null
              e.currentTarget.releasePointerCapture(e.pointerId)
            }}
          >
            <div className="absolute top-1 left-2 text-[10px] text-red-100/70 font-mono pointer-events-none">{block.type}</div>
            {/* Resizer Handle */}
            <div 
              className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize flex items-end justify-end p-1 opacity-50 hover:opacity-100"
              onPointerDown={(e) => {
                if (controlsRef.current) controlsRef.current.enabled = false
                resizingBlockId.current = block.id
                draggingBlockId.current = null
                startDragPos.current = { x: e.clientX, y: e.clientY, startLeft: block.x, startTop: block.y, startWidth: block.width, startHeight: block.height }
                const parent = e.currentTarget.parentElement
                if (parent) parent.setPointerCapture(e.pointerId)
                e.stopPropagation()
              }}
            >
              <div className="w-2 h-2 bg-red-300 rounded-tl-[2px]"/>
            </div>
          </div>
        ))}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {layout.lines.map(line => (
            <div
              key={line.key}
              className={`absolute whitespace-nowrap transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isEditing ? 'outline outline-1 outline-dashed outline-white/20' : ''}`}
              style={{
                ...line.style,
                transform: `translate3d(${line.x}px, ${line.y}px, 0)`,
                maxWidth: `${Math.round(line.slotWidth)}px`,
                willChange: 'transform',
              }}
            >
              {line.text}
            </div>
          ))}
        </div>

        <div className={`absolute left-5 xs:left-8 pointer-events-auto transition-all duration-300 ${isEditing ? 'bottom-16 opacity-100' : 'bottom-5 xs:bottom-7 opacity-100'}`}>
          <button 
            className={`rounded px-6 py-2 border font-semibold tracking-[0.18em] transition-colors uppercase text-sm ${isEditing ? 'border-red-400/30 bg-red-950/55 text-red-100 hover:bg-red-900/65' : 'border-red-500/80 bg-red-600/10 text-red-300 hover:bg-red-600/20'}`}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'View' : 'Edit'}
          </button>
        </div>

        {isEditing && (
          <div className="absolute bottom-0 inset-x-0 h-12 bg-black/96 flex items-center justify-between px-4 sm:px-6 pointer-events-auto border-t border-red-400/20 overflow-x-auto whitespace-nowrap">
            <div className="flex items-center gap-2 text-xs font-mono text-white/70">
              {scenes.map((scene, idx) => (
                <button
                  key={scene.id}
                  onClick={() => {
                    setIsEditing(false)
                    setSceneStateIndex(idx)
                  }}
                  className={`px-3 py-1.5 rounded border transition-colors ${
                    sceneIndex === idx 
                      ? 'border-red-300/60 bg-red-500/16 text-red-100' 
                      : 'border-red-400/20 hover:border-red-300/40 hover:bg-red-500/8'
                  }`}
                >
                  {idx + 1}. {scene.label}
                </button>
              ))}
              
              <div className="w-[1px] h-6 bg-red-400/20 mx-2" />
              
              <button onClick={addScene} className="px-3 py-1.5 rounded border border-red-400/20 hover:bg-red-500/10">+Scene</button>
              <button onClick={removeScene} className="px-3 py-1.5 rounded border border-red-400/20 hover:bg-red-500/10">-Scene</button>
              <button onClick={addBlock} className="px-3 py-1.5 rounded border border-red-400/20 hover:bg-red-500/10">+Box</button>
              
              <div className="w-[1px] h-6 bg-red-400/20 mx-2" />
              
              <div className="flex items-center">
                <button onClick={() => setFontSizeMult(Math.max(0.65, fontSizeMult - 0.1))} className="px-3 py-1.5 rounded-l border border-red-400/20 hover:bg-red-500/10">-</button>
                <span className="px-3 py-1.5 border-y border-red-400/20 bg-black">{(14.5 * fontSizeMult).toFixed(1)}px</span>
                <button onClick={() => setFontSizeMult(Math.min(2.4, fontSizeMult + 0.1))} className="px-3 py-1.5 rounded-r border border-red-400/20 hover:bg-red-500/10">+</button>
              </div>

              <div className="flex items-center">
                <button
                  onClick={() =>
                    setScenes(prev => {
                      const nextScenes = [...prev]
                      const current = nextScenes[sceneIndex]!
                      nextScenes[sceneIndex] = {
                        ...current,
                        modelScale: Math.max(0.35, current.modelScale - 0.08),
                      }
                      return nextScenes
                    })
                  }
                  className="px-3 py-1.5 rounded-l border border-red-400/20 hover:bg-red-500/10"
                >
                  Plush-
                </button>
                <span className="px-3 py-1.5 border-y border-red-400/20 bg-black">
                  {(activeScene.modelScale * 100).toFixed(0)}%
                </span>
                <button
                  onClick={() =>
                    setScenes(prev => {
                      const nextScenes = [...prev]
                      const current = nextScenes[sceneIndex]!
                      nextScenes[sceneIndex] = {
                        ...current,
                        modelScale: Math.min(1.4, current.modelScale + 0.08),
                      }
                      return nextScenes
                    })
                  }
                  className="px-3 py-1.5 rounded-r border border-red-400/20 hover:bg-red-500/10"
                >
                  Plush+
                </button>
              </div>

              <div className="flex items-center ml-2">
                <span className="px-2 text-white/50">Total Blocks: {blocks.length}</span>
              </div>
            </div>
            
            <button className="px-5 py-1.5 rounded border border-red-400/20 text-xs font-mono text-white/70 hover:bg-red-500/10 transition-colors">
              Export
            </button>
          </div>
        )}

        <div className={`absolute right-5 xs:right-8 flex gap-2 pointer-events-auto transition-all duration-300 ${isEditing ? 'bottom-16 opacity-0 pointer-events-none' : 'bottom-5 xs:bottom-7 opacity-100'}`}>
          <div className="hidden rounded border border-red-400/20 bg-black/32 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.28em] text-red-300/78 backdrop-blur-xl lg:flex lg:items-center">
            {activeScene.label}
          </div>
          {sceneIndex > 0 && !isEditing && (
            <button 
              className="rounded px-5 py-2 border border-red-500/80 bg-red-600/10 text-red-500 font-semibold tracking-wide hover:bg-red-600/20 transition-colors uppercase text-sm"
              onClick={() => setSceneStateIndex((i) => Math.max(0, i - 1))}
            >
              &larr; PREV
            </button>
          )}
          {sceneIndex < scenes.length - 1 && !isEditing && (
            <button 
              className="rounded px-5 py-2 border border-red-500/80 bg-red-500 text-white font-semibold tracking-wide hover:bg-red-400 transition-colors uppercase text-sm"
              onClick={() => setSceneStateIndex((i) => Math.min(scenes.length - 1, i + 1))}
            >
              NEXT &rarr;
            </button>
          )}
        </div>
      </div>

      {sceneState === 'loading' ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[min(92vw,420px)] rounded-[32px] border border-white/10 bg-black/44 px-7 py-6 text-center backdrop-blur-2xl">
            <div className="text-[10px] uppercase tracking-[0.34em] text-white/42">
              Loading scene
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
              Building the Spider-Man silhouette...
            </div>
            <p className="mt-3 text-sm leading-6 text-white/58">
              OBJ, texture and the Pretext overlay are being wired together now.
            </p>
          </div>
        </div>
      ) : null}

      {introOpen && sceneState === 'ready' ? (
        <div className="absolute inset-0 flex items-center justify-center px-5">
          <div className="w-[min(92vw,470px)] rounded-[32px] border border-white/12 bg-black/48 p-7 shadow-[0_24px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
            <div className="text-[10px] uppercase tracking-[0.34em] text-white/44">
              Mouse controls
            </div>
            <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-white">
              Drag the plush. Watch the text breathe around it.
            </h2>
            <div className="mt-4 space-y-2 text-sm leading-6 text-white/62">
              <p>Left drag rotates the model.</p>
              <p>Right drag or Shift + drag pans sideways.</p>
              <p>Mouse wheel zooms in and out.</p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-full border border-red-400/30 bg-red-500/16 px-5 py-2 text-sm font-medium text-red-100 transition hover:border-red-300/50 hover:bg-red-500/22"
                onClick={() => setIntroOpen(false)}
              >
                Enter scene
              </button>
              <span className="text-xs uppercase tracking-[0.26em] text-white/32">
                Local asset: Spiderman_obj
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {sceneState === 'error' ? (
        <div className="absolute inset-0 flex items-center justify-center px-5">
          <div className="w-[min(92vw,520px)] rounded-[32px] border border-red-300/20 bg-black/58 px-7 py-6 text-center backdrop-blur-2xl">
            <div className="text-[10px] uppercase tracking-[0.34em] text-red-200/62">
              Scene failed
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
              The Spider-Man model could not be loaded.
            </div>
            <p className="mt-3 text-sm leading-6 text-white/64">
              {errorMessage ?? 'Check the OBJ, MTL and texture files in public/spiderman.'}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
