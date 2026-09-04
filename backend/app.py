from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from ai_service import (
	AIServiceError,
	ask_question,
	explain_topic,
	generate_quiz,
	summarize_text,
)
from quiz import score_quiz
from storage import add_history_entry, get_history
from student import Student


app = Flask(__name__)
CORS(app)
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


@app.get("/")
def frontend_index():
	return send_from_directory(FRONTEND_DIR, "index.html")


@app.get("/css/<path:filename>")
def frontend_css(filename):
	return send_from_directory(FRONTEND_DIR / "css", filename)


@app.get("/js/<path:filename>")
def frontend_js(filename):
	return send_from_directory(FRONTEND_DIR / "js", filename)


@app.get("/pages/<path:filename>")
def frontend_page(filename):
	return send_from_directory(FRONTEND_DIR / "pages", filename)


@app.get("/components/<path:filename>")
def frontend_component(filename):
	return send_from_directory(FRONTEND_DIR / "components", filename)


def _json_body():
	"""Return a JSON object or a standard bad-request response."""
	data = request.get_json(silent=True)
	if not isinstance(data, dict) or not data:
		return None, (jsonify(success=False, error="A JSON request body is required."), 400)
	return data, None


def _required_text(data, field_name, display_name):
	"""Return trimmed required text or a standard bad-request response."""
	value = data.get(field_name)
	if not isinstance(value, str) or not value.strip():
		return None, (jsonify(success=False, error=f"{display_name} cannot be empty."), 400)
	return value.strip(), None


def _service_error_response(error):
	"""Convert service validation and runtime errors into safe JSON responses."""
	if isinstance(error, ValueError):
		return jsonify(success=False, error=str(error)), 400
	if isinstance(error, AIServiceError):
		return jsonify(success=False, error=str(error)), 502
	return jsonify(
		success=False,
		error="Unable to process your request right now. Please try again.",
	), 500


@app.post("/api/ask")
def ask():
	data, error_response = _json_body()
	if error_response:
		return error_response

	question, error_response = _required_text(data, "question", "Question")
	if error_response:
		return error_response

	try:
		answer = ask_question(question)
		add_history_entry({"type": "ask", "question": question, "answer": answer})
	except Exception as error:
		return _service_error_response(error)
	return jsonify(success=True, answer=answer), 200


@app.post("/api/explain")
def explain():
	data, error_response = _json_body()
	if error_response:
		return error_response

	topic, error_response = _required_text(data, "topic", "Topic")
	if error_response:
		return error_response
	difficulty = data.get("difficulty")
	if not isinstance(difficulty, str) or not difficulty.strip():
		return jsonify(success=False, error="Difficulty cannot be empty."), 400

	try:
		explanation = explain_topic(topic, difficulty.strip())
		add_history_entry({"type": "explain", "topic": topic, "difficulty": difficulty.strip(), "explanation": explanation})
	except Exception as error:
		return _service_error_response(error)
	return jsonify(success=True, explanation=explanation), 200


@app.post("/api/summarize")
def summarize():
	data, error_response = _json_body()
	if error_response:
		return error_response

	text, error_response = _required_text(data, "text", "Text")
	if error_response:
		return error_response
	style = data.get("style")
	if not isinstance(style, str) or not style.strip():
		return jsonify(success=False, error="Summary style cannot be empty."), 400

	try:
		summary = summarize_text(text, style.strip())
		add_history_entry({"type": "summarize", "style": style.strip(), "text": text, "summary": summary})
	except Exception as error:
		return _service_error_response(error)
	return jsonify(success=True, summary=summary), 200


@app.post("/api/generate-quiz")
def generate_quiz_route():
	data, error_response = _json_body()
	if error_response:
		return error_response

	topic, error_response = _required_text(data, "topic", "Topic")
	if error_response:
		return error_response
	difficulty = data.get("difficulty")
	if not isinstance(difficulty, str) or not difficulty.strip():
		return jsonify(success=False, error="Difficulty cannot be empty."), 400

	question_count = data.get("number_of_questions")
	if isinstance(question_count, bool):
		return jsonify(success=False, error="number_of_questions must be an integer."), 400
	if isinstance(question_count, float) and not question_count.is_integer():
		return jsonify(success=False, error="number_of_questions must be an integer."), 400
	try:
		question_count = int(question_count)
	except (TypeError, ValueError):
		return jsonify(success=False, error="number_of_questions must be an integer."), 400
	if question_count <= 0:
		return jsonify(success=False, error="number_of_questions must be greater than 0."), 400

	try:
		quiz = generate_quiz(topic, difficulty.strip(), question_count)
		add_history_entry({
			"type": "quiz_generated",
			"topic": topic,
			"difficulty": difficulty.strip(),
			"number_of_questions": question_count,
			"quiz": quiz,
		})
	except Exception as error:
		return _service_error_response(error)
	return jsonify(success=True, quiz=quiz), 200


@app.post("/api/submit-quiz")
def submit_quiz():
	data, error_response = _json_body()
	if error_response:
		return error_response
	if "quiz" not in data:
		return jsonify(success=False, error="Quiz is required."), 400
	if "answers" not in data:
		return jsonify(success=False, error="Answers are required."), 400

	try:
		result = score_quiz(data["quiz"], data["answers"])
	except ValueError as error:
		return jsonify(success=False, error=str(error)), 400
	except Exception as error:
		return _service_error_response(error)
	try:
		quiz = data["quiz"]
		add_history_entry({
			"type": "quiz_completed",
			"topic": quiz.get("topic"),
			"difficulty": quiz.get("difficulty"),
			**result,
		})
	except Exception as error:
		return _service_error_response(error)
	return jsonify(success=True, **result), 200


@app.get("/api/history")
def history():
	try:
		return jsonify(success=True, history=get_history()), 200
	except Exception:
		return jsonify(success=False, error="Unable to load history right now."), 500


@app.get("/api/statistics")
def statistics():
	try:
		result = Student(get_history()).statistics()
		return jsonify(success=True, statistics=result), 200
	except Exception:
		return jsonify(success=False, error="Unable to load statistics right now."), 500


@app.get("/api/health")
def health():
	return jsonify(success=True, message="CampusMate AI backend is running."), 200


if __name__ == "__main__":
	app.run(debug=True)
