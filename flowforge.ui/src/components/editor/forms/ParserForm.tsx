import { VariableSelect } from '../VariableSelect'
import type { ParserBlockFormat, ParserConfig, WorkflowVariable } from '../configTypes'

type ParserFormProps = {
  panelId: string
  variables: WorkflowVariable[]
  config: ParserConfig
  setParserConfigs: React.Dispatch<React.SetStateAction<Record<string, ParserConfig>>>
  formatVariableDisplay: (value: string) => string
  normalizeVariableName: (value: string) => string
  markDirty: () => void
}

function ParserForm({
  panelId,
  variables,
  config,
  setParserConfigs,
  formatVariableDisplay,
  normalizeVariableName,
  markDirty,
}: ParserFormProps) {
  const updateConfig = (partial: Partial<ParserConfig>) => {
    setParserConfigs((current) => ({
      ...current,
      [panelId]: { ...config, ...partial },
    }))
    markDirty()
  }

  const updateMapping = (index: number, key: 'path' | 'variable', value: string) => {
    const next = [...config.mappings]
    next[index] = { ...next[index], [key]: value }
    updateConfig({ mappings: next })
  }

  const addMapping = () => updateConfig({ mappings: [...config.mappings, { path: '', variable: '' }] })

  const removeMapping = (index: number) => updateConfig({ mappings: config.mappings.filter((_, i) => i !== index) })

  return (
    <>
      <label className="drawer-label" htmlFor="parser-format">
        <span className="label-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 6h14M5 12h14M5 18h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        Format
        <p className="muted">JSON (e.g. HTTP response) or XML payload to parse.</p>
      </label>
      <select
        id="parser-format"
        value={config.format}
        onChange={(event) => updateConfig({ format: event.target.value as ParserBlockFormat })}
      >
        <option value="json">JSON</option>
        <option value="xml">XML</option>
      </select>

      <VariableSelect
        id="parser-source"
        label="Source variable"
        placeholder="e.g. responseBody"
        value={formatVariableDisplay(config.sourceVariable)}
        options={variables.map((variable) => `$${variable.name}`)}
        onValueChange={(value: string) => updateConfig({ sourceVariable: normalizeVariableName(value) })}
      />
      <p className="muted">
        Point to the payload variable (e.g. <code>$http.body</code> or <code>$responseBody</code>). For JSON arrays, include the array name in the path (e.g. <code>$.responseBody[0].id</code>).
      </p>

      <label className="drawer-label">
        <span className="label-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 7h14M5 12h14M5 17h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        Mappings (path → variable)
      </label>
      <p className="muted">
        JSON: <code>$.field</code>, <code>$.items[0].id</code>. XML: <code>/root/item/id</code>. Each mapping writes the matched value into the target variable.
      </p>

      <div className="stacked-list">
        {(config.mappings.length ? config.mappings : [{ path: '', variable: '' }]).map((mapping, index) => (
          <div key={`mapping-${index}`} className="mapping-row">
            <input
              type="text"
              placeholder={config.format === 'json' ? '$.payload.id' : '/root/item/id'}
              value={mapping.path}
              onChange={(event) => updateMapping(index, 'path', event.target.value)}
            />
            <VariableSelect
              id={`parser-var-${index}`}
              label=""
              placeholder="Variable (e.g. itemId)"
              value={formatVariableDisplay(mapping.variable)}
              options={variables.map((variable) => `$${variable.name}`)}
              onValueChange={(value: string) => updateMapping(index, 'variable', normalizeVariableName(value))}
            />
            <button type="button" className="ghost" onClick={() => removeMapping(index)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="ghost" onClick={addMapping}>
          Add mapping
        </button>
      </div>
      <p className="muted">
        Paths: JSON uses dot/`$.field` style, XML uses XPath-like `/root/item/id`. Each mapping writes the matched value into the target variable.
      </p>
    </>
  )
}

export default ParserForm
