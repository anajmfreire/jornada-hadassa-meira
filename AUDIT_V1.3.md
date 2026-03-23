# AUDITORIA COMPLETA V1.3 - "A Jornada de Hadassa Meira"

**Data da Auditoria:** 22/03/2026
**Auditorias Anteriores:** AUDIT_V1.0.md (20/03/2026), AUDIT_V1.1.md (21/03/2026), AUDIT_V1.2.md (21/03/2026)
**Arquivos Analisados:** `app.js` (~3.900 linhas, ~168 KB), `features.js` (~2.200 linhas, ~131 KB), `extras.js` (~700 linhas, ~44 KB), `content.js` (~550 linhas, ~33 KB), `firebase-sync.js` (~330 linhas, ~15 KB), `index.html` (~800 linhas, ~61 KB), `styles.css` (~1.100 linhas, ~43 KB), `sw.js` (63 linhas)
**Tipo:** Single Page Application (PWA) com Firebase Auth + Realtime Database
**Tecnologias:** Chart.js 4.4.1, jsPDF 2.5.1, Font Awesome 6.5.1, Google Fonts (Nunito, Dancing Script), Firebase 10.12.0, API Gemini
**Escopo desta versao:** Auditoria completa pos-implementacao de sistema unificado de dados (getAllUSData), simplificacao do formulario de ultrassom, registro de peso materno, e integracao de dados entre exames e ultrassons.

---

## STATUS DA V1.2 - O QUE FOI CORRIGIDO

| ID V1.2 | Descricao | Status V1.2 | Status V1.3 |
|---------|-----------|-------------|-------------|
| V12-SEC-001 | Chave API Gemini exposta via .env | CORRIGIDO | OK — .env removido, chave via localStorage |
| V12-SEC-002 | Criptografia AES-GCM decorativa | CORRIGIDO | OK — Removida, saveData transparente |
| V12-SEC-003 | XSS via campo photo (base64 em innerHTML) | CORRIGIDO | OK — renderPhoto() via DOM API |
| V12-SEC-004 | SW cacheia respostas de terceiros | CORRIGIDO | OK — Own-origin only |
| V12-SEC-005 | CSP enfraquecida por unsafe-inline | CORRIGIDO | **REGRESSAO** — CSP removida inteiramente para Firebase Auth (ver V13-SEC-001) |
| V12-SEC-006 | formatDate nao sanitiza entrada | CORRIGIDO | OK — escapeHtml interno |
| V12-DATA-001 | Race condition na inicializacao | CORRIGIDO | OK — Init sincrono unico |
| V12-DATA-002 | saveData descarta erros silenciosamente | CORRIGIDO | OK — QuotaExceededError tratado |
| V12-DATA-003 | Fotos base64 no localStorage | CORRIGIDO | OK — IndexedDB + compressao |
| V12-PERF-001 | renderAll reconstroi tudo | CORRIGIDO | OK — renderAfterChange seletivo |
| V12-PERF-002 | Flash de conteudo na inicializacao | CORRIGIDO | OK |
| V12-COD-001 | Testes duplicam codigo | CORRIGIDO | OK |
| V12-COD-002 | Variavel dpp nao utilizada | CORRIGIDO | OK |
| V12-COD-003 | Logica medica acoplada a apresentacao | CORRIGIDO | OK — Funcoes puras de analise |
| V12-COD-004 | Dados medicos sem fonte | CORRIGIDO | OK — Fontes documentadas |
| SEC-010-IDEAL | Proxy backend para API Gemini | PENDENTE | PENDENTE — Requer infra |
| ARQ-009 | Sincronizacao multi-dispositivo | PENDENTE | **IMPLEMENTADO** — Firebase Realtime Database |
| ARQ-010 | Icones PNG reais para PWA | PENDENTE | PENDENTE — Requer assets graficos |
| ARQ-012 | Build process (Vite) | PENDENTE | PENDENTE — Melhoria de longo prazo |
| FEAT-013 | Modo acompanhante (read-only) | PENDENTE | PENDENTE |

**Resumo V1.2 → V1.3:** 15 correcoes mantidas | 1 regressao (CSP) | 2 novas implementacoes (Firebase sync, dados unificados) | 3 pendentes de infra

---

## RESUMO EXECUTIVO V1.3 - FINDINGS

| Categoria | Critico | Alto | Medio | Baixo | Total |
|-----------|---------|------|-------|-------|-------|
| Seguranca | 1 | 3 | 3 | 1 | 8 |
| Integridade de Dados | 1 | 2 | 2 | 0 | 5 |
| Arquitetura | 0 | 2 | 3 | 1 | 6 |
| Performance | 0 | 2 | 3 | 0 | 5 |
| UX / Acessibilidade | 0 | 1 | 4 | 2 | 7 |
| Qualidade de Codigo | 0 | 0 | 3 | 3 | 6 |
| **TOTAL** | **2** | **10** | **18** | **7** | **37** |

---

## FASE 1 - CRITICA

### [V13-SEC-001] CSP completamente removida — regressao da V1.2

- **Arquivo:** `index.html` (linha 36)
- **Risco:** CRITICO
- **Diagnostico:** Na V1.2, a CSP foi corrigida removendo `'unsafe-inline'` do `script-src`. Porem, ao integrar o Firebase Auth (que usa `eval` e scripts inline para OAuth popup/redirect), a CSP foi COMPLETAMENTE REMOVIDA com o comentario `<!-- CSP removido para compatibilidade com Firebase Auth -->`. Isso anula TODA a protecao contra XSS oferecida pela CSP na V1.2. Qualquer extensao de navegador, script injetado ou import de JSON malicioso pode executar codigo arbitrario sem restricao.
- **Impacto:** App vulneravel a XSS, injecao de scripts, clickjacking, data exfiltration.
- **Evidencia:**
  ```html
  <!-- Linha 36 de index.html -->
  <!-- CSP removido para compatibilidade com Firebase Auth -->
  ```
- **Solucao Proposta:**
  1. Reintroduzir CSP com excecoes especificas para Firebase:
  ```html
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://www.gstatic.com https://apis.google.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
    font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com;
    img-src 'self' data: blob: https://*.googleusercontent.com;
    connect-src 'self' https://generativelanguage.googleapis.com https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com;
    frame-src https://*.firebaseapp.com https://accounts.google.com;
  ">
  ```
  2. Se Firebase Auth popup exigir `'unsafe-eval'`, usar redirect flow ao inves de popup flow
  3. Documentar a razao de cada excecao adicionada

