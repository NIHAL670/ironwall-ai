import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import TopBar from './components/TopBar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Analyze from './pages/Analyze.jsx'
import Live from './pages/Live.jsx'
import History from './pages/History.jsx'
import { HistoryProvider } from './hooks/useHistory.jsx'

export default function App() {
  return (
    <HistoryProvider>
      <div className="app">
        <Sidebar />
        <div className="main">
          <TopBar />
          <main className="content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analyze" element={<Analyze />} />
              <Route path="/live" element={<Live />} />
              <Route path="/history" element={<History />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </HistoryProvider>
  )
}
