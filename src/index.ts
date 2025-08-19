import { intro, text, stream, multiselect, outro, log } from "@clack/prompts";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateObject, streamText } from "ai";
import { z } from "zod";

let dim_index = -1;
const data = {
  COLOR: "",
  SIZE: "",
  SOUND: "",
};
type Data = typeof data;
const dimensions = Object.keys(data);

type UserResponse = "selected" | "new_options" | "different_dimension";

async function main() {
  const context = await getInitialContext();
  const greeting = await greetUserAndAlign(context);

  // Main control flow - all branching logic is explicit here
  let user_likes_dimension = true;
  while (true) {
    // BRANCH: Check if any dimensions remain
    const remaining_dimensions = dimensions.filter(
      (dimension) => !data[dimension as keyof typeof data]
    );

    if (remaining_dimensions.length === 0) {
      break;
    }

    // BRANCH: Select next dimension based on user preference
    dim_index = user_likes_dimension
      ? selectAdjacentDimension()
      : selectOppositeDimension();
    const current_dimension = dimensions[dim_index];

    // this gets the users feelings on a topic
    const fishingResponse = await askFishingQuestion(
      current_dimension,
      context,
      greeting,
      data
    );

    // BRANCH: Handle user responses to options
    let option_selected = false;
    user_likes_dimension = true;
    while (user_likes_dimension && !option_selected) {
      const options = await presentOptions(
        current_dimension,
        context,
        greeting,
        fishingResponse.question,
        fishingResponse.response
      );

      // option_selected is always true for now
      data[current_dimension as keyof typeof data] = options.join(", ");

      option_selected = true;

      // const response = getUserResponse();

      // // BRANCH: Handle different response types explicitly
      // if (response === "selected") {
      //   data[current_dimension as keyof typeof data] = "choice!";
      //   option_selected = true;
      //   user_likes_dimension = true;
      // } else if (response === "new_options") {
      //   option_selected = false;
      //   user_likes_dimension = true;
      // } else if (response === "different_dimension") {
      //   option_selected = false;
      //   user_likes_dimension = false;
      // }
    }
  }
  await finalResult(context, greeting, data);
}

async function getInitialContext() {
  intro(`Welcome to My Favorite Bird finder!`);
  const context = await text({
    message: "Do you have any thoughts about birds?",
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
        content:
          "You are an assistant that helps users discover their favorite bird by finding out what they like about birds.",
      },
      {
        role: "system",
        content: `Greet the user and acknowledge their context while aligning them with the goal. However, do not ask them any follow up questions.

        User context: ${context}`,
      },
    ],
    onFinish: (result) => {
      greeting = result.text;
    },
  });

  // Stream the text chunks
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
      break;
    }
  } while (data[dimensions[next_index] as keyof typeof data]);

  return next_index;
}

function selectOppositeDimension(): number {
  console.log("[Selecting opposite dimension]");
  const next_index =
    (dim_index + Math.floor(dimensions.length / 2)) % dimensions.length;
  return next_index;
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
    current_choices = `The user has already expressed a preference for the following\n${non_empty_dimensions
      .map((d) => `${d}\n======\n${data[d as keyof Data]}`)
      .join("\n\n")}`;
  }

  let question = "";
  const iterator = streamText({
    model: openrouter("openai/gpt-4o-mini"),
    messages: [
      {
        role: "system",
        content: `You are an assistant that helps users discover their favorite bird by finding out what they like about birds. The user has given you the following context: ${context}`,
      },
      {
        role: "assistant",
        content: greeting,
      },
      {
        role: "system",
        content: `${
          current_choices ? `\n\n${current_choices}\n\n` : ""
        }Ask the user an open-ended question which invites their thoughts on the following dimension of birds: ${dimension}`,
      },
    ],
    onFinish: (result) => {
      question = result.text;
    },
  });

  await stream.message(iterator.textStream);

  const response = await text({
    message: "",
  });

  return { question, response: response.toString() };
}

export async function presentOptions(
  dimension: string,
  context: string,
  greeting: string,
  question: string,
  response: string
) {
  // Rebuild the current messages, using everything you need,
  // eventually (especially) if the user doesn't really want the same
  // choices as given previously

  const { object } = await generateObject({
    model: openrouter("openai/gpt-4o-mini"),
    messages: [
      {
        role: "system",
        content: `You are an assistant that helps users discover their favorite bird by finding out what they like about birds. The user has given you the following context: ${context}`,
      },
      {
        role: "assistant",
        content: greeting,
      },
      {
        role: "system",
        content: `Ask the user an open-ended question which invites their thoughts on the following dimension of birds: ${dimension}`,
      },
      {
        role: "assistant",
        content: question,
      },
      {
        role: "user",
        content: response,
      },
      {
        role: "system",
        content: `Generate 2-4 options for the dimension ${dimension}, that will help narrow down the user's favorite bird.`,
      },
    ],
    schema: z.object({
      options: z.array(z.string()),
    }),
  });

  // use clack to present the options
  const selected_options = await multiselect({
    message: "Select the options that you like",
    options: object.options.map((option) => ({
      value: option,
      label: option,
    })),
  });

  if (!Array.isArray(selected_options)) {
    throw new Error("Selected options is not an array");
  }

  return selected_options;
}

async function finalResult(context: string, greeting: string, data: Data) {
  // Rebuild the complete message history
  const messages = [
    {
      role: "system" as const,
      content: `You are an assistant that helps users discover their favorite bird by finding out what they like about birds. The user has given you the following context: ${context}`,
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

  // Generate bird options that match the user's criteria
  const { object } = await generateObject({
    model: openrouter("openai/gpt-4o-mini"),
    messages: [
      ...messages,
      {
        role: "system",
        content: `Based on all the user's preferences across all dimensions, generate 3-5 specific bird species that would be perfect matches. Each bird should align with multiple aspects of what the user has expressed they like about birds.`,
      },
    ],
    schema: z.object({
      birds: z.array(
        z.object({
          name: z.string(),
          reasoning: z.string(),
        })
      ),
    }),
  });

  // Present the final bird options to the user
  const selected_birds = await multiselect({
    message:
      "🎉 Here are your perfect bird matches! Select the ones you'd like to learn more about:",
    options: object.birds.map((bird) => ({
      value: bird.name,
      label: `${bird.name} - ${bird.reasoning}`,
    })),
  });

  if (!Array.isArray(selected_birds)) {
    throw new Error("Selected birds is not an array");
  }

  // Congratulate the user and exit
  log.message("\n🎊 Excellent choices! Here's what you selected:");
  selected_birds.forEach((bird, index) => {
    const birdData = object.birds.find((b) => b.name === bird);
    log.message(`${index + 1}. ${bird} - ${birdData?.reasoning}`);
  });

  log.message(
    "\n🌟 Thanks for playing! You've discovered some amazing birds that match your preferences."
  );
  outro("Happy bird watching! 🦅");

  process.exit(0);
}

export {};

if (require.main === module) {
  main();
}
