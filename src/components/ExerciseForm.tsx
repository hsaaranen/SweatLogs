import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { t } from '../localization';
import { styles } from '../styles';
import type { ExerciseSetType } from '../types';
import { getExerciseSetTypeOptions } from '../utils/workoutUtils';

type ExerciseFormProps = {
  mode: 'create' | 'edit';
  name: string;
  description: string;
  setType: ExerciseSetType;
  isSubmitting: boolean;
  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeSetType: (value: ExerciseSetType) => void;
  onSubmit: () => void;
  onCancel?: () => void;
};

/** Provides the shared controlled form used to create or edit an exercise. */
export function ExerciseForm({
  mode,
  name,
  description,
  setType,
  isSubmitting,
  onChangeName,
  onChangeDescription,
  onChangeSetType,
  onSubmit,
  onCancel,
}: ExerciseFormProps) {
  const exerciseSetTypeOptions = getExerciseSetTypeOptions();
  const isEditing = mode === 'edit';
  const setTypeFieldPreviews: Record<ExerciseSetType, string[]> = {
    Strength: [t('record.reps'), t('record.weight')],
    Duration: [t('record.minutes'), t('record.seconds')],
    RepsOnly: [t('record.reps')],
    Distance: [t('record.kilometers')],
    DistanceDuration: [t('record.kilometers'), t('record.minutes'), t('record.seconds')],
  };

  return (
    <View style={styles.exerciseForm}>
      <Text style={styles.exerciseCreatorControlLabel}>{t('settings.name')}</Text>
      <TextInput
        value={name}
        onChangeText={onChangeName}
        maxLength={120}
        placeholder={t('settings.newExercise')}
        placeholderTextColor="#9BA1AD"
        style={styles.exerciseInput}
      />
      <Text style={styles.exerciseCreatorControlLabel}>{t('settings.description')}</Text>
      <TextInput
        value={description}
        onChangeText={onChangeDescription}
        multiline
        maxLength={2000}
        placeholder={t('settings.exerciseDescriptionPlaceholder')}
        placeholderTextColor="#9BA1AD"
        style={[styles.exerciseInput, styles.exerciseDescriptionInput]}
        textAlignVertical="top"
      />
      <Text style={styles.exerciseCreatorControlLabel}>{t('settings.type')}</Text>
      {isEditing && (
        <Text style={styles.exerciseTypeLockedText}>{t('settings.exerciseTypeLocked')}</Text>
      )}
      <View style={styles.exerciseSetTypeRow}>
        {exerciseSetTypeOptions.map((option) => {
          const isSelected = option.value === setType;

          return (
            <Pressable
              key={option.value}
              accessibilityLabel={option.label}
              accessibilityRole="button"
              accessibilityState={{ disabled: isEditing, selected: isSelected }}
              disabled={isEditing}
              onPress={() => onChangeSetType(option.value)}
              style={[
                styles.exerciseSetTypeOption,
                isSelected && styles.exerciseSetTypeOptionSelected,
                isEditing && styles.exerciseSetTypeOptionDisabled,
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
                {isSelected && <Ionicons color="#5AA7FF" name="checkmark-circle" size={18} />}
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
                {setTypeFieldPreviews[option.value].map((field, index) => (
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
      <View style={styles.exerciseFormActions}>
        {isEditing && onCancel && (
          <Pressable disabled={isSubmitting} onPress={onCancel} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>{t('common.cancel')}</Text>
          </Pressable>
        )}
        <Pressable
          disabled={isSubmitting || name.trim().length === 0}
          onPress={onSubmit}
          style={[
            styles.addButton,
            styles.createExerciseButton,
            (isSubmitting || name.trim().length === 0) && styles.actionButtonDisabled,
          ]}
        >
          <Text style={styles.addButtonText}>
            {isSubmitting
              ? t('common.saving')
              : t(isEditing ? 'settings.saveExerciseChanges' : 'common.create')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

