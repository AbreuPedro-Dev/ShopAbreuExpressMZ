/**
 * public/js/cart.js
 * ===================
 * Módulo do Carrinho de Compras.
 * Estado interno em memória + renderização dinâmica.
 */

const Cart = (function () {

  // Estado privado: array de itens { produto, quantidade }
  let _itens = [];

  /** Adicionar produto. Retorna resultado da operação. */
  function adicionar(produto) {
    if (produto.stock <= 0) return "sem_stock";

    const existente = _itens.find(i => i.produto._id === produto._id);
    if (existente) {
      if (existente.quantidade >= produto.stock) return "limite";
      existente.quantidade++;
      return "incrementado";
    }
    _itens.push({ produto, quantidade: 1 });
    return "adicionado";
  }

  /** Alterar quantidade (+1 ou -1). Remove se chegar a 0. */
  function alterarQtd(produtoId, delta) {
    const item = _itens.find(i => i.produto._id === produtoId);
    if (!item) return false;
    if (delta > 0 && item.quantidade >= item.produto.stock) return false;
    item.quantidade += delta;
    if (item.quantidade <= 0) _itens = _itens.filter(i => i.produto._id !== produtoId);
    return true;
  }

  /** Remover produto pelo ID. */
  function remover(produtoId) {
    _itens = _itens.filter(i => i.produto._id !== produtoId);
  }

  /** Limpar carrinho. */
  function limpar() { _itens = []; }

  /** Itens (cópia). */
  function itens() { return [..._itens]; }

  /** Quantidade total de unidades. */
  function totalUnidades() { return _itens.reduce((s, i) => s + i.quantidade, 0); }

  /** Valor total em MZN. */
  function totalValor() {
    return _itens.reduce((s, i) => s + i.produto.preco * i.quantidade, 0);
  }

  function vazio() { return _itens.length === 0; }

  return { adicionar, alterarQtd, remover, limpar, itens, totalUnidades, totalValor, vazio };

})();
