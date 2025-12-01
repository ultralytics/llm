// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

class UltralyticsChat {
  constructor(config = {}) {
    const d = (o, k, v) => o?.[k] ?? v;
    this.config = {
      apiUrl: d(config, "apiUrl", "https://chat-885297101091.us-central1.run.app/api/chat"),
      maxMessageLength: d(config, "maxMessageLength", 10000),
      branding: {
        name: d(config.branding, "name", "Ultralytics AI"),
        tagline: d(config.branding, "tagline", "Ask anything about Ultralytics, YOLO, and more"),
        logo: d(
          config.branding,
          "logo",
          "https://cdn.prod.website-files.com/680a070c3b99253410dd3dcf/68e4eb1e9893320b26cc02c3_Ultralytics%20Logo.png.svg",
        ),
        logomark: d(
          config.branding,
          "logomark",
          "https://storage.googleapis.com/organization-image-assets/ultralytics-botAvatarSrcUrl-1729379860806.svg",
        ),
        logoUrl: d(config.branding, "logoUrl", "https://www.ultralytics.com"),
        pillText: d(config.branding, "pillText", "Ask AI"),
      },
      theme: {
        primary: d(config.theme, "primary", "#042AFF"),
        dark: d(config.theme, "dark", "#111F68"),
        accent: d(config.theme, "accent", d(config.theme, "yellow", "#E1FF25")),
        text: d(config.theme, "text", "#0b0b0f"),
      },
      welcome: {
        title: d(config.welcome, "title", "Hello 👋"),
        message: d(
          config.welcome,
          "message",
          "I'm an AI assistant trained on Ultralytics documentation - ask me anything!",
        ),
        chatExamples: d(config.welcome, "chatExamples") ??
          d(config.welcome, "examples") ?? [
            "What's new in YOLO11?",
            "How do I get started with YOLO?",
            "Tell me about Enterprise Licensing",
          ],
        searchExamples: d(config.welcome, "searchExamples", [
          "YOLO quickstart",
          "model training parameters",
          "export formats",
          "dataset configuration",
        ]),
      },
      ui: {
        placeholder: d(config.ui, "placeholder", "Ask anything…"),
        copyText: d(config.ui, "copyText", "Copy thread"),
        downloadText: d(config.ui, "downloadText", "Download thread"),
        clearText: d(config.ui, "clearText", "New chat"),
      },
    };
    this.apiUrl = this.config.apiUrl;
    this.feedbackUrl = d(
      config,
      "feedbackUrl",
      (() => {
        if (this.apiUrl.endsWith("/chat")) return this.apiUrl.replace(/\/chat$/, "/feedback");
        const trimmed = this.apiUrl.replace(/\/$/, "");
        return `${trimmed}/feedback`;
      })(),
    );
    this.messages = [];
    this.isOpen = false;
    this.isStreaming = false;
    this.abortController = null;
    this.sessionId = this.loadSessionId();
    this.autoScroll = true;
    this.lastScrollTop = 0;
    this.mode = "chat";
    this.scrollY = 0;
    this.refs = {};
    this.listeners = new Map();
    this.inputDebounceTimer = null;
    this.init();
  }

  qs = (sel, root = document) => root.querySelector(sel);
  qsa = (sel, root = document) => [...root.querySelectorAll(sel)];
  esc = (s) => this.escapeHtml(s);
  getGroupIndex(group) {
    if (!group) return null;
    const idx = Number.parseInt(group.dataset?.messageIndex ?? "", 10);
    return Number.isNaN(idx) ? null : idx;
  }

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

  showCopySuccess(btn) {
    if (!btn) return;
    if (btn.__successTimeout) clearTimeout(btn.__successTimeout);
    if (!btn.dataset.successOriginal) btn.dataset.successOriginal = btn.innerHTML;
    btn.innerHTML = this.icon("check");
    btn.classList.add("success");
    btn.__successTimeout = setTimeout(() => {
      if (btn.dataset.successOriginal) {
        btn.innerHTML = btn.dataset.successOriginal;
        delete btn.dataset.successOriginal;
      }
      btn.classList.remove("success");
      btn.__successTimeout = null;
    }, 1500);
  }

  flashTooltip(target, message) {
    const tip = this.refs.tooltip;
    if (!target || !tip) return;
    const rect = target.getBoundingClientRect();
    tip.textContent = message;
    tip.style.left = `${rect.left + rect.width / 2}px`;
    tip.style.top = `${rect.top - 8}px`;
    tip.classList.add("show");
    if (tip.__timer) clearTimeout(tip.__timer);
    tip.__timer = setTimeout(() => {
      tip.classList.remove("show");
      tip.__timer = null;
    }, 1600);
  }

