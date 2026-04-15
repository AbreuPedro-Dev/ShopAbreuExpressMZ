/**
 * src/models/Produto.js
 * =======================
 * Schema Mongoose para os produtos da loja.
 * 
 * Define a estrutura, tipos, validações e valores padrão
 * de cada documento na colecção "produtos" do MongoDB.
 */

const mongoose = require("mongoose");

// ----------------------------------------------------------------
// SCHEMA DO PRODUTO
// Define a estrutura de um documento produto no MongoDB
// ----------------------------------------------------------------
const ProdutoSchema = new mongoose.Schema(
  {
    // Nome do produto (obrigatório, único, max 120 caracteres)
    nome: {
      type: String,
      required: [true, "O nome do produto é obrigatório."],
      trim: true,
      maxlength: [120, "O nome não pode ter mais de 120 caracteres."]
    },

    // Descrição detalhada
    descricao: {
      type: String,
      required: [true, "A descrição é obrigatória."],
      trim: true,
      maxlength: [500, "A descrição não pode ter mais de 500 caracteres."]
    },

    // Preço em Meticais (MZN) — deve ser positivo
    preco: {
      type: Number,
      required: [true, "O preço é obrigatório."],
      min: [0, "O preço não pode ser negativo."]
    },

    // Categoria do produto — enum limita os valores possíveis
    categoria: {
      type: String,
      required: [true, "A categoria é obrigatória."],
      enum: {
        values: ["eletronicos", "vestuario", "casa", "desporto"],
        message: "Categoria inválida. Use: eletronicos, vestuario, casa ou desporto."
      }
    },

    // Emoji representativo do produto (para interface sem imagens reais)
    emoji: {
      type: String,
      default: "📦"
    },

    // Quantidade disponível em stock
    stock: {
      type: Number,
      required: [true, "O stock é obrigatório."],
      min: [0, "O stock não pode ser negativo."],
      default: 0
    },

    // Indica se o produto é destaque na página inicial
    destaque: {
      type: Boolean,
      default: false
    },

    // Produto activo/inactivo (soft delete)
    activo: {
      type: Boolean,
      default: true
    }
  },
  {
    // Opções do schema:
    timestamps: true,         // Adiciona createdAt e updatedAt automaticamente
    versionKey: false         // Remove o campo __v dos documentos
  }
);

// ----------------------------------------------------------------
// ÍNDICES — Melhoram a performance das queries mais frequentes
// ----------------------------------------------------------------
ProdutoSchema.index({ categoria: 1 });             // Query por categoria
ProdutoSchema.index({ nome: "text", descricao: "text" }); // Pesquisa full-text
ProdutoSchema.index({ destaque: 1, activo: 1 });   // Query de destaques

// ----------------------------------------------------------------
// MÉTODOS VIRTUAIS
// Campos calculados que não são gravados no MongoDB
// ----------------------------------------------------------------

// Virtual: indica se o produto está esgotado
ProdutoSchema.virtual("esgotado").get(function () {
  return this.stock === 0;
});

// Virtual: estado do stock (texto para a interface)
ProdutoSchema.virtual("estadoStock").get(function () {
  if (this.stock === 0)  return "esgotado";
  if (this.stock <= 5)   return "baixo";
  return "disponivel";
});

// Incluir virtuals no output JSON (toJSON)
ProdutoSchema.set("toJSON", { virtuals: true });

// ----------------------------------------------------------------
// EXPORTAR O MODELO
// ----------------------------------------------------------------
module.exports = mongoose.model("Produto", ProdutoSchema);
