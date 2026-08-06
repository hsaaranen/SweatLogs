import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { styles } from '../styles';
import { Exercise, ExerciseSetType, ExerciseTag, WorkoutTag } from '../types';
import { EXERCISE_SET_TYPE_OPTIONS } from '../utils/workoutUtils';

const TAG_COLOR_OPTIONS = [
  '#215F9A',
  '#214E3A',
  '#D56A3A',
  '#B4462E',
  '#8E44AD',
  '#9AA59E',
];

const SET_TYPE_FIELD_PREVIEWS: Record<ExerciseSetType, string[]> = {
  Strength: ['Reps', 'Weight'],
  Duration: ['Min', 'Sec'],
  RepsOnly: ['Reps'],
  Distance: ['Km'],
  DistanceDuration: ['Km', 'Min', 'Sec'],
};

type SettingsViewProps = {
  deletingExerciseId: string | null;
  deletingExerciseTagId: string | null;
  deletingWorkoutTagId: string | null;
  exercises: Exercise[];
  exerciseTags: ExerciseTag[];
  isExerciseDialogOpen: boolean;
  isExerciseTagDialogOpen: boolean;
  isWorkoutTagDialogOpen: boolean;
  isCreatingExercise: boolean;
  isCreatingExerciseTag: boolean;
  isCreatingWorkoutTag: boolean;
  isLoading: boolean;
  newExerciseName: string;
  newExerciseSetType: ExerciseSetType;
  newExerciseTagColor: string;
  newExerciseTagName: string;
  newWorkoutTagColor: string;
  newWorkoutTagName: string;
  workoutTags: WorkoutTag[];
  onChangeNewExerciseName: (value: string) => void;
  onChangeNewExerciseSetType: (value: ExerciseSetType) => void;
  onChangeNewExerciseTagColor: (value: string) => void;
  onChangeNewExerciseTagName: (value: string) => void;
  onChangeNewWorkoutTagColor: (value: string) => void;
  onChangeNewWorkoutTagName: (value: string) => void;
  onCloseExerciseDialog: () => void;
  onCloseExerciseTagDialog: () => void;
  onCloseWorkoutTagDialog: () => void;
  onCreateExercise: () => void;
  onCreateExerciseTag: () => void;
  onCreateWorkoutTag: () => void;
  onDeleteExercise: (exercise: Exercise) => void;
  onDeleteExerciseTag: (tag: ExerciseTag) => void;
  onDeleteWorkoutTag: (tag: WorkoutTag) => void;
  onOpenExerciseDialog: () => void;
  onOpenExerciseTagDialog: () => void;
  onOpenWorkoutTagDialog: () => void;
};

