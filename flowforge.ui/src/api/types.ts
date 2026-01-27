export type WorkflowDto = {
  id: number
  name: string
}

export type WorkflowVariableDto = {
  id: number
  name: string
  defaultValue?: string | null
  workflowId: number
  workflow?: WorkflowDto
}

export type WorkflowGraphDto = {
  workflowId: number
  name: string
  blocks: Array<{
    id: number
    name: string
    systemBlockId: number
    systemBlockType: string
    jsonConfig?: string | null
    positionX?: number | null
    positionY?: number | null
  }>
  connections: Array<{
    id: number
    sourceBlockId: number
    targetBlockId: number
    connectionType: 'Success' | 'Error' | string
  }>
}

export type SystemBlockDto = {
  id: number
  type: string
  description: string
}

export type WorkflowRevisionDto = {
  id: number
  workflowId: number
  version: string
  label?: string | null
  createdAt: string
  appliedAt?: string | null
  isActive: boolean
}

export type WorkflowScheduleDto = {
  id: number
  workflowId: number
  workflowRevisionId?: number | null
  name: string
  description?: string | null
  triggerType: string
  startAtUtc: string
  intervalMinutes?: number | null
  isActive: boolean
  lastRunAtUtc?: string | null
  nextRunAtUtc?: string | null
}
