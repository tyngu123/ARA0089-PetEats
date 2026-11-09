# ARA0089-PetEats

PetEats – aplicativo de delivery de rações e petiscos desenvolvido para a disciplina ARA0089.

O app conecta **clientes** (tutores de pets) a **empresas** (pet shops). Os cadastros, produtos e pedidos ficam salvos em um banco **MySQL na nuvem**:

1. A empresa cria a conta, cadastra a loja e os produtos.
2. O cliente cria a conta, escolhe a loja, monta o carrinho e confirma o pedido.
3. O pedido aparece **na hora** no painel da empresa (atualização automática a cada 4 s).
4. A empresa **aceita** (ou recusa), **envia** e marca como **entregue**. O cliente acompanha cada etapa no app.

```
App (Expo / React Native)  ──HTTPS──▶  API Node/Express (Render)  ──SSL──▶  MySQL (Aiven)
```

## Requisitos

- **Node.js 22.13 ou mais recente** (linha 22 LTS ou 24). O Expo SDK 58 não funciona com Node 20 nem com versões ímpares (23, 25).
- App feito com **Expo SDK 58** (React Native 0.88, React 19.3).

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `frontend/` | App Expo (Android, iOS e web) |
| `frontend/Login.js`, `Registro.js` | Login e cadastro de cliente ou empresa (tela 1 do Figma) |
| `frontend/Cliente.js` | Início: catálogo de produtos das lojas (tela 2 do Figma) |
| `frontend/Carrinho.js` | Carrinho de compras (tela 3 do Figma) |
| `frontend/Pedido.js` | Confirmação e acompanhamento do pedido (tela 4 do Figma) |
| `frontend/MeusPedidos.js`, `Menu.js` | Abas Pedidos e Perfil da barra inferior |
| `frontend/src/components/ui.js` | Componentes visuais do protótipo (fonte Poppins, campos, botões, barra inferior) |
| `frontend/Empresa.js` | Painel da empresa: pedidos (aceitar/recusar/enviar/entregar) e produtos |
| `backend/app.js` | Rotas da API |
| `backend/database.js` | Cria as tabelas e a loja Casa do Bicho ao iniciar |
| `database/setup.sql` | Estrutura do banco (usuários, sessões, petshops, produtos, pedidos) |
| `render.yaml` | Configuração de publicação no Render |

## Loja já cadastrada

Na primeira execução a API cadastra a loja **Casa do Bicho** com alguns produtos.
Para entrar no painel dela use o usuário **`casadobicho`** e a senha **`123456`** (troque depois, se quiser).
Clientes e outras lojas são criados pela tela **Cadastre-se** do app.

Para não criar a Casa do Bicho, defina `SEED_DEMO=false`.

---

## Publicar na nuvem (gratuito)

Você vai precisar de contas gratuitas no **GitHub**, no **Aiven** (banco MySQL) e no **Render** (API e versão web).

### 1. Banco MySQL no Aiven

1. Crie uma conta em <https://aiven.io> (não pede cartão).
2. **Create service → MySQL → plano Free**. Escolha uma região próxima e aguarde o status **Running**.
3. Na página do serviço, em **Connection information**, copie a **Service URI**. Ela tem este formato:
   `mysql://avnadmin:SENHA@NOME.aivencloud.com:PORTA/defaultdb?ssl-mode=REQUIRED`
4. (Opcional, mais seguro) Baixe o **CA certificate**; o conteúdo vai na variável `DB_SSL_CA`.

> O plano gratuito do Aiven pode ser desligado se ficar muito tempo sem uso. Se acontecer, ligue de novo pelo painel (**Power on**).

### 2. Código no GitHub

Envie esta pasta para um repositório no GitHub (o `render.yaml` precisa estar na raiz).

### 3. API e versão web no Render

1. Crie uma conta em <https://render.com> e conecte o GitHub.
2. **New → Blueprint** e escolha o repositório. O Render lê o `render.yaml` e cria dois serviços:
   - `peteats-api` – a API Node/Express;
   - `peteats-web` – a versão web do app.
3. Quando pedir as variáveis:
   - `DATABASE_URL`: cole a **Service URI** do Aiven;
   - `DB_SSL_CA`: cole o certificado (ou deixe vazio);
   - `EXPO_PUBLIC_API_URL`: deixe em branco por enquanto.
