# Earnings Analyser

A web application for analyzing SEC financial reports (10-K, 10-Q) with real-time data from the SEC EDGAR database.

## Features

- 🔍 Search companies by ticker symbol
- 📊 View key financial metrics (Revenue, Net Income, EPS, Cash Flow)
- 📈 Historical trend charts
- 📄 Complete financial statements (Income, Balance Sheet, Cash Flow)
- 📝 MD&A section extraction
- 🔗 Direct links to SEC filings

## Tech Stack

- **Backend:** Python, FastAPI
- **Frontend:** React, Vite, Recharts
- **Data Source:** SEC EDGAR API

## Live Demo

Deployed on Render: [Coming soon]

## Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
cd frontend && npm install
```

2. Run backend:
```bash
python3 -m uvicorn main:app --reload --port 8000
```

3. Run frontend:
```bash
cd frontend && npm run dev
```

4. Open http://localhost:5173

## Deployment

See [render_deployment.md](render_deployment.md) for deployment instructions.

## License

MIT
