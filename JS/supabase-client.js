// ─── localStorage-based Auth & Data Client ────────────────────────────────────
// Drop-in replacement for the Supabase client — no external dependency.
// ⚠️  DEVELOPMENT / DEMO ONLY — passwords are stored in plain text.
//     Replace with a real auth service (e.g. Supabase, Firebase) before going live.

// ─── Session cache ────────────────────────────────────────────────────────────
// _profile is the public-safe view of the user (no password field).
// _readyCbs holds functions registered before the session is resolved.
let _profile = JSON.parse(localStorage.getItem('lsCurrentUser')) || null;
let _sbReady = false;
const _readyCbs = [];

// Registers a callback to run once the session is initialised.
// If the session is already ready, the callback fires immediately.
function onSbReady(fn) {
    if (_sbReady) fn(_profile);
    else _readyCbs.push(fn);
}

// Returns the currently logged-in user profile object, or null if no session.
function sbCurrentUser() { return _profile; }

// Returns a minimal session object compatible with the Supabase session shape.
function sbCurrentSession() { return _profile ? { user: { id: _profile.id } } : null; }

// ─── Init ─────────────────────────────────────────────────────────────────────

// Reads the persisted session from localStorage, marks the client as ready,
// drains the pending callbacks queue and fires the global 'sb:ready' event.
function _initSession() {
    _profile = JSON.parse(localStorage.getItem('lsCurrentUser')) || null;
    _sbReady = true;
    _readyCbs.forEach(fn => fn(_profile));
    _readyCbs.length = 0;
    window.dispatchEvent(new CustomEvent('sb:ready'));
}

_initSession();

// ─── Auth ─────────────────────────────────────────────────────────────────────

// Creates a new account, validates uniqueness for both email and displayName,
// persists it to lsAccounts, starts the session and fires 'sb:auth-changed'.
async function sbSignUp(email, password, firstName, lastName, displayName) {
    const accounts = JSON.parse(localStorage.getItem('lsAccounts')) || [];

    if (accounts.some(a => a.displayName.toLowerCase() === displayName.toLowerCase()))
        return { error: { message: 'username_taken' } };

    if (accounts.some(a => a.email.toLowerCase() === email.toLowerCase()))
        return { error: { message: 'Email address already registered.' } };

    const user = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        email,
        password,
        firstName,
        lastName,
        displayName,
        avatar: null,
        savedPaymentMethod: null,
        createdAt: new Date().toISOString()
    };

    accounts.push(user);
    localStorage.setItem('lsAccounts', JSON.stringify(accounts));

    _profile = { id: user.id, email, firstName, lastName, displayName, avatar: null, savedPaymentMethod: null, createdAt: user.createdAt };
    localStorage.setItem('lsCurrentUser', JSON.stringify(_profile));
    window.dispatchEvent(new CustomEvent('sb:auth-changed', { detail: { user: _profile } }));

    return { user: _profile, needsEmailConfirmation: false };
}

// Signs in with either an email address or a displayName (username).
// Returns { user } on success or { error } if the account/password don't match.
async function sbSignIn(identifier, password) {
    const accounts = JSON.parse(localStorage.getItem('lsAccounts')) || [];
    const account = identifier.includes('@')
        ? accounts.find(a => a.email.toLowerCase() === identifier.toLowerCase())
        : accounts.find(a => a.displayName.toLowerCase() === identifier.toLowerCase());

    if (!account) return { error: { message: 'user_not_found' } };
    if (account.password !== password) return { error: { message: 'Invalid login credentials' } };

    _profile = {
        id: account.id,
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
        displayName: account.displayName,
        avatar: account.avatar || null,
        savedPaymentMethod: account.savedPaymentMethod || null,
        createdAt: account.createdAt
    };
    localStorage.setItem('lsCurrentUser', JSON.stringify(_profile));
    window.dispatchEvent(new CustomEvent('sb:auth-changed', { detail: { user: _profile } }));
    return { user: _profile };
}

// Clears the active session and fires 'sb:auth-changed' with user: null.
async function sbSignOut() {
    _profile = null;
    localStorage.removeItem('lsCurrentUser');
    window.dispatchEvent(new CustomEvent('sb:auth-changed', { detail: { user: null } }));
}

