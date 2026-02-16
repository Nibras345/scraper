
export interface FetchResponse {
  data: string;
}

export interface GenerateRequest {
  data: string;
  fields: string;
}

export interface AppState {
  url: string;
  scrapedData: string;
  prompt: string;
  isFetching: boolean;
  isGenerating: boolean;
  error: string | null;
  darkMode: boolean;
}
