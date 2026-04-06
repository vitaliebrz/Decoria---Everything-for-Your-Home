// ─── Storage helpers ──────────────────────────────────────────────────────────
function getAccounts() {
    return JSON.parse(localStorage.getItem("decoria_accounts")) || [];
}

function saveAccounts(accounts) {
    localStorage.setItem("decoria_accounts", JSON.stringify(accounts));
}

function getCurrentUser() {
    const id = localStorage.getItem("decoria_current_user");
    if (!id) return null;
    return getAccounts().find(a => a.id === id) || null;
}

function setCurrentUser(id) {
    localStorage.setItem("decoria_current_user", id || "");
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Page state ───────────────────────────────────────────────────────────────
const authSection = document.getElementById("auth-section");
const accountSection = document.getElementById("account-section");

function showAuthSection() {
    authSection.style.display = "";
    accountSection.style.display = "none";
}

function showAccountSection() {
    authSection.style.display = "none";
    accountSection.style.display = "";
}

function initPage() {
    const user = getCurrentUser();
    if (user) {
        showAccountSection();
        populateAccountSection(user);
    } else {
        showAuthSection();
    }
    updateHeaderProfileBtn();
}

// ─── Header profile button update (used on all pages via app.js) ──────────────
function updateHeaderProfileBtn() {
    const user = getCurrentUser();
    document.querySelectorAll("#profile-btn").forEach(btn => {
        if (user) {
            const initials = getInitials(user.firstName, user.lastName);
            if (user.avatar) {
                btn.innerHTML = `<img src="${user.avatar}" alt="${user.displayName}" class="header-avatar-img">`;
            } else {
                btn.innerHTML = `<div class="header-avatar-initials">${initials}</div>`;
            }
            btn.title = user.displayName;
        } else {
            btn.innerHTML = `<img src="images/user-circle.svg" alt="">`;
            btn.title = "";
        }
    });

    // Update Sign In button text in burger menu
    document.querySelectorAll(".mobile-signin-btn").forEach(btn => {
        btn.textContent = user ? "My Account" : "Sign In";
    });
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function getInitials(firstName, lastName) {
    const f = (firstName || "").trim()[0] || "";
    const l = (lastName || "").trim()[0] || "";
    return (f + l).toUpperCase() || "?";
}

function formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

function setError(fieldId, message) {
    const el = document.getElementById(fieldId + "-error");
    if (el) {
        el.textContent = message;
        el.style.display = message ? "block" : "none";
    }
    const input = document.getElementById(fieldId);
    if (input) input.classList.toggle("input-error", !!message);
}

function clearErrors(...fieldIds) {
    fieldIds.forEach(id => setError(id, ""));
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getPasswordStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: "weak", label: "Weak", pct: 33 };
    if (score <= 2) return { level: "medium", label: "Medium", pct: 66 };
    return { level: "strong", label: "Strong", pct: 100 };
}

// ─── Avatar helpers ───────────────────────────────────────────────────────────
function setAvatarDisplay(avatarEl, initialsEl, imgEl, user) {
    if (!avatarEl) return;
    const initials = getInitials(user.firstName, user.lastName);
    if (user.avatar) {
        imgEl.src = user.avatar;
        imgEl.style.display = "block";
        initialsEl.style.display = "none";
    } else {
        imgEl.style.display = "none";
        initialsEl.textContent = initials;
        initialsEl.style.display = "block";
    }
    // Color based on initial
    const colors = ["#2F7694", "#38CB89", "#FF5630", "#FFC554", "#6C7275", "#377DFF"];
    const idx = (initials.charCodeAt(0) || 0) % colors.length;
    avatarEl.style.backgroundColor = user.avatar ? "transparent" : colors[idx];
}

// ─── Populate account dashboard ───────────────────────────────────────────────
function populateAccountSection(user) {
    // Sidebar
    document.getElementById("sidebar-display-name").textContent = user.displayName || `${user.firstName} ${user.lastName}`;
    document.getElementById("sidebar-email").textContent = user.email;
    setAvatarDisplay(
        document.getElementById("sidebar-avatar"),
        document.getElementById("sidebar-avatar-initials"),
        document.getElementById("sidebar-avatar-img"),
        user
    );

    // Profile avatar
    setAvatarDisplay(
        document.getElementById("profile-avatar"),
        document.getElementById("profile-avatar-initials"),
        document.getElementById("profile-avatar-img"),
        user
    );

    // Avatar info
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    document.getElementById("avatar-full-name").textContent = fullName || user.displayName;
    document.getElementById("member-since").textContent = formatDate(user.createdAt);

    // Profile form fields
    document.getElementById("profile-firstname").value = user.firstName || "";
    document.getElementById("profile-lastname").value = user.lastName || "";
    document.getElementById("profile-displayname").value = user.displayName || "";
    document.getElementById("profile-email").value = user.email || "";

    // Saved payment method
    const paymentSection = document.getElementById("saved-payment-section");
    const paymentCard    = document.getElementById("saved-payment-card");
    if (paymentSection && paymentCard && user.savedPaymentMethod) {
        paymentCard.innerHTML = paymentInfoHTML(user.savedPaymentMethod);
        paymentSection.style.display = "";
    } else if (paymentSection) {
        paymentSection.style.display = "none";
    }

    // Render orders
    renderOrders();
}

// ─── Tabs (Login / Register) ──────────────────────────────────────────────────
document.querySelectorAll(".auth-tab, .switch-tab").forEach(btn => {
    btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        switchAuthTab(tab);
    });
});

function switchAuthTab(tab) {
    document.querySelectorAll(".auth-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
    document.querySelectorAll(".auth-form").forEach(f => f.classList.toggle("active", f.id === `${tab}-form`));
    clearErrors("login-email", "login-password", "reg-firstname", "reg-lastname", "reg-displayname", "reg-email", "reg-password", "reg-confirm-password");
}

// ─── Password visibility toggle ───────────────────────────────────────────────
document.querySelectorAll(".toggle-pw").forEach(btn => {
    btn.addEventListener("click", () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const isText = input.type === "text";
        input.type = isText ? "password" : "text";
        btn.querySelector("i").className = isText ? "fa-regular fa-eye" : "fa-regular fa-eye-slash";
    });
});

// ─── Login form ───────────────────────────────────────────────────────────────
const loginForm = document.getElementById("login-form");
if (loginForm) {
    loginForm.addEventListener("submit", e => {
        e.preventDefault();
        const identifier = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        let valid = true;

        clearErrors("login-email", "login-password");

        if (!identifier) {
            setError("login-email", "Please enter your email or username.");
            valid = false;
        }
        if (!password) {
            setError("login-password", "Please enter your password.");
            valid = false;
        }
        if (!valid) return;

        const accounts = getAccounts();
        const user = accounts.find(a =>
            a.email.toLowerCase() === identifier.toLowerCase() ||
            a.displayName.toLowerCase() === identifier.toLowerCase()
        );

        if (!user) {
            setError("login-email", "No account found with this email or username.");
            return;
        }
        if (user.password !== password) {
            setError("login-password", "Incorrect password.");
            return;
        }

        setCurrentUser(user.id);
        showToast(`Welcome back, ${user.displayName}!`, "success");
        showAccountSection();
        populateAccountSection(user);
        updateHeaderProfileBtn();
    });
}

