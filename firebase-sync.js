// ================================================================
// FIREBASE-SYNC.JS - Sincronização em tempo real com Firebase
// ================================================================

// Firebase config
var firebaseConfig = {
    apiKey: "AIzaSyAlMmkKtN414ysINl99oWce121XG11dFnk",
    authDomain: "jornada-hadassa-meira.firebaseapp.com",
    databaseURL: "https://jornada-hadassa-meira-default-rtdb.firebaseio.com",
    projectId: "jornada-hadassa-meira",
    storageBucket: "jornada-hadassa-meira.firebasestorage.app",
    messagingSenderId: "277029078418",
    appId: "1:277029078418:web:c4a2e965434273b06ced4b"
};

// Initialize Firebase
var auth, db;
try {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.database();
} catch(e) {
    console.error('Firebase init error:', e);
}

var currentUser = null;
var syncEnabled = false;
var isSyncing = false;

// ============ AUTH ============
function loginWithGoogle() {
    var provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(function(error) {
        Logger.error('Login error:', error.message);
        // Fallback to redirect for mobile
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
            auth.signInWithRedirect(provider);
        } else {
            showToast('Erro ao fazer login: ' + error.message, 5000);
        }
    });
}

function logout() {
    auth.signOut().then(function() {
        currentUser = null;
        syncEnabled = false;
        updateSyncUI();
        showToast('Desconectado!');
    });
}

// Listen for auth state changes
if (!auth) { console.error('Firebase auth not available'); }
auth && auth.onAuthStateChanged(function(user) {
    currentUser = user;
    if (user) {
        syncEnabled = true;
        updateSyncUI();
        // Initial sync: download from cloud
        syncFromCloud();
        // Listen for realtime changes
        listenForCloudChanges();
        Logger.info('Logged in as:', user.displayName);
    } else {
        syncEnabled = false;
        updateSyncUI();
    }
});

// ============ SYNC UI ============
function updateSyncUI() {
    var loginPrompt = document.getElementById('loginPrompt');
    var syncBar = document.getElementById('syncBar');

    if (currentUser) {
        if (loginPrompt) loginPrompt.style.display = 'none';
        if (syncBar) {
            syncBar.style.display = 'block';
            var photo = document.getElementById('syncUserPhoto');
            var name = document.getElementById('syncUserName');
            var status = document.getElementById('syncStatus');
            if (photo && currentUser.photoURL) {
                photo.src = currentUser.photoURL;
                photo.style.display = 'block';
            }
            if (name) name.textContent = currentUser.displayName || currentUser.email;
            if (status) status.textContent = 'Sincronizado ✓';
        }
    } else {
        if (loginPrompt) loginPrompt.style.display = 'block';
        if (syncBar) syncBar.style.display = 'none';
    }
}

function setSyncStatus(text) {
    var status = document.getElementById('syncStatus');
    if (status) status.textContent = text;
}

function toggleSyncPanel() {
    if (!currentUser) return;
    showCustomConfirm(
        'Sincronização',
        'Seus dados estão sincronizados com a nuvem.\n\nDeseja sair da conta?',
        '☁️'
    ).then(function(ok) {
        if (ok) logout();
    });
}

