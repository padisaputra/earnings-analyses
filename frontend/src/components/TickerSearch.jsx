import { useState } from 'react'

function TickerSearch({ onDataFetched, setLoading, setError }) {
    const [ticker, setTicker] = useState('GOOGL')

    const handleSearch = async (e) => {
        e.preventDefault()
        if (!ticker.trim()) return

        setLoading(true)
        setError(null)
        onDataFetched(null)

        try {
            const resp = await fetch(`/api/reports?ticker=${encodeURIComponent(ticker.toUpperCase())}`)

            if (!resp.ok) {
                const data = await resp.json().catch(() => ({}))
                throw new Error(data.detail || `Error: ${resp.status}`)
            }

            const data = await resp.json()
            onDataFetched(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', maxWidth: '500px', margin: '0 auto' }}>
            <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="e.g. GOOGL, AAPL, MSFT"
                style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    borderRadius: '999px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    outline: 'none',
                }}
            />
            <button
                type="submit"
                style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '999px',
                    border: 'none',
                    background: 'var(--accent-color)',
                    color: '#0f172a',
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'filter 0.2s',
                }}
            >
                Get Reports
            </button>
        </form>
    )
}

export default TickerSearch
