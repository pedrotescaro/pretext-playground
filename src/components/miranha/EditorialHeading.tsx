import { MIRANHA_THEME } from '../../data/miranha-theme'

type EditorialHeadingProps = {
  isInteracting: boolean
  sceneCount: number
  sceneIndex: number
}

export function EditorialHeading({
  isInteracting,
  sceneCount,
  sceneIndex,
}: EditorialHeadingProps) {
  return (
    <header className="miranha-heading">
      <div className="miranha-brand">
        <div className="miranha-brand__name">{MIRANHA_THEME.brand}</div>
        <div className="miranha-brand__meta">{MIRANHA_THEME.metaLine}</div>
      </div>

      <div className="miranha-heading__status">
        <span>{`SCENE ${sceneIndex + 1} / ${sceneCount}`}</span>
        <span>{isInteracting ? 'LIVE VIEW' : MIRANHA_THEME.interactionHint}</span>
      </div>
    </header>
  )
}