---

### [V13-DATA-001] Firebase sync sem resolucao de conflitos — risco de perda de dados

- **Arquivo:** `firebase-sync.js` (linhas 203-265)
- **Risco:** CRITICO
- **Diagnostico:** A funcao `syncFromCloud()` sobrescreve dados locais inteiros com dados da nuvem quando o timestamp da nuvem e mais recente. Nao existe merge por registro — e um "last write wins" no nivel de arrays completos. Se o usuario editar no celular e no desktop sem sincronizar, o ultimo sync apaga as alteracoes do outro dispositivo. A protecao contra dados vazios (linhas 137-143 do `syncToCloud`) so verifica se o JSON local esta vazio — nao protege contra sobreposicao parcial.
- **Cenario de perda:**
  1. Dispositivo A adiciona ultrassom X offline
  2. Dispositivo B adiciona ultrassom Y offline
  3. Dispositivo A sincroniza → nuvem tem X
  4. Dispositivo B sincroniza → nuvem tem Y (X perdido para sempre)
- **Evidencia:**
  ```javascript
  // firebase-sync.js ~linha 220-241
  // syncFromCloud sobrescreve arrays locais:
  if (cloudData.ultrasounds) appData.ultrasounds = cloudData.ultrasounds;
  if (cloudData.appointments) appData.appointments = cloudData.appointments;
  if (cloudData.notes) appData.notes = cloudData.notes;
  ```
- **Solucao Proposta:**
  1. Implementar merge por ID de registro ao inves de substituicao de array:
  ```javascript
  function mergeArrays(local, cloud, key) {
      var merged = {};
      local.forEach(function(item) { merged[item.id] = item; });
      cloud.forEach(function(item) {
          if (!merged[item.id] || (item.updatedAt > merged[item.id].updatedAt)) {
              merged[item.id] = item;
          }
      });
      return Object.values(merged).sort(function(a, b) {
          return (a[key] || '').localeCompare(b[key] || '');
      });
  }
  ```
  2. Adicionar campo `updatedAt` a cada registro (ultrasound, appointment, note)
  3. Registrar timestamp de ultima modificacao por registro, nao por sync global

---

## FASE 2 - ALTA PRIORIDADE

### [V13-SEC-002] Firebase API key e config expostos no codigo-fonte

- **Arquivo:** `firebase-sync.js` (linhas 35-43)
- **Risco:** ALTO
- **Diagnostico:** A configuracao completa do Firebase (apiKey, authDomain, databaseURL, projectId, storageBucket, messagingSenderId, appId) esta hardcoded no arquivo JavaScript publico. Embora Firebase Security Rules devam ser a linha principal de defesa (e nao a chave em si), a exposicao da apiKey permite que atacantes enumerem o projeto, tentem autenticacao com credenciais roubadas, ou abusem de cotas de autenticacao.
- **Evidencia:**
  ```javascript
  var firebaseConfig = {
      apiKey: "AIzaSyAlMmkKtN414ysINl99oWce121XG11dFnk",
      authDomain: "hadassa-meira.firebaseapp.com",
      databaseURL: "https://hadassa-meira-default-rtdb.firebaseio.com",
      projectId: "hadassa-meira",
      // ...
  };
  ```
- **Solucao Proposta:**
  1. Garantir que Firebase Security Rules estejam restritivas (somente usuario autenticado le/escreve seus proprios dados)
  2. Implementar rate limiting no Firebase (App Check)
  3. Ativar Firebase App Check com reCAPTCHA Enterprise para prevenir abuso
  4. Monitorar uso da API via Firebase Console

---

### [V13-SEC-003] Inline onclick handlers em innerHTML — risco de XSS

- **Arquivo:** `features.js` (linhas 114, 120, 126, 132 e diversas outras)
- **Risco:** ALTO
- **Diagnostico:** Multiplos pontos do codigo usam handlers inline (`onclick`, `onchange`) dentro de strings HTML injetadas via `innerHTML`. Embora os valores atuais sejam IDs seguros (nao dados do usuario), o padrao e fragil — qualquer mudanca futura que insira dados do usuario nesses handlers cria um vetor de XSS. Alem disso, com a CSP removida (V13-SEC-001), nao ha protecao contra execucao desses handlers.
- **Exemplos encontrados:**
  ```javascript
  // features.js - onClick inline em innerHTML
  '<div ... onclick="document.getElementById(\'weeklyBabyCard\').scrollIntoView({behavior:\'smooth\'})">'

  // extras.js - onChange inline
  '<select onchange="...">'
  ```
- **Quantidade:** 15+ instancias de onclick/onchange inline em strings HTML
- **Solucao Proposta:**
  1. Substituir TODOS os onclick/onchange inline por `addEventListener` apos inserir o HTML:
  ```javascript
  // ANTES:
  html += '<button onclick="doSomething(\'' + id + '\')">Acao</button>';

  // DEPOIS:
  html += '<button data-action="' + escapeHtml(id) + '">Acao</button>';
  container.innerHTML = html;
  container.querySelectorAll('[data-action]').forEach(function(btn) {
      btn.addEventListener('click', function() { doSomething(btn.dataset.action); });
  });
  ```
  2. Auditar TODOS os usos de `innerHTML` com dados do usuario

---

### [V13-SEC-004] console.log em producao expoe informacoes de debug

- **Arquivo:** `firebase-sync.js` (17 instancias), `app.js` (5 instancias)
- **Risco:** ALTO
- **Diagnostico:** Ha 22 chamadas de `console.log`, `console.warn` e `console.error` espalhadas pelo codigo de producao. Essas mensagens expoem informacoes internas ao DevTools: nomes de funcoes, estado de autenticacao, dados de sync, fluxo de execucao. Um atacante pode usar essas informacoes para entender a arquitetura e encontrar pontos de ataque.
- **Exemplos criticos:**
  ```javascript
  // firebase-sync.js
  console.log('Inicializando Firebase Sync...');        // linha 32
  console.log('Botao login clicado');                    // linha 327
  console.log('Firebase Auth: usuario logado', user.email); // expoe email
  console.log('Sync: enviando dados para nuvem...');     // revela fluxo
  console.log('Sync: dados recebidos da nuvem', data);   // EXPOE DADOS!
  ```
