# Áurea

Aplicação pessoal para organizar finanças e acompanhar investimentos com uma visão única do patrimônio.

## Estado atual

A fundação inclui dashboard responsivo, tema claro/escuro, Design Tokens, integração server-side com Firestore e autenticação Google. A página de entradas permite cadastrar até 20 recebimentos por vez, editar e apagar lançamentos; o dashboard calcula o fluxo mensal exclusivamente a partir dos registros ativos.

## Requisitos

- Node.js 22 ou superior
- pnpm 11 ou superior
- Java 21 ou superior para executar o Firebase Emulator Suite
- Um projeto Firebase para conexão com o ambiente real

## Instalação

```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

Abra `http://localhost:3000`.

## Testar com o emulador

Edite `.env.local` e mantenha:

```env
FIREBASE_PROJECT_ID="aurea-local"
FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
```

Em um terminal:

```powershell
pnpm firebase:emulators
```

Em outro terminal:

```powershell
pnpm dev
```

- App: `http://localhost:3000`
- Emulator UI: `http://127.0.0.1:4000`
- Saúde do Firestore: `http://localhost:3000/api/health/firestore`

## Conectar ao Firestore real

1. Crie o projeto e o banco Firestore no Firebase Console.
2. Gere uma chave em **Configurações do projeto > Contas de serviço**.
3. Guarde o JSON fora deste repositório.
4. No PowerShell que iniciará o app:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\caminho-seguro\service-account.json"
$env:FIREBASE_PROJECT_ID="id-do-seu-projeto"
Remove-Item Env:FIRESTORE_EMULATOR_HOST -ErrorAction SilentlyContinue
pnpm dev
```

Como alternativa para plataformas sem arquivo de credenciais, configure `FIREBASE_CLIENT_EMAIL` e `FIREBASE_PRIVATE_KEY` como segredos do ambiente.

## Variáveis

- `FIREBASE_PROJECT_ID`: identificador do projeto Firebase.
- `FIRESTORE_EMULATOR_HOST`: `host:porta`, sem protocolo; somente desenvolvimento.
- `GOOGLE_APPLICATION_CREDENTIALS`: caminho absoluto para uma conta de serviço fora do repositório.
- `FIREBASE_CLIENT_EMAIL` e `FIREBASE_PRIVATE_KEY`: alternativa para hosts baseados em variáveis.
- `FIREBASE_ALLOWED_EMAIL`: única conta Google autorizada a acessar o sistema.
- `NEXT_PUBLIC_FIREBASE_*`: configuração pública do aplicativo Web cadastrado no Firebase.
- `APP_URL`: endereço da aplicação.
- `AUTH_SECRET`: reservado para a etapa de autenticação.

## Comandos

- `pnpm dev`: desenvolvimento.
- `pnpm build`: build de produção.
- `pnpm lint`: análise estática.
- `pnpm typecheck`: verificação de tipos.
- `pnpm test`: testes unitários.
- `pnpm firebase:emulators`: Firestore local.
- `pnpm firebase:login`: autenticação da CLI.
- `pnpm firebase:deploy`: publica regras e índices.
- `pnpm check`: revisão técnica completa.

## Segurança

- Nunca versione JSON de conta de serviço, chaves privadas ou `.env.local`.
- O Firebase Admin é importado apenas em módulos server-side.
- As regras atuais negam todo acesso direto de clientes.
- O Admin SDK ignora Security Rules; autorização deve ser verificada no servidor antes de qualquer operação.
- A sessão é validada pelo Firebase Admin e armazenada em cookie `HttpOnly`, `Secure` em produção e `SameSite`.
- A autorização por e-mail é repetida no servidor; ocultar a interface no navegador não é considerado controle de acesso.
- Entradas são sempre vinculadas ao `uid` obtido da sessão; o cliente não escolhe o proprietário dos dados.
- Exclusões financeiras são lógicas (`deletedAt`), preservando rastreabilidade e evitando perda irreversível imediata.

## Deploy

Execute `pnpm check`, configure os segredos no provedor, publique regras e índices com `pnpm firebase:deploy` e inicie com `pnpm start`.

## Licença

MIT. Consulte `LICENSE`.
