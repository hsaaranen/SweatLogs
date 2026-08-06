import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ExerciseSearchPicker } from '../components/ExerciseSearchPicker';
import { styles } from '../styles';
import { Exercise, WorkoutTag, WorkoutTemplate, WorkoutTemplateExercise } from '../types';
import { MAX_WORKOUT_SETS, MIN_WORKOUT_SETS } from '../utils/workoutUtils';

type PlannerViewProps = {
  exercises: Exercise[];
  workoutTags: WorkoutTag[];
  templates: WorkoutTemplate[];
  templateName: string;
  selectedExercises: WorkoutTemplateExercise[];
  selectedTagIds: string[];
  exerciseSearchText: string;
  isExerciseDialogOpen: boolean;
  isSaving: boolean;
  deletingTemplateId: string | null;
  editingTemplateId: string | null;
  onChangeTemplateName: (value: string) => void;
  onChangeExerciseSearch: (value: string) => void;
  onOpenExerciseDialog: () => void;
  onCloseExerciseDialog: () => void;
  onClearExerciseSearch: () => void;
  onAddExercise: (exercise: Exercise) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onUpdateSetCount: (exerciseId: string, setCount: number) => void;
  onToggleTag: (tagId: string) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onDelete: (template: WorkoutTemplate) => void;
  onEdit: (template: WorkoutTemplate) => void;
};

