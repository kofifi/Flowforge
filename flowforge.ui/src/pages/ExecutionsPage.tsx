import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Execution = {
  id: number
  executedAt: string
  workflowId: number
  workflowName?: string
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

function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<Execution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [workflowFilter, setWorkflowFilter] = useState<string>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
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

  const workflowOptions = useMemo(() => {
    const map = new Map<number, string>()
    executions.forEach((execution) => {
      const label = execution.workflowName ?? `Workflow #${execution.workflowId}`
      map.set(execution.workflowId, label)
    })
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [executions])

  const filteredExecutions = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()
    const parsedFrom = fromDate ? new Date(`${fromDate}T00:00:00`) : null
    const parsedTo = toDate ? new Date(`${toDate}T23:59:59.999`) : null

    const sorted = [...executions].sort((a, b) => {
      const aDate = new Date(a.executedAt).getTime()
      const bDate = new Date(b.executedAt).getTime()
      return sortBy === 'newest' ? bDate - aDate : aDate - bDate
    })

    return sorted.filter((execution) => {
      const label = execution.workflowName ?? `Workflow #${execution.workflowId}`
      const haystack = `${label} ${execution.workflowId}`.toLowerCase()
      const matchesSearch = !searchTerm || haystack.includes(searchTerm)
      const matchesWorkflow =
        workflowFilter === 'all' || String(execution.workflowId) === workflowFilter

      const executionDate = new Date(execution.executedAt)
      const isValidDate = !Number.isNaN(executionDate.getTime())
      const matchesFrom = !parsedFrom || (isValidDate && executionDate >= parsedFrom)
      const matchesTo = !parsedTo || (isValidDate && executionDate <= parsedTo)

      return matchesSearch && matchesWorkflow && matchesFrom && matchesTo
    })
  }, [executions, fromDate, search, sortBy, toDate, workflowFilter])

  const status = useMemo(() => {
    if (loading) return 'Loading executions...'
    if (error) return error
    if (executions.length === 0) return 'No executions yet.'
    if (filteredExecutions.length === 0) return 'No matches for current filters.'
    return ''
  }, [error, executions.length, filteredExecutions.length, loading])

  function setQuickRange(days: number) {
    const now = new Date()
    const from = new Date(now)
    from.setDate(now.getDate() - (days - 1))
    const toIso = now.toISOString().slice(0, 10)
    const fromIso = from.toISOString().slice(0, 10)
    setFromDate(fromIso)
    setToDate(toIso)
  }

  function resetFilters() {
    setSearch('')
    setWorkflowFilter('all')
    setFromDate('')
    setToDate('')
    setSortBy('newest')
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
            <p className="muted">
              Search and filter workflow runs by name, date, or recency.
            </p>
          </div>

          <div className="filter-bar">
            <div className="filter-grid">
              <label className="filter-group">
                <span>Search</span>
                <input
                  type="text"
                  placeholder="Search by workflow name or id..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>

              <label className="filter-group">
                <span>Workflow</span>
                <select
                  value={workflowFilter}
                  onChange={(e) => setWorkflowFilter(e.target.value)}
                >
                  <option value="all">All workflows</option>
                  {workflowOptions.map(([id, label]) => (
                    <option key={id} value={String(id)}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="filter-group">
                <span>Executed between</span>
                <div className="date-range">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    aria-label="Executed from"
                  />
                  <span className="date-separator">to</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    aria-label="Executed to"
                  />
                </div>
              </div>

              <label className="filter-group">
                <span>Sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </label>
            </div>

            <div className="filter-actions">
              <div className="quick-filters">
                <button
                  type="button"
                  className="ghost tiny"
                  onClick={() => setQuickRange(1)}
                >
                  Last 24h
                </button>
                <button
                  type="button"
                  className="ghost tiny"
                  onClick={() => setQuickRange(7)}
                >
                  Last 7 days
                </button>
                <button
                  type="button"
                  className="ghost tiny"
                  onClick={() => setQuickRange(30)}
                >
                  Last 30 days
                </button>
              </div>

              <div className="filter-footer">
                <div className="badges">
                  <span className="chip">Showing {filteredExecutions.length}</span>
                  {filteredExecutions.length !== executions.length && (
                    <span className="chip ghost">
                      from {executions.length} total records
                    </span>
                  )}
                  {workflowFilter !== 'all' && (
                    <span className="chip ghost">
                      Workflow:{' '}
                      {workflowOptions.find(([id]) => String(id) === workflowFilter)?.[1]}
                    </span>
                  )}
                  {search.trim() && <span className="chip ghost">Search: “{search.trim()}”</span>}
                  {fromDate && <span className="chip ghost">From: {fromDate}</span>}
                  {toDate && <span className="chip ghost">To: {toDate}</span>}
                  {sortBy === 'oldest' && <span className="chip ghost">Sorted by oldest</span>}
                </div>
                <button type="button" className="ghost" onClick={resetFilters}>
                  Reset filters
                </button>
              </div>
            </div>
          </div>

          {status ? (
            <div className="state">{status}</div>
          ) : (
            <ul className="executions-list">
              {filteredExecutions.map((execution) => (
                <li key={execution.id} className="execution-card">
                  <div>
                    <p className="label">
                      {execution.workflowName ?? `Workflow #${execution.workflowId}`}
                    </p>
                    <p className="meta">
                      Executed: {formatDateTime(execution.executedAt)}
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
