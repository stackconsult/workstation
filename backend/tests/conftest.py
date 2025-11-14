"""
Test configuration
"""
import pytest
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


@pytest.fixture
def mock_settings():
    """Mock settings for testing"""
    return {
        'database_url': 'sqlite:///:memory:',
        'debug': True,
        'log_level': 'DEBUG'
    }
