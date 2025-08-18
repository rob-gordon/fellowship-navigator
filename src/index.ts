import { createAgent, createSimulation } from "simullm";

interface GlobalState {
  phase: "init" | "end";
  context: string;
}

type Action = {
  type: "START";
};

const agent = createAgent<GlobalState, Action>(
  "facilitator",
  async (action, { updateGlobalState }) => {
    switch (action.type) {
      case "START": {
        console.log(
          "🤖 Here's our goal. Do you have any context to get us started?"
        );
        // Get the context from the user
        const context = await getUserInput();
        console.log(`☺️: ${context}`);
        updateGlobalState((s) => ({ ...s, context }));
        updateGlobalState((s) => ({ ...s, phase: "end" }));
      }
    }

    return;
  }
);

const simulation = createSimulation<GlobalState, Action>({
  agents: [agent],
  initialGlobalState: { phase: "init", context: "" },
  shouldExit: ({ globalState }) => globalState.phase === "end",
});

simulation.dispatch({ type: "START" });
await simulation.exit();

async function getUserInput() {
  // fake user input
  return "I have some context";
}
