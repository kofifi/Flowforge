import { Suspense, lazy, type Dispatch, type SetStateAction } from 'react'
import type { Node } from '@reactflow/core'
import type { NodeData } from './types'
import type {
  CalculationConfig,
  HttpRequestConfig,
  IfConfig,
  LoopConfig,
  ParserConfig,
  StartConfig,
  SwitchConfig,
  WaitConfig,
  TextTransformConfig,
  TextReplaceConfig,
} from './configTypes'
import type { WorkflowVariable } from './configTypes'

const StartForm = lazy(() => import('./forms/StartForm'))
const IfForm = lazy(() => import('./forms/IfForm'))
const SwitchForm = lazy(() => import('./forms/SwitchForm'))
const LoopForm = lazy(() => import('./forms/LoopForm'))
const WaitForm = lazy(() => import('./forms/WaitForm'))
const CalculationForm = lazy(() => import('./forms/CalculationForm'))
const HttpRequestForm = lazy(() => import('./forms/HttpRequestForm'))
const ParserForm = lazy(() => import('./forms/ParserForm'))
const TextTransformForm = lazy(() => import('./forms/TextTransformForm'))
const TextReplaceForm = lazy(() => import('./forms/TextReplaceForm'))

export type ConfigPanelState = {
  id: string
  blockType: string
  label: string
}

type ConfigDrawerProps = {
  panel: ConfigPanelState
  variables: WorkflowVariable[]
  startConfigs: Record<string, StartConfig>
  setStartConfigs: Dispatch<SetStateAction<Record<string, StartConfig>>>
  ifConfigs: Record<string, IfConfig>
  setIfConfigs: Dispatch<SetStateAction<Record<string, IfConfig>>>
  switchConfigs: Record<string, SwitchConfig>
  setSwitchConfigs: Dispatch<SetStateAction<Record<string, SwitchConfig>>>
  loopConfigs: Record<string, LoopConfig>
  setLoopConfigs: Dispatch<SetStateAction<Record<string, LoopConfig>>>
  waitConfigs: Record<string, WaitConfig>
  setWaitConfigs: Dispatch<SetStateAction<Record<string, WaitConfig>>>
  calculationConfigs: Record<string, CalculationConfig>
  setCalculationConfigs: Dispatch<SetStateAction<Record<string, CalculationConfig>>>
  textTransformConfigs: Record<string, TextTransformConfig>
  setTextTransformConfigs: Dispatch<SetStateAction<Record<string, TextTransformConfig>>>
  textReplaceConfigs: Record<string, TextReplaceConfig>
  setTextReplaceConfigs: Dispatch<SetStateAction<Record<string, TextReplaceConfig>>>
  httpConfigs: Record<string, HttpRequestConfig>
  setHttpConfigs: Dispatch<SetStateAction<Record<string, HttpRequestConfig>>>
  parserConfigs: Record<string, ParserConfig>
  setParserConfigs: Dispatch<SetStateAction<Record<string, ParserConfig>>>
  normalizeSwitchCases: (values: unknown) => string[]
  formatVariableDisplay: (value: string) => string
  normalizeVariableName: (value: string) => string
  setNodes: Dispatch<SetStateAction<Array<Node<NodeData>>>>
  setPanelLabel: (label: string) => void
  markDirty: () => void
  onClose: () => void
}

