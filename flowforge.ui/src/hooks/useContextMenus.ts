import { useCallback, useEffect, useRef, useState } from 'react'
import type { CanvasMenuState, EdgeMenuState, NodeMenuState, SelectionMenuState } from '../components/editor/ContextMenus'

type ContextMenusState = {
  edgeMenu: EdgeMenuState
  nodeMenu: NodeMenuState
  selectionMenu: SelectionMenuState
  canvasMenu: CanvasMenuState
  closingMenu: 'edge' | 'node' | 'selection' | 'canvas' | null
  lastEdgeMenu: EdgeMenuState
  lastNodeMenu: NodeMenuState
  lastSelectionMenu: SelectionMenuState
  lastCanvasMenu: CanvasMenuState
  setEdgeMenu: React.Dispatch<React.SetStateAction<EdgeMenuState>>
  setNodeMenu: React.Dispatch<React.SetStateAction<NodeMenuState>>
  setSelectionMenu: React.Dispatch<React.SetStateAction<SelectionMenuState>>
  setCanvasMenu: React.Dispatch<React.SetStateAction<CanvasMenuState>>
  closeAll: () => void
}

export function useContextMenus(): ContextMenusState {
  const [edgeMenu, setEdgeMenu] = useState<EdgeMenuState>(null)
  const [nodeMenu, setNodeMenu] = useState<NodeMenuState>(null)
  const [selectionMenu, setSelectionMenu] = useState<SelectionMenuState>(null)
  const [canvasMenu, setCanvasMenu] = useState<CanvasMenuState>(null)
  const [closingMenu, setClosingMenu] = useState<'edge' | 'node' | 'selection' | 'canvas' | null>(null)
  const closeTimer = useRef<number | null>(null)
  const lastEdgeMenu = useRef<EdgeMenuState>(null)
  const lastNodeMenu = useRef<NodeMenuState>(null)
  const lastSelectionMenu = useRef<SelectionMenuState>(null)
  const lastCanvasMenu = useRef<CanvasMenuState>(null)
  const lastMenuType = useRef<'edge' | 'node' | 'selection' | 'canvas' | null>(null)

  useEffect(() => {
    if (edgeMenu) {
      lastEdgeMenu.current = edgeMenu
      lastMenuType.current = 'edge'
      setClosingMenu(null)
    }
  }, [edgeMenu])

  useEffect(() => {
    if (nodeMenu) {
      lastNodeMenu.current = nodeMenu
      lastMenuType.current = 'node'
      setClosingMenu(null)
    }
  }, [nodeMenu])

  useEffect(() => {
    if (selectionMenu) {
      lastSelectionMenu.current = selectionMenu
      lastMenuType.current = 'selection'
      setClosingMenu(null)
    }
  }, [selectionMenu])

  useEffect(() => {
    if (canvasMenu) {
      lastCanvasMenu.current = canvasMenu
      lastMenuType.current = 'canvas'
      setClosingMenu(null)
    }
  }, [canvasMenu])

  useEffect(() => {
    if (edgeMenu || nodeMenu || selectionMenu || canvasMenu || closingMenu) return
    if (!lastMenuType.current) return
    setClosingMenu(lastMenuType.current)
    closeTimer.current = window.setTimeout(() => {
      setClosingMenu(null)
      lastMenuType.current = null
      closeTimer.current = null
    }, 150)
  }, [canvasMenu, closingMenu, edgeMenu, nodeMenu, selectionMenu])

  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        window.clearTimeout(closeTimer.current)
      }
    }
  }, [])

  const closeAll = useCallback(() => {
    setEdgeMenu(null)
    setNodeMenu(null)
    setSelectionMenu(null)
    setCanvasMenu(null)
    setClosingMenu(null)
  }, [])

  return {
    edgeMenu,
    nodeMenu,
    selectionMenu,
    canvasMenu,
    closingMenu,
    lastEdgeMenu: lastEdgeMenu.current,
    lastNodeMenu: lastNodeMenu.current,
    lastSelectionMenu: lastSelectionMenu.current,
    lastCanvasMenu: lastCanvasMenu.current,
    setEdgeMenu,
    setNodeMenu,
    setSelectionMenu,
    setCanvasMenu,
    closeAll,
  }
}
