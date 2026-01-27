import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguagePreference } from '../hooks/useLanguagePreference'
import { useThemePreference } from '../hooks/useThemePreference'
import Icon from '../components/Icon'

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

  const status = useMemo(() => {
    if (loading) return 'Loading system blocks...'
    if (error) return error
    if (blocks.length === 0) return 'No system blocks found.'
    return ''
  }, [blocks.length, error, loading])

  const translations: Record<string, { plLabel: string; enLabel: string; plDesc: string; enDesc: string }> = {
    Start: { plLabel: 'Start', enLabel: 'Start', plDesc: 'Blok początkowy', enDesc: 'Start block' },
    End: { plLabel: 'Koniec', enLabel: 'End', plDesc: 'Blok końcowy', enDesc: 'End block' },
    Calculation: {
      plLabel: 'Kalkulacja',
      enLabel: 'Calculation',
      plDesc: 'Blok kalkulacji',
      enDesc: 'Calculation block'
    },
    If: { plLabel: 'If', enLabel: 'If', plDesc: 'Blok warunkowy', enDesc: 'Conditional block' },
    Switch: {
      plLabel: 'Switch',
      enLabel: 'Switch',
      plDesc: 'Blok wielościeżkowy (case)',
      enDesc: 'Switch (case) block'
    },
    HttpRequest: {
      plLabel: 'HTTP',
      enLabel: 'HttpRequest',
      plDesc: 'Wywołanie HTTP (GET/POST itp.)',
      enDesc: 'HTTP request block'
    },
    Parser: { plLabel: 'Parser', enLabel: 'Parser', plDesc: 'Parser JSON/XML', enDesc: 'Parser JSON/XML' },
    Loop: { plLabel: 'Pętla', enLabel: 'Loop', plDesc: 'Powtarza gałąź wiele razy.', enDesc: 'Loop block' }
  }

  const copy = language === 'pl'
    ? {
        navWorkflows: 'Workflowy',
        navBlocks: 'Bloki',
        navExecutions: 'Egzekucje',
        navScheduler: 'Scheduler',
        title: 'Systemowe bloki',
        subtitle: 'Bazowe typy bloków dostępne w edytorze.',
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
        subtitle: 'Core block types available in the workflow editor.',
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
              {blocks.map((block) => (
                <li key={block.id} className="block-card">
                  <div>
                    <p className="label">
                      {language === 'pl'
                        ? translations[block.type]?.plLabel ?? block.type
                        : translations[block.type]?.enLabel ?? block.type}
                    </p>
                    <p className="meta">
                      {language === 'pl'
                        ? translations[block.type]?.plDesc ?? block.description
                        : translations[block.type]?.enDesc ?? block.description}
                    </p>
                  </div>
                  <span className="pill">{copy.systemPill}</span>
                </li>
              ))}
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
    </div>
  )
}
