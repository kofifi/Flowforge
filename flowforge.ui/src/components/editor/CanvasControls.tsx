import type { FC } from 'react'
import Icon from '../Icon'

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
          <Icon name="minus" />
        </button>
        <button type="button" className="icon-button" onClick={onZoomIn} aria-label="Zoom in">
          <Icon name="plus" />
        </button>
        <button type="button" className="icon-button" onClick={onFitView} aria-label="Fit to view">
          <Icon name="fit" />
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
