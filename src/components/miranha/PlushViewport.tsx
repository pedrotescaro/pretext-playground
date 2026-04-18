import { startTransition, useEffect, useEffectEvent, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  applyScenePose,
  disposeObject,
  loadPreparedMiranhaModel,
  VIEWPORT_BACKGROUND,
} from '../../lib/miranha-model'
import {
  buildLayoutHash,
  layoutStoryAroundSilhouette,
  sampleSilhouetteIntervals,
} from '../../lib/miranha-layout'
import type {
  MiranhaSceneBlueprint,
  NarrativeBlockBlueprint,
  StoryLayout,
  ViewportState,
} from '../../lib/miranha-types'

type PlushViewportProps = {
  blocks: NarrativeBlockBlueprint[]
  editMode: boolean
  fontScale: number
  onInteractionChange: (isInteracting: boolean) => void
  onLayoutChange: (layout: StoryLayout) => void
  onParallaxChange: (parallax: { x: number, y: number }) => void
  onSceneStatusChange: (status: 'loading' | 'ready' | 'error', errorMessage?: string) => void
  onViewportChange: (viewport: ViewportState) => void
  onCameraChange?: (camera: { target: number[]; position: number[]; scale: number; offsetX: number; offsetY: number }) => void
  scene: MiranhaSceneBlueprint
}

