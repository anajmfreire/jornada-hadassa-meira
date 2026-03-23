// ================================================================
// EXTRAS.JS - Features extras (hidratacao, ferramentas, FAQ, glossario)
// ================================================================

// ============ HYDRATION WIDGET ============
function getHydration() {
    var today = toLocalDateStr(new Date());
    var saved = localStorage.getItem('hadassa_hydration');
    if (saved) { try { var d = JSON.parse(saved); if (d.date === today) return d; } catch(e) {} }
    return { date: today, cups: 0 };
}

function saveHydration(data) { localStorage.setItem('hadassa_hydration', JSON.stringify(data)); }

function renderHydration() {
    var container = document.getElementById('hydrationContent');
    if (!container) return;
    var data = getHydration();
    var goal = 8;
    var pct = Math.min((data.cups / goal) * 100, 100);
    var cups = [];
    for (var i = 0; i < goal; i++) cups.push(i < data.cups);

    var html = '<div style="text-align:center;">';
    html += '<div style="font-size:0.8em;color:var(--text-light);margin-bottom:8px;">Meta: ' + goal + ' copos (2L) por dia</div>';
    html += '<div style="display:flex;justify-content:center;gap:6px;margin:10px 0;">';
    cups.forEach(function(filled, i) {
        html += '<div data-cup="' + i + '" style="cursor:pointer;font-size:1.8em;transition:transform 0.2s;' + (filled ? '' : 'filter:grayscale(1);opacity:0.3;') + '">' + (filled ? '&#x1F4A7;' : '&#x1F4A7;') + '</div>';
    });
    html += '</div>';
    html += '<div style="background:var(--pink-100);border-radius:10px;height:10px;overflow:hidden;margin:8px 0;">';
    html += '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#60a5fa,#3b82f6);border-radius:10px;transition:width 0.5s;"></div>';
    html += '</div>';
    html += '<div style="font-size:0.85em;font-weight:700;color:' + (data.cups >= goal ? '#22c55e' : 'var(--text-medium)') + ';">' + data.cups + '/' + goal + ' copos ' + (data.cups >= goal ? '&#x2705; Meta atingida!' : '') + '</div>';
    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll('[data-cup]').forEach(function(el) {
        el.addEventListener('click', function() {
            var d = getHydration();
            var idx = parseInt(el.dataset.cup);
            if (idx < d.cups) d.cups = idx; else d.cups = idx + 1;
            saveHydration(d);
            renderHydration();
            if (d.cups >= goal) showToast('Parabéns! Meta de hidratação atingida! &#x1F4A7;');
        });
    });
}

// ============ TOOLS SECTION ============

