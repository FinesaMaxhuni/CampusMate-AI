document.addEventListener("DOMContentLoaded", () => {
	let statisticsData = {
		totalQuestions: 0,
		quizzesCompleted: 0,
		averageQuizScore: 0,
		topicsExplained: 0,
		questionsByType: [],
		quizPerformance: { passed: 0, average: 0, failed: 0 }
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
		const total = statisticsData.questionsByType.reduce((sum, item) => sum + item.value, 0);
		let offset = 0;
		segmentGroup.innerHTML = statisticsData.questionsByType.map((item) => {
			const percentage = total ? Math.round((item.value / total) * 100) : 0;
			const segment = `<circle class="donut-segment" cx="100" cy="100" r="72" pathLength="100" stroke="${item.color}" stroke-dasharray="${percentage} ${100 - percentage}" stroke-dashoffset="${-offset}"></circle>`;
			offset += percentage;
			return segment;
		}).join("");
		legend.innerHTML = statisticsData.questionsByType.map((item) => `<div class="legend-row"><span class="legend-dot" style="background:${item.color}"></span><span>${item.label}</span><strong>${total ? Math.round((item.value / total) * 100) : 0}%</strong></div>`).join("");
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
	document.querySelectorAll(".stat-trend").forEach((trend) => { trend.firstChild.textContent = ""; });
	document.getElementById("questions-legend").innerHTML = '<div class="history-empty"><strong>Loading statistics...</strong></div>';
	fetch("/api/statistics")
		.then((response) => response.ok ? response.json() : Promise.reject(new Error("Statistics request failed")))
		.then((data) => {
			if (!data.success || !data.statistics) throw new Error("Invalid statistics response");
			const stats = data.statistics;
			const colors = ["#5934ed", "#39b982", "#f6a51b", "#5796ed", "#ef617b"];
			const questionTypes = Object.entries(stats.questions_by_type || {});
			statisticsData = {
				totalQuestions: stats.questions_asked || 0,
				quizzesCompleted: stats.quizzes_completed || 0,
				averageQuizScore: stats.average_quiz_score || 0,
				topicsExplained: stats.topics_explained || 0,
				questionsByType: questionTypes.map(([label, value], index) => ({ label, value, color: colors[index % colors.length] })),
				quizPerformance: stats.quiz_performance || { passed: 0, average: 0, failed: 0 },
			};
			renderStatistics();
		})
		.catch(() => {
			document.getElementById("questions-legend").innerHTML = '<div class="history-empty"><strong>Unable to load statistics.</strong></div>';
			renderStatistics();
		});
});
