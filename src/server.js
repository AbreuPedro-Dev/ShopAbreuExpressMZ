/**
 * src/server.js
 * ===============
 * Ponto de entrada da aplicação.
 * Configura o servidor Express, middleware de segurança,
 * rotas da API e serve os ficheiros estáticos do front-end.
 * 
 * ORDEM DE ARRANQUE:
 *   1. Carregar variáveis de ambiente (.env)
 *   2. Conectar ao MongoDB
 *   3. Configurar middleware
 *   4. Registar rotas
 *   5. Iniciar servidor HTTP
 */

// ── 1. Variáveis de ambiente ──────────────────────────────────
require("dotenv").config();

const express     = require("express");
const path        = require("path");
const morgan      = require("morgan");     // Logger de requests HTTP
const helmet      = require("helmet");     // Cabeçalhos de segurança HTTP
const cors        = require("cors");       // Permitir CORS
const rateLimit   = require("express-rate-limit");

const connectDB       = require("./config/database");
const rotasProdutos   = require("./routes/produtos");
const rotasPedidos    = require("./routes/pedidos");
const { notFound, errorHandler } = require("./middleware/errorHandler");

// ── 2. Conectar ao MongoDB ────────────────────────────────────
connectDB();

// ── 3. Criar app Express ──────────────────────────────────────
const app = express();

// ── 4. Middleware de Segurança ────────────────────────────────

// Helmet: define cabeçalhos HTTP de segurança (XSS, clickjacking, etc.)
app.use(
  helmet({
    contentSecurityPolicy: false, // Desactivado para permitir scripts inline do front-end
  })
);

// CORS: permitir requisições do front-end (mesmo domínio em produção)
app.use(cors());

// Rate Limiting: máximo 100 requests por IP a cada 15 minutos (protege contra brute force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { sucesso: false, mensagem: "Demasiadas requisições. Tenta de novo em 15 minutos." }
});
app.use("/api/", limiter);

// ── 5. Middleware de Parsing ──────────────────────────────────
app.use(express.json({ limit: "10kb" }));          // Body parser JSON (máx. 10kb)
app.use(express.urlencoded({ extended: true }));    // Body parser URL-encoded

// ── 6. Logger HTTP (apenas em desenvolvimento) ────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev")); // Mostra: GET /api/produtos 200 12ms
}

// ── 7. Ficheiros Estáticos (Front-end) ───────────────────────
// Serve os ficheiros da pasta public/ (HTML, CSS, JS, imagens)
app.use(express.static(path.join(__dirname, "../public")));

// ── 8. Rotas da API ───────────────────────────────────────────
app.use("/api/produtos", rotasProdutos);
app.use("/api/pedidos",  rotasPedidos);

// Rota de saúde (health check) — verifica se o servidor está online
app.get("/api/health", (req, res) => {
  res.json({
    sucesso: true,
    mensagem: "ShopMZ API está online!",
    versao: "2.0.0",
    ambiente: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// ── 9. SPA Fallback ───────────────────────────────────────────
// Para qualquer rota não encontrada na API, servir o index.html
// (permite navegação directa para rotas do front-end)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ── 10. Middleware de Erros (deve ser o último) ───────────────
app.use(notFound);
app.use(errorHandler);

// ── 11. Iniciar Servidor ──────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║         ShopMZ — Servidor Online         ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log(`║  🌐 App:    http://localhost:${PORT}          ║`);
  console.log(`║  📦 API:    http://localhost:${PORT}/api/     ║`);
  console.log(`║  💾 DB:     ${process.env.MONGO_URI?.slice(0, 30)}...`);
  console.log(`║  🔧 Modo:   ${process.env.NODE_ENV || "development"}                    ║`);
  console.log("╚══════════════════════════════════════════╝\n");
});

module.exports = app;
