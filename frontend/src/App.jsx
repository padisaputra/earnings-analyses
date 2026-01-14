import { useState } from 'react'
import './App.css'
import TickerSearch from './components/TickerSearch'
import ReportList from './components/ReportList'
import Dashboard from './components/Dashboard'

function App() {
  const [currentData, setCurrentData] = useState(null)
  const [selectedReportIndex, setSelectedReportIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleDataFetched = (data) => {
    setCurrentData(data)
    setSelectedReportIndex(0)
    setError(null)
  }

  const handleReportSelect = (index) => {
    setSelectedReportIndex(index)
  }

  return (
    <div className="container">
      <header className="app-header">
        <h1>Earnings Analyser</h1>
        <p className="subtitle">
          Type a US ticker and I’ll fetch recent 10-Q / 10-K filings, key metrics, and MD&A.
        </p>
      </header>

      <main>
        <TickerSearch
          onDataFetched={handleDataFetched}
          setLoading={setLoading}
          setError={setError}
        />

        {error && <div className="error-message">{error}</div>}

        {loading && <div className="loading-message">Fetching data from SEC EDGAR...</div>}

        {currentData && !loading && (
          <div className="content-grid">
            <div className="sidebar">
              <ReportList
                reports={currentData.reports}
                selectedIndex={selectedReportIndex}
                onSelect={handleReportSelect}
              />
            </div>

            <div className="main-content">
              <Dashboard
                cik={currentData.cik}
                ticker={currentData.ticker}
                report={currentData.reports[selectedReportIndex]}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        Data from SEC EDGAR (public filings).
      </footer>
    </div>
  )
}

export default App
