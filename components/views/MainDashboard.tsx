import { useState, useEffect, type ReactNode } from "react"
import { useSettings } from "~/hooks/useSettings"
import { type Settings, defaultSettings } from "~/lib/settings"
import type { ThemeColors } from "~/lib/theme"
import { Icons } from "../ui/Icons"
import { CustomToggle } from "../ui/CustomToggle"
import { BlockSection } from "../ui/BlockSection"
import { MasonryGrid } from "../ui/MasonryGrid"
import { MasonryTile, type MasonryTileSize } from "../ui/MasonryTile"
import { WaveRangeSlider } from "../ui/WaveRangeSlider"
import { formatTimeStr } from "~/lib/utils"

type BlockKey = keyof Settings

type BlockDef = {
  key: BlockKey
  label: string
  description: string
  icon: ReactNode
  size?: MasonryTileSize
}

const DISTRACTION_BLOCKS: BlockDef[] = [
  { key: "hideShorts", label: "Shorts", description: "Remove Shorts shelf & tab", icon: <Icons.Shorts />, size: "lg" },
  {
    key: "hideHomepageRecommendations",
    label: "Home Feed",
    description: "Hide recommended videos",
    icon: <Icons.Home />,
    size: "lg"
  },
  { key: "hideVideoSidebarRecommendations", label: "Sidebar", description: "Hide suggested videos", icon: <Icons.Sidebar />, size: "md" },
  { key: "hideComments", label: "Comments", description: "Hide comment section", icon: <Icons.Comments />, size: "sm" },
  { key: "hideEndScreen", label: "End Cards", description: "Block end-screen clutter", icon: <Icons.EndScreen />, size: "lg" },
  { key: "hidePlayables", label: "Playables", description: "Hide mini-games", icon: <Icons.Gamepad />, size: "sm" },
  { key: "hideLiveChat", label: "Live Chat", description: "Hide stream chat", icon: <Icons.Chat />, size: "md" }
]

const SEARCH_BLOCKS: BlockDef[] = [
  { key: "gridSearchMode", label: "Grid Layout", description: "Compact search results", icon: <Icons.Grid />, size: "lg" },
  { key: "hidePeopleAlsoWatched", label: "People Watched", description: "Remove watched shelf", icon: <Icons.Search />, size: "md" },
  { key: "hideExploreMore", label: "Explore More", description: "Hide explore rows", icon: <Icons.Search />, size: "lg" },
  { key: "hidePeopleAlsoSearchFor", label: "Also Search", description: "Hide search suggestions", icon: <Icons.Search />, size: "sm" },
  { key: "hideFromRelatedSearches", label: "Related", description: "Hide related searches", icon: <Icons.Search />, size: "sm" },
  { key: "hideChannelsNewToYou", label: "New Channels", description: "Hide channel promos", icon: <Icons.Search />, size: "md" }
]

const PRESETS: {
  id: string
  label: string
  description: string
  patch: Partial<Settings>
}[] = [
  {
    id: "focus",
    label: "Focus",
    description: "Block feeds & distractions",
    patch: {
      hideShorts: true,
      hideHomepageRecommendations: true,
      hideVideoSidebarRecommendations: true,
      hideComments: true,
      hideEndScreen: true,
      hidePlayables: true,
      enableFrictionScreen: true
    }
  },
  {
    id: "clean",
    label: "Clean Feed",
    description: "Tame homepage & sidebar",
    patch: {
      hideShorts: true,
      hideHomepageRecommendations: true,
      hideVideoSidebarRecommendations: true,
      hideEndScreen: true
    }
  },
  {
    id: "search",
    label: "Clean Search",
    description: "Strip search clutter",
    patch: {
      gridSearchMode: true,
      hidePeopleAlsoWatched: true,
      hidePeopleAlsoSearchFor: true,
      hideFromRelatedSearches: true,
      hideChannelsNewToYou: true,
      hideExploreMore: true
    }
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Reset block settings",
    patch: {
      hideShorts: defaultSettings.hideShorts,
      hideHomepageRecommendations: false,
      redirectToSubscriptions: false,
      hideVideoSidebarRecommendations: false,
      hideComments: false,
      hideEndScreen: defaultSettings.hideEndScreen,
      hideLiveChat: false,
      hidePlayables: false,
      hidePeopleAlsoWatched: false,
      hidePeopleAlsoSearchFor: false,
      hideFromRelatedSearches: false,
      hideChannelsNewToYou: false,
      hideExploreMore: false,
      gridSearchMode: false,
      audioVocalBoost: false,
      audioVolumeBoost: 100,
      enableFrictionScreen: false,
      enableFocusBlocker: false
    }
  }
]

