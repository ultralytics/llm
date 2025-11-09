// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

class UltralyticsChat {
  constructor(config = {}) {
    this.config = {
      apiUrl: config.apiUrl || "/api/chat",
      maxMessageLength: config.maxMessageLength || 10000,
      branding: {
        name: config.branding?.name || "AI",
        tagline:
          config.branding?.tagline ||
          "Ask anything about Ultralytics, YOLO, and more",
        logo:
          config.branding?.logo ||
          "https://cdn.prod.website-files.com/680a070c3b99253410dd3dcf/680a070c3b99253410dd3e13_logo.svg",
        logomark:
          config.branding?.logomark ||
          "https://storage.googleapis.com/organization-image-assets/ultralytics-botAvatarSrcUrl-1729379860806.svg",
        pillText: config.branding?.pillText || "Ask AI",
      },
      theme: {
        primary: config.theme?.primary || "#042AFF",
        dark: config.theme?.dark || "#111F68",
        yellow: config.theme?.yellow || "#E1FF25",
        text: config.theme?.text || "#0b0b0f",
      },
      welcome: {
        title: config.welcome?.title || "Hi!",
        message:
          config.welcome?.message ||
          "I'm an AI assistant trained on documentation, help articles, and other content.<br>Ask me anything about Ultralytics.",
        examples: config.welcome?.examples || [
          "What's new in YOLO11?",
          "How do I get started with YOLO?",
          "Tell me about Enterprise Licensing",
        ],
      },
      ui: {
        placeholder: config.ui?.placeholder || "Ask anything…",
        copyText: config.ui?.copyText || "Copy thread",
        downloadText: config.ui?.downloadText || "Download thread",
        clearText: config.ui?.clearText || "New chat",
      },
    };

    this.apiUrl = this.config.apiUrl;
    this.messages = [];
    this.isOpen = false;
    this.isStreaming = false;
    this.abortController = null;
    this.sessionId = this.loadSessionId();
    this.autoScroll = true;
    this.mode = "chat";
    this.refs = {};
    this.listeners = new Map();
    this.inputDebounceTimer = null;
    this.init();
  }

  // -------------------- Utilities --------------------
  qs = (sel, root = document) => root.querySelector(sel);
  qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

  on(el, ev, fn) {
    if (!el) return;
    el.addEventListener(ev, fn);
    if (!this.listeners.has(el)) this.listeners.set(el, []);
    this.listeners.get(el).push({ ev, fn });
  }

  el(tag, cls = "", html = "") {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }

  loadSessionId() {
    try {
      return localStorage.getItem("ult-chat-session");
    } catch {
      return null;
    }
  }

  saveSessionId(id) {
    try {
      localStorage.setItem("ult-chat-session", id);
    } catch (e) {
      console.warn("Failed to save session ID:", e);
    }
  }

  // -------------------- Init --------------------
  init() {
    this.createStyles();
    this.createUI();
    this.attachEvents();
    this.syncThemeWithSite();
    this.showWelcome(true);
    this.updateComposerState();
  }

  destroy() {
    this.toggle(false);
    if (this.inputDebounceTimer) {
      clearTimeout(this.inputDebounceTimer);
      this.inputDebounceTimer = null;
    }
    this.listeners.forEach((eventList, el) => {
      eventList.forEach(({ ev, fn }) => el.removeEventListener(ev, fn));
    });
    this.listeners.clear();
    this.styleElement?.remove();
    this.refs.modal?.remove();
    this.refs.backdrop?.remove();
    this.refs.pill?.remove();
    this.refs = {};
  }

