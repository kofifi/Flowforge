export type OnOpenConfigPayload = {
  id: string
  blockType: string
  label: string
}

export type NodeData = {
  blockType: string
  label: string
  description: string
  onOpenConfig?: (payload: OnOpenConfigPayload) => void
  allowErrorOutput?: boolean
  switchCases?: string[]
}

export type BlockTemplate = {
  type: string
  label: string
  description: string
  category: 'Flow' | 'Logic' | 'Action'
}
