export type StartConfig = {
  displayName: string
  trigger: 'manual' | 'on-save' | 'schedule'
  variables: string
}

export type CalculationConfig = {
  operation: 'Add' | 'Subtract' | 'Multiply' | 'Divide' | 'Concat'
  firstVariable: string
  secondVariable: string
  resultVariable: string
}

export type IfConfig = {
  first: string
  second: string
  dataType: 'String' | 'Number'
}

export type SwitchConfig = {
  expression: string
  cases: string[]
}

export type HttpRequestAuthType = 'none' | 'bearer' | 'basic' | 'apiKeyHeader' | 'apiKeyQuery'

export type HttpRequestConfig = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  body?: string
  headers: Array<{ name: string; value: string }>
  authType: HttpRequestAuthType
  bearerToken?: string
  basicUsername?: string
  basicPassword?: string
  apiKeyName?: string
  apiKeyValue?: string
  responseVariable?: string
}

export type ParserBlockFormat = 'json' | 'xml'

export type ParserBlockMapping = {
  path: string
  variable: string
}

export type ParserConfig = {
  format: ParserBlockFormat
  sourceVariable: string
  mappings: ParserBlockMapping[]
}

export type LoopConfig = {
  iterations: number
}

export type WaitConfig = {
  delayMs?: number
  delayVariable?: string
}

export type TextTransformOperation = 'Trim' | 'Lower' | 'Upper'

export type TextTransformConfig = {
  input?: string
  inputVariable?: string
  operation: TextTransformOperation
  resultVariable: string
}

export type TextReplaceRule = {
  from: string
  to: string
  useRegex?: boolean
  ignoreCase?: boolean
}

export type TextReplaceConfig = {
  input?: string
  inputVariable?: string
  resultVariable: string
  replacements: TextReplaceRule[]
}

export type WorkflowVariable = {
  id: number
  name: string
  defaultValue?: string | null
  workflowId: number
}
