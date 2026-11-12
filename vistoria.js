/* vistoria.js — página "Vistoria por fotos".
   Lê data/vistoria_fotos.json (gerado por monitor_escolar_fotos/exportar_site.py). */
(function () {
  'use strict';

  const CLASSES = [
    ['SATISFATORIO', 'Satisfatório'],
    ['REGULAR', 'Regular'],
    ['PRECARIO', 'Precário'],
    ['CRITICO', 'Crítico'],
    ['EMERGENCIAL', 'Emergencial'],
  ];
  const ROTULO = Object.fromEntries(CLASSES);
  const COM_PROBLEMA = new Set(['IRREGULAR', 'CRITICA', 'CRITICO', 'PRECARIO', 'EMERGENCIAL']);

  const $ = id => document.getElementById(id);
  const sem = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (n, d = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const slug = s => sem(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const classeDaNota = n => n >= 9 ? 'SATISFATORIO' : n >= 7 ? 'REGULAR' : n >= 5 ? 'PRECARIO' : n >= 3 ? 'CRITICO' : 'EMERGENCIAL';
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

  let dados, escolas = [];

  function contar(fotos) {
    const c = Object.fromEntries(CLASSES.map(([k]) => [k, 0]));
    fotos.forEach(f => { const k = sem(f.classificacao); if (k in c) c[k]++; });
    return c;
  }

  function barra(cont, total, cls = 'stack') {
    return `<div class="${cls}">` + CLASSES.filter(([k]) => cont[k]).map(([k, r]) =>
      `<span class="c-${k}" style="flex:${cont[k]}" title="${r}: ${cont[k]}"></span>`).join('') + '</div>';
  }

  /* ---------- Panorama ---------- */
  function panorama() {
    const todas = escolas.flatMap(e => e.fotos);
    const cont = contar(todas);
    const media = todas.reduce((s, f) => s + f.nota, 0) / todas.length;
    const graves = cont.CRITICO + cont.EMERGENCIAL;

    $('k-escolas').textContent = escolas.length;
    $('k-fotos').textContent = todas.length.toLocaleString('pt-BR');
    $('k-media').textContent = fmt(media);
    $('k-graves').textContent = graves;

    $('stack-geral').outerHTML = barra(cont, todas.length, 'stack big');
    $('lista-classes').innerHTML = CLASSES.map(([k, r]) =>
      `<li class="c-${k}"><span class="dot"></span><span>${r}</span><span class="n">${cont[k]}</span><span class="pct">${fmt(cont[k] / todas.length * 100, 0)}%</span></li>`).join('');

    const temas = (dados.temas || []).slice(0, 8);
    const max = Math.max(...temas.map(t => t.fotos), 1);
    $('temas').innerHTML = temas.map(t =>
      `<div class="tema"><span class="nome">${esc(t.tema)}</span><span class="val">${t.fotos}</span>` +
      `<span class="bar"><i style="width:${(t.fotos / max * 100).toFixed(1)}%"></i></span>` +
      `<small>em ${plural(t.escolas, 'escola', 'escolas')}</small></div>`).join('');

    if (dados.atualizado_em) {
      const [a, m, d] = dados.atualizado_em.split('-');
      $('data-analise').textContent = `Análise mais recente em ${d}/${m}/${a}.`;
    }
    if (dados.modelo) $('modelo').textContent = dados.modelo;
  }

  /* ---------- Lista de escolas ---------- */
  function resumoEscola(e) {
    const cont = contar(e.fotos);
    const k = classeDaNota(e.media);
    const meta = [
      plural(e.fotos.length, 'foto', 'fotos'),
      e.graves ? plural(e.graves, 'ambiente grave', 'ambientes graves') : 'nenhum ambiente grave',
    ];
    return `<summary>
      <span class="nota-big c-${k}">${fmt(e.media)}<small>${ROTULO[k]}</small></span>
      <span>
        <span class="nome">${esc(e.nome)}</span>
        <span class="meta"><span>${meta.join(' · ')}</span>${e.interdicao ? `<span class="alerta"><i class="fas fa-exclamation-triangle"></i>${plural(e.interdicao, 'alerta de interdição', 'alertas de interdição')}</span>` : ''}</span>
        ${barra(cont, e.fotos.length)}
      </span>
      <svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </summary>`;
  }

  function cartaoFoto(f) {
    const k = sem(f.classificacao);
    const itens = Object.entries(f.eixos || {}).flatMap(([eixo, v]) =>
      (v.problemas || []).map(p => `<li><b>${esc(dados.eixos[eixo] || eixo)}:</b> ${esc(p)}</li>`));
    return `<article class="foto c-${k}">
      <div class="foto-top"><span class="amb">${esc(f.ambiente)}</span>${f.interdicao ? '<span class="alerta"><i class="fas fa-exclamation-triangle"></i>Alerta de interdição</span>' : ''}<span class="pill c-${k}">${f.nota}/10 · ${ROTULO[k] || f.classificacao}</span></div>
      <p class="desc">${esc(f.descricao)}</p>
      ${itens.length ? `<ul>${itens.join('')}</ul>` : '<p class="ok"><i class="fas fa-check-circle"></i> Nenhum problema visível apontado.</p>'}
    </article>`;
  }

  function detalhe(e, el) {
    const eixos = Object.keys(dados.eixos).map(ch => {
      const aval = e.fotos.filter(f => f.eixos[ch] && sem(f.eixos[ch].situacao) !== 'NAO AVALIAVEL');
      const prob = aval.filter(f => COM_PROBLEMA.has(sem(f.eixos[ch].situacao)) || (f.eixos[ch].problemas || []).length);
      const pct = aval.length ? prob.length / aval.length * 100 : 0;
      return `<div class="eixo-box"><div class="t">${esc(dados.eixos[ch])}</div><div class="v">${prob.length}<small> de ${aval.length} fotos com algum problema</small></div><div class="bar"><i style="width:${pct.toFixed(0)}%"></i></div></div>`;
    }).join('');

    const ambientes = [...new Set(e.fotos.map(f => f.ambiente))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const fotos = [...e.fotos].sort((a, b) => a.nota - b.nota);

    el.insertAdjacentHTML('beforeend', `<div class="detalhe">
      <div class="eixos-resumo">${eixos}</div>
      <div class="filtro-amb" role="group" aria-label="Filtrar por ambiente">
        <button type="button" aria-pressed="true" data-amb="">Todos (${fotos.length})</button>
        ${ambientes.map(a => `<button type="button" aria-pressed="false" data-amb="${esc(a)}">${esc(a)} (${fotos.filter(f => f.ambiente === a).length})</button>`).join('')}
      </div>
      <div class="fotos">${fotos.map(cartaoFoto).join('')}</div>
    </div>`);

    const grade = el.querySelector('.fotos');
    el.querySelector('.filtro-amb').addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b) return;
      el.querySelectorAll('.filtro-amb button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      const amb = b.dataset.amb;
      grade.innerHTML = fotos.filter(f => !amb || f.ambiente === amb).map(cartaoFoto).join('');
    });
  }

  function renderLista() {
    const q = sem($('q').value.trim());
    const so = $('so-alerta').checked;
    const ordem = $('ordem').value;
    let lista = escolas.filter(e => sem(e.nome).includes(q) && (!so || e.interdicao));
    const cmp = {
      pior: (a, b) => a.media - b.media,
      melhor: (a, b) => b.media - a.media,
      graves: (a, b) => b.graves - a.graves || a.media - b.media,
      nome: (a, b) => a.nome.localeCompare(b.nome, 'pt-BR'),
    }[ordem];
    lista = lista.sort(cmp);

    const box = $('escolas');
    if (!lista.length) { box.innerHTML = '<p class="muted">Nenhuma escola encontrada com esses filtros.</p>'; return; }
    box.innerHTML = lista.map(e => `<details class="escola" id="${e.id}">${resumoEscola(e)}</details>`).join('');
    box.querySelectorAll('details.escola').forEach(d => d.addEventListener('toggle', () => {
      if (d.open && !d.querySelector('.detalhe')) detalhe(escolas.find(x => x.id === d.id), d);
      if (d.open) history.replaceState(null, '', '#' + d.id);
    }));
  }

  function pendentes() {
    const p = dados.aguardando_analise || [];
    if (!p.length) return;
    $('pendentes-sec').hidden = false;
    $('pendentes').innerHTML = p.map(x => `<li>${esc(x.nome)}<small>${plural(x.fotos_com_erro, 'foto não pôde ser lida', 'fotos não puderam ser lidas')}</small></li>`).join('');
  }

  function abrirPeloEndereco() {
    const id = location.hash.slice(1);
    const d = id && document.getElementById(id);
    if (d && d.tagName === 'DETAILS') { d.open = true; setTimeout(() => d.scrollIntoView({ block: 'start' }), 50); }
  }

  fetch('data/vistoria_fotos.json', { cache: 'no-cache' })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(d => {
      dados = d;
      escolas = d.escolas.map(e => {
        const media = e.fotos.reduce((s, f) => s + f.nota, 0) / e.fotos.length;
        const cont = contar(e.fotos);
        return { ...e, id: 'escola-' + slug(e.nome), media, graves: cont.CRITICO + cont.EMERGENCIAL, interdicao: e.fotos.filter(f => f.interdicao).length };
      });
      panorama();
      renderLista();
      pendentes();
      abrirPeloEndereco();
      ['q', 'ordem', 'so-alerta'].forEach(id => $(id).addEventListener(id === 'q' ? 'input' : 'change', renderLista));
    })
    .catch(err => {
      console.error('Vistoria: falha ao carregar dados', err);
      $('escolas').innerHTML = '<p class="alert">Não foi possível carregar o arquivo data/vistoria_fotos.json. Abra o site por um servidor (não direto do arquivo) e tente de novo.</p>';
    });
})();
