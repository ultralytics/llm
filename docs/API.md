# API Reference

Complete API reference for Ultralytics LLM toolkit.

## JavaScript API

### UltralyticsChat Class

#### Constructor

```javascript
new UltralyticsChat(config)
```

Creates a new chat widget instance.

**Parameters:**

- `config` (Object, optional) - Configuration object

**Config Options:**

```javascript
{
  // API Configuration
  apiUrl: string,                  // API endpoint (default: "/api/chat")
  
  // Branding
  branding: {
    name: string,                  // Assistant name (default: "AI")
    tagline: string,               // Header tagline
    logo: string,                  // URL to header logo
    logomark: string,              // URL to pill button logo
    pillText: string,              // Pill button text (default: "Ask AI")
  },
  
  // Theme Colors
  theme: {
    primary: string,               // Primary color (default: "#042AFF")
    dark: string,                  // Dark accent (default: "#111F68")
    yellow: string,                // Highlight color (default: "#E1FF25")
    text: string,                  // Text color (default: "#0b0b0f")
  },
  
  // Welcome Message
  welcome: {
    title: string,                 // Welcome title (default: "Hi!")
    message: string,               // Welcome message HTML
    examples: string[],            // Example questions
  },
  
  // UI Text
  ui: {
    placeholder: string,           // Input placeholder (default: "Ask anything…")
    copyText: string,              // Copy button text
    downloadText: string,          // Download button text
    clearText: string,             // Clear button text
  }
}
```

#### Methods

##### `toggle(forceOpen, mode)`

Toggle chat widget open/closed.

```javascript
chat.toggle()           // Toggle current state
chat.toggle(true)       // Force open
chat.toggle(false)      // Force close
chat.toggle(true, "search")  // Open in search mode
```

**Parameters:**
- `forceOpen` (boolean|null) - Force open (true), close (false), or toggle (null)
- `mode` (string|null) - Set mode: "chat" or "search"

##### `sendMessage(text)`

Send a message programmatically.

```javascript
chat.sendMessage("What is YOLO11?")
```

**Parameters:**
- `text` (string) - Message to send

##### `clearSession()`

Clear chat history and start new session.

```javascript
chat.clearSession()
```

##### `destroy()`

Clean up and remove chat widget.

```javascript
chat.destroy()
```

##### `setExamples(list)`

Update example questions.

```javascript
chat.setExamples([
  "How do I train a model?",
  "What formats can I export to?"
])
```

**Parameters:**
- `list` (string[]) - Array of example questions

#### Events

The widget uses keyboard shortcuts:

- `Cmd/Ctrl + K` - Open chat
- `Escape` - Close chat (when open)
- `Enter` - Send message
- `Shift + Enter` - New line in message

#### Properties

```javascript
chat.isOpen          // boolean - Is widget open
chat.isStreaming     // boolean - Is response streaming
chat.mode            // string - Current mode ("chat" or "search")
chat.messages        // Array - Message history
chat.sessionId       // string|null - Current session ID
```

## Python API

### LLMClient Class

#### Constructor

```python
from ultralytics_llm import LLMClient

client = LLMClient(
    api_key="your-api-key",
    api_url="https://api.ultralytics.com"  # optional
)
```

**Parameters:**

- `api_key` (str) - API key for authentication
- `api_url` (str, optional) - Base URL for API endpoints (default: "https://api.ultralytics.com")

#### Methods

##### `chat(message)`

Send a chat message and receive response.

```python
response = client.chat("What's new in YOLO11?")
print(response)
```

**Parameters:**
- `message` (str) - User message to send

**Returns:**
- `str` - Assistant response text

**Raises:**
- `NotImplementedError` - Currently not implemented (coming soon)

## API Endpoints

### Chat Endpoint

```
POST /api/chat
```

**Request:**

```json
{
  "messages": [
    {
      "role": "user",
      "content": "What is YOLO11?"
    }
  ],
  "session_id": "optional-session-id"
}
```

**Response (Streaming):**

Server-Sent Events (SSE) stream:

```
data: {"content": "YOLO"}
data: {"content": "11"}
data: {"content": " is"}
data: [DONE]
```

**Response Headers:**

- `X-Session-ID` - Session identifier for continuing conversations
- `Content-Type: text/event-stream`

### Search Endpoint

```
POST /api/search
```

**Request:**

```json
{
  "query": "YOLO training parameters"
}
```

**Response:**

```json
{
  "results": [
    {
      "title": "Training Configuration",
      "url": "https://...",
      "text": "Snippet of matching content...",
      "score": 0.95
    }
  ]
}
```

## Error Handling

### JavaScript

```javascript
try {
  await chat.sendMessage("test")
} catch (error) {
  console.error("Chat error:", error)
}
```

Errors are handled gracefully with user-friendly messages displayed in the chat.

### Python

```python
try:
    response = client.chat("test")
except NotImplementedError as e:
    print(f"Feature not available: {e}")
except Exception as e:
    print(f"Error: {e}")
```

## Session Management

Sessions are automatically managed:

1. First message creates new session
2. Session ID returned in `X-Session-ID` header
3. Session ID stored in localStorage
4. Subsequent messages use same session
5. Clear session with `clearSession()` or localStorage.removeItem("ult-chat-session")

## Security

### XSS Protection

All user content and API responses are sanitized:

```javascript
// HTML is escaped
const escaped = chat.escapeHtml(userInput)

// Markdown is safely rendered
const html = chat.renderMarkdown(content)
```

### Content Security Policy

The widget is compatible with CSP. Recommended headers:

```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  connect-src 'self' your-api-domain.com;
  img-src 'self' data: https:;
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## TypeScript (Coming Soon)

TypeScript definitions will be available in future releases.

```typescript
interface UltralyticsConfig {
  apiUrl?: string
  branding?: BrandingConfig
  theme?: ThemeConfig
  welcome?: WelcomeConfig
  ui?: UIConfig
}
```

## Examples

See the [examples](../examples) directory for complete working examples.
