# 🚀 Guia de Deploy - The Burguer

Este documento contém o passo a passo para colocar a plataforma no ar de forma profissional e segura.

---

## 1. Banco de Dados & Storage (Supabase)
O seu banco de dados e as imagens já estão na nuvem, então não precisam de "deploy".
- **Verificação:** Certifique-se de que a `DATABASE_URL` no seu backend aponte para o link do Supabase (como já configuramos).

---

## 2. Backend (Render ou Railway)

### Passo a Passo no Render:
1. Crie uma conta em [render.com](https://render.com).
2. Clique em **New +** > **Web Service** > Conecte seu repositório GitHub.
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
4. Em **Environment Variables**, adicione as chaves do seu `.env` (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_KEY`, etc.).
5. Copie a URL gerada (ex: `https://theburguer.onrender.com`).

---

## 3. Frontend (Vercel)

### Passo a Passo na Vercel:
1. Crie uma conta em [vercel.com](https://vercel.com).
2. Clique em **Add New** > **Project** e importe o repositório.
3. Em **Root Directory**, selecione a pasta `frontend`.
4. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`: (URL do seu Supabase)
   - `VITE_SUPABASE_ANON_KEY`: (Sua chave ANON do Supabase)
   - `VITE_API_URL`: (Link do seu backend, ex: `https://theburguer.onrender.com`)
5. Clique em **Deploy**.

---

## 4. 💓 Sistema de Heartbeat & Keep-Alive 24/7 (Nunca Deixa o Banco Pausar)

Para evitar que o plano gratuito do Render entre em hibernação (sleep) e o Supabase pause por 7 dias de inatividade, o sistema possui 3 proteções ativas:

### 1. GitHub Actions Automático (Já Configurado)
- O arquivo `.github/workflows/keepalive.yml` roda a cada 10 minutos automaticamente no GitHub.
- Ele envia um ping para `https://theburguer.onrender.com/health`, executando uma query leve no banco de dados para mantê-lo 100% acordado.

### 2. Monitor Gratuito Externo (Altamente Recomendado)
Para ter redundância total e garantir 100% de uptime sem depender apenas do GitHub Actions:
1. Crie uma conta gratuita no [cron-job.org](https://cron-job.org) ou [uptimerobot.com](https://uptimerobot.com).
2. Adicione um novo monitor HTTP GET apontando para:
   `https://theburguer.onrender.com/health`
3. Defina o intervalo para **cada 5 ou 10 minutos**.
4. Pronto! O Render nunca entrará em sleep e o Supabase nunca será pausado.

---

## 5. Ajustes Finais de Segurança

### Atualizar URLs de Redirecionamento (Auth):
- **No Supabase:** Vá em *Authentication > URL Configuration* e mude o **Site URL** para o link da Vercel.
- **No Google Cloud Console:** Adicione o link da Vercel em *Origens JavaScript autorizadas* e o link do Supabase `auth/v1/callback` em *URIs de redirecionamento autorizados*.

### Webhooks do Stripe:
- Se você usar Webhooks para confirmação automática de pagamento, você precisará configurar o link do seu backend no painel do Stripe em *Developers > Webhooks*.

---

## 💡 Dica de Ouro
Sempre que você fizer um `git push`, o site se atualizará sozinho tanto no Backend quanto no Frontend. Isso é o que chamamos de **Continuous Deployment (CD)**.

Boa sorte com o lançamento! 🍔🔥
