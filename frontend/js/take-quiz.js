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

	const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);

	const bindAnswerOptions = () => {
		answerOptions = document.querySelectorAll(".answer-option");
		answerOptions.forEach((option) => option.addEventListener("click", () => selectAnswer(option.querySelector("input").value)));
	};

	const renderGeneratedQuestion = () => {
		if (!hasGeneratedQuiz) return;
		const question = generatedQuiz.questions[currentQuestion.index];
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
			option.classList.toggle("selected", isSelected);
		});
	};

	const selectAnswer = (value) => {
		selectedAnswers.set(currentQuestion.index, value);
		answerOptions.forEach((option) => option.classList.toggle("selected", option.querySelector("input").value === value));
		updateAnsweredCount();
	};

	const showResult = (result) => {
		const message = result.score >= 80 ? "Great job! Keep practicing." : result.score >= 50 ? "Good effort! Keep practicing to improve." : "Keep practicing and try again.";
		resultCard.innerHTML = `<div class="trophy-icon" aria-hidden="true"><span>&#9819;</span></div><h2>Your Result</h2><p>${result.total_questions} Questions &nbsp; ${result.answered} Answered</p><p>${result.correct} Correct &nbsp; ${result.incorrect} Incorrect</p><p><strong>Score: ${result.score}%</strong></p><p>${message}</p>`;
	};

	const showQuizMessage = (title, message) => {
		resultCard.querySelector("h2").textContent = title;
		resultCard.querySelector("p").textContent = message;
	};

	const finishQuiz = async () => {
		if (isSubmitting) return;
		if (!hasGeneratedQuiz) {
			showQuizMessage("Generate a quiz first", "Your result will appear after a generated quiz is loaded.");
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
			document.getElementById("stat-answered").textContent = data.answered;
			document.getElementById("stat-correct").textContent = data.correct;
			document.getElementById("stat-incorrect").textContent = data.incorrect;
			showResult(data);
			nextButton.textContent = "Quiz Completed";
		} catch (error) {
			showQuizMessage("Unable to submit quiz", "Please try again in a moment.");
			nextButton.disabled = false;
			nextButton.textContent = "Finish Quiz";
			isSubmitting = false;
		}
	};

	bindAnswerOptions();
	previousButton.addEventListener("click", () => { if (currentQuestion.index > 0) { currentQuestion.index -= 1; updateProgress(); renderSelectedAnswer(); } });
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
		renderSelectedAnswer();
	}));

	endButton.addEventListener("click", () => { confirmation.hidden = false; cancelEnd.focus(); });
	cancelEnd.addEventListener("click", () => { confirmation.hidden = true; endButton.focus(); });
	confirmEnd.addEventListener("click", () => { confirmation.hidden = true; endButton.textContent = "Quiz Ended"; endButton.disabled = true; });
	confirmation.addEventListener("click", (event) => { if (event.target === confirmation) { confirmation.hidden = true; endButton.focus(); } });

	updateProgress();
	updateAnsweredCount();
	if (hasGeneratedQuiz) renderGeneratedQuestion();
});
