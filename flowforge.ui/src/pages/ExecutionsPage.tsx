import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemePreference } from '../hooks/useThemePreference'
import { useLanguagePreference } from '../hooks/useLanguagePreference'
import Icon from '../components/Icon'

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
  const normalized = value.endsWith('Z') ? value : `${value}Z`
  const date = new Date(normalized)
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const cacheRef = useRef<Execution[] | null>(null)
  const { theme, toggleTheme } = useThemePreference()
  const { language } = useLanguagePreference()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    async function loadExecutions() {
      if (cacheRef.current) {
        setExecutions(cacheRef.current)
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${apiBase}/api/WorkflowExecution`)
        if (!response.ok) {
          throw new Error(`Failed to load executions (${response.status})`)
        }
        const data = (await response.json()) as unknown
        if (!cancelled) {
          const normalized = normalizeValues<Execution>(data)
          cacheRef.current = normalized
          setExecutions(normalized)
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

  const pageCount = useMemo(() => Math.max(1, Math.ceil(filteredExecutions.length / pageSize)), [filteredExecutions.length, pageSize])

  useEffect(() => {
    setPage((current) => {
      const next = Math.min(Math.max(1, current), pageCount)
      return next
    })
  }, [pageCount, filteredExecutions.length])

  const paginatedExecutions = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredExecutions.slice(start, start + pageSize)
  }, [filteredExecutions, page, pageSize])

  function handlePageInput(value: string) {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return
    setPage(Math.min(pageCount, Math.max(1, parsed)))
  }

  const copy = language === 'pl'
    ? {
        navWorkflows: 'Workflowy',
        navBlocks: 'Bloki',
        navExecutions: 'Egzekucje',
        navScheduler: 'Scheduler',
        title: 'Egzekucje',
        subtitle: 'Ostatnie uruchomienia i znaczniki czasu.',
        history: 'Historia',
        sectionTitle: 'Historia egzekucji',
        sectionSubtitle: 'Wyszukuj i filtruj uruchomienia po nazwie, dacie lub kolejności.',
        searchLabel: 'Szukaj',
        searchPlaceholder: 'Szukaj po nazwie workflow lub ID...',
        workflowLabel: 'Workflow',
        allWorkflows: 'Wszystkie workflowy',
        between: 'Zakres dat',
        sortLabel: 'Sortuj',
        newest: 'Najnowsze',
        oldest: 'Najstarsze',
        last24h: 'Ostatnie 24h',
        last7d: 'Ostatnie 7 dni',
        last30d: 'Ostatnie 30 dni',
        showing: 'Widoczne',
        fromTotal: 'z',
        totalRecords: 'wszystkich',
        reset: 'Resetuj filtry',
        prev: 'Poprzednia',
        next: 'Następna',
        page: 'Strona',
        of: 'z',
        rows: 'Wiersze',
        loading: 'Ładowanie egzekucji...',
        none: 'Brak egzekucji.',
        noMatch: 'Brak wyników dla filtrów.',
        viewDetails: 'Szczegóły',
        openWorkflow: 'Otwórz workflow'
      }
    : {
        navWorkflows: 'Workflows',
        navBlocks: 'Blocks',
        navExecutions: 'Executions',
        navScheduler: 'Scheduler',
        title: 'Executions',
        subtitle: 'Recent workflow runs and timestamps.',
        history: 'History',
        sectionTitle: 'Execution history',
        sectionSubtitle: 'Search and filter workflow runs by name, date, or recency.',
        searchLabel: 'Search',
        searchPlaceholder: 'Search by workflow name or id...',
        workflowLabel: 'Workflow',
        allWorkflows: 'All workflows',
        between: 'Executed between',
        sortLabel: 'Sort',
        newest: 'Newest first',
        oldest: 'Oldest first',
        last24h: 'Last 24h',
        last7d: 'Last 7 days',
        last30d: 'Last 30 days',
        showing: 'Showing',
        fromTotal: 'from',
        totalRecords: 'total records',
        reset: 'Reset filters',
        prev: 'Prev',
        next: 'Next',
        page: 'Page',
        of: 'of',
        rows: 'Rows',
        loading: 'Loading executions...',
        none: 'No executions yet.',
        noMatch: 'No matches for current filters.',
        viewDetails: 'View details',
        openWorkflow: 'Open workflow'
      }

  const status = useMemo(() => {
    if (loading) return copy.loading
    if (error) return error
    if (executions.length === 0) return copy.none
    if (filteredExecutions.length === 0) return copy.noMatch
    return ''
  }, [copy.loading, copy.noMatch, copy.none, error, executions.length, filteredExecutions.length, loading])

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
            {copy.navWorkflows}
          </button>
          <button type="button" className="nav-item" onClick={() => navigate('/blocks')}>
            {copy.navBlocks}
          </button>
          <button type="button" className="nav-item active">
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
            <span className="count">{executions.length} total</span>
            <span className="pill">{copy.history}</span>
          </div>
        </header>

        <section className="panel">
          <div className="panel-header">
            <h2>{copy.sectionTitle}</h2>
            <p className="muted">{copy.sectionSubtitle}</p>
          </div>

          <div className="filter-bar">
            <div className="filter-grid">
              <label className="filter-group">
                <span>{copy.searchLabel}</span>
                <input
                  type="text"
                  placeholder={copy.searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>

              <label className="filter-group">
                <span>{copy.workflowLabel}</span>
                <select
                  value={workflowFilter}
                  onChange={(e) => setWorkflowFilter(e.target.value)}
                >
                  <option value="all">{copy.allWorkflows}</option>
                  {workflowOptions.map(([id, label]) => (
                    <option key={id} value={String(id)}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="filter-group">
                <span>{copy.between}</span>
                <div className="date-range">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    aria-label="Executed from"
                  />
                  <span className="date-separator">{language === 'pl' ? 'do' : 'to'}</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    aria-label="Executed to"
                  />
                </div>
              </div>

              <label className="filter-group">
                <span>{copy.sortLabel}</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                >
                  <option value="newest">{copy.newest}</option>
                  <option value="oldest">{copy.oldest}</option>
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
                    {copy.last24h}
                  </button>
                  <button
                    type="button"
                    className="ghost tiny"
                    onClick={() => setQuickRange(7)}
                  >
                    {copy.last7d}
                  </button>
                  <button
                    type="button"
                    className="ghost tiny"
                    onClick={() => setQuickRange(30)}
                  >
                    {copy.last30d}
                  </button>
                </div>

                <div className="filter-footer">
                  <div className="badges">
                  <span className="chip">
                    {copy.showing} {filteredExecutions.length}
                  </span>
                  {filteredExecutions.length !== executions.length && (
                    <span className="chip ghost">
                      {copy.fromTotal} {executions.length} {copy.totalRecords}
                    </span>
                  )}
                  {workflowFilter !== 'all' && (
                    <span className="chip ghost">
                      {copy.workflowLabel}:{' '}
                      {workflowOptions.find(([id]) => String(id) === workflowFilter)?.[1]}
                    </span>
                  )}
                  {search.trim() && (
                    <span className="chip ghost">
                      {copy.searchLabel}: “{search.trim()}”
                    </span>
                  )}
                  {fromDate && (
                    <span className="chip ghost">
                      {language === 'pl' ? 'Od' : 'From'}: {fromDate}
                    </span>
                  )}
                  {toDate && (
                    <span className="chip ghost">
                      {language === 'pl' ? 'Do' : 'To'}: {toDate}
                    </span>
                  )}
                  {sortBy === 'oldest' && <span className="chip ghost">{copy.oldest}</span>}
                </div>
                <button type="button" className="ghost" onClick={resetFilters}>
                  {copy.reset}
                </button>
              </div>
              <div className="pagination">
                <div className="page-controls">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    {copy.prev}
                  </button>
                  <span className="page-info">
                    {copy.page}{' '}
                    <input
                      type="number"
                      min={1}
                      max={pageCount}
                      value={page}
                      onChange={(e) => handlePageInput(e.target.value)}
                      className="page-input"
                    />{' '}
                    {copy.of} {pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={page >= pageCount}
                  >
                    {copy.next}
                  </button>
                </div>
                <label className="page-size">
                  <span>{copy.rows}</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setPage(1)
                    }}
                  >
                    {[5, 10, 20, 50].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          {status ? (
            <div className="state">{status}</div>
          ) : (
            <ul className="executions-list">
              {paginatedExecutions.map((execution) => (
                <li key={execution.id} className="execution-card">
                  <div>
                    <p className="label">
                      {execution.workflowName ?? `Workflow #${execution.workflowId}`}
                    </p>
                    <p className="meta">
                      {language === 'pl' ? 'Uruchomiono:' : 'Executed:'} {formatDateTime(execution.executedAt)}
                    </p>
                  </div>
                  <div className="card-actions">
                    <button
                      type="button"
                      onClick={() => navigate(`/executions/${execution.id}`)}
                    >
                      {copy.viewDetails}
                    </button>
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => navigate(`/workflows/${execution.workflowId}`)}
                    >
                      {copy.openWorkflow}
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