- **Solucao Proposta:**
  1. Substituir todos os `console.log` pelo sistema de `Logger` que ja existe no `app.js`:
  ```javascript
  // Logger ja existente (app.js ~linha 130):
  var Logger = {
      info: function(msg) { /* noop em producao */ },
      warn: function(msg) { /* noop em producao */ },
      error: function(msg) { /* registra apenas em debug */ }
  };
  ```
  2. Remover completamente logs que exponham dados do usuario (emails, dados de sync)
  3. Usar flag `DEBUG` para habilitar logs apenas em desenvolvimento

---

### [V13-DATA-002] getAllUSData() pode retornar dados com NaN em campos numericos

- **Arquivo:** `app.js` (linhas 2031-2132)
- **Risco:** ALTO
- **Diagnostico:** A funcao `getAllUSData()` usa `parseFloat()` e `parseInt()` em dados extraidos dos exames sem validar se o resultado e um numero valido. Se `specificData.exUsHeart` contiver texto como "Normal" ou string vazia, `parseFloat("Normal")` retorna `NaN`, que e inserido nos arrays e propagado para graficos, analise parametrica e PDFs.
- **Evidencia:**
  ```javascript
  // app.js ~linha 2078
  var heartbeat = parseFloat(d.exUsHeart) || null;  // "Normal" → NaN || null → null (OK)
  // MAS no merge (linha 2068):
  if (!existing.heartbeat && d.exUsHeart) existing.heartbeat = parseFloat(d.exUsHeart);
  // Se d.exUsHeart = "batendo" → existing.heartbeat = NaN (BUG!)
  ```
- **Impacto:** Graficos quebram com NaN, analise de parametros mostra "NaN bpm", PDF exibe valores corrompidos.
- **Solucao Proposta:**
  ```javascript
  function safeParseFloat(val) {
      if (val === null || val === undefined || val === '') return null;
      var num = parseFloat(val);
      return isNaN(num) ? null : num;
  }

  // Usar em getAllUSData():
  if (!existing.heartbeat && d.exUsHeart) {
      existing.heartbeat = safeParseFloat(d.exUsHeart);
  }
  ```

---

### [V13-DATA-003] Peso materno duplicado se registrado na consulta E no tracker

- **Arquivo:** `app.js` (linhas 1924-1943) e `extras.js` (linhas 620-710)
- **Risco:** ALTO
- **Diagnostico:** A funcao `getAllMomWeights()` combina pesos de `appData.appointments` e `localStorage('hadassa_mom_weights')`, deduplicando por data. Porem, `renderMomWeightTracker()` no `extras.js` faz a MESMA combinacao independentemente. Se o usuario registra o peso no tracker E na consulta com o MESMO dia mas valores ligeiramente diferentes (ex: 65.3 vs 65.5), o sistema nao sabe qual valor priorizar. Alem disso, a deduplicacao e por data exata — pesos registrados no mesmo dia com horas diferentes sao tratados como iguais.
- **Evidencia:**
  ```javascript
  // app.js - getAllMomWeights():
  var exists = allWeights.some(function(e) { return e.date === w.date; });
  if (!exists) allWeights.push(...);

  // extras.js - renderMomWeightTracker():
  var exists = allWeights.some(function(w) { return w.date === a.date; });
  if (!exists) allWeights.push(...);
  // MESMA logica duplicada!
  ```
- **Solucao Proposta:**
  1. Centralizar em `getAllMomWeights()` como fonte unica (ja feito em app.js)
  2. Em `renderMomWeightTracker()`, chamar `getAllMomWeights()` ao inves de replicar a logica
  3. Quando houver conflito de valores no mesmo dia, priorizar o tracker (registro manual e mais recente)

---

## FASE 3 - MEDIA PRIORIDADE

### [V13-SEC-005] Ausencia de HTTPS enforcement

- **Arquivo:** `index.html`
- **Risco:** MEDIO
- **Diagnostico:** Nao ha meta tag para forcar HTTPS, nao ha redirecionamento HTTP→HTTPS, e nenhum header HSTS e configurado. Em uma conexao HTTP, todos os dados (incluindo credenciais Firebase, dados de saude da gestante) trafegam em texto plano. Embora o Firebase SDK use HTTPS para suas proprias conexoes, o carregamento inicial da pagina pode ser interceptado.
- **Solucao Proposta:**
  1. Adicionar redirecionamento no servidor/hosting (GitHub Pages, Firebase Hosting ja forcam HTTPS)
  2. Adicionar meta tag: `<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">`
  3. Se usar servidor proprio, configurar HSTS header

---

### [V13-SEC-006] Validacao de import nao verifica datas logicamente invalidas

- **Arquivo:** `app.js` (funcao `importData`, ~linha 3210)
- **Risco:** MEDIO
- **Diagnostico:** A validacao de importacao usa regex `/^\d{4}-\d{2}-\d{2}$/` para datas, que aceita datas logicamente invalidas como `2099-13-40`, `0000-00-00` ou `2026-02-31`. Uma data invalida propaga-se para calculos de idade gestacional, graficos e PDFs, causando resultados absurdos (ex: "semana 9999 de gestacao").
- **Solucao Proposta:**
  ```javascript
  function isValidDate(dateStr) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
      var d = new Date(dateStr + 'T12:00:00');
      if (isNaN(d.getTime())) return false;
      var parts = dateStr.split('-');
      return d.getFullYear() === parseInt(parts[0]) &&
             (d.getMonth() + 1) === parseInt(parts[1]) &&
             d.getDate() === parseInt(parts[2]);
  }
  ```

---

### [V13-SEC-007] Dados sensiveis de saude sem protecao local

- **Arquivo:** Dados em `localStorage` (chave `hadassa_meira_pregnancy`) e `hadassa_exams`
- **Risco:** MEDIO
- **Diagnostico:** Dados medicos sensiveis (resultados de exames de sangue, ultrassonografias, peso, pressao arterial, sintomas) estao armazenados em texto plano no localStorage. Qualquer extensao de navegador, script de terceiro, ou pessoa com acesso fisico ao dispositivo pode ler esses dados. A V1.2 removeu a criptografia decorativa (decisao correta), mas nenhuma alternativa foi implementada.
- **Solucao Proposta (longo prazo):**
  1. Implementar criptografia com PBKDF2 usando PIN/senha do usuario (chave derivada, nao armazenada)
  2. Alternativa: uso exclusivo de Firebase como storage (dados protegidos por autenticacao)
  3. Lock screen no app apos inatividade (ex: 5 minutos)

---

