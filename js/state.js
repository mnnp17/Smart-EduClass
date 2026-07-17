// state.js - Centralized state management using LocalStorage

const DEFAULT_USERS = [
    { username: 'guru', name: 'Budi Utomo, S.Pd.', role: 'guru', password: 'password' },
    { username: 'siswa', name: 'Andi Wijaya', role: 'siswa', password: 'password' },
    { username: 'siswa2', name: 'Siti Rahma', role: 'siswa', password: 'password' },
    { username: 'wali', name: 'Sri Wahyuni, S.Pd.', role: 'walikelas', password: 'password' }
];

const DEFAULT_STUDENTS = [
    { id: '1', name: 'Andi Wijaya', username: 'siswa' },
    { id: '2', name: 'Siti Rahma', username: 'siswa2' },
    { id: '3', name: 'Dewi Lestari', username: 'siswa_dewi' },
    { id: '4', name: 'Rian Hidayat', username: 'siswa_rian' },
    { id: '5', name: 'Eko Prasetyo', username: 'siswa_eko' }
];

const DEFAULT_SUBJECTS = [
    { id: 'sub-1', name: 'Matematika', teacher: 'Budi Utomo, S.Pd.', schedule: 'Kamis, 08:00 - 09:30 WIB', joinCode: 'MATH8A' },
    { id: 'sub-2', name: 'Bahasa Indonesia', teacher: 'Siti Aminah, S.Pd.', schedule: 'Senin, 10:00 - 11:30 WIB', joinCode: 'IND8A' }
];

const DEFAULT_MATERIALS = [
    {
        id: 'mat-1',
        subjectId: 'sub-1',
        title: 'Aljabar Dasar - Kelas VIII',
        description: 'Memahami konsep variabel, koefisien, konstanta, dan penjumlahan suku sejenis.',
        fileName: 'aljabar_dasar_VIII.pdf',
        summary: 'Ringkasan AI: Materi Aljabar Dasar VIII membahas komponen pembentuk aljabar (variabel, koefisien, konstanta), penjumlahan suku-suku sejenis, dan penerapan sifat distributif perkalian aljabar.',
        pages: [
            {
                pageNumber: 1,
                title: 'Konsep Dasar Aljabar',
                content: 'Aljabar adalah bagian dari matematika yang menggunakan simbol (huruf seperti x, y, z) untuk mewakili bilangan atau kuantitas yang belum diketahui nilainya. Huruf-huruf tersebut dinamakan variabel. \n\nIstilah penting dalam Aljabar:\n1. Variabel: Lambang pengganti suatu bilangan yang belum diketahui nilainya dengan jelas (contoh: x, y).\n2. Koefisien: Faktor pengali pada variabel (contoh: pada suku 3x, angka 3 adalah koefisien).\n3. Konstanta: Suku dari suatu bentuk aljabar yang berupa bilangan tetap dan tidak memuat variabel (contoh: pada bentuk 3x + 5, angka 5 adalah konstanta).'
            },
            {
                pageNumber: 2,
                title: 'Suku Sejenis dan Penjumlahan',
                content: 'Suku-suku dalam aljabar adalah bagian-bagian dari bentuk aljabar yang dipisahkan oleh tanda tambah (+) atau kurang (-). \n\nSuku Sejenis adalah suku-suku yang memiliki variabel yang sama dengan pangkat dari variabel yang sama pula. Hanya suku-suku sejenis yang dapat dijumlahkan atau dikurangkan. \n\nContoh:\n* 3x dan 5x adalah suku sejenis (dapat dijumlahkan menjadi 8x).\n* 4x^2 dan 2x^2 adalah suku sejenis.\n* 3x dan 3y adalah suku TIDAK sejenis (tidak dapat disederhanakan penjumlahannya; tetap 3x + 3y).\n* 5x dan 5x^2 adalah suku TIDAK sejenis karena pangkat variabelnya berbeda.'
            },
            {
                pageNumber: 3,
                title: 'Contoh Soal & Operasi Distribusi',
                content: 'Dalam aljabar, kita sering menggunakan sifat distributif untuk menyederhanakan perkalian suku aljabar terhadap penjumlahan.\n\nRumus Sifat Distributif:\na(b + c) = ab + ac\n\nContoh Soal Perkalian Aljabar:\n1. Sederhanakan bentuk: 3(x + 4)\n   Jawab: (3 * x) + (3 * 4) = 3x + 12.\n2. Sederhanakan bentuk: 2x(y - 3)\n   Jawab: 2xy - 6x.'
            }
        ]
    }
];