export function PlushViewport({
  blocks,
  editMode,
  fontScale,
  onInteractionChange,
  onLayoutChange,
  onParallaxChange,
  onSceneStatusChange,
  onViewportChange,
  onCameraChange,
  scene,
}: PlushViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const modelRef = useRef<THREE.Object3D | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const viewportRef = useRef<ViewportState>({ width: 1440, height: 920 })
  const layoutHashRef = useRef('')
  const baseModelScaleRef = useRef(1)
  const baseModelPositionRef = useRef(new THREE.Vector3(0, -0.16, 0))
  const blocksRef = useRef(blocks)
  const fontScaleRef = useRef(fontScale)
  const sceneRef = useRef(scene)
  const isDraggingRef = useRef(false)
  const isSceneTransitioningRef = useRef(true)
  const cameraTargetRef = useRef(new THREE.Vector3(...scene.camera.target))
  const cameraPositionRef = useRef(new THREE.Vector3(...scene.camera.position))
  const parallaxRef = useRef({ x: 0, y: 0 })

  const emitInteraction = useEffectEvent(onInteractionChange)
  const emitLayout = useEffectEvent(onLayoutChange)
  const emitParallax = useEffectEvent(onParallaxChange)
  const emitSceneStatus = useEffectEvent(onSceneStatusChange)
  const emitViewport = useEffectEvent(onViewportChange)
  const emitCameraChange = useEffectEvent((cam: { target: number[]; position: number[]; scale: number; offsetX: number; offsetY: number }) => {
    if (onCameraChange) {
      onCameraChange(cam)
    }
  })

  useEffect(() => {
    sceneRef.current = scene
    cameraTargetRef.current.set(...scene.camera.target)
    cameraPositionRef.current.set(...scene.camera.position)
    isSceneTransitioningRef.current = true

    if (modelRef.current !== null) {
      applyScenePose(
        modelRef.current,
        scene,
        baseModelScaleRef.current,
        baseModelPositionRef.current,
      )
    }
  }, [scene])

  useEffect(() => {
    blocksRef.current = blocks
    fontScaleRef.current = fontScale
  }, [blocks, fontScale])

  useEffect(() => {
    if (controlsRef.current !== null) {
      controlsRef.current.enabled = !editMode
    }
  }, [editMode])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current

    if (container === null || canvas === null) return

    let disposed = false
    let animationFrame = 0
    let lastLayoutAt = 0
    const workCanvas = document.createElement('canvas')

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    })
    renderer.setClearColor(VIEWPORT_BACKGROUND, 1)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.9))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    rendererRef.current = renderer

    const stage = new THREE.Scene()
    stage.background = new THREE.Color(VIEWPORT_BACKGROUND)

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40)
    camera.position.set(...sceneRef.current.camera.position)

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.55)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.55)
    const rimLight = new THREE.DirectionalLight(0x4a84ff, 1.55)
    const fillLight = new THREE.PointLight(0xf24c3d, 18, 12, 2)

    keyLight.position.set(3.2, 4.0, 5.4)
    rimLight.position.set(-4.4, 2.2, -3.7)
    fillLight.position.set(1.4, -0.2, 4.6)

    stage.add(ambientLight, keyLight, rimLight, fillLight)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enabled = !editMode
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.screenSpacePanning = true
    controls.rotateSpeed = 0.78
    controls.panSpeed = 0.82
    controls.zoomSpeed = 0.92
    controls.minDistance = 2.2
    controls.maxDistance = 18
    controls.minPolarAngle = 0.45
    controls.maxPolarAngle = 2.2
    controls.target.set(...sceneRef.current.camera.target)
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
    controlsRef.current = controls

    const syncViewport = () => {
      const nextViewport = {
        width: container.clientWidth || window.innerWidth,
        height: container.clientHeight || window.innerHeight,
      }

      viewportRef.current = nextViewport
      emitViewport(nextViewport)

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.9))
      renderer.setSize(nextViewport.width, nextViewport.height, false)
      camera.aspect = nextViewport.width / Math.max(nextViewport.height, 1)
      camera.updateProjectionMatrix()
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return

      const nextParallax = {
        x: Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2)),
        y: Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2)),
      }

      parallaxRef.current = nextParallax
      emitParallax(nextParallax)
    }

    const handlePointerLeave = () => {
      parallaxRef.current = { x: 0, y: 0 }
      emitParallax(parallaxRef.current)
    }

    const handleControlStart = () => {
      isDraggingRef.current = true
      isSceneTransitioningRef.current = false
      emitInteraction(true)
    }

    const handleControlEnd = () => {
      isDraggingRef.current = false
      emitInteraction(false)
    }

    const handleControlChange = () => {
      if (controls && camera) {
        emitCameraChange({
          target: [controls.target.x, controls.target.y, controls.target.z],
          position: [camera.position.x, camera.position.y, camera.position.z],
          scale: baseModelScaleRef.current,
          offsetX: 0,
          offsetY: 0
        })
      }
    }

    emitSceneStatus('loading')
    window.addEventListener('resize', syncViewport)
    renderer.domElement.addEventListener('pointermove', handlePointerMove)
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave)
    controls.addEventListener('start', handleControlStart)
    controls.addEventListener('end', handleControlEnd)
    controls.addEventListener('change', handleControlChange)
    syncViewport()

    void loadPreparedMiranhaModel(viewportRef.current.width < 1080 ? 3.05 : 3.78)
      .then(preparedModel => {
        if (disposed) {
          disposeObject(preparedModel.object)
          return
        }

        baseModelScaleRef.current = preparedModel.baseScale
        baseModelPositionRef.current.copy(preparedModel.basePosition)
        modelRef.current = preparedModel.object
        applyScenePose(
          preparedModel.object,
          sceneRef.current,
          baseModelScaleRef.current,
          baseModelPositionRef.current,
        )
        stage.add(preparedModel.object)
        emitSceneStatus('ready')
      })
      .catch(error => {
        if (disposed) return
        emitSceneStatus(
          'error',
          error instanceof Error ? error.message : 'Falha ao carregar o modelo do Miranha.',
        )
      })

    const renderLoop = (timestamp: number) => {
      if (disposed) return

      animationFrame = window.requestAnimationFrame(renderLoop)

      if (isSceneTransitioningRef.current && !isDraggingRef.current) {
        camera.position.lerp(cameraPositionRef.current, 0.05)
        controls.target.lerp(cameraTargetRef.current, 0.05)

        if (
          camera.position.distanceToSquared(cameraPositionRef.current) < 0.001 &&
          controls.target.distanceToSquared(cameraTargetRef.current) < 0.001
        ) {
          isSceneTransitioningRef.current = false
        }
      } else if (isDraggingRef.current) {
        cameraPositionRef.current.copy(camera.position)
        cameraTargetRef.current.copy(controls.target)
      }

      keyLight.position.x = THREE.MathUtils.lerp(
        keyLight.position.x,
        3.2 + parallaxRef.current.x * 0.72,
        0.05,
      )
      keyLight.position.y = THREE.MathUtils.lerp(
        keyLight.position.y,
        4.0 - parallaxRef.current.y * 0.32,
        0.05,
      )
      fillLight.position.x = THREE.MathUtils.lerp(
        fillLight.position.x,
        1.4 + parallaxRef.current.x * 0.64,
        0.05,
      )
      fillLight.position.y = THREE.MathUtils.lerp(
        fillLight.position.y,
        -0.2 - parallaxRef.current.y * 0.42,
        0.05,
      )

      if (modelRef.current !== null) {
        applyScenePose(
          modelRef.current,
          sceneRef.current,
          baseModelScaleRef.current,
          baseModelPositionRef.current,
          0 // No idle lift (static)
        )
      }

      controls.update()
      renderer.render(stage, camera)

      if (modelRef.current === null) return

      const currentViewport = viewportRef.current
      if (currentViewport.width <= 0 || currentViewport.height <= 0) return
      if (timestamp - lastLayoutAt < 40) return
      lastLayoutAt = timestamp

      const sampleWidth = Math.min(640, Math.max(360, Math.round(currentViewport.width * 0.38)))
      const sampleHeight = Math.min(420, Math.max(240, Math.round(currentViewport.height * 0.38)))
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
        fontScale: fontScaleRef.current,
      })
      const nextHash = buildLayoutHash(
        nextLayout,
        {
          distance: camera.position.distanceTo(controls.target),
          polar: controls.getPolarAngle(),
          azimuth: controls.getAzimuthalAngle(),
        },
        fontScaleRef.current,
        blocksRef.current,
      )

      if (nextHash === layoutHashRef.current) return

      layoutHashRef.current = nextHash
      startTransition(() => {
        emitLayout(nextLayout)
      })
    }

    animationFrame = window.requestAnimationFrame(renderLoop)

    return () => {
      disposed = true
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', syncViewport)
      renderer.domElement.removeEventListener('pointermove', handlePointerMove)
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave)
      controls.removeEventListener('start', handleControlStart)
      controls.removeEventListener('end', handleControlEnd)
      controls.removeEventListener('change', handleControlChange)
      controls.dispose()
      emitInteraction(false)
      emitParallax({ x: 0, y: 0 })
      if (modelRef.current !== null) {
        disposeObject(modelRef.current)
        modelRef.current = null
      }
      stage.clear()
      renderer.dispose()
      rendererRef.current = null
    }
  }, [editMode])

  return (
    <div ref={containerRef} className="miranha-viewport">
      <canvas ref={canvasRef} className="miranha-viewport__canvas" />
    </div>
  )
}
