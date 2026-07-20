(() => {
  const form = document.querySelector('#risk-form');
  if (!form) return;
  const names = ['rainfall', 'cloud_cover', 'river_level', 'humidity'];
  const score = document.querySelector('#preview-score');
  const label = document.querySelector('#preview-label');
  const line = document.querySelector('#trend-line');
  const read = () => Object.fromEntries(names.map(n => [n, Number(form.elements[n].value) || 0]));
  const update = () => {
    const v = read();
    const n = Math.min(100, Math.round(v.rainfall / 6 + v.cloud_cover * .12 + v.river_level * 5 + v.humidity * .08));
    const type = n >= 70 ? 'High' : n >= 35 ? 'Moderate' : 'Low';
    score.textContent = names.some(k => v[k] > 0) ? `${n}%` : '—';
    label.textContent = names.some(k => v[k] > 0) ? `${type} simulated risk` : 'Awaiting data';
    label.className = `risk-${type.toLowerCase()}`;
    const pts = [Math.max(4,n-20), Math.max(4,n-14), Math.max(4,n-12), Math.max(4,n-6), n, Math.min(99,n+5), Math.min(99,n+9)]
      .map((x,i) => `${i*73},${96-x*.8}`).join(' ');
    line.setAttribute('points', pts);
  };
  names.forEach(n => form.elements[n].addEventListener('input', update));
  document.querySelectorAll('.scenario').forEach(btn => btn.addEventListener('click', () => {
    const values = btn.dataset.scenario === 'high'
      ? [285, 94, 10.2, 91] : [18, 28, 2.6, 48];
    names.forEach((n, i) => form.elements[n].value = values[i]); update();
  }));
  update();
})();
