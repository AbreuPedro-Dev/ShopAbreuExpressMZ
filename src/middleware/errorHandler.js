/**
 * src/middleware/errorHandler.js
 * ================================
 * Middleware global de tratamento de erros.
 * Captura todos os erros não tratados nas rotas.
 * 
 * Deve ser registado DEPOIS de todas as rotas no server.js.
 */

/**
 * Handler de rotas não encontradas (404).
 */
function notFound(req, res, next) {
  res.status(404).json({
    sucesso:  false,
    mensagem: `Rota não encontrada: ${req.method} ${req.originalUrl}`
  });
}

/**
 * Handler global de erros (500).
 * Express identifica middleware de erro por ter 4 parâmetros (err, req, res, next).
 */
function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  // Não expor detalhes de erros internos em produção
  const mensagem = process.env.NODE_ENV === "production" && status === 500
    ? "Erro interno do servidor."
    : err.message || "Erro desconhecido.";

  console.error(`[Erro ${status}] ${req.method} ${req.path}: ${err.message}`);

  res.status(status).json({ sucesso: false, mensagem });
}

module.exports = { notFound, errorHandler };
