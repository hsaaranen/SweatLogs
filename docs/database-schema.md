# SweatLogs database schema

SweatLogs uses SQLite. This diagram represents database schema version 2, defined in [`src/data/databaseMigrations.ts`](../src/data/databaseMigrations.ts).

```mermaid
erDiagram
    APP_METADATA {
        TEXT key PK
        TEXT value
    }

    EXERCISES {
        TEXT id PK
        TEXT name
        TEXT description
        TEXT setType
        TEXT createdAt
        TEXT archivedAt "nullable"
    }

    WORKOUT_FOCUSES {
        TEXT id PK
        TEXT name
        TEXT color
        TEXT archivedAt "nullable"
    }

    EXERCISE_MARKERS {
        TEXT id PK
        TEXT name
        TEXT color
        TEXT archivedAt "nullable"
    }

    WORKOUTS {
        TEXT id PK
        TEXT notes
        TEXT startedAt
        TEXT completedAt
    }

    WORKOUT_EXERCISES {
        TEXT id PK
        TEXT workoutId FK
        TEXT exerciseId FK
        TEXT setType
        INTEGER sortOrder
    }

    WORKOUT_SETS {
        TEXT id PK
        TEXT workoutExerciseId FK
        INTEGER setNumber
        INTEGER reps "nullable"
        REAL weight "nullable"
        INTEGER durationSeconds "nullable"
        REAL distanceMeters "nullable"
    }

    WORKOUT_WORKOUT_FOCUSES {
        TEXT workoutId PK,FK
        TEXT workoutFocusId PK,FK
    }

    WORKOUT_EXERCISE_EXERCISE_MARKERS {
        TEXT workoutExerciseId PK,FK
        TEXT exerciseMarkerId PK,FK
    }

    WORKOUT_TEMPLATES {
        TEXT id PK
        TEXT name
        TEXT createdAt
    }

    WORKOUT_TEMPLATE_WORKOUT_FOCUSES {
        TEXT workoutTemplateId PK,FK
        TEXT workoutFocusId PK,FK
    }

    WORKOUT_TEMPLATE_EXERCISES {
        TEXT id PK
        TEXT workoutTemplateId FK
        TEXT exerciseId FK
        INTEGER sortOrder
        INTEGER setCount
    }

    WORKOUTS ||--o{ WORKOUT_EXERCISES : contains
    EXERCISES ||--o{ WORKOUT_EXERCISES : records
    WORKOUT_EXERCISES ||--o{ WORKOUT_SETS : contains

    WORKOUTS ||--o{ WORKOUT_WORKOUT_FOCUSES : classified_by
    WORKOUT_FOCUSES ||--o{ WORKOUT_WORKOUT_FOCUSES : assigned_to

    WORKOUT_EXERCISES ||--o{ WORKOUT_EXERCISE_EXERCISE_MARKERS : tagged_with
    EXERCISE_MARKERS ||--o{ WORKOUT_EXERCISE_EXERCISE_MARKERS : assigned_to

    WORKOUT_TEMPLATES ||--o{ WORKOUT_TEMPLATE_EXERCISES : contains
    EXERCISES ||--o{ WORKOUT_TEMPLATE_EXERCISES : references

    WORKOUT_TEMPLATES ||--o{ WORKOUT_TEMPLATE_WORKOUT_FOCUSES : classified_by
    WORKOUT_FOCUSES ||--o{ WORKOUT_TEMPLATE_WORKOUT_FOCUSES : assigned_to
```

## Legend

- `PK` - primary key; uniquely identifies a row.
- `FK` - foreign key; references a row in another table.
- `PK,FK` - part of a composite primary key and also a foreign key.
- `nullable` - the column may contain `NULL`.
- `||` - exactly one.
- `o{` - zero or many.
- `||--o{` - one parent can have zero or many children, while each child belongs to exactly one parent.

For example, one `WORKOUT_EXERCISE` can contain zero or many `WORKOUT_SETS`. Each set stores the relationship through `workout_sets.workoutExerciseId`, which references `workout_exercises.id`.

Deleting a workout, template, or owned workout exercise cascades to its child records. Deleting referenced exercises, focuses, and markers is restricted.
