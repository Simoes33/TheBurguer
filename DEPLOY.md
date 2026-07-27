# 🚀 Guia de Deploy - The Burguer

Este documento contém o passo a passo para colocar a plataforma no ar de forma profissional e segura.

---

## 1. Banco de Dados & Storage (Supabase)
O seu banco de dados e as imagens já estão na nuvem, então não precisam de "deploy".
- **Verificação:** Certifique-se de que a `DATABASE_URL` no seu backend aponte para o link do Supabase (como já configuramos).

---

## 2. Backend (Sugerido: Railway ou Render)

### Passo a Passo no Railway:
1. Crie uma conta em [railway.app](https://railway.app).
2. Clique em **New Project** > **Deploy from GitHub repo**.
3. Selecione o seu repositório.
4. Vá em **Settings** > **Root Directory** e coloque `/backend`.
5. Vá em **Variables** e adicione as seguintes chaves do seu `.env`:
   - `DATABASE_URL`: (Seu link do banco)
   - `DIRECT_URL`: (Seu link direto do banco)
   - `JWT_SECRET`: (Uma frase secreta longa e segura)
   - `SUPABASE_URL`: (Link do seu projeto Supabase)
   - `SUPABASE_KEY`: (Sua Service Role Key do Supabase)
   - `STRIPE_SECRET_KEY`: (Sua chave secreta do Stripe)
6. O Railway gerará um domínio para você (ex: `api-production.up.railway.app`). **Copie este link.**

---

## 3. Frontend (Sugerido: Vercel)

### Passo a Passo na Vercel:
1. Crie uma conta em [vercel.com](https://vercel.com).
2. Clique em **Add New** > **Project**.
3. Importe o seu repositório do GitHub.
4. Em **Root Directory**, selecione a pasta `frontend`.
5. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`: (URL do seu Supabase)
   - `VITE_SUPABASE_ANON_KEY`: (Sua chave ANON do Supabase)
   - `VITE_API_URL`: (O link que o Railway gerou no passo anterior)
6. Clique em **Deploy**.

---

## 4. Ajustes Finais de Segurança

### Atualizar URLs de Redirecionamento (Auth):
- **No Supabase:** Vá em *Authentication > URL Configuration* e mude o **Site URL** para o link que a Vercel te deu.
- **No Google Cloud Console:** Adicione o link da Vercel em *Origens JavaScript autorizadas* e o link do Supabase `auth/v1/callback` em *URIs de redirecionamento autorizados*.

### Webhooks do Stripe:
- Se você usar Webhooks para confirmação automática de pagamento, você precisará configurar o link do seu backend no painel do Stripe em *Developers > Webhooks*.

---

## 💡 Dica de Ouro
Sempre que você fizer um `git push`, o site se atualizará sozinho tanto no Backend quanto no Frontend. Isso é o que chamamos de **Continuous Deployment (CD)**.

Boa sorte com o lançamento! 🍔🔥