### [V13-ARQ-001] Poluicao do escopo global — 200+ funcoes e variaveis globais

- **Arquivo:** `app.js`, `features.js`, `extras.js`, `content.js`, `firebase-sync.js`
- **Risco:** MEDIO
- **Diagnostico:** Todas as funcoes e variaveis estao no escopo global (`window`). Sao aproximadamente 200+ funcoes e 50+ variaveis globais. Nao ha sistema de modulos, namespacing ou encapsulamento. Isso cria riscos de colisao de nomes (ex: `renderAll` poderia ser sobrescrito por qualquer script), dificulta testes unitarios, e impede tree-shaking.
- **Evidencia:**
  ```javascript
  // Todas as funcoes sao globais:
  function renderDashboard() { ... }     // app.js
  function renderWeeklyContent() { ... } // features.js
  function renderWeightCalc() { ... }    // extras.js
  function renderDashCalendar() { ... }  // content.js
  // Conflito potencial: "renderAll" poderia ser sobrescrita
  ```
- **Solucao Proposta:**
  1. Encapsular cada arquivo em IIFE ou usar padrao de modulo revelador:
  ```javascript
  // app.js
  var App = (function() {
      var privateVar = 'internal';
      function renderDashboard() { ... }
      return { renderDashboard: renderDashboard };
  })();
  ```
  2. Longo prazo: migrar para ES6 modules com bundler (Vite)

---

### [V13-ARQ-002] Funcoes excessivamente longas (>150 linhas)

- **Arquivos:** `app.js`, `features.js`
- **Risco:** MEDIO
- **Diagnostico:** Diversas funcoes excedem 150 linhas de codigo, violando o principio de responsabilidade unica. Funcoes longas sao dificeis de testar, manter e depurar.
- **Funcoes mais longas identificadas:**

| Funcao | Arquivo | Linhas (~) | Responsabilidades |
|--------|---------|------------|-------------------|
| `renderWeeklyContent()` | features.js | ~200 | Calcula IG, busca conteudo, gera hero card, grid, todos, dicas |
| `generatePDF()` | app.js | ~150 | Gera header, US, evolucao, consultas, exames, peso, notas |
| `getAllUSData()` | app.js | ~100 | Merge ultrasounds, parse exames, regex fallback, deduplicacao |
| `renderMomWeightTracker()` | extras.js | ~100 | Form, stats, historico, event listeners |
| `getPrintSummary()` | app.js | ~400+ | Gera HTML completo para impressao |

- **Solucao Proposta:** Decompor cada funcao em subfuncoes de 20-40 linhas com responsabilidade unica.

---

### [V13-ARQ-003] Duplicacao de logica entre getAllMomWeights() e renderMomWeightTracker()

- **Arquivo:** `app.js` (linhas 1924-1943) e `extras.js` (linhas 620-660)
- **Risco:** MEDIO
- **Diagnostico:** A logica de combinar pesos de consultas + tracker esta implementada em dois lugares: `getAllMomWeights()` no `app.js` e dentro de `renderMomWeightTracker()` no `extras.js`. Se a logica precisar ser atualizada (ex: adicionar nova fonte de dados), ambos os locais precisam ser alterados — risco de divergencia.
- **Solucao Proposta:** `renderMomWeightTracker()` deve chamar `getAllMomWeights()` ao inves de replicar a combinacao.

---

### [V13-PERF-001] Memory leaks — event listeners recriados a cada render

- **Arquivos:** `extras.js`, `features.js`, `app.js`
- **Risco:** ALTO
- **Diagnostico:** Funcoes de renderizacao como `renderMomWeightTracker()`, `renderHydration()`, `renderWeeklyContent()`, `renderBPHistory()` e `renderUltrasounds()` usam `innerHTML` para recriar o DOM e depois adicionam novos event listeners com `addEventListener`. A cada re-render, os listeners antigos NAO sao removidos (os elementos DOM sao substituidos pelo innerHTML, mas closures podem manter referencias). Em sessoes longas com muitas navegacoes, isso acumula centenas de listeners orfaos.
- **Evidencia:**
  ```javascript
  // extras.js - renderMomWeightTracker():
  container.innerHTML = html;  // Destroi DOM antigo
  document.getElementById('btnAddMomWeight').addEventListener('click', function() { ... });
  // Listener adicionado a cada render — sem cleanup

  // app.js - renderUltrasounds():
  container.innerHTML = html;
  container.querySelectorAll('[data-edit-us]').forEach(function(btn) {
      btn.addEventListener('click', function(e) { ... });
  });
  ```
- **Solucao Proposta:**
  1. Usar delegacao de eventos no container pai (event delegation):
  ```javascript
  // Uma vez na inicializacao:
  document.getElementById('toolsContent').addEventListener('click', function(e) {
      var target = e.target.closest('[data-action]');
      if (!target) return;
      switch(target.dataset.action) {
          case 'addWeight': handleAddWeight(); break;
          case 'deleteWeight': handleDeleteWeight(target.dataset.date); break;
      }
  });
  ```
  2. Isso elimina a necessidade de re-adicionar listeners a cada render

---

### [V13-PERF-002] Intervalos nao limpos — autoBackup e Firebase sync acumulam

- **Arquivo:** `app.js` (linha ~3736), `firebase-sync.js` (linha ~317)
- **Risco:** ALTO
- **Diagnostico:** `setInterval(autoBackup, 5 * 60 * 1000)` e `setInterval(syncPeriodically, ...)` sao configurados na inicializacao mas nunca sao limpos. Se o Service Worker recarregar a pagina, se o usuario fizer login/logout, ou se o app for reinicializado internamente, intervalos duplicados acumulam-se. Cada intervalo executa writes no IndexedDB (backup) e requests HTTP (Firebase sync) a cada 5 minutos.
- **Solucao Proposta:**
  ```javascript
  var backupIntervalId = null;
  function startAutoBackup() {
      if (backupIntervalId) clearInterval(backupIntervalId);
      backupIntervalId = setInterval(autoBackup, 5 * 60 * 1000);
  }
  ```

---

### [V13-PERF-003] Inline styles massivos em JavaScript — ~500+ caracteres por elemento

