// guru.js - Logic for Teacher Dashboard

document.addEventListener('DOMContentLoaded', () => {
    // Current teacher info
    const currentUser = window.AppState.getCurrentUser();
    if (currentUser) {
        document.getElementById('welcome-teacher').textContent = `Selamat Datang, ${currentUser.name}`;
    }

    // Set Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('id-ID', options);

    // Subject Selector Setup
    const subjectSelect = document.getElementById('teacher-subject-select');
    
    function loadTeacherSubjects() {
        const subjects = window.AppState.getSubjects().filter(s => s.teacherUsername === currentUser.username);
        subjectSelect.innerHTML = '';
        if (subjects.length === 0) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'Tidak Ada Mapel yang diampu';
            subjectSelect.appendChild(opt);
        } else {
            subjects.forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub.id;
                opt.textContent = `${sub.name} (${sub.joinCode})`;
                subjectSelect.appendChild(opt);
            });
        }
    }
    
    loadTeacherSubjects();

    function getActiveSubjectId() {
        return subjectSelect.value;
    }

    function getActiveSubjectName() {
        const subjects = window.AppState.getSubjects().filter(s => s.teacherUsername === currentUser.username);
        const activeSub = subjects.find(s => s.id === getActiveSubjectId());
        return activeSub ? activeSub.name : '';
    }

    // Handle Subject Selector Change
    subjectSelect.addEventListener('change', () => {
        const activeTab = document.querySelector('.sidebar .menu-item.active').getAttribute('data-tab');
        refreshActiveTab(activeTab);
    });

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
            
            refreshActiveTab(tabName);
        });
    });

    function refreshActiveTab(tabName) {
        if (tabName === 'overview') {
            refreshOverviewTab();
        } else if (tabName === 'kelas') {
            refreshKelasTab();
        } else if (tabName === 'presensi') {
            refreshPresensiTab();
        } else if (tabName === 'materi') {
            refreshMateriTab();
        } else if (tabName === 'mapel') {
            refreshMapelTab();
        }
    }

    // --- OVERVIEW TAB LOGIC ---
    function refreshOverviewTab() {
        const activeSubId = getActiveSubjectId();
        const students = window.AppState.getStudents();
        const subjects = window.AppState.getSubjects().filter(s => s.teacherUsername === currentUser.username);
        const dateStr = new Date().toISOString().split('T')[0];
        
        // (Status Wali Kelas dihapus)        // 2. Daftar Kelas (Grid)
        const classGrid = document.getElementById('general-class-grid');
        if (classGrid) {
            classGrid.innerHTML = '';
            if (subjects.length === 0) {
                classGrid.innerHTML = `<div style="color: var(--text-muted);">Belum ada kelas yang diampu.</div>`;
            } else {
                subjects.forEach(sub => {
                    // Cek status jurnal (presensi)
                    const attendance = window.AppState.getAttendanceRecords(sub.id, dateStr);
                    const isJournalFilled = attendance && attendance.length > 0;
                    const journalStatus = isJournalFilled ? '<span style="color:var(--success);">Sudah Terisi</span>' : '<span style="color:var(--warning);">Belum Terisi</span>';
                    
                    // Display Class Name(s) instead of hardcoded VIII-A
                    const classes = window.AppState.getClasses();
                    const classNames = (sub.classIds || []).map(cid => {
                        const c = classes.find(x => x.id === cid);
                        return c ? c.name : null;
                    }).filter(x => x).join(', ') || 'Belum diplot';
                    
                    const subStudentsCount = students.filter(st => (sub.classIds || []).includes(st.classId)).length;

                    const card = document.createElement('div');
                    card.className = 'glass-card teacher-class-card';
                    card.innerHTML = `
                        <div class="teacher-class-header">
                            <div>
                                <div class="teacher-class-name">${escapeHTML(sub.name)} - ${escapeHTML(classNames)}</div>
                                <div class="teacher-class-sub">Kode: ${escapeHTML(sub.joinCode)}</div>
                            </div>
                        </div>
                        <div class="teacher-class-stats">
                            <div class="teacher-class-stat-item">
                                <span class="teacher-class-stat-label">Total Siswa</span>
                                <span class="teacher-class-stat-val">${subStudentsCount} Siswa</span>
                            </div>
                            <div class="teacher-class-stat-item" style="text-align: right;">
                                <span class="teacher-class-stat-label">Jurnal Hari Ini</span>
                                <span class="teacher-class-stat-val">${journalStatus}</span>
                            </div>
                        </div>
                    `;
                    classGrid.appendChild(card);
                });
            }
        }

        if (!activeSubId) {
            document.getElementById('recent-questions-body').innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Mata pelajaran belum dipilih.</td></tr>`;
            document.getElementById('overview-presensi-status').innerHTML = `<div style="color: var(--text-muted);">Tidak ada sesi aktif</div>`;
            return;
        }

        const questions = window.AppState.getQuestions();
        const session = window.AppState.getAttendanceSession();

        // Filter questions belonging to this subject's materials
        const filteredQuestions = questions.filter(q => {
            const mat = window.AppState.getMaterials().find(m => m.title === q.materialTitle);
            return mat && mat.subjectId === activeSubId;
        });

        // 3. Questions List
        const questionsBody = document.getElementById('recent-questions-body');
        questionsBody.innerHTML = '';
        
        if (filteredQuestions.length === 0) {
            questionsBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Belum ada pertanyaan siswa untuk mapel ini.</td></tr>`;
        } else {
            filteredQuestions.slice(0, 5).forEach(q => {
                const timeString = new Date(q.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight:600;">${escapeHTML(q.studentName)}</td>
                    <td style="color:var(--text-secondary);">${escapeHTML(q.materialTitle)}</td>
                    <td style="max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">"${escapeHTML(q.questionText)}"</td>
                    <td style="color:var(--text-muted); font-size:12px;">${timeString}</td>
                `;
                questionsBody.appendChild(tr);
            });
        }

        // 3. Attendance Status Widget
        const statusWidget = document.getElementById('overview-presensi-status');
        if (session && session.active && session.subjectId === activeSubId) {
            statusWidget.innerHTML = `
                <div style="font-size: 13px; color: var(--text-secondary);">Sesi presensi aktif: <strong>${escapeHTML(getActiveSubjectName())}</strong></div>
                <div class="code-display" style="font-size:32px; margin: 8px 0;">${session.code}</div>
                <div style="font-size:12px; color: var(--warning); font-weight:600;">Menunggu siswa masuk...</div>
                <button class="btn-action-solid" style="margin-top:12px; font-size:12px; padding:6px 12px;" onclick="document.querySelector('[data-tab=presensi]').click()">Lihat Detail Kehadiran</button>
            `;
        } else {
            statusWidget.innerHTML = `
                <div style="font-size: 40px; margin-bottom: 8px;">⏳</div>
                <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">Tidak ada sesi aktif untuk mapel ini</div>
                <button class="btn-action-solid" style="font-size:12px; padding:8px 16px;" onclick="document.querySelector('[data-tab=presensi]').click()">Mulai Sesi Presensi</button>
            `;
        }
    }

    // --- KELAS TAB LOGIC (Daftar Kelas) ---
    function refreshKelasTab() {
        const subjects = window.AppState.getSubjects().filter(s => s.teacherUsername === currentUser.username);
        const students = window.AppState.getStudents();
        const classes = window.AppState.getClasses();
        const grid = document.getElementById('daftar-kelas-grid');
        
        if (!grid) return;
        
        grid.innerHTML = '';
        if (subjects.length === 0) {
            grid.innerHTML = '<div style="color:var(--text-muted);">Belum ada kelas yang diampu.</div>';
        } else {
            subjects.forEach(sub => {
                const classNames = (sub.classIds || []).map(cid => {
                    const c = classes.find(x => x.id === cid);
                    return c ? c.name : null;
                }).filter(x => x).join(', ') || 'Belum diplot';
                const subStudentsCount = students.filter(st => (sub.classIds || []).includes(st.classId)).length;

                const card = document.createElement('div');
                card.className = 'glass-card teacher-class-card';
                card.innerHTML = `
                    <div class="teacher-class-header">
                        <div>
                            <div class="teacher-class-name">${escapeHTML(sub.name)} - ${escapeHTML(classNames)}</div>
                            <div class="teacher-class-sub">Jadwal: ${escapeHTML(sub.schedule)}</div>
                        </div>
                    </div>
                    <div class="teacher-class-stats">
                        <div class="teacher-class-stat-item">
                            <span class="teacher-class-stat-label">Total Siswa</span>
                            <span class="teacher-class-stat-val">${subStudentsCount} Siswa</span>
                        </div>
                        <div class="teacher-class-stat-item" style="text-align: right;">
                            <span class="teacher-class-stat-label">Kode Bergabung</span>
                            <span class="teacher-class-stat-val" style="color: var(--accent-primary);">${escapeHTML(sub.joinCode)}</span>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        // Render Student Table
        renderStudentTable();
    }

    function renderStudentTable() {
        const activeSubId = getActiveSubjectId();
        const subject = window.AppState.getSubjects().find(s => s.id === activeSubId);
        
        const tableBody = document.getElementById('student-table-body');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        
        if (!subject) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">Pilih Mapel terlebih dahulu.</td></tr>`;
            return;
        }

        const students = window.AppState.getStudents().filter(s => (subject.classIds || []).includes(s.classId));

        if (students.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">Belum ada siswa di kelas Mapel ini.</td></tr>`;
        } else {
            students.forEach((s, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="color: var(--text-muted);">${idx + 1}</td>
                    <td style="font-weight:600;">${escapeHTML(s.name)}</td>
                    <td><span class="badge badge-info">${escapeHTML(s.username)}</span></td>
                    <td style="text-align: center;">
                        <span style="font-size: 11px; color: var(--text-muted);">Diatur Super Admin</span>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            tableBody.querySelectorAll('.btn-delete-student').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    if (confirm('Apakah Anda yakin ingin menghapus siswa ini?')) {
                        window.AppState.deleteStudent(id);
                        refreshKelasTab();
                        refreshOverviewTab();
                    }
                });
            });
        }
    }

    // --- STUDENT MODAL LOGIC ---
    const studentModal = document.getElementById('student-modal');
    const studentForm = document.getElementById('student-form');
    const studentNameInput = document.getElementById('student-name');
    const btnAddStudent = document.getElementById('btn-add-student');
    const btnCloseStudentModal = document.getElementById('btn-close-student-modal');
    const btnCancelStudentModal = document.getElementById('btn-cancel-student-modal');

    if (btnAddStudent) {
        btnAddStudent.addEventListener('click', () => {
            studentForm.reset();
            studentModal.classList.add('active');
        });
    }

    if (btnCloseStudentModal) btnCloseStudentModal.addEventListener('click', closeStudentModal);
    if (btnCancelStudentModal) btnCancelStudentModal.addEventListener('click', closeStudentModal);

    function closeStudentModal() {
        if (studentModal) studentModal.classList.remove('active');
    }

    if (studentForm) {
        studentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = studentNameInput.value.trim();
            if (!name) return;

            const newStudent = window.AppState.addStudent(name);
            closeStudentModal();
            refreshKelasTab();
            refreshOverviewTab();

            alert(`Siswa "${newStudent.name}" berhasil ditambahkan!\nUsername: ${newStudent.username}\nPassword: password`);
        });
    }

    // --- PRESENSI TAB LOGIC ---
    let timerInterval = null;

    function refreshPresensiTab() {
        const activeSubId = getActiveSubjectId();
        if (!activeSubId) {
            document.getElementById('attendance-table-body').innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Mata pelajaran belum dipilih.</td></tr>`;
            return;
        }

        const session = window.AppState.getAttendanceSession();
        const btnStart = document.getElementById('btn-start-attendance');
        const boxActive = document.getElementById('active-session-box');
        const boxNoSession = document.getElementById('no-session-box');

        // Clear existing interval
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        if (session && session.active && session.subjectId === activeSubId) {
            btnStart.disabled = true;
            btnStart.style.opacity = '0.5';
            boxActive.style.display = 'flex';
            boxNoSession.style.display = 'none';
            document.getElementById('session-code').textContent = session.code;
            
            // Countdown Logic
            const expiresTime = new Date(session.expiresAt).getTime();
            
            function updateTimer() {
                const now = Date.now();
                const diff = expiresTime - now;
                
                if (diff <= 0) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    document.getElementById('session-timer').textContent = 'Sesi telah berakhir';
                    document.getElementById('session-timer').style.color = 'var(--danger)';
                    
                    window.AppState.getAttendanceSession(); // checks expiration internally
                    refreshPresensiTab();
                    refreshOverviewTab();
                } else {
                    const minutes = Math.floor(diff / 60000);
                    const seconds = Math.floor((diff % 60000) / 1000);
                    const padM = minutes.toString().padStart(2, '0');
                    const padS = seconds.toString().padStart(2, '0');
                    document.getElementById('session-timer').textContent = `Berakhir dalam ${padM}:${padS}`;
                    document.getElementById('session-timer').style.color = 'var(--warning)';
                }
            }
            
            updateTimer();
            timerInterval = setInterval(updateTimer, 1000);

        } else {
            btnStart.disabled = false;
            btnStart.style.opacity = '1';
            boxActive.style.display = 'none';
            boxNoSession.style.display = 'flex';
            if (session && session.active) {
                // Sesi aktif di mapel lain
                document.querySelector('#no-session-box p').textContent = `Sesi aktif sedang berjalan di mapel lain.`;
            } else {
                document.querySelector('#no-session-box p').textContent = `Tidak ada sesi presensi aktif untuk mapel ini.`;
            }
        }

        // Render Attendance Table
        const dateStr = new Date().toISOString().split('T')[0];
        const records = window.AppState.getAttendanceRecords(activeSubId, dateStr);
        const tableBody = document.getElementById('attendance-table-body');
        tableBody.innerHTML = '';

        if (records.length === 0) {
            // If no records exist for today yet, load students lists as placeholder
            const students = window.AppState.getStudents();
            if (students.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Tidak ada daftar siswa.</td></tr>`;
            } else {
                students.forEach(s => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td style="font-weight: 600;">${escapeHTML(s.name)}</td>
                        <td>-</td>
                        <td><span class="badge badge-warning">Belum Presensi</span></td>
                        <td>
                            <select class="student-status-select" data-user="${s.username}">
                                <option value="Belum Presensi" selected>Belum Presensi</option>
                                <option value="Hadir">Hadir</option>
                                <option value="Izin">Izin</option>
                                <option value="Sakit">Sakit</option>
                                <option value="Alfa">Alfa</option>
                            </select>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
            }
        } else {
            records.forEach(r => {
                const tr = document.createElement('tr');
                
                // Badge Class based on status
                let badgeClass = 'badge-warning';
                if (r.status === 'Hadir') badgeClass = 'badge-success';
                else if (r.status === 'Sakit' || r.status === 'Izin') badgeClass = 'badge-info';
                else if (r.status === 'Alfa') badgeClass = 'badge-danger';

                tr.innerHTML = `
                    <td style="font-weight: 600;">${escapeHTML(r.studentName)}</td>
                    <td>${r.time}</td>
                    <td>
                        <span class="badge ${badgeClass}">${r.status}</span>
                    </td>
                    <td>
                        <select class="student-status-select" data-user="${r.username}">
                            <option value="Belum Presensi" ${r.status === 'Belum Presensi' ? 'selected' : ''}>Belum Presensi</option>
                            <option value="Hadir" ${r.status === 'Hadir' ? 'selected' : ''}>Hadir</option>
                            <option value="Izin" ${r.status === 'Izin' ? 'selected' : ''}>Izin</option>
                            <option value="Sakit" ${r.status === 'Sakit' ? 'selected' : ''}>Sakit</option>
                            <option value="Alfa" ${r.status === 'Alfa' ? 'selected' : ''}>Alfa</option>
                        </select>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        }

        // Bind change events to dropdowns
        document.querySelectorAll('.student-status-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const username = e.target.getAttribute('data-user');
                const newStatus = e.target.value;
                window.AppState.updateAttendanceStatus(username, activeSubId, dateStr, newStatus);
                
                // Refresh current tab data
                refreshPresensiTab();
                refreshOverviewTab();
            });
        });
    }

    // Start Attendance Sesi
    document.getElementById('btn-start-attendance').addEventListener('click', () => {
        const duration = parseInt(document.getElementById('attendance-duration').value);
        const activeSubId = getActiveSubjectId();
        if (activeSubId) {
            window.AppState.startAttendanceSession(activeSubId, duration);
            refreshPresensiTab();
            refreshOverviewTab();
        }
    });

    // Close Sesi
    document.getElementById('btn-stop-attendance').addEventListener('click', () => {
        const session = window.AppState.getAttendanceSession();
        if (session) {
            // Expire it immediately in code
            const expiredSession = {
                subjectId: session.subjectId,
                code: null,
                expiresAt: null,
                active: false,
                durationMinutes: session.durationMinutes
            };
            localStorage.setItem('edu_attendance_session', JSON.stringify(expiredSession));
            const dateStr = new Date().toISOString().split('T')[0];
            window.AppState.finalizeAttendance(session.subjectId, dateStr); // mark remaining as alfa
            refreshPresensiTab();
            refreshOverviewTab();
        }
    });

    // --- MAPEL TAB LOGIC (Read-only, dikelola Super Admin) ---
    function refreshMapelTab() {
        // Filter hanya mapel yang diampu oleh guru yang sedang login
        const subjects = window.AppState.getSubjects().filter(s => s.teacherUsername === currentUser.username);
        const classes = window.AppState.getClasses();
        const tableBody = document.getElementById('mapel-table-body');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (subjects.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">Belum ada mata pelajaran yang diampu. Hubungi Super Admin untuk pengaturan.</td></tr>`;
        } else {
            subjects.forEach(sub => {
                // Resolusi nama kelas dari classIds
                const classNames = (sub.classIds || []).map(cid => {
                    const c = classes.find(x => x.id === cid);
                    return c ? c.name : null;
                }).filter(x => x).join(', ') || '<span style="color:var(--warning)">Belum diplot ke kelas</span>';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight:600;">${escapeHTML(sub.name)}</td>
                    <td>${escapeHTML(sub.schedule)}</td>
                    <td><div style="font-size:12px; line-height:1.4;">${classNames}</div></td>
                    <td><span class="badge badge-info">${escapeHTML(sub.joinCode)}</span></td>
                `;
                tableBody.appendChild(tr);
            });
        }
    }

    // CRUD mapel dikelola oleh Super Admin (admin.html)
    // Tidak ada modal CRUD Mapel di sini

    // --- MATERI TAB LOGIC ---
    function refreshMateriTab() {
        const activeSubId = getActiveSubjectId();
        const materialsList = document.getElementById('teacher-materials-list');
        materialsList.innerHTML = '';

        if (!activeSubId) {
            materialsList.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px 0;">Mata pelajaran belum dipilih.</div>`;
            return;
        }

        const materials = window.AppState.getMaterials(activeSubId);

        if (materials.length === 0) {
            materialsList.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px 0;">Belum ada materi pembelajaran terunggah untuk mapel ini.</div>`;
        } else {
            materials.forEach(m => {
                const item = document.createElement('div');
                item.className = 'material-item';
                item.style.padding = '20px';
                
                item.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:8px; width:100%;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div style="display:flex; align-items:center;">
                                <div class="material-icon-wrapper">PDF</div>
                                <div class="material-meta">
                                    <div class="material-title">${escapeHTML(m.title)}</div>
                                    <div class="material-desc">${escapeHTML(m.description)} | ${m.pages.length} Halaman PDF</div>
                                </div>
                            </div>
                            <div>
                                <span style="font-size:12px; color: var(--success); font-weight:600; display:flex; align-items:center; gap:6px;">
                                    <span style="width:6px;height:6px;border-radius:50%;background-color:var(--success);"></span>
                                    Tutor AI Aktif
                                </span>
                            </div>
                        </div>
                        ${m.summary ? `
                        <div style="background: rgba(99, 102, 241, 0.04); border-left: 3px solid var(--accent-primary); padding: 10px 14px; font-size: 13px; border-radius: 6px; color: var(--text-secondary); margin-top: 8px;">
                            <strong style="color: var(--text-primary); display:block; margin-bottom: 2px;">⚡ Ringkasan AI Otomatis:</strong> ${escapeHTML(m.summary)}
                        </div>` : ''}
                    </div>
                `;
                materialsList.appendChild(item);
            });
        }
    }

    // --- UPLOAD MODAL LOGIC ---
    const uploadModal = document.getElementById('upload-modal');
    const openModalBtn = document.getElementById('btn-open-upload-modal');
    const closeModalBtn = document.getElementById('btn-close-upload-modal');
    const cancelModalBtn = document.getElementById('btn-cancel-upload');
    const materialForm = document.getElementById('material-form');
    const pagesContainer = document.getElementById('pages-container');
    const addPageBtn = document.getElementById('btn-add-page');

    // PDF upload simulator click
    const mockPdfUpload = document.getElementById('mock-pdf-upload');
    const pdfFileInput = document.getElementById('pdf-file-input');
    const uploadFilenameDisplay = document.getElementById('upload-filename-display');

    mockPdfUpload.addEventListener('click', () => {
        pdfFileInput.click();
    });

    pdfFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            uploadFilenameDisplay.textContent = `File Terpilih: ${e.target.files[0].name}`;
            uploadFilenameDisplay.style.color = 'var(--success)';
        }
    });

    openModalBtn.addEventListener('click', () => {
        const activeSubId = getActiveSubjectId();
        if (!activeSubId) {
            alert('Harap pilih mata pelajaran aktif terlebih dahulu!');
            return;
        }

        uploadModal.classList.add('active');
        // Reset form
        materialForm.reset();
        document.getElementById('material-target-subject').value = getActiveSubjectName();
        uploadFilenameDisplay.textContent = 'Pilih file PDF Anda atau drag & drop di sini';
        uploadFilenameDisplay.style.color = '';
        pagesContainer.innerHTML = '';
        // Add one initial page field
        addPageField(1);
    });

    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    function closeModal() {
        uploadModal.classList.remove('active');
    }

    function addPageField(pageNum, defaultText = '') {
        const row = document.createElement('div');
        row.className = 'page-input-row';
        row.style.border = '1px solid var(--glass-border)';
        row.style.padding = '12px';
        row.style.borderRadius = 'var(--radius-sm)';
        row.style.position = 'relative';
        row.style.marginBottom = '6px';
        row.innerHTML = `
            <div style="font-size:12px; font-weight:600; margin-bottom: 6px; display:flex; justify-content:space-between;">
                <span>Halaman ${pageNum}</span>
                ${pageNum > 1 ? `<span class="remove-page" style="color:var(--danger); cursor:pointer; font-weight:normal;">Hapus</span>` : ''}
            </div>
            <textarea class="input-field page-text" style="height:80px; font-size:13px; resize:none;" placeholder="Tuliskan isi teks materi pada halaman ini. AI Tutor akan mempelajari bagian teks ini untuk menjawab pertanyaan siswa..." required>${escapeHTML(defaultText)}</textarea>
        `;
        pagesContainer.appendChild(row);

        // Bind remove event
        if (pageNum > 1) {
            row.querySelector('.remove-page').addEventListener('click', () => {
                row.remove();
                reorderPages();
            });
        }
    }

    addPageBtn.addEventListener('click', () => {
        const pageCount = pagesContainer.querySelectorAll('.page-input-row').length;
        addPageField(pageCount + 1);
    });

    function reorderPages() {
        const rows = pagesContainer.querySelectorAll('.page-input-row');
        rows.forEach((row, idx) => {
            const pageNum = idx + 1;
            const span = row.querySelector('span');
            if (span) span.textContent = `Halaman ${pageNum}`;
        });
    }

    // Template Button Pythagoras click
    document.getElementById('btn-quick-template').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('material-title').value = 'Teorema Pythagoras';
        document.getElementById('material-desc').value = 'Mempelajari hubungan panjang sisi-sisi pada segitiga siku-siku serta Tripel Pythagoras.';
        uploadFilenameDisplay.textContent = 'File Terpilih: teorema_pythagoras_VIII.pdf';
        uploadFilenameDisplay.style.color = 'var(--success)';
        
        pagesContainer.innerHTML = '';
        addPageField(1, 'Teorema Pythagoras menyatakan bahwa pada setiap segitiga siku-siku, kuadrat panjang sisi miring (hipotenusa) sama dengan jumlah kuadrat panjang sisi-sisi siku-sikunya. Sisi miring selalu terletak di depan sudut siku-siku (90 derajat) dan merupakan sisi terpanjang. Rumus umumnya: a^2 + b^2 = c^2, di mana c adalah sisi miring, sedangkan a and b adalah sisi tegak segitiga siku-siku tersebut.');
        addPageField(2, 'Mari kita coba menghitung panjang sisi segitiga siku-siku. Jika panjang sisi tegak a = 3 cm dan b = 4 cm, berapakah sisi miring c? \n\nJawab: c^2 = a^2 + b^2 \nc^2 = 3^2 + 4^2 \nc^2 = 9 + 16 = 25 \nc = akar(25) = 5 cm. \n\nHimpunan tiga bilangan bulat positif yang memenuhi teorema Pythagoras disebut Tripel Pythagoras, contohnya: (3, 4, 5), (5, 12, 13), dan (8, 15, 17).');
    });

    // Form Submit
    materialForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const activeSubId = getActiveSubjectId();
        if (!activeSubId) return;

        const title = document.getElementById('material-title').value.trim();
        const desc = document.getElementById('material-desc').value.trim();
        const textareas = pagesContainer.querySelectorAll('.page-text');
        
        const pages = [];
        textareas.forEach((ta, idx) => {
            pages.push({
                pageNumber: idx + 1,
                title: `${title} - Bagian ${idx + 1}`,
                content: ta.value.trim()
            });
        });

        // Add to state
        window.AppState.addMaterial(activeSubId, title, desc, pages);

        closeModal();
        
        // Refresh materials list and overview statistics
        refreshMateriTab();
        refreshOverviewTab();
        
        // Auto go to materials tab if they uploaded from somewhere else
        document.querySelector('[data-tab=materi]').click();
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
