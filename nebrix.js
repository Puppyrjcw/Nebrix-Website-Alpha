"use strict";

const API = "https://api.nebrixgames.com";

function getToken()    { return localStorage.getItem("nebrix_token"); }
function getUsername() { return localStorage.getItem("nebrix_username"); }
function isLoggedIn()  { return !!getToken(); }

function saveSession(token, username) {
    localStorage.setItem("nebrix_token", token);
    localStorage.setItem("nebrix_username", username);
}

function clearSession() {
    localStorage.removeItem("nebrix_token");
    localStorage.removeItem("nebrix_username");
}

const PUBLIC_PAGES = ["signup.html", "index.html", ""];

function requireAuth() {
    const page = window.location.pathname.split("/").pop() || "";
    const isPublic = PUBLIC_PAGES.some(p => page === p || page === "");
    if (!isPublic && !isLoggedIn()) {
        window.location.replace("index.html");
    }
}

function renderNav(activePage) {
    const navContainer = document.getElementById("nebrix-nav");
    if (!navContainer) return;

    const loggedIn = isLoggedIn();
    const user     = getUsername();

    let rightSideHtml = `
        <a href="signup.html" class="nav-btn nav-btn-signup">Sign Up</a>
        <a href="index.html" class="nav-btn nav-btn-login">Log In</a>
    `;

    if (loggedIn && user) {
        rightSideHtml = `
            <a href="profile.html?u=${encodeURIComponent(user)}" class="nav-user">
                <span class="nav-user-avatar">${escapeHtml(user.charAt(0).toUpperCase())}</span>
                ${escapeHtml(user)}
            </a>
            <a href="settings.html" class="nav-btn nav-btn-settings ${activePage === 'settings' ? 'active' : ''}">Settings</a>
            <button class="nav-btn nav-btn-logout" onclick="logout()">Logout</button>
        `;
    }

    navContainer.innerHTML = `
        <a href="home.html" class="nav-brand-link">
            <img src="assets/images/nebrixlogo.png" alt="" class="nav-logo-icon">
            <span class="nav-brand-text">ebrix</span>
        </a>
        <div class="nav-links">
            <a href="home.html" class="${activePage === 'home' ? 'active' : ''}">Home</a>
            <a href="https://discord.com/invite/XTa4GwaJFY" target="_blank">Discord</a>
        </div>
        <div class="nav-right">
            ${rightSideHtml}
        </div>
    `;
}

function showLoginModal() {
    document.getElementById("auth-modal-overlay").style.display = "flex";
    document.getElementById("auth-modal-login").style.display   = "block";
    document.getElementById("auth-modal-register").style.display = "none";
    document.getElementById("auth-error-login").textContent     = "";
}

function showRegisterModal() {
    document.getElementById("auth-modal-overlay").style.display  = "flex";
    document.getElementById("auth-modal-login").style.display    = "none";
    document.getElementById("auth-modal-register").style.display = "block";
    document.getElementById("auth-error-login").textContent      = "";
}

function closeAuthModal() {
    document.getElementById("auth-modal-overlay").style.display = "none";
}

async function doLogin() {
    const username = document.getElementById("modal-login-user").value.trim();
    const password = document.getElementById("modal-login-pass").value;
    const err      = document.getElementById("auth-error-login");
    if (!username || !password) { err.textContent = "Please fill in all fields."; return; }

    try {
        const res  = await fetch(API + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.token) {
            saveSession(data.token, username);
            closeAuthModal();
            window.location.href = "home.html";
        } else {
            err.textContent = data.error || "Invalid credentials.";
        }
    } catch { err.textContent = "Could not reach server."; }
}

function logout() {
    clearSession();
    window.location.href = "index.html";
}

function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g,  "&lt;")
        .replace(/>/g,  "&gt;")
        .replace(/"/g,  "&quot;");
}

function injectAuthModal() {
    const html = `
    <div id="auth-modal-overlay" class="modal-overlay" style="display:none;">
        <div class="modal-panel">
            <button class="modal-close" onclick="closeAuthModal()">&times;</button>

            <div id="auth-modal-login">
                <h2 class="modal-title">Welcome Back</h2>
                <p class="modal-subtitle">Sign in to continue to Nebrix</p>
                <div class="modal-input-group">
                    <label>Username</label>
                    <input id="modal-login-user" type="text" placeholder="Enter your username" autocomplete="username">
                </div>
                <div class="modal-input-group">
                    <label>Password</label>
                    <input id="modal-login-pass" type="password" placeholder="Enter your password" autocomplete="current-password" onkeydown="if(event.key==='Enter')doLogin()">
                </div>
                <p id="auth-error-login" class="modal-error"></p>
                <button class="modal-btn" onclick="doLogin()">Sign In</button>
                <p class="modal-switch">
                    Don't have an account? <a href="signup.html">Create one</a>
                </p>
            </div>

            <div id="auth-modal-register" style="display:none;">
                <h2 class="modal-title">Join Nebrix</h2>
                <p class="modal-subtitle">Start creating and playing today</p>
                <button class="modal-btn" onclick="window.location.href='signup.html'">Go to Sign Up</button>
                <p class="modal-switch">
                    Already have an account? <a href="#" onclick="showLoginModal()">Sign in</a>
                </p>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
}

document.addEventListener("DOMContentLoaded", () => {
    requireAuth();
    injectAuthModal();
});