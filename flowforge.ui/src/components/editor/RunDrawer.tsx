import { useState, type Dispatch, type SetStateAction } from 'react'
import Icon from '../Icon'

type WorkflowVariable = {
  id: number
  name: string
  defaultValue?: string | null
}

type WorkflowExecution = {
  id: number
  path?: string[]
  actions?: string[]
  resultData?: Record<string, unknown> | null
}

type RunDrawerProps = {
  workflowId?: number
  workflowName?: string
  variables: WorkflowVariable[]
  runInputs: Record<string, string>
  setRunInputs: Dispatch<SetStateAction<Record<string, string>>>
  running: boolean
  runError: string | null
  runResult: WorkflowExecution | null
  skipWaits: boolean
  setSkipWaits: Dispatch<SetStateAction<boolean>>
  estimatedWaitMs: number
  showRunSnippet: boolean
  setShowRunSnippet: (updater: (open: boolean) => boolean) => void
  showRunInputs: boolean
  setShowRunInputs: (updater: (open: boolean) => boolean) => void
  onRun: () => void
  onClose: () => void
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

function looksLikeXml(value: string) {
  const trimmed = value.trim()
  return trimmed.startsWith('<') && trimmed.endsWith('>')
}

function prettyXml(raw: string) {
  const normalized = raw.replace(/>\\s+</g, '><').trim()
  const tokens = normalized.split(/(?=<)/g).map((t) => t.trim()).filter(Boolean)
  let indent = 0
  const lines: string[] = []
  tokens.forEach((token) => {
    const isClosing = token.startsWith('</')
    if (isClosing) indent = Math.max(indent - 2, 0)
    lines.push(`${' '.repeat(indent)}${token}`)
    const opens = token.startsWith('<') && !token.startsWith('</') && !token.endsWith('/>')
    if (opens) indent += 2
  })
  return lines.join('\n')
}

function normalizeDataMap(data?: Record<string, unknown> | null) {
  if (!data || typeof data !== 'object') return {}
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (typeof value === 'string') {
        return [key, parseJsonString(value)]
      }
      return [key, value]
    }),
  )
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') {
    if (looksLikeXml(value)) return prettyXml(value)
    return value
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function formatMs(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return '0 ms'
  if (ms < 1000) return `${Math.round(ms)} ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(seconds >= 10 ? 0 : 1)} s`
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.round(seconds % 60)
  return `${minutes}m ${remainder}s`
}

