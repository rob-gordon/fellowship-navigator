#!/bin/env node

import {
  intro,
  text,
  stream,
  multiselect,
  select,
  outro,
  log,
  spinner,
} from "@clack/prompts";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject, generateText, streamText } from "ai";
import { z } from "zod";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { searchFellowshipContent, type SearchResponse } from "./api-search.js";
import { logFellowshipEnrichment } from "./fellowship-logger.js";

// Load environment variables
dotenv.config({
  quiet: true,
});

// Set up OpenRouter with fallback API key
const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY ||
  "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";
const openrouter = createOpenRouter({
  apiKey: OPENROUTER_API_KEY,
});

let dim_index = 0;
const data = {
  HAIR_ON_FIRE_PROBLEM: "",
  EPISTEMIC_GOAL: "",
  TARGET_USER: "",
  TECHNICAL_SHAPE: "",
  SIGNAL_GATHERING: "",
};
type Data = typeof data;
const dimensions = Object.keys(data);

type UserResponse = "selected" | "new_options" | "different_dimension";

async function main() {
  const contextFile = process.argv[2];
  const context = contextFile
    ? await loadContextFromFile(contextFile)
    : await getInitialContext();
  const greeting = await greetUserAndAlign(context);

  // Main control flow - all branching logic is explicit here
  let user_likes_dimension = true;
  let first_iteration = true;
  while (true) {
    // BRANCH: Check if any dimensions remain
    const remaining_dimensions = dimensions.filter(
      (dimension) => !data[dimension as keyof typeof data]
    );

    if (remaining_dimensions.length === 0) {
      break;
    }

    // BRANCH: Select next dimension based on user preference
    if (first_iteration) {
      dim_index = await pickFirstDimension(context);
      first_iteration = false;
    } else {
      dim_index = user_likes_dimension
        ? selectAdjacentDimension()
        : selectOppositeDimension();
    }
    const current_dimension = dimensions[dim_index];

    // this gets the users feelings on a topic
    const fishingResponse = await askFishingQuestion(
      current_dimension,
      context,
      greeting,
      data
    );

    // ENRICHMENT: Search fellowship data for relevant context (silent)
    const s = spinner();
    s.start("💭 Thinking about options...");

    let fellowshipSummary = "";
    let searchTerm = "";
    let fellowshipResults: SearchResponse | null = null;

    try {
      // Generate targeted search term (silent)
      searchTerm = await generateSearchTerm(
        current_dimension,
        context,
        fishingResponse.response,
        data
      );

      // Search fellowship content with timing (silent)
      const searchStart = Date.now();
      fellowshipResults = await searchFellowshipContent({
        query: searchTerm,
        topK: 15,
        includeThreads: true,
        useAdvancedRetrieval: true,
        enableContextExpansion: true,
        enableRecencyBoost: false,
        includeDocumentSummaries: true,
        sources: ["slack", "document"],
        rerank: true,
        semanticWeight: 0.7,
      });
      const searchDuration = Date.now() - searchStart;

      // Summarize results for context with timing (silent)
      fellowshipSummary = await summarizeFellowshipResults(
        fellowshipResults,
        current_dimension,
        context,
        fishingResponse.response
      );
      const summaryDuration = Date.now() - searchStart;

      // Log the enrichment data (silent)
      await logFellowshipEnrichment(
        current_dimension,
        context,
        fishingResponse.response,
        searchTerm,
        fellowshipResults,
        fellowshipSummary,
        {
          search_duration_ms: searchDuration,
          summary_duration_ms: summaryDuration,
        }
      );

      s.stop();
    } catch (error) {
      s.stop();
      // Silent error handling - just continue without fellowship context
      fellowshipSummary = "";

      // Still log errors for debugging
      if (searchTerm && fellowshipResults) {
        await logFellowshipEnrichment(
          current_dimension,
          context,
          fishingResponse.response,
          searchTerm,
          fellowshipResults,
          fellowshipSummary
        );
      }
    }

    // BRANCH: Handle user responses to options
    let option_selected = false;
    user_likes_dimension = true; // Reset for this dimension
    let previousOptions: string[] | undefined;
    let previousExplanation: string | undefined;

    while (user_likes_dimension && !option_selected) {
      const options = await presentOptions(
        current_dimension,
        context,
        greeting,
        fishingResponse.question,
        fishingResponse.response,
        previousOptions,
        previousExplanation,
        fellowshipSummary
      );

      if (options.type === "change_options") {
        // Store the previous options and explanation for the next iteration
        previousOptions = options.previousOptions || [];
        previousExplanation = options.explanation;
        // Don't set option_selected to true, continue the loop to show new options
        option_selected = false;
        user_likes_dimension = true;
      } else if (options.type === "change_dimension") {
        option_selected = false;
        user_likes_dimension = false;
      } else if (options.type === "selected") {
        data[current_dimension as keyof typeof data] =
          options.selected_options.join(", ");
        // Store the options that were shown for potential future use
        previousOptions = options.shownOptions;
        option_selected = true;
        user_likes_dimension = true;
      }

      // If we're continuing the loop (change_options), we need to capture the new options shown
      if (options.type === "change_options") {
        // The next iteration will show new options, so we'll capture those in the next call
        continue;
      }
    }
  }
  await finalResult(context, greeting, data);
}

