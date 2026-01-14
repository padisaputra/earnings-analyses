
import { useRef } from 'react'
import { Download, Printer } from 'lucide-react'

function FilingFrame({ cik, accession, primaryDoc }) {
    const iframeRef = useRef(null)

    const params = new URLSearchParams({
        cik: cik,
        accession: accession,
        primary_doc: primaryDoc,
    })

    // Note: /proxy-filing is proxied to http://127.0.0.1:8000/proxy-filing by Vite
    const src = `/proxy-filing?${params.toString()}`

    const handlePrint = () => {
        if (iframeRef.current) {
            iframeRef.current.contentWindow.print()
        }
    }

    const handleDownload = async () => {
        try {
            const response = await fetch(src)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${primaryDoc || 'filing'}` // Default to original filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Download failed:', error)
            alert('Failed to download the filing.')
        }
    }

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
                fontWeight: 600,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span>Filing Preview</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={handlePrint}
                        title="Print or Save as PDF"
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            padding: '0.4rem',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <Printer size={16} />
                    </button>
                    <button
                        onClick={handleDownload}
                        title="Download HTML"
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            padding: '0.4rem',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <Download size={16} />
                    </button>
                </div>
            </div>
            <iframe
                ref={iframeRef}
                src={src}
                style={{
                    width: '100%',
                    height: '600px',
                    border: 'none',
                    background: 'white' // Filings are usually white background
                }}
                title="Filing Viewer"
            />
        </div>
    )
}

export default FilingFrame

