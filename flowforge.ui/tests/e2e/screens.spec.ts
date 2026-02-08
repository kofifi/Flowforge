import { test, expect, type Page } from '@playwright/test'
import { Buffer } from 'node:buffer'

type Workflow = { id: number; name: string }

type Execution = {
  id: number
  executedAt: string
  workflowId: number
  workflowName?: string
  inputData?: Record<string, string> | null
  resultData?: Record<string, string> | null
  path?: string[]
  actions?: string[]
}

type Schedule = {
  id: number
  workflowId: number
  name: string
  triggerType: string
  startAtUtc: string
  isActive: boolean
  intervalMinutes?: number | null
  description?: string | null
}

async function mockApi(page: Page) {
  const workflows: Workflow[] = [
    { id: 1, name: 'Demo Flow' },
    { id: 2, name: 'Data Sync' },
    { id: 11, name: 'If Config' },
    { id: 12, name: 'Switch Config' },
    { id: 13, name: 'Loop Config' },
    { id: 14, name: 'Wait Config' },
    { id: 15, name: 'Calculation Config' },
    { id: 16, name: 'TextTransform Config' },
    { id: 17, name: 'TextReplace Config' },
    { id: 18, name: 'HttpRequest Config' },
    { id: 19, name: 'Parser Config' },
  ]
  const systemBlocks = [
    { id: 1, type: 'Start', description: 'Start' },
    { id: 2, type: 'End', description: 'End' },
    { id: 3, type: 'Calculation', description: 'Calculation' },
    { id: 4, type: 'HttpRequest', description: 'HTTP request' },
    { id: 5, type: 'Parser', description: 'Parser JSON/XML' },
    { id: 6, type: 'If', description: 'If block' },
    { id: 7, type: 'Switch', description: 'Switch' },
    { id: 8, type: 'Loop', description: 'Loop' },
    { id: 9, type: 'Wait', description: 'Wait' },
    { id: 10, type: 'TextTransform', description: 'Text transform' },
    { id: 11, type: 'TextReplace', description: 'Text replace' },
  ]
  const executions: Execution[] = [
    { id: 36, executedAt: '2026-02-05T18:09:48Z', workflowId: 2, workflowName: 'TextTransform' },
    { id: 1002, executedAt: '2025-12-13T14:15:00Z', workflowId: 2, workflowName: 'Data Sync' },
  ]
  const schedules: Schedule[] = [
    { id: 501, workflowId: 1, name: 'Daily sync', triggerType: 'Daily', startAtUtc: '2025-12-15T06:00:00Z', intervalMinutes: null, isActive: true, description: 'Run every morning' },
  ]
  const variables: { id: number; name: string; defaultValue: string | null; workflowId: number }[] = []
  const midBlockByWorkflow: Record<number, string> = {
    1: 'Calculation',
    11: 'If',
    12: 'Switch',
    13: 'Loop',
    14: 'Wait',
    15: 'Calculation',
    16: 'TextTransform',
    17: 'TextReplace',
    18: 'HttpRequest',
    19: 'Parser',
  }
  const revisionsByWorkflow: Record<number, any[]> = {
    1: [
      { id: 205, label: 'v5', version: 'v5', createdAt: '2026-01-04T10:00:00Z', isActive: true },
      { id: 204, label: 'v4', version: 'v4', createdAt: '2026-01-01T08:30:00Z', isActive: false },
      { id: 203, label: 'v3', version: 'v3', createdAt: '2025-12-20T11:00:00Z', isActive: false },
      { id: 201, label: 'v2', version: 'v2', createdAt: '2025-12-10T10:00:00Z', isActive: false },
      { id: 200, label: 'v1', version: 'v1', createdAt: '2025-12-01T08:00:00Z', isActive: false },
    ],
    2: [
      { id: 302, label: 'v2', version: 'v2', createdAt: '2025-12-18T12:00:00Z', isActive: true },
      { id: 202, label: 'v1', version: 'v1', createdAt: '2025-12-05T09:00:00Z', isActive: false },
    ],
  }

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    const method = route.request().method()

    if (path === '/api/Workflow' && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(workflows) })
    }

    if (path === '/api/Workflow' && method === 'POST') {
      const payload = await route.request().postDataJSON()
      const nextId = Math.max(...workflows.map((w) => w.id)) + 1
      const created: Workflow = { id: nextId, name: payload?.name ?? `Workflow ${nextId}` }
      workflows.unshift(created)
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(created) })
    }

    if (path === '/api/SystemBlock' && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(systemBlocks) })
    }

    if (path === '/api/WorkflowExecution' && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(executions) })
    }

    if (path === '/api/WorkflowSchedule' && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(schedules) })
    }

    if (path === '/api/WorkflowVariable' && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(variables) })
    }

    if (path === '/api/WorkflowSchedule' && method === 'POST') {
      const payload = await route.request().postDataJSON()
      const nextId = Math.max(...schedules.map((s) => s.id)) + 1
      const created: Schedule = {
        id: nextId,
        workflowId: payload?.workflowId ?? 1,
        name: payload?.name ?? 'New schedule',
        triggerType: payload?.triggerType ?? 'Interval',
        startAtUtc: payload?.startAtUtc ?? new Date().toISOString(),
        intervalMinutes: payload?.intervalMinutes ?? 60,
        isActive: payload?.isActive ?? true,
        description: payload?.description ?? null,
      }
      schedules.unshift(created)
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(created) })
    }

    const schedMatch = path.match(/^\/api\/WorkflowSchedule\/(\d+)$/)
    if (schedMatch && method === 'PUT') {
      const id = Number(schedMatch[1])
      const payload = await route.request().postDataJSON()
      const idx = schedules.findIndex((s) => s.id === id)
      if (idx >= 0) {
        schedules[idx] = { ...schedules[idx], ...payload, id }
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(schedules[idx]) })
    }

    if (path === '/api/WorkflowVariable' && method === 'POST') {
      const payload = await route.request().postDataJSON()
      const nextId = variables.length === 0 ? 1 : Math.max(...variables.map((v) => v.id)) + 1
      const created = {
        id: nextId,
        name: payload?.name ?? 'newVar',
        defaultValue: payload?.defaultValue ?? null,
        workflowId: payload?.workflowId ?? 1,
      }
      variables.unshift(created)
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(created) })
    }

    const variableMatch = path.match(/^\/api\/WorkflowVariable\/(\d+)$/)
    if (variableMatch && method === 'PUT') {
      const id = Number(variableMatch[1])
      const payload = await route.request().postDataJSON()
      const idx = variables.findIndex((v) => v.id === id)
      if (idx >= 0) {
        variables[idx] = { ...variables[idx], ...payload, id }
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(variables[idx]) })
    }

    if (variableMatch && method === 'DELETE') {
      const id = Number(variableMatch[1])
      const idx = variables.findIndex((v) => v.id === id)
      if (idx >= 0) {
        variables.splice(idx, 1)
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    }

    const execDetailMatch = path.match(/^\/api\/WorkflowExecution\/(\d+)$/)
    if (execDetailMatch && method === 'GET') {
      const id = Number(execDetailMatch[1])
      const detail = {
        id,
        executedAt: '2026-02-05T18:09:48Z',
        workflowId: 2,
        workflowName: 'TextTransform',
        inputData: { '$id': '2', result: '' },
        resultData: { '$id': '3', result: 'test test testt' },
        path: ['Start', 'Text Transform', 'End'],
        actions: ['Start block', 'TextTransform Lower -> result', 'End block'],
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(detail) })
    }

    if (path === '/api/Workflow/import' && method === 'POST') {
      const payload = await route.request().postDataJSON()
      const nextId = Math.max(...workflows.map((w) => w.id)) + 1
      const created: Workflow = { id: nextId, name: payload?.name ?? 'Imported Flow' }
      workflows.unshift(created)
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(created) })
    }

    const workflowMatch = path.match(/^\/api\/Workflow\/(\d+)$/)
    if (workflowMatch && method === 'PUT') {
      const id = Number(workflowMatch[1])
      const payload = await route.request().postDataJSON()
      const idx = workflows.findIndex((w) => w.id === id)
      if (idx >= 0) {
        workflows[idx] = { ...workflows[idx], ...payload }
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(workflows[idx]) })
    }
    if (workflowMatch && method === 'DELETE') {
      const id = Number(workflowMatch[1])
      const idx = workflows.findIndex((w) => w.id === id)
      if (idx >= 0) workflows.splice(idx, 1)
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ deleted: id }) })
    }
    if (path.match(/^\/api\/Workflow\/\d+\/export$/) && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, exported: true }) })
    }

    const workflowGraphMatch = path.match(/^\/api\/Workflow\/(\d+)\/graph$/)
    if (workflowGraphMatch && method === 'GET') {
      const wfId = Number(workflowGraphMatch[1])
      const midType = midBlockByWorkflow[wfId] ?? 'Calculation'
      const midLabelMap: Record<string, string> = {
        HttpRequest: 'HTTP request',
        TextTransform: 'Text Transform',
        TextReplace: 'Text Replace',
      }
      const midName = midLabelMap[midType] ?? midType
      const configMap: Record<string, unknown> = {
        If: { DataType: 'String', First: '', Second: '' },
        Switch: { Expression: '', Cases: ['case-1', 'case-2'] },
        Switch: { Expression: '', Cases: ['', ''] },
        Loop: { Iterations: 3 },
        Wait: { DelayMs: 2000, DelayVariable: '' },
        Calculation: { Operation: 'Add', FirstVariable: '', SecondVariable: '', ResultVariable: '' },
        TextTransform: { Input: 'Sample text', InputVariable: '', Operation: 'Trim', ResultVariable: '' },
        TextReplace: {
          Input: 'foo bar',
          InputVariable: '',
          ResultVariable: '',
          Replacements: [{ From: 'foo', To: 'bar', UseRegex: false, IgnoreCase: true }],
        },
        HttpRequest: {
          Method: 'GET',
          Url: 'https://api.example.com/data',
          Body: '',
          Headers: [{ name: 'Accept', value: 'application/json' }],
          AuthType: 'none',
          ResponseVariable: '',
        },
        Parser: {
          Format: 'json',
          SourceVariable: '',
          Mappings: [{ path: '$.value', variable: '' }],
        },
      }
      const graph = {
        workflowId: wfId,
        name: workflows.find((w) => w.id === wfId)?.name ?? `Workflow ${wfId}`,
        blocks: [
          { id: 10, name: 'Start', systemBlockId: 1, systemBlockType: 'Start', positionX: 200, positionY: 200 },
          {
            id: 20,
            name: midName,
            systemBlockId: systemBlocks.find((s) => s.type === midType)?.id ?? 3,
            systemBlockType: midType,
            positionX: 500,
            positionY: 200,
            jsonConfig: JSON.stringify(configMap[midType] ?? {}),
          },
          { id: 30, name: 'End', systemBlockId: 2, systemBlockType: 'End', positionX: 800, positionY: 200 },
        ],
        connections: [
          { id: 1, sourceBlockId: 10, targetBlockId: 20, connectionType: 'Success', Label: null },
          { id: 2, sourceBlockId: 20, targetBlockId: 30, connectionType: 'Success', Label: null },
        ],
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(graph) })
    }

    const revMatch = path.match(/^\/api\/WorkflowRevision\/(\d+)$/)
    if (revMatch && method === 'GET') {
      const id = Number(revMatch[1])
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ $values: revisionsByWorkflow[id] ?? [] }),
      })
    }
    if (path.match(/^\/api\/WorkflowRevision\/\d+\/restore$/) && method === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
    }
    const revWorkflowMatch = path.match(/^\/api\/WorkflowRevision\/workflow\/(\d+)$/)
    if (revWorkflowMatch && method === 'GET') {
      const id = Number(revWorkflowMatch[1])
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ $values: revisionsByWorkflow[id] ?? [] }),
      })
    }

    // generic fallbacks
    if (path.includes('/api/Workflow/') && method === 'GET') {
      const id = Number(path.split('/').pop())
      const wf = workflows.find((w) => w.id === id) ?? { id, name: `Workflow ${id}` }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(wf) })
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
  })
}

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('Workflows page screenshot - light', async ({ page }) => {
  await page.route('**/api/Workflow', async (route) => {
    const trimmed = [
      { id: 1, name: 'Demo Flow' },
      { id: 2, name: 'Data Sync' },
    ]
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(trimmed) })
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /Workflow projects/i })).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/artifacts/light/workflows.png', fullPage: true })
})

