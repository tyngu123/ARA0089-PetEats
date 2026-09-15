# ARA0089-PetEats

PetEats - Aplicativo de delivery de rações desenvolvido para a disciplina ARA0089.

## Banco de dados MySQL

O backend consulta a tabela `peteats.petshops` em MySQL. A API não usa mais uma lista fixa em memória nem retorna lojas falsas quando o banco está indisponível.

Copie `backend/.env.example` para `backend/.env` e preencha `DB_USER` e `DB_PASSWORD` com credenciais locais do MySQL. O arquivo `.env` é ignorado pelo Git; não coloque a senha no código nem no README. O usuário informado precisa poder criar o banco e a tabela durante o preparo inicial.

Na primeira execução, prepare o banco e os três registros de demonstração:

```powershell
cd backend
npm install
npm run db:setup
npm start
```

O comando usa [database/setup.sql](database/setup.sql). Ele pode ser executado novamente sem sobrescrever petshops já cadastrados ou editados com os mesmos IDs.

## Executar o app

Em outro terminal, na raiz do projeto:

```powershell
cd frontend
npm install
npm run web
```

A lista de petshops é obtida em `http://localhost:3000/api/petshops`. Para conferir os registros diretamente no MySQL, use `SELECT * FROM peteats.petshops;`. A tela mostra no máximo três petshops ativos, ordenados por `sort_order`.

No emulador Android, o app acessa a API em `http://10.0.2.2:3000`. Para testar em um celular físico, crie `frontend/.env.local` com `EXPO_PUBLIC_API_URL=http://IP_DO_COMPUTADOR:3000`, usando o IP local do computador na mesma rede do celular. Reinicie o app para aplicar a configuração.
