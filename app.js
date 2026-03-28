// ============ SECURITY HELPERS ============
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Renderiza uma foto de forma segura no container usando DOM API (nao innerHTML).
 * Valida formato data URI antes de atribuir ao src.
 * @param {HTMLElement} container - Elemento onde a imagem sera inserida
 * @param {string|null} photoData - Data URI da imagem ou null
 */
function renderPhoto(container, photoData) {
    container.innerHTML = '';
    if (!photoData) return;
    if (typeof photoData === 'string' && photoData.startsWith('data:image/')) {
        if (!/^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(photoData)) {
            Logger.warn('Formato de foto invalido, ignorando.');
            return;
        }
        var img = document.createElement('img');
        img.src = photoData;
        img.style.maxWidth = '100%';
        img.style.borderRadius = '12px';
        img.style.marginTop = '6px';
        img.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        container.appendChild(img);
    }
}

// ============ DATA MANAGEMENT ============
var STORAGE_KEY = 'hadassa_meira_pregnancy';
var DATA_VERSION = 1;

function getDefaultData() {
    return {
        version: DATA_VERSION,
        config: {
            babyName: '',
            babySex: 'Menina',
            dum: '',
            dpp: '',
            momName: 'Jessica',
            doctor: ''
        },
        ultrasounds: [],
        appointments: [],
        notes: []
    };
}

function migrateData(data) {
    data.version = data.version || DATA_VERSION;
    if (!data.config) data.config = getDefaultData().config;
    if (!data.ultrasounds) data.ultrasounds = [];
    if (!data.appointments) data.appointments = [];
    if (!data.notes) data.notes = [];
    return data;
}

/**
 * Carrega dados do localStorage. Sem criptografia decorativa.
 * AUDIT V1.2 [V12-SEC-002]: Criptografia AES-GCM removida — chave armazenada
 * ao lado dos dados nao oferecia seguranca real.
 * @returns {Object} Dados da aplicacao
 */
function loadData() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        // Tentar recuperar do backup no IndexedDB
        Logger.info('Nenhum dado no localStorage. Verificando backup...');
        restoreFromBackup();
        return getDefaultData();
    }

    try {
        var data = JSON.parse(raw);
        if (data && typeof data === 'object' && data.config) {
            return migrateData(data);
        }
    } catch (e) {
        Logger.warn('Dados corrompidos no localStorage. Tentando backup...');
        restoreFromBackup();
    }
    return getDefaultData();
}

// Backup automatico no IndexedDB (mais resistente que localStorage)
var BACKUP_DB = 'hadassa_backup_db';
var BACKUP_STORE = 'backup';

function openBackupDB() {
    return new Promise(function(resolve, reject) {
        var req = indexedDB.open(BACKUP_DB, 1);
        req.onupgradeneeded = function(e) { e.target.result.createObjectStore(BACKUP_STORE); };
        req.onsuccess = function(e) { resolve(e.target.result); };
        req.onerror = function(e) { reject(e.target.error); };
    });
}

function autoBackup() {
    if (!appData || !appData.config) return;
    openBackupDB().then(function(db) {
        var tx = db.transaction(BACKUP_STORE, 'readwrite');
        tx.objectStore(BACKUP_STORE).put(JSON.stringify(appData), 'main_data');
        tx.objectStore(BACKUP_STORE).put(new Date().toISOString(), 'backup_date');
        // Backup de todos os localStorage extras
        var extras = {};
        ['hadassa_diary', 'hadassa_symptoms', 'hadassa_exams', 'hadassa_baby_names',
         'hadassa_kick_history', 'hadassa_contractions', 'hadassa_exam_checklist',
         'hadassa_bp_log', 'hadassa_bf_history', 'hadassa_custom_symptoms',
         'hadassa_list_enxoval', 'hadassa_list_malaMae', 'hadassa_list_malaBebe',
         'hadassa_list_doctorQuestions', 'hadassa_list_birthPlan',
         'hadassa_weekly_todos', 'hadassa_letter_to_baby'].forEach(function(key) {
            var val = localStorage.getItem(key);
            if (val) extras[key] = val;
        });
        tx.objectStore(BACKUP_STORE).put(JSON.stringify(extras), 'extras_data');
        Logger.debug('Backup automatico salvo');
    }).catch(function() {});
}

function restoreFromBackup() {
    // Nao restaurar se dados foram limpos intencionalmente
    if (localStorage.getItem('hadassa_data_cleared') === 'true') {
        localStorage.removeItem('hadassa_data_cleared');
        return;
    }
    openBackupDB().then(function(db) {
        var tx = db.transaction(BACKUP_STORE, 'readonly');
        var store = tx.objectStore(BACKUP_STORE);
        var reqMain = store.get('main_data');
        var reqExtras = store.get('extras_data');

        reqMain.onsuccess = function() {
            if (reqMain.result) {
                try {
                    var data = JSON.parse(reqMain.result);
                    if (data && data.config) {
                        localStorage.setItem(STORAGE_KEY, reqMain.result);
                        Logger.info('Dados restaurados do backup!');
                        // Reload para aplicar
                        location.reload();
                    }
                } catch(e) {}
            }
        };

        reqExtras.onsuccess = function() {
            if (reqExtras.result) {
                try {
                    var extras = JSON.parse(reqExtras.result);
                    Object.keys(extras).forEach(function(key) {
                        if (!localStorage.getItem(key)) {
                            localStorage.setItem(key, extras[key]);
                        }
                    });
                } catch(e) {}
            }
        };
    }).catch(function() {});
}

/**
 * Salva dados no localStorage com tratamento de erro.
 * AUDIT V1.2 [V12-DATA-002]: Erros de QuotaExceeded agora sao visiveis ao usuario.
 * @param {Object} data - Dados da aplicacao
 */
function saveData(data) {
    data.version = DATA_VERSION;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        // Backup automatico a cada save
        autoBackup();
    } catch (err) {
        if (err.name === 'QuotaExceededError') {
            Logger.error('localStorage cheio!');
            showToast('ERRO: Armazenamento cheio! Exporte um backup agora.', 10000);
        } else {
            Logger.error('Falha ao salvar dados:', err);
            showToast('ERRO: Nao foi possivel salvar os dados!', 10000);
        }
    }
}

// AUDIT V1.2 [V12-DATA-001]: appData inicializado como null, carregado em initApp()
var appData = null;

// ============ IndexedDB PARA FOTOS ============
// AUDIT V1.2 [V12-DATA-003]: Fotos migradas para IndexedDB para evitar estouro do localStorage
var PHOTO_DB_NAME = 'hadassa_photos';
var PHOTO_STORE = 'photos';

function openPhotoDB() {
    return new Promise(function(resolve, reject) {
        var request = indexedDB.open(PHOTO_DB_NAME, 1);
        request.onupgradeneeded = function(e) {
            e.target.result.createObjectStore(PHOTO_STORE);
        };
        request.onsuccess = function(e) { resolve(e.target.result); };
        request.onerror = function(e) { reject(e.target.error); };
    });
}

function savePhoto(id, dataUrl) {
    return openPhotoDB().then(function(db) {
        return new Promise(function(resolve, reject) {
            var tx = db.transaction(PHOTO_STORE, 'readwrite');
            tx.objectStore(PHOTO_STORE).put(dataUrl, id);
            tx.oncomplete = function() { resolve(); };
            tx.onerror = function(e) { reject(e.target.error); };
        });
    });
}

function loadPhoto(id) {
    return openPhotoDB().then(function(db) {
        return new Promise(function(resolve, reject) {
            var tx = db.transaction(PHOTO_STORE, 'readonly');
            var req = tx.objectStore(PHOTO_STORE).get(id);
            req.onsuccess = function() { resolve(req.result || null); };
            req.onerror = function(e) { reject(e.target.error); };
        });
    });
}

function deletePhoto(id) {
    return openPhotoDB().then(function(db) {
        return new Promise(function(resolve, reject) {
            var tx = db.transaction(PHOTO_STORE, 'readwrite');
            tx.objectStore(PHOTO_STORE).delete(id);
            tx.oncomplete = function() { resolve(); };
            tx.onerror = function(e) { reject(e.target.error); };
        });
    });
}

/**
 * Comprime imagem para reduzir tamanho antes de armazenar.
 * AUDIT V1.2 [V12-DATA-003]: Max 800px largura, JPEG quality 0.7
 * @param {string} dataUrl - Data URI da imagem original
 * @param {number} [maxWidth=800] - Largura maxima em pixels
 * @param {number} [quality=0.7] - Qualidade JPEG (0-1)
 * @returns {Promise<string>} Data URI comprimida
 */
function compressImage(dataUrl, maxWidth, quality) {
    maxWidth = maxWidth || 800;
    quality = quality || 0.7;
    return new Promise(function(resolve) {
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var w = img.width, h = img.height;
            if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = dataUrl;
    });
}

// ============ REFERENCE DATA ============
/**
 * Peso fetal estimado (g) por semana gestacional.
 * Valores: [percentil 10, percentil 50, percentil 90]
 * Fonte: Hadlock et al. (1991) / OMS Fetal Growth Charts (2017)
 * Ultima revisao: 20/03/2026
 */
var weightRef = {
    12: [10, 14, 18], 13: [17, 23, 30], 14: [33, 43, 55], 15: [55, 70, 90],
    16: [80, 100, 125], 17: [115, 140, 175], 18: [155, 190, 235], 19: [200, 240, 295],
    20: [249, 300, 373], 21: [300, 360, 440], 22: [360, 430, 525], 23: [420, 501, 610],
    24: [500, 600, 720], 25: [555, 660, 795], 26: [640, 760, 915], 27: [740, 875, 1050],
    28: [850, 1005, 1200], 29: [980, 1153, 1370], 30: [1120, 1319, 1560],
    31: [1280, 1502, 1770], 32: [1450, 1702, 1990], 33: [1640, 1918, 2230],
    34: [1840, 2146, 2480], 35: [2050, 2383, 2740], 36: [2260, 2622, 3000],
    37: [2470, 2859, 3260], 38: [2670, 3083, 3500], 39: [2850, 3288, 3720],
    40: [3000, 3462, 3900], 41: [3100, 3597, 4050], 42: [3150, 3685, 4100]
};

/**
 * Comprimento do femur (mm) por semana gestacional.
 * Valores: [percentil 10, percentil 50, percentil 90]
 * Fonte: Chitty et al. (1997) / INTERGROWTH-21st (2014)
 * Ultima revisao: 20/03/2026
 */
var femurRef = {
    12: [7, 8, 9], 13: [10, 11, 13], 14: [13, 15, 17], 15: [16, 18, 20],
    16: [18, 21, 23], 17: [21, 24, 26], 18: [24, 27, 29], 19: [27, 30, 32],
    20: [29, 33, 35], 21: [32, 35, 38], 22: [35, 38, 41], 23: [37, 41, 43],
    24: [39, 43, 46], 25: [42, 46, 48], 26: [44, 48, 51], 27: [47, 50, 53],
    28: [49, 53, 55], 29: [51, 55, 57], 30: [53, 57, 60], 31: [55, 59, 62],
    32: [57, 61, 64], 33: [59, 63, 66], 34: [61, 65, 68], 35: [63, 67, 69],
    36: [64, 68, 71], 37: [66, 70, 73], 38: [67, 71, 74], 39: [69, 72, 75],
    40: [70, 74, 76]
};

/**
 * Batimentos cardiacos fetais (bpm) por semana gestacional.
 * Valores: [minimo normal, media, maximo normal]
 * Fonte: Doubilet & Benson (1995) / AIUM Guidelines
 * Ultima revisao: 20/03/2026
 */
var heartRef = {
    6: [100, 120, 140], 7: [120, 140, 160], 8: [140, 160, 175],
    9: [155, 170, 185], 10: [160, 170, 180], 11: [155, 165, 175],
    12: [150, 160, 170], 13: [145, 155, 170], 14: [140, 150, 165],
    15: [135, 150, 165], 16: [130, 150, 165], 17: [130, 150, 165],
    18: [125, 150, 165], 19: [125, 150, 165], 20: [120, 150, 160],
    21: [120, 145, 160], 22: [120, 145, 160], 23: [120, 145, 160],
    24: [120, 145, 160], 25: [120, 145, 155], 26: [120, 145, 155],
    27: [120, 145, 155], 28: [120, 140, 155], 29: [120, 140, 155],
    30: [120, 140, 155], 31: [120, 140, 155], 32: [120, 140, 150],
    33: [115, 140, 150], 34: [115, 140, 150], 35: [115, 140, 150],
    36: [115, 140, 150], 37: [110, 140, 150], 38: [110, 140, 150],
    39: [110, 140, 150], 40: [110, 140, 150]
};

// ============ NAVIGATION ============
function showSection(sectionName) {
    document.querySelectorAll('.nav-btn').forEach(function(b) {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
    });
    document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
    var btn = document.querySelector('.nav-btn[data-section="' + sectionName + '"]');
    if (btn) {
        btn.classList.add('active');
        btn.setAttribute('aria-current', 'page');
    }

    // Update bottom nav
    document.querySelectorAll('.bottom-nav-btn').forEach(function(b) { b.classList.remove('active'); });
    var bottomBtn = document.querySelector('.bottom-nav-btn[data-section="' + sectionName + '"]');
    if (bottomBtn) bottomBtn.classList.add('active');
    // If section is not in bottom nav, highlight closest parent
    if (!bottomBtn) {
        var mapping = {
            symptoms: 'dashboard', appointments: 'dashboard', lists: 'dashboard',
            birthplan: 'dashboard', health: 'dashboard', ultrasounds: 'exams',
            charts: 'dashboard', params: 'dashboard', reports: 'dashboard', notes: 'diary'
        };
        var parent = mapping[sectionName];
        if (parent) {
            var pb = document.querySelector('.bottom-nav-btn[data-section="' + parent + '"]');
            if (pb) pb.classList.add('active');
        }
    }

    var sec = document.getElementById('sec-' + sectionName);
    if (sec) {
        sec.classList.add('active');
        // Add back button to non-dashboard sections
        if (sectionName !== 'dashboard' && !sec.querySelector('.back-btn')) {
            var backBtn = document.createElement('button');
            backBtn.className = 'back-btn';
            backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Início';
            backBtn.addEventListener('click', function() { location.hash = 'dashboard'; });
            sec.insertBefore(backBtn, sec.firstChild);
        }
    }
    if (sectionName === 'charts') initCharts();
    if (sectionName === 'params') renderParams();
    // Atalho: vaccines → abre ferramentas na aba vacinas
    if (sectionName === 'vaccines') {
        showSection('tools');
        if (typeof renderTool === 'function') renderTool('vaccines');
        document.querySelectorAll('[data-tooltab]').forEach(function(t) { t.classList.remove('active'); });
        var vTab = document.querySelector('[data-tooltab="vaccines"]');
        if (vTab) vTab.classList.add('active');
        return;
    }

    var sectionNames = {
        dashboard: 'Início', weekly: 'Meu Bebê', diary: 'Diário',
        symptoms: 'Sintomas', exams: 'Exames', appointments: 'Consultas',
        lists: 'Listas', birthplan: 'Parto', health: 'Saúde',
        ultrasounds: 'Ultrassons', charts: 'Gráficos',
        params: 'Parâmetros', reports: 'Relatórios',
        tools: 'Ferramentas', faq: 'Perguntas Frequentes', glossary: 'Glossário',
        notes: 'Anotações', config: 'Configurações'
    };
    var babyName = appData.config.babyName;
    document.title = (sectionNames[sectionName] || 'Início') + ' | ' + (babyName ? 'A Jornada de ' + babyName : 'Minha Gestação');
    // Atualizar título e subtítulo do header
    var titleEl = document.getElementById('appTitle');
    var subtitleEl = document.getElementById('appSubtitle');
    if (titleEl) titleEl.textContent = babyName ? 'A Jornada de ' + babyName : 'Minha Gestação';
    if (subtitleEl && babyName) {
        var sexLabel = appData.config.babySex || '';
        subtitleEl.textContent = babyName + (sexLabel ? ' (' + sexLabel + ')' : '');
    }
}

function handleHashChange() {
    var hash = location.hash.replace('#', '') || 'dashboard';
    showSection(hash);
}

// ============ LOGGING ============
var Logger = {
    _isDev: location.hostname === 'localhost' || location.hostname === '127.0.0.1',
    debug: function() { if (this._isDev) console.log.apply(console, ['[DEBUG]'].concat(Array.from(arguments))); },
    info: function() { if (this._isDev) console.info.apply(console, ['[INFO]'].concat(Array.from(arguments))); },
    warn: function() { console.warn.apply(console, ['[WARN]'].concat(Array.from(arguments))); },
    error: function() { console.error.apply(console, ['[ERROR]'].concat(Array.from(arguments))); }
};

// ============ TOAST NOTIFICATION ============
function showToast(message, duration) {
    duration = duration || 3000;
    var existing = document.getElementById('toastNotification');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'toastNotification';
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#8b5cf6,#ec4899);color:white;padding:12px 24px;border-radius:25px;font-family:Nunito,sans-serif;font-size:0.85em;font-weight:600;box-shadow:0 4px 20px rgba(139,92,246,0.4);z-index:9999;animation:fadeIn 0.3s ease;white-space:nowrap;';
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(function() { toast.remove(); }, 300);
    }, duration);
}

// ============ CONSTANTES ============
var PREGNANCY_DAYS = 280;
var SAFE_CERVIX_MM = 25;
var AI_CHAT_HISTORY_LIMIT = 20;
var MS_PER_DAY = 24 * 60 * 60 * 1000;

// ============ WEEK CALCULATIONS ============
/**
 * Calcula semanas e dias gestacionais a partir da DUM.
 * @param {string} dum - Data da ultima menstruacao (formato YYYY-MM-DD)
 * @param {string} [targetDate] - Data alvo (formato YYYY-MM-DD). Se omitido, usa data atual.
 * @returns {{weeks: number, days: number, totalDays: number}}
 */
/**
 * Cria Date a partir de string YYYY-MM-DD sem problemas de timezone.
 * Interpreta sempre como data local (meia-noite local).
 */
function parseLocalDate(dateStr) {
    var parts = dateStr.split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

/**
 * Formata Date para string YYYY-MM-DD sem conversão UTC.
 */
function toLocalDateStr(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
}

function calcWeeksFromDUM(dum, targetDate) {
    var dumDate = parseLocalDate(dum);
    var target = targetDate ? parseLocalDate(targetDate) : new Date();
    var diffMs = target - dumDate;
    var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    var weeks = Math.floor(diffDays / 7);
    var days = diffDays % 7;
    return { weeks: weeks, days: days, totalDays: diffDays };
}

/**
 * Calcula idade gestacional com base nos dados da 1ª US.
 * Usa a data da US + idade gestacional informada pelo médico como referência.
 * Ex: Se na US de 03/01/2026 o médico disse 7s+4d, e hoje é 22/03/2026,
 *     dias desde a US = 78, total de dias gestacionais = 53 + 78 = 131 = 18s+5d
 */
function calcWeeksFromUS(usDate, usWeeks, usDays, targetDate) {
    var usDateObj = parseLocalDate(usDate);
    var target = targetDate ? parseLocalDate(targetDate) : new Date();
    var daysSinceUS = Math.floor((target - usDateObj) / (1000 * 60 * 60 * 24));
    var totalDaysAtUS = (usWeeks * 7) + usDays;
    var totalDays = totalDaysAtUS + daysSinceUS;
    var weeks = Math.floor(totalDays / 7);
    var days = totalDays % 7;
    return { weeks: weeks, days: days, totalDays: totalDays };
}

/**
 * Calcula a idade gestacional usando a base configurada (DUM ou US).
 * Retorna null se não houver dados suficientes.
 */
function calcCurrentGestationalAge(targetDate) {
    var cfg = appData.config;
    if (cfg.dateBase === 'us' && cfg.firstUSDate && cfg.firstUSWeeks) {
        return calcWeeksFromUS(cfg.firstUSDate, parseInt(cfg.firstUSWeeks) || 0, parseInt(cfg.firstUSDays) || 0, targetDate);
    }
    if (cfg.dum) {
        return calcWeeksFromDUM(cfg.dum, targetDate);
    }
    return null;
}

function updateWeekBanner() {
    var cfg = appData.config;
    var info = calcCurrentGestationalAge();

    if (!info) {
        document.getElementById('currentWeek').textContent = '--';
        document.getElementById('progressText').textContent = 'Configure a DUM ou dados da 1ª US nas configurações';
        document.getElementById('progressBar').style.width = '0%';
        document.getElementById('dueDate').textContent = '--/--/----';
        return;
    }

    document.getElementById('currentWeek').textContent = info.weeks;
    var pct = Math.min((info.totalDays / PREGNANCY_DAYS) * 100, 100);
    document.getElementById('progressBar').style.width = pct + '%';
    document.getElementById('progressText').textContent =
        info.weeks + ' semanas e ' + info.days + ' dias | ' + Math.round(pct) + '% da gestação';

    if (cfg.dpp) {
        document.getElementById('dueDate').textContent = formatDate(cfg.dpp);
    } else if (cfg.dum) {
        var dumDate = parseLocalDate(cfg.dum);
        var dppDate = new Date(dumDate.getTime() + PREGNANCY_DAYS * MS_PER_DAY);
        document.getElementById('dueDate').textContent = formatDate(toLocalDateStr(dppDate));
    } else {
        document.getElementById('dueDate').textContent = '--/--/----';
    }

    var headerH1 = document.getElementById('appTitle');
    var headerSub = document.getElementById('appSubtitle');
    if (headerH1) headerH1.textContent = cfg.babyName ? 'A Jornada de ' + cfg.babyName : 'Minha Gestação';
    if (headerSub) headerSub.textContent = cfg.babyName ? cfg.babyName + ' (' + (cfg.babySex || '') + ') \u{1F49C}' : '';
}

// ============ WEEK CALENDAR STRIP ============
function renderWeekCalendar() {
    var container = document.getElementById('weekCalendar');
    if (!container) return;

    var today = new Date();
    var dayOfWeek = today.getDay(); // 0=Dom, 1=Seg...

    // Construir array de 7 dias (Dom a Sáb) da semana atual
    var weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);

    var dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    var monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // Buscar datas com eventos (consultas e exames agendados)
    var eventDates = {};
    if (appData.appointments) {
        appData.appointments.forEach(function(a) {
            if (a.date) eventDates[a.date] = (eventDates[a.date] || 0) + 1;
        });
    }
    try {
        var exams = typeof getExams === 'function' ? getExams() : JSON.parse(localStorage.getItem('hadassa_exams') || '[]');
        exams.forEach(function(ex) {
            if (ex.scheduledDate && ex.status === 'scheduled') eventDates[ex.scheduledDate] = (eventDates[ex.scheduledDate] || 0) + 1;
            if (ex.date) eventDates[ex.date] = (eventDates[ex.date] || 0) + 1;
        });
    } catch(e) {}

    var html = '';

    for (var i = 0; i < 7; i++) {
        var d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        var dateStr = toLocalDateStr(d);
        var isToday = d.toDateString() === today.toDateString();
        var hasEvent = eventDates[dateStr];

        var classes = 'cal-day';
        if (isToday) classes += ' today';
        if (hasEvent) classes += ' has-event';

        html += '<div class="' + classes + '" data-caldate="' + dateStr + '">';
        html += '<span class="day-label">' + dayLabels[i] + '</span>';
        html += '<span class="day-number">' + d.getDate() + '</span>';
        html += '</div>';
    }

    container.innerHTML = html;

    // Click em dia com evento → mostrar detalhes
    container.querySelectorAll('.cal-day').forEach(function(el) {
        el.addEventListener('click', function() {
            var date = el.dataset.caldate;
            showCalendarDayDetail(date);
        });
    });
}

