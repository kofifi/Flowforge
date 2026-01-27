type EdgeMenuState = { id: string; x: number; y: number } | null
type NodeMenuState = { id: string; x: number; y: number } | null
type SelectionMenuState = { x: number; y: number } | null
type CanvasMenuState = { x: number; y: number } | null

type ContextMenusProps = {
  edgeMenu: EdgeMenuState
  nodeMenu: NodeMenuState
  selectionMenu: SelectionMenuState
  canvasMenu: CanvasMenuState
  closingMenu: 'edge' | 'node' | 'selection' | 'canvas' | null
  lastEdgeMenu: EdgeMenuState
  lastNodeMenu: NodeMenuState
  lastSelectionMenu: SelectionMenuState
  lastCanvasMenu: CanvasMenuState
  selectedCount: number
  onDeleteEdge: () => void
  onDeleteNode: () => void
  onDeleteSelection: () => void
  onDuplicateSelection: () => void
  onSelectAll: () => void
  onClose: () => void
  onOpenPalette: () => void
}

function ContextMenus({
  edgeMenu,
  nodeMenu,
  selectionMenu,
  canvasMenu,
  closingMenu,
  lastEdgeMenu,
  lastNodeMenu,
  lastSelectionMenu,
  lastCanvasMenu,
  selectedCount,
  onDeleteEdge,
  onDeleteNode,
  onDeleteSelection,
  onDuplicateSelection,
  onSelectAll,
  onClose,
  onOpenPalette,
}: ContextMenusProps) {
  return (
    <>
      {(edgeMenu || (closingMenu === 'edge' && lastEdgeMenu)) && (
        <div
          className={`edge-menu ${closingMenu === 'edge' ? 'closing' : ''}`}
          style={{
            left: (edgeMenu ?? lastEdgeMenu)?.x,
            top: (edgeMenu ?? lastEdgeMenu)?.y,
          }}
        >
          <p className="edge-menu-title">Connection</p>
          <button type="button" className="danger" onClick={onDeleteEdge}>
            Delete connection
          </button>
          <button type="button" className="ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      )}

      {(nodeMenu || (closingMenu === 'node' && lastNodeMenu)) && (
        <div
          className={`edge-menu ${closingMenu === 'node' ? 'closing' : ''}`}
          style={{
            left: (nodeMenu ?? lastNodeMenu)?.x,
            top: (nodeMenu ?? lastNodeMenu)?.y,
          }}
        >
          <p className="edge-menu-title">Block</p>
          <button type="button" className="danger" onClick={onDeleteNode}>
            Delete block
          </button>
          <button type="button" className="ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      )}

      {(selectionMenu || (closingMenu === 'selection' && lastSelectionMenu)) && (
        <div
          className={`edge-menu ${closingMenu === 'selection' ? 'closing' : ''}`}
          style={{
            left: (selectionMenu ?? lastSelectionMenu)?.x,
            top: (selectionMenu ?? lastSelectionMenu)?.y,
          }}
        >
          <p className="edge-menu-title">Selection ({selectedCount})</p>
          <button type="button" onClick={onDuplicateSelection}>
            Duplicate selected
          </button>
          <button type="button" className="danger" onClick={onDeleteSelection}>
            Delete selected
          </button>
          <button type="button" className="ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      )}

      {(canvasMenu || (closingMenu === 'canvas' && lastCanvasMenu)) && (
        <div
          className={`edge-menu ${closingMenu === 'canvas' ? 'closing' : ''}`}
          style={{
            left: (canvasMenu ?? lastCanvasMenu)?.x,
            top: (canvasMenu ?? lastCanvasMenu)?.y,
          }}
        >
          <p className="edge-menu-title">Canvas</p>
          <button
            type="button"
            onClick={() => {
              onOpenPalette()
            }}
          >
            Add block
          </button>
          <button type="button" onClick={onSelectAll}>
            Select all
          </button>
          <button type="button" className="ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      )}
    </>
  )
}

export type { EdgeMenuState, NodeMenuState, SelectionMenuState, CanvasMenuState }
export default ContextMenus