  getPageContext() {
    const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.content || "";
    return {
      url: window.location.href,
      title: document.title,
      description: meta("description"),
      path: window.location.pathname,
    };
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
    } catch {
      console.warn("Failed to save session ID");
    }
  }

  init() {
    this.ensureViewport();
    this.loadHighlightJS();
    this.createStyles();
    this.createUI();
    this.attachEvents();
    this.syncThemeWithSite();
    this.showWelcome(true);
    this.updateComposerState();
    this.watchForRemoval();
  }

  loadHighlightJS() {
    if (window.hljs || document.getElementById("hljs-theme")) return;
    const link = this.el("link");
    link.rel = "stylesheet";
    link.id = "hljs-theme";
    document.head.appendChild(link);
    const script = this.el("script");
    script.src = "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js";
    script.onload = () => window.hljs?.configure({ ignoreUnescapedHTML: true });
    document.head.appendChild(script);
  }

  highlight(el) {
    if (!window.hljs) return;
    el?.querySelectorAll("pre code").forEach((b) => {
      if (!b.dataset.highlighted) {
        const lang = [...b.classList].find((c) => c.startsWith("lang-"))?.replace("lang-", "");
        if (lang) b.classList.add(`language-${lang}`);
        window.hljs.highlightElement(b);
      }
    });
  }

  ensureViewport() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement("meta");
      viewport.name = "viewport";
      document.head.appendChild(viewport);
    }
    if (!viewport.content.includes("maximum-scale"))
      viewport.content = "width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no";
  }

  watchForRemoval() {
    const elements = [
      { element: () => this.styleElement, parent: document.head },
      { element: () => this.refs.pill, parent: document.body },
      { element: () => this.refs.modal, parent: document.body },
      { element: () => this.refs.backdrop, parent: document.body },
    ];
    const observer = new MutationObserver(() =>
      elements.forEach(({ element, parent }) => {
        const el = element();
        if (el?.parentNode !== parent) parent.appendChild(el);
      }),
    );
    observer.observe(document.head, { childList: true });
    observer.observe(document.body, { childList: true });
    this.domObserver = observer;
  }

  destroy() {
    this.toggle(false);
    if (this.inputDebounceTimer) clearTimeout(this.inputDebounceTimer);
    this.domObserver?.disconnect();
    for (const [el, eventList] of this.listeners) {
      for (const { ev, fn } of eventList) {
        el.removeEventListener(ev, fn);
      }
    }
    this.listeners.clear();
    this.styleElement?.remove();
    this.refs.modal?.remove();
    this.refs.backdrop?.remove();
    this.refs.pill?.remove();
    this.refs.tooltip?.remove();
    this.refs = {};
  }

  syncThemeWithSite() {
    const root = document.documentElement;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      if (!root.hasAttribute("data-theme")) root.setAttribute("data-theme", mql.matches ? "dark" : "light");
      const link = document.getElementById("hljs-theme");
      if (link) {
        const dark = root.getAttribute("data-theme") === "dark";
        link.href = `https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github${dark ? "-dark" : ""}.min.css`;
      }
    };
    applyTheme();
    mql.addEventListener("change", applyTheme);
  }

  createStyles() {
    const { primary, dark, accent, text } = this.config.theme;
    this.styleElement = this.el(
      "style",
      "",
      `
      *{box-sizing:border-box}
      :root{--ult-dark:${dark};--ult-primary:${primary};--ult-accent:${accent};--ult-text:${text}}

      .ult-backdrop{display:none;position:fixed;inset:0;background:rgba(255,255,255,.07);
        backdrop-filter:blur(5px) saturate(120%) brightness(1.025);-webkit-backdrop-filter:blur(5px) saturate(120%) brightness(1.025);
        z-index:9999;opacity:0;visibility:hidden;transition:opacity .2s ease-out,visibility .2s;pointer-events:none}
      .ult-backdrop.open{display:block;opacity:1;visibility:visible;pointer-events:auto}

      .ultralytics-chat-pill{position:fixed;right:16px;bottom:36px;padding:14px 22px;border-radius:9999px;background:var(--ult-accent);
        color:var(--ult-dark);border:0;cursor:pointer;font-size:18px;font-weight:500;box-shadow:0 20px 38px rgba(2,6,23,.22),0 8px 18px rgba(2,6,23,.14);
        z-index:10000;transition:opacity .2s ease-out,transform .15s ease-out;
        display:inline-flex;align-items:center;gap:10px;transform:scale(1) translateZ(0);opacity:1;
        -webkit-user-select:none;user-select:none;touch-action:manipulation;will-change:opacity,transform}
      .ultralytics-chat-pill:hover{transform:scale(1.05) translateZ(0)}
      .ultralytics-chat-pill.hidden{opacity:0;pointer-events:none}
      .ultralytics-chat-pill img{width:30px;height:30px;border-radius:3px}
      html[data-theme=dark] .ultralytics-chat-pill{background:#40434f;color:#fff;box-shadow:0 20px 38px rgba(0,0,0,.5),0 8px 18px rgba(0,0,0,.32)}

      .ult-chat-modal{position:fixed;left:50%;top:50%;width:min(760px,calc(100vw - 40px));height:min(80vh,820px);background:rgba(255,255,255,.95);border:0;border-radius:16px;
        box-shadow:0 24px 60px rgba(2,6,23,.25),0 8px 24px rgba(2,6,23,.18);z-index:10001;
        transform:translate(-50%,-50%) translateZ(0);opacity:0;visibility:hidden;
        transition:opacity .2s ease-out,visibility .2s;
        flex-direction:column;overflow:hidden;text-align:left;display:flex;pointer-events:none;will-change:opacity}
      .ult-chat-modal.open{opacity:1;visibility:visible;pointer-events:auto}
      html[data-theme=dark] .ult-chat-modal{background:rgba(10,10,11,.95)}

      .ult-chat-header{padding:16px 18px;display:flex;justify-content:space-between;align-items:center}
      .ult-chat-title{display:flex;align-items:center;gap:10px}
      .ult-chat-title a{display:inline-flex;cursor:pointer}
      .ult-chat-title img{max-height:32px;max-width:180px}
      .ult-subtle{font-size:12px;color:#6b7280} html[data-theme=dark] .ult-subtle{color:#a1a1aa}
      .ult-header-actions{display:flex;gap:6px;align-items:center}
      .ult-icon-btn{background:transparent;border:0;width:32px;height:32px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#6b7280;transition:.15s;touch-action:manipulation;position:relative}
      .ult-icon-btn:hover{transform:translateY(-1px);color:var(--ult-text);background:#f7f7f9}
      html[data-theme=dark] .ult-icon-btn{color:#a1a1aa}
      html[data-theme=dark] .ult-icon-btn:hover{color:#fafafa;background:#17181d}

      .ult-welcome{padding:18px}.ult-welcome h1{font-size:16px;margin:0 0 6px}.ult-welcome p{margin:0;color:#4b5563}
      html[data-theme=dark] .ult-welcome p{color:#a1a1aa}
      .ult-examples{padding:12px 18px 6px;display:flex;flex-wrap:wrap;gap:10px}
      .ult-example{padding:10px 12px;background:#f7f7f9;border:0;border-radius:999px;cursor:pointer;font-size:12px;color:#0b0b0f;transition:.12s;touch-action:manipulation}
      .ult-example:hover{transform:translateY(-1px);filter:brightness(.98)}
      html[data-theme=dark] .ult-example{background:#131318;color:#fafafa}

      .ult-chat-messages{flex:1;overflow-y:auto;padding:0 18px 18px;display:flex;flex-direction:column;gap:14px;-webkit-overflow-scrolling:touch}
      .ult-message-group{padding:8px 8px 4px;margin:-8px -8px 0;border-radius:10px;transition:background .15s ease,border .15s ease;border:1px solid transparent;position:relative}
      .ult-message-group:first-child{margin-top:0}
      .ult-message-group:hover{background:rgba(247,247,249,.4);border-color:rgba(229,231,235,.6)}
      html[data-theme=dark] .ult-message-group:hover{background:rgba(19,19,24,.4);border-color:rgba(35,35,39,.6)}
      .ult-message-group:hover .ult-message-actions,.ult-message-group:focus-within .ult-message-actions{opacity:1}
      .ult-message-label{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.03em;padding:0 2px}
      html[data-theme=dark] .ult-message-label{color:#a1a1aa}
      .ult-message-label img{max-height:24px;max-width:24px;border-radius:4px}
      .ult-user-icon{color:var(--ult-accent)}
      .ult-message{font-size:14px;line-height:1.6;color:var(--ult-text);padding:0 2px;word-break:break-word;text-align:left}
      html[data-theme=dark] .ult-message{color:#f5f5f5}
      .ult-message-actions{display:flex;gap:4px;opacity:0;transition:opacity .15s;margin-top:6px;padding-left:2px}
      .ult-user-message-actions{position:absolute;right:2px;bottom:0;opacity:0;transition:opacity .15s;pointer-events:none}
      .ult-message-group:hover .ult-user-message-actions,.ult-message-group:focus-within .ult-user-message-actions{opacity:1;pointer-events:auto}
      .ult-message a{color:var(--ult-primary);text-underline-offset:2px}.ult-message a:hover{text-decoration:underline}
      .ult-message strong{font-weight:700;color:var(--ult-text)}
      html[data-theme=dark] .ult-message strong{color:#fafafa}
      .ult-code-block{position:relative;margin:6px 0}
      .ult-global-tooltip{position:fixed;background:#1f2937;color:#fff;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:500;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .1s;z-index:10003;transform:translate(-50%,-100%)}
      .ult-global-tooltip::after{content:'';position:absolute;top:100%;left:50%;transform:translateX(-50%);border:4px solid transparent;border-top-color:#1f2937}
      .ult-global-tooltip.show{opacity:1}
      html[data-theme=dark] .ult-global-tooltip{background:#374151}
      html[data-theme=dark] .ult-global-tooltip::after{border-top-color:#374151}
      .ult-code-copy{position:absolute;top:8px;right:8px;background:#f1f2f6;border:0;border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0;transition:.12s;color:#6b7280}
      .ult-code-block:hover .ult-code-copy{opacity:1}
      .ult-code-copy:hover{transform:translateY(-1px);filter:brightness(.98);color:var(--ult-text)}
      .ult-code-copy.success,.ult-icon-btn.success{color:#26C000}
      html[data-theme=dark] .ult-code-copy{background:#17181d;color:#a1a1aa}
      html[data-theme=dark] .ult-code-copy:hover{color:#fafafa}
      html[data-theme=dark] .ult-code-copy.success,html[data-theme=dark] .ult-icon-btn.success{color:#26C000}
      .ult-message pre{padding:10px 12px;border-radius:10px;overflow:auto;border:1px solid #e5e7eb;background:#f6f8fa}
      .ult-message code{background:#f4f4f5;padding:2px 6px;border-radius:6px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;border:0}
      .ult-message pre code{background:transparent;padding:0;border:0;display:block;font-size:13px}
      html[data-theme=dark] .ult-message pre{background:#0d1117;border-color:#30363d}
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
      .ult-thinking{display:flex;align-items:center;gap:8px;padding:0;color:inherit;font-size:inherit}

      .ult-chat-input-container{padding:12px 12px 16px;display:flex;gap:8px;align-items:flex-end}
      .ult-chat-send{background:transparent;border:0;border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.15s;flex-shrink:0;touch-action:manipulation;color:#6b7280;position:relative}
      .ult-chat-send:hover{transform:translateY(-1px);color:var(--ult-text);background:#f7f7f9}
      html[data-theme=dark] .ult-chat-send{color:#a1a1aa}
      html[data-theme=dark] .ult-chat-send:hover{color:#fafafa;background:#17181d}
      .ult-chat-input{flex:1;border:0;font-size:14px;resize:none;max-height:140px;background:#f7f7f9;color:#0b0b0f;border-radius:12px;padding:10px 12px;outline:0}
      .ult-chat-input::placeholder{color:#9ca3af}
      html[data-theme=dark] .ult-chat-input{background:#131318;color:#fafafa}
      .ult-message[contenteditable]{cursor:text;outline:0;background:transparent;padding:0 2px;border:1px solid transparent;border-radius:0;transition:background .15s ease,border-color .15s ease}
      .ult-message-editing{background:#f7f7f9;color:#0b0b0f;border-radius:12px;padding:10px 12px;margin:6px 0;border:1px solid #eceff5;font-size:14px;line-height:1.45;min-height:42px;max-height:140px;overflow:auto}
      html[data-theme=dark] .ult-message-editing{background:#131318;color:#fafafa;border-color:#1c1c22}

      .ult-chat-footer{padding:8px 18px;text-align:left;font-size:11px;color:#9ca3af}
      html[data-theme=dark] .ult-chat-footer{color:#71717a}
      .ult-chat-footer a{color:var(--ult-primary)}
      .ult-chat-footer a:hover{text-decoration:underline}

      .ult-chat-modal[data-mode="search"] .ult-chat-header{order:0}
      .ult-chat-modal[data-mode="search"] .ult-chat-input-container{order:1;padding:16px 18px;border-top:1px solid #eceff5;border-bottom:1px solid #eceff5;background:#fdfdff;align-items:center}
      html[data-theme=dark] .ult-chat-modal[data-mode="search"] .ult-chat-input-container{border-color:#1c1c22;background:#0e0e13}
      .ult-chat-modal[data-mode="search"] #ult-welcome,
      .ult-chat-modal[data-mode="search"] #ult-examples{order:2;width:100%}
      .ult-chat-modal[data-mode="search"] .ult-chat-messages{order:3}

      .ult-icon-swap{display:flex;align-items:center;justify-content:center}
      @media (max-width:768px){
        .ult-backdrop{transition:opacity .15s ease-out,visibility .15s}
        .ultralytics-chat-pill{transition:opacity .15s ease-out,transform .12s ease-out}
        .ult-chat-modal{transition:opacity .15s ease-out,visibility .15s}
        .ult-backdrop{pointer-events:none}
        .ult-chat-modal{position:fixed;left:0;top:0;width:100vw;height:100svh;max-width:100vw;max-height:100svh;border-radius:0;margin:0;padding:0;transform:none!important}
        .ult-chat-modal.open{transform:none!important;opacity:1}
        .ult-chat-modal.open{display:flex;flex-direction:column;overflow:hidden}
        body.ult-modal-open{position:fixed!important;width:100%!important;overflow:hidden!important;-webkit-overflow-scrolling:touch}
        .ult-subtle{display:none!important}
        .ult-message-actions{margin-top:4px}
        .ult-chat-header{padding:8px 12px;min-height:48px;flex-shrink:0;border-bottom:1px solid #eceff5}
        html[data-theme=dark] .ult-chat-header{border-bottom-color:#1c1c22}
        .ult-chat-title{gap:6px;flex:1;min-width:0}
        .ult-chat-title a{display:inline-flex}
        .ult-chat-title img{max-height:24px;max-width:120px}
        .ult-header-actions{gap:2px;flex-shrink:0}
        .ult-chat-messages{flex:1 1 0;min-height:0;padding:0 0 8px 0;overflow-y:auto;overflow-x:hidden;overscroll-behavior-y:contain;-webkit-overflow-scrolling:touch}
        .ult-chat-modal.welcome-mode .ult-chat-messages{display:none}
        .ult-welcome{padding:10px 14px 0}
        .ult-welcome h1{font-size:15px;margin:0 0 4px}
        .ult-welcome p{font-size:13px;margin:0;line-height:1.35}
        .ult-examples{padding:6px 14px;gap:6px;flex-wrap:wrap}
        .ult-example{padding:8px 11px;font-size:12px}
        .ult-chat-input-container{padding:8px 14px 10px;flex:0 0 auto;gap:8px;border-top:1px solid #eceff5;background:#fff}
        .ult-chat-modal.welcome-mode .ult-chat-input-container{margin-top:auto}
        html[data-theme=dark] .ult-chat-input-container{border-top-color:#1c1c22;background:#0a0a0b}
        .ult-chat-input{padding:9px 11px;font-size:16px;border-radius:10px;max-height:100px}
        .ult-message-editing{padding:9px 11px;font-size:16px;border-radius:10px;max-height:100px}
        .ult-chat-footer{padding:6px 14px;font-size:10px}
        .ult-message-group{gap:3px;padding:0 14px;margin:0 0 8px;position:relative}
        .ult-user-message-actions{right:0;bottom:0}
        .ult-message-label{font-size:11px;gap:5px;padding:0;margin-bottom:2px}
        .ult-message-label img{max-height:20px;max-width:20px}
        .ult-message-label svg{width:20px;height:20px}
        .ult-message{font-size:14px;line-height:1.5;padding:0}
        .ult-message code{font-size:12px;padding:2px 5px}
        .ult-message pre{padding:8px 10px;font-size:12px;border-radius:8px;margin:4px 0}
        .ult-search-result{padding:10px;margin-bottom:8px;border-radius:8px}
        .ult-search-result-title{font-size:14px;margin-bottom:5px}
        .ult-search-result-snippet{font-size:13px}
        .ult-search-result-meta{font-size:11px}
        .ultralytics-chat-pill{right:14px;bottom:28px;padding:12px 18px;font-size:16px}
        .ultralytics-chat-pill img{width:28px;height:28px}
      }
    `,
    );
    document.head.appendChild(this.styleElement);
  }

  icon(name) {
    const paths = {
      copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
      download:
        '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
      refresh: '<path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>',
      close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
      like: '<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>',
      dislike:
        '<path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>',
      share:
        '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98"/><path d="M15.41 6.51L8.59 10.49"/>',
      arrowUp: '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
      square: '<rect x="4.8" y="4.8" width="14.4" height="14.4" rx="2" ry="2"/>',
      check: '<polyline points="20 6 9 17 4 12"/>',
    };
    return `<svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" fill="none">${paths[name] || ""}</svg>`;
  }

  createUI() {
    const { logomark, pillText, logo, name, tagline, logoUrl } = this.config.branding;
    const { title, message, chatExamples } = this.config.welcome;
    const { placeholder, copyText, downloadText, clearText } = this.config.ui;

    this.refs.backdrop = this.el("div", "ult-backdrop");
    document.body.appendChild(this.refs.backdrop);
    this.refs.backdrop.style.display = "none";

    this.refs.pill = this.el(
      "button",
      "ultralytics-chat-pill",
      `<span>${this.esc(pillText)}</span><img src="${this.esc(logomark)}" alt="${this.esc(name)}" />`,
    );
    this.refs.pill.setAttribute("aria-label", pillText);
    this.refs.pill.title = pillText;
    document.body.appendChild(this.refs.pill);

    this.refs.modal = this.el(
      "div",
      "ult-chat-modal",
      `<div class="ult-chat-header"><div class="ult-chat-title"><a href="${this.esc(logoUrl)}" target="_blank" rel="noopener"><img src="${this.esc(logo)}" alt="${this.esc(name)}" /></a><div class="ult-subtle">${this.esc(tagline)}</div></div><div class="ult-header-actions"><button class="ult-icon-btn ult-chat-copy" aria-label="${this.esc(copyText)}" data-tooltip="${this.esc(copyText)}">${this.icon("copy")}</button><button class="ult-icon-btn ult-chat-download" aria-label="${this.esc(downloadText)}" data-tooltip="${this.esc(downloadText)}">${this.icon("download")}</button><button class="ult-icon-btn ult-chat-clear" aria-label="${this.esc(clearText)}" data-tooltip="${this.esc(clearText)}">${this.icon("refresh")}</button><button class="ult-icon-btn ult-chat-close" aria-label="Close" data-tooltip="Close">${this.icon("close")}</button></div></div><div id="ult-welcome" class="ult-welcome" style="display:none"><h1>${this.esc(title)}</h1><p>${message}</p></div><div id="ult-examples" class="ult-examples" style="display:none"></div><div class="ult-chat-messages" id="ult-messages" aria-live="polite"></div><div class="ult-chat-input-container"><textarea name="message" class="ult-chat-input" placeholder="${this.esc(placeholder)}" rows="1" maxlength="${this.config.maxMessageLength}" autocomplete="off"></textarea><button class="ult-chat-send" aria-label="Ready" data-tooltip="Ready"><span class="ult-icon-swap" data-icon="square">${this.icon("square")}</span></button></div><div class="ult-chat-footer">Powered by <a href="https://github.com/ultralytics/llm" target="_blank" rel="noopener">Ultralytics Chat</a> · open source</div>`,
    );
    this.refs.modal.setAttribute("role", "dialog");
    this.refs.modal.setAttribute("aria-modal", "true");
    document.body.appendChild(this.refs.modal);
    this.refs.modal.style.display = "none";

    this.refs.tooltip = this.el("div", "ult-global-tooltip");
    document.body.appendChild(this.refs.tooltip);

    this.refs.messages = this.qs("#ult-messages", this.refs.modal);
    this.refs.welcome = this.qs("#ult-welcome", this.refs.modal);
    this.refs.examples = this.qs("#ult-examples", this.refs.modal);
    this.refs.input = this.qs(".ult-chat-input", this.refs.modal);
    this.refs.send = this.qs(".ult-chat-send", this.refs.modal);
    this.setExamples(chatExamples || []);
  }

  setExamples(list) {
    if (!this.refs.examples) return;
    this.refs.examples.innerHTML = list
      .map((q) => `<button class="ult-example" data-q="${this.esc(q)}">${this.esc(q)}</button>`)
      .join("");
    for (const b of this.qsa(".ult-example", this.refs.examples)) {
      this.on(b, "click", () => void this.sendMessage(b.dataset.q));
    }
  }

  attachEvents() {
    const m = this.refs.modal;
    this.setupTooltips();
    this.on(this.refs.pill, "click", () => this.toggle(true, "chat"));
    this.on(this.refs.backdrop, "click", () => this.toggle());
    this.on(this.qs(".ult-chat-close", m), "click", () => this.toggle());
    this.on(this.qs(".ult-chat-clear", m), "click", () => this.clearSession());
    this.on(this.qs(".ult-chat-copy", m), "click", () => this.copyThread());
    this.on(this.qs(".ult-chat-download", m), "click", () => this.downloadThread());
    this.on(this.refs.messages, "scroll", () => {
      const d = this.refs.messages,
        st = d.scrollTop;
      this.autoScroll = st >= (this.lastScrollTop || 0) && d.scrollHeight - st - d.clientHeight < 100;
      this.lastScrollTop = st;
    });
    this.on(this.refs.input, "input", (e) => {
      const t = e.target;
      t.style.height = "auto";
      t.style.height = `${Math.min(t.scrollHeight, 140)}px`;
      if (t.value.length === this.config.maxMessageLength) this.flashTooltip(t, "⚠️ Message shortened to fit");
      if (this.inputDebounceTimer) clearTimeout(this.inputDebounceTimer);
      this.inputDebounceTimer = setTimeout(() => this.updateComposerState(), 50);
    });
    this.on(this.refs.send, "click", () => {
      if (this.isStreaming) this.stopStreaming();
      else void this.sendMessage(this.refs.input.value.trim());
    });
    this.on(this.refs.input, "keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void this.sendMessage(this.refs.input.value.trim());
      }
      if (e.key === "Escape") {
        e.preventDefault();
        this.toggle(false);
      }
    });
    this.on(document, "keydown", (e) => {
      if (this.isOpen && e.key === "Escape") this.toggle(false);
      if (!this.isOpen && e.metaKey && e.key.toLowerCase() === "k") this.toggle(true);
    });

    this.on(this.refs.messages, "mouseover", (e) => {
      const btn = e.target.closest("[data-tooltip]");
      if (btn && this.refs.tooltip && !btn.dataset.tooltipActive) {
        btn.dataset.tooltipActive = "true";
        const r = btn.getBoundingClientRect();
        this.refs.tooltip.textContent = btn.dataset.tooltip;
        this.refs.tooltip.style.left = `${r.left + r.width / 2}px`;
        this.refs.tooltip.style.top = `${r.top - 8}px`;
        this.refs.tooltip.classList.add("show");
      }
    });
    this.on(this.refs.messages, "mouseout", (e) => {
      const btn = e.target.closest("[data-tooltip]");
      if (btn && (!e.relatedTarget || !btn.contains(e.relatedTarget))) {
        delete btn.dataset.tooltipActive;
        this.refs.tooltip?.classList.remove("show");
      }
    });

    this.on(this.refs.messages, "click", (e) => {
      if (e.target.closest(".ult-code-copy")) {
        const btn = e.target.closest(".ult-code-copy");
        const code = btn.previousElementSibling?.querySelector("code")?.textContent || "";
        navigator.clipboard
          ?.writeText(code)
          .then(() => this.showCopySuccess(btn))
          .catch(console.error);
      }
      const actionBtn = e.target.closest("[data-action]");
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        const group = actionBtn.closest(".ult-message-group");
        if (action === "copy") {
          const groups = this.qsa(".ult-message-group[data-role='assistant']", this.refs.messages);
          const groupIndex = [...groups].indexOf(group);
          const assistantMessages = this.messages.filter((m) => m.role === "assistant");
          const messageContent = assistantMessages[groupIndex]?.content;
          if (messageContent) {
            navigator.clipboard
              ?.writeText(messageContent)
              ?.then(() => this.showCopySuccess(actionBtn))
              .catch(console.error);
          }
        } else if (action === "like" || action === "dislike") {
          this.feedback(action === "like" ? "up" : "down");
          this.showCopySuccess(actionBtn);
        } else if (action === "retry") {
          void this.retryLast();
        } else if (action === "edit") {
          const messageDiv = group.querySelector(".ult-message");
          const idx = this.getGroupIndex(group);
          if (messageDiv && idx !== null) {
            let newContent = messageDiv.textContent.trim();
            if (!newContent) return;
            if (this.isStreaming) {
              this.flashTooltip(actionBtn, "⚠️ Finish generating first");
              return;
            }
            newContent = this.trimMessage(newContent, actionBtn);
            messageDiv.textContent = newContent;
            void this.editAndRestart(idx, newContent).then((ok) => {
              if (ok) this.showCopySuccess(actionBtn);
            });
          }
        }
      }
    });

    this.on(this.refs.messages, "keydown", (e) => {
      const messageDiv = e.target.closest(".ult-message[contenteditable='true']");
      if (!messageDiv) return;
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const group = messageDiv.closest(".ult-message-group");
        const idx = this.getGroupIndex(group);
        if (idx !== null) {
          if (this.isStreaming) {
            this.flashTooltip(messageDiv, "⚠️ Finish generating first");
            return;
          }
          let newContent = messageDiv.textContent.trim();
          if (!newContent) return;
          newContent = this.trimMessage(newContent, messageDiv);
          messageDiv.textContent = newContent;
          void this.editAndRestart(idx, newContent);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        messageDiv.textContent = messageDiv.dataset.originalContent || "";
        messageDiv.blur();
      }
    });
    this.on(this.refs.messages, "focusin", (e) => {
      const messageDiv = e.target.closest(".ult-message[contenteditable='true']");
      if (messageDiv) messageDiv.classList.add("ult-message-editing");
    });
    this.on(this.refs.messages, "focusout", (e) => {
      const messageDiv = e.target.closest(".ult-message[contenteditable='true']");
      if (messageDiv) messageDiv.classList.remove("ult-message-editing");
    });
    this.on(this.refs.messages, "input", (e) => {
      const messageDiv = e.target.closest(".ult-message[contenteditable='true']");
      if (!messageDiv) return;
      const trimmed = this.trimMessage(messageDiv.textContent || "", messageDiv);
      if (trimmed !== (messageDiv.textContent || "")) messageDiv.textContent = trimmed;
    });
  }

  toggle(forceOpen = null, mode = null) {
    const next = forceOpen === null ? !this.isOpen : !!forceOpen;
    if (mode) this.mode = mode;
    if (next === this.isOpen && !mode) return;
    this.isOpen = next;
    const modal = this.refs.modal;
    const backdrop = this.refs.backdrop;
    const pill = this.refs.pill;
    if (next) {
      if (modal) modal.style.display = "flex";
      if (backdrop) backdrop.style.display = "block";
      requestAnimationFrame(() => {
        modal?.classList.add("open");
        backdrop?.classList.add("open");
        pill?.classList.add("hidden");
      });
    } else {
      modal?.classList.remove("open");
      backdrop?.classList.remove("open");
      pill?.classList.remove("hidden");
      const hide = () => {
        if (this.isOpen) return;
        if (modal) modal.style.display = "none";
        if (backdrop) backdrop.style.display = "none";
      };
      modal?.addEventListener("transitionend", hide, { once: true });
      backdrop?.addEventListener("transitionend", hide, { once: true });
      setTimeout(hide, 250);
    }
    if (next) {
      this.scrollY = window.scrollY;
      document.body.classList.add("ult-modal-open");
      document.body.style.top = `-${this.scrollY}px`;
      this.updateUIForMode();
      if (!this.messages.length) this.showWelcome(true);
      this.updateComposerState();
      setTimeout(() => {
        this.refs.input?.focus();
        this.refs.input?.click();
      }, 100);
    } else {
      document.body.classList.remove("ult-modal-open");
      document.body.style.top = "";
      window.scrollTo(0, this.scrollY);
      if (this.isStreaming) this.stopStreaming();
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
      if (this.refs.messages) this.refs.messages.innerHTML = "";
      if (this.refs.welcome)
        this.refs.welcome.innerHTML = "<p>Enter keywords to find relevant documentation, guides, and resources</p>";
      this.setExamples(this.config.welcome.searchExamples || []);
      this.showWelcome(true);
    } else {
      if (this.refs.input) this.refs.input.placeholder = this.config.ui.placeholder;
      if (tagline) tagline.textContent = this.config.branding.tagline;
      const { title, message, chatExamples } = this.config.welcome;
      if (this.refs.welcome) this.refs.welcome.innerHTML = `<h1>${this.esc(title)}</h1><p>${message}</p>`;
      this.setExamples(chatExamples || []);
      this.renderChatHistory();
    }
  }

  showWelcome(show) {
    if (this.refs.welcome) this.refs.welcome.style.display = show ? "block" : "none";
    if (this.refs.examples) this.refs.examples.style.display = show ? "flex" : "none";
    if (this.refs.modal) this.refs.modal.classList.toggle("welcome-mode", show);
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
    for (let i = 0; i < this.messages.length; i += 1) {
      const m = this.messages[i];
      this.addMessageToUI(m.role, m.content, i);
    }
    this.autoScroll = prevAutoScroll;
    this.refs.messages.scrollTop = this.refs.messages.scrollHeight;
  }

  setupTooltips() {
    this.qsa("[data-tooltip]", this.refs.modal).forEach((btn) => {
      this.on(btn, "mouseenter", (e) => {
        const t = this.refs.tooltip;
        if (!t) return;
        const r = e.currentTarget.getBoundingClientRect();
        t.textContent = e.currentTarget.dataset.tooltip;
        t.style.left = `${r.left + r.width / 2}px`;
        t.style.top = `${r.top - 8}px`;
        t.classList.add("show");
      });
      this.on(btn, "mouseleave", () => this.refs.tooltip?.classList.remove("show"));
    });
  }

  swapSendIcon(name) {
    const holder = this.qs(".ult-icon-swap", this.refs.send);
    if (!holder || holder.dataset.icon === name) return;
    holder.innerHTML = this.icon(name);
    holder.dataset.icon = name;
    const label = name === "square" && this.isStreaming ? "Stop" : name === "arrowUp" ? "Send" : "Ready";
    this.refs.send.setAttribute("aria-label", label);
    this.refs.send.dataset.tooltip = label;
  }

  updateComposerState() {
    const hasText = !!this.refs.input?.value.trim().length;
    this.swapSendIcon(this.isStreaming ? "square" : hasText ? "arrowUp" : "square");
  }

  trimMessage(text, target = null) {
    const max = this.config.maxMessageLength;
    if (!text || text.length <= max) return text || "";
    if (target) this.flashTooltip(target, "⚠️ Message shortened to fit");
    return text.slice(0, max);
  }

  scrollToBottom() {
    if (!this.autoScroll || !this.refs.messages) return;
    requestAnimationFrame(() => {
      if (this.refs.messages) this.refs.messages.scrollTop = this.refs.messages.scrollHeight;
    });
  }

  formatThread() {
    return this.messages
      .map((m) => `${m.role === "user" ? "You" : this.config.branding.name}: ${m.content}`)
      .join("\n\n---\n\n");
  }

  copyThread() {
    navigator.clipboard?.writeText(this.formatThread())?.catch(console.error);
    this.showCopySuccess(this.qs(".ult-chat-copy", this.refs.modal));
  }

  async feedback(type) {
    const vote = type === "up";
    const userCount = this.messages.filter((m) => m.role === "user").length;
    if (!userCount) {
      console.warn("feedback ignored: no user messages yet");
      return;
    }
    const queryIndex = userCount - 1;
    try {
      const response = await fetch(this.feedbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: this.sessionId,
          query_index: queryIndex,
          vote,
        }),
      });
      if (!response.ok) {
        throw new Error(`feedback failed with status ${response.status}`);
      }
    } catch (err) {
      console.warn("feedback failed", err);
    }
  }

  retryLast() {
    const lastAssistantIdx = [...this.messages].reverse().findIndex((m) => m.role === "assistant");
    if (lastAssistantIdx === -1) return;
    const actualIdx = this.messages.length - 1 - lastAssistantIdx;
    const lastUserMsg = this.messages[actualIdx - 1];
    if (!lastUserMsg || lastUserMsg.role !== "user") return;
    void this.editAndRestart(actualIdx - 1, lastUserMsg.content);
  }

  async editAndRestart(messageIndex, newContent) {
    if (this.isStreaming) return false;
    if (!Number.isInteger(messageIndex) || messageIndex < 0 || messageIndex >= this.messages.length) return false;
    const message = this.messages[messageIndex];
    if (message.role !== "user") return false;
    newContent = this.trimMessage(newContent);
    message.content = newContent;
    this.messages = this.messages.slice(0, messageIndex + 1);
    const currentGroup = this.qs(`.ult-message-group[data-message-index="${messageIndex}"]`, this.refs.messages);
    const currentMessage = currentGroup?.querySelector(".ult-message");
    if (currentMessage) currentMessage.dataset.originalContent = newContent;
    const groups = this.qsa(".ult-message-group", this.refs.messages);
    groups.forEach((g) => {
      const idx = this.getGroupIndex(g);
      if (idx === null || idx > messageIndex) g.remove();
    });
    if (this.refs.tooltip) this.refs.tooltip.classList.remove("show");
    await this.sendMessage(newContent, false, messageIndex);
    return true;
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
    } catch {
      console.warn("Failed to clear session");
    }
    if (this.refs.messages) this.refs.messages.innerHTML = "";
    this.showWelcome(true);
    this.updateComposerState();
    this.refs.input?.focus();
  }

  stopStreaming() {
    this.abortController?.abort();
    this.isStreaming = false;
    this.abortController = null;
    this.updateComposerState();
    this.refs.input?.focus();
  }

  createThinking(label = "Thinking") {
    const wrapper = this.el("div", "ult-message assistant ult-message-thinking");
    const thinking = this.el(
      "p",
      "ult-thinking",
      `<span class="ult-thinking-word">${label}</span><span class="ult-typing"><span></span><span></span><span></span></span><span class="ult-thinking-time">(0.0s)</span>`,
    );
    wrapper.appendChild(thinking);
    const timeEl = this.qs(".ult-thinking-time", wrapper);
    const t0 = performance.now();
    const tick = setInterval(() => {
      if (timeEl) timeEl.textContent = `(${((performance.now() - t0) / 1000).toFixed(1)}s)`;
    }, 100);
    return { el: wrapper, clear: () => clearInterval(tick) };
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
        this.refs.messages.innerHTML = '<div class="ult-message">No results found. Try different keywords.</div>';
        return;
      }
      this.refs.messages.innerHTML = data.results
        .map((r) => {
          const snippet = r.text?.length > 150 ? `${r.text.slice(0, 150)}...` : r.text || "";
          const host = (() => {
            try {
              return new URL(r.url).hostname;
            } catch {
              return "";
            }
          })();
          const faviconUrl = host ? `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(host)}` : "";
          const favicon = faviconUrl
            ? `<img class="ult-search-result-favicon" src="${faviconUrl}" alt="" loading="lazy" />`
            : "";
          const metaHost = host ? `<span>${this.esc(host)}</span>` : "";
          return `<div class="ult-search-result"><div class="ult-search-result-title">${favicon}<a href="${this.esc(r.url)}" target="_blank" rel="noopener">${this.esc(r.title || "")}</a></div><div class="ult-search-result-snippet">${this.esc(snippet)}</div><div class="ult-search-result-meta"><span class="ult-search-result-score">Match: ${((r.score || 0) * 100).toFixed(0)}%</span>${metaHost}</div></div>`;
        })
        .join("");
    } catch (e) {
      clear();
      thinking.remove();
      if (this.refs.messages)
        this.refs.messages.innerHTML = `<div class="ult-message">Search error: ${this.esc(e.message)}</div>`;
      console.error("Search error:", e);
    }
  }

  async sendMessage(text, isNew = true, editIndex = null) {
    if (!text || this.isStreaming || !this.refs.input || !this.refs.messages) return;
    text = this.trimMessage(text, this.refs.input);
    if (!text) return;
    this.showWelcome(false);
    this.autoScroll = true;
    if (this.mode === "search") {
      this.refs.input.value = text;
      this.refs.input.style.height = "auto";
      this.refs.input.style.height = `${Math.min(this.refs.input.scrollHeight, 140)}px`;
      await this.performSearch(text);
      this.refs.input.focus();
      return;
    }
    if (isNew) {
      this.messages.push({ role: "user", content: text });
      this.addMessageToUI("user", text, this.messages.length - 1);
    }
    this.refs.input.value = "";
    this.refs.input.style.height = "auto";
    this.isStreaming = true;
    this.updateComposerState();
    for (const el of this.qsa(".ult-message[contenteditable='true']", this.refs.messages)) {
      el.contentEditable = "false";
    }
    const group = this.createMessageGroup("assistant", this.messages.length);
    const { el: thinking, clear } = this.createThinking();
    group.appendChild(thinking);
    this.scrollToBottom();
    this.abortController = new AbortController();
    const safeEditIndex =
      Number.isInteger(editIndex) && editIndex >= 0 && editIndex < this.messages.length ? editIndex : null;
    try {
      const body = {
        messages: [{ role: "user", content: text }],
        session_id: this.sessionId,
        context: this.getPageContext(),
      };
      if (safeEditIndex !== null) body.edit_index = safeEditIndex;
      const res = await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      const scheduleRender = () => {
        if (renderTimer) return;
        renderTimer = setTimeout(() => {
          div.innerHTML = this.renderMarkdown(content, true);
          this.highlight(div);
          this.scrollToBottom();
          renderTimer = null;
        }, 30);
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
            } else if (parsed.error) throw new Error(parsed.error);
          } catch (e) {
            if (e.message !== "Unexpected end of JSON input") console.error("Parse error:", e);
          }
        }
      }
      if (renderTimer) clearTimeout(renderTimer);
      div.innerHTML = this.renderMarkdown(content, false);
      this.finalizeAssistantMessage(group);
      this.scrollToBottom();
      this.messages.push({ role: "assistant", content });
    } catch (e) {
      thinking.remove();
      clear();
      const errorHtml =
        e.name === "AbortError"
          ? "<p>Generation stopped.</p>"
          : "<p>Sorry, I encountered an error. Please try again. If the problem persists, please <a href='https://github.com/ultralytics/llm/issues/new?template=bug-report.yml' target='_blank' rel='noopener noreferrer'>submit a bug report</a>.</p>";
      const msg = this.el("div", "ult-message assistant", errorHtml);
      group.appendChild(msg);
      console.error("Chat error:", e);
    } finally {
      this.isStreaming = false;
      this.abortController = null;
      this.updateComposerState();
      for (const el of this.qsa(".ult-message[contenteditable]", this.refs.messages)) {
        el.contentEditable = "true";
      }
      this.refs.input?.focus();
    }
  }

  createMessageGroup(role, messageIndex = null) {
    if (!this.refs.messages) return null;
    const { name, logomark } = this.config.branding;
    const group = this.el("div", "ult-message-group");
    group.dataset.role = role;
    if (messageIndex !== null) group.dataset.messageIndex = messageIndex;
    const label = this.el(
      "div",
      "ult-message-label",
      role === "assistant"
        ? `<img src="${this.esc(logomark)}" alt="${this.esc(name)}" /><span>${this.esc(name)}</span>`
        : `<span class="ult-user-icon"><svg width="29" height="29" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg></span><span>You</span>`,
    );
    group.appendChild(label);
    this.refs.messages.appendChild(group);
    this.scrollToBottom();
    return group;
  }

  addMessageToUI(role, content, messageIndex = null) {
    const group = this.createMessageGroup(role, messageIndex);
    if (!group) return null;
    const div = this.el("div", `ult-message ${role === "assistant" ? "assistant" : ""}`, this.renderMarkdown(content));
    if (role === "user") {
      div.contentEditable = "true";
      div.dataset.originalContent = content;
      div.setAttribute("role", "textbox");
      div.setAttribute("aria-label", "Edit your message");
      div.setAttribute("aria-multiline", "true");
      if (this.isStreaming) div.contentEditable = "false";
    }
    group.appendChild(div);
    if (role === "assistant") this.finalizeAssistantMessage(group);
    else this.addUserMessageActions(group);
    return div;
  }

  addMessageActions(group) {
    if (group.querySelector(".ult-message-actions")) return;
    const actions = this.el(
      "div",
      "ult-message-actions",
      `<button class="ult-icon-btn" data-action="copy" aria-label="Copy response" data-tooltip="Copy response">${this.icon("copy")}</button><button class="ult-icon-btn" data-action="like" aria-label="Good response" data-tooltip="Good response">${this.icon("like")}</button><button class="ult-icon-btn" data-action="dislike" aria-label="Bad response" data-tooltip="Bad response">${this.icon("dislike")}</button><button class="ult-icon-btn" data-action="retry" aria-label="Try again" data-tooltip="Try again">${this.icon("refresh")}</button>`,
    );
    group.appendChild(actions);
  }

  addUserMessageActions(group) {
    if (group.querySelector(".ult-user-message-actions")) return;
    const actions = this.el(
      "div",
      "ult-user-message-actions",
      `<button class="ult-chat-send ult-chat-edit-btn" data-action="edit" aria-label="Edit and restart" data-tooltip="Edit and restart"><span class="ult-icon-swap" data-icon="arrowUp">${this.icon("arrowUp")}</span></button>`,
    );
    group.appendChild(actions);
  }

  finalizeAssistantMessage(group) {
    if (!group || group.dataset.role !== "assistant") return;
    const messageDiv = group.querySelector(".ult-message.assistant");
    if (messageDiv) this.highlight(messageDiv);
    this.addMessageActions(group);
  }

  escapeHtml(text) {
    const d = this.el("div");
    d.textContent = text;
    return d.innerHTML;
  }

  renderMarkdown(src, skipCopyButtons = false) {
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
      codeIndent = 0,
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
      const fence = raw.match(/^\s*```(\w+)?\s*$/);
      if (fence) {
        if (inCode) {
          html += skipCopyButtons
            ? "</code></pre></div>"
            : `</code></pre><button class="ult-code-copy" aria-label="Copy code" data-tooltip="Copy code">${this.icon("copy")}</button></div>`;
          inCode = false;
          codeIndent = 0;
        } else {
          closePara();
          closeList();
          closeQuote();
          inCode = true;
          codeIndent = raw.search(/\S/);
          html += `<div class="ult-code-block"><pre><code class="lang-${esc(fence[1] || "")}">`;
        }
        continue;
      }
      if (inCode) {
        const stripped = raw.slice(codeIndent);
        html += `${esc(stripped)}\n`;
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
      const unorderedListMatch = raw.match(/^\s*([-*+])\s+(.+)$/);
      if (unorderedListMatch) {
        if (!listOpen || listType !== "ul") {
          closePara();
          closeList();
          html += "<ul>";
          listOpen = true;
          listType = "ul";
        }
        html += `<li>${this.renderInline(unorderedListMatch[2])}</li>`;
        continue;
      }
      const orderedListMatch = raw.match(/^\s*(\d+)\.\s+(.+)$/);
      if (orderedListMatch) {
        if (!listOpen || listType !== "ol") {
          closePara();
          closeList();
          html += "<ol>";
          listOpen = true;
          listType = "ol";
        }
        html += `<li>${this.renderInline(orderedListMatch[2])}</li>`;
        continue;
      }
      if (/^\s*$/.test(raw)) {
        closePara();
        closeList();
        closeQuote();
        continue;
      }
      const h3Match = raw.match(/^###\s+(.+)$/);
      if (h3Match) {
        closePara();
        closeList();
        closeQuote();
        html += `<h3>${this.renderInline(h3Match[1])}</h3>`;
        continue;
      }
      const h2Match = raw.match(/^##\s+(.+)$/);
      if (h2Match) {
        closePara();
        closeList();
        closeQuote();
        html += `<h2>${this.renderInline(h2Match[1])}</h2>`;
        continue;
      }
      const h1Match = raw.match(/^#\s+(.+)$/);
      if (h1Match) {
        closePara();
        closeList();
        closeQuote();
        html += `<h1>${this.renderInline(h1Match[1])}</h1>`;
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
    const codeBlocks = [];
    text = text.replace(/`([^`]+)`/g, (_match, code) => {
      codeBlocks.push(code);
      return `@@ULTCODE${codeBlocks.length - 1}@@`;
    });
    text = text.replace(
      /\[([^\]]+)]\((https?:\/\/[^\s)]+)\)/g,
      (_, label, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`,
    );
    text = text.replace(
      /(?<!href=")(?<!src=")(?<!>)\b(https?:\/\/[^\s<>'")\]]+?)(?=[.,;:!?]*(?:\s|<|'|"|\)|]|$))/g,
      (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
    );
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");
    text = text.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, "<em>$1</em>");
    text = text.replace(/(?<!_)_(?!_)(.+?)_(?!_)/g, "<em>$1</em>");
    text = text.replace(/@@ULTCODE(\d+)@@/g, (_match, idx) => `<code>${codeBlocks[idx]}</code>`);
    return text.replace(/ {2}\n/g, "<br>");
  }
}

// Export to globalThis for compatibility with module bundlers and various JS environments
if (typeof globalThis !== "undefined" && !globalThis.UltralyticsChat) {
  globalThis.UltralyticsChat = UltralyticsChat;
}