const DEFAULT_QUESTIONS = [
    {
        id: 'q-1',
        studentName: 'Siti Rahma',
        materialTitle: 'Aljabar Dasar - Kelas VIII',
        questionText: 'Bagaimana cara membedakan suku sejenis dengan tidak sejenis jika variabelnya banyak?',
        timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    }
];

// Helper to load/save state
const StorageManager = {
    get(key, defaultValue) {
        const data = localStorage.getItem(key);
        if (!data) {
            this.set(key, defaultValue);
            return defaultValue;
        }
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error(`Error parsing key "${key}" from localStorage`, e);
            return defaultValue;
        }
    },
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
};

// Initialize State (with schema migration)
function initState() {
    // === SCHEMA MIGRATION ===
    // If existing edu_users doesn't have a 'walikelas' user, reset to new defaults.
    const existingUsers = localStorage.getItem('edu_users');
    if (existingUsers) {
        try {
            const parsedUsers = JSON.parse(existingUsers);
            const hasWali = parsedUsers.some(u => u.role === 'walikelas');
            if (!hasWali) {
                // Old schema detected — wipe all stale keys and re-init fresh
                const keysToReset = [
                    'edu_users', 'edu_students', 'edu_subjects',
                    'edu_materials', 'edu_questions',
                    'edu_attendance_session', 'edu_attendance_records'
                ];
                keysToReset.forEach(k => localStorage.removeItem(k));
                console.info('[EduClass] Schema migrated: localStorage reset to new version.');
            }
        } catch (e) {
            // Corrupt data — clear everything
            localStorage.clear();
        }
    }

    // Also migrate stale attendance records that don't have subjectId (old schema)
    const existingRecords = localStorage.getItem('edu_attendance_records');
    if (existingRecords) {
        try {
            const parsedRecords = JSON.parse(existingRecords);
            const hasOldFormat = parsedRecords.length > 0 && !parsedRecords[0].subjectId;
            if (hasOldFormat) {
                localStorage.removeItem('edu_attendance_records');
                console.info('[EduClass] Attendance records migrated to subject-based schema.');
            }
        } catch (e) {
            localStorage.removeItem('edu_attendance_records');
        }
    }

    // === NORMAL INIT ===
    // 1. Users
    StorageManager.get('edu_users', DEFAULT_USERS);
    // 2. Students list
    StorageManager.get('edu_students', DEFAULT_STUDENTS);
    // 3. Subjects list
    StorageManager.get('edu_subjects', DEFAULT_SUBJECTS);
    // 4. Materials list
    StorageManager.get('edu_materials', DEFAULT_MATERIALS);
    // 5. Questions raised to AI
    StorageManager.get('edu_questions', DEFAULT_QUESTIONS);
    // 6. Active attendance session
    StorageManager.get('edu_attendance_session', {
        subjectId: null,
        code: null,
        expiresAt: null,
        active: false,
        durationMinutes: 5
    });
    
    // 7. Attendance records
    const dateStr = new Date().toISOString().split('T')[0];
    const initialRecords = [];
    DEFAULT_SUBJECTS.forEach(sub => {
        DEFAULT_STUDENTS.forEach(s => {
            let status = 'Belum Presensi';
            let time = '-';
            if (sub.id === 'sub-2') { // Demo: Bahasa Indonesia already finished
                status = s.id === '3' ? 'Sakit' : (s.id === '5' ? 'Alfa' : 'Hadir');
                time = status === 'Hadir' ? '10:05' : '-';
            }
            initialRecords.push({
                id: `rec-${sub.id}-${dateStr}-${s.username}`,
                subjectId: sub.id,
                date: dateStr,
                studentName: s.name,
                username: s.username,
                status: status,
                time: time
            });
        });
    });
    StorageManager.get('edu_attendance_records', initialRecords);
}

