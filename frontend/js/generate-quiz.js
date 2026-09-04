document.addEventListener("DOMContentLoaded", () => {
	const topicInput = document.getElementById("quiz-topic");
	const difficultySelect = document.getElementById("quiz-difficulty");
	const questionCountSelect = document.getElementById("question-count");
	const generateButton = document.getElementById("generate-quiz-button");
	const previewButton = document.getElementById("preview-quiz-button");
	const formMessage = document.getElementById("quiz-form-message");
	const quizContent = document.getElementById("quiz-content");
	let generatedQuiz = null;

	const allowedDifficulties = ["Beginner", "Intermediate", "Advanced"];
	const allowedQuestionCounts = [3, 5, 7, 10];

	generateButton.addEventListener("click", async () => {
		const topic = topicInput.value.trim();
		const difficulty = difficultySelect.value;
		const questionCount = Number(questionCountSelect.value);

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
		formMessage.textContent = "Generating your quiz...";
		try {
			const response = await fetch("/api/generate-quiz", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					topic,
					difficulty: difficulty.toLowerCase(),
					number_of_questions: questionCount,
				}),
			});
			const data = await response.json();
			if (!response.ok || !data.success || !data.quiz || !Array.isArray(data.quiz.questions)) {
				throw new Error("The quiz could not be generated.");
			}
			generatedQuiz = { topic, difficulty, ...data.quiz };
			localStorage.setItem("campusmateGeneratedQuiz", JSON.stringify(generatedQuiz));
			renderGeneratedQuiz(generatedQuiz.questions);
			previewButton.disabled = false;
			formMessage.textContent = "Quiz ready. You can open Take Quiz to begin.";
		} catch (error) {
			formMessage.className = "quiz-form-message is-error";
			formMessage.textContent = "Unable to generate a quiz right now. Please try again.";
		} finally {
			generateButton.disabled = false;
			generateButton.classList.remove("is-loading");
			generateButton.innerHTML = '<span aria-hidden="true">&#10024;</span>Generate Quiz';
		}
	});

	previewButton.addEventListener("click", () => {
		if (previewButton.disabled) return;
		formMessage.className = "quiz-form-message is-info";
		if (!generatedQuiz) return;
		quizContent.scrollIntoView({ behavior: "smooth", block: "center" });
	});

	const renderGeneratedQuiz = (questions) => {
		quizContent.innerHTML = questions.map((question, index) => `<article class="generated-question"><h3>${index + 1}. ${question.question}</h3><ul>${question.options.map((option) => `<li>${option}</li>`).join("")}</ul></article>`).join("");
	};
});
