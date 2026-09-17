import { useState, useEffect } from "react"
import { useSettings } from "~/hooks/useSettings"
import { type Settings, defaultSettings } from "~/lib/settings"
import type { ThemeColors } from "~/lib/theme"
import { Icons } from "../ui/Icons"
import { CustomToggle } from "../ui/CustomToggle"
import { WaveRangeSlider } from "../ui/WaveRangeSlider"
import { formatTimeStr } from "~/lib/utils"

export function MainDashboard({ colors, isDark }: { colors: ThemeColors; isDark: boolean }) {
  const { settings, toggleSetting, setSettings } = useSettings()
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null)

  const isGeneralOpen = settings?.isGeneralCategoryOpen ?? true
  const isSearchOpen = settings?.isSearchCategoryOpen ?? true
  const isAudioOpen = settings?.isAudioCategoryOpen ?? false
  const isFocusOpen = settings?.isFocusCategoryOpen ?? false

  const savedVolume = settings?.audioVolumeBoost ?? defaultSettings.audioVolumeBoost
  const [draftVolume, setDraftVolume] = useState(savedVolume)
  const [volumeSaveState, setVolumeSaveState] = useState<"idle" | "saved">("idle")
  const [lastSavedVolume, setLastSavedVolume] = useState(savedVolume)

  useEffect(() => {
    setDraftVolume(savedVolume)
  }, [savedVolume])

  const isVolumeDirty = draftVolume !== savedVolume

  useEffect(() => {
    if (!isVolumeDirty) return
    const timer = window.setTimeout(() => {
      setSettings({ audioVolumeBoost: draftVolume })
      setLastSavedVolume(draftVolume)
      setVolumeSaveState("saved")
      window.setTimeout(() => setVolumeSaveState("idle"), 2200)
    }, 2500)
    return () => window.clearTimeout(timer)
  }, [draftVolume, isVolumeDirty, setSettings])

  const saveVolume = () => {
    if (!isVolumeDirty) return
    setSettings({ ...(settings || defaultSettings), audioVolumeBoost: draftVolume })
    setLastSavedVolume(draftVolume)
    setVolumeSaveState("saved")
    window.setTimeout(() => setVolumeSaveState("idle"), 2200)
  }

  const GENERAL_ITEMS = [
    { key: "hideShorts" as const, label: "Hide Shorts", icon: <Icons.Shorts /> },
    { key: "hideHomepageRecommendations" as const, label: "Hide Homepage Recommendations", icon: <Icons.Home /> },
    { key: "hideVideoSidebarRecommendations" as const, label: "Hide Video Sidebar Recommendations", icon: <Icons.Sidebar /> },
    { key: "hideComments" as const, label: "Hide Comments", icon: <Icons.Comments /> },
    { key: "hideEndScreen" as const, label: "Hide End Screen", icon: <Icons.EndScreen /> },
    { key: "hideLiveChat" as const, label: "Hide Live Chat", icon: <Icons.Chat /> },
    { key: "hidePlayables" as const, label: "Hide Playables", icon: <Icons.Gamepad /> }
  ]

  const SEARCH_ITEMS = [
    { key: "hidePeopleAlsoWatched" as const, label: "Hide 'People also watched'" },
    { key: "hidePeopleAlsoSearchFor" as const, label: "Hide 'People also search for'" },
    { key: "hideFromRelatedSearches" as const, label: "Hide 'From related searches'" },
    { key: "hideChannelsNewToYou" as const, label: "Hide 'Channels new to you'" },
    { key: "hideExploreMore" as const, label: "Hide 'Explore more'" }
  ]

  return (
    <>
      <style>{`
        .category-header {
          padding: 6px 2px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          user-select: none;
          border-radius: 4px;
          transition: background 0.1s ease;
        }
        .category-header:hover {
          background: ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"};
        }
        .setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 4px;
          border-radius: 6px;
          transition: background 0.1s ease;
        }
        .setting-row:hover {
          background: ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)"};
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* General Distractions Section */}
        <div>
          <div
            onClick={() => toggleSetting("isGeneralCategoryOpen")}
            className="category-header"
            style={{ marginTop: 2 }}>
            <Icons.CategoryToggle rotated={isGeneralOpen} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: isDark ? "#cccccc" : "#555555",
                flex: 1
              }}>
              General Distractions
            </span>
          </div>

          {isGeneralOpen && (
            <div style={{ paddingLeft: 18 }}>
              {GENERAL_ITEMS.map((item) => (
                <div key={item.key}>
                  <div className="setting-row">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, color: colors.text, fontSize: 13.5, fontWeight: 500 }}>
                      <div style={{ opacity: 0.85, display: "flex", alignItems: "center", width: 20, height: 20, justifyContent: "center" }}>
                        {item.icon}
                      </div>
                      <span>{item.label}</span>
                      {item.key === "hideHomepageRecommendations" && (
                        <Icons.Chevron rotated={!!settings?.hideHomepageRecommendations} />
                      )}
                    </div>
                    <CustomToggle
                      checked={!!settings?.[item.key]}
                      onChange={() => toggleSetting(item.key)}
                      isDark={isDark}
                      colors={colors}
                    />
                  </div>

                  {/* Sub-setting for Redirect to Subscriptions */}
                  {item.key === "hideHomepageRecommendations" && settings?.hideHomepageRecommendations && (
                    <div className="setting-row" style={{ paddingLeft: 30, marginTop: -2 }}>
                      <div style={{ color: colors.subtext, fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderLeft: `1.5px solid ${isDark ? "#555" : "#ccc"}`,
                            borderBottom: `1.5px solid ${isDark ? "#555" : "#ccc"}`,
                            marginBottom: 2
                          }}
                        />
                        Redirect to Subscriptions
                      </div>
                      <CustomToggle
                        checked={!!settings?.redirectToSubscriptions}
                        onChange={() => toggleSetting("redirectToSubscriptions")}
                        isDark={isDark}
                        colors={colors}
                        size="small"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search Refinements Section */}
        <div>
          <div
            onClick={() => toggleSetting("isSearchCategoryOpen")}
            className="category-header"
            style={{ marginTop: 2 }}>
            <Icons.CategoryToggle rotated={isSearchOpen} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: isDark ? "#cccccc" : "#555555",
                flex: 1
              }}>
              Search Refinements
            </span>
          </div>

          {isSearchOpen && (
            <div style={{ paddingLeft: 18 }}>
              {SEARCH_ITEMS.map((item) => (
                <div key={item.key} className="setting-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: colors.text, fontSize: 13.5, fontWeight: 500 }}>
                    <div style={{ opacity: 0.85, display: "flex", alignItems: "center", width: 20, height: 20, justifyContent: "center" }}>
                      <Icons.Search />
                    </div>
                    <span>{item.label}</span>
                  </div>
                  <CustomToggle
                    checked={!!settings?.[item.key]}
                    onChange={() => toggleSetting(item.key)}
                    isDark={isDark}
                    colors={colors}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audio Boost Section (Collapsible) */}
        <div>
          <div
            onClick={() => toggleSetting("isAudioCategoryOpen")}
            className="category-header"
            style={{ marginTop: 2 }}>
            <Icons.CategoryToggle rotated={isAudioOpen} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: isDark ? "#cccccc" : "#555555",
                flex: 1
              }}>
              Audio Enhancements
            </span>
          </div>

          {isAudioOpen && (
            <div style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
              <div className="setting-row">
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: colors.text, fontSize: 13.5, fontWeight: 500 }}>
                  <div style={{ opacity: 0.85, display: "flex", alignItems: "center", width: 20, height: 20, justifyContent: "center" }}>
                    <Icons.Mic />
                  </div>
                  <span>Vocal Boost (Clear Speech)</span>
                </div>
                <CustomToggle
                  checked={!!settings?.audioVocalBoost}
                  onChange={() => toggleSetting("audioVocalBoost")}
                  isDark={isDark}
                  colors={colors}
                />
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: colors.tabBg,
                  border: `1px solid ${colors.border}`,
                  marginTop: 4
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icons.Volume />
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.text }}>Volume Booster</span>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: draftVolume > 100 ? colors.accent : colors.subtext
                    }}>
                    {draftVolume}%{isVolumeDirty ? " *" : ""}
                  </span>
                </div>
                <WaveRangeSlider
                  min={100}
                  max={300}
                  step={10}
                  value={draftVolume}
                  onChange={setDraftVolume}
                  colors={colors}
                  isDark={isDark}
                />
                {isVolumeDirty && volumeSaveState !== "saved" && (
                  <div style={{ fontSize: 11, color: colors.accent, fontWeight: 500, marginTop: 8 }}>
                    Unsaved — automatically saves in 2s
                  </div>
                )}
                {volumeSaveState === "saved" && (
                  <div
                    style={{
                      fontSize: 11,
                      color: colors.success,
                      fontWeight: 600,
                      marginTop: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                    <Icons.Check size={11} color={colors.success} />
                    Volume saved at {lastSavedVolume}%
                  </div>
                )}
                <button
                  type="button"
                  onClick={saveVolume}
                  disabled={!isVolumeDirty && volumeSaveState !== "saved"}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    padding: "8px 0",
                    background: volumeSaveState === "saved" ? colors.success : isVolumeDirty ? colors.accent : colors.tabBg,
                    color: volumeSaveState === "saved" || isVolumeDirty ? "#fff" : colors.muted,
                    border: `1px solid ${isVolumeDirty || volumeSaveState === "saved" ? "transparent" : colors.border}`,
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: isVolumeDirty || volumeSaveState === "saved" ? "pointer" : "default"
                  }}>
                  {volumeSaveState === "saved" ? "Saved" : isVolumeDirty ? "Save volume" : "No changes"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Focus & Schedules Section (Collapsible) */}
        <div>
          <div
            onClick={() => toggleSetting("isFocusCategoryOpen")}
            className="category-header"
            style={{ marginTop: 2 }}>
            <Icons.CategoryToggle rotated={isFocusOpen} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: isDark ? "#cccccc" : "#555555",
                flex: 1
              }}>
              Focus & Mindfulness
            </span>
          </div>

          {isFocusOpen && (
            <div style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
              <div className="setting-row">
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: colors.text, fontSize: 13.5, fontWeight: 500 }}>
                  <div style={{ opacity: 0.85, display: "flex", alignItems: "center", width: 20, height: 20, justifyContent: "center" }}>
                    <span style={{ fontSize: 14 }}>🧠</span>
                  </div>
                  <span>Friction Screen (Intentional Goal)</span>
                </div>
                <CustomToggle
                  checked={!!settings?.enableFrictionScreen}
                  onChange={() => toggleSetting("enableFrictionScreen")}
                  isDark={isDark}
                  colors={colors}
                />
              </div>

              <div className="setting-row">
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: colors.text, fontSize: 13.5, fontWeight: 500 }}>
                  <div style={{ opacity: 0.85, display: "flex", alignItems: "center", width: 20, height: 20, justifyContent: "center" }}>
                    <Icons.Moon />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span>Bedtime & Focus Blocker</span>
                    <span style={{ fontSize: 11, color: colors.muted, fontWeight: 400 }}>
                      Block YouTube during scheduled hours
                    </span>
                  </div>
                </div>
                <CustomToggle
                  checked={!!settings?.enableFocusBlocker}
                  onChange={() => toggleSetting("enableFocusBlocker")}
                  isDark={isDark}
                  colors={colors}
                />
              </div>

              {settings && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Schedules
                    </span>
                    {!settings.enableFocusBlocker && (
                      <span style={{ fontSize: 10.5, color: colors.muted, fontStyle: "italic" }}>
                        (Toggle ON above to activate)
                      </span>
                    )}
                  </div>

                  {(settings.focusSchedules || []).map((sched) => {
                    const isExpanded = expandedScheduleId === sched.id
                    const spansMidnight = sched.startTime && sched.endTime && sched.startTime > sched.endTime
                    const dayLabels = ["S", "M", "T", "W", "T", "F", "S"]
                    const fullDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

                    const formatDaysText = (days: number[]) => {
                      if (!days || days.length === 0) return "No days"
                      if (days.length === 7) return "Everyday"
                      if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return "Weekdays"
                      if (days.length === 2 && [0, 6].every((d) => days.includes(d))) return "Weekends"
                      return [...days].sort((a, b) => a - b).map((d) => fullDayNames[d]).join(", ")
                    }

                    return (
                      <div
                        key={sched.id}
                        style={{
                          background: colors.tabBg,
                          border: `1px solid ${isExpanded ? colors.accent : colors.border}`,
                          borderRadius: 10,
                          padding: "10px 12px",
                          transition: "border-color 0.15s ease",
                          boxShadow: isExpanded ? `0 0 0 1px ${colors.accent}` : "none"
                        }}>
                        {/* Schedule Header Row */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <div
                            onClick={() => setExpandedScheduleId(isExpanded ? null : sched.id)}
                            style={{ flex: 1, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                            <div style={{
                              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                              transition: "transform 0.15s ease",
                              display: "flex",
                              alignItems: "center",
                              color: colors.subtext,
                              flexShrink: 0
                            }}>
                              <Icons.Chevron rotated={false} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {sched.name || "Focus Schedule"}
                                </span>
                                {spansMidnight && (
                                  <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: isDark ? "rgba(244,63,94,0.15)" : "rgba(225,29,72,0.1)", color: isDark ? "#f43f5e" : "#e11d48", fontWeight: 600, flexShrink: 0 }}>
                                    🌙 Overnight
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                                {formatDaysText(sched.days)} · {formatTimeStr(sched.startTime)} – {formatTimeStr(sched.endTime)}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => setExpandedScheduleId(isExpanded ? null : sched.id)}
                              style={{
                                background: isExpanded ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)") : "none",
                                border: `1px solid ${isExpanded ? colors.border : "transparent"}`,
                                padding: "4px 8px",
                                fontSize: 11,
                                fontWeight: 600,
                                color: isExpanded ? colors.text : colors.accent,
                                cursor: "pointer",
                                borderRadius: 6
                              }}>
                              {isExpanded ? "Done" : "Edit"}
                            </button>
                            <CustomToggle
                              checked={sched.enabled}
                              onChange={() => {
                                const nextSchedules = (settings.focusSchedules || []).map((s) =>
                                  s.id === sched.id ? { ...s, enabled: !s.enabled } : s
                                )
                                setSettings({ ...settings, focusSchedules: nextSchedules })
                              }}
                              isDark={isDark}
                              colors={colors}
                              size="small"
                            />
                          </div>
                        </div>

                        {/* Expanded Editor Form */}
                        {isExpanded && (
                          <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: 10, paddingTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                            {/* Schedule Name */}
                            <div>
                              <label style={{ fontSize: 11, fontWeight: 600, color: colors.subtext, display: "block", marginBottom: 4 }}>
                                Schedule Name
                              </label>
                              <input
                                type="text"
                                value={sched.name}
                                onChange={(e) => {
                                  const nextSchedules = (settings.focusSchedules || []).map((s) =>
                                    s.id === sched.id ? { ...s, name: e.target.value } : s
                                  )
                                  setSettings({ ...settings, focusSchedules: nextSchedules })
                                }}
                                placeholder="e.g. Bedtime Blocker, Study Mode"
                                style={{
                                  width: "100%",
                                  background: colors.cardBg,
                                  border: `1px solid ${colors.border}`,
                                  color: colors.text,
                                  borderRadius: 6,
                                  padding: "7px 10px",
                                  fontSize: 12.5,
                                  outline: "none"
                                }}
                              />
                            </div>

                            {/* Time Window */}
                            <div>
                              <label style={{ fontSize: 11, fontWeight: 600, color: colors.subtext, display: "block", marginBottom: 4 }}>
                                Active Time Window
                              </label>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ flex: 1 }}>
                                  <span style={{ fontSize: 10, color: colors.muted, display: "block", marginBottom: 2 }}>From</span>
                                  <input
                                    type="time"
                                    value={sched.startTime}
                                    onChange={(e) => {
                                      const nextSchedules = (settings.focusSchedules || []).map((s) =>
                                        s.id === sched.id ? { ...s, startTime: e.target.value } : s
                                      )
                                      setSettings({ ...settings, focusSchedules: nextSchedules })
                                    }}
                                    style={{
                                      width: "100%",
                                      background: colors.cardBg,
                                      border: `1px solid ${colors.border}`,
                                      color: colors.text,
                                      borderRadius: 6,
                                      padding: "6px 8px",
                                      fontSize: 12.5,
                                      outline: "none"
                                    }}
                                  />
                                </div>
                                <span style={{ color: colors.muted, paddingTop: 14 }}>→</span>
                                <div style={{ flex: 1 }}>
                                  <span style={{ fontSize: 10, color: colors.muted, display: "block", marginBottom: 2 }}>To</span>
                                  <input
                                    type="time"
                                    value={sched.endTime}
                                    onChange={(e) => {
                                      const nextSchedules = (settings.focusSchedules || []).map((s) =>
                                        s.id === sched.id ? { ...s, endTime: e.target.value } : s
                                      )
                                      setSettings({ ...settings, focusSchedules: nextSchedules })
                                    }}
                                    style={{
                                      width: "100%",
                                      background: colors.cardBg,
                                      border: `1px solid ${colors.border}`,
                                      color: colors.text,
                                      borderRadius: 6,
                                      padding: "6px 8px",
                                      fontSize: 12.5,
                                      outline: "none"
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Active Days */}
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                <label style={{ fontSize: 11, fontWeight: 600, color: colors.subtext }}>
                                  Active Days
                                </label>
                                <div style={{ display: "flex", gap: 6, fontSize: 10.5 }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextSchedules = (settings.focusSchedules || []).map((s) =>
                                        s.id === sched.id ? { ...s, days: [0, 1, 2, 3, 4, 5, 6] } : s
                                      )
                                      setSettings({ ...settings, focusSchedules: nextSchedules })
                                    }}
                                    style={{ background: "none", border: "none", color: colors.accent, cursor: "pointer", padding: 0 }}>
                                    All
                                  </button>
                                  <span style={{ color: colors.border }}>·</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextSchedules = (settings.focusSchedules || []).map((s) =>
                                        s.id === sched.id ? { ...s, days: [1, 2, 3, 4, 5] } : s
                                      )
                                      setSettings({ ...settings, focusSchedules: nextSchedules })
                                    }}
                                    style={{ background: "none", border: "none", color: colors.accent, cursor: "pointer", padding: 0 }}>
                                    Weekdays
                                  </button>
                                  <span style={{ color: colors.border }}>·</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextSchedules = (settings.focusSchedules || []).map((s) =>
                                        s.id === sched.id ? { ...s, days: [0, 6] } : s
                                      )
                                      setSettings({ ...settings, focusSchedules: nextSchedules })
                                    }}
                                    style={{ background: "none", border: "none", color: colors.accent, cursor: "pointer", padding: 0 }}>
                                    Weekends
                                  </button>
                                </div>
                              </div>

                              <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
                                {dayLabels.map((label, dayIdx) => {
                                  const isDayActive = sched.days.includes(dayIdx)
                                  return (
                                    <button
                                      key={dayIdx}
                                      type="button"
                                      title={fullDayNames[dayIdx]}
                                      onClick={() => {
                                        const nextDays = isDayActive
                                          ? sched.days.filter((d) => d !== dayIdx)
                                          : [...sched.days, dayIdx]
                                        const nextSchedules = (settings.focusSchedules || []).map((s) =>
                                          s.id === sched.id ? { ...s, days: nextDays } : s
                                        )
                                        setSettings({ ...settings, focusSchedules: nextSchedules })
                                      }}
                                      style={{
                                        flex: 1,
                                        height: 28,
                                        borderRadius: 6,
                                        border: isDayActive ? "none" : `1px solid ${colors.border}`,
                                        background: isDayActive ? colors.accent : "transparent",
                                        color: isDayActive ? "#ffffff" : colors.subtext,
                                        fontSize: 11,
                                        fontWeight: isDayActive ? 700 : 500,
                                        cursor: "pointer",
                                        transition: "all 0.15s ease"
                                      }}>
                                      {label}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Delete Button */}
                            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextSchedules = (settings.focusSchedules || []).filter((s) => s.id !== sched.id)
                                  setSettings({ ...settings, focusSchedules: nextSchedules })
                                  setExpandedScheduleId(null)
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: colors.danger,
                                  fontSize: 11.5,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  padding: "4px 6px"
                                }}>
                                Delete Schedule
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Add Schedule Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const newId = `sched-${Date.now()}`
                      const newSched = {
                        id: newId,
                        name: "Focus Hours",
                        enabled: true,
                        startTime: "09:00",
                        endTime: "17:00",
                        days: [1, 2, 3, 4, 5]
                      }
                      setSettings({
                        ...settings,
                        focusSchedules: [...(settings.focusSchedules || []), newSched]
                      })
                      setExpandedScheduleId(newId)
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1px dashed ${colors.border}`,
                      background: "transparent",
                      color: colors.subtext,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      marginTop: 2,
                      transition: "all 0.15s ease"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = colors.accent
                      e.currentTarget.style.color = colors.accent
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = colors.border
                      e.currentTarget.style.color = colors.subtext
                    }}>
                    + Add Focus Schedule
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
