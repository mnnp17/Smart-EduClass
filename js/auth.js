// auth.js - Authentication checks and route guards

document.addEventListener('DOMContentLoaded', () => {
    const user = window.AppState.getCurrentUser();

    // --- RELIABLE PAGE DETECTION via DOM elements (works with file:// protocol) ---
    const isLoginPage  = !!document.getElementById('login-form');
    const isGuruPage   = !!document.getElementById('welcome-teacher');
    const isSiswaPage  = !!document.getElementById('welcome-student');
    const isAdminPage  = !!document.getElementById('super-admin-dashboard');

    if (isLoginPage) {
        // If already logged in, redirect to the correct dashboard
        if (user) {
            if (user.role === 'admin') window.location.href = 'admin.html';
            else if (user.role === 'guru') window.location.href = 'guru.html';
            else if (user.role === 'siswa') window.location.href = 'siswa.html';
        }
        // Not logged in → stay on login page, do nothing

    } else if (isGuruPage || isSiswaPage || isAdminPage) {
        // Protected pages: must be logged in
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        // Role guard
        if (isGuruPage && user.role !== 'guru') {
            redirectByRole(user.role);
            return;
        }
        if (isSiswaPage && user.role !== 'siswa') {
            redirectByRole(user.role);
            return;
        }
        if (isAdminPage && user.role !== 'admin') {
            redirectByRole(user.role);
            return;
        }

        // All checks passed — setup sidebar profile UI
        setupUserProfileUI(user);
    }
    
    // Global Logout Handler for all buttons
    document.querySelectorAll('.btn-logout').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.AppState.logout();
            window.location.href = 'index.html';
        });
    });
});

function redirectByRole(role) {
    if (role === 'admin') window.location.href = 'admin.html';
    else if (role === 'guru') window.location.href = 'guru.html';
    else window.location.href = 'siswa.html';
}

// Setup sidebar and drawer profile elements if present
function setupUserProfileUI(user) {
    const avatars  = document.querySelectorAll('.sidebar .avatar, #drawer-avatar');
    const names    = document.querySelectorAll('.sidebar .profile-name, #drawer-name');
    const roles    = document.querySelectorAll('.sidebar .profile-role, #drawer-role');

    const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    avatars.forEach(el => el.textContent = initials);
    names.forEach(el => el.textContent = user.name);
    roles.forEach(el => {
        if (user.role === 'admin') el.textContent = 'Super Admin';
        else if (user.role === 'guru') el.textContent = 'Guru Pengajar';
        else el.textContent = 'Siswa';
    });
}
