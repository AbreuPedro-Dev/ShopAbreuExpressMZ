/**
 * src/controllers/produtosController.js
 * ========================================
 * Controlador de Produtos — contém toda a lógica de negócio.
 * As rotas apenas chamam estas funções.
 * 
 * Padrão: try/catch em cada função para tratamento de erros.
 */

const Produto = require("../models/Produto");

// ----------------------------------------------------------------
// GET /api/produtos
// Listar produtos com suporte a filtros, pesquisa e paginação
// ----------------------------------------------------------------
exports.listar = async (req, res) => {
  try {
    const { categoria, pesquisa, destaque, pagina = 1, limite = 20 } = req.query;

    // Construir filtro dinâmico baseado nos query params
    const filtro = { activo: true };

    // Filtro por categoria (if/else — Pilar 2)
    if (categoria && categoria !== "todas") {
      filtro.categoria = categoria;
    }

    // Filtro por destaque
    if (destaque === "true") {
      filtro.destaque = true;
    }

    // Pesquisa full-text no nome e descrição
    if (pesquisa && pesquisa.trim()) {
      filtro.$or = [
        { nome:      { $regex: pesquisa.trim(), $options: "i" } },
        { descricao: { $regex: pesquisa.trim(), $options: "i" } }
      ];
    }

    // Paginação
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    // Executar query no MongoDB com paginação
    const [produtos, total] = await Promise.all([
      Produto.find(filtro)
        .sort({ destaque: -1, createdAt: -1 }) // Destaques primeiro
        .skip(skip)
        .limit(parseInt(limite))
        .lean(),                                // .lean() retorna objecto JS simples (mais rápido)
      Produto.countDocuments(filtro)
    ]);

    res.json({
      sucesso: true,
      total,
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(total / parseInt(limite)),
      dados: produtos
    });

  } catch (err) {
    console.error("[Produtos] Erro ao listar:", err.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno do servidor." });
  }
};

// ----------------------------------------------------------------
// GET /api/produtos/:id
// Obter um produto por ID do MongoDB
// ----------------------------------------------------------------
exports.obterPorId = async (req, res) => {
  try {
    const produto = await Produto.findOne({
      _id: req.params.id,
      activo: true
    });

    if (!produto) {
      return res.status(404).json({ sucesso: false, mensagem: "Produto não encontrado." });
    }

    res.json({ sucesso: true, dados: produto });

  } catch (err) {
    // Tratar erro de ID MongoDB inválido
    if (err.name === "CastError") {
      return res.status(400).json({ sucesso: false, mensagem: "ID de produto inválido." });
    }
    console.error("[Produtos] Erro ao obter por ID:", err.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno do servidor." });
  }
};

// ----------------------------------------------------------------
// POST /api/produtos
// Criar novo produto
// ----------------------------------------------------------------
exports.criar = async (req, res) => {
  try {
    const novoProduto = new Produto(req.body);
    const salvo = await novoProduto.save(); // Mongoose valida os campos aqui

    console.log(`[Produtos] Produto criado: ${salvo.nome} (${salvo._id})`);
    res.status(201).json({ sucesso: true, mensagem: "Produto criado.", dados: salvo });

  } catch (err) {
    // Erros de validação do Mongoose (campos inválidos)
    if (err.name === "ValidationError") {
      const erros = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ sucesso: false, mensagem: erros.join(" | ") });
    }
    console.error("[Produtos] Erro ao criar:", err.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno do servidor." });
  }
};

// ----------------------------------------------------------------
// PUT /api/produtos/:id
// Actualizar produto existente
// ----------------------------------------------------------------
exports.actualizar = async (req, res) => {
  try {
    const atualizado = await Produto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // Retornar o documento actualizado + validar
    );

    if (!atualizado) {
      return res.status(404).json({ sucesso: false, mensagem: "Produto não encontrado." });
    }

    res.json({ sucesso: true, mensagem: "Produto actualizado.", dados: atualizado });

  } catch (err) {
    if (err.name === "ValidationError") {
      const erros = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ sucesso: false, mensagem: erros.join(" | ") });
    }
    console.error("[Produtos] Erro ao actualizar:", err.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno do servidor." });
  }
};

// ----------------------------------------------------------------
// DELETE /api/produtos/:id
// Soft delete: marca como inactivo em vez de apagar
// ----------------------------------------------------------------
exports.remover = async (req, res) => {
  try {
    const produto = await Produto.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );

    if (!produto) {
      return res.status(404).json({ sucesso: false, mensagem: "Produto não encontrado." });
    }

    res.json({ sucesso: true, mensagem: `Produto "${produto.nome}" removido.` });

  } catch (err) {
    console.error("[Produtos] Erro ao remover:", err.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno do servidor." });
  }
};

// ----------------------------------------------------------------
// PATCH /api/produtos/:id/stock
// Actualizar apenas o stock de um produto
// ----------------------------------------------------------------
exports.actualizarStock = async (req, res) => {
  try {
    const { quantidade } = req.body;

    if (typeof quantidade !== "number") {
      return res.status(400).json({ sucesso: false, mensagem: "Quantidade deve ser um número." });
    }

    // Usar $inc para decrementar de forma atómica no MongoDB
    const produto = await Produto.findOneAndUpdate(
      { _id: req.params.id, stock: { $gte: Math.abs(quantidade) } }, // Garante stock suficiente
      { $inc: { stock: -Math.abs(quantidade) } },
      { new: true }
    );

    if (!produto) {
      return res.status(400).json({ sucesso: false, mensagem: "Stock insuficiente ou produto não encontrado." });
    }

    res.json({ sucesso: true, mensagem: "Stock actualizado.", dados: { novoStock: produto.stock } });

  } catch (err) {
    console.error("[Produtos] Erro ao actualizar stock:", err.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno do servidor." });
  }
};
