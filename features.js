// ================================================================
// FEATURES.JS - Novas funcionalidades do app
// Depende de app.js (appData, saveData, escapeHtml, formatDate, etc.)
// ================================================================

// ============ WEEKLY CONTENT (Conteúdo Semanal Detalhado) ============
var weeklyContent = {
    4: { baby: 'Seu bebê tem o tamanho de uma semente de papoula (~2mm). O tubo neural está se formando — ele dará origem ao cérebro e medula espinhal.', body: 'Você pode sentir cansaço intenso e sensibilidade nos seios. Enjoos matinais podem começar.', tips: 'Comece a tomar ácido fólico se ainda não está tomando. Evite álcool e cigarro.', highlight: 'O coração começa a se formar!' },
    5: { baby: 'Tamanho de um grão de pimenta (~3mm). O coração do bebê está começando a bater!', body: 'Náuseas e fadiga são comuns. Seu olfato pode estar mais sensível.', tips: 'Coma em pequenas porções ao longo do dia para reduzir enjoos. Biscoitos de água e sal ajudam.', highlight: 'Primeiros batimentos cardíacos!' },
    6: { baby: 'Tamanho de uma lentilha (~4mm). Bracinhos e perninhas começam como pequenos brotos. Os olhos e ouvidos começam a se formar.', body: 'Enjoos matinais podem intensificar. Você pode precisar urinar com mais frequência.', tips: 'Beba bastante água. O gengibre pode ajudar com os enjoos. Descanse quando puder.', highlight: 'Bracinhos e perninhas começando!' },
    8: { baby: 'Tamanho de uma framboesa (~16mm). Dedos das mãos e pés estão se formando. O bebê começa a fazer pequenos movimentos.', body: 'Os seios podem estar maiores e sensíveis. Alterações de humor são normais.', tips: 'Use sutiã confortável de algodão. Converse com seu parceiro sobre seus sentimentos.', highlight: 'Dedinhos se formando!' },
    10: { baby: 'Tamanho de uma azeitona (~31mm). Todos os órgãos vitais estão presentes. O bebê já se move, mas você ainda não sente.', body: 'Os enjoos podem começar a diminuir. Você pode notar um leve aumento na barriga.', tips: 'Marque a ultrassonografia de translucência nucal (11-14 semanas).', highlight: 'Órgãos vitais formados!' },
    12: { baby: 'Tamanho de um limão (~5cm). Todos os órgãos principais estão formados. Reflexos começam — ele já chupa o dedo!', body: 'Fim do 1º trimestre! Enjoos geralmente diminuem. A barriga começa a aparecer.', tips: 'Este é um bom momento para contar a novidade para amigos e família. Comece a pensar no enxoval.', highlight: 'Final do 1º trimestre! Órgãos formados.' },
    14: { baby: 'Tamanho de um pêssego (~9cm). O bebê faz expressões faciais! Já consegue franzir a testa e fazer caretas.', body: 'Bem-vinda ao 2º trimestre! Mais energia e disposição. Apetite pode aumentar.', tips: 'Aproveite a disposição para se exercitar (caminhada, natação). Mantenha alimentação equilibrada.', highlight: '2º trimestre! Mais energia.' },
    16: { baby: 'Tamanho de um abacate (~12cm). O bebê já se mexe bastante, mas você pode ainda não sentir. Unhas dos pés se formam.', body: 'A barriga está mais evidente. Você pode sentir os primeiros "borboletas" na barriga.', tips: 'Vista roupas confortáveis. Use hidratante na barriga para prevenir estrias.', highlight: 'Primeiros movimentos do bebê!' },
    18: { baby: 'Tamanho de uma batata-doce (~14cm). O bebê ouve sons! Converse com ele, cante, coloque música.', body: 'Você começa a sentir os chutinhos! O útero está na altura do umbigo.', tips: 'Fale com seu bebê — ele reconhece sua voz. A morfológica é entre 20-24 semanas.', highlight: 'O bebê ouve sua voz!' },
    20: { baby: 'Tamanho de uma banana (~16cm). METADE DA GESTAÇÃO! O bebê engole líquido amniótico e pratica a deglutição.', body: 'A barriga está redonda e bonita. Você sente os movimentos com mais clareza.', tips: 'Marque a ultrassonografia morfológica. Comece a pesquisar sobre parto e amamentação.', highlight: 'Metade do caminho! Parabéns!' },
    22: { baby: 'Tamanho de um papaia (~28cm). Sobrancelhas e cílios estão se formando. O bebê dorme e acorda em ciclos.', body: 'Você pode sentir Braxton Hicks (contrações de treinamento). Inchaço nas pernas pode começar.', tips: 'Eleve as pernas quando possível. Use meias de compressão se tiver inchaço.', highlight: 'Sobrancelhas e cílios se formando!' },
    24: { baby: 'Tamanho de uma espiga de milho (~30cm). O bebê reage à luz e sons! Os pulmões começam a produzir surfactante.', body: 'A barriga está grande. Dores nas costas e azia podem incomodar.', tips: 'Faça o teste de glicose (TOTG) entre 24-28 semanas. Durma de lado com travesseiro entre as pernas.', highlight: 'Bebê reage à luz e sons!' },
    28: { baby: 'Tamanho de uma berinjela (~38cm). 3º TRIMESTRE! Os olhos se abrem pela primeira vez. O bebê sonha!', body: 'Cansaço retorna. Falta de ar é comum. Dificuldade para dormir.', tips: 'Comece a contar os movimentos do bebê (10 em 2h). Prepare a mala da maternidade.', highlight: '3º trimestre! Olhos se abrem!' },
    30: { baby: 'Tamanho de um repolho (~40cm). O cérebro cresce rapidamente. O bebê acumula gordura e fica mais "fofinho".', body: 'Você precisa urinar com muita frequência. Insônia é comum.', tips: 'Defina o plano de parto com seu médico. Visite a maternidade. Prepare o quarto do bebê.', highlight: 'Cérebro em crescimento rápido!' },
    32: { baby: 'Tamanho de um abacaxi (~42cm). O bebê pratica a respiração. Unhas estão completamente formadas.', body: 'Braxton Hicks mais frequentes. Azia intensa. Dificuldade para respirar profundamente.', tips: 'Coma em porções menores. Deixe a mala da maternidade pronta. Conheça os sinais de trabalho de parto.', highlight: 'Bebê pratica respiração!' },
    34: { baby: 'Tamanho de um melão (~45cm). O sistema imunológico está amadurecendo. O bebê está quase pronto.', body: 'Inchaço é comum. O bebê pode encaixar (cabeça para baixo).', tips: 'Descanse bastante. Mantenha hidratação. Já pode lavar as roupinhas do bebê.', highlight: 'Sistema imune amadurecendo!' },
    36: { baby: 'Tamanho de uma alface romana (~47cm). Pulmões quase maduros. O bebê está na posição de parto (geralmente).', body: 'Você pode sentir pressão pélvica. Consultas semanais começam.', tips: 'Confirme com o médico a posição do bebê. Revise o plano de parto. Instale o bebê-conforto.', highlight: 'Pulmões quase maduros!' },
    38: { baby: 'Tamanho de uma abóbora (~50cm). O bebê é considerado A TERMO! Pronto para nascer a qualquer momento.', body: 'Pode perder o tampão mucoso. Contrações podem se tornar regulares.', tips: 'Fique atenta aos sinais de trabalho de parto: contrações regulares, rompimento da bolsa, sangramento.', highlight: 'Bebê a termo! Pode nascer!' },
    40: { baby: 'Tamanho de uma melancia (~51cm). DIA PREVISTO DO PARTO! Seu bebê está pronto para conhecer o mundo.', body: 'Espera ansiosa. O bebê pode nascer a qualquer momento.', tips: 'Mantenha a calma. Confie no seu corpo. Se passar de 41 semanas, converse com o médico sobre indução.', highlight: 'Pronto(a) para nascer!' }
};

// Baby size data with weight/length for visual comparison
var babySizeData = {
    4: { weight: '< 1g', length: '~2mm' }, 5: { weight: '< 1g', length: '~3mm' },
    6: { weight: '< 1g', length: '~4mm' }, 7: { weight: '< 1g', length: '~8mm' },
    8: { weight: '~1g', length: '~16mm' }, 9: { weight: '~2g', length: '~23mm' },
    10: { weight: '~4g', length: '~31mm' }, 11: { weight: '~7g', length: '~41mm' },
    12: { weight: '~14g', length: '~5cm' }, 13: { weight: '~23g', length: '~7cm' },
    14: { weight: '~43g', length: '~9cm' }, 15: { weight: '~70g', length: '~10cm' },
    16: { weight: '~100g', length: '~12cm' }, 17: { weight: '~140g', length: '~13cm' },
    18: { weight: '~190g', length: '~14cm' }, 19: { weight: '~240g', length: '~15cm' },
    20: { weight: '~300g', length: '~16cm' }, 22: { weight: '~430g', length: '~28cm' },
    24: { weight: '~600g', length: '~30cm' }, 26: { weight: '~760g', length: '~36cm' },
    28: { weight: '~1kg', length: '~38cm' }, 30: { weight: '~1.3kg', length: '~40cm' },
    32: { weight: '~1.7kg', length: '~42cm' }, 34: { weight: '~2.1kg', length: '~45cm' },
    36: { weight: '~2.6kg', length: '~47cm' }, 38: { weight: '~3kg', length: '~50cm' },
    40: { weight: '~3.4kg', length: '~51cm' }
};

function getBabySizeForWeek(week) {
    if (babySizeData[week]) return babySizeData[week];
    var keys = Object.keys(babySizeData).map(Number).sort(function(a, b) { return a - b; });
    for (var i = keys.length - 1; i >= 0; i--) {
        if (keys[i] <= week) return babySizeData[keys[i]];
    }
    return { weight: '--', length: '--' };
}

