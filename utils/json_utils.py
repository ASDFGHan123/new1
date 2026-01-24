"""
Utility functions for JSON serialization of non-standard types like UUIDs.
"""
import uuid
from decimal import Decimal
from datetime import datetime, date


def serialize_for_json(obj):
    """Convert non-JSON-serializable objects to JSON-serializable format."""
    if isinstance(obj, uuid.UUID):
        return str(obj)
    elif isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, (datetime, date)):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {k: serialize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [serialize_for_json(item) for item in obj]
    return obj


def prepare_metadata(data):
    """Prepare metadata dictionary for JSONField storage."""
    if not isinstance(data, dict):
        return data
    return serialize_for_json(data)
