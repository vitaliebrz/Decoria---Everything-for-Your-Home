// ─── Blog Page ───────────────────────────────────────────────────────────────

const blogCardsEl = document.getElementById("blog-cards");
const blogShowMoreBtn = document.getElementById("blog-show-more-btn");

let blogVisibleCount = 6;
const BLOG_INITIAL = 6;
const BLOG_STEP = 3;
let activeBlogCategory = "all";
let activeBlogSort = "newest";

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Formats an ISO date string into a human-readable "Month Day, Year" label.
function formatBlogDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// Returns a filtered and sorted copy of blogPosts based on the active category and sort options.
function getBlogFiltered() {
    let list = [...blogPosts];

    if (activeBlogCategory !== "all") {
        list = list.filter(p => p.category === activeBlogCategory);
    }

    if (activeBlogSort === "newest") {
        list.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (activeBlogSort === "oldest") {
        list.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (activeBlogSort === "read-time-asc") {
        list.sort((a, b) => a.readTime - b.readTime);
    } else if (activeBlogSort === "read-time-desc") {
        list.sort((a, b) => b.readTime - a.readTime);
    } else if (activeBlogSort === "az") {
        list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
}

// Returns true when the blog grid is currently in any list/single-column view mode.
function isBlogListView() {
    return blogCardsEl && (
        blogCardsEl.classList.contains("blog-list") ||
        blogCardsEl.classList.contains("blog-tablet-1") ||
        blogCardsEl.classList.contains("blog-phone-1")
    );
}

// ─── Render Cards ─────────────────────────────────────────────────────────────

// Clears and re-renders the visible blog cards based on active filters and the current visible count.
// Also updates the Show More / Show Less button visibility.
function renderBlogCards() {
    if (!blogCardsEl) return;
    blogCardsEl.innerHTML = "";

    const filtered = getBlogFiltered();
    const toShow = filtered.slice(0, blogVisibleCount);

    if (toShow.length === 0) {
        blogCardsEl.innerHTML = "<p style='color:var(--neutral04);padding:40px 0'>No articles found.</p>";
        if (blogShowMoreBtn) blogShowMoreBtn.style.display = "none";
        return;
    }

    const isList = isBlogListView();

    toShow.forEach(post => {
        const card = document.createElement("div");
        card.className = "blog-card-page" + (isList ? " list-view" : "");

        card.innerHTML = `
            <div class="blog-card-img" style="cursor:pointer">
                <span class="blog-card-category">${post.category}</span>
                <img src="${post.image}" alt="${post.title}">
            </div>
            <div class="blog-card-body">
                <div class="blog-card-meta">
                    <span><i class="fa-regular fa-calendar"></i> ${formatBlogDate(post.date)}</span>
                    <span><i class="fa-regular fa-clock"></i> ${post.readTime} min read</span>
                </div>
                <h3 class="blog-card-title">${post.title}</h3>
                <p class="blog-card-excerpt">${post.excerpt}</p>
                <a href="blog-post.html?id=${post.id}" class="more-products blog-read-more">Read More <i class="fa-solid fa-arrow-right-long"></i></a>
            </div>`;

        card.querySelector(".blog-card-img").addEventListener("click", () => {
            window.location.href = `blog-post.html?id=${post.id}`;
        });
        card.querySelector(".blog-card-title").addEventListener("click", () => {
            window.location.href = `blog-post.html?id=${post.id}`;
        });

        blogCardsEl.appendChild(card);
    });

    if (!blogShowMoreBtn) return;
    if (filtered.length <= BLOG_INITIAL) {
        blogShowMoreBtn.style.display = "none";
    } else {
        blogShowMoreBtn.style.display = "flex";
        blogShowMoreBtn.textContent = blogVisibleCount >= filtered.length ? "Show Less" : "Show More";
    }
}

// ─── Show More ────────────────────────────────────────────────────────────────

if (blogShowMoreBtn) {
    // Expands to show BLOG_STEP more posts, or collapses back to BLOG_INITIAL when all are shown.
    blogShowMoreBtn.addEventListener("click", () => {
        const total = getBlogFiltered().length;
        if (blogVisibleCount >= total) {
            blogVisibleCount = BLOG_INITIAL;
            renderBlogCards();
            blogCardsEl.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
            blogVisibleCount = Math.min(blogVisibleCount + BLOG_STEP, total);
            renderBlogCards();
        }
    });
}

// ─── Dropdown helper (reuse pattern from shop.js) ─────────────────────────────

// Initialises a custom dropdown element and returns a controller with setValue()
// so external code can sync the dropdown display without triggering the onChange callback.
function initBlogDropdown(dropdownEl, onChange) {
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
        // Updates the dropdown's displayed value without firing onChange.
        setValue(value) {
            const item = [...items].find(i => i.dataset.value === value);
            if (!item) return;
            items.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            selectedSpan.textContent = item.textContent.trim();
        }
    };
}

// Close all open dropdowns when the user clicks outside of them.
document.addEventListener("click", () => {
    document.querySelectorAll(".custom-dropdown.open").forEach(d => d.classList.remove("open"));
});

// Init dropdowns
const blogCatDropdownCtrl = initBlogDropdown(
    document.getElementById("blog-category-dropdown"),
    (value) => {
        activeBlogCategory = value;
        syncSidebarCatBtns(value);
        blogVisibleCount = BLOG_INITIAL;
        renderBlogCards();
    }
);

const blogSortDropdownCtrl = initBlogDropdown(
    document.getElementById("blog-sort-dropdown"),
    (value) => {
        activeBlogSort = value;
        blogVisibleCount = BLOG_INITIAL;
        renderBlogCards();
    }
);

// ─── Sidebar Category Buttons ─────────────────────────────────────────────────

// Highlights the sidebar category button that matches the currently active category.
function syncSidebarCatBtns(category) {
    document.querySelectorAll("#blog-category-list .category-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.category === category);
    });
}

document.querySelectorAll("#blog-category-list .category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        activeBlogCategory = btn.dataset.category;
        syncSidebarCatBtns(activeBlogCategory);
        blogCatDropdownCtrl.setValue(activeBlogCategory);
        blogVisibleCount = BLOG_INITIAL;
        renderBlogCards();
    });
});

