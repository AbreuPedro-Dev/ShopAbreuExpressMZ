/**
 * src/routes/pedidos.js
 * =======================
 * Rotas da API para pedidos.
 * 
 * BASE URL: /api/pedidos
 */

const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/pedidosController");

// POST /api/pedidos      — Criar pedido (checkout)
// GET  /api/pedidos      — Listar pedidos
// GET  /api/pedidos/:id  — Obter pedido por ID

router.post("/",     controller.criar);
router.get("/",      controller.listar);
router.get("/:id",   controller.obterPorId);

module.exports = router;
