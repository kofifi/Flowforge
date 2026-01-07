import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import WorkflowsPage from './pages/WorkflowsPage'
import WorkflowEditorPage from './pages/WorkflowEditorPage'
import BlocksPage from './pages/BlocksPage'
import ExecutionsPage from './pages/ExecutionsPage'
import ExecutionDetailsPage from './pages/ExecutionDetailsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkflowsPage />} />
        <Route path="/workflows/:id" element={<WorkflowEditorPage />} />
        <Route path="/blocks" element={<BlocksPage />} />
        <Route path="/executions" element={<ExecutionsPage />} />
        <Route path="/executions/:id" element={<ExecutionDetailsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
