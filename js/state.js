// state.js - Centralized state management using LocalStorage

const DEFAULT_USERS = [
    { username: 'admin', name: 'Super Admin', role: 'admin', password: 'password' },
    { username: 'guru', name: 'Budi Utomo, S.Pd.', role: 'guru', password: 'password' },
    { username: 'guru2', name: 'Siti Aminah, S.Pd.', role: 'guru', password: 'password' },
    { username: 'siswa', name: 'Andi Wijaya', role: 'siswa', password: 'password' },
    { username: 'siswa2', name: 'Siti Rahma', role: 'siswa', password: 'password' },
    { username: 'siswa_dewi', name: 'Dewi Lestari', role: 'siswa', password: 'password' },
    { username: 'siswa_rian', name: 'Rian Hidayat', role: 'siswa', password: 'password' },
    { username: 'siswa_eko', name: 'Eko Prasetyo', role: 'siswa', password: 'password' }
];

const DEFAULT_CLASSES = [
    { id: 'cls-1', name: 'VIII-A' },
    { id: 'cls-2', name: 'VIII-B' }
];

const DEFAULT_STUDENTS = [
    { id: 'std-1', name: 'Andi Wijaya', username: 'siswa', classId: 'cls-1' },
    { id: 'std-2', name: 'Siti Rahma', username: 'siswa2', classId: 'cls-1' },
    { id: 'std-3', name: 'Dewi Lestari', username: 'siswa_dewi', classId: 'cls-2' },
    { id: 'std-4', name: 'Rian Hidayat', username: 'siswa_rian', classId: 'cls-2' },
    { id: 'std-5', name: 'Eko Prasetyo', username: 'siswa_eko', classId: 'cls-1' }
];

