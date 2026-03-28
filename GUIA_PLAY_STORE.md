# GUIA COMPLETO: Publicar "Mamãe App" na Play Store

## PRÉ-REQUISITOS
- [x] App funcionando (PWA)
- [x] Manifest.json configurado
- [x] Política de Privacidade (legal.html)
- [x] Conta Google Play Developer — J.F INOVAÇÕES DIGITAIS
- [x] Ícone PNG 512x512 (icon-512.png)
- [x] Pacote AAB gerado (Mamãe App.aab)
- [x] AssetLinks configurado (.well-known/assetlinks.json)
- [x] Signing key salva (signing.keystore)
- [ ] Screenshots do app (mínimo 4)
- [x] Descrição curta e longa (abaixo)

---

## PASSO 1: Gerar Ícone PNG (5 minutos)

1. Abra o arquivo `generate-icon.html` no navegador Chrome
2. Clique **"Baixar PNG 512x512"** → salva `icon-512x512.png`
3. Clique **"Baixar PNG 192x192"** → salva `icon-192x192.png`
4. Guarde os dois arquivos — vai precisar deles

---

## PASSO 2: Tirar Screenshots do App (15 minutos)

A Play Store pede **mínimo 4 screenshots**, recomendo 6-8.

### No Celular Android:
1. Abra o app no Chrome do celular
2. Tire print das telas mais bonitas:
   - **Screenshot 1:** Dashboard (página inicial com semanas + consultas)
   - **Screenshot 2:** Conteúdo semanal (stories aberto)
   - **Screenshot 3:** Gráficos (Peso Mãe ou Batimentos)
   - **Screenshot 4:** Registro de peso (formulário + histórico)
   - **Screenshot 5:** Caderneta de vacinação
   - **Screenshot 6:** Assistente IA (chat aberto)
   - **Screenshot 7:** Relatório PDF
   - **Screenshot 8:** Lista do enxoval

### Dica: Use prints no modo claro (mais bonito para a loja)

### Tamanho recomendado: 1080x1920 (vertical)

---

## PASSO 3: Criar Conta Google Play Developer (10 minutos)

1. Acesse: https://play.google.com/console/signup
2. Faça login com sua conta Google (a mesma ou outra dedicada)
3. Aceite os termos de desenvolvedor
4. Pague a taxa única de **US$ 25 (~R$ 130)**
   - Aceita cartão de crédito/débito internacional
5. Preencha:
   - Nome do desenvolvedor: **Ana Jéssica Freire** (ou nome da empresa)
   - E-mail de contato: seu e-mail
   - Telefone: seu número
   - Site: https://anajmfreire.github.io/jornada-hadassa-meira/

**IMPORTANTE:** A conta demora 24-48h para ser totalmente ativada.

---

## PASSO 4: Gerar o Pacote AAB com PWABuilder (20 minutos)

O PWABuilder transforma seu site PWA em um app Android automaticamente.

1. Acesse: **https://www.pwabuilder.com**
2. Cole a URL: `https://anajmfreire.github.io/jornada-hadassa-meira/`
3. Aguarde a análise (30 segundos)
4. Clique **"Package for stores"**
5. Selecione **"Android"**
6. Configure:
   - **Package name:** `com.jfinova.mamaeapp` (ou `com.anajmfreire.minhagestacao`)
   - **App name:** Mamãe App
   - **App version:** 1.0.0
   - **Version code:** 1
   - **Host:** anajmfreire.github.io
   - **Start URL:** /jornada-hadassa-meira/
   - **Icon:** Upload o `icon-512x512.png` que você gerou
   - **Splash screen color:** #ec4899
   - **Theme color:** #ec4899
   - **Status bar color:** #ec4899
   - **Navigation bar color:** #ffffff
   - **Signing key:** **Generate new** (GUARDE ESSA CHAVE! Sem ela não consegue atualizar o app depois)
7. Clique **"Download"**
8. Vai baixar um arquivo `.zip` contendo:
   - `app-release-signed.aab` ← **ESTE é o arquivo para a Play Store**
   - `assetlinks.json` ← precisará adicionar ao seu site
   - `signing-key.jks` ← **GUARDE EM LUGAR SEGURO!**

