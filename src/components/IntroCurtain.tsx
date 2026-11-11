/**
 * A short opening: an atom draws itself, the name settles, and the curtain lifts.
 * Pure CSS, decorative, hidden from assistive technology, shown once per visit
 * (see the inline script in the root layout) and never with reduced motion.
 */
export function IntroCurtain({ name }: { name: string }) {
  return (
    <div className="intro-curtain" aria-hidden="true">
      <div className="intro-curtain__mark">
        <svg className="intro-curtain__atom" viewBox="0 0 80 80">
          <g className="intro-curtain__spin">
            <ellipse className="intro-curtain__orbit" cx="40" cy="40" rx="34" ry="12" pathLength={1} />
            <ellipse
              className="intro-curtain__orbit"
              cx="40"
              cy="40"
              rx="34"
              ry="12"
              transform="rotate(60 40 40)"
              pathLength={1}
            />
            <ellipse
              className="intro-curtain__orbit"
              cx="40"
              cy="40"
              rx="34"
              ry="12"
              transform="rotate(120 40 40)"
              pathLength={1}
            />
          </g>
          <circle className="intro-curtain__nucleus" cx="40" cy="40" r="5" />
        </svg>
        <span className="intro-curtain__name">{name}</span>
      </div>
    </div>
  );
}
