/**
 * public/js/ui.js
 * =================
 * Módulo de Interface — renderização de produtos, carrinho,
 * toasts, modais e status bar.
 * 
 * Pilar 3: map() / forEach() para renderizar listas dinamicamente
 */

const UI = (function () {

  // ── Referências ao DOM ───────────────────────────────────────
  const grid         = document.getElementById("productsGrid");
  const countEl      = document.getElementById("productCount");
  const cartDrawer   = document.getElementById("cartDrawer");
  const backdrop     = document.getElementById("backdrop");
  const cartBody     = document.getElementById("cartBody");
  const cartEmpty    = document.getElementById("cartEmpty");
  const drawerFooter = document.getElementById("drawerFooter");
  const cartCount    = document.getElementById("cartCount");
  const cartSubtotal = document.getElementById("cartSubtotal");
  const cartTotal    = document.getElementById("cartTotal");
  const toastWrap    = document.getElementById("toastContainer");
  const statusDot    = document.getElementById("statusDot");
  const statusMsg    = document.getElementById("statusMsg");

  // ── Utilitários ──────────────────────────────────────────────

  /**
   * Formata valor em Meticais moçambicanos.
   * @param {number} v
   * @returns {string} ex: "MZN 45.000,00"
   */
  function moeda(v) {
    return "MZN " + v.toLocaleString("pt-MZ", { minimumFractionDigits: 2 });
  }

  // ── Status Bar (conexão ao servidor) ────────────────────────

  function setStatus(tipo, msg) {
    statusDot.className = "status-dot " + tipo;
    statusMsg.textContent = msg;
  }

  // ── Produtos ────────────────────────────────────────────────

  /**
   * Gera o HTML de um card de produto.
   * Pilar 1: usa objecto produto (estrutura de dados JSON)
   * Pilar 2: switch para estado de stock
   */
  function _cardHTML(produto, delay) {
    // Determinar badge do card
    let badge = produto.categoria;
    let badgeClass = "";
    if (produto.stock === 0) { badge = "Esgotado"; badgeClass = "esgotado"; }
    else if (produto.destaque) { badge = "★ Destaque"; badgeClass = "destaque"; }

    // Estado do stock (Pilar 2: switch)
    let stockTexto, stockClasse;
    switch (true) {
      case produto.stock === 0: stockTexto = "Esgotado";               stockClasse = "out"; break;
      case produto.stock <= 5:  stockTexto = `Últimas ${produto.stock}`; stockClasse = "low"; break;
      default:                  stockTexto = `${produto.stock} un.`;    stockClasse = "ok";
    }

    return `
      <div class="product-card" style="animation-delay:${delay}ms">
        <div class="card-img">
          <span class="card-cat ${badgeClass}">${badge}</span>
          <span role="img" aria-label="${produto.nome}">${produto.emoji}</span>
        </div>
        <div class="card-body">
          <div class="card-name">${produto.nome}</div>
          <div class="card-desc">${produto.descricao}</div>
          <div class="card-footer">
            <span class="card-price">${moeda(produto.preco)}</span>
            <span class="card-stock ${stockClasse}">${stockTexto}</span>
          </div>
          <button
            class="btn-add"
            data-id="${produto._id}"
            data-idx="${produto._id}"
            ${produto.stock === 0 ? "disabled" : ""}
          >
            ${produto.stock === 0 ? "Sem stock" : "Adicionar ao carrinho"}
          </button>
        </div>
      </div>`;
  }

  /**
   * Renderiza o grid de produtos.
   * Pilar 3: map() transforma array em HTML
   */
  function renderProdutos(produtos) {
    countEl.textContent = `${produtos.length} produto(s)`;

    if (produtos.length === 0) {
      grid.innerHTML = `<div class="no-results"><span>🔍</span><p>Nenhum produto encontrado.</p></div>`;
      return;
    }

    // map() gera cada card com delay em cascata
    grid.innerHTML = produtos.map((p, i) => _cardHTML(p, i * 55)).join("");
  }

  // ── Carrinho ─────────────────────────────────────────────────

  /** Abre o drawer do carrinho. */
  function abrirCarrinho() {
    cartDrawer.classList.add("open");
    backdrop.classList.add("active");
    document.body.style.overflow = "hidden";
    _renderCarrinho();
  }

  /** Fecha o drawer do carrinho. */
  function fecharCarrinho() {
    cartDrawer.classList.remove("open");
    backdrop.classList.remove("active");
    document.body.style.overflow = "";
  }

  /**
   * Re-renderiza a lista de itens do carrinho.
   * Pilar 3: map() para gerar cada linha de item
   */
  function _renderCarrinho() {
    const itens  = Cart.itens();
    const vazio  = Cart.vazio();

    cartEmpty.style.display  = vazio ? "flex"  : "none";
    drawerFooter.style.display = vazio ? "none" : "block";

    // Remover cards anteriores
    cartBody.querySelectorAll(".cart-item").forEach(el => el.remove());

    if (vazio) return;

    // Gerar HTML de cada item com map()
    const html = itens.map(item => {
      const sub = item.produto.preco * item.quantidade;
      return `
        <div class="cart-item" data-id="${item.produto._id}">
          <span class="ci-emoji">${item.produto.emoji}</span>
          <div class="ci-info">
            <div class="ci-name">${item.produto.nome}</div>
            <div class="ci-price">${moeda(sub)}</div>
            <div class="ci-qty">
              <button class="qty-btn ci-decr" data-id="${item.produto._id}">−</button>
              <span class="qty-num">${item.quantidade}</span>
              <button class="qty-btn ci-incr" data-id="${item.produto._id}">+</button>
            </div>
          </div>
          <button class="ci-remove" data-id="${item.produto._id}" title="Remover">✕</button>
        </div>`;
    }).join("");

    cartBody.insertAdjacentHTML("beforeend", html);

    // Actualizar totais
    cartSubtotal.textContent = moeda(Cart.totalValor());
    cartTotal.textContent    = moeda(Cart.totalValor());

    // Vincular eventos dos botões recém criados
    _bindCartEvents();
  }

  /** Actualiza o badge de contagem do carrinho. */
  function actualizarBadge() {
    const n = Cart.totalUnidades();
    cartCount.textContent = n;
    cartCount.classList.toggle("show", n > 0);
  }

  /** Re-renderiza carrinho e actualiza badge. */
  function refreshCarrinho() {
    _renderCarrinho();
    actualizarBadge();
  }

  /** Vincula eventos de qty e remoção depois de renderizar. */
  function _bindCartEvents() {
    cartBody.querySelectorAll(".ci-incr").forEach(btn =>
      btn.addEventListener("click", () => {
        const ok = Cart.alterarQtd(btn.dataset.id, +1);
        if (!ok) toast("Stock máximo atingido!", "error");
        refreshCarrinho();
      })
    );
    cartBody.querySelectorAll(".ci-decr").forEach(btn =>
      btn.addEventListener("click", () => {
        Cart.alterarQtd(btn.dataset.id, -1);
        refreshCarrinho();
      })
    );
    cartBody.querySelectorAll(".ci-remove").forEach(btn =>
      btn.addEventListener("click", () => {
        Cart.remover(btn.dataset.id);
        refreshCarrinho();
        toast("Produto removido do carrinho.");
      })
    );
  }

  // ── Toasts ───────────────────────────────────────────────────

  /**
   * Mostra uma notificação toast temporária.
   * @param {string} msg   - Mensagem a mostrar
   * @param {string} tipo  - "" | "success" | "error"
   * @param {number} ms    - Duração em ms
   */
  function toast(msg, tipo = "", ms = 3200) {
    const el = document.createElement("div");
    el.className = `toast ${tipo}`;
    el.textContent = msg;
    toastWrap.appendChild(el);
    setTimeout(() => el.remove(), ms);
  }

  // ── Modal Checkout ───────────────────────────────────────────

  /** Preenche o resumo do pedido no modal. */
  function preencherResumo() {
    const itens = Cart.itens();
    document.getElementById("reviewItems").innerHTML =
      itens.map(i => `
        <div class="review-line">
          <span>${i.produto.emoji} ${i.produto.nome} × ${i.quantidade}</span>
          <span>${moeda(i.produto.preco * i.quantidade)}</span>
        </div>`).join("");
    document.getElementById("reviewTotal").innerHTML = moeda(Cart.totalValor());
  }

  // Interface pública
  return {
    moeda, setStatus,
    renderProdutos,
    abrirCarrinho, fecharCarrinho, refreshCarrinho, actualizarBadge,
    toast, preencherResumo
  };

})();
