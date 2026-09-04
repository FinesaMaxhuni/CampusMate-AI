document.addEventListener("DOMContentLoaded", () => {
	const body = document.body;
	const menuToggle = document.getElementById("menu-toggle");
	const overlay = document.getElementById("mobile-overlay");
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

	window.addEventListener("resize", updateMenuState);
	updateMenuState();
});
