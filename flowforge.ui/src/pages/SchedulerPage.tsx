import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestJson, withJson } from '../api/http'
import type { WorkflowDto, WorkflowScheduleDto } from '../api/types'
import { useThemePreference } from '../hooks/useThemePreference'
import Icon from '../components/Icon'

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

type ScheduleForm = {
  name: string
  description: string
  workflowId: number | null
  triggerType: 'Interval' | 'Once' | 'Daily'
  startAt: string
  intervalMinutes: number
  isActive: boolean
  timeZoneId: string
}

function normalizeWorkflows(data: unknown): WorkflowDto[] {
  if (Array.isArray(data)) return data as WorkflowDto[]
  if (data && typeof data === 'object' && '$values' in data) {
    const values = (data as { $values?: unknown }).$values
    return Array.isArray(values) ? (values as WorkflowDto[]) : []
  }
  return []
}

function normalizeSchedules(data: unknown): WorkflowScheduleDto[] {
  if (Array.isArray(data)) return data as WorkflowScheduleDto[]
  if (data && typeof data === 'object' && '$values' in data) {
    const values = (data as { $values?: unknown }).$values
    return Array.isArray(values) ? (values as WorkflowScheduleDto[]) : []
  }
  return []
}

const withDefaultTz = (items: WorkflowScheduleDto[], fallback: string) =>
  items.map((s) => ({ ...s, timeZoneId: s.timeZoneId || fallback }))