- **Arquivos:** `features.js`, `extras.js`, `app.js`
- **Risco:** MEDIO
- **Diagnostico:** Elementos dinamicos sao criados com strings de estilo inline extensas ao inves de classes CSS. Isso causa recalculo de estilo a cada render, aumenta o tamanho das strings JS, e impossibilita cache de estilos pelo browser. Alem disso, dificulta manutencao (mudanca visual requer alterar JS ao inves de CSS).
- **Exemplos:**
  ```javascript
  // extras.js - renderWeightCalc:
  html += '<div style="background:var(--pink-50);padding:12px;border-radius:14px;text-align:center;">' +
      '<div style="font-size:0.7em;color:var(--text-light);">IMC Pré-Gestacional</div>' +
      '<div style="font-size:1.5em;font-weight:800;color:var(--pink-600);">' + bmi.toFixed(1) + '</div>'
  // ~200 caracteres de estilo inline por div
  ```
- **Solucao Proposta:** Criar classes CSS em `styles.css` e referenciar por nome:
  ```css
  .stat-box { background: var(--pink-50); padding: 12px; border-radius: 14px; text-align: center; }
  .stat-box-label { font-size: 0.7em; color: var(--text-light); }
  .stat-box-value { font-size: 1.5em; font-weight: 800; color: var(--pink-600); }
  ```

---

### [V13-PERF-004] Chart.js recarregado a cada troca de aba — sem cache de instancia

- **Arquivo:** `app.js` (funcao `updateChart`, linha ~2696)
- **Risco:** MEDIO
- **Diagnostico:** A cada troca de sub-tab nos graficos (Batimentos → Peso → Femur → etc.), o grafico atual e destruido (`mainChart.destroy()`) e um novo e criado do zero. Se o usuario alternar rapidamente entre abas, isso causa garbage collection intensiva e possivel flickering. Os dados subjacentes nao mudam entre alternacoes.
- **Solucao Proposta:** Cache de instancias de Chart por tipo, destruindo apenas quando dados mudam:
  ```javascript
  var chartCache = {};
  function updateChart(type) {
      if (chartCache[type] && !chartCache[type].dirty) {
          // Reexibir chart existente
          return;
      }
      if (mainChart) mainChart.destroy();
      // ... criar novo chart ...
      chartCache[type] = { chart: mainChart, dirty: false };
  }
  ```

---

### [V13-PERF-005] getAllUSData() chamado multiplas vezes no mesmo render cycle

- **Arquivo:** `app.js`
- **Risco:** MEDIO
- **Diagnostico:** `getAllUSData()` e chamada em `renderDashboard()`, `renderParams()`, `renderRefTable()` (3 vezes — uma para cada tabela), `updateChart()`, e `renderRadarChart()`. Cada chamada faz JSON.parse do localStorage, filtra exames, executa regex em resultados texto, e ordena o array resultante. Em um ciclo de render completo, essa funcao pode executar 6-8 vezes com o mesmo resultado.
- **Solucao Proposta:** Cache com invalidacao:
  ```javascript
  var _usDataCache = null;
  var _usDataCacheVersion = 0;
  var _dataVersion = 0; // Incrementado em saveData()

  function getAllUSData() {
      if (_usDataCache && _usDataCacheVersion === _dataVersion) {
          return _usDataCache;
      }
      // ... logica existente ...
      _usDataCache = combined;
      _usDataCacheVersion = _dataVersion;
      return combined;
  }
  ```

---

### [V13-UX-001] Acessibilidade minima — app praticamente inacessivel para leitores de tela

- **Arquivo:** `index.html`, `app.js`, `features.js`
- **Risco:** ALTO (conformidade legal e inclusao)
- **Diagnostico:** O app tem apenas 2 atributos ARIA no HTML inteiro. Graficos Canvas (Chart.js) nao tem texto alternativo. Modais nao prendem o foco (focus trap). Nao ha navegacao por teclado (Tab/Enter/Escape). Badges de status usam apenas cor para transmitir informacao (inacessivel para daltonicos). Tabelas dinamicas geradas via JS nao tem headers corretos.
- **Itens ausentes:**
  - `aria-label` nos botoes de acao (editar, excluir, fechar)
  - `aria-live="polite"` nas areas que atualizam dinamicamente (stats, toasts)
  - `role="dialog"` e `aria-modal="true"` nos modais (parcialmente presente)
  - `alt` text nos graficos Canvas
  - Focus trap nos modais (Escape para fechar)
  - `tabindex` para navegacao logica
  - Indicadores visuais de foco (`outline`) nos botoes
- **Solucao Proposta:** Implementar WCAG 2.1 nivel AA progressivamente, comecando por:
  1. Aria labels em todos os botoes interativos
  2. Focus trap nos modais com suporte a Escape
  3. Texto descritivo abaixo de cada grafico Canvas
  4. Indicadores de status com icone + texto (nao apenas cor)

---

### [V13-UX-002] Sem indicador de modo offline

- **Arquivo:** `sw.js`, `index.html`
- **Risco:** MEDIO
- **Diagnostico:** O app funciona offline gracas ao Service Worker, mas nao informa ao usuario quando esta offline. O status de sincronizacao Firebase pode mostrar "Sincronizado" mesmo sem conexao (se a ultima sync foi bem-sucedida). O usuario pode fazer alteracoes offline sem saber que elas nao serao sincronizadas ate reconectar.
- **Solucao Proposta:**
  ```javascript
  window.addEventListener('online', function() {
      document.getElementById('offlineBanner').style.display = 'none';
      if (typeof syncToCloud === 'function') syncToCloud();
  });
  window.addEventListener('offline', function() {
      document.getElementById('offlineBanner').style.display = 'block';
  });
  ```

---

### [V13-UX-003] Modais sem suporte a tecla Escape

- **Arquivo:** `app.js` (funcoes `openModal`/`closeModal`)
- **Risco:** MEDIO
- **Diagnostico:** Os modais abrem e fecham por clique no botao de fechar ou no overlay, mas nao respondem a tecla Escape. Esse e um padrao de UX esperado universalmente e uma exigencia de acessibilidade (WCAG 2.1).
- **Solucao Proposta:**
  ```javascript
  document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
          var activeModal = document.querySelector('.modal-overlay.active');
          if (activeModal) closeModal(activeModal.id);
      }
  });
  ```

---

### [V13-UX-004] Touch targets pequenos demais em mobile

