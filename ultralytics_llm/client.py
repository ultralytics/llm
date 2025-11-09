# Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license
"""Ultralytics LLM Client - Python interface for LLM interactions."""


class LLMClient:
    """Python client for interacting with LLM APIs."""

    def __init__(self, api_key: str, api_url: str = "https://api.ultralytics.com"):
        """Initialize LLM client.

        Args:
            api_key: API key for authentication
            api_url: Base URL for API endpoints
        """
        self.api_key = api_key
        self.api_url = api_url

    def chat(self, message: str) -> str:
        """Send a chat message and receive a response.

        Args:
            message: User message to send

        Returns:
            Assistant response text
        """
        # TODO: Implement chat functionality
        raise NotImplementedError("Python LLM client coming soon!")
