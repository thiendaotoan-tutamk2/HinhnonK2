/**
 * K2 MATH 3D LAB v4: GUIDED DISCOVERY EDITION
 * High-Precision Educational 3D Geometry Suite: Cone & Cylinder
 * Authors: Senior Three.js Developer & THCS Mathematics Digital Learning Specialists
 */

// ==========================================
// 1. PURE MATHEMATICAL CORE
// ==========================================
const MathCore = {
    getSlant: (r, h) => Math.hypot(r, h),
    getConeSectorAngleDeg: (r, h) => (360 * r) / Math.hypot(r, h),
    getConeSectorAngleRad: (r, h) => (2 * Math.PI * r) / Math.hypot(r, h),
    getBaseCircumference: (r) => 2 * Math.PI * r,
    getBaseArea: (r) => Math.PI * r * r,
    getConeVolume: (r, h) => (1 / 3) * Math.PI * r * r * h,
    getCylinderVolume: (r, h) => Math.PI * r * r * h,
    getConeLateralArea: (r, h) => Math.PI * r * Math.hypot(r, h),
    getConeTotalArea: (r, h) => Math.PI * r * (Math.hypot(r, h) + r),
    getCylinderLateralArea: (r, h) => 2 * Math.PI * r * h,
    getCylinderTotalArea: (r, h) => 2 * Math.PI * r * (h + r),
    getConeSliceRadius: (r, h, y) => r * Math.max(0, 1 - y / h),
    getCylinderSliceRadius: (r) => r
};

// ==========================================
// 2. STATE MACHINE
// ==========================================
const appState = {
    mode: 'volume', // 'volume' | 'net' | 'revolution' | 'section' | 'challenge'
    shape: 'cone',  // 'cone' | 'cylinder'
    unit: 'cm',     // 'cm' | 'dm' | 'm'
    
    // Shared dimensions
    r: 2.2,
    h: 6.6,
    get l() { return MathCore.getSlant(this.r, this.h); },
    get thetaDeg() { return MathCore.getConeSectorAngleDeg(this.r, this.h); },
    
    // Guided Discovery Step per mode (1: Predict, 2: Experiment, 3: Deduce, 4: Check)
    step: 1,
    predictions: {},

    // Volume Mode
    currentPour: 0,
    isVolumeAutoPlaying: false,
    volumeCompareActive: false,
    waterColor: '#0284c7',

    // Net Mode (True Continuous Unfolding)
    unfoldProgress: 0, // 0.0 (3D) to 1.0 (Flat)
    isUnfoldPlaying: false,
    netHighlightActive: false,

    // Revolution Mode (Angle Scrubbing & Sweep)
    revolveAngleDeg: 0,
    isRevolvePlaying: false,
    showTrajectory: true,
    showGhostProfiles: false,

    // Section Mode (Cross-sections)
    sectionType: 'horizontal', // 'horizontal' | 'axial'
    sectionYRatio: 0.5, // 0.0 to 1.0

    // Challenge Mode
    challengeStarted: false,
    currentQuestionIndex: 0,
    selectedOption: null,
    wrongAttempts: 0,
    score: 0,
    activeQuestions: [],

    // Options & Tools
    teacherMode: false,
    spotlightTarget: null,
    gridVisible: true,
    labelsVisible: true,
    autoRotate: false,
    reduceMotion: false,

    // Classroom Edition v5 Enhancements
    userRole: 'student', // 'student' | 'teacher'
    lessonStage: 1, // 1 to 7
    stageCompletions: [false, false, false, false, false, false, false],
    guidedCardVisible: true,
    soundEnabled: true,
    voiceEnabled: true,
    voiceAutoNarrate: true,
    voiceRate: 0.82,
    materialMode: 'solid', // 'solid' | 'wireframe' | 'transparent'
    explodeView: false,
    focusMode: false,
    formulaDisplayMode: 'quiz', // 'quiz' (student default) | 'full' (teacher default) | 'compact'
    discoveryJournal: [],

    // 3D Click Quiz Activity (Requirement 8)
    click3DQuizActive: false,
    currentClickTarget: null,
    clickWrongCount: 0,

    // Drag-and-drop Labels Activity (Requirement 9)
    dragLabelsScore: 0,
    placedLabels: {},

    // Formula Puzzle Activity (Requirement 10 & 11)
    puzzleTarget: 'v_cone',
    puzzlePlacedTokens: [],
    puzzleWrongCount: 0,
    puzzleHintCount: 3,

    // Real World Model (Requirement 13, 14, 15)
    activeRealWorldApp: 'can',

    // Achievements
    achievements: {
        volume: false,
        net: false,
        revolution: false,
        section: false,
        challenge: false,
        puzzleMaster: false,
        labelMaster: false,
        clickMaster: false
    }
};

// ==========================================
// 2B. SYNTHESIZED WEB AUDIO ENGINE
// ==========================================
const AudioEngine = {
    ctx: null,
    init() {
        if (!this.ctx && typeof (window.AudioContext || window.webkitAudioContext) !== 'undefined') {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    playTone(freq, type, duration, gainVal = 0.08) {
        if (!appState.soundEnabled) return;
        try {
            this.init();
            if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch(e) {}
    },
    click() { this.playTone(850, 'sine', 0.04, 0.04); },
    pour(duration = 1.6) {
        if (!appState.soundEnabled) return;
        try {
            this.init();
            if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
            if (!this.ctx) return;
            const bufferSize = Math.floor(this.ctx.sampleRate * Math.min(2.5, duration));
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.12;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(500, this.ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + duration);
            filter.Q.value = 3.0;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.16, this.ctx.currentTime + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start();
            noise.stop(this.ctx.currentTime + duration);
        } catch(e) {}
    },
    success() {
        if (!appState.soundEnabled) return;
        setTimeout(() => this.playTone(523.25, 'sine', 0.12, 0.08), 0);
        setTimeout(() => this.playTone(659.25, 'sine', 0.12, 0.08), 90);
        setTimeout(() => this.playTone(783.99, 'sine', 0.22, 0.1), 180);
    },
    wrong() {
        if (!appState.soundEnabled) return;
        setTimeout(() => this.playTone(330, 'triangle', 0.12, 0.07), 0);
        setTimeout(() => this.playTone(260, 'triangle', 0.18, 0.07), 100);
    },
    step() { this.playTone(620, 'sine', 0.06, 0.05); },
    fanfare() {
        if (!appState.soundEnabled) return;
        [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
            setTimeout(() => this.playTone(f, 'triangle', 0.25, 0.08), idx * 110);
        });
    }
};

// ==========================================
// 2C. VIETNAMESE VOICE NARRATOR (THUYẾT MINH GIỌNG NÓI CÁC CHẶNG - CHẬM RÃI, MƯỢT MÀ)
// ==========================================
const STAGE_VOICE_SCRIPTS = {
    1: {
        1: "Chào mừng các em đến với Chặng 1: Cấu tạo hình nón. Em hãy quan sát các yếu tố cơ bản của hình nón: đỉnh S, tâm đáy O, bán kính đáy r, chiều cao h, và đường sinh l. Em có thể xoay mô hình ba chiều để quan sát rõ hơn từ mọi phía.",
        2: "Bước 2: Thay đổi kích thước. Em hãy kéo thanh trượt bán kính r và chiều cao h, để theo dõi sự thay đổi hình dạng của hình nón, và độ dài đường sinh l tương ứng.",
        3: "Bước 3: Tam giác vuông S, O, B và hệ thức Pi-ta-go. Khi cắt dọc hình nón qua trục S, O, ta thu được tam giác S, O, B vuông tại O. Theo định lý Pi-ta-go: Cạnh huyền S, B bình phương bằng S, O bình phương cộng O, B bình phương. Tức là, đường sinh l bình phương, bằng r bình phương cộng h bình phương.",
        4: "Chúc mừng em! Em đã hoàn thành xuất sắc Chặng 1, nắm vững cấu tạo và hệ thức Pi-ta-go của hình nón."
    },
    2: {
        1: "Chặng 2: Quay tạo khối không gian. Em hãy quan sát và dự đoán: Khi quay một tam giác vuông S, O, B quanh trục cố định S, O đúng một vòng ba trăm sáu mươi độ, hình phẳng này sẽ quét nên khối hình học nào?",
        2: "Bước 2: Thao tác quay trực quan. Em hãy bấm nút Quay ngay, hoặc kéo góc quay từ không độ lên ba trăm sáu mươi độ. Hãy quan sát duy nhất một tam giác vuông S, O, B quay quanh trục S, O để quét nên toàn bộ hình nón.",
        3: "Kết luận Chặng 2: Khi quay tam giác vuông quanh một cạnh góc vuông: Cạnh góc vuông S, O nằm trên trục quay. Cạnh góc vuông O, B quét nên hình tròn đáy. Và cạnh huyền S, B quét nên toàn bộ mặt xung quanh của hình nón."
    },
    3: {
        1: "Chặng 3: Khai triển phẳng và cung quạt. Em hãy chú ý đường nét đứt màu đỏ dọc theo đường sinh S, B của hình nón. Hãy dự đoán xem, khi cắt dọc đường sinh này và trải phẳng ra, mặt xung quanh của hình nón sẽ là hình phẳng nào?",
        2: "Bước 2: Thao tác trải phẳng. Em hãy bấm nút Khai triển tự động, hoặc kéo thanh trượt từ không đến một trăm phần trăm, để quan sát quá trình biến đổi liên tục từ hình nón ba chiều mở dần thành hình quạt tròn phẳng hai chiều.",
        3: "Kết luận Chặng 3: Mặt xung quanh của hình nón khi trải phẳng là một hình quạt tròn. Hình quạt này có bán kính đúng bằng độ dài đường sinh l, và độ dài cung quạt đúng bằng chu vi đáy, hai nhân pi nhân r."
    },
    4: {
        1: "Chặng 4: Diện tích hình nón. Diện tích xung quanh của hình nón bằng pi nhân r nhân l. Diện tích toàn phần bằng diện tích xung quanh cộng diện tích đáy, tức là pi nhân r nhân l, cộng pi nhân r bình phương.",
        2: "Bước 2: Luyện tập tính diện tích. Em hãy vận dụng các công thức vừa học để tính diện tích xung quanh và diện tích toàn phần, rồi chọn đáp án chính xác.",
        3: "Chúc mừng em! Em đã hoàn thành xuất sắc Chặng 4 về diện tích hình nón."
    },
    5: {
        1: "Chặng 5: Thể tích và thí nghiệm rót nước. Đặt cạnh nhau một hình nón và một hình trụ có cùng bán kính đáy r và cùng chiều cao h. Em hãy dự đoán xem, cần đổ bao nhiêu hình nón đầy nước thì vừa vặn làm đầy hình trụ?",
        2: "Bước 2: Tiến hành thí nghiệm rót nước. Em hãy bấm nút Rót nước từng lần một. Quan sát nước từ hình nón rót sang hình trụ và theo dõi mực nước dâng lên: một phần ba, hai phần ba, rồi đầy bình.",
        3: "Kết luận Chặng 5: Thí nghiệm thực tế chứng minh: Cần đúng ba hình nón đầy nước để làm đầy một hình trụ có cùng đáy và cùng chiều cao. Do đó, thể tích hình nón bằng một phần ba thể tích hình trụ, tức là V bằng một phần ba nhân pi nhân r bình phương nhân h."
    },
    6: {
        1: "Chặng 6: Thiết diện và mặt cắt không gian. Khi dùng mặt phẳng cắt hình nón: Mặt phẳng cắt song song với đáy cho thiết diện là hình tròn. Mặt phẳng cắt dọc đi qua trục đối xứng cho thiết diện là một tam giác cân tại đỉnh S.",
        2: "Bước 2: Câu hỏi củng cố. Em hãy quan sát mô hình không gian và chọn khẳng định chính xác về thiết diện qua trục của hình nón.",
        3: "Chúc mừng em! Em đã hiểu rõ các dạng mặt cắt không gian của hình nón."
    },
    7: {
        1: "Chặng 7: Đấu trường thử thách và vận dụng tổng hợp. Em hãy quan sát sơ đồ tổng kết kiến thức, theo dõi mô hình 3D trực quan và hoàn thành 5 câu hỏi thử thách cùng các hoạt động thực tế. Chúc em chinh phục trọn vẹn điểm số!"
    }
};

const MODE_VOICE_SCRIPTS = {
    structure: "Chế độ cấu tạo và định lý Pi-ta-go. Hình nón gồm đỉnh S, đáy là hình tròn tâm O bán kính r. Đoạn thẳng S, O vuông góc với mặt đáy gọi là chiều cao h. Đoạn thẳng nối đỉnh S với một điểm bất kỳ trên đường tròn đáy, như đoạn S, B, gọi là đường sinh l. Trong tam giác vuông S, O, B vuông tại O, theo định lý Pi-ta-go: l bình phương bằng r bình phương cộng h bình phương.",
    volume: "Khám phá thể tích hình nón qua thí nghiệm rót nước. Khi so sánh một hình nón và một hình trụ có cùng bán kính đáy r và cùng chiều cao h: Dung tích của hình nón đúng bằng một phần ba dung tích của hình trụ. Cần đúng ba lần rót một hình nón đầy nước để làm đầy hoàn toàn hình trụ. Do đó, công thức thể tích hình nón là: V bằng một phần ba nhân pi nhân r bình phương nhân h.",
    net: "Khai triển mặt xung quanh của hình nón. Khi cắt dọc theo đường sinh S, B và trải phẳng lên mặt phẳng, mặt xung quanh của hình nón trở thành một hình quạt tròn có bán kính đúng bằng đường sinh l. Độ dài cung của hình quạt bằng đúng chu vi đáy của hình nón, tức là hai nhân pi nhân r. Do đó, diện tích xung quanh của hình nón bằng pi nhân r nhân l.",
    revolution: "Quay hình phẳng quanh trục tạo khối tròn xoay. Khi quay tam giác vuông S, O, B quanh cạnh góc vuông S, O cố định đúng một vòng ba trăm sáu mươi độ: Cạnh góc vuông S, O tạo thành trục và chiều cao của hình nón. Cạnh góc vuông O, B quét nên hình tròn đáy bán kính r. Và cạnh huyền S, B quét nên toàn bộ mặt xung quanh của hình nón.",
    section: "Mặt cắt không gian của hình nón. Khi dùng mặt phẳng cắt hình nón: Thứ nhất, mặt phẳng cắt song song với mặt đáy cho thiết diện là một hình tròn đồng dạng với đáy, bán kính thu nhỏ dần khi lát cắt tiến gần về đỉnh S. Thứ hai, mặt phẳng cắt đi qua trục S, O cho thiết diện là một tam giác cân tại đỉnh S, có hai cạnh bên bằng đường sinh l và đáy bằng đường kính hai r.",
    compare: "So sánh song song giữa hình nón và hình trụ. Khi có cùng bán kính đáy r và chiều cao h: Hình trụ có hai đáy bằng nhau với tổng diện tích hai pi r bình phương, trong khi hình nón chỉ có một đáy. Thể tích hình trụ bằng pi r bình phương nhân h, gấp đúng ba lần thể tích hình nón. Tỉ lệ thể tích giữa hình nón và hình trụ là một chia ba.",
    challenge: "Đấu trường kiến thức và thử thách toán học. Hãy vận dụng các công thức về đường sinh, diện tích xung quanh, diện tích toàn phần và thể tích để chinh phục các câu hỏi thử thách."
};

const VoiceNarrator = {
    synth: (typeof window !== 'undefined' && 'speechSynthesis' in window) ? window.speechSynthesis : null,
    isSpeaking: false,
    vietnameseVoice: null,
    _autoTimer: null,
    _activeUtterance: null,
    _heartbeatTimer: null,
    rate: 0.82, // Tốc độ chuẩn sư phạm chậm rãi, êm ái, rõ từng âm tiết

    init() {
        if (!this.synth) return;
        this.rate = (typeof appState !== 'undefined' && appState.voiceRate) ? appState.voiceRate : 0.82;
        this.loadVoices();
        if (typeof this.synth.onvoiceschanged !== 'undefined') {
            this.synth.onvoiceschanged = () => this.loadVoices();
        }
    },

    loadVoices() {
        if (!this.synth) return;
        try {
            const voices = this.synth.getVoices();
            if (!voices || voices.length === 0) return;
            // Ưu tiên giọng tiếng Việt tự nhiên/online chất lượng cao
            const viVoices = voices.filter(v => v.lang && (v.lang.toLowerCase().startsWith('vi') || v.lang.toLowerCase().includes('vie')));
            if (viVoices.length > 0) {
                const natural = viVoices.find(v => {
                    const n = v.name.toLowerCase();
                    return n.includes('natural') || n.includes('online') || n.includes('hoaimy') || n.includes('namminh');
                });
                const google = viVoices.find(v => v.name.toLowerCase().includes('google'));
                const def = viVoices.find(v => v.default);
                this.vietnameseVoice = natural || google || def || viVoices[0];
            }
        } catch(e) {}
    },

    getRateLabel() {
        const r = this.rate || (typeof appState !== 'undefined' ? appState.voiceRate : 0.82) || 0.82;
        if (r <= 0.79) return '0.78x (Chậm rãi)';
        if (r <= 0.85) return '0.82x (Chậm rõ)';
        return '0.90x (Vừa phải)';
    },

    cleanTextForSpeech(raw) {
        if (!raw) return '';
        // 1. Loại bỏ các thẻ HTML, script, style
        let t = raw.replace(/<style[\s\S]*?<\/style>/gi, ' ')
                   .replace(/<script[\s\S]*?<\/script>/gi, ' ')
                   .replace(/<[^>]*>/g, ' ');

        // 2. Chuyển đổi ký tự thực thể HTML
        t = t.replace(/&nbsp;/g, ' ')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&approx;/g, ' xấp xỉ ')
             .replace(/&pi;/g, ' pi ')
             .replace(/&times;/g, ' nhân ')
             .replace(/&plusmn;/g, ' cộng trừ ');

        // 3. Chuẩn hóa đỉnh và tên hình học tiếng Việt: tách dấu phẩy để giọng đọc từng chữ cái tự nhiên
        t = t.replace(/\bSOB\b/g, 'S, O, B')
             .replace(/\bSAB\b/g, 'S, A, B')
             .replace(/\bSOA\b/g, 'S, O, A')
             .replace(/\bSO\b/g, 'S, O')
             .replace(/\bOB\b/g, 'O, B')
             .replace(/\bOA\b/g, 'O, A')
             .replace(/\bSB\b/g, 'S, B')
             .replace(/\bSA\b/g, 'S, A')
             .replace(/\bAB\b/g, 'A, B')
             .replace(/\bBC\b/g, 'B, C')
             .replace(/\bCD\b/g, 'C, D')
             .replace(/\bDA\b/g, 'D, A')
             .replace(/\bOABC\b/g, 'O, A, B, C')
             .replace(/O'/g, 'O phẩy')
             .replace(/S'/g, 'S phẩy');

        // 4. Phân số
        t = t.replace(/1\/3/g, 'một phần ba')
             .replace(/2\/3/g, 'hai phần ba')
             .replace(/3\/4/g, 'ba phần tư')
             .replace(/1\/2/g, 'một phần hai');

        // 5. Hệ thức và công thức toán học Hình học 9
        t = t.replace(/l²\s*=\s*r²\s*\+\s*h²/g, 'đường sinh l bình phương, bằng r bình phương cộng h bình phương')
             .replace(/h²\s*=\s*l²\s*-\s*r²/g, 'chiều cao h bình phương, bằng l bình phương trừ r bình phương')
             .replace(/r²\s*=\s*l²\s*-\s*h²/g, 'bán kính r bình phương, bằng l bình phương trừ h bình phương')
             .replace(/l\s*=\s*√\(r²\s*\+\s*h²\)/g, 'l bằng căn bậc hai của r bình phương cộng h bình phương')
             .replace(/V\s*=\s*1\/3\s*πr²h/g, 'thể tích V bằng một phần ba nhân pi nhân r bình phương nhân h')
             .replace(/V\s*=\s*πr²h/g, 'thể tích V bằng pi nhân r bình phương nhân h')
             .replace(/Sxq\s*=\s*πrl/g, 'diện tích xung quanh bằng pi nhân r nhân l')
             .replace(/Stp\s*=\s*πrl\s*\+\s*πr²/g, 'diện tích toàn phần bằng diện tích xung quanh cộng diện tích đáy')
             .replace(/2πr/g, 'hai nhân pi nhân r')
             .replace(/πr²h/g, 'pi nhân r bình phương nhân h')
             .replace(/πr²/g, 'pi nhân r bình phương')
             .replace(/πrl/g, 'pi nhân r nhân l')
             .replace(/r²/g, 'r bình phương')
             .replace(/h²/g, 'h bình phương')
             .replace(/l²/g, 'l bình phương')
             .replace(/\bSxq\b|\bS_xq\b/g, 'diện tích xung quanh')
             .replace(/\bStp\b|\bS_tp\b/g, 'diện tích toàn phần')
             .replace(/\bV_nón\b|\bVnón\b/g, 'thể tích hình nón')
             .replace(/\bV_trụ\b|\bVtrụ\b/g, 'thể tích hình trụ');

        // 6. Góc và độ
        t = t.replace(/360°/g, 'ba trăm sáu mươi độ')
             .replace(/270°/g, 'hai trăm bảy mươi độ')
             .replace(/180°/g, 'một trăm tám mươi độ')
             .replace(/120°/g, 'một trăm hai mươi độ')
             .replace(/90°/g, 'chín mươi độ')
             .replace(/60°/g, 'sáu mươi độ')
             .replace(/45°/g, 'bốn mươi lăm độ')
             .replace(/30°/g, 'ba mươi độ')
             .replace(/0°/g, 'không độ')
             .replace(/(\d+)°/g, '$1 độ');

        // 7. Đơn vị và không gian
        t = t.replace(/\b2D\b/g, 'hai chiều')
             .replace(/\b3D\b/g, 'ba chiều')
             .replace(/cm³/g, ' xăng-ti-mét khối')
             .replace(/cm²/g, ' xăng-ti-mét vuông')
             .replace(/\bcm\b/g, ' xăng-ti-mét')
             .replace(/dm³/g, ' đề-xi-mét khối')
             .replace(/dm²/g, ' đề-xi-mét vuông')
             .replace(/\bdm\b/g, ' đề-xi-mét')
             .replace(/m³/g, ' mét khối')
             .replace(/m²/g, ' mét vuông')
             .replace(/\bmm\b/g, ' mi-li-mét');

        // 8. Ký hiệu toán học
        t = t.replace(/π/g, ' pi ')
             .replace(/≈/g, ' xấp xỉ ')
             .replace(/⇒/g, ' suy ra ')
             .replace(/⇔/g, ' tương đương ')
             .replace(/[·×*]/g, ' nhân ')
             .replace(/÷/g, ' chia ')
             .replace(/±/g, ' cộng trừ ')
             .replace(/%/g, ' phần trăm ');

        // 9. Lọc bỏ emoji, biểu tượng UI và ký tự đặc biệt
        t = t.replace(/[🤔🎉💡🌟✓★✂🔊🔇✎⚙📐📏🔍⚠️👑✨🏆🥫⚗️🏭🌾🍦❓🏅🧩🏷️📒]/g, ' ')
             .replace(/[{}\[\]_]/g, ' ')
             .replace(/\s+/g, ' ')
             .trim();

        return t;
    },

    speak(text, onEnd) {
        if (!this.synth || !appState.voiceEnabled) return;
        this.stop();
        const clean = this.cleanTextForSpeech(text);
        if (!clean) return;

        // Trì hoãn ngắn để tránh lỗi kẹt audio buffer trên Chromium
        setTimeout(() => {
            if (!appState.voiceEnabled) return;
            try {
                const utter = new SpeechSynthesisUtterance(clean);
                utter.lang = 'vi-VN';
                if (this.vietnameseVoice) {
                    utter.voice = this.vietnameseVoice;
                }
                const rateVal = this.rate || (typeof appState !== 'undefined' ? appState.voiceRate : 0.82) || 0.82;
                utter.rate = rateVal; // Chậm rãi, êm dịu sư phạm (mặc định 0.82)
                utter.pitch = 1.0;

                this._activeUtterance = utter; // Ngăn V8 thu gom rác ngắt quãng âm thanh

                utter.onstart = () => {
                    this.isSpeaking = true;
                    this.updateUI(true);
                    // Heartbeat chống Chromium tự đóng ngắt sau 14 giây
                    clearInterval(this._heartbeatTimer);
                    this._heartbeatTimer = setInterval(() => {
                        if (this.synth && this.isSpeaking) {
                            if (this.synth.speaking) {
                                this.synth.pause();
                                this.synth.resume();
                            }
                        } else {
                            clearInterval(this._heartbeatTimer);
                        }
                    }, 10000);
                };

                utter.onend = () => {
                    clearInterval(this._heartbeatTimer);
                    this._activeUtterance = null;
                    this.isSpeaking = false;
                    this.updateUI(false);
                    if (onEnd) onEnd();
                };

                utter.onerror = () => {
                    clearInterval(this._heartbeatTimer);
                    this._activeUtterance = null;
                    this.isSpeaking = false;
                    this.updateUI(false);
                };

                // Tiếp tục synth nếu đang bị trình duyệt tạm dừng
                if (this.synth.paused) {
                    this.synth.resume();
                }

                this.synth.speak(utter);
            } catch(e) {
                this._activeUtterance = null;
                this.isSpeaking = false;
                this.updateUI(false);
            }
        }, 60);
    },

    stop() {
        if (this._autoTimer) {
            clearTimeout(this._autoTimer);
            this._autoTimer = null;
        }
        clearInterval(this._heartbeatTimer);
        this._heartbeatTimer = null;
        this._activeUtterance = null;
        if (this.synth) {
            try { this.synth.cancel(); } catch(e) {}
        }
        this.isSpeaking = false;
        this.updateUI(false);
    },

    toggle() {
        if (this.isSpeaking) {
            this.stop();
            showToast('🔇 Đã dừng đọc thuyết minh');
        } else {
            this.speakCurrentStep();
            showToast('🔊 Đang đọc thuyết minh bài học (Tốc độ ' + this.getRateLabel() + ')');
        }
    },

    updateUI(speaking) {
        const btn = document.getElementById('lw-btn-speak');
        const icon = document.getElementById('lw-speak-icon');
        if (btn && icon) {
            if (speaking) {
                btn.classList.add('bg-amber-500', 'text-slate-950', 'animate-pulse');
                btn.classList.remove('bg-slate-800', 'text-amber-300');
                icon.className = 'ph-fill ph-speaker-simple-high text-[11px]';
                btn.title = 'Đang đọc thuyết minh... (Bấm để dừng)';
            } else {
                btn.classList.remove('bg-amber-500', 'text-slate-950', 'animate-pulse');
                btn.classList.add('bg-slate-800', 'text-amber-300');
                icon.className = 'ph-bold ph-speaker-high text-[11px]';
                btn.title = 'Nghe đọc thuyết minh bài học (Bấm để Đọc / Dừng)';
            }
        }
        document.querySelectorAll('.btn-step-speak').forEach(b => {
            if (speaking) {
                b.innerHTML = '<i class="ph-fill ph-speaker-simple-high text-xs animate-pulse text-amber-300"></i><span class="text-amber-300 font-black">Dừng đọc</span>';
            } else {
                b.innerHTML = '<i class="ph-bold ph-speaker-high text-xs"></i><span>Nghe giảng</span>';
            }
        });
        document.querySelectorAll('.btn-mode-speak').forEach(b => {
            if (speaking) {
                b.innerHTML = '<i class="ph-fill ph-speaker-simple-high text-xs animate-pulse text-amber-300"></i><span class="text-amber-300 font-black">Dừng</span>';
            } else {
                b.innerHTML = '<i class="ph-bold ph-speaker-high text-xs"></i><span>Nghe giảng</span>';
            }
        });
    },

    speakCurrentStep() {
        const stage = (typeof lessonState !== 'undefined') ? lessonState.currentStageIndex : 1;
        const step = (typeof lessonState !== 'undefined') ? lessonState.currentStepIndex : 1;

        let textToRead = '';
        if (STAGE_VOICE_SCRIPTS[stage] && STAGE_VOICE_SCRIPTS[stage][step]) {
            textToRead = STAGE_VOICE_SCRIPTS[stage][step];
        } else {
            const stageInfo = (typeof LESSON_STAGES !== 'undefined') ? LESSON_STAGES[stage - 1] : null;
            if (stageInfo) textToRead += `${stageInfo.title}. Bước ${step}. `;
            const card = document.getElementById('guided-discovery-card');
            if (card) {
                const clone = card.cloneNode(true);
                clone.querySelectorAll('button').forEach(b => b.remove());
                textToRead += clone.innerText;
            }
        }
        this.speak(textToRead);
    }
};

// Initialize voice narrator
VoiceNarrator.init();

function toggleSpeechForCurrentStep() {
    if (typeof VoiceNarrator !== 'undefined') {
        VoiceNarrator.toggle();
    }
}
window.toggleSpeechForCurrentStep = toggleSpeechForCurrentStep;

function toggleModeNarration(modeKey) {
    if (!modeKey) modeKey = (typeof appState !== 'undefined') ? appState.mode : 'structure';
    if (VoiceNarrator.isSpeaking) {
        VoiceNarrator.stop();
        showToast('🔇 Đã dừng đọc thuyết minh');
    } else {
        const text = MODE_VOICE_SCRIPTS[modeKey] || MODE_VOICE_SCRIPTS[(typeof appState !== 'undefined' ? appState.mode : 'structure')];
        if (text) {
            VoiceNarrator.speak(text);
            showToast('🔊 Đang đọc thuyết minh: ' + getModeTitle(modeKey));
        }
    }
}
window.toggleModeNarration = toggleModeNarration;

function getModeTitle(m) {
    const map = {
        structure: 'Cấu tạo & Pythagore',
        volume: 'Thí nghiệm thể tích',
        net: 'Khai triển phẳng',
        revolution: 'Quay tạo khối',
        section: 'Mặt cắt không gian',
        compare: 'So sánh Nón & Trụ',
        challenge: 'Đấu trường kiến thức'
    };
    return map[m] || m;
}
window.getModeTitle = getModeTitle;

function speakStudentQuestion() {
    if (typeof STUDENT_QUESTIONS !== 'undefined' && typeof currentStudentQIdx !== 'undefined') {
        const item = STUDENT_QUESTIONS[currentStudentQIdx];
        if (item && item.q) {
            VoiceNarrator.speak('Câu hỏi thảo luận cho học sinh: ' + item.q);
            showToast('🔊 Đang đọc câu hỏi thảo luận');
        }
    }
}
window.speakStudentQuestion = speakStudentQuestion;

function speakStudentAnswer() {
    if (typeof STUDENT_QUESTIONS !== 'undefined' && typeof currentStudentQIdx !== 'undefined') {
        const item = STUDENT_QUESTIONS[currentStudentQIdx];
        if (item && item.a) {
            VoiceNarrator.speak(item.a);
            showToast('🔊 Đang đọc đáp án');
        }
    }
}
window.speakStudentAnswer = speakStudentAnswer;

function speakCurrentMeasurement() {
    const textEl = document.getElementById('measure-readout-text');
    if (textEl) {
        const txt = textEl.innerText.trim();
        if (txt && !txt.includes('Nhấp điểm thứ nhất')) {
            VoiceNarrator.speak('Kết quả đo ba chiều: ' + txt);
        } else {
            VoiceNarrator.speak('Thước đo ba chiều trực tiếp. Em hãy nhấp điểm thứ nhất trên mô hình như điểm S, O, hoặc B để bắt đầu đo.');
        }
    }
}
window.speakCurrentMeasurement = speakCurrentMeasurement;

function speakFormulaCompareSummary() {
    const text = 'Bảng so sánh công thức hình nón và hình trụ. Thứ nhất: Quan hệ đường sinh, trong hình nón đường sinh l bằng căn bậc hai của r bình phương cộng h bình phương; trong hình trụ đường sinh l bằng chiều cao h. Thứ hai: Diện tích đáy, hình nón có một đáy bằng pi r bình phương, hình trụ có hai đáy bằng hai pi r bình phương. Thứ ba: Diện tích xung quanh, hình nón bằng pi r nhân l, hình trụ bằng hai pi r nhân h. Thứ tư: Thể tích, thể tích hình nón bằng một phần ba pi r bình phương nhân h, thể tích hình trụ bằng pi r bình phương nhân h. Thể tích hình trụ gấp đúng ba lần thể tích hình nón khi cùng bán kính đáy và chiều cao.';
    VoiceNarrator.speak(text);
    showToast('🔊 Đang đọc tóm tắt so sánh công thức Nón & Trụ');
}
window.speakFormulaCompareSummary = speakFormulaCompareSummary;

function speakDiarySummary() {
    const count = (typeof appState !== 'undefined' && appState.discoveryJournal) ? appState.discoveryJournal.length : 0;
    const total = (typeof DISCOVERY_ENTRIES !== 'undefined') ? DISCOVERY_ENTRIES.length : 8;
    let text = `Nhật ký khám phá toán học. Em đã mở khóa được ${count} trên tổng số ${total} định lý. `;
    if (count === 0) {
        text += 'Em hãy tiếp tục thực hiện các thí nghiệm trong bài học để tự động mở khóa các định lý mới nhé!';
    } else if (typeof DISCOVERY_ENTRIES !== 'undefined') {
        const unlockedTitles = DISCOVERY_ENTRIES
            .filter(e => appState.discoveryJournal.includes(e.id))
            .map(e => e.title)
            .join(', ');
        text += `Các định lý đã ghi gồm có: ${unlockedTitles}.`;
    }
    VoiceNarrator.speak(text);
    showToast('🔊 Đang đọc tóm tắt Nhật ký khám phá');
}
window.speakDiarySummary = speakDiarySummary;

function speakDiscoveryEntry(entryId, event) {
    if (event) event.stopPropagation();
    if (typeof DISCOVERY_ENTRIES !== 'undefined') {
        const item = DISCOVERY_ENTRIES.find(e => e.id === entryId);
        if (item) {
            VoiceNarrator.speak(`${item.title}. Công thức: ${item.formula}. Ý nghĩa: ${item.explanation}`);
            showToast(`🔊 Đang đọc định lý: ${item.title}`);
        }
    }
}
window.speakDiscoveryEntry = speakDiscoveryEntry;

function speakFormulaPuzzleMission() {
    if (typeof FORMULA_PUZZLES !== 'undefined' && typeof appState !== 'undefined') {
        const puz = FORMULA_PUZZLES[appState.puzzleTarget];
        if (puz) {
            VoiceNarrator.speak(`Nhiệm vụ ghép công thức: ${puz.title}. Gợi ý cho em: ${puz.hint1}`);
            showToast('🔊 Đang đọc nhiệm vụ ghép công thức');
        }
    }
}
window.speakFormulaPuzzleMission = speakFormulaPuzzleMission;

function speakCurrentRealWorldApp() {
    if (typeof REAL_WORLD_MODELS !== 'undefined' && typeof appState !== 'undefined') {
        const m = REAL_WORLD_MODELS[appState.activeRealWorldApp || 'can'];
        if (m) {
            const text = `Ứng dụng thực tế: ${m.title}. Bán kính r bằng ${m.r} ${m.unit}, chiều cao h bằng ${m.h} ${m.unit}${m.l ? `, đường sinh l bằng ${m.l} ${m.unit}` : ''}. Bài toán: ${m.problem}. Tính toán: ${m.calc1}. ${m.calc2}.${m.calc3 ? ' ' + m.calc3 : ''} Ứng dụng kỹ thuật: ${m.practicalTip}`;
            VoiceNarrator.speak(text);
            showToast(`🔊 Đang thuyết minh ứng dụng: ${m.title}`);
        }
    }
}
window.speakCurrentRealWorldApp = speakCurrentRealWorldApp;

function speak3DClickPrompt() {
    if (typeof CLICK_TARGETS !== 'undefined' && typeof appState !== 'undefined') {
        const tObj = CLICK_TARGETS[appState.currentClickTarget || 'slant'];
        if (tObj) {
            VoiceNarrator.speak(tObj.prompt);
            showToast('🔊 Đang đọc yêu cầu tương tác');
        }
    }
}
window.speak3DClickPrompt = speak3DClickPrompt;

function speakDragLabelsInstructions() {
    VoiceNarrator.speak('Kéo và gắn nhãn cấu tạo hình học. Em hãy nhấp vào một nhãn ở hàng trên như Bán kính r, Chiều cao h, hay Đường sinh l, sau đó nhấp vào ô mô tả vị trí cấu tạo tương ứng ở bảng bên dưới.');
    showToast('🔊 Đang đọc hướng dẫn gắn nhãn');
}
window.speakDragLabelsInstructions = speakDragLabelsInstructions;

function speakChallengeCurrentQuestion() {
    if (typeof appState !== 'undefined' && appState.activeQuestions && appState.activeQuestions[appState.currentQuestionIndex]) {
        const q = appState.activeQuestions[appState.currentQuestionIndex];
        const optionsText = q.options.map((opt, i) => `Phương án ${String.fromCharCode(65 + i)}: ${opt}`).join('. ');
        VoiceNarrator.speak(`Câu hỏi số ${appState.currentQuestionIndex + 1}: ${q.q}. ${optionsText}`);
        showToast(`🔊 Đang đọc câu hỏi số ${appState.currentQuestionIndex + 1}`);
    }
}
window.speakChallengeCurrentQuestion = speakChallengeCurrentQuestion;

function toggleVoiceNarrationSetting() {
    appState.voiceEnabled = !appState.voiceEnabled;
    if (!appState.voiceEnabled) {
        VoiceNarrator.stop();
    }
    const valSpan = document.getElementById('voice-setting-val');
    if (valSpan) {
        valSpan.innerText = appState.voiceEnabled ? 'Bật' : 'Tắt';
        valSpan.className = appState.voiceEnabled ? 'font-bold text-amber-300' : 'font-bold text-slate-400';
    }
    persistState();
    showToast(appState.voiceEnabled ? '🔊 Đã bật thuyết minh giọng nói' : '🔇 Đã tắt thuyết minh giọng nói');
}

function toggleVoiceSpeedSetting() {
    if (!appState.voiceRate) appState.voiceRate = 0.82;
    if (appState.voiceRate >= 0.89) {
        appState.voiceRate = 0.78; // Chậm rãi
    } else if (appState.voiceRate >= 0.81) {
        appState.voiceRate = 0.90; // Vừa phải
    } else {
        appState.voiceRate = 0.82; // Tiêu chuẩn êm dịu chậm rõ
    }
    if (typeof VoiceNarrator !== 'undefined') {
        VoiceNarrator.rate = appState.voiceRate;
    }
    updateVoiceSpeedUI();
    persistState();
    showToast(`🎙 Tốc độ thuyết minh: ${VoiceNarrator.getRateLabel()}`);
}
window.toggleVoiceSpeedSetting = toggleVoiceSpeedSetting;

function updateVoiceSpeedUI() {
    const span = document.getElementById('voice-speed-val');
    if (span && typeof VoiceNarrator !== 'undefined') {
        span.innerText = VoiceNarrator.getRateLabel();
    }
}

// World coordinate anchors
const POS = {
    volumeCylX: -3.4,
    volumeConeX: 3.4,
    netCenterX: 0,
    revCenterX: 0,
    sectionCenterX: 0
};

// Load saved preferences if available
function loadPersistedState() {
    try {
        const saved = localStorage.getItem('k2_math_lab_v4_state');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.r) appState.r = data.r;
            if (data.h) appState.h = data.h;
            if (data.unit) appState.unit = data.unit;
            if (data.gridVisible !== undefined) appState.gridVisible = data.gridVisible;
            if (data.labelsVisible !== undefined) appState.labelsVisible = data.labelsVisible;
            if (data.reduceMotion !== undefined) appState.reduceMotion = data.reduceMotion;
            if (data.achievements) appState.achievements = data.achievements;
            if (data.voiceEnabled !== undefined) appState.voiceEnabled = data.voiceEnabled;
            if (data.voiceAutoNarrate !== undefined) appState.voiceAutoNarrate = data.voiceAutoNarrate;
            if (data.voiceRate !== undefined) {
                appState.voiceRate = data.voiceRate;
                if (typeof VoiceNarrator !== 'undefined') VoiceNarrator.rate = data.voiceRate;
            }
        }
    } catch (e) {
        console.warn('localStorage read skipped');
    }
    updateVoiceSpeedUI();
}
loadPersistedState();

function persistState() {
    try {
        localStorage.setItem('k2_math_lab_v4_state', JSON.stringify({
            r: appState.r,
            h: appState.h,
            unit: appState.unit,
            gridVisible: appState.gridVisible,
            labelsVisible: appState.labelsVisible,
            reduceMotion: appState.reduceMotion,
            achievements: appState.achievements,
            voiceEnabled: appState.voiceEnabled,
            voiceAutoNarrate: appState.voiceAutoNarrate,
            voiceRate: appState.voiceRate
        }));
    } catch (e) {}
}

// ==========================================
// 3. THREE.JS SCENE, CAMERA & LIGHTS
// ==========================================
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 1000);
const DEFAULT_CAM_POS = new THREE.Vector3(0, 7.5, 23);
const DEFAULT_CAM_TARGET = new THREE.Vector3(0, 3.2, 0);
camera.position.copy(DEFAULT_CAM_POS);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputEncoding = THREE.sRGBEncoding;
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.copy(DEFAULT_CAM_TARGET);
controls.minDistance = 8;
controls.maxDistance = 45;
controls.minPolarAngle = 0.08;
controls.maxPolarAngle = Math.PI / 2 - 0.02;

// Interactive Click / Hover on 3D Label Badges (Requirement 4: Click to toggle/expand full name)
const labelRaycaster = new THREE.Raycaster();
const labelMouse = new THREE.Vector2();
let labelPointerDownPos = { x: 0, y: 0 };

renderer.domElement.addEventListener('pointerdown', (e) => {
    labelPointerDownPos = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('pointerup', (e) => {
    // Only trigger if click wasn't an orbit drag
    const dist = Math.hypot(e.clientX - labelPointerDownPos.x, e.clientY - labelPointerDownPos.y);
    if (dist > 7) return;

    labelMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    labelMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    labelRaycaster.setFromCamera(labelMouse, camera);

    const interactiveSprites = [];
    scene.traverse(obj => {
        if (obj.isSprite && obj.userData?.isInteractiveLabel && obj.visible) {
            let p = obj.parent;
            let allParentsVisible = true;
            while (p && p !== scene) {
                if (!p.visible) { allParentsVisible = false; break; }
                p = p.parent;
            }
            if (allParentsVisible) interactiveSprites.push(obj);
        }
    });

    const hits = labelRaycaster.intersectObjects(interactiveSprites, false);
    if (hits.length > 0) {
        Label3DManager.toggleBadge(hits[0].object);
    }
});

renderer.domElement.addEventListener('pointermove', (e) => {
    labelMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    labelMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    labelRaycaster.setFromCamera(labelMouse, camera);

    const interactiveSprites = [];
    scene.traverse(obj => {
        if (obj.isSprite && obj.userData?.isInteractiveLabel && obj.visible) {
            let p = obj.parent;
            let allParentsVisible = true;
            while (p && p !== scene) {
                if (!p.visible) { allParentsVisible = false; break; }
                p = p.parent;
            }
            if (allParentsVisible) interactiveSprites.push(obj);
        }
    });

    const hits = labelRaycaster.intersectObjects(interactiveSprites, false);
    if (hits.length > 0) {
        renderer.domElement.style.cursor = 'pointer';
    } else if (renderer.domElement.style.cursor === 'pointer') {
        renderer.domElement.style.cursor = 'default';
    }
});

// Educational Studio Lighting - Balanced to preserve deep contrast on dark pedestal
const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x0a101d, 0.95);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.45);
keyLight.position.set(12, 22, 15);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 50;
keyLight.shadow.camera.left = -18;
keyLight.shadow.camera.right = 18;
keyLight.shadow.camera.top = 18;
keyLight.shadow.camera.bottom = -18;
keyLight.shadow.bias = -0.00015;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
rimLight.position.set(-16, 14, -16);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0xf8fafc, 0.55);
fillLight.position.set(0, 8, 16);
scene.add(fillLight);

// Shared Laboratory Pedestal & Floor Grid
const envGroup = new THREE.Group();
scene.add(envGroup);

const gridHelper = new THREE.GridHelper(52, 52, 0x0369a1, 0x0f172a);
gridHelper.material.opacity = 0.10;
gridHelper.material.transparent = true;
gridHelper.position.y = -0.01;
gridHelper.visible = appState.gridVisible;
envGroup.add(gridHelper);

// ==========================================
// 3B. LABORATORY PEDESTAL & FLOATING GEOMETRY
// ==========================================
// Dark Navy / Graphite Pedestal (Requirements 1 & 3: High Contrast Stage)
const pedestalGeo = new THREE.CylinderGeometry(9.2, 9.7, 0.4, 64);
const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x142033, // Dark Navy / Graphite base (deep tone)
    roughness: 0.78, // 0.72 - 0.82
    metalness: 0.08  // 0.05 - 0.12
});
const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
pedestal.position.y = -0.2;
pedestal.receiveShadow = true;
envGroup.add(pedestal);

// Contrasting circular platform top insert (Deep Graphite "Stage" - extra dark for crystal clear contrast)
const podiumPadGeo = new THREE.CylinderGeometry(9.05, 9.05, 0.02, 64);
const podiumPadMat = new THREE.MeshStandardMaterial({
    color: 0x0f1726, // Distinctly dark top surface (so bright ivory/gold cone stands out crisp)
    roughness: 0.80, // 0.72 - 0.82
    metalness: 0.06  // 0.05 - 0.12
});
const podiumPad = new THREE.Mesh(podiumPadGeo, podiumPadMat);
podiumPad.position.y = 0.001;
podiumPad.receiveShadow = true;
envGroup.add(podiumPad);

// Outer subtle accent ring defining laboratory pedestal rim (cyan 22% opacity, delicate and not competing with cone)
const pedestalAccentRing = new THREE.Mesh(
    new THREE.RingGeometry(8.98, 9.15, 64),
    new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
);
pedestalAccentRing.rotation.x = -Math.PI / 2;
pedestalAccentRing.position.y = 0.002;
envGroup.add(pedestalAccentRing);

// Ground reference shadow/cue for floating models (Requirements 5 & 8: soft shadow ellipse)
const floatingShadowDisk = new THREE.Mesh(
    new THREE.CircleGeometry(1, 48),
    new THREE.MeshBasicMaterial({ color: 0x040812, transparent: true, opacity: 0.16, depthWrite: false })
);
floatingShadowDisk.rotation.x = -Math.PI / 2;
floatingShadowDisk.position.y = 0.0025;
envGroup.add(floatingShadowDisk);

const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.ShadowMaterial({ opacity: 0.45 })
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -0.21;
shadowPlane.receiveShadow = true;
envGroup.add(shadowPlane);

// --- FLOATING MODEL CONSTANTS & HELPERS (Phần 7: MODEL_FLOAT_GAP = 1.0) ---
const MODEL_FLOAT_GAP = 1.0; // 1.0 world units float gap clearly separating model from pedestal
const NET_FLOAT_GAP = 0.14;  // 0.12 - 0.16 gap for flat net

function getPlatformTop() {
    return 0.01; // top surface of podiumPad
}

function getModelFloatY() {
    return getPlatformTop() + MODEL_FLOAT_GAP;
}

function getFlatNetY() {
    return getPlatformTop() + NET_FLOAT_GAP;
}

function applyFloatingModelPosition() {
    if (typeof structureGroup !== 'undefined' && structureGroup) {
        structureGroup.position.y = getModelFloatY();
    }
    if (typeof trueRevGroup !== 'undefined' && trueRevGroup) {
        trueRevGroup.position.y = getModelFloatY();
    }
    if (typeof netDisplayGroup !== 'undefined' && netDisplayGroup) {
        const p = (typeof appState !== 'undefined' && appState.unfoldProgress !== undefined) ? appState.unfoldProgress : 0;
        const arch = (p > 0.05 && p < 0.95) ? Math.sin(p * Math.PI) * 0.22 : 0;
        netDisplayGroup.position.y = (1 - p) * getModelFloatY() + p * getFlatNetY() + arch;
    }
    if (typeof floatingShadowDisk !== 'undefined' && floatingShadowDisk) {
        const r = (typeof appState !== 'undefined' && appState.r) ? appState.r : 2.2;
        const p = (typeof appState !== 'undefined' && appState.unfoldProgress !== undefined && appState.mode === 'net') ? appState.unfoldProgress : 0;
        floatingShadowDisk.scale.set(r * 1.15, r * 1.15, 1);
        floatingShadowDisk.material.opacity = (appState.mode === 'net') ? 0.16 * (1 - p * 0.6) : 0.16;
        const isStage1 = (typeof lessonState !== 'undefined' && lessonState.currentStageIndex === 1);
        const isStructVis = (typeof structureGroup !== 'undefined' && structureGroup.visible);
        floatingShadowDisk.visible = (appState.mode === 'revolution' || appState.mode === 'net' || isStage1 || isStructVis);
    }
}

// ==========================================
// 4. SHARED MATERIALS (PERMANENT CACHE & HIGH CONTRAST)
// ==========================================
// Requirements 2.1 - 2.5: Warm ivory / gold cone, Cyan swept volume, Dark navy base
const SHARED_MATS = {
    // Cylinder: Light blue / cyan (Requirement 2.5)
    cylGlass: new THREE.MeshPhysicalMaterial({
        color: 0x7DE7F4, roughness: 0.20, metalness: 0.05, transmission: 0.65,
        transparent: true, opacity: 0.78, ior: 1.48, thickness: 0.35, depthWrite: false,
        clearcoat: 0.6, side: THREE.DoubleSide
    }),
    // Cone: Warm ivory + gold/yellow surface (translucent so inner height & radius shine clearly)
    coneGlass: new THREE.MeshPhysicalMaterial({
        color: 0xFFE89A, roughness: 0.22, metalness: 0.05, transmission: 0.58,
        transparent: true, opacity: 0.52, ior: 1.48, thickness: 0.35, depthWrite: false,
        clearcoat: 0.6, side: THREE.DoubleSide
    }),
    water: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(appState.waterColor), roughness: 0.15, metalness: 0.0,
        transparent: true, opacity: 0.90, transmission: 0.12, clearcoat: 0.5,
        emissive: new THREE.Color(appState.waterColor).multiplyScalar(0.2), emissiveIntensity: 0.4
    }),
    waterMeniscus: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(appState.waterColor).offsetHSL(0, 0, 0.08), roughness: 0.05,
        transparent: true, opacity: 0.95, clearcoat: 0.8, side: THREE.DoubleSide
    }),
    // Net Lateral: Warm Ivory / Gold Yellow (Requirement 2.3)
    netLateral: new THREE.MeshPhysicalMaterial({
        color: 0xF6D96B, roughness: 0.32, metalness: 0.06, transparent: true, opacity: 0.84, side: THREE.DoubleSide
    }),
    // Net Base Disk: Cyan / turquoise (Requirement 2.5)
    netBase: new THREE.MeshPhysicalMaterial({
        color: 0x55D9E8, roughness: 0.30, metalness: 0.05, transparent: true, opacity: 0.88, side: THREE.DoubleSide
    }),
    // Revolution Swept Volume: Rich, clearly visible, vivid cyan/glass with subtle glow
    revSwept: new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.35,
        roughness: 0.18,
        metalness: 0.08,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
        depthWrite: false,
        clearcoat: 0.5
    }),
    // Swept Base Disk Sector (Requirement 2: Solid base sweep on floor)
    revSweptBase: new THREE.MeshPhysicalMaterial({
        color: 0x0284c7,
        emissive: 0x0369a1,
        emissiveIntensity: 0.28,
        roughness: 0.25,
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
        depthWrite: false
    }),
    // Generating Profile (triangle SOB / rectangle OABC): Warm, rich gold/amber
    revProfile: new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.88, side: THREE.DoubleSide }),
    // Stationary start profile ghost / outline at 0 deg: Subtle dashed guide, NOT solid
    revStartGuide: new THREE.LineDashedMaterial({ color: 0x64748b, dashSize: 0.25, gapSize: 0.15, linewidth: 2, transparent: true, opacity: 0.65 }),
    sectionSlice: new THREE.MeshPhysicalMaterial({
        color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.3,
        roughness: 0.2, transparent: true, opacity: 0.92, side: THREE.DoubleSide
    }),
    sectionPlane: new THREE.MeshBasicMaterial({
        color: 0x34d399, transparent: true, opacity: 0.25, side: THREE.DoubleSide
    }),
    ghostProfile: new THREE.MeshBasicMaterial({
        color: 0x94a3b8, transparent: true, opacity: 0.25, side: THREE.DoubleSide, wireframe: true
    }),
    // Solid 3D Thick Tube Rods & Rings (Requirement: Các nét đường thẳng, đường sinh, đường cao, bán kính rõ hơn, depthTest: true để khử chồng chéo 3D)
    tubeHeight: new THREE.MeshStandardMaterial({
        color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.65,
        roughness: 0.2, metalness: 0.1, depthTest: true
    }),
    tubeRadius: new THREE.MeshStandardMaterial({
        color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 0.65,
        roughness: 0.2, metalness: 0.1, depthTest: true
    }),
    tubeSlant: new THREE.MeshStandardMaterial({
        color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.65,
        roughness: 0.2, metalness: 0.1, depthTest: true
    }),
    tubeRim: new THREE.MeshStandardMaterial({
        color: 0x0ea5e9, emissive: 0x0284c7, emissiveIntensity: 0.55,
        roughness: 0.25, metalness: 0.1, depthTest: true
    }),
    lineCyan: new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3, transparent: true, opacity: 0.95 }),
    // Amber Edges: 0xFFD34D (Requirement 2.3)
    lineAmber: new THREE.LineBasicMaterial({ color: 0xFFD34D, linewidth: 3, transparent: true, opacity: 0.95 }),
    linePink: new THREE.LineBasicMaterial({ color: 0xf43f5e, linewidth: 3, transparent: true, opacity: 0.95 }),
    lineGreen: new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 3, transparent: true, opacity: 0.95 }),
    lineAxis: new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 3.5 }),
    lineDashed: new THREE.LineDashedMaterial({ color: 0x06b6d4, dashSize: 0.2, gapSize: 0.1, linewidth: 2, transparent: true, opacity: 0.85 }),
    pointCyan: new THREE.MeshBasicMaterial({ color: 0x38bdf8, depthTest: true }),
    pointYellow: new THREE.MeshBasicMaterial({ color: 0xfacc15, depthTest: true }),
    pointPink: new THREE.MeshBasicMaterial({ color: 0xf43f5e, depthTest: true }),
    pointGreen: new THREE.MeshBasicMaterial({ color: 0x10b981, depthTest: true }),
    pointOrange: new THREE.MeshBasicMaterial({ color: 0xf97316, depthTest: true })
};

// ==========================================
// 4B. RESOURCE MANAGEMENT & 3D CANVAS LABELS
// ==========================================
function disposeGeometry(mesh) {
    if (mesh && mesh.geometry) {
        mesh.geometry.dispose();
    }
}

const Label3DManager = {
    drawBadgeCanvas(canvas, text, color, bgColor, borderColor, width, height, isExpanded) {
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const pad = 4;
        const radius = Math.min(20, height / 2 - pad);
        ctx.fillStyle = isExpanded ? 'rgba(15, 23, 42, 0.96)' : bgColor;
        ctx.strokeStyle = isExpanded ? '#38bdf8' : borderColor;
        ctx.lineWidth = isExpanded ? 4.5 : 3.0;

        ctx.beginPath();
        ctx.moveTo(pad + radius, pad);
        ctx.arcTo(width - pad, pad, width - pad, height - pad, radius);
        ctx.arcTo(width - pad, height - pad, pad, height - pad, radius);
        ctx.arcTo(pad, height - pad, pad, pad, radius);
        ctx.arcTo(pad, pad, width - pad, pad, radius);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isExpanded ? '#38bdf8' : color;
        const fontSize = Math.round(height * (isExpanded ? 0.38 : 0.44));
        ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, width / 2, height / 2 + 1);
    },

    createBadge(text, color = '#f8fafc', bgColor = 'rgba(15, 23, 42, 0.90)', borderColor = '#38bdf8', width = 280, height = 70, fullExplanation = null) {
        const shortText = text;
        const fullText = fullExplanation || text;
        const canvas = document.createElement('canvas');
        this.drawBadgeCanvas(canvas, shortText, color, bgColor, borderColor, width, height, false);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });

        const sprite = new THREE.Sprite(material);
        const aspect = width / height;
        const scaleH = 0.45;
        sprite.scale.set(scaleH * aspect, scaleH, 1);
        sprite.renderOrder = 999;

        // Mark as interactive label sprite
        sprite.userData = {
            texture,
            material,
            isOwnedLabel: true,
            isInteractiveLabel: true,
            shortText,
            fullText,
            isExpanded: false,
            color,
            bgColor,
            borderColor,
            baseWidth: width,
            baseHeight: height,
            scaleH
        };
        return sprite;
    },

    toggleBadge(sprite) {
        if (!sprite || !sprite.userData) return;
        const ud = sprite.userData;
        ud.isExpanded = !ud.isExpanded;
        const displayText = ud.isExpanded ? ud.fullText : ud.shortText;

        const approxCharWidth = ud.baseHeight * 0.28;
        const calcW = ud.isExpanded ? Math.max(ud.baseWidth, Math.round(displayText.length * approxCharWidth + 70)) : ud.baseWidth;

        const canvas = document.createElement('canvas');
        this.drawBadgeCanvas(canvas, displayText, ud.color, ud.bgColor, ud.borderColor, calcW, ud.baseHeight, ud.isExpanded);

        if (ud.texture) ud.texture.dispose();
        ud.texture = new THREE.CanvasTexture(canvas);
        ud.texture.minFilter = THREE.LinearFilter;
        ud.texture.generateMipmaps = false;

        sprite.material.map = ud.texture;
        sprite.material.needsUpdate = true;

        const aspect = calcW / ud.baseHeight;
        const scaleH = ud.scaleH || 0.45;
        sprite.scale.set(scaleH * aspect, scaleH, 1);

        AudioEngine.click();
        showToast(`🏷️ ${displayText}`, 2500);

        if (typeof gsap !== 'undefined') {
            gsap.fromTo(sprite.scale,
                { x: sprite.scale.x * 1.15, y: sprite.scale.y * 1.15 },
                { x: sprite.scale.x, y: sprite.scale.y, duration: 0.28, ease: 'back.out(2)' }
            );
        }
    },

    disposeSprite(sprite) {
        if (!sprite || !sprite.userData?.isOwnedLabel) return;
        if (sprite.userData.texture) {
            sprite.userData.texture.dispose();
            sprite.userData.texture = null;
        }
        if (sprite.userData.material) {
            sprite.userData.material.dispose();
            sprite.userData.material = null;
        }
    }
};

function clearGroupSafely(group) {
    while (group.children.length > 0) {
        const child = group.children[0];
        group.remove(child);
        if (child.isSprite && child.userData?.isOwnedLabel) {
            Label3DManager.disposeSprite(child);
        } else {
            disposeGeometry(child);
        }
        if (child.isGroup) {
            clearGroupSafely(child);
        }
    }
}

// Circle Line Loop Generator
function createCircleLine(radius, y, material) {
    const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, 2 * Math.PI, false, 0);
    const points = curve.getPoints(64);
    const geo = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, y, p.y)));
    return new THREE.LineLoop(geo, material);
}

// 3D Solid Tube Rod Generator for ultra-clear geometric lines (Height, Radius, Slant)
function createTubeRod(p1, p2, radius, material) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    if (len < 0.001) return new THREE.Group();
    const geo = new THREE.CylinderGeometry(radius, radius, len, 16);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.copy(new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    mesh.renderOrder = 25;
    return mesh;
}

// 3D Torus Ring Generator for prominent base circular rim
function createTorusRing(radius, tubeRadius, material) {
    const geo = new THREE.TorusGeometry(radius, tubeRadius, 16, 64);
    const mesh = new THREE.Mesh(geo, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 24;
    return mesh;
}

// ==========================================
// 4C. COLOR PALETTE & VISUAL PREFERENCES (PHẦN 3, 4, 5, 6)
// ==========================================
const STORAGE_KEY_COLORS = 'k2_math_visual_colors_v1';
let visualColors = {
    pedestal: '#111827',
    cone: '#FFE89A',
    cylinder: '#72E5F2',
    background: '#061525'
};

function setPedestalColor(hex) {
    visualColors.pedestal = hex;
    const base = new THREE.Color(hex);
    if (typeof pedestalMat !== 'undefined' && pedestalMat) {
        pedestalMat.color.copy(base);
    }
    if (typeof podiumPadMat !== 'undefined' && podiumPadMat) {
        podiumPadMat.color.copy(base.clone().offsetHSL(0, 0, -0.05));
    }
    const input = document.getElementById('picker-pedestal');
    if (input) input.value = hex;
    const hexSpan = document.getElementById('hex-pedestal');
    if (hexSpan) hexSpan.innerText = hex.toUpperCase();
}

function setShapeColor(hex) {
    if (appState.shape === 'cylinder') {
        visualColors.cylinder = hex;
        if (SHARED_MATS.cylGlass) SHARED_MATS.cylGlass.color.set(hex);
    } else {
        visualColors.cone = hex;
        if (SHARED_MATS.coneGlass) SHARED_MATS.coneGlass.color.set(hex);
        if (SHARED_MATS.netLateral) SHARED_MATS.netLateral.color.set(hex);
    }
    const input = document.getElementById('picker-shape');
    if (input) input.value = hex;
    const hexSpan = document.getElementById('hex-shape');
    if (hexSpan) hexSpan.innerText = hex.toUpperCase();
    checkContrastWarning();
}

function setBackgroundColor(hex) {
    visualColors.background = hex;
    const c = new THREE.Color(hex);
    const dark = c.clone().multiplyScalar(0.18);
    document.body.style.backgroundImage = `radial-gradient(circle at 50% 45%, #${c.getHexString()} 0%, #${dark.getHexString()} 100%)`;
    document.body.style.backgroundColor = `#${dark.getHexString()}`;
    if (typeof scene !== 'undefined' && scene && scene.background) {
        scene.background.copy(dark);
    }
    const input = document.getElementById('picker-background');
    if (input) input.value = hex;
    const hexSpan = document.getElementById('hex-background');
    if (hexSpan) hexSpan.innerText = hex.toUpperCase();
}

function getColorContrast(hexA, hexB) {
    const cA = new THREE.Color(hexA);
    const cB = new THREE.Color(hexB);
    const lumA = 0.299 * cA.r + 0.587 * cA.g + 0.114 * cA.b;
    const lumB = 0.299 * cB.r + 0.587 * cB.g + 0.114 * cB.b;
    return Math.abs(lumA - lumB);
}

function checkContrastWarning() {
    const shapeHex = (appState && appState.shape === 'cylinder') ? visualColors.cylinder : visualColors.cone;
    const contrast = getColorContrast(visualColors.pedestal, shapeHex);
    const warnEl = document.getElementById('color-contrast-warning');
    if (warnEl) {
        warnEl.classList.toggle('hidden', contrast >= 0.24);
    }
}

function applyAutoContrast() {
    const shapeHex = (appState && appState.shape === 'cylinder') ? visualColors.cylinder : visualColors.cone;
    const cShape = new THREE.Color(shapeHex);
    const lumShape = 0.299 * cShape.r + 0.587 * cShape.g + 0.114 * cShape.b;
    let newPedestalHex = '#111827';
    let newBgHex = '#061525';
    if (lumShape > 0.45) {
        newPedestalHex = '#111827';
        newBgHex = '#061525';
    } else {
        newPedestalHex = '#475569';
        newBgHex = '#1e293b';
    }
    setPedestalColor(newPedestalHex);
    setBackgroundColor(newBgHex);
    saveVisualColors();
    checkContrastWarning();
    showToast('✨ Đã tự động cân bằng tương phản tối ưu');
}

const COLOR_PRESETS = {
    'stem-dark': { pedestal: '#111827', cone: '#FFE38A', cylinder: '#72E5F2', background: '#061525' },
    'bright-edu': { pedestal: '#334155', cone: '#FFF1B5', cylinder: '#72E5F2', background: '#DCEAF5' },
    'sci-blue': { pedestal: '#172554', cone: '#FDE68A', cylinder: '#72E5F2', background: '#020617' }
};

function applyColorPreset(presetKey) {
    const p = COLOR_PRESETS[presetKey];
    if (!p) return;
    setPedestalColor(p.pedestal);
    if (appState.shape === 'cone') {
        setShapeColor(p.cone);
    } else {
        setShapeColor(p.cylinder);
    }
    visualColors.cone = p.cone;
    visualColors.cylinder = p.cylinder;
    setBackgroundColor(p.background);
    saveVisualColors();
    checkContrastWarning();
    showToast(`Đã áp dụng bộ màu: ${presetKey === 'stem-dark' ? 'STEM Tối' : presetKey === 'bright-edu' ? 'Sáng Giáo Dục' : 'Xanh Khoa Học'}`);
}

function resetDefaultColors() {
    setPedestalColor('#111827');
    setShapeColor('#FFE89A');
    visualColors.cone = '#FFE89A';
    visualColors.cylinder = '#72E5F2';
    setBackgroundColor('#061525');
    saveVisualColors();
    checkContrastWarning();
    showToast('Đã khôi phục bảng màu mặc định');
}

function toggleColorPalette(e) {
    if (e) e.stopPropagation();
    const p = document.getElementById('floating-color-palette');
    if (p) {
        p.classList.toggle('hidden');
        if (!p.classList.contains('hidden')) {
            checkContrastWarning();
        }
    }
}

function closeColorPalette() {
    const p = document.getElementById('floating-color-palette');
    if (p) p.classList.add('hidden');
}

function onColorPickerChange(type, value) {
    if (type === 'pedestal') setPedestalColor(value);
    else if (type === 'shape') setShapeColor(value);
    else if (type === 'background') setBackgroundColor(value);
    saveVisualColors();
    checkContrastWarning();
}

function saveVisualColors() {
    try {
        localStorage.setItem(STORAGE_KEY_COLORS, JSON.stringify(visualColors));
    } catch (e) {}
}

function loadVisualColors() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_COLORS);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.pedestal) visualColors.pedestal = parsed.pedestal;
            if (parsed.cone) visualColors.cone = parsed.cone;
            if (parsed.cylinder) visualColors.cylinder = parsed.cylinder;
            if (parsed.background) visualColors.background = parsed.background;
        }
    } catch (e) {}
    setPedestalColor(visualColors.pedestal);
    if (appState.shape === 'cone') {
        setShapeColor(visualColors.cone);
    } else {
        setShapeColor(visualColors.cylinder);
    }
    setBackgroundColor(visualColors.background);
    checkContrastWarning();
}

// Close color palette when clicking outside
document.addEventListener('click', (e) => {
    const palette = document.getElementById('floating-color-palette');
    const btn = document.getElementById('nav-btn-color');
    if (!palette || palette.classList.contains('hidden')) return;
    if (!palette.contains(e.target) && !btn.contains(e.target)) {
        palette.classList.add('hidden');
    }
});

// ==========================================
// 5. ROOT MODE GROUPS (SINGLE SCENE)
// ==========================================
// Stage 1 Dedicated Structure View (Phần 1.3: Cấu tạo & Pythagore)
const structureGroup = new THREE.Group();
structureGroup.position.set(0, getModelFloatY(), 0);
scene.add(structureGroup);

const volumeGroup = new THREE.Group();
const netGroup = new THREE.Group();
const revolutionGroup = new THREE.Group();
const sectionGroup = new THREE.Group();

scene.add(volumeGroup);
scene.add(netGroup);
scene.add(revolutionGroup);
scene.add(sectionGroup);

netGroup.visible = false;
revolutionGroup.visible = false;
sectionGroup.visible = false;

// --- STRUCTURE CONE OBJECTS (CHẶNG 1) ---
let structConeMesh = null;
let structBaseDisc = null;
let structBaseRim = null;
let structAxisLine = null;
let structRadiusLine = null;
let structSlantLine = null;
let structRightAngleMarker = null;
let structTriFillMesh = null;
let structPointS = null;
let structPointO = null;
let structPointB = null;
const structLabelsGroup = new THREE.Group();
structureGroup.add(structLabelsGroup);

function updateStructureConeGeometry(step = 1) {
    const r = (appState && appState.r) || 3.5;
    const h = (appState && appState.h) || 6.0;
    const l = MathCore.getSlant(r, h);
    const u = (appState && appState.unit) || 'cm';

    // 1. Cone Mesh: apex at (0, h, 0), base at (0, 0, 0)
    if (structConeMesh) {
        disposeGeometry(structConeMesh);
        structConeMesh.geometry = new THREE.ConeGeometry(r, h, 64, 1, true);
        structConeMesh.position.set(0, h / 2, 0);
    } else {
        structConeMesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, 64, 1, true), SHARED_MATS.coneGlass);
        structConeMesh.position.set(0, h / 2, 0);
        structConeMesh.castShadow = true;
        structureGroup.add(structConeMesh);
    }

    // 2. Base Disc at y = 0
    if (structBaseDisc) {
        disposeGeometry(structBaseDisc);
        structBaseDisc.geometry = new THREE.CircleGeometry(r, 64);
    } else {
        structBaseDisc = new THREE.Mesh(new THREE.CircleGeometry(r, 64), SHARED_MATS.coneGlass);
        structBaseDisc.rotation.x = -Math.PI / 2;
        structBaseDisc.position.set(0, 0, 0);
        structureGroup.add(structBaseDisc);
    }

    // 3. Base rim 3D Torus Ring at y = 0 (Requirement: rõ ràng, đậm nét)
    // 3. Base rim 3D Torus Ring at y = 0 (Requirement: rõ ràng, đậm nét, kích thước chuẩn)
    if (structBaseRim) {
        disposeGeometry(structBaseRim);
        structBaseRim.geometry = new THREE.TorusGeometry(r, 0.026, 16, 64);
    } else {
        structBaseRim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.026, 16, 64), SHARED_MATS.tubeRim);
        structBaseRim.rotation.x = -Math.PI / 2;
        structBaseRim.position.set(0, 0, 0);
        structBaseRim.renderOrder = 24;
        structureGroup.add(structBaseRim);
    }

    const rodRadius = 0.032; // Halved from 0.065 to make lines precise and elegant

    // 4. Axis SO (Height h) from (0, 0, 0) to (0, h, 0) as solid 3D tube rod
    if (structAxisLine) {
        disposeGeometry(structAxisLine);
        structAxisLine.geometry = new THREE.CylinderGeometry(rodRadius, rodRadius, h, 16);
    } else {
        structAxisLine = new THREE.Mesh(new THREE.CylinderGeometry(rodRadius, rodRadius, h, 16), SHARED_MATS.tubeHeight);
        structAxisLine.renderOrder = 25;
        structureGroup.add(structAxisLine);
    }
    structAxisLine.position.set(0, h / 2, 0);
    structAxisLine.quaternion.identity();

    // 5. Radius OB (Radius r) from (0, 0, 0) to (r, 0, 0) as solid 3D tube rod
    const rGeo = new THREE.CylinderGeometry(rodRadius, rodRadius, r, 16);
    const rMid = new THREE.Vector3(r / 2, 0.015, 0);
    const rQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
    if (structRadiusLine) {
        disposeGeometry(structRadiusLine);
        structRadiusLine.geometry = rGeo;
    } else {
        structRadiusLine = new THREE.Mesh(rGeo, SHARED_MATS.tubeRadius);
        structRadiusLine.renderOrder = 25;
        structureGroup.add(structRadiusLine);
    }
    structRadiusLine.position.copy(rMid);
    structRadiusLine.quaternion.copy(rQuat);

    // 6. Slant line SB (Đường sinh SB / Slant l) from S(0, h, 0) to B(r, 0, 0) as solid 3D tube rod
    const pApex = new THREE.Vector3(0, h, 0);
    const pBase = new THREE.Vector3(r, 0, 0);
    const slantDir = new THREE.Vector3().subVectors(pBase, pApex);
    const slantLen = slantDir.length();
    const slantMid = new THREE.Vector3().addVectors(pApex, pBase).multiplyScalar(0.5);
    const slantQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), slantDir.clone().normalize());
    const sGeo = new THREE.CylinderGeometry(rodRadius, rodRadius, slantLen, 16);
    if (structSlantLine) {
        disposeGeometry(structSlantLine);
        structSlantLine.geometry = sGeo;
    } else {
        structSlantLine = new THREE.Mesh(sGeo, SHARED_MATS.tubeSlant);
        structSlantLine.renderOrder = 25;
        structureGroup.add(structSlantLine);
    }
    structSlantLine.position.copy(slantMid);
    structSlantLine.quaternion.copy(slantQuat);

    // 7. Right angle marker at O
    const sCorner = Math.min(0.35, r * 0.2, h * 0.15);
    const cornerPts = [
        new THREE.Vector3(0, sCorner, 0),
        new THREE.Vector3(sCorner, sCorner, 0),
        new THREE.Vector3(sCorner, 0, 0)
    ];
    if (structRightAngleMarker) {
        disposeGeometry(structRightAngleMarker);
        structRightAngleMarker.geometry = new THREE.BufferGeometry().setFromPoints(cornerPts);
    } else {
        structRightAngleMarker = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(cornerPts),
            SHARED_MATS.lineAmber
        );
        structureGroup.add(structRightAngleMarker);
    }

    // 8. Triangle SOB fill
    const triShape = new THREE.Shape();
    triShape.moveTo(0, 0);
    triShape.lineTo(r, 0);
    triShape.lineTo(0, h);
    triShape.closePath();
    if (structTriFillMesh) {
        disposeGeometry(structTriFillMesh);
        structTriFillMesh.geometry = new THREE.ShapeGeometry(triShape);
    } else {
        structTriFillMesh = new THREE.Mesh(new THREE.ShapeGeometry(triShape), SHARED_MATS.revProfile);
        structureGroup.add(structTriFillMesh);
    }
    structTriFillMesh.visible = (step >= 2);

    // 9. Point Spheres (halved size for crispness)
    if (!structPointS) {
        const ptGeo = new THREE.SphereGeometry(0.075, 16, 16);
        structPointS = new THREE.Mesh(ptGeo, SHARED_MATS.pointYellow);
        structPointO = new THREE.Mesh(ptGeo, SHARED_MATS.pointCyan);
        structPointB = new THREE.Mesh(ptGeo, SHARED_MATS.pointPink);
        structPointS.renderOrder = 30;
        structPointO.renderOrder = 30;
        structPointB.renderOrder = 30;
        structureGroup.add(structPointS);
        structureGroup.add(structPointO);
        structureGroup.add(structPointB);
    }
    structPointS.position.set(0, h, 0);
    structPointO.position.set(0, 0, 0);
    structPointB.position.set(r, 0, 0);

    // 10. 3D Badges & Labels (Optimized non-overlapping layout)
    while (structLabelsGroup.children.length > 0) {
        const c = structLabelsGroup.children[0];
        structLabelsGroup.remove(c);
        if (c.material && c.material.map) c.material.map.dispose();
        if (c.material) c.material.dispose();
    }

    const bS = Label3DManager.createBadge('S', '#facc15', 'rgba(15,23,42,0.92)', '#facc15', 90, 52, 'Đỉnh (S)');
    bS.position.set(0, h + 0.52, 0);
    structLabelsGroup.add(bS);

    const bO = Label3DManager.createBadge('O', '#38bdf8', 'rgba(15,23,42,0.92)', '#38bdf8', 90, 52, 'Tâm đáy (O)');
    bO.position.set(-0.68, -0.42, 0);
    structLabelsGroup.add(bO);

    const bB = Label3DManager.createBadge('B', '#f43f5e', 'rgba(15,23,42,0.92)', '#f43f5e', 90, 52, 'Điểm đáy (B)');
    bB.position.set(r + 0.68, -0.22, 0);
    structLabelsGroup.add(bB);

    const bh = Label3DManager.createBadge(`h = ${h.toFixed(1)} ${u}`, '#38bdf8', 'rgba(15,23,42,0.92)', '#38bdf8', 180, 52, `Đường cao: h = ${h.toFixed(1)} ${u}`);
    bh.position.set(-0.95, h * 0.52, 0);
    structLabelsGroup.add(bh);

    const br = Label3DManager.createBadge(`r = ${r.toFixed(1)} ${u}`, '#facc15', 'rgba(15,23,42,0.92)', '#facc15', 180, 52, `Bán kính đáy: r = ${r.toFixed(1)} ${u}`);
    br.position.set(r * 0.5, -0.45, 0.35);
    structLabelsGroup.add(br);

    const bl = Label3DManager.createBadge(`l = ${l.toFixed(2)} ${u}`, '#f43f5e', 'rgba(15,23,42,0.92)', '#f43f5e', 180, 52, `Đường sinh: l = ${l.toFixed(2)} ${u}`);
    bl.position.set(r * 0.52 + 0.65, h * 0.52 + 0.35, 0);
    structLabelsGroup.add(bl);

    // POINT 1 FIX: Only show pythagorean formula answer AFTER step 3 is answered correctly or in step 4!
    const isStep3Done = (typeof isStepCompleted === 'function' && isStepCompleted(1, 3)) || (lessonState?.completedSteps && (lessonState.completedSteps['s1_step3'] || lessonState.completedSteps['1_3']));
    if (step >= 4 || (step === 3 && isStep3Done)) {
        const bPyth = Label3DManager.createBadge(`l² = r² + h²  ⇒  l = ${l.toFixed(2)}`, '#10b981', 'rgba(6,78,59,0.95)', '#10b981', 320, 60, `Định lý Pythagore: l² = r² + h² ⇒ l = ${l.toFixed(2)} ${u}`);
        bPyth.position.set(r * 0.6 + 0.85, h + 0.85, 0);
        structLabelsGroup.add(bPyth);
    }

    // Sync values with right panel
    const elH = document.getElementById('struct-h-val');
    const elR = document.getElementById('struct-r-val');
    const elL = document.getElementById('struct-l-val');
    if (elH) elH.innerText = `h = ${h.toFixed(1)} ${u}`;
    if (elR) elR.innerText = `r = ${r.toFixed(1)} ${u}`;
    if (elL) elL.innerText = `l = ${l.toFixed(2)} ${u}`;
}

function enterStructureLessonStep(step) {
    if (typeof gsap !== 'undefined') gsap.killTweensOf(appState);
    appState.isRevolving = false;
    appState.isUnfoldPlaying = false;
    appState.mode = 'structure';
    appState.shape = 'cone';

    // Deselect other mode tabs
    document.querySelectorAll('.mode-tab').forEach(t => {
        t.className = 'mode-tab px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1 shrink-0';
    });

    // Hide other 3D groups
    volumeGroup.visible = false;
    netGroup.visible = false;
    revolutionGroup.visible = false;
    sectionGroup.visible = false;

    // Show structure cone
    structureGroup.visible = true;
    structureGroup.position.set(0, getModelFloatY(), 0);

    // Hide right sidebar mode panels and show structure panel
    const panels = ['volume', 'net', 'rev', 'section', 'challenge'];
    panels.forEach(p => {
        const el = document.getElementById(`panel-mode-${p}`);
        if (el) el.classList.add('hidden');
    });
    const sp = document.getElementById('panel-mode-structure');
    if (sp) sp.classList.remove('hidden');

    updateStructureConeGeometry(step);

    if (step === 1) {
        showConeBasicStructure();
    } else if (step === 2) {
        highlightRadiusHeight();
    } else if (step === 3) {
        showTriangleSOB();
    } else if (step === 4) {
        highlightPythagoras();
    }

    applyFloatingModelPosition();
    frameFloatingModel(structureGroup);
}

function showConeBasicStructure() {
    if (structConeMesh) structConeMesh.visible = true;
    if (structBaseDisc) structBaseDisc.visible = true;
    if (structBaseRim) structBaseRim.visible = true;
    if (structAxisLine) structAxisLine.visible = true;
    if (structRadiusLine) structRadiusLine.visible = true;
    if (structSlantLine) structSlantLine.visible = true;
    if (structPointS) structPointS.visible = true;
    if (structPointO) structPointO.visible = true;
    if (structPointB) structPointB.visible = true;
    if (structLabelsGroup) structLabelsGroup.visible = true;
    if (structTriFillMesh) structTriFillMesh.visible = false;
    if (structRightAngleMarker) structRightAngleMarker.visible = true;
}

function highlightRadiusHeight() {
    if (structConeMesh) structConeMesh.visible = true;
    if (structBaseDisc) structBaseDisc.visible = true;
    if (structBaseRim) structBaseRim.visible = true;
    if (structAxisLine) structAxisLine.visible = true;
    if (structRadiusLine) structRadiusLine.visible = true;
    if (structSlantLine) structSlantLine.visible = true;
    if (structPointS) structPointS.visible = true;
    if (structPointO) structPointO.visible = true;
    if (structPointB) structPointB.visible = true;
    if (structLabelsGroup) structLabelsGroup.visible = true;
    if (structTriFillMesh) structTriFillMesh.visible = false;
    if (structRightAngleMarker) structRightAngleMarker.visible = true;
}

function showTriangleSOB() {
    if (structConeMesh) structConeMesh.visible = true;
    if (structBaseDisc) structBaseDisc.visible = true;
    if (structBaseRim) structBaseRim.visible = true;
    if (structAxisLine) structAxisLine.visible = true;
    if (structRadiusLine) structRadiusLine.visible = true;
    if (structSlantLine) structSlantLine.visible = true;
    if (structPointS) structPointS.visible = true;
    if (structPointO) structPointO.visible = true;
    if (structPointB) structPointB.visible = true;
    if (structLabelsGroup) structLabelsGroup.visible = true;
    if (structTriFillMesh) structTriFillMesh.visible = true;
    if (structRightAngleMarker) structRightAngleMarker.visible = true;
}

function highlightPythagoras() {
    if (structConeMesh) structConeMesh.visible = true;
    if (structBaseDisc) structBaseDisc.visible = true;
    if (structBaseRim) structBaseRim.visible = true;
    if (structAxisLine) structAxisLine.visible = true;
    if (structRadiusLine) structRadiusLine.visible = true;
    if (structSlantLine) structSlantLine.visible = true;
    if (structPointS) structPointS.visible = true;
    if (structPointO) structPointO.visible = true;
    if (structPointB) structPointB.visible = true;
    if (structLabelsGroup) structLabelsGroup.visible = true;
    if (structTriFillMesh) structTriFillMesh.visible = true;
    if (structRightAngleMarker) structRightAngleMarker.visible = true;
}

function enterRevolutionLessonStep(step) {
    if (typeof structureGroup !== 'undefined') structureGroup.visible = false;
    const sp = document.getElementById('panel-mode-structure');
    if (sp) sp.classList.add('hidden');

    setMode('revolution');
    setShape('cone');

    // Chặng 2: Đảm bảo chỉ có duy nhất 1 tam giác vuông SOB quay, tắt triệt để mọi profile/bóng phụ
    if (typeof revStartProfileGroup !== 'undefined') revStartProfileGroup.visible = false;
    if (typeof revGhostGroup !== 'undefined') revGhostGroup.visible = false;
    appState.showGhostProfiles = false;
    const chkGhost = document.getElementById('chk-rev-ghost');
    if (chkGhost) chkGhost.checked = false;

    // Start cleanly at 0° with the pristine single right triangle SOB
    if (step === 1) setRevolutionAngle(0);
    else if (step === 2) {
        if (appState.revolveAngleDeg === 0) setRevolutionAngle(0);
    } else if (step === 3) {
        setRevolutionAngle(360);
    }
}

// ==========================================
// 6. MODE 1: THỂ TÍCH (VOLUME EXPERIMENT)
// ==========================================
const volCylGroup = new THREE.Group();
volCylGroup.position.set(POS.volumeCylX, 0, 0);
volumeGroup.add(volCylGroup);

const volCylMesh = new THREE.Mesh(new THREE.BufferGeometry(), SHARED_MATS.cylGlass);
volCylMesh.castShadow = true;
volCylGroup.add(volCylMesh);

const volCylBottomDisc = new THREE.Mesh(new THREE.BufferGeometry(), SHARED_MATS.cylGlass);
volCylGroup.add(volCylBottomDisc);

const volCylWater = new THREE.Mesh(new THREE.BufferGeometry(), SHARED_MATS.water);
volCylWater.scale.y = 0.001;
volCylGroup.add(volCylWater);

const volCylWaterDisc = new THREE.Mesh(new THREE.BufferGeometry(), SHARED_MATS.waterMeniscus);
volCylWaterDisc.position.y = 0.01;
volCylWaterDisc.visible = false;
volCylGroup.add(volCylWaterDisc);

const volCylLines = new THREE.Group();
volCylGroup.add(volCylLines);

const volCylLabels = new THREE.Group();
volCylGroup.add(volCylLabels);

// Ruler Gauge Mesh alongside Cylinder
const volRulerGroup = new THREE.Group();
volRulerGroup.position.set(POS.volumeCylX - 0.2, 0, 0);
volumeGroup.add(volRulerGroup);

// Volume Cone Assembly
const volConeGroup = new THREE.Group();
volConeGroup.position.set(POS.volumeConeX, 0, 0);
volumeGroup.add(volConeGroup);

const volConeMesh = new THREE.Mesh(new THREE.BufferGeometry(), SHARED_MATS.coneGlass);
volConeMesh.castShadow = true;
volConeGroup.add(volConeMesh);

const volConeWater = new THREE.Mesh(new THREE.BufferGeometry(), SHARED_MATS.water);
volConeGroup.add(volConeWater);

const volConeWaterDisc = new THREE.Mesh(new THREE.BufferGeometry(), SHARED_MATS.waterMeniscus);
volConeGroup.add(volConeWaterDisc);

const volConeLines = new THREE.Group();
volConeGroup.add(volConeLines);

const volConeLabels = new THREE.Group();
volConeGroup.add(volConeLabels);

// Stream & Droplets
const volStream = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 1, 32).translate(0, -0.5, 0), SHARED_MATS.water);
volStream.visible = false;
volumeGroup.add(volStream);

const droplets = [];
const dropGeo = new THREE.SphereGeometry(0.08, 8, 8);
for (let i = 0; i < 14; i++) {
    const d = new THREE.Mesh(dropGeo, SHARED_MATS.water);
    d.visible = false;
    volumeGroup.add(d);
    droplets.push(d);
}

// Station Rings
const volCylStationRing = new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
);
volCylStationRing.position.set(POS.volumeCylX, 0.01, 0);
volumeGroup.add(volCylStationRing);

const volConeStationRing = new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
);
volConeStationRing.position.set(POS.volumeConeX, 0.01, 0);
volumeGroup.add(volConeStationRing);

function rebuildVolumeGeometries() {
    // Cylinder Body
    disposeGeometry(volCylMesh);
    volCylMesh.geometry = new THREE.CylinderGeometry(appState.r, appState.r, appState.h, 96, 1, true).translate(0, appState.h / 2, 0);

    disposeGeometry(volCylBottomDisc);
    volCylBottomDisc.geometry = new THREE.CircleGeometry(appState.r, 64).rotateX(-Math.PI / 2);

    disposeGeometry(volCylWater);
    volCylWater.geometry = new THREE.CylinderGeometry(appState.r - 0.04, appState.r - 0.04, appState.h, 96).translate(0, appState.h / 2, 0);

    disposeGeometry(volCylWaterDisc);
    volCylWaterDisc.geometry = new THREE.CircleGeometry(appState.r - 0.045, 64).rotateX(-Math.PI / 2);

    // Cone Body
    let cg = new THREE.ConeGeometry(appState.r, appState.h, 96, 1, true);
    cg.translate(0, -appState.h / 2, 0);
    cg.rotateX(Math.PI);
    disposeGeometry(volConeMesh);
    volConeMesh.geometry = cg;

    let cwg = new THREE.ConeGeometry(appState.r - 0.04, appState.h - 0.04, 96);
    cwg.translate(0, -(appState.h - 0.04) / 2, 0);
    cwg.rotateX(Math.PI);
    disposeGeometry(volConeWater);
    volConeWater.geometry = cwg;

    let cwd = new THREE.CircleGeometry(appState.r - 0.05, 64);
    cwd.rotateX(-Math.PI / 2);
    cwd.translate(0, appState.h - 0.02, 0);
    disposeGeometry(volConeWaterDisc);
    volConeWaterDisc.geometry = cwd;

    // Outlines & Lines
    clearGroupSafely(volCylLines);
    volCylLines.add(createCircleLine(appState.r, appState.h, SHARED_MATS.lineCyan));
    volCylLines.add(createCircleLine(appState.r, 0, SHARED_MATS.lineCyan));
    const cylSides = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-appState.r, 0, 0), new THREE.Vector3(-appState.r, appState.h, 0),
        new THREE.Vector3(appState.r, 0, 0), new THREE.Vector3(appState.r, appState.h, 0)
    ]);
    volCylLines.add(new THREE.LineSegments(cylSides, SHARED_MATS.lineCyan));

    clearGroupSafely(volConeLines);
    volConeLines.add(createCircleLine(appState.r, appState.h, SHARED_MATS.lineAmber));
    const coneSides = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(-appState.r, appState.h, 0),
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(appState.r, appState.h, 0),
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, appState.h, -appState.r),
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, appState.h, appState.r)
    ]);
    volConeLines.add(new THREE.LineSegments(coneSides, SHARED_MATS.lineAmber));

    // Gauge Marks on Ruler
    clearGroupSafely(volRulerGroup);
    const rulerX = -appState.r - 0.55;
    const rulerPts = [
        new THREE.Vector3(rulerX, 0, 0), new THREE.Vector3(rulerX, appState.h, 0),
        new THREE.Vector3(rulerX - 0.2, 0, 0), new THREE.Vector3(rulerX, 0, 0),
        new THREE.Vector3(rulerX - 0.2, appState.h / 3, 0), new THREE.Vector3(rulerX, appState.h / 3, 0),
        new THREE.Vector3(rulerX - 0.2, (2 * appState.h) / 3, 0), new THREE.Vector3(rulerX, (2 * appState.h) / 3, 0),
        new THREE.Vector3(rulerX - 0.2, appState.h, 0), new THREE.Vector3(rulerX, appState.h, 0)
    ];
    volRulerGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(rulerPts), SHARED_MATS.lineCyan));

    // Station Rings
    disposeGeometry(volCylStationRing);
    volCylStationRing.geometry = new THREE.RingGeometry(appState.r + 0.1, appState.r + 0.18, 64).rotateX(-Math.PI / 2);

    disposeGeometry(volConeStationRing);
    volConeStationRing.geometry = new THREE.RingGeometry(appState.r + 0.1, appState.r + 0.18, 64).rotateX(-Math.PI / 2);

    // 3D Dimension Badges & Guidelines for Cylinder
    clearGroupSafely(volCylLabels);
    volCylLabels.visible = appState.labelsVisible;
    if (appState.labelsVisible) {
        // Center O (offset bottom-left of center to avoid overlap)
        const oBadge = Label3DManager.createBadge('O', '#38bdf8', 'rgba(15, 23, 42, 0.9)', '#38bdf8', 90, 52, 'Tâm đáy hình trụ (O)');
        if (oBadge) { oBadge.position.set(-0.55, -0.38, 0); volCylLabels.add(oBadge); }

        // Radius label r (centered along base radius)
        const rBadge = Label3DManager.createBadge(`r = ${appState.r.toFixed(1)} ${appState.unit}`, '#facc15', 'rgba(15, 23, 42, 0.9)', '#facc15', 180, 52, `Bán kính đáy trụ: r = ${appState.r.toFixed(1)} ${appState.unit}`);
        if (rBadge) { rBadge.position.set(appState.r * 0.55, -0.38, 0); volCylLabels.add(rBadge); }
        const rPts = [new THREE.Vector3(0, 0.05, 0), new THREE.Vector3(appState.r, 0.05, 0)];
        volCylLabels.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rPts), SHARED_MATS.lineAmber));

        // Height label h (clear of cylinder surface)
        const hBadge = Label3DManager.createBadge(`h = ${appState.h.toFixed(1)} ${appState.unit}`, '#38bdf8', 'rgba(15, 23, 42, 0.9)', '#38bdf8', 180, 52, `Chiều cao trụ: h = ${appState.h.toFixed(1)} ${appState.unit}`);
        if (hBadge) { hBadge.position.set(-appState.r - 0.85, appState.h / 2, 0); volCylLabels.add(hBadge); }
        const hPts = [new THREE.Vector3(-appState.r - 0.25, 0, 0), new THREE.Vector3(-appState.r - 0.25, appState.h, 0)];
        volCylLabels.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(hPts), SHARED_MATS.lineCyan));

        // Top Header Badge (well above top rim to prevent overlap)
        const cylTopBadge = Label3DManager.createBadge(`V = πr²h`, '#38bdf8', 'rgba(7, 15, 30, 0.95)', '#0ea5e9', 180, 52, `Thể tích hình trụ: V = πr²h`);
        if (cylTopBadge) { cylTopBadge.position.set(0, appState.h + 0.95, 0); volCylLabels.add(cylTopBadge); }
    }

    // 3D Dimension Badges & Guidelines for Cone
    clearGroupSafely(volConeLabels);
    volConeLabels.visible = appState.labelsVisible;
    if (appState.labelsVisible) {
        // Apex S (below the apex point)
        const sBadge = Label3DManager.createBadge('S', '#f43f5e', 'rgba(15, 23, 42, 0.9)', '#f43f5e', 90, 52, 'Đỉnh hình nón (S)');
        if (sBadge) { sBadge.position.set(0, -0.42, 0); volConeLabels.add(sBadge); }

        // Base center O' (offset left of base top center)
        const oPrimeBadge = Label3DManager.createBadge("O'", '#38bdf8', 'rgba(15, 23, 42, 0.9)', '#38bdf8', 90, 52, "Tâm đáy hình nón (O')");
        if (oPrimeBadge) { oPrimeBadge.position.set(-0.6, appState.h + 0.38, 0); volConeLabels.add(oPrimeBadge); }

        // Height axis line down center
        const hPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, appState.h, 0)];
        volConeLabels.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(hPts), SHARED_MATS.lineAxis));

        // Height label h (offset left of axis)
        const hBadge = Label3DManager.createBadge(`h = ${appState.h.toFixed(1)} ${appState.unit}`, '#38bdf8', 'rgba(15, 23, 42, 0.9)', '#38bdf8', 180, 52, `Chiều cao nón: h = ${appState.h.toFixed(1)} ${appState.unit}`);
        if (hBadge) { hBadge.position.set(-appState.r * 0.5 - 0.75, appState.h / 2, 0); volConeLabels.add(hBadge); }

        // Radius line on top base
        const rPts = [new THREE.Vector3(0, appState.h, 0), new THREE.Vector3(appState.r, appState.h, 0)];
        volConeLabels.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rPts), SHARED_MATS.lineAmber));

        // Radius label r (offset right of base center)
        const rBadge = Label3DManager.createBadge(`r = ${appState.r.toFixed(1)} ${appState.unit}`, '#facc15', 'rgba(15, 23, 42, 0.9)', '#facc15', 180, 52, `Bán kính đáy nón: r = ${appState.r.toFixed(1)} ${appState.unit}`);
        if (rBadge) { rBadge.position.set(appState.r * 0.55, appState.h + 0.38, 0); volConeLabels.add(rBadge); }

        // Slant line l (offset right of hypotenuse)
        const slantBadge = Label3DManager.createBadge(`l = ${appState.l.toFixed(2)} ${appState.unit}`, '#f43f5e', 'rgba(15, 23, 42, 0.9)', '#f43f5e', 180, 52, `Đường sinh nón: l = ${appState.l.toFixed(2)} ${appState.unit}`);
        if (slantBadge) { slantBadge.position.set(appState.r * 0.55 + 0.8, appState.h / 2, 0); volConeLabels.add(slantBadge); }

        // Top Header Badge: Chỉ hiện công thức V = 1/3 πr²h khi đã hoàn thành cả 3 lần rót nước hoặc sang bước Rút ra kết luận
        const isPourFinished = (appState.currentPour >= 3);
        const isConclusionStep = (typeof lessonState !== 'undefined' && lessonState.currentStageIndex === 5 && lessonState.currentStepIndex >= 3);
        const isAfterStage5 = (typeof lessonState !== 'undefined' && lessonState.currentStageIndex > 5);
        const canShowConeFormula = isPourFinished || isConclusionStep || isAfterStage5;

        if (canShowConeFormula) {
            const coneTopBadge = Label3DManager.createBadge(`V = 1/3 πr²h`, '#f59e0b', 'rgba(7, 15, 30, 0.95)', '#f59e0b', 200, 52, `Thể tích hình nón: V = 1/3 πr²h`);
            if (coneTopBadge) { coneTopBadge.position.set(0, appState.h + 1.15, 0); volConeLabels.add(coneTopBadge); }
        } else {
            const coneMysteryBadge = Label3DManager.createBadge(`V_nón = ?`, '#f59e0b', 'rgba(7, 15, 30, 0.95)', '#f59e0b', 160, 52, `Dự đoán & thí nghiệm rót 3 lần để khám phá công thức!`);
            if (coneMysteryBadge) { coneMysteryBadge.position.set(0, appState.h + 1.15, 0); volConeLabels.add(coneMysteryBadge); }
        }
    }
}

function handlePour(step) {
    if (appState.isVolumeAnimating) return;
    appState.isVolumeAnimating = true;

    const pourLipX = POS.volumeCylX + appState.r - 0.15;
    const pourLipY = appState.h + 0.4;
    const tiltAngle = Math.PI / 2.3;

    const rimOffsetX = -appState.r * Math.cos(tiltAngle) - appState.h * Math.sin(tiltAngle);
    const rimOffsetY = -appState.r * Math.sin(tiltAngle) + appState.h * Math.cos(tiltAngle);
    const targetTipX = pourLipX - rimOffsetX;
    const targetTipY = pourLipY - rimOffsetY;

    const tl = gsap.timeline({
        onComplete: () => {
            appState.currentPour = step;
            updateVolumeUI();
            updateGuidedUI();
            if (step === 3) {
                appState.achievements.volume = true;
                persistState();
                fireConfetti();
                showVictoryBanner();
                appState.isVolumeAnimating = false;
                rebuildVolumeGeometries(); // Reveal cone formula badge now!
                if (typeof AudioEngine !== 'undefined' && AudioEngine.fanfare) AudioEngine.fanfare();
                if (typeof VoiceNarrator !== 'undefined' && appState.voiceEnabled) {
                    VoiceNarrator.speak('Đổ lần ba: Hình trụ đã đầy nước hoàn toàn! Đúng ba hình nón đầy nước làm đầy một hình trụ. Do đó thể tích hình nón bằng một phần ba thể tích hình trụ: V bằng một phần ba nhân pi nhân r bình phương nhân h.');
                }
            } else {
                if (typeof AudioEngine !== 'undefined' && AudioEngine.success) AudioEngine.success();
                if (typeof VoiceNarrator !== 'undefined' && appState.voiceEnabled) {
                    if (step === 1) VoiceNarrator.speak('Đổ lần một: Mực nước trong hình trụ đạt một phần ba chiều cao.');
                    else if (step === 2) VoiceNarrator.speak('Đổ lần hai: Mực nước trong hình trụ đạt hai phần ba chiều cao.');
                }
                refillCone();
            }
        }
    });

    tl.to(volConeGroup.position, { x: targetTipX, y: targetTipY, duration: 1.3, ease: 'power2.inOut' }, 'move');
    tl.to(volConeGroup.rotation, { z: tiltAngle, duration: 1.3, ease: 'power2.inOut' }, 'move');

    const currentWaterY = (step - 1) * (appState.h / 3);
    const dropDistance = pourLipY - currentWaterY;

    tl.call(() => {
        if (typeof AudioEngine !== 'undefined' && AudioEngine.pour) {
            AudioEngine.pour(1.6);
        }
        volStream.position.set(pourLipX, pourLipY, 0);
        volStream.scale.set(1, 0.001, 1);
        volStream.visible = true;
        gsap.to(volStream.scale, { y: dropDistance, duration: 0.25, ease: 'power1.out' });

        droplets.forEach((drop, idx) => {
            drop.position.set(pourLipX + (Math.random() - 0.5) * 0.1, pourLipY - idx * (dropDistance / 14), 0);
            drop.visible = true;
        });
    }, null, 'move+=1.1');

    tl.to(volConeWater.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 1.6, ease: 'power1.inOut' }, 'move+=1.3');
    tl.to(volConeWaterDisc.scale, { x: 0.001, y: 0.001, duration: 1.4, ease: 'power1.inOut' }, 'move+=1.3');

    const targetScaleY = step * (1 / 3);
    tl.to(volCylWater.scale, {
        y: targetScaleY,
        duration: 1.6,
        ease: 'power1.inOut',
        onUpdate: () => {
            volCylWaterDisc.visible = true;
            volCylWaterDisc.position.y = volCylWater.scale.y * appState.h;
        }
    }, 'move+=1.3');

    tl.call(() => {
        gsap.to(volStream.scale, {
            y: 0.001,
            duration: 0.2,
            onComplete: () => {
                volStream.visible = false;
                droplets.forEach(d => (d.visible = false));
            }
        });
    }, null, 'move+=2.85');

    if (step === 3) {
        tl.to(volConeGroup.position, { x: POS.volumeConeX, y: 0, duration: 1.1, ease: 'power2.inOut' }, 'move+=3.1');
        tl.to(volConeGroup.rotation, { z: 0, duration: 1.1, ease: 'power2.inOut' }, 'move+=3.1');
    }
}

function refillCone() {
    const tl = gsap.timeline({ onComplete: () => { appState.isVolumeAnimating = false; } });
    tl.to(volConeGroup.position, { x: POS.volumeConeX, y: 0, duration: 1.1, ease: 'power2.inOut' }, 0);
    tl.to(volConeGroup.rotation, { z: 0, duration: 1.1, ease: 'power2.inOut' }, 0);
    tl.to(volConeWater.scale, { x: 1, y: 1, z: 1, duration: 0.7, ease: 'back.out(1.8)' }, 0.8);
    tl.to(volConeWaterDisc.scale, { x: 1, y: 1, duration: 0.7, ease: 'back.out(1.8)' }, 0.8);
}

let volAutoPlayInterval = null;
let volAutoPlayTimeout = null;

function clearVolumeAutoPlay() {
    appState.isVolumeAutoPlaying = false;
    if (volAutoPlayInterval) {
        clearInterval(volAutoPlayInterval);
        volAutoPlayInterval = null;
    }
    if (volAutoPlayTimeout) {
        clearTimeout(volAutoPlayTimeout);
        volAutoPlayTimeout = null;
    }
}

function playVolumeAuto() {
    if (appState.isVolumeAnimating) return;
    clearVolumeAutoPlay();
    appState.isVolumeAutoPlaying = true;
    
    function runNextStep(s) {
        if (!appState.isVolumeAutoPlaying || s > 3) {
            clearVolumeAutoPlay();
            return;
        }
        handlePour(s);
        volAutoPlayInterval = setInterval(() => {
            if (!appState.isVolumeAnimating) {
                if (volAutoPlayInterval) {
                    clearInterval(volAutoPlayInterval);
                    volAutoPlayInterval = null;
                }
                if (appState.isVolumeAutoPlaying && s < 3) {
                    volAutoPlayTimeout = setTimeout(() => runNextStep(s + 1), 1000);
                } else {
                    clearVolumeAutoPlay();
                }
            }
        }, 100);
    }
    runNextStep(appState.currentPour + 1);
}

function resetVolumeSimulation(showToastMsg = false) {
    clearVolumeAutoPlay();
    gsap.killTweensOf(volConeGroup.position);
    gsap.killTweensOf(volConeGroup.rotation);
    gsap.killTweensOf(volConeWater.scale);
    gsap.killTweensOf(volConeWaterDisc.scale);
    gsap.killTweensOf(volCylWater.scale);
    gsap.killTweensOf(volStream.scale);

    appState.isVolumeAnimating = false;
    appState.currentPour = 0;
    updateVolumeUI();
    rebuildVolumeGeometries();
    updateGuidedUI();
    closeVictoryBanner();

    volCylWater.scale.y = 0.001;
    volCylWaterDisc.position.y = 0.01;
    volCylWaterDisc.visible = false;

    volConeGroup.position.set(POS.volumeConeX, 0, 0);
    volConeGroup.rotation.set(0, 0, 0);
    volConeWater.scale.set(1, 1, 1);
    volConeWaterDisc.scale.set(1, 1, 1);

    volStream.visible = false;
    droplets.forEach(d => (d.visible = false));

    if (showToastMsg) {
        showToast('Đã đặt lại thí nghiệm thể tích.');
    }
}

// ==========================================
// 7. MODE 2: KHAI TRIỂN (NET DISPLAY & UNROLLING)
// ==========================================
// Main container floating clearly above laboratory pedestal (Requirement 1.4 & 1.5)
const netDisplayGroup = new THREE.Group();
netGroup.add(netDisplayGroup);
netDisplayGroup.position.set(0, getModelFloatY(), 0);

// Subgroups for Shape, Guides, and Labels
const coneNetGroup = new THREE.Group();
const cylNetGroup = new THREE.Group();
const netGuidesGroup = new THREE.Group();
const netLabelsGroup = new THREE.Group();

netDisplayGroup.add(coneNetGroup);
netDisplayGroup.add(cylNetGroup);
netDisplayGroup.add(netGuidesGroup);
netDisplayGroup.add(netLabelsGroup);

// Backward-compatible alias
const trueNetGroup = netDisplayGroup;

// Cone Unfold Meshes
const coneUnfoldLateralMesh = new THREE.Mesh(new THREE.BufferGeometry(), SHARED_MATS.netLateral);
coneUnfoldLateralMesh.castShadow = true;
coneUnfoldLateralMesh.receiveShadow = true;

const coneUnfoldBaseMesh = new THREE.Mesh(new THREE.BufferGeometry(), SHARED_MATS.netBase);
coneUnfoldBaseMesh.castShadow = true;
coneUnfoldBaseMesh.receiveShadow = true;

const coneUnfoldOutline = new THREE.LineSegments(new THREE.BufferGeometry(), SHARED_MATS.lineAmber);
const coneBaseOutlineLine = new THREE.LineLoop(new THREE.BufferGeometry(), SHARED_MATS.lineCyan);
const coneCutLineGroup = new THREE.Group();

coneNetGroup.add(coneUnfoldLateralMesh);
coneNetGroup.add(coneUnfoldBaseMesh);
coneNetGroup.add(coneUnfoldOutline);
coneNetGroup.add(coneBaseOutlineLine);
coneNetGroup.add(coneCutLineGroup);

// Cylinder Unfold Meshes
const cylUnfoldLateralMesh = new THREE.Mesh(new THREE.BufferGeometry(), SHARED_MATS.netLateral);
cylUnfoldLateralMesh.castShadow = true;
cylUnfoldLateralMesh.receiveShadow = true;

const cylUnfoldTopBaseMesh = new THREE.Mesh(new THREE.BufferGeometry(), SHARED_MATS.netBase);
cylUnfoldTopBaseMesh.castShadow = true;
cylUnfoldTopBaseMesh.receiveShadow = true;

const cylUnfoldBtmBaseMesh = new THREE.Mesh(new THREE.BufferGeometry(), SHARED_MATS.netBase);
cylUnfoldBtmBaseMesh.castShadow = true;
cylUnfoldBtmBaseMesh.receiveShadow = true;

const cylUnfoldOutline = new THREE.LineSegments(new THREE.BufferGeometry(), SHARED_MATS.lineAmber);
const cylTopOutlineLine = new THREE.LineLoop(new THREE.BufferGeometry(), SHARED_MATS.lineCyan);
const cylBtmOutlineLine = new THREE.LineLoop(new THREE.BufferGeometry(), SHARED_MATS.lineCyan);

cylNetGroup.add(cylUnfoldLateralMesh);
cylNetGroup.add(cylUnfoldTopBaseMesh);
cylNetGroup.add(cylUnfoldBtmBaseMesh);
cylNetGroup.add(cylUnfoldOutline);
cylNetGroup.add(cylTopOutlineLine);
cylNetGroup.add(cylBtmOutlineLine);

/**
 * Creates the exact mathematical circular sector for cone lateral surface using THREE.Shape
 * @param {number} r Base radius
 * @param {number} h Height
 * @returns {THREE.ShapeGeometry}
 */
function createConeSectorGeometry(r, h) {
    const l = MathCore.getSlant(r, h);
    const theta = MathCore.getConeSectorAngleRad(r, h);
    const halfTheta = theta / 2;
    const startAngle = -Math.PI / 2 - halfTheta;
    const endAngle = -Math.PI / 2 + halfTheta;

    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    // Draw arc counter-clockwise from startAngle to endAngle
    shape.absarc(0, 0, l, startAngle, endAngle, false);
    shape.lineTo(0, 0);
    shape.closePath();

    return new THREE.ShapeGeometry(shape, 72);
}

/**
 * Updates Cone Unfold Geometry, Guides, and Labels
 * @param {number} p Progress 0.0 (3D cone standing) -> 1.0 (flat sector & base disk on pedestal)
 */
function updateTrueConeUnfold(p) {
    const r = appState.r;
    const h = appState.h;
    const l = MathCore.getSlant(r, h);
    const theta = MathCore.getConeSectorAngleRad(r, h);
    const thetaDeg = MathCore.getConeSectorAngleDeg(r, h);
    const u = appState.unit;
    const gap = 0.06;

    // Centering calculation on pedestal:
    // Total depth = l + 2r + gap. Centering offset = (l + 2r + gap) / 2.
    const totalDepth = l + 2 * r + gap;
    const zMid = totalDepth / 2;
    const targetBaseZ = l + r + gap - zMid;
    const currentBaseZ = (1 - p) * 0 + p * targetBaseZ;

    // 1. Lateral Surface (Quạt tròn)
    if (p >= 0.999) {
        // Exact THREE.Shape geometry when fully flat
        disposeGeometry(coneUnfoldLateralMesh);
        coneUnfoldLateralMesh.geometry = createConeSectorGeometry(r, h);
        coneUnfoldLateralMesh.rotation.set(-Math.PI / 2, 0, 0);
        coneUnfoldLateralMesh.position.set(0, 0.002, -zMid);

        // Exact Outline
        disposeGeometry(coneUnfoldOutline);
        const halfTheta = theta / 2;
        const startA = -Math.PI / 2 - halfTheta;
        const endA = -Math.PI / 2 + halfTheta;
        const outlinePts = [];
        // Apex to arc start
        outlinePts.push(0, 0, 0, l * Math.cos(startA), l * Math.sin(startA), 0);
        // Along arc
        const segs = 72;
        for (let i = 0; i < segs; i++) {
            const a1 = startA + (i / segs) * theta;
            const a2 = startA + ((i + 1) / segs) * theta;
            outlinePts.push(l * Math.cos(a1), l * Math.sin(a1), 0, l * Math.cos(a2), l * Math.sin(a2), 0);
        }
        // Arc end back to apex
        outlinePts.push(l * Math.cos(endA), l * Math.sin(endA), 0, 0, 0, 0);
        coneUnfoldOutline.geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(outlinePts, 3));
        coneUnfoldOutline.rotation.set(-Math.PI / 2, 0, 0);
        coneUnfoldOutline.position.set(0, 0.004, -zMid);
        clearGroupSafely(coneCutLineGroup);
        coneCutLineGroup.visible = false;
    } else {
        // Continuous, smooth parametric unroll from 3D cone (p=0) to flat net (p=1)
        const segs = 64;
        const currentAngleSpan = (1 - p) * 2 * Math.PI + p * theta;
        const currentRadius = (1 - p) * r + p * l;
        const apexY = (1 - p) * h;
        const apexZ = -p * zMid;

        const positions = [];
        const indices = [];
        const outlinePts = [];

        // Apex (Vertex 0)
        positions.push(0, apexY, apexZ);

        const halfSpan = currentAngleSpan / 2;
        for (let i = 0; i <= segs; i++) {
            const t = i / segs;
            const phi = -halfSpan + t * currentAngleSpan;
            const curX = currentRadius * Math.sin(phi);
            const curZ = currentRadius * Math.cos(phi) + apexZ;
            const curY = 0.002;

            positions.push(curX, curY, curZ);

            if (i < segs) {
                indices.push(0, i + 1, i + 2);
            }
        }

        disposeGeometry(coneUnfoldLateralMesh);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        coneUnfoldLateralMesh.geometry = geo;
        coneUnfoldLateralMesh.rotation.set(0, 0, 0);
        coneUnfoldLateralMesh.position.set(0, 0, 0);

        // Outlines
        outlinePts.push(0, apexY, apexZ, positions[3], positions[4], positions[5]);
        outlinePts.push(0, apexY, apexZ, positions[positions.length - 3], positions[positions.length - 2], positions[positions.length - 1]);
        for (let i = 0; i < segs; i++) {
            const idx1 = (i + 1) * 3;
            const idx2 = (i + 2) * 3;
            outlinePts.push(positions[idx1], positions[idx1 + 1], positions[idx1 + 2], positions[idx2], positions[idx2 + 1], positions[idx2 + 2]);
        }
        disposeGeometry(coneUnfoldOutline);
        coneUnfoldOutline.geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(outlinePts, 3));
        coneUnfoldOutline.rotation.set(0, 0, 0);
        coneUnfoldOutline.position.set(0, 0.004, 0);

        // Stage 3 Step 1 Cut Line: Prominent dashed slant cut line (Requirement 2: chỉnh lên 1 xíu và bằng nét đứt)
        clearGroupSafely(coneCutLineGroup);
        if (p < 0.15) {
            coneCutLineGroup.visible = true;
            const pApex = new THREE.Vector3(0, apexY, apexZ);
            // Seam location is at the boundary where parametric unroll splits
            const pBaseCut = new THREE.Vector3(positions[3], positions[4], positions[5]);

            // Thick dashed tube rod segments along slant cut line (clear, crisp 3D dashes)
            const dashCount = 7;
            for (let d = 0; d < dashCount; d++) {
                const t1 = d / dashCount;
                const t2 = (d + 0.55) / dashCount;
                const pt1 = new THREE.Vector3().lerpVectors(pApex, pBaseCut, t1);
                const pt2 = new THREE.Vector3().lerpVectors(pApex, pBaseCut, t2);
                const dashRod = createTubeRod(pt1, pt2, 0.024, SHARED_MATS.tubeSlant);
                coneCutLineGroup.add(dashRod);
            }

            // Dashed line overlay
            const dashedLineGeo = new THREE.BufferGeometry().setFromPoints([pApex, pBaseCut]);
            const dashedLineMat = new THREE.LineDashedMaterial({
                color: 0xf43f5e,
                dashSize: 0.22,
                gapSize: 0.12,
                linewidth: 3,
                depthTest: true
            });
            const dashedLine = new THREE.Line(dashedLineGeo, dashedLineMat);
            dashedLine.computeLineDistances();
            coneCutLineGroup.add(dashedLine);

            // Scissors badge right at the middle of the cut line
            const midCut = new THREE.Vector3().lerpVectors(pApex, pBaseCut, 0.5);
            const badgeCut = Label3DManager.createBadge('✂️ Đường cắt SB', '#f43f5e', 'rgba(15,23,42,0.92)', '#f43f5e', 180, 50, 'Cắt dọc theo đường sinh SB để trải phẳng');
            if (badgeCut) {
                badgeCut.position.set(midCut.x, midCut.y, midCut.z - 0.42);
                coneCutLineGroup.add(badgeCut);
            }
        } else {
            coneCutLineGroup.visible = false;
        }
    }

    // 2. Base Circle (Hình tròn đáy)
    disposeGeometry(coneUnfoldBaseMesh);
    coneUnfoldBaseMesh.geometry = new THREE.CircleGeometry(r, 64);
    coneUnfoldBaseMesh.rotation.set(-Math.PI / 2, 0, 0);
    coneUnfoldBaseMesh.position.set(0, 0.003, currentBaseZ);

    disposeGeometry(coneBaseOutlineLine);
    const circlePoints = [];
    const cSegs = 64;
    for (let i = 0; i <= cSegs; i++) {
        const a = (i / cSegs) * 2 * Math.PI;
        circlePoints.push(new THREE.Vector3(r * Math.cos(a), 0, r * Math.sin(a)));
    }
    coneBaseOutlineLine.geometry = new THREE.BufferGeometry().setFromPoints(circlePoints);
    coneBaseOutlineLine.rotation.set(0, 0, 0);
    coneBaseOutlineLine.position.set(0, 0.005, currentBaseZ);

    // 3. Educational Guide Lines and 3D Labels (only when unfolded enough to read)
    clearGroupSafely(netGuidesGroup);
    clearGroupSafely(netLabelsGroup);

    if (p >= 0.45 && appState.labelsVisible) {
        const apexZ = -p * zMid;
        const halfTheta = (theta / 2);
        const slantEdgeX = l * Math.sin(halfTheta);
        const slantEdgeZ = l * Math.cos(halfTheta) + apexZ;

        // Slant height line along sector right edge
        const slantGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0.015, apexZ),
            new THREE.Vector3(slantEdgeX, 0.015, slantEdgeZ)
        ]);
        const slantLine = new THREE.Line(slantGeo, SHARED_MATS.lineAmber);
        netGuidesGroup.add(slantLine);

        // Slant height label
        const badgeSlant = Label3DManager.createBadge(`l = ${l.toFixed(2)} ${u}`, '#f59e0b', 'rgba(15,23,42,0.9)', '#f59e0b', 180, 52, `Đường sinh nón: l = ${l.toFixed(2)} ${u}`);
        badgeSlant.position.set(slantEdgeX * 0.55 + 0.35, 0.35, (slantEdgeZ + apexZ) * 0.5);
        netLabelsGroup.add(badgeSlant);

        // Sector apex badge
        const badgeApex = Label3DManager.createBadge('S', '#f59e0b', 'rgba(15,23,42,0.9)', '#f59e0b', 90, 52, 'Đỉnh nón (S)');
        badgeApex.position.set(0, 0.45, apexZ - 0.35);
        netLabelsGroup.add(badgeApex);

        // Sector angle arc & badge
        const angleArcRadius = Math.min(1.4, l * 0.38);
        const arcPts = [];
        const aSteps = 24;
        const curSpan = (1 - p) * 2 * Math.PI + p * theta;
        const curHalfSpan = curSpan / 2;
        for (let i = 0; i <= aSteps; i++) {
            const phi = -curHalfSpan + (i / aSteps) * curSpan;
            arcPts.push(new THREE.Vector3(angleArcRadius * Math.sin(phi), 0.015, angleArcRadius * Math.cos(phi) + apexZ));
        }
        const arcLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPts), SHARED_MATS.linePink);
        netGuidesGroup.add(arcLine);

        const badgeAngle = Label3DManager.createBadge(`θ = ${thetaDeg.toFixed(1)}°`, '#ec4899', 'rgba(15,23,42,0.9)', '#ec4899', 150, 52, `Góc ở đỉnh quạt: θ = ${thetaDeg.toFixed(1)}°`);
        badgeAngle.position.set(0, 0.35, apexZ + angleArcRadius + 0.35);
        netLabelsGroup.add(badgeAngle);

        // Arc Length badge on sector curved edge
        const arcMidZ = l + apexZ;
        const badgeArc = Label3DManager.createBadge(`2πr = ${(2 * Math.PI * r).toFixed(2)} ${u}`, '#38bdf8', 'rgba(15,23,42,0.9)', '#38bdf8', 190, 52, `Độ dài cung quạt: 2πr = ${(2 * Math.PI * r).toFixed(2)} ${u}`);
        badgeArc.position.set(0, 0.35, arcMidZ - 0.25);
        netLabelsGroup.add(badgeArc);

        // Base radius line & badge
        const radiusGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0.015, currentBaseZ),
            new THREE.Vector3(r, 0.015, currentBaseZ)
        ]);
        const radiusLine = new THREE.Line(radiusGeo, SHARED_MATS.lineCyan);
        netGuidesGroup.add(radiusLine);

        const badgeRadius = Label3DManager.createBadge(`r = ${r.toFixed(1)} ${u}`, '#06b6d4', 'rgba(15,23,42,0.9)', '#06b6d4', 180, 52, `Bán kính đáy: r = ${r.toFixed(1)} ${u}`);
        badgeRadius.position.set(r * 0.5, 0.35, currentBaseZ);
        netLabelsGroup.add(badgeRadius);

        // Base circumference badge
        const badgeCircum = Label3DManager.createBadge(`C = ${(2 * Math.PI * r).toFixed(2)} ${u}`, '#06b6d4', 'rgba(15,23,42,0.9)', '#06b6d4', 190, 52, `Chu vi đáy: C = 2πr = ${(2 * Math.PI * r).toFixed(2)} ${u}`);
        badgeCircum.position.set(0, 0.35, currentBaseZ + r + 0.35);
        netLabelsGroup.add(badgeCircum);

        // Golden equivalence callout at full flat state
        if (p >= 0.88) {
            const badgeRule = Label3DManager.createBadge('★ Cung quạt = Chu vi đáy = 2πr', '#10b981', 'rgba(6,78,59,0.95)');
            badgeRule.position.set(0, 0.45, (arcMidZ + (currentBaseZ - r)) * 0.5);
            netLabelsGroup.add(badgeRule);
        }
    }
}

/**
 * Builds intermediate unrolling for cylinder
 * @param {number} p Progress 0.0 (3D cylinder) -> 1.0 (flat rectangle & two base disks)
 */
function updateTrueCylinderUnfold(p) {
    const r = appState.r;
    const h = appState.h;
    const circumference = MathCore.getBaseCircumference(r);
    const u = appState.unit;
    const gap = 0.06;

    const segments = 48;
    const positions = [];
    const indices = [];
    const outlinePts = [];

    // Current unrolled arc angle vs flat width
    const currentAngle = (1 - p) * 2 * Math.PI;
    const startA = -currentAngle / 2;

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const a = startA + t * currentAngle;

        // 3D curved point
        const x3d = r * Math.sin(a);
        const z3d = r * Math.cos(a) - r;

        // Flat unrolled point (lying flat on X-Z plane at p=1)
        const xFlat = (t - 0.5) * circumference;

        const curX = (1 - p) * x3d + p * xFlat;

        // In 3D (p=0), cylinder stands vertically (Y from 0 to h, Z around 0).
        // At p=1, rectangle lays flat on the pedestal surface (Y=0.002, Z from -h/2 to +h/2).
        const btmY = 0.002;
        const topY = (1 - p) * h + p * 0.002;
        const btmZ = (1 - p) * z3d + p * (h / 2);
        const topZ = (1 - p) * z3d - p * (h / 2);

        // Bottom vertex
        positions.push(curX, btmY, btmZ);
        // Top vertex
        positions.push(curX, topY, topZ);
    }

    for (let i = 0; i < segments; i++) {
        const b1 = i * 2;
        const t1 = i * 2 + 1;
        const b2 = (i + 1) * 2;
        const t2 = (i + 1) * 2 + 1;
        indices.push(b1, t1, b2);
        indices.push(t1, t2, b2);
    }

    disposeGeometry(cylUnfoldLateralMesh);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    cylUnfoldLateralMesh.geometry = geo;
    cylUnfoldLateralMesh.rotation.set(0, 0, 0);
    cylUnfoldLateralMesh.position.set(0, 0, 0);

    // Lateral Outlines
    for (let i = 0; i < segments; i++) {
        const b1 = i * 2 * 3;
        const b2 = (i + 1) * 2 * 3;
        const t1 = (i * 2 + 1) * 3;
        const t2 = ((i + 1) * 2 + 1) * 3;
        outlinePts.push(positions[b1], positions[b1 + 1], positions[b1 + 2], positions[b2], positions[b2 + 1], positions[b2 + 2]);
        outlinePts.push(positions[t1], positions[t1 + 1], positions[t1 + 2], positions[t2], positions[t2 + 1], positions[t2 + 2]);
    }
    // Left & Right borders
    outlinePts.push(positions[0], positions[1], positions[2], positions[3], positions[4], positions[5]);
    const last = positions.length - 6;
    outlinePts.push(positions[last], positions[last + 1], positions[last + 2], positions[last + 3], positions[last + 4], positions[last + 5]);

    disposeGeometry(cylUnfoldOutline);
    cylUnfoldOutline.geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(outlinePts, 3));
    cylUnfoldOutline.rotation.set(0, 0, 0);
    cylUnfoldOutline.position.set(0, 0.003, 0);

    // Top Base Disc
    const targetTopZ = -(h / 2 + r + gap);
    const curTopY = (1 - p) * h + p * 0.003;
    const curTopZ = (1 - p) * 0 + p * targetTopZ;
    disposeGeometry(cylUnfoldTopBaseMesh);
    cylUnfoldTopBaseMesh.geometry = new THREE.CircleGeometry(r, 64);
    cylUnfoldTopBaseMesh.position.set(0, curTopY, curTopZ);
    cylUnfoldTopBaseMesh.rotation.set(-Math.PI / 2, 0, 0);

    disposeGeometry(cylTopOutlineLine);
    const circlePoints = [];
    for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * 2 * Math.PI;
        circlePoints.push(new THREE.Vector3(r * Math.cos(a), 0, r * Math.sin(a)));
    }
    cylTopOutlineLine.geometry = new THREE.BufferGeometry().setFromPoints(circlePoints);
    cylTopOutlineLine.position.set(0, curTopY + 0.002, curTopZ);
    cylTopOutlineLine.rotation.set(0, 0, 0);

    // Bottom Base Disc
    const targetBtmZ = +(h / 2 + r + gap);
    const curBtmY = 0.003;
    const curBtmZ = (1 - p) * 0 + p * targetBtmZ;
    disposeGeometry(cylUnfoldBtmBaseMesh);
    cylUnfoldBtmBaseMesh.geometry = new THREE.CircleGeometry(r, 64);
    cylUnfoldBtmBaseMesh.position.set(0, curBtmY, curBtmZ);
    cylUnfoldBtmBaseMesh.rotation.set(-Math.PI / 2, 0, 0);

    disposeGeometry(cylBtmOutlineLine);
    cylBtmOutlineLine.geometry = new THREE.BufferGeometry().setFromPoints(circlePoints);
    cylBtmOutlineLine.position.set(0, curBtmY + 0.002, curBtmZ);
    cylBtmOutlineLine.rotation.set(0, 0, 0);

    // Guides & Labels
    clearGroupSafely(netGuidesGroup);
    clearGroupSafely(netLabelsGroup);

    if (p >= 0.45 && appState.labelsVisible) {
        // Height guide along rectangle side
        const badgeH = Label3DManager.createBadge(`h = ${h.toFixed(1)} ${u}`, '#f59e0b', 'rgba(15,23,42,0.9)', '#f59e0b', 180, 52, `Chiều cao trụ: h = ${h.toFixed(1)} ${u}`);
        badgeH.position.set(-circumference / 2 - 0.4, 0.35, 0);
        netLabelsGroup.add(badgeH);

        // Circumference / Width guide along rectangle top
        const badgeW = Label3DManager.createBadge(`2πr = ${circumference.toFixed(2)} ${u}`, '#06b6d4', 'rgba(15,23,42,0.9)', '#06b6d4', 190, 52, `Chu vi đáy: 2πr = ${circumference.toFixed(2)} ${u}`);
        badgeW.position.set(0, 0.35, h / 2 + 0.3);
        netLabelsGroup.add(badgeW);

        // Top base label
        const badgeTop = Label3DManager.createBadge(`r = ${r.toFixed(1)} ${u}`, '#06b6d4', 'rgba(15,23,42,0.9)', '#06b6d4', 180, 52, `Bán kính đáy trên: r = ${r.toFixed(1)} ${u}`);
        badgeTop.position.set(0, 0.35, curTopZ);
        netLabelsGroup.add(badgeTop);

        // Bottom base label
        const badgeBtm = Label3DManager.createBadge(`r = ${r.toFixed(1)} ${u}`, '#06b6d4', 'rgba(15,23,42,0.9)', '#06b6d4', 180, 52, `Bán kính đáy dưới: r = ${r.toFixed(1)} ${u}`);
        badgeBtm.position.set(0, 0.35, curBtmZ);
        netLabelsGroup.add(badgeBtm);
    }
}

function setUnfoldProgress(val) {
    appState.unfoldProgress = Math.max(0, Math.min(1, val));
    const slider = document.getElementById('slider-unfold-progress');
    if (slider) slider.value = Math.round(appState.unfoldProgress * 100);
    const label = document.getElementById('unfold-progress-val');
    if (label) label.innerText = Math.round(appState.unfoldProgress * 100) + '%';

    // Requirements 1.4, 1.5, 1.6: Smooth vertical interpolation from solid float height to flat net height
    const p = appState.unfoldProgress;
    const arch = (p > 0.05 && p < 0.95) ? Math.sin(p * Math.PI) * 0.22 : 0;
    netDisplayGroup.position.y = (1 - p) * getModelFloatY() + p * getFlatNetY() + arch;

    if (appState.shape === 'cone') {
        coneNetGroup.visible = true;
        cylNetGroup.visible = false;
        updateTrueConeUnfold(appState.unfoldProgress);
    } else {
        coneNetGroup.visible = false;
        cylNetGroup.visible = true;
        updateTrueCylinderUnfold(appState.unfoldProgress);
    }

    if (appState.unfoldProgress >= 0.99) {
        appState.achievements.net = true;
        persistState();
    }
}

function playUnfoldAuto() {
    if (appState.isUnfoldPlaying) return;
    appState.isUnfoldPlaying = true;
    const target = appState.unfoldProgress >= 0.98 ? 0 : 1;
    gsap.to(appState, {
        unfoldProgress: target,
        duration: 2.2,
        ease: 'power2.inOut',
        onUpdate: () => setUnfoldProgress(appState.unfoldProgress),
        onComplete: () => {
            appState.isUnfoldPlaying = false;
            if (target === 1) fireConfetti();
        }
    });
}

function resetUnfold() {
    gsap.killTweensOf(appState);
    appState.isUnfoldPlaying = false;
    setUnfoldProgress(0);
}

// ==========================================
// 8. MODE 3: QUAY TẠO KHỐI (REVOLUTION & SWEEP)
// ==========================================
// Entire revolution group floats above pedestal (Requirements 1.2 & 1.3)
const trueRevGroup = new THREE.Group();
revolutionGroup.add(trueRevGroup);
trueRevGroup.position.set(0, getModelFloatY(), 0);

// Mathematical generators for strictly angular-indexed swept meshes (zero GC during sweep)
function createSweptConeGeometry(r, h, segments = 72) {
    const positions = [];
    const indices = [];
    // Vertex 0: Apex (0, h, 0)
    positions.push(0, h, 0);
    // Vertex 1: Base Center (0, 0, 0)
    positions.push(0, 0, 0);
    // Vertices 2 .. segments + 2: Base rim points
    for (let i = 0; i <= segments; i++) {
        const phi = (i / segments) * Math.PI * 2;
        positions.push(r * Math.cos(phi), 0, r * Math.sin(phi));
    }
    // Slices in strict angular order
    for (let i = 0; i < segments; i++) {
        const p1 = 2 + i;
        const p2 = 2 + i + 1;
        // Lateral triangle: Apex(0) -> p1 -> p2
        indices.push(0, p1, p2);
        // Base disk triangle: Center(1) -> p2 -> p1
        indices.push(1, p2, p1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

function createSweptCylGeometry(r, h, segments = 72) {
    const positions = [];
    const indices = [];
    // Vertex 0: Top Center (0, h, 0)
    positions.push(0, h, 0);
    // Vertex 1: Bottom Center (0, 0, 0)
    positions.push(0, 0, 0);
    // Rim vertices
    for (let i = 0; i <= segments; i++) {
        const phi = (i / segments) * Math.PI * 2;
        const x = r * Math.cos(phi);
        const z = r * Math.sin(phi);
        positions.push(x, 0, z); // Bottom rim
        positions.push(x, h, z); // Top rim
    }
    // Slices in strict angular order
    for (let i = 0; i < segments; i++) {
        const b1 = 2 + 2 * i;
        const t1 = b1 + 1;
        const b2 = 2 + 2 * (i + 1);
        const t2 = b2 + 1;
        // Lateral quad: (b1, t1, b2), (t1, t2, b2)
        indices.push(b1, t1, b2);
        indices.push(t1, t2, b2);
        // Top disk cap: (0, t1, t2)
        indices.push(0, t1, t2);
        // Bottom disk cap: (1, b2, b1)
        indices.push(1, b2, b1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

// Swept Meshes with draw range control
const revFullConeMesh = new THREE.Mesh(createSweptConeGeometry(appState.r, appState.h), SHARED_MATS.revSwept);
trueRevGroup.add(revFullConeMesh);

const revFullCylMesh = new THREE.Mesh(createSweptCylGeometry(appState.r, appState.h), SHARED_MATS.revSwept);
trueRevGroup.add(revFullCylMesh);

// Central Axis Line (SO or OA)
const revAxisLine = new THREE.Line(new THREE.BufferGeometry(), SHARED_MATS.lineAxis);
trueRevGroup.add(revAxisLine);

// Stationary initial profile at phi = 0 (closes start cut-face when angle > 0)
const revStartProfileGroup = new THREE.Group();
trueRevGroup.add(revStartProfileGroup);
const revStartProfileMesh = new THREE.Mesh(new THREE.BufferGeometry(), SHARED_MATS.revProfile);
revStartProfileGroup.add(revStartProfileMesh);

// Dynamically Rotating Profile Group (Triangle SOB or Rectangle OABC rotating around Y-axis)
const revRotatingProfile = new THREE.Group();
trueRevGroup.add(revRotatingProfile);

const revProfileFill = new THREE.Mesh(new THREE.BufferGeometry(), SHARED_MATS.revProfile);
revRotatingProfile.add(revProfileFill);

const revProfileLinesGroup = new THREE.Group();
revRotatingProfile.add(revProfileLinesGroup);

const revProfileMarkersGroup = new THREE.Group();
revRotatingProfile.add(revProfileMarkersGroup);

const revProfileLabelsGroup = new THREE.Group();
revRotatingProfile.add(revProfileLabelsGroup);

// Base Angle Arc Group (shows arc alpha at O)
const revAngleArcGroup = new THREE.Group();
trueRevGroup.add(revAngleArcGroup);

// Trajectory of Point B (and Point C for Cylinder)
const revTrajectoryGroup = new THREE.Group();
trueRevGroup.add(revTrajectoryGroup);
const revTrajBtmLine = createCircleLine(appState.r, 0.015, SHARED_MATS.lineAxis);
const revTrajTopLine = createCircleLine(appState.r, appState.h, SHARED_MATS.lineAxis);
const revTrajBeadBtm = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), SHARED_MATS.pointYellow);
const revTrajBeadTop = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), SHARED_MATS.pointYellow);
revTrajectoryGroup.add(revTrajBtmLine);
revTrajectoryGroup.add(revTrajTopLine);
revTrajectoryGroup.add(revTrajBeadBtm);
revTrajectoryGroup.add(revTrajBeadTop);

// Ghost Profiles at 0, 90, 180, 270 deg
const revGhostGroup = new THREE.Group();
trueRevGroup.add(revGhostGroup);

// Shared marker sphere geometry (halved size for crispness)
const sphereMarkerGeo = new THREE.SphereGeometry(0.06, 16, 16);

function rebuildRevolutionBaseMeshes() {
    const r = appState.r;
    const h = appState.h;
    const l = appState.l;
    const u = (appState && appState.unit) || 'cm';
    const isCone = (appState.shape === 'cone');

    // 1. Rebuild swept base geometries
    disposeGeometry(revFullConeMesh);
    revFullConeMesh.geometry = createSweptConeGeometry(r, h, 72);

    disposeGeometry(revFullCylMesh);
    revFullCylMesh.geometry = createSweptCylGeometry(r, h, 72);

    // 2. Central Axis Line (with slight extension for clarity)
    disposeGeometry(revAxisLine);
    revAxisLine.geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -0.4, 0),
        new THREE.Vector3(0, h + 0.6, 0)
    ]);

    // 3. Stationary profile at 0 deg: permanently disabled so ONLY 1 triangle rotates (Item 1 user request)
    disposeGeometry(revStartProfileMesh);
    revStartProfileGroup.visible = false;
    revStartProfileMesh.visible = false;

    // 4. Rotating Profile components (Single right triangle SOB rotating around SO)
    clearGroupSafely(revProfileLinesGroup);
    clearGroupSafely(revProfileMarkersGroup);
    clearGroupSafely(revProfileLabelsGroup);
    disposeGeometry(revProfileFill);

    if (isCone) {
        // SOB Triangle Fill (Generating Right Triangle)
        const triVerts = new Float32Array([
            0, h, 0,   0, 0, 0,   r, 0, 0,
            0, h, 0,   r, 0, 0,   0, 0, 0
        ]);
        revProfileFill.geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(triVerts, 3));

        // Edge SO (Đường cao / Trục quay SO: 3D Tube Cyan rõ ràng, kích thước chuẩn)
        const tubeSO = createTubeRod(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, h, 0), 0.028, SHARED_MATS.tubeHeight);
        tubeSO.userData = { labelRole: 'axis' };

        // Edge OB (Bán kính đáy OB: 3D Tube Amber rõ ràng, kích thước chuẩn)
        const tubeOB = createTubeRod(new THREE.Vector3(0, 0, 0), new THREE.Vector3(r, 0, 0), 0.028, SHARED_MATS.tubeRadius);
        tubeOB.userData = { labelRole: 'radius' };

        // Edge SB (Đường sinh SB: 3D Tube Pink rõ ràng, kích thước chuẩn)
        const tubeSB = createTubeRod(new THREE.Vector3(0, h, 0), new THREE.Vector3(r, 0, 0), 0.028, SHARED_MATS.tubeSlant);
        tubeSB.userData = { labelRole: 'slant' };

        revProfileLinesGroup.add(tubeSO);
        revProfileLinesGroup.add(tubeOB);
        revProfileLinesGroup.add(tubeSB);

        // Prominent Right angle marker at O (Square tube lines + subtle plane fill)
        const raSize = Math.min(0.35, Math.min(r, h) * 0.2);
        const raTube1 = createTubeRod(new THREE.Vector3(0, raSize, 0), new THREE.Vector3(raSize, raSize, 0), 0.012, SHARED_MATS.tubeHeight);
        const raTube2 = createTubeRod(new THREE.Vector3(raSize, raSize, 0), new THREE.Vector3(raSize, 0, 0), 0.012, SHARED_MATS.tubeRadius);
        revProfileLinesGroup.add(raTube1);
        revProfileLinesGroup.add(raTube2);

        const sqGeo = new THREE.PlaneGeometry(raSize, raSize);
        sqGeo.translate(raSize / 2, raSize / 2, 0.002);
        const sqMesh = new THREE.Mesh(sqGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
        revProfileLinesGroup.add(sqMesh);

        // Vertex Marker Spheres
        const sphereS = new THREE.Mesh(sphereMarkerGeo, SHARED_MATS.pointCyan);
        sphereS.position.set(0, h, 0);
        sphereS.userData = { labelRole: 'apex' };
        const sphereO = new THREE.Mesh(sphereMarkerGeo, SHARED_MATS.pointYellow);
        sphereO.position.set(0, 0, 0);
        sphereO.userData = { labelRole: 'center' };
        const sphereB = new THREE.Mesh(sphereMarkerGeo, SHARED_MATS.pointPink);
        sphereB.position.set(r, 0, 0);
        sphereB.userData = { labelRole: 'slant' };
        revProfileMarkersGroup.add(sphereS);
        revProfileMarkersGroup.add(sphereO);
        revProfileMarkersGroup.add(sphereB);

        // 3D Badges: non-overlapping clear coordinates strictly aligned with single rotating profile
        const badgeS = Label3DManager.createBadge('S', '#38bdf8', 'rgba(15,23,42,0.92)', '#38bdf8', 90, 52, 'Đỉnh nón (S)');
        badgeS.position.set(0, h + 0.48, 0);
        const badgeO = Label3DManager.createBadge('O', '#facc15', 'rgba(15,23,42,0.92)', '#facc15', 90, 52, 'Tâm đáy (O)');
        badgeO.position.set(0, -0.42, 0.3);
        const badgeB = Label3DManager.createBadge('B', '#f43f5e', 'rgba(15,23,42,0.92)', '#f43f5e', 90, 52, 'Điểm đáy (B)');
        badgeB.position.set(r + 0.52, 0.12, 0);
        const badgeH = Label3DManager.createBadge(`h = ${h.toFixed(1)} ${u}`, '#38bdf8', 'rgba(15,23,42,0.9)', '#38bdf8', 180, 50, `Đường cao: h = ${h.toFixed(1)} ${u}`);
        badgeH.position.set(r * 0.22, h * 0.52, 0.15); // Kept inside SOB profile to prevent false symmetry ghost
        const badgeR = Label3DManager.createBadge(`r = ${r.toFixed(1)} ${u}`, '#facc15', 'rgba(15,23,42,0.9)', '#facc15', 180, 50, `Bán kính đáy: r = ${r.toFixed(1)} ${u}`);
        badgeR.position.set(r * 0.5, -0.45, 0);
        const badgeL = Label3DManager.createBadge(`l = ${l.toFixed(2)} ${u}`, '#f43f5e', 'rgba(15,23,42,0.9)', '#f43f5e', 180, 50, `Đường sinh: l = ${l.toFixed(2)} ${u}`);
        badgeL.position.set(r * 0.5 + 0.52, h * 0.5 + 0.25, 0);

        revProfileLabelsGroup.add(badgeS);
        revProfileLabelsGroup.add(badgeO);
        revProfileLabelsGroup.add(badgeB);
        revProfileLabelsGroup.add(badgeH);
        revProfileLabelsGroup.add(badgeR);
        revProfileLabelsGroup.add(badgeL);
    } else {
        // Rectangle OABC Fill: O(0,0,0), A(0,h,0), B(r,h,0), C(r,0,0)
        const rectVerts = new Float32Array([
            0, 0, 0,   r, 0, 0,   r, h, 0,
            0, 0, 0,   r, h, 0,   0, h, 0,
            0, 0, 0,   r, h, 0,   r, 0, 0,
            0, 0, 0,   0, h, 0,   r, h, 0
        ]);
        revProfileFill.geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(rectVerts, 3));

        // 3D Tube Rods for rectangle edges (Chuẩn nét, tinh tế)
        const tubeOA = createTubeRod(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, h, 0), 0.028, SHARED_MATS.tubeHeight);
        const tubeOC = createTubeRod(new THREE.Vector3(0, 0, 0), new THREE.Vector3(r, 0, 0), 0.028, SHARED_MATS.tubeRadius);
        const tubeAB = createTubeRod(new THREE.Vector3(0, h, 0), new THREE.Vector3(r, h, 0), 0.028, SHARED_MATS.tubeRadius);
        const tubeBC = createTubeRod(new THREE.Vector3(r, 0, 0), new THREE.Vector3(r, h, 0), 0.028, SHARED_MATS.tubeSlant);
        revProfileLinesGroup.add(tubeOA);
        revProfileLinesGroup.add(tubeOC);
        revProfileLinesGroup.add(tubeAB);
        revProfileLinesGroup.add(tubeBC);

        // Right angle markers at O and A
        const raSize = Math.min(0.32, Math.min(r, h) * 0.2);
        const raO1 = createTubeRod(new THREE.Vector3(0, raSize, 0), new THREE.Vector3(raSize, raSize, 0), 0.012, SHARED_MATS.tubeHeight);
        const raO2 = createTubeRod(new THREE.Vector3(raSize, raSize, 0), new THREE.Vector3(raSize, 0, 0), 0.012, SHARED_MATS.tubeRadius);
        const raA1 = createTubeRod(new THREE.Vector3(0, h - raSize, 0), new THREE.Vector3(raSize, h - raSize, 0), 0.012, SHARED_MATS.tubeHeight);
        const raA2 = createTubeRod(new THREE.Vector3(raSize, h - raSize, 0), new THREE.Vector3(raSize, h, 0), 0.012, SHARED_MATS.tubeRadius);
        revProfileLinesGroup.add(raO1);
        revProfileLinesGroup.add(raO2);
        revProfileLinesGroup.add(raA1);
        revProfileLinesGroup.add(raA2);

        // Vertex Marker Spheres
        const sphereO = new THREE.Mesh(sphereMarkerGeo, SHARED_MATS.pointCyan);
        sphereO.position.set(0, 0, 0);
        const sphereA = new THREE.Mesh(sphereMarkerGeo, SHARED_MATS.pointCyan);
        sphereA.position.set(0, h, 0);
        const sphereB = new THREE.Mesh(sphereMarkerGeo, SHARED_MATS.pointPink);
        sphereB.position.set(r, h, 0);
        const sphereC = new THREE.Mesh(sphereMarkerGeo, SHARED_MATS.pointYellow);
        sphereC.position.set(r, 0, 0);
        revProfileMarkersGroup.add(sphereO);
        revProfileMarkersGroup.add(sphereA);
        revProfileMarkersGroup.add(sphereB);
        revProfileMarkersGroup.add(sphereC);

        // Badges: concise symbols with click explanations
        const badgeO = Label3DManager.createBadge('O', '#38bdf8', 'rgba(15,23,42,0.92)', '#38bdf8', 90, 52, 'Tâm đáy dưới (O)');
        badgeO.position.set(0, -0.42, 0.3);
        const badgeA = Label3DManager.createBadge("A (O')", '#38bdf8', 'rgba(15,23,42,0.92)', '#38bdf8', 110, 52, "Tâm đáy trên (O')");
        badgeA.position.set(0, h + 0.42, 0.3);
        const badgeB = Label3DManager.createBadge('B', '#f43f5e', 'rgba(15,23,42,0.92)', '#f43f5e', 90, 52, 'Điểm đáy trên (B)');
        badgeB.position.set(r + 0.52, h + 0.35, 0);
        const badgeC = Label3DManager.createBadge('C', '#facc15', 'rgba(15,23,42,0.92)', '#facc15', 90, 52, 'Điểm đáy dưới (C)');
        badgeC.position.set(r + 0.52, -0.35, 0);

        revProfileLabelsGroup.add(badgeO);
        revProfileLabelsGroup.add(badgeA);
        revProfileLabelsGroup.add(badgeB);
        revProfileLabelsGroup.add(badgeC);
    }

    // 5. Trajectory Lines
    disposeGeometry(revTrajBtmLine);
    revTrajBtmLine.geometry = createCircleLine(r, 0.015, SHARED_MATS.lineAxis).geometry;
    disposeGeometry(revTrajTopLine);
    revTrajTopLine.geometry = createCircleLine(r, h, SHARED_MATS.lineAxis).geometry;
    revTrajTopLine.visible = !isCone;
    revTrajBeadTop.visible = !isCone;

    // 6. Ghost Profiles at 0, 90, 180, 270 deg
    clearGroupSafely(revGhostGroup);
    [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach(ang => {
        const g = new THREE.Group();
        g.rotation.y = ang;
        if (isCone) {
            const pts = [new THREE.Vector3(0, h, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(r, 0, 0), new THREE.Vector3(0, h, 0)];
            g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), SHARED_MATS.ghostProfile));
        } else {
            const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(r, 0, 0), new THREE.Vector3(r, h, 0), new THREE.Vector3(0, h, 0), new THREE.Vector3(0, 0, 0)];
            g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), SHARED_MATS.ghostProfile));
        }
        revGhostGroup.add(g);
    });

    setRevolutionAngle(appState.revolveAngleDeg);
}

function setRevolutionAngle(deg) {
    appState.revolveAngleDeg = Math.max(0, Math.min(360, deg));
    const rad = (appState.revolveAngleDeg * Math.PI) / 180;
    const r = appState.r;
    const h = appState.h;
    const isCone = (appState.shape === 'cone');

    // UI readouts
    const slider = document.getElementById('slider-rev-angle');
    if (slider) slider.value = Math.round(appState.revolveAngleDeg);
    const label = document.getElementById('rev-angle-val');
    if (label) label.innerText = Math.round(appState.revolveAngleDeg) + '°';

    // Synchronize Rotating Profile around axis SO / OA
    revRotatingProfile.rotation.y = rad;

    // Update Swept Meshes draw range
    if (isCone) {
        revFullConeMesh.visible = true;
        revFullCylMesh.visible = false;
        const totalSlices = 72;
        const activeSlices = Math.floor((appState.revolveAngleDeg / 360) * totalSlices);
        revFullConeMesh.geometry.setDrawRange(0, activeSlices * 6);
    } else {
        revFullConeMesh.visible = false;
        revFullCylMesh.visible = true;
        const totalSlices = 72;
        const activeSlices = Math.floor((appState.revolveAngleDeg / 360) * totalSlices);
        revFullCylMesh.geometry.setDrawRange(0, activeSlices * 12);
    }

    // Start cut-face stationary profile: MUST BE FALSE so strictly ONLY 1 rotating triangle is visible (Item 1 user request)
    revStartProfileGroup.visible = false;

    // Dynamic Base Angle Arc
    clearGroupSafely(revAngleArcGroup);
    if (appState.revolveAngleDeg > 4) {
        const arcRadius = Math.min(0.65, r * 0.38);
        const arcSegs = Math.max(6, Math.floor(rad * 14));
        const arcPts = [new THREE.Vector3(0, 0.02, 0)];
        for (let i = 0; i <= arcSegs; i++) {
            const a = (i / arcSegs) * rad;
            arcPts.push(new THREE.Vector3(arcRadius * Math.cos(a), 0.02, arcRadius * Math.sin(a)));
        }
        arcPts.push(new THREE.Vector3(0, 0.02, 0));
        const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPts);
        const arcLine = new THREE.Line(arcGeo, SHARED_MATS.lineAmber);
        revAngleArcGroup.add(arcLine);

        // Angle Badge at midpoint with safe distance from O and R to avoid overlap
        const midA = rad * 0.5;
        const badgeAngle = Label3DManager.createBadge(`α = ${Math.round(appState.revolveAngleDeg)}°`, '#f59e0b', 'rgba(15,23,42,0.92)', '#f59e0b', 140, 48);
        badgeAngle.position.set(arcRadius * 1.85 * Math.cos(midA), 0.35, arcRadius * 1.85 * Math.sin(midA));
        revAngleArcGroup.add(badgeAngle);
    }

    // Trajectory beads position
    revTrajBeadBtm.position.set(r * Math.cos(rad), 0.015, r * Math.sin(rad));
    revTrajBeadTop.position.set(r * Math.cos(rad), h, r * Math.sin(rad));

    revTrajectoryGroup.visible = !!appState.showTrajectory;
    const isStage2 = (typeof lessonState !== 'undefined' && lessonState.currentStageIndex === 2);
    revGhostGroup.visible = !isStage2 && !!appState.showGhostProfiles;

    // Real-time Pedagogical Explanation Narrative
    const textEl = document.getElementById('rev-narrative-text');
    if (textEl) {
        const d = Math.round(appState.revolveAngleDeg);
        if (isCone) {
            if (d === 0) {
                textEl.innerHTML = 'Tam giác vuông <b>SOB</b> xuất phát: Cạnh góc vuông <b class="text-cyan-300">SO</b> nằm trên trục quay, cạnh <b class="text-amber-300">OB = r</b> là bán kính đáy, cạnh huyền <b class="text-pink-300">SB = l</b> là đường sinh.';
            } else if (d < 90) {
                textEl.innerHTML = `Đang quay góc <b class="text-amber-300">α = ${d}°</b>: Cạnh <b class="text-pink-300">SB</b> quét tạo một phần mặt xung quanh, cạnh <b class="text-amber-300">OB</b> quét tạo một hình quạt tròn ở đáy.`;
            } else if (d === 90) {
                textEl.innerHTML = 'Đã quay <b>1/4 vòng (90°)</b>: Tạo thành 1/4 hình nón tròn xoay.';
            } else if (d < 180) {
                textEl.innerHTML = `Đang quay góc <b class="text-amber-300">α = ${d}°</b>: Điểm B chuyển động trên đường tròn đáy bán kính r quanh tâm O.`;
            } else if (d === 180) {
                textEl.innerHTML = 'Đã quay <b>nửa vòng (180°)</b>: Tạo thành một nửa hình nón đối xứng qua trục SO.';
            } else if (d < 360) {
                textEl.innerHTML = `Đang quét nốt phần còn lại <b class="text-amber-300">α = ${d}°</b>: Bề mặt nón sắp hoàn thành trọn vẹn.`;
            } else {
                textEl.innerHTML = '🎉 <b>Hoàn tất 1 vòng quay 360°!</b> Khối nón hoàn chỉnh: trục <b class="text-cyan-300">h = SO</b>, bán kính đáy <b class="text-amber-300">r = OB</b>, đường sinh <b class="text-pink-300">l = SB</b>.';
            }
        } else {
            if (d === 0) {
                textEl.innerHTML = 'Hình chữ nhật <b>OABC</b> xuất phát: Cạnh <b class="text-cyan-300">OA = h</b> làm trục quay cố định, hai cạnh kề <b class="text-amber-300">OC = AB = r</b> là bán kính hai đáy, cạnh đối diện <b class="text-pink-300">BC = h</b> là đường sinh.';
            } else if (d === 180) {
                textEl.innerHTML = 'Đã quay <b>nửa vòng (180°)</b>: Cạnh BC quét tạo nửa mặt trụ, hai cạnh OC và AB quét tạo hai nửa hình tròn đáy.';
            } else if (d === 360) {
                textEl.innerHTML = '🎉 <b>Hoàn tất 1 vòng quay 360°!</b> Khối trụ hoàn chỉnh: hai đáy là hai hình tròn bằng nhau bán kính <b class="text-amber-300">r</b>, trục quay <b class="text-cyan-300">h</b>.';
            } else {
                textEl.innerHTML = `Đang quay góc <b class="text-amber-300">α = ${d}°</b>: Cạnh <b class="text-pink-300">BC</b> quét tạo mặt xung quanh của hình trụ.`;
            }
        }
    }

    if (appState.revolveAngleDeg >= 359) {
        appState.achievements.revolution = true;
        persistState();
    }
}

// Playback controls for Revolution
let revSpeedMultiplier = 1.0;

function updateRevPlayBtnUI(isPlaying) {
    const btn = document.getElementById('btn-play-rev');
    if (btn) {
        if (isPlaying) {
            btn.innerHTML = '<i class="ph-fill ph-pause text-sm"></i><span>Tạm dừng</span>';
            btn.className = 'py-2 px-2 rounded-xl bg-slate-800 text-amber-300 font-black text-xs flex items-center justify-center gap-1 active:scale-95 border border-amber-400/50 shadow';
        } else {
            btn.innerHTML = '<i class="ph-fill ph-play text-sm"></i><span>Quay</span>';
            btn.className = 'py-2 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1 active:scale-95 shadow';
        }
    }
}

function setRevolutionSpeed(spd, btn) {
    revSpeedMultiplier = spd;
    document.querySelectorAll('.rev-speed-btn').forEach(b => {
        b.className = 'rev-speed-btn px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700';
    });
    if (btn) {
        btn.className = 'rev-speed-btn px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold border border-amber-400';
    }
}

function tweenRevolutionTo(targetDeg) {
    gsap.killTweensOf(appState);
    appState.isRevolvePlaying = true;
    updateRevPlayBtnUI(true);
    const diff = Math.abs(targetDeg - appState.revolveAngleDeg);
    // Slower, educational, calm rotation speed (Base 8.5 seconds for 360 deg)
    const duration = Math.max(0.5, (diff / 360) * (8.5 / revSpeedMultiplier));

    gsap.to(appState, {
        revolveAngleDeg: targetDeg,
        duration: duration,
        ease: 'power1.inOut',
        onUpdate: () => setRevolutionAngle(appState.revolveAngleDeg),
        onComplete: () => {
            appState.isRevolvePlaying = false;
            updateRevPlayBtnUI(false);
            if (targetDeg === 360) fireConfetti();
        }
    });
}

function playRevolution() {
    if (appState.isRevolvePlaying) {
        pauseRevolution();
        return;
    }
    const start = appState.revolveAngleDeg >= 359 ? 0 : appState.revolveAngleDeg;
    appState.revolveAngleDeg = start;
    tweenRevolutionTo(360);
}

function pauseRevolution() {
    gsap.killTweensOf(appState);
    appState.isRevolvePlaying = false;
    updateRevPlayBtnUI(false);
}

function resetRevolution() {
    gsap.killTweensOf(appState);
    appState.isRevolvePlaying = false;
    updateRevPlayBtnUI(false);
    setRevolutionAngle(0);
}

function jumpRevolutionAngle(deg) {
    pauseRevolution();
    setRevolutionAngle(deg);
    if (typeof AudioEngine !== 'undefined' && AudioEngine.click) AudioEngine.click();
}

// ==========================================
// 9. MODE 4: MẶT CẮT (CROSS-SECTIONS)
// ==========================================
const sectionMeshGroup = new THREE.Group();
sectionGroup.add(sectionMeshGroup);

// Semi-transparent parent shape
const sectionParentCone = new THREE.Mesh(new THREE.BufferGeometry(), SHARED_MATS.coneGlass);
const sectionParentCyl = new THREE.Mesh(new THREE.BufferGeometry(), SHARED_MATS.cylGlass);
sectionMeshGroup.add(sectionParentCone);
sectionMeshGroup.add(sectionParentCyl);

// Cutting Plane visualizer
const sectionPlaneMesh = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), SHARED_MATS.sectionPlane);
sectionMeshGroup.add(sectionPlaneMesh);

// Highlighted Slice Surface
const sectionSliceMesh = new THREE.Mesh(new THREE.BufferGeometry(), SHARED_MATS.sectionSlice);
sectionMeshGroup.add(sectionSliceMesh);

const sectionSliceBorder = new THREE.LineLoop(new THREE.BufferGeometry(), SHARED_MATS.lineGreen);
sectionMeshGroup.add(sectionSliceBorder);

// 3D labels and dimension markers on the slice
const sectionLabelsGroup = new THREE.Group();
sectionMeshGroup.add(sectionLabelsGroup);

function setSectionType(type) {
    appState.sectionType = type;
    const btnH = document.getElementById('btn-sec-horizontal');
    const btnA = document.getElementById('btn-sec-axial');
    const btnS = document.getElementById('btn-sec-slanted');
    const sliderBox = document.getElementById('sec-height-slider-box');

    if (btnH) {
        btnH.className = (type === 'horizontal')
            ? 'py-1.5 px-1 text-center rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-400/40 text-[11px]'
            : 'py-1.5 px-1 text-center rounded-lg text-slate-400 hover:text-white text-[11px]';
    }
    if (btnA) {
        btnA.className = (type === 'axial')
            ? 'py-1.5 px-1 text-center rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-400/40 text-[11px]'
            : 'py-1.5 px-1 text-center rounded-lg text-slate-400 hover:text-white text-[11px]';
    }
    if (btnS) {
        btnS.className = (type === 'slanted')
            ? 'py-1.5 px-1 text-center rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-400/40 text-[11px]'
            : 'py-1.5 px-1 text-center rounded-lg text-slate-400 hover:text-white text-[11px]';
    }
    if (sliderBox) {
        sliderBox.classList.toggle('hidden', type === 'axial');
    }

    updateSection();
}

function setSectionYRatio(val) {
    appState.sectionYRatio = Math.max(0.01, Math.min(0.99, val));
    const label = document.getElementById('sec-y-pct');
    if (label) label.innerText = Math.round(appState.sectionYRatio * 100) + '%';
    const slider = document.getElementById('slider-section-y');
    if (slider) slider.value = Math.round(appState.sectionYRatio * 100);
    updateSection();
}

function toggleSectionSimilarity() {
    const card = document.getElementById('section-similarity-card');
    if (card) {
        card.classList.toggle('hidden');
    }
}

function rebuildSectionMeshes() {
    disposeGeometry(sectionParentCone);
    sectionParentCone.geometry = new THREE.ConeGeometry(appState.r, appState.h, 64).translate(0, appState.h / 2, 0);

    disposeGeometry(sectionParentCyl);
    sectionParentCyl.geometry = new THREE.CylinderGeometry(appState.r, appState.r, appState.h, 64).translate(0, appState.h / 2, 0);

    updateSection();
}

function updateSection() {
    const isCone = (appState.shape === 'cone');
    const r = appState.r;
    const h = appState.h;
    const l = appState.l;
    const u = appState.unit;
    const y = appState.sectionYRatio * h;

    sectionParentCone.visible = isCone;
    sectionParentCyl.visible = !isCone;

    clearGroupSafely(sectionLabelsGroup);

    if (appState.sectionType === 'horizontal') {
        // Horizontal Plane Cutting
        sectionPlaneMesh.rotation.set(-Math.PI / 2, 0, 0);
        sectionPlaneMesh.position.set(0, y, 0);
        sectionPlaneMesh.visible = true;

        const sliceRadius = isCone
            ? Math.max(0.05, r * (1 - y / h))
            : r;
        const sliceArea = Math.PI * sliceRadius * sliceRadius;

        disposeGeometry(sectionSliceMesh);
        sectionSliceMesh.geometry = new THREE.CircleGeometry(sliceRadius, 64).rotateX(-Math.PI / 2);
        sectionSliceMesh.position.set(0, y + 0.005, 0);

        disposeGeometry(sectionSliceBorder);
        sectionSliceBorder.geometry = createCircleLine(sliceRadius, y + 0.006, SHARED_MATS.lineGreen).geometry;

        // 3D Badges & Dimension Lines on the slice
        const centerMarker = new THREE.Mesh(sphereMarkerGeo, SHARED_MATS.pointGreen);
        centerMarker.position.set(0, y + 0.01, 0);
        sectionLabelsGroup.add(centerMarker);

        const radiusLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, y + 0.01, 0), new THREE.Vector3(sliceRadius, y + 0.01, 0)]),
            SHARED_MATS.lineGreen
        );
        sectionLabelsGroup.add(radiusLine);

        const badgeRadius = Label3DManager.createBadge(`r' = ${sliceRadius.toFixed(2)} ${u}`, '#10b981', 'rgba(15,23,42,0.92)', '#10b981', 190, 52);
        badgeRadius.position.set(sliceRadius * 0.5, y + 0.35, 0);
        sectionLabelsGroup.add(badgeRadius);

        const readout = document.getElementById('section-readout');
        if (readout) {
            readout.innerHTML = `
                <div class="space-y-1 font-mono text-xs">
                    <div class="flex justify-between"><span>Vị trí độ cao y:</span><b class="text-sky-300">${y.toFixed(2)} ${u} (${Math.round(appState.sectionYRatio * 100)}% h)</b></div>
                    <div class="flex justify-between"><span>Hình dạng lát cắt:</span><b class="text-emerald-300">Hình tròn</b></div>
                    <div class="flex justify-between"><span>Bán kính lát cắt r':</span><b class="text-amber-300">${sliceRadius.toFixed(2)} ${u}</b></div>
                    <div class="flex justify-between"><span>Diện tích S = πr'²:</span><b class="text-emerald-300">${sliceArea.toFixed(2)} ${u}²</b></div>
                    <p class="text-[10px] text-slate-400 font-sans pt-1 leading-relaxed">
                        ${isCone ? 'Mặt cắt song song đáy của hình nón là hình tròn có bán kính thu nhỏ dần từ r về 0 khi lên cao.' : 'Mọi mặt cắt song song đáy của hình trụ đều là hình tròn bằng đúng đáy (bán kính r).'}
                    </p>
                </div>
            `;
        }
    } else if (appState.sectionType === 'axial') {
        // Axial Vertical Plane Cutting through Central Axis
        sectionPlaneMesh.rotation.set(0, 0, 0);
        sectionPlaneMesh.position.set(0, h / 2, 0);
        sectionPlaneMesh.visible = true;

        disposeGeometry(sectionSliceMesh);
        disposeGeometry(sectionSliceBorder);

        if (isCone) {
            // Isosceles Triangle: Apex S(0, h, 0), Base A(-r, 0, 0), B(r, 0, 0)
            const verts = new Float32Array([
                -r, 0, 0,   r, 0, 0,   0, h, 0,
                -r, 0, 0,   0, h, 0,   r, 0, 0
            ]);
            sectionSliceMesh.geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(verts, 3));
            sectionSliceMesh.position.set(0, 0, 0.005);

            const linePts = [
                new THREE.Vector3(-r, 0, 0.008), new THREE.Vector3(r, 0, 0.008),
                new THREE.Vector3(0, h, 0.008), new THREE.Vector3(-r, 0, 0.008)
            ];
            sectionSliceBorder.geometry = new THREE.BufferGeometry().setFromPoints(linePts);

            // Vertices Badges & Dimensions: concise symbols with click explanations
            const badgeS = Label3DManager.createBadge('S', '#38bdf8', 'rgba(15,23,42,0.92)', '#38bdf8', 90, 50, 'Đỉnh thiết diện (S)');
            badgeS.position.set(0, h + 0.35, 0.01);
            const badgeA = Label3DManager.createBadge('A', '#facc15', 'rgba(15,23,42,0.92)', '#facc15', 90, 50, 'Điểm đáy A');
            badgeA.position.set(-r - 0.25, -0.25, 0.01);
            const badgeB = Label3DManager.createBadge('B', '#facc15', 'rgba(15,23,42,0.92)', '#facc15', 90, 50, 'Điểm đáy B');
            badgeB.position.set(r + 0.25, -0.25, 0.01);
            const badgeBase = Label3DManager.createBadge(`2r = ${(2 * r).toFixed(1)} ${u}`, '#facc15', 'rgba(15,23,42,0.9)', '#facc15', 180, 50, `Đáy thiết diện: AB = 2r = ${(2 * r).toFixed(1)} ${u}`);
            badgeBase.position.set(0, -0.32, 0.01);

            sectionLabelsGroup.add(badgeS);
            sectionLabelsGroup.add(badgeA);
            sectionLabelsGroup.add(badgeB);
            sectionLabelsGroup.add(badgeBase);

            const area = r * h;
            const readout = document.getElementById('section-readout');
            if (readout) {
                readout.innerHTML = `
                    <div class="space-y-1 font-mono text-xs">
                        <div class="flex justify-between"><span>Tiết diện qua trục:</span><b class="text-amber-300">Tam giác cân SAB</b></div>
                        <div class="flex justify-between"><span>Đáy AB = 2r:</span><b class="text-sky-300">${(2 * r).toFixed(2)} ${u}</b></div>
                        <div class="flex justify-between"><span>Chiều cao SO = h:</span><b class="text-sky-300">${h.toFixed(2)} ${u}</b></div>
                        <div class="flex justify-between"><span>Cạnh bên SA = SB = l:</span><b class="text-pink-300">${l.toFixed(2)} ${u}</b></div>
                        <div class="flex justify-between"><span>Diện tích S = r·h:</span><b class="text-emerald-300">${area.toFixed(2)} ${u}²</b></div>
                        <p class="text-[10px] text-slate-400 font-sans pt-1 leading-relaxed">
                            Mặt cắt qua trục của hình nón là tam giác cân có đáy bằng đường kính 2r và 2 cạnh bên bằng đường sinh l.
                        </p>
                    </div>
                `;
            }
        } else {
            // Rectangle through Axis: width 2r, height h
            sectionSliceMesh.geometry = new THREE.PlaneGeometry(2 * r, h).translate(0, h / 2, 0);
            sectionSliceMesh.position.set(0, 0, 0.005);

            const hw = r;
            const linePts = [
                new THREE.Vector3(-hw, 0, 0.008), new THREE.Vector3(hw, 0, 0.008),
                new THREE.Vector3(hw, h, 0.008), new THREE.Vector3(-hw, h, 0.008),
                new THREE.Vector3(-hw, 0, 0.008)
            ];
            sectionSliceBorder.geometry = new THREE.BufferGeometry().setFromPoints(linePts);

            const area = 2 * r * h;
            const readout = document.getElementById('section-readout');
            if (readout) {
                readout.innerHTML = `
                    <div class="space-y-1 font-mono text-xs">
                        <div class="flex justify-between"><span>Tiết diện qua trục:</span><b class="text-amber-300">Hình chữ nhật</b></div>
                        <div class="flex justify-between"><span>Chiều rộng (2r):</span><b class="text-sky-300">${(2 * r).toFixed(2)} ${u}</b></div>
                        <div class="flex justify-between"><span>Chiều dài (h):</span><b class="text-sky-300">${h.toFixed(2)} ${u}</b></div>
                        <div class="flex justify-between"><span>Diện tích S = 2rh:</span><b class="text-emerald-300">${area.toFixed(2)} ${u}²</b></div>
                        <p class="text-[10px] text-slate-400 font-sans pt-1 leading-relaxed">
                            Mặt cắt qua trục của hình trụ luôn là hình chữ nhật kích thước 2r × h.
                        </p>
                    </div>
                `;
            }
        }
    } else if (appState.sectionType === 'slanted') {
        // Slanted Cutting Plane tilted by 24 degrees
        const tilt = 0.42; // radians ~ 24 degrees
        sectionPlaneMesh.rotation.set(-Math.PI / 2 + tilt, 0, 0);
        sectionPlaneMesh.position.set(0, y, 0);
        sectionPlaneMesh.visible = true;

        disposeGeometry(sectionSliceMesh);
        disposeGeometry(sectionSliceBorder);

        const aRad = isCone ? Math.max(0.1, (r * (1 - y / h)) / Math.cos(tilt)) : (r / Math.cos(tilt));
        const bRad = isCone ? Math.max(0.1, r * (1 - y / h)) : r;
        const area = Math.PI * aRad * bRad;

        // Elliptical slice geometry
        const ellipseSegs = 64;
        const ellipsePts = [];
        for (let i = 0; i <= ellipseSegs; i++) {
            const th = (i / ellipseSegs) * Math.PI * 2;
            const ex = bRad * Math.cos(th);
            const ez = aRad * Math.sin(th);
            ellipsePts.push(new THREE.Vector3(ex, ez * Math.sin(tilt) + y + 0.005, ez * Math.cos(tilt)));
        }

        // Triangulate ellipse
        const ePositions = [0, y + 0.005, 0];
        const eIndices = [];
        for (let i = 0; i <= ellipseSegs; i++) {
            const pt = ellipsePts[i];
            ePositions.push(pt.x, pt.y, pt.z);
        }
        for (let i = 1; i <= ellipseSegs; i++) {
            eIndices.push(0, i, i + 1);
        }

        const eGeo = new THREE.BufferGeometry();
        eGeo.setAttribute('position', new THREE.Float32BufferAttribute(ePositions, 3));
        eGeo.setIndex(eIndices);
        eGeo.computeVertexNormals();

        sectionSliceMesh.geometry = eGeo;
        sectionSliceMesh.position.set(0, 0, 0);
        sectionSliceBorder.geometry = new THREE.BufferGeometry().setFromPoints(ellipsePts);

        const readout = document.getElementById('section-readout');
        if (readout) {
            readout.innerHTML = `
                <div class="space-y-1 font-mono text-xs">
                    <div class="flex justify-between"><span>Mặt cắt xiên (nghiêng 24°):</span><b class="text-amber-300">Hình Elip</b></div>
                    <div class="flex justify-between"><span>Bán trục lớn a:</span><b class="text-emerald-300">${aRad.toFixed(2)} ${u}</b></div>
                    <div class="flex justify-between"><span>Bán trục nhỏ b:</span><b class="text-amber-300">${bRad.toFixed(2)} ${u}</b></div>
                    <div class="flex justify-between"><span>Diện tích S = π·a·b:</span><b class="text-emerald-300">${area.toFixed(2)} ${u}²</b></div>
                    <p class="text-[10px] text-slate-400 font-sans pt-1 leading-relaxed">
                        Khi cắt xiên hình trụ hoặc hình nón (mặt phẳng cắt qua mọi đường sinh không qua đỉnh), thiết diện tạo thành luôn là một hình elip.
                    </p>
                </div>
            `;
        }
    }

    appState.achievements.section = true;
    persistState();
}

// ==========================================
// 10. MODE 5: THỬ THÁCH (CHALLENGE BANK)
// ==========================================
const CHALLENGE_BANK = [
    {
        q: 'Nếu hình nón có bán kính đáy r = 3 cm và chiều cao h = 4 cm, đường sinh l bằng bao nhiêu?',
        options: ['5 cm', '7 cm', '6 cm', '25 cm'],
        correct: 0,
        hint1: 'Áp dụng định lý Pythagoras trong tam giác vuông: l² = r² + h².',
        hint2: 'l = √(3² + 4²) = √(9 + 16) = √25.',
        explain: 'Đường sinh l = √(3² + 4²) = 5 cm.'
    },
    {
        q: 'Khai triển mặt xung quanh của hình nón sẽ nhận được hình gì?',
        options: ['Hình quạt tròn', 'Hình chữ nhật', 'Hình tam giác cân', 'Hình tròn'],
        correct: 0,
        hint1: 'Mặt nón cong mở rộng từ đỉnh quét đều ra.',
        hint2: 'Bán kính của hình này đúng bằng đường sinh l.',
        explain: 'Mặt xung quanh của hình nón khai triển ra là một hình quạt tròn bán kính l.'
    },
    {
        q: 'Độ dài cung của quạt tròn khai triển hình nón bằng đại lượng nào?',
        options: ['Chu vi đáy hình nón (2πr)', 'Đường kính đáy (2r)', 'Chiều cao h', 'Đường sinh l'],
        correct: 0,
        hint1: 'Cung của quạt tròn được cuộn lại ôm sát lấy đường tròn đáy.',
        hint2: 'Chu vi đáy tròn là 2πr.',
        explain: 'Cung quạt = Chu vi đáy = 2πr.'
    },
    {
        q: 'Hình nào được tạo thành khi quay một tam giác vuông quanh một cạnh góc vuông?',
        options: ['Hình nón', 'Hình trụ', 'Hình cầu', 'Hình lăng trụ'],
        correct: 0,
        hint1: 'Cạnh góc vuông cố định là trục, cạnh huyền quét tạo mặt cong.',
        hint2: 'Đỉnh nhọn ở trên, đáy tròn bên dưới.',
        explain: 'Tam giác vuông quay quanh cạnh góc vuông tạo nên hình nón.'
    },
    {
        q: 'Nếu quay hình chữ nhật kích thước r × h quanh cạnh h, ta thu được khối nào?',
        options: ['Hình trụ bán kính r, chiều cao h', 'Hình nón bán kính r', 'Hình trụ bán kính 2r', 'Hình hộp chữ nhật'],
        correct: 0,
        hint1: 'Cạnh h cố định làm trục quay.',
        hint2: 'Cạnh r quét tạo thành hai đáy tròn.',
        explain: 'Hình chữ nhật quay quanh cạnh h tạo thành hình trụ.'
    },
    {
        q: 'Mặt cắt qua trục của một hình nón luôn là hình gì?',
        options: ['Tam giác cân', 'Tam giác vuông', 'Hình chữ nhật', 'Hình thoi'],
        correct: 0,
        hint1: 'Mặt cắt đi qua đỉnh và tâm đáy.',
        hint2: 'Hai cạnh bên là hai đường sinh l có độ dài bằng nhau.',
        explain: 'Mặt cắt qua trục của hình nón là tam giác cân có đáy 2r và cạnh bên l.'
    },
    {
        q: 'Mặt cắt song song với đáy của hình trụ là hình gì?',
        options: ['Hình tròn có bán kính r', 'Hình chữ nhật', 'Hình elip', 'Hình tròn bán kính 2r'],
        correct: 0,
        hint1: 'Mọi điểm trên thân trụ cách trục một khoảng bằng r.',
        hint2: 'Mặt phẳng song song cắt ngang trụ luôn giữ nguyên hình dạng đáy.',
        explain: 'Mặt cắt ngang song song đáy của hình trụ luôn là hình tròn bán kính r.'
    },
    {
        q: 'Tỉ số thể tích giữa hình nón và hình trụ có cùng bán kính đáy r và chiều cao h là bao nhiêu?',
        options: ['1/3', '1/2', '2/3', '3 lần'],
        correct: 0,
        hint1: 'Cần đổ 3 lần hình nón đầy nước mới đầy một hình trụ.',
        hint2: 'V_nón = 1/3 * V_trụ.',
        explain: 'V_nón = 1/3 πr²h, trong khi V_trụ = πr²h. Do đó tỉ số là 1/3.'
    },
    {
        q: 'Công thức tính diện tích xung quanh của hình nón là:',
        options: ['Sxq = πrl', 'Sxq = 2πrh', 'Sxq = πr²h', 'Sxq = 1/3 πrl'],
        correct: 0,
        hint1: 'Diện tích quạt tròn khai triển có cung 2πr và bán kính l.',
        hint2: 'S = 1/2 * độ dài cung * bán kính = 1/2 * (2πr) * l.',
        explain: 'Sxq = πrl.'
    },
    {
        q: 'Khai triển mặt xung quanh của hình trụ thu được hình chữ nhật có kích thước là:',
        options: ['2πr và h', 'r và h', 'πr và 2h', '2r và h'],
        correct: 0,
        hint1: 'Một cạnh là chiều cao h của hình trụ.',
        hint2: 'Cạnh kia cuộn tròn vừa đúng một vòng đáy (chu vi 2πr).',
        explain: 'Hình chữ nhật khai triển mặt trụ có kích thước 2πr × h.'
    }
];

function syncChallenge3DScene() {
    if (typeof appState === 'undefined' || appState.mode !== 'challenge') return;
    
    // Hide all root groups first
    if (typeof structureGroup !== 'undefined') structureGroup.visible = false;
    if (typeof volumeGroup !== 'undefined') volumeGroup.visible = false;
    if (typeof netGroup !== 'undefined') netGroup.visible = false;
    if (typeof revolutionGroup !== 'undefined') revolutionGroup.visible = false;
    if (typeof sectionGroup !== 'undefined') sectionGroup.visible = false;
    
    // If active question is present, adapt 3D scene to question content
    if (appState.challengeStarted && appState.activeQuestions && appState.activeQuestions[appState.currentQuestionIndex]) {
        const q = appState.activeQuestions[appState.currentQuestionIndex];
        const text = (q.q || '').toLowerCase();
        
        if (text.includes('quay') || text.includes('tam giác vuông quanh')) {
            if (typeof revolutionGroup !== 'undefined') {
                revolutionGroup.visible = true;
                appState.shape = text.includes('chữ nhật') ? 'cylinder' : 'cone';
                if (typeof rebuildRevolutionBaseMeshes === 'function') rebuildRevolutionBaseMeshes();
            }
        } else if (text.includes('khai triển') || text.includes('quạt tròn') || text.includes('cung của quạt')) {
            if (typeof netGroup !== 'undefined') {
                netGroup.visible = true;
                appState.shape = text.includes('trụ') ? 'cylinder' : 'cone';
                if (typeof setUnfoldProgress === 'function') setUnfoldProgress(0.8);
            }
        } else if (text.includes('mặt cắt') || text.includes('thiết diện')) {
            if (typeof sectionGroup !== 'undefined') {
                sectionGroup.visible = true;
                appState.shape = text.includes('trụ') ? 'cylinder' : 'cone';
                if (typeof updateSectionCutGeometries === 'function') updateSectionCutGeometries();
            }
        } else if (text.includes('thể tích') || text.includes('tỉ số')) {
            if (typeof volumeGroup !== 'undefined') {
                volumeGroup.visible = true;
                if (typeof rebuildVolumeGeometries === 'function') rebuildVolumeGeometries();
            }
        } else {
            // Structure Cone 3D
            if (typeof structureGroup !== 'undefined') {
                structureGroup.visible = true;
                if (text.includes('r = 3') && text.includes('h = 4')) {
                    appState.r = 3.0;
                    appState.h = 4.0;
                    appState.l = 5.0;
                }
                if (typeof updateStructureConeGeometry === 'function') updateStructureConeGeometry(1);
            }
        }
    } else {
        // Default when not started or completed: show Cone structure
        if (typeof structureGroup !== 'undefined') {
            structureGroup.visible = true;
            if (typeof updateStructureConeGeometry === 'function') updateStructureConeGeometry(1);
        }
    }
    
    if (typeof applyFloatingModelPosition === 'function') applyFloatingModelPosition();
    if (typeof frameFloatingModel === 'function') frameFloatingModel();
}
window.syncChallenge3DScene = syncChallenge3DScene;

function getChallengeQuestionDiagram(q) {
    if (!q || !q.q) return '';
    const text = q.q.toLowerCase();

    // 1. Py-ta-go r=3, h=4 -> l=5
    if (text.includes('r = 3') && text.includes('h = 4')) {
        return `
            <svg viewBox="0 0 280 125" class="w-full max-w-[280px] h-[120px] mx-auto select-none">
                <!-- Base ellipse -->
                <ellipse cx="140" cy="100" rx="55" ry="12" fill="#0f172a" stroke="#475569" stroke-width="1.5" stroke-dasharray="3 3"/>
                <path d="M 85 100 A 55 12 0 0 0 195 100" fill="none" stroke="#64748b" stroke-width="1.5"/>
                <line x1="85" y1="100" x2="140" y2="20" stroke="#64748b" stroke-width="1.2"/>
                <line x1="195" y1="100" x2="140" y2="20" stroke="#64748b" stroke-width="1.2"/>
                <!-- Right triangle SOB -->
                <polygon points="140,20 140,100 195,100" fill="rgba(245, 158, 11, 0.18)" stroke="#f59e0b" stroke-width="1.5"/>
                <rect x="140" y="93" width="7" height="7" fill="none" stroke="#38bdf8" stroke-width="1.5"/>
                <!-- Axis h -->
                <line x1="140" y1="20" x2="140" y2="100" stroke="#38bdf8" stroke-width="2.5"/>
                <text x="122" y="62" fill="#38bdf8" font-size="11" font-weight="bold" font-family="monospace">h = 4</text>
                <!-- Radius r -->
                <line x1="140" y1="100" x2="195" y2="100" stroke="#f59e0b" stroke-width="2.5"/>
                <text x="156" y="116" fill="#f59e0b" font-size="11" font-weight="bold" font-family="monospace">r = 3</text>
                <!-- Slant height l -->
                <line x1="140" y1="20" x2="195" y2="100" stroke="#ec4899" stroke-width="2.5"/>
                <text x="174" y="55" fill="#ec4899" font-size="12" font-weight="900" font-family="monospace">l = ?</text>
                <!-- Points S, O, B -->
                <circle cx="140" cy="20" r="3.5" fill="#38bdf8"/>
                <text x="140" y="14" fill="#38bdf8" font-size="10" font-weight="bold" text-anchor="middle">S (đỉnh)</text>
                <circle cx="140" cy="100" r="3" fill="#f59e0b"/>
                <text x="133" y="112" fill="#f59e0b" font-size="9" font-weight="bold">O</text>
                <circle cx="195" cy="100" r="3" fill="#ec4899"/>
                <text x="202" y="104" fill="#ec4899" font-size="9" font-weight="bold">B</text>
            </svg>
        `;
    }

    // 2. Khai triển nón ra quạt tròn
    if (text.includes('khai triển') && text.includes('quạt tròn')) {
        return `
            <svg viewBox="0 0 280 120" class="w-full max-w-[280px] h-[115px] mx-auto select-none">
                <g transform="translate(15, 5)">
                    <path d="M 35 15 L 12 80 A 23 6 0 0 0 58 80 Z" fill="rgba(6, 182, 212, 0.15)" stroke="#06b6d4" stroke-width="1.5"/>
                    <ellipse cx="35" cy="80" rx="23" ry="6" fill="none" stroke="#06b6d4" stroke-width="1" stroke-dasharray="2 2"/>
                    <text x="35" y="98" fill="#94a3b8" font-size="9" font-weight="bold" text-anchor="middle">Hình Nón</text>
                </g>
                <g transform="translate(82, 40)">
                    <path d="M 0 10 L 22 10 M 17 5 L 23 10 L 17 15" fill="none" stroke="#f59e0b" stroke-width="2"/>
                    <text x="11" y="0" fill="#f59e0b" font-size="8" font-weight="bold" text-anchor="middle">Trải phẳng</text>
                </g>
                <g transform="translate(130, 8)">
                    <path d="M 70 12 L 25 65 A 65 65 0 0 1 115 65 Z" fill="rgba(245, 158, 11, 0.22)" stroke="#f59e0b" stroke-width="1.8"/>
                    <text x="70" y="8" fill="#f59e0b" font-size="9" font-weight="bold" text-anchor="middle">Đỉnh S</text>
                    <text x="70" y="48" fill="#fde68a" font-size="10" font-weight="bold" text-anchor="middle">Hình Quạt Tròn</text>
                    <text x="35" y="40" fill="#ec4899" font-size="9" font-weight="bold">l</text>
                    <text x="105" y="40" fill="#ec4899" font-size="9" font-weight="bold">l</text>
                    <text x="70" y="80" fill="#38bdf8" font-size="9" font-weight="bold" text-anchor="middle">Cung = 2πr</text>
                    <circle cx="70" cy="98" r="9" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" stroke-width="1.2"/>
                    <text x="88" y="101" fill="#10b981" font-size="8" font-weight="bold">Đáy (r)</text>
                </g>
            </svg>
        `;
    }

    // 3. Độ dài cung quạt = 2*pi*r
    if (text.includes('cung của quạt')) {
        return `
            <svg viewBox="0 0 280 120" class="w-full max-w-[280px] h-[115px] mx-auto select-none">
                <g transform="translate(140, 15)">
                    <path d="M 0 0 L -65 55 A 85 85 0 0 1 65 55 Z" fill="rgba(6, 182, 212, 0.15)" stroke="#06b6d4" stroke-width="1.5"/>
                    <path d="M -65 55 A 85 85 0 0 1 65 55" fill="none" stroke="#f59e0b" stroke-width="3.5" stroke-linecap="round"/>
                    <circle cx="0" cy="0" r="3" fill="#38bdf8"/>
                    <text x="0" y="-4" fill="#38bdf8" font-size="9" font-weight="bold" text-anchor="middle">Bán kính quạt = l</text>
                    <text x="-42" y="28" fill="#ec4899" font-size="9" font-weight="bold">l</text>
                    <text x="36" y="28" fill="#ec4899" font-size="9" font-weight="bold">l</text>
                    <rect x="-85" y="68" width="170" height="22" rx="6" fill="#0f172a" stroke="#f59e0b" stroke-width="1.5"/>
                    <text x="0" y="83" fill="#fde68a" font-size="9.5" font-weight="900" text-anchor="middle">Độ dài cung = Chu vi đáy (2πr)</text>
                </g>
            </svg>
        `;
    }

    // 4. Quay tam giác vuông quanh trục
    if (text.includes('quay') && text.includes('tam giác vuông')) {
        return `
            <svg viewBox="0 0 280 120" class="w-full max-w-[280px] h-[115px] mx-auto select-none">
                <line x1="140" y1="10" x2="140" y2="108" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3 3"/>
                <path d="M 85 90 L 140 18 L 195 90" fill="rgba(6, 182, 212, 0.08)" stroke="#64748b" stroke-width="1" stroke-dasharray="2 2"/>
                <ellipse cx="140" cy="90" rx="55" ry="11" fill="none" stroke="#64748b" stroke-width="1" stroke-dasharray="2 2"/>
                <polygon points="140,18 140,90 195,90" fill="rgba(245, 158, 11, 0.25)" stroke="#f59e0b" stroke-width="2"/>
                <rect x="140" y="83" width="7" height="7" fill="none" stroke="#38bdf8" stroke-width="1.5"/>
                <text x="135" y="15" fill="#38bdf8" font-size="9" font-weight="bold" text-anchor="end">Trục SO (cố định)</text>
                <text x="168" y="85" fill="#f59e0b" font-size="9" font-weight="bold">Cạnh đáy r</text>
                <text x="175" y="50" fill="#ec4899" font-size="9" font-weight="bold">Cạnh huyền quét l</text>
                <text x="140" y="112" fill="#fde68a" font-size="10" font-weight="bold" text-anchor="middle">➔ Quay 360° tạo thành HÌNH NÓN</text>
            </svg>
        `;
    }

    // 5. Quay hình chữ nhật
    if (text.includes('quay') && text.includes('chữ nhật')) {
        return `
            <svg viewBox="0 0 280 120" class="w-full max-w-[280px] h-[115px] mx-auto select-none">
                <line x1="140" y1="10" x2="140" y2="110" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3 3"/>
                <ellipse cx="140" cy="22" rx="45" ry="9" fill="rgba(6, 182, 212, 0.1)" stroke="#64748b" stroke-width="1"/>
                <ellipse cx="140" cy="88" rx="45" ry="9" fill="rgba(6, 182, 212, 0.1)" stroke="#64748b" stroke-width="1"/>
                <line x1="95" y1="22" x2="95" y2="88" stroke="#64748b" stroke-width="1" stroke-dasharray="2 2"/>
                <line x1="185" y1="22" x2="185" y2="88" stroke="#64748b" stroke-width="1"/>
                <rect x="140" y="22" width="45" height="66" fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" stroke-width="2"/>
                <text x="128" y="58" fill="#38bdf8" font-size="9" font-weight="bold">Trục h</text>
                <text x="162" y="18" fill="#10b981" font-size="9" font-weight="bold">Bán kính r</text>
                <text x="140" y="110" fill="#34d399" font-size="10" font-weight="bold" text-anchor="middle">➔ Quay quanh cạnh h tạo thành HÌNH TRỤ</text>
            </svg>
        `;
    }

    // 6. Mặt cắt qua trục nón
    if (text.includes('mặt cắt qua trục')) {
        return `
            <svg viewBox="0 0 280 120" class="w-full max-w-[280px] h-[115px] mx-auto select-none">
                <ellipse cx="140" cy="92" rx="55" ry="11" fill="#0f172a" stroke="#475569" stroke-width="1.2" stroke-dasharray="3 3"/>
                <path d="M 85 92 A 55 11 0 0 0 195 92" fill="none" stroke="#64748b" stroke-width="1.2"/>
                <polygon points="140,15 85,92 195,92" fill="rgba(245, 158, 11, 0.3)" stroke="#f59e0b" stroke-width="2"/>
                <line x1="140" y1="15" x2="140" y2="92" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="2 2"/>
                <circle cx="140" cy="15" r="3" fill="#38bdf8"/>
                <text x="140" y="10" fill="#38bdf8" font-size="9" font-weight="bold" text-anchor="middle">S (Đỉnh)</text>
                <text x="105" y="52" fill="#fde68a" font-size="9" font-weight="bold">l</text>
                <text x="175" y="52" fill="#fde68a" font-size="9" font-weight="bold">l</text>
                <text x="140" y="104" fill="#f59e0b" font-size="9" font-weight="bold" text-anchor="middle">Đáy = 2r</text>
                <text x="140" y="115" fill="#fbbf24" font-size="10" font-weight="900" text-anchor="middle">Thiết diện: TAM GIÁC CÂN tại đỉnh S</text>
            </svg>
        `;
    }

    // 7. Mặt cắt song song đáy trụ
    if (text.includes('mặt cắt song song với đáy của hình trụ')) {
        return `
            <svg viewBox="0 0 280 120" class="w-full max-w-[280px] h-[115px] mx-auto select-none">
                <ellipse cx="140" cy="22" rx="45" ry="9" fill="none" stroke="#64748b" stroke-width="1.2"/>
                <ellipse cx="140" cy="88" rx="45" ry="9" fill="none" stroke="#64748b" stroke-width="1.2"/>
                <line x1="95" y1="22" x2="95" y2="88" stroke="#64748b" stroke-width="1.2"/>
                <line x1="185" y1="22" x2="185" y2="88" stroke="#64748b" stroke-width="1.2"/>
                <ellipse cx="140" cy="55" rx="45" ry="9" fill="rgba(16, 185, 129, 0.35)" stroke="#10b981" stroke-width="2"/>
                <line x1="140" y1="55" x2="185" y2="55" stroke="#f59e0b" stroke-width="2"/>
                <text x="162" y="50" fill="#f59e0b" font-size="9" font-weight="bold">r</text>
                <circle cx="140" cy="55" r="2.5" fill="#38bdf8"/>
                <text x="140" y="110" fill="#34d399" font-size="10" font-weight="900" text-anchor="middle">Thiết diện: HÌNH TRÒN có bán kính r</text>
            </svg>
        `;
    }

    // 8. Tỉ số thể tích nón và trụ
    if (text.includes('tỉ số thể tích')) {
        return `
            <svg viewBox="0 0 280 120" class="w-full max-w-[280px] h-[115px] mx-auto select-none">
                <g transform="translate(55, 15)">
                    <path d="M 28 8 L 5 75 A 23 5 0 0 0 51 75 Z" fill="rgba(245, 158, 11, 0.18)" stroke="#f59e0b" stroke-width="1.5"/>
                    <ellipse cx="28" cy="75" rx="23" ry="5" fill="rgba(245, 158, 11, 0.3)" stroke="#f59e0b" stroke-width="1.2"/>
                    <text x="28" y="92" fill="#f59e0b" font-size="8.5" font-weight="bold" text-anchor="middle">V_nón = ⅓ πr²h</text>
                    <text x="28" y="50" fill="#fde68a" font-size="11" font-weight="900" text-anchor="middle">1 PHẦN</text>
                </g>
                <text x="140" y="55" fill="#cbd5e1" font-size="13" font-weight="bold" text-anchor="middle">vs</text>
                <g transform="translate(165, 15)">
                    <ellipse cx="28" cy="8" rx="23" ry="5" fill="rgba(6, 182, 212, 0.2)" stroke="#06b6d4" stroke-width="1.2"/>
                    <ellipse cx="28" cy="75" rx="23" ry="5" fill="rgba(6, 182, 212, 0.2)" stroke="#06b6d4" stroke-width="1.2"/>
                    <line x1="5" y1="8" x2="5" y2="75" stroke="#06b6d4" stroke-width="1.2"/>
                    <line x1="51" y1="8" x2="51" y2="75" stroke="#06b6d4" stroke-width="1.2"/>
                    <line x1="5" y1="30" x2="51" y2="30" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2 2"/>
                    <line x1="5" y1="52" x2="51" y2="52" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2 2"/>
                    <text x="28" y="92" fill="#38bdf8" font-size="8.5" font-weight="bold" text-anchor="middle">V_trụ = πr²h</text>
                    <text x="28" y="48" fill="#67e8f9" font-size="11" font-weight="900" text-anchor="middle">3 PHẦN</text>
                </g>
                <text x="140" y="112" fill="#fbbf24" font-size="10" font-weight="900" text-anchor="middle">TỈ SỐ V_NÓN / V_TRỤ = ⅓</text>
            </svg>
        `;
    }

    // 9. Diện tích xung quanh nón Sxq = pi * r * l
    if (text.includes('diện tích xung quanh')) {
        return `
            <svg viewBox="0 0 280 120" class="w-full max-w-[280px] h-[115px] mx-auto select-none">
                <g transform="translate(140, 15)">
                    <path d="M 0 0 L -55 50 A 72 72 0 0 1 55 50 Z" fill="rgba(236, 72, 153, 0.2)" stroke="#ec4899" stroke-width="1.8"/>
                    <text x="0" y="-4" fill="#f472b6" font-size="9" font-weight="bold" text-anchor="middle">Đỉnh S</text>
                    <text x="-36" y="24" fill="#ec4899" font-size="9" font-weight="bold">l</text>
                    <text x="32" y="24" fill="#ec4899" font-size="9" font-weight="bold">l</text>
                    <text x="0" y="65" fill="#38bdf8" font-size="8.5" font-weight="bold" text-anchor="middle">Cung = 2πr (Đáy r)</text>
                    <rect x="-70" y="72" width="140" height="22" rx="6" fill="#0f172a" stroke="#ec4899" stroke-width="1.5"/>
                    <text x="0" y="87" fill="#f472b6" font-size="11" font-weight="900" text-anchor="middle">S_xq = π · r · l</text>
                </g>
            </svg>
        `;
    }

    // 10. Khai triển mặt trụ ra chữ nhật 2*pi*r x h
    if (text.includes('khai triển') && text.includes('trụ')) {
        return `
            <svg viewBox="0 0 280 120" class="w-full max-w-[280px] h-[115px] mx-auto select-none">
                <g transform="translate(25, 18)">
                    <ellipse cx="22" cy="8" rx="18" ry="5" fill="rgba(6, 182, 212, 0.15)" stroke="#06b6d4" stroke-width="1.2"/>
                    <ellipse cx="22" cy="62" rx="18" ry="5" fill="rgba(6, 182, 212, 0.15)" stroke="#06b6d4" stroke-width="1.2"/>
                    <line x1="4" y1="8" x2="4" y2="62" stroke="#06b6d4" stroke-width="1.2"/>
                    <line x1="40" y1="8" x2="40" y2="62" stroke="#06b6d4" stroke-width="1.2"/>
                    <text x="22" y="82" fill="#94a3b8" font-size="8" font-weight="bold" text-anchor="middle">Hình Trụ</text>
                </g>
                <g transform="translate(75, 40)">
                    <path d="M 0 8 L 18 8 M 14 4 L 19 8 L 14 12" fill="none" stroke="#f59e0b" stroke-width="1.5"/>
                </g>
                <g transform="translate(105, 15)">
                    <rect x="0" y="10" width="145" height="55" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" stroke-width="1.8"/>
                    <text x="72" y="6" fill="#38bdf8" font-size="8.5" font-weight="bold" text-anchor="middle">Dài = 2πr (Chu vi đáy)</text>
                    <text x="-6" y="40" fill="#f59e0b" font-size="9" font-weight="bold" text-anchor="end">h</text>
                    <text x="72" y="42" fill="#6ee7b7" font-size="9.5" font-weight="bold" text-anchor="middle">Hình Chữ Nhật (2πr × h)</text>
                    <circle cx="72" cy="78" r="9" fill="rgba(6, 182, 212, 0.15)" stroke="#06b6d4" stroke-width="1"/>
                    <text x="90" y="81" fill="#06b6d4" font-size="7.5" font-weight="bold">Đáy (r)</text>
                </g>
            </svg>
        `;
    }

    // Default diagram: 3D Cone overview
    return `
        <svg viewBox="0 0 280 120" class="w-full max-w-[280px] h-[115px] mx-auto select-none">
            <ellipse cx="140" cy="92" rx="55" ry="11" fill="#0f172a" stroke="#475569" stroke-width="1.5" stroke-dasharray="3 3"/>
            <path d="M 85 92 A 55 11 0 0 0 195 92" fill="none" stroke="#64748b" stroke-width="1.5"/>
            <line x1="85" y1="92" x2="140" y2="18" stroke="#64748b" stroke-width="1.2"/>
            <line x1="195" y1="92" x2="140" y2="18" stroke="#64748b" stroke-width="1.2"/>
            <polygon points="140,18 140,92 195,92" fill="rgba(245, 158, 11, 0.18)" stroke="#f59e0b" stroke-width="1.5"/>
            <line x1="140" y1="18" x2="140" y2="92" stroke="#38bdf8" stroke-width="2"/>
            <line x1="140" y1="92" x2="195" y2="92" stroke="#f59e0b" stroke-width="2"/>
            <line x1="140" y1="18" x2="195" y2="92" stroke="#ec4899" stroke-width="2"/>
            <text x="140" y="12" fill="#38bdf8" font-size="9" font-weight="bold" text-anchor="middle">S (đỉnh)</text>
            <text x="126" y="58" fill="#38bdf8" font-size="9" font-weight="bold">h</text>
            <text x="165" y="106" fill="#f59e0b" font-size="9" font-weight="bold">r</text>
            <text x="175" y="52" fill="#ec4899" font-size="9" font-weight="bold">l</text>
            <text x="140" y="114" fill="#fde68a" font-size="9" font-weight="bold" text-anchor="middle">l² = r² + h² | V = ⅓πr²h | Sxq = πrl</text>
        </svg>
    `;
}
window.getChallengeQuestionDiagram = getChallengeQuestionDiagram;

function initChallengeRound() {
    appState.challengeStarted = true;
    appState.currentQuestionIndex = 0;
    appState.score = 0;
    appState.wrongAttempts = 0;
    appState.selectedOption = null;
    
    // Pick 5 random questions
    const shuffled = [...CHALLENGE_BANK].sort(() => 0.5 - Math.random());
    appState.activeQuestions = shuffled.slice(0, 5);
    renderChallengeUI();
}

function renderChallengeUI() {
    const card = document.getElementById('challenge-content-card');
    if (!card) return;

    if (!appState.challengeStarted) {
        syncChallenge3DScene();
        card.innerHTML = `
            <div class="text-center py-4 space-y-2.5">
                <i class="ph-fill ph-trophy text-amber-400 text-3xl animate-bounce"></i>
                <h3 class="text-sm font-black text-white">Thử Thách Khám Phá Hình Học 3D</h3>
                <p class="text-xs text-slate-300">5 câu hỏi tương tác có hình minh họa và mô hình 3D trực quan.</p>
                <div class="p-2 rounded-xl bg-slate-900/80 border border-slate-700/60 max-w-[260px] mx-auto text-slate-400 text-[11px] leading-relaxed">
                    Mô hình 3D tương ứng sẽ tự động hiển thị ở trung tâm để em quan sát khi làm bài!
                </div>
                <button onclick="initChallengeRound()" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-black shadow-lg active:scale-95">
                    Bắt Đầu Thử Thách
                </button>
            </div>
        `;
        return;
    }

    if (appState.currentQuestionIndex >= appState.activeQuestions.length) {
        // Complete
        appState.achievements.challenge = true;
        persistState();
        fireConfetti();
        syncChallenge3DScene();
        if (typeof VoiceNarrator !== 'undefined' && appState.voiceEnabled) {
            VoiceNarrator.speak(`Chúc mừng em đã hoàn thành thử thách! Điểm số của em là ${appState.score} trên 5!`);
        }
        card.innerHTML = `
            <div class="text-center py-4 space-y-2.5">
                <div class="text-3xl">🏅</div>
                <h3 class="text-base font-black text-emerald-300">HOÀN THÀNH THỬ THÁCH!</h3>
                <p class="text-xs text-slate-200">Điểm số: <b class="text-amber-400 text-sm font-mono">${appState.score} / 5</b></p>
                <div class="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs">
                    Em đã xuất sắc làm chủ toàn bộ kiến thức về cấu tạo, khai triển, phép quay, thiết diện và thể tích!
                </div>
                <button onclick="initChallengeRound()" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-600 hover:bg-slate-700 text-xs font-bold active:scale-95">
                    Làm Lại Lượt Mới
                </button>
            </div>
        `;
        return;
    }

    const q = appState.activeQuestions[appState.currentQuestionIndex];
    syncChallenge3DScene();

    const diagramSvg = getChallengeQuestionDiagram(q);

    const optionsHtml = q.options.map((opt, i) => `
        <button onclick="handleChallengeOption(${i})" class="challenge-opt-btn w-full text-left p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-2">
            <span class="w-5 h-5 rounded-md bg-slate-900 flex items-center justify-center font-mono text-[11px] font-bold text-amber-400">${String.fromCharCode(65 + i)}</span>
            <span>${opt}</span>
        </button>
    `).join('');

    card.innerHTML = `
        <div class="space-y-2">
            <div class="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-700/60 pb-1">
                <span>Câu ${appState.currentQuestionIndex + 1} / 5</span>
                <div class="flex items-center gap-2">
                    <button onclick="speakChallengeCurrentQuestion()" class="px-2 py-0.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-bold hover:bg-amber-900 flex items-center gap-1" title="Đọc to câu hỏi này">
                        <i class="ph-bold ph-speaker-high text-xs"></i><span>Đọc</span>
                    </button>
                    <span class="text-amber-400 font-bold">Điểm: ${appState.score}</span>
                </div>
            </div>

            <!-- Hình minh họa câu hỏi (Requirement: Chặng 7 đầy đủ hình học) -->
            <div class="bg-slate-950/70 border border-amber-500/30 rounded-xl p-1.5 flex flex-col items-center justify-center text-center shadow-inner">
                <div class="w-full flex items-center justify-between px-1.5 pb-1 border-b border-slate-800/80 text-[10px]">
                    <span class="text-amber-300 font-bold flex items-center gap-1">
                        <i class="ph-bold ph-polygon"></i><span>Hình minh họa câu hỏi</span>
                    </span>
                    <button onclick="syncChallenge3DScene()" class="text-slate-400 hover:text-cyan-300 flex items-center gap-0.5 text-[9px]" title="Đồng bộ lại mô hình 3D trung tâm">
                        <i class="ph-bold ph-arrows-clockwise"></i><span>Mô hình 3D</span>
                    </button>
                </div>
                <div class="pt-1 w-full">
                    ${diagramSvg}
                </div>
            </div>

            <p class="text-xs font-bold text-white leading-relaxed pt-0.5">${q.q}</p>
            <div class="space-y-1.5 pt-0.5">${optionsHtml}</div>
            <div id="challenge-feedback" class="text-xs font-bold pt-1 hidden"></div>
        </div>
    `;
}

function handleChallengeOption(idx) {
    const q = appState.activeQuestions[appState.currentQuestionIndex];
    const fb = document.getElementById('challenge-feedback');
    const buttons = document.querySelectorAll('.challenge-opt-btn');

    if (idx === q.correct) {
        buttons[idx].className = 'challenge-opt-btn w-full text-left p-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold border border-emerald-400 flex items-center gap-2';
        fb.className = 'text-xs font-bold pt-1.5 text-emerald-300';
        fb.innerHTML = `🎉 Chính xác! ${q.explain}`;
        fb.classList.remove('hidden');
        if (appState.wrongAttempts === 0) {
            appState.score++;
        }
        AudioEngine.success();
        buttons.forEach(b => (b.disabled = true));
        if (typeof VoiceNarrator !== 'undefined' && appState.voiceEnabled) {
            VoiceNarrator.speak('Chính xác! ' + q.explain);
        }
        setTimeout(() => {
            appState.currentQuestionIndex++;
            appState.wrongAttempts = 0;
            renderChallengeUI();
        }, 1800);
    } else {
        appState.wrongAttempts++;
        AudioEngine.wrong();
        buttons[idx].className = 'challenge-opt-btn w-full text-left p-2.5 rounded-xl bg-rose-600/80 text-white text-xs font-bold border border-rose-400 flex items-center gap-2';
        fb.className = 'text-xs font-bold pt-1.5 text-rose-300';
        const hintMsg = (appState.wrongAttempts === 1) ? q.hint1 : q.hint2;
        if (appState.wrongAttempts === 1) {
            fb.innerHTML = `Chưa đúng. 💡 Gợi ý: ${q.hint1}`;
        } else {
            fb.innerHTML = `Chưa đúng. 💡 Gợi ý chi tiết: ${q.hint2}`;
        }
        fb.classList.remove('hidden');
        if (typeof VoiceNarrator !== 'undefined' && appState.voiceEnabled) {
            VoiceNarrator.speak('Chưa đúng. ' + hintMsg);
        }
    }
}

// ==========================================
// 11. CLASSROOM EDITION v5: LESSON FLOW, MAP, & INTERACTIVE ACTIVITIES
// ==========================================

// --- A. Role Controller [ HỌC SINH | GIÁO VIÊN ] (Requirement 1) ---
function setAppRole(role) {
    appState.userRole = role;
    const btnStudent = document.getElementById('role-btn-student');
    const btnTeacher = document.getElementById('role-btn-teacher');

    if (role === 'student') {
        if (btnStudent) {
            btnStudent.className = 'px-2.5 py-1 rounded-lg font-black transition-all bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex items-center gap-1 shadow';
        }
        if (btnTeacher) {
            btnTeacher.className = 'px-2.5 py-1 rounded-lg font-bold transition-all text-slate-300 hover:text-white flex items-center gap-1';
        }
        appState.teacherMode = false;
        appState.formulaDisplayMode = 'quiz'; // Mask completed values for discovery
        AudioEngine.step();
        showToast('🎒 Chế độ HỌC SINH: Khám phá từng bước bài học số.');
    } else {
        if (btnStudent) {
            btnStudent.className = 'px-2.5 py-1 rounded-lg font-bold transition-all text-slate-300 hover:text-white flex items-center gap-1';
        }
        if (btnTeacher) {
            btnTeacher.className = 'px-2.5 py-1 rounded-lg font-black transition-all bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 flex items-center gap-1 shadow';
        }
        appState.teacherMode = true;
        appState.formulaDisplayMode = 'full';
        AudioEngine.step();
        showToast('👨‍🏫 Chế độ GIÁO VIÊN: Nhấn [GIÁO VIÊN] để mở thanh công cụ giảng dạy.');
        toggleSubmenu('teacher');
    }

    updateCalculations();
    updateGuidedUI();
    persistState();
}

// --- B. 7-Stage Lesson Map (Requirement 2 & 9) ---
const LESSON_STAGES = [
    { num: 1, id: 'structure', title: 'Chặng 1: Cấu Tạo & Định Lý Pythagore', mode: 'structure', shape: 'cone', icon: 'ph-compass-tool' },
    { num: 2, id: 'revolution', title: 'Chặng 2: Quay Tạo Khối Không Gian', mode: 'revolution', shape: 'cone', icon: 'ph-arrows-clockwise' },
    { num: 3, id: 'net', title: 'Chặng 3: Khai Triển Phẳng & Cung Quạt', mode: 'net', shape: 'cone', icon: 'ph-scissors' },
    { num: 4, id: 'area', title: 'Chặng 4: Diện Tích Xung Quanh & Toàn Phần', mode: 'net', shape: 'cone', icon: 'ph-bounding-box' },
    { num: 5, id: 'volume', title: 'Chặng 5: Thể Tích & Thí Nghiệm Rót Nước', mode: 'volume', shape: 'cone', icon: 'ph-drop' },
    { num: 6, id: 'section', title: 'Chặng 6: Thiết Diện & Mặt Cắt Không Gian', mode: 'section', shape: 'cone', icon: 'ph-knife' },
    { num: 7, id: 'challenge', title: 'Chặng 7: Đấu Trường Thử Thách & Vận Dụng', mode: 'challenge', shape: 'cone', icon: 'ph-trophy' }
];

// ==========================================
// 11. LESSON STATE & UNIFIED STEP NAVIGATION
// ==========================================
// Requirements 4.1 - 4.9: Decouple 'viewing' from 'completed', preserve answers, allow seamless back/next
const STAGE_STEP_COUNTS = {
    1: 4, // 1: Quan sát r,h,l; 2: Kéo slider r,h; 3: Tam giác SOB & Pythagore; 4: Hoàn thành chặng 1
    2: 3, // 1: Dự đoán nón; 2: Quay 360; 3: Kết luận nón/trụ
    3: 3, // 1: Dự đoán quạt; 2: Trải phẳng; 3: Kết luận & cung quạt
    4: 2, // 1: Công thức Sxq, Stp; 2: Hoàn thành
    5: 3, // 1: Dự đoán 3 lần; 2: Rót nước 1,2,3; 3: Đối chiếu thể tích
    6: 2, // 1: Các loại mặt cắt; 2: Hoàn thành
    7: 1  // 1: Đấu trường thử thách & vận dụng
};

const lessonState = {
    currentStageIndex: 1, // 1 to 7
    currentStepIndex: 1,  // 1 to 4
    completedSteps: {},   // e.g. { 's1_step1': true, 's1_step2': true }
    answers: {},          // e.g. { 's1_step2': { value: 'A', isCorrect: true, text: '...' } }
    attempts: {},         // e.g. { 's1_step2': 1 }
    discoveries: {},
    highestUnlockedStage: 1
};

function getCurrentStage() {
    return lessonState.currentStageIndex;
}

function getCurrentStep() {
    return lessonState.currentStepIndex;
}

function getLastStepOfStage(stage) {
    return STAGE_STEP_COUNTS[stage] || 3;
}

function isStepCompleted(stage, step) {
    const key = `s${stage}_step${step}`;
    return !!lessonState.completedSteps[key];
}

function markStepCompleted(stage, step, silent = false) {
    const key = `s${stage}_step${step}`;
    const wasAlreadyDone = !!lessonState.completedSteps[key];
    lessonState.completedSteps[key] = true;

    const maxSteps = getLastStepOfStage(stage);
    if (step >= maxSteps) {
        appState.stageCompletions[stage - 1] = true;
        if (stage < 7 && lessonState.highestUnlockedStage <= stage) {
            lessonState.highestUnlockedStage = stage + 1;
        }
        if (!wasAlreadyDone && !silent) {
            AudioEngine.success();
            fireConfetti();
        }
    } else {
        if (!wasAlreadyDone && !silent) {
            AudioEngine.step();
        }
    }

    saveLessonState();
    updateLessonMap();
}

function saveStepAnswer(stage, step, answerData) {
    const key = `s${stage}_step${step}`;
    lessonState.answers[key] = {
        ...answerData,
        timestamp: Date.now()
    };
    saveLessonState();
}

function getStepAnswer(stage, step) {
    const key = `s${stage}_step${step}`;
    return lessonState.answers[key];
}

function resetStepAnswer(stage, step) {
    const key = `s${stage}_step${step}`;
    delete lessonState.answers[key];
    delete lessonState.completedSteps[key];
    delete lessonState.completedSteps[`${stage}_${step}`];
    saveLessonState();
    if (stage === 1 && typeof updateStructureConeGeometry === 'function') {
        updateStructureConeGeometry(step);
    }
    renderGuidedCard();
    AudioEngine.click();
    showToast('✎ Đã đặt lại câu hỏi. Em có thể chọn lại đáp án!');
}

function goToPreviousStep() {
    const stage = lessonState.currentStageIndex;
    const step = lessonState.currentStepIndex;

    // Requirement 4.2: Disabled ONLY if at Stage 1 Step 1
    if (stage === 1 && step === 1) {
        showToast('Đang ở bước đầu tiên của bài học');
        return;
    }

    exitLessonStep(stage, step);

    // Requirement 4.3: If at Step 1 of Stage > 1, go to last step of previous stage!
    if (step > 1) {
        lessonState.currentStepIndex--;
    } else if (stage > 1) {
        lessonState.currentStageIndex--;
        lessonState.currentStepIndex = getLastStepOfStage(lessonState.currentStageIndex);
    }

    enterLessonStep(lessonState.currentStageIndex, lessonState.currentStepIndex);
    AudioEngine.step();
    updateGuidedUI();
    saveLessonState();
}

function goToNextStep() {
    const stage = lessonState.currentStageIndex;
    const step = lessonState.currentStepIndex;
    const maxSteps = getLastStepOfStage(stage);

    if (stage === 7 && step >= maxSteps) {
        showToast('🎉 Em đã hoàn thành toàn bộ 7 chặng khám phá!');
        return;
    }

    // Auto mark step completed on progressing
    markStepCompleted(stage, step, true);

    exitLessonStep(stage, step);

    // Requirement 4.4: Next advances step, or advances stage and resets step to 1
    if (step < maxSteps) {
        lessonState.currentStepIndex++;
    } else if (stage < 7) {
        lessonState.currentStageIndex++;
        lessonState.currentStepIndex = 1;
        if (lessonState.highestUnlockedStage < lessonState.currentStageIndex) {
            lessonState.highestUnlockedStage = lessonState.currentStageIndex;
        }
    }

    enterLessonStep(lessonState.currentStageIndex, lessonState.currentStepIndex);
    AudioEngine.step();
    updateGuidedUI();
    saveLessonState();
}

function goToStage(stageNum) {
    if (stageNum < 1 || stageNum > 7) return;

    exitLessonStep(lessonState.currentStageIndex, lessonState.currentStepIndex);

    lessonState.currentStageIndex = stageNum;
    lessonState.currentStepIndex = 1;
    if (stageNum > lessonState.highestUnlockedStage) {
        lessonState.highestUnlockedStage = stageNum;
    }

    enterLessonStep(lessonState.currentStageIndex, lessonState.currentStepIndex);
    if (typeof AudioEngine !== 'undefined' && AudioEngine.step) AudioEngine.step();
    updateGuidedUI();
    renderRoadmapStagesList();
    renderLessonStageDropdown();
    saveLessonState();

    const stageObj = LESSON_STAGES[stageNum - 1];
    showToast(`📍 Đã chuyển tới ${stageObj ? stageObj.title : 'Chặng ' + stageNum}`);
}

function enterLessonStep(stage, step) {
    appState.lessonStage = stage;
    appState.step = step;

    // Requirements 1.1, 1.2, 1.5 & Phần 2: Separate handlers for Stage 1 vs Stage 2
    if (stage === 1) {
        enterStructureLessonStep(step);
    } else if (stage === 2) {
        enterRevolutionLessonStep(step);
    } else {
        if (typeof structureGroup !== 'undefined' && stage !== 7) structureGroup.visible = false;
        const sp = document.getElementById('panel-mode-structure');
        if (sp) sp.classList.add('hidden');

        const stageInfo = LESSON_STAGES[stage - 1];
        if (stageInfo) {
            if (stageInfo.mode && appState.mode !== stageInfo.mode) {
                setMode(stageInfo.mode);
            }
            if (stageInfo.shape && appState.shape !== stageInfo.shape) {
                setShape(stageInfo.shape);
            }
        }

        if (stage === 3) {
            setMode('net');
            setShape('cone');
            // POINT 3 FIX: Hình không được mở sẵn khi vào bài, chỉ mở khi người dùng thực hiện thao tác
            setUnfoldProgress(0);
        } else if (stage === 4) {
            setMode('net');
            setShape('cone');
            if (step === 1) setUnfoldProgress(0);
        } else if (stage === 5) {
            setMode('volume');
            setShape('cone');
            if (step === 1) {
                resetVolumeSimulation(false);
            } else if (step === 3 && isStepCompleted(5, 2)) {
                appState.currentPour = 3;
                updateVolumeUI();
            }
            rebuildVolumeGeometries();
        } else if (stage === 6) {
            setMode('section');
            setShape('cone');
        } else if (stage === 7) {
            setMode('challenge');
            syncChallenge3DScene();
        }
    }

    applyFloatingModelPosition();
    frameFloatingModel();

    // Bổ sung giọng nói thuyết minh tự động khi chuyển chặng/bước
    if (typeof VoiceNarrator !== 'undefined' && appState.voiceEnabled) {
        if (VoiceNarrator._autoTimer) clearTimeout(VoiceNarrator._autoTimer);
        VoiceNarrator._autoTimer = setTimeout(() => {
            VoiceNarrator.speakCurrentStep();
        }, 450);
    }
}

function exitLessonStep(stage, step) {
    // Teardown if any
}

function saveLessonState() {
    try {
        localStorage.setItem('k2_math_lesson_state_v5', JSON.stringify({
            currentStageIndex: lessonState.currentStageIndex,
            currentStepIndex: lessonState.currentStepIndex,
            completedSteps: lessonState.completedSteps,
            answers: lessonState.answers,
            attempts: lessonState.attempts,
            highestUnlockedStage: lessonState.highestUnlockedStage,
            stageCompletions: appState.stageCompletions,
            predictions: appState.predictions
        }));
    } catch (e) {}
}

function loadLessonState() {
    try {
        const raw = localStorage.getItem('k2_math_lesson_state_v5');
        if (raw) {
            const data = JSON.parse(raw);
            if (data.currentStageIndex) lessonState.currentStageIndex = data.currentStageIndex;
            if (data.currentStepIndex) lessonState.currentStepIndex = data.currentStepIndex;
            if (data.completedSteps) lessonState.completedSteps = data.completedSteps;
            if (data.answers) lessonState.answers = data.answers;
            if (data.attempts) lessonState.attempts = data.attempts;
            if (data.highestUnlockedStage) lessonState.highestUnlockedStage = data.highestUnlockedStage;
            if (data.stageCompletions) appState.stageCompletions = data.stageCompletions;
            if (data.predictions) appState.predictions = data.predictions;

            appState.lessonStage = lessonState.currentStageIndex;
            appState.step = lessonState.currentStepIndex;
        }
    } catch (e) {
        console.warn('loadLessonState skipped', e);
    }
}

function updateLessonMap() {
    renderRoadmapStagesList();
    if (typeof updateLessonDockUI === 'function') {
        updateLessonDockUI();
    }

    const badge = document.getElementById('roadmap-badge');
    if (badge) {
        badge.innerText = `${lessonState.currentStageIndex}/7`;
    }

    const dotsContainer = document.getElementById('lesson-map-dots');
    const stageTitle = document.getElementById('lesson-stage-title');
    if (dotsContainer) {
        dotsContainer.innerHTML = LESSON_STAGES.map(s => {
            const isCompleted = appState.stageCompletions[s.num - 1];
            const isCurrent = lessonState.currentStageIndex === s.num;
            const isUnlocked = (s.num <= lessonState.highestUnlockedStage) || isCompleted;

            let dotClass = 'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-all cursor-pointer ';
            if (isCurrent) {
                dotClass += 'bg-amber-400 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.9)] ring-2 ring-white scale-110';
            } else if (isCompleted) {
                dotClass += 'bg-emerald-500 text-slate-950 font-black shadow-[0_0_8px_rgba(16,185,129,0.5)] hover:scale-105';
            } else if (isUnlocked) {
                dotClass += 'bg-slate-800 text-cyan-300 hover:bg-slate-700 border border-cyan-700/60';
            } else {
                dotClass += 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed';
            }

            const symbol = isCompleted ? '✓' : s.num;
            return `
                <button onclick="goToStage(${s.num})" class="${dotClass}" title="${s.title}">
                    ${symbol}
                </button>
            `;
        }).join('');
    }

    const currentStageObj = LESSON_STAGES.find(s => s.num === lessonState.currentStageIndex) || LESSON_STAGES[0];
    if (stageTitle) {
        stageTitle.innerText = currentStageObj.title;
    }
}

function renderRoadmapStagesList() {
    const list = document.getElementById('roadmap-stages-list');
    if (!list) return;

    list.innerHTML = LESSON_STAGES.map(s => {
        const isDone = appState.stageCompletions[s.num - 1];
        const isCur = lessonState.currentStageIndex === s.num;

        let statusBadge = isCur 
            ? '<span class="text-amber-400 font-bold flex items-center gap-0.5 text-[10px]">◉ Đang học</span>'
            : (isDone 
                ? '<span class="text-emerald-400 font-bold flex items-center gap-0.5 text-[10px]">✓ Đã xong</span>' 
                : '<span class="text-cyan-400 text-[10px]">○ Đã mở</span>');

        let bgClass = isCur 
            ? 'bg-amber-500/20 border-amber-400/50 text-white font-bold' 
            : (isDone 
                ? 'bg-slate-900/80 border-slate-700/80 text-slate-200 hover:bg-slate-800' 
                : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-800');

        return `
            <div onclick="goToStage(${s.num}); closeAllSubmenus();" class="p-2 rounded-xl border ${bgClass} cursor-pointer transition-all flex items-center justify-between text-xs active:scale-95" title="Chuyển tới ${s.title}">
                <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-lg ${isCur ? 'bg-amber-500 text-slate-950 font-black' : (isDone ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-cyan-300')} flex items-center justify-center text-xs font-mono">
                        ${isDone ? '✓' : s.num}
                    </span>
                    <span class="font-bold text-[11px]">${s.title}</span>
                </div>
                ${statusBadge}
            </div>
        `;
    }).join('');
}

function setLessonStage(stageNum) {
    goToStage(stageNum);
}

function completeCurrentStage() {
    markStepCompleted(lessonState.currentStageIndex, getLastStepOfStage(lessonState.currentStageIndex), false);
}

// --- C. Discovery Journal System (Requirement 5) ---
const DISCOVERY_ENTRIES = [
    {
        id: 'pythagoras',
        title: 'Mối quan hệ đường sinh: Định lý Pythagore',
        formula: 'l² = r² + h² ⇒ l = √(r² + h²)',
        explanation: 'Trong tam giác vuông SOB (vuông tại tâm đáy O), đường sinh l là cạnh huyền, bán kính r và chiều cao h là hai cạnh góc vuông.',
        badge: 'HÌNH NÓN',
        color: '#f59e0b'
    },
    {
        id: 'rev_cone',
        title: 'Hình phẳng sinh ra hình nón',
        formula: 'Δ vuông SOB quay 360° quanh SO ⇒ Hình Nón',
        explanation: 'Quay một tam giác vuông quanh một cạnh góc vuông cố định: cạnh góc vuông kia quét nên hình tròn đáy bán kính r, cạnh huyền quét nên mặt xung quanh.',
        badge: 'QUAY TẠO',
        color: '#06b6d4'
    },
    {
        id: 'rev_cyl',
        title: 'Hình phẳng sinh ra hình trụ',
        formula: 'Hình chữ nhật quay 360° quanh một cạnh ⇒ Hình Trụ',
        explanation: 'Quay một hình chữ nhật quanh một cạnh cố định: hai cạnh kề quét nên hai đáy hình tròn bằng nhau, cạnh đối diện quét nên mặt xung quanh.',
        badge: 'QUAY TẠO',
        color: '#38bdf8'
    },
    {
        id: 'net_arc',
        title: 'Độ dài cung quạt khai triển hình nón',
        formula: 'Độ dài cung quạt = Chu vi đáy = 2πr',
        explanation: 'Mặt xung quanh của hình nón khi trải phẳng ra là một hình quạt tròn, có độ dài cung quạt bao trọn đúng chu vi hình tròn đáy 2πr.',
        badge: 'KHAI TRIỂN',
        color: '#ec4899'
    },
    {
        id: 'net_radius',
        title: 'Bán kính quạt khai triển chính là đường sinh',
        formula: 'R_quạt = l',
        explanation: 'Khoảng cách từ đỉnh nón S tới mọi điểm trên mép đáy luôn bằng đường sinh l. Do đó khi trải phẳng, bán kính hình quạt chính bằng l.',
        badge: 'KHAI TRIỂN',
        color: '#ec4899'
    },
    {
        id: 'area_cone_xq',
        title: 'Diện tích xung quanh hình nón',
        formula: 'Sxq = πrl',
        explanation: 'Diện tích hình quạt tròn có độ dài cung 2πr và bán kính l: S = 1/2 · (2πr) · l = πrl.',
        badge: 'DIỆN TÍCH',
        color: '#f59e0b'
    },
    {
        id: 'area_cyl_xq',
        title: 'Diện tích xung quanh hình trụ',
        formula: 'Sxq = 2πrh',
        explanation: 'Khai triển mặt xung quanh hình trụ là một hình chữ nhật có kích thước là chiều cao h và chu vi đáy 2πr. Do đó Sxq = 2πrh.',
        badge: 'DIỆN TÍCH',
        color: '#38bdf8'
    },
    {
        id: 'vol_ratio',
        title: 'Tỉ số thể tích: 3 Hình nón = 1 Hình trụ',
        formula: 'V_nón = 1/3 V_trụ = 1/3 πr²h',
        explanation: 'Thí nghiệm thực nghiệm rót nước chứng minh: 3 lần rót đầy hình nón nước vừa vặn làm đầy 1 hình trụ có cùng bán kính đáy r và chiều cao h.',
        badge: 'THỂ TÍCH',
        color: '#10b981'
    },
    {
        id: 'sec_horiz',
        title: 'Thiết diện cắt song song với đáy',
        formula: 'r\' / r = (h - y) / h ⇒ r\' = r · (1 - y/h)',
        explanation: 'Lát cắt song song với đáy của hình nón là một hình tròn đồng dạng thu nhỏ. Bán kính lát cắt giảm tuyến tính từ r về 0 khi tiến dần về đỉnh S.',
        badge: 'MẶT CẮT',
        color: '#10b981'
    },
    {
        id: 'sec_axial',
        title: 'Thiết diện qua trục của nón và trụ',
        formula: 'Nón: Tam giác cân (đáy 2r, cao h) | Trụ: Hình chữ nhật (2r × h)',
        explanation: 'Mặt phẳng đi qua trục đối xứng cắt hình nón tạo thành tam giác cân đỉnh S, cắt hình trụ tạo thành hình chữ nhật kích thước 2r × h.',
        badge: 'MẶT CẮT',
        color: '#8b5cf6'
    }
];

function unlockDiscovery(id) {
    if (!appState.discoveryJournal.includes(id)) {
        appState.discoveryJournal.push(id);
        const item = DISCOVERY_ENTRIES.find(e => e.id === id);
        AudioEngine.success();
        fireConfetti();
        updateDiaryBadge();
        showToast(`📒 ĐÃ MỞ KHÓA ĐỊNH LÝ: ${item ? item.title : id}! Ghi vào Nhật Ký.`);
        persistState();
    }
}

function updateDiaryBadge() {
    const badge = document.getElementById('diary-counter-badge');
    const tag = document.getElementById('diary-progress-tag');
    const count = appState.discoveryJournal.length;
    const total = DISCOVERY_ENTRIES.length;
    if (badge) badge.innerText = count;
    if (tag) tag.innerText = `${count} / ${total} Khám phá`;
}

function openDiaryModal() {
    renderDiscoveryDiary();
    const modal = document.getElementById('diary-modal');
    if (modal) modal.classList.remove('hidden');
    AudioEngine.click();
}

function closeDiaryModal() {
    const modal = document.getElementById('diary-modal');
    if (modal) modal.classList.add('hidden');
}

function renderDiscoveryDiary() {
    const container = document.getElementById('diary-entries-container');
    if (!container) return;
    updateDiaryBadge();

    container.innerHTML = DISCOVERY_ENTRIES.map(item => {
        const isUnlocked = appState.discoveryJournal.includes(item.id);
        if (isUnlocked) {
            return `
                <div class="glass-subpanel p-3 rounded-2xl border-l-4 space-y-1.5 transition-all" style="border-left-color: ${item.color};">
                    <div class="flex items-center justify-between">
                        <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded font-mono" style="background: ${item.color}22; color: ${item.color};">
                            ✓ ${item.badge}
                        </span>
                        <div class="flex items-center gap-1.5">
                            <button onclick="speakDiscoveryEntry('${item.id}', event)" class="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition-all" title="Nghe đọc định lý này">
                                <i class="ph-bold ph-speaker-high text-xs"></i><span>Nghe đọc</span>
                            </button>
                            <span class="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                <i class="ph-bold ph-check-circle"></i> Đã khám phá
                            </span>
                        </div>
                    </div>
                    <h4 class="text-xs font-black text-white">${item.title}</h4>
                    <div class="p-2 rounded-xl bg-slate-900/90 font-mono text-xs font-bold text-amber-300 text-center border border-slate-700/60">
                        ${item.formula}
                    </div>
                    <p class="text-[11px] text-slate-300 leading-relaxed">${item.explanation}</p>
                </div>
            `;
        } else {
            return `
                <div class="glass-subpanel p-3 rounded-2xl border-l-4 border-slate-700 opacity-60 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-lg text-slate-500">🔒</span>
                        <div>
                            <h4 class="text-xs font-bold text-slate-400">${item.title}</h4>
                            <p class="text-[10px] text-slate-500 italic">Thực hiện các thí nghiệm trong bài học để mở khóa định lý này.</p>
                        </div>
                    </div>
                    <span class="text-[10px] font-mono text-slate-500">Chưa mở</span>
                </div>
            `;
        }
    }).join('');
}

// ==========================================
// 11D. DRAGGABLE FLOATING LESSON WINDOW
// ==========================================
let lessonWindowState = {
    x: 0,
    y: 0,
    isDragging: false,
    isMinimized: false,
    isPinned: false,
    isClosed: false,
    hasCustomPosition: false
};

function renderLessonStageDropdown() {
    const list = document.getElementById('lw-stage-dropdown-list');
    if (!list) return;

    list.innerHTML = LESSON_STAGES.map(s => {
        const isDone = appState.stageCompletions[s.num - 1];
        const isCur = lessonState.currentStageIndex === s.num;

        let badge = isCur 
            ? '<span class="text-amber-300 font-black text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-400/50">◉ Đang học</span>'
            : (isDone 
                ? '<span class="text-emerald-400 font-bold text-[10px]">✓ Đã xong</span>' 
                : '<span class="text-cyan-400 text-[10px]">○ Mở</span>');

        let bg = isCur 
            ? 'bg-amber-500/25 border-amber-400/60 text-white font-bold' 
            : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-700/60';

        return `
            <button onclick="goToStage(${s.num}); toggleLessonStageSelector();" class="p-2 rounded-xl border ${bg} text-left flex items-center justify-between transition-all active:scale-95 text-xs w-full">
                <div class="flex items-center gap-2">
                    <span class="w-5 h-5 rounded-md ${isCur ? 'bg-amber-500 text-slate-950 font-black' : (isDone ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-cyan-300')} flex items-center justify-center text-[10px] font-mono">
                        ${isDone ? '✓' : s.num}
                    </span>
                    <span class="text-[11px] font-semibold">${s.title}</span>
                </div>
                ${badge}
            </button>
        `;
    }).join('');
}

function toggleLessonStageSelector(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const dropdown = document.getElementById('lw-stage-dropdown');
    if (!dropdown) return;
    const isHidden = dropdown.classList.contains('hidden');
    if (isHidden) {
        renderLessonStageDropdown();
        dropdown.classList.remove('hidden');
    } else {
        dropdown.classList.add('hidden');
    }
}

function movePanelPreset(preset) {
    const windowEl = document.getElementById('lesson-window');
    if (!windowEl) return;

    if (lessonWindowState.isPinned) {
        togglePinLessonPanel(false);
    }

    const panelW = windowEl.offsetWidth || 420;
    const panelH = windowEl.offsetHeight || 360;

    let targetX = 20;
    let targetY = 70;

    const rightSidebar = document.getElementById('sidebar-right');
    const isRightVisible = rightSidebar && !rightSidebar.classList.contains('hidden') && rightSidebar.offsetWidth > 0;
    const rightMargin = isRightVisible ? rightSidebar.offsetWidth + 16 : 24;

    const leftSidebar = document.getElementById('sidebar-left');
    const isLeftVisible = leftSidebar && !leftSidebar.classList.contains('hidden') && leftSidebar.offsetWidth > 0;
    const leftMargin = isLeftVisible ? leftSidebar.offsetWidth + 16 : 24;

    switch (preset) {
        case 'bottom-left':
            targetX = Math.max(8, leftMargin);
            targetY = Math.max(60, window.innerHeight - panelH - 24);
            break;
        case 'bottom-right':
            targetX = Math.max(8, window.innerWidth - panelW - rightMargin);
            targetY = Math.max(60, window.innerHeight - panelH - 24);
            break;
        case 'top-left':
            targetX = Math.max(8, leftMargin);
            targetY = 64;
            break;
        case 'top-right':
            targetX = Math.max(8, window.innerWidth - panelW - rightMargin);
            targetY = 64;
            break;
        case 'center':
        default:
            targetX = Math.max(8, Math.round((window.innerWidth - panelW) / 2));
            targetY = Math.max(60, Math.round((window.innerHeight - panelH) / 2));
            break;
    }

    lessonWindowState.x = targetX;
    lessonWindowState.y = targetY;
    lessonWindowState.hasCustomPosition = true;

    windowEl.style.transition = 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)';
    applyLessonWindowTransform(windowEl, targetX, targetY);
    setTimeout(() => {
        if (windowEl) windowEl.style.transition = '';
    }, 300);

    saveLessonWindowState();
    if (typeof AudioEngine !== 'undefined' && AudioEngine.click) AudioEngine.click();
    showToast(`⌖ Đã di chuyển bảng: ${preset === 'bottom-left' ? 'Góc dưới trái' : preset === 'bottom-right' ? 'Góc dưới phải' : preset === 'top-left' ? 'Góc trên trái' : 'Chính giữa'}`);
}

function initLessonWindowDraggable() {
    const windowEl = document.getElementById('lesson-window');
    const topBar = document.getElementById('lesson-top-drag-bar');
    const handleEl = document.getElementById('lesson-drag-handle');
    if (!windowEl) return;

    let startPointerX = 0;
    let startPointerY = 0;
    let startPanelX = 0;
    let startPanelY = 0;
    let isPointerDown = false;
    let hasMoved = false;
    let cachedPanelW = 420;
    let cachedPanelH = 360;
    let activePointerId = null;
    let activeDragEl = null;

    const startDrag = (clientX, clientY, pointerId = null, targetEl = null) => {
        // If panel was pinned, detach seamlessly with exact current rect coordinates
        if (lessonWindowState.isPinned) {
            const rect = windowEl.getBoundingClientRect();
            windowEl.classList.remove('lesson-window-pinned');
            lessonWindowState.isPinned = false;
            const pinBtn = document.getElementById('lw-btn-pin');
            if (pinBtn) {
                pinBtn.classList.remove('bg-amber-500/20', 'text-amber-400', 'border-amber-400/50');
                pinBtn.title = 'Ghim bảng vào cạnh phải (Dock)';
            }
            lessonWindowState.x = rect.left;
            lessonWindowState.y = rect.top;
            applyLessonWindowTransform(windowEl, rect.left, rect.top);
        }

        // Close stage dropdown if open
        const dd = document.getElementById('lw-stage-dropdown');
        if (dd) dd.classList.add('hidden');

        isPointerDown = true;
        hasMoved = false;
        lessonWindowState.isDragging = true;
        windowEl.classList.add('is-dragging');
        windowEl.style.transition = 'none';

        if (typeof controls !== 'undefined' && controls) {
            controls.enabled = false;
        }

        activePointerId = pointerId;
        activeDragEl = targetEl;
        if (pointerId !== null && targetEl && targetEl.setPointerCapture) {
            try { targetEl.setPointerCapture(pointerId); } catch (_) {}
        }

        const rect = windowEl.getBoundingClientRect();
        startPointerX = clientX;
        startPointerY = clientY;
        startPanelX = rect.left;
        startPanelY = rect.top;
        cachedPanelW = rect.width || 420;
        cachedPanelH = rect.height || 360;

        lessonWindowState.x = rect.left;
        lessonWindowState.y = rect.top;
        lessonWindowState.hasCustomPosition = true;
    };

    const moveDrag = (clientX, clientY) => {
        if (!isPointerDown || !lessonWindowState.isDragging) return;

        const dx = clientX - startPointerX;
        const dy = clientY - startPointerY;

        if (!hasMoved && Math.hypot(dx, dy) > 4) {
            hasMoved = true;
        }

        let targetX = startPanelX + dx;
        let targetY = startPanelY + dy;

        const minX = 0;
        const maxX = Math.max(0, window.innerWidth - cachedPanelW);
        const minY = 50;
        const maxY = Math.max(minY, window.innerHeight - 44);

        targetX = Math.min(Math.max(minX, targetX), maxX);
        targetY = Math.min(Math.max(minY, targetY), maxY);

        lessonWindowState.x = targetX;
        lessonWindowState.y = targetY;

        applyLessonWindowTransform(windowEl, targetX, targetY);
    };

    const endDrag = (pointerId = null) => {
        if (!isPointerDown) return;
        isPointerDown = false;
        lessonWindowState.isDragging = false;
        windowEl.classList.remove('is-dragging');
        windowEl.style.transition = '';

        if (activePointerId !== null && activeDragEl && activeDragEl.releasePointerCapture) {
            try { activeDragEl.releasePointerCapture(activePointerId); } catch (_) {}
        }
        activePointerId = null;
        activeDragEl = null;

        if (typeof controls !== 'undefined' && controls) {
            controls.enabled = true;
        }
        saveLessonWindowState();
    };

    const bindDragSource = (el) => {
        if (!el) return;

        el.addEventListener('pointerdown', (e) => {
            // Interactive buttons inside handle (except stage badge button which can both drag and toggle)
            const isBadge = !!e.target.closest('#lw-stage-badge-btn');
            const isOtherBtn = !!e.target.closest('button, select, input, a, textarea') && !isBadge;
            if (isOtherBtn) return;

            startDrag(e.clientX, e.clientY, e.pointerId, el);
            e.stopPropagation();
        });

        el.addEventListener('pointermove', (e) => {
            if (!isPointerDown) return;
            moveDrag(e.clientX, e.clientY);
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
        });

        el.addEventListener('pointerup', (e) => {
            if (!isPointerDown) return;
            const moved = hasMoved;
            endDrag(e.pointerId);
            e.stopPropagation();

            if (!moved && e.target.closest('#lw-stage-badge-btn')) {
                toggleLessonStageSelector(e);
            }
        });

        el.addEventListener('pointercancel', (e) => {
            if (!isPointerDown) return;
            endDrag(e.pointerId);
        });
    };

    bindDragSource(topBar);
    bindDragSource(handleEl);

    // Global move and up listeners to ensure drag does not drop during fast pointer motions
    window.addEventListener('pointermove', (e) => {
        if (!isPointerDown) return;
        moveDrag(e.clientX, e.clientY);
    });

    window.addEventListener('pointerup', (e) => {
        if (!isPointerDown) return;
        endDrag(e.pointerId);
    });

    window.addEventListener('pointercancel', (e) => {
        if (!isPointerDown) return;
        endDrag(e.pointerId);
    });

    // Double-click header to minimize/expand
    if (handleEl) {
        handleEl.addEventListener('dblclick', (e) => {
            if (e.target.closest('button, select, input, a')) return;
            toggleMinimizeLessonPanel();
        });
    }
    if (topBar) {
        topBar.addEventListener('dblclick', (e) => {
            if (e.target.closest('button, select, input, a')) return;
            toggleMinimizeLessonPanel();
        });
    }

    // Stop propagation on whole window to prevent accidental 3D camera rotation
    windowEl.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
    });

    // Close stage dropdown on outside click
    document.addEventListener('pointerdown', (e) => {
        const dd = document.getElementById('lw-stage-dropdown');
        const badgeBtn = document.getElementById('lw-stage-badge-btn');
        if (dd && !dd.classList.contains('hidden')) {
            if (!dd.contains(e.target) && (!badgeBtn || !badgeBtn.contains(e.target))) {
                dd.classList.add('hidden');
            }
        }
    });

    // Keep window inside visible viewport on screen resize
    window.addEventListener('resize', ensurePanelInViewport);

    // Initialize resize handle if present
    initLessonResizeHandle();
}

function initLessonResizeHandle() {
    const handle = document.getElementById('lesson-resize-handle');
    const windowEl = document.getElementById('lesson-window');
    const bodyEl = document.getElementById('lesson-window-body');
    if (!handle || !windowEl) return;

    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startW = 0;
    let startH = 0;

    handle.addEventListener('pointerdown', (e) => {
        if (lessonWindowState.isPinned || lessonWindowState.isMinimized) return;
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = windowEl.getBoundingClientRect();
        startW = rect.width;
        startH = rect.height;

        if (typeof controls !== 'undefined' && controls) {
            controls.enabled = false;
        }
        try { handle.setPointerCapture(e.pointerId); } catch (_) {}
        e.stopPropagation();
        e.preventDefault();
    });

    const onResizeMove = (e) => {
        if (!isResizing) return;
        const dw = e.clientX - startX;
        const dh = e.clientY - startY;

        const maxAllowedW = Math.min(560, window.innerWidth - 16);
        const newW = Math.min(Math.max(300, startW + dw), maxAllowedW);
        windowEl.style.width = `${newW}px`;

        if (bodyEl) {
            const newH = Math.max(160, startH + dh - 48);
            bodyEl.style.maxHeight = `${newH}px`;
        }
        e.stopPropagation();
    };

    const onResizeUp = (e) => {
        if (!isResizing) return;
        isResizing = false;
        try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
        if (typeof controls !== 'undefined' && controls) {
            controls.enabled = true;
        }
        e.stopPropagation();
    };

    window.addEventListener('pointermove', onResizeMove);
    window.addEventListener('pointerup', onResizeUp);
    window.addEventListener('pointercancel', onResizeUp);
}

function applyLessonWindowTransform(el, x, y) {
    if (!el) return;
    if (lessonWindowState.isPinned && !lessonWindowState.isDragging) return;
    el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
}

function resetPanelPosition(animated = true) {
    const windowEl = document.getElementById('lesson-window');
    if (!windowEl) return;

    if (lessonWindowState.isPinned) {
        togglePinLessonPanel(false);
    }

    const rect = windowEl.getBoundingClientRect();
    const panelW = rect.width || 420;
    const panelH = rect.height || 360;

    const rightSidebar = document.getElementById('sidebar-right');
    const isRightVisible = rightSidebar && !rightSidebar.classList.contains('hidden') && !rightSidebar.classList.contains('-mr-full') && rightSidebar.offsetWidth > 0;
    const rightMargin = isRightVisible ? rightSidebar.offsetWidth + 16 : 24;

    const leftSidebar = document.getElementById('sidebar-left');
    const isLeftVisible = leftSidebar && !leftSidebar.classList.contains('hidden') && !leftSidebar.classList.contains('-ml-full') && leftSidebar.offsetWidth > 0;
    const leftMargin = isLeftVisible ? leftSidebar.offsetWidth + 16 : 24;

    let targetX = 24;
    if (window.innerWidth < 768) {
        targetX = Math.max(8, Math.round((window.innerWidth - panelW) / 2));
    } else {
        // Position comfortably in the center viewport without covering either sidebar
        const availableW = window.innerWidth - rightMargin - leftMargin;
        if (availableW >= panelW + 20) {
            targetX = Math.max(leftMargin + 8, window.innerWidth - rightMargin - panelW);
        } else {
            targetX = Math.max(8, window.innerWidth - panelW - rightMargin);
        }
    }
    let targetY = Math.max(68, window.innerHeight - panelH - 24);

    lessonWindowState.x = targetX;
    lessonWindowState.y = targetY;
    lessonWindowState.hasCustomPosition = false;

    if (animated) {
        windowEl.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
        setTimeout(() => {
            if (windowEl) windowEl.style.transition = '';
        }, 260);
    }

    applyLessonWindowTransform(windowEl, targetX, targetY);
    showToast('⌖ Đã đưa bảng bài học về vị trí chuẩn');
    if (typeof AudioEngine !== 'undefined' && AudioEngine.click) AudioEngine.click();
}

function toggleMinimizeLessonPanel(forceState) {
    const windowEl = document.getElementById('lesson-window');
    const minIcon = document.getElementById('lw-min-icon');
    const minBtn = document.getElementById('lw-btn-min');
    if (!windowEl) return;

    const shouldMinimize = typeof forceState === 'boolean' ? forceState : !lessonWindowState.isMinimized;
    lessonWindowState.isMinimized = shouldMinimize;

    if (shouldMinimize) {
        windowEl.classList.add('lesson-window-minimized');
        if (minIcon) {
            minIcon.className = 'ph-bold ph-corners-out text-[11px]';
        }
        if (minBtn) {
            minBtn.title = 'Mở rộng bảng bài học (□)';
            minBtn.setAttribute('aria-label', 'Mở rộng');
        }
        showToast('Đã thu nhỏ bảng bài học');
    } else {
        windowEl.classList.remove('lesson-window-minimized');
        if (minIcon) {
            minIcon.className = 'ph-bold ph-minus text-[11px]';
        }
        if (minBtn) {
            minBtn.title = 'Thu nhỏ bảng bài học (—)';
            minBtn.setAttribute('aria-label', 'Thu nhỏ');
        }
        renderGuidedCard();
    }

    ensurePanelInViewport();
    saveLessonWindowState();
    if (typeof AudioEngine !== 'undefined' && AudioEngine.click) AudioEngine.click();
}

function closeLessonPanel() {
    const windowEl = document.getElementById('lesson-window');
    const floatingFab = document.getElementById('lesson-floating-fab');
    if (windowEl) {
        windowEl.classList.add('hidden');
    }
    if (floatingFab) {
        floatingFab.classList.remove('hidden');
        const tag = document.getElementById('fab-step-tag');
        if (tag) tag.innerText = `${appState.step || 1}/4`;
    }
    lessonWindowState.isClosed = true;
    saveLessonWindowState();
    showToast('Đã ẩn bảng bài học. Nhấn "📘 Mở Bài Học" để xem lại.');
    if (typeof AudioEngine !== 'undefined' && AudioEngine.click) AudioEngine.click();
}

function restoreLessonPanel() {
    const windowEl = document.getElementById('lesson-window');
    const floatingFab = document.getElementById('lesson-floating-fab');
    if (windowEl) {
        windowEl.classList.remove('hidden');
    }
    if (floatingFab) {
        floatingFab.classList.add('hidden');
    }
    lessonWindowState.isClosed = false;

    if (lessonWindowState.isMinimized) {
        toggleMinimizeLessonPanel(false);
    } else {
        renderGuidedCard();
    }
    updateLessonDockUI();
    saveLessonWindowState();
    if (typeof AudioEngine !== 'undefined' && AudioEngine.click) AudioEngine.click();
}

function togglePinLessonPanel(forceState) {
    const windowEl = document.getElementById('lesson-window');
    const pinBtn = document.getElementById('lw-btn-pin');
    if (!windowEl) return;

    const shouldPin = typeof forceState === 'boolean' ? forceState : !lessonWindowState.isPinned;
    lessonWindowState.isPinned = shouldPin;

    if (shouldPin) {
        windowEl.classList.add('lesson-window-pinned');
        if (pinBtn) {
            pinBtn.classList.add('bg-amber-500/20', 'text-amber-400', 'border-amber-400/50');
            pinBtn.title = 'Bỏ ghim (Kéo thả tự do)';
        }
        // Auto-collapse right sidebar to prevent overlapping when pinned
        const rightSidebar = document.getElementById('sidebar-right');
        if (rightSidebar && !rightSidebar.classList.contains('hidden') && typeof toggleSidebar === 'function') {
            toggleSidebar('right', false);
        }
        showToast('📌 Đã ghim bảng vào cạnh phải');
    } else {
        windowEl.classList.remove('lesson-window-pinned');
        if (pinBtn) {
            pinBtn.classList.remove('bg-amber-500/20', 'text-amber-400', 'border-amber-400/50');
            pinBtn.title = 'Ghim bảng vào cạnh phải (Dock)';
        }
        applyLessonWindowTransform(windowEl, lessonWindowState.x, lessonWindowState.y);
        showToast('Đã chuyển sang chế độ kéo thả tự do');
    }
    saveLessonWindowState();
    if (typeof AudioEngine !== 'undefined' && AudioEngine.click) AudioEngine.click();
}

function ensurePanelInViewport() {
    const windowEl = document.getElementById('lesson-window');
    if (!windowEl || lessonWindowState.isPinned || lessonWindowState.isClosed) return;

    const rect = windowEl.getBoundingClientRect();
    const minX = 8;
    const maxX = Math.max(minX, window.innerWidth - rect.width - 8);
    const minY = 56;
    const maxY = Math.max(minY, window.innerHeight - 44 - 8);

    lessonWindowState.x = Math.min(Math.max(minX, lessonWindowState.x), maxX);
    lessonWindowState.y = Math.min(Math.max(minY, lessonWindowState.y), maxY);
    applyLessonWindowTransform(windowEl, lessonWindowState.x, lessonWindowState.y);
}

function saveLessonWindowState() {
    try {
        localStorage.setItem('k2_math_lesson_window_v2', JSON.stringify({
            x: lessonWindowState.x,
            y: lessonWindowState.y,
            isMinimized: lessonWindowState.isMinimized,
            isPinned: lessonWindowState.isPinned,
            isClosed: lessonWindowState.isClosed,
            hasCustomPosition: lessonWindowState.hasCustomPosition
        }));
    } catch(e) {}
}

function loadLessonWindowState() {
    try {
        const raw = localStorage.getItem('k2_math_lesson_window_v2');
        if (raw) {
            const data = JSON.parse(raw);
            if (typeof data.x === 'number') lessonWindowState.x = data.x;
            if (typeof data.y === 'number') lessonWindowState.y = data.y;
            if (typeof data.isMinimized === 'boolean') lessonWindowState.isMinimized = data.isMinimized;
            // Always default isPinned to false so user is never stuck in pinned mode
            lessonWindowState.isPinned = false;
            if (typeof data.isClosed === 'boolean') lessonWindowState.isClosed = data.isClosed;
            if (typeof data.hasCustomPosition === 'boolean') lessonWindowState.hasCustomPosition = data.hasCustomPosition;
        }
    } catch(e) {}
}

function restoreLessonWindowPosition() {
    const windowEl = document.getElementById('lesson-window');
    const floatingFab = document.getElementById('lesson-floating-fab');
    if (!windowEl) return;

    if (lessonWindowState.isClosed) {
        windowEl.classList.add('hidden');
        if (floatingFab) floatingFab.classList.remove('hidden');
    } else {
        windowEl.classList.remove('hidden');
        if (floatingFab) floatingFab.classList.add('hidden');
    }

    if (lessonWindowState.isPinned) {
        togglePinLessonPanel(true);
    } else if (lessonWindowState.hasCustomPosition) {
        ensurePanelInViewport();
        applyLessonWindowTransform(windowEl, lessonWindowState.x, lessonWindowState.y);
    } else {
        resetPanelPosition(false);
    }

    if (lessonWindowState.isMinimized) {
        toggleMinimizeLessonPanel(true);
    }
}

function syncStateToUI() {
    const sr = document.getElementById('slider-r');
    if (sr) sr.value = appState.r;
    const sh = document.getElementById('slider-h');
    if (sh) sh.value = appState.h;
    const selUnit = document.getElementById('unit-select');
    if (selUnit) selUnit.value = appState.unit;
    const soundBtn = document.getElementById('setting-sound-btn');
    if (soundBtn) soundBtn.innerText = appState.soundEnabled ? 'Bật' : 'Tắt';
    const motionBtn = document.getElementById('setting-reduced-motion-btn');
    if (motionBtn) motionBtn.innerText = appState.reduceMotion ? 'Bật' : 'Tắt';
    const qualityBtn = document.getElementById('setting-quality-btn');
    if (qualityBtn && renderer) {
        qualityBtn.innerText = renderer.getPixelRatio() > 1.2 ? 'Cao' : 'Chuẩn';
    }
    const gridBtn = document.getElementById('setting-grid-btn');
    if (gridBtn) gridBtn.innerText = appState.gridVisible ? 'Bật' : 'Tắt';
    const labelsBtn = document.getElementById('setting-labels-btn');
    if (labelsBtn) labelsBtn.innerText = appState.labelsVisible ? 'Bật' : 'Tắt';
}

function toggleGuidedCard(forceOpen) {
    if (forceOpen === true || lessonWindowState.isClosed) {
        restoreLessonPanel();
    } else if (lessonWindowState.isMinimized) {
        toggleMinimizeLessonPanel(false);
    } else {
        toggleMinimizeLessonPanel(true);
    }
}

function setLessonDockState(state) {
    if (state === 'expanded') {
        restoreLessonPanel();
    } else if (state === 'collapsed') {
        toggleMinimizeLessonPanel(true);
    } else if (state === 'closed') {
        closeLessonPanel();
    }
}

function updateLessonDockUI() {
    const curStageNum = lessonState.currentStageIndex || 1;
    const curStepNum = lessonState.currentStepIndex || 1;
    const curStage = LESSON_STAGES.find(s => s.num === curStageNum) || LESSON_STAGES[0];
    const stageBadge = document.getElementById('lw-stage-badge');
    const stageSubtitle = document.getElementById('lw-stage-subtitle');
    const fabStepTag = document.getElementById('fab-step-tag');
    const maxSteps = getLastStepOfStage(curStageNum);

    if (stageBadge) {
        stageBadge.innerText = `📘 Chặng ${curStageNum} · Bước ${curStepNum}/${maxSteps}`;
    }
    if (stageSubtitle) {
        stageSubtitle.innerText = `${curStage.title} – ${getStepSummary(curStageNum, curStepNum)}`;
    }
    if (fabStepTag) {
        fabStepTag.innerText = `${curStepNum}/${maxSteps}`;
    }

    // Render interactive clickable step pills (Requirement 4.4)
    const pillsContainer = document.getElementById('lw-step-pills');
    if (pillsContainer) {
        let pillsHtml = '';
        for (let i = 1; i <= maxSteps; i++) {
            const isCur = (i === curStepNum);
            const isDone = isStepCompleted(curStageNum, i);
            const hasAns = !!getStepAnswer(curStageNum, i);

            let pillClass = '';
            let pillContent = i;

            if (isCur) {
                pillClass = 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-400/50 shadow-md';
                pillContent = isDone ? '✓' : i;
            } else if (isDone) {
                pillClass = 'bg-emerald-700 hover:bg-emerald-600 text-white font-bold';
                pillContent = '✓';
            } else if (hasAns) {
                pillClass = 'bg-sky-800 hover:bg-sky-700 text-cyan-200 font-bold';
                pillContent = i;
            } else {
                pillClass = 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-bold';
                pillContent = i;
            }

            pillsHtml += `
                <button onclick="setGuidedStep(${i})" class="w-6 h-6 rounded-lg ${pillClass} text-[10px] flex items-center justify-center transition-all cursor-pointer shrink-0" title="Bước ${i}: ${getStepSummary(curStageNum, i)}" aria-label="Nhảy tới bước ${i}">
                    ${pillContent}
                </button>
            `;
        }
        pillsContainer.innerHTML = pillsHtml;
    }

    // Header & Sub-bar arrow buttons reflecting state (Requirements 4.1 & 4.2)
    const isFirst = (curStageNum === 1 && curStepNum === 1);
    const isLast = (curStageNum === 7 && curStepNum >= maxSteps);

    const prevBtns = [document.getElementById('lw-btn-prev'), document.getElementById('lw-sub-prev-btn')];
    prevBtns.forEach(btn => {
        if (!btn) return;
        btn.disabled = isFirst;
        btn.classList.toggle('opacity-30', isFirst);
        btn.classList.toggle('cursor-not-allowed', isFirst);
        btn.title = isFirst ? 'Đang ở bước đầu tiên' : (curStepNum === 1 ? `Quay lại Chặng ${curStageNum - 1}` : `Quay lại Bước ${curStepNum - 1}`);
    });

    const nextBtns = [document.getElementById('lw-btn-next'), document.getElementById('lw-sub-next-btn')];
    nextBtns.forEach(btn => {
        if (!btn) return;
        btn.disabled = isLast;
        btn.classList.toggle('opacity-30', isLast);
        btn.classList.toggle('cursor-not-allowed', isLast);
        btn.title = isLast ? 'Đã hoàn thành toàn bộ bài học' : 'Sang bước tiếp theo';
    });

    renderLessonStageDropdown();
}

function getStepSummary(stage, step) {
    const summaries = {
        1: ['Quan sát đại lượng r, h, l', 'Kéo thanh trượt r & h', 'Tam giác vuông SOB & Pythagore', 'Ghi nhớ công thức'],
        2: ['Dự đoán khối quay', 'Quay tam giác vuông 360°', 'Trục và đường sinh nón', 'Quay hình chữ nhật tạo trụ'],
        3: ['Dự đoán hình khai triển', 'Trải phẳng mặt nón & quạt tròn', 'Bán kính quạt là đường sinh l', 'Độ dài cung quạt = 2πr'],
        4: ['Diện tích xung quanh Sxq', 'Diện tích đáy Sđáy', 'Diện tích toàn phần Stp', 'So sánh nón và trụ'],
        5: ['Dự đoán số lần đổ nước', 'Đổ nước lần 1 (1/3)', 'Đổ nước lần 2 (2/3)', 'Đổ nước lần 3 & Suy luận Vnón'],
        6: ['Cắt ngang song song đáy', 'Cắt qua trục & tam giác cân', 'Cắt xiên tạo đường Elip', 'Tổng kết các dạng thiết diện'],
        7: ['Thử thách tính nhanh', 'Bài toán thực tế', 'Lắp ghép công thức', 'Hoàn thành tiết học']
    };
    return (summaries[stage] && summaries[stage][(step || 1) - 1]) || 'Khám phá & Thao tác';
}

function setGuidedStep(s) {
    lessonState.currentStepIndex = Math.max(1, Math.min(getLastStepOfStage(lessonState.currentStageIndex), s));
    enterLessonStep(lessonState.currentStageIndex, lessonState.currentStepIndex);
    AudioEngine.step();
    updateGuidedUI();
    saveLessonState();
}

function makePrediction(stageKey, val) {
    appState.predictions[stageKey] = val;
    saveStepAnswer(lessonState.currentStageIndex, lessonState.currentStepIndex, {
        value: val,
        isCorrect: true,
        text: val
    });
    markStepCompleted(lessonState.currentStageIndex, lessonState.currentStepIndex, true);
    AudioEngine.click();
    showToast(`Đã lưu dự đoán: ${val}. Hãy tiến hành thực nghiệm để kiểm chứng!`);
    if (typeof VoiceNarrator !== 'undefined' && appState.voiceEnabled) {
        VoiceNarrator.speak(`Đã ghi nhận dự đoán của em là ${val}. Bây giờ chúng ta hãy cùng tiến hành thực nghiệm để kiểm chứng nhé!`);
    }
    renderGuidedCard();
}

// Interactive Feedback Helper with 3-tier hints & persistent answer state (Requirements 4.5 & 4.6)
function handleAnswerEvaluation(isCorrect, btnElem, feedbackElemId, hint1, hint2, explanation, answerVal) {
    const curStage = lessonState.currentStageIndex;
    const curStep = lessonState.currentStepIndex;
    const fb = document.getElementById(feedbackElemId);

    // Save answer in state
    saveStepAnswer(curStage, curStep, {
        value: answerVal,
        isCorrect: isCorrect,
        explanation: explanation || '',
        hint1: hint1 || '',
        hint2: hint2 || ''
    });

    if (isCorrect) {
        if (typeof AudioEngine !== 'undefined' && AudioEngine.success) {
            AudioEngine.success();
        }
        markStepCompleted(curStage, curStep, false);
        if (curStage === 1 && typeof updateStructureConeGeometry === 'function') {
            updateStructureConeGeometry(curStep);
        }
        if (fb) {
            fb.className = 'p-2 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-bold space-y-1';
            fb.innerHTML = `
                <div class="flex items-center justify-between">
                    <span>🎉 <b>Chính xác!</b> ${explanation || ''}</span>
                    <button onclick="resetStepAnswer(${curStage}, ${curStep})" class="text-[10px] text-amber-300 hover:underline ml-2">✎ Thử lại</button>
                </div>
            `;
            fb.classList.remove('hidden');
        }
        if (btnElem) {
            btnElem.className = 'p-2 rounded-xl bg-emerald-600 text-white font-black text-left border border-emerald-400';
        }
        if (typeof VoiceNarrator !== 'undefined' && appState.voiceEnabled) {
            VoiceNarrator.speak('Chính xác! ' + (explanation || 'Em đã trả lời đúng.'));
        }
    } else {
        AudioEngine.wrong();
        const attemptsKey = `s${curStage}_step${curStep}`;
        lessonState.attempts[attemptsKey] = (lessonState.attempts[attemptsKey] || 0) + 1;
        const attempts = lessonState.attempts[attemptsKey];

        if (fb) {
            fb.className = 'p-2 rounded-xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs font-semibold space-y-1';
            if (attempts === 1) {
                fb.innerHTML = `<div>⚠️ <b>Chưa đúng:</b> Em hãy quan sát kỹ mô hình 3D và thử lại nhé!</div>`;
            } else if (attempts === 2) {
                fb.innerHTML = `
                    <div>💡 <b>Gợi ý:</b> ${hint1 || 'Chú ý các cạnh của tam giác vuông trong không gian.'}</div>
                    ${hint2 ? `<div class="text-[11px] text-cyan-300 font-mono">🔍 ${hint2}</div>` : ''}
                `;
                setSpotlight('lateral');
            } else {
                fb.innerHTML = `<div>💡 <b>Gợi ý đầy đủ:</b> ${explanation || 'Dựa vào công thức và tính chất hình học.'}</div>`;
            }
            fb.classList.remove('hidden');
        }
        if (btnElem) {
            btnElem.className = 'p-2 rounded-xl bg-amber-900/60 text-amber-200 font-bold text-left border border-amber-500/50';
        }
        if (typeof VoiceNarrator !== 'undefined' && appState.voiceEnabled) {
            if (attempts === 1) {
                VoiceNarrator.speak('Chưa đúng, em hãy quan sát kỹ mô hình 3 chiều và thử lại nhé!');
            } else if (attempts === 2) {
                VoiceNarrator.speak('Gợi ý cho em: ' + (hint1 || 'Em hãy chú ý các cạnh của hình.'));
            } else {
                VoiceNarrator.speak('Gợi ý đầy đủ: ' + (explanation || 'Em hãy dựa vào công thức đã học.'));
            }
        }
    }

    updateLessonDockUI();
}

// Master Guided Card Render per 7 Stages (State-Preserving, Non-destructive)
function renderGuidedCard() {
    const card = document.getElementById('guided-discovery-card');
    if (!card) return;

    const r = appState.r;
    const h = appState.h;
    const l = appState.l;
    const u = appState.unit;
    const stage = lessonState.currentStageIndex || 1;
    const step = lessonState.currentStepIndex || 1;
    const prevAns = getStepAnswer(stage, step);
    const isStepDone = isStepCompleted(stage, step);

    // STAGE 1: CẤU TẠO & ĐỊNH LÝ PYTHAGORE
    if (stage === 1) {
        if (step === 1) {
            card.innerHTML = `
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
                    <div class="flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">1</span>
                        <h3 class="text-xs font-black uppercase text-amber-300">Quan Sát Hình Nón 3D</h3>
                    </div>
                    ${isStepDone ? '<span class="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">✓ ĐÃ HOÀN THÀNH</span>' : '<span class="text-[10px] font-mono text-slate-400">Bước 1 / 4</span>'}
                </div>
                <div class="pt-2 space-y-2 text-xs">
                    <p class="text-slate-200 leading-relaxed">
                        Quan sát khối hình nón trên bệ xoay 3D. Em nhìn thấy những yếu tố kích thước nào?
                    </p>
                    <div class="grid grid-cols-3 gap-1.5 text-center font-mono">
                        <div class="p-1.5 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300">
                            <span class="text-[9px] block text-slate-400">Bán kính đáy</span>
                            <b class="text-xs">r = ${r.toFixed(1)} ${u}</b>
                        </div>
                        <div class="p-1.5 rounded-xl bg-slate-900 border border-sky-500/40 text-sky-300">
                            <span class="text-[9px] block text-slate-400">Chiều cao</span>
                            <b class="text-xs">h = ${h.toFixed(1)} ${u}</b>
                        </div>
                        <div class="p-1.5 rounded-xl bg-slate-900 border border-pink-500/40 text-pink-300">
                            <span class="text-[9px] block text-slate-400">Đường sinh</span>
                            <b class="text-xs">l = ${l.toFixed(2)} ${u}</b>
                        </div>
                    </div>
                    <div class="flex items-center justify-between pt-1">
                        <button onclick="start3DClickQuiz('slant')" class="px-2.5 py-1 rounded-xl bg-purple-950 border border-purple-500/40 hover:bg-purple-900 text-purple-300 font-bold text-[11px] flex items-center gap-1">
                            <i class="ph-bold ph-cursor-click"></i><span>🎯 Thử bấm trên 3D</span>
                        </button>
                        <button onclick="goToNextStep()" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow active:scale-95">
                            Kéo Thử Slider r và h →
                        </button>
                    </div>
                </div>
            `;
        } else if (step === 2) {
            const isA = prevAns && prevAns.value === 'A';
            const isB = prevAns && prevAns.value === 'B';
            card.innerHTML = `
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
                    <div class="flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">2</span>
                        <h3 class="text-xs font-black uppercase text-amber-300">Thao Tác Kéo Slider r và h</h3>
                    </div>
                    ${isStepDone ? '<span class="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">✓ ĐÃ HOÀN THÀNH</span>' : '<span class="text-[10px] font-mono text-slate-400">Bước 2 / 4</span>'}
                </div>
                <div class="pt-2 space-y-2 text-xs">
                    <p class="text-slate-200">
                        Kéo thanh trượt bán kính <b class="text-amber-300 font-mono">r</b> hoặc chiều cao <b class="text-sky-300 font-mono">h</b> ở bảng bên trái.
                    </p>
                    <div class="p-2 rounded-xl bg-slate-900/70 border border-cyan-500/30 text-cyan-200">
                        🤔 <b>Câu hỏi:</b> Khi bán kính <b class="text-amber-300">r</b> hoặc chiều cao <b class="text-sky-300">h</b> tăng lên, độ dài đường sinh <b class="text-pink-300">l</b> thay đổi như thế nào?
                    </div>
                    <div class="grid grid-cols-2 gap-1.5">
                        <button onclick="handleAnswerEvaluation(true, this, 'stg1-fb', 'Quan sát cạnh huyền tam giác vuông.', '', 'Chính xác! Vì l là cạnh huyền tam giác vuông SOB có hai cạnh góc vuông là r và h, khi r hoặc h tăng thì l luôn tăng.', 'A')" class="p-2 rounded-xl text-left font-bold border transition-all ${
                            isA ? 'bg-emerald-600 text-white font-black border-emerald-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }">
                            A. Đường sinh l tăng lên
                        </button>
                        <button onclick="handleAnswerEvaluation(false, this, 'stg1-fb', 'Nhìn vào số đo l bên bảng khi kéo r.', '', 'Chưa đúng, đường sinh thay đổi theo r và h.', 'B')" class="p-2 rounded-xl text-left font-bold border transition-all ${
                            isB ? 'bg-amber-900/60 text-amber-200 border-amber-500/50' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }">
                            B. Đường sinh l không đổi
                        </button>
                    </div>
                    <div id="stg1-fb" class="${prevAns ? '' : 'hidden'} p-2 rounded-xl ${prevAns?.isCorrect ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300' : 'bg-amber-950/70 border border-amber-500/50 text-amber-200'} text-xs font-semibold">
                        ${prevAns ? `
                            <div class="flex items-center justify-between">
                                <span>${prevAns.isCorrect ? '🎉 <b>Chính xác!</b> ' : '⚠️ '}${prevAns.explanation}</span>
                                <button onclick="resetStepAnswer(1, 2)" class="text-[10px] text-amber-300 hover:underline ml-2">✎ Thử lại</button>
                            </div>
                        ` : ''}
                    </div>
                    <div class="flex items-center justify-between pt-1">
                        <button onclick="goToPreviousStep()" class="text-slate-400 hover:text-white flex items-center gap-1 font-bold">
                            <span>←</span> <span>Bước trước</span>
                        </button>
                        <button onclick="goToNextStep()" class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow active:scale-95">
                            Khám Phá Tam Giác Vuông SOB →
                        </button>
                    </div>
                </div>
            `;
        } else if (step === 3) {
            const isA = prevAns && prevAns.value === 'A';
            const isB = prevAns && prevAns.value === 'B';
            card.innerHTML = `
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
                    <div class="flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">3</span>
                        <h3 class="text-xs font-black uppercase text-amber-300">Tam Giác Vuông SOB & Định Lý Pythagore</h3>
                    </div>
                    ${isStepDone ? '<span class="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">✓ ĐÃ HOÀN THÀNH</span>' : '<span class="text-[10px] font-mono text-slate-400">Bước 3 / 4</span>'}
                </div>
                <div class="pt-2 space-y-2 text-xs">
                    <p class="text-slate-200">
                        Xét mặt cắt qua trục của nón: đỉnh <b class="text-white">S</b>, tâm đáy <b class="text-white">O</b>, điểm <b class="text-white">B</b> trên đường tròn đáy.
                    </p>
                    <div class="p-2.5 rounded-xl bg-slate-900 border border-amber-500/40 font-mono space-y-1 text-center">
                        <div class="text-[11px] text-slate-300">Tam giác SOB vuông tại <b class="text-amber-400">O</b>:</div>
                        <div class="text-cyan-300">SO = h (chiều cao) | OB = r (bán kính đáy) | SB = l (đường sinh)</div>
                    </div>
                    <div class="p-2 rounded-xl bg-slate-900/60 border border-slate-700 text-slate-300">
                        Theo Định lý Pythagore trong tam giác vuông SOB, hệ thức nào sau đây đúng?
                    </div>
                    <div class="grid grid-cols-2 gap-1.5">
                        <button onclick="handleAnswerEvaluation(true, this, 'stg1-step3-fb', '', '', 'Xuất sắc! l² = r² + h² ⇒ l = √(r² + h²). Định lý đã được lưu vào Nhật Ký!', 'A'); unlockDiscovery('pythagoras');" class="p-2 rounded-xl border text-left font-bold transition-all ${
                            isA ? 'bg-emerald-600 text-white font-black border-emerald-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }">
                            A. l² = r² + h²
                        </button>
                        <button onclick="handleAnswerEvaluation(false, this, 'stg1-step3-fb', 'Cạnh huyền là SB = l.', '', 'Chưa đúng, l là cạnh huyền nên l² = r² + h².', 'B')" class="p-2 rounded-xl border text-left font-bold transition-all ${
                            isB ? 'bg-amber-900/60 text-amber-200 border-amber-500/50' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }">
                            B. h² = l² + r²
                        </button>
                    </div>
                    <div id="stg1-step3-fb" class="${prevAns ? '' : 'hidden'} p-2 rounded-xl ${prevAns?.isCorrect ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300' : 'bg-amber-950/70 border border-amber-500/50 text-amber-200'} text-xs font-semibold">
                        ${prevAns ? `
                            <div class="flex items-center justify-between">
                                <span>${prevAns.isCorrect ? '🎉 <b>Chính xác!</b> ' : '⚠️ '}${prevAns.explanation}</span>
                                <button onclick="resetStepAnswer(1, 3)" class="text-[10px] text-amber-300 hover:underline ml-2">✎ Thử lại</button>
                            </div>
                        ` : ''}
                    </div>
                    <div class="flex items-center justify-between pt-1">
                        <button onclick="goToPreviousStep()" class="text-slate-400 hover:text-white flex items-center gap-1 font-bold">
                            <span>←</span> <span>Bước trước</span>
                        </button>
                        <button onclick="goToNextStep()" class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow active:scale-95">
                            Xác Nhận & Sang Chặng 2 →
                        </button>
                    </div>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
                    <div class="flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">✓</span>
                        <h3 class="text-xs font-black uppercase text-emerald-300">Hoàn Thành Chặng 1: Cấu Tạo Nón</h3>
                    </div>
                    <span class="text-[10px] font-bold text-emerald-400">✓ ĐÃ HOÀN THÀNH</span>
                </div>
                <div class="pt-2 space-y-2 text-xs">
                    <p class="text-slate-200">
                        Chúc mừng em đã nắm vững cấu tạo và hệ thức Pythagore: <b class="text-amber-300 font-mono">l = √(r² + h²)</b>.
                    </p>
                    <div class="flex items-center justify-between pt-1">
                        <button onclick="goToPreviousStep()" class="text-slate-400 hover:text-white flex items-center gap-1 font-bold">
                            <span>←</span> <span>Bước trước</span>
                        </button>
                        <button onclick="goToNextStep()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-lg active:scale-95">
                            Sang Chặng 2: Quay Tạo Khối →
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // STAGE 2: QUAY TẠO KHỐI KHÔNG GIAN
    else if (stage === 2) {
        const pred = prevAns ? prevAns.value : appState.predictions['stg2_rev'];
        if (step === 1) {
            card.innerHTML = `
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
                    <div class="flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">2</span>
                        <h3 class="text-xs font-black uppercase text-cyan-300">Dự Đoán Trước Khi Quay</h3>
                    </div>
                    ${isStepDone ? '<span class="text-[10px] font-bold text-emerald-400">✓ ĐÃ HOÀN THÀNH</span>' : '<span class="text-[10px] font-mono text-slate-400">Bước 1 / 3</span>'}
                </div>
                <div class="pt-2 space-y-2 text-xs">
                    <p class="text-slate-200">
                        Quan sát tam giác vuông SOB (với trục thẳng đứng SO, bán kính nằm ngang OB).
                    </p>
                    <div class="p-2 rounded-xl bg-slate-900/80 border border-cyan-500/40 text-cyan-200">
                        🤔 <b>Dự đoán:</b> Khi quay tam giác vuông SOB đúng 360° quanh trục SO cố định, hình phẳng này sẽ quét nên khối hình học nào?
                    </div>
                    <div class="grid grid-cols-2 gap-1.5">
                        <button onclick="makePrediction('stg2_rev', 'Hình Nón')" class="p-2 rounded-xl text-left border ${pred === 'Hình Nón' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-200 border-slate-700 font-bold'}">
                            A. Hình Nón
                        </button>
                        <button onclick="makePrediction('stg2_rev', 'Hình Trụ')" class="p-2 rounded-xl text-left border ${pred === 'Hình Trụ' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-200 border-slate-700 font-bold'}">
                            B. Hình Trụ
                        </button>
                    </div>
                    <div class="flex items-center justify-between pt-1">
                        <button onclick="goToPreviousStep()" class="text-slate-400 hover:text-white flex items-center gap-1 font-bold">
                            <span>←</span> <span>Chặng 1 (bước cuối)</span>
                        </button>
                        <button onclick="goToNextStep()" class="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs shadow active:scale-95">
                            Kéo Thử Góc Quay →
                        </button>
                    </div>
                </div>
            `;
        } else if (step === 2) {
            card.innerHTML = `
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
                    <div class="flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">2</span>
                        <h3 class="text-xs font-black uppercase text-cyan-300">Thao Tác Quay 360° Trực Quan</h3>
                    </div>
                    ${isStepDone ? '<span class="text-[10px] font-bold text-emerald-400">✓ ĐÃ HOÀN THÀNH</span>' : '<span class="text-[10px] font-mono text-slate-400">Bước 2 / 3</span>'}
                </div>
                <div class="pt-2 space-y-2 text-xs">
                    <p class="text-slate-200">
                        Bấm nút <b class="text-amber-300">▶ Quay</b> hoặc kéo thanh trượt góc quay từ 0° lên 360° để xem tam giác quay quanh trục SO:
                    </p>
                    <div class="flex items-center justify-center gap-2 p-2 bg-slate-900 rounded-xl">
                        <button onclick="playRevolution()" class="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1">
                            <i class="ph-fill ph-play"></i><span>▶ Quay Ngay</span>
                        </button>
                        <button onclick="jumpRevolutionAngle(180)" class="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700">
                            180°
                        </button>
                        <button onclick="jumpRevolutionAngle(360)" class="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700">
                            360°
                        </button>
                    </div>
                    <div class="flex items-center justify-between pt-1">
                        <button onclick="goToPreviousStep()" class="text-slate-400 hover:text-white flex items-center gap-1 font-bold">
                            <span>←</span> <span>Bước trước</span>
                        </button>
                        <button onclick="unlockDiscovery('rev_cone'); goToNextStep();" class="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow active:scale-95">
                            Rút Ra Kết Luận →
                        </button>
                    </div>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
                    <div class="flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">✓</span>
                        <h3 class="text-xs font-black uppercase text-emerald-300">Kết Luận: Quay Tạo Khối</h3>
                    </div>
                    <span class="text-[10px] font-bold text-emerald-400">✓ ĐÃ HOÀN THÀNH</span>
                </div>
                <div class="pt-2 space-y-2 text-xs">
                    <p class="text-slate-200">
                        ${pred === 'Hình Nón' ? '🌟 <b>Dự đoán của em hoàn toàn chính xác!</b>' : '💡 Thực nghiệm cho thấy tam giác vuông quay quanh SO tạo thành <b>Hình Nón</b>!'}
                    </p>
                    <div class="p-2 rounded-xl bg-slate-900 text-slate-300 font-mono text-[11px] space-y-1">
                        <div>• SO: Trục quay cố định (chiều cao nón h)</div>
                        <div>• OB: Quét nên đường tròn đáy bán kính r</div>
                        <div>• SB: Quét nên toàn bộ mặt xung quanh nón</div>
                    </div>
                    <div class="flex items-center justify-between pt-1">
                        <button onclick="goToPreviousStep()" class="text-slate-400 hover:text-white flex items-center gap-1 font-bold">
                            <span>←</span> <span>Bước trước</span>
                        </button>
                        <button onclick="goToNextStep()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-lg active:scale-95">
                            Sang Chặng 3: Khai Triển Phẳng →
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // STAGE 3: KHAI TRIỂN PHẲNG & CUNG QUẠT
    else if (stage === 3) {
        const pred = prevAns ? prevAns.value : appState.predictions['stg3_net'];
        if (step === 1) {
            card.innerHTML = `
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
                    <div class="flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-md bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-xs">3</span>
                        <h3 class="text-xs font-black uppercase text-pink-300">Dự Đoán Mặt Xung Quanh Trải Phẳng</h3>
                    </div>
                    ${isStepDone ? '<span class="text-[10px] font-bold text-emerald-400">✓ ĐÃ HOÀN THÀNH</span>' : '<span class="text-[10px] font-mono text-slate-400">Bước 1 / 3</span>'}
                </div>
                <div class="pt-2 space-y-2 text-xs">
                    <p class="text-slate-200">
                        Cắt theo một đường sinh SB của hình nón và trải phẳng toàn bộ mặt nón lên mặt phẳng.
                    </p>
                    <div class="p-2 rounded-xl bg-slate-900/80 border border-pink-500/40 text-pink-200">
                        🤔 <b>Dự đoán:</b> Mặt xung quanh của hình nón khi trải phẳng ra sẽ là hình gì?
                    </div>
                    <div class="grid grid-cols-2 gap-1.5">
                        <button onclick="makePrediction('stg3_net', 'Hình quạt tròn')" class="p-2 rounded-xl text-left border ${pred === 'Hình quạt tròn' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-200 border-slate-700 font-bold'}">
                            A. Hình quạt tròn
                        </button>
                        <button onclick="makePrediction('stg3_net', 'Hình tam giác')" class="p-2 rounded-xl text-left border ${pred === 'Hình tam giác' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-200 border-slate-700 font-bold'}">
                            B. Hình tam giác
                        </button>
                    </div>
                    <div class="flex items-center justify-between pt-1">
                        <button onclick="goToPreviousStep()" class="text-slate-400 hover:text-white flex items-center gap-1 font-bold">
                            <span>←</span> <span>Chặng 2</span>
                        </button>
                        <button onclick="goToNextStep()" class="px-3 py-1.5 rounded-xl bg-pink-500 text-white font-black text-xs shadow active:scale-95">
                            Kéo Mở Khai Triển →
                        </button>
                    </div>
                </div>
            `;
        } else if (step === 2) {
            card.innerHTML = `
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
                    <div class="flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-md bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-xs">3</span>
                        <h3 class="text-xs font-black uppercase text-pink-300">Thao Tác Trải Phẳng (Unfold)</h3>
                    </div>
                    ${isStepDone ? '<span class="text-[10px] font-bold text-emerald-400">✓ ĐÃ HOÀN THÀNH</span>' : '<span class="text-[10px] font-mono text-slate-400">Bước 2 / 3</span>'}
                </div>
                <div class="pt-2 space-y-2 text-xs">
                    <p class="text-slate-200">
                        Kéo thanh trượt khai triển hoặc bấm nút <b class="text-amber-300">Tách Mở</b> để theo dõi quá trình biến đổi liên tục từ 3D sang 2D:
                    </p>
                    <div class="flex items-center justify-center gap-2 p-2 bg-slate-900 rounded-xl">
                        <button onclick="playUnfoldAuto()" class="px-4 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-xs flex items-center gap-1">
                            <i class="ph-bold ph-scissors"></i><span>Khai Triển Tự Động</span>
                        </button>
                        <button onclick="resetUnfold()" class="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700">
                            Đóng lại 3D
                        </button>
                    </div>
                    <div class="flex items-center justify-between pt-1">
                        <button onclick="goToPreviousStep()" class="text-slate-400 hover:text-white flex items-center gap-1 font-bold">
                            <span>←</span> <span>Bước trước</span>
                        </button>
                        <button onclick="unlockDiscovery('net_arc'); unlockDiscovery('net_radius'); goToNextStep();" class="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow active:scale-95">
                            Xem Mối Quan Hệ Cung Quạt →
                        </button>
                    </div>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
                    <div class="flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">✓</span>
                        <h3 class="text-xs font-black uppercase text-emerald-300">Phát Hiện Quan Trọng</h3>
                    </div>
                    <span class="text-[10px] font-bold text-emerald-400">✓ ĐÃ HOÀN THÀNH</span>
                </div>
                <div class="pt-2 space-y-2 text-xs">
                    <p class="text-slate-200">
                        ${pred === 'Hình quạt tròn' ? '🎉 <b>Dự đoán chính xác!</b> Mặt xung quanh là một hình quạt tròn.' : '💡 Mặt xung quanh khai triển là một <b>Hình quạt tròn</b>.'}
                    </p>
                    <div class="p-2.5 rounded-xl bg-slate-900/90 font-mono text-[11px] space-y-1.5 text-center border border-pink-500/40">
                        <div class="text-pink-300 font-bold">Bán kính hình quạt = Đường sinh l = ${l.toFixed(2)} ${u}</div>
                        <div class="text-amber-300 font-bold">Độ dài cung quạt = Chu vi đáy = 2πr = ${(2 * Math.PI * r).toFixed(2)} ${u}</div>
                    </div>
                    <div class="flex items-center justify-between pt-1">
                        <button onclick="goToPreviousStep()" class="text-slate-400 hover:text-white flex items-center gap-1 font-bold">
                            <span>←</span> <span>Bước trước</span>
                        </button>
                        <button onclick="goToNextStep()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-lg active:scale-95">
                            Sang Chặng 4: Tính Diện Tích →
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // STAGE 4: DIỆN TÍCH XUNG QUANH & TOÀN PHẦN
    else if (stage === 4) {
        const Sxq = MathCore.getConeLateralArea(r, h);
        const Stp = MathCore.getConeTotalArea(r, h);
        if (step === 1) {
            card.innerHTML = `
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
                    <div class="flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">4</span>
                        <h3 class="text-xs font-black uppercase text-amber-300">Hình Thành Công Thức Diện Tích</h3>
                    </div>
                    ${isStepDone ? '<span class="text-[10px] font-bold text-emerald-400">✓ ĐÃ HOÀN THÀNH</span>' : '<span class="text-[10px] font-mono text-slate-400">Bước 1 / 2</span>'}
                </div>
                <div class="pt-2 space-y-2 text-xs">
                    <p class="text-slate-200">
                        Từ hình quạt khai triển có bán kính <b class="text-pink-300">l</b> và độ dài cung <b class="text-cyan-300">2πr</b>:
                    </p>
                    <div class="p-2.5 rounded-xl bg-slate-900 font-mono text-center space-y-1 border border-amber-500/40">
                        <div class="text-[11px] text-slate-300">S<sub>xq</sub> = 1/2 · Cung · R = 1/2 · (2πr) · l</div>
                        <div class="text-sm font-black text-amber-300">⇒ S<sub>xq</sub> = π r l ≈ ${Sxq.toFixed(2)} ${u}²</div>
                        <div class="text-[11px] text-emerald-300 pt-1">S<sub>tp</sub> = S<sub>xq</sub> + S<sub>đáy</sub> = πrl + πr² ≈ ${Stp.toFixed(2)} ${u}²</div>
                    </div>
                    <div class="flex items-center justify-between pt-1">
                        <button onclick="goToPreviousStep()" class="text-slate-400 hover:text-white flex items-center gap-1 font-bold">
                            <span>←</span> <span>Chặng 3</span>
                        </button>
                        <button onclick="unlockDiscovery('area_cone_xq'); unlockDiscovery('area_cyl_xq'); goToNextStep();" class="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow active:scale-95">
                            Luyện Tập Tính Diện Tích →
                        </button>
                    </div>
                </div>
            `;
        } else {
            const isA = prevAns && prevAns.value === 'A';
            const isB = prevAns && prevAns.value === 'B';
            const isC = prevAns && prevAns.value === 'C';
            const isD = prevAns && prevAns.value === 'D';
            card.innerHTML = `
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
                    <div class="flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">4</span>
                        <h3 class="text-xs font-black uppercase text-amber-300">Vận Dụng Tính Diện Tích Nón</h3>
                    </div>
                    ${isStepDone ? '<span class="text-[10px] font-bold text-emerald-400">✓ ĐÃ HOÀN THÀNH</span>' : '<span class="text-[10px] font-mono text-slate-400">Bước 2 / 2</span>'}
                </div>
                <div class="pt-2 space-y-2 text-xs">
                    <div class="p-2 rounded-xl bg-slate-900/70 border border-amber-500/30 text-amber-200">
                        📝 <b>Bài toán nhanh:</b> Cho một hình nón có bán kính đáy <b class="text-amber-300">r = 3 cm</b> và chiều cao <b class="text-sky-300">h = 4 cm</b>. Đường sinh <b class="text-pink-300">l = 5 cm</b>. Diện tích xung quanh <b class="text-amber-300">S<sub>xq</sub></b> của hình nón bằng bao nhiêu?
                    </div>
                    <div class="grid grid-cols-2 gap-1.5">
                        <button onclick="handleAnswerEvaluation(true, this, 'stg4-fb', 'Công thức Sxq = π·r·l', '', 'Chính xác! Sxq = π · 3 · 5 = 15π cm² ≈ 47.12 cm².', 'A')" class="p-2 rounded-xl text-left font-bold border transition-all ${
                            isA ? 'bg-emerald-600 text-white font-black border-emerald-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }">
                            A. 15π cm²
                        </button>
                        <button onclick="handleAnswerEvaluation(false, this, 'stg4-fb', 'Nhớ dùng đường sinh l = 5, không phải chiều cao h = 4.', '', 'Chưa đúng, 12π là lấy r·h, công thức là π·r·l.', 'B')" class="p-2 rounded-xl text-left font-bold border transition-all ${
                            isB ? 'bg-amber-900/60 text-amber-200 border-amber-500/50' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }">
                            B. 12π cm²
                        </button>
                        <button onclick="handleAnswerEvaluation(false, this, 'stg4-fb', 'Công thức là π·r·l.', '', 'Chưa đúng, hãy tính lại π·r·l với r=3, l=5.', 'C')" class="p-2 rounded-xl text-left font-bold border transition-all ${
                            isC ? 'bg-amber-900/60 text-amber-200 border-amber-500/50' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }">
                            C. 20π cm²
                        </button>
                        <button onclick="handleAnswerEvaluation(false, this, 'stg4-fb', 'Công thức là π·r·l.', '', 'Chưa đúng.', 'D')" class="p-2 rounded-xl text-left font-bold border transition-all ${
                            isD ? 'bg-amber-900/60 text-amber-200 border-amber-500/50' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }">
                            D. 24π cm²
                        </button>
                    </div>
                    <div id="stg4-fb" class="${prevAns ? '' : 'hidden'} p-2 rounded-xl ${prevAns?.isCorrect ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300' : 'bg-amber-950/70 border border-amber-500/50 text-amber-200'} text-xs font-semibold">
                        ${prevAns ? `
                            <div class="flex items-center justify-between">
                                <span>${prevAns.isCorrect ? '🎉 <b>Chính xác!</b> ' : '⚠️ '}${prevAns.explanation}</span>
                                <button onclick="resetStepAnswer(4, 2)" class="text-[10px] text-amber-300 hover:underline ml-2">✎ Thử lại</button>
                            </div>
                        ` : ''}
                    </div>
                    <div class="flex items-center justify-between pt-1">
                        <button onclick="goToPreviousStep()" class="text-slate-400 hover:text-white flex items-center gap-1 font-bold">
                            <span>←</span> <span>Bước trước</span>
                        </button>
                        <button onclick="goToNextStep()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-lg active:scale-95">
                            Sang Chặng 5: Thí Nghiệm Thể Tích →
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // STAGE 5: THỂ TÍCH & THÍ NGHIỆM RÓT NƯỚC (Dự đoán & Rót 3 lần)
    else if (stage === 5) {
        const pred = prevAns ? prevAns.value : appState.predictions['stg5_volume'];
        if (step === 1) {
            const predOptions = [
                { val: 2, label: '2 lần', sub: 'V_nón = 1/2 V_trụ' },
                { val: 3, label: '3 lần', sub: 'V_nón = 1/3 V_trụ' },
                { val: 4, label: '4 lần', sub: 'V_nón = 1/4 V_trụ' },
                { val: 0, label: 'Không chắc', sub: 'Cần làm thí nghiệm' }
            ];
            const buttonsHtml = predOptions.map(opt => {
                const isSelected = pred === opt.val;
                return `
                    <button onclick="makePrediction('stg5_volume', ${opt.val})" class="p-2 rounded-xl text-left transition-all ${
                        isSelected
                            ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.6)] border border-amber-300'
                            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                    }">
                        <div class="text-xs font-bold">${opt.label}</div>
                        <div class="text-[10px] ${isSelected ? 'text-slate-900 font-semibold' : 'text-slate-400'}">${opt.sub}</div>
                    </button>
                `;
            }).join('');

            card.innerHTML = `
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
                    <div class="flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">5</span>
                        <h3 class="text-xs font-black uppercase text-amber-300">Dự Đoán Tỉ Lệ Thể Tích</h3>
                    </div>
                    ${isStepDone ? '<span class="text-[10px] font-bold text-emerald-400">✓ ĐÃ HOÀN THÀNH</span>' : '<span class="text-[10px] font-mono text-slate-400">Bước 1 / 3</span>'}
                </div>
                <div class="pt-2 space-y-2 text-xs">
                    <p class="text-slate-200">
                        Đặt cạnh nhau một hình nón và hình trụ có <b class="text-amber-300 font-mono">cùng bán kính đáy r = ${r.toFixed(1)} ${u}</b> và <b class="text-sky-300 font-mono">cùng chiều cao h = ${h.toFixed(1)} ${u}</b>.
                    </p>
                    <div class="p-2 rounded-xl bg-slate-900/60 border border-cyan-500/30 text-cyan-200 font-medium">
                        🤔 <b>Câu hỏi dự đoán:</b> Cần đổ bao nhiêu hình nón đầy nước thì sẽ vừa vặn làm đầy hình trụ?
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-1.5 pt-0.5">
                        ${buttonsHtml}
                    </div>
                    <div class="flex items-center justify-between pt-1">
                        <button onclick="goToPreviousStep()" class="text-slate-400 hover:text-white flex items-center gap-1 font-bold">
                            <span>←</span> <span>Chặng 4</span>
                        </button>
                        <button onclick="goToNextStep()" class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold active:scale-95 shadow">
                            Tiến Hành Rót Nước →
                        </button>
                    </div>
                </div>
            `;
        } else if (step === 2) {
            const pourStatus = [
                { step: 1, text: 'Lần 1: 1/3 trụ', done: appState.currentPour >= 1 },
                { step: 2, text: 'Lần 2: 2/3 trụ', done: appState.currentPour >= 2 },
                { step: 3, text: 'Lần 3: 3/3 trụ (Đầy)', done: appState.currentPour >= 3 }
            ];

            card.innerHTML = `
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
                    <div class="flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">5</span>
                        <h3 class="text-xs font-black uppercase text-amber-300">Thao Tác Thí Nghiệm Rót Nước</h3>
                    </div>
                    ${isStepDone ? '<span class="text-[10px] font-bold text-emerald-400">✓ ĐÃ HOÀN THÀNH</span>' : '<span class="text-[10px] font-mono text-slate-400">Bước 2 / 3</span>'}
                </div>
                <div class="pt-2 space-y-2 text-xs">
                    <p class="text-slate-200">
                        Bấm các nút rót nước hoặc <b class="text-cyan-300">Chạy Toàn Bộ</b> để quan sát mực nước dâng trong hình trụ:
                    </p>
                    <div class="grid grid-cols-3 gap-1.5">
                        ${pourStatus.map(p => `
                            <div class="p-1.5 rounded-xl text-center border ${
                                p.done
                                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                                    : 'bg-slate-900/60 text-slate-400 border-slate-700/40'
                            }">
                                <div class="font-bold text-[11px]">${p.done ? '✓ ' : ''}${p.text}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="flex items-center justify-between pt-1">
                        <button onclick="goToPreviousStep()" class="text-slate-400 hover:text-white flex items-center gap-1 font-bold">
                            <span>←</span> <span>Bước trước</span>
                        </button>
                        <div class="flex items-center gap-1.5">
                            ${appState.currentPour < 3 ? `
                                <button onclick="handlePour(${appState.currentPour + 1})" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow active:scale-95">
                                    Rót lần ${appState.currentPour + 1}
                                </button>
                                <button onclick="playVolumeAuto()" class="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow active:scale-95">
                                    Chạy Toàn Bộ
                                </button>
                            ` : `
                                <button onclick="unlockDiscovery('vol_ratio'); goToNextStep();" class="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow active:scale-95">
                                    Rút Ra Kết Luận →
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
                    <div class="flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">✓</span>
                        <h3 class="text-xs font-black uppercase text-emerald-300">Đối Chiếu Dự Đoán & Công Thức</h3>
                    </div>
                    <span class="text-[10px] font-bold text-emerald-400">✓ ĐÃ HOÀN THÀNH</span>
                </div>
                <div class="pt-2 space-y-2 text-xs">
                    <div class="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-medium">
                        ${pred === 3 ? '🌟 <b>Dự đoán chính xác tuyệt đối!</b> Đúng 3 hình nón.' : `💡 Dự đoán của em: <b>${pred ? pred + ' lần' : 'Chưa chắc'}</b>. Kết quả thực nghiệm: <b>Chính xác là 3 lần</b>.`}
                    </div>
                    <div class="p-3 rounded-2xl bg-amber-950/70 border border-amber-500/50 text-center font-mono space-y-1">
                        <div class="text-xs text-amber-200">3 × V<sub>nón</sub> = V<sub>trụ</sub></div>
                        <div class="text-sm font-black text-amber-300">⇒ V<sub>nón</sub> = 1/3 V<sub>trụ</sub> = 1/3 π r² h</div>
                    </div>
                    <div class="flex items-center justify-between pt-1">
                        <button onclick="goToPreviousStep()" class="text-slate-400 hover:text-white flex items-center gap-1 font-bold">
                            <span>←</span> <span>Xem lại rót nước</span>
                        </button>
                        <button onclick="goToNextStep()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-lg active:scale-95">
                            Sang Chặng 6: Thiết Diện Mặt Cắt →
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // STAGE 6: MẶT CẮT & THIẾT DIỆN KHÔNG GIAN
    else if (stage === 6) {
        if (step === 1) {
            card.innerHTML = `
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
                    <div class="flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">6</span>
                        <h3 class="text-xs font-black uppercase text-emerald-300">Khám Phá Các Loại Mặt Cắt</h3>
                    </div>
                    ${isStepDone ? '<span class="text-[10px] font-bold text-emerald-400">✓ ĐÃ HOÀN THÀNH</span>' : '<span class="text-[10px] font-mono text-slate-400">Bước 1 / 2</span>'}
                </div>
                <div class="pt-2 space-y-2 text-xs">
                    <p class="text-slate-200">
                        Dùng mặt phẳng cắt hình nón và hình trụ ở các vị trí khác nhau:
                    </p>
                    <div class="grid grid-cols-3 gap-1 text-center font-bold text-[11px]">
                        <button onclick="setSectionType('horizontal'); unlockDiscovery('sec_horiz');" class="p-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 hover:bg-slate-800">
                            Ngang Đáy (Hình Tròn)
                        </button>
                        <button onclick="setSectionType('axial'); unlockDiscovery('sec_axial');" class="p-2 rounded-xl bg-slate-900 border border-sky-500/40 text-sky-300 hover:bg-slate-800">
                            Qua Trục (Tam Giác / HCN)
                        </button>
                        <button onclick="setSectionType('slanted');" class="p-2 rounded-xl bg-slate-900 border border-purple-500/40 text-purple-300 hover:bg-slate-800">
                            Cắt Xiên (Elip)
                        </button>
                    </div>
                    <div class="flex items-center justify-between pt-1">
                        <button onclick="goToPreviousStep()" class="text-slate-400 hover:text-white flex items-center gap-1 font-bold">
                            <span>←</span> <span>Chặng 5</span>
                        </button>
                        <button onclick="goToNextStep()" class="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow active:scale-95">
                            Câu Hỏi Thiết Diện Qua Trục →
                        </button>
                    </div>
                </div>
            `;
        } else {
            const isA = prevAns && prevAns.value === 'A';
            const isB = prevAns && prevAns.value === 'B';
            const isC = prevAns && prevAns.value === 'C';
            const isD = prevAns && prevAns.value === 'D';
            card.innerHTML = `
                <div class="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
                    <div class="flex items-center gap-1.5">
                        <span class="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">6</span>
                        <h3 class="text-xs font-black uppercase text-emerald-300">Thiết Diện Qua Trục Của Nón</h3>
                    </div>
                    ${isStepDone ? '<span class="text-[10px] font-bold text-emerald-400">✓ ĐÃ HOÀN THÀNH</span>' : '<span class="text-[10px] font-mono text-slate-400">Bước 2 / 2</span>'}
                </div>
                <div class="pt-2 space-y-2 text-xs">
                    <div class="p-2 rounded-xl bg-slate-900/70 border border-emerald-500/30 text-emerald-200">
                        🤔 <b>Câu hỏi:</b> Khi cắt hình nón bằng một mặt phẳng đi qua trục cố định SO, thiết diện nhận được là hình phẳng nào?
                    </div>
                    <div class="grid grid-cols-2 gap-1.5">
                        <button onclick="handleAnswerEvaluation(true, this, 'stg6-fb', 'Hai cạnh bên là hai đường sinh l bằng nhau.', '', 'Chính xác! Thiết diện qua trục của nón là một tam giác cân có hai cạnh bên bằng đường sinh l, đáy là đường kính 2r.', 'A')" class="p-2 rounded-xl text-left font-bold border transition-all ${
                            isA ? 'bg-emerald-600 text-white font-black border-emerald-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }">
                            A. Tam giác cân
                        </button>
                        <button onclick="handleAnswerEvaluation(false, this, 'stg6-fb', 'Hình nón thuôn nhọn về đỉnh S.', '', 'Chưa đúng, hình chữ nhật là thiết diện qua trục của hình trụ.', 'B')" class="p-2 rounded-xl text-left font-bold border transition-all ${
                            isB ? 'bg-amber-900/60 text-amber-200 border-amber-500/50' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }">
                            B. Hình chữ nhật
                        </button>
                        <button onclick="handleAnswerEvaluation(false, this, 'stg6-fb', 'Mặt phẳng đi qua trục SO cắt theo chiều dọc.', '', 'Chưa đúng, hình tròn là thiết diện khi cắt song song với đáy.', 'C')" class="p-2 rounded-xl text-left font-bold border transition-all ${
                            isC ? 'bg-amber-900/60 text-amber-200 border-amber-500/50' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }">
                            C. Hình tròn
                        </button>
                        <button onclick="handleAnswerEvaluation(false, this, 'stg6-fb', 'Đỉnh nón là điểm chung duy nhất ở trên.', '', 'Chưa đúng.', 'D')" class="p-2 rounded-xl text-left font-bold border transition-all ${
                            isD ? 'bg-amber-900/60 text-amber-200 border-amber-500/50' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }">
                            D. Tam giác đều
                        </button>
                    </div>
                    <div id="stg6-fb" class="${prevAns ? '' : 'hidden'} p-2 rounded-xl ${prevAns?.isCorrect ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300' : 'bg-amber-950/70 border border-amber-500/50 text-amber-200'} text-xs font-semibold">
                        ${prevAns ? `
                            <div class="flex items-center justify-between">
                                <span>${prevAns.isCorrect ? '🎉 <b>Chính xác!</b> ' : '⚠️ '}${prevAns.explanation}</span>
                                <button onclick="resetStepAnswer(6, 2)" class="text-[10px] text-amber-300 hover:underline ml-2">✎ Thử lại</button>
                            </div>
                        ` : ''}
                    </div>
                    <div class="flex items-center justify-between pt-1">
                        <button onclick="goToPreviousStep()" class="text-slate-400 hover:text-white flex items-center gap-1 font-bold">
                            <span>←</span> <span>Bước trước</span>
                        </button>
                        <button onclick="goToNextStep()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-lg active:scale-95">
                            Sang Chặng 7: Thử Thách & Tổng Kết →
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // STAGE 7: THỬ THÁCH & VẬN DỤNG TỔNG HỢP
    else if (stage === 7) {
        card.innerHTML = `
            <div class="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
                <div class="flex items-center gap-1.5">
                    <span class="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">7</span>
                    <h3 class="text-xs font-black uppercase text-amber-300">Đấu Trường Thử Thách & Vận Dụng</h3>
                </div>
                <span class="text-[10px] font-bold text-emerald-400">✓ ĐÃ HOÀN THÀNH</span>
            </div>
            <div class="pt-2 space-y-2 text-xs">
                <!-- Sơ đồ hình học tổng kết toàn bài (Requirement: Chặng 7 đầy đủ hình học) -->
                <div class="p-2 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-center shadow-inner">
                    <div class="flex items-center justify-between text-[10px] text-amber-300 font-bold pb-1 border-b border-slate-800">
                        <span>📐 Sơ đồ cấu tạo & công thức tổng hợp</span>
                        <button onclick="syncChallenge3DScene()" class="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold text-[9px]">
                            <i class="ph-bold ph-eye"></i><span>Hiện 3D</span>
                        </button>
                    </div>
                    <div class="pt-1">
                        <svg viewBox="0 0 280 95" class="w-full max-w-[280px] h-[90px] mx-auto select-none">
                            <!-- Cone overview on left -->
                            <g transform="translate(45, 10)">
                                <ellipse cx="25" cy="62" rx="24" ry="6" fill="#0f172a" stroke="#475569" stroke-width="1.2" stroke-dasharray="2 2"/>
                                <path d="M 1 62 A 24 6 0 0 0 49 62" fill="none" stroke="#64748b" stroke-width="1.2"/>
                                <line x1="1" y1="62" x2="25" y2="8" stroke="#64748b" stroke-width="1.2"/>
                                <line x1="49" y1="62" x2="25" y2="8" stroke="#64748b" stroke-width="1.2"/>
                                <polygon points="25,8 25,62 49,62" fill="rgba(245, 158, 11, 0.25)" stroke="#f59e0b" stroke-width="1.2"/>
                                <line x1="25" y1="8" x2="25" y2="62" stroke="#38bdf8" stroke-width="1.8"/>
                                <line x1="25" y1="62" x2="49" y2="62" stroke="#f59e0b" stroke-width="1.8"/>
                                <line x1="25" y1="8" x2="49" y2="62" stroke="#ec4899" stroke-width="1.8"/>
                                <text x="25" y="4" fill="#38bdf8" font-size="8" font-weight="bold" text-anchor="middle">S</text>
                                <text x="18" y="38" fill="#38bdf8" font-size="8" font-weight="bold">h</text>
                                <text x="35" y="72" fill="#f59e0b" font-size="8" font-weight="bold">r</text>
                                <text x="40" y="34" fill="#ec4899" font-size="8" font-weight="bold">l</text>
                            </g>
                            <!-- Formulas on right -->
                            <g transform="translate(115, 12)">
                                <rect x="0" y="0" width="155" height="66" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#334155" stroke-width="1"/>
                                <text x="8" y="16" fill="#fde68a" font-size="9" font-weight="900">l² = r² + h²</text>
                                <text x="75" y="16" fill="#cbd5e1" font-size="8 font-semibold">(Pythagore)</text>
                                <text x="8" y="32" fill="#ec4899" font-size="9" font-weight="900">Sxq = π·r·l</text>
                                <text x="75" y="32" fill="#cbd5e1" font-size="8 font-semibold">| Stp = πrl + πr²</text>
                                <text x="8" y="48" fill="#38bdf8" font-size="9" font-weight="900">V_nón = ⅓ πr²h</text>
                                <text x="8" y="60" fill="#34d399" font-size="8.5" font-weight="bold">= ⅓ V_trụ (cùng r, h)</text>
                            </g>
                        </svg>
                    </div>
                </div>

                <p class="text-slate-200 leading-relaxed text-[11px]">
                    Chúc mừng em đã trải qua đầy đủ các chặng khám phá! Hãy vận dụng kiến thức qua các hoạt động tương tác:
                </p>

                <div class="grid grid-cols-2 gap-2 font-bold text-xs">
                    <button onclick="openFormulaBuilderModal()" class="p-2 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-200 hover:bg-cyan-900 flex items-center gap-2">
                        <span class="text-base">🧩</span>
                        <div class="text-left">
                            <div class="text-white font-bold text-[11px]">Ghép Công Thức</div>
                            <div class="text-[9px] text-cyan-300">Thử thách ghép thẻ</div>
                        </div>
                    </button>
                    <button onclick="openRealWorldModal()" class="p-2 rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-900 flex items-center gap-2">
                        <span class="text-base">🥫</span>
                        <div class="text-left">
                            <div class="text-white font-bold text-[11px]">Toán Thực Tế</div>
                            <div class="text-[9px] text-emerald-300">Lon nước, mũ nón</div>
                        </div>
                    </button>
                    <button onclick="openDragLabelsModal()" class="p-2 rounded-2xl bg-amber-950 border border-amber-500/40 text-amber-200 hover:bg-amber-900 flex items-center gap-2">
                        <span class="text-base">🏷️</span>
                        <div class="text-left">
                            <div class="text-white font-bold text-[11px]">Gắn Nhãn 3D</div>
                            <div class="text-[9px] text-amber-300">Định danh cấu tạo</div>
                        </div>
                    </button>
                    <button onclick="openDiaryModal()" class="p-2 rounded-2xl bg-purple-950 border border-purple-500/40 text-purple-200 hover:bg-purple-900 flex items-center gap-2">
                        <span class="text-base">📒</span>
                        <div class="text-left">
                            <div class="text-white font-bold text-[11px]">Nhật Ký Khám Phá</div>
                            <div class="text-[9px] text-purple-300">${appState.discoveryJournal.length} định lý đã ghi</div>
                        </div>
                    </button>
                </div>

                <div class="flex items-center justify-between pt-1.5 border-t border-slate-700/60">
                    <button onclick="goToPreviousStep()" class="text-slate-400 hover:text-white flex items-center gap-1 font-bold">
                        <span>←</span> <span>Chặng 6 (Mặt Cắt)</span>
                    </button>
                    <button onclick="setMode('challenge')" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-lg active:scale-95 flex items-center gap-1">
                        <i class="ph-fill ph-trophy"></i><span>Đấu Trường 5 Câu Hỏi →</span>
                    </button>
                </div>
            </div>
        `;
        // Fallthrough to inject voice button below
    }

    // Bổ sung nút giọng nói thuyết minh trên từng thẻ bài học của các chặng
    const cardHeader = card.querySelector('.flex.items-center.justify-between.pb-1\\.5');
    if (cardHeader && !cardHeader.querySelector('.btn-step-speak')) {
        const speakBtn = document.createElement('button');
        speakBtn.className = 'btn-step-speak px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition-all ml-auto mr-1.5';
        speakBtn.title = 'Nghe đọc thuyết minh bài học (Bấm để Đọc / Dừng)';
        speakBtn.innerHTML = (typeof VoiceNarrator !== 'undefined' && VoiceNarrator.isSpeaking)
            ? '<i class="ph-fill ph-speaker-simple-high text-xs animate-pulse text-amber-300"></i><span class="text-amber-300 font-black">Dừng đọc</span>'
            : '<i class="ph-bold ph-speaker-high text-xs"></i><span>Nghe giảng</span>';
        speakBtn.onclick = (e) => {
            e.stopPropagation();
            if (typeof VoiceNarrator !== 'undefined') VoiceNarrator.toggle();
        };
        const rightContainer = cardHeader.lastElementChild;
        if (rightContainer) {
            cardHeader.insertBefore(speakBtn, rightContainer);
        } else {
            cardHeader.appendChild(speakBtn);
        }
    }
}

function updateGuidedUI() {
    updateLessonMap();
    renderGuidedCard();
    updateLessonDockUI();
}

// ==========================================
// 12. TEACHER TOOLBAR & CLASSROOM TOOLS
// ==========================================
function toggleTeacherMode() {
    appState.teacherMode = !appState.teacherMode;
    const bar = document.getElementById('teacher-toolbar');
    if (bar) bar.classList.toggle('hidden', !appState.teacherMode);
    const btn = document.getElementById('btn-teacher-toggle');
    if (btn) btn.classList.toggle('bg-amber-500', appState.teacherMode);
}

function teacherPrevStep() {
    goToPreviousStep();
}

function teacherNextStep() {
    goToNextStep();
}

function teacherTogglePlay() {
    if (appState.mode === 'volume') {
        playVolumeAuto();
    } else if (appState.mode === 'net') {
        playUnfoldAuto();
    } else if (appState.mode === 'revolution') {
        if (appState.isRevolvePlaying) {
            pauseRevolution();
            const btn = document.getElementById('btn-teacher-play');
            if (btn) btn.innerHTML = '<i class="ph-fill ph-play"></i><span>Phát</span>';
        } else {
            playRevolution();
            const btn = document.getElementById('btn-teacher-play');
            if (btn) btn.innerHTML = '<i class="ph-fill ph-pause"></i><span>Dừng</span>';
        }
    }
}

function teacherReset() {
    if (appState.mode === 'volume') resetVolumeSimulation();
    else if (appState.mode === 'net') resetUnfold();
    else if (appState.mode === 'revolution') resetRevolution();
    else if (appState.mode === 'section') {
        setSectionYRatio(0.5);
    }
    showToast('Đã đặt lại trạng thái bài học');
}

// Formula Display Modes ('full' | 'compact' | 'quiz')
appState.formulaDisplayMode = 'full';

function cycleFormulaMode() {
    const btn = document.getElementById('btn-formula-cycle');
    if (appState.formulaDisplayMode === 'full') {
        appState.formulaDisplayMode = 'compact';
        if (btn) btn.innerText = 'ƒ Rút gọn';
        showToast('Công thức: Dạng tổng quát rút gọn');
    } else if (appState.formulaDisplayMode === 'compact') {
        appState.formulaDisplayMode = 'quiz';
        if (btn) btn.innerText = 'ƒ Đố vui (?)';
        showToast('Công thức: Ẩn giá trị để đố học sinh');
    } else {
        appState.formulaDisplayMode = 'full';
        if (btn) btn.innerText = 'ƒ Đầy đủ';
        showToast('Công thức: Hiển thị đầy đủ số liệu');
    }
    updateCalculations();
}

function showStepHint() {
    const hints = [
        "💡 Bước 1: Hãy cho học sinh dự đoán trước khi xem thí nghiệm để kích thích tư duy phản biện.",
        "💡 Bước 2: Quan sát mực nước tăng dần 1/3 → 2/3 → 3/3 khi đổ từng nón nước vào hình trụ.",
        "💡 Bước 3: Đặt câu hỏi: 'Thể tích hình nón bằng bao nhiêu phần thể tích hình trụ có cùng r và h?'",
        "💡 Bước 4: Yêu cầu học sinh áp dụng công thức V = 1/3 π r² h để giải quyết các bài toán thực tiễn."
    ];
    showToast(hints[appState.step - 1] || "Gợi ý giáo viên: Kết hợp xoay 3D để học sinh quan sát từ nhiều góc độ.");
}

// Student Question Bank for THCS Grade 9
const STUDENT_QUESTIONS = [
    {
        q: 'Khi quay tam giác vuông SOB quanh trục SO, cạnh nào quét tạo nên bán kính đáy và cạnh nào quét tạo nên mặt xung quanh của hình nón?',
        a: 'ĐÁP ÁN: Cạnh góc vuông OB nằm ngang quét tạo nên hình tròn đáy bán kính r. Cạnh huyền SB quét trong không gian tạo nên mặt xung quanh (đường sinh l).'
    },
    {
        q: 'Nếu giữ nguyên chiều cao h và tăng bán kính đáy r lên gấp đôi, thể tích của hình nón sẽ tăng lên bao nhiêu lần? Vì sao?',
        a: 'ĐÁP ÁN: Thể tích tăng lên 4 lần. Vì V = 1/3 π r² h, thể tích tỉ lệ thuận với bình phương bán kính r (2² = 4).'
    },
    {
        q: 'Hình khai triển mặt xung quanh của một hình nón có hình dạng gì? Độ dài cung của hình đó có mối quan hệ gì với đường tròn đáy?',
        a: 'ĐÁP ÁN: Khai triển là một hình quạt tròn bán kính l. Độ dài cung quạt bằng đúng chu vi đường tròn đáy (2πr).'
    },
    {
        q: 'Mặt cắt song song với đáy của hình nón là hình gì? Dựa vào kiến thức nào để chứng minh bán kính lát cắt r\' = r·(1 - y/h)?',
        a: 'ĐÁP ÁN: Mặt cắt song song đáy luôn là hình tròn. Ta chứng minh được nhờ tam giác đồng dạng (hệ quả định lý Ta-lét trong thiết diện qua trục): r\' / r = (h - y) / h.'
    },
    {
        q: 'Cần bao nhiêu hình nón đầy nước để rót đầy một hình trụ có cùng bán kính đáy và chiều cao? Từ đó rút ra công thức thể tích hình nón thế nào?',
        a: 'ĐÁP ÁN: Cần đúng 3 hình nón nước đầy. Do đó: 3 × V_nón = V_trụ ⇒ V_nón = 1/3 V_trụ = 1/3 πr²h.'
    },
    {
        q: 'Mặt cắt qua trục của hình trụ là hình gì và có kích thước các cạnh bằng bao nhiêu?',
        a: 'ĐÁP ÁN: Mặt cắt qua trục của hình trụ luôn là hình chữ nhật có một cạnh bằng đường kính đáy 2r và một cạnh bằng chiều cao h của hình trụ.'
    },
    {
        q: 'Đường sinh l của hình nón được tính theo bán kính đáy r và chiều cao h theo công thức nào?',
        a: 'ĐÁP ÁN: Theo định lý Pythagoras trong tam giác vuông SOB: l = √(r² + h²).'
    },
    {
        q: 'Khai triển mặt xung quanh của hình trụ thu được hình gì? Kích thước hình đó là bao nhiêu?',
        a: 'ĐÁP ÁN: Thu được hình chữ nhật có một cạnh bằng chiều cao h và cạnh kia bằng chu vi đáy 2πr.'
    }
];

let currentStudentQIdx = 0;

function openStudentQuestionModal() {
    const modal = document.getElementById('student-question-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    currentStudentQIdx = Math.floor(Math.random() * STUDENT_QUESTIONS.length);
    updateStudentQuestionCard();
}

function closeStudentQuestionModal() {
    const modal = document.getElementById('student-question-modal');
    if (modal) modal.classList.add('hidden');
}

function nextStudentQuestion() {
    currentStudentQIdx = (currentStudentQIdx + 1) % STUDENT_QUESTIONS.length;
    updateStudentQuestionCard();
}

function updateStudentQuestionCard() {
    const qText = document.getElementById('student-question-text');
    const aBox = document.getElementById('student-question-answer');
    const btnReveal = document.getElementById('btn-reveal-answer');
    const btnSpeakA = document.getElementById('btn-speak-student-a');
    const item = STUDENT_QUESTIONS[currentStudentQIdx];
    if (qText) qText.innerText = item.q;
    if (aBox) {
        aBox.innerText = item.a;
        aBox.classList.add('hidden');
    }
    if (btnReveal) btnReveal.innerText = 'Hiện Đáp Án';
    if (btnSpeakA) btnSpeakA.classList.add('hidden');
    if (typeof VoiceNarrator !== 'undefined' && appState.voiceEnabled) {
        VoiceNarrator.speak('Câu hỏi thảo luận cho học sinh: ' + item.q);
    }
}

function revealStudentAnswer() {
    const aBox = document.getElementById('student-question-answer');
    const btnReveal = document.getElementById('btn-reveal-answer');
    const btnSpeakA = document.getElementById('btn-speak-student-a');
    if (!aBox) return;
    const isHidden = aBox.classList.contains('hidden');
    aBox.classList.toggle('hidden', !isHidden);
    if (btnReveal) btnReveal.innerText = isHidden ? 'Ẩn Đáp Án' : 'Hiện Đáp Án';
    if (btnSpeakA) btnSpeakA.classList.toggle('hidden', !isHidden);
    if (isHidden && typeof VoiceNarrator !== 'undefined' && appState.voiceEnabled) {
        const item = STUDENT_QUESTIONS[currentStudentQIdx];
        if (item && item.a) VoiceNarrator.speak(item.a);
    }
}

// Laser Pointer Tool
let laserActive = false;

function toggleLaserPointer() {
    laserActive = !laserActive;
    const dot = document.getElementById('laser-pointer-dot');
    const btn = document.getElementById('btn-laser-toggle');
    if (btn) btn.classList.toggle('bg-rose-600', laserActive);
    if (dot) dot.style.display = laserActive ? 'block' : 'none';
    showToast(laserActive ? '🔦 Đã bật bút Laser chỉ điểm (Di chuột trên mô hình)' : 'Đã tắt bút Laser');
}

window.addEventListener('mousemove', (e) => {
    if (!laserActive) return;
    const dot = document.getElementById('laser-pointer-dot');
    if (dot) {
        dot.style.left = e.clientX + 'px';
        dot.style.top = e.clientY + 'px';
    }
});

// 3D Direct Measurement Tool
let measureActive = false;
const measureGroup = new THREE.Group();
scene.add(measureGroup);

function toggleMeasureTool() {
    measureActive = !measureActive;
    const overlay = document.getElementById('measure-overlay');
    const btn = document.getElementById('btn-measure-toggle');
    if (overlay) overlay.classList.toggle('hidden', !measureActive);
    if (btn) btn.classList.toggle('bg-emerald-600', measureActive);
    if (measureActive) {
        updateMeasurePresets();
        measurePreset('height');
        showToast('📏 Đã bật thước đo 3D trực tiếp');
    } else {
        resetMeasurement();
    }
}

function resetMeasurement() {
    clearGroupSafely(measureGroup);
    const text = document.getElementById('measure-readout-text');
    if (text) text.innerText = 'Chọn mốc đo để xem kích thước...';
}

function measurePreset(name) {
    clearGroupSafely(measureGroup);
    const r = appState.r;
    const h = appState.h;
    const l = appState.l;
    const u = appState.unit;
    let p1, p2, distText;

    if (name === 'height') {
        p1 = new THREE.Vector3(0, 0, 0);
        p2 = new THREE.Vector3(0, h, 0);
        distText = `Chiều cao h = ${h.toFixed(2)} ${u}`;
    } else if (name === 'radius') {
        p1 = new THREE.Vector3(0, 0, 0);
        p2 = new THREE.Vector3(r, 0, 0);
        distText = `Bán kính r = ${r.toFixed(2)} ${u}`;
    } else if (name === 'slant') {
        p1 = new THREE.Vector3(0, h, 0);
        p2 = new THREE.Vector3(r, 0, 0);
        distText = `Đường sinh l = √(r² + h²) ≈ ${l.toFixed(2)} ${u}`;
    } else if (name === 'diameter') {
        p1 = new THREE.Vector3(-r, 0, 0);
        p2 = new THREE.Vector3(r, 0, 0);
        distText = `Đường kính đáy 2r = ${(2 * r).toFixed(2)} ${u}`;
    }

    if (p1 && p2) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const line = new THREE.Line(lineGeo, new THREE.LineDashedMaterial({ color: 0x10b981, dashSize: 0.25, gapSize: 0.1, linewidth: 3 }));
        line.computeLineDistances();
        measureGroup.add(line);

        const m1 = new THREE.Mesh(sphereMarkerGeo, SHARED_MATS.pointGreen);
        m1.position.copy(p1);
        const m2 = new THREE.Mesh(sphereMarkerGeo, SHARED_MATS.pointGreen);
        m2.position.copy(p2);
        measureGroup.add(m1);
        measureGroup.add(m2);

        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        const badge = Label3DManager.createBadge(`📏 ${distText}`, '#10b981', 'rgba(6,78,59,0.95)', '#10b981', 250, 56);
        badge.position.set(mid.x, mid.y + 0.38, mid.z);
        measureGroup.add(badge);

        const text = document.getElementById('measure-readout-text');
        if (text) text.innerText = distText;
        if (typeof VoiceNarrator !== 'undefined' && appState.voiceEnabled) {
            VoiceNarrator.speak(distText);
        }
    }
}

function updateMeasurePresets() {
    const text = document.getElementById('measure-readout-text');
    if (text) {
        text.innerHTML = `
            <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
                <button onclick="measurePreset('height')" class="px-2 py-0.5 rounded bg-sky-950 border border-sky-400 text-sky-300 text-[10px] font-bold hover:bg-sky-900">Chiều cao h</button>
                <button onclick="measurePreset('radius')" class="px-2 py-0.5 rounded bg-amber-950 border border-amber-400 text-amber-300 text-[10px] font-bold hover:bg-amber-900">Bán kính r</button>
                <button onclick="measurePreset('slant')" class="px-2 py-0.5 rounded bg-pink-950 border border-pink-400 text-pink-300 text-[10px] font-bold hover:bg-pink-900">Đường sinh l</button>
                <button onclick="measurePreset('diameter')" class="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-400 text-emerald-300 text-[10px] font-bold hover:bg-emerald-900">Đường kính 2r</button>
            </div>
        `;
    }
}

// Formula Comparison Modal
function openFormulaCompareModal() {
    const modal = document.getElementById('formula-compare-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeFormulaCompareModal() {
    const modal = document.getElementById('formula-compare-modal');
    if (modal) modal.classList.add('hidden');
}

// Sidebar Collapsible Controller (to expand 3D workspace for projector)
function toggleSidebar(side) {
    if (side === 'left') {
        const left = document.getElementById('sidebar-left');
        const btn = document.getElementById('btn-uncollapse-left');
        if (!left) return;
        const isHidden = left.classList.contains('-translate-x-full');
        left.classList.toggle('-translate-x-full', !isHidden);
        left.classList.toggle('opacity-0', !isHidden);
        left.classList.toggle('pointer-events-none', !isHidden);
        if (btn) btn.classList.toggle('hidden', isHidden);
    } else if (side === 'right') {
        const right = document.getElementById('sidebar-right');
        const btn = document.getElementById('btn-uncollapse-right');
        if (!right) return;
        const isHidden = right.classList.contains('translate-x-full');
        right.classList.toggle('translate-x-full', !isHidden);
        right.classList.toggle('opacity-0', !isHidden);
        right.classList.toggle('pointer-events-none', !isHidden);
        if (btn) btn.classList.toggle('hidden', isHidden);
    }
}

// ==========================================
// 12. CAMERA AUTO-FIT & FRAMING (PHẦN 3)
// ==========================================
function frameFloatingModel(targetGroup) {
    let group = targetGroup;
    if (!group) {
        if ((typeof lessonState !== 'undefined' && lessonState.currentStageIndex === 1) || appState.mode === 'structure') {
            group = structureGroup;
        } else if (appState.mode === 'revolution') group = trueRevGroup;
        else if (appState.mode === 'net') group = netDisplayGroup;
        else if (appState.mode === 'volume') group = volumeGroup;
        else if (appState.mode === 'section') group = sectionGroup;
        else group = envGroup;
    }
    if (!group) return;

    const box = new THREE.Box3().setFromObject(group);
    if (box.isEmpty()) return;

    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z, 5);
    const fov = ((camera && camera.fov) || 45) * (Math.PI / 180);
    let cameraDist = maxDim / (2 * Math.tan(fov / 2));
    cameraDist = Math.max(15, Math.min(34, cameraDist * 1.62));

    const targetY = Math.max(0.6, center.y * 0.90);

    if (typeof gsap !== 'undefined') {
        gsap.killTweensOf(camera.position);
        gsap.killTweensOf(controls.target);

        gsap.to(camera.position, {
            x: 0,
            y: targetY + 2.4,
            z: cameraDist,
            duration: 0.85,
            ease: 'power2.out'
        });
        gsap.to(controls.target, {
            x: 0,
            y: targetY,
            z: 0,
            duration: 0.85,
            ease: 'power2.out',
            onUpdate: () => controls.update()
        });
    } else {
        camera.position.set(0, targetY + 2.4, cameraDist);
        controls.target.set(0, targetY, 0);
        if (controls && controls.update) controls.update();
    }
}

function frameActiveObject() {
    frameFloatingModel();
    showToast('🎯 Đã tự động canh giữa và tối ưu góc nhìn');
}

function toggleLabels() {
    appState.labelsVisible = !appState.labelsVisible;
    volCylLabels.visible = appState.labelsVisible;
    volConeLabels.visible = appState.labelsVisible;
    if (typeof netLabelsGroup !== 'undefined') netLabelsGroup.visible = appState.labelsVisible;
    if (typeof revProfileLabelsGroup !== 'undefined') revProfileLabelsGroup.visible = appState.labelsVisible;
    if (typeof sectionLabelsGroup !== 'undefined') sectionLabelsGroup.visible = appState.labelsVisible;
    const btn = document.getElementById('btn-labels-toggle');
    if (btn) {
        btn.classList.toggle('text-amber-400', appState.labelsVisible);
        btn.classList.toggle('border-amber-500/40', appState.labelsVisible);
    }
    persistState();
    showToast(appState.labelsVisible ? 'Đã bật kích thước 3D' : 'Đã ẩn kích thước 3D');
}

function toggleLargeFont() {
    document.body.classList.toggle('scale-105');
    const isLarge = document.body.classList.contains('scale-105');
    const btn = document.getElementById('btn-large-font');
    if (btn) btn.classList.toggle('bg-amber-600', isLarge);
    showToast(isLarge ? 'Đã bật chế độ chữ lớn máy chiếu' : 'Đã về chế độ chữ chuẩn');
}

function setSpotlight(target) {
    appState.spotlightTarget = (appState.spotlightTarget === target) ? null : target;
    const isTarget = (name) => !appState.spotlightTarget || appState.spotlightTarget === name;

    SHARED_MATS.coneGlass.opacity = isTarget('lateral') ? 0.8 : 0.15;
    SHARED_MATS.cylGlass.opacity = isTarget('lateral') ? 0.8 : 0.15;
    SHARED_MATS.netBase.opacity = isTarget('base') ? 0.95 : 0.2;
    SHARED_MATS.lineAxis.opacity = isTarget('axis') ? 1.0 : 0.2;
    
    showToast(`Spotlight: ${appState.spotlightTarget ? appState.spotlightTarget.toUpperCase() : 'TOÀN BỘ MÔ HÌNH'}`);
}

// ==========================================
// 12B. CLASSROOM EDITION INTERACTIVE ACTIVITIES
// ==========================================

// --- Activity 1: Formula Builder Puzzle (Requirement 10 & 11) ---
const FORMULA_PUZZLES = {
    v_cone: {
        id: 'v_cone',
        name: 'Thể tích hình nón (V)',
        leftSide: 'V =',
        expected: ['1/3', 'π', 'r²', 'h'],
        tokens: ['1/3', 'π', 'r', 'r²', 'h', 'l', '2', '+', '√(r² + h²)'],
        hint1: 'Thể tích nón bằng 1/3 thể tích hình trụ cùng đáy và chiều cao.',
        hint2: 'Công thức gồm hệ số 1/3, số pi, bình phương bán kính r² và chiều cao h.',
        explanation: 'V_nón = 1/3 · S_đáy · h = 1/3 · πr²h.'
    },
    sxq_cone: {
        id: 'sxq_cone',
        name: 'Diện tích xung quanh hình nón (Sxq)',
        leftSide: 'S_xq =',
        expected: ['π', 'r', 'l'],
        tokens: ['1/3', 'π', 'r', 'r²', 'h', 'l', '2', '+', '√(r² + h²)'],
        hint1: 'Khai triển mặt nón là hình quạt có bán kính l và cung dài 2πr.',
        hint2: 'S_xq = 1/2 · Cung · R_quạt = 1/2 · (2πr) · l = πrl.',
        explanation: 'S_xq = π · r · l.'
    },
    stp_cone: {
        id: 'stp_cone',
        name: 'Diện tích toàn phần hình nón (Stp)',
        leftSide: 'S_tp =',
        expected: ['π', 'r', 'l', '+', 'π', 'r²'],
        tokens: ['1/3', 'π', 'r', 'r²', 'h', 'l', '2', '+', '√(r² + h²)'],
        hint1: 'Toàn phần gồm diện tích xung quanh cộng với diện tích đáy tròn.',
        hint2: 'S_tp = S_xq + S_đáy = πrl + πr².',
        explanation: 'S_tp = πrl + πr² = πr(l + r).'
    },
    v_cyl: {
        id: 'v_cyl',
        name: 'Thể tích hình trụ (V)',
        leftSide: 'V =',
        expected: ['π', 'r²', 'h'],
        tokens: ['1/3', 'π', 'r', 'r²', 'h', 'l', '2', '+', '√(r² + h²)'],
        hint1: 'Thể tích trụ bằng diện tích đáy nhân với chiều cao.',
        hint2: 'S_đáy = πr², do đó V = πr²h.',
        explanation: 'V_trụ = πr²h.'
    },
    sxq_cyl: {
        id: 'sxq_cyl',
        name: 'Diện tích xung quanh hình trụ (Sxq)',
        leftSide: 'S_xq =',
        expected: ['2', 'π', 'r', 'h'],
        tokens: ['1/3', 'π', 'r', 'r²', 'h', 'l', '2', '+', '√(r² + h²)'],
        hint1: 'Trải phẳng mặt xung quanh hình trụ được hình chữ nhật kích thước 2πr × h.',
        hint2: 'Diện tích hình chữ nhật là chu vi đáy (2πr) nhân với chiều cao (h).',
        explanation: 'S_xq = 2πrh.'
    },
    l_slant: {
        id: 'l_slant',
        name: 'Đường sinh hình nón (l)',
        leftSide: 'l =',
        expected: ['√(r² + h²)'],
        tokens: ['1/3', 'π', 'r', 'r²', 'h', 'l', '2', '+', '√(r² + h²)'],
        hint1: 'Tam giác vuông SOB có hai cạnh góc vuông là r và h.',
        hint2: 'Định lý Pythagore: l² = r² + h² ⇒ l = √(r² + h²).',
        explanation: 'l = √(r² + h²).'
    }
};

function openFormulaBuilderModal() {
    const modal = document.getElementById('formula-builder-modal');
    if (modal) modal.classList.remove('hidden');
    selectFormulaPuzzle(appState.puzzleTarget || 'v_cone');
    AudioEngine.click();
}

function closeFormulaBuilderModal() {
    const modal = document.getElementById('formula-builder-modal');
    if (modal) modal.classList.add('hidden');
}

function selectFormulaPuzzle(puzKey) {
    appState.puzzleTarget = puzKey;
    appState.puzzlePlacedTokens = [];
    appState.puzzleWrongCount = 0;
    appState.puzzleHintCount = 3;

    // Update buttons
    ['v_cone', 'sxq_cone', 'stp_cone', 'v_cyl', 'sxq_cyl', 'l_slant'].forEach(k => {
        const btn = document.getElementById(`fpuz-btn-${k}`);
        if (btn) {
            btn.className = (k === puzKey)
                ? 'px-3 py-1.5 rounded-xl bg-cyan-600 text-white font-bold whitespace-nowrap shadow'
                : 'px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold whitespace-nowrap hover:text-white';
        }
    });

    const puz = FORMULA_PUZZLES[puzKey];
    const promptText = document.getElementById('fpuz-prompt-text');
    const leftSide = document.getElementById('fpuz-left-side');
    const hintCount = document.getElementById('fpuz-hint-count');
    const feedbackBox = document.getElementById('fpuz-feedback-box');

    if (promptText) promptText.innerText = `Nhiệm vụ: Lắp ráp công thức tính ${puz.name}`;
    if (leftSide) leftSide.innerText = puz.leftSide;
    if (hintCount) hintCount.innerText = '3';
    if (feedbackBox) feedbackBox.classList.add('hidden');

    renderFormulaTokensPalette(puz.tokens);
    renderFormulaDropZone();
}

function renderFormulaTokensPalette(tokens) {
    const container = document.getElementById('fpuz-tokens-palette');
    if (!container) return;
    container.innerHTML = tokens.map(token => `
        <button onclick="addPuzzleToken('${token}')" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono font-bold text-sm border border-slate-700 hover:border-amber-400 active:scale-95 shadow transition-all">
            ${token}
        </button>
    `).join('');
}

function renderFormulaDropZone() {
    const zone = document.getElementById('fpuz-drop-zone');
    if (!zone) return;

    if (appState.puzzlePlacedTokens.length === 0) {
        zone.innerHTML = `<span class="text-xs text-slate-500 italic">Nhấp các thẻ bên dưới để lắp ghép vào đây...</span>`;
        return;
    }

    zone.innerHTML = appState.puzzlePlacedTokens.map((t, idx) => `
        <span onclick="removePuzzleToken(${idx})" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-black font-mono text-sm shadow cursor-pointer hover:bg-rose-500 hover:text-white transition-all" title="Bấm để xóa">
            <span>${t}</span>
            <span class="text-[10px] opacity-70">✕</span>
        </span>
    `).join('');
}

function addPuzzleToken(token) {
    appState.puzzlePlacedTokens.push(token);
    AudioEngine.click();
    renderFormulaDropZone();
}

function removePuzzleToken(idx) {
    appState.puzzlePlacedTokens.splice(idx, 1);
    AudioEngine.click();
    renderFormulaDropZone();
}

function clearFormulaPuzzle() {
    appState.puzzlePlacedTokens = [];
    AudioEngine.click();
    renderFormulaDropZone();
    const fb = document.getElementById('fpuz-feedback-box');
    if (fb) fb.classList.add('hidden');
}

function requestPuzzleHint() {
    const puz = FORMULA_PUZZLES[appState.puzzleTarget];
    const fb = document.getElementById('fpuz-feedback-box');
    const fbText = document.getElementById('fpuz-feedback-text');
    const hintText = document.getElementById('fpuz-hint-text');
    const hintCount = document.getElementById('fpuz-hint-count');
    if (!fb || !puz) return;

    appState.puzzleHintCount = Math.max(0, (appState.puzzleHintCount || 3) - 1);
    if (hintCount) hintCount.innerText = appState.puzzleHintCount;

    AudioEngine.step();
    fb.className = 'p-3 rounded-2xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs flex flex-col gap-1';
    if (fbText) fbText.innerHTML = '💡 <b>Gợi Ý Học Tập:</b>';
    if (hintText) {
        if (appState.puzzleHintCount === 2) hintText.innerText = puz.hint1;
        else if (appState.puzzleHintCount === 1) hintText.innerText = puz.hint2;
        else hintText.innerText = `Đáp án chính xác gồm các thành phần: ${puz.expected.join(' ')}`;
    }
    fb.classList.remove('hidden');
}

function checkFormulaPuzzle() {
    const puz = FORMULA_PUZZLES[appState.puzzleTarget];
    const fb = document.getElementById('fpuz-feedback-box');
    const fbText = document.getElementById('fpuz-feedback-text');
    const hintText = document.getElementById('fpuz-hint-text');
    const scoreTag = document.getElementById('fpuz-score-tag');
    if (!fb || !puz) return;

    const isMatch = (appState.puzzlePlacedTokens.length === puz.expected.length) &&
        appState.puzzlePlacedTokens.every((t, i) => t === puz.expected[i]);

    if (isMatch) {
        AudioEngine.success();
        fireConfetti();
        appState.score = (appState.score || 0) + 20;
        if (scoreTag) scoreTag.innerText = `Điểm: ${appState.score}`;

        fb.className = 'p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs flex flex-col gap-1';
        if (fbText) fbText.innerHTML = `🎉 <b>CHÍNH XÁC XUẤT SẮC!</b> +20 Điểm.`;
        if (hintText) hintText.innerText = `Công thức chuẩn: ${puz.leftSide} ${puz.expected.join(' ')}. ${puz.explanation}`;
        fb.classList.remove('hidden');
        if (typeof VoiceNarrator !== 'undefined' && appState.voiceEnabled) {
            VoiceNarrator.speak(`Chính xác xuất sắc! Công thức chuẩn là: ${puz.leftSide} ${puz.expected.join(' ')}. ${puz.explanation}`);
        }

        // Unlock associated discovery
        if (appState.puzzleTarget === 'v_cone') unlockDiscovery('vol_ratio');
        else if (appState.puzzleTarget === 'sxq_cone') unlockDiscovery('area_cone_xq');
        else if (appState.puzzleTarget === 'l_slant') unlockDiscovery('pythagoras');
    } else {
        AudioEngine.wrong();
        appState.puzzleWrongCount = (appState.puzzleWrongCount || 0) + 1;
        fb.className = 'p-3 rounded-2xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs flex flex-col gap-1';
        if (fbText) fbText.innerHTML = `⚠️ <b>Chưa hoàn toàn đúng:</b>`;
        if (hintText) {
            if (appState.puzzleWrongCount === 1) {
                hintText.innerText = `Em hãy xem lại thứ tự các đại lượng. ${puz.hint1}`;
            } else {
                hintText.innerText = puz.hint2;
            }
        }
        fb.classList.remove('hidden');
        if (typeof VoiceNarrator !== 'undefined' && appState.voiceEnabled) {
            VoiceNarrator.speak(`Chưa hoàn toàn đúng. Em hãy xem lại thứ tự các đại lượng. ${puz.hint1}`);
        }
    }
}

// --- Activity 2: Direct 3D Click Quiz (Requirement 8) ---
const CLICK_TARGETS = {
    slant: {
        role: 'slant',
        prompt: 'Hãy NHẤP CHUỘT vào ĐƯỜNG SINH l (cạnh SB) trên mô hình 3D!',
        hint: 'Đường sinh l là cạnh nghiêng nối từ đỉnh S xuống một điểm B trên đường tròn đáy.',
        color: '#ec4899',
        nextTarget: 'radius'
    },
    radius: {
        role: 'radius',
        prompt: 'Hãy NHẤP CHUỘT vào BÁN KÍNH ĐÁY r (đoạn OB) trên mô hình 3D!',
        hint: 'Bán kính r là đoạn nằm ngang từ tâm đáy O ra mép ngoài đáy.',
        color: '#f59e0b',
        nextTarget: 'axis'
    },
    axis: {
        role: 'axis',
        prompt: 'Hãy NHẤP CHUỘT vào TRỤC QUAY SO (chiều cao h) trên mô hình 3D!',
        hint: 'Trục quay thẳng đứng nối đỉnh S vuông góc với tâm đáy O.',
        color: '#06b6d4',
        nextTarget: null
    }
};

function start3DClickQuiz(targetKey = 'slant') {
    appState.click3DQuizActive = true;
    appState.currentClickTarget = targetKey;
    appState.clickWrongCount = 0;

    const banner = document.getElementById('click-3d-banner');
    const promptText = document.getElementById('click-3d-prompt-text');
    const hintText = document.getElementById('click-3d-hint-text');

    const tObj = CLICK_TARGETS[targetKey];
    if (promptText && tObj) promptText.innerText = tObj.prompt;
    if (hintText) hintText.classList.add('hidden');
    if (banner) banner.classList.remove('hidden');

    AudioEngine.step();
    showToast('🎯 Nhấp chuột trực tiếp lên cạnh hoặc điểm trên mô hình 3D!');
    if (typeof VoiceNarrator !== 'undefined' && appState.voiceEnabled && tObj) {
        VoiceNarrator.speak(tObj.prompt);
    }
}

function cancel3DClickQuiz() {
    appState.click3DQuizActive = false;
    appState.currentClickTarget = null;
    const banner = document.getElementById('click-3d-banner');
    if (banner) banner.classList.add('hidden');
}

// Raycaster for 3D direct interaction
const raycaster = new THREE.Raycaster();
raycaster.params.Line = { threshold: 0.35 };
const mouse = new THREE.Vector2();

window.addEventListener('pointerdown', (e) => {
    if (!appState.click3DQuizActive || !appState.currentClickTarget) return;
    if (['BUTTON', 'INPUT', 'SELECT', 'ASIDE', 'NAV'].includes(e.target.tagName)) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // Target elements to test
    const clickables = [];
    scene.traverse(obj => {
        if (obj.userData && obj.userData.labelRole) clickables.push(obj);
    });

    const intersects = raycaster.intersectObjects(clickables, true);
    const tObj = CLICK_TARGETS[appState.currentClickTarget];
    const banner = document.getElementById('click-3d-banner');
    const hintText = document.getElementById('click-3d-hint-text');

    if (intersects.length > 0) {
        const hit = intersects[0].object;
        const role = hit.userData.labelRole;

        if (role === tObj.role) {
            AudioEngine.success();
            fireConfetti();
            showToast(`🎉 CHÍNH XÁC! Em đã chọn đúng ${tObj.role.toUpperCase()}. +15 Điểm.`);
            appState.score = (appState.score || 0) + 15;

            // Pulse highlight
            gsap.to(hit.scale, { x: 1.4, y: 1.4, z: 1.4, duration: 0.25, yoyo: true, repeat: 1 });

            if (typeof VoiceNarrator !== 'undefined' && appState.voiceEnabled) {
                const roleName = (tObj.role === 'slant') ? 'đường sinh l' : (tObj.role === 'radius' ? 'bán kính đáy r' : 'trục quay chiều cao h');
                if (tObj.nextTarget) {
                    VoiceNarrator.speak('Chính xác! Em đã chọn đúng ' + roleName + '.');
                } else {
                    VoiceNarrator.speak('Xuất sắc! Em đã hoàn thành toàn bộ thử thách nhận diện ba chiều trên mô hình!');
                }
            }

            if (tObj.nextTarget) {
                setTimeout(() => start3DClickQuiz(tObj.nextTarget), 1100);
            } else {
                showToast('🏆 Xuất sắc! Em đã hoàn thành toàn bộ thử thách nhận diện 3D!');
                cancel3DClickQuiz();
            }
        } else {
            AudioEngine.wrong();
            appState.clickWrongCount++;
            if (hintText) {
                hintText.classList.remove('hidden');
                hintText.innerText = `💡 Gợi ý: ${tObj.hint}`;
            }
            showToast(`Chưa đúng, em vừa chạm vào ${role || 'vùng khác'}. Thử lại nhé!`);
            if (typeof VoiceNarrator !== 'undefined' && appState.voiceEnabled) {
                VoiceNarrator.speak('Chưa đúng. ' + tObj.hint);
            }
        }
    }
});

// --- Activity 3: Drag & Drop Labels Activity (Requirement 9) ---
const DRAG_LABELS_DATA = [
    { id: 'r', label: 'Bán kính đáy r', targetKey: 'target_r', targetDesc: 'Đoạn nối tâm O với mép đường tròn đáy' },
    { id: 'h', label: 'Chiều cao h', targetKey: 'target_h', targetDesc: 'Đoạn thẳng vuông góc nối từ đỉnh S xuống đáy' },
    { id: 'l', label: 'Đường sinh l', targetKey: 'target_l', targetDesc: 'Đoạn thẳng nối đỉnh S với một điểm trên mép đáy' },
    { id: 'apex', label: 'Đỉnh nón S', targetKey: 'target_apex', targetDesc: 'Điểm cao nhất nơi mọi đường sinh quy tụ' },
    { id: 'center', label: 'Tâm đáy O', targetKey: 'target_center', targetDesc: 'Tâm của hình tròn nằm ở mặt đáy' },
    { id: 'axis', label: 'Trục quay SO', targetKey: 'target_axis', targetDesc: 'Trục cố định mà hình phẳng quay quanh' }
];

let selectedLabelForPlacement = null;

function openDragLabelsModal() {
    const modal = document.getElementById('drag-labels-modal');
    if (modal) modal.classList.remove('hidden');
    appState.placedLabels = appState.placedLabels || {};
    selectedLabelForPlacement = null;
    renderDragLabelsActivity();
    AudioEngine.click();
}

function closeDragLabelsModal() {
    const modal = document.getElementById('drag-labels-modal');
    if (modal) modal.classList.add('hidden');
}

function renderDragLabelsActivity() {
    const palette = document.getElementById('drag-labels-palette');
    const targets = document.getElementById('drag-targets-container');
    const statusText = document.getElementById('drag-status-text');
    if (!palette || !targets) return;

    // Render source labels
    palette.innerHTML = DRAG_LABELS_DATA.map(item => {
        const isPlaced = Object.values(appState.placedLabels).includes(item.id);
        const isSelected = selectedLabelForPlacement === item.id;

        if (isPlaced) {
            return `
                <span class="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-500 text-xs font-bold border border-slate-800 cursor-not-allowed">
                    ✓ ${item.label}
                </span>
            `;
        }
        return `
            <button onclick="selectDragLabel('${item.id}')" class="px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow ${
                isSelected
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-white scale-105'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/50 hover:bg-amber-500/30'
            }">
                ${item.label}
            </button>
        `;
    }).join('');

    // Render target slots
    let matchedCount = 0;
    targets.innerHTML = DRAG_LABELS_DATA.map(item => {
        const placedLabelId = appState.placedLabels[item.targetKey];
        const isMatched = placedLabelId === item.id;
        if (isMatched) matchedCount++;

        return `
            <div onclick="matchDragTarget('${item.targetKey}')" class="p-3 rounded-2xl glass-subpanel border transition-all cursor-pointer ${
                isMatched
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                    : 'border-slate-700 hover:border-amber-400 text-slate-300'
            }">
                <div class="text-[10px] text-slate-400 font-mono">Vị trí:</div>
                <div class="text-xs font-bold leading-tight pt-0.5">${item.targetDesc}</div>
                <div class="mt-2 pt-1 border-t border-slate-700/60 font-mono text-[11px] font-black ${isMatched ? 'text-emerald-400' : 'text-slate-500 italic'}">
                    ${isMatched ? `✓ ${item.label}` : 'Nhấp để đặt nhãn...'}
                </div>
            </div>
        `;
    }).join('');

    if (statusText) statusText.innerText = `Đã đúng: ${matchedCount} / ${DRAG_LABELS_DATA.length} nhãn`;

    if (matchedCount === DRAG_LABELS_DATA.length && !appState.achievements.labelMaster) {
        appState.achievements.labelMaster = true;
        AudioEngine.fanfare();
        fireConfetti();
        showToast('🏆 XUẤT SẮC! Em đã định danh chính xác 100% cấu tạo hình học!');
        if (typeof VoiceNarrator !== 'undefined' && appState.voiceEnabled) {
            VoiceNarrator.speak('Xuất sắc! Em đã định danh chính xác một trăm phần trăm toàn bộ các thành phần cấu tạo của hình nón!');
        }
    }
}

function selectDragLabel(lblId) {
    selectedLabelForPlacement = (selectedLabelForPlacement === lblId) ? null : lblId;
    AudioEngine.click();
    if (selectedLabelForPlacement && typeof VoiceNarrator !== 'undefined' && appState.voiceEnabled) {
        const item = DRAG_LABELS_DATA.find(d => d.id === lblId);
        if (item) VoiceNarrator.speak(item.label);
    }
    renderDragLabelsActivity();
}

function matchDragTarget(targetKey) {
    if (!selectedLabelForPlacement) {
        showToast('Hãy nhấp chọn một nhãn ở trên trước!');
        return;
    }

    const expectedItem = DRAG_LABELS_DATA.find(d => d.targetKey === targetKey);
    if (expectedItem && expectedItem.id === selectedLabelForPlacement) {
        appState.placedLabels[targetKey] = selectedLabelForPlacement;
        selectedLabelForPlacement = null;
        AudioEngine.success();
        showToast(`Chính xác! Gắn thành công ${expectedItem.label}.`);
        if (typeof VoiceNarrator !== 'undefined' && appState.voiceEnabled) {
            VoiceNarrator.speak('Chính xác: ' + expectedItem.label);
        }
    } else {
        AudioEngine.wrong();
        showToast('Chưa đúng vị trí này, hãy thử xem lại định nghĩa nhé!');
        if (typeof VoiceNarrator !== 'undefined' && appState.voiceEnabled) {
            VoiceNarrator.speak('Chưa đúng vị trí này. ' + (expectedItem ? expectedItem.targetDesc : ''));
        }
    }
    renderDragLabelsActivity();
}

function resetDragLabels() {
    appState.placedLabels = {};
    selectedLabelForPlacement = null;
    AudioEngine.click();
    renderDragLabelsActivity();
}

// --- Activity 4: Real-World 3D Applications (Requirement 13, 14, 15) ---
const REAL_WORLD_MODELS = {
    can: {
        id: 'can',
        title: 'Lon Nước Ngọt Tiêu Chuẩn',
        shape: 'cylinder',
        shapeName: 'Hình Trụ',
        r: 3.3,
        h: 12.0,
        unit: 'cm',
        icon: '🥫',
        badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
        problem: 'Một lon nước ngọt nhôm hình trụ có bán kính đáy r = 3.3 cm (đường kính d = 6.6 cm) và chiều cao h = 12 cm. Hãy tính dung tích chứa của lon và diện tích nhôm làm thân vỏ xung quanh.',
        calc1: 'Thể tích lon: V = π·r²·h = π · 3.3² · 12 ≈ 410.6 cm³ ≈ 410 ml (chuẩn lon nước giải khát)',
        calc2: 'Diện tích tem nhãn quấn quanh lon: S_xq = 2π·r·h = 2π · 3.3 · 12 ≈ 248.8 cm²',
        calc3: 'Diện tích nhôm làm 2 nắp đáy: 2·S_đáy = 2·(π·3.3²) ≈ 68.4 cm² → Tổng nhôm S_tp ≈ 317.2 cm²',
        practicalTip: 'Trong sản xuất công nghiệp bao bì, tỷ lệ chiều cao trên đường kính h/(2r) ≈ 1.82 giúp tối ưu hóa khả năng cầm nắm của bàn tay con người, tiết kiệm diện tích đóng thùng và chịu áp suất ga CO₂ tốt nhất.'
    },
    hat: {
        id: 'hat',
        title: 'Mũ Chóp Sinh Nhật',
        shape: 'cone',
        shapeName: 'Hình Nón',
        r: 8.0,
        h: 15.0,
        l: 17.0,
        unit: 'cm',
        icon: '🎉',
        badgeColor: 'bg-pink-950/80 text-pink-300 border-pink-500/40',
        problem: 'Chiếc nón chóp sinh nhật bằng bìa màu có bán kính vành r = 8 cm, chiều cao từ đỉnh nón đến đáy h = 15 cm. Hãy tính độ dài đường sinh l và diện tích giấy bìa cần cắt để cuộn thành mũ (không đáy).',
        calc1: 'Độ dài đường sinh nón: l = √(r² + h²) = √(8² + 15²) = √289 = 17 cm (Bộ ba Pi-ta-go 8-15-17)',
        calc2: 'Diện tích giấy bìa xung quanh: S_xq = π·r·l = π · 8 · 17 = 136π ≈ 427.3 cm²',
        calc3: 'Góc hình quạt khi cắt giấy phẳng: θ = (r / l) · 360° = (8 / 17) · 360° ≈ 169.4° (bán kính quạt R = 17 cm)',
        practicalTip: 'Khi sản xuất nón sinh nhật, xưởng in dùng máy bế cắt phôi một hình quạt tròn bán kính 17 cm góc 169.4° rồi cuộn lại và dán mép chồng 1 cm, giúp tiết kiệm tối đa phôi giấy bìa và không có mảnh thừa.'
    },
    funnel: {
        id: 'funnel',
        title: 'Phễu Rót Hóa Học Thí Nghiệm',
        shape: 'cone',
        shapeName: 'Hình Nón Úp Ngược',
        r: 5.0,
        h: 8.0,
        unit: 'cm',
        icon: '⚗️',
        badgeColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
        problem: 'Một phễu thủy tinh dùng trong phòng thí nghiệm có phần nón hình nón úp ngược với bán kính miệng phễu r = 5 cm, chiều sâu h = 8 cm. Hãy tính dung tích chứa tối đa của phễu và đường sinh.',
        calc1: 'Dung tích chứa tối đa của phễu: V = ⅓ π·r²·h = ⅓ · π · 5² · 8 ≈ 209.4 cm³ ≈ 209.4 ml',
        calc2: 'Đường sinh phễu nón: l = √(5² + 8²) = √(25 + 64) = √89 ≈ 9.43 cm',
        calc3: 'Khi dung dịch dâng lên nửa chiều sâu (h\' = 4 cm): Thể tích V\' = (½)³ · V = ⅛ · 209.4 ≈ 26.2 ml',
        practicalTip: 'Góc nghiêng của thành phễu giúp dòng chảy chất lỏng tạo thành dòng xoáy tự nhiên, tăng tốc độ thoát khí và ngăn hiện tượng tạo bọt khí gây nghẹt ống dẫn bên dưới.'
    },
    silo: {
        id: 'silo',
        title: 'Tháp Xi-Lô Thóc Nông Nghiệp',
        shape: 'cylinder',
        shapeName: 'Khối Liên Hợp (Trụ + Nón)',
        r: 4.0,
        h: 10.0,
        h_cone: 3.0,
        unit: 'm',
        icon: '🏭',
        badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
        problem: 'Một tháp xi-lô bảo quản ngũ cốc gồm phần thân hình trụ bán kính r = 4 m, chiều cao h₁ = 10 m và mái chóp nón có chiều cao h₂ = 3 m. Hãy tính tổng dung tích dự trữ thóc của tháp.',
        calc1: 'Thể tích phần thân trụ: V_trụ = π·r²·h₁ = π · 4² · 10 = 160π ≈ 502.7 m³',
        calc2: 'Thể tích phần mái chóp nón: V_nón = ⅓ π·r²·h₂ = ⅓ · π · 4² · 3 = 16π ≈ 50.3 m³',
        calc3: 'Tổng dung tích cả tháp: V_tổng = 502.7 + 50.3 = 176π ≈ 553 m³ (tương đương khoảng 415 tấn thóc)',
        practicalTip: 'Mái chóp hình nón dốc tạo góc 37° giúp nước mưa và tuyết trôi nhanh, đồng thời tạo đỉnh đối lưu để gắn quạt hút gió chống ẩm mốc hạt thóc bên trong kho.'
    },
    nonla: {
        id: 'nonla',
        title: 'Nón Lá Truyền Thống Việt Nam',
        shape: 'cone',
        shapeName: 'Hình Nón Lá',
        r: 20.0,
        h: 18.0,
        l: 26.9,
        unit: 'cm',
        icon: '🌾',
        badgeColor: 'bg-lime-950/80 text-lime-300 border-lime-500/40',
        problem: 'Chiếc nón lá truyền thống có bán kính vành đáy r = 20 cm (đường kính vành 40 cm), chiều cao từ đỉnh nón đến tâm đáy h = 18 cm. Tính độ dài đường sinh nón và diện tích lá cọ cần xếp phủ xung quanh nón.',
        calc1: 'Độ dài đường sinh chiếc nón: l = √(r² + h²) = √(20² + 18²) = √724 ≈ 26.9 cm',
        calc2: 'Diện tích lá cọ phủ xung quanh: S_xq = π·r·l = π · 20 · 26.9 ≈ 1690.8 cm² ≈ 0.17 m²',
        calc3: '16 vành nón bằng tre uốn tròn: vành lớn nhất chu vi C = 2π·20 ≈ 125.7 cm, vành nhỏ nhất bán kính 2 cm',
        practicalTip: 'Nghệ nhân chằm nón luôn sử dụng đúng 16 vành tre chuốt tròn thanh mảnh. Con số 16 tượng trưng cho nét đẹp tròn đầy tuổi trăng tròn và tạo độ cong hoàn hảo che mưa nắng cho người phụ nữ Việt Nam.'
    },
    icecream: {
        id: 'icecream',
        title: 'Kem Ốc Quế Giòn Ngọt',
        shape: 'cone',
        shapeName: 'Hình Nón + Bán Cầu',
        r: 3.0,
        h: 10.0,
        unit: 'cm',
        icon: '🍦',
        badgeColor: 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-500/40',
        problem: 'Một cây kem ốc quế gồm vỏ bánh hình nón có bán kính miệng r = 3 cm, chiều cao h = 10 cm. Bên trên nắp một viên kem hình bán cầu cùng bán kính r = 3 cm. Tính tổng thể tích kem và vỏ ốc quế.',
        calc1: 'Thể tích phần vỏ nón ốc quế: V_nón = ⅓ π·r²·h = ⅓ · π · 3² · 10 = 30π ≈ 94.25 cm³',
        calc2: 'Thể tích viên kem bán cầu bên trên: V_bán_cầu = ⅔ π·r³ = ⅔ · π · 3³ = 18π ≈ 56.55 cm³',
        calc3: 'Tổng thể tích món kem: V_tổng = 94.25 + 56.55 = 48π ≈ 150.8 cm³',
        practicalTip: 'Cấu trúc nón nhọn ở đáy cho phép người ăn cầm gọn bằng một tay mà không bị tràn kem ra ngoài. Lớp bánh quế nướng hoa văn mắt cáo tăng độ cứng chịu lực khi múc kem.'
    }
};

function getRealWorldSvg(key, tab = 'realistic') {
    const m = REAL_WORLD_MODELS[key] || REAL_WORLD_MODELS['can'];

    if (key === 'can') {
        if (tab === 'blueprint') {
            return `
            <svg viewBox="0 0 460 300" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="grid-can" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" stroke-width="0.8"/>
                    </pattern>
                </defs>
                <rect width="460" height="300" rx="16" fill="#0b1329"/>
                <rect width="460" height="300" rx="16" fill="url(#grid-can)"/>
                
                <!-- Blueprint Cylinder Cross Section -->
                <rect x="130" y="55" width="130" height="180" fill="rgba(56, 189, 248, 0.08)" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="0"/>
                
                <!-- Center Axis -->
                <line x1="195" y1="35" x2="195" y2="255" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6 4"/>
                <circle cx="195" cy="55" r="4.5" fill="#f59e0b"/>
                <circle cx="195" cy="235" r="4.5" fill="#f59e0b"/>
                <text x="180" y="50" fill="#f59e0b" font-size="12" font-weight="900">O'</text>
                <text x="180" y="250" fill="#f59e0b" font-size="12" font-weight="900">O</text>
                
                <!-- Right Angle Marker -->
                <path d="M 195 220 L 210 220 L 210 235" fill="none" stroke="#f59e0b" stroke-width="1.8"/>
                
                <!-- Radius line -->
                <line x1="195" y1="235" x2="260" y2="235" stroke="#ec4899" stroke-width="3"/>
                <circle cx="260" cy="235" r="4" fill="#ec4899"/>
                <text x="220" y="226" fill="#ec4899" font-size="12" font-weight="900">r = 3.3 cm</text>
                
                <!-- Top Diameter line -->
                <line x1="130" y1="55" x2="260" y2="55" stroke="#38bdf8" stroke-width="2"/>
                <text x="170" y="75" fill="#38bdf8" font-size="11" font-weight="bold">2r = 6.6 cm</text>
                
                <!-- Height Dimension Line -->
                <line x1="285" y1="55" x2="285" y2="235" stroke="#38bdf8" stroke-width="2"/>
                <polygon points="285,55 281,67 289,67" fill="#38bdf8"/>
                <polygon points="285,235 281,223 289,223" fill="#38bdf8"/>
                <text x="295" y="150" fill="#38bdf8" font-size="13" font-weight="900">h = 12 cm</text>
                
                <!-- Formulas badge -->
                <g transform="translate(325, 65)">
                    <rect width="125" height="160" rx="10" fill="rgba(15, 23, 42, 0.9)" stroke="#334155" stroke-width="1.2"/>
                    <text x="12" y="25" fill="#38bdf8" font-size="11" font-weight="bold">BẢN VẼ HÌNH TRỤ</text>
                    <text x="12" y="55" fill="#94a3b8" font-size="10">Trục: OO' = 12 cm</text>
                    <text x="12" y="78" fill="#ec4899" font-size="10" font-weight="bold">Bán kính: r = 3.3 cm</text>
                    <text x="12" y="105" fill="#f59e0b" font-size="10" font-weight="bold">S_đáy = πr²</text>
                    <text x="12" y="125" fill="#34d399" font-size="10" font-weight="bold">S_xq = 2πrh</text>
                    <text x="12" y="145" fill="#38bdf8" font-size="10" font-weight="bold">V = πr²h ≈ 410.6 ml</text>
                </g>
            </svg>`;
        } else if (tab === 'net') {
            return `
            <svg viewBox="0 0 460 300" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <rect width="460" height="300" rx="16" fill="#091322"/>
                <!-- Top Base Circle -->
                <circle cx="160" cy="50" r="32" fill="rgba(244, 63, 94, 0.25)" stroke="#f43f5e" stroke-width="2.5"/>
                <line x1="160" y1="50" x2="192" y2="50" stroke="#f43f5e" stroke-width="2"/>
                <text x="162" y="44" fill="#f43f5e" font-size="10" font-weight="bold">r = 3.3</text>
                <text x="205" y="54" fill="#fca5a5" font-size="11" font-weight="bold">Đáy trên: S₁ ≈ 34.2 cm²</text>
                
                <!-- Unrolled Lateral Rectangle -->
                <rect x="65" y="95" width="280" height="120" rx="4" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" stroke-width="2.5"/>
                <!-- Width arrow -->
                <line x1="65" y1="85" x2="345" y2="85" stroke="#38bdf8" stroke-width="2"/>
                <polygon points="65,85 75,81 75,89" fill="#38bdf8"/>
                <polygon points="345,85 335,81 335,89" fill="#38bdf8"/>
                <text x="145" y="78" fill="#38bdf8" font-size="12" font-weight="900">Chu vi đáy: C = 2πr ≈ 20.73 cm</text>
                
                <!-- Height arrow -->
                <line x1="365" y1="95" x2="365" y2="215" stroke="#f59e0b" stroke-width="2"/>
                <polygon points="365,95 361,105 369,105" fill="#f59e0b"/>
                <polygon points="365,215 361,205 369,205" fill="#f59e0b"/>
                <text x="375" y="160" fill="#f59e0b" font-size="12" font-weight="900">h = 12 cm</text>
                
                <text x="120" y="160" fill="#e2e8f0" font-size="14" font-weight="900">MẶT XUNG QUANH (TEM NHÃN LON)</text>
                <text x="150" y="180" fill="#38bdf8" font-size="12" font-weight="bold">S_xq = 20.73 × 12 ≈ 248.8 cm²</text>
                
                <!-- Bottom Base Circle -->
                <circle cx="160" cy="255" r="32" fill="rgba(244, 63, 94, 0.25)" stroke="#f43f5e" stroke-width="2.5"/>
                <text x="205" y="259" fill="#fca5a5" font-size="11" font-weight="bold">Đáy dưới: S₂ ≈ 34.2 cm²</text>
                <text x="205" y="275" fill="#34d399" font-size="11" font-weight="900">Tổng nhôm: S_tp = S_xq + 2S_đ ≈ 317.2 cm²</text>
            </svg>`;
        }
        // Realistic view for Can
        return `
        <svg viewBox="0 0 460 300" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="canBody" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#991b1b"/>
                    <stop offset="22%" stop-color="#ef4444"/>
                    <stop offset="45%" stop-color="#fca5a5"/>
                    <stop offset="65%" stop-color="#dc2626"/>
                    <stop offset="90%" stop-color="#7f1d1d"/>
                    <stop offset="100%" stop-color="#450a0a"/>
                </linearGradient>
                <linearGradient id="canRim" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#cbd5e1"/>
                    <stop offset="30%" stop-color="#f8fafc"/>
                    <stop offset="70%" stop-color="#94a3b8"/>
                    <stop offset="100%" stop-color="#475569"/>
                </linearGradient>
                <radialGradient id="canGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="rgba(239, 68, 68, 0.25)"/>
                    <stop offset="100%" stop-color="rgba(15, 23, 42, 0)"/>
                </radialGradient>
            </defs>
            <rect width="460" height="300" rx="16" fill="#070d19"/>
            <circle cx="210" cy="150" r="140" fill="url(#canGlow)"/>
            
            <!-- Can Shadow -->
            <ellipse cx="210" cy="255" rx="70" ry="14" fill="rgba(0, 0, 0, 0.6)"/>
            
            <!-- Can Body -->
            <rect x="150" y="65" width="120" height="175" rx="6" fill="url(#canBody)"/>
            
            <!-- Bottom Rim -->
            <ellipse cx="210" cy="240" rx="60" ry="14" fill="url(#canRim)"/>
            <ellipse cx="210" cy="240" rx="55" ry="11" fill="#64748b"/>
            
            <!-- Can Graphic / Branding -->
            <path d="M 150 120 Q 210 105 270 120 L 270 185 Q 210 200 150 185 Z" fill="rgba(255,255,255,0.15)"/>
            <path d="M 150 145 Q 210 130 270 145" stroke="#fef08a" stroke-width="4" fill="none"/>
            <text x="210" y="145" text-anchor="middle" fill="#ffffff" font-size="22" font-weight="900" letter-spacing="1">COLA MATH</text>
            <text x="210" y="165" text-anchor="middle" fill="#fef08a" font-size="11" font-weight="900">330 ml • 100% THỰC TẾ</text>
            <text x="210" y="180" text-anchor="middle" fill="#ffffff" font-size="9" font-weight="bold">HÌNH TRỤ CHUẨN KỸ THUẬT</text>
            
            <!-- Water Condensation Droplets -->
            <circle cx="170" cy="100" r="2.5" fill="#ffffff" opacity="0.8"/>
            <circle cx="175" cy="105" r="1.8" fill="#ffffff" opacity="0.7"/>
            <circle cx="245" cy="130" r="3" fill="#ffffff" opacity="0.85"/>
            <circle cx="248" cy="138" r="2" fill="#ffffff" opacity="0.6"/>
            <circle cx="190" cy="210" r="2.5" fill="#ffffff" opacity="0.8"/>
            
            <!-- Top Rim (3D Perspective) -->
            <ellipse cx="210" cy="65" rx="60" ry="14" fill="url(#canRim)"/>
            <ellipse cx="210" cy="65" rx="53" ry="11" fill="#475569"/>
            <ellipse cx="210" cy="66" rx="48" ry="9" fill="#94a3b8"/>
            
            <!-- Pull Tab -->
            <path d="M 205 63 L 222 61 L 220 67 L 203 69 Z" fill="#f8fafc" stroke="#334155" stroke-width="0.8"/>
            <circle cx="206" cy="66" r="2.5" fill="#475569"/>
            
            <!-- Dimension Lines & Callouts -->
            <!-- Height (h = 12 cm) -->
            <line x1="295" y1="65" x2="295" y2="240" stroke="#38bdf8" stroke-width="2"/>
            <polygon points="295,65 290,77 300,77" fill="#38bdf8"/>
            <polygon points="295,240 290,228 300,228" fill="#38bdf8"/>
            <rect x="305" y="138" width="85" height="28" rx="6" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
            <text x="347" y="156" text-anchor="middle" fill="#38bdf8" font-size="12" font-weight="900">h = 12 cm</text>
            
            <!-- Radius / Diameter on top -->
            <line x1="150" y1="38" x2="270" y2="38" stroke="#f59e0b" stroke-width="2"/>
            <polygon points="150,38 160,34 160,42" fill="#f59e0b"/>
            <polygon points="270,38 260,34 260,42" fill="#f59e0b"/>
            <rect x="160" y="16" width="100" height="20" rx="5" fill="#0f172a" stroke="#f59e0b" stroke-width="1.2"/>
            <text x="210" y="30" text-anchor="middle" fill="#f59e0b" font-size="10.5" font-weight="900">2r = 6.6 cm (r = 3.3)</text>
            
            <!-- Volume Indicator Badge -->
            <g transform="translate(20, 215)">
                <rect width="115" height="58" rx="10" fill="rgba(15, 23, 42, 0.9)" stroke="#10b981" stroke-width="1.5"/>
                <text x="10" y="20" fill="#34d399" font-size="10" font-weight="900">DUNG TÍCH LON</text>
                <text x="10" y="38" fill="#ffffff" font-size="14" font-weight="900">V ≈ 410.6 ml</text>
                <text x="10" y="50" fill="#94a3b8" font-size="8.5">Chuẩn lon nước ngọt</text>
            </g>
        </svg>`;
    }

    if (key === 'hat') {
        if (tab === 'blueprint') {
            return `
            <svg viewBox="0 0 460 300" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <rect width="460" height="300" rx="16" fill="#0b1329"/>
                <!-- Center Triangle SAB -->
                <polygon points="210,40 120,230 300,230" fill="rgba(236, 72, 153, 0.12)" stroke="#ec4899" stroke-width="2.5"/>
                
                <!-- Center Axis SO -->
                <line x1="210" y1="40" x2="210" y2="230" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="6 4"/>
                <circle cx="210" cy="40" r="5" fill="#f59e0b"/>
                <circle cx="210" cy="230" r="5" fill="#f59e0b"/>
                <circle cx="300" cy="230" r="5" fill="#ec4899"/>
                <text x="205" y="30" fill="#f59e0b" font-size="14" font-weight="900">S (Đỉnh)</text>
                <text x="202" y="250" fill="#f59e0b" font-size="14" font-weight="900">O</text>
                <text x="305" y="240" fill="#ec4899" font-size="13" font-weight="900">B</text>
                
                <!-- Right angle at O -->
                <path d="M 210 215 L 225 215 L 225 230" fill="none" stroke="#f59e0b" stroke-width="2"/>
                
                <!-- Shaded Right Triangle SOB -->
                <polygon points="210,40 210,230 300,230" fill="rgba(245, 158, 11, 0.2)"/>
                
                <!-- Dimensions -->
                <text x="160" y="145" fill="#38bdf8" font-size="13" font-weight="900">h = 15 cm</text>
                <text x="235" y="222" fill="#f59e0b" font-size="12" font-weight="900">r = 8 cm</text>
                <text x="270" y="130" fill="#ec4899" font-size="13" font-weight="900">l = 17 cm</text>
                
                <!-- Pythagorean Card -->
                <g transform="translate(325, 60)">
                    <rect width="125" height="170" rx="10" fill="rgba(15, 23, 42, 0.9)" stroke="#ec4899" stroke-width="1.2"/>
                    <text x="10" y="24" fill="#ec4899" font-size="11" font-weight="bold">TAM GIÁC VUÔNG SOB</text>
                    <text x="10" y="52" fill="#ffffff" font-size="10" font-weight="bold">l² = r² + h²</text>
                    <text x="10" y="74" fill="#f59e0b" font-size="10">8² + 15² = 64 + 225</text>
                    <text x="10" y="96" fill="#34d399" font-size="10" font-weight="900">= 289 = 17²</text>
                    <text x="10" y="125" fill="#38bdf8" font-size="10" font-weight="bold">→ l = 17 cm</text>
                    <text x="10" y="150" fill="#cbd5e1" font-size="9">(Bộ 3 Pi-ta-go đẹp)</text>
                </g>
            </svg>`;
        } else if (tab === 'net') {
            return `
            <svg viewBox="0 0 460 300" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <rect width="460" height="300" rx="16" fill="#091322"/>
                <!-- Sector of Cone Net -->
                <path d="M 230 70 L 375 185 A 175 175 0 0 1 85 185 Z" fill="rgba(236, 72, 153, 0.25)" stroke="#ec4899" stroke-width="2.5"/>
                <circle cx="230" cy="70" r="5" fill="#f59e0b"/>
                <text x="225" y="55" fill="#f59e0b" font-size="13" font-weight="900">Đỉnh S</text>
                
                <!-- Angle Arc -->
                <path d="M 260 93 A 40 40 0 0 1 200 93" fill="none" stroke="#f59e0b" stroke-width="2"/>
                <text x="205" y="125" fill="#fde047" font-size="12" font-weight="900">θ ≈ 169.4°</text>
                
                <!-- Slant radius -->
                <line x1="230" y1="70" x2="375" y2="185" stroke="#ec4899" stroke-width="2"/>
                <text x="315" y="115" fill="#ec4899" font-size="12" font-weight="900">R = l = 17 cm</text>
                
                <!-- Arc length -->
                <text x="155" y="240" fill="#38bdf8" font-size="13" font-weight="900">Độ dài cung quạt: C = 2πr = 16π ≈ 50.3 cm</text>
                <text x="175" y="265" fill="#34d399" font-size="12" font-weight="bold">Diện tích giấy bìa: S_xq = π·r·l ≈ 427.3 cm²</text>
            </svg>`;
        }
        // Realistic Party Hat
        return `
        <svg viewBox="0 0 460 300" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="hatGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#701a75"/>
                    <stop offset="35%" stop-color="#d946ef"/>
                    <stop offset="70%" stop-color="#ec4899"/>
                    <stop offset="100%" stop-color="#831843"/>
                </linearGradient>
                <radialGradient id="hatGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="rgba(217, 70, 239, 0.3)"/>
                    <stop offset="100%" stop-color="rgba(15, 23, 42, 0)"/>
                </radialGradient>
            </defs>
            <rect width="460" height="300" rx="16" fill="#070c18"/>
            <circle cx="210" cy="150" r="140" fill="url(#hatGlow)"/>
            
            <!-- Confetti Stars floating -->
            <polygon points="80,50 83,58 92,59 85,65 87,74 80,69 73,74 75,65 68,59 77,58" fill="#fde047"/>
            <polygon points="340,70 342,75 348,76 343,80 345,86 340,82 335,86 337,80 332,76 338,75" fill="#38bdf8"/>
            <polygon points="360,200 362,205 368,206 363,210 365,216 360,212 355,216 357,210 352,206 358,205" fill="#f43f5e"/>
            
            <!-- Base Rim Ellipse (Shadow & Base) -->
            <ellipse cx="210" cy="235" rx="80" ry="18" fill="rgba(0,0,0,0.5)"/>
            
            <!-- Party Hat Cone Body -->
            <path d="M 210 50 L 130 235 A 80 18 0 0 0 290 235 Z" fill="url(#hatGrad)"/>
            
            <!-- Spiral Decorative Stripes -->
            <path d="M 190 90 Q 210 100 230 90" stroke="#fef08a" stroke-width="6" fill="none"/>
            <path d="M 170 135 Q 210 150 250 135" stroke="#38bdf8" stroke-width="7" fill="none"/>
            <path d="M 150 185 Q 210 205 270 185" stroke="#4ade80" stroke-width="8" fill="none"/>
            
            <!-- Golden Stars on Hat -->
            <polygon points="210,110 212,116 218,117 213,121 215,127 210,123 205,127 207,121 202,117 208,116" fill="#fef08a"/>
            <polygon points="185,160 187,165 192,166 188,170 190,175 185,172 180,175 182,170 178,166 183,165" fill="#ffffff"/>
            <polygon points="235,160 237,165 242,166 238,170 240,175 235,172 230,175 232,170 228,166 233,165" fill="#ffffff"/>
            
            <!-- Fluffy Pom-Pom at Apex -->
            <circle cx="210" cy="50" r="14" fill="#fef08a" filter="drop-shadow(0 0 8px rgba(254, 240, 138, 0.8))"/>
            <circle cx="206" cy="46" r="10" fill="#fde047"/>
            <circle cx="214" cy="52" r="7" fill="#eab308"/>
            
            <!-- Base Scalloped Fringe -->
            <ellipse cx="210" cy="235" rx="80" ry="18" fill="none" stroke="#fef08a" stroke-width="3.5" stroke-dasharray="8 6"/>
            
            <!-- Elastic Chin Cord -->
            <path d="M 135 235 Q 210 280 285 235" stroke="#e2e8f0" stroke-width="1.8" stroke-dasharray="4 3" fill="none"/>
            <text x="210" y="278" text-anchor="middle" fill="#94a3b8" font-size="10">Dây quai nón co giãn</text>
            
            <!-- Dimension Annotations -->
            <!-- Slant line l = 17 cm -->
            <line x1="225" y1="50" x2="305" y2="235" stroke="#f43f5e" stroke-width="2.5"/>
            <rect x="280" y="125" width="85" height="26" rx="6" fill="#0f172a" stroke="#f43f5e" stroke-width="1.5"/>
            <text x="322" y="142" text-anchor="middle" fill="#f43f5e" font-size="12" font-weight="900">l = 17 cm</text>
            
            <!-- Height h = 15 cm -->
            <line x1="210" y1="50" x2="210" y2="235" stroke="#38bdf8" stroke-width="2" stroke-dasharray="5 3"/>
            <text x="160" y="140" fill="#38bdf8" font-size="12" font-weight="900">h = 15 cm</text>
            
            <!-- Radius r = 8 cm -->
            <line x1="210" y1="235" x2="290" y2="235" stroke="#f59e0b" stroke-width="2.5"/>
            <text x="235" y="226" fill="#f59e0b" font-size="11" font-weight="900">r = 8 cm</text>
        </svg>`;
    }

    if (key === 'funnel') {
        if (tab === 'blueprint') {
            return `
            <svg viewBox="0 0 460 300" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <rect width="460" height="300" rx="16" fill="#0b1329"/>
                <!-- Inverted cone cross section -->
                <polygon points="210,210 130,65 290,65" fill="rgba(6, 182, 212, 0.12)" stroke="#06b6d4" stroke-width="2.5"/>
                <!-- Stem tube -->
                <rect x="203" y="210" width="14" height="60" fill="rgba(6, 182, 212, 0.15)" stroke="#06b6d4" stroke-width="2"/>
                
                <!-- Center Axis -->
                <line x1="210" y1="45" x2="210" y2="275" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6 4"/>
                <circle cx="210" cy="65" r="4.5" fill="#f59e0b"/>
                <text x="215" y="60" fill="#f59e0b" font-size="12" font-weight="bold">O (Tâm miệng)</text>
                
                <!-- Dimensions -->
                <line x1="210" y1="65" x2="290" y2="65" stroke="#f59e0b" stroke-width="3"/>
                <text x="235" y="58" fill="#f59e0b" font-size="12" font-weight="900">r = 5 cm</text>
                
                <line x1="310" y1="65" x2="310" y2="210" stroke="#38bdf8" stroke-width="2"/>
                <polygon points="310,65 306,77 314,77" fill="#38bdf8"/>
                <polygon points="310,210 306,198 314,198" fill="#38bdf8"/>
                <text x="320" y="145" fill="#38bdf8" font-size="12" font-weight="900">h = 8 cm</text>
                
                <text x="220" y="150" fill="#ec4899" font-size="11" font-weight="bold">l = √89 ≈ 9.43 cm</text>
                
                <!-- Calculations info -->
                <g transform="translate(325, 60)">
                    <rect width="125" height="150" rx="10" fill="rgba(15, 23, 42, 0.9)" stroke="#06b6d4" stroke-width="1.2"/>
                    <text x="10" y="24" fill="#06b6d4" font-size="10.5" font-weight="bold">PHỄU NÓN ÚP NGƯỢC</text>
                    <text x="10" y="52" fill="#ffffff" font-size="10">V = ⅓ π·r²·h</text>
                    <text x="10" y="74" fill="#f59e0b" font-size="10">= ⅓ π · 5² · 8</text>
                    <text x="10" y="96" fill="#34d399" font-size="11" font-weight="900">≈ 209.4 cm³</text>
                    <text x="10" y="120" fill="#38bdf8" font-size="10">Dung tích: ~209 ml</text>
                </g>
            </svg>`;
        }
        // Realistic Glass Funnel
        return `
        <svg viewBox="0 0 460 300" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="rgba(148, 163, 184, 0.4)"/>
                    <stop offset="25%" stop-color="rgba(255, 255, 255, 0.7)"/>
                    <stop offset="60%" stop-color="rgba(56, 189, 248, 0.25)"/>
                    <stop offset="100%" stop-color="rgba(15, 23, 42, 0.4)"/>
                </linearGradient>
                <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#0891b2"/>
                    <stop offset="50%" stop-color="#06b6d4"/>
                    <stop offset="100%" stop-color="#0e7490"/>
                </linearGradient>
            </defs>
            <rect width="460" height="300" rx="16" fill="#060c18"/>
            
            <!-- Funnel Inverted Cone Body -->
            <path d="M 130 65 L 202 210 L 202 265 L 218 265 L 218 210 L 290 65 Z" fill="url(#glassGrad)" stroke="rgba(255,255,255,0.6)" stroke-width="2"/>
            
            <!-- Liquid inside Funnel -->
            <path d="M 155 110 L 204 210 L 204 265 L 216 265 L 216 210 L 265 110 Z" fill="url(#liquidGrad)" opacity="0.85"/>
            <!-- Meniscus curve -->
            <ellipse cx="210" cy="110" rx="55" ry="11" fill="#38bdf8" opacity="0.9"/>
            
            <!-- Glass Specular Reflection Highlight -->
            <path d="M 140 70 L 204 205" stroke="rgba(255,255,255,0.85)" stroke-width="3" stroke-linecap="round"/>
            
            <!-- Graduation Marks on Glass -->
            <line x1="200" y1="130" x2="215" y2="130" stroke="#ffffff" stroke-width="1.5"/>
            <text x="220" y="133" fill="#ffffff" font-size="9" font-weight="bold">150 ml</text>
            <line x1="202" y1="160" x2="214" y2="160" stroke="#ffffff" stroke-width="1.5"/>
            <text x="220" y="163" fill="#ffffff" font-size="9" font-weight="bold">100 ml</text>
            <line x1="205" y1="185" x2="213" y2="185" stroke="#ffffff" stroke-width="1.5"/>
            <text x="220" y="188" fill="#ffffff" font-size="9" font-weight="bold">50 ml</text>
            
            <!-- Top Funnel Rim -->
            <ellipse cx="210" cy="65" rx="80" ry="16" fill="rgba(255,255,255,0.15)" stroke="#38bdf8" stroke-width="2.5"/>
            
            <!-- Droplet falling from stem -->
            <path d="M 210 274 Q 215 282 210 286 Q 205 282 210 274 Z" fill="#38bdf8"/>
            
            <!-- Dimensions -->
            <line x1="210" y1="65" x2="290" y2="65" stroke="#f59e0b" stroke-width="2.5"/>
            <text x="235" y="55" fill="#f59e0b" font-size="12" font-weight="900">r = 5 cm</text>
            
            <line x1="310" y1="65" x2="310" y2="210" stroke="#38bdf8" stroke-width="2"/>
            <polygon points="310,65 306,77 314,77" fill="#38bdf8"/>
            <polygon points="310,210 306,198 314,198" fill="#38bdf8"/>
            <text x="320" y="145" fill="#38bdf8" font-size="12" font-weight="900">h = 8 cm</text>
            
            <!-- Capacity Badge -->
            <g transform="translate(25, 60)">
                <rect width="105" height="52" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="#06b6d4" stroke-width="1.2"/>
                <text x="10" y="20" fill="#06b6d4" font-size="9.5" font-weight="900">DUNG TÍCH TỐI ĐA</text>
                <text x="10" y="38" fill="#ffffff" font-size="13" font-weight="900">V ≈ 209.4 ml</text>
            </g>
        </svg>`;
    }

    if (key === 'silo') {
        if (tab === 'blueprint') {
            return `
            <svg viewBox="0 0 460 300" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <rect width="460" height="300" rx="16" fill="#0b1329"/>
                <!-- Upper Cone Roof -->
                <polygon points="210,40 140,90 280,90" fill="rgba(245, 158, 11, 0.2)" stroke="#f59e0b" stroke-width="2.5"/>
                <!-- Lower Cylinder Body -->
                <rect x="140" y="90" width="140" height="150" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" stroke-width="2.5"/>
                
                <!-- Center Axis -->
                <line x1="210" y1="25" x2="210" y2="255" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6 4"/>
                
                <!-- Dimensions -->
                <line x1="300" y1="40" x2="300" y2="90" stroke="#f59e0b" stroke-width="2"/>
                <text x="310" y="70" fill="#f59e0b" font-size="11" font-weight="bold">h₂ = 3 m (mái nón)</text>
                
                <line x1="300" y1="90" x2="300" y2="240" stroke="#38bdf8" stroke-width="2"/>
                <text x="310" y="170" fill="#38bdf8" font-size="11" font-weight="bold">h₁ = 10 m (thân trụ)</text>
                
                <line x1="210" y1="90" x2="280" y2="90" stroke="#ec4899" stroke-width="2.5"/>
                <text x="225" y="82" fill="#ec4899" font-size="11" font-weight="900">r = 4 m</text>
                
                <!-- Formulas summary -->
                <g transform="translate(15, 60)">
                    <rect width="115" height="155" rx="10" fill="rgba(15, 23, 42, 0.9)" stroke="#f59e0b" stroke-width="1.2"/>
                    <text x="10" y="24" fill="#f59e0b" font-size="10" font-weight="bold">THỂ TÍCH KHỐI GHÉP</text>
                    <text x="10" y="52" fill="#38bdf8" font-size="9.5">V_trụ = π·4²·10</text>
                    <text x="10" y="70" fill="#38bdf8" font-size="10" font-weight="bold">≈ 502.7 m³</text>
                    <text x="10" y="95" fill="#f59e0b" font-size="9.5">V_nón = ⅓ π·4²·3</text>
                    <text x="10" y="113" fill="#f59e0b" font-size="10" font-weight="bold">≈ 50.3 m³</text>
                    <text x="10" y="138" fill="#34d399" font-size="10.5" font-weight="900">V_tổng ≈ 553 m³</text>
                </g>
            </svg>`;
        }
        // Realistic Grain Silo
        return `
        <svg viewBox="0 0 460 300" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="siloMetal" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#64748b"/>
                    <stop offset="30%" stop-color="#cbd5e1"/>
                    <stop offset="70%" stop-color="#94a3b8"/>
                    <stop offset="100%" stop-color="#475569"/>
                </linearGradient>
                <linearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#b45309"/>
                    <stop offset="50%" stop-color="#f59e0b"/>
                    <stop offset="100%" stop-color="#78350f"/>
                </linearGradient>
            </defs>
            <rect width="460" height="300" rx="16" fill="#080e1a"/>
            
            <!-- Background Farm Field Horizon -->
            <rect x="0" y="220" width="460" height="80" rx="0" fill="#064e3b" opacity="0.5"/>
            <path d="M 0 220 Q 230 200 460 220 L 460 300 L 0 300 Z" fill="#047857" opacity="0.3"/>
            
            <!-- Silo Lower Base Shadow -->
            <ellipse cx="210" cy="245" rx="75" ry="14" fill="rgba(0,0,0,0.6)"/>
            
            <!-- Cylindrical Steel Body -->
            <rect x="145" y="90" width="130" height="150" fill="url(#siloMetal)"/>
            
            <!-- Corrugated Metal Ridges (Horizontal Lines) -->
            <line x1="145" y1="110" x2="275" y2="110" stroke="#334155" stroke-width="1.5"/>
            <line x1="145" y1="130" x2="275" y2="130" stroke="#334155" stroke-width="1.5"/>
            <line x1="145" y1="150" x2="275" y2="150" stroke="#334155" stroke-width="1.5"/>
            <line x1="145" y1="170" x2="275" y2="170" stroke="#334155" stroke-width="1.5"/>
            <line x1="145" y1="190" x2="275" y2="190" stroke="#334155" stroke-width="1.5"/>
            <line x1="145" y1="210" x2="275" y2="210" stroke="#334155" stroke-width="1.5"/>
            
            <!-- Silo Cutaway Inspection Window with Golden Grain -->
            <rect x="185" y="125" width="50" height="80" rx="6" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
            <rect x="188" y="145" width="44" height="58" fill="#f59e0b" opacity="0.85"/>
            <text x="210" y="140" text-anchor="middle" fill="#fde047" font-size="8" font-weight="bold">THÓC VÀNG</text>
            <text x="210" y="175" text-anchor="middle" fill="#451a03" font-size="10" font-weight="900">415 TẤN</text>
            
            <!-- Conical Roof -->
            <path d="M 210 38 L 140 90 A 70 14 0 0 0 280 90 Z" fill="url(#roofGrad)"/>
            
            <!-- Ventilator Cap on Peak -->
            <rect x="206" y="28" width="8" height="10" fill="#cbd5e1"/>
            <ellipse cx="210" cy="28" rx="7" ry="3" fill="#94a3b8"/>
            
            <!-- Inspection Ladder on Right -->
            <line x1="262" y1="90" x2="262" y2="240" stroke="#ffffff" stroke-width="1.8"/>
            <line x1="268" y1="90" x2="268" y2="240" stroke="#ffffff" stroke-width="1.8"/>
            <line x1="262" y1="105" x2="268" y2="105" stroke="#ffffff" stroke-width="1.5"/>
            <line x1="262" y1="125" x2="268" y2="125" stroke="#ffffff" stroke-width="1.5"/>
            <line x1="262" y1="145" x2="268" y2="145" stroke="#ffffff" stroke-width="1.5"/>
            <line x1="262" y1="165" x2="268" y2="165" stroke="#ffffff" stroke-width="1.5"/>
            <line x1="262" y1="185" x2="268" y2="185" stroke="#ffffff" stroke-width="1.5"/>
            
            <!-- Dimensions -->
            <line x1="295" y1="38" x2="295" y2="90" stroke="#f59e0b" stroke-width="2"/>
            <text x="305" y="68" fill="#f59e0b" font-size="11" font-weight="bold">h_nón = 3m</text>
            
            <line x1="295" y1="90" x2="295" y2="240" stroke="#38bdf8" stroke-width="2"/>
            <text x="305" y="170" fill="#38bdf8" font-size="11" font-weight="bold">h_trụ = 10m</text>
            
            <line x1="210" y1="90" x2="280" y2="90" stroke="#ec4899" stroke-width="2"/>
            <text x="228" y="82" fill="#ec4899" font-size="11" font-weight="900">r = 4 m</text>
            
            <!-- Badge -->
            <g transform="translate(15, 60)">
                <rect width="115" height="54" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="#f59e0b" stroke-width="1.2"/>
                <text x="10" y="20" fill="#f59e0b" font-size="9" font-weight="bold">TỔNG THỂ TÍCH</text>
                <text x="10" y="38" fill="#ffffff" font-size="14" font-weight="900">553 m³</text>
                <text x="10" y="49" fill="#94a3b8" font-size="8">Trụ 503 + Nón 50</text>
            </g>
        </svg>`;
    }

    if (key === 'nonla') {
        // Vietnamese Conical Hat
        return `
        <svg viewBox="0 0 460 300" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#d97706"/>
                    <stop offset="30%" stop-color="#fef3c7"/>
                    <stop offset="60%" stop-color="#fde68a"/>
                    <stop offset="100%" stop-color="#b45309"/>
                </linearGradient>
            </defs>
            <rect width="460" height="300" rx="16" fill="#080e16"/>
            
            <!-- Shadow -->
            <ellipse cx="210" cy="245" rx="100" ry="20" fill="rgba(0,0,0,0.5)"/>
            
            <!-- Conical Hat Leaf Body -->
            <path d="M 210 50 L 105 235 A 105 20 0 0 0 315 235 Z" fill="url(#leafGrad)"/>
            
            <!-- 16 Bamboo Rings (Concentric Ellipses) -->
            ${[0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95].map(t => {
                const y = 50 + t * 185;
                const rx = t * 105;
                const ry = t * 20;
                return `<ellipse cx="210" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="#78350f" stroke-width="1.2" opacity="0.6"/>`;
            }).join('')}
            
            <!-- Silk Chin Strap (Quai Nón Lụa Hồng) -->
            <path d="M 120 235 Q 210 285 295 235" stroke="#f472b6" stroke-width="4" fill="none"/>
            <circle cx="210" cy="275" r="4" fill="#f43f5e"/>
            <text x="210" y="292" text-anchor="middle" fill="#f472b6" font-size="10" font-weight="bold">Quai lụa mềm mại</text>
            
            <!-- Dimensions -->
            <line x1="210" y1="50" x2="210" y2="235" stroke="#38bdf8" stroke-width="2" stroke-dasharray="5 3"/>
            <text x="150" y="145" fill="#38bdf8" font-size="12" font-weight="900">h = 18 cm</text>
            
            <line x1="210" y1="235" x2="315" y2="235" stroke="#f59e0b" stroke-width="2.5"/>
            <text x="245" y="226" fill="#f59e0b" font-size="12" font-weight="900">r = 20 cm</text>
            
            <line x1="225" y1="50" x2="330" y2="235" stroke="#ec4899" stroke-width="2.5"/>
            <text x="290" y="130" fill="#ec4899" font-size="12" font-weight="900">l ≈ 26.9 cm</text>
            
            <!-- Cultural Badge -->
            <g transform="translate(15, 60)">
                <rect width="120" height="58" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="#84cc16" stroke-width="1.2"/>
                <text x="10" y="20" fill="#a3e635" font-size="10" font-weight="bold">NÓN LÁ 16 VÀNH</text>
                <text x="10" y="38" fill="#ffffff" font-size="13" font-weight="900">S_xq ≈ 1690 cm²</text>
                <text x="10" y="50" fill="#94a3b8" font-size="8.5">Nét đẹp văn hóa Việt</text>
            </g>
        </svg>`;
    }

    if (key === 'icecream') {
        // Ice cream waffle cone
        return `
        <svg viewBox="0 0 460 300" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="waffleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#b45309"/>
                    <stop offset="40%" stop-color="#f59e0b"/>
                    <stop offset="80%" stop-color="#d97706"/>
                    <stop offset="100%" stop-color="#78350f"/>
                </linearGradient>
                <radialGradient id="iceCreamScoop" cx="40%" cy="40%" r="60%">
                    <stop offset="0%" stop-color="#fbcfe8"/>
                    <stop offset="60%" stop-color="#f472b6"/>
                    <stop offset="100%" stop-color="#db2777"/>
                </radialGradient>
            </defs>
            <rect width="460" height="300" rx="16" fill="#0c0716"/>
            
            <!-- Waffle Cone (Inverted) -->
            <polygon points="210,250 160,115 260,115" fill="url(#waffleGrad)"/>
            
            <!-- Waffle Diamond Grid Lines -->
            <line x1="170" y1="125" x2="225" y2="240" stroke="#78350f" stroke-width="1.5"/>
            <line x1="185" y1="120" x2="235" y2="220" stroke="#78350f" stroke-width="1.5"/>
            <line x1="200" y1="115" x2="245" y2="190" stroke="#78350f" stroke-width="1.5"/>
            <line x1="250" y1="125" x2="195" y2="240" stroke="#78350f" stroke-width="1.5"/>
            <line x1="235" y1="120" x2="185" y2="220" stroke="#78350f" stroke-width="1.5"/>
            <line x1="220" y1="115" x2="175" y2="190" stroke="#78350f" stroke-width="1.5"/>
            
            <!-- Hemispherical Ice Cream Scoop on Top -->
            <path d="M 155 115 A 55 55 0 0 1 265 115 Z" fill="url(#iceCreamScoop)"/>
            <ellipse cx="210" cy="115" rx="55" ry="12" fill="#db2777"/>
            
            <!-- Chocolate Drizzle -->
            <path d="M 180 85 Q 195 95 210 80 Q 225 100 240 85" stroke="#451a03" stroke-width="4" fill="none"/>
            <!-- Cherry on top -->
            <circle cx="210" cy="55" r="9" fill="#dc2626"/>
            <path d="M 210 50 Q 220 35 228 32" stroke="#15803d" stroke-width="2" fill="none"/>
            
            <!-- Dimensions -->
            <line x1="280" y1="115" x2="280" y2="250" stroke="#38bdf8" stroke-width="2"/>
            <text x="290" y="185" fill="#38bdf8" font-size="12" font-weight="900">h = 10 cm</text>
            
            <line x1="210" y1="115" x2="265" y2="115" stroke="#f59e0b" stroke-width="2.5"/>
            <text x="225" y="105" fill="#f59e0b" font-size="11" font-weight="900">r = 3 cm</text>
            
            <!-- Volume Card -->
            <g transform="translate(15, 60)">
                <rect width="115" height="58" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="#d946ef" stroke-width="1.2"/>
                <text x="10" y="20" fill="#f472b6" font-size="9.5" font-weight="bold">KEM ỐC QUẾ</text>
                <text x="10" y="38" fill="#ffffff" font-size="13" font-weight="900">V ≈ 150.8 cm³</text>
                <text x="10" y="50" fill="#94a3b8" font-size="8.5">Nón 94.2 + Cầu 56.6</text>
            </g>
        </svg>`;
    }

    return `<div class="p-8 text-center text-slate-400">Hình minh họa</div>`;
}

function openRealWorldModal() {
    const modal = document.getElementById('real-world-modal');
    if (modal) modal.classList.remove('hidden');
    appState.realWorldTab = appState.realWorldTab || 'realistic';
    selectRealWorldApp(appState.activeRealWorldApp || 'can');
    AudioEngine.click();
}

function closeRealWorldModal() {
    const modal = document.getElementById('real-world-modal');
    if (modal) modal.classList.add('hidden');
}

function setRealWorldTab(tab) {
    appState.realWorldTab = tab;
    AudioEngine.click();
    selectRealWorldApp(appState.activeRealWorldApp || 'can');
}

function copyRealWorldProblem() {
    const m = REAL_WORLD_MODELS[appState.activeRealWorldApp || 'can'];
    if (!m) return;
    const text = `【BÀI TOÁN THỰC TẾ: ${m.title}】\n` +
        `• Kích thước: r = ${m.r} ${m.unit}, h = ${m.h} ${m.unit}${m.l ? `, l = ${m.l} ${m.unit}` : ''}\n` +
        `• Đề bài: ${m.problem}\n` +
        `• Tính toán:\n  ① ${m.calc1}\n  ② ${m.calc2}\n${m.calc3 ? `  ③ ${m.calc3}\n` : ''}` +
        `• Ứng dụng thực tế: ${m.practicalTip}`;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('📋 Đã sao chép nội dung bài toán vào bộ nhớ tạm!');
        }).catch(() => {
            showToast('Đã lưu bài toán.');
        });
    } else {
        showToast('Đã lưu bài toán.');
    }
}

function selectRealWorldApp(appKey) {
    appState.activeRealWorldApp = appKey;
    const currentTab = appState.realWorldTab || 'realistic';

    const allKeys = ['can', 'hat', 'funnel', 'silo', 'nonla', 'icecream'];
    allKeys.forEach(k => {
        const btn = document.getElementById(`rw-btn-${k}`);
        if (btn) {
            if (k === appKey) {
                btn.className = 'p-2.5 rounded-2xl bg-emerald-950/90 border-2 border-emerald-400 text-left flex flex-col gap-1 transition-all shadow-[0_0_15px_rgba(16,185,129,0.35)] scale-[1.02]';
            } else {
                btn.className = 'p-2.5 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-left flex flex-col gap-1 hover:border-slate-500 hover:bg-slate-800/80 transition-all shadow-md';
            }
        }
    });

    const m = REAL_WORLD_MODELS[appKey];
    const container = document.getElementById('rw-scenario-content');
    if (!container || !m) return;

    const svgContent = getRealWorldSvg(appKey, currentTab);

    container.innerHTML = `
        <!-- Top Info Header -->
        <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-700/60">
            <div class="flex items-center gap-2.5">
                <span class="text-2xl">${m.icon}</span>
                <div>
                    <div class="flex items-center gap-2">
                        <h4 class="text-sm md:text-base font-black text-emerald-300 tracking-wide">${m.title}</h4>
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-black ${m.badgeColor}">${m.shapeName}</span>
                    </div>
                    <div class="text-[11px] text-slate-400">Số đo thực tế: <span class="font-mono text-amber-300 font-bold">r = ${m.r} ${m.unit}</span> | <span class="font-mono text-sky-300 font-bold">h = ${m.h} ${m.unit}</span> ${m.l ? `| <span class="font-mono text-pink-300 font-bold">l = ${m.l} ${m.unit}</span>` : ''}</div>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="speakCurrentRealWorldApp()" class="px-2.5 py-1 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition-all" title="Nghe đọc đề bài và lời giải">
                    <i class="ph-bold ph-speaker-high text-xs"></i><span>Nghe thuyết minh</span>
                </button>
            </div>
        </div>

        <!-- 2-Column Responsive Visual & Mathematical Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch pt-1">
            <!-- Left Column: Large & Vivid Visual Stage -->
            <div class="lg:col-span-6 flex flex-col gap-2">
                <!-- Visual View Mode Tabs -->
                <div class="flex items-center justify-between bg-slate-950/80 p-1 rounded-xl border border-slate-700/60 text-[11px]">
                    <div class="flex items-center gap-1 w-full">
                        <button onclick="setRealWorldTab('realistic')" class="flex-1 py-1 px-2 rounded-lg font-bold transition-all text-center ${currentTab === 'realistic' ? 'bg-emerald-600 text-slate-950 shadow font-black' : 'text-slate-400 hover:text-white'}">
                            🎨 3D Sinh Động
                        </button>
                        <button onclick="setRealWorldTab('blueprint')" class="flex-1 py-1 px-2 rounded-lg font-bold transition-all text-center ${currentTab === 'blueprint' ? 'bg-sky-600 text-white shadow font-black' : 'text-slate-400 hover:text-white'}">
                            📐 Bản Vẽ Kỹ Thuật
                        </button>
                        <button onclick="setRealWorldTab('net')" class="flex-1 py-1 px-2 rounded-lg font-bold transition-all text-center ${currentTab === 'net' ? 'bg-pink-600 text-white shadow font-black' : 'text-slate-400 hover:text-white'}">
                            📄 Khai Triển Phẳng
                        </button>
                    </div>
                </div>

                <!-- Large Vivid Graphic Container -->
                <div class="w-full h-64 sm:h-72 rounded-2xl bg-slate-950/90 border border-slate-700/80 shadow-2xl overflow-hidden flex items-center justify-center relative p-1">
                    ${svgContent}
                </div>

                <!-- Dimension Chips Under Graphic -->
                <div class="flex items-center justify-center gap-2 flex-wrap text-[10px] font-mono">
                    <span class="px-2 py-0.5 rounded-md bg-amber-950/70 border border-amber-500/40 text-amber-300">Bán kính: ${m.r} ${m.unit}</span>
                    <span class="px-2 py-0.5 rounded-md bg-sky-950/70 border border-sky-500/40 text-sky-300">Chiều cao: ${m.h} ${m.unit}</span>
                    ${m.l ? `<span class="px-2 py-0.5 rounded-md bg-pink-950/70 border border-pink-500/40 text-pink-300">Đường sinh: ${m.l} ${m.unit}</span>` : ''}
                    <span class="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">Hình học ứng dụng</span>
                </div>
            </div>

            <!-- Right Column: Mathematical Problem & Technical Calculations -->
            <div class="lg:col-span-6 flex flex-col justify-between gap-2.5">
                <!-- Problem Statement Card -->
                <div class="p-3 rounded-2xl bg-slate-950/80 border border-slate-700/70 space-y-1">
                    <div class="text-[11px] uppercase font-black text-amber-400 tracking-wider flex items-center gap-1.5">
                        <i class="ph-bold ph-question"></i><span>Bài toán thực tế:</span>
                    </div>
                    <p class="text-xs text-slate-200 leading-relaxed font-sans">${m.problem}</p>
                </div>

                <!-- Step-by-Step Calculation Breakdown -->
                <div class="space-y-2 p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/40 font-mono text-xs shadow-inner">
                    <div class="text-[11px] uppercase font-black text-emerald-400 font-sans tracking-wider flex items-center gap-1 mb-1">
                        <i class="ph-bold ph-calculator"></i><span>Các bước giải chi tiết:</span>
                    </div>
                    <div class="text-amber-300 bg-amber-950/30 p-2 rounded-xl border border-amber-500/30 leading-snug">
                        <span class="font-black text-amber-400">①</span> ${m.calc1}
                    </div>
                    <div class="text-cyan-300 bg-cyan-950/30 p-2 rounded-xl border border-cyan-500/30 leading-snug">
                        <span class="font-black text-cyan-400">②</span> ${m.calc2}
                    </div>
                    ${m.calc3 ? `
                    <div class="text-pink-300 bg-pink-950/30 p-2 rounded-xl border border-pink-500/30 leading-snug">
                        <span class="font-black text-pink-400">③</span> ${m.calc3}
                    </div>
                    ` : ''}
                </div>

                <!-- Practical Engineering & Manufacturing Insight -->
                <div class="p-3 rounded-2xl bg-emerald-950/30 border-l-4 border-emerald-400 border border-emerald-500/20 text-xs space-y-1 shadow">
                    <div class="font-black text-emerald-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                        <i class="ph-fill ph-lightbulb text-amber-400"></i><span>Ý nghĩa kỹ thuật & đời sống:</span>
                    </div>
                    <p class="text-slate-300 text-[11px] leading-relaxed font-sans">${m.practicalTip}</p>
                </div>
            </div>
        </div>
    `;
}

function applyRealWorldToScene() {
    const m = REAL_WORLD_MODELS[appState.activeRealWorldApp || 'can'];
    if (!m) return;

    appState.r = m.r;
    appState.h = m.h;
    appState.unit = m.unit;
    if (m.shape) setShape(m.shape);

    const sr = document.getElementById('slider-r');
    const sh = document.getElementById('slider-h');
    if (sr) { sr.min = (m.r * 0.5).toFixed(1); sr.max = (m.r * 1.5).toFixed(1); sr.value = m.r; }
    if (sh) { sh.min = (m.h * 0.5).toFixed(1); sh.max = (m.h * 1.5).toFixed(1); sh.value = m.h; }

    updateCalculations();
    closeRealWorldModal();
    AudioEngine.success();
    showToast(`Đã áp dụng kích thước ${m.title} lên mô hình 3D!`);
}

window.selectRealWorldApp = selectRealWorldApp;
window.openRealWorldModal = openRealWorldModal;
window.closeRealWorldModal = closeRealWorldModal;
window.applyRealWorldToScene = applyRealWorldToScene;
window.setRealWorldTab = setRealWorldTab;
window.copyRealWorldProblem = copyRealWorldProblem;
window.speakCurrentRealWorldApp = speakCurrentRealWorldApp;

// --- Activity 5: Printable Worksheet & Report Generator (Requirement 33, 34) ---
function openWorksheetModal(fromDiary = false) {
    const modal = document.getElementById('worksheet-modal');
    if (modal) modal.classList.remove('hidden');
    if (fromDiary) {
        const sel = document.getElementById('ws-sheet-type');
        if (sel) sel.value = 'discovery';
    }
    AudioEngine.click();
}

function closeWorksheetModal() {
    const modal = document.getElementById('worksheet-modal');
    if (modal) modal.classList.add('hidden');
}

function triggerPrintSheet() {
    const name = document.getElementById('ws-student-name')?.value || 'Học sinh';
    const cls = document.getElementById('ws-student-class')?.value || '9A';
    const sheetType = document.getElementById('ws-sheet-type')?.value || 'discovery';
    const sheetContainer = document.getElementById('printable-sheet');
    if (!sheetContainer) return;

    const dateStr = new Date().toLocaleDateString('vi-VN');
    const r = appState.r;
    const h = appState.h;
    const l = appState.l;
    const u = appState.unit;
    const V_cone = MathCore.getConeVolume(r, h);
    const V_cyl = MathCore.getCylinderVolume(r, h);
    const Sxq_cone = MathCore.getConeLateralArea(r, h);

    let contentHtml = `
        <div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; color: #111;">
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
                <div>
                    <div style="font-weight: bold; font-size: 13px;">BỘ GIÁO DỤC VÀ ĐÀO TẠO</div>
                    <div style="font-size: 12px;">TRƯỜNG THCS NGUYỄN DU</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: bold; font-size: 13px;">HỌC LIỆU SỐ 3D TOÁN 9</div>
                    <div style="font-size: 12px;">Ngày thực hiện: ${dateStr}</div>
                </div>
            </div>

            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 0;">
                    ${sheetType === 'discovery' ? 'PHIẾU THU HOẠCH: BÁO CÁO KẾT QUẢ KHÁM PHÁ HÌNH NÓN - HÌNH TRỤ' : 'PHIẾU BÀI TẬP VẬN DỤNG HÌNH HỌC KHÔNG GIAN'}
                </h2>
                <div style="font-style: italic; font-size: 13px; margin-top: 4px;">K2 Math 3D Lab - Phiên bản Lớp Học</div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 13px; border: 1px dashed #666; padding: 8px 12px;">
                <div>Họ và tên học sinh: <b>${name}</b></div>
                <div>Lớp: <b>${cls}</b></div>
                <div>Điểm số: ............ / 10</div>
            </div>

            <div style="margin-bottom: 16px;">
                <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 6px;">I. THÔNG SỐ MÔ HÌNH THỰC NGHIỆM TRÊN PHÒNG LAB 3D:</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: center;" border="1">
                    <tr style="background: #f1f5f9;">
                        <th style="padding: 6px;">Bán kính đáy (r)</th>
                        <th style="padding: 6px;">Chiều cao (h)</th>
                        <th style="padding: 6px;">Đường sinh (l)</th>
                        <th style="padding: 6px;">V nón</th>
                        <th style="padding: 6px;">V trụ</th>
                    </tr>
                    <tr>
                        <td style="padding: 6px;">${r.toFixed(1)} ${u}</td>
                        <td style="padding: 6px;">${h.toFixed(1)} ${u}</td>
                        <td style="padding: 6px;">${l.toFixed(2)} ${u}</td>
                        <td style="padding: 6px;">${V_cone.toFixed(2)} ${u}³</td>
                        <td style="padding: 6px;">${V_cyl.toFixed(2)} ${u}³</td>
                    </tr>
                </table>
            </div>

            <div style="margin-bottom: 16px;">
                <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 6px;">II. CÁC ĐỊNH LÝ & CÔNG THỨC ĐÃ KHÁM PHÁ (NHẬT KÝ):</h3>
                <ul style="font-size: 12px; line-height: 1.6; padding-left: 20px;">
                    <li><b>Định lý Pythagore trong hình nón:</b> $l^2 = r^2 + h^2 \\Rightarrow l = \\sqrt{r^2 + h^2}$.</li>
                    <li><b>Độ dài cung quạt khai triển:</b> Bằng đúng chu vi đáy tròn: $C = 2\\pi r$.</li>
                    <li><b>Diện tích xung quanh:</b> Nón: $S_{xq} = \\pi r l$ | Trụ: $S_{xq} = 2\\pi r h$.</li>
                    <li><b>Tỉ số thể tích thực nghiệm:</b> $V_{\\text{nón}} = \\frac{1}{3} V_{\\text{trụ}} = \\frac{1}{3} \\pi r^2 h$.</li>
                </ul>
            </div>

            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 6px;">III. PHẦN BÀI TẬP TỰ LUẬN & ĐÁNH GIÁ:</h3>
                <div style="font-size: 12px; line-height: 1.7;">
                    <p><b>Câu 1:</b> Một chiếc mũ sinh nhật hình nón có bán kính đáy r = 8 cm và đường sinh l = 17 cm. Em hãy tính diện tích bìa cứng cần dùng để tạo nên mặt xung quanh của chiếc nón (lấy $\\pi \\approx 3.14$).</p>
                    <div style="min-height: 60px; border-bottom: 1px dotted #999;"><i>Bài làm:</i></div>

                    <p style="margin-top: 8px;"><b>Câu 2:</b> Một lon nước ngọt hình trụ có bán kính r = 3.3 cm và chiều cao h = 12 cm. Tính dung tích nước ngọt chứa trong lon (theo đơn vị ml, biết $1\\text{ cm}^3 = 1\\text{ ml}$).</p>
                    <div style="min-height: 60px; border-bottom: 1px dotted #999;"><i>Bài làm:</i></div>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 13px;">
                <div style="text-align: center; width: 200px;">
                    <b>Chữ ký Học sinh</b><br><br><br>
                    <i>${name}</i>
                </div>
                <div style="text-align: center; width: 200px;">
                    <b>Lời phê của Giáo viên</b><br><br><br>
                    ........................................
                </div>
            </div>
        </div>
    `;

    sheetContainer.innerHTML = contentHtml;
    closeWorksheetModal();
    window.print();
}

// --- Activity 6: Presentation Modes (Material, Explode, Focus, Sound) ---
function setMaterialMode(mode) {
    appState.materialMode = mode;
    ['solid', 'wireframe', 'transparent'].forEach(m => {
        const btn = document.getElementById(`mat-btn-${m.substring(0, 4)}`);
        if (btn) {
            btn.className = (m === mode)
                ? 'px-1.5 py-0.5 rounded bg-cyan-600 text-white font-bold'
                : 'px-1.5 py-0.5 rounded text-slate-400 hover:text-white';
        }
    });

    const isWire = (mode === 'wireframe');
    const isTrans = (mode === 'transparent');

    SHARED_MATS.coneGlass.wireframe = isWire;
    SHARED_MATS.cylGlass.wireframe = isWire;
    SHARED_MATS.coneGlass.opacity = isTrans ? 0.25 : (isWire ? 1.0 : 0.88);
    SHARED_MATS.cylGlass.opacity = isTrans ? 0.25 : (isWire ? 1.0 : 0.88);

    AudioEngine.step();
    showToast(`Đã chuyển vật liệu: ${mode.toUpperCase()}`);
}

function toggleExplodeView() {
    appState.explodeView = !appState.explodeView;
    const btn = document.getElementById('btn-explode-toggle');
    if (btn) btn.classList.toggle('bg-orange-600', appState.explodeView);

    const shiftY = appState.explodeView ? 1.8 : 0;
    // Animate cylinder caps and cone
    gsap.to(volCylTopCap.position, { y: appState.h + shiftY, duration: 0.7, ease: 'power2.out' });
    gsap.to(volCylBaseCap.position, { y: -shiftY, duration: 0.7, ease: 'power2.out' });
    gsap.to(volConeGroup.position, { y: shiftY, duration: 0.7, ease: 'power2.out' });

    AudioEngine.step();
    showToast(appState.explodeView ? '💥 Đã tách rời các mặt (Explode View)' : 'Đã khép các mặt lại');
}

function toggleFocusMode() {
    appState.focusMode = !appState.focusMode;
    const header = document.querySelector('header');
    const leftSide = document.getElementById('sidebar-left');
    const rightSide = document.getElementById('sidebar-right');

    if (header) header.classList.toggle('hidden', appState.focusMode);
    if (leftSide) leftSide.classList.toggle('hidden', appState.focusMode);
    if (rightSide) rightSide.classList.toggle('hidden', appState.focusMode);

    AudioEngine.step();
    showToast(appState.focusMode ? '🎯 Đã bật Chế độ Tập trung (Nhấn lại để thoát)' : 'Đã về giao diện đầy đủ');
}

function toggleSound() {
    appState.soundEnabled = !appState.soundEnabled;
    const icon = document.getElementById('sound-icon');
    const btn = document.getElementById('btn-sound-toggle');
    if (icon) {
        icon.className = appState.soundEnabled ? 'ph-bold ph-speaker-high text-sm' : 'ph-bold ph-speaker-slash text-sm text-slate-500';
    }
    if (btn) btn.classList.toggle('border-amber-400', appState.soundEnabled);
    if (appState.soundEnabled) AudioEngine.success();
    showToast(appState.soundEnabled ? '🔊 Đã bật âm thanh hiệu ứng' : '🔇 Đã tắt âm thanh');
}
function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}
function setElHtml(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

function updateCalculations() {
    const r = appState.r;
    const h = appState.h;
    const l = appState.l;
    const theta = appState.thetaDeg;
    const u = appState.unit;

    // Real-time pure math
    const S_base = MathCore.getBaseArea(r);
    const V_cyl = MathCore.getCylinderVolume(r, h);
    const V_cone = MathCore.getConeVolume(r, h);
    const Sxq_cone = MathCore.getConeLateralArea(r, h);
    const Stp_cone = MathCore.getConeTotalArea(r, h);
    const Sxq_cyl = MathCore.getCylinderLateralArea(r, h);
    const Stp_cyl = MathCore.getCylinderTotalArea(r, h);

    // Update Slider text readouts
    setElText('radius-val', r.toFixed(1));
    setElText('height-val', h.toFixed(1));
    setElText('calc-l-val', `${l.toFixed(2)} ${u}`);
    setElText('calc-theta-val', `${theta.toFixed(1)}°`);
    setElText('calc-cbase-val', `${MathCore.getBaseCircumference(r).toFixed(2)} ${u}`);

    // Update metric cards
    setElHtml('val-sbase', `${S_base.toFixed(2)} ${u}²`);
    setElHtml('val-vcyl', `${V_cyl.toFixed(2)} ${u}³`);
    setElHtml('val-vcone', `${V_cone.toFixed(2)} ${u}³`);

    // Formulas Accordion content with formulaDisplayMode support
    const accordion = document.getElementById('formula-accordion-content');
    if (accordion) {
        const mode = appState.formulaDisplayMode || 'full';
        if (appState.mode === 'volume' || appState.shape === 'cone') {
            const valL = (mode === 'quiz') ? '???' : (mode === 'compact' ? '√(r² + h²)' : `√(r² + h²) ≈ ${l.toFixed(2)} ${u}`);
            const valTh = (mode === 'quiz') ? '???' : (mode === 'compact' ? '360°·r/l' : `360°·r/l ≈ ${theta.toFixed(1)}°`);
            const valSxq = (mode === 'quiz') ? '???' : (mode === 'compact' ? 'πrl' : `πrl ≈ ${Sxq_cone.toFixed(2)} ${u}²`);
            const valStp = (mode === 'quiz') ? '???' : (mode === 'compact' ? 'πrl + πr²' : `πrl + πr² ≈ ${Stp_cone.toFixed(2)} ${u}²`);
            const valV = (mode === 'quiz') ? '???' : (mode === 'compact' ? '1/3 πr²h' : `1/3 πr²h ≈ ${V_cone.toFixed(2)} ${u}³`);

            accordion.innerHTML = `
                <div class="space-y-1.5 text-xs font-mono">
                    <div class="flex justify-between bg-slate-900/60 p-1.5 rounded"><span class="text-slate-300">Đường sinh l:</span><b class="text-pink-300">${valL}</b></div>
                    <div class="flex justify-between bg-slate-900/60 p-1.5 rounded"><span class="text-slate-300">Góc quạt θ:</span><b class="text-amber-300">${valTh}</b></div>
                    <div class="flex justify-between bg-slate-900/60 p-1.5 rounded"><span class="text-slate-300">S<sub>xq</sub>:</span><b class="text-cyan-300">${valSxq}</b></div>
                    <div class="flex justify-between bg-slate-900/60 p-1.5 rounded"><span class="text-slate-300">S<sub>tp</sub>:</span><b class="text-emerald-300">${valStp}</b></div>
                    <div class="flex justify-between bg-amber-950/40 border border-amber-500/40 p-1.5 rounded"><span class="text-amber-200">Thể tích V:</span><b class="text-amber-300">${valV}</b></div>
                </div>
            `;
        } else {
            const valCirc = (mode === 'quiz') ? '???' : (mode === 'compact' ? '2πr' : `2πr ≈ ${MathCore.getBaseCircumference(r).toFixed(2)} ${u}`);
            const valSxq = (mode === 'quiz') ? '???' : (mode === 'compact' ? '2πrh' : `2πrh ≈ ${Sxq_cyl.toFixed(2)} ${u}²`);
            const valStp = (mode === 'quiz') ? '???' : (mode === 'compact' ? '2πrh + 2πr²' : `2πrh + 2πr² ≈ ${Stp_cyl.toFixed(2)} ${u}²`);
            const valV = (mode === 'quiz') ? '???' : (mode === 'compact' ? 'πr²h' : `πr²h ≈ ${V_cyl.toFixed(2)} ${u}³`);

            accordion.innerHTML = `
                <div class="space-y-1.5 text-xs font-mono">
                    <div class="flex justify-between bg-slate-900/60 p-1.5 rounded"><span class="text-slate-300">Chu vi đáy:</span><b class="text-amber-300">${valCirc}</b></div>
                    <div class="flex justify-between bg-slate-900/60 p-1.5 rounded"><span class="text-slate-300">S<sub>xq</sub>:</span><b class="text-cyan-300">${valSxq}</b></div>
                    <div class="flex justify-between bg-slate-900/60 p-1.5 rounded"><span class="text-slate-300">S<sub>tp</sub>:</span><b class="text-emerald-300">${valStp}</b></div>
                    <div class="flex justify-between bg-sky-950/40 border border-sky-500/40 p-1.5 rounded"><span class="text-sky-200">Thể tích V:</span><b class="text-sky-300">${valV}</b></div>
                </div>
            `;
        }
    }

    // Rebuild active geometries
    if (typeof updateStructureConeGeometry === 'function' && (typeof structureGroup !== 'undefined' && structureGroup.visible || (typeof lessonState !== 'undefined' && lessonState.currentStageIndex === 1))) {
        updateStructureConeGeometry((typeof lessonState !== 'undefined' && lessonState.currentStepIndex) || 1);
    }
    rebuildVolumeGeometries();
    setUnfoldProgress(appState.unfoldProgress);
    rebuildRevolutionBaseMeshes();
    rebuildSectionMeshes();
}

function updateVolumeUI() {
    setElText('step-counter-badge', `Mức ${appState.currentPour} / 3`);

    for (let i = 1; i <= 3; i++) {
        const btn = document.getElementById(`btn-pour-${i}`);
        const check = document.getElementById(`check-${i}`);
        if (!btn) continue;

        if (i <= appState.currentPour) {
            btn.className = 'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-extrabold bg-slate-800/80 text-emerald-300 border border-emerald-500/40 shadow-sm cursor-default';
            btn.disabled = true;
            if (check) check.classList.remove('hidden');
        } else if (i === appState.currentPour + 1) {
            btn.className = 'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-extrabold transition-all duration-300 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:scale-[1.02] active:scale-95 cursor-pointer';
            btn.disabled = false;
            if (check) check.classList.add('hidden');
        } else {
            btn.className = 'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-extrabold bg-slate-900/50 text-slate-500 border border-slate-800/50 cursor-not-allowed';
            btn.disabled = true;
            if (check) check.classList.add('hidden');
        }
    }

    const formulaContainer = document.getElementById('formula-journey-container');
    if (formulaContainer) {
        if (appState.currentPour === 0) {
            formulaContainer.innerHTML = `<span class="text-xs text-slate-400 italic text-center">Thực hiện các bước đổ nước để thấy tỉ lệ thể tích...</span>`;
        } else if (appState.currentPour === 1) {
            formulaContainer.innerHTML = `<div class="text-sm font-bold text-cyan-200">1 × V<sub>nón</sub> = <span class="text-amber-400">1/3</span> V<sub>trụ</sub></div>`;
        } else if (appState.currentPour === 2) {
            formulaContainer.innerHTML = `<div class="text-sm font-bold text-cyan-200">2 × V<sub>nón</sub> = <span class="text-amber-400">2/3</span> V<sub>trụ</sub></div>`;
        } else if (appState.currentPour === 3) {
            formulaContainer.innerHTML = `
                <div class="text-xs space-y-1 font-mono">
                    <div>3 × V<sub>nón</sub> = V<sub>trụ</sub></div>
                    <div class="text-amber-300 font-bold text-sm">⇒ V<sub>nón</sub> = 1/3 V<sub>trụ</sub> = 1/3 πr²h</div>
                </div>
            `;
        }
    }
}

function setMode(m) {
    if (appState.mode === m) return;
    clearVolumeAutoPlay();
    gsap.killTweensOf(appState);
    appState.mode = m;

    document.querySelectorAll('.mode-tab').forEach(t => {
        const isMatch = t.dataset.mode === m;
        t.className = isMatch
            ? 'mode-tab px-2.5 py-1.5 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-lg border border-amber-300/40 flex items-center gap-1 shrink-0'
            : 'mode-tab px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1 shrink-0';
    });

    const subShapeBar = document.getElementById('sub-shape-bar');
    if (subShapeBar) {
        subShapeBar.classList.toggle('hidden', m === 'volume' || m === 'challenge');
    }

    // Toggle Groups Visibility
    if (m === 'challenge') {
        syncChallenge3DScene();
    } else {
        if (typeof structureGroup !== 'undefined') structureGroup.visible = (m === 'structure');
        volumeGroup.visible = (m === 'volume');
        netGroup.visible = (m === 'net');
        revolutionGroup.visible = (m === 'revolution');
        sectionGroup.visible = (m === 'section');
    }

    // Panels
    const sp = document.getElementById('panel-mode-structure');
    if (sp) sp.classList.toggle('hidden', m !== 'structure');

    const panels = ['volume', 'net', 'rev', 'section', 'challenge'];
    panels.forEach(p => {
        const el = document.getElementById(`panel-mode-${p}`);
        if (el) el.classList.toggle('hidden', m !== (p === 'rev' ? 'revolution' : p));
    });

    if (m === 'challenge') {
        if (!appState.challengeStarted) {
            initChallengeRound();
        } else {
            syncChallenge3DScene();
            renderChallengeUI();
        }
    }

    updateCalculations();
    applyFloatingModelPosition();
    frameFloatingModel();
    updateGuidedUI();
}

function setShape(s) {
    appState.shape = s;
    document.querySelectorAll('.subshape-btn').forEach(b => {
        const isMatch = b.dataset.shape === s;
        b.className = isMatch
            ? 'subshape-btn px-2 py-1 rounded-lg text-[11px] font-black transition-all bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 flex items-center gap-1'
            : 'subshape-btn px-2 py-1 rounded-lg text-[11px] font-bold text-slate-400 hover:text-slate-200 border border-transparent flex items-center gap-1';
    });
    updateCalculations();
    applyFloatingModelPosition();
}

function setUnit(u) {
    appState.unit = u;
    persistState();
    updateCalculations();
}

function applyPreset(r, h) {
    appState.r = r;
    appState.h = h;
    const sr = document.getElementById('slider-r');
    const sh = document.getElementById('slider-h');
    if (sr) sr.value = r;
    if (sh) sh.value = h;
    resetVolumeSimulation();
    updateCalculations();
    showToast(`Đã áp dụng thông số mẫu: r = ${r}, h = ${h}`);
}

function randomizeDimensions() {
    const r = +(1.4 + Math.random() * 1.4).toFixed(1);
    const h = +(4.0 + Math.random() * 4.0).toFixed(1);
    applyPreset(r, h);
}

// Snapshot Export (Capture Canvas with Watermark)
function takeSnapshot() {
    renderer.render(scene, camera);
    const dataURL = renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `K2-Math-3D-Lab-${appState.shape}-${Date.now()}.png`;
    a.click();
    showToast('Đã chụp và tải ảnh mô hình 3D.');
}

// Camera Preset Transitions
function setCameraPreset(type) {
    const duration = appState.reduceMotion ? 0.3 : 0.9;
    const centerY = (typeof getModelFloatY === 'function') ? (getModelFloatY() + appState.h * 0.48) : (appState.h * 0.5);
    let targetPos = DEFAULT_CAM_POS.clone();
    let targetLook = DEFAULT_CAM_TARGET.clone();

    if (type === 'front') {
        targetPos.set(0, centerY + 0.5, 22);
        targetLook.set(0, centerY, 0);
    } else if (type === 'side') {
        targetPos.set(22, centerY + 0.5, 0);
        targetLook.set(0, centerY, 0);
    } else if (type === 'top') {
        targetPos.set(0, 26, 0.001);
        targetLook.set(0, 0, 0);
    } else if (type === '3d' || type === 'perspective') {
        targetPos.set(13, centerY + 3.8, 16);
        targetLook.set(0, centerY * 0.8, 0);
    }

    gsap.to(camera.position, {
        x: targetPos.x, y: targetPos.y, z: targetPos.z,
        duration: duration, ease: 'power2.inOut'
    });
    gsap.to(controls.target, {
        x: targetLook.x, y: targetLook.y, z: targetLook.z,
        duration: duration, ease: 'power2.inOut',
        onUpdate: () => controls.update()
    });
}

function resetCamera() {
    setCameraPreset('perspective');
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen().catch(() => {});
    }
}

function toggleAutoRotate() {
    appState.autoRotate = !appState.autoRotate;
    controls.autoRotate = appState.autoRotate;
    controls.autoRotateSpeed = 1.0;
    const btn = document.getElementById('btn-autorotate');
    if (btn) btn.classList.toggle('text-amber-400', appState.autoRotate);
}

function toggleGrid() {
    appState.gridVisible = !appState.gridVisible;
    gridHelper.visible = appState.gridVisible;
    persistState();
}

function toggleFormulas() {
    const content = document.getElementById('formula-accordion-content');
    const icon = document.getElementById('formula-accordion-icon');
    if (!content) return;
    const isHidden = content.classList.contains('hidden');
    content.classList.toggle('hidden', !isHidden);
    if (icon) icon.className = isHidden ? 'ph-bold ph-caret-up text-amber-400' : 'ph-bold ph-caret-down text-slate-400';
}

function showToast(text) {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toast-text');
    if (!toast || !toastText) return;
    toastText.innerText = text;
    toast.classList.remove('opacity-0', 'translate-y-3');
    toast.classList.add('opacity-100', 'translate-y-0');
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-3');
        toast.classList.remove('opacity-100', 'translate-y-0');
    }, 2200);
}

function fireConfetti() {
    if (typeof confetti === 'function' && !appState.reduceMotion) {
        confetti({
            particleCount: 75,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#06b6d4', '#f59e0b', '#10b981', '#ffffff', '#38bdf8']
        });
    }
}

function showVictoryBanner() {
    const b = document.getElementById('victory-banner');
    if (b) {
        b.classList.remove('opacity-0', '-translate-y-4', 'pointer-events-none');
        b.classList.add('opacity-100', 'translate-y-0');
    }
}
function closeVictoryBanner() {
    const b = document.getElementById('victory-banner');
    if (b) {
        b.classList.add('opacity-0', '-translate-y-4', 'pointer-events-none');
        b.classList.remove('opacity-100', 'translate-y-0');
    }
}

// Enhanced Teaching & Navigation Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
    // If typing in input, ignore except Escape to blur
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) {
        if (e.key === 'Escape') e.target.blur();
        return;
    }

    if (e.key === 'Escape') {
        // Close modals, popovers, submenus, overlays
        closeColorPalette();
        closeAllSubmenus();
        if (typeof closeDiaryModal === 'function') closeDiaryModal();
        if (typeof closeFormulaBuilderModal === 'function') closeFormulaBuilderModal();
        if (typeof closeFormulaCompareModal === 'function') closeFormulaCompareModal();
        if (typeof closeRealWorldModal === 'function') closeRealWorldModal();
        if (typeof closeDragLabelsModal === 'function') closeDragLabelsModal();
        if (typeof closeWorksheetModal === 'function') closeWorksheetModal();
        if (typeof closeStudentQuestionModal === 'function') closeStudentQuestionModal();
        if (typeof closeVictoryBanner === 'function') closeVictoryBanner();
        if (typeof cancel3DClickQuiz === 'function') cancel3DClickQuiz();
        if (appState.laserPointerActive && typeof toggleLaserPointer === 'function') toggleLaserPointer();
        if (appState.measureToolActive && typeof toggleMeasureTool === 'function') toggleMeasureTool();
    } else if (e.key === 'ArrowRight') {
        goToNextStep();
    } else if (e.key === 'ArrowLeft') {
        goToPreviousStep();
    } else if (e.key.toLowerCase() === 'm') {
        toggleSound();
    } else if (e.key.toLowerCase() === 'v') {
        toggleSpeechForCurrentStep();
    } else if (e.key === 'F2') {
        const dev = document.getElementById('dev-hud');
        if (dev) dev.classList.toggle('hidden');
    } else if (e.key === '1') setMode('volume');
    else if (e.key === '2') setMode('net');
    else if (e.key === '3') setMode('revolution');
    else if (e.key === '4') setMode('section');
    else if (e.key === '5') setMode('challenge');
    else if (e.key === ' ') {
        e.preventDefault();
        if (appState.mode === 'revolution') playRevolution();
        else if (appState.mode === 'net') playUnfoldAuto();
        else if (appState.mode === 'volume') playVolumeAuto();
    } else if (e.key.toLowerCase() === 'r') {
        if (appState.mode === 'volume') resetVolumeSimulation();
        else if (appState.mode === 'net') resetUnfold();
        else if (appState.mode === 'revolution') resetRevolution();
    } else if (e.key.toLowerCase() === 'f') toggleFullscreen();
    else if (e.key.toLowerCase() === 'g') toggleGrid();
    else if (e.key.toLowerCase() === 'l') toggleLabels();
    else if (e.key.toLowerCase() === 't') toggleTeacherMode();
});

// Alias for drag labels
function openLabelDragActivity() {
    openDragLabelsModal();
}

// ==========================================
// 13B. TWO-LEVEL UI SUBMENU CONTROLLER
// ==========================================
let activeSubmenu = null;

function toggleSubmenu(menuName) {
    if (activeSubmenu === menuName) {
        closeAllSubmenus();
        return;
    }
    closeAllSubmenus();
    activeSubmenu = menuName;
    const targetMenu = document.getElementById(`submenu-${menuName}`);
    const targetBtn = document.getElementById(`nav-btn-${menuName}`);
    if (targetMenu) {
        targetMenu.classList.remove('hidden');
        targetMenu.classList.add('submenu-animate');
    }
    if (targetBtn) {
        targetBtn.classList.add('bg-amber-500/20', 'text-amber-300', 'border-amber-400/40');
    }
    if (menuName === 'roadmap') {
        renderRoadmapStagesList();
    }
    AudioEngine.click();
}

function closeAllSubmenus() {
    const allMenus = document.querySelectorAll('.lvl2-submenu');
    allMenus.forEach(m => m.classList.add('hidden'));
    const allBtns = document.querySelectorAll('.nav-lvl1-btn');
    allBtns.forEach(b => b.classList.remove('bg-amber-500/20', 'text-amber-300', 'border-amber-400/40'));
    const dd = document.getElementById('lw-stage-dropdown');
    if (dd) dd.classList.add('hidden');
    activeSubmenu = null;
}

// Global click outside to dismiss active submenu
document.addEventListener('click', (e) => {
    if (!activeSubmenu) return;
    const header = document.querySelector('header');
    if (header && !header.contains(e.target)) {
        closeAllSubmenus();
    }
});

// Dismiss modal when clicking directly on its dark backdrop overlay
document.querySelectorAll('.fixed.inset-0').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
});

// Level 2 Submenu Action Utilities
function capture3DScreenshot() {
    renderer.render(scene, camera);
    const dataURL = renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `K2-Math-3D-${appState.mode}-${Date.now()}.png`;
    a.click();
    showToast('📷 Đã chụp và lưu ảnh mô hình 3D!');
    AudioEngine.success();
}

function repeatCurrentExperiment() {
    if (appState.mode === 'volume') resetVolumeSimulation(true);
    else if (appState.mode === 'net') resetUnfold();
    else if (appState.mode === 'revolution') resetRevolution();
    else if (appState.mode === 'section') updateCalculations();
    showToast('🔁 Đã đặt lại thí nghiệm hiện tại.');
    AudioEngine.click();
}

function toggleReducedMotion() {
    appState.reduceMotion = !appState.reduceMotion;
    const btn = document.getElementById('setting-reduced-motion-btn');
    if (btn) btn.innerText = appState.reduceMotion ? 'Bật' : 'Tắt';
    showToast(appState.reduceMotion ? 'Đã bật Giảm chuyển động' : 'Đã tắt Giảm chuyển động');
    AudioEngine.click();
}

function toggleHighQuality() {
    const current = renderer.getPixelRatio();
    const next = current > 1.2 ? 1 : Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(next);
    const btn = document.getElementById('setting-quality-btn');
    if (btn) btn.innerText = next > 1.2 ? 'Cao' : 'Chuẩn';
    showToast(`Chất lượng hình ảnh: ${next > 1.2 ? 'Cao (Retina)' : 'Chuẩn (Tiết kiệm)'}`);
    AudioEngine.click();
}

function resetLessonProgress() {
    // 1. Reset lessonState to pristine initial state
    lessonState.currentStageIndex = 1;
    lessonState.currentStepIndex = 1;
    lessonState.completedSteps = {};
    lessonState.answers = {};
    lessonState.attempts = {};
    lessonState.highestUnlockedStage = 1;

    // 2. Reset appState lesson & mode properties
    appState.stageCompletions = [false, false, false, false, false, false, false];
    appState.discoveryJournal = [];
    appState.predictions = {};
    appState.lessonStage = 1;
    appState.step = 1;
    appState.challengeStarted = false;
    appState.currentQuestionIndex = 0;
    appState.challengeScore = 0;
    appState.currentPour = 0;
    appState.isRevolving = false;
    appState.isRevolvePlaying = false;
    appState.revolveAngleDeg = 0;
    appState.unfoldProgress = 0;
    appState.isUnfoldPlaying = false;
    appState.mode = 'structure';
    appState.shape = 'cone';

    // 3. Clear storage and save reset state
    try {
        localStorage.removeItem('k2_math_lesson_state_v5');
        localStorage.removeItem('k2_math_classroom_v5');
        localStorage.removeItem('k2_math_lab_v4_state');
    } catch (e) {}
    saveLessonState();
    persistState();

    // 4. Restore floating lesson window if closed or minimized
    if (typeof lessonWindowState !== 'undefined') {
        lessonWindowState.isClosed = false;
        lessonWindowState.isMinimized = false;
    }
    const windowEl = document.getElementById('lesson-window');
    if (windowEl) {
        windowEl.classList.remove('hidden');
        windowEl.classList.remove('lesson-window-minimized');
    }
    const floatingFab = document.getElementById('floating-lesson-fab');
    if (floatingFab) {
        floatingFab.classList.add('hidden');
    }
    const minIcon = document.getElementById('lw-min-icon');
    if (minIcon) minIcon.className = 'ph-bold ph-minus text-[11px]';

    // 5. Enter Stage 1 Step 1 cleanly
    enterLessonStep(1, 1);

    // 6. Camera reset to standard 3D perspective
    if (typeof setCameraPreset === 'function') {
        setCameraPreset('3d');
    }

    // 7. Sync all UI elements
    updateCalculations();
    updateVolumeUI();
    updateGuidedUI();
    updateDiaryBadge();
    renderRoadmapStagesList();
    applyFloatingModelPosition();
    if (typeof structureGroup !== 'undefined') {
        frameFloatingModel(structureGroup);
    }

    // 8. Positive student audio & toast feedback
    showToast('🔄 Đã đặt lại toàn bộ tiến trình về Chặng 1 ban đầu!');
    if (typeof AudioEngine !== 'undefined' && AudioEngine.success) {
        AudioEngine.success();
    }
}

function resetAllSettings() {
    appState.unit = 'cm';
    appState.labelsVisible = true;
    appState.gridVisible = true;
    appState.soundEnabled = true;
    appState.reduceMotion = false;
    labelsGroup.visible = true;
    gridHelper.visible = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    applyPreset(2.2, 6.6);
    showToast('⚙ Đã khôi phục cài đặt mặc định.');
    AudioEngine.click();
}

// Slider inputs
document.getElementById('slider-r')?.addEventListener('input', (e) => {
    appState.r = parseFloat(e.target.value);
    persistState();
    updateCalculations();
});
document.getElementById('slider-h')?.addEventListener('input', (e) => {
    appState.h = parseFloat(e.target.value);
    persistState();
    updateCalculations();
});
document.getElementById('slider-unfold-progress')?.addEventListener('input', (e) => {
    setUnfoldProgress(parseFloat(e.target.value) / 100);
});
document.getElementById('slider-rev-angle')?.addEventListener('input', (e) => {
    setRevolutionAngle(parseFloat(e.target.value));
});
document.getElementById('slider-section-y')?.addEventListener('input', (e) => {
    appState.sectionYRatio = parseFloat(e.target.value) / 100;
    updateSection();
});

// ==========================================
// 14. SINGLE ANIMATION LOOP
// ==========================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Damping controls update
    controls.update();

    // Subtle liquid ripples
    if (appState.mode === 'volume' && appState.isVolumeAnimating && volStream.visible) {
        droplets.forEach((drop, i) => {
            drop.position.x += Math.sin(clock.getElapsedTime() * 8 + i) * 0.005;
        });
    }

    // Dev HUD update
    const devInfo = document.getElementById('dev-info');
    if (devInfo && !document.getElementById('dev-hud')?.classList.contains('hidden') && renderer?.info?.memory) {
        devInfo.innerText = `Geometries: ${renderer.info.memory.geometries} | Textures: ${renderer.info.memory.textures} | Calls: ${renderer.info.render.calls} | Tris: ${renderer.info.render.triangles}`;
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initial boot
loadPersistedState();
loadVisualColors();
loadLessonState();
loadLessonWindowState();
syncStateToUI();
updateCalculations();
enterLessonStep(lessonState.currentStageIndex, lessonState.currentStepIndex);
updateVolumeUI();
updateGuidedUI();
updateDiaryBadge();
renderRoadmapStagesList();
updateLessonDockUI();
initLessonWindowDraggable();
restoreLessonWindowPosition();

// Expose lesson window controls globally for inline handlers
window.toggleGuidedCard = toggleGuidedCard;
window.setLessonDockState = setLessonDockState;
window.toggleMinimizeLessonPanel = toggleMinimizeLessonPanel;
window.togglePinLessonPanel = togglePinLessonPanel;
window.resetPanelPosition = resetPanelPosition;
window.movePanelPreset = movePanelPreset;
window.closeLessonPanel = closeLessonPanel;
window.restoreLessonPanel = restoreLessonPanel;
window.setGuidedStep = setGuidedStep;
window.setLessonStage = setLessonStage;
window.goToStage = goToStage;
window.toggleLessonStageSelector = toggleLessonStageSelector;
window.renderLessonStageDropdown = renderLessonStageDropdown;

// Expose Color Management functions (Phần 3, 4, 5, 6)
window.toggleColorPalette = toggleColorPalette;
window.closeColorPalette = closeColorPalette;
window.onColorPickerChange = onColorPickerChange;
window.applyAutoContrast = applyAutoContrast;
window.applyColorPreset = applyColorPreset;
window.resetDefaultColors = resetDefaultColors;
window.setPedestalColor = setPedestalColor;
window.setShapeColor = setShapeColor;
window.setBackgroundColor = setBackgroundColor;

// Expose Structure & Revolution handlers (Phần 1 & 2)
window.enterStructureLessonStep = enterStructureLessonStep;
window.enterRevolutionLessonStep = enterRevolutionLessonStep;
window.updateStructureConeGeometry = updateStructureConeGeometry;
window.jumpRevolutionAngle = jumpRevolutionAngle;
window.resetLessonProgress = resetLessonProgress;
window.resetAllSettings = resetAllSettings;

animate();
