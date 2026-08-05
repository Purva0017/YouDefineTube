import { useSettings } from "~/hooks/useSettings"
import { type Settings } from "~/lib/settings"
import { Icons } from "../ui/Icons"

export function PowerOffView({ colors }: { colors: any }) {
  const { toggleSetting } = useSettings()

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
      padding: "0 32px",
      textAlign: "center"
    }}>
      <button
        onClick={() => toggleSetting("isExtensionEnabled")}
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "#ef4444",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 25px rgba(239, 68, 68, 0.4)",
          transition: "transform 0.1s, box-shadow 0.1s",
          marginBottom: 32
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = "scale(0.95)"
          e.currentTarget.style.boxShadow = "0 5px 15px rgba(239, 68, 68, 0.3)"
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = "scale(1)"
          e.currentTarget.style.boxShadow = "0 10px 25px rgba(239, 68, 68, 0.4)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)"
          e.currentTarget.style.boxShadow = "0 10px 25px rgba(239, 68, 68, 0.4)"
        }}
      >
        <Icons.Power isOn={true} size={64} color="white" />
      </button>
      <h2 style={{ margin: "0 0 12px 0", fontSize: 24, fontWeight: 800 }}>Extension is Off</h2>
      <p style={{ margin: 0, fontSize: 15, color: colors.subtext, lineHeight: 1.5 }}>
        YouDefineTube is currently sleeping. YouTube is running with its default settings. Click the power button to wake it up.
      </p>
    </div>
  )
}
