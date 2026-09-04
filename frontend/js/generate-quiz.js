document.addEventListener("DOMContentLoaded", () => {
	const topicInput = document.getElementById("quiz-topic");
	const difficultySelect = document.getElementById("quiz-difficulty");
	const questionCountSelect = document.getElementById("question-count");
	const generateButton = document.getElementById("generate-quiz-button");
	const previewButton = document.getElementById("preview-quiz-button");
	const formMessage = document.getElementById("quiz-form-message");

	const allowedDifficulties = ["Beginner", "Intermediate", "Advanced"];
	const allowedQuestionCounts = ["3", "5", "7", "10"];

	generateButton.addEventListener("click", () => {
		const topic = topicInput.value.trim();
		const difficulty = difficultySelect.value;
		const questionCount = questionCountSelect.value;

		formMessage.className = "quiz-form-message";
		formMessage.textContent = "";

		if (!topic) {
			formMessage.classList.add("is-error");
			formMessage.textContent = "Please enter a topic before generating a quiz.";
			topicInput.focus();
			return;
		}
		if (!allowedDifficulties.includes(difficulty)) {
			formMessage.classList.add("is-error");
			formMessage.textContent = "Please choose a valid difficulty level.";
			difficultySelect.focus();
			return;
		}
		if (!allowedQuestionCounts.includes(questionCount)) {
			formMessage.classList.add("is-error");
			formMessage.textContent = "Please choose a valid number of questions.";
			questionCountSelect.focus();
			return;
		}

		generateButton.disabled = true;
		generateButton.classList.add("is-loading");
		generateButton.innerHTML = '<span aria-hidden="true">&#8987;</span>Generating Quiz...';
		formMessage.classList.add("is-info");
		formMessage.textContent = `Ready to generate ${questionCount} ${difficulty.toLowerCase()} questions when the backend is connected.`;

		window.setTimeout(() => {
			generateButton.disabled = false;
			generateButton.classList.remove("is-loading");
			generateButton.innerHTML = '<span aria-hidden="true">&#10024;</span>Generate Quiz';
		}, 700);
	});

	previewButton.addEventListener("click", () => {
		if (previewButton.disabled) return;
		formMessage.className = "quiz-form-message is-info";
		formMessage.textContent = "A quiz preview will be available once quiz data is generated.";
	});
});
