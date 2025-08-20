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

async function testAPISearch() {
  try {
    console.log("🚀 Testing Fellowship API Search\n");

    // Test the example query first
    console.log("=".repeat(80));
    console.log("TEST 1: Example Query");
    console.log("=".repeat(80));

    const exampleRequest: SearchRequest = {
      query: "AI community notes twitter",
      topK: 100,
      includeThreads: true,
      useAdvancedRetrieval: true,
      enableContextExpansion: true,
      enableRecencyBoost: false,
      includeDocumentSummaries: true,
      sources: ["slack", "document"],
      rerank: true,
      semanticWeight: 0.7,
    };

    const exampleResults = await searchFellowshipContent(exampleRequest);

    if (exampleResults.ok) {
      console.log("\n📄 Top Slack Results:");
      exampleResults.slack_contexts?.slice(0, 3).forEach((context, idx) => {
        console.log(`\n--- Slack Result ${idx + 1} ---`);
        console.log(`Score: ${context.original_match.score.toFixed(4)}`);
        console.log(
          `Channel: #${context.original_match.metadata.channel_name}`
        );
        console.log(`User: ${context.original_match.metadata.user_name}`);
        console.log(
          `Date: ${new Date(
            context.original_match.metadata.created_at
          ).toLocaleDateString()}`
        );
        console.log(
          `Content: ${context.original_match.content.substring(0, 200)}...`
        );
        console.log(
          `Thread Context: ${context.thread_context?.length || 0} messages`
        );
        console.log(
          `Surrounding Context: ${
            context.surrounding_context?.length || 0
          } messages`
        );
      });

      if (exampleResults.document_contexts?.length > 0) {
        console.log("\n📄 Top Document Results:");
        exampleResults.document_contexts.slice(0, 2).forEach((context, idx) => {
          console.log(`\n--- Document Result ${idx + 1} ---`);
          console.log(`Score: ${context.original_match.score.toFixed(4)}`);
          console.log(`Source: ${context.original_match.source}`);
          console.log(
            `Content: ${context.original_match.content.substring(0, 200)}...`
          );
        });
      }
    }

    // Test fellowship-specific queries
    const fellowshipQueries = [
      {
        query: "epistemics and reasoning projects",
        topK: 5,
        includeThreads: true,
        useAdvancedRetrieval: true,
        enableContextExpansion: true,
        enableRecencyBoost: false,
        includeDocumentSummaries: true,
        sources: ["slack", "document"],
        rerank: true,
        semanticWeight: 0.7,
      },
      {
        query: "fact checking misinformation tools",
        topK: 5,
        includeThreads: false,
        useAdvancedRetrieval: true,
        enableContextExpansion: false,
        enableRecencyBoost: true,
        includeDocumentSummaries: false,
        sources: ["document"],
        rerank: true,
        semanticWeight: 0.8,
      },
    ];

    for (let i = 0; i < fellowshipQueries.length; i++) {
      console.log("\n" + "=".repeat(80));
      console.log(`TEST ${i + 2}: Fellowship Query ${i + 1}`);
      console.log("=".repeat(80));

      const results = await searchFellowshipContent(fellowshipQueries[i]);

      if (results.ok) {
        console.log(`\n📄 Top Result Preview:`);

        // Show top Slack result if available
        if (results.slack_contexts?.length > 0) {
          const topSlack = results.slack_contexts[0];
          console.log(
            `🗣️ Slack (#${topSlack.original_match.metadata.channel_name})`
          );
          console.log(`   Score: ${topSlack.original_match.score.toFixed(4)}`);
          console.log(`   User: ${topSlack.original_match.metadata.user_name}`);
          console.log(
            `   Content: ${topSlack.original_match.content.substring(
              0,
              150
            )}...`
          );
        }

        // Show top Document result if available
        if (results.document_contexts?.length > 0) {
          const topDoc = results.document_contexts[0];
          console.log(`📄 Document`);
          console.log(`   Score: ${topDoc.original_match.score.toFixed(4)}`);
          console.log(
            `   Content: ${topDoc.original_match.content.substring(0, 150)}...`
          );
        }
      }
    }

    console.log("\n🎉 API search testing complete!");
  } catch (error) {
    console.error("❌ Error in testing:", error);
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

// Run tests if this file is executed directly
if (require.main === module) {
  testAPISearch();
}
