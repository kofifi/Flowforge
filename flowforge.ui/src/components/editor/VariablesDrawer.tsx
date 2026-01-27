import Icon from '../Icon'
import type { WorkflowVariable } from './configTypes'

type VariablesDrawerProps = {
  variables: WorkflowVariable[]
  variablesStatus: string | null
  variablesSaving: boolean
  variablesLocalError: string | null
  newVariableName: string
  newVariableDefault: string
  editingVariableId: number | null
  editingVariableName: string
  editingVariableDefault: string
  onClose: () => void
  onCreate: (event: React.FormEvent) => void
  onUpdate: (event: React.FormEvent) => void
  onDelete: (id: number) => void
  onStartEdit: (variable: WorkflowVariable) => void
  onCancelEdit: () => void
  setNewVariableName: (value: string) => void
  setNewVariableDefault: (value: string) => void
  setEditingVariableName: (value: string) => void
  setEditingVariableDefault: (value: string) => void
  markDirty: () => void
}

function VariablesDrawer({
  variables,
  variablesStatus,
  variablesSaving,
  variablesLocalError,
  newVariableName,
  newVariableDefault,
  editingVariableId,
  editingVariableName,
  editingVariableDefault,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onStartEdit,
  onCancelEdit,
  setNewVariableName,
  setNewVariableDefault,
  setEditingVariableName,
  setEditingVariableDefault,
  markDirty,
}: VariablesDrawerProps) {
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="variables-drawer">
        <div className="palette-header">
          <div>
            <p className="palette-title">Workflow variables</p>
            <span className="palette-subtitle">Used by Calculation blocks.</span>
          </div>
          <button type="button" className="ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <section className="variables-section">
          <div className="section-header">
            <p className="section-title">Add variable</p>
            <span className="section-subtitle">Name + default value.</span>
          </div>
          <form className="variables-form" onSubmit={onCreate}>
            <label className="drawer-label" htmlFor="var-name">
              <span className="label-icon">
                <Icon name="rows" />
              </span>
              Name
            </label>
            <input
              id="var-name"
              type="text"
              placeholder="e.g. total"
              value={newVariableName}
              onChange={(event) => {
                setNewVariableName(event.target.value)
                markDirty()
              }}
            />
            <label className="drawer-label" htmlFor="var-default">
              <span className="label-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 8h6M7 5v6M14 7h6M14 12h6M14 17h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              Default value
            </label>
            <input
              id="var-default"
              type="text"
              placeholder="Optional"
              value={newVariableDefault}
              onChange={(event) => {
                setNewVariableDefault(event.target.value)
                markDirty()
              }}
            />
            <button type="submit" disabled={!newVariableName.trim() || variablesSaving}>
              Add variable
            </button>
          </form>
        </section>

        <section className="variables-section">
          <div className="section-header">
            <p className="section-title">All variables</p>
            <span className="section-subtitle">{variables.length} total</span>
          </div>
          {variablesStatus ? (
            <p className="muted">{variablesStatus}</p>
          ) : (
            <ul className="variables-list">
              {variables.map((variable) => (
                <li key={variable.id} className="variable-card">
                  {editingVariableId === variable.id ? (
                    <form className="variable-edit" onSubmit={onUpdate}>
                      <label className="drawer-label" htmlFor={`edit-name-${variable.id}`}>
                        <span className="label-icon">
                          <Icon name="rows" />
                        </span>
                        Name
                      </label>
                      <input
                        id={`edit-name-${variable.id}`}
                        type="text"
                        value={editingVariableName}
                        onChange={(event) => {
                          setEditingVariableName(event.target.value)
                          markDirty()
                        }}
                      />
                      <label className="drawer-label" htmlFor={`edit-default-${variable.id}`}>
                        <span className="label-icon">
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 8h6M7 5v6M14 7h6M14 12h6M14 17h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          </svg>
                        </span>
                        Default value
                      </label>
                      <input
                        id={`edit-default-${variable.id}`}
                        type="text"
                        value={editingVariableDefault}
                        onChange={(event) => {
                          setEditingVariableDefault(event.target.value)
                          markDirty()
                        }}
                        placeholder="Optional"
                      />
                      <div className="card-actions">
                        <button type="submit" disabled={!editingVariableName.trim() || variablesSaving}>
                          Save
                        </button>
                        <button type="button" className="ghost" onClick={onCancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <p className="label">{variable.name}</p>
                        <p className="meta">Default: {variable.defaultValue ?? '—'}</p>
                      </div>
                      <div className="card-actions">
                        <button type="button" onClick={() => onStartEdit(variable)}>
                          Edit
                        </button>
                        <button type="button" className="danger" onClick={() => onDelete(variable.id)}>
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          {variablesLocalError && <p className="muted" style={{ color: 'var(--danger-600)' }}>{variablesLocalError}</p>}
        </section>
      </aside>
    </>
  )
}

export default VariablesDrawer
