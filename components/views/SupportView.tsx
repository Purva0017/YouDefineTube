import type { ThemeColors } from "~/lib/theme"
import { Icons } from "../ui/Icons"

export function SupportView({ colors, isDark }: { colors: ThemeColors; isDark: boolean }) {
  const steps = [
    "Refresh the YouTube page",
    "Close all YouTube tabs & restart your browser",
    "Disable other extensions to rule out conflicts",
    "Remove & re-install YouDefineTube"
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px 0", letterSpacing: "-0.01em" }}>
          Having trouble?
        </h2>
        <p style={{ fontSize: 12, color: colors.subtext, lineHeight: 1.6, margin: 0, fontWeight: 400 }}>
          Try these quick fixes first — they solve most issues.
        </p>
      </div>

      <div
        style={{
          background: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: 10,
          padding: "4px 16px",
          boxShadow: colors.shadowSm
        }}>
        {steps.map((step, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "12px 0",
              borderBottom: i < steps.length - 1 ? `1px solid ${colors.border}` : "none"
            }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: colors.accent,
                flexShrink: 0,
                width: 20,
                textAlign: "center",
                lineHeight: "20px"
              }}>
              {i + 1}
            </span>
            <span style={{ fontSize: 12, color: colors.subtext, lineHeight: 1.6, fontWeight: 400 }}>{step}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => window.open("https://forms.gle/Nb5e5Cbuvuz9ukkDA", "_blank")}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: 8,
          border: "none",
          background: colors.accent,
          color: "#ffffff",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          transition: "background 0.15s ease"
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = colors.accentHover }}
        onMouseLeave={(e) => { e.currentTarget.style.background = colors.accent }}>
        Report a bug <Icons.External />
      </button>

      <div style={{ fontSize: 11, color: colors.muted, textAlign: "center", lineHeight: 1.6 }}>
        Or email{" "}
        <a href="mailto:purvaap17@gmail.com" style={{ color: colors.accent, textDecoration: "none", fontWeight: 600 }}>
          purvaap17@gmail.com
        </a>
      </div>
    </div>
  )
}