const RunDrawer = ({
  workflowId,
  workflowName,
  variables,
  runInputs,
  setRunInputs,
  running,
  runError,
  runResult,
  skipWaits,
  setSkipWaits,
  estimatedWaitMs,
  showRunSnippet,
  setShowRunSnippet,
  showRunInputs,
  setShowRunInputs,
  onRun,
  onClose,
}: RunDrawerProps) => {
  const [snipExpanded, setSnipExpanded] = useState(showRunSnippet)
  const [inputsExpanded, setInputsExpanded] = useState(showRunInputs)
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        return
      }
    } catch {
      // fallback below
    }
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
    } finally {
      document.body.removeChild(textarea)
    }
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="config-drawer">
        <div className="drawer-header">
          <div>
            <p className="drawer-title">Run workflow</p>
            <span className="drawer-subtitle">{workflowName}</span>
          </div>
          <button type="button" className="ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <section className="variables-section">
          <div className="section-toggle" style={{ marginBottom: snipExpanded ? 8 : 0 }}>
            <div className="section-toggle__meta">
              <span className="section-title">API snippet</span>
              <span className="section-subtitle">HTTP call template</span>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => {
                setSnipExpanded((open) => !open)
                setShowRunSnippet((open) => !open)
              }}
              aria-label={snipExpanded ? 'Collapse snippet' : 'Expand snippet'}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                style={{
                  transform: snipExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s ease',
                }}
                aria-hidden="true"
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          {snipExpanded && (
            <div className="variables-section" style={{ gap: 8 }}>
              <p className="muted">
                1) Replace <code>&lt;API_BASE&gt;</code> with your backend URL.<br />
                2) Fill variable values in the JSON body.<br />
                3) Run in terminal (curl) or any HTTP client (Postman).
              </p>
              <div className="code-card">
                <div className="code-card__header">
                  <span>curl</span>
                  <span className="muted">HTTP POST</span>
                </div>
                <pre className="code-block">{`curl -X POST \\
  "<API_BASE>/api/Workflow/${workflowId ?? 'ID'}/run" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(
    variables.reduce<Record<string, string>>((acc, variable) => {
      acc[variable.name] = variable.defaultValue ?? ''
      return acc
    }, {}),
    null,
    2,
  )}'`}</pre>
              </div>
              <p className="muted">
                Response returns execution id, path, actions, and output variables as JSON.
              </p>
            </div>
          )}

          <div className="section-header">
            <div className="section-toggle">
              <div className="section-toggle__meta">
                <span className="section-title">Inputs</span>
                <span className="section-subtitle">{variables.length} variables</span>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setInputsExpanded((open) => !open)
                  setShowRunInputs((open) => !open)
                }}
                aria-label={inputsExpanded ? 'Collapse inputs' : 'Expand inputs'}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  style={{
                    transform: inputsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s ease',
                  }}
                  aria-hidden="true"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
          {inputsExpanded && (
            <form
              className="drawer-form run-inputs"
              onSubmit={(event) => {
                event.preventDefault()
                onRun()
              }}
            >
              {variables.length === 0 && <p className="muted">No workflow variables defined.</p>}
              {variables.map((variable) => (
                <div key={variable.id} className="combo">
                  <label className="drawer-label" htmlFor={`run-${variable.id}`}>
                    <span className="label-icon">
                      <Icon name="rows" />
                    </span>
                    {variable.name}
                  </label>
                  <input
                    id={`run-${variable.id}`}
                    type="text"
                    value={runInputs[variable.name] ?? ''}
                    onChange={(event) => {
                      const value = event.target.value
                      setRunInputs((current) => ({
                        ...current,
                        [variable.name]: value,
                      }))
                    }}
                  />
                </div>
              ))}
            </form>
          )}
          <div className="wait-summary">
            <div className="wait-summary__meta">
              <span className="pill">{formatMs(estimatedWaitMs)}</span>
              <span className="muted">Estimated waits</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={skipWaits}
                onChange={(event) => setSkipWaits(event.target.checked)}
              />
              <span className="switch-slider" />
              <span className="muted">Skip wait blocks (UI only)</span>
            </label>
          </div>
          <button type="button" disabled={running} onClick={onRun} style={{ marginTop: 8 }}>
            {running ? 'Running...' : 'Run workflow'}
          </button>
          {runError && <p className="muted">{runError}</p>}
        </section>

        {runResult && (
          <section className="variables-section">
            <div className="section-header">
              <p className="section-title">Result</p>
              <span className="section-subtitle">Execution #{runResult.id}</span>
            </div>
            <div className="drawer-empty">
              <p className="label">Flow</p>
              {runResult.path && runResult.path.length > 0 ? (
                <div className="flow-wrapper">
                  <div className="flow-lane flow-scroll">
                    {(runResult.path ?? []).map((step, idx) => (
                      <div key={`${step}-${idx}`} className="flow-segment">
                        <div className="flow-node">
                          <div className="flow-node-top">
                            <span className="flow-index">{idx + 1}</span>
                            <span className="flow-badge">Executed</span>
                          </div>
                          <span className="flow-label">{step}</span>
                          {runResult.actions && runResult.actions[idx] && (
                            <span className="flow-note">{runResult.actions[idx]}</span>
                          )}
                        </div>
                        {idx < (runResult.path?.length ?? 0) - 1 && <div className="flow-connector" />}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="meta">No path recorded.</p>
              )}
            </div>
            <div className="drawer-empty">
              <p className="label">Output variables</p>
              {Object.keys(runResult.resultData ?? {}).length === 0 ? (
                <p className="muted">No outputs.</p>
              ) : (
                <div className="result-grid">
                  {Object.entries(normalizeDataMap(runResult.resultData))
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([key, val]) => {
                      const formatted = formatValue(val)
                      const formattedStr = typeof formatted === 'string' ? formatted : String(formatted)
                      const isLong = formattedStr.length > 280
                      const preview = isLong ? `${formattedStr.slice(0, 280)}…` : formattedStr
                      const showFull = expandedKeys.has(key)
                      return (
                        <div key={key} className="result-card">
                          <div className="result-card__top">
                            <span className="label">{key}</span>
                            <div className="result-card__actions">
                              {isLong && (
                                <button
                                  type="button"
                                  className="ghost small"
                                  onClick={() =>
                                    setExpandedKeys((current) => {
                                      const next = new Set(current)
                                      if (next.has(key)) next.delete(key)
                                      else next.add(key)
                                      return next
                                    })
                                  }
                                >
                                  {showFull ? 'Collapse' : 'Expand'}
                                </button>
                              )}
                              <button
                                type="button"
                                className="ghost small"
                                onClick={() => copyToClipboard(formattedStr)}
                                aria-label={`Copy value of ${key}`}
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                          <pre className="meta">{showFull || !isLong ? formattedStr : preview}</pre>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </section>
        )}
      </aside>
    </>
  )
}

export default RunDrawer
