let currentDiscount = 0;

// ─── Validation helpers ───────────────────────────────────────────────────────
const NAME_RE    = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-]{2,}$/;
const EMAIL_RE   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE   = /^[\d\s\+\-\(\)]{7,20}$/;
const CARD_RE    = /^\d{4} \d{4} \d{4} \d{4}$/;
const EXPIRY_RE  = /^(0[1-9]|1[0-2])\/\d{2}$/;
const CVV_RE     = /^\d{3,4}$/;
const ADDR_RE    = /^(?=.*[A-Za-zÀ-ÖØ-öø-ÿ]).{3,}$/;
const CITY_RE    = /^(?=.*[A-Za-zÀ-ÖØ-öø-ÿ]).{2,}$/;

function markField(input, valid) {
    input.style.borderColor = valid ? "" : "var(--red-color, #e53935)";
}

function validateCheckout(paymentMethod) {
    const firstName  = document.getElementById("first-name");
    const lastName   = document.getElementById("last-name");
    const phone      = document.getElementById("phone");
    const email      = document.getElementById("email");
    const street     = document.getElementById("street");
    const country    = document.getElementById("country");
    const city       = document.getElementById("city");

    const checks = [
        { el: firstName, ok: NAME_RE.test(firstName.value.trim()),  msg: "First name must be at least 2 letters, no numbers." },
        { el: lastName,  ok: NAME_RE.test(lastName.value.trim()),   msg: "Last name must be at least 2 letters, no numbers." },
        { el: phone,     ok: PHONE_RE.test(phone.value.trim()),     msg: "Enter a valid phone number." },
        { el: email,     ok: EMAIL_RE.test(email.value.trim()),     msg: "Enter a valid email address." },
        { el: street,    ok: ADDR_RE.test(street.value.trim()),     msg: "Street address must contain letters (e.g. '5 Main St')." },
        { el: country,   ok: country.value !== "",                  msg: "Please select a country." },
        { el: city,      ok: CITY_RE.test(city.value.trim()),       msg: "City name must contain letters." },
    ];

    if (paymentMethod === "card" && _selectedSavedCardIdx === null) {
        const cardNum = document.getElementById("card-number");
        const cardExp = document.getElementById("card-exp");
        const cardCvc = document.getElementById("card-cvc");
        checks.push(
            { el: cardNum, ok: CARD_RE.test(cardNum.value.trim()),   msg: "Enter a valid 16-digit card number." },
            { el: cardExp, ok: EXPIRY_RE.test(cardExp.value.trim()), msg: "Enter a valid expiry date (MM/YY)." },
            { el: cardCvc, ok: CVV_RE.test(cardCvc.value.trim()),    msg: "Enter a valid CVV (3–4 digits)." }
        );
    } else if (paymentMethod !== "card") {
        const ppEmail = document.getElementById("paypal-email");
        checks.push({ el: ppEmail, ok: EMAIL_RE.test(ppEmail.value.trim()), msg: "Enter a valid PayPal email." });
    }

    let firstError = null;
    checks.forEach(c => {
        markField(c.el, c.ok);
        if (!c.ok && !firstError) firstError = c.msg;
    });

    return firstError;
}

// ─── Shipping cost helpers ─────────────────────────────────────────────────────
const CHECKOUT_SHIPPING_COSTS = { free: 0, express: 15, pickup: 0 };

function getCheckoutShippingCost() {
    const selected = document.querySelector('input[name="checkout-shipping"]:checked');
    return selected ? (CHECKOUT_SHIPPING_COSTS[selected.value] || 0) : 0;
}

// ─── Account helpers (standalone — no account.js dependency) ──────────────────
function getCheckoutCurrentUser() {
    const id = localStorage.getItem("decoria_current_user");
    if (!id) return null;
    const accounts = JSON.parse(localStorage.getItem("decoria_accounts")) || [];
    return accounts.find(a => a.id === id) || null;
}

function getUserAddressesCheckout(userId) {
    const all = JSON.parse(localStorage.getItem("decoria_addresses")) || {};
    return all[userId] || { billing: null, shipping: null };
}

function getUserCardsCheckout(userId) {
    const all = JSON.parse(localStorage.getItem("decoria_cards")) || {};
    return all[userId] || [];
}

function saveUserCardsCheckout(userId, cards) {
    const all = JSON.parse(localStorage.getItem("decoria_cards")) || {};
    all[userId] = cards;
    localStorage.setItem("decoria_cards", JSON.stringify(all));
}

