const shopCards = document.querySelector("#shop-cards");
const showMoreBtn = document.querySelector("#show-more-btn");
const categoryBtns = document.querySelectorAll(".category-btn");
const priceBtns = document.querySelectorAll(".price-btn");
const gridBtn4 = document.querySelector("#grid-4-btn");
const gridBtn3 = document.querySelector("#grid-3-btn");
const gridBtn2 = document.querySelector("#grid-2-btn");
const tabletGrid3Btn = document.querySelector("#tablet-grid-3-btn");
const tabletGrid2Btn = document.querySelector("#tablet-grid-2-btn");
const phoneGrid2Btn = document.querySelector("#phone-grid-2-btn");
const phoneGrid1Btn = document.querySelector("#phone-grid-1-btn");

let visibleCount = 8;
const INITIAL_VISIBLE_COUNT = 8;
const SHOW_MORE_STEP = 4;
let activeCategory = "all";
let activeMinPrice = 0;
let activeMaxPrice = 999999;
let activeSort = "default";

// ─── Custom dropdown ────────────────────────────────────────────────────────
// Returns a controller object with setValue() so external code (URL params,
// sidebar buttons) can sync the dropdown display without triggering onChange.
function initDropdown(dropdownEl, onChange) {
    if (!dropdownEl) return { setValue: () => { } };

    const trigger = dropdownEl.querySelector(".dropdown-trigger");
    const selectedSpan = dropdownEl.querySelector(".dropdown-selected");
    const items = dropdownEl.querySelectorAll(".dropdown-item");

    trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = dropdownEl.classList.contains("open");
        document.querySelectorAll(".custom-dropdown.open").forEach(d => d.classList.remove("open"));
        if (!isOpen) dropdownEl.classList.add("open");
    });

    items.forEach(item => {
        item.addEventListener("click", (e) => {
            e.stopPropagation();
            items.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            selectedSpan.textContent = item.textContent.trim();
            dropdownEl.classList.remove("open");
            onChange(item.dataset.value);
        });
    });

    return {
        setValue(value) {
            const item = [...items].find(i => i.dataset.value === value);
            if (!item) return;
            items.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            selectedSpan.textContent = item.textContent.trim();
        }
    };
}

// Close all dropdowns on outside click
document.addEventListener("click", () => {
    document.querySelectorAll(".custom-dropdown.open").forEach(d => d.classList.remove("open"));
});

// Init all three dropdowns
const categoryDropdownCtrl = initDropdown(
    document.getElementById("category-dropdown"),
    (value) => {
        activeCategory = value;
        categoryBtns.forEach(b => b.classList.toggle("active", b.dataset.category === value));
        visibleCount = INITIAL_VISIBLE_COUNT;
        renderShopCards();
    }
);

const priceDropdownCtrl = initDropdown(
    document.getElementById("price-dropdown"),
    (value) => {
        const [min, max] = value.split(",").map(parseFloat);
        activeMinPrice = isNaN(min) ? 0 : min;
        activeMaxPrice = isNaN(max) ? 999999 : max;
        visibleCount = INITIAL_VISIBLE_COUNT;
        renderShopCards();
    }
);

const sortDropdownCtrl = initDropdown(
    document.getElementById("sort-dropdown"),
    (value) => {
        activeSort = value;
        visibleCount = INITIAL_VISIBLE_COUNT;
        renderShopCards();
    }
);

// ─── Filter helpers ─────────────────────────────────────────────────────────