function showCalendarDayDetail(dateStr) {
    var events = [];
    var dateLabel = formatDate(dateStr);

    // Consultas nesse dia
    if (appData.appointments) {
        appData.appointments.forEach(function(a) {
            if (a.date === dateStr) {
                events.push('<div style="padding:8px;background:var(--pink-50);border-radius:10px;margin-bottom:6px;">' +
                    '<strong style="color:var(--pink-600);">' + escapeHtml(a.type || 'Consulta') + '</strong>' +
                    (a.time ? ' <span style="color:var(--text-light);">' + escapeHtml(a.time) + '</span>' : '') +
                    (a.doctor ? '<br><small>Dr(a). ' + escapeHtml(a.doctor) + '</small>' : '') +
                    (a.location ? '<br><small>' + escapeHtml(a.location) + '</small>' : '') +
                    '</div>');
            }
        });
    }

    // Exames nesse dia
    try {
        var exams = typeof getExams === 'function' ? getExams() : JSON.parse(localStorage.getItem('hadassa_exams') || '[]');
        exams.forEach(function(ex) {
            if (ex.date === dateStr || ex.scheduledDate === dateStr) {
                events.push('<div style="padding:8px;background:var(--purple-50);border-radius:10px;margin-bottom:6px;">' +
                    '<strong style="color:#8b5cf6;">' + escapeHtml(ex.title || 'Exame') + '</strong>' +
                    '<br><small>' + escapeHtml(ex.type || '') + '</small>' +
                    '</div>');
            }
        });
    } catch(e) {}

    if (events.length === 0) {
        events.push('<div style="text-align:center;color:var(--text-light);padding:15px;">Nenhum evento neste dia</div>');
    }

    var content = '<div style="margin-bottom:10px;font-weight:700;color:var(--pink-600);">' + dateLabel + '</div>' + events.join('');
    document.getElementById('detailTitle').innerHTML = '<i class="fas fa-calendar-day"></i> Agenda do Dia';
    document.getElementById('detailContent').innerHTML = content;
    openModal('detailModal');
}

// ============ FORMAT HELPERS ============
/**
 * Formata data de YYYY-MM-DD para DD/MM/YYYY.
 * AUDIT V1.2 [V12-SEC-006]: Valida formato antes de processar para evitar XSS via import.
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return escapeHtml(String(dateStr));
    var parts = dateStr.split('-');
    return parts[2] + '/' + parts[1] + '/' + parts[0];
}

function genId() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

var MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// ============ ANALYSIS FUNCTIONS (pure, testable) ============
// AUDIT V1.2 [V12-COD-003]: Logica de analise medica desacoplada da apresentacao

function analyzeHeartbeat(value, week) {
    if (!value || !week || !heartRef[week]) return null;
    var ref = heartRef[week];
    var status = (value >= ref[0] && value <= ref[2]) ? 'safe' : 'warning';
    return {
        status: status,
        label: status === 'safe' ? 'Normal' : 'Fora da faixa de referência — consulte seu médico',
        reference: ref[0] + ' - ' + ref[2] + ' bpm'
    };
}

function analyzeWeight(value, week) {
    if (!value || !week || !weightRef[week]) return null;
    var ref = weightRef[week];
    var status = (value >= ref[0] * 0.8 && value <= ref[2] * 1.2) ? 'safe' : 'warning';
    return {
        status: status,
        label: status === 'safe' ? 'Adequado' : 'Fora da faixa de referência — consulte seu médico',
        reference: '~' + ref[1] + ' g (p10: ' + ref[0] + ', p90: ' + ref[2] + ')'
    };
}

function analyzeFemur(value, week) {
    if (!value || !week || !femurRef[week]) return null;
    var ref = femurRef[week];
    var status = (value >= ref[0] && value <= ref[2]) ? 'safe' : 'warning';
    return {
        status: status,
        label: status === 'safe' ? 'Normal' : 'Fora da faixa de referência — consulte seu médico',
        reference: ref[0] + ' - ' + ref[2] + ' mm'
    };
}

function analyzeCervix(value) {
    if (!value) return null;
    var numVal = Number(value);
    if (numVal >= SAFE_CERVIX_MM) return { status: 'safe', label: 'Baixo Risco', reference: '>= 25 mm' };
    if (numVal >= 15) return { status: 'warning', label: 'Atenção — consulte seu médico', reference: '>= 25 mm' };
    return { status: 'danger', label: 'Risco — procure seu médico', reference: '>= 25 mm' };
}

// ============ FEAT-003: FRUIT SIZE COMPARISON ============
var fruitByWeek = {
    4: { fruit: 'Semente de papoula', emoji: '\u{1F33E}', size: '~2mm' },
    5: { fruit: 'Grão de pimenta', emoji: '\u{1F336}', size: '~3mm' },
    6: { fruit: 'Lentilha', emoji: '\u{1FAD8}', size: '~4mm' },
    7: { fruit: 'Mirtilo', emoji: '\u{1FAD0}', size: '~8mm' },
    8: { fruit: 'Framboesa', emoji: '\u{1F347}', size: '~16mm' },
    9: { fruit: 'Uva', emoji: '\u{1F347}', size: '~23mm' },
    10: { fruit: 'Azeitona', emoji: '\u{1FAD2}', size: '~31mm' },
    11: { fruit: 'Figo', emoji: '\u{1F95D}', size: '~41mm' },
    12: { fruit: 'Limão', emoji: '\u{1F34B}', size: '~5cm' },
    13: { fruit: 'Ervilha', emoji: '\u{1F952}', size: '~7cm' },
    14: { fruit: 'Pêssego', emoji: '\u{1F351}', size: '~9cm' },
    15: { fruit: 'Maçã', emoji: '\u{1F34E}', size: '~10cm' },
    16: { fruit: 'Abacate', emoji: '\u{1F951}', size: '~12cm' },
    17: { fruit: 'Pera', emoji: '\u{1F350}', size: '~13cm' },
    18: { fruit: 'Batata-doce', emoji: '\u{1F360}', size: '~14cm' },
    19: { fruit: 'Manga', emoji: '\u{1F96D}', size: '~15cm' },
    20: { fruit: 'Banana', emoji: '\u{1F34C}', size: '~16cm' },
    22: { fruit: 'Papaia', emoji: '\u{1F345}', size: '~28cm' },
    24: { fruit: 'Espiga de milho', emoji: '\u{1F33D}', size: '~30cm' },
    26: { fruit: 'Alface', emoji: '\u{1F96C}', size: '~36cm' },
    28: { fruit: 'Berinjela', emoji: '\u{1F346}', size: '~38cm' },
    30: { fruit: 'Repolho', emoji: '\u{1F96C}', size: '~40cm' },
    32: { fruit: 'Abacaxi', emoji: '\u{1F34D}', size: '~42cm' },
    34: { fruit: 'Melão', emoji: '\u{1F348}', size: '~45cm' },
    36: { fruit: 'Alface romana', emoji: '\u{1F96C}', size: '~47cm' },
    38: { fruit: 'Abóbora', emoji: '\u{1F383}', size: '~50cm' },
    40: { fruit: 'Melancia', emoji: '\u{1F349}', size: '~51cm' }
};

function getFruitForWeek(week) {
    if (fruitByWeek[week]) return fruitByWeek[week];
    // Encontrar a semana mais proxima
    var keys = Object.keys(fruitByWeek).map(Number).sort(function(a, b) { return a - b; });
    for (var i = keys.length - 1; i >= 0; i--) {
        if (keys[i] <= week) return fruitByWeek[keys[i]];
    }
    return null;
}

// ============ FEAT-002: MILESTONES + COUNTDOWN ============
var milestones = {
    4: 'O coração começa a se formar!',
    6: 'O coração já está batendo!',
    8: 'Bracinhos e perninhas estão se formando',
    10: 'Todos os órgãos vitais estão presentes',
    12: 'Todos os órgãos principais estão formados!',
    14: 'O bebê já faz expressões faciais',
    16: 'O bebê já se mexe, mas você ainda não sente',
    18: 'Você pode começar a sentir os primeiros chutinhos!',
    20: 'Metade da gestação! O bebê já ouve sons externos',
    22: 'As sobrancelhas e cílios estão se formando',
    24: 'O bebê reage à luz e sons!',
    26: 'Os olhos começam a se abrir',
    28: 'Os olhos se abrem pela primeira vez!',
    30: 'O cérebro está crescendo rapidamente',
    32: 'O bebê já pratica a respiração',
    34: 'O sistema imunológico está amadurecendo',
    36: 'Pulmões quase maduros, posição para o parto',
    38: 'O bebê é considerado a termo!',
    40: 'Pronto(a) para nascer!'
};

function getMilestoneForWeek(week) {
    if (milestones[week]) return milestones[week];
    var keys = Object.keys(milestones).map(Number).sort(function(a, b) { return a - b; });
    for (var i = keys.length - 1; i >= 0; i--) {
        if (keys[i] <= week) return milestones[keys[i]];
    }
    return 'Uma nova vida está crescendo!';
}

function renderMilestoneCard() {
    var card = document.getElementById('milestoneCard');
    var countdownDiv = document.getElementById('countdownContent');
    var milestoneDiv = document.getElementById('milestoneContent');
    var fruitDiv = document.getElementById('fruitContent');
    var cfg = appData.config;

    var info = calcCurrentGestationalAge();
    if (!info) {
        card.style.display = 'none';
        return;
    }

    card.style.display = 'block';
    var daysLeft = PREGNANCY_DAYS - info.totalDays;
    if (daysLeft < 0) daysLeft = 0;

    var trimester = info.weeks < 14 ? 1 : info.weeks < 28 ? 2 : 3;
    var trimesterColors = { 1: '#f472b6', 2: '#a855f7', 3: '#3b82f6' };
    var trimesterLabels = { 1: '1º Trimestre', 2: '2º Trimestre', 3: '3º Trimestre' };

    // Countdown
    countdownDiv.innerHTML =
        '<div style="text-align:center;padding:10px 0;">' +
            '<div style="font-size:0.75em;color:var(--text-light);text-transform:uppercase;letter-spacing:1px;">Faltam</div>' +
            '<div style="font-size:2.5em;font-weight:800;color:' + trimesterColors[trimester] + ';line-height:1.1;" class="countdown-pulse">' + daysLeft + '</div>' +
            '<div style="font-size:0.85em;color:var(--text-medium);">dias para conhecer <strong>' + escapeHtml(cfg.babyName) + '</strong></div>' +
            '<div style="margin-top:8px;display:inline-block;padding:4px 14px;border-radius:20px;font-size:0.7em;font-weight:700;color:white;background:' + trimesterColors[trimester] + ';">' + trimesterLabels[trimester] + '</div>' +
        '</div>';

    // Milestone
    var milestone = getMilestoneForWeek(info.weeks);
    milestoneDiv.innerHTML =
        '<div style="text-align:center;padding:8px 0;margin-top:5px;border-top:1px solid var(--pink-100);">' +
            '<div style="font-size:0.7em;color:var(--text-light);margin-bottom:4px;">Semana ' + info.weeks + '</div>' +
            '<div style="font-size:0.9em;color:var(--text-dark);font-weight:600;">\u{2728} ' + escapeHtml(milestone) + '</div>' +
        '</div>';

    // Fruit
    var fruit = getFruitForWeek(info.weeks);
    if (fruit) {
        fruitDiv.innerHTML =
            '<div style="text-align:center;padding:10px 0;margin-top:5px;border-top:1px solid var(--pink-100);">' +
                '<div style="font-size:0.7em;color:var(--text-light);margin-bottom:2px;">Seu bebê tem o tamanho de</div>' +
                '<div style="font-size:2.2em;margin:4px 0;">' + fruit.emoji + '</div>' +
                '<div style="font-size:0.95em;font-weight:700;color:var(--pink-600);">' + escapeHtml(fruit.fruit) + '</div>' +
                '<div style="font-size:0.75em;color:var(--text-light);">' + escapeHtml(fruit.size) + '</div>' +
            '</div>';
    } else {
        fruitDiv.innerHTML = '';
    }
}

// ============ FEAT-006: EXAM CHECKLIST ============
var examsByTrimester = {
    1: {
        label: '1º Trimestre (1-13 semanas)',
        exams: [
            'Hemograma completo',
            'Tipo sanguíneo + fator Rh',
            'Glicemia de jejum',
            'Sorologias (HIV, Sífilis, Hepatite B/C, Toxoplasmose, Rubéola, CMV)',
            'Urina tipo 1 + urocultura',
            'Ultrassom transvaginal (6-8 semanas)',
            'Ultrassom de translucência nucal (11-14 semanas)',
            'NIPT (se indicado)'
        ]
    },
    2: {
        label: '2º Trimestre (14-27 semanas)',
        exams: [
            'Ultrassom morfológico (20-24 semanas)',
            'Teste de tolerância à glicose - TOTG 75g (24-28 semanas)',
            'Hemograma de controle',
            'Urina tipo 1 + urocultura (repetir)'
        ]
    },
    3: {
        label: '3º Trimestre (28-40 semanas)',
        exams: [
            'Ultrassom de 3º trimestre (32-36 semanas)',
            'Estreptococo grupo B - GBS (35-37 semanas)',
            'Hemograma de controle',
            'Sorologias de repetição',
            'Cardiotocografia (se indicado)',
            'Perfil biofísico fetal (se indicado)'
        ]
    }
};

function getExamChecklist() {
    var saved = localStorage.getItem('hadassa_exam_checklist');
    if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
}

function saveExamChecklist(data) {
    localStorage.setItem('hadassa_exam_checklist', JSON.stringify(data));
}

/**
 * Retorna lista de itens desmarcados manualmente pelo usuário.
 */
function getManualUnchecks() {
    try { return JSON.parse(localStorage.getItem('hadassa_exam_unchecked') || '[]'); } catch(e) { return []; }
}
function saveManualUnchecks(list) {
    localStorage.setItem('hadassa_exam_unchecked', JSON.stringify(list));
}

/**
 * Calcula o trimestre de um exame baseado na sua data e nos dados gestacionais.
 * Retorna 1, 2 ou 3.
 */
function getExamTrimester(examDate) {
    var info = null;
    var cfg = appData.config;
    if (cfg.dateBase === 'us' && cfg.firstUSDate && cfg.firstUSWeeks) {
        info = calcWeeksFromUS(cfg.firstUSDate, parseInt(cfg.firstUSWeeks) || 0, parseInt(cfg.firstUSDays) || 0, examDate);
    } else if (cfg.dum) {
        info = calcWeeksFromDUM(cfg.dum, examDate);
    }
    if (!info) return null;
    return info.weeks < 14 ? 1 : info.weeks < 28 ? 2 : 3;
}

/**
 * Auto-marca itens do checklist de trimestre com base nos exames realizados.
 * Respeita desmarcações manuais e usa a data do exame para determinar o trimestre.
 */
function autoCheckExamsFromEntries() {
    var exams = [];
    try { exams = JSON.parse(localStorage.getItem('hadassa_exams') || '[]'); } catch(e) {}
    var doneExams = exams.filter(function(ex) { return ex.status === 'done'; });
    if (doneExams.length === 0) return;

    var checklist = getExamChecklist();
    var unchecked = getManualUnchecks();
    var changed = false;

    // APENAS itens do 1º trimestre + itens ÚNICOS do 2º e 3º são auto-marcados.
    // Itens repetidos (hemograma controle, urina repetir, sorologias repetição)
    // NÃO são auto-marcados - o usuário marca manualmente quando fizer.
    var autoCheckItems = {
        't1_0': ['hemograma', 'hemoglobina', 'hematócrito', 'hematocrito', 'eritrócito', 'eritrocito', 'leucócito', 'leucocito', 'plaqueta', 'vcm', 'hcm', 'chcm', 'rdw'],
        't1_1': ['tipo sangu', 'grupo sangu', 'fator rh', 'abo', 'coombs'],
        't1_2': ['glicemia', 'glicose', 'jejum', 'glucose'],
        't1_3': ['hiv', 'sifilis', 'sífilis', 'hepatite', 'toxoplasm', 'rubéola', 'rubeola', 'cmv', 'sorologia', 'vdrl'],
        't1_4': ['urina tipo', 'urocultura', 'eas', 'sumário de urina', 'parcial de urina'],
        't1_5': ['transvaginal'],
        't1_6': ['transluc', 'nucal'],
        't1_7': ['nipt'],
        't2_0': ['morfológico', 'morfologico'],
        't2_1': ['totg', 'tolerância à glicose', 'tolerancia a glicose', 'curva glic', '75g'],
        't3_1': ['estreptococo', 'gbs', 'streptococcus']
        // t2_2, t2_3, t3_0, t3_2, t3_3, t3_4, t3_5 = NÃO auto-marcar (repetições ou muito genéricos)
    };

    doneExams.forEach(function(ex) {
        var searchText = ((ex.title || '') + ' ' + (ex.results || '') + ' ' + (ex.type || '')).toLowerCase();
        var examTrimester = ex.date ? getExamTrimester(ex.date) : null;

        Object.keys(autoCheckItems).forEach(function(key) {
            if (checklist[key]) return;
            if (unchecked.indexOf(key) !== -1) return;

            var keywords = autoCheckItems[key];
            var matched = keywords.some(function(kw) { return searchText.indexOf(kw) !== -1; });
            if (!matched) return;

            var keyTrimester = parseInt(key.charAt(1));

            // Para 1º tri: sempre marca
            if (keyTrimester === 1) {
                checklist[key] = true;
                changed = true;
            }
            // Para 2º/3º tri: só marca se o exame foi feito NAQUELE trimestre
            else if (examTrimester !== null && examTrimester === keyTrimester) {
                checklist[key] = true;
                changed = true;
            }
        });
    });

    if (changed) {
        saveExamChecklist(checklist);
    }
}

function renderExamChecklist() {
    var card = document.getElementById('examChecklistCard');
    var container = document.getElementById('examChecklistContent');
    var cfg = appData.config;

    var info = calcCurrentGestationalAge();
    if (!info) {
        card.style.display = 'none';
        return;
    }

    card.style.display = 'block';
    var currentTrimester = info.weeks < 14 ? 1 : info.weeks < 28 ? 2 : 3;

    // Limpar checks automáticos de trimestres futuros (bug de versões anteriores)
    if (!localStorage.getItem('hadassa_checklist_cleaned_v3')) {
        var cl = getExamChecklist();
        var trimesterOfKey = { t1: 1, t2: 2, t3: 3 };
        var cleaned = false;
        Object.keys(cl).forEach(function(key) {
            var tri = trimesterOfKey[key.substring(0, 2)];
            if (tri && tri > currentTrimester) {
                delete cl[key];
                cleaned = true;
            }
        });
        if (cleaned) saveExamChecklist(cl);
        localStorage.setItem('hadassa_checklist_cleaned_v3', 'true');
    }

    // Auto-marcar exames realizados antes de renderizar
    autoCheckExamsFromEntries();
    var checked = getExamChecklist();

    var html = '';
    for (var t = 1; t <= 3; t++) {
        var data = examsByTrimester[t];
        var isCurrent = t === currentTrimester;
        var isPast = t < currentTrimester;

        html += '<div style="margin-bottom:12px;' + (isCurrent ? '' : 'opacity:0.7;') + '">';
        html += '<div style="font-size:0.8em;font-weight:700;color:' + (isCurrent ? 'var(--pink-600)' : 'var(--text-light)') + ';margin-bottom:6px;">';
        html += escapeHtml(data.label);
        if (isCurrent) html += ' \u{1F449}';
        html += '</div>';

        data.exams.forEach(function(exam, idx) {
            var key = 't' + t + '_' + idx;
            var isChecked = !!checked[key];
            html += '<label style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:0.82em;color:var(--text-dark);cursor:pointer;border-bottom:1px solid var(--pink-50);">';
            html += '<input type="checkbox" data-exam-key="' + key + '" ' + (isChecked ? 'checked' : '') + ' style="width:18px;height:18px;accent-color:var(--pink-500);">';
            html += '<span style="' + (isChecked ? 'text-decoration:line-through;color:var(--text-light);' : '') + '">' + escapeHtml(exam) + '</span>';
            html += '</label>';
        });

        html += '</div>';
    }

    html += '<div style="font-size:0.65em;color:var(--text-light);margin-top:8px;text-align:center;">Lista de referência. Confirme com seu obstetra quais exames são indicados para você.</div>';
    container.innerHTML = html;

    // Event listeners for checkboxes
    container.querySelectorAll('input[data-exam-key]').forEach(function(cb) {
        cb.addEventListener('change', function() {
            var key = cb.dataset.examKey;
            var checklist = getExamChecklist();
            var unchecked = getManualUnchecks();
            if (cb.checked) {
                checklist[key] = true;
                // Remover da lista de desmarcados manuais
                unchecked = unchecked.filter(function(k) { return k !== key; });
            } else {
                delete checklist[key];
                // Adicionar à lista de desmarcados manuais para não remarcar
                if (unchecked.indexOf(key) === -1) unchecked.push(key);
            }
            saveExamChecklist(checklist);
            saveManualUnchecks(unchecked);
            renderExamChecklist(); // re-render for line-through
        });
    });
}

// ============ EXAM ALERT (gentil, 1x por sessão) ============
/**
 * Exames recomendados por faixa de semanas gestacionais.
 * Cada item tem: semana mínima, semana máxima, nome, e chave do checklist.
 */
var examSchedule = [
    { minWeek: 6, maxWeek: 8, name: 'Ultrassom transvaginal', key: 't1_5' },
    { minWeek: 1, maxWeek: 13, name: 'Hemograma completo', key: 't1_0' },
    { minWeek: 1, maxWeek: 13, name: 'Tipo sanguíneo + fator Rh', key: 't1_1' },
    { minWeek: 1, maxWeek: 13, name: 'Glicemia de jejum', key: 't1_2' },
    { minWeek: 1, maxWeek: 13, name: 'Sorologias', key: 't1_3' },
    { minWeek: 1, maxWeek: 13, name: 'Urina tipo 1 + urocultura', key: 't1_4' },
    { minWeek: 11, maxWeek: 14, name: 'Ultrassom de translucência nucal', key: 't1_6' },
    { minWeek: 20, maxWeek: 24, name: 'Ultrassom morfológico', key: 't2_0' },
    { minWeek: 24, maxWeek: 28, name: 'Teste de tolerância à glicose (TOTG)', key: 't2_1' },
    { minWeek: 14, maxWeek: 27, name: 'Hemograma de controle', key: 't2_2' },
    { minWeek: 14, maxWeek: 27, name: 'Urina tipo 1 + urocultura (repetir)', key: 't2_3' },
    { minWeek: 32, maxWeek: 36, name: 'Ultrassom de 3º trimestre', key: 't3_0' },
    { minWeek: 35, maxWeek: 37, name: 'Estreptococo grupo B (GBS)', key: 't3_1' },
    { minWeek: 28, maxWeek: 40, name: 'Sorologias de repetição', key: 't3_3' }
];

function renderExamAlert() {
    var alertCard = document.getElementById('examAlertCard');
    if (!alertCard) return;

    var info = calcCurrentGestationalAge();
    if (!info) {
        alertCard.style.display = 'none';
        return;
    }

    // Só mostrar 1x por sessão (até fechar o banner)
    if (sessionStorage.getItem('hadassa_exam_alert_dismissed')) {
        alertCard.style.display = 'none';
        return;
    }

    var currentWeek = info.weeks;
    var checked = getExamChecklist();

    // Filtrar exames pendentes que estão na janela da idade gestacional atual
    var pending = examSchedule.filter(function(item) {
        return currentWeek >= item.minWeek && currentWeek <= item.maxWeek && !checked[item.key];
    });

    if (pending.length === 0) {
        alertCard.style.display = 'none';
        return;
    }

    var html = '<div class="card" style="background:linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%);border:1px solid #ffc107;position:relative;">';
    html += '<button id="examAlertDismiss" style="position:absolute;top:8px;right:12px;background:none;border:none;font-size:1.2em;cursor:pointer;color:#856404;padding:4px;" title="Fechar">&times;</button>';
    html += '<div class="card-title" style="color:#856404;font-size:0.85em;"><i class="fas fa-bell"></i> Lembrete de Exames</div>';
    html += '<p style="font-size:0.78em;color:#856404;margin-bottom:8px;">Você está com <strong>' + currentWeek + ' semanas</strong>. Estes exames são recomendados para este período:</p>';
    html += '<ul style="margin:0;padding-left:20px;font-size:0.78em;color:#664d03;">';
    pending.forEach(function(item) {
        html += '<li style="margin-bottom:4px;">' + escapeHtml(item.name) + ' <span style="color:#999;font-size:0.85em;">(' + item.minWeek + '-' + item.maxWeek + ' sem)</span></li>';
    });
    html += '</ul>';
    html += '<p style="font-size:0.65em;color:#a68b00;margin-top:8px;text-align:center;">Confirme com seu obstetra quais exames são indicados para você.</p>';
    html += '</div>';

    alertCard.innerHTML = html;
    alertCard.style.display = 'block';

    // Botão de fechar
    document.getElementById('examAlertDismiss').addEventListener('click', function() {
        alertCard.style.display = 'none';
        sessionStorage.setItem('hadassa_exam_alert_dismissed', 'true');
    });
}

