import paypalQrUrl from "url:~/assets/paypal-qr.png"
import razorpayQrUrl from "url:~/assets/razorpay-qr.png"

export function DonateView({ colors, isDark }: { colors: any; isDark: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Hero Section */}
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 10px 0" }}>Fuel the Mission</h2>
        <p style={{ fontSize: 13, color: colors.subtext, lineHeight: "1.5", margin: 0 }}>
          Maintaining this extension requires constant updates. Your contribution helps keep it
          distraction-free for everyone.
        </p>
      </div>

      {/* Payment Gateway Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* India - Razorpay */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${colors.border}`,
            borderRadius: 16,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              padding: "2px 8px",
              background: "#3395FF22",
              color: "#3395FF",
              borderRadius: 100,
              marginBottom: 10
            }}>
            India
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 12px 0" }}>Razorpay</h3>
          <button
            onClick={() => window.open("https://pages.razorpay.com/pl_SYKSUs58XJryrS/view", "_blank")}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 12,
              border: "none",
              background: "#3395FF",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              marginBottom: 16
            }}>
            Pay via Razorpay
          </button>
          <div style={{ background: "#ffffff", padding: 10, borderRadius: 12, border: isDark ? "none" : "1px solid #e5e7eb" }}>
            <img src={razorpayQrUrl} alt="Razorpay QR" style={{ width: 120, height: 120 }} />
          </div>
        </div>

        {/* Global - PayPal */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${colors.border}`,
            borderRadius: 16,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              padding: "2px 8px",
              background: "#ffc43922",
              color: "#ffc439",
              borderRadius: 100,
              marginBottom: 10
            }}>
            International
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 12px 0" }}>PayPal</h3>
          <button
            onClick={() => window.open("https://www.paypal.com/ncp/payment/4RJMMJD45G5DQ", "_blank")}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 12,
              border: "none",
              background: "#ffc439",
              color: "#003087",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              marginBottom: 16
            }}>
            Pay via PayPal
          </button>
          <div style={{ background: "#ffffff", padding: 10, borderRadius: 12, border: isDark ? "none" : "1px solid #e5e7eb" }}>
            <img src={paypalQrUrl} alt="PayPal QR" style={{ width: 120, height: 120 }} />
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "10px 0 20px", opacity: 0.5, fontSize: 11 }}>
        © {new Date().getFullYear()} YouDefineTube by Purva Patel
      </div>
    </div>
  )
}