// Returns a filtered and sorted copy of the products array based on the active
// category, price range, and sort option.
function getFilteredProducts() {
    let filtered = [...products];

    if (activeCategory !== "all") {
        filtered = filtered.filter(p => p.category === activeCategory);
    }

    filtered = filtered.filter(p => {
        const finalPrice = parseFloat(getDiscountPrice(p.price, p.discount));
        return finalPrice >= activeMinPrice && finalPrice <= activeMaxPrice;
    });

    if (activeSort === "new") {
        filtered = filtered.filter(p => p.new === true);
    } else if (activeSort === "price-asc") {
        filtered.sort((a, b) => parseFloat(getDiscountPrice(a.price, a.discount)) - parseFloat(getDiscountPrice(b.price, b.discount)));
    } else if (activeSort === "price-desc") {
        filtered.sort((a, b) => parseFloat(getDiscountPrice(b.price, b.discount)) - parseFloat(getDiscountPrice(a.price, a.discount)));
    } else if (activeSort === "name-asc") {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
}

// Returns true when the shop grid is currently in an extended (single- or two-column) view
// that shows the inline description and action buttons instead of hover overlays.
function isExtendedCardView() {
    return shopCards.classList.contains("tablet-2")
        || shopCards.classList.contains("phone-1")
        || shopCards.classList.contains("desktop-2");
}

// ─── Render ─────────────────────────────────────────────────────────────────

// Clears and re-renders the visible shop cards based on active filters and the current
// visible count. Also updates the Show More / Show Less button visibility.
function renderShopCards() {
    shopCards.innerHTML = "";
    const filtered = getFilteredProducts();
    const toShow = filtered.slice(0, visibleCount);

    if (toShow.length === 0) {
        shopCards.innerHTML = "<p style='color:var(--neutral04);padding:40px 0'>No products found.</p>";
        showMoreBtn.style.display = "none";
        return;
    }

    const extended = isExtendedCardView();

    toShow.forEach(product => {
        const finalPrice = getDiscountPrice(product.price, product.discount);
        const card = document.createElement("div");
        card.className = "card";

        const mainImage = Array.isArray(product.image) ? product.image[0] : product.image;

        card.innerHTML = `
        <div class="card-img">
            ${product.new ? '<span class="badge">NEW</span>' : ''}
            ${product.discount > 0 ? `<span class="discount${!product.new ? ' discount-only' : ''}">-${product.discount}%</span>` : ''}
            <button class="likebtn notactive"><i class="fa-regular fa-heart"></i></button>
            <img src="${mainImage}" alt="${product.name}">
            <button class="add-to-cartBtn notactive">Add to cart</button>
        </div>
        <div class="card-info">
            <div class="product-rating">${renderStars(product.rating)}</div>
            <h3>${product.name}</h3>
            <div class="price">
                $${finalPrice}
                ${product.discount > 0 ? `<small class="old-price">$<s>${product.price.toFixed(2)}</s></small>` : ''}
            </div>
            <p class="card-desc">${product.description || ''}</p>
            <button class="card-info-cart">Add to cart</button>
            <button class="card-info-wish"><i class="fa-regular fa-heart"></i> Wishlist</button>
        </div>`;

        const likeBtn = card.querySelector(".likebtn");
        const addToCartBtn = card.querySelector(".add-to-cartBtn");
        const infoCartBtn = card.querySelector(".card-info-cart");
        const infoWishBtn = card.querySelector(".card-info-wish");
        const oldPrice = card.querySelector(".old-price");

        if (extended) {
            likeBtn.style.display = "none";
            addToCartBtn.style.display = "none";
        } else if (window.innerWidth <= 1024) {
            likeBtn.style.display = "block";
            addToCartBtn.style.display = "block";
            if (oldPrice) oldPrice.style.opacity = "1";
            likeBtn.classList.replace("notactive", "active");
            addToCartBtn.classList.replace("notactive", "active");
        } else {
            likeBtn.style.display = "none";
            addToCartBtn.style.display = "none";
            if (oldPrice) oldPrice.style.opacity = "0";
        }

        if (isProductInCart(product.id)) {
            addToCartBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i><span class="added-label"> Added —</span> Go to Cart`;
            addToCartBtn.classList.add("added");
            infoCartBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i><span class="added-label"> Added —</span> Go to Cart`;
            infoCartBtn.classList.add("added");
        }

        if (isProductInWishlist(product.id)) {
            likeBtn.style.color = "#FF5630";
            likeBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
            infoWishBtn.innerHTML = `<i class="fa-solid fa-heart"></i> Wishlist`;
            infoWishBtn.style.color = "#FF5630";
        }

        // Desktop hover — only on hover-capable devices
        card.addEventListener("mouseenter", () => {
            if (window.innerWidth > 1024 && !isExtendedCardView()) {
                likeBtn.classList.replace("notactive", "active");
                likeBtn.style.display = "block";
                addToCartBtn.classList.replace("notactive", "active");
                addToCartBtn.style.display = "block";
                if (oldPrice) oldPrice.style.opacity = "1";
            }
        });

        card.addEventListener("mouseleave", () => {
            if (window.innerWidth > 1024 && !isExtendedCardView()) {
                likeBtn.classList.replace("active", "notactive");
                likeBtn.style.display = "none";
                addToCartBtn.classList.replace("active", "notactive");
                addToCartBtn.style.display = "none";
                if (oldPrice) oldPrice.style.opacity = "0";
            }
        });

        // Overlay button handlers
        likeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            AddToWishList(product.id, likeBtn);
        });

        addToCartBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (isProductInCart(product.id)) {
                window.location.href = "cart.html";
                return;
            }
            addToCartList(product.id, addToCartBtn);
            infoCartBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i><span class="added-label"> Added —</span> Go to Cart`;
            infoCartBtn.classList.add("added");
        });

        // Info panel handlers (extended views)
        infoCartBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (isProductInCart(product.id)) {
                window.location.href = "cart.html";
                return;
            }
            addToCartList(product.id, addToCartBtn);
            infoCartBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i><span class="added-label"> Added —</span> Go to Cart`;
            infoCartBtn.classList.add("added");
        });

        infoWishBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            AddToWishList(product.id, likeBtn);
            if (isProductInWishlist(product.id)) {
                infoWishBtn.innerHTML = `<i class="fa-solid fa-heart"></i> Wishlist`;
                infoWishBtn.style.color = "#FF5630";
            } else {
                infoWishBtn.innerHTML = `<i class="fa-regular fa-heart"></i> Wishlist`;
                infoWishBtn.style.color = "";
            }
        });

        // Navigate to product page
        card.querySelector(".card-info").addEventListener("click", (e) => {
            if (e.target.closest(".card-info-cart") || e.target.closest(".card-info-wish")) return;
            window.location.href = `product.html?id=${product.id}`;
        });
        card.querySelector("img").addEventListener("click", () => {
            window.location.href = `product.html?id=${product.id}`;
        });

        shopCards.appendChild(card);
    });

    if (filtered.length <= INITIAL_VISIBLE_COUNT) {
        showMoreBtn.style.display = "none";
    } else {
        showMoreBtn.style.display = "flex";
        showMoreBtn.textContent = visibleCount >= filtered.length ? "Show Less" : "Show More";
    }
}

