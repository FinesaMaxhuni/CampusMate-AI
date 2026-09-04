document.addEventListener("DOMContentLoaded", () => {
	const body = document.body;
	const menuToggle = document.getElementById("menu-toggle");
	const overlay = document.getElementById("mobile-overlay");
	const questionInput = document.getElementById("question-input");
	const characterCount = document.getElementById("character-count");
	const attachButton = document.getElementById("attach-button");
	const fileInput = document.getElementById("file-input");

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

	questionInput.addEventListener("input", () => {
		characterCount.textContent = `${questionInput.value.length} / 2000 characters`;
	});

	attachButton.addEventListener("click", () => fileInput.click());
	fileInput.addEventListener("change", () => {
		const file = fileInput.files[0];
		attachButton.innerHTML = file ? `<span aria-hidden="true">&#10003;</span>${file.name}` : `<span aria-hidden="true">&#128206;</span>Attach File`;
	});

	window.addEventListener("resize", updateMenuState);
	updateMenuState();
});
