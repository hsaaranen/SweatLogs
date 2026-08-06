import { localGymLogsStore } from '../data/localGymLogsStore';

export type {
  CreateWorkoutRequest,
  ExerciseRecordResponse,
  ExerciseRecordsResponse,
  ExerciseResponse,
  ExerciseTagResponse,
  UpdateExerciseRecordRequest,
  WorkoutExerciseResponse,
  WorkoutResponse,
  WorkoutSetResponse,
  WorkoutTagResponse,
  WorkoutTemplateResponse,
} from '../data/gymLogsDataTypes';

export const gymLogsApi = localGymLogsStore;
