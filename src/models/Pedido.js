/**
 * src/models/Pedido.js
 * =====================
 * Schema Mongoose para os pedidos da loja.
 * 
 * Cada pedido contém os itens comprados, dados do cliente,
 * método de pagamento, total e estado do pedido.
 */

const mongoose = require("mongoose");

// ----------------------------------------------------------------
// SUB-SCHEMA: Item do Pedido
// Representa um produto dentro de um pedido (snapshot do momento)
// ----------------------------------------------------------------
const ItemPedidoSchema = new mongoose.Schema(
  {
    // Referência ao produto original (para auditoria)
    produtoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Produto",
      required: true
    },

    // Snapshot dos dados do produto no momento da compra
    // (guardamos aqui porque o produto pode mudar no futuro)
    nome:       { type: String, required: true },
    emoji:      { type: String, default: "📦" },
    preco:      { type: Number, required: true }, // Preço unitário no momento
    quantidade: { type: Number, required: true, min: 1 },

    // Subtotal calculado: preco × quantidade
    subtotal:   { type: Number, required: true }
  },
  { _id: false } // Não gerar _id para sub-documentos
);

// ----------------------------------------------------------------
// SUB-SCHEMA: Dados do Cliente
// ----------------------------------------------------------------
const ClienteSchema = new mongoose.Schema(
  {
    nome:     { type: String, required: true, trim: true },
    email:    {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email inválido."]
    },
    telefone: { type: String, required: true, trim: true }
  },
  { _id: false }
);

// ----------------------------------------------------------------
// SCHEMA PRINCIPAL DO PEDIDO
// ----------------------------------------------------------------
const PedidoSchema = new mongoose.Schema(
  {
    // Array de itens comprados (mínimo 1 item)
    itens: {
      type: [ItemPedidoSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "O pedido deve ter pelo menos um item."
      }
    },

    // Dados do cliente
    cliente: {
      type: ClienteSchema,
      required: true
    },

    // Total geral do pedido (calculado antes de gravar)
    total: {
      type: Number,
      required: true,
      min: [0, "O total não pode ser negativo."]
    },

    // Método de pagamento seleccionado
    metodoPagamento: {
      type: String,
      required: true,
      enum: {
        values: ["mpesa", "emola", "cartao", "transferencia"],
        message: "Método de pagamento inválido."
      }
    },

    // Estado do pedido (fluxo de vida do pedido)
    estado: {
      type: String,
      enum: ["pendente", "confirmado", "em_processamento", "enviado", "entregue", "cancelado"],
      default: "confirmado"
    },

    // Número do pedido legível (gerado automaticamente)
    numeroPedido: {
      type: String,
      unique: true
    }
  },
  {
    timestamps: true,  // createdAt e updatedAt automáticos
    versionKey: false
  }
);

// ----------------------------------------------------------------
// MIDDLEWARE PRE-SAVE: Gerar número do pedido automaticamente
// ----------------------------------------------------------------
PedidoSchema.pre("save", function (next) {
  if (!this.numeroPedido) {
    // Formato: PED-YYYYMMDD-XXXX (ex: PED-20250415-A3F2)
    const data    = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const sufixo  = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.numeroPedido = `PED-${data}-${sufixo}`;
  }
  next();
});

// ----------------------------------------------------------------
// ÍNDICES
// ----------------------------------------------------------------
PedidoSchema.index({ "cliente.email": 1 });
PedidoSchema.index({ estado: 1 });
PedidoSchema.index({ createdAt: -1 });  // Ordenar por mais recentes

// ----------------------------------------------------------------
// EXPORTAR O MODELO
// ----------------------------------------------------------------
module.exports = mongoose.model("Pedido", PedidoSchema);
