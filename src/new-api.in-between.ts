let dim_index = -1;
const data = {
  COLOR: "",
  SIZE: "",
  SOUND: "",
};
const dimensions = Object.keys(data);
let user_likes_dimension = true;
let option_selected = false;

getInitialContext();
greetUserAndAlign();
user_likes_dimension = true;
while (selectDimension()) {
  askFishingQuestion();

  // initialize
  user_likes_dimension = true;
  option_selected = false;
  while (user_likes_dimension && !option_selected) {
    // this means previous options just have to be set in the loop somewhere
    // it's weird
    presentOptions();
  }
}
finalResult();

function getInitialContext() {
  console.log("☺️: I like bright birds and morning songs.");
}

function greetUserAndAlign() {
  console.log(
    "🤖: Goal: narrow to a favorite bird via color → size → sound. Starting with COLOR based on your context."
  );
}

function selectDimension() {
  // get remaining dimensions
  const remaining_dimensions = dimensions.filter(
    (dimension) => !data[dimension as keyof typeof data]
  );
  console.log("[Remaining dimensions]", remaining_dimensions);

  if (remaining_dimensions.length === 0) {
    console.log("[No remaining dimensions]");
    return false;
  }

  // global flag which changes behavior of selection
  // could have easily been a different function
  if (user_likes_dimension) {
    console.log("[Selecting adjacent dimension]");
    // Keep moving to adjacent dimensions until we find one that's remaining
    let attempts = 0;
    do {
      dim_index = (dim_index + 1) % dimensions.length;
      attempts++;
      // Prevent infinite loop if all dimensions are used
      if (attempts >= dimensions.length) {
        console.log(
          "[Warning: All dimensions used, resetting to first available]"
        );
        break;
      }
    } while (data[dimensions[dim_index] as keyof typeof data]);
  } else {
    // select the dimension on the opposite side of the circle of dimensions
    console.log("[Selecting opposite dimension]");
    dim_index =
      (dim_index + Math.floor(dimensions.length / 2)) % dimensions.length;
  }
  return true;
}

function askFishingQuestion() {
  const dimension = dimensions[dim_index];
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

function presentOptions() {
  const dimension = dimensions[dim_index];
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
  let random_choice = Math.random();
  if (random_choice < 0.333) {
    console.log("[User chooses]");
    console.log("[AI Saves]");
    option_selected = true;
    user_likes_dimension = true;
    data[dimension as keyof typeof data] = "choice!";
    return true;
  } else if (random_choice < 0.666) {
    console.log("[User responds in chat, kind of wants new options]");
    option_selected = false;
    user_likes_dimension = true;
    return false;
  } else {
    console.log("[User responds in chat, doesn't like this dimension]");
    option_selected = false;
    user_likes_dimension = false;
    return false;
  }
  // branching option here where user may respond in chat instead of choosing
}

function finalResult() {
  console.log(
    "🤖: Matches: American Goldfinch, Eastern Bluebird, Indigo Bunting."
  );
}

// make sure all 3 interactions can be simulated
// add callLLM and begin writing prompts
