#!/usr/bin/env node

import {
  intro,
  text,
  stream,
  select,
  multiselect,
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
import { getKey } from "./key.js";

// Load environment variables
dotenv.config({
  quiet: true,
});

// Set up OpenRouter with fallback API key
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || getKey();
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
  intro("🎯 Welcome to the AI+Epistemics Fellowship Project Picker!");

  const contextFile = process.argv[2];
  const context = contextFile
    ? await loadContextFromFile(contextFile)
    : // : await getInitialContext();
      "";

  if (!contextFile) {
    log.info(
      "💡 Tip: You can provide initial context by passing a file (npx github:rob-gordon/fellowship-navigator context.txt)"
    );
  }
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

      // Summarize results for context with timing (silent)
      fellowshipSummary = await summarizeFellowshipResults(
        fellowshipResults,
        current_dimension,
        context,
        fishingResponse.response
      );
    } catch (error) {
      // Silent error handling - just continue without fellowship context
      fellowshipSummary = "";
    } finally {
      s.stop();
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
        const selections = options.selected_options.join(", ");
        const dataValue = options.comment 
          ? `${selections} (Note: ${options.comment})`
          : selections;
        data[current_dimension as keyof typeof data] = dataValue;
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
  const context = await text({
    message:
      "What interests you most about using AI to improve human reasoning and tackle urgent global information problems?",
  });
  return context.toString();
}

async function greetUserAndAlign(context: string) {
  // Skip the verbose greeting - just return a brief acknowledgment for internal use
  return context 
    ? `Got it - you're interested in ${context}. Let's explore some project dimensions.`
    : "Let's explore some project dimensions for your fellowship.";
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
        }Ask a concise, direct question (1-2 sentences max) about: ${
          dimensionMap[dimension as keyof typeof dimensionMap] || dimension
        }. 

Be specific and focused - avoid lengthy explanations or multiple sub-questions. Don't assume they have a project yet - you're exploring this dimension to help them discover possibilities.`,
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
        content: `You are generating a search term to find fellowship discussions that will help create diverse options for the user's project dimension.

CONTEXT: We're working on the ${dimension} dimension (${
          dimensionMap[dimension as keyof typeof dimensionMap] || dimension
        }). The search results will be used to generate an array of specific options within this dimension that align with the user's needs and previous choices.

${
  current_choices
    ? `User's previous dimensional choices:\n${current_choices}\n\n`
    : ""
}User's current response about ${dimension}: "${userResponse}"

Generate a focused search term (2-6 words) that will find fellowship discussions relevant to both:
1. The user's specific interests/needs expressed in their response
2. The type of options we need to generate for the ${dimension} dimension

The search should discover conversations that contain examples, approaches, or perspectives that could inspire diverse options within this dimension, considering their existing project direction.

