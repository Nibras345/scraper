
import React, { useState, useEffect } from 'react';
import { Sun, Moon, Globe, ClipboardList, Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FetchResponse } from '../types';

const Home: React.FC = () => {
  const [url, setUrl] = useState('');
  const [scrapedData, setScrapedData] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize theme from system or local storage
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' || 
                   (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Fetch HTML/content from backend
  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setIsFetching(true);
    setError(null);
    setSuccess(null);
    setScrapedData('');

    try {
      const response = await fetch('http://localhost:5000/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.statusText}`);
      }

      const result: FetchResponse = await response.json();
      setScrapedData(result.data);

      setSuccess('Data fetched successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch failed.');
    } finally {
      setIsFetching(false);
    }
  };

  // Send HTML + user prompt to AI and download CSV
  const handleGenerateCSV = async () => {
    if (!scrapedData.trim()) {
      setError('No scraped data available.');
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter what fields you want.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('http://localhost:5000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          data: scrapedData,
          fields: prompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const blob = await response.blob();

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'shopify_import.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setSuccess('CSV downloaded successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CSV generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-4xl mx-auto">
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-12">
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 dark:bg-neutral-100 p-2 rounded-lg">
            <ClipboardList size={24} className="text-white dark:text-neutral-900" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
            ScrapeToCSV <span className="text-neutral-400 font-light">PRO</span>
          </h1>
        </div>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Toggle Theme"
        >
          {darkMode ? <Sun size={20} className="text-neutral-400" /> : <Moon size={20} className="text-neutral-600" />}
        </button>
      </header>

      <main className="w-full space-y-8 animate-in fade-in duration-500">
        {/* Section 1: URL Input */}
        <section className="bg-white dark:bg-neutral-800/50 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm transition-all hover:shadow-md">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-4 uppercase tracking-wider flex items-center gap-2">
            <Globe size={14} /> 1. Source URL
          </h2>
          <form onSubmit={handleFetch} className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              required
              placeholder="https://example.com/product-page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition-all"
            />
            <button
              type="submit"
              disabled={isFetching || !url}
              className="px-8 py-3 bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-w-[140px]"
            >
              {isFetching ? <Loader2 size={18} className="animate-spin" /> : 'Fetch Data'}
            </button>
          </form>
        </section>

        {/* Status Messages */}
        {(error || success) && (
          <div className={`w-full p-4 rounded-xl border flex items-center gap-3 transition-all animate-in slide-in-from-top-2 ${
            error 
              ? 'bg-red-50 border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400' 
              : 'bg-green-50 border-green-100 text-green-700 dark:bg-green-900/20 dark:border-green-900/30 dark:text-green-400'
          }`}>
            {error ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <p className="text-sm font-medium">{error || success}</p>
          </div>
        )}

        {/* Section 2: Scraped Data Area */}
        <section className={`transition-all duration-300 ${scrapedData ? 'opacity-100 scale-100' : 'opacity-30 pointer-events-none grayscale'}`}>
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-4 uppercase tracking-wider flex items-center gap-2">
            <ClipboardList size={14} /> 2. Raw Scraped Content
          </h2>
          <textarea
            value={scrapedData}
            onChange={(e) => setScrapedData(e.target.value)}
            placeholder="Fetched data will appear here..."
            className="w-full h-64 px-4 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition-all resize-none shadow-sm"
          />
        </section>

        {/* Section 3: Generate CSV */}
        <section className={`bg-white dark:bg-neutral-800/50 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm transition-all ${scrapedData ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-4 pointer-events-none'}`}>
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-4 uppercase tracking-wider flex items-center gap-2">
            <Download size={14} /> 3. Shopify CSV Prompt
          </h2>
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="What information do you want from this data? (e.g., Title, SKU, Price, Color)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full px-4 py-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition-all"
              />
            </div>
            <button
              onClick={handleGenerateCSV}
              disabled={isGenerating || !scrapedData || !prompt}
              className="w-full py-4 bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Processing Extraction...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Download Shopify CSV
                </>
              )}
            </button>
            <p className="text-center text-xs text-neutral-400 dark:text-neutral-500 italic">
              AI will analyze the text and map it to a standard Shopify CSV format based on your requested fields.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-20 mb-8 text-neutral-400 dark:text-neutral-600 text-sm">
        <p>&copy; {new Date().getFullYear()} ScrapeToCSV Pro. all rights reserved by Nibras Siddiqi.</p>
      </footer>
    </div>
  );
};

export default Home;
