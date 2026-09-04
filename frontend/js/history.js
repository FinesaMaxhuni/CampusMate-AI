document.addEventListener("DOMContentLoaded", () => {
	let historyData = [];
	const iconMap = { "Ask AI": "&#128172;", "Explain Topic": "&#128218;", "Summarize Text": "&#128196;", "Generate Quiz": "&#9745;", "Take Quiz": "&#9654;" };
	const list = document.getElementById("history-list");
	const preview = document.getElementById("question-preview");
	const search = document.getElementById("history-search");
	const typeFilter = document.getElementById("history-type");
	const dateFilter = document.getElementById("history-date");
	const pageLabel = document.getElementById("history-page-label");
	let selectedId;
	let visibleItems = [...historyData];

	const renderPreview = (item) => {
		const answer = item.answer ? item.answer.split("\n\n").map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`).join("") : "<p class=\"preview-muted\">This quiz entry does not have an answer preview.</p>";
		const score = item.score ? `<span class="preview-score">Score: ${item.score}%</span>` : "";
		preview.innerHTML = `<h3>${item.question}</h3><div class="history-meta"><span class="history-type-badge">${item.type}</span><span>&#128197; ${item.date} at ${item.time}</span>${score}</div><h4>AI Answer Preview</h4><div class="preview-answer">${answer}</div><button class="view-answer-button" id="view-full-answer" type="button">View Full Answer <span aria-hidden="true">&#8599;</span></button>`;
		document.getElementById("view-full-answer").addEventListener("click", () => {
			document.getElementById("view-full-answer").textContent = "Full answer navigation will be connected later.";
		});
	};

	const renderList = () => {
		if (!visibleItems.length) {
			list.innerHTML = '<div class="history-empty"><span aria-hidden="true">&#128269;</span><strong>No questions found.</strong><p>Try adjusting your search or filters.</p></div>';
			preview.innerHTML = '<div class="history-empty preview-empty"><span aria-hidden="true">&#128196;</span><strong>No previous questions found.</strong><p>Select another filter to view history.</p></div>';
			return;
		}
		list.innerHTML = visibleItems.map((item) => `<button class="history-entry ${item.id === selectedId ? "selected" : ""}" type="button" data-history-id="${item.id}"><span class="history-entry-icon">${iconMap[item.type]}</span><span class="history-entry-main"><strong>${item.question}</strong><span class="history-type-badge">${item.type}</span></span><span class="history-entry-date"><span>&#128197; ${item.date}</span><span>${item.time}</span></span>${item.score ? `<span class="history-score">Score: ${item.score}%</span>` : ""}<span class="history-arrow" aria-hidden="true">&#8250;</span></button>`).join("");
		list.querySelectorAll(".history-entry").forEach((entry) => entry.addEventListener("click", () => { selectedId = Number(entry.dataset.historyId); renderList(); renderPreview(historyData.find((item) => item.id === selectedId)); }));
	};

	const applyFilters = () => {
		const query = search.value.trim().toLowerCase();
		const type = typeFilter.value;
		const date = dateFilter.value;
		const now = new Date();
		const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const startOfWeek = new Date(startOfToday);
		startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		visibleItems = historyData.filter((item) => {
			const matchesSearch = !query || item.question.toLowerCase().includes(query);
			const matchesType = type === "All Types" || item.type === type;
			const itemDate = item.isoDate ? new Date(`${item.isoDate}T00:00:00`) : null;
			const matchesDate = date === "All Dates" || (itemDate && ((date === "Today" && itemDate >= startOfToday) || (date === "This Week" && itemDate >= startOfWeek) || (date === "This Month" && itemDate >= startOfMonth)));
			return matchesSearch && matchesType && matchesDate;
		});
		if (!visibleItems.some((item) => item.id === selectedId)) selectedId = visibleItems[0]?.id;
		renderList();
		if (selectedId) renderPreview(historyData.find((item) => item.id === selectedId));
	};

	[search, typeFilter, dateFilter].forEach((control) => control.addEventListener("input", applyFilters));
	document.getElementById("clear-filters").addEventListener("click", () => { search.value = ""; typeFilter.value = "All Types"; dateFilter.value = "All Dates"; selectedId = historyData[0]?.id; applyFilters(); });
	document.getElementById("history-next").addEventListener("click", () => { pageLabel.textContent = "Page 2 of 3"; document.getElementById("history-previous").disabled = false; });
	document.getElementById("history-previous").addEventListener("click", () => { pageLabel.textContent = "Page 1 of 3"; document.getElementById("history-previous").disabled = true; });

	list.innerHTML = '<div class="history-empty"><strong>Loading history...</strong></div>';
	fetch("/api/history")
		.then((response) => response.ok ? response.json() : Promise.reject(new Error("History request failed")))
		.then((data) => {
			if (!data.success || !Array.isArray(data.history)) throw new Error("Invalid history response");
			historyData = data.history.map((record, index) => {
				const date = record.timestamp ? new Date(record.timestamp) : null;
				const typeMap = {
					ask: "Ask AI",
					question: "Ask AI",
					explain: "Explain Topic",
					summarize: "Summarize Text",
					quiz_generated: "Generate Quiz",
					quiz_completed: "Take Quiz",
					quiz: "Take Quiz",
				};
				const displayType = typeMap[record.type] || "Ask AI";
				return {
					...record,
					id: index + 1,
					type: displayType,
					question: record.question || record.topic || "Previous activity",
					date: date ? date.toLocaleDateString() : "",
					isoDate: date ? date.toISOString().slice(0, 10) : "",
					time: date ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
					score: record.score,
					answer: record.answer || record.explanation || record.summary || null,
				};
			});
			selectedId = historyData[0]?.id;
			visibleItems = [...historyData];
			renderList();
			if (selectedId) renderPreview(historyData[0]);
		})
		.catch(() => {
			list.innerHTML = '<div class="history-empty"><strong>Unable to load history.</strong><p>Please try again later.</p></div>';
			preview.innerHTML = '<div class="history-empty preview-empty"><strong>No previous questions found.</strong></div>';
		});
});
