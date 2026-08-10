import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseRecordEditorModal } from '../components/ExerciseRecordEditorModal';
import { styles } from '../styles';
import { ExerciseRecordSet, WorkoutExerciseHistory, WorkoutHistory } from '../types';
import {
  DEFAULT_WORKOUT_TAG_COLOR,
  formatLocalDateKey,
  formatSetMetrics,
  formatWorkoutTagLabel,
} from '../utils/workoutUtils';
import { formatDate, t } from '../localization';

type CalendarViewProps = {
  deletingWorkoutId: string | null;
  deletingRecordId: string | null;
  history: WorkoutHistory[];
  isLoading: boolean;
  savingRecordId: string | null;
  onDeleteWorkout: (workout: WorkoutHistory) => void;
  onDeleteRecord: (recordId: string) => void;
  onUpdateRecord: (recordId: string, sets: ExerciseRecordSet[]) => Promise<void>;
};

type CalendarDay = {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
};

export function CalendarView({
  deletingWorkoutId,
  deletingRecordId,
  history,
  isLoading,
  savingRecordId,
  onDeleteWorkout,
  onDeleteRecord,
  onUpdateRecord,
}: CalendarViewProps) {
  const dayLabels = Array.from({ length: 7 }, (_, index) =>
    formatDate(new Date(2024, 0, index + 1), { weekday: 'short' }));
  const newestWorkoutDate = history[0]?.completedDateKey
    ? parseDateKey(history[0].completedDateKey)
    : new Date();
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(newestWorkoutDate));
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(
    history[0]?.completedDateKey ?? null,
  );
  const [expandedWorkoutIds, setExpandedWorkoutIds] = useState<string[]>([]);
  const [editingRecord, setEditingRecord] = useState<WorkoutExerciseHistory | null>(null);

  const beginEditingRecord = (record: WorkoutExerciseHistory) => {
    setEditingRecord(record);
  };

  const newestWorkoutDateKey = history[0]?.completedDateKey ?? null;
  const historyDateKeys = useMemo(
    () => new Set(history.map((workout) => workout.completedDateKey)),
    [history],
  );
  const historyWorkoutIds = useMemo(
    () => new Set(history.map((workout) => workout.id)),
    [history],
  );

  useEffect(() => {
    if (!newestWorkoutDateKey) {
      setSelectedDateKey(null);
      setExpandedWorkoutIds([]);
      return;
    }

    setSelectedDateKey((current) =>
      current && historyDateKeys.has(current) ? current : newestWorkoutDateKey,
    );
  }, [historyDateKeys, newestWorkoutDateKey]);

  useEffect(() => {
    if (!selectedDateKey) {
      return;
    }

    setVisibleMonth(startOfMonth(parseDateKey(selectedDateKey)));
  }, [selectedDateKey]);

  useEffect(() => {
    setExpandedWorkoutIds((current) => {
      const next = current.filter((workoutId) => historyWorkoutIds.has(workoutId));
      return next.length === current.length ? current : next;
    });
  }, [historyWorkoutIds]);

  const workoutsByDate = useMemo(() => {
    const grouped = new Map<string, WorkoutHistory[]>();

    for (const workout of history) {
      const workouts = grouped.get(workout.completedDateKey) ?? [];
      workouts.push(workout);
      grouped.set(workout.completedDateKey, workouts);
    }

    return grouped;
  }, [history]);

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const selectedWorkouts = selectedDateKey ? workoutsByDate.get(selectedDateKey) ?? [] : [];
  const singleSelectedWorkoutId =
    selectedWorkouts.length === 1 ? selectedWorkouts[0].id : null;

  useEffect(() => {
    if (!singleSelectedWorkoutId) {
      return;
    }

    setExpandedWorkoutIds((current) =>
      current.includes(singleSelectedWorkoutId) ? current : [...current, singleSelectedWorkoutId],
    );
  }, [singleSelectedWorkoutId]);

  const changeMonth = (offset: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const selectDay = (day: CalendarDay) => {
    setSelectedDateKey(day.dateKey);
    setVisibleMonth(startOfMonth(day.date));
  };

  const toggleWorkoutExpanded = (workoutId: string) => {
    setExpandedWorkoutIds((current) =>
      current.includes(workoutId)
        ? current.filter((id) => id !== workoutId)
        : [...current, workoutId],
    );
  };

  return (
    <>
      <View style={styles.section}>
        <View style={styles.calendarHeader}>
          <Pressable onPress={() => changeMonth(-1)} style={styles.calendarNavButton}>
            <Text style={styles.calendarNavText}>{t('calendar.previous')}</Text>
          </Pressable>
          <Text style={styles.calendarTitle}>
            {formatDate(visibleMonth, { month: 'long', year: 'numeric' })}
          </Text>
          <Pressable onPress={() => changeMonth(1)} style={styles.calendarNavButton}>
            <Text style={styles.calendarNavText}>{t('calendar.next')}</Text>
          </Pressable>
        </View>

        <View style={styles.calendarWeekRow}>
          {dayLabels.map((label) => (
            <Text key={label} style={styles.calendarWeekday}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarDays.map((day) => {
            const workouts = workoutsByDate.get(day.dateKey) ?? [];
            const isSelected = day.dateKey === selectedDateKey;

            return (
              <Pressable
                key={day.dateKey}
                onPress={() => selectDay(day)}
                style={styles.calendarCell}
              >
                <View
                  style={[
                    styles.calendarDay,
                    !day.isCurrentMonth && styles.calendarDayMuted,
                    workouts.length > 0 && styles.calendarDayWithWorkout,
                    isSelected && styles.calendarDaySelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.calendarDayText,
                      !day.isCurrentMonth && styles.calendarDayTextMuted,
                      isSelected && styles.calendarDayTextSelected,
                    ]}
                  >
                    {day.dayNumber}
                  </Text>
                  {workouts.length > 0 && (
                    <View style={styles.calendarWorkoutDots}>
                      {workouts.flatMap((workout) =>
                        getWorkoutTagIndicators(workout).map((indicator) => (
                          <View
                            key={indicator.key}
                            style={[
                              styles.calendarWorkoutDot,
                              { backgroundColor: indicator.color },
                              isSelected && styles.calendarWorkoutDotSelected,
                            ]}
                          />
                        )),
                      )}
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.historyItem}>
          <Text style={styles.emptyText}>{t('calendar.loadingHistory')}</Text>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.historyItem}>
          <Text style={styles.emptyText}>{t('calendar.empty')}</Text>
        </View>
      ) : selectedWorkouts.length === 0 ? (
        <View style={styles.historyItem}>
          <Text style={styles.emptyText}>
            {selectedDateKey
              ? t('calendar.noWorkoutsOn', { date: formatSelectedDate(selectedDateKey) })
              : t('calendar.selectDay')}
          </Text>
        </View>
      ) : (
        selectedWorkouts.map((item) => {
          const isExpanded = expandedWorkoutIds.includes(item.id);
          const isDeleting = deletingWorkoutId === item.id;
          const workoutTitle = formatWorkoutTagLabel(item.tags);

          return (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <Pressable
                  accessibilityLabel={t(isExpanded ? 'actions.collapse' : 'actions.expand', { name: workoutTitle })}
                  accessibilityRole="button"
                  onPress={() => toggleWorkoutExpanded(item.id)}
                  style={styles.historyHeaderButton}
                >
                  <View style={styles.historyTitleBlock}>
                    {item.tags.length === 0 ? (
                      <Text style={styles.workoutTagPlaceholder}>{t('calendar.noTags')}</Text>
                    ) : (
                      item.tags.map((tag) => (
                        <View key={tag.id} style={styles.workoutTagChip}>
                          <View style={[styles.workoutTagSwatch, { backgroundColor: tag.color }]} />
                          <Text style={styles.workoutTagChipText}>{tag.name}</Text>
                        </View>
                      ))
                    )}
                  </View>
                  <Ionicons
                    color="#215F9A"
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={22}
                  />
                </Pressable>
                <Pressable
                  accessibilityLabel={t('actions.delete', { name: workoutTitle })}
                  accessibilityRole="button"
                  disabled={isDeleting || deletingWorkoutId !== null}
                  hitSlop={8}
                  onPress={() => onDeleteWorkout(item)}
                  style={[
                    styles.historyDeleteButton,
                    (isDeleting || deletingWorkoutId !== null) && styles.historyDeleteButtonDisabled,
                  ]}
                >
                  <Ionicons color="#B4462E" name="trash-outline" size={20} />
                </Pressable>
              </View>

              {isExpanded && (
                <>
                  {item.notes.length > 0 && (
                    <Text style={styles.historyNotes}>{item.notes}</Text>
                  )}
                  <View style={styles.historyExerciseList}>
                    {item.exercises.map((exercise) => (
                      <View key={exercise.id} style={styles.historyExerciseBlock}>
                        <View style={styles.historyExerciseRow}>
                          <View style={styles.historyExerciseTitleBlock}>
                            <Text style={styles.historyExerciseName}>{exercise.exerciseName}</Text>
                            {exercise.tags.length > 0 && (
                              <View style={styles.historyExerciseTagList}>
                                {exercise.tags.map((tag) => (
                                  <View key={tag.id} style={styles.workoutTagChip}>
                                    <View
                                      style={[
                                        styles.workoutTagSwatch,
                                        { backgroundColor: tag.color },
                                      ]}
                                    />
                                    <Text style={styles.workoutTagChipText}>{tag.name}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                          <View style={styles.plannerTemplateActions}>
                            <Pressable
                              accessibilityLabel={t('record.edit', { name: exercise.exerciseName })}
                              accessibilityRole="button"
                              disabled={savingRecordId !== null || deletingRecordId !== null}
                              hitSlop={8}
                              onPress={() => beginEditingRecord(exercise)}
                            >
                              <Ionicons color="#215F9A" name="create-outline" size={20} />
                            </Pressable>
                            <Pressable
                              accessibilityLabel={t('actions.delete', { name: exercise.exerciseName })}
                              accessibilityRole="button"
                              disabled={savingRecordId !== null || deletingRecordId !== null}
                              hitSlop={8}
                              onPress={() => onDeleteRecord(exercise.id)}
                            >
                              <Ionicons color="#B4462E" name="trash-outline" size={20} />
                            </Pressable>
                          </View>
                        </View>
                        <View style={styles.historySetList}>
                          {exercise.sets.map((set) => (
                            <View
                              key={`${exercise.id}-${set.setNumber}`}
                              style={styles.historySetRow}
                            >
                              <Text style={styles.historySetNumber}>{set.setNumber}</Text>
                              {formatSetMetrics(set).map((metric) => (
                                <Text key={metric} style={styles.historySetMetric}>
                                  {metric}
                                </Text>
                              ))}
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          );
        })
      )}

      <ExerciseRecordEditorModal
        isSaving={savingRecordId === editingRecord?.id}
        record={editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={onUpdateRecord}
      />
    </>
  );
}

function getWorkoutTagIndicators(workout: WorkoutHistory) {
  if (workout.tags.length === 0) {
    return [{ key: `${workout.id}-untagged`, color: DEFAULT_WORKOUT_TAG_COLOR }];
  }

  return workout.tags.map((tag) => ({
    key: `${workout.id}-${tag.id}`,
    color: tag.color,
  }));
}


function buildCalendarDays(month: Date): CalendarDay[] {
  const firstOfMonth = startOfMonth(month);
  const mondayStartOffset = (firstOfMonth.getDay() + 6) % 7;
  const firstCalendarDay = new Date(
    firstOfMonth.getFullYear(),
    firstOfMonth.getMonth(),
    1 - mondayStartOffset,
  );

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      firstCalendarDay.getFullYear(),
      firstCalendarDay.getMonth(),
      firstCalendarDay.getDate() + index,
    );

    return {
      date,
      dateKey: formatLocalDateKey(date),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === firstOfMonth.getMonth(),
    };
  });
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatSelectedDate(dateKey: string) {
  return formatDate(parseDateKey(dateKey), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
