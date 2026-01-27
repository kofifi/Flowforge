import Icon from '../../Icon'
import type { LoopConfig } from '../configTypes'

type LoopFormProps = {
  panelId: string
  config: LoopConfig
  setLoopConfigs: React.Dispatch<React.SetStateAction<Record<string, LoopConfig>>>
  markDirty: () => void
}

function LoopForm({ panelId, config, setLoopConfigs, markDirty }: LoopFormProps) {
  return (
    <>
      <label htmlFor="loop-iterations" className="drawer-label">
        <span className="label-icon">
          <Icon name="rows" />
        </span>
        Iterations
      </label>
      <input
        id="loop-iterations"
        type="number"
        min={0}
        placeholder="e.g. 3"
        value={config.iterations ?? 1}
        onChange={(event) => {
          const value = Number(event.target.value)
          setLoopConfigs((current) => ({
            ...current,
            [panelId]: {
              iterations: Number.isFinite(value) ? Math.max(0, value) : 0,
            },
          }))
          markDirty()
        }}
      />
      <p className="muted">
        Loop sends one branch through the loop output per iteration, then exits via the exit output.
      </p>
    </>
  )
}

export default LoopForm