async function loadContextFromFile(filePath: string): Promise<string> {
  try {
    const fullPath = path.resolve(filePath);
    const content = fs.readFileSync(fullPath, "utf-8");
    return content.trim();
  } catch (error) {
    process.exit(1);
  }
}

async function getInitialContext() {
  intro("🎯 Welcome to the AI+Epistemics Fellowship Project Picker!");

  const context = await text({
    message:
      "What interests you most about using AI to improve human reasoning and tackle urgent global information problems?",
  });
  return context.toString();
}

async function greetUserAndAlign(context: string) {
  let greeting = "";

  const result = streamText({
    model: openrouter("openai/gpt-4o-mini"),
    messages: [
      {
        role: "system",
        content: `You are an assistant helping participants in the AI+Epistemics Fellowship discover concrete project ideas.

FELLOWSHIP CONTEXT: This fellowship supports designing AI tools that enhance human reasoning and decision-making, both individually and collectively. Projects may aim to:
- Raise the epistemic ceiling (deepen insight for experts) or floor (help broader populations find clarity)
- Support mediation, negotiation, and collective action
- Fill the strategic gap in beneficial AI tools that empower human reasoning
- Address urgent global information and communication challenges

You help participants through roadmapping, prototyping, and evaluation phases leading to a 12-week demo day.`,
      },
      {
        role: "system",
        content: `Write a warm, brief greeting (about one paragraph) that acknowledges their interests and context. Simply welcome them to the process of exploring fellowship project ideas - don't suggest any specific project ideas yet or go into detail about what they'll discover. Keep it conversational and encouraging. Do not ask them any follow up questions.

        User context: ${context}`,
      },
    ],
    onFinish: (result) => {
      greeting = result.text;
    },
  });

  // Stream the text using clack
  await stream.message(result.textStream);
  return greeting;
}

function selectAdjacentDimension(): number {
  // Keep moving to adjacent dimensions until we find one that's remaining
  let next_index = dim_index;
  let attempts = 0;
  do {
    next_index = (next_index + 1) % dimensions.length;
    attempts++;
    // Prevent infinite loop if all dimensions are used
    if (attempts >= dimensions.length) {
      // If we can't find any unfilled dimension, just return the current index
      // This shouldn't happen if the main loop is checking remaining_dimensions correctly
      return dim_index;
    }
  } while (data[dimensions[next_index] as keyof typeof data]);

  return next_index;
}

function selectOppositeDimension(): number {
  // Start from the opposite position
  let next_index =
    (dim_index + Math.floor(dimensions.length / 2)) % dimensions.length;
  let attempts = 0;

  // Keep searching until we find an unfilled dimension
  while (
    data[dimensions[next_index] as keyof typeof data] &&
    attempts < dimensions.length
  ) {
    next_index = (next_index + 1) % dimensions.length;
    attempts++;
  }

  // If we exhausted all attempts, return current index as fallback
  if (attempts >= dimensions.length) {
    return dim_index;
  }

  return next_index;
}

