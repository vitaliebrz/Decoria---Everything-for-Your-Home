// ─── Current user (from Supabase cache) ──────────────────────────────────────
// Returns the logged-in user profile from supabase-client, or null if unavailable.
function getCurrentUser() {
    return typeof sbCurrentUser === 'function' ? sbCurrentUser() : null;
}

// ─── Page state ───────────────────────────────────────────────────────────────
const authSection = document.getElementById('auth-section');
const accountSection = document.getElementById('account-section');

// Shows the login/register form and hides the account dashboard.
function showAuthSection() {
    authSection.style.display = '';
    accountSection.style.display = 'none';
}

// Shows the account dashboard and hides the login/register form.
function showAccountSection() {
    authSection.style.display = 'none';
    accountSection.style.display = '';
}

// Entry point called once the session resolves — shows the correct section
// and optionally activates a panel via the ?tab= URL parameter.
function initPage(user) {
    if (user) {
        showAccountSection();
        populateAccountSection(user);
        const tab = new URLSearchParams(window.location.search).get("tab");
        if (tab) switchPanel(tab);
    } else {
        showAuthSection();
    }
    updateHeaderProfileBtn();
}

// ─── Header profile button ────────────────────────────────────────────────────
// Refreshes all #profile-btn elements on the page to show the user's avatar (or
// initials) when logged in, and the default icon when logged out.
function updateHeaderProfileBtn() {
    const user = getCurrentUser();
    document.querySelectorAll('#profile-btn').forEach(btn => {
        if (user) {
            const initials = getInitials(user.firstName, user.lastName);
            if (user.avatar) {
                btn.innerHTML = `<img src="${user.avatar}" alt="${user.displayName}" class="header-avatar-img">`;
            } else {
                const bgColor = getAvatarInitialsColor(initials);
                btn.innerHTML = `<div class="header-avatar-initials" style="background-color:${bgColor}">${initials}</div>`;
            }
            btn.title = user.displayName;
        } else {
            btn.innerHTML = `<img src="images/user-circle.svg" alt="">`;
            btn.title = '';
        }
    });
    document.querySelectorAll('.mobile-signin-btn').forEach(btn => {
        btn.textContent = user ? 'My Account' : 'Sign In';
    });
}

// ─── Utilities ────────────────────────────────────────────────────────────────
// Builds a two-letter initials string from first and last name. Returns "?" if both are empty.
function getInitials(firstName, lastName) {
    const f = (firstName || '').trim()[0] || '';
    const l = (lastName || '').trim()[0] || '';
    return (f + l).toUpperCase() || '?';
}

// Deterministically picks a background colour for the initials avatar based on the
// first character code, so the same user always gets the same colour.
function getAvatarInitialsColor(initials) {
    const colors = ['#2F7694', '#38CB89', '#FF5630', '#FFC554', '#6C7275', '#377DFF'];
    const idx = (String(initials || '').charCodeAt(0) || 0) % colors.length;
    return colors[idx];
}

// Formats an ISO date string to "Month Year" (e.g. "April 2025") for the "Member since" label.
function formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

// Shows an inline error message for a form field and adds the visual error class.
// Passing an empty string clears the error and removes the class.
function setError(fieldId, message) {
    const el = document.getElementById(fieldId + '-error');
    if (el) {
        el.textContent = message;
        el.style.display = message ? 'block' : 'none';
    }
    const input = document.getElementById(fieldId);
    if (input) input.classList.toggle('input-error', !!message);
}

// Clears error state from all provided field IDs at once (e.g. on form re-submit).
function clearErrors(...fieldIds) {
    fieldIds.forEach(id => setError(id, ''));
}

// Returns true if the string matches a basic email pattern (user@domain.tld).
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Scores a password on four criteria (length, uppercase, digit, special char)
// and returns a { level, label, pct } object used to render the strength bar.
function getPasswordStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 'weak', label: 'Weak', pct: 33 };
    if (score <= 2) return { level: 'medium', label: 'Medium', pct: 66 };
    return { level: 'strong', label: 'Strong', pct: 100 };
}

// ─── Avatar helpers ───────────────────────────────────────────────────────────
// Toggles between showing the avatar photo and the initials fallback depending
// on whether the user has an uploaded avatar. Works for both sidebar and profile avatars.
function setAvatarDisplay(avatarEl, initialsEl, imgEl, user) {
    if (!avatarEl) return;
    const initials = getInitials(user.firstName, user.lastName);
    const bgColor = getAvatarInitialsColor(initials);
    if (user.avatar) {
        imgEl.src = user.avatar;
        imgEl.style.display = 'block';
        initialsEl.style.display = 'none';
    } else {
        imgEl.style.display = 'none';
        initialsEl.textContent = initials;
        initialsEl.style.display = 'block';
    }
    avatarEl.style.backgroundColor = user.avatar ? 'transparent' : bgColor;
}

// ─── Populate account dashboard ───────────────────────────────────────────────
// Fills every editable field and display element in the account dashboard
// from the current user object and triggers an initial orders render.
function populateAccountSection(user) {
    document.getElementById('sidebar-display-name').textContent = user.displayName || `${user.firstName} ${user.lastName}`;
    document.getElementById('sidebar-email').textContent = user.email;
    setAvatarDisplay(
        document.getElementById('sidebar-avatar'),
        document.getElementById('sidebar-avatar-initials'),
        document.getElementById('sidebar-avatar-img'),
        user
    );
    setAvatarDisplay(
        document.getElementById('profile-avatar'),
        document.getElementById('profile-avatar-initials'),
        document.getElementById('profile-avatar-img'),
        user
    );

    const fullName = `${user.firstName} ${user.lastName}`.trim();
    document.getElementById('avatar-full-name').textContent = fullName || user.displayName;
    document.getElementById('member-since').textContent = formatDate(user.createdAt);

    document.getElementById('profile-firstname').value = user.firstName || '';
    document.getElementById('profile-lastname').value = user.lastName || '';
    document.getElementById('profile-displayname').value = user.displayName || '';
    document.getElementById('profile-email').value = user.email || '';

    const paymentSection = document.getElementById('saved-payment-section');
    const paymentCard = document.getElementById('saved-payment-card');
    if (paymentSection && paymentCard && user.savedPaymentMethod) {
        paymentCard.innerHTML = paymentInfoHTML(user.savedPaymentMethod);
        paymentSection.style.display = '';
    } else if (paymentSection) {
        paymentSection.style.display = 'none';
    }

    renderOrders();
}

// ─── Tabs (Login / Register) ──────────────────────────────────────────────────
document.querySelectorAll('.auth-tab, .switch-tab').forEach(btn => {
    btn.addEventListener('click', () => switchAuthTab(btn.dataset.tab));
});

// Activates the given auth tab ("login" or "register") and clears all field errors.
function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.toggle('active', f.id === `${tab}-form`));
    clearErrors('login-email', 'login-password', 'reg-firstname', 'reg-lastname', 'reg-displayname', 'reg-email', 'reg-password', 'reg-confirm-password');
}

// ─── Password visibility toggle ───────────────────────────────────────────────
document.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const isText = input.type === 'text';
        input.type = isText ? 'password' : 'text';
        btn.querySelector('i').className = isText ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
    });
});

