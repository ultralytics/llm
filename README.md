<a href="https://www.ultralytics.com/"><img src="https://raw.githubusercontent.com/ultralytics/assets/main/logo/Ultralytics_Logotype_Original.svg" width="320" alt="Ultralytics logo"></a>

# 🚀 Ultralytics LLM

**Ultralytics LLM** provides a lightweight, production-ready JavaScript chat client for integrating AI-powered conversations into web applications. Built for [jsDelivr CDN](https://www.jsdelivr.com/package/gh/ultralytics/llm) delivery with zero dependencies.

[![CI](https://github.com/ultralytics/llm/actions/workflows/ci.yml/badge.svg)](https://github.com/ultralytics/llm/actions/workflows/ci.yml)
[![Ultralytics Actions](https://github.com/ultralytics/llm/actions/workflows/format.yml/badge.svg)](https://github.com/ultralytics/llm/actions/workflows/format.yml)
[![codecov](https://codecov.io/gh/ultralytics/llm/graph/badge.svg?token=CODECOV_TOKEN)](https://codecov.io/gh/ultralytics/llm)
[![Vercel Deploy](https://deploy-badge.vercel.app/vercel/llm-amber?root=examples%2Fweb%2Fdemo)](https://llm-amber.vercel.app/examples/web/demo)
[![jsDelivr hits](https://data.jsdelivr.com/v1/package/gh/ultralytics/llm/badge?style=rounded)](https://www.jsdelivr.com/package/gh/ultralytics/llm)

[![Ultralytics Discord](https://img.shields.io/discord/1089800235347353640?logo=discord&logoColor=white&label=Discord&color=blue)](https://discord.com/invite/ultralytics)
[![Ultralytics Forums](https://img.shields.io/discourse/users?server=https%3A%2F%2Fcommunity.ultralytics.com&logo=discourse&label=Forums&color=blue)](https://community.ultralytics.com/)
[![Ultralytics Reddit](https://img.shields.io/reddit/subreddit-subscribers/ultralytics?style=flat&logo=reddit&logoColor=white&label=Reddit&color=blue)](https://reddit.com/r/ultralytics)

<img width="960" height="544" alt="Ultralytics Chat Window" src="https://github.com/user-attachments/assets/359e1138-ca03-4d9a-a1da-a9c1018a4976" />

## 🎯 Current Status

> **⚠️ Experimental Development**: This repository currently contains our JavaScript chat client for Ultralytics experimentation and internal use. **No official releases yet** - the `main` branch is actively developed and may change without notice.
>
> **Coming Soon**: We plan to open-source additional components including our **Python backend `LLMClient`** class, FastAPI server implementation, and supporting utilities once they reach production maturity.

## 📦 Installation

### JavaScript (Browser)

Load the chat widget via [jsDelivr CDN](https://www.jsdelivr.com/package/gh/ultralytics/llm):

```html
<!-- Latest main branch (experimental, may change) -->
<script src="https://cdn.jsdelivr.net/gh/ultralytics/llm@main/js/chat.min.js"></script>

<!-- Specific commit (stable) -->
<script src="https://cdn.jsdelivr.net/gh/ultralytics/llm@COMMIT_HASH/js/chat.min.js"></script>
```

**CDN Links:**

- 🔍 **Browse files**: [jsdelivr.com/package/gh/ultralytics/llm](https://www.jsdelivr.com/package/gh/ultralytics/llm)
- 📊 **View stats**: Check download counts and version usage
- 🔗 **Main branch**: `https://cdn.jsdelivr.net/gh/ultralytics/llm@main/js/chat.min.js`

> **Note**: Until v1.0.0 release, we recommend pinning to specific commit hashes for production use to avoid breaking changes.

## 🎯 Quick Start

<img width="960" height="544" alt="Ultralytics Chat Pill" src="https://github.com/user-attachments/assets/ee59ed02-6888-4f59-9a8c-8a21eaee5a38" />

### JavaScript Chat Widget

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Ultralytics Chat</title>
  </head>
  <body>
    <script src="https://cdn.jsdelivr.net/gh/ultralytics/llm@main/js/chat.min.js"></script>
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

- **🎯 Zero Dependencies**: Standalone vanilla JavaScript (~900 lines), no frameworks required
- **🌗 Dark Mode**: Automatic theme switching based on system preferences
- **📱 Responsive**: Works seamlessly on desktop and mobile (WebKit, Blink, Gecko)
- **⚡ Streaming**: Real-time SSE response streaming with abort support
- **🔍 Search Mode**: Built-in documentation search capability
- **💾 Session Management**: Persistent conversation history via localStorage
- **♿ Accessible**: WCAG compliant with ARIA labels
- **🎨 Customizable**: Full theme and branding control
- **🔒 Security**: XSS protection with HTML escaping, input length limits

## ⚙️ Configuration Options

### JavaScript Widget

```javascript
const chat = new UltralyticsChat({
  // API Configuration
  apiUrl: "/api/chat", // Your chat API endpoint
  maxMessageLength: 10000, // Character limit per message

  // Branding
  branding: {
    name: "AI Assistant", // Assistant name
    tagline: "How can I help?", // Tagline text
    logo: "https://...", // Header logo URL
    logomark: "https://...", // Pill button logo URL
    pillText: "Ask AI", // Pill button text
  },

  // Theme Colors
  theme: {
    primary: "#042AFF", // Primary brand color
    dark: "#111F68", // Dark theme accent
    yellow: "#E1FF25", // Highlight color
    text: "#0b0b0f", // Text color
  },

  // Welcome Message
  welcome: {
    title: "Hi!",
    message: "How can I help you today?",
    examples: ["What is YOLO11?", "How do I train a model?"],
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

### API Requirements

Your backend should implement:

```
POST /api/chat
Content-Type: application/json

{
  "messages": [{"role": "user", "content": "Hello"}],
  "session_id": "optional-session-id"
}

Response: Server-Sent Events (SSE)
data: {"content": "Hello! "}
data: {"content": "How can "}
data: {"content": "I help?"}
data: [DONE]

Headers:
X-Session-ID: session-uuid (for persistence)
```

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
# Open http://localhost:8000/examples/js/chat.html
```

### Browser Compatibility

Tested and working on:

- ✅ Chrome/Edge 90+ (Blink)
- ✅ Safari 14+ (WebKit)
- ✅ Firefox 88+ (Gecko)
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 5+)

## 🌟 Roadmap

### JavaScript Client (Current Focus)

- [x] Chat widget with streaming
- [x] Dark mode support
- [x] Search mode
- [x] Session persistence
- [x] Production-ready security & performance
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

For comprehensive documentation and usage guides, visit [docs.ultralytics.com/llm](https://docs.ultralytics.com) (coming soon).

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