// ─── Auto-fill from account ───────────────────────────────────────────────────
function autofillFromAccount() {
    const user = getCheckoutCurrentUser();
    if (!user) return;

    const fill = (id, val) => {
        const el = document.getElementById(id);
        if (el && !el.value.trim() && val) el.value = val;
    };

    fill("first-name", user.firstName);
    fill("last-name",  user.lastName);
    fill("email",      user.email);

    const addrs = getUserAddressesCheckout(user.id);
    const sh = addrs.shipping;
    if (sh) {
        fill("phone",  sh.phone);
        fill("street", sh.street);
        fill("city",   sh.city);
        fill("zip",    sh.zip);
        // Match country select
        const countryEl = document.getElementById("country");
        if (countryEl && !countryEl.value && sh.country) {
            Array.from(countryEl.options).forEach(opt => {
                if (opt.text.trim().toLowerCase() === sh.country.trim().toLowerCase()) {
                    countryEl.value = opt.value || opt.text;
                }
            });
        }
    }

    // Show a soft banner so user knows data was pre-filled
    if (!document.getElementById("autofill-banner")) {
        const banner = document.createElement("div");
        banner.id = "autofill-banner";
        banner.className = "autofill-banner";
        banner.innerHTML = `<i class="fa-regular fa-user"></i> Logged in as <strong>${user.displayName}</strong> — fields pre-filled from your account.`;
        const formsWrap = document.querySelector(".checkout-forms");
        if (formsWrap) formsWrap.insertBefore(banner, formsWrap.firstChild);
    }

    // Render saved cards picker
    renderSavedCardsPicker(user.id);
}

// ─── Saved cards picker ───────────────────────────────────────────────────────
let _selectedSavedCardIdx = null; // null = use new card

function renderSavedCardsPicker(userId) {
    const wrap = document.getElementById("saved-cards-wrap");
    const list = document.getElementById("saved-cards-list");
    if (!wrap || !list) return;

    const cards = getUserCardsCheckout(userId);
    if (cards.length === 0) {
        wrap.style.display = "none";
        _selectedSavedCardIdx = null;
        return;
    }

    wrap.style.display = "block";
    const defaultIdx = cards.findIndex(c => c.isDefault);
    _selectedSavedCardIdx = defaultIdx >= 0 ? defaultIdx : 0;

    list.innerHTML = cards.map((card, idx) => {
        const checked = idx === _selectedSavedCardIdx ? "checked" : "";
        return `<label class="saved-card-option" data-idx="${idx}">
            <input type="radio" name="card-choice" value="saved-${idx}" ${checked}>
            <span class="scl-chip">
                <i class="fa-regular fa-credit-card scl-icon"></i>
                <span class="scl-number">${card.maskedNumber}</span>
                ${card.nickname ? `<span class="scl-nick">${card.nickname}</span>` : ""}
                <span class="scl-exp">Exp ${card.expiry}</span>
            </span>
        </label>`;
    }).join("");

    // Toggle card fields visibility based on selection
    const updateCardFields = () => {
        const selected = document.querySelector('input[name="card-choice"]:checked');
        const cardFields = document.getElementById("card-fields");
        if (!selected || !cardFields) return;
        if (selected.value === "new") {
            cardFields.style.display = "block";
            _selectedSavedCardIdx = null;
        } else {
            cardFields.style.display = "none";
            _selectedSavedCardIdx = parseInt(selected.value.replace("saved-", ""));
        }
    };

    wrap.querySelectorAll('input[name="card-choice"]').forEach(r => r.addEventListener("change", updateCardFields));
    updateCardFields(); // apply on load
}

