<a href="https://www.ultralytics.com/"><img src="https://raw.githubusercontent.com/ultralytics/assets/main/logo/Ultralytics_Logotype_Original.svg" width="320" alt="Ultralytics logo"></a>

# 🚀 Ultralytics LLM

**Ultralytics LLM** is a comprehensive toolkit for integrating Large Language Models into your applications. It provides both JavaScript and Python clients for building AI-powered chat interfaces, assistants, and LLM-driven workflows.

[![CI](https://github.com/ultralytics/llm/actions/workflows/ci.yml/badge.svg)](https://github.com/ultralytics/llm/actions/workflows/ci.yml)
[![Ultralytics Actions](https://github.com/ultralytics/llm/actions/workflows/format.yml/badge.svg)](https://github.com/ultralytics/llm/actions/workflows/format.yml)
[![codecov](https://codecov.io/gh/ultralytics/llm/graph/badge.svg?token=CODECOV_TOKEN)](https://codecov.io/gh/ultralytics/llm)
[![jsDelivr hits](https://data.jsdelivr.com/v1/package/gh/ultralytics/llm/badge)](https://www.jsdelivr.com/package/gh/ultralytics/llm)

[![Ultralytics Discord](https://img.shields.io/discord/1089800235347353640?logo=discord&logoColor=white&label=Discord&color=blue)](https://discord.com/invite/ultralytics)
[![Ultralytics Forums](https://img.shields.io/discourse/users?server=https%3A%2F%2Fcommunity.ultralytics.com&logo=discourse&label=Forums&color=blue)](https://community.ultralytics.com/)
[![Ultralytics Reddit](https://img.shields.io/reddit/subreddit-subscribers/ultralytics?style=flat&logo=reddit&logoColor=white&label=Reddit&color=blue)](https://reddit.com/r/ultralytics)

## 📦 Installation

### JavaScript (Browser)

Load the chat widget via [jsDelivr CDN](https://www.jsdelivr.com/package/gh/ultralytics/llm):

```html
<!-- Latest version -->
<script src="https://cdn.jsdelivr.net/gh/ultralytics/llm@latest/js/chat.min.js"></script>

<!-- Specific version (recommended for production) -->
<script src="https://cdn.jsdelivr.net/gh/ultralytics/llm@1.0.0/js/chat.min.js"></script>
```

**CDN Options:**

- 🔍 **Browse files**: [jsdelivr.com/package/gh/ultralytics/llm](https://www.jsdelivr.com/package/gh/ultralytics/llm)
- 📊 **View stats**: Check download counts and version usage
- 🔗 **Direct link**: `https://cdn.jsdelivr.net/gh/ultralytics/llm@latest/js/chat.min.js`

### Python

```bash
pip install ultralytics-llm
```

## 🎯 Quick Start

### JavaScript Chat Widget

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Ultralytics Chat</title>
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

### Python LLM Client

```python
from ultralytics_llm import LLMClient

# Coming soon - Python LLM client
client = LLMClient(api_key="your-api-key")
response = client.chat("Tell me about YOLO11")
print(response)
```

## 🎨 JavaScript Chat Widget Features

- **🎯 Zero Dependencies**: Standalone vanilla JavaScript, no frameworks required
- **🌗 Dark Mode**: Automatic theme switching based on system preferences
- **📱 Responsive**: Works seamlessly on desktop and mobile
- **⚡ Streaming**: Real-time response streaming
- **🔍 Search Mode**: Built-in documentation search
- **💾 Session Management**: Persistent conversation history
- **♿ Accessible**: WCAG compliant with ARIA labels
- **🎨 Customizable**: Full theme and branding control

## ⚙️ Configuration Options

### JavaScript Widget

```javascript
const chat = new UltralyticsChat({
  // API Configuration
  apiUrl: "/api/chat", // Your chat API endpoint

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

## 📚 Examples

- **[Basic Chat](examples/js/chat.html)**: Simple chat widget integration
- **[Python Client](examples/python/basic.py)**: Python LLM client usage (coming soon)

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

## 🌟 Features Roadmap

### JavaScript

- [x] Chat widget with streaming
- [x] Dark mode support
- [x] Search mode
- [x] Session persistence
- [ ] File uploads
- [ ] Voice input
- [ ] Multi-language support

### Python

- [ ] LLM client
- [ ] Async support
- [ ] Streaming responses
- [ ] Tool/function calling
- [ ] RAG integration
- [ ] Vector database connectors

## 📖 Documentation

For comprehensive documentation and usage guides, visit [docs.ultralytics.com/llm](https://docs.ultralytics.com).

## 💡 Contribute

Ultralytics thrives on community collaboration, and we deeply value your contributions! Whether it's reporting bugs, suggesting features, or submitting code changes, your involvement is crucial.

- **Reporting Issues**: Encounter a bug? Please report it on [GitHub Issues](https://github.com/ultralytics/llm/issues).
- **Feature Requests**: Have an idea for improvement? Share it via [GitHub Issues](https://github.com/ultralytics/llm/issues).
- **Pull Requests**: Want to contribute code? Please read our [Contributing Guide](https://docs.ultralytics.com/help/contributing/) first, then submit a Pull Request.
- **Feedback**: Share your thoughts and experiences by participating in our official [Survey](https://www.ultralytics.com/survey?utm_source=github&utm_medium=social&utm_campaign=Survey).

A heartfelt thank you 🙏 goes out to all our contributors! Your efforts help make Ultralytics tools better for everyone.

[![Ultralytics open-source contributors](https://raw.githubusercontent.com/ultralytics/assets/main/im/image-contributors.png)](https://github.com/ultralytics/ultralytics/graphs/contributors)

## 📄 License

Ultralytics offers two licensing options to accommodate diverse needs:

- **AGPL-3.0 License**: Ideal for students, researchers, and enthusiasts passionate about open collaboration and knowledge sharing. This [OSI-approved](https://opensource.org/license/agpl-v3) open-source license promotes transparency and community involvement. See the [LICENSE](LICENSE) file for details.
- **Enterprise License**: Designed for commercial applications, this license permits the seamless integration of Ultralytics software and AI models into commercial products and services, bypassing the copyleft requirements of AGPL-3.0. For commercial use cases, please inquire about an [Ultralytics Enterprise License](https://www.ultralytics.com/license).

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
