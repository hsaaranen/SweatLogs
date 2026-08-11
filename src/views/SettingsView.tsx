import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ExerciseForm } from '../components/ExerciseForm';
import { styles } from '../styles';
import { Exercise, ExerciseSetType, ExerciseTag, WorkoutTag } from '../types';
import { t } from '../localization';
import type { LanguagePreference } from '../localization';

const TAG_COLOR_OPTIONS = [
  '#5AA7FF',
  '#35C2D1',
  '#2EC4A6',
  '#63C174',
  '#B7D957',
  '#F2C94C',
  '#FF9F43',
  '#FF6B6B',
  '#F062B7',
  '#B084F5',
  '#C89B7B',
  '#A7AFBD',
];

type SettingsViewProps = {
  languagePreference: LanguagePreference;
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
  updatingExerciseId: string | null;
  isLoading: boolean;
  isTransferringDatabase: boolean;
  newExerciseName: string;
  newExerciseDescription: string;
  newExerciseSetType: ExerciseSetType;
  newExerciseTagColor: string;
  newExerciseTagName: string;
  newWorkoutTagColor: string;
  newWorkoutTagName: string;
  workoutTags: WorkoutTag[];
  onChangeNewExerciseName: (value: string) => void;
  onChangeNewExerciseDescription: (value: string) => void;
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
  onUpdateExercise: (exerciseId: string, name: string, description: string) => Promise<boolean>;
  onDeleteExerciseTag: (tag: ExerciseTag) => void;
  onDeleteWorkoutTag: (tag: WorkoutTag) => void;
  onOpenExerciseDialog: () => void;
  onOpenExerciseTagDialog: () => void;
  onOpenWorkoutTagDialog: () => void;
  onExportDatabase: () => void;
  onImportDatabase: () => void;
  onChangeLanguage: (preference: LanguagePreference) => void;
};

