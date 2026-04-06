document.addEventListener("DOMContentLoaded", () => {
    const order = JSON.parse(localStorage.getItem("lastOrder"));

    if (!order) {
        // No order found — redirect to home
        window.location.href = "index.html";
        return;
    }

    document.getElementById("order-code").textContent = order.code;
    document.getElementById("order-date").textContent = order.date;
    document.getElementById("order-total-complete").textContent = order.total;
    document.getElementById("order-payment").textContent = order.payment;

    // Product images preview
    const preview = document.getElementById("order-items-preview");
    (order.items || []).forEach(item => {
        const img = document.createElement("img");
        img.src = item.image;
        img.alt = item.name;
        img.className = "order-preview-img";
        img.title = item.name;
        preview.appendChild(img);
    });

    // Clear lastOrder so refreshing doesn't show stale data
    // (keep it for this session — clear on next visit to shop)
});
