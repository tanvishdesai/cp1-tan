import { api } from './client.js';

export async function askChatbot(message, sessionToken) {
  const { data } = await api.post('/chatbot/ask', {
    message,
    session_token: sessionToken ?? undefined,
  });
  return data; // { session_token, content, source_tier, citations }
}

export async function getChatSession(token) {
  const { data } = await api.get(`/chatbot/session/${token}`);
  return data; // { session_token, messages }
}