// ─── Login form ───────────────────────────────────────────────────────────────
const loginForm = document.getElementById('login-form');
if (loginForm) {
    const loginIdentifierInput = document.getElementById('login-email');
    const loginIdentifierIcon = loginIdentifierInput?.closest('.input-wrap')?.querySelector('i');

    const updateLoginIdentifierIcon = () => {
        if (!loginIdentifierInput || !loginIdentifierIcon) return;
        const value = loginIdentifierInput.value.trim();
        const isEmail = value.includes('@');
        loginIdentifierIcon.className = isEmail ? 'fa-regular fa-envelope' : 'fa-solid fa-at';
    };

    loginIdentifierInput?.addEventListener('input', updateLoginIdentifierIcon);
    updateLoginIdentifierIcon();

    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        const identifier = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        clearErrors('login-email', 'login-password');
        if (!identifier) { setError('login-email', 'Please enter your email or username.'); return; }
        if (!password) { setError('login-password', 'Please enter your password.'); return; }

        const submitBtn = loginForm.querySelector('[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in…';

        try {
            const { user, error } = await sbSignIn(identifier, password);

            if (error) {
                if (error.message === 'user_not_found') {
                    setError('login-email', 'No account found with this email or username.');
                } else if (error.message?.toLowerCase().includes('invalid') ||
                    error.message?.toLowerCase().includes('credentials')) {
                    setError('login-password', 'Incorrect password.');
                } else if (error.message?.toLowerCase().includes('confirmed')) {
                    setError('login-email', 'Please confirm your email address first. Check your inbox.');
                } else {
                    setError('login-email', error.message || 'No account found with this email or username.');
                }
                return;
            }

            if (!user) {
                setError('login-email', 'Account not found. Please sign up.');
                return;
            }

            await _mergeCartOnLogin();
            await _mergeWishlistOnLogin();

            showToast(`Welcome back, ${user.displayName}!`, 'success');
            showAccountSection();
            populateAccountSection(user);
            updateHeaderProfileBtn();
        } catch (err) {
            console.error('Login error:', err);
            setError('login-email', 'Something went wrong. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    });
}

// Merge strategy: account cart wins on conflict (same id → keep account version).
// Guest items that don't exist in the account cart are appended.
async function _mergeCartOnLogin() {
    const localCart = JSON.parse(localStorage.getItem('produse')) || [];
    const sbCart = await sbLoadCart() || [];
    const merged = [...sbCart];
    localCart.forEach(item => {
        if (!merged.find(s => s.id === item.id)) merged.push(item);
    });
    localStorage.setItem('produse', JSON.stringify(merged));
    if (typeof updateCartNr === 'function') updateCartNr();
    if (typeof updateCartTotals === 'function') updateCartTotals();
    await sbSyncCart(merged);
}

// Merges the guest wishlist with the saved account wishlist using the same
// account-wins strategy as _mergeCartOnLogin.
async function _mergeWishlistOnLogin() {
    const localWl = JSON.parse(localStorage.getItem('wishlist')) || [];
    const sbWl = await sbLoadWishlist() || [];
    const merged = [...sbWl];
    localWl.forEach(item => {
        if (!merged.find(s => s.id === item.id)) merged.push(item);
    });
    localStorage.setItem('wishlist', JSON.stringify(merged));
    if (typeof updateWishlistNr === 'function') updateWishlistNr();
    await sbSyncWishlist(merged);
}

// ─── Register form ────────────────────────────────────────────────────────────
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async e => {
        e.preventDefault();

        const firstName = document.getElementById('reg-firstname').value.trim();
        const lastName = document.getElementById('reg-lastname').value.trim();
        const displayName = document.getElementById('reg-displayname').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirmPw = document.getElementById('reg-confirm-password').value;

        clearErrors('reg-firstname', 'reg-lastname', 'reg-displayname', 'reg-email', 'reg-password', 'reg-confirm-password');
        let valid = true;

        if (!firstName) { setError('reg-firstname', 'First name is required.'); valid = false; }
        if (!lastName) { setError('reg-lastname', 'Last name is required.'); valid = false; }
        if (!displayName) {
            setError('reg-displayname', 'Username is required.'); valid = false;
        } else if (!/^[a-zA-Z0-9_.\-]{3,20}$/.test(displayName)) {
            setError('reg-displayname', 'Username must be 3–20 chars, letters/numbers/_ only.'); valid = false;
        }
        if (!email) {
            setError('reg-email', 'Email is required.'); valid = false;
        } else if (!validateEmail(email)) {
            setError('reg-email', 'Please enter a valid email address.'); valid = false;
        }
        if (!password) {
            setError('reg-password', 'Password is required.'); valid = false;
        } else if (password.length < 6) {
            setError('reg-password', 'Password must be at least 6 characters.'); valid = false;
        }
        if (!confirmPw) {
            setError('reg-confirm-password', 'Please confirm your password.'); valid = false;
        } else if (password && confirmPw !== password) {
            setError('reg-confirm-password', 'Passwords do not match.'); valid = false;
        }
        if (!valid) return;

        const submitBtn = registerForm.querySelector('[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account…';

        try {
            const { user, error, needsEmailConfirmation } = await sbSignUp(email, password, firstName, lastName, displayName);

            if (error) {
                if (error.message === 'username_taken') {
                    setError('reg-displayname', 'This username is already taken.');
                } else if (error.message?.toLowerCase().includes('already registered')) {
                    setError('reg-email', 'An account with this email already exists.');
                } else if (error.message?.toLowerCase().includes('duplicate key') || error.code === '23505') {
                    setError('reg-email', 'This account already exists. Please sign in or reset password.');
                } else {
                    setError('reg-email', error.message || 'Registration failed. Please try again.');
                }
                return;
            }

            if (!user) {
                setError('reg-email', 'Registration failed. Please try again.');
                return;
            }

            if (needsEmailConfirmation) {
                showToast('Account created. Please confirm your email, then sign in.', 'success');
                switchAuthTab('login');
                document.getElementById('login-email').value = email;
                document.getElementById('login-password').value = '';
                return;
            }

            showToast(`Welcome to Decoria, ${user.displayName}!`, 'success');
            showAccountSection();
            populateAccountSection(user);
            updateHeaderProfileBtn();
        } catch (err) {
            console.error('Register error:', err);
            setError('reg-email', err?.message || 'Something went wrong. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }
    });
}

// ─── Sidebar navigation ───────────────────────────────────────────────────────
// Metadata for each panel: used to update the mobile dropdown button icon and label
// when switching panels, keeping the UI in sync without extra DOM queries.
const PANEL_META = {
    profile: { icon: 'fa-regular fa-user', label: 'My Profile' },
    password: { icon: 'fa-solid fa-lock', label: 'Change Password' },
    address: { icon: 'fa-solid fa-location-dot', label: 'Address' },
    orders: { icon: 'fa-solid fa-bag-shopping', label: 'Orders History' },
    payment: { icon: 'fa-regular fa-credit-card', label: 'Payment Methods' },
    wishlist: { icon: 'fa-regular fa-heart', label: 'Your Wishlist' }
};

// Deactivates the current panel and activates the requested one.
// Also lazy-loads data-heavy panels (orders, wishlist, address, payment) on first view.
function switchPanel(panelId) {
    document.querySelectorAll('.sidebar-nav-btn[data-panel]').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.account-panel').forEach(p => p.classList.remove('active'));

    const btn = document.querySelector(`.sidebar-nav-btn[data-panel="${panelId}"]`);
    if (btn) btn.classList.add('active');

    const panel = document.getElementById(`panel-${panelId}`);
    if (panel) panel.classList.add('active');

    const meta = PANEL_META[panelId];
    if (meta) {
        const btnIcon = document.querySelector('.sdd-btn-icon');
        const btnLabel = document.querySelector('.sdd-btn-label');
        if (btnIcon) btnIcon.className = `${meta.icon} sdd-btn-icon`;
        if (btnLabel) btnLabel.textContent = meta.label;
    }
    document.querySelectorAll('.sdd-option').forEach(o => {
        o.classList.toggle('active', o.dataset.panel === panelId);
    });

    if (panelId === 'orders') renderOrders();
    if (panelId === 'wishlist') renderWishlistPanel();
    if (panelId === 'address') renderAddressCards();
    if (panelId === 'payment') renderPaymentMethods();
}

document.querySelectorAll('.sidebar-nav-btn[data-panel]').forEach(btn => {
    btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
});

// ─── Custom mobile dropdown ───────────────────────────────────────────────────
const sddBtn = document.getElementById('sdd-btn');
const sddList = document.getElementById('sdd-list');

// Opens the mobile sidebar dropdown and marks the trigger button as expanded.
function openSdd() { sddList.style.display = 'block'; sddBtn.setAttribute('aria-expanded', 'true'); sddBtn.classList.add('open'); }
// Closes the mobile sidebar dropdown and resets the trigger button state.
function closeSdd() { sddList.style.display = 'none'; sddBtn.setAttribute('aria-expanded', 'false'); sddBtn.classList.remove('open'); }

if (sddBtn && sddList) {
    sddBtn.addEventListener('click', () => sddList.style.display === 'none' ? openSdd() : closeSdd());
    sddList.querySelectorAll('.sdd-option').forEach(opt => {
        opt.addEventListener('click', () => {
            if (!opt.dataset.panel) return;
            switchPanel(opt.dataset.panel);
            closeSdd();
        });
    });
    document.addEventListener('click', e => {
        const wrap = document.getElementById('sidebar-dropdown-wrap');
        if (wrap && !wrap.contains(e.target)) closeSdd();
    });
}

// ─── Sidebar cart links ──────────────────────────────────────────────────────
const sidebarCartLink = document.getElementById('sidebar-cart-link');
if (sidebarCartLink) {
    sidebarCartLink.addEventListener('click', () => {
        window.location.href = 'cart.html';
    });
}

const sddCartLink = document.getElementById('sdd-cart-link');
if (sddCartLink) {
    sddCartLink.addEventListener('click', () => {
        closeSdd();
        window.location.href = 'cart.html';
    });
}

// ─── Logout ───────────────────────────────────────────────────────────────────
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        // Persist current session cart/wishlist for this account before logout.
        const currentCart = JSON.parse(localStorage.getItem('produse')) || [];
        const currentWl = JSON.parse(localStorage.getItem('wishlist')) || [];
        await sbSyncCart(currentCart);
        await sbSyncWishlist(currentWl);

        await sbSignOut();

        // Reset local UI state after logout.
        localStorage.setItem('produse', JSON.stringify([]));
        localStorage.setItem('wishlist', JSON.stringify([]));
        if (typeof updateCartNr === 'function') updateCartNr();
        if (typeof updateCartTotals === 'function') updateCartTotals();
        if (typeof updateWishlistNr === 'function') updateWishlistNr();
        window.dispatchEvent(new CustomEvent('cart:updated'));
        window.dispatchEvent(new CustomEvent('wishlist:updated'));

        updateHeaderProfileBtn();
        showAuthSection();
        switchAuthTab('login');
        showToast("You've been signed out.", 'success');
    });
}

// ─── Avatar upload ────────────────────────────────────────────────────────────
const avatarInput = document.getElementById('avatar-file-input');
if (avatarInput) {
    avatarInput.addEventListener('change', () => {
        const file = avatarInput.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { showToast('Please select an image file.', 'error'); return; }
        if (file.size > 2 * 1024 * 1024) { showToast('Image must be smaller than 2 MB.', 'error'); return; }

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const base64 = evt.target.result;
            const { error } = await sbUpdateProfile({ avatar: base64 });
            if (error) { showToast('Error saving photo.', 'error'); return; }

            const user = getCurrentUser();
            setAvatarDisplay(document.getElementById('profile-avatar'), document.getElementById('profile-avatar-initials'), document.getElementById('profile-avatar-img'), user);
            setAvatarDisplay(document.getElementById('sidebar-avatar'), document.getElementById('sidebar-avatar-initials'), document.getElementById('sidebar-avatar-img'), user);
            updateHeaderProfileBtn();
            showToast('Profile photo updated!', 'success');
        };
        reader.readAsDataURL(file);
        avatarInput.value = '';
    });
}

