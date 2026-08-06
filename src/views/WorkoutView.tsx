import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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
  onToggleExerciseTag,
  onToggleWorkoutExercise,
  onToggleWorkoutTag,
  onUpdateSet,
  onLoadTemplate,
}: WorkoutViewProps) {
  const [isWorkoutTagPickerOpen, setIsWorkoutTagPickerOpen] = useState(false);
  const [exerciseTagPickerWorkoutExerciseId, setExerciseTagPickerWorkoutExerciseId] =
    useState<string | null>(null);
  const selectedWorkoutTags = useMemo(
    () => workoutTags.filter((tag) => selectedWorkoutTagIds.includes(tag.id)),
    [selectedWorkoutTagIds, workoutTags],
  );
  const selectedExerciseTagPickerEntry = workoutExercises.find(
    (entry) => entry.id === exerciseTagPickerWorkoutExerciseId,
  );
  const selectedExerciseTagPickerIds = selectedExerciseTagPickerEntry?.selectedExerciseTagIds ?? [];

  return (
    <>
      {workoutTemplates.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout templates</Text>
          <View style={styles.workoutTemplateBlock}>
            <Text style={styles.workoutTemplateLabel}>Load template</Text>
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
                  <Ionicons color="#215F9A" name="clipboard-outline" size={17} />
                  <Text style={styles.workoutTemplateButtonText}>{template.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      <View style={[styles.section, isWorkoutStarted && styles.activeWorkoutSection]}>
        <View style={styles.activeWorkoutHeader}>
          <Text style={styles.sectionTitle}>Workout</Text>
          {isWorkoutStarted && (
            <View style={styles.activeWorkoutIndicator}>
              <View style={styles.activeWorkoutIndicatorDot} />
              <Text style={styles.activeWorkoutIndicatorText}>Workout started</Text>
            </View>
          )}
        </View>
        <View style={styles.workoutTagRow}>
          <Text style={styles.tagRowLabel}>Focus:</Text>
          <Pressable
            accessibilityLabel="Choose workout focus"
            accessibilityRole="button"
            onPress={() => setIsWorkoutTagPickerOpen(true)}
            style={styles.workoutTagChipList}
          >
            {selectedWorkoutTags.length === 0 ? (
              <Text style={styles.workoutTagPlaceholder}>
                No focus
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
          <Text style={styles.exerciseCount}>{workoutTotals.exerciseCount} exercises</Text>
        </View>

        {workoutExercises.map((entry) => {
          const isExpanded = expandedWorkoutExerciseId === entry.id;
          const hasMinimumSets = entry.sets.length <= MIN_WORKOUT_SETS;
          const hasMaximumSets = entry.sets.length >= MAX_WORKOUT_SETS;
          const selectedExerciseTags = exerciseTags.filter((tag) =>
            entry.selectedExerciseTagIds.includes(tag.id),
          );
          const inputFields = getSetInputFields(entry.setType);

          return (
            <View key={entry.id} style={styles.workoutExercise}>
              <View style={styles.workoutExerciseHeader}>
                <Pressable
                  accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} ${entry.exerciseName}`}
                  accessibilityRole="button"
                  onPress={() => onToggleWorkoutExercise(entry.id)}
                  style={styles.workoutExerciseHeaderButton}
                >
                  <View style={styles.workoutExerciseTitleBlock}>
                    <Text style={styles.workoutExerciseTitle}>{entry.exerciseName}</Text>
                  </View>
                  <Ionicons
                    color="#215F9A"
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={22}
                  />
                </Pressable>
                <Pressable
                  accessibilityLabel={`Remove ${entry.exerciseName} from workout`}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => onRemoveExerciseFromWorkout(entry.id)}
                  style={styles.workoutExerciseDeleteButton}
                >
                  <Ionicons color="#B4462E" name="trash-outline" size={20} />
                </Pressable>
              </View>

              <View style={styles.workoutExerciseTagRow}>
                <Text style={styles.tagRowLabel}>Marker:</Text>
                <Pressable
                  accessibilityLabel={`Choose markers for ${entry.exerciseName}`}
                  accessibilityRole="button"
                  onPress={() => setExerciseTagPickerWorkoutExerciseId(entry.id)}
                  style={styles.exerciseTagChipList}
                >
                  {selectedExerciseTags.length === 0 ? (
                    <Text style={[styles.workoutTagPlaceholder, styles.workoutTagPlaceholderCentered]}>
                      No markers
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
                    <Text style={styles.setControlLabel}>Sets</Text>
                    <View style={styles.setStepper}>
                      <Pressable
                        accessibilityLabel={`Remove set from ${entry.exerciseName}`}
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
                          color={hasMinimumSets ? '#9AA59E' : '#215F9A'}
                          name="remove"
                          size={20}
                        />
                      </Pressable>
                      <Text style={styles.setStepperCount}>{entry.sets.length}</Text>
                      <Pressable
                        accessibilityLabel={`Add set to ${entry.exerciseName}`}
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
                          color={hasMaximumSets ? '#9AA59E' : '#215F9A'}
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
          dialogTitle="All exercises"
          emptyText="Start the API to load exercises."
          exercises={exercises}
          isDialogOpen={isExerciseDialogOpen}
          isLoading={isLoading}
          loadingText="Loading exercises..."
          searchText={exerciseSearchText}
          title="Add exercise"
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
          placeholder="Notes"
          placeholderTextColor="#6F7A73"
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
            {isSavingWorkout ? 'Saving workout' : 'Save workout'}
          </Text>
        </Pressable>
        {isWorkoutStarted && (
          <Pressable
            accessibilityRole="button"
            onPress={onCancelWorkout}
            style={styles.cancelWorkoutButton}
          >
            <Text style={styles.cancelWorkoutButtonText}>Cancel workout</Text>
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
              <Text style={styles.exerciseDialogTitle}>Workout focus</Text>
              <Pressable
                accessibilityLabel="Close workout focus list"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setIsWorkoutTagPickerOpen(false)}
                style={styles.exerciseDialogCloseButton}
              >
                <Ionicons color="#215F9A" name="close" size={22} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.exerciseDialogListContent}
              style={styles.exerciseDialogList}
            >
              {selectedWorkoutTagIds.length > 0 && (
                <Pressable
                  accessibilityLabel="Clear workout focus"
                  accessibilityRole="button"
                  onPress={onClearWorkoutTags}
                  style={styles.workoutTagOption}
                >
                  <Ionicons color="#6F7A73" name="remove-circle-outline" size={18} />
                  <Text style={styles.workoutTagOptionText}>Clear focus</Text>
                </Pressable>
              )}
              {workoutTags.length === 0 ? (
                <Text style={styles.emptyText}>No workout focus available.</Text>
              ) : (
                workoutTags.map((tag) => {
                  const isSelected = selectedWorkoutTagIds.includes(tag.id);

                  return (
                    <Pressable
                      key={tag.id}
                      accessibilityLabel={`${isSelected ? 'Remove' : 'Add'} ${tag.name}`}
                      accessibilityRole="button"
                      onPress={() => onToggleWorkoutTag(tag.id)}
                      style={[
                        styles.workoutTagOption,
                        isSelected && styles.workoutTagOptionSelected,
                      ]}
                    >
                      <View style={[styles.workoutTagSwatch, { backgroundColor: tag.color }]} />
                      <Text style={styles.workoutTagOptionText}>{tag.name}</Text>
                      {isSelected && <Ionicons color="#214E3A" name="checkmark" size={16} />}
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
        onRequestClose={() => setExerciseTagPickerWorkoutExerciseId(null)}
        transparent
        visible={Boolean(selectedExerciseTagPickerEntry)}
      >
        <View style={styles.exerciseDialogOverlay}>
          <View style={styles.exerciseDialog}>
            <View style={styles.exerciseDialogHeader}>
              <Text style={styles.exerciseDialogTitle}>
                {selectedExerciseTagPickerEntry?.exerciseName ?? 'Exercise'} markers
              </Text>
              <Pressable
                accessibilityLabel="Close exercise marker list"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setExerciseTagPickerWorkoutExerciseId(null)}
                style={styles.exerciseDialogCloseButton}
              >
                <Ionicons color="#215F9A" name="close" size={22} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.exerciseDialogListContent}
              style={styles.exerciseDialogList}
            >
              {selectedExerciseTagPickerEntry && selectedExerciseTagPickerIds.length > 0 && (
                <Pressable
                  accessibilityLabel="Clear exercise markers"
                  accessibilityRole="button"
                  onPress={() => onClearExerciseTags(selectedExerciseTagPickerEntry.id)}
                  style={styles.workoutTagOption}
                >
                  <Ionicons color="#6F7A73" name="remove-circle-outline" size={18} />
                  <Text style={styles.workoutTagOptionText}>Clear markers</Text>
                </Pressable>
              )}
              {exerciseTags.length === 0 ? (
                <Text style={styles.emptyText}>No exercise markers available.</Text>
              ) : (
                exerciseTags.map((tag) => {
                  const isSelected = selectedExerciseTagPickerIds.includes(tag.id);

                  return (
                    <Pressable
                      key={tag.id}
                      accessibilityLabel={`${isSelected ? 'Remove' : 'Add'} ${tag.name}`}
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
                      {isSelected && <Ionicons color="#214E3A" name="checkmark" size={16} />}
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

function getSetInputFields(setType: ExerciseSetType): SetInputField[] {
  switch (setType) {
    case 'Strength':
      return [
        { field: 'reps', label: 'Reps', keyboardType: 'number-pad' },
        { field: 'weight', label: 'Weight', keyboardType: 'decimal-pad' },
      ];
    case 'RepsOnly':
      return [{ field: 'reps', label: 'Reps', keyboardType: 'number-pad' }];
    case 'Duration':
      return [
        { field: 'durationMinutes', label: 'Min', keyboardType: 'number-pad' },
        { field: 'durationSeconds', label: 'Sec', keyboardType: 'number-pad' },
      ];
    case 'Distance':
      return [{ field: 'distanceKm', label: 'Km', keyboardType: 'decimal-pad' }];
    case 'DistanceDuration':
      return [
        { field: 'distanceKm', label: 'Km', keyboardType: 'decimal-pad' },
        { field: 'durationMinutes', label: 'Min', keyboardType: 'number-pad' },
        { field: 'durationSeconds', label: 'Sec', keyboardType: 'number-pad' },
      ];
  }
}
