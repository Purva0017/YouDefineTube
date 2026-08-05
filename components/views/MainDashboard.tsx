import { useState } from "react"
import { useSettings } from "~/hooks/useSettings"
import { type Settings, defaultSettings } from "~/lib/settings"
import { Icons } from "../ui/Icons"
import { CustomToggle } from "../ui/CustomToggle"
import { formatTimeStr } from "~/lib/utils"

export function MainDashboard({ colors, isDark }: { colors: any; isDark: boolean }) {
  const { settings, toggleSetting, setSettings } = useSettings()
  const isGeneralOpen = settings?.isGeneralCategoryOpen ?? true // The ?? operator checks if the value on its left is nullish (either null or undefined). If the left value is undefined (meaning the settings are still loading or this setting doesn't exist yet), it uses the fallback value on the right.
  const isSearchOpen = settings?.isSearchCategoryOpen ?? true
  const isAudioOpen = settings?.isAudioCategoryOpen ?? true
  const isFocusOpen = settings?.isFocusCategoryOpen ?? true

  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null)

  const formatScheduleDays = (days: number[]) => {
    if (!days || days.length === 0) return "No days"
    if (days.length === 7) return "Everyday"
    if (days.length === 5 && [1, 2, 3, 4, 5].every(d => days.includes(d))) return "Weekdays"
    if (days.length === 2 && [0, 6].every(d => days.includes(d))) return "Weekends"
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const sorted = [...days].sort((a, b) => a - b)
    return sorted.map(d => dayNames[d]).join(", ")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* General Distractions Header */}
      <div
        onClick={() => toggleSetting("isGeneralCategoryOpen")}
        className="category-header"
        style={{ marginTop: 2 }}>
        <Icons.CategoryToggle rotated={isGeneralOpen} />
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase" as const,
          letterSpacing: "0.06em",
          color: isDark ? "#cccccc" : "#555555",
          flex: 1
        }}>
          General Distractions
        </span>
      </div>

      {isGeneralOpen && (
        <div style={{ paddingLeft: 18 }}>
          {[
            { key: "hideShorts", label: "Hide Shorts", icon: <Icons.Shorts /> },
            { key: "hideHomepageRecommendations", label: "Hide Homepage Recommendations", icon: <Icons.Home /> },
            { key: "hideVideoSidebarRecommendations", label: "Hide Video Sidebar Recommendations", icon: <Icons.Sidebar /> },
            { key: "hideComments", label: "Hide Comments", icon: <Icons.Comments /> },
            { key: "hideEndScreen", label: "Hide End Screen", icon: <Icons.EndScreen /> },
            { key: "hidePlayables", label: "Hide Playables", icon: <Icons.Gamepad /> },
            { key: "hideLiveChat", label: "Hide Live Chat", icon: <Icons.Chat /> },
          ].map((item) => (
            <div key={item.key}>
              <div className="setting-row">
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: colors.text, fontSize: 13, fontWeight: 500 }}>
                  <div style={{ opacity: 0.7, display: "flex", alignItems: "center" }}>{item.icon}</div>
                  {item.label}
                  {item.key === "hideHomepageRecommendations" && (
                    <Icons.Chevron rotated={!!settings?.hideHomepageRecommendations} />
                  )}
                </div>
                <CustomToggle
                  checked={!!settings?.[item.key as keyof Settings]}
                  onChange={() => toggleSetting(item.key as keyof Settings)}
                  isDark={isDark}
                />
              </div>
              {item.key === "hideHomepageRecommendations" && settings?.hideHomepageRecommendations && (
                <div className="setting-row" style={{ paddingLeft: 28, marginTop: -2 }}>
                  <div style={{ color: colors.subtext, fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderLeft: `1.5px solid ${isDark ? '#444' : '#d1d5db'}`, borderBottom: `1.5px solid ${isDark ? '#444' : '#d1d5db'}`, marginBottom: 2 }} />
                    Redirect to Subscriptions
                  </div>
                  <CustomToggle
                    checked={!!settings?.redirectToSubscriptions}
                    onChange={() => toggleSetting("redirectToSubscriptions")}
                    isDark={isDark}
                    size="small"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Search Refinements Header */}
      <div
        onClick={() => toggleSetting("isSearchCategoryOpen")}
        className="category-header"
        style={{ marginTop: 4 }}>
        <Icons.CategoryToggle rotated={isSearchOpen} />
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase" as const,
          letterSpacing: "0.06em",
          color: isDark ? "#cccccc" : "#555555",
          flex: 1
        }}>
          Search Refinements
        </span>
      </div>

      {isSearchOpen && (
        <div style={{ paddingLeft: 18 }}>
          {[
            { key: "gridSearchMode", label: "Grid Layout for Search Results", icon: <Icons.Grid /> },
            { key: "hidePeopleAlsoWatched", label: "Hide 'People also watched'", icon: <Icons.Search /> },
            { key: "hidePeopleAlsoSearchFor", label: "Hide 'People also search for'", icon: <Icons.Search /> },
            { key: "hideFromRelatedSearches", label: "Hide 'From related searches'", icon: <Icons.Search /> },
            { key: "hideChannelsNewToYou", label: "Hide 'Channels new to you'", icon: <Icons.Search /> },
            { key: "hideExploreMore", label: "Hide 'Explore more'", icon: <Icons.Search /> }
          ].map((item) => (
            <div key={item.key} className="setting-row">
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: colors.text, fontSize: 13, fontWeight: 500 }}>
                <div style={{ opacity: 0.7, display: "flex", alignItems: "center" }}>{item.icon}</div>
                {item.label}
              </div>
              <CustomToggle
                checked={!!settings?.[item.key as keyof Settings]}
                onChange={() => toggleSetting(item.key as keyof Settings)}
                isDark={isDark}
              />
            </div>
          ))}
        </div>
      )}

      {/* Audio & Video Enhancements Header */}
      <div
        onClick={() => toggleSetting("isAudioCategoryOpen")}
        className="category-header"
        style={{ marginTop: 4 }}>
        <Icons.CategoryToggle rotated={isAudioOpen} />
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase" as const,
          letterSpacing: "0.06em",
          color: isDark ? "#cccccc" : "#555555",
          flex: 1
        }}>
          Audio Enhancements
        </span>
      </div>

      {isAudioOpen && (
        <div style={{ paddingLeft: 18 }}>
          {/* Vocal Boost Toggle */}
          <div className="setting-row">
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: colors.text, fontSize: 13, fontWeight: 500 }}>
              <div style={{ opacity: 0.7, display: "flex", alignItems: "center" }}><Icons.Mic /></div>
              Vocal Boost
              <div className="tooltip-container" style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                <Icons.Info />
                <span className="tooltip-text">
                  Emphasizes human speech frequencies (250Hz - 4kHz) and cuts low-end rumble. Great for podcasts, tutorials, and lectures.
                </span>
              </div>
            </div>
            <CustomToggle
              checked={!!settings?.audioVocalBoost}
              onChange={() => toggleSetting("audioVocalBoost")}
              isDark={isDark}
            />
          </div>

          {/* Volume Booster Slider */}
          <div className="setting-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 6, padding: "8px 4px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: colors.text, fontSize: 13, fontWeight: 500 }}>
                <div style={{ opacity: 0.7, display: "flex", alignItems: "center" }}><Icons.Volume /></div>
                Volume Booster
              </div>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: settings?.audioVolumeBoost && settings.audioVolumeBoost > 100 ? "#cc0000" : colors.subtext,
                transition: "color 0.2s"
              }}>
                {settings?.audioVolumeBoost ?? 100}%
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0" }}>
              <input
                type="range"
                min="100"
                max="300"
                step="10"
                value={settings?.audioVolumeBoost ?? 100}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setSettings({ ...(settings || defaultSettings), audioVolumeBoost: val });
                }}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  outline: "none",
                  WebkitAppearance: "none",
                  background: isDark ? "#333333" : "#e5e7eb",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Focus & Mindfulness Header */}
      <div
        onClick={() => toggleSetting("isFocusCategoryOpen")}
        className="category-header"
        style={{ marginTop: 4 }}>
        <Icons.CategoryToggle rotated={isFocusOpen} />
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase" as const,
          letterSpacing: "0.06em",
          color: isDark ? "#cccccc" : "#555555",
          flex: 1
        }}>
          Focus & Mindfulness
        </span>
      </div>

      {isFocusOpen && (
        <div style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Are You Sure Toggle */}
          <div className="setting-row">
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: colors.text, fontSize: 13, fontWeight: 500 }}>
              <div style={{ opacity: 0.7, display: "flex", alignItems: "center" }}>🧠</div>
              "Are You Sure?" Friction
              <div className="tooltip-container" style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                <Icons.Info />
                <span className="tooltip-text">
                  Prompts you to state your focus goal when opening YouTube, keeping it visible as a floating badge on screen.
                </span>
              </div>
            </div>
            <CustomToggle
              checked={!!settings?.enableFrictionScreen}
              onChange={() => toggleSetting("enableFrictionScreen")}
              isDark={isDark}
            />
          </div>

          {/* Focus Schedules Toggle */}
          <div className="setting-row">
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: colors.text, fontSize: 13, fontWeight: 500 }}>
              <div style={{ opacity: 0.7, display: "flex", alignItems: "center" }}><Icons.Moon /></div>
              Focus Schedules
              <div className="tooltip-container" style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                <Icons.Info />
                <span className="tooltip-text">
                  Blocks access to YouTube completely during designated days and time intervals (e.g. Bedtime schedules).
                </span>
              </div>
            </div>
            <CustomToggle
              checked={!!settings?.enableFocusBlocker}
              onChange={() => toggleSetting("enableFocusBlocker")}
              isDark={isDark}
            />
          </div>

          {/* Focus Schedules list */}
          {settings?.enableFocusBlocker && (
            <div style={{ marginTop: 4, display: "flex", flexDirection: "column" }}>
              {(settings.focusSchedules || []).map((sched) => (
                <div key={sched.id} style={{
                  background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.025)",
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: "10px 12px",
                  marginBottom: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8
                }}>
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div
                      onClick={() => setExpandedScheduleId(expandedScheduleId === sched.id ? null : sched.id)}
                      style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, cursor: "pointer", minWidth: 0 }}
                    >
                      <span style={{ fontSize: 14 }}>{/bed|sleep|night/i.test(sched.name) ? "🌙" : "⏳"}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: colors.text }}>
                          {sched.name}
                        </div>
                        <div style={{ fontSize: 11, color: colors.subtext }}>
                          {formatScheduleDays(sched.days)}, {formatTimeStr(sched.startTime)} - {formatTimeStr(sched.endTime)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <CustomToggle
                        checked={sched.enabled}
                        onChange={() => {
                          const nextSchedules = settings.focusSchedules.map(s =>
                            s.id === sched.id ? { ...s, enabled: !s.enabled } : s
                          )
                          setSettings({ ...settings, focusSchedules: nextSchedules })
                        }}
                        isDark={isDark}
                        size="small"
                      />
                      <button
                        type="button"
                        onClick={() => setExpandedScheduleId(expandedScheduleId === sched.id ? null : sched.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 4,
                          cursor: "pointer",
                          color: colors.subtext,
                          display: "flex",
                          alignItems: "center"
                        }}
                      >
                        <Icons.ChevronDown size={10} style={{
                          transform: expandedScheduleId === sched.id ? "rotate(180deg)" : "none",
                          transition: "transform 0.2s"
                        }} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded edit area */}
                  {expandedScheduleId === sched.id && (
                    <div style={{
                      borderTop: `1px solid ${colors.border}`,
                      paddingTop: 10,
                      marginTop: 2,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10
                    }}>
                      {/* Name input */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: colors.label, textTransform: "uppercase", letterSpacing: "0.05em" }}>Schedule Name</span>
                        <input
                          type="text"
                          value={sched.name}
                          onChange={(e) => {
                            const nextSchedules = settings.focusSchedules.map(s =>
                              s.id === sched.id ? { ...s, name: e.target.value } : s
                            )
                            setSettings({ ...settings, focusSchedules: nextSchedules })
                          }}
                          style={{
                            background: colors.inputBg,
                            border: `1px solid ${colors.inputBorder}`,
                            color: colors.text,
                            borderRadius: 8,
                            padding: "6px 10px",
                            fontSize: 12,
                            outline: "none"
                          }}
                        />
                      </div>

                      {/* Start / End times */}
                      <div style={{ display: "flex", gap: 10 }}>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: colors.label, textTransform: "uppercase", letterSpacing: "0.05em" }}>Start Time</span>
                          <input
                            type="time"
                            value={sched.startTime}
                            onChange={(e) => {
                              const nextSchedules = settings.focusSchedules.map(s =>
                                s.id === sched.id ? { ...s, startTime: e.target.value } : s
                              )
                              setSettings({ ...settings, focusSchedules: nextSchedules })
                            }}
                            style={{
                              background: colors.inputBg,
                              border: `1px solid ${colors.inputBorder}`,
                              color: colors.text,
                              borderRadius: 8,
                              padding: "6px 8px",
                              fontSize: 12,
                              outline: "none",
                              width: "100%",
                              boxSizing: "border-box"
                            }}
                          />
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: colors.label, textTransform: "uppercase", letterSpacing: "0.05em" }}>End Time</span>
                          <input
                            type="time"
                            value={sched.endTime}
                            onChange={(e) => {
                              const nextSchedules = settings.focusSchedules.map(s =>
                                s.id === sched.id ? { ...s, endTime: e.target.value } : s
                              )
                              setSettings({ ...settings, focusSchedules: nextSchedules })
                            }}
                            style={{
                              background: colors.inputBg,
                              border: `1px solid ${colors.inputBorder}`,
                              color: colors.text,
                              borderRadius: 8,
                              padding: "6px 8px",
                              fontSize: 12,
                              outline: "none",
                              width: "100%",
                              boxSizing: "border-box"
                            }}
                          />
                        </div>
                      </div>

                      {/* Days row */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: colors.label, textTransform: "uppercase", letterSpacing: "0.05em" }}>Active Days</span>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
                          {["S", "M", "T", "W", "T", "F", "S"].map((dayName, idx) => {
                            const isDaySelected = sched.days.includes(idx)
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  let nextDays
                                  if (isDaySelected) {
                                    nextDays = sched.days.filter(d => d !== idx)
                                  } else {
                                    nextDays = [...sched.days, idx]
                                  }
                                  const nextSchedules = settings.focusSchedules.map(s =>
                                    s.id === sched.id ? { ...s, days: nextDays } : s
                                  )
                                  setSettings({ ...settings, focusSchedules: nextSchedules })
                                }}
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: "50%",
                                  border: isDaySelected ? "none" : `1px solid ${colors.inputBorder}`,
                                  background: isDaySelected ? "#cc0000" : "transparent",
                                  color: isDaySelected ? "#ffffff" : colors.text,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transition: "all 0.15s"
                                }}
                              >
                                {dayName}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Edit control buttons */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => {
                            const nextSchedules = settings.focusSchedules.filter(s => s.id !== sched.id)
                            setSettings({ ...settings, focusSchedules: nextSchedules })
                            setExpandedScheduleId(null)
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            padding: "4px 8px",
                            borderRadius: 6,
                            transition: "background-color 0.15s"
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.08)"; }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                        >
                          🗑️ Delete Schedule
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedScheduleId(null)}
                          style={{
                            background: isDark ? "#2a2a2a" : "#f3f4f6",
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            padding: "4px 10px",
                            borderRadius: 6
                          }}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add schedule button */}
              <button
                type="button"
                onClick={() => {
                  const newId = "sched-" + Date.now()
                  const newSched = {
                    id: newId,
                    name: "Focus Hours",
                    enabled: true,
                    startTime: "09:00",
                    endTime: "17:00",
                    days: [1, 2, 3, 4, 5]
                  }
                  const nextSchedules = [...(settings.focusSchedules || []), newSched]
                  setSettings({ ...settings, focusSchedules: nextSchedules })
                  setExpandedScheduleId(newId)
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  width: "100%",
                  padding: "10px",
                  borderRadius: 12,
                  border: `1px dashed ${colors.border}`,
                  background: "transparent",
                  color: colors.text,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background-color 0.15s, border-color 0.15s",
                  marginTop: 4
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor = colors.text; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = colors.border; }}
              >
                <Icons.Plus /> Add Focus Schedule
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
