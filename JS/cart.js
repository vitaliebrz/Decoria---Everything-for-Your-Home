// "produse" is Romanian for "products" — the localStorage key used throughout the app.
const cartArticlesNr = document.querySelectorAll(".cart-articlesNr");

// Returns the first image from an array, or the value itself when it's already a string.
function getMainImage(image) {
    if (Array.isArray(image)) return image[0] || "";
    return image || "";
}

// Products added from the product page can carry the full image array.
// This normalises them to a single string so cart renders consistently.
function normalizeCartImages() {
    const produse = JSON.parse(localStorage.getItem("produse")) || [];
    const normalized = produse.map((p) => ({
        ...p,
        image: getMainImage(p.image)
    }));
    localStorage.setItem("produse", JSON.stringify(normalized));
}

// Toggles a product in/out of the cart by ID and updates the button state.
// Matching is by ID only here — color/size variants are handled on the product page.
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
            color: produs.color,
            size: (produs.sizes && produs.sizes.length > 0) ? produs.sizes[0] : null
        });
        button.innerHTML = `<i class="fa-solid fa-circle-check"></i><span class="added-label"> Added —</span> Go to Cart`;
        button.classList.add("added");
    }

    saveCart(produse);
    updateCartNr();
    updateCartTotals();
    notifyCartUpdated();
}

// Returns true if any cart item matches the given product ID.
function isProductInCart(id) {
    const produse = JSON.parse(localStorage.getItem("produse")) || [];
    return produse.some(p => p.id === id);
}

// Returns the total item count (sum of quantities), not the number of distinct products.
function nrProductsInCart() {
    const produse = JSON.parse(localStorage.getItem("produse")) || [];
    return produse.reduce((total, p) => {
        const qty = Number(p.quantity);
        return total + (isFinite(qty) && qty > 0 ? qty : 1);
    }, 0);
}

// Updates all badge elements in the header with the current total item count.
function updateCartNr() {
    const count = nrProductsInCart();
    document.querySelectorAll(".cart-articlesNr").forEach(span => {
        span.textContent = count;
    });
}

// Recalculates the cart subtotal and writes it to the flyout and cart-page elements.
function updateCartTotals() {
    const produse = JSON.parse(localStorage.getItem("produse")) || [];
    const subtotal = produse.reduce((sum, p) => sum + Number(p.finalPrice) * Number(p.quantity), 0);
    const subtotalEl = document.querySelector("#cart-subtotal");
    const totalEl = document.querySelector("#cart-total");
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${subtotal.toFixed(2)}`;
}

// Fires the custom 'cart:updated' event so other modules (e.g. supabase-client) can react.
function notifyCartUpdated() {
    window.dispatchEvent(new CustomEvent("cart:updated"));
}

// Single write point for cart mutations — always use this instead of writing
// to localStorage directly so counters and the Supabase sync stay in step.
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