// ============ SYNC TO CLOUD ============
function syncToCloud() {
    if (!currentUser || !syncEnabled || isSyncing) return;
    isSyncing = true;
    setSyncStatus('Salvando na nuvem...');

    var syncData = {
        appData: appData,
        extras: {},
        lastSync: new Date().toISOString(),
        deviceName: navigator.userAgent.indexOf('Mobile') > -1 ? 'Celular' : 'Computador'
    };

    // Collect all localStorage extras
    var extraKeys = [
        'hadassa_diary', 'hadassa_symptoms', 'hadassa_exams', 'hadassa_baby_names',
        'hadassa_kick_history', 'hadassa_contractions', 'hadassa_exam_checklist',
        'hadassa_bp_log', 'hadassa_bf_history', 'hadassa_custom_symptoms',
        'hadassa_list_enxoval', 'hadassa_list_malaMae', 'hadassa_list_malaBebe',
        'hadassa_list_doctorQuestions', 'hadassa_list_birthPlan',
        'hadassa_weekly_todos', 'hadassa_letter_to_baby', 'hadassa_hydration',
        'hadassa_sample_loaded', 'hadassa_onboarding_done', 'hadassa_disclaimer_shown',
        'hadassa_theme', 'hadassa_last_backup', 'hadassa_motivation_date'
    ];

    extraKeys.forEach(function(key) {
        var val = localStorage.getItem(key);
        if (val) syncData.extras[key] = val;
    });

    db.ref('users/' + currentUser.uid + '/data').set(syncData).then(function() {
        setSyncStatus('Sincronizado ✓ ' + new Date().toLocaleTimeString());
        isSyncing = false;
        Logger.debug('Sync to cloud OK');
    }).catch(function(error) {
        setSyncStatus('Erro ao sincronizar');
        isSyncing = false;
        Logger.error('Sync error:', error);
    });
}

// ============ SYNC FROM CLOUD ============
function syncFromCloud() {
    if (!currentUser) return;
    setSyncStatus('Baixando dados...');

    db.ref('users/' + currentUser.uid + '/data').once('value').then(function(snapshot) {
        var cloudData = snapshot.val();
        if (!cloudData || !cloudData.appData) {
            // No data in cloud — upload local data
            setSyncStatus('Enviando dados para a nuvem...');
            syncToCloud();
            return;
        }

        // Compare timestamps
        var localTimestamp = localStorage.getItem('hadassa_last_sync') || '0';
        var cloudTimestamp = cloudData.lastSync || '0';

        if (cloudTimestamp > localTimestamp) {
            // Cloud is newer — download
            appData = cloudData.appData;
            saveData(appData);

            // Restore extras
            if (cloudData.extras) {
                Object.keys(cloudData.extras).forEach(function(key) {
                    localStorage.setItem(key, cloudData.extras[key]);
                });
            }

            localStorage.setItem('hadassa_last_sync', cloudData.lastSync);
            loadConfig();
            applyThemeBySex();
            renderAll();
            setSyncStatus('Sincronizado ✓ (dados da nuvem)');
            Logger.info('Downloaded data from cloud');
        } else {
            // Local is newer or same — upload
            syncToCloud();
        }
    }).catch(function(error) {
        setSyncStatus('Erro ao baixar dados');
        Logger.error('Download error:', error);
    });
}

// ============ REALTIME LISTENER ============
function listenForCloudChanges() {
    if (!currentUser) return;

    db.ref('users/' + currentUser.uid + '/data/lastSync').on('value', function(snapshot) {
        var cloudSync = snapshot.val();
        var localSync = localStorage.getItem('hadassa_last_sync') || '0';

        if (cloudSync && cloudSync > localSync && !isSyncing) {
            // Another device updated — pull changes
            Logger.info('Detected cloud update, syncing...');
            syncFromCloud();
        }
    });
}

// ============ OVERRIDE SAVE TO AUTO-SYNC ============
var _originalSaveData = saveData;
saveData = function(data) {
    _originalSaveData(data);
    // Sync to cloud after saving locally (debounced)
    if (syncEnabled && currentUser) {
        clearTimeout(saveData._syncTimeout);
        saveData._syncTimeout = setTimeout(syncToCloud, 2000); // Wait 2s to batch saves
    }
};
saveData._syncTimeout = null;

// Sync extras periodically (every 30s if logged in)
setInterval(function() {
    if (syncEnabled && currentUser && !isSyncing) {
        syncToCloud();
    }
}, 30000);

// ============ INIT ============
(function initFirebase() {
    // Wait for DOM and appData
    if (typeof appData === 'undefined' || appData === null) {
        setTimeout(initFirebase, 300);
        return;
    }

    // Login button
    var loginBtn = document.getElementById('btnGoogleLogin');
    if (loginBtn) {
        loginBtn.addEventListener('click', loginWithGoogle);
    }

    // Update UI
    updateSyncUI();

    Logger.info('Firebase sync initialized');
})();