async function pickFirstDimension(context: string): Promise<number> {
  const { text: output } = await generateText({
    model: openrouter("openai/gpt-4o-mini"),
    messages: [
      {
        role: "system",
        content: `You are analyzing user context to determine which project dimension they seem most interested in discussing first. 

Available dimensions: 
- HAIR_ON_FIRE_PROBLEM (urgent global info/communication problem)
- EPISTEMIC_GOAL (what reasoning/epistemic improvement goal)
- TARGET_USER (who will use/benefit from the project)
- TECHNICAL_SHAPE (what form the project takes - app, org, etc.)
- SIGNAL_GATHERING (how to find target users and test interest/demand)

User context: "${context}"

Based on their context, which dimension seems most relevant to start with? If no dimension clearly relates to their context, choose HAIR_ON_FIRE_PROBLEM as a good starting point. 

Return only the dimension name exactly as it appears in the list (e.g., "TARGET_USER", "EPISTEMIC_GOAL", etc.).`,
      },
    ],
  });

  const selectedDimension = output.trim().toUpperCase();
  const dimensionIndex = dimensions.findIndex(
    (dim) => dim === selectedDimension
  );

  if (dimensionIndex !== -1) {
    return dimensionIndex;
  }

  // Default to HAIR_ON_FIRE_PROBLEM if no match found
  return dimensions.findIndex((dim) => dim === "HAIR_ON_FIRE_PROBLEM");
}

async function askFishingQuestion(
  dimension: string,
  context: string,
  greeting: string,
  data: Data
) {
  // filter the non-empty dimensions
  // and create a string description of the data
  const non_empty_dimensions = Object.keys(data).filter(
    (key) => data[key as keyof Data] !== ""
  );
  let current_choices = ``;
  if (non_empty_dimensions.length > 0) {
    current_choices = `The user has already expressed preferences for the following project dimensions:\n${non_empty_dimensions
      .map((d) => `${d}\n======\n${data[d as keyof Data]}`)
      .join("\n\n")}`;
  }

  const dimensionMap = {
    HAIR_ON_FIRE_PROBLEM:
      "the urgent 'world on fire' problem related to global information and communication that your project addresses",
    EPISTEMIC_GOAL:
      "what epistemic or human reasoning improvement your project aims to achieve",
    TARGET_USER:
      "who will use or benefit from your project (the specific people you want to help)",
    TECHNICAL_SHAPE:
      "what form your project will take (app, organization, manifesto, RFC, device, curriculum, etc.)",
    SIGNAL_GATHERING:
      "how you plan to find your target users and gather initial signal about interest or demand for your project",
  };

  let question = "";
  const result = streamText({
    model: openrouter("openai/gpt-4o-mini"),
    messages: [
      {
        role: "system",
        content: `You are an assistant helping participants in the AI+Epistemics Fellowship discover concrete project ideas.

FELLOWSHIP CONTEXT: This fellowship supports designing AI tools that enhance human reasoning and decision-making, both individually and collectively. Projects may aim to:
- Raise the epistemic ceiling (deepen insight for experts) or floor (help broader populations find clarity)
- Support mediation, negotiation, and collective action
- Fill the strategic gap in beneficial AI tools that empower human reasoning
- Address urgent global information and communication challenges

The user initially mentioned: "${context}"

This represents their background interest - a starting point for exploration, not a constraint. Encourage creative thinking beyond their initial context.`,
      },
      {
        role: "assistant",
        content: greeting,
      },
      {
        role: "system",
        content: `${
          current_choices ? `\n\n${current_choices}\n\n` : ""
        }Ask the user an open-ended question that invites their thoughts on the following project dimension: ${
          dimensionMap[dimension as keyof typeof dimensionMap] || dimension
        }. 

Make the question specific to fellowship project planning and help them think concretely about this aspect of their potential project.`,
      },
    ],
    onFinish: (result) => {
      question = result.text;
    },
  });

  // Stream the question using clack
  await stream.message(result.textStream);

  const response = await text({
    message: "Your thoughts:",
  });

  return { question, response: response.toString() };
}