// Updates the stored password for the currently logged-in user.
async function sbUpdatePassword(newPassword) {
    if (!_profile) return { error: { message: 'not_logged_in' } };
    const accounts = JSON.parse(localStorage.getItem('lsAccounts')) || [];
    const acc = accounts.find(a => a.id === _profile.id);
    if (!acc) return { error: { message: 'user_not_found' } };
    acc.password = newPassword;
    localStorage.setItem('lsAccounts', JSON.stringify(accounts));
    return {};
}

// Looks up an account by email or username and simulates a password-reset flow.
// In localStorage mode there is no actual email — returns the email for the UI to display.
async function sbResetPassword(identifier) {
    const accounts = JSON.parse(localStorage.getItem('lsAccounts')) || [];
    const account = identifier.includes('@')
        ? accounts.find(a => a.email.toLowerCase() === identifier.toLowerCase())
        : accounts.find(a => a.displayName.toLowerCase() === identifier.toLowerCase());
    if (!account) return { error: { message: 'user_not_found' } };
    return { error: null, email: account.email };
}

// ─── Profile ──────────────────────────────────────────────────────────────────
// ⚠️  Avatars are stored as base64 strings in localStorage.
//     A single image can exceed 1–2 MB; stay within the ~5 MB localStorage quota.

// Applies a partial update to the current user's profile fields.
// Allowed fields: firstName, lastName, displayName, avatar, email, savedPaymentMethod.
async function sbUpdateProfile(updates) {
    if (!_profile) return { error: { message: 'not_logged_in' } };
    const accounts = JSON.parse(localStorage.getItem('lsAccounts')) || [];
    const acc = accounts.find(a => a.id === _profile.id);
    if (!acc) return { error: { message: 'user_not_found' } };

    const fields = ['firstName', 'lastName', 'displayName', 'avatar', 'email', 'savedPaymentMethod'];
    fields.forEach(k => {
        if (k in updates) { acc[k] = updates[k]; _profile[k] = updates[k]; }
    });

    localStorage.setItem('lsAccounts', JSON.stringify(accounts));
    localStorage.setItem('lsCurrentUser', JSON.stringify(_profile));
    return {};
}

// ─── Cart (per-account localStorage) ──────────────────────────────────────────
// Each user gets an isolated key so carts don't bleed between accounts.

// Returns the localStorage key for the current user's cart, or null if not logged in.
function _cartKey() { return _profile ? `lsCart_${_profile.id}` : null; }

// Loads the persisted cart array for the logged-in user.
async function sbLoadCart() {
    if (!_profile) return [];
    return JSON.parse(localStorage.getItem(_cartKey())) || [];
}

// Overwrites the persisted cart for the logged-in user with the given items array.
async function sbSyncCart(items) {
    if (!_profile) return;
    localStorage.setItem(_cartKey(), JSON.stringify(items || []));
}

// ─── Wishlist (per-account localStorage) ─────────────────────────────────────

// Returns the localStorage key for the current user's wishlist, or null if not logged in.
function _wishlistKey() { return _profile ? `lsWishlist_${_profile.id}` : null; }

// Loads the persisted wishlist array for the logged-in user.
async function sbLoadWishlist() {
    if (!_profile) return [];
    return JSON.parse(localStorage.getItem(_wishlistKey())) || [];
}

// Overwrites the persisted wishlist for the logged-in user with the given items array.
async function sbSyncWishlist(items) {
    if (!_profile) return;
    localStorage.setItem(_wishlistKey(), JSON.stringify(items || []));
}

// ─── Orders ───────────────────────────────────────────────────────────────────
// Guest orders use a shared key; they are not migrated on sign-up by design.

// Returns the localStorage key for the current user's orders.
// Falls back to a shared guest key when no user is logged in.
function _ordersKey() { return _profile ? `lsOrders_${_profile.id}` : 'lsOrders_guest'; }

