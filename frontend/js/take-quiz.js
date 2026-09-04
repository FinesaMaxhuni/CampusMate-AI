document.addEventListener("DOMContentLoaded", () => {
	const currentQuestion = { index: 0, total: 5 };
	const selectedAnswers = new Map();
	const answerOptions = document.querySelectorAll(".answer-option");
	const questionNumbers = document.querySelectorAll(".question-number");
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

	const updateProgress = () => {
		const percent = Math.round(((currentQuestion.index + 1) / currentQuestion.total) * 100);
		currentNumber.textContent = currentQuestion.index + 1;
		progressLabel.textContent = `${percent}% Complete`;
		progressBar.style.width = `${percent}%`;
		previousButton.disabled = currentQuestion.index === 0;
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

	answerOptions.forEach((option) => option.addEventListener("click", () => selectAnswer(option.querySelector("input").value)));
	previousButton.addEventListener("click", () => { if (currentQuestion.index > 0) { currentQuestion.index -= 1; updateProgress(); renderSelectedAnswer(); } });
	nextButton.addEventListener("click", () => { if (currentQuestion.index < currentQuestion.total - 1) { currentQuestion.index += 1; updateProgress(); renderSelectedAnswer(); } });
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
});