export function PlannerView({
  exercises,
  workoutTags,
  templates,
  templateName,
  selectedExercises,
  selectedTagIds,
  exerciseSearchText,
  isExerciseDialogOpen,
  isSaving,
  deletingTemplateId,
  editingTemplateId,
  onChangeTemplateName,
  onChangeExerciseSearch,
  onOpenExerciseDialog,
  onCloseExerciseDialog,
  onClearExerciseSearch,
  onAddExercise,
  onRemoveExercise,
  onUpdateSetCount,
  onToggleTag,
  onSave,
  onCancelEdit,
  onDelete,
  onEdit,
}: PlannerViewProps) {
  const [isTagPickerOpen, setIsTagPickerOpen] = useState(false);
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const selectedTags = useMemo(
    () => workoutTags.filter((tag) => selectedTagIds.includes(tag.id)),
    [selectedTagIds, workoutTags],
  );
  const availableExercises = exercises.filter(
    (exercise) => !selectedExercises.some((selected) => selected.exercise.id === exercise.id),
  );

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {editingTemplateId ? 'Edit workout template' : 'Create workout template'}
        </Text>
        <TextInput
          onChangeText={onChangeTemplateName}
          placeholder="Template name"
          style={styles.exerciseInput}
          value={templateName}
        />

        <View style={styles.workoutTagRow}>
          <Text style={styles.tagRowLabel}>Focus:</Text>
          <Pressable
            accessibilityLabel="Choose workout focus"
            accessibilityRole="button"
            onPress={() => setIsTagPickerOpen(true)}
            style={styles.workoutTagChipList}
          >
            {selectedTags.length === 0 ? (
              <Text style={styles.workoutTagPlaceholder}>
                No focus
              </Text>
            ) : (
              selectedTags.map((tag) => (
                <View key={tag.id} style={styles.workoutTagChip}>
                  <View style={[styles.workoutTagSwatch, { backgroundColor: tag.color }]} />
                  <Text style={styles.workoutTagChipText}>{tag.name}</Text>
                </View>
              ))
            )}
          </Pressable>
        </View>

        <ExerciseSearchPicker
          dialogTitle="All exercises"
          emptyText="No exercises available."
          exercises={availableExercises}
          isDialogOpen={isExerciseDialogOpen}
          isLoading={false}
          loadingText="Loading exercises..."
          onChangeSearch={onChangeExerciseSearch}
          onClearSearch={onClearExerciseSearch}
          onCloseDialog={onCloseExerciseDialog}
          onOpenDialog={onOpenExerciseDialog}
          onSelectExercise={onAddExercise}
          searchText={exerciseSearchText}
          title="Add exercise"
        />

        <View style={styles.plannerExerciseList}>
          {selectedExercises.map(({ exercise, setCount }, index) => (
            <View key={exercise.id} style={styles.plannerExerciseRow}>
              <Text style={styles.plannerExerciseOrder}>{index + 1}</Text>
              <Text style={styles.plannerExerciseName}>{exercise.name}</Text>
              <View style={styles.plannerSetCountControl}>
                <Pressable
                  disabled={setCount <= MIN_WORKOUT_SETS}
                  onPress={() => onUpdateSetCount(exercise.id, setCount - 1)}
                  style={styles.plannerSetCountButton}
                >
                  <Ionicons color="#215F9A" name="remove" size={18} />
                </Pressable>
                <Text style={styles.plannerSetCountText}>{setCount} sets</Text>
                <Pressable
                  disabled={setCount >= MAX_WORKOUT_SETS}
                  onPress={() => onUpdateSetCount(exercise.id, setCount + 1)}
                  style={styles.plannerSetCountButton}
                >
                  <Ionicons color="#215F9A" name="add" size={18} />
                </Pressable>
              </View>
              <Pressable onPress={() => onRemoveExercise(exercise.id)}>
                <Ionicons color="#B4462E" name="close-circle-outline" size={22} />
              </Pressable>
            </View>
          ))}
        </View>

        <Pressable
          disabled={
            isSaving ||
            !templateName.trim() ||
            selectedExercises.length === 0 ||
            selectedTagIds.length === 0
          }
          onPress={onSave}
          style={[
            styles.addButton,
            (isSaving ||
              !templateName.trim() ||
              selectedExercises.length === 0 ||
              selectedTagIds.length === 0) &&
              styles.actionButtonDisabled,
          ]}
        >
          <Text style={styles.addButtonText}>
            {isSaving ? 'Saving' : editingTemplateId ? 'Save changes' : 'Save template'}
          </Text>
        </Pressable>
        {editingTemplateId && (
          <Pressable onPress={onCancelEdit} style={styles.cancelWorkoutButton}>
            <Text style={styles.cancelWorkoutButtonText}>Cancel editing</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Saved templates</Text>
        {templates.length === 0 ? (
          <Text style={styles.emptyText}>No workout templates yet.</Text>
        ) : (
          templates.map((template) => {
            const isExpanded = expandedTemplateId === template.id;

            return (
              <View key={template.id} style={styles.plannerTemplateCard}>
                <View style={styles.plannerTemplateHeader}>
                  <Pressable
                    accessibilityLabel={`${isExpanded ? 'Minimize' : 'Expand'} ${template.name}`}
                    accessibilityRole="button"
                    onPress={() =>
                      setExpandedTemplateId((current) =>
                        current === template.id ? null : template.id,
                      )
                    }
                    style={styles.plannerTemplateExpandButton}
                  >
                    <View style={styles.plannerTemplateTitleBlock}>
                      <Text style={styles.plannerTemplateTitle}>{template.name}</Text>
                      <Text style={styles.plannerTemplateMeta}>
                        {template.exercises.length} exercise
                        {template.exercises.length === 1 ? '' : 's'}
                      </Text>
                    </View>
                    <Ionicons
                      color="#215F9A"
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={22}
                    />
                  </Pressable>
                  <View style={styles.plannerTemplateActions}>
                    <Pressable
                      accessibilityLabel={`Edit ${template.name}`}
                      accessibilityRole="button"
                      onPress={() => onEdit(template)}
                    >
                      <Ionicons color="#215F9A" name="create-outline" size={21} />
                    </Pressable>
                    <Pressable
                      disabled={deletingTemplateId === template.id}
                      onPress={() => onDelete(template)}
                    >
                      <Ionicons color="#B4462E" name="trash-outline" size={20} />
                    </Pressable>
                  </View>
                </View>
                {isExpanded && (
                  <>
                    <View style={styles.plannerTagList}>
                      {template.tags.map((tag) => (
                        <View key={tag.id} style={styles.workoutTagChip}>
                          <View style={[styles.workoutTagSwatch, { backgroundColor: tag.color }]} />
                          <Text style={styles.workoutTagChipText}>{tag.name}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.plannerExerciseList}>
                      {template.exercises.map(({ exercise, setCount }, index) => (
                        <View key={exercise.id} style={styles.plannerExerciseRow}>
                          <Text style={styles.plannerExerciseOrder}>{index + 1}</Text>
                          <Text style={styles.plannerExerciseName}>{exercise.name}</Text>
                          <View style={styles.plannerSavedSetCount}>
                            <Text style={styles.plannerSetCountText}>{setCount} sets</Text>
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
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsTagPickerOpen(false)}
        transparent
        visible={isTagPickerOpen}
      >
        <View style={styles.exerciseDialogOverlay}>
          <View style={styles.exerciseDialog}>
            <View style={styles.exerciseDialogHeader}>
              <Text style={styles.exerciseDialogTitle}>Workout focus</Text>
              <Pressable
                accessibilityLabel="Close workout focus list"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setIsTagPickerOpen(false)}
                style={styles.exerciseDialogCloseButton}
              >
                <Ionicons color="#215F9A" name="close" size={22} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.exerciseDialogListContent}
              style={styles.exerciseDialogList}
            >
              {selectedTagIds.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => selectedTagIds.forEach(onToggleTag)}
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
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <Pressable
                      key={tag.id}
                      accessibilityRole="button"
                      onPress={() => onToggleTag(tag.id)}
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