function renderWeeklyContent() {
    if (!appData.config.dum) return;
    var info = calcWeeksFromDUM(appData.config.dum);
    var week = info.weeks;
    var fruit = getFruitForWeek(week);
    var babySize = getBabySizeForWeek(week);
    var daysLeft = PREGNANCY_DAYS - info.totalDays;
    if (daysLeft < 0) daysLeft = 0;
    var trimester = week < 14 ? 1 : week < 28 ? 2 : 3;

    // Find closest content
    var content = weeklyContent[week];
    if (!content) {
        var keys = Object.keys(weeklyContent).map(Number).sort(function(a, b) { return a - b; });
        for (var i = keys.length - 1; i >= 0; i--) {
            if (keys[i] <= week) { content = weeklyContent[keys[i]]; break; }
        }
    }
    if (!content) content = { baby: 'Seu bebê está crescendo!', body: 'Seu corpo está se adaptando.', tips: 'Cuide-se!', highlight: '' };

    // Todo items by trimester
    var weeklyTodos = {
        1: ['Marcar primeira consulta pré-natal', 'Começar ácido fólico (se ainda não toma)', 'Evitar álcool, cigarro e medicamentos sem orientação', 'Fazer exames de sangue iniciais', 'Agendar ultrassom de translucência nucal (11-14s)'],
        2: ['Agendar ultrassom morfológico (20-24s)', 'Fazer teste de glicose TOTG (24-28s)', 'Começar a preparar o enxoval', 'Pesquisar cursos de preparação para o parto', 'Visitar maternidades'],
        3: ['Preparar mala da maternidade', 'Definir plano de parto com o médico', 'Instalar bebê-conforto no carro', 'Lavar roupinhas do bebê', 'Contar movimentos do bebê (10 em 2h)', 'Agendar estreptococo grupo B (35-37s)']
    };

    var todos = weeklyTodos[trimester] || weeklyTodos[2];

    // Hero card - BIG and visual (like reference app)
    var hero = document.getElementById('weeklyHeroContent');
    var pct = Math.min((info.totalDays / PREGNANCY_DAYS) * 100, 100).toFixed(0);
    // Trimester progress bar colors
    var t1pct = Math.min(Math.max(((week - 0) / 13) * 100, 0), 100);
    var t2pct = Math.min(Math.max(((week - 13) / 14) * 100, 0), 100);
    var t3pct = Math.min(Math.max(((week - 27) / 13) * 100, 0), 100);

    hero.innerHTML =
        '<div style="position:relative;z-index:1;">' +
        // Big circle with week number
        '<div style="width:140px;height:140px;border-radius:50%;background:white;margin:0 auto 10px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,0.15);">' +
            '<div style="font-size:3.2em;font-weight:800;color:var(--pink-600);line-height:1;">' + week + '</div>' +
            '<div style="font-size:0.75em;font-weight:600;color:var(--text-medium);">semanas<br>de gestação</div>' +
        '</div>' +
        // Trimester progress
        '<div style="display:flex;gap:4px;margin:12px auto;max-width:250px;">' +
            '<div style="flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,0.3);overflow:hidden;"><div style="height:100%;width:' + t1pct + '%;background:#f472b6;border-radius:3px;"></div></div>' +
            '<div style="flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,0.3);overflow:hidden;"><div style="height:100%;width:' + t2pct + '%;background:#a855f7;border-radius:3px;"></div></div>' +
            '<div style="flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,0.3);overflow:hidden;"><div style="height:100%;width:' + t3pct + '%;background:#3b82f6;border-radius:3px;"></div></div>' +
        '</div>' +
        '<div style="font-size:0.85em;color:rgba(255,255,255,0.9);">' + trimester + 'º trimestre</div>' +
        '<div style="font-size:1.1em;font-weight:700;color:white;margin-top:6px;">Faltam <span style="font-size:1.4em;">' + daysLeft + '</span> dias!</div>' +
        '</div>';

    // Visual grid cards (2x2 like reference app)
    var gridContainer = document.getElementById('weeklyGridCards');
    gridContainer.innerHTML =
        // Card 1: Tamanho do bebê (fruta)
        '<div class="weekly-grid-card" style="background:linear-gradient(135deg,#fef3c7,#fde68a);" onclick="document.getElementById(\'weeklyBabyCard\').scrollIntoView({behavior:\'smooth\'})">' +
            '<div class="wgc-emoji">' + (fruit ? fruit.emoji : '&#x1F476;') + '</div>' +
            '<div class="wgc-label" style="color:#92400e;">Tamanho do Bebê</div>' +
            (fruit ? '<div class="wgc-value" style="color:#78350f;">' + escapeHtml(fruit.fruit) + ' (' + fruit.size + ')</div>' : '') +
        '</div>' +
        // Card 2: Peso e comprimento
        '<div class="weekly-grid-card" style="background:linear-gradient(135deg,#fce7f3,#fbcfe8);" onclick="document.getElementById(\'weeklyBabyCard\').scrollIntoView({behavior:\'smooth\'})">' +
            '<div class="wgc-emoji">&#x1F476;</div>' +
            '<div class="wgc-label" style="color:var(--pink-700);">Seu Bebê</div>' +
            '<div class="wgc-value" style="color:var(--pink-600);">' + babySize.weight + ' · ' + babySize.length + '</div>' +
        '</div>' +
        // Card 3: Seu corpo
        '<div class="weekly-grid-card" style="background:linear-gradient(135deg,#f3e8ff,#e9d5ff);" onclick="document.getElementById(\'weeklyBodyCard\').scrollIntoView({behavior:\'smooth\'})">' +
            '<div class="wgc-emoji">&#x1F930;</div>' +
            '<div class="wgc-label" style="color:#7c3aed;">Seu Corpo</div>' +
            '<div class="wgc-value" style="color:#6d28d9;">Mudanças da semana</div>' +
        '</div>' +
        // Card 4: Dicas
        '<div class="weekly-grid-card" style="background:linear-gradient(135deg,#dcfce7,#bbf7d0);" onclick="document.getElementById(\'weeklyTipsCard\').scrollIntoView({behavior:\'smooth\'})">' +
            '<div class="wgc-emoji">&#x1F4A1;</div>' +
            '<div class="wgc-label" style="color:#15803d;">Saiba Disso</div>' +
            '<div class="wgc-value" style="color:#166534;">Dicas e curiosidades</div>' +
        '</div>';

    // Baby development - visual comparison card included
    var babyHtml = '<div style="display:flex;gap:14px;align-items:center;margin-bottom:14px;padding:14px;background:linear-gradient(135deg,#fce7f3,#fef3c7);border-radius:16px;">' +
        '<div style="text-align:center;flex-shrink:0;">' +
            '<div style="font-size:3.5em;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.12));">' + (fruit ? fruit.emoji : '') + '</div>' +
            (fruit ? '<div style="font-size:0.75em;font-weight:700;color:#92400e;margin-top:4px;">' + escapeHtml(fruit.fruit) + '</div>' : '') +
        '</div>' +
        '<div style="flex:1;">' +
            '<div style="font-size:0.8em;color:var(--text-light);margin-bottom:4px;">Seu bebê tem o tamanho de</div>' +
            '<div style="display:flex;gap:16px;">' +
                '<div><div style="font-size:1.4em;font-weight:800;color:var(--pink-600);">' + babySize.length + '</div><div style="font-size:0.7em;color:var(--text-light);">comprimento</div></div>' +
                '<div><div style="font-size:1.4em;font-weight:800;color:var(--pink-600);">' + babySize.weight + '</div><div style="font-size:0.7em;color:var(--text-light);">peso</div></div>' +
            '</div>' +
        '</div></div>';
    babyHtml += '<div style="font-size:0.95em;color:var(--text-dark);line-height:1.8;">' + escapeHtml(content.baby) + '</div>';
    babyHtml += '<div style="margin-top:12px;padding:10px 14px;background:var(--pink-50);border-radius:12px;font-size:0.85em;color:var(--pink-700);font-weight:600;">&#x2728; ' + escapeHtml(content.highlight) + '</div>';
    document.getElementById('weeklyHighlights').innerHTML = babyHtml;

    // Body changes
    document.getElementById('weeklyBody').innerHTML =
        '<div style="font-size:0.95em;color:var(--text-dark);line-height:1.8;">' +
            '<div style="font-size:3em;text-align:center;margin-bottom:8px;">&#x1F930;</div>' +
            escapeHtml(content.body) +
        '</div>';

    // Tips
    document.getElementById('weeklyTips').innerHTML =
        '<div style="font-size:0.95em;color:var(--text-dark);line-height:1.8;">' +
            escapeHtml(content.tips) +
        '</div>';

    // Todo list for the trimester
    var todoDiv = document.getElementById('weeklyTodo');
    if (todoDiv) {
        var todoHtml = '';
        var savedTodos = JSON.parse(localStorage.getItem('hadassa_weekly_todos') || '{}');
        todos.forEach(function(todo, i) {
            var key = 't' + trimester + '_' + i;
            var done = !!savedTodos[key];
            todoHtml += '<label style="display:flex;align-items:center;gap:10px;padding:8px 0;font-size:0.88em;cursor:pointer;border-bottom:1px solid var(--pink-50);">' +
                '<input type="checkbox" data-weekly-todo="' + key + '" ' + (done ? 'checked' : '') + ' style="width:20px;height:20px;accent-color:#22c55e;">' +
                '<span style="' + (done ? 'text-decoration:line-through;color:var(--text-light);' : 'color:var(--text-dark);') + '">' + escapeHtml(todo) + '</span>' +
            '</label>';
        });
        todoDiv.innerHTML = todoHtml;

        todoDiv.querySelectorAll('[data-weekly-todo]').forEach(function(cb) {
            cb.addEventListener('change', function() {
                var saved = JSON.parse(localStorage.getItem('hadassa_weekly_todos') || '{}');
                if (cb.checked) saved[cb.dataset.weeklyTodo] = true;
                else delete saved[cb.dataset.weeklyTodo];
                localStorage.setItem('hadassa_weekly_todos', JSON.stringify(saved));
                renderWeeklyContent();
            });
        });
    }
}

// ============ DIARY ============
function getDiaryEntries() {
    var saved = localStorage.getItem('hadassa_diary');
    if (saved) { try { return JSON.parse(saved); } catch(e) {} }
    return [];
}

function saveDiaryEntries(entries) {
    localStorage.setItem('hadassa_diary', JSON.stringify(entries));
}

function renderDiary(tab) {
    tab = tab || 'entries';
    var container = document.getElementById('diaryContent');

    if (tab === 'entries') {
        var entries = getDiaryEntries().sort(function(a, b) { return b.date.localeCompare(a.date); });
        if (entries.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-book"></i><p>Seu diário está vazio.<br>Registre seus pensamentos, sentimentos e momentos especiais!</p></div>';
            return;
        }
        var html = '';
        var moodEmojis = { otima: '\u{1F60D}', bem: '\u{1F60A}', normal: '\u{1F610}', cansada: '\u{1F62A}', triste: '\u{1F622}', ansiosa: '\u{1F630}' };
        entries.forEach(function(e) {
            html += '<div class="card" style="margin-bottom:10px;">';
            html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
            html += '<div style="font-size:0.8em;color:var(--text-light);">' + formatDate(e.date) + '</div>';
            html += '<div style="font-size:1.5em;">' + (moodEmojis[e.mood] || '\u{1F60A}') + '</div>';
            html += '</div>';
            if (e.title) html += '<h4 style="color:var(--pink-600);margin-bottom:6px;">' + escapeHtml(e.title) + '</h4>';
            html += '<p style="font-size:0.85em;color:var(--text-dark);line-height:1.6;white-space:pre-line;">' + escapeHtml(e.text) + '</p>';
            if (e.photoId) {
                html += '<div id="diary-photo-' + escapeHtml(e.id) + '" style="margin-top:8px;border-radius:12px;overflow:hidden;"></div>';
            }
            html += '<div class="actions-row" style="margin-top:8px;">';
            html += '<button class="btn btn-secondary btn-small" data-edit-diary="' + escapeHtml(e.id) + '"><i class="fas fa-edit"></i></button>';
            html += '<button class="btn btn-danger btn-small" data-delete-diary="' + escapeHtml(e.id) + '"><i class="fas fa-trash"></i></button>';
            html += '</div></div>';
        });
        container.innerHTML = html;

        // Load photos
        entries.forEach(function(e) {
            if (e.photoId) {
                loadPhoto(e.photoId).then(function(data) {
                    var photoDiv = document.getElementById('diary-photo-' + e.id);
                    if (photoDiv && data) renderPhoto(photoDiv, data);
                }).catch(function() {});
            }
        });

        // Event listeners
        container.querySelectorAll('[data-edit-diary]').forEach(function(btn) {
            btn.addEventListener('click', function() { editDiaryEntry(btn.dataset.editDiary); });
        });
        container.querySelectorAll('[data-delete-diary]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                showCustomConfirm('Excluir', 'Excluir esta entrada do diário?', '\u{1F5D1}').then(function(ok) {
                    if (!ok) return;
                    var entries = getDiaryEntries().filter(function(e) { return e.id !== btn.dataset.deleteDiary; });
                    saveDiaryEntries(entries);
                    renderDiary('entries');
                });
            });
        });

    } else if (tab === 'bumpPhotos') {
        var entries = getDiaryEntries().filter(function(e) { return e.photoId; });
        if (entries.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-camera"></i><p>Nenhuma foto registrada.<br>Adicione fotos no diário!</p></div>';
            return;
        }
        container.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:8px;" id="bumpGallery"></div>';
        var gallery = document.getElementById('bumpGallery');
        entries.forEach(function(e) {
            var div = document.createElement('div');
            div.style.cssText = 'width:calc(50% - 4px);cursor:pointer;';
            div.innerHTML = '<div style="aspect-ratio:1;border-radius:12px;overflow:hidden;background:var(--pink-50);display:flex;align-items:center;justify-content:center;"><small>Carregando...</small></div><div style="font-size:0.7em;color:var(--text-light);text-align:center;margin-top:4px;">' + formatDate(e.date) + '</div>';
            gallery.appendChild(div);
            loadPhoto(e.photoId).then(function(data) {
                if (data) {
                    var imgDiv = div.querySelector('div');
                    imgDiv.innerHTML = '';
                    var img = document.createElement('img');
                    img.src = data;
                    img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
                    img.addEventListener('click', function() { showFullPhoto(data); });
                    imgDiv.appendChild(img);
                }
            }).catch(function() {});
        });

    } else if (tab === 'babyNames') {
        renderBabyNames(container);
    } else if (tab === 'kicks') {
        renderKickCounterDiary(container);
        return;
    } else if (tab === 'letter') {
        renderLetterToBaby(container);
    } else if (tab === 'contractions') {
        renderContractionCounter(container);
    }
}

function renderKickCounterDiary(container) {
    // Reutilizar o kickCounter existente do app.js
    if (typeof renderKickCounter === 'function') {
        renderKickCounter();
        // Mover o conteúdo do kick counter card para este container
        var kickCard = document.getElementById('kickCounterContent');
        if (kickCard) {
            container.innerHTML = '<div class="card"><div class="card-title"><i class="fas fa-baby"></i> Contador de Chutes</div>' +
                '<p style="font-size:0.8em;color:var(--text-light);margin-bottom:10px;">Método Cardiff: conte 10 movimentos do bebê. Recomendado a partir de 28 semanas.</p>' +
                kickCard.innerHTML + '</div>';
            // Copiar event listeners
            var startBtn = container.querySelector('#kickStartBtn');
            var kickBtn = container.querySelector('#kickBtn');
            var stopBtn = container.querySelector('#kickStopBtn');
            if (startBtn) startBtn.addEventListener('click', function() {
                kickSession.active = true; kickSession.startTime = Date.now(); kickSession.kicks = 0;
                renderKickCounterDiary(container);
            });
            if (kickBtn) kickBtn.addEventListener('click', function() {
                kickSession.kicks++;
                if (kickSession.kicks >= 10) {
                    var minutes = Math.floor((Date.now() - kickSession.startTime) / 60000);
                    var history = getKickHistory();
                    var today = new Date().toISOString().split('T')[0];
                    var existing = history.findIndex(function(h) { return h.date === today; });
                    var entry = { date: today, kicks: kickSession.kicks, minutes: minutes };
                    if (existing !== -1) history[existing] = entry; else history.push(entry);
                    saveKickHistory(history);
                    kickSession.active = false;
                    showCustomAlert('10 movimentos!', kickSession.kicks + ' movimentos em ' + minutes + ' minutos. Bebê ativo!', '\u{1F389}');
                }
                renderKickCounterDiary(container);
            });
            if (stopBtn) stopBtn.addEventListener('click', function() {
                var minutes = Math.floor((Date.now() - kickSession.startTime) / 60000);
                if (kickSession.kicks > 0) {
                    var history = getKickHistory();
                    var today = new Date().toISOString().split('T')[0];
                    var existing = history.findIndex(function(h) { return h.date === today; });
                    var entry = { date: today, kicks: kickSession.kicks, minutes: minutes || 1 };
                    if (existing !== -1) history[existing] = entry; else history.push(entry);
                    saveKickHistory(history);
                }
                kickSession.active = false;
                renderKickCounterDiary(container);
            });
        }
    } else {
        container.innerHTML = '<div class="card"><p>Contador de chutes não disponível.</p></div>';
    }
}

