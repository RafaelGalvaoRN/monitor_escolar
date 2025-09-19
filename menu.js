// js/menu.js
(function () {
  function getParts() {
    const header = document.querySelector("#novo_background");
    if (!header) return {};
    return {
      header,
      btn: header.querySelector(".menu-toggle"),
      nav: header.querySelector(".navbar"),
    };
  }

  function openMenu(parts) {
    parts.nav.classList.add("open");
    parts.btn.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
  }

  function closeMenu(parts) {
    parts.nav.classList.remove("open");
    parts.btn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }

  function toggleMenu(parts) {
    if (parts.nav.classList.contains("open")) closeMenu(parts);
    else openMenu(parts);
  }

  // Clique no botão (delegado)
  document.addEventListener("click", function (e) {
    const parts = getParts();
    if (!parts.btn || !parts.nav) return;

    // Clique no botão
    if (e.target.closest(".menu-toggle")) {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu(parts);
      return;
    }

    // Clique em link do menu → fechar
    if (e.target.closest("#novo_background .navbar a")) {
      closeMenu(parts);
      return;
    }

    // Clique fora do menu → fechar
    if (parts.nav.classList.contains("open")) {
      const clickedInside = e.target.closest("#novo_background .navbar") || e.target.closest(".menu-toggle");
      if (!clickedInside) closeMenu(parts);
    }
  });

  // Tecla ESC fecha
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const parts = getParts();
      if (parts.nav && parts.nav.classList.contains("open")) closeMenu(parts);
    }
  });
})();
