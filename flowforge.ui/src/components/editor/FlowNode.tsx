import { Fragment, memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import type { NodeData } from './types'

const FlowNode = memo(function FlowNode({ data, id }: NodeProps<NodeData>) {
  const isStart = data.blockType === 'Start'
  const isEnd = data.blockType === 'End'
  const isIf = data.blockType === 'If'
  const isSwitch = data.blockType === 'Switch'
  const displayDescription = isSwitch ? 'Route by case labels.' : data.description
  const switchCases = data.switchCases ?? ['']
  const switchHandleCount = switchCases.length + 1
  const switchHandleStartPx = 80
  const switchHandleSpacingPx = 22
  const switchHeight = isSwitch
    ? Math.max(120, switchHandleStartPx + (switchHandleCount - 1) * switchHandleSpacingPx + 32)
    : undefined
  const handleBaseStyle = {
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: 'var(--handle-default-bg)',
    border: '2px solid var(--handle-default-border)',
  }
  const handleSuccessStyle = {
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: 'var(--handle-success)',
    border: '2px solid var(--handle-success)',
  }
  const handleErrorStyle = {
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: 'var(--handle-error)',
    border: '2px solid var(--handle-error)',
  }

  return (
    <div
      className="node-card"
      style={{
        position: 'relative',
        height: switchHeight ? `${switchHeight}px` : undefined,
        padding: '6px 14px',
        paddingRight: isSwitch ? 46 : 14,
      }}
    >
      {!isStart && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            left: -14,
            ...handleBaseStyle,
          }}
        />
      )}

      <div className="node-header">
        <span className="node-chip">{data.blockType}</span>
        <span className="node-status">{isStart ? 'Ready' : 'Ready'}</span>
        <button
          type="button"
          className="node-gear"
          aria-label="Open block settings"
          onClick={() => data.onOpenConfig?.({ id, blockType: data.blockType, label: data.label })}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.22-1.13.52-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.8 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.92 14.5a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.42 1.05.72 1.63.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54c.58-.22 1.13-.52 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', margin: '4px 0 6px' }}>
        <p className="node-title" style={{ margin: 0 }}>
          {data.label}
        </p>
        <p className="node-meta" style={{ margin: 0, lineHeight: 1.3 }}>
          {displayDescription}
        </p>
      </div>

      {!isEnd && !isSwitch && (
        <Handle
          type="source"
          position={Position.Right}
          id={isIf ? 'success' : undefined}
          style={
            isIf
              ? {
                  top: '45%',
                  right: -8,
                  ...handleSuccessStyle,
                }
              : {
                  right: -8,
                  ...handleBaseStyle,
                }
          }
        />
      )}

      {isIf && data.allowErrorOutput && (
        <Handle
          type="source"
          position={Position.Right}
          id="error"
          style={{
            top: '75%',
            right: -8,
            ...handleErrorStyle,
          }}
        />
      )}

      {isSwitch && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            id="switch-target"
            style={{
              left: -14,
              top: '50%',
              ...handleBaseStyle,
            }}
          />
          {switchCases.map((caseValue, index) => {
            const topPx = switchHandleStartPx + index * switchHandleSpacingPx
            return (
              <Fragment key={`${id}-case-${index}`}>
                <span
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: `${topPx}px`,
                    transform: 'translateY(-50%)',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-muted, #7b8794)',
                    pointerEvents: 'none',
                  }}
                >
                  {index + 1}
                </span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`case-${index + 1}`}
                  style={{
                    top: `${topPx}px`,
                    right: -6,
                    ...handleBaseStyle,
                  }}
                />
              </Fragment>
            )
          })}
          {(() => {
            const defaultTop = switchHandleStartPx + switchHandleSpacingPx * switchCases.length
            return (
              <Fragment key={`${id}-case-default`}>
                <span
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: `${defaultTop}px`,
                    transform: 'translateY(-50%)',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-muted, #7b8794)',
                    pointerEvents: 'none',
                  }}
                >
                  default
                </span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id="default"
                  style={{
                    top: `${defaultTop}px`,
                    right: -6,
                    ...handleBaseStyle,
                  }}
                />
              </Fragment>
            )
          })()}
        </>
      )}
    </div>
  )
})

export default FlowNode
