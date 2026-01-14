import { useState } from 'react'

function formatCurrency(val, unit) {
    if (val === null || val === undefined) return "–"; // em dash

    // Check if it's EPS (small number)
    if (unit && unit.includes("/sh")) {
        return val.toFixed(2);
    }

    // Large numbers
    const abs = Math.abs(val);
    if (abs >= 1e9) return (val / 1e9).toFixed(2) + " B";
    if (abs >= 1e6) return (val / 1e6).toFixed(2) + " M";
    if (abs >= 1e3) return (val / 1e3).toFixed(2) + " K";

    return val.toLocaleString();
}

function FinancialStatements({ statements }) {
    const [activeTab, setActiveTab] = useState('income') // income, balance, cash_flow

    if (!statements) return null;

    const tabs = [
        { id: 'income', label: 'Income Statement' },
        { id: 'balance', label: 'Balance Sheet' },
        { id: 'cash_flow', label: 'Cash Flow' },
    ]

    const currentItems = statements[activeTab] || [];

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            marginTop: '1rem'
        }}>
            <div style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center'
            }}>
                <span style={{ fontWeight: 600, marginRight: '1rem' }}>Financial Statements</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                background: activeTab === tab.id ? '#1e3a8a' : 'transparent',
                                color: activeTab === tab.id ? '#93c5fd' : 'var(--text-secondary)',
                                border: 'none',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 500
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Line Item</th>
                            <th style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '0.75rem 1rem' }}>{item.label}</td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontFamily: 'monospace' }}>
                                    {formatCurrency(item.value, item.unit)}
                                </td>
                            </tr>
                        ))}
                        {currentItems.length === 0 && (
                            <tr>
                                <td colSpan={2} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No data available for this statement.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)' }}>
                * Standardized view based on common US-GAAP tags. Some line items may be missing.
            </div>
        </div>
    )
}

export default FinancialStatements