// ─── Sidebar: Category counts ─────────────────────────────────────────────────

// Renders the article count next to each sidebar category label.
function renderCategoryCounts() {
    const categories = ["Decoration", "Organization", "Trends", "DIY", "Guides"];
    categories.forEach(cat => {
        const el = document.getElementById("cnt-" + cat);
        if (el) {
            const count = blogPosts.filter(p => p.category === cat).length;
            el.textContent = `(${count})`;
        }
    });
}

// ─── Sidebar: Recent Posts ────────────────────────────────────────────────────

// Renders the four most recent posts in the sidebar "Recent Posts" widget.
function renderRecentPosts() {
    const container = document.getElementById("blog-recent-list");
    if (!container) return;

    const recent = [...blogPosts]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 4);

    container.innerHTML = "";
    recent.forEach(post => {
        const item = document.createElement("a");
        item.href = `blog-post.html?id=${post.id}`;
        item.className = "blog-recent-item";
        item.innerHTML = `
            <img src="${post.image}" alt="${post.title}">
            <div>
                <span class="blog-recent-cat">${post.category}</span>
                <p class="blog-recent-title">${post.title}</p>
            </div>`;
        container.appendChild(item);
    });
}

// ─── Sidebar: Featured Widget ─────────────────────────────────────────────────

// Renders the first post marked as featured in the sidebar highlight widget.
function renderFeaturedWidget() {
    const container = document.getElementById("blog-featured-widget");
    if (!container) return;

    const featured = blogPosts.find(p => p.featured);
    if (!featured) return;

    container.innerHTML = `
        <a href="blog-post.html?id=${featured.id}" class="blog-featured-widget-link">
            <img src="${featured.image}" alt="${featured.title}">
            <span class="blog-featured-cat">${featured.category}</span>
            <p class="blog-featured-title">${featured.title}</p>
            <span class="blog-featured-meta"><i class="fa-regular fa-clock"></i> ${featured.readTime} min read</span>
        </a>`;
}

// ─── View Toggle ──────────────────────────────────────────────────────────────

