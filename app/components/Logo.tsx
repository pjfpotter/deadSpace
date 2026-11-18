// Fernbrook mark and lockups. Colour comes from the surrounding text colour (currentColor):
// fern on linen/stone, linen on fern, fern on oak. Keep one mark-width of clear space round it.

export const FROND_PATH =
  "M50 114V8M34 114H66M50 98L75.5 79.4M50 82L75.5 63.4M50 66L73 49.3M50 51L69.6 36.7M50 37L65.3 25.8M50 25L60.2 17.6M50 91L24.5 72.4M50 75L26.2 57.6M50 59L28.75 43.5M50 44L32.2 31M50 31L36.4 21.1M50 19L41.5 12.8";

export const TAGLINE = "Made slowly. Made to stay.";

/** Mark alone is never shown below this height (px). */
export const MIN_MARK_HEIGHT = 30;

/** Thicker stroke at small sizes so the fronds stay readable. */
export function strokeFor(height: number): number {
  if (height < 35) return 9;
  if (height < 50) return 7.5;
  return 6.5;
}

export function Mark({ height = 40, className = "" }: { height?: number; className?: string }) {
  const h = Math.max(height, MIN_MARK_HEIGHT);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="18 2 64 118"
      width={(h * 64) / 118}
      height={h}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeFor(h)}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d={FROND_PATH} />
    </svg>
  );
}

export default function Logo({
  variant = "horizontal",
  markHeight = 40,
  className = "",
}: {
  variant?: "horizontal" | "stacked";
  markHeight?: number;
  className?: string;
}) {
  const stacked = variant === "stacked";
  return (
    <span
      role="img"
      aria-label="Fernbrook"
      className={`inline-flex ${stacked ? "flex-col items-center" : "items-center"} ${className}`}
      style={{ gap: markHeight * 0.25 }}
    >
      <Mark height={markHeight} />
      <span
        aria-hidden="true"
        className="font-display leading-none"
        style={{ fontSize: markHeight * (stacked ? 0.6 : 0.7), letterSpacing: "-0.03em" }}
      >
        Fernbrook
      </span>
    </span>
  );
}
