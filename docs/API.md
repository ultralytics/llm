# API Reference

Ultralytics LLM ships with a zero-dependency JavaScript widget and a Python package that will grow into our backend SDK. This document captures the public surface area of both components plus the HTTP contracts the widget expects.

## JavaScript API

### `UltralyticsChat` Class

#### Constructor

```javascript
const chat = new UltralyticsChat(config);
```

Creates a new widget instance. The constructor immediately injects the floating pill, modal, backdrop, tooltip, and global styles.

#### Configuration

All fields are optional—sane defaults are applied whenever a value is omitted.

```javascript
const chat = new UltralyticsChat({
    apiUrl: "https://chat-885297101091.us-central1.run.app/api/chat", // SSE endpoint
    maxMessageLength: 10000, // Character cap enforced before sending

    branding: {
        name: "Ultralytics AI",
        tagline: "Ask anything about Ultralytics, YOLO, and more",
        logo: "https://cdn.../Ultralytics%20Logo.png.svg",
        logomark: "https://storage.googleapis.com/.../botAvatar.svg",
        logoUrl: "https://www.ultralytics.com",
        pillText: "Ask AI",
    },

    theme: {
        primary: "#042AFF",
        dark: "#111F68",
        accent: "#E1FF25", // falls back to theme.yellow for compatibility
        text: "#0b0b0f",
    },

    welcome: {
        title: "Hello 👋",
        message: "I'm an AI assistant trained on Ultralytics documentation - ask me anything!",
        chatExamples: [
            "What's new in YOLO11?",
            "How do I get started with YOLO?",
            "Tell me about Enterprise Licensing",
        ],
        searchExamples: ["YOLO quickstart", "model training parameters", "export formats", "dataset configuration"],
    },

    ui: {
        placeholder: "Ask anything…",
        copyText: "Copy thread",
        downloadText: "Download thread",
        clearText: "New chat",
    },
});
```

> `welcome.examples` is still supported as a fallback but the widget now differentiates between `chatExamples` and `searchExamples`.

The widget automatically snapshots the current page (`title`, `url`, `description`, and `path`) and forwards it to the backend as `context` on every chat request.

#### Methods

- `toggle(forceOpen = null, mode = null)`  
  Opens/closes the widget programmatically. Pass `"chat"` or `"search"` for the `mode` argument to choose which interface to render when opening.

- `sendMessage(text, isNew = true, editIndex = null)`  
  Sends a prompt to the chat endpoint. While streaming, all editable user bubbles are locked and you can call `abortController.abort()` via the Stop button. When `mode === "search"` this method automatically forwards the query to `/search` instead of the SSE endpoint.

- `clearSession()`  
  Clears the in-memory conversation, removes `localStorage["ult-chat-session"]`, resets UI state, and focuses the composer.

- `setExamples(list)`  
  Replaces the welcome-example buttons with a new array of strings. Useful when the host site wants to control onboarding hints dynamically.

- `destroy()`  
  Tears down the widget, removes injected DOM, and detaches listeners. Call this before unmounting if you embed the widget into SPA routes.

Other helper methods (`copyThread`, `retryLast`, etc.) are exposed on the class and can be called if needed, but the list above represents the stable external surface.

#### Properties

```javascript
chat.isOpen; // boolean - modal state
chat.isStreaming; // boolean - actively receiving SSE chunks
chat.mode; // "chat" | "search"
chat.messages; // Array<{ role: "user" | "assistant", content: string }>
chat.sessionId; // string|null - persisted session identifier
```

#### Keyboard & Accessibility

- `Cmd/Ctrl + K` toggles the widget.
- `Esc` closes it.
- `Enter` sends a message when not holding `Shift`.
- `Shift + Enter` inserts a newline.
- Buttons expose ARIA labels, and interactive elements are reachable via keyboard navigation. The layout respects reduced motion, prefers-color-scheme, safe areas, and screen reader semantics.

### Backend Contracts

#### `POST /api/chat`

```http
POST /api/chat
Content-Type: application/json
```

Request body:

```json
{
    "messages": [
        {
            "role": "user",
            "content": "What is YOLO11?"
        }
    ],
    "session_id": "optional-session-id",
    "context": {
        "url": "https://docs.ultralytics.com/models/yolov9/",
        "title": "YOLOv9: A Leap Forward in Object Detection Technology",
        "description": "Meta description value",
        "path": "/models/yolov9/"
    },
    "edit_index": 4
}
```

Response headers:

- `Content-Type: text/event-stream`
- `X-Session-ID: session-uuid` (save this for follow-up turns)

Response stream (SSE):

```
data: {"content": "You're on the Ultralytics docs page: "}
data: {"content": "\"YOLOv9: A Leap Forward in Object Detection Technology\" — "}
data: {"content": "URL: https://docs.ultralytics.com/models/yolov9/"}
data: [DONE]
```

Errors should be emitted as `data: {"error": "...message..."}` so the widget can present a friendly fallback bubble.

#### `POST /api/search`

When the widget is switched into search mode (`chat.toggle(true, "search")` or via the UI tabs) it derives the search URL by swapping `/chat` for `/search` on `apiUrl`.

```json
{
    "query": "YOLO training parameters"
}
```

Response:

```json
{
    "results": [
        {
            "title": "Training Configuration",
            "url": "https://docs.ultralytics.com/usage/training/",
            "text": "Step-by-step instructions for configuring Ultralytics training jobs…",
            "score": 0.95
        }
    ]
}
```

### Session Lifecycle

1. The first outbound message omits `session_id`.
2. The backend returns `X-Session-ID`.
3. The widget caches that value in `localStorage["ult-chat-session"]`.
4. All subsequent chat calls send the cached ID until `clearSession()` or a user-triggered thread reset.

### Security

All inbound and outbound text runs through HTML escaping prior to markdown rendering. Code blocks receive optional copy buttons, and links are forced to open in a new tab with `rel="noopener noreferrer"`. To keep CSP strict, serve `chat.min.js` from jsDelivr or host it yourself and allowlist the domain in `script-src`.

### Browser Support

- Chrome / Edge 90+
- Safari 14+
- Firefox 88+
- iOS Safari / Chrome
- Android Chrome / Samsung Internet / Firefox

## Python API

### Installation

```bash
pip install ultralytics-llm
```

### `LLMClient` Class (preview)

```python
from ultralytics_llm import LLMClient

client = LLMClient(api_key="your-api-key", api_url="https://api.ultralytics.com")

try:
    response = client.chat("What's new in YOLO11?")
except NotImplementedError:
    print("Python SDK functionality is coming soon.")
```

- `api_key` – Authentication token to use when backend helpers land.
- `api_url` – Override if you host your own bridge.
- `.chat(message: str)` – Placeholder that will expose streaming helpers in a future release. It currently raises `NotImplementedError`.

The package also exposes `ultralytics_llm.__version__` so you can pin features per deployment.

## Error Handling

### JavaScript

```javascript
try {
    await chat.sendMessage("test");
} catch (err) {
    console.error("Chat error:", err);
}
```

The widget already wraps network failures and displays a friendly bubble, but catching the promise lets you plug in custom telemetry.

### Python

```python
try:
    response = client.chat("test")
except NotImplementedError:
    # Current release is a stub
    pass
except Exception as exc:
    print(f"Unexpected error: {exc}")
```

## Examples

- [`examples/web/demo.html`](../examples/web/demo.html) – Browser integration demo.
- [`examples/web/demo`](../examples/web/demo) – Demo deployed on Vercel (see README badge).

For UI assets and release notes refer back to [`README.md`](../README.md).
