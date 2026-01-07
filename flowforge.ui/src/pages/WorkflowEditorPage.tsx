import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  applyEdgeChanges,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeProps,
} from 'reactflow'
import 'reactflow/dist/style.css'

type Workflow = {
  id: number
  name: string
}

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

type BlockResponse = {
  id: number
  name: string
  workflowId: number
  systemBlockId: number
  systemBlock?: SystemBlock | null
  jsonConfig?: string | null
}

type BlockConnectionResponse = {
  id: number
  sourceBlockId: number
  targetBlockId: number
  connectionType: 'Success' | 'Error'
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
}

type NodeData = {
  blockType: string
  label: string
  description: string
  onOpenConfig?: (payload: { id: string; blockType: string; label: string }) => void
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

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

const templates: BlockTemplate[] = [
  { type: 'Start', label: 'Start', description: 'Entry point for the workflow.' },
  { type: 'Calculation', label: 'Calculation', description: 'Compute variables.' },
  { type: 'If', label: 'If', description: 'Route based on a condition.' },
  { type: 'End', label: 'End', description: 'Finish the workflow.' },
]

function normalizeValues<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[]
  }

  if (data && typeof data === 'object' && '$values' in data) {
    const values = (data as { $values?: unknown }).$values
    return Array.isArray(values) ? (values as T[]) : []
  }

  return []
}

function FlowNode({ data, id }: NodeProps<NodeData>) {
  const isStart = data.blockType === 'Start'
  const isEnd = data.blockType === 'End'

  return (
    <div className="node-card">
      {!isStart && <Handle type="target" position={Position.Left} />}
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
      <p className="node-title">{data.label} block</p>
      <p className="node-meta">{data.description}</p>
      {!isEnd && <Handle type="source" position={Position.Right} />}
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
    },
    className: 'flow-node',
    style: { width: 220 },
  }
}

