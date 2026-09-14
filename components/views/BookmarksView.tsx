import { useEffect, useState, useCallback, type ReactNode } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import { STORAGE_KEYS } from "~/lib/constants"
import { MESSAGES } from "~/lib/messaging"
import type { ThemeColors } from "~/lib/theme"
import { isExtensionContextValid, safeTabsCreate } from "~/lib/extension-runtime"
import { resolveYouTubeVideoTitle, stripYouTubeTabTitle } from "~/lib/youtube-title"
import { useSettings } from "~/hooks/useSettings"

export interface Bookmark {
  id: string
  timestamp: number
  note: string
  createdAt: number
  videoTitle: string
}

interface BookmarksViewProps {
  colors: ThemeColors
  isDark: boolean
  inline?: boolean
}

type YouTubePageKind =
  | "watch"
  | "shorts"
  | "home"
  | "subscriptions"
  | "search"
  | "channel"
  | "other-youtube"
  | "not-youtube"

export function getYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
      if (urlObj.pathname === "/watch") return urlObj.searchParams.get("v")
      if (urlObj.pathname.startsWith("/shorts/")) return urlObj.pathname.split("/")[2]
      if (urlObj.pathname.startsWith("/embed/")) return urlObj.pathname.split("/")[2]
      if (urlObj.pathname.startsWith("/v/")) return urlObj.pathname.split("/")[2]
    }
    if (urlObj.hostname === "youtu.be") return urlObj.pathname.substring(1)
  } catch {}
  return null
}

export function getYouTubePageKind(url: string): YouTubePageKind {
  try {
    const u = new URL(url)
    const onYt = u.hostname.includes("youtube.com") || u.hostname === "youtu.be"
    if (!onYt) return "not-youtube"
    if (getYouTubeVideoId(url)) return u.pathname.startsWith("/shorts") ? "shorts" : "watch"
    if (u.pathname === "/" || u.pathname === "/feed" || u.pathname === "") return "home"
    if (u.pathname.startsWith("/feed/subscriptions")) return "subscriptions"
    if (u.pathname === "/results" || u.searchParams.has("search_query")) return "search"
    if (u.pathname.startsWith("/@") || u.pathname.startsWith("/channel/") || u.pathname.startsWith("/c/"))
      return "channel"
    return "other-youtube"
  } catch {
    return "not-youtube"
  }
}

function formatTime(secs: number) {
  if (isNaN(secs) || secs < 0) return "00:00"
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  const mStr = m.toString().padStart(2, "0")
  const sStr = s.toString().padStart(2, "0")
  return h > 0 ? `${h}:${mStr}:${sStr}` : `${mStr}:${sStr}`
}

function SectionLabel({ children, colors, count }: { children: ReactNode; colors: ThemeColors; count?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: colors.muted,
          letterSpacing: "0.08em",
          textTransform: "uppercase"
        }}>
        {children}
      </span>
      {count !== undefined && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: colors.subtext,
            background: colors.tabBg,
            border: `1px solid ${colors.border}`,
            borderRadius: 999,
            padding: "1px 7px"
          }}>
          {count}
        </span>
      )}
    </div>
  )
}

function SearchInput({
  value,
  onChange,
  placeholder,
  colors
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  colors: ThemeColors
}) {
  return (
    <div style={{ position: "relative" }}>
      <svg
        style={{
          position: "absolute",
          left: 11,
          top: "50%",
          transform: "translateY(-50%)",
          color: colors.muted,
          pointerEvents: "none"
        }}
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px 10px 34px",
          background: colors.inputBg,
          border: `1px solid ${colors.inputBorder}`,
          borderRadius: 10,
          fontSize: 13,
          color: colors.text,
          outline: "none"
        }}
      />
    </div>
  )
}

