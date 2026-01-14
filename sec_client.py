import requests

# Same user-agent convention as in ticker_resolver
HEADERS = {
    "User-Agent": "Patrick EarningsAnalyser (patrickchen74@gmail.com)",
    "Accept": "application/json",
}

SEC_BASE = "https://data.sec.gov"
XBRL_FACTS_BASE = "https://data.sec.gov/api/xbrl/companyfacts"


def get_submissions(cik_padded: str) -> dict:
    """
    Fetch the SEC submissions JSON for a given 10-digit padded CIK.
    """
    url = f"{SEC_BASE}/submissions/CIK{cik_padded}.json"
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.json()


def list_reports(submissions: dict, limit: int = 6) -> list[dict]:
    """
    Return up to `limit` most recent 10-Q / 10-K / 20-F filings.
    Each entry: {form, accession, primary_doc, filing_date}.
    """
    recent = submissions["filings"]["recent"]
    forms = recent["form"]
    accessions = recent["accessionNumber"]
    docs = recent["primaryDocument"]
    dates = recent["filingDate"]
    report_dates = recent["reportDate"]

    priority_forms = {"10-Q", "10-K", "20-F"}

    reports: list[dict] = []
    for f, acc, doc, date, rdate in zip(forms, accessions, docs, dates, report_dates):
        if f in priority_forms:
            reports.append(
                {
                    "form": f,
                    "accession": acc,
                    "primary_doc": doc,
                    "filing_date": date,
                    "report_date": rdate,
                }
            )
        if len(reports) >= limit:
            break

    return reports


def choose_latest_report(submissions: dict) -> dict | None:
    """
    Convenience: just return the first report from list_reports, or None.
    """
    reports = list_reports(submissions, limit=1)
    return reports[0] if reports else None


def build_filing_url(cik_padded: str, accession: str, primary_doc: str) -> str:
    """
    Build the SEC Archives URL for a filing.
    - cik_padded: 10-digit padded CIK string
    - accession: e.g. '0001652044-25-000091'
    - primary_doc: e.g. 'goog-20250930.htm'
    """
    cik_stripped = str(int(cik_padded))              # remove leading zeros
    accession_clean = accession.replace("-", "")     # remove dashes
    return (
        f"https://www.sec.gov/Archives/edgar/data/"
        f"{cik_stripped}/{accession_clean}/{primary_doc}"
    )


# ---------- XBRL COMPANY FACTS HELPERS ----------


def get_company_facts(cik_padded: str) -> dict:
    """
    Fetch XBRL companyfacts for the company (all concepts).
    """
    url = f"{XBRL_FACTS_BASE}/CIK{cik_padded}.json"
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.json()


def _get_units(facts: dict, concept: str, unit: str = "USD") -> list[dict]:
    """
    Get list of unit entries for a given us-gaap concept and unit (e.g. USD).
    Returns [] if concept/unit not found.
    """
    try:
        return facts["facts"]["us-gaap"][concept]["units"][unit]
    except KeyError:
        return []


def get_metric_for_filing(
    facts: dict,
    concept: str,
    accession: str,
    end_date: str,
    unit: str = "USD",
) -> float | None:
    """
    Return the value for a specific concept that matches this filing
    (by accession and end date), or None.
    """
    entries = _get_units(facts, concept, unit)
    for e in entries:
        if e.get("accn") == accession and e.get("end") == end_date and "val" in e:
            return e["val"]
    return None


def get_timeseries(
    facts: dict,
    concept: str,
    max_points: int = 4,
    unit: str = "USD",
) -> list[dict]:
    """
    Return up to max_points most recent entries for a concept.
    Each entry: {end, val, form, fy, fp}.
    """
    entries = _get_units(facts, concept, unit)
    cleaned = [
        e
        for e in entries
        if "end" in e and "val" in e
    ]

    cleaned.sort(key=lambda e: e["end"], reverse=True)

    series = []
    for e in cleaned[:max_points]:
        series.append(
            {
                "end": e.get("end"),
                "val": e.get("val"),
                "form": e.get("form"),
                "fy": e.get("fy"),
                "fp": e.get("fp"),
            }
        )

# Detailed mapping for standardized financial statements
# Keys are labels to show in UI. Values are lists of XBRL concepts to try (in order).
FINANCIAL_STATEMENT_MAP = {
    "income": {
        "Revenue": ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "SalesRevenueNet", "SalesRevenueServicesNet", "SalesRevenueGoodsNet"],
        "Cost of Revenue": ["CostOfRevenue", "CostOfGoodsAndServicesSold", "CostOfGoodsSold", "CostOfServices"],
        "Gross Profit": ["GrossProfit"],
        "Operating Expenses": ["OperatingExpenses", "OperatingCostsAndExpenses"],
        "Operating Income": ["OperatingIncomeLoss"],
        "Net Income": ["NetIncomeLoss", "ProfitLoss"],
        "EPS (Basic)": ["EarningsPerShareBasic"],
        "EPS (Diluted)": ["EarningsPerShareDiluted"],
    },
    "balance": {
        "Cash & Equivalents": ["CashAndCashEquivalentsAtCarryingValue", "CashAndCashEquivalents"],
        "Short-term Investments": ["MarketableSecuritiesCurrent", "AvailableForSaleSecuritiesCurrent"],
        "Total Current Assets": ["AssetsCurrent"],
        "Total Assets": ["Assets"],
        "Accounts Payable": ["AccountsPayableCurrent", "AccountsPayableTradeCurrent"],
        "Total Current Liabilities": ["LiabilitiesCurrent"],
        "Total Liabilities": ["Liabilities"],
        "Retained Earnings": ["RetainedEarningsAccumulatedDeficit"],
        "Total Equity": ["StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"],
    },
    "cash_flow": {
        "Net Cash from Operating": ["NetCashProvidedByUsedInOperatingActivities"],
        "Depreciation & Amortization": ["DepreciationDepletionAndAmortization", "Depreciation", "AmortizationOfIntangibleAssets"],
        "Net Cash from Investing": ["NetCashProvidedByUsedInInvestingActivities"],
        "CapEx": ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets"],
        "Net Cash from Financing": ["NetCashProvidedByUsedInFinancingActivities"],
        "Dividends Paid": ["PaymentsOfDividends", "PaymentsOfDividendsCommonStock"],
    }
}


def build_financial_statements(facts: dict, accession: str, end_date: str) -> dict:
    """
    Construct standardized Income, Balance, and Cash Flow statements
    for a specific filing (accession + end_date).
    """
    statements = {}

    for statement_type, mapping in FINANCIAL_STATEMENT_MAP.items():
        statement_data = []
        for label, concepts in mapping.items():
            value = None
            # Try concepts in order until we find one
            for concept in concepts:
                # We typically want USD, but EPS is USD/sh
                unit = "USD/sh" if "EPS" in label else "USD"
                val = get_metric_for_filing(facts, concept, accession, end_date, unit=unit)
                if val is not None:
                    value = val
                    break
            
            # Append if we found something, or even if None (to show line item)
            # We filter out totally empty lines later if we want, but showing N/A is often better
            statement_data.append({
                "label": label,
                "value": value,
                "unit": "USD/sh" if "EPS" in label else "USD"
            })
        statements[statement_type] = statement_data

    return statements
