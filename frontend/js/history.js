document.addEventListener("DOMContentLoaded", () => {
	const historyData = [
		{ id: 1, type: "Ask AI", question: "What is polymorphism in Java?", date: "May 20, 2025", isoDate: "2025-05-20", time: "10:30 AM", answer: "Polymorphism is one of the four fundamental OOP principles in Java. It allows objects of different classes to be treated as objects of a common superclass. It enables a single interface to represent different underlying forms (data types).\n\nThere are two types of polymorphism in Java:\n\n• Compile-time polymorphism (method overloading)\n• Runtime polymorphism (method overriding)" },
		{ id: 2, type: "Explain Topic", question: "Explain recursion with an example.", date: "May 20, 2025", isoDate: "2025-05-20", time: "09:15 AM", answer: "Recursion is a technique where a function calls itself to solve a smaller version of the same problem." },
		{ id: 3, type: "Summarize Text", question: "Summarize the benefits of OOP.", date: "May 19, 2025", isoDate: "2025-05-19", time: "08:45 PM", answer: "Object-oriented programming improves organization, reuse, and maintainability by grouping related data and behavior into objects." },
		{ id: 4, type: "Generate Quiz", question: "Generate a quiz about Python Basics.", date: "May 19, 2025", isoDate: "2025-05-19", time: "07:30 PM", answer: "A Python Basics quiz can cover syntax, data types, control flow, and functions." },
		{ id: 5, type: "Take Quiz", question: "Take quiz on Data Structures.", date: "May 18, 2025", isoDate: "2025-05-18", time: "06:20 PM", score: 80, answer: null }
	];
	const iconMap = { "Ask AI": "&#128172;", "Explain Topic": "&#128218;", "Summarize Text": "&#128196;", "Generate Quiz": "&#9745;", "Take Quiz": "&#9654;" };
	const list = document.getElementById("history-list");
	const preview = document.getElementById("question-preview");
	const search = document.getElementById("history-search");
	const typeFilter = document.getElementById("history-type");
	const dateFilter = document.getElementById("history-date");
	const pageLabel = document.getElementById("history-page-label");
	let selectedId = historyData[0].id;
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
		visibleItems = historyData.filter((item) => {
			const matchesSearch = !query || item.question.toLowerCase().includes(query);
			const matchesType = type === "All Types" || item.type === type;
			const matchesDate = date === "All Dates" || (date === "This Month" && item.isoDate.startsWith("2025-05")) || (date === "This Week" && ["2025-05-18", "2025-05-19", "2025-05-20"].includes(item.isoDate)) || (date === "Today" && item.isoDate === "2025-05-20");
			return matchesSearch && matchesType && matchesDate;
		});
		if (!visibleItems.some((item) => item.id === selectedId)) selectedId = visibleItems[0]?.id;
		renderList();
		if (selectedId) renderPreview(historyData.find((item) => item.id === selectedId));
	};

	[search, typeFilter, dateFilter].forEach((control) => control.addEventListener("input", applyFilters));
	document.getElementById("clear-filters").addEventListener("click", () => { search.value = ""; typeFilter.value = "All Types"; dateFilter.value = "All Dates"; selectedId = historyData[0].id; applyFilters(); });
	document.getElementById("history-next").addEventListener("click", () => { pageLabel.textContent = "Page 2 of 3"; document.getElementById("history-previous").disabled = false; });
	document.getElementById("history-previous").addEventListener("click", () => { pageLabel.textContent = "Page 1 of 3"; document.getElementById("history-previous").disabled = true; });

	renderList();
	renderPreview(historyData[0]);
});
