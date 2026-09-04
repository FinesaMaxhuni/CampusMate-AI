"""OpenAI-backed study assistant services."""

import json
import os
from typing import Any, Dict, List

from dotenv import load_dotenv
from openai import AuthenticationError, OpenAI


MODEL_NAME = "gpt-4o-mini"
SUPPORTED_DIFFICULTIES = {"beginner", "intermediate", "advanced"}
SUPPORTED_SUMMARY_STYLES = {
	"short",
	"detailed",
	"bullet_points",
	"beginner_friendly",
}


class AIServiceError(RuntimeError):
	"""Raised when an AI service request or response cannot be used safely."""


load_dotenv()
_api_key = os.getenv("OPENAI_API_KEY")
if not _api_key:
	raise RuntimeError("OPENAI_API_KEY is not configured.")



def _openai_client():
	"""Create the client without the known disabled sandbox proxy."""
	proxy_names = ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy")
	proxy_values = [os.getenv(name, "").lower().rstrip("/") for name in proxy_names]
	if not any(proxy in {"http://127.0.0.1:9", "http://localhost:9"} for proxy in proxy_values):
		return OpenAI(api_key=_api_key)

	# The OpenAI SDK already bundles its HTTP client, so do not add a direct dependency.
	saved_proxies = {name: os.environ.pop(name, None) for name in proxy_names}
	try:
		return OpenAI(api_key=_api_key)
	finally:
		for name, value in saved_proxies.items():
			if value is not None:
				os.environ[name] = value


client = _openai_client()


def _require_text(value: str, field_name: str) -> str:
	"""Return trimmed text or reject an empty input."""
	if not isinstance(value, str) or not value.strip():
		raise ValueError(f"{field_name} must not be empty.")
	return value.strip()


def _require_choice(value: str, choices: set, field_name: str) -> str:
	"""Validate and normalize a supported choice."""
	if not isinstance(value, str) or value.lower() not in choices:
		allowed = ", ".join(sorted(choices))
		raise ValueError(f"{field_name} must be one of: {allowed}.")
	return value.lower()


def _request_text(prompt: str) -> str:
	"""Send a text-generation request and return only the generated text."""
	try:
		response = client.chat.completions.create(
			model=MODEL_NAME,
			messages=[
				{
					"role": "system",
					"content": "You are a careful educational assistant for students.",
				},
				{"role": "user", "content": prompt},
			],
		)
		content = response.choices[0].message.content
	except AuthenticationError as error:
		raise AIServiceError("The OpenAI API key is invalid or has been revoked. Update OPENAI_API_KEY in .env.") from error
	except Exception as error:
		raise AIServiceError("The AI service is temporarily unavailable. Please try again later.") from error

	if not content or not content.strip():
		raise AIServiceError("The AI service returned an empty response.")
	return content.strip()


def ask_question(question: str) -> str:
	"""Answer a student's question as a clear, encouraging study tutor."""
	question_text = _require_text(question, "question")
	prompt = f"""
You are answering a student's question as a helpful study tutor.

Student question:
{question_text}

Provide a clear educational answer in normal text. Explain important concepts
when appropriate, use language that is easy to understand, and encourage the
student to understand the reasoning rather than simply copy an answer. Do not
add unrelated information.
""".strip()
	return _request_text(prompt)


def explain_topic(topic: str, difficulty: str) -> str:
	"""Explain a topic using instructions appropriate to the selected level."""
	topic_text = _require_text(topic, "topic")
	selected_difficulty = _require_choice(difficulty, SUPPORTED_DIFFICULTIES, "difficulty")
	difficulty_instructions = {
		"beginner": (
			"Assume little prior knowledge. Use simple language, explain basic "
			"concepts, include an easy example, and avoid unnecessary technical terms."
		),
		"intermediate": (
			"Assume basic knowledge. Provide more technical detail, explain "
			"relationships between concepts, and include a practical or academic example."
		),
		"advanced": (
			"Assume strong prior knowledge. Provide deeper technical detail, discuss "
			"important nuances, use appropriate terminology, and include an advanced example or application."
		),
	}
	prompt = f"""
Explain the following topic to a student at the {selected_difficulty} level:

Topic:
{topic_text}

Difficulty guidance:
{difficulty_instructions[selected_difficulty]}

Return a structured educational explanation with a short overview, the key
ideas, and the requested example or application. Keep the explanation focused
on the topic and appropriate for the selected difficulty.
""".strip()
	return _request_text(prompt)


