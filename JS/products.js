// ─── Star renderer ───────────────────────────────────────────────────────────

// Returns an HTML string of Font Awesome star icons (full, half, and empty)
// representing the given numeric rating out of 5.
function renderStars(rating) {
    const full = Math.floor(rating);
    const half = (rating - full) >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    let html = '<i class="fa-solid fa-star"></i>'.repeat(full);
    if (half) html += '<i class="fa-solid fa-star-half-stroke"></i>';
    html += '<i class="fa-regular fa-star"></i>'.repeat(Math.max(0, empty));
    return html;
}

const products = [
    {
        id: 1,
        name: "Loveseat Sofa",
        price: 400,
        discount: 50,
        rating: 4.8,
        reviews: 23,
        offerExpiry: "2026-04-30T23:59:59",
        sizes: ["2-seater (145×85 cm)", "3-seater (185×85 cm)"],
        colors: ["Dark Gray", "Beige", "Navy Blue"],
        color: "Dark Gray",
        image: [
            "images/loveseat-sofa.svg",
            "images/loveseat-sofa-1.jpg",
            "images/loveseat-sofa-2.jpg"
        ],
        category: "Living Room",
        new: true,
        description: "A compact and elegant loveseat, perfect for modern living spaces. Upholstered in premium fabric with high-density foam cushions, this sofa offers a perfect balance of style and comfort. Its sturdy solid wood frame ensures durability, while the contemporary silhouette makes it ideal for apartments, studios, or as a secondary seating option in larger rooms."
    },
    {
        id: 2,
        name: "Table Lamp",
        price: 38,
        discount: 50,
        rating: 4.9,
        reviews: 47,
        offerExpiry: "2026-04-30T23:59:59",
        sizes: ["Small (H35 cm)", "Medium (H45 cm)", "Large (H55 cm)"],
        colors: ["Gold", "Silver", "Matte Black"],
        color: "Gold",
        image: [
            "images/table-lamp.svg",
            "images/table-lamp-1.avif",
            "images/table-lamp-2.avif",
            "images/table-lamp-3.avif"
        ],
        category: "Living Room",
        new: true,
        description: "A stylish table lamp that adds warm light and charm to any room. Featuring a metal base with a brushed finish and a soft fabric shade, this lamp casts a warm, ambient glow ideal for reading or creating a cozy atmosphere. The adjustable shade angle allows you to direct light exactly where you need it, making it as functional as it is beautiful."
    },
    {
        id: 3,
        name: "Beige Table Lamp",
        price: 49.98,
        discount: 50,
        rating: 4.7,
        reviews: 31,
        offerExpiry: "2026-04-30T23:59:59",
        sizes: ["Small (H30 cm)", "Large (H45 cm)"],
        colors: ["Ivory", "Sand", "White"],
        color: "Ivory",
        image: [
            "images/beige-table-lamp.svg",
            "images/beige-table-lamp-1.avif",
            "images/beige-table-lamp-2.avif",
            "images/beige-table-lamp-4.avif"
        ],
        category: "Bedroom",
        new: true,
        description: "A minimalist beige lamp ideal for bedside tables or desks. Crafted with a ceramic base in a soothing beige tone and topped with a linen shade, this lamp brings a natural, calming presence to any space. It pairs beautifully with neutral or earthy interiors and provides soft, diffused lighting perfect for winding down in the evening."
    },
    {
        id: 4,
        name: "Bamboo Basket",
        price: 20,
        discount: 50,
        rating: 4.6,
        reviews: 18,
        offerExpiry: "2026-04-30T23:59:59",
        sizes: ["S (20×15 cm)", "M (30×25 cm)", "L (40×30 cm)"],
        colors: ["Natural Wood", "Dark Brown", "Honey"],
        color: "Natural Wood",
        image: [
            "images/bamboo-basket.svg",
            "images/bamboo-basket-1.webp",
            "images/bamboo-basket-2.webp",
            "images/bamboo-basket-3.webp"
        ],
        category: "Living Room",
        new: true,
        description: "A natural bamboo basket great for storage and home decoration. Handwoven by skilled artisans using sustainably sourced bamboo, this basket is both eco-friendly and elegant. Use it to organize blankets, magazines, toys, or plants — its versatile design fits seamlessly into living rooms, bedrooms, and entryways. The natural finish adds warmth and texture to any interior."
    },
    {
        id: 5,
        name: "Toaster",
        price: 292.487,
        discount: 30,
        rating: 4.5,
        reviews: 62,
        offerExpiry: "2026-04-30T23:59:59",
        sizes: ["2-Slice", "4-Slice"],
        colors: ["Off-White", "Matte Black", "Brushed Steel"],
        color: "Off-White",
        image: [
            "images/toaster.svg",
            "images/toaster-1.avif",
            "images/toaster-2.jpg",
            "images/toaster-3.jpg"
        ],
        category: "Kitchen",
        new: true,
        description: "A modern toaster designed for quick and even browning every morning. Equipped with wide slots that accommodate all bread types, including sourdough and artisan loaves, it features 7 browning levels, a cancel button, and a removable crumb tray for easy cleaning. Its compact, retro-inspired design makes it a stylish addition to any kitchen countertop."
    },
    {
        id: 6,
        name: "Luxury Sofa",
        price: 600,
        discount: 50,
        rating: 5.0,
        reviews: 15,
        offerExpiry: "2026-04-30T23:59:59",
        sizes: ["3-seater (200×90 cm)", "4-seater (240×90 cm)"],
        colors: ["Light Gray", "Charcoal", "Cream"],
        color: "Light Gray",
        image: [
            "images/luxury-sofa.svg",
            "images/luxury-sofa-1.jpg"
        ],
        category: "Living Room",
        new: true,
        description: "A luxurious sofa with a refined design and exceptional comfort. Built on a kiln-dried hardwood frame, this sofa features deep, plush cushions wrapped in a premium woven fabric that resists pilling and everyday wear. Its low-profile silhouette and tapered legs give it a distinctly modern look, while the generous seating space makes it perfect for families and entertainers alike."
    },
    {
        id: 7,
        name: "Cozy Sofa",
        price: 600,
        discount: 50,
        rating: 4.7,
        reviews: 29,
        offerExpiry: "2026-04-30T23:59:59",
        sizes: ["2-seater (160×85 cm)", "3-seater (200×85 cm)"],
        colors: ["Soft Beige", "Dusty Rose", "Sage Green"],
        color: "Soft Beige",
        image: [
            "images/cozy-sofa.svg",
            "images/cozy-sofa-1.avif",
            "images/cozy-sofa-2.avif",
            "images/cozy-sofa-3.avif"
        ],
        category: "Living Room",
        new: false,
        description: "A soft and cozy sofa made for relaxing moments at home. The thick padded backrest and overstuffed armrests invite you to sink in after a long day. Covered in a velvety microfiber that is gentle to the touch and easy to maintain, this sofa comes in a range of muted tones that complement both warm and cool-toned interiors beautifully."
    },
    {
        id: 8,
        name: "White Drawer Unit",
        price: 180,
        discount: 50,
        rating: 4.8,
        reviews: 54,
        offerExpiry: "2026-04-30T23:59:59",
        sizes: ["3 Drawers (H70×W60 cm)", "5 Drawers (H120×W60 cm)"],
        colors: ["Matte White", "Black", "Birch"],
        color: "Matte White",
        image: [
            "images/white-drawer-unit.svg",
            "images/white-drawer-unit-1.avif",
            "images/white-drawer-unit-2.avif",
            "images/white-drawer-unit-3.avif"
        ],
        category: "Bedroom",
        new: false,
        description: "A practical drawer unit with clean lines and generous storage space. Each drawer glides smoothly on precision-built rails and features integrated handles for a seamless look. The moisture-resistant surface coating makes it suitable for bedrooms and bathrooms alike. Assembly is straightforward with the included step-by-step guide."
    },
    {
        id: 9,
        name: "Black Tray Table",
        price: 40,
        discount: 50,
        rating: 4.5,
        reviews: 38,
        offerExpiry: "2026-04-30T23:59:59",
        sizes: ["Small (45×35 cm)", "Large (60×45 cm)"],
        colors: ["Black", "White", "Walnut"],
        color: "Black",
        image: [
            "images/black-tray-table.svg",
            "images/black-tray-table-1.avif",
            "images/black-tray-table-2.avif",
            "images/black-tray-table-3.avif"
        ],
        category: "Living Room",
        new: false,
        description: "A simple and functional tray table perfect for coffee or decor items. Its removable tray top doubles as a serving piece, while the folding stand makes it easy to store when not in use. The powder-coated metal frame is scratch-resistant and lightweight, making this table easy to move around the living room, bedroom, or balcony."
    },
    {
        id: 10,
        name: "Floor Lamp",
        price: 38,
        discount: 50,
        rating: 4.9,
        reviews: 41,
        offerExpiry: "2026-04-30T23:59:59",
        sizes: ["H140 cm", "H160 cm", "H180 cm"],
        colors: ["Light Wood & White", "Bamboo & White", "Black & White"],
        color: "Light Wood & White",
        image: [
            "images/floor-lamp.svg",
            "images/floor-lamp-1.avif",
            "images/floor-lamp-2.avif",
            "images/floor-lamp-3.avif"
        ],
        category: "Bedroom",
        new: false,
        description: "A sleek floor lamp that brings soft ambient lighting to your space. The tripod-style wooden legs create a Scandinavian aesthetic, while the adjustable linen shade directs light upward or downward depending on your mood. Suitable for reading corners, living rooms, or bedrooms, it casts a warm, even glow that reduces eye strain and creates a relaxing ambiance."
    },
    {
        id: 11,
        name: "Black Brown Side Table",
        price: 34,
        discount: 50,
        rating: 4.6,
        reviews: 22,
        offerExpiry: "2026-04-30T23:59:59",
        sizes: ["Round Ø45 cm", "Square 50×50 cm", "Square 60×60 cm"],
        colors: ["Espresso Brown", "Black", "Oak"],
        color: "Espresso Brown",
        image: [
            "images/black-brown-side-table.svg",
            "images/black-brown-side-table-1.avif",
            "images/black-brown-side-table-2.avif",
            "images/black-brown-side-table-3.avif"
        ],
        category: "Living Room",
        new: false,
        description: "A compact side table with a versatile design for any corner of the room. The two-tone finish combines a rich espresso top with slender metal legs, giving it a contemporary industrial feel. The spacious surface comfortably holds a lamp, book, or a cup of coffee, while its lightweight construction makes it easy to reposition as needed."
    },
    {
        id: 12,
        name: "Light Beige Pillow",
        price: 8,
        discount: 50,
        rating: 4.8,
        reviews: 67,
        offerExpiry: "2026-04-30T23:59:59",
        sizes: ["40×40 cm", "50×50 cm", "65×65 cm"],
        colors: ["Cream Beige", "Dusty Rose", "Sage Green", "Terracotta"],
        color: "Cream Beige",
        image: [
            "images/light-beige-pillow.svg",
            "images/light-beige-pillow-1.avif",
            "images/light-beige-pillow-2.avif",
            "images/light-beige-pillow-3.avif"
        ],
        category: "Bedroom",
        new: false,
        description: "A soft decorative pillow in a light beige tone for extra comfort. Filled with hypoallergenic microfibre and encased in a smooth cotton-blend cover, this pillow is gentle on the skin and easy to wash. Its neutral tone pairs effortlessly with most bedding and sofa colours, making it a simple yet effective way to refresh any room's look."
    },
    {
        id: 13,
        name: "Off-white Pillow",
        price: 16,
        discount: 50,
        rating: 4.7,
        reviews: 44,
        offerExpiry: "2026-04-16T23:59:59",
        sizes: ["40×40 cm", "50×50 cm", "65×65 cm"],
        colors: ["Soft White", "Warm Gray", "Pearl"],
        color: "Soft White",
        image: [
            "images/offwhite-pillow.svg",
            "images/offwhite-pillow-1.avif",
            "images/offwhite-pillow-2.avif",
            "images/offwhite-pillow-3.avif"
        ],
        category: "Bedroom",
        new: false,
        description: "An elegant off-white pillow that complements a calm and modern interior. The textured woven cover adds subtle visual interest without overwhelming a curated space. The inner insert holds its shape wash after wash, maintaining its plump, inviting appearance. Perfect for layering with other cushions on a bed or sofa for a designer-inspired look."
    },
    {
        id: 14,
        name: "KALLAX Shelf Unit",
        price: 129,
        discount: 0,
        rating: 4.9,
        reviews: 312,
        sizes: ["77×77 cm (2×2)", "147×77 cm (4×2)", "147×147 cm (4×4)"],
        colors: ["White", "Black-Brown", "Birch Effect"],
        color: "White",
        image: [
            "images/kallax-shelf.avif",
            "images/kallax-shelf-1.avif",
            "images/kallax-shelf-2.avif",
            "images/kallax-shelf-3.avif"
        ],
        category: "Living Room",
        new: false,
        description: "A versatile shelving unit that adapts to your storage needs in any room. The cube format lets you mix open shelving with optional insert boxes for a personalised storage solution. Made from durable particleboard with a scratch-resistant surface, it can stand alone or be combined with multiple units. Suitable for books, plants, decorative items, or baskets."
    },
    {
        id: 15,
        name: "HEMNES Bed Frame",
        price: 3049,
        discount: 0,
        rating: 4.8,
        reviews: 189,
        sizes: ["140×200 cm", "160×200 cm (Queen)", "180×200 cm (King)"],
        colors: ["White Stain", "Black-Brown", "Light Beige"],
        color: "White Stain",
        image: [
            "images/hemnes-bed.avif",
            "images/hemnes-bed-1.avif",
            "images/hemnes-bed-2.avif",
            "images/hemnes-bed-3.avif",
            "images/hemnes-bed-4.avif"
        ],
        category: "Bedroom",
        new: true,
        description: "A solid wood bed frame with classic design and generous under-bed drawers. Crafted from solid pine with a smooth painted finish, the HEMNES bed frame brings timeless Scandinavian style to the bedroom. The two large pull-out drawers provide ample hidden storage for bed linen and seasonal items. Compatible with all standard mattresses and easy to assemble."
    },
    {
        id: 16,
        name: "POÄNG Armchair",
        price: 179,
        discount: 0,
        rating: 4.7,
        reviews: 245,
        sizes: ["Standard (W68×D82×H100 cm)", "High Back (W68×D82×H107 cm)"],
        colors: ["Birch / Natural", "Birch / White", "Black-Brown / Natural"],
        color: "Birch / Natural",
        image: [
            "images/poang-armchair.avif",
            "images/poang-armchair-1.avif",
            "images/poang-armchair-2.avif",
            "images/poang-armchair-3.avif"
        ],
        category: "Living Room",
        new: false,
        description: "A timeless armchair with a springy bent wood frame and comfortable cushion. The layered bent birch frame is designed to flex with your body weight, providing a natural, gentle bounce that makes long sitting sessions more comfortable. The seat and back cushion are removable and washable. A true design classic that looks equally at home in a reading nook, living room, or office."
    },
    {
        id: 17,
        name: "BILLY Bookcase",
        price: 89,
        discount: 0,
        rating: 4.9,
        reviews: 421,
        sizes: ["H202×W40 cm", "H202×W80 cm", "H106×W80 cm"],
        colors: ["White", "Oak Effect", "Black-Brown"],
        color: "White",
        image: [
            "images/billy-bookcase.avif",
            "images/billy-bookcase-1.avif",
            "images/billy-bookcase-2.avif",
            "images/billy-bookcase-3.avif",
            "images/billy-bookcase-4.avif"
        ],
        category: "Living Room",
        new: false,
        description: "A classic bookcase that provides generous and flexible book storage. The BILLY bookcase features adjustable shelves that can be repositioned to fit books of any size, from paperbacks to large art books. The sturdy back panel keeps everything stable, and the powder-coated frame ensures lasting durability. One of the most beloved and practical storage solutions for any room."
    }
];

