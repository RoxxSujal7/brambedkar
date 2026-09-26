---
description: Turn the current project website into a short, polished, shareable launch video using Hyperframes
---

# /brag Workflow

Turn the current project into a short, polished, shareable launch video using Hyperframes.

## Invocation

```bash
/brag
/brag --tone polished
/brag --tone chaotic --format vertical
/brag --voice
```

## Options

- `--tone`: Preset (`default`, `polished`, `yc-parody`, `chaotic`, `deadpan`, `cinematic`, `app-store`) or freeform creative direction
- `--format`: `landscape` (default), `vertical`, `square`
- `--duration`: 15–25 seconds (auto)
- `--voice`: Optional narration (Kokoro via Hyperframes)
- `--no-music` / `--no-sfx`: Disable background music or sound effects
- `--title`: Custom video title (inferred if omitted)

## Workflow Steps

1. **Inspect Project**: Read project code, identify core value proposition, key UI/features, and audience hook.
2. **Plan & Storyboard**: Commit to tone, angle, and beat-by-beat storyboard (15–25s total) in `brag-output/brag-plan.md`.
3. **Compose**: Hand off brief to Hyperframes in `brag-output/composition/` and audit with `npx hyperframes check`.
4. **Render & Deliver**: Render `brag.mp4`, extract best poster frame `brag.jpg` (baked as frame 0), and generate `share-copy.txt`.