- **Arquivo:** `styles.css`, `index.html`
- **Risco:** MEDIO
- **Diagnostico:** Alguns botoes de acao (editar, excluir, fechar) e sub-tabs tem area de toque menor que 44x44px (minimo recomendado pela Apple e WCAG). Em telas pequenas, isso causa toques acidentais, especialmente nos botoes de excluir (acao destrutiva com alvo pequeno).
- **Solucao Proposta:**
  ```css
  .btn-small { min-height: 44px; min-width: 44px; }
  .sub-tab { min-height: 44px; padding: 10px 16px; }
  .modal-close { min-width: 44px; min-height: 44px; }
  ```

---

### [V13-UX-005] Formulario de peso da mae sem validacao visual

- **Arquivo:** `extras.js` (funcao `renderMomWeightTracker`)
- **Risco:** BAIXO
- **Diagnostico:** O formulario de registro de peso aceita qualquer numero sem feedback visual de faixa esperada. Um usuario pode acidentalmente digitar 6.5 ao inves de 65 kg, ou 650 ao inves de 65.0. Nao ha validacao de faixa (ex: 30-200 kg) nem confirmacao para valores atipicos.
- **Solucao Proposta:**
  ```javascript
  var val = parseFloat(valEl.value);
  if (val < 30 || val > 200) {
      if (!confirm('O peso ' + val + ' kg parece incomum. Deseja continuar?')) return;
  }
  ```

---

### [V13-UX-006] Sem feedback visual ao carregar graficos/relatorios

- **Arquivo:** `app.js`
- **Risco:** BAIXO
- **Diagnostico:** Ao trocar entre sub-tabs de graficos ou ao gerar um PDF, nao ha indicacao visual de loading. O usuario pode clicar multiplas vezes achando que nao funcionou, gerando multiplas instancias de Chart.js ou multiplos downloads de PDF.
- **Solucao Proposta:** Adicionar skeleton loading ou spinner durante criacao do grafico/PDF.

---

### [V13-ARQ-004] Sem rotacao de backup — apenas uma copia no IndexedDB

- **Arquivo:** `app.js` (funcao `autoBackup`, ~linha 106)
- **Risco:** MEDIO
- **Diagnostico:** O backup automatico sempre sobrescreve a mesma chave `'main_data'` no IndexedDB. Se os dados ja estiverem corrompidos quando o backup executa, a corrupao e salva sobre o backup anterior valido. Nao ha historico de backups.
- **Solucao Proposta:**
  ```javascript
  function autoBackup() {
      var timestamp = Date.now();
      var key = 'backup_' + timestamp;
      // Salvar com timestamp
      saveToBackupDB(key, JSON.stringify(appData));
      // Manter apenas os 3 ultimos backups
      cleanOldBackups(3);
  }
  ```

---

### [V13-ARQ-005] Dependencia circular entre scripts — ordem de carregamento importa

- **Arquivo:** `index.html` (linhas de script), todos os JS
- **Risco:** BAIXO
- **Diagnostico:** Os scripts sao carregados em ordem especifica (`app.js` → `features.js` → `extras.js` → `content.js` → `firebase-sync.js`). Cada script depende de funcoes do anterior (ex: `features.js` usa `appData`, `escapeHtml`, `formatDate` de `app.js`). Se a ordem mudar, o app quebra silenciosamente. Nao ha verificacao de dependencias.
- **Evidencia:**
  ```javascript
  // extras.js precisa de funcoes de app.js:
  typeof getAllMomWeights === 'function'  // Verificacao defensiva (linha 88)
  typeof calcCurrentGestationalAge === 'function'  // Verificacao defensiva
  typeof showToast === 'function'  // Verificacao defensiva
  ```
- **Solucao Proposta:** Documentar dependencias no topo de cada arquivo. Longo prazo: ES6 modules.

---

### [V13-COD-001] Uso exclusivo de `var` — sem block scoping (let/const)

- **Arquivos:** Todos os JS (~1.039 declaracoes `var`, 0 `let`, 0 `const`)
- **Risco:** MEDIO
- **Diagnostico:** Todo o codigo usa `var` para declaracao de variaveis, resultando em function scoping ao inves de block scoping. Isso permite hoisting inesperado e shadowing de variaveis em loops. Em 2026, `let`/`const` sao o padrao ha 10 anos.
- **Exemplo de risco:**
  ```javascript
  for (var i = 0; i < items.length; i++) {
      setTimeout(function() {
          console.log(items[i]); // 'i' sera items.length (ultimo valor)
      }, 100);
  }
  ```
- **Solucao Proposta:** Migrar progressivamente:
  - `const` para valores que nao mudam (a maioria)
  - `let` para contadores de loop e variaveis reatribuidas
  - `var` apenas se necessario para hoisting intencional

---

### [V13-COD-002] Magic numbers espalhados pelo codigo

- **Arquivos:** `app.js`, `extras.js`, `features.js`
- **Risco:** MEDIO
- **Diagnostico:** Numeros sem nome ou contexto aparecem em calculos criticos. Se o valor precisar mudar, e necessario buscar e alterar em multiplos locais.
- **Exemplos encontrados:**

| Valor | Local | Significado |
|-------|-------|-------------|
| `280` | app.js, features.js | Dias de gestacao (40 semanas) |
| `5 * 60 * 1000` | app.js | Intervalo de backup (5 min) |
| `800` | app.js | Max width para compressao de foto |
| `0.7` | app.js | Qualidade JPEG de compressao |
| `25` | app.js | Threshold de colo uterino seguro (mm) |
| `44` | styles.css | Touch target minimo (px) |
| `1500` | app.js | Timeout de animacao (ms) |
| `5 * 1024 * 1024` | app.js | Limite de foto (5MB) |

- **Solucao Proposta:**
  ```javascript
  var CONSTANTS = {
      PREGNANCY_DAYS: 280,
      BACKUP_INTERVAL_MS: 5 * 60 * 1000,
      PHOTO_MAX_WIDTH: 800,
      PHOTO_QUALITY: 0.7,
      SAFE_CERVIX_MM: 25,
      PHOTO_MAX_BYTES: 5 * 1024 * 1024,
      ANIMATION_DELAY_MS: 1500
  };
  ```

---

### [V13-COD-003] Funcao getPrintSummary() com ~400 linhas

- **Arquivo:** `app.js`
- **Risco:** MEDIO
- **Diagnostico:** A funcao `getPrintSummary()` gera um documento HTML completo para impressao com cabecalho, secao de informacoes, ultrassons, consultas, exames, notas, comparativos e rodape — tudo em uma unica funcao de ~400 linhas. E a funcao mais longa do projeto e combina formatacao HTML, logica de dados e calculos em um unico bloco.
- **Solucao Proposta:** Decompor em:
  - `getPrintHeader(config)`
  - `getPrintUltrasoundsSection(allUS)`
  - `getPrintAppointmentsSection(appointments)`
  - `getPrintExamsSection(exams)`
  - `getPrintNotesSection(notes)`
  - `getPrintSummary()` orquestra as sub-funcoes

