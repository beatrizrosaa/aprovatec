# Deploy no Vercel

Este projeto está configurado para ser deployado no Vercel como uma aplicação serverless.

## Pré-requisitos

1. Conta no Vercel
2. MongoDB Atlas ou outro serviço de MongoDB
3. Redis (opcional, mas recomendado - pode usar Upstash Redis)

## Passos para Deploy

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente no Vercel

No painel do Vercel, vá em Settings > Environment Variables e adicione:

- `MONGO_URI`: URL de conexão do MongoDB (ex: `mongodb+srv://user:pass@cluster.mongodb.net/aprovatec`)
- `JWT_SECRET`: Chave secreta para JWT (gere uma string aleatória segura)
- `FRONTEND_URL`: URL do seu frontend no Vercel (ex: `https://seu-frontend.vercel.app`)
- `REDIS_URL`: (Opcional) URL do Redis (ex: `redis://default:pass@host.upstash.io:6379`)

### 3. Fazer o deploy

#### Opção 1: Via CLI do Vercel

```bash
npm i -g vercel
vercel
```

#### Opção 2: Via GitHub/GitLab

1. Conecte seu repositório ao Vercel
2. O Vercel detectará automaticamente a configuração
3. Configure as variáveis de ambiente
4. Faça o deploy

### 4. Configurar CORS

O CORS já está configurado para aceitar requisições de:
- O domínio especificado em `FRONTEND_URL`
- Qualquer domínio `*.vercel.app` (para preview deployments)
- `localhost` em desenvolvimento

Certifique-se de definir `FRONTEND_URL` com a URL exata do seu frontend.

## Estrutura de Arquivos

- `vercel.json`: Configuração do Vercel
- `api/index.ts`: Entry point para serverless functions
- `src/server.ts`: Aplicação Express configurada para serverless

## Notas Importantes

1. **Conexões de Banco de Dados**: As conexões são gerenciadas de forma otimizada para serverless, reutilizando conexões quando possível.

2. **Variáveis de Ambiente**: Todas as variáveis devem ser configuradas no painel do Vercel, não use arquivos `.env` em produção.

3. **Build**: O Vercel executará automaticamente `npm run build` durante o deploy.

4. **Logs**: Você pode ver os logs da aplicação no painel do Vercel em Functions > Logs.

## Troubleshooting

### Erro de conexão com MongoDB
- Verifique se o `MONGO_URI` está correto
- Certifique-se de que o IP do Vercel está na whitelist do MongoDB Atlas (ou use 0.0.0.0/0 para permitir todos)

### Erro de CORS
- Verifique se `FRONTEND_URL` está configurado corretamente
- Certifique-se de que a URL do frontend corresponde exatamente (incluindo https://)

### Timeout em requisições
- Verifique se as conexões de banco estão funcionando
- Considere aumentar o timeout no `vercel.json` se necessário

