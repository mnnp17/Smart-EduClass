// auth.js - Authentication checks and route guards

document.addEventListener('DOMContentLoaded', () => {
    const user = window.AppState.getCurrentUser();

    // --- RELIABLE PAGE DETECTION via DOM elements (works with file:// protocol) ---
    const isLoginPage  = !!document.getElementById('login-form');
    const isGuruPage   = !!document.getElementById('welcome-teacher');
    const isSiswaPage  = !!document.getElementById('welcome-student');
    if (isLoginPage) {
        // If already logged in, redirect to the correct dashboard
        if (user) {
            if (user.role === 'guru') {
                window.location.href = 'guru.html';
            } else if (user.role === 'siswa') {
                window.location.href = 'siswa.html';
            }
        }
        // Not logged in → stay on login page, do nothing

    } else if (isGuruPage || isSiswaPage) {
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

        // All checks passed — setup sidebar profile UI
        setupUserProfileUI(user);
    }
    // If none of the above match (e.g. unknown page), do nothing safely
});

function redirectByRole(role) {
    if (role === 'guru') {
        window.location.href = 'guru.html';
    } else {
        window.location.href = 'siswa.html';
    }
}

// Setup sidebar profile elements if present
function setupUserProfileUI(user) {
    const avatarEl  = document.querySelector('.sidebar .avatar');
    const nameEl    = document.querySelector('.sidebar .profile-name');
    const roleEl    = document.querySelector('.sidebar .profile-role');
    const logoutBtn = document.querySelector('.sidebar .btn-logout');

    if (avatarEl) {
        const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        avatarEl.textContent = initials;
    }
    if (nameEl) {
        nameEl.textContent = user.name;
    }
    if (roleEl) {
        if (user.role === 'guru') {
            roleEl.textContent = 'Guru Pengajar';
        } else {
            roleEl.textContent = 'Siswa';
        }
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.AppState.logout();
            window.location.href = 'index.html';
        });
    }
}
