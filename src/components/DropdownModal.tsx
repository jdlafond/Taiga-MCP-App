import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme/colors';

interface DropdownItem {
  label: string;
  value: any;
}

interface DropdownModalProps {
  visible: boolean;
  items: DropdownItem[];
  onSelect: (item: DropdownItem) => void;
  onClose: () => void;
  title?: string;
}

export function DropdownModal({ visible, items, onSelect, onClose, title }: DropdownModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modal}>
          {title && <Text style={styles.title}>{title}</Text>}
          <FlatList
            data={items}
            keyExtractor={(item, idx) => `${item.value}-${idx}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={styles.itemText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={Theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: Theme.surfaceElevated,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  title: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 18,
    color: Theme.textPrimary,
    marginBottom: 16,
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.border,
  },
  itemText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    color: Theme.textPrimary,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
});
