import type { Edge, Node } from '@reactflow/core'
import type { NodeData } from '../components/editor/types'

export function cloneNodes<T extends Node<NodeData>>(list: T[]): T[] {
  return list.map((node) => ({
    ...node,
    data: { ...(node.data as Record<string, unknown>) },
    position: { ...node.position },
  }))
}

export function cloneEdges<T extends Edge>(list: T[]): T[] {
  return list.map((edge) => ({
    ...edge,
    data: edge.data ? { ...(edge.data as Record<string, unknown>) } : undefined,
  }))
}
