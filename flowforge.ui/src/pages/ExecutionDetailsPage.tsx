import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

type Execution = {
  id: number
  executedAt: string
  inputData?: Record<string, string> | null
  resultData?: Record<string, string> | null
  path?: string[] | null
  actions?: string[] | null
  workflowId: number
  workflow?: {
    id: number
    name: string
  }
}

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export default function ExecutionDetailsPage() {
  const { id } = useParams()
  const executionId = Number(id)
  const [execution, setExecution] = useState<Execution | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
    if (loading) return 'Loading execution...'
    if (error) return error
    if (!execution) return 'Execution not found.'
    return ''
  }, [error, execution, loading])

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
            Workflows
          </button>
          <button type="button" className="nav-item" onClick={() => navigate('/blocks')}>
            Blocks
          </button>
          <button type="button" className="nav-item active" onClick={() => navigate('/executions')}>
            Executions
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
            <h1>Execution #{execution?.id ?? executionId}</h1>
            <p className="subtitle">Full run details and outputs.</p>
          </div>
          <div className="topbar-meta">
            <span className="count">
              {execution ? new Date(execution.executedAt).toLocaleString() : '—'}
            </span>
            <span className="pill">Run</span>
          </div>
        </header>

        {status ? (
          <div className="state">{status}</div>
        ) : (
          <>
            <section className="panel">
              <div className="panel-header">
                <h2>Overview</h2>
                <p className="muted">Workflow and run metadata.</p>
              </div>
              <div className="execution-grid">
                <div className="execution-card">
                  <p className="label">Workflow</p>
                  <p className="meta">
                    {execution?.workflow?.name ?? `Workflow #${execution?.workflowId}`}
                  </p>
                </div>
                <div className="execution-card">
                  <p className="label">Executed at</p>
                  <p className="meta">
                    {execution ? new Date(execution.executedAt).toLocaleString() : '—'}
                  </p>
                </div>
                <div className="execution-card">
                  <p className="label">Path length</p>
                  <p className="meta">{execution?.path?.length ?? 0}</p>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>Inputs</h2>
                <p className="muted">Variables passed into the run.</p>
              </div>
              <div className="drawer-empty">
                <pre className="meta">
                  {JSON.stringify(execution?.inputData ?? {}, null, 2)}
                </pre>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>Results</h2>
                <p className="muted">Output variables produced by the workflow.</p>
              </div>
              <div className="drawer-empty">
                <pre className="meta">
                  {JSON.stringify(execution?.resultData ?? {}, null, 2)}
                </pre>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>Path</h2>
                <p className="muted">Order of block execution.</p>
              </div>
              <div className="state">
                {execution?.path && execution.path.length > 0
                  ? execution.path.join(' → ')
                  : 'No path recorded.'}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>Actions</h2>
                <p className="muted">Detailed execution logs.</p>
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
                <div className="state">No actions recorded.</div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
