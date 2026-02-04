import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Ionicons } from '@expo/vector-icons';
import { TaigaUserStory } from '../models/AuthModels';
import { Theme } from '../theme/colors';

/** Value used to mean "create new user story" (no existing US selected). */
export const CREATE_NEW_USER_STORY = -1;

export interface UserStoryDropdownProps {
  /** Fetched user stories for the current project/milestone. */
  userStories: TaigaUserStory[];
  /** Selected user story id, or CREATE_NEW_USER_STORY for "Create new". */
  value: number;
  /** Called when user selects an option (id or CREATE_NEW_USER_STORY). */
  onChange: (userStoryId: number) => void;
  /** Disable the dropdown (e.g. while agent is running). */
  disabled?: boolean;
  /** Show loading state instead of dropdown. */
  loading?: boolean;
  /** Whether a sprint is selected (dropdown is disabled when false). */
  sprintSelected?: boolean;
  placeholder?: string;
}

const MAX_SUBJECT_LENGTH = 40;

/**
 * Optional dropdown that lets users select an existing user story to add tasks to,
 * or "Create new" to create new user stories. Integrates with fetched user stories data.
 */
export function UserStoryDropdown({
  userStories,
  value,
  onChange,
  disabled = false,
  loading = false,
  sprintSelected = true,
  placeholder = 'Add to user story',
}: UserStoryDropdownProps) {
  const options = [
    { label: 'Create new', value: CREATE_NEW_USER_STORY },
    ...userStories.map((us) => ({
      label:
        us.subject.length > MAX_SUBJECT_LENGTH
          ? `#${us.ref}: ${us.subject.slice(0, MAX_SUBJECT_LENGTH - 3)}…`
          : `#${us.ref}: ${us.subject}`,
      value: us.id,
    })),
  ];

  const dropdownModalStyle = {
    backgroundColor: Theme.surfaceElevated,
    borderColor: Theme.border,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden' as const,
    maxHeight: 280,
    minWidth: 200,
  };

  const renderChevron = (visible?: boolean) => (
    <Ionicons
      name="chevron-down"
      size={20}
      color={Theme.textSecondary}
      style={{ transform: [{ rotate: visible ? '180deg' : '0deg' }] }}
    />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={Theme.accentPurple} />
      </View>
    );
  }

  return (
    <Dropdown
      style={styles.container}
      containerStyle={dropdownModalStyle}
      data={options}
      labelField="label"
      valueField="value"
      placeholder={placeholder}
      value={value}
      onChange={(item) => onChange(item.value)}
      disable={disabled || !sprintSelected}
      placeholderStyle={styles.placeholder}
      selectedTextStyle={styles.selected}
      selectedTextProps={{ numberOfLines: 1 }}
      itemTextStyle={styles.itemText}
      itemContainerStyle={styles.itemContainer}
      activeColor={Theme.surface}
      renderRightIcon={renderChevron}
      maxHeight={280}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Theme.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 46,
    justifyContent: 'center',
  },
  placeholder: {
    color: Theme.textMuted,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
  },
  selected: {
    color: Theme.textPrimary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    flex: 1,
  },
  itemText: {
    color: Theme.textPrimary,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    flexShrink: 0,
  },
  itemContainer: {
    backgroundColor: Theme.surfaceElevated,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.border,
    flexWrap: 'nowrap',
  },
});
