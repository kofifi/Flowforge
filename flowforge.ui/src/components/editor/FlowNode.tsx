import { Fragment, memo } from 'react'
import { Handle, Position, type NodeProps } from '@reactflow/core'
import type { NodeData } from './types'
import Icon from '../Icon'

const FlowNode = memo(function FlowNode({ data, id }: NodeProps<NodeData>) {
  const isStart = data.blockType === 'Start'
  const isEnd = data.blockType === 'End'
  const isIf = data.blockType === 'If'
  const isSwitch = data.blockType === 'Switch'
  const isLoop = data.blockType === 'Loop'
  const displayDescription = isSwitch
    ? 'Route by case labels.'
    : isLoop
      ? 'Repeat a branch multiple times.'
      : data.description
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
        <span className="node-chip">{data.label}</span>
        <span className="node-status">Ready</span>
        <button
          type="button"
          className="node-gear"
          aria-label="Open block settings"
          onClick={() => data.onOpenConfig?.({ id, blockType: data.blockType, label: data.label })}
        >
          <Icon name="gear" size={18} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', margin: '4px 0 6px' }}>
        <p className="node-title" style={{ margin: 0 }}>
          {data.label} block
        </p>
        <p className="node-meta" style={{ margin: 0, lineHeight: 1.3 }}>
          {displayDescription}
        </p>
      </div>

      {!isEnd && !isSwitch && !isLoop && (
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

      {isLoop && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="loop"
            style={{
              top: '45%',
              right: -8,
              ...handleBaseStyle,
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: 12,
              top: '45%',
              transform: 'translateY(-50%)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted, #7b8794)',
              pointerEvents: 'none',
            }}
          >
            loop
          </span>
          <Handle
            type="source"
            position={Position.Right}
            id="error"
            style={{
              top: '75%',
              right: -8,
              ...handleBaseStyle,
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: 12,
              top: '75%',
              transform: 'translateY(-50%)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted, #7b8794)',
              pointerEvents: 'none',
            }}
          >
            exit
          </span>
        </>
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
          {switchCases.map((_, index) => {
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