// ─── Show More ───────────────────────────────────────────────────────────────
showMoreBtn.addEventListener("click", () => {
    const filteredLength = getFilteredProducts().length;
    if (visibleCount >= filteredLength) {
        visibleCount = INITIAL_VISIBLE_COUNT;
        renderShopCards();
        shopCards.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
        visibleCount = Math.min(visibleCount + SHOW_MORE_STEP, filteredLength);
        renderShopCards();
    }
});

// ─── Sidebar filters (desktop – kept for fallback) ──────────────────────────
categoryBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        categoryBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeCategory = btn.dataset.category;
        categoryDropdownCtrl.setValue(activeCategory);
        visibleCount = INITIAL_VISIBLE_COUNT;
        renderShopCards();
    });
});

priceBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        priceBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeMinPrice = parseFloat(btn.dataset.min);
        activeMaxPrice = parseFloat(btn.dataset.max);
        visibleCount = INITIAL_VISIBLE_COUNT;
        renderShopCards();
    });
});

// ─── View toggle ────────────────────────────────────────────────────────────

// Switches the shop grid to the specified desktop layout (grid-4, grid-3, or grid-2).
function setGridView(view) {
    [gridBtn4, gridBtn3, gridBtn2].forEach(b => b && b.classList.remove("active"));
    if (view === "grid-4") {
        if (gridBtn4) gridBtn4.classList.add("active");
        shopCards.className = "cards shop-grid grid-4";
    } else if (view === "grid-3") {
        if (gridBtn3) gridBtn3.classList.add("active");
        shopCards.className = "cards shop-grid";
    } else if (view === "grid-2") {
        if (gridBtn2) gridBtn2.classList.add("active");
        shopCards.className = "cards shop-grid desktop-2";
    }
}

// Switches the shop grid to the specified tablet layout (tablet-3 or tablet-2).
function setTabletView(view) {
    if (tabletGrid3Btn) tabletGrid3Btn.classList.remove("active");
    if (tabletGrid2Btn) tabletGrid2Btn.classList.remove("active");
    if (view === "tablet-3") {
        if (tabletGrid3Btn) tabletGrid3Btn.classList.add("active");
        shopCards.className = "cards shop-grid tablet-3";
    } else {
        if (tabletGrid2Btn) tabletGrid2Btn.classList.add("active");
        shopCards.className = "cards shop-grid tablet-2";
    }
}

