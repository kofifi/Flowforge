import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

type Workflow = {
  id: number
  name: string
}

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

function normalizeWorkflows(data: unknown): Workflow[] {
  if (Array.isArray(data)) {
    return data as Workflow[]
  }

  if (data && typeof data === 'object' && '$values' in data) {
    const values = (data as { $values?: unknown }).$values
    return Array.isArray(values) ? (values as Workflow[]) : []
  }

  return []
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [saving, setSaving] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return localStorage.getItem('flowforge-theme') === 'dark' ? 'dark' : 'light'
  })
  const navigate = useNavigate()

  const hasWorkflows = workflows.length > 0

  const statusLabel = useMemo(() => {
    if (loading) return 'Loading workflows...'
    if (error) return error
    if (!hasWorkflows) return 'No workflows yet. Create your first project.'
    return ''
  }, [error, hasWorkflows, loading])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('theme-dark')
    } else {
      root.classList.remove('theme-dark')
    }
    localStorage.setItem('flowforge-theme', theme)
  }, [theme])

  useEffect(() => {
    let cancelled = false

    async function loadWorkflows() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${apiBase}/api/Workflow`)
        if (!response.ok) {
          throw new Error(`Failed to load workflows (${response.status})`)
        }
        const data = (await response.json()) as unknown
        if (!cancelled) {
          setWorkflows(normalizeWorkflows(data))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load workflows')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadWorkflows()

    return () => {
      cancelled = true
    }
  }, [])

  async function createWorkflow(event: FormEvent) {
    event.preventDefault()
    if (!newName.trim() || saving) return
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`${apiBase}/api/Workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (!response.ok) {
        throw new Error(`Failed to create workflow (${response.status})`)
      }
      const created = (await response.json()) as Workflow
      setWorkflows((current) => [created, ...current])
      setNewName('')
      navigate(`/workflows/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create workflow')
    } finally {
      setSaving(false)
    }
  }

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  function startEditing(workflow: Workflow) {
    setEditingId(workflow.id)
    setEditingName(workflow.name)
  }

  function cancelEditing() {
    setEditingId(null)
    setEditingName('')
  }

  async function updateWorkflow(event: FormEvent) {
    event.preventDefault()
    if (editingId === null || saving) return
    const trimmed = editingName.trim()
    if (!trimmed) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`${apiBase}/api/Workflow/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, name: trimmed }),
      })
      if (!response.ok) {
        throw new Error(`Failed to update workflow (${response.status})`)
      }
      setWorkflows((current) =>
        current.map((item) =>
          item.id === editingId ? { ...item, name: trimmed } : item,
        ),
      )
      cancelEditing()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update workflow')
    } finally {
      setSaving(false)
    }
  }

  async function deleteWorkflow(workflowId: number) {
    if (saving) return
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`${apiBase}/api/Workflow/${workflowId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(`Failed to delete workflow (${response.status})`)
      }
      setWorkflows((current) => current.filter((item) => item.id !== workflowId))
      if (editingId === workflowId) {
        cancelEditing()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete workflow')
    } finally {
      setSaving(false)
    }
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
          <button type="button" className="nav-item active">
            Workflows
          </button>
          <button type="button" className="nav-item" onClick={() => navigate('/blocks')}>
            Blocks
          </button>
          <button type="button" className="nav-item" onClick={() => navigate('/executions')}>
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
            <h1>Workflow projects</h1>
            <p className="subtitle">
              Manage projects before wiring blocks and connections in React Flow.
            </p>
          </div>
          <div className="topbar-meta">
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
            <span className="count">{workflows.length} total</span>
            <span className="pill">CRUD ready</span>
          </div>
        </header>

        <section className="panel">
          <div className="panel-header">
            <h2>Create new workflow</h2>
            <p className="muted">Use a short, descriptive name.</p>
          </div>
          <form className="create-form" onSubmit={createWorkflow}>
            <label htmlFor="workflow-name">Workflow name</label>
            <div className="create-controls">
              <input
                id="workflow-name"
                type="text"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="e.g. Customer onboarding"
                maxLength={120}
              />
              <button type="submit" disabled={!newName.trim() || saving}>
                Create
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Existing workflows</h2>
            <p className="muted">Rename or delete projects before building flows.</p>
          </div>

          {statusLabel ? (
            <div className="state">{statusLabel}</div>
          ) : (
            <ul className="workflow-list">
              {workflows.map((workflow) => (
                <li key={workflow.id} className="workflow-card">
                  <div>
                    <p className="label">Workflow</p>
                    {editingId === workflow.id ? (
                      <form className="edit-form" onSubmit={updateWorkflow}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          maxLength={120}
                          autoFocus
                        />
                        <div className="card-actions">
                          <button type="submit" disabled={!editingName.trim() || saving}>
                            Save
                          </button>
                          <button type="button" onClick={cancelEditing} className="ghost">
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <h3>{workflow.name}</h3>
                        <p className="meta">ID: {workflow.id}</p>
                      </>
                    )}
                  </div>
                  {editingId !== workflow.id && (
                    <div className="card-actions">
                      <button type="button" onClick={() => navigate(`/workflows/${workflow.id}`)}>
                        Open
                      </button>
                      <button type="button" onClick={() => startEditing(workflow)}>
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteWorkflow(workflow.id)}
                        className="danger"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
