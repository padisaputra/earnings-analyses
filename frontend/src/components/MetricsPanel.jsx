import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { useState } from 'react'

function formatNumber(n) {
    if (n === null || n === undefined) return "–";
    const abs = Math.abs(n);
    if (abs >= 1e9) return (n / 1e9).toFixed(2) + " B";
    if (abs >= 1e6) return (n / 1e6).toFixed(2) + " M";
    if (abs >= 1e3) return (n / 1e3).toFixed(2) + " K";
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function renderSeries(series, unit) {
    if (!series || !series.length) return "No history";
    return series.map((p, idx) => (
        <div key={idx} style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{p.end} ({p.fp || ""}):</span>{' '}
            <span>{formatNumber(p.val)}{unit && unit !== "USD" ? " " + unit : ""}</span>
        </div>
    ));
}

function MetricsPanel({ metrics }) {
    const [viewMode, setViewMode] = useState('table') // 'table' or 'chart'

    if (!metrics) return null;

    const metricKeys = ["revenue", "net_income", "eps_diluted", "cfo"];

    // Prepare data for charts
    // We need to merge the series data from all metrics into a single timeline if possible, 
    // or just show individual charts. merging is better but dates might mismatch.
    // For simplicity, let's make a "Revenue vs Net Income" chart which is the most common request.

    const revenueSeries = metrics.revenue?.series || [];
    const incomeSeries = metrics.net_income?.series || [];

    // Create a map of date -> object
    const chartDataMap = {};

    [...revenueSeries, ...incomeSeries].forEach(item => {
        if (!item.end) return;
        if (!chartDataMap[item.end]) {
            chartDataMap[item.end] = { name: item.end };
        }
    });

    revenueSeries.forEach(item => {
        if (chartDataMap[item.end]) chartDataMap[item.end].Revenue = item.val;
    });

    incomeSeries.forEach(item => {
        if (chartDataMap[item.end]) chartDataMap[item.end]['Net Income'] = item.val;
    });

    const chartData = Object.values(chartDataMap).sort((a, b) => a.name.localeCompare(b.name));

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
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span>Key Metrics</span>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <button
                        onClick={() => setViewMode('table')}
                        style={{
                            background: viewMode === 'table' ? '#1e3a8a' : 'transparent',
                            color: viewMode === 'table' ? '#93c5fd' : 'var(--text-secondary)',
                            border: 'none',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            cursor: 'pointer'
                        }}
                    >
                        Table
                    </button>
                    <button
                        onClick={() => setViewMode('chart')}
                        style={{
                            background: viewMode === 'chart' ? '#1e3a8a' : 'transparent',
                            color: viewMode === 'chart' ? '#93c5fd' : 'var(--text-secondary)',
                            border: 'none',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            cursor: 'pointer'
                        }}
                    >
                        Chart
                    </button>
                </div>
            </div>

            {viewMode === 'table' ? (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Metric</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Latest</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>History</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metricKeys.map(key => {
                                const item = metrics[key];
                                if (!item) return null;
                                return (
                                    <tr key={key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '0.75rem 1rem' }}>{item.label}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>
                                            {formatNumber(item.current)}
                                            {item.unit && item.unit !== "USD" && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>{item.unit}</span>}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            {renderSeries(item.series, item.unit)}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{ padding: '1rem', height: '300px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis
                                stroke="#94a3b8"
                                tickFormatter={(value) => `$${(value / 1e9).toFixed(0)}B`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                formatter={(value) => formatNumber(value)}
                            />
                            <Legend />
                            <Bar dataKey="Revenue" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Net Income" fill="#818cf8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}

export default MetricsPanel