// ============ LAB RESULTS DASHBOARD ============
/**
 * Extrai valores numéricos dos resultados de exames e exibe no dashboard.
 */
function renderLabResults() {
    var card = document.getElementById('labResultsCard');
    var container = document.getElementById('labResultsContent');
    if (!card || !container) return;

    var exams = [];
    try { exams = typeof getExams === 'function' ? getExams() : JSON.parse(localStorage.getItem('hadassa_exams') || '[]'); } catch(e) {}
    var doneExams = exams.filter(function(ex) { return ex.status === 'done' && ex.results; });

    if (doneExams.length === 0) {
        card.style.display = 'none';
        return;
    }

    // Padrões para extrair valores dos resultados
    var patterns = [
        { name: 'Glicose', unit: 'mg/dL', regex: /glic(?:ose|emia)[:\s]*(\d+[\.,]?\d*)\s*mg/i, ref: '65-100', icon: '\u{1F4C9}' },
        { name: 'Hemoglobina', unit: 'g/dL', regex: /hemoglobina[:\s]*(\d+[\.,]?\d*)\s*g/i, ref: '12-15', icon: '\u{1FA78}' },
        { name: 'Hematócrito', unit: '%', regex: /hemat[oó]crito[:\s]*(\d+[\.,]?\d*)\s*%/i, ref: '36-46', icon: '\u{1FA78}' },
        { name: 'Plaquetas', unit: '/mm\u00B3', regex: /plaqueta[s]?[:\s]*(\d+[\.,]?\d*)/i, ref: '150.000-400.000', icon: '\u{1FA78}' },
        { name: 'Leucócitos', unit: '/mm\u00B3', regex: /leuc[oó]cito[s]?[:\s]*(\d+[\.,]?\d*)/i, ref: '4.000-10.000', icon: '\u{1FA78}' },
        { name: 'Tipo Sanguíneo', unit: '', regex: /grupo\s+sangu[ií]neo\s*\(abo\)[:\s]*([A-Z]+)/i, ref: '', icon: '\u{1FA78}' },
        { name: 'Fator Rh', unit: '', regex: /(?:fator\s*rh|coombs\s*(?:indireto|direto))[:\s]*(positivo|negativo|[+-])/i, ref: '', icon: '\u{1FA78}' },
        { name: 'TSH', unit: 'mUI/L', regex: /tsh[:\s]*(\d+[\.,]?\d*)/i, ref: '0.5-4.0', icon: '\u{1F9EC}' },
        { name: 'Ferro', unit: '\u00B5g/dL', regex: /ferro\s*s[eé]rico[:\s]*(\d+[\.,]?\d*)/i, ref: '50-170', icon: '\u{1FA78}' }
    ];

    var results = [];
    // Buscar em todos os exames realizados (mais recente tem prioridade)
    var allText = '';
    doneExams.sort(function(a, b) { return b.date.localeCompare(a.date); });
    doneExams.forEach(function(ex) { allText += ex.results + '\n'; });

    patterns.forEach(function(p) {
        var match = allText.match(p.regex);
        if (match) {
            results.push({ name: p.name, value: match[1], unit: p.unit, ref: p.ref, icon: p.icon });
        }
    });

    if (results.length === 0) {
        card.style.display = 'none';
        return;
    }

    card.style.display = 'block';
    var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
    results.forEach(function(r) {
        html += '<div style="background:var(--pink-50);border-radius:10px;padding:10px;text-align:center;">';
        html += '<div style="font-size:1.2em;">' + r.icon + '</div>';
        html += '<div style="font-size:1.1em;font-weight:700;color:var(--pink-600);">' + escapeHtml(r.value) + (r.unit ? ' <span style="font-size:0.7em;font-weight:400;">' + r.unit + '</span>' : '') + '</div>';
        html += '<div style="font-size:0.7em;color:var(--text-medium);">' + escapeHtml(r.name) + '</div>';
        if (r.ref) html += '<div style="font-size:0.6em;color:var(--text-light);">Ref: ' + r.ref + '</div>';
        html += '</div>';
    });
    html += '</div>';
    html += '<div style="font-size:0.6em;color:var(--text-light);text-align:center;margin-top:8px;">Valores extraídos automaticamente dos resultados. Confirme com seu médico.</div>';
    container.innerHTML = html;
}

// ============ UX-013: SKELETON LOADING ============
function showSkeleton(containerId, count) {
    count = count || 3;
    var container = document.getElementById(containerId);
    if (!container) return;
    var html = '';
    for (var i = 0; i < count; i++) {
        html += '<div class="skeleton-item"><div class="skeleton-line skeleton-title"></div><div class="skeleton-line skeleton-text"></div><div class="skeleton-line skeleton-text short"></div></div>';
    }
    container.innerHTML = html;
}

// ============ UX-017: ACHIEVEMENTS / GAMIFICATION ============
function _getExamCount() {
    try { var e = typeof getExams === 'function' ? getExams() : JSON.parse(localStorage.getItem('hadassa_exams') || '[]'); return e.filter(function(x){return x.status==='done'}).length; } catch(e) { return 0; }
}
function _getUSExamCount() {
    try { var e = typeof getExams === 'function' ? getExams() : JSON.parse(localStorage.getItem('hadassa_exams') || '[]'); return e.filter(function(x){return x.type==='us'&&x.status==='done'}).length; } catch(e) { return 0; }
}
function _hasHeartbeat() {
    if (getAllUSData().some(function(u){return u.heartbeat;})) return true;
    try { var e = typeof getExams === 'function' ? getExams() : JSON.parse(localStorage.getItem('hadassa_exams') || '[]');
        return e.some(function(x){ return x.type==='us' && x.specificData && x.specificData.exUsHeart; });
    } catch(e) { return false; }
}

var achievementDefs = [
    { id: 'first_us', icon: '\u{1F4F8}', title: 'Primeiro Registro', desc: 'Registrou o primeiro exame', check: function() { return getAllUSData().length >= 1 || _getExamCount() >= 1; } },
    { id: 'heartbeat', icon: '\u{1F49C}', title: 'Coração Batendo', desc: 'Registrou batimentos cardíacos', check: function() { return _hasHeartbeat(); } },
    { id: 'halfway', icon: '\u{1F389}', title: 'Metade do Caminho', desc: 'Atingiu 20 semanas', check: function() { var i = calcCurrentGestationalAge(); return i ? i.weeks >= 20 : false; } },
    { id: 'five_apps', icon: '\u{1F4C5}', title: 'Mãe Organizada', desc: '5 consultas ou exames', check: function() { return (appData.appointments || []).length + _getExamCount() >= 5; } },
    { id: 'ten_notes', icon: '\u{1F4D6}', title: 'Diário Completo', desc: '10 anotações feitas', check: function() { return (appData.notes || []).length >= 10; } },
    { id: 'three_us', icon: '\u{1F4CA}', title: 'Acompanhamento', desc: '3 ultrassons registrados', check: function() { return getAllUSData().length >= 3; } },
    { id: 'weight_track', icon: '\u{2696}\u{FE0F}', title: 'Controlando o Peso', desc: 'Registrou peso em uma consulta', check: function() { return (appData.appointments || []).some(function(a) { return a.momWeight; }); } },
    { id: 'third_tri', icon: '\u{1F31F}', title: 'Reta Final', desc: 'Entrou no 3º trimestre', check: function() { var i = calcCurrentGestationalAge(); return i ? i.weeks >= 28 : false; } }
];

function renderAchievements() {
    var container = document.getElementById('achievementsContainer');
    if (!container) return;

    var unlocked = [];
    var locked = [];
    achievementDefs.forEach(function(a) {
        if (a.check()) unlocked.push(a); else locked.push(a);
    });

    if (unlocked.length === 0 && locked.length === 0) { container.innerHTML = ''; return; }

    var html = '<div class="card"><div class="card-title"><i class="fas fa-trophy"></i> Conquistas (' + unlocked.length + '/' + achievementDefs.length + ')</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:8px;">';

    unlocked.forEach(function(a) {
        html += '<div class="achievement-badge unlocked" title="' + escapeHtml(a.desc) + '">';
        html += '<span style="font-size:1.4em;">' + a.icon + '</span>';
        html += '<span style="font-size:0.6em;font-weight:700;color:var(--pink-600);">' + escapeHtml(a.title) + '</span>';
        html += '</div>';
    });

    locked.forEach(function(a) {
        html += '<div class="achievement-badge locked" title="' + escapeHtml(a.desc) + '">';
        html += '<span style="font-size:1.4em;filter:grayscale(1);opacity:0.3;">' + a.icon + '</span>';
        html += '<span style="font-size:0.6em;color:var(--text-light);">' + escapeHtml(a.title) + '</span>';
        html += '</div>';
    });

    html += '</div></div>';
    container.innerHTML = html;
}

// ============ UX-018: DYNAMIC THEME BY BABY SEX ============
function applyThemeBySex() {
    var sex = appData.config.babySex;
    document.documentElement.classList.remove('theme-boy', 'theme-neutral');
    if (sex === 'Menino') {
        document.documentElement.classList.add('theme-boy');
    } else if (sex === 'Indefinido') {
        document.documentElement.classList.add('theme-neutral');
    }

    // Update decorative floating elements
    var decorContainer = document.getElementById('themeDecorContainer');
    if (decorContainer) {
        var decorEmojis = {
            'Menina': ['🎀', '🌸', '🦋', '💖', '🌷', '✨', '🩰', '🎀'],
            'Menino': ['⭐', '🚀', '☁️', '🌙', '⛵', '✨', '🧸', '🌟'],
            'Indefinido': ['🌿', '🌻', '🍀', '🌈', '🦕', '✨', '🌼', '🐣']
        };
        var emojis = decorEmojis[sex] || decorEmojis['Menina'];
        var html = '';
        emojis.slice(0, 6).forEach(function(emoji) {
            html += '<div class="theme-decor">' + emoji + '</div>';
        });
        decorContainer.innerHTML = html;
    }
}

// ============ UX-020: METRIC HELP POPOVERS ============
var metricHelp = {
    heartbeat: '<strong>Batimentos Cardíacos (BPM)</strong><br>Frequência cardíaca do bebê em batimentos por minuto. Normal: 110-160 bpm após o 1º trimestre.',
    weight: '<strong>Peso Fetal Estimado</strong><br>Peso calculado por fórmulas baseadas em medidas do ultrassom. É uma estimativa com margem de erro de ±15%.',
    femur: '<strong>Comprimento do Fêmur (CF)</strong><br>Mede o osso da coxa do bebê. Usado para estimar idade gestacional e crescimento.',
    ccn: '<strong>Comprimento Cabeça-Nádega (CCN)</strong><br>Mede o bebê inteiro no 1º trimestre (da cabeça ao bumbum). Principal medida para datar a gestação.',
    dbp: '<strong>Diâmetro Biparietal (DBP)</strong><br>Diâmetro da cabecinha do bebê, de uma orelha à outra.',
    ca: '<strong>Circunferência Abdominal (CA)</strong><br>Mede a barriguinha do bebê. Importante para estimar o peso.',
    percentil: '<strong>Percentil</strong><br>Se o bebê está no percentil 50, está na média. Entre 10 e 90 é considerado normal. Não significa nota!'
};

function renderMetricHelp(metricKey) {
    if (!metricHelp[metricKey]) return '';
    return ' <span class="metric-help-btn" data-metric="' + metricKey + '" title="O que é?">?</span>';
}

// ============ FEAT-008: SYMPTOM TRACKER ============
var symptomCategories = [
    { id: 'nausea', label: 'Náusea', icon: '\u{1F922}' },
    { id: 'lombar', label: 'Dor Lombar', icon: '\u{1F9B4}' },
    { id: 'inchaco', label: 'Inchaço', icon: '\u{1F9B6}' },
    { id: 'cabeca', label: 'Dor de Cabeça', icon: '\u{1F915}' },
    { id: 'tontura', label: 'Tontura', icon: '\u{1F4AB}' },
    { id: 'azia', label: 'Azia', icon: '\u{1F525}' },
    { id: 'insonia', label: 'Insônia', icon: '\u{1F634}' },
    { id: 'fadiga', label: 'Fadiga', icon: '\u{1F62A}' },
    { id: 'contracao', label: 'Contração', icon: '\u{26A1}' }
];

function getSymptomLog() {
    var saved = localStorage.getItem('hadassa_symptoms');
    if (saved) { try { return JSON.parse(saved); } catch(e) {} }
    return [];
}

function saveSymptomLog(log) {
    localStorage.setItem('hadassa_symptoms', JSON.stringify(log));
}

function renderSymptomTracker() {
    var container = document.getElementById('symptomTrackerContent');
    if (!container) return;

    var today = toLocalDateStr(new Date());
    var log = getSymptomLog();
    var todayEntries = log.filter(function(s) { return s.date === today; });

    var html = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">';
    symptomCategories.forEach(function(cat) {
        var todayEntry = todayEntries.find(function(s) { return s.symptom === cat.id; });
        var intensity = todayEntry ? todayEntry.intensity : 0;
        html += '<button class="symptom-btn' + (intensity > 0 ? ' active' : '') + '" data-symptom="' + cat.id + '" title="' + escapeHtml(cat.label) + '">';
        html += '<span style="font-size:1.2em;">' + cat.icon + '</span>';
        html += '<span style="font-size:0.6em;display:block;">' + escapeHtml(cat.label) + '</span>';
        if (intensity > 0) html += '<span style="font-size:0.55em;color:var(--pink-600);">' + '\u{2B50}'.repeat(intensity) + '</span>';
        html += '</button>';
    });
    html += '</div>';

    // Recent 7 days summary
    var last7 = [];
    for (var i = 6; i >= 0; i--) {
        var d = new Date();
        d.setDate(d.getDate() - i);
        var dateStr = toLocalDateStr(d);
        var dayEntries = log.filter(function(s) { return s.date === dateStr; });
        var total = dayEntries.reduce(function(sum, s) { return sum + s.intensity; }, 0);
        last7.push({ date: dateStr, count: dayEntries.length, total: total });
    }

    if (log.length > 0) {
        html += '<div style="font-size:0.7em;color:var(--text-light);margin-top:4px;">Últimos 7 dias:</div>';
        html += '<div style="display:flex;gap:4px;margin-top:4px;">';
        last7.forEach(function(day) {
            var opacity = day.total === 0 ? 0.15 : Math.min(0.3 + (day.total * 0.15), 1);
            var dayLabel = day.date.split('-')[2];
            html += '<div style="flex:1;text-align:center;"><div style="height:24px;border-radius:4px;background:var(--pink-400);opacity:' + opacity + ';"></div><div style="font-size:0.6em;color:var(--text-light);margin-top:2px;">' + dayLabel + '</div></div>';
        });
        html += '</div>';
    }

    container.innerHTML = html;

    // Event listeners
    container.querySelectorAll('.symptom-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var symptomId = btn.dataset.symptom;
            var log = getSymptomLog();
            var today = toLocalDateStr(new Date());
            var existingIdx = log.findIndex(function(s) { return s.date === today && s.symptom === symptomId; });

            if (existingIdx !== -1) {
                var current = log[existingIdx].intensity;
                if (current >= 3) {
                    log.splice(existingIdx, 1); // Remove (cycle back to 0)
                } else {
                    log[existingIdx].intensity = current + 1; // Increase intensity
                }
            } else {
                log.push({ date: today, symptom: symptomId, intensity: 1 });
            }

            saveSymptomLog(log);
            renderSymptomTracker();
        });
    });
}

// ============ FEAT-007: SHARE CARD ============
function shareCard() {
    try {
        var cfg = appData.config;
        var info = calcCurrentGestationalAge();

        // Buscar dados de todas as fontes
        var uss = getAllUSData();
        var last = uss.length > 0 ? uss[uss.length - 1] : null;

        // Permitir compartilhar mesmo sem US se tiver info gestacional
        if (!info && !last) {
            showToast('Configure a DUM ou registre um exame primeiro!');
            return;
        }

        var fruit = info ? getFruitForWeek(info.weeks) : null;

        var canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        var ctx = canvas.getContext('2d');

        // Background gradient
        var gradient = ctx.createLinearGradient(0, 0, 600, 400);
        gradient.addColorStop(0, '#fdf2f8');
        gradient.addColorStop(0.5, '#faf5ff');
        gradient.addColorStop(1, '#fff8f0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 600, 400);

        // Header bar
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(0, 0, 600, 60);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(cfg.babyName ? 'A Jornada de ' + cfg.babyName : 'Minha Gestacao', 300, 38);

        // Week info
        if (info) {
            ctx.fillStyle = '#be185d';
            ctx.font = 'bold 42px "Segoe UI", Arial, sans-serif';
            ctx.fillText(info.weeks + ' semanas', 300, 110);
            ctx.fillStyle = '#9a7090';
            ctx.font = '16px "Segoe UI", Arial, sans-serif';
            ctx.fillText(info.weeks + ' semanas e ' + info.days + ' dias de gestacao', 300, 135);
        }

        // Data do bebê
        ctx.fillStyle = '#4a2040';
        ctx.font = '16px "Segoe UI", Arial, sans-serif';
        var yPos = 170;
        if (last && last.heartbeat) { ctx.fillText('Batimentos: ' + last.heartbeat + ' bpm', 300, yPos); yPos += 28; }
        if (last && last.weight) { ctx.fillText('Peso estimado: ' + last.weight + ' g', 300, yPos); yPos += 28; }
        if (last && last.femur) { ctx.fillText('Femur: ' + last.femur + ' mm', 300, yPos); yPos += 28; }
        if (last && last.ccn) { ctx.fillText('CCN: ' + last.ccn + ' mm', 300, yPos); yPos += 28; }

        // Se não tem dados numéricos mas tem US, mostrar info básica
        if (last && !last.heartbeat && !last.weight && !last.femur && !last.ccn) {
            ctx.fillText('Ultimo exame: ' + formatDate(last.date), 300, yPos);
            yPos += 28;
        }

        // Fruit
        if (fruit) {
            yPos = Math.max(yPos, 280);
            ctx.font = '14px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#9a7090';
            ctx.fillText('Tamanho do bebe: ' + fruit.fruit + ' (' + fruit.size + ')', 300, yPos);
        }

        // Footer
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(0, 360, 600, 40);
        ctx.fillStyle = '#fff';
        ctx.font = '12px "Segoe UI", Arial, sans-serif';
        ctx.fillText(cfg.babyName ? 'A Jornada de ' + cfg.babyName : 'Minha Gestacao', 300, 385);

        canvas.toBlob(function(blob) {
            if (!blob) { showToast('Erro ao gerar imagem'); return; }
            if (navigator.share) {
                var file = new File([blob], 'jornada_' + cfg.babyName.replace(/\s/g, '_') + '.png', { type: 'image/png' });
                navigator.share({
                    title: cfg.babyName ? 'A Jornada de ' + cfg.babyName : 'Minha Gestação',
                    text: cfg.babyName + ' - ' + (info ? info.weeks + ' semanas' : '') + ' de gestacao!',
                    files: [file]
                }).catch(function() {
                    downloadBlob(blob, cfg.babyName);
                });
            } else {
                downloadBlob(blob, cfg.babyName);
            }
        }, 'image/png');
    } catch (err) {
        showToast('Erro ao compartilhar: ' + (err.message || 'tente novamente'));
    }
}

function downloadBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'jornada_' + name.replace(/\s/g, '_') + '.png';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Imagem salva!');
}

// ============ FEAT-001: ONBOARDING WIZARD ============
function showOnboarding() {
    if (localStorage.getItem('hadassa_onboarding_done')) return;
    if (getAllUSData().length > 0 || (typeof getExams === 'function' && getExams().length > 0)) { localStorage.setItem('hadassa_onboarding_done', 'true'); return; }

    var step = 1;
    renderOnboardingStep(step);
    document.getElementById('onboardingModal').classList.add('active');
}

function renderOnboardingStep(step) {
    var container = document.getElementById('onboardingContent');
    var html = '';

    if (step === 1) {
        html += '<div style="font-size:3em;margin-bottom:10px;">\u{1F476}\u{1F338}</div>';
        html += '<h2 style="color:var(--pink-600);font-family:Dancing Script,cursive;font-size:1.8em;">Bem-vinda!</h2>';
        html += '<p style="color:var(--text-medium);font-size:0.9em;margin:15px 0;">Vamos configurar o acompanhamento da sua gravidez.</p>';
        html += '<div class="form-group" style="text-align:left;"><label>Seu nome</label>';
        html += '<input type="text" id="obMomName" value="' + escapeHtml(appData.config.momName || '') + '" placeholder="Como você se chama?"></div>';
        html += '<div class="form-group" style="text-align:left;"><label>Nome do bebê</label>';
        html += '<input type="text" id="obBabyName" value="' + escapeHtml(appData.config.babyName || '') + '" placeholder="Já escolheu o nome?"></div>';
        html += '<div class="form-group" style="text-align:left;"><label>Sexo</label>';
        html += '<select id="obBabySex"><option value="Menina"' + (appData.config.babySex === 'Menina' ? ' selected' : '') + '>Menina</option>';
        html += '<option value="Menino"' + (appData.config.babySex === 'Menino' ? ' selected' : '') + '>Menino</option>';
        html += '<option value="Indefinido"' + (appData.config.babySex === 'Indefinido' ? ' selected' : '') + '>Ainda não sei</option></select></div>';
        html += '<button class="btn btn-primary btn-block" id="obNext1">Próximo \u{27A1}</button>';
    } else if (step === 2) {
        html += '<div style="font-size:3em;margin-bottom:10px;">\u{1F4C5}</div>';
        html += '<h2 style="color:var(--pink-600);font-size:1.3em;">Quando foi sua última menstruação?</h2>';
        html += '<p style="color:var(--text-light);font-size:0.8em;margin:10px 0;">Com essa data calculamos a idade gestacional e a data prevista do parto.</p>';
        html += '<div class="form-group"><input type="date" id="obDUM" value="' + (appData.config.dum || '') + '"></div>';
        html += '<div style="display:flex;gap:10px;">';
        html += '<button class="btn btn-secondary" id="obBack2" style="flex:1;">\u{2B05} Voltar</button>';
        html += '<button class="btn btn-primary" id="obNext2" style="flex:1;">Próximo \u{27A1}</button></div>';
    } else if (step === 3) {
        html += '<div style="font-size:3em;margin-bottom:10px;">\u{1F389}</div>';
        html += '<h2 style="color:var(--pink-600);font-size:1.3em;">Tudo pronto!</h2>';
        html += '<p style="color:var(--text-medium);font-size:0.85em;margin:10px 0;">Seu app está configurado. Você pode registrar ultrassons, consultas e acompanhar o crescimento do seu bebê.</p>';
        html += '<p style="color:var(--text-light);font-size:0.7em;margin:15px 0;padding:10px;background:var(--pink-50);border-radius:10px;"><strong>Aviso:</strong> Este app é apenas para acompanhamento pessoal e não substitui consultas médicas. Sempre consulte seu obstetra.</p>';
        html += '<button class="btn btn-primary btn-block" id="obFinish">\u{1F49C} Começar a Jornada!</button>';
    }

    container.innerHTML = html;

    // Event listeners
    if (step === 1) {
        document.getElementById('obNext1').addEventListener('click', function() {
            appData.config.momName = document.getElementById('obMomName').value || 'Mamãe';
            appData.config.babyName = document.getElementById('obBabyName').value || 'Bebê';
            appData.config.babySex = document.getElementById('obBabySex').value;
            saveData(appData);
            renderOnboardingStep(2);
        });
    } else if (step === 2) {
        document.getElementById('obBack2').addEventListener('click', function() { renderOnboardingStep(1); });
        document.getElementById('obNext2').addEventListener('click', function() {
            var dum = document.getElementById('obDUM').value;
            if (dum) {
                appData.config.dum = dum;
                var dumDate = parseLocalDate(dum);
                var dpp = new Date(dumDate.getTime() + PREGNANCY_DAYS * MS_PER_DAY);
                appData.config.dpp = toLocalDateStr(dpp);
                saveData(appData);
            }
            renderOnboardingStep(3);
        });
    } else if (step === 3) {
        document.getElementById('obFinish').addEventListener('click', function() {
            localStorage.setItem('hadassa_onboarding_done', 'true');
            document.getElementById('onboardingModal').classList.remove('active');
            loadConfig();
            applyThemeBySex();
            renderAll();
        });
    }
}

