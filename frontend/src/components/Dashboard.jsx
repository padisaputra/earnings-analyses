import { useState, useEffect } from 'react'
import MetricsPanel from './MetricsPanel'
import MDAPanel from './MDAPanel'
import FilingFrame from './FilingFrame'
import FinancialStatements from './FinancialStatements'

function Dashboard({ cik, ticker, report }) {
    const [details, setDetails] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!report) return

        const loadDetails = async () => {
            setLoading(true)
            setError(null)
            setDetails(null)

            const params = new URLSearchParams({
                cik: cik,
                accession: report.accession,
                primary_doc: report.primary_doc,
                filing_date: report.filing_date,
                report_date: report.report_date || '',
            })

            try {
                const resp = await fetch(`/api/report-details?${params.toString()}`)
                if (!resp.ok) {
                    const data = await resp.json().catch(() => ({}))
                    throw new Error(data.detail || `Error: ${resp.status}`)
                }
                const data = await resp.json()
                setDetails(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        loadDetails()
    }, [cik, report])

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading report details...</div>
    }

    if (error) {
        return <div className="error-message">{error}</div>
    }

    if (!details) return null

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
                background: 'var(--bg-card)',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem' }}>{ticker} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>— {report.form}</span></h2>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Filed on {report.filing_date} • Accession: {report.accession}
                    </div>
                </div>
                <a
                    href={report.filing_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: 'var(--accent-color)',
                        fontSize: '0.875rem',
                        textDecoration: 'none'
                    }}
                >
                    Open on SEC ↗
                </a>
            </div>

            <MetricsPanel metrics={details.metrics} />

            <FinancialStatements statements={details.statements} />

            <MDAPanel html={details.mda_html} />

            <FilingFrame
                cik={cik}
                accession={report.accession}
                primaryDoc={report.primary_doc}
            />
        </div>
    )
}

export default Dashboard
