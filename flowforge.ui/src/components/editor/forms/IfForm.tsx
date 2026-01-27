import { VariableSelect } from '../VariableSelect'
import Icon from '../../Icon'
import type { IfConfig, WorkflowVariable } from '../configTypes'

type IfFormProps = {
  panelId: string
  variables: WorkflowVariable[]
  config: IfConfig
  setIfConfigs: React.Dispatch<React.SetStateAction<Record<string, IfConfig>>>
  markDirty: () => void
}

function IfForm({ panelId, variables, config, setIfConfigs, markDirty }: IfFormProps) {
  return (
    <>
      <label htmlFor="if-first" className="drawer-label">
        <span className="label-icon">
          <Icon name="rows" />
        </span>
        First value
      </label>
      <VariableSelect
        id="if-first"
        label=""
        placeholder="Variable (e.g. amount) or literal"
        value={config.first ?? ''}
        options={variables.map((variable) => `$${variable.name}`)}
        onValueChange={(value: string) => {
          setIfConfigs((current) => ({
            ...current,
            [panelId]: {
              dataType: current[panelId]?.dataType ?? 'String',
              first: value,
              second: current[panelId]?.second ?? '',
            },
          }))
          markDirty()
        }}
      />

      <label htmlFor="if-second" className="drawer-label">
        <span className="label-icon">
          <Icon name="rows" />
        </span>
        Second value
      </label>
      <VariableSelect
        id="if-second"
        label=""
        placeholder="Variable (e.g. total) or literal"
        value={config.second ?? ''}
        options={variables.map((variable) => `$${variable.name}`)}
        onValueChange={(value: string) => {
          setIfConfigs((current) => ({
            ...current,
            [panelId]: {
              dataType: current[panelId]?.dataType ?? 'String',
              first: current[panelId]?.first ?? '',
              second: value,
            },
          }))
          markDirty()
        }}
      />

      <label htmlFor="if-type" className="drawer-label">
        <span className="label-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        Compare as
      </label>
      <select
        id="if-type"
        value={config.dataType ?? 'String'}
        onChange={(event) => {
          const value = event.target.value as IfConfig['dataType']
          setIfConfigs((current) => ({
            ...current,
            [panelId]: {
              dataType: value,
              first: current[panelId]?.first ?? '',
              second: current[panelId]?.second ?? '',
            },
          }))
          markDirty()
        }}
      >
        <option value="String">String</option>
        <option value="Number">Number</option>
      </select>
      <p className="muted">
        If evaluates to true, the first outgoing edge is taken; otherwise the second (error) edge.
      </p>
    </>
  )
}

export default IfForm
