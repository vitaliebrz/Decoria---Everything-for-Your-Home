// ─── Account helpers (shared across all pages) ───────────────────────────────

// Builds a two-letter initials string from first and last name. Returns '?' if both are empty.
function _getInitialsApp(firstName, lastName) {
    const f = (firstName || "").trim()[0] || "";
    const l = (lastName || "").trim()[0] || "";
    return (f + l).toUpperCase() || "?";
}

// Deterministically picks a background colour for the initials avatar based on the first
// character code, so the same user always gets the same colour across page loads.
function _getAvatarInitialsColorApp(initials) {
    const colors = ['#2F7694', '#38CB89', '#FF5630', '#FFC554', '#6C7275', '#377DFF'];
    const idx = (String(initials || '').charCodeAt(0) || 0) % colors.length;
    return colors[idx];
}

// Returns the currently logged-in user profile from supabase-client, or null if unavailable.
function _getCurrentUserApp() {
    return typeof sbCurrentUser === "function" ? sbCurrentUser() : null;
}

// Refreshes all #profile-btn elements to show the user's avatar (or initials) when logged in,
// and the default icon when logged out. Also updates mobile sign-in / log-out buttons.
function updateHeaderProfileBtnGlobal() {
    const user = _getCurrentUserApp();
    document.querySelectorAll("#profile-btn").forEach(btn => {
        if (user) {
            const initials = _getInitialsApp(user.firstName, user.lastName);
            if (user.avatar) {
                btn.innerHTML = `<img src="${user.avatar}" alt="${user.displayName}" class="header-avatar-img">`;
            } else {
                const bgColor = _getAvatarInitialsColorApp(initials);
                btn.innerHTML = `<div class="header-avatar-initials" style="background-color:${bgColor}">${initials}</div>`;
            }
            btn.title = user.displayName;
        } else {
            btn.innerHTML = `<img src="images/user-circle.svg" alt="">`;
            btn.title = "";
        }
    });
    document.querySelectorAll(".mobile-signin-btn").forEach(btn => {
        btn.textContent = user ? "My Account" : "Sign In";
    });
    document.querySelectorAll(".mobile-logout-btn").forEach(btn => {
        btn.style.display = user ? "block" : "none";
    });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Returns the final price after applying a percentage discount, formatted to two decimal places.
function getDiscountPrice(price, discount) {
    return (price - (price * discount) / 100).toFixed(2);
}

// Returns the current cart array from localStorage.
function getCartProducts() {
    return JSON.parse(localStorage.getItem("produse")) || [];
}

// Displays a brief toast notification at the bottom of the page and auto-removes it after 3 s.
function showToast(message, type) {
    const existing = document.querySelector(".newsletter-toast");
    if (existing) existing.remove();

    const iconMap = {
        success: "fa-circle-check",
        error: "fa-circle-xmark",
        warning: "fa-triangle-exclamation"
    };

    const toast = document.createElement("div");
    toast.className = "newsletter-toast";
    toast.innerHTML = `
        <div class="newsletter-alert newsletter-alert--${type}">
            <i class="fa-solid ${iconMap[type]}"></i>
            <span>${message}</span>
        </div>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("newsletter-toast--hide"), 3000);
    setTimeout(() => toast.remove(), 3400);
}

// ─── Product nav link: last visited product ───────────────────────────────────
document.querySelectorAll("[data-nav-product]").forEach(link => {
    const lastId = localStorage.getItem("lastProductId");
    link.href = lastId ? `product.html?id=${lastId}` : "shop.html";
});

// ─── Upper header close ───────────────────────────────────────────────────────
const closePublishBtn = document.querySelector("#close-publicity-btn");
const publishSectionheader = document.querySelector(".upper-header");

const TOP_BANNER_STATE_KEY = "decoriaTopBannerState";

// Returns a scope token ("user:<id>" or "guest") so the banner dismissal is
// isolated per account — logging in or out resets the dismissed state.
function _getTopBannerScope() {
    const user = _getCurrentUserApp();
    return user && user.id ? `user:${user.id}` : "guest";
}

// Reads the persisted top-banner visibility state from localStorage.
function _readTopBannerState() {
    try {
        return JSON.parse(localStorage.getItem(TOP_BANNER_STATE_KEY));
    } catch {
        return null;
    }
}

// Writes the top-banner visibility state to localStorage.
function _writeTopBannerState(state) {
    localStorage.setItem(TOP_BANNER_STATE_KEY, JSON.stringify(state));
}

// Shows or hides the top banner based on the saved dismissal state for the current scope.
// Resets the dismissal when the auth scope changes (logout or different account login).
function _applyTopBannerVisibility() {
    if (!publishSectionheader) return;

    const scope = _getTopBannerScope();
    const state = _readTopBannerState();

    // Reset dismissal when auth scope changes (logout or different account login).
    if (!state || state.scope !== scope) {
        _writeTopBannerState({ scope, closed: false });
        publishSectionheader.style.display = "";
        return;
    }

    publishSectionheader.style.display = state.closed ? "none" : "";
}

if (closePublishBtn && publishSectionheader) {
    closePublishBtn.addEventListener("click", () => {
        _writeTopBannerState({ scope: _getTopBannerScope(), closed: true });
        publishSectionheader.style.display = "none";
    });
}

_applyTopBannerVisibility();
if (typeof onSbReady === "function") {
    onSbReady(() => _applyTopBannerVisibility());
}
window.addEventListener("sb:auth-changed", _applyTopBannerVisibility);
window.addEventListener("sb:auth-changed", updateHeaderProfileBtnGlobal);

// ─── Burger menu ─────────────────────────────────────────────────────────────
const mobileBurgerMenu = document.querySelector("#mobile-burger-menu");
const burgerMenuBtn = document.querySelector("#menu-btn");
const CloseBurgerBtn = document.querySelector("#close-burger-menu");
const burgerInput = document.querySelector("#burger-input");

let isShownBurger = false;

if (burgerMenuBtn && mobileBurgerMenu) {
    burgerMenuBtn.addEventListener("click", () => {
        isShownBurger = !isShownBurger;
        mobileBurgerMenu.style.display = isShownBurger ? "grid" : "none";
        if (!isShownBurger && burgerInput) burgerInput.value = "";
    });
}

if (CloseBurgerBtn && mobileBurgerMenu) {
    CloseBurgerBtn.addEventListener("click", () => {
        mobileBurgerMenu.style.display = "none";
        if (burgerInput) burgerInput.value = "";
        isShownBurger = false;
    });
}

// ─── Flyout cart ─────────────────────────────────────────────────────────────
const cartWindow = document.querySelector(".cart-window");
const cartWindowProducts = document.querySelector("#products-section");
const closeCartWindow = document.querySelector("#close-cart-window");
const cartOverlay = document.querySelector(".cart-overlay");

// Renders all current cart items into the flyout panel with quantity controls and a remove button.
function showCartProducts() {
    if (!cartWindowProducts) return;
    const cartProducts = getCartProducts();
    cartWindowProducts.innerHTML = "";

    if (cartProducts.length === 0) {
        cartWindowProducts.innerHTML = `<p style="padding:16px;color:var(--neutral04)">Cart is empty</p>`;
        return;
    }

    cartProducts.forEach(product => {
        // A "variant" is the combination of id + color + size.
        // Two items with the same id but different color/size are separate cart lines.
        function variantMatch(p) {
            return p.id === product.id &&
                p.color === product.color &&
                (p.size || null) === (product.size || null);
        }

        const item = document.createElement("div");
        item.className = "cart-item";
        item.innerHTML = `
        <div class="cart-item-info">
            <div class="item">
                <div class="cart-product-img" style="cursor:pointer" data-product-id="${product.id}">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="item-info">
                    <h4 style="cursor:pointer" data-product-id="${product.id}">${product.name}</h4>
                    <span><span style="font-weight:600;color:#000">Color :</span> ${product.color}</span>
                    ${product.size ? `<span><span style="font-weight:600;color:#000">Size :</span> ${product.size}</span>` : ""}
                    <div class="product-quantity">
                        <button class="minus"><i class="fa-solid fa-minus"></i></button>
                        <span class="prod-qnt">${product.quantity}</span>
                        <button class="plus"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>
            </div>
            <div class="product-price">
                <p>$${Number(product.finalPrice).toFixed(2)}</p>
                <button class="removeCartProduct"><i class="fa-solid fa-xmark"></i></button>
            </div>
        </div>`;

        item.querySelectorAll("[data-product-id]").forEach(el => {
            el.addEventListener("click", () => {
                window.location.href = `product.html?id=${product.id}`;
            });
        });

        const removeBtn = item.querySelector(".removeCartProduct");
        const plusBtn = item.querySelector(".plus");
        const minusBtn = item.querySelector(".minus");

        removeBtn.addEventListener("click", () => {
            const produse = getCartProducts().filter(p => !variantMatch(p));
            saveCart(produse);
            showCartProducts();
            // Reset card button only if no variant of this product remains in cart
            const stillInCart = getCartProducts().some(p => p.id === product.id);
            if (!stillInCart) {
                document.querySelectorAll(".card").forEach(card => {
                    const title = card.querySelector("h3");
                    const btn = card.querySelector(".add-to-cartBtn");
                    if (title && btn && title.textContent === product.name) {
                        btn.innerHTML = "Add to Cart";
                        btn.classList.remove("added");
                    }
                });
            }
        });

        plusBtn.addEventListener("click", () => {
            const produse = getCartProducts();
            const found = produse.find(p => variantMatch(p));
            if (found) {
                found.quantity++;
                saveCart(produse);
                showCartProducts();
            }
        });

        minusBtn.addEventListener("click", () => {
            let produse = getCartProducts();
            const found = produse.find(p => variantMatch(p));
            if (found) {
                found.quantity--;
                if (found.quantity <= 0) {
                    produse = produse.filter(p => !variantMatch(p));
                    const stillInCart = produse.some(p => p.id === product.id);
                    if (!stillInCart) {
                        document.querySelectorAll(".card").forEach(card => {
                            const title = card.querySelector("h3");
                            const btn = card.querySelector(".add-to-cartBtn");
                            if (title && btn && title.textContent === product.name) {
                                btn.innerHTML = "Add to Cart";
                                btn.classList.remove("added");
                            }
                        });
                    }
                }
                saveCart(produse);
                showCartProducts();
            }
        });

        cartWindowProducts.appendChild(item);
    });
}

// Re-renders cart contents and locks page scroll while the flyout is open.
function openCartWindow() {
    if (!cartWindow || !cartOverlay) return;
    showCartProducts();
    updateCartTotals();
    cartWindow.style.display = "block";
    cartOverlay.style.display = "block";
    document.body.style.overflow = "hidden";
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".bag-btn").forEach(btn => {
        btn.addEventListener("click", openCartWindow);
    });
});

if (closeCartWindow && cartWindow && cartOverlay) {
    closeCartWindow.addEventListener("click", () => {
        cartWindow.style.display = "none";
        cartOverlay.style.display = "none";
        document.body.style.overflow = "";
    });
}

const cartClearAll = document.querySelector("#cart-clear-all");
if (cartClearAll) {
    cartClearAll.addEventListener("click", () => {
        localStorage.setItem("produse", JSON.stringify([]));
        showCartProducts();
        updateCartNr();
        updateCartTotals();
        window.dispatchEvent(new CustomEvent("cart:cleared"));
    });
}

if (cartOverlay && cartWindow) {
    cartOverlay.addEventListener("click", () => {
        cartWindow.style.display = "none";
        cartOverlay.style.display = "none";
        document.body.style.overflow = "";
    });
}

// ─── Flyout wishlist ─────────────────────────────────────────────────────────
const wishlistWindow = document.querySelector(".wishlist-window");
const wishlistOverlay = document.querySelector(".wishlist-overlay");
const closeWishlistWindow = document.querySelector("#close-wishlist-window");
const wishlistWindowProducts = document.querySelector("#wishlist-products-section");

// Renders all wishlisted products into the flyout panel. Shows live pricing,
// rating, and an "Add to Cart" / "Go to Cart" toggle for each item.
function showWishlistProducts() {
    if (!wishlistWindowProducts) return;
    const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    wishlistWindowProducts.innerHTML = "";

    if (wishlist.length === 0) {
        wishlistWindowProducts.innerHTML = `<p style="padding:16px;color:var(--neutral04)">Wishlist is empty</p>`;
        return;
    }

    wishlist.forEach(product => {
        const mainImage = Array.isArray(product.image) ? product.image[0] : (product.image || "");
        const productData = typeof products !== "undefined" ? products.find(p => p.id === product.id) : null;
        const hasDiscount = productData && productData.discount > 0;
        const discountPct = productData ? productData.discount : 0;
        const rating = productData ? productData.rating : null;
        const reviews = productData ? productData.reviews : null;

        const item = document.createElement("div");
        item.className = "wishlist-item";
        item.innerHTML = `
        <div class="wishlist-item-img" style="cursor:pointer" data-product-id="${product.id}">
            <img src="${mainImage}" alt="${product.name}">
        </div>
        <div class="wishlist-item-info">
            <div class="wishlist-item-top">
                <h4 style="cursor:pointer" data-product-id="${product.id}">${product.name}</h4>
                <button class="wishlist-remove-btn" title="Remove"><i class="fa-solid fa-heart"></i></button>
            </div>
            ${rating !== null ? `<div class="wishlist-item-rating"><i class="fa-solid fa-star"></i> <span>${rating.toFixed(1)}</span> <span class="wishlist-reviews">(${reviews})</span></div>` : ''}
            ${hasDiscount ? `<div class="wishlist-item-prices">
                <span class="wishlist-old-price">$<s>${productData.price.toFixed(2)}</s></span>
                <span class="wishlist-discount-pct">-${discountPct}%</span>
            </div>` : ''}
            <div class="wishlist-final-price">$${Number(product.finalPrice).toFixed(2)}</div>
            <button class="wishlist-add-cart-btn" data-product-id="${product.id}">
                ${isProductInCart(product.id) ? '<i class="fa-solid fa-circle-check"></i> Added — Go to Cart' : 'Add to Cart'}
            </button>
        </div>`;

        item.querySelectorAll("[data-product-id]").forEach(el => {
            if (!el.classList.contains("wishlist-add-cart-btn")) {
                el.addEventListener("click", () => {
                    window.location.href = `product.html?id=${product.id}`;
                });
            }
        });

        item.querySelector(".wishlist-remove-btn").addEventListener("click", () => {
            let wl = JSON.parse(localStorage.getItem("wishlist")) || [];
            wl = wl.filter(p => p.id !== product.id);
            localStorage.setItem("wishlist", JSON.stringify(wl));
            updateWishlistNr();
            showWishlistProducts();
            window.dispatchEvent(new CustomEvent("wishlist:updated"));
        });

        const addCartBtn = item.querySelector(".wishlist-add-cart-btn");
        addCartBtn.addEventListener("click", () => {
            if (isProductInCart(product.id)) {
                window.location.href = "cart.html";
                return;
            }
            if (typeof addToCartList === "function" && productData) {
                addToCartList(product.id, addCartBtn);
                addCartBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Added — Go to Cart';
            }
        });

        wishlistWindowProducts.appendChild(item);
    });
}

// Re-renders wishlist contents and locks page scroll while the flyout is open.
function openWishlistWindow() {
    if (!wishlistWindow || !wishlistOverlay) return;
    showWishlistProducts();
    wishlistWindow.style.display = "flex";
    wishlistOverlay.style.display = "block";
    document.body.style.overflow = "hidden";
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".wishlist-btn").forEach(btn => {
        btn.addEventListener("click", openWishlistWindow);
    });
});

if (closeWishlistWindow && wishlistWindow && wishlistOverlay) {
    closeWishlistWindow.addEventListener("click", () => {
        wishlistWindow.style.display = "none";
        wishlistOverlay.style.display = "none";
        document.body.style.overflow = "";
    });
}

const wishlistClearAll = document.querySelector("#wishlist-clear-all");
if (wishlistClearAll) {
    wishlistClearAll.addEventListener("click", () => {
        localStorage.setItem("wishlist", JSON.stringify([]));
        updateWishlistNr();
        showWishlistProducts();
        window.dispatchEvent(new CustomEvent("wishlist:cleared"));
        window.dispatchEvent(new CustomEvent("wishlist:updated"));
    });
}

if (wishlistOverlay && wishlistWindow) {
    wishlistOverlay.addEventListener("click", () => {
        wishlistWindow.style.display = "none";
        wishlistOverlay.style.display = "none";
        document.body.style.overflow = "";
    });
}

// ─── Profile button → account.html ───────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    onSbReady(() => updateHeaderProfileBtnGlobal());

    document.querySelectorAll("#profile-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            window.location.href = "account.html";
        });
    });

    document.querySelectorAll(".mobile-signin-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            window.location.href = "account.html";
        });
    });

    document.querySelectorAll(".mobile-logout-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const currentCart = JSON.parse(localStorage.getItem("produse")) || [];
            const currentWl   = JSON.parse(localStorage.getItem("wishlist")) || [];
            if (typeof sbSyncCart     === "function") await sbSyncCart(currentCart);
            if (typeof sbSyncWishlist === "function") await sbSyncWishlist(currentWl);
            if (typeof sbSignOut      === "function") await sbSignOut();
            localStorage.setItem("produse",   JSON.stringify([]));
            localStorage.setItem("wishlist",  JSON.stringify([]));
            if (typeof updateCartNr     === "function") updateCartNr();
            if (typeof updateCartTotals === "function") updateCartTotals();
            updateHeaderProfileBtnGlobal();
            window.location.href = "index.html";
        });
    });
});

// ─── Resize ───────────────────────────────────────────────────────────────────
window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024) {
        if (mobileBurgerMenu) mobileBurgerMenu.style.display = "none";
        if (cartWindow) cartWindow.style.display = "none";
        if (cartOverlay) cartOverlay.style.display = "none";
        if (wishlistWindow) wishlistWindow.style.display = "none";
        if (wishlistOverlay) wishlistOverlay.style.display = "none";
        document.body.style.overflow = "";
        isShownBurger = false;
    }
});

// ─── Search ───────────────────────────────────────────────────────────────────

// Filters the products array by name or category against a query string.
// products is defined in products.js which is loaded before app.js on every page.
// Guard handles pages that don't include products.js (e.g. blog, contact).
function searchProducts(query) {
    if (typeof products === "undefined") return [];
    const q = query.toLowerCase().trim();
    return products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
}

// Renders search result items into the given container, or a "no results" message if empty.
function renderSearchResults(results, container) {
    container.innerHTML = "";
    if (results.length === 0) {
        container.innerHTML = `<div class="search-no-results">No products found.</div>`;
        return;
    }
    results.forEach(p => {
        const mainImage = Array.isArray(p.image) ? p.image[0] : p.image;
        const finalPrice = getDiscountPrice(p.price, p.discount);
        const item = document.createElement("div");
        item.className = "search-result-item";
        item.innerHTML = `
            <img src="${mainImage}" alt="${p.name}" class="search-result-img">
            <div class="search-result-info">
                <span class="search-result-name">${p.name}</span>
                <span class="search-result-category">${p.category}</span>
            </div>
            <span class="search-result-price">$${finalPrice}</span>`;
        item.addEventListener("click", () => {
            window.location.href = `product.html?id=${p.id}`;
        });
        container.appendChild(item);
    });
}

// Desktop search
const searchBtn = document.querySelector("#search-btn");
const searchBarWrap = document.querySelector("#search-bar-wrap");
const searchBarInput = document.querySelector("#search-bar-input");
const searchBarClose = document.querySelector("#search-bar-close");
const searchResults = document.querySelector("#search-results");
const desktopNav = document.querySelector(".desktop-header nav");

// Shows the desktop search bar and hides the navigation links.
function openDesktopSearch() {
    if (!searchBarWrap) return;
    searchBarWrap.style.display = "flex";
    if (desktopNav) desktopNav.style.display = "none";
    if (searchBarInput) searchBarInput.focus();
}

// Hides the desktop search bar, restores navigation links, and clears the input and results.
function closeDesktopSearch() {
    if (!searchBarWrap) return;
    searchBarWrap.style.display = "none";
    if (desktopNav) desktopNav.style.display = "";
    if (searchBarInput) searchBarInput.value = "";
    if (searchResults) {
        searchResults.innerHTML = "";
        searchResults.style.display = "none";
    }
}

if (searchBtn) searchBtn.addEventListener("click", openDesktopSearch);
if (searchBarClose) searchBarClose.addEventListener("click", closeDesktopSearch);

if (searchBarInput && searchResults) {
    searchBarInput.addEventListener("input", () => {
        const q = searchBarInput.value.trim();
        if (q.length < 2) {
            searchResults.innerHTML = "";
            searchResults.style.display = "none";
            return;
        }
        const results = searchProducts(q);
        renderSearchResults(results, searchResults);
        searchResults.style.display = "block";
    });
}

// Mobile burger search
const burgerSearchResults = document.querySelector("#burger-search-results");

if (burgerInput && burgerSearchResults) {
    burgerInput.addEventListener("input", () => {
        const q = burgerInput.value.trim();
        if (q.length < 2) {
            burgerSearchResults.innerHTML = "";
            burgerSearchResults.style.display = "none";
            return;
        }
        const results = searchProducts(q);
        renderSearchResults(results, burgerSearchResults);
        burgerSearchResults.style.display = "block";
    });
}

// ─── Newsletter ───────────────────────────────────────────────────────────────
const newsletterBtn = document.querySelector("#newsletter-sent-email");
const emailInput = document.querySelector("#emailInput");

if (newsletterBtn && emailInput) {
    newsletterBtn.addEventListener("click", () => {
        const email = emailInput.value.trim();
        // Basic format guard — full RFC validation happens server-side in production.
        if (!email || !email.includes("@")) {
            showToast("Please enter a valid email address.", "error");
            return;
        }
        let subscribers = JSON.parse(localStorage.getItem("newsletter")) || [];
        if (subscribers.includes(email)) {
            showToast("This email is already subscribed!", "warning");
            return;
        }
        subscribers.push(email);
        localStorage.setItem("newsletter", JSON.stringify(subscribers));
        emailInput.value = "";
        showToast("You've successfully subscribed to our newsletter!", "success");
    });
}
