import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { styles } from '../styles';
import { Exercise } from '../types';
import { normalizeExerciseSearch } from '../utils/workoutUtils';

type ExerciseSearchPickerProps = {
  dialogTitle: string;
  emptyText: string;
  exercises: Exercise[];
  isDialogOpen: boolean;
  isLoading: boolean;
  loadingText: string;
  presentation?: 'inline' | 'button';
  buttonText?: string;
  searchText: string;
  title: string;
  onChangeSearch: (value: string) => void;
  onClearSearch: () => void;
  onCloseDialog: () => void;
  onOpenDialog: () => void;
  onSelectExercise: (exercise: Exercise) => void;
};

export function ExerciseSearchPicker({
  dialogTitle,
  emptyText,
  exercises,
  isDialogOpen,
  isLoading,
  loadingText,
  buttonText,
  searchText,
  title,
  onChangeSearch,
  onClearSearch,
  onCloseDialog,
  onOpenDialog,
  onSelectExercise,
}: ExerciseSearchPickerProps) {
  const trimmedSearch = searchText.trim();
  const isSuggestionListOpen = trimmedSearch.length > 0;
  const matchingExercises = useMemo(() => {
    if (!trimmedSearch) {
      return exercises;
    }

    const search = normalizeExerciseSearch(trimmedSearch);
    return exercises.filter((exercise) =>
      normalizeExerciseSearch(exercise.name).startsWith(search),
    );
  }, [exercises, trimmedSearch]);
  const visibleExercises = trimmedSearch ? matchingExercises : [];
  const dialogExercises = trimmedSearch ? matchingExercises : exercises;

  const pickerStatus = trimmedSearch
    ? `${visibleExercises.length} suggestion${visibleExercises.length === 1 ? '' : 's'}`
    : `${exercises.length} exercise${exercises.length === 1 ? '' : 's'} available`;
  const dialogStatus = trimmedSearch
    ? `${dialogExercises.length} match${dialogExercises.length === 1 ? '' : 'es'}`
    : `${exercises.length} exercise${exercises.length === 1 ? '' : 's'} available`;

  const buttonLabel = buttonText ?? title;

  if (isLoading) {
    return <Text style={styles.emptyText}>{loadingText}</Text>;
  }

  if (exercises.length === 0) {
    return <Text style={styles.emptyText}>{emptyText}</Text>;
  }

  return (
    <>

		<Pressable
			accessibilityLabel={buttonLabel}
			accessibilityRole="button"
			onPress={onOpenDialog}
			style={styles.addExercisePickerButton}
		>
			<Ionicons color="#FFFFFF" name={buttonLabel === 'Search' ? 'search' : 'add'} size={20} />
			<Text style={styles.addExercisePickerButtonText}>{buttonLabel}</Text>
		</Pressable>
      
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
                accessibilityLabel="Close exercise list"
                accessibilityRole="button"
                hitSlop={8}
                onPress={onCloseDialog}
                style={styles.exerciseDialogCloseButton}
              >
                <Ionicons color="#215F9A" name="close" size={22} />
              </Pressable>
            </View>
            <TextInput
              onChangeText={onChangeSearch}
              placeholder="Search exercises"
              placeholderTextColor="#6F7A73"
              style={styles.exerciseSearchInput}
              value={searchText}
            />
            <View style={styles.exercisePickerMetaRow}>
              <Text style={styles.exercisePickerStatus}>{dialogStatus}</Text>
              {searchText.length > 0 && (
                <Pressable onPress={onClearSearch}>
                  <Text style={styles.exercisePickerActionText}>Clear</Text>
                </Pressable>
              )}
            </View>
            <ScrollView
              contentContainerStyle={styles.exerciseDialogListContent}
              style={styles.exerciseDialogList}
            >
              {dialogExercises.length === 0 ? (
                <Text style={styles.emptyText}>No exercises match that search.</Text>
              ) : (
                dialogExercises.map((exercise) => (
                  <Pressable
                    key={exercise.id}
                    onPress={() => onSelectExercise(exercise)}
                    style={styles.exerciseOption}
                  >
                      <Text style={styles.exerciseOptionText}>{exercise.name}</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
