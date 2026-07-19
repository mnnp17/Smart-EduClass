// siswa.js - Logic for Student Dashboard

document.addEventListener('DOMContentLoaded', () => {
    // Current student info
    const currentUser = window.AppState.getCurrentUser();
    if (currentUser) {
        document.getElementById('welcome-student').textContent = `Halo, ${currentUser.name}! Semangat belajar hari ini!`;
    }

    // Sidebar Toggle
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (btnToggleSidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
            // Toggle icon direction
            if (sidebar.classList.contains('collapsed')) {
                btnToggleSidebar.innerHTML = '<svg viewBox="0 0 24 24" style="width: 18px; height: 18px;"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>';
            } else {
                btnToggleSidebar.innerHTML = '<svg viewBox="0 0 24 24" style="width: 18px; height: 18px;"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg>';
            }
        });
    }

    // Set Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('id-ID', options);

    // Helper to get subjects for this student
    function getMySubjects() {
        const student = window.AppState.getStudents().find(s => s.username === currentUser.username);
        const myClassId = student ? student.classId : null;
        return window.AppState.getSubjects().filter(sub => sub.classIds && sub.classIds.includes(myClassId));
    }

    // Active Study State
    let activeSubjectId = null;
    let activeMaterial = null;
    let activePageIdx = 0; // 0-indexed page tracker
    let activeQuiz = null;

    // Tab Switching
    const menuItems = document.querySelectorAll('.sidebar .menu-item, .bottom-nav-item');
    const tabPanels = document.querySelectorAll('.main-content .tab-panel');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabName = item.getAttribute('data-tab');
            
            menuItems.forEach(i => i.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            
            // Activate both sidebar and bottom nav for the clicked tab
            document.querySelectorAll(`.menu-item[data-tab="${tabName}"], .bottom-nav-item[data-tab="${tabName}"]`).forEach(el => el.classList.add('active'));
            
            const targetPanel = document.getElementById(`tab-${tabName}`);
            if (targetPanel) targetPanel.classList.add('active');
            
            // Refresh content based on tab
            if (tabName === 'overview') {
                refreshOverviewTab();
            } else if (tabName === 'kelas') {
                document.getElementById('kelas-list-view').style.display = 'block';
                document.getElementById('subject-detail-view').style.display = 'none';
                refreshKelasTab();
            } else if (tabName === 'belajar') {
                refreshBelajarTab();
            }
        });
    });

    // --- ALERT & ATTENDANCE AUTO MONITOR ---
    function getActiveSessionSubjectName() {
        const session = window.AppState.getAttendanceSession();
        if (!session || !session.active) return null;
        const subjects = getMySubjects();
        const sub = subjects.find(s => s.id === session.subjectId);
        return sub ? sub.name : 'Mata Pelajaran';
    }

    function checkActiveAttendanceSession() {
        const session = window.AppState.getAttendanceSession();
        const dateStr = new Date().toISOString().split('T')[0];
        const records = session && session.active
            ? window.AppState.getAttendanceRecords(session.subjectId, dateStr)
            : [];
        const myRecord = records.find(r => r.username === currentUser.username);
        const banner = document.getElementById('active-presensi-banner');
        const bannerText = document.getElementById('banner-subject-text');

        if (session && session.active && (!myRecord || myRecord.status === 'Belum Presensi')) {
            banner.style.display = 'flex';
            const subjectName = getActiveSessionSubjectName();
            if (bannerText) {
                bannerText.textContent = `Sesi presensi "${subjectName}" sedang berlangsung! Masukkan kode untuk tercatat hadir.`;
            }
        } else {
            banner.style.display = 'none';
        }
    }

    document.getElementById('btn-banner-presensi').addEventListener('click', () => {
        // Presensi tab has been removed — redirect user to Kelas tab instead
        const kelasMenuItem = document.querySelector('.menu-item[data-tab="kelas"]');
        if (kelasMenuItem) kelasMenuItem.click();
    });

    // Check attendance every 4 seconds in the background
    setInterval(checkActiveAttendanceSession, 4000);

    // --- OVERVIEW TAB LOGIC ---
    function refreshOverviewTab() {
        checkActiveAttendanceSession();

        const _student = window.AppState.getStudents().find(s => s.username === currentUser.username);
        const classDetails = window.AppState.getClasses().find(c => c.id === _student?.classId) || {name: 'Belum Punya Kelas'};
        const subjects = getMySubjects();

        // Update total mapel
        document.getElementById('stat-total-mapel').textContent = subjects.length;
        document.getElementById('student-class-name').textContent = classDetails.name;

        // Calculate Total Hadir and Bolos
        let totalHadir = 0;
        let totalBolos = 0;
        const allRecords = JSON.parse(localStorage.getItem('edu_attendance_records')) || [];
        allRecords.forEach(r => {
            if (r.username === currentUser.username) {
                if (r.status === 'Hadir') totalHadir++;
                if (r.status === 'Alfa' || r.status === 'Belum Presensi') totalBolos++;
            }
        });

        document.getElementById('stat-total-hadir').textContent = totalHadir;
        document.getElementById('stat-total-bolos').textContent = totalBolos;

        renderTasks();
        renderSchedule();
        checkNewMaterialAlert();

        // Render latest materials (all subjects combined)
        const materials = window.AppState.getMaterials();
        const overviewMatList = document.getElementById('overview-materials-list');
        overviewMatList.innerHTML = '';

        if (materials.length === 0) {
            overviewMatList.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size:13px; padding: 20px 0;">Belum ada materi pembelajaran.</div>`;
        } else {
            materials.slice(0, 3).forEach(m => {
                const subInfo = subjects.find(s => s.id === m.subjectId);
                const div = document.createElement('div');
                div.className = 'material-item';
                div.innerHTML = `
                    <div style="display:flex; align-items:center;">
                        <div class="material-icon-wrapper">PDF</div>
                        <div class="material-meta">
                            <div class="material-title">${escapeHTML(m.title)}</div>
                            <div class="material-desc">${subInfo ? escapeHTML(subInfo.name) : ''} — ${escapeHTML(m.description)}</div>
                        </div>
                    </div>
                    <button class="btn-action-solid learn-btn" data-id="${m.id}" style="font-size:12px; padding:6px 12px;">Mulai Belajar</button>
                `;
                overviewMatList.appendChild(div);
            });

            // Bind start learning shortcut button click
            overviewMatList.querySelectorAll('.learn-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const materialId = e.target.getAttribute('data-id');
                    const targetMat = materials.find(m => m.id === materialId);
                    if (targetMat) {
                        activeMaterial = targetMat;
                        activePageIdx = 0;
                        
                        // Switch directly to learning tab
                        const learnTab = document.getElementById('sidebar-tab-belajar');
                        learnTab.click();
                    }
                });
            });
        }
    }

    const mockTasks = [
        { id: 1, title: 'Tugas Latihan Aljabar Dasar', subject: 'Matematika', deadline: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(), status: 'Belum Selesai' },
        { id: 2, title: 'Resume Sistem Tata Surya', subject: 'IPA', deadline: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(), status: 'Belum Selesai' }
    ];

    function renderTasks() {
        const tasksList = document.getElementById('active-tasks-list');
        if (!tasksList) return;
        tasksList.innerHTML = '';
        
        mockTasks.forEach(task => {
            const timeDiff = new Date(task.deadline).getTime() - Date.now();
            const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
            const isWarning = hoursLeft < 24;
            const timerColor = isWarning ? 'var(--danger)' : 'var(--success)';
            
            const div = document.createElement('div');
            div.className = 'glass-card';
            div.style.padding = '16px';
            div.style.borderLeft = `3px solid ${timerColor}`;
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-weight:600; font-size:14px;">${escapeHTML(task.title)}</div>
                        <div style="font-size:12px; color:var(--text-secondary);">${escapeHTML(task.subject)}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:11px; font-weight:600; padding:4px 8px; border-radius:12px; background:rgba(255,255,255,0.05); color:${timerColor}; border:1px solid ${timerColor};">
                            Sisa: ${hoursLeft} Jam
                        </div>
                    </div>
                </div>
            `;
            tasksList.appendChild(div);
        });
    }

    const mockSchedule = [
        { day: 1, name: 'Senin', mapel: 'Matematika (07:00), Bahasa Indonesia (09:00)' },
        { day: 2, name: 'Selasa', mapel: 'IPA (07:00), IPS (09:00)' },
        { day: 3, name: 'Rabu', mapel: 'Bahasa Inggris (07:00), Seni Budaya (09:00)' },
        { day: 4, name: 'Kamis', mapel: 'Matematika (07:00), PJOK (09:00)' },
        { day: 5, name: 'Jumat', mapel: 'Pendidikan Agama (07:00), PPKn (09:00)' },
    ];

    function renderSchedule() {
        const scheduleGrid = document.getElementById('weekly-schedule-grid');
        if (!scheduleGrid) return;
        scheduleGrid.innerHTML = '';
        
        const currentDay = new Date().getDay(); // 0 is Sunday, 1 is Monday...

        mockSchedule.forEach(sch => {
            const isToday = currentDay === sch.day;
            const bgStyle = isToday ? 'background: rgba(99, 102, 241, 0.1); border-color: var(--accent-primary);' : '';
            const textColor = isToday ? 'color: var(--accent-primary); font-weight: 700;' : 'color: var(--text-primary);';

            const div = document.createElement('div');
            div.className = 'glass-card';
            div.style.cssText = `padding: 12px 16px; display: flex; align-items: center; gap: 16px; ${bgStyle}`;
            div.innerHTML = `
                <div style="width: 60px; font-size: 14px; ${textColor}">${sch.name}</div>
                <div style="font-size: 13px; color: var(--text-secondary); flex-grow: 1;">${sch.mapel}</div>
                ${isToday ? '<div style="font-size:10px; padding:2px 8px; border-radius:8px; background:var(--accent-primary); color:white;">Hari Ini</div>' : ''}
            `;
            scheduleGrid.appendChild(div);
        });
    }

    function checkNewMaterialAlert() {
        const materials = window.AppState.getMaterials();
        const subjects = getMySubjects();
        
        if (materials.length > 0) {
            const latestMat = materials[materials.length - 1];
            const subInfo = subjects.find(s => s.id === latestMat.subjectId);
            
            if (subInfo) {
                const banner = document.getElementById('new-material-banner');
                const textEl = document.getElementById('new-material-text');
                
                const allUsers = window.AppState.getUsers();
                const teacherUser = allUsers.find(u => u.username === subInfo.teacherUsername);
                const teacherName = teacherUser ? teacherUser.name : subInfo.teacherUsername;

                textEl.textContent = `Guru ${teacherName} baru saja mengunggah Modul ${latestMat.title} pada mata pelajaran ${subInfo.name}.`;
                banner.style.display = 'flex';

                document.getElementById('btn-banner-buka-materi').onclick = () => {
                    activeMaterial = latestMat;
                    activePageIdx = 0;
                    
                    // Mark as viewed if clicked
                    const viewedStorageKey = `edu_viewed_mat_${currentUser.username}`;
                    let viewedMats = JSON.parse(localStorage.getItem(viewedStorageKey)) || [];
                    if (!viewedMats.includes(latestMat.id)) {
                        viewedMats.push(latestMat.id);
                        localStorage.setItem(viewedStorageKey, JSON.stringify(viewedMats));
                    }
                    
                    document.getElementById('sidebar-tab-belajar').click();
                };
            }
        }
    }

    document.getElementById('btn-start-learning-shortcut').addEventListener('click', () => {
        document.getElementById('sidebar-tab-belajar').click();
    });

    // --- KELAS TAB LOGIC ---
    function refreshKelasTab() {
        const _student = window.AppState.getStudents().find(s => s.username === currentUser.username);
        const classDetails = window.AppState.getClasses().find(c => c.id === _student?.classId) || {name: 'Belum Punya Kelas'};
        const subjects = getMySubjects();
        const allUsers = window.AppState.getUsers();

        // Update class label
        document.getElementById('kelas-class-label').textContent = classDetails.name;

        // Fill subjects table
        const mapelTable = document.getElementById('student-mapel-table');
        mapelTable.innerHTML = '';

        if (subjects.length === 0) {
            mapelTable.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:16px;">Belum ada mata pelajaran. Hubungi Super Admin.</td></tr>`;
        } else {
            subjects.forEach(sub => {
                // Resolve nama guru dari teacherUsername
                const teacherUser = allUsers.find(u => u.username === sub.teacherUsername);
                const teacherName = teacherUser ? teacherUser.name : (sub.teacherUsername || '-');

                // Hitung Kehadiran Mapel Ini
                const allRecords = JSON.parse(localStorage.getItem('edu_attendance_records')) || [];
                const subRecords = allRecords.filter(r => r.subjectId === sub.id && r.username === currentUser.username);
                const uniqueDates = [...new Set(allRecords.filter(r => r.subjectId === sub.id).map(r => r.date))];
                const totalSesi = uniqueDates.length;
                let hadirCount = 0;
                subRecords.forEach(r => {
                    if (r.status === 'Hadir') hadirCount++;
                });

                let percentage = 100;
                if (totalSesi > 0) {
                    percentage = Math.round((hadirCount / totalSesi) * 100);
                }

                let badgeClass = 'badge-success';
                if (percentage < 75) { badgeClass = 'badge-danger'; }
                else if (percentage < 85) { badgeClass = 'badge-warning'; }

                const tr = document.createElement('tr');
                tr.className = 'subject-row-clickable';
                tr.innerHTML = `
                    <td style="font-weight:600;">${escapeHTML(sub.name)}</td>
                    <td style="color:var(--text-secondary);">${escapeHTML(teacherName)}</td>
                    <td>${escapeHTML(sub.schedule)}</td>
                    <td><span class="badge ${badgeClass}">${percentage}%</span></td>
                `;
                
                tr.addEventListener('click', () => {
                    showSubjectDetail(sub, teacherName, percentage);
                });

                mapelTable.appendChild(tr);
            });
        }
        
        // Members list
        const membersGrid = document.getElementById('student-members-list-grid');
        membersGrid.innerHTML = '';

        // Add Teacher(s) from subjects — resolve nama dari teacherUsername
        const addedTeachers = new Set();
        subjects.forEach(sub => {
            if (sub.teacherUsername && !addedTeachers.has(sub.teacherUsername)) {
                addedTeachers.add(sub.teacherUsername);
                const teacherUser = allUsers.find(u => u.username === sub.teacherUsername);
                const teacherName = teacherUser ? teacherUser.name : sub.teacherUsername;

                const teacherCard = document.createElement('div');
                teacherCard.className = 'glass-card member-card';
                teacherCard.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                const initials = teacherName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                teacherCard.innerHTML = `
                    <div class="avatar" style="background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary-hover) 100%);">${initials}</div>
                    <div>
                        <div style="font-weight: 700;">${escapeHTML(teacherName)}</div>
                        <div style="font-size: 11px; color: var(--accent-primary); font-weight: 600;">Guru ${escapeHTML(sub.name)}</div>
                    </div>
                `;
                membersGrid.appendChild(teacherCard);
            }
        });

        // Add Students — hanya teman satu kelas
        const classmates = window.AppState.getStudents().filter(s => s.classId === _student?.classId);
        classmates.forEach(s => {
            const isMe = s.username === currentUser.username;
            const card = document.createElement('div');
            card.className = 'glass-card member-card';
            if (isMe) card.style.borderColor = 'rgba(168, 85, 247, 0.2)';
            
            const initials = s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            card.innerHTML = `
                <div class="avatar" style="background: #272a3d;">${initials}</div>
                <div>
                    <div style="font-weight: 600;">${escapeHTML(s.name)} ${isMe ? '<span style="font-size:11px;color:var(--accent-secondary);font-weight:bold;">(Saya)</span>' : ''}</div>
                    <div style="font-size: 11px; color: var(--text-secondary);">Siswa Kelas ${escapeHTML(classDetails.name)}</div>
                </div>
            `;
            membersGrid.appendChild(card);
        });
    }

    // Show detail view for a subject (called when clicking a subject row in Kelas tab)
    function showSubjectDetail(sub, teacherName, percentage) {
        document.getElementById('kelas-list-view').style.display = 'none';
        document.getElementById('subject-detail-view').style.display = 'block';

        document.getElementById('detail-subject-title').textContent = sub.name;
        document.getElementById('detail-subject-teacher').textContent = teacherName;
        document.getElementById('detail-subject-schedule').textContent = sub.schedule;

        // Attendance history for this subject
        const allRecords = JSON.parse(localStorage.getItem('edu_attendance_records')) || [];
        const subRecords = allRecords
            .filter(r => r.subjectId === sub.id && r.username === currentUser.username)
            .sort((a, b) => a.date.localeCompare(b.date));

        const histBody = document.getElementById('detail-attendance-history');
        histBody.innerHTML = '';
        if (subRecords.length === 0) {
            histBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">Belum ada riwayat kehadiran.</td></tr>`;
        } else {
            subRecords.forEach((r, idx) => {
                let badgeClass = 'badge-warning';
                if (r.status === 'Hadir') badgeClass = 'badge-success';
                else if (r.status === 'Sakit' || r.status === 'Izin') badgeClass = 'badge-info';
                else if (r.status === 'Alfa') badgeClass = 'badge-danger';
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>Pertemuan ${idx + 1}</td>
                    <td>${r.date}</td>
                    <td><span class="badge ${badgeClass}">${r.status}</span></td>
                `;
                histBody.appendChild(tr);
            });
        }

        // Materials for this subject
        const materials = window.AppState.getMaterials(sub.id);
        const detailMatList = document.getElementById('detail-materials-list');
        detailMatList.innerHTML = '';
        if (materials.length === 0) {
            detailMatList.innerHTML = `<div style="color:var(--text-muted); font-size:13px;">Belum ada materi untuk mapel ini.</div>`;
        } else {
            materials.forEach(m => {
                const item = document.createElement('div');
                item.className = 'material-item';
                item.style.cursor = 'pointer';
                item.innerHTML = `
                    <div style="display:flex;align-items:center;">
                        <div class="material-icon-wrapper">PDF</div>
                        <div class="material-meta">
                            <div class="material-title">${escapeHTML(m.title)}</div>
                            <div class="material-desc">${m.pages.length} Halaman</div>
                        </div>
                    </div>
                    <button class="btn-action-solid" style="font-size:12px;padding:6px 12px;">Belajar</button>
                `;
                item.querySelector('button').addEventListener('click', () => {
                    activeMaterial = m;
                    activePageIdx = 0;
                    document.getElementById('sidebar-tab-belajar').click();
                });
                detailMatList.appendChild(item);
            });
        }
    }

    document.getElementById('btn-back-to-kelas').addEventListener('click', () => {
        document.getElementById('kelas-list-view').style.display = 'block';
        document.getElementById('subject-detail-view').style.display = 'none';
        refreshKelasTab();
    });

    // --- BELAJAR (STUDY) TAB LOGIC ---
    function refreshBelajarTab() {
        const gwSubject = document.getElementById('subject-gateway');
        const gwMaterial = document.getElementById('material-gateway');
        const activeStudy = document.getElementById('active-study-view');

        if (activeMaterial) {
            // Phase 2
            gwSubject.style.display = 'none';
            gwMaterial.style.display = 'none';
            activeStudy.style.display = 'grid';
            
            // Switch to summary mode by default
            const mobileToggle = document.getElementById('study-mobile-toggle');
            if (mobileToggle) {
                const btns = mobileToggle.querySelectorAll('.mobile-panel-toggle-btn');
                if (btns.length > 0) btns[0].click();
            }
            const tabSummary = document.getElementById('tab-mode-summary');
            if(tabSummary) tabSummary.click();

            loadActiveMaterial();
        } else if (activeSubjectId) {
            // Phase 1B
            gwSubject.style.display = 'none';
            activeStudy.style.display = 'none';
            gwMaterial.style.display = 'block';
            renderMaterialGateway();
        } else {
            // Phase 1A
            gwMaterial.style.display = 'none';
            activeStudy.style.display = 'none';
            gwSubject.style.display = 'block';
            renderSubjectGateway();
        }
    }

    function renderSubjectGateway() {
        const subjects = getMySubjects();
        const grid = document.getElementById('gateway-subject-grid');
        grid.innerHTML = '';
        
        if (subjects.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0;">Belum ada mata pelajaran. Hubungi admin.</div>`;
            return;
        }

        const allMaterials = window.AppState.getMaterials();

        subjects.forEach(sub => {
            const teacherUser = window.AppState.getUsers().find(u => u.username === sub.teacherUsername);
            const teacherName = teacherUser ? teacherUser.name : (sub.teacherUsername || '-');
            const modCount = allMaterials.filter(m => m.subjectId === sub.id).length;

            const card = document.createElement('div');
            card.className = 'subject-card';
            card.innerHTML = `
                <div class="subject-card-icon">📘</div>
                <div>
                    <div class="subject-card-name">${escapeHTML(sub.name)}</div>
                    <div class="subject-card-teacher">👨‍🏫 ${escapeHTML(teacherName)}</div>
                </div>
                <div class="subject-card-footer">
                    <span class="subject-card-modules">${modCount} Materi Tersedia</span>
                    <div class="subject-card-arrow">
                        <svg viewBox="0 0 24 24"><path d="M5 13h11.17l-4.88 4.88c-.39.39-.39 1.03 0 1.42.39.39 1.02.39 1.41 0l6.59-6.59c.39-.39.39-1.02 0-1.41l-6.58-6.6a.996.996 0 1 0-1.41 1.41l4.88 4.88H5c-.55 0-1 .45-1 1s.45 1 1 1z"/></svg>
                    </div>
                </div>
            `;
            card.addEventListener('click', () => {
                activeSubjectId = sub.id;
                refreshBelajarTab();
            });
            grid.appendChild(card);
        });
    }

    function renderMaterialGateway() {
        const sub = getMySubjects().find(s => s.id === activeSubjectId);
        if (sub) {
            document.getElementById('gateway-material-title').textContent = `Materi: ${sub.name}`;
        }
        
        const materials = window.AppState.getMaterials(activeSubjectId);
        const list = document.getElementById('gateway-material-list');
        list.innerHTML = '';

        if (materials.length === 0) {
            list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px 0;">Belum ada materi pembelajaran untuk mata pelajaran ini.</div>`;
            return;
        }

        materials.forEach(m => {
            const card = document.createElement('div');
            card.className = 'material-entry-card';
            card.innerHTML = `
                <div class="material-entry-left">
                    <div class="material-entry-icon">PDF</div>
                    <div>
                        <div class="material-entry-title">${escapeHTML(m.title)}</div>
                        <div class="material-entry-meta">
                            <span>${m.pages.length} Halaman</span>
                            <span>•</span>
                            <span>${escapeHTML(m.description || 'Tidak ada deskripsi')}</span>
                        </div>
                    </div>
                </div>
                <div class="subject-card-arrow" style="background: var(--bg-tertiary);">
                    <svg viewBox="0 0 24 24"><path d="M5 13h11.17l-4.88 4.88c-.39.39-.39 1.03 0 1.42.39.39 1.02.39 1.41 0l6.59-6.59c.39-.39.39-1.02 0-1.41l-6.58-6.6a.996.996 0 1 0-1.41 1.41l4.88 4.88H5c-.55 0-1 .45-1 1s.45 1 1 1z"/></svg>
                </div>
            `;
            card.addEventListener('click', () => {
                activeMaterial = m;
                activePageIdx = 0;
                refreshBelajarTab();
            });
            list.appendChild(card);
        });
    }

    document.getElementById('btn-back-to-subjects').addEventListener('click', () => {
        activeSubjectId = null;
        refreshBelajarTab();
    });

    document.getElementById('btn-exit-study-room').addEventListener('click', () => {
        activeMaterial = null;
        activeQuiz = null;
        refreshBelajarTab();
    });

    // Mobile study room toggle logic
    document.querySelectorAll('.mobile-panel-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.mobile-panel-toggle-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            const target = e.currentTarget.getAttribute('data-target');
            const studyRoom = document.getElementById('active-study-view');
            if (target === 'summary') {
                studyRoom.classList.add('show-summary');
                studyRoom.classList.remove('show-chat');
            } else {
                studyRoom.classList.add('show-chat');
                studyRoom.classList.remove('show-summary');
            }
        });
    });

    // Summary mode vs PDF mode logic
    document.getElementById('tab-mode-summary').addEventListener('click', () => {
        document.getElementById('tab-mode-summary').classList.add('active');
        document.getElementById('tab-mode-pdf').classList.remove('active');
        document.getElementById('view-mode-summary').style.display = 'block';
        document.getElementById('view-mode-pdf').style.display = 'none';
    });

    document.getElementById('tab-mode-pdf').addEventListener('click', () => {
        document.getElementById('tab-mode-pdf').classList.add('active');
        document.getElementById('tab-mode-summary').classList.remove('active');
        document.getElementById('view-mode-pdf').style.display = 'block';
        document.getElementById('view-mode-summary').style.display = 'none';
    });

    function loadActiveMaterial() {
        if (!activeMaterial) return;

        // Render Titles
        document.getElementById('study-material-title').textContent = activeMaterial.title;
        
        renderAISummary();
        renderPDFPage();

        // Initialize Chat History
        const chatMessages = document.getElementById('chat-messages-log');
        chatMessages.innerHTML = '';
        addAIMessage(`Halo **${currentUser.name}**! Saya Tutor AI Pintar Anda untuk materi **${escapeHTML(activeMaterial.title)}**.\n\nSaya telah membuatkan rangkuman otomatis di panel kiri. Anda bebas bertanya mengenai topik apa saja, atau gunakan **tombol cepat** di bawah untuk memulai belajar secara interaktif! 🤖📚`);

        // Set context in AI engine
        window.AIEngine.currentContext.materialId = activeMaterial.id;
        window.AIEngine.currentContext.materialTitle = activeMaterial.title;
        window.AIEngine.currentContext.lastPageNumber = activePageIdx + 1;
        window.AIEngine.currentContext.lastTopic = activeMaterial.pages[activePageIdx]?.title || activeMaterial.title;
    }

    function renderAISummary() {
        const bullets = window.AIEngine.generateSummaryBullets(activeMaterial);
        const list = document.getElementById('ai-summary-list');
        list.innerHTML = '';
        
        if (bullets.length === 0) {
            list.innerHTML = '<div style="color:var(--text-muted); font-size:13px;">Tidak ada ringkasan tersedia.</div>';
            return;
        }

        bullets.forEach((b, idx) => {
            const el = document.createElement('div');
            el.className = 'ai-summary-bullet';
            el.innerHTML = `
                <div class="bullet-number">${idx + 1}.</div>
                <div>
                    <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">${escapeHTML(b.title)}</div>
                    <div style="color: var(--text-secondary);">${escapeHTML(b.text)}</div>
                </div>
            `;
            list.appendChild(el);
        });
    }

    function renderPDFPage() {
        if (!activeMaterial || !activeMaterial.pages || activeMaterial.pages.length === 0) return;

        const page = activeMaterial.pages[activePageIdx];
        
        document.getElementById('pdf-embed-title').textContent = page.title;
        document.getElementById('pdf-embed-text').textContent = page.content;
        document.getElementById('pdf-current-page').textContent = page.pageNumber;
        document.getElementById('pdf-total-pages').textContent = activeMaterial.pages.length;
        
        // Update prev/next button limits
        document.getElementById('btn-pdf-prev-page').disabled = activePageIdx === 0;
        document.getElementById('btn-pdf-next-page').disabled = activePageIdx === activeMaterial.pages.length - 1;

        // Update active page number in AI engine context
        window.AIEngine.currentContext.lastPageNumber = page.pageNumber;
        window.AIEngine.currentContext.lastTopic = page.title;
    }

    // PDF Navigation Click handlers
    document.getElementById('btn-pdf-prev-page').addEventListener('click', () => {
        if (activePageIdx > 0) {
            activePageIdx--;
            renderPDFPage();
        }
    });

    document.getElementById('btn-pdf-next-page').addEventListener('click', () => {
        if (activeMaterial && activePageIdx < activeMaterial.pages.length - 1) {
            activePageIdx++;
            renderPDFPage();
        }
    });


    // --- AI CHATBOT LOGIC ---
    const chatInput = document.getElementById('chat-user-input');
    const chatSendBtn = document.getElementById('btn-chat-send');
    const chatLog = document.getElementById('chat-messages-log');

    // Add user message bubble
    function addUserMessage(text) {
        const div = document.createElement('div');
        div.className = 'message-bubble message-user';
        div.innerHTML = escapeHTML(text).replace(/\n/g, '<br>');
        chatLog.appendChild(div);
        scrollChatToBottom();
    }

    // Add bot message bubble
    function addAIMessage(text, source = null, quiz = null) {
        const div = document.createElement('div');
        div.className = 'message-bubble message-ai';
        
        // Replace markdown bold, linebreaks, code quotes
        let htmlContent = parseSimpleMarkdown(text);
        div.innerHTML = htmlContent;

        // If source is provided
        if (source) {
            const srcTag = document.createElement('div');
            srcTag.className = 'source-tag';
            srcTag.textContent = `Sumber: ${source.title}, Hal. ${source.page}`;
            div.appendChild(srcTag);
        }

        // If quiz is provided
        if (quiz) {
            activeQuiz = quiz;
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'quiz-options';
            
            quiz.options.forEach((opt, idx) => {
                const optBtn = document.createElement('button');
                optBtn.className = 'quiz-option-btn';
                optBtn.textContent = opt;
                optBtn.addEventListener('click', () => {
                    handleQuizSelection(idx);
                });
                optionsDiv.appendChild(optBtn);
            });
            div.appendChild(optionsDiv);
        }

        chatLog.appendChild(div);
        scrollChatToBottom();
    }

    function showTypingIndicator() {
        const div = document.createElement('div');
        div.className = 'message-bubble message-ai typing-indicator-container';
        div.style.alignSelf = 'flex-start';
        div.style.background = 'var(--bg-tertiary)';
        div.style.border = '1px solid var(--glass-border)';
        div.innerHTML = `
            <div class="typing-indicator">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        `;
        chatLog.appendChild(div);
        scrollChatToBottom();
        return div;
    }

    function scrollChatToBottom() {
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    // Send chat logic
    function handleSendChat() {
        const text = chatInput.value.trim();
        if (text.length === 0) return;

        // If there's an active quiz, clear it since user typed a custom question
        activeQuiz = null;

        addUserMessage(text);
        chatInput.value = '';

        // Save student question in central state for teacher dashboard view
        if (activeMaterial) {
            window.AppState.addQuestion(currentUser.name, activeMaterial.title, text);
        }

        // Typing indicator simulation
        const indicator = showTypingIndicator();

        setTimeout(() => {
            indicator.remove();
            
            // Get response
            const response = window.AIEngine.getAIResponse(activeMaterial, text);
            addAIMessage(response.text, response.source);

        }, 800);
    }

    chatSendBtn.addEventListener('click', handleSendChat);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleSendChat();
        }
    });

    // Handle Quick Action Buttons click
    document.querySelectorAll('#quick-action-buttons .quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!activeMaterial) return;

            const action = btn.getAttribute('data-action');
            
            // Add click action directly as user dialogue
            let queryText = "";
            let response = null;

            if (action === 'simpler') {
                queryText = "Jelaskan materi halaman ini secara lebih sederhana.";
                addUserMessage(queryText);
                const indicator = showTypingIndicator();
                setTimeout(() => {
                    indicator.remove();
                    response = window.AIEngine.getSimplerExplanation();
                    addAIMessage(response.text, response.source);
                }, 800);
            } 
            else if (action === 'example') {
                queryText = "Tolong berikan contoh soal terkait materi ini.";
                addUserMessage(queryText);
                const indicator = showTypingIndicator();
                setTimeout(() => {
                    indicator.remove();
                    response = window.AIEngine.getExample();
                    addAIMessage(response.text, response.source);
                }, 800);
            } 
            else if (action === 'hint') {
                queryText = "Beri saya petunjuk untuk memahami materi ini.";
                addUserMessage(queryText);
                const indicator = showTypingIndicator();
                setTimeout(() => {
                    indicator.remove();
                    response = window.AIEngine.getHint();
                    addAIMessage(response.text, response.source);
                }, 800);
            } 
            else if (action === 'quiz') {
                queryText = "Uji pemahaman saya dengan satu pertanyaan.";
                addUserMessage(queryText);
                const indicator = showTypingIndicator();
                setTimeout(() => {
                    indicator.remove();
                    response = window.AIEngine.getQuiz();
                    addAIMessage(response.text, response.source, response.quiz);
                }, 800);
            }
            
            // Log quick actions as questions in teacher dashboard too
            window.AppState.addQuestion(currentUser.name, activeMaterial.title, queryText);
        });
    });

    // Handle interactive option selection inside active quiz
    function handleQuizSelection(optionIdx) {
        if (!activeQuiz) return;
        
        const selectedText = activeQuiz.options[optionIdx];
        addUserMessage(`Saya memilih: ${selectedText}`);
        
        const isCorrect = optionIdx === activeQuiz.correctIndex;
        const feedbackText = activeQuiz.explanations[optionIdx];
        const pageNum = window.AIEngine.currentContext.lastPageNumber;

        // Clear active quiz
        activeQuiz = null;

        const indicator = showTypingIndicator();
        setTimeout(() => {
            indicator.remove();
            
            let reply = "";
            if (isCorrect) {
                reply = `🎉 **Jawaban Anda BENAR!** \n\n${feedbackText}`;
            } else {
                reply = `❌ **Jawaban Anda BELUM TEPAT.** \n\n${feedbackText} \n\nCobalah untuk meninjau kembali Halaman ${pageNum} di materi sebelah kiri!`;
            }

            addAIMessage(reply, {
                title: window.AIEngine.currentContext.materialTitle,
                page: pageNum
            });

        }, 800);
    }

    // Helper formatting parser
    function parseSimpleMarkdown(text) {
        let parsed = escapeHTML(text);
        // line breaks
        parsed = parsed.replace(/\n/g, '<br>');
        // Bold double asterisks
        parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Bullet points
        parsed = parsed.replace(/\* (.*?)(<br>|$)/g, '<li>$1</li>');
        // Clean wrapped li lists
        parsed = parsed.replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>');
        parsed = parsed.replace(/<\/ul><br><ul>/g, ''); // stitch broken lists
        return parsed;
    }

    // Helper: Escape HTML
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // In-App Push Notification (Toast)
    function checkToastNotification() {
        const materials = window.AppState.getMaterials();
        if (materials.length === 0) return;
        
        const latestMat = materials[materials.length - 1];
        const viewedStorageKey = `edu_viewed_mat_${currentUser.username}`;
        let viewedMats = JSON.parse(localStorage.getItem(viewedStorageKey)) || [];

        if (!viewedMats.includes(latestMat.id)) {
            // Show toast
            const toastContainer = document.getElementById('toast-container');
            if (!toastContainer) return;
            
            const toast = document.createElement('div');
            toast.className = 'toast-notification';
            toast.innerHTML = `
                <div class="toast-close">&times;</div>
                <div class="toast-title">Materi Baru Tersedia!</div>
                <div class="toast-body">Modul "${escapeHTML(latestMat.title)}" baru saja ditambahkan.</div>
                <button class="btn-action-solid" style="background: var(--accent-secondary); font-size: 11px; padding: 6px; width: 100px;">Buka Materi</button>
            `;
            toastContainer.appendChild(toast);

            toast.querySelector('.toast-close').onclick = () => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            };

            toast.querySelector('.btn-action-solid').onclick = () => {
                toast.remove();
                // Mark as viewed
                viewedMats.push(latestMat.id);
                localStorage.setItem(viewedStorageKey, JSON.stringify(viewedMats));
                
                activeMaterial = latestMat;
                activePageIdx = 0;
                document.getElementById('sidebar-tab-belajar').click();
            };

            // Auto dismiss after 5 seconds
            setTimeout(() => {
                if(document.body.contains(toast)) {
                    toast.classList.add('fade-out');
                    setTimeout(() => toast.remove(), 300);
                }
            }, 5000);
        }
    }

    // Call it once on load
    setTimeout(checkToastNotification, 1000);



    // Initial Load
    refreshOverviewTab();
});
