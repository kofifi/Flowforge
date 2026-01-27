import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ReactFlowProvider,
  type Connection,
  type Edge,
  type EdgeChange,
  type MarkerType,
  type Node,
  type NodeChange,
  type OnSelectionChangeParams,
} from '@reactflow/core'
import { normalizeValues } from '../utils/dataTransforms'
import { requestJson, withJson } from '../api/http'
import { useBodyClass } from '../hooks/useBodyClass'
import { useThemePreference } from '../hooks/useThemePreference'
import { useLanguagePreference } from '../hooks/useLanguagePreference'
import { useWorkflowStore } from '../state/workflowStore'
import { useWorkflowHistory } from '../hooks/useWorkflowHistory'
import { cloneNodes, cloneEdges } from './WorkflowEditorPage.helpers'
const CanvasSidebar = lazy(() => import('../components/editor/CanvasSidebar'))
const BlocksDrawer = lazy(() => import('../components/editor/BlocksDrawer'))
const VariablesDrawer = lazy(() => import('../components/editor/VariablesDrawer'))
const FlowCanvas = lazy(() => import('../components/editor/FlowCanvas'))
const RunDrawer = lazy(() => import('../components/editor/RunDrawer'))
const ConfigDrawer = lazy(() => import('../components/editor/ConfigDrawer'))
const EditorTopbar = lazy(() => import('../components/editor/EditorTopbar'))
const ContextMenus = lazy(() => import('../components/editor/ContextMenus'))
import type { ConfigPanelState } from '../components/editor/ConfigDrawer'
import type { BlockTemplate, NodeData } from '../components/editor/types'
import type {
  CalculationConfig,
  HttpRequestConfig,
  HttpRequestAuthType,
  IfConfig,
  LoopConfig,
  ParserBlockFormat,
  ParserConfig,
  StartConfig,
  SwitchConfig,
  WaitConfig,
  TextTransformConfig,
  TextReplaceConfig,
  TextReplaceRule,
} from '../components/editor/configTypes'

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
    Label?: string | null
  }>
}

const DEFAULT_EDGE_COLOR = '#7a8899'

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
  { type: 'Loop', label: 'Loop', description: 'Repeat a branch multiple times.', category: 'Logic' },
  { type: 'Wait', label: 'Wait', description: 'Pause execution for a duration.', category: 'Flow' },
  { type: 'Calculation', label: 'Calculation', description: 'Compute variables.', category: 'Logic' },
  { type: 'TextTransform', label: 'Text Transform', description: 'Trim / lower / upper.', category: 'Logic' },
  { type: 'TextReplace', label: 'Text Replace', description: 'Replace text literal/regex.', category: 'Logic' },
  { type: 'HttpRequest', label: 'HTTP request', description: 'Call external HTTP APIs.', category: 'Action' },
  { type: 'Parser', label: 'Parser', description: 'Extract values from JSON or XML.', category: 'Action' },
]

function createNode(
  id: string,
  template: BlockTemplate,
  position: { x: number; y: number },
  onOpenConfig: NodeData['onOpenConfig'],
): Node<NodeData> {
  return {
    id,
    type: 'flowNode',
    position,
    data: {
      onOpenConfig,
      blockType: template.type,
      label: template.label,
      description: template.description,
      allowErrorOutput: template.type === 'If' || template.type === 'Loop',
      switchCases: template.type === 'Switch' ? [''] : undefined,
    },
    className: 'flow-node',
    style: { width: 220 },
  }
}