// ─── Remove avatar ────────────────────────────────────────────────────────────
const removeAvatarBtn = document.getElementById('remove-avatar-btn');
if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener('click', async () => {
        const user = getCurrentUser();
        if (!user || !user.avatar) return;
        const { error } = await sbUpdateProfile({ avatar: null });
        if (error) { showToast('Error removing photo.', 'error'); return; }
        setAvatarDisplay(document.getElementById('profile-avatar'), document.getElementById('profile-avatar-initials'), document.getElementById('profile-avatar-img'), user);
        setAvatarDisplay(document.getElementById('sidebar-avatar'), document.getElementById('sidebar-avatar-initials'), document.getElementById('sidebar-avatar-img'), user);
        updateHeaderProfileBtn();
        showToast('Profile photo removed.', 'success');
    });
}

// ─── Profile form ─────────────────────────────────────────────────────────────
const profileForm = document.getElementById('profile-form');
if (profileForm) {
    document.getElementById('profile-cancel-btn').addEventListener('click', () => {
        const user = getCurrentUser();
        if (!user) return;
        document.getElementById('profile-firstname').value = user.firstName;
        document.getElementById('profile-lastname').value = user.lastName;
        document.getElementById('profile-displayname').value = user.displayName;
        document.getElementById('profile-email').value = user.email;
        clearErrors('profile-firstname', 'profile-lastname', 'profile-displayname', 'profile-email');
    });

    profileForm.addEventListener('submit', async e => {
        e.preventDefault();

        const firstName = document.getElementById('profile-firstname').value.trim();
        const lastName = document.getElementById('profile-lastname').value.trim();
        const displayName = document.getElementById('profile-displayname').value.trim();

        clearErrors('profile-firstname', 'profile-lastname', 'profile-displayname');
        let valid = true;

        if (!firstName) { setError('profile-firstname', 'First name is required.'); valid = false; }
        if (!lastName) { setError('profile-lastname', 'Last name is required.'); valid = false; }
        if (!displayName) {
            setError('profile-displayname', 'Username is required.'); valid = false;
        } else if (!/^[a-zA-Z0-9_.\-]{3,20}$/.test(displayName)) {
            setError('profile-displayname', 'Username must be 3–20 chars.'); valid = false;
        }
        if (!valid) return;

        const submitBtn = profileForm.querySelector('[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving…';

        const { error } = await sbUpdateProfile({ firstName, lastName, displayName });

        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Changes';

        if (error) {
            if (error.message?.includes('unique') || error.code === '23505') {
                setError('profile-displayname', 'This username is already taken.');
            } else {
                showToast('Error saving profile.', 'error');
            }
            return;
        }

        populateAccountSection(getCurrentUser());
        updateHeaderProfileBtn();
        showToast('Profile updated successfully!', 'success');
    });
}

// ─── Password form ────────────────────────────────────────────────────────────
const passwordForm = document.getElementById('password-form');
if (passwordForm) {
    const pwNewInput = document.getElementById('pw-new');
    const pwStrengthEl = document.getElementById('pw-strength');
    const pwStrengthFill = document.getElementById('pw-strength-fill');
    const pwStrengthLabel = document.getElementById('pw-strength-label');

    pwNewInput.addEventListener('input', () => {
        const val = pwNewInput.value;
        if (!val) { pwStrengthEl.style.display = 'none'; return; }
        const strength = getPasswordStrength(val);
        pwStrengthEl.style.display = 'flex';
        pwStrengthFill.style.width = strength.pct + '%';
        pwStrengthFill.className = `pw-strength-fill pw-${strength.level}`;
        pwStrengthLabel.textContent = strength.label;
        pwStrengthLabel.className = `pw-label-${strength.level}`;
    });

    passwordForm.addEventListener('submit', async e => {
        e.preventDefault();

        const newPw = document.getElementById('pw-new').value;
        const confirmPw = document.getElementById('pw-confirm').value;

        clearErrors('pw-new', 'pw-confirm');
        let valid = true;

        if (!newPw) {
            setError('pw-new', 'Enter a new password.'); valid = false;
        } else if (newPw.length < 6) {
            setError('pw-new', 'Password must be at least 6 characters.'); valid = false;
        }
        if (!confirmPw) {
            setError('pw-confirm', 'Please confirm your new password.'); valid = false;
        } else if (newPw && confirmPw !== newPw) {
            setError('pw-confirm', 'Passwords do not match.'); valid = false;
        }
        if (!valid) return;

        const submitBtn = passwordForm.querySelector('[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving…';

        const { error } = await sbUpdatePassword(newPw);

        submitBtn.disabled = false;
        submitBtn.textContent = 'Change Password';

        if (error) { showToast('Error changing password. Try again.', 'error'); return; }

        passwordForm.reset();
        pwStrengthEl.style.display = 'none';
        showToast('Password changed successfully!', 'success');
    });
}

// ─── Orders helpers ───────────────────────────────────────────────────────────
// Capitalises the first letter of a string (used for order status labels).
function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

// Converts any status string into a CSS-safe class suffix (e.g. "In Progress" → "in-progress").
function normalizeStatusClass(status) {
    return String(status || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Orders can be edited for 6 minutes after placement (0.1 h — demo window).
// Increase the multiplier (e.g. 1 * 60 * 60 * 1000) for a real 1-hour window.
function isModifiable(order) {
    if (order.status === 'cancelled') return false;
    return Date.now() - new Date(order.date).getTime() < 0.1 * 60 * 60 * 1000;
}

// Returns a human-readable countdown string (e.g. "5m remaining to modify"),
// or null when the modification window has already expired.
function timeRemaining(orderDateISO) {
    const deadline = new Date(orderDateISO).getTime() + 0.1 * 60 * 60 * 1000;
    const ms = deadline - Date.now();
    if (ms <= 0) return null;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m remaining to modify` : `${m}m remaining to modify`;
}

// Looks up the full colour list for an order item from the products array.
// Falls back to just the colour stored in the order if the product can't be found.
function getItemColors(item) {
    if (typeof products !== 'undefined' && item.id != null) {
        const prod = products.find(p => String(p.id) === String(item.id));
        if (prod?.colors?.length) return prod.colors;
    }
    return item.color ? [item.color] : [];
}

// Builds the HTML for expanded order item rows. When modifiable is true,
// each row gets inline edit controls (quantity stepper, colour selector, save/remove).
function renderOrderItemsHTML(items, modifiable = false) {
    if (!items || items.length === 0) return `<p class="order-no-items">No items.</p>`;
    return `<div class="order-items-expanded">${items.map((item, idx) => {
        const img = Array.isArray(item.image) ? item.image[0] : (item.image || '');
        const colors = getItemColors(item);
        const colorSelectHTML = colors.length > 1
            ? `<div class="oie-ec-field"><label class="oie-ec-label">Color</label>
               <select class="oie-color-select" data-idx="${idx}">
                   ${colors.map(c => `<option value="${c}"${c === item.color ? ' selected' : ''}>${c}</option>`).join('')}
               </select></div>` : '';

        return `<div class="oie-row" data-item-idx="${idx}" data-original-qty="${item.quantity}" data-original-color="${item.color || ''}">
            <img src="${img}" alt="${item.name}" class="oie-img">
            <div class="oie-info">
                <p class="oie-name">${item.name}</p>
                <p class="oie-detail"><span class="oie-detail-label">Color:</span> <span class="oie-color-display">${item.color || '—'}</span></p>
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
                        <button class="oie-remove-btn" type="button"><i class="fa-solid fa-trash-can"></i> Remove</button>
                        <button class="oie-save-btn"   type="button"><i class="fa-solid fa-check"></i> Save</button>
                    </div>
                </div>` : ''}
            </div>
        </div>`;
    }).join('')}</div>`;
}

// Sums finalPrice × quantity for all items to produce the updated order total.
function recalcOrderTotal(order) {
    return (order.items || []).reduce((sum, item) =>
        sum + Number(item.finalPrice) * Number(item.quantity), 0).toFixed(2);
}

// Handles a quantity or colour change on a single order item.
// If qty increased → triggers an extra payment modal. If decreased → triggers a refund modal.
// No modal is shown for colour-only changes.
async function saveOrderItemChange(orderId, itemIdx, newQty, newColor) {
    const allOrders = await sbGetOrders();
    const order = allOrders.find(o => o.id === orderId);
    if (!order || !order.items[itemIdx]) return;

    const item = order.items[itemIdx];
    const originalQty = item.quantity;
    const qtyDiff = newQty - originalQty;
    const unitPrice = Number(item.finalPrice);
    const priceDiff = Math.abs(qtyDiff) * unitPrice;
    const paymentInfo = order.paymentInfo || null;

    const persist = async (selectedPaymentInfo = null) => {
        const freshOrders = await sbGetOrders();
        const fo = freshOrders.find(o => o.id === orderId);
        if (!fo) return;
        fo.items[itemIdx].quantity = newQty;
        if (newColor) fo.items[itemIdx].color = newColor;
        const newTotal = parseFloat(recalcOrderTotal(fo));
        const updates = { items: fo.items, total: newTotal };
        if (selectedPaymentInfo) updates.paymentInfo = selectedPaymentInfo;
        const { error } = await sbUpdateOrder(orderId, updates);
        if (error) { showToast('Error updating order.', 'error'); return; }
        showToast('Order updated!', 'success');
        renderOrders();
    };

    if (qtyDiff > 0) {
        showExtraPaymentModal(priceDiff, qtyDiff, paymentInfo, persist);
    } else if (qtyDiff < 0) {
        showRefundModal(priceDiff, Math.abs(qtyDiff), paymentInfo, persist);
    } else {
        persist();
    }
}

// Strips non-digit characters and truncates to 16 digits for card number inputs.
function normalizeCardInput(value) {
    return String(value || '').replace(/\D/g, '').substring(0, 16);
}

// Returns true if the MM/YY expiry date is in the past (checks the last second of that month).
function isCardExpired(expiry) {
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(String(expiry || '').trim())) return false;
    const [mm, yy] = expiry.split('/');
    const month = Number(mm);
    const year = 2000 + Number(yy);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).getTime();
    return Date.now() > endOfMonth;
}

// Builds a { value, label } option object for the payment picker dropdown.
function buildModalCardOption(card, idx) {
    return {
        value: `saved-${idx}`,
        label: `${card.maskedNumber}${card.nickname ? ` (${card.nickname})` : ''}`
    };
}

// Builds a fallback dropdown option using the payment method stored on the original order,
// used when no saved cards are available to fill the picker.
function buildFallbackPaymentOption(paymentInfo) {
    if (!paymentInfo) return null;
    if (paymentInfo.type === 'card' && paymentInfo.maskedCard) {
        return { value: 'fallback', label: `${paymentInfo.maskedCard} (Order payment card)` };
    }
    if (paymentInfo.type === 'paypal' && paymentInfo.paypalEmail) {
        return { value: 'fallback', label: `PayPal (${paymentInfo.paypalEmail})` };
    }
    if (paymentInfo.type === 'paypal') {
        return { value: 'fallback', label: 'PayPal' };
    }
    return { value: 'fallback', label: 'Current order payment method' };
}

// Renders a full payment-card picker inside containerEl (saved cards + add-new form).
// Returns { getPaymentInfo() } so the calling modal can read the selected payment method.
async function mountOrderPaymentPicker(containerEl, fallbackPaymentInfo, mode = 'pay') {
    if (!containerEl) {
        return { getPaymentInfo: () => fallbackPaymentInfo };
    }

    let cards = await sbGetCards().catch(() => []);
    let defaultIdx = cards.findIndex(c => c.isDefault);
    if (defaultIdx < 0) defaultIdx = 0;

    const modeLabel = mode === 'refund' ? 'refund' : 'payment';

    containerEl.innerHTML = `
        <div class="opm-picker-wrap">
            <label class="opm-picker-label">Card for ${modeLabel}</label>
            <div class="custom-dropdown opm-custom-dropdown">
                <button type="button" class="dropdown-trigger" aria-haspopup="listbox" aria-expanded="false">
                    <span class="dropdown-selected"></span>
                    <i class="fa-solid fa-chevron-down dropdown-chevron"></i>
                </button>
                <ul class="dropdown-list" role="listbox"></ul>
            </div>
            <button type="button" class="opm-add-card-toggle">
                <i class="fa-solid fa-plus"></i> Add another card
            </button>
            <div class="opm-add-card-form" style="display:none">
                <div class="form-group">
                    <label>Card Number</label>
                    <div class="input-wrap">
                        <i class="fa-regular fa-credit-card"></i>
                        <input type="text" class="opm-card-number" placeholder="1234 5678 9012 3456" maxlength="19">
                    </div>
                </div>
                <div class="form-row-two">
                    <div class="form-group">
                        <label>Expiration Date</label>
                        <div class="input-wrap">
                            <input type="text" class="opm-card-exp" placeholder="MM/YY" maxlength="5">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>CVC</label>
                        <div class="input-wrap">
                            <input type="text" class="opm-card-cvc" placeholder="CVC" maxlength="4">
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>Nickname <span style="font-weight:400;color:var(--neutral04)">(optional)</span></label>
                    <div class="input-wrap">
                        <input type="text" class="opm-card-nickname" placeholder="e.g. Visa Debit">
                    </div>
                </div>
                <button type="button" class="opm-save-card-btn btn-secondary">Save card</button>
                <p class="opm-add-card-error" style="display:none"></p>
            </div>
        </div>`;

    const dropdownEl = containerEl.querySelector('.opm-custom-dropdown');
    const triggerEl = dropdownEl?.querySelector('.dropdown-trigger');
    const selectedEl = dropdownEl?.querySelector('.dropdown-selected');
    const listEl = dropdownEl?.querySelector('.dropdown-list');
    const toggleBtn = containerEl.querySelector('.opm-add-card-toggle');
    const addForm = containerEl.querySelector('.opm-add-card-form');
    const saveBtn = containerEl.querySelector('.opm-save-card-btn');
    const errEl = containerEl.querySelector('.opm-add-card-error');
    const numEl = containerEl.querySelector('.opm-card-number');
    const expEl = containerEl.querySelector('.opm-card-exp');
    const cvcEl = containerEl.querySelector('.opm-card-cvc');
    const nickEl = containerEl.querySelector('.opm-card-nickname');

    let selectedValue = null;

    // mountOrderPaymentPicker can be called multiple times (extra payment + refund modals).
    // The flag prevents duplicate document-level click listeners from stacking up.
    if (!window._opmDropdownOutsideBound) {
        document.addEventListener('click', () => {
            document.querySelectorAll('.opm-custom-dropdown.open').forEach(el => {
                el.classList.remove('open');
                const btn = el.querySelector('.dropdown-trigger');
                btn?.setAttribute('aria-expanded', 'false');
            });
        });
        window._opmDropdownOutsideBound = true;
    }

    const renderDropdown = () => {
        const options = cards.map((card, idx) => buildModalCardOption(card, idx));
        if (options.length === 0) {
            const fallback = buildFallbackPaymentOption(fallbackPaymentInfo);
            if (fallback) options.push(fallback);
            else options.push({ value: 'none', label: 'No saved card available' });
        } else if (fallbackPaymentInfo && fallbackPaymentInfo.type === 'paypal') {
            const fallback = buildFallbackPaymentOption(fallbackPaymentInfo);
            if (fallback) options.push(fallback);
        }

        if (!options.some(o => o.value === selectedValue)) {
            selectedValue = options[defaultIdx]?.value || options[0]?.value || null;
        }

        listEl.innerHTML = options.map(opt =>
            `<li class="dropdown-item${opt.value === selectedValue ? ' active' : ''}" data-value="${opt.value}">${opt.label}</li>`
        ).join('');

        const selectedOption = options.find(opt => opt.value === selectedValue);
        selectedEl.textContent = selectedOption ? selectedOption.label : 'Select card';
    };

    renderDropdown();

    triggerEl?.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdownEl.classList.contains('open');
        document.querySelectorAll('.opm-custom-dropdown.open').forEach(el => {
            el.classList.remove('open');
            const btn = el.querySelector('.dropdown-trigger');
            btn?.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
            dropdownEl.classList.add('open');
            triggerEl.setAttribute('aria-expanded', 'true');
        }
    });

    listEl?.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = e.target.closest('.dropdown-item[data-value]');
        if (!item) return;
        selectedValue = item.dataset.value;
        renderDropdown();
        dropdownEl.classList.remove('open');
        triggerEl?.setAttribute('aria-expanded', 'false');
    });

    const setFormError = (msg) => {
        if (!errEl) return;
        errEl.textContent = msg || '';
        errEl.style.display = msg ? 'block' : 'none';
    };

    numEl?.addEventListener('input', () => {
        const clean = normalizeCardInput(numEl.value);
        numEl.value = clean.match(/.{1,4}/g)?.join(' ') || clean;
    });

    expEl?.addEventListener('input', () => {
        let val = String(expEl.value || '').replace(/\D/g, '').substring(0, 4);
        if (val.length >= 2) val = `${val.substring(0, 2)}/${val.substring(2)}`;
        expEl.value = val;
    });

    cvcEl?.addEventListener('input', () => {
        cvcEl.value = String(cvcEl.value || '').replace(/\D/g, '').substring(0, 4);
    });

    toggleBtn?.addEventListener('click', () => {
        addForm.style.display = addForm.style.display === 'none' ? 'block' : 'none';
        setFormError('');
    });

    saveBtn?.addEventListener('click', async () => {
        const cardDigits = normalizeCardInput(numEl?.value || '');
        const exp = String(expEl?.value || '').trim();
        const cvc = String(cvcEl?.value || '').trim();
        const nickname = String(nickEl?.value || '').trim();

        if (!/^\d{16}$/.test(cardDigits)) { setFormError('Enter a valid 16-digit card number.'); return; }
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) { setFormError('Enter a valid expiry date (MM/YY).'); return; }
        if (isCardExpired(exp)) { setFormError('Card is expired.'); return; } // was Romanian
        if (!/^\d{3,4}$/.test(cvc)) { setFormError('Enter a valid CVC (3-4 digits).'); return; }

        const maskedNumber = `**** **** **** ${cardDigits.slice(-4)}`;
        if (cards.some(c => c.maskedNumber === maskedNumber)) {
            setFormError('This card is already saved.');
            return;
        }

        await sbAddCard({
            maskedNumber,
            expiry: exp,
            nickname,
            isDefault: cards.length === 0
        });

        cards = await sbGetCards().catch(() => cards);
        defaultIdx = cards.findIndex(c => c.maskedNumber === maskedNumber);
        if (defaultIdx < 0) defaultIdx = cards.findIndex(c => c.isDefault);
        if (defaultIdx < 0) defaultIdx = 0;

        selectedValue = `saved-${defaultIdx}`;
        renderDropdown();
        addForm.style.display = 'none';
        setFormError('');
        if (numEl) numEl.value = '';
        if (expEl) expEl.value = '';
        if (cvcEl) cvcEl.value = '';
        if (nickEl) nickEl.value = '';
        showToast('Card added successfully.', 'success');
    });

    return {
        getPaymentInfo: () => {
            const selected = selectedValue;
            if (!selected || selected === 'none') return null;
            if (selected?.startsWith('saved-')) {
                const idx = parseInt(selected.replace('saved-', ''), 10);
                const card = cards[idx];
                if (!card) return null;
                return { type: 'card', maskedCard: card.maskedNumber };
            }
            return fallbackPaymentInfo;
        }
    };
}

