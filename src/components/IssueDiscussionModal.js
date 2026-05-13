import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getApiBaseUrl } from '../config/api';

export default function IssueDiscussionModal({ visible, onClose, thread, user }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  // ── @mention state ────────────────────────────────────────────────
  const [allUsers, setAllUsers] = useState([]);
  const [mentionResults, setMentionResults] = useState([]);
  const [mentions, setMentions] = useState([]);

  const API_BASE = getApiBaseUrl();

  // Fetch all mentionable users once when modal opens
  useEffect(() => {
    if (!visible || !user?.token) return;
    fetch(`${API_BASE}/api/users/mentionable`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAllUsers(data.map((u) => u.display_name));
      })
      .catch(() => {});
  }, [visible, user?.token, API_BASE]);

  useEffect(() => {
    if (visible && thread?.id) {
      loadMessages();
    }
  }, [visible, thread?.id]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/issue-threads/${thread.id}/messages`, {
        headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {},
      });
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── @mention detection ────────────────────────────────────────────
  const handleTextChange = useCallback(
    (text) => {
      setNewMessage(text);

      // Find an in-progress @word at the end of the current input
      const match = text.match(/@([\w ]*)$/);
      if (match) {
        const query = match[1].toLowerCase();
        const results = allUsers.filter(
          (name) =>
            name.toLowerCase().includes(query) &&
            name.toLowerCase() !== (user?.name || '').toLowerCase(),
        );
        setMentionResults(results.slice(0, 6));
      } else {
        setMentionResults([]);
      }
    },
    [allUsers, user?.name],
  );

  // ── Select a member from the picker ──────────────────────────────
  const selectMention = useCallback(
    (name) => {
      // Replace the trailing @query with @FullName
      const updated = newMessage.replace(/@([\w ]*)$/, `@${name} `);
      setNewMessage(updated);
      setMentionResults([]);
      // Track for the POST body (deduplicate)
      setMentions((prev) => (prev.includes(name) ? prev : [...prev, name]));
    },
    [newMessage],
  );

  // ── Send message ──────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    try {
      setSending(true);
      const res = await fetch(`${API_BASE}/api/issue-threads/${thread.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
        body: JSON.stringify({
          message: newMessage.trim(),
          mentions: mentions.length ? mentions : undefined,
        }),
      });
      if (res.ok) {
        setNewMessage('');
        setMentions([]);
        setMentionResults([]);
        await loadMessages();
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  // ── Render a single message bubble with @mention highlighting ─────
  const renderMessage = ({ item }) => {
    const isMe =
      String(item.sender_name || '').toLowerCase().trim() ===
      String(user.name || '').toLowerCase().trim();

    return (
      <View style={[s.messageRow, isMe ? s.messageRowRight : s.messageRowLeft]}>
        <View style={[s.messageBubble, isMe ? s.bubbleRight : s.bubbleLeft]}>
          <Text style={[s.senderName, isMe && s.textWhite]}>
            {item.sender_name} ({item.sender_role})
          </Text>
          <MentionText text={item.message} isMe={isMe} />
          <Text style={[s.messageTime, isMe && s.textWhiteTransparent]}>
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.backButton}>
            <Ionicons name="close" size={28} color="#4a5568" />
          </TouchableOpacity>
          <View style={s.headerTitleContainer}>
            <Text style={s.headerTitle}>Messages</Text>
            <Text style={s.headerSubtitle}>
              {thread?.item_description} • Slip #{thread?.slip_label || thread?.packing_slip_id}
              {thread?.po_number ? ` • PO ${thread.po_number}` : ''}
            </Text>
          </View>
          {thread?.status === 'open' && (
            <View style={s.statusBadge}>
              <Text style={s.statusText}>ACTIVE</Text>
            </View>
          )}
        </View>

        {/* Message list */}
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color="#4299e1" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={s.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* @mention picker — floats above input */}
        {mentionResults.length > 0 && (
          <View style={s.mentionPicker}>
            {mentionResults.map((name, idx) => (
              <TouchableOpacity
                key={`${name}-${idx}`}
                style={s.mentionRow}
                onPress={() => selectMention(name)}
              >
                <Text style={s.mentionAt}>@</Text>
                <Text style={s.mentionName}>{name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input bar */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={s.inputArea}>
            <TextInput
              style={s.textInput}
              placeholder="Type a message… use @ to mention someone"
              placeholderTextColor="#a0aec0"
              value={newMessage}
              onChangeText={handleTextChange}
              multiline
            />
            <TouchableOpacity
              onPress={sendMessage}
              style={[s.sendButton, !newMessage.trim() && s.sendButtonDisabled]}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

/**
 * Renders message text with @mentions highlighted in blue/bold.
 * Splits on word-boundary @Name patterns.
 */
function MentionText({ text, isMe }) {
  const parts = text.split(/(@\S+)/g);
  return (
    <Text style={[s.messageText, isMe && s.textWhite]}>
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <Text key={i} style={[s.mentionHighlight, isMe && s.mentionHighlightMe]}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        ),
      )}
    </Text>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  backButton: { marginRight: 12 },
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a202c' },
  headerSubtitle: { fontSize: 12, color: '#718096', marginTop: 2 },
  statusBadge: {
    backgroundColor: '#ebf8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: { fontSize: 10, fontWeight: '700', color: '#3182ce' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 32 },

  messageRow: { flexDirection: 'row', marginBottom: 16, width: '100%' },
  messageRowLeft: { justifyContent: 'flex-start' },
  messageRowRight: { justifyContent: 'flex-end' },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  bubbleLeft: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#edf2f7',
  },
  bubbleRight: { backgroundColor: '#4299e1', borderBottomRightRadius: 4 },
  senderName: { fontSize: 10, fontWeight: '700', marginBottom: 4, color: '#718096' },
  messageText: { fontSize: 15, color: '#2d3748' },
  textWhite: { color: '#fff' },
  textWhiteTransparent: { color: 'rgba(255,255,255,0.7)' },
  messageTime: { fontSize: 10, color: '#a0aec0', marginTop: 4, textAlign: 'right' },

  // @mention highlight inside bubbles
  mentionHighlight: { color: '#3b82f6', fontWeight: '700' },
  mentionHighlightMe: { color: '#bfdbfe', fontWeight: '700' },

  // Mention picker
  mentionPicker: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    maxHeight: 220,
  },
  mentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  mentionAt: { fontSize: 15, fontWeight: '700', color: '#3b82f6', marginRight: 4 },
  mentionName: { fontSize: 15, color: '#0f172a', fontWeight: '600' },

  // Input
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f7fafc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 8,
    marginRight: 8,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4299e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#a0aec0' },
});
