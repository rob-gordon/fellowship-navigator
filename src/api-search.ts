const API_ENDPOINT =
  "https://offers-and-asks-slack-nbgim.ondigitalocean.app/api/extended-search";
const BEARER_TOKEN = "6fd53d2d-cd2f-49a3-ad9b-f85c867bb955";

interface SearchRequest {
  query: string;
  topK?: number;
  includeThreads?: boolean;
  useAdvancedRetrieval?: boolean;
  enableContextExpansion?: boolean;
  enableRecencyBoost?: boolean;
  includeDocumentSummaries?: boolean;
  sources?: string[];
  rerank?: boolean;
  semanticWeight?: number;
}

interface SearchResponse {
  ok: boolean;
  query: string;
  total_results: number;
  slack_contexts: SlackContext[];
  document_contexts: DocumentContext[];
  meta: any;
}

interface SlackContext {
  original_match: {
    id: string;
    content: string;
    score: number;
    source: string;
    metadata: {
      channel_name: string;
      user_name: string;
      thread_ts: string | null;
      created_at: string;
    };
  };
  thread_context: any[];
  surrounding_context: any[];
  channel_info: {
    channel_id: string;
    channel_name: string;
  };
}

interface DocumentContext {
  original_match: {
    id: string;
    content: string;
    score: number;
    source: string;
    metadata: any;
  };
  // Add more fields as we discover them
}

async function searchFellowshipContent(
  searchRequest: SearchRequest
): Promise<SearchResponse> {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(searchRequest),
    });

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status}, statusText: ${response.statusText}`
      );
    }

    const data: SearchResponse = await response.json();

    return data;
  } catch (error) {
    console.error("❌ Error searching fellowship content:", error);
    throw error;
  }
}

// Export functions for use in other files
export {
  searchFellowshipContent,
  type SearchRequest,
  type SearchResponse,
  type SlackContext,
  type DocumentContext,
};
