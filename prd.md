# SweatLogs Product Requirements Document

**Version:** 0.1  
**Primary platform:** Android  
**Last updated:** 2026-08-11

## Product summary

SweatLogs is a private, offline-first workout log for people who want to record exercises quickly and review their progress without an account, subscription, or cloud dependency.

It supports strength, repetition, duration, distance, and distance-plus-duration exercises. Users can create workout templates, classify workouts and exercises, review history and progress charts, and manually back up or restore their local data.

## Problem

Many fitness applications add friction through mandatory accounts, subscriptions, fixed programs, or complicated tracking flows. Users who already know how they want to train need a fast and flexible alternative to a paper notebook or spreadsheet.

SweatLogs should make it easy to:

- Record sets during a workout with minimal interaction.
- Resume an unfinished workout without losing data.
- Reuse familiar workout structures.
- Find previous results and observe progress.
- Retain ownership of all workout data.

## Target users

The primary user is a recreational gym-goer who trains regularly and wants quick entry, flexible exercise types, and easy access to previous results.

A secondary user combines strength and endurance training and needs to track repetitions, weight, time, distance, and pace in one application.

## Goals

- Make complete workout logging available without an internet connection.
- Let a returning user begin a familiar workout in under 30 seconds.
- Support different exercise measurement models without irrelevant fields.
- Prevent loss of an active workout after closing the app.
- Provide useful workout history and exercise progress views.
- Allow users to export and restore the complete local database.
- Support English and Finnish.

## Non-goals for v1

- Social features, leaderboards, or public profiles.
- Cloud accounts or automatic device synchronization.
- Generated training programs or coaching.
- Nutrition, sleep, or body-measurement tracking.
- Wearable integrations.
- Advertising or subscriptions.

## Core user flows

### Record a workout

1. Start a workout or load a saved template.
2. Select a workout focus.
3. Add exercises and optional exercise markers.
4. Enter the relevant values for each set.
5. Add optional notes and save the workout.

The app automatically saves the active workout as a draft. If the app closes, the draft is restored on the next launch.

### Review history and progress

1. Select a workout date from Calendar to review its exercises and sets.
2. Search Data by exercise, exercise marker, or workout focus.
3. Review matching records and applicable progress charts.
4. Edit or delete records after confirmation.

### Back up or restore data

1. Export the SQLite database through the device share sheet.
2. Store the backup outside the application.
3. Select a compatible backup to restore it.
4. Confirm replacement of the existing local database.

## Functional requirements

### Workout logging

- Users can start, save, and cancel a workout.
- A workout requires a focus and at least one exercise with one valid completed set.
- Users can add multiple exercises and up to 15 sets per exercise.
- Exercises retain their workout order.
- Workout notes are limited to 2,000 characters.
- Exercises can have optional markers.
- The app calculates exercise and workout totals.
- Cancelling or deleting data requires confirmation.
- An unfinished workout is saved and restored automatically.

### Exercise types

| Type | Values |
|---|---|
| Strength | Repetitions and non-negative weight |
| Duration | Positive minutes and/or seconds |
| Repetitions only | Positive whole-number repetitions |
| Distance | Positive distance in kilometres |
| Distance + duration | Positive distance and time; pace is derived |

Only fields relevant to the selected type should be shown. Invalid or incomplete sets must be rejected with a clear message.

### Exercise library and organization

- The app includes a starter exercise library.
- Users can create and search custom exercises.
- Users can edit an existing exercise's name and description from the exercise library.
- An exercise's measurement type is fixed after creation to protect recorded workout data.
- Exercises can include an optional description with instructions and reference links.
- The workout view keeps descriptions out of the logging form and opens them from an information icon.
- Users can create colored workout focuses and exercise markers.
- Removing a library item hides it from future selection without altering historical workouts.

### Workout templates

- Users can create, edit, load, and delete templates.
- A template contains a name, workout focus, ordered exercises, and planned sets with the values supported by each exercise type.
- Loading a template prefills its planned repetitions, weight, duration, and distance values in the workout.
- Loading a template creates an editable workout without changing the original template.

### Calendar and data

- Calendar shows which dates contain saved workouts.
- Selecting a date displays its workouts, exercises, sets, notes, and totals.
- Users can edit or delete an exercise record and delete a complete workout.
- Data can be searched by exercise, exercise marker, or workout focus.
- Exercise charts display relevant metrics such as weight, repetitions, duration, distance, and pace.

### Settings and data ownership

- Users can switch between English and Finnish, and the selection persists.
- Users can export the complete SQLite database.
- Import validates backup identity, version, schema, and linked records before replacing current data.
- The user must be warned that importing replaces existing local data.

## Data and privacy

- Primary data is stored locally in SQLite (`sweatlogs.db`).
- No account or network connection is required.
- Workout data leaves the device only when the user explicitly exports or shares it.
- Imported files are treated as untrusted and validated before use.
- Related database writes must be transactional.
- Schema changes require versioned migrations where feasible.
- No analytics, advertising identifiers, or telemetry should be added without a documented product decision and user disclosure.

## Quality requirements

- Core logging must work in airplane mode.
- Common navigation and searches should feel immediate on a mid-range Android phone.
- History should remain responsive with at least 1,000 workouts.
- Controls must have comfortable tap targets, accessible labels, and sufficient contrast.
- Layouts should remain usable with larger system fonts.
- User-facing strings must use the localization system.
- Android debug and signed release builds must work with the repository's Gradle wrapper.

## Release acceptance criteria

Android v1 is ready when:

1. A clean installation initializes its database and starter data.
2. All five exercise types can be recorded and validated correctly.
3. An active workout survives an app restart.
4. Templates can be created, edited, loaded, and deleted.
5. Calendar history reflects saved, edited, and deleted workouts.
6. Exercise history and progress charts show appropriate metrics.
7. English and Finnish both work and persist across launches.
8. A backup can be exported and restored on a clean installation.
9. Invalid backups are rejected without damaging current data.
10. Type checking and Android debug and signed release builds pass.
11. Core flows are tested on a physical Android device.

## Roadmap

### Release hardening

- Add tests for validation, totals, migrations, and backup import.
- Review Finnish copy and source encoding.
- Audit accessibility and larger-font layouts.
- Configure release signing and document local Android builds.
- Test backup transfer between physical devices.

### Later improvements

- Copy values from previous sets or workouts.
- Reorder exercises in active workouts and templates.
- Add rest and exercise timers.
- Highlight personal records.
- Add date-range comparisons and summaries.
- Consider optional CSV or JSON export.

## Open questions

- Should workouts support one focus or multiple focuses in the interface?
- Should weight and distance units be configurable?
- Should templates include notes and default markers?
- Should the app periodically remind users to create a backup?
- Is iOS part of the v1 release scope?

## Implementation references

- Navigation and application state: `App.tsx`
- Screens: `src/views/`
- Types and validation: `src/types.ts`, `src/utils/workoutUtils.ts`
- SQLite storage and migrations: `src/data/`
- Database diagram: `docs/database-schema.md`
- Drafts and backups: `src/storage/`
- Localization: `src/localization/`
