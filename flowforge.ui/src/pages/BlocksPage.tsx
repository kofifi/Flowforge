import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguagePreference } from '../hooks/useLanguagePreference'
import { useThemePreference } from '../hooks/useThemePreference'
import Icon from '../components/Icon'
import ReactFlow, { type Node, Background, ReactFlowProvider } from 'reactflow'
import 'reactflow/dist/style.css'
import FlowNode from '../components/editor/FlowNode'
import ConfigDrawer, { type ConfigPanelState } from '../components/editor/ConfigDrawer'
import type { WorkflowVariable } from '../components/editor/configTypes'

type BlockMeta = {
  plLabel: string
  enLabel: string
  plDesc: string
  enDesc: string
  ports: { inputs: string[]; outputs: string[] }
  fields: Array<{ name: string; pl: string; en: string; defaultValue?: string }>
}

type SystemBlock = {
  id: number
  type: string
  description: string
}

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

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

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<SystemBlock[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [drawerPanel, setDrawerPanel] = useState<{ panel: ConfigPanelState; meta: BlockMeta } | null>(null)

  // tryb tylko do podglądu – przekazujemy puste kolekcje i no-op settery
  const emptyVariables: WorkflowVariable[] = []
  const noop = () => {}
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { language } = useLanguagePreference()
  const { theme, toggleTheme } = useThemePreference()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    async function loadBlocks() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${apiBase}/api/SystemBlock`)
        if (!response.ok) {
          throw new Error(`Failed to load system blocks (${response.status})`)
        }
        const data = (await response.json()) as unknown
        if (!cancelled) {
          setBlocks(normalizeValues<SystemBlock>(data))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load system blocks')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadBlocks()

    return () => {
      cancelled = true
    }
  }, [])

  const previewNodeTypes = useMemo(() => ({ preview: FlowNode }), [])
  const normalizeSwitchCases = (values: unknown) => (Array.isArray(values) ? values.filter(Boolean).map(String) : [''])
  const formatVariableDisplay = (value: string) => value
  const normalizeVariableName = (value: string) => value?.replace(/\s+/g, '') ?? ''
  const markDirty = () => {}

  const openDrawer = (meta: BlockMeta, blockId: number, blockType: string) => {
    setDrawerPanel({
      meta,
      panel: {
        id: `preview-${blockId}`,
        blockType,
        label: language === 'pl' ? meta.plLabel : meta.enLabel,
      },
    })
  }

  const status = useMemo(() => {
    if (loading) return 'Loading system blocks...'
    if (error) return error
    if (blocks.length === 0) return 'No system blocks found.'
    return ''
  }, [blocks.length, error, loading])

  const translations = useMemo<Record<string, BlockMeta>>(
    () => ({
      Start: {
        plLabel: 'Start',
        enLabel: 'Start',
        plDesc: 'Blok początkowy przepływu.',
        enDesc: 'Entry point of the flow.',
      ports: { inputs: [], outputs: ['out'] },
      fields: []
    },
    End: {
      plLabel: 'Koniec',
      enLabel: 'End',
      plDesc: 'Blok kończący przepływ.',
      enDesc: 'Terminates the flow.',
      ports: { inputs: ['in'], outputs: [] },
      fields: []
    },
    Calculation: {
      plLabel: 'Kalkulacja',
      enLabel: 'Calculation',
      plDesc: 'Operacje arytmetyczne/wyrażenia na zmiennych.',
      enDesc: 'Performs arithmetic/expressions on variables.',
      ports: { inputs: ['in'], outputs: ['out'] },
      fields: [
        { name: 'expression', pl: 'Wyrażenie (np. result = a + b)', en: 'Expression (e.g., result = a + b)' }
      ]
    },
    If: {
      plLabel: 'If',
      enLabel: 'If',
      plDesc: 'Rozgałęzienie warunkowe (true/false).',
      enDesc: 'Conditional branch (true/false).',
      ports: { inputs: ['in'], outputs: ['true', 'false'] },
      fields: [{ name: 'condition', pl: 'Warunek logiczny (np. $.status == 200)', en: 'Logical condition (e.g., $.status == 200)' }]
    },
    Switch: {
      plLabel: 'Switch',
      enLabel: 'Switch',
      plDesc: 'Rozgałęzienie na podstawie wartości (case).',
      enDesc: 'Branching based on value (case).',
      ports: { inputs: ['in'], outputs: ['case 1..n', 'default'] },
      fields: [
        { name: 'expression', pl: 'Wyrażenie wybierające gałąź', en: 'Expression selecting the branch' },
        { name: 'cases', pl: 'Lista dopasowań case -> gałąź', en: 'Case list mapping to outputs' }
      ]
    },
    HttpRequest: {
      plLabel: 'HTTP',
      enLabel: 'HttpRequest',
      plDesc: 'Wywołanie HTTP (GET/POST itp.).',
      enDesc: 'HTTP request (GET/POST etc.).',
      ports: { inputs: ['in'], outputs: ['success', 'error'] },
      fields: [
        { name: 'method', pl: 'Metoda (GET/POST/PUT/DELETE)', en: 'Method (GET/POST/PUT/DELETE)', defaultValue: 'GET' },
        { name: 'url', pl: 'Adres URL', en: 'Request URL' },
        { name: 'headers', pl: 'Nagłówki (JSON)', en: 'Headers (JSON)' },
        { name: 'body', pl: 'Treść żądania', en: 'Request body' }
      ]
    },
    Parser: {
      plLabel: 'Parser',
      enLabel: 'Parser',
      plDesc: 'Parsuje JSON/XML do zmiennych.',
      enDesc: 'Parses JSON/XML into variables.',
      ports: { inputs: ['in'], outputs: ['out'] },
      fields: [
        { name: 'format', pl: 'Format wejścia (json/xml)', en: 'Input format (json/xml)', defaultValue: 'json' },
        { name: 'path', pl: 'Ścieżka/wyrażenie do pobrania danych', en: 'Path/expression to extract data' }
      ]
    },
    Loop: {
      plLabel: 'Pętla',
      enLabel: 'Loop',
      plDesc: 'Powtarza podprzepływ wielokrotnie.',
      enDesc: 'Repeats a subflow multiple times.',
      ports: { inputs: ['in'], outputs: ['next', 'done'] },
      fields: [
        { name: 'iterations', pl: 'Liczba iteracji lub kolekcja', en: 'Iteration count or collection' },
        { name: 'iterator', pl: 'Nazwa zmiennej iteratora', en: 'Iterator variable name' }
      ]
    },
    Wait: {
      plLabel: 'Wait',
      enLabel: 'Wait',
      plDesc: 'Wstrzymuje wykonanie na zadany czas.',
      enDesc: 'Pauses execution for a specified time.',
        ports: { inputs: ['in'], outputs: ['out'] },
        fields: [{ name: 'delayMs', pl: 'Opóźnienie w milisekundach', en: 'Delay in milliseconds' }]
      },
      TextTransform: {
        plLabel: 'Text Transform',
      enLabel: 'Text Transform',
      plDesc: 'Proste operacje na tekście (trim/lower/upper).',
      enDesc: 'Basic text ops (trim/lower/upper).',
      ports: { inputs: ['in'], outputs: ['out'] },
      fields: [
        { name: 'operation', pl: 'Operacja (Trim/Lower/Upper)', en: 'Operation (Trim/Lower/Upper)', defaultValue: 'Trim' },
        { name: 'input', pl: 'Tekst wejściowy (literal)', en: 'Input text (literal)' },
        { name: 'inputVariable', pl: 'Lub zmienna wejściowa', en: 'Or input variable' },
        { name: 'resultVariable', pl: 'Zmienna wyniku', en: 'Result variable', defaultValue: 'result' }
      ]
    },
    TextReplace: {
      plLabel: 'Text Replace',
      enLabel: 'Text Replace',
      plDesc: 'Zamiany fragmentów tekstu, opcjonalnie regex.',
      enDesc: 'Replace substrings, optionally via regex.',
      ports: { inputs: ['in'], outputs: ['out'] },
        fields: [
          { name: 'input', pl: 'Tekst wejściowy (literal)', en: 'Input text (literal)' },
          { name: 'inputVariable', pl: 'Lub zmienna wejściowa', en: 'Or input variable' },
          { name: 'replacements', pl: 'Reguły zamiany (from → to)', en: 'Replacement rules (from → to)' },
          { name: 'resultVariable', pl: 'Zmienna wyniku', en: 'Result variable', defaultValue: 'result' }
        ]
      }
    }),
    [],
  )

  const copy = language === 'pl'
    ? {
        navWorkflows: 'Workflowy',
        navBlocks: 'Bloki',
        navExecutions: 'Egzekucje',
        navScheduler: 'Scheduler',
        title: 'Systemowe bloki',
        subtitle: 'Bazowe typy bloków wraz z portami i polami konfiguracji.',
        statusLabel: 'Tylko podgląd',
        availableTitle: 'Dostępne bloki',
        availableSubtitle: 'Te bloki są zasiane przez backend.',
        customTitle: 'Bloki niestandardowe',
        customSubtitle: 'Edytor w przygotowaniu.',
        customState: 'Edytor bloków niestandardowych nie jest jeszcze dostępny.',
        systemPill: 'System'
      }
    : {
        navWorkflows: 'Workflows',
        navBlocks: 'Blocks',
        navExecutions: 'Executions',
        navScheduler: 'Scheduler',
        title: 'System blocks',
        subtitle: 'Core block types with ports and config fields.',
        statusLabel: 'Read-only',
        availableTitle: 'Available blocks',
        availableSubtitle: 'These are seeded by the backend.',
        customTitle: 'Custom blocks',
        customSubtitle: 'Editor is coming next.',
        customState: 'Custom block editor is not available yet.',
        systemPill: 'System'
      }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">F</span>
          <div>
            <p className="brand-name">Flowforge</p>
            <p className="brand-subtitle">Workflow Studio</p>
          </div>
        </div>
        <nav className="nav">
          <button type="button" className="nav-item" onClick={() => navigate('/')}>
            {copy.navWorkflows}
          </button>
          <button type="button" className="nav-item active">
            {copy.navBlocks}
          </button>
          <button type="button" className="nav-item" onClick={() => navigate('/executions')}>
            {copy.navExecutions}
          </button>
          <button type="button" className="nav-item" onClick={() => navigate('/scheduler')}>
            {copy.navScheduler}
          </button>
        </nav>
        <div className="sidebar-footer">
          <p>Connected to local API</p>
          <span className="pill">{apiBase || 'proxy /api'}</span>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{copy.title}</h1>
            <p className="subtitle">{copy.subtitle}</p>
          </div>
          <div className="topbar-meta">
            <button
              type="button"
              className="icon-button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <span className="count">{blocks.length} total</span>
            <span className="pill">{copy.statusLabel}</span>
          </div>
        </header>

        <section className="panel">
          <div className="panel-header">
            <h2>{copy.availableTitle}</h2>
            <p className="muted">{copy.availableSubtitle}</p>
          </div>

          {status ? (
            <div className="state">{status}</div>
          ) : (
            <ul className="blocks-list">
              {blocks.map((block) => {
                const meta = translations[block.type]
                const isOpen = expandedId === block.id
                return (
                  <li key={block.id} className="block-card">
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <p className="label">{language === 'pl' ? meta?.plLabel ?? block.type : meta?.enLabel ?? block.type}</p>
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => setExpandedId(isOpen ? null : block.id)}
                          style={{ padding: '2px 6px', fontSize: 12 }}
                        >
                          {isOpen ? 'Zwiń' : 'Pokaż więcej'}
                        </button>
                      </div>
                      <p className="meta">{language === 'pl' ? meta?.plDesc ?? block.description : meta?.enDesc ?? block.description}</p>
                      {isOpen && meta && (
                        <div className="block-details">
                          {(() => {
                            const previewNodes: Node[] = [
                              {
                                id: `preview-${block.id}`,
                                type: 'preview',
                                position: { x: 0, y: 0 },
                                  data: {
                                    blockType: block.type,
                                    label: language === 'pl' ? meta.plLabel : meta.enLabel,
                                    description: language === 'pl' ? meta.plDesc : meta.enDesc,
                                    allowErrorOutput: block.type === 'If',
                                    switchCases: block.type === 'Switch' ? ['case1', 'case2'] : undefined,
                                  onOpenConfig: () => openDrawer(meta, block.id, block.type),
                                },
                              },
                            ]
                            return (
                              <div className="block-section">
                                <div
                                  style={{
                                    position: 'relative',
                                    width: '100%',
                                    height: 240,
                                    maxWidth: '100%',
                                    border: '1px solid var(--border-soft)',
                                    borderRadius: 12,
                                    background: 'linear-gradient(135deg, rgba(46,59,55,0.12), rgba(79,106,96,0.08))',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <ReactFlowProvider>
                                    <ReactFlow
                                      nodes={previewNodes}
                                      edges={[]}
                                      nodeTypes={previewNodeTypes}
                                      fitView
                                      fitViewOptions={{ padding: 0.6, includeHiddenNodes: true }}
                                      style={{ width: '100%', height: '100%', maxWidth: '100%' }}
                                      nodesDraggable={false}
                                      nodesConnectable={false}
                                      elementsSelectable={false}
                                      onNodeClick={() => openDrawer(meta, block.id, block.type)}
                                      proOptions={{ hideAttribution: true }}
                                      panOnDrag={false}
                                      zoomOnScroll={false}
                                      zoomOnPinch={false}
                                      zoomOnDoubleClick={false}
                                      panOnScroll={false}
                                      minZoom={1}
                                      maxZoom={1}
                                    >
                                      <Background gap={20} size={1} color="var(--border-soft)" />
                                    </ReactFlow>
                                  </ReactFlowProvider>
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                    <span className="pill">{copy.systemPill}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>{copy.customTitle}</h2>
            <p className="muted">{copy.customSubtitle}</p>
          </div>
          <div className="state">{copy.customState}</div>
        </section>
      </main>

      {drawerPanel && (
        <>
          <div className="drawer-backdrop" onClick={() => setDrawerPanel(null)} />
          <ConfigDrawer
            panel={drawerPanel.panel}
            variables={emptyVariables}
            startConfigs={{}}
            setStartConfigs={noop}
            ifConfigs={{}}
            setIfConfigs={noop}
            switchConfigs={{}}
            setSwitchConfigs={noop}
            loopConfigs={{}}
            setLoopConfigs={noop}
            waitConfigs={{}}
            setWaitConfigs={noop}
            calculationConfigs={{}}
            setCalculationConfigs={noop}
            textTransformConfigs={{}}
            setTextTransformConfigs={noop}
            textReplaceConfigs={{}}
            setTextReplaceConfigs={noop}
            httpConfigs={{}}
            setHttpConfigs={noop}
            parserConfigs={{}}
            setParserConfigs={noop}
            normalizeSwitchCases={normalizeSwitchCases}
            formatVariableDisplay={formatVariableDisplay}
            normalizeVariableName={normalizeVariableName}
            setNodes={noop}
            setPanelLabel={(label) =>
              setDrawerPanel((curr) => (curr ? { ...curr, panel: { ...curr.panel, label } } : curr))
            }
            markDirty={markDirty}
            onClose={() => setDrawerPanel(null)}
          />
        </>
      )}
    </div>
  )
}
