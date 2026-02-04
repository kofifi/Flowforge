import Icon from '../Icon'

type EditorTopbarProps = {
  workflowName: string
  subtitle: string
  saveStatus: string | null
  saving: boolean
  workflowLoading: boolean
  theme: 'light' | 'dark'
  onBack: () => void
  onToggleTheme: () => void
  onSave: () => void
  onRun: () => void
}

function EditorTopbar({
  workflowName,
  subtitle,
  saveStatus,
  saving,
  workflowLoading,
  theme,
  onBack,
  onToggleTheme,
  onSave,
  onRun,
}: EditorTopbarProps) {
  return (
    <header className="editor-topbar">
      <button
        type="button"
        className="ghost"
        onClick={onBack}
        aria-label="Back"
        style={{ justifySelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <span style={{ fontSize: 16 }}>←</span>
      </button>
      <div className="editor-title">
        <h1>{workflowName}</h1>
        <p className="subtitle">{subtitle}</p>
      </div>
      <div className="editor-actions">
        <button
          type="button"
          className="icon-button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
        <button type="button" onClick={onSave} disabled={saving || workflowLoading}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <button type="button" className="pill" onClick={onRun} disabled={workflowLoading || saving}>
            Run
          </button>
        </span>
        {saveStatus && <span className="hint">{saveStatus}</span>}
      </div>
    </header>
  )
}

export default EditorTopbar
