document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contact-form");

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("contact-name").value.trim();
        const email = document.getElementById("contact-email").value.trim();
        const message = document.getElementById("contact-message").value.trim();

        if (!name || !email || !message) {
            showToast("Please fill in all fields.", "error");
            return;
        }

        if (!email.includes("@")) {
            showToast("Please enter a valid email address.", "error");
            return;
        }

        // Save message to localStorage
        const messages = JSON.parse(localStorage.getItem("contactMessages")) || [];
        messages.push({ name, email, message, date: new Date().toISOString() });
        localStorage.setItem("contactMessages", JSON.stringify(messages));

        form.reset();
        showToast("Message sent successfully! We'll get back to you soon.", "success");
    });
});
