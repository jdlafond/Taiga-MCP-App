import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../models/AuthModels';
import { AuthController } from '../controllers/AuthController';
import { LocalStoreService } from '../storage/LocalStore';
import { Theme } from '../theme/colors';

export default function HomeScreen({ navigation }: any) {
  const [userContext, setUserContext] = useState<UserContext | null>(null);

  useEffect(() => {
    loadUserContext();
  }, []);

  const loadUserContext = async () => {
    const context = await LocalStoreService.getUserContext();
    setUserContext(context);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AuthController.logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  if (!userContext) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={Theme.primary} />
          </View>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.username}>{userContext.full_name_display || userContext.username}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Username</Text>
          <Text style={styles.value}>{userContext.username}</Text>

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{userContext.email}</Text>

          <Text style={styles.label}>Roles</Text>
          <Text style={styles.value}>{userContext.roles.join(', ') || 'None'}</Text>

          <Text style={styles.label}>Projects</Text>
          <Text style={styles.value}>{userContext.projects.length} project(s)</Text>
        </View>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Theme.error} />
          <Text style={styles.secondaryButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.screenBg,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    paddingTop: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  title: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 26,
    color: Theme.textPrimary,
    marginBottom: 4,
  },
  username: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: Theme.textSecondary,
  },
  card: {
    backgroundColor: Theme.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  label: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: Theme.textMuted,
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    color: Theme.textPrimary,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  secondaryButtonText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: Theme.error,
  },
  loadingText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: Theme.textSecondary,
  },
});
