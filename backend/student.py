class Student:
	"""Calculate learning statistics from persisted CampusMate records."""

	def __init__(self, history=None):
		self.history = history if isinstance(history, list) else []

	def statistics(self):
		questions = [record for record in self.history if record.get("type") in {"ask", "question"}]
		quizzes = [record for record in self.history if record.get("type") in {"quiz_completed", "quiz"}]
		correct = sum(int(record.get("correct", 0) or 0) for record in quizzes)
		incorrect = sum(int(record.get("incorrect", 0) or 0) for record in quizzes)
		scores = [float(record["score"]) for record in quizzes if isinstance(record.get("score"), (int, float))]
		average_score = round(sum(scores) / len(scores)) if scores else 0
		questions_by_type = {
			"Ask AI a Question": len(questions),
			"Explain a Topic": sum(1 for record in self.history if record.get("type") == "explain"),
			"Summarize Text": sum(1 for record in self.history if record.get("type") == "summarize"),
			"Generate Quiz": sum(1 for record in self.history if record.get("type") == "quiz_generated"),
			"Take Quiz": len(quizzes),
		}
		topics_explained = sum(1 for record in self.history if record.get("type") == "explain")
		return {
			"questions_asked": len(questions),
			"quizzes_completed": len(quizzes),
			"correct_answers": correct,
			"incorrect_answers": incorrect,
			"average_quiz_score": average_score,
			"topics_explained": topics_explained,
			"questions_by_type": {label: count for label, count in questions_by_type.items() if count},
			"quiz_performance": {
				"passed": sum(1 for score in scores if score >= 70),
				"average": sum(1 for score in scores if 50 <= score < 70),
				"failed": sum(1 for score in scores if score < 50),
			},
		}
