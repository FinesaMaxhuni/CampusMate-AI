document.addEventListener("DOMContentLoaded", () => {
	const statisticsData = {
		totalQuestions: 42,
		quizzesCompleted: 16,
		averageQuizScore: 78,
		topicsExplained: 24,
		questionsByType: [
			{ label: "Ask AI a Question", value: 40, color: "#5934ed" },
			{ label: "Explain a Topic", value: 20, color: "#39b982" },
			{ label: "Summarize Text", value: 15, color: "#f6a51b" },
			{ label: "Generate Quiz", value: 15, color: "#5796ed" },
			{ label: "Take Quiz", value: 10, color: "#ef617b" }
		],
		quizPerformance: { passed: 12, average: 3, failed: 1 }
	};
	const periodSelect = document.getElementById("statistics-period");
	const circumference = 2 * Math.PI * 72;

	const renderMetrics = () => {
		document.getElementById("total-questions").textContent = statisticsData.totalQuestions;
		document.getElementById("quizzes-completed").textContent = statisticsData.quizzesCompleted;
		document.getElementById("average-quiz-score").textContent = statisticsData.averageQuizScore;
		document.getElementById("topics-explained").textContent = statisticsData.topicsExplained;
		document.getElementById("ring-score").textContent = statisticsData.averageQuizScore;
	};

	const renderPeriodContext = () => {
		const periodText = periodSelect.value.toLowerCase();
		document.querySelectorAll(".period-context").forEach((element) => { element.textContent = `from ${periodText}`; });
	};

	const renderDonut = () => {
		const segmentGroup = document.getElementById("donut-segments");
		const legend = document.getElementById("questions-legend");
		let offset = 0;
		segmentGroup.innerHTML = statisticsData.questionsByType.map((item) => {
			const length = circumference * (item.value / 100);
			const segment = `<circle class="donut-segment" cx="100" cy="100" r="72" pathLength="100" stroke="${item.color}" stroke-dasharray="${item.value} ${100 - item.value}" stroke-dashoffset="${-offset}"></circle>`;
			offset += item.value;
			return segment;
		}).join("");
		legend.innerHTML = statisticsData.questionsByType.map((item) => `<div class="legend-row"><span class="legend-dot" style="background:${item.color}"></span><span>${item.label}</span><strong>${item.value}%</strong></div>`).join("");
	};

	const renderPerformance = () => {
		const rows = [{ icon: "&#10003;", value: statisticsData.quizPerformance.passed, label: "Quizzes Passed (≥ 70%)", className: "passed" }, { icon: "&#9675;", value: statisticsData.quizPerformance.average, label: "Quizzes Average (50% - 69%)", className: "average" }, { icon: "&#10005;", value: statisticsData.quizPerformance.failed, label: "Quizzes Failed (< 50%)", className: "failed" }];
		document.getElementById("performance-rows").innerHTML = rows.map((row) => `<div class="performance-row ${row.className}"><span class="performance-icon">${row.icon}</span><strong>${row.value}</strong><span>${row.label}</span></div>`).join("");
		const progress = statisticsData.averageQuizScore;
		const ring = document.getElementById("score-ring-progress");
		ring.style.strokeDasharray = `${progress} ${100 - progress}`;
	};

	const renderStatistics = () => { renderMetrics(); renderDonut(); renderPerformance(); renderPeriodContext(); };
	periodSelect.addEventListener("change", () => { document.body.dataset.statisticsPeriod = periodSelect.value; renderStatistics(); });
	renderStatistics();
});
