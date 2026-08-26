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
 * Fetch full history for the current conversation, if any.
 */
export const getConversationHistory = async () => {
  const conversationId = getStoredConversationId();
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
