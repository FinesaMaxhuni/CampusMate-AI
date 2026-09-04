document.addEventListener("DOMContentLoaded", () => {
	const body = document.body;
	const menuToggle = document.getElementById("menu-toggle");
	const overlay = document.getElementById("mobile-overlay");
	const questionInput = document.getElementById("question-input");
	const characterCount = document.getElementById("character-count");
	const attachButton = document.getElementById("attach-button");
	const fileInput = document.getElementById("file-input");
	const askButton = document.getElementById("ask-button");
	const answerEmptyState = document.querySelector(".empty-answer");

	if (!menuToggle || !overlay) return;

	const updateMenuState = () => {
		const isMobile = window.matchMedia("(max-width: 800px)").matches;
		const isOpen = isMobile ? body.classList.contains("sidebar-open") : !body.classList.contains("sidebar-collapsed");
		menuToggle.setAttribute("aria-expanded", String(isOpen));
	};

	menuToggle.addEventListener("click", () => {
		const isMobile = window.matchMedia("(max-width: 800px)").matches;
		body.classList.toggle(isMobile ? "sidebar-open" : "sidebar-collapsed");
		updateMenuState();
	});

	overlay.addEventListener("click", () => {
		body.classList.remove("sidebar-open");
		updateMenuState();
	});

	if (questionInput && characterCount && attachButton && fileInput && askButton && answerEmptyState) {
		const defaultAskButtonMarkup = askButton.innerHTML;

		questionInput.addEventListener("input", () => {
			characterCount.textContent = `${questionInput.value.length} / 2000 characters`;
		});

		attachButton.addEventListener("click", () => fileInput.click());
		fileInput.addEventListener("change", () => {
			const file = fileInput.files[0];
			attachButton.innerHTML = file ? `<span aria-hidden="true">&#10003;</span>${file.name}` : `<span aria-hidden="true">&#128206;</span>Attach File`;
		});

		askButton.addEventListener("click", async () => {
			const question = questionInput.value.trim();
			if (!question) {
				answerEmptyState.innerHTML = "<h3>Please enter a question first.</h3><p>Type your question above to get started.</p>";
				questionInput.focus();
				return;
			}

			askButton.disabled = true;
			askButton.innerHTML = "<span aria-hidden=\"true\">&#8987;</span>Asking...";
			answerEmptyState.innerHTML = "<h3>Thinking...</h3><p>Your answer is being prepared.</p>";

			try {
				const response = await fetch("/api/ask", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ question }),
				});
				const data = await response.json();
				if (!response.ok || !data.success || typeof data.answer !== "string") {
					throw new Error("The answer could not be retrieved.");
				}
				answerEmptyState.innerHTML = "<h3></h3>";
				answerEmptyState.querySelector("h3").textContent = data.answer;
			} catch (error) {
				answerEmptyState.innerHTML = "<h3>Unable to get an answer right now.</h3><p>Please try again in a moment.</p>";
			} finally {
				askButton.disabled = false;
				askButton.innerHTML = defaultAskButtonMarkup;
			}
		});
	}

	window.addEventListener("resize", updateMenuState);
	updateMenuState();
});