// --- Weight Calculator ---
function renderWeightCalc(container) {
    var cfg = appData.config;
    var preWeight = parseFloat(cfg.preWeight) || 0;
    var height = parseFloat(cfg.height) || 0;
    var WEIGHT_KEY = 'hadassa_mom_weights';

    if (!preWeight || !height) {
        container.innerHTML = '<div class="card"><div class="card-title">&#x2696;&#xFE0F; Acompanhamento de Peso</div>' +
            '<p style="font-size:0.85em;color:var(--text-medium);margin-bottom:12px;">Informe seus dados para iniciar o acompanhamento:</p>' +
            '<div class="form-group"><label>Peso antes da gravidez (kg)</label><input type="number" id="toolPreWeight" step="0.1" placeholder="Ex: 60" style="padding:10px;border:2px solid var(--pink-200);border-radius:12px;width:100%;font-family:Nunito,sans-serif;"></div>' +
            '<div class="form-group"><label>Altura (cm)</label><input type="number" id="toolHeight" step="1" placeholder="Ex: 165" style="padding:10px;border:2px solid var(--pink-200);border-radius:12px;width:100%;font-family:Nunito,sans-serif;"></div>' +
            '<button class="btn btn-primary btn-block" id="toolCalcWeight"><i class="fas fa-calculator"></i> Salvar e Continuar</button></div>';
        document.getElementById('toolCalcWeight').addEventListener('click', function() {
            var w = document.getElementById('toolPreWeight').value;
            var h = document.getElementById('toolHeight').value;
            if (w && h) {
                appData.config.preWeight = w;
                appData.config.height = h;
                saveData(appData);
                var cfgPW = document.getElementById('cfgPreWeight');
                var cfgH = document.getElementById('cfgHeight');
                if (cfgPW) cfgPW.value = w;
                if (cfgH) cfgH.value = h;
                renderWeightCalc(container);
            }
        });
        return;
    }

    var bmi = preWeight / ((height/100) * (height/100));
    var bmiLabel = bmi < 18.5 ? 'Abaixo do peso' : bmi < 25 ? 'Peso normal' : bmi < 30 ? 'Sobrepeso' : 'Obesidade';
    var gainRange = bmi < 18.5 ? [12.5, 18] : bmi < 25 ? [11.5, 16] : bmi < 30 ? [7, 11.5] : [5, 9];
    var info = typeof calcCurrentGestationalAge === 'function' ? calcCurrentGestationalAge() : null;

    // Carregar todos os pesos
    var allWeights = [];
    if (typeof getAllMomWeights === 'function') {
        allWeights = getAllMomWeights();
    } else {
        try { allWeights = JSON.parse(localStorage.getItem(WEIGHT_KEY) || '[]'); } catch(e) {}
    }
    var lastWeight = allWeights.length > 0 ? parseFloat(allWeights[allWeights.length - 1].weight) : null;

    var html = '';

    // === CARD 1: Registrar Peso Semanal (PRIMEIRO, mais importante) ===
    html += '<div class="card">';
    html += '<div class="card-title"><i class="fas fa-weight"></i> Registrar Peso Semanal</div>';
    html += '<div style="display:flex;gap:8px;align-items:flex-end;margin-bottom:12px;">';
    html += '<div style="flex:1;"><label style="font-size:0.75em;color:var(--text-light);display:block;margin-bottom:4px;">Data</label>';
    html += '<input type="date" id="quickWeightDate" style="padding:10px;border:2px solid var(--pink-200);border-radius:12px;width:100%;font-family:Nunito,sans-serif;font-size:0.85em;" value="' + (typeof toLocalDateStr === 'function' ? toLocalDateStr(new Date()) : new Date().toISOString().split('T')[0]) + '"></div>';
    html += '<div style="flex:1;"><label style="font-size:0.75em;color:var(--text-light);display:block;margin-bottom:4px;">Peso (kg)</label>';
    html += '<input type="number" id="quickWeightValue" step="0.1" placeholder="Ex: 65.5" style="padding:10px;border:2px solid var(--pink-200);border-radius:12px;width:100%;font-family:Nunito,sans-serif;font-size:0.85em;"></div>';
    html += '<button class="btn btn-primary" id="btnQuickAddWeight" style="padding:10px 16px;white-space:nowrap;"><i class="fas fa-plus"></i> Salvar</button>';
    html += '</div>';

    // Stats cards
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">';
    html += '<div style="background:var(--pink-50);padding:10px;border-radius:12px;text-align:center;">';
    html += '<div style="font-size:0.65em;color:var(--text-light);">Peso Atual</div>';
    html += '<div style="font-size:1.3em;font-weight:800;color:var(--pink-600);">' + (lastWeight ? lastWeight.toFixed(1) : '--') + '</div>';
    html += '<div style="font-size:0.65em;color:var(--text-medium);">kg</div></div>';

    if (lastWeight) {
        var gain = lastWeight - preWeight;
        var gainStatus = info && gain >= (gainRange[0]/40*info.weeks) && gain <= (gainRange[1]/40*info.weeks) ? 'safe' : 'warning';
        html += '<div style="background:var(--pink-50);padding:10px;border-radius:12px;text-align:center;">';
        html += '<div style="font-size:0.65em;color:var(--text-light);">Ganho Total</div>';
        html += '<div style="font-size:1.3em;font-weight:800;color:var(--pink-600);">' + (gain >= 0 ? '+' : '') + gain.toFixed(1) + '</div>';
        html += '<div style="font-size:0.65em;"><span class="badge badge-' + gainStatus + '" style="font-size:0.9em;">' + (gainStatus === 'safe' ? 'Adequado' : 'Atencao') + '</span></div></div>';
    } else {
        html += '<div style="background:var(--pink-50);padding:10px;border-radius:12px;text-align:center;">';
        html += '<div style="font-size:0.65em;color:var(--text-light);">Ganho Total</div>';
        html += '<div style="font-size:1.3em;font-weight:800;color:var(--pink-600);">--</div>';
        html += '<div style="font-size:0.65em;color:var(--text-medium);">kg</div></div>';
    }

    html += '<div style="background:var(--pink-50);padding:10px;border-radius:12px;text-align:center;">';
    html += '<div style="font-size:0.65em;color:var(--text-light);">Recomendado</div>';
    html += '<div style="font-size:1.3em;font-weight:800;color:var(--pink-600);">' + gainRange[0] + '-' + gainRange[1] + '</div>';
    html += '<div style="font-size:0.65em;color:var(--text-medium);">kg total</div></div>';
    html += '</div>';

    // Faixa ideal para semana atual
    if (info) {
        var idealMin = (preWeight + (gainRange[0]/40*info.weeks)).toFixed(1);
        var idealMax = (preWeight + (gainRange[1]/40*info.weeks)).toFixed(1);
        html += '<div style="background:linear-gradient(135deg,var(--pink-50),var(--purple-100));padding:12px;border-radius:12px;margin-bottom:12px;text-align:center;">';
        html += '<div style="font-size:0.8em;color:var(--text-dark);">Semana <strong>' + info.weeks + '</strong> - Faixa ideal:</div>';
        html += '<div style="font-size:1.2em;font-weight:800;color:var(--pink-600);">' + idealMin + ' — ' + idealMax + ' kg</div>';
        html += '</div>';
    }

    // Historico de pesos (tabela completa com botão de excluir)
    if (allWeights.length > 0) {
        html += '<div style="font-size:0.8em;font-weight:700;color:var(--text-light);margin-bottom:6px;">Historico de Pesagens:</div>';
        html += '<div style="overflow-x:auto;max-height:250px;overflow-y:auto;">';
        html += '<table class="params-table" style="font-size:0.8em;"><thead><tr><th>Data</th><th>Peso</th><th>Ganho</th><th></th></tr></thead><tbody>';
        allWeights.slice().reverse().forEach(function(w) {
            var wVal = parseFloat(w.weight).toFixed(1);
            var g = (parseFloat(w.weight) - preWeight);
            html += '<tr>';
            html += '<td>' + (typeof formatDate === 'function' ? formatDate(w.date) : w.date) + '</td>';
            html += '<td><strong>' + wVal + '</strong> kg</td>';
            html += '<td>' + (g >= 0 ? '+' : '') + g.toFixed(1) + ' kg</td>';
            if (w.source !== 'consulta') {
                html += '<td><button class="btn btn-danger btn-small" data-delete-weight="' + escapeHtml(w.date) + '" style="padding:2px 8px;font-size:0.75em;"><i class="fas fa-trash"></i></button></td>';
            } else {
                html += '<td><small style="color:var(--text-light);">consulta</small></td>';
            }
            html += '</tr>';
        });
        html += '</tbody></table></div>';
    } else {
        html += '<div class="empty-state" style="padding:15px;"><i class="fas fa-weight"></i><p>Registre seu primeiro peso acima</p></div>';
    }

    // Canvas para gráfico de peso
    if (allWeights.length >= 2) {
        html += '<div style="margin-top:12px;"><canvas id="weightEvolutionChart" height="180"></canvas></div>';
    }

    html += '</div>';

    // === CARD 2: IMC e Referência (colapsável) ===
    html += '<div class="card" style="margin-top:12px;">';
    html += '<div class="card-title" id="toggleRefSection" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;">';
    html += '<span>&#x2696;&#xFE0F; IMC e Tabela de Referência</span>';
    html += '<i class="fas fa-chevron-down" id="refToggleIcon"></i></div>';
    html += '<div id="refSectionContent" style="display:none;">';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0;">';
    html += '<div style="background:var(--pink-50);padding:10px;border-radius:12px;text-align:center;">';
    html += '<div style="font-size:0.65em;color:var(--text-light);">IMC Pre-Gestacional</div>';
    html += '<div style="font-size:1.3em;font-weight:800;color:var(--pink-600);">' + bmi.toFixed(1) + '</div>';
    html += '<div style="font-size:0.65em;color:var(--text-medium);">' + bmiLabel + '</div></div>';
    html += '<div style="background:var(--pink-50);padding:10px;border-radius:12px;text-align:center;">';
    html += '<div style="font-size:0.65em;color:var(--text-light);">Peso Pre-Gravidez</div>';
    html += '<div style="font-size:1.3em;font-weight:800;color:var(--pink-600);">' + preWeight.toFixed(1) + '</div>';
    html += '<div style="font-size:0.65em;color:var(--text-medium);">kg</div></div>';
    html += '</div>';

    html += '<div style="font-size:0.8em;font-weight:700;color:var(--text-light);margin-bottom:6px;">Referencia semanal (ganho cumulativo):</div>';
    html += '<div style="overflow-x:auto;"><table class="params-table" style="font-size:0.75em;"><thead><tr><th>Semana</th><th>Ganho Min</th><th>Ganho Max</th><th>Peso Min</th><th>Peso Max</th></tr></thead><tbody>';
    [12,16,20,24,28,32,36,40].forEach(function(w) {
        var minG = (gainRange[0]/40*w).toFixed(1);
        var maxG = (gainRange[1]/40*w).toFixed(1);
        var isNow = info && Math.abs(info.weeks - w) < 2;
        html += '<tr' + (isNow ? ' class="highlight-row"' : '') + '><td>' + w + 's</td><td>+' + minG + '</td><td>+' + maxG + '</td><td>' + (preWeight + parseFloat(minG)).toFixed(1) + '</td><td>' + (preWeight + parseFloat(maxG)).toFixed(1) + '</td></tr>';
    });
    html += '</tbody></table></div>';
    html += '</div></div>';

    // === CARD 3: Atalho para pressão arterial ===
    html += '<div style="margin-top:12px;text-align:center;">';
    html += '<button class="btn btn-outline" id="btnGoBPHistory" style="font-size:0.85em;"><i class="fas fa-heartbeat"></i> Registrar Pressao Arterial</button>';
    html += '</div>';

    container.innerHTML = html;

    // === EVENTOS ===

    // Toggle seção de referência
    var toggleRef = document.getElementById('toggleRefSection');
    if (toggleRef) {
        toggleRef.addEventListener('click', function() {
            var content = document.getElementById('refSectionContent');
            var icon = document.getElementById('refToggleIcon');
            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.className = 'fas fa-chevron-up';
            } else {
                content.style.display = 'none';
                icon.className = 'fas fa-chevron-down';
            }
        });
    }

    // Salvar peso
    var btnQuickAdd = document.getElementById('btnQuickAddWeight');
    if (btnQuickAdd) {
        btnQuickAdd.addEventListener('click', function() {
            var dateEl = document.getElementById('quickWeightDate');
            var valEl = document.getElementById('quickWeightValue');
            var date = dateEl.value;
            var val = parseFloat(valEl.value);
            if (!date || isNaN(val) || val <= 0) {
                if (typeof showToast === 'function') showToast('Informe data e peso validos');
                return;
            }
            if (val < 30 || val > 200) {
                if (!confirm('O peso ' + val + ' kg parece incomum. Deseja continuar?')) return;
            }
            var weights = [];
            try { weights = JSON.parse(localStorage.getItem(WEIGHT_KEY) || '[]'); } catch(e) {}
            var existing = weights.findIndex(function(w) { return w.date === date; });
            if (existing !== -1) {
                weights[existing].weight = val;
            } else {
                weights.push({ date: date, weight: val });
            }
            weights.sort(function(a, b) { return a.date.localeCompare(b.date); });
            localStorage.setItem(WEIGHT_KEY, JSON.stringify(weights));
            if (typeof showToast === 'function') showToast('Peso registrado: ' + val.toFixed(1) + ' kg');
            renderWeightCalc(container);
        });
    }

    // Excluir peso
    container.querySelectorAll('[data-delete-weight]').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var dateToDelete = btn.dataset.deleteWeight;
            var weights = [];
            try { weights = JSON.parse(localStorage.getItem(WEIGHT_KEY) || '[]'); } catch(e2) {}
            weights = weights.filter(function(w) { return w.date !== dateToDelete; });
            localStorage.setItem(WEIGHT_KEY, JSON.stringify(weights));
            renderWeightCalc(container);
        });
    });

    // Atalho pressão arterial
    var btnGoBP = document.getElementById('btnGoBPHistory');
    if (btnGoBP) {
        btnGoBP.addEventListener('click', function() {
            renderTool('bpHistory');
            document.querySelectorAll('[data-tooltab]').forEach(function(t) { t.classList.remove('active'); });
            var targetTab = document.querySelector('[data-tooltab="bpHistory"]');
            if (targetTab) targetTab.classList.add('active');
        });
    }

    // Gráfico de evolução de peso
    if (allWeights.length >= 2) {
        var chartCanvas = document.getElementById('weightEvolutionChart');
        if (chartCanvas && typeof Chart !== 'undefined') {
            var labels = allWeights.map(function(w) { return typeof formatDate === 'function' ? formatDate(w.date) : w.date; });
            var dataPoints = allWeights.map(function(w) { return parseFloat(w.weight); });

            // Faixa ideal para cada ponto
            var idealMinData = [];
            var idealMaxData = [];
            allWeights.forEach(function(w) {
                if (cfg.dum) {
                    var wInfo = typeof calcWeeksFromDUM === 'function' ? calcWeeksFromDUM(cfg.dum, w.date) : null;
                    if (wInfo) {
                        idealMinData.push(preWeight + (gainRange[0]/40 * wInfo.weeks));
                        idealMaxData.push(preWeight + (gainRange[1]/40 * wInfo.weeks));
                    } else {
                        idealMinData.push(null);
                        idealMaxData.push(null);
                    }
                } else {
                    idealMinData.push(null);
                    idealMaxData.push(null);
                }
            });

            new Chart(chartCanvas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Seu Peso',
                            data: dataPoints,
                            borderColor: '#ec4899',
                            backgroundColor: 'rgba(236,72,153,0.1)',
                            borderWidth: 2,
                            pointRadius: 4,
                            pointBackgroundColor: '#ec4899',
                            fill: false,
                            tension: 0.3
                        },
                        {
                            label: 'Min Ideal',
                            data: idealMinData,
                            borderColor: 'rgba(34,197,94,0.4)',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            pointRadius: 0,
                            fill: false
                        },
                        {
                            label: 'Max Ideal',
                            data: idealMaxData,
                            borderColor: 'rgba(34,197,94,0.4)',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            pointRadius: 0,
                            fill: '-1',
                            backgroundColor: 'rgba(34,197,94,0.08)'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom', labels: { font: { size: 10, family: 'Nunito' } } }
                    },
                    scales: {
                        y: { title: { display: true, text: 'kg', font: { size: 10 } } },
                        x: { ticks: { font: { size: 9 }, maxRotation: 45 } }
                    }
                }
            });
        }
    }
}

