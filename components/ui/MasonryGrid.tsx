import type { ReactNode } from "react"

export function MasonryGrid({ children, gap = 10 }: { children: ReactNode; gap?: number }) {
  return (
    <div
      style={{
        columnCount: 2,
        columnGap: gap,
        columnFill: "balance"
      }}>
      {children}
    </div>
  )
}
