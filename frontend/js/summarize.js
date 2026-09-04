document.addEventListener("DOMContentLoaded", () => {
	const summaryInput = document.getElementById("summary-input");
	const summaryStyle = document.getElementById("summary-style");
	const summarizeButton = document.getElementById("summarize-button");
	const formMessage = document.getElementById("summary-form-message");
	const copyButton = document.getElementById("summary-copy-button");
	const summaryContent = document.getElementById("summary-content");
	let currentSummary = "";
	const styleValues = {
		"Short Summary": "short",
		"Detailed Summary": "detailed",
		"Bullet Points": "bullet_points",
		"Beginner Friendly": "beginner_friendly",
	};

	summarizeButton.addEventListener("click", async () => {
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
		summarizeButton.innerHTML = '<span aria-hidden="true">&#8987;</span>Summarizing...';
		formMessage.classList.add("is-info");
		formMessage.textContent = "Preparing your summary...";
		try {
			const response = await fetch("/api/summarize", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text, style: styleValues[style] || style.toLowerCase() }),
			});
			const data = await response.json();
			if (!response.ok || !data.success || typeof data.summary !== "string") {
				throw new Error("The summary could not be retrieved.");
			}
			currentSummary = data.summary;
			summaryContent.innerHTML = "<h3></h3><p></p>";
			summaryContent.querySelector("h3").textContent = "Summary";
			summaryContent.querySelector("p").textContent = currentSummary;
			copyButton.disabled = false;
			formMessage.textContent = "Summary ready.";
		} catch (error) {
			currentSummary = "";
			copyButton.disabled = true;
			formMessage.className = "summary-form-message is-error";
			formMessage.textContent = "Unable to create a summary right now. Please try again.";
		} finally {
			summarizeButton.disabled = false;
			summarizeButton.classList.remove("is-loading");
			summarizeButton.innerHTML = '<span aria-hidden="true">&#10024;</span>Summarize';
		}
	});

	copyButton.addEventListener("click", async () => {
		if (copyButton.disabled || !currentSummary) return;
		await navigator.clipboard.writeText(currentSummary);
		copyButton.textContent = "Copied";
		window.setTimeout(() => { copyButton.innerHTML = '<span aria-hidden="true">&#128203;</span>Copy'; }, 1400);
	});
});