test('Blocks page screenshot - light', async ({ page }) => {
  await page.goto('/blocks')
  await expect(page.getByRole('heading', { level: 1, name: /System blocks/i })).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/artifacts/light/blocks.png', fullPage: true })
})

test('Executions page screenshot - light', async ({ page }) => {
  await page.goto('/executions')
  await expect(page.getByRole('heading', { level: 1, name: /Executions/i })).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/artifacts/light/executions.png', fullPage: true })
})

test('Scheduler page screenshot - light', async ({ page }) => {
  await page.goto('/scheduler')
  await expect(page.getByRole('heading', { level: 1, name: /Scheduler/i })).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/artifacts/light/scheduler.png', fullPage: true })
})

test('Workflows page screenshot - dark', async ({ page }) => {
  await page.route('**/api/Workflow', async (route) => {
    const trimmed = [
      { id: 1, name: 'Demo Flow' },
      { id: 2, name: 'Data Sync' },
    ]
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(trimmed) })
  })
  await page.goto('/')
  await page.getByRole('button', { name: /Switch to dark mode/i }).click()
  await expect(page.getByRole('heading', { level: 1, name: /Workflow projects/i })).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/artifacts/dark/workflows-dark.png', fullPage: true })
})

test('Blocks page screenshot - dark', async ({ page }) => {
  await page.goto('/blocks')
  await page.getByRole('button', { name: /Switch to dark mode/i }).click()
  await expect(page.getByRole('heading', { level: 1, name: /System blocks/i })).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/artifacts/dark/blocks-dark.png', fullPage: true })
})

