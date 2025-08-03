# Análise de Documentos com IA (OCR + LLM)

Este é um projeto full-stack que demonstra uma solução completa para o processamento e análise inteligente de documentos. A aplicação permite que usuários autenticados façam upload de imagens de documentos (como faturas ou recibos), extrai o texto contido nelas através de OCR, e oferece uma interface interativa para que o usuário possa fazer perguntas sobre o conteúdo extraído, recebendo respostas geradas por um Modelo de Linguagem (LLM).

## Funcionalidades Principais

-   **Autenticação de Usuários:** Sistema seguro de cadastro e login com tokens JWT para proteger as rotas da API.
-   **Upload Seguro de Documentos:** Endpoint protegido para upload de arquivos de imagem.
-   **Extração de Texto (OCR):** Processamento assíncrono em segundo plano que utiliza Tesseract.js para extrair o texto de imagens.
-   **Análise com IA (LLM):** Integração com a API do Google Gemini para permitir que os usuários façam perguntas em linguagem natural sobre o conteúdo dos documentos.
-   **Gerenciamento de Documentos:**
    -   Visualização da lista de documentos enviados com seus respectivos status (Processando, Concluído, Falhou).
    -   Página de detalhes para cada documento, exibindo o texto extraído e o histórico de interações com a IA.
    -   Funcionalidade para download de um relatório em `.txt` contendo o texto e as interações.

## Tech Stack

| Categoria      | Tecnologia                                                              |
| :------------- | :---------------------------------------------------------------------- |
| **Frontend** | Next.js, React, TypeScript, Tailwind CSS                                |
| **Backend** | NestJS, TypeScript, Prisma (ORM)                                        |
| **Banco de Dados** | PostgreSQL                                                              |
| **IA / ML** | Tesseract.js (OCR), Google Gemini (LLM)                                 |
| **DevOps** | Docker, Docker Compose                                                  |

## Como Executar Localmente

Siga os passos abaixo para configurar e rodar o projeto no seu ambiente.

### Pré-requisitos

-   Git
-   Docker e Docker Compose
-   Uma chave de API do **[Google AI Studio (Gemini)](https://aistudio.google.com/)**

### 1. Clonar o Repositório

```bash
git clone [https://github.com/seu-usuario/nome-do-repositorio.git](https://github.com/seu-usuario/nome-do-repositorio.git)
cd nome-do-repositorio
```

### 2. Configurar Variáveis de Ambiente

Você precisará de dois arquivos `.env`. Use os arquivos `.env.example` (que você pode criar) como modelo.

**a. Crie o `.env` do Backend:**
Crie o arquivo `backend/.env` e adicione as seguintes variáveis:
```env
# backend/.env
DATABASE_URL="postgresql://user:mysecretpassword@db:5432/db?schema=public"
JWT_SECRET="gere_uma_chave_segura_aqui"
GEMINI_API_KEY="sua_chave_de_api_do_gemini"
```
> **Nota:** O `HOST` do banco de dados agora é `db`, o nome do serviço no `docker-compose.yml`.

**b. Crie o `.env` do Frontend:**
Crie o arquivo `frontend/.env.local` e adicione a seguinte variável:
```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Construir e Iniciar os Contêineres

Com o Docker em execução, execute o seguinte comando na raiz do projeto:

```bash
docker compose up --build -d
```
Este comando irá construir as imagens do frontend e backend e iniciar todos os três contêineres (frontend, backend, db) em segundo plano (`-d`).
<!--
### 4. Executar as Migrações do Banco de Dados

Após os contêineres estarem no ar, o banco de dados estará pronto, mas vazio. Execute a migração do Prisma para criar as tabelas:

```bash
docker-compose exec backend npx prisma migrate dev
``` -->

### 4. Acessar a Aplicação

-   **Frontend:** [http://localhost:3001](http://localhost:3001)
-   **Backend API:** [http://localhost:3000](http://localhost:3000)

Pronto! Agora você pode se cadastrar, fazer login e usar todas as funcionalidades da aplicação.