// Shows a modal asking the user to confirm and pay for added items.
// Calls onConfirm(selectedPaymentInfo) when the user confirms, or skips if no overlay exists.
async function showExtraPaymentModal(amount, qtyAdded, paymentInfo, onConfirm) {
    const overlay = document.getElementById('extra-payment-overlay');
    const desc = document.getElementById('extra-payment-desc');
    const cardRow = document.getElementById('extra-payment-card');
    const confirmBtn = document.getElementById('extra-payment-confirm');
    const cancelBtn = document.getElementById('extra-payment-cancel');
    if (!overlay) { onConfirm(); return; }

    desc.textContent = `You added ${qtyAdded} item${qtyAdded > 1 ? 's' : ''} to your order. An additional payment of $${amount.toFixed(2)} will be charged.`;
    confirmBtn.textContent = `Pay $${amount.toFixed(2)}`;
    const picker = await mountOrderPaymentPicker(cardRow, paymentInfo, 'pay');
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    const close = () => { overlay.style.display = 'none'; document.body.style.overflow = ''; confirmBtn.removeEventListener('click', onYes); cancelBtn.removeEventListener('click', onNo); };
    const onYes = () => {
        const selectedPaymentInfo = picker.getPaymentInfo();
        if (!selectedPaymentInfo) {
            showToast('Please select a payment card.', 'error');
            return;
        }
        close();
        onConfirm(selectedPaymentInfo);
    };
    const onNo = () => close();
    confirmBtn.addEventListener('click', onYes);
    cancelBtn.addEventListener('click', onNo);
}

