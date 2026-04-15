/**
 * src/config/seed.js
 * ====================
 * Script de seed: popula o MongoDB com produtos iniciais.
 * 
 * EXECUÇÃO:
 *   npm run seed
 * 
 * Apaga todos os produtos existentes e insere o catálogo completo.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Produto  = require("../models/Produto");

// Catálogo inicial de 12 produtos em 4 categorias
const PRODUTOS = [
  // ── Electrónicos ──────────────────────────────────────────
  {
    nome: "Telefone NOKIA Pro X",
    descricao: "Ecrã AMOLED 6.7\", câmara 108MP, bateria 5000mAh, 5G.",
    preco: 45000,
    categoria: "eletronicos",
    emoji: "📱",
    stock: 15,
    destaque: false
  },
  {
    nome: "Laptop UltraBook",
    descricao: "Intel Core i7 12ª geração, 16GB RAM DDR5, SSD NVMe 512GB.",
    preco: 80000,
    categoria: "eletronicos",
    emoji: "💻",
    stock: 8,
    destaque: false
  },
  {
    nome: "Auriculares Bluetooth",
    descricao: "Cancelamento de ruído activo, Bluetooth 5.3, 30h autonomia.",
    preco: 4500,
    categoria: "eletronicos",
    emoji: "🎧",
    stock: 25,
    destaque: false
  },
  // ── Vestuário ─────────────────────────────────────────────
  {
    nome: "T-Shirt Premium",
    descricao: "100% algodão orgânico certificado, corte regular fit.",
    preco: 1200,
    categoria: "vestuario",
    emoji: "👕",
    stock: 50,
    destaque: false
  },
  {
    nome: "Sapatilhas de Corrida",
    descricao: "Sola amortecedora Boost, mesh respirável, ideal para corrida.",
    preco: 7500,
    categoria: "vestuario",
    emoji: "👟",
    stock: 30,
    destaque: true
  },
  {
    nome: "Jaqueta de Couro",
    descricao: "Couro bovino genuíno, forro interior polar, 4 bolsos.",
    preco: 4000,
    categoria: "vestuario",
    emoji: "🧥",
    stock: 12,
    destaque: false
  },
  // ── Casa & Decoração ──────────────────────────────────────
  {
    nome: "Candeeiro LED",
    descricao: "Luz regulável 3 modos (quente/neutro/frio), USB-C integrado.",
    preco: 1200,
    categoria: "casa",
    emoji: "💡",
    stock: 40,
    destaque: false
  },
  {
    nome: "Sofa Decorativa",
    descricao: "Tecido de veludo importado, 50×50cm, lavável à máquina.",
    preco: 950,
    categoria: "casa",
    emoji: "🛋️",
    stock: 60,
    destaque: false
  },
  {
    nome: "Frigideira Anti-Aderente",
    descricao: "Revestimento cerâmico 5 camadas, compatível com indução.",
    preco: 4800,
    categoria: "casa",
    emoji: "🍳",
    stock: 20,
    destaque: false
  },
  // ── Desporto ──────────────────────────────────────────────
  {
    nome: "Bicicleta Mountain",
    descricao: "Quadro alumínio 6061, 21 velocidades Shimano, travões Shimano.",
    preco: 55000,
    categoria: "desporto",
    emoji: "🚴",
    stock: 5,
    destaque: true
  },
  {
    nome: "Tapete de Yoga",
    descricao: "TPE antiderrapante, 183×61cm, espessura 6mm, alça incluída.",
    preco: 2800,
    categoria: "desporto",
    emoji: "🧘",
    stock: 35,
    destaque: false
  },
  {
    nome: "Halteres 10kg (par)",
    descricao: "Revestimento em borracha NBR, agarre ergonómico, antirruído.",
    preco: 3500,
    categoria: "desporto",
    emoji: "🏋️",
    stock: 0,          // Propositadamente esgotado para testar a UI
    destaque: false
  }
];

async function seed() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado ao MongoDB para seed...");

    // Apagar todos os produtos existentes
    await Produto.deleteMany({});
    console.log("🗑️  Produtos anteriores removidos.");

    // Inserir o catálogo completo
    const inseridos = await Produto.insertMany(PRODUTOS);
    console.log(`📦 ${inseridos.length} produtos inseridos com sucesso!`);

    // Mostrar resumo por categoria
    const categorias = [...new Set(PRODUTOS.map(p => p.categoria))];
    categorias.forEach(cat => {
      const count = PRODUTOS.filter(p => p.categoria === cat).length;
      console.log(`   • ${cat}: ${count} produtos`);
    });

  } catch (err) {
    console.error("❌ Erro no seed:", err.message);
  } finally {
    // Fechar conexão após seed
    await mongoose.disconnect();
    console.log("🔌 Conexão MongoDB encerrada.");
    process.exit(0);
  }
}

seed();
