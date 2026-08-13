import type { ThemeColors } from "~/lib/theme"

type WaveRangeSliderProps = {
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  colors: ThemeColors
  isDark: boolean
  className?: string
}

export function WaveRangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  colors,
  isDark,
  className = ""
}: WaveRangeSliderProps) {
  const progress = ((value - min) / (max - min)) * 100
  const trackFill = isDark ? "#f4f0ff" : "#ffffff"
  const trackRest = isDark ? "rgba(255,255,255,0.18)" : "rgba(90,70,140,0.22)"
  const shellBg = isDark
    ? "linear-gradient(135deg, rgba(72,56,110,0.55) 0%, rgba(42,36,56,0.85) 100%)"
    : "linear-gradient(135deg, rgba(214,204,245,0.65) 0%, rgba(186,170,230,0.45) 100%)"
  const shellBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(90,70,140,0.2)"

  return (
    <div
      className={`ydt-wave-slider-shell ${className}`.trim()}
      style={{
        padding: "14px 16px 12px",
        borderRadius: 14,
        background: shellBg,
        border: `1px solid ${shellBorder}`,
        boxShadow: isDark ? "inset 0 1px 0 rgba(255,255,255,0.06)" : "inset 0 1px 0 rgba(255,255,255,0.65)"
      }}>
      <style>{`
        .ydt-wave-slider-shell .ydt-wave-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 32px;
          margin: 0;
          background: transparent;
          cursor: pointer;
          outline: none;
        }
        .ydt-wave-slider-shell .ydt-wave-slider::-webkit-slider-runnable-track {
          height: 8px;
          border-radius: 99px;
          background:
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 8' preserveAspectRatio='none'%3E%3Cpath d='M0 4 Q7.5 1 15 4 T30 4 T45 4 T60 4 T75 4 T90 4 T105 4 T120 4' fill='none' stroke='${encodeURIComponent(trackFill)}' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E")
            left center / var(--ydt-progress) 8px no-repeat,
            ${trackRest};
        }
        .ydt-wave-slider-shell .ydt-wave-slider::-moz-range-track {
          height: 8px;
          border-radius: 99px;
          background: ${trackRest};
        }
        .ydt-wave-slider-shell .ydt-wave-slider::-moz-range-progress {
          height: 8px;
          border-radius: 99px;
          background: ${trackFill};
        }
        .ydt-wave-slider-shell .ydt-wave-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          margin-top: -6px;
          border-radius: 50%;
          background: ${trackFill};
          border: 2px solid ${isDark ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.9)"};
          box-shadow: 0 2px 10px rgba(0,0,0,0.35), 0 0 0 4px ${isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.55)"};
          cursor: grab;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .ydt-wave-slider-shell .ydt-wave-slider:active::-webkit-slider-thumb {
          cursor: grabbing;
          transform: scale(1.08);
        }
        .ydt-wave-slider-shell .ydt-wave-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${trackFill};
          border: 2px solid ${isDark ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.9)"};
          box-shadow: 0 2px 10px rgba(0,0,0,0.35);
          cursor: grab;
        }
      `}</style>
      <input
        type="range"
        className="ydt-wave-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={{ ["--ydt-progress" as string]: `${progress}%` }}
      />
    </div>
  )
}