4. Aguarde o deploy da `peteats-api` e copie a URL dela (ex.: `https://peteats-api.onrender.com`).
   Teste abrindo `https://peteats-api.onrender.com/api/health` – deve aparecer `{"status":"ok","database":"ok"}`.
   Na primeira vez a API cria sozinha as tabelas e a loja Casa do Bicho.
5. Em `peteats-web → Environment`, coloque `EXPO_PUBLIC_API_URL` = URL da API e clique em **Manual Deploy**.
   Depois disso o app web fica disponível no endereço da `peteats-web`.

> No plano gratuito do Render a API "dorme" depois de 15 minutos sem uso e leva cerca de **1 minuto** para acordar. Antes da apresentação, abra o `/api/health` para acordá-la.

### 4. App no celular (Expo Go)

1. Crie `frontend/.env` com a URL da API (veja `frontend/.env.example`):
   ```
   EXPO_PUBLIC_API_URL=https://peteats-api.onrender.com
   ```
2. Rode:
   ```powershell
   cd frontend
   npm install
   npx expo start --tunnel
   ```
3. Escaneie o QR Code com o app **Expo Go**. Como a API está na nuvem, o celular pode estar em qualquer rede.

> O app usa o **Expo SDK 58**. Atualize o Expo Go na loja do celular: a versão do Expo Go precisa suportar o SDK 58. Se a loja ainda oferecer só a versão para SDK 57, use a versão web (`npm run web` ou o site `peteats-web`) no navegador do celular, ou gere um *development build* (veja a documentação do Expo).

### Roteiro sugerido para a demonstração

1. No **computador**, abra o app web (`peteats-web`) e entre como empresa (`casadobicho`) ou cadastre uma nova empresa e seus produtos.
2. No **celular**, crie uma conta de cliente em **Cadastre-se**, escolha a loja, adicione produtos e confirme o pedido.
3. Em até 4 segundos o painel da empresa mostra **"Novo pedido recebido!"**.
4. A empresa clica em **Aceitar pedido** → **Enviar pedido** → **Marcar como entregue**; o celular do cliente acompanha cada etapa.
5. Feche e abra o app: os dados continuam lá, porque estão no MySQL da nuvem.

---

## Executar localmente

### API com MySQL local

```powershell
cd backend
copy .env.example .env   # preencha DB_USER e DB_PASSWORD do seu MySQL
npm install
npm start                # cria o banco "peteats", as tabelas e a loja Casa do Bicho
```

`npm run db:setup` faz só a preparação do banco, sem subir a API.

### App

```powershell
cd frontend
npm install
npx expo install --fix   # alinha as bibliotecas com o SDK 58
npm run web              # ou: npm run android
```

`npm run doctor` verifica problemas comuns do projeto Expo.

Sem `frontend/.env`, o app usa `http://localhost:3000` (web) ou `http://10.0.2.2:3000` (emulador Android).

### Testes da API

```powershell
cd backend
npm test
```

Os testes usam um banco SQLite em memória (precisa de Node 22.5 ou mais recente) e cobrem o fluxo completo: cadastro da empresa, produto, pedido do cliente, aceite, envio e permissões.

## Rotas da API

| Método | Rota | Quem usa | O que faz |
|---|---|---|---|
| GET | `/api/health` | – | Verifica API e banco |
| POST | `/api/auth/register` | todos | Cria conta de cliente ou empresa (empresa já cria a loja) |
| POST | `/api/auth/login` | todos | Entra e devolve o token de sessão |
| POST | `/api/auth/logout` | todos | Encerra a sessão |
| GET | `/api/me` | logado | Dados da conta (e da loja, se empresa) |
| GET | `/api/petshops` | público | Lista as lojas |
| GET | `/api/products` | público | Catálogo com os produtos de todas as lojas |
| GET | `/api/petshops/:id/products` | público | Catálogo da loja |
| GET / POST | `/api/my/products` | empresa | Lista / cadastra produtos da loja |
| PATCH | `/api/my/products/:id` | empresa | Altera nome, preço ou pausa a venda |
| POST | `/api/orders` | cliente | Cria pedido (preços sempre calculados pelo servidor) |
| GET | `/api/orders` | logado | Pedidos do cliente ou da loja |
| GET | `/api/orders/:id` | logado | Detalhe do pedido |
| PATCH | `/api/orders/:id/status` | logado | Empresa: `aceito`, `recusado`, `enviado`, `entregue`. Cliente: `cancelado` (só se pendente) |

As senhas são guardadas com hash (scrypt), nunca em texto puro. Não coloque senhas no código: use o arquivo `.env` (local) ou as variáveis de ambiente do Render.