/** Renders local preferences, backup controls, and editable classification libraries. */
export function SettingsView({
  languagePreference,
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
  updatingExerciseId,
  isLoading,
  isTransferringDatabase,
  newExerciseName,
  newExerciseDescription,
  newExerciseSetType,
  newExerciseTagColor,
  newExerciseTagName,
  newWorkoutTagColor,
  newWorkoutTagName,
  workoutTags,
  onChangeNewExerciseName,
  onChangeNewExerciseDescription,
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
  onUpdateExercise,
  onDeleteExerciseTag,
  onDeleteWorkoutTag,
  onOpenExerciseDialog,
  onOpenExerciseTagDialog,
  onOpenWorkoutTagDialog,
  onExportDatabase,
  onImportDatabase,
  onChangeLanguage,
}: SettingsViewProps) {
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editExerciseName, setEditExerciseName] = useState('');
  const [editExerciseDescription, setEditExerciseDescription] = useState('');

  /** Opens the shared exercise form with an independent editable copy of the selected exercise. */
  const openExerciseEditor = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setEditExerciseName(exercise.name);
    setEditExerciseDescription(exercise.description);
  };

  /** Closes the editor unless an update is currently being persisted. */
  const closeExerciseEditor = () => {
    if (!updatingExerciseId) {
      setEditingExercise(null);
    }
  };

  /** Saves editable exercise fields and closes the modal only after a successful update. */
  const saveExerciseChanges = async () => {
    if (!editingExercise || updatingExerciseId) {
      return;
    }
    if (await onUpdateExercise(editingExercise.id, editExerciseName, editExerciseDescription)) {
      setEditingExercise(null);
    }
  };
  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <Text style={styles.databaseBackupDescription}>{t('settings.languageDescription')}</Text>
        <View style={styles.languageOptionRow}>
          {([
            ['en', t('settings.english')],
            ['fi', t('settings.finnish')],
          ] as const).map(([value, label]) => {
            const isSelected = languagePreference === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => onChangeLanguage(value)}
                style={[styles.languageOption, isSelected && styles.exerciseSetTypeOptionSelected]}
              >
                <Text style={[styles.languageOptionText, isSelected && styles.exerciseSetTypeOptionTextSelected]}>{label}</Text>
                {isSelected && <Ionicons color="#5AA7FF" name="checkmark" size={15} />}
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.dataBackup')}</Text>
        <Text style={styles.databaseBackupDescription}>
          {t('settings.backupDescription')}
        </Text>
        <View style={styles.databaseBackupActions}>
          <Pressable
            accessibilityRole="button"
            disabled={isTransferringDatabase}
            onPress={onExportDatabase}
            style={[styles.databaseBackupButton, isTransferringDatabase && styles.actionButtonDisabled]}
          >
            <Ionicons color="#5AA7FF" name="share-outline" size={20} />
            <Text style={styles.databaseBackupButtonText}>{t('settings.exportBackup')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={isTransferringDatabase}
            onPress={onImportDatabase}
            style={[styles.databaseBackupButton, isTransferringDatabase && styles.actionButtonDisabled]}
          >
            <Ionicons color="#5AA7FF" name="download-outline" size={20} />
            <Text style={styles.databaseBackupButtonText}>{t('settings.importBackup')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.exercisePickerHeaderRow}>
          <Text style={styles.sectionTitle}>{t('settings.createExercise')}</Text>
          <Pressable
            accessibilityLabel={t('actions.browseItems', { items: t('common.exercises').toLowerCase() })}
            accessibilityRole="button"
            onPress={onOpenExerciseDialog}
          >
            <Text style={styles.exercisePickerActionText}>{t('common.browseAll')}</Text>
          </Pressable>
        </View>
        <ExerciseForm
          mode="create"
          name={newExerciseName}
          description={newExerciseDescription}
          setType={newExerciseSetType}
          isSubmitting={isCreatingExercise}
          onChangeName={onChangeNewExerciseName}
          onChangeDescription={onChangeNewExerciseDescription}
          onChangeSetType={onChangeNewExerciseSetType}
          onSubmit={onCreateExercise}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.exercisePickerHeaderRow}>
          <Text style={styles.sectionTitle}>{t('settings.createFocus')}</Text>
          <Pressable
            accessibilityLabel={t('actions.browseItems', { items: t('data.workoutFocus').toLowerCase() })}
            accessibilityRole="button"
            onPress={onOpenWorkoutTagDialog}
          >
            <Text style={styles.exercisePickerActionText}>{t('common.browseAll')}</Text>
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
            placeholder={t('settings.newFocus')}
            placeholderTextColor="#9BA1AD"
            style={styles.exerciseInput}
          />
          <Pressable
            disabled={isCreatingWorkoutTag}
            onPress={onCreateWorkoutTag}
            style={[styles.addButton, isCreatingWorkoutTag && styles.actionButtonDisabled]}
          >
            <Text style={styles.addButtonText}>{isCreatingWorkoutTag ? t('common.creating') : t('common.create')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.exercisePickerHeaderRow}>
          <Text style={styles.sectionTitle}>{t('settings.createMarker')}</Text>
          <Pressable
            accessibilityLabel={t('actions.browseItems', { items: t('settings.exerciseMarkers').toLowerCase() })}
            accessibilityRole="button"
            onPress={onOpenExerciseTagDialog}
          >
            <Text style={styles.exercisePickerActionText}>{t('common.browseAll')}</Text>
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
            placeholder={t('settings.newMarker')}
            placeholderTextColor="#9BA1AD"
            style={styles.exerciseInput}
          />
          <Pressable
            disabled={isCreatingExerciseTag}
            onPress={onCreateExerciseTag}
            style={[styles.addButton, isCreatingExerciseTag && styles.actionButtonDisabled]}
          >
            <Text style={styles.addButtonText}>{isCreatingExerciseTag ? t('common.creating') : t('common.create')}</Text>
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
              <Text style={styles.exerciseDialogTitle}>{t('settings.exerciseLibrary')}</Text>
              <Pressable
                accessibilityLabel={t('picker.closeExerciseList')}
                accessibilityRole="button"
                hitSlop={8}
                onPress={onCloseExerciseDialog}
                style={styles.exerciseDialogCloseButton}
              >
                <Ionicons color="#5AA7FF" name="close" size={22} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.exerciseDialogListContent}
              style={styles.exerciseDialogList}
            >
              {isLoading ? (
                <Text style={styles.emptyText}>{t('settings.loadingExercises')}</Text>
              ) : exercises.length === 0 ? (
                <Text style={styles.emptyText}>{t('settings.noExercises')}</Text>
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
                        accessibilityLabel={t('actions.edit', { name: exercise.name })}
                        accessibilityRole="button"
                        disabled={updatingExerciseId !== null}
                        hitSlop={8}
                        onPress={() => openExerciseEditor(exercise)}
                        style={styles.settingsExerciseDeleteButton}
                      >
                        <Ionicons color="#5AA7FF" name="pencil-outline" size={20} />
                      </Pressable>
                      <Pressable
                        accessibilityLabel={t('actions.delete', { name: exercise.name })}
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
                          color={isDeleting ? '#6D7480' : '#FF7B7B'}
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
        onRequestClose={closeExerciseEditor}
        transparent
        visible={editingExercise !== null}
      >
        <View style={styles.exerciseDialogOverlay}>
          <View style={styles.exerciseDialog}>
            <View style={styles.exerciseDialogHeader}>
              <Text style={styles.exerciseDialogTitle}>{t('settings.editExercise')}</Text>
              <Pressable
                accessibilityLabel={t('common.close')}
                accessibilityRole="button"
                disabled={updatingExerciseId !== null}
                hitSlop={8}
                onPress={closeExerciseEditor}
                style={styles.exerciseDialogCloseButton}
              >
                <Ionicons color="#5AA7FF" name="close" size={22} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.exerciseDialogListContent}>
              {editingExercise && (
                <ExerciseForm
                  mode="edit"
                  name={editExerciseName}
                  description={editExerciseDescription}
                  setType={editingExercise.setType}
                  isSubmitting={updatingExerciseId === editingExercise.id}
                  onChangeName={setEditExerciseName}
                  onChangeDescription={setEditExerciseDescription}
                  onChangeSetType={() => undefined}
                  onSubmit={() => { void saveExerciseChanges(); }}
                  onCancel={closeExerciseEditor}
                />
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
              <Text style={styles.exerciseDialogTitle}>{t('settings.workoutFocus')}</Text>
              <Pressable
                accessibilityLabel={t('actions.closeList', { item: t('data.workoutFocus').toLowerCase() })}
                accessibilityRole="button"
                hitSlop={8}
                onPress={onCloseWorkoutTagDialog}
                style={styles.exerciseDialogCloseButton}
              >
                <Ionicons color="#5AA7FF" name="close" size={22} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.exerciseDialogListContent}
              style={styles.exerciseDialogList}
            >
              {isLoading ? (
                <Text style={styles.emptyText}>{t('settings.loadingFocuses')}</Text>
              ) : workoutTags.length === 0 ? (
                <Text style={styles.emptyText}>{t('settings.noFocuses')}</Text>
              ) : (
                workoutTags.map((tag) => {
                  const isDeleting = deletingWorkoutTagId === tag.id;
                  const isDeleteDisabled = deletingWorkoutTagId !== null;

                  return (
                    <View key={tag.id} style={styles.workoutTagOption}>
                      <View style={[styles.workoutTagSwatch, { backgroundColor: tag.color }]} />
                      <Text style={styles.workoutTagOptionText}>{tag.name}</Text>
                      <Pressable
                        accessibilityLabel={t('actions.delete', { name: tag.name })}
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
                          color={isDeleting ? '#6D7480' : '#FF7B7B'}
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
              <Text style={styles.exerciseDialogTitle}>{t('settings.exerciseMarkers')}</Text>
              <Pressable
                accessibilityLabel={t('actions.closeList', { item: t('data.exerciseMarker').toLowerCase() })}
                accessibilityRole="button"
                hitSlop={8}
                onPress={onCloseExerciseTagDialog}
                style={styles.exerciseDialogCloseButton}
              >
                <Ionicons color="#5AA7FF" name="close" size={22} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.exerciseDialogListContent}
              style={styles.exerciseDialogList}
            >
              {isLoading ? (
                <Text style={styles.emptyText}>{t('settings.loadingMarkers')}</Text>
              ) : exerciseTags.length === 0 ? (
                <Text style={styles.emptyText}>{t('settings.noMarkers')}</Text>
              ) : (
                exerciseTags.map((tag) => {
                  const isDeleting = deletingExerciseTagId === tag.id;
                  const isDeleteDisabled = deletingExerciseTagId !== null;

                  return (
                    <View key={tag.id} style={styles.workoutTagOption}>
                      <View style={[styles.workoutTagSwatch, { backgroundColor: tag.color }]} />
                      <Text style={styles.workoutTagOptionText}>{tag.name}</Text>
                      <Pressable
                        accessibilityLabel={t('actions.delete', { name: tag.name })}
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
                          color={isDeleting ? '#6D7480' : '#FF7B7B'}
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
