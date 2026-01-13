import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useThemePreference } from '../hooks/useThemePreference'
import { useLanguagePreference } from '../hooks/useLanguagePreference'

type Execution = {
  id: number
  executedAt: string
  inputData?: Record<string, string> | null
  resultData?: Record<string, string> | null
  path?: unknown
  actions?: unknown
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
  if (value && typeof value === 'object' && '$values' in value && Array.isArray((value as any).$values)) {
    return (value as { $values: unknown[] }).$values.map(String)
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
  const { language, toggleLanguage } = useLanguagePreference()
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

  const flowSteps = useMemo(
    () =>
      normalizeList(execution?.path).map((label, index) => {
        const actions = normalizeList(execution?.actions)
        return {
          label,
          note: actions[index] ?? undefined,
          index: index + 1
        }
      }),
    [execution?.actions, execution?.path]
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
              onClick={toggleLanguage}
              aria-label={`Switch to ${language === 'pl' ? 'English' : 'Polish'}`}
            >
              {language === 'pl' ? 'PL' : 'EN'}
            </button>
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
                  <p className="meta">{execution?.path?.length ?? 0}</p>
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
              {execution?.actions && execution.actions.length > 0 ? (
                <ul className="executions-list">
                  {execution.actions.map((action, index) => (
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
