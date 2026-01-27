import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import './App.css'

const WorkflowsPage = lazy(() => import('./pages/WorkflowsPage'))
const WorkflowEditorPage = lazy(() => import('./pages/WorkflowEditorPage'))
const BlocksPage = lazy(() => import('./pages/BlocksPage'))
const ExecutionsPage = lazy(() => import('./pages/ExecutionsPage'))
const ExecutionDetailsPage = lazy(() => import('./pages/ExecutionDetailsPage'))
const SchedulerPage = lazy(() => import('./pages/SchedulerPage'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="state">Loading...</div>}>
        <Routes>
          <Route path="/" element={<WorkflowsPage />} />
          <Route path="/workflows/:id" element={<WorkflowEditorPage />} />
          <Route path="/blocks" element={<BlocksPage />} />
          <Route path="/executions" element={<ExecutionsPage />} />
          <Route path="/executions/:id" element={<ExecutionDetailsPage />} />
          <Route path="/scheduler" element={<SchedulerPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
