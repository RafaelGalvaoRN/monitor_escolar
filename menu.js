// menu.js
(function () {
  function getParts() {
    const header = document.querySelector("#novo_background");
    if (!header) return {};
    return {
      header,
      btn: header.querySelector(".menu-toggle"),
      nav: header.querySelector(".navbar-nav"),
    };
  }

  function openMenu(parts) {
    parts.nav.classList.add("open");
    if (parts.btn) parts.btn.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
  }

  function closeMenu(parts) {
    parts.nav.classList.remove("open");
    if (parts.btn) parts.btn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }

  function toggleMenu(parts) {
    if (parts.nav.classList.contains("open")) closeMenu(parts);
    else openMenu(parts);
  }

  function closeAllDropdowns() {
    document
      .querySelectorAll("#primary-nav .nav-item.dropdown.open")
      .forEach((el) => el.classList.remove("open"));
  }

  // === INIT: força começar fechado e liga os handlers (pode ser chamado várias vezes) ===
  function initMenu() {
    const parts = getParts();
    if (!parts.header || !parts.nav) return;

    // força estado inicial fechado
    parts.nav.classList.remove("open");
    if (parts.btn) parts.btn.setAttribute("aria-expanded", "false");
    closeAllDropdowns();
  }

  // chama no DOM pronto (útil quando o header está estático)
  document.addEventListener("DOMContentLoaded", initMenu);

  // chama quando o header for injetado via jQuery .load(...)
  document.addEventListener("header:loaded", initMenu);

  // Delegação de eventos (um só listener para tudo)
  document.addEventListener("click", function (e) {
    const parts = getParts();
    if (!parts.nav) return;

    // hamburguer
    if (e.target.closest(".menu-toggle")) {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu(parts);
      return;
    }

    // toggle do dropdown
    const ddToggle = e.target.closest(".dropdown-toggle");
    if (ddToggle) {
      e.preventDefault();
      const li = ddToggle.closest(".nav-item.dropdown");
      document
        .querySelectorAll("#primary-nav .nav-item.dropdown.open")
        .forEach((el) => { if (el !== li) el.classList.remove("open"); });
      li.classList.toggle("open");
      return;
    }

    // clique em link do menu → fecha dropdowns e painel (se mobile)
    if (e.target.closest("#novo_background .navbar-nav a, #novo_background .dropdown-item")) {
      closeAllDropdowns();
      if (parts.nav.classList.contains("open")) closeMenu(parts);
      return;
    }

    // clique fora → fecha tudo
    const clickedInside =
      e.target.closest("#novo_background .navbar-nav") ||
      e.target.closest("#novo_background .menu-toggle") ||
      e.target.closest("#novo_background .dropdown-toggle");
    if (!clickedInside) {
      closeAllDropdowns();
      if (parts.nav.classList.contains("open")) closeMenu(parts);
    }
  });

  // ESC fecha tudo
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const parts = getParts();
      closeAllDropdowns();
      if (parts.nav && parts.nav.classList.contains("open")) closeMenu(parts);
    }
  });

  // (opcional) ao redimensionar, apenas fecha dropdowns
  window.addEventListener("resize", closeAllDropdowns);
})();