// ─── Register form ────────────────────────────────────────────────────────────
const registerForm = document.getElementById("register-form");
if (registerForm) {
    registerForm.addEventListener("submit", e => {
        e.preventDefault();

        const firstName = document.getElementById("reg-firstname").value.trim();
        const lastName = document.getElementById("reg-lastname").value.trim();
        const displayName = document.getElementById("reg-displayname").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const password = document.getElementById("reg-password").value;
        const confirmPw = document.getElementById("reg-confirm-password").value;

        clearErrors("reg-firstname", "reg-lastname", "reg-displayname", "reg-email", "reg-password", "reg-confirm-password");
        let valid = true;

        if (!firstName) { setError("reg-firstname", "First name is required."); valid = false; }
        if (!lastName) { setError("reg-lastname", "Last name is required."); valid = false; }
        if (!displayName) {
            setError("reg-displayname", "Username is required.");
            valid = false;
        } else if (!/^[a-zA-Z0-9_.-]{3,20}$/.test(displayName)) {
            setError("reg-displayname", "Username must be 3–20 chars, letters/numbers/_ only.");
            valid = false;
        }
        if (!email) {
            setError("reg-email", "Email is required.");
            valid = false;
        } else if (!validateEmail(email)) {
            setError("reg-email", "Please enter a valid email address.");
            valid = false;
        }
        if (!password) {
            setError("reg-password", "Password is required.");
            valid = false;
        } else if (password.length < 6) {
            setError("reg-password", "Password must be at least 6 characters.");
            valid = false;
        }
        if (!confirmPw) {
            setError("reg-confirm-password", "Please confirm your password.");
            valid = false;
        } else if (password && confirmPw !== password) {
            setError("reg-confirm-password", "Passwords do not match.");
            valid = false;
        }
        if (!valid) return;

        const accounts = getAccounts();
        if (accounts.find(a => a.email.toLowerCase() === email.toLowerCase())) {
            setError("reg-email", "An account with this email already exists.");
            return;
        }
        if (accounts.find(a => a.displayName.toLowerCase() === displayName.toLowerCase())) {
            setError("reg-displayname", "This username is already taken.");
            return;
        }

        const newUser = {
            id: generateId(),
            firstName,
            lastName,
            displayName,
            email,
            password,
            avatar: null,
            createdAt: new Date().toISOString()
        };

        accounts.push(newUser);
        saveAccounts(accounts);
        setCurrentUser(newUser.id);

        showToast(`Welcome to Decoria, ${newUser.displayName}!`, "success");
        showAccountSection();
        populateAccountSection(newUser);
        updateHeaderProfileBtn();
    });
}

// ─── Sidebar navigation (shared helper) ──────────────────────────────────────
const PANEL_META = {
    profile:  { icon: "fa-regular fa-user",                    label: "My Profile" },
    password: { icon: "fa-solid fa-lock",                      label: "Change Password" },
    address:  { icon: "fa-solid fa-location-dot",              label: "Address" },
    orders:   { icon: "fa-solid fa-bag-shopping",              label: "Orders History" },
    payment:  { icon: "fa-regular fa-credit-card",             label: "Payment Methods" },
    wishlist: { icon: "fa-regular fa-heart",                   label: "Your Wishlist" }
};

function switchPanel(panelId) {
    document.querySelectorAll(".sidebar-nav-btn[data-panel]").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".account-panel").forEach(p => p.classList.remove("active"));

    const btn = document.querySelector(`.sidebar-nav-btn[data-panel="${panelId}"]`);
    if (btn) btn.classList.add("active");

    const panel = document.getElementById(`panel-${panelId}`);
    if (panel) panel.classList.add("active");

    // Sync custom dropdown button label + icon
    const meta = PANEL_META[panelId];
    if (meta) {
        const btnIcon = document.querySelector(".sdd-btn-icon");
        const btnLabel = document.querySelector(".sdd-btn-label");
        if (btnIcon) btnIcon.className = `${meta.icon} sdd-btn-icon`;
        if (btnLabel) btnLabel.textContent = meta.label;
    }
    // Update active state in dropdown list
    document.querySelectorAll(".sdd-option").forEach(o => {
        o.classList.toggle("active", o.dataset.panel === panelId);
    });

    if (panelId === "orders") renderOrders();
    if (panelId === "wishlist") renderWishlistPanel();
    if (panelId === "address") renderAddressCards();
    if (panelId === "payment") renderPaymentMethods();
}

document.querySelectorAll(".sidebar-nav-btn[data-panel]").forEach(btn => {
    btn.addEventListener("click", () => switchPanel(btn.dataset.panel));
});

// ─── Custom mobile dropdown ───────────────────────────────────────────────────
const sddBtn = document.getElementById("sdd-btn");
const sddList = document.getElementById("sdd-list");

function openSdd() {
    sddList.style.display = "block";
    sddBtn.setAttribute("aria-expanded", "true");
    sddBtn.classList.add("open");
}

function closeSdd() {
    sddList.style.display = "none";
    sddBtn.setAttribute("aria-expanded", "false");
    sddBtn.classList.remove("open");
}

if (sddBtn && sddList) {
    sddBtn.addEventListener("click", () => {
        sddList.style.display === "none" ? openSdd() : closeSdd();
    });

    sddList.querySelectorAll(".sdd-option").forEach(opt => {
        opt.addEventListener("click", () => {
            switchPanel(opt.dataset.panel);
            closeSdd();
        });
    });

    document.addEventListener("click", e => {
        const wrap = document.getElementById("sidebar-dropdown-wrap");
        if (wrap && !wrap.contains(e.target)) closeSdd();
    });
}

// ─── Logout ───────────────────────────────────────────────────────────────────
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        setCurrentUser(null);
        updateHeaderProfileBtn();
        showAuthSection();
        switchAuthTab("login");
        showToast("You've been signed out.", "success");
    });
}

