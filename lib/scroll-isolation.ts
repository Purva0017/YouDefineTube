/**
 * Stops wheel events from chaining to the YouTube page when the panel
 * hits its scroll boundary.
 */
export function attachScrollIsolation(root: HTMLElement): () => void {
  const onWheel = (e: WheelEvent) => {
    let el = e.target as HTMLElement | null

    while (el && el !== root.parentElement) {
      const style = window.getComputedStyle(el)
      const overflowY = style.overflowY
      const scrollable =
        (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
        el.scrollHeight > el.clientHeight + 1

      if (scrollable) {
        const { scrollTop, scrollHeight, clientHeight } = el
        const scrollingDown = e.deltaY > 0
        const scrollingUp = e.deltaY < 0
        const atTop = scrollTop <= 0
        const atBottom = scrollTop + clientHeight >= scrollHeight - 1

        if ((scrollingUp && atTop) || (scrollingDown && atBottom)) {
          e.preventDefault()
        }
        e.stopPropagation()
        return
      }

      el = el.parentElement
    }

    e.preventDefault()
    e.stopPropagation()
  }

  root.addEventListener("wheel", onWheel, { passive: false, capture: true })

  return () => {
    root.removeEventListener("wheel", onWheel, { capture: true })
  }
}
