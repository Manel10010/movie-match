# Movie Match Arena

Uma aplicação full-stack para seleção colaborativa de filmes onde amigos votam em pares de filmes até que um vencedor emerja!

## Funcionalidades

- Autenticação com JWT
- Perfis de usuário com decks de filmes personalizados
- Integração com TMDB API para busca de filmes
- Sistema de combate em tempo real com WebSockets
- Votação por eliminação até encontrar o filme vencedor
- Interface moderna com tema escuro

## Tecnologias

- **Next.js 16** - Framework React
- **MongoDB** - Banco de dados
- **Socket.io** - WebSockets para tempo real
- **TMDB API** - Dados de filmes
- **Tailwind CSS** - Estilização
- **TypeScript** - Tipagem estática

## Como Usar

### 1. Instalar dependências

\`\`\`bash
npm install
\`\`\`

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env.local` com:

\`\`\`env
MONGODB_URI=sua_connection_string_mongodb
JWT_SECRET=seu_secret_jwt
TMDB_API_KEY=sua_chave_tmdb
TMDB_READ_ACCESS_TOKEN=seu_token_tmdb
\`\`\`

### 3. Iniciar o servidor de desenvolvimento

\`\`\`bash
npm run dev
\`\`\`

O app estará disponível em `http://localhost:3000`

## Como Funciona

### 1. Criar Conta e Login
- Acesse `/login` para criar uma conta ou fazer login

### 2. Montar seu Deck
- Vá para seu perfil
- Busque filmes usando a API do TMDB
- Adicione pelo menos 5 filmes ao seu deck

### 3. Criar um Combate
- Na página inicial, clique em "Create New Combat"
- Defina o número de participantes (2-10)
- Copie o link de convite

### 4. Convidar Amigos
- Compartilhe o link com seus amigos
- Todos precisam ter pelo menos 5 filmes no deck

### 5. Iniciar o Combate
- Quando todos estiverem prontos na sala de espera
- O criador clica em "Start Combat"
- Todos são redirecionados automaticamente (WebSocket!)

### 6. Votar
- Escolha entre pares de filmes
- Vote no que você prefere assistir
- Ou pule ambos se não gostar de nenhum
- Continue até sobrar apenas um vencedor!

## Recursos em Tempo Real

A aplicação usa **Socket.io** para sincronização em tempo real:

- Participantes aparecem instantaneamente na sala de espera
- Todos são redirecionados automaticamente quando o combate inicia
- Eliminações de filmes são sincronizadas entre todos os participantes
- Quando um vencedor é determinado, todos veem o resultado simultaneamente

## Estrutura do Projeto

\`\`\`
├── app/                    # Rotas Next.js
│   ├── api/               # API routes
│   ├── combat/            # Páginas de combate
│   ├── login/             # Autenticação
│   └── profile/           # Perfil do usuário
├── components/            # Componentes React
├── lib/                   # Utilitários
│   ├── models/           # Modelos Mongoose
│   ├── auth.ts           # Autenticação JWT
│   ├── db.ts             # Conexão MongoDB
│   ├── socket-client.ts  # Cliente Socket.io
│   └── socket-server.ts  # Servidor Socket.io
└── server.js             # Servidor customizado com Socket.io
\`\`\`

## Deploy

Para fazer deploy em produção:

\`\`\`bash
npm run build
npm start
\`\`\`

Certifique-se de configurar as variáveis de ambiente no seu provedor de hospedagem.
