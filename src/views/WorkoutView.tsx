import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ExerciseSearchPicker } from '../components/ExerciseSearchPicker';
import { styles } from '../styles';
import {
  Exercise,
  ExerciseSetType,
  ExerciseTag,
  WorkoutExerciseEntry,
  WorkoutTag,
  WorkoutTemplate,
  WorkoutTotals,
} from '../types';
import {
  MAX_WORKOUT_SETS,
  MIN_WORKOUT_SETS,
} from '../utils/workoutUtils';
import { t } from '../localization';

type WorkoutViewProps = {
  exerciseSearchText: string;
  exercises: Exercise[];
  exerciseTags: ExerciseTag[];
  expandedWorkoutExerciseId: string | null;
  isExerciseDialogOpen: boolean;
  isLoading: boolean;
  isSavingWorkout: boolean;
  isWorkoutStarted: boolean;
  selectedWorkoutTagIds: string[];
  workoutNotes: string;
  workoutTags: WorkoutTag[];
  workoutExercises: WorkoutExerciseEntry[];
  workoutTotals: WorkoutTotals;
  workoutTemplates: WorkoutTemplate[];
  onAddExerciseToWorkout: (exercise: Exercise) => void;
  onAddSet: (workoutExerciseId: string) => void;
  onCloseExerciseDialog: () => void;
  onChangeExerciseSearch: (value: string) => void;
  onChangeWorkoutNotes: (value: string) => void;
  onClearExerciseSearch: () => void;
  onClearExerciseTags: (workoutExerciseId: string) => void;
  onClearWorkoutTags: () => void;
  onRemoveExerciseFromWorkout: (workoutExerciseId: string) => void;
  onRemoveSet: (workoutExerciseId: string) => void;
  onSaveWorkout: () => void;
  onCancelWorkout: () => void;
  onOpenExerciseDialog: () => void;
  onOpenExerciseData: (exerciseId: string) => void;
  onToggleExerciseTag: (workoutExerciseId: string, tagId: string) => void;
  onToggleWorkoutExercise: (workoutExerciseId: string) => void;
  onToggleWorkoutTag: (tagId: string) => void;
  onUpdateSet: (
    workoutExerciseId: string,
    setId: string,
    field: SetInputFieldName,
    value: string,
  ) => void;
  onLoadTemplate: (template: WorkoutTemplate) => void;
};

type SetInputFieldName = 'reps' | 'weight' | 'durationMinutes' | 'durationSeconds' | 'distanceKm';

type SetInputField = {
  field: SetInputFieldName;
  label: string;
  keyboardType: 'number-pad' | 'decimal-pad';
};