test('Executions page screenshot - dark', async ({ page }) => {
  await page.goto('/executions')
  await page.getByRole('button', { name: /Switch to dark mode/i }).click()
  await expect(page.getByRole('heading', { level: 1, name: /Executions/i })).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/artifacts/dark/executions-dark.png', fullPage: true })
})

test('Scheduler page screenshot - dark', async ({ page }) => {
  await page.goto('/scheduler')
  await page.getByRole('button', { name: /Switch to dark mode/i }).click()
  await expect(page.getByRole('heading', { level: 1, name: /Scheduler/i })).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/artifacts/dark/scheduler-dark.png', fullPage: true })
})

test('Scheduler interactions (create & edit) - dark', async ({ page }) => {
  await page.goto('/scheduler')
  await page.getByRole('button', { name: /Switch to dark mode/i }).click()
  await expect(page.getByRole('heading', { level: 1, name: /Scheduler/i })).toBeVisible()

  await page.getByLabel('Nazwa').fill('Nightly build')
  await page.getByLabel('Workflow').selectOption({ label: 'Demo Flow' })
  await page.getByLabel('Typ').selectOption('Interval')
  await page.getByLabel('Interwał (min)').fill('45')
  await page.getByLabel('Start (UTC)').fill('2026-02-08T01:00')
  await page.getByLabel('Opis').fill('Co 45 minut w nocy')
  await page.getByRole('button', { name: 'Dodaj' }).click()
  await page.getByText('Nightly build').first().waitFor()
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: 'tests/e2e/artifacts/dark/scheduler-actions-01-create.png', fullPage: true })

  await page.getByRole('button', { name: 'Edytuj' }).first().click()
  await page.waitForTimeout(150)
  await page.getByLabel('Nazwa').first().fill('Daily sync updated')
  await page.getByLabel('Interwał (min)').first().fill('120')
  await page.getByLabel('Aktywny').first().check()
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: 'tests/e2e/artifacts/dark/scheduler-actions-02-edit.png', fullPage: true })
  await page.getByRole('button', { name: 'Zapisz' }).first().click()
})