function renderLetterToBaby(container) {
    var letter = getLetterToBaby();
    var html = '<div class="card">';
    html += '<div style="text-align:center;margin-bottom:15px;">';
    html += '<div style="font-size:3em;">\u{1F48C}</div>';
    html += '<h3 style="color:var(--pink-600);font-family:Dancing Script,cursive;font-size:1.5em;">Carta para ' + escapeHtml(appData.config.babyName) + '</h3>';
    html += '<p style="font-size:0.8em;color:var(--text-light);">Escreva uma carta especial para seu bebê ler quando crescer</p>';
    html += '</div>';
    html += '<textarea id="letterText" style="width:100%;min-height:250px;padding:15px;border:2px solid var(--pink-200);border-radius:16px;font-family:Dancing Script,cursive;font-size:1.1em;line-height:1.8;color:var(--text-dark);background:linear-gradient(to bottom, transparent 95%, var(--pink-100) 95%);background-size:100% 2em;" placeholder="Querido(a) ' + escapeHtml(appData.config.babyName) + ',\n\nQuando você ler esta carta...">' + escapeHtml(letter) + '</textarea>';
    html += '<div style="display:flex;gap:8px;margin-top:10px;">';
    html += '<button class="btn btn-primary" id="btnSaveLetter" style="flex:1;"><i class="fas fa-save"></i> Salvar</button>';
    html += '<button class="btn btn-secondary" id="btnPrintLetter" style="flex-shrink:0;"><i class="fas fa-print"></i></button>';
    html += '</div></div>';
    container.innerHTML = html;

    document.getElementById('btnSaveLetter').addEventListener('click', function() {
        saveLetterToBaby(document.getElementById('letterText').value);
        showToast('Carta salva com carinho! \u{1F49C}');
    });

    document.getElementById('btnPrintLetter').addEventListener('click', function() {
        var text = document.getElementById('letterText').value;
        var w = window.open('', '_blank');
        w.document.write('<html><head><title>Carta para ' + escapeHtml(appData.config.babyName) + '</title><style>body{font-family:Georgia,serif;padding:50px;max-width:600px;margin:0 auto;line-height:2;color:#4a2040;}h1{color:#ec4899;text-align:center;font-family:cursive;}</style></head><body><h1>\u{1F48C} Carta para ' + escapeHtml(appData.config.babyName) + '</h1><p style="white-space:pre-line;">' + escapeHtml(text) + '</p><p style="text-align:right;margin-top:30px;color:#ec4899;">Com amor, ' + escapeHtml(appData.config.momName) + '<br>' + formatDate(new Date().toISOString().split('T')[0]) + '</p></body></html>');
        w.document.close();
        w.print();
    });
}

function renderContractionCounter(container) {
    var history = getContractionHistory();
    var html = '<div class="card" style="text-align:center;">';
    html += '<div class="card-title" style="justify-content:center;"><i class="fas fa-stopwatch"></i> Contador de Contrações</div>';
    html += '<p style="font-size:0.8em;color:var(--text-light);margin-bottom:15px;">Registre início e fim de cada contração. O app calcula intervalo e duração.</p>';

    if (!contractionSession.active) {
        html += '<button class="btn btn-primary" id="btnStartContraction" style="width:140px;height:140px;border-radius:50%;font-size:1.2em;margin:15px auto;display:block;box-shadow:0 4px 20px rgba(236,72,153,0.3);">';
        html += '<div style="font-size:2em;">&#x23F1;</div>Iniciar</button>';
    } else {
        var now = Date.now();
        var lastEntry = contractionSession.contractions[contractionSession.contractions.length - 1];
        var isInContraction = lastEntry && !lastEntry.end;

        if (isInContraction) {
            // Currently timing a contraction
            var elapsed = Math.floor((now - lastEntry.start) / 1000);
            html += '<div style="font-size:0.9em;color:#dc2626;font-weight:700;margin-bottom:8px;">&#x1F534; Contração em andamento: ' + elapsed + 's</div>';
            html += '<button class="btn btn-danger" id="btnEndContraction" style="width:130px;height:130px;border-radius:50%;font-size:1em;margin:10px auto;display:block;box-shadow:0 4px 20px rgba(220,38,38,0.4);">';
            html += '<div style="font-size:1.8em;">&#x1F6D1;</div>Parou!</button>';
        } else {
            // Between contractions
            var lastEnd = lastEntry ? lastEntry.end : contractionSession.sessionStart;
            var sinceLastEnd = Math.floor((now - lastEnd) / 1000);
            var min = Math.floor(sinceLastEnd / 60);
            var sec = sinceLastEnd % 60;
            html += '<div style="font-size:0.85em;color:var(--text-medium);margin-bottom:6px;">Desde a última: <strong style="font-size:1.3em;color:var(--pink-600);">' + min + ':' + (sec < 10 ? '0' : '') + sec + '</strong></div>';
            html += '<div style="font-size:1.3em;font-weight:800;color:var(--pink-500);margin-bottom:8px;">' + contractionSession.contractions.length + ' contrações registradas</div>';
            html += '<button class="btn btn-primary" id="btnNewContraction" style="width:130px;height:130px;border-radius:50%;font-size:1em;margin:10px auto;display:block;box-shadow:0 4px 20px rgba(236,72,153,0.4);">';
            html += '<div style="font-size:1.8em;">&#x1F4A5;</div>Contração!</button>';
        }
        html += '<button class="btn btn-secondary btn-small" id="btnStopContractions" style="margin-top:12px;">&#x23F9; Encerrar sessão</button>';
    }

    // Session detail table
    if (contractionSession.contractions && contractionSession.contractions.length > 0) {
        html += '<div style="margin-top:18px;text-align:left;">';
        html += '<div style="font-size:0.85em;font-weight:700;color:var(--pink-600);margin-bottom:8px;">Registro desta sessão:</div>';
        html += '<table class="params-table" style="font-size:0.78em;width:100%;"><thead><tr><th>#</th><th>Horário</th><th>Duração</th><th>Intervalo</th></tr></thead><tbody>';

        contractionSession.contractions.forEach(function(c, i) {
            var time = new Date(c.start);
            var timeStr = (time.getHours() < 10 ? '0' : '') + time.getHours() + ':' + (time.getMinutes() < 10 ? '0' : '') + time.getMinutes() + ':' + (time.getSeconds() < 10 ? '0' : '') + time.getSeconds();
            var duration = c.end ? Math.floor((c.end - c.start) / 1000) + 's' : '...';
            var interval = '--';
            if (i > 0 && contractionSession.contractions[i-1].start) {
                var intSecs = Math.floor((c.start - contractionSession.contractions[i-1].start) / 1000);
                interval = Math.floor(intSecs / 60) + 'min ' + (intSecs % 60) + 's';
            }
            html += '<tr><td>' + (i+1) + '</td><td>' + timeStr + '</td><td>' + duration + '</td><td>' + interval + '</td></tr>';
        });
        html += '</tbody></table>';

        // Average calculations
        if (contractionSession.contractions.length >= 2) {
            var totalInterval = 0, countIntervals = 0, totalDuration = 0, countDurations = 0;
            contractionSession.contractions.forEach(function(c, i) {
                if (c.end) { totalDuration += (c.end - c.start); countDurations++; }
                if (i > 0) { totalInterval += (c.start - contractionSession.contractions[i-1].start); countIntervals++; }
            });
            var avgInt = countIntervals > 0 ? Math.floor(totalInterval / countIntervals / 1000) : 0;
            var avgDur = countDurations > 0 ? Math.floor(totalDuration / countDurations / 1000) : 0;
            html += '<div style="margin-top:10px;padding:10px;background:var(--pink-50);border-radius:12px;font-size:0.85em;">';
            html += '<strong>Intervalo médio:</strong> ' + Math.floor(avgInt/60) + 'min ' + (avgInt%60) + 's<br>';
            html += '<strong>Duração média:</strong> ' + avgDur + ' segundos';
            html += '</div>';

            if (avgInt > 0 && avgInt <= 300) { // 5 min or less
                html += '<div style="margin-top:8px;padding:12px;background:#fef2f2;border-radius:12px;font-size:0.9em;color:#dc2626;font-weight:700;">&#x1F6A8; Contrações regulares a cada 5 min ou menos! Considere ir ao hospital.</div>';
            }
        }
        html += '</div>';
    }

    // Past sessions history with delete
    if (history.length > 0) {
        html += '<div style="margin-top:18px;text-align:left;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><div style="font-size:0.85em;font-weight:700;color:var(--text-light);">&#x1F4C5; Sessões anteriores:</div><button class="btn btn-danger btn-small" id="btnClearContractions" style="font-size:0.7em;">Limpar tudo</button></div>';
        html += '<table class="params-table" style="font-size:0.75em;width:100%;"><thead><tr><th>Data</th><th>Hora</th><th>Qnt</th><th>Intervalo</th><th>Duração</th><th></th></tr></thead><tbody>';
        history.slice(-10).reverse().forEach(function(h, idx) {
            var realIdx = history.length - 1 - idx;
            html += '<tr><td>' + formatDate(h.date) + '</td><td>' + (h.time || '--') + '</td><td>' + h.count + '</td><td>' + h.avgInterval + 'min</td><td>' + (h.avgDuration || '--') + 's</td>';
            html += '<td><button data-del-contraction="' + realIdx + '" style="background:none;border:none;cursor:pointer;color:#dc2626;font-size:0.9em;"><i class="fas fa-trash"></i></button></td></tr>';
        });
        html += '</tbody></table></div>';
    }

    html += '</div>';
    container.innerHTML = html;

    // Event listeners
    var startBtn = document.getElementById('btnStartContraction');
    var newBtn = document.getElementById('btnNewContraction');
    var endBtn = document.getElementById('btnEndContraction');
    var stopBtn = document.getElementById('btnStopContractions');

    if (startBtn) {
        startBtn.addEventListener('click', function() {
            contractionSession.active = true;
            contractionSession.sessionStart = Date.now();
            contractionSession.contractions = [{ start: Date.now(), end: null }];
            renderContractionCounter(container);
        });
    }
    if (newBtn) {
        newBtn.addEventListener('click', function() {
            contractionSession.contractions.push({ start: Date.now(), end: null });
            renderContractionCounter(container);
        });
    }
    if (endBtn) {
        endBtn.addEventListener('click', function() {
            var last = contractionSession.contractions[contractionSession.contractions.length - 1];
            if (last && !last.end) last.end = Date.now();
            renderContractionCounter(container);
        });
    }
    if (stopBtn) {
        stopBtn.addEventListener('click', function() {
            // End any ongoing contraction
            var last = contractionSession.contractions[contractionSession.contractions.length - 1];
            if (last && !last.end) last.end = Date.now();

            // Save to history
            if (contractionSession.contractions.length > 0) {
                var totalInterval = 0, countInt = 0, totalDur = 0, countDur = 0;
                contractionSession.contractions.forEach(function(c, i) {
                    if (c.end) { totalDur += (c.end - c.start); countDur++; }
                    if (i > 0) { totalInterval += (c.start - contractionSession.contractions[i-1].start); countInt++; }
                });
                var startTime = new Date(contractionSession.sessionStart);
                var history = getContractionHistory();
                history.push({
                    date: new Date().toISOString().split('T')[0],
                    time: (startTime.getHours() < 10 ? '0' : '') + startTime.getHours() + ':' + (startTime.getMinutes() < 10 ? '0' : '') + startTime.getMinutes(),
                    count: contractionSession.contractions.length,
                    avgInterval: countInt > 0 ? Math.floor(totalInterval / countInt / 60000) : 0,
                    avgDuration: countDur > 0 ? Math.floor(totalDur / countDur / 1000) : 0,
                    details: contractionSession.contractions.map(function(c) {
                        return { start: c.start, end: c.end, duration: c.end ? Math.floor((c.end - c.start) / 1000) : 0 };
                    })
                });
                saveContractionHistory(history);
            }
            contractionSession.active = false;
            contractionSession.contractions = [];
            showToast('Sessão salva!');
            renderContractionCounter(container);
        });
    }

    // Delete individual session
    container.querySelectorAll('[data-del-contraction]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var hist = getContractionHistory();
            hist.splice(parseInt(btn.dataset.delContraction), 1);
            saveContractionHistory(hist);
            renderContractionCounter(container);
        });
    });

    // Clear all sessions
    var clearBtn = document.getElementById('btnClearContractions');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            showCustomConfirm('Limpar Histórico', 'Excluir todas as sessões de contrações?', '\u{1F5D1}').then(function(ok) {
                if (!ok) return;
                saveContractionHistory([]);
                renderContractionCounter(container);
            });
        });
    }

    // Auto-refresh every 1s when active
    if (contractionSession.active) {
        setTimeout(function() {
            var currentTab = document.querySelector('.sub-tab[data-diarytab].active');
            if (currentTab && currentTab.dataset.diarytab === 'contractions') {
                renderContractionCounter(container);
            }
        }, 1000);
    }
}

function editDiaryEntry(id) {
    var entries = getDiaryEntries();
    var entry = entries.find(function(e) { return e.id === id; });
    if (!entry) return;
    document.getElementById('diaryEditId').value = entry.id;
    document.getElementById('diaryTitle').value = entry.title || '';
    document.getElementById('diaryDate').value = entry.date;
    document.getElementById('diaryText').value = entry.text;
    document.getElementById('diaryMood').value = entry.mood || '';
    // Highlight selected mood
    document.querySelectorAll('.mood-btn').forEach(function(b) { b.classList.remove('active'); });
    var moodBtn = document.querySelector('.mood-btn[data-mood="' + entry.mood + '"]');
    if (moodBtn) moodBtn.classList.add('active');
    openModal('diaryModal');
}

function saveDiaryEntry(e) {
    e.preventDefault();
    var editId = document.getElementById('diaryEditId').value;
    var photoPreview = document.getElementById('diaryPhotoPreview');
    var photoId = photoPreview.dataset.photoId || null;

    var entry = {
        id: editId || genId(),
        date: document.getElementById('diaryDate').value || new Date().toISOString().split('T')[0],
        title: document.getElementById('diaryTitle').value,
        text: document.getElementById('diaryText').value,
        mood: document.getElementById('diaryMood').value || 'normal',
        photoId: photoId
    };

    var entries = getDiaryEntries();
    if (editId) {
        var idx = entries.findIndex(function(e) { return e.id === editId; });
        if (idx !== -1) { entry.photoId = entry.photoId || entries[idx].photoId; entries[idx] = entry; }
    } else {
        entries.push(entry);
    }

    saveDiaryEntries(entries);
    closeModal('diaryModal', true);
    showToast('Salvo no diário!');
    renderDiary('entries');
}

// ============ BABY NAMES ============
function getBabyNames() {
    var saved = localStorage.getItem('hadassa_baby_names');
    if (saved) { try { return JSON.parse(saved); } catch(e) {} }
    return [];
}

function saveBabyNames(names) {
    localStorage.setItem('hadassa_baby_names', JSON.stringify(names));
}

