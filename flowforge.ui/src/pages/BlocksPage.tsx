import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

  const status = useMemo(() => {
    if (loading) return 'Loading system blocks...'
    if (error) return error
    if (blocks.length === 0) return 'No system blocks found.'
    return ''
  }, [blocks.length, error, loading])

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
          <button type="button" className="nav-item active">
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
            <h1>System blocks</h1>
            <p className="subtitle">
              Core block types available in the workflow editor.
            </p>
          </div>
          <div className="topbar-meta">
            <span className="count">{blocks.length} total</span>
            <span className="pill">Read-only</span>
          </div>
        </header>

        <section className="panel">
          <div className="panel-header">
            <h2>Available blocks</h2>
            <p className="muted">These are seeded by the backend.</p>
          </div>

          {status ? (
            <div className="state">{status}</div>
          ) : (
            <ul className="blocks-list">
              {blocks.map((block) => (
                <li key={block.id} className="block-card">
                  <div>
                    <p className="label">{block.type}</p>
                    <p className="meta">{block.description}</p>
                  </div>
                  <span className="pill">System</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Custom blocks</h2>
            <p className="muted">Editor is coming next.</p>
          </div>
          <div className="state">
            Custom block editor is not available yet.
          </div>
        </section>
      </main>
    </div>
  )
}
