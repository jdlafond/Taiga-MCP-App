import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme/colors';

export interface PickerOption {
  label: string;
  value: any;
}

interface BottomSheetPickerProps {
  isOpen: boolean;
  onClose: () => void;
  options: PickerOption[];
  selectedValue: any;
  onSelect: (value: any) => void;
  title: string;
}

export function BottomSheetPicker({
  isOpen,
  onClose,
  options,
  selectedValue,
  onSelect,
  title,
}: BottomSheetPickerProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%', '75%'], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const handleSelect = (value: any) => {
    onSelect(value);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.indicator}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Theme.textSecondary} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={options}
          keyExtractor={(item) => String(item.value)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.option,
                item.value === selectedValue && styles.optionSelected,
              ]}
              onPress={() => handleSelect(item.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  item.value === selectedValue && styles.optionTextSelected,
                ]}
                numberOfLines={2}
              >
                {item.label}
              </Text>
              {item.value === selectedValue && (
                <Ionicons name="checkmark" size={20} color={Theme.primary} />
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: Theme.surface,
  },
  indicator: {
    backgroundColor: Theme.border,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  title: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: Theme.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.border,
  },
  optionSelected: {
    backgroundColor: Theme.surfaceElevated,
  },
  optionText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    color: Theme.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  optionTextSelected: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: Theme.primary,
  },
});
