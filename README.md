# ShopAbreuMZ Pro — E-Commerce com Node.js + MongoDB

Aplicação web de e-commerce profissional desenvolvida com Node.js, Express e MongoDB.

---

## 🛠️ Pré-requisitos

Instalar as seguintes ferramentas **antes** de começar:

| Ferramenta | Versão | Download |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| MongoDB Community | 7+ | https://www.mongodb.com/try/download/community |
| VS Code | Qualquer | https://code.visualstudio.com |

---

## 🚀 Passo a Passo no VS Code

### Passo 1 — Abrir o projecto
```
File → Open Folder → seleccionar a pasta shopmz-pro/
```

### Passo 2 — Instalar dependências
No terminal do VS Code (`Ctrl + `` `):
```bash
npm install
```

### Passo 3 — Iniciar o MongoDB
Noutra janela do terminal:
```bash
# Windows
mongod --dbpath C:\data\db

# macOS / Linux
mongod --dbpath /data/db
```

### Passo 4 — Popular a base de dados
```bash
npm run seed
```
Deves ver: `📦 12 produtos inseridos com sucesso!`

### Passo 5 — Iniciar o servidor em modo desenvolvimento
```bash
npm run dev
```

### Passo 6 — Abrir no browser
```
http://localhost:3000
```

---

## 📁 Estrutura do Projecto

```
shopmz-pro/
├── src/
│   ├── server.js                  ← Servidor Express principal
│   ├── config/
│   │   ├── database.js            ← Conexão MongoDB (Mongoose)
│   │   └── seed.js                ← Dados iniciais
│   ├── models/
│   │   ├── Produto.js             ← Schema MongoDB de Produto
│   │   └── Pedido.js              ← Schema MongoDB de Pedido
│   ├── controllers/
│   │   ├── produtosController.js  ← Lógica de negócio dos produtos
│   │   └── pedidosController.js   ← Lógica de negócio dos pedidos
│   ├── routes/
│   │   ├── produtos.js            ← Rotas /api/produtos
│   │   └── pedidos.js             ← Rotas /api/pedidos
│   └── middleware/
│       └── errorHandler.js        ← Tratamento global de erros
├── public/
│   ├── index.html                 ← Interface HTML
│   ├── css/styles.css             ← Estilos (tema editorial)
│   └── js/
│       ├── api.js                 ← Comunicação com a API REST
│       ├── cart.js                ← Lógica do carrinho
│       ├── ui.js                  ← Renderização da interface
│       └── app.js                 ← Orquestrador principal
├── .env                           ← Variáveis de ambiente
├── .gitignore
└── package.json
```

---

## 🔌 Endpoints da API

| Método | URL | Descrição |
|--------|-----|-----------|
| GET | /api/health | Health check |
| GET | /api/produtos | Listar produtos (filtros via query) |
| GET | /api/produtos/:id | Obter produto por ID |
| POST | /api/produtos | Criar produto |
| PUT | /api/produtos/:id | Actualizar produto |
| DELETE | /api/produtos/:id | Remover produto (soft delete) |
| POST | /api/pedidos | Criar pedido (checkout) |
| GET | /api/pedidos | Listar pedidos |

### Exemplo — Criar Pedido
```json
POST /api/pedidos
{
  "itens": [
    { "produtoId": "...", "quantidade": 2 }
  ],
  "cliente": {
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "84000000"
  },
  "metodoPagamento": "mpesa"
}
```

---

## ✅ Extensões Recomendadas para VS Code

- **Thunder Client** — Testar a API REST directamente no VS Code
- **MongoDB for VS Code** — Visualizar dados no MongoDB
- **Prettier** — Formatação automática do código
- **ESLint** — Análise estática do JavaScript
