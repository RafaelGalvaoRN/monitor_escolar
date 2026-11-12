/* =====================================================================
   layout.js — cabeçalho, menu, rodapé e tema (claro/escuro) do site.
   Substitui header.html, footer.html, menu.js e o jQuery .load().
   Uso em cada página:
     <div id="header-placeholder"></div>
     <script src="layout.js"></script>      (logo após o placeholder)
     ...
     <div id="footer-placeholder"></div>
   Para incluir uma página nova no menu, edite a constante MENU abaixo.
   ===================================================================== */
(function () {
  'use strict';

  const FORM_COMUNIDADE = 'https://forms.gle/7YwVNC8vuRiRnSa36';

  const MENU = [
    { titulo: 'Início', href: 'index.html' },
    { titulo: 'Projeto', itens: [
      { titulo: 'Gestores', desc: 'Formulário dos diretores', href: 'projeto.html' },
      { titulo: 'Comunidade', desc: 'Avaliação de pais, alunos e professores', href: 'projeto_comunidade.html' },
    ]},
    { titulo: 'Participantes', itens: [
      { titulo: 'Escolas · Gestores', desc: 'Situação de envio dos formulários', href: 'escolas_participantes.html' },
      { titulo: 'Escolas · Comunidade', desc: 'Escolas avaliadas pela comunidade', href: 'escolas_participantes_censo.html' },
    ]},
    { titulo: 'Dados', itens: [
      { titulo: 'Estatísticas por quesito', desc: 'Gráficos de cada pergunta', href: 'estatisticas.html' },
      { titulo: 'Estatísticas por eixo', desc: 'Todas as perguntas de um eixo', href: 'estatisticas_eixo.html' },
    ]},
    { titulo: 'Avaliações', itens: [
      { titulo: 'Avaliação dos gestores', desc: 'Tabela completa com filtros', href: 'tabela.html' },
      { titulo: 'Ranking da comunidade', desc: 'Notas de 1 a 5', href: 'ranking.html' },
    ]},
  ];

  const pagina = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const atual = (href) => href.toLowerCase() === pagina;
  const chev = '<svg class="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

  function htmlHeader() {
    const nav = MENU.map(g => {
      if (!g.itens) {
        return `<li><a class="nav-btn${atual(g.href) ? ' is-current' : ''}" href="${g.href}"${atual(g.href) ? ' aria-current="page"' : ''}>${g.titulo}</a></li>`;
      }
      const ativo = g.itens.some(i => atual(i.href));
      const itens = g.itens.map(i => `<li><a href="${i.href}"${atual(i.href) ? ' class="is-current" aria-current="page"' : ''}>${i.titulo}<small>${i.desc}</small></a></li>`).join('');
      return `<li><button class="nav-btn${ativo ? ' is-current' : ''}" aria-expanded="false" aria-haspopup="true">${g.titulo} ${chev}</button><ul class="menu">${itens}</ul></li>`;
    }).join('');

    const drawer = MENU.map(g => g.itens
      ? `<div><h4>${g.titulo}</h4>${g.itens.map(i => `<a href="${i.href}"${atual(i.href) ? ' class="is-current"' : ''}>${i.titulo}</a>`).join('')}</div>`
      : `<div><a href="${g.href}"${atual(g.href) ? ' class="is-current"' : ''}>${g.titulo}</a></div>`).join('');

    return `
<header class="site-header" id="novo_background">
  <div class="wrap bar">
    <a class="brand" href="index.html" aria-label="Monitor Escolar, página inicial">
      <span class="brand-mark" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 5l9 6.5"/><path d="M5 10v9h14v-9"/><path d="M8.5 16.5l2.2-2.6 2 1.6 2.8-3.5"/></svg>
      </span>
      <span class="brand-name">Monitor Escolar<span class="brand-sub">MPRN · Canguaretama</span></span>
    </a>
    <ul class="nav" aria-label="Menu principal">${nav}</ul>
    <button class="icon-btn theme-toggle" type="button" aria-label="Alternar tema claro/escuro" title="Alternar tema claro/escuro">
      <svg class="sun" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      <svg class="moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>
    </button>
    <button class="icon-btn burger" type="button" aria-expanded="false" aria-controls="drawer" aria-label="Abrir menu">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
  </div>
  <nav class="drawer" id="drawer" aria-label="Menu"><div class="wrap drawer-inner">${drawer}</div></nav>
</header>`;
  }

  function htmlFooter() {
    const ano = new Date().getFullYear();
    return `
<footer class="site-footer" id="footer_background">
  <div class="wrap">
    <div class="org">
      <img src="img/logo-mprn.png" alt="Ministério Público do Rio Grande do Norte" width="141" height="72">
      <div>
        <strong>1ª Promotoria de Justiça da Comarca de Canguaretama</strong>
        Rua Princesa Isabel, 190, Centro, Canguaretama/RN · CEP 59190-000<br>
        Fone: (84) 9 9972-4630 · pmj.canguaretama@mprn.mp.br
        <div class="social">
          <a href="https://www.youtube.com/user/mprnimprensa" target="_blank" rel="noopener" title="YouTube" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
          <a href="https://instagram.com/mprn_oficial" target="_blank" rel="noopener" title="Instagram" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
          <a href="https://twitter.com/mprn_oficial" target="_blank" rel="noopener" title="Twitter" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
          <a href="https://www.facebook.com/mprnoficial/" target="_blank" rel="noopener" title="Facebook" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
        </div>
      </div>
    </div>
    <div class="cols">
      <div><h4>Explorar</h4><a href="estatisticas_eixo.html">Estatísticas</a><a href="tabela.html">Avaliação dos gestores</a><a href="ranking.html">Ranking da comunidade</a></div>
      <div><h4>Participar</h4><a href="docs/formulario2.pdf">Formulário dos gestores (PDF)</a><a href="${FORM_COMUNIDADE}" target="_blank" rel="noopener">Avaliar uma escola</a><a href="data/projeto_monitor.csv" download>Baixar dados (CSV)</a></div>
    </div>
  </div>
  <div class="legal"><div class="wrap">© ${ano} Ministério Público do Estado do Rio Grande do Norte · Projeto Monitor Escolar</div></div>
</footer>`;
  }

  /* ---------- Tema claro/escuro ---------- */
  const raiz = document.documentElement;
  function temaAtual() {
    return raiz.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  function alternarTema() {
    const novo = temaAtual() === 'dark' ? 'light' : 'dark';
    raiz.dataset.theme = novo;
    try { localStorage.setItem('me-tema', novo); } catch (e) {}
    document.dispatchEvent(new CustomEvent('tema:alterado', { detail: novo }));
  }
  window.MonitorTema = { atual: temaAtual };

  /* ---------- Montagem ---------- */
  function montarHeader() {
    const ph = document.getElementById('header-placeholder');
    if (!ph || ph.dataset.ok) return;
    ph.outerHTML = htmlHeader();
    ligarMenu();
  }
  function montarFooter() {
    const ph = document.getElementById('footer-placeholder');
    if (!ph || ph.dataset.ok) return;
    ph.outerHTML = htmlFooter();
  }

  function ligarMenu() {
    const header = document.querySelector('.site-header');
    const burger = header.querySelector('.burger');
    const drawer = header.querySelector('.drawer');
    const fecharDrawer = () => { drawer.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); };

    burger.addEventListener('click', () => {
      const aberto = drawer.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(aberto));
    });
    header.querySelector('.theme-toggle').addEventListener('click', alternarTema);

    // dropdowns: abrem no hover (CSS) e também por clique/toque e teclado
    header.querySelectorAll('.nav > li > button').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const li = btn.parentElement;
        const abrir = !li.classList.contains('open');
        header.querySelectorAll('.nav > li.open').forEach(o => { o.classList.remove('open'); o.firstElementChild.setAttribute('aria-expanded', 'false'); });
        li.classList.toggle('open', abrir);
        btn.setAttribute('aria-expanded', String(abrir));
      });
    });
    document.addEventListener('click', () => header.querySelectorAll('.nav > li.open').forEach(o => o.classList.remove('open')));
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      header.querySelectorAll('.nav > li.open').forEach(o => o.classList.remove('open'));
      fecharDrawer();
    });
    addEventListener('resize', () => { if (innerWidth > 960) fecharDrawer(); });
  }

  /* ---------- Sumário interno com destaque da seção visível ---------- */
  function ligarSumario() {
    const toc = document.querySelector('.proj-toc');
    if (!toc || !('IntersectionObserver' in window)) return;
    const links = [...toc.querySelectorAll('a[href^="#"]')];
    const secoes = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const obs = new IntersectionObserver(entradas => {
      entradas.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(a => {
          const on = a.getAttribute('href') === '#' + en.target.id;
          a.classList.toggle('is-active', on);
          if (on) a.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secoes.forEach(s => obs.observe(s));
  }

  montarHeader();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { montarHeader(); montarFooter(); ligarSumario(); });
  } else { montarFooter(); ligarSumario(); }
})();
