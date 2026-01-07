import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Execution = {
  id: number
  executedAt: string
  workflowId: number
  workflow?: {
    id: number
    name: string
  }
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

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<Execution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    async function loadExecutions() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${apiBase}/api/WorkflowExecution`)
        if (!response.ok) {
          throw new Error(`Failed to load executions (${response.status})`)
        }
        const data = (await response.json()) as unknown
        if (!cancelled) {
          setExecutions(normalizeValues<Execution>(data))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load executions')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadExecutions()

    return () => {
      cancelled = true
    }
  }, [])

  const status = useMemo(() => {
    if (loading) return 'Loading executions...'
    if (error) return error
    if (executions.length === 0) return 'No executions yet.'
    return ''
  }, [error, executions.length, loading])

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
          <button type="button" className="nav-item active">
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
            <h1>Executions</h1>
            <p className="subtitle">Recent workflow runs and timestamps.</p>
          </div>
          <div className="topbar-meta">
            <span className="count">{executions.length} total</span>
            <span className="pill">History</span>
          </div>
        </header>

        <section className="panel">
          <div className="panel-header">
            <h2>Execution history</h2>
            <p className="muted">Latest runs across all workflows.</p>
          </div>

          {status ? (
            <div className="state">{status}</div>
          ) : (
            <ul className="executions-list">
              {executions.map((execution) => (
                <li key={execution.id} className="execution-card">
                  <div>
                    <p className="label">
                      {execution.workflow?.name ?? `Workflow #${execution.workflowId}`}
                    </p>
                    <p className="meta">
                      Executed: {new Date(execution.executedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="card-actions">
                    <button
                      type="button"
                      onClick={() => navigate(`/executions/${execution.id}`)}
                    >
                      View details
                    </button>
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => navigate(`/workflows/${execution.workflowId}`)}
                    >
                      Open workflow
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
