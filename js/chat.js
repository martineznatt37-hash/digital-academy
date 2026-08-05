/* Digital Academy — AI Chat Assistant */

function getChatUserId() {
  const user = window.API?.Auth.getUser();
  if (user?.id) return user.id;
  try {
    const token = window.API?.Auth.getToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id || null;
  } catch {
    return null;
  }
}

class ChatAssistant {
  constructor(options = {}) {
    this.container = document.querySelector(options.container || '.chat-widget');
    if (!this.container) return;

    this.panel = this.container.querySelector('.chat-panel');
    this.messagesEl = this.container.querySelector('.chat-panel-messages');
    this.input = this.container.querySelector('.chat-panel-input input');
    this.toggle = this.container.querySelector('.chat-toggle');
    this.closeBtn = this.container.querySelector('.chat-close');
    this.quickBtns = this.container.querySelectorAll('.chat-quick-btn');
    this.header = this.container.querySelector('.chat-panel-header');
    this.isOpen = false;
    this.loading = false;
    this.conversationId = null;
    this.currentUserId = null;

    this.ensureNewChatButton();
    this.bindEvents();
    this.initForCurrentUser();
    window.addEventListener('da-auth-change', () => this.initForCurrentUser(true));
  }

  ensureNewChatButton() {
    if (!this.header || this.header.querySelector('.chat-new-btn')) return;
    const actions = document.createElement('div');
    actions.className = 'chat-header-actions';
    actions.innerHTML = `
      <button type="button" class="chat-new-btn" title="Nueva conversación" aria-label="Nueva conversación">+</button>
    `;
    this.header.insertBefore(actions, this.closeBtn);
    actions.querySelector('.chat-new-btn')?.addEventListener('click', () => this.startNewConversation());
  }

  convStorageKey(userId) {
    return `da_chat_conv_${userId}`;
  }

  getStoredConversationId(userId) {
    if (!userId) return null;
    const raw = sessionStorage.getItem(this.convStorageKey(userId));
    return raw ? Number(raw) : null;
  }

  storeConversationId(userId, conversationId) {
    if (!userId || !conversationId) return;
    sessionStorage.setItem(this.convStorageKey(userId), String(conversationId));
  }

  clearMessages() {
    if (this.messagesEl) this.messagesEl.innerHTML = '';
  }

  showWelcome(isNew = false) {
    const name = window.API?.Auth.getUser()?.name?.split(' ')[0] || '';
    const greeting = isNew
      ? `¡Hola${name ? ` ${name}` : ''}! 👋 Nueva conversación iniciada. Pregúntame lo que quieras y te lo explico paso a paso.`
      : `¡Hola${name ? ` ${name}` : ''}! 👋 Soy tu **IA educativa**. Pregúntame lo que quieras y te lo explico paso a paso.`;
    this.addBotMessage(greeting);
  }

  async initForCurrentUser(force = false) {
    const userId = getChatUserId();

    if (!force && userId === this.currentUserId && (this.messagesEl?.childElementCount || 0) > 0) {
      return;
    }

    if (userId !== this.currentUserId) {
      this.clearMessages();
      this.conversationId = null;
      this.currentUserId = userId;
    }

    if (!window.API?.Auth.isLoggedIn()) {
      this.conversationId = null;
      this.currentUserId = null;
      this.clearMessages();
      this.addBotMessage('¡Hola! 👋 Soy tu **IA educativa**. **Inicia sesión** para chatear; cada usuario tiene su propia conversación privada.');
      return;
    }

    const storedId = this.getStoredConversationId(userId);
    if (storedId) {
      this.conversationId = storedId;
      await this.loadHistory();
      return;
    }

    this.clearMessages();
    this.showWelcome();
  }

  startNewConversation() {
    if (!window.API?.Auth.isLoggedIn()) {
      this.addBotMessage('Inicia sesión para iniciar una conversación nueva.');
      return;
    }

    this.conversationId = null;
    if (this.currentUserId) {
      sessionStorage.removeItem(this.convStorageKey(this.currentUserId));
    }
    this.clearMessages();
    this.showWelcome(true);
  }

  async loadHistory() {
    if (!this.conversationId) {
      this.showWelcome();
      return;
    }

    try {
      const history = await window.API.api(`/chat/history?conversationId=${this.conversationId}`);
      this.clearMessages();
      if (history.length === 0) {
        this.showWelcome();
      } else {
        history.forEach(m => this.addMessage(m.content, m.role === 'user' ? 'user' : 'bot'));
      }
    } catch {
      this.conversationId = null;
      if (this.currentUserId) {
        sessionStorage.removeItem(this.convStorageKey(this.currentUserId));
      }
      this.clearMessages();
      this.showWelcome();
    }
  }

