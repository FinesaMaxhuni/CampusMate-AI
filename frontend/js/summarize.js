document.addEventListener("DOMContentLoaded", () => {
	const summaryInput = document.getElementById("summary-input");
	const summaryStyle = document.getElementById("summary-style");
	const summarizeButton = document.getElementById("summarize-button");
	const formMessage = document.getElementById("summary-form-message");
	const copyButton = document.getElementById("summary-copy-button");
	const summaryContent = document.getElementById("summary-content");

	summarizeButton.addEventListener("click", () => {
		const text = summaryInput.value.trim();
		const style = summaryStyle.value;

		formMessage.className = "summary-form-message";
		formMessage.textContent = "";
		if (!text) {
			formMessage.classList.add("is-error");
			formMessage.textContent = "Please enter some text before summarizing it.";
			summaryInput.focus();
			return;
		}

		summarizeButton.disabled = true;
		summarizeButton.classList.add("is-loading");
		summarizeButton.innerHTML = '<span aria-hidden="true">&#8987;</span>Preparing...';
		formMessage.classList.add("is-info");
		formMessage.textContent = `Ready to create a ${style.toLowerCase()} when the backend is connected.`;

		window.setTimeout(() => {
			summarizeButton.disabled = false;
			summarizeButton.classList.remove("is-loading");
			summarizeButton.innerHTML = '<span aria-hidden="true">&#10024;</span>Summarize';
		}, 700);
	});

	copyButton.addEventListener("click", async () => {
		if (copyButton.disabled) return;
		const summary = summaryContent.textContent.trim();
		await navigator.clipboard.writeText(summary);
		copyButton.textContent = "Copied";
		window.setTimeout(() => { copyButton.innerHTML = '<span aria-hidden="true">&#128203;</span>Copy'; }, 1400);
	});
});
