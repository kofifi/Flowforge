import { VariableSelect } from '../VariableSelect'
import Icon from '../../Icon'
import type { SwitchConfig, WorkflowVariable } from '../configTypes'

type SwitchFormProps = {
  panelId: string
  variables: WorkflowVariable[]
  config: SwitchConfig
  normalizeSwitchCases: (values: unknown) => string[]
  setSwitchConfigs: React.Dispatch<React.SetStateAction<Record<string, SwitchConfig>>>
  markDirty: () => void
}

function SwitchForm({
  panelId,
  variables,
  config,
  normalizeSwitchCases,
  setSwitchConfigs,
  markDirty,
}: SwitchFormProps) {
  return (
    <>
      <VariableSelect
        id="switch-expression"
        label="Expression / variable"
        placeholder="$variable or literal"
        value={config.expression ?? ''}
        options={variables.map((variable) => `$${variable.name}`)}
        onValueChange={(value: string) => {
          setSwitchConfigs((current) => ({
            ...current,
            [panelId]: {
              expression: value,
              cases: normalizeSwitchCases(current[panelId]?.cases),
            },
          }))
          markDirty()
        }}
      />

      <label className="drawer-label">
        <span className="label-icon">
          <Icon name="rows" />
        </span>
        Cases
      </label>
      {(config.cases ?? ['']).map((caseValue, idx) => (
        <VariableSelect
          key={`switch-case-${idx}`}
          id={`switch-case-${panelId}-${idx}`}
          label={`Case ${idx + 1}`}
          placeholder="Value (e.g. pending)"
          value={caseValue}
          options={variables.map((variable) => `$${variable.name}`)}
          showHints={false}
          onValueChange={(value: string) => {
            setSwitchConfigs((current) => {
              const currentCases = normalizeSwitchCases(current[panelId]?.cases)
              const nextCases = [...currentCases]
              nextCases[idx] = value
              return {
                ...current,
                [panelId]: {
                  expression: current[panelId]?.expression ?? '',
                  cases: nextCases,
                },
              }
            })
            markDirty()
          }}
          trailingAction={
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setSwitchConfigs((current) => {
                  const currentCases = normalizeSwitchCases(current[panelId]?.cases)
                  const nextCases = currentCases.length <= 1 ? [''] : currentCases.filter((_, i) => i !== idx)
                  return {
                    ...current,
                    [panelId]: {
                      expression: current[panelId]?.expression ?? '',
                      cases: nextCases,
                    },
                  }
                })
                markDirty()
              }}
            >
              Remove
            </button>
          }
        />
      ))}
      <button
        type="button"
        className="ghost"
        onClick={() => {
          setSwitchConfigs((current) => {
            const nextCases = [...normalizeSwitchCases(current[panelId]?.cases), '']
            return {
              ...current,
              [panelId]: {
                expression: current[panelId]?.expression ?? '',
                cases: nextCases,
              },
            }
          })
          markDirty()
        }}
      >
        Add case
      </button>
      <p className="muted">
        Switch routes by matching case values to connection labels. Use the default handle for unmatched values.
      </p>
    </>
  )
}

export default SwitchForm
