import { useCallback, useEffect, useMemo, useRef, useState, Suspense, lazy } from 'react'
import type { Connection, Edge, EdgeChange, EdgeProps, Node, NodeChange } from '@reactflow/core'
import '@reactflow/core/dist/style.css'
import FlowNode from './FlowNode'
import type { NodeData } from './types'

const CanvasControls = lazy(() => import('./CanvasControls'))

type FlowCanvasProps = {
  nodes: Array<Node<NodeData>>
  setNodes: React.Dispatch<React.SetStateAction<Array<Node<NodeData>>>>
  edges: Edge[]
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
  snapToGrid: boolean
  isDragging: boolean
  setIsDragging: (value: boolean) => void
  workflowLoading: boolean
  graphLoading: boolean
  onConnect: (connection: Connection) => void
  onEdgeClick: (event: React.MouseEvent, edge: Edge) => void
  onNodeClick: (event: React.MouseEvent, node: Node) => void
  onNodeContextMenu: (event: React.MouseEvent, node: Node) => void
  onSelectionChange: (params: { nodes: Node[]; edges: Edge[] }) => void
  onSelectionContextMenu: (event: React.MouseEvent, nodes: Node[]) => void
  onPaneClick: () => void
  onPaneContextMenu: (event: React.MouseEvent) => void
  onToggleSnap: () => void
  onNodesMutate?: (changes: NodeChange[]) => void
  onEdgesMutate?: (changes: EdgeChange[]) => void
}

type ReactFlowModule = typeof import('@reactflow/core')

const buildStyledEdge =
  (module: ReactFlowModule) =>
  ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, label, data }: EdgeProps) => {
    const offset = (data as any)?.parallelOffset ?? 0
    const labelBgPadding = (data as any)?.labelBgPadding ?? [6, 4]
    const labelBgRadius = (data as any)?.labelBgBorderRadius ?? 10
    const labelBgStyle = (data as any)?.labelBgStyle ?? { fill: 'rgba(0,0,0,0.55)' }
    const labelTextStyle = (data as any)?.labelStyle ?? { fill: '#fff', fontWeight: 600, fontSize: 11 }

    const dx = targetX - sourceX
    const dy = targetY - sourceY
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const ox = (-dy / len) * offset
    const oy = (dx / len) * offset

    const [path, labelX, labelY] = module.getBezierPath({
      sourceX: sourceX + ox,
      sourceY: sourceY + oy,
      targetX: targetX + ox,
      targetY: targetY + oy,
      sourcePosition,
      targetPosition,
    })

    return (
      <>
        <module.BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
        {label ? (
          <module.EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                background: labelBgStyle.fill ?? 'rgba(0,0,0,0.55)',
                color: (labelTextStyle as any)?.fill ?? '#fff',
                padding: `${labelBgPadding[1]}px ${labelBgPadding[0]}px`,
                borderRadius: labelBgRadius,
                fontWeight: (labelTextStyle as any)?.fontWeight ?? 600,
                fontSize: (labelTextStyle as any)?.fontSize ?? 11,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                pointerEvents: 'all',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </div>
          </module.EdgeLabelRenderer>
        ) : null}
      </>
    )
  }