async function generateSearchTerm(
  dimension: string,
  context: string,
  userResponse: string,
  data: Data
): Promise<string> {
  const non_empty_dimensions = Object.keys(data).filter(
    (key) => data[key as keyof Data] !== ""
  );
  let current_choices = ``;
  if (non_empty_dimensions.length > 0) {
    current_choices = `Previous choices:\n${non_empty_dimensions
      .map((d) => `${d}: ${data[d as keyof Data]}`)
      .join("\n")}`;
  }

  const dimensionMap = {
    HAIR_ON_FIRE_PROBLEM:
      "urgent global information/communication problems to address",
    EPISTEMIC_GOAL:
      "what epistemic or reasoning improvement the project aims to achieve",
    TARGET_USER: "who will use or benefit from the project",
    TECHNICAL_SHAPE:
      "form the project will take (app, organization, tool, etc.)",
    SIGNAL_GATHERING:
      "methods to find users and test initial interest or demand",
  };

  const { text: searchTerm } = await generateText({
    model: openrouter("openai/gpt-4o-mini"),
    messages: [
      {
        role: "system",
        content: `You are generating a search term to find fellowship discussions that will inspire options for the user's current thoughts.

CRITICAL: Base the search term primarily on what the user just said about ${dimension}, not their initial background context.

User's current response about ${dimension}: "${userResponse}"

Generate a focused search term (2-6 words) that captures the key themes from their current response. The search should find supplementary information and examples that relate to what they just expressed, to inspire diverse options for this dimension.

Examples:
- If they mentioned "fun decision making" → search "collaborative decision enjoyment"
- If they mentioned "reducing bias" → search "bias recognition tools" 
- If they mentioned "crisis communication" → search "emergency information coordination"

Focus on the essence of what they just said, not their background interests.

Return only the search term, nothing else.`,
      },
    ],
  });

  return searchTerm.trim();
}

async function summarizeFellowshipResults(
  searchResults: SearchResponse,
  dimension: string,
  context: string,
  userResponse: string
): Promise<string> {
  if (
    !searchResults.ok ||
    (searchResults.slack_contexts.length === 0 &&
      searchResults.document_contexts.length === 0)
  ) {
    return "No relevant fellowship discussions found to inform options.";
  }

  // Prepare content for summarization
  let contentToSummarize = `Search Results for "${searchResults.query}":\n\n`;

  // Add Slack discussions
  if (searchResults.slack_contexts.length > 0) {
    contentToSummarize += "=== SLACK DISCUSSIONS ===\n";
    searchResults.slack_contexts.slice(0, 10).forEach((context, idx) => {
      contentToSummarize += `\n[${idx + 1}] Channel: #${
        context.original_match.metadata.channel_name
      }\n`;
      contentToSummarize += `User: ${context.original_match.metadata.user_name}\n`;
      contentToSummarize += `Content: ${context.original_match.content}\n`;

      // Add thread context if available
      if (context.thread_context && context.thread_context.length > 1) {
        contentToSummarize += `Thread context:\n`;
        context.thread_context.slice(0, 3).forEach((msg) => {
          contentToSummarize += `  - ${msg.text}\n`;
        });
      }
      contentToSummarize += "\n";
    });
  }

  // Add Document discussions
  if (searchResults.document_contexts.length > 0) {
    contentToSummarize += "\n=== DOCUMENT CONTENT ===\n";
    searchResults.document_contexts.slice(0, 10).forEach((context, idx) => {
      contentToSummarize += `\n[${idx + 1}] ${
        context.original_match.content
      }\n\n`;
    });
  }

  const { text: summary } = await generateText({
    model: openrouter("google/gemini-flash-1.5"),
    messages: [
      {
        role: "system",
        content: `You are summarizing fellowship discussions to inspire option generation for a project dimension.

CRITICAL INSTRUCTIONS:
1. Extract general themes, approaches, and patterns from the discussions - NOT specific project ideas
2. Focus on underlying principles, methodologies, and problem areas rather than concrete solutions
3. NEVER suggest or mention specific fellows' current project ideas or implementations
4. Identify gaps or unexplored conceptual areas that could spark new creative directions
5. Highlight general patterns that could be applied in novel ways

Your summary should provide broad inspiration for creative thinking while avoiding any specific project suggestions from current fellows.

Context: Fellowship participant working on ${dimension} - ${userResponse}

Provide a concise summary (2-3 paragraphs) focusing on general principles and conceptual themes that will inspire original thinking, not specific implementations.`,
      },
      {
        role: "user",
        content: contentToSummarize,
      },
    ],
  });

  return summary;
}