// ============ UX-014: SWIPE NAVIGATION ============
function initSwipeNavigation() {
    var touchStartX = 0;
    var touchEndX = 0;
    var sections = ['dashboard', 'weekly', 'diary', 'symptoms', 'exams', 'appointments', 'lists', 'birthplan', 'health', 'ultrasounds', 'charts', 'params', 'reports', 'notes', 'config'];

    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        var diff = touchStartX - touchEndX;
        if (Math.abs(diff) < 80) return; // too short

        // Don't swipe inside AI panel or modals
        if (e.target.closest('.ai-panel') || e.target.closest('.modal')) return;

        var currentHash = location.hash.replace('#', '') || 'dashboard';
        var currentIdx = sections.indexOf(currentHash);
        if (currentIdx === -1) return;

        if (diff > 0 && currentIdx < sections.length - 1) {
            // Swipe left -> next section
            location.hash = sections[currentIdx + 1];
        } else if (diff < 0 && currentIdx > 0) {
            // Swipe right -> previous section
            location.hash = sections[currentIdx - 1];
        }
    }, { passive: true });
}

// ============ UX-015: PRINT SUMMARY ============
function printSummary() {
    var cfg = appData.config;
    var uss = getAllUSData();
    var info = calcCurrentGestationalAge();
    var last = uss.length > 0 ? uss[uss.length - 1] : null;
    var fruit = info ? getFruitForWeek(info.weeks) : null;

    var printWindow = window.open('', '_blank');
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Resumo Gestacional</title>';
    html += '<style>body{font-family:Segoe UI,sans-serif;padding:30px;max-width:600px;margin:0 auto;color:#333;}';
    html += 'h1{color:#ec4899;text-align:center;border-bottom:2px solid #ec4899;padding-bottom:10px;}';
    html += '.info{margin:15px 0;}.label{font-weight:bold;color:#666;}.value{color:#333;}';
    html += 'table{width:100%;border-collapse:collapse;margin:15px 0;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}';
    html += 'th{background:#fdf2f8;color:#be185d;}.footer{text-align:center;color:#999;font-size:0.8em;margin-top:30px;}</style></head><body>';
    html += '<h1>\u{1F476} ' + (cfg.babyName ? 'A Jornada de ' + escapeHtml(cfg.babyName) : 'Minha Gestação') + '</h1>';
    html += '<div class="info"><span class="label">Mãe:</span> <span class="value">' + escapeHtml(cfg.momName) + '</span></div>';
    html += '<div class="info"><span class="label">Bebê:</span> <span class="value">' + escapeHtml(cfg.babyName) + ' (' + escapeHtml(cfg.babySex) + ')</span></div>';
    if (cfg.doctor) html += '<div class="info"><span class="label">Médico(a):</span> <span class="value">' + escapeHtml(cfg.doctor) + '</span></div>';
    if (info) {
        html += '<div class="info"><span class="label">Idade Gestacional:</span> <span class="value">' + info.weeks + ' semanas e ' + info.days + ' dias</span></div>';
        html += '<div class="info"><span class="label">DUM:</span> <span class="value">' + formatDate(cfg.dum) + '</span></div>';
        if (cfg.dpp) html += '<div class="info"><span class="label">DPP:</span> <span class="value">' + formatDate(cfg.dpp) + '</span></div>';
        var daysLeft = PREGNANCY_DAYS - info.totalDays;
        if (daysLeft > 0) html += '<div class="info"><span class="label">Faltam:</span> <span class="value">' + daysLeft + ' dias</span></div>';
    }
    if (fruit) html += '<div class="info"><span class="label">Tamanho do bebê:</span> <span class="value">' + fruit.emoji + ' ' + escapeHtml(fruit.fruit) + ' (' + fruit.size + ')</span></div>';

    if (last) {
        html += '<h2 style="color:#be185d;">Último Ultrassom (' + formatDate(last.date) + ')</h2>';
        html += '<table><tr><th>Medida</th><th>Valor</th></tr>';
        if (last.heartbeat) html += '<tr><td>Batimentos</td><td>' + last.heartbeat + ' bpm</td></tr>';
        if (last.weight) html += '<tr><td>Peso</td><td>' + last.weight + ' g</td></tr>';
        if (last.femur) html += '<tr><td>Fêmur</td><td>' + last.femur + ' mm</td></tr>';
        if (last.ccn) html += '<tr><td>CCN</td><td>' + last.ccn + ' mm</td></tr>';
        if (last.cervix) html += '<tr><td>Colo Uterino</td><td>' + last.cervix + ' mm</td></tr>';
        html += '</table>';
    }

    // Upcoming appointments
    var today = toLocalDateStr(new Date());
    var upcoming = appData.appointments.filter(function(a) { return a.date >= today; }).sort(function(a, b) { return a.date.localeCompare(b.date); }).slice(0, 5);
    if (upcoming.length > 0) {
        html += '<h2 style="color:#be185d;">Próximas Consultas</h2><table><tr><th>Data</th><th>Tipo</th><th>Médico</th></tr>';
        upcoming.forEach(function(a) {
            html += '<tr><td>' + formatDate(a.date) + '</td><td>' + escapeHtml(a.type) + '</td><td>' + escapeHtml(a.doctor || '--') + '</td></tr>';
        });
        html += '</table>';
    }

    // Medications
    var meds = appData.notes.filter(function(n) { return n.type === 'medicacao'; });
    if (meds.length > 0) {
        html += '<h2 style="color:#be185d;">Medicações Ativas</h2><ul>';
        meds.forEach(function(m) { html += '<li><strong>' + escapeHtml(m.title) + '</strong>: ' + escapeHtml(m.content) + '</li>'; });
        html += '</ul>';
    }

    html += '<div class="footer">Gerado em ' + formatDate(toLocalDateStr(new Date())) + ' | ' + (cfg.babyName ? 'A Jornada de ' + escapeHtml(cfg.babyName) : 'Minha Gestação') + '</div>';
    html += '</body></html>';

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
}

// ============ FEAT-009: APPOINTMENT NOTIFICATIONS ============
function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function scheduleAppointmentReminders() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    var now = new Date();
    var today = toLocalDateStr(now);

    appData.appointments.forEach(function(a) {
        if (a.date < today) return;
        if (!a.time) return;

        var appointDate = new Date(a.date + 'T' + a.time + ':00');
        var twoHoursBefore = appointDate.getTime() - (2 * 60 * 60 * 1000);
        var oneDayBefore = appointDate.getTime() - (24 * 60 * 60 * 1000);

        // 2 hours before
        if (twoHoursBefore > now.getTime()) {
            var delay2h = twoHoursBefore - now.getTime();
            if (delay2h < 24 * 60 * 60 * 1000) { // only if within 24h
                setTimeout(function() {
                    new Notification('Consulta em 2 horas!', {
                        body: a.type + (a.doctor ? ' - Dr(a). ' + a.doctor : '') + '\n' + (a.location || ''),
                        icon: '\u{1F4C5}'
                    });
                }, delay2h);
            }
        }

        // 1 day before
        if (oneDayBefore > now.getTime()) {
            var delay1d = oneDayBefore - now.getTime();
            if (delay1d < 48 * 60 * 60 * 1000) { // only if within 48h
                setTimeout(function() {
                    new Notification('Consulta amanhã!', {
                        body: a.type + ' às ' + a.time + (a.doctor ? ' - Dr(a). ' + a.doctor : ''),
                        icon: '\u{1F4C5}'
                    });
                }, delay1d);
            }
        }
    });
}

// ============ FEAT-010: PHOTO GALLERY ============
function openGallery() {
    var container = document.getElementById('galleryContent');
    var photosUS = getAllUSData().filter(function(u) { return u.photo; });

    if (photosUS.length === 0) {
        container.innerHTML = '<div class="empty-state" style="width:100%;"><i class="fas fa-images"></i><p>Nenhuma foto registrada</p></div>';
        openModal('galleryModal');
        return;
    }

    container.innerHTML = '<div style="text-align:center;width:100%;"><small>Carregando fotos...</small></div>';
    openModal('galleryModal');

    var promises = photosUS.map(function(us) {
        return loadPhoto(us.photo).then(function(data) {
            return { us: us, data: data };
        }).catch(function() { return null; });
    });

    Promise.all(promises).then(function(results) {
        var html = '';
        results.forEach(function(r) {
            if (!r || !r.data) return;
            html += '<div class="gallery-thumb" data-photo-data="' + r.us.id + '" style="width:calc(50% - 4px);cursor:pointer;">';
            html += '<div style="position:relative;overflow:hidden;border-radius:12px;aspect-ratio:1;background:var(--pink-50);">';
            html += '</div>';
            html += '<div style="font-size:0.7em;color:var(--text-light);text-align:center;margin-top:4px;">' + formatDate(r.us.date) + ' | ' + (r.us.weeks || '--') + 's</div>';
            html += '</div>';
        });
        container.innerHTML = html || '<p>Nenhuma foto encontrada</p>';

        // Render images
        results.forEach(function(r) {
            if (!r || !r.data) return;
            var thumb = container.querySelector('[data-photo-data="' + r.us.id + '"] div');
            if (thumb) {
                var img = document.createElement('img');
                img.src = r.data;
                img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
                thumb.appendChild(img);
                thumb.parentElement.addEventListener('click', function() {
                    showFullPhoto(r.data);
                });
            }
        });
    });
}

function showFullPhoto(dataUrl) {
    var viewer = document.getElementById('photoViewer');
    var img = document.getElementById('photoViewerImg');
    img.src = dataUrl;
    viewer.style.display = 'flex';
}

