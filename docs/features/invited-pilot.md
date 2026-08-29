# Invited Pilot Flow

## Purpose

`pilot.html` is a small invitation layer around MuseumCheck's public, free product. It helps an early co-creation cohort prepare a real museum trial without making the generic check-in page invite-only.

The pilot is successful when a participant moves through:

```text
pilot_open -> pilot_started -> checkin_open -> task_open -> first_task_complete -> visit_feedback
```

The existing public product and public URLs remain available without a pilot parameter.

## Invitation URLs

Use a short, non-personal cohort slug:

```text
https://museumcheck.cn/pilot.html?pilot=one-camp
https://museumcheck.cn/pilot.html?pilot=early-family
```

The same URL can be shared as a link or encoded in a QR code. Cohort slugs are restricted to lowercase letters, numbers, and hyphens and must not contain a person's name, phone number, or other contact information.

Unknown valid cohort slugs receive the generic early co-creation copy. `one-camp` has a display-name override; adding another display-name override is a small copy-only change in `js/pilot.js` and `js/museum-checkin.js`.

## Context Collected

The participant selects only context needed to prepare and evaluate the visit:

- age band: `3-6`, `7-12`, or `13-18`;
- a specific museum, with its existing city metadata;
- activity format: family, camp, school/group, or friends;
- approximate group-size band;
- expected visit-duration band.

The page does not ask for child names, phone numbers, account details, or contact information. The selected context is stored locally in `museumcheckPilotContext:v1` and passed as controlled URL values to the existing museum check-in flow.

## Anonymous Evidence

Pilot and check-in signals use the existing `museumcheck-visit-signals` store and 90-day expiry. A random pilot session ID connects the invitation start to the check-in funnel. Signals contain the controlled context above, museum ID, timestamps, and anonymous session identifiers. They do not include child nicknames or contact data.

The existing first-task feedback prompt is reused. In pilot mode it asks whether the trial's first task was helpful, with the same optional 120-character explanation for a not-helpful response.

## Validation

Run the focused checks:

```bash
node --check js/pilot.js
node --check js/museum-checkin.js
npm test -- --runInBand tests/pilot.test.js tests/age-parameter-priority.test.js
npx playwright test e2e/invited-pilot.spec.ts --project=chromium
```

Also inspect `pilot.html?pilot=one-camp` and its first-task transition at a realistic mobile viewport before deployment.
