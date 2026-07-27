# The Burguer Enterprise

Plataforma fullstack de alto nível para gerenciamento de Hamburgueria.
Desenvolvida utilizando **NestJS** (Backend), **React** (Frontend) e **PostgreSQL** (Banco de Dados).

## Pré-requisitos (IMPORTANTE)

Para rodar este projeto, você precisa ter instalado no seu computador:
1. [Node.js](https://nodejs.org/en) (Recomendado versão 20 LTS ou superior)
2. [PostgreSQL](https://www.postgresql.org/download/) (Banco de Dados)

---

## Como rodar o Backend (NestJS)

1. Abra o terminal na pasta `backend`.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure o Banco de Dados:
   - Crie um banco de dados no seu PostgreSQL chamado `theburguer`.
   - Renomeie o arquivo `backend/.env.example` para `backend/.env` e ajuste a string de conexão do `DATABASE_URL` de acordo com seu usuário e senha do Postgres.
4. Rode as migrações do banco (isso criará todas as tabelas):
   ```bash
   npm run db:push
   ```
5. Inicie o servidor:
   ```bash
   npm run start:dev
   ```
A API estará rodando em `http://localhost:3000`.
A documentação da API (Swagger) estará em `http://localhost:3000/api/docs`.

---

## Como rodar o Frontend (React/Vite)

1. Abra outro terminal na pasta `frontend`.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
A interface do cliente estará disponível em `http://localhost:5173`.
