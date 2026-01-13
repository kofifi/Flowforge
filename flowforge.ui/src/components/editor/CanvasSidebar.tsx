import type { FC } from 'react'

export type CanvasSidebarProps = {
  showPalette: boolean
  showVariables: boolean
  onTogglePalette: () => void
  onToggleVariables: () => void
}

const CanvasSidebar: FC<CanvasSidebarProps> = ({
  showPalette,
  showVariables,
  onTogglePalette,
  onToggleVariables,
}) => {
  return (
    <aside className="editor-sidebar">
      <p className="sidebar-label">Canvas</p>
      <div className="sidebar-group">
        <button type="button" className="sidebar-button" onClick={onTogglePalette}>
          <span className="sidebar-button__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span className="sidebar-button__label">
            {showPalette ? 'Close palette' : 'Add block'}
          </span>
        </button>
        <button type="button" className="sidebar-button" onClick={onToggleVariables}>
          <span className="sidebar-button__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M6.5 6.5h11M6.5 12h11M6.5 17.5h11M6.5 6.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5S4.17 5 5 5s1.5.67 1.5 1.5ZM6.5 12c0 .83-.67 1.5-1.5 1.5S3.5 12.83 3.5 12 4.17 10.5 5 10.5s1.5.67 1.5 1.5Zm0 5.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5S4.17 16.5 5 16.5s1.5.67 1.5 1.5Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </span>
          <span className="sidebar-button__label">
            {showVariables ? 'Hide variables' : 'Variables'}
          </span>
        </button>
      </div>
      <p className="sidebar-label">Context</p>
      <div className="sidebar-group subtle">
        <p className="sidebar-hint">Right-click canvas or elements for quick actions.</p>
      </div>
    </aside>
  )
}

export default CanvasSidebar
