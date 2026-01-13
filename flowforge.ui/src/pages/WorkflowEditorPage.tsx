import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactFlow, {
  addEdge,
  Background,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  applyEdgeChanges,
  useEdgesState,
  useNodesState,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeProps,
  type NodeChange,
  type OnSelectionChangeParams,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { normalizeValues } from '../utils/dataTransforms'
import { useBodyClass } from '../hooks/useBodyClass'
import { useWorkflowStore } from '../state/workflowStore'

type WorkflowVariable = {
  id: number
  name: string
  defaultValue?: string | null
  workflowId: number
}

type WorkflowExecution = {
  id: number
  executedAt: string
  inputData?: Record<string, string>
  resultData?: Record<string, string>
  path?: string[]
  actions?: string[]
}

type SystemBlock = {
  id: number
  type: string
  description: string
}

type WorkflowGraphResponse = {
  workflowId: number
  name: string
  blocks: Array<{
    id: number
    name: string
    systemBlockId: number
    systemBlockType: string
    jsonConfig?: string | null
    positionX?: number | null
    positionY?: number | null
  }>
  connections: Array<{
    id: number
    sourceBlockId: number
    targetBlockId: number
    connectionType: 'Success' | 'Error' | string
  }>
}

type BlockTemplate = {
  type: string
  label: string
  description: string
  category: 'Flow' | 'Logic' | 'Action'
}

type NodeData = {
  blockType: string
  label: string
  description: string
  onOpenConfig?: (payload: { id: string; blockType: string; label: string }) => void
  allowErrorOutput?: boolean
  switchCases?: string[]
}

type StartConfig = {
  displayName: string
  trigger: 'manual' | 'on-save' | 'schedule'
  variables: string
}

type CalculationConfig = {
  operation: 'Add' | 'Subtract' | 'Multiply' | 'Divide' | 'Concat'
  firstVariable: string
  secondVariable: string
  resultVariable: string
}

type IfConfig = {
  first: string
  second: string
  dataType: 'String' | 'Number'
}

type SwitchConfig = {
  expression: string
  cases: string[]
}

function normalizeSwitchCases(values: unknown): string[] {
  if (!Array.isArray(values)) return ['']
  const cleaned = values.map((value) => (typeof value === 'string' ? value : '')).filter((_, idx) => idx >= 0)
  return cleaned.length === 0 ? [''] : cleaned
}

function normalizeVariableName(value: string): string {
  const trimmed = value.trim()
  return trimmed.startsWith('$') ? trimmed.slice(1) : trimmed
}

function formatVariableDisplay(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.startsWith('$') ? trimmed : `$${trimmed}`
}

type ToastMessage = {
  id: number
  message: string
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

function formatSwitchEdgeLabel(index: number, caseValue: string | undefined): string {
  const num = index + 1
  return caseValue && caseValue.length > 0 ? `#${num} · ${caseValue}` : `#${num}`
}

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

const templates: BlockTemplate[] = [
  { type: 'Start', label: 'Start', description: 'Entry point for the workflow.', category: 'Flow' },
  { type: 'End', label: 'End', description: 'Finish the workflow.', category: 'Flow' },
  { type: 'If', label: 'If', description: 'Route based on a condition.', category: 'Logic' },
  { type: 'Switch', label: 'Switch', description: 'Multi-branch on cases', category: 'Logic' },
  { type: 'Calculation', label: 'Calculation', description: 'Compute variables.', category: 'Logic' },
]

function FlowNode({ data, id }: NodeProps<NodeData>) {
  const isStart = data.blockType === 'Start'
  const isEnd = data.blockType === 'End'
  const isIf = data.blockType === 'If'
  const isSwitch = data.blockType === 'Switch'
  const displayDescription = isSwitch ? 'Route by case labels.' : data.description
  const switchCases = data.switchCases ?? ['']
  const switchHandleCount = switchCases.length + 1
  const switchHandleStartPx = 80
  const switchHandleSpacingPx = 22
  const switchHeight = isSwitch
    ? Math.max(120, switchHandleStartPx + (switchHandleCount - 1) * switchHandleSpacingPx + 32)
    : undefined
  const handleBaseStyle = {
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: 'var(--handle-default-bg)',
    border: '2px solid var(--handle-default-border)',
  }
  const handleSuccessStyle = {
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: 'var(--handle-success)',
    border: '2px solid var(--handle-success)',
  }
  const handleErrorStyle = {
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: 'var(--handle-error)',
    border: '2px solid var(--handle-error)',
  }

  return (
    <div
      className="node-card"
      style={{
        position: 'relative',
        height: switchHeight ? `${switchHeight}px` : undefined,
        padding: '6px 14px',
        paddingRight: isSwitch ? 46 : 14,
      }}
    >
      {!isStart && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            left: -14,
            ...handleBaseStyle,
          }}
        />
      )}
      <div className="node-header">
        <span className="node-chip">{data.label}</span>
        <span className="node-status">Ready</span>
        <button
          type="button"
          className="node-gear"
          onClick={(event) => {
            event.stopPropagation()
            data.onOpenConfig?.({ id, blockType: data.blockType, label: data.label })
          }}
          aria-label="Open block settings"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.22-1.13.52-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.8 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.92 14.5a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.42 1.05.72 1.63.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54c.58-.22 1.13-.52 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: '4px 0 6px' }}>
        <p className="node-title" style={{ margin: 0 }}>{data.label} block</p>
        <p className="node-meta" style={{ margin: 0, lineHeight: 1.3 }}>{displayDescription}</p>
      </div>
      {!isEnd && (
        <>
          {isSwitch ? (
            Array.from({ length: switchHandleCount }).map((_, index) => {
              const isDefault = index === switchHandleCount - 1
              const topPx = switchHandleStartPx + switchHandleSpacingPx * index
              return (
                <Fragment key={`switch-case-${index}`}>
                  <span
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: `${topPx}px`,
                      transform: 'translateY(-50%)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-muted, #7b8794)',
                      pointerEvents: 'none',
                    }}
                  >
                    {isDefault ? 'default' : index + 1}
                  </span>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={isDefault ? 'default' : `case-${index + 1}`}
                    style={{
                      top: `${topPx}px`,
                      right: -6,
                      ...handleBaseStyle,
                    }}
                  />
                </Fragment>
              )
            })
          ) : (
            <>
              <Handle
                type="source"
                position={Position.Right}
                id={isIf ? 'success' : undefined}
                style={
                  isIf
                    ? {
                        top: '45%',
                        right: -8,
                        ...handleSuccessStyle,
                      }
                    : {
                        right: -8,
                        ...handleBaseStyle,
                      }
                }
              />
              {isIf && data.allowErrorOutput && (
                <Handle
                  type="source"
                  position={Position.Right}
                  id="error"
                  style={{
                    top: '75%',
                    right: -8,
                    ...handleErrorStyle,
                  }}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

function createNode(
  id: string,
  template: BlockTemplate,
  position: { x: number; y: number },
  onOpenConfig: NodeData['onOpenConfig'],
): Node {
  return {
    id,
    type: 'flowNode',
    position,
    data: {
      onOpenConfig,
      blockType: template.type,
      label: template.label,
      description: template.description,
      allowErrorOutput: template.type === 'If',
      switchCases: template.type === 'Switch' ? [''] : undefined,
    },
    className: 'flow-node',
    style: { width: 220 },
  }
}

function NodeCreator({
  onCreate,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  availableTemplates,
}: {
  onCreate: (template: BlockTemplate) => void
  search: string
  onSearchChange: (next: string) => void
  category: 'All' | BlockTemplate['category']
  onCategoryChange: (next: 'All' | BlockTemplate['category']) => void
  availableTemplates: BlockTemplate[]
}) {
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return availableTemplates.filter((template) => {
      const matchesCategory = category === 'All' || template.category === category
      const matchesQuery =
        !query ||
        template.label.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query)
      return matchesCategory && matchesQuery
    })
  }, [availableTemplates, category, search])

  const byCategory = useMemo(() => {
    const map = new Map<string, BlockTemplate[]>()
    filtered.forEach((template) => {
      if (!map.has(template.category)) {
        map.set(template.category, [])
      }
      map.get(template.category)!.push(template)
    })
    return Array.from(map.entries())
  }, [filtered])

  return (
    <div className="block-panel">
      <div className="palette-header">
        <p className="palette-title">Add block</p>
        <span className="palette-subtitle">Search or browse by type.</span>
      </div>
      <div className="palette-search">
        <input
          type="text"
          placeholder="Search blocks..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <div className="palette-filters">
          {['All', 'Flow', 'Logic', 'Action'].map((value) => (
            <button
              key={value}
              type="button"
              className={`chip ${category === value ? 'chip--active' : ''}`}
              onClick={() => onCategoryChange(value as 'All' | BlockTemplate['category'])}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      {byCategory.map(([group, items]) => (
        <div key={group} className="palette-section">
          <div className="section-header">
            <p className="section-title">{group}</p>
            <span className="section-subtitle">{items.length} blocks</span>
          </div>
          <div className="palette-grid cards">
            {items.map((template) => (
              <button
                key={template.type}
                type="button"
                className="palette-item block-card"
                onClick={() => onCreate(template)}
              >
                <div className="block-card__title">{template.label}</div>
                <div className="block-card__desc">{template.description}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
      {filtered.length === 0 && <p className="muted">No blocks match your filters.</p>}
    </div>
  )
}

function VariableSelect({
  id,
  label,
  value,
  options,
  placeholder,
  onValueChange,
  trailingAction,
  showHints = true,
}: {
  id: string
  label: string
  value: string
  options: string[]
  placeholder?: string
  onValueChange: (next: string) => void
  trailingAction?: React.ReactNode
  showHints?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)

  useEffect(() => {
    setQuery(value)
  }, [value])

  const isKnown = useMemo(
    () => options.some((option) => option === value),
    [options, value],
  )

  const showNotVariable = showHints && value.trim().length > 0 && !isKnown

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return options
    return options.filter((option) => option.toLowerCase().includes(normalized))
  }, [options, query])

  return (
    <div className="combo">
      <label className="drawer-label" htmlFor={id}>
        <span className="label-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M5 7h14M5 12h9M5 17h11"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
        {label}
      </label>
      <div
        className={`combo-input ${isKnown ? 'combo-input--known' : ''} ${
          trailingAction ? 'combo-input--with-action' : ''
        }`}
      >
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            const next = event.target.value
            setQuery(next)
            onValueChange(next)
            setOpen(true)
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120)
          }}
        />
        {trailingAction && <span className="combo-action">{trailingAction}</span>}
        <span className="combo-icon">⌄</span>
      </div>
      {showHints && isKnown && <span className="combo-hint">Matched variable</span>}
      {showNotVariable && <span className="combo-warn">This is not a variable</span>}
      {open && (
        <div className="combo-menu">
          {filtered.length === 0 ? (
            <div className="combo-empty">No matches</div>
          ) : (
            filtered.map((option) => (
              <button
                key={option}
                type="button"
                className="combo-item"
                onClick={() => {
                  onValueChange(option)
                  setQuery(option)
                  setOpen(false)
                }}
              >
                {option}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function WorkflowEditorInner() {
  const { id } = useParams()
  const workflowId = Number(id)
  const navigate = useNavigate()
  useBodyClass('editor-wide')
  const {
    workflow,
    workflowLoading,
    workflowError,
    loadWorkflow,
    variables,
    variablesLoading,
    variablesError,
    loadVariables,
    createVariable: createVariableAction,
    updateVariable: updateVariableAction,
    deleteVariable: deleteVariableAction,
  } = useWorkflowStore()
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [runOpen, setRunOpen] = useState(false)
  const [runInputs, setRunInputs] = useState<Record<string, string>>({})
  const [runResult, setRunResult] = useState<WorkflowExecution | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [showRunSnippet, setShowRunSnippet] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [paletteSearch, setPaletteSearch] = useState('')
  const [paletteCategory, setPaletteCategory] = useState<'All' | BlockTemplate['category']>('All')
  const [showVariables, setShowVariables] = useState(false)
  const [edgeMenu, setEdgeMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const [nodeMenu, setNodeMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const [selectionMenu, setSelectionMenu] = useState<{ x: number; y: number } | null>(null)
  const [canvasMenu, setCanvasMenu] = useState<{ x: number; y: number } | null>(null)
  const [closingMenu, setClosingMenu] = useState<'edge' | 'node' | 'selection' | 'canvas' | null>(null)
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])
  const [pendingSelection, setPendingSelection] = useState<{
    id: string
    role: 'source' | 'target' | 'either'
  } | null>(null)
  const [configPanel, setConfigPanel] = useState<{
    id: string
    blockType: string
    label: string
  } | null>(null)
  const [startConfigs, setStartConfigs] = useState<Record<string, StartConfig>>({})
  const [calculationConfigs, setCalculationConfigs] = useState<Record<string, CalculationConfig>>({})
  const [ifConfigs, setIfConfigs] = useState<Record<string, IfConfig>>({})
  const [switchConfigs, setSwitchConfigs] = useState<Record<string, SwitchConfig>>({})
  const [newVariableName, setNewVariableName] = useState('')
  const [newVariableDefault, setNewVariableDefault] = useState('')
  const [editingVariableId, setEditingVariableId] = useState<number | null>(null)
  const [editingVariableName, setEditingVariableName] = useState('')
  const [editingVariableDefault, setEditingVariableDefault] = useState('')
  const [variablesSaving, setVariablesSaving] = useState(false)
  const [variablesLocalError, setVariablesLocalError] = useState<string | null>(null)
  const [systemBlocks, setSystemBlocks] = useState<SystemBlock[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [showRunInputs, setShowRunInputs] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return localStorage.getItem('flowforge-theme') === 'dark' ? 'dark' : 'light'
  })
  const [isDragging, setIsDragging] = useState(false)

  const [nodes, setNodes, internalOnNodesChange] = useNodesState<Node<NodeData>>([])
  const [edges, setEdges] = useEdgesState<Edge>([])
  const { fitView, zoomIn, zoomOut } = useReactFlow()
  const { zoom } = useViewport()
  const dragFrame = useRef<number | null>(null)
  const closeTimer = useRef<number | null>(null)
  const lastEdgeMenu = useRef<typeof edgeMenu>(null)
  const lastNodeMenu = useRef<typeof nodeMenu>(null)
  const lastSelectionMenu = useRef<typeof selectionMenu>(null)
  const lastCanvasMenu = useRef<typeof canvasMenu>(null)
  const lastMenuType = useRef<'edge' | 'node' | 'selection' | 'canvas' | null>(null)
  const historyRef = useRef<Array<{ nodes: Node<NodeData>[]; edges: Edge[] }>>([])
  const clipboardRef = useRef<{ nodes: Node<NodeData>[]; edges: Edge[] } | null>(null)
  const initialSnapshotCaptured = useRef(false)
  const renderedEdges = useMemo(
    () => (isDragging ? edges.map((edge) => (edge.animated ? { ...edge, animated: false } : edge)) : edges),
    [edges, isDragging],
  )

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
      if (dragFrame.current) {
        cancelAnimationFrame(dragFrame.current)
      }
      if (closeTimer.current) {
        window.clearTimeout(closeTimer.current)
      }
    }
  }, [])

  useEffect(() => {
    setNodes((current) =>
      current.map((node) => {
        if (node.data.blockType !== 'Switch') return node
        const config = switchConfigs[node.id]
        const cases = config ? normalizeSwitchCases(config.cases) : ['']
        const existing = node.data.switchCases ?? []
        const sameLength = existing.length === cases.length
        const sameValues = sameLength && existing.every((value, idx) => value === cases[idx])
        if (sameValues) return node
        return {
          ...node,
          data: {
            ...node.data,
            switchCases: cases,
          },
        }
      }),
    )
  }, [setNodes, switchConfigs])

  useEffect(() => {
    setEdges((current) => {
      let changed = false
      const updated = current.map((edge) => {
        const sourceNode = nodes.find((node) => node.id === edge.source)
        if (!sourceNode || sourceNode.data.blockType !== 'Switch') return edge

        const handleId = edge.sourceHandle ?? ''
        if (!handleId.startsWith('case-') && handleId !== 'default') return edge

        if (handleId === 'default') {
          const data = (edge.data ?? {}) as { label?: string; caseValue?: string }
          const needsUpdate = data.caseValue !== '' || data.label !== '' || edge.label !== 'Default'
          if (!needsUpdate) return edge
          changed = true
          return {
            ...edge,
            data: {
              ...data,
              label: '',
              caseValue: '',
            },
            label: 'Default',
          }
        }

        const parts = handleId.split('-')
        const index = Number(parts[1]) - 1
        if (!Number.isFinite(index) || index < 0) return edge

        const cases = normalizeSwitchCases(switchConfigs[sourceNode.id]?.cases)
        const caseValue = (cases[index] ?? '').trim()
        const display = formatSwitchEdgeLabel(index, caseValue || undefined)
        const displayLabel = display || undefined
        const data = (edge.data ?? {}) as { label?: string; caseValue?: string }
        const needsUpdate =
          data.caseValue !== caseValue || data.label !== caseValue || edge.label !== displayLabel

        if (!needsUpdate) return edge
        changed = true
        return {
          ...edge,
          data: {
            ...data,
            label: caseValue,
            caseValue,
          },
          label: displayLabel,
        }
      })
      return changed ? updated : current
    })
  }, [nodes, setEdges, switchConfigs])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('theme-dark')
    } else {
      root.classList.remove('theme-dark')
    }
    localStorage.setItem('flowforge-theme', theme)
  }, [theme])

  const pushToast = useCallback((message: string) => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, message }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3500)
  }, [])

  const markDirty = useCallback(() => {
    setHasUnsavedChanges(true)
    setSaveStatus('Unsaved changes')
  }, [])

  const pushHistory = useCallback(() => {
    historyRef.current = [
      ...historyRef.current.slice(-49),
      {
        nodes: cloneNodes(nodes),
        edges: cloneEdges(edges),
      },
    ]
  }, [edges, nodes])

  const undoHistory = useCallback(() => {
    const history = historyRef.current
    if (!history.length) return
    const previous = history[history.length - 1]
    historyRef.current = history.slice(0, -1)
    setNodes(cloneNodes(previous.nodes))
    setEdges(cloneEdges(previous.edges))
    setSelectedNodeIds([])
    setEdgeMenu(null)
    setNodeMenu(null)
    setSelectionMenu(null)
    setCanvasMenu(null)
    setPendingSelection(null)
    setShowPalette(false)
    setShowVariables(false)
    setConfigPanel(null)
    markDirty()
  }, [
    markDirty,
    setEdges,
    setNodes,
  ])

  const copySelection = useCallback(() => {
    if (selectedNodeIds.length === 0) return
    const selected = nodes.filter((node) => selectedNodeIds.includes(node.id))
    const selectedIds = new Set(selected.map((node) => node.id))
    const scopedEdges = edges.filter(
      (edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target),
    )
    clipboardRef.current = {
      nodes: cloneNodes(selected),
      edges: cloneEdges(scopedEdges),
    }
  }, [edges, nodes, selectedNodeIds])

  const pasteClipboard = useCallback(() => {
    const clipboard = clipboardRef.current
    if (!clipboard || clipboard.nodes.length === 0) return
    pushHistory()
    const timestamp = Date.now()
    const idMap = new Map<string, string>()
    const offset = 30
    const newNodes = clipboard.nodes.map((node, index) => {
      const newId = `paste-${timestamp}-${index}`
      idMap.set(node.id, newId)
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + offset,
          y: node.position.y + offset,
        },
      }
    })
    const newEdges = clipboard.edges
      .filter((edge) => idMap.has(edge.source) && idMap.has(edge.target))
      .map((edge, index) => ({
        ...edge,
        id: `paste-edge-${timestamp}-${index}`,
        source: idMap.get(edge.source) ?? edge.source,
        target: idMap.get(edge.target) ?? edge.target,
      }))
    setNodes((current) => [...current, ...newNodes])
    setEdges((current) => [...current, ...newEdges])
    setSelectedNodeIds(newNodes.map((node) => node.id))
    markDirty()
  }, [markDirty, pushHistory, setEdges, setNodes])

  useEffect(() => {
    if (initialSnapshotCaptured.current) return
    if (nodes.length === 0 && edges.length === 0) return
    historyRef.current = [{ nodes: cloneNodes(nodes), edges: cloneEdges(edges) }]
    initialSnapshotCaptured.current = true
  }, [edges, nodes])

  useEffect(() => {
    historyRef.current = []
    initialSnapshotCaptured.current = false
  }, [workflowId])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  const openConfig = useCallback((payload: { id: string; blockType: string; label: string }) => {
    setConfigPanel(payload)
    setRunOpen(false)
  }, [])

  const closeConfig = useCallback(() => {
    setConfigPanel(null)
  }, [])

  useEffect(() => {
    if (!Number.isFinite(workflowId)) {
      setError('Invalid workflow id.')
      return
    }
    setError(null)
    loadWorkflow(workflowId)
  }, [loadWorkflow, workflowId])

  useEffect(() => {
    let cancelled = false

    async function loadBlocksAndConnections() {
      if (!workflow || systemBlocks.length === 0) return

      console.debug('[Flowforge] Loading graph for workflow', workflow.id)
      try {
        const response = await fetch(`${apiBase}/api/Workflow/${workflow.id}/graph`)
        if (!response.ok) {
          throw new Error(`Failed to load workflow graph (${response.status})`)
        }
        const graph = (await response.json()) as WorkflowGraphResponse
        console.debug('[Flowforge] Graph', graph)
        const workflowBlocks = normalizeValues<WorkflowGraphResponse['blocks'][number]>(
          graph.blocks as unknown,
        )
        const blockIdMap = new Map<number, string>()
        const blockTypeById = new Map<number, string>()
        const switchCasesByBlockId = new Map<number, string[]>()
        const loadedNodes: Node<NodeData>[] = workflowBlocks.map((block, index) => {
          const blockType = block.systemBlockType || 'Default'
          const label = block.name || blockType
          const nodeId = `block-${block.id}`
          let switchCasesForNode: string[] | undefined
          blockIdMap.set(block.id, nodeId)
          blockTypeById.set(block.id, blockType)

          if (blockType === 'Calculation' && block.jsonConfig) {
            try {
              const parsed = JSON.parse(block.jsonConfig) as {
                Operation?: CalculationConfig['operation']
                FirstVariable?: string
                SecondVariable?: string
                ResultVariable?: string
              }
              setCalculationConfigs((current) => ({
                ...current,
                [nodeId]: {
                  operation: parsed.Operation ?? 'Add',
                  firstVariable: parsed.FirstVariable ? normalizeVariableName(parsed.FirstVariable) : '',
                  secondVariable: parsed.SecondVariable ? normalizeVariableName(parsed.SecondVariable) : '',
                  resultVariable: parsed.ResultVariable ? normalizeVariableName(parsed.ResultVariable) : '',
                },
              }))
            } catch {
              // ignore parse errors
            }
          }

          if (blockType === 'If' && block.jsonConfig) {
            try {
              const parsed = JSON.parse(block.jsonConfig) as {
                DataType?: IfConfig['dataType']
                First?: string
                Second?: string
              }
              setIfConfigs((current) => ({
                ...current,
                [nodeId]: {
                  dataType: parsed.DataType ?? 'String',
                  first: parsed.First ?? '',
                  second: parsed.Second ?? '',
                },
              }))
            } catch {
              // ignore parse errors
            }
          }

          if (blockType === 'Switch' && block.jsonConfig) {
            try {
              const parsed = JSON.parse(block.jsonConfig) as {
                Expression?: string
                Cases?: string[]
              }
              const cases = normalizeSwitchCases(parsed.Cases)
              switchCasesForNode = cases
              switchCasesByBlockId.set(block.id, cases)
              setSwitchConfigs((current) => ({
                ...current,
                [nodeId]: {
                  expression: parsed.Expression ?? '',
                  cases,
                },
              }))
            } catch {
              // ignore parse errors
            }
          }

          return {
            id: nodeId,
            type: 'flowNode',
            position: {
              x: block.positionX ?? 120 + (index % 3) * 260,
              y: block.positionY ?? 100 + Math.floor(index / 3) * 160,
            },
            data: {
              blockType,
              label,
              description:
                systemBlocks.find((sb) => sb.type === blockType)?.description ??
                'Workflow block',
              onOpenConfig: openConfig,
              allowErrorOutput: blockType === 'If',
              switchCases: blockType === 'Switch' ? switchCasesForNode ?? [''] : undefined,
            },
            className: 'flow-node',
            style: { width: 220 },
          }
        })

        const workflowConnections = normalizeValues<
          WorkflowGraphResponse['connections'][number]
        >(graph.connections as unknown).filter(
          (connection) =>
            blockIdMap.has(connection.sourceBlockId) && blockIdMap.has(connection.targetBlockId),
        )
        console.debug('[Flowforge] Filtered connections', workflowConnections)

        const switchUnlabeledCounts = new Map<number, number>()
        const loadedEdges: Edge[] = workflowConnections.map((connection) => {
          const sourceType = blockTypeById.get(connection.sourceBlockId)
          const isIf = sourceType === 'If'
          const isSwitch = sourceType === 'Switch'
          const baseColor =
            isIf && connection.connectionType === 'Error'
              ? 'var(--edge-error)'
              : isIf && connection.connectionType === 'Success'
                ? 'var(--edge-success)'
                : 'var(--edge-default)'
          const sourceHandle = isIf
            ? connection.connectionType === 'Error'
              ? 'error'
              : 'success'
            : undefined
          let edgeLabel = connection.Label ?? undefined
          let edgeData: { label?: string; caseValue?: string } | undefined
          let switchHandle: string | undefined
          if (isSwitch) {
            const trimmed = (connection.Label ?? '').trim()
            const cases = switchCasesByBlockId.get(connection.sourceBlockId) ?? []
            if (trimmed.length === 0) {
              const currentCount = switchUnlabeledCounts.get(connection.sourceBlockId) ?? 0
              switchUnlabeledCounts.set(connection.sourceBlockId, currentCount + 1)
              if (currentCount < cases.length) {
                const caseValue = (cases[currentCount] ?? '').trim()
                edgeLabel = formatSwitchEdgeLabel(currentCount, caseValue)
                edgeData = { label: caseValue, caseValue }
                switchHandle = `case-${currentCount + 1}`
              } else {
                edgeLabel = 'Default'
                edgeData = { label: '', caseValue: '' }
                switchHandle = 'default'
              }
            } else {
              const index = cases.findIndex((value) => value.trim() === trimmed)
              if (index >= 0) {
                edgeLabel = formatSwitchEdgeLabel(index, trimmed)
                edgeData = { label: trimmed, caseValue: trimmed }
                switchHandle = `case-${index + 1}`
              } else {
                edgeLabel = trimmed
                edgeData = { label: trimmed, caseValue: trimmed }
              }
            }
          }
          return {
            id: `edge-${connection.id}`,
            source: blockIdMap.get(connection.sourceBlockId)!,
            target: blockIdMap.get(connection.targetBlockId)!,
            sourceHandle: switchHandle ?? sourceHandle,
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: baseColor },
            style: { stroke: baseColor, strokeWidth: 2.5 },
            data: edgeData ?? (connection.Label ? { label: connection.Label } : undefined),
            label: edgeLabel,
          }
        })

        if (!cancelled) {
          setNodes(loadedNodes)
          setEdges(loadedEdges)
          setHasUnsavedChanges(false)
          console.debug('[Flowforge] Loaded nodes/edges', {
            nodes: loadedNodes,
            edges: loadedEdges,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load workflow graph')
        }
      }
    }

    loadBlocksAndConnections()

    return () => {
      cancelled = true
    }
  }, [openConfig, setEdges, setNodes, systemBlocks, workflow])

  useEffect(() => {
    let cancelled = false

    async function loadSystemBlocks() {
      try {
        const response = await fetch(`${apiBase}/api/SystemBlock`)
        if (!response.ok) {
          throw new Error(`Failed to load system blocks (${response.status})`)
        }
        const data = (await response.json()) as unknown
        if (!cancelled) {
          setSystemBlocks(normalizeValues<SystemBlock>(data))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load system blocks')
        }
      }
    }

    loadSystemBlocks()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (Number.isFinite(workflowId)) {
      loadVariables(workflowId)
    }
  }, [loadVariables, workflowId])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const shouldMark = changes.some((change) => {
        if (change.type === 'position') {
          return change.dragging === true
        }
        return change.type !== 'select' && change.type !== 'dimensions'
      })
      const shouldSnapshot = changes.some(
        (change) =>
          change.type !== 'select' &&
          change.type !== 'dimensions' &&
          !(change.type === 'position' && change.dragging),
      )
      if (shouldSnapshot) {
        pushHistory()
      }
      if (shouldMark) {
        markDirty()
      }
      internalOnNodesChange(changes)
    },
    [internalOnNodesChange, markDirty, pushHistory],
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const shouldMark = changes.some((change) => change.type !== 'select')
      if (shouldMark) {
        pushHistory()
      }
      if (shouldMark) {
        markDirty()
      }
      setEdges((current) => applyEdgeChanges(changes, current))
    },
    [markDirty, pushHistory, setEdges],
  )

  const getBlockType = useCallback(
    (nodeId: string) =>
      nodes.find((node) => node.id === nodeId)?.data?.blockType as string | undefined,
    [nodes],
  )

  const canBeSource = useCallback((blockType?: string) => blockType !== 'End', [])
  const canBeTarget = useCallback((blockType?: string) => blockType !== 'Start', [])

  const hasOutgoingForHandle = useCallback(
    (sourceId: string, sourceHandle?: string) =>
      edges.some(
        (edge) =>
          edge.source === sourceId &&
          (edge.sourceHandle ?? '') === (sourceHandle ?? ''),
      ),
    [edges],
  )

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setEdgeMenu(null)
      const blockType = node.data?.blockType as string | undefined
      const nodeRole: 'source' | 'target' | 'either' =
        blockType === 'Start' ? 'source' : blockType === 'End' ? 'target' : 'either'

      if (!pendingSelection) {
        setPendingSelection({ id: node.id, role: nodeRole })
        return
      }

      if (pendingSelection.id === node.id) {
        setPendingSelection(null)
        return
      }

      const pendingType = getBlockType(pendingSelection.id)
      const candidateType = blockType

      const pendingCanSource = canBeSource(pendingType)
      const pendingCanTarget = canBeTarget(pendingType)
      const candidateCanSource = canBeSource(candidateType)
      const candidateCanTarget = canBeTarget(candidateType)

      if (!pendingCanSource && !pendingCanTarget) {
        setPendingSelection(null)
        return
      }

      if (!candidateCanSource && !candidateCanTarget) {
        setPendingSelection(null)
        return
      }

      let sourceId: string | null = null
      let targetId: string | null = null

      if (pendingSelection.role === 'source') {
        if (candidateCanTarget) {
          sourceId = pendingSelection.id
          targetId = node.id
        }
      } else if (pendingSelection.role === 'target') {
        if (candidateCanSource) {
          sourceId = node.id
          targetId = pendingSelection.id
        }
      } else {
        if (nodeRole === 'source' && pendingCanTarget) {
          sourceId = node.id
          targetId = pendingSelection.id
        } else if (nodeRole === 'target' && pendingCanSource) {
          sourceId = pendingSelection.id
          targetId = node.id
        } else if (pendingCanSource && candidateCanTarget) {
          sourceId = pendingSelection.id
          targetId = node.id
        } else if (pendingCanTarget && candidateCanSource) {
          sourceId = node.id
          targetId = pendingSelection.id
        }
      }

      if (sourceId && targetId) {
        const sourceNode = nodes.find((node) => node.id === sourceId)
        const sourceType = sourceNode?.data.blockType
        const isSwitch = sourceType === 'Switch'
        let sourceHandle: string | undefined
        let label: string | undefined
        let caseValue: string | undefined
        if (isSwitch) {
          const outgoing = edges.filter((edge) => edge.source === sourceId)
          const existingCaseCount = outgoing.filter((edge) =>
            (edge.sourceHandle ?? '').startsWith('case-'),
          ).length
          const cases = switchConfigs[sourceId]?.cases ?? []
          if (existingCaseCount < cases.length) {
            const index = existingCaseCount
            const value = (cases[index] ?? '').trim()
            caseValue = value
            label = formatSwitchEdgeLabel(index, value)
            sourceHandle = `case-${index + 1}`
          } else {
            caseValue = ''
            label = ''
            sourceHandle = 'default'
          }
        } else if (sourceType === 'If') {
          if (!hasOutgoingForHandle(sourceId, 'success')) {
            sourceHandle = 'success'
          } else if (!hasOutgoingForHandle(sourceId, 'error')) {
            sourceHandle = 'error'
        } else {
          pushToast('This output already has a connection.')
          return
        }
      } else if (hasOutgoingForHandle(sourceId)) {
        pushToast('This output already has a connection.')
        return
      }
      if (sourceHandle && hasOutgoingForHandle(sourceId, sourceHandle)) {
        pushToast('This output already has a connection.')
        return
      }
        const baseColor =
          sourceType === 'If' && sourceHandle === 'error'
            ? 'var(--edge-error)'
            : sourceType === 'If' && sourceHandle === 'success'
              ? 'var(--edge-success)'
              : 'var(--edge-default)'
        pushHistory()
        setEdges((current) =>
          addEdge(
            {
              id: `${sourceId}-${targetId}-${Date.now()}`,
              source: sourceId,
              target: targetId,
              sourceHandle,
              animated: true,
              style: { stroke: baseColor, strokeWidth: 2.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: baseColor },
              data:
                label !== undefined
                  ? { label: caseValue ?? label, caseValue }
                  : undefined,
              label:
                sourceHandle === 'default'
                  ? 'Default'
                  : label && label.length > 0
                    ? label
                    : undefined,
            },
            current,
          ),
        )
        markDirty()
      }

      setPendingSelection(null)
    },
    [
      canBeSource,
      canBeTarget,
      edges,
      getBlockType,
      hasOutgoingForHandle,
      markDirty,
      nodes,
      pendingSelection,
      pushHistory,
      setEdges,
      pushToast,
      switchConfigs,
    ],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      const connectionKey = `${connection.source ?? ''}-${connection.sourceHandle ?? ''}-${connection.target ?? ''}-${connection.targetHandle ?? ''}`
      if (connection.source && hasOutgoingForHandle(connection.source, connection.sourceHandle)) {
        pushToast('This output already has a connection.')
        return
      }
      const sourceNode = nodes.find((node) => node.id === connection.source)
      const isIf = sourceNode?.data.blockType === 'If'
      const isSwitch = sourceNode?.data.blockType === 'Switch'
      const baseColor =
        isIf && connection.sourceHandle === 'error'
          ? 'var(--edge-error)'
          : isIf && connection.sourceHandle === 'success'
            ? 'var(--edge-success)'
            : 'var(--edge-default)'
      let label: string | undefined
      let caseValue: string | undefined
      if (isSwitch) {
        const handleId = connection.sourceHandle ?? ''
        const cases = switchConfigs[sourceNode?.id ?? '']?.cases ?? []
        if (handleId.startsWith('case-')) {
          const parts = handleId.split('-')
          const index = Number(parts[1]) - 1
          const value = index >= 0 ? cases[index] ?? '' : ''
          caseValue = value.trim()
          label = caseValue
          const display = index >= 0 ? formatSwitchEdgeLabel(index, caseValue) : caseValue
          const displayLabel = (display ?? caseValue) || undefined
          connection = { ...connection, label: displayLabel }
        } else if (handleId === 'default') {
          caseValue = ''
          label = ''
          connection = { ...connection, label: 'Default' }
        }
      }
      pushHistory()
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            id: `${connectionKey}-${Date.now()}`,
            animated: true,
            style: { stroke: baseColor, strokeWidth: 2.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: baseColor },
            data:
              label !== undefined
                ? { label, caseValue }
                : undefined,
            label: connection.label ?? (label && label.length > 0 ? label : undefined),
          },
          current,
        ),
      )
      markDirty()
    },
    [hasOutgoingForHandle, markDirty, nodes, pushHistory, pushToast, setEdges, switchConfigs],
  )

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.stopPropagation()
      setEdgeMenu({
        id: edge.id,
        x: event.clientX,
        y: event.clientY,
      })
    },
    [],
  )

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault()
      event.stopPropagation()
      setNodeMenu({
        id: node.id,
        x: event.clientX,
        y: event.clientY,
      })
    },
    [],
  )

  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    const ids = params.nodes.map((node) => node.id)
    setSelectedNodeIds(ids)
  }, [])

  const onSelectionContextMenu = useCallback(
    (event: React.MouseEvent, nodes: Node[]) => {
      event.preventDefault()
      event.stopPropagation()
      if (nodes.length < 2) return
      setSelectionMenu({ x: event.clientX, y: event.clientY })
      setSelectedNodeIds(nodes.map((node) => node.id))
    },
    [],
  )

  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    setCanvasMenu({ x: event.clientX, y: event.clientY })
  }, [])

  const closeEdgeMenu = useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    const type = edgeMenu
      ? 'edge'
      : nodeMenu
        ? 'node'
        : selectionMenu
          ? 'selection'
          : canvasMenu
            ? 'canvas'
            : null
    if (!type) {
      setClosingMenu(null)
      return
    }
    lastMenuType.current = type
    setClosingMenu(type)
    closeTimer.current = window.setTimeout(() => {
      setEdgeMenu(null)
      setNodeMenu(null)
      setSelectionMenu(null)
      setCanvasMenu(null)
      setPendingSelection(null)
      setShowVariables(false)
      setClosingMenu(null)
      lastMenuType.current = null
      closeTimer.current = null
    }, 200)
  }, [canvasMenu, edgeMenu, nodeMenu, selectionMenu])

  const toggleVariables = useCallback(() => {
    setShowVariables((open) => !open)
    setShowPalette(false)
    setRunOpen(false)
    setPaletteSearch('')
    setPaletteCategory('All')
  }, [])

  const deleteEdge = useCallback(() => {
    if (!edgeMenu) return
    pushHistory()
    setEdges((current) => current.filter((item) => item.id !== edgeMenu.id))
    setEdgeMenu(null)
    markDirty()
  }, [edgeMenu, markDirty, pushHistory, setEdges])

  const deleteNode = useCallback(() => {
    if (!nodeMenu) return
    pushHistory()
    setNodes((current) => current.filter((node) => node.id !== nodeMenu.id))
    setEdges((current) =>
      current.filter((edge) => edge.source !== nodeMenu.id && edge.target !== nodeMenu.id),
    )
    setNodeMenu(null)
    markDirty()
  }, [markDirty, nodeMenu, pushHistory, setEdges, setNodes])

  const deleteSelection = useCallback(() => {
    if (selectedNodeIds.length === 0) return
    pushHistory()
    setNodes((current) => current.filter((node) => !selectedNodeIds.includes(node.id)))
    setEdges((current) =>
      current.filter(
        (edge) =>
          !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target),
      ),
    )
    setSelectionMenu(null)
    setSelectedNodeIds([])
    markDirty()
  }, [markDirty, pushHistory, selectedNodeIds, setEdges, setNodes])

  const selectAllNodes = useCallback(() => {
    setSelectedNodeIds(nodes.map((node) => node.id))
    setCanvasMenu(null)
  }, [nodes])

  const duplicateSelection = useCallback(() => {
    if (selectedNodeIds.length === 0) return
    const timestamp = Date.now()
    const idMap = new Map<string, string>()

    pushHistory()
    setNodes((current) => {
      const selected = current.filter((node) => selectedNodeIds.includes(node.id))
      const duplicates = selected.map((node, index) => {
        const newId = `dup-${node.id}-${timestamp}-${index}`
        idMap.set(node.id, newId)
        return {
          ...node,
          id: newId,
          position: {
            x: node.position.x + 40,
            y: node.position.y + 40,
          },
        }
      })
      return [...current, ...duplicates]
    })

    setEdges((current) => {
      const duplicatedEdges = current
        .filter(
          (edge) =>
            selectedNodeIds.includes(edge.source) && selectedNodeIds.includes(edge.target),
        )
        .map((edge, index) => ({
          ...edge,
          id: `dup-edge-${edge.id}-${timestamp}-${index}`,
          source: idMap.get(edge.source) ?? edge.source,
          target: idMap.get(edge.target) ?? edge.target,
        }))
      return [...current, ...duplicatedEdges]
    })

    setSelectionMenu(null)
    setSelectedNodeIds(Array.from(idMap.values()))
    markDirty()
  }, [markDirty, pushHistory, selectedNodeIds, setEdges, setNodes])

  const nodeTypes = useMemo(() => ({ flowNode: FlowNode }), [])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      const isEditable =
        target?.isContentEditable ||
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.getAttribute('role') === 'textbox'
      if (isEditable) return

      const key = event.key.toLowerCase()
      const meta = event.metaKey || event.ctrlKey
      if (!meta) return

      if (key === 'a') {
        event.preventDefault()
        selectAllNodes()
      } else if (key === 'c') {
        event.preventDefault()
        copySelection()
      } else if (key === 'v') {
        event.preventDefault()
        pasteClipboard()
      } else if (key === 'z') {
        event.preventDefault()
        undoHistory()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [copySelection, pasteClipboard, selectAllNodes, undoHistory])

  const addNode = useCallback(
    (template: BlockTemplate & { position?: { x: number; y: number } }) => {
      const apiHasBlockType =
        systemBlocks.length === 0 || systemBlocks.some((block) => block.type === template.type)
      if (!apiHasBlockType) {
        setSaveStatus(`${template.label} block is not available on this server.`)
        return
      }
      if (template.type === 'Start' || template.type === 'End') {
        const exists = nodes.some((node) => node.data.blockType === template.type)
        if (exists) {
          setSaveStatus(`${template.type} block already exists.`)
          return
        }
      }
      const position = template.position ?? { x: 80 + nodes.length * 40, y: 80 }
      const node = createNode(`${template.type}-${Date.now()}`, template, position, openConfig)
      pushHistory()
      setNodes((current) => [...current, node])
      if (template.type === 'Switch') {
        setSwitchConfigs((current) => ({
          ...current,
          [node.id]: { expression: '', cases: [''] },
        }))
      }
      setShowPalette(false)
      setPaletteSearch('')
      setPaletteCategory('All')
      markDirty()
    },
    [markDirty, nodes, openConfig, pushHistory, setNodes, setSaveStatus, setSwitchConfigs, systemBlocks],
  )

  const status = useMemo(() => {
    if (workflowLoading) return 'Loading workflow...'
    if (error || workflowError) return error ?? workflowError
    if (!workflow) return 'Workflow not found.'
    return ''
  }, [error, workflow, workflowError, workflowLoading])

  const variablesStatus = useMemo(() => {
    const message = variablesError ?? variablesLocalError
    if (variablesLoading) return 'Loading variables...'
    if (message) return message
    if (variables.length === 0) return 'No variables yet.'
    return ''
  }, [variables, variablesError, variablesLocalError, variablesLoading])

  const systemBlockMap = useMemo(() => {
    const map = new Map<string, SystemBlock>()
    systemBlocks.forEach((block) => map.set(block.type, block))
    return map
  }, [systemBlocks])

  const availableTemplates = useMemo(() => {
    if (systemBlocks.length === 0) return templates
    const allowed = new Set(systemBlocks.map((block) => block.type))
    return templates.filter((template) => allowed.has(template.type))
  }, [systemBlocks])

  const runDefaults = useMemo(() => {
    const defaults: Record<string, string> = {}
    variables.forEach((variable) => {
      defaults[variable.name] = variable.defaultValue ?? ''
    })
    return defaults
  }, [variables])

  async function createVariable(event: React.FormEvent) {
    event.preventDefault()
    if (!newVariableName.trim() || variablesSaving || !workflow) return
    setVariablesSaving(true)
    markDirty()
    setVariablesLocalError(null)

    try {
      await createVariableAction({
        name: newVariableName.trim(),
        defaultValue: newVariableDefault.trim() || null,
        workflowId: workflow.id,
      })
      setNewVariableName('')
      setNewVariableDefault('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create variable'
      setVariablesLocalError(message)
      pushToast(message)
    } finally {
      setVariablesSaving(false)
    }
  }

  function startVariableEdit(variable: WorkflowVariable) {
    setEditingVariableId(variable.id)
    setEditingVariableName(variable.name)
    setEditingVariableDefault(variable.defaultValue ?? '')
  }

  function cancelVariableEdit() {
    setEditingVariableId(null)
    setEditingVariableName('')
    setEditingVariableDefault('')
  }

  async function persistVariableDrafts() {
    if (!workflow) return

    // Save in-progress edits
    if (editingVariableId !== null) {
      const trimmedName = editingVariableName.trim()
      if (!trimmedName) {
        throw new Error('Variable name cannot be empty.')
      }

      await updateVariableAction({
        id: editingVariableId,
        name: trimmedName,
        defaultValue: editingVariableDefault.trim() || null,
        workflowId: workflow.id,
      })
      cancelVariableEdit()
    }

    // Save pending new variable
    if (newVariableName.trim()) {
      await createVariableAction({
        name: newVariableName.trim(),
        defaultValue: newVariableDefault.trim() || null,
        workflowId: workflow.id,
      })
      setNewVariableName('')
      setNewVariableDefault('')
    }
  }

  async function updateVariable(event: React.FormEvent) {
    event.preventDefault()
    if (editingVariableId === null || variablesSaving || !workflow) return
    const trimmedName = editingVariableName.trim()
    if (!trimmedName) return
    setVariablesSaving(true)
    markDirty()
    setVariablesLocalError(null)

    try {
      await updateVariableAction({
        id: editingVariableId,
        name: trimmedName,
        defaultValue: editingVariableDefault.trim() || null,
        workflowId: workflow.id,
      })
      cancelVariableEdit()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update variable'
      setVariablesLocalError(message)
      pushToast(message)
    } finally {
      setVariablesSaving(false)
    }
  }

  async function deleteVariable(variableId: number) {
    if (variablesSaving) return
    setVariablesSaving(true)
    markDirty()
    setVariablesLocalError(null)

    try {
      await deleteVariableAction(variableId, workflow?.id ?? 0)
      if (editingVariableId === variableId) {
        cancelVariableEdit()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete variable'
      setVariablesLocalError(message)
      pushToast(message)
    } finally {
      setVariablesSaving(false)
    }
  }

  function openRunPanel() {
    setRunOpen(true)
    setShowPalette(false)
    setShowVariables(false)
    setConfigPanel(null)
    setRunError(hasUnsavedChanges ? 'Save the workflow before running.' : null)
    setRunResult(null)
    setRunInputs(runDefaults)
  }

  async function runWorkflow() {
    if (!workflow || running) return
    if (hasUnsavedChanges) {
      setRunError('Save the workflow before running.')
      return
    }
    setRunning(true)
    setRunError(null)
    setRunResult(null)

    try {
      const response = await fetch(`${apiBase}/api/Workflow/${workflow.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(runInputs),
      })
      if (!response.ok) {
        throw new Error(`Run failed (${response.status})`)
      }
      const data = (await response.json()) as WorkflowExecution
      const normalized: WorkflowExecution = {
        ...data,
        path: normalizeValues<string>(data.path ?? []),
        actions: normalizeValues<string>(data.actions ?? []),
      }
      setRunResult(normalized)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to run workflow'
      setRunError(message)
      pushToast(message)
    } finally {
      setRunning(false)
    }
  }

  async function saveWorkflow() {
    if (!workflow || saving) return
    setSaving(true)
    setSaveStatus(null)
    setError(null)

    try {
      await persistVariableDrafts()

      console.debug('[Flowforge] Saving workflow', workflow.id)
      const graphResponse = await fetch(`${apiBase}/api/Workflow/${workflow.id}/graph`)
      if (!graphResponse.ok) {
        throw new Error(`Failed to load workflow graph (${graphResponse.status})`)
      }
      const graph = (await graphResponse.json()) as WorkflowGraphResponse
      console.debug('[Flowforge] Existing graph', graph)

      const blocks = normalizeValues<WorkflowGraphResponse['blocks'][number]>(
        graph.blocks as unknown,
      ).map((block) => ({ id: block.id }))

      const connections = normalizeValues<WorkflowGraphResponse['connections'][number]>(
        graph.connections as unknown,
      ).map((connection) => ({ id: connection.id }))

      for (const connection of connections) {
        const response = await fetch(`${apiBase}/api/BlockConnection/${connection.id}`, {
          method: 'DELETE',
        })
        if (!response.ok) {
          throw new Error(`Failed to delete connection (${response.status})`)
        }
      }

      for (const block of blocks) {
        const response = await fetch(`${apiBase}/api/Blocks/${block.id}`, { method: 'DELETE' })
        if (!response.ok) {
          throw new Error(`Failed to delete block (${response.status})`)
        }
      }

      const startNodes = nodes.filter((node) => node.data.blockType === 'Start')
      const endNodes = nodes.filter((node) => node.data.blockType === 'End')
      const middleNodes = nodes.filter(
        (node) => node.data.blockType !== 'Start' && node.data.blockType !== 'End',
      )

      const nodesToSave: Node<NodeData>[] = [
        ...(startNodes.length > 0 ? [startNodes[0]] : []),
        ...middleNodes,
        ...(endNodes.length > 0 ? [endNodes[0]] : []),
      ]

      if (startNodes.length === 0) {
        const startTemplate = templates.find((template) => template.type === 'Start')
        if (startTemplate) {
          nodesToSave.unshift(
            createNode(`auto-start-${Date.now()}`, startTemplate, { x: 120, y: 80 }, openConfig),
          )
        }
      }

      if (endNodes.length === 0) {
        const endTemplate = templates.find((template) => template.type === 'End')
        if (endTemplate) {
          nodesToSave.push(
            createNode(`auto-end-${Date.now()}`, endTemplate, { x: 420, y: 80 }, openConfig),
          )
        }
      }

      if (startNodes.length > 1 || endNodes.length > 1) {
        setSaveStatus('Only one Start/End block is saved. Extra blocks were skipped.')
      }

      // Switch blocks can have empty case values; defaults still create routes.

      let resolvedSystemBlocks = systemBlockMap
      const missingTypes = nodesToSave
        .map((node) => node.data.blockType)
        .filter((type) => !resolvedSystemBlocks.has(type))

      if (missingTypes.length > 0) {
        const systemBlocksResponse = await fetch(`${apiBase}/api/SystemBlock`)
        if (!systemBlocksResponse.ok) {
          throw new Error(`Failed to load system blocks (${systemBlocksResponse.status})`)
        }
        const latestSystemBlocks = normalizeValues<SystemBlock>(
          await systemBlocksResponse.json(),
        )
        resolvedSystemBlocks = new Map<string, SystemBlock>()
        latestSystemBlocks.forEach((block) => resolvedSystemBlocks.set(block.type, block))
      }

      const nodeMap = new Map<string, number>()
      for (const node of nodesToSave) {
        const blockType = node.data.blockType
        const systemBlock = resolvedSystemBlocks.get(blockType)
        if (!systemBlock) {
          throw new Error(
            `Missing system block for type "${blockType}". Ensure the API has this SystemBlock (run migrations/seed).`,
          )
        }

        let jsonConfig: string | null = null
        if (blockType === 'Calculation') {
          const config = calculationConfigs[node.id]
          if (config) {
            jsonConfig = JSON.stringify({
              Operation: config.operation,
              FirstVariable: config.firstVariable,
              SecondVariable: config.secondVariable,
              ResultVariable: config.resultVariable,
            })
          }
        }

        if (blockType === 'If') {
          const config = ifConfigs[node.id]
          if (config) {
            jsonConfig = JSON.stringify({
              DataType: config.dataType,
              First: config.first,
              Second: config.second,
            })
          }
        }

        if (blockType === 'Switch') {
          const config = switchConfigs[node.id]
          if (config) {
            const cases = normalizeSwitchCases(config.cases)
            const trimmedCases = cases.map((value) => value.trim()).filter((value) => value.length > 0)
            jsonConfig = JSON.stringify({
              Expression: config.expression,
              Cases: trimmedCases,
            })
          }
        }

        const response = await fetch(`${apiBase}/api/Blocks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: node.data.label,
            workflowId: workflow.id,
            systemBlockId: systemBlock.id,
            jsonConfig,
            positionX: node.position.x,
            positionY: node.position.y,
          }),
        })

        if (!response.ok) {
          let message = `Failed to save block (${response.status})`
          try {
            const body = (await response.json()) as { message?: string }
            if (body?.message) {
              message = body.message
            }
          } catch {
            // ignore parsing errors
          }
          throw new Error(message)
        }
        const created = (await response.json()) as { id: number }
        console.debug('[Flowforge] Saved block', { nodeId: node.id, blockId: created.id })
        nodeMap.set(node.id, created.id)
      }

      for (const edge of edges) {
        const sourceId = nodeMap.get(edge.source)
        const targetId = nodeMap.get(edge.target)
        if (!sourceId || !targetId) {
          continue
        }
        const sourceNode = nodesToSave.find((node) => nodeMap.get(node.id) === sourceId)
        let connectionType: 'Success' | 'Error' = 'Success'
        if (sourceNode?.data.blockType === 'If') {
          if (edge.sourceHandle === 'error') {
            connectionType = 'Error'
          } else if (edge.sourceHandle === 'success') {
            connectionType = 'Success'
          } else {
            // Fallback: order by appearance if handles missing
            const outgoingEdges = edges.filter((item) => item.source === sourceNode.id)
            const sorted = outgoingEdges
              .map((item, index) => ({ item, index }))
              .sort(
                (a, b) =>
                  (a.item.sourceHandle ?? '').localeCompare(b.item.sourceHandle ?? '') ||
                  a.index - b.index,
              )
            const index = sorted.findIndex(
              (entry) =>
                entry.item.id === edge.id ||
                (entry.item.source === edge.source && entry.item.target === edge.target),
            )
            connectionType = index === 1 ? 'Error' : 'Success'
          }
        }
        const response = await fetch(`${apiBase}/api/BlockConnection`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceBlockId: sourceId,
            targetBlockId: targetId,
            connectionType,
            label:
              edge.data && 'caseValue' in edge.data && edge.data.caseValue !== undefined
                ? edge.data.caseValue
                : edge.data && 'label' in edge.data
                  ? edge.data.label
                  : edge.label,
          }),
        })
        if (!response.ok) {
          let message = `Failed to save connection (${response.status})`
          try {
            const body = (await response.json()) as { message?: string }
            if (body?.message) {
              message = body.message
            }
          } catch {
            // ignore parsing errors
          }
          throw new Error(message)
        }
        console.debug('[Flowforge] Saved connection', { sourceId, targetId })
      }

      await loadVariables(workflow.id)
      setHasUnsavedChanges(false)
      setSaveStatus('Saved')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save workflow'
      setError(message)
      pushToast(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="editor-shell">
      {status ? (
        <div className="state">{status}</div>
      ) : (
        <div className="editor-body">
          <header className="editor-topbar">
            <button type="button" className="ghost" onClick={() => navigate('/')}>
              Back to workflows
            </button>
            <div className="editor-title">
              <h1>{workflow?.name ?? 'Workflow'}</h1>
              <p className="subtitle">Design blocks and connections with React Flow.</p>
            </div>
            <div className="editor-actions">
              <button
                type="button"
                className="icon-button"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      d="M12 4.5V6m0 12v1.5M6 12H4.5M19.5 12H18M7.76 7.76 6.7 6.7m10.6 10.6-1.06-1.06M7.76 16.24 6.7 17.3m10.6-10.6-1.06 1.06M12 9.25A2.75 2.75 0 1 1 9.25 12 2.75 2.75 0 0 1 12 9.25Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      d="M20 14.5A8.5 8.5 0 0 1 9.5 4a6.5 6.5 0 1 0 10.5 10.5Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              {/*
                Run should only be available when the workflow is saved.
                A title hint helps explain why it might be disabled.
              */}
              <button type="button" onClick={saveWorkflow} disabled={saving || workflowLoading}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <span
                style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
              >
                <button
                  type="button"
                  className="pill"
                  onClick={openRunPanel}
                  disabled={workflowLoading || saving}
                >
                  Run
                </button>
              </span>
              {saveStatus && <span className="hint">{saveStatus}</span>}
            </div>
          </header>
          <div className="editor-main">
            <aside className="editor-sidebar">
              <p className="sidebar-label">Canvas</p>
              <div className="sidebar-group">
                <button
                  type="button"
                  className="sidebar-button"
                  onClick={() => setShowPalette((open) => !open)}
                >
                  <span className="sidebar-button__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="sidebar-button__label">
                    {showPalette ? 'Close palette' : 'Add block'}
                  </span>
                </button>
                <button type="button" className="sidebar-button" onClick={toggleVariables}>
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

            <div className={`canvas-wrapper ${isDragging ? 'is-dragging' : ''}`}>
              <div className="canvas">
                <ReactFlow
                  nodes={nodes}
                  edges={renderedEdges}
                  style={{ width: '100%', height: '100%' }}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onEdgeClick={onEdgeClick}
                  onNodeClick={onNodeClick}
                  onNodeContextMenu={onNodeContextMenu}
                  onSelectionChange={onSelectionChange}
                  onSelectionContextMenu={onSelectionContextMenu}
                  onPaneClick={closeEdgeMenu}
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
                  <Background gap={18} color="#d9ddd3" />
                  <MiniMap
                    position="bottom-left"
                    style={{ background: 'var(--canvas-bg)' }}
                    nodeColor={() => 'var(--card)'}
                    nodeStrokeColor={() => 'var(--border-soft)'}
                    maskColor={theme === 'dark' ? 'rgba(13, 17, 23, 0.65)' : 'rgba(255, 255, 255, 0.6)'}
                  />
                </ReactFlow>
                <div className="canvas-controls">
                  <div className="control-group">
                    <span className="control-label">Zoom</span>
                    <span className="control-chip">{Math.round(zoom * 100)}%</span>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => zoomOut({ duration: 200 })}
                      aria-label="Zoom out"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path
                          d="M6 12h12"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => zoomIn({ duration: 200 })}
                      aria-label="Zoom in"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path
                          d="M12 6v12M6 12h12"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => fitView({ padding: 0.2, duration: 220 })}
                      aria-label="Fit to view"
                    >
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
                      onClick={() => setSnapToGrid((enabled) => !enabled)}
                    >
                      {snapToGrid ? 'Snap on' : 'Snap off'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {showPalette && (
            <>
              <div
                className="drawer-backdrop"
                onClick={() => {
                  setShowPalette(false)
                  setPaletteSearch('')
                  setPaletteCategory('All')
                }}
              />
              <aside className="variables-drawer blocks-drawer">
                <div className="palette-header">
                  <div>
                    <p className="palette-title">Blocks</p>
                    <span className="palette-subtitle">Add blocks anywhere on the canvas.</span>
                  </div>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      setShowPalette(false)
                      setPaletteSearch('')
                      setPaletteCategory('All')
                    }}
                  >
                    Close
                  </button>
                </div>
                <NodeCreator
                  onCreate={addNode}
                  search={paletteSearch}
                  onSearchChange={setPaletteSearch}
                  category={paletteCategory}
                  onCategoryChange={setPaletteCategory}
                  availableTemplates={availableTemplates}
                />
              </aside>
            </>
          )}

          {showVariables && (
            <>
              <div className="drawer-backdrop" onClick={toggleVariables} />
              <aside className="variables-drawer">
                <div className="palette-header">
                  <div>
                    <p className="palette-title">Workflow variables</p>
                    <span className="palette-subtitle">Used by Calculation blocks.</span>
                  </div>
                  <button type="button" className="ghost" onClick={toggleVariables}>
                    Close
                  </button>
                </div>

                <section className="variables-section">
                  <div className="section-header">
                    <p className="section-title">Add variable</p>
                    <span className="section-subtitle">Name + default value.</span>
                  </div>
                  <form className="variables-form" onSubmit={createVariable}>
                    <label className="drawer-label" htmlFor="var-name">
                      <span className="label-icon">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M5 7h14M5 12h9M5 17h11"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      Name
                    </label>
                    <input
                      id="var-name"
                      type="text"
                      placeholder="e.g. total"
                      value={newVariableName}
                      onChange={(event) => {
                        setNewVariableName(event.target.value)
                        markDirty()
                      }}
                    />
                    <label className="drawer-label" htmlFor="var-default">
                      <span className="label-icon">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M4 8h6M7 5v6M14 7h6M14 12h6M14 17h6"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      Default value
                    </label>
                    <input
                      id="var-default"
                      type="text"
                      placeholder="Optional"
                      value={newVariableDefault}
                      onChange={(event) => {
                        setNewVariableDefault(event.target.value)
                        markDirty()
                      }}
                    />
                    <button type="submit" disabled={!newVariableName.trim() || variablesSaving}>
                      Add variable
                    </button>
                  </form>
                </section>

                <section className="variables-section">
                  <div className="section-header">
                    <p className="section-title">All variables</p>
                    <span className="section-subtitle">{variables.length} total</span>
                  </div>
                  {variablesStatus ? (
                    <p className="muted">{variablesStatus}</p>
                  ) : (
                    <ul className="variables-list">
                      {variables.map((variable) => (
                        <li key={variable.id} className="variable-card">
                        {editingVariableId === variable.id ? (
                          <form className="variable-edit" onSubmit={updateVariable}>
                            <label className="drawer-label" htmlFor={`edit-name-${variable.id}`}>
                              <span className="label-icon">
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                  <path
                                    d="M5 7h14M5 12h9M5 17h11"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </span>
                              Name
                            </label>
                              <input
                              id={`edit-name-${variable.id}`}
                              type="text"
                              value={editingVariableName}
                              onChange={(event) => {
                                setEditingVariableName(event.target.value)
                                markDirty()
                              }}
                            />
                            <label className="drawer-label" htmlFor={`edit-default-${variable.id}`}>
                              <span className="label-icon">
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                  <path
                                    d="M4 8h6M7 5v6M14 7h6M14 12h6M14 17h6"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </span>
                              Default value
                            </label>
                            <input
                              id={`edit-default-${variable.id}`}
                              type="text"
                              value={editingVariableDefault}
                              onChange={(event) => {
                                setEditingVariableDefault(event.target.value)
                                markDirty()
                              }}
                              placeholder="Optional"
                            />
                              <div className="card-actions">
                                <button type="submit" disabled={!editingVariableName.trim() || variablesSaving}>
                                  Save
                                </button>
                                <button type="button" className="ghost" onClick={cancelVariableEdit}>
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div>
                                <p className="label">{variable.name}</p>
                                <p className="meta">
                                  Default: {variable.defaultValue ?? '—'}
                                </p>
                              </div>
                              <div className="card-actions">
                                <button type="button" onClick={() => startVariableEdit(variable)}>
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="danger"
                                  onClick={() => deleteVariable(variable.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </aside>
            </>
          )}

          {(edgeMenu || (closingMenu === 'edge' && lastEdgeMenu.current)) && (
            <div
              className={`edge-menu ${closingMenu === 'edge' ? 'closing' : ''}`}
              style={{
                left: (edgeMenu ?? lastEdgeMenu.current)?.x,
                top: (edgeMenu ?? lastEdgeMenu.current)?.y,
              }}
            >
              <p className="edge-menu-title">Connection</p>
              <button type="button" className="danger" onClick={deleteEdge}>
                Delete connection
              </button>
              <button type="button" className="ghost" onClick={closeEdgeMenu}>
                Cancel
              </button>
            </div>
          )}

          {(nodeMenu || (closingMenu === 'node' && lastNodeMenu.current)) && (
            <div
              className={`edge-menu ${closingMenu === 'node' ? 'closing' : ''}`}
              style={{
                left: (nodeMenu ?? lastNodeMenu.current)?.x,
                top: (nodeMenu ?? lastNodeMenu.current)?.y,
              }}
            >
              <p className="edge-menu-title">Block</p>
              <button type="button" className="danger" onClick={deleteNode}>
                Delete block
              </button>
              <button type="button" className="ghost" onClick={closeEdgeMenu}>
                Cancel
              </button>
            </div>
          )}

          {(selectionMenu || (closingMenu === 'selection' && lastSelectionMenu.current)) && (
            <div
              className={`edge-menu ${closingMenu === 'selection' ? 'closing' : ''}`}
              style={{
                left: (selectionMenu ?? lastSelectionMenu.current)?.x,
                top: (selectionMenu ?? lastSelectionMenu.current)?.y,
              }}
            >
              <p className="edge-menu-title">
                Selection ({(selectionMenu ?? lastSelectionMenu.current) ? selectedNodeIds.length : selectedNodeIds.length})
              </p>
              <button type="button" onClick={duplicateSelection}>
                Duplicate selected
              </button>
              <button type="button" className="danger" onClick={deleteSelection}>
                Delete selected
              </button>
              <button type="button" className="ghost" onClick={closeEdgeMenu}>
                Cancel
              </button>
            </div>
          )}

          {(canvasMenu || (closingMenu === 'canvas' && lastCanvasMenu.current)) && (
            <div
              className={`edge-menu ${closingMenu === 'canvas' ? 'closing' : ''}`}
              style={{
                left: (canvasMenu ?? lastCanvasMenu.current)?.x,
                top: (canvasMenu ?? lastCanvasMenu.current)?.y,
              }}
            >
              <p className="edge-menu-title">Canvas</p>
              <button
                type="button"
                onClick={() => {
                  setShowPalette(true)
                  setCanvasMenu(null)
                }}
              >
                Add block
              </button>
              <button type="button" onClick={selectAllNodes}>
                Select all
              </button>
              <button type="button" className="ghost" onClick={closeEdgeMenu}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {configPanel && (
        <>
          <div className="drawer-backdrop" onClick={closeConfig} />
          <aside className="config-drawer">
            <div className="drawer-header">
              <div>
                <p className="drawer-title">{configPanel.label} settings</p>
                <span className="drawer-subtitle">{configPanel.blockType} block</span>
              </div>
              <button type="button" className="ghost" onClick={closeConfig}>
                Close
              </button>
            </div>

            {configPanel.blockType === 'Start' ? (
              <form className="drawer-form">
                <label htmlFor="start-display" className="drawer-label">
                  <span className="label-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M4 7h16M4 12h10M4 17h13"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  Display name
                </label>
                <input
                  id="start-display"
                  type="text"
                  value={
                    startConfigs[configPanel.id]?.displayName ??
                    configPanel.label
                  }
                  onChange={(event) => {
                    const value = event.target.value
                    setStartConfigs((current) => ({
                      ...current,
                      [configPanel.id]: {
                        displayName: value,
                        trigger: current[configPanel.id]?.trigger ?? 'manual',
                        variables: current[configPanel.id]?.variables ?? '',
                      },
                    }))
                    setNodes((current) =>
                      current.map((node) =>
                        node.id === configPanel.id
                          ? {
                              ...node,
                              data: {
                                ...node.data,
                                label: value || 'Start',
                              },
                            }
                          : node,
                      ),
                    )
                    setConfigPanel((current) =>
                      current
                        ? {
                            ...current,
                            label: value || 'Start',
                          }
                        : current,
                    )
                    markDirty()
                  }}
                />

                <label htmlFor="start-trigger" className="drawer-label">
                  <span className="label-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M12 3v6l4 2"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
                    </svg>
                  </span>
                  Trigger
                </label>
                <select
                  id="start-trigger"
                  value={startConfigs[configPanel.id]?.trigger ?? 'manual'}
                  onChange={(event) => {
                    const value = event.target.value as StartConfig['trigger']
                    setStartConfigs((current) => ({
                      ...current,
                      [configPanel.id]: {
                        displayName:
                          current[configPanel.id]?.displayName ?? configPanel.label,
                        trigger: value,
                        variables: current[configPanel.id]?.variables ?? '',
                      },
                    }))
                    markDirty()
                  }}
                >
                  <option value="manual">Manual</option>
                  <option value="on-save">On save</option>
                  <option value="schedule">Scheduled</option>
                </select>

                <label htmlFor="start-vars" className="drawer-label">
                  <span className="label-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path d="M12 7v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </span>
                  Initial variables (JSON)
                </label>
                <textarea
                  id="start-vars"
                  rows={6}
                  placeholder='{"customerId":"123"}'
                  value={startConfigs[configPanel.id]?.variables ?? ''}
                  onChange={(event) => {
                    const value = event.target.value
                    setStartConfigs((current) => ({
                      ...current,
                      [configPanel.id]: {
                        displayName:
                          current[configPanel.id]?.displayName ?? configPanel.label,
                        trigger: current[configPanel.id]?.trigger ?? 'manual',
                        variables: value,
                      },
                    }))
                    markDirty()
                  }}
                />
                <p className="muted">
                  This configuration is local-only for now.
                </p>
              </form>
            ) : configPanel.blockType === 'If' ? (
              <form className="drawer-form">
                <label htmlFor="if-first" className="drawer-label">
                  <span className="label-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M5 7h14M5 12h14M5 17h10"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  First value
                </label>
                <VariableSelect
                  id="if-first"
                  label=""
                  placeholder="Variable (e.g. amount) or literal"
                  value={ifConfigs[configPanel.id]?.first ?? ''}
                  options={variables.map((variable) => `$${variable.name}`)}
                  onValueChange={(value) => {
                    setIfConfigs((current) => ({
                      ...current,
                      [configPanel.id]: {
                        dataType: current[configPanel.id]?.dataType ?? 'String',
                        first: value,
                        second: current[configPanel.id]?.second ?? '',
                      },
                    }))
                    markDirty()
                  }}
                />

                <label htmlFor="if-second" className="drawer-label">
                  <span className="label-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M5 7h14M5 12h14M5 17h10"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  Second value
                </label>
                <VariableSelect
                  id="if-second"
                  label=""
                  placeholder="Variable (e.g. total) or literal"
                  value={ifConfigs[configPanel.id]?.second ?? ''}
                  options={variables.map((variable) => `$${variable.name}`)}
                  onValueChange={(value) => {
                    setIfConfigs((current) => ({
                      ...current,
                      [configPanel.id]: {
                        dataType: current[configPanel.id]?.dataType ?? 'String',
                        first: current[configPanel.id]?.first ?? '',
                        second: value,
                      },
                    }))
                    markDirty()
                  }}
                />

                <label htmlFor="if-type" className="drawer-label">
                  <span className="label-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M12 4v16M4 12h16"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  Compare as
                </label>
                <select
                  id="if-type"
                  value={ifConfigs[configPanel.id]?.dataType ?? 'String'}
                  onChange={(event) => {
                    const value = event.target.value as IfConfig['dataType']
                    setIfConfigs((current) => ({
                      ...current,
                      [configPanel.id]: {
                        dataType: value,
                        first: current[configPanel.id]?.first ?? '',
                        second: current[configPanel.id]?.second ?? '',
                      },
                    }))
                    markDirty()
                  }}
                >
                  <option value="String">String</option>
                  <option value="Number">Number</option>
                </select>
                <p className="muted">
                  If evaluates to true, the first outgoing edge is taken; otherwise the second (error) edge.
                </p>
              </form>
            ) : configPanel.blockType === 'Switch' ? (
              <form className="drawer-form">
                {/*
                  Show at least one empty row for quick entry; state keeps [] until user types.
                */}
                <VariableSelect
                  id="switch-expression"
                  label="Expression / variable"
                  placeholder="$variable or literal"
                  value={switchConfigs[configPanel.id]?.expression ?? ''}
                  options={variables.map((variable) => `$${variable.name}`)}
                  onValueChange={(value) => {
                    setSwitchConfigs((current) => ({
                      ...current,
                      [configPanel.id]: {
                        expression: value,
                        cases: normalizeSwitchCases(current[configPanel.id]?.cases),
                      },
                    }))
                    markDirty()
                  }}
                />

                <label className="drawer-label">
                  <span className="label-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M7 7h10M7 12h10M7 17h6"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  Cases
                </label>
                {(switchConfigs[configPanel.id]?.cases ?? ['']).map((caseValue, idx) => (
                  <VariableSelect
                    key={`switch-case-${idx}`}
                    id={`switch-case-${configPanel.id}-${idx}`}
                    label={`Case ${idx + 1}`}
                    placeholder="Value (e.g. pending)"
                    value={caseValue}
                    options={variables.map((variable) => `$${variable.name}`)}
                    showHints={false}
                    onValueChange={(value) => {
                      setSwitchConfigs((current) => {
                        const currentCases = normalizeSwitchCases(
                          current[configPanel.id]?.cases,
                        )
                        const nextCases = [...currentCases]
                        nextCases[idx] = value
                        return {
                          ...current,
                          [configPanel.id]: {
                            expression: current[configPanel.id]?.expression ?? '',
                            cases: nextCases,
                          },
                        }
                      })
                      markDirty()
                    }}
                    trailingAction={
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => {
                          setSwitchConfigs((current) => {
                            const currentCases = normalizeSwitchCases(
                              current[configPanel.id]?.cases,
                            )
                            const nextCases =
                              currentCases.length <= 1
                                ? ['']
                                : currentCases.filter((_, i) => i !== idx)
                            return {
                              ...current,
                              [configPanel.id]: {
                                expression: current[configPanel.id]?.expression ?? '',
                                cases: nextCases,
                              },
                            }
                          })
                          markDirty()
                        }}
                      >
                        Remove
                      </button>
                    }
                  />
                ))}
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setSwitchConfigs((current) => {
                      const nextCases = [...normalizeSwitchCases(current[configPanel.id]?.cases), '']
                      return {
                        ...current,
                        [configPanel.id]: {
                          expression: current[configPanel.id]?.expression ?? '',
                          cases: nextCases,
                        },
                      }
                    })
                    markDirty()
                  }}
                >
                  Add case
                </button>
                <p className="muted">
                  Switch routes by matching case values to connection labels. Use the default handle for unmatched values.
                </p>
              </form>
            ) : configPanel.blockType === 'Calculation' ? (
              <form className="drawer-form">
                <label htmlFor="calc-operation" className="drawer-label">
                  <span className="label-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M4 8h6M7 5v6M14 7h6M14 12h6M14 17h6"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  Operation
                </label>
                <select
                  id="calc-operation"
                  value={calculationConfigs[configPanel.id]?.operation ?? 'Add'}
                  onChange={(event) => {
                    const value = event.target.value as CalculationConfig['operation']
                    setCalculationConfigs((current) => ({
                      ...current,
                      [configPanel.id]: {
                        operation: value,
                        firstVariable: current[configPanel.id]?.firstVariable ?? '',
                        secondVariable: current[configPanel.id]?.secondVariable ?? '',
                        resultVariable: current[configPanel.id]?.resultVariable ?? '',
                      },
                    }))
                    markDirty()
                  }}
                >
                  <option value="Add">Add</option>
                  <option value="Subtract">Subtract</option>
                  <option value="Multiply">Multiply</option>
                  <option value="Divide">Divide</option>
                  <option value="Concat">Concat</option>
                </select>

                <VariableSelect
                  id="calc-first"
                  label="First variable"
                  placeholder="e.g. amount"
                  value={formatVariableDisplay(calculationConfigs[configPanel.id]?.firstVariable ?? '')}
                  options={variables.map((variable) => `$${variable.name}`)}
                  onValueChange={(value) => {
                    const normalized = normalizeVariableName(value)
                    setCalculationConfigs((current) => ({
                      ...current,
                      [configPanel.id]: {
                        operation: current[configPanel.id]?.operation ?? 'Add',
                        firstVariable: normalized,
                        secondVariable: current[configPanel.id]?.secondVariable ?? '',
                        resultVariable: current[configPanel.id]?.resultVariable ?? '',
                      },
                    }))
                    markDirty()
                  }}
                />

                <VariableSelect
                  id="calc-second"
                  label="Second variable"
                  placeholder="e.g. tax"
                  value={formatVariableDisplay(calculationConfigs[configPanel.id]?.secondVariable ?? '')}
                  options={variables.map((variable) => `$${variable.name}`)}
                  onValueChange={(value) => {
                    const normalized = normalizeVariableName(value)
                    setCalculationConfigs((current) => ({
                      ...current,
                      [configPanel.id]: {
                        operation: current[configPanel.id]?.operation ?? 'Add',
                        firstVariable: current[configPanel.id]?.firstVariable ?? '',
                        secondVariable: normalized,
                        resultVariable: current[configPanel.id]?.resultVariable ?? '',
                      },
                    }))
                    markDirty()
                  }}
                />

                <VariableSelect
                  id="calc-result"
                  label="Result variable"
                  placeholder="e.g. total"
                  value={formatVariableDisplay(calculationConfigs[configPanel.id]?.resultVariable ?? '')}
                  options={variables.map((variable) => `$${variable.name}`)}
                  onValueChange={(value) => {
                    const normalized = normalizeVariableName(value)
                    setCalculationConfigs((current) => ({
                      ...current,
                      [configPanel.id]: {
                        operation: current[configPanel.id]?.operation ?? 'Add',
                        firstVariable: current[configPanel.id]?.firstVariable ?? '',
                        secondVariable: current[configPanel.id]?.secondVariable ?? '',
                        resultVariable: normalized,
                      },
                    }))
                    markDirty()
                  }}
                />
                <p className="muted">
                  Saved as JSON config with CalculationOperation and variable names.
                </p>
              </form>
            ) : (
              <div className="drawer-empty">
                <p className="muted">Configuration for this block is coming soon.</p>
              </div>
            )}
          </aside>
        </>
      )}

      {runOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setRunOpen(false)} />
          <aside className="config-drawer">
            <div className="drawer-header">
              <div>
                <p className="drawer-title">Run workflow</p>
                <span className="drawer-subtitle">{workflow?.name}</span>
              </div>
              <button type="button" className="ghost" onClick={() => setRunOpen(false)}>
                Close
              </button>
              </div>

            <section className="variables-section">
              <div className="section-toggle" style={{ marginBottom: showRunSnippet ? 8 : 0 }}>
                <div className="section-toggle__meta">
                  <span className="section-title">API snippet</span>
                  <span className="section-subtitle">HTTP call template</span>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setShowRunSnippet((open) => !open)}
                  aria-label={showRunSnippet ? 'Collapse snippet' : 'Expand snippet'}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    style={{
                      transform: showRunSnippet ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s ease',
                    }}
                    aria-hidden="true"
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              {showRunSnippet && (
                <div className="variables-section" style={{ gap: 8 }}>
                  <p className="muted">
                    1) Replace <code>&lt;API_BASE&gt;</code> with your backend URL.<br />
                    2) Fill variable values in the JSON body.<br />
                    3) Run in terminal (curl) or any HTTP client (Postman).
                  </p>
                  <div className="code-card">
                    <div className="code-card__header">
                      <span>curl</span>
                      <span className="muted">HTTP POST</span>
                    </div>
<pre className="code-block">{`curl -X POST \\
  "<API_BASE>/api/Workflow/${workflow?.id ?? 'ID'}/run" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(
    variables.reduce<Record<string, string>>((acc, variable) => {
      acc[variable.name] = variable.defaultValue ?? ''
      return acc
    }, {}),
    null,
    2,
  )}'`}</pre>
                  </div>
                  <p className="muted">
                    Response returns execution id, path, actions, and output variables as JSON.
                  </p>
                </div>
              )}

              <div className="section-header">
                <div className="section-toggle">
                  <div className="section-toggle__meta">
                    <span className="section-title">Inputs</span>
                    <span className="section-subtitle">{variables.length} variables</span>
                  </div>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setShowRunInputs((open) => !open)}
                    aria-label={showRunInputs ? 'Collapse inputs' : 'Expand inputs'}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      style={{
                        transform: showRunInputs ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s ease',
                      }}
                      aria-hidden="true"
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              {showRunInputs && (
                <form className="drawer-form" onSubmit={(event) => {
                  event.preventDefault()
                  runWorkflow()
                }}>
                  {variables.length === 0 && (
                    <p className="muted">No workflow variables defined.</p>
                  )}
                  {variables.map((variable) => (
                    <div key={variable.id} className="combo">
                      <label className="drawer-label" htmlFor={`run-${variable.id}`}>
                        <span className="label-icon">
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M5 7h14M5 12h9M5 17h11"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>
                        {variable.name}
                      </label>
                      <input
                        id={`run-${variable.id}`}
                        type="text"
                        value={runInputs[variable.name] ?? ''}
                        onChange={(event) => {
                          const value = event.target.value
                          setRunInputs((current) => ({
                            ...current,
                            [variable.name]: value,
                          }))
                        }}
                      />
                    </div>
                  ))}
                </form>
              )}
              <button
                type="button"
                disabled={running}
                onClick={runWorkflow}
                style={{ marginTop: 10 }}
              >
                {running ? 'Running...' : 'Run workflow'}
              </button>
              {runError && <p className="muted">{runError}</p>}
            </section>

            {runResult && (
              <section className="variables-section">
                <div className="section-header">
                  <p className="section-title">Result</p>
                  <span className="section-subtitle">Execution #{runResult.id}</span>
                </div>
                <div className="drawer-empty">
                  <p className="label">Output variables</p>
                  <pre className="meta">
                    {JSON.stringify(runResult.resultData ?? {}, null, 2)}
                  </pre>
                </div>
                {runResult.path && runResult.path.length > 0 && (
                  <div className="drawer-empty">
                    <p className="label">Path</p>
                    <p className="meta">{runResult.path.join(' → ')}</p>
                  </div>
                )}
                {runResult.actions && runResult.actions.length > 0 && (
                  <div className="drawer-empty">
                    <p className="label">Actions</p>
                    <ul className="variables-list">
                      {runResult.actions.map((action, index) => (
                        <li key={`${action}-${index}`} className="variable-card">
                          <p className="meta">{action}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}
          </aside>
        </>
      )}
      {toasts.length > 0 && (
        <div
          style={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            zIndex: 9999,
          }}
          aria-live="polite"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              style={{
                background: '#2d2f36',
                color: '#fff',
                padding: '10px 12px',
                borderRadius: 6,
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                fontSize: 14,
                maxWidth: 320,
              }}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function WorkflowEditorPage() {
  return (
    <ReactFlowProvider>
      <WorkflowEditorInner />
    </ReactFlowProvider>
  )
}
