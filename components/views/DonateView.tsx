import type { ThemeColors } from "~/lib/theme"
import paypalQrUrl from "url:~/assets/paypal-qr.png"
import razorpayQrUrl from "url:~/assets/razorpay-qr.png"

export function DonateView({ colors, isDark }: { colors: ThemeColors; isDark: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px 0", letterSpacing: "-0.01em" }}>
          Support the project
        </h2>
        <p style={{ fontSize: 12, color: colors.subtext, lineHeight: 1.6, margin: 0, fontWeight: 400 }}>
          Your contribution helps keep YouDefineTube free and distraction-free.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { label: "India", gateway: "Razorpay", url: "https://pages.razorpay.com/pl_SYKSUs58XJryrS/view", qr: razorpayQrUrl, btnBg: "#3395FF", btnColor: "#fff" },
          { label: "International", gateway: "PayPal", url: "https://www.paypal.com/ncp/payment/4RJMMJD45G5DQ", qr: paypalQrUrl, btnBg: "#ffc439", btnColor: "#003087" }
        ].map((item) => (
          <div
            key={item.gateway}
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              boxShadow: colors.shadowSm
            }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.04em",
                padding: "3px 10px",
                background: colors.tabBg,
                color: colors.muted,
                borderRadius: 6,
                marginBottom: 10
              }}>
              {item.label}
            </span>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px 0" }}>{item.gateway}</h3>
            <button
              type="button"
              onClick={() => window.open(item.url, "_blank")}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                border: "none",
                background: item.btnBg,
                color: item.btnColor,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                marginBottom: 14,
                transition: "opacity 0.15s ease"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9" }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1" }}>
              Pay via {item.gateway}
            </button>
            <div style={{ background: "#fff", padding: 8, borderRadius: 8, border: isDark ? "none" : `1px solid ${colors.border}` }}>
              <img src={item.qr} alt={`${item.gateway} QR`} style={{ width: 100, height: 100, display: "block" }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", paddingBottom: 8, fontSize: 10, color: colors.muted }}>
        © {new Date().getFullYear()} YouDefineTube by Purva Patel
      </div>
    </div>
  )
}