// ─── Avatar upload ────────────────────────────────────────────────────────────
const avatarInput = document.getElementById("avatar-file-input");
if (avatarInput) {
    avatarInput.addEventListener("change", () => {
        const file = avatarInput.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            showToast("Please select an image file.", "error");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            showToast("Image must be smaller than 2 MB.", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            const base64 = evt.target.result;
            const user = getCurrentUser();
            if (!user) return;

            const accounts = getAccounts();
            const idx = accounts.findIndex(a => a.id === user.id);
            if (idx === -1) return;
            accounts[idx].avatar = base64;
            saveAccounts(accounts);

            setAvatarDisplay(
                document.getElementById("profile-avatar"),
                document.getElementById("profile-avatar-initials"),
                document.getElementById("profile-avatar-img"),
                accounts[idx]
            );
            setAvatarDisplay(
                document.getElementById("sidebar-avatar"),
                document.getElementById("sidebar-avatar-initials"),
                document.getElementById("sidebar-avatar-img"),
                accounts[idx]
            );
            updateHeaderProfileBtn();
            showToast("Profile photo updated!", "success");
        };
        reader.readAsDataURL(file);
        avatarInput.value = "";
    });
}

// ─── Remove avatar ────────────────────────────────────────────────────────────
const removeAvatarBtn = document.getElementById("remove-avatar-btn");
if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener("click", () => {
        const user = getCurrentUser();
        if (!user || !user.avatar) return;

        const accounts = getAccounts();
        const idx = accounts.findIndex(a => a.id === user.id);
        if (idx === -1) return;
        accounts[idx].avatar = null;
        saveAccounts(accounts);

        setAvatarDisplay(
            document.getElementById("profile-avatar"),
            document.getElementById("profile-avatar-initials"),
            document.getElementById("profile-avatar-img"),
            accounts[idx]
        );
        setAvatarDisplay(
            document.getElementById("sidebar-avatar"),
            document.getElementById("sidebar-avatar-initials"),
            document.getElementById("sidebar-avatar-img"),
            accounts[idx]
        );
        updateHeaderProfileBtn();
        showToast("Profile photo removed.", "success");
    });
}

// ─── Profile form ─────────────────────────────────────────────────────────────
const profileForm = document.getElementById("profile-form");
if (profileForm) {
    // Cancel resets to saved values
    document.getElementById("profile-cancel-btn").addEventListener("click", () => {
        const user = getCurrentUser();
        if (!user) return;
        document.getElementById("profile-firstname").value = user.firstName;
        document.getElementById("profile-lastname").value = user.lastName;
        document.getElementById("profile-displayname").value = user.displayName;
        document.getElementById("profile-email").value = user.email;
        clearErrors("profile-firstname", "profile-lastname", "profile-displayname", "profile-email");
    });

    profileForm.addEventListener("submit", e => {
        e.preventDefault();

        const firstName = document.getElementById("profile-firstname").value.trim();
        const lastName = document.getElementById("profile-lastname").value.trim();
        const displayName = document.getElementById("profile-displayname").value.trim();
        const email = document.getElementById("profile-email").value.trim();

        clearErrors("profile-firstname", "profile-lastname", "profile-displayname", "profile-email");
        let valid = true;

        if (!firstName) { setError("profile-firstname", "First name is required."); valid = false; }
        if (!lastName) { setError("profile-lastname", "Last name is required."); valid = false; }
        if (!displayName) {
            setError("profile-displayname", "Username is required.");
            valid = false;
        } else if (!/^[a-zA-Z0-9_.-]{3,20}$/.test(displayName)) {
            setError("profile-displayname", "Username must be 3–20 chars, letters/numbers/_ only.");
            valid = false;
        }
        if (!email) {
            setError("profile-email", "Email is required.");
            valid = false;
        } else if (!validateEmail(email)) {
            setError("profile-email", "Please enter a valid email address.");
            valid = false;
        }
        if (!valid) return;

        const user = getCurrentUser();
        if (!user) return;

        const accounts = getAccounts();
        const idx = accounts.findIndex(a => a.id === user.id);
        if (idx === -1) return;

        // Check uniqueness (excluding self)
        const emailTaken = accounts.find(a => a.id !== user.id && a.email.toLowerCase() === email.toLowerCase());
        if (emailTaken) { setError("profile-email", "This email is already used by another account."); return; }

        const nameTaken = accounts.find(a => a.id !== user.id && a.displayName.toLowerCase() === displayName.toLowerCase());
        if (nameTaken) { setError("profile-displayname", "This username is already taken."); return; }

        accounts[idx] = { ...accounts[idx], firstName, lastName, displayName, email };
        saveAccounts(accounts);

        // Refresh UI
        populateAccountSection(accounts[idx]);
        updateHeaderProfileBtn();
        showToast("Profile updated successfully!", "success");
    });
}

// ─── Password form ────────────────────────────────────────────────────────────
const passwordForm = document.getElementById("password-form");
if (passwordForm) {
    const pwNewInput = document.getElementById("pw-new");
    const pwStrengthEl = document.getElementById("pw-strength");
    const pwStrengthFill = document.getElementById("pw-strength-fill");
    const pwStrengthLabel = document.getElementById("pw-strength-label");

    pwNewInput.addEventListener("input", () => {
        const val = pwNewInput.value;
        if (!val) {
            pwStrengthEl.style.display = "none";
            return;
        }
        const strength = getPasswordStrength(val);
        pwStrengthEl.style.display = "flex";
        pwStrengthFill.style.width = strength.pct + "%";
        pwStrengthFill.className = `pw-strength-fill pw-${strength.level}`;
        pwStrengthLabel.textContent = strength.label;
        pwStrengthLabel.className = `pw-label-${strength.level}`;
    });

    passwordForm.addEventListener("submit", e => {
        e.preventDefault();

        const current = document.getElementById("pw-current").value;
        const newPw = document.getElementById("pw-new").value;
        const confirmPw = document.getElementById("pw-confirm").value;

        clearErrors("pw-current", "pw-new", "pw-confirm");
        let valid = true;

        if (!current) { setError("pw-current", "Enter your current password."); valid = false; }
        if (!newPw) {
            setError("pw-new", "Enter a new password.");
            valid = false;
        } else if (newPw.length < 6) {
            setError("pw-new", "Password must be at least 6 characters.");
            valid = false;
        }
        if (!confirmPw) {
            setError("pw-confirm", "Please confirm your new password.");
            valid = false;
        } else if (newPw && confirmPw !== newPw) {
            setError("pw-confirm", "Passwords do not match.");
            valid = false;
        }
        if (!valid) return;

        const user = getCurrentUser();
        if (!user) return;

        if (user.password !== current) {
            setError("pw-current", "Current password is incorrect.");
            return;
        }
        if (newPw === current) {
            setError("pw-new", "New password must differ from current password.");
            return;
        }

        const accounts = getAccounts();
        const idx = accounts.findIndex(a => a.id === user.id);
        if (idx === -1) return;
        accounts[idx].password = newPw;
        saveAccounts(accounts);

        passwordForm.reset();
        pwStrengthEl.style.display = "none";
        showToast("Password changed successfully!", "success");
    });
}

