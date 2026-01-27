import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Icon from '../Icon'

type VariableSelectProps = {
  id: string
  label: string
  value: string
  options: string[]
  placeholder?: string
  onValueChange: (next: string) => void
  trailingAction?: ReactNode
  showHints?: boolean
}

export function VariableSelect({
  id,
  label,
  value,
  options,
  placeholder,
  onValueChange,
  trailingAction,
  showHints = true,
}: VariableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)

  useEffect(() => {
    setQuery(value)
  }, [value])

  const isKnown = useMemo(
    () => options.some((option) => option === value),
    [options, value],
  )

  const showNotVariable = showHints && value.trim().length > 0 && !isKnown

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return options
    return options.filter((option) => option.toLowerCase().includes(normalized))
  }, [options, query])

  return (
    <div className="combo">
      <label className="drawer-label" htmlFor={id}>
        <span className="label-icon">
          <Icon name="rows" />
        </span>
        {label}
      </label>
      <div
        className={`combo-input ${isKnown ? 'combo-input--known' : ''} ${
          trailingAction ? 'combo-input--with-action' : ''
        }`}
      >
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            const next = event.target.value
            setQuery(next)
            onValueChange(next)
            setOpen(true)
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120)
          }}
        />
        {trailingAction && <span className="combo-action">{trailingAction}</span>}
        <span className="combo-icon">⌄</span>
      </div>
      {showHints && isKnown && <span className="combo-hint">Matched variable</span>}
      {showNotVariable && <span className="combo-warn">This is not a variable</span>}
      {open && (
        <div className="combo-menu">
          {filtered.length === 0 ? (
            <div className="combo-empty">No matches</div>
          ) : (
            filtered.map((option) => (
              <button
                key={option}
                type="button"
                className="combo-item"
                onClick={() => {
                  onValueChange(option)
                  setQuery(option)
                  setOpen(false)
                }}
              >
                {option}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