// Shows a refund confirmation modal with a mandatory checkbox before the user can confirm.
// Calls onConfirm(selectedPaymentInfo) with the card/PayPal to refund to.
async function showRefundModal(amount, qtyRemoved, paymentInfo, onConfirm) {
    const overlay = document.getElementById('refund-overlay');
    const desc = document.getElementById('refund-desc');
    const cardRow = document.getElementById('refund-card');
    const confirmBtn = document.getElementById('refund-confirm');
    const cancelBtn = document.getElementById('refund-cancel');
    const checkbox = document.getElementById('refund-confirm-check');
    if (!overlay) { onConfirm(); return; }

    desc.textContent = `You removed ${qtyRemoved} item${qtyRemoved > 1 ? 's' : ''} from your order. A refund of $${amount.toFixed(2)} will be returned.`;
    const picker = await mountOrderPaymentPicker(cardRow, paymentInfo, 'refund');
    checkbox.checked = false;
    confirmBtn.disabled = true;
    checkbox.onchange = () => { confirmBtn.disabled = !checkbox.checked; };
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    const close = () => { overlay.style.display = 'none'; document.body.style.overflow = ''; confirmBtn.removeEventListener('click', onYes); cancelBtn.removeEventListener('click', onNo); };
    const onYes = () => {
        const selectedPaymentInfo = picker.getPaymentInfo();
        if (!selectedPaymentInfo) {
            showToast('Please select a card for refund.', 'error');
            return;
        }
        close();
        onConfirm(selectedPaymentInfo);
    };
    const onNo = () => close();
    confirmBtn.addEventListener('click', onYes);
    cancelBtn.addEventListener('click', onNo);
}

