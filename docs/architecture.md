# Arquitetura

O Áurea é um monólito modular em Next.js. Essa escolha reduz custo operacional sem misturar domínio, interface e persistência.

## Camadas

- `src/app`: páginas e endpoints.
- `src/components`: componentes compartilhados, sem regra financeira.
- `src/modules`: domínios, serviços e contratos de repositório.
- `src/infrastructure`: integrações externas, incluindo Firebase Admin.
- `src/config`: validação de ambiente.
- `src/utils`: funções puras reutilizáveis.

Rotas não acessam o Firestore diretamente. Casos de uso chamam serviços; serviços dependem de contratos; repositórios Firestore implementam esses contratos.

## Decisões

1. Firestore substitui completamente PostgreSQL e Prisma.
2. O navegador não recebe credenciais administrativas nem acessa documentos financeiros diretamente.
3. Firebase Admin roda somente no servidor e autentica com ADC ou conta de serviço.
4. Security Rules negam todo acesso de cliente até a autenticação ser implementada.
5. Dados pertencem a subcoleções de `users/{userId}` para manter isolamento explícito.
6. Valores monetários são strings em centavos, evitando perda de precisão no JavaScript.
7. Datas usam `Timestamp` nativo do Firestore.
8. Exclusão lógica e trilha de auditoria continuam obrigatórias.

## Limitação consciente

Firestore não possui joins relacionais. Resumos e relatórios devem usar documentos agregados mantidos por operações atômicas ou processos assíncronos, evitando varrer coleções inteiras no dashboard.
