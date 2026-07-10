import { statusTokenSuffix, type StatusKey } from "../../design-system/status";

export type RingMeterSize = "sm" | "md" | "lg";

export type RingMeterProps = {
  value: number;
  max?: number;
  label: string;
  tone?: StatusKey | "neutral";
  size?: RingMeterSize;
  className?: string;
};

const SIZE_PX: Record<RingMeterSize, number> = {
  sm: 40,
  md: 50,
  lg: 64,
};

function clampRatio(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, value / max));
}

function resolveStroke(tone: RingMeterProps["tone"]): string {
  if (!tone || tone === "neutral") {
    return "var(--ds-accent-primary)";
  }
  return `var(--status-${statusTokenSuffix(tone)}-text)`;
}

/**
 * Accessible SVG ring meter (SPEC §4.4). Agency Operations KPI use only.
 * No chart package. Reduced-motion safe (no required animation).
 */
export function RingMeter({
  value,
  max = 100,
  label,
  tone = "neutral",
  size = "md",
  className,
}: RingMeterProps) {
  const px = SIZE_PX[size];
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const ratio = clampRatio(safeValue, safeMax);
  const offset = circumference * (1 - ratio);
  const stroke = resolveStroke(tone);
  const displayValue = Number.isInteger(safeValue) ? String(safeValue) : safeValue.toFixed(1);
  const percent = Math.round(ratio * 100);

  return (
    <div
      className={["agency-ring-meter", className].filter(Boolean).join(" ")}
      role="img"
      aria-label={`${label}: ${displayValue} of ${safeMax} (${percent}%)`}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 50 50"
        aria-hidden="true"
        focusable="false"
        style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
      >
        <circle
          cx="25"
          cy="25"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="2.5"
        />
        <circle
          cx="25"
          cy="25"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="agency-ring-meter__value" style={{ color: stroke }} aria-hidden="true">
        {displayValue}
      </span>
    </div>
  );
}
