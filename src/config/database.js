/**
 * src/config/database.js
 * ========================
 * Configuração da conexão ao MongoDB via Mongoose.
 * Exporta a função connectDB() chamada no arranque do servidor.
 */

const mongoose = require("mongoose");

/**
 * Conecta ao MongoDB usando a URI definida no .env.
 * Em caso de falha, termina o processo (fail-fast).
 */
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Opções recomendadas para Mongoose 8+
      serverSelectionTimeoutMS: 5000, // Timeout de 5s se MongoDB não responder
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Erro ao conectar ao MongoDB:", error.message);
    console.error("   Verifica se o MongoDB está em execução: mongod --dbpath /data/db");
    process.exit(1); // Terminar se não conseguir conectar
  }
}

module.exports = connectDB;
