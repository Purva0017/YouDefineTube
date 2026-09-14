import { useState, useEffect } from "react"
import { useSettings } from "~/hooks/useSettings"
import { type Settings, defaultSettings } from "~/lib/settings"
import type { ThemeColors } from "~/lib/theme"
import { Icons } from "../ui/Icons"
import { CustomToggle } from "../ui/CustomToggle"
import { WaveRangeSlider } from "../ui/WaveRangeSlider"

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
                  <span>Bedtime & Focus Blocker</span>
                </div>
                <CustomToggle
                  checked={!!settings?.enableFocusBlocker}
                  onChange={() => toggleSetting("enableFocusBlocker")}
                  isDark={isDark}
                  colors={colors}
                />
              </div>

              {settings?.enableFocusBlocker && settings && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                  {settings.focusSchedules?.map((sched) => (
                    <div
                      key={sched.id}
                      style={{
                        background: colors.tabBg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 8,
                        padding: 10
                      }}>
                      <div
                        onClick={() => setExpandedScheduleId(expandedScheduleId === sched.id ? null : sched.id)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
                          {sched.name} ({sched.startTime} - {sched.endTime})
                        </div>
                        <CustomToggle
                          checked={sched.enabled}
                          onChange={() => {
                            const nextSchedules = settings.focusSchedules.map((s) =>
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
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
