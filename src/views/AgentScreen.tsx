import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dropdown } from 'react-native-element-dropdown';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AgentController } from '../controllers/AgentController';
import { AuthController } from '../controllers/AuthController';
import { SecureStoreService } from '../storage/SecureStore';
import { LocalStoreService } from '../storage/LocalStore';
import type { AgentContext } from '../storage/LocalStore';
import { TaigaApi } from '../services/TaigaApi';
import { getErrorMessage } from '../utils/errors';
import { AgentResponse } from '../models/AgentModels';
import { UserContext, TaigaMilestone, TaigaUserStory } from '../models/AuthModels';
import { Theme } from '../theme/colors';
import { UserStoryDropdown, CREATE_NEW_USER_STORY } from '../components/UserStoryDropdown';

type ChatMessage = {
  id: string;
  role: 'user' | 'agent';
  content: string;
  response?: AgentResponse;
};

const CREATE_NEW_VALUE = CREATE_NEW_USER_STORY;

/**
 * Agent screen: chat-style UI with a scrollable message list and input at the bottom.
 * Context (project, sprint, optional user story) is in a compact bar at the top.
 */
export default function AgentScreen() {
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [milestones, setMilestones] = useState<TaigaMilestone[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState('');
  const [userStories, setUserStories] = useState<TaigaUserStory[]>([]);
  const [selectedUserStoryId, setSelectedUserStoryId] = useState<number>(CREATE_NEW_VALUE);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [loadingUserStories, setLoadingUserStories] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [typingDots, setTypingDots] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const savedAgentRef = useRef<AgentContext | null>(null);
  const insets = useSafeAreaInsets();

  // Load user context on launch
  useEffect(() => {
    loadUserContext();
  }, []);

  // Load milestones when project is selected (same pattern as before)
  useEffect(() => {
    if (selectedProjectId) {
      setSelectedMilestone('');
      loadMilestones();
    }
  }, [selectedProjectId]);

  // Load user stories when project + milestone are set (on launch and when user changes sprint)
  useEffect(() => {
    const milestoneId = milestones.find((m) => m.name === selectedMilestone)?.id;
    if (selectedProjectId && selectedMilestone && milestoneId) {
      loadUserStories();
    } else {
      setUserStories([]);
      setSelectedUserStoryId(CREATE_NEW_VALUE);
    }
  }, [selectedProjectId, selectedMilestone, milestones]);

  // Animated typing dots while agent is thinking
  useEffect(() => {
    if (!loading) {
      setTypingDots('');
      return;
    }
    let n = 0;
    const id = setInterval(() => {
      n = (n + 1) % 4;
      setTypingDots('.'.repeat(n));
    }, 400);
    return () => clearInterval(id);
  }, [loading]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserContext();
    if (selectedProjectId) await loadMilestones();
    setRefreshing(false);
  };

  const loadUserContext = async () => {
    const context = await LocalStoreService.getUserContext();
    setUserContext(context);
    if (!context?.projects.length) return;
    const saved = await LocalStoreService.getAgentContext();
    if (saved && context.projects.some((p) => p.id === saved.projectId)) {
      setSelectedProjectId(saved.projectId);
      savedAgentRef.current = saved;
    } else {
      setSelectedProjectId(context.projects[0].id);
      savedAgentRef.current = null;
    }
  };

  const loadMilestones = async () => {
    if (!selectedProjectId) return;
    setLoadingMilestones(true);
    try {
      const data = await AuthController.withValidToken((authToken) =>
        TaigaApi.getMilestones(selectedProjectId, authToken)
      );
      const mapped = data.map((m: any) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        closed: m.closed,
      }));
      setMilestones(mapped);
      if (mapped.length) {
        const saved = savedAgentRef.current;
        if (saved?.milestoneName && mapped.some((m) => m.name === saved.milestoneName)) {
          setSelectedMilestone(saved.milestoneName);
        } else {
          setSelectedMilestone(mapped[0].name);
        }
        savedAgentRef.current = null;
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load milestones');
    } finally {
      setLoadingMilestones(false);
    }
  };

  const loadUserStories = async () => {
    if (!selectedProjectId || !selectedMilestone) return;
    const milestoneId = milestones.find((m) => m.name === selectedMilestone)?.id;
    if (!milestoneId) return;
    setLoadingUserStories(true);
    try {
      const data = await AuthController.withValidToken((authToken) =>
        TaigaApi.getUserStories(selectedProjectId, authToken, milestoneId)
      );
      const mapped = data.map((us: any) => ({
        id: us.id,
        ref: us.ref ?? us.id,
        subject: us.subject,
        description: us.description,
        milestone: us.milestone,
      }));
      setUserStories(mapped);
      setSelectedUserStoryId(CREATE_NEW_VALUE);
    } catch (error) {
      Alert.alert('Error', 'Failed to load user stories');
      setUserStories([]);
    } finally {
      setLoadingUserStories(false);
    }
  };

  const handleSubmit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || !userContext) return;

    const tokens = await SecureStoreService.getTokens();
    if (!tokens) {
      Alert.alert('Error', 'Session expired. Please login again.');
      return;
    }

    const project = userContext.projects.find((p) => p.id === selectedProjectId);
    if (!project || !selectedMilestone) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}

    try {
      const userStoryId = selectedUserStoryId > 0 ? selectedUserStoryId : undefined;
      const result = await AgentController.runAgent(
        project.slug,
        selectedMilestone,
        trimmed,
        tokens,
        userContext,
        userStoryId
      );

      const agentMessage: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: result.summary,
        response: result,
      };
      setMessages((prev) => [...prev, agentMessage]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      const toast = result.created_artifacts?.length
        ? `${result.created_artifacts.length} task(s) created`
        : 'Done';
      setToastMessage(toast);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (error) {
      Alert.alert('Agent Error', getErrorMessage(error));
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  if (!userContext) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  const projectOptions = userContext.projects.map((p) => ({ label: p.name, value: p.id }));
  const milestoneOptions = milestones.map((m) => ({
    label: `${m.name}${m.closed ? ' (Closed)' : ''}`,
    value: m.name,
  }));

  const dropdownModalStyle = {
    backgroundColor: Theme.surfaceElevated,
    borderColor: Theme.border,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden' as const,
    maxHeight: 280,
  };
  const renderChevron = (visible?: boolean) => (
    <Ionicons
      name="chevron-down"
      size={20}
      color={Theme.textSecondary}
      style={{ transform: [{ rotate: visible ? '180deg' : '0deg' }] }}
    />
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Context bar: project, sprint, optional user story */}
      <View style={styles.contextBar}>
        <Dropdown
          style={styles.contextDropdown}
          containerStyle={dropdownModalStyle}
          data={projectOptions}
          labelField="label"
          valueField="value"
          placeholder="Project"
          value={selectedProjectId}
          onChange={(item) => {
            setSelectedProjectId(item.value);
            LocalStoreService.saveAgentContext({ projectId: item.value, milestoneName: '' });
          }}
          disable={loading}
          placeholderStyle={styles.dropdownPlaceholder}
          selectedTextStyle={styles.dropdownSelected}
          selectedTextProps={{ numberOfLines: 1 }}
          itemTextStyle={styles.dropdownItemText}
          itemContainerStyle={styles.dropdownItemContainer}
          backgroundColor={Theme.screenBg}
          activeColor={Theme.surface}
          renderRightIcon={renderChevron}
          maxHeight={280}
        />
        {loadingMilestones ? (
          <View style={styles.contextDropdown}>
            <ActivityIndicator size="small" color={Theme.accentPurple} />
          </View>
        ) : (
          <Dropdown
            style={styles.contextDropdown}
            containerStyle={dropdownModalStyle}
            data={milestoneOptions}
            labelField="label"
            valueField="value"
            placeholder="Sprint"
            value={selectedMilestone}
            onChange={(item) => {
              setSelectedMilestone(item.value);
              if (selectedProjectId != null) {
                LocalStoreService.saveAgentContext({
                  projectId: selectedProjectId,
                  milestoneName: item.value,
                });
              }
            }}
            disable={loading || milestones.length === 0}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelected}
            selectedTextProps={{ numberOfLines: 1 }}
            itemTextStyle={styles.dropdownItemText}
            itemContainerStyle={styles.dropdownItemContainer}
            backgroundColor={Theme.screenBg}
            activeColor={Theme.surface}
            renderRightIcon={renderChevron}
            maxHeight={280}
          />
        )}
        <UserStoryDropdown
          userStories={userStories}
          value={selectedUserStoryId}
          onChange={setSelectedUserStoryId}
          disabled={loading}
          loading={loadingUserStories}
          sprintSelected={!!selectedMilestone}
          placeholder="Add to user story"
        />
      </View>

      {/* Empty state hints */}
      {!loadingMilestones && selectedProjectId && milestones.length === 0 && (
        <View style={styles.emptyHint}>
          <Ionicons name="calendar-outline" size={16} color={Theme.textMuted} />
          <Text style={styles.emptyHintText}>No sprints in this project</Text>
        </View>
      )}
      {!loadingUserStories && selectedMilestone && userStories.length === 0 && milestones.length > 0 && (
        <View style={styles.emptyHint}>
          <Ionicons name="document-text-outline" size={16} color={Theme.textMuted} />
          <Text style={styles.emptyHintText}>No user stories in this sprint</Text>
        </View>
      )}

      {/* Chat area */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Theme.accentPurple}
          />
        }
      >
        {messages.length === 0 && (
          <View style={styles.welcomeBlock}>
            <View style={styles.welcomeIconWrap}>
              <Ionicons name="chatbubble-ellipses" size={40} color={Theme.accentPurple} />
            </View>
            <Text style={styles.welcomeTitle}>Run Agent</Text>
            <Text style={styles.welcomeSubtitle}>
              Describe what you need—meeting notes, new tasks, or “add to #123”. I’ll create or update Taiga for you.
            </Text>
          </View>
        )}
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[styles.bubbleWrap, msg.role === 'user' ? styles.bubbleWrapUser : styles.bubbleWrapAgent]}
          >
            {msg.role === 'agent' && (
              <View style={styles.agentAvatar}>
                <Ionicons name="sparkles" size={16} color={Theme.accentPurple} />
              </View>
            )}
            <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAgent]}>
              <Text style={msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAgent}>
                {msg.content}
              </Text>
              {msg.role === 'agent' && msg.response?.created_artifacts && msg.response.created_artifacts.length > 0 && (
                <View style={styles.artifactsBlock}>
                  {msg.response.created_artifacts.map((a, i) => (
                    <View key={i} style={styles.artifactChip}>
                      <Text style={styles.artifactType}>{a.type}</Text>
                      <Text style={styles.artifactSubject} numberOfLines={1}>{a.subject}</Text>
                      <Text style={styles.artifactRef}>#{a.ref}</Text>
                    </View>
                  ))}
                </View>
              )}
              {msg.role === 'agent' && msg.response?.warnings && msg.response.warnings.length > 0 && (
                <Text style={styles.warningText}>{msg.response.warnings.join(' • ')}</Text>
              )}
              {msg.role === 'agent' && msg.response?.errors && msg.response.errors.length > 0 && (
                <Text style={styles.errorText}>{msg.response.errors.join(' • ')}</Text>
              )}
            </View>
          </View>
        ))}
        {loading && (
          <View style={[styles.bubbleWrap, styles.bubbleWrapAgent]}>
            <View style={styles.agentAvatar}>
              <Ionicons name="sparkles" size={16} color={Theme.accentPurple} />
            </View>
            <View style={[styles.bubble, styles.bubbleAgent, styles.thinkingBubble]}>
              <ActivityIndicator size="small" color={Theme.accentPurple} />
              <Text style={styles.thinkingText}>Thinking{typingDots}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Success toast */}
      {toastMessage && (
        <View style={[styles.toast, { bottom: 72 + insets.bottom }]}>
          <Ionicons name="checkmark-circle" size={20} color={Theme.success} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputRow, { paddingBottom: 16 + insets.bottom }]}>
        <TextInput
          style={styles.input}
          placeholder="Message the agent..."
          placeholderTextColor={Theme.textMuted}
          value={prompt}
          onChangeText={setPrompt}
          multiline
          maxLength={4000}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!prompt.trim() || loading) && styles.sendButtonDisabled]}
          onPress={handleSubmit}
          disabled={!prompt.trim() || loading}
        >
          <Ionicons name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.screenBg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.screenBg,
  },
  contextBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    backgroundColor: Theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  contextDropdown: {
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
  dropdownPlaceholder: {
    color: Theme.textMuted,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
  },
  dropdownSelected: {
    color: Theme.textPrimary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    flex: 1,
  },
  dropdownItemText: {
    color: Theme.textPrimary,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
  },
  dropdownItemContainer: {
    backgroundColor: Theme.surfaceElevated,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.border,
  },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Theme.surface,
  },
  emptyHintText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Theme.textMuted,
  },
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Theme.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  toastText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: Theme.textPrimary,
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
    paddingBottom: 28,
  },
  welcomeBlock: {
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 28,
  },
  welcomeIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Theme.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.border,
  },
  welcomeTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 24,
    color: Theme.textPrimary,
    marginTop: 20,
  },
  welcomeSubtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    color: Theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 10,
    paddingHorizontal: 8,
  },
  bubbleWrap: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  bubbleWrapUser: {
    justifyContent: 'flex-end',
  },
  bubbleWrapAgent: {
    justifyContent: 'flex-start',
  },
  agentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
  },
  bubbleUser: {
    backgroundColor: Theme.chatBubbleUser,
    borderBottomRightRadius: 6,
  },
  bubbleAgent: {
    backgroundColor: Theme.chatBubbleAgent,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  bubbleTextUser: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    color: Theme.textPrimary,
    lineHeight: 24,
  },
  bubbleTextAgent: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    color: Theme.textSecondary,
    lineHeight: 24,
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thinkingText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: Theme.textMuted,
    marginLeft: 10,
  },
  artifactsBlock: {
    marginTop: 14,
    gap: 10,
  },
  artifactChip: {
    backgroundColor: Theme.surface,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Theme.purple,
  },
  artifactType: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    color: Theme.accentPurple,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  artifactSubject: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: Theme.textPrimary,
    marginTop: 2,
  },
  artifactRef: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Theme.primary,
    marginTop: 2,
  },
  warningText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Theme.warning,
    marginTop: 8,
  },
  errorText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Theme.error,
    marginTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: Theme.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: Theme.surfaceElevated,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    color: Theme.textPrimary,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});
