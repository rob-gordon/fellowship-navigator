let dim_index = -1;
const data = {
  COLOR: "",
  SIZE: "",
  SOUND: "",
};
const dimensions = Object.keys(data);

type UserResponse = "selected" | "new_options" | "different_dimension";

async function main() {
  getInitialContext();
  greetUserAndAlign();

  // Main control flow - all branching logic is explicit here
  let user_likes_dimension = true;
  while (true) {
    // BRANCH: Check if any dimensions remain
    const remaining_dimensions = dimensions.filter(
      (dimension) => !data[dimension as keyof typeof data]
    );
    console.log("[Remaining dimensions]", remaining_dimensions);

    if (remaining_dimensions.length === 0) {
      console.log("[No remaining dimensions]");
      break;
    }

    // BRANCH: Select next dimension based on user preference
    dim_index = user_likes_dimension
      ? selectAdjacentDimension()
      : selectOppositeDimension();
    const current_dimension = dimensions[dim_index];
    askFishingQuestion(current_dimension);

    // BRANCH: Handle user responses to options
    let option_selected = false;
    user_likes_dimension = true;
    while (user_likes_dimension && !option_selected) {
      presentOptions(current_dimension);
      const response = getUserResponse();

      // BRANCH: Handle different response types explicitly
      if (response === "selected") {
        data[current_dimension as keyof typeof data] = "choice!";
        option_selected = true;
        user_likes_dimension = true;
      } else if (response === "new_options") {
        option_selected = false;
        user_likes_dimension = true;
      } else if (response === "different_dimension") {
        option_selected = false;
        user_likes_dimension = false;
      }
    }
  }
  finalResult();
}

function getInitialContext() {
  console.log("☺️: I like bright birds and morning songs.");
}

function greetUserAndAlign() {
  console.log(
    "🤖: Goal: narrow to a favorite bird via color → size → sound. Starting with COLOR based on your context."
  );
}

function selectAdjacentDimension(): number {
  console.log("[Selecting adjacent dimension]");
  // Keep moving to adjacent dimensions until we find one that's remaining
  let next_index = dim_index;
  let attempts = 0;
  do {
    next_index = (next_index + 1) % dimensions.length;
    attempts++;
    // Prevent infinite loop if all dimensions are used
    if (attempts >= dimensions.length) {
      console.log(
        "[Warning: All dimensions used, resetting to first available]"
      );
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

function askFishingQuestion(dimension: string) {
  switch (dimension) {
    case "COLOR":
      console.log("🤖: When you picture the bird’s color, what comes to mind?");
      console.log("☺️: Bright yellow or blue.");
      break;
    case "SIZE":
      console.log("🤖: What size feels right?");
      console.log("☺️: Small to medium.");
      break;
    case "SOUND":
      console.log("🤖: What sound do you prefer?");
      console.log("☺️: Clear, melodic whistles.");
      break;
  }
}

function presentOptions(dimension: string): void {
  switch (dimension) {
    case "COLOR":
      console.log(
        "🤖: Options: yellow · blue · red · earthy brown · black/white."
      );
      break;
    case "SIZE":
      console.log("🤖: Options: tiny · small · medium · large.");
      break;
    case "SOUND":
      console.log(
        "🤖: Options: melodic/clear · buzzy/warbling · caw/squawk · cooing · drumming."
      );
      break;
  }
}

function getUserResponse(): UserResponse {
  const random_choice = Math.random();
  if (random_choice < 0.333) {
    console.log("[User chooses]");
    console.log("[AI Saves]");
    return "selected";
  } else if (random_choice < 0.666) {
    console.log("[User responds in chat, kind of wants new options]");
    return "new_options";
  } else {
    console.log("[User responds in chat, doesn't like this dimension]");
    return "different_dimension";
  }
}

function finalResult() {
  console.log(
    "🤖: Matches: American Goldfinch, Eastern Bluebird, Indigo Bunting."
  );
}

export {};

if (require.main === module) {
  main();
}