// Returns an HTML chip displaying the payment method (masked card or PayPal email).
// Used in the saved payment section of the account dashboard.
function paymentInfoHTML(paymentInfo) {
    if (!paymentInfo) return `<span class="opm-card-unknown"><i class="fa-regular fa-credit-card"></i> Payment method not on file</span>`;
    if (paymentInfo.type === 'card' && paymentInfo.maskedCard)
        return `<span class="opm-card-chip"><i class="fa-regular fa-credit-card"></i> ${paymentInfo.maskedCard}</span>`;
    if (paymentInfo.type === 'paypal' && paymentInfo.paypalEmail)
        return `<span class="opm-card-chip"><i class="fa-brands fa-paypal"></i> ${paymentInfo.paypalEmail}</span>`;
    if (paymentInfo.type === 'paypal')
        return `<span class="opm-card-chip"><i class="fa-brands fa-paypal"></i> PayPal</span>`;
    return `<span class="opm-card-chip"><i class="fa-regular fa-credit-card"></i> Credit Card</span>`;
}

// Removes a single item from an order. If the order has no items left it is auto-cancelled.
async function removeOrderItem(orderId, itemIdx) {
    const allOrders = await sbGetOrders();
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    order.items.splice(itemIdx, 1);
    let status = order.status;
    let total = parseFloat(order.total);

    if (order.items.length === 0) {
        status = 'cancelled';
        showToast('Order cancelled — no items remaining.', 'success');
    } else {
        total = parseFloat(recalcOrderTotal(order));
        showToast('Item removed from order.', 'success');
    }

    const { error } = await sbUpdateOrder(orderId, { items: order.items, total, status });
    if (error) { showToast('Error updating order.', 'error'); return; }
    renderOrders();
}

// Attaches all interactive edit-control events (edit toggle, qty +/-, colour, save, remove)
// to the order item rows inside the given container element.
function bindOrderItemEditEvents(container, orderId) {
    container.querySelectorAll('.oie-row[data-item-idx]').forEach(row => {
        const idx = parseInt(row.dataset.itemIdx);
        const editBtn = row.querySelector('.oie-edit-btn');
        const minusBtn = row.querySelector('.oie-qty-minus');
        const plusBtn = row.querySelector('.oie-qty-plus');
        const saveBtn = row.querySelector('.oie-save-btn');
        const removeBtn = row.querySelector('.oie-remove-btn');
        const qtyVal = row.querySelector('.oie-qty-val');
        const priceEl = row.querySelector('.oie-price');
        if (!editBtn) return;

        let currentQty = parseInt(qtyVal?.textContent || '1');

        const colorSelect = row.querySelector('.oie-color-select');
        const colorDisplay = row.querySelector('.oie-color-display');

        editBtn.addEventListener('click', () => {
            const entering = !row.classList.contains('editing');
            row.classList.toggle('editing', entering);
            const icon = editBtn.querySelector('i');
            const label = editBtn.querySelector('span');
            if (entering) { icon.className = 'fa-solid fa-xmark'; label.textContent = 'Cancel'; }
            else { icon.className = 'fa-regular fa-pen-to-square'; label.textContent = 'Edit'; currentQty = parseInt(row.dataset.originalQty || '1'); qtyVal.textContent = currentQty; }
        });

        colorSelect?.addEventListener('change', () => { if (colorDisplay) colorDisplay.textContent = colorSelect.value; });
        minusBtn?.addEventListener('click', () => { if (currentQty > 1) { currentQty--; qtyVal.textContent = currentQty; } });
        plusBtn?.addEventListener('click', () => { if (currentQty < 99) { currentQty++; qtyVal.textContent = currentQty; } });
        saveBtn?.addEventListener('click', () => { const newColor = colorSelect ? colorSelect.value : null; saveOrderItemChange(orderId, idx, currentQty, newColor); });
        removeBtn?.addEventListener('click', () => removeOrderItem(orderId, idx));
    });
}

