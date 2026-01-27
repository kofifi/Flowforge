import { useEffect, useState } from 'react'
import { requestJson, withJson } from '../../api/http'
import type { WorkflowRevisionDto } from '../../api/types'

type RevisionPanelProps = {
  workflowId: number
}

function normalizeRevisions(payload: unknown): WorkflowRevisionDto[] {
  if (Array.isArray(payload)) return payload as WorkflowRevisionDto[]
  if (payload && typeof payload === 'object' && '$values' in payload) {
    const values = (payload as { $values?: unknown }).$values
    return Array.isArray(values) ? (values as WorkflowRevisionDto[]) : []
  }
  return []
}

function formatDate(value?: string | null) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

export function RevisionPanel({ workflowId }: RevisionPanelProps) {
  const [revisions, setRevisions] = useState<WorkflowRevisionDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await requestJson<unknown>(`/api/WorkflowRevision/workflow/${workflowId}`)
        if (cancelled) return
        const normalized = normalizeRevisions(data)
        setRevisions(normalized)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Nie udało się pobrać wersji')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [workflowId])

  async function restoreRevision(id: number) {
    if (restoringId) return
    setRestoringId(id)
    setError(null)
    try {
      await requestJson<void>(`/api/WorkflowRevision/${id}/restore`, { method: 'POST' })
      const data = await requestJson<unknown>(`/api/WorkflowRevision/workflow/${workflowId}`)
      setRevisions(normalizeRevisions(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się przywrócić wersji')
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <section className="panel" style={{ marginBottom: 16 }}>
      <div className="panel-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <h2>Wersje workflow</h2>
          <p className="muted">Migawki zapisywane automatycznie po każdej operacji zapisu grafu.</p>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted">Ładowanie wersji...</p>
      ) : revisions.length === 0 ? (
        <p className="muted">Brak zapisanych wersji.</p>
      ) : (
        <div className="table">
          <div className="table-head">
            <span>Wersja</span>
            <span>Utworzono</span>
            <span>Aktywna</span>
            <span>Akcje</span>
          </div>
          <div className="table-body">
            {revisions.map((rev) => (
              <div key={rev.id} className="table-row">
                <span>
                  {rev.label || rev.version}
                  <span className="pill muted" style={{ marginLeft: 8 }}>
                    {rev.version}
                  </span>
                </span>
                <span>{formatDate(rev.createdAt)}</span>
                <span>{rev.isActive ? 'aktywna' : ''}</span>
                <span>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => restoreRevision(rev.id)}
                    disabled={rev.isActive || restoringId === rev.id}
                  >
                    {restoringId === rev.id ? 'Przywracanie...' : 'Przywróć'}
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default RevisionPanel
