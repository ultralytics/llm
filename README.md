<a href="https://www.ultralytics.com/"><img src="https://raw.githubusercontent.com/ultralytics/assets/main/logo/Ultralytics_Logotype_Original.svg" width="320" alt="Ultralytics logo"></a>

# 🚀 Ultralytics LLM

**Ultralytics LLM** provides a lightweight, production-ready JavaScript chat client for integrating AI-powered conversations into web applications. Built for [jsDelivr CDN](https://www.jsdelivr.com/package/gh/ultralytics/llm) delivery with zero dependencies.

[![CI](https://github.com/ultralytics/llm/actions/workflows/ci.yml/badge.svg)](https://github.com/ultralytics/llm/actions/workflows/ci.yml)
[![Ultralytics Actions](https://github.com/ultralytics/llm/actions/workflows/format.yml/badge.svg)](https://github.com/ultralytics/llm/actions/workflows/format.yml)
[![codecov](https://codecov.io/gh/ultralytics/llm/graph/badge.svg?token=CODECOV_TOKEN)](https://codecov.io/gh/ultralytics/llm)
[![Vercel Deploy](https://deploy-badge.vercel.app/vercel/chatjs-ultralytics?root=examples%2Fweb%2Fdemo)](https://chatjs-ultralytics.vercel.app/examples/web/demo)
[![jsDelivr hits](https://data.jsdelivr.com/v1/package/gh/ultralytics/llm/badge?style=rounded)](https://www.jsdelivr.com/package/gh/ultralytics/llm)

[![Ultralytics Discord](https://img.shields.io/discord/1089800235347353640?logo=discord&logoColor=white&label=Discord&color=blue)](https://discord.com/invite/ultralytics)
[![Ultralytics Forums](https://img.shields.io/discourse/users?server=https%3A%2F%2Fcommunity.ultralytics.com&logo=discourse&label=Forums&color=blue)](https://community.ultralytics.com/)
[![Ultralytics Reddit](https://img.shields.io/reddit/subreddit-subscribers/ultralytics?style=flat&logo=reddit&logoColor=white&label=Reddit&color=blue)](https://reddit.com/r/ultralytics)

![Ultralytics Chat Window](https://github.com/user-attachments/assets/a5e02018-b0df-4366-939d-402bbbd234f2)

## 🎯 Current Status

> **⚠️ Experimental Development**: The chat widget ships as a CDN-ready `chat.min.js` bundle and as part of the `ultralytics-llm` Python package published on PyPI. Track tagged releases for production deployments and reserve `@main` for testing nightly changes.
>
> **Ecosystem:** This repo hosts both the in-browser chat widget and the Python scaffolding we use for backend workflows. The widget is production ready, while the Python client remains a lightweight placeholder until the managed API is released.

## 📦 Installation

### JavaScript (Browser)

Load the chat widget via [jsDelivr CDN](https://www.jsdelivr.com/package/gh/ultralytics/llm):

```html
<!-- Latest stable release (recommended for production) -->
<script src="https://cdn.jsdelivr.net/gh/ultralytics/llm@latest/js/chat.min.js"></script>

<!-- Specific version (guaranteed stability) -->
<script src="https://cdn.jsdelivr.net/gh/ultralytics/llm@v0.0.2/js/chat.min.js"></script>

<!-- Main branch (experimental, for testing) -->
<script src="https://cdn.jsdelivr.net/gh/ultralytics/llm@main/js/chat.min.js"></script>
```

**CDN Links:**

- 🔍 **Browse files**: [jsdelivr.com/package/gh/ultralytics/llm](https://www.jsdelivr.com/package/gh/ultralytics/llm)
- 📊 **View stats**: Check download counts and version usage
- 🏷️ **Latest release**: `https://cdn.jsdelivr.net/gh/ultralytics/llm@latest/js/chat.min.js`
- 🔬 **Main branch**: `https://cdn.jsdelivr.net/gh/ultralytics/llm@main/js/chat.min.js`

**Versioning Strategy:**

- `@latest` - Always points to the newest tagged release (cache purged on new releases)
- `@v0.0.1` - Specific version tags (permanent cache, high reliability)
- `@main` - Latest development code (12-hour cache, auto-purged on push)

> **Note**: For production, use `@latest` or pin to a specific version tag. The `@main` branch is for testing and may contain breaking changes.

## 🎯 Quick Start

![Ultralytics Chat Pill](https://github.com/user-attachments/assets/c160e901-9851-456e-8fef-0632ce546c2e)

### JavaScript Chat Widget

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Ultralytics Chat</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  </head>
  <body>
    <script src="https://cdn.jsdelivr.net/gh/ultralytics/llm@latest/js/chat.min.js"></script>
    <script>
      const chat = new UltralyticsChat({
        apiUrl: "https://your-api-endpoint.com/api/chat",
        branding: {
          name: "My AI Assistant",
          tagline: "Ask me anything!",
          pillText: "Chat with AI",
        },
        theme: {
          primary: "#042AFF",
          yellow: "#E1FF25",
        },
      });
    </script>
  </body>
</html>
```

## 🎨 JavaScript Chat Features

- **🎯 Zero Dependencies**: Standalone vanilla JavaScript (~1000 lines), no frameworks required
- **📱 Mobile Optimized**: Full iOS & Android support with orientation handling, safe area insets, and back button integration
- **🌗 Dark Mode**: Automatic theme switching based on system preferences
- **💻 Responsive**: Desktop modal and mobile full-screen layouts (WebKit, Blink, Gecko)
- **⚡ Streaming**: Real-time SSE response streaming with abort support
- **🔍 Search Mode**: Built-in documentation search capability
- **💾 Session Management**: Persistent conversation history via localStorage
- **♿ Accessible**: WCAG compliant with ARIA labels and keyboard navigation
- **🎨 Customizable**: Full theme and branding control
- **🔒 Security**: XSS protection with HTML escaping, input length limits

## ⚙️ Configuration Options

### JavaScript Widget

```javascript
const chat = new UltralyticsChat({
  // API Configuration
  apiUrl: "/api/chat", // Chat endpoint that streams SSE
  maxMessageLength: 10000, // Character limit enforced per user message

  // Branding
  branding: {
    name: "AI Assistant", // Assistant name
    tagline: "How can I help?", // Tagline text
    logo: "https://...", // Header logo URL
    logomark: "https://...", // Pill button logo URL
    logoUrl: "https://example.com", // Link when header logo is clicked
    pillText: "Ask AI", // Pill button text
  },

  // Theme Colors
  theme: {
    primary: "#042AFF", // Primary brand color
    dark: "#111F68", // Dark theme accent
    accent: "#E1FF25", // Highlight color (falls back to theme.yellow)
    text: "#0b0b0f", // Text color
  },

  // Welcome Message
  welcome: {
    title: "Hi!",
    message: "How can I help you today?",
    chatExamples: ["What is YOLO11?", "How do I train a model?"],
    searchExamples: ["YOLO quickstart", "model training parameters"],
  },

  // UI Text
  ui: {
    placeholder: "Ask anything…",
    copyText: "Copy thread",
    downloadText: "Download thread",
    clearText: "New chat",
  },
});
```

`UltralyticsChat` automatically injects document context (title, URL, description, path) into each request so your backend can provide page-aware responses without extra work on the integrator side.

### API Requirements

Your backend should implement:

```
POST /api/chat
Content-Type: application/json

{
  "messages": [{"role": "user", "content": "Hello"}],
  "session_id": "optional-session-id",
  "context": {
    "url": "https://example.com/docs/widget",
    "title": "Docs page title",
    "description": "Meta description text",
    "path": "/docs/widget"
  },
  "edit_index": 3 // optional when user edits a previous turn
}

Response: Server-Sent Events (SSE)
data: {"content": "Hello! "}
data: {"content": "How can "}
data: {"content": "I help?"}
data: [DONE]

Headers:
X-Session-ID: session-uuid (for persistence)
Content-Type: text/event-stream
```

When the widget is switched to **Search** mode it will call the same base URL with `/search` replacing `/chat` via `POST /api/search` and expects a JSON body `{ "results": [{ title, url, text, score }] }`.

## 📱 Mobile Support

### iOS (Safari, Chrome, Firefox)

- ✅ Safe area insets for notched devices
- ✅ Keyboard handling with auto-resize
- ✅ Home indicator padding
- ✅ Smooth scrolling optimization

### Android (Chrome, Samsung Internet, Firefox)

- ✅ Back button integration (History API)
- ✅ Dynamic viewport height (address bar handling)
- ✅ Touch action optimization
- ✅ Gesture navigation support
- ✅ Split-screen and multi-window modes

### Cross-Platform

- ✅ Portrait/landscape orientation changes
- ✅ Full-screen mobile modal (no horizontal scroll)
- ✅ Background scroll lock when open
- ✅ Keyboard shortcuts (desktop: Cmd/Ctrl+K, ESC)

## 🔧 Development

### Build Minified Version

```bash
npm install -g terser
terser js/chat.js -o js/chat.min.js -c -m
```

### Local Testing

```bash
# Serve examples locally
python -m http.server 8000
# Open http://localhost:8000/examples/web/demo.html
```

### Browser Compatibility

Tested and working on:

- ✅ Chrome/Edge 90+ (Blink)
- ✅ Safari 14+ (WebKit)
- ✅ Firefox 88+ (Gecko)
- ✅ Mobile Safari (iOS 12+)
- ✅ Chrome Mobile (Android 8+)
- ✅ Samsung Internet (Android 8+)

## 🌟 Roadmap

### JavaScript Client (Current Focus)

- [x] Chat widget with streaming
- [x] Dark mode support
- [x] Search mode
- [x] Session persistence
- [x] Production-ready security & performance
- [x] Full mobile support (iOS & Android)
- [ ] File upload support
- [ ] Voice input
- [ ] Multi-language support
- [ ] Official v1.0.0 release

### Python Backend (Coming Soon)

We plan to open-source our Python components once mature:

- [ ] `LLMClient` class for Claude/OpenAI/etc.
- [ ] FastAPI server implementation
- [ ] Async streaming support
- [ ] Tool/function calling
- [ ] RAG integration with vector databases
- [ ] Session management utilities
- [ ] Rate limiting & caching

## 📖 Documentation

- API reference for the widget and backend contracts: [`docs/API.md`](docs/API.md)
- Product announcements and tutorials: [docs.ultralytics.com](https://docs.ultralytics.com) (LLM section rolling out alongside SDK updates)

## 💡 Contribute

Ultralytics thrives on community collaboration! While this repo is currently experimental, we welcome:

- **Bug Reports**: Found an issue? Report it on [GitHub Issues](https://github.com/ultralytics/llm/issues)
- **Feature Requests**: Have an idea? Share it via [GitHub Issues](https://github.com/ultralytics/llm/issues)
- **Pull Requests**: Want to contribute? Please read our [Contributing Guide](https://docs.ultralytics.com/help/contributing/) first
- **Feedback**: Share your experience in our [Discord](https://discord.com/invite/ultralytics) or [Community Forums](https://community.ultralytics.com/)

A heartfelt thank you 🙏 to all our contributors!

[![Ultralytics open-source contributors](https://raw.githubusercontent.com/ultralytics/assets/main/im/image-contributors.png)](https://github.com/ultralytics/ultralytics/graphs/contributors)

## 📄 License

Ultralytics offers two licensing options:

- **AGPL-3.0 License**: Ideal for students, researchers, and enthusiasts passionate about open collaboration. This [OSI-approved](https://opensource.org/license/agpl-v3) open-source license promotes transparency and community involvement. See the [LICENSE](LICENSE) file for details.
- **Enterprise License**: For commercial applications, this license permits seamless integration of Ultralytics software into commercial products, bypassing AGPL-3.0 copyleft requirements. Inquire about an [Ultralytics Enterprise License](https://www.ultralytics.com/license).

## 📮 Contact

For bug reports or feature suggestions related to this repo or other Ultralytics projects, please use [GitHub Issues](https://github.com/ultralytics/llm/issues). For general questions, discussions, and community support, join our [Discord](https://discord.com/invite/ultralytics) server!

<br>
<div align="center">
  <a href="https://github.com/ultralytics"><img src="https://github.com/ultralytics/assets/raw/main/social/logo-social-github.png" width="3%" alt="Ultralytics GitHub"></a>
  <img src="https://github.com/ultralytics/assets/raw/main/social/logo-transparent.png" width="3%" alt="space">
  <a href="https://www.linkedin.com/company/ultralytics/"><img src="https://github.com/ultralytics/assets/raw/main/social/logo-social-linkedin.png" width="3%" alt="Ultralytics LinkedIn"></a>
  <img src="https://github.com/ultralytics/assets/raw/main/social/logo-transparent.png" width="3%" alt="space">
  <a href="https://twitter.com/ultralytics"><img src="https://github.com/ultralytics/assets/raw/main/social/logo-social-twitter.png" width="3%" alt="Ultralytics Twitter"></a>
  <img src="https://github.com/ultralytics/assets/raw/main/social/logo-transparent.png" width="3%" alt="space">
  <a href="https://youtube.com/ultralytics?sub_confirmation=1"><img src="https://github.com/ultralytics/assets/raw/main/social/logo-social-youtube.png" width="3%" alt="Ultralytics YouTube"></a>
  <img src="https://github.com/ultralytics/assets/raw/main/social/logo-transparent.png" width="3%" alt="space">
  <a href="https://www.tiktok.com/@ultralytics"><img src="https://github.com/ultralytics/assets/raw/main/social/logo-social-tiktok.png" width="3%" alt="Ultralytics TikTok"></a>
  <img src="https://github.com/ultralytics/assets/raw/main/social/logo-transparent.png" width="3%" alt="space">
  <a href="https://ultralytics.com/bilibili"><img src="https://github.com/ultralytics/assets/raw/main/social/logo-social-bilibili.png" width="3%" alt="Ultralytics BiliBili"></a>
  <img src="https://github.com/ultralytics/assets/raw/main/social/logo-transparent.png" width="3%" alt="space">
  <a href="https://discord.com/invite/ultralytics"><img src="https://github.com/ultralytics/assets/raw/main/social/logo-social-discord.png" width="3%" alt="Ultralytics Discord"></a>
</div>