// Returns the HTML for the countdown + cancel-order bar shown on modifiable orders,
// or an empty string if the order is no longer within the edit window.
function buildModifyBar(order) {
    if (!isModifiable(order)) return '';
    const t = timeRemaining(order.date);
    if (!t) return '';
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

// Returns the HTML for the "Confirm delivery" bar shown when an order is in transit.
function buildDeliveryConfirmBar(order) {
    const status = (order.status || '').toLowerCase();
    if (status !== 'delivery' && status !== 'in curs de livrare') return '';
    return `<div class="order-delivery-bar">
        <span class="order-delivery-note">
            <i class="fa-solid fa-truck"></i>
            Delivery
        </span>
        <button class="order-delivered-btn" data-order-id="${order.id}">
            <i class="fa-solid fa-circle-check"></i> Confirm delivery
        </button>
    </div>`;
}

// Ticks every 30 s so the countdown stays roughly accurate without hammering the DOM.
// Clears any previous interval so re-renders don't stack multiple timers.
function startOrderTimers() {
    const tick = () => {
        let expired = false;
        document.querySelectorAll('.order-timer[data-order-date]').forEach(el => {
            const t = timeRemaining(el.dataset.orderDate);
            const txt = el.querySelector('.timer-text');
            if (t && txt) txt.textContent = t;
            else {
                el.closest('.order-modify-bar')?.remove();
                expired = true;
            }
        });
        // Re-render orders if any modification window just expired so the
        // status badge updates from "In Progress" to "Delivery" without refresh.
        if (expired) renderOrders();
    };
    clearInterval(window._orderTimerInterval);
    window._orderTimerInterval = setInterval(tick, 30000);
}

// Two-click confirmation pattern: first click arms the button, second confirms.
// The button auto-resets after 3 seconds if the user does not confirm.
function bindCancelBtn(container, orderId) {
    const btn = container.querySelector(`.order-cancel-btn[data-order-id="${orderId}"]`);
    if (!btn) return;
    btn.addEventListener('click', async () => {
        if (btn.dataset.confirming) {
            const { error } = await sbUpdateOrder(orderId, { status: 'cancelled' });
            if (error) { showToast('Error cancelling order.', 'error'); return; }
            showToast('Order cancelled.', 'success');
            renderOrders();
        } else {
            btn.dataset.confirming = '1';
            btn.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Confirm Cancel?`;
            btn.classList.add('confirming');
            setTimeout(() => {
                if (btn.dataset.confirming) {
                    delete btn.dataset.confirming;
                    btn.classList.remove('confirming');
                    btn.innerHTML = `<i class="fa-solid fa-ban"></i> Cancel Order`;
                }
            }, 3000);
        }
    });
}

// Uses the same two-click confirmation pattern as bindCancelBtn to prevent accidental taps.
function bindDeliveryConfirmBtn(container, orderId) {
    const btn = container.querySelector(`.order-delivered-btn[data-order-id="${orderId}"]`);
    if (!btn) return;

    btn.addEventListener('click', async () => {
        if (btn.dataset.confirming) {
            const { error } = await sbUpdateOrder(orderId, { status: 'completed' });
            if (error) { showToast('Error confirming delivery.', 'error'); return; }
            showToast('Delivery confirmed. Order completed!', 'success');
            renderOrders();
            return;
        }

        btn.dataset.confirming = '1';
        btn.classList.add('confirming');
        btn.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Confirm completed?`;

        setTimeout(() => {
            if (btn.dataset.confirming) {
                delete btn.dataset.confirming;
                btn.classList.remove('confirming');
                btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Confirm delivery`;
            }
        }, 3000);
    });
}

// ─── Orders render (async — loads from Supabase) ──────────────────────────────
// Fetches orders, auto-advances stale "in progress" ones to "Delivery",
// then renders both a desktop table and a mobile card list with expand/collapse rows.
async function renderOrders() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    ordersList.innerHTML = `<p style="padding:16px;color:var(--neutral04)">Loading orders…</p>`;

    let orders = await sbGetOrders();

    // Auto-advance "in progress" orders after the modification window to "Delivery".
    // 0.1 h = 6 minutes — intentionally short for demo purposes.
    const TWO_HOURS = 0.1 * 60 * 60 * 1000;
    for (const order of orders) {
        if (order.status === 'in progress' &&
            Date.now() - new Date(order.date).getTime() >= TWO_HOURS) {
            await sbUpdateOrder(order.id, { status: 'Delivery' });
            order.status = 'Delivery';
        }
    }

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

    ordersList.innerHTML = `
        <table class="orders-table">
            <thead><tr>
                <th>Number ID</th><th>Dates</th><th>Status</th><th>Price</th><th></th>
            </tr></thead>
            <tbody id="orders-tbody"></tbody>
        </table>
        <div class="orders-mobile-list" id="orders-mobile-list"></div>`;

    const tbody = document.getElementById('orders-tbody');
    const mobileList = document.getElementById('orders-mobile-list');

    orders.forEach(order => {
        const status = order.status || 'in progress';
        const statusLabel = capitalize(status);
        const statusClass = normalizeStatusClass(status);
        const price = `$${Number(order.total).toFixed(2)}`;
        const dateStr = formatDate(order.date);
        const modifiable = isModifiable(order);
        const itemsHTML = renderOrderItemsHTML(order.items, modifiable);
        const modBar = buildModifyBar(order);
        const deliveryBar = buildDeliveryConfirmBar(order);

        const mainRow = document.createElement('tr');
        mainRow.className = 'order-main-row';
        mainRow.innerHTML = `
            <td class="order-table-id">${order.code}</td>
            <td>${dateStr}</td>
            <td><span class="order-status order-status--${statusClass}">${statusLabel}</span></td>
            <td class="order-table-price">${price}</td>
            <td class="order-expand-cell">
                <button class="order-expand-btn" aria-label="Show order details">
                    <i class="fa-solid fa-chevron-down"></i>
                </button>
            </td>`;

        const detailRow = document.createElement('tr');
        detailRow.className = 'order-detail-row';
        detailRow.innerHTML = `
            <td colspan="5" class="order-detail-cell">
                <div class="order-detail-inner">${itemsHTML}${modBar}${deliveryBar}</div>
            </td>`;

        tbody.appendChild(mainRow);
        tbody.appendChild(detailRow);

        const mobileCard = document.createElement('div');
        mobileCard.className = 'order-mobile-card';
        mobileCard.innerHTML = `
            <div class="order-mobile-header">
                <div class="omh-left">
                    <span class="order-table-id">${order.code}</span>
                    <span class="omh-date">${dateStr}</span>
                </div>
                <div class="omh-right">
                    <span class="order-status order-status--${statusClass}">${statusLabel}</span>
                    <span class="order-table-price">${price}</span>
                    <button class="order-expand-btn" aria-label="Show order details">
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                </div>
            </div>
            <div class="order-mobile-detail">${itemsHTML}${modBar}${deliveryBar}</div>`;

        mobileList.appendChild(mobileCard);

        mainRow.querySelector('.order-expand-btn').addEventListener('click', () => {
            const open = detailRow.classList.toggle('open');
            mainRow.querySelector('.order-expand-btn i').classList.toggle('rotated', open);
        });

        mobileCard.querySelector('.order-expand-btn').addEventListener('click', e => {
            e.stopPropagation();
            const detail = mobileCard.querySelector('.order-mobile-detail');
            const open = detail.classList.toggle('open');
            mobileCard.querySelector('.order-expand-btn i').classList.toggle('rotated', open);
        });

        bindCancelBtn(detailRow, order.id);
        bindCancelBtn(mobileCard, order.id);
        bindDeliveryConfirmBtn(detailRow, order.id);
        bindDeliveryConfirmBtn(mobileCard, order.id);
        bindOrderItemEditEvents(detailRow, order.id);
        bindOrderItemEditEvents(mobileCard, order.id);
    });

    startOrderTimers();
}

// ─── Address ──────────────────────────────────────────────────────────────────
// Loads saved addresses and renders both billing and shipping cards.
async function renderAddressCards() {
    const addresses = await sbGetAddresses();
    renderSingleAddressCard('billing', addresses.billing);
    renderSingleAddressCard('shipping', addresses.shipping);
}

// Renders one address card (billing or shipping) showing a formatted address block,
// or an empty-state message if no address has been saved yet.
function renderSingleAddressCard(type, addr) {
    const body = document.getElementById(`${type}-address-body`);
    if (!body) return;
    if (!addr) {
        body.innerHTML = `<p class="address-empty">No ${type} address saved.</p>`;
        return;
    }
    const zipStr = addr.zip ? ` ${addr.zip}` : '';
    body.innerHTML = `
        <p>${addr.firstName} ${addr.lastName}</p>
        <p>${addr.phone}</p>
        <p>${addr.street}, ${addr.city}${zipStr}, ${addr.country}</p>`;
}

const addrModalOverlay = document.getElementById('address-modal-overlay');
const addrModalClose = document.getElementById('address-modal-close');
const addrModalCancel = document.getElementById('address-modal-cancel');
const addrModalTitle = document.getElementById('address-modal-title');
const addrTypeInput = document.getElementById('address-type');

// Pre-fills the address modal with existing data for the given type ("billing" or "shipping")
// and opens it with page scroll locked.
async function openAddressModal(type) {
    if (!addrModalOverlay) return;
    const addresses = await sbGetAddresses();
    const addr = addresses[type] || {};

    addrModalTitle.textContent = type === 'billing' ? 'Edit Billing Address' : 'Edit Shipping Address';
    addrTypeInput.value = type;

    document.getElementById('addr-firstname').value = addr.firstName || '';
    document.getElementById('addr-lastname').value = addr.lastName || '';
    document.getElementById('addr-phone').value = addr.phone || '';
    document.getElementById('addr-street').value = addr.street || '';
    document.getElementById('addr-city').value = addr.city || '';
    document.getElementById('addr-country').value = addr.country || '';
    document.getElementById('addr-zip').value = addr.zip || '';

    clearErrors('addr-firstname', 'addr-lastname', 'addr-phone', 'addr-street', 'addr-city', 'addr-country');
    addrModalOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Hides the address modal and restores page scroll.
function closeAddressModal() {
    if (!addrModalOverlay) return;
    addrModalOverlay.style.display = 'none';
    document.body.style.overflow = '';
}

document.querySelectorAll('.address-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openAddressModal(btn.dataset.type));
});

if (addrModalClose) addrModalClose.addEventListener('click', closeAddressModal);
if (addrModalCancel) addrModalCancel.addEventListener('click', closeAddressModal);
if (addrModalOverlay) addrModalOverlay.addEventListener('click', e => { if (e.target === addrModalOverlay) closeAddressModal(); });

const addressForm = document.getElementById('address-form');
if (addressForm) {
    addressForm.addEventListener('submit', async e => {
        e.preventDefault();
        const type = addrTypeInput.value;
        const firstName = document.getElementById('addr-firstname').value.trim();
        const lastName = document.getElementById('addr-lastname').value.trim();
        const phone = document.getElementById('addr-phone').value.trim();
        const street = document.getElementById('addr-street').value.trim();
        const city = document.getElementById('addr-city').value.trim();
        const country = document.getElementById('addr-country').value.trim();
        const zip = document.getElementById('addr-zip').value.trim();

        clearErrors('addr-firstname', 'addr-lastname', 'addr-phone', 'addr-street', 'addr-city', 'addr-country');
        let valid = true;
        if (!firstName) { setError('addr-firstname', 'First name is required.'); valid = false; }
        if (!lastName) { setError('addr-lastname', 'Last name is required.'); valid = false; }
        if (!phone) { setError('addr-phone', 'Phone number is required.'); valid = false; }
        if (!street) { setError('addr-street', 'Street address is required.'); valid = false; }
        if (!city) { setError('addr-city', 'City is required.'); valid = false; }
        if (!country) { setError('addr-country', 'Country is required.'); valid = false; }
        if (!valid) return;

        const addresses = await sbGetAddresses();
        addresses[type] = { firstName, lastName, phone, street, city, country, zip };
        await sbSaveAddresses(addresses);

        renderSingleAddressCard(type, addresses[type]);
        closeAddressModal();
        showToast(`${capitalize(type)} address saved!`, 'success');
    });
}

// ─── Wishlist panel ───────────────────────────────────────────────────────────

// Renders the wishlist panel, listing each saved product with a remove button and an
// "Add to cart" / "Go to Cart" toggle depending on whether the item is already in the cart.
function renderWishlistPanel() {
    const container = document.getElementById('wishlist-panel-list');
    if (!container) return;
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

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
            <div class="wishlist-panel-thead"><span>Product</span></div>
            <div class="wishlist-panel-body" id="wishlist-panel-body"></div>
        </div>`;

    const body = document.getElementById('wishlist-panel-body');
    wishlist.forEach(product => {
        const mainImage = Array.isArray(product.image) ? product.image[0] : (product.image || '');
        const cartItems = JSON.parse(localStorage.getItem('produse')) || [];
        const inCart = cartItems.some(c => c.id === product.id);

        const row = document.createElement('div');
        row.className = 'wishlist-panel-row';
        row.dataset.productId = product.id;
        row.innerHTML = `
            <button class="wishlist-panel-remove" data-id="${product.id}" title="Remove"><i class="fa-solid fa-xmark"></i></button>
            <div class="wishlist-panel-img"><img src="${mainImage}" alt="${product.name}"></div>
            <div class="wishlist-panel-info">
                <p class="wishlist-panel-name">${product.name}</p>
                <p class="wishlist-panel-color">Color: ${product.color || '—'}</p>
                <p class="wishlist-panel-price">$${Number(product.finalPrice).toFixed(2)}</p>
            </div>
            <button class="wishlist-panel-add-btn ${inCart ? 'in-cart' : ''}" data-id="${product.id}">
                ${inCart ? '<i class="fa-solid fa-circle-check"></i> Added — Go to Cart' : 'Add to cart'}
            </button>`;

        row.querySelector('.wishlist-panel-remove').addEventListener('click', () => {
            let wl = JSON.parse(localStorage.getItem('wishlist')) || [];
            wl = wl.filter(p => p.id !== product.id);
            localStorage.setItem('wishlist', JSON.stringify(wl));
            if (typeof updateWishlistNr === 'function') updateWishlistNr();
            window.dispatchEvent(new CustomEvent('wishlist:updated'));
            renderWishlistPanel();
        });

        row.querySelector('.wishlist-panel-add-btn').addEventListener('click', e => {
            if (e.currentTarget.classList.contains('in-cart')) { window.location.href = 'cart.html'; return; }
            if (typeof addToCartList === 'function') {
                addToCartList(product.id, e.currentTarget);
                e.currentTarget.innerHTML = '<i class="fa-solid fa-circle-check"></i> Added — Go to Cart';
                e.currentTarget.classList.add('in-cart');
            }
        });

        body.appendChild(row);
    });
}

// ─── Payment Methods ──────────────────────────────────────────────────────────

// Fetches saved cards and renders each as a visual card tile with set-default and delete actions.
async function renderPaymentMethods() {
    const list = document.getElementById('payment-methods-list');
    if (!list) return;

    list.innerHTML = `<p style="padding:8px;color:var(--neutral04)">Loading…</p>`;
    const cards = await sbGetCards();

    if (cards.length === 0) {
        list.innerHTML = `<p class="address-empty pm-empty">No payment methods saved. Add a card to get started.</p>`;
        return;
    }

    list.innerHTML = cards.map((card, idx) => {
        const isDefault = card.isDefault;
        return `<div class="pm-card-item${isDefault ? ' pm-card-default' : ''}" data-idx="${idx}" data-sbid="${card._sbId}">
            <div class="pm-card-visual">
                <i class="fa-regular fa-credit-card pm-card-brand-icon"></i>
                <div class="pm-card-details">
                    <span class="pm-card-number">${card.maskedNumber}</span>
                    <span class="pm-card-meta">${card.nickname ? card.nickname + ' · ' : ''}Expires ${card.expiry}</span>
                </div>
            </div>
            <div class="pm-card-actions">
                ${!isDefault
                ? `<button class="pm-set-default-btn" data-sbid="${card._sbId}" title="Set as default"><i class="fa-regular fa-star"></i> Set default</button>`
                : `<span class="pm-default-badge"><i class="fa-solid fa-star"></i> Default</span>`}
                <button class="pm-delete-btn" data-sbid="${card._sbId}" title="Remove card"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        </div>`;
    }).join('');

    list.querySelectorAll('.pm-set-default-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            await sbSetDefaultCard(btn.dataset.sbid);
            renderPaymentMethods();
        });
    });

    list.querySelectorAll('.pm-delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            await sbDeleteCard(btn.dataset.sbid);
            renderPaymentMethods();
            showToast('Card removed.', 'success');
        });
    });
}

// ── Add Card Modal ──
const addCardModalOverlay = document.getElementById('add-card-modal-overlay');
const addCardModalClose = document.getElementById('add-card-modal-close');
const addCardModalCancel = document.getElementById('add-card-modal-cancel');
const addCardBtn = document.getElementById('add-card-btn');
const addCardForm = document.getElementById('add-card-form');

// Resets the add-card form, clears validation errors, and opens the modal.
function openAddCardModal() { if (!addCardModalOverlay) return; addCardForm?.reset(); clearErrors('new-card-number', 'new-card-exp', 'new-card-cvc'); addCardModalOverlay.style.display = 'flex'; document.body.style.overflow = 'hidden'; }

// Hides the add-card modal and restores page scroll.
function closeAddCardModal() { if (!addCardModalOverlay) return; addCardModalOverlay.style.display = 'none'; document.body.style.overflow = ''; }

if (addCardBtn) addCardBtn.addEventListener('click', openAddCardModal);
if (addCardModalClose) addCardModalClose.addEventListener('click', closeAddCardModal);
if (addCardModalCancel) addCardModalCancel.addEventListener('click', closeAddCardModal);
if (addCardModalOverlay) addCardModalOverlay.addEventListener('click', e => { if (e.target === addCardModalOverlay) closeAddCardModal(); });

const newCardNumberInput = document.getElementById('new-card-number');
if (newCardNumberInput) newCardNumberInput.addEventListener('input', () => { let v = newCardNumberInput.value.replace(/\D/g, '').substring(0, 16); newCardNumberInput.value = v.match(/.{1,4}/g)?.join(' ') || v; });
const newCardExpInput = document.getElementById('new-card-exp');
if (newCardExpInput) newCardExpInput.addEventListener('input', () => { let v = newCardExpInput.value.replace(/\D/g, '').substring(0, 4); if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2); newCardExpInput.value = v; });
const newCardCvcInput = document.getElementById('new-card-cvc');
if (newCardCvcInput) newCardCvcInput.addEventListener('input', () => { newCardCvcInput.value = newCardCvcInput.value.replace(/\D/g, '').substring(0, 4); });

