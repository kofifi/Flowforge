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
