/**
 * The horizon wallpaper behind the top of the page. It scrolls away with the page and its
 * bottom edge melts into the ground (same night-side colour), so there's no seam.
 * Dark mode only (hidden in light mode via CSS).
 */
export function Sky() {
  return (
    <div className="sky" aria-hidden="true">
      <picture>
        <source media="(min-aspect-ratio: 1/1)" srcSet="/horizon/landscape.webp" />
        <img src="/horizon/portrait.webp" alt="" fetchPriority="high" />
      </picture>
    </div>
  )
}
