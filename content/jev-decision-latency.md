## What we recorded

In an audited application log from **28 September 2026**, **105 Jev decision passes had a median time of 227 ms**. **95 of 105 passes (90.5%) were below 500 ms**. The complete sample ranged from **185 to 1,103 ms**.

This is decision-pass timing: **prepared model request through answer completion**. It excludes prompt assembly, queue wait, device transport and animation rendering. It is not a claim that every interaction or hardware response completes in 227 ms.

<figure><img src="/assets/jev-latency-distribution.svg" width="1600" height="900" alt="Distribution of 105 Jev decision-pass times in 100-millisecond bins. Most observations fall between 200 and 300 ms; all observations including the slower tail are retained." loading="lazy"><figcaption>Historical application-log sample, not a controlled comparison between models. The full data and measurement boundary are available below.</figcaption></figure>

## Sample and method

| Field | Value |
|---|---|
| Recorded date | 28 September 2026 |
| Pass count | 105 |
| Brain identifier | `jev:jev-latest` |
| Median | 227 ms |
| Under 500 ms | 95 / 105 (90.5%) |
| Observed range | 185–1,103 ms |
| Dropped passes in this sample | 0 |
| Re-audited | 10 October 2026 |

The audit extracted every pass record’s `latency_ms` from the source log and compared the sequence with the sanitized dataset. The sample was collected before the repositories were split. The original software commit, immutable model version and detailed network environment are not recorded, so this is an historical observation rather than a reproducible benchmark of today’s release.

The histogram includes every observed pass. It does not remove the slower tail or extrapolate a guaranteed response rate from this sample.

## Download the evidence

- [105 latency observations as CSV](/assets/jev-latency.csv)
- [Sanitized observations and provenance as JSON](/assets/jev-latency.json)
- [Distribution as SVG](/assets/jev-latency-distribution.svg)

The public dataset contains timings and aggregate provenance only. It omits prompts, private event content and local filesystem paths. Its metadata records a SHA-256 hash of the audited source log so later internal audits can identify the same input.

## Why the two-path architecture matters

MellowHarness does not make every visible acknowledgment wait for a model request. Immediate application rules can handle a tap or task-status change; a subsequent model decision supplies a context-sensitive mood or expressive cue. Both effects return to the shared log.

This is the architectural reason the pattern fits responsive AI hardware and companion applications. The timing sample supports discussion of the decision layer; it does not measure the complete first-feedback path. See [the agent harness guide](/learn/agent-harness-design/) for the two event paths.

## What this sample does not establish

It does not measure current hardware round-trip latency, comparative model speed, cost per interaction or correctness of mood choices. A valid bounded choice can still be inappropriate. The scripted [browser demo](/#demo) is an illustration of behavior, not a live performance test.

A follow-up benchmark should separately record input arrival, context assembly, request start, response completion, validation, device receipt and first visible frame. It should use fixed scenarios, retain failures and retries, and evaluate decision suitability against a stated rubric.

For the implementation, read [MellowHarness](https://github.com/Mellow-Machines-Lab/MellowHarness); for alternative typed decision interfaces, see [System One Models](/learn/system-one-models/).
