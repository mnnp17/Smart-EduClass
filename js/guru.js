// guru.js - Logic for Teacher Dashboard

document.addEventListener('DOMContentLoaded', () => {
    // Current teacher info
    const currentUser = window.AppState.getCurrentUser();
    if (currentUser) {
        const hour = new Date().getHours();
        let greeting = 'Selamat Datang';
        let msg = '';
        if (hour >= 4 && hour < 11) { greeting = 'Selamat Pagi'; msg = 'Mari mulai hari dengan energi positif untuk mendidik generasi bangsa.'; }
        else if (hour >= 11 && hour < 15) { greeting = 'Selamat Siang'; msg = 'Tetap semangat mendampingi proses belajar siswa di kelas.'; }
        else if (hour >= 15 && hour < 19) { greeting = 'Selamat Sore'; msg = 'Evaluasi belajar hari ini berjalan dengan sangat baik.'; }
        else { greeting = 'Selamat Malam'; msg = 'Waktu yang tepat untuk meninjau perkembangan akademik siswa.'; }

        document.getElementById('welcome-teacher').textContent = `${greeting}, ${currentUser.name}! ${msg}`;

        // Homeroom badge
        const classes = window.AppState.getClasses();
        const homeroomClass = classes.find(c => c.homeroomTeacherUsername === currentUser.username);
        const badgeContainer = document.getElementById('homeroom-badge-container');
        if (homeroomClass && badgeContainer) {
            badgeContainer.style.display = 'block';
            document.getElementById('homeroom-class-name').textContent = homeroomClass.name;
        }
    }

    // Set Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('id-ID', options);
    
    // Hamburger Toggle
    const btnHamburger = document.getElementById('btn-hamburger');
    if (btnHamburger) {
        btnHamburger.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('collapsed');
            document.querySelector('.main-content').classList.toggle('expanded');
        });
    }

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
    const menuItems = document.querySelectorAll('.sidebar .menu-item, .bottom-nav .bottom-nav-item');
    const tabPanels = document.querySelectorAll('.main-content .tab-panel');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabName = item.getAttribute('data-tab');
            
            menuItems.forEach(i => i.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            
            // Activate both sidebar and bottom nav items matching this tab
            document.querySelectorAll(`.sidebar .menu-item[data-tab="${tabName}"], .bottom-nav .bottom-nav-item[data-tab="${tabName}"]`).forEach(el => {
                el.classList.add('active');
            });
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
            const dContainer = document.getElementById('assignment-deadlines-container');
            if (dContainer) dContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px 0;">Mata pelajaran belum dipilih.</div>`;
            return;
        }

        const activeSub = subjects.find(s => s.id === activeSubId);
        
        // 1. Nearest Schedule Banner
        if (activeSub) {
            document.getElementById('nearest-schedule-subject').textContent = activeSub.name;
            // Smart day detection: compare today's day name with the schedule
            const todayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const todayName = todayNames[new Date().getDay()];
            const scheduleStr = activeSub.schedule || '';
            // Check if today's day name appears in the schedule string
            const isToday = todayNames.some(d => d !== 'Minggu' && scheduleStr.includes(d) && d === todayName);
            const dayLabel = isToday ? 'Hari ini' : (scheduleStr ? `Jadwal ${scheduleStr.split(' ')[0]}` : 'Jadwal Mendatang');
            document.getElementById('nearest-schedule-detail').textContent = `${dayLabel} • ${scheduleStr || '--:--'} • Ruang Kelas Utama`;
            // Update banner label
            const bannerLabel = document.querySelector('.nearest-schedule-banner .banner-label');
            if (bannerLabel) bannerLabel.textContent = isToday ? '📅 Jadwal Mengajar Hari Ini' : '📅 Jadwal Mengajar Mendatang';
            const btnSeeSchedule = document.getElementById('btn-see-full-schedule');
            if (btnSeeSchedule) {
                btnSeeSchedule.onclick = () => {
                    const kelasTabBtn = document.querySelector('.sidebar .menu-item[data-tab=kelas]');
                    if(kelasTabBtn) kelasTabBtn.click();
                };
            }
        }

        // 2. Chart Analytics
        renderOperationalAnalytics();

        // 3. AI Executive Summary
        generateAIExecutiveSummary(activeSub, students);

        // 4. Smart AI Insights (Questions)
        renderSmartAIInsights(activeSubId);

        // 5. Assignment Deadlines Center
        renderAssignmentDeadlines();
    }

    function renderOperationalAnalytics() {
        const ctx = document.getElementById('teacher-analytics-chart');
        if (!ctx) return;
        
        if (window.teacherChart) {
            window.teacherChart.destroy();
        }
        
        window.teacherChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Jurnal', 'Modul', 'Koreksi', 'Kehadiran'],
                datasets: [{
                    label: 'Performa Guru',
                    data: [85, 90, 75, 95], // Dummy metrics
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(99, 102, 241, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: { top: 24, bottom: 24, left: 24, right: 24 }
                },
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255,255,255,0.1)' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        pointLabels: { color: 'var(--text-secondary)', font: { size: 11 }, padding: 8 },
                        ticks: { display: false, max: 100, min: 0 }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    function generateAIExecutiveSummary(subject, allStudents) {
        const textEl = document.getElementById('ai-executive-summary-text');
        if (!textEl) return;
        textEl.innerHTML = `Secara keseluruhan, progres kurikulum Anda untuk <b>${escapeHTML(subject.name)}</b> berada di angka <b>72%</b>. Kelas yang Anda ampu menunjukkan peningkatan keaktifan sebesar 15% pada materi terbaru, namun disarankan memberikan perhatian lebih pada 5 siswa yang konsisten mendapat skor kuis di bawah KKM.`;
    }

    function renderSmartAIInsights(activeSubId) {
        const questionsBody = document.getElementById('recent-questions-body');
        if (!questionsBody) return;
        
        // Mock Smart AI Insights
        const insights = [
            { topic: "Bingung Membedakan Variabel dan Konstanta", count: 12, tag: "kritis", label: "Kritis", colorClass: "kritis" },
            { topic: "Langkah penyamaan penyebut pecahan", count: 8, tag: "bingung", label: "Bingung", colorClass: "bingung" },
            { topic: "Rumus Luas Segitiga", count: 15, tag: "tuntas", label: "Tuntas", colorClass: "tuntas" }
        ];

        questionsBody.innerHTML = '';
        insights.forEach(ins => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:600; font-size:13px;">${escapeHTML(ins.topic)}</td>
                <td style="color:var(--text-secondary);">${ins.count} Siswa</td>
                <td><span class="smart-tag ${ins.colorClass}">${ins.label}</span></td>
                <td><button class="btn-action-outline" style="padding: 4px 8px; font-size: 11px;" onclick="alert('Membuka detail pertanyaan siswa ke Tutor AI untuk topik: ${escapeHTML(ins.topic)}')">Lihat Detail Pertanyaan</button></td>
            `;
            questionsBody.appendChild(tr);
        });
    }

    function renderAssignmentDeadlines() {
        const container = document.getElementById('assignment-deadlines-container');
        if (!container) return;
        
        // Mock Deadlines
        const deadlines = [
            { title: "Tugas Latihan Aljabar Dasar", collected: 25, total: 32, hoursLeft: 4 },
            { title: "Kuis Pilihan Ganda Logika", collected: 10, total: 32, hoursLeft: 24 }
        ];

        container.innerHTML = '';
        deadlines.forEach(d => {
            container.innerHTML += `
                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">${escapeHTML(d.title)}</div>
                        <div style="font-size: 11px; color: var(--text-secondary);">Terkumpul: ${d.collected}/${d.total} Siswa</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 13px; font-weight: 700; color: ${d.hoursLeft <= 12 ? 'var(--danger)' : 'var(--warning)'}; margin-bottom: 2px;">⏰ ${d.hoursLeft} Jam lagi</div>
                        <div style="font-size: 10px; color: var(--text-muted);">Tutup Otomatis</div>
                    </div>
                </div>
            `;
        });
    }

    function refreshKelasTab() {
        // Show grid view, hide detail view
        document.getElementById('kelas-grid-view').style.display = 'block';
        document.getElementById('kelas-detail-view').style.display = 'none';

        const allClasses   = window.AppState.getClasses();
        const allSubjects  = window.AppState.getSubjects().filter(s => s.teacherUsername === currentUser.username);
        const allStudents  = window.AppState.getStudents();
        const grid = document.getElementById('daftar-kelas-grid');
        if (!grid) return;

        // Collect unique class IDs taught by this teacher
        const taughtClassIds = new Set();
        allSubjects.forEach(sub => (sub.classIds || []).forEach(cid => taughtClassIds.add(cid)));

        const taughtClasses = allClasses.filter(c => taughtClassIds.has(c.id));

        grid.innerHTML = '';
        if (taughtClasses.length === 0) {
            grid.innerHTML = '<div style="color:var(--text-muted);">Belum ada kelas yang diampu.</div>';
            return;
        }

        taughtClasses.forEach(cls => {
            const studentsInClass = allStudents.filter(s => s.classId === cls.id);
            const subjectsInClass = allSubjects.filter(s => (s.classIds || []).includes(cls.id));

            const card = document.createElement('div');
            card.className = 'glass-card teacher-class-card clickable-class-card';
            card.innerHTML = `
                <div class="teacher-class-header">
                    <div>
                        <div class="teacher-class-name">Kelas ${escapeHTML(cls.name)}</div>
                        <div class="teacher-class-sub">${subjectsInClass.length} Mata Pelajaran diampu</div>
                    </div>
                    <div style="font-size: 28px;">🏫</div>
                </div>
                <div class="teacher-class-stats">
                    <div class="teacher-class-stat-item">
                        <span class="teacher-class-stat-label">Total Siswa</span>
                        <span class="teacher-class-stat-val">${studentsInClass.length} Siswa</span>
                    </div>
                    <div class="teacher-class-stat-item" style="text-align: right;">
                        <span class="teacher-class-stat-label">Mapel Diampu</span>
                        <span class="teacher-class-stat-val" style="color: var(--accent-primary);">${subjectsInClass.map(s => escapeHTML(s.name)).join(', ') || '-'}</span>
                    </div>
                </div>
                <div class="card-drill-hint">
                    <svg style="width:14px;height:14px;" viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
                    Klik untuk melihat detail kelas
                </div>
            `;
            card.addEventListener('click', () => openClassDetail(cls.id));
            grid.appendChild(card);
        });

        // Wire up back button
        const btnBack = document.getElementById('btn-back-to-kelas');
        if (btnBack) {
            btnBack.onclick = () => {
                document.getElementById('kelas-grid-view').style.display = 'block';
                document.getElementById('kelas-detail-view').style.display = 'none';
            };
        }
    }

    function openClassDetail(classId) {
        const allClasses  = window.AppState.getClasses();
        const allSubjects = window.AppState.getSubjects().filter(s => s.teacherUsername === currentUser.username);
        const allStudents = window.AppState.getStudents();

        const cls = allClasses.find(c => c.id === classId);
        if (!cls) return;

        // Switch views
        document.getElementById('kelas-grid-view').style.display = 'none';
        document.getElementById('kelas-detail-view').style.display = 'block';

        // Set header
        document.getElementById('kelas-detail-title').textContent = `Kelas ${cls.name}`;
        const studentsInClass = allStudents.filter(s => s.classId === cls.id);
        document.getElementById('kelas-detail-sub').textContent =
            `${studentsInClass.length} siswa terdaftar • ${allSubjects.filter(s => (s.classIds||[]).includes(classId)).length} mata pelajaran`;

        // Sub-tab switching
        document.querySelectorAll('.kelas-sub-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.kelas-sub-tab').forEach(b => {
                    b.classList.remove('active');
                    b.style.borderBottom = '3px solid transparent';
                    b.style.color = 'var(--text-secondary)';
                });
                btn.classList.add('active');
                btn.style.borderBottom = '3px solid var(--accent-primary)';
                btn.style.color = 'var(--text-primary)';

                document.querySelectorAll('.kelas-subtab-panel').forEach(p => p.style.display = 'none');
                const target = document.getElementById(`kelas-subtab-${btn.getAttribute('data-subtab')}`);
                if (target) target.style.display = 'block';
            });
        });
        // Reset to first sub-tab
        document.querySelectorAll('.kelas-sub-tab').forEach((b, i) => {
            b.classList.toggle('active', i === 0);
            b.style.borderBottom = i === 0 ? '3px solid var(--accent-primary)' : '3px solid transparent';
            b.style.color = i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)';
        });
        document.querySelectorAll('.kelas-subtab-panel').forEach((p, i) => p.style.display = i === 0 ? 'block' : 'none');

        // Render content
        renderClassSubjects(classId, allSubjects);
        renderClassStudents(classId, allStudents, allClasses, cls.name);

        // Wire + Tambah Mapel button
        const btnAddMapel = document.getElementById('btn-add-mapel-in-class');
        if (btnAddMapel) {
            btnAddMapel.onclick = () => {
                alert(`Fitur tambah Mata Pelajaran baru untuk Kelas ${cls.name} akan segera tersedia. Hubungi Super Admin untuk saat ini.`);
            };
        }
    }

    function renderClassSubjects(classId, allSubjects) {
        const container = document.getElementById('class-subjects-grid');
        if (!container) return;

        const subjects = allSubjects.filter(s => (s.classIds || []).includes(classId));
        container.innerHTML = '';

        if (subjects.length === 0) {
            container.innerHTML = '<div style="color:var(--text-muted); padding: 20px 0;">Belum ada mata pelajaran di kelas ini.</div>';
            return;
        }

        const icons = ['📐', '📖', '🔬', '🌍', '🎨', '💻', '🏃'];
        subjects.forEach((sub, i) => {
            const card = document.createElement('div');
            card.className = 'class-subject-card';
            card.innerHTML = `
                <div style="display: flex; align-items: center; gap: 14px;">
                    <div class="subject-icon">${icons[i % icons.length]}</div>
                    <div>
                        <div style="font-weight: 700; font-size: 14px; margin-bottom: 2px;">${escapeHTML(sub.name)}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">${escapeHTML(sub.schedule)}</div>
                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Kode: <b style="color:var(--accent-primary);">${escapeHTML(sub.joinCode)}</b></div>
                    </div>
                </div>
                <button class="btn-action-outline" style="padding: 6px 12px; font-size: 11px; white-space: nowrap;">Kelola Modul</button>
            `;
            card.querySelector('button').addEventListener('click', () => {
                document.querySelector('[data-tab=materi]').click();
            });
            container.appendChild(card);
        });
    }

    function renderClassStudents(classId, allStudents, allClasses, className) {
        const tbody = document.getElementById('class-students-tbody');
        if (!tbody) return;

        const students = allStudents.filter(s => s.classId === classId);
        tbody.innerHTML = '';

        if (students.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:20px;">Belum ada siswa di kelas ini.</td></tr>`;
            return;
        }

        students.forEach((s, idx) => {
            const tr = document.createElement('tr');
            tr.className = 'student-row-clickable';
            tr.innerHTML = `
                <td style="color:var(--text-muted);">${idx + 1}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="avatar" style="width:34px; height:34px; font-size:13px; flex-shrink:0;">${s.name.charAt(0)}</div>
                        <span style="font-weight:600;">${escapeHTML(s.name)}</span>
                    </div>
                </td>
                <td><span class="badge badge-info">${escapeHTML(s.username)}</span></td>
                <td><span style="background:rgba(16,185,129,0.15); color:var(--success); padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600;">Aktif</span></td>
            `;
            tr.addEventListener('click', () => {});
            tbody.appendChild(tr);
        });
    }

    // old student table (kept for other refs)
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