  bindEvents() {
    this.toggle?.addEventListener('click', () => this.toggleChat());
    this.closeBtn?.addEventListener('click', () => this.closeChat());
    this.input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
    this.container.querySelector('.chat-panel-input button')?.addEventListener('click', () => this.sendMessage());

    this.quickBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.input.value = btn.textContent;
        this.sendMessage();
      });
    });
  }

  toggleChat() {
    this.isOpen ? this.closeChat() : this.openChat();
  }

  openChat() {
    this.isOpen = true;
    this.panel?.classList.add('open');
    const userId = getChatUserId();
    if (userId !== this.currentUserId) this.initForCurrentUser(true);
    this.input?.focus();
  }

  closeChat() {
    this.isOpen = false;
    this.panel?.classList.remove('open');
  }

  async sendMessage() {
    const text = this.input?.value.trim();
    if (!text || this.loading) return;

    if (!window.API?.Auth.isLoggedIn()) {
      this.addBotMessage('Debes **iniciar sesión** para usar el chat. Cada usuario tiene su conversación privada.');
      return;
    }

    this.currentUserId = getChatUserId();

    this.addUserMessage(text);
    this.input.value = '';
    this.showTyping();
    this.loading = true;

    try {
      const apiBase = window.API ? (window.location.protocol === 'file:' ? 'http://localhost:3001/api' : '/api') : '/api';
      const context = window.courseChatContext || null;
      const res = await fetch(`${apiBase}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${window.API.Auth.getToken()}`
        },
        body: JSON.stringify({
          message: text,
          context,
          conversationId: this.conversationId || null
        })
      });
      const data = await res.json();
      this.hideTyping();
      if (!res.ok) {
        if (res.status === 401) {
          this.addBotMessage('Tu sesión expiró. Vuelve a **iniciar sesión** para continuar.');
        } else {
          this.addBotMessage(data.error || 'Lo siento, no pude procesar tu mensaje.');
        }
        return;
      }
      if (data.conversationId) {
        this.conversationId = data.conversationId;
        this.storeConversationId(this.currentUserId, this.conversationId);
      }
      this.addBotMessage(data.reply || 'Lo siento, no pude procesar tu mensaje.');
    } catch {
      this.hideTyping();
      this.addBotMessage('Error de conexión. Verifica que el servidor esté activo.');
    }

    this.loading = false;
  }

  addUserMessage(text) { this.addMessage(text, 'user'); }
  addBotMessage(text) { this.addMessage(text, 'bot'); }

  formatReply(text) {
    return (text || '')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  addMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = `ai-msg ${type}`;
    if (type === 'bot') {
      msg.innerHTML = this.formatReply(text);
    } else {
      msg.textContent = text;
    }
    this.messagesEl?.appendChild(msg);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  showTyping() {
    const typing = document.createElement('div');
    typing.className = 'ai-msg bot typing-indicator';
    typing.id = 'typing-indicator';
    typing.textContent = 'Escribiendo...';
    typing.style.opacity = '0.6';
    typing.style.fontStyle = 'italic';
    this.messagesEl?.appendChild(typing);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  hideTyping() {
    document.getElementById('typing-indicator')?.remove();
  }
}

class DemoChat {
  constructor() {
    this.messagesEl = document.querySelector('.ai-demo-messages');
    this.input = document.querySelector('.ai-demo-input input');
    this.sendBtn = document.querySelector('.ai-demo-input button');
    if (!this.messagesEl) return;

    this.conversationId = null;
    this.currentUserId = null;

    this.sendBtn?.addEventListener('click', () => this.send());
    this.input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.send();
    });
    window.addEventListener('da-auth-change', () => {
      this.conversationId = null;
      this.currentUserId = null;
    });
  }

  restoreConversationFromStorage(userId) {
    const storedId = sessionStorage.getItem(`da_chat_conv_${userId}`);
    if (storedId) this.conversationId = Number(storedId);
  }

  async send() {
    const text = this.input?.value.trim();
    if (!text) return;

    if (!window.API?.Auth.isLoggedIn()) {
      this.addMsg('Inicia sesión para usar la IA educativa. Cada usuario tiene su conversación privada.', 'bot');
      return;
    }

    const userId = getChatUserId();
    if (userId !== this.currentUserId) {
      this.conversationId = null;
      this.currentUserId = userId;
    }
    if (!this.conversationId) this.restoreConversationFromStorage(userId);

    this.addMsg(text, 'user');
    this.input.value = '';

    try {
      const apiBase = window.location.protocol === 'file:' ? 'http://localhost:3001/api' : '/api';
      const res = await fetch(`${apiBase}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${window.API.Auth.getToken()}`
        },
        body: JSON.stringify({ message: text, conversationId: this.conversationId || null })
      });
      const data = await res.json();
      if (!res.ok) {
        this.addMsg(data.error || 'Lo siento, no pude responder.', 'bot');
        return;
      }
      if (data.conversationId) {
        this.conversationId = data.conversationId;
        sessionStorage.setItem(`da_chat_conv_${userId}`, String(this.conversationId));
      }
      this.addMsg(data.reply || 'Lo siento, no pude responder.', 'bot');
    } catch {
      this.addMsg('Error de conexión con el asistente.', 'bot');
    }
  }

  addMsg(text, type) {
    const msg = document.createElement('div');
    msg.className = `ai-msg ${type}`;
    if (type === 'bot') {
      msg.innerHTML = (text || '')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    } else {
      msg.textContent = text;
    }
    this.messagesEl.appendChild(msg);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ChatAssistant();
  new DemoChat();
});
