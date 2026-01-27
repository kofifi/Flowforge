import { useRef } from 'react'
import type { Edge, Node } from '@reactflow/core'
import type { NodeData } from '../components/editor/types'

type HistoryEntry = { nodes: Array<Node<NodeData>>; edges: Edge[] }

type UseWorkflowHistoryArgs = {
  nodes: Array<Node<NodeData>>
  edges: Edge[]
  setNodes: React.Dispatch<React.SetStateAction<Array<Node<NodeData>>>>
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
  markDirty: () => void
}

export function useWorkflowHistory({ nodes, edges, setNodes, setEdges, markDirty }: UseWorkflowHistoryArgs) {
  const historyRef = useRef<HistoryEntry[]>([])
  const clipboardRef = useRef<HistoryEntry | null>(null)
  const initialSnapshotCaptured = useRef(false)

  const pushHistory = () => {
    historyRef.current = [
      ...historyRef.current.slice(-49),
      {
        nodes: cloneNodes(nodes),
        edges: cloneEdges(edges),
      },
    ]
  }

  const undoHistory = () => {
    if (historyRef.current.length === 0) return
    const prev = historyRef.current[historyRef.current.length - 1]
    historyRef.current = historyRef.current.slice(0, -1)
    setNodes(prev.nodes)
    setEdges(prev.edges)
    markDirty()
  }

  const copySelection = (selectedNodeIds: string[]) => {
    const selectedNodes = nodes.filter((node) => selectedNodeIds.includes(node.id))
    const selectedEdges = edges.filter(
      (edge) => selectedNodeIds.includes(edge.source) && selectedNodeIds.includes(edge.target),
    )
    clipboardRef.current = {
      nodes: cloneNodes(selectedNodes),
      edges: cloneEdges(selectedEdges),
    }
  }

  const pasteClipboard = () => clipboardRef.current

  return {
    historyRef,
    clipboardRef,
    initialSnapshotCaptured,
    pushHistory,
    undoHistory,
    copySelection,
    pasteClipboard,
  }
}

function cloneNodes<T extends Node>(list: T[]): T[] {
  return list.map((node) => ({
    ...node,
    data: { ...(node.data as Record<string, unknown>) },
    position: { ...node.position },
  }))
}

function cloneEdges<T extends Edge>(list: T[]): T[] {
  return list.map((edge) => ({
    ...edge,
    data: edge.data ? { ...(edge.data as Record<string, unknown>) } : undefined,
  }))
}
