import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { UserContext } from '../models/AuthModels';
import { AuthController } from '../controllers/AuthController';
import { LocalStoreService } from '../storage/LocalStore';

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
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome</Text>
        
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

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleLogout}
        >
          <Text style={styles.secondaryButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#000',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});
