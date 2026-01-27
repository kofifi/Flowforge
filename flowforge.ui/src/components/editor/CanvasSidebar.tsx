import type { FC } from 'react'
import Icon from '../Icon'

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
            <Icon name="plus" size={20} />
          </span>
          <span className="sidebar-button__label">
            {showPalette ? 'Close palette' : 'Add block'}
          </span>
        </button>
        <button type="button" className="sidebar-button" onClick={onToggleVariables}>
          <span className="sidebar-button__icon" aria-hidden="true">
            <Icon name="list-bullets" size={20} />
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
