import apiClient from '../api';

const SESSION_ID_KEY = 'chat_session_id';
const CONVERSATION_ID_KEY = 'chat_conversation_id';

/**
 * Guest chat continuity: a uuid stored in localStorage, parallel to the
 * existing aponkhoj_token key used for logged-in sessions.
 */
export const getChatSessionId = () => {
  let id = localStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
};

export const getStoredConversationId = () => localStorage.getItem(CONVERSATION_ID_KEY);

const storeConversationId = (id) => {
  if (id) localStorage.setItem(CONVERSATION_ID_KEY, String(id));
};

/**
 * Clears the active conversation so the next sent message starts a fresh one.
 * Used by the "নতুন আলাপ শুরু করুন" (start new conversation) action.
 */
export const startNewConversation = () => {
  localStorage.removeItem(CONVERSATION_ID_KEY);
};

/**
 * Switches the active conversation (e.g. clicking a past conversation in the
 * history sidebar) without sending a message.
 */
export const setActiveConversationId = (id) => {
  storeConversationId(id);
};

/**
 * List past conversations for the current user/session, newest first.
 */
export const listConversations = async () => {
  try {
    const data = await apiClient.get('/chat/conversations', {
      params: { session_id: getChatSessionId() },
    });
    return { success: true, conversations: data.conversations || [] };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'কথোপকথনের তালিকা লোড করা যায়নি',
      conversations: [],
    };
  }
};

/**
 * Send a chat message. Returns { conversation_id, reply, matched_reports }.
 */
export const sendChatMessage = async (message) => {
  try {
    const payload = {
      message,
      session_id: getChatSessionId(),
    };

    const conversationId = getStoredConversationId();
    if (conversationId) {
      payload.conversation_id = conversationId;
    }

    const data = await apiClient.post('/chat/message', payload);
    storeConversationId(data.conversation_id);
    return { success: true, ...data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'বার্তা পাঠানো যায়নি',
    };
  }
};

/**
 * Fetch full history for a conversation. Defaults to the currently active
 * (stored) conversation; pass an id explicitly to load a different one from
 * the history sidebar.
 */
export const getConversationHistory = async (explicitConversationId) => {
  const conversationId = explicitConversationId || getStoredConversationId();
  if (!conversationId) {
    return { success: true, messages: [] };
  }

  try {
    const data = await apiClient.get(`/chat/conversations/${conversationId}`, {
      params: { session_id: getChatSessionId() },
    });
    return { success: true, ...data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'কথোপকথন লোড করা যায়নি',
    };
  }
};