/** Renders the active workout editor and its supporting selection and information dialogs. */
export function WorkoutView({
  exerciseSearchText,
  exercises,
  exerciseTags,
  expandedWorkoutExerciseId,
  isExerciseDialogOpen,
  isLoading,
  isSavingWorkout,
  isWorkoutStarted,
  selectedWorkoutTagIds,
  workoutNotes,
  workoutTags,
  workoutExercises,
  workoutTotals,
  workoutTemplates,
  onAddExerciseToWorkout,
  onAddSet,
  onCloseExerciseDialog,
  onChangeExerciseSearch,
  onChangeWorkoutNotes,
  onClearExerciseSearch,
  onClearExerciseTags,
  onClearWorkoutTags,
  onRemoveExerciseFromWorkout,
  onRemoveSet,
  onSaveWorkout,
  onCancelWorkout,
  onOpenExerciseDialog,
  onOpenExerciseData,
  onToggleExerciseTag,
  onToggleWorkoutExercise,
  onToggleWorkoutTag,
  onUpdateSet,
  onLoadTemplate,
}: WorkoutViewProps) {
  const [isWorkoutTagPickerOpen, setIsWorkoutTagPickerOpen] = useState(false);
  const [exerciseTagPickerWorkoutExerciseId, setExerciseTagPickerWorkoutExerciseId] =
    useState<string | null>(null);
  const [exerciseInfoId, setExerciseInfoId] = useState<string | null>(null);
  const selectedWorkoutTags = useMemo(
    () => workoutTags.filter((tag) => selectedWorkoutTagIds.includes(tag.id)),
    [selectedWorkoutTagIds, workoutTags],
  );
  const selectedExerciseTagPickerEntry = workoutExercises.find(
    (entry) => entry.id === exerciseTagPickerWorkoutExerciseId,
  );
  const selectedExerciseTagPickerIds = selectedExerciseTagPickerEntry?.selectedExerciseTagIds ?? [];
  const exerciseInfo = exercises.find((exercise) => exercise.id === exerciseInfoId) ?? null;

  return (
    <>
      {workoutTemplates.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('workout.templates')}</Text>
          <View style={styles.workoutTemplateBlock}>
            <Text style={styles.workoutTemplateLabel}>{t('workout.loadTemplate')}</Text>
            <ScrollView
              horizontal
              contentContainerStyle={styles.workoutTemplateList}
              showsHorizontalScrollIndicator={false}
            >
              {workoutTemplates.map((template) => (
                <Pressable
                  key={template.id}
                  onPress={() => onLoadTemplate(template)}
                  style={styles.workoutTemplateButton}
                >
                  <Ionicons color="#5AA7FF" name="clipboard-outline" size={17} />
                  <Text style={styles.workoutTemplateButtonText}>{template.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      <View style={[styles.section, isWorkoutStarted && styles.activeWorkoutSection]}>
        <View style={styles.activeWorkoutHeader}>
          <Text style={styles.sectionTitle}>{t('workout.title')}</Text>
          {isWorkoutStarted && (
            <View style={styles.activeWorkoutIndicator}>
              <View style={styles.activeWorkoutIndicatorDot} />
              <Text style={styles.activeWorkoutIndicatorText}>{t('workout.started')}</Text>
            </View>
          )}
        </View>
        <View style={styles.workoutTagRow}>
          <Text style={styles.tagRowLabel}>{t('workout.focus')}</Text>
          <Pressable
            accessibilityLabel={t('workout.chooseFocus')}
            accessibilityRole="button"
            onPress={() => setIsWorkoutTagPickerOpen(true)}
            style={styles.workoutTagChipList}
          >
            {selectedWorkoutTags.length === 0 ? (
              <Text style={styles.workoutTagPlaceholder}>
                {t('workout.noFocusSelected')}
              </Text>
            ) : (
              selectedWorkoutTags.map((tag) => (
                <View key={tag.id} style={styles.workoutTagChip}>
                  <View style={[styles.workoutTagSwatch, { backgroundColor: tag.color }]} />
                  <Text style={styles.workoutTagChipText}>{tag.name}</Text>
                </View>
              ))
            )}
          </Pressable>
          <Text style={styles.exerciseCount}>{t('workout.exerciseCount', { count: workoutTotals.exerciseCount })}</Text>
        </View>

        {workoutExercises.map((entry) => {
          const isExpanded = expandedWorkoutExerciseId === entry.id;
          const hasMinimumSets = entry.sets.length <= MIN_WORKOUT_SETS;
          const hasMaximumSets = entry.sets.length >= MAX_WORKOUT_SETS;
          const selectedExerciseTags = exerciseTags.filter((tag) =>
            entry.selectedExerciseTagIds.includes(tag.id),
          );
          const inputFields = getSetInputFields(entry.setType);
          const hasDescription = Boolean(
            exercises.find((exercise) => exercise.id === entry.exerciseId)?.description?.trim(),
          );

          return (
            <View key={entry.id} style={styles.workoutExercise}>
              <View style={styles.workoutExerciseHeader}>
                <Pressable
                  accessibilityLabel={t(isExpanded ? 'actions.collapse' : 'actions.expand', { name: entry.exerciseName })}
                  accessibilityRole="button"
                  onPress={() => onToggleWorkoutExercise(entry.id)}
                  style={styles.workoutExerciseHeaderButton}
                >
                  <View style={styles.workoutExerciseTitleBlock}>
                    <Text style={styles.workoutExerciseTitle}>{entry.exerciseName}</Text>
                  </View>
                  <Ionicons
                    color="#5AA7FF"
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={22}
                  />
                </Pressable>
                {hasDescription && (
                  <Pressable
                    accessibilityLabel={t('workout.exerciseInfo')}
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => setExerciseInfoId(entry.exerciseId)}
                    style={styles.workoutExerciseDataButton}
                  >
                    <Ionicons color="#5AA7FF" name="information-circle-outline" size={21} />
                  </Pressable>
                )}
                <Pressable
                  accessibilityLabel={t('actions.viewExerciseData', { name: entry.exerciseName })}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => onOpenExerciseData(entry.exerciseId)}
                  style={styles.workoutExerciseDataButton}
                >
                  <Ionicons color="#5AA7FF" name="stats-chart-outline" size={20} />
                </Pressable>
                <Pressable
                  accessibilityLabel={t('actions.removeFromWorkout', { name: entry.exerciseName })}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => onRemoveExerciseFromWorkout(entry.id)}
                  style={styles.workoutExerciseDeleteButton}
                >
                  <Ionicons color="#FF7B7B" name="trash-outline" size={20} />
                </Pressable>
              </View>

              <View style={styles.workoutExerciseTagRow}>
                <Text style={styles.tagRowLabel}>{t('workout.marker')}</Text>
                <Pressable
                  accessibilityLabel={t('actions.chooseMarkers', { name: entry.exerciseName })}
                  accessibilityRole="button"
                  onPress={() => setExerciseTagPickerWorkoutExerciseId(entry.id)}
                  style={styles.exerciseTagChipList}
                >
                  {selectedExerciseTags.length === 0 ? (
                    <Text style={[styles.workoutTagPlaceholder, styles.workoutTagPlaceholderCentered]}>
                      {t('workout.noMarkersSelected')}
                    </Text>
                  ) : (
                    selectedExerciseTags.map((tag) => (
                      <View key={tag.id} style={styles.workoutTagChip}>
                        <View style={[styles.workoutTagSwatch, { backgroundColor: tag.color }]} />
                        <Text style={styles.workoutTagChipText}>{tag.name}</Text>
                      </View>
                    ))
                  )}
                </Pressable>
              </View>

              {isExpanded && (
                <>
                  {entry.sets.map((set, index) => (
                    <View key={set.id} style={styles.setRow}>
                      <Text style={styles.setNumber}>{index + 1}</Text>
                      {inputFields.map((field) => (
                        <View key={field.field} style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>{field.label}</Text>
                          <TextInput
                            value={set[field.field]}
                            onChangeText={(value) =>
                              onUpdateSet(entry.id, set.id, field.field, value)
                            }
                            keyboardType={field.keyboardType}
                            style={styles.numberInput}
                          />
                        </View>
                      ))}
                    </View>
                  ))}

                  <View style={styles.exerciseFooter}>
                    <Text style={styles.setControlLabel}>{t('workout.sets')}</Text>
                    <View style={styles.setStepper}>
                      <Pressable
                        accessibilityLabel={t('actions.removeSet', { name: entry.exerciseName })}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: hasMinimumSets }}
                        disabled={hasMinimumSets}
                        onPress={() => onRemoveSet(entry.id)}
                        style={[
                          styles.setStepperButton,
                          hasMinimumSets && styles.setStepperButtonDisabled,
                        ]}
                      >
                        <Ionicons
                          color={hasMinimumSets ? '#6D7480' : '#5AA7FF'}
                          name="remove"
                          size={20}
                        />
                      </Pressable>
                      <Text style={styles.setStepperCount}>{entry.sets.length}</Text>
                      <Pressable
                        accessibilityLabel={t('actions.addSet', { name: entry.exerciseName })}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: hasMaximumSets }}
                        disabled={hasMaximumSets}
                        onPress={() => onAddSet(entry.id)}
                        style={[
                          styles.setStepperButton,
                          hasMaximumSets && styles.setStepperButtonDisabled,
                        ]}
                      >
                        <Ionicons
                          color={hasMaximumSets ? '#6D7480' : '#5AA7FF'}
                          name="add"
                          size={20}
                        />
                      </Pressable>
                    </View>
                  </View>
                </>
              )}
            </View>
          );
        })}

        <ExerciseSearchPicker
          dialogTitle={t('picker.allExercises')}
          emptyText={t('picker.loadError')}
          exercises={exercises}
          isDialogOpen={isExerciseDialogOpen}
          isLoading={isLoading}
          loadingText={t('picker.loadingExercises')}
          searchText={exerciseSearchText}
          title={t('workout.addExercise')}
          onChangeSearch={onChangeExerciseSearch}
          onClearSearch={onClearExerciseSearch}
          onCloseDialog={onCloseExerciseDialog}
          onOpenDialog={onOpenExerciseDialog}
          onSelectExercise={onAddExerciseToWorkout}
        />

        <TextInput
          maxLength={2000}
          multiline
          onChangeText={onChangeWorkoutNotes}
          placeholder={t('workout.notes')}
          placeholderTextColor="#9BA1AD"
          style={styles.workoutNotesInput}
          textAlignVertical="top"
          value={workoutNotes}
        />

        <Pressable
          disabled={
            workoutExercises.length === 0 ||
            selectedWorkoutTagIds.length === 0 ||
            isSavingWorkout
          }
          onPress={onSaveWorkout}
          style={[
            styles.saveButton,
            (workoutExercises.length === 0 ||
              selectedWorkoutTagIds.length === 0 ||
              isSavingWorkout) &&
              styles.saveButtonDisabled,
          ]}
        >
          <Text style={styles.saveButtonText}>
            {isSavingWorkout ? t('workout.saving') : t('workout.save')}
          </Text>
        </Pressable>
        {isWorkoutStarted && (
          <Pressable
            accessibilityRole="button"
            onPress={onCancelWorkout}
            style={styles.cancelWorkoutButton}
          >
            <Text style={styles.cancelWorkoutButtonText}>{t('workout.cancel')}</Text>
          </Pressable>
        )}
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsWorkoutTagPickerOpen(false)}
        transparent
        visible={isWorkoutTagPickerOpen}
      >
        <View style={styles.exerciseDialogOverlay}>
          <View style={styles.exerciseDialog}>
            <View style={styles.exerciseDialogHeader}>
              <Text style={styles.exerciseDialogTitle}>{t('workout.focusDialog')}</Text>
              <Pressable
                accessibilityLabel={t('actions.closeList', { item: t('data.workoutFocus').toLowerCase() })}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setIsWorkoutTagPickerOpen(false)}
                style={styles.exerciseDialogCloseButton}
              >
                <Ionicons color="#5AA7FF" name="close" size={22} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.exerciseDialogListContent}
              style={styles.exerciseDialogList}
            >
              {selectedWorkoutTagIds.length > 0 && (
                <Pressable
                  accessibilityLabel={t('workout.clearFocus')}
                  accessibilityRole="button"
                  onPress={onClearWorkoutTags}
                  style={styles.workoutTagOption}
                >
                  <Ionicons color="#9BA1AD" name="remove-circle-outline" size={18} />
                  <Text style={styles.workoutTagOptionText}>{t('workout.clearFocus')}</Text>
                </Pressable>
              )}
              {workoutTags.length === 0 ? (
                <Text style={styles.emptyText}>{t('workout.noFocusAvailable')}</Text>
              ) : (
                workoutTags.map((tag) => {
                  const isSelected = selectedWorkoutTagIds.includes(tag.id);

                  return (
                    <Pressable
                      key={tag.id}
                      accessibilityLabel={t(isSelected ? 'actions.remove' : 'actions.add', { name: tag.name })}
                      accessibilityRole="button"
                      onPress={() => onToggleWorkoutTag(tag.id)}
                      style={[
                        styles.workoutTagOption,
                        isSelected && styles.workoutTagOptionSelected,
                      ]}
                    >
                      <View style={[styles.workoutTagSwatch, { backgroundColor: tag.color }]} />
                      <Text style={styles.workoutTagOptionText}>{tag.name}</Text>
                      {isSelected && <Ionicons color="#5AA7FF" name="checkmark" size={16} />}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setExerciseInfoId(null)}
        transparent
        visible={exerciseInfo !== null}
      >
        <View style={styles.exerciseDialogOverlay}>
          <View style={styles.exerciseDialog}>
            <View style={styles.exerciseDialogHeader}>
              <Text style={styles.exerciseDialogTitle}>
                {exerciseInfo?.name ?? t('workout.exerciseInfo')}
              </Text>
              <Pressable
                accessibilityLabel={t('common.close')}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setExerciseInfoId(null)}
                style={styles.exerciseDialogCloseButton}
              >
                <Ionicons color="#5AA7FF" name="close" size={22} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.exerciseDialogListContent}>
              {exerciseInfo?.description ? (
                <ExerciseDescriptionText description={exerciseInfo.description} />
              ) : (
                <Text style={styles.emptyText}>{t('workout.noExerciseDescription')}</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setExerciseTagPickerWorkoutExerciseId(null)}
        transparent
        visible={Boolean(selectedExerciseTagPickerEntry)}
      >
        <View style={styles.exerciseDialogOverlay}>
          <View style={styles.exerciseDialog}>
            <View style={styles.exerciseDialogHeader}>
              <Text style={styles.exerciseDialogTitle}>
                {t('workout.markersFor', { name: selectedExerciseTagPickerEntry?.exerciseName ?? t('data.exercise') })}
              </Text>
              <Pressable
                accessibilityLabel={t('actions.closeList', { item: t('data.exerciseMarker').toLowerCase() })}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setExerciseTagPickerWorkoutExerciseId(null)}
                style={styles.exerciseDialogCloseButton}
              >
                <Ionicons color="#5AA7FF" name="close" size={22} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.exerciseDialogListContent}
              style={styles.exerciseDialogList}
            >
              {selectedExerciseTagPickerEntry && selectedExerciseTagPickerIds.length > 0 && (
                <Pressable
                  accessibilityLabel={t('workout.clearMarkers')}
                  accessibilityRole="button"
                  onPress={() => onClearExerciseTags(selectedExerciseTagPickerEntry.id)}
                  style={styles.workoutTagOption}
                >
                  <Ionicons color="#9BA1AD" name="remove-circle-outline" size={18} />
                  <Text style={styles.workoutTagOptionText}>{t('workout.clearMarkers')}</Text>
                </Pressable>
              )}
              {exerciseTags.length === 0 ? (
                <Text style={styles.emptyText}>{t('workout.noMarkersAvailable')}</Text>
              ) : (
                exerciseTags.map((tag) => {
                  const isSelected = selectedExerciseTagPickerIds.includes(tag.id);

                  return (
                    <Pressable
                      key={tag.id}
                      accessibilityLabel={t(isSelected ? 'actions.remove' : 'actions.add', { name: tag.name })}
                      accessibilityRole="button"
                      onPress={() => {
                        if (selectedExerciseTagPickerEntry) {
                          onToggleExerciseTag(selectedExerciseTagPickerEntry.id, tag.id);
                        }
                      }}
                      style={[
                        styles.workoutTagOption,
                        isSelected && styles.workoutTagOptionSelected,
                      ]}
                    >
                      <View style={[styles.workoutTagSwatch, { backgroundColor: tag.color }]} />
                      <Text style={styles.workoutTagOptionText}>{tag.name}</Text>
                      {isSelected && <Ionicons color="#5AA7FF" name="checkmark" size={16} />}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

/** Renders free-form exercise instructions while making embedded web links tappable. */
function ExerciseDescriptionText({ description }: { description: string }) {
  return (
    <Text selectable style={styles.exerciseInfoBody}>
      {description.split(/(https?:\/\/[^\s]+)/g).map((part, index) =>
        /^https?:\/\//.test(part) ? (
          <Text
            key={`${part}-${index}`}
            accessibilityRole="link"
            onPress={() => { void Linking.openURL(part); }}
            style={styles.exerciseInfoLink}
          >
            {part}
          </Text>
        ) : part,
      )}
    </Text>
  );
}

function getSetInputFields(setType: ExerciseSetType): SetInputField[] {
  switch (setType) {
    case 'Strength':
      return [
        { field: 'reps', label: t('record.reps'), keyboardType: 'number-pad' },
        { field: 'weight', label: t('record.weight'), keyboardType: 'decimal-pad' },
      ];
    case 'RepsOnly':
      return [{ field: 'reps', label: t('record.reps'), keyboardType: 'number-pad' }];
    case 'Duration':
      return [
        { field: 'durationMinutes', label: t('record.minutes'), keyboardType: 'number-pad' },
        { field: 'durationSeconds', label: t('record.seconds'), keyboardType: 'number-pad' },
      ];
    case 'Distance':
      return [{ field: 'distanceKm', label: t('record.kilometers'), keyboardType: 'decimal-pad' }];
    case 'DistanceDuration':
      return [
        { field: 'distanceKm', label: t('record.kilometers'), keyboardType: 'decimal-pad' },
        { field: 'durationMinutes', label: t('record.minutes'), keyboardType: 'number-pad' },
        { field: 'durationSeconds', label: t('record.seconds'), keyboardType: 'number-pad' },
      ];
  }
}
