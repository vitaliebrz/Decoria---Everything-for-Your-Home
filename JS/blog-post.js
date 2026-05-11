// ─── Blog Post Page ───────────────────────────────────────────────────────────

// Formats an ISO date string into a human-readable "Month Day, Year" label.
function formatBlogPostDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// Iterates over the post's content blocks and renders each as a <h2>, <p>, or <img>.
function renderPostContent(contentArr) {
    const container = document.getElementById("blog-post-content");
    if (!container || !contentArr) return;

    container.innerHTML = "";
    contentArr.forEach(block => {
        if (block.type === "heading") {
            const h = document.createElement("h2");
            h.className = "blog-post-heading";
            h.textContent = block.text;
            container.appendChild(h);
        } else if (block.type === "paragraph") {
            const p = document.createElement("p");
            p.className = "blog-post-paragraph";
            p.textContent = block.text;
            container.appendChild(p);
        } else if (block.type === "image") {
            const img = document.createElement("img");
            img.src = block.src;
            img.alt = block.alt || "";
            img.className = "blog-post-inline-img";
            container.appendChild(img);
        }
    });
}

// Renders the post's tag chips below the article content.
function renderPostTags(tags) {
    const container = document.getElementById("blog-post-tags");
    if (!container || !tags || tags.length === 0) return;

    container.innerHTML = "<span class='blog-tags-label'>Tags:</span>";
    tags.forEach(tag => {
        const span = document.createElement("span");
        span.className = "blog-tag";
        span.textContent = tag;
        container.appendChild(span);
    });
}

// Renders the sidebar featured post widget, excluding the current post to avoid self-reference.
// Falls back to the featured post itself if no other featured post exists.
function renderSidebarFeatured(currentId) {
    const container = document.getElementById("bp-sidebar-featured");
    if (!container) return;

    const featured = blogPosts.find(p => p.featured && p.id !== currentId)
        || blogPosts.find(p => p.featured);

    if (!featured) return;

    container.innerHTML = `
        <a href="blog-post.html?id=${featured.id}" class="bp-sidebar-featured-link">
            <img src="${featured.image}" alt="${featured.title}">
            <div>
                <span class="blog-featured-cat">${featured.category}</span>
                <p class="bp-sidebar-featured-title">${featured.title}</p>
                <span class="bp-sidebar-featured-meta"><i class="fa-regular fa-clock"></i> ${featured.readTime} min read</span>
            </div>
        </a>`;
}

// Renders the four most recent posts in the sidebar, excluding the currently viewed one.
function renderSidebarRecent(currentId) {
    const container = document.getElementById("bp-sidebar-recent");
    if (!container) return;

    const recent = [...blogPosts]
        .filter(p => p.id !== currentId)
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

// Renders the sidebar category list with per-category article counts and links to blog.html.
function renderSidebarCategories() {
    const container = document.getElementById("bp-sidebar-cats");
    if (!container) return;

    const categories = ["Decoration", "Organization", "Trends", "DIY", "Guides"];
    container.innerHTML = "";
    categories.forEach(cat => {
        const count = blogPosts.filter(p => p.category === cat).length;
        const li = document.createElement("li");
        li.innerHTML = `<a href="blog.html?category=${encodeURIComponent(cat)}" class="bp-cat-link">
            <span>${cat}</span>
            <span class="cat-count">(${count})</span>
        </a>`;
        container.appendChild(li);
    });
}

// Renders up to three same-category posts as "Related Posts".
// If fewer than three exist in the same category, fills the remaining slots with other posts.
function renderRelatedPosts(post) {
    const container = document.getElementById("blog-related-grid");
    const section = document.getElementById("blog-related-section");
    if (!container) return;

    const related = blogPosts
        .filter(p => p.id !== post.id && p.category === post.category)
        .slice(0, 3);

    // Fill with other posts if not enough same-category ones.
    if (related.length < 3) {
        const others = blogPosts
            .filter(p => p.id !== post.id && p.category !== post.category)
            .slice(0, 3 - related.length);
        related.push(...others);
    }

    if (related.length === 0) {
        if (section) section.style.display = "none";
        return;
    }

    container.innerHTML = "";
    related.forEach(p => {
        const card = document.createElement("div");
        card.className = "blog-card-page";
        card.innerHTML = `
            <div class="blog-card-img" style="cursor:pointer">
                <span class="blog-card-category">${p.category}</span>
                <img src="${p.image}" alt="${p.title}">
            </div>
            <div class="blog-card-body">
                <div class="blog-card-meta">
                    <span><i class="fa-regular fa-calendar"></i> ${formatBlogPostDate(p.date)}</span>
                    <span><i class="fa-regular fa-clock"></i> ${p.readTime} min read</span>
                </div>
                <h3 class="blog-card-title">${p.title}</h3>
                <p class="blog-card-excerpt">${p.excerpt}</p>
                <a href="blog-post.html?id=${p.id}" class="more-products blog-read-more">Read More <i class="fa-solid fa-arrow-right-long"></i></a>
            </div>`;

        card.querySelector(".blog-card-img").addEventListener("click", () => {
            window.location.href = `blog-post.html?id=${p.id}`;
        });
        card.querySelector(".blog-card-title").addEventListener("click", () => {
            window.location.href = `blog-post.html?id=${p.id}`;
        });

        container.appendChild(card);
    });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = parseInt(urlParams.get("id"));

    // Redirect to the blog list if the URL has no valid post ID.
    if (!postId || !Array.isArray(blogPosts)) {
        window.location.href = "blog.html";
        return;
    }

    const post = blogPosts.find(p => p.id === postId);
    if (!post) {
        window.location.href = "blog.html";
        return;
    }

    document.title = `Decoria - ${post.title}`;

    // Populate hero section.
    const heroImg = document.getElementById("blog-post-hero-img");
    if (heroImg) { heroImg.src = post.image; heroImg.alt = post.title; }

    const heroCat = document.getElementById("blog-post-hero-category");
    if (heroCat) heroCat.textContent = post.category;

    const heroTitle = document.getElementById("blog-post-hero-title");
    if (heroTitle) heroTitle.textContent = post.title;

    const heroDate = document.getElementById("blog-post-hero-date");
    if (heroDate) heroDate.textContent = formatBlogPostDate(post.date);

    const heroReadtime = document.getElementById("blog-post-hero-readtime");
    if (heroReadtime) heroReadtime.textContent = post.readTime;

    const heroAuthor = document.getElementById("blog-post-hero-author");
    if (heroAuthor) heroAuthor.textContent = post.author;

    // Truncate long titles in the breadcrumb to prevent overflow.
    const breadcrumbTitle = document.getElementById("blog-post-breadcrumb-title");
    if (breadcrumbTitle) breadcrumbTitle.textContent = post.title.length > 40 ? post.title.slice(0, 40) + "…" : post.title;

    renderPostContent(post.content);
    renderPostTags(post.tags);

    renderSidebarFeatured(post.id);
    renderSidebarRecent(post.id);

    renderRelatedPosts(post);
});
