import { Icons } from "../ui/Icons"

export function SupportView({ colors, isDark }: { colors: any; isDark: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ marginBottom: 2, textAlign: "center" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px 0" }}>Having Trouble?</h2>
        <p style={{ fontSize: 13, color: colors.subtext, lineHeight: "1.5", margin: 0 }}>
          Try these quick fixes first — they solve most issues.
        </p>
      </div>

      {/* Troubleshoot Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          "Refresh the YouTube page",
          "Close all YouTube tabs & restart your browser",
          "Disable other extensions to rule out conflicts",
          "Remove & re-install YouDefineTube"
        ].map((step, i) => (
          <div key={i} style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "6px 0"
          }}>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: isDark ? "#888" : "#777",
              flexShrink: 0
            }}>
              {i + 1}
            </div>
            <span style={{ fontSize: 13, color: colors.subtext, lineHeight: "1.5", paddingTop: 1 }}>
              {step}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: colors.label
      }}>
        <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
        Still not working?
        <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
      </div>

      {/* Report Bug Button */}
      <button
        onClick={() => window.open("https://forms.gle/Nb5e5Cbuvuz9ukkDA", "_blank")}
        style={{
          width: "100%",
          padding: "13px 16px",
          borderRadius: 10,
          border: "none",
          background: "#cc0000",
          color: "#ffffff",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          transition: "opacity 0.15s ease"
        }}>
        Report Bug <Icons.External />
      </button>

      {/* Email fallback */}
      <div style={{
        fontSize: 12,
        color: colors.subtext,
        textAlign: "center",
        lineHeight: "1.6"
      }}>
        Or email me at{" "}
        <a
          href="mailto:purvaap17@gmail.com"
          style={{ color: "#cc0000", textDecoration: "none", fontWeight: 700 }}>
          purvaap17@gmail.com
        </a>
        <br />
        <span style={{ fontSize: 11, opacity: 0.7 }}>
          Include a description, screenshot, and browser (Chrome, Edge, Brave, etc.)
        </span>
      </div>
    </div>
  )
}