// Banco de sugestões de nomes por categoria
var nameSuggestions = {
    'Bíblicos Femininos': ['Sara', 'Rebeca', 'Raquel', 'Ester', 'Rute', 'Miriã', 'Débora', 'Ana', 'Maria', 'Madalena', 'Lídia', 'Abigail', 'Noemi', 'Hadassa', 'Dalila', 'Eva', 'Judite', 'Salomé'],
    'Bíblicos Masculinos': ['Davi', 'Samuel', 'Daniel', 'Gabriel', 'Miguel', 'Rafael', 'Isaac', 'Jacó', 'José', 'Moisés', 'Elias', 'Josué', 'Mateus', 'Lucas', 'Tiago', 'Pedro', 'Paulo', 'Benjamim'],
    'Hebraicos Femininos': ['Hadassa', 'Ariel', 'Talita', 'Naomi', 'Shira', 'Yael', 'Tália', 'Adah', 'Eliana', 'Liora', 'Moriah', 'Noa', 'Tamara', 'Zara', 'Aya', 'Maya', 'Keren'],
    'Hebraicos Masculinos': ['Ethan', 'Noah', 'Levi', 'Aron', 'Ezra', 'Asher', 'Ari', 'Elan', 'Gideon', 'Tobias', 'Uriel', 'Zion', 'Eli', 'Ilan', 'Jonah', 'Ruben', 'Seth'],
    'Populares Femininos': ['Helena', 'Alice', 'Laura', 'Valentina', 'Sophia', 'Isabella', 'Manuela', 'Júlia', 'Heloísa', 'Lívia', 'Cecília', 'Aurora', 'Liz', 'Marina', 'Clara', 'Beatriz', 'Olivia', 'Isis', 'Mel', 'Luna'],
    'Populares Masculinos': ['Miguel', 'Arthur', 'Heitor', 'Theo', 'Davi', 'Bernardo', 'Noah', 'Gabriel', 'Samuel', 'Lorenzo', 'Benjamin', 'Matheus', 'Lucas', 'Henrique', 'Rafael', 'Pedro', 'Nicolas', 'Enzo', 'Liam'],
    'Clássicos Femininos': ['Beatriz', 'Carolina', 'Fernanda', 'Gabriela', 'Letícia', 'Mariana', 'Natália', 'Patricia', 'Renata', 'Tatiana', 'Vivian', 'Camila', 'Daniela', 'Priscila'],
    'Clássicos Masculinos': ['Alexandre', 'Eduardo', 'Felipe', 'Guilherme', 'Leonardo', 'Marcelo', 'Ricardo', 'Rodrigo', 'Thiago', 'Vicente', 'Antônio', 'Fernando', 'Carlos'],
    'Diferentes/Únicos': ['Amora', 'Celeste', 'Elara', 'Flora', 'Gaia', 'Iris', 'Jade', 'Kiara', 'Lara', 'Olívia', 'Serena', 'Yara', 'Zaya', 'Axel', 'Bento', 'Caleb', 'Dante', 'Enzo', 'Fox', 'Gael', 'Ian', 'Kai', 'Ravi']
};

function renderBabyNames(container) {
    var myNames = getBabyNames();
    var activeCategory = container.dataset.activeNameCat || '';

    var html = '';

    // My favorites section
    html += '<div class="card">';
    html += '<div class="card-title"><i class="fas fa-heart"></i> Meus Favoritos (' + myNames.length + ')</div>';
    html += '<div style="display:flex;gap:8px;margin-bottom:12px;">';
    html += '<input type="text" id="newBabyName" placeholder="Adicionar nome personalizado..." style="flex:1;padding:10px;border:2px solid var(--pink-200);border-radius:12px;font-family:Nunito,sans-serif;">';
    html += '<button class="btn btn-primary" id="btnAddName" style="flex-shrink:0;"><i class="fas fa-plus"></i></button></div>';

    if (myNames.length > 0) {
        html += '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
        myNames.forEach(function(n, i) {
            html += '<div style="display:flex;align-items:center;gap:6px;padding:8px 14px;background:' + (n.liked ? 'linear-gradient(135deg,var(--pink-100),var(--purple-100))' : 'var(--pink-50)') + ';border-radius:20px;font-size:0.88em;transition:all 0.2s;">';
            html += '<button data-like-name="' + i + '" style="background:none;border:none;cursor:pointer;font-size:1.2em;transition:transform 0.2s;">' + (n.liked ? '\u{2764}\u{FE0F}' : '\u{1F90D}') + '</button>';
            html += '<span style="color:var(--text-dark);font-weight:600;">' + escapeHtml(n.name) + '</span>';
            html += '<button data-remove-name="' + i + '" style="background:none;border:none;cursor:pointer;color:var(--text-light);font-size:0.8em;opacity:0.6;"><i class="fas fa-times"></i></button>';
            html += '</div>';
        });
        html += '</div>';
    } else {
        html += '<p style="font-size:0.82em;color:var(--text-light);text-align:center;">Toque no \u{2764}\u{FE0F} nas sugestões abaixo para adicionar aos favoritos</p>';
    }
    html += '</div>';

    // Suggestions by category
    html += '<div class="card"><div class="card-title"><i class="fas fa-lightbulb"></i> Sugestões de Nomes</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:15px;">';
    Object.keys(nameSuggestions).forEach(function(cat) {
        var isActive = activeCategory === cat;
        html += '<button class="name-cat-btn' + (isActive ? ' active' : '') + '" data-name-cat="' + escapeHtml(cat) + '" style="padding:6px 14px;border-radius:20px;border:2px solid ' + (isActive ? 'var(--pink-400)' : 'var(--pink-100)') + ';background:' + (isActive ? 'var(--pink-100)' : 'white') + ';font-family:Nunito,sans-serif;font-size:0.75em;font-weight:600;color:' + (isActive ? 'var(--pink-600)' : 'var(--text-medium)') + ';cursor:pointer;transition:all 0.2s;">';
        html += escapeHtml(cat) + '</button>';
    });
    html += '</div>';

    // Show names for active category
    if (activeCategory && nameSuggestions[activeCategory]) {
        html += '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
        nameSuggestions[activeCategory].forEach(function(name) {
            var isSaved = myNames.some(function(n) { return n.name === name; });
            html += '<button data-add-suggestion="' + escapeHtml(name) + '" style="padding:8px 16px;border-radius:20px;border:2px solid ' + (isSaved ? 'var(--pink-400)' : 'var(--pink-200)') + ';background:' + (isSaved ? 'linear-gradient(135deg,var(--pink-100),var(--purple-100))' : 'white') + ';font-family:Nunito,sans-serif;font-size:0.85em;font-weight:600;color:' + (isSaved ? 'var(--pink-600)' : 'var(--text-dark)') + ';cursor:pointer;transition:all 0.2s;">';
            html += (isSaved ? '\u{2764}\u{FE0F} ' : '') + escapeHtml(name);
            html += '</button>';
        });
        html += '</div>';
    } else {
        html += '<p style="font-size:0.82em;color:var(--text-light);text-align:center;">Selecione uma categoria acima para ver sugestões</p>';
    }
    html += '</div>';

    container.innerHTML = html;

    // Event listeners
    document.getElementById('btnAddName').addEventListener('click', function() {
        var input = document.getElementById('newBabyName');
        var name = input.value.trim();
        if (!name) return;
        var names = getBabyNames();
        if (!names.some(function(n) { return n.name === name; })) {
            names.push({ name: name, liked: true });
            saveBabyNames(names);
        }
        input.value = '';
        container.dataset.activeNameCat = activeCategory;
        renderDiary('babyNames');
    });

    container.querySelectorAll('[data-like-name]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var names = getBabyNames();
            var idx = parseInt(btn.dataset.likeName);
            names[idx].liked = !names[idx].liked;
            saveBabyNames(names);
            container.dataset.activeNameCat = activeCategory;
            renderDiary('babyNames');
        });
    });

    container.querySelectorAll('[data-remove-name]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var names = getBabyNames();
            names.splice(parseInt(btn.dataset.removeName), 1);
            saveBabyNames(names);
            container.dataset.activeNameCat = activeCategory;
            renderDiary('babyNames');
        });
    });

    container.querySelectorAll('[data-name-cat]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            container.dataset.activeNameCat = btn.dataset.nameCat;
            renderBabyNames(container);
        });
    });

    container.querySelectorAll('[data-add-suggestion]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var name = btn.dataset.addSuggestion;
            var names = getBabyNames();
            var existingIdx = names.findIndex(function(n) { return n.name === name; });
            if (existingIdx !== -1) {
                names.splice(existingIdx, 1); // Toggle off
            } else {
                names.push({ name: name, liked: true }); // Add
            }
            saveBabyNames(names);
            container.dataset.activeNameCat = activeCategory;
            renderBabyNames(container);
        });
    });
}

// ============ SYMPTOMS FULL (with categories) ============
var symptomCategoriesFull = {
    humor: { label: 'Humor', icon: '\u{1F60A}', items: [
        { id: 'feliz', label: 'Feliz', icon: '\u{1F60A}' }, { id: 'ansiosa', label: 'Ansiosa', icon: '\u{1F630}' },
        { id: 'irritada', label: 'Irritada', icon: '\u{1F620}' }, { id: 'chorosa', label: 'Chorosa', icon: '\u{1F622}' },
        { id: 'calma', label: 'Calma', icon: '\u{1F60C}' }, { id: 'estressada', label: 'Estressada', icon: '\u{1F624}' }
    ]},
    sintomas: { label: 'Sintomas', icon: '\u{1FA7A}', items: [
        { id: 'nausea', label: 'Náusea', icon: '\u{1F922}' }, { id: 'vomito', label: 'Vômito', icon: '\u{1F92E}' },
        { id: 'dor_cabeca', label: 'Dor de Cabeça', icon: '\u{1F915}' }, { id: 'tontura', label: 'Tontura', icon: '\u{1F4AB}' },
        { id: 'dor_lombar', label: 'Dor Lombar', icon: '\u{1F9B4}' }, { id: 'caibra', label: 'Câibra', icon: '\u{26A1}' },
        { id: 'insonia', label: 'Insônia', icon: '\u{1F634}' }, { id: 'fadiga', label: 'Fadiga', icon: '\u{1F62A}' },
        { id: 'contracao', label: 'Contração', icon: '\u{1F4A5}' }, { id: 'falta_ar', label: 'Falta de Ar', icon: '\u{1F4A8}' }
    ]},
    secrecao: { label: 'Secreção Vaginal', icon: '\u{1F4A7}', items: [
        { id: 'sec_normal', label: 'Normal', icon: '\u{2705}' }, { id: 'sec_aumentada', label: 'Aumentada', icon: '\u{1F4A7}' },
        { id: 'sec_cor', label: 'Com cor', icon: '\u{26A0}\u{FE0F}' }, { id: 'sec_odor', label: 'Com odor', icon: '\u{1F443}' },
        { id: 'sangramento', label: 'Sangramento', icon: '\u{1F6A8}' }
    ]},
    apetite: { label: 'Apetite', icon: '\u{1F34E}', items: [
        { id: 'apetite_normal', label: 'Normal', icon: '\u{1F60B}' }, { id: 'sem_apetite', label: 'Sem apetite', icon: '\u{1F636}' },
        { id: 'muita_fome', label: 'Muita fome', icon: '\u{1F924}' }, { id: 'desejo', label: 'Desejo', icon: '\u{1F36B}' },
        { id: 'aversao', label: 'Aversão', icon: '\u{1F922}' }
    ]},
    digestao: { label: 'Digestão e Fezes', icon: '\u{1F4A9}', items: [
        { id: 'azia', label: 'Azia', icon: '\u{1F525}' }, { id: 'refluxo', label: 'Refluxo', icon: '\u{1F4A2}' },
        { id: 'gases', label: 'Gases', icon: '\u{1F4A8}' }, { id: 'constipacao', label: 'Constipação', icon: '\u{1F615}' },
        { id: 'diarreia', label: 'Diarreia', icon: '\u{1F4A9}' }
    ]},
    edema: { label: 'Edema', icon: '\u{1F9B6}', items: [
        { id: 'edema_pes', label: 'Pés', icon: '\u{1F9B6}' }, { id: 'edema_maos', label: 'Mãos', icon: '\u{270B}' },
        { id: 'edema_rosto', label: 'Rosto', icon: '\u{1F610}' }, { id: 'edema_pernas', label: 'Pernas', icon: '\u{1F9B5}' }
    ]},
    atividade: { label: 'Atividade Física', icon: '\u{1F3C3}', items: [
        { id: 'caminhada', label: 'Caminhada', icon: '\u{1F6B6}' }, { id: 'yoga', label: 'Yoga', icon: '\u{1F9D8}' },
        { id: 'natacao', label: 'Natação', icon: '\u{1F3CA}' }, { id: 'pilates', label: 'Pilates', icon: '\u{1F9CD}' },
        { id: 'descanso', label: 'Dia de descanso', icon: '\u{1F6CB}\u{FE0F}' }
    ]},
    sexo: { label: 'Intimidade', icon: '\u{1F49C}', items: [
        { id: 'libido_alta', label: 'Libido alta', icon: '\u{1F525}' }, { id: 'libido_baixa', label: 'Libido baixa', icon: '\u{1F4A4}' },
        { id: 'relacao', label: 'Relação', icon: '\u{1F49C}' }
    ]},
    outros: { label: 'Outros', icon: '\u{2795}', items: [] }
};

