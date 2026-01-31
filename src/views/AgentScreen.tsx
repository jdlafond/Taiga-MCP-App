import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { AgentController } from '../controllers/AgentController';
import { SecureStoreService } from '../storage/SecureStore';
import { LocalStoreService } from '../storage/LocalStore';
import { TaigaApi } from '../services/TaigaApi';
import { getErrorMessage } from '../utils/errors';
import { AgentResponse } from '../models/AgentModels';
import { UserContext, TaigaMilestone } from '../models/AuthModels';

export default function AgentScreen() {
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [milestones, setMilestones] = useState<TaigaMilestone[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [response, setResponse] = useState<AgentResponse | null>(null);

  useEffect(() => {
    loadUserContext();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadMilestones();
    }
  }, [selectedProjectId]);

  const loadUserContext = async () => {
    const context = await LocalStoreService.getUserContext();
    setUserContext(context);
    if (context?.projects.length) {
      setSelectedProjectId(context.projects[0].id);
    }
  };

  const loadMilestones = async () => {
    if (!selectedProjectId) return;
    
    setLoadingMilestones(true);
    try {
      const tokens = await SecureStoreService.getTokens();
      if (!tokens) return;
      
      const data = await TaigaApi.getMilestones(selectedProjectId, tokens.auth_token);
      const mapped = data.map(m => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        closed: m.closed,
      }));
      setMilestones(mapped);
      if (mapped.length) {
        setSelectedMilestone(mapped[0].name);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load milestones');
    } finally {
      setLoadingMilestones(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResponse(null);
    
    try {
      const tokens = await SecureStoreService.getTokens();
      
      if (!tokens || !userContext) {
        Alert.alert('Error', 'Session expired. Please login again.');
        return;
      }

      const project = userContext.projects.find(p => p.id === selectedProjectId);
      if (!project) return;

      const result = await AgentController.runAgent(
        project.slug,
        selectedMilestone,
        prompt,
        tokens,
        userContext
      );
      
      setResponse(result);
    } catch (error) {
      Alert.alert('Agent Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (!userContext) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Project</Text>
        <Dropdown
          style={styles.dropdown}
          data={userContext.projects.map(p => ({ label: p.name, value: p.id }))}
          labelField="label"
          valueField="value"
          placeholder="Select project"
          value={selectedProjectId}
          onChange={item => setSelectedProjectId(item.value)}
          disable={loading}
        />
        
        <Text style={styles.label}>Sprint / Milestone</Text>
        {loadingMilestones ? (
          <View style={styles.loadingMilestonesContainer}>
            <ActivityIndicator size="small" />
          </View>
        ) : (
          <Dropdown
            style={styles.dropdown}
            data={milestones.map(m => ({ 
              label: `${m.name}${m.closed ? ' (Closed)' : ''}`, 
              value: m.name 
            }))}
            labelField="label"
            valueField="value"
            placeholder="Select milestone"
            value={selectedMilestone}
            onChange={item => setSelectedMilestone(item.value)}
            disable={loading || milestones.length === 0}
          />
        )}
        
        <Text style={styles.label}>Prompt</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Enter meeting minutes or instructions..."
          value={prompt}
          onChangeText={setPrompt}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          editable={!loading}
        />
        
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading || !selectedMilestone}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit</Text>
          )}
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Agent is thinking...</Text>
          </View>
        )}

        {response && (
          <View style={styles.responseContainer}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.responseText}>{response.summary}</Text>

            {response.created_artifacts && response.created_artifacts.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Created Artifacts</Text>
                {response.created_artifacts.map((artifact, index) => (
                  <View key={index} style={styles.artifactCard}>
                    <Text style={styles.artifactType}>{artifact.type}</Text>
                    <Text style={styles.artifactSubject}>{artifact.subject}</Text>
                    <Text style={styles.artifactRef}>Ref: #{artifact.ref}</Text>
                  </View>
                ))}
              </>
            )}

            {response.warnings && response.warnings.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Warnings</Text>
                {response.warnings.map((warning, index) => (
                  <Text key={index} style={styles.warningText}>{warning}</Text>
                ))}
              </>
            )}

            {response.errors && response.errors.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Errors</Text>
                {response.errors.map((error, index) => (
                  <Text key={index} style={styles.errorText}>{error}</Text>
                ))}
              </>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
    color: '#333',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    height: 50,
  },
  loadingMilestonesContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    alignItems: 'center',
  },
  textArea: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 120,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  responseContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#000',
  },
  responseText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  artifactCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  artifactType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  artifactSubject: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  artifactRef: {
    fontSize: 14,
    color: '#007AFF',
  },
  warningText: {
    fontSize: 14,
    color: '#FF9500',
    marginBottom: 5,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 5,
  },
});