const DEFAULT_SUBJECTS = [
    { id: 'sub-1', name: 'Matematika', teacherUsername: 'guru', schedule: 'Kamis, 08:00 - 09:30 WIB', joinCode: 'MATH8A', classIds: ['cls-1', 'cls-2'] },
    { id: 'sub-2', name: 'Bahasa Indonesia', teacherUsername: 'guru2', schedule: 'Senin, 10:00 - 11:30 WIB', joinCode: 'IND8A', classIds: ['cls-1'] }
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
    const currentSchemaVersion = 'v2_superadmin';
    const savedVersion = localStorage.getItem('edu_schema_version');
    
    if (savedVersion !== currentSchemaVersion) {
        // Old schema detected — wipe all stale keys and re-init fresh
        localStorage.clear();
        localStorage.setItem('edu_schema_version', currentSchemaVersion);
        console.info('[EduClass] Schema migrated to ' + currentSchemaVersion + ': localStorage reset.');
    }

    // === NORMAL INIT ===
    StorageManager.get('edu_users', DEFAULT_USERS);
    StorageManager.get('edu_classes', DEFAULT_CLASSES);
    StorageManager.get('edu_students', DEFAULT_STUDENTS);
    StorageManager.get('edu_subjects', DEFAULT_SUBJECTS);
    StorageManager.get('edu_materials', DEFAULT_MATERIALS);
    StorageManager.get('edu_questions', DEFAULT_QUESTIONS);
    StorageManager.get('edu_attendance_session', {
        subjectId: null,
        code: null,
        expiresAt: null,
        active: false,
        durationMinutes: 5
    });
    
    const dateStr = new Date().toISOString().split('T')[0];
    const initialRecords = [];
    DEFAULT_SUBJECTS.forEach(sub => {
        // Only students in this subject's classes
        const classes = StorageManager.get('edu_classes', DEFAULT_CLASSES).filter(c => sub.classIds.includes(c.id));
        const students = StorageManager.get('edu_students', DEFAULT_STUDENTS).filter(s => classes.some(c => c.id === s.classId));
        
        students.forEach(s => {
            let status = 'Belum Presensi';
            let time = '-';
            if (sub.id === 'sub-2') { 
                status = s.id === 'std-3' ? 'Sakit' : (s.id === 'std-5' ? 'Alfa' : 'Hadir');
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
    getUsers() {
        return StorageManager.get('edu_users', DEFAULT_USERS);
    },
    
    // Guru (Users with role guru)
    getTeachers() {
        return this.getUsers().filter(u => u.role === 'guru');
    },
    addTeacher(name, username, password) {
        const users = this.getUsers();
        if (users.some(u => u.username === username)) return false;
        users.push({ username, name, role: 'guru', password: password || 'password' });
        StorageManager.set('edu_users', users);
        return true;
    },
    updateTeacher(oldUsername, name, newUsername, password) {
        const users = this.getUsers();
        const idx = users.findIndex(u => u.username === oldUsername);
        if (idx !== -1) {
            users[idx].name = name;
            if (newUsername && newUsername !== oldUsername) {
                if (users.some(u => u.username === newUsername)) return false;
                users[idx].username = newUsername;
            }
            if (password) {
                users[idx].password = password;
            }
            StorageManager.set('edu_users', users);
            
            // cascade update subject
            const subjects = this.getSubjects();
            subjects.forEach(s => {
                if(s.teacherUsername === oldUsername) {
                    s.teacherUsername = newUsername || oldUsername;
                }
            });
            StorageManager.set('edu_subjects', subjects);
            return true;
        }
        return false;
    },
    deleteTeacher(username) {
        let users = this.getUsers();
        users = users.filter(u => u.username !== username);
        StorageManager.set('edu_users', users);
        
        let subjects = this.getSubjects();
        subjects.forEach(s => {
            if(s.teacherUsername === username) s.teacherUsername = null;
        });
        StorageManager.set('edu_subjects', subjects);
        return true;
    },

    // Classes
    getClasses() {
        return StorageManager.get('edu_classes', DEFAULT_CLASSES);
    },
    addClass(name) {
        const classes = this.getClasses();
        const newClass = { id: 'cls-' + Date.now(), name };
        classes.push(newClass);
        StorageManager.set('edu_classes', classes);
        return newClass;
    },
    updateClass(id, name) {
        const classes = this.getClasses();
        const idx = classes.findIndex(c => c.id === id);
        if (idx !== -1) {
            classes[idx].name = name;
            StorageManager.set('edu_classes', classes);
            return true;
        }
        return false;
    },
    deleteClass(id) {
        let classes = this.getClasses();
        classes = classes.filter(c => c.id !== id);
        StorageManager.set('edu_classes', classes);
        
        // cascade
        let students = this.getStudents();
        students.forEach(s => {
            if (s.classId === id) s.classId = null;
        });
        StorageManager.set('edu_students', students);
        
        let subjects = this.getSubjects();
        subjects.forEach(s => {
            s.classIds = s.classIds.filter(cid => cid !== id);
        });
        StorageManager.set('edu_subjects', subjects);
        
        return true;
    },

    // Subjects
    getSubjects() {
        return StorageManager.get('edu_subjects', DEFAULT_SUBJECTS);
    },
    addSubject(name, teacherUsername, schedule, joinCode, classIds = []) {
        const subjects = this.getSubjects();
        const newSub = {
            id: 'sub-' + Date.now(),
            name,
            teacherUsername,
            schedule,
            joinCode,
            classIds
        };
        subjects.push(newSub);
        StorageManager.set('edu_subjects', subjects);
        return newSub;
    },
    updateSubject(id, name, teacherUsername, schedule, joinCode, classIds) {
        const subjects = this.getSubjects();
        const idx = subjects.findIndex(s => s.id === id);
        if (idx !== -1) {
            subjects[idx] = { ...subjects[idx], name, teacherUsername, schedule, joinCode, classIds: classIds || subjects[idx].classIds };
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

    // Students
    getStudents() {
        return StorageManager.get('edu_students', DEFAULT_STUDENTS);
    },
    addStudent(name, username, password, classId) {
        const students = this.getStudents();
        const users = this.getUsers();
        
        if (users.some(u => u.username === username)) {
            return false;
        }
        
        const newId = 'std-' + Date.now();
        const newStudent = { id: newId, name: name.trim(), username, classId };
        students.push(newStudent);
        StorageManager.set('edu_students', students);

        const newUser = { username, name: name.trim(), role: 'siswa', password: password || 'password' };
        users.push(newUser);
        StorageManager.set('edu_users', users);

        return newStudent;
    },
    updateStudent(id, name, username, classId, password) {
        const students = this.getStudents();
        let users = this.getUsers();
        const idx = students.findIndex(s => s.id === id);
        
        if (idx !== -1) {
            const oldUsername = students[idx].username;
            
            // If username changes, check availability
            if (username && username !== oldUsername) {
                if (users.some(u => u.username === username)) return false;
            }
            
            students[idx].name = name;
            students[idx].classId = classId;
            if (username) students[idx].username = username;
            StorageManager.set('edu_students', students);
            
            const userIdx = users.findIndex(u => u.username === oldUsername);
            if(userIdx !== -1) {
                users[userIdx].name = name;
                if(username) users[userIdx].username = username;
                if(password) users[userIdx].password = password;
                StorageManager.set('edu_users', users);
            }
            return true;
        }
        return false;
    },
    deleteStudent(id) {
        let students = this.getStudents();
        const target = students.find(s => s.id === id);
        if (!target) return false;

        students = students.filter(s => s.id !== id);
        StorageManager.set('edu_students', students);

        let users = this.getUsers();
        users = users.filter(u => u.username !== target.username);
        StorageManager.set('edu_users', users);
        return true;
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
        let summary = '';
        if (pages && pages.length > 0) {
            const bulletPoints = pages.slice(0, 3).map((p, i) => `${i + 1}) ${p.title}`).join(', ');
            summary = `Ringkasan AI: Berkas "${title}" memuat topik penting yaitu: ${bulletPoints}. Teks materi berfokus pada penjelasan konseptual mengenai ${description.toLowerCase()}.`;
        } else {
            summary = `Ringkasan AI: Dokumen berisi materi tentang ${title} (${description}).`;
        }

        const newMat = {
            id: 'mat-' + Date.now(),
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
    deleteMaterial(id) {
        let materials = StorageManager.get('edu_materials', DEFAULT_MATERIALS);
        materials = materials.filter(m => m.id !== id);
        StorageManager.set('edu_materials', materials);
        return true;
    },

    // Attendance
    getAttendanceSession() {
        const session = StorageManager.get('edu_attendance_session');
        if (session && session.active && session.expiresAt) {
            if (Date.now() > new Date(session.expiresAt).getTime()) {
                session.active = false;
                session.code = null;
                session.expiresAt = null;
                StorageManager.set('edu_attendance_session', session);
                
                const dateStr = new Date().toISOString().split('T')[0];
                this.finalizeAttendance(session.subjectId, dateStr);
            }
        }
        return session;
    },
    startAttendanceSession(subjectId, durationMinutes = 5) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + durationMinutes * 60000).toISOString();
        const session = {
            subjectId,
            code,
            expiresAt,
            active: true,
            durationMinutes
        };
        StorageManager.set('edu_attendance_session', session);
        
        const dateStr = new Date().toISOString().split('T')[0];
        let records = StorageManager.get('edu_attendance_records', []);
        
        records = records.filter(r => !(r.subjectId === subjectId && r.date === dateStr));
        
        // Find students assigned to this subject via class
        const subject = this.getSubjects().find(s => s.id === subjectId);
        if(subject) {
            const students = this.getStudents().filter(s => subject.classIds.includes(s.classId));
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
        }
        
        return session;
    },
    submitAttendance(username, code) {
        const session = this.getAttendanceSession();
        if (!session.active) return { success: false, message: 'Tidak ada sesi presensi aktif.' };
        if (session.code !== code) return { success: false, message: 'Kode presensi salah!' };
        if (Date.now() > new Date(session.expiresAt).getTime()) return { success: false, message: 'Sesi presensi telah kedaluwarsa!' };

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
        return { success: false, message: 'Siswa tidak terdaftar di mata pelajaran ini.' };
    },
    getAttendanceRecords(subjectId = null, dateStr = null) {
        const records = StorageManager.get('edu_attendance_records', []);
        let filtered = records;
        if (subjectId) filtered = filtered.filter(r => r.subjectId === subjectId);
        if (dateStr) filtered = filtered.filter(r => r.date === dateStr);
        return filtered;
    },
    updateAttendanceStatus(studentUsername, subjectId, dateStr, newStatus) {
        const records = StorageManager.get('edu_attendance_records', []);
        const idx = records.findIndex(r => r.username === studentUsername && r.subjectId === subjectId && r.date === dateStr);
        if (idx !== -1) {
            records[idx].status = newStatus;
            if (newStatus === 'Belum Presensi') records[idx].time = '-';
            else if (records[idx].time === '-' && newStatus !== 'Alfa') {
                records[idx].time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            }
            StorageManager.set('edu_attendance_records', records);
            return true;
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
        if (updated) StorageManager.set('edu_attendance_records', records);
    },

    // Questions
    getQuestions() {
        return StorageManager.get('edu_questions', DEFAULT_QUESTIONS);
    },
    addQuestion(studentName, materialTitle, questionText) {
        const questions = this.getQuestions();
        const newQ = {
            id: 'q-' + Date.now(),
            studentName,
            materialTitle,
            questionText,
            timestamp: new Date().toISOString()
        };
        questions.unshift(newQ);
        StorageManager.set('edu_questions', questions);
        return newQ;
    }
};

initState();
window.AppState = AppState;

// Global UI Logic
document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('btn-theme-toggle');
    const isLight = localStorage.getItem('edu_theme') === 'light';
    
    if (isLight) document.body.classList.add('light-theme');

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            localStorage.setItem('edu_theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
        });
    }

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

    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    bottomNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabName = item.getAttribute('data-tab');
            const sideMenuItem = document.querySelector(`.sidebar .menu-item[data-tab="${tabName}"]`);
            if(sideMenuItem) sideMenuItem.click();
            bottomNavItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    const sideMenuItems = document.querySelectorAll('.sidebar .menu-item');
    sideMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabName = item.getAttribute('data-tab');
            bottomNavItems.forEach(i => {
                if(i.getAttribute('data-tab') === tabName) i.classList.add('active');
                else i.classList.remove('active');
            });
        });
    });
});
