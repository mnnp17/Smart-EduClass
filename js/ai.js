// ai.js - Simulated Context-Aware AI Tutor Engine

const AIEngine = {
    // Keep track of active context for follow-up buttons
    currentContext: {
        materialId: null,
        materialTitle: '',
        lastPageNumber: 1,
        lastTopic: 'Aljabar Dasar'
    },

    // Stop words to clean queries for basic keyword search
    stopWords: ['yang', 'di', 'ke', 'dari', 'dan', 'adalah', 'ini', 'itu', 'apa', 'bagaimana', 'mengapa', 'apakah', 'untuk', 'dengan', 'pada', 'bisa', 'cara'],

    cleanText(text) {
        return text.toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
            .split(/\s+/)
            .filter(word => !this.stopWords.includes(word) && word.length > 1);
    },

    // Simple keyword-matching search across material pages
    searchMaterial(material, query) {
        if (!material || !material.pages || material.pages.length === 0) {
            return null;
        }

        const queryWords = this.cleanText(query);
        if (queryWords.length === 0) return material.pages[0]; // Default to page 1

        let bestPage = null;
        let maxScore = -1;

        material.pages.forEach(page => {
            let score = 0;
            const pageText = (page.title + " " + page.content).toLowerCase();
            
            queryWords.forEach(word => {
                const regex = new RegExp('\\b' + word + '\\b', 'g');
                const matches = pageText.match(regex);
                if (matches) {
                    score += matches.length;
                }
                // Partial match bonus
                if (pageText.includes(word)) {
                    score += 0.5;
                }
            });

            if (score > maxScore) {
                maxScore = score;
                bestPage = page;
            }
        });

        // If score is negligible, default to the first page or current page
        if (maxScore <= 0.5) {
            return null;
        }

        return bestPage;
    },

    // Generate simulated AI Response
    getAIResponse(material, query) {
        // Save current material context
        if (material) {
            this.currentContext.materialId = material.id;
            this.currentContext.materialTitle = material.title;
        }

        const matchedPage = this.searchMaterial(material, query);
        
        if (matchedPage) {
            this.currentContext.lastPageNumber = matchedPage.pageNumber;
            this.currentContext.lastTopic = matchedPage.title;
            return this.generateAnswerForPage(matchedPage.pageNumber, query);
        } else {
            // General math/system fallback
            return {
                text: "Saya siap membantu belajar. Namun, saya tidak menemukan referensi spesifik tentang topik tersebut di materi **" + (material ? material.title : 'ini') + "**. \n\nApakah ada bagian dari materi yang ingin Anda tanyakan lebih detail?",
                source: null
            };
        }
    },

    // Generate mock responses based on page number
    generateAnswerForPage(pageNumber, query) {
        const queryLower = query.toLowerCase();
        let responseText = "";
        let sourcePage = pageNumber;

        if (pageNumber === 1) {
            // Page 1: Konsep Dasar Aljabar
            if (queryLower.includes('variabel')) {
                responseText = "**Variabel** dalam aljabar adalah simbol atau huruf (seperti x, y, atau z) yang mewakili suatu nilai yang belum diketahui nilainya dengan pasti. \n\nMisalnya, jika kita berkata 'sejumlah apel di dalam kotak', kita bisa melambangkan jumlah apel itu sebagai variabel **x**. Variabel membantu kita membuat model matematika untuk memecahkan masalah tak diketahui.";
            } else if (queryLower.includes('koefisien')) {
                responseText = "**Koefisien** adalah angka atau faktor pengali yang berada langsung di depan variabel. Koefisien menunjukkan seberapa banyak variabel tersebut dikalikan.\n\nContohnya pada bentuk aljabar **5y**:\n* **5** adalah koefisien\n* **y** adalah variabel\n\nIni berarti nilai y dikalikan sebanyak 5 kali.";
            } else if (queryLower.includes('konstanta')) {
                responseText = "**Konstanta** adalah sebuah bilangan tetap dalam bentuk aljabar yang berdiri sendiri dan tidak memiliki variabel bersamanya.\n\nMisalnya, dalam bentuk aljabar **3x + 8**:\n* **3** adalah koefisien dari x\n* **x** adalah variabel\n* **8** adalah konstanta (nilainya tetap, tidak dipengaruhi oleh nilai x).";
            } else {
                responseText = "Berdasarkan materi halaman 1, kita mempelajari bahwa **Aljabar** menggunakan simbol (seperti x, y) sebagai pengganti bilangan yang belum diketahui nilainya. \n\nTiga komponen penting bentuk aljabar:\n1. **Variabel**: huruf pengganti angka (misal: *x*).\n2. **Koefisien**: angka pengali variabel (misal: angka 3 pada *3x*).\n3. **Konstanta**: angka mandiri tanpa huruf (misal: angka 5 pada *3x + 5*).";
            }
        } else if (pageNumber === 2) {
            // Page 2: Suku Sejenis
            if (queryLower.includes('sejenis') || queryLower.includes('jumlah') || queryLower.includes('kurang')) {
                responseText = "**Suku Sejenis** adalah suku-suku yang memiliki variabel yang sama dengan pangkat variabel yang juga sama. \n\n**Mengapa ini penting?** \nKarena di matematika aljabar, kita hanya bisa menjumlahkan atau mengurangkan suku-suku yang sejenis. \n\nContoh:\n* **3x + 4x = 7x** (Bisa dijumlahkan karena keduanya suku sejenis x)\n* **3x + 4y** (TIDAK BISA dijumlahkan karena x dan y berbeda suku; hasilnya tetap **3x + 4y**)\n* **2x + 2x^2** (TIDAK BISA dijumlahkan karena pangkatnya berbeda, satu pangkat 1 dan satunya pangkat 2).";
            } else {
                responseText = "Pada halaman 2, kita mempelajari tentang **Suku Sejenis**. Suku sejenis adalah suku yang memiliki variabel dan pangkat variabel yang sama persis.\n\nIngat aturan dasarnya: **Hanya suku sejenis yang boleh dijumlahkan atau dikurangkan**.\n\nContoh suku sejenis: *5ab* dengan *-2ab*. \nContoh suku tidak sejenis: *4a* dengan *4b*.";
            }
        } else if (pageNumber === 3) {
            // Page 3: Distributif & Contoh Soal
            if (queryLower.includes('distributif') || queryLower.includes('perkalian') || queryLower.includes('sifat')) {
                responseText = "Sifat distributif digunakan untuk mengalikan satu suku luar dengan suku-suku di dalam kurung.\n\nRumus umumnya:\n**a(b + c) = ab + ac**\n\nMisalnya, jika Anda memiliki bentuk **4(x + 5)**, maka cara menyelesaikannya adalah:\n1. Kalikan 4 dengan suku pertama: 4 * x = **4x**\n2. Kalikan 4 dengan suku kedua: 4 * 5 = **20**\n3. Gabungkan hasilnya: **4x + 20**.";
            } else {
                responseText = "Halaman 3 berfokus pada perkalian aljabar menggunakan **sifat distributif**. \n\nContoh utamanya:\n* perkalian **3(x + 4)** menghasilkan **3x + 12**\n* perkalian **2x(y - 3)** menghasilkan **2xy - 6x**\n\nApakah Anda ingin saya memberikan latihan soal distributif?";
            }
        } else {
            // Custom page uploaded by user
            responseText = "Berdasarkan materi pada Halaman " + pageNumber + " tentang \"" + this.currentContext.lastTopic + "\":\n\n" + 
                           "Saya menemukan informasi penting berikut: \n" + 
                           "\"" + (query.length > 20 ? "Menjawab pertanyaan mengenai " + query : "Penjelasan terkait konsep tersebut") + "\".\n\nApakah ada bagian detail dari teks halaman " + pageNumber + " ini yang ingin didiskusikan lebih lanjut?";
        }

        return {
            text: responseText,
            source: {
                title: this.currentContext.materialTitle,
                page: sourcePage
            }
        };
    },

    // Quick Action: "Jelaskan lebih sederhana"
    getSimplerExplanation() {
        let responseText = "";
        const page = this.currentContext.lastPageNumber;

        if (page === 1) {
            responseText = "Bayangkan **Variabel** itu seperti sebuah **kotak kado misterius**. Kita tahu di dalamnya ada permen, tapi kita belum tahu berapa jumlahnya. Kita sebut saja jumlah permen itu **x**.\n\nNah, **Konstanta** adalah **permen yang sudah ada di luar kotak**, jelas terlihat jumlahnya (misalnya 5 permen).\n\nSedangkan **Koefisien** adalah jumlah kotak misterius yang kita punya. Jika kita punya **3 kotak**, kita menulisnya **3x**.\n\nJadi jika ditulis **3x + 5**, artinya kita punya **3 kotak misterius** ditambah **5 permen di luar kotak**.";
        } else if (page === 2) {
            responseText = "Bayangkan suku sejenis seperti **buah-buahan**:\n* **x** adalah Apel\n* **y** adalah Pisang\n\nJika Anda punya **3 Apel (3x)** dan mendapat **2 Apel (2x)** lagi, Anda sekarang punya **5 Apel (5x)**. Ini karena mereka sejenis (sama-sama Apel).\n\nTetapi, jika Anda punya **3 Apel (3x)** dan **2 Pisang (2y)**, Anda **TIDAK BISA** menggabungkannya menjadi *5 Apel-Pisang (5xy)*! Anda tetap mempunyai **3 Apel dan 2 Pisang**. \n\nBegitulah cara kerja suku tidak sejenis di aljabar!";
        } else if (page === 3) {
            responseText = "Sifat distributif itu seperti seorang kurir paket yang mengantar hadiah ke rumah berisi dua anak.\n\nDalam rumus: **3(Andi + Budi)**\n\nSi kurir (angka 3) harus membagikan paket kepada **Andi** dan juga kepada **Budi** secara adil.\n\nSehingga hasilnya:\n**3 paket untuk Andi** ditambah **3 paket untuk Budi**.\n\nDalam matematika ditulis: **3 * Andi + 3 * Budi**.";
        } else {
            responseText = "Tentu, mari kita sederhanakan. Inti dari informasi di halaman " + page + " adalah bahwa konsep ini dapat diibaratkan seperti membagi tugas dalam kelompok kecil secara merata. Setiap elemen harus saling disesuaikan agar mencapai hasil akhir yang seimbang.";
        }

        return {
            text: "💡 **Penjelasan Lebih Sederhana:**\n\n" + responseText,
            source: {
                title: this.currentContext.materialTitle,
                page: page
            }
        };
    },

    // Quick Action: "Berikan contoh"
    getExample() {
        let responseText = "";
        const page = this.currentContext.lastPageNumber;

        if (page === 1) {
            responseText = "**Contoh Soal Identifikasi:**\nSebutkan koefisien, variabel, dan konstanta dari bentuk aljabar: **7x - 9**\n\n**Penyelesaian:**\n1. **Variabel**-nya adalah huruf yang digunakan, yaitu: **x**\n2. **Koefisien** dari x adalah angka di depan x, yaitu: **7**\n3. **Konstanta**-nya adalah angka mandiri (jangan lupa tandanya!), yaitu: **-9**";
        } else if (page === 2) {
            responseText = "**Contoh Soal Penjumlahan & Pengurangan:**\nSederhanakan bentuk aljabar berikut: \n**5x + 3y - 2x + 7y**\n\n**Penyelesaian:**\n1. Kelompokkan suku-suku yang sejenis:\n   * Suku sejenis x: **5x** dan **-2x**\n   * Suku sejenis y: **3y** dan **7y**\n2. Gabungkan kelompok sejenis:\n   * (5x - 2x) = **3x**\n   * (3y + 7y) = **10y**\n3. Tulis bentuk sederhananya:\n   **3x + 10y**";
        } else if (page === 3) {
            responseText = "**Contoh Soal Sifat Distributif:**\nHitunglah hasil dari perkalian: **-3(2a - 5)**\n\n**Penyelesaian:**\n1. Kalikan suku luar (-3) dengan suku pertama (2a):\n   -3 * 2a = **-6a**\n2. Kalikan suku luar (-3) dengan suku kedua (-5):\n   -3 * -5 = **15** (negatif dikali negatif menjadi positif!)\n3. Gabungkan hasil perkaliannya:\n   **-6a + 15**";
        } else {
            responseText = "**Contoh Soal:**\nMisalkan kita menerapkan rumus dasar halaman " + page + " ke dalam variabel sederhana *x*:\n\n* Jika *x = 2*, maka hitungan menjadi: 2 * (x + 3) = 2 * (2 + 3) = 2 * 5 = **10**.\n* Menggunakan distributif: 2x + 6 = 2(2) + 6 = 4 + 6 = **10**.\nHasilnya terbukti sama!";
        }

        return {
            text: "📝 **Contoh Soal Terkait:**\n\n" + responseText,
            source: {
                title: this.currentContext.materialTitle,
                page: page
            }
        };
    },

    // Quick Action: "Beri saya petunjuk"
    getHint() {
        let responseText = "";
        const page = this.currentContext.lastPageNumber;

        if (page === 1) {
            responseText = "Ingat saja: \n* Jika ada hurufnya, itu **Variabel**. \n* Angka nempel di huruf itu **Koefisien**. \n* Angka jomblo sendirian tanpa huruf itu **Konstanta**.";
        } else if (page === 2) {
            responseText = "Petunjuk penting: Sebelum menjumlahkan, pakailah pensil warna untuk menandai suku yang sama. Lingkari semua suku *x* dengan warna merah, dan beri kotak pada suku *y* dengan warna biru. Hati-hati dengan tanda tambah atau kurang di depan angkanya, karena tanda tersebut milik angka di belakangnya!";
        } else if (page === 3) {
            responseText = "Untuk perkalian distributif, gambarlah tanda panah melengkung dari angka di luar kurung ke masing-masing angka/huruf di dalam kurung. Ini membantu memastikan Anda tidak lupa mengalikan bagian belakang kurung!";
        } else {
            responseText = "Coba perhatikan pola hubungan antar variabel di halaman " + page + ". Apakah polanya bertambah secara konstan atau memiliki pengali tertentu?";
        }

        return {
            text: "🔍 **Petunjuk Belajar:**\n\n" + responseText,
            source: {
                title: this.currentContext.materialTitle,
                page: page
            }
        };
    },

    // Quick Action: "Uji pemahaman saya"
    getQuiz() {
        const page = this.currentContext.lastPageNumber;
        let quiz = {};

        if (page === 1) {
            quiz = {
                id: 'quiz-1',
                question: "Pada bentuk aljabar **4x - 7**, manakah yang bertindak sebagai *koefisien*?",
                options: [
                    "A. x",
                    "B. 4",
                    "C. -7",
                    "D. 4x"
                ],
                correctIndex: 1, // B
                explanations: [
                    "Salah. **x** adalah variabel (simbol huruf).",
                    "Benar! **4** adalah koefisien karena merupakan angka pengali di depan variabel x.",
                    "Salah. **-7** adalah konstanta karena bilangan mandiri tanpa variabel.",
                    "Salah. **4x** adalah satu suku aljabar lengkap, bukan koefisien saja."
                ]
            };
        } else if (page === 2) {
            quiz = {
                id: 'quiz-2',
                question: "Sederhanakan bentuk aljabar berikut: **3a + 5b - a + 2b**",
                options: [
                    "A. 8a + 7b",
                    "B. 2a + 7b",
                    "C. 4a + 7b",
                    "D. 2a + 3b"
                ],
                correctIndex: 1, // B
                explanations: [
                    "Salah. Perhatikan pengurangan pada suku a: 3a - a = 2a (bukan 8a).",
                    "Benar! (3a - a) = 2a dan (5b + 2b) = 7b. Digabungkan menjadi 2a + 7b.",
                    "Salah. Ingat bahwa '- a' itu sama dengan '- 1a', jadi 3a - 1a = 2a (bukan 4a).",
                    "Salah. Perhatikan suku b: 5b + 2b = 7b (bukan 3b)."
                ]
            };
        } else {
            // Default or Page 3
            quiz = {
                id: 'quiz-3',
                question: "Tentukan bentuk sederhana dari perkalian distributif berikut: **5(2x - 3)**",
                options: [
                    "A. 10x - 3",
                    "B. 10x - 15",
                    "C. 7x - 15",
                    "D. 10x + 15"
                ],
                correctIndex: 1, // B
                explanations: [
                    "Salah. Anda lupa mengalikan angka 5 dengan suku kedua (-3).",
                    "Benar! Menggunakan distributif: 5 * 2x = 10x, dan 5 * -3 = -15. Menjadi 10x - 15.",
                    "Salah. Ingat operasi perkalian: 5 dikali 2x adalah 10x (bukan ditambah 5 + 2 = 7).",
                    "Salah. Perhatikan tanda negatif: 5 dikalikan -3 menghasilkan -15 (bukan +15)."
                ]
            };
        }

        // Return bot message with quiz payload
        return {
            text: "✏️ **Uji Pemahaman Mandiri:**\n\n" + quiz.question,
            quiz: quiz,
            source: {
                title: this.currentContext.materialTitle,
                page: page
            }
        };
    },

    // Generate structured bullet-point summary for a material (for left summary panel)
    generateSummaryBullets(material) {
        if (!material || !material.pages || material.pages.length === 0) {
            return [];
        }

        const bullets = [];

        // Overview bullet from material description
        if (material.description) {
            bullets.push({
                title: 'Gambaran Umum',
                text: material.description
            });
        }

        // One bullet per page — extract key concept from title + first sentence
        material.pages.forEach((page, idx) => {
            const content = page.content || '';
            // Extract first meaningful sentence (up to 160 chars)
            const firstSentenceMatch = content.match(/^([^.!?\n]{20,160}[.!?])/);
            const excerpt = firstSentenceMatch
                ? firstSentenceMatch[1].trim()
                : content.substring(0, 150).trim() + (content.length > 150 ? '…' : '');

            bullets.push({
                title: page.title || `Bagian ${idx + 1}`,
                text: excerpt
            });
        });

        // Key concepts: extract words that are capitalized/emphasized (simple heuristic)
        const allContent = material.pages.map(p => p.content).join(' ');
        const boldMatches = allContent.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
        const uniqueConcepts = [...new Set(boldMatches)]
            .filter(w => w.length > 4 && w.split(' ').length <= 3)
            .slice(0, 5);

        if (uniqueConcepts.length > 0) {
            bullets.push({
                title: 'Konsep Kunci',
                text: uniqueConcepts.join(' • ')
            });
        }

        return bullets;
    }
};

window.AIEngine = AIEngine;