test('Workflow editor initial (light)', async ({ page }) => {
  await page.goto('/workflows/1')
  await expect(page.getByRole('heading', { level: 1, name: /Demo Flow/i })).toBeVisible()
  await page.waitForSelector('.react-flow__renderer', { state: 'visible' })
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'tests/e2e/artifacts/light/workflow-editor.png', fullPage: true })
})

test('Workflow editor add block palette (light)', async ({ page }) => {
  await page.goto('/workflows/1')
  await page.waitForSelector('.react-flow__renderer', { state: 'visible' })
  await page.getByRole('button', { name: 'Add block' }).click()
  const drawer = page.locator('.blocks-drawer')
  await expect(drawer).toBeVisible()
  await expect(drawer.locator('.palette-title', { hasText: 'Add block' })).toBeVisible()
  await expect(drawer.locator('.palette-section .section-title').first()).toHaveText(/Flow/i)
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'tests/e2e/artifacts/light/workflow-editor-add-blocks.png', fullPage: true })
})

test('Workflow editor initial (dark)', async ({ page }) => {
  await page.goto('/workflows/1')
  await page.getByRole('button', { name: /Switch to dark mode/i }).click()
  await expect(page.getByRole('heading', { level: 1, name: /Demo Flow/i })).toBeVisible()
  await page.waitForSelector('.react-flow__renderer', { state: 'visible' })
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'tests/e2e/artifacts/dark/workflow-editor.png', fullPage: true })
})