// ─── Detect unsaved data ──────────────────────────────────────────────────────
function getUnsavedInfo() {
    const user = getCheckoutCurrentUser();
    if (!user) return null;

    const addrs = getUserAddressesCheckout(user.id);
    const street  = document.getElementById("street").value.trim();
    const city    = document.getElementById("city").value.trim();
    const country = document.getElementById("country").value.trim();
    const phone   = document.getElementById("phone").value.trim();
    const zip     = document.getElementById("zip")?.value.trim() || "";
    const firstName = document.getElementById("first-name").value.trim();
    const lastName  = document.getElementById("last-name").value.trim();

    const hasFormShipping = street && city && country;
    const hasNoSavedShipping = !addrs.shipping;

    // Detect unsaved card: only if "new card" path is used
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
    const usingNewCard  = paymentMethod === "card" && _selectedSavedCardIdx === null;
    const rawCard = (document.getElementById("card-number")?.value || "").replace(/\s/g, "");
    const maskedCard = rawCard.length >= 4 ? "**** **** **** " + rawCard.slice(-4) : null;

    const existingCards = getUserCardsCheckout(user.id);
    const cardAlreadySaved = maskedCard && existingCards.some(c => c.maskedNumber === maskedCard);
    const shouldOfferCard  = usingNewCard && maskedCard && !cardAlreadySaved;

    return {
        userId: user.id,
        shouldOfferShipping: hasFormShipping && hasNoSavedShipping,
        shippingData: { firstName, lastName, phone, street, city, country, zip },
        shouldOfferCard,
        cardData: shouldOfferCard ? {
            maskedNumber: maskedCard,
            expiry: document.getElementById("card-exp")?.value.trim() || "",
            nickname: "",
            isDefault: existingCards.length === 0
        } : null
    };
}

// ─── Place order (save to localStorage) ───────────────────────────────────────
function placeOrderToStorage(paymentMethod) {
    const produse = JSON.parse(localStorage.getItem("produse")) || [];
    const subtotal   = produse.reduce((sum, p) => sum + Number(p.finalPrice) * Number(p.quantity), 0);
    const discounted = subtotal * (1 - currentDiscount / 100);
    const shipping   = getCheckoutShippingCost();
    const total      = (discounted + shipping).toFixed(2);

    const orderId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const user    = getCheckoutCurrentUser();
    const now     = new Date();

    // Build masked payment info (never store full card number)
    let paymentInfo = { type: paymentMethod };
    if (paymentMethod === "card") {
        if (_selectedSavedCardIdx !== null && user) {
            // Use saved card
            const cards = getUserCardsCheckout(user.id);
            const card  = cards[_selectedSavedCardIdx];
            paymentInfo.maskedCard = card ? card.maskedNumber : "**** **** **** ????";
        } else {
            const raw = (document.getElementById("card-number")?.value || "").replace(/\s/g, "");
            paymentInfo.maskedCard = raw.length >= 4 ? "**** **** **** " + raw.slice(-4) : "**** **** **** ????";
        }
    } else {
        paymentInfo.paypalEmail = document.getElementById("paypal-email")?.value.trim() || "";
    }

    const order = {
        id:          orderId,
        code:        "#" + orderId,
        date:        now.toISOString(),
        total:       total,
        payment:     paymentMethod === "card" ? "Credit Card" : "PayPal",
        paymentInfo: paymentInfo,
        items:       produse,
        status:      "delivered",
        userId:      user ? user.id : null
    };

    // Save payment method to account profile
    if (user) {
        const accounts = JSON.parse(localStorage.getItem("decoria_accounts")) || [];
        const aIdx = accounts.findIndex(a => a.id === user.id);
        if (aIdx !== -1) {
            accounts[aIdx].savedPaymentMethod = paymentInfo;
            localStorage.setItem("decoria_accounts", JSON.stringify(accounts));
        }
    }

    // For order-complete.html compatibility
    localStorage.setItem("lastOrder", JSON.stringify({
        ...order,
        total: `$${total}`,
        date: now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    }));

    // Save to per-user orders list if logged in
    if (user) {
        const orders = JSON.parse(localStorage.getItem("decoria_orders")) || [];
        orders.push(order);
        localStorage.setItem("decoria_orders", JSON.stringify(orders));
    }

    // Clear cart
    localStorage.removeItem("produse");
    localStorage.removeItem("selectedShipping");
    if (typeof updateCartNr === "function") updateCartNr();
    if (typeof updateCartTotals === "function") updateCartTotals();

    return order;
}

// ─── Save shipping to account ─────────────────────────────────────────────────
function saveShippingToAccount(userId, shippingData) {
    const all = JSON.parse(localStorage.getItem("decoria_addresses")) || {};
    if (!all[userId]) all[userId] = {};
    all[userId].shipping = shippingData;
    localStorage.setItem("decoria_addresses", JSON.stringify(all));
}

