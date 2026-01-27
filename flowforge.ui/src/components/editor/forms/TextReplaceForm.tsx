import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import Icon from '../../Icon'
import { VariableSelect } from '../VariableSelect'
import type { TextReplaceConfig, TextReplaceRule, WorkflowVariable } from '../configTypes'

type TextReplaceFormProps = {
  panelId: string
  variables: WorkflowVariable[]
  config: TextReplaceConfig
  setTextReplaceConfigs: Dispatch<SetStateAction<Record<string, TextReplaceConfig>>>
  markDirty: () => void
}

function TextReplaceForm({ panelId, variables, config, setTextReplaceConfigs, markDirty }: TextReplaceFormProps) {
  const variableOptions = variables.map((v) => `$${v.name}`)
  const [draftReplacements, setDraftReplacements] = useState<TextReplaceRule[]>(
    config.replacements && config.replacements.length > 0
      ? config.replacements
      : [{ from: '', to: '', useRegex: false, ignoreCase: false }],
  )

  useEffect(() => {
    const next = config.replacements && config.replacements.length > 0
      ? config.replacements
      : [{ from: '', to: '', useRegex: false, ignoreCase: false }]
    setDraftReplacements(next)
  }, [config.replacements])

  const normalizeVariableName = (value: string) => {
    const trimmed = value.trim()
    return trimmed.startsWith('$') ? trimmed.slice(1) : trimmed
  }

  const formatVariableDisplay = (value: string) => {
    if (!value.trim()) return ''
    return value.startsWith('$') ? value : `$${value}`
  }

  const commitReplacements = (next: TextReplaceRule[]) => {
    setDraftReplacements(next)
    setTextReplaceConfigs((current) => ({
      ...current,
      [panelId]: {
        input: current[panelId]?.input ?? config.input ?? '',
        inputVariable: current[panelId]?.inputVariable ?? config.inputVariable ?? '',
        resultVariable: current[panelId]?.resultVariable ?? config.resultVariable ?? 'result',
        replacements: next,
      },
    }))
    markDirty()
  }

  const updateReplacement = (index: number, partial: Partial<TextReplaceRule>) => {
    const next = draftReplacements.map((rule, idx) => (idx === index ? { ...rule, ...partial } : rule))
    commitReplacements(next)
  }

  const addReplacement = () => {
    commitReplacements([
      ...draftReplacements,
      { from: '', to: '', useRegex: false, ignoreCase: false },
    ])
  }

  const removeReplacement = (index: number) => {
    const next = draftReplacements.filter((_, idx) => idx !== index)
    commitReplacements(next.length > 0 ? next : [{ from: '', to: '', useRegex: false, ignoreCase: false }])
  }

  return (
    <>
      <label htmlFor="replace-input" className="drawer-label">
        <span className="label-icon">
          <Icon name="rows" />
        </span>
        Input text (literal)
      </label>
      <input
        id="replace-input"
        type="text"
        placeholder="Original text"
        value={config.input ?? ''}
        onChange={(event) => {
          const value = event.target.value
          setTextReplaceConfigs((current) => ({
            ...current,
            [panelId]: {
              ...current[panelId],
              input: value,
              inputVariable: current[panelId]?.inputVariable ?? '',
              resultVariable: current[panelId]?.resultVariable ?? 'result',
              replacements: draftReplacements,
            },
          }))
          markDirty()
        }}
      />

      <VariableSelect
        id="replace-input-variable"
        label="Or variable (overrides literal)"
        value={formatVariableDisplay(config.inputVariable ?? '')}
        options={variableOptions}
        placeholder="$text"
        onValueChange={(next) => {
          setTextReplaceConfigs((current) => ({
            ...current,
            [panelId]: {
              ...current[panelId],
              inputVariable: normalizeVariableName(next),
              input: current[panelId]?.input ?? '',
              resultVariable: current[panelId]?.resultVariable ?? 'result',
              replacements: draftReplacements,
            },
          }))
          markDirty()
        }}
        showHints={false}
        trailingAction={
          config.inputVariable ? (
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setTextReplaceConfigs((current) => ({
                  ...current,
                  [panelId]: {
                    ...current[panelId],
                    inputVariable: '',
                    input: current[panelId]?.input ?? '',
                    resultVariable: current[panelId]?.resultVariable ?? 'result',
                    replacements: draftReplacements,
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

      <div className="section-header" style={{ marginTop: 12 }}>
        <div>
          <p className="section-title">Replacements</p>
          <span className="section-subtitle">{draftReplacements.length} rule(s)</span>
        </div>
        <button type="button" className="ghost" onClick={addReplacement}>
          Add rule
        </button>
      </div>

      <div className="card stack" style={{ gap: 10 }}>
        {draftReplacements.map((rule, index) => (
          <div key={`replace-${index}`} className="card" style={{ padding: 12, gap: 8 }}>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div className="combo">
                <label className="drawer-label" htmlFor={`replace-from-${index}`}>
                  <span className="label-icon">
                    <Icon name="rows" />
                  </span>
                  From
                </label>
                <input
                  id={`replace-from-${index}`}
                  type="text"
                  value={rule.from}
                  onChange={(event) => updateReplacement(index, { from: event.target.value })}
                />
              </div>
              <div className="combo">
                <label className="drawer-label" htmlFor={`replace-to-${index}`}>
                  <span className="label-icon">
                    <Icon name="rows" />
                  </span>
                  To
                </label>
                <input
                  id={`replace-to-${index}`}
                  type="text"
                  value={rule.to}
                  onChange={(event) => updateReplacement(index, { to: event.target.value })}
                />
              </div>
            </div>
            <div className="row" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label className="switch" style={{ marginRight: 12 }}>
                <input
                  type="checkbox"
                  checked={rule.useRegex === true}
                  onChange={(event) => updateReplacement(index, { useRegex: event.target.checked })}
                />
                <span className="switch-slider" />
                <span className="muted">Use regex</span>
              </label>
              <label className="switch" style={{ marginRight: 'auto' }}>
                <input
                  type="checkbox"
                  checked={rule.ignoreCase === true}
                  onChange={(event) => updateReplacement(index, { ignoreCase: event.target.checked })}
                />
                <span className="switch-slider" />
                <span className="muted">Ignore case</span>
              </label>
              {draftReplacements.length > 1 && (
                <button type="button" className="ghost" onClick={() => removeReplacement(index)}>
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <VariableSelect
        id="replace-result"
        label="Result variable"
        placeholder="$result"
        value={formatVariableDisplay(config.resultVariable ?? 'result')}
        options={variableOptions}
        onValueChange={(next) => {
          setTextReplaceConfigs((current) => ({
            ...current,
            [panelId]: {
              ...current[panelId],
              input: current[panelId]?.input ?? '',
              inputVariable: current[panelId]?.inputVariable ?? '',
              resultVariable: normalizeVariableName(next) || 'result',
              replacements: draftReplacements,
            },
          }))
          markDirty()
        }}
        showHints={false}
      />
      <p className="muted">
        Rules are applied in order. Regex rules are capped for safety; invalid patterns are skipped.
      </p>
    </>
  )
}

export default TextReplaceForm
