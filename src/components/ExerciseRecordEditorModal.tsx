import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { styles } from '../styles';
import { ExerciseRecordSet, ExerciseSetType } from '../types';
import { t } from '../localization';

type EditableExerciseRecord = {
  id: string;
  exerciseName: string;
  setType: ExerciseSetType;
  sets: ExerciseRecordSet[];
};

type EditableRecordSet = {
  id: string;
  reps: string;
  weight: string;
  durationMinutes: string;
  durationSeconds: string;
  distanceKm: string;
};

type ExerciseRecordEditorModalProps = {
  record: EditableExerciseRecord | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (recordId: string, sets: ExerciseRecordSet[]) => Promise<void>;
};

export function ExerciseRecordEditorModal({
  record,
  isSaving,
  onClose,
  onSave,
}: ExerciseRecordEditorModalProps) {
  const [editableSets, setEditableSets] = useState<EditableRecordSet[]>([]);

  useEffect(() => {
    setEditableSets(record?.sets.map((set) => ({
      id: `${record.id}-${set.setNumber}`,
      reps: set.reps?.toString() ?? '',
      weight: set.weight?.toString() ?? '',
      durationMinutes: set.durationSeconds === null
        ? ''
        : Math.floor(set.durationSeconds / 60).toString(),
      durationSeconds: set.durationSeconds === null
        ? ''
        : (set.durationSeconds % 60).toString(),
      distanceKm: set.distanceMeters === null ? '' : (set.distanceMeters / 1000).toString(),
    })) ?? []);
  }, [record]);

  const updateSet = (
    setId: string,
    field: keyof Omit<EditableRecordSet, 'id'>,
    value: string,
  ) => {
    setEditableSets((current) => current.map((set) =>
      set.id === setId ? { ...set, [field]: value } : set,
    ));
  };

  const save = async () => {
    if (!record || isSaving) {
      return;
    }

    const sets: ExerciseRecordSet[] = editableSets.map((set, index) => ({
      setNumber: index + 1,
      reps: set.reps === '' ? null : Number.parseInt(set.reps, 10),
      weight: set.weight === '' ? null : Number.parseFloat(set.weight.replace(',', '.')),
      durationSeconds:
        set.durationMinutes === '' && set.durationSeconds === ''
          ? null
          : Number.parseInt(set.durationMinutes || '0', 10) * 60
            + Number.parseInt(set.durationSeconds || '0', 10),
      distanceMeters: set.distanceKm === ''
        ? null
        : Number.parseFloat(set.distanceKm.replace(',', '.')) * 1000,
    }));

    try {
      await onSave(record.id, sets);
      onClose();
    } catch {
      // The parent displays the API validation error; keep the editor open.
    }
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={record !== null}
    >
      <View style={styles.exerciseDialogOverlay}>
        <View style={styles.exerciseDialog}>
          <View style={styles.exerciseDialogHeader}>
            <Text style={styles.exerciseDialogTitle}>
              {t('record.edit', { name: record?.exerciseName ?? t('data.exercise').toLowerCase() })}
            </Text>
            <Pressable
              accessibilityLabel={t('record.closeEditor')}
              accessibilityRole="button"
              disabled={isSaving}
              hitSlop={8}
              onPress={onClose}
              style={styles.exerciseDialogCloseButton}
            >
              <Ionicons color="#5AA7FF" name="close" size={22} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.exerciseDialogListContent}>
            {record && editableSets.map((set, index) => (
              <View key={set.id} style={styles.setRow}>
                <Text style={styles.setNumber}>{index + 1}</Text>
                {getInputFields(record.setType).map((field) => (
                  <View key={field.field} style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{field.label}</Text>
                    <TextInput
                      editable={!isSaving}
                      keyboardType={field.keyboardType}
                      onChangeText={(value) => updateSet(set.id, field.field, value)}
                      style={styles.numberInput}
                      value={set[field.field]}
                    />
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={() => { void save(); }}
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? t('record.saving') : t('record.saveChanges')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function getInputFields(setType: ExerciseSetType): {
  field: keyof Omit<EditableRecordSet, 'id'>;
  label: string;
  keyboardType: 'number-pad' | 'decimal-pad';
}[] {
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
