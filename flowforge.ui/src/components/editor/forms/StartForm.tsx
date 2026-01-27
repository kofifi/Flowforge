import type { Dispatch, SetStateAction } from 'react'
import type { Node } from '@reactflow/core'
import Icon from '../../Icon'
import type { NodeData } from '../types'
import type { StartConfig } from '../configTypes'

type StartFormProps = {
  panelId: string
  panelLabel: string
  config: StartConfig
  setStartConfigs: Dispatch<SetStateAction<Record<string, StartConfig>>>
  setNodes: Dispatch<SetStateAction<Array<Node<NodeData>>>>
  setPanelLabel: (label: string) => void
  markDirty: () => void
}

function StartForm({
  panelId,
  panelLabel,
  config,
  setStartConfigs,
  setNodes,
  setPanelLabel,
  markDirty,
}: StartFormProps) {
  return (
    <>
      <label htmlFor="start-display" className="drawer-label">
        <span className="label-icon">
          <Icon name="rows-wide" />
        </span>
        Display name
      </label>
      <input
        id="start-display"
        type="text"
        value={config.displayName ?? panelLabel}
        onChange={(event) => {
          const value = event.target.value
          setStartConfigs((current) => ({
            ...current,
            [panelId]: {
              displayName: value,
              trigger: current[panelId]?.trigger ?? 'manual',
              variables: current[panelId]?.variables ?? '',
            },
          }))
          setNodes((current) =>
            current.map((node) =>
              node.id === panelId
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      label: value || 'Start',
                    },
                  }
                : node,
            ),
          )
          setPanelLabel(value || 'Start')
          markDirty()
        }}
      />

      <label htmlFor="start-trigger" className="drawer-label">
        <span className="label-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 3v6l4 2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
          </svg>
        </span>
        Trigger
      </label>
      <select
        id="start-trigger"
        value={config.trigger ?? 'manual'}
        onChange={(event) => {
          const value = event.target.value as StartConfig['trigger']
          setStartConfigs((current) => ({
            ...current,
            [panelId]: {
              displayName: current[panelId]?.displayName ?? panelLabel,
              trigger: value,
              variables: current[panelId]?.variables ?? '',
            },
          }))
          markDirty()
        }}
      >
        <option value="manual">Manual</option>
        <option value="on-save">On save</option>
        <option value="schedule">Scheduled</option>
      </select>

      <label htmlFor="start-vars" className="drawer-label">
        <span className="label-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M12 7v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        Initial variables (JSON)
      </label>
      <textarea
        id="start-vars"
        rows={6}
        placeholder='{"customerId":"123"}'
        value={config.variables ?? ''}
        onChange={(event) => {
          const value = event.target.value
          setStartConfigs((current) => ({
            ...current,
            [panelId]: {
              displayName: current[panelId]?.displayName ?? panelLabel,
              trigger: current[panelId]?.trigger ?? 'manual',
              variables: value,
            },
          }))
          markDirty()
        }}
      />
      <p className="muted">Planowanie uruchomień konfiguruj w module Scheduler.</p>
    </>
  )
}

export default StartForm