// Global state functions
const AppState = {
    // Auth
    getCurrentUser() {
        return StorageManager.get('edu_current_user', null);
    },
    setCurrentUser(user) {
        StorageManager.set('edu_current_user', user);
    },
    logout() {
        localStorage.removeItem('edu_current_user');
    },
    login(username, password) {
        const users = StorageManager.get('edu_users', DEFAULT_USERS);
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
        if (user) {
            this.setCurrentUser(user);
            return { success: true, user };
        }
        return { success: false, message: 'Username atau Password salah!' };
    },

    // Subjects (CRUD for Wali Kelas)
    getSubjects() {
        return StorageManager.get('edu_subjects', DEFAULT_SUBJECTS);
    },
    addSubject(name, teacher, schedule, joinCode) {
        const subjects = this.getSubjects();
        const newSub = {
            id: 'sub-' + (subjects.length + 1) + '-' + Math.floor(Math.random() * 1000),
            name,
            teacher,
            schedule,
            joinCode
        };
        subjects.push(newSub);
        StorageManager.set('edu_subjects', subjects);
        return newSub;
    },
    updateSubject(id, name, teacher, schedule, joinCode) {
        const subjects = this.getSubjects();
        const idx = subjects.findIndex(s => s.id === id);
        if (idx !== -1) {
            subjects[idx] = { ...subjects[idx], name, teacher, schedule, joinCode };
            StorageManager.set('edu_subjects', subjects);
            return { success: true };
        }
        return { success: false, message: 'Mata pelajaran tidak ditemukan.' };
    },
    deleteSubject(id) {
        let subjects = this.getSubjects();
        subjects = subjects.filter(s => s.id !== id);
        StorageManager.set('edu_subjects', subjects);
        return { success: true };
    },

    // Materials
    getMaterials(subjectId = null) {
        const mats = StorageManager.get('edu_materials', DEFAULT_MATERIALS);
        if (subjectId) {
            return mats.filter(m => m.subjectId === subjectId);
        }
        return mats;
    },
    addMaterial(subjectId, title, description, pages) {
        const materials = StorageManager.get('edu_materials', DEFAULT_MATERIALS);
        
        // Simulation of AI Material summary (Q3 requirement)
        let summary = '';
        if (pages && pages.length > 0) {
            const bulletPoints = pages.slice(0, 3).map((p, i) => `${i + 1}) ${p.title}`).join(', ');
            summary = `Ringkasan AI: Berkas "${title}" memuat topik penting yaitu: ${bulletPoints}. Teks materi berfokus pada penjelasan konseptual mengenai ${description.toLowerCase()}.`;
        } else {
            summary = `Ringkasan AI: Dokumen berisi materi tentang ${title} (${description}).`;
        }

        const newMat = {
            id: 'mat-' + (materials.length + 1) + '-' + Math.floor(Math.random() * 1000),
            subjectId,
            title,
            description,
            fileName: title.toLowerCase().replace(/\s+/g, '_') + '.pdf',
            summary,
            pages: pages || []
        };
        materials.push(newMat);
        StorageManager.set('edu_materials', materials);
        return newMat;
    },

    // Attendance
    getAttendanceSession() {
        const session = StorageManager.get('edu_attendance_session');
        if (session && session.active && session.expiresAt) {
            // Check if expired
            if (Date.now() > new Date(session.expiresAt).getTime()) {
                session.active = false;
                session.code = null;
                session.expiresAt = null;
                StorageManager.set('edu_attendance_session', session);
                
                // Mark all "Belum Presensi" as "Alfa" when session expires
                const dateStr = new Date().toISOString().split('T')[0];
                this.finalizeAttendance(session.subjectId, dateStr);
            }
        }
        return session;
    },
    startAttendanceSession(subjectId, durationMinutes = 5) {
        const code = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit code
        const expiresAt = new Date(Date.now() + durationMinutes * 60000).toISOString();
        const session = {
            subjectId,
            code,
            expiresAt,
            active: true,
            durationMinutes
        };
        StorageManager.set('edu_attendance_session', session);
        
        // Reset/init student attendance records for this subject and dateStr
        const dateStr = new Date().toISOString().split('T')[0];
        let records = StorageManager.get('edu_attendance_records', []);
        
        // Remove existing records for this subject + dateStr (overwrite/restart)
        records = records.filter(r => !(r.subjectId === subjectId && r.date === dateStr));
        
        const students = this.getStudents();
        students.forEach(s => {
            records.push({
                id: `rec-${subjectId}-${dateStr}-${s.username}`,
                subjectId,
                date: dateStr,
                studentName: s.name,
                username: s.username,
                status: 'Belum Presensi',
                time: '-'
            });
        });
        StorageManager.set('edu_attendance_records', records);
        
        return session;
    },
    submitAttendance(username, code) {
        const session = this.getAttendanceSession();
        if (!session.active) {
            return { success: false, message: 'Tidak ada sesi presensi aktif.' };
        }
        if (session.code !== code) {
            return { success: false, message: 'Kode presensi salah!' };
        }
        if (Date.now() > new Date(session.expiresAt).getTime()) {
            return { success: false, message: 'Sesi presensi telah kedaluwarsa!' };
        }

        const dateStr = new Date().toISOString().split('T')[0];
        const records = StorageManager.get('edu_attendance_records', []);
        const idx = records.findIndex(r => r.username === username && r.subjectId === session.subjectId && r.date === dateStr);
        if (idx !== -1) {
            if (records[idx].status === 'Hadir') {
                return { success: true, message: 'Anda sudah melakukan presensi.' };
            }
            records[idx].status = 'Hadir';
            records[idx].time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            StorageManager.set('edu_attendance_records', records);
            return { success: true, message: 'Presensi berhasil dicatat!' };
        }
        
        // Fallback: create record if not exists
        const student = this.getStudents().find(s => s.username === username);
        if (student) {
            records.push({
                id: `rec-${session.subjectId}-${dateStr}-${username}`,
                subjectId: session.subjectId,
                date: dateStr,
                studentName: student.name,
                username: username,
                status: 'Hadir',
                time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            });
            StorageManager.set('edu_attendance_records', records);
            return { success: true, message: 'Presensi berhasil dicatat!' };
        }
        return { success: false, message: 'Siswa tidak terdaftar di kelas.' };
    },
    getAttendanceRecords(subjectId = null, dateStr = null) {
        const records = StorageManager.get('edu_attendance_records', []);
        let filtered = records;
        if (subjectId) {
            filtered = filtered.filter(r => r.subjectId === subjectId);
        }
        if (dateStr) {
            filtered = filtered.filter(r => r.date === dateStr);
        }
        return filtered;
    },
    updateAttendanceStatus(studentUsername, subjectId, dateStr, newStatus) {
        const records = StorageManager.get('edu_attendance_records', []);
        const idx = records.findIndex(r => r.username === studentUsername && r.subjectId === subjectId && r.date === dateStr);
        if (idx !== -1) {
            records[idx].status = newStatus;
            if (newStatus === 'Belum Presensi') {
                records[idx].time = '-';
            } else if (records[idx].time === '-' && newStatus !== 'Alfa') {
                records[idx].time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            }
            StorageManager.set('edu_attendance_records', records);
            return true;
        } else {
            // Create record
            const student = this.getStudents().find(s => s.username === studentUsername);
            if (student) {
                records.push({
                    id: `rec-${subjectId}-${dateStr}-${studentUsername}`,
                    subjectId,
                    date: dateStr,
                    studentName: student.name,
                    username: studentUsername,
                    status: newStatus,
                    time: (newStatus !== 'Belum Presensi' && newStatus !== 'Alfa') ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'
                });
                StorageManager.set('edu_attendance_records', records);
                return true;
            }
        }
        return false;
    },
    finalizeAttendance(subjectId, dateStr) {
        const records = StorageManager.get('edu_attendance_records', []);
        let updated = false;
        records.forEach(r => {
            if (r.subjectId === subjectId && r.date === dateStr && r.status === 'Belum Presensi') {
                r.status = 'Alfa';
                updated = true;
            }
        });
        if (updated) {
            StorageManager.set('edu_attendance_records', records);
        }
    },

    // Questions / Interactions
    getQuestions() {
        return StorageManager.get('edu_questions', DEFAULT_QUESTIONS);
    },
    addQuestion(studentName, materialTitle, questionText) {
        const questions = this.getQuestions();
        const newQ = {
            id: 'q-' + (questions.length + 1),
            studentName,
            materialTitle,
            questionText,
            timestamp: new Date().toISOString()
        };
        questions.unshift(newQ); // Add to the top
        StorageManager.set('edu_questions', questions);
        return newQ;
    },

    // Class Info
    getClassDetails() {
        return {
            name: 'Kelas VIII-A',
            level: 'VIII (Delapan)',
            homeroomTeacher: 'Sri Wahyuni, S.Pd.'
        };
    },
    getStudents() {
        return StorageManager.get('edu_students', DEFAULT_STUDENTS);
    }
};