def summarize_text(text: str, style: str) -> str:
	"""Summarize student-provided text according to the requested style."""
	source_text = _require_text(text, "text")
	selected_style = _require_choice(style, SUPPORTED_SUMMARY_STYLES, "style")
	style_instructions = {
		"short": "Write a concise summary containing only the most important information.",
		"detailed": "Preserve the important ideas and relevant supporting details while remaining shorter than the original text.",
		"bullet_points": "Organize the key ideas as clear, concise bullet points that are easy to scan.",
		"beginner_friendly": "Explain the important ideas in simple language, avoid unnecessary jargon, and make the summary easy for a beginner to understand.",
	}
	prompt = f"""
Summarize the text below for a student.

Requested summary style: {selected_style}
Style instructions: {style_instructions[selected_style]}

Text to summarize:
{source_text}

Return only the requested summary. Do not discuss the summarization process.
""".strip()
	return _request_text(prompt)


def _parse_quiz_response(response_text: str, expected_count: int) -> Dict[str, List[Dict[str, Any]]]:
	"""Parse and validate the structured JSON returned for a quiz."""
	cleaned_response = response_text.strip()
	if cleaned_response.startswith("```") and cleaned_response.endswith("```"):
		cleaned_response = cleaned_response.split("\n", 1)[1].rsplit("\n", 1)[0].strip()

	try:
		quiz = json.loads(cleaned_response)
	except json.JSONDecodeError as error:
		raise AIServiceError("The AI service returned an invalid quiz format.") from error

	questions = quiz.get("questions") if isinstance(quiz, dict) else None
	if not isinstance(questions, list) or len(questions) != expected_count:
		raise AIServiceError("The AI service returned an unexpected number of quiz questions.")

	required_fields = {"question", "options", "correct_answer", "explanation"}
	for question_index, question in enumerate(questions, start=1):
		if not isinstance(question, dict) or not required_fields.issubset(question):
			raise AIServiceError(f"The AI service returned an incomplete quiz question at position {question_index}.")
		if not isinstance(question["question"], str) or not question["question"].strip():
			raise AIServiceError(f"Quiz question {question_index} has no question text.")
		if not isinstance(question["options"], list) or len(question["options"]) != 4:
			raise AIServiceError(f"Quiz question {question_index} must contain four answer options.")
		if not all(isinstance(option, str) and option.strip() for option in question["options"]):
			raise AIServiceError(f"Quiz question {question_index} contains an invalid answer option.")
		if not isinstance(question["correct_answer"], str) or question["correct_answer"] not in question["options"]:
			raise AIServiceError(f"Quiz question {question_index} contains an invalid correct answer.")
		if not isinstance(question["explanation"], str) or not question["explanation"].strip():
			raise AIServiceError(f"Quiz question {question_index} has no explanation.")
	return quiz


def generate_quiz(topic: str, difficulty: str, number_of_questions: int) -> Dict[str, List[Dict[str, Any]]]:
	"""Generate and validate multiple-choice quiz questions as a dictionary."""
	topic_text = _require_text(topic, "topic")
	selected_difficulty = _require_choice(difficulty, SUPPORTED_DIFFICULTIES, "difficulty")
	if isinstance(number_of_questions, bool) or not isinstance(number_of_questions, int) or number_of_questions <= 0:
		raise ValueError("number_of_questions must be an integer greater than 0.")

	prompt = f"""
Create a multiple-choice study quiz about the following topic:

Topic: {topic_text}
Difficulty: {selected_difficulty}
Number of questions: {number_of_questions}

The difficulty must affect the complexity and depth of the questions. Each
question must have exactly four answer options, one correct answer, and a short
explanation. Return ONLY valid JSON with this exact structure and no Markdown
code fences:
{{
  "questions": [
	{{
	  "question": "...",
	  "options": ["...", "...", "...", "..."],
	  "correct_answer": "...",
	  "explanation": "..."
	}}
  ]
}}

Return exactly {number_of_questions} questions.
""".strip()
	response_text = _request_text(prompt)
	return _parse_quiz_response(response_text, number_of_questions)