// --- Maternity Leave Calculator ---
function renderMaternityLeave(container) {
    var cfg = appData.config;
    var dppStr = cfg.dpp;
    if (!dppStr && cfg.dum) {
        var dumD = parseLocalDate(cfg.dum);
        var dppD = new Date(dumD.getTime() + 280 * 86400000);
        dppStr = toLocalDateStr(dppD);
    }
    if (!dppStr) {
        container.innerHTML = '<div class="card"><div class="card-title">&#x1F4C5; Calculadora de Licença Maternidade</div><p style="font-size:0.85em;color:var(--text-light);">Configure a DUM ou DPP em Configurações.</p></div>';
        return;
    }
    var dpp = parseLocalDate(dppStr);
    var start120 = new Date(dpp); start120.setDate(start120.getDate());
    var end120 = new Date(dpp); end120.setDate(end120.getDate() + 120);
    var end180 = new Date(dpp); end180.setDate(end180.getDate() + 180);
    var start28 = new Date(dpp); start28.setDate(start28.getDate() - 28);

    var html = '<div class="card"><div class="card-title">&#x1F4C5; Calculadora de Licença Maternidade</div>';
    html += '<div style="font-size:0.85em;color:var(--text-dark);line-height:1.8;">';
    html += '<div style="padding:10px;background:var(--pink-50);border-radius:12px;margin-bottom:10px;">&#x1F4CC; <strong>DPP:</strong> ' + formatDate(dppStr) + '</div>';
    html += '<div style="padding:10px;background:#dbeafe;border-radius:12px;margin-bottom:10px;">&#x1F3E2; <strong>Pode iniciar a partir de:</strong> ' + formatDate(toLocalDateStr(start28)) + ' (28 dias antes do parto)</div>';
    html += '<div style="padding:10px;background:#dcfce7;border-radius:12px;margin-bottom:10px;">&#x2705; <strong>Licença 120 dias:</strong> até ' + formatDate(toLocalDateStr(end120)) + '</div>';
    html += '<div style="padding:10px;background:#f3e8ff;border-radius:12px;margin-bottom:10px;">&#x1F49C; <strong>Licença 180 dias (Empresa Cidadã):</strong> até ' + formatDate(toLocalDateStr(end180)) + '</div>';
    html += '</div>';
    html += '<p style="font-size:0.75em;color:var(--text-light);margin-top:10px;">* Datas estimadas. A licença inicia no dia do parto ou até 28 dias antes. Consulte o RH da sua empresa.</p>';
    html += '</div>';
    container.innerHTML = html;
}

// --- Breastfeeding Timer ---
var bfSession = { active: false, side: null, start: null };

function getBfHistory() {
    var s = localStorage.getItem('hadassa_bf_history');
    if (s) { try { return JSON.parse(s); } catch(e) {} }
    return [];
}

function saveBfHistory(h) { localStorage.setItem('hadassa_bf_history', JSON.stringify(h)); }