  // -------------------- Theme --------------------
  syncThemeWithSite() {
    const root = document.documentElement;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      if (!root.hasAttribute("data-theme")) {
        root.setAttribute("data-theme", mql.matches ? "dark" : "light");
      }
    };
    applyTheme();
    const handler = () => applyTheme();
    if (mql.addEventListener) {
      mql.addEventListener("change", handler);
    } else if (mql.addListener) {
      mql.addListener(handler);
    }
  }

  // -------------------- Styles --------------------
  createStyles() {
    const { primary, dark, yellow, text } = this.config.theme;
    this.styleElement = this.el(
      "style",
      "",
      `
      *{box-sizing:border-box}
      :root{--ult-dark:${dark};--ult-primary:${primary};--ult-yellow:${yellow};--ult-text:${text}}

      .ult-backdrop{display:none;position:fixed;inset:0;background:rgba(255,255,255,.07);
        backdrop-filter:blur(3px) saturate(120%) brightness(1.025);-webkit-backdrop-filter:blur(3px) saturate(120%) brightness(1.025);
        z-index:9999;opacity:0;transition:opacity .18s}
      .ult-backdrop.open{display:block;opacity:1}

      .ultralytics-chat-pill{position:fixed;right:16px;bottom:36px;padding:14px 22px;border-radius:9999px;background:var(--ult-yellow);
        color:var(--ult-dark);border:0;cursor:pointer;font-size:18px;font-weight:500;box-shadow:0 20px 38px rgba(2,6,23,.22),0 8px 18px rgba(2,6,23,.14);
        z-index:10000;transition:transform .18s,box-shadow .18s,opacity .14s;display:inline-flex;align-items:center;gap:10px;transform:translateZ(0);
        -webkit-user-select:none;user-select:none}
      .ultralytics-chat-pill:hover{transform:scale(1.1)} .ultralytics-chat-pill.hidden{transform:scale(.95);opacity:0;pointer-events:none}
      .ultralytics-chat-pill img{width:30px;height:30px;border-radius:3px}
      html[data-theme=dark] .ultralytics-chat-pill{background:#40434f;color:#fff;box-shadow:0 20px 38px rgba(0,0,0,.5),0 8px 18px rgba(0,0,0,.32)}

      .ult-chat-modal{position:fixed;left:50%;top:50%;width:min(760px,calc(100vw - 40px));height:min(80vh,820px);background:#fff;border:0;border-radius:16px;
        box-shadow:0 24px 60px rgba(2,6,23,.25),0 8px 24px rgba(2,6,23,.18);z-index:10001;transform:translate(-50%,-50%) scale(.98);opacity:0;transition:transform .18s,opacity .18s;
        flex-direction:column;overflow:hidden;text-align:left;display:none}
      .ult-chat-modal.open{display:flex;opacity:1;transform:translate(-50%,-50%) scale(1)}
      html[data-theme=dark] .ult-chat-modal{background:#0a0a0b}

      .ult-chat-header{padding:16px 18px;display:flex;justify-content:space-between;align-items:center}
      .ult-chat-title{display:flex;align-items:center;gap:10px}
      .ult-chat-title img{max-height:32px;max-width:180px}
      .ult-subtle{font-size:12px;color:#6b7280} html[data-theme=dark] .ult-subtle{color:#a1a1aa}
      .ult-header-actions{display:flex;gap:6px;align-items:center}
      .ult-icon-btn{background:transparent;border:0;width:44px;height:44px;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#6b7280;transition:.15s}
      .ult-icon-btn:hover{transform:translateY(-1px);color:var(--ult-text);background:#f7f7f9}
      html[data-theme=dark] .ult-icon-btn{color:#a1a1aa}
      html[data-theme=dark] .ult-icon-btn:hover{color:#fafafa;background:#17181d}

      .ult-welcome{padding:18px}.ult-welcome h1{font-size:16px;margin:0 0 6px}.ult-welcome p{margin:0;color:#4b5563}
      html[data-theme=dark] .ult-welcome p{color:#a1a1aa}
      .ult-examples{padding:12px 18px 6px;display:flex;flex-wrap:wrap;gap:10px}
      .ult-example{padding:10px 12px;background:#f7f7f9;border:0;border-radius:999px;cursor:pointer;font-size:12px;color:#0b0b0f;transition:.12s}
      .ult-example:hover{transform:translateY(-1px);filter:brightness(.98)}
      html[data-theme=dark] .ult-example{background:#131318;color:#fafafa}

      .ult-chat-messages{flex:1;overflow-y:auto;padding:0 18px 18px;display:flex;flex-direction:column;gap:14px;-webkit-overflow-scrolling:touch}
      .ult-message-group{display:flex;flex-direction:column;gap:6px}
      .ult-message-label{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.03em;padding:0 2px}
      html[data-theme=dark] .ult-message-label{color:#a1a1aa}
      .ult-message-label img{max-height:24px;max-width:24px;border-radius:4px}
      .ult-user-icon{color:var(--ult-yellow)}
      .ult-message{font-size:14px;line-height:1.6;color:var(--ult-text);padding:0 2px;word-break:break-word;text-align:left}
      html[data-theme=dark] .ult-message{color:#f5f5f5}
      .ult-message a{color:var(--ult-primary);text-underline-offset:2px}.ult-message a:hover{text-decoration:underline}
      .ult-message pre{background:#0f172a;color:#e5e7eb;padding:10px 12px;border-radius:10px;overflow:auto;margin:6px 0;border:0}
      .ult-message code{background:#f4f4f5;padding:2px 6px;border-radius:6px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;border:0}
      .ult-message pre code{background:transparent;padding:0;border:0;display:block;color:inherit;font-size:13px}
      html[data-theme=dark] .ult-message code{background:#1e1e22}
      html[data-theme=dark] .ult-message pre code{background:transparent}

      .ult-search-result{padding:14px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;margin-bottom:10px;transition:.12s}
      .ult-search-result:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(2,6,23,.08)}
      html[data-theme=dark] .ult-search-result{background:#131318;border-color:#232327}
      .ult-search-result-title{font-size:15px;font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:8px}
      .ult-search-result-title a{text-decoration:none;color:var(--ult-primary)}
      .ult-search-result-favicon{width:18px;height:18px;border-radius:4px;flex-shrink:0;background:#f4f4f5;box-shadow:0 0 0 1px rgba(0,0,0,.05)}
      html[data-theme=dark] .ult-search-result-favicon{background:#1f1f25;box-shadow:0 0 0 1px rgba(255,255,255,.06)}
      .ult-search-result-snippet{font-size:13px;line-height:1.5;color:#4b5563;margin-bottom:8px}
      html[data-theme=dark] .ult-search-result-snippet{color:#a1a1aa}
      .ult-search-result-meta{display:flex;gap:12px;font-size:11px;color:#9ca3af} html[data-theme=dark] .ult-search-result-meta{color:#71717a}

      .ult-typing{display:inline-flex;gap:4px}
      .ult-typing span{width:6px;height:6px;background:#a1a1aa;border-radius:50%;animation:ultTyping 1.2s infinite}
      .ult-typing span:nth-child(2){animation-delay:.18s}.ult-typing span:nth-child(3){animation-delay:.36s}
      @keyframes ultTyping{0%,60%,100%{transform:translateY(0);opacity:1}30%{transform:translateY(-6px);opacity:.75}}
      .ult-thinking{display:inline-flex;align-items:center;gap:8px;padding:6px 0;color:#6b7280;font-size:13px}
      html[data-theme=dark] .ult-thinking{color:#a1a1aa}

      .ult-chat-input-container{padding:12px 12px 16px;display:flex;gap:8px;align-items:flex-end}
      .ult-actions{display:flex;gap:6px;align-items:center}
      .ult-action-btn,.ult-chat-send{background:#f1f2f6;border:0;border-radius:12px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.12s;flex-shrink:0}
      .ult-action-btn:hover,.ult-chat-send:hover{transform:translateY(-1px);filter:brightness(.98)}
      html[data-theme=dark] .ult-action-btn,html[data-theme=dark] .ult-chat-send{background:#17181d}
      .ult-chat-input{flex:1;padding:10px 12px;border:0;border-radius:12px;font-size:16px;resize:none;max-height:140px;background:#f7f7f9;color:#0b0b0f;outline:0}
      .ult-chat-input::placeholder{color:#9ca3af} html[data-theme=dark] .ult-chat-input{background:#131318;color:#fafafa}

      .ult-chat-modal[data-mode="search"] .ult-chat-header{order:0}
      .ult-chat-modal[data-mode="search"] .ult-chat-input-container{order:1;padding:16px 18px;border-top:1px solid #eceff5;border-bottom:1px solid #eceff5;background:#fdfdff;align-items:center}
      html[data-theme=dark] .ult-chat-modal[data-mode="search"] .ult-chat-input-container{border-color:#1c1c22;background:#0e0e13}
      .ult-chat-modal[data-mode="search"] #ult-welcome,
      .ult-chat-modal[data-mode="search"] #ult-examples{order:2;width:100%}
      .ult-chat-modal[data-mode="search"] .ult-chat-messages{order:3}

      .ult-icon-swap{display:flex;align-items:center;justify-content:center}
      @media (max-width:768px){.ult-backdrop{pointer-events:none}.ult-chat-modal{left:0;top:0;transform:none;width:100vw;height:100vh;border-radius:0;pointer-events:auto;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}.ult-chat-modal.open{transform:none}.ult-actions{display:none}.ult-chat-header{padding:12px 18px}.ult-chat-input-container{padding-bottom:max(16px,env(safe-area-inset-bottom))}}
    `,
    );
    document.head.appendChild(this.styleElement);
  }

  // -------------------- Icons --------------------
  icon(name) {
    const base =
      'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
    const paths = {
      copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
      download:
        '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
      refresh:
        '<path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>',
      close:
        '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
      like: '<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>',
      dislike:
        '<path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>',
      share:
        '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98"/><path d="M15.41 6.51L8.59 10.49"/>',
      arrowUp:
        '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
      square: '<rect x="6" y="6" width="12" height="12" rx="2" ry="2"/>',
    };
    return `<svg ${base} aria-hidden="true">${paths[name] || ""}</svg>`;
  }

  // -------------------- UI --------------------
  createUI() {
    const { logomark, pillText, logo, name, tagline } = this.config.branding;
    const { title, message, examples } = this.config.welcome;
    const { placeholder, copyText, downloadText, clearText } = this.config.ui;

    this.refs.backdrop = this.el("div", "ult-backdrop");
    document.body.appendChild(this.refs.backdrop);

    this.refs.pill = this.el(
      "button",
      "ultralytics-chat-pill",
      `<span>${this.escapeHtml(pillText)}</span><img src="${this.escapeHtml(logomark)}" alt="${this.escapeHtml(name)}" />`,
    );
    this.refs.pill.setAttribute("aria-label", pillText);
    this.refs.pill.title = pillText;
    document.body.appendChild(this.refs.pill);

    this.refs.modal = this.el(
      "div",
      "ult-chat-modal",
      `
      <div class="ult-chat-header">
        <div class="ult-chat-title">
          <img src="${this.escapeHtml(logo)}" alt="${this.escapeHtml(name)}" />
          <div class="ult-subtle">${this.escapeHtml(tagline)}</div>
        </div>
        <div class="ult-header-actions">
          <button class="ult-icon-btn ult-chat-copy" title="${this.escapeHtml(copyText)}" aria-label="${this.escapeHtml(copyText)}">${this.icon("copy")}</button>
          <button class="ult-icon-btn ult-chat-download" title="${this.escapeHtml(downloadText)}" aria-label="${this.escapeHtml(downloadText)}">${this.icon("download")}</button>
          <button class="ult-icon-btn ult-chat-clear" title="${this.escapeHtml(clearText)}" aria-label="${this.escapeHtml(clearText)}">${this.icon("refresh")}</button>
          <button class="ult-icon-btn ult-chat-close" title="Close" aria-label="Close">${this.icon("close")}</button>
        </div>
      </div>

      <div id="ult-welcome" class="ult-welcome" style="display:none">
        <h1>${this.escapeHtml(title)}</h1><p>${message}</p>
      </div>

      <div id="ult-examples" class="ult-examples" style="display:none"></div>

      <div class="ult-chat-messages" id="ult-messages" aria-live="polite"></div>

      <div class="ult-chat-input-container">
        <div class="ult-actions">
          <button class="ult-action-btn ult-act-copy" title="Copy last response" aria-label="Copy last response">${this.icon("copy")}</button>
          <button class="ult-action-btn ult-act-like" title="Thumbs up" aria-label="Thumbs up">${this.icon("like")}</button>
          <button class="ult-action-btn ult-act-dislike" title="Thumbs down" aria-label="Thumbs down">${this.icon("dislike")}</button>
          <button class="ult-action-btn ult-act-share" title="Share" aria-label="Share">${this.icon("share")}</button>
          <button class="ult-action-btn ult-act-retry" title="Try again" aria-label="Try again">${this.icon("refresh")}</button>
        </div>
        <textarea class="ult-chat-input" placeholder="${this.escapeHtml(placeholder)}" rows="1" maxlength="${this.config.maxMessageLength}"></textarea>
        <button class="ult-chat-send" title="Ready" aria-label="Ready">
          <span class="ult-icon-swap" data-icon="square">${this.icon("square")}</span>
        </button>
      </div>
    `,
    );
    this.refs.modal.setAttribute("role", "dialog");
    this.refs.modal.setAttribute("aria-modal", "true");
    document.body.appendChild(this.refs.modal);

    this.refs.messages = this.qs("#ult-messages", this.refs.modal);
    this.refs.welcome = this.qs("#ult-welcome", this.refs.modal);
    this.refs.examples = this.qs("#ult-examples", this.refs.modal);
    this.refs.input = this.qs(".ult-chat-input", this.refs.modal);
    this.refs.send = this.qs(".ult-chat-send", this.refs.modal);

    this.setExamples(examples);
  }

  setExamples(list) {
    if (!this.refs.examples) return;
    this.refs.examples.innerHTML = list
      .map(
        (q) =>
          `<button class="ult-example" data-q="${this.escapeHtml(q)}">${this.escapeHtml(q)}</button>`,
      )
      .join("");
    this.qsa(".ult-example", this.refs.examples).forEach((b) =>
      this.on(b, "click", () => this.sendMessage(b.dataset.q)),
    );
  }

  // -------------------- Events --------------------
  attachEvents() {
    const m = this.refs.modal;

    this.on(this.refs.pill, "click", () => this.toggle(true, "chat"));
    this.on(this.refs.backdrop, "click", () => this.toggle());
    this.on(this.qs(".ult-chat-close", m), "click", () => this.toggle());
    this.on(this.qs(".ult-chat-clear", m), "click", () => this.clearSession());
    this.on(this.qs(".ult-chat-copy", m), "click", () => this.copyThread());
    this.on(this.qs(".ult-chat-download", m), "click", () =>
      this.downloadThread(),
    );

    this.on(this.refs.messages, "scroll", () => {
      const d = this.refs.messages;
      this.autoScroll = d.scrollHeight - d.scrollTop - d.clientHeight < 100;
    });

    this.on(this.refs.input, "input", (e) => {
      const t = e.target;
      t.style.height = "auto";
      t.style.height = Math.min(t.scrollHeight, 140) + "px";
      if (this.inputDebounceTimer) clearTimeout(this.inputDebounceTimer);
      this.inputDebounceTimer = setTimeout(
        () => this.updateComposerState(),
        50,
      );
    });

    this.on(this.refs.send, "click", () => {
      if (this.isStreaming) this.stopStreaming();
      else this.sendMessage(this.refs.input.value.trim());
    });

    this.on(this.refs.input, "keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage(this.refs.input.value.trim());
      }
      if (e.key === "Escape") {
        e.preventDefault();
        this.toggle(false);
      }
    });

    this.on(document, "keydown", (e) => {
      if (this.isOpen && e.key === "Escape") this.toggle(false);
      if (!this.isOpen && e.metaKey && e.key.toLowerCase() === "k")
        this.toggle(true);
    });

    this.on(this.qs(".ult-act-copy", m), "click", () =>
      this.copyLastAssistant(),
    );
    this.on(this.qs(".ult-act-like", m), "click", () => this.feedback("up"));
    this.on(this.qs(".ult-act-dislike", m), "click", () =>
      this.feedback("down"),
    );
    this.on(this.qs(".ult-act-share", m), "click", () => this.copyThread());
    this.on(this.qs(".ult-act-retry", m), "click", () => this.retryLast());
  }

  // -------------------- State + Mode --------------------
  toggle(forceOpen = null, mode = null) {
    const next = forceOpen === null ? !this.isOpen : !!forceOpen;
    this.isOpen = next;
    if (mode) this.mode = mode;

    this.refs.modal?.classList.toggle("open", next);
    this.refs.backdrop?.classList.toggle("open", next);
    this.refs.pill?.classList.toggle("hidden", next);
    document.documentElement.style.overflow = next ? "hidden" : "";

    if (next) {
      this.updateUIForMode();
      if (!this.messages.length) this.showWelcome(true);
      this.refs.input?.focus();
      this.updateComposerState();
    } else if (this.isStreaming) {
      this.stopStreaming();
    }
  }

  updateUIForMode() {
    if (!this.refs.modal) return;
    const tagline = this.qs(".ult-subtle", this.refs.modal);
    this.refs.modal.dataset.mode = this.mode;

    if (this.mode === "search") {
      if (this.refs.input) this.refs.input.placeholder = "Search for...";
      if (tagline)
        tagline.innerHTML = `<strong style="color: ${this.config.theme.primary}; font-weight: 700;">SEARCH</strong> · Find answers in our docs and guides`;
      const actions = this.qs(".ult-actions", this.refs.modal);
      if (actions) actions.style.display = "none";
      if (this.refs.messages) this.refs.messages.innerHTML = "";
      if (this.refs.welcome)
        this.refs.welcome.innerHTML = `<p>Enter keywords to find relevant documentation, guides, and resources</p>`;
      this.setExamples([
        "YOLO quickstart",
        "model training parameters",
        "export formats",
        "dataset configuration",
      ]);
      this.showWelcome(true);
    } else {
      if (this.refs.input)
        this.refs.input.placeholder = this.config.ui.placeholder;
      if (tagline) tagline.textContent = this.config.branding.tagline;
      const actions = this.qs(".ult-actions", this.refs.modal);
      if (actions) actions.style.display = "";
      const { title, message, examples } = this.config.welcome;
      if (this.refs.welcome)
        this.refs.welcome.innerHTML = `<h1>${this.escapeHtml(title)}</h1><p>${message}</p>`;
      this.setExamples(examples);
      this.renderChatHistory();
    }
  }

  showWelcome(show) {
    if (this.refs.welcome)
      this.refs.welcome.style.display = show ? "block" : "none";
    if (this.refs.examples)
      this.refs.examples.style.display = show ? "flex" : "none";
  }

  renderChatHistory() {
    if (!this.refs.messages) return;
    this.refs.messages.innerHTML = "";
    if (!this.messages.length) {
      this.showWelcome(true);
      return;
    }

    this.showWelcome(false);
    const prevAutoScroll = this.autoScroll;
    this.autoScroll = false;
    this.messages.forEach((m) => this.addMessageToUI(m.role, m.content));
    this.autoScroll = prevAutoScroll;
    this.refs.messages.scrollTop = this.refs.messages.scrollHeight;
  }

  // -------------------- Composer --------------------
  swapSendIcon(name) {
    const holder = this.qs(".ult-icon-swap", this.refs.send);
    if (!holder || holder.dataset.icon === name) return;
    holder.innerHTML = this.icon(name);
    holder.dataset.icon = name;
    this.refs.send.title =
      name === "square" && this.isStreaming
        ? "Stop"
        : name === "arrowUp"
          ? "Send"
          : "Ready";
    this.refs.send.setAttribute("aria-label", this.refs.send.title);
  }

  updateComposerState() {
    const hasText = !!this.refs.input?.value.trim().length;
    if (this.isStreaming) {
      this.swapSendIcon("square");
      return;
    }
    this.swapSendIcon(hasText ? "arrowUp" : "square");
  }

  // -------------------- Helpers --------------------
  scrollToBottom() {
    if (!this.autoScroll || !this.refs.messages) return;
    requestAnimationFrame(() => {
      if (this.refs.messages)
        this.refs.messages.scrollTop = this.refs.messages.scrollHeight;
    });
  }

  formatThread() {
    return this.messages
      .map(
        (m) =>
          `${m.role === "user" ? "You" : this.config.branding.name}: ${m.content}`,
      )
      .join("\n\n---\n\n");
  }

  copyThread() {
    if (navigator.clipboard?.writeText)
      navigator.clipboard.writeText(this.formatThread()).catch(console.error);
  }

  copyLastAssistant() {
    const last = [...this.messages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (last && navigator.clipboard?.writeText)
      navigator.clipboard.writeText(last.content).catch(console.error);
  }

  feedback(type) {
    console.log("feedback:", type);
  }

  retryLast() {
    const lastUser = [...this.messages]
      .reverse()
      .find((m) => m.role === "user");
    if (lastUser) this.sendMessage(lastUser.content);
  }

  downloadThread() {
    const { name } = this.config.branding;
    const blob = new Blob([this.formatThread()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = this.el("a");
    a.href = url;
    a.download = `${name.toLowerCase().replace(/\s+/g, "-")}-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  clearSession() {
    this.messages = [];
    this.sessionId = null;
    try {
      localStorage.removeItem("ult-chat-session");
    } catch (e) {
      console.warn("Failed to clear session:", e);
    }
    if (this.refs.messages) this.refs.messages.innerHTML = "";
    this.showWelcome(true);
    this.updateComposerState();
  }

  stopStreaming() {
    if (this.abortController) this.abortController.abort();
    this.isStreaming = false;
    this.abortController = null;
    this.updateComposerState();
    this.refs.input?.focus();
  }

  // -------------------- Search --------------------
  createThinking(label = "Thinking") {
    const thinking = this.el(
      "div",
      "ult-thinking",
      `<span class="ult-thinking-word">${label}</span><span class="ult-typing"><span></span><span></span><span></span></span><span class="ult-thinking-time">(0.0s)</span>`,
    );
    const timeEl = this.qs(".ult-thinking-time", thinking);
    const t0 = performance.now();
    const tick = setInterval(() => {
      if (timeEl)
        timeEl.textContent = `(${((performance.now() - t0) / 1000).toFixed(1)}s)`;
    }, 100);
    return { el: thinking, clear: () => clearInterval(tick) };
  }

  async performSearch(query) {
    if (!this.refs.messages) return;
    this.refs.messages.innerHTML = "";
    const { el: thinking, clear } = this.createThinking("Searching");
    this.refs.messages.appendChild(thinking);

    try {
      const url = this.apiUrl.replace(/\/chat$/, "/search");
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      clear();
      thinking.remove();

      if (!data.results?.length) {
        this.refs.messages.innerHTML =
          '<div class="ult-message">No results found. Try different keywords.</div>';
        return;
      }

      this.refs.messages.innerHTML = data.results
        .map((r) => {
          const snippet =
            r.text?.length > 150 ? r.text.slice(0, 150) + "..." : r.text || "";
          let host = "";
          try {
            host = new URL(r.url).hostname;
          } catch {
            host = "";
          }
          const faviconUrl = host
            ? `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(host)}`
            : "";
          const favicon = faviconUrl
            ? `<img class="ult-search-result-favicon" src="${faviconUrl}" alt="" loading="lazy" />`
            : "";
          const metaHost = host ? `<span>${this.escapeHtml(host)}</span>` : "";
          return `
          <div class="ult-search-result">
            <div class="ult-search-result-title">${favicon}<a href="${this.escapeHtml(r.url)}" target="_blank" rel="noopener">${this.escapeHtml(r.title || "")}</a></div>
            <div class="ult-search-result-snippet">${this.escapeHtml(snippet)}</div>
            <div class="ult-search-result-meta"><span class="ult-search-result-score">Match: ${((r.score || 0) * 100).toFixed(0)}%</span>${metaHost}</div>
          </div>`;
        })
        .join("");
    } catch (e) {
      clear();
      thinking.remove();
      if (this.refs.messages)
        this.refs.messages.innerHTML = `<div class="ult-message">Search error: ${this.escapeHtml(e.message)}</div>`;
      console.error("Search error:", e);
    }
  }

  // -------------------- Chat --------------------
  async sendMessage(text) {
    if (!text || this.isStreaming || !this.refs.input || !this.refs.messages)
      return;

    this.showWelcome(false);
    this.autoScroll = true;

    if (this.mode === "search") {
      this.refs.input.value = text;
      this.refs.input.style.height = "auto";
      this.refs.input.style.height =
        Math.min(this.refs.input.scrollHeight, 140) + "px";
      await this.performSearch(text);
      this.refs.input.focus();
      return;
    }

    this.messages.push({ role: "user", content: text });
    this.addMessageToUI("user", text);
    this.refs.input.value = "";
    this.refs.input.style.height = "auto";
    this.isStreaming = true;
    this.updateComposerState();

    const group = this.createMessageGroup("assistant");
    const { el: thinking, clear } = this.createThinking();
    group.appendChild(thinking);
    this.scrollToBottom();

    this.abortController = new AbortController();

    try {
      const res = await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: text }],
          session_id: this.sessionId,
        }),
        signal: this.abortController.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const sid = res.headers.get("X-Session-ID");
      if (sid && !this.sessionId) {
        this.sessionId = sid;
        this.saveSessionId(sid);
      }

      thinking.remove();
      clear();

      const div = this.el("div", "ult-message assistant");
      group.appendChild(div);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let content = "";
      let renderTimer = null;
      const renderDelay = 30;

      const scheduleRender = () => {
        if (renderTimer) return;
        renderTimer = setTimeout(() => {
          div.innerHTML = this.renderMarkdown(content);
          this.scrollToBottom();
          renderTimer = null;
        }, renderDelay);
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              content += parsed.content;
              scheduleRender();
            } else if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e) {
            if (e.message !== "Unexpected end of JSON input")
              console.error("Parse error:", e);
          }
        }
      }

      if (renderTimer) {
        clearTimeout(renderTimer);
        renderTimer = null;
      }
      div.innerHTML = this.renderMarkdown(content);
      this.scrollToBottom();
      this.messages.push({ role: "assistant", content });
    } catch (e) {
      thinking.remove();
      clear();
      const msg = this.el(
        "div",
        "ult-message assistant",
        e.name === "AbortError"
          ? "Generation stopped."
          : "Sorry, I encountered an error. Please try again.",
      );
      group.appendChild(msg);
      console.error("Chat error:", e);
    } finally {
      this.isStreaming = false;
      this.abortController = null;
      this.updateComposerState();
      this.refs.input?.focus();
    }
  }

  // -------------------- Rendering --------------------
  createMessageGroup(role) {
    if (!this.refs.messages) return null;
    const { name, logomark } = this.config.branding;
    const group = this.el("div", "ult-message-group");
    const label = this.el(
      "div",
      "ult-message-label",
      role === "assistant"
        ? `<img src="${this.escapeHtml(logomark)}" alt="${this.escapeHtml(name)}" /><span>${this.escapeHtml(name)}</span>`
        : `<span class="ult-user-icon"><svg width="29" height="29" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg></span><span>You</span>`,
    );
    group.appendChild(label);
    this.refs.messages.appendChild(group);
    this.scrollToBottom();
    return group;
  }

  addMessageToUI(role, content) {
    const group = this.createMessageGroup(role);
    if (!group) return null;
    const div = this.el(
      "div",
      `ult-message ${role === "assistant" ? "assistant" : ""}`,
      this.renderMarkdown(content),
    );
    group.appendChild(div);
    return div;
  }

  escapeHtml(text) {
    const d = this.el("div");
    d.textContent = text;
    return d.innerHTML;
  }

  renderMarkdown(src) {
    const esc = (s) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    const lines = (src || "").replace(/\r\n?/g, "\n").split("\n");
    let html = "",
      inCode = false,
      codeLang = "",
      listType = null,
      listOpen = false,
      inQuote = false,
      paraOpen = false;

    const closePara = () => {
      if (paraOpen) {
        html += "</p>";
        paraOpen = false;
      }
    };
    const openPara = () => {
      if (!paraOpen) {
        html += "<p>";
        paraOpen = true;
      }
    };
    const closeList = () => {
      if (listOpen) {
        html += listType === "ol" ? "</ol>" : "</ul>";
        listOpen = false;
        listType = null;
      }
    };
    const closeQuote = () => {
      if (inQuote) {
        html += "</blockquote>";
        inQuote = false;
      }
    };

    for (let raw of lines) {
      const fence = raw.match(/^```(\w+)?\s*$/);
      if (fence) {
        if (inCode) {
          html += `</code></pre>`;
          inCode = false;
          codeLang = "";
        } else {
          closePara();
          closeList();
          closeQuote();
          inCode = true;
          codeLang = fence[1] || "";
          html += `<pre><code class="lang-${esc(codeLang)}">`;
        }
        continue;
      }
      if (inCode) {
        html += esc(raw) + "\n";
        continue;
      }

      const q = /^>\s?(.*)$/.exec(raw);
      if (q) {
        if (!inQuote) {
          closePara();
          closeList();
          html += "<blockquote>";
          inQuote = true;
        }
        raw = q[1];
      } else closeQuote();

      let m;
      if ((m = raw.match(/^\s*([-*+])\s+(.+)$/))) {
        if (!listOpen || listType !== "ul") {
          closePara();
          closeList();
          html += "<ul>";
          listOpen = true;
          listType = "ul";
        }
        html += `<li>${this.renderInline(m[2])}</li>`;
        continue;
      }
      if ((m = raw.match(/^\s*(\d+)\.\s+(.+)$/))) {
        if (!listOpen || listType !== "ol") {
          closePara();
          closeList();
          html += "<ol>";
          listOpen = true;
          listType = "ol";
        }
        html += `<li>${this.renderInline(m[2])}</li>`;
        continue;
      }
      if (/^\s*$/.test(raw)) {
        closePara();
        closeList();
        closeQuote();
        continue;
      }
      if ((m = raw.match(/^###\s+(.+)$/))) {
        closePara();
        closeList();
        closeQuote();
        html += `<h3>${this.renderInline(m[1])}</h3>`;
        continue;
      }
      if ((m = raw.match(/^##\s+(.+)$/))) {
        closePara();
        closeList();
        closeQuote();
        html += `<h2>${this.renderInline(m[1])}</h2>`;
        continue;
      }
      if ((m = raw.match(/^#\s+(.+)$/))) {
        closePara();
        closeList();
        closeQuote();
        html += `<h1>${this.renderInline(m[1])}</h1>`;
        continue;
      }

      openPara();
      html += this.renderInline(raw);
    }
    closePara();
    closeList();
    closeQuote();
    return html;
  }

  renderInline(text) {
    if (!text) return "";
    text = this.escapeHtml(text);
    text = text.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );
    text = text.replace(
      /(?<!["'(])\bhttps?:\/\/[^\s<)]+[^\s<).,;:'")\]]/g,
      (u) =>
        `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`,
    );
    text = text.replace(/(\*\*|__)(.*?)\1/g, "<strong>$2</strong>");
    text = text.replace(/(\*|_)([^*_]+)\1/g, "<em>$2</em>");
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    return text.replace(/ {2}\n/g, "<br>");
  }
}
