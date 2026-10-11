## Can Jev answer several questions in one call?

**Yes. Jev accepts several named questions against one shared state.** MellowHarness uses that interface to ask for a lasting mood and a momentary reaction in the same decision pass. Buddygotchi can also request animation, hold duration and voice selectors. Application code turns the answers into a visible response.

The questions share context, but they are evaluated independently. A question cannot read another question’s newly selected answer within that call. This is useful for several judgments about the same event; a decision that depends on an earlier result needs an application step or another call. See [Typesafe’s parallel-question cookbook](https://docs.typesafe.ai/cookbooks/parallel_questions).

## What Buddygotchi asks

The reviewed Buddygotchi implementation combines these choices when the character has voice assets:

| Question key | What it controls | Where the choice comes from |
|---|---|---|
| `mood` | Lasting emotional direction | Stay in the current mood or follow an allowed graph edge |
| `react.mood` | Expression for this moment | Available character expressions, or no reaction |
| `react.animation` | A task-finish animation | Success, failure, reply or none |
| `react.loops` | How long the expression holds | Authored duration choices |
| `say.feeling` | A vocal feeling | Authored feeling categories, or silence |
| `say.about` | What the sound refers to | Authored event topics, or none |
| `say.kind` | Size of the vocal response | A sound, word or short authored phrase category |

That is **seven questions in one pass when voice choices are available**. A pack without recorded takes omits the voice questions. The working, idle or needs-you **operational state comes from coding-agent events**, separately from these model choices.

The lasting mood and the reaction expression have different jobs. A character can stay grumpy while briefly showing surprise. Voice selectors choose among existing recordings; this path does not generate unrestricted speech. The [companion architecture](/learn/coding-agent-companion/) explains how personality, mood and task state fit together.

## A small request you can inspect

Here is an illustrative request body for `POST https://api.typesafe.ai/v1/systemone`. It reduces the real roster to three questions to make the pattern easy to read. The mood options below are examples; an application should obtain its actual options from the character’s current graph.

```json
{
  "model": "jev-latest",
  "state": {
    "personality": "Playful, persistent, easily pleased by progress.",
    "current_mood": "curious",
    "operational_state": "working",
    "event": "Tests failed once. The coding agent found the cause and is retrying."
  },
  "questions": {
    "mood": {
      "type": "choice",
      "instructions": "Choose the lasting mood after this event.",
      "criteria": {
        "curious": "Stay curious while investigating.",
        "determined": "Become focused on making the retry work."
      }
    },
    "react.mood": {
      "type": "choice",
      "instructions": "Choose a brief expression for the current event.",
      "criteria": {
        "none": "This event does not need a visible reaction.",
        "determined": "A focused expression fits the retry.",
        "grumpy": "A brief frustrated expression fits the failed test."
      }
    },
    "say.feeling": {
      "type": "choice",
      "instructions": "Choose a vocal feeling about the current event.",
      "criteria": {
        "none": "Stay silent.",
        "upset": "The failed test warrants a frustrated sound."
      }
    }
  }
}
```

The API returns answers under those same question keys, with each selected choice and its probability distribution. This example is not a recorded model result. Consult the [Typesafe API contract](https://docs.typesafe.ai/api) for authentication and the complete response format.

## How the harness keeps the result usable

MellowHarness prepares context from authored steering, recent events and the action roster, then sends the named questions together. The adapter checks returned values against the offered choices. Buddygotchi’s reaction handler applies its own availability rules and maps accepted selectors to character assets.

If the reaction choice is `none`, application code skips the reaction even if other selectors returned values. If no suitable recording exists, the face can play in silence. A batched answer does not override an attention signal or approve a coding agent’s permission request.

When a later decision truly requires the newly chosen mood, apply that mood first and ask again with the updated context. Sharing state can reduce repeated requests, but it does not establish a guarantee that independently selected answers form a consistent combination. Validate the combination your application intends to execute.

## What this says about response speed

Batching lets several choices use one request instead of a chain of calls over repeated context. The actual benefit depends on the roster, context, provider and application. Our [historical 105-pass timing sample](/learn/jev-decision-latency/) reports a 227 ms median decision pass; it is not a controlled comparison of batched versus separate questions or an end-to-end hardware benchmark.

Start with [the scripted MellowHarness quickstart](/learn/mellowharness-quickstart/) to inspect the loop without a model key. Then connect Jev and measure both decision suitability and the complete interaction path on your own events. For the surrounding architecture, read [agent harness design](/learn/agent-harness-design/).