function renderBreastTimer(container) {
    var history = getBfHistory();
    var html = '<div class="card"><div class="card-title">&#x1F37C; Timer de Amamentação</div>';
    html += '<p style="font-size:0.8em;color:var(--text-light);margin-bottom:12px;">Registre o tempo e o lado de cada mamada do seu bebê.</p>';

    if (!bfSession.active) {
        html += '<div style="display:flex;gap:12px;justify-content:center;margin:15px 0;">';
        html += '<button class="btn btn-primary" id="bfStartLeft" style="width:110px;height:110px;border-radius:50%;font-size:0.9em;"><div style="font-size:1.8em;">&#x1F930;</div>Esquerdo</button>';
        html += '<button class="btn btn-secondary" id="bfStartRight" style="width:110px;height:110px;border-radius:50%;font-size:0.9em;border:3px solid var(--pink-300);"><div style="font-size:1.8em;">&#x1F930;</div>Direito</button>';
        html += '</div>';
    } else {
        var elapsed = Math.floor((Date.now() - bfSession.start) / 1000);
        var min = Math.floor(elapsed / 60);
        var sec = elapsed % 60;
        html += '<div style="text-align:center;margin:15px 0;">';
        html += '<div style="font-size:0.85em;color:var(--text-medium);">Lado: <strong style="color:var(--pink-600);">' + (bfSession.side === 'left' ? 'Esquerdo' : 'Direito') + '</strong></div>';
        html += '<div style="font-size:3em;font-weight:800;color:var(--pink-500);margin:8px 0;">' + min + ':' + (sec < 10 ? '0' : '') + sec + '</div>';
        html += '<button class="btn btn-danger" id="bfStop" style="border-radius:20px;padding:10px 30px;">&#x23F9; Parar</button>';
        html += '</div>';
    }

    // Today's feedings
    var today = toLocalDateStr(new Date());
    var todayFeedings = history.filter(function(h) { return h.date === today; });
    if (todayFeedings.length > 0) {
        html += '<div style="margin-top:12px;"><div style="font-size:0.82em;font-weight:700;color:var(--pink-600);margin-bottom:6px;">Mamadas de hoje (' + todayFeedings.length + '):</div>';
        html += '<table class="params-table" style="font-size:0.75em;"><thead><tr><th>Hora</th><th>Lado</th><th>Duração</th></tr></thead><tbody>';
        todayFeedings.reverse().forEach(function(f) {
            html += '<tr><td>' + f.time + '</td><td>' + (f.side === 'left' ? '&#x2B05; Esq' : 'Dir &#x27A1;') + '</td><td>' + f.duration + 'min</td></tr>';
        });
        html += '</tbody></table></div>';
    }

    html += '</div>';
    container.innerHTML = html;

    var startL = document.getElementById('bfStartLeft');
    var startR = document.getElementById('bfStartRight');
    var stop = document.getElementById('bfStop');

    if (startL) startL.addEventListener('click', function() { bfSession = { active: true, side: 'left', start: Date.now() }; renderBreastTimer(container); });
    if (startR) startR.addEventListener('click', function() { bfSession = { active: true, side: 'right', start: Date.now() }; renderBreastTimer(container); });
    if (stop) stop.addEventListener('click', function() {
        var duration = Math.floor((Date.now() - bfSession.start) / 60000);
        var now = new Date();
        var h = getBfHistory();
        h.push({ date: toLocalDateStr(now), time: (now.getHours()<10?'0':'') + now.getHours() + ':' + (now.getMinutes()<10?'0':'') + now.getMinutes(), side: bfSession.side, duration: duration || 1 });
        saveBfHistory(h);
        bfSession = { active: false, side: null, start: null };
        showToast('Mamada registrada!');
        renderBreastTimer(container);
    });

    if (bfSession.active) {
        setTimeout(function() {
            var tab = document.querySelector('.sub-tab[data-tooltab].active');
            if (tab && tab.dataset.tooltab === 'breastTimer') renderBreastTimer(container);
        }, 1000);
    }
}

// --- Blood Pressure History ---
function renderBPHistory(container) {
    var bpLog = JSON.parse(localStorage.getItem('hadassa_bp_log') || '[]');
    var apps = appData.appointments.filter(function(a) { return a.bloodPressure; }).sort(function(a,b) { return a.date.localeCompare(b.date); });

    // Combine appointments BP + manual BP log
    var allBP = [];
    apps.forEach(function(a) { allBP.push({ date: a.date, bp: a.bloodPressure, source: 'consulta' }); });
    bpLog.forEach(function(b) { allBP.push({ date: b.date, bp: b.bp, source: 'manual' }); });
    allBP.sort(function(a,b) { return a.date.localeCompare(b.date); });

    var html = '<div class="card"><div class="card-title">&#x1FA7A; Registrar Pressão Arterial</div>';
    html += '<div style="display:flex;gap:8px;margin-bottom:15px;">';
    html += '<input type="text" id="bpInput" placeholder="Ex: 120/80" maxlength="10" style="flex:1;padding:10px;border:2px solid var(--pink-200);border-radius:12px;font-family:Nunito,sans-serif;font-size:1em;text-align:center;">';
    html += '<button class="btn btn-primary" id="btnSaveBP"><i class="fas fa-plus"></i> Salvar</button>';
    html += '</div></div>';

    html += '<div class="card"><div class="card-title">&#x1FA7A; Histórico</div>';
    if (allBP.length === 0) {
        html += '<p style="font-size:0.85em;color:var(--text-light);">Nenhum registro ainda. Use o campo acima ou registre nas consultas.</p>';
    } else {
        html += '<table class="params-table" style="font-size:0.82em;"><thead><tr><th>Data</th><th>PA</th><th>Status</th><th>Fonte</th></tr></thead><tbody>';
        allBP.reverse().forEach(function(entry) {
            var parts = entry.bp.split('/').map(Number);
            var status = 'Normal';
            var badge = 'safe';
            if (parts.length === 2) {
                if (parts[0] >= 140 || parts[1] >= 90) { status = 'Atenção!'; badge = 'warning'; }
                if (parts[0] >= 160 || parts[1] >= 110) { status = 'Procure o médico!'; badge = 'danger'; }
            }
            html += '<tr><td>' + formatDate(entry.date) + '</td><td style="font-weight:700;">' + escapeHtml(entry.bp) + '</td><td><span class="badge badge-' + badge + '">' + status + '</span></td><td style="font-size:0.8em;color:var(--text-light);">' + (entry.source === 'consulta' ? 'Consulta' : 'Manual') + '</td></tr>';
        });
        html += '</tbody></table>';
        html += '<p style="font-size:0.7em;color:var(--text-light);margin-top:8px;">Ref: Normal &lt; 140/90 | Atenção &gt;= 140/90 | Emergência &gt;= 160/110. PA alta pode indicar pré-eclâmpsia.</p>';
    }
    html += '</div>';
    container.innerHTML = html;

    // Save BP button
    var saveBPBtn = document.getElementById('btnSaveBP');
    if (saveBPBtn) {
        saveBPBtn.addEventListener('click', function() {
            var input = document.getElementById('bpInput');
            var val = input.value.trim();
            if (!val || !val.includes('/')) { showToast('Formato inválido. Use: 120/80'); return; }
            var log = JSON.parse(localStorage.getItem('hadassa_bp_log') || '[]');
            log.push({ date: toLocalDateStr(new Date()), bp: val });
            localStorage.setItem('hadassa_bp_log', JSON.stringify(log));
            input.value = '';
            showToast('Pressão registrada!');
            renderBPHistory(container);
        });
    }
}

