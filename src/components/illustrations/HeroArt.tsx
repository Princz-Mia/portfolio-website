import { Sparkle, Tube, delay, origin, s } from "./parts";

/**
 * A grey cat with a white bib sits on a stack of books and reaches up, one paw
 * raised, at an atom whose orbits keep turning.
 */
export function HeroArt({ className }: { className?: string }) {
  return (
    <svg
      className={`${s.figure} ${className ?? ""}`}
      viewBox="0 0 480 480"
      width="480"
      height="480"
      role="img"
      aria-labelledby="hero-art-title"
      focusable="false"
    >
      <title id="hero-art-title">
        Illustration of a grey cat on a stack of books, reaching up to bat at a
        floating atom
      </title>

      {/* backdrop */}
      <circle cx="282" cy="236" r="168" className={s.blob} />
      <circle cx="112" cy="176" r="66" className={s.blobShade} />
      <ellipse cx="262" cy="452" rx="150" ry="9" className={s.shade} />

      {/* books */}
      <g className={s.appear} style={delay(0)}>
        <rect
          x="150"
          y="426"
          width="230"
          height="26"
          rx="4"
          className={s.shade}
          transform="translate(6 5)"
        />
        <rect
          x="150"
          y="426"
          width="230"
          height="26"
          rx="4"
          className={`${s.line} ${s.paper}`}
        />
        <path d="M172 426 V452 M180 426 V452" className={s.line} />
        <path d="M200 439 H300" className={`${s.line} ${s.thin}`} />
        <rect
          x="168"
          y="400"
          width="196"
          height="26"
          rx="4"
          className={`${s.line} ${s.shade}`}
        />
        <rect x="330" y="400" width="14" height="26" className={s.accent} />
        <path d="M188 413 H268" className={`${s.line} ${s.thin}`} />
      </g>

      {/* cat, standing on the top book (y = 400) */}
      <g transform="translate(0 -8)">
        {/* tail */}
        <g className={s.swayTail} style={origin("0% 80%")}>
          <Tube
            d="M316 402 C356 404 376 378 366 350 C360 332 342 332 340 348"
            width={14}
          />
        </g>

        {/* body */}
        <path
          d="M212 246 C184 272 174 330 180 378 C183 398 198 408 216 408 L284 408 C302 408 317 398 320 378 C326 330 316 272 288 246"
          className={s.tint}
          transform="translate(9 6)"
        />
        <path
          d="M212 246 C184 272 174 330 180 378 C183 398 198 408 216 408 L284 408 C302 408 317 398 320 378 C326 330 316 272 288 246"
          className={`${s.line} ${s.fur}`}
        />
        {/* bib */}
        <path
          d="M230 258 C222 290 228 326 250 340 C272 326 278 290 270 258 Z"
          className={s.paper}
        />
        <path
          d="M240 330 L245 338 L250 330 L255 338 L260 330"
          className={`${s.line} ${s.thin}`}
        />
        {/* haunches */}
        <path
          d="M300 404 C312 380 306 350 288 342"
          className={`${s.line} ${s.thin}`}
        />
        <path
          d="M200 404 C190 384 194 360 206 350"
          className={`${s.line} ${s.thin}`}
        />
        {/* standing front leg and paw */}
        <path d="M270 300 C276 340 276 378 272 400" className={s.line} />
        <path
          d="M258 408 C258 398 266 393 277 393 C289 393 297 400 297 408 Z"
          className={`${s.line} ${s.paper}`}
        />
        <path
          d="M271 401 V407 M283 400 V407"
          className={`${s.line} ${s.thin}`}
        />

        {/* raised paw */}
        <g className={s.appear} style={delay(0.3)}>
          <path
            d="M232 292 C210 282 190 264 176 248 C168 238 152 242 156 255 C160 267 172 273 185 279 C203 291 221 305 238 316 Z"
            className={`${s.line} ${s.fur}`}
          />
          <circle cx="160" cy="246" r="2.4" className={s.accent} />
          <circle cx="156" cy="254" r="2.4" className={s.accent} />
          <circle cx="165" cy="253" r="3.2" className={s.accent} />
          <path
            d="M146 270 Q138 263 137 252 M136 280 Q124 273 122 260"
            className={s.accentLine}
          />
        </g>

        {/* ears */}
        <path
          d="M200 182 L194 124 Q195 115 203 120 L240 150 Z"
          className={`${s.line} ${s.fur}`}
        />
        <path
          d="M300 182 L306 124 Q305 115 297 120 L260 150 Z"
          className={`${s.line} ${s.fur}`}
        />
        <path d="M205 170 L201 134 L228 154 Z" className={s.tint} />
        <path d="M295 170 L299 134 L272 154 Z" className={s.tint} />

        {/* head */}
        <path
          d="M188 207 C186 170 212 144 250 144 C288 144 314 170 312 207 C310 240 284 260 250 260 C216 260 190 240 188 207 Z"
          className={`${s.line} ${s.fur}`}
        />
        <path
          d="M224 224 C224 211 237 206 250 213 C263 206 276 211 276 224 C276 240 264 248 250 248 C236 248 224 240 224 224 Z"
          className={s.paper}
        />
        <path
          d="M238 152 L241 166 M250 149 V164 M262 152 L259 166"
          className={`${s.line} ${s.strong}`}
        />
        <path
          d="M190 222 L182 228 L191 232 L184 238 L194 240"
          className={s.line}
        />
        <path
          d="M310 222 L318 228 L309 232 L316 238 L306 240"
          className={s.line}
        />

        {/* eyes, looking up at the atom */}
        <g className={s.blink}>
          <ellipse cx="228" cy="200" rx="10" ry="12" className={s.dark} />
          <ellipse cx="272" cy="200" rx="10" ry="12" className={s.dark} />
          <circle cx="224" cy="194" r="3.6" className={s.paper} />
          <circle cx="268" cy="194" r="3.6" className={s.paper} />
          <circle cx="231" cy="206" r="1.5" className={s.paper} />
          <circle cx="275" cy="206" r="1.5" className={s.paper} />
        </g>
        <ellipse cx="212" cy="225" rx="9" ry="5" className={s.tint} />
        <ellipse cx="288" cy="225" rx="9" ry="5" className={s.tint} />
        <path d="M244 220 Q250 216 256 220 L250 227 Z" className={s.accent} />
        <path
          d="M250 227 Q250 234 243 235 M250 227 Q250 234 257 235"
          className={s.line}
        />
        <path
          d="M224 228 L180 220 M224 233 L178 234 M226 238 L182 248 M276 228 L320 220 M276 233 L322 234 M274 238 L318 248"
          className={`${s.line} ${s.thin}`}
        />
      </g>

      {/* atom */}
      <g className={s.float}>
        <g className={s.orbit}>
          <g style={delay(0.4)}>
            <ellipse
              cx="124"
              cy="180"
              rx="56"
              ry="19"
              pathLength={1}
              className={`${s.line} ${s.draw}`}
            />
          </g>
          <g style={delay(0.55)}>
            <ellipse
              cx="124"
              cy="180"
              rx="56"
              ry="19"
              transform="rotate(60 124 180)"
              pathLength={1}
              className={`${s.line} ${s.draw}`}
            />
          </g>
          <g style={delay(0.7)}>
            <ellipse
              cx="124"
              cy="180"
              rx="56"
              ry="19"
              transform="rotate(120 124 180)"
              pathLength={1}
              className={`${s.line} ${s.draw}`}
            />
          </g>
          <circle cx="180" cy="180" r="3.6" className={s.inkFill} />
          <circle
            cx="180"
            cy="180"
            r="3.6"
            transform="rotate(60 124 180)"
            className={s.inkFill}
          />
          <circle
            cx="68"
            cy="180"
            r="3.6"
            transform="rotate(120 124 180)"
            className={s.accent}
          />
        </g>
        <circle cx="120" cy="177" r="7" className={s.accent} />
        <circle cx="129" cy="177" r="6" className={`${s.line} ${s.tint}`} />
        <circle cx="124" cy="185" r="6" className={`${s.line} ${s.paper}`} />
      </g>

      <Sparkle x={52} y={70} size={8} wait={0} />
      <Sparkle x={186} y={86} size={6} wait={0.9} tone="ink" />
      <Sparkle x={40} y={218} size={6} wait={1.6} />
      <Sparkle x={420} y={120} size={7} wait={0.5} tone="ink" />
    </svg>
  );
}
