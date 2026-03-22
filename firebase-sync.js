// ================================================================
// FIREBASE-SYNC.JS - Sincronizacao em tempo real com Firebase
// ================================================================

(function() {
    // Aguardar Firebase SDK carregar
    function waitForFirebase(callback) {
        if (typeof firebase !== 'undefined' && firebase.app) {
            callback();
        } else {
            console.log('Aguardando Firebase SDK...');
            setTimeout(function() { waitForFirebase(callback); }, 500);
        }
    }

    // Aguardar appData estar disponivel
    function waitForApp(callback) {
        if (typeof appData !== 'undefined' && appData !== null && typeof saveData === 'function') {
            callback();
        } else {
            setTimeout(function() { waitForApp(callback); }, 300);
        }
    }

    waitForFirebase(function() {
        waitForApp(function() {
            initializeFirebaseSync();
        });
    });

    function initializeFirebaseSync() {
        console.log('Inicializando Firebase Sync...');

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

        // Initialize Firebase (only once)
        var app, auth, db;
        try {
            if (!firebase.apps.length) {
                app = firebase.initializeApp(firebaseConfig);
            } else {
                app = firebase.apps[0];
            }
            auth = firebase.auth();
            db = firebase.database();
            console.log('Firebase inicializado OK');
        } catch(e) {
            console.error('Firebase init error:', e);
            return;
        }

        var currentUser = null;
        var syncEnabled = false;
        var isSyncing = false;
        var syncTimeout = null;

        // Expose for clearAllData
        window._firebaseDB = db;
        window._firebaseUser = function() { return currentUser; };

        // ============ AUTH ============
        function loginWithGoogle() {
            console.log('Tentando login com Google...');
            var provider = new firebase.auth.GoogleAuthProvider();

            // Tentar popup primeiro, fallback para redirect
            auth.signInWithPopup(provider).then(function(result) {
                console.log('Login OK:', result.user.displayName);
                showToast('Bem-vinda, ' + result.user.displayName + '!');
            }).catch(function(error) {
                console.error('Login popup error:', error.code, error.message);
                if (error.code === 'auth/popup-blocked' ||
                    error.code === 'auth/popup-closed-by-user' ||
                    error.code === 'auth/cancelled-popup-request') {
                    // Fallback to redirect (melhor para mobile)
                    auth.signInWithRedirect(provider);
                } else {
                    showToast('Erro no login: ' + error.message, 5000);
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
                    if (status) status.textContent = 'Sincronizado \u2713';
                }
            } else {
                if (loginPrompt) loginPrompt.style.display = 'block';
                if (syncBar) syncBar.style.display = 'none';
            }
        }

        function setSyncStatus(text) {
            var el = document.getElementById('syncStatus');
            if (el) el.textContent = text;
        }

        // ============ SYNC TO CLOUD ============
        function syncToCloud() {
            if (!currentUser || !syncEnabled || isSyncing || !db) return;

            // PROTEÇÃO CRÍTICA: NUNCA enviar dados vazios para a nuvem
            // Isso evita perda de dados quando o usuário limpa cache do navegador
            var localExams = localStorage.getItem('hadassa_exams');
            var localExamCount = 0;
            try { localExamCount = localExams ? JSON.parse(localExams).length : 0; } catch(e) {}
            var hasLocalData = (appData.ultrasounds && appData.ultrasounds.length > 0) ||
                               (appData.appointments && appData.appointments.length > 0) ||
                               (appData.notes && appData.notes.length > 0) ||
                               localExamCount > 0;
            if (!hasLocalData) {
                // Dados locais estão VAZIOS - verificar se a nuvem tem dados antes de sobrescrever
                db.ref('users/' + currentUser.uid + '/data/appData').once('value').then(function(snap) {
                    var cloudAppData = snap.val();
                    if (cloudAppData && (
                        (cloudAppData.ultrasounds && cloudAppData.ultrasounds.length > 0) ||
                        (cloudAppData.appointments && cloudAppData.appointments.length > 0) ||
                        (cloudAppData.notes && cloudAppData.notes.length > 0)
                    )) {
                        // Nuvem TEM dados, local NÃO - baixar da nuvem em vez de enviar
                        console.warn('PROTEÇÃO: Dados locais vazios, nuvem tem dados. Baixando da nuvem...');
                        setSyncStatus('Recuperando dados...');
                        syncFromCloud();
                    } else {
                        setSyncStatus('Sem dados para sincronizar');
                    }
                });
                return;
            }

            isSyncing = true;
            setSyncStatus('Salvando...');

            var syncData = {
                appData: appData,
                extras: {},
                lastSync: new Date().toISOString(),
                deviceName: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Celular' : 'PC'
            };

            var extraKeys = [
                'hadassa_diary', 'hadassa_symptoms', 'hadassa_exams', 'hadassa_baby_names',
                'hadassa_kick_history', 'hadassa_contractions', 'hadassa_exam_checklist',
                'hadassa_bp_log', 'hadassa_bf_history', 'hadassa_custom_symptoms',
                'hadassa_list_enxoval', 'hadassa_list_malaMae', 'hadassa_list_malaBebe',
                'hadassa_list_doctorQuestions', 'hadassa_list_birthPlan',
                'hadassa_weekly_todos', 'hadassa_letter_to_baby', 'hadassa_hydration',
                'hadassa_sample_loaded', 'hadassa_onboarding_done', 'hadassa_disclaimer_shown',
                'hadassa_theme', 'hadassa_motivation_date', 'hadassa_exam_unchecked'
            ];

            extraKeys.forEach(function(key) {
                var val = localStorage.getItem(key);
                if (val) syncData.extras[key] = val;
            });

            db.ref('users/' + currentUser.uid + '/data').set(syncData).then(function() {
                localStorage.setItem('hadassa_last_sync', syncData.lastSync);
                setSyncStatus('Sincronizado \u2713 ' + new Date().toLocaleTimeString());
                isSyncing = false;
                _justSynced = true;
            }).catch(function(error) {
                setSyncStatus('Erro ao sincronizar');
                isSyncing = false;
                console.error('Sync error:', error);
            });
        }

        // ============ SYNC FROM CLOUD ============
        function syncFromCloud() {
            if (!currentUser || !db) return;
            setSyncStatus('Baixando dados...');

            db.ref('users/' + currentUser.uid + '/data').once('value').then(function(snapshot) {
                var cloudData = snapshot.val();
                if (!cloudData || !cloudData.appData) {
                    setSyncStatus('Enviando dados...');
                    syncToCloud();
                    return;
                }

                var localTimestamp = localStorage.getItem('hadassa_last_sync') || '0';
                var cloudTimestamp = cloudData.lastSync || '0';

                if (cloudTimestamp > localTimestamp) {
                    // Preservar DUM e DPP locais se o usuário as configurou
                    var localDum = appData.config.dum;
                    var localDpp = appData.config.dpp;
                    var localDateBase = appData.config.dateBase;
                    var localFirstUSDate = appData.config.firstUSDate;
                    var localFirstUSWeeks = appData.config.firstUSWeeks;
                    var localFirstUSDays = appData.config.firstUSDays;

                    appData = cloudData.appData;

                    // Garantir arrays obrigatórios existem (dados antigos podem não ter)
                    if (!appData.config) appData.config = {};
                    if (!appData.ultrasounds) appData.ultrasounds = [];
                    if (!appData.appointments) appData.appointments = [];
                    if (!appData.notes) appData.notes = [];

                    // Restaurar configs de data locais (o usuário tem controle total)
                    if (localDum) appData.config.dum = localDum;
                    if (localDpp) appData.config.dpp = localDpp;
                    if (localDateBase) appData.config.dateBase = localDateBase;
                    if (localFirstUSDate) appData.config.firstUSDate = localFirstUSDate;
                    if (localFirstUSWeeks) appData.config.firstUSWeeks = localFirstUSWeeks;
                    if (localFirstUSDays) appData.config.firstUSDays = localFirstUSDays;

                    // Salvar sem trigger sync loop
                    var origSave = window._origSaveData || saveData;
                    try { origSave(appData); } catch(e) {}

                    if (cloudData.extras) {
                        Object.keys(cloudData.extras).forEach(function(key) {
                            localStorage.setItem(key, cloudData.extras[key]);
                        });
                    }

                    localStorage.setItem('hadassa_last_sync', cloudData.lastSync);
                    loadConfig();
                    if (typeof applyThemeBySex === 'function') applyThemeBySex();
                    renderAll();
                    setSyncStatus('Sincronizado \u2713');
                } else {
                    syncToCloud();
                }
            }).catch(function(error) {
                setSyncStatus('Erro');
                console.error('Download error:', error);
            });
        }

        // ============ REALTIME LISTENER ============
        function listenForCloudChanges() {
            if (!currentUser || !db) return;
            db.ref('users/' + currentUser.uid + '/data/lastSync').on('value', function(snapshot) {
                var cloudSync = snapshot.val();
                var localSync = localStorage.getItem('hadassa_last_sync') || '0';
                // Ignorar mudanças vindas de nós mesmos (evita loop de sync)
                if (cloudSync && cloudSync > localSync && !isSyncing && !_justSynced) {
                    syncFromCloud();
                }
                _justSynced = false;
            });
        }
        var _justSynced = false;

        // ============ AUTH STATE LISTENER ============
        auth.onAuthStateChanged(function(user) {
            console.log('Auth state changed:', user ? user.displayName : 'no user');
            currentUser = user;
            if (user) {
                syncEnabled = true;
                updateSyncUI();
                syncFromCloud();
                listenForCloudChanges();
            } else {
                syncEnabled = false;
                updateSyncUI();
            }
        });

        // Check for redirect result (mobile login)
        auth.getRedirectResult().then(function(result) {
            if (result && result.user) {
                console.log('Redirect login OK:', result.user.displayName);
            }
        }).catch(function(error) {
            console.error('Redirect result error:', error);
        });

        // ============ OVERRIDE SAVE ============
        window._origSaveData = saveData;
        saveData = function(data) {
            window._origSaveData(data);
            if (syncEnabled && currentUser) {
                clearTimeout(syncTimeout);
                syncTimeout = setTimeout(syncToCloud, 2000);
            }
        };

        // Periodic sync
        setInterval(function() {
            if (syncEnabled && currentUser && !isSyncing) {
                syncToCloud();
            }
        }, 60000);

        // ============ EVENT LISTENERS ============
        var loginBtn = document.getElementById('btnGoogleLogin');
        if (loginBtn) {
            loginBtn.addEventListener('click', function() {
                console.log('Botao login clicado');
                loginWithGoogle();
            });
            console.log('Botao login configurado OK');
        } else {
            console.error('Botao btnGoogleLogin NAO encontrado!');
        }

        // Sync bar click = logout
        var syncBar = document.getElementById('syncBar');
        if (syncBar) {
            syncBar.addEventListener('click', function() {
                if (!currentUser) return;
                showCustomConfirm('Sincronizacao', 'Deseja sair da conta?', '\u2601\uFE0F').then(function(ok) {
                    if (ok) logout();
                });
            });
        }

        // Update UI now
        updateSyncUI();
        console.log('Firebase Sync pronto!');
    }
})();