test('Workflow editor add block palette (dark)', async ({ page }) => {
  await page.goto('/workflows/1')
  await page.getByRole('button', { name: /Switch to dark mode/i }).click()
  await page.waitForSelector('.react-flow__renderer', { state: 'visible' })
  await page.getByRole('button', { name: 'Add block' }).click()
  const drawer = page.locator('.blocks-drawer')
  await expect(drawer).toBeVisible()
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'tests/e2e/artifacts/dark/workflow-editor-add-blocks.png', fullPage: true })
})

async function captureConfig(page: Page, workflowId: number, fileName: string, expectedTitle: RegExp | string) {
  await page.goto(`/workflows/${workflowId}`)
  await page.waitForSelector('.react-flow__renderer', { state: 'visible' })
  await page.locator('[data-id="block-20"] .node-gear').click()
  const drawer = page.locator('.config-drawer')
  await expect(drawer).toBeVisible()
  await page.waitForTimeout(250) // allow slide-in animation to finish
  await expect(drawer.locator('.drawer-title')).toHaveText(expectedTitle)
  await page.waitForTimeout(400)
  await page.screenshot({ path: `tests/e2e/artifacts/light/${fileName}`, fullPage: true })
}

async function captureConfigDark(page: Page, workflowId: number, fileName: string, expectedTitle: RegExp | string) {
  await page.goto(`/workflows/${workflowId}`)
  await page.getByRole('button', { name: /Switch to dark mode/i }).click()
  await page.waitForSelector('.react-flow__renderer', { state: 'visible' })
  await page.locator('[data-id="block-20"] .node-gear').click()
  const drawer = page.locator('.config-drawer')
  await expect(drawer).toBeVisible()
  await page.waitForTimeout(250)
  await expect(drawer.locator('.drawer-title')).toHaveText(expectedTitle)
  await page.waitForTimeout(400)
  await page.screenshot({ path: `tests/e2e/artifacts/dark/${fileName}`, fullPage: true })
}

test('Workflow config If block', async ({ page }) => {
  await captureConfig(page, 11, 'workflow-editor-config-if.png', /If settings/i)
})

test('Workflow config Switch block', async ({ page }) => {
  await captureConfig(page, 12, 'workflow-editor-config-switch.png', /Switch settings/i)
})

test('Workflow config Loop block', async ({ page }) => {
  await captureConfig(page, 13, 'workflow-editor-config-loop.png', /Loop settings/i)
})

test('Workflow config Wait block', async ({ page }) => {
  await captureConfig(page, 14, 'workflow-editor-config-wait.png', /Wait settings/i)
})

test('Workflow config Calculation block', async ({ page }) => {
  await captureConfig(page, 15, 'workflow-editor-config-calculation.png', /Calculation settings/i)
})

test('Workflow config TextTransform block', async ({ page }) => {
  await captureConfig(page, 16, 'workflow-editor-config-texttransform.png', /Text Transform settings/i)
})

test('Workflow config TextReplace block', async ({ page }) => {
  await captureConfig(page, 17, 'workflow-editor-config-textreplace.png', /Text Replace settings/i)
})

test('Workflow config HttpRequest block', async ({ page }) => {
  await captureConfig(page, 18, 'workflow-editor-config-httprequest.png', /HTTP request settings/i)
})

test('Workflow config Parser block', async ({ page }) => {
  await captureConfig(page, 19, 'workflow-editor-config-parser.png', /Parser settings/i)
})

test('Workflow config If block (dark)', async ({ page }) => {
  await captureConfigDark(page, 11, 'workflow-editor-config-if.png', /If settings/i)
})

test('Workflow config Switch block (dark)', async ({ page }) => {
  await captureConfigDark(page, 12, 'workflow-editor-config-switch.png', /Switch settings/i)
})

test('Workflow config Loop block (dark)', async ({ page }) => {
  await captureConfigDark(page, 13, 'workflow-editor-config-loop.png', /Loop settings/i)
})

test('Workflow config Wait block (dark)', async ({ page }) => {
  await captureConfigDark(page, 14, 'workflow-editor-config-wait.png', /Wait settings/i)
})

test('Workflow config Calculation block (dark)', async ({ page }) => {
  await captureConfigDark(page, 15, 'workflow-editor-config-calculation.png', /Calculation settings/i)
})

