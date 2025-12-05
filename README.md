# AprovaTec Backend

Backend do sistema AprovaTec desenvolvido em TypeScript com Express e MongoDB.

## Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn
- MongoDB (local ou remoto)

## Instalação

1. Clone o repositório (se aplicável) ou navegue até o diretório do projeto:
```bash
cd aprovatec
```

2. Instale as dependências:
```bash
npm install
```

## Configuração

1. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis de ambiente:

```env
MONGO_URI=mongodb://localhost:27017/aprovatec
JWT_SECRET=seu_secret_jwt_aqui
PORT=3000
```

**Nota:** 
- `MONGO_URI`: URL de conexão com o MongoDB (obrigatório)
- `JWT_SECRET`: Chave secreta para assinatura dos tokens JWT (obrigatório)
- `PORT`: Porta em que o servidor irá rodar (opcional, padrão: 3000)

## Como Executar

### Modo Desenvolvimento

Para rodar o projeto em modo de desenvolvimento com hot-reload:

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3000` (ou na porta definida no `.env`).

### Modo Produção

1. Primeiro, compile o projeto TypeScript:

```bash
npm run build
```

2. Em seguida, inicie o servidor:

```bash
npm start
```

## Scripts Disponíveis

- `npm run dev`: Inicia o servidor em modo desenvolvimento com hot-reload
- `npm run build`: Compila o código TypeScript para JavaScript
- `npm start`: Inicia o servidor em modo produção (requer build prévio)

## Estrutura do Projeto

```
src/
├── controllers/     # Controladores das rotas
├── database/       # Configuração do banco de dados
├── middlewares/    # Middlewares (autenticação, etc.)
├── models/         # Modelos do MongoDB/Mongoose
├── routes/         # Definição das rotas
├── services/       # Lógica de negócio
└── server.ts       # Arquivo principal do servidor
```

## Endpoints

- `GET /`: Verifica se a API está funcionando
- `/auth`: Rotas de autenticação
- `/grades`: Rotas relacionadas a notas

## Tecnologias Utilizadas

- TypeScript
- Express.js
- MongoDB (Mongoose)
- JWT (JSON Web Tokens)
- bcryptjs
- CORS
- dotenv

