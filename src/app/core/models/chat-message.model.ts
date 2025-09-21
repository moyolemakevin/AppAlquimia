export type ChatSender = 'user' | 'assistant';

export interface ChatMessage {
  sender: ChatSender;
  text: string;
  timestamp: string;
  topic?: string;
}