---

## PASSO 5: Configurar Digital Asset Links (5 minutos)

O Google precisa verificar que o app pertence ao seu site.

1. No ZIP do PWABuilder, encontre o arquivo `assetlinks.json`
2. Crie a pasta `.well-known` no seu projeto:
   - Crie o arquivo: `.well-known/assetlinks.json`
   - Cole o conteúdo do arquivo que veio no ZIP
3. Faça commit e push para o GitHub

**OU** eu posso fazer isso quando você me enviar o conteúdo do assetlinks.json.

---

## PASSO 6: Criar o App na Play Console (30 minutos)

1. Acesse: https://play.google.com/console
2. Clique **"Criar app"**
3. Preencha:
   - **Nome do app:** Mamãe App - Diário da Gravidez
   - **Idioma padrão:** Português (Brasil)
   - **App ou jogo:** App
   - **Gratuito ou pago:** **Gratuito** (a monetização é via link externo/Hotmart)
   - Aceite as declarações

### 6.1 Ficha da Loja (Store listing)

**Título:** `Mamãe App - Diário da Gravidez`

**Descrição curta (80 chars):**
```
Acompanhe cada semana da sua gravidez com ultrassons, peso, IA e muito mais!
```

**Descrição longa (até 4000 chars):**
```
Mamãe App é o app mais completo para acompanhar cada semana da sua gravidez. Tudo em um só lugar, sem assinatura mensal.

🤰 SEMANA A SEMANA
Acompanhe o desenvolvimento do seu bebê da semana 4 à 42. Saiba o tamanho, peso e tudo que está se formando. Conteúdo diário com dicas personalizadas para cada fase.

📊 GRÁFICOS E EVOLUÇÃO
Visualize batimentos cardíacos, peso do bebê, fêmur, CCN com gráficos profissionais. Compare com referências médicas internacionais (OMS, Hadlock, INTERGROWTH-21st).

⚖️ CONTROLE DE PESO
Registre seu peso semanalmente e veja se está na faixa ideal baseada no seu IMC. Gráfico de evolução com faixa min/máx recomendada.

🩺 ULTRASSONS E EXAMES
Registre todos os ultrassons com foto, medidas e observações. Gerencie exames de sangue, rotina, glicemia com campos específicos. Análise automática de batimentos, peso e fêmur.

💉 CADERNETA DE VACINAÇÃO
Cartão de vacinação completo da gestante com 10 vacinas. Marque as doses tomadas, agende lembretes e acompanhe o progresso.

🤖 ASSISTENTE IA
Tire dúvidas sobre sua gestação com inteligência artificial. Dicas da semana, análise de exames, alimentação e muito mais.

📋 RELATÓRIOS PDF
Gere relatórios profissionais para levar ao médico: ultrassons, evolução, consultas e peso materno.

📝 DIÁRIO E SINTOMAS
Registre sintomas diários, anotações, receitas médicas e até uma carta para o seu bebê. Heatmap de sintomas dos últimos 7 dias.

🧸 LISTAS COMPLETAS
Enxoval do bebê, mala da maternidade (mãe e bebê) — tudo com quantidades e tamanhos. Checklist prático.

🍼 AMAMENTAÇÃO
Timer de amamentação com registro de lado, duração e histórico diário.

💊 MAIS FUNCIONALIDADES:
• Plano de parto editável
• Pressão arterial com histórico
• Calculadora de licença maternidade
• Contador de movimentos fetais
• Compartilhamento de card para WhatsApp
• Conquistas e gamificação
• Glossário de termos médicos
• Perguntas frequentes da gravidez

☁️ SINCRONIZAÇÃO
Faça login com Google e seus dados sincronizam entre celular, tablet e computador. Backup automático na nuvem.

📱 FUNCIONA OFFLINE
Depois de acessar uma vez, funciona 100% sem internet. Seus dados ficam salvos no celular.

🔒 PRIVACIDADE
Seus dados são seus. Sem propagandas, sem rastreamento. Política de privacidade transparente.

❤️ Feito com amor para mamães. Não substitui consultas médicas — sempre siga as orientações do seu obstetra.
```

**Ícone:** Upload `icon-512x512.png`
**Feature graphic (1024x500):** Pode criar no Canva — fundo rosa com texto "Mamãe App" + prints do app
**Screenshots:** Upload as 4-8 screenshots que tirou

### 6.2 Classificação de conteúdo

1. Vá em **"Política" > "Classificação de conteúdo"**
2. Inicie o questionário
3. Respostas:
   - Categoria: **Utilitários / Saúde e Fitness**
   - Violência: Não
   - Sexualidade: Não
   - Linguagem: Não
   - Substâncias: Não
   - Conteúdo controlado: Não
4. Resultado esperado: **Livre** (para todos)

### 6.3 Público-alvo

- **Faixa etária alvo:** 18+ (gestantes adultas)
- **NÃO é direcionado a crianças** (marcar que NÃO é para menores de 13)

### 6.4 Privacidade

- **URL da política de privacidade:** `https://anajmfreire.github.io/jornada-hadassa-meira/legal.html`
- Coleta dados pessoais? **Sim** (nome, dados de saúde)
- Dados sensíveis de saúde? **Sim**
- Criptografia de dados em trânsito? **Sim** (HTTPS)

### 6.5 Declaração de Saúde

A Google pode pedir declaração extra por ser app de saúde:
- Declarar que NÃO é dispositivo médico
- Declarar que NÃO substitui diagnóstico médico
- Incluir disclaimer visível no app (JÁ TEMOS!)

---

## PASSO 7: Upload do AAB e Publicação (10 minutos)

1. No Google Play Console, vá em **"Produção" > "Criar nova versão"**
2. Upload o arquivo `app-release-signed.aab`
3. Preencha notas da versão:
```
Versão 1.0.0 - Lançamento inicial
• Acompanhamento semanal da gestação (semanas 4-42)
• Registro de ultrassons com análise automática
• Gráficos de evolução do bebê
• Controle de peso materno com faixa ideal
• Caderneta de vacinação completa
• Assistente IA para dúvidas
• Relatórios PDF profissionais
• Sincronização na nuvem com Google
```
4. Clique **"Revisar versão"**
5. Clique **"Iniciar lançamento para produção"**

---

## PASSO 8: Aguardar Aprovação (1-7 dias)

- Primeiro app: pode demorar até **7 dias**
- Apps subsequentes: 1-3 dias
- Se rejeitar, eles dizem o motivo e você corrige

### Motivos comuns de rejeição e como evitar:
| Motivo | Solução |
|--------|---------|
| Política de privacidade incompleta | Já temos uma completa ✅ |
| App não funciona | Já está funcionando ✅ |
| Conteúdo de saúde sem disclaimer | Já temos disclaimer ✅ |
| Screenshots enganosas | Use prints reais do app |
| AssetLinks não configurado | Passo 5 acima |

---

## CUSTOS RESUMO

| Item | Custo |
|------|-------|
| Conta Google Play Developer | R$ 130 (único, para sempre) |
| PWABuilder | Grátis |
| Hospedagem (GitHub Pages) | Grátis |
| Firebase (até 10K usuários) | Grátis |
| **Total para lançar** | **R$ 130** |

---

## APÓS APROVAÇÃO

1. O app estará em: `https://play.google.com/store/apps/details?id=com.jfinova.mamaeapp`
2. Compartilhe o link nas redes sociais
3. Configure o link de compra na Hotmart/Kiwify apontando para a Play Store
4. Ou mantenha o modelo de venda direta (link + código de acesso)

---

## MODELO DE MONETIZAÇÃO NA PLAY STORE

**Opção A: App Gratuito + Compra pelo site (recomendado)**
- App gratuito na Play Store (mais downloads)
- Funcionalidade bloqueada sem código de acesso
- Compra via Hotmart/Kiwify → recebe código
- Google NÃO cobra comissão (pagamento externo)

**Opção B: App Pago na Play Store**
- Preço: R$ 29,90 na Play Store
- Google cobra 15% (primeiro R$ 1M/ano) = R$ 4,49 por venda
- Você recebe: R$ 25,41 por venda
- Vantagem: sem fricção, compra com 1 clique

**Recomendação:** Comece com Opção A (gratuito + Hotmart). Se o volume de vendas justificar, mude para Opção B.