function renderSymptomsSection(tab) {
    tab = tab || 'register';
    var container = document.getElementById('symptomsFullContent');
    var log = getSymptomLog();
    var today = new Date().toISOString().split('T')[0];

    if (tab === 'register') {
        var todayEntries = log.filter(function(s) { return s.date === today; });
        var html = '<div style="margin-bottom:10px;text-align:center;font-size:0.8em;color:var(--text-light);">' + formatDate(today) + ' — toque para registrar, toque novamente para aumentar intensidade</div>';

        Object.keys(symptomCategoriesFull).forEach(function(catKey) {
            var cat = symptomCategoriesFull[catKey];
            html += '<div class="card" style="margin-bottom:8px;">';
            html += '<div style="font-size:0.85em;font-weight:700;color:var(--pink-600);margin-bottom:8px;">' + cat.icon + ' ' + escapeHtml(cat.label) + '</div>';
            html += '<div style="display:flex;flex-wrap:wrap;gap:6px;">';

            cat.items.forEach(function(item) {
                var entry = todayEntries.find(function(s) { return s.symptom === item.id; });
                var intensity = entry ? entry.intensity : 0;
                html += '<button class="symptom-btn' + (intensity > 0 ? ' active' : '') + '" data-symptom-full="' + item.id + '" title="' + escapeHtml(item.label) + '">';
                html += '<span style="font-size:1.2em;">' + item.icon + '</span>';
                html += '<span style="font-size:0.55em;display:block;">' + escapeHtml(item.label) + '</span>';
                if (intensity > 0) html += '<span style="font-size:0.5em;color:var(--pink-600);">' + '\u{2B50}'.repeat(intensity) + '</span>';
                html += '</button>';
            });

            // "Adicionar outro" for "outros" category
            if (catKey === 'outros') {
                html += '<div style="width:100%;margin-top:6px;display:flex;gap:6px;">';
                html += '<input type="text" id="customSymptom" placeholder="Outro sintoma..." style="flex:1;padding:8px;border:2px solid var(--pink-200);border-radius:10px;font-size:0.8em;font-family:Nunito,sans-serif;">';
                html += '<button class="btn btn-primary btn-small" id="btnAddCustomSymptom"><i class="fas fa-plus"></i></button>';
                html += '</div>';

                // Show custom symptoms
                var customSymptoms = getCustomSymptoms();
                customSymptoms.forEach(function(cs) {
                    var entry = todayEntries.find(function(s) { return s.symptom === 'custom_' + cs; });
                    var intensity = entry ? entry.intensity : 0;
                    html += '<button class="symptom-btn' + (intensity > 0 ? ' active' : '') + '" data-symptom-full="custom_' + escapeHtml(cs) + '">';
                    html += '<span style="font-size:1.2em;">\u{1F4DD}</span>';
                    html += '<span style="font-size:0.55em;display:block;">' + escapeHtml(cs) + '</span>';
                    if (intensity > 0) html += '<span style="font-size:0.5em;color:var(--pink-600);">' + '\u{2B50}'.repeat(intensity) + '</span>';
                    html += '</button>';
                });
            }

            html += '</div></div>';
        });

        container.innerHTML = html;

        // Event listeners
        container.querySelectorAll('[data-symptom-full]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var symptomId = btn.dataset.symptomFull;
                var log = getSymptomLog();
                var existingIdx = log.findIndex(function(s) { return s.date === today && s.symptom === symptomId; });
                if (existingIdx !== -1) {
                    if (log[existingIdx].intensity >= 3) log.splice(existingIdx, 1);
                    else log[existingIdx].intensity++;
                } else {
                    log.push({ date: today, symptom: symptomId, intensity: 1 });
                }
                saveSymptomLog(log);
                renderSymptomsSection('register');
            });
        });

        var addBtn = document.getElementById('btnAddCustomSymptom');
        if (addBtn) {
            addBtn.addEventListener('click', function() {
                var input = document.getElementById('customSymptom');
                var name = input.value.trim();
                if (!name) return;
                var customs = getCustomSymptoms();
                if (!customs.includes(name)) {
                    customs.push(name);
                    saveCustomSymptoms(customs);
                }
                input.value = '';
                renderSymptomsSection('register');
            });
        }

    } else if (tab === 'history') {
        // History with heatmap
        var html = '<div class="card"><div class="card-title"><i class="fas fa-calendar"></i> Histórico de Sintomas</div>';
        html += '<div style="overflow-x:auto;"><table class="params-table" style="font-size:0.75em;"><thead><tr><th>Data</th><th>Sintomas</th><th>Total</th></tr></thead><tbody>';

        var grouped = {};
        log.forEach(function(s) {
            if (!grouped[s.date]) grouped[s.date] = [];
            grouped[s.date].push(s);
        });

        Object.keys(grouped).sort().reverse().slice(0, 30).forEach(function(date) {
            var items = grouped[date];
            var total = items.reduce(function(sum, s) { return sum + s.intensity; }, 0);
            var sympNames = items.map(function(s) { return s.symptom.replace('custom_', '') + '(' + s.intensity + ')'; }).join(', ');
            html += '<tr><td>' + formatDate(date) + '</td><td>' + escapeHtml(sympNames) + '</td><td>' + total + '</td></tr>';
        });

        html += '</tbody></table></div></div>';
        container.innerHTML = html;
    }
}

function getCustomSymptoms() {
    var saved = localStorage.getItem('hadassa_custom_symptoms');
    if (saved) { try { return JSON.parse(saved); } catch(e) {} }
    return [];
}

function saveCustomSymptoms(list) {
    localStorage.setItem('hadassa_custom_symptoms', JSON.stringify(list));
}

// ============ EXAMS SECTION ============
function getExams() {
    var saved = localStorage.getItem('hadassa_exams');
    if (saved) { try { return JSON.parse(saved); } catch(e) {} }
    return [];
}

function saveExams(exams) {
    localStorage.setItem('hadassa_exams', JSON.stringify(exams));
}

function saveExamEntry(e) {
    e.preventDefault();
    var editId = document.getElementById('examEditId').value;
    var preview = document.getElementById('examFilePreview');

    var exam = {
        id: editId || genId(),
        type: document.getElementById('examType').value,
        title: document.getElementById('examTitle').value,
        date: document.getElementById('examDate').value,
        doctor: document.getElementById('examDoctor').value,
        lab: document.getElementById('examLab').value,
        results: document.getElementById('examResults').value,
        status: document.getElementById('examStatus').value,
        scheduledDate: document.getElementById('examScheduledDate').value,
        fileId: preview.dataset.photoId || null
    };

    var exams = getExams();
    if (editId) {
        var idx = exams.findIndex(function(ex) { return ex.id === editId; });
        if (idx !== -1) { exam.fileId = exam.fileId || exams[idx].fileId; exams[idx] = exam; }
    } else {
        exams.push(exam);
    }

    saveExams(exams);
    closeModal('examModal', true);
    showToast('Exame salvo!');
    renderExamsSection();
}

function renderExamsSection(filter) {
    filter = filter || 'all';
    var container = document.getElementById('examsContent');
    var exams = getExams();

    if (filter === 'schedule') {
        var scheduled = exams.filter(function(ex) { return ex.status === 'scheduled' || ex.status === 'pending'; });
        if (scheduled.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-plus"></i><p>Nenhum exame agendado</p></div>';
            return;
        }
        var html = '';
        scheduled.sort(function(a, b) { return (a.scheduledDate || a.date).localeCompare(b.scheduledDate || b.date); }).forEach(function(ex) {
            html += renderExamCard(ex);
        });
        container.innerHTML = html;
        attachExamListeners(container);
        return;
    }

    if (filter !== 'all') exams = exams.filter(function(ex) { return ex.type === filter; });

    exams.sort(function(a, b) { return b.date.localeCompare(a.date); });

    if (exams.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-file-medical"></i><p>Nenhum exame registrado</p></div>';
        return;
    }

    var html = '';
    exams.forEach(function(ex) { html += renderExamCard(ex); });
    container.innerHTML = html;
    attachExamListeners(container);
}

function renderExamCard(ex) {
    var typeLabels = { blood: '\u{1FA78} Sangue', routine: '\u{1F9EA} Rotina', glucose: '\u{1F4C9} Glicemia', us: '\u{1F476} US', prescription: '\u{1F48A} Receita', diet: '\u{1F34E} Dieta', other: '\u{1F4CB} Outro' };
    var statusLabels = { done: '\u{2705} Realizado', scheduled: '\u{1F4C5} Agendado', pending: '\u{23F3} Pendente' };

    var html = '<div class="card" style="margin-bottom:8px;">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;">';
    html += '<div>';
    html += '<div style="font-size:0.7em;color:var(--text-light);">' + formatDate(ex.date) + '</div>';
    html += '<h4 style="color:var(--pink-600);margin:4px 0;">' + escapeHtml(ex.title) + '</h4>';
    html += '<div style="font-size:0.75em;color:var(--text-medium);">' + (typeLabels[ex.type] || ex.type) + ' | ' + (statusLabels[ex.status] || ex.status) + '</div>';
    html += '</div></div>';

    if (ex.doctor) html += '<p style="font-size:0.8em;color:var(--text-medium);margin-top:6px;">Dr(a). ' + escapeHtml(ex.doctor) + (ex.lab ? ' | ' + escapeHtml(ex.lab) : '') + '</p>';
    if (ex.results) html += '<p style="font-size:0.8em;color:var(--text-dark);margin-top:6px;white-space:pre-line;background:var(--pink-50);padding:8px;border-radius:8px;">' + escapeHtml(ex.results) + '</p>';
    if (ex.scheduledDate && ex.status !== 'done') html += '<p style="font-size:0.8em;color:var(--pink-600);margin-top:4px;"><i class="fas fa-clock"></i> Agendado: ' + formatDate(ex.scheduledDate) + '</p>';
    if (ex.fileId) html += '<div id="exam-file-' + escapeHtml(ex.id) + '" style="margin-top:8px;"><small style="color:var(--text-light);">Carregando anexo...</small></div>';

    html += '<div class="actions-row" style="margin-top:8px;">';
    html += '<button class="btn btn-secondary btn-small" data-edit-exam="' + escapeHtml(ex.id) + '"><i class="fas fa-edit"></i> Editar</button>';
    html += '<button class="btn btn-danger btn-small" data-delete-exam="' + escapeHtml(ex.id) + '"><i class="fas fa-trash"></i></button>';
    html += '</div></div>';

    return html;
}

function attachExamListeners(container) {
    var exams = getExams();
    // Load file previews
    exams.forEach(function(ex) {
        if (ex.fileId) {
            loadPhoto(ex.fileId).then(function(data) {
                var div = document.getElementById('exam-file-' + ex.id);
                if (div && data) renderPhoto(div, data);
            }).catch(function() {});
        }
    });

    container.querySelectorAll('[data-edit-exam]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var ex = exams.find(function(e) { return e.id === btn.dataset.editExam; });
            if (!ex) return;
            document.getElementById('examEditId').value = ex.id;
            document.getElementById('examType').value = ex.type;
            document.getElementById('examTitle').value = ex.title;
            document.getElementById('examDate').value = ex.date;
            document.getElementById('examDoctor').value = ex.doctor || '';
            document.getElementById('examLab').value = ex.lab || '';
            document.getElementById('examResults').value = ex.results || '';
            document.getElementById('examStatus').value = ex.status || 'done';
            document.getElementById('examScheduledDate').value = ex.scheduledDate || '';
            openModal('examModal');
        });
    });

    container.querySelectorAll('[data-delete-exam]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            showCustomConfirm('Excluir Exame', 'Excluir este exame?', '\u{1F5D1}').then(function(ok) {
                if (!ok) return;
                var exams = getExams().filter(function(e) { return e.id !== btn.dataset.deleteExam; });
                saveExams(exams);
                renderExamsSection();
            });
        });
    });
}

// ============ LISTS (Enxoval, Mala, Doctor Questions) ============
var defaultEnxoval = [
    { cat: 'Roupas', items: ['Bodies (10+)', 'Macacões (8+)', 'Meias (6 pares)', 'Toucas (3)', 'Luvas (3 pares)', 'Casaquinhos (4)', 'Calças (6)', 'Pijamas (4)'] },
    { cat: 'Higiene', items: ['Fraldas RN e P', 'Lenços umedecidos', 'Pomada para assaduras', 'Sabonete líquido neutro', 'Shampoo neutro', 'Álcool 70%', 'Algodão', 'Cotonetes', 'Tesoura de unha', 'Termômetro'] },
    { cat: 'Quarto', items: ['Berço com colchão', 'Lençóis (3+)', 'Manta/cobertor', 'Travesseiro anti-refluxo', 'Babá eletrônica', 'Luminária noturna', 'Móbile'] },
    { cat: 'Alimentação', items: ['Mamadeiras (se usar)', 'Esterilizador', 'Bomba de leite', 'Potes para armazenar leite', 'Babadores (6+)'] },
    { cat: 'Passeio', items: ['Carrinho de bebê', 'Bebê-conforto', 'Canguru/sling', 'Bolsa maternidade'] }
];

var defaultMalaMae = ['Camisolas (2-3)', 'Roupão', 'Chinelo', 'Sutiã de amamentação (2)', 'Calcinha pós-parto (4)', 'Absorvente pós-parto', 'Kit higiene pessoal', 'Documentos (RG, cartão SUS, cartão pré-natal)', 'Carregador de celular', 'Snacks', 'Água'];

var defaultMalaBebe = ['Bodies (3)', 'Macacões (3)', 'Meias (2 pares)', 'Touca', 'Luvas', 'Manta', 'Fraldas RN', 'Lenços umedecidos', 'Pomada assaduras', 'Roupa de saída da maternidade'];

function getListData(key) {
    var saved = localStorage.getItem('hadassa_list_' + key);
    if (saved) { try { return JSON.parse(saved); } catch(e) {} }
    return null;
}

function saveListData(key, data) {
    localStorage.setItem('hadassa_list_' + key, JSON.stringify(data));
}

function renderLists(tab) {
    tab = tab || 'enxoval';
    var container = document.getElementById('listsContent');

    if (tab === 'enxoval') {
        var data = getListData('enxoval') || defaultEnxoval.map(function(c) { return { cat: c.cat, items: c.items.map(function(i) { return { name: i, checked: false }; }) }; });
        renderChecklist(container, data, 'enxoval', true);
    } else if (tab === 'malaMae') {
        var data = getListData('malaMae') || defaultMalaMae.map(function(i) { return { name: i, checked: false }; });
        renderSimpleChecklist(container, data, 'malaMae', 'Mala da Mamãe \u{1F45C}');
    } else if (tab === 'malaBebe') {
        var data = getListData('malaBebe') || defaultMalaBebe.map(function(i) { return { name: i, checked: false }; });
        renderSimpleChecklist(container, data, 'malaBebe', 'Mala do Bebê \u{1F476}');
    } else if (tab === 'doctorQuestions') {
        renderDoctorQuestions(container);
    }
}