test('Workflow config TextTransform block (dark)', async ({ page }) => {
  await captureConfigDark(page, 16, 'workflow-editor-config-texttransform.png', /Text Transform settings/i)
})

test('Workflow config TextReplace block (dark)', async ({ page }) => {
  await captureConfigDark(page, 17, 'workflow-editor-config-textreplace.png', /Text Replace settings/i)
})

test('Workflow config HttpRequest block (dark)', async ({ page }) => {
  await captureConfigDark(page, 18, 'workflow-editor-config-httprequest.png', /HTTP request settings/i)
})

test('Workflow config Parser block (dark)', async ({ page }) => {
  await captureConfigDark(page, 19, 'workflow-editor-config-parser.png', /Parser settings/i)
})

test('Workflow editor variables create/edit (light)', async ({ page }) => {
  await page.goto('/workflows/1')
  await page.waitForSelector('.react-flow__renderer', { state: 'visible' })
  await page.getByRole('button', { name: 'Variables' }).click()
  const drawer = page.locator('.variables-drawer')
  await expect(drawer).toBeVisible()
  await page.waitForTimeout(250) // wait for slide animation

  const addForm = drawer.locator('.variables-form')
  await addForm.getByLabel('Name').fill('total')
  await addForm.getByLabel('Default value').fill('0')
  await addForm.getByRole('button', { name: 'Add variable' }).click()
  await drawer.locator('.variable-card').filter({ hasText: 'total' }).first().waitFor()

  await page.waitForTimeout(200)
  await page.screenshot({ path: 'tests/e2e/artifacts/light/workflow-editor-variables.png', fullPage: true })
})

test('Workflow editor variables edit form (light)', async ({ page }) => {
  await page.goto('/workflows/1')
  await page.waitForSelector('.react-flow__renderer', { state: 'visible' })
  await page.getByRole('button', { name: 'Variables' }).click()
  const drawer = page.locator('.variables-drawer')
  await expect(drawer).toBeVisible()
  await page.waitForTimeout(250)

  const addForm = drawer.locator('.variables-form')
  await addForm.getByLabel('Name').fill('tempVar')
  await addForm.getByLabel('Default value').fill('123')
  await addForm.getByRole('button', { name: 'Add variable' }).click()
  await drawer.locator('.variable-card').filter({ hasText: 'tempVar' }).first().waitFor()
  await drawer.locator('.variable-card').filter({ hasText: 'tempVar' }).getByRole('button', { name: 'Edit' }).click()

  await page.waitForTimeout(200)
  await page.screenshot({ path: 'tests/e2e/artifacts/light/workflow-editor-variables-edit.png', fullPage: true })
  await drawer.locator('.variable-edit').getByRole('button', { name: 'Save' }).click()
})

test('Execution details (light)', async ({ page }) => {
  await page.goto('/executions')
  await page.getByRole('button', { name: /View details/i }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: /Execution/ })).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/artifacts/light/execution-details.png', fullPage: true })
})

test('Execution details (dark)', async ({ page }) => {
  await page.goto('/executions')
  await page.getByRole('button', { name: /Switch to dark mode/i }).click()
  await page.getByRole('button', { name: /View details/i }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: /Execution/ })).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/artifacts/dark/execution-details.png', fullPage: true })
})

test('Run drawer – inputs expanded (light)', async ({ page }) => {
  await mockApi(page)
  await page.goto('/workflows/1')
  await page.getByRole('button', { name: /Run/i }).click()
  await page.getByRole('button', { name: /Expand inputs/i }).click()
  await page.getByRole('button', { name: /Expand snippet/i }).click()
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'tests/e2e/artifacts/light/run-drawer-open.png', fullPage: true })
})

test('Run drawer – after run (light)', async ({ page }) => {
  await mockApi(page)
  await page.route('**/api/Workflow/1/run**', async (route) => {
    const body = {
      id: 900,
      executedAt: new Date().toISOString(),
      workflowId: 1,
      workflowName: 'Demo Flow',
      resultData: { result: 'ok', $id: '900' },
      inputData: { a: '1' },
      path: ['Start', 'End'],
      actions: ['Start block', 'End block'],
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
  await page.goto('/workflows/1')
  await page.getByRole('button', { name: /Run/i }).click()
  await page.getByRole('button', { name: /Run workflow/i }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'tests/e2e/artifacts/light/run-drawer-result.png', fullPage: true })
})

test('Run drawer – inputs expanded (dark)', async ({ page }) => {
  await mockApi(page)
  await page.goto('/workflows/1')
  await page.getByRole('button', { name: /Switch to dark mode/i }).click()
  await page.getByRole('button', { name: /Run/i }).click()
  await page.getByRole('button', { name: /Expand inputs/i }).click()
  await page.getByRole('button', { name: /Expand snippet/i }).click()
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'tests/e2e/artifacts/dark/run-drawer-open.png', fullPage: true })
})

