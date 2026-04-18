import { MIRANHA_THEME } from '../../data/miranha-theme'
import type { MiranhaSceneBlueprint } from '../../lib/miranha-types'

type EditorDockProps = {
  editMode: boolean
  fontScale: number
  onFontScaleChange: (direction: -1 | 1) => void
  onNextScene: () => void
  onPreviousScene: () => void
  onSceneSelect: (index: number) => void
  onToggleEdit: () => void
  onModelScaleChange: (direction: -1 | 1) => void
  scene: MiranhaSceneBlueprint
  sceneIndex: number
  scenes: MiranhaSceneBlueprint[]
}

export function EditorDock({
  editMode,
  fontScale,
  onFontScaleChange,
  onModelScaleChange,
  onNextScene,
  onPreviousScene,
  onSceneSelect,
  onToggleEdit,
  scene,
  sceneIndex,
  scenes,
}: EditorDockProps) {
  const hasPreviousScene = sceneIndex > 0
  const isLastScene = sceneIndex >= scenes.length - 1

  return (
    <>
      <div className={`miranha-dock ${editMode ? 'miranha-dock--editing' : ''}`}>
        <button type="button" className="miranha-dock__primary" onClick={onToggleEdit}>
          {editMode ? MIRANHA_THEME.viewLabel : MIRANHA_THEME.editLabel}
        </button>

        <div className="miranha-dock__nav">
          {hasPreviousScene ? (
            <button
              type="button"
              className="miranha-dock__secondary"
              onClick={onPreviousScene}
            >
              &larr;&nbsp;&nbsp;&nbsp;PREV
            </button>
          ) : null}
          {!isLastScene ? (
            <button
              type="button"
              className="miranha-dock__secondary miranha-dock__secondary--accent"
              onClick={onNextScene}
            >
              NEXT&nbsp;&nbsp;&nbsp;&rarr;
            </button>
          ) : null}
        </div>
      </div>

      {editMode ? (
        <div className="miranha-editor-bar">
          <div className="miranha-editor-bar__group">
            {scenes.map((sceneItem, index) => (
              <button
                key={sceneItem.id}
                type="button"
                className={`miranha-chip ${sceneIndex === index ? 'miranha-chip--active' : ''}`}
                onClick={() => onSceneSelect(index)}
              >
                {`Scene ${index + 1}`}
              </button>
            ))}
          </div>

          <div className="miranha-editor-bar__group">
            <div className="miranha-stepper">
              <span className="miranha-stepper__label">Texto</span>
              <button type="button" onClick={() => onFontScaleChange(-1)}>
                -
              </button>
              <span>{Math.round(fontScale * 100)}%</span>
              <button type="button" onClick={() => onFontScaleChange(1)}>
                +
              </button>
            </div>

            <div className="miranha-stepper">
              <span className="miranha-stepper__label">Plush</span>
              <button type="button" onClick={() => onModelScaleChange(-1)}>
                -
              </button>
              <span>{Math.round(scene.camera.modelScale * 100)}%</span>
              <button type="button" onClick={() => onModelScaleChange(1)}>
                +
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}



