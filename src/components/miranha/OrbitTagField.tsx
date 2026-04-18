import type { OrbitTagBlueprint } from '../../lib/miranha-types'

type OrbitTagFieldProps = {
  parallax: { x: number, y: number }
  tags: OrbitTagBlueprint[]
}

export function OrbitTagField({ parallax, tags }: OrbitTagFieldProps) {
  return (
    <div className="miranha-tags" aria-hidden="true">
      {tags.map(tag => (
        <span
          key={tag.id}
          className={`miranha-tag miranha-tag--${tag.tone}`}
          style={{
            left: `${tag.x}px`,
            top: `${tag.y}px`,
            transform: `translate3d(${parallax.x * 12}px, ${parallax.y * 10}px, 0)`,
          }}
        >
          {tag.label}
        </span>
      ))}
    </div>
  )
}
