import { useCallback } from 'react'
import { VariableSelect } from '../VariableSelect'
import type { HttpRequestAuthType, HttpRequestConfig, WorkflowVariable } from '../configTypes'

type HttpRequestFormProps = {
  panelId: string
  variables: WorkflowVariable[]
  config: HttpRequestConfig
  setHttpConfigs: React.Dispatch<React.SetStateAction<Record<string, HttpRequestConfig>>>
  formatVariableDisplay: (value: string) => string
  normalizeVariableName: (value: string) => string
  markDirty: () => void
}

function HttpRequestForm({
  panelId,
  variables,
  config,
  setHttpConfigs,
  formatVariableDisplay,
  normalizeVariableName,
  markDirty,
}: HttpRequestFormProps) {
  const updateConfig = useCallback(
    (partial: Partial<HttpRequestConfig>) => {
      setHttpConfigs((current) => ({
        ...current,
        [panelId]: { ...config, ...partial },
      }))
      markDirty()
    },
    [config, markDirty, panelId, setHttpConfigs],
  )

  const updateHeader = (index: number, field: 'name' | 'value', value: string) => {
    const headers = [...config.headers]
    headers[index] = { ...headers[index], [field]: value }
    updateConfig({ headers })
  }

  const addHeader = () => updateConfig({ headers: [...config.headers, { name: '', value: '' }] })
  const removeHeader = (index: number) => updateConfig({ headers: config.headers.filter((_, idx) => idx !== index) })

  return (
    <>
      <label className="drawer-label" htmlFor="http-method">
        <span className="label-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14M5 7h9M5 17h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        Method
      </label>
      <select
        id="http-method"
        value={config.method}
        onChange={(event) => updateConfig({ method: event.target.value as HttpRequestConfig['method'] })}
      >
        {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => (
          <option key={method} value={method}>
            {method}
          </option>
        ))}
      </select>

      <label className="drawer-label" htmlFor="http-url">
        <span className="label-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M9.5 6.5 6.5 9.5a4 4 0 1 0 5.66 5.66l1.34-1.34m-2-2 3-3a4 4 0 1 0-5.66-5.66L7.5 4.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </span>
        URL
      </label>
      <input
        id="http-url"
        type="url"
        placeholder="https://api.example.com/resource"
        value={config.url}
        onChange={(event) => updateConfig({ url: event.target.value })}
      />

      <VariableSelect
        id="http-response-var"
        label="Response variable"
        placeholder="e.g. responseBody"
        value={formatVariableDisplay(config.responseVariable ?? '')}
        options={variables.map((variable) => `$${variable.name}`)}
        onValueChange={(value: string) => {
          const normalized = normalizeVariableName(value)
          updateConfig({ responseVariable: normalized })
        }}
      />

      <label className="drawer-label" htmlFor="http-auth">
        <span className="label-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 10v8h12v-8M9 10V7a3 3 0 1 1 6 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </span>
        Authorization
      </label>
      <select
        id="http-auth"
        value={config.authType}
        onChange={(event) => updateConfig({ authType: event.target.value as HttpRequestAuthType })}
      >
        <option value="none">None</option>
        <option value="bearer">Bearer token</option>
        <option value="basic">Basic auth</option>
        <option value="apiKeyHeader">API key (header)</option>
        <option value="apiKeyQuery">API key (query)</option>
      </select>

      {config.authType === 'bearer' && (
        <>
          <label className="drawer-label" htmlFor="http-bearer">
            <span className="label-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 4v16m-6-8h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            Bearer token
          </label>
          <input
            id="http-bearer"
            type="text"
            value={config.bearerToken}
            onChange={(event) => updateConfig({ bearerToken: event.target.value })}
          />
        </>
      )}

      {config.authType === 'basic' && (
        <div className="two-col">
          <div>
            <label className="drawer-label" htmlFor="http-basic-user">
              <span className="label-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-6 6a6 6 0 1 1 12 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </span>
              Username
            </label>
            <input
              id="http-basic-user"
              type="text"
              value={config.basicUsername}
              onChange={(event) => updateConfig({ basicUsername: event.target.value })}
            />
          </div>
          <div>
            <label className="drawer-label" htmlFor="http-basic-pass">
              <span className="label-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 11V8a5 5 0 1 1 10 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none" />
                  <path d="M12 14v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              Password
            </label>
            <input
              id="http-basic-pass"
              type="password"
              value={config.basicPassword}
              onChange={(event) => updateConfig({ basicPassword: event.target.value })}
            />
          </div>
        </div>
      )}

      {(config.authType === 'apiKeyHeader' || config.authType === 'apiKeyQuery') && (
        <div className="two-col">
          <div>
            <label className="drawer-label" htmlFor="http-api-name">
              <span className="label-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h4l2-2 3 3 2-2 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </span>
              API key name
            </label>
            <input
              id="http-api-name"
              type="text"
              value={config.apiKeyName}
              onChange={(event) => updateConfig({ apiKeyName: event.target.value })}
            />
          </div>
          <div>
            <label className="drawer-label" htmlFor="http-api-value">
              <span className="label-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 12h6l2-3 3 4 2-2 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </span>
              API key value
            </label>
            <input
              id="http-api-value"
              type="text"
              value={config.apiKeyValue}
              onChange={(event) => updateConfig({ apiKeyValue: event.target.value })}
            />
          </div>
        </div>
      )}

      <label className="drawer-label">
        <span className="label-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 7h14M5 12h11M5 17h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        Headers
      </label>
      <div className="stacked-list">
        {config.headers.map((header, index) => (
          <div key={`header-${index}`} className="header-row">
            <input
              type="text"
              placeholder="Header name"
              value={header.name}
              onChange={(event) => updateHeader(index, 'name', event.target.value)}
            />
            <input
              type="text"
              placeholder="Value"
              value={header.value}
              onChange={(event) => updateHeader(index, 'value', event.target.value)}
            />
            <button type="button" className="ghost" onClick={() => removeHeader(index)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="ghost" onClick={addHeader}>
          Add header
        </button>
      </div>

      {config.method !== 'GET' && (
        <>
          <label className="drawer-label" htmlFor="http-body">
            <span className="label-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 5h14v14H5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M9 9h6v6H9z" fill="currentColor" />
              </svg>
            </span>
            Body (JSON or form)
          </label>
          <textarea
            id="http-body"
            placeholder='e.g. {"name":"value"}'
            rows={4}
            value={config.body}
            onChange={(event) => updateConfig({ body: event.target.value })}
          />
        </>
      )}
    </>
  )
}

export default HttpRequestForm
