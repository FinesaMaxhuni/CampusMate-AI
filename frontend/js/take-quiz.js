document.addEventListener("DOMContentLoaded", () => {
	const storedQuiz = localStorage.getItem("campusmateGeneratedQuiz");
	let generatedQuiz = null;
	try {
		generatedQuiz = storedQuiz ? JSON.parse(storedQuiz) : null;
	} catch (error) {
		generatedQuiz = null;
	}
	const hasGeneratedQuiz = Boolean(generatedQuiz && Array.isArray(generatedQuiz.questions) && generatedQuiz.questions.length);
	const currentQuestion = { index: 0, total: hasGeneratedQuiz ? generatedQuiz.questions.length : 5 };
	const selectedAnswers = new Map();
	let answerOptions = document.querySelectorAll(".answer-option");
	let questionNumbers = document.querySelectorAll(".question-number");
	const questionContent = document.querySelector(".question-content");
	const questionText = document.querySelector(".question-text");
	const codeBlock = document.querySelector(".code-block");
	const answerOptionsContainer = document.querySelector(".answer-options");
	const navigator = document.getElementById("question-navigator");
	const currentNumber = document.getElementById("current-question-number");
	const progressLabel = document.getElementById("progress-label");
	const progressBar = document.getElementById("progress-bar");
	const previousButton = document.getElementById("previous-question");
	const nextButton = document.getElementById("next-question");
	const answeredCount = document.getElementById("stat-answered");
	const endButton = document.getElementById("end-quiz-button");
	const confirmation = document.getElementById("quiz-confirmation");
	const cancelEnd = document.getElementById("cancel-end-quiz");
	const confirmEnd = document.getElementById("confirm-end-quiz");
	const resultCard = document.querySelector(".result-card");
	let isSubmitting = false;
	let isSubmitted = false;
	let questionResults = [];

	const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);

	const bindAnswerOptions = () => {
		answerOptions = document.querySelectorAll(".answer-option");
		answerOptions.forEach((option) => option.addEventListener("click", () => {
			if (!isSubmitted) selectAnswer(option.querySelector("input").value);
		}));
	};

	const getCorrectAnswerLetter = (question) => {
		if (!question || !Array.isArray(question.options) || question.options.length !== 4 || typeof question.correct_answer !== "string") return null;
		const answer = question.correct_answer.trim();
		if (/^[A-D]$/i.test(answer)) return answer.toUpperCase();
		const optionIndex = question.options.findIndex((option) => String(option).trim().toLowerCase() === answer.toLowerCase());
		return optionIndex === -1 ? null : String.fromCharCode(65 + optionIndex);
	};

	const validateQuiz = () => hasGeneratedQuiz && generatedQuiz.questions.every((question) => (
		question && typeof question.question === "string" && Array.isArray(question.options) && question.options.length === 4 && getCorrectAnswerLetter(question)
	));

	const renderGeneratedQuestion = () => {
		if (!hasGeneratedQuiz) return;
		const question = generatedQuiz.questions[currentQuestion.index];
		if (!question || !Array.isArray(question.options)) {
			showQuizMessage("Invalid quiz", "This question has an invalid structure. Please generate a new quiz.");
			return;
		}
		questionText.textContent = question.question;
		if (question.code) {
			codeBlock.hidden = false;
			codeBlock.textContent = question.code;
		} else {
			codeBlock.hidden = true;
		}
		answerOptionsContainer.innerHTML = question.options.map((option, index) => `<label class="answer-option"><input type="radio" name="quiz-answer" value="${escapeHtml(String.fromCharCode(65 + index))}"><span class="option-letter">${String.fromCharCode(65 + index)}.</span><span>${escapeHtml(option)}</span></label>`).join("");
		bindAnswerOptions();
		renderSelectedAnswer();
		if (isSubmitted && question.explanation) {
			const explanation = document.createElement("p");
			explanation.className = "quiz-explanation";
			explanation.textContent = `Explanation: ${question.explanation}`;
			answerOptionsContainer.append(explanation);
		}
	};

	if (hasGeneratedQuiz) {
		document.querySelector("[data-quiz-topic]").textContent = generatedQuiz.topic || "Generated Quiz";
		document.querySelector("[data-quiz-difficulty]").textContent = generatedQuiz.difficulty || "";
		document.querySelector("[data-quiz-total]").textContent = currentQuestion.total;
		document.getElementById("total-question-number").textContent = currentQuestion.total;
		document.getElementById("stat-total").textContent = currentQuestion.total;
		navigator.innerHTML = generatedQuiz.questions.map((question, index) => `<button class="question-number${index === 0 ? " active" : ""}" type="button" data-question="${index}">${index + 1}</button>`).join("");
		questionNumbers = document.querySelectorAll(".question-number");
	}

	const updateProgress = () => {
		const percent = Math.round(((currentQuestion.index + 1) / currentQuestion.total) * 100);
		currentNumber.textContent = currentQuestion.index + 1;
		progressLabel.textContent = `${percent}% Complete`;
		progressBar.style.width = `${percent}%`;
		previousButton.disabled = currentQuestion.index === 0;
		nextButton.innerHTML = currentQuestion.index === currentQuestion.total - 1
			? "Finish Quiz"
			: "Next Question<span aria-hidden=\"true\">&#8594;</span>";
		questionNumbers.forEach((button) => button.classList.toggle("active", Number(button.dataset.question) === currentQuestion.index));
		if (isSubmitted) nextButton.textContent = "Quiz Completed";
	};

	const updateAnsweredCount = () => {
		answeredCount.textContent = selectedAnswers.size;
	};

	const renderSelectedAnswer = () => {
		const selected = selectedAnswers.get(currentQuestion.index);
		answerOptions.forEach((option) => {
			const input = option.querySelector("input");
			const isSelected = Boolean(selected) && input.value === selected;
			input.checked = isSelected;
			input.disabled = isSubmitted;
			option.classList.toggle("selected", isSelected);
			option.classList.toggle("correct-answer", isSubmitted && input.value === getCorrectAnswerLetter(generatedQuiz.questions[currentQuestion.index]));
			option.classList.toggle("incorrect-answer", isSubmitted && isSelected && input.value !== getCorrectAnswerLetter(generatedQuiz.questions[currentQuestion.index]));
		});
	};

	const selectAnswer = (value) => {
		if (isSubmitted) return;
		selectedAnswers.set(currentQuestion.index, value);
		answerOptions.forEach((option) => option.classList.toggle("selected", option.querySelector("input").value === value));
		updateAnsweredCount();
	};

	const applyQuestionResults = () => {
		questionNumbers.forEach((button, index) => {
			button.classList.toggle("status-correct", questionResults[index] === true);
			button.classList.toggle("status-incorrect", questionResults[index] === false);
		});
	};

	const showResult = (result) => {
		const message = result.score >= 80 ? "Great job! Keep practicing." : result.score >= 50 ? "Good effort! Keep practicing to improve." : "Keep practicing and try again.";
		resultCard.innerHTML = `<div class="trophy-icon" aria-hidden="true"><span>&#9819;</span></div><h2>Quiz Completed!</h2><p>Total Questions: ${result.total_questions}</p><p>Correct: ${result.correct} &nbsp; Incorrect: ${result.incorrect}</p><p><strong>Score: ${result.correct} / ${result.total_questions} (${result.score}%)</strong></p><p>${message}</p>`;
	};

	const showQuizMessage = (title, message) => {
		resultCard.querySelector("h2").textContent = title;
		resultCard.querySelector("p").textContent = message;
	};

	const finishQuiz = async () => {
		if (isSubmitting || isSubmitted) return;
		if (!hasGeneratedQuiz) {
			showQuizMessage("Generate a quiz first", "Your result will appear after a generated quiz is loaded.");
			return;
		}
		if (!validateQuiz()) {
			showQuizMessage("Invalid quiz", "This quiz is missing valid questions or correct answers. Please generate a new quiz.");
			return;
		}
		if (selectedAnswers.size !== currentQuestion.total) {
			showQuizMessage("Answer all questions", "Please answer every question before finishing the quiz.");
			const unansweredIndex = Array.from({ length: currentQuestion.total }, (_, index) => index).find((index) => !selectedAnswers.has(index));
			if (unansweredIndex !== undefined) {
				currentQuestion.index = unansweredIndex;
				updateProgress();
				renderGeneratedQuestion();
			}
			return;
		}

		const localResults = generatedQuiz.questions.map((question, index) => selectedAnswers.get(index) === getCorrectAnswerLetter(question));
		const localCorrect = localResults.filter(Boolean).length;
		const localResult = { total_questions: currentQuestion.total, answered: selectedAnswers.size, correct: localCorrect, incorrect: currentQuestion.total - localCorrect, score: Math.round((localCorrect / currentQuestion.total) * 100) };
		isSubmitting = true;
		nextButton.disabled = true;
		nextButton.textContent = "Submitting...";
		try {
			const response = await fetch("/api/submit-quiz", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					quiz: generatedQuiz,
					answers: Object.fromEntries(selectedAnswers),
				}),
			});
			const data = await response.json();
			if (!response.ok || !data.success) throw new Error("Quiz submission failed.");
			questionResults = localResults;
			isSubmitted = true;
			document.getElementById("stat-answered").textContent = localResult.answered;
			document.getElementById("stat-correct").textContent = localResult.correct;
			document.getElementById("stat-incorrect").textContent = localResult.incorrect;
			showResult(localResult);
			renderGeneratedQuestion();
			applyQuestionResults();
			nextButton.disabled = false;
			nextButton.textContent = "Quiz Completed";
		} catch (error) {
			showQuizMessage("Unable to submit quiz", "Please try again in a moment.");
			nextButton.disabled = false;
			nextButton.textContent = "Finish Quiz";
			isSubmitting = false;
		}
	};

	bindAnswerOptions();
	previousButton.addEventListener("click", () => { if (currentQuestion.index > 0) { currentQuestion.index -= 1; updateProgress(); renderGeneratedQuestion(); } });
	nextButton.addEventListener("click", () => {
		if (currentQuestion.index < currentQuestion.total - 1) {
			currentQuestion.index += 1;
			updateProgress();
			if (hasGeneratedQuiz) renderGeneratedQuestion();
			else renderSelectedAnswer();
			return;
		}
		finishQuiz();
	});
	questionNumbers.forEach((button) => button.addEventListener("click", () => {
		const target = Number(button.dataset.question);
		if (target === currentQuestion.index) return;
		currentQuestion.index = target;
		updateProgress();
		renderGeneratedQuestion();
	}));

	endButton.addEventListener("click", () => { confirmation.hidden = false; cancelEnd.focus(); });
	cancelEnd.addEventListener("click", () => { confirmation.hidden = true; endButton.focus(); });
	confirmEnd.addEventListener("click", () => { confirmation.hidden = true; endButton.textContent = "Quiz Ended"; endButton.disabled = true; });
	confirmation.addEventListener("click", (event) => { if (event.target === confirmation) { confirmation.hidden = true; endButton.focus(); } });

	updateProgress();
	updateAnsweredCount();
	if (hasGeneratedQuiz) renderGeneratedQuestion();
});