const blogGrid3Btn = document.getElementById("blog-grid-3-btn");
const blogGrid2Btn = document.getElementById("blog-grid-2-btn");
const blogListBtn = document.getElementById("blog-list-btn");
const blogTablet2Btn = document.getElementById("blog-tablet-2-btn");
const blogTablet1Btn = document.getElementById("blog-tablet-1-btn");

// Switches the blog grid to the specified desktop layout (grid-3, grid-2, or list).
function setBlogDesktopView(view) {
    [blogGrid3Btn, blogGrid2Btn, blogListBtn].forEach(b => b && b.classList.remove("active"));
    if (!blogCardsEl) return;
    if (view === "grid-3") {
        if (blogGrid3Btn) blogGrid3Btn.classList.add("active");
        blogCardsEl.className = "blog-grid blog-grid-3";
    } else if (view === "grid-2") {
        if (blogGrid2Btn) blogGrid2Btn.classList.add("active");
        blogCardsEl.className = "blog-grid blog-grid-2";
    } else if (view === "list") {
        if (blogListBtn) blogListBtn.classList.add("active");
        blogCardsEl.className = "blog-grid blog-list";
    }
}

// Switches the blog grid to the specified tablet layout (tablet-2 or tablet-1).
function setBlogTabletView(view) {
    [blogTablet2Btn, blogTablet1Btn].forEach(b => b && b.classList.remove("active"));
    if (!blogCardsEl) return;
    if (view === "tablet-2") {
        if (blogTablet2Btn) blogTablet2Btn.classList.add("active");
        blogCardsEl.className = "blog-grid blog-tablet-2";
    } else {
        if (blogTablet1Btn) blogTablet1Btn.classList.add("active");
        blogCardsEl.className = "blog-grid blog-tablet-1";
    }
}

// Forces the single-column phone layout (no toggle button needed on small screens).
function setBlogPhoneView() {
    if (!blogCardsEl) return;
    blogCardsEl.className = "blog-grid blog-phone-1";
}

if (blogGrid3Btn) blogGrid3Btn.addEventListener("click", () => { setBlogDesktopView("grid-3"); renderBlogCards(); });
if (blogGrid2Btn) blogGrid2Btn.addEventListener("click", () => { setBlogDesktopView("grid-2"); renderBlogCards(); });
if (blogListBtn) blogListBtn.addEventListener("click", () => { setBlogDesktopView("list"); renderBlogCards(); });
if (blogTablet2Btn) blogTablet2Btn.addEventListener("click", () => { setBlogTabletView("tablet-2"); renderBlogCards(); });
if (blogTablet1Btn) blogTablet1Btn.addEventListener("click", () => { setBlogTabletView("tablet-1"); renderBlogCards(); });

// ─── Resize ───────────────────────────────────────────────────────────────────

// Debounced at 150 ms — switches to the appropriate layout tier when the viewport changes.
let blogResizeTimer;
window.addEventListener("resize", () => {
    clearTimeout(blogResizeTimer);
    blogResizeTimer = setTimeout(() => {
        const w = window.innerWidth;
        const cls = blogCardsEl ? blogCardsEl.className : "";
        const hasTablet = cls.includes("blog-tablet");
        const hasPhone = cls.includes("blog-phone");
        const hasDesktop = !hasTablet && !hasPhone;

        if (w <= 767 && !hasPhone) { setBlogPhoneView(); renderBlogCards(); }
        else if (w > 767 && w <= 1024 && !hasTablet) { setBlogTabletView("tablet-2"); renderBlogCards(); }
        else if (w > 1024 && !hasDesktop) { setBlogDesktopView("grid-3"); renderBlogCards(); }
    }, 150);
});

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    if (!blogCardsEl) return;

    // Set the initial layout based on the current viewport width.
    const w = window.innerWidth;
    if (w <= 767) setBlogPhoneView();
    else if (w <= 1024) setBlogTabletView("tablet-2");
    else setBlogDesktopView("grid-3");

    // Apply category filter from URL query params (e.g. blog.html?category=DIY).
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get("category");
    if (catParam) {
        activeBlogCategory = catParam;
        blogCatDropdownCtrl.setValue(catParam);
        syncSidebarCatBtns(catParam);
    }

    renderCategoryCounts();
    renderRecentPosts();
    renderFeaturedWidget();
    renderBlogCards();
});
