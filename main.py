from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import pathlib
import requests
import re
import html as html_lib


from ticker_resolver import ticker_to_cik
from sec_client import (
    get_submissions,
    list_reports,
    choose_latest_report,
    build_filing_url,
    get_company_facts,
    get_metric_for_filing,
    get_timeseries,
    build_financial_statements,
    FINANCIAL_STATEMENT_MAP,
    HEADERS,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles

# ... existing code ...

BASE_DIR = pathlib.Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "frontend" / "dist"

app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")

@app.get("/", response_class=HTMLResponse)
def root():
    """
    Serve the frontend single-page app.
    """
    index_path = FRONTEND_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=500, detail="frontend/dist/index.html not found. Did you run 'npm run build'?")
    return index_path.read_text(encoding="utf-8")


@app.get("/api/latest-report")
def latest_report(ticker: str):
    """
    Simpler endpoint: return only the latest 10-Q/10-K/20-F for a ticker.
    """
    cik = ticker_to_cik(ticker)
    if not cik:
        raise HTTPException(status_code=404, detail="Ticker not found")

    subs = get_submissions(cik)
    report = choose_latest_report(subs)
    if not report:
        raise HTTPException(status_code=404, detail="No report found")

    filing_url = build_filing_url(cik, report["accession"], report["primary_doc"])

    return {
        "ticker": ticker.upper(),
        "cik": cik,
        "form": report["form"],
        "filing_date": report["filing_date"],
        "accession": report["accession"],
        "primary_doc": report["primary_doc"],
        "report_date": report.get("report_date", ""),
        "filing_url": filing_url,
    }


@app.get("/api/reports")
def reports(ticker: str):
    """
    Return a list of recent 10-Q/10-K filings for a ticker.
    """
    cik = ticker_to_cik(ticker)
    if not cik:
        raise HTTPException(status_code=404, detail="Ticker not found")

    subs = get_submissions(cik)
    reports_list = list_reports(subs)
    if not reports_list:
        raise HTTPException(status_code=404, detail="No reports found")

    for r in reports_list:
        r["filing_url"] = build_filing_url(cik, r["accession"], r["primary_doc"])

    return {
        "ticker": ticker.upper(),
        "cik": cik,
        "reports": reports_list,
    }