// ─── Orders helpers ───────────────────────────────────────────────────────────
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function isModifiable(order) {
    if (order.status === "cancelled") return false;
    const placed = new Date(order.date).getTime();
    return Date.now() - placed < 2 * 60 * 60 * 1000; // 2 h
}

function timeRemaining(orderDateISO) {
    const deadline = new Date(orderDateISO).getTime() + 2 * 60 * 60 * 1000;
    const ms = deadline - Date.now();
    if (ms <= 0) return null;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m remaining to modify` : `${m}m remaining to modify`;
}

// ─── Color lookup ─────────────────────────────────────────────────────────────
function getItemColors(item) {
    if (typeof products !== "undefined" && item.id != null) {
        const prod = products.find(p => String(p.id) === String(item.id));
        if (prod?.colors?.length) return prod.colors;
    }
    return item.color ? [item.color] : [];
}

function renderOrderItemsHTML(items, modifiable = false) {
    if (!items || items.length === 0) return `<p class="order-no-items">No items.</p>`;
    return `<div class="order-items-expanded">${items.map((item, idx) => {
        const img    = Array.isArray(item.image) ? item.image[0] : (item.image || "");
        const colors = getItemColors(item);
        const colorSelectHTML = colors.length > 1
            ? `<div class="oie-ec-field">
                <label class="oie-ec-label">Color</label>
                <select class="oie-color-select" data-idx="${idx}">
                    ${colors.map(c => `<option value="${c}"${c === item.color ? " selected" : ""}>${c}</option>`).join("")}
                </select>
               </div>`
            : "";

        return `<div class="oie-row" data-item-idx="${idx}" data-original-qty="${item.quantity}" data-original-color="${item.color || ""}">
            <img src="${img}" alt="${item.name}" class="oie-img">
            <div class="oie-info">
                <p class="oie-name">${item.name}</p>
                <p class="oie-detail"><span class="oie-detail-label">Color:</span> <span class="oie-color-display">${item.color || "—"}</span></p>
                <p class="oie-detail"><span class="oie-detail-label">Qty:</span> <span class="oie-qty-display">${item.quantity}</span></p>
                <p class="oie-detail oie-price-inline"><span class="oie-detail-label">Price:</span> <span class="oie-price">$${(Number(item.finalPrice) * Number(item.quantity)).toFixed(2)}</span></p>
                ${modifiable ? `
                <button class="oie-edit-btn" type="button" data-idx="${idx}">
                    <i class="fa-regular fa-pen-to-square"></i><span>Edit</span>
                </button>
                <div class="oie-edit-controls">
                    ${colorSelectHTML}
                    <div class="oie-ec-field">
                        <label class="oie-ec-label">Quantity</label>
                        <div class="oie-qty-wrap">
                            <button class="oie-qty-minus" type="button"><i class="fa-solid fa-minus"></i></button>
                            <span class="oie-qty-val">${item.quantity}</span>
                            <button class="oie-qty-plus" type="button"><i class="fa-solid fa-plus"></i></button>
                        </div>
                    </div>
                    <div class="oie-edit-actions">
                        <button class="oie-remove-btn" type="button">
                            <i class="fa-solid fa-trash-can"></i> Remove
                        </button>
                        <button class="oie-save-btn" type="button">
                            <i class="fa-solid fa-check"></i> Save
                        </button>
                    </div>
                </div>` : ""}
            </div>
        </div>`;
    }).join("")}</div>`;
}

// ─── Order item edit helpers ───────────────────────────────────────────────────
function recalcOrderTotal(order) {
    return (order.items || []).reduce((sum, item) =>
        sum + Number(item.finalPrice) * Number(item.quantity), 0).toFixed(2);
}

function saveOrderItemChange(orderId, itemIdx, newQty, newColor) {
    const allOrders = JSON.parse(localStorage.getItem("decoria_orders")) || [];
    const oIdx = allOrders.findIndex(o => o.id === orderId);
    if (oIdx === -1 || !allOrders[oIdx].items[itemIdx]) return;

    const order        = allOrders[oIdx];
    const item         = order.items[itemIdx];
    const originalQty  = item.quantity;
    const qtyDiff      = newQty - originalQty;
    const unitPrice    = Number(item.finalPrice);
    const priceDiff    = Math.abs(qtyDiff) * unitPrice;
    const paymentInfo  = order.paymentInfo || null;

    const persist = () => {
        const freshOrders = JSON.parse(localStorage.getItem("decoria_orders")) || [];
        const fi = freshOrders.findIndex(o => o.id === orderId);
        if (fi === -1) return;
        freshOrders[fi].items[itemIdx].quantity = newQty;
        if (newColor) freshOrders[fi].items[itemIdx].color = newColor;
        freshOrders[fi].total = recalcOrderTotal(freshOrders[fi]);
        localStorage.setItem("decoria_orders", JSON.stringify(freshOrders));
        showToast("Order updated!", "success");
        renderOrders();
    };

    if (qtyDiff > 0) {
        showExtraPaymentModal(priceDiff, qtyDiff, paymentInfo, persist);
    } else if (qtyDiff < 0) {
        showRefundModal(priceDiff, Math.abs(qtyDiff), paymentInfo, persist);
    } else {
        // Only color changed (or no change at all)
        persist();
    }
}

// ─── Extra payment modal (qty increased) ──────────────────────────────────────
function showExtraPaymentModal(amount, qtyAdded, paymentInfo, onConfirm) {
    const overlay     = document.getElementById("extra-payment-overlay");
    const desc        = document.getElementById("extra-payment-desc");
    const cardRow     = document.getElementById("extra-payment-card");
    const confirmBtn  = document.getElementById("extra-payment-confirm");
    const cancelBtn   = document.getElementById("extra-payment-cancel");
    if (!overlay) { onConfirm(); return; }

    desc.textContent = `You added ${qtyAdded} item${qtyAdded > 1 ? "s" : ""} to your order. An additional payment of $${amount.toFixed(2)} will be charged.`;
    confirmBtn.textContent = `Pay $${amount.toFixed(2)}`;
    cardRow.innerHTML = paymentInfoHTML(paymentInfo);

    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";

    const close = () => {
        overlay.style.display = "none";
        document.body.style.overflow = "";
        confirmBtn.removeEventListener("click", onYes);
        cancelBtn.removeEventListener("click", onNo);
    };
    const onYes = () => { close(); onConfirm(); };
    const onNo  = () => close();

    confirmBtn.addEventListener("click", onYes);
    cancelBtn.addEventListener("click", onNo);
}

// ─── Refund modal (qty decreased) ─────────────────────────────────────────────
function showRefundModal(amount, qtyRemoved, paymentInfo, onConfirm) {
    const overlay     = document.getElementById("refund-overlay");
    const desc        = document.getElementById("refund-desc");
    const cardRow     = document.getElementById("refund-card");
    const confirmBtn  = document.getElementById("refund-confirm");
    const cancelBtn   = document.getElementById("refund-cancel");
    const checkbox    = document.getElementById("refund-confirm-check");
    if (!overlay) { onConfirm(); return; }

    desc.textContent = `You removed ${qtyRemoved} item${qtyRemoved > 1 ? "s" : ""} from your order. A refund of $${amount.toFixed(2)} will be returned to your payment method.`;
    cardRow.innerHTML = paymentInfoHTML(paymentInfo);

    // Reset checkbox + button state
    checkbox.checked      = false;
    confirmBtn.disabled   = true;
    checkbox.onchange     = () => { confirmBtn.disabled = !checkbox.checked; };

    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";

    const close = () => {
        overlay.style.display = "none";
        document.body.style.overflow = "";
        confirmBtn.removeEventListener("click", onYes);
        cancelBtn.removeEventListener("click", onNo);
    };
    const onYes = () => { close(); onConfirm(); };
    const onNo  = () => close();

    confirmBtn.addEventListener("click", onYes);
    cancelBtn.addEventListener("click", onNo);
}

// ─── Payment info display helper ──────────────────────────────────────────────
function paymentInfoHTML(paymentInfo) {
    if (!paymentInfo) return `<span class="opm-card-unknown"><i class="fa-regular fa-credit-card"></i> Payment method not on file</span>`;
    if (paymentInfo.type === "card" && paymentInfo.maskedCard) {
        return `<span class="opm-card-chip"><i class="fa-regular fa-credit-card"></i> ${paymentInfo.maskedCard}</span>`;
    }
    if (paymentInfo.type === "paypal" && paymentInfo.paypalEmail) {
        return `<span class="opm-card-chip"><i class="fa-brands fa-paypal"></i> ${paymentInfo.paypalEmail}</span>`;
    }
    if (paymentInfo.type === "paypal") {
        return `<span class="opm-card-chip"><i class="fa-brands fa-paypal"></i> PayPal</span>`;
    }
    return `<span class="opm-card-chip"><i class="fa-regular fa-credit-card"></i> Credit Card</span>`;
}

function removeOrderItem(orderId, itemIdx) {
    const allOrders = JSON.parse(localStorage.getItem("decoria_orders")) || [];
    const oIdx = allOrders.findIndex(o => o.id === orderId);
    if (oIdx === -1) return;
    allOrders[oIdx].items.splice(itemIdx, 1);
    if (allOrders[oIdx].items.length === 0) {
        allOrders[oIdx].status = "cancelled";
        showToast("Order cancelled — no items remaining.", "success");
    } else {
        allOrders[oIdx].total = recalcOrderTotal(allOrders[oIdx]);
        showToast("Item removed from order.", "success");
    }
    localStorage.setItem("decoria_orders", JSON.stringify(allOrders));
    renderOrders();
}

function bindOrderItemEditEvents(container, orderId) {
    container.querySelectorAll(".oie-row[data-item-idx]").forEach(row => {
        const idx      = parseInt(row.dataset.itemIdx);
        const editBtn  = row.querySelector(".oie-edit-btn");
        const minusBtn = row.querySelector(".oie-qty-minus");
        const plusBtn  = row.querySelector(".oie-qty-plus");
        const saveBtn  = row.querySelector(".oie-save-btn");
        const removeBtn = row.querySelector(".oie-remove-btn");
        const qtyVal   = row.querySelector(".oie-qty-val");
        const priceEl  = row.querySelector(".oie-price");

        if (!editBtn) return;

        let currentQty = parseInt(qtyVal?.textContent || "1");

        const refreshPriceDisplay = () => {
            const allOrders = JSON.parse(localStorage.getItem("decoria_orders")) || [];
            const order = allOrders.find(o => o.id === orderId);
            if (!order || !order.items[idx] || !priceEl) return;
            priceEl.textContent = `$${(Number(order.items[idx].finalPrice) * currentQty).toFixed(2)}`;
        };

        const colorSelect    = row.querySelector(".oie-color-select");
        const colorDisplay   = row.querySelector(".oie-color-display");

        editBtn.addEventListener("click", () => {
            const entering = !row.classList.contains("editing");
            row.classList.toggle("editing", entering);
            const icon = editBtn.querySelector("i");
            const label = editBtn.querySelector("span");
            if (entering) {
                icon.className    = "fa-solid fa-xmark";
                label.textContent = "Cancel";
            } else {
                icon.className    = "fa-regular fa-pen-to-square";
                label.textContent = "Edit";
                // Reset to stored values on cancel
                const allOrders = JSON.parse(localStorage.getItem("decoria_orders")) || [];
                const order = allOrders.find(o => o.id === orderId);
                if (order?.items[idx]) {
                    currentQty = order.items[idx].quantity;
                    qtyVal.textContent = currentQty;
                    if (priceEl) priceEl.textContent = `$${(Number(order.items[idx].finalPrice) * currentQty).toFixed(2)}`;
                    if (colorSelect) colorSelect.value = order.items[idx].color || "";
                }
            }
        });

        // Live price update when color changes (color alone doesn't change price, but update display)
        colorSelect?.addEventListener("change", () => {
            if (colorDisplay) colorDisplay.textContent = colorSelect.value;
        });

        minusBtn?.addEventListener("click", () => {
            if (currentQty > 1) { currentQty--; qtyVal.textContent = currentQty; refreshPriceDisplay(); }
        });

        plusBtn?.addEventListener("click", () => {
            if (currentQty < 99) { currentQty++; qtyVal.textContent = currentQty; refreshPriceDisplay(); }
        });

        saveBtn?.addEventListener("click", () => {
            const newColor = colorSelect ? colorSelect.value : null;
            saveOrderItemChange(orderId, idx, currentQty, newColor);
        });
        removeBtn?.addEventListener("click", () => removeOrderItem(orderId, idx));
    });
}

function buildModifyBar(order) {
    if (!isModifiable(order)) return "";
    const t = timeRemaining(order.date);
    if (!t) return "";
    return `<div class="order-modify-bar">
        <span class="order-timer" data-order-date="${order.date}">
            <i class="fa-regular fa-clock"></i>
            <span class="timer-text">${t}</span>
        </span>
        <button class="order-cancel-btn" data-order-id="${order.id}">
            <i class="fa-solid fa-ban"></i> Cancel Order
        </button>
    </div>`;
}

function startOrderTimers() {
    const tick = () => {
        document.querySelectorAll(".order-timer[data-order-date]").forEach(el => {
            const t = timeRemaining(el.dataset.orderDate);
            const txt = el.querySelector(".timer-text");
            if (t && txt) {
                txt.textContent = t;
            } else {
                el.closest(".order-modify-bar")?.remove();
            }
        });
    };
    clearInterval(window._orderTimerInterval);
    window._orderTimerInterval = setInterval(tick, 30000);
}

function bindCancelBtn(container, orderId) {
    const btn = container.querySelector(`.order-cancel-btn[data-order-id="${orderId}"]`);
    if (!btn) return;
    btn.addEventListener("click", () => {
        if (btn.dataset.confirming) {
            // Second click → confirm cancel
            const allOrders = JSON.parse(localStorage.getItem("decoria_orders")) || [];
            const idx = allOrders.findIndex(o => o.id === orderId);
            if (idx !== -1) {
                allOrders[idx].status = "cancelled";
                localStorage.setItem("decoria_orders", JSON.stringify(allOrders));
            }
            showToast("Order cancelled.", "success");
            renderOrders();
        } else {
            // First click → ask for confirmation
            btn.dataset.confirming = "1";
            btn.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Confirm Cancel?`;
            btn.classList.add("confirming");
            setTimeout(() => {
                if (btn.dataset.confirming) {
                    delete btn.dataset.confirming;
                    btn.classList.remove("confirming");
                    btn.innerHTML = `<i class="fa-solid fa-ban"></i> Cancel Order`;
                }
            }, 3000);
        }
    });
}