// Initialize on script load
initState();
window.AppState = AppState;

// ==========================================================================
// Global UI Logic (Theme, Mobile Drawer, Bottom Nav)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggler
    const themeBtn = document.getElementById('btn-theme-toggle');
    const isLight = localStorage.getItem('edu_theme') === 'light';
    
    if (isLight) {
        document.body.classList.add('light-theme');
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            if (document.body.classList.contains('light-theme')) {
                localStorage.setItem('edu_theme', 'light');
            } else {
                localStorage.setItem('edu_theme', 'dark');
            }
        });
    }

    // Hamburger & Drawer Logic
    const btnHamburger = document.getElementById('btn-hamburger');
    const drawer = document.getElementById('slide-drawer');
    const overlay = document.getElementById('drawer-overlay');
    const btnCloseDrawer = document.getElementById('btn-close-drawer');

    function openDrawer() {
        if(drawer) drawer.classList.add('open');
        if(overlay) overlay.classList.add('active');
    }
    
    function closeDrawer() {
        if(drawer) drawer.classList.remove('open');
        if(overlay) overlay.classList.remove('active');
    }

    if(btnHamburger) btnHamburger.addEventListener('click', openDrawer);
    if(btnCloseDrawer) btnCloseDrawer.addEventListener('click', closeDrawer);
    if(overlay) overlay.addEventListener('click', closeDrawer);

    // Sync Bottom Nav Clicks with existing Tab logic (if any)
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    bottomNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabName = item.getAttribute('data-tab');
            // Try to find the corresponding sidebar menu item and click it
            // This reuses the logic already written in guru.js / siswa.js / wali.js
            const sideMenuItem = document.querySelector(`.sidebar .menu-item[data-tab="${tabName}"]`);
            if(sideMenuItem) {
                sideMenuItem.click();
            }
            
            // Highlight bottom nav
            bottomNavItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Also sync from sidebar clicks to bottom nav
    const sideMenuItems = document.querySelectorAll('.sidebar .menu-item');
    sideMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabName = item.getAttribute('data-tab');
            bottomNavItems.forEach(i => {
                if(i.getAttribute('data-tab') === tabName) {
                    i.classList.add('active');
                } else {
                    i.classList.remove('active');
                }
            });
        });
    });
});