Examples:
- If working on TARGET_USER and they mentioned "researchers" → search "academic collaboration tools"
- If working on TECHNICAL_SHAPE and they mentioned "mobile" → search "mobile epistemics applications"
- If working on EPISTEMIC_GOAL and they mentioned "bias reduction" → search "bias recognition methods"

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
  const selected_options = await multiselect({
    message: "Select all options that resonate with you (you can explore multiple directions):",
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
  if (
    Array.isArray(selected_options) &&
    selected_options.includes("skip_dimension")
  ) {
    return {
      type: "change_dimension" as const,
      explanation: "User chose to skip this dimension",
    };
  }

  // Handle the request for different options
  if (
    Array.isArray(selected_options) &&
    selected_options.includes("different_options")
  ) {
    const explanation = await text({
      message: "What kind of options would you prefer to see instead?",
    });

    return {
      type: "change_options" as const,
      explanation: explanation.toString(),
      previousOptions: object.options,
    };
  }

  if (!Array.isArray(selected_options)) {
    throw new Error("Selected options is not an array");
  }

  // Add optional comment capability for nuance
  let comment = "";
  if (selected_options.length > 0) {
    const addComment = await text({
      message: "💭 Add any nuances or clarifications about your selections (optional):",
      placeholder: "e.g., 'Option 1 is definitely key, but not where I see main impact...'",
      defaultValue: "",
    });
    
    if (addComment && addComment.toString().trim()) {
      comment = addComment.toString().trim();
    }
  }

  return {
    type: "selected" as const,
    selected_options: selected_options,
    comment: comment,
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

This represents their background interest - a starting point for exploration, not a constraint.`,
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

  // STEP 1: Generate and stream recap of their answers
  let recap = "";
  const recapResult = streamText({
    model: openrouter("openai/gpt-4o-mini"),
    messages: [
      ...messages,
      {
        role: "system",
        content: `Provide a warm recap of the user's exploration through the project dimensions. Summarize their choices in a conversational way that shows you understand their vision. Don't just repeat their exact words - synthesize and reflect back what you're hearing about their project direction. Keep it encouraging and insightful (2-3 paragraphs).`,
      },
    ],
    onFinish: (result) => {
      recap = result.text;
    },
  });

  await stream.message(recapResult.textStream);

  // Add recap to message history
  messages.push({
    role: "assistant" as const,
    content: recap,
  });

  // STEP 2: Generate and stream working hypothesis
  let hypothesis = "";
  const hypothesisResult = streamText({
    model: openrouter("openai/gpt-4o-mini"),
    messages: [
      ...messages,
      {
        role: "system",
        content: `Based on all their dimensional choices, formulate their "Working Hypothesis" in the format: "Building X for Y will have Z effect on A" where:
- X = the technical approach/solution
- Y = the target users
- Z = the epistemic/reasoning improvement effect
- A = the broader problem or context

Present this as: "🎯 **Your Working Hypothesis:** [hypothesis statement]"

Then add 1-2 sentences explaining what assumption they're operating under and why this hypothesis is worth testing.`,
      },
    ],
    onFinish: (result) => {
      hypothesis = result.text;
    },
  });

  await stream.message(hypothesisResult.textStream);

  // Add hypothesis to message history
  messages.push({
    role: "assistant" as const,
    content: hypothesis,
  });

  // STEP 3: Generate concrete examples based on their working hypothesis
  const finalSpinner = spinner();
  finalSpinner.start(
    "🚀 Generating concrete examples from your working hypothesis..."
  );

  const { object } = await generateObject({
    model: openrouter("openai/gpt-4o-mini"),
    temperature: 0.8,
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

  // Present the concrete examples (not as multiselect, just as information)
  // Present projects concisely first
  const projectChoices = object.projects.map((project, index) => ({
    value: project.name,
    label: `${project.name}`,
    hint: project.description.split('.')[0] + '.' // First sentence only
  }));

  const selectedProjects = await multiselect({
    message: "🎯 Here are your personalized fellowship project ideas! Select any you'd like to explore further:",
    options: [
      ...projectChoices,
      {
        value: "show_all_details",
        label: "📋 Show full details for all projects",
        hint: "See reasoning enhancement & strategic gap for each"
      }
    ],
  });

  if (!Array.isArray(selectedProjects)) {
    throw new Error("Selected projects is not an array");
  }

  // Show details for selected projects or all if requested
  if (selectedProjects.includes("show_all_details") || selectedProjects.length === 0) {
    log.message("\n📋 **Full project details:**\n");
    object.projects.forEach((project) => {
      log.success(`${project.name}`);
      log.message(`${project.description}\n`);
      log.message(`🧠 Reasoning Enhancement: ${project.reasoning_enhancement}\n`);
      log.message(`🎯 Strategic Gap: ${project.strategic_gap}\n`);
    });
  } else {
    // Show details only for selected projects
    log.message("\n🎯 **Your selected project details:**\n");
    selectedProjects.forEach((projectName: string) => {
      const project = object.projects.find(p => p.name === projectName);
      if (project) {
        log.success(`${project.name}`);
        log.message(`${project.description}\n`);
        log.message(`🧠 Reasoning Enhancement: ${project.reasoning_enhancement}\n`);
        log.message(`🎯 Strategic Gap: ${project.strategic_gap}\n`);
      }
    });
  }

  log.message(
    "✨ **Next steps:** Start prototyping and testing your ideas with potential users!"
  );

  outro("Ready to build something impactful! 🌍🔬");

  process.exit(0);
}

export {};

if (require.main === module) {
  main();
}
