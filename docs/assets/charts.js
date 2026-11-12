import { shortDate } from './data.js';

const COLOR = '#6e4ecf';
const COMPARISON = '#a2a9bc';

export function connectTrend(container, model) {
  const canvas = container.querySelector('#trend-chart');
  const tooltip = container.querySelector('#trend-tip');
  if (!canvas || !tooltip) return () => {};

  const ctx = canvas.getContext('2d');
  let selected = null;
  let geometry;

  function draw() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.scale(ratio, ratio);

    const plot = { left: 54, right: width - 16, top: 14, bottom: height - 32 };
    const peak = Math.max(...model.current, ...model.previous, 1);
    const approximateStep = peak / 4;
    const magnitude = 10 ** Math.floor(Math.log10(approximateStep));
    const step = Math.ceil(approximateStep / magnitude) * magnitude;
    const topValue = step * 4;
    const x = (index) => plot.left + index * (plot.right - plot.left) / Math.max(1, model.dates.length - 1);
    const y = (value) => plot.bottom - value / topValue * (plot.bottom - plot.top);
    geometry = { plot, x };

    ctx.font = '11px Geist, system-ui, sans-serif';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#656e84';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let grid = 0; grid <= 4; grid += 1) {
      const value = step * grid;
      const lineY = y(value);
      ctx.strokeStyle = '#e9eaf1';
      ctx.beginPath();
      ctx.moveTo(plot.left, lineY);
      ctx.lineTo(plot.right, lineY);
      ctx.stroke();
      ctx.fillText(model.axis(value), plot.left - 9, lineY);
    }

    const labels = Math.max(2, Math.min(7, Math.floor(width / 94)));
    ctx.textBaseline = 'top';
    for (let slot = 0; slot < labels; slot += 1) {
      const index = Math.round(slot * (model.dates.length - 1) / (labels - 1));
      ctx.textAlign = slot === 0 ? 'left' : slot === labels - 1 ? 'right' : 'center';
      ctx.fillText(shortDate(model.dates[index]), x(index), plot.bottom + 11);
    }

    function trace(values) {
      ctx.beginPath();
      values.forEach((value, index) => {
        if (index === 0) ctx.moveTo(x(index), y(value));
        else ctx.lineTo(x(index), y(value));
      });
    }

    trace(model.current);
    ctx.lineTo(plot.right, plot.bottom);
    ctx.lineTo(plot.left, plot.bottom);
    ctx.closePath();
    const shade = ctx.createLinearGradient(0, plot.top, 0, plot.bottom);
    shade.addColorStop(0, '#8f74e537');
    shade.addColorStop(1, '#8f74e503');
    ctx.fillStyle = shade;
    ctx.fill();

    trace(model.previous);
    ctx.strokeStyle = COMPARISON;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    trace(model.current);
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2.7;
    ctx.lineJoin = 'round';
    ctx.stroke();

    if (selected !== null) {
      const markerX = x(selected);
      const markerY = y(model.current[selected]);
      ctx.strokeStyle = '#b6a7de';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(markerX, plot.top);
      ctx.lineTo(markerX, plot.bottom);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(markerX, markerY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = COLOR;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function move(event) {
    if (!geometry) return;
    const { plot, x } = geometry;
    const offset = event.clientX - canvas.getBoundingClientRect().left;
    const fraction = (offset - plot.left) / (plot.right - plot.left);
    const index = Math.max(0, Math.min(model.dates.length - 1, Math.round(fraction * (model.dates.length - 1))));
    if (selected !== index) {
      selected = index;
      draw();
    }
    tooltip.textContent = `${shortDate(model.dates[index])} · ${model.format(model.current[index])}`;
    tooltip.hidden = false;
    tooltip.style.left = `${Math.max(0, Math.min(canvas.clientWidth - tooltip.offsetWidth, x(index) - tooltip.offsetWidth / 2))}px`;
  }

  function leave() {
    selected = null;
    tooltip.hidden = true;
    draw();
  }

  const observer = new ResizeObserver(draw);
  observer.observe(canvas);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerleave', leave);
  draw();

  return () => {
    observer.disconnect();
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerleave', leave);
  };
}