// ============ FEAT-011: RADAR CHART ============
function renderRadarChart() {
    if (mainChart) mainChart.destroy();
    var ctx = document.getElementById('mainChart').getContext('2d');
    var uss = getAllUSData();
    var last = uss.length > 0 ? uss[uss.length - 1] : null;

    if (!last || !last.weeks) {
        mainChart = new Chart(ctx, {
            type: 'radar',
            data: { labels: ['Sem dados'], datasets: [{ data: [0] }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
        return;
    }

    var metrics = [];
    var values = [];
    var refValues = [];
    var labels = [];

    // Normalize each metric to 0-100% of its reference range
    if (last.heartbeat && heartRef[last.weeks]) {
        var ref = heartRef[last.weeks];
        var pct = ((last.heartbeat - ref[0]) / (ref[2] - ref[0])) * 100;
        labels.push('Batimentos');
        values.push(Math.max(0, Math.min(pct, 150)));
        refValues.push(50);
    }
    if (last.weight && weightRef[last.weeks]) {
        var ref = weightRef[last.weeks];
        var pct = ((last.weight - ref[0]) / (ref[2] - ref[0])) * 100;
        labels.push('Peso');
        values.push(Math.max(0, Math.min(pct, 150)));
        refValues.push(50);
    }
    if (last.femur && femurRef[last.weeks]) {
        var ref = femurRef[last.weeks];
        var pct = ((last.femur - ref[0]) / (ref[2] - ref[0])) * 100;
        labels.push('Fêmur');
        values.push(Math.max(0, Math.min(pct, 150)));
        refValues.push(50);
    }
    if (last.dbp) { labels.push('DBP'); values.push(50); refValues.push(50); }
    if (last.ca) { labels.push('CA'); values.push(50); refValues.push(50); }

    if (labels.length < 3) {
        labels = ['Batimentos', 'Peso', 'Fêmur'];
        values = [0, 0, 0];
        refValues = [50, 50, 50];
    }

    mainChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: escapeHtml(last.weeks + 's' + (last.days || 0) + 'd — ' + formatDate(last.date)),
                    data: values,
                    borderColor: '#ec4899',
                    backgroundColor: 'rgba(236,72,153,0.2)',
                    borderWidth: 2,
                    pointRadius: 4
                },
                {
                    label: 'Referência (percentil 50)',
                    data: refValues,
                    borderColor: 'rgba(156,163,175,0.5)',
                    backgroundColor: 'rgba(156,163,175,0.1)',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { r: { min: 0, max: 100, ticks: { display: false }, pointLabels: { font: { family: 'Nunito', size: 12 } } } },
            plugins: { legend: { position: 'bottom', labels: { font: { family: 'Nunito' } } } }
        }
    });
}

// ============ FEAT-012: EXPORT CSV + CLINICAL PDF ============
function exportCSV() {
    var csv = 'Data,Semanas,Dias,Titulo,Batimentos,Peso,Femur,CCN,DBP,CA,Colo,Placenta,ILA,Observacoes\n';
    getAllUSData().forEach(function(us) {
        csv += [us.date, us.weeks||'', us.days||'', '"'+(us.title||'')+'"', us.heartbeat||'', us.weight||'', us.femur||'', us.ccn||'', us.dbp||'', us.ca||'', us.cervix||'', us.placenta||'', us.ila||'', '"'+(us.obs||'')+'"'].join(',') + '\n';
    });

    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'dados_gestacao_' + appData.config.babyName.replace(/\s/g, '_') + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exportado!');
}

// ============ FEAT-014: MEDICATION TRACKING ============
function renderMedicationList() {
    var meds = appData.notes.filter(function(n) { return n.type === 'medicacao'; });
    var container = document.getElementById('notesList');

    if (meds.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-pills"></i><p>Nenhuma medicação registrada</p><p style="font-size:0.75em;color:var(--text-light);">Use "Nova Anotação" com tipo "Medicações" para registrar.</p></div>';
        return;
    }

    var html = '';
    meds.slice().reverse().forEach(function(m) {
        html += '<div class="note-card">';
        html += '<h4>\u{1F48A} ' + escapeHtml(m.title) + '</h4>';
        html += '<p>' + escapeHtml(m.content) + '</p>';
        html += '<div class="note-meta">' + formatDate(m.date) + ' | medicação</div>';
        html += '<div class="actions-row">';
        html += '<button class="btn btn-secondary btn-small" data-edit-note="' + escapeHtml(m.id) + '"><i class="fas fa-edit"></i> Editar</button>';
        html += '<button class="btn btn-danger btn-small" data-delete-note="' + escapeHtml(m.id) + '"><i class="fas fa-trash"></i></button>';
        html += '</div></div>';
    });
    container.innerHTML = html;

    container.querySelectorAll('[data-edit-note]').forEach(function(btn) {
        btn.addEventListener('click', function() { editNote(btn.dataset.editNote); });
    });
    container.querySelectorAll('[data-delete-note]').forEach(function(btn) {
        btn.addEventListener('click', function() { deleteNote(btn.dataset.deleteNote); });
    });
}

// ============ UX-012: CUSTOM CONFIRM/ALERT ============
var _confirmResolve = null;

function showCustomConfirm(title, message, icon) {
    return new Promise(function(resolve) {
        _confirmResolve = resolve;
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmIcon').textContent = icon || '\u{26A0}\u{FE0F}';
        document.getElementById('customConfirmModal').classList.add('active');
    });
}

function showCustomAlert(title, message, icon) {
    return new Promise(function(resolve) {
        document.getElementById('alertTitle').textContent = title;
        document.getElementById('alertMessage').textContent = message;
        document.getElementById('alertIcon').textContent = icon || '\u{2139}\u{FE0F}';
        document.getElementById('customAlertModal').classList.add('active');
        document.getElementById('alertOkBtn').onclick = function() {
            document.getElementById('customAlertModal').classList.remove('active');
            resolve();
        };
    });
}

// ============ FEAT-004: KICK COUNTER ============
var kickSession = { active: false, startTime: null, kicks: 0 };

function getKickHistory() {
    var saved = localStorage.getItem('hadassa_kick_history');
    if (saved) { try { return JSON.parse(saved); } catch(e) {} }
    return [];
}

function saveKickHistory(history) {
    localStorage.setItem('hadassa_kick_history', JSON.stringify(history));
}

function renderKickCounter() {
    var card = document.getElementById('kickCounterCard');
    var container = document.getElementById('kickCounterContent');
    var cfg = appData.config;

    var info = calcCurrentGestationalAge();
    if (!info) { card.style.display = 'none'; return; }
    if (info.weeks < 28) { card.style.display = 'none'; return; }

    card.style.display = 'block';
    var history = getKickHistory();
    var today = toLocalDateStr(new Date());
    var todayEntry = history.find(function(h) { return h.date === today; });

    var html = '<div style="text-align:center;padding:8px 0;">';
    html += '<div style="font-size:0.75em;color:var(--text-light);margin-bottom:8px;">Método Cardiff: conte até 10 movimentos</div>';

    if (kickSession.active) {
        var elapsed = Math.floor((Date.now() - kickSession.startTime) / 60000);
        html += '<div style="font-size:3em;font-weight:800;color:var(--pink-500);">' + kickSession.kicks + '</div>';
        html += '<div style="font-size:0.8em;color:var(--text-medium);margin-bottom:10px;">' + elapsed + ' min</div>';
        html += '<button class="btn btn-primary" id="kickBtn" style="width:120px;height:120px;border-radius:50%;font-size:1.5em;margin:10px auto;display:block;box-shadow:0 4px 20px rgba(236,72,153,0.4);">';
        html += '\u{1F476}<br><span style="font-size:0.5em;">Sentiu!</span></button>';
        html += '<button class="btn btn-secondary btn-small" id="kickStopBtn" style="margin-top:8px;">Encerrar sessão</button>';
    } else {
        html += '<button class="btn btn-primary" id="kickStartBtn" style="width:100px;height:100px;border-radius:50%;font-size:1em;margin:10px auto;display:block;">';
        html += '\u{1F476}<br><span style="font-size:0.8em;">Iniciar</span></button>';
    }

    // Today's summary
    if (todayEntry) {
        html += '<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--pink-100);font-size:0.8em;color:var(--text-medium);">';
        html += 'Hoje: <strong>' + todayEntry.kicks + ' movimentos</strong> em ' + todayEntry.minutes + ' min';
        html += '</div>';
    }

    // Last 5 days
    var recent = history.slice(-5).reverse();
    if (recent.length > 0) {
        html += '<div style="margin-top:8px;font-size:0.72em;color:var(--text-light);">';
        recent.forEach(function(h) {
            var status = h.kicks >= 10 ? '\u{2705}' : '\u{26A0}\u{FE0F}';
            html += '<div>' + formatDate(h.date) + ': ' + h.kicks + ' mov em ' + h.minutes + 'min ' + status + '</div>';
        });
        html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;

    // Event listeners
    var startBtn = document.getElementById('kickStartBtn');
    var kickBtn = document.getElementById('kickBtn');
    var stopBtn = document.getElementById('kickStopBtn');

    if (startBtn) {
        startBtn.addEventListener('click', function() {
            kickSession.active = true;
            kickSession.startTime = Date.now();
            kickSession.kicks = 0;
            renderKickCounter();
        });
    }
    if (kickBtn) {
        kickBtn.addEventListener('click', function() {
            kickSession.kicks++;
            if (kickSession.kicks >= 10) {
                var minutes = Math.floor((Date.now() - kickSession.startTime) / 60000);
                var history = getKickHistory();
                var today = toLocalDateStr(new Date());
                var existing = history.findIndex(function(h) { return h.date === today; });
                var entry = { date: today, kicks: kickSession.kicks, minutes: minutes };
                if (existing !== -1) history[existing] = entry; else history.push(entry);
                saveKickHistory(history);
                kickSession.active = false;
                showCustomAlert(
                    '10 movimentos!',
                    'Ótimo! ' + kickSession.kicks + ' movimentos em ' + minutes + ' minutos. Seu bebê está ativo!',
                    '\u{1F389}'
                );
                renderKickCounter();
            } else {
                renderKickCounter();
            }
        });
    }
    if (stopBtn) {
        stopBtn.addEventListener('click', function() {
            var minutes = Math.floor((Date.now() - kickSession.startTime) / 60000);
            if (kickSession.kicks > 0) {
                var history = getKickHistory();
                var today = toLocalDateStr(new Date());
                var existing = history.findIndex(function(h) { return h.date === today; });
                var entry = { date: today, kicks: kickSession.kicks, minutes: minutes || 1 };
                if (existing !== -1) history[existing] = entry; else history.push(entry);
                saveKickHistory(history);
            }
            kickSession.active = false;
            renderKickCounter();
        });
    }
}

// ============ FEAT-005: MATERNAL WEIGHT TRACKING ============
function getAllMomWeights() {
    var allWeights = [];
    // From appointments
    if (appData.appointments) {
        appData.appointments.forEach(function(a) {
            if (a.momWeight) {
                allWeights.push({ date: a.date, weight: parseFloat(a.momWeight) });
            }
        });
    }
    // From weight tracker
    try {
        var trackerWeights = JSON.parse(localStorage.getItem('hadassa_mom_weights') || '[]');
        trackerWeights.forEach(function(w) {
            var exists = allWeights.some(function(e) { return e.date === w.date; });
            if (!exists) allWeights.push({ date: w.date, weight: parseFloat(w.weight) });
        });
    } catch(e) {}
    allWeights.sort(function(a, b) { return a.date.localeCompare(b.date); });
    return allWeights;
}

function renderMomWeightChart() {
    var allWeights = getAllMomWeights();
    if (allWeights.length === 0) return '';
    var appointments = allWeights; // compatibility

    var cfg = appData.config;
    var preWeight = parseFloat(cfg.preWeight) || null;
    var height = parseFloat(cfg.height) || null;
    var bmi = (preWeight && height) ? (preWeight / ((height/100) * (height/100))).toFixed(1) : null;

    var html = '<div class="card">';
    html += '<div class="card-title"><i class="fas fa-weight"></i> Peso Materno</div>';

    if (bmi) {
        var gainRecommendation = '';
        if (bmi < 18.5) gainRecommendation = '12,5 - 18 kg';
        else if (bmi < 25) gainRecommendation = '11,5 - 16 kg';
        else if (bmi < 30) gainRecommendation = '7 - 11,5 kg';
        else gainRecommendation = '5 - 9 kg';

        html += '<div style="font-size:0.8em;color:var(--text-medium);margin-bottom:10px;">';
        html += 'IMC pré-gestacional: <strong>' + bmi + '</strong> | ';
        html += 'Ganho recomendado: <strong>' + gainRecommendation + '</strong>';
        html += '</div>';
    }

    // Weight evolution table
    html += '<div style="overflow-x:auto;"><table class="params-table" style="font-size:0.8em;"><thead><tr>';
    html += '<th>Data</th><th>Peso (kg)</th>';
    if (preWeight) html += '<th>Ganho (kg)</th>';
    html += '</tr></thead><tbody>';

    appointments.sort(function(a, b) { return a.date.localeCompare(b.date); });
    appointments.forEach(function(a) {
        var weight = parseFloat(a.weight || a.momWeight);
        html += '<tr><td>' + formatDate(a.date) + '</td><td>' + weight.toFixed(1) + '</td>';
        if (preWeight) {
            var gain = (weight - preWeight).toFixed(1);
            var sign = gain >= 0 ? '+' : '';
            html += '<td>' + sign + gain + '</td>';
        }
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    html += '</div>';
    return html;
}

// ============ MODALS ============
function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function hasFormData(modalId) {
    var form = document.querySelector('#' + modalId + ' form');
    if (!form) return false;
    var inputs = form.querySelectorAll('input:not([type="hidden"]), textarea, select');
    for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        if (input.type === 'date' && input.value) return true;
        if (input.type === 'text' && input.value.trim()) return true;
        if (input.type === 'number' && input.value) return true;
        if (input.tagName === 'TEXTAREA' && input.value.trim()) return true;
    }
    return false;
}

function closeModal(id, force) {
    if (!force && hasFormData(id)) {
        if (!confirm('Existem dados preenchidos. Deseja descartar?')) return;
    }
    document.getElementById(id).classList.remove('active');
    var form = document.querySelector('#' + id + ' form');
    if (form) form.reset();
    var editField = document.querySelector('#' + id + ' input[type="hidden"]');
    if (editField) editField.value = '';
}

// ============ UNIFIED US DATA (ultrasounds + exams) ============
/**
 * Retorna todos os dados de ultrassom combinados: appData.ultrasounds + exames tipo US.
 * Dados dos exames (hadassa_exams) com specificData são convertidos para o mesmo formato.
 * Elimina duplicatas por data+semana. Ordenado por data.
 */
function getAllUSData() {
    var combined = [];

    // 1) Dados dos ultrasounds tradicionais
    (appData.ultrasounds || []).forEach(function(us) {
        combined.push({
            id: us.id,
            date: us.date,
            title: us.title || '',
            weeks: us.weeks,
            days: us.days || 0,
            heartbeat: us.heartbeat || null,
            weight: us.weight || null,
            femur: us.femur || null,
            ccn: us.ccn || null,
            dbp: us.dbp || null,
            ca: us.ca || null,
            cervix: us.cervix || null,
            placenta: us.placenta || '',
            ila: us.ila || '',
            obs: us.obs || '',
            photo: us.photo || null,
            source: 'ultrasound'
        });
    });

    // 2) Dados dos exames tipo US com specificData
    var exams = [];
    try { exams = typeof getExams === 'function' ? getExams() : JSON.parse(localStorage.getItem('hadassa_exams') || '[]'); } catch(e) {}

    // Helper para parseFloat seguro (nunca retorna NaN)
    function safePF(val) {
        if (val === null || val === undefined || val === '') return null;
        var n = parseFloat(val);
        return isNaN(n) ? null : n;
    }
    function safePI(val) {
        if (val === null || val === undefined || val === '') return null;
        var n = parseInt(val, 10);
        return isNaN(n) ? null : n;
    }

    // Helper: verificar se exame tem dados de US (nos campos específicos ou no tipo)
    function isUSExam(ex) {
        if (ex.type === 'us') return true;
        // Verificar se tem dados de US nos campos específicos mesmo com tipo diferente
        var d = ex.specificData || {};
        if (d.exUsHeart || d.exUsWeight || d.exUsFemur || d.exUsCcn || d.exUsWeeks) return true;
        // Verificar título/resultados por keywords de ultrassom
        var text = ((ex.title || '') + ' ' + (ex.results || '')).toLowerCase();
        if (/ultrassom|ultrassonografia|morfol[oó]gic|transvaginal|obstetric|us\s|ecografia/i.test(text)) return true;
        return false;
    }

    exams.filter(isUSExam).forEach(function(ex) {
        var d = ex.specificData || {};
        // Verificar se já existe um ultrasound com mesma data (evitar duplicata)
        var isDuplicate = combined.some(function(c) { return c.date === ex.date; });
        if (isDuplicate) {
            // Merge: preencher campos vazios do existente com dados do exame
            var existing = combined.find(function(c) { return c.date === ex.date; });
            if (existing) {
                if (!existing.heartbeat && d.exUsHeart) existing.heartbeat = safePF(d.exUsHeart);
                if (!existing.weight && d.exUsWeight) existing.weight = safePF(d.exUsWeight);
                if (!existing.femur && d.exUsFemur) existing.femur = safePF(d.exUsFemur);
                if (!existing.ccn && d.exUsCcn) existing.ccn = safePF(d.exUsCcn);
                if (!existing.weeks && d.exUsWeeks) existing.weeks = safePI(d.exUsWeeks);
                if (!existing.title && ex.title) existing.title = ex.title;
                if (!existing.obs && ex.results) existing.obs = ex.results;
            }
            return;
        }

        var heartbeat = safePF(d.exUsHeart);
        var weight = safePF(d.exUsWeight);
        var femur = safePF(d.exUsFemur);
        var ccn = safePF(d.exUsCcn);
        var weeks = safePI(d.exUsWeeks);
        var days = safePI(d.exUsDays) || 0;

        // Fallback: extrair dos resultados texto
        if (!heartbeat && ex.results) {
            var hbMatch = ex.results.match(/(?:batimento|bcf|fc\s*fetal)[:\s]*(\d{2,3})\s*(?:bpm)?/i);
            if (hbMatch) { var hbVal = parseInt(hbMatch[1], 10); if (hbVal >= 60 && hbVal <= 220) heartbeat = hbVal; }
        }
        if (!weight && ex.results) {
            var wMatch = ex.results.match(/peso\s*(?:fetal|estimado)?[:\s]*(\d+)/i);
            if (wMatch) weight = safePF(wMatch[1]);
        }
        if (!femur && ex.results) {
            var fMatch = ex.results.match(/f[eê]mur[:\s]*([\d.]+)/i);
            if (fMatch) femur = safePF(fMatch[1]);
        }

        // Calcular semanas a partir da DUM se não informado
        if (!weeks && appData.config.dum && ex.date) {
            var calcInfo = calcWeeksFromDUM(appData.config.dum, ex.date);
            if (calcInfo) { weeks = calcInfo.weeks; days = calcInfo.days; }
        }

        // Adicionar se tiver data válida (mesmo sem medidas numéricas)
        if (ex.date) {
            combined.push({
                id: ex.id,
                date: ex.date,
                title: ex.title || 'Ultrassom',
                weeks: weeks,
                days: days,
                heartbeat: heartbeat,
                weight: weight,
                femur: femur,
                ccn: ccn,
                dbp: safePF(d.exUsDbp),
                ca: safePF(d.exUsCa),
                cervix: safePF(d.exUsCervix),
                placenta: d.exUsPlacenta || '',
                ila: d.exUsIla || '',
                obs: ex.results || '',
                photo: ex.fileId || null,
                source: 'exam'
            });
        }
    });

    // Ordenar por data
    combined.sort(function(a, b) { return a.date.localeCompare(b.date); });
    return combined;
}

// ============ ULTRASOUNDS ============
function saveUltrasound(e) {
    e.preventDefault();
    var editId = document.getElementById('usEditId').value;
    var photoPreview = document.getElementById('usPhotoPreview');
    var photoId = photoPreview.dataset.photoId || null;

    var us = {
        id: editId || genId(),
        date: document.getElementById('usDate').value,
        title: document.getElementById('usTitle').value,
        weeks: parseInt(document.getElementById('usWeeks').value) || null,
        days: parseInt(document.getElementById('usDays').value) || 0,
        heartbeat: parseFloat(document.getElementById('usHeartbeat').value) || null,
        weight: parseFloat(document.getElementById('usWeight').value) || null,
        femur: parseFloat(document.getElementById('usFemur').value) || null,
        ccn: parseFloat(document.getElementById('usCCN').value) || null,
        dbp: parseFloat(document.getElementById('usDBP').value) || null,
        ca: parseFloat(document.getElementById('usCA').value) || null,
        cervix: parseFloat(document.getElementById('usCervix').value) || null,
        placenta: document.getElementById('usPlacenta').value,
        ila: document.getElementById('usILA').value,
        obs: document.getElementById('usObs').value,
        photo: photoId // AUDIT V1.2: agora armazena ID para IndexedDB, nao base64
    };

    var today = toLocalDateStr(new Date());
    if (us.date > today) {
        if (!confirm('A data do ultrassom é no futuro. Deseja continuar mesmo assim?')) return;
    }
    if (appData.config.dum && us.date < appData.config.dum) {
        if (!confirm('A data do ultrassom é anterior à DUM. Deseja continuar mesmo assim?')) return;
    }

    if (!us.weeks && appData.config.dum) {
        var info = calcWeeksFromDUM(appData.config.dum, us.date);
        us.weeks = info.weeks;
        us.days = info.days;
    }

    if (editId) {
        var idx = appData.ultrasounds.findIndex(function(u) { return u.id === editId; });
        if (idx !== -1) appData.ultrasounds[idx] = us;
    } else {
        appData.ultrasounds.push(us);
    }

    appData.ultrasounds.sort(function(a, b) { return a.date.localeCompare(b.date); });
    saveData(appData);
    closeModal('usModal', true);
    showToast('Ultrassom salvo com sucesso!');
    renderAfterChange('ultrasound');
}

function editUltrasound(id) {
    var us = appData.ultrasounds.find(function(u) { return u.id === id; });
    // Também buscar nos dados unificados (exames tipo US)
    if (!us) {
        var allUS = getAllUSData();
        us = allUS.find(function(u) { return u.id === id; });
    }
    if (!us) return;
    document.getElementById('usEditId').value = us.id;
    document.getElementById('usDate').value = us.date;
    document.getElementById('usTitle').value = us.title;
    document.getElementById('usWeeks').value = us.weeks || '';
    document.getElementById('usDays').value = us.days || '';
    document.getElementById('usHeartbeat').value = us.heartbeat || '';
    document.getElementById('usWeight').value = us.weight || '';
    document.getElementById('usFemur').value = us.femur || '';
    document.getElementById('usCCN').value = us.ccn || '';
    document.getElementById('usDBP').value = us.dbp || '';
    document.getElementById('usCA').value = us.ca || '';
    document.getElementById('usCervix').value = us.cervix || '';
    document.getElementById('usPlacenta').value = us.placenta || '';
    document.getElementById('usILA').value = us.ila || '';
    document.getElementById('usObs').value = us.obs || '';
    // Expandir seção de medidas se existem dados
    var hasMedidas = us.heartbeat || us.weight || us.femur || us.ccn || us.dbp || us.ca || us.cervix || us.weeks;
    var medidasSection = document.getElementById('usMedidasSection');
    var medidasIcon = document.getElementById('usMedidasIcon');
    if (hasMedidas) {
        medidasSection.style.display = 'block';
        medidasIcon.className = 'fas fa-chevron-up';
    } else {
        medidasSection.style.display = 'none';
        medidasIcon.className = 'fas fa-chevron-down';
    }
    var preview = document.getElementById('usPhotoPreview');
    if (us.photo) {
        preview.dataset.photoId = us.photo;
        // Carregar foto do IndexedDB
        loadPhoto(us.photo).then(function(data) {
            if (data) renderPhoto(preview, data);
        }).catch(function() {
            preview.innerHTML = '<small>Foto nao encontrada</small>';
        });
    } else {
        preview.innerHTML = '';
        preview.dataset.photoId = '';
    }
    openModal('usModal');
}

function deleteUltrasound(id) {
    showCustomConfirm('Excluir Ultrassom', 'Deseja realmente excluir este registro?', '\u{1F5D1}').then(function(confirmed) {
        if (!confirmed) return;
        // Tentar excluir de appData.ultrasounds
        var us = appData.ultrasounds.find(function(u) { return u.id === id; });
        if (us) {
            if (us.photo) deletePhoto(us.photo).catch(function() {});
            appData.ultrasounds = appData.ultrasounds.filter(function(u) { return u.id !== id; });
            saveData(appData);
        } else {
            // Pode ser um exame tipo US — excluir dos exames
            try {
                var exams = typeof getExams === 'function' ? getExams() : JSON.parse(localStorage.getItem('hadassa_exams') || '[]');
                var filtered = exams.filter(function(ex) { return ex.id !== id; });
                if (filtered.length < exams.length) {
                    if (typeof saveExams === 'function') saveExams(filtered);
                    else localStorage.setItem('hadassa_exams', JSON.stringify(filtered));
                }
            } catch(e) {}
        }
        renderAfterChange('ultrasound');
        showToast('Ultrassom excluído!');
    });
}

/**
 * Gera HTML de um item de timeline de ultrassom.
 * @param {Object} us - Objeto do ultrassom
 * @param {boolean} showActions - Se true, mostra botoes de editar/excluir
 * @returns {string} HTML do item de timeline
 */
function renderTimelineItem(us, showActions) {
    var weekStr = us.weeks ? us.weeks + 's' + (us.days ? us.days + 'd' : '') : '';
    var html = '<div class="timeline-item" data-usid="' + escapeHtml(us.id) + '">' +
        '<div class="timeline-date">' + formatDate(us.date) + (weekStr ? ' | ' + weekStr : '') + '</div>' +
        '<div class="timeline-title">' + escapeHtml(us.title) + '</div>' +
        '<div class="timeline-details">';
    if (us.heartbeat) html += '<div class="timeline-detail-item"><i class="fas fa-heartbeat"></i> ' + escapeHtml(us.heartbeat) + ' bpm</div>';
    if (us.weight) html += '<div class="timeline-detail-item"><i class="fas fa-weight"></i> ' + escapeHtml(us.weight) + ' g</div>';
    if (showActions && us.femur) html += '<div class="timeline-detail-item"><i class="fas fa-bone"></i> Fêmur: ' + escapeHtml(us.femur) + ' mm</div>';
    if (showActions && us.ccn) html += '<div class="timeline-detail-item"><i class="fas fa-ruler"></i> CCN: ' + escapeHtml(us.ccn) + ' mm</div>';
    html += '</div>';
    if (showActions) {
        html += '<div class="actions-row">' +
            '<button class="btn btn-secondary btn-small" data-edit-us="' + escapeHtml(us.id) + '"><i class="fas fa-edit"></i> Editar</button>' +
            '<button class="btn btn-danger btn-small" data-delete-us="' + escapeHtml(us.id) + '"><i class="fas fa-trash"></i></button>' +
            '</div>';
    }
    html += '</div>';
    return html;
}

function renderTimelineExamItem(ex) {
    var typeIcons = { blood: '\u{1FA78}', routine: '\u{1F9EA}', glucose: '\u{1F4C9}', us: '\u{1F476}', prescription: '\u{1F48A}', diet: '\u{1F34E}', other: '\u{1F4CB}' };
    var typeLabels = { blood: 'Sangue', routine: 'Rotina', glucose: 'Glicemia', us: 'Ultrassom', prescription: 'Receita', diet: 'Dieta', other: 'Outro' };
    var icon = typeIcons[ex.type] || '\u{1F4CB}';
    var label = typeLabels[ex.type] || ex.type;

    var html = '<div class="timeline-item" style="border-left:3px solid var(--pink-300);padding-left:12px;">';
    html += '<div class="timeline-date">' + formatDate(ex.date) + ' | ' + icon + ' ' + escapeHtml(label) + '</div>';
    html += '<div class="timeline-title">' + escapeHtml(ex.title) + '</div>';
    html += '<div class="timeline-details">';
    if (ex.doctor) html += '<div class="timeline-detail-item" style="font-size:0.75em;color:var(--text-medium);">Dr(a). ' + escapeHtml(ex.doctor) + '</div>';
    if (ex.lab) html += '<div class="timeline-detail-item" style="font-size:0.75em;color:var(--text-medium);">' + escapeHtml(ex.lab) + '</div>';
    html += '</div></div>';
    return html;
}

function renderUltrasounds() {
    var container = document.getElementById('usList');
    var allUS = getAllUSData();
    if (allUS.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-baby"></i><p>Nenhum ultrassom registrado ainda</p></div>';
        return;
    }

    var searchInput = document.getElementById('usSearchInput');
    var query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    var filtered = allUS;
    if (query) {
        filtered = filtered.filter(function(us) {
            var weekStr = (us.weeks || '') + 's' + (us.days || '') + 'd';
            return (us.title && us.title.toLowerCase().includes(query))
                || (us.date && formatDate(us.date).includes(query))
                || weekStr.includes(query)
                || (us.obs && us.obs.toLowerCase().includes(query));
        });
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>Nenhum ultrassom encontrado para "' + escapeHtml(query) + '"</p></div>';
        return;
    }

    var html = '';
    filtered.slice().reverse().forEach(function(us) {
        html += renderTimelineItem(us, true);
    });
    container.innerHTML = html;

    // Delegated event listeners for edit/delete/detail
    container.querySelectorAll('[data-edit-us]').forEach(function(btn) {
        btn.addEventListener('click', function(e) { e.stopPropagation(); editUltrasound(btn.dataset.editUs); });
    });
    container.querySelectorAll('[data-delete-us]').forEach(function(btn) {
        btn.addEventListener('click', function(e) { e.stopPropagation(); deleteUltrasound(btn.dataset.deleteUs); });
    });
    container.querySelectorAll('[data-usid]').forEach(function(item) {
        item.addEventListener('click', function() { showUSDetail(item.dataset.usid); });
    });
}

function showUSDetail(id) {
    var us = appData.ultrasounds.find(function(u) { return u.id === id; });
    if (!us) {
        var allUS = getAllUSData();
        us = allUS.find(function(u) { return u.id === id; });
    }
    if (!us) return;
    document.getElementById('detailTitle').innerHTML = '<i class="fas fa-baby"></i> ' + escapeHtml(us.title);
    var html = '<div style="margin-bottom:10px">' +
        '<strong>Data:</strong> ' + formatDate(us.date) + '<br>' +
        '<strong>Idade Gestacional:</strong> ' + (escapeHtml(us.weeks) || '--') + 's ' + (escapeHtml(us.days) || 0) + 'd' +
        '</div><div class="stats-grid">';
    if (us.heartbeat) html += '<div class="stat-card"><div class="stat-icon">\u{1F49C}</div><div class="stat-value">' + escapeHtml(us.heartbeat) + '</div><div class="stat-label">Batimentos (bpm)</div></div>';
    if (us.weight) html += '<div class="stat-card"><div class="stat-icon">\u{2696}\u{FE0F}</div><div class="stat-value">' + escapeHtml(us.weight) + '</div><div class="stat-label">Peso (g)</div></div>';
    if (us.femur) html += '<div class="stat-card"><div class="stat-icon">\u{1F9B4}</div><div class="stat-value">' + escapeHtml(us.femur) + '</div><div class="stat-label">Fêmur (mm)</div></div>';
    if (us.ccn) html += '<div class="stat-card"><div class="stat-icon">\u{1F4CF}</div><div class="stat-value">' + escapeHtml(us.ccn) + '</div><div class="stat-label">CCN (mm)</div></div>';
    if (us.dbp) html += '<div class="stat-card"><div class="stat-icon">\u{1F9E0}</div><div class="stat-value">' + escapeHtml(us.dbp) + '</div><div class="stat-label">DBP (mm)</div></div>';
    if (us.ca) html += '<div class="stat-card"><div class="stat-icon">\u{1F4D0}</div><div class="stat-value">' + escapeHtml(us.ca) + '</div><div class="stat-label">CA (mm)</div></div>';
    html += '</div>';

    if (us.cervix) {
        var cervixAnalysis = analyzeCervix(us.cervix);
        html += '<p><strong>Colo Uterino:</strong> ' + escapeHtml(us.cervix) + ' mm <span class="badge badge-' + cervixAnalysis.status + '">' + cervixAnalysis.label + '</span></p>';
    }
    if (us.placenta) html += '<p><strong>Placenta:</strong> ' + escapeHtml(us.placenta) + '</p>';
    if (us.ila) html += '<p><strong>Líquido Amniótico:</strong> ' + escapeHtml(us.ila) + '</p>';
    if (us.obs) html += '<p style="margin-top:10px"><strong>Observações:</strong><br>' + escapeHtml(us.obs) + '</p>';

    // Foto: carregar do IndexedDB (lazy)
    if (us.photo) {
        html += '<div id="detailPhotoContainer" style="margin-top:12px;"><strong>Foto:</strong><br><small>Carregando...</small></div>';
    }

    var allUSDetail = getAllUSData();
    var idx = allUSDetail.findIndex(function(u) { return u.id === id; });
    if (idx > 0) {
        var prev = allUSDetail[idx - 1];
        html += renderComparison(prev, us);
    }

    document.getElementById('detailContent').innerHTML = html;
    openModal('detailModal');

    // Carregar foto async do IndexedDB
    if (us.photo) {
        loadPhoto(us.photo).then(function(data) {
            var photoContainer = document.getElementById('detailPhotoContainer');
            if (photoContainer && data) {
                renderPhoto(photoContainer, data);
            } else if (photoContainer) {
                photoContainer.innerHTML = '<strong>Foto:</strong><br><small>Foto nao encontrada</small>';
            }
        }).catch(function() {});
    }
}

function renderComparison(prev, curr) {
    var html = '<div style="margin-top:15px"><strong style="color:var(--pink-600)">Comparativo com exame anterior (' + formatDate(prev.date) + ')</strong><br><br>';

    var fields = [
        { key: 'heartbeat', label: 'Batimentos', unit: 'bpm', icon: '\u{1F49C}' },
        { key: 'weight', label: 'Peso', unit: 'g', icon: '\u{2696}\u{FE0F}' },
        { key: 'femur', label: 'Fêmur', unit: 'mm', icon: '\u{1F9B4}' },
        { key: 'ccn', label: 'CCN', unit: 'mm', icon: '\u{1F4CF}' }
    ];

    fields.forEach(function(f) {
        if (prev[f.key] && curr[f.key]) {
            var diff = curr[f.key] - prev[f.key];
            var pct = ((diff / prev[f.key]) * 100).toFixed(1);
            var sign = diff >= 0 ? '+' : '';
            html += '<div class="comparison-grid" style="margin-bottom:8px">' +
                '<div class="comparison-item">' +
                    '<div class="label">' + formatDate(prev.date) + '</div>' +
                    '<div class="value">' + prev[f.key] + '</div>' +
                    '<div class="label">' + f.unit + '</div>' +
                '</div>' +
                '<div class="comparison-arrow">' +
                    '<i class="fas fa-arrow-right"></i>' +
                    '<div class="growth-indicator ' + (diff >= 0 ? 'growth-positive' : 'growth-negative') + '">' + sign + diff.toFixed(1) + ' (' + sign + pct + '%)</div>' +
                '</div>' +
                '<div class="comparison-item">' +
                    '<div class="label">' + formatDate(curr.date) + '</div>' +
                    '<div class="value">' + curr[f.key] + '</div>' +
                    '<div class="label">' + f.unit + '</div>' +
                '</div>' +
            '</div>';
        }
    });

    html += '</div>';
    return html;
}

// ============ DASHBOARD ============
// ============ DAILY CONTENT (estilo Flo) + STORIES ============
function getDailyStories() {
    var info = calcCurrentGestationalAge();
    if (!info) return [];
    var weeks = info.weeks;
    var fruit = getFruitForWeek(weeks);
    var weekContent = (typeof weeklyContentFull !== 'undefined' && weeklyContentFull[weeks]) ? weeklyContentFull[weeks] : null;
    var trimestre = weeks < 14 ? 'Primeiro' : weeks < 28 ? 'Segundo' : 'Terceiro';

    var stories = [];

    // Story 1: Seu bebê
    stories.push({
        title: 'Seu bebê com ' + weeks + ' semanas',
        emoji: fruit ? fruit.emoji : '\u{1F476}',
        bg: 'linear-gradient(135deg, #fda4af, #ec4899)',
        content: (weekContent && weekContent.baby) ? weekContent.baby : 'Seu bebê está crescendo! Consulte seu médico para mais detalhes.',
        extra: fruit ? '\u{1F34E} Tamanho: ' + fruit.fruit + ' (' + fruit.size + ')' : '',
        cardClass: 'daily-card-pink'
    });

    // Story 2: Seu corpo
    stories.push({
        title: 'Seu corpo com ' + weeks + ' semanas',
        emoji: '\u{1F930}',
        bg: 'linear-gradient(135deg, #93c5fd, #3b82f6)',
        content: (weekContent && weekContent.body) ? weekContent.body : 'Seu corpo está se adaptando para o bebê. Descanse e se hidrate!',
        extra: '',
        cardClass: 'daily-card-blue'
    });

    // Story 3: Dicas
    stories.push({
        title: 'Dicas da semana ' + weeks,
        emoji: '\u{1F4A1}',
        bg: 'linear-gradient(135deg, #c4b5fd, #8b5cf6)',
        content: (weekContent && weekContent.tips) ? weekContent.tips : 'Mantenha uma alimentação saudável e faça exercícios leves.',
        extra: '',
        cardClass: 'daily-card-lilac'
    });

    // Story 4: Trimestre/Alertas
    stories.push({
        title: trimestre + ' trimestre — Alertas',
        emoji: '\u{26A0}\u{FE0F}',
        bg: 'linear-gradient(135deg, #fde68a, #f59e0b)',
        content: getTrimestreAlerts(weeks),
        extra: '',
        cardClass: 'daily-card-yellow'
    });

    // Story 5: Destaque
    if (weekContent && weekContent.highlight) {
        stories.push({
            title: 'Destaque da semana',
            emoji: '\u{2B50}',
            bg: 'linear-gradient(135deg, #86efac, #22c55e)',
            content: weekContent.highlight,
            extra: '',
            cardClass: 'daily-card-green'
        });
    }

    return stories;
}

function getTrimestreAlerts(weeks) {
    if (weeks < 14) return 'Primeiro trimestre: fase crucial de formação. Tome ácido fólico, evite medicamentos sem prescrição, faça o primeiro ultrassom e exames de sangue. Enjoos são normais — coma pouco e várias vezes ao dia.';
    if (weeks < 28) return 'Segundo trimestre: fase de mais energia! Faça a ultrassom morfológica (20-24 semanas), o teste de glicose (24-28 semanas). Comece a sentir os movimentos do bebê. Hidrate-se bastante e use protetor solar para evitar melasma.';
    return 'Terceiro trimestre: reta final! Faça o exame de Streptococcus (35-37 semanas). Prepare a mala da maternidade. Atenção a sinais de pré-eclâmpsia (inchaço, dor de cabeça, pressão alta). Conte os movimentos do bebê diariamente.';
}

var _storyTimer = null;
var _storyIndex = 0;

function openStory(startIndex) {
    var stories = getDailyStories();
    if (stories.length === 0) return;
    _storyIndex = startIndex || 0;

    var overlay = document.getElementById('storyOverlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    renderStorySlide(stories);
}

function closeStory() {
    var overlay = document.getElementById('storyOverlay');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
    if (_storyTimer) { clearTimeout(_storyTimer); _storyTimer = null; }
}

function renderStorySlide(stories) {
    if (_storyIndex < 0 || _storyIndex >= stories.length) { closeStory(); return; }
    var s = stories[_storyIndex];

    // Progress bars
    var barsHtml = '';
    for (var i = 0; i < stories.length; i++) {
        var cls = i < _storyIndex ? 'story-bar done' : i === _storyIndex ? 'story-bar active' : 'story-bar';
        barsHtml += '<div class="' + cls + '"><div class="story-bar-fill"></div></div>';
    }
    document.getElementById('storyBars').innerHTML = barsHtml;

    // Content
    var content = document.getElementById('storyContent');
    content.style.background = s.bg;
    content.innerHTML =
        '<div class="story-emoji">' + s.emoji + '</div>' +
        '<h2 class="story-title">' + escapeHtml(s.title) + '</h2>' +
        '<div class="story-text">' + escapeHtml(s.content) + '</div>' +
        (s.extra ? '<div class="story-extra">' + escapeHtml(s.extra) + '</div>' : '');

    // Auto-advance after 8 seconds
    if (_storyTimer) clearTimeout(_storyTimer);
    _storyTimer = setTimeout(function() {
        _storyIndex++;
        renderStorySlide(stories);
    }, 8000);
}

function storyTap(e) {
    var stories = getDailyStories();
    var rect = e.currentTarget.getBoundingClientRect();
    var x = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : rect.width / 2);
    var relX = x - rect.left;

    if (relX < rect.width * 0.3) {
        // Tap left → previous
        _storyIndex = Math.max(0, _storyIndex - 1);
    } else {
        // Tap right → next
        _storyIndex++;
    }
    renderStorySlide(stories);
}

function renderDailyContent() {
    var container = document.getElementById('dailyContentSection');
    if (!container) return;

    var stories = getDailyStories();
    if (stories.length === 0) { container.innerHTML = ''; return; }

    var info = calcCurrentGestationalAge();
    var weeks = info ? info.weeks : 0;

    var html = '';
    html += '<div style="padding:0 5px;margin-bottom:10px;">';
    html += '<div style="font-size:0.95em;font-weight:800;color:var(--text-dark);">Conteúdo da semana ' + weeks + '</div>';
    html += '</div>';

    // Cards horizontais — cada um abre story no índice correspondente
    html += '<div class="daily-cards-scroll">';
    stories.forEach(function(s, idx) {
        html += '<div class="daily-card ' + s.cardClass + '" data-story-idx="' + idx + '">';
        html += '<div class="daily-card-title">' + escapeHtml(s.title) + '</div>';
        html += '<div class="daily-card-visual">' + s.emoji + '</div>';
        html += '</div>';
    });
    html += '</div>';

    container.innerHTML = html;

    // Cada card abre o story correspondente
    container.querySelectorAll('[data-story-idx]').forEach(function(card) {
        card.addEventListener('click', function() {
            openStory(parseInt(card.dataset.storyIdx));
        });
    });
}

function renderDashboard() {
    // Baby illustration
    var babyInfo = calcCurrentGestationalAge();
    var babyCard = document.getElementById('babyIllustrationCard');
    if (babyCard && babyInfo && typeof getBabyIllustration === 'function') {
        var illust = getBabyIllustration(babyInfo.weeks);
        if (illust) {
            document.getElementById('babyIllustrationSvg').innerHTML = illust.svg;
            document.getElementById('babyIllustrationLabel').textContent = 'Tamanho: ' + illust.label;
            document.getElementById('babyIllustrationSize').textContent = illust.size;
            babyCard.style.display = 'block';
        }
    } else if (babyCard) {
        babyCard.style.display = 'none';
    }

    // Conteúdo diário estilo Flo
    renderDailyContent();
    // UX-017: Achievements
    renderAchievements();
    // FEAT-002 + FEAT-003: Milestone card + fruit comparison
    renderMilestoneCard();
    // FEAT-008: Symptom tracker
    renderSymptomTracker();
    // FEAT-006: Exam checklist
    renderExamChecklist();
    // Alerta gentil de exames pendentes (1x por sessão)
    renderExamAlert();
    // Resultados laboratoriais no dashboard
    renderLabResults();
    // FEAT-004: Kick counter
    renderKickCounter();

    var uss = getAllUSData();

    // Pegar últimos valores de batimentos, peso, femur, CCN da fonte unificada
    var latestStats = { heartbeat: '--', weight: '--', femur: '--', ccn: '--' };
    if (uss.length > 0) {
        var last = uss[uss.length - 1];
        if (last.heartbeat) latestStats.heartbeat = last.heartbeat;
        if (last.weight) latestStats.weight = last.weight;
        if (last.femur) latestStats.femur = last.femur;
        if (last.ccn) latestStats.ccn = last.ccn;
    }

    document.getElementById('statHeartbeat').textContent = latestStats.heartbeat;
    document.getElementById('statWeight').textContent = latestStats.weight;
    document.getElementById('statFemur').textContent = latestStats.femur;
    document.getElementById('statCCN').textContent = latestStats.ccn;

    if (uss.length >= 2) {
        var prev = uss[uss.length - 2];
        var last2 = uss[uss.length - 1];
        document.getElementById('comparisonCard').style.display = 'block';
        document.getElementById('comparisonContent').innerHTML = renderComparison(prev, last2);
    }

    var timeline = document.getElementById('dashTimeline');
    // Combinar ultrassons unificados e exames não-US na linha do tempo
    var timelineItems = [];
    uss.forEach(function(us) {
        timelineItems.push({ type: 'us', date: us.date, data: us });
    });
    var allExams = [];
    try { allExams = typeof getExams === 'function' ? getExams() : JSON.parse(localStorage.getItem('hadassa_exams') || '[]'); } catch(e) {}
    allExams.forEach(function(ex) {
        if ((ex.status === 'done' || ex.status === 'scheduled') && ex.type !== 'us') {
            timelineItems.push({ type: 'exam', date: ex.date, data: ex });
        }
    });
    // Ordenar por data (mais recente primeiro)
    timelineItems.sort(function(a, b) { return b.date.localeCompare(a.date); });

    if (timelineItems.length === 0) {
        timeline.innerHTML = '<div class="empty-state"><i class="fas fa-baby-carriage"></i><p>Adicione seu primeiro ultrassom ou exame!</p></div>';
    } else {
        var html = '';
        timelineItems.slice(0, 8).forEach(function(item) {
            if (item.type === 'us') {
                html += renderTimelineItem(item.data, false);
            } else {
                html += renderTimelineExamItem(item.data);
            }
        });
        timeline.innerHTML = html;
        // Add click listeners for timeline items on dashboard
        timeline.querySelectorAll('[data-usid]').forEach(function(item) {
            item.addEventListener('click', function() { showUSDetail(item.dataset.usid); });
        });
    }

    // Upcoming appointments
    var upDiv = document.getElementById('upcomingAppointments');
    var upDivTop = document.getElementById('upcomingAppointmentsTop');
    var topCard = document.getElementById('nextAppointmentsTop');
    var today = toLocalDateStr(new Date());
    var upcoming = appData.appointments.filter(function(a) { return a.date >= today; }).sort(function(a, b) { return a.date.localeCompare(b.date); }).slice(0, 3);

    if (upcoming.length === 0) {
        if (upDiv) upDiv.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-plus"></i><p>Nenhuma consulta próxima</p></div>';
        if (topCard) topCard.style.display = 'none';
    } else {
        var upHtml = '';
        upcoming.forEach(function(a) {
            var parts = a.date.split('-');
            upHtml += '<div class="appointment-card">' +
                '<div class="appointment-info">' +
                    '<h4>' + escapeHtml(a.type) + '</h4>' +
                    '<p>' + (escapeHtml(a.time) || '') + (a.doctor ? ' | Dr(a). ' + escapeHtml(a.doctor) : '') + '</p>' +
                    '<p>' + (escapeHtml(a.location) || '') + '</p>' +
                '</div>' +
                '<div class="appointment-date-badge">' +
                    '<div class="day">' + parts[2] + '</div>' +
                    '<div class="month">' + MONTHS_SHORT[parseInt(parts[1])-1] + '</div>' +
                '</div>' +
            '</div>';
        });
        if (upDiv) upDiv.innerHTML = upHtml;
        // Mostrar também no topo do dashboard
        if (upDivTop) upDivTop.innerHTML = upHtml;
        if (topCard) topCard.style.display = 'block';
    }
}

// ============ APPOINTMENTS ============
function saveAppointment(e) {
    e.preventDefault();
    var editId = document.getElementById('appEditId').value;
    var app = {
        id: editId || genId(),
        date: document.getElementById('appDate').value,
        time: document.getElementById('appTime').value,
        type: document.getElementById('appType').value,
        doctor: document.getElementById('appDoctor').value,
        location: document.getElementById('appLocation').value,
        momWeight: document.getElementById('appMomWeight').value || null,
        bloodPressure: document.getElementById('appBloodPressure').value || null,
        notes: document.getElementById('appNotes').value
    };

    if (editId) {
        var idx = appData.appointments.findIndex(function(a) { return a.id === editId; });
        if (idx !== -1) appData.appointments[idx] = app;
    } else {
        appData.appointments.push(app);
    }

    appData.appointments.sort(function(a, b) { return a.date.localeCompare(b.date); });
    saveData(appData);
    closeModal('appointModal', true);
    showToast('Consulta salva com sucesso!');
    renderAfterChange('appointment');
}

function deleteAppointment(id) {
    showCustomConfirm('Excluir Consulta', 'Deseja excluir esta consulta?', '\u{1F5D1}').then(function(confirmed) {
        if (!confirmed) return;
        appData.appointments = appData.appointments.filter(function(a) { return a.id !== id; });
        saveData(appData);
        renderAfterChange('appointment');
        showToast('Consulta excluída!');
    });
}

function editAppointment(id) {
    var a = appData.appointments.find(function(ap) { return ap.id === id; });
    if (!a) return;
    document.getElementById('appEditId').value = a.id;
    document.getElementById('appDate').value = a.date;
    document.getElementById('appTime').value = a.time;
    document.getElementById('appType').value = a.type;
    document.getElementById('appDoctor').value = a.doctor;
    document.getElementById('appLocation').value = a.location;
    document.getElementById('appMomWeight').value = a.momWeight || '';
    document.getElementById('appBloodPressure').value = a.bloodPressure || '';
    document.getElementById('appNotes').value = a.notes;
    openModal('appointModal');
}

function renderAppointments() {
    var container = document.getElementById('appointList');
    if (appData.appointments.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-alt"></i><p>Nenhuma consulta agendada</p></div>';
        return;
    }

    var today = toLocalDateStr(new Date());
    var html = '';
    appData.appointments.slice().reverse().forEach(function(a) {
        var isPast = a.date < today;
        var parts = a.date.split('-');
        html += '<div class="appointment-card" style="' + (isPast ? 'opacity:0.6;' : '') + '">' +
            '<div class="appointment-info">' +
                '<h4>' + escapeHtml(a.type) + (isPast ? ' (Realizada)' : '') + '</h4>' +
                '<p>' + formatDate(a.date) + (a.time ? ' | ' + escapeHtml(a.time) : '') + '</p>' +
                '<p>' + (a.doctor ? 'Dr(a). ' + escapeHtml(a.doctor) : '') + (a.location ? ' | ' + escapeHtml(a.location) : '') + '</p>' +
                (a.notes ? '<p style="font-size:0.75em; color: var(--text-light); margin-top:4px">' + escapeHtml(a.notes) + '</p>' : '') +
                '<div class="actions-row">' +
                    '<button class="btn btn-secondary btn-small" data-edit-app="' + escapeHtml(a.id) + '"><i class="fas fa-edit"></i> Editar</button>' +
                    '<button class="btn btn-danger btn-small" data-delete-app="' + escapeHtml(a.id) + '"><i class="fas fa-trash"></i></button>' +
                '</div>' +
            '</div>' +
            '<div class="appointment-date-badge">' +
                '<div class="day">' + parts[2] + '</div>' +
                '<div class="month">' + MONTHS_SHORT[parseInt(parts[1])-1] + '</div>' +
            '</div>' +
        '</div>';
    });
    container.innerHTML = html;

    container.querySelectorAll('[data-edit-app]').forEach(function(btn) {
        btn.addEventListener('click', function() { editAppointment(btn.dataset.editApp); });
    });
    container.querySelectorAll('[data-delete-app]').forEach(function(btn) {
        btn.addEventListener('click', function() { deleteAppointment(btn.dataset.deleteApp); });
    });
}

// ============ NOTES ============
function saveNote(e) {
    e.preventDefault();
    var editId = document.getElementById('noteEditId').value;
    var note = {
        id: editId || genId(),
        type: document.getElementById('noteType').value,
        title: document.getElementById('noteTitle').value,
        date: document.getElementById('noteDate').value || toLocalDateStr(new Date()),
        content: document.getElementById('noteContent').value
    };

    if (editId) {
        var idx = appData.notes.findIndex(function(n) { return n.id === editId; });
        if (idx !== -1) appData.notes[idx] = note;
    } else {
        appData.notes.push(note);
    }

    saveData(appData);
    closeModal('noteModal', true);
    showToast('Anotação salva com sucesso!');
    renderAfterChange('note');
}

function deleteNote(id) {
    showCustomConfirm('Excluir Anotação', 'Deseja excluir esta anotação?', '\u{1F5D1}').then(function(confirmed) {
        if (!confirmed) return;
        appData.notes = appData.notes.filter(function(n) { return n.id !== id; });
        saveData(appData);
        renderAfterChange('note');
        showToast('Anotação excluída!');
    });
}

function editNote(id) {
    var n = appData.notes.find(function(nt) { return nt.id === id; });
    if (!n) return;
    document.getElementById('noteEditId').value = n.id;
    document.getElementById('noteType').value = n.type;
    document.getElementById('noteTitle').value = n.title;
    document.getElementById('noteDate').value = n.date;
    document.getElementById('noteContent').value = n.content;
    openModal('noteModal');
}

function renderNotes(filter) {
    filter = filter || 'all';
    var container = document.getElementById('notesList');
    var notes = appData.notes;
    // FEAT-014: Medication tab
    if (filter === 'medicacao') {
        renderMedicationList();
        return;
    }
    if (filter !== 'all') notes = notes.filter(function(n) { return n.type === filter; });

    if (notes.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-book"></i><p>Nenhuma anotação encontrada</p></div>';
        return;
    }

    var html = '';
    notes.slice().reverse().forEach(function(n) {
        var typeClass = n.type === 'receita' ? 'recipe' : '';
        var typeIcon = n.type === 'receita' ? '\u{1F48A}' : n.type === 'sintoma' ? '\u{1FA7A}' : '\u{1F4DD}';
        html += '<div class="note-card ' + typeClass + '">' +
            '<h4>' + typeIcon + ' ' + escapeHtml(n.title) + '</h4>' +
            '<p>' + escapeHtml(n.content) + '</p>' +
            '<div class="note-meta">' + formatDate(n.date) + ' | ' + escapeHtml(n.type) + '</div>' +
            '<div class="actions-row">' +
                '<button class="btn btn-secondary btn-small" data-edit-note="' + escapeHtml(n.id) + '"><i class="fas fa-edit"></i> Editar</button>' +
                '<button class="btn btn-danger btn-small" data-delete-note="' + escapeHtml(n.id) + '"><i class="fas fa-trash"></i></button>' +
            '</div>' +
        '</div>';
    });
    container.innerHTML = html;

    container.querySelectorAll('[data-edit-note]').forEach(function(btn) {
        btn.addEventListener('click', function() { editNote(btn.dataset.editNote); });
    });
    container.querySelectorAll('[data-delete-note]').forEach(function(btn) {
        btn.addEventListener('click', function() { deleteNote(btn.dataset.deleteNote); });
    });
}

// ============ CHARTS ============
var mainChart = null;

function initCharts() {
    if (mainChart) mainChart.destroy();
    var activeTab = document.querySelector('.sub-tab[data-chart].active');
    updateChart(activeTab ? activeTab.dataset.chart : 'heartbeat');
}

function updateChart(type) {
    if (mainChart) mainChart.destroy();
    var ctx = document.getElementById('mainChart').getContext('2d');

    // FEAT-011: Radar chart
    if (type === 'radar') {
        renderRadarChart();
        return;
    }

    // FEAT-005: Peso materno como gráfico (unificado: consultas + tracker)
    if (type === 'momWeight') {
        var momWeights = getAllMomWeights();
        var cfg = appData.config;
        var preWeight = parseFloat(cfg.preWeight) || null;
        var height = parseFloat(cfg.height) || null;
        var bmi = (preWeight && height) ? preWeight / ((height/100) * (height/100)) : null;
        var gainRange = !bmi ? null : bmi < 18.5 ? [12.5, 18] : bmi < 25 ? [11.5, 16] : bmi < 30 ? [7, 11.5] : [5, 9];

        // Incluir peso pré-gestacional como primeiro ponto se disponível
        var allPoints = [];
        if (preWeight && cfg.dum) {
            allPoints.push({ date: cfg.dum, weight: preWeight, label: 'Pre-gravidez', isPreWeight: true });
        }
        momWeights.forEach(function(w) {
            allPoints.push({ date: w.date, weight: parseFloat(w.weight), label: formatDate(w.date), isPreWeight: false });
        });
        allPoints.sort(function(a, b) { return a.date.localeCompare(b.date); });

        var mLabels = allPoints.map(function(p) {
            if (p.isPreWeight) return 'Pre-gravidez';
            if (cfg.dum) {
                var wInfo = calcWeeksFromDUM(cfg.dum, p.date);
                return wInfo ? wInfo.weeks + 's ' + formatDate(p.date) : formatDate(p.date);
            }
            return formatDate(p.date);
        });
        var mData = allPoints.map(function(p) { return p.weight; });

        // Calcular faixa ideal para cada ponto
        var datasets = [{
            label: 'Seu Peso (kg)',
            data: mData,
            borderColor: '#ec4899',
            backgroundColor: 'rgba(236,72,153,0.15)',
            borderWidth: 3,
            pointRadius: 6,
            pointBackgroundColor: allPoints.map(function(p) { return p.isPreWeight ? '#a855f7' : '#ec4899'; }),
            fill: false,
            tension: 0.3
        }];

        if (preWeight && gainRange && cfg.dum) {
            var idealMin = allPoints.map(function(p) {
                if (p.isPreWeight) return preWeight;
                var wInfo = calcWeeksFromDUM(cfg.dum, p.date);
                return wInfo ? preWeight + (gainRange[0] / 40 * wInfo.weeks) : null;
            });
            var idealMax = allPoints.map(function(p) {
                if (p.isPreWeight) return preWeight;
                var wInfo = calcWeeksFromDUM(cfg.dum, p.date);
                return wInfo ? preWeight + (gainRange[1] / 40 * wInfo.weeks) : null;
            });
            datasets.push({
                label: 'Min Ideal',
                data: idealMin,
                borderColor: 'rgba(34,197,94,0.5)',
                borderWidth: 1,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            });
            datasets.push({
                label: 'Max Ideal',
                data: idealMax,
                borderColor: 'rgba(34,197,94,0.5)',
                borderWidth: 1,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: '-1',
                backgroundColor: 'rgba(34,197,94,0.08)'
            });
        }

        mainChart = new Chart(ctx, {
            type: 'line',
            data: { labels: mLabels, datasets: datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { font: { family: 'Nunito', size: 11 } } } },
                scales: { y: { beginAtZero: false, title: { display: true, text: 'kg' } }, x: { ticks: { font: { size: 9 }, maxRotation: 45 } } }
            }
        });

        // Tabela comparativa detalhada
        var tableData = allPoints.map(function(p) {
            var wInfo = cfg.dum ? calcWeeksFromDUM(cfg.dum, p.date) : null;
            var gain = preWeight ? (p.weight - preWeight) : null;
            var idealMinW = (preWeight && gainRange && wInfo) ? preWeight + (gainRange[0] / 40 * wInfo.weeks) : null;
            var idealMaxW = (preWeight && gainRange && wInfo) ? preWeight + (gainRange[1] / 40 * wInfo.weeks) : null;
            var status = '';
            if (gain !== null && idealMinW !== null) {
                if (p.weight >= idealMinW && p.weight <= idealMaxW) status = 'Adequado';
                else if (p.weight < idealMinW) status = 'Abaixo';
                else status = 'Acima';
            }
            return { date: p.date, momWeight: p.weight, weeks: wInfo ? wInfo.weeks : null, days: wInfo ? wInfo.days : null, gain: gain, idealMin: idealMinW, idealMax: idealMaxW, status: status, isPreWeight: p.isPreWeight };
        });
        updateChartTable('momWeight', tableData);
        return;
    }

    var uss = getAllUSData().filter(function(u) { return u[type] !== null && u[type] !== undefined; });

    var labels = uss.map(function(u) {
        return u.weeks ? u.weeks + 's' + (u.days ? u.days + 'd' : '') : formatDate(u.date);
    });
    var data = uss.map(function(u) { return u[type]; });
    var dates = uss.map(function(u) { return formatDate(u.date); });

    var typeLabels = {
        heartbeat: 'Batimentos Cardíacos (bpm)',
        weight: 'Peso Estimado (g)',
        femur: 'Comprimento do Fêmur (mm)',
        ccn: 'Comprimento Cabeça-Nádega (mm)'
    };

    var colors = {
        heartbeat: { bg: 'rgba(236, 72, 153, 0.2)', border: '#ec4899' },
        weight: { bg: 'rgba(168, 85, 247, 0.2)', border: '#a855f7' },
        femur: { bg: 'rgba(59, 130, 246, 0.2)', border: '#3b82f6' },
        ccn: { bg: 'rgba(34, 197, 94, 0.2)', border: '#22c55e' }
    };

    var refData = type === 'heartbeat' ? heartRef : type === 'weight' ? weightRef : type === 'femur' ? femurRef : null;
    var datasets = [{
        label: typeLabels[type],
        data: data,
        borderColor: colors[type].border,
        backgroundColor: colors[type].bg,
        borderWidth: 3,
        pointBackgroundColor: colors[type].border,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
        tension: 0.3
    }];

    if (refData && uss.length > 0) {
        var refMin = uss.map(function(u) { return refData[u.weeks] ? refData[u.weeks][0] : null; });
        var refAvg = uss.map(function(u) { return refData[u.weeks] ? refData[u.weeks][1] : null; });
        var refMax = uss.map(function(u) { return refData[u.weeks] ? refData[u.weeks][2] : null; });

        datasets.push({
            label: 'Percentil 90',
            data: refMax,
            borderColor: 'rgba(156, 163, 175, 0.3)',
            borderWidth: 1, pointRadius: 0, fill: false, tension: 0.3
        });
        datasets.push({
            label: 'Percentil 10',
            data: refMin,
            borderColor: 'rgba(156, 163, 175, 0.3)',
            borderWidth: 1, pointRadius: 0,
            fill: '-1', backgroundColor: 'rgba(156, 163, 175, 0.1)', tension: 0.3
        });
        datasets.push({
            label: 'Referência (média)',
            data: refAvg,
            borderColor: 'rgba(156, 163, 175, 0.5)',
            borderWidth: 2, borderDash: [5, 5], pointRadius: 0, fill: false, tension: 0.3
        });
    }

    mainChart = new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'bottom', labels: { font: { family: 'Nunito' } } },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) { return dates[context.dataIndex] ? 'Data: ' + dates[context.dataIndex] : ''; }
                    }
                }
            },
            scales: {
                y: { beginAtZero: false, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });

    updateChartTable(type, uss);
}