const ConfigDrawer = ({
  panel,
  variables,
  startConfigs,
  setStartConfigs,
  ifConfigs,
  setIfConfigs,
  switchConfigs,
  setSwitchConfigs,
  loopConfigs,
  setLoopConfigs,
  waitConfigs,
  setWaitConfigs,
  calculationConfigs,
  setCalculationConfigs,
  textTransformConfigs,
  setTextTransformConfigs,
  textReplaceConfigs,
  setTextReplaceConfigs,
  httpConfigs,
  setHttpConfigs,
  parserConfigs,
  setParserConfigs,
  normalizeSwitchCases,
  formatVariableDisplay,
  normalizeVariableName,
  setNodes,
  setPanelLabel,
  markDirty,
  onClose,
}: ConfigDrawerProps) => {
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="config-drawer">
        <div className="drawer-header">
          <div>
            <p className="drawer-title">{panel.label} settings</p>
            <span className="drawer-subtitle">{panel.blockType} block</span>
          </div>
          <button type="button" className="ghost" onClick={onClose}>
            Close
          </button>
        </div>

        {panel.blockType === 'Start' ? (
          <Suspense fallback={<div className="drawer-form">Loading start settings...</div>}>
            <form className="drawer-form">
              <StartForm
                panelId={panel.id}
                panelLabel={panel.label}
                config={
                  startConfigs[panel.id] ?? {
                    displayName: panel.label,
                    trigger: 'manual',
                    variables: '',
                  }
                }
                setStartConfigs={setStartConfigs}
                setNodes={setNodes}
                setPanelLabel={setPanelLabel}
                markDirty={markDirty}
              />
            </form>
          </Suspense>
        ) : panel.blockType === 'If' ? (
          <Suspense fallback={<div className="drawer-form">Loading if settings...</div>}>
            <form className="drawer-form">
              <IfForm
                panelId={panel.id}
                variables={variables}
                config={
                  ifConfigs[panel.id] ?? {
                    first: '',
                    second: '',
                    dataType: 'String',
                  }
                }
                setIfConfigs={setIfConfigs}
                markDirty={markDirty}
              />
            </form>
          </Suspense>
        ) : panel.blockType === 'Switch' ? (
          <Suspense fallback={<div className="drawer-form">Loading switch settings...</div>}>
            <form className="drawer-form">
              <SwitchForm
                panelId={panel.id}
                variables={variables}
                config={
                  switchConfigs[panel.id] ?? {
                    expression: '',
                    cases: [''],
                  }
                }
                normalizeSwitchCases={normalizeSwitchCases}
                setSwitchConfigs={setSwitchConfigs}
                markDirty={markDirty}
              />
            </form>
          </Suspense>
        ) : panel.blockType === 'Loop' ? (
          <Suspense fallback={<div className="drawer-form">Loading loop settings...</div>}>
            <form className="drawer-form">
              <LoopForm
                panelId={panel.id}
                config={
                  loopConfigs[panel.id] ?? {
                    iterations: 1,
                  }
                }
                setLoopConfigs={setLoopConfigs}
                markDirty={markDirty}
              />
            </form>
          </Suspense>
        ) : panel.blockType === 'Wait' ? (
          <Suspense fallback={<div className="drawer-form">Loading wait settings...</div>}>
            <form className="drawer-form">
              <WaitForm
                panelId={panel.id}
                variables={variables}
                config={
                  waitConfigs[panel.id] ?? {
                    delayMs: 1000,
                    delayVariable: '',
                  }
                }
                setWaitConfigs={setWaitConfigs}
                markDirty={markDirty}
              />
            </form>
          </Suspense>
        ) : panel.blockType === 'Calculation' ? (
          <Suspense fallback={<div className="drawer-form">Loading calculation settings...</div>}>
            <form className="drawer-form">
              <CalculationForm
                panelId={panel.id}
                variables={variables}
                config={
                  calculationConfigs[panel.id] ?? {
                    operation: 'Add',
                    firstVariable: '',
                    secondVariable: '',
                    resultVariable: '',
                  }
                }
                setCalculationConfigs={setCalculationConfigs}
                normalizeVariableName={normalizeVariableName}
                markDirty={markDirty}
              />
            </form>
          </Suspense>
        ) : panel.blockType === 'TextTransform' ? (
          <Suspense fallback={<div className="drawer-form">Loading text settings...</div>}>
            <form className="drawer-form">
              <TextTransformForm
                panelId={panel.id}
                variables={variables}
                config={
                  textTransformConfigs[panel.id] ?? {
                    input: '',
                    inputVariable: '',
                    operation: 'Trim',
                    resultVariable: 'result',
                  }
                }
                setTextConfigs={setTextTransformConfigs}
                markDirty={markDirty}
              />
            </form>
          </Suspense>
        ) : panel.blockType === 'TextReplace' ? (
          <Suspense fallback={<div className="drawer-form">Loading replace settings...</div>}>
            <form className="drawer-form">
              <TextReplaceForm
                panelId={panel.id}
                variables={variables}
                config={
                  textReplaceConfigs[panel.id] ?? {
                    input: '',
                    inputVariable: '',
                    resultVariable: 'result',
                    replacements: [{ from: '', to: '', useRegex: false, ignoreCase: false }],
                  }
                }
                setTextReplaceConfigs={setTextReplaceConfigs}
                markDirty={markDirty}
              />
            </form>
          </Suspense>
        ) : panel.blockType === 'HttpRequest' ? (
          <Suspense fallback={<div className="drawer-form">Loading HTTP settings...</div>}>
            <form className="drawer-form">
              <HttpRequestForm
                panelId={panel.id}
                variables={variables}
                config={
                  httpConfigs[panel.id] ?? {
                    method: 'GET',
                    url: '',
                    body: '',
                    headers: [],
                    authType: 'none',
                    bearerToken: '',
                    basicUsername: '',
                    basicPassword: '',
                    apiKeyName: '',
                    apiKeyValue: '',
                    responseVariable: '',
                  }
                }
                setHttpConfigs={setHttpConfigs}
                formatVariableDisplay={formatVariableDisplay}
                normalizeVariableName={normalizeVariableName}
                markDirty={markDirty}
              />
            </form>
          </Suspense>
        ) : panel.blockType === 'Parser' ? (
          <Suspense fallback={<div className="drawer-form">Loading parser settings...</div>}>
            <form className="drawer-form">
              <ParserForm
                panelId={panel.id}
                variables={variables}
                config={
                  parserConfigs[panel.id] ?? {
                    format: 'json',
                    sourceVariable: '',
                    mappings: [],
                  }
                }
                setParserConfigs={setParserConfigs}
                formatVariableDisplay={formatVariableDisplay}
                normalizeVariableName={normalizeVariableName}
                markDirty={markDirty}
              />
            </form>
          </Suspense>
        ) : (
          <div className="drawer-empty">
            <p className="muted">Configuration for this block is coming soon.</p>
          </div>
        )}
      </aside>
    </>
  )
}

export default ConfigDrawer
