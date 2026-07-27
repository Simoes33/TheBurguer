# 📸 Como Conectar o Instagram Real ao The Burguer

Este guia explica como obter um **token de acesso oficial da API do Instagram** para que o feed do seu perfil apareça automaticamente no site.

> [!IMPORTANT]
> Você precisa ter uma conta **Instagram Business ou Creator** conectada a uma **Página do Facebook** para usar a API oficial. Contas pessoais não são suportadas.

---

## Pré-requisitos

1. ✅ Conta Instagram **Business** ou **Creator** ([@hamburgueria.theburguer](https://www.instagram.com/hamburgueria.theburguer/))
2. ✅ Uma **Página do Facebook** vinculada a essa conta Instagram
3. ✅ Acesso ao [Meta for Developers](https://developers.facebook.com/)

---

## Passo 1 – Criar um App no Meta Developers

1. Acesse [developers.facebook.com](https://developers.facebook.com/) e faça login.
2. Clique em **"My Apps"** → **"Create App"**.
3. Escolha o tipo **"Business"**.
4. Dê um nome (ex: `TheBurguer`) e clique em **"Create App"**.

---

## Passo 2 – Adicionar o produto "Instagram Graph API"

1. No painel do App, clique em **"Add Product"**.
2. Encontre **"Instagram"** e clique em **"Set Up"**.
3. Siga o assistente para conectar sua **Página do Facebook** e sua **conta Instagram**.

---

## Passo 3 – Gerar o Token de Curta Duração

1. Acesse o [**Graph API Explorer**](https://developers.facebook.com/tools/explorer/).
2. Selecione seu App no menu suspenso.
3. Clique em **"Generate Access Token"** e autorize o app.
4. Adicione as permissões:
   - `instagram_basic`
   - `instagram_content_publish` *(opcional)*
   - `pages_show_list`
5. Copie o token gerado (ele dura **1 hora** — vamos convertê-lo abaixo).

---

## Passo 4 – Converter para Token de Longa Duração (60 dias)

Abra o terminal e rode o comando abaixo, substituindo os valores:

```bash
curl -i -X GET "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=SEU_APP_ID&client_secret=SEU_APP_SECRET&fb_exchange_token=SEU_TOKEN_DE_CURTA_DURACAO"
```

- `SEU_APP_ID` → encontrado em **Settings > Basic** do seu App
- `SEU_APP_SECRET` → mesmo lugar
- `SEU_TOKEN_DE_CURTA_DURACAO` → o token copiado no Passo 3

A resposta será um JSON com o campo `access_token` — esse é o seu **token de longa duração** (~60 dias).

---

## Passo 5 – Adicionar o Token ao Projeto

Abra o arquivo `backend/.env` e cole o token:

```env
INSTAGRAM_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Depois, reinicie o backend:

```bash
cd backend
npm run start:dev
```

---

## Passo 6 – Verificar

Acesse no seu navegador:

```
http://localhost:3000/instagram/feed
```

Se tudo estiver correto, você verá um JSON com os posts do Instagram. 🎉

---

## ⚠️ Renovando o Token (a cada ~60 dias)

Os tokens de longa duração expiram em ~60 dias. Para renovar automaticamente, rode:

```bash
curl -i -X GET "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=ig_refresh_token&access_token=SEU_TOKEN_ATUAL"
```

> [!TIP]
> Configure uma tarefa agendada para renovar o token automaticamente antes que expire.

---

## Feed de Emergência (Enquanto Não Tem Token)

Enquanto o token não estiver configurado, o site exibirá **fotos de hambúrgueres de alta qualidade** como placeholder. Elas são substituídas automaticamente quando o token for configurado.

Para forçar uma atualização do cache (sem reiniciar o servidor):

```bash
curl -X POST http://localhost:3000/instagram/refresh
```
