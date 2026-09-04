document.addEventListener("DOMContentLoaded", () => {
	const topicInput = document.getElementById("topic-input");
	const difficultySelect = document.getElementById("difficulty-select");
	const explainButton = document.getElementById("explain-button");
	const formMessage = document.getElementById("form-message");
	const copyButton = document.getElementById("copy-button");
	const explanationContent = document.getElementById("explanation-content");

	explainButton.addEventListener("click", () => {
		const topic = topicInput.value.trim();
		const difficulty = difficultySelect.value;

		formMessage.className = "form-message";
		formMessage.textContent = "";
		if (!topic) {
			formMessage.classList.add("is-error");
			formMessage.textContent = "Please enter a topic before explaining it.";
			topicInput.focus();
			return;
		}

		explainButton.disabled = true;
		explainButton.classList.add("is-loading");
		explainButton.innerHTML = '<span aria-hidden="true">&#8987;</span>Preparing...';
		formMessage.classList.add("is-info");
		formMessage.textContent = `Ready to explain ${topic} at ${difficulty} level when the backend is connected.`;

		window.setTimeout(() => {
			explainButton.disabled = false;
			explainButton.classList.remove("is-loading");
			explainButton.innerHTML = '<span aria-hidden="true">&#10024;</span>Explain Topic';
		}, 700);
	});

	copyButton.addEventListener("click", async () => {
		if (copyButton.disabled) return;
		const explanation = explanationContent.textContent.trim();
		await navigator.clipboard.writeText(explanation);
		copyButton.textContent = "Copied";
		window.setTimeout(() => { copyButton.innerHTML = '<span aria-hidden="true">&#128203;</span>Copy'; }, 1400);
	});
});
