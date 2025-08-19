It's really hard to work in two dimensions
Or to think in discreet message handlers
When I want to think in phases of a process / a flow

It's really not obvious where to store information
and where to handle behaviors

I'm having this theory where a good way to build this systems may be by writing fake conversations and then turning those into the expected state changes.

Writing prompts will be the hardest part of this I believe

Managing phase transitions should be the easy part

User (context): I like bright birds and morning songs.
AI (greet/goal): Goal: narrow to a favorite bird via color → size → sound. Starting with COLOR based on your context.
AI (fishing): When you picture the bird’s color, what comes to mind?
User: Bright yellow or blue.
AI (options): Options: yellow · blue · red · earthy brown · black/white.
User (choose): Yellow, and also blue.
AI (save): Saved COLOR = {yellow, blue}. Next: SIZE.
AI (fishing): What size feels right?
User: Small to medium.
AI (options): tiny · small · medium · large.
User (choose): Small, medium.
AI (save): Saved SIZE = {small, medium}. Next: SOUND.
AI (fishing): What sound do you prefer?
User: Clear, melodic whistles.
AI (options): melodic/clear · buzzy/warbling · caw/squawk · cooing · drumming.
User (choose): Melodic/clear.
AI (save → result): Saved SOUND = melodic/clear.
AI (matches): Matches: American Goldfinch, Eastern Bluebird, Indigo Bunting.

---

This is definitely an improvement

The parts I'm still unclear on –

How can I be always certain about when to put state globally, and then look at it from inside a function to control behavior?
Should different behaviors always be different functions?
I guess yeah, I'm not in love with the 'closing over global state' concept
because it hides the control flow
I would much rather be able to look at the code and immediately understand the control flow

GOAL: Be able to immediately look at code and understand control flow

- hoisted control flow
- functions become pure

Steps:

- 1 or more example chats
- build MAS control-flow from example chat (look for loops and branching)
- make sure functions are completely pure, do not rely on global state

---

Patterns:
Here are the patterns I'd watch for
when formalizing control flow visibility:

1. "Precondition Buried in Function" Anti-pattern

- What it looks like: Loop exit conditions checked
  inside the functions the loop calls
- Why it's bad: You can't see termination logic
  without reading function internals
- How to catch: Look for functions that return
  "should continue" or "has more" flags
- Fix: Hoist the precondition check to the top of the
  loop

2. "Essential Logic Hidden in Helper" Anti-pattern

- What it looks like: Core branching logic disguised
  as utility functions
- Why it's bad: Control flow decisions scattered
  across codebase
- How to catch: Functions with boolean returns that
  affect main flow
- Fix: Inline the logic or make the branching
  explicit at call site

3. General Detection Heuristics:

- Function signatures: If helpers return {success:
  boolean, data: T} or similar - red flag
- Control coupling: If main flow depends on return
  codes from helpers
- Nested conditions: If you need to read function
  bodies to understand when loops exit
- State mutations: If functions change global state
  that affects control flow

4. Formalization Questions to Ask:

- "Can I understand the complete control flow by
  reading just the main function?"
- "Are all exit conditions visible at the decision
  point?"
- "Do I need to trace into helper functions to
  understand what happens next?"
- "Are the branching decisions explicit in the
  calling code?"

The golden rule: All branching logic should be
visible at the level where the decision matters, not
buried in called functions.

---

The tricky part is amassing messages in the way we want. It's crazy because sometime we want to finesse the messages for the particular case. For instance, we might just want to drop out system messages to make it more natural. We also might want not the full memory.