// --- Music Suggestions ---
function renderMusic(container) {
    var info = calcCurrentGestationalAge();
    var tri = info ? (info.weeks < 14 ? 1 : info.weeks < 28 ? 2 : 3) : 1;

    var allPlaylists = [
        { id: 'relaxar', title: 'Relaxar & Acalmar', desc: 'Músicas suaves para momentos de paz', songs: [
            { name: 'Clair de Lune — Debussy', yt: 'https://www.youtube.com/results?search_query=clair+de+lune+debussy' },
            { name: 'Weightless — Marconi Union', yt: 'https://www.youtube.com/results?search_query=weightless+marconi+union' },
            { name: 'River Flows in You — Yiruma', yt: 'https://www.youtube.com/results?search_query=river+flows+in+you+yiruma' },
            { name: 'Gymnopédie No.1 — Satie', yt: 'https://www.youtube.com/results?search_query=gymnopedie+satie' },
            { name: 'Nuvole Bianche — Einaudi', yt: 'https://www.youtube.com/results?search_query=nuvole+bianche+einaudi' }
        ]},
        { id: 'bebe', title: 'Para o Bebê Ouvir', desc: 'Músicas que estimulam o desenvolvimento do bebê', songs: [
            { name: 'Mozart para Bebês (1h)', yt: 'https://www.youtube.com/results?search_query=mozart+para+bebes+1+hora' },
            { name: 'Beethoven para Gestantes', yt: 'https://www.youtube.com/results?search_query=beethoven+para+gestantes' },
            { name: 'Canções de Ninar Piano', yt: 'https://www.youtube.com/results?search_query=cancoes+de+ninar+piano+bebe' },
            { name: 'Sons da Natureza + Piano', yt: 'https://www.youtube.com/results?search_query=sons+natureza+piano+bebe' },
            { name: 'Caixa de Música Clássica', yt: 'https://www.youtube.com/results?search_query=caixa+de+musica+classica+bebe' }
        ]},
        { id: 'ruido', title: 'Ruído Branco & Sons Relaxantes', desc: 'Para dormir melhor e acalmar o bebê', songs: [
            { name: 'Ruído Branco (10h)', yt: 'https://www.youtube.com/results?search_query=ruido+branco+10+horas+bebe' },
            { name: 'Som de Chuva', yt: 'https://www.youtube.com/results?search_query=som+de+chuva+para+dormir' },
            { name: 'Batimentos Cardíacos (útero)', yt: 'https://www.youtube.com/results?search_query=batimentos+cardiacos+utero+bebe+dormir' },
            { name: 'Ondas do Mar', yt: 'https://www.youtube.com/results?search_query=ondas+do+mar+para+dormir' },
            { name: 'Ventilador / Secador', yt: 'https://www.youtube.com/results?search_query=ruido+branco+ventilador+bebe' },
            { name: 'Aspirador de Pó', yt: 'https://www.youtube.com/results?search_query=aspirador+ruido+branco+bebe+dormir' }
        ]},
        { id: 'gospel', title: 'Gospel & Evangélicas', desc: 'Louvores para fortalecer a fé durante a gestação', songs: [
            { name: 'Thalles Roberto — Deus Me Ama', yt: 'https://www.youtube.com/results?search_query=thalles+roberto+deus+me+ama' },
            { name: 'Aline Barros — Sonda-me', yt: 'https://www.youtube.com/results?search_query=aline+barros+sonda+me' },
            { name: 'Gabriela Rocha — Lugar Secreto', yt: 'https://www.youtube.com/results?search_query=gabriela+rocha+lugar+secreto' },
            { name: 'Ana Nóbrega — Quero Conhecer Jesus', yt: 'https://www.youtube.com/results?search_query=ana+nobrega+quero+conhecer+jesus' },
            { name: 'Nívea Soares — Acalma o Meu Coração', yt: 'https://www.youtube.com/results?search_query=nivea+soares+acalma+meu+coracao' },
            { name: 'Fernandinho — Grandes Coisas', yt: 'https://www.youtube.com/results?search_query=fernandinho+grandes+coisas' },
            { name: 'Diante do Trono — Preciso de Ti', yt: 'https://www.youtube.com/results?search_query=diante+do+trono+preciso+de+ti' },
            { name: 'Louvores para Gestantes (playlist)', yt: 'https://www.youtube.com/results?search_query=louvores+gospel+para+gestantes+playlist' }
        ]},
        { id: 'energia', title: 'Energia & Bom Humor', desc: 'Para os dias de mais disposição', songs: [
            { name: 'Three Little Birds — Bob Marley', yt: 'https://www.youtube.com/results?search_query=three+little+birds+bob+marley' },
            { name: 'Here Comes the Sun — Beatles', yt: 'https://www.youtube.com/results?search_query=here+comes+the+sun+beatles' },
            { name: 'Isn\'t She Lovely — Stevie Wonder', yt: 'https://www.youtube.com/results?search_query=isnt+she+lovely+stevie+wonder' },
            { name: 'A Thousand Years — Christina Perri', yt: 'https://www.youtube.com/results?search_query=a+thousand+years+christina+perri' },
            { name: 'What a Wonderful World — Louis Armstrong', yt: 'https://www.youtube.com/results?search_query=what+a+wonderful+world+armstrong' }
        ]}
    ];

    var html = '';
    allPlaylists.forEach(function(pl) {
        html += '<div class="card" style="margin-bottom:10px;"><div class="card-title" style="font-size:0.95em;">&#x1F3B5; ' + escapeHtml(pl.title) + '</div>';
        html += '<p style="font-size:0.78em;color:var(--text-light);margin-bottom:10px;">' + escapeHtml(pl.desc) + '</p>';
        pl.songs.forEach(function(s) {
            html += '<a href="' + escapeHtml(s.yt) + '" target="_blank" rel="noopener" style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--pink-50);font-size:0.85em;text-decoration:none;color:var(--text-dark);transition:background 0.2s;border-radius:8px;padding-left:8px;">';
            html += '<span>&#x1F3B6; ' + escapeHtml(s.name) + '</span>';
            html += '<span style="font-size:0.75em;color:var(--pink-500);flex-shrink:0;"><i class="fas fa-play-circle"></i> Ouvir</span>';
            html += '</a>';
        });
        html += '</div>';
    });
    container.innerHTML = html;
}