function renderChecklist(container, data, key, hasCategories) {
    var totalItems = 0, checkedItems = 0;
    data.forEach(function(cat) { cat.items.forEach(function(item) { totalItems++; if (item.checked) checkedItems++; }); });

    var html = '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">';
    html += '<div class="card-title" style="margin-bottom:0;"><i class="fas fa-shopping-bag"></i> Enxoval</div>';
    html += '<div style="font-size:0.8em;color:var(--pink-600);font-weight:600;">' + checkedItems + '/' + totalItems + '</div>';
    html += '</div>';

    data.forEach(function(cat, ci) {
        html += '<div style="margin-bottom:10px;"><div style="font-size:0.82em;font-weight:700;color:var(--pink-600);margin-bottom:4px;">' + escapeHtml(cat.cat) + '</div>';
        cat.items.forEach(function(item, ii) {
            html += '<label style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:0.82em;cursor:pointer;border-bottom:1px solid var(--pink-50);">';
            html += '<input type="checkbox" data-list-check="' + key + ',' + ci + ',' + ii + '" ' + (item.checked ? 'checked' : '') + ' style="width:18px;height:18px;accent-color:var(--pink-500);">';
            html += '<span style="' + (item.checked ? 'text-decoration:line-through;color:var(--text-light);' : '') + '">' + escapeHtml(item.name) + '</span>';
            html += '</label>';
        });
        html += '</div>';
    });

    // Add custom item + print button
    html += '<div style="display:flex;gap:6px;margin-top:10px;"><input type="text" id="newListItem-' + key + '" placeholder="Adicionar item..." style="flex:1;padding:8px;border:2px solid var(--pink-200);border-radius:10px;font-size:0.8em;font-family:Nunito,sans-serif;">';
    html += '<button class="btn btn-primary btn-small" id="btnAddListItem-' + key + '"><i class="fas fa-plus"></i></button></div>';
    html += '<button class="btn btn-secondary btn-block" id="btnPrintList-' + key + '" style="margin-top:10px;"><i class="fas fa-print"></i> Imprimir Lista</button>';
    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll('[data-list-check]').forEach(function(cb) {
        cb.addEventListener('change', function() {
            var parts = cb.dataset.listCheck.split(',');
            data[parseInt(parts[1])].items[parseInt(parts[2])].checked = cb.checked;
            saveListData(key, data);
            renderLists(key === 'enxoval' ? 'enxoval' : key);
        });
    });

    var addBtn = document.getElementById('btnAddListItem-' + key);
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            var input = document.getElementById('newListItem-' + key);
            var name = input.value.trim();
            if (!name) return;
            if (data.length > 0 && data[data.length-1].cat) {
                data[data.length-1].items.push({ name: name, checked: false });
            }
            saveListData(key, data);
            input.value = '';
            renderLists('enxoval');
        });
    }

    var printBtn = document.getElementById('btnPrintList-' + key);
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            printChecklist('Enxoval do Bebê', data);
        });
    }
}

function printChecklist(title, data) {
    var w = window.open('', '_blank');
    var h = '<html><head><title>' + title + '</title><style>body{font-family:sans-serif;padding:30px;max-width:600px;margin:0 auto;}h1{color:#ec4899;text-align:center;}h3{color:#be185d;margin-top:15px;}.item{padding:6px 0;border-bottom:1px solid #eee;display:flex;align-items:center;gap:10px;}.check{width:16px;height:16px;border:2px solid #ccc;border-radius:3px;flex-shrink:0;}.checked{background:#ec4899;border-color:#ec4899;}</style></head><body>';
    h += '<h1>' + title + '</h1><p style="text-align:center;color:#888;">' + (appData.config.momName || '') + ' — ' + formatDate(new Date().toISOString().split('T')[0]) + '</p>';
    if (data[0] && data[0].cat) {
        data.forEach(function(cat) {
            h += '<h3>' + cat.cat + '</h3>';
            cat.items.forEach(function(item) {
                h += '<div class="item"><div class="check ' + (item.checked ? 'checked' : '') + '"></div>' + item.name + '</div>';
            });
        });
    } else {
        data.forEach(function(item) {
            h += '<div class="item"><div class="check ' + (item.checked ? 'checked' : '') + '"></div>' + item.name + '</div>';
        });
    }
    h += '</body></html>';
    w.document.write(h); w.document.close(); w.print();
}

function renderSimpleChecklist(container, data, key, title) {
    var checked = data.filter(function(i) { return i.checked; }).length;
    var html = '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">';
    html += '<div class="card-title" style="margin-bottom:0;">' + title + '</div>';
    html += '<div style="font-size:0.8em;color:var(--pink-600);font-weight:600;">' + checked + '/' + data.length + '</div></div>';

    data.forEach(function(item, i) {
        html += '<label style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:0.82em;cursor:pointer;border-bottom:1px solid var(--pink-50);">';
        html += '<input type="checkbox" data-simple-check="' + key + ',' + i + '" ' + (item.checked ? 'checked' : '') + ' style="width:18px;height:18px;accent-color:var(--pink-500);">';
        html += '<span style="' + (item.checked ? 'text-decoration:line-through;color:var(--text-light);' : '') + '">' + escapeHtml(item.name) + '</span>';
        html += '</label>';
    });

    html += '<div style="display:flex;gap:6px;margin-top:10px;"><input type="text" id="newListItem-' + key + '" placeholder="Adicionar item..." style="flex:1;padding:8px;border:2px solid var(--pink-200);border-radius:10px;font-size:0.8em;font-family:Nunito,sans-serif;">';
    html += '<button class="btn btn-primary btn-small" id="btnAddListItem-' + key + '"><i class="fas fa-plus"></i></button></div>';
    html += '<button class="btn btn-secondary btn-block" id="btnPrintSimple-' + key + '" style="margin-top:10px;"><i class="fas fa-print"></i> Imprimir Lista</button>';
    html += '</div>';
    container.innerHTML = html;

    var printSBtn = document.getElementById('btnPrintSimple-' + key);
    if (printSBtn) {
        printSBtn.addEventListener('click', function() { printChecklist(title, data); });
    }

    container.querySelectorAll('[data-simple-check]').forEach(function(cb) {
        cb.addEventListener('change', function() {
            var idx = parseInt(cb.dataset.simpleCheck.split(',')[1]);
            data[idx].checked = cb.checked;
            saveListData(key, data);
            renderLists(key);
        });
    });

    var addBtn = document.getElementById('btnAddListItem-' + key);
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            var input = document.getElementById('newListItem-' + key);
            if (!input.value.trim()) return;
            data.push({ name: input.value.trim(), checked: false });
            saveListData(key, data);
            input.value = '';
            renderLists(key);
        });
    }
}

function renderDoctorQuestions(container) {
    var questions = getListData('doctorQuestions') || [];
    var html = '<div class="card"><div class="card-title"><i class="fas fa-stethoscope"></i> Perguntas para o Médico</div>';
    html += '<p style="font-size:0.8em;color:var(--text-light);margin-bottom:10px;">Anote aqui as dúvidas para a próxima consulta. Imprima ou mostre ao médico!</p>';

    html += '<div style="display:flex;gap:6px;margin-bottom:12px;"><input type="text" id="newDoctorQ" placeholder="Escreva sua dúvida..." style="flex:1;padding:10px;border:2px solid var(--pink-200);border-radius:12px;font-size:0.85em;font-family:Nunito,sans-serif;">';
    html += '<button class="btn btn-primary" id="btnAddDoctorQ"><i class="fas fa-plus"></i></button></div>';

    questions.forEach(function(q, i) {
        html += '<div style="display:flex;align-items:flex-start;gap:8px;padding:8px 0;border-bottom:1px solid var(--pink-50);">';
        html += '<span style="color:var(--pink-500);font-weight:700;">' + (i+1) + '.</span>';
        html += '<span style="flex:1;font-size:0.85em;">' + escapeHtml(q) + '</span>';
        html += '<button data-remove-q="' + i + '" style="background:none;border:none;cursor:pointer;color:var(--text-light);"><i class="fas fa-times"></i></button>';
        html += '</div>';
    });

    if (questions.length > 0) {
        html += '<button class="btn btn-secondary btn-block" id="btnPrintQuestions" style="margin-top:12px;"><i class="fas fa-print"></i> Imprimir Perguntas</button>';
    }

    html += '</div>';
    container.innerHTML = html;

    document.getElementById('btnAddDoctorQ').addEventListener('click', function() {
        var input = document.getElementById('newDoctorQ');
        if (!input.value.trim()) return;
        questions.push(input.value.trim());
        saveListData('doctorQuestions', questions);
        input.value = '';
        renderDoctorQuestions(container);
    });

    container.querySelectorAll('[data-remove-q]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            questions.splice(parseInt(btn.dataset.removeQ), 1);
            saveListData('doctorQuestions', questions);
            renderDoctorQuestions(container);
        });
    });

    var printBtn = document.getElementById('btnPrintQuestions');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            var w = window.open('', '_blank');
            var h = '<html><head><title>Perguntas para o Médico</title><style>body{font-family:sans-serif;padding:30px;}h1{color:#ec4899;}li{margin:10px 0;font-size:16px;}</style></head><body>';
            h += '<h1>Perguntas para a Consulta</h1><p>Paciente: ' + escapeHtml(appData.config.momName) + ' | ' + formatDate(new Date().toISOString().split('T')[0]) + '</p><ol>';
            questions.forEach(function(q) { h += '<li>' + escapeHtml(q) + '<br><br><hr style="border:1px dashed #ddd;"></li>'; });
            h += '</ol></body></html>';
            w.document.write(h);
            w.document.close();
            w.print();
        });
    }
}

// ============ BIRTH PLAN ============
var birthPlanQuestions = [
    { id: 'companion', q: 'Quem será seu acompanhante no parto?' },
    { id: 'environment', q: 'Como gostaria que fosse o ambiente? (Luz, música, silêncio)' },
    { id: 'positions', q: 'Quais posições gostaria de experimentar durante o trabalho de parto?' },
    { id: 'pain', q: 'Como prefere lidar com a dor? (Anestesia, métodos naturais, banho)' },
    { id: 'interventions', q: 'Quais intervenções gostaria de evitar? (Episiotomia, ocitocina, etc)' },
    { id: 'cord', q: 'Quando cortar o cordão umbilical? (Clampeamento tardio?)' },
    { id: 'skin', q: 'Deseja contato pele a pele imediato com o bebê?' },
    { id: 'breastfeed', q: 'Deseja amamentar na primeira hora?' },
    { id: 'photos', q: 'Deseja fotos/vídeos do parto?' },
    { id: 'cesarean', q: 'Em caso de cesárea, quais são suas preferências?' },
    { id: 'placenta', q: 'O que deseja fazer com a placenta?' },
    { id: 'other', q: 'Outras observações ou desejos:' }
];

var birthInfoNormal = {
    title: 'Parto Normal (Vaginal)',
    content: [
        { subtitle: 'O que é?', text: 'O parto normal é o nascimento do bebê pela via vaginal, seguindo o processo fisiológico natural do corpo da mulher.' },
        { subtitle: 'Fases do Trabalho de Parto', text: '1. LATENTE: Contrações irregulares, dilatação de 0-4cm. Pode durar horas. Fique em casa, descanse.\n2. ATIVA: Contrações regulares (a cada 3-5 min), dilatação de 4-10cm. Vá ao hospital.\n3. EXPULSIVO: Dilatação total, hora de empurrar! O bebê nasce.\n4. DEQUITAÇÃO: Saída da placenta.' },
        { subtitle: 'Vantagens', text: '- Recuperação mais rápida\n- Menor risco de infecção\n- Bebê recebe bactérias benéficas no canal de parto\n- Produção de leite tende a ser mais fácil\n- Vínculo mãe-bebê imediato' },
        { subtitle: 'Quando ir ao hospital?', text: '- Contrações regulares a cada 5 minutos por 1 hora\n- Rompimento da bolsa\n- Sangramento\n- Redução dos movimentos do bebê' },
        { subtitle: 'Métodos para alívio da dor', text: '- Banho quente\n- Bola de pilates\n- Massagem\n- Respiração\n- Anestesia peridural (quando disponível)' }
    ]
};

var birthInfoCesarean = {
    title: 'Parto Cesárea',
    content: [
        { subtitle: 'O que é?', text: 'A cesariana é uma cirurgia para o nascimento do bebê, realizada através de um corte no abdômen e no útero.' },
        { subtitle: 'Quando é indicada?', text: '- Desproporção cefalopélvica\n- Sofrimento fetal\n- Placenta prévia\n- Apresentação pélvica (bebê sentado)\n- Gestação gemelar (em alguns casos)\n- Cesáreas anteriores (em alguns casos)' },
        { subtitle: 'Como é o procedimento?', text: '1. Anestesia raquidiana ou peridural\n2. Corte horizontal acima dos pelos pubianos (bikini)\n3. Nascimento do bebê (poucos minutos)\n4. Sutura das camadas\n5. Duração total: 45-60 minutos' },
        { subtitle: 'Recuperação', text: '- Internação: 2-3 dias\n- Evitar esforço físico: 30-40 dias\n- Dor no local da incisão: normal nas primeiras semanas\n- Dirigir: após 2-3 semanas (com autorização médica)' },
        { subtitle: 'Cesárea humanizada', text: 'Você pode solicitar:\n- Cortina transparente para ver o nascimento\n- Contato pele a pele imediato\n- Música ambiente\n- Acompanhante presente\n- Clampeamento tardio do cordão' }
    ]
};

