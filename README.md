# ScrapeToCSV PRO - Enterprise AI Scraper

ScrapeToCSV PRO is a robust, enterprise-grade automated scraping platform. It leverages AI to intelligently extract product data from Shopify stores and generate ready-to-import CSV files. Built with background orchestration and deep crawling capabilities, it handles large-scale data extraction with ease.

## 🚀 Key Features

- **Job-Based Orchestration**: Manage large-scale scraping tasks in the background with a dedicated job system.
- **Automated Deep Crawling**: Intelligent discovery and extraction of products across entire stores, not just single pages.
- **AI-Powered Extraction**: Maps raw HTML to Shopify CSV fields using the Groq API (Llama 3.3 70B).
- **Full DOM Rendering**: Uses Puppeteer to execute JavaScript and capture modern web stores accurately.
- **Anti-Bot Protection**: Implements realistic browser fingerprints and timing for higher success rates.
- **Real-time Monitoring**: Track scraping progress and health through a dedicated dashboard.
- **Advanced Export Filters**: Filter by price, title, or ID before exporting to Shopify-compatible CSV.

---

## ⚙️ How it Works - Internal Workflow

### 1. Job Orchestration
When a user initiates a crawl, the **Orchestrator** takes over. It manages the job state in MongoDB and coordinates between discovery and extraction phases, ensuring fault tolerance and background execution. This allows users to start large tasks and close the tab without losing progress.

### 2. Deep Discovery (The Crawler)
The **Crawler Service** behaves like a human browsing a store. It:
- **Automates Pagination**: Intelligent detection of "Next" buttons and numerical page query parameters.
- **Triggers Lazy Loading**: Uses an intelligent **Auto-Scrolling** mechanism to force images and lazy-loaded products to appear in the DOM.
- **Strict Pattern Matching**: Uses regex-based logic to distinguish between actual product links and navigational links (collections, tags, contact pages).

### 3. High-Fidelity Rendering
By utilizing **Puppeteer**, the system renders the full DOM for every page. This is critical for modern Shopify themes that rely heavily on JavaScript for product variant selection and price display, which simple HTML parsers often miss.

### 4. Hybrid AI Extraction (Parser-First, AI-Fallback)
Our extraction engine uses a two-tier system:
- **Deterministic Layer-1**: A high-speed Shopify parser that targets structured JSON-LD and standard Shopify Liquid schemas for 100% accuracy on standard stores.
- **AI-Driven Layer-2**: For non-standard, customized, or obfuscated stores, the system feeds sanitized HTML snippets to **Groq (Llama 3.1)**. The AI dynamically maps unstructured page data to the required Shopify CSV fields.

### 5. Efficient Batch Processing
Products are processed in **parallel batches** (controlled concurrency). The orchestrator manages memory and network limits, ensuring the scraper remains stable even when handling hundreds of products simultaneously.

---

## 🛠 Technologies Used

### Backend
- **Node.js & Express**: High-performance server framework.
- **TypeScript**: Ensuring type safety across the entire stack.
- **Orchestrator Service**: Manages background jobs and crawler lifecycle.
- **Puppeteer**: Headless browser for high-fidelity rendering.
- **Mongoose**: MongoDB object modeling for persistent job and product storage.
- **Groq SDK**: High-speed AI inference for intelligent data mapping.

### Frontend
- **React & Vite**: Modern, lightning-fast frontend development.
- **Tailwind CSS**: Utility-first CSS for premium, responsive design.
- **Lucide React**: Clean and consistent iconography.

---

## 📂 Project Structure

```text
ai-data/
├── backend/                    # Node.js TypeScript Server
│   ├── src/
│   │   ├── config/             # Database & environment setup
│   │   ├── middleware/         # Rate limiting & safety layers
│   │   ├── models/             # Mongoose schemas (Jobs, Products)
│   │   ├── routes/             # API endpoints (Job, Fetch, Generate)
│   │   ├── services/           # Orchestrator, Crawler, AI, and Browser logic
│   │   ├── utils/              # Custom logger & helpers
│   │   └── server.ts           # Application entry point
│   └── package.json
├── frontend/                   # React Vite Application (Flat Structure)
│   ├── pages/                  # Main application views (Home.tsx)
│   ├── App.tsx                 # Main application entry
│   ├── index.tsx               # Root rendering
│   └── package.json
└── README.md
```

---

## ⚙️ How to Run the Project

### 1. Environment Configuration
Create a `.env` file in the `backend/` directory:
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

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📜 Usage Workflow

1. **Start Job**: Provide a Shopify store URL and define the fields you need.
2. **Monitor Progress**: View the real-time status of the background scraping job.
3. **Review Results**: Use the dashboard to filter and inspect extracted products.
4. **Export CSV**: Download the final data as a Shopify-compatible CSV.

---

## 🛡 License
This project is proprietary. Developed by **ScrapeToCSV Pro** team.

