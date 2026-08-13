import type { PlasmoCSConfig } from "plasmo"
import { ContentScriptController } from "~/core/contents/ContentScriptController"

export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/*", "https://m.youtube.com/*"],
  run_at: "document_start",
  all_frames: false
}

const controller = new ContentScriptController()

controller.initialize().catch((err) => {
  console.error("Content script initialization failed:", err)
})
