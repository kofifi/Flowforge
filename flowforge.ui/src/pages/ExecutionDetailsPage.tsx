import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useThemePreference } from '../hooks/useThemePreference'
import { useLanguagePreference } from '../hooks/useLanguagePreference'
import Icon from '../components/Icon'

type Execution = {
  id: number
  executedAt: string
  inputData?: Record<string, string> | null
  resultData?: Record<string, string> | null
  path?: string[] | { $values?: string[] } | null
  actions?: string[] | { $values?: string[] } | null
  workflowId: number
  workflowName?: string
}

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

function normalizeList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String)
  if (value && typeof value === 'object' && '$values' in value) {
    const maybeValues = (value as { $values?: unknown[] }).$values
    if (Array.isArray(maybeValues)) {
      return maybeValues.map(String)
    }
  }
  return []
}

function parseJsonString(value: string) {
  const trimmed = value.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return value
  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

function normalizeDataMap(record: Record<string, string> | null | undefined) {
  if (!record) return {}
  return Object.fromEntries(
    Object.entries(record).map(([key, val]) => {
      if (typeof val === 'string') {
        return [key, parseJsonString(val)]
      }
      return [key, val]
    }),
  )
}

export default function ExecutionDetailsPage() {
  const { id } = useParams()
  const executionId = Number(id)
  const [execution, setExecution] = useState<Execution | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { language } = useLanguagePreference()
  const { theme, toggleTheme } = useThemePreference()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    async function loadExecution() {
      if (!Number.isFinite(executionId)) {
        setError('Invalid execution id.')
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${apiBase}/api/WorkflowExecution/${executionId}`)
        if (!response.ok) {
          throw new Error(`Failed to load execution (${response.status})`)
        }
        const data = (await response.json()) as Execution
        if (!cancelled) {
          setExecution(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load execution')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadExecution()

    return () => {
      cancelled = true
    }
  }, [executionId])

  const status = useMemo(() => {
    if (loading) return language === 'pl' ? 'Ładowanie egzekucji...' : 'Loading execution...'
    if (error) return error
    if (!execution) return language === 'pl' ? 'Egzekucja nie znaleziona.' : 'Execution not found.'
    return ''
  }, [error, execution, language, loading])

  const actionsList = useMemo(() => normalizeList(execution?.actions), [execution?.actions])
  const pathList = useMemo(() => normalizeList(execution?.path), [execution?.path])

  const flowSteps = useMemo(
    () =>
      pathList.map((label, index) => ({
        label,
        note: actionsList[index] ?? undefined,
        index: index + 1,
      })),
    [actionsList, pathList],
  )

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
            {language === 'pl' ? 'Workflowy' : 'Workflows'}
          </button>
          <button type="button" className="nav-item" onClick={() => navigate('/blocks')}>
            {language === 'pl' ? 'Bloki' : 'Blocks'}
          </button>
          <button type="button" className="nav-item active" onClick={() => navigate('/executions')}>
            {language === 'pl' ? 'Egzekucje' : 'Executions'}
          </button>
          <button type="button" className="nav-item" onClick={() => navigate('/scheduler')}>
            Scheduler
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
            <h1>
              {language === 'pl' ? 'Egzekucja' : 'Execution'} #{execution?.id ?? executionId}
            </h1>
            <p className="subtitle">
              {language === 'pl' ? 'Pełne szczegóły uruchomienia i wyniki.' : 'Full run details and outputs.'}
            </p>
          </div>
          <div className="topbar-meta">
            <span className="count">
              {execution ? formatDateTime(execution.executedAt) : '—'}
            </span>
            <span className="pill">{language === 'pl' ? 'Uruchomienie' : 'Run'}</span>
            <button
              type="button"
              className="icon-button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
          </div>
        </header>

        {status ? (
          <div className="state">{status}</div>
        ) : (
          <>
            <section className="panel">
              <div className="panel-header">
                <h2>{language === 'pl' ? 'Podsumowanie' : 'Overview'}</h2>
                <p className="muted">
                  {language === 'pl' ? 'Metadane workflow i uruchomienia.' : 'Workflow and run metadata.'}
                </p>
              </div>
              <div className="execution-grid">
                <div className="execution-card">
                  <p className="label">{language === 'pl' ? 'Workflow' : 'Workflow'}</p>
                  <p className="meta">
                    {execution?.workflowName ?? `Workflow #${execution?.workflowId}`}
                  </p>
                </div>
                <div className="execution-card">
                  <p className="label">{language === 'pl' ? 'Uruchomiono' : 'Executed at'}</p>
                  <p className="meta">
                    {execution ? formatDateTime(execution.executedAt) : '—'}
                  </p>
                </div>
                <div className="execution-card">
                  <p className="label">{language === 'pl' ? 'Długość ścieżki' : 'Path length'}</p>
                  <p className="meta">{pathList.length}</p>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>{language === 'pl' ? 'Wejścia' : 'Inputs'}</h2>
                <p className="muted">
                  {language === 'pl' ? 'Zmienne przekazane do uruchomienia.' : 'Variables passed into the run.'}
                </p>
              </div>
              <div className="drawer-empty">
                <pre className="meta">
                  {JSON.stringify(execution?.inputData ?? {}, null, 2)}
                </pre>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>{language === 'pl' ? 'Wyniki' : 'Results'}</h2>
                <p className="muted">
                  {language === 'pl' ? 'Zmienne wyjściowe wygenerowane przez workflow.' : 'Output variables produced by the workflow.'}
                </p>
              </div>
              <div className="drawer-empty">
                <pre className="meta">
                  {JSON.stringify(normalizeDataMap(execution?.resultData), null, 2)}
                </pre>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>{language === 'pl' ? 'Ścieżka' : 'Path'}</h2>
                <p className="muted">
                  {language === 'pl'
                    ? 'Kolejność wykonania bloków z podglądem przepływu.'
                    : 'Order of block execution with a quick flow map.'}
                </p>
              </div>
              {flowSteps.length > 0 ? (
                <div className="flow-wrapper">
                  <div className="flow-lane flow-scroll">
                    {flowSteps.map((step, idx) => (
                      <div key={`${step.label}-${idx}`} className="flow-segment">
                        <div className="flow-node">
                          <div className="flow-node-top">
                            <span className="flow-index">{step.index}</span>
                            <span className="flow-badge">Executed</span>
                          </div>
                          <span className="flow-label">{step.label}</span>
                          {step.note && <span className="flow-note">{step.note}</span>}
                        </div>
                        {idx < flowSteps.length - 1 && <div className="flow-connector" />}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="state">
                  {language === 'pl' ? 'Brak zarejestrowanej ścieżki.' : 'No path recorded.'}
                </div>
              )}
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>{language === 'pl' ? 'Akcje' : 'Actions'}</h2>
                <p className="muted">
                  {language === 'pl' ? 'Szczegółowy log wykonania.' : 'Detailed execution logs.'}
                </p>
              </div>
              {actionsList.length > 0 ? (
                <ul className="executions-list">
                  {actionsList.map((action, index) => (
                    <li key={`${action}-${index}`} className="execution-card">
                      <p className="meta">{action}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="state">
                  {language === 'pl' ? 'Brak zarejestrowanych akcji.' : 'No actions recorded.'}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
