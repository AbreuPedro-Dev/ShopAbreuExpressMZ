/**
 * public/js/api.js
 * ==================
 * Camada de comunicação com a API REST do servidor Node.js.
 * Todas as chamadas HTTP passam por aqui.
 * 
 * Pilar 4: Integração real Front-end ↔ Back-end (Node.js + MongoDB)
 */

const API = (function () {

  // URL base da API — auto-detecta o ambiente
  const BASE = window.location.origin + "/api";

  /**
   * Função genérica de fetch com tratamento de erros.
   * @param {string} url     - Endpoint relativo ao BASE
   * @param {Object} options - Opções fetch (method, body, etc.)
   * @returns {Promise<Object>} Dados da resposta JSON
   */
  async function _request(url, options = {}) {
    const resp = await fetch(BASE + url, {
      headers: { "Content-Type": "application/json" },
      ...options
    });

    const data = await resp.json();

    if (!resp.ok) {
      // Lançar erro com a mensagem vinda do servidor
      throw new Error(data.mensagem || `Erro HTTP ${resp.status}`);
    }

    return data;
  }

  /**
   * Verificar se o servidor está online (health check).
   * @returns {Promise<boolean>}
   */
  async function healthCheck() {
    try {
      const data = await _request("/health");
      return data.sucesso === true;
    } catch {
      return false;
    }
  }

  /**
   * Buscar produtos com filtros opcionais.
   * @param {Object} filtros - { categoria, pesquisa, destaque }
   * @returns {Promise<Array>} Lista de produtos
   */
  async function listarProdutos(filtros = {}) {
    // Construir query string a partir dos filtros
    const params = new URLSearchParams();
    if (filtros.categoria && filtros.categoria !== "todas") {
      params.set("categoria", filtros.categoria);
    }
    if (filtros.pesquisa && filtros.pesquisa.trim()) {
      params.set("pesquisa", filtros.pesquisa.trim());
    }

    const query = params.toString() ? "?" + params.toString() : "";
    const data  = await _request(`/produtos${query}`);
    return data.dados || [];
  }

  /**
   * Criar um novo pedido no servidor.
   * @param {Object} pedido - { itens, cliente, metodoPagamento }
   * @returns {Promise<Object>} Dados do pedido criado
   */
  async function criarPedido(pedido) {
    const data = await _request("/pedidos", {
      method: "POST",
      body:   JSON.stringify(pedido)
    });
    return data;
  }

  // Interface pública
  return { healthCheck, listarProdutos, criarPedido };

})();
