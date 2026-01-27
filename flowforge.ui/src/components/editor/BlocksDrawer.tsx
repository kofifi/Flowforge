import { Suspense, lazy } from 'react'
import type { BlockTemplate } from './types'

const NodeCreator = lazy(() => import('./NodeCreator').then((mod) => ({ default: mod.NodeCreator })))

type BlocksDrawerProps = {
  onClose: () => void
  onCreate: (template: BlockTemplate) => void
  search: string
  onSearchChange: (next: string) => void
  category: 'All' | BlockTemplate['category']
  onCategoryChange: (next: 'All' | BlockTemplate['category']) => void
  availableTemplates: BlockTemplate[]
}

function BlocksDrawer({
  onClose,
  onCreate,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  availableTemplates,
}: BlocksDrawerProps) {
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="variables-drawer blocks-drawer">
        <div className="palette-header">
          <div>
            <p className="palette-title">Blocks</p>
            <span className="palette-subtitle">Add blocks anywhere on the canvas.</span>
          </div>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              onClose()
              onSearchChange('')
              onCategoryChange('All')
            }}
          >
            Close
          </button>
        </div>
        <Suspense fallback={<div style={{ padding: 16 }}>Loading blocks...</div>}>
          <NodeCreator
            onCreate={onCreate}
            search={search}
            onSearchChange={onSearchChange}
            category={category}
            onCategoryChange={onCategoryChange}
            availableTemplates={availableTemplates}
          />
        </Suspense>
      </aside>
    </>
  )
}

export default BlocksDrawer
