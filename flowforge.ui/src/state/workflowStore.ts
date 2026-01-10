import create from 'zustand'
import { requestJson, withJson } from '../api/http'
import type { WorkflowDto, WorkflowVariableDto } from '../api/types'
import { normalizeValues } from '../utils/dataTransforms'

type StoreState = {
  workflow: WorkflowDto | null
  workflowLoading: boolean
  workflowError: string | null
  variables: WorkflowVariableDto[]
  variablesLoading: boolean
  variablesError: string | null
  loadWorkflow: (id: number) => Promise<void>
  loadVariables: (workflowId: number) => Promise<void>
  createVariable: (payload: { name: string; defaultValue: string | null; workflowId: number }) => Promise<void>
  updateVariable: (payload: { id: number; name: string; defaultValue: string | null; workflowId: number }) => Promise<void>
  deleteVariable: (id: number, workflowId: number) => Promise<void>
  clearVariablesError: () => void
}

function toNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function mapVariable(raw: unknown): WorkflowVariableDto {
  if (!raw || typeof raw !== 'object') {
    return { id: 0, name: '', defaultValue: null, workflowId: 0 }
  }

  const obj = raw as Record<string, unknown>
  const nestedWorkflow = (obj.workflow ?? obj.Workflow) as { id?: number; Id?: number } | undefined
  const workflowId = toNumber(
    obj.workflowId ?? obj.WorkflowId ?? nestedWorkflow?.id ?? nestedWorkflow?.Id,
  )

  return {
    id: toNumber(obj.id ?? obj.Id),
    name: (obj.name ?? obj.Name ?? '') as string,
    defaultValue: (obj.defaultValue ?? obj.DefaultValue ?? null) as string | null,
    workflowId,
    workflow: nestedWorkflow
      ? { id: toNumber(nestedWorkflow.id ?? nestedWorkflow.Id), name: '' }
      : undefined,
  }
}

function collectVariablePayloads(data: unknown): unknown[] {
  const top = normalizeValues<unknown>(data)
  const nested = top.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const wf = (item as Record<string, unknown>).workflow ?? (item as Record<string, unknown>).Workflow
    if (!wf || typeof wf !== 'object') return []
    const variables =
      (wf as Record<string, unknown>).workflowVariables ??
      (wf as Record<string, unknown>).WorkflowVariables
    return normalizeValues<unknown>(variables)
  })
  return [...top, ...nested]
}

function dedupeVariables(all: WorkflowVariableDto[]) {
  return Array.from(
    all.reduce((acc, variable) => {
      const key = `${variable.workflowId}-${variable.id}-${variable.name}`
      if (!acc.has(key)) acc.set(key, variable)
      return acc
    }, new Map<string, WorkflowVariableDto>()),
    ([, variable]) => variable,
  )
}

export const useWorkflowStore = create<StoreState>((set, get) => ({
  workflow: null,
  workflowLoading: false,
  workflowError: null,
  variables: [],
  variablesLoading: false,
  variablesError: null,

  clearVariablesError: () => set({ variablesError: null }),

  loadWorkflow: async (id: number) => {
    set({ workflowLoading: true, workflowError: null })
    try {
      const workflow = await requestJson<WorkflowDto>(`/api/Workflow/${id}`)
      set({ workflow })
    } catch (err) {
      set({
        workflowError: err instanceof Error ? err.message : 'Unable to load workflow',
        workflow: null,
      })
    } finally {
      set({ workflowLoading: false })
    }
  },

  loadVariables: async (workflowId: number) => {
    set({ variablesLoading: true, variablesError: null })
    try {
      const data = await requestJson<unknown>('/api/WorkflowVariable')
      const payloads = collectVariablePayloads(data)
      const mapped = payloads
        .map(mapVariable)
        .filter((variable) => variable.id !== 0 && variable.workflowId === workflowId)
      set({ variables: dedupeVariables(mapped) })
    } catch (err) {
      set({
        variablesError: err instanceof Error ? err.message : 'Unable to load variables',
      })
    } finally {
      set({ variablesLoading: false })
    }
  },

  createVariable: async ({ name, defaultValue, workflowId }) => {
    try {
      await requestJson<WorkflowVariableDto>(
        '/api/WorkflowVariable',
        withJson({ name, defaultValue, workflowId }, { method: 'POST' }),
      )
      await get().loadVariables(workflowId)
    } catch (err) {
      set({
        variablesError: err instanceof Error ? err.message : 'Unable to create variable',
      })
      throw err
    }
  },

  updateVariable: async ({ id, name, defaultValue, workflowId }) => {
    try {
      await requestJson<void>(
        `/api/WorkflowVariable/${id}`,
        withJson({ id, name, defaultValue, workflowId, workflow: null }, { method: 'PUT' }),
      )
      await get().loadVariables(workflowId)
    } catch (err) {
      set({
        variablesError: err instanceof Error ? err.message : 'Unable to update variable',
      })
      throw err
    }
  },

  deleteVariable: async (id: number, workflowId: number) => {
    try {
      await requestJson<void>(`/api/WorkflowVariable/${id}`, { method: 'DELETE' })
      await get().loadVariables(workflowId)
    } catch (err) {
      set({
        variablesError: err instanceof Error ? err.message : 'Unable to delete variable',
      })
      throw err
    }
  },
}))