---

### [V13-COD-004] Codigo morto — variaveis e funcoes nao utilizadas

- **Arquivos:** Diversos
- **Risco:** BAIXO
- **Diagnostico:** Restos de refatoracoes anteriores permanecem no codigo:
  - `firebase-sync.js`: `var syncTimeout = null` declarado mas nunca usado para cancelar timeout
  - Navegacao antiga (`<nav class="nav" ... style="display:none;">`) mantida no HTML "para compatibilidade"
  - Variaveis de configuracao referenciadas mas nunca setadas em certos fluxos
- **Solucao Proposta:** Audit de dead code com ferramenta estatica ou revisao manual.

---

### [V13-COD-005] Ausencia de tratamento de erros em operacoes DOM

- **Arquivos:** `app.js`, `features.js`, `extras.js`
- **Risco:** BAIXO
- **Diagnostico:** Chamadas a `document.getElementById()` nao verificam se o elemento existe antes de acessar propriedades. Se um ID for renomeado no HTML mas nao no JS, o app quebra silenciosamente com `Cannot read properties of null`.
- **Exemplos:**
  ```javascript
  document.getElementById('statHeartbeat').textContent = latestStats.heartbeat;
  // Se 'statHeartbeat' nao existir → TypeError
  ```
- **Solucao Proposta:** Helper seguro:
  ```javascript
  function setTextById(id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text;
  }
  ```

---

### [V13-COD-006] Regex frageis para extrair dados de resultados de exames

- **Arquivo:** `app.js` (linhas 2078-2097 da getAllUSData)
- **Risco:** BAIXO
- **Diagnostico:** A funcao `getAllUSData()` usa regex para extrair dados de texto livre dos resultados de exames como fallback. Patterns como `/(?:batimento|bcf|fc\s*fetal)[:\s]*(\d+)/i` sao frageis e podem produzir falsos positivos (ex: capturar numeros de telefone, codigos de referencia, ou quantidades de outros contextos).
- **Exemplos de falso positivo:**
  - Texto: "BCF: normal. Tel: 150" → captura 150 como batimento
  - Texto: "Peso da mãe: 65kg, peso fetal estimado em percentil 50" → captura 65 ao inves de percentil
- **Solucao Proposta:** Tornar o regex mais especifico e adicionar validacao de faixa:
  ```javascript
  var hbMatch = ex.results.match(/(?:batimento|bcf|fc\s*fetal)[:\s]*(\d{2,3})\s*(?:bpm)?/i);
  if (hbMatch) {
      var hb = parseInt(hbMatch[1]);
      if (hb >= 60 && hb <= 220) heartbeat = hb; // Faixa fisiologica valida
  }
  ```

---

## MATRIZ COMPLETA DE FINDINGS

| ID | Tipo | Risco | Arquivo(s) | Descricao |
|----|------|-------|-----------|-----------|
| V13-SEC-001 | Seguranca | CRITICO | index.html | CSP completamente removida (regressao) |
| V13-SEC-002 | Seguranca | ALTO | firebase-sync.js | Firebase config exposto no codigo |
| V13-SEC-003 | Seguranca | ALTO | features.js, extras.js | onclick/onchange inline em innerHTML |
| V13-SEC-004 | Seguranca | ALTO | firebase-sync.js, app.js | console.log em producao expoe dados |
| V13-SEC-005 | Seguranca | MEDIO | index.html | Sem HTTPS enforcement |
| V13-SEC-006 | Seguranca | MEDIO | app.js | Validacao de import aceita datas invalidas |
| V13-SEC-007 | Seguranca | MEDIO | localStorage | Dados de saude sem protecao local |
| V13-SEC-008 | Seguranca | BAIXO | app.js | Regex de exames pode gerar falso positivo |
| V13-DATA-001 | Integridade | CRITICO | firebase-sync.js | Sync sem merge — last write wins |
| V13-DATA-002 | Integridade | ALTO | app.js | getAllUSData pode retornar NaN |
| V13-DATA-003 | Integridade | ALTO | app.js, extras.js | Peso materno duplicado entre fontes |
| V13-DATA-004 | Integridade | MEDIO | app.js | Backup sem rotacao (sobrescreve unico) |
| V13-DATA-005 | Integridade | MEDIO | app.js | Import sobrescreve ao inves de merge |
| V13-ARQ-001 | Arquitetura | MEDIO | Todos os JS | 200+ funcoes no escopo global |
| V13-ARQ-002 | Arquitetura | MEDIO | app.js, features.js | Funcoes >150 linhas |
| V13-ARQ-003 | Arquitetura | MEDIO | app.js, extras.js | Logica de peso duplicada |
| V13-ARQ-004 | Arquitetura | MEDIO | app.js | Backup sem rotacao |
| V13-ARQ-005 | Arquitetura | BAIXO | Todos os JS | Dependencia circular implicita |
| V13-PERF-001 | Performance | ALTO | extras.js, features.js | Memory leak — listeners nao limpos |
| V13-PERF-002 | Performance | ALTO | app.js, firebase-sync.js | Intervalos nunca limpos |
| V13-PERF-003 | Performance | MEDIO | features.js, extras.js | Inline styles massivos em JS |
| V13-PERF-004 | Performance | MEDIO | app.js | Chart.js recriado a cada troca de aba |
| V13-PERF-005 | Performance | MEDIO | app.js | getAllUSData chamado 6-8x por render |
| V13-UX-001 | UX/A11y | ALTO | index.html, app.js | Acessibilidade minima (2 atributos ARIA) |
| V13-UX-002 | UX | MEDIO | sw.js, index.html | Sem indicador offline |
| V13-UX-003 | UX | MEDIO | app.js | Modais sem Escape |
| V13-UX-004 | UX | MEDIO | styles.css | Touch targets < 44px |
| V13-UX-005 | UX | BAIXO | extras.js | Peso sem validacao de faixa |
| V13-UX-006 | UX | BAIXO | app.js | Sem loading state em graficos/PDF |
| V13-COD-001 | Codigo | MEDIO | Todos os JS | var exclusivo (0 let/const) |
| V13-COD-002 | Codigo | MEDIO | Todos os JS | Magic numbers |
| V13-COD-003 | Codigo | MEDIO | app.js | getPrintSummary ~400 linhas |
| V13-COD-004 | Codigo | BAIXO | Diversos | Codigo morto remanescente |
| V13-COD-005 | Codigo | BAIXO | Todos os JS | getElementById sem null check |
| V13-COD-006 | Codigo | BAIXO | app.js | Regex frageis para extracao |