if (addCardForm) {
    addCardForm.addEventListener('submit', async e => {
        e.preventDefault();
        const num = (document.getElementById('new-card-number').value || '').replace(/\s/g, '');
        const exp = (document.getElementById('new-card-exp').value || '').trim();
        const cvc = (document.getElementById('new-card-cvc').value || '').trim();
        const nickname = (document.getElementById('new-card-nickname').value || '').trim();

        clearErrors('new-card-number', 'new-card-exp', 'new-card-cvc');
        let valid = true;
        if (!/^\d{16}$/.test(num)) { setError('new-card-number', 'Enter a valid 16-digit card number.'); valid = false; }
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) { setError('new-card-exp', 'Enter a valid expiry date (MM/YY).'); valid = false; }
        if (/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp) && isCardExpired(exp)) { setError('new-card-exp', 'Card is expired.'); valid = false; } // was Romanian
        if (!/^\d{3,4}$/.test(cvc)) { setError('new-card-cvc', 'Enter a valid CVV (3–4 digits).'); valid = false; }
        if (!valid) return;

        const masked = '**** **** **** ' + num.slice(-4);
        const cards = await sbGetCards();
        const isDefault = cards.length === 0;

        if (cards.some(c => c.maskedNumber.endsWith(num.slice(-4)))) {
            setError('new-card-number', 'This card is already saved.');
            return;
        }

        await sbAddCard({ maskedNumber: masked, expiry: exp, nickname, isDefault });
        closeAddCardModal();
        renderPaymentMethods();
        showToast('Card saved successfully!', 'success');
    });
}

// ─── Forgot password ──────────────────────────────────────────────────────────

// Reads the login field as an identifier, calls sbResetPassword, and shows a toast with the result.
// In localStorage mode no actual email is sent — the reset is purely simulated.
const forgotBtn = document.getElementById('forgot-password-btn');
if (forgotBtn) {
    forgotBtn.addEventListener('click', async () => {
        const identifier = document.getElementById('login-email').value.trim();
        if (!identifier) { setError('login-email', 'Enter your email or username first.'); return; }

        try {
            const { error, email } = await sbResetPassword(identifier);
            if (error) {
                if (error.message === 'user_not_found') {
                    setError('login-email', 'No account found with this email or username.');
                } else {
                    showToast('Error sending reset email. Try again.', 'error');
                }
                return;
            }
            showToast(`Password reset link sent to ${email}. Check your inbox!`, 'success');
        } catch (err) {
            console.error('Forgot password error:', err);
            showToast('Something went wrong. Please try again.', 'error');
        }
    });
}

// ─── Init on page load ────────────────────────────────────────────────────────

// Waits for the auth session to resolve before calling initPage so all UI decisions
// (show dashboard vs. login form, active panel, etc.) are based on the correct auth state.
document.addEventListener('DOMContentLoaded', () => {
    onSbReady(user => {
        initPage(user);
    });
});