test('Run drawer – after run (dark)', async ({ page }) => {
  await mockApi(page)
  await page.route('**/api/Workflow/1/run**', async (route) => {
    const body = {
      id: 900,
      executedAt: new Date().toISOString(),
      workflowId: 1,
      workflowName: 'Demo Flow',
      resultData: { result: 'ok', $id: '900' },
      inputData: { a: '1' },
      path: ['Start', 'End'],
      actions: ['Start block', 'End block'],
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
  await page.goto('/workflows/1')
  await page.getByRole('button', { name: /Switch to dark mode/i }).click()
  await page.getByRole('button', { name: /Run/i }).click()
  await page.getByRole('button', { name: /Run workflow/i }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'tests/e2e/artifacts/dark/run-drawer-result.png', fullPage: true })
})

test('Workflow editor variables create/edit (dark)', async ({ page }) => {
  await page.goto('/workflows/1')
  await page.getByRole('button', { name: /Switch to dark mode/i }).click()
  await page.waitForSelector('.react-flow__renderer', { state: 'visible' })
  await page.getByRole('button', { name: 'Variables' }).click()
  const drawer = page.locator('.variables-drawer')
  await expect(drawer).toBeVisible()
  await page.waitForTimeout(250) // wait for slide animation

  const addForm = drawer.locator('.variables-form')
  await addForm.getByLabel('Name').fill('limit')
  await addForm.getByLabel('Default value').fill('25')
  await addForm.getByRole('button', { name: 'Add variable' }).click()
  await drawer.locator('.variable-card').filter({ hasText: 'limit' }).first().waitFor()

  await page.waitForTimeout(200)
  await page.screenshot({ path: 'tests/e2e/artifacts/dark/workflow-editor-variables.png', fullPage: true })
})

test('Workflow editor variables edit form (dark)', async ({ page }) => {
  await page.goto('/workflows/1')
  await page.getByRole('button', { name: /Switch to dark mode/i }).click()
  await page.waitForSelector('.react-flow__renderer', { state: 'visible' })
  await page.getByRole('button', { name: 'Variables' }).click()
  const drawer = page.locator('.variables-drawer')
  await expect(drawer).toBeVisible()
  await page.waitForTimeout(250)

  const addForm = drawer.locator('.variables-form')
  await addForm.getByLabel('Name').fill('tempVarDark')
  await addForm.getByLabel('Default value').fill('456')
  await addForm.getByRole('button', { name: 'Add variable' }).click()
  await drawer.locator('.variable-card').filter({ hasText: 'tempVarDark' }).first().waitFor()
  await drawer.locator('.variable-card').filter({ hasText: 'tempVarDark' }).getByRole('button', { name: 'Edit' }).click()

  await page.waitForTimeout(200)
  await page.screenshot({ path: 'tests/e2e/artifacts/dark/workflow-editor-variables-edit.png', fullPage: true })
  await drawer.locator('.variable-edit').getByRole('button', { name: 'Save' }).click()
})

test('Workflows interactions (same view)', async ({ page }) => {
  await page.route('**/api/Workflow', async (route) => {
    const trimmed = [
      { id: 1, name: 'Demo Flow' },
      { id: 2, name: 'Data Sync' },
    ]
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(trimmed) })
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /Workflow projects/i })).toBeVisible()

  await page.getByRole('button', { name: 'More' }).first().click()
  await page.screenshot({ path: 'tests/e2e/artifacts/light/workflows-actions-01b-more-open.png', fullPage: true })
  await page.getByRole('button', { name: 'Versions' }).click()
  await expect(page.getByText(/Versions \(workflow #1\)/)).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/artifacts/light/workflows-actions-02-versions.png', fullPage: true })
  await page.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: 'More' }).first().click()
  await page.getByRole('button', { name: 'Rename' }).click()
  const firstItem = page.locator('li').first()
  const renameInput = firstItem.locator('form.edit-form input').first()
  await page.screenshot({ path: 'tests/e2e/artifacts/light/workflows-actions-03-rename-form.png', fullPage: true })
  await renameInput.fill('Demo Flow Updated')
  await firstItem.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Demo Flow Updated')).toBeVisible()
})

