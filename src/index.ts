import { intro, text, stream, multiselect, outro, log } from "@clack/prompts";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateObject, generateText, streamText } from "ai";
import { z } from "zod";

let dim_index = 0;
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
        previousExplanation
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
  response: string,
  previousOptions?: string[],
  previousExplanation?: string
) {
  // Rebuild the current messages, using everything you need,
  // eventually (especially) if the user doesn't really want the same
  // choices as given previously

  const messages = [
    {
      role: "system" as const,
      content: `You are an assistant that helps users discover their favorite bird by finding out what they like about birds. The user has given you the following context: ${context}`,
    },
    {
      role: "assistant" as const,
      content: greeting,
    },
    {
      role: "system" as const,
      content: `Ask the user an open-ended question which invites their thoughts on the following dimension of birds: ${dimension}`,
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
    messages.push({
      role: "system" as const,
      content: `Generate 2-4 options for the dimension ${dimension}, that will help narrow down the user's favorite bird.`,
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
    message: "Select the options that you like",
    options: [
      ...object.options.map((option) => ({
        value: option,
        label: option,
      })),
      {
        value: "other",
        label: "Other (please explain)",
      },
    ],
  });

  // if the user chooses other, give them a text input
  if (Array.isArray(selected_options) && selected_options.includes("other")) {
    const other_explanation = await text({
      message: "Please explain why you chose other",
    });

    // use a cerebras model to expose whether user wants to "CHANGE_OPTIONS" or "CHANGE_DIMENSION"
    const { text: output } = await generateText({
      model: openrouter("openai/gpt-oss-120b"),
      providerOptions: {
        openrouter: {
          only: "cerebras",
        },
      },
      messages: [
        {
          role: "system",
          content: `You are an assistant that helps users discover their favorite bird by finding out what they like about birds. The user has given you the following context: ${context}`,
        },
        {
          role: "system",
          content: `The user was provided the following options: ${object.options.join(
            ", "
          )} given the following dimension: ${dimension} – but instead of selecting one of them, they chose "other" and provided the following explanation: ${other_explanation.toString()}. Decide whether the user wants to change the options or change the dimension. Return the string "CHANGE_OPTIONS" or "CHANGE_DIMENSION" only.`,
        },
      ],
    });

    if (output.toLowerCase().includes("options")) {
      return {
        type: "change_options" as const,
        explanation: other_explanation.toString(),
        previousOptions: object.options,
      };
    } else if (output.toLowerCase().includes("change_dimension")) {
      return {
        type: "change_dimension" as const,
        explanation: other_explanation.toString(),
      };
    } else {
      console.error("Invalid output from cerebras model", output);
      return {
        type: "change_options" as const,
        explanation: other_explanation.toString(),
        previousOptions: object.options,
      };
    }
  }

  if (!Array.isArray(selected_options)) {
    throw new Error("Selected options is not an array");
  }

  return {
    type: "selected" as const,
    selected_options: selected_options,
    shownOptions: object.options,
  };
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
