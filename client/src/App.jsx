import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import TopBar from './components/TopBar.jsx'
import StartPage from './pages/StartPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Analyze from './pages/Analyze.jsx'
import Live from './pages/Live.jsx'
import History from './pages/History.jsx'
import Metrics from './pages/Metrics.jsx'
import { HistoryProvider } from './hooks/useHistory.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

export default function App() {
  return (
    <HistoryProvider>
      <ErrorBoundary>
        <Routes>
          {/* Starting / Welcome Page before dashboard section */}
          <Route path="/" element={<StartPage />} />

          {/* Dashboard Command Center with Sidebar and TopBar */}
          <Route
            path="/*"
            element={
              <div className="app">
                <Sidebar />
                <div className="main">
                  <TopBar />
                  <main className="content">
                    <ErrorBoundary>
                      <Routes>
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="analyze" element={<Analyze />} />
                        <Route path="live" element={<Live />} />
                        <Route path="history" element={<History />} />
                        <Route path="metrics" element={<Metrics />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </ErrorBoundary>
                  </main>
                </div>
              </div>
            }
          />
        </Routes>
      </ErrorBoundary>
    </HistoryProvider>
  )
}