function WorkflowEditorInner() {
  const { id } = useParams()
  const workflowId = Number(id)
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
  const [skipWaits, setSkipWaits] = useState(false)
  const [showRunSnippet, setShowRunSnippet] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [paletteSearch, setPaletteSearch] = useState('')
  const [paletteCategory, setPaletteCategory] = useState<'All' | BlockTemplate['category']>('All')
  const [showVariables, setShowVariables] = useState(false)
  const [edgeMenu, setEdgeMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const [nodeMenu, setNodeMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const [selectionMenu, setSelectionMenu] = useState<{ x: number; y: number } | null>(null)
  const [canvasMenu, setCanvasMenu] = useState<{ x: number; y: number } | null>(null)
  const [graphLoading, setGraphLoading] = useState(false)
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
  const [httpConfigs, setHttpConfigs] = useState<Record<string, HttpRequestConfig>>({})
  const [parserConfigs, setParserConfigs] = useState<Record<string, ParserConfig>>({})
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
  const [isDragging, setIsDragging] = useState(false)
  const systemBlocksCacheRef = useRef<SystemBlock[] | null>(null)
  const graphCacheRef = useRef<Map<number, WorkflowGraphResponse>>(new Map())
  const [loopConfigs, setLoopConfigs] = useState<Record<string, LoopConfig>>({})
  const [waitConfigs, setWaitConfigs] = useState<Record<string, WaitConfig>>({})
  const [textTransformConfigs, setTextTransformConfigs] = useState<Record<string, TextTransformConfig>>({})
  const [textReplaceConfigs, setTextReplaceConfigs] = useState<Record<string, TextReplaceConfig>>({})
  const { theme, toggleTheme } = useThemePreference()
  const { language } = useLanguagePreference()
  const navigate = useNavigate()
  const editorCopy = language === 'pl'
    ? {
        back: 'Powrót do workflowów',
        subtitle: 'Projektuj bloki i połączenia w React Flow.',
        untitled: 'Workflow'
      }
    : {
        back: 'Back to workflows',
        subtitle: 'Design blocks and connections with React Flow.',
        untitled: 'Workflow'
      }

  const [nodes, setNodes] = useState<Array<Node<NodeData>>>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const closeTimer = useRef<number | null>(null)
  const lastEdgeMenu = useRef<typeof edgeMenu>(null)
  const lastNodeMenu = useRef<typeof nodeMenu>(null)
  const lastSelectionMenu = useRef<typeof selectionMenu>(null)
  const lastCanvasMenu = useRef<typeof canvasMenu>(null)
  const lastMenuType = useRef<'edge' | 'node' | 'selection' | 'canvas' | null>(null)

  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        window.clearTimeout(closeTimer.current)
      }
    }
  }, [])

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
    if (isDragging) return
    setNodes((current) =>
      current.map((node) => {
        if (node.data.blockType !== 'Switch') return node
        const config = switchConfigs[node.id]
        const cases = config ? normalizeSwitchCases(config.cases) : ['']
        const existing = node.data.switchCases ?? []
        const sameLength = existing.length === cases.length
        const sameValues = sameLength && existing.every((value: string, idx: number) => value === cases[idx])
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
  }, [isDragging, setNodes, switchConfigs])

  useEffect(() => {
    if (isDragging) return
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
  }, [isDragging, nodes, setEdges, switchConfigs])

  const pushToast = useCallback((message: string) => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, message }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3500)
  }, [])

  const markDirty = useCallback(() => {
    setHasUnsavedChanges((current) => (current ? current : true))
    setSaveStatus((current) => (current === 'Unsaved changes' ? current : 'Unsaved changes'))
  }, [])

  const {
    historyRef,
    initialSnapshotCaptured,
    pushHistory,
    undoHistory: undoHistoryBase,
    copySelection: copySelectionBase,
    pasteClipboard: pasteClipboardBase,
  } = useWorkflowHistory({ nodes, edges, setNodes, setEdges, markDirty })

  const undoHistory = useCallback(() => {
    undoHistoryBase()
    setSelectedNodeIds([])
    setEdgeMenu(null)
    setNodeMenu(null)
    setSelectionMenu(null)
    setCanvasMenu(null)
    setPendingSelection(null)
    setShowPalette(false)
    setShowVariables(false)
    setConfigPanel(null)
  }, [setEdges, setNodes, undoHistoryBase])

  const copySelection = useCallback(() => {
    if (selectedNodeIds.length === 0) return
    copySelectionBase(selectedNodeIds)
  }, [copySelectionBase, selectedNodeIds])

  const pasteClipboard = useCallback(() => {
    const clipboard = pasteClipboardBase()
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

      try {
        setGraphLoading(true)
        let graph = graphCacheRef.current.get(workflow.id)
        if (!graph) {
          const response = await fetch(`${apiBase}/api/Workflow/${workflow.id}/graph`)
          if (!response.ok) {
            throw new Error(`Failed to load workflow graph (${response.status})`)
          }
          graph = (await response.json()) as WorkflowGraphResponse
          graphCacheRef.current.set(workflow.id, graph)
        }
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

          if (blockType === 'HttpRequest' && block.jsonConfig) {
            try {
              const parsed = JSON.parse(block.jsonConfig) as {
                Method?: HttpRequestConfig['method']
                Url?: string
                Body?: string
                Headers?: Array<{ name?: string; value?: string }>
                AuthType?: HttpRequestAuthType
                BearerToken?: string
                BasicUsername?: string
                BasicPassword?: string
                ApiKeyName?: string
                ApiKeyValue?: string
                ResponseVariable?: string
              }
              setHttpConfigs((current) => ({
                ...current,
                [nodeId]: {
                  method: parsed.Method ?? 'GET',
                  url: parsed.Url ?? '',
                  body: parsed.Body ?? '',
                  headers: (parsed.Headers ?? [])
                    .map((item) => ({
                      name: (item.name ?? '').trim(),
                      value: (item.value ?? '').trim(),
                    }))
                    .filter((h) => h.name || h.value),
                  authType: parsed.AuthType ?? 'none',
                  bearerToken: parsed.BearerToken ?? '',
                  basicUsername: parsed.BasicUsername ?? '',
                  basicPassword: parsed.BasicPassword ?? '',
                  apiKeyName: parsed.ApiKeyName ?? '',
                  apiKeyValue: parsed.ApiKeyValue ?? '',
                  responseVariable: parsed.ResponseVariable ?? '',
                },
              }))
            } catch {
              // ignore parse errors
            }
          }

          if (blockType === 'Parser' && block.jsonConfig) {
            try {
              const parsed = JSON.parse(block.jsonConfig) as {
                Format?: ParserBlockFormat
                SourceVariable?: string
                Mappings?: Array<{ path?: string; variable?: string }>
              }
              setParserConfigs((current) => ({
                ...current,
                [nodeId]: {
                  format: parsed.Format ?? 'json',
                  sourceVariable: parsed.SourceVariable ?? '',
                  mappings:
                    parsed.Mappings
                      ?.map((item) => ({
                        path: (item.path ?? '').trim(),
                        variable: (item.variable ?? '').trim(),
                      }))
                      .filter((m) => m.path.length > 0 && m.variable.length > 0) ?? [],
                },
              }))
            } catch
            {
              // ignore parse errors
            }
          }
          if (blockType === 'TextTransform' && block.jsonConfig) {
            try {
              const parsed = JSON.parse(block.jsonConfig) as {
                Input?: string
                InputVariable?: string
                Operation?: TextTransformConfig['operation']
                ResultVariable?: string
              }
              setTextTransformConfigs((current) => ({
                ...current,
                [nodeId]: {
                  input: parsed.Input ?? '',
                  inputVariable: parsed.InputVariable ?? '',
                  operation: parsed.Operation ?? 'Trim',
                  resultVariable: parsed.ResultVariable ?? 'result',
                },
              }))
            } catch {
              // ignore parse errors
            }
          }
          if (blockType === 'Loop' && block.jsonConfig) {
            try
            {
              const parsed = JSON.parse(block.jsonConfig) as {
                Iterations?: number
              }
              setLoopConfigs((current) => ({
                ...current,
                [nodeId]: {
                  iterations: parsed.Iterations ?? 1,
                },
              }))
            } catch
            {
              // ignore parse errors
            }
          }
          if (blockType === 'Wait' && block.jsonConfig) {
            try {
              const parsed = JSON.parse(block.jsonConfig) as {
                DelayMs?: number
                DelayVariable?: string
              }
              setWaitConfigs((current) => ({
                ...current,
                [nodeId]: {
                  delayMs: parsed.DelayMs ?? 0,
                  delayVariable: parsed.DelayVariable ?? '',
                },
              }))
            } catch {
              // ignore parse errors
            }
          }
          if (blockType === 'TextReplace' && block.jsonConfig) {
            try {
              const parsed = JSON.parse(block.jsonConfig) as {
                Input?: string
                InputVariable?: string
                ResultVariable?: string
                Replacements?: Array<{ From?: string; To?: string; UseRegex?: boolean; IgnoreCase?: boolean }>
              }
              setTextReplaceConfigs((current) => ({
                ...current,
                [nodeId]: {
                  input: parsed.Input ?? '',
                  inputVariable: parsed.InputVariable ?? '',
                  resultVariable: parsed.ResultVariable ?? 'result',
                  replacements:
                    parsed.Replacements?.map((item) => ({
                      from: item.From ?? '',
                      to: item.To ?? '',
                      useRegex: item.UseRegex ?? false,
                      ignoreCase: item.IgnoreCase ?? false,
                    })) ?? [{ from: '', to: '', useRegex: false, ignoreCase: false }],
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
          const isLoop = sourceType === 'Loop'
          const baseColor =
            isIf && connection.connectionType === 'Error'
              ? '#d64545'
              : isIf && connection.connectionType === 'Success'
                ? '#2f9e68'
                : DEFAULT_EDGE_COLOR
          const sourceHandle = isIf
            ? connection.connectionType === 'Error'
              ? 'error'
              : 'success'
            : isLoop
              ? connection.connectionType === 'Error'
                ? 'error'
                : 'loop'
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
          if (isLoop && !edgeLabel) {
            edgeLabel = connection.connectionType === 'Error' ? 'Exit' : 'Loop'
          }
          return {
            id: `edge-${connection.id}`,
            source: blockIdMap.get(connection.sourceBlockId)!,
            target: blockIdMap.get(connection.targetBlockId)!,
            sourceHandle: switchHandle ?? sourceHandle,
            animated: true,
            type: 'smoothstep',
            markerEnd: { type: 'arrowclosed' as MarkerType, color: baseColor },
            style: {
              stroke: baseColor,
              strokeWidth: 2.5,
              ...edgeBaseStyle,
              ...(isIf && connection.connectionType === 'Error' ? { strokeDasharray: '6 4' } : {}),
            },
            ...edgeLabelStyle,
            data: edgeData ?? (connection.Label ? { label: connection.Label } : undefined),
            label: edgeLabel,
          }
        })

        if (!cancelled) {
          setNodes(loadedNodes)
          setEdges(loadedEdges)
          setHasUnsavedChanges(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load workflow graph')
        }
      } finally {
        if (!cancelled) {
          setGraphLoading(false)
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
      const cached = systemBlocksCacheRef.current
      if (cached && cached.some((block) => block.type === 'Loop') && cached.some((block) => block.type === 'Wait')) {
        setSystemBlocks(cached)
        return
      }
      try {
        const response = await fetch(`${apiBase}/api/SystemBlock`)
        if (!response.ok) {
          throw new Error(`Failed to load system blocks (${response.status})`)
        }
        const data = (await response.json()) as unknown
        if (!cancelled) {
          const normalized = normalizeValues<SystemBlock>(data)
          systemBlocksCacheRef.current = normalized
          setSystemBlocks(normalized)
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

  const onNodesMutate = useCallback(
    (changes: NodeChange[]) => {
      if (isDragging) return
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
    },
    [isDragging, markDirty, pushHistory],
  )

  const onEdgesMutate = useCallback(
    (changes: EdgeChange[]) => {
      const shouldMark = changes.some((change) => change.type !== 'select')
      if (shouldMark) {
        pushHistory()
        markDirty()
      }
    },
    [markDirty, pushHistory],
  )

  const getBlockType = useCallback(
    (nodeId: string) =>
      nodes.find((node) => node.id === nodeId)?.data?.blockType as string | undefined,
    [nodes],
  )

  const canBeSource = useCallback((blockType?: string) => blockType !== 'End', [])
  const canBeTarget = useCallback((blockType?: string) => blockType !== 'Start', [])

  const edgeBaseStyle = useMemo(
    () => ({
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
    }),
    [],
  )

  const edgeLabelStyle = useMemo(
    () => ({
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 10,
      labelBgStyle: { fill: 'rgba(0,0,0,0.55)', stroke: 'none' },
      labelStyle: { fill: '#fff', fontWeight: 600, fontSize: 11 },
    }),
    [],
  )

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
        const isIf = sourceType === 'If'
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
        } else if (sourceType === 'Loop') {
          if (!hasOutgoingForHandle(sourceId, 'loop')) {
            sourceHandle = 'loop'
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
            ? '#d64545'
            : sourceType === 'If' && sourceHandle === 'success'
              ? '#2f9e68'
              : DEFAULT_EDGE_COLOR
        pushHistory()
        setEdges((current) => {
          const newEdge: Edge = {
            id: `${sourceId}-${targetId}-${Date.now()}`,
            source: sourceId,
            target: targetId,
            sourceHandle,
            animated: true,
            type: 'smoothstep',
            style: {
              stroke: baseColor,
              strokeWidth: 2.5,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
              ...(isIf && sourceHandle === 'error' ? { strokeDasharray: '6 4' } : {}),
            },
            markerEnd: { type: 'arrowclosed' as MarkerType, color: baseColor },
            labelBgPadding: [6, 4],
            labelBgBorderRadius: 10,
            labelBgStyle: { fill: 'rgba(0,0,0,0.55)', stroke: 'none' },
            labelStyle: { fill: '#fff', fontWeight: 600, fontSize: 11 },
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
          }
          return [...current, newEdge]
        })
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
      const connectionSourceHandle = connection.sourceHandle ?? undefined
      if (connection.source && hasOutgoingForHandle(connection.source, connectionSourceHandle)) {
        pushToast('This output already has a connection.')
        return
      }
      const sourceNode = nodes.find((node) => node.id === connection.source)
      const isIf = sourceNode?.data.blockType === 'If'
      const isSwitch = sourceNode?.data.blockType === 'Switch'
      const baseColor =
        isIf && connection.sourceHandle === 'error'
          ? '#d64545'
          : isIf && connection.sourceHandle === 'success'
            ? '#2f9e68'
            : DEFAULT_EDGE_COLOR
      let label: string | undefined
      let caseValue: string | undefined
      if (isSwitch) {
        const handleId = connectionSourceHandle ?? ''
        const cases = switchConfigs[sourceNode?.id ?? '']?.cases ?? []
        if (handleId.startsWith('case-')) {
          const parts = handleId.split('-')
          const index = Number(parts[1]) - 1
          const value = index >= 0 ? cases[index] ?? '' : ''
          caseValue = value.trim()
          label = caseValue
          const display = index >= 0 ? formatSwitchEdgeLabel(index, caseValue) : caseValue
          label = (display ?? caseValue) || undefined
        } else if (handleId === 'default') {
          caseValue = ''
          label = ''
          label = 'Default'
        }
      }
      pushHistory()
      setEdges((current) => {
        const newEdge: Edge = {
          id: `${connectionKey}-${Date.now()}`,
          source: connection.source ?? '',
          target: connection.target ?? '',
          sourceHandle: connection.sourceHandle ?? undefined,
          targetHandle: connection.targetHandle ?? undefined,
          animated: true,
          type: 'smoothstep',
          style: {
            stroke: baseColor,
            strokeWidth: 2.5,
            strokeLinecap: 'round' as const,
            strokeLinejoin: 'round' as const,
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
            ...(connection.sourceHandle === 'error' ? { strokeDasharray: '6 4' } : {}),
          },
          markerEnd: { type: 'arrowclosed' as MarkerType, color: baseColor },
          labelBgPadding: [6, 4],
          labelBgBorderRadius: 10,
          labelBgStyle: { fill: 'rgba(0,0,0,0.55)', stroke: 'none' },
          labelStyle: { fill: '#fff', fontWeight: 600, fontSize: 11 },
          data:
            label !== undefined
              ? { label, caseValue }
              : undefined,
          label: label && label.length > 0 ? label : undefined,
        }
        return [...current, newEdge]
      })
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
        systemBlocks.length === 0 ||
        systemBlocks.some((block) => block.type === template.type) ||
        template.type === 'Loop' ||
        template.type === 'Wait' ||
        template.type === 'TextTransform' ||
        template.type === 'TextReplace'
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
      if (template.type === 'HttpRequest') {
        setHttpConfigs((current) => ({
          ...current,
          [node.id]: {
            method: 'GET',
            url: '',
            body: '',
            headers: [],
            authType: 'none',
            bearerToken: '',
            basicUsername: '',
            basicPassword: '',
            apiKeyName: '',
            apiKeyValue: '',
            responseVariable: '',
          },
        }))
      }

      if (template.type === 'Parser') {
        setParserConfigs((current) => ({
          ...current,
          [node.id]: {
            format: 'json',
            sourceVariable: '',
            mappings: [],
          },
        }))
      }
      if (template.type === 'Switch') {
        setSwitchConfigs((current) => ({
          ...current,
          [node.id]: { expression: '', cases: [''] },
        }))
      }
      if (template.type === 'Loop') {
        setLoopConfigs((current) => ({
          ...current,
          [node.id]: { iterations: 1 },
        }))
      }
      if (template.type === 'Wait') {
        setWaitConfigs((current) => ({
          ...current,
          [node.id]: { delayMs: 1000, delayVariable: '' },
        }))
      }
      if (template.type === 'TextTransform') {
        setTextTransformConfigs((current) => ({
          ...current,
          [node.id]: { input: '', inputVariable: '', operation: 'Trim', resultVariable: 'result' },
        }))
      }
      if (template.type === 'TextReplace') {
        setTextReplaceConfigs((current) => ({
          ...current,
          [node.id]: {
            input: '',
            inputVariable: '',
            resultVariable: 'result',
            replacements: [{ from: '', to: '', useRegex: false, ignoreCase: false }],
          },
        }))
      }
      setShowPalette(false)
      setPaletteSearch('')
      setPaletteCategory('All')
      markDirty()
    },
    [
      markDirty,
      nodes,
      openConfig,
      pushHistory,
      setNodes,
      setSaveStatus,
      setSwitchConfigs,
      systemBlocks,
    ],
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
    return templates.filter(
      (template) =>
        allowed.has(template.type) ||
        template.type === 'Loop' ||
        template.type === 'Wait' ||
        template.type === 'TextTransform' ||
        template.type === 'TextReplace',
    )
  }, [systemBlocks])

  const runDefaults = useMemo(() => {
    const defaults: Record<string, string> = {}
    variables.forEach((variable) => {
      defaults[variable.name] = variable.defaultValue ?? ''
    })
    return defaults
  }, [variables])

  const waitEstimateMs = useMemo(() => {
    const capMs = 300000
    let total = 0
    Object.values(waitConfigs).forEach((config) => {
      let delay = 0
      const variableName = (config.delayVariable ?? '').trim()
      if (variableName.length > 0) {
        const key = variableName.startsWith('$') ? variableName.slice(1) : variableName
        const raw = runInputs[key] ?? runDefaults[key]
        const parsed = Number(raw)
        if (Number.isFinite(parsed) && parsed > 0) {
          delay = parsed
        }
      }
      if (delay <= 0 && Number.isFinite(config.delayMs)) {
        delay = config.delayMs ?? 0
      }
      delay = Math.max(0, Math.min(delay, capMs))
      total += delay
    })
    return total
  }, [runDefaults, runInputs, waitConfigs])

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
    setSkipWaits(false)
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
      const response = await fetch(`${apiBase}/api/Workflow/${workflow.id}/run?skipWaits=${skipWaits ? 'true' : 'false'}`, {
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

        if (blockType === 'HttpRequest') {
          const config = httpConfigs[node.id]
          if (config) {
            jsonConfig = JSON.stringify({
              Method: config.method,
              Url: config.url,
              Body: config.body ?? '',
              Headers: config.headers.filter((h) => h.name || h.value),
              AuthType: config.authType,
              BearerToken: config.bearerToken ?? '',
              BasicUsername: config.basicUsername ?? '',
              BasicPassword: config.basicPassword ?? '',
              ApiKeyName: config.apiKeyName ?? '',
              ApiKeyValue: config.apiKeyValue ?? '',
              ResponseVariable: config.responseVariable ?? '',
            })
          }
        }

        if (blockType === 'Parser') {
          const config = parserConfigs[node.id]
          if (config) {
            jsonConfig = JSON.stringify({
              Format: config.format,
              SourceVariable: config.sourceVariable,
              Mappings: config.mappings,
            })
          }
        }

        if (blockType === 'Loop') {
            const config = loopConfigs[node.id]
            if (config) {
              jsonConfig = JSON.stringify({
                Iterations: config.iterations,
              })
            }
          }

      if (blockType === 'Wait') {
        const config = waitConfigs[node.id]
        if (config) {
          jsonConfig = JSON.stringify({
            DelayMs: config.delayMs ?? 0,
            DelayVariable: config.delayVariable ?? '',
          })
        }
      }

      if (blockType === 'TextTransform') {
        const config = textTransformConfigs[node.id]
        if (config) {
          jsonConfig = JSON.stringify({
            Input: config.input ?? '',
            InputVariable: config.inputVariable ?? '',
            Operation: config.operation,
            ResultVariable: config.resultVariable ?? 'result',
          })
        }
      }

      if (blockType === 'TextReplace') {
        const config = textReplaceConfigs[node.id]
        if (config) {
          jsonConfig = JSON.stringify({
            Input: config.input ?? '',
            InputVariable: config.inputVariable ?? '',
            ResultVariable: config.resultVariable ?? 'result',
            Replacements: (config.replacements ?? []).map((rule: TextReplaceRule) => ({
              From: rule.from ?? '',
              To: rule.to ?? '',
              UseRegex: rule.useRegex ?? false,
              IgnoreCase: rule.ignoreCase ?? false,
            })),
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
        if (sourceNode?.data.blockType === 'If' || sourceNode?.data.blockType === 'Loop') {
          if (edge.sourceHandle === 'error') {
            connectionType = 'Error'
          } else if (edge.sourceHandle === 'success' || edge.sourceHandle === 'loop') {
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
      try {
        await requestJson(`/api/WorkflowRevision/workflow/${workflow.id}`, withJson({ label: null }))
      } catch (err) {
        console.warn('Failed to auto-create revision', err)
      }
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
          <Suspense fallback={<div className="editor-topbar" />}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                className="ghost"
                onClick={() => navigate('/')}
                style={{ justifySelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                aria-label="Back"
              >
                <span style={{ fontSize: 16 }}>←</span>
              </button>
              <EditorTopbar
                workflowName={workflow?.name ?? editorCopy.untitled}
                subtitle={editorCopy.subtitle}
                saveStatus={saveStatus}
                saving={saving}
                workflowLoading={workflowLoading}
                theme={theme}
                onToggleTheme={toggleTheme}
                onSave={saveWorkflow}
                onRun={openRunPanel}
                onBack={() => navigate('/')}
              />
            </div>
          </Suspense>
          <div className="editor-main">
            <Suspense fallback={<div className="editor-sidebar" />}>
              <CanvasSidebar
                showPalette={showPalette}
                showVariables={showVariables}
                onTogglePalette={() => setShowPalette((open) => !open)}
                onToggleVariables={toggleVariables}
              />
            </Suspense>

            <Suspense fallback={<div className="canvas-wrapper" />}>
              <FlowCanvas
                nodes={nodes}
                setNodes={setNodes}
                edges={edges}
                setEdges={setEdges}
                snapToGrid={snapToGrid}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                workflowLoading={workflowLoading}
                graphLoading={graphLoading}
                onConnect={onConnect}
                onEdgeClick={onEdgeClick}
                onNodeClick={onNodeClick}
                onNodeContextMenu={onNodeContextMenu}
                onSelectionChange={onSelectionChange}
                onSelectionContextMenu={onSelectionContextMenu}
                onPaneClick={closeEdgeMenu}
                onPaneContextMenu={onPaneContextMenu}
                onToggleSnap={() => setSnapToGrid((enabled) => !enabled)}
                onNodesMutate={onNodesMutate}
                onEdgesMutate={onEdgesMutate}
              />
            </Suspense>
          </div>

          {showPalette && (
            <Suspense fallback={<div className="variables-drawer blocks-drawer" style={{ padding: 16 }}>Loading blocks...</div>}>
              <BlocksDrawer
                onClose={() => {
                  setShowPalette(false)
                  setPaletteSearch('')
                  setPaletteCategory('All')
                }}
                onCreate={addNode}
                search={paletteSearch}
                onSearchChange={setPaletteSearch}
                category={paletteCategory}
                onCategoryChange={setPaletteCategory}
                availableTemplates={availableTemplates}
              />
            </Suspense>
          )}

          {showVariables && (
            <Suspense fallback={<div className="variables-drawer" style={{ padding: 16 }}>Loading variables...</div>}>
              <VariablesDrawer
                variables={variables}
                variablesStatus={variablesStatus}
                variablesSaving={variablesSaving}
                variablesLocalError={variablesLocalError}
                newVariableName={newVariableName}
                newVariableDefault={newVariableDefault}
                editingVariableId={editingVariableId}
                editingVariableName={editingVariableName}
                editingVariableDefault={editingVariableDefault}
                onClose={toggleVariables}
                onCreate={createVariable}
                onUpdate={updateVariable}
                onDelete={deleteVariable}
                onStartEdit={startVariableEdit}
                onCancelEdit={cancelVariableEdit}
                setNewVariableName={setNewVariableName}
                setNewVariableDefault={setNewVariableDefault}
                setEditingVariableName={setEditingVariableName}
                setEditingVariableDefault={setEditingVariableDefault}
                markDirty={markDirty}
              />
            </Suspense>
          )}

          <Suspense fallback={null}>
            <ContextMenus
              edgeMenu={edgeMenu}
              nodeMenu={nodeMenu}
              selectionMenu={selectionMenu}
              canvasMenu={canvasMenu}
              closingMenu={closingMenu}
              lastEdgeMenu={lastEdgeMenu.current}
              lastNodeMenu={lastNodeMenu.current}
              lastSelectionMenu={lastSelectionMenu.current}
              lastCanvasMenu={lastCanvasMenu.current}
              selectedCount={selectedNodeIds.length}
              onDeleteEdge={deleteEdge}
              onDeleteNode={deleteNode}
              onDeleteSelection={deleteSelection}
              onDuplicateSelection={duplicateSelection}
              onSelectAll={selectAllNodes}
              onClose={closeEdgeMenu}
              onOpenPalette={() => {
                setShowPalette(true)
                setCanvasMenu(null)
              }}
            />
          </Suspense>
        </div>
      )}

      {configPanel && (
        <Suspense
          fallback={
            <aside className="config-drawer">
              <div className="drawer-header">
                <p className="drawer-title">{configPanel.label} settings</p>
                <span className="drawer-subtitle">{configPanel.blockType} block</span>
              </div>
            </aside>
          }
        >
          <ConfigDrawer
            panel={configPanel as ConfigPanelState}
            variables={variables}
            startConfigs={startConfigs}
            setStartConfigs={setStartConfigs}
            ifConfigs={ifConfigs}
            setIfConfigs={setIfConfigs}
            switchConfigs={switchConfigs}
            setSwitchConfigs={setSwitchConfigs}
            loopConfigs={loopConfigs}
            setLoopConfigs={setLoopConfigs}
            waitConfigs={waitConfigs}
            setWaitConfigs={setWaitConfigs}
            textTransformConfigs={textTransformConfigs}
            setTextTransformConfigs={setTextTransformConfigs}
            textReplaceConfigs={textReplaceConfigs}
            setTextReplaceConfigs={setTextReplaceConfigs}
            calculationConfigs={calculationConfigs}
            setCalculationConfigs={setCalculationConfigs}
            httpConfigs={httpConfigs}
            setHttpConfigs={setHttpConfigs}
            parserConfigs={parserConfigs}
            setParserConfigs={setParserConfigs}
            normalizeSwitchCases={normalizeSwitchCases}
            formatVariableDisplay={formatVariableDisplay}
            normalizeVariableName={normalizeVariableName}
            setNodes={setNodes}
            setPanelLabel={(label) => setConfigPanel((current) => (current ? { ...current, label } : current))}
            markDirty={markDirty}
            onClose={closeConfig}
          />
        </Suspense>
      )}



      {runOpen && (
        <Suspense
          fallback={
            <aside className="config-drawer">
              <div className="drawer-header">
                <p className="drawer-title">Run workflow</p>
                <span className="drawer-subtitle">{workflow?.name}</span>
              </div>
            </aside>
          }
        >
          <RunDrawer
            workflowId={workflow?.id}
            workflowName={workflow?.name}
            variables={variables}
            runInputs={runInputs}
            setRunInputs={setRunInputs}
            running={running}
            runError={runError}
            runResult={runResult}
            skipWaits={skipWaits}
            setSkipWaits={setSkipWaits}
            estimatedWaitMs={waitEstimateMs}
            showRunSnippet={showRunSnippet}
            setShowRunSnippet={setShowRunSnippet}
            showRunInputs={showRunInputs}
            setShowRunInputs={setShowRunInputs}
            onRun={runWorkflow}
            onClose={() => setRunOpen(false)}
          />
        </Suspense>
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
