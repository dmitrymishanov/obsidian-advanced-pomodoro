# Mobile support for Advanced Pomodoro

## Problem

On mobile (iOS/Android), Obsidian does not render the status bar. The plugin's
entire visible surface — timer display and start/pause interaction — lives in
`statusBarEl` (see [src/main.ts:94-103](../../../src/main.ts#L94-L103)). Commands
are available through the command palette, but there is no way to see the timer
or drive it without that palette on mobile.

`manifest.json` already declares `isDesktopOnly: false`, so the plugin loads on
mobile, but it is effectively invisible and near-unusable there.

## Goals

- On mobile, users can start, pause/resume, finish, and stop the timer.
- On mobile, users can see the current state and remaining time.
- On desktop, the current status-bar behaviour is preserved.
- No regressions to existing commands, logging, per-note settings, sound.

## Non-goals

- A separate pomodoro view (tab/panel) — postponed.
- Periodic ticking notices / background notifications while the timer runs.
- Platform detection to hide desktop-only surfaces — the ribbon icon shows on
  both platforms; Obsidian already hides the status bar on mobile.

## Design

### Ribbon icon with action menu

A single ribbon icon is added in `onload()`:

- Icon: lucide `timer`.
- Tooltip: reflects current state and remaining time, updated from the same
  tick that updates the status bar.
- Click: opens a context `Menu` populated from the current
  `WorkState` × `TimerState` combination.

Menu contents by state:

| State               | Menu items                                                       |
|---------------------|------------------------------------------------------------------|
| Idle                | ▶ Start pomodoro                                                 |
| Work · Running      | ⏱ 12:34 remaining (disabled header) · ⏸ Pause · ✓ Finish · ■ Stop |
| Work · Paused       | ⏱ 12:34 remaining (disabled header) · ▶ Resume · ✓ Finish · ■ Stop |
| Break · Running     | ☕ 04:12 break remaining (disabled) · ⏸ Pause · ✓ Finish · ■ Stop  |
| Break · Paused      | ☕ 04:12 break remaining (disabled) · ▶ Resume · ✓ Finish · ■ Stop  |

The remaining-time item is rendered via `setDisabled(true)` — purely
informational.

### Notices on state transitions

Add `new Notice(...)` at the plugin's state-transition points:

- `startPomodoro()` → `🍅 Pomodoro started — {N}m`
- `takeBreak()` (short) → `☕ Break — {N}m`
- `takeBreak()` (long) → `☕ Long break — {N}m`
- Pause → `Paused`
- Resume → `Resumed`
- `timer.finish()` (Work) → `🍅 Pomodoro finished`
- `timer.finish()` (Break) → `☕ Break finished`
- `stayIdle()` only when called as a user-initiated stop (not from `onload`) →
  `Timer stopped`

Notices complement, not replace, the sound notification.

### Module: `src/ribbon.ts`

New file encapsulating the ribbon icon:

```ts
export class RibbonController {
  constructor(plugin: AdvancedPomodoroPlugin);
  register(): void;           // called from onload
  refresh(): void;             // re-render tooltip; called from tick + transitions
  // internal: buildMenu(evt) — returns the populated Menu
}
```

The controller reads state via getters on the plugin (`workState`, `timer`) and
invokes the plugin's existing action methods (`startPomodoro`, `takeBreak`,
`toggleTimerPause`, `stayIdle`, `timer.finish`). No new state is introduced.

### Refactor: `updateDisplays()` in `main.ts`

The tick currently updates only the status bar
([src/main.ts:157-166](../../../src/main.ts#L157-L166)). Extract the update into
`updateDisplays()` which writes both:

- `statusBarEl.setText(...)` — unchanged text
- `ribbon.refresh()` — updates tooltip

The tick interval stays at 100 ms (status bar needs it). Ribbon tooltip updates
at the same cadence; this is cheap (one DOM attribute write).

### Platform notes

- The ribbon icon shows on desktop too. This is intentional: simpler code, and
  matches how many Obsidian plugins ship a ribbon entry point.
- `Platform` detection is not needed.
- Sound: `playNotificationSound()` uses `new Audio(...)` and requires a prior
  user gesture on mobile. The first pomodoro always starts from a user gesture
  (ribbon click or palette command), which unlocks audio for subsequent
  automatic transitions in cyclic mode. No code change needed.

## Files affected

- `src/ribbon.ts` — new.
- `src/main.ts` — wire up `RibbonController`, add `Notice`s at transitions,
  extract `updateDisplays()`.

No changes to: `timer.ts`, `logger.ts`, `note-settings.ts`, `notifications.ts`,
`settings.ts`, `manifest.json`.

## Risks

- The tick runs at 100 ms and now writes two DOM surfaces. Overhead is
  negligible (one extra attribute set), but worth noting.
- The ribbon menu's "remaining" line is a snapshot at open time. This matches
  native Obsidian UX for menus — acceptable.
- Notice volume increase on cyclic mode: every transition adds a Notice. If the
  user runs long cyclic sessions this is more on-screen traffic. If it proves
  noisy later, a "Show transition notices" toggle in settings is a follow-up,
  not part of this change.
