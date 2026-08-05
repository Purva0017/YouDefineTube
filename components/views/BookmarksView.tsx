import { useEffect, useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import { MESSAGES } from "~/lib/messaging"

export interface Bookmark {
  id: string
  timestamp: number // in seconds
  note: string
  createdAt: number
  videoTitle: string
}

interface BookmarksViewProps {
  colors: {
    bg: string
    cardBg: string
    text: string
    subtext: string
    border: string
    inputBg: string
    inputBorder: string
    label: string
  }
  isDark: boolean
}

// Help parse video IDs from URLs (supports watch page and Shorts)
export function getYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
      if (urlObj.pathname === "/watch") {
        return urlObj.searchParams.get("v")
      }
      if (urlObj.pathname.startsWith("/shorts/")) {
        return urlObj.pathname.split("/")[2]
      }
      if (urlObj.pathname.startsWith("/embed/")) {
        return urlObj.pathname.split("/")[2]
      }
      if (urlObj.pathname.startsWith("/v/")) {
        return urlObj.pathname.split("/")[2]
      }
    }
    if (urlObj.hostname === "youtu.be") {
      return urlObj.pathname.substring(1)
    }
  } catch (e) {
    // ignore
  }
  return null
}

export function BookmarksView({ colors, isDark }: BookmarksViewProps) {
  // Store all bookmarks as Record<videoId, Bookmark[]>
  const [allBookmarks, setAllBookmarks] = useStorage<Record<string, Bookmark[]>>("bookmarks", {})

  // Active YouTube tab state
  const [activeTab, setActiveTab] = useState<{
    id: number
    url: string
    title: string
    videoId: string | null
  } | null>(null)

  // Real-time video playback position (polled from content script)
  const [currentTime, setCurrentTime] = useState<number | null>(null)
  const [noteText, setNoteText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Detect active tab and parsing URL on mount
  useEffect(() => {
    const checkActiveTab = async () => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        const tab = tabs[0]
        if (tab?.url) {
          const videoId = getYouTubeVideoId(tab.url)
          setActiveTab({
            id: tab.id || 0,
            url: tab.url,
            title: tab.title || "YouTube Video",
            videoId
          })
        }
      } catch (err) {
        console.error("Error querying active tab:", err)
      }
    }
    checkActiveTab()
  }, [])

  // Poll video currentTime if active tab is a YouTube video
  useEffect(() => {
    if (!activeTab || !activeTab.videoId || !activeTab.id) {
      setCurrentTime(null)
      return
    }

    const pollTime = () => {
      chrome.tabs.sendMessage(activeTab.id, { type: MESSAGES.GET_CURRENT_TIME }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script might not be loaded or ready
          setCurrentTime(null)
        } else if (response && typeof response.time === "number") {
          setCurrentTime(response.time)
        } else {
          setCurrentTime(null)
        }
      })
    }

    // Initial check immediately
    pollTime()

    // Poll every 1 second
    const interval = setInterval(pollTime, 1000)
    return () => clearInterval(interval)
  }, [activeTab])

  // Formats time in seconds to MM:SS or H:MM:SS
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00"
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = Math.floor(secs % 60)
    const mStr = m.toString().padStart(2, "0")
    const sStr = s.toString().padStart(2, "0")
    if (h > 0) {
      return `${h}:${mStr}:${sStr}`
    }
    return `${mStr}:${sStr}`
  }

  // Seek video player to specific time
  const handleSeek = (time: number) => {
    if (!activeTab || !activeTab.id) return
    chrome.tabs.sendMessage(activeTab.id, {
      type: MESSAGES.SEEK_TO_TIME,
      payload: { time }
    })
  }

  // Create new bookmark
  const handleAddBookmark = () => {
    if (!activeTab || !activeTab.videoId) return
    
    // Fallback if content script time couldn't be retrieved (e.g. video loading or paused at 0)
    const timestamp = currentTime !== null ? currentTime : 0
    const newBookmark: Bookmark = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp,
      note: noteText.trim(),
      createdAt: Date.now(),
      videoTitle: activeTab.title.replace(" - YouTube", "")
    }

    const videoId = activeTab.videoId
    const videoBookmarks = allBookmarks[videoId] || []
    
    // Sort bookmarks by timestamp ascending
    const updated = [...videoBookmarks, newBookmark].sort((a, b) => a.timestamp - b.timestamp)

    setAllBookmarks({
      ...allBookmarks,
      [videoId]: updated
    })

    setNoteText("")
  }

  // Delete a bookmark
  const handleDeleteBookmark = (videoId: string, bookmarkId: string) => {
    const videoBookmarks = allBookmarks[videoId] || []
    const updated = videoBookmarks.filter((b) => b.id !== bookmarkId)
    
    const nextBookmarks = { ...allBookmarks }
    if (updated.length === 0) {
      delete nextBookmarks[videoId]
    } else {
      nextBookmarks[videoId] = updated
    }
    
    setAllBookmarks(nextBookmarks)
  }

  // Copy timecoded URL to clipboard
  const handleCopyLink = (videoId: string, timestamp: number, bookmarkId: string) => {
    const timeParam = Math.floor(timestamp)
    const url = `https://youtu.be/${videoId}?t=${timeParam}`
    
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(bookmarkId)
      setTimeout(() => setCopiedId(null), 1500)
    }).catch(err => {
      console.error("Failed to copy link:", err)
    })
  }

  // Open a bookmark video in a new tab
  const handleOpenGlobalBookmark = (videoId: string, timestamp: number) => {
    const timeParam = Math.floor(timestamp)
    const url = `https://www.youtube.com/watch?v=${videoId}&t=${timeParam}s`
    chrome.tabs.create({ url })
  }

  // Extract variables for ease of use
  const videoId = activeTab?.videoId
  const videoBookmarks = videoId ? (allBookmarks[videoId] || []) : []
  const hasBookmarks = videoBookmarks.length > 0

  // Filter video bookmarks
  const filteredVideoBookmarks = videoBookmarks.filter((b) => {
    const query = searchQuery.toLowerCase()
    return (
      b.note.toLowerCase().includes(query) ||
      formatTime(b.timestamp).includes(query)
    )
  })

  // Global bookmarks variables (flat array of all bookmarks)
  const globalBookmarksFlat = Object.entries(allBookmarks).flatMap(([vidId, list]) => 
    list.map(b => ({ ...b, videoId: vidId }))
  )

  // Filter global bookmarks
  const filteredGlobalBookmarks = globalBookmarksFlat.filter((b) => {
    const query = searchQuery.toLowerCase()
    return (
      b.note.toLowerCase().includes(query) ||
      b.videoTitle.toLowerCase().includes(query) ||
      formatTime(b.timestamp).includes(query)
    )
  })

  // Group global bookmarks by videoId
  const groupedGlobalBookmarks = filteredGlobalBookmarks.reduce<Record<string, { title: string; list: typeof filteredGlobalBookmarks }>>((acc, item) => {
    if (!acc[item.videoId]) {
      acc[item.videoId] = {
        title: item.videoTitle,
        list: []
      }
    }
    acc[item.videoId].list.push(item)
    return acc
  }, {})

  const hasAnyGlobalBookmarks = globalBookmarksFlat.length > 0

  // Render WATCHING VIDEO STATE
  if (videoId) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Active Video Header */}
        <div style={{
          background: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: 10,
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 4
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: 9,
              fontWeight: 800,
              background: "#ef4444",
              color: "#ffffff",
              padding: "2px 6px",
              borderRadius: 4,
              letterSpacing: "0.05em",
              textTransform: "uppercase"
            }}>
              Active Video
            </span>
            {currentTime !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#ef4444",
                  display: "inline-block",
                  animation: "pulse 1.5s infinite"
                }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: colors.subtext }}>
                  {formatTime(currentTime)}
                </span>
              </div>
            )}
          </div>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: colors.text,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            {activeTab?.title.replace(" - YouTube", "")}
          </div>
        </div>

        {/* Pulse animation styles */}
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.3; transform: scale(0.9); }
            50% { opacity: 1; transform: scale(1.1); }
            100% { opacity: 0.3; transform: scale(0.9); }
          }
        `}</style>

        {/* Add Bookmark Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            type="text"
            placeholder="Add a note (e.g. Key takeaway, Intro)..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddBookmark()
              }
            }}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 12px",
              background: colors.inputBg,
              border: `1px solid ${colors.inputBorder}`,
              borderRadius: 8,
              fontSize: 13,
              color: colors.text,
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
            onBlur={(e) => e.target.style.borderColor = colors.inputBorder}
          />
          <button
            onClick={handleAddBookmark}
            style={{
              width: "100%",
              padding: "10px 0",
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
              transition: "transform 0.1s, opacity 0.2s"
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
            onMouseUp={(e) => e.currentTarget.style.transform = "none"}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.95"}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none"
              e.currentTarget.style.opacity = "1"
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            Add Bookmark at {formatTime(currentTime ?? 0)}
          </button>
        </div>

        {/* Video Bookmarks List Header & Search */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: colors.label }}>
              Saved Bookmarks ({videoBookmarks.length})
            </span>
          </div>

          {hasBookmarks && (
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <svg 
                style={{ position: "absolute", left: 10, color: colors.label, pointerEvents: "none" }}
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search notes or timestamps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "6px 12px 6px 32px",
                  background: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 6,
                  fontSize: 12,
                  color: colors.text,
                  outline: "none"
                }}
              />
            </div>
          )}
        </div>

        {/* Bookmarks List Container */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {!hasBookmarks ? (
            <div style={{
              textAlign: "center",
              padding: "30px 10px",
              color: colors.label,
              background: colors.cardBg,
              borderRadius: 10,
              border: `1px dashed ${colors.border}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <div style={{ fontSize: 13, fontWeight: 600 }}>No bookmarks saved yet</div>
              <div style={{ fontSize: 11, maxWidth: 240 }}>
                Play the video and click the red button above to save notes at specific times.
              </div>
            </div>
          ) : filteredVideoBookmarks.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: colors.label, fontSize: 12 }}>
              No bookmarks match your search query.
            </div>
          ) : (
            filteredVideoBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: 10,
                  background: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  transition: "background 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)"
                  e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.05)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none"
                  e.currentTarget.style.boxShadow = "none"
                }}
              >
                {/* Clickable timestamp badge */}
                <button
                  onClick={() => handleSeek(bookmark.timestamp)}
                  title="Click to seek"
                  style={{
                    background: isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(37, 99, 235, 0.08)",
                    color: isDark ? "#60a5fa" : "#2563eb",
                    border: "none",
                    borderRadius: 4,
                    padding: "4px 8px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    flexShrink: 0,
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark ? "#3b82f6" : "#2563eb"
                    e.currentTarget.style.color = "#ffffff"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(37, 99, 235, 0.08)"
                    e.currentTarget.style.color = isDark ? "#60a5fa" : "#2563eb"
                  }}
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  {formatTime(bookmark.timestamp)}
                </button>

                {/* Bookmark note */}
                <div style={{
                  flex: 1,
                  fontSize: 12,
                  fontWeight: 500,
                  color: colors.text,
                  wordBreak: "break-word",
                  lineHeight: "1.4",
                  marginTop: 2
                }}>
                  {bookmark.note ? (
                    bookmark.note
                  ) : (
                    <span style={{ color: colors.label, fontStyle: "italic" }}>
                      Bookmark at {formatTime(bookmark.timestamp)}
                    </span>
                  )}
                </div>

                {/* Actions: Copy Link & Delete */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, marginLeft: 6 }}>
                  {/* Share button */}
                  <button
                    onClick={() => handleCopyLink(videoId, bookmark.timestamp, bookmark.id)}
                    title="Copy time-coded link"
                    style={{
                      background: "none",
                      border: "none",
                      padding: 4,
                      color: copiedId === bookmark.id ? "#10b981" : colors.label,
                      cursor: "pointer",
                      display: "flex",
                      borderRadius: 4,
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      if (copiedId !== bookmark.id) e.currentTarget.style.color = colors.text
                    }}
                    onMouseLeave={(e) => {
                      if (copiedId !== bookmark.id) e.currentTarget.style.color = colors.label
                    }}
                  >
                    {copiedId === bookmark.id ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    )}
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteBookmark(videoId, bookmark.id)}
                    title="Delete bookmark"
                    style={{
                      background: "none",
                      border: "none",
                      padding: 4,
                      color: colors.label,
                      cursor: "pointer",
                      display: "flex",
                      borderRadius: 4,
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                    onMouseLeave={(e) => e.currentTarget.style.color = colors.label}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // Render NOT ON YOUTUBE VIDEO WATCH PAGE STATE
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Empty State Banner */}
      <div style={{
        background: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        padding: "20px 16px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10
      }}>
        {/* Bookmark Icon with beautiful gradient glow */}
        <div style={{
          width: 50,
          height: 50,
          borderRadius: "50%",
          background: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ef4444",
          boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1)"
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>
          Not Watching a YouTube Video
        </div>
        <div style={{ fontSize: 11.5, color: colors.subtext, maxWidth: 280, lineHeight: 1.4 }}>
          Open any YouTube video watch page to save personal bookmarks, takeaways, and timestamps.
        </div>
        <button
          onClick={() => chrome.tabs.create({ url: "https://www.youtube.com" })}
          style={{
            marginTop: 4,
            padding: "8px 16px",
            background: isDark ? "#2a2a2a" : "#f3f4f6",
            border: `1px solid ${colors.border}`,
            borderRadius: 6,
            color: colors.text,
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? "#333333" : "#e5e7eb"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isDark ? "#2a2a2a" : "#f3f4f6"
          }}
        >
          Go to YouTube
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </button>
      </div>

      {/* Global Bookmarks Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: colors.label }}>
            All Saved Bookmarks ({globalBookmarksFlat.length})
          </span>
        </div>

        {hasAnyGlobalBookmarks && (
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <svg 
              style={{ position: "absolute", left: 10, color: colors.label, pointerEvents: "none" }}
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search all notes, titles, or times..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "6px 12px 6px 32px",
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: 6,
                fontSize: 12,
                color: colors.text,
                outline: "none"
              }}
            />
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {!hasAnyGlobalBookmarks ? (
          <div style={{
            textAlign: "center",
            padding: "20px 10px",
            color: colors.label,
            fontSize: 11
          }}>
            You don't have any bookmarks saved yet.
          </div>
        ) : filteredGlobalBookmarks.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20, color: colors.label, fontSize: 12 }}>
            No bookmarks match your search query.
          </div>
        ) : (
          Object.entries(groupedGlobalBookmarks).map(([vidId, group]) => (
            <div
              key={vidId}
              style={{
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 8
              }}
            >
              {/* Group Video Title */}
              <div 
                onClick={() => handleOpenGlobalBookmark(vidId, group.list[0].timestamp)}
                title="Open Video"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: isDark ? "#60a5fa" : "#2563eb",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="m22 8-6 4 6 4V8Z" />
                  <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
                </svg>
                <span style={{ textDecoration: "underline" }}>{group.title}</span>
              </div>

              {/* Bookmarks for this video */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {group.list.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      padding: "6px 8px",
                      background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)",
                      borderRadius: 6,
                      border: `1px solid ${colors.border}`
                    }}
                  >
                    {/* Clickable timestamp badge (opens new tab at time) */}
                    <button
                      onClick={() => handleOpenGlobalBookmark(vidId, bookmark.timestamp)}
                      title="Open in new tab at this time"
                      style={{
                        background: isDark ? "rgba(59, 130, 246, 0.12)" : "rgba(37, 99, 235, 0.06)",
                        color: isDark ? "#60a5fa" : "#2563eb",
                        border: "none",
                        borderRadius: 4,
                        padding: "3px 6px",
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        flexShrink: 0
                      }}
                    >
                      <svg width="6" height="6" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      {formatTime(bookmark.timestamp)}
                    </button>

                    {/* Note text */}
                    <div style={{
                      flex: 1,
                      fontSize: 11,
                      fontWeight: 500,
                      color: colors.text,
                      wordBreak: "break-word",
                      lineHeight: "1.3",
                      marginTop: 2
                    }}>
                      {bookmark.note ? (
                        bookmark.note
                      ) : (
                        <span style={{ color: colors.label, fontStyle: "italic" }}>
                          Bookmark at {formatTime(bookmark.timestamp)}
                        </span>
                      )}
                    </div>

                    {/* Actions: Copy Link & Delete */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, marginLeft: 4 }}>
                      <button
                        onClick={() => handleCopyLink(vidId, bookmark.timestamp, bookmark.id)}
                        title="Copy time-coded link"
                        style={{
                          background: "none",
                          border: "none",
                          padding: 2,
                          color: copiedId === bookmark.id ? "#10b981" : colors.label,
                          cursor: "pointer",
                          display: "flex",
                          borderRadius: 4
                        }}
                      >
                        {copiedId === bookmark.id ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteBookmark(vidId, bookmark.id)}
                        title="Delete bookmark"
                        style={{
                          background: "none",
                          border: "none",
                          padding: 2,
                          color: colors.label,
                          cursor: "pointer",
                          display: "flex",
                          borderRadius: 4
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                        onMouseLeave={(e) => e.currentTarget.style.color = colors.label}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