function updateChartTable(type, uss) {
    var tbody = document.getElementById('chartTableBody');
    var thead = document.getElementById('chartTableHead');
    var unitMap = { heartbeat: 'bpm', weight: 'g', femur: 'mm', ccn: 'mm', momWeight: 'kg' };

    if (uss.length === 0) {
        if (thead) thead.innerHTML = '<tr><th>Data</th><th>Sem.</th><th>Valor</th><th>Variacao</th></tr>';
        tbody.innerHTML = '<tr><td colspan="4">Sem dados</td></tr>';
        return;
    }

    // Tabela especial para peso materno
    if (type === 'momWeight') {
        if (thead) thead.innerHTML = '<tr><th>Data</th><th>Sem.</th><th>Peso</th><th>Ganho</th><th>Faixa Ideal</th><th>Status</th></tr>';
        var html = '';
        uss.forEach(function(us) {
            var weekStr = us.weeks ? us.weeks + 's' + (us.days ? us.days + 'd' : '') : '--';
            var gainStr = us.gain !== null ? (us.gain >= 0 ? '+' : '') + us.gain.toFixed(1) + ' kg' : '--';
            var idealStr = (us.idealMin && us.idealMax) ? us.idealMin.toFixed(1) + ' - ' + us.idealMax.toFixed(1) : '--';
            var statusBadge = '';
            if (us.isPreWeight) {
                statusBadge = '<span style="font-size:0.8em;color:var(--text-light);">Inicio</span>';
            } else if (us.status === 'Adequado') {
                statusBadge = '<span class="badge badge-safe" style="font-size:0.75em;">Adequado</span>';
            } else if (us.status === 'Abaixo') {
                statusBadge = '<span class="badge badge-warning" style="font-size:0.75em;">Abaixo</span>';
            } else if (us.status === 'Acima') {
                statusBadge = '<span class="badge badge-warning" style="font-size:0.75em;">Acima</span>';
            }
            html += '<tr><td>' + formatDate(us.date) + '</td><td>' + weekStr + '</td><td><strong>' + us.momWeight.toFixed(1) + '</strong> kg</td><td>' + gainStr + '</td><td>' + idealStr + '</td><td>' + statusBadge + '</td></tr>';
        });
        tbody.innerHTML = html;
        return;
    }

    // Tabela padrão para outros tipos
    if (thead) thead.innerHTML = '<tr><th>Data</th><th>Sem.</th><th>Valor</th><th>Variacao</th></tr>';
    var html = '';
    uss.forEach(function(us, i) {
        var val = us[type];
        var variation = '--';
        if (i > 0 && uss[i-1][type]) {
            var diff = val - uss[i-1][type];
            var pct = ((diff / uss[i-1][type]) * 100).toFixed(1);
            var sign = diff >= 0 ? '+' : '';
            variation = sign + diff.toFixed(1) + ' (' + sign + pct + '%)';
        }
        var weekStr = us.weeks ? us.weeks + 's' + (us.days ? us.days + 'd' : '') : '--';
        html += '<tr><td>' + formatDate(us.date) + '</td><td>' + weekStr + '</td><td>' + val + ' ' + unitMap[type] + '</td><td>' + variation + '</td></tr>';
    });
    tbody.innerHTML = html;
}