export function SettingsView({
  deletingExerciseId,
  deletingExerciseTagId,
  deletingWorkoutTagId,
  exercises,
  exerciseTags,
  isExerciseDialogOpen,
  isExerciseTagDialogOpen,
  isWorkoutTagDialogOpen,
  isCreatingExercise,
  isCreatingExerciseTag,
  isCreatingWorkoutTag,
  isLoading,
  newExerciseName,
  newExerciseSetType,
  newExerciseTagColor,
  newExerciseTagName,
  newWorkoutTagColor,
  newWorkoutTagName,
  workoutTags,
  onChangeNewExerciseName,
  onChangeNewExerciseSetType,
  onChangeNewExerciseTagColor,
  onChangeNewExerciseTagName,
  onChangeNewWorkoutTagColor,
  onChangeNewWorkoutTagName,
  onCloseExerciseDialog,
  onCloseExerciseTagDialog,
  onCloseWorkoutTagDialog,
  onCreateExercise,
  onCreateExerciseTag,
  onCreateWorkoutTag,
  onDeleteExercise,
  onDeleteExerciseTag,
  onDeleteWorkoutTag,
  onOpenExerciseDialog,
  onOpenExerciseTagDialog,
  onOpenWorkoutTagDialog,
}: SettingsViewProps) {
  return (
    <>
      <View style={styles.section}>
        <View style={styles.exercisePickerHeaderRow}>
          <Text style={styles.sectionTitle}>Create exercise</Text>
          <Pressable
            accessibilityLabel="Browse all exercises"
            accessibilityRole="button"
            onPress={onOpenExerciseDialog}
          >
            <Text style={styles.exercisePickerActionText}>Browse all</Text>
          </Pressable>
        </View>
        <Text style={styles.exerciseCreatorControlLabel}>Name</Text>
        <TextInput
          value={newExerciseName}
          onChangeText={onChangeNewExerciseName}
          placeholder="New exercise"
          placeholderTextColor="#6F7A73"
          style={styles.exerciseInput}
        />
        <Text style={styles.exerciseCreatorControlLabel}>Type</Text>
        <View style={styles.exerciseSetTypeRow}>
          {EXERCISE_SET_TYPE_OPTIONS.map((option) => {
            const isSelected = option.value === newExerciseSetType;

            return (
              <Pressable
                key={option.value}
                accessibilityLabel={`Use ${option.label} exercise set type`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => onChangeNewExerciseSetType(option.value)}
                style={[
                  styles.exerciseSetTypeOption,
                  isSelected && styles.exerciseSetTypeOptionSelected,
                ]}
              >
                <View style={styles.exerciseSetTypeOptionHeader}>
                  <Text
                    style={[
                      styles.exerciseSetTypeOptionText,
                      isSelected && styles.exerciseSetTypeOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && <Ionicons color="#214E3A" name="checkmark-circle" size={18} />}
                </View>
                <View style={styles.exerciseSetTypePreview}>
                  <View
                    style={[
                      styles.exerciseSetTypeSetNumber,
                      isSelected && styles.exerciseSetTypeSetNumberSelected,
                    ]}
                  >
                    <Text style={styles.exerciseSetTypeSetNumberText}>1</Text>
                  </View>
                  {SET_TYPE_FIELD_PREVIEWS[option.value].map((field, index) => (
                    <View
                      key={field}
                      style={[
                        styles.exerciseSetTypeFieldPreview,
                        isSelected && styles.exerciseSetTypeFieldPreviewSelected,
                      ]}
                    >
                      <Text style={styles.exerciseSetTypeFieldOrder}>{index + 1}</Text>
                      <Text
                        style={[
                          styles.exerciseSetTypeFieldText,
                          isSelected && styles.exerciseSetTypeOptionTextSelected,
                        ]}
                      >
                        {field}
                      </Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          disabled={isCreatingExercise}
          onPress={onCreateExercise}
          style={[
            styles.addButton,
            styles.createExerciseButton,
            isCreatingExercise && styles.actionButtonDisabled,
          ]}
        >
          <Text style={styles.addButtonText}>{isCreatingExercise ? 'Creating' : 'Create'}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <View style={styles.exercisePickerHeaderRow}>
          <Text style={styles.sectionTitle}>Create workout focus</Text>
          <Pressable
            accessibilityLabel="Browse all workout focus"
            accessibilityRole="button"
            onPress={onOpenWorkoutTagDialog}
          >
            <Text style={styles.exercisePickerActionText}>Browse all</Text>
          </Pressable>
        </View>
        <View style={styles.workoutTagColorRow}>
          {TAG_COLOR_OPTIONS.map((color) => {
            const isSelected = color === newWorkoutTagColor;

            return (
              <Pressable
                key={color}
                accessibilityLabel={`Use ${color} workout focus color`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => onChangeNewWorkoutTagColor(color)}
                style={[
                  styles.workoutTagColorOption,
                  isSelected && styles.workoutTagColorOptionSelected,
                ]}
              >
                <View style={[styles.workoutTagColorSwatch, { backgroundColor: color }]} />
              </Pressable>
            );
          })}
        </View>
        <View style={styles.addExerciseRow}>
          <TextInput
            value={newWorkoutTagName}
            onChangeText={onChangeNewWorkoutTagName}
            placeholder="New workout focus"
            placeholderTextColor="#6F7A73"
            style={styles.exerciseInput}
          />
          <Pressable
            disabled={isCreatingWorkoutTag}
            onPress={onCreateWorkoutTag}
            style={[styles.addButton, isCreatingWorkoutTag && styles.actionButtonDisabled]}
          >
            <Text style={styles.addButtonText}>{isCreatingWorkoutTag ? 'Creating' : 'Create'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.exercisePickerHeaderRow}>
          <Text style={styles.sectionTitle}>Create exercise marker</Text>
          <Pressable
            accessibilityLabel="Browse all exercise markers"
            accessibilityRole="button"
            onPress={onOpenExerciseTagDialog}
          >
            <Text style={styles.exercisePickerActionText}>Browse all</Text>
          </Pressable>
        </View>
        <View style={styles.workoutTagColorRow}>
          {TAG_COLOR_OPTIONS.map((color) => {
            const isSelected = color === newExerciseTagColor;

            return (
              <Pressable
                key={color}
                accessibilityLabel={`Use ${color} exercise marker color`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => onChangeNewExerciseTagColor(color)}
                style={[
                  styles.workoutTagColorOption,
                  isSelected && styles.workoutTagColorOptionSelected,
                ]}
              >
                <View style={[styles.workoutTagColorSwatch, { backgroundColor: color }]} />
              </Pressable>
            );
          })}
        </View>
        <View style={styles.addExerciseRow}>
          <TextInput
            value={newExerciseTagName}
            onChangeText={onChangeNewExerciseTagName}
            placeholder="New exercise marker"
            placeholderTextColor="#6F7A73"
            style={styles.exerciseInput}
          />
          <Pressable
            disabled={isCreatingExerciseTag}
            onPress={onCreateExerciseTag}
            style={[styles.addButton, isCreatingExerciseTag && styles.actionButtonDisabled]}
          >
            <Text style={styles.addButtonText}>{isCreatingExerciseTag ? 'Creating' : 'Create'}</Text>
          </Pressable>
        </View>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={onCloseExerciseDialog}
        transparent
        visible={isExerciseDialogOpen}
      >
        <View style={styles.exerciseDialogOverlay}>
          <View style={styles.exerciseDialog}>
            <View style={styles.exerciseDialogHeader}>
              <Text style={styles.exerciseDialogTitle}>Exercise Library</Text>
              <Pressable
                accessibilityLabel="Close exercise list"
                accessibilityRole="button"
                hitSlop={8}
                onPress={onCloseExerciseDialog}
                style={styles.exerciseDialogCloseButton}
              >
                <Ionicons color="#215F9A" name="close" size={22} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.exerciseDialogListContent}
              style={styles.exerciseDialogList}
            >
              {isLoading ? (
                <Text style={styles.emptyText}>Loading exercises...</Text>
              ) : exercises.length === 0 ? (
                <Text style={styles.emptyText}>No exercises yet.</Text>
              ) : (
                exercises.map((exercise) => {
                  const isDeleting = deletingExerciseId === exercise.id;
                  const isDeleteDisabled = deletingExerciseId !== null;

                  return (
                    <View key={exercise.id} style={styles.exerciseOption}>
                      <View style={styles.exerciseOptionTitleBlock}>
                        <Text style={styles.exerciseOptionText}>{exercise.name}</Text>
                      </View>
                      <Pressable
                        accessibilityLabel={`Delete ${exercise.name}`}
                        accessibilityRole="button"
                        disabled={isDeleteDisabled}
                        hitSlop={8}
                        onPress={() => onDeleteExercise(exercise)}
                        style={[
                          styles.settingsExerciseDeleteButton,
                          isDeleteDisabled && styles.historyDeleteButtonDisabled,
                        ]}
                      >
                        <Ionicons
                          color={isDeleting ? '#9AA59E' : '#B4462E'}
                          name="trash-outline"
                          size={20}
                        />
                      </Pressable>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={onCloseWorkoutTagDialog}
        transparent
        visible={isWorkoutTagDialogOpen}
      >
        <View style={styles.exerciseDialogOverlay}>
          <View style={styles.exerciseDialog}>
            <View style={styles.exerciseDialogHeader}>
              <Text style={styles.exerciseDialogTitle}>Workout Focus</Text>
              <Pressable
                accessibilityLabel="Close workout focus list"
                accessibilityRole="button"
                hitSlop={8}
                onPress={onCloseWorkoutTagDialog}
                style={styles.exerciseDialogCloseButton}
              >
                <Ionicons color="#215F9A" name="close" size={22} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.exerciseDialogListContent}
              style={styles.exerciseDialogList}
            >
              {isLoading ? (
                <Text style={styles.emptyText}>Loading workout focus...</Text>
              ) : workoutTags.length === 0 ? (
                <Text style={styles.emptyText}>No workout focus yet.</Text>
              ) : (
                workoutTags.map((tag) => {
                  const isDeleting = deletingWorkoutTagId === tag.id;
                  const isDeleteDisabled = deletingWorkoutTagId !== null;

                  return (
                    <View key={tag.id} style={styles.workoutTagOption}>
                      <View style={[styles.workoutTagSwatch, { backgroundColor: tag.color }]} />
                      <Text style={styles.workoutTagOptionText}>{tag.name}</Text>
                      <Pressable
                        accessibilityLabel={`Delete ${tag.name}`}
                        accessibilityRole="button"
                        disabled={isDeleteDisabled}
                        hitSlop={8}
                        onPress={() => onDeleteWorkoutTag(tag)}
                        style={[
                          styles.settingsExerciseDeleteButton,
                          isDeleteDisabled && styles.historyDeleteButtonDisabled,
                        ]}
                      >
                        <Ionicons
                          color={isDeleting ? '#9AA59E' : '#B4462E'}
                          name="trash-outline"
                          size={20}
                        />
                      </Pressable>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={onCloseExerciseTagDialog}
        transparent
        visible={isExerciseTagDialogOpen}
      >
        <View style={styles.exerciseDialogOverlay}>
          <View style={styles.exerciseDialog}>
            <View style={styles.exerciseDialogHeader}>
              <Text style={styles.exerciseDialogTitle}>Exercise Markers</Text>
              <Pressable
                accessibilityLabel="Close exercise marker list"
                accessibilityRole="button"
                hitSlop={8}
                onPress={onCloseExerciseTagDialog}
                style={styles.exerciseDialogCloseButton}
              >
                <Ionicons color="#215F9A" name="close" size={22} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.exerciseDialogListContent}
              style={styles.exerciseDialogList}
            >
              {isLoading ? (
                <Text style={styles.emptyText}>Loading exercise markers...</Text>
              ) : exerciseTags.length === 0 ? (
                <Text style={styles.emptyText}>No exercise markers yet.</Text>
              ) : (
                exerciseTags.map((tag) => {
                  const isDeleting = deletingExerciseTagId === tag.id;
                  const isDeleteDisabled = deletingExerciseTagId !== null;

                  return (
                    <View key={tag.id} style={styles.workoutTagOption}>
                      <View style={[styles.workoutTagSwatch, { backgroundColor: tag.color }]} />
                      <Text style={styles.workoutTagOptionText}>{tag.name}</Text>
                      <Pressable
                        accessibilityLabel={`Delete ${tag.name}`}
                        accessibilityRole="button"
                        disabled={isDeleteDisabled}
                        hitSlop={8}
                        onPress={() => onDeleteExerciseTag(tag)}
                        style={[
                          styles.settingsExerciseDeleteButton,
                          isDeleteDisabled && styles.historyDeleteButtonDisabled,
                        ]}
                      >
                        <Ionicons
                          color={isDeleting ? '#9AA59E' : '#B4462E'}
                          name="trash-outline"
                          size={20}
                        />
                      </Pressable>
                    </View>
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
