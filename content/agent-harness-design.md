## A small decision loop, with two ways to react

An agent harness connects input, context, model decisions and application actions. **MellowHarness** applies that pattern to fast, expressive feedback: application rules can react immediately, while a System One Model such as Jev chooses among actions the application offers. Both paths leave a trace in the same event log.

This is useful for AI hardware and applications where a reaction matters more than a paragraph: a companion acknowledges a tap, notices a coding agent needs attention, or changes its mood after a difficult task. The model contributes contextual judgment; application code defines the possible effects.

<figure><img src="/assets/responsive-harness.png" width="2880" height="1800" alt="Context assembly feeds a central agent loop. Agent-triggered and code-triggered outcomes both return to a shared event log." loading="lazy"><figcaption>The harness loop and its two feedback paths. Read the current contracts below; the diagram is an architectural overview.</figcaption></figure>

## What goes into an iteration?

The application supplies three ingredients:

- **Steering:** authored instructions, character or personality, and guidance for reading events.
- **Action roster:** eligible choices and descriptions of when each choice fits. The roster can change with the current log.
- **Recent history:** relevant input, earlier decisions and already-executed effects, followed by the current event.

The runtime assembles a plain-text prompt from steering and the selected history. Each output contributes a named choice question. Those questions travel together in a decision request; a returned key belongs to its corresponding output. The application validates that the selected value was actually offered before executing it.

Context management is deliberately compact. The model does not receive an unlimited transcript or an unrestricted tool catalogue. Input adapters turn events into useful lines, and application logic determines which events deserve a decision pass. An unknown event can still be logged without waking the model.

## Rules and decisions share the same history

The first path is **code-driven feedback**. A rule can acknowledge a tap or update a work indicator as soon as the event arrives. That effect is recorded before the model sees the event, so the prompt can explain what has already happened.

The second path is **model-guided choice**. The runtime prepares the allowed choices, asks the brain and applies a valid answer. It records the decision and resulting effect. A late or failed pass can be dropped; an application does not have to wait indefinitely for expressive feedback.

This split makes responsiveness an architectural property. Immediate acknowledgment need not wait for inference. The later decision can be context-sensitive without controlling every device operation. See the [historical Jev timing sample](/learn/jev-decision-latency/) for the measurement boundary.

## What the shared event log looks like

The harness appends JSONL records with a sequence number, a Unix-millisecond timestamp, a source and a kind. Optional `line` and `data` fields provide readable context and structured details. Its own `did`, `pass` and `ended` records describe effects, decisions and completed actions.

This **synthetic example** illustrates the public record shape. Application-defined events and payloads are illustrative; it is not a captured user session.

```jsonl
{"seq":41,"at":1791590400000,"source":"agent","kind":"tool_failed","line":"A test failed.","data":{"tool":"test"}}
{"seq":42,"at":1791590400001,"source":"self","kind":"did","data":{"for":41,"by":"rule","action":"show_working","message":"The work indicator is active.","ok":true}}
{"seq":43,"at":1791590400240,"source":"self","kind":"pass","data":{"for":41,"brain":"jev:jev-latest","answers":{"mood":{"choice":"determined","p":{"determined":1}}},"dropped":null,"ms":239}}
{"seq":44,"at":1791590400241,"source":"self","kind":"did","data":{"for":41,"by":"brain","action":"mood","from":"calm","to":"determined","message":"The mood changed to determined.","ok":true}}
```

`seq` identifies append order; `data.for` connects an effect or pass to the event it concerns. The log writer keeps timestamps nondecreasing. This does not establish a globally synchronized order across separate devices or distributed clocks.

The log is the harness’s durable source of context and derived state. It is not a promise of permanent memory: retention and prompt history are bounded, and applications can have their own device or session state. Do not publish private prompts or conversations when sharing an example log.

## From bounded decisions to character

Buddygotchi adds three layers to this general runtime:

| Layer | Responsibility | Current implementation |
|---|---|---|
| Personality | A persistent character tendency and authored steering | Authored personality is supplied to prompt assembly. Nightly auto-dream learning and learned long-term personality remain work in progress. |
| Mood | The character’s emotional direction | Jev selects from eligible transitions in the character’s connected mood graph, with guidance for each transition. |
| State | What is happening now | Coding-task and application events determine operational state, such as working or needing attention. The character renders the combination of mood and state. |

These layers have different jobs. A working character can look determined, grumpy or cheerful. State is not simply generated from mood. The mood graph constrains what transitions are offered; the model chooses within that context rather than inventing arbitrary mood names.

The current character system uses authored animations and cues. Jev selects a fitting response; it does not write unrestricted dialogue or generate a new animation on every pass. The bounded vocabulary still permits many context-dependent sequences of behavior.

## Where the runtime and model run

MellowHarness currently provides **JevBrain** and **ScriptedBrain** behind a brain contract. Jev uses a hosted decision API. ScriptedBrain lets builders exercise the same runtime without a model key. Other providers require an adapter; a compatible interface is not proof of a tested integration.

In the current Buddygotchi build, a Mac host runs the application and harness. An ESP32 display receives character actions and sends device events. The model is not running on the ESP32. The architecture can inform other hardware projects, but the current supported build is documented separately.

## Try the architecture

Start with the [scripted-loop quickstart](/learn/mellowharness-quickstart/). Then read the [System One decision-model guide](/learn/system-one-models/), connect [coding-agent events](/learn/coding-agent-companion/), or follow the [public Pixel/CYD build](/learn/buddygotchi-build/).

The [October 7 technical sharing](/learn/mellowharness/) is preserved with its original Substack canonical. This guide is the maintained architectural explanation, based on the source revision linked below.
