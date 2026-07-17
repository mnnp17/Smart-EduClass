// wali.js - Logic for Wali Kelas (Homeroom Teacher) Dashboard

document.addEventListener('DOMContentLoaded', () => {
    // Current user info
    const currentUser = window.AppState.getCurrentUser();
    if (currentUser) {
        document.getElementById('welcome-wali').textContent = `Selamat Datang, ${currentUser.name}`;
    }

    // Set Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('id-ID', options);

    // Tab Switching
    const menuItems = document.querySelectorAll('.sidebar .menu-item');
    const tabPanels = document.querySelectorAll('.main-content .tab-panel');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabName = item.getAttribute('data-tab');
            
            menuItems.forEach(i => i.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            
            item.classList.add('active');
            const targetPanel = document.getElementById(`tab-${tabName}`);
            if (targetPanel) targetPanel.classList.add('active');
            
            // Refresh content based on tab
            if (tabName === 'overview') {
                refreshOverviewTab();
            } else if (tabName === 'mapel') {
                refreshMapelTab();
            } else if (tabName === 'siswa') {
                refreshSiswaTab();
            }
        });
    });

    // --- OVERVIEW TAB LOGIC ---
    function refreshOverviewTab() {
        const students = window.AppState.getStudents();
        const subjects = window.AppState.getSubjects();
        const classDetails = window.AppState.getClassDetails();

        // 1. Stats
        document.getElementById('stat-nama-kelas').textContent = classDetails.name;
        document.getElementById('stat-total-siswa').textContent = students.length;
        document.getElementById('stat-total-mapel').textContent = subjects.length;

        // 2. Overview Subjects Table
        const overviewBody = document.getElementById('overview-mapel-body');
        overviewBody.innerHTML = '';

        if (subjects.length === 0) {
            overviewBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Belum ada mata pelajaran terdaftar. Silakan tambahkan.</td></tr>`;
        } else {
            subjects.forEach(sub => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight:600;">${escapeHTML(sub.name)}</td>
                    <td style="color:var(--text-secondary);">${escapeHTML(sub.teacher)}</td>
                    <td>${escapeHTML(sub.schedule)}</td>
                    <td><span class="badge badge-info">${escapeHTML(sub.joinCode)}</span></td>
                `;
                overviewBody.appendChild(tr);
            });
        }
    }

    // --- MAPEL TAB LOGIC (CRUD) ---
    function refreshMapelTab() {
        const subjects = window.AppState.getSubjects();
        const tableBody = document.getElementById('mapel-table-body');
        tableBody.innerHTML = '';

        if (subjects.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">Belum ada mata pelajaran terdaftar.</td></tr>`;
        } else {
            subjects.forEach(sub => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight:600;">${escapeHTML(sub.name)}</td>
                    <td style="color:var(--text-secondary);">${escapeHTML(sub.teacher)}</td>
                    <td>${escapeHTML(sub.schedule)}</td>
                    <td><span class="badge badge-info">${escapeHTML(sub.joinCode)}</span></td>
                    <td style="text-align: center;">
                        <button class="btn-action-outline btn-edit" data-id="${sub.id}" style="font-size: 11px; padding: 4px 8px; margin-right: 6px;">Ubah</button>
                        <button class="btn-action-outline btn-delete" data-id="${sub.id}" style="font-size: 11px; padding: 4px 8px; color: var(--danger); border-color: rgba(239, 68, 68, 0.2);">Hapus</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            // Bind Edit Action
            tableBody.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    openEditModal(id);
                });
            });

            // Bind Delete Action
            tableBody.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    if (confirm('Apakah Anda yakin ingin menghapus mata pelajaran ini?')) {
                        window.AppState.deleteSubject(id);
                        refreshMapelTab();
                        refreshOverviewTab();
                    }
                });
            });
        }
    }

    // --- SISWA TAB LOGIC ---
    function refreshSiswaTab() {
        const students = window.AppState.getStudents();
        const gridList = document.getElementById('students-grid-list');
        gridList.innerHTML = '';

        students.forEach(s => {
            const card = document.createElement('div');
            card.className = 'glass-card member-card';
            const initials = s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            card.innerHTML = `
                <div class="avatar" style="background: #272a3d;">${initials}</div>
                <div>
                    <div style="font-weight: 600;">${escapeHTML(s.name)}</div>
                    <div style="font-size: 11px; color: var(--text-secondary);">Username: <code>${escapeHTML(s.username)}</code></div>
                </div>
            `;
            gridList.appendChild(card);
        });
    }

    // --- MODAL CRUD MAPEL LOGIC ---
    const modal = document.getElementById('mapel-modal');
    const form = document.getElementById('mapel-form');
    const modalTitle = document.getElementById('modal-title');
    const mapelIdInput = document.getElementById('mapel-id');
    const nameInput = document.getElementById('mapel-name');
    const teacherInput = document.getElementById('mapel-teacher');
    const scheduleInput = document.getElementById('mapel-schedule');
    const codeInput = document.getElementById('mapel-code');

    const btnAdd = document.getElementById('btn-add-mapel');
    const btnClose = document.getElementById('btn-close-modal');
    const btnCancel = document.getElementById('btn-cancel-modal');

    // Add Subject triggers modal
    btnAdd.addEventListener('click', () => {
        form.reset();
        mapelIdInput.value = '';
        modalTitle.textContent = 'Tambah Mata Pelajaran';
        modal.classList.add('active');
    });

    btnClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);

    function closeModal() {
        modal.classList.remove('active');
    }

    // Open Modal for Edit
    function openEditModal(id) {
        const subjects = window.AppState.getSubjects();
        const sub = subjects.find(s => s.id === id);
        if (sub) {
            mapelIdInput.value = sub.id;
            nameInput.value = sub.name;
            teacherInput.value = sub.teacher;
            scheduleInput.value = sub.schedule;
            codeInput.value = sub.joinCode;
            
            modalTitle.textContent = 'Ubah Detail Mata Pelajaran';
            modal.classList.add('active');
        }
    }

    // Submit form (Add or Edit)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = mapelIdInput.value;
        const name = nameInput.value.trim();
        const teacher = teacherInput.value.trim();
        const schedule = scheduleInput.value.trim();
        const code = codeInput.value.trim().toUpperCase();

        if (id) {
            // Edit
            window.AppState.updateSubject(id, name, teacher, schedule, code);
        } else {
            // Add new
            window.AppState.addSubject(name, teacher, schedule, code);
        }

        closeModal();
        refreshMapelTab();
        refreshOverviewTab();
    });

    // Helper: Escape HTML
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Initial Load
    refreshOverviewTab();
});
