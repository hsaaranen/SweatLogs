import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ExerciseSearchPicker } from '../components/ExerciseSearchPicker';
import { ExerciseProgressChart } from '../components/ExerciseProgressChart';
import { ExerciseRecordEditorModal } from '../components/ExerciseRecordEditorModal';
import { styles } from '../styles';
import {
  DataSearchMode,
  Exercise,
  ExerciseRecord,
  ExerciseRecordSet,
  ExerciseTag,
  WorkoutHistory,
  WorkoutTag,
} from '../types';
import {
  formatSetMetrics,
  formatWorkoutTagLabel,
  normalizeExerciseSearch,
} from '../utils/workoutUtils';
import { t } from '../localization';

type DataViewProps = {
  dataSearchMode: DataSearchMode;
  exerciseSearchText: string;
  exerciseTagSearchText: string;
  workoutTagSearchText: string;
  exercises: Exercise[];
  exerciseTags: ExerciseTag[];
  workoutTags: WorkoutTag[];
  exerciseTagExercises: Exercise[];
  workoutTagWorkouts: WorkoutHistory[];
  isExerciseDialogOpen: boolean;
  isExerciseTagDialogOpen: boolean;
  isWorkoutTagDialogOpen: boolean;
  isLoading: boolean;
  isLoadingRecords: boolean;
  isLoadingTagResults: boolean;
  records: ExerciseRecord[];
  selectedExercise: Exercise | null;
  selectedExerciseTag: ExerciseTag | null;
  selectedWorkoutTag: WorkoutTag | null;
  savingRecordId: string | null;
  deletingRecordId: string | null;
  onChangeDataSearchMode: (mode: DataSearchMode) => void;
  onChangeExerciseSearch: (value: string) => void;
  onChangeExerciseTagSearch: (value: string) => void;
  onChangeWorkoutTagSearch: (value: string) => void;
  onClearExerciseSearch: () => void;
  onClearExerciseTagSearch: () => void;
  onClearWorkoutTagSearch: () => void;
  onClearSelectedExercise: () => void;
  onCloseExerciseDialog: () => void;
  onCloseExerciseTagDialog: () => void;
  onCloseWorkoutTagDialog: () => void;
  onOpenExerciseDialog: () => void;
  onOpenExerciseTagDialog: () => void;
  onOpenWorkoutTagDialog: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  onSelectExerciseTag: (tag: ExerciseTag) => void;
  onSelectWorkoutTag: (tag: WorkoutTag) => void;
  onUpdateRecord: (recordId: string, sets: ExerciseRecordSet[]) => Promise<void>;
  onDeleteRecord: (recordId: string) => void;
};

type DataSearchModeOption = {
  label: string;
  value: DataSearchMode;
};

type TagItem = ExerciseTag | WorkoutTag;

type TagSearchPickerProps<TTag extends TagItem> = {
  dialogTitle: string;
  emptyText: string;
  isDialogOpen: boolean;
  isLoading: boolean;
  loadingText: string;
  presentation?: 'inline' | 'button';
  buttonText?: string;
  searchText: string;
  selectedTag: TTag | null;
  tags: TTag[];
  title: string;
  pluralTitle: string;
  onChangeSearch: (value: string) => void;
  onClearSearch: () => void;
  onCloseDialog: () => void;
  onOpenDialog: () => void;
  onSelectTag: (tag: TTag) => void;
};