// ============ PARAMETERS ============
function renderParams() {
    renderRefTable('weightRefTable', weightRef);
    renderRefTable('femurRefTable', femurRef);
    renderRefTable('heartRefTable', heartRef);

    var statusDiv = document.getElementById('paramStatus');
    var uss = getAllUSData();
    if (uss.length === 0) {
        statusDiv.innerHTML = '<div class="empty-state"><i class="fas fa-stethoscope"></i><p>Registre ultrassons ou exames para ver análise</p></div>';
        return;
    }

    var last = uss[uss.length - 1];
    var html = '<div style="font-size:0.9em">';
    html += '<p><strong>Último exame:</strong> ' + formatDate(last.date) + ' | ' + (last.weeks || '--') + 's' + (last.days || 0) + 'd</p><br>';

    // AUDIT V1.2 [V12-COD-003]: Usando funcoes de analise puras
    var heartAnalysis = analyzeHeartbeat(last.heartbeat, last.weeks);
    if (heartAnalysis) {
        html += '<p>\u{1F49C} <strong>Batimentos' + renderMetricHelp('heartbeat') + ':</strong> ' + last.heartbeat + ' bpm' +
            ' <span class="badge badge-' + heartAnalysis.status + '">' + heartAnalysis.label + '</span>' +
            '<br><small>Ref. ' + last.weeks + ' semanas: ' + heartAnalysis.reference + ' (Fonte: Doubilet & Benson / AIUM)</small></p><br>';
    }

    var weightAnalysis = analyzeWeight(last.weight, last.weeks);
    if (weightAnalysis) {
        html += '<p>\u{2696}\u{FE0F} <strong>Peso' + renderMetricHelp('weight') + ':</strong> ' + last.weight + ' g' +
            ' <span class="badge badge-' + weightAnalysis.status + '">' + weightAnalysis.label + '</span>' +
            '<br><small>Ref. ' + last.weeks + ' semanas: ' + weightAnalysis.reference + ' (Fonte: Hadlock / OMS)</small></p><br>';
    }

    var femurAnalysis = analyzeFemur(last.femur, last.weeks);
    if (femurAnalysis) {
        html += '<p>\u{1F9B4} <strong>Fêmur' + renderMetricHelp('femur') + ':</strong> ' + last.femur + ' mm' +
            ' <span class="badge badge-' + femurAnalysis.status + '">' + femurAnalysis.label + '</span>' +
            '<br><small>Ref. ' + last.weeks + ' semanas: ' + femurAnalysis.reference + ' (Fonte: INTERGROWTH-21st)</small></p><br>';
    }

    var cervixAnalysis = analyzeCervix(last.cervix);
    if (cervixAnalysis) {
        html += '<p>\u{1F3F0} <strong>Colo Uterino:</strong> ' + last.cervix + ' mm' +
            ' <span class="badge badge-' + cervixAnalysis.status + '">' + cervixAnalysis.label + '</span>' +
            '<br><small>Referência: ' + cervixAnalysis.reference + ' (baixo risco)</small></p>';
    }

    // FEAT-005: Peso materno
    var momWeightHtml = renderMomWeightChart();
    if (momWeightHtml) html += momWeightHtml;

    html += '</div>';
    statusDiv.innerHTML = html;
}

function renderRefTable(tableId, refData) {
    var tbody = document.querySelector('#' + tableId + ' tbody');
    var allUS = getAllUSData();
    var lastUS = allUS.length > 0 ? allUS[allUS.length - 1] : null;
    var currentWeek = lastUS ? lastUS.weeks : null;

    var html = '';
    Object.entries(refData).forEach(function(entry) {
        var week = entry[0], vals = entry[1];
        var isCurrentWeek = currentWeek && parseInt(week) === currentWeek;
        html += '<tr class="' + (isCurrentWeek ? 'highlight-row' : '') + '">' +
            '<td>' + week + '</td><td>' + vals[0] + '</td><td>' + vals[1] + '</td><td>' + vals[2] + '</td></tr>';
    });
    tbody.innerHTML = html;
}

// ============ PDF REPORTS ============
function generatePDF(type) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF();
    var cfg = appData.config;
    var pink = [236, 72, 153];
    var darkPink = [190, 24, 93];

    doc.setFillColor(pink[0], pink[1], pink[2]);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(cfg.babyName ? 'A Jornada de ' + cfg.babyName : 'Minha Gestação', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(cfg.babyName + ' (' + cfg.babySex + ') | Mae: ' + cfg.momName, 105, 23, { align: 'center' });
    doc.text('Gerado em: ' + formatDate(toLocalDateStr(new Date())), 105, 30, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    var y = 45;

    if (type === 'complete' || type === 'ultrasounds') {
        doc.setFontSize(14);
        doc.setTextColor(darkPink[0], darkPink[1], darkPink[2]);
        doc.text('Registros de Ultrassom', 15, y);
        y += 8;

        var allUS = getAllUSData();
        if (allUS.length > 0) {
            var usData = allUS.map(function(us) {
                return [
                    formatDate(us.date), us.weeks ? us.weeks + 's' + (us.days || 0) + 'd' : '--',
                    us.heartbeat || '--', us.weight || '--', us.femur || '--',
                    us.ccn || '--', us.cervix || '--', us.title
                ];
            });
            doc.autoTable({
                startY: y,
                head: [['Data', 'Idade', 'BPM', 'Peso(g)', 'Fêmur', 'CCN', 'Colo', 'Tipo']],
                body: usData,
                theme: 'grid',
                headStyles: { fillColor: pink, fontSize: 8 },
                bodyStyles: { fontSize: 7 },
                margin: { left: 15, right: 15 }
            });
            y = doc.lastAutoTable.finalY + 15;
        } else {
            doc.setFontSize(10); doc.setTextColor(100, 100, 100);
            doc.text('Nenhum registro de ultrassom.', 15, y); y += 15;
        }
    }

    if (type === 'complete' || type === 'evolution') {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setTextColor(darkPink[0], darkPink[1], darkPink[2]);
        doc.text('Evolução e Comparativos', 15, y);
        y += 8;

        var chartCanvas = document.getElementById('mainChart');
        if (chartCanvas && mainChart) {
            try {
                var chartImg = chartCanvas.toDataURL('image/png', 0.9);
                if (y > 160) { doc.addPage(); y = 20; }
                doc.addImage(chartImg, 'PNG', 15, y, 180, 80);
                y += 88;
            } catch (e) { /* canvas vazio */ }
        }

        var evoUS = getAllUSData();
        if (evoUS.length >= 2) {
            var uss = evoUS;
            var evoData = [];
            for (var i = 1; i < uss.length; i++) {
                var prev = uss[i-1], curr = uss[i];
                var row = [
                    formatDate(prev.date) + ' -> ' + formatDate(curr.date),
                    (prev.weeks || '--') + 's -> ' + (curr.weeks || '--') + 's'
                ];
                ['heartbeat', 'weight', 'femur', 'ccn'].forEach(function(key) {
                    if (prev[key] && curr[key]) {
                        var diff = curr[key] - prev[key];
                        row.push(diff >= 0 ? '+' + diff.toFixed(1) : diff.toFixed(1));
                    } else { row.push('--'); }
                });
                evoData.push(row);
            }
            doc.autoTable({
                startY: y,
                head: [['Período', 'Semanas', 'BPM', 'Peso(g)', 'Fêmur(mm)', 'CCN(mm)']],
                body: evoData, theme: 'grid',
                headStyles: { fillColor: pink, fontSize: 8 },
                bodyStyles: { fontSize: 7 }, margin: { left: 15, right: 15 }
            });
            y = doc.lastAutoTable.finalY + 15;
        }
    }

    if (type === 'complete' || type === 'appointments') {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setTextColor(darkPink[0], darkPink[1], darkPink[2]);
        doc.text('Consultas e Agendamentos', 15, y);
        y += 8;

        if (appData.appointments.length > 0) {
            var appTableData = appData.appointments.map(function(a) {
                return [formatDate(a.date), a.time || '--', a.type, a.doctor || '--', a.location || '--', a.notes || ''];
            });
            doc.autoTable({
                startY: y,
                head: [['Data', 'Hora', 'Tipo', 'Médico(a)', 'Local', 'Notas']],
                body: appTableData, theme: 'grid',
                headStyles: { fillColor: pink, fontSize: 8 },
                bodyStyles: { fontSize: 7 }, margin: { left: 15, right: 15 }
            });
            y = doc.lastAutoTable.finalY + 15;
        }
    }

    // Exames laboratoriais no relatório completo
    if (type === 'complete') {
        var labExams = [];
        try { labExams = typeof getExams === 'function' ? getExams() : JSON.parse(localStorage.getItem('hadassa_exams') || '[]'); } catch(e) {}
        var doneExams = labExams.filter(function(ex) { return ex.status === 'done' && ex.type !== 'us'; });
        if (doneExams.length > 0) {
            if (y > 240) { doc.addPage(); y = 20; }
            doc.setFontSize(14);
            doc.setTextColor(darkPink[0], darkPink[1], darkPink[2]);
            doc.text('Exames Laboratoriais', 15, y);
            y += 8;
            var labData = doneExams.map(function(ex) {
                var typeLabels = { blood: 'Sangue', routine: 'Rotina', glucose: 'Glicemia', prescription: 'Receita', diet: 'Dieta', other: 'Outro' };
                var resultText = ex.results || '';
                if (resultText.length > 80) resultText = resultText.substring(0, 77) + '...';
                return [formatDate(ex.date), typeLabels[ex.type] || ex.type, ex.title, ex.doctor || '--', resultText];
            });
            doc.autoTable({
                startY: y,
                head: [['Data', 'Tipo', 'Exame', 'Médico(a)', 'Resultado']],
                body: labData, theme: 'grid',
                headStyles: { fillColor: pink, fontSize: 8 },
                bodyStyles: { fontSize: 7 }, margin: { left: 15, right: 15 }
            });
            y = doc.lastAutoTable.finalY + 15;
        }
    }

    // Peso materno no relatório completo
    if (type === 'complete') {
        var momWeights = getAllMomWeights();
        if (momWeights.length > 0) {
            if (y > 240) { doc.addPage(); y = 20; }
            doc.setFontSize(14);
            doc.setTextColor(darkPink[0], darkPink[1], darkPink[2]);
            doc.text('Peso Materno', 15, y);
            y += 8;
            var preW = parseFloat(cfg.preWeight) || null;
            var mwData = momWeights.map(function(w) {
                var row = [formatDate(w.date), parseFloat(w.weight).toFixed(1) + ' kg'];
                if (preW) row.push((parseFloat(w.weight) - preW >= 0 ? '+' : '') + (parseFloat(w.weight) - preW).toFixed(1) + ' kg');
                return row;
            });
            var mwHead = preW ? [['Data', 'Peso', 'Ganho']] : [['Data', 'Peso']];
            doc.autoTable({
                startY: y,
                head: mwHead,
                body: mwData, theme: 'grid',
                headStyles: { fillColor: pink, fontSize: 8 },
                bodyStyles: { fontSize: 7 }, margin: { left: 15, right: 15 }
            });
            y = doc.lastAutoTable.finalY + 15;
        }
    }

    if (type === 'complete' && appData.notes.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setTextColor(darkPink[0], darkPink[1], darkPink[2]);
        doc.text('Anotações e Receitas', 15, y);
        y += 8;
        appData.notes.forEach(function(n) {
            if (y > 260) { doc.addPage(); y = 20; }
            doc.setFontSize(9);
            doc.setTextColor(pink[0], pink[1], pink[2]);
            doc.text('[' + n.type.toUpperCase() + '] ' + n.title + ' - ' + formatDate(n.date), 15, y);
            y += 5;
            doc.setTextColor(60, 60, 60);
            doc.setFontSize(8);
            var lines = doc.splitTextToSize(n.content, 180);
            doc.text(lines, 15, y);
            y += lines.length * 4 + 8;
        });
    }

    var pageCount = doc.internal.getNumberOfPages();
    for (var p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text('Criado para ' + cfg.momName + ' & ' + cfg.babyName + ' | Dados de Ultrassonografia', 105, 290, { align: 'center' });
        doc.text('Pagina ' + p + ' de ' + pageCount, 195, 290, { align: 'right' });
    }

    var typeNames = { complete: 'Completo', ultrasounds: 'Ultrassons', appointments: 'Consultas', evolution: 'Evolução' };
    doc.save('Relatório_' + typeNames[type] + '_' + cfg.babyName.replace(/\s/g, '_') + '.pdf');
}

// ============ CONFIG ============
function saveConfig() {
    appData.config.babyName = document.getElementById('cfgBabyName').value;
    appData.config.babySex = document.getElementById('cfgBabySex').value;
    appData.config.dum = document.getElementById('cfgDUM').value;
    appData.config.dpp = document.getElementById('cfgDPP').value;
    appData.config.momName = document.getElementById('cfgMomName').value;
    appData.config.doctor = document.getElementById('cfgDoctor').value;
    appData.config.preWeight = document.getElementById('cfgPreWeight').value;
    appData.config.height = document.getElementById('cfgHeight').value;
    // Salvar API key separadamente (nao vai pro Firebase por seguranca)
    var geminiKeyEl = document.getElementById('cfgGeminiKey');
    if (geminiKeyEl && geminiKeyEl.value.trim()) {
        localStorage.setItem('hadassa_gemini_key', geminiKeyEl.value.trim());
        _geminiApiKey = geminiKeyEl.value.trim();
    }

    appData.config.dateBase = document.getElementById('cfgDateBase').value;
    appData.config.firstUSDate = document.getElementById('cfgFirstUSDate').value;
    appData.config.firstUSWeeks = document.getElementById('cfgFirstUSWeeks').value;
    appData.config.firstUSDays = document.getElementById('cfgFirstUSDays').value || '0';

    // DUM e DPP NUNCA são sobrescritos automaticamente.
    // O usuário tem controle total sobre essas datas.
    // A base do cálculo (DUM ou US) afeta apenas como a idade gestacional é exibida.

    saveData(appData);
    updateWeekBanner();
    applyThemeBySex();
}

function loadConfig() {
    document.getElementById('cfgBabyName').value = appData.config.babyName || '';
    document.getElementById('cfgBabySex').value = appData.config.babySex || 'Menina';
    document.getElementById('cfgDUM').value = appData.config.dum || '';
    document.getElementById('cfgDPP').value = appData.config.dpp || '';
    document.getElementById('cfgMomName').value = appData.config.momName || '';
    document.getElementById('cfgDoctor').value = appData.config.doctor || '';
    document.getElementById('cfgPreWeight').value = appData.config.preWeight || '';
    document.getElementById('cfgHeight').value = appData.config.height || '';

    // Gemini API key
    var geminiKeyEl = document.getElementById('cfgGeminiKey');
    if (geminiKeyEl) {
        geminiKeyEl.value = localStorage.getItem('hadassa_gemini_key') || '';
        if (!_geminiApiKey) _geminiApiKey = localStorage.getItem('hadassa_gemini_key') || '';
    }

    // Date base fields
    var dateBaseEl = document.getElementById('cfgDateBase');
    if (dateBaseEl) {
        dateBaseEl.value = appData.config.dateBase || 'dum';
        var showUS = dateBaseEl.value === 'us';
        document.getElementById('cfgFirstUSGroup').style.display = showUS ? 'block' : 'none';
        document.getElementById('cfgFirstUSWeeksGroup').style.display = showUS ? 'block' : 'none';
    }
    var firstUSDateEl = document.getElementById('cfgFirstUSDate');
    if (firstUSDateEl) firstUSDateEl.value = appData.config.firstUSDate || '';
    var firstUSWeeksEl = document.getElementById('cfgFirstUSWeeks');
    if (firstUSWeeksEl) firstUSWeeksEl.value = appData.config.firstUSWeeks || '';
    var firstUSDaysEl = document.getElementById('cfgFirstUSDays');
    if (firstUSDaysEl) firstUSDaysEl.value = appData.config.firstUSDays || '';

    // DUM e DPP sempre editáveis - o usuário tem controle total
}

// ============ DATA IMPORT/EXPORT ============
function exportData() {
    var json = JSON.stringify(appData, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'gravidez_' + appData.config.babyName.replace(/\s/g, '_') + '_backup.json';
    a.click();
    URL.revokeObjectURL(url);
    localStorage.setItem('hadassa_last_backup', Date.now().toString());
}

function checkBackupReminder() {
    // Backup automático já é feito via IndexedDB e Firebase
    // Não incomodar o usuário com popups
}

function importData(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var imported = JSON.parse(e.target.result);

            if (!imported.config || typeof imported.config !== 'object') throw new Error('Campo "config" ausente ou inválido.');
            if (!Array.isArray(imported.ultrasounds)) throw new Error('Campo "ultrasounds" ausente ou inválido.');
            if (!Array.isArray(imported.appointments)) throw new Error('Campo "appointments" ausente ou inválido.');
            if (!Array.isArray(imported.notes)) throw new Error('Campo "notes" ausente ou inválido.');

            var allowedConfigKeys = ['babyName', 'babySex', 'dum', 'dpp', 'momName', 'doctor', 'preWeight', 'height', 'dateBase', 'firstUSDate', 'firstUSWeeks', 'firstUSDays'];
            Object.keys(imported.config).forEach(function(key) {
                if (!allowedConfigKeys.includes(key)) throw new Error('Campo desconhecido em config: ' + key);
                if (typeof imported.config[key] !== 'string') throw new Error('config.' + key + ' deve ser string.');
                if (imported.config[key].length > 200) throw new Error('config.' + key + ' excede tamanho máximo.');
            });

            // AUDIT V1.2 [V12-SEC-003]: photo adicionado a whitelist + validacao de formato
            var allowedUSKeys = ['id','date','title','weeks','days','heartbeat','weight','femur','ccn','dbp','ca','cervix','placenta','ila','obs','photo'];
            imported.ultrasounds.forEach(function(us) {
                if (typeof us !== 'object' || us === null) throw new Error('Ultrassom inválido.');
                Object.keys(us).forEach(function(key) {
                    if (!allowedUSKeys.includes(key)) throw new Error('Campo desconhecido em ultrassom: ' + key);
                });
                if (!us.id || !us.date) throw new Error('Ultrassom sem id ou data.');
                // AUDIT V1.2 [V12-SEC-006]: Validar formato de data
                if (!/^\d{4}-\d{2}-\d{2}$/.test(us.date)) throw new Error('Data de ultrassom inválida: ' + String(us.date).substring(0, 20));
                if (us.title && us.title.length > 500) throw new Error('Título de ultrassom excede tamanho máximo.');
                if (us.obs && us.obs.length > 2000) throw new Error('Observação de ultrassom excede tamanho máximo.');
                // Validar foto se presente
                if (us.photo && typeof us.photo === 'string' && us.photo.startsWith('data:')) {
                    if (!/^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(us.photo)) {
                        throw new Error('Foto de ultrassom com formato inválido.');
                    }
                    if (us.photo.length > 5 * 1024 * 1024) {
                        throw new Error('Foto de ultrassom excede 5MB.');
                    }
                }
            });

            var allowedAppKeys = ['id','date','time','type','doctor','location','momWeight','bloodPressure','notes'];
            imported.appointments.forEach(function(a) {
                if (typeof a !== 'object' || a === null) throw new Error('Consulta inválida.');
                Object.keys(a).forEach(function(key) {
                    if (!allowedAppKeys.includes(key)) throw new Error('Campo desconhecido em consulta: ' + key);
                });
                if (!a.id || !a.date) throw new Error('Consulta sem id ou data.');
                if (!/^\d{4}-\d{2}-\d{2}$/.test(a.date)) throw new Error('Data de consulta inválida.');
            });

            var allowedNoteKeys = ['id','date','title','content','type'];
            imported.notes.forEach(function(n) {
                if (typeof n !== 'object' || n === null) throw new Error('Nota inválida.');
                Object.keys(n).forEach(function(key) {
                    if (!allowedNoteKeys.includes(key)) throw new Error('Campo desconhecido em nota: ' + key);
                });
                if (!n.id || !n.date) throw new Error('Nota sem id ou data.');
                if (!/^\d{4}-\d{2}-\d{2}$/.test(n.date)) throw new Error('Data de nota inválida.');
                if (n.content && n.content.length > 5000) throw new Error('Conteúdo de nota excede tamanho máximo.');
            });

            appData = imported;
            saveData(appData);
            loadConfig();
            renderAll();
            alert('Dados importados com sucesso!');
        } catch (err) {
            alert('Erro ao importar: ' + err.message);
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    showCustomConfirm(
        'Apagar TODOS os Dados',
        'TEM CERTEZA? Esta ação não pode ser desfeita! Todos os registros serão perdidos permanentemente.',
        '\u{26A0}\u{FE0F}'
    ).then(function(confirmed) {
        if (!confirmed) return;
        return showCustomConfirm('Última Chance', 'Confirma que deseja apagar TUDO?', '\u{1F6A8}');
    }).then(function(confirmed) {
        if (!confirmed) return;

        // PASSO 1: Marcar que dados foram limpos intencionalmente
        localStorage.setItem('hadassa_data_cleared', 'true');
        // Impedir que sample data seja reinserido
        localStorage.setItem('hadassa_sample_loaded', 'true');

        // PASSO 2: Limpar Firebase PRIMEIRO (antes de limpar local)
        try {
            var fbUser = window._firebaseUser ? window._firebaseUser() : null;
            var fbDB = window._firebaseDB;
            if (fbUser && fbDB) {
                fbDB.ref('users/' + fbUser.uid + '/data').remove();
                console.log('Firebase data removed');
            }
        } catch(e) { console.error('Firebase clear error:', e); }

        // PASSO 3: Limpar TUDO do localStorage (exceto flags de controle)
        var keysToKeep = ['hadassa_sample_loaded', 'hadassa_data_cleared', 'hadassa_theme', 'hadassa_onboarding_done', 'hadassa_disclaimer_shown'];
        var keysToRemove = [];
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (key && (key.startsWith('hadassa') || key === STORAGE_KEY) && keysToKeep.indexOf(key) === -1) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(function(key) { localStorage.removeItem(key); });
        localStorage.removeItem(STORAGE_KEY);

        // PASSO 4: Limpar IndexedDB
        try {
            indexedDB.deleteDatabase(BACKUP_DB);
            indexedDB.deleteDatabase(PHOTO_DB_NAME);
        } catch(e) {}

        // PASSO 5: Resetar appData com dados vazios
        appData = getDefaultData();
        // Salvar dados vazios no localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));

        // PASSO 6: Atualizar tela
        loadConfig();
        renderAll();
        showToast('Todos os dados foram apagados!');

        // PASSO 7: Recarregar página após 1s para garantir limpeza total
        setTimeout(function() { location.reload(); }, 1500);
    });
}

// ============ FAB BUTTON ============
function handleFab() {
    var activeSection = document.querySelector('.section.active');
    if (!activeSection) return;
    var id = activeSection.id;
    if (id === 'sec-ultrasounds') openModal('usModal');
    else if (id === 'sec-appointments') openModal('appointModal');
    else if (id === 'sec-notes') openModal('noteModal');
    else openModal('usModal');
}

// ============ RENDER ============
// AUDIT V1.2 [V12-PERF-001]: renderAll() apenas para init. Operacoes usam renderAfterChange().
function renderAll() {
    updateWeekBanner();
    renderWeekCalendar();
    renderDashboard();
    renderUltrasounds();
    renderAppointments();
    renderNotes();
}

function renderAfterChange(changedEntity) {
    updateWeekBanner();
    renderDashboard();
    switch (changedEntity) {
        case 'ultrasound': renderUltrasounds(); break;
        case 'appointment': renderAppointments(); break;
        case 'note': renderNotes(); break;
    }
}

// ============ LOAD SAMPLE DATA ============
function loadSampleData() {
    // App comercial: sem dados de exemplo, onboarding guia a configuração
    if (localStorage.getItem('hadassa_sample_loaded') === 'true') return;
    localStorage.setItem('hadassa_sample_loaded', 'true');
}

// ============ AI ASSISTANT ============
// API key carregada do .env local.
// NOTA: Para deploy publico, usar proxy backend (Cloudflare Worker / Vercel Edge Function).
// Em uso local/pessoal, o .env e seguro o suficiente pois so voce acessa.
var GEMINI_MODEL = 'gemini-3.1-pro-preview';
var _geminiApiKey = '';

function loadApiKeyFromEnv() {
    // Primeiro verificar se tem chave no localStorage
    var savedKey = localStorage.getItem('hadassa_gemini_key');
    if (savedKey) { _geminiApiKey = savedKey; return Promise.resolve(); }

    // Só tenta carregar .env em localhost
    if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        return Promise.resolve();
    }
    return fetch('./.env').then(function(res) {
        if (!res.ok) return;
        return res.text();
    }).then(function(text) {
        if (!text) return;
        var match = text.match(/GEMINI_API_KEY=(.+)/);
        if (match && match[1].trim()) {
            _geminiApiKey = match[1].trim();
            Logger.info('API key carregada do .env');
        }
    }).catch(function(e) {
        Logger.warn('Não foi possível carregar .env:', e.message);
    });
}

function getGeminiApiKey() {
    return _geminiApiKey || '';
}

var GEMINI_PROXY_URL = 'https://gemini-proxy.anajmfreire.workers.dev';

function getGeminiUrl() {
    // Em producao usa o proxy (chave segura no servidor)
    if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        return GEMINI_PROXY_URL;
    }
    // Em localhost usa direto com chave local
    var key = getGeminiApiKey();
    return 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent?key=' + key;
}