// Switches the shop grid to the specified phone layout (phone-1 or phone-2).
function setPhoneView(view) {
    if (phoneGrid2Btn) phoneGrid2Btn.classList.remove("active");
    if (phoneGrid1Btn) phoneGrid1Btn.classList.remove("active");
    if (view === "phone-1") {
        if (phoneGrid1Btn) phoneGrid1Btn.classList.add("active");
        shopCards.className = "cards shop-grid phone-1";
    } else {
        if (phoneGrid2Btn) phoneGrid2Btn.classList.add("active");
        shopCards.className = "cards shop-grid phone-2";
    }
}

if (gridBtn4) gridBtn4.addEventListener("click", () => { setGridView("grid-4"); renderShopCards(); });
if (gridBtn3) gridBtn3.addEventListener("click", () => { setGridView("grid-3"); renderShopCards(); });
if (gridBtn2) gridBtn2.addEventListener("click", () => { setGridView("grid-2"); renderShopCards(); });
if (tabletGrid3Btn) tabletGrid3Btn.addEventListener("click", () => { setTabletView("tablet-3"); renderShopCards(); });
if (tabletGrid2Btn) tabletGrid2Btn.addEventListener("click", () => { setTabletView("tablet-2"); renderShopCards(); });
if (phoneGrid2Btn) phoneGrid2Btn.addEventListener("click", () => { setPhoneView("phone-2"); renderShopCards(); });
if (phoneGrid1Btn) phoneGrid1Btn.addEventListener("click", () => { setPhoneView("phone-1"); renderShopCards(); });

// ─── Resize ──────────────────────────────────────────────────────────────────
// Debounced at 150 ms to avoid re-rendering the entire card grid on every pixel
// of a drag resize — fires once after the user stops resizing.
let resizeTimer;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const w = window.innerWidth;
        const cls = shopCards.className;
        const hasTablet = cls.includes("tablet-");
        const hasPhone = cls.includes("phone-");
        const hasDesktop = !hasTablet && !hasPhone;

        if (w <= 767 && !hasPhone) { setPhoneView("phone-2"); renderShopCards(); }
        else if (w > 767 && w <= 1024 && !hasTablet) { setTabletView("tablet-2"); renderShopCards(); }
        else if (w > 1024 && !hasDesktop) { setGridView("grid-4"); renderShopCards(); }
        else {
            const extended = isExtendedCardView();
            document.querySelectorAll("#shop-cards .card").forEach(card => {
                const lb = card.querySelector(".likebtn");
                const ab = card.querySelector(".add-to-cartBtn");
                const op = card.querySelector(".old-price");
                if (extended) { lb.style.display = "none"; ab.style.display = "none"; }
                else if (w <= 1024) {
                    lb.style.display = "block"; ab.style.display = "block";
                    if (op) op.style.opacity = "1";
                } else {
                    lb.style.display = "none"; ab.style.display = "none";
                    if (op) op.style.opacity = "0";
                }
            });
        }
    }, 150);
});

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    const w = window.innerWidth;
    if (w <= 767) setPhoneView("phone-2");
    else if (w <= 1024) setTabletView("tablet-2");
    else setGridView("grid-4");

    // Apply URL params from banner/external links
    const urlParams = new URLSearchParams(window.location.search);

    const categoryParam = urlParams.get("category");
    if (categoryParam) {
        activeCategory = categoryParam;
        categoryDropdownCtrl.setValue(categoryParam);
        categoryBtns.forEach(b => b.classList.toggle("active", b.dataset.category === categoryParam));
    }

    const sortParam = urlParams.get("sort");
    if (sortParam) {
        activeSort = sortParam;
        sortDropdownCtrl.setValue(sortParam);
    }

    const priceParam = urlParams.get("price");
    if (priceParam && priceParam.includes(",")) {
        const [minStr, maxStr] = priceParam.split(",");
        const min = parseFloat(minStr);
        const max = parseFloat(maxStr);
        if (!Number.isNaN(min) && !Number.isNaN(max)) {
            activeMinPrice = min;
            activeMaxPrice = max;
            priceDropdownCtrl.setValue(`${min},${max}`);

            priceBtns.forEach(btn => {
                const bMin = parseFloat(btn.dataset.min);
                const bMax = parseFloat(btn.dataset.max);
                btn.classList.toggle("active", bMin === min && bMax === max);
            });
        }
    }

    renderShopCards();
});

window.addEventListener("cart:cleared", renderShopCards);
window.addEventListener("wishlist:cleared", renderShopCards);
