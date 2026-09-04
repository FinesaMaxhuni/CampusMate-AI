def score_quiz(quiz, answers):
	"""Score submitted answer letters against a generated quiz."""
	if not isinstance(quiz, dict) or not isinstance(quiz.get("questions"), list) or not quiz["questions"]:
		raise ValueError("Quiz must contain at least one question.")
	if not isinstance(answers, dict):
		raise ValueError("Answers must be provided as an object.")

	questions = quiz["questions"]
	valid_answer_letters = {"A", "B", "C", "D"}
	correct = 0
	answered = 0

	for index, question in enumerate(questions):
		if not isinstance(question, dict):
			raise ValueError("Quiz contains an invalid question.")
		options = question.get("options")
		correct_answer = question.get("correct_answer")
		if not isinstance(options, list) or len(options) != 4 or not isinstance(correct_answer, str):
			raise ValueError("Quiz questions must contain four options and a correct answer.")

		answer = answers.get(str(index), answers.get(index))
		if answer is None:
			continue
		if not isinstance(answer, str) or answer.upper() not in valid_answer_letters:
			raise ValueError(f"Answer for question {index + 1} is invalid.")

		answered += 1
		selected_option = options[ord(answer.upper()) - ord("A")]
		if answer.upper() == correct_answer.upper() or selected_option == correct_answer:
			correct += 1

	total_questions = len(questions)
	incorrect = answered - correct
	score = round((correct / total_questions) * 100)
	return {
		"total_questions": total_questions,
		"answered": answered,
		"correct": correct,
		"incorrect": incorrect,
		"score": score,
	}
