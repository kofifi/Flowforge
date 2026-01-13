import type { FC } from 'react'

export type CanvasControlsProps = {
  zoomPercent: number
  snapToGrid: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  onToggleSnap: () => void
}

const CanvasControls: FC<CanvasControlsProps> = ({
  zoomPercent,
  snapToGrid,
  onZoomIn,
  onZoomOut,
  onFitView,
  onToggleSnap,
}) => {
  return (
    <div className="canvas-controls">
      <div className="control-group">
        <span className="control-label">Zoom</span>
        <span className="control-chip">{zoomPercent}%</span>
        <button type="button" className="icon-button" onClick={onZoomOut} aria-label="Zoom out">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M6 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <button type="button" className="icon-button" onClick={onZoomIn} aria-label="Zoom in">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <button type="button" className="icon-button" onClick={onFitView} aria-label="Fit to view">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M5 9V5h4M19 9V5h-4M5 15v4h4M19 15v4h-4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className="control-group">
        <span className="control-label">Grid</span>
        <button
          type="button"
          className={`control-chip control-chip--toggle ${snapToGrid ? 'active' : ''}`}
          onClick={onToggleSnap}
        >
          {snapToGrid ? 'Snap on' : 'Snap off'}
        </button>
      </div>
    </div>
  )
}

export default CanvasControls
