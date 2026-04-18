import * as THREE from 'three'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import type { MiranhaSceneBlueprint } from './miranha-types'

export const VIEWPORT_BACKGROUND = 0x060608
export const MODEL_DIRECTORY = '/spiderman/'
export const MODEL_BASENAME = 'Meshy_AI_Spider_Man_Plush_0414171926_texture'

export type PreparedMiranhaModel = {
  object: THREE.Object3D
  baseScale: number
  basePosition: THREE.Vector3
}

function disposeMaterial(material: THREE.Material): void {
  const disposableMaterial = material as THREE.Material & Record<string, unknown>

  for (const value of Object.values(disposableMaterial)) {
    if (value instanceof THREE.Texture) value.dispose()
  }

  material.dispose()
}

export function disposeObject(root: THREE.Object3D): void {
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
        phongMaterial.map.anisotropy = 10
      }
      phongMaterial.shininess = 20
      phongMaterial.reflectivity = 0.18
      phongMaterial.specular = new THREE.Color(0x18181f)
    }
  })
}

function createLoaders() {
  const materialLoader = new MTLLoader()
  materialLoader.setPath(MODEL_DIRECTORY)
  materialLoader.setResourcePath(MODEL_DIRECTORY)

  const objectLoader = new OBJLoader()
  objectLoader.setPath(MODEL_DIRECTORY)

  return { materialLoader, objectLoader }
}

export async function loadPreparedMiranhaModel(targetHeight: number): Promise<PreparedMiranhaModel> {
  const { materialLoader, objectLoader } = createLoaders()
  const materials = await materialLoader.loadAsync(`${MODEL_BASENAME}.mtl`)

  materials.preload()
  objectLoader.setMaterials(materials)

  const object = await objectLoader.loadAsync(`${MODEL_BASENAME}.obj`)
  polishObject(object)

  const unscaledBox = new THREE.Box3().setFromObject(object)
  const unscaledSize = unscaledBox.getSize(new THREE.Vector3())
  const scale = targetHeight / Math.max(unscaledSize.y, 0.001)

  object.scale.setScalar(scale)
  object.rotation.set(0.08, 0, 0)
  object.updateMatrixWorld(true)

  const centeredBox = new THREE.Box3().setFromObject(object)
  const centeredOffset = centeredBox.getCenter(new THREE.Vector3())
  object.position.sub(centeredOffset)
  object.position.y = -0.16
  object.updateMatrixWorld(true)

  return {
    object,
    baseScale: scale,
    basePosition: object.position.clone(),
  }
}

export function applyScenePose(
  model: THREE.Object3D,
  scene: MiranhaSceneBlueprint,
  baseScale: number,
  basePosition: THREE.Vector3,
  idleLift = 0,
): void {
  model.scale.setScalar(baseScale * scene.camera.modelScale)
  model.rotation.set(0.08, scene.camera.modelRotation, Math.sin(scene.camera.modelRotation * 0.5) * 0.02)
  model.position.set(
    basePosition.x + scene.camera.modelOffsetX,
    basePosition.y + scene.camera.modelOffsetY + idleLift,
    basePosition.z,
  )
  model.updateMatrixWorld(true)
}
