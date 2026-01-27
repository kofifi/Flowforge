import type { Dispatch, SetStateAction } from 'react'
import Icon from '../../Icon'
import { VariableSelect } from '../VariableSelect'
import type { TextTransformConfig, TextTransformOperation, WorkflowVariable } from '../configTypes'

type TextTransformFormProps = {
  panelId: string
  variables: WorkflowVariable[]
  config: TextTransformConfig
  setTextConfigs: Dispatch<SetStateAction<Record<string, TextTransformConfig>>>
  markDirty: () => void
}

const operations: TextTransformOperation[] = ['Trim', 'Lower', 'Upper']

function TextTransformForm({ panelId, variables, config, setTextConfigs, markDirty }: TextTransformFormProps) {
  const variableOptions = variables.map((v) => `$${v.name}`)

  const normalizeVariableName = (value: string) => {
    const trimmed = value.trim()
    return trimmed.startsWith('$') ? trimmed.slice(1) : trimmed
  }

  const formatVariableDisplay = (value: string) => {
    if (!value.trim()) return ''
    return value.startsWith('$') ? value : `$${value}`
  }

  const update = (partial: Partial<TextTransformConfig>) => {
    setTextConfigs((current) => {
      const existing = current[panelId] ?? config
      return {
        ...current,
        [panelId]: {
          ...existing,
          ...partial,
        },
      }
    })
    markDirty()
  }

  return (
    <>
      <label htmlFor="text-operation" className="drawer-label">
        <span className="label-icon">
          <Icon name="rows" />
        </span>
        Operation
      </label>
      <select
        id="text-operation"
        value={config.operation}
        onChange={(event) => update({ operation: event.target.value as TextTransformOperation })}
      >
        {operations.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>

      <label htmlFor="text-input" className="drawer-label">
        <span className="label-icon">
          <Icon name="rows" />
        </span>
        Input text (literal)
      </label>
      <input
        id="text-input"
        type="text"
        placeholder="Hello world"
        value={config.input ?? ''}
        onChange={(event) => update({ input: event.target.value })}
      />

      <VariableSelect
        id="text-input-variable"
        label="Or variable (overrides literal)"
        value={formatVariableDisplay(config.inputVariable ?? '')}
        options={variableOptions}
        placeholder="$text"
        onValueChange={(next) => update({ inputVariable: normalizeVariableName(next) })}
        showHints={false}
        trailingAction={
          config.inputVariable ? (
            <button type="button" className="ghost" onClick={() => update({ inputVariable: '' })}>
              Clear
            </button>
          ) : null
        }
      />

      <VariableSelect
        id="text-result"
        label="Result variable"
        placeholder="$result"
        value={formatVariableDisplay(config.resultVariable ?? 'result')}
        options={variableOptions}
        onValueChange={(next) => update({ resultVariable: normalizeVariableName(next) || 'result' })}
        showHints={false}
      />
      <p className="muted">
        Variable input takes priority over literal. Output is stored in the chosen result variable.
      </p>
    </>
  )
}

export default TextTransformForm
