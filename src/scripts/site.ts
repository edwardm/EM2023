import "bootstrap/dist/js/bootstrap.bundle.min.js";

document.addEventListener("show.bs.modal", (event) => {
	const modal = event.target;
	if (!(modal instanceof HTMLElement) || modal.id !== "galleryModal") return;

	const trigger = (event as Event & { relatedTarget?: HTMLElement })
		.relatedTarget;
	const modalBody = modal.querySelector<HTMLElement>(".modal-body");
	const modalTitle = modal.querySelector<HTMLElement>(".modal-title");
	const modalImage = modal.querySelector<HTMLImageElement>(".modal-body img");
	if (!trigger || !modalBody || !modalTitle || !modalImage) return;

	const title = trigger.dataset.bsTitle ?? "Project image";
	const image = trigger.dataset.bsImage;
	if (!image) return;

	const backgroundColor = trigger.dataset.bsBgcolor ?? "";
	modalBody.classList.toggle(
		"modal-logo",
		trigger.dataset.bsType === "modal-logo",
	);
	modalBody.style.backgroundColor = backgroundColor;
	modalTitle.textContent = title;
	modalImage.src = image;
	modalImage.alt = title;
	modalImage.style.backgroundColor = backgroundColor;
});

document.addEventListener("hidden.bs.modal", (event) => {
	const modal = event.target;
	if (!(modal instanceof HTMLElement) || modal.id !== "galleryModal") return;

	const modalBody = modal.querySelector<HTMLElement>(".modal-body");
	const modalTitle = modal.querySelector<HTMLElement>(".modal-title");
	const modalImage = modal.querySelector<HTMLImageElement>(".modal-body img");
	if (!modalBody || !modalTitle || !modalImage) return;

	modalBody.classList.remove("modal-logo");
	modalBody.style.backgroundColor = "";
	modalTitle.textContent = "Project image";
	modalImage.removeAttribute("src");
	modalImage.alt = "";
	modalImage.style.backgroundColor = "";
});

function initializeContactForm() {
	const contactForm =
		document.querySelector<HTMLFormElement>("#contact-form");
	const formStatus = document.querySelector<HTMLElement>(
		"#contact-form-status",
	);
	if (!contactForm || !formStatus || contactForm.dataset.enhanced) return;
	contactForm.dataset.enhanced = "true";

	contactForm.addEventListener("submit", async (event) => {
		event.preventDefault();

		const submitButton = contactForm.querySelector<HTMLButtonElement>(
			'button[type="submit"]',
		);
		const originalButtonText = submitButton?.textContent ?? "Submit";
		if (submitButton) {
			submitButton.disabled = true;
			submitButton.textContent = "Sending...";
		}

		document.addEventListener("astro:page-load", initializeContactForm);
		initializeContactForm();
		formStatus.textContent = "";

		try {
			const response = await fetch(contactForm.action, {
				method: contactForm.method,
				body: new FormData(contactForm),
				headers: { Accept: "application/json" },
			});

			if (response.ok) {
				formStatus.textContent = "Thanks for your submission!";
				contactForm.reset();
				return;
			}

			let message = "Oops! There was a problem submitting your form.";
			try {
				const payload: unknown = await response.json();
				if (
					typeof payload === "object" &&
					payload !== null &&
					"errors" in payload &&
					Array.isArray(payload.errors)
				) {
					message =
						payload.errors
							.map(
								(error: { message?: unknown }) => error.message,
							)
							.filter(
								(error): error is string =>
									typeof error === "string",
							)
							.join(", ") || message;
				}
			} catch (error) {
				console.error(
					"The contact form returned an unreadable error response.",
					error,
				);
			}
			formStatus.textContent = message;
		} catch (error) {
			console.error("The contact form request failed.", error);
			formStatus.textContent =
				"Oops! There was a problem submitting your form.";
		} finally {
			if (submitButton) {
				submitButton.disabled = false;
				submitButton.textContent = originalButtonText;
			}
		}
	});
}
