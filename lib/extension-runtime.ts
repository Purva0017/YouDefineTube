/** True when this execution context can still talk to the extension background. */
export function isExtensionContextValid(): boolean {
  try {
    return typeof chrome !== "undefined" && !!chrome.runtime?.id
  } catch {
    return false
  }
}

export function safeSendMessage<T = unknown>(
  message: unknown,
  callback?: (response: T) => void
): void {
  if (!isExtensionContextValid()) return
  try {
    chrome.runtime.sendMessage(message, (response) => {
      void chrome.runtime.lastError
      callback?.(response as T)
    })
  } catch {
    // Extension was reloaded — old content script context is dead.
  }
}

export function safeTabsCreate(url: string): void {
  if (!isExtensionContextValid() || !chrome.tabs?.create) return
  try {
    chrome.tabs.create({ url })
  } catch {}
}
