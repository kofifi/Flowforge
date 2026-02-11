import { VariableSelect } from '../VariableSelect'
import type { CalculationConfig, WorkflowVariable } from '../configTypes'

type CalculationFormProps = {
  panelId: string
  variables: WorkflowVariable[]
  config: CalculationConfig
  setCalculationConfigs: React.Dispatch<React.SetStateAction<Record<string, CalculationConfig>>>
  normalizeVariableName: (value: string) => string
  markDirty: () => void
}

function CalculationForm({
  panelId,
  variables,
  config,
  setCalculationConfigs,
  normalizeVariableName,
  markDirty,
}: CalculationFormProps) {
  return (
    <>
      <label htmlFor="calc-operation" className="drawer-label">
        <span className="label-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 8h6M7 5v6M14 7h6M14 12h6M14 17h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        Operation
      </label>
      <select
        id="calc-operation"
        value={config.operation ?? 'Add'}
        onChange={(event) => {
          const value = event.target.value as CalculationConfig['operation']
          setCalculationConfigs((current) => ({
            ...current,
            [panelId]: {
              operation: value,
              firstVariable: current[panelId]?.firstVariable ?? '',
              secondVariable: current[panelId]?.secondVariable ?? '',
              resultVariable: current[panelId]?.resultVariable ?? '',
            },
          }))
          markDirty()
        }}
      >
        <option value="Add">Add</option>
        <option value="Subtract">Subtract</option>
        <option value="Multiply">Multiply</option>
        <option value="Divide">Divide</option>
        <option value="Concat">Concat</option>
      </select>

      <VariableSelect
        id="calc-first"
        label="First variable"
        placeholder="e.g. amount"
        value={config.firstVariable ?? ''}
        options={variables.map((variable) => `$${variable.name}`)}
        onValueChange={(value: string) => {
          const normalized = normalizeVariableName(value)
          setCalculationConfigs((current) => ({
            ...current,
            [panelId]: {
              operation: current[panelId]?.operation ?? 'Add',
              firstVariable: normalized,
              secondVariable: current[panelId]?.secondVariable ?? '',
              resultVariable: current[panelId]?.resultVariable ?? '',
            },
          }))
          markDirty()
        }}
      />

      <VariableSelect
        id="calc-second"
        label="Second variable"
        placeholder="e.g. tax"
        value={config.secondVariable ?? ''}
        options={variables.map((variable) => `$${variable.name}`)}
        onValueChange={(value: string) => {
          const normalized = normalizeVariableName(value)
          setCalculationConfigs((current) => ({
            ...current,
            [panelId]: {
              operation: current[panelId]?.operation ?? 'Add',
              firstVariable: current[panelId]?.firstVariable ?? '',
              secondVariable: normalized,
              resultVariable: current[panelId]?.resultVariable ?? '',
            },
          }))
          markDirty()
        }}
      />

      <VariableSelect
        id="calc-result"
        label="Result variable"
        placeholder="e.g. total"
        value={config.resultVariable ?? ''}
        options={variables.map((variable) => `$${variable.name}`)}
        onValueChange={(value: string) => {
          const normalized = normalizeVariableName(value)
          setCalculationConfigs((current) => ({
            ...current,
            [panelId]: {
              operation: current[panelId]?.operation ?? 'Add',
              firstVariable: current[panelId]?.firstVariable ?? '',
              secondVariable: current[panelId]?.secondVariable ?? '',
              resultVariable: normalized,
            },
          }))
          markDirty()
        }}
      />
      <p className="muted">Saved as JSON config with CalculationOperation and variable names.</p>
    </>
  )
}

export default CalculationForm