// --- Bump Timeline ---
function renderBumpTimeline(container) {
    var entries = [];
    try { entries = JSON.parse(localStorage.getItem('hadassa_diary') || '[]'); } catch(e) {}
    var withPhotos = entries.filter(function(e) { return e.photoId; }).sort(function(a,b) { return a.date.localeCompare(b.date); });

    var html = '<div class="card"><div class="card-title">&#x1F4F8; Evolução da Barriga</div>';
    if (withPhotos.length === 0) {
        html += '<p style="font-size:0.85em;color:var(--text-light);text-align:center;">Adicione fotos no Diário para ver sua evolução aqui! Tire uma foto por semana para criar uma linda linha do tempo.</p>';
    } else {
        html += '<div class="bump-timeline">';
        withPhotos.forEach(function(e) {
            var info = appData.config.dum ? calcWeeksFromDUM(appData.config.dum, e.date) : null;
            html += '<div class="bump-entry" style="display:flex;gap:12px;align-items:flex-start;margin-bottom:15px;padding-bottom:15px;border-bottom:2px solid var(--pink-100);">';
            html += '<div style="flex-shrink:0;text-align:center;min-width:60px;"><div style="font-size:1.5em;font-weight:800;color:var(--pink-500);">' + (info ? info.weeks + 's' : '--') + '</div><div style="font-size:0.7em;color:var(--text-light);">' + formatDate(e.date) + '</div></div>';
            html += '<div id="bump-photo-' + escapeHtml(e.id) + '" style="flex:1;border-radius:14px;overflow:hidden;max-height:200px;background:var(--pink-50);display:flex;align-items:center;justify-content:center;"><small>Carregando...</small></div>';
            html += '</div>';
        });
        html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;

    // Load photos
    withPhotos.forEach(function(e) {
        if (e.photoId) {
            loadPhoto(e.photoId).then(function(data) {
                var div = document.getElementById('bump-photo-' + e.id);
                if (div && data) {
                    div.innerHTML = '';
                    var img = document.createElement('img');
                    img.src = data;
                    img.style.cssText = 'width:100%;object-fit:cover;cursor:pointer;';
                    img.addEventListener('click', function() { showFullPhoto(data); });
                    div.appendChild(img);
                }
            }).catch(function() {});
        }
    });
}

// ============ FAQ ============
var faqData = [
    { cat: 'Primeiras Semanas', items: [
        { q: 'Quando devo fazer o primeiro ultrassom?', a: 'O primeiro ultrassom é geralmente feito entre 6 e 8 semanas de gestação. Nele, é possível confirmar a gravidez, verificar se é única ou gemelar, ouvir os batimentos cardíacos e datar a gestação com precisão.' },
        { q: 'É normal ter cólicas no início da gravidez?', a: 'Sim, cólicas leves são normais no início. São causadas pela implantação do embrião e pelo crescimento do útero. Porém, se forem intensas, acompanhadas de sangramento ou febre, procure seu médico imediatamente.' },
        { q: 'Posso tomar café durante a gravidez?', a: 'Sim, mas com moderação. O limite recomendado é de 200mg de cafeína por dia (equivalente a 1-2 xícaras de café coado). Excesso de cafeína pode aumentar o risco de aborto espontâneo e baixo peso ao nascer.' },
        { q: 'Quando os enjoos vão parar?', a: 'Para a maioria das mulheres, os enjoos melhoram significativamente ao final do primeiro trimestre (12-14 semanas). Algumas mulheres sentem enjoos durante toda a gravidez. Se forem muito intensos, procure seu médico.' }
    ]},
    { cat: 'Alimentação', items: [
        { q: 'Posso comer sushi na gravidez?', a: 'Peixes crus devem ser evitados pelo risco de contaminação por bactérias e parasitas. Sushi com peixe cozido (camarão, salmão grelhado) é seguro. Evite peixes com alto teor de mercúrio como atum e cação.' },
        { q: 'Preciso comer por dois?', a: 'Não! No primeiro trimestre, as necessidades calóricas não mudam. No segundo, aumentam cerca de 340 kcal/dia, e no terceiro, cerca de 450 kcal/dia. Foque na qualidade dos alimentos, não na quantidade.' },
        { q: 'Quais alimentos devo evitar?', a: 'Evite: carnes cruas ou malpassadas, ovos crus, queijos não pasteurizados (brie, camembert), leite não pasteurizado, peixes crus, embutidos (presunto, salsicha), álcool em qualquer quantidade, e excesso de cafeína.' },
        { q: 'Posso comer chocolate?', a: 'Sim, com moderação! Chocolate amargo (70%+) é até benéfico por conter antioxidantes. Evite consumir em excesso pelo açúcar e cafeína. Um quadradinho por dia é perfeitamente aceitável.' }
    ]},
    { cat: 'Exames', items: [
        { q: 'O que é a translucência nucal?', a: 'É um exame de ultrassom feito entre 11 e 14 semanas que mede uma camada de líquido na nuca do bebê. Valores aumentados podem indicar risco de síndromes cromossômicas como Down. É combinado com exame de sangue para maior precisão.' },
        { q: 'O que é o ultrassom morfológico?', a: 'Feito entre 20 e 24 semanas, é o exame mais detalhado do pré-natal. Avalia todas as estruturas do bebê: cérebro, coração, rins, coluna, membros, face, placenta e líquido amniótico. Também confirma o sexo do bebê.' },
        { q: 'O que é o teste de glicose (TOTG)?', a: 'O Teste Oral de Tolerância à Glicose é feito entre 24-28 semanas. Você bebe uma solução de glicose e colhe sangue após 1 e 2 horas. Detecta diabetes gestacional, que afeta cerca de 7% das gestantes.' },
        { q: 'O que é o estreptococo grupo B?', a: 'É uma bactéria que pode estar presente na vagina sem causar sintomas. O exame (swab vaginal) é feito entre 35-37 semanas. Se positivo, antibiótico é administrado durante o parto para proteger o bebê.' }
    ]},
    { cat: 'Corpo e Sintomas', items: [
        { q: 'É normal ter sangramento na gravidez?', a: 'Pequenos sangramentos podem ser normais no início (sangramento de implantação). Porém, qualquer sangramento deve ser comunicado ao médico. No segundo e terceiro trimestre, sangramento pode indicar problemas como placenta prévia.' },
        { q: 'Posso pintar o cabelo?', a: 'A partir do segundo trimestre, tinturas sem amônia são consideradas seguras. Evite tinturas no primeiro trimestre. Mechas e balayage são opções mais seguras pois não tocam o couro cabeludo. Sempre em ambiente ventilado.' },
        { q: 'É normal roncar durante a gravidez?', a: 'Sim! O aumento do volume sanguíneo causa inchaço das mucosas nasais, dificultando a respiração. Se o ronco for acompanhado de pausas na respiração, converse com seu médico (pode ser apneia do sono).' },
        { q: 'Por que tenho tanta vontade de urinar?', a: 'No início, os hormônios aumentam o fluxo sanguíneo para os rins. No final, o útero grande pressiona a bexiga. É normal ir ao banheiro a cada 1-2 horas. Nunca segure a urina — pode causar infecção.' }
    ]},
    { cat: 'Parto', items: [
        { q: 'Como sei que estou em trabalho de parto?', a: 'Sinais reais: contrações regulares (a cada 5 min por 1h), que ficam mais fortes e não param com repouso. Podem ser acompanhadas de perda do tampão mucoso, rompimento da bolsa e/ou dor lombar intensa. Braxton Hicks são irregulares e param com repouso.' },
        { q: 'O que levar na mala da maternidade?', a: 'Para a mãe: camisolas (2-3), roupão, chinelo, sutiã de amamentação, calcinha pós-parto, absorvente, kit higiene, documentos, carregador. Para o bebê: bodies, macacões, meias, touca, manta, fraldas RN, roupa de saída.' },
        { q: 'Posso escolher entre parto normal e cesárea?', a: 'Sim, é seu direito. Converse com seu médico sobre as indicações de cada um. O parto normal tem recuperação mais rápida. A cesárea é indicada em situações específicas. O plano de parto é um documento importante para registrar suas preferências.' },
        { q: 'O que é o plano de parto?', a: 'É um documento onde você registra suas preferências para o parto: tipo de parto, alívio da dor, acompanhante, ambiente, contato pele a pele, amamentação na primeira hora, clampeamento do cordão, etc. Deve ser discutido com seu médico e entregue à maternidade.' }
    ]},
    { cat: 'Pós-Parto', items: [
        { q: 'Quando vou menstruar depois do parto?', a: 'Se amamentando exclusivamente, a menstruação pode demorar meses para voltar (4-12 meses). Se não amamentar, pode voltar em 6-8 semanas. Mas atenção: é possível engravidar antes da primeira menstruação pós-parto!' },
        { q: 'Quanto tempo demora a recuperação da cesárea?', a: 'A recuperação completa leva 6-8 semanas. Nos primeiros dias haverá dor no local da incisão. Evite carregar peso e subir escadas por 2-3 semanas. A cicatriz leva cerca de 6 meses para ficar definitiva.' },
        { q: 'É normal chorar muito depois do parto?', a: 'O "baby blues" afeta até 80% das mães e dura 2-3 semanas. É causado pela queda hormonal. Se persistir por mais de 2 semanas, for intenso ou acompanhado de pensamentos de se machucar, procure ajuda — pode ser depressão pós-parto.' },
        { q: 'Quando posso voltar a ter relações?', a: 'Geralmente após 40 dias (quarentena), quando o útero voltou ao tamanho normal e a cicatrização está completa. Mas não há uma regra fixa — converse com seu médico e respeite seu corpo e seus sentimentos.' }
    ]}
];

function renderFAQ() {
    var container = document.getElementById('faqContent');
    if (!container) return;
    var html = '<div style="margin-bottom:12px;"><input type="text" id="faqSearch" placeholder="&#x1F50D; Buscar pergunta..." style="width:100%;padding:12px 16px;border:2px solid var(--pink-200);border-radius:14px;font-family:Nunito,sans-serif;font-size:0.9em;"></div>';

    faqData.forEach(function(cat) {
        html += '<div class="card faq-category" style="margin-bottom:10px;"><div style="font-size:0.95em;font-weight:700;color:var(--pink-600);margin-bottom:10px;">&#x1F4CC; ' + escapeHtml(cat.cat) + '</div>';
        cat.items.forEach(function(item) {
            html += '<details class="faq-item" style="margin-bottom:8px;border-bottom:1px solid var(--pink-50);padding-bottom:8px;">';
            html += '<summary style="cursor:pointer;font-size:0.9em;font-weight:600;color:var(--text-dark);padding:6px 0;">' + escapeHtml(item.q) + '</summary>';
            html += '<p style="font-size:0.85em;color:var(--text-medium);line-height:1.7;margin-top:8px;padding:10px;background:var(--pink-50);border-radius:10px;">' + escapeHtml(item.a) + '</p>';
            html += '</details>';
        });
        html += '</div>';
    });
    container.innerHTML = html;

    // Search
    document.getElementById('faqSearch').addEventListener('input', function() {
        var q = this.value.toLowerCase();
        container.querySelectorAll('.faq-item').forEach(function(item) {
            var text = item.textContent.toLowerCase();
            item.style.display = text.includes(q) ? '' : 'none';
        });
    });
}

// ============ GLOSSARY ============
var glossaryData = [
    { term: 'hCG', def: 'Gonadotrofina Coriônica Humana. Hormônio da gravidez, detectado nos testes. Valores dobram a cada 48h no início.' },
    { term: 'DUM', def: 'Data da Última Menstruação. Base para calcular a idade gestacional.' },
    { term: 'DPP', def: 'Data Prevista do Parto. Calculada como DUM + 280 dias.' },
    { term: 'IG', def: 'Idade Gestacional. Tempo de gravidez em semanas e dias.' },
    { term: 'CCN', def: 'Comprimento Cabeça-Nádega. Mede o embrião/feto inteiro no 1º trimestre.' },
    { term: 'DBP', def: 'Diâmetro Biparietal. Mede a cabeça do bebê de uma orelha à outra.' },
    { term: 'CA', def: 'Circunferência Abdominal. Mede a barriga do bebê. Importante para estimar peso.' },
    { term: 'CF ou FL', def: 'Comprimento do Fêmur. Mede o osso da coxa do bebê.' },
    { term: 'PFE', def: 'Peso Fetal Estimado. Calculado a partir de DBP, CA e CF.' },
    { term: 'ILA', def: 'Índice de Líquido Amniótico. Mede a quantidade de líquido ao redor do bebê. Normal: 8-18cm.' },
    { term: 'TN', def: 'Translucência Nucal. Medida da nuca do bebê no 1º tri. Avalia risco de síndromes.' },
    { term: 'Percentil', def: 'Posição do bebê na curva de crescimento. P50 = média. Entre P10-P90 é normal.' },
    { term: 'BHCG', def: 'Beta-HCG. Exame de sangue que confirma e acompanha a gravidez.' },
    { term: 'TSH', def: 'Hormônio Tireoestimulante. Avalia função da tireoide (importante na gestação).' },
    { term: 'Hemoglobina', def: 'Proteína do sangue que carrega oxigênio. Valores baixos = anemia. Normal: >11g/dL na gestação.' },
    { term: 'Hematócrito', def: 'Percentual de glóbulos vermelhos no sangue. Diminui na gravidez (hemodiluição). Normal: >33%.' },
    { term: 'Glicemia', def: 'Nível de açúcar no sangue. Jejum normal < 92mg/dL na gestação.' },
    { term: 'TOTG', def: 'Teste Oral de Tolerância à Glicose. Exame para detectar diabetes gestacional (24-28 semanas).' },
    { term: 'GBS', def: 'Estreptococo do Grupo B. Bactéria testada por swab vaginal (35-37 semanas).' },
    { term: 'Toxoplasmose', def: 'Infecção por parasita (Toxoplasma). Transmitida por carne crua e fezes de gato. Perigosa para o feto.' },
    { term: 'Rubéola', def: 'Infecção viral. Se contraída na gravidez, pode causar malformações graves. A vacina NÃO pode ser dada na gestação.' },
    { term: 'Colo uterino', def: 'Parte inferior do útero. Deve medir >= 25mm durante a gestação. Valores menores indicam risco de parto prematuro.' },
    { term: 'Placenta prévia', def: 'Quando a placenta cobre total ou parcialmente o colo do útero. Pode causar sangramento e indicar cesárea.' },
    { term: 'Pré-eclâmpsia', def: 'Pressão alta + proteína na urina após 20 semanas. Sintomas: inchaço repentino, dor de cabeça forte, visão turva. É grave — procure o hospital.' },
    { term: 'Braxton Hicks', def: 'Contrações de "treinamento". Irregulares, indolores, param com repouso. Diferentes das contrações reais do parto.' },
    { term: 'Dilatação', def: 'Abertura do colo do útero durante o trabalho de parto. De 0 a 10cm. Com 10cm = dilatação total.' },
    { term: 'Episiotomia', def: 'Corte no períneo durante o parto vaginal. Hoje é considerada desnecessária na maioria dos casos.' },
    { term: 'Vérnix', def: 'Substância branca e oleosa que cobre a pele do bebê dentro do útero. Protege a pele do líquido amniótico.' },
    { term: 'Lanugo', def: 'Penugem fina que cobre o corpo do feto. Ajuda a manter o vérnix no lugar. Desaparece antes ou logo após o nascimento.' },
    { term: 'Mecônio', def: 'Primeiras fezes do bebê. Escuras e pegajosas. Composto por células, bile e líquido amniótico ingerido.' }
];

function renderGlossary() {
    var container = document.getElementById('glossaryContent');
    if (!container) return;
    var html = '<div style="margin-bottom:12px;"><input type="text" id="glossarySearch" placeholder="&#x1F50D; Buscar termo..." style="width:100%;padding:12px 16px;border:2px solid var(--pink-200);border-radius:14px;font-family:Nunito,sans-serif;font-size:0.9em;"></div>';
    html += '<div class="card"><div class="card-title">&#x1F4DA; Glossário de Termos Médicos</div>';

    glossaryData.sort(function(a,b) { return a.term.localeCompare(b.term); }).forEach(function(item) {
        html += '<div class="glossary-item" style="padding:10px 0;border-bottom:1px solid var(--pink-50);">';
        html += '<div style="font-weight:700;color:var(--pink-600);font-size:0.92em;">' + escapeHtml(item.term) + '</div>';
        html += '<div style="font-size:0.85em;color:var(--text-dark);line-height:1.6;margin-top:4px;">' + escapeHtml(item.def) + '</div>';
        html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;

    document.getElementById('glossarySearch').addEventListener('input', function() {
        var q = this.value.toLowerCase();
        container.querySelectorAll('.glossary-item').forEach(function(item) {
            item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    });
}

// ============ WEIGHT CALCULATOR FOR BABY ============
function renderBabyWeightCalc() {
    var allUS = typeof getAllUSData === 'function' ? getAllUSData() : (appData.ultrasounds || []);
    if (allUS.length === 0) return '';
    var last = allUS[allUS.length - 1];
    if (!last.weight || !last.weeks) return '';
    var ref = weightRef[last.weeks];
    if (!ref) return '';

    var pct = ((last.weight - ref[0]) / (ref[2] - ref[0]) * 100).toFixed(0);
    pct = Math.max(0, Math.min(100, pct));
    var percentile = pct < 10 ? 'abaixo do percentil 10' : pct > 90 ? 'acima do percentil 90' : 'percentil ' + pct;

    return '<div class="card" style="border-left:4px solid var(--pink-400);">' +
        '<div class="card-title"><i class="fas fa-weight"></i> Peso do Bebê — Percentil</div>' +
        '<div style="text-align:center;margin:10px 0;">' +
            '<div style="font-size:2em;font-weight:800;color:var(--pink-600);">' + last.weight + 'g</div>' +
            '<div style="font-size:0.85em;color:var(--text-medium);">Semana ' + last.weeks + ' — ' + percentile + '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;margin:10px 0;">' +
            '<span style="font-size:0.7em;color:var(--text-light);">P10<br>' + ref[0] + 'g</span>' +
            '<div style="flex:1;height:12px;border-radius:6px;background:linear-gradient(90deg,#fecaca,#fde68a,#bbf7d0);position:relative;">' +
                '<div style="position:absolute;top:-4px;left:' + pct + '%;transform:translateX(-50%);width:20px;height:20px;border-radius:50%;background:var(--pink-500);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2);"></div>' +
            '</div>' +
            '<span style="font-size:0.7em;color:var(--text-light);">P90<br>' + ref[2] + 'g</span>' +
        '</div>' +
        '<div style="font-size:0.75em;color:var(--text-light);text-align:center;">Referência: ' + ref[1] + 'g (percentil 50)</div>' +
    '</div>';
}

// ============ WELCOME MESSAGE BY TIME OF DAY ============
function getWelcomeMessage() {
    var hour = new Date().getHours();
    var name = appData.config.momName || 'Mamãe';
    if (hour < 12) return 'Bom dia, ' + name + '! ☀️';
    if (hour < 18) return 'Boa tarde, ' + name + '! 🌸';
    return 'Boa noite, ' + name + '! 🌙';
}

// ============ INIT EXTRAS ============
(function initExtras() {
    if (typeof appData === 'undefined' || appData === null) {
        setTimeout(initExtras, 200);
        return;
    }

    // Render dashboard extras
    renderHydration();
    if (typeof renderDashCalendar === 'function') renderDashCalendar();

    // Welcome message
    var welcomeEl = document.getElementById('welcomeMsg');
    if (welcomeEl) welcomeEl.textContent = getWelcomeMessage();

    // Baby weight percentile
    var bwpEl = document.getElementById('babyWeightPercentile');
    if (bwpEl) bwpEl.innerHTML = renderBabyWeightCalc();

    // Tools sub-tabs
    document.querySelectorAll('.sub-tab[data-tooltab]').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.sub-tab[data-tooltab]').forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            renderTool(tab.dataset.tooltab);
        });
    });

    // Extend showSection for new sections
    var _prevShow = showSection;
    showSection = function(name) {
        _prevShow(name);
        if (name === 'tools') renderTool('weightCalc');
        if (name === 'faq') renderFAQ();
        if (name === 'glossary') renderGlossary();
        if (name === 'dashboard') {
            renderHydration();
            if (typeof renderDashCalendar === 'function') renderDashCalendar();
            var welcomeEl = document.getElementById('welcomeMsg');
            if (welcomeEl) welcomeEl.textContent = getWelcomeMessage();
            var bwpEl = document.getElementById('babyWeightPercentile');
            if (bwpEl) bwpEl.innerHTML = renderBabyWeightCalc();
        }
    };
})();

function renderTool(tab) {
    var container = document.getElementById('toolsContent');
    if (!container) return;
    switch (tab) {
        case 'weightCalc': renderWeightCalc(container); break;
        case 'momWeightTracker': renderMomWeightTracker(container); break;
        case 'maternityLeave': renderMaternityLeave(container); break;
        case 'breastTimer': renderBreastTimer(container); break;
        case 'bpHistory': renderBPHistory(container); break;
        case 'music': renderMusic(container); break;
        case 'bumpTimeline': renderBumpTimeline(container); break;
    }
}

// --- Mom Weight Tracker (Registro de Peso da Mãe) ---
function renderMomWeightTracker(container) {
    var WEIGHT_KEY = 'hadassa_mom_weights';
    var weights = [];
    try { weights = JSON.parse(localStorage.getItem(WEIGHT_KEY) || '[]'); } catch(e) {}

    var cfg = appData.config;
    var preWeight = parseFloat(cfg.preWeight) || 0;
    var height = parseFloat(cfg.height) || 0;
    var info = typeof calcCurrentGestationalAge === 'function' ? calcCurrentGestationalAge() : null;

    // Also include weights from appointments
    var allWeights = weights.slice();
    if (appData.appointments) {
        appData.appointments.forEach(function(a) {
            if (a.momWeight) {
                var exists = allWeights.some(function(w) { return w.date === a.date; });
                if (!exists) {
                    allWeights.push({ date: a.date, weight: parseFloat(a.momWeight), source: 'consulta' });
                }
            }
        });
    }
    allWeights.sort(function(a, b) { return a.date.localeCompare(b.date); });

    var html = '<div class="card"><div class="card-title"><i class="fas fa-weight"></i> Registrar Peso</div>';

    // Form to add new weight
    html += '<div style="display:flex;gap:8px;margin-bottom:15px;align-items:flex-end;">';
    html += '<div style="flex:1;"><label style="font-size:0.75em;color:var(--text-light);display:block;margin-bottom:4px;">Data</label><input type="date" id="momWeightDate" style="padding:10px;border:2px solid var(--pink-200);border-radius:12px;width:100%;font-family:Nunito,sans-serif;font-size:0.85em;" value="' + (typeof toLocalDateStr === 'function' ? toLocalDateStr(new Date()) : new Date().toISOString().split('T')[0]) + '"></div>';
    html += '<div style="flex:1;"><label style="font-size:0.75em;color:var(--text-light);display:block;margin-bottom:4px;">Peso (kg)</label><input type="number" id="momWeightValue" step="0.1" placeholder="Ex: 65.5" style="padding:10px;border:2px solid var(--pink-200);border-radius:12px;width:100%;font-family:Nunito,sans-serif;font-size:0.85em;"></div>';
    html += '<button class="btn btn-primary" id="btnAddMomWeight" style="padding:10px 16px;white-space:nowrap;"><i class="fas fa-plus"></i></button>';
    html += '</div>';

    // Current stats
    if (allWeights.length > 0) {
        var lastW = allWeights[allWeights.length - 1];
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px;">';
        html += '<div style="background:var(--pink-50);padding:12px;border-radius:14px;text-align:center;"><div style="font-size:0.7em;color:var(--text-light);">Peso Atual</div><div style="font-size:1.5em;font-weight:800;color:var(--pink-600);">' + parseFloat(lastW.weight).toFixed(1) + '</div><div style="font-size:0.7em;color:var(--text-medium);">kg</div></div>';
        if (preWeight) {
            var gain = (parseFloat(lastW.weight) - preWeight).toFixed(1);
            html += '<div style="background:var(--pink-50);padding:12px;border-radius:14px;text-align:center;"><div style="font-size:0.7em;color:var(--text-light);">Ganho Total</div><div style="font-size:1.5em;font-weight:800;color:var(--pink-600);">' + (gain >= 0 ? '+' : '') + gain + '</div><div style="font-size:0.7em;color:var(--text-medium);">kg</div></div>';
        }
        html += '</div>';
    }

    // History table
    if (allWeights.length > 0) {
        html += '<div style="font-size:0.8em;font-weight:700;color:var(--text-light);margin-bottom:6px;">Histórico:</div>';
        html += '<div style="overflow-x:auto;max-height:250px;overflow-y:auto;"><table class="params-table" style="font-size:0.8em;"><thead><tr><th>Data</th><th>Peso</th>';
        if (preWeight) html += '<th>Ganho</th>';
        html += '<th></th></tr></thead><tbody>';

        allWeights.slice().reverse().forEach(function(w) {
            var weightVal = parseFloat(w.weight).toFixed(1);
            html += '<tr><td>' + (typeof formatDate === 'function' ? formatDate(w.date) : w.date) + '</td>';
            html += '<td>' + weightVal + ' kg</td>';
            if (preWeight) {
                var g = (parseFloat(w.weight) - preWeight).toFixed(1);
                html += '<td>' + (g >= 0 ? '+' : '') + g + ' kg</td>';
            }
            if (w.source !== 'consulta') {
                html += '<td><button class="btn btn-danger btn-small" data-delete-weight="' + escapeHtml(w.date) + '" style="padding:2px 8px;font-size:0.75em;"><i class="fas fa-trash"></i></button></td>';
            } else {
                html += '<td><small style="color:var(--text-light);">consulta</small></td>';
            }
            html += '</tr>';
        });
        html += '</tbody></table></div>';
    } else {
        html += '<div class="empty-state" style="padding:20px;"><i class="fas fa-weight"></i><p>Nenhum peso registrado ainda</p></div>';
    }

    html += '</div>';
    container.innerHTML = html;

    // Event: add weight
    document.getElementById('btnAddMomWeight').addEventListener('click', function() {
        var dateEl = document.getElementById('momWeightDate');
        var valEl = document.getElementById('momWeightValue');
        var date = dateEl.value;
        var val = parseFloat(valEl.value);
        if (!date || isNaN(val) || val <= 0) {
            if (typeof showToast === 'function') showToast('Informe data e peso válidos');
            return;
        }
        var existing = weights.findIndex(function(w) { return w.date === date; });
        if (existing !== -1) {
            weights[existing].weight = val;
        } else {
            weights.push({ date: date, weight: val });
        }
        weights.sort(function(a, b) { return a.date.localeCompare(b.date); });
        localStorage.setItem(WEIGHT_KEY, JSON.stringify(weights));
        if (typeof showToast === 'function') showToast('Peso registrado!');
        renderMomWeightTracker(container);
    });

    // Event: delete weight
    container.querySelectorAll('[data-delete-weight]').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var dateToDelete = btn.dataset.deleteWeight;
            weights = weights.filter(function(w) { return w.date !== dateToDelete; });
            localStorage.setItem(WEIGHT_KEY, JSON.stringify(weights));
            renderMomWeightTracker(container);
        });
    });
}
