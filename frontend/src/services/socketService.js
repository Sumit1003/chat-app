class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(userId) {
    this.socket = io('/', {
      auth: { userId },
      transports: ['websocket'],
    });
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConversation(conversationId) {
    this.socket.emit('join_conversation', conversationId);
  }

  leaveConversation(conversationId) {
    this.socket.emit('leave_conversation', conversationId);
  }

  sendTyping(conversationId, userId, isTyping) {
    this.socket.emit('typing', { conversationId, userId, isTyping });
  }

  sendMessage(data) {
    this.socket.emit('send_message', data);
  }

  markAsSeen(conversationId, userId) {
    this.socket.emit('mark_as_seen', { conversationId, userId });
  }

  onReceiveMessage(callback) {
    this.socket.on('receive_message', callback);
  }

  onMessageSent(callback) {
    this.socket.on('message_sent', callback);
  }

  onUserTyping(callback) {
    this.socket.on('user_typing', callback);
  }

  onMessagesSeen(callback) {
    this.socket.on('messages_seen', callback);
  }

  off(event) {
    this.socket.off(event);
  }
}

export default new SocketService();