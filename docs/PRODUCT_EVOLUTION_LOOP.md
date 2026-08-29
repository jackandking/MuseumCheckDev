# MuseumCheck Product Evolution Loop

## Purpose

Keep MuseumCheck moving toward its mission through small, evidence-based improvements. The loop is designed to prevent two common failures: adding features that duplicate existing capabilities and optimizing traffic without improving a real family visit.

## Daily product pulse

The daily pulse should inspect, in this order:

1. The anonymous visit funnel: `checkin_open`, `task_open`, `first_task_complete`, task depth, and visit feedback.
2. Content trust signals: missing museum metadata, unavailable exhibits, incorrect images, and unresolved reports.
3. Distribution signals: search, shared links, QR entry where available, and direct family or creator feedback.
4. The current repository state: uncommitted changes, recent product changes, targeted tests, and deployment health.

It should then produce one smallest next action, with:

- the evidence behind it;
- the metric it should improve;
- the files or workflow it affects;
- the narrow validation to run;
- any user confirmation required.

If there is not enough evidence, the next action should be instrumentation, content verification, or a reversible user test—not a broad feature expansion.

## Decision hierarchy

Use this order when choosing work:

1. Remove a blocker in the first-task path.
2. Repair inaccurate or unverifiable museum content.
3. Improve the next-step recommendation after a completed task.
4. Improve a credible distribution entry point.
5. Add supporting rewards, sharing, or personalization only when they help the visit.

## Authority boundaries

The pulse may inspect data, update planning documents, prepare small code changes, and run targeted tests. It must not automatically send external messages, change museum facts without review, alter production data, or deploy production changes without an explicit approval path. Any AI generation must remain constrained by verified museum data.

## Weekly review

Once a week, compare the chosen action with the previous week's evidence:

- Did the first-task funnel improve?
- Did families report that the task was helpful?
- Did content corrections decrease or get resolved faster?
- Did distribution create real visit sessions rather than only page views?

Keep, revise, or revert the experiment based on those answers. Update this document or the project charter only when the lesson is durable.
