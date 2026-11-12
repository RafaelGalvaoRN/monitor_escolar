/* home.js — números e gráficos da página inicial.
   Lê data/projeto_monitor.csv (gestores) e data/ranking_comunidade.json (comunidade).
   Os valores escritos no HTML servem de reserva caso os arquivos não carreguem. */
(function () {
  'use strict';

  const fmt = (n, d = 0) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

  // CSV com aspas e quebras de linha dentro dos campos
  function parseCSV(txt) {
    txt = txt.replace(/^﻿/, '');
    const linhas = []; let linha = [], campo = '', aspas = false;
    for (let i = 0; i < txt.length; i++) {
      const c = txt[i];
      if (aspas) {
        if (c === '"') { if (txt[i + 1] === '"') { campo += '"'; i++; } else aspas = false; }
        else campo += c;
      } else if (c === '"') aspas = true;
      else if (c === ',') { linha.push(campo); campo = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && txt[i + 1] === '\n') i++;
        linha.push(campo); campo = '';
        if (linha.some(v => v.trim() !== '')) linhas.push(linha);
        linha = [];
      } else campo += c;
    }
    if (campo || linha.length) { linha.push(campo); if (linha.some(v => v.trim() !== '')) linhas.push(linha); }
    return linhas;
  }

  function setKPI(nome, valor) {
    const el = document.querySelector(`[data-kpi="${nome}"]`);
    if (el && Number.isFinite(valor)) el.dataset.count = valor;
  }

  function barras(el, itens, max, dec) {
    el.innerHTML = itens.map(([n, v]) =>
      `<div class="brow"><span class="name" title="${n}">${n}</span><div class="track"><div class="fill" style="width:${(v / max * 100).toFixed(1)}%"></div></div><span class="val num">${fmt(v, dec)}</span></div>`
    ).join('');
  }

  function contar() {
    const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('[data-count]').forEach(el => {
      const fim = +el.dataset.count, dec = +(el.dataset.dec || 0);
      const sufixo = el.querySelector('small') ? el.querySelector('small').outerHTML : '';
      const escrever = v => { el.innerHTML = fmt(v, dec) + sufixo; };
      if (reduzir) { escrever(fim); return; }
      const t0 = performance.now(), dur = 1100;
      const passo = t => {
        const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        escrever(dec ? fim * e : Math.round(fim * e));
        if (p < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    });
  }

  async function gestores() {
    const r = await fetch('data/projeto_monitor.csv', { cache: 'no-cache' });
    if (!r.ok) throw new Error('CSV ' + r.status);
    const [cab, ...linhas] = parseCSV(await r.text());
    const iEscola = cab.findIndex(c => /^1\.1\.\s/.test(c));
    const iMun = cab.findIndex(c => /^1\.11\./.test(c));
    const escolas = new Set(linhas.map(l => (l[iEscola] || '').trim().toUpperCase()).filter(Boolean));
    const porMun = {};
    linhas.forEach(l => { const m = (l[iMun] || '').trim(); if (m) porMun[m] = (porMun[m] || 0) + 1; });
    const lista = Object.entries(porMun).sort((a, b) => b[1] - a[1]);

    setKPI('escolas', escolas.size);
    setKPI('municipios', lista.length);
    setKPI('quesitos', cab.length - 1);
    document.getElementById('sub-mun').textContent = `${linhas.length} formulários enviados pelos gestores`;
    barras(document.getElementById('bars-mun'), lista, lista[0][1], 0);
  }

  async function comunidade() {
    const r = await fetch('data/ranking_comunidade.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('JSON ' + r.status);
    const d = await r.json();
    const av = d.avaliacoes || [];
    const media = av.reduce((s, a) => s + a.media, 0) / av.length;
    setKPI('avaliacoes', av.length);
    setKPI('media', Math.round(media * 100) / 100);

    const dims = d.dimensoes.map((nome, i) => {
      const v = av.map(a => a.notas[i]).filter(x => x != null);
      return [nome, v.reduce((s, x) => s + x, 0) / v.length];
    }).sort((a, b) => b[1] - a[1]);
    barras(document.getElementById('bars-dim'), dims, 5, 1);

    if (d.atualizado_em) {
      const [a, m, dia] = d.atualizado_em.split('-').map(Number);
      document.getElementById('atualizado').textContent = `Dados atualizados em ${dia} de ${MESES[m - 1]} de ${a}`;
    }
  }

  async function vistoria() {
    const r = await fetch('data/vistoria_resumo.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('vistoria ' + r.status);
    const d = await r.json();
    const por = { fotos: d.fotos.toLocaleString('pt-BR'), escolas: d.escolas, media: fmt(d.media, 1), graves: d.graves };
    document.querySelectorAll('[data-vist]').forEach(el => { if (por[el.dataset.vist] != null) el.textContent = por[el.dataset.vist]; });
  }

  Promise.allSettled([gestores(), comunidade(), vistoria()]).then(res => {
    res.forEach(r => { if (r.status === 'rejected') console.warn('Página inicial: usando números de reserva.', r.reason); });
    const dim = document.getElementById('bars-dim');
    if (dim.querySelector('p')) dim.innerHTML = '<p class="sub">Não foi possível carregar as notas agora.</p>';
    contar();
  });
})();
