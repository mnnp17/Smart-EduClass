// admin.js - Logika Khusus Halaman Super Admin

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Check
    const currentUser = AppState.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    // Update Header Date
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = new Date().toLocaleDateString('id-ID', dateOptions);
    const elDate = document.getElementById('current-date');
    if(elDate) elDate.textContent = dateString;

    // Logout
    document.querySelectorAll('.btn-logout').forEach(btn => {
        btn.addEventListener('click', () => {
            AppState.logout();
            window.location.href = 'index.html';
        });
    });

    // 2. Tab Navigation
    const tabs = document.querySelectorAll('.sidebar .menu-item');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const target = tab.getAttribute('data-tab');
            panels.forEach(p => {
                p.classList.remove('active');
                if (p.id === `tab-${target}`) {
                    p.classList.add('active');
                }
            });

            // Trigger specific renders
            if (target === 'dashboard') renderDashboard();
            if (target === 'kelola-guru') renderGuru();
            if (target === 'kelola-siswa') renderSiswa();
            if (target === 'kelola-kelas') renderKelas();
            if (target === 'kelola-mapel') renderMapel();
        });
    });

    // 3. Render Dashboard
    function renderDashboard() {
        const teachers = AppState.getTeachers();
        const students = AppState.getStudents();
        const classes = AppState.getClasses();
        const subjects = AppState.getSubjects();
        const materials = AppState.getMaterials();
        
        // Count today's attendance records (Hadir/Sakit/Izin/Alfa, exclude Belum Presensi if needed, or total students checked)
        const dateStr = new Date().toISOString().split('T')[0];
        const records = AppState.getAttendanceRecords(null, dateStr);
        const presensiHadir = records.filter(r => r.status !== 'Belum Presensi').length;

        document.getElementById('stat-guru').textContent = teachers.length;
        document.getElementById('stat-siswa').textContent = students.length;
        document.getElementById('stat-kelas').textContent = classes.length;
        document.getElementById('stat-mapel').textContent = subjects.length;
        document.getElementById('stat-materi').textContent = materials.length;
        document.getElementById('stat-presensi').textContent = presensiHadir;
    }

    // --- Modal Helpers ---
    function openModal(id) {
        document.getElementById(id).classList.add('active');
    }
    function closeModal(id) {
        document.getElementById(id).classList.remove('active');
    }

    // 4. Kelola Guru
    function renderGuru() {
        const tbody = document.getElementById('guru-table-body');
        const teachers = AppState.getTeachers();
        tbody.innerHTML = '';
        
        if (teachers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align: center;">Belum ada data guru.</td></tr>`;
            return;
        }
        
        teachers.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${t.name}</strong></td>
                <td>${t.username}</td>
                <td style="text-align: center;">
                    <button class="btn-action-outline btn-edit-guru" data-username="${t.username}" style="padding: 4px 8px; font-size: 11px;">Edit</button>
                    <button class="btn-action-outline btn-delete-guru" data-username="${t.username}" style="padding: 4px 8px; font-size: 11px; color: var(--danger); border-color: rgba(239, 68, 68, 0.3);">Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Events
        document.querySelectorAll('.btn-delete-guru').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const username = e.target.getAttribute('data-username');
                if(confirm(`Hapus guru dengan username ${username}?`)) {
                    AppState.deleteTeacher(username);
                    renderGuru();
                    renderDashboard();
                }
            });
        });

        document.querySelectorAll('.btn-edit-guru').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const username = e.target.getAttribute('data-username');
                const t = AppState.getTeachers().find(x => x.username === username);
                if(t) {
                    document.getElementById('guru-old-username').value = t.username;
                    document.getElementById('guru-name').value = t.name;
                    document.getElementById('guru-username').value = t.username;
                    document.getElementById('guru-password').value = t.password || 'password';
                    document.getElementById('modal-guru-title').textContent = 'Edit Guru';
                    openModal('modal-guru');
                }
            });
        });
    }

    document.getElementById('btn-add-guru').addEventListener('click', () => {
        document.getElementById('form-guru').reset();
        document.getElementById('guru-old-username').value = '';
        document.getElementById('modal-guru-title').textContent = 'Tambah Guru';
        openModal('modal-guru');
    });

    document.getElementById('btn-close-guru').addEventListener('click', () => closeModal('modal-guru'));
    document.getElementById('btn-cancel-guru').addEventListener('click', () => closeModal('modal-guru'));
    document.getElementById('form-guru').addEventListener('submit', (e) => {
        e.preventDefault();
        const oldUsername = document.getElementById('guru-old-username').value;
        const name = document.getElementById('guru-name').value;
        const username = document.getElementById('guru-username').value;
        const password = document.getElementById('guru-password').value;

        if (oldUsername) {
            const success = AppState.updateTeacher(oldUsername, name, username, password);
            if(!success) alert('Username sudah dipakai!');
        } else {
            const success = AppState.addTeacher(name, username, password);
            if(!success) alert('Username sudah dipakai!');
        }
        closeModal('modal-guru');
        renderGuru();
        renderDashboard();
    });

    // 5. Kelola Siswa
    function renderSiswa() {
        const tbody = document.getElementById('siswa-table-body');
        const students = AppState.getStudents();
        const classes = AppState.getClasses();
        tbody.innerHTML = '';
        
        if (students.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Belum ada data siswa.</td></tr>`;
            return;
        }
        
        students.forEach(s => {
            const cls = classes.find(c => c.id === s.classId);
            const className = cls ? cls.name : '<span style="color:var(--danger)">Belum ada Kelas</span>';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${s.name}</strong></td>
                <td>${s.username}</td>
                <td><div class="status-badge" style="background: rgba(99, 102, 241, 0.1); color: var(--accent-primary);">${className}</div></td>
                <td style="text-align: center;">
                    <button class="btn-action-outline btn-edit-siswa" data-id="${s.id}" style="padding: 4px 8px; font-size: 11px;">Edit</button>
                    <button class="btn-action-outline btn-delete-siswa" data-id="${s.id}" style="padding: 4px 8px; font-size: 11px; color: var(--danger); border-color: rgba(239, 68, 68, 0.3);">Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-delete-siswa').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                if(confirm(`Hapus siswa ini?`)) {
                    AppState.deleteStudent(id);
                    renderSiswa();
                    renderDashboard();
                }
            });
        });

        document.querySelectorAll('.btn-edit-siswa').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const s = AppState.getStudents().find(x => x.id === id);
                if(s) {
                    const u = AppState.getUsers().find(x => x.username === s.username);
                    document.getElementById('siswa-id').value = s.id;
                    document.getElementById('siswa-old-username').value = s.username;
                    document.getElementById('siswa-name').value = s.name;
                    document.getElementById('siswa-username').value = s.username;
                    document.getElementById('siswa-password').value = u ? u.password : 'password';
                    
                    populateKelasSelect('siswa-kelas');
                    document.getElementById('siswa-kelas').value = s.classId || '';
                    
                    document.getElementById('modal-siswa-title').textContent = 'Edit Siswa';
                    openModal('modal-siswa');
                }
            });
        });
    }

    function populateKelasSelect(selectId) {
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">-- Pilih Kelas --</option>';
        AppState.getClasses().forEach(c => {
            select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });
    }

    document.getElementById('btn-add-siswa').addEventListener('click', () => {
        document.getElementById('form-siswa').reset();
        document.getElementById('siswa-id').value = '';
        document.getElementById('siswa-old-username').value = '';
        populateKelasSelect('siswa-kelas');
        document.getElementById('modal-siswa-title').textContent = 'Tambah Siswa';
        openModal('modal-siswa');
    });

    document.getElementById('btn-close-siswa').addEventListener('click', () => closeModal('modal-siswa'));
    document.getElementById('btn-cancel-siswa').addEventListener('click', () => closeModal('modal-siswa'));
    document.getElementById('form-siswa').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('siswa-id').value;
        const name = document.getElementById('siswa-name').value;
        const username = document.getElementById('siswa-username').value;
        const password = document.getElementById('siswa-password').value;
        const classId = document.getElementById('siswa-kelas').value;

        if (id) {
            const success = AppState.updateStudent(id, name, username, classId, password);
            if(!success) alert('Gagal update. Username mungkin sudah dipakai!');
        } else {
            const success = AppState.addStudent(name, username, password, classId);
            if(!success) alert('Username sudah dipakai!');
        }
        closeModal('modal-siswa');
        renderSiswa();
        renderDashboard();
    });

    // 6. Kelola Kelas
    function renderKelas() {
        const tbody = document.getElementById('kelas-table-body');
        const classes = AppState.getClasses();
        const students = AppState.getStudents();
        tbody.innerHTML = '';
        
        if (classes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align: center;">Belum ada data kelas.</td></tr>`;
            return;
        }
        
        classes.forEach(c => {
            const count = students.filter(s => s.classId === c.id).length;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${c.name}</strong></td>
                <td>${count} Siswa</td>
                <td style="text-align: center;">
                    <button class="btn-action-outline btn-edit-kelas" data-id="${c.id}" style="padding: 4px 8px; font-size: 11px;">Edit</button>
                    <button class="btn-action-outline btn-delete-kelas" data-id="${c.id}" style="padding: 4px 8px; font-size: 11px; color: var(--danger); border-color: rgba(239, 68, 68, 0.3);">Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-delete-kelas').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                if(confirm(`Hapus kelas ini? Siswa dan Mapel terkait akan kehilangan referensi kelas ini.`)) {
                    AppState.deleteClass(id);
                    renderKelas();
                    renderDashboard();
                }
            });
        });

        document.querySelectorAll('.btn-edit-kelas').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const c = AppState.getClasses().find(x => x.id === id);
                if(c) {
                    document.getElementById('kelas-id').value = c.id;
                    document.getElementById('kelas-name').value = c.name;
                    document.getElementById('modal-kelas-title').textContent = 'Edit Kelas';
                    openModal('modal-kelas');
                }
            });
        });
    }

    document.getElementById('btn-add-kelas').addEventListener('click', () => {
        document.getElementById('form-kelas').reset();
        document.getElementById('kelas-id').value = '';
        document.getElementById('modal-kelas-title').textContent = 'Tambah Kelas';
        openModal('modal-kelas');
    });

    document.getElementById('btn-close-kelas').addEventListener('click', () => closeModal('modal-kelas'));
    document.getElementById('btn-cancel-kelas').addEventListener('click', () => closeModal('modal-kelas'));
    document.getElementById('form-kelas').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('kelas-id').value;
        const name = document.getElementById('kelas-name').value;

        if (id) {
            AppState.updateClass(id, name);
        } else {
            AppState.addClass(name);
        }
        closeModal('modal-kelas');
        renderKelas();
        renderDashboard();
    });

    // 7. Kelola Mapel
    function renderMapel() {
        const tbody = document.getElementById('mapel-table-body');
        const subjects = AppState.getSubjects();
        const teachers = AppState.getTeachers();
        const classes = AppState.getClasses();
        tbody.innerHTML = '';
        
        if (subjects.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Belum ada data mata pelajaran.</td></tr>`;
            return;
        }
        
        subjects.forEach(s => {
            const t = teachers.find(x => x.username === s.teacherUsername);
            const teacherName = t ? t.name : '<span style="color:var(--danger)">-</span>';
            
            const classNames = (s.classIds || []).map(cid => {
                const c = classes.find(x => x.id === cid);
                return c ? c.name : null;
            }).filter(x => x).join(', ');
            const kelasDisplay = classNames || '<span style="color:var(--danger)">Belum diplot</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${s.name}</strong></td>
                <td>${teacherName}</td>
                <td><div style="font-size: 11px; max-width: 150px; line-height: 1.4;">${kelasDisplay}</div></td>
                <td><div style="font-size: 11px;">${s.schedule}</div></td>
                <td><div class="status-badge" style="background: rgba(16, 185, 129, 0.1); color: var(--success);">${s.joinCode}</div></td>
                <td style="text-align: center;">
                    <button class="btn-action-outline btn-edit-mapel" data-id="${s.id}" style="padding: 4px 8px; font-size: 11px;">Edit</button>
                    <button class="btn-action-outline btn-delete-mapel" data-id="${s.id}" style="padding: 4px 8px; font-size: 11px; color: var(--danger); border-color: rgba(239, 68, 68, 0.3);">Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-delete-mapel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                if(confirm(`Hapus Mata Pelajaran ini?`)) {
                    AppState.deleteSubject(id);
                    renderMapel();
                    renderDashboard();
                }
            });
        });

        document.querySelectorAll('.btn-edit-mapel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const s = AppState.getSubjects().find(x => x.id === id);
                if(s) {
                    document.getElementById('mapel-id').value = s.id;
                    document.getElementById('mapel-name').value = s.name;
                    
                    populateGuruSelect('mapel-guru');
                    document.getElementById('mapel-guru').value = s.teacherUsername || '';
                    
                    populateKelasCheckboxes('mapel-kelas-checkboxes', s.classIds || []);
                    
                    document.getElementById('mapel-schedule').value = s.schedule;
                    document.getElementById('mapel-code').value = s.joinCode;
                    
                    document.getElementById('modal-mapel-title').textContent = 'Edit Mapel';
                    openModal('modal-mapel');
                }
            });
        });
    }

    function populateGuruSelect(selectId) {
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">-- Pilih Guru --</option>';
        AppState.getTeachers().forEach(t => {
            select.innerHTML += `<option value="${t.username}">${t.name}</option>`;
        });
    }

    function populateKelasCheckboxes(containerId, selectedIds = []) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        const classes = AppState.getClasses();
        if(classes.length === 0) {
            container.innerHTML = '<div style="font-size:12px; color:var(--text-muted);">Belum ada kelas yang dibuat.</div>';
            return;
        }
        classes.forEach(c => {
            const checked = selectedIds.includes(c.id) ? 'checked' : '';
            container.innerHTML += `
                <label style="display:flex; align-items:center; gap:8px; font-size:13px; cursor:pointer;">
                    <input type="checkbox" name="mapel_class" value="${c.id}" ${checked}>
                    <span>${c.name}</span>
                </label>
            `;
        });
    }

    document.getElementById('btn-add-mapel').addEventListener('click', () => {
        document.getElementById('form-mapel').reset();
        document.getElementById('mapel-id').value = '';
        populateGuruSelect('mapel-guru');
        populateKelasCheckboxes('mapel-kelas-checkboxes');
        document.getElementById('modal-mapel-title').textContent = 'Tambah Mapel';
        openModal('modal-mapel');
    });

    document.getElementById('btn-close-mapel').addEventListener('click', () => closeModal('modal-mapel'));
    document.getElementById('btn-cancel-mapel').addEventListener('click', () => closeModal('modal-mapel'));
    document.getElementById('form-mapel').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('mapel-id').value;
        const name = document.getElementById('mapel-name').value;
        const teacherUsername = document.getElementById('mapel-guru').value;
        const schedule = document.getElementById('mapel-schedule').value;
        const joinCode = document.getElementById('mapel-code').value;
        
        // Collect checked classes
        const classCheckboxes = document.querySelectorAll('input[name="mapel_class"]:checked');
        const classIds = Array.from(classCheckboxes).map(cb => cb.value);

        if (id) {
            AppState.updateSubject(id, name, teacherUsername, schedule, joinCode, classIds);
        } else {
            AppState.addSubject(name, teacherUsername, schedule, joinCode, classIds);
        }
        closeModal('modal-mapel');
        renderMapel();
        renderDashboard();
    });

    // Initialize initial render
    renderDashboard();
});
