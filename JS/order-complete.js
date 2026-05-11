// ─── Order Complete Page ──────────────────────────────────────────────────────
// Reads the last placed order from localStorage and renders a confirmation summary.
// If no order data is found (e.g. direct URL visit), redirects to the home page.

document.addEventListener("DOMContentLoaded", () => {
    const order = JSON.parse(localStorage.getItem("lastOrder"));

    if (!order) {
        // No order found — redirect to home to prevent showing an empty confirmation.
        window.location.href = "index.html";
        return;
    }

    document.getElementById("order-code").textContent = order.code;
    document.getElementById("order-date").textContent = order.date;
    document.getElementById("order-total-complete").textContent = order.total;
    document.getElementById("order-payment").textContent = order.payment;

    // Renders a small thumbnail for each item in the order.
    const preview = document.getElementById("order-items-preview");
    (order.items || []).forEach(item => {
        const img = document.createElement("img");
        img.src = item.image;
        img.alt = item.name;
        img.className = "order-preview-img";
        img.title = item.name;
        preview.appendChild(img);
    });

    // lastOrder is intentionally kept in localStorage for this session;
    // it will be overwritten when the user places a new order.
});