function BookmarkRow({
  bookmark,
  colors,
  copiedId,
  onSeek,
  onCopy,
  onDelete
}: {
  bookmark: Bookmark
  colors: ThemeColors
  copiedId: string | null
  onSeek: () => void
  onCopy: () => void
  onDelete: () => void
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 10,
        alignItems: "start",
        padding: "11px 12px",
        background: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        borderLeft: `3px solid ${colors.accent}`
      }}>
      <button
        type="button"
        onClick={onSeek}
        title="Jump to timestamp"
        style={{
          background: colors.accentSoft,
          color: colors.accent,
          border: "none",
          borderRadius: 8,
          padding: "6px 10px",
          fontSize: 12,
          fontWeight: 700,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          cursor: "pointer"
        }}>
        {formatTime(bookmark.timestamp)}
      </button>
      <div style={{ fontSize: 13, color: colors.text, lineHeight: 1.5, wordBreak: "break-word", paddingTop: 2 }}>
        {bookmark.note || (
          <span style={{ color: colors.muted, fontStyle: "italic" }}>Note at {formatTime(bookmark.timestamp)}</span>
        )}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <IconBtn
          colors={colors}
          active={copiedId === bookmark.id}
          activeColor={colors.success}
          onClick={onCopy}
          title="Copy link">
          {copiedId === bookmark.id ? "✓" : "⎘"}
        </IconBtn>
        <IconBtn colors={colors} onClick={onDelete} title="Delete" hoverColor={colors.danger}>
          ×
        </IconBtn>
      </div>
    </div>
  )
}

function IconBtn({
  children,
  onClick,
  title,
  colors,
  active,
  activeColor,
  hoverColor
}: {
  children: ReactNode
  onClick: () => void
  title: string
  colors: ThemeColors
  active?: boolean
  activeColor?: string
  hoverColor?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        width: 30,
        height: 30,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        background: colors.tabBg,
        color: active ? activeColor : colors.muted,
        cursor: "pointer",
        fontSize: 14,
        lineHeight: 1
      }}
      onMouseEnter={(e) => {
        if (hoverColor) e.currentTarget.style.color = hoverColor
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = colors.muted
      }}>
      {children}
    </button>
  )
}

function NavChip({
  children,
  onClick,
  colors,
  accent
}: {
  children: ReactNode
  onClick: () => void
  colors: ThemeColors
  accent?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 13px",
        borderRadius: 10,
        border: `1px solid ${accent ? colors.accent : colors.border}`,
        background: accent ? colors.accentSoft : colors.tabBg,
        color: accent ? colors.accent : colors.text,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer"
      }}>
      {children}
    </button>
  )
}

function pageHint(kind: YouTubePageKind, homeFeedDisabled: boolean): { title: string; body: string } {
  switch (kind) {
    case "home":
      return homeFeedDisabled
        ? {
            title: "Home feed is hidden",
            body: "Jump to Subscriptions or History and open a video to save timestamped notes while you watch."
          }
        : {
            title: "Pick a video to bookmark",
            body: "You're on the YouTube home feed. Open any video to save timestamped notes while you watch."
          }
    case "subscriptions":
      return {
        title: "Open a video from Subscriptions",
        body: "Start a video from your feed, then add bookmarks at key moments from this panel."
      }
    case "search":
      return {
        title: "Open a video from search",
        body: "Select a result to watch, then bookmark timestamps and notes here."
      }
    case "channel":
      return {
        title: "Open a video on this channel",
        body: "Choose a video to watch — bookmarks unlock once playback starts."
      }
    case "shorts":
      return { title: "Shorts bookmarking", body: "This panel works best on regular watch pages. Your saved library is below." }
    default:
      return {
        title: "Open a video to start bookmarking",
        body: "Navigate to any YouTube watch page. Your saved notes from other videos stay in your library below."
      }
  }
}

