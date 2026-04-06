const cartArticlesNr = document.querySelectorAll(".cart-articlesNr");

function getMainImage(image) {
    if (Array.isArray(image)) return image[0] || "";
    return image || "";
}

function normalizeCartImages() {
    const produse = JSON.parse(localStorage.getItem("produse")) || [];
    const normalized = produse.map((p) => ({
        ...p,
        image: getMainImage(p.image)
    }));
    localStorage.setItem("produse", JSON.stringify(normalized));
}

function addToCartList(id, button) {
    let produse = JSON.parse(localStorage.getItem("produse")) || [];
    const produs = products.find(p => p.id === id);
    const indexProdusGasit = produse.findIndex(p => p.id === id);

    if (!produs) return;

    if (indexProdusGasit !== -1) {
        produse.splice(indexProdusGasit, 1);
        button.innerHTML = "Add to Cart";
        button.classList.remove("added");
    } else {
        produse.push({
            id: produs.id,
            name: produs.name,
            finalPrice: calculeazaPretFinal(produs),
            quantity: 1,
            image: getMainImage(produs.image),
            color: produs.color
        });
        button.innerHTML = `<i class="fa-solid fa-circle-check"></i> Added — Go to Cart`;
        button.classList.add("added");
    }

    saveCart(produse);
    updateCartNr();
    updateCartTotals();
    notifyCartUpdated();
}

function isProductInCart(id) {
    const produse = JSON.parse(localStorage.getItem("produse")) || [];
    return produse.some(p => p.id === id);
}

function nrProductsInCart() {
    const produse = JSON.parse(localStorage.getItem("produse")) || [];
    return produse.reduce((total, p) => {
        const qty = Number(p.quantity);
        return total + (isFinite(qty) && qty > 0 ? qty : 1);
    }, 0);
}

function updateCartNr() {
    const count = nrProductsInCart();
    document.querySelectorAll(".cart-articlesNr").forEach(span => {
        span.textContent = count;
    });
}

function updateCartTotals() {
    const produse = JSON.parse(localStorage.getItem("produse")) || [];
    const subtotal = produse.reduce((sum, p) => sum + Number(p.finalPrice) * Number(p.quantity), 0);
    const subtotalEl = document.querySelector("#cart-subtotal");
    const totalEl = document.querySelector("#cart-total");
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${subtotal.toFixed(2)}`;
}

function notifyCartUpdated() {
    window.dispatchEvent(new CustomEvent("cart:updated"));
}

function saveCart(produse) {
    localStorage.setItem("produse", JSON.stringify(produse));
    updateCartNr();
    updateCartTotals();
    notifyCartUpdated();
}

document.addEventListener("DOMContentLoaded", () => {
    normalizeCartImages();
    updateCartNr();
    updateCartTotals();
    updateWishlistNr();
});
