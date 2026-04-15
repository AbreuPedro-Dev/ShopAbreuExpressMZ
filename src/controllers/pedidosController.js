/**
 * src/controllers/pedidosController.js
 * =======================================
 * Controlador de Pedidos.
 * Gere criação, listagem e detalhe de pedidos.
 * 
 * Inclui validação de stock, cálculo de totais e
 * actualização atómica do inventário MongoDB.
 */

const Pedido  = require("../models/Pedido");
const Produto = require("../models/Produto");

// ----------------------------------------------------------------
// POST /api/pedidos
// Criar um novo pedido — operação principal do checkout
// ----------------------------------------------------------------
exports.criar = async (req, res) => {
  try {
    const { itens, cliente, metodoPagamento } = req.body;

    // ── Validações básicas (Pilar 2: if/else) ──────────────────
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ sucesso: false, mensagem: "O pedido precisa de pelo menos um item." });
    }
    if (!cliente || !cliente.nome || !cliente.email || !cliente.telefone) {
      return res.status(400).json({ sucesso: false, mensagem: "Dados do cliente incompletos." });
    }
    if (!metodoPagamento) {
      return res.status(400).json({ sucesso: false, mensagem: "Método de pagamento obrigatório." });
    }

    // ── Verificar stock e recolher dados dos produtos ──────────
    // Buscar todos os produtos do pedido de uma só vez (eficiente)
    const ids      = itens.map(i => i.produtoId);
    const produtos = await Produto.find({ _id: { $in: ids }, activo: true });

    // Construir mapa id → produto para acesso O(1)
    const produtoMap = {};
    produtos.forEach(p => { produtoMap[p._id.toString()] = p; });

    const itensPedido = [];
    let   total       = 0;

    // Validar stock de cada item (Pilar 3: forEach)
    for (const item of itens) {
      const produto = produtoMap[item.produtoId];

      if (!produto) {
        return res.status(404).json({
          sucesso: false,
          mensagem: `Produto ID "${item.produtoId}" não encontrado ou inactivo.`
        });
      }

      if (produto.stock < item.quantidade) {
        return res.status(400).json({
          sucesso: false,
          mensagem: `Stock insuficiente para "${produto.nome}". Disponível: ${produto.stock} unidade(s).`
        });
      }

      const subtotal = produto.preco * item.quantidade;
      total += subtotal;

      // Snapshot do produto no momento da compra
      itensPedido.push({
        produtoId:  produto._id,
        nome:       produto.nome,
        emoji:      produto.emoji,
        preco:      produto.preco,
        quantidade: item.quantidade,
        subtotal
      });
    }

    // ── Actualizar stock de todos os produtos atomicamente ─────
    // Promise.all executa todas as actualizações em paralelo
    await Promise.all(
      itensPedido.map(item =>
        Produto.updateOne(
          { _id: item.produtoId },
          { $inc: { stock: -item.quantidade } } // $inc é atómico no MongoDB
        )
      )
    );

    // ── Criar e gravar o pedido no MongoDB ─────────────────────
    const novoPedido = new Pedido({
      itens: itensPedido,
      cliente,
      total,
      metodoPagamento,
      estado: "confirmado"
    });

    const pedidoSalvo = await novoPedido.save();

    console.log(`[Pedidos] Novo pedido: ${pedidoSalvo.numeroPedido} | Total: MZN ${total} | ${cliente.email}`);

    // Resposta de sucesso com dados do pedido
    res.status(201).json({
      sucesso: true,
      mensagem: `Pedido ${pedidoSalvo.numeroPedido} confirmado com sucesso!`,
      dados: {
        numeroPedido:    pedidoSalvo.numeroPedido,
        total:           pedidoSalvo.total,
        estado:          pedidoSalvo.estado,
        metodoPagamento: pedidoSalvo.metodoPagamento,
        criadoEm:        pedidoSalvo.createdAt
      }
    });

  } catch (err) {
    if (err.name === "ValidationError") {
      const erros = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ sucesso: false, mensagem: erros.join(" | ") });
    }
    console.error("[Pedidos] Erro ao criar:", err.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno ao processar o pedido." });
  }
};

// ----------------------------------------------------------------
// GET /api/pedidos
// Listar todos os pedidos (ordem mais recente primeiro)
// ----------------------------------------------------------------
exports.listar = async (req, res) => {
  try {
    const { pagina = 1, limite = 10 } = req.query;
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    const [pedidos, total] = await Promise.all([
      Pedido.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limite))
        .lean(),
      Pedido.countDocuments()
    ]);

    res.json({
      sucesso: true,
      total,
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(total / parseInt(limite)),
      dados: pedidos
    });

  } catch (err) {
    console.error("[Pedidos] Erro ao listar:", err.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno do servidor." });
  }
};

// ----------------------------------------------------------------
// GET /api/pedidos/:id
// Obter pedido por ID
// ----------------------------------------------------------------
exports.obterPorId = async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id).lean();

    if (!pedido) {
      return res.status(404).json({ sucesso: false, mensagem: "Pedido não encontrado." });
    }

    res.json({ sucesso: true, dados: pedido });

  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ sucesso: false, mensagem: "ID de pedido inválido." });
    }
    console.error("[Pedidos] Erro ao obter:", err.message);
    res.status(500).json({ sucesso: false, mensagem: "Erro interno do servidor." });
  }
};