// ─── Show Save Data Modal ─────────────────────────────────────────────────────
function showSaveDataModal(info, callback) {
    const overlay    = document.getElementById("save-data-overlay");
    const detail     = document.getElementById("sdo-shipping-detail");
    const sdoRow     = document.getElementById("sdo-shipping");
    const sdoCardRow = document.getElementById("sdo-card");
    const sdoCardDet = document.getElementById("sdo-card-detail");

    if (!overlay) { callback(false); return; }

    const hasAnything = info.shouldOfferShipping || info.shouldOfferCard;
    if (!hasAnything) {
        callback(false);
        return;
    }

    // Populate shipping row
    if (sdoRow) {
        sdoRow.style.display = info.shouldOfferShipping ? "flex" : "none";
        if (info.shouldOfferShipping && detail) {
            const s = info.shippingData;
            detail.textContent = `${s.street}, ${s.city}, ${s.country}`;
        }
    }

    // Populate card row
    if (sdoCardRow) {
        sdoCardRow.style.display = info.shouldOfferCard ? "flex" : "none";
        if (info.shouldOfferCard && sdoCardDet && info.cardData) {
            sdoCardDet.textContent = info.cardData.maskedNumber;
        }
    }

    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";

    const confirmBtn = document.getElementById("confirm-save-btn");
    const skipBtn    = document.getElementById("skip-save-btn");

    function finish(save) {
        overlay.style.display = "none";
        document.body.style.overflow = "";
        confirmBtn.removeEventListener("click", onConfirm);
        skipBtn.removeEventListener("click", onSkip);
        callback(save);
    }

    function onConfirm() { finish(true); }
    function onSkip()    { finish(false); }

    confirmBtn.addEventListener("click", onConfirm);
    skipBtn.addEventListener("click", onSkip);
}