export default function SchedulerPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useThemePreference()
  const browserTz =
    (typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC'
  const timeZoneOptions =
    typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl
      ? (Intl as unknown as { supportedValuesOf: (key: string) => string[] }).supportedValuesOf('timeZone')
      : ['UTC']
  const [workflows, setWorkflows] = useState<WorkflowDto[]>([])
  const [schedules, setSchedules] = useState<WorkflowScheduleDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<ScheduleForm | null>(null)
  const [form, setForm] = useState<ScheduleForm>({
    name: '',
    description: '',
    workflowId: null,
    triggerType: 'Interval',
    startAt: '',
    intervalMinutes: 60,
    isActive: true,
    timeZoneId: browserTz,
  })

  const statusLabel = useMemo(() => {
    if (loading) return 'Ładowanie schedulerów...'
    if (error) return error
    if (schedules.length === 0) return 'Brak harmonogramów.'
    return ''
  }, [loading, error, schedules.length])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [wfRes, schedRes] = await Promise.all([
          requestJson<unknown>('/api/Workflow'),
          requestJson<unknown>('/api/WorkflowSchedule'),
        ])
        if (cancelled) return
        setWorkflows(normalizeWorkflows(wfRes))
        setSchedules(withDefaultTz(normalizeSchedules(schedRes), browserTz))
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Nie udało się pobrać danych')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function createSchedule(event: FormEvent) {
    event.preventDefault()
    if (!form.workflowId || !form.name.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      const start = form.startAt ? new Date(form.startAt) : new Date()
      const payload = {
        workflowId: form.workflowId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        triggerType: form.triggerType,
        startAtUtc: start.toISOString(),
        intervalMinutes: form.triggerType === 'Interval' ? form.intervalMinutes : null,
        isActive: form.isActive,
        timeZoneId: form.timeZoneId || 'UTC',
      }
      const created = await requestJson<WorkflowScheduleDto>(
        '/api/WorkflowSchedule',
        withJson(payload),
      )
      setSchedules((current) => withDefaultTz([created, ...current], browserTz))
      setForm((current) => ({
        ...current,
        name: '',
        description: '',
        workflowId: current.workflowId,
        startAt: '',
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się utworzyć harmonogramu')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSchedule(id: number) {
    try {
      await requestJson<void>(`/api/WorkflowSchedule/${id}`, { method: 'DELETE' })
      setSchedules((current) => current.filter((item) => item.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się usunąć harmonogramu')
    }
  }

  async function runScheduleNow(scheduleId: number) {
    try {
      await requestJson<void>(`/api/WorkflowSchedule/${scheduleId}/run`, { method: 'POST' })
      const refreshed = await requestJson<unknown>('/api/WorkflowSchedule')
      setSchedules(withDefaultTz(normalizeSchedules(refreshed), browserTz))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się uruchomić harmonogramu')
    }
  }

  function formatDate(value?: string | null) {
    if (!value) return ''
    try {
      const normalized = value.endsWith('Z') ? value : `${value}Z`
      return new Date(normalized).toLocaleString()
    } catch {
      return value
    }
  }

  function toInputDate(value?: string | null) {
    if (!value) return ''
    try {
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return ''
      return date.toISOString().slice(0, 16)
    } catch {
      return ''
    }
  }

  function toIsoUtc(input: string) {
    if (!input) return new Date().toISOString()
    const date = new Date(input)
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
  }

  function startEdit(schedule: WorkflowScheduleDto) {
    setEditingId(schedule.id)
    setEditForm({
      name: schedule.name,
      description: schedule.description ?? '',
      workflowId: schedule.workflowId,
      triggerType: (schedule.triggerType as ScheduleForm['triggerType']) ?? 'Interval',
      startAt: toInputDate(schedule.startAtUtc),
      intervalMinutes: schedule.intervalMinutes ?? 60,
      isActive: schedule.isActive,
      timeZoneId: schedule.timeZoneId || browserTz,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm(null)
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault()
    if (editingId === null || !editForm || saving || !editForm.workflowId || !editForm.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        workflowId: editForm.workflowId,
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        triggerType: editForm.triggerType,
        startAtUtc: toIsoUtc(editForm.startAt),
        intervalMinutes: editForm.triggerType === 'Interval' ? editForm.intervalMinutes : null,
        isActive: editForm.isActive,
        timeZoneId: editForm.timeZoneId || 'UTC',
      }
      const updated = await requestJson<WorkflowScheduleDto>(
        `/api/WorkflowSchedule/${editingId}`,
        withJson(payload, { method: 'PUT' }),
      )
      setSchedules((current) =>
        withDefaultTz(
          current.map((item) => (item.id === editingId ? updated : item)),
          browserTz,
        ),
      )
      cancelEdit()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zaktualizować harmonogramu')
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
          <button type="button" className="nav-item" onClick={() => navigate('/')}>
            Workflows
          </button>
          <button type="button" className="nav-item" onClick={() => navigate('/blocks')}>
            Blocks
          </button>
          <button type="button" className="nav-item" onClick={() => navigate('/executions')}>
            Executions
          </button>
          <button type="button" className="nav-item active">
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
            <h1>Scheduler</h1>
            <p className="subtitle">Planowanie automatycznych uruchomień workflowów.</p>
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
            <span className="count">{schedules.length} total</span>
          </div>
        </header>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Nowy harmonogram</h2>
              <p className="muted">Wybierz workflow i ustaw czas startu oraz interwał.</p>
            </div>
          </div>
          <form onSubmit={createSchedule} className="filter-bar" style={{ alignItems: 'flex-start' }}>
            <div className="filter-grid">
              <label className="filter-group">
                <span>Nazwa</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((curr) => ({ ...curr, name: event.target.value }))}
                  placeholder="np. Nightly ETL"
                  required
                />
              </label>

              <label className="filter-group custom-select">
                <span>Workflow</span>
                <div className="select-shell">
                  <select
                    value={form.workflowId ?? ''}
                    onChange={(event) =>
                      setForm((curr) => ({
                        ...curr,
                        workflowId: Number(event.target.value) || null,
                      }))
                    }
                  >
                    <option value="">Wybierz...</option>
                    {workflows.map((wf) => (
                      <option key={wf.id} value={wf.id}>
                        {wf.name}
                      </option>
                    ))}
                  </select>
                  <Icon name="chevron-down" size={16} />
                </div>
              </label>

              <label className="filter-group custom-select">
                <span>Typ</span>
                <div className="select-shell">
                  <select
                    value={form.triggerType}
                    onChange={(event) =>
                      setForm((curr) => ({
                        ...curr,
                        triggerType: event.target.value as ScheduleForm['triggerType'],
                      }))
                    }
                  >
                    <option value="Interval">Interval</option>
                    <option value="Once">Once</option>
                    <option value="Daily">Daily (godzina)</option>
                  </select>
                  <Icon name="chevron-down" size={16} />
                </div>
              </label>

              <label className="filter-group" style={{ opacity: form.triggerType === 'Once' || form.triggerType === 'Daily' ? 0.4 : 1, pointerEvents: form.triggerType === 'Once' || form.triggerType === 'Daily' ? 'none' : 'auto' }}>
                <span>Interwał (min)</span>
                <input
                  type="number"
                  min={1}
                  value={form.intervalMinutes}
                  onChange={(event) =>
                    setForm((curr) => ({
                      ...curr,
                      intervalMinutes: Number(event.target.value) || 1,
                    }))
                  }
                  disabled={form.triggerType === 'Once' || form.triggerType === 'Daily'}
                />
              </label>

              <label className="filter-group">
                <span>Start (lokalnie)</span>
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(event) => setForm((curr) => ({ ...curr, startAt: event.target.value }))}
                  style={{ opacity: form.triggerType === 'Once' || form.triggerType === 'Daily' ? 1 : 0.9 }}
                />
              </label>

              <label className="filter-group custom-select">
                <span>Strefa czasowa</span>
                <div className="select-shell">
                  <select
                    value={form.timeZoneId}
                    onChange={(event) =>
                      setForm((curr) => ({
                        ...curr,
                        timeZoneId: event.target.value,
                      }))
                    }
                  >
                    {timeZoneOptions.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                  <Icon name="chevron-down" size={16} />
                </div>
                <p className="muted" style={{ marginTop: 4 }}>
                  Domyślnie wykryto: {browserTz}
                </p>
              </label>

              <label className="filter-group">
                <span>Opis</span>
                <input
                  type="text"
                  value={form.description}
                  onChange={(event) =>
                    setForm((curr) => ({ ...curr, description: event.target.value }))
                  }
                  placeholder="np. codziennie o 2:00"
                />
              </label>

              <label className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>Aktywny</span>
                <span className="toggle">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm((curr) => ({ ...curr, isActive: event.target.checked }))
                    }
                  />
                  <span className="slider" />
                </span>
              </label>
            </div>
            <div className="filter-footer" style={{ justifyContent: 'flex-end' }}>
              <button type="submit" disabled={saving}>
                {saving ? 'Zapisywanie...' : 'Dodaj'}
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Harmonogramy</h2>
            <p className="muted">Lista zaplanowanych uruchomień.</p>
          </div>
          {statusLabel && <p className="muted">{statusLabel}</p>}
          {!statusLabel && (
            <div className="execution-grid scheduler-grid">
              {schedules.map((sched) => (
                <div
                  key={sched.id}
                  className="workflow-card scheduler-card"
                  style={{
                    alignItems: 'flex-start',
                    borderLeft: sched.isActive ? '4px solid #2f9e68' : '4px solid var(--border-soft)',
                    boxShadow: '0 12px 26px rgba(0,0,0,0.08)',
                    position: 'relative',
                  }}
                >
                  <div
                    className="card-actions"
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end',
                    }}
                  >
                    {editingId === sched.id && editForm ? (
                      <button type="button" className="ghost" onClick={cancelEdit}>
                        Anuluj
                      </button>
                    ) : (
                      <>
                        <button type="button" className="ghost" onClick={() => runScheduleNow(sched.id)}>
                          Uruchom teraz
                        </button>
                        <button type="button" className="ghost" onClick={() => startEdit(sched)}>
                          Edytuj
                        </button>
                        <button type="button" className="ghost danger" onClick={() => deleteSchedule(sched.id)}>
                          Usuń
                        </button>
                      </>
                    )}
                  </div>
                  {editingId === sched.id && editForm ? (
                    <form style={{ display: 'grid', gap: 10, width: '100%' }} onSubmit={saveEdit}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className="pill" style={{ background: 'rgba(47,158,104,0.12)', color: '#2f9e68' }}>
                          Edycja
                        </span>
                        <span className="pill muted">ID {sched.id}</span>
                      </div>
                      <label className="filter-group">
                        <span>Nazwa</span>
                        <input
                          value={editForm.name}
                          onChange={(e) => setEditForm((curr) => curr && ({ ...curr, name: e.target.value }))}
                          required
                        />
                      </label>
                      <label className="filter-group custom-select">
                        <span>Workflow</span>
                        <div className="select-shell">
                          <select
                            value={editForm.workflowId ?? ''}
                            onChange={(e) =>
                              setEditForm((curr) => curr && ({
                                ...curr,
                                workflowId: Number(e.target.value) || null,
                              }))
                            }
                          >
                            <option value="">Wybierz...</option>
                            {workflows.map((wf) => (
                              <option key={wf.id} value={wf.id}>
                                {wf.name}
                              </option>
                            ))}
                          </select>
                          <Icon name="chevron-down" size={16} />
                        </div>
                      </label>
                      <label className="filter-group custom-select">
                        <span>Typ</span>
                        <div className="select-shell">
                          <select
                            value={editForm.triggerType}
                            onChange={(e) =>
                              setEditForm((curr) => curr && ({
                                ...curr,
                                triggerType: e.target.value as ScheduleForm['triggerType'],
                              }))
                            }
                          >
                            <option value="Interval">Interval</option>
                            <option value="Once">Once</option>
                            <option value="Daily">Daily (godzina)</option>
                          </select>
                          <Icon name="chevron-down" size={16} />
                        </div>
                      </label>
                      <label className="filter-group" style={{ opacity: editForm.triggerType === 'Once' || editForm.triggerType === 'Daily' ? 0.4 : 1, pointerEvents: editForm.triggerType === 'Once' || editForm.triggerType === 'Daily' ? 'none' : 'auto' }}>
                        <span>Interwał (min)</span>
                        <input
                          type="number"
                          min={1}
                          value={editForm.intervalMinutes}
                          onChange={(e) =>
                            setEditForm((curr) => curr && ({
                              ...curr,
                              intervalMinutes: Number(e.target.value) || 1,
                            }))
                          }
                          disabled={editForm.triggerType === 'Once' || editForm.triggerType === 'Daily'}
                        />
                      </label>
                      <label className="filter-group">
                        <span>Start (lokalnie)</span>
                        <input
                          type="datetime-local"
                          value={editForm.startAt}
                          onChange={(e) =>
                            setEditForm((curr) => curr && ({
                              ...curr,
                              startAt: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="filter-group custom-select">
                        <span>Strefa czasowa</span>
                        <div className="select-shell">
                          <select
                            value={editForm.timeZoneId}
                            onChange={(e) =>
                              setEditForm((curr) => curr && ({ ...curr, timeZoneId: e.target.value }))
                            }
                          >
                            {timeZoneOptions.map((tz) => (
                              <option key={tz} value={tz}>
                                {tz}
                              </option>
                            ))}
                          </select>
                          <Icon name="chevron-down" size={16} />
                        </div>
                      </label>
                      <label className="filter-group">
                        <span>Opis</span>
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm((curr) => curr && ({
                              ...curr,
                              description: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>Aktywny</span>
                        <span className="toggle">
                          <input
                            type="checkbox"
                            checked={editForm.isActive}
                            onChange={(e) =>
                              setEditForm((curr) => curr && ({
                                ...curr,
                                isActive: e.target.checked,
                              }))
                            }
                          />
                          <span className="slider" />
                        </span>
                      </label>
                      <div className="card-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                        <button type="submit" disabled={saving || !editForm.workflowId || !editForm.name.trim()}>
                          {saving ? 'Zapisywanie...' : 'Zapisz'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span className="pill" style={{ background: 'rgba(47,158,104,0.12)', color: '#2f9e68' }}>
                            Harmonogram
                          </span>
                          <span className="pill muted">{sched.triggerType}</span>
                          {sched.intervalMinutes ? (
                            <span className="pill muted">{sched.intervalMinutes} min</span>
                          ) : null}
                          {!sched.isActive && <span className="pill muted">Inactive</span>}
                        </div>
                        <h3 style={{ margin: '2px 0 0' }}>{sched.name}</h3>
                        <p className="meta" style={{ margin: 0 }}>Workflow #{sched.workflowId}</p>
                        <p className="muted" style={{ margin: '4px 0' }}>
                          Następne: {formatDate(sched.nextRunAtUtc) || '—'}
                        </p>
                        <p className="muted" style={{ margin: '0 0 4px' }}>
                          Ostatnie: {formatDate(sched.lastRunAtUtc) || '—'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
