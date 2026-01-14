function MDAPanel({ html }) {
    if (!html) {
        return (
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                padding: '1rem',
                color: 'var(--text-secondary)',
                fontStyle: 'italic'
            }}>
                MD&A section not found in this filing.
            </div>
        )
    }

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
                fontWeight: 600
            }}>
                MD&A Extract
            </div>
            <div
                style={{
                    padding: '1rem',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    color: '#cbd5e1'
                }}
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </div>
    )
}

export default MDAPanel
