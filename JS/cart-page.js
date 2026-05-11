const cartPageItems = document.getElementById("cart-page-items");
const cartPageSubtotal = document.getElementById("cart-page-subtotal");
const cartPageTotal = document.getElementById("cart-page-total");
const shippingRadios = document.querySelectorAll('input[name="shipping"]');

const SHIPPING_COSTS = { free: 0, express: 15, pickup: 0 };
const COUPONS = { "SAVE10": 10, "DECORIA20": 20 };
let appliedCouponDiscount = 0;

// Returns the shipping cost in dollars for the currently selected shipping option.
function getShippingCost() {
    const selected = document.querySelector('input[name="shipping"]:checked');
    return selected ? SHIPPING_COSTS[selected.value] : 0;
}

// Persists the selected shipping method to localStorage so checkout.js can restore it.
function saveShippingChoice() {
    const selected = document.querySelector('input[name="shipping"]:checked');
    if (selected) localStorage.setItem("selectedShipping", selected.value);
}

// Recalculates and displays the cart subtotal and grand total,
// applying any active coupon discount and the selected shipping cost.
function calcCartPageTotals() {
    const produse = JSON.parse(localStorage.getItem("produse")) || [];
    const subtotal = produse.reduce((sum, p) => sum + Number(p.finalPrice) * Number(p.quantity), 0);
    const discounted = subtotal * (1 - appliedCouponDiscount / 100);
    const shipping = getShippingCost();
    const total = discounted + shipping;

    cartPageSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    cartPageTotal.textContent = `$${total.toFixed(2)}`;
}

// Renders the full cart table from localStorage, creates quantity controls for each row,
// and disables the checkout button when the cart is empty.
function renderCartPage() {
    const produse = JSON.parse(localStorage.getItem("produse")) || [];
    cartPageItems.innerHTML = "";

    const checkoutBtn = document.querySelector(".checkout-page-btn");
    if (produse.length === 0) {
        cartPageItems.innerHTML = `<div style="padding:40px 0;color:var(--neutral04);text-align:center">
            Your cart is empty. <a href="shop.html" style="color:var(--neutrals);font-weight:600">Continue Shopping</a>
        </div>`;
        if (checkoutBtn) {
            checkoutBtn.style.pointerEvents = "none";
            checkoutBtn.style.opacity = "0.45";
            checkoutBtn.setAttribute("aria-disabled", "true");
        }
        calcCartPageTotals();
        return;
    }
    if (checkoutBtn) {
        checkoutBtn.style.pointerEvents = "";
        checkoutBtn.style.opacity = "";
        checkoutBtn.removeAttribute("aria-disabled");
    }

    produse.forEach(product => {
        // A "variant" matches id + color + size so each combination is a separate cart line.
        function variantMatch(i) {
            return i.id === product.id &&
                i.color === product.color &&
                (i.size || null) === (product.size || null);
        }

        const row = document.createElement("div");
        row.className = "cart-page-row";
        const lineTotal = (Number(product.finalPrice) * Number(product.quantity)).toFixed(2);

        row.innerHTML = `
            <div class="cart-page-product">
                <img src="${product.image}" alt="${product.name}">
                <div class="cart-page-product-info">
                    <h4>${product.name}</h4>
                    <span><span style="font-weight:600;color:#000">Color :</span> ${product.color}</span>
                    ${product.size ? `<span><span style="font-weight:600;color:#000">Size :</span> ${product.size}</span>` : ""}
                </div>
            </div>
            <div class="product-quantity">
                <button class="minus"><i class="fa-solid fa-minus"></i></button>
                <span class="qty-display">${product.quantity}</span>
                <button class="plus"><i class="fa-solid fa-plus"></i></button>
            </div>
            <div class="cart-page-price">$${Number(product.finalPrice).toFixed(2)}</div>
            <div class="cart-page-subtotal-cell">$${lineTotal}</div>
            <button class="remove-btn"><i class="fa-solid fa-xmark"></i></button>
        `;

        // Removes this variant from the cart entirely.
        row.querySelector(".remove-btn").addEventListener("click", () => {
            const p = JSON.parse(localStorage.getItem("produse")) || [];
            saveCart(p.filter(i => !variantMatch(i)));
            renderCartPage();
        });

        // Decrements quantity; removes the item when it reaches zero.
        row.querySelector(".minus").addEventListener("click", () => {
            const p = JSON.parse(localStorage.getItem("produse")) || [];
            const item = p.find(i => variantMatch(i));
            if (!item) return;
            item.quantity--;
            saveCart(item.quantity <= 0 ? p.filter(i => !variantMatch(i)) : p);
            renderCartPage();
        });

        // Increments quantity by one.
        row.querySelector(".plus").addEventListener("click", () => {
            const p = JSON.parse(localStorage.getItem("produse")) || [];
            const item = p.find(i => variantMatch(i));
            if (!item) return;
            item.quantity++;
            saveCart(p);
            renderCartPage();
        });

        cartPageItems.appendChild(row);
    });

    calcCartPageTotals();
}

shippingRadios.forEach(r => r.addEventListener("change", () => {
    saveShippingChoice();
    calcCartPageTotals();
}));

// Validates the coupon code against the hardcoded list and applies the discount.
document.getElementById("coupon-apply-btn").addEventListener("click", () => {
    const code = document.getElementById("coupon-input").value.trim().toUpperCase();
    if (COUPONS[code]) {
        appliedCouponDiscount = COUPONS[code];
        showToast(`Coupon applied! ${COUPONS[code]}% off your order.`, "success");
        calcCartPageTotals();
    } else {
        showToast("Invalid coupon code.", "error");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem("selectedShipping");
    if (saved) {
        const radio = document.querySelector(`input[name="shipping"][value="${saved}"]`);
        if (radio) radio.checked = true;
    }
    // Always persist the currently checked option so checkout picks it up.
    saveShippingChoice();
    renderCartPage();
});
