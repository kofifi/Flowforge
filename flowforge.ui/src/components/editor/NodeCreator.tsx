import { useMemo } from 'react'
import type { BlockTemplate } from './types'

type NodeCreatorProps = {
  onCreate: (template: BlockTemplate) => void
  search: string
  onSearchChange: (next: string) => void
  category: 'All' | BlockTemplate['category']
  onCategoryChange: (next: 'All' | BlockTemplate['category']) => void
  availableTemplates: BlockTemplate[]
}

export function NodeCreator({
  onCreate,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  availableTemplates,
}: NodeCreatorProps) {
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return availableTemplates.filter((template) => {
      const matchesCategory = category === 'All' || template.category === category
      const matchesQuery =
        !query ||
        template.label.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query)
      return matchesCategory && matchesQuery
    })
  }, [availableTemplates, category, search])

  const byCategory = useMemo(() => {
    const map = new Map<string, BlockTemplate[]>()
    filtered.forEach((template) => {
      if (!map.has(template.category)) {
        map.set(template.category, [])
      }
      map.get(template.category)!.push(template)
    })
    return Array.from(map.entries())
  }, [filtered])

  return (
    <div className="block-panel">
      <div className="palette-header">
        <p className="palette-title">Add block</p>
        <span className="palette-subtitle">Search or browse by type.</span>
      </div>
      <div className="palette-search">
        <input
          type="text"
          placeholder="Search blocks..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <div className="palette-filters">
          {['All', 'Flow', 'Logic', 'Action'].map((value) => (
            <button
              key={value}
              type="button"
              className={`chip ${category === value ? 'chip--active' : ''}`}
              onClick={() => onCategoryChange(value as 'All' | BlockTemplate['category'])}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      {byCategory.map(([group, items]) => (
        <div key={group} className="palette-section">
          <div className="section-header">
            <p className="section-title">{group}</p>
            <span className="section-subtitle">{items.length} blocks</span>
          </div>
          <div className="palette-grid cards">
            {items.map((template) => (
              <button
                key={template.type}
                type="button"
                className="palette-item block-card"
                onClick={() => onCreate(template)}
              >
                <div className="block-card__title">{template.label}</div>
                <div className="block-card__desc">{template.description}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
      {filtered.length === 0 && <p className="muted">No blocks match your filters.</p>}
    </div>
  )
}