export function BookmarksView({ colors, isDark, inline = false }: BookmarksViewProps) {
  const { settings } = useSettings()
  const homeFeedDisabled = !!settings?.hideHomepageRecommendations

  const [allBookmarks, setAllBookmarks] = useStorage<Record<string, Bookmark[]>>(STORAGE_KEYS.BOOKMARKS, {})
  const [activeTab, setActiveTab] = useState<{
    id: number
    url: string
    title: string
    videoId: string | null
  } | null>(null)
  const [currentTime, setCurrentTime] = useState<number | null>(null)
  const [noteText, setNoteText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [bookmarkSaveState, setBookmarkSaveState] = useState<"idle" | "saved">("idle")

  const refreshInlineTab = useCallback(() => {
    const videoId = getYouTubeVideoId(window.location.href)
    setActiveTab({
      id: 0,
      url: window.location.href,
      title: resolveYouTubeVideoTitle(document.title),
      videoId
    })
    setNoteText("")
    setBookmarkSaveState("idle")
  }, [])

  useEffect(() => {
    if (inline) {
      refreshInlineTab()
      document.addEventListener("yt-navigate-finish", refreshInlineTab)
      return () => document.removeEventListener("yt-navigate-finish", refreshInlineTab)
    }

    const checkActiveTab = async () => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        const tab = tabs[0]
        if (tab?.url) {
          setActiveTab({
            id: tab.id || 0,
            url: tab.url,
            title: stripYouTubeTabTitle(tab.title || "YouTube"),
            videoId: getYouTubeVideoId(tab.url)
          })
        }
      } catch (err) {
        console.error("Error querying active tab:", err)
      }
    }
    checkActiveTab()
  }, [inline, refreshInlineTab])

  useEffect(() => {
    if (!activeTab?.videoId) {
      setCurrentTime(null)
      return
    }

    if (inline) {
      const pollTime = () => {
        const video = document.querySelector<HTMLVideoElement>("video.html5-main-video, video")
        setCurrentTime(video && !isNaN(video.currentTime) ? video.currentTime : null)
        setActiveTab((prev) =>
          prev
            ? { ...prev, title: resolveYouTubeVideoTitle(document.title) }
            : prev
        )
      }
      pollTime()
      const interval = setInterval(pollTime, 1000)
      return () => clearInterval(interval)
    }

    if (!activeTab.id) return

    const pollTime = () => {
      if (!isExtensionContextValid()) return
      chrome.tabs.sendMessage(activeTab.id, { type: MESSAGES.GET_CURRENT_TIME }, (response) => {
        if (chrome.runtime.lastError) {
          setCurrentTime(null)
          return
        }
        if (response && typeof response.time === "number") setCurrentTime(response.time)
        else setCurrentTime(null)
        if (response?.title) {
          setActiveTab((prev) => (prev ? { ...prev, title: response.title } : prev))
        }
      })
    }
    pollTime()
    const interval = setInterval(pollTime, 1000)
    return () => clearInterval(interval)
  }, [activeTab?.videoId, activeTab?.id, inline])

  const handleSeek = (time: number) => {
    if (inline) {
      const video = document.querySelector<HTMLVideoElement>("video.html5-main-video, video")
      if (video) video.currentTime = time
      return
    }
    if (!activeTab?.id || !isExtensionContextValid()) return
    chrome.tabs.sendMessage(activeTab.id, { type: MESSAGES.SEEK_TO_TIME, payload: { time } })
  }

  const handleAddBookmark = () => {
    if (!activeTab?.videoId) return
    const timestamp = currentTime ?? 0
    const videoId = activeTab.videoId
    const newBookmark: Bookmark = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp,
      note: noteText.trim(),
      createdAt: Date.now(),
      videoTitle: activeTab.title
    }
    const updated = [...(allBookmarks[videoId] || []), newBookmark].sort((a, b) => a.timestamp - b.timestamp)
    setAllBookmarks({ ...allBookmarks, [videoId]: updated })
    setNoteText("")
    setBookmarkSaveState("saved")
    window.setTimeout(() => setBookmarkSaveState("idle"), 2200)
  }

  const handleDeleteBookmark = (vid: string, bookmarkId: string) => {
    const updated = (allBookmarks[vid] || []).filter((b) => b.id !== bookmarkId)
    const next = { ...allBookmarks }
    if (updated.length === 0) delete next[vid]
    else next[vid] = updated
    setAllBookmarks(next)
  }

  const handleCopyLink = (videoId: string, timestamp: number, bookmarkId: string) => {
    navigator.clipboard
      .writeText(`https://youtu.be/${videoId}?t=${Math.floor(timestamp)}`)
      .then(() => {
        setCopiedId(bookmarkId)
        setTimeout(() => setCopiedId(null), 1500)
      })
      .catch(console.error)
  }

  const handleOpenVideo = (videoId: string, timestamp = 0) => {
    const url = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(timestamp)}s`
    if (inline) window.location.href = url
    else safeTabsCreate(url)
  }

  const navigateInline = (path: string) => {
    if (inline) window.location.href = path
    else safeTabsCreate(`https://www.youtube.com${path}`)
  }

  const videoId = activeTab?.videoId
  const pageUrl = activeTab?.url || (inline ? window.location.href : "")
  const pageKind = pageUrl ? getYouTubePageKind(pageUrl) : "not-youtube"
  const onYouTube = pageKind !== "not-youtube"
  const videoBookmarks = videoId ? allBookmarks[videoId] || [] : []
  const globalFlat = Object.entries(allBookmarks).flatMap(([vid, list]) => list.map((b) => ({ ...b, videoId: vid })))
  const filterBookmark = (b: Bookmark & { videoTitle?: string; videoId?: string }) => {
    const q = searchQuery.toLowerCase()
    return (
      b.note.toLowerCase().includes(q) ||
      (b.videoTitle || "").toLowerCase().includes(q) ||
      formatTime(b.timestamp).includes(q)
    )
  }
  const filteredVideoBookmarks = videoBookmarks.filter(filterBookmark)
  const filteredGlobal = globalFlat.filter(filterBookmark)
  const groupedGlobal = filteredGlobal.reduce<
    Record<string, { title: string; list: (Bookmark & { videoId: string })[] }>
  >((acc, item) => {
    if (!acc[item.videoId]) acc[item.videoId] = { title: item.videoTitle, list: [] }
    acc[item.videoId].list.push(item)
    return acc
  }, {})

  const renderGlobalLibrary = (compact = false) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <SectionLabel colors={colors} count={globalFlat.length}>
          Your library
        </SectionLabel>
      </div>
      {globalFlat.length > 0 && (
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search notes, titles, times…"
          colors={colors}
        />
      )}
      {globalFlat.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: compact ? "22px 14px" : "30px 16px",
            borderRadius: 12,
            border: `1px dashed ${colors.border}`,
            background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
            color: colors.muted,
            fontSize: 13,
            lineHeight: 1.55
          }}>
          No bookmarks yet. Open a video and save your first timestamped note.
        </div>
      ) : filteredGlobal.length === 0 ? (
        <div style={{ textAlign: "center", padding: 16, color: colors.muted, fontSize: 13 }}>No matches.</div>
      ) : (
        Object.entries(groupedGlobal).map(([vid, group]) => (
          <div
            key={vid}
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              overflow: "hidden"
            }}>
            <button
              type="button"
              onClick={() => handleOpenVideo(vid, group.list[0]?.timestamp || 0)}
              style={{
                width: "100%",
                background: colors.tabBg,
                border: "none",
                borderBottom: `1px solid ${colors.border}`,
                padding: "10px 12px",
                textAlign: "left",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                color: colors.accent,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
              {group.title}
            </button>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 10 }}>
              {group.list.map((b) => (
                <BookmarkRow
                  key={b.id}
                  bookmark={b}
                  colors={colors}
                  copiedId={copiedId}
                  onSeek={() => handleOpenVideo(vid, b.timestamp)}
                  onCopy={() => handleCopyLink(vid, b.timestamp, b.id)}
                  onDelete={() => handleDeleteBookmark(vid, b.id)}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )

  // —— Watching a video ——
  if (videoId) {
    const title = activeTab?.title || "Video"
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            overflow: "hidden"
          }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: "10px 12px",
              borderBottom: `1px solid ${colors.border}`,
              background: colors.tabBg
            }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: colors.accent
              }}>
              Now playing
            </span>
            {currentTime !== null && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  color: colors.subtext,
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 6,
                  padding: "2px 8px"
                }}>
                {formatTime(currentTime)}
              </span>
            )}
          </div>
          <div
            style={{
              padding: "12px 14px 14px",
              fontSize: 14,
              fontWeight: 600,
              color: colors.text,
              lineHeight: 1.45,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden"
            }}>
            {title}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: 12,
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: 12
          }}>
          <input
            type="text"
            placeholder="What’s worth remembering here?"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddBookmark()}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "11px 12px",
              background: colors.inputBg,
              border: `1px solid ${colors.inputBorder}`,
              borderRadius: 10,
              fontSize: 13,
              color: colors.text,
              outline: "none"
            }}
          />
          <button
            type="button"
            onClick={handleAddBookmark}
            style={{
              width: "100%",
              padding: "12px 0",
              background: bookmarkSaveState === "saved" ? colors.success : colors.accent,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.01em"
            }}>
            {bookmarkSaveState === "saved"
              ? "Saved!"
              : `Bookmark at ${formatTime(currentTime ?? 0)}`}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SectionLabel colors={colors} count={videoBookmarks.length}>
            This video
          </SectionLabel>
          {videoBookmarks.length > 3 && (
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Filter this video…" colors={colors} />
          )}
          {videoBookmarks.length === 0 ? (
            <div
              style={{
                fontSize: 13,
                color: colors.muted,
                padding: "12px 14px",
                borderRadius: 10,
                border: `1px dashed ${colors.border}`,
                lineHeight: 1.5
              }}>
              No bookmarks on this video yet.
            </div>
          ) : (
            filteredVideoBookmarks.map((b) => (
              <BookmarkRow
                key={b.id}
                bookmark={b}
                colors={colors}
                copiedId={copiedId}
                onSeek={() => handleSeek(b.timestamp)}
                onCopy={() => handleCopyLink(videoId, b.timestamp, b.id)}
                onDelete={() => handleDeleteBookmark(videoId, b.id)}
              />
            ))
          )}
        </div>
      </div>
    )
  }

  // —— Not on a watch page ——
  const hint = pageHint(onYouTube ? pageKind : "not-youtube", homeFeedDisabled)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div
        style={{
          background: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 6 }}>{hint.title}</div>
          <div style={{ fontSize: 13, color: colors.subtext, lineHeight: 1.55 }}>{hint.body}</div>
        </div>

        {inline && onYouTube ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <NavChip colors={colors} accent onClick={() => navigateInline("/feed/subscriptions")}>
              Subscriptions
            </NavChip>
            <NavChip colors={colors} onClick={() => navigateInline("/feed/history")}>
              History
            </NavChip>
            {!homeFeedDisabled && (
              <NavChip colors={colors} onClick={() => navigateInline("/")}>
                Home
              </NavChip>
            )}
          </div>
        ) : !inline ? (
          <button
            type="button"
            onClick={() => safeTabsCreate("https://www.youtube.com")}
            style={{
              alignSelf: "flex-start",
              padding: "10px 16px",
              background: colors.accent,
              border: "none",
              borderRadius: 10,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer"
            }}>
            Open YouTube
          </button>
        ) : null}
      </div>

      {renderGlobalLibrary(true)}
    </div>
  )
}