def extract_mda_html(cik_padded: str, accession: str, primary_doc: str) -> str | None:
    """
    Heuristic extraction of the MD&A section.

    Strategy:
    - Fetch filing HTML.
    - Strip tags -> plain text.
    - Look for MD&A phrases (10-Q Item 2 or 10-K Item 7).
    - Cut until the next major Item heading.
    - Return as escaped HTML text (not raw SEC HTML).
    """
    filing_url = build_filing_url(cik_padded, accession, primary_doc)

    try:
        resp = requests.get(filing_url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
    except requests.RequestException:
        return None

    raw_html = resp.text

    # Normalise weird quotes
    normalized = (
        raw_html.replace("\u2019", "'")
        .replace("\u2018", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
    )

    # Strip tags -> plain text
    text = re.sub(r"<[^>]+>", " ", normalized)
    text_lower = text.lower()

    # Possible MD&A headings
    start_markers = [
        "item 2. management's discussion and analysis",
        "item 7. management's discussion and analysis",
        "management's discussion and analysis of financial condition and results of operations",
    ]

    start_idx = -1
    for m in start_markers:
        idx = text_lower.find(m)
        if idx != -1:
            start_idx = idx
            break

    if start_idx == -1:
        return None

    # Look for the next "Item X." after MD&A to mark the end
    end_markers = [
        "item 3.",
        "item 4.",
        "item 7a.",
        "item 8.",
        "quantitative and qualitative disclosures about market risk",
    ]
    search_from = start_idx + 50  # skip past heading
    end_idx_candidates = []
    for m in end_markers:
        idx = text_lower.find(m, search_from)
        if idx != -1:
            end_idx_candidates.append(idx)

    if end_idx_candidates:
        end_idx = min(end_idx_candidates)
    else:
        # fallback: limit length
        end_idx = min(len(text), start_idx + 40000)

    snippet = text[start_idx:end_idx]
    # Clean up whitespace
    snippet = re.sub(r"\s+", " ", snippet).strip()

    if not snippet:
        return None

    escaped = html_lib.escape(snippet)
    return f"<div style='white-space:pre-wrap; font-size:12px;'>{escaped}</div>"



@app.get("/api/report-details")
def report_details(
    cik: str,
    accession: str,
    primary_doc: str,
    filing_date: str,
    report_date: str = "",
):
    """
    Return:
    - Key metrics for this filing (revenue, EPS, net income, CFO)
    - Timeseries (last few periods) for each metric
    - MD&A HTML snippet
    """
    facts = get_company_facts(cik)

    # concept name, unit, label
    # concept name list, unit, label
    # We use the same robust mapping as financial statements where possible
    metrics_spec = {
        "revenue": (FINANCIAL_STATEMENT_MAP["income"]["Revenue"], "USD", "Revenue"),
        "net_income": (FINANCIAL_STATEMENT_MAP["income"]["Net Income"], "USD", "Net income"),
        "eps_diluted": (FINANCIAL_STATEMENT_MAP["income"]["EPS (Diluted)"], "USD/sh", "EPS (diluted)"),
        "cfo": (FINANCIAL_STATEMENT_MAP["cash_flow"]["Net Cash from Operating"], "USD", "Operating cash flow"),
    }

    metrics: dict[str, dict] = {}
    
    # Use report_date (period end) for XBRL lookup if available, otherwise fallback (likely to fail but safe)
    end_date = report_date if report_date else filing_date

    for key, (concepts, unit, label) in metrics_spec.items():
        # Ensure concepts is a list
        if isinstance(concepts, str):
            concepts = [concepts]
            
        current_val = None
        chosen_concept = concepts[0] # Default for timeseries if none found (imperfect but okay)

        for concept in concepts:
            val = get_metric_for_filing(
                facts, concept, accession=accession, end_date=end_date, unit=unit or "USD"
            )
            if val is not None:
                current_val = val
                chosen_concept = concept
                break
        
        # improving timeseries to use the chosen concept (or the first one if none matched)
        series = get_timeseries(facts, chosen_concept, max_points=4, unit=unit or "USD")

        metrics[key] = {
            "label": label,
            "concept": chosen_concept,
            "unit": unit,
            "current": current_val,
            "series": series,
        }

    mda_html = extract_mda_html(cik, accession, primary_doc)
    statements = build_financial_statements(facts, accession, end_date)

    return {
        "cik": cik,
        "accession": accession,
        "filing_date": filing_date,
        "report_date": report_date,
        "metrics": metrics,
        "mda_html": mda_html,
        "statements": statements,
    }


@app.get("/proxy-filing", response_class=HTMLResponse)
def proxy_filing(cik: str, accession: str, primary_doc: str):
    """
    Proxy a specific filing so it can be embedded (SEC blocks direct iframe).
    Frontend passes CIK, accession, and primary_doc.
    """
    filing_url = build_filing_url(cik, accession, primary_doc)

    try:
        resp = requests.get(filing_url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
    except requests.RequestException as e:
        raise HTTPException(
            status_code=502,
            detail=f"Error fetching SEC filing: {e}",
        )

    html = resp.text

    base_href = filing_url.rsplit("/", 1)[0] + "/"

    style_injection = """
    <style>
    html, body {
        background: #ffffff !important;
        color: #000000 !important;
    }
    a {
        color: #0645ad !important;
    }
    </style>
    """

    injection = f'<base href="{base_href}">{style_injection}'
    lower = html.lower()
    idx = lower.find("<head>")
    if idx != -1:
        idx_end = idx + len("<head>")
        html = html[:idx_end] + injection + html[idx_end:]
    else:
        html = injection + html


    return HTMLResponse(content=html)
