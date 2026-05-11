document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("id")) || 1;
    const product = products.find(p => p.id === id) || products[0];

    // Save last visited product id for navbar "Product" link
    localStorage.setItem("lastProductId", product.id);

    // Returns the first image from an array, or the value itself when it's already a string.
    function getMainImage(image) {
        return Array.isArray(image) ? (image[0] || "") : (image || "");
    }

    // Builds the canonical URL for the current product page, used by the share buttons.
    function getProductUrl() {
        const url = new URL(window.location.href);
        url.searchParams.set("id", product.id);
        return url.toString();
    }

    // Attaches share URLs to all [data-share] elements and wires up the native share API
    // button on mobile devices that support it.
    function bindShareButtons() {
        const productUrl = getProductUrl();
        const productText = `${product.name} - Decoria`;
        const encodedUrl = encodeURIComponent(productUrl);
        const encodedText = encodeURIComponent(productText);

        const shareMap = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
            x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
            whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
            telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`
        };

        document.querySelectorAll("[data-share]").forEach(el => {
            const platform = (el.dataset.share || "").toLowerCase();
            const shareLink = shareMap[platform];
            if (!shareLink) return;
            if (el.tagName.toLowerCase() === "a") {
                el.href = shareLink;
                el.target = "_blank";
                el.rel = "noopener noreferrer";
            } else {
                el.addEventListener("click", () => window.open(shareLink, "_blank", "noopener,noreferrer"));
            }
        });

        // Native share (mobile)
        const nativeBtn = document.getElementById("share-native-btn");
        if (nativeBtn && navigator.share) {
            nativeBtn.style.display = "inline-flex";
            nativeBtn.addEventListener("click", () => {
                navigator.share({ title: productText, url: productUrl }).catch(() => { });
            });
        }
    }

    // ─── Basic product info ───────────────────────────────────────────────────
    document.getElementById("product-breadcrumb").textContent = product.name;
    document.title = `Decoria - ${product.name}`;

    // Gallery
    const thumbsContainer = document.getElementById("gallery-thumbs");
    const mainImg = document.getElementById("gallery-main-img");
    const badge = document.getElementById("product-badge");

    const productImages = Array.isArray(product.images)
        ? product.images
        : (Array.isArray(product.image) ? product.image : [product.image]);

    let currentImgIndex = 0;

    // Navigates the gallery to the given index (wraps around), updates the main image
    // and highlights the matching thumbnail.
    function setActiveImage(index) {
        currentImgIndex = (index + productImages.length) % productImages.length;
        mainImg.src = productImages[currentImgIndex];
        document.querySelectorAll(".gallery-thumb").forEach((t, i) => {
            t.classList.toggle("active", i === currentImgIndex);
        });
    }

    mainImg.src = productImages[0];
    mainImg.alt = product.name;
    if (product.new) badge.style.display = "block";

    productImages.forEach((src, i) => {
        const thumb = document.createElement("div");
        thumb.className = "gallery-thumb" + (i === 0 ? " active" : "");
        thumb.innerHTML = `<img src="${src}" alt="${product.name}">`;
        thumb.addEventListener("click", () => setActiveImage(i));
        thumbsContainer.appendChild(thumb);
    });

    document.getElementById("gallery-prev").addEventListener("click", () => setActiveImage(currentImgIndex - 1));
    document.getElementById("gallery-next").addEventListener("click", () => setActiveImage(currentImgIndex + 1));

    // ─── Rating & Reviews ─────────────────────────────────────────────────────
    document.getElementById("product-rating").innerHTML = renderStars(product.rating);
    document.getElementById("product-rating-score").textContent = product.rating.toFixed(1);
    document.getElementById("product-reviews").textContent = `${product.reviews} Reviews`;

    // Reviews tab summary
    document.getElementById("reviews-big-score").textContent = product.rating.toFixed(1);
    document.getElementById("reviews-stars").innerHTML = renderStars(product.rating);
    document.getElementById("reviews-count").textContent = `${product.reviews} Reviews`;

    // ─── Name, Price ──────────────────────────────────────────────────────────
    document.getElementById("product-name").textContent = product.name;

    const finalPrice = getDiscountPrice(product.price, product.discount);
    document.getElementById("product-final-price").textContent = `$${finalPrice}`;

    const oldPriceEl = document.getElementById("product-old-price");
    const discountBadgeEl = document.getElementById("product-discount");
    if (product.discount > 0) {
        oldPriceEl.textContent = `$${product.price.toFixed(2)}`;
        discountBadgeEl.textContent = `-${product.discount}%`;
    } else {
        oldPriceEl.style.display = "none";
        discountBadgeEl.style.display = "none";
    }

    document.getElementById("product-description").textContent = product.description;
    document.getElementById("product-category").textContent = product.category;
    document.getElementById("tab-desc-text").textContent = product.description;

    // ─── Offer Countdown ──────────────────────────────────────────────────────
    if (product.discount > 0 && product.offerExpiry) {
        const countdownEl = document.getElementById("offer-countdown");
        const expiryTime = new Date(product.offerExpiry).getTime();

        countdownEl.style.display = "flex";

        let countdownInterval;

        // Calculates time remaining until offerExpiry and updates the countdown display.
        // Clears the interval once the offer has expired.
        function updateCountdown() {
            const now = Date.now();
            const diff = expiryTime - now;

            if (diff <= 0) {
                document.getElementById("cd-days").textContent = "00";
                document.getElementById("cd-hours").textContent = "00";
                document.getElementById("cd-min").textContent = "00";
                document.getElementById("cd-sec").textContent = "00";
                clearInterval(countdownInterval);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const min = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const sec = Math.floor((diff % (1000 * 60)) / 1000);

            document.getElementById("cd-days").textContent = String(days).padStart(2, "0");
            document.getElementById("cd-hours").textContent = String(hours).padStart(2, "0");
            document.getElementById("cd-min").textContent = String(min).padStart(2, "0");
            document.getElementById("cd-sec").textContent = String(sec).padStart(2, "0");
        }

        updateCountdown();
        countdownInterval = setInterval(updateCountdown, 1000);
    }

    // ─── Sizes ────────────────────────────────────────────────────────────────
    const sizeSection = document.getElementById("product-sizes-section");
    const sizeOptionsContainer = document.getElementById("size-options");

    if (product.sizes && product.sizes.length > 0) {
        sizeSection.style.display = "flex";

        product.sizes.forEach((size, i) => {
            const btn = document.createElement("button");
            btn.className = "size-btn" + (i === 0 ? " active" : "");
            btn.textContent = size;
            btn.addEventListener("click", () => {
                document.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                syncQtyDisplay();
            });
            sizeOptionsContainer.appendChild(btn);
        });
    }

    // ─── Color select ─────────────────────────────────────────────────────────
    const colorSection = document.getElementById("product-color-section");
    const colorDropdown = document.getElementById("product-color-dropdown");
    const colorTrigger = colorDropdown ? colorDropdown.querySelector(".dropdown-trigger") : null;
    const colorSelectedSpan = colorDropdown ? colorDropdown.querySelector(".dropdown-selected") : null;
    const colorList = document.getElementById("product-color-list");

    const availableColors = product.colors && product.colors.length > 0
        ? product.colors
        : [product.color];

    let selectedColor = availableColors[0] || product.color;

    // Updates the selected color state and syncs the dropdown display and active item highlight.
    function setSelectedColor(color) {
        if (!color) return;
        selectedColor = color;
        if (colorSelectedSpan) colorSelectedSpan.textContent = color;
        if (colorList) {
            colorList.querySelectorAll(".dropdown-item").forEach((item) => {
                item.classList.toggle("active", item.dataset.value === color);
            });
        }
    }

    colorSection.style.display = "flex";
    if (colorList) {
        colorList.innerHTML = "";
        availableColors.forEach((c, i) => {
            const item = document.createElement("li");
            item.className = "dropdown-item" + (i === 0 ? " active" : "");
            item.dataset.value = c;
            item.textContent = c;
            item.addEventListener("click", (e) => {
                e.stopPropagation();
                setSelectedColor(c);
                if (colorDropdown) colorDropdown.classList.remove("open");
                syncQtyDisplay();
            });
            colorList.appendChild(item);
        });
    }

    if (colorTrigger) {
        colorTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = colorDropdown.classList.contains("open");
            document.querySelectorAll(".custom-dropdown.open").forEach((d) => d.classList.remove("open"));
            if (!isOpen) colorDropdown.classList.add("open");
        });
    }

    document.addEventListener("click", () => {
        if (colorDropdown) colorDropdown.classList.remove("open");
    });

    // Pre-select the color of the cart item if product is already in cart
    const existingCartItem = (JSON.parse(localStorage.getItem("produse")) || [])
        .find(p => p.id === product.id);
    if (existingCartItem && existingCartItem.color) {
        setSelectedColor(existingCartItem.color);
    } else {
        setSelectedColor(selectedColor);
    }

    // ─── Cart helpers ─────────────────────────────────────────────────────────
    const qtySection = document.getElementById("product-quantity-controls");
    const qtyDisplay = document.getElementById("detail-qty");
    const minusBtn = document.getElementById("detail-minus");
    const plusBtn = document.getElementById("detail-plus");
    const addBtn = document.getElementById("detail-add-to-cart");

    qtySection.style.display = "none";

    // Returns the current cart array from localStorage.
    function getCartItems() {
        return JSON.parse(localStorage.getItem("produse")) || [];
    }

    // Persists the cart array and fires the cart:updated event so all other modules stay in sync.
    function saveCartItems(items) {
        localStorage.setItem("produse", JSON.stringify(items));
        updateCartNr();
        updateCartTotals();
        window.dispatchEvent(new CustomEvent("cart:updated"));
    }

    // Returns the currently selected color, falling back to the product's default color.
    function getSelectedColor() {
        return selectedColor || product.color;
    }

    // Returns the text of the active size button, or null if no size is selected.
    function getSelectedSize() {
        const activeBtn = document.querySelector(".size-btn.active");
        return activeBtn ? activeBtn.textContent.trim() : null;
    }

    // Returns true if a cart item matches the current product, color, and size selection.
    // Size is only checked when both the cart item and the current selection have a size.
    function variantMatches(p) {
        const color = getSelectedColor();
        const size = getSelectedSize();
        return p.id === product.id && p.color === color && (!p.size || !size || p.size === size);
    }

    // Returns the matching cart item for the current variant selection, or undefined if not in cart.
    function getVariantFromCart() {
        return getCartItems().find(p => variantMatches(p));
    }

    // Swaps the minus button for a trash icon when quantity is 1, so clicking removes the item.
    function updateMinusIcon(qty) {
        minusBtn.innerHTML = qty <= 1
            ? '<i class="fa-solid fa-trash"></i>'
            : '<i class="fa-solid fa-minus"></i>';
    }

    // Shows the quantity controls with the given count and updates the minus/trash icon.
    function showQtySection(qty) {
        qtyDisplay.textContent = qty;
        updateMinusIcon(qty);
        qtySection.style.display = "flex";
    }

    // Hides the quantity controls and resets the add-to-cart button label.
    function hideQtySection() {
        qtySection.style.display = "none";
        addBtn.innerHTML = "Add to Cart";
    }

    // Reads the current cart state and either shows the quantity controls (item in cart)
    // or hides them and resets the button (item not in cart).
    function syncQtyDisplay() {
        const variant = getVariantFromCart();
        if (variant) {
            showQtySection(variant.quantity || 1);
            addBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Added — Go to Cart`;
        } else {
            hideQtySection();
        }
    }

    // ─── Color change → reset cart state ─────────────────────────────────────
    // ─── On page load: sync with cart ─────────────────────────────────────────
    syncQtyDisplay();

    // ─── Add to Cart ──────────────────────────────────────────────────────────
    addBtn.addEventListener("click", () => {
        if (getVariantFromCart()) {
            window.location.href = "cart.html";
            return;
        }
        const color = getSelectedColor();
        const size = getSelectedSize();
        let produse = getCartItems();
        produse.push({
            id: product.id,
            name: product.name,
            finalPrice: getDiscountPrice(product.price, product.discount),
            quantity: 1,
            image: getMainImage(product.image),
            color: color,
            size: size
        });
        saveCartItems(produse);
        showQtySection(1);
        addBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Added — Go to Cart`;
    });

    // ─── Plus ─────────────────────────────────────────────────────────────────
    plusBtn.addEventListener("click", () => {
        let produse = getCartItems();
        const item = produse.find(p => variantMatches(p));
        if (!item) return;

        item.quantity = (item.quantity || 1) + 1;
        saveCartItems(produse);
        qtyDisplay.textContent = item.quantity;
        updateMinusIcon(item.quantity);
    });

    // ─── Minus / Trash ────────────────────────────────────────────────────────
    minusBtn.addEventListener("click", () => {
        let produse = getCartItems();
        const item = produse.find(p => variantMatches(p));
        if (!item) return;

        const currentQty = item.quantity || 1;

        if (currentQty <= 1) {
            saveCartItems(produse.filter(p => !variantMatches(p)));
            hideQtySection();
        } else {
            item.quantity = currentQty - 1;
            saveCartItems(produse);
            qtyDisplay.textContent = item.quantity;
            updateMinusIcon(item.quantity);
        }
    });

    // ─── Auto-sync qty when cart is updated externally (cart window) ──────────
    window.addEventListener("cart:updated", syncQtyDisplay);

    // ─── Auto-sync wishlist button when wishlist is updated externally ─────────
    window.addEventListener("wishlist:updated", refreshWishlistBtn);
    window.addEventListener("wishlist:cleared", refreshWishlistBtn);

    // ─── Wishlist ─────────────────────────────────────────────────────────────
    const wishlistBtn = document.getElementById("detail-wishlist");

    // Updates the wishlist button appearance to reflect the current wishlist state for this product.
    function refreshWishlistBtn() {
        if (isProductInWishlist(product.id)) {
            wishlistBtn.innerHTML = `<i class="fa-solid fa-heart"></i> Wishlist`;
            wishlistBtn.style.color = "#FF5630";
            wishlistBtn.style.borderColor = "#FF5630";
        } else {
            wishlistBtn.innerHTML = `<i class="fa-regular fa-heart"></i> Wishlist`;
            wishlistBtn.style.color = "";
            wishlistBtn.style.borderColor = "";
        }
    }

    refreshWishlistBtn();

    wishlistBtn.addEventListener("click", () => {
        let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
        const idx = wishlist.findIndex(p => p.id === product.id);
        if (idx !== -1) {
            wishlist.splice(idx, 1);
        } else {
            wishlist.push({
                id: product.id,
                name: product.name,
                finalPrice: getDiscountPrice(product.price, product.discount),
                quantity: 1,
                image: getMainImage(product.image),
                color: getSelectedColor()
            });
        }
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
        updateWishlistNr();
        refreshWishlistBtn();
    });

    // ─── Tabs ─────────────────────────────────────────────────────────────────────────
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    // Initialize display states explicitly for reliability
    tabContents.forEach(c => {
        c.style.display = c.classList.contains("active") ? "block" : "none";
    });

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => {
                c.classList.remove("active");
                c.style.display = "none";
            });
            btn.classList.add("active");
            const target = document.getElementById("tab-" + btn.dataset.tab);
            if (target) {
                target.classList.add("active");
                target.style.display = "block";
            }
        });
    });
    bindShareButtons();

    // ─── Reviews ──────────────────────────────────────────────────────────────
    const REVIEWS_PER_PAGE = 5;
    const REVIEWS_LOAD_MORE = 10;
    const reviewsKey = `reviews_${product.id}`;

    const defaultReviews = [
        { name: "Sofia Havertz", rating: 5, text: "Great product! Exactly as described. The quality is superb and delivery was fast. Would definitely recommend to anyone looking for stylish home decor.", likes: 4, liked: false, replies: [] },
        { name: "Nicolas Jensen", rating: 5, text: "I ordered this 2 weeks ago and I am very pleased with this product. The build quality exceeded my expectations and it fits perfectly in my living room.", likes: 2, liked: false, replies: [] },
        { name: "Amelia Torres", rating: 4, text: "Beautiful design and very well made. The color matches exactly what's shown in the photos. Shipping was quick and packaging was excellent.", likes: 6, liked: false, replies: [] },
        { name: "Lucas Martin", rating: 5, text: "Absolutely love it! It blends perfectly with my existing furniture. Solid build and arrived in perfect condition.", likes: 3, liked: false, replies: [] },
        { name: "Emma Wilson", rating: 4, text: "Nice quality for the price. Setup was straightforward and looks even better in person than in the pictures.", likes: 1, liked: false, replies: [] },
        { name: "Daniel Kim", rating: 5, text: "Exceeded my expectations. Premium feel, great packaging, and delivered earlier than expected. Will buy again!", likes: 7, liked: false, replies: [] },
        { name: "Olivia Brown", rating: 3, text: "Good product overall but delivery took longer than expected. The item itself is great though.", likes: 0, liked: false, replies: [] },
        { name: "James Lee", rating: 5, text: "Perfect addition to my home. Sturdy, stylish, and exactly what I was looking for. Highly recommend!", likes: 5, liked: false, replies: [] },
        { name: "Mia Johnson", rating: 4, text: "Very happy with this purchase. The color is spot on and the quality is really good. Great value!", likes: 2, liked: false, replies: [] },
        { name: "Ethan Garcia", rating: 5, text: "Fantastic product. Looks amazing in my living room and the build quality is top notch.", likes: 8, liked: false, replies: [] },
    ];

    // Returns the stored reviews for this product, falling back to the default seed data.
    function loadReviews() {
        const stored = localStorage.getItem(reviewsKey);
        return stored ? JSON.parse(stored) : defaultReviews;
    }

    // Persists the reviews array to localStorage for the current product.
    function saveReviews(reviews) {
        localStorage.setItem(reviewsKey, JSON.stringify(reviews));
    }

    let visibleReviews = REVIEWS_PER_PAGE;

    // Renders the visible reviews, with like/reply interactions. Shows a "Load More" button
    // until all reviews are visible.
    function renderReviews() {
        const reviewsList = document.getElementById("reviews-list");
        const loadMoreWrap = document.getElementById("reviews-load-more-wrap");
        const reviews = loadReviews();

        reviewsList.innerHTML = "";
        const toShow = reviews.slice(0, visibleReviews);

        toShow.forEach((rev, idx) => {
            const stars = '<i class="fa-solid fa-star"></i>'.repeat(rev.rating) + '<i class="fa-regular fa-star"></i>'.repeat(5 - rev.rating);
            const item = document.createElement("div");
            item.className = "review-item";
            item.innerHTML = `
                <div class="reviewer-info">
                    <div class="reviewer-avatar">${rev.name.charAt(0)}</div>
                    <div>
                        <strong>${rev.name}</strong>
                        <div class="stars-row">${stars}</div>
                    </div>
                </div>
                <p>${rev.text}</p>
                <div class="review-actions">
                    <button class="review-like-btn ${rev.liked ? 'liked' : ''}" data-idx="${idx}">
                        <i class="fa-${rev.liked ? 'solid' : 'regular'} fa-thumbs-up"></i> Like (${rev.likes})
                    </button>
                    <button class="review-reply-btn" data-idx="${idx}">
                        <i class="fa-regular fa-comment"></i> Reply
                    </button>
                </div>
                <div class="review-replies" id="replies-${idx}">
                    ${rev.replies.map(r => `<div class="reply-item"><strong>${r.name}</strong><p>${r.text}</p></div>`).join("")}
                </div>
                <div class="reply-form" id="reply-form-${idx}" style="display:none">
                    <input type="text" class="review-input reply-name" placeholder="Your name">
                    <textarea class="review-textarea reply-text" placeholder="Write a reply..." rows="2"></textarea>
                    <button class="submit-reply-btn" data-idx="${idx}">Send Reply</button>
                </div>`;

            item.querySelector(`.review-like-btn`).addEventListener("click", () => {
                const reviews = loadReviews();
                reviews[idx].liked = !reviews[idx].liked;
                reviews[idx].likes += reviews[idx].liked ? 1 : -1;
                saveReviews(reviews);
                renderReviews();
            });

            item.querySelector(`.review-reply-btn`).addEventListener("click", () => {
                const form = document.getElementById(`reply-form-${idx}`);
                form.style.display = form.style.display === "none" ? "flex" : "none";
            });

            item.querySelector(`.submit-reply-btn`).addEventListener("click", () => {
                const nameEl = item.querySelector(".reply-name");
                const textEl = item.querySelector(".reply-text");
                const name = nameEl.value.trim();
                const text = textEl.value.trim();
                if (!name || !text) return;
                const reviews = loadReviews();
                reviews[idx].replies.push({ name, text });
                saveReviews(reviews);
                nameEl.value = "";
                textEl.value = "";
                renderReviews();
            });

            reviewsList.appendChild(item);
        });

        loadMoreWrap.style.display = visibleReviews >= reviews.length ? "none" : "flex";
    }

    document.getElementById("reviews-load-more").addEventListener("click", () => {
        visibleReviews += REVIEWS_LOAD_MORE;
        renderReviews();
    });

    // Star rating selector
    let selectedRating = 0;
    const starEls = document.querySelectorAll("#review-star-select i");
    starEls.forEach(star => {
        star.addEventListener("click", () => {
            selectedRating = parseInt(star.dataset.val);
            starEls.forEach((s, i) => {
                s.className = i < selectedRating ? "fa-solid fa-star" : "fa-regular fa-star";
            });
        });
        star.addEventListener("mouseenter", () => {
            const val = parseInt(star.dataset.val);
            starEls.forEach((s, i) => {
                s.className = i < val ? "fa-solid fa-star" : "fa-regular fa-star";
            });
        });
        star.addEventListener("mouseleave", () => {
            starEls.forEach((s, i) => {
                s.className = i < selectedRating ? "fa-solid fa-star" : "fa-regular fa-star";
            });
        });
    });

    document.getElementById("submit-review-btn").addEventListener("click", () => {
        const name = document.getElementById("review-name").value.trim();
        const text = document.getElementById("review-text").value.trim();
        if (!name || !text || selectedRating === 0) {
            showToast("Please fill in your name, rating, and review.", "error");
            return;
        }
        const reviews = loadReviews();
        reviews.unshift({ name, rating: selectedRating, text, likes: 0, liked: false, replies: [] });
        saveReviews(reviews);
        document.getElementById("review-name").value = "";
        document.getElementById("review-text").value = "";
        selectedRating = 0;
        starEls.forEach(s => s.className = "fa-regular fa-star");
        visibleReviews = REVIEWS_PER_PAGE;
        renderReviews();
        showToast("Review submitted!", "success");
    });

    renderReviews();

    // ─── You might also like ──────────────────────────────────────────────────
    const relatedContainer = document.getElementById("related-products");
    if (relatedContainer) {
        const others = products.filter(p => p.id !== product.id);
        const related = [...others].sort((a, b) => {
            const scoreA = (a.discount > 0 ? 2 : 0) + (a.new ? 1 : 0);
            const scoreB = (b.discount > 0 ? 2 : 0) + (b.new ? 1 : 0);
            return scoreB - scoreA;
        }).slice(0, 6);

        related.forEach(p => {
            const finalPrice = getDiscountPrice(p.price, p.discount);
            const mainImage = Array.isArray(p.image) ? p.image[0] : p.image;
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
            <div class="card-img">
                ${p.new ? '<span class="badge">NEW</span>' : ''}
                ${p.discount > 0 ? `<span class="discount${!p.new ? ' discount-only' : ''}">-${p.discount}%</span>` : ''}
                <button class="likebtn notactive"><i class="fa-regular fa-heart"></i></button>
                <img src="${mainImage}" alt="${p.name}">
                <button class="add-to-cartBtn notactive">Add to cart</button>
            </div>
            <div class="card-info">
                <div class="product-rating">${renderStars(p.rating)}</div>
                <h3>${p.name}</h3>
                <div class="price">
                    $${finalPrice}
                    ${p.discount > 0 ? `<small class="old-price">$<s>${p.price.toFixed(2)}</s></small>` : ''}
                </div>
            </div>`;

            const likeBtn = card.querySelector(".likebtn");
            const addBtn = card.querySelector(".add-to-cartBtn");

            if (isProductInWishlist(p.id)) {
                likeBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
                likeBtn.style.color = "#FF5630";
            }
            if (isProductInCart(p.id)) {
                addBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Added — Go to Cart';
                addBtn.classList.add("added");
            }

            likeBtn.addEventListener("click", e => { e.stopPropagation(); AddToWishList(p.id, likeBtn); });
            addBtn.addEventListener("click", e => {
                e.stopPropagation();
                if (isProductInCart(p.id)) {
                    window.location.href = "cart.html";
                    return;
                }
                addToCartList(p.id, addBtn);
            });
            card.querySelector(".card-info").addEventListener("click", () => { window.location.href = `product.html?id=${p.id}`; });
            card.querySelector("img").addEventListener("click", () => { window.location.href = `product.html?id=${p.id}`; });

            relatedContainer.appendChild(card);
        });
    }

    // ─── Lightbox ─────────────────────────────────────────────────────────────
    const lightbox = document.createElement("div");
    lightbox.className = "lightbox-overlay";
    lightbox.innerHTML = `
        <button class="lightbox-close" id="lb-close"><i class="fa-solid fa-xmark"></i></button>
        <button class="lightbox-nav lb-prev" id="lb-prev"><i class="fa-solid fa-chevron-left"></i></button>
        <img class="lightbox-img" id="lb-img" src="" alt="">
        <button class="lightbox-nav lb-next" id="lb-next"><i class="fa-solid fa-chevron-right"></i></button>`;
    document.body.appendChild(lightbox);

    let lbIndex = 0;

    // Opens the fullscreen lightbox at the given image index and locks page scroll.
    function openLightbox(index) {
        lbIndex = (index + productImages.length) % productImages.length;
        lightbox.querySelector("#lb-img").src = productImages[lbIndex];
        lightbox.classList.add("open");
        document.body.style.overflow = "hidden";
    }

    // Closes the lightbox and restores page scroll.
    function closeLightbox() {
        lightbox.classList.remove("open");
        document.body.style.overflow = "";
    }

    // Moves the lightbox to the next (+1) or previous (-1) image, wrapping around.
    function lbNavigate(dir) {
        lbIndex = (lbIndex + dir + productImages.length) % productImages.length;
        lightbox.querySelector("#lb-img").src = productImages[lbIndex];
    }

    mainImg.style.cursor = "zoom-in";
    mainImg.addEventListener("click", () => openLightbox(currentImgIndex));

    lightbox.querySelector("#lb-close").addEventListener("click", closeLightbox);
    lightbox.querySelector("#lb-prev").addEventListener("click", (e) => { e.stopPropagation(); lbNavigate(-1); });
    lightbox.querySelector("#lb-next").addEventListener("click", (e) => { e.stopPropagation(); lbNavigate(1); });
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });

    document.addEventListener("keydown", (e) => {
        if (!lightbox.classList.contains("open")) return;
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") lbNavigate(-1);
        if (e.key === "ArrowRight") lbNavigate(1);
    });
});
