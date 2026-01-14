import requests

# IMPORTANT: put your real name/app/email here.
HEADERS = {
    "User-Agent": "Patrick EarningsAnalyser (patrickchen74@gmail.com)",
    "Accept": "application/json",
}

TICKER_MAP_URL = "https://www.sec.gov/files/company_tickers.json"


def load_ticker_map() -> dict[str, str]:
    """
    Download the SEC ticker→CIK mapping and return {TICKER: CIK_10_DIGITS}.
    """
    resp = requests.get(TICKER_MAP_URL, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    mapping: dict[str, str] = {}
    for entry in data.values():
        ticker = entry["ticker"].upper()
        cik_str = f'{entry["cik_str"]:010d}'  # zero-pad to 10 digits
        mapping[ticker] = cik_str
    return mapping


# Load once at import time. For a small personal tool this is fine.
TICKER_MAP = load_ticker_map()


def ticker_to_cik(ticker: str) -> str | None:
    """
    Return the CIK (10-digit zero-padded string) for a given ticker,
    or None if the ticker is not found.
    """
    if not ticker:
        return None
    return TICKER_MAP.get(ticker.upper())
