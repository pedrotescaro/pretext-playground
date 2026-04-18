type AmbientBackdropProps = {
  parallax: { x: number, y: number }
}

export function AmbientBackdrop({ parallax }: AmbientBackdropProps) {
  return (
    <div className="miranha-backdrop" aria-hidden="true">
      <div
        className="miranha-backdrop__halo miranha-backdrop__halo--red"
        style={{ transform: `translate3d(${parallax.x * -42}px, ${parallax.y * -18}px, 0)` }}
      />
      <div
        className="miranha-backdrop__halo miranha-backdrop__halo--blue"
        style={{ transform: `translate3d(${parallax.x * 28}px, ${parallax.y * 20}px, 0)` }}
      />
      <div className="miranha-backdrop__ring miranha-backdrop__ring--left" />
      <div className="miranha-backdrop__ring miranha-backdrop__ring--right" />
      <div className="miranha-backdrop__web miranha-backdrop__web--left" />
      <div className="miranha-backdrop__web miranha-backdrop__web--right" />
      <div className="miranha-backdrop__grain" />
    </div>
  )
}
