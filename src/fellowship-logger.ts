import fs from "fs";
import path from "path";
import type { SearchResponse } from "./test-api-search.js";

interface FellowshipLogEntry {
  timestamp: string;
  dimension: string;
  userContext: string;
  userResponse: string;
  searchTerm: string;
  searchResults: {
    total_results: number;
    slack_contexts_count: number;
    document_contexts_count: number;
    top_slack_results: Array<{
      channel: string;
      user: string;
      score: number;
      content_preview: string;
      created_at: string;
    }>;
    top_document_results: Array<{
      score: number;
      content_preview: string;
    }>;
  };
  fellowshipSummary: string;
  metadata: {
    search_duration_ms?: number;
    summary_duration_ms?: number;
  };
}

function ensureLogDirectory(): string {
  const logDir = path.join(process.cwd(), "fellowship-logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return logDir;
}

function generateLogFilename(): string {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, -5);
  return `fellowship-enrichment_${timestamp}.json`;
}

export async function logFellowshipEnrichment(
  dimension: string,
  userContext: string,
  userResponse: string,
  searchTerm: string,
  searchResults: SearchResponse,
  fellowshipSummary: string,
  metadata: { search_duration_ms?: number; summary_duration_ms?: number } = {}
): Promise<void> {
  try {
    const logDir = ensureLogDirectory();
    const filename = generateLogFilename();
    const filepath = path.join(logDir, filename);

    // Extract top results for logging
    const topSlackResults =
      searchResults.slack_contexts?.slice(0, 5).map((context) => ({
        channel: context.original_match.metadata.channel_name,
        user: context.original_match.metadata.user_name,
        score: context.original_match.score,
        content_preview: context.original_match.content.substring(0, 200),
        created_at: context.original_match.metadata.created_at,
      })) || [];

    const topDocumentResults =
      searchResults.document_contexts?.slice(0, 5).map((context) => ({
        score: context.original_match.score,
        content_preview: context.original_match.content.substring(0, 200),
      })) || [];

    const logEntry: FellowshipLogEntry = {
      timestamp: new Date().toISOString(),
      dimension,
      userContext,
      userResponse,
      searchTerm,
      searchResults: {
        total_results: searchResults.total_results || 0,
        slack_contexts_count: searchResults.slack_contexts?.length || 0,
        document_contexts_count: searchResults.document_contexts?.length || 0,
        top_slack_results: topSlackResults,
        top_document_results: topDocumentResults,
      },
      fellowshipSummary,
      metadata,
    };

    // Write to file
    fs.writeFileSync(filepath, JSON.stringify(logEntry, null, 2), "utf-8");
  } catch (error) {
    console.error("⚠️  Warning: Could not log fellowship enrichment:", error);
    // Don't throw - logging failure shouldn't break the main flow
  }
}