---

## EVOLUCAO V1.0 → V1.1 → V1.2 → V1.3

| Metrica | V1.0 | V1.1 | V1.2 | V1.3 |
|---------|------|------|------|------|
| Issues criticas abertas | 4 | 1 | 0 | 2 |
| Issues altas abertas | 16 | 12 | 0 | 5 |
| CSP efetiva | Inexistente | Com unsafe-inline | Sem unsafe-inline | **Removida (regressao)** |
| Criptografia | Nenhuma | AES-GCM decorativa | Transparente (honesta) | Transparente |
| API key | Hardcoded | .env publico | localStorage | localStorage |
| Fotos | Nao suportado | base64 localStorage | IndexedDB + compressao | IndexedDB + compressao |
| Sync multi-dispositivo | Nenhum | Nenhum | Nenhum | **Firebase (sem merge)** |
| Testes | Nenhum | Copias locais | Importam codigo real | Importam codigo real |
| Save errors | Silenciosos | Silenciosos | Visiveis | Visiveis |
| Dados unificados | Nao | Nao | Nao | **getAllUSData (exames+US)** |
| Peso materno | Nao | Nao | Apenas consultas | **Consultas + Tracker** |
| Acessibilidade | Minima | Minima | Minima | Minima |
| Modularizacao | Inline | Inline | app.js unico | 5 arquivos JS (global scope) |
| Arquivos JS | 0 (inline) | 0 (inline) | 1 (app.js) | 5 (app + features + extras + content + firebase-sync) |
| Total linhas JS | ~1.800 | ~2.000 | ~3.200 | ~7.700 |

---

## RECOMENDACAO DE ORDEM DE EXECUCAO

### PRIORIDADE IMEDIATA (P0) — Seguranca e Integridade
1. **V13-SEC-001:** Reintroduzir CSP com excecoes para Firebase
2. **V13-DATA-001:** Implementar merge por ID no Firebase sync
3. **V13-DATA-002:** Adicionar `safeParseFloat()` em `getAllUSData()`
4. **V13-SEC-004:** Remover/substituir todos os `console.log` por Logger

### CURTO PRAZO (P1) — Robustez
5. **V13-SEC-003:** Substituir onclick inline por addEventListener
6. **V13-DATA-003:** Unificar logica de peso em getAllMomWeights()
7. **V13-PERF-001:** Implementar event delegation nos renders
8. **V13-PERF-002:** Guardar IDs de interval e limpar no cleanup
9. **V13-SEC-006:** Validar datas logicamente no import

### MEDIO PRAZO (P2) — UX e Performance
10. **V13-UX-001:** ARIA labels e keyboard navigation (progressivo)
11. **V13-UX-002:** Indicador de modo offline
12. **V13-UX-003:** Escape para fechar modais
13. **V13-PERF-005:** Cache de getAllUSData por render cycle
14. **V13-PERF-003:** Migrar inline styles para classes CSS
15. **V13-ARQ-002:** Decompor funcoes longas (>150 linhas)

### LONGO PRAZO (P3) — Modernizacao
16. **V13-COD-001:** Migrar var → let/const
17. **V13-ARQ-001:** Encapsular em modulos (IIFE ou ES6)
18. **V13-COD-002:** Extrair magic numbers para constantes
19. **V13-ARQ-004:** Rotacao de backup (manter 3 ultimos)
20. **V13-SEC-007:** Protecao de dados locais (PIN/lock screen)
21. **ARQ-012:** Build process com Vite

---

## ASPECTOS POSITIVOS IDENTIFICADOS

1. **Sistema de dados unificado (`getAllUSData`)** — Resolve o problema critico de dados isolados entre ultrassons e exames
2. **Protecao contra sobrescrita vazia no Firebase** — `syncToCloud()` verifica se dados locais estao vazios antes de enviar
3. **Formulario simplificado de ultrassom** — Medidas opcionais em secao colapsavel reduz atrito
4. **Tracker de peso materno independente** — Permite registro sem depender de consultas
5. **Funcoes de analise puras** — `analyzeHeartbeat()`, `analyzeWeight()`, `analyzeFemur()` sao testaveis
6. **Sistema de backup IndexedDB** — Mais resistente que localStorage para dados criticos
7. **Compressao de fotos no upload** — Previne estouro de cota
8. **Validacao de import robusta** — Whitelist de campos, validacao de tipos, limite de tamanho
9. **Firebase Auth com Google** — Autenticacao segura sem gerenciamento de senhas
10. **PWA funcional offline** — Service Worker com network-first e cache fallback

---

## OBSERVACOES FINAIS

### Riscos Remanescentes Criticos
1. **Risco #1 (NOVO):** CSP removida significa ZERO protecao contra XSS — qualquer vulnerabilidade de injecao e exploravel
2. **Risco #2 (NOVO):** Firebase sync pode perder dados em uso multi-dispositivo (sem merge)
3. **Risco #3:** Dados de saude em texto plano no localStorage — acessiveis por extensoes/scripts
4. **Risco #4:** Firebase API key publica — depende exclusivamente de Security Rules

### Nota sobre Complexidade Crescente
O app cresceu de ~1.800 linhas (V1.0) para ~7.700 linhas (V1.3) em 3 dias. A arquitetura de scripts globais sem modulos esta atingindo seu limite pratico. Novos recursos adicionados sem refatoracao estrutural aumentam o risco de bugs de integracao e regressoes. Recomenda-se fortemente um ciclo de refatoracao (modularizacao, testes, linting) antes de adicionar novas features.

---

**Auditoria realizada por:** Claude Code (Opus 4.6)
**Versao do Documento:** 1.3
**Baseada em:** AUDIT_V1.0.md, AUDIT_V1.1.md, AUDIT_V1.2.md + analise completa do codebase atual
**Findings totais:** 37 (2 criticos, 10 altos, 18 medios, 7 baixos)
**Proxima Revisao Sugerida:** Apos implementacao das correcoes P0 (CSP, Firebase merge, safeParseFloat)