function renderBirthPlan(tab) {
    tab = tab || 'plan';
    var container = document.getElementById('birthContent');

    if (tab === 'plan') {
        var saved = getListData('birthPlan') || {};
        var html = '<div class="card"><div class="card-title"><i class="fas fa-clipboard"></i> Meu Plano de Parto</div>';
        html += '<p style="font-size:0.8em;color:var(--text-light);margin-bottom:15px;">Responda as perguntas abaixo. Leve este plano ao seu médico e à maternidade.</p>';

        birthPlanQuestions.forEach(function(bq) {
            html += '<div class="form-group" style="margin-bottom:12px;">';
            html += '<label style="font-size:0.85em;font-weight:600;color:var(--pink-600);">' + escapeHtml(bq.q) + '</label>';
            html += '<textarea data-bp="' + bq.id + '" style="min-height:60px;width:100%;padding:10px;border:2px solid var(--pink-200);border-radius:10px;font-family:Nunito,sans-serif;font-size:0.85em;" placeholder="Sua resposta...">' + escapeHtml(saved[bq.id] || '') + '</textarea>';
            html += '</div>';
        });

        html += '<div style="display:flex;gap:8px;">';
        html += '<button class="btn btn-primary" id="btnSaveBP" style="flex:1;"><i class="fas fa-save"></i> Salvar</button>';
        html += '<button class="btn btn-secondary" id="btnPrintBP" style="flex:1;"><i class="fas fa-print"></i> Imprimir</button>';
        html += '</div></div>';
        container.innerHTML = html;

        document.getElementById('btnSaveBP').addEventListener('click', function() {
            var plan = {};
            container.querySelectorAll('[data-bp]').forEach(function(ta) { plan[ta.dataset.bp] = ta.value; });
            saveListData('birthPlan', plan);
            showToast('Plano de parto salvo!');
        });

        document.getElementById('btnPrintBP').addEventListener('click', function() {
            var plan = {};
            container.querySelectorAll('[data-bp]').forEach(function(ta) { plan[ta.dataset.bp] = ta.value; });
            var w = window.open('', '_blank');
            var h = '<html><head><title>Plano de Parto</title><style>body{font-family:sans-serif;padding:30px;max-width:700px;margin:0 auto;}h1{color:#ec4899;text-align:center;}h3{color:#be185d;margin-top:20px;}.answer{background:#fdf2f8;padding:10px;border-radius:8px;margin:5px 0 15px;min-height:30px;}</style></head><body>';
            h += '<h1>Plano de Parto</h1><p style="text-align:center;">' + escapeHtml(appData.config.momName) + ' | ' + formatDate(new Date().toISOString().split('T')[0]) + '</p>';
            birthPlanQuestions.forEach(function(bq) {
                h += '<h3>' + escapeHtml(bq.q) + '</h3><div class="answer">' + escapeHtml(plan[bq.id] || '(não respondido)') + '</div>';
            });
            h += '</body></html>';
            w.document.write(h);
            w.document.close();
            w.print();
        });

    } else if (tab === 'normal') {
        container.innerHTML = renderBirthInfo(birthInfoNormal);
    } else if (tab === 'cesarean') {
        container.innerHTML = renderBirthInfo(birthInfoCesarean);
    }
}

function renderBirthInfo(info) {
    var html = '<div class="card"><h3 style="color:var(--pink-600);margin-bottom:15px;">' + escapeHtml(info.title) + '</h3>';
    info.content.forEach(function(section) {
        html += '<div style="margin-bottom:15px;">';
        html += '<div style="font-size:0.9em;font-weight:700;color:var(--pink-500);margin-bottom:6px;">' + escapeHtml(section.subtitle) + '</div>';
        html += '<p style="font-size:0.85em;color:var(--text-dark);line-height:1.7;white-space:pre-line;">' + escapeHtml(section.text) + '</p>';
        html += '</div>';
    });
    html += '</div>';
    return html;
}

// ============ HEALTH (Exercises + Nutrition) ============
var exercisesByTrimester = {
    1: [
        { name: 'Caminhada leve', desc: '20-30 min por dia, ritmo confortável. Ajuda na circulação e humor.', icon: '\u{1F6B6}' },
        { name: 'Alongamento', desc: 'Focado em quadril, costas e pernas. 10-15 min.', icon: '\u{1F9D8}' },
        { name: 'Yoga para gestantes', desc: 'Posturas adaptadas, foco na respiração. Evite torções abdominais.', icon: '\u{1F9D8}' },
        { name: 'Natação', desc: 'Excelente exercício de baixo impacto. A água alivia o peso.', icon: '\u{1F3CA}' },
        { name: 'Kegel', desc: 'Exercícios do assoalho pélvico. 3 séries de 10, segurando 5 segundos cada.', icon: '\u{1F4AA}' }
    ],
    2: [
        { name: 'Caminhada moderada', desc: '30-40 min por dia. Melhor fase para exercícios!', icon: '\u{1F6B6}' },
        { name: 'Pilates adaptado', desc: 'Fortalecimento do core e postura. Sempre com profissional.', icon: '\u{1F9CD}' },
        { name: 'Hidroginástica', desc: 'Movimentos na água, ótimo para inchaço e dores.', icon: '\u{1F3CA}' },
        { name: 'Dança', desc: 'Movimentos suaves, excelente para humor e conexão com o bebê.', icon: '\u{1F483}' },
        { name: 'Bola de pilates', desc: 'Sentada na bola, movimentos circulares do quadril. Prepara para o parto.', icon: '\u{26BD}' }
    ],
    3: [
        { name: 'Caminhada leve', desc: '15-20 min, ritmo confortável. Ajuda o bebê a encaixar.', icon: '\u{1F6B6}' },
        { name: 'Exercícios de respiração', desc: 'Técnicas de respiração para o trabalho de parto. 10 min/dia.', icon: '\u{1F4A8}' },
        { name: 'Bola suíça', desc: 'Quicar suavemente e fazer movimentos circulares. Alivia pressão pélvica.', icon: '\u{26BD}' },
        { name: 'Agachamento adaptado', desc: 'Com apoio na parede. Fortalece pernas e prepara para parto.', icon: '\u{1F9CE}' },
        { name: 'Alongamento pélvico', desc: 'Posição de borboleta e gato-vaca. Alivia dores lombares.', icon: '\u{1F9D8}' }
    ]
};

var nutritionByTrimester = {
    1: {
        focus: 'Ácido fólico, ferro, vitamina B6 (contra enjoos)',
        foods: ['Folhas verde-escuras (espinafre, couve)', 'Feijões e lentilhas', 'Ovos', 'Gengibre (para enjoo)', 'Biscoitos de água e sal', 'Banana', 'Abacate', 'Aveia'],
        avoid: ['Álcool', 'Peixes crus (sushi)', 'Carnes cruas/malpassadas', 'Queijos não pasteurizados', 'Excesso de cafeína (máx 200mg/dia)'],
        recipes: [
            { name: 'Smoothie anti-enjoo', ingredients: 'Banana + gengibre ralado + mel + iogurte natural' },
            { name: 'Bowl de aveia', ingredients: 'Aveia + leite + frutas vermelhas + mel + castanhas' }
        ]
    },
    2: {
        focus: 'Cálcio, vitamina D, ômega 3, proteínas',
        foods: ['Leite e derivados', 'Sardinha e salmão', 'Brócolis', 'Tofu', 'Quinoa', 'Chia e linhaça', 'Frutas variadas', 'Carnes magras'],
        avoid: ['Excesso de sal', 'Açúcar refinado em excesso', 'Embutidos (salsicha, presunto)', 'Adoçantes artificiais'],
        recipes: [
            { name: 'Salmão com legumes', ingredients: 'Filé de salmão + brócolis + cenoura + azeite' },
            { name: 'Vitamina proteica', ingredients: 'Leite + banana + pasta de amendoim + cacau' }
        ]
    },
    3: {
        focus: 'Ferro, vitamina K, fibras (contra constipação)',
        foods: ['Carnes vermelhas (bem passadas)', 'Beterraba', 'Feijão', 'Laranja e acerola (vitamina C)', 'Mamão e ameixa (fibras)', 'Castanha do Pará (selênio)', 'Água de coco', 'Batata doce'],
        avoid: ['Excesso de alimentos gordurosos', 'Frituras', 'Refrigerantes', 'Alimentos muito condimentados (azia)'],
        recipes: [
            { name: 'Sopa nutritiva', ingredients: 'Carne moída + batata + cenoura + abóbora + espinafre' },
            { name: 'Snack energético', ingredients: 'Mix de castanhas + damasco seco + chocolate amargo 70%' }
        ]
    }
};

function renderHealth(tab) {
    tab = tab || 'exercises';
    var container = document.getElementById('healthContent');
    var info = appData.config.dum ? calcWeeksFromDUM(appData.config.dum) : null;
    var trimester = info ? (info.weeks < 14 ? 1 : info.weeks < 28 ? 2 : 3) : 2;

    if (tab === 'exercises') {
        var html = '<div class="card"><div class="card-title"><i class="fas fa-running"></i> Exercícios para o ' + trimester + 'º Trimestre</div>';
        html += '<p style="font-size:0.8em;color:var(--text-light);margin-bottom:12px;">Sempre consulte seu médico antes de iniciar exercícios. Pare se sentir dor, tontura ou falta de ar.</p>';

        exercisesByTrimester[trimester].forEach(function(ex) {
            html += '<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--pink-50);align-items:flex-start;">';
            html += '<div style="font-size:2em;flex-shrink:0;">' + ex.icon + '</div>';
            html += '<div><div style="font-weight:700;color:var(--pink-600);font-size:0.9em;">' + escapeHtml(ex.name) + '</div>';
            html += '<div style="font-size:0.8em;color:var(--text-dark);margin-top:4px;">' + escapeHtml(ex.desc) + '</div></div>';
            html += '</div>';
        });

        html += '</div>';

        // Show all trimesters
        [1,2,3].forEach(function(t) {
            if (t === trimester) return;
            html += '<div class="card" style="opacity:0.7;"><div style="font-size:0.85em;font-weight:700;color:var(--text-light);margin-bottom:8px;">' + t + 'º Trimestre</div>';
            exercisesByTrimester[t].forEach(function(ex) {
                html += '<div style="padding:6px 0;font-size:0.8em;border-bottom:1px solid var(--pink-50);">' + ex.icon + ' <strong>' + escapeHtml(ex.name) + '</strong> — ' + escapeHtml(ex.desc) + '</div>';
            });
            html += '</div>';
        });

        container.innerHTML = html;

    } else if (tab === 'nutrition' || tab === 'diet') {
        var data = nutritionByTrimester[trimester];
        var html = '<div class="card"><div class="card-title"><i class="fas fa-utensils"></i> Nutrição — ' + trimester + 'º Trimestre</div>';
        html += '<div style="background:var(--pink-50);padding:10px;border-radius:10px;margin-bottom:12px;"><strong style="color:var(--pink-600);">Foco:</strong> <span style="font-size:0.85em;">' + escapeHtml(data.focus) + '</span></div>';

        html += '<div style="font-weight:700;color:var(--pink-600);font-size:0.85em;margin-bottom:6px;">\u{2705} Alimentos Recomendados</div>';
        data.foods.forEach(function(f) { html += '<div style="font-size:0.82em;padding:3px 0;">\u{2022} ' + escapeHtml(f) + '</div>'; });

        html += '<div style="font-weight:700;color:#dc2626;font-size:0.85em;margin:12px 0 6px;">\u{274C} Evitar</div>';
        data.avoid.forEach(function(f) { html += '<div style="font-size:0.82em;padding:3px 0;">\u{2022} ' + escapeHtml(f) + '</div>'; });

        html += '</div>';

        // Recipes
        html += '<div class="card"><div class="card-title"><i class="fas fa-blender"></i> Receitas Sugeridas</div>';
        data.recipes.forEach(function(r) {
            html += '<div style="padding:10px 0;border-bottom:1px solid var(--pink-50);">';
            html += '<div style="font-weight:700;color:var(--pink-600);font-size:0.9em;">\u{1F372} ' + escapeHtml(r.name) + '</div>';
            html += '<div style="font-size:0.82em;color:var(--text-dark);margin-top:4px;">' + escapeHtml(r.ingredients) + '</div>';
            html += '</div>';
        });
        html += '</div>';

        container.innerHTML = html;
    } else if (tab === 'breastfeeding') {
        var html = '<div class="card"><div class="card-title"><i class="fas fa-baby"></i> Preparação para Amamentação</div>';
        breastfeedingContent.forEach(function(section) {
            html += '<div style="margin-bottom:15px;padding-bottom:15px;border-bottom:1px solid var(--pink-50);">';
            html += '<div style="font-size:0.95em;font-weight:700;color:var(--pink-600);margin-bottom:6px;">' + escapeHtml(section.title) + '</div>';
            html += '<p style="font-size:0.85em;color:var(--text-dark);line-height:1.7;white-space:pre-line;">' + escapeHtml(section.text) + '</p>';
            html += '</div>';
        });
        html += '</div>';
        container.innerHTML = html;
    }
}

// ============ DAILY MOTIVATION ============
var motivationalMessages = [
    'Você está fazendo um trabalho incrível, mamãe!',
    'Cada dia é um passo mais perto de conhecer seu bebê.',
    'Seu corpo é extraordinário — ele está criando uma vida!',
    'Descanse quando precisar. Você merece!',
    'Seu bebê sente seu amor mesmo antes de nascer.',
    'Lembre-se: nenhuma gestação é igual. Respeite seu ritmo.',
    'Hoje é um ótimo dia para conversar com seu bebê.',
    'Você é mais forte do que imagina!',
    'Cuide de você para poder cuidar do seu bebê.',
    'Cada enjoo, cada desconforto — tudo vale a pena.',
    'Seu bebê já reconhece sua voz. Cante para ele!',
    'Beba água! Hidratação é essencial na gravidez.',
    'Você está construindo um ser humano. Isso é INCRÍVEL.',
    'Seja gentil consigo mesma. Mudanças de humor são normais.',
    'Sua barriga é linda. Seu corpo é incrível.',
    'Confie no processo. Seu corpo sabe o que fazer.',
    'Aproveite cada momento. A gravidez passa rápido!',
    'Você não está sozinha nessa jornada.',
    'Um dia de cada vez. Você está indo muito bem!',
    'Seu bebê é o projeto mais lindo da sua vida.'
];

function showDailyMotivation() {
    var lastShown = localStorage.getItem('hadassa_motivation_date');
    var today = new Date().toISOString().split('T')[0];
    if (lastShown === today) return;

    var dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    var msgIndex = dayOfYear % motivationalMessages.length;

    setTimeout(function() {
        showCustomAlert(
            '\u{1F49C} Motivação do Dia',
            motivationalMessages[msgIndex],
            '\u{2728}'
        );
        localStorage.setItem('hadassa_motivation_date', today);
    }, 3000);
}