// ─── Orders (table layout with expand) ───────────────────────────────────────
function renderOrders() {
    const ordersList = document.getElementById("orders-list");
    if (!ordersList) return;

    const allOrders = JSON.parse(localStorage.getItem("decoria_orders")) || [];
    const user = getCurrentUser();
    const orders = user ? allOrders.filter(o => o.userId === user.id) : [];

    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div class="orders-empty">
                <i class="fa-solid fa-bag-shopping"></i>
                <h3>No orders yet</h3>
                <p>When you place an order, it will appear here.</p>
                <a href="shop.html" class="btn-primary" style="display:inline-block;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:1.4rem">Shop Now</a>
            </div>`;
        return;
    }

    const sorted = orders.slice().reverse();

    // Build containers
    ordersList.innerHTML = `
        <table class="orders-table">
            <thead>
                <tr>
                    <th>Number ID</th>
                    <th>Dates</th>
                    <th>Status</th>
                    <th>Price</th>
                    <th></th>
                </tr>
            </thead>
            <tbody id="orders-tbody"></tbody>
        </table>
        <div class="orders-mobile-list" id="orders-mobile-list"></div>`;

    const tbody     = document.getElementById("orders-tbody");
    const mobileList = document.getElementById("orders-mobile-list");

    sorted.forEach(order => {
        const status     = order.status || "delivered";
        const statusLabel = capitalize(status);
        const price      = `$${Number(order.total).toFixed(2)}`;
        const dateStr    = formatDate(order.date);
        const modifiable = isModifiable(order);
        const itemsHTML  = renderOrderItemsHTML(order.items, modifiable);
        const modBar     = buildModifyBar(order);

        /* ── Desktop: main row ── */
        const mainRow = document.createElement("tr");
        mainRow.className = "order-main-row";
        mainRow.innerHTML = `
            <td class="order-table-id">#${order.id}</td>
            <td>${dateStr}</td>
            <td><span class="order-status order-status--${status}">${statusLabel}</span></td>
            <td class="order-table-price">${price}</td>
            <td class="order-expand-cell">
                <button class="order-expand-btn" aria-label="Show order details">
                    <i class="fa-solid fa-chevron-down"></i>
                </button>
            </td>`;

        /* ── Desktop: detail row ── */
        const detailRow = document.createElement("tr");
        detailRow.className = "order-detail-row";
        detailRow.innerHTML = `
            <td colspan="5" class="order-detail-cell">
                <div class="order-detail-inner">
                    ${itemsHTML}
                    ${modBar}
                </div>
            </td>`;

        tbody.appendChild(mainRow);
        tbody.appendChild(detailRow);

        /* ── Mobile card ── */
        const mobileCard = document.createElement("div");
        mobileCard.className = "order-mobile-card";
        mobileCard.innerHTML = `
            <div class="order-mobile-header">
                <div class="omh-left">
                    <span class="order-table-id">#${order.id}</span>
                    <span class="omh-date">${dateStr}</span>
                </div>
                <div class="omh-right">
                    <span class="order-status order-status--${status}">${statusLabel}</span>
                    <span class="order-table-price">${price}</span>
                    <button class="order-expand-btn" aria-label="Show order details">
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                </div>
            </div>
            <div class="order-mobile-detail">
                ${itemsHTML}
                ${modBar}
            </div>`;

        mobileList.appendChild(mobileCard);

        /* ── Toggle logic (desktop) ── */
        mainRow.querySelector(".order-expand-btn").addEventListener("click", () => {
            const open = detailRow.classList.toggle("open");
            mainRow.querySelector(".order-expand-btn i").classList.toggle("rotated", open);
        });

        /* ── Toggle logic (mobile) ── */
        mobileCard.querySelector(".order-expand-btn").addEventListener("click", e => {
            e.stopPropagation();
            const detail = mobileCard.querySelector(".order-mobile-detail");
            const open = detail.classList.toggle("open");
            mobileCard.querySelector(".order-expand-btn i").classList.toggle("rotated", open);
        });

        /* ── Cancel + item edit buttons ── */
        bindCancelBtn(detailRow, order.id);
        bindCancelBtn(mobileCard, order.id);
        bindOrderItemEditEvents(detailRow, order.id);
        bindOrderItemEditEvents(mobileCard, order.id);
    });

    startOrderTimers();
}

// ─── Address ──────────────────────────────────────────────────────────────────
function getUserAddresses() {
    const user = getCurrentUser();
    if (!user) return { billing: null, shipping: null };
    const all = JSON.parse(localStorage.getItem("decoria_addresses")) || {};
    return all[user.id] || { billing: null, shipping: null };
}

function saveUserAddresses(addresses) {
    const user = getCurrentUser();
    if (!user) return;
    const all = JSON.parse(localStorage.getItem("decoria_addresses")) || {};
    all[user.id] = addresses;
    localStorage.setItem("decoria_addresses", JSON.stringify(all));
}

function renderAddressCards() {
    const addresses = getUserAddresses();
    renderSingleAddressCard("billing", addresses.billing);
    renderSingleAddressCard("shipping", addresses.shipping);
}

function renderSingleAddressCard(type, addr) {
    const body = document.getElementById(`${type}-address-body`);
    if (!body) return;
    if (!addr) {
        body.innerHTML = `<p class="address-empty">No ${type} address saved.</p>`;
        return;
    }
    const zipStr = addr.zip ? ` ${addr.zip}` : "";
    body.innerHTML = `
        <p>${addr.firstName} ${addr.lastName}</p>
        <p>${addr.phone}</p>
        <p>${addr.street}, ${addr.city}${zipStr}, ${addr.country}</p>`;
}

// Address modal
const addrModalOverlay = document.getElementById("address-modal-overlay");
const addrModalClose = document.getElementById("address-modal-close");
const addrModalCancel = document.getElementById("address-modal-cancel");
const addrModalTitle = document.getElementById("address-modal-title");
const addrTypeInput = document.getElementById("address-type");

function openAddressModal(type) {
    if (!addrModalOverlay) return;
    const addresses = getUserAddresses();
    const addr = addresses[type] || {};

    addrModalTitle.textContent = type === "billing" ? "Edit Billing Address" : "Edit Shipping Address";
    addrTypeInput.value = type;

    document.getElementById("addr-firstname").value = addr.firstName || "";
    document.getElementById("addr-lastname").value = addr.lastName || "";
    document.getElementById("addr-phone").value = addr.phone || "";
    document.getElementById("addr-street").value = addr.street || "";
    document.getElementById("addr-city").value = addr.city || "";
    document.getElementById("addr-country").value = addr.country || "";
    document.getElementById("addr-zip").value = addr.zip || "";

    clearErrors("addr-firstname", "addr-lastname", "addr-phone", "addr-street", "addr-city", "addr-country");
    addrModalOverlay.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeAddressModal() {
    if (!addrModalOverlay) return;
    addrModalOverlay.style.display = "none";
    document.body.style.overflow = "";
}

document.querySelectorAll(".address-edit-btn").forEach(btn => {
    btn.addEventListener("click", () => openAddressModal(btn.dataset.type));
});

if (addrModalClose) addrModalClose.addEventListener("click", closeAddressModal);
if (addrModalCancel) addrModalCancel.addEventListener("click", closeAddressModal);
if (addrModalOverlay) {
    addrModalOverlay.addEventListener("click", e => {
        if (e.target === addrModalOverlay) closeAddressModal();
    });
}

const addressForm = document.getElementById("address-form");
if (addressForm) {
    addressForm.addEventListener("submit", e => {
        e.preventDefault();
        const type = addrTypeInput.value;
        const firstName = document.getElementById("addr-firstname").value.trim();
        const lastName = document.getElementById("addr-lastname").value.trim();
        const phone = document.getElementById("addr-phone").value.trim();
        const street = document.getElementById("addr-street").value.trim();
        const city = document.getElementById("addr-city").value.trim();
        const country = document.getElementById("addr-country").value.trim();
        const zip = document.getElementById("addr-zip").value.trim();

        clearErrors("addr-firstname", "addr-lastname", "addr-phone", "addr-street", "addr-city", "addr-country");
        let valid = true;

        if (!firstName) { setError("addr-firstname", "First name is required."); valid = false; }
        if (!lastName) { setError("addr-lastname", "Last name is required."); valid = false; }
        if (!phone) { setError("addr-phone", "Phone number is required."); valid = false; }
        if (!street) { setError("addr-street", "Street address is required."); valid = false; }
        if (!city) { setError("addr-city", "City is required."); valid = false; }
        if (!country) { setError("addr-country", "Country is required."); valid = false; }
        if (!valid) return;

        const addresses = getUserAddresses();
        addresses[type] = { firstName, lastName, phone, street, city, country, zip };
        saveUserAddresses(addresses);

        renderSingleAddressCard(type, addresses[type]);
        closeAddressModal();
        showToast(`${capitalize(type)} address saved!`, "success");
    });
}

// ─── Wishlist panel ───────────────────────────────────────────────────────────
function renderWishlistPanel() {
    const container = document.getElementById("wishlist-panel-list");
    if (!container) return;

    const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    if (wishlist.length === 0) {
        container.innerHTML = `
            <div class="orders-empty">
                <i class="fa-regular fa-heart"></i>
                <h3>Your wishlist is empty</h3>
                <p>Save items you love and find them here.</p>
                <a href="shop.html" class="btn-primary" style="display:inline-block;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:1.4rem">Browse Shop</a>
            </div>`;
        return;
    }

    container.innerHTML = `
        <div class="wishlist-panel-table">
            <div class="wishlist-panel-thead">
                <span>Product</span>
            </div>
            <div class="wishlist-panel-body" id="wishlist-panel-body"></div>
        </div>`;

    const body = document.getElementById("wishlist-panel-body");

    wishlist.forEach(product => {
        const mainImage = Array.isArray(product.image) ? product.image[0] : (product.image || "");
        const cartItems = JSON.parse(localStorage.getItem("produse")) || [];
        const inCart = cartItems.some(c => c.id === product.id);

        const row = document.createElement("div");
        row.className = "wishlist-panel-row";
        row.dataset.productId = product.id;
        row.innerHTML = `
            <button class="wishlist-panel-remove" data-id="${product.id}" title="Remove">
                <i class="fa-solid fa-xmark"></i>
            </button>
            <div class="wishlist-panel-img">
                <img src="${mainImage}" alt="${product.name}">
            </div>
            <div class="wishlist-panel-info">
                <p class="wishlist-panel-name">${product.name}</p>
                <p class="wishlist-panel-color">Color: ${product.color || "—"}</p>
                <p class="wishlist-panel-price">$${Number(product.finalPrice).toFixed(2)}</p>
            </div>
            <button class="wishlist-panel-add-btn ${inCart ? "in-cart" : ""}" data-id="${product.id}">
                ${inCart ? '<i class="fa-solid fa-circle-check"></i> Added — Go to Cart' : 'Add to cart'}
            </button>`;

        row.querySelector(".wishlist-panel-remove").addEventListener("click", () => {
            let wl = JSON.parse(localStorage.getItem("wishlist")) || [];
            wl = wl.filter(p => p.id !== product.id);
            localStorage.setItem("wishlist", JSON.stringify(wl));
            if (typeof updateWishlistNr === "function") updateWishlistNr();
            window.dispatchEvent(new CustomEvent("wishlist:updated"));
            renderWishlistPanel();
        });

        row.querySelector(".wishlist-panel-add-btn").addEventListener("click", (e) => {
            if (inCart) {
                window.location.href = "cart.html";
                return;
            }
            if (typeof addToCartList === "function") {
                addToCartList(product.id, e.currentTarget);
                e.currentTarget.innerHTML = '<i class="fa-solid fa-circle-check"></i> Added — Go to Cart';
                e.currentTarget.classList.add("in-cart");
            }
        });

        body.appendChild(row);
    });
}

// ─── Payment Methods ──────────────────────────────────────────────────────────
function getUserCards() {
    const user = getCurrentUser();
    if (!user) return [];
    const all = JSON.parse(localStorage.getItem("decoria_cards")) || {};
    return all[user.id] || [];
}

function saveUserCards(cards) {
    const user = getCurrentUser();
    if (!user) return;
    const all = JSON.parse(localStorage.getItem("decoria_cards")) || {};
    all[user.id] = cards;
    localStorage.setItem("decoria_cards", JSON.stringify(all));
}

function renderPaymentMethods() {
    const list = document.getElementById("payment-methods-list");
    if (!list) return;
    const cards = getUserCards();

    if (cards.length === 0) {
        list.innerHTML = `<p class="address-empty pm-empty">No payment methods saved. Add a card to get started.</p>`;
        return;
    }

    list.innerHTML = cards.map((card, idx) => {
        const icon = cardBrandIcon(card.maskedNumber);
        const isDefault = card.isDefault;
        return `<div class="pm-card-item${isDefault ? " pm-card-default" : ""}" data-idx="${idx}">
            <div class="pm-card-visual">
                <i class="${icon} pm-card-brand-icon"></i>
                <div class="pm-card-details">
                    <span class="pm-card-number">${card.maskedNumber}</span>
                    <span class="pm-card-meta">${card.nickname ? card.nickname + " · " : ""}Expires ${card.expiry}</span>
                </div>
            </div>
            <div class="pm-card-actions">
                ${!isDefault ? `<button class="pm-set-default-btn" data-idx="${idx}" title="Set as default"><i class="fa-regular fa-star"></i> Set default</button>` : `<span class="pm-default-badge"><i class="fa-solid fa-star"></i> Default</span>`}
                <button class="pm-delete-btn" data-idx="${idx}" title="Remove card"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        </div>`;
    }).join("");

    // Bind actions
    list.querySelectorAll(".pm-set-default-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const cards = getUserCards();
            cards.forEach((c, i) => c.isDefault = i === parseInt(btn.dataset.idx));
            saveUserCards(cards);
            renderPaymentMethods();
        });
    });
    list.querySelectorAll(".pm-delete-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const cards = getUserCards();
            const removed = cards.splice(parseInt(btn.dataset.idx), 1)[0];
            // If deleted was default, promote next
            if (removed?.isDefault && cards.length > 0) cards[0].isDefault = true;
            saveUserCards(cards);
            renderPaymentMethods();
            showToast("Card removed.", "success");
        });
    });
}

function cardBrandIcon() {
    return "fa-regular fa-credit-card";
}

// ── Add Card Modal ──
const addCardModalOverlay = document.getElementById("add-card-modal-overlay");
const addCardModalClose   = document.getElementById("add-card-modal-close");
const addCardModalCancel  = document.getElementById("add-card-modal-cancel");
const addCardBtn          = document.getElementById("add-card-btn");
const addCardForm         = document.getElementById("add-card-form");

function openAddCardModal() {
    if (!addCardModalOverlay) return;
    addCardForm?.reset();
    clearErrors("new-card-number", "new-card-exp", "new-card-cvc");
    addCardModalOverlay.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeAddCardModal() {
    if (!addCardModalOverlay) return;
    addCardModalOverlay.style.display = "none";
    document.body.style.overflow = "";
}

if (addCardBtn) addCardBtn.addEventListener("click", openAddCardModal);
if (addCardModalClose) addCardModalClose.addEventListener("click", closeAddCardModal);
if (addCardModalCancel) addCardModalCancel.addEventListener("click", closeAddCardModal);
if (addCardModalOverlay) {
    addCardModalOverlay.addEventListener("click", e => {
        if (e.target === addCardModalOverlay) closeAddCardModal();
    });
}

// Card number formatting inside modal
const newCardNumberInput = document.getElementById("new-card-number");
if (newCardNumberInput) {
    newCardNumberInput.addEventListener("input", () => {
        let val = newCardNumberInput.value.replace(/\D/g, "").substring(0, 16);
        newCardNumberInput.value = val.match(/.{1,4}/g)?.join(" ") || val;
    });
}
const newCardExpInput = document.getElementById("new-card-exp");
if (newCardExpInput) {
    newCardExpInput.addEventListener("input", () => {
        let val = newCardExpInput.value.replace(/\D/g, "").substring(0, 4);
        if (val.length >= 2) val = val.substring(0, 2) + "/" + val.substring(2);
        newCardExpInput.value = val;
    });
}
const newCardCvcInput = document.getElementById("new-card-cvc");
if (newCardCvcInput) {
    newCardCvcInput.addEventListener("input", () => {
        newCardCvcInput.value = newCardCvcInput.value.replace(/\D/g, "").substring(0, 4);
    });
}

if (addCardForm) {
    addCardForm.addEventListener("submit", e => {
        e.preventDefault();
        const num      = (document.getElementById("new-card-number").value || "").replace(/\s/g, "");
        const exp      = (document.getElementById("new-card-exp").value || "").trim();
        const cvc      = (document.getElementById("new-card-cvc").value || "").trim();
        const nickname = (document.getElementById("new-card-nickname").value || "").trim();

        clearErrors("new-card-number", "new-card-exp", "new-card-cvc");
        let valid = true;

        const CARD_RE   = /^\d{16}$/;
        const EXPIRY_RE = /^(0[1-9]|1[0-2])\/\d{2}$/;
        const CVV_RE    = /^\d{3,4}$/;

        if (!CARD_RE.test(num))      { setError("new-card-number", "Enter a valid 16-digit card number."); valid = false; }
        if (!EXPIRY_RE.test(exp))    { setError("new-card-exp",    "Enter a valid expiry date (MM/YY)."); valid = false; }
        if (!CVV_RE.test(cvc))       { setError("new-card-cvc",    "Enter a valid CVV (3–4 digits)."); valid = false; }
        if (!valid) return;

        const masked = "**** **** **** " + num.slice(-4);
        const cards  = getUserCards();
        const isDefault = cards.length === 0; // first card becomes default

        // Prevent duplicates by last 4
        const last4 = num.slice(-4);
        if (cards.some(c => c.maskedNumber.endsWith(last4))) {
            setError("new-card-number", "This card is already saved.");
            return;
        }

        cards.push({ maskedNumber: masked, expiry: exp, nickname, isDefault });
        saveUserCards(cards);
        closeAddCardModal();
        renderPaymentMethods();
        showToast("Card saved successfully!", "success");
    });
}

// ─── Forgot password ──────────────────────────────────────────────────────────
const forgotBtn = document.getElementById("forgot-password-btn");
if (forgotBtn) {
    forgotBtn.addEventListener("click", () => {
        const identifier = document.getElementById("login-email").value.trim();
        if (!identifier) {
            setError("login-email", "Enter your email or username first.");
            return;
        }
        const user = getAccounts().find(a =>
            a.email.toLowerCase() === identifier.toLowerCase() ||
            a.displayName.toLowerCase() === identifier.toLowerCase()
        );
        if (!user) {
            setError("login-email", "No account found with this email or username.");
            return;
        }
        showToast(`Password reset link sent to ${user.email} (demo only).`, "success");
    });
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", initPage);
