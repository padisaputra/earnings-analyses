function ReportList({ reports, selectedIndex, onSelect }) {
    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border-color)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                fontSize: '0.875rem'
            }}>
                Recent Filings
            </div>
            <div>
                {reports.map((report, idx) => (
                    <div
                        key={report.accession}
                        onClick={() => onSelect(idx)}
                        style={{
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border-color)',
                            background: idx === selectedIndex ? '#1e3a8a' : 'transparent',
                            transition: 'background 0.2s',
                            borderLeft: idx === selectedIndex ? '3px solid var(--accent-color)' : '3px solid transparent'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{report.form}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{report.filing_date}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                            {report.accession}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ReportList