var lastAICallTime = 0;
var AI_RATE_LIMIT_MS = 3000;
var aiChatHistory = [];

function toggleAI() {
    var panel = document.getElementById('aiPanel');
    var overlay = document.getElementById('aiOverlay');
    var isOpen = panel.classList.contains('active');
    panel.classList.toggle('active');
    overlay.classList.toggle('active');
    if (!isOpen) document.getElementById('aiInput').focus();
}

function getPregnancyContext() {
    var cfg = appData.config;
    var uss = getAllUSData();
    var apps = appData.appointments;
    var notes = appData.notes;

    var ctx = 'CONTEXTO DA GRAVIDEZ:\n';
    ctx += '- Nome do bebe: ' + cfg.babyName + ' (' + cfg.babySex + ')\n';
    ctx += '- Mae: ' + cfg.momName + '\n';
    ctx += '- Médico(a): ' + (cfg.doctor || 'Nao informado') + '\n';

    var infoCtx = calcCurrentGestationalAge();
    if (infoCtx) {
        ctx += '- Idade gestacional atual: ' + infoCtx.weeks + ' semanas e ' + infoCtx.days + ' dias\n';
        ctx += '- DUM: ' + formatDate(cfg.dum) + '\n';
    }
    if (cfg.dpp) ctx += '- DPP: ' + formatDate(cfg.dpp) + '\n';

    if (uss.length > 0) {
        ctx += '\nHISTORICO DE ULTRASSONS (' + uss.length + ' registros):\n';
        uss.forEach(function(us, i) {
            ctx += '\n  Exame ' + (i+1) + ': "' + us.title + '" em ' + formatDate(us.date);
            ctx += '\n    Idade: ' + (us.weeks || '?') + 's' + (us.days || 0) + 'd';
            if (us.heartbeat) ctx += ' | Batimentos: ' + us.heartbeat + ' bpm';
            if (us.weight) ctx += ' | Peso: ' + us.weight + 'g';
            if (us.femur) ctx += ' | Femur: ' + us.femur + 'mm';
            if (us.ccn) ctx += ' | CCN: ' + us.ccn + 'mm';
            if (us.dbp) ctx += ' | DBP: ' + us.dbp + 'mm';
            if (us.ca) ctx += ' | CA: ' + us.ca + 'mm';
            if (us.cervix) ctx += ' | Colo: ' + us.cervix + 'mm';
            if (us.placenta) ctx += ' | Placenta: ' + us.placenta;
            if (us.ila) ctx += ' | ILA: ' + us.ila;
            if (us.obs) ctx += '\n    Obs: ' + us.obs;
        });

        if (uss.length >= 2) {
            var last = uss[uss.length - 1];
            var prev = uss[uss.length - 2];
            ctx += '\n\nEVOLUCAO RECENTE (' + formatDate(prev.date) + ' -> ' + formatDate(last.date) + '):';
            if (prev.heartbeat && last.heartbeat) ctx += '\n  Batimentos: ' + prev.heartbeat + ' -> ' + last.heartbeat + ' bpm';
            if (prev.weight && last.weight) ctx += '\n  Peso: ' + prev.weight + 'g -> ' + last.weight + 'g (+' + (last.weight - prev.weight).toFixed(0) + 'g)';
            if (prev.femur && last.femur) ctx += '\n  Femur: ' + prev.femur + 'mm -> ' + last.femur + 'mm (+' + (last.femur - prev.femur).toFixed(1) + 'mm)';
            if (prev.ccn && last.ccn) ctx += '\n  CCN: ' + prev.ccn + 'mm -> ' + last.ccn + 'mm (+' + (last.ccn - prev.ccn).toFixed(1) + 'mm)';
        }
    }

    if (apps.length > 0) {
        var today = toLocalDateStr(new Date());
        var upcoming = apps.filter(function(a) { return a.date >= today; });
        if (upcoming.length > 0) {
            ctx += '\n\nPROXIMAS CONSULTAS:';
            upcoming.slice(0, 3).forEach(function(a) {
                ctx += '\n  - ' + a.type + ' em ' + formatDate(a.date) + ' ' + (a.time || '') + (a.doctor ? ' | Dr(a). ' + a.doctor : '');
            });
        }
    }

    if (notes.length > 0) {
        var recentNotes = notes.slice(-3);
        ctx += '\n\nANOTACOES RECENTES:';
        recentNotes.forEach(function(n) {
            ctx += '\n  [' + n.type + '] ' + n.title + ': ' + n.content.substring(0, 100);
        });
    }

    return ctx;
}

function getSystemPrompt() {
    return 'Você é a assistente IA de gravidez da ' + (appData.config.momName || 'mamãe') + ', integrada ao app "Minha Gestação".\n\n' +
        'REGRAS IMPORTANTES:\n' +
        '- Responda SEMPRE em português brasileiro, de forma acolhedora, carinhosa e profissional\n' +
        '- Use emojis com moderação para deixar as respostas mais fofas\n' +
        '- NUNCA substitua uma consulta médica real. Sempre reforce que a gestante deve consultar seu médico\n' +
        '- Quando analisar dados, compare com valores de referência e explique de forma simples\n' +
        '- Seja específica ao analisar os dados reais da gestação fornecidos no contexto\n' +
        '- Mantenha respostas concisas mas completas (ideal: 150-300 palavras)\n' +
        '- Quando der dicas, personalize baseado na semana gestacional atual\n' +
        '- Se não souber algo com certeza, diga que não sabe e recomende perguntar ao médico\n\n' +
        getPregnancyContext();
}

function aiQuickAction(type) {
    var prompts = {
        'dicas': 'Quais são as dicas mais importantes para a minha semana gestacional atual? O que está acontecendo com o desenvolvimento do bebê e o que devo prestar atenção?',
        'analise': 'Analise os dados dos meus ultrassons registrados. Como está o crescimento e desenvolvimento do bebê? Os valores estão dentro da normalidade? Faça um comparativo entre os exames.',
        'sintomas': 'Quais sintomas são normais para a minha fase da gravidez? O que devo monitorar e quando devo procurar o médico?',
        'alimentacao': 'Quais alimentos são recomendados para minha fase da gestação? O que devo evitar? Me dê sugestões de refeições e lanches saudáveis.',
        'exercicios': 'Quais exercícios são seguros e recomendados para minha semana gestacional? Como posso me manter ativa de forma segura?',
        'exames': 'Com base nos meus ultrassons registrados, me ajude a entender os valores. O que significam CCN, DBP, CA, fêmur? Meus valores estão normais?',
        'enxoval': 'Baseado na minha semana gestacional, o que devo já ir preparando para o enxoval da ' + appData.config.babyName + '? Me dê uma lista organizada por prioridade.',
        'emocional': 'Me dê dicas de bem-estar emocional para esta fase da gravidez. Como lidar com ansiedade, sono e mudanças de humor?'
    };

    var msg = prompts[type] || 'Me conte mais sobre minha gravidez.';
    document.getElementById('aiInput').value = msg;
    sendAIMessage();
}

function addAIMessage(role, content) {
    var container = document.getElementById('aiMessages');
    var welcome = container.querySelector('.ai-welcome');
    if (welcome) welcome.remove();

    var div = document.createElement('div');
    div.className = 'ai-msg ' + role;

    if (role === 'assistant') {
        div.innerHTML = '<div class="msg-header"><i class="fas fa-robot"></i> Assistente IA</div>' + formatAIResponse(content);
    } else {
        div.textContent = content;
    }

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function formatAIResponse(text) {
    var safe = escapeHtml(text);
    return safe
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^### (.*$)/gm, '<strong style="color:#7c3aed;font-size:1.05em">$1</strong>')
        .replace(/^## (.*$)/gm, '<strong style="color:#7c3aed;font-size:1.1em">$1</strong>')
        .replace(/^# (.*$)/gm, '<strong style="color:#7c3aed;font-size:1.15em">$1</strong>')
        .replace(/^[\u2022\-] (.*$)/gm, '  \u2022 $1');
}

function showTyping() {
    var container = document.getElementById('aiMessages');
    var div = document.createElement('div');
    div.className = 'ai-msg typing';
    div.id = 'aiTyping';
    div.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function removeTyping() {
    var el = document.getElementById('aiTyping');
    if (el) el.remove();
}

function sendAIMessage() {
    var input = document.getElementById('aiInput');
    var sendBtn = document.getElementById('aiSendBtn');
    var msg = input.value.trim();
    if (!msg) return;

    var now = Date.now();
    if (now - lastAICallTime < AI_RATE_LIMIT_MS) {
        addAIMessage('assistant', 'Aguarde alguns segundos antes de enviar outra mensagem.');
        return;
    }
    lastAICallTime = now;

    // Em localhost verifica .env, em producao usa proxy
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        if (!getGeminiApiKey()) {
            addAIMessage('assistant', 'Chave da API não encontrada. Verifique o arquivo .env');
            return;
        }
    }

    input.value = '';
    sendBtn.disabled = true;
    addAIMessage('user', msg);
    showTyping();

    aiChatHistory.push({ role: 'user', parts: [{ text: msg }] });

    var body = {
        system_instruction: { parts: [{ text: getSystemPrompt() }] },
        contents: aiChatHistory,
        generationConfig: { temperature: 0.7, topP: 0.9, topK: 40, maxOutputTokens: 2048 },
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
    };

    // Adicionar modelo ao body para o proxy saber qual usar
    body.model = GEMINI_MODEL;

    fetch(getGeminiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    }).then(function(response) {
        removeTyping();
        if (!response.ok) {
            return response.json().catch(function() { return {}; }).then(function(errData) {
                var errMsg = (errData.error && errData.error.message) || ('Erro ' + response.status);
                throw new Error(errMsg);
            });
        }
        return response.json();
    }).then(function(data) {
        var aiReply = (data.candidates && data.candidates[0] && data.candidates[0].content &&
            data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
            data.candidates[0].content.parts[0].text)
            || 'Desculpe, não consegui gerar uma resposta. Tente novamente!';

        aiChatHistory.push({ role: 'model', parts: [{ text: aiReply }] });

        if (aiChatHistory.length > AI_CHAT_HISTORY_LIMIT) {
            aiChatHistory = aiChatHistory.slice(-AI_CHAT_HISTORY_LIMIT);
        }

        addAIMessage('assistant', aiReply);
        sendBtn.disabled = false;
        input.focus();
    }).catch(function(error) {
        removeTyping();
        addAIMessage('assistant', 'Ops! Ocorreu um erro ao conectar com a IA:\n\n' + error.message + '\n\nVerifique sua conexão com a internet e tente novamente.');
        aiChatHistory.pop();
        sendBtn.disabled = false;
        input.focus();
    });
}

// ============ INIT ============
// Inicializacao
(async function initApp() {
    // Carregar API key do .env
    await loadApiKeyFromEnv();

    // Carregar dados
    appData = loadData();

    loadSampleData();
    loadConfig();
    applyThemeBySex();
    renderAll();

    // Hide splash screen
    var splash = document.getElementById('splashScreen');
    if (splash) {
        var splashName = document.getElementById('splashName');
        if (splashName) {
            splashName.textContent = appData.config.babyName ? 'A Jornada de ' + appData.config.babyName : 'Minha Gestação';
        }
        setTimeout(function() {
            splash.style.opacity = '0';
            setTimeout(function() { splash.style.display = 'none'; }, 500);
        }, 1200);
    }

    // Auto backup a cada 5 minutos
    setInterval(autoBackup, 5 * 60 * 1000);
    checkBackupReminder();
    handleHashChange();

    // Disclaimer no primeiro uso
    if (!localStorage.getItem('hadassa_disclaimer_shown')) {
        setTimeout(function() {
            alert('AVISO IMPORTANTE\n\nEste aplicativo é apenas para acompanhamento pessoal da gravidez e NÃO substitui consultas médicas profissionais.\n\nSempre consulte seu obstetra para decisões sobre sua saúde e a do seu bebê.\n\nO assistente de IA pode conter imprecisões e não deve ser usado como fonte única de informação médica.');
            localStorage.setItem('hadassa_disclaimer_shown', 'true');
        }, 1000);
    }

    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(function() {});
    }

    // ============ EVENT LISTENERS ============

    // Bottom navigation
    document.querySelectorAll('.bottom-nav-btn').forEach(function(btn) {
        btn.addEventListener('click', function() { location.hash = btn.dataset.section; });
    });

    // Dashboard menu grid
    document.querySelectorAll('.menu-card[data-goto]').forEach(function(card) {
        card.addEventListener('click', function() { location.hash = card.dataset.goto; });
    });

    // Old nav compatibility
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
        if (btn.dataset.section) btn.addEventListener('click', function() { location.hash = btn.dataset.section; });
    });

    window.addEventListener('hashchange', handleHashChange);

    // Header hide on scroll
    var lastScrollY = 0;
    window.addEventListener('scroll', function() {
        var header = document.querySelector('.header');
        if (!header) return;
        var currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        lastScrollY = currentScrollY;
    });

    // Sub tabs - charts
    document.querySelectorAll('.sub-tab[data-chart]').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.sub-tab[data-chart]').forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            updateChart(tab.dataset.chart);
        });
    });

    // Sub tabs - notes
    document.querySelectorAll('.sub-tab[data-notetype]').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.sub-tab[data-notetype]').forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            renderNotes(tab.dataset.notetype);
        });
    });

    // Forms - AUDIT V1.2 [V12-SEC-005]: addEventListener ao inves de onsubmit inline
    document.getElementById('usForm').addEventListener('submit', saveUltrasound);
    // Toggle medidas colapsável no form de US
    document.getElementById('usToggleMedidas').addEventListener('click', function() {
        var section = document.getElementById('usMedidasSection');
        var icon = document.getElementById('usMedidasIcon');
        if (section.style.display === 'none') {
            section.style.display = 'block';
            icon.className = 'fas fa-chevron-up';
        } else {
            section.style.display = 'none';
            icon.className = 'fas fa-chevron-down';
        }
    });
    document.getElementById('appointForm').addEventListener('submit', saveAppointment);
    document.getElementById('noteForm').addEventListener('submit', saveNote);

    // Modal buttons
    document.getElementById('btnNewUS').addEventListener('click', function() { openModal('usModal'); });
    document.getElementById('btnNewAppoint').addEventListener('click', function() { openModal('appointModal'); });
    document.getElementById('btnNewNote').addEventListener('click', function() { openModal('noteModal'); });

    // Close modal buttons
    document.querySelectorAll('[data-close]').forEach(function(btn) {
        btn.addEventListener('click', function() { closeModal(btn.dataset.close); });
    });

    // Close modal on overlay click
    document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal(overlay.id);
        });
    });

    // PDF buttons
    document.querySelectorAll('[data-pdf]').forEach(function(btn) {
        btn.addEventListener('click', function() { generatePDF(btn.dataset.pdf); });
    });

    // UX-015 + FEAT-012: Print summary and CSV export
    document.getElementById('btnPrintSummary').addEventListener('click', printSummary);
    document.getElementById('btnExportCSV').addEventListener('click', exportCSV);

    // Data management
    document.getElementById('btnExport').addEventListener('click', exportData);
    document.getElementById('btnImportTrigger').addEventListener('click', function() { document.getElementById('importFile').click(); });
    document.getElementById('importFile').addEventListener('change', importData);
    document.getElementById('btnClearAll').addEventListener('click', clearAllData);

    // FAB
    document.getElementById('fabBtn').addEventListener('click', handleFab);

    // AI
    document.getElementById('aiFab').addEventListener('click', toggleAI);
    document.getElementById('aiOverlay').addEventListener('click', toggleAI);
    document.getElementById('aiCloseBtn').addEventListener('click', toggleAI);
    document.getElementById('aiSendBtn').addEventListener('click', sendAIMessage);
    document.getElementById('aiInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') sendAIMessage();
    });

    document.querySelectorAll('[data-ai]').forEach(function(btn) {
        btn.addEventListener('click', function() { aiQuickAction(btn.dataset.ai); });
    });

    // UX-012: Custom confirm modal buttons
    document.getElementById('confirmOkBtn').addEventListener('click', function() {
        document.getElementById('customConfirmModal').classList.remove('active');
        if (_confirmResolve) { _confirmResolve(true); _confirmResolve = null; }
    });
    document.getElementById('confirmCancelBtn').addEventListener('click', function() {
        document.getElementById('customConfirmModal').classList.remove('active');
        if (_confirmResolve) { _confirmResolve(false); _confirmResolve = null; }
    });

    // Dark mode
    var savedTheme = localStorage.getItem('hadassa_theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark-mode');
        document.getElementById('themeIcon').className = 'fas fa-sun';
    }
    document.getElementById('themeToggle').addEventListener('click', function() {
        document.documentElement.classList.toggle('dark-mode');
        var isDark = document.documentElement.classList.contains('dark-mode');
        document.getElementById('themeIcon').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        localStorage.setItem('hadassa_theme', isDark ? 'dark' : 'light');
    });

    // Photo upload with compression
    document.getElementById('usPhoto').addEventListener('change', function(e) {
        var file = e.target.files[0];
        var preview = document.getElementById('usPhotoPreview');
        if (!file) { preview.innerHTML = ''; preview.dataset.photoId = ''; return; }
        if (file.size > 5 * 1024 * 1024) {
            alert('Imagem muito grande (máximo 5MB).');
            e.target.value = '';
            return;
        }
        var reader = new FileReader();
        reader.onload = function(ev) {
            // Comprimir imagem antes de salvar
            compressImage(ev.target.result).then(function(compressed) {
                var photoId = genId();
                return savePhoto(photoId, compressed).then(function() {
                    preview.dataset.photoId = photoId;
                    renderPhoto(preview, compressed);
                });
            }).catch(function(err) {
                Logger.error('Erro ao processar foto:', err);
                // Fallback: usar original se compressao falhar
                var photoId = genId();
                preview.dataset.photoId = photoId;
                savePhoto(photoId, ev.target.result).catch(function() {});
                renderPhoto(preview, ev.target.result);
            });
        };
        reader.readAsDataURL(file);
    });

    // FEAT-007: Share card button
    document.getElementById('btnShareCard').addEventListener('click', shareCard);

    // FEAT-010: Gallery
    document.getElementById('btnGallery').addEventListener('click', openGallery);
    document.getElementById('photoViewerClose').addEventListener('click', function() {
        document.getElementById('photoViewer').style.display = 'none';
    });
    document.getElementById('photoViewer').addEventListener('click', function(e) {
        if (e.target === document.getElementById('photoViewer')) {
            document.getElementById('photoViewer').style.display = 'none';
        }
    });

    // UX-020: Metric help popovers (delegated)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('metric-help-btn')) {
            var metric = e.target.dataset.metric;
            if (metricHelp[metric]) {
                showCustomAlert('Informação', metricHelp[metric].replace(/<[^>]+>/g, '\n').replace(/\n+/g, '\n'), '\u{2139}\u{FE0F}');
            }
        }
    });

    // Search ultrasounds
    document.getElementById('usSearchInput').addEventListener('input', function() { renderUltrasounds(); });

    // Config inputs
    ['cfgBabyName', 'cfgBabySex', 'cfgDUM', 'cfgDPP', 'cfgMomName', 'cfgDoctor', 'cfgPreWeight', 'cfgHeight', 'cfgDateBase', 'cfgFirstUSDate', 'cfgFirstUSWeeks', 'cfgFirstUSDays'].forEach(function(id) {
        document.getElementById(id).addEventListener('change', saveConfig);
    });

    // FEAT-001: Onboarding (replaces alert disclaimer)
    if (!localStorage.getItem('hadassa_onboarding_done') && !localStorage.getItem('hadassa_disclaimer_shown')) {
        showOnboarding();
    }

    // UX-014: Swipe navigation
    initSwipeNavigation();

    // FEAT-009: Schedule appointment notifications
    requestNotificationPermission();
    scheduleAppointmentReminders();

})();
