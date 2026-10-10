## A coding agent can work quietly while its companion stays expressive

Buddygotchi turns coding-agent events into visible work, attention and character. It uses **AgentHooks** for Claude Code and Codex integration, **MellowHarness** for bounded reactions, and a character pack for mood, animation and sound.

The aim is an expressive peripheral: you can see that an agent is working, needs your attention or has finished. A System One Model such as Jev adds context-sensitive mood choices; application rules keep the immediate status path responsive.

<figure><img src="/assets/buddygotchi-workday.gif" width="684" height="570" alt="A pixel coding companion works, signals for attention and celebrates." loading="lazy"><figcaption>A scripted firmware-simulator sequence using the public Pixel character pack.</figcaption></figure>

## From hooks to a shared event stream

Claude Code and Codex produce different lifecycle signals. AgentHooks normalizes the relevant session events into a stream an application can consume. Its current session vocabulary includes working, idle and needs-you states.

Buddygotchi maps those events into its application state and emits useful context to the harness. The harness records what happened, what immediate feedback ran and what the model subsequently selected. A permission request can signal for attention without letting the companion approve a real coding-agent operation.

The small integration layer is reusable beyond this character. Follow the [AgentHooks repository](https://github.com/Mellow-Machines-Lab/AgentHooks) for the current setup and contracts rather than assuming every coding agent emits the same hooks.

## Personality, mood and operational state

**Personality** is authored steering: the character’s tendencies and response style. It enters prompt assembly. Nightly auto-dream, learned personality traversal and its long-term-memory persistence are **work in progress**, not a feature demonstrated by the browser play.

**Mood** is the emotional direction selected from the current graph’s allowed transitions. Jev receives guidance about when a transition fits; it cannot choose a mood omitted from the offered roster.

**State** describes the ongoing activity. Coding and device events determine it independently of mood. The face combines the two: working can look determined or irritated; waiting can look curious or tired. Authored cues and animations give those combinations an expressive vocabulary.

This is more flexible than assigning one fixed animation to every trigger, while remaining bounded enough for an application to inspect and control. It does not require unrestricted generated speech for each interaction.

## Browser demo versus public hardware build

The [landing-page demo](/#demo) plays an authored four-minute task with tool calls, subagents, failures, taps and simulated user conversation. It uses existing animation and selected recorded voice assets in the current review preview. It makes **no live Jev calls**, uses no visitor microphone and does not measure device latency.

The public build is a separate, documented route: a Mac host, supported ESP32 CYD display and the public Pixel pack. Pixel includes authored personality, moods, faces and sound effects; its public pack does **not** include the recorded-voice bank used in the review demo. Do not expect a board or microSD card alone to reproduce those voices.

See the [build walkthrough](/learn/buddygotchi-build/) and [compatible parts](/learn/esp32-parts-list/) for current supported assets and hardware.

## How this relates to Codex Pet and other coding buddies

Animated coding companions are an adjacent interaction pattern. OpenAI’s [Pets documentation](https://learn.chatgpt.com/docs/pets) describes companions that reflect activity around the work experience.

Buddygotchi is an independent open-source project. It is not an official Codex Pet, a Claude product or a verified integration with OpenAI’s Pets feature. The current connection to Claude Code and Codex comes through AgentHooks; the harness and character design belong to this project.

## Start with the layer you need

For event integration, read AgentHooks. For the decision loop, start with [harness design](/learn/agent-harness-design/) and the [no-key quickstart](/learn/mellowharness-quickstart/). For a character on your desk, follow the supported hardware build.

Share a reproducible integration issue or a successful build through the relevant repository. Those examples help us improve the architecture and its documentation more than a claim that every companion interaction is already solved.