test('Workflows import/export', async ({ page }) => {
  await page.route('**/api/Workflow', async (route) => {
    const trimmed = [
      { id: 1, name: 'Demo Flow' },
      { id: 2, name: 'Data Sync' },
    ]
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(trimmed) })
  })
  await page.route('**/api/Workflow/import', async (route) => {
    const created = { id: 3, name: 'Imported Flow' }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(created) })
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /Workflow projects/i })).toBeVisible()

  // Import JSON
  const fileInput = page.locator('input[type="file"]')
  const mockJson = Buffer.from(JSON.stringify({ name: 'Imported Flow', blocks: [], connections: [], variables: [] }))
  await fileInput.setInputFiles({ name: 'imported.json', mimeType: 'application/json', buffer: mockJson })
  await expect(page.getByText(/Imported as "Imported Flow"/)).toBeVisible()
  await expect(page.getByText('ID: 3')).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/artifacts/light/workflows-actions-04-import.png', fullPage: true })

  // Export pomijamy w zrzutach (niewymagane)
})

test('Workflows interactions - dark', async ({ page }) => {
  await page.route('**/api/Workflow', async (route) => {
    const trimmed = [
      { id: 1, name: 'Demo Flow' },
      { id: 2, name: 'Data Sync' },
    ]
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(trimmed) })
  })
  await page.goto('/')
  await page.getByRole('button', { name: /Switch to dark mode/i }).click()
  await expect(page.getByRole('heading', { level: 1, name: /Workflow projects/i })).toBeVisible()

  await page.getByRole('button', { name: 'More' }).first().click()
  await page.screenshot({ path: 'tests/e2e/artifacts/dark/workflows-actions-01b-more-open.png', fullPage: true })
  await page.getByRole('button', { name: 'Versions' }).click()
  await expect(page.getByText(/Versions \(workflow #1\)/)).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/artifacts/dark/workflows-actions-02-versions.png', fullPage: true })
  await page.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: 'More' }).first().click()
  await page.getByRole('button', { name: 'Rename' }).click()
  const firstItem = page.locator('li').first()
  const renameInput = firstItem.locator('form.edit-form input').first()
  await page.screenshot({ path: 'tests/e2e/artifacts/dark/workflows-actions-03-rename-form.png', fullPage: true })
  await renameInput.fill('Demo Flow Updated')
  await firstItem.getByRole('button', { name: 'Save' }).click()

  const fileInput = page.locator('input[type="file"]')
  const mockJson = Buffer.from(JSON.stringify({ name: 'Imported Flow Dark', blocks: [], connections: [], variables: [] }))
  await fileInput.setInputFiles({ name: 'imported.json', mimeType: 'application/json', buffer: mockJson })
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'tests/e2e/artifacts/dark/workflows-actions-04-import.png', fullPage: true })
})

test('Scheduler interactions (create & edit)', async ({ page }) => {
  await page.goto('/scheduler')
  await expect(page.getByRole('heading', { level: 1, name: /Scheduler/i })).toBeVisible()

  // Create new schedule
  await page.getByLabel('Nazwa').fill('Nightly build')
  await page.getByLabel('Workflow').selectOption({ label: 'Demo Flow' })
  await page.getByLabel('Typ').selectOption('Interval')
  await page.getByLabel('Interwał (min)').fill('45')
  await page.getByLabel('Start (UTC)').fill('2026-02-08T01:00')
  await page.getByLabel('Opis').fill('Co 45 minut w nocy')
  await page.getByRole('button', { name: 'Dodaj' }).click()
  await page.getByText('Nightly build').first().waitFor()
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: 'tests/e2e/artifacts/light/scheduler-actions-01-create.png', fullPage: true })

  // Edit first schedule
  await page.getByRole('button', { name: 'Edytuj' }).first().click()
  await page.waitForTimeout(150)
  await page.getByLabel('Nazwa').first().fill('Daily sync updated')
  await page.getByLabel('Interwał (min)').first().fill('120')
  await page.getByLabel('Aktywny').first().check()
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: 'tests/e2e/artifacts/light/scheduler-actions-02-edit.png', fullPage: true })
  await page.getByRole('button', { name: 'Zapisz' }).first().click()
})
