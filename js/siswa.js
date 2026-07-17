// siswa.js - Logic for Student Dashboard

document.addEventListener('DOMContentLoaded', () => {
    // Current student info
    const currentUser = window.AppState.getCurrentUser();
    if (currentUser) {
        document.getElementById('welcome-student').textContent = `Halo, ${currentUser.name}`;
    }

    // Set Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('id-ID', options);

    // Active Study State
    let activeMaterial = null;
    let activePageIdx = 0; // 0-indexed page tracker
    let activeQuiz = null;

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
            } else if (tabName === 'kelas') {
                refreshKelasTab();
            } else if (tabName === 'presensi') {
                refreshPresensiTab();
            } else if (tabName === 'belajar') {
                refreshBelajarTab();
            }
        });
    });

    // --- ALERT & ATTENDANCE AUTO MONITOR ---
    function getActiveSessionSubjectName() {
        const session = window.AppState.getAttendanceSession();
        if (!session || !session.active) return null;
        const subjects = window.AppState.getSubjects();
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
        document.querySelector('[data-tab=presensi]').click();
    });

    // Check attendance every 4 seconds in the background
    setInterval(checkActiveAttendanceSession, 4000);

    // --- OVERVIEW TAB LOGIC ---
    function refreshOverviewTab() {
        checkActiveAttendanceSession();

        const classDetails = window.AppState.getClassDetails();
        const subjects = window.AppState.getSubjects();

        // Update wali kelas info
        document.getElementById('stat-wali-name').textContent = classDetails.homeroomTeacher;
        document.getElementById('stat-class-desc').textContent = classDetails.name;
        document.getElementById('stat-total-mapel').textContent = subjects.length;
        document.getElementById('student-class-name').textContent = classDetails.name;

        // Check active session for presensi stat
        const session = window.AppState.getAttendanceSession();
        const statusEl = document.getElementById('stat-presensi-status');
        const descEl = document.getElementById('stat-presensi-time');

        if (session && session.active) {
            const subName = getActiveSessionSubjectName();
            const dateStr = new Date().toISOString().split('T')[0];
            const records = window.AppState.getAttendanceRecords(session.subjectId, dateStr);
            const myRecord = records.find(r => r.username === currentUser.username);
            
            if (myRecord && myRecord.status === 'Hadir') {
                statusEl.textContent = 'Hadir';
                statusEl.style.color = 'var(--success)';
                descEl.textContent = `${subName} — jam ${myRecord.time}`;
            } else {
                statusEl.textContent = 'Belum Hadir';
                statusEl.style.color = 'var(--warning)';
                descEl.textContent = `Sesi ${subName} sedang berlangsung`;
            }
        } else {
            statusEl.textContent = '-';
            statusEl.style.color = '';
            descEl.textContent = 'Belum ada sesi aktif';
        }

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

    document.getElementById('btn-start-learning-shortcut').addEventListener('click', () => {
        document.getElementById('sidebar-tab-belajar').click();
    });

    // --- KELAS TAB LOGIC ---
    function refreshKelasTab() {
        const classDetails = window.AppState.getClassDetails();
        const subjects = window.AppState.getSubjects();

        // Update class label
        document.getElementById('kelas-class-label').textContent = classDetails.name;

        // Fill subjects table
        const mapelTable = document.getElementById('student-mapel-table');
        mapelTable.innerHTML = '';

        if (subjects.length === 0) {
            mapelTable.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:16px;">Belum ada mata pelajaran. Hubungi Wali Kelas.</td></tr>`;
        } else {
            subjects.forEach(sub => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight:600;">${escapeHTML(sub.name)}</td>
                    <td style="color:var(--text-secondary);">${escapeHTML(sub.teacher)}</td>
                    <td>${escapeHTML(sub.schedule)}</td>
                    <td><span class="badge badge-info">${escapeHTML(sub.joinCode)}</span></td>
                `;
                mapelTable.appendChild(tr);
            });
        }
        
        // Members list
        const membersGrid = document.getElementById('student-members-list-grid');
        membersGrid.innerHTML = '';

        // Add Teacher(s) from subjects
        const addedTeachers = new Set();
        subjects.forEach(sub => {
            if (!addedTeachers.has(sub.teacher)) {
                addedTeachers.add(sub.teacher);
                const teacherCard = document.createElement('div');
                teacherCard.className = 'glass-card member-card';
                teacherCard.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                const initials = sub.teacher.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                teacherCard.innerHTML = `
                    <div class="avatar" style="background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary-hover) 100%);">${initials}</div>
                    <div>
                        <div style="font-weight: 700;">${escapeHTML(sub.teacher)}</div>
                        <div style="font-size: 11px; color: var(--accent-primary); font-weight: 600;">Guru ${escapeHTML(sub.name)}</div>
                    </div>
                `;
                membersGrid.appendChild(teacherCard);
            }
        });

        // Add Students (Classmates)
        const students = window.AppState.getStudents();
        students.forEach(s => {
            const isMe = s.username === currentUser.username;
            const card = document.createElement('div');
            card.className = 'glass-card member-card';
            if (isMe) card.style.borderColor = 'rgba(168, 85, 247, 0.2)';
            
            const initials = s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            card.innerHTML = `
                <div class="avatar" style="background: #272a3d;">${initials}</div>
                <div>
                    <div style="font-weight: 600;">${escapeHTML(s.name)} ${isMe ? '<span style="font-size:11px;color:var(--accent-secondary);font-weight:bold;">(Saya)</span>' : ''}</div>
                    <div style="font-size: 11px; color: var(--text-secondary);">Siswa Kelas</div>
                </div>
            `;
            membersGrid.appendChild(card);
        });
    }

    // --- PRESENSI TAB LOGIC ---
    const codeInputs = document.querySelectorAll('.code-inputs-group input');
    
    // Jump forward and backward focus in inputs
    codeInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const val = e.target.value;
            // Clean up to keep only digit
            e.target.value = val.replace(/[^0-9]/g, '');
            
            if (e.target.value.length === 1 && index < codeInputs.length - 1) {
                codeInputs[index + 1].focus();
            }
            clearPresenceError();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
                codeInputs[index - 1].focus();
                codeInputs[index - 1].value = '';
            }
        });
    });

    function getEnteredCode() {
        let code = '';
        codeInputs.forEach(input => {
            code += input.value;
        });
        return code;
    }

    function clearPresenceInputs() {
        codeInputs.forEach(input => {
            input.value = '';
        });
        codeInputs[0].focus();
    }

    function clearPresenceError() {
        document.getElementById('attendance-error-msg').textContent = '';
    }

    function refreshPresensiTab() {
        const session = window.AppState.getAttendanceSession();
        const dateStr = new Date().toISOString().split('T')[0];
        const subjects = window.AppState.getSubjects();

        // --- Render History Table ---
        const historyBody = document.getElementById('student-attendance-history');
        historyBody.innerHTML = '';

        let anyRecord = false;
        subjects.forEach(sub => {
            const records = window.AppState.getAttendanceRecords(sub.id, dateStr);
            const myRecord = records.find(r => r.username === currentUser.username);
            
            if (myRecord) {
                anyRecord = true;
                const tr = document.createElement('tr');
                let badgeClass = 'badge-warning';
                if (myRecord.status === 'Hadir') badgeClass = 'badge-success';
                else if (myRecord.status === 'Sakit' || myRecord.status === 'Izin') badgeClass = 'badge-info';
                else if (myRecord.status === 'Alfa') badgeClass = 'badge-danger';

                tr.innerHTML = `
                    <td style="font-weight:600;">${escapeHTML(sub.name)}</td>
                    <td style="color:var(--text-secondary);">${escapeHTML(sub.schedule)}</td>
                    <td><span class="badge ${badgeClass}">${myRecord.status}</span></td>
                    <td>${myRecord.time}</td>
                `;
                historyBody.appendChild(tr);
            }
        });

        if (!anyRecord) {
            historyBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Belum ada catatan kehadiran hari ini.</td></tr>`;
        }

        // --- Render active presensi form ---
        const inputBox = document.getElementById('student-attendance-input-box');
        const successBox = document.getElementById('student-attendance-success-box');
        const noneBox = document.getElementById('student-attendance-none-box');

        clearPresenceError();

        if (session && session.active) {
            const activeRecords = window.AppState.getAttendanceRecords(session.subjectId, dateStr);
            const myActiveRecord = activeRecords.find(r => r.username === currentUser.username);
            const subName = getActiveSessionSubjectName();

            if (myActiveRecord && myActiveRecord.status === 'Hadir') {
                inputBox.style.display = 'none';
                noneBox.style.display = 'none';
                successBox.style.display = 'flex';
                document.getElementById('student-checkin-time').textContent = `Waktu presensi dicatat pada: ${myActiveRecord.time} WIB`;
                const successLabel = document.getElementById('success-subject-label');
                if (successLabel) successLabel.textContent = `Mata Pelajaran: ${subName}`;
            } else {
                successBox.style.display = 'none';
                noneBox.style.display = 'none';
                inputBox.style.display = 'flex';
                clearPresenceInputs();
                const sessionLabel = document.getElementById('active-session-subject-label');
                if (sessionLabel) sessionLabel.textContent = `Sesi aktif untuk: Mata Pelajaran ${subName}`;
            }
        } else {
            inputBox.style.display = 'none';
            successBox.style.display = 'none';
            noneBox.style.display = 'flex';
        }
    }

    // Submit Attendance button
    document.getElementById('btn-submit-attendance').addEventListener('click', () => {
        const code = getEnteredCode();
        const errorEl = document.getElementById('attendance-error-msg');
        
        if (code.length < 6) {
            errorEl.textContent = 'Harap lengkapi 6 digit kode presensi!';
            return;
        }

        const result = window.AppState.submitAttendance(currentUser.username, code);
        
        if (result.success) {
            refreshPresensiTab();
            refreshOverviewTab();
        } else {
            errorEl.textContent = result.message;
            clearPresenceInputs();
        }
    });

    // --- BELAJAR (STUDY) TAB LOGIC ---
    function refreshBelajarTab() {
        const selectPrompt = document.getElementById('select-material-prompt');
        const activeStudy = document.getElementById('active-study-view');

        if (activeMaterial === null) {
            selectPrompt.style.display = 'flex';
            activeStudy.style.display = 'none';
            renderStudyMaterialsList();
        } else {
            selectPrompt.style.display = 'none';
            activeStudy.style.display = 'grid';
            loadActiveMaterial();
        }
    }

    function renderStudyMaterialsList() {
        const materials = window.AppState.getMaterials();
        const subjects = window.AppState.getSubjects();
        const studyMatList = document.getElementById('study-tab-materials-list');
        studyMatList.innerHTML = '';

        if (materials.length === 0) {
            studyMatList.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px 0;">Belum ada materi pembelajaran yang terunggah oleh Guru.</div>`;
        } else {
            // Group materials by subject for better UX
            const materialsBySubject = {};
            materials.forEach(m => {
                if (!materialsBySubject[m.subjectId]) {
                    materialsBySubject[m.subjectId] = [];
                }
                materialsBySubject[m.subjectId].push(m);
            });

            Object.keys(materialsBySubject).forEach(subId => {
                const subInfo = subjects.find(s => s.id === subId);
                
                // Subject header divider
                if (subInfo) {
                    const headerDiv = document.createElement('div');
                    headerDiv.style.cssText = 'padding: 10px 0 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--accent-primary);';
                    headerDiv.textContent = subInfo.name;
                    studyMatList.appendChild(headerDiv);
                }

                materialsBySubject[subId].forEach(m => {
                    const item = document.createElement('div');
                    item.className = 'material-item';
                    item.style.marginBottom = '8px';
                    item.innerHTML = `
                        <div style="display:flex; align-items:center;">
                            <div class="material-icon-wrapper">PDF</div>
                            <div class="material-meta">
                                <div class="material-title">${escapeHTML(m.title)}</div>
                                <div class="material-desc">${escapeHTML(m.description)} | ${m.pages.length} Halaman</div>
                            </div>
                        </div>
                        <button class="btn-action-solid start-study-btn" data-id="${m.id}" style="font-size:12px; padding:6px 12px;">Pilih Materi</button>
                    `;
                    studyMatList.appendChild(item);
                });
            });

            studyMatList.querySelectorAll('.start-study-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const materialId = e.target.getAttribute('data-id');
                    activeMaterial = materials.find(m => m.id === materialId);
                    activePageIdx = 0;
                    refreshBelajarTab();
                });
            });
        }
    }

    // Go back to material chooser
    document.getElementById('btn-back-to-materials').addEventListener('click', () => {
        activeMaterial = null;
        activeQuiz = null;
        refreshBelajarTab();
    });

    // Render material contents inside simulated PDF panel and reset chatbot context
    function loadActiveMaterial() {
        if (!activeMaterial) return;

        // Render PDF header details
        document.getElementById('pdf-doc-title').textContent = activeMaterial.fileName;
        
        renderPDFPage();

        // Initialize Chat History with welcome note
        const chatMessages = document.getElementById('chat-messages-log');
        chatMessages.innerHTML = '';
        
        // Welcome message
        addAIMessage(`Halo **${currentUser.name}**! Saya Tutor AI Pintar Anda untuk materi **${escapeHTML(activeMaterial.title)}**.\n\nHalaman yang sedang Anda buka di sebelah kiri merupakan panduan belajar kita. Anda bebas bertanya mengenai topik apa saja di materi tersebut, atau gunakan **tombol cepat** di bawah untuk memulai belajar secara interaktif! 🤖📚`);

        // Set context in AI engine
        window.AIEngine.currentContext.materialId = activeMaterial.id;
        window.AIEngine.currentContext.materialTitle = activeMaterial.title;
        window.AIEngine.currentContext.lastPageNumber = activePageIdx + 1;
        window.AIEngine.currentContext.lastTopic = activeMaterial.pages[activePageIdx]?.title || activeMaterial.title;
    }

    function renderPDFPage() {
        if (!activeMaterial || !activeMaterial.pages || activeMaterial.pages.length === 0) return;

        const page = activeMaterial.pages[activePageIdx];
        document.getElementById('pdf-page-heading').textContent = page.title;
        document.getElementById('pdf-page-text').textContent = page.content;
        document.getElementById('pdf-page-number').textContent = `Halaman ${page.pageNumber}`;
        
        // Update page indicators
        document.getElementById('pdf-page-indicator').textContent = `${page.pageNumber} / ${activeMaterial.pages.length}`;
        
        // Update prev/next button limits
        document.getElementById('btn-pdf-prev').disabled = activePageIdx === 0;
        document.getElementById('btn-pdf-prev').style.opacity = activePageIdx === 0 ? '0.5' : '1';
        
        document.getElementById('btn-pdf-next').disabled = activePageIdx === activeMaterial.pages.length - 1;
        document.getElementById('btn-pdf-next').style.opacity = activePageIdx === activeMaterial.pages.length - 1 ? '0.5' : '1';

        // Update active page number in AI engine context
        window.AIEngine.currentContext.lastPageNumber = page.pageNumber;
        window.AIEngine.currentContext.lastTopic = page.title;
    }

    // PDF Navigation Click handlers
    document.getElementById('btn-pdf-prev').addEventListener('click', () => {
        if (activePageIdx > 0) {
            activePageIdx--;
            renderPDFPage();
        }
    });

    document.getElementById('btn-pdf-next').addEventListener('click', () => {
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

    // Initial Load
    refreshOverviewTab();
});
