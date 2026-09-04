document.addEventListener("DOMContentLoaded", () => {
	const topicInput = document.getElementById("topic-input");
	const difficultySelect = document.getElementById("difficulty-select");
	const explainButton = document.getElementById("explain-button");
	const formMessage = document.getElementById("form-message");
	const copyButton = document.getElementById("copy-button");
	const explanationContent = document.getElementById("explanation-content");
	let currentExplanation = "";

	explainButton.addEventListener("click", async () => {
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
		explainButton.innerHTML = '<span aria-hidden="true">&#8987;</span>Explaining...';
		formMessage.classList.add("is-info");
		formMessage.textContent = "Preparing your explanation...";
		try {
			const response = await fetch("/api/explain", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ topic, difficulty: difficulty.toLowerCase() }),
			});
			const data = await response.json();
			if (!response.ok || !data.success || typeof data.explanation !== "string") {
				throw new Error("The explanation could not be retrieved.");
			}
			currentExplanation = data.explanation;
			explanationContent.innerHTML = "<h3></h3><p></p>";
			explanationContent.querySelector("h3").textContent = "Explanation";
			explanationContent.querySelector("p").textContent = currentExplanation;
			copyButton.disabled = false;
			formMessage.textContent = "Explanation ready.";
		} catch (error) {
			currentExplanation = "";
			copyButton.disabled = true;
			formMessage.className = "form-message is-error";
			formMessage.textContent = "Unable to get an explanation right now. Please try again.";
		} finally {
			explainButton.disabled = false;
			explainButton.classList.remove("is-loading");
			explainButton.innerHTML = '<span aria-hidden="true">&#10024;</span>Explain Topic';
		}
	});

	copyButton.addEventListener("click", async () => {
		if (copyButton.disabled || !currentExplanation) return;
		await navigator.clipboard.writeText(currentExplanation);
		copyButton.textContent = "Copied";
		window.setTimeout(() => { copyButton.innerHTML = '<span aria-hidden="true">&#128203;</span>Copy'; }, 1400);
	});
});
