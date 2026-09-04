from flask import Flask, jsonify, request
from flask_cors import CORS

from ai_service import (
	ask_question,
	explain_topic,
	generate_quiz,
	summarize_text,
)


app = Flask(__name__)
CORS(app)


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
	except Exception as error:
		return _service_error_response(error)
	return jsonify(success=True, quiz=quiz), 200


@app.get("/api/health")
def health():
	return jsonify(success=True, message="CampusMate AI backend is running."), 200


if __name__ == "__main__":
	app.run(debug=True)
