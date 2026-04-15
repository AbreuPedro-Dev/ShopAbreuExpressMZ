/**
 * public/js/app.js
 * ==================
 * Orquestrador principal da aplicação.
 * Inicializa módulos, gere eventos globais e lógica de checkout.
 * 
 * Pilar 4: Integração completa Front-end ↔ API Node.js ↔ MongoDB
 */

(async function () {

  // ── Referências ao DOM ───────────────────────────────────────
  const searchInput   = document.getElementById("searchInput");
  const catNav        = document.getElementById("catNav");
  const cartTrigger   = document.getElementById("cartTrigger");
  const closeCart     = document.getElementById("closeCart");
  const backdrop      = document.getElementById("backdrop");
  const checkoutBtn   = document.getElementById("checkoutBtn");
  const checkoutModal = document.getElementById("checkoutModal");
  const closeModal    = document.getElementById("closeModal");
  const btnCancelar   = document.getElementById("btnCancelar");
  const btnConfirmar  = document.getElementById("btnConfirmar");
  const successOverlay = document.getElementById("successOverlay");
  const btnSuccessClose = document.getElementById("btnSuccessClose");
  const productsGrid  = document.getElementById("productsGrid");

  // Estado local de filtros
  let filtros = { categoria: "todas", pesquisa: "" };

  // Cache dos produtos (evita re-fetch desnecessário)
  let produtosCache = [];

  // ── 1. HEALTH CHECK — Verificar servidor ────────────────────
  UI.setStatus("pulse", "A ligar ao servidor…");
  const online = await API.healthCheck();

  if (online) {
    UI.setStatus("ok", "ShopAbreuPedroExpressMZ — E-Commerce ✓");
  } else {
    UI.setStatus("error", "⚠ Servidor offline — verifica se o Node.js está em execução.");
    UI.toast("Servidor offline. Inicia o servidor com 'npm run dev'.", "error", 7000);
  }

  // ── 2. CARREGAR PRODUTOS ─────────────────────────────────────

  /**
   * Busca produtos da API com os filtros actuais e renderiza.
   * Pilar 4: chamada real à API REST (fetch → MongoDB)
   */
  async function carregarProdutos() {
    try {
      const produtos = await API.listarProdutos(filtros);
      produtosCache  = produtos;
      UI.renderProdutos(produtos);
      _bindAddButtons();
    } catch (err) {
      document.getElementById("productsGrid").innerHTML =
        `<div class="no-results"><span>⚠️</span><p>${err.message}</p></div>`;
      UI.toast("Erro ao carregar produtos: " + err.message, "error");
    }
  }

  await carregarProdutos();

  // ── 3. FILTROS: PESQUISA E CATEGORIA ────────────────────────

  // Pesquisa com debounce (300ms) — evita chamadas a cada tecla
  let debounceTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filtros.pesquisa = searchInput.value;
      carregarProdutos();
    }, 300);
  });

  // Filtro por categoria (botões do header)
  catNav.addEventListener("click", (e) => {
    const btn = e.target.closest(".cat-btn");
    if (!btn) return;

    // Actualizar estado activo visual
    catNav.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    filtros.categoria = btn.dataset.cat;
    carregarProdutos();
  });

  // ── 4. BOTÕES "ADICIONAR AO CARRINHO" ───────────────────────

  /**
   * Vincula eventos a todos os botões btn-add após renderização.
   * Usa event delegation no grid.
   */
  function _bindAddButtons() {
    productsGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-add");
      if (!btn || btn.disabled) return;

      const id      = btn.dataset.id;
      const produto = produtosCache.find(p => p._id === id);
      if (!produto) return;

      // Tentar adicionar (Pilar 2: switch para tratar resultados)
      const resultado = Cart.adicionar(produto);
      switch (resultado) {
        case "adicionado":
          UI.toast(`✅ "${produto.nome}" adicionado!`, "success");
          btn.textContent = "✓ Adicionado";
          setTimeout(() => { btn.textContent = "Adicionar ao carrinho"; }, 1600);
          break;
        case "incrementado":
          UI.toast(`➕ +1 "${produto.nome}" no carrinho`, "success");
          break;
        case "limite":
          UI.toast("Stock máximo atingido para este produto.", "error");
          break;
        case "sem_stock":
          UI.toast("Produto sem stock.", "error");
          break;
      }

      UI.actualizarBadge();
    }, { once: false }); // Apenas um listener no grid (event delegation)
  }

  // ── 5. CARRINHO (DRAWER) ────────────────────────────────────
  cartTrigger.addEventListener("click",  UI.abrirCarrinho);
  closeCart.addEventListener("click",    UI.fecharCarrinho);
  backdrop.addEventListener("click",     UI.fecharCarrinho);

  // ── 6. CHECKOUT — ABRIR MODAL ───────────────────────────────
  checkoutBtn.addEventListener("click", () => {
    if (Cart.vazio()) { UI.toast("O carrinho está vazio!", "error"); return; }
    UI.fecharCarrinho();
    UI.preencherResumo();
    checkoutModal.classList.add("open");
  });

  closeModal.addEventListener("click",  () => checkoutModal.classList.remove("open"));
  btnCancelar.addEventListener("click", () => checkoutModal.classList.remove("open"));
  checkoutModal.addEventListener("click", e => {
    if (e.target === checkoutModal) checkoutModal.classList.remove("open");
  });

  // ── 7. CONFIRMAR PEDIDO ──────────────────────────────────────

  btnConfirmar.addEventListener("click", async () => {

    // Recolher dados do formulário
    const nome      = document.getElementById("fNome").value.trim();
    const email     = document.getElementById("fEmail").value.trim();
    const telefone  = document.getElementById("fTelefone").value.trim();
    const payInput  = document.querySelector('input[name="pay"]:checked');
    const pagamento = payInput ? payInput.value : "";

    // ── Validação (Pilar 2: if/else) ────────────────────────
    const camposInvalidos = [];

    if (nome.length < 3) camposInvalidos.push("fNome");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) camposInvalidos.push("fEmail");
    if (telefone.replace(/\D/g,"").length < 8) camposInvalidos.push("fTelefone");

    // Limpar erros anteriores
    ["fNome","fEmail","fTelefone"].forEach(id => {
      document.getElementById(id).classList.remove("invalid");
    });

    if (camposInvalidos.length > 0) {
      camposInvalidos.forEach(id => document.getElementById(id).classList.add("invalid"));
      UI.toast("❌ Preenche todos os campos correctamente.", "error");
      return;
    }

    if (!pagamento) {
      UI.toast("❌ Selecciona um método de pagamento.", "error");
      return;
    }

    // ── Preparar payload para a API ─────────────────────────
    const itens = Cart.itens().map(i => ({
      produtoId:  i.produto._id,
      quantidade: i.quantidade
    }));

    const payload = {
      itens,
      cliente:         { nome, email, telefone },
      metodoPagamento: pagamento
    };

    // ── Enviar pedido à API (Pilar 4: fetch → Node.js → MongoDB) ─
    btnConfirmar.disabled    = true;
    btnConfirmar.textContent = "A processar…";

    try {
      const resposta = await API.criarPedido(payload);

      // Sucesso!
      checkoutModal.classList.remove("open");
      Cart.limpar();
      UI.actualizarBadge();
      UI.refreshCarrinho();

      // Re-carregar produtos (stock foi actualizado no servidor)
      await carregarProdutos();

      // Mostrar overlay de sucesso
      document.getElementById("successMsg").textContent =
        `${resposta.dados.numeroPedido} — ${UI.moeda(resposta.dados.total)} via ${pagamento.toUpperCase()}`;
      successOverlay.classList.add("show");

    } catch (err) {
      UI.toast("❌ " + err.message, "error", 5000);
    } finally {
      btnConfirmar.disabled    = false;
      btnConfirmar.textContent = "Confirmar Pedido";
    }
  });

  // ── 8. FECHAR SUCCESS OVERLAY ────────────────────────────────
  btnSuccessClose.addEventListener("click", () => {
    successOverlay.classList.remove("show");
    // Limpar formulário
    ["fNome","fEmail","fTelefone"].forEach(id => document.getElementById(id).value = "");
    document.querySelectorAll('input[name="pay"]').forEach(r => r.checked = false);
  });

})(); // IIFE auto-executável — corre ao carregar a página