export function DataView({
  dataSearchMode,
  exerciseSearchText,
  exerciseTagSearchText,
  workoutTagSearchText,
  exercises,
  exerciseTags,
  workoutTags,
  exerciseTagExercises,
  workoutTagWorkouts,
  isExerciseDialogOpen,
  isExerciseTagDialogOpen,
  isWorkoutTagDialogOpen,
  isLoading,
  isLoadingRecords,
  isLoadingTagResults,
  records,
  selectedExercise,
  selectedExerciseTag,
  selectedWorkoutTag,
  savingRecordId,
  deletingRecordId,
  onChangeDataSearchMode,
  onChangeExerciseSearch,
  onChangeExerciseTagSearch,
  onChangeWorkoutTagSearch,
  onClearExerciseSearch,
  onClearExerciseTagSearch,
  onClearWorkoutTagSearch,
  onClearSelectedExercise,
  onCloseExerciseDialog,
  onCloseExerciseTagDialog,
  onCloseWorkoutTagDialog,
  onOpenExerciseDialog,
  onOpenExerciseTagDialog,
  onOpenWorkoutTagDialog,
  onSelectExercise,
  onSelectExerciseTag,
  onSelectWorkoutTag,
  onUpdateRecord,
  onDeleteRecord,
}: DataViewProps) {
  const dataSearchModeOptions: DataSearchModeOption[] = [
    { label: t('common.exercises'), value: 'exercise' },
    { label: t('settings.exerciseMarkers'), value: 'exerciseTag' },
    { label: t('data.workoutFocus'), value: 'workoutTag' },
  ];
  const [expandedWorkoutIds, setExpandedWorkoutIds] = useState<string[]>([]);
  const [expandedRecordIds, setExpandedRecordIds] = useState<string[]>([]);
  const [editingRecord, setEditingRecord] = useState<ExerciseRecord | null>(null);
  const recordIds = useMemo(() => new Set(records.map((record) => record.id)), [records]);
  const workoutResultIds = useMemo(
    () => new Set(workoutTagWorkouts.map((workout) => workout.id)),
    [workoutTagWorkouts],
  );

  useEffect(() => {
    setExpandedWorkoutIds([]);
  }, [selectedWorkoutTag?.id]);

  useEffect(() => {
    setExpandedWorkoutIds((current) =>
      current.filter((workoutId) => workoutResultIds.has(workoutId)),
    );
  }, [workoutResultIds]);

  useEffect(() => {
    setExpandedRecordIds([]);
  }, [dataSearchMode, selectedExercise?.id, selectedExerciseTag?.id]);

  useEffect(() => {
    setExpandedRecordIds((current) => current.filter((recordId) => recordIds.has(recordId)));
  }, [recordIds]);

  const toggleWorkoutExpanded = (workoutId: string) => {
    setExpandedWorkoutIds((current) =>
      current.includes(workoutId)
        ? current.filter((id) => id !== workoutId)
        : [...current, workoutId],
    );
  };

  const toggleRecordExpanded = (recordId: string) => {
    setExpandedRecordIds((current) =>
      current.includes(recordId)
        ? current.filter((id) => id !== recordId)
        : [...current, recordId],
    );
  };

  const beginEditingRecord = (record: ExerciseRecord) => {
    setEditingRecord(record);
  };

  const renderRecordActions = (record: ExerciseRecord) => {
    const isBusy = savingRecordId === record.id || deletingRecordId === record.id;
    return (
      <View style={styles.plannerTemplateActions}>
        <Pressable
          accessibilityLabel={t('actions.edit', { name: record.completedAt })}
          accessibilityRole="button"
          disabled={isBusy}
          hitSlop={8}
          onPress={() => beginEditingRecord(record)}
        >
          <Ionicons color={isBusy ? '#6D7480' : '#5AA7FF'} name="create-outline" size={20} />
        </Pressable>
        <Pressable
          accessibilityLabel={t('actions.delete', { name: record.completedAt })}
          accessibilityRole="button"
          disabled={isBusy}
          hitSlop={8}
          onPress={() => onDeleteRecord(record.id)}
        >
          <Ionicons color={isBusy ? '#6D7480' : '#FF7B7B'} name="trash-outline" size={20} />
        </Pressable>
      </View>
    );
  };
  const renderRecordTags = (record: ExerciseRecord) => (
    <View style={styles.historyTitleBlock}>
      {record.tags.length === 0 ? (
        <Text style={styles.workoutTagPlaceholder}>{t('data.noMarkers')}</Text>
      ) : (
        record.tags.map((tag) => <TagChip key={tag.id} tag={tag} />)
      )}
    </View>
  );

  const renderRecordSets = (record: ExerciseRecord) => (
    <View style={styles.historySetList}>
      {record.sets.map((set) => (
        <View key={`${record.id}-${set.setNumber}`} style={styles.historySetRow}>
          <Text style={styles.historySetNumber}>{set.setNumber}</Text>
          {formatSetMetrics(set).map((metric) => (
            <Text key={metric} style={styles.historySetMetric}>
              {metric}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );

  const renderRecordCards = (emptyText: string, loadingText: string) => {
    if (isLoadingRecords) {
      return (
        <View style={styles.historyItem}>
          <Text style={styles.emptyText}>{loadingText}</Text>
        </View>
      );
    }

    if (records.length === 0) {
      return (
        <View style={styles.historyItem}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      );
    }

    return records.map((record) => {
      const isExpanded = expandedRecordIds.includes(record.id);

      return (
        <View key={record.id} style={styles.historyItem}>
          <View style={styles.historyHeader}>
            <Pressable
              accessibilityLabel={t(isExpanded ? 'actions.collapse' : 'actions.expand', { name: record.completedAt })}
              accessibilityRole="button"
              onPress={() => toggleRecordExpanded(record.id)}
              style={styles.historyHeaderButton}
            >
              {renderRecordTags(record)}
              <Text style={styles.dataRecordDate}>{record.completedAt}</Text>
              <Ionicons
                color="#5AA7FF"
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={22}
              />
            </Pressable>
            {renderRecordActions(record)}
          </View>

          {isExpanded && renderRecordSets(record)}
        </View>
      );
    });
  };

  const renderInlineRecordBlocks = (emptyText: string, loadingText: string) => {
    if (isLoadingRecords) {
      return <Text style={styles.emptyText}>{loadingText}</Text>;
    }

    if (records.length === 0) {
      return <Text style={styles.emptyText}>{emptyText}</Text>;
    }

    return (
      <View style={styles.historyExerciseList}>
        {records.map((record) => (
          <View key={record.id} style={styles.historyExerciseBlock}>
            <View style={styles.historyHeader}>
              {renderRecordTags(record)}
              <Text style={styles.dataRecordDate}>{record.completedAt}</Text>
              {renderRecordActions(record)}
            </View>

            {renderRecordSets(record)}
          </View>
        ))}
      </View>
    );
  };
  const renderExerciseResults = () => {
    if (!selectedExercise) {
      return (
        <View style={styles.historyItem}>
          <Text style={styles.emptyText}>{t('data.selectExercise')}</Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.section}>
          <Text style={styles.exercisePickerTitle}>{selectedExercise.name}</Text>
          <ExerciseProgressChart
            exercise={selectedExercise}
            isLoading={isLoadingRecords}
            records={records}
          />
        </View>
        {renderRecordCards(
          t('data.noRecords', { name: selectedExercise.name }),
          t('data.loadingRecords', { name: selectedExercise.name }),
        )}
      </>
    );
  };

  const renderExerciseTagResults = () => {
    if (!selectedExerciseTag) {
      return (
        <View style={styles.historyItem}>
          <Text style={styles.emptyText}>{t('data.selectMarker')}</Text>
        </View>
      );
    }

    if (isLoadingTagResults) {
      return (
        <View style={styles.historyItem}>
          <Text style={styles.emptyText}>{t('data.loadingFor', { items: t('common.exercises').toLowerCase(), name: selectedExerciseTag.name })}</Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.exercisePickerTitle}>{t('common.exercises')}</Text>
            <TagChip tag={selectedExerciseTag} />
          </View>
          <Text style={styles.exercisePickerStatus}>
            {exerciseTagExercises.length} exercise{exerciseTagExercises.length === 1 ? '' : 's'}
          </Text>
        </View>
        {exerciseTagExercises.length === 0 ? (
          <View style={styles.historyItem}>
            <Text style={styles.emptyText}>{t('data.noExerciseRecords', { name: selectedExerciseTag.name })}</Text>
          </View>
        ) : (
          exerciseTagExercises.map((exercise) => {
            const isExpanded = selectedExercise?.id === exercise.id;

            return (
              <View key={exercise.id} style={styles.historyItem}>
                <Pressable
                  accessibilityLabel={t(isExpanded ? 'actions.collapse' : 'actions.expand', { name: exercise.name })}
                  accessibilityRole="button"
                  onPress={() => (isExpanded ? onClearSelectedExercise() : onSelectExercise(exercise))}
                  style={styles.historyHeaderButton}
                >
                  <View style={styles.historyTitleBlock}>
                    <Text style={styles.historyTitle}>{exercise.name}</Text>
                    <TagChip tag={selectedExerciseTag} />
                  </View>
                  <Ionicons
                    color="#5AA7FF"
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={22}
                  />
                </Pressable>

                {isExpanded && renderInlineRecordBlocks(
                  t('data.noTaggedRecords', { tag: selectedExerciseTag.name, name: exercise.name }),
                  t('data.loadingTaggedRecords', { tag: selectedExerciseTag.name, name: exercise.name }),
                )}
              </View>
            );
          })
        )}
      </>
    );
  };
  const renderWorkoutTagResults = () => {
    if (!selectedWorkoutTag) {
      return (
        <View style={styles.historyItem}>
          <Text style={styles.emptyText}>{t('data.selectFocus')}</Text>
        </View>
      );
    }

    if (isLoadingTagResults) {
      return (
        <View style={styles.historyItem}>
          <Text style={styles.emptyText}>{t('data.loadingFor', { items: t('common.workouts').toLowerCase(), name: selectedWorkoutTag.name })}</Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.exercisePickerTitle}>{t('common.workouts')}</Text>
            <TagChip tag={selectedWorkoutTag} />
          </View>
          <Text style={styles.exercisePickerStatus}>
            {workoutTagWorkouts.length} workout{workoutTagWorkouts.length === 1 ? '' : 's'}
          </Text>
        </View>
        {workoutTagWorkouts.length === 0 ? (
          <View style={styles.historyItem}>
            <Text style={styles.emptyText}>{t('data.noWorkouts', { name: selectedWorkoutTag.name })}</Text>
          </View>
        ) : (
          workoutTagWorkouts.map((workout) => {
            const isExpanded = expandedWorkoutIds.includes(workout.id);
            const workoutTitle = formatWorkoutTagLabel(workout.tags);

            return (
              <View key={workout.id} style={styles.historyItem}>
                <Pressable
                  accessibilityLabel={t(isExpanded ? 'actions.collapse' : 'actions.expand', { name: workoutTitle })}
                  accessibilityRole="button"
                  onPress={() => toggleWorkoutExpanded(workout.id)}
                  style={styles.historyHeaderButton}
                >
                  <View style={styles.historyTitleBlock}>
                    {workout.tags.length === 0 ? (
                      <Text style={styles.workoutTagPlaceholder}>{t('data.noFocus')}</Text>
                    ) : (
                      workout.tags.map((tag) => <TagChip key={tag.id} tag={tag} />)
                    )}
                  </View>
                  <Text style={styles.dataRecordDate}>{workout.completedAt}</Text>
                  <Ionicons
                    color="#5AA7FF"
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={22}
                  />
                </Pressable>

                {isExpanded && (
                  <>
                    {workout.notes.length > 0 && (
                      <Text style={styles.historyNotes}>{workout.notes}</Text>
                    )}
                    <View style={styles.historyExerciseList}>
                      {workout.exercises.map((exercise) => (
                        <View key={exercise.id} style={styles.historyExerciseBlock}>
                          <View style={styles.historyExerciseTitleBlock}>
                            <Text style={styles.historyExerciseName}>{exercise.exerciseName}</Text>
                            {exercise.tags.length > 0 && (
                              <View style={styles.historyExerciseTagList}>
                                {exercise.tags.map((tag) => <TagChip key={tag.id} tag={tag} />)}
                              </View>
                            )}
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
      </>
    );
  };

  return (
    <>
      <View style={styles.section}>
        <View style={styles.dataModeRow}>
          {dataSearchModeOptions.map((option) => {
            const isSelected = option.value === dataSearchMode;

            return (
              <Pressable
                key={option.value}
                accessibilityLabel={t('actions.searchItem', { item: option.label })}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => onChangeDataSearchMode(option.value)}
                style={[styles.dataModeButton, isSelected && styles.dataModeButtonSelected]}
              >
                <Text
                  style={[
                    styles.dataModeButtonText,
                    isSelected && styles.dataModeButtonTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {dataSearchMode === 'exercise' && (
          <ExerciseSearchPicker
            dialogTitle="All exercises"
            emptyText="Start the API to load exercises."
            exercises={exercises}
            isDialogOpen={isExerciseDialogOpen}
            isLoading={isLoading}
            loadingText={t('settings.loadingExercises')}
            buttonText={t('common.search')}
            searchText={exerciseSearchText}
            title={t('data.exercise')}
            onChangeSearch={onChangeExerciseSearch}
            onClearSearch={onClearExerciseSearch}
            onCloseDialog={onCloseExerciseDialog}
            onOpenDialog={onOpenExerciseDialog}
            onSelectExercise={onSelectExercise}
          />
        )}

        {dataSearchMode === 'exerciseTag' && (
          <TagSearchPicker
            dialogTitle="All exercise markers"
            emptyText="Create exercise markers in Settings first."
            isDialogOpen={isExerciseTagDialogOpen}
            isLoading={isLoading}
            loadingText={t('settings.loadingMarkers')}
            presentation="button"
            buttonText={t('common.search')}
            searchText={exerciseTagSearchText}
            selectedTag={selectedExerciseTag}
            tags={exerciseTags}
            title={t('data.exerciseMarker')}
            pluralTitle="exercise markers"
            onChangeSearch={onChangeExerciseTagSearch}
            onClearSearch={onClearExerciseTagSearch}
            onCloseDialog={onCloseExerciseTagDialog}
            onOpenDialog={onOpenExerciseTagDialog}
            onSelectTag={onSelectExerciseTag}
          />
        )}

        {dataSearchMode === 'workoutTag' && (
          <TagSearchPicker
            dialogTitle="All workout focus"
            emptyText="Create workout focus in Settings first."
            isDialogOpen={isWorkoutTagDialogOpen}
            isLoading={isLoading}
            loadingText={t('settings.loadingFocuses')}
            presentation="button"
            buttonText={t('common.search')}
            searchText={workoutTagSearchText}
            selectedTag={selectedWorkoutTag}
            tags={workoutTags}
            title={t('data.workoutFocus')}
            pluralTitle="workout focus"
            onChangeSearch={onChangeWorkoutTagSearch}
            onClearSearch={onClearWorkoutTagSearch}
            onCloseDialog={onCloseWorkoutTagDialog}
            onOpenDialog={onOpenWorkoutTagDialog}
            onSelectTag={onSelectWorkoutTag}
          />
        )}
      </View>

      {dataSearchMode === 'exercise'
        ? renderExerciseResults()
        : dataSearchMode === 'exerciseTag'
          ? renderExerciseTagResults()
          : renderWorkoutTagResults()}

      <ExerciseRecordEditorModal
        isSaving={savingRecordId === editingRecord?.id}
        record={editingRecord ? {
          ...editingRecord,
          exerciseName: selectedExercise?.name ?? 'exercise',
        } : null}
        onClose={() => setEditingRecord(null)}
        onSave={onUpdateRecord}
      />
    </>
  );
}

function TagSearchPicker<TTag extends TagItem>({
  dialogTitle,
  emptyText,
  isDialogOpen,
  isLoading,
  loadingText,
  presentation = 'inline',
  buttonText,
  searchText,
  selectedTag,
  tags,
  title,
  pluralTitle,
  onChangeSearch,
  onClearSearch,
  onCloseDialog,
  onOpenDialog,
  onSelectTag,
}: TagSearchPickerProps<TTag>) {
  const trimmedSearch = searchText.trim();
  const isSuggestionListOpen = trimmedSearch.length > 0;
  const matchingTags = useMemo(() => {
    if (!trimmedSearch) {
      return tags;
    }

    const search = normalizeExerciseSearch(trimmedSearch);
    return tags.filter((tag) => normalizeExerciseSearch(tag.name).startsWith(search));
  }, [tags, trimmedSearch]);
  const visibleTags = trimmedSearch ? matchingTags : [];
  const dialogTags = trimmedSearch ? matchingTags : tags;

  const pickerStatus = trimmedSearch
    ? t('picker.suggestions', { count: visibleTags.length })
    : t('picker.matches', { count: tags.length });
  const dialogStatus = trimmedSearch
    ? t('picker.matches', { count: dialogTags.length })
    : t('picker.matches', { count: tags.length });

  const buttonLabel = buttonText ?? title;

  if (isLoading) {
    return <Text style={styles.emptyText}>{loadingText}</Text>;
  }

  if (tags.length === 0) {
    return <Text style={styles.emptyText}>{emptyText}</Text>;
  }

  return (
    <>
      {presentation === 'button' ? (
        <Pressable
              accessibilityLabel={t('actions.searchItem', { item: pluralTitle })}
          accessibilityRole="button"
          onPress={onOpenDialog}
          style={styles.addExercisePickerButton}
        >
          <Ionicons color="#FFFFFF" name="search" size={20} />
          <Text style={styles.addExercisePickerButtonText}>{buttonLabel}</Text>
        </Pressable>
      ) : (
        <>
          <View style={styles.exercisePickerHeaderRow}>
            <Text style={styles.exercisePickerTitle}>{title}</Text>
            <Pressable
              accessibilityLabel={t('actions.browseItems', { items: pluralTitle })}
              accessibilityRole="button"
              onPress={onOpenDialog}
            >
              <Text style={styles.exercisePickerActionText}>{t('common.browseAll')}</Text>
            </Pressable>
          </View>
          <TextInput
            onChangeText={onChangeSearch}
            placeholder={t('actions.searchItem', { item: pluralTitle })}
            placeholderTextColor="#9BA1AD"
            style={styles.exerciseSearchInput}
            value={searchText}
          />
          <View style={styles.exercisePickerMetaRow}>
            <Text style={styles.exercisePickerStatus}>{pickerStatus}</Text>
            <View style={styles.exercisePickerActions}>
              {searchText.length > 0 && (
                <Pressable onPress={onClearSearch}>
                  <Text style={styles.exercisePickerActionText}>{t('common.clear')}</Text>
                </Pressable>
              )}
            </View>
          </View>

          {isSuggestionListOpen && visibleTags.length === 0 ? (
            <Text style={styles.emptyText}>{t('common.noMatches')}</Text>
          ) : isSuggestionListOpen ? (
            <View style={styles.exerciseList}>
              {visibleTags.map((tag) => (
                <TagOption
                  key={tag.id}
                  isSelected={selectedTag?.id === tag.id}
                  tag={tag}
                  onPress={onSelectTag}
                />
              ))}
            </View>
          ) : selectedTag ? (
            <TagChip tag={selectedTag} />
          ) : null}
        </>
      )}
      <Modal
        animationType="fade"
        onRequestClose={onCloseDialog}
        transparent
        visible={isDialogOpen}
      >
        <View style={styles.exerciseDialogOverlay}>
          <View style={styles.exerciseDialog}>
            <View style={styles.exerciseDialogHeader}>
              <Text style={styles.exerciseDialogTitle}>{dialogTitle}</Text>
              <Pressable
                accessibilityLabel={t('actions.closeList', { item: title.toLowerCase() })}
                accessibilityRole="button"
                hitSlop={8}
                onPress={onCloseDialog}
                style={styles.exerciseDialogCloseButton}
              >
                <Ionicons color="#5AA7FF" name="close" size={22} />
              </Pressable>
            </View>
            <TextInput
              onChangeText={onChangeSearch}
              placeholder={t('actions.searchItem', { item: pluralTitle })}
              placeholderTextColor="#9BA1AD"
              style={styles.exerciseSearchInput}
              value={searchText}
            />
            <View style={styles.exercisePickerMetaRow}>
              <Text style={styles.exercisePickerStatus}>{dialogStatus}</Text>
              {searchText.length > 0 && (
                <Pressable onPress={onClearSearch}>
                  <Text style={styles.exercisePickerActionText}>{t('common.clear')}</Text>
                </Pressable>
              )}
            </View>
            <ScrollView
              contentContainerStyle={styles.exerciseDialogListContent}
              style={styles.exerciseDialogList}
            >
              {dialogTags.length === 0 ? (
                <Text style={styles.emptyText}>{t('common.noMatches')}</Text>
              ) : (
                dialogTags.map((tag) => (
                  <TagOption
                    key={tag.id}
                    isSelected={selectedTag?.id === tag.id}
                    tag={tag}
                    onPress={onSelectTag}
                  />
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function TagOption<TTag extends TagItem>({
  isSelected,
  tag,
  onPress,
}: {
  isSelected: boolean;
  tag: TTag;
  onPress: (tag: TTag) => void;
}) {
  return (
    <Pressable
      accessibilityLabel={t('actions.select', { name: tag.name })}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={() => onPress(tag)}
      style={[styles.workoutTagOption, isSelected && styles.workoutTagOptionSelected]}
    >
      <View style={[styles.workoutTagSwatch, { backgroundColor: tag.color }]} />
      <Text style={styles.workoutTagOptionText}>{tag.name}</Text>
      {isSelected && <Ionicons color="#5AA7FF" name="checkmark" size={16} />}
    </Pressable>
  );
}

function TagChip({ tag }: { tag: TagItem }) {
  return (
    <View style={styles.workoutTagChip}>
      <View style={[styles.workoutTagSwatch, { backgroundColor: tag.color }]} />
      <Text style={styles.workoutTagChipText}>{tag.name}</Text>
    </View>
  );
}