// ============ NOTIFICATIONS (expanded) ============
function scheduleAllNotifications() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    // Appointment notifications (already exists in app.js, enhanced here)
    scheduleAppointmentReminders();

    // Exam notifications
    var exams = getExams();
    var now = new Date();
    exams.forEach(function(ex) {
        if (ex.status !== 'scheduled' || !ex.scheduledDate) return;
        var examDate = new Date(ex.scheduledDate + 'T09:00:00');
        var oneDayBefore = examDate.getTime() - (24 * 60 * 60 * 1000);
        if (oneDayBefore > now.getTime() && oneDayBefore - now.getTime() < 48 * 60 * 60 * 1000) {
            setTimeout(function() {
                new Notification('Exame amanhã!', { body: ex.title + (ex.lab ? ' — ' + ex.lab : '') });
            }, oneDayBefore - now.getTime());
        }
    });

    // Weekly pregnancy notification
    if (appData.config.dum) {
        var info = calcWeeksFromDUM(appData.config.dum);
        var lastWeekNotif = localStorage.getItem('hadassa_week_notif');
        if (lastWeekNotif !== String(info.weeks) && info.days === 0) {
            new Notification('Semana ' + info.weeks + '!', {
                body: 'Parabéns! Você completou ' + info.weeks + ' semanas de gestação!'
            });
            localStorage.setItem('hadassa_week_notif', String(info.weeks));
        }
    }
}

// ============ OCR: EXTRACT EXAM DATA FROM IMAGE VIA GEMINI ============
function extractExamData(imageBase64) {
    // Remove data URI prefix to get raw base64
    var base64Data = imageBase64.replace(/^data:[^;]+;base64,/, '');
    var mimeType = imageBase64.match(/^data:([^;]+);/) ? imageBase64.match(/^data:([^;]+);/)[1] : 'image/jpeg';

    var body = {
        model: 'gemini-2.0-flash',
        contents: [{
            parts: [
                { text: 'Analise esta imagem de exame médico/laboratorial. Extraia TODAS as informações contidas: nome do exame, data, médico solicitante, laboratório, e TODOS os resultados com valores e unidades. Retorne no formato:\n\nTIPO: (blood/routine/glucose/us/prescription/other)\nTÍTULO: (nome do exame)\nDATA: (YYYY-MM-DD se encontrar)\nMÉDICO: (nome se encontrar)\nLABORATÓRIO: (nome se encontrar)\nRESULTADOS:\n(liste todos os resultados encontrados, um por linha, com valor e referência se disponível)' },
                { inline_data: { mime_type: mimeType, data: base64Data } }
            ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
    };

    // Usar proxy em producao, direto em localhost
    var url;
    if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        url = 'https://gemini-proxy.anajmfreire.workers.dev';
    } else {
        var apiKey = getGeminiApiKey();
        if (!apiKey) { showToast('Configure a API key no .env', 5000); return Promise.resolve(null); }
        url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;
    }

    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    }).then(function(response) {
        if (!response.ok) throw new Error('Erro na API: ' + response.status);
        return response.json();
    }).then(function(data) {
        var text = data.candidates && data.candidates[0] && data.candidates[0].content &&
            data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
            data.candidates[0].content.parts[0].text;
        if (!text) return null;

        // Parse the response
        var result = {};
        var typeMatch = text.match(/TIPO:\s*(.+)/i);
        var titleMatch = text.match(/T[ÍI]TULO:\s*(.+)/i);
        var dateMatch = text.match(/DATA:\s*(\d{4}-\d{2}-\d{2})/i);
        var doctorMatch = text.match(/M[ÉE]DICO:\s*(.+)/i);
        var labMatch = text.match(/LABORAT[ÓO]RIO:\s*(.+)/i);
        var resultsMatch = text.match(/RESULTADOS:\s*([\s\S]+)/i);

        if (typeMatch) result.type = typeMatch[1].trim().toLowerCase();
        if (titleMatch) result.title = titleMatch[1].trim();
        if (dateMatch) result.date = dateMatch[1].trim();
        if (doctorMatch) result.doctor = doctorMatch[1].trim();
        if (labMatch) result.lab = labMatch[1].trim();
        if (resultsMatch) result.results = resultsMatch[1].trim();

        return result;
    }).catch(function(err) {
        Logger.error('OCR error:', err);
        showToast('Erro ao analisar imagem: ' + err.message, 5000);
        return null;
    });
}

// ============ EXTRA FEATURES (sugestões) ============

// Contraction counter
var contractionSession = { active: false, contractions: [] };

function getContractionHistory() {
    var saved = localStorage.getItem('hadassa_contractions');
    if (saved) { try { return JSON.parse(saved); } catch(e) {} }
    return [];
}

function saveContractionHistory(history) {
    localStorage.setItem('hadassa_contractions', JSON.stringify(history));
}

// Letter to baby
function getLetterToBaby() {
    return localStorage.getItem('hadassa_letter_to_baby') || '';
}

function saveLetterToBaby(text) {
    localStorage.setItem('hadassa_letter_to_baby', text);
}

// Breastfeeding content
var breastfeedingContent = [
    { title: 'Preparação durante a gravidez', text: 'Não é necessário preparar o mamilo. O corpo se prepara naturalmente. Use sutiã de algodão confortável. Participe de grupos de apoio à amamentação se possível.' },
    { title: 'Primeira mamada (Hora de Ouro)', text: 'O contato pele a pele e a primeira mamada na 1ª hora de vida são fundamentais. O colostro (primeiro leite) é espesso, amarelado e cheio de anticorpos. Poucas gotas são suficientes para o bebê nos primeiros dias.' },
    { title: 'Pega correta', text: 'O bebê deve abocanhar toda a aréola, não apenas o mamilo. Boca bem aberta, lábio inferior virado para fora, queixo encostado no seio. Se doer, retire o bebê (com o dedo mínimo) e tente novamente.' },
    { title: 'Posições para amamentar', text: '• Tradicional (Madonna): bebê de frente, barriga com barriga\n• Football americano: bebê debaixo do braço, bom para cesárea\n• Deitada: ideal para mamadas noturnas\n• Cavalinho: bebê sentado de frente (para bebês maiores)' },
    { title: 'Dificuldades comuns', text: '• Fissuras: geralmente causadas por pega incorreta. Use o próprio leite no mamilo.\n• Ingurgitamento: compressas mornas antes e frias depois da mamada\n• Mastite: febre + dor no seio = procure médico\n• Pouco leite: quanto mais o bebê mama, mais leite produz. Hidrate-se!' },
    { title: 'Mitos', text: '• "Cerveja escura aumenta leite" — MITO\n• "Leite fraco não existe" — VERDADE, todo leite materno é nutritivo\n• "Bebê que mama no peito não precisa de água até 6 meses" — VERDADE' }
];

// ============ INITIALIZATION OF NEW FEATURES ============
(function initFeatures() {
    // Wait for app.js to be loaded
    if (typeof appData === 'undefined' || appData === null) {
        setTimeout(initFeatures, 100);
        return;
    }

    // Sub-tabs for new sections
    document.querySelectorAll('.sub-tab[data-diarytab]').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.sub-tab[data-diarytab]').forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            renderDiary(tab.dataset.diarytab);
        });
    });

    document.querySelectorAll('.sub-tab[data-symptab]').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.sub-tab[data-symptab]').forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            renderSymptomsSection(tab.dataset.symptab);
        });
    });

    document.querySelectorAll('.sub-tab[data-examtab]').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.sub-tab[data-examtab]').forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            renderExamsSection(tab.dataset.examtab);
        });
    });

    document.querySelectorAll('.sub-tab[data-listtab]').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.sub-tab[data-listtab]').forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            renderLists(tab.dataset.listtab);
        });
    });

    document.querySelectorAll('.sub-tab[data-birthtab]').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.sub-tab[data-birthtab]').forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            renderBirthPlan(tab.dataset.birthtab);
        });
    });

    document.querySelectorAll('.sub-tab[data-healthtab]').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.sub-tab[data-healthtab]').forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            renderHealth(tab.dataset.healthtab);
        });
    });

    // Diary form
    document.getElementById('diaryForm').addEventListener('submit', saveDiaryEntry);
    document.getElementById('btnNewDiary').addEventListener('click', function() {
        document.getElementById('diaryDate').value = new Date().toISOString().split('T')[0];
        openModal('diaryModal');
    });

    // Mood picker
    document.querySelectorAll('.mood-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mood-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            document.getElementById('diaryMood').value = btn.dataset.mood;
        });
    });

    // Diary photo upload
    document.getElementById('diaryPhoto').addEventListener('change', function(e) {
        var file = e.target.files[0];
        var preview = document.getElementById('diaryPhotoPreview');
        if (!file) { preview.innerHTML = ''; preview.dataset.photoId = ''; return; }
        if (file.size > 5 * 1024 * 1024) { alert('Imagem muito grande (máx 5MB).'); e.target.value = ''; return; }
        var reader = new FileReader();
        reader.onload = function(ev) {
            compressImage(ev.target.result).then(function(compressed) {
                var photoId = genId();
                return savePhoto(photoId, compressed).then(function() {
                    preview.dataset.photoId = photoId;
                    renderPhoto(preview, compressed);
                });
            }).catch(function() {});
        };
        reader.readAsDataURL(file);
    });

    // Exam form
    document.getElementById('examForm').addEventListener('submit', saveExamEntry);
    document.getElementById('btnNewExam').addEventListener('click', function() {
        document.getElementById('examDate').value = new Date().toISOString().split('T')[0];
        openModal('examModal');
    });

    // Exam file upload with OCR
    document.getElementById('examFile').addEventListener('change', function(e) {
        var file = e.target.files[0];
        var preview = document.getElementById('examFilePreview');
        if (!file) { preview.innerHTML = ''; preview.dataset.photoId = ''; return; }
        if (file.size > 10 * 1024 * 1024) { alert('Arquivo muito grande (máx 10MB).'); e.target.value = ''; return; }
        var reader = new FileReader();
        reader.onload = function(ev) {
            var photoId = genId();
            var imageData = ev.target.result;
            savePhoto(photoId, imageData).then(function() {
                preview.dataset.photoId = photoId;
                if (file.type.startsWith('image/')) {
                    renderPhoto(preview, imageData);
                } else {
                    preview.innerHTML = '<div style="padding:10px;background:var(--pink-50);border-radius:8px;font-size:0.8em;"><i class="fas fa-file"></i> ' + escapeHtml(file.name) + '</div>';
                }

                // OCR: Botão de extração para QUALQUER tipo de arquivo
                var ocrDiv = document.createElement('div');
                ocrDiv.style.cssText = 'margin-top:8px;text-align:center;';
                ocrDiv.innerHTML = '<button class="btn btn-secondary" id="btnOcrExtract" style="border-radius:20px;width:100%;padding:10px;"><i class="fas fa-magic"></i> Extrair dados automaticamente (IA)</button>' +
                    '<div style="font-size:0.7em;color:var(--text-light);margin-top:4px;">A IA analisa o documento e preenche os campos</div>';
                preview.appendChild(ocrDiv);

                document.getElementById('btnOcrExtract').addEventListener('click', function() {
                    ocrDiv.innerHTML = '<div style="padding:12px;font-size:0.85em;color:var(--pink-600);"><i class="fas fa-spinner fa-spin"></i> Analisando documento com IA... aguarde</div>';

                    extractExamData(imageData).then(function(result) {
                        if (!result) {
                            ocrDiv.innerHTML = '<div style="padding:8px;font-size:0.8em;color:#dc2626;"><i class="fas fa-times-circle"></i> Não foi possível extrair dados. Preencha manualmente.</div>';
                            return;
                        }

                        if (result.type) {
                            var typeMap = { blood: 'blood', sangue: 'blood', routine: 'routine', rotina: 'routine', glucose: 'glucose', glicemia: 'glucose', us: 'us', ultrassom: 'us', prescription: 'prescription', receita: 'prescription', other: 'other' };
                            document.getElementById('examType').value = typeMap[result.type] || 'other';
                        }
                        if (result.title) document.getElementById('examTitle').value = result.title;
                        if (result.date) document.getElementById('examDate').value = result.date;
                        if (result.doctor) document.getElementById('examDoctor').value = result.doctor;
                        if (result.lab) document.getElementById('examLab').value = result.lab;
                        if (result.results) document.getElementById('examResults').value = result.results;

                        ocrDiv.innerHTML = '<div style="padding:8px;font-size:0.8em;color:#16a34a;"><i class="fas fa-check-circle"></i> Dados extraídos! Revise e ajuste se necessário.</div>';
                        showToast('Dados extraídos com sucesso!');
                    });
                });
            }).catch(function() {});
        };
        reader.readAsDataURL(file);
    });

    // Close modals
    document.querySelectorAll('[data-close="diaryModal"],[data-close="examModal"],[data-close="galleryModal"]').forEach(function(btn) {
        btn.addEventListener('click', function() { closeModal(btn.dataset.close); });
    });

    // Config: date base toggle
    var dateBaseSelect = document.getElementById('cfgDateBase');
    if (dateBaseSelect) {
        dateBaseSelect.addEventListener('change', function() {
            var showUS = dateBaseSelect.value === 'us';
            document.getElementById('cfgFirstUSGroup').style.display = showUS ? 'block' : 'none';
            document.getElementById('cfgFirstUSWeeksGroup').style.display = showUS ? 'block' : 'none';
        });
        // Load saved value
        if (appData.config.dateBase) dateBaseSelect.value = appData.config.dateBase;
        if (appData.config.dateBase === 'us') {
            document.getElementById('cfgFirstUSGroup').style.display = 'block';
            document.getElementById('cfgFirstUSWeeksGroup').style.display = 'block';
        }
    }

    // Extend showSection to render new sections
    var originalShowSection = showSection;
    showSection = function(sectionName) {
        originalShowSection(sectionName);
        if (sectionName === 'weekly') renderWeeklyContent();
        if (sectionName === 'diary') renderDiary();
        if (sectionName === 'symptoms') renderSymptomsSection();
        if (sectionName === 'exams') renderExamsSection();
        if (sectionName === 'lists') renderLists();
        if (sectionName === 'birthplan') renderBirthPlan();
        if (sectionName === 'health') renderHealth();
    };

    // Daily motivation
    showDailyMotivation();

    // Enhanced notifications
    scheduleAllNotifications();
})();
