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

function normalizeDataMap(data?: Record<string, unknown> | null) {
  if (!data || typeof data !== 'object') return {}
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      typeof value === 'string' ? value : JSON.stringify(value, null, 2),
    ]),
  )
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
              className="drawer-form"
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
              <pre className="meta">{JSON.stringify(normalizeDataMap(runResult.resultData), null, 2)}</pre>
            </div>
          </section>
        )}
      </aside>
    </>
  )
}

export default RunDrawer
