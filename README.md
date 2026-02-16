# ScrapeToCSV PRO - AI Shopify Product Scraper

ScrapeToCSV PRO is a powerful, AI-driven tool designed to extract product information from Shopify stores and generate ready-to-import Shopify CSV files. It features a robust Puppeteer-based rendering engine to handle JavaScript-heavy sites and integrates with Groq's LLM for intelligent data extraction.

## 🚀 Key Features

- **Full DOM Rendering**: Uses Puppeteer to execute JavaScript and capture the final state of modern web stores.
- **AI-Powered Extraction**: Maps raw HTML to Shopify CSV fields using the Groq API (Llama 3.3 70B).
- **Anti-Bot Protection**: Implements realistic browser fingerprints and timing to ensure higher success rates.
- **Shopify Compatible**: Generates CSVs formatted specifically for Shopify's product import utility.
- **Persistent History**: Automatically saves all scraping activities and results to MongoDB.

---

## 🛠 Technologies Used

### Backend
- **Node.js & Express**: Fast and scalable server framework.
- **TypeScript**: Ensures type safety and cleaner architecture.
- **Puppeteer**: Headless browser for high-fidelity rendering.
- **Mongoose**: Elegant MongoDB object modeling.
- **Groq SDK**: High-speed AI inference for data structure mapping.
- **json2csv**: Accurate CSV generation.

### Frontend
- **React & Vite**: Modern, lightning-fast frontend development.
- **Tailwind CSS**: Utility-first CSS for premium design.
- **Lucide React**: Clean and consistent iconography.

---

## 📂 Project Structure

```text
ai-data/
├── backend/                    # Node.js TypeScript Server
│   ├── src/
│   │   ├── config/             # Database & environment setup
│   │   ├── models/             # Mongoose schemas (ScrapeHistory)
│   │   ├── routes/             # Express API endpoints
│   │   ├── services/           # AI, Browser (Puppeteer), and CSV logic
│   │   ├── utils/              # Custom logger & helpers
│   │   └── server.ts           # Application entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                    # Storage for API Keys & Config
├── frontend/                   # React Vite Application
│   ├── src/
│   │   ├── pages/              # Main application views (Home.tsx)
│   │   └── App.tsx             # Main routing & layout
│   ├── package.json
│   └── vite.config.ts          # Vite configuration
└── README.md
```

---

## ⚙️ How to Run the Project

### 1. Environment Configuration
Create a `.env` file in the `backend/` directory with the following variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
```

### 2. Start the Backend
```bash
cd backend
npm install
npm run dev
```
- **Port:** `5000`
- **Output:** `🚀 Server running on port 5000`

### 3. Start the Frontend
```bash
# Open a new terminal
cd frontend
npm install
npm run dev
```
- **Port:** `3000` (or the port specified by Vite)
- **Output:** Application available at `http://localhost:3000`

---

## 📜 Usage Workflow

1. **Enter URL**: Provide the product page URL of any Shopify store.
2. **Fetch Data**: Click "Fetch Data" to render the page via Puppeteer and see the raw content.
3. **Define Fields**: Tell the AI what you want to extract (e.g., "Extract product title, price, and variant colors").
4. **Generate CSV**: Click "Download Shopify CSV" to receive your import-ready file.

---

## 🛡 License
This project is proprietary. Developed by **ScrapeToCSV Pro** team.
