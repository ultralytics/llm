# Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license
"""Tests for Ultralytics LLM package."""

import pytest
from ultralytics_llm import LLMClient, __version__


def test_version():
    """Test package version."""
    assert isinstance(__version__, str)
    assert len(__version__.split(".")) >= 2


def test_client_init():
    """Test LLMClient initialization."""
    client = LLMClient(api_key="test-key", api_url="https://test.com")
    assert client.api_key == "test-key"
    assert client.api_url == "https://test.com"


def test_client_default_url():
    """Test LLMClient default URL."""
    client = LLMClient(api_key="test-key")
    assert client.api_url == "https://api.ultralytics.com"


def test_chat_not_implemented():
    """Test chat method raises NotImplementedError."""
    client = LLMClient(api_key="test-key")
    with pytest.raises(NotImplementedError):
        client.chat("test message")
