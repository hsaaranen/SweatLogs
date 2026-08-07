import { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Animated, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { gymLogsApi } from './src/api/gymLogsApi';
import { styles } from './src/styles';
import {
  DataSearchMode,
  Exercise,
  ExerciseRecord,
  ExerciseRecordSet,
  ExerciseSetType,
  ExerciseTag,
  Notice,
  WorkoutExerciseEntry,
  WorkoutHistory,
  WorkoutTag,
  WorkoutTemplate,
  WorkoutTemplateExercise,
} from './src/types';
import {
  buildWorkoutRequest,
  calculateTotals,
  DEFAULT_EXERCISE_SET_TYPE,
  createEmptySet,
  createDefaultSets,
  createId,
  getErrorMessage,
  mapExerciseRecordToData,
  mapWorkoutToHistory,
  MAX_WORKOUT_SETS,
  MIN_WORKOUT_SETS,
  sortExercises,
  sortExerciseTags,
  sortWorkoutTags,
} from './src/utils/workoutUtils';
import { WorkoutView } from './src/views/WorkoutView';
import { CalendarView } from './src/views/CalendarView';
import { DataView } from './src/views/DataView';
import { SettingsView } from './src/views/SettingsView';
import { PlannerView } from './src/views/PlannerView';
import {
  loadWorkoutDraft,
  removeWorkoutDraft,
  saveWorkoutDraft,
} from './src/storage/workoutDraftStorage';
import {
  exportDatabaseBackup,
  pickAndImportDatabaseBackup,
} from './src/storage/databaseBackupStorage';

type RootTabParamList = {
  Workout: undefined;
  Calendar: undefined;
  Data: undefined;
  Planner: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const DEFAULT_NEW_WORKOUT_TAG_COLOR = '#215F9A';
const DEFAULT_NEW_EXERCISE_TAG_COLOR = '#214E3A';
const MIN_SPLASH_DURATION_MS = 1100;

export default function App() {
  return <SweatLogsApp />;
}

function SweatLogsApp() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseSearchText, setExerciseSearchText] = useState('');
  const [isExerciseDialogOpen, setIsExerciseDialogOpen] = useState(false);
  const [dataSearchMode, setDataSearchMode] = useState<DataSearchMode>('exercise');
  const [dataExerciseSearchText, setDataExerciseSearchText] = useState('');
  const [dataExerciseTagSearchText, setDataExerciseTagSearchText] = useState('');
  const [dataWorkoutTagSearchText, setDataWorkoutTagSearchText] = useState('');
  const [isDataExerciseDialogOpen, setIsDataExerciseDialogOpen] = useState(false);
  const [isDataExerciseTagDialogOpen, setIsDataExerciseTagDialogOpen] = useState(false);
  const [isDataWorkoutTagDialogOpen, setIsDataWorkoutTagDialogOpen] = useState(false);
  const [selectedDataExercise, setSelectedDataExercise] = useState<Exercise | null>(null);
  const [selectedDataExerciseTag, setSelectedDataExerciseTag] = useState<ExerciseTag | null>(null);
  const [selectedDataWorkoutTag, setSelectedDataWorkoutTag] = useState<WorkoutTag | null>(null);
  const [dataExerciseTagExercises, setDataExerciseTagExercises] = useState<Exercise[]>([]);
  const [dataWorkoutTagWorkouts, setDataWorkoutTagWorkouts] = useState<WorkoutHistory[]>([]);
  const [isSettingsExerciseDialogOpen, setIsSettingsExerciseDialogOpen] = useState(false);
  const [isSettingsWorkoutTagDialogOpen, setIsSettingsWorkoutTagDialogOpen] = useState(false);
  const [isSettingsExerciseTagDialogOpen, setIsSettingsExerciseTagDialogOpen] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseSetType, setNewExerciseSetType] = useState<ExerciseSetType>(DEFAULT_EXERCISE_SET_TYPE);
  const [newWorkoutTagName, setNewWorkoutTagName] = useState('');
  const [newWorkoutTagColor, setNewWorkoutTagColor] = useState(DEFAULT_NEW_WORKOUT_TAG_COLOR);
  const [newExerciseTagName, setNewExerciseTagName] = useState('');
  const [newExerciseTagColor, setNewExerciseTagColor] = useState(DEFAULT_NEW_EXERCISE_TAG_COLOR);
  const [workoutTags, setWorkoutTags] = useState<WorkoutTag[]>([]);
  const [exerciseTags, setExerciseTags] = useState<ExerciseTag[]>([]);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [templateExercises, setTemplateExercises] = useState<WorkoutTemplateExercise[]>([]);
  const [templateTagIds, setTemplateTagIds] = useState<string[]>([]);
  const [templateExerciseSearchText, setTemplateExerciseSearchText] = useState('');
  const [isTemplateExerciseDialogOpen, setIsTemplateExerciseDialogOpen] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [selectedWorkoutTagIds, setSelectedWorkoutTagIds] = useState<string[]>([]);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExerciseEntry[]>([]);
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [expandedWorkoutExerciseId, setExpandedWorkoutExerciseId] = useState<string | null>(null);
  const [history, setHistory] = useState<WorkoutHistory[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingExercise, setIsCreatingExercise] = useState(false);
  const [isCreatingWorkoutTag, setIsCreatingWorkoutTag] = useState(false);
  const [isCreatingExerciseTag, setIsCreatingExerciseTag] = useState(false);
  const [isSavingWorkout, setIsSavingWorkout] = useState(false);
  const [isLoadingExerciseRecords, setIsLoadingExerciseRecords] = useState(false);
  const [isLoadingDataTagResults, setIsLoadingDataTagResults] = useState(false);
  const [deletingWorkoutId, setDeletingWorkoutId] = useState<string | null>(null);
  const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null);
  const [deletingWorkoutTagId, setDeletingWorkoutTagId] = useState<string | null>(null);
  const [deletingExerciseTagId, setDeletingExerciseTagId] = useState<string | null>(null);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [savingExerciseRecordId, setSavingExerciseRecordId] = useState<string | null>(null);
  const [deletingExerciseRecordId, setDeletingExerciseRecordId] = useState<string | null>(null);
  const [isWorkoutDraftHydrated, setIsWorkoutDraftHydrated] = useState(false);
  const [isTransferringDatabase, setIsTransferringDatabase] = useState(false);
  const noticeOpacity = useRef(new Animated.Value(0)).current;
  const plannerScrollRef = useRef<ScrollView>(null);

  const workoutTotals = useMemo(() => {
    const exerciseTotals = workoutExercises.map((entry) => calculateTotals(entry.sets));

    return {
      exerciseCount: workoutExercises.length,
      setCount: exerciseTotals.reduce((sum, totals) => sum + totals.setCount, 0),
      totalReps: exerciseTotals.reduce((sum, totals) => sum + totals.totalReps, 0),
      totalVolume: exerciseTotals.reduce((sum, totals) => sum + totals.totalVolume, 0),
      totalDurationSeconds: exerciseTotals.reduce((sum, totals) => sum + totals.totalDurationSeconds, 0),
      totalDistanceMeters: exerciseTotals.reduce((sum, totals) => sum + totals.totalDistanceMeters, 0),
    };
  }, [workoutExercises]);

  useEffect(() => {
    let isMounted = true;

    const restoreWorkoutDraft = async () => {
      try {
        const draft = await loadWorkoutDraft();
        if (!isMounted || !draft) {
          return;
        }

        setIsWorkoutStarted(true);
        setSelectedWorkoutTagIds(draft.selectedWorkoutTagIds);
        setWorkoutNotes(draft.workoutNotes);
        setWorkoutExercises(draft.workoutExercises);
        setExpandedWorkoutExerciseId(draft.expandedWorkoutExerciseId);
        setNotice({ tone: 'success', message: 'Unfinished workout restored.' });
      } catch (error) {
        if (isMounted) {
          setNotice({
            tone: 'error',
            message: `Could not restore unfinished workout. ${getErrorMessage(error)}`,
          });
        }
      } finally {
        if (isMounted) {
          setIsWorkoutDraftHydrated(true);
        }
      }
    };

    void restoreWorkoutDraft();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isWorkoutDraftHydrated) {
      return;
    }

    const backupTimeout = setTimeout(() => {
      const backup = !isWorkoutStarted
        ? removeWorkoutDraft()
        : saveWorkoutDraft({
            version: 1,
            isWorkoutStarted: true,
            updatedAt: new Date().toISOString(),
            selectedWorkoutTagIds,
            workoutNotes,
            workoutExercises,
            expandedWorkoutExerciseId,
          });

      void backup.catch((error) => {
        setNotice({
          tone: 'error',
          message: `Could not back up workout. ${getErrorMessage(error)}`,
        });
      });
    }, 250);

    return () => {
      clearTimeout(backupTimeout);
    };
  }, [
    expandedWorkoutExerciseId,
    isWorkoutStarted,
    isWorkoutDraftHydrated,
    selectedWorkoutTagIds,
    workoutExercises,
    workoutNotes,
  ]);

  useEffect(() => {
    let isMounted = true;
    let splashTimeout: ReturnType<typeof setTimeout>;

    const splashDelay = new Promise<void>((resolve) => {
      splashTimeout = setTimeout(resolve, MIN_SPLASH_DURATION_MS);
    });

    const loadStartupData = async () => {
      setIsLoading(true);

      try {
        const [
          loadedExercises,
          recentWorkouts,
          loadedWorkoutFocuses,
          loadedExerciseMarkers,
          loadedTemplates,
        ] = await Promise.all([
          gymLogsApi.getExercises(),
          gymLogsApi.getRecentWorkouts(),
          gymLogsApi.getWorkoutFocuses(),
          gymLogsApi.getExerciseMarkers(),
          gymLogsApi.getWorkoutTemplates(),
        ]);

        if (!isMounted) {
          return;
        }

        setExercises(sortExercises(loadedExercises));
        setWorkoutTags(sortWorkoutTags(loadedWorkoutFocuses));
        setExerciseTags(sortExerciseTags(loadedExerciseMarkers));
        setWorkoutTemplates(loadedTemplates);
        setHistory(recentWorkouts.map(mapWorkoutToHistory));
        setNotice(null);
      } catch (error) {
        if (isMounted) {
          setNotice({
            tone: 'error',
            message: `Could not load local data. ${getErrorMessage(error)}`,
          });
        }
      }
    };

    const finishStartup = async () => {
      await Promise.all([splashDelay, loadStartupData()]);

      if (isMounted) {
        setIsLoading(false);
        setIsSplashVisible(false);
      }
    };

    void finishStartup();

    return () => {
      isMounted = false;
      clearTimeout(splashTimeout);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadExerciseRecords = async () => {
      if (!selectedDataExercise) {
        setExerciseRecords([]);
        setIsLoadingExerciseRecords(false);
        return;
      }

      setIsLoadingExerciseRecords(true);

      try {
        const exerciseTagId = dataSearchMode === 'exerciseTag'
          ? selectedDataExerciseTag?.id
          : undefined;
        const response = await gymLogsApi.getExerciseRecords(selectedDataExercise.id, exerciseTagId);

        if (!isMounted) {
          return;
        }

        setExerciseRecords(response.records.map(mapExerciseRecordToData));
      } catch (error) {
        if (isMounted) {
          setExerciseRecords([]);
          setNotice({
            tone: 'error',
            message: `Could not load exercise records. ${getErrorMessage(error)}`,
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingExerciseRecords(false);
        }
      }
    };

    void loadExerciseRecords();

    return () => {
      isMounted = false;
    };
  }, [dataSearchMode, selectedDataExercise, selectedDataExerciseTag]);

  const updateExerciseRecord = async (recordId: string, sets: ExerciseRecordSet[]) => {
    if (savingExerciseRecordId || deletingExerciseRecordId) {
      return;
    }

    setSavingExerciseRecordId(recordId);
    try {
      const updated = await gymLogsApi.updateExerciseRecord(recordId, {
        sets: sets.map((set) => ({
          reps: set.reps,
          weight: set.weight,
          durationSeconds: set.durationSeconds,
          distanceMeters: set.distanceMeters,
        })),
      });
      const recentWorkouts = await gymLogsApi.getRecentWorkouts();
      setExerciseRecords((current) =>
        current.map((record) => record.id === recordId ? mapExerciseRecordToData(updated) : record),
      );
      setHistory(recentWorkouts.map(mapWorkoutToHistory));
      setNotice({ tone: 'success', message: 'Exercise record updated.' });
    } catch (error) {
      setNotice({
        tone: 'error',
        message: `Could not update exercise record. ${getErrorMessage(error)}`,
      });
      throw error;
    } finally {
      setSavingExerciseRecordId(null);
    }
  };

  const confirmDeleteExerciseRecord = (recordId: string) => {
    Alert.alert(
      'Delete exercise record?',
      'This removes the exercise and all its sets from the completed workout. This cannot be undone.',
      [
        { text: 'Keep record', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => { void deleteExerciseRecord(recordId); },
        },
      ],
    );
  };

  const deleteExerciseRecord = async (recordId: string) => {
    if (savingExerciseRecordId || deletingExerciseRecordId) {
      return;
    }

    setDeletingExerciseRecordId(recordId);
    try {
      await gymLogsApi.deleteExerciseRecord(recordId);
      const recentWorkouts = await gymLogsApi.getRecentWorkouts();
      setExerciseRecords((current) => current.filter((record) => record.id !== recordId));
      setHistory(recentWorkouts.map(mapWorkoutToHistory));
      setNotice({ tone: 'success', message: 'Exercise record deleted.' });
    } catch (error) {
      setNotice({
        tone: 'error',
        message: `Could not delete exercise record. ${getErrorMessage(error)}`,
      });
    } finally {
      setDeletingExerciseRecordId(null);
    }
  };

  useEffect(() => {
    if (!notice) {
      return;
    }

    noticeOpacity.setValue(1);
    const fadeTimeout = setTimeout(() => {
      Animated.timing(noticeOpacity, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setNotice(null);
        }
      });
    }, 1800);

    return () => {
      clearTimeout(fadeTimeout);
      noticeOpacity.stopAnimation();
    };
  }, [notice, noticeOpacity]);

  const createExercise = async () => {
    const name = newExerciseName.trim();
    if (!name || isCreatingExercise) {
      return;
    }

    setIsCreatingExercise(true);
    try {
      const exercise = await gymLogsApi.createExercise(name, newExerciseSetType);
      setExercises((current) => sortExercises([...current, exercise]));
      setNewExerciseName('');
      setNewExerciseSetType(DEFAULT_EXERCISE_SET_TYPE);
      setNotice({ tone: 'success', message: 'Exercise created.' });
    } catch (error) {
      setNotice({
        tone: 'error',
        message: `Could not create exercise. ${getErrorMessage(error)}`,
      });
    } finally {
      setIsCreatingExercise(false);
    }
  };

  const createWorkoutTag = async () => {
    const name = newWorkoutTagName.trim();
    if (!name || isCreatingWorkoutTag) {
      return;
    }

    setIsCreatingWorkoutTag(true);
    try {
      const tag = await gymLogsApi.createWorkoutTag(name, newWorkoutTagColor);
      setWorkoutTags((current) => sortWorkoutTags([...current, tag]));
      setNewWorkoutTagName('');
      setNotice({ tone: 'success', message: 'Workout tag created.' });
    } catch (error) {
      setNotice({
        tone: 'error',
        message: `Could not create workout tag. ${getErrorMessage(error)}`,
      });
    } finally {
      setIsCreatingWorkoutTag(false);
    }
  };

  const createExerciseTag = async () => {
    const name = newExerciseTagName.trim();
    if (!name || isCreatingExerciseTag) {
      return;
    }

    setIsCreatingExerciseTag(true);
    try {
      const tag = await gymLogsApi.createExerciseTag(name, newExerciseTagColor);
      setExerciseTags((current) => sortExerciseTags([...current, tag]));
      setNewExerciseTagName('');
      setNotice({ tone: 'success', message: 'Exercise tag created.' });
    } catch (error) {
      setNotice({
        tone: 'error',
        message: `Could not create exercise tag. ${getErrorMessage(error)}`,
      });
    } finally {
      setIsCreatingExerciseTag(false);
    }
  };

  const addExerciseToWorkout = (exercise: Exercise) => {
    const workoutExerciseId = createId();
    setWorkoutExercises((current) => [
      ...current,
      {
        id: workoutExerciseId,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        setType: exercise.setType,
        selectedExerciseTagIds: [],
        sets: createDefaultSets(),
      },
    ]);
    setExpandedWorkoutExerciseId(workoutExerciseId);
    setIsWorkoutStarted(true);
    setExerciseSearchText('');
    setIsExerciseDialogOpen(false);
  };

  const addExerciseToTemplate = (exercise: Exercise) => {
    setTemplateExercises((current) =>
      current.some((item) => item.exercise.id === exercise.id)
        ? current
        : [...current, { exercise, setCount: 3 }],
    );
    setTemplateExerciseSearchText('');
    setIsTemplateExerciseDialogOpen(false);
  };

  const toggleTemplateTag = (tagId: string) => {
    setTemplateTagIds((current) =>
      current.includes(tagId)
        ? current.filter((currentTagId) => currentTagId !== tagId)
        : [...current, tagId],
    );
  };

  const saveWorkoutTemplate = async () => {
    const name = templateName.trim();
    if (!name || templateExercises.length === 0 || isSavingTemplate) {
      return;
    }

    setIsSavingTemplate(true);
    try {
      const exercises = templateExercises.map((item) => ({
        exerciseId: item.exercise.id,
        setCount: item.setCount,
      }));
      const template = editingTemplateId
        ? await gymLogsApi.updateWorkoutTemplate(
            editingTemplateId,
            name,
            templateTagIds,
            exercises,
          )
        : await gymLogsApi.createWorkoutTemplate(name, templateTagIds, exercises);
      setWorkoutTemplates((current) =>
        (editingTemplateId
          ? current.map((item) => (item.id === editingTemplateId ? template : item))
          : [...current, template]
        ).sort((left, right) => left.name.localeCompare(right.name)),
      );
      setTemplateName('');
      setTemplateExercises([]);
      setTemplateTagIds([]);
      setEditingTemplateId(null);
      setNotice({
        tone: 'success',
        message: editingTemplateId ? 'Workout template updated.' : 'Workout template saved.',
      });
    } catch (error) {
      setNotice({
        tone: 'error',
        message: `Could not save workout template. ${getErrorMessage(error)}`,
      });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const editWorkoutTemplate = (template: WorkoutTemplate) => {
    setEditingTemplateId(template.id);
    setTemplateName(template.name);
    setTemplateTagIds(template.tags.map((tag) => tag.id));
    setTemplateExercises(template.exercises.map((item) => ({ ...item })));
    setTemplateExerciseSearchText('');
    setIsTemplateExerciseDialogOpen(false);
    requestAnimationFrame(() => {
      plannerScrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  };

  const cancelEditingWorkoutTemplate = () => {
    setEditingTemplateId(null);
    setTemplateName('');
    setTemplateExercises([]);
    setTemplateTagIds([]);
    setTemplateExerciseSearchText('');
  };

  const loadWorkoutTemplate = (template: WorkoutTemplate) => {
    const entries = template.exercises.map(({ exercise, setCount }) => ({
      id: createId(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      setType: exercise.setType,
      selectedExerciseTagIds: [],
      sets: createDefaultSets(setCount),
    }));

    setWorkoutExercises(entries);
    setSelectedWorkoutTagIds(template.tags.map((tag) => tag.id));
    setWorkoutNotes('');
    setExpandedWorkoutExerciseId(entries[0]?.id ?? null);
    setIsWorkoutStarted(true);
    setNotice({ tone: 'success', message: `${template.name} loaded.` });
  };

  const confirmDeleteWorkoutTemplate = (template: WorkoutTemplate) => {
    Alert.alert('Delete template?', `Delete ${template.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteWorkoutTemplate(template.id);
        },
      },
    ]);
  };

  const deleteWorkoutTemplate = async (templateId: string) => {
    if (deletingTemplateId) {
      return;
    }

    setDeletingTemplateId(templateId);
    try {
      await gymLogsApi.deleteWorkoutTemplate(templateId);
      setWorkoutTemplates((current) => current.filter((template) => template.id !== templateId));
      if (editingTemplateId === templateId) {
        cancelEditingWorkoutTemplate();
      }
      setNotice({ tone: 'success', message: 'Workout template deleted.' });
    } catch (error) {
      setNotice({
        tone: 'error',
        message: `Could not delete workout template. ${getErrorMessage(error)}`,
      });
    } finally {
      setDeletingTemplateId(null);
    }
  };

  const updateExerciseSearch = (value: string) => {
    setExerciseSearchText(value);
  };

  const openExerciseDialog = () => {
    setExerciseSearchText('');
    setIsExerciseDialogOpen(true);
  };

  const clearSelectedDataExercise = () => {
    setSelectedDataExercise(null);
    setExerciseRecords([]);
  };

  const clearDataTagResults = () => {
    setSelectedDataExerciseTag(null);
    setSelectedDataWorkoutTag(null);
    setDataExerciseTagExercises([]);
    setDataWorkoutTagWorkouts([]);
  };

  const changeDataSearchMode = (mode: DataSearchMode) => {
    if (mode === dataSearchMode) {
      return;
    }

    setDataSearchMode(mode);
    setDataExerciseSearchText('');
    setDataExerciseTagSearchText('');
    setDataWorkoutTagSearchText('');
    setIsDataExerciseDialogOpen(false);
    setIsDataExerciseTagDialogOpen(false);
    setIsDataWorkoutTagDialogOpen(false);
    clearSelectedDataExercise();
    clearDataTagResults();
  };

  const updateDataExerciseSearch = (value: string) => {
    setDataExerciseSearchText(value);

    if (selectedDataExercise && value.trim().length > 0) {
      clearSelectedDataExercise();
    }
  };

  const updateDataExerciseTagSearch = (value: string) => {
    setDataExerciseTagSearchText(value);

    if (selectedDataExerciseTag && value.trim().length > 0) {
      setSelectedDataExerciseTag(null);
      setDataExerciseTagExercises([]);
      clearSelectedDataExercise();
    }
  };

  const updateDataWorkoutTagSearch = (value: string) => {
    setDataWorkoutTagSearchText(value);

    if (selectedDataWorkoutTag && value.trim().length > 0) {
      setSelectedDataWorkoutTag(null);
      setDataWorkoutTagWorkouts([]);
    }
  };

  const selectDataExercise = (exercise: Exercise) => {
    setSelectedDataExercise(exercise);
    setDataExerciseSearchText('');
    setIsDataExerciseDialogOpen(false);
  };

  const selectDataExerciseTag = async (tag: ExerciseTag) => {
    setSelectedDataExerciseTag(tag);
    setDataExerciseTagSearchText('');
    setIsDataExerciseTagDialogOpen(false);
    clearSelectedDataExercise();
    setDataExerciseTagExercises([]);
    setIsLoadingDataTagResults(true);

    try {
      const loadedExercises = await gymLogsApi.getExerciseTagExercises(tag.id);
      setDataExerciseTagExercises(sortExercises(loadedExercises));
    } catch (error) {
      setNotice({
        tone: 'error',
        message: `Could not load exercises for ${tag.name}. ${getErrorMessage(error)}`,
      });
    } finally {
      setIsLoadingDataTagResults(false);
    }
  };

  const selectDataWorkoutTag = async (tag: WorkoutTag) => {
    setSelectedDataWorkoutTag(tag);
    setDataWorkoutTagSearchText('');
    setIsDataWorkoutTagDialogOpen(false);
    setDataWorkoutTagWorkouts([]);
    setIsLoadingDataTagResults(true);

    try {
      const loadedWorkouts = await gymLogsApi.getWorkoutTagWorkouts(tag.id);
      setDataWorkoutTagWorkouts(loadedWorkouts.map(mapWorkoutToHistory));
    } catch (error) {
      setNotice({
        tone: 'error',
        message: `Could not load workouts for ${tag.name}. ${getErrorMessage(error)}`,
      });
    } finally {
      setIsLoadingDataTagResults(false);
    }
  };

  const openDataExerciseDialog = () => {
    setIsDataExerciseDialogOpen(true);
  };

  const openDataExerciseTagDialog = () => {
    setIsDataExerciseTagDialogOpen(true);
  };

  const openDataWorkoutTagDialog = () => {
    setIsDataWorkoutTagDialogOpen(true);
  };

  const openSettingsExerciseDialog = () => {
    setIsSettingsExerciseDialogOpen(true);
  };

  const openSettingsWorkoutTagDialog = () => {
    setIsSettingsWorkoutTagDialogOpen(true);
  };

  const openSettingsExerciseTagDialog = () => {
    setIsSettingsExerciseTagDialogOpen(true);
  };

  const toggleWorkoutTag = (tagId: string) => {
    setSelectedWorkoutTagIds((current) =>
      current.includes(tagId)
        ? current.filter((currentTagId) => currentTagId !== tagId)
        : [...current, tagId],
    );
  };

  const clearWorkoutTags = () => {
    setSelectedWorkoutTagIds([]);
  };
  const toggleExerciseTag = (workoutExerciseId: string, tagId: string) => {
    setWorkoutExercises((current) =>
      current.map((entry) =>
        entry.id === workoutExerciseId
          ? {
              ...entry,
              selectedExerciseTagIds: entry.selectedExerciseTagIds.includes(tagId)
                ? entry.selectedExerciseTagIds.filter((currentTagId) => currentTagId !== tagId)
                : [...entry.selectedExerciseTagIds, tagId],
            }
          : entry,
      ),
    );
  };

  const clearExerciseTags = (workoutExerciseId: string) => {
    setWorkoutExercises((current) =>
      current.map((entry) =>
        entry.id === workoutExerciseId ? { ...entry, selectedExerciseTagIds: [] } : entry,
      ),
    );
  };

  const toggleWorkoutExercise = (workoutExerciseId: string) => {
    setExpandedWorkoutExerciseId((current) =>
      current === workoutExerciseId ? null : workoutExerciseId,
    );
  };

  const addSet = (workoutExerciseId: string) => {
    setWorkoutExercises((current) =>
      current.map((entry) =>
        entry.id === workoutExerciseId
          ? entry.sets.length >= MAX_WORKOUT_SETS
            ? entry
            : { ...entry, sets: [...entry.sets, createEmptySet()] }
          : entry,
      ),
    );
  };

  const removeSet = (workoutExerciseId: string) => {
    setWorkoutExercises((current) =>
      current.map((entry) =>
        entry.id === workoutExerciseId
          ? entry.sets.length <= MIN_WORKOUT_SETS
            ? entry
            : { ...entry, sets: entry.sets.slice(0, -1) }
          : entry,
      ),
    );
  };

  const removeExerciseFromWorkout = (workoutExerciseId: string) => {
    const isRemovingLastExercise =
      workoutExercises.length === 1 && workoutExercises[0].id === workoutExerciseId;

    setWorkoutExercises((current) => current.filter((entry) => entry.id !== workoutExerciseId));
    setExpandedWorkoutExerciseId((current) => (current === workoutExerciseId ? null : current));

    if (isRemovingLastExercise) {
      setSelectedWorkoutTagIds([]);
      setWorkoutNotes('');
      setIsWorkoutStarted(false);
      void removeWorkoutDraft();
    }
  };

  const updateSet = (
    workoutExerciseId: string,
    setId: string,
    field: 'reps' | 'weight' | 'durationMinutes' | 'durationSeconds' | 'distanceKm',
    value: string,
  ) => {
    setWorkoutExercises((current) =>
      current.map((entry) =>
        entry.id === workoutExerciseId
          ? {
              ...entry,
              sets: entry.sets.map((set) =>
                set.id === setId ? { ...set, [field]: value } : set,
              ),
            }
          : entry,
      ),
    );
  };

  const clearActiveWorkout = () => {
    setSelectedWorkoutTagIds([]);
    setWorkoutNotes('');
    setWorkoutExercises([]);
    setExpandedWorkoutExerciseId(null);
    setIsWorkoutStarted(false);
  };

  const exportBackup = async () => {
    if (isTransferringDatabase) {
      return;
    }

    setIsTransferringDatabase(true);
    try {
      await exportDatabaseBackup();
      setNotice({ tone: 'success', message: 'Database backup exported.' });
    } catch (error) {
      setNotice({
        tone: 'error',
        message: `Could not export database. ${getErrorMessage(error)}`,
      });
    } finally {
      setIsTransferringDatabase(false);
    }
  };

  const importBackup = async () => {
    if (isTransferringDatabase) {
      return;
    }

    setIsTransferringDatabase(true);
    try {
      const imported = await pickAndImportDatabaseBackup();
      if (!imported) {
        return;
      }

      const [loadedExercises, recentWorkouts, loadedWorkoutFocuses, loadedExerciseMarkers, loadedTemplates] =
        await Promise.all([
          gymLogsApi.getExercises(),
          gymLogsApi.getRecentWorkouts(),
          gymLogsApi.getWorkoutFocuses(),
          gymLogsApi.getExerciseMarkers(),
          gymLogsApi.getWorkoutTemplates(),
        ]);

      clearActiveWorkout();
      await removeWorkoutDraft();
      setExercises(sortExercises(loadedExercises));
      setWorkoutTags(sortWorkoutTags(loadedWorkoutFocuses));
      setExerciseTags(sortExerciseTags(loadedExerciseMarkers));
      setWorkoutTemplates(loadedTemplates);
      setHistory(recentWorkouts.map(mapWorkoutToHistory));
      setSelectedDataExercise(null);
      setSelectedDataExerciseTag(null);
      setSelectedDataWorkoutTag(null);
      setExerciseRecords([]);
      setDataExerciseTagExercises([]);
      setDataWorkoutTagWorkouts([]);
      setNotice({ tone: 'success', message: 'Database backup imported.' });
    } catch (error) {
      setNotice({
        tone: 'error',
        message: `Could not import database. ${getErrorMessage(error)}`,
      });
    } finally {
      setIsTransferringDatabase(false);
    }
  };

  const confirmImportBackup = () => {
    Alert.alert(
      'Replace local data?',
      'Importing a backup replaces all current SweatLogs data on this phone. Export your current database first if you may need it later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose backup',
          style: 'destructive',
          onPress: () => { void importBackup(); },
        },
      ],
    );
  };

  const confirmCancelWorkout = () => {
    Alert.alert(
      'Cancel workout?',
      'All exercises, sets, focus selections, and notes in this workout will be cleared.',
      [
        { text: 'Keep workout', style: 'cancel' },
        {
          text: 'Cancel workout',
          style: 'destructive',
          onPress: () => {
            clearActiveWorkout();
            void removeWorkoutDraft();
            setNotice({ tone: 'success', message: 'Workout cancelled.' });
          },
        },
      ],
    );
  };

  const saveWorkout = async () => {
    if (workoutExercises.length === 0 || isSavingWorkout) {
      return;
    }

    const workoutRequest = buildWorkoutRequest(
      selectedWorkoutTagIds,
      workoutNotes,
      workoutExercises,
    );
    if ('error' in workoutRequest) {
      setNotice({ tone: 'error', message: workoutRequest.error });
      return;
    }

    setIsSavingWorkout(true);
    try {
      await gymLogsApi.createWorkout(workoutRequest.request);
      const recentWorkouts = await gymLogsApi.getRecentWorkouts();
      setHistory(recentWorkouts.map(mapWorkoutToHistory));
      clearActiveWorkout();
      await removeWorkoutDraft();
      setNotice({ tone: 'success', message: 'Workout saved.' });
    } catch (error) {
      setNotice({
        tone: 'error',
        message: `Could not save workout. ${getErrorMessage(error)}`,
      });
    } finally {
      setIsSavingWorkout(false);
    }
  };

  const confirmDeleteWorkout = (workout: WorkoutHistory) => {
    Alert.alert(
      'Delete workout?',
      `Delete workout from ${workout.completedAt}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => {
            void deleteWorkout(workout.id);
          },
          style: 'destructive',
        },
      ],
    );
  };

  const deleteWorkout = async (workoutId: string) => {
    if (deletingWorkoutId) {
      return;
    }

    setDeletingWorkoutId(workoutId);
    try {
      await gymLogsApi.deleteWorkout(workoutId);
      const recentWorkouts = await gymLogsApi.getRecentWorkouts();
      setHistory(recentWorkouts.map(mapWorkoutToHistory));
      setNotice(null);
    } catch (error) {
      setNotice({
        tone: 'error',
        message: `Could not delete workout. ${getErrorMessage(error)}`,
      });
    } finally {
      setDeletingWorkoutId(null);
    }
  };

  const confirmDeleteExercise = (exercise: Exercise) => {
    Alert.alert(
      'Delete exercise?',
      `Remove ${exercise.name} from exercise pickers? Past workouts stay unchanged.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => {
            void deleteExercise(exercise.id);
          },
          style: 'destructive',
        },
      ],
    );
  };

  const deleteExercise = async (exerciseId: string) => {
    if (deletingExerciseId) {
      return;
    }

    const wasSelectedDataExercise = selectedDataExercise?.id === exerciseId;
    const removedExpandedWorkoutExerciseId = workoutExercises.find(
      (entry) => entry.id === expandedWorkoutExerciseId && entry.exerciseId === exerciseId,
    )?.id;

    setDeletingExerciseId(exerciseId);
    try {
      await gymLogsApi.deleteExercise(exerciseId);
      const [loadedExercises, recentWorkouts] = await Promise.all([
        gymLogsApi.getExercises(),
        gymLogsApi.getRecentWorkouts(),
      ]);

      setExercises(sortExercises(loadedExercises));
      setWorkoutExercises((current) => current.filter((entry) => entry.exerciseId !== exerciseId));
      setExpandedWorkoutExerciseId((current) =>
        current === removedExpandedWorkoutExerciseId ? null : current,
      );
      setHistory(recentWorkouts.map(mapWorkoutToHistory));
      setSelectedDataExercise((current) => (current?.id === exerciseId ? null : current));
      setDataExerciseTagExercises((current) => current.filter((exercise) => exercise.id !== exerciseId));

      if (wasSelectedDataExercise) {
        setExerciseRecords([]);
      }

      setNotice({ tone: 'success', message: 'Exercise removed.' });
    } catch (error) {
      setNotice({
        tone: 'error',
        message: `Could not delete exercise. ${getErrorMessage(error)}`,
      });
    } finally {
      setDeletingExerciseId(null);
    }
  };

  const confirmDeleteWorkoutTag = (tag: WorkoutTag) => {
    Alert.alert(
      'Delete workout tag?',
      `Remove ${tag.name} from workout tag pickers? Past workouts stay unchanged.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => {
            void deleteWorkoutTag(tag.id);
          },
          style: 'destructive',
        },
      ],
    );
  };

  const deleteWorkoutTag = async (workoutTagId: string) => {
    if (deletingWorkoutTagId) {
      return;
    }

    setDeletingWorkoutTagId(workoutTagId);
    try {
      await gymLogsApi.deleteWorkoutTag(workoutTagId);
      const [loadedWorkoutTags, recentWorkouts] = await Promise.all([
        gymLogsApi.getWorkoutFocuses(),
        gymLogsApi.getRecentWorkouts(),
      ]);

      setWorkoutTags(sortWorkoutTags(loadedWorkoutTags));
      setSelectedWorkoutTagIds((current) => current.filter((tagId) => tagId !== workoutTagId));
      setHistory(recentWorkouts.map(mapWorkoutToHistory));

      if (selectedDataWorkoutTag?.id === workoutTagId) {
        setSelectedDataWorkoutTag(null);
        setDataWorkoutTagWorkouts([]);
      }

      setNotice({ tone: 'success', message: 'Workout tag removed.' });
    } catch (error) {
      setNotice({
        tone: 'error',
        message: `Could not delete workout tag. ${getErrorMessage(error)}`,
      });
    } finally {
      setDeletingWorkoutTagId(null);
    }
  };

  const confirmDeleteExerciseTag = (tag: ExerciseTag) => {
    Alert.alert(
      'Delete exercise tag?',
      `Remove ${tag.name} from exercise tag pickers? Past workouts stay unchanged.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => {
            void deleteExerciseTag(tag.id);
          },
          style: 'destructive',
        },
      ],
    );
  };

  const deleteExerciseTag = async (exerciseTagId: string) => {
    if (deletingExerciseTagId) {
      return;
    }

    setDeletingExerciseTagId(exerciseTagId);
    try {
      await gymLogsApi.deleteExerciseTag(exerciseTagId);
      const [loadedExerciseTags, recentWorkouts] = await Promise.all([
        gymLogsApi.getExerciseMarkers(),
        gymLogsApi.getRecentWorkouts(),
      ]);

      setExerciseTags(sortExerciseTags(loadedExerciseTags));
      setWorkoutExercises((current) =>
        current.map((entry) => ({
          ...entry,
          selectedExerciseTagIds: entry.selectedExerciseTagIds.filter(
            (tagId) => tagId !== exerciseTagId,
          ),
        })),
      );
      setHistory(recentWorkouts.map(mapWorkoutToHistory));

      if (selectedDataExerciseTag?.id === exerciseTagId) {
        setSelectedDataExerciseTag(null);
        setDataExerciseTagExercises([]);
        clearSelectedDataExercise();
      }

      setNotice({ tone: 'success', message: 'Exercise tag removed.' });
    } catch (error) {
      setNotice({
        tone: 'error',
        message: `Could not delete exercise tag. ${getErrorMessage(error)}`,
      });
    } finally {
      setDeletingExerciseTagId(null);
    }
  };

  if (isSplashVisible) {
    return (
      <SafeAreaProvider>
        <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.splashScreen}>
          <StatusBar style="dark" />
          <Text style={styles.splashTitle}>SweatLogs</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleBlock}>
              <View style={styles.noticeSlot}>
                {notice && (
                  <Animated.View
                    style={[
                      styles.notice,
                      notice.tone === 'error' && styles.noticeError,
                      { opacity: noticeOpacity },
                    ]}
					>
					<Text style={[styles.noticeText, notice.tone === 'error' && styles.noticeTextError]}>
                      {notice.message}
                    </Text>
                  </Animated.View>
                )}
              </View>
            </View>
          </View>
        </View>

        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#214E3A',
            tabBarInactiveTintColor: '#54635A',
            tabBarIcon: ({ color, size }) => {
              const iconName =
                route.name === 'Workout'
                  ? 'barbell'
                  : route.name === 'Planner'
                    ? 'clipboard'
                  : route.name === 'Calendar'
                    ? 'calendar'
                    : route.name === 'Data'
                      ? 'stats-chart'
                      : 'settings';
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '800',
            },
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopColor: '#E0E4DD',
              minHeight: 60,
              paddingBottom: 8,
              paddingTop: 6,
            },
          })}
        >
          <Tab.Screen name="Workout">
            {() => (
              <ScrollView contentContainerStyle={styles.content}>
                <WorkoutView
                  exerciseSearchText={exerciseSearchText}
                  exercises={exercises}
                  exerciseTags={exerciseTags}
                  expandedWorkoutExerciseId={expandedWorkoutExerciseId}
                  isExerciseDialogOpen={isExerciseDialogOpen}
                  isLoading={isLoading}
                  isSavingWorkout={isSavingWorkout}
                  isWorkoutStarted={isWorkoutStarted}
                  workoutTags={workoutTags}
                  selectedWorkoutTagIds={selectedWorkoutTagIds}
                  workoutNotes={workoutNotes}
                  workoutExercises={workoutExercises}
                  workoutTotals={workoutTotals}
                  workoutTemplates={workoutTemplates}
                  onAddExerciseToWorkout={addExerciseToWorkout}
                  onAddSet={addSet}
                  onCloseExerciseDialog={() => setIsExerciseDialogOpen(false)}
                  onChangeExerciseSearch={updateExerciseSearch}
                  onChangeWorkoutNotes={setWorkoutNotes}
                  onToggleWorkoutTag={toggleWorkoutTag}
                  onToggleExerciseTag={toggleExerciseTag}
                  onClearWorkoutTags={clearWorkoutTags}
                  onClearExerciseSearch={() => setExerciseSearchText('')}
                  onClearExerciseTags={clearExerciseTags}
                  onRemoveExerciseFromWorkout={removeExerciseFromWorkout}
                  onRemoveSet={removeSet}
                  onSaveWorkout={saveWorkout}
                  onCancelWorkout={confirmCancelWorkout}
                  onOpenExerciseDialog={openExerciseDialog}
                  onToggleWorkoutExercise={toggleWorkoutExercise}
                  onUpdateSet={updateSet}
                  onLoadTemplate={loadWorkoutTemplate}
                />
              </ScrollView>
            )}
          </Tab.Screen>
          <Tab.Screen name="Planner">
            {() => (
              <ScrollView ref={plannerScrollRef} contentContainerStyle={styles.content}>
                <PlannerView
                  deletingTemplateId={deletingTemplateId}
                  editingTemplateId={editingTemplateId}
                  exerciseSearchText={templateExerciseSearchText}
                  exercises={exercises}
                  isExerciseDialogOpen={isTemplateExerciseDialogOpen}
                  isSaving={isSavingTemplate}
                  selectedExercises={templateExercises}
                  selectedTagIds={templateTagIds}
                  templateName={templateName}
                  templates={workoutTemplates}
                  workoutTags={workoutTags}
                  onAddExercise={addExerciseToTemplate}
                  onChangeExerciseSearch={setTemplateExerciseSearchText}
                  onChangeTemplateName={setTemplateName}
                  onClearExerciseSearch={() => setTemplateExerciseSearchText('')}
                  onCloseExerciseDialog={() => setIsTemplateExerciseDialogOpen(false)}
                  onCancelEdit={cancelEditingWorkoutTemplate}
                  onDelete={confirmDeleteWorkoutTemplate}
                  onEdit={editWorkoutTemplate}
                  onOpenExerciseDialog={() => setIsTemplateExerciseDialogOpen(true)}
                  onRemoveExercise={(exerciseId) =>
                    setTemplateExercises((current) =>
                      current.filter((item) => item.exercise.id !== exerciseId),
                    )
                  }
                  onUpdateSetCount={(exerciseId, setCount) =>
                    setTemplateExercises((current) =>
                      current.map((item) =>
                        item.exercise.id === exerciseId ? { ...item, setCount } : item,
                      ),
                    )
                  }
                  onSave={() => {
                    void saveWorkoutTemplate();
                  }}
                  onToggleTag={toggleTemplateTag}
                />
              </ScrollView>
            )}
          </Tab.Screen>
          <Tab.Screen name="Calendar">
            {() => (
              <ScrollView contentContainerStyle={styles.content}>
                <CalendarView
                  deletingWorkoutId={deletingWorkoutId}
                  deletingRecordId={deletingExerciseRecordId}
                  history={history}
                  isLoading={isLoading}
                  savingRecordId={savingExerciseRecordId}
                  onDeleteWorkout={confirmDeleteWorkout}
                  onDeleteRecord={confirmDeleteExerciseRecord}
                  onUpdateRecord={updateExerciseRecord}
                />
              </ScrollView>
            )}
          </Tab.Screen>
          <Tab.Screen name="Data">
            {() => (
              <ScrollView contentContainerStyle={styles.content}>
                <DataView
                  dataSearchMode={dataSearchMode}
                  exerciseSearchText={dataExerciseSearchText}
                  exerciseTagSearchText={dataExerciseTagSearchText}
                  workoutTagSearchText={dataWorkoutTagSearchText}
                  exercises={exercises}
                  exerciseTags={exerciseTags}
                  workoutTags={workoutTags}
                  exerciseTagExercises={dataExerciseTagExercises}
                  workoutTagWorkouts={dataWorkoutTagWorkouts}
                  isExerciseDialogOpen={isDataExerciseDialogOpen}
                  isExerciseTagDialogOpen={isDataExerciseTagDialogOpen}
                  isWorkoutTagDialogOpen={isDataWorkoutTagDialogOpen}
                  isLoading={isLoading}
                  isLoadingRecords={isLoadingExerciseRecords}
                  isLoadingTagResults={isLoadingDataTagResults}
                  records={exerciseRecords}
                  savingRecordId={savingExerciseRecordId}
                  deletingRecordId={deletingExerciseRecordId}
                  selectedExercise={selectedDataExercise}
                  selectedExerciseTag={selectedDataExerciseTag}
                  selectedWorkoutTag={selectedDataWorkoutTag}
                  onChangeDataSearchMode={changeDataSearchMode}
                  onChangeExerciseSearch={updateDataExerciseSearch}
                  onChangeExerciseTagSearch={updateDataExerciseTagSearch}
                  onChangeWorkoutTagSearch={updateDataWorkoutTagSearch}
                  onClearExerciseSearch={() => {
                    setDataExerciseSearchText('');
                    clearSelectedDataExercise();
                  }}
                  onClearExerciseTagSearch={() => {
                    setDataExerciseTagSearchText('');
                    setSelectedDataExerciseTag(null);
                    setDataExerciseTagExercises([]);
                    clearSelectedDataExercise();
                  }}
                  onClearWorkoutTagSearch={() => {
                    setDataWorkoutTagSearchText('');
                    setSelectedDataWorkoutTag(null);
                    setDataWorkoutTagWorkouts([]);
                  }}
                  onClearSelectedExercise={clearSelectedDataExercise}
                  onCloseExerciseDialog={() => setIsDataExerciseDialogOpen(false)}
                  onCloseExerciseTagDialog={() => setIsDataExerciseTagDialogOpen(false)}
                  onCloseWorkoutTagDialog={() => setIsDataWorkoutTagDialogOpen(false)}
                  onOpenExerciseDialog={openDataExerciseDialog}
                  onOpenExerciseTagDialog={openDataExerciseTagDialog}
                  onOpenWorkoutTagDialog={openDataWorkoutTagDialog}
                  onSelectExercise={selectDataExercise}
                  onSelectExerciseTag={(tag) => {
                    void selectDataExerciseTag(tag);
                  }}
                  onSelectWorkoutTag={(tag) => {
                    void selectDataWorkoutTag(tag);
                  }}
                  onUpdateRecord={updateExerciseRecord}
                  onDeleteRecord={confirmDeleteExerciseRecord}
                />
              </ScrollView>
            )}
          </Tab.Screen>
          <Tab.Screen name="Settings">
            {() => (
              <ScrollView contentContainerStyle={styles.content}>
                <SettingsView
                  deletingExerciseId={deletingExerciseId}
                  deletingExerciseTagId={deletingExerciseTagId}
                  deletingWorkoutTagId={deletingWorkoutTagId}
                  exercises={exercises}
                  exerciseTags={exerciseTags}
                  workoutTags={workoutTags}
                  isExerciseDialogOpen={isSettingsExerciseDialogOpen}
                  isExerciseTagDialogOpen={isSettingsExerciseTagDialogOpen}
                  isWorkoutTagDialogOpen={isSettingsWorkoutTagDialogOpen}
                  isCreatingExercise={isCreatingExercise}
                  isCreatingExerciseTag={isCreatingExerciseTag}
                  isCreatingWorkoutTag={isCreatingWorkoutTag}
                  isLoading={isLoading}
                  isTransferringDatabase={isTransferringDatabase}
                  newExerciseName={newExerciseName}
                  newExerciseSetType={newExerciseSetType}
                  newExerciseTagColor={newExerciseTagColor}
                  newExerciseTagName={newExerciseTagName}
                  newWorkoutTagColor={newWorkoutTagColor}
                  newWorkoutTagName={newWorkoutTagName}
                  onChangeNewExerciseName={setNewExerciseName}
                  onChangeNewExerciseSetType={setNewExerciseSetType}
                  onChangeNewExerciseTagColor={setNewExerciseTagColor}
                  onChangeNewExerciseTagName={setNewExerciseTagName}
                  onChangeNewWorkoutTagColor={setNewWorkoutTagColor}
                  onChangeNewWorkoutTagName={setNewWorkoutTagName}
                  onCloseExerciseDialog={() => setIsSettingsExerciseDialogOpen(false)}
                  onCloseExerciseTagDialog={() => setIsSettingsExerciseTagDialogOpen(false)}
                  onCloseWorkoutTagDialog={() => setIsSettingsWorkoutTagDialogOpen(false)}
                  onCreateExercise={createExercise}
                  onCreateExerciseTag={createExerciseTag}
                  onCreateWorkoutTag={createWorkoutTag}
                  onDeleteExercise={confirmDeleteExercise}
                  onDeleteExerciseTag={confirmDeleteExerciseTag}
                  onDeleteWorkoutTag={confirmDeleteWorkoutTag}
                  onOpenExerciseDialog={openSettingsExerciseDialog}
                  onOpenExerciseTagDialog={openSettingsExerciseTagDialog}
                  onOpenWorkoutTagDialog={openSettingsWorkoutTagDialog}
                  onExportDatabase={() => { void exportBackup(); }}
                  onImportDatabase={confirmImportBackup}
                />
              </ScrollView>
            )}
          </Tab.Screen>
        </Tab.Navigator>
        </SafeAreaView>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
