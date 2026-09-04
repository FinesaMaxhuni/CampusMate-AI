import json
from datetime import datetime, timezone
from pathlib import Path


HISTORY_FILE = Path(__file__).resolve().parent.parent / "data" / "history.json"


def load_history():
	"""Load history records, recovering safely from missing or malformed JSON."""
	try:
		if not HISTORY_FILE.exists() or HISTORY_FILE.stat().st_size == 0:
			save_history([])
			return []
		with HISTORY_FILE.open("r", encoding="utf-8") as file:
			data = json.load(file)
		if isinstance(data, dict):
			data = data.get("history", [])
		return data if isinstance(data, list) else []
	except (OSError, json.JSONDecodeError, TypeError):
		return []


def save_history(history):
	"""Persist history records and create the data directory when needed."""
	HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
	temporary_file = HISTORY_FILE.with_suffix(".tmp")
	with temporary_file.open("w", encoding="utf-8") as file:
		json.dump(history if isinstance(history, list) else [], file, indent=2, ensure_ascii=False)
	temporary_file.replace(HISTORY_FILE)


def add_history_entry(entry):
	"""Append one record with a UTC timestamp and return it."""
	history = load_history()
	record = dict(entry)
	record.setdefault("timestamp", datetime.now(timezone.utc).isoformat())
	history.append(record)
	save_history(history)
	return record


def get_history():
	return load_history()