export async function presentOptions(
  dimension: string,
  context: string,
  greeting: string,
  question: string,
  response: string,
  previousOptions?: string[],
  previousExplanation?: string,
  fellowshipSummary?: string
) {
  const messages = [
    {
      role: "system" as const,
      content: `You are an assistant helping participants in the AI+Epistemics Fellowship discover concrete project ideas.

FELLOWSHIP CONTEXT: This fellowship supports designing AI tools that enhance human reasoning and decision-making, both individually and collectively. Projects may aim to:
- Raise the epistemic ceiling (deepen insight for experts) or floor (help broader populations find clarity)
- Support mediation, negotiation, and collective action
- Fill the strategic gap in beneficial AI tools that empower human reasoning
- Address urgent global information and communication challenges

The user initially mentioned: "${context}"

This represents their background interest - a starting point for exploration, not a constraint. Encourage creative thinking beyond their initial context.`,
    },
    {
      role: "assistant" as const,
      content: greeting,
    },
    {
      role: "system" as const,
      content: `The user was asked about their thoughts on the following project dimension: ${dimension}`,
    },
    {
      role: "assistant" as const,
      content: question,
    },
    {
      role: "user" as const,
      content: response,
    },
  ];

  // If we have previous options and explanation, add them to provide context
  if (previousOptions && previousExplanation) {
    messages.push({
      role: "system" as const,
      content: `The user was previously shown these options: ${previousOptions.join(
        ", "
      )} but they didn't like them because: ${previousExplanation}. Please generate different options that address their concerns.`,
    });
  } else {
    const dimensionGuidance = {
      HAIR_ON_FIRE_PROBLEM:
        "Generate 2-4 specific urgent information problems only. Focus on the problems themselves, not solutions. Examples: 'election misinformation spread', 'crisis coordination breakdowns', 'scientific consensus confusion'.",
      EPISTEMIC_GOAL:
        "Generate 2-4 specific epistemic or reasoning improvements only. Focus on cognitive/reasoning abilities, not complete solutions. Examples: 'better source evaluation skills', 'improved bias recognition', 'enhanced collective sensemaking'.",
      TARGET_USER:
        "Generate 2-4 specific user types or stakeholder groups only. Focus on concrete people who might benefit from AI+epistemic tools, not project ideas. Examples: 'journalists verifying sources', 'policy analysts evaluating evidence', 'students learning critical thinking'.",
      TECHNICAL_SHAPE:
        "Generate 2-4 specific technical formats only. Focus on delivery mechanisms, not complete ideas. Examples: 'browser extension', 'mobile app', 'Slack bot', 'curriculum framework', 'open-source library'.",
      SIGNAL_GATHERING:
        "Generate 2-4 specific approaches for finding users and testing demand only. Focus on user research and validation methods, not full projects. Examples: 'user interviews via professional networks', 'landing page tests in relevant communities', 'prototype demos at industry conferences', 'surveys through academic partnerships'.",
    };

    let systemContent =
      dimensionGuidance[dimension as keyof typeof dimensionGuidance] ||
      `Generate 2-4 concrete, specific options for the dimension ${dimension} that will help define a concrete fellowship project.`;

    // Add fellowship context if available (minimal influence)
    if (fellowshipSummary && fellowshipSummary.trim()) {
      systemContent += `\n\nBackground context (use sparingly for inspiration): ${fellowshipSummary}

CRITICAL: Prioritize creative, original thinking over this background context. Generate diverse options that may be completely unrelated to the context above.`;
    }

    messages.push({
      role: "system" as const,
      content: systemContent,
    });
  }

  const { object } = await generateObject({
    model: openrouter("openai/gpt-4o-mini"),
    messages,
    schema: z.object({
      options: z.array(z.string()),
    }),
  });

  // use clack to present the options
  const selected_option = await select({
    message: "Select the option that resonates most with you:",
    options: [
      ...object.options.map((option) => ({
        value: option,
        label: option,
      })),
      {
        value: "skip_dimension",
        label: "I don't want to talk about this yet",
      },
      {
        value: "different_options",
        label: "I don't like any of these options",
      },
    ],
  });

  // Handle the explicit dimension skip
  if (selected_option === "skip_dimension") {
    return {
      type: "change_dimension" as const,
      explanation: "User chose to skip this dimension",
    };
  }

  // Handle the request for different options
  if (selected_option === "different_options") {
    const explanation = await text({
      message: "What kind of options would you prefer to see instead?",
    });

    return {
      type: "change_options" as const,
      explanation: explanation.toString(),
      previousOptions: object.options,
    };
  }

  return {
    type: "selected" as const,
    selected_options: [selected_option], // Convert single selection to array for compatibility
    shownOptions: object.options,
  };
}

