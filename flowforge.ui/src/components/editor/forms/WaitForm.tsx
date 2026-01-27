import type { Dispatch, SetStateAction } from 'react'
import Icon from '../../Icon'
import { VariableSelect } from '../VariableSelect'
import type { WaitConfig, WorkflowVariable } from '../configTypes'

type WaitFormProps = {
  panelId: string
  variables: WorkflowVariable[]
  config: WaitConfig
  setWaitConfigs: Dispatch<SetStateAction<Record<string, WaitConfig>>>
  markDirty: () => void
}

function WaitForm({ panelId, variables, config, setWaitConfigs, markDirty }: WaitFormProps) {
  const variableOptions = variables.map((variable) => `$${variable.name}`)

  return (
    <>
      <label htmlFor="wait-delay" className="drawer-label">
        <span className="label-icon">
          <Icon name="rows" />
        </span>
        Delay (ms)
      </label>
      <input
        id="wait-delay"
        type="number"
        min={0}
        placeholder="e.g. 1000"
        value={config.delayMs ?? 0}
        onChange={(event) => {
          const value = Number(event.target.value)
          setWaitConfigs((current) => ({
            ...current,
            [panelId]: {
              ...current[panelId],
              delayMs: Number.isFinite(value) ? Math.max(0, value) : 0,
              delayVariable: current[panelId]?.delayVariable ?? '',
            },
          }))
          markDirty()
        }}
      />

      <VariableSelect
        id="wait-variable"
        label="Delay from variable (optional)"
        value={config.delayVariable ?? ''}
        options={variableOptions}
        placeholder="$delay"
        onValueChange={(next) => {
          setWaitConfigs((current) => ({
            ...current,
            [panelId]: {
              ...current[panelId],
              delayVariable: next,
              delayMs: current[panelId]?.delayMs ?? 0,
            },
          }))
          markDirty()
        }}
        showHints={false}
        trailingAction={
          config.delayVariable ? (
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setWaitConfigs((current) => ({
                  ...current,
                  [panelId]: {
                    ...current[panelId],
                    delayVariable: '',
                    delayMs: current[panelId]?.delayMs ?? 0,
                  },
                }))
                markDirty()
              }}
            >
              Clear
            </button>
          ) : null
        }
      />
      <p className="muted">
        If a variable is provided, its value (ms) overrides the numeric delay. Delay is clipped to a
        safe maximum on execute.
      </p>
    </>
  )
}

export default WaitForm