// ─── Homepage carousel ────────────────────────────────────────────────────────

// Renders the first 6 products as interactive cards in the homepage carousel.
// Buttons (like and add-to-cart) are hidden on desktop until hover and always
// visible on tablet/mobile. Responds to cart:cleared and wishlist:cleared events.
const cardsContainer = document.querySelector(".product-carousel .cards");

if (cardsContainer) {
    products.slice(0, 6).forEach((product) => {
        const finalPrice = getDiscountPrice(product.price, product.discount);

        const card = document.createElement("div");
        card.className = "card";

        const mainImage = Array.isArray(product.image) ? product.image[0] : product.image;

        card.innerHTML = `
        <div class="card-img">
            ${product.new ? '<span class="badge">NEW</span>' : ''}
            ${product.discount > 0 ? `<span class="discount${!product.new ? ' discount-only' : ''}">-${product.discount}%</span>` : ''}
            <button class="likebtn notactive">
                <i class="fa-regular fa-heart"></i>
            </button>
            <img src="${mainImage}" alt="${product.name}">
            <button class="add-to-cartBtn notactive">Add to cart</button>
        </div>
        <div class="card-info">
            <div class="product-rating">
                ${renderStars(product.rating)}
            </div>
            <h3>${product.name}</h3>
            <div class="price">
                $${finalPrice}
                ${product.discount > 0 ? `<small class="old-price">$<s>${product.price.toFixed(2)}</s></small>` : ''}
            </div>
        </div>`;

        const likeBtn = card.querySelector(".likebtn");
        const addToCartBtn = card.querySelector(".add-to-cartBtn");
        const oldPrice = card.querySelector(".old-price");

        if (window.innerWidth <= 1024) {
            likeBtn.style.display = "block";
            addToCartBtn.style.display = "block";
            if (oldPrice) oldPrice.style.opacity = "1";
            likeBtn.classList.remove("notactive");
            likeBtn.classList.add("active");
            addToCartBtn.classList.remove("notactive");
            addToCartBtn.classList.add("active");
        } else {
            likeBtn.style.display = "none";
            addToCartBtn.style.display = "none";
            if (oldPrice) oldPrice.style.opacity = "0";
        }

        if (isProductInCart(product.id)) {
            addToCartBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Added — Go to Cart`;
            addToCartBtn.classList.add("added");
        } else {
            addToCartBtn.innerHTML = "Add to Cart";
        }

        if (isProductInWishlist(product.id)) {
            likeBtn.style.color = "#FF5630";
            likeBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
        } else {
            likeBtn.style.color = "#6C7275";
        }

        card.addEventListener("mouseenter", () => {
            if (window.innerWidth > 1024) {
                likeBtn.classList.remove("notactive");
                likeBtn.classList.add("active");
                likeBtn.style.display = "block";
                addToCartBtn.classList.remove("notactive");
                addToCartBtn.classList.add("active");
                addToCartBtn.style.display = "block";
                if (oldPrice) oldPrice.style.opacity = "1";
            }
        });

        card.addEventListener("mouseleave", () => {
            if (window.innerWidth > 1024) {
                likeBtn.classList.remove("active");
                likeBtn.classList.add("notactive");
                likeBtn.style.display = "none";
                addToCartBtn.classList.remove("active");
                addToCartBtn.classList.add("notactive");
                addToCartBtn.style.display = "none";
                if (oldPrice) oldPrice.style.opacity = "0";
            }
        });

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
        });

        card.querySelector(".card-info").addEventListener("click", () => {
            window.location.href = `product.html?id=${product.id}`;
        });
        card.querySelector("img").addEventListener("click", () => {
            window.location.href = `product.html?id=${product.id}`;
        });

        cardsContainer.appendChild(card);
    });

    window.addEventListener("resize", () => {
        const cards = cardsContainer.querySelectorAll(".card");
        cards.forEach(card => {
            const lb = card.querySelector(".likebtn");
            const ab = card.querySelector(".add-to-cartBtn");
            const op = card.querySelector(".old-price");
            if (!lb || !ab) return;
            if (window.innerWidth <= 1024) {
                lb.style.display = "block";
                ab.style.display = "block";
                if (op) op.style.opacity = "1";
            } else {
                lb.style.display = "none";
                ab.style.display = "none";
                if (op) op.style.opacity = "0";
            }
        });
    });

    window.addEventListener("cart:cleared", () => {
        cardsContainer.querySelectorAll(".card").forEach(card => {
            const ab = card.querySelector(".add-to-cartBtn");
            if (ab) { ab.innerHTML = "Add to cart"; ab.classList.remove("added"); }
        });
    });

    window.addEventListener("wishlist:cleared", () => {
        cardsContainer.querySelectorAll(".card").forEach(card => {
            const lb = card.querySelector(".likebtn");
            if (lb) {
                lb.innerHTML = '<i class="fa-regular fa-heart"></i>';
                lb.style.color = "#6C7275";
            }
        });
    });
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
// calculeazaPretFinal = Romanian for "calculate final price".
// Used by cart.js when building the cart entry for a product.
// Note: getDiscountPrice() in app.js does the same calculation — consider consolidating.
function calculeazaPretFinal(produs) {
    if (produs.discount) {
        return (produs.price - (produs.price * produs.discount / 100)).toFixed(2);
    }
    return Number(produs.price).toFixed(2);
}

// Toggles a product in/out of the wishlist by ID and updates the heart button appearance.
// Note: PascalCase name is inconsistent with the rest of the codebase (camelCase).
// Consider renaming to addToWishList to match addToCartList.
function AddToWishList(id, button) {
    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    const produs = products.find(prod => prod.id === id);
    const indexFindproduct = wishlist.findIndex(prod => prod.id === id);
    if (!produs) return;

    if (indexFindproduct !== -1) {
        wishlist.splice(indexFindproduct, 1);
        button.style.color = "#6C7275";
        button.innerHTML = `<i class="fa-regular fa-heart"></i>`;
    } else {
        wishlist.push({
            id: produs.id,
            name: produs.name,
            finalPrice: calculeazaPretFinal(produs),
            quantity: 1,
            image: produs.image,
            color: produs.color
        });
        button.innerHTML = `<i class="fa-solid fa-heart"></i>`;
        button.style.color = "#FF5630";
    }
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    updateWishlistNr();
}

// Updates all wishlist badge elements on the page with the current total item count.
function updateWishlistNr() {
    const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    const count = wishlist.reduce((total, p) => total + (Number(p.quantity) || 1), 0);
    document.querySelectorAll(".wishlist-articlesNr").forEach(span => {
        span.textContent = count;
    });
}

// Returns true if any wishlist item matches the given product ID.
function isProductInWishlist(id) {
    const wishlistProducts = JSON.parse(localStorage.getItem("wishlist")) || [];
    return wishlistProducts.some(prod => prod.id === id);
}

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    if (!category) return;

    const select = document.querySelector("#category-filter, select[name='category']");
    if (select) {
        select.value = category;
        select.dispatchEvent(new Event("change", { bubbles: true }));
    }

    const buttons = document.querySelectorAll("[data-category], .category-filter button");
    buttons.forEach((btn) => {
        const value = (btn.dataset.category || btn.textContent || "").trim().toLowerCase();
        if (value === category.toLowerCase()) {
            btn.click();
        }
    });
});
