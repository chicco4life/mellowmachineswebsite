# MellowHarness for responsive AI hardware and applications

A [Mellow Machines Lab](https://github.com/Mellow-Machines-Lab) project. Co-authors: [Federico Li (@chicco4life)](https://github.com/chicco4life) and [0xfdsa](https://github.com/0xfdsa).

AI hardware needs reliable feedback and behavior that responds to context. A CI lamp should flash when a build fails, then decide whether the setback deserves a worried tone. A desk companion should acknowledge a tap immediately, then react in a way that fits its character.

**MellowHarness** is a host-side runtime for that pattern. It combines immediate application rules with a System One model such as **Jev**, which evaluates context and picks structured answers from options the application supplies. The harness assembles context, asks the model, routes decisions to outputs and records what happened. The application connects those outputs to its lights, sounds, motors or interface through its own device integration. [Output contract](https://github.com/Mellow-Machines-Lab/MellowHarness/blob/5eb594fe6fc824654c4430ee911b7e55dbf7c866/Sources/MellowHarness/Contracts.swift#L221-L235), [Jev’s model interface](https://docs.typesafe.ai/introduction).

The same loop can drive a physical gadget or an interactive application. The package’s Beacon example demonstrates a CI lamp; [Buddygotchi](https://github.com/Mellow-Machines-Lab/buddygotchi) is our coding companion, shown below. Each application supplies its own inputs, actions and expressive material.

## The harness in one diagram

![Context assembly, one runtime loop, application outputs and parallel event paths feeding a shared log](assets/responsive-harness.png)

Three inputs become the decision context: **prompt and steering**, an **action roster with allowed choices**, and **selected event history**. The application turns events into readable lines; the harness assembles those lines into HISTORY and NOW alongside the supplied prompt sections.

Each registered output contributes its questions to one logical brain pass and receives its own answers. Buddygotchi registers Mood and React. Beacon, the package’s CI-lamp example, registers Tone and Play. Other applications supply different outputs. [Context assembly](https://github.com/Mellow-Machines-Lab/MellowHarness/blob/5eb594fe6fc824654c4430ee911b7e55dbf7c866/Sources/MellowHarness/Harness.swift#L403-L445).

Jev is one implementation of the `Brain` interface. A scripted stand-in supports deterministic tests, and another model can implement the same contract. The Jev adapter rejects missing or unoffered answers; custom brains and outputs must define their own validation. This keeps the application’s action space explicit. [Brain contract](https://github.com/Mellow-Machines-Lab/MellowHarness/blob/5eb594fe6fc824654c4430ee911b7e55dbf7c866/Sources/MellowHarness/Brain.swift#L3-L22), [Jev request and validation](https://github.com/Mellow-Machines-Lab/MellowHarness/blob/5eb594fe6fc824654c4430ee911b7e55dbf7c866/Sources/MellowHarness/JevBrain.swift#L63-L97).

The model generalizes by interpreting new situations and composing available responses. Light patterns, motion, faces and sound remain application-defined material. Their combinations can vary with the current event, earlier interactions and the device’s disposition, without generating a sentence for every reaction.

## Code state and model choices share one event path

There are two kinds of state to coordinate.

**Operational state belongs to code.** The application tracks what is happening and applies required feedback: a lamp indicating a failed build, or Buddygotchi showing working, idle and needing attention. A mood cannot decide whether an agent requires approval. Rules respond to eligible incoming events without waiting for a remote model.

**Contextual state can belong to the model.** A reusable `Choice` output represents a named value such as mood or tone. Its current value comes from the latest successful change in the log. The application computes which transitions are available for the next decision; `Choice` checks the offered options again before applying a change. [Log-backed Choice](https://github.com/Mellow-Machines-Lab/MellowHarness/blob/5eb594fe6fc824654c4430ee911b7e55dbf7c866/Sources/MellowHarness/Choice.swift#L33-L60).

These are two cooperating state machines at the application level, rather than two agent loops. Code-triggered events and model-selected outcomes use the same append and observer mechanism. Their shared log connects what the model saw, what it chose and what the application reports happened. Later context can include a reaction still in progress or its eventual completion. [Common event handling](https://github.com/Mellow-Machines-Lab/MellowHarness/blob/5eb594fe6fc824654c4430ee911b7e55dbf7c866/Sources/MellowHarness/Harness.swift#L314-L346), [effect lifecycle](https://github.com/Mellow-Machines-Lab/MellowHarness/blob/5eb594fe6fc824654c4430ee911b7e55dbf7c866/Sources/MellowHarness/Harness.swift#L649-L688).

### What the event log looks like

The package’s public lamp example shows a failed build, a scripted decision and a tone change. This excerpt projects selected fields from its documented records:

```jsonl
{"seq":1,"at":1791351801523,"source":"ci","kind":"build_failed","data":{"branch":"main","run":812}}
{"seq":3,"at":1791351801526,"source":"self","kind":"pass","data":{"for":1,"brain":"scripted","dropped":null}}
{"seq":4,"at":1791351801526,"source":"self","kind":"did","data":{"for":1,"action":"tone","from":"calm","to":"worried","ok":true}}
```

`for: 1` ties the decision and change to the triggering build. Sequence numbers preserve append order even when timestamps match; the missing sequence is an omitted rule response. These are scripted example records, not Jev latency measurements. The model-facing transcript renders them as English lines. [Event records](https://github.com/Mellow-Machines-Lab/MellowHarness/blob/5eb594fe6fc824654c4430ee911b7e55dbf7c866/ARCHITECTURE.md#events), [documented example](https://github.com/Mellow-Machines-Lab/MellowHarness/blob/5eb594fe6fc824654c4430ee911b7e55dbf7c866/README.md#one-event-start-to-finish).

## Mood and personality are application extensions

The generic harness supplies events, rules, prompt sections, outputs and `Choice`. It does not prescribe a mood catalogue, a voice bank or a character. Those belong to the application and its character pack.

Buddygotchi demonstrates a useful three-layer arrangement: **personality**, **mood** and **operational state**. They meet in expression while keeping their responsibilities separate.

![Buddygotchi’s pixel character naps, works, asks for attention and celebrates a finish](assets/buddygotchi-workday.gif)

*Buddygotchi’s scripted firmware-simulator demo shows the companion application: napping, working, attention, testing and a trophy finish. A Buddygotchi progress update will follow.*

![Personality, mood and operational state combine into Buddygotchi’s expression](assets/buddygotchi-three-layers.png)

### Personality and nightly auto-dream

Personality supplies an interpretive policy: what the character notices, how readily it becomes excited, or how reluctantly it softens. Today, authored Markdown steering supplies that disposition during prompt assembly.

**Nightly auto-dream is work in progress.** The planned extension uses a slower personality graph. Each night, the companion would review its experiences, stay in its temperament or traverse an allowed personality edge, save the result to long-term memory and inject it into future prompts.

That would give each Buddygotchi a character that persists across days. Some could tend to stay hyped; others could stay grumpy longer and resist mood changes. The nightly learning and learned-memory injection are planned, while the current runtime reads authored steering. [Current application prompt assembly](https://github.com/Mellow-Machines-Lab/buddygotchi/blob/0bf59caa8dd178ab9629f2742b22040e2665fcca/app/BoopKit/App/Runtime.swift#L357-L397).

### Bounded mood transitions

Mood changes more readily than personality. In this integration, the application supplies **stay or an offered outgoing edge** from the current mood. Helpers provide each destination’s meaning and transition guidance. These constraints are supplied by the application; they are not a built-in mood graph in MellowHarness.

![A directed character mood map illustrating related transitions from Grumpy](assets/mood-map-reference.png)

The supplied map illustrates a broader character design. Solid arrows show ordinary moves and dashed arrows show dramatic branches. It is an illustration of graph-bounded emotion, rather than the exact mood catalogue bundled with the public Pixel character. The selected pack and policy determine runtime choices.

A momentary expression can differ from the lasting mood: a grumpy companion can acknowledge success without becoming cheerful immediately. The graph keeps changes coherent while leaving the model room to interpret the event. [Application mood options](https://github.com/Mellow-Machines-Lab/buddygotchi/blob/0bf59caa8dd178ab9629f2742b22040e2665fcca/app/BoopKit/Actions/MoodAction.swift#L44-L75).

### Outputs make the character tangible

Buddygotchi’s Mood output updates its emotional backdrop. React selects a face, a finish scene and, for packs that provide them, recorded vocal cues. The public Pixel pack supplies pixel animations and has no recorded voice bank. Each pack can give the same harness different expressive material. [Character pack contract](https://github.com/Mellow-Machines-Lab/buddygotchi/blob/0bf59caa8dd178ab9629f2742b22040e2665fcca/characters/CHARACTER.md).

Coding-agent hooks are one source of observations, adapted into the shared event path by [AgentHooks](https://github.com/Mellow-Machines-Lab/AgentHooks). The harness itself knows nothing about Claude Code, Codex or device transport. These boundaries make it reusable beyond Buddygotchi.

## Try the harness and follow its development

The [MellowHarness repository](https://github.com/Mellow-Machines-Lab/MellowHarness) contains the runtime and Beacon example. Beacon can run with a scripted brain and no model key. The [README](https://github.com/Mellow-Machines-Lab/MellowHarness/blob/5eb594fe6fc824654c4430ee911b7e55dbf7c866/README.md#get-started) and [architecture guide](https://github.com/Mellow-Machines-Lab/MellowHarness/blob/5eb594fe6fc824654c4430ee911b7e55dbf7c866/ARCHITECTURE.md) explain the current setup requirements and how to register your own inputs and outputs.

Responsiveness depends on the model, host and device link. This overview does not establish a latency or accuracy benchmark for the current repository revision.

The article will evolve with the harness. For the companion’s current behavior and animations, see the [Buddygotchi repository](https://github.com/Mellow-Machines-Lab/buddygotchi). We’ll share its progress in the next update.