function CanvasInner({
  module,
  nodes,
  setNodes,
  edges,
  setEdges,
  snapToGrid,
  isDragging,
  setIsDragging,
  workflowLoading,
  graphLoading,
  onConnect,
  onEdgeClick,
  onNodeClick,
  onNodeContextMenu,
  onSelectionChange,
  onSelectionContextMenu,
  onPaneClick,
  onPaneContextMenu,
  onToggleSnap,
  onNodesMutate,
  onEdgesMutate,
}: FlowCanvasProps & { module: ReactFlowModule }) {
  const edgeTypes = useMemo(() => ({ styledEdge: buildStyledEdge(module) }), [module])
  const nodeTypes = useMemo(() => ({ flowNode: FlowNode }), [])
  const dragFrame = useRef<number | null>(null)
  const { fitView, zoomIn, zoomOut } = module.useReactFlow()
  const { zoom } = module.useViewport()

  const renderedEdges = useMemo(() => {
    const groups = new Map<string, Edge[]>()
    edges.forEach((edge) => {
      const key = `${edge.source}-${edge.target}-${edge.sourceHandle ?? 'default'}-${edge.targetHandle ?? 'default'}`
      const list = groups.get(key) ?? []
      list.push(edge)
      groups.set(key, list)
    })
    return edges.map((edge) => {
      const key = `${edge.source}-${edge.target}-${edge.sourceHandle ?? 'default'}-${edge.targetHandle ?? 'default'}`
      const group = groups.get(key) ?? []
      const index = group.findIndex((item) => item.id === edge.id)
      const offsetStep = 18
      const offset = group.length > 1 ? (index - (group.length - 1) / 2) * offsetStep : 0
      return {
        ...edge,
        animated: true,
        type: 'styledEdge',
        markerEnd: edge.markerEnd ?? { type: module.MarkerType.ArrowClosed, color: (edge.style as any)?.stroke ?? '#2f9e68' },
        style: {
          stroke: (edge.style as any)?.stroke ?? '#2f9e68',
          strokeWidth: (edge.style as any)?.strokeWidth ?? 2.5,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
          ...edge.style,
        },
        labelBgPadding: edge.labelBgPadding ?? [6, 4],
        labelBgBorderRadius: edge.labelBgBorderRadius ?? 10,
        labelBgStyle: edge.labelBgStyle ?? { fill: 'rgba(0,0,0,0.55)', stroke: 'none' },
        labelStyle: edge.labelStyle ?? { fill: '#fff', fontWeight: 600, fontSize: 11 },
        data: { ...(edge.data ?? {}), parallelOffset: offset },
      }
    })
  }, [edges, isDragging, module])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesMutate?.(changes)
      setNodes((current) => module.applyNodeChanges(changes, current))
    },
    [module, onNodesMutate, setNodes],
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesMutate?.(changes)
      setEdges((current) => module.applyEdgeChanges(changes, current))
    },
    [module, onEdgesMutate, setEdges],
  )

  return (
    <div className={`canvas-wrapper ${isDragging ? 'is-dragging' : ''}`}>
      <div
        className="canvas"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, rgba(0,0,0,0.04), transparent 55%), linear-gradient(135deg, rgba(0,0,0,0.02) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.02) 50%, rgba(0,0,0,0.02) 75%, transparent 75%, transparent)',
          backgroundSize: '100% 100%, 48px 48px',
        }}
      >
        <module.ReactFlow
          nodes={nodes}
          edges={renderedEdges}
          edgeTypes={edgeTypes}
          style={{ width: '100%', height: '100%' }}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onNodeClick={onNodeClick}
          onNodeContextMenu={onNodeContextMenu}
          onSelectionChange={onSelectionChange}
          onSelectionContextMenu={onSelectionContextMenu}
          onPaneClick={onPaneClick}
          onMoveStart={() => setIsDragging(true)}
          onMoveEnd={() => {
            if (dragFrame.current) {
              cancelAnimationFrame(dragFrame.current)
            }
            dragFrame.current = requestAnimationFrame(() => {
              setIsDragging(false)
              dragFrame.current = null
            })
          }}
          onPaneContextMenu={onPaneContextMenu}
          nodeTypes={nodeTypes}
          snapToGrid={snapToGrid}
          snapGrid={[16, 16]}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          {/* Background and MiniMap removed to reduce paint cost for smoother drag */}
        </module.ReactFlow>

        {graphLoading && (
          <div
            className="canvas-loading"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.85), rgba(240,245,240,0.85))',
              color: '#2f9e68',
              fontWeight: 700,
              letterSpacing: 0.4,
              backdropFilter: 'blur(2px)',
              zIndex: 5,
            }}
          >
            <div style={{ display: 'grid', gap: 6, textAlign: 'center' }}>
              <span style={{ fontSize: 13, opacity: 0.7 }}>Preparing canvas</span>
              <span style={{ fontSize: 15 }}>Loading workflow graph...</span>
            </div>
          </div>
        )}
        {workflowLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 'auto 16px 16px auto',
              background: 'rgba(255,255,255,0.9)',
              padding: '10px 12px',
              borderRadius: 8,
              color: '#0f172a',
              fontSize: 14,
              border: '1px solid rgba(15,23,42,0.08)',
              fontWeight: 700,
              letterSpacing: 0.4,
              backdropFilter: 'blur(2px)',
              zIndex: 5,
            }}
          >
            <div style={{ display: 'grid', gap: 6, textAlign: 'center' }}>
              <span style={{ fontSize: 13, opacity: 0.7 }}>Preparing canvas</span>
              <span style={{ fontSize: 15 }}>Loading workflow graph...</span>
            </div>
          </div>
        )}
        <Suspense fallback={<div />}>
          <CanvasControls
            zoomPercent={Math.round(zoom * 100)}
            snapToGrid={snapToGrid}
            onZoomIn={() => zoomIn({ duration: 200 })}
            onZoomOut={() => zoomOut({ duration: 200 })}
            onFitView={() => fitView({ padding: 0.2, duration: 220 })}
            onToggleSnap={onToggleSnap}
          />
        </Suspense>
      </div>
    </div>
  )
}

function FlowCanvas(props: FlowCanvasProps) {
  const [rfModule, setRfModule] = useState<ReactFlowModule | null>(null)

  useEffect(() => {
    let active = true
    import('@reactflow/core').then((mod) => {
      if (active) setRfModule(mod)
    })
    return () => {
      active = false
    }
  }, [])

  if (!rfModule) {
    return (
      <div className="canvas-wrapper">
        <div className="canvas-loading">
          <div style={{ display: 'grid', gap: 6, textAlign: 'center' }}>
            <span style={{ fontSize: 13, opacity: 0.7 }}>Preparing canvas</span>
            <span style={{ fontSize: 15 }}>Loading editor...</span>
          </div>
        </div>
      </div>
    )
  }

  return <CanvasInner module={rfModule} {...props} />
}

export default FlowCanvas
