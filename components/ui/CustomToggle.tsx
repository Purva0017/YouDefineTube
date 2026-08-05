export function CustomToggle({
  checked,
  onChange,
  isDark,
  size = "medium"
}: {
  checked: boolean;
  onChange: () => void;
  isDark: boolean;
  size?: "small" | "medium"
}) {
  const isSmall = size === "small"
  return (
    <div
      onClick={onChange}
      style={{
        width: isSmall ? 32 : 44,
        height: isSmall ? 18 : 24,
        borderRadius: isSmall ? 9 : 12,
        background: checked ? "#cc0000" : (isDark ? "#3f3f3f" : "#d1d5db"),
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s"
      }}>
      <div
        style={{
          width: isSmall ? 14 : 18,
          height: isSmall ? 14 : 18,
          borderRadius: "50%",
          background: "white",
          position: "absolute",
          top: isSmall ? 2 : 3,
          left: checked ? (isSmall ? 16 : 23) : (isSmall ? 2 : 3),
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
        }}
      />
    </div>
  )
}