// Retrieves all orders for the logged-in user, normalising each record into a
// consistent shape (adds a human-readable code if one is missing).
async function sbGetOrders() {
    if (!_profile) return [];
    const orders = JSON.parse(localStorage.getItem(_ordersKey())) || [];
    return orders.map(r => ({
        id: r.id,
        code: r.code || ('#' + String(r.id).substring(0, 6).toUpperCase()),
        date: r.date,
        total: r.total,
        payment: r.payment,
        paymentInfo: r.paymentInfo,
        items: r.items || [],
        status: r.status || 'in progress',
        userId: _profile.id
    }));
}

// Creates a new order record with a unique ID and prepends it to the orders list.
// Returns { data: { id, created_at }, error: null } to mirror the Supabase response.
async function sbCreateOrder(order) {
    if (!_profile) return { error: { message: 'not_logged_in' } };
    const orders = JSON.parse(localStorage.getItem(_ordersKey())) || [];
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const newOrder = {
        id,
        code: '#' + id.substring(0, 6).toUpperCase(),
        date: new Date().toISOString(),
        total: order.total,
        payment: order.payment,
        paymentInfo: order.paymentInfo,
        items: order.items,
        status: order.status || 'in progress'
    };
    orders.unshift(newOrder);
    localStorage.setItem(_ordersKey(), JSON.stringify(orders));
    return { data: { id, created_at: newOrder.date }, error: null };
}

// Applies a partial update (items, total, status) to an existing order by ID.
async function sbUpdateOrder(orderId, updates) {
    const orders = JSON.parse(localStorage.getItem(_ordersKey())) || [];
    const order = orders.find(o => o.id === orderId);
    if (!order) return { error: { message: 'order_not_found' } };
    if ('items' in updates) order.items = updates.items;
    if ('total' in updates) order.total = updates.total;
    if ('status' in updates) order.status = updates.status;
    localStorage.setItem(_ordersKey(), JSON.stringify(orders));
    return { error: null };
}

// ─── Addresses ────────────────────────────────────────────────────────────────

// Returns the localStorage key for the current user's addresses.
function _addrKey() { return _profile ? `lsAddresses_${_profile.id}` : null; }

// Loads the saved billing and shipping addresses for the logged-in user.
// Returns { billing: null, shipping: null } when none have been saved yet.
async function sbGetAddresses() {
    if (!_profile) return { billing: null, shipping: null };
    return JSON.parse(localStorage.getItem(_addrKey())) || { billing: null, shipping: null };
}

// Persists the addresses object (containing billing and/or shipping) for the user.
async function sbSaveAddresses(addresses) {
    if (!_profile) return;
    localStorage.setItem(_addrKey(), JSON.stringify(addresses));
}

// ─── Saved Cards ──────────────────────────────────────────────────────────────

// Returns the localStorage key for the current user's saved payment cards.
function _cardsKey() { return _profile ? `lsSavedCards_${_profile.id}` : null; }

// Retrieves the list of saved payment cards for the logged-in user.
async function sbGetCards() {
    if (!_profile) return [];
    return JSON.parse(localStorage.getItem(_cardsKey())) || [];
}

// Appends a new card entry (masked number, expiry, nickname, isDefault) to the list.
// Generates a unique _sbId for each card so it can be targeted by delete/setDefault.
async function sbAddCard(card) {
    if (!_profile) return;
    const cards = JSON.parse(localStorage.getItem(_cardsKey())) || [];
    cards.push({
        _sbId: Date.now().toString(36) + Math.random().toString(36).substring(2),
        maskedNumber: card.maskedNumber,
        expiry: card.expiry,
        nickname: card.nickname || '',
        isDefault: card.isDefault || false
    });
    localStorage.setItem(_cardsKey(), JSON.stringify(cards));
}

// Removes the card with the matching _sbId from the saved cards list.
async function sbDeleteCard(sbId) {
    if (!_profile) return;
    const cards = (JSON.parse(localStorage.getItem(_cardsKey())) || []).filter(c => c._sbId !== sbId);
    localStorage.setItem(_cardsKey(), JSON.stringify(cards));
}

// Sets the card matching _sbId as the default and unsets all others.
async function sbSetDefaultCard(sbId) {
    if (!_profile) return;
    const cards = JSON.parse(localStorage.getItem(_cardsKey())) || [];
    cards.forEach(c => { c.isDefault = c._sbId === sbId; });
    localStorage.setItem(_cardsKey(), JSON.stringify(cards));
}
