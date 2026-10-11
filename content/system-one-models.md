## Decisions instead of paragraphs

**System One Models** are designed for fast, structured judgments such as selecting an action or scoring an input. For an expressive application, the useful output might be `determined`, `calm` or `no_change`, rather than a generated explanation.

MellowHarness uses this pattern with **Jev**: the application supplies context and a bounded choice roster; the model picks a value; application code validates and executes the corresponding effect. Immediate rules can run separately before the decision completes.

The name describes a decision-oriented design, not a universal latency guarantee or a claim that a model has human emotions. Type constraints help control the output vocabulary. They do not make every judgment correct.

## Jev in the current harness

Typesafe’s System One API accepts a state and named typed questions. The current MellowHarness `JevBrain` uses `jev-latest` and choice questions, with descriptions of when each option fits. The adapter checks that returned choices were offered.

In Buddygotchi, mood choices come from the character’s graph. Available neighboring moods and transition guidance depend on current context. The model selects among them; the renderer uses authored animation and sound assets for the resulting mood and task state.

One call can contain several named questions about the same state. Buddygotchi uses this for lasting mood, momentary expression, animation and available voice selectors. The answers are independent; a new answer is not input to the next question inside the call. Follow the [Jev multiple-decision walkthrough](/learn/jev-multiple-decisions/) for the actual question roster and an illustrative JSON request.

See [Typesafe’s API contract](https://docs.typesafe.ai/api) and [its introduction to Jev and System One Models](https://typesafe.ai/blog/introducing-system-one-models-and-jev). Provider speed claims and our application measurements are different evidence; the [105-pass Jev sample](/learn/jev-decision-latency/) documents what we actually recorded.

## OpenAI Decisions API and Laya

Two relevant alternatives are worth separating from implemented integrations.

| Interface / project | Decision shape | Execution | MellowHarness status |
|---|---|---|---|
| Jev / Typesafe System One API | Typed choice and score questions | Hosted | JevBrain is implemented; the harness currently uses choices |
| OpenAI Decisions API | Predicate, bounded choice and ordered score; probabilities | Hosted; current public-beta docs name `gpt-6-luna` | No adapter in the reviewed release |
| Laya | Non-autoregressive decision heads for choice, score and yes/no | Open-source checkpoints and server; authors describe a Jev-compatible endpoint | Candidate for evaluation; no integration or benchmark here |

OpenAI documents a dedicated Decisions endpoint with typed questions. Questions in a batch share input; dependent decisions need an appropriate separate call or application step. Its contract differs from Typesafe’s, so supporting it requires explicit request/response mapping and validation. [OpenAI Decisions API](https://developers.openai.com/api/docs/guides/decisions)

Laya is an Apache 2.0 project using encoder-based decision heads. Its repository describes local serving and compatible request handling. Checkpoint quality, fine-tuning and calibration matter: running locally does not establish suitability for a companion’s mood decisions, and it does not imply the model fits an ESP32. [Laya source and model notes](https://github.com/NandhaKishorM/laya)

## Choose a model by the application contract

Start by defining the action space and the consequence of a wrong decision. Ask:

- Can the model return the required typed choice without adding unsupported values?
- Does it make suitable judgments on our real events, including ambiguous or adversarial input?
- What are its complete latency distribution, failure behavior and deadline handling?
- Does inference require a network, local compute or a specific provider?
- Are licensing, data handling and operating costs appropriate for this application?

Evaluate these on the same input set and rubric. Do not compare a provider’s short-input marketing number with a different application’s complete interaction time. A probability is not automatically a calibrated confidence guarantee for our use case.

## Test the harness before choosing a provider

Use [ScriptedBrain in the quickstart](/learn/mellowharness-quickstart/) to test event flow and effects first. It isolates application behavior from model availability. Then add a model adapter behind the brain contract and verify its choices, errors and deadlines.

For the broader loop, see [agent harness design](/learn/agent-harness-design/). For a worked application, see [the coding-agent companion architecture](/learn/coding-agent-companion/). The table above records integration status as checked on 10 October 2026; it does not announce additional provider support.
