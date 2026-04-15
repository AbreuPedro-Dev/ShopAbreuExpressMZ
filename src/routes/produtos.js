/**
 * src/routes/produtos.js
 * ========================
 * Rotas da API para produtos.
 * Cada rota chama o método correspondente no controlador.
 * 
 * BASE URL: /api/produtos
 */

const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/produtosController");

// GET    /api/produtos           — Listar produtos (com filtros)
// GET    /api/produtos/:id       — Obter produto por ID
// POST   /api/produtos           — Criar produto
// PUT    /api/produtos/:id       — Actualizar produto
// DELETE /api/produtos/:id       — Remover produto (soft delete)
// PATCH  /api/produtos/:id/stock — Actualizar stock

router.get("/",              controller.listar);
router.get("/:id",           controller.obterPorId);
router.post("/",             controller.criar);
router.put("/:id",           controller.actualizar);
router.delete("/:id",        controller.remover);
router.patch("/:id/stock",   controller.actualizarStock);

module.exports = router;