function countActive(keys: BlockKey[], settings: Settings | null): number {
  return keys.filter((key) => !!settings?.[key]).length
}

function renderSchedulePanel({
  settings,
  setSettings,
  expandedScheduleId,
  setExpandedScheduleId,
  colors,
  isDark
}: {
  settings: Settings
  setSettings: (s: Settings) => void
  expandedScheduleId: string | null
  setExpandedScheduleId: (id: string | null) => void
  colors: ThemeColors
  isDark: boolean
}) {
  const formatScheduleDays = (days: number[]) => {
    if (!days || days.length === 0) return "No days"
    if (days.length === 7) return "Everyday"
    if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return "Weekdays"
    if (days.length === 2 && [0, 6].every((d) => days.includes(d))) return "Weekends"
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    return [...days].sort((a, b) => a - b).map((d) => dayNames[d]).join(", ")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {(settings.focusSchedules || []).map((sched) => (
        <div
          key={sched.id}
          style={{
            background: colors.tabBg,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            padding: "12px 14px"
          }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <button
              type="button"
              onClick={() => setExpandedScheduleId(expandedScheduleId === sched.id ? null : sched.id)}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                textAlign: "left",
                color: colors.text
              }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{sched.name}</div>
              <div style={{ fontSize: 12, color: colors.muted, marginTop: 3 }}>
                {formatScheduleDays(sched.days)} · {formatTimeStr(sched.startTime)} – {formatTimeStr(sched.endTime)}
              </div>
            </button>
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

          {expandedScheduleId === sched.id && (
            <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: 12, paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                type="text"
                value={sched.name}
                onChange={(e) => {
                  const nextSchedules = settings.focusSchedules.map((s) =>
                    s.id === sched.id ? { ...s, name: e.target.value } : s
                  )
                  setSettings({ ...settings, focusSchedules: nextSchedules })
                }}
                placeholder="Schedule name"
                style={{
                  background: colors.inputBg,
                  border: `1px solid ${colors.inputBorder}`,
                  color: colors.text,
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 13,
                  outline: "none"
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="time"
                  value={sched.startTime}
                  onChange={(e) => {
                    const nextSchedules = settings.focusSchedules.map((s) =>
                      s.id === sched.id ? { ...s, startTime: e.target.value } : s
                    )
                    setSettings({ ...settings, focusSchedules: nextSchedules })
                  }}
                  style={{ flex: 1, background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, borderRadius: 8, padding: "8px 10px", fontSize: 13 }}
                />
                <input
                  type="time"
                  value={sched.endTime}
                  onChange={(e) => {
                    const nextSchedules = settings.focusSchedules.map((s) =>
                      s.id === sched.id ? { ...s, endTime: e.target.value } : s
                    )
                    setSettings({ ...settings, focusSchedules: nextSchedules })
                  }}
                  style={{ flex: 1, background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.text, borderRadius: 8, padding: "8px 10px", fontSize: 13 }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
                {["S", "M", "T", "W", "T", "F", "S"].map((dayName, idx) => {
                  const selected = sched.days.includes(idx)
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const nextDays = selected ? sched.days.filter((d) => d !== idx) : [...sched.days, idx]
                        const nextSchedules = settings.focusSchedules.map((s) =>
                          s.id === sched.id ? { ...s, days: nextDays } : s
                        )
                        setSettings({ ...settings, focusSchedules: nextSchedules })
                      }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: selected ? "none" : `1px solid ${colors.inputBorder}`,
                        background: selected ? colors.accent : "transparent",
                        color: selected ? "#fff" : colors.text,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}>
                      {dayName}
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSettings({ ...settings, focusSchedules: settings.focusSchedules.filter((s) => s.id !== sched.id) })
                  setExpandedScheduleId(null)
                }}
                style={{ background: "none", border: "none", color: colors.danger, fontSize: 12, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start", padding: 0 }}>
                Delete schedule
              </button>
            </div>
          )}
        </div>
      ))}
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
          setSettings({ ...settings, focusSchedules: [...(settings.focusSchedules || []), newSched] })
          setExpandedScheduleId(newId)
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: 12,
          borderRadius: 8,
          border: `1px dashed ${colors.border}`,
          background: "transparent",
          color: colors.subtext,
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          transition: "color 0.15s ease"
        }}>
        <Icons.Plus /> Add schedule
      </button>
    </div>
  )
}

export function MainDashboard({ colors, isDark }: { colors: ThemeColors; isDark: boolean }) {
  const { settings, toggleSetting, setSettings } = useSettings()
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [presetSnapshots, setPresetSnapshots] = useState<Record<string, Partial<Settings>>>({})

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

  const handleToggleSetting = (key: keyof Settings) => {
    setActivePreset(null)
    toggleSetting(key)
  }

  const distractionKeys = DISTRACTION_BLOCKS.map((b) => b.key)
  const searchKeys = SEARCH_BLOCKS.map((b) => b.key)

  const togglePreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId)
    if (!preset) return

    let current: Settings = { ...(settings || defaultSettings) }

    if (activePreset === presetId) {
      const snapshot = presetSnapshots[presetId]
      if (snapshot) {
        setSettings({ ...current, ...snapshot })
      }
      setActivePreset(null)
      return
    }

    if (activePreset) {
      const previousSnapshot = presetSnapshots[activePreset]
      if (previousSnapshot) {
        current = { ...current, ...previousSnapshot }
      }
    }

    const snapshot: Partial<Settings> = {}
    for (const key of Object.keys(preset.patch) as (keyof Settings)[]) {
      snapshot[key] = current[key]
    }

    setPresetSnapshots((prev) => ({ ...prev, [presetId]: snapshot }))
    setActivePreset(presetId)
    setSettings({ ...current, ...preset.patch })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: colors.muted, letterSpacing: "0.04em", marginBottom: 10 }}>
          Quick presets
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {PRESETS.map((preset) => {
            const isActive = activePreset === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => togglePreset(preset.id)}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1px solid ${isActive ? colors.accent : colors.border}`,
                  background: isActive ? colors.accentSoft : colors.cardBg,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  boxShadow: isActive ? "none" : colors.shadowSm
                }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{preset.label}</div>
                <div style={{ fontSize: 12, color: colors.muted, marginTop: 3 }}>{preset.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      <BlockSection
        title="Distraction Shields"
        subtitle="Tap a tile to block that part of YouTube"
        activeCount={countActive(distractionKeys, settings)}
        totalCount={distractionKeys.length}
        colors={colors}>
        <MasonryGrid>
          {DISTRACTION_BLOCKS.map((block) => {
            const isHomeFeed = block.key === "hideHomepageRecommendations"
            const homeFeedActive = !!settings?.hideHomepageRecommendations

            return (
              <MasonryTile
                key={block.key}
                label={block.label}
                description={block.description}
                icon={block.icon}
                active={!!settings?.[block.key]}
                onClick={() => handleToggleSetting(block.key)}
                colors={colors}
                isDark={isDark}
                variant="shield"
                size={block.size}
                expanded={homeFeedActive}
                expandHeight={96}
                embeddedExpand={
                  isHomeFeed ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        width: "100%"
                      }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: colors.text, lineHeight: 1.3 }}>
                          Redirect to Subscriptions
                        </div>
                        <div style={{ fontSize: 11, color: colors.muted, marginTop: 3, lineHeight: 1.35 }}>
                          Open Subscriptions instead of home
                        </div>
                      </div>
                      <CustomToggle
                        checked={!!settings?.redirectToSubscriptions}
                        onChange={() => handleToggleSetting("redirectToSubscriptions")}
                        isDark={isDark}
                        colors={colors}
                        size="small"
                      />
                    </div>
                  ) : undefined
                }
              />
            )
          })}
        </MasonryGrid>
      </BlockSection>

      <div
        style={{
          background: isDark
            ? "linear-gradient(160deg, rgba(42,36,68,0.45) 0%, rgba(28,28,32,0.95) 100%)"
            : "linear-gradient(160deg, rgba(230,224,255,0.55) 0%, #ffffff 100%)",
          border: `1px solid ${isDark ? "rgba(139,164,255,0.2)" : "rgba(90,110,200,0.18)"}`,
          borderRadius: 12,
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          boxShadow: colors.shadowSm
        }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>Search Cleanup</div>
            <div style={{ fontSize: 13, color: colors.muted, marginTop: 3 }}>Strip shelves and clutter from results</div>
          </div>
          <div
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              background: countActive(searchKeys, settings) > 0 ? "rgba(107,138,253,0.18)" : colors.tabBg,
              fontSize: 12,
              fontWeight: 600,
              color: countActive(searchKeys, settings) > 0 ? (isDark ? "#8ba4ff" : "#4f6fe8") : colors.muted,
              flexShrink: 0
            }}>
            {countActive(searchKeys, settings)}/{searchKeys.length}
          </div>
        </div>
        <MasonryGrid>
          {SEARCH_BLOCKS.map((block) => (
            <MasonryTile
              key={block.key}
              label={block.label}
              description={block.description}
              icon={block.icon}
              active={!!settings?.[block.key]}
              onClick={() => handleToggleSetting(block.key)}
              colors={colors}
              isDark={isDark}
              variant="search"
              size={block.size}
            />
          ))}
        </MasonryGrid>
      </div>

      <BlockSection
        title="Audio Boost"
        subtitle="Enhance speech and volume"
        activeCount={(settings?.audioVocalBoost ? 1 : 0) + (settings?.audioVolumeBoost && settings.audioVolumeBoost > 100 ? 1 : 0)}
        totalCount={2}
        colors={colors}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderRadius: 10,
            background: colors.tabBg,
            border: `1px solid ${colors.border}`
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ color: colors.subtext, display: "flex" }}><Icons.Mic /></div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>Vocal Boost</div>
              <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Clearer voices & lectures</div>
            </div>
          </div>
          <CustomToggle
            checked={!!settings?.audioVocalBoost}
            onChange={() => handleToggleSetting("audioVocalBoost")}
            isDark={isDark}
            colors={colors}
            size="small"
          />
        </div>
        <div
          style={{
            padding: "14px",
            borderRadius: 12,
            background: colors.tabBg,
            border: `1px solid ${colors.border}`
          }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icons.Volume />
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>Volume Booster</span>
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: draftVolume > 100 ? colors.accent : colors.subtext
              }}>
              {draftVolume}%
              {isVolumeDirty ? " *" : ""}
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
            <div style={{ fontSize: 12, color: colors.accent, fontWeight: 500, marginTop: 10 }}>
              Unsaved — save to apply on YouTube
            </div>
          )}
          {volumeSaveState === "saved" && (
            <div
              style={{
                fontSize: 12,
                color: colors.success,
                fontWeight: 600,
                marginTop: 10,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
              <Icons.Check size={12} color={colors.success} />
              Volume saved at {lastSavedVolume}%
            </div>
          )}
          <button
            type="button"
            onClick={saveVolume}
            disabled={!isVolumeDirty && volumeSaveState !== "saved"}
            style={{
              width: "100%",
              marginTop: 12,
              padding: "10px 0",
              background: volumeSaveState === "saved" ? colors.success : isVolumeDirty ? colors.accent : colors.tabBg,
              color: volumeSaveState === "saved" || isVolumeDirty ? "#fff" : colors.muted,
              border: `1px solid ${isVolumeDirty || volumeSaveState === "saved" ? "transparent" : colors.border}`,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: isVolumeDirty || volumeSaveState === "saved" ? "pointer" : "default"
            }}>
            {volumeSaveState === "saved" ? "Saved" : isVolumeDirty ? "Save volume" : "No changes"}
          </button>
        </div>
      </BlockSection>

      <BlockSection
        title="Focus & Mindfulness"
        subtitle="Friction prompts and scheduled blocks"
        activeCount={(settings?.enableFrictionScreen ? 1 : 0) + (settings?.enableFocusBlocker ? 1 : 0)}
        totalCount={2}
        colors={colors}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          <MasonryTile
            label="Friction Screen"
            description="Ask your goal before watching"
            icon={<span style={{ fontSize: 16 }}>🧠</span>}
            active={!!settings?.enableFrictionScreen}
            onClick={() => handleToggleSetting("enableFrictionScreen")}
            colors={colors}
            isDark={isDark}
            size="md"
          />
          <MasonryTile
            label="Schedules"
            description="Block YouTube on a timer"
            icon={<Icons.Moon />}
            active={!!settings?.enableFocusBlocker}
            onClick={() => handleToggleSetting("enableFocusBlocker")}
            colors={colors}
            isDark={isDark}
            size="md"
          />
          {settings?.enableFocusBlocker && settings && (
            <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.muted, paddingLeft: 2 }}>
                Schedule settings
              </div>
              {renderSchedulePanel({
                settings,
                setSettings,
                expandedScheduleId,
                setExpandedScheduleId,
                colors,
                isDark
              })}
            </div>
          )}
        </div>
      </BlockSection>
    </div>
  )
}
