/* ranking.js — monta o ranking da comunidade a partir de data/ranking_comunidade.json */
(function () {
  'use strict';

  const CURTO = {
    'Estrutura física': 'Estrut.', 'Acessibilidade': 'Acess.', 'Equipamentos': 'Equip.',
    'Merenda e mobiliário': 'Merenda', 'Professores': 'Profs.', 'Segurança': 'Segur.',
    'Material didático': 'Mater.', 'Transporte': 'Transp.', 'Violência': 'Violên.', 'Gestão': 'Gestão',
  };
  const fmt = (n, d = 1) => n == null ? '–' : n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const faixa = v => Math.max(1, Math.min(5, Math.round(v)));
  const fundo = v => v == null ? '' : `background:color-mix(in srgb,var(--s${faixa(v)}) 30%,var(--surface))`;
  const forte = v => `var(--s${faixa(v)})`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = id => document.getElementById(id);

  let linhas = [], dims = [], curtos = [], chave = -1;

  document.querySelectorAll('.legend i').forEach(i => { i.style.cssText = fundo(+i.dataset.s); });

  function render() {
    const q = $('q').value.trim().toLowerCase();
    let lista = linhas.filter(r => r.escola.toLowerCase().includes(q));
    lista = [...lista].sort((a, b) => chave < 0 ? b.media - a.media : (b.notas[chave] ?? 0) - (a.notas[chave] ?? 0) || b.media - a.media);
    document.querySelectorAll('#thead th').forEach(th => th.classList.toggle('sorted', th.dataset.k == chave));

    if (!lista.length) {
      const msg = `Nenhuma escola encontrada para “${esc(q)}”.`;
      $('tbody').innerHTML = `<tr><td colspan="${dims.length + 3}" class="empty">${msg}</td></tr>`;
      $('cards').innerHTML = `<div class="empty">${msg}</div>`;
      return;
    }
    $('tbody').innerHTML = lista.map(r =>
      `<tr><td class="pos num">${r.pos}º</td><td class="esc">${esc(r.escola)}</td>` +
      `<td class="avg num"><b style="background:${forte(r.media)}">${fmt(r.media)}</b></td>` +
      r.notas.map((v, i) => `<td class="c num"><span style="${fundo(v)}" title="${dims[i]}: ${v ?? 'sem nota'}">${v ?? '–'}</span></td>`).join('') +
      `</tr>`).join('');
    $('cards').innerHTML = lista.map(r =>
      `<article class="rcard"><div class="rcard-top"><span class="p num">${r.pos}º</span><span class="n">${esc(r.escola)}</span>` +
      `<span class="a num" style="background:${forte(r.media)}">${fmt(r.media)}</span></div>` +
      `<div class="dims">${r.notas.map((v, i) => `<div class="dim" style="${fundo(v)}"><b class="num">${v ?? '–'}</b><small>${curtos[i]}</small></div>`).join('')}</div></article>`
    ).join('');
  }

  function iniciar(d) {
    dims = d.dimensoes;
    curtos = dims.map(n => CURTO[n] || n.slice(0, 7));
    linhas = d.avaliacoes.slice().sort((a, b) => b.media - a.media).map((a, i) => ({ ...a, pos: i + 1 }));

    const media = linhas.reduce((s, r) => s + r.media, 0) / (linhas.length || 1);
    $('st-total').textContent = linhas.length;
    $('st-media').textContent = fmt(media, 2);
    $('st-melhor').textContent = linhas.length ? fmt(linhas[0].media, 2) : '–';
    if (d.atualizado_em) {
      const [a, m, dia] = d.atualizado_em.split('-');
      $('st-data').textContent = `Dados atualizados em ${dia}/${m}/${a}.`;
    }

    $('sort').innerHTML = '<option value="-1">Média geral</option>' + dims.map((n, i) => `<option value="${i}">${n}</option>`).join('');
    $('thead').innerHTML = '<th>#</th><th>Escola</th><th data-k="-1">Média</th>' +
      dims.map((n, i) => `<th data-k="${i}" title="Ordenar por ${n}">${curtos[i]}</th>`).join('');
    $('podium').innerHTML = linhas.slice(0, 3).map((r, i) =>
      `<div class="pod"><span class="medal m${i + 1}">${i + 1}º</span><span class="school">${esc(r.escola)}</span><span class="score num">${fmt(r.media)}</span></div>`).join('');

    $('q').addEventListener('input', render);
    $('sort').addEventListener('change', e => { chave = +e.target.value; render(); });
    $('thead').addEventListener('click', e => {
      const th = e.target.closest('th[data-k]'); if (!th) return;
      chave = +th.dataset.k; $('sort').value = chave; render();
    });
    render();
  }

  fetch('data/ranking_comunidade.json', { cache: 'no-cache' })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(iniciar)
    .catch(err => {
      console.error('Ranking: falha ao carregar dados', err);
      $('tbody').innerHTML = `<tr><td colspan="13" class="empty">Não foi possível carregar o arquivo data/ranking_comunidade.json. Abra o site por um servidor (não direto do arquivo) e tente de novo.</td></tr>`;
      $('cards').innerHTML = `<div class="empty">Não foi possível carregar as avaliações.</div>`;
    });
})();