function NodeCreator({ onCreate }: { onCreate: (template: BlockTemplate) => void }) {
  return (
    <div className="palette">
      <div className="palette-header">
        <p className="palette-title">Add block</p>
        <span className="palette-subtitle">Drop into the canvas</span>
      </div>
      <div className="palette-grid">
        {templates.map((template) => (
          <button
            key={template.type}
            type="button"
            className="palette-item"
            onClick={() => onCreate(template)}
          >
            <span>{template.label}</span>
            <small>{template.description}</small>
          </button>
        ))}
      </div>
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
}: {
  id: string
  label: string
  value: string
  options: string[]
  placeholder?: string
  onValueChange: (next: string) => void
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

  const showNotVariable = value.trim().length > 0 && !isKnown

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
      <div className={`combo-input ${isKnown ? 'combo-input--known' : ''}`}>
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
        <span className="combo-icon">⌄</span>
      </div>
      {isKnown && <span className="combo-hint">Matched variable</span>}
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

export default function WorkflowEditorPage() {
  const { id } = useParams()
  const workflowId = Number(id)
  const navigate = useNavigate()
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [runOpen, setRunOpen] = useState(false)
  const [runInputs, setRunInputs] = useState<Record<string, string>>({})
  const [runResult, setRunResult] = useState<WorkflowExecution | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [showVariables, setShowVariables] = useState(false)
  const [edgeMenu, setEdgeMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const [nodeMenu, setNodeMenu] = useState<{ id: string; x: number; y: number } | null>(null)
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
  const [variables, setVariables] = useState<WorkflowVariable[]>([])
  const [variablesLoading, setVariablesLoading] = useState(true)
  const [variablesError, setVariablesError] = useState<string | null>(null)
  const [newVariableName, setNewVariableName] = useState('')
  const [newVariableDefault, setNewVariableDefault] = useState('')
  const [editingVariableId, setEditingVariableId] = useState<number | null>(null)
  const [editingVariableName, setEditingVariableName] = useState('')
  const [editingVariableDefault, setEditingVariableDefault] = useState('')
  const [variablesSaving, setVariablesSaving] = useState(false)
  const [systemBlocks, setSystemBlocks] = useState<SystemBlock[]>([])

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([])
  const [edges, setEdges] = useEdgesState<Edge>([])

  const openConfig = useCallback((payload: { id: string; blockType: string; label: string }) => {
    setConfigPanel(payload)
    setRunOpen(false)
  }, [])

  const closeConfig = useCallback(() => {
    setConfigPanel(null)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadWorkflow() {
      if (!Number.isFinite(workflowId)) {
        setError('Invalid workflow id.')
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${apiBase}/api/Workflow/${workflowId}`)
        if (!response.ok) {
          throw new Error(`Failed to load workflow (${response.status})`)
        }
        const data = (await response.json()) as Workflow
        if (!cancelled) {
          setWorkflow(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load workflow')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadWorkflow()

    return () => {
      cancelled = true
    }
  }, [workflowId])

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
        const loadedNodes: Node<NodeData>[] = workflowBlocks.map((block, index) => {
          const blockType = block.systemBlockType || 'Default'
          const label = block.name || blockType
          const nodeId = `block-${block.id}`
          blockIdMap.set(block.id, nodeId)

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
                  firstVariable: parsed.FirstVariable ?? '',
                  secondVariable: parsed.SecondVariable ?? '',
                  resultVariable: parsed.ResultVariable ?? '',
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

        const loadedEdges: Edge[] = workflowConnections.map((connection) => ({
          id: `edge-${connection.id}`,
          source: blockIdMap.get(connection.sourceBlockId)!,
          target: blockIdMap.get(connection.targetBlockId)!,
          animated: true,
        }))

        if (!cancelled) {
          setNodes(loadedNodes)
          setEdges(loadedEdges)
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
    let cancelled = false

    async function loadVariables() {
      if (!Number.isFinite(workflowId)) {
        setVariablesLoading(false)
        return
      }
      setVariablesLoading(true)
      setVariablesError(null)
      try {
        const response = await fetch(`${apiBase}/api/WorkflowVariable`)
        if (!response.ok) {
          throw new Error(`Failed to load variables (${response.status})`)
        }
        const data = (await response.json()) as unknown
        if (!cancelled) {
          const all = normalizeValues<WorkflowVariable>(data)
          setVariables(all.filter((item) => item.workflowId === workflowId))
        }
      } catch (err) {
        if (!cancelled) {
          setVariablesError(err instanceof Error ? err.message : 'Unable to load variables')
        }
      } finally {
        if (!cancelled) {
          setVariablesLoading(false)
        }
      }
    }

    loadVariables()

    return () => {
      cancelled = true
    }
  }, [workflowId])

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((current) => applyEdgeChanges(changes, current))
    },
    [setEdges],
  )

  const getBlockType = useCallback(
    (nodeId: string) =>
      nodes.find((node) => node.id === nodeId)?.data?.blockType as string | undefined,
    [nodes],
  )

  const canBeSource = useCallback((blockType?: string) => blockType !== 'End', [])
  const canBeTarget = useCallback((blockType?: string) => blockType !== 'Start', [])

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
        setEdges((current) =>
          addEdge(
            { id: `${sourceId}-${targetId}-${Date.now()}`, source: sourceId, target: targetId, animated: true },
            current,
          ),
        )
      }

      setPendingSelection(null)
    },
    [canBeSource, canBeTarget, getBlockType, pendingSelection, setEdges],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((current) => addEdge({ ...connection, animated: true }, current))
    },
    [setEdges],
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

  const closeEdgeMenu = useCallback(() => {
    setEdgeMenu(null)
    setNodeMenu(null)
    setPendingSelection(null)
    setShowVariables(false)
  }, [])

  const toggleVariables = useCallback(() => {
    setShowVariables((open) => !open)
    setShowPalette(false)
    setRunOpen(false)
  }, [])

  const deleteEdge = useCallback(() => {
    if (!edgeMenu) return
    setEdges((current) => current.filter((item) => item.id !== edgeMenu.id))
    setEdgeMenu(null)
  }, [edgeMenu, setEdges])

  const deleteNode = useCallback(() => {
    if (!nodeMenu) return
    setNodes((current) => current.filter((node) => node.id !== nodeMenu.id))
    setEdges((current) =>
      current.filter((edge) => edge.source !== nodeMenu.id && edge.target !== nodeMenu.id),
    )
    setNodeMenu(null)
  }, [nodeMenu, setEdges, setNodes])

  const nodeTypes = useMemo(() => ({ flowNode: FlowNode }), [])

  const addNode = useCallback(
    (template: BlockTemplate & { position?: { x: number; y: number } }) => {
      if (template.type === 'Start' || template.type === 'End') {
        const exists = nodes.some((node) => node.data.blockType === template.type)
        if (exists) {
          setSaveStatus(`${template.type} block already exists.`)
          return
        }
      }
      const position = template.position ?? { x: 80 + nodes.length * 40, y: 80 }
      const node = createNode(`${template.type}-${Date.now()}`, template, position, openConfig)
      setNodes((current) => [...current, node])
      setShowPalette(false)
    },
    [nodes, openConfig, setNodes, setSaveStatus],
  )

  const status = useMemo(() => {
    if (loading) return 'Loading workflow...'
    if (error) return error
    if (!workflow) return 'Workflow not found.'
    return ''
  }, [error, loading, workflow])

  const variablesStatus = useMemo(() => {
    if (variablesLoading) return 'Loading variables...'
    if (variablesError) return variablesError
    if (variables.length === 0) return 'No variables yet.'
    return ''
  }, [variables, variablesError, variablesLoading])

  const systemBlockMap = useMemo(() => {
    const map = new Map<string, SystemBlock>()
    systemBlocks.forEach((block) => map.set(block.type, block))
    return map
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
    setVariablesError(null)

    try {
      const response = await fetch(`${apiBase}/api/WorkflowVariable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newVariableName.trim(),
          defaultValue: newVariableDefault.trim() || null,
          workflowId: workflow.id,
        }),
      })
      if (!response.ok) {
        throw new Error(`Failed to create variable (${response.status})`)
      }
      const created = (await response.json()) as WorkflowVariable
      setVariables((current) => [created, ...current])
      setNewVariableName('')
      setNewVariableDefault('')
    } catch (err) {
      setVariablesError(err instanceof Error ? err.message : 'Unable to create variable')
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

  async function updateVariable(event: React.FormEvent) {
    event.preventDefault()
    if (editingVariableId === null || variablesSaving || !workflow) return
    const trimmedName = editingVariableName.trim()
    if (!trimmedName) return
    setVariablesSaving(true)
    setVariablesError(null)

    try {
      const response = await fetch(`${apiBase}/api/WorkflowVariable/${editingVariableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingVariableId,
          name: trimmedName,
          defaultValue: editingVariableDefault.trim() || null,
          workflowId: workflow.id,
        }),
      })
      if (!response.ok) {
        throw new Error(`Failed to update variable (${response.status})`)
      }
      setVariables((current) =>
        current.map((item) =>
          item.id === editingVariableId
            ? {
                ...item,
                name: trimmedName,
                defaultValue: editingVariableDefault.trim() || null,
              }
            : item,
        ),
      )
      cancelVariableEdit()
    } catch (err) {
      setVariablesError(err instanceof Error ? err.message : 'Unable to update variable')
    } finally {
      setVariablesSaving(false)
    }
  }

  async function deleteVariable(variableId: number) {
    if (variablesSaving) return
    setVariablesSaving(true)
    setVariablesError(null)

    try {
      const response = await fetch(`${apiBase}/api/WorkflowVariable/${variableId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(`Failed to delete variable (${response.status})`)
      }
      setVariables((current) => current.filter((item) => item.id !== variableId))
      if (editingVariableId === variableId) {
        cancelVariableEdit()
      }
    } catch (err) {
      setVariablesError(err instanceof Error ? err.message : 'Unable to delete variable')
    } finally {
      setVariablesSaving(false)
    }
  }

  function openRunPanel() {
    setRunOpen(true)
    setShowPalette(false)
    setShowVariables(false)
    setConfigPanel(null)
    setRunError(null)
    setRunResult(null)
    setRunInputs(runDefaults)
  }

  async function runWorkflow() {
    if (!workflow || running) return
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
      setRunError(err instanceof Error ? err.message : 'Unable to run workflow')
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
          throw new Error(`Missing system block for type "${blockType}"`)
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
        const response = await fetch(`${apiBase}/api/BlockConnection`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceBlockId: sourceId,
            targetBlockId: targetId,
            connectionType: 'Success',
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

      setSaveStatus('Saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save workflow')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="editor-shell">
      <header className="editor-topbar">
        <button type="button" className="ghost" onClick={() => navigate('/')}>
          Back to workflows
        </button>
        <div className="editor-title">
          <h1>{workflow?.name ?? 'Workflow'}</h1>
          <p className="subtitle">Design blocks and connections with React Flow.</p>
        </div>
        <div className="editor-actions">
          <button type="button" className="ghost" onClick={() => setShowPalette((open) => !open)}>
            {showPalette ? 'Close palette' : 'Add block'}
          </button>
          <button type="button" onClick={saveWorkflow} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button type="button" className="pill" onClick={openRunPanel} disabled={loading}>
            Run
          </button>
          {saveStatus && <span className="hint">{saveStatus}</span>}
        </div>
      </header>

      {status ? (
        <div className="state">{status}</div>
      ) : (
        <div className="editor-body">
          <div className="canvas">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onEdgeClick={onEdgeClick}
              onNodeClick={onNodeClick}
              onNodeContextMenu={onNodeContextMenu}
              onPaneClick={closeEdgeMenu}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background gap={18} color="#d9ddd3" />
              <Controls position="bottom-right" />
              <MiniMap position="bottom-left" />
            </ReactFlow>
            <div className="canvas-toolbar">
              <button type="button" onClick={() => setShowPalette((open) => !open)}>
                {showPalette ? 'Hide blocks' : 'Add block'}
              </button>
              <button type="button" className="ghost" onClick={toggleVariables}>
                {showVariables ? 'Hide variables' : 'Variables'}
              </button>
              <button type="button" className="ghost">
                Clear
              </button>
              {pendingSelection && (
                <span className="hint">Select another node to connect...</span>
              )}
            </div>
          </div>

          {showPalette && (
            <div className="palette-tooltip">
              <NodeCreator onCreate={addNode} />
            </div>
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
                      onChange={(event) => setNewVariableName(event.target.value)}
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
                      onChange={(event) => setNewVariableDefault(event.target.value)}
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
                              onChange={(event) => setEditingVariableName(event.target.value)}
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
                              onChange={(event) => setEditingVariableDefault(event.target.value)}
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

          {edgeMenu && (
            <div
              className="edge-menu"
              style={{ left: edgeMenu.x, top: edgeMenu.y }}
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

          {nodeMenu && (
            <div
              className="edge-menu"
              style={{ left: nodeMenu.x, top: nodeMenu.y }}
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
                  }}
                />
                <p className="muted">
                  This configuration is local-only for now.
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
                  value={calculationConfigs[configPanel.id]?.firstVariable ?? ''}
                  options={variables.map((variable) => variable.name)}
                  onValueChange={(value) => {
                    setCalculationConfigs((current) => ({
                      ...current,
                      [configPanel.id]: {
                        operation: current[configPanel.id]?.operation ?? 'Add',
                        firstVariable: value,
                        secondVariable: current[configPanel.id]?.secondVariable ?? '',
                        resultVariable: current[configPanel.id]?.resultVariable ?? '',
                      },
                    }))
                  }}
                />

                <VariableSelect
                  id="calc-second"
                  label="Second variable"
                  placeholder="e.g. tax"
                  value={calculationConfigs[configPanel.id]?.secondVariable ?? ''}
                  options={variables.map((variable) => variable.name)}
                  onValueChange={(value) => {
                    setCalculationConfigs((current) => ({
                      ...current,
                      [configPanel.id]: {
                        operation: current[configPanel.id]?.operation ?? 'Add',
                        firstVariable: current[configPanel.id]?.firstVariable ?? '',
                        secondVariable: value,
                        resultVariable: current[configPanel.id]?.resultVariable ?? '',
                      },
                    }))
                  }}
                />

                <VariableSelect
                  id="calc-result"
                  label="Result variable"
                  placeholder="e.g. total"
                  value={calculationConfigs[configPanel.id]?.resultVariable ?? ''}
                  options={variables.map((variable) => variable.name)}
                  onValueChange={(value) => {
                    setCalculationConfigs((current) => ({
                      ...current,
                      [configPanel.id]: {
                        operation: current[configPanel.id]?.operation ?? 'Add',
                        firstVariable: current[configPanel.id]?.firstVariable ?? '',
                        secondVariable: current[configPanel.id]?.secondVariable ?? '',
                        resultVariable: value,
                      },
                    }))
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
              <div className="section-header">
                <p className="section-title">Inputs</p>
                <span className="section-subtitle">{variables.length} variables</span>
              </div>
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
                <button type="submit" disabled={running}>
                  {running ? 'Running...' : 'Run workflow'}
                </button>
              </form>
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
    </div>
  )
}