// ─── Show Order Confirmation Modal ────────────────────────────────────────────
function showOrderConfirmationModal(order) {
    const overlay   = document.getElementById("order-confirm-overlay");
    const viewBtn   = document.getElementById("modal-view-orders");
    const user      = getCheckoutCurrentUser();

    if (!overlay) {
        window.location.href = "order-complete.html";
        return;
    }

    document.getElementById("modal-order-code").textContent    = order.code;
    document.getElementById("modal-order-date").textContent    =
        new Date(order.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    document.getElementById("modal-order-total").textContent   = `$${order.total}`;
    document.getElementById("modal-order-payment").textContent = order.payment;

    // Item previews
    const itemsEl = document.getElementById("modal-order-items");
    if (itemsEl) {
        itemsEl.innerHTML = (order.items || []).map(item => {
            const img = Array.isArray(item.image) ? item.image[0] : item.image;
            return `<img src="${img}" alt="${item.name}" class="oc-item-img" title="${item.name} × ${item.quantity}">`;
        }).join("");
    }

    // Hide "View My Orders" if guest
    if (viewBtn) viewBtn.style.display = user ? "" : "none";

    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";
}

// ─── DOMContentLoaded ─────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    // Auto-fill from account (if logged in)
    autofillFromAccount();

    // Restore shipping choice
    const savedShipping = localStorage.getItem("selectedShipping") || "free";
    document.querySelectorAll('input[name="checkout-shipping"]').forEach(r => {
        r.checked = (r.value === savedShipping);
        r.addEventListener("change", () => {
            localStorage.setItem("selectedShipping", r.value);
            calcOrderTotals(currentDiscount);
        });
    });

    renderOrderSummary();
    calcOrderTotals();

    // Payment method toggle
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    const cardFields    = document.getElementById("card-fields");
    const paypalFields  = document.getElementById("paypal-fields");

    paymentRadios.forEach(r => {
        r.addEventListener("change", () => {
            cardFields.style.display   = r.value === "card"   ? "block" : "none";
            paypalFields.style.display = r.value === "paypal" ? "block" : "none";
        });
    });

    // Card number formatting
    const cardInput = document.getElementById("card-number");
    if (cardInput) {
        cardInput.addEventListener("input", () => {
            let val = cardInput.value.replace(/\D/g, "").substring(0, 16);
            cardInput.value = val.match(/.{1,4}/g)?.join(" ") || val;
        });
    }

    // Expiry formatting
    const expInput = document.getElementById("card-exp");
    if (expInput) {
        expInput.addEventListener("input", () => {
            let val = expInput.value.replace(/\D/g, "").substring(0, 4);
            if (val.length >= 2) val = val.substring(0, 2) + "/" + val.substring(2);
            expInput.value = val;
        });
    }

    // CVV — digits only
    const cvvInput = document.getElementById("card-cvc");
    if (cvvInput) {
        cvvInput.addEventListener("input", () => {
            cvvInput.value = cvvInput.value.replace(/\D/g, "").substring(0, 4);
        });
    }

    // Reset field border on user input
    document.querySelectorAll(".checkout-forms input, .checkout-forms select").forEach(el => {
        el.addEventListener("input",  () => markField(el, true));
        el.addEventListener("change", () => markField(el, true));
    });

    // Coupon
    const COUPONS = { "SAVE10": 10, "DECORIA20": 20 };

    document.getElementById("checkout-coupon-btn").addEventListener("click", () => {
        const code = document.getElementById("checkout-coupon").value.trim().toUpperCase();
        if (COUPONS[code]) {
            currentDiscount = COUPONS[code];
            document.getElementById("coupon-applied-row").style.display = "flex";
            document.getElementById("coupon-applied-name").textContent   = code;
            document.getElementById("coupon-discount-val").textContent   = `-${currentDiscount}%`;
            calcOrderTotals(currentDiscount);
            showToast(`Coupon applied! ${currentDiscount}% off`, "success");
        } else {
            showToast("Invalid coupon code.", "error");
        }
    });

    document.getElementById("remove-coupon-btn").addEventListener("click", () => {
        currentDiscount = 0;
        document.getElementById("coupon-applied-row").style.display = "none";
        document.getElementById("checkout-coupon").value = "";
        calcOrderTotals(0);
    });

    // ── Place Order ──────────────────────────────────────────────────────────
    document.getElementById("place-order-btn").addEventListener("click", () => {
        const produse = JSON.parse(localStorage.getItem("produse")) || [];
        if (produse.length === 0) {
            showToast("Your cart is empty.", "error");
            return;
        }

        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        const error = validateCheckout(paymentMethod);
        if (error) {
            showToast(error, "error");
            return;
        }

        const info = getUnsavedInfo(); // null if guest

        // If logged in and there's data to offer saving → show save modal first
        if (info && (info.shouldOfferShipping || info.shouldOfferCard)) {
            showSaveDataModal(info, (save) => {
                if (save) {
                    const saveShipping = document.getElementById("save-shipping-check")?.checked;
                    if (saveShipping && info.shouldOfferShipping) {
                        saveShippingToAccount(info.userId, info.shippingData);
                        showToast("Shipping address saved to your account!", "success");
                    }
                    const saveCard = document.getElementById("save-card-check")?.checked;
                    if (saveCard && info.shouldOfferCard && info.cardData) {
                        const cards = getUserCardsCheckout(info.userId);
                        cards.push(info.cardData);
                        saveUserCardsCheckout(info.userId, cards);
                        showToast("Card saved to your account!", "success");
                    }
                }
                const order = placeOrderToStorage(paymentMethod);
                showOrderConfirmationModal(order);
            });
        } else {
            // Guest or no data to save → place order immediately
            const order = placeOrderToStorage(paymentMethod);
            showOrderConfirmationModal(order);
        }
    });
});

// ─── Order summary render ─────────────────────────────────────────────────────
function renderOrderSummary() {
    const produse   = JSON.parse(localStorage.getItem("produse")) || [];
    const container = document.getElementById("order-summary-items");
    container.innerHTML = "";

    produse.forEach(p => {
        const item = document.createElement("div");
        item.className = "order-summary-item";
        item.innerHTML = `
            <img src="${p.image}" alt="${p.name}">
            <div class="order-summary-item-info">
                <h4>${p.name}</h4>
                <span>Color: ${p.color}</span>
                <div class="item-qty">
                    <span>Qty: ${p.quantity}</span>
                </div>
            </div>
            <span class="item-price">$${(Number(p.finalPrice) * Number(p.quantity)).toFixed(2)}</span>`;
        container.appendChild(item);
    });
}

function calcOrderTotals(discountPercent = 0) {
    const produse  = JSON.parse(localStorage.getItem("produse")) || [];
    const subtotal   = produse.reduce((sum, p) => sum + Number(p.finalPrice) * Number(p.quantity), 0);
    const discounted = subtotal * (1 - discountPercent / 100);
    const shipping   = getCheckoutShippingCost();
    const total      = discounted + shipping;

    document.getElementById("order-subtotal").textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById("order-shipping").textContent = shipping > 0 ? `$${shipping.toFixed(2)}` : "Free";
    document.getElementById("order-total").textContent    = `$${total.toFixed(2)}`;
}