async function finalResult(context: string, greeting: string, data: Data) {
  // Rebuild the complete message history
  const messages = [
    {
      role: "system" as const,
      content: `You are an assistant helping participants in the AI+Epistemics Fellowship discover concrete project ideas.

FELLOWSHIP CONTEXT: This fellowship supports designing AI tools that enhance human reasoning and decision-making, both individually and collectively. Projects may aim to:
- Raise the epistemic ceiling (deepen insight for experts) or floor (help broader populations find clarity)
- Support mediation, negotiation, and collective action
- Fill the strategic gap in beneficial AI tools that empower human reasoning
- Address urgent global information and communication challenges

The user initially mentioned: "${context}"

This represents their background interest - a starting point for exploration, not a constraint. Generate diverse, creative project ideas that may go well beyond their initial context.`,
    },
    {
      role: "assistant" as const,
      content: greeting,
    },
  ];

  // Add all the dimension interactions to the message history
  for (const [dimension, value] of Object.entries(data)) {
    if (value) {
      messages.push({
        role: "system" as const,
        content: `The user has expressed preferences for ${dimension}: ${value}`,
      });
    }
  }

  // Generate concrete project ideas that match the user's criteria
  const finalSpinner = spinner();
  finalSpinner.start(
    "🚀 Generating your personalized fellowship project ideas..."
  );

  const { object } = await generateObject({
    model: openrouter("openai/gpt-4o-mini"),
    temperature: 0.8, // Higher creativity for diverse project ideas
    messages: [
      ...messages,
      {
        role: "system",
        content: `Based on the user's preferences across all project dimensions, generate 2-10 specific, concrete project ideas for the AI+Epistemics fellowship. Each project should:

1. Design AI tools that enhance human reasoning and decision-making
2. Either raise the epistemic ceiling (deepen expert insight) or floor (help broader populations find clarity)
3. Address urgent global information/communication challenges OR support mediation/collective action
4. Be technically feasible for a 12-week fellowship (roadmapping → prototyping → evaluation)
5. Include a clear path to test demand and connect with target users

For each project, provide:
- A clear project name
- A concise description (2-3 sentences max)
- How it enhances human reasoning/decision-making
- Why it fills a strategic gap in beneficial AI tools`,
      },
    ],
    schema: z.object({
      projects: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          reasoning_enhancement: z.string(),
          strategic_gap: z.string(),
        })
      ),
    }),
  });

  finalSpinner.stop("✅ Project ideas ready!");

  // Present the final project options to the user
  const selected_projects = await multiselect({
    message:
      "🎯 Here are your concrete fellowship project ideas! Select the ones you'd like to explore further:",
    options: object.projects.map((project) => ({
      value: project.name,
      label: `${project.name} - ${project.description}`,
    })),
  });

  if (!Array.isArray(selected_projects)) {
    throw new Error("Selected projects is not an array");
  }

  // Present detailed information about selected projects
  log.message("\n🚀 Excellent choices! Here are your selected project ideas:");
  selected_projects.forEach((projectName: string, index: number) => {
    const projectData = object.projects.find((p) => p.name === projectName);
    if (projectData) {
      log.message(`\n${index + 1}. ${projectData.name}`);
      log.message(`   ${projectData.description}`);
      log.message(
        `   🧠 Reasoning Enhancement: ${projectData.reasoning_enhancement}`
      );
      log.message(`   🎯 Strategic Gap: ${projectData.strategic_gap}`);
    }
  });

  log.message(
    "\n✨ Next steps: Take these concrete project ideas to your fellowship mentors and start prototyping!"
  );

  log.message(
    "\n💡 Pro tip: Start with the 'signal gathering' approach you identified to test real demand before building."
  );

  outro("Ready to tackle some world-on-fire problems! 🌍🔥");

  process.exit(0);
}

export {};

if (require.main === module) {
  main();
}
