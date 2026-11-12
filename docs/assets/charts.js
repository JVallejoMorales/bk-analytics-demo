import { shortDate } from './data.js?v=2';

const color = '#5751a6';
const comparisonColor = '#968aa9';

export function connectTrend(container, model) {
  const canvas = container.querySelector('#trend-chart');
  const tooltip = container.querySelector('#trend-tip');
  if (!canvas || !tooltip) return () => {};
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  let selected = null;
  let geometry;

  function draw() {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.scale(ratio, ratio);

    const plot = { left: 62, right: width - 15, top: 15, bottom: height - 29 };
    const peak = Math.max(...model.current, ...model.previous, 1);
    const approx = peak / 4, magnitude = 10 ** Math.floor(Math.log10(approx));
    const step = Math.ceil(approx / magnitude) * magnitude;
    const lastIndex = model.dates.length - 1;
    const x = (index) => lastIndex ? plot.left + index * (plot.right - plot.left) / lastIndex : (plot.left + plot.right) / 2;
    const y = (value) => plot.bottom - value / (step * 4) * (plot.bottom - plot.top);
    geometry = { plot, x };

    ctx.font = '11px Arial, sans-serif';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#625b77';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let grid = 0; grid <= 4; grid++) {
      const value = step * grid, lineY = y(value);
      ctx.strokeStyle = '#eae7f2';
      ctx.beginPath();
      ctx.moveTo(plot.left, lineY);
      ctx.lineTo(plot.right, lineY);
      ctx.stroke();
      ctx.fillText(model.axis(value), plot.left - 7, lineY);
    }
    const labelCount = Math.min(lastIndex + 1, Math.max(2, Math.min(7, Math.floor(width / 85))));
    ctx.textBaseline = 'top';
    for (let slot = 0; slot < labelCount; slot++) {
      const index = Math.round(slot * lastIndex / Math.max(1, labelCount - 1));
      ctx.textAlign = labelCount === 1 ? 'center' : slot === 0 ? 'left' : slot === labelCount - 1 ? 'right' : 'center';
      ctx.fillText(shortDate(model.dates[index]), x(index), plot.bottom + 10);
    }
    function trace(values) {
      ctx.beginPath();
      values.forEach((value, index) => index ? ctx.lineTo(x(index), y(value)) : ctx.moveTo(x(index), y(value)));
    }
    function point(index, value, paint) {
      ctx.beginPath();
      ctx.arc(x(index), y(value), 4.5, 0, Math.PI * 2);
      ctx.fillStyle = paint;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (lastIndex) {
      trace(model.current);
      ctx.lineTo(plot.right, plot.bottom);
      ctx.lineTo(plot.left, plot.bottom);
      ctx.closePath();
      const shade = ctx.createLinearGradient(0, plot.top, 0, plot.bottom);
      shade.addColorStop(0, '#7d6dbd38');
      shade.addColorStop(1, '#7d6dbd03');
      ctx.fillStyle = shade;
      ctx.fill();
    }
    if (model.previous.length) {
      trace(model.previous);
      ctx.strokeStyle = comparisonColor;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      if (!lastIndex) point(0, model.previous[0], comparisonColor);
    }
    trace(model.current);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    if (!lastIndex) point(0, model.current[0], color);
    if (selected !== null) {
      ctx.strokeStyle = '#b8acd3';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x(selected), plot.top);
      ctx.lineTo(x(selected), plot.bottom);
      ctx.stroke();
      point(selected, model.current[selected], color);
    }
  }

  function show(index) {
    if (!geometry) return;
    const next = Math.max(0, Math.min(model.dates.length - 1, index));
    if (selected !== next || tooltip.hidden) {
      selected = next;
      draw();
      tooltip.textContent = shortDate(model.dates[next]) + ' · ' + model.format(model.current[next])
        + (model.previous.length ? ' / ' + model.format(model.previous[next]) + ' comparable' : '');
      tooltip.hidden = false;
      tooltip.style.left = Math.max(0, Math.min(canvas.clientWidth - tooltip.offsetWidth, geometry.x(next) - tooltip.offsetWidth / 2)) + 'px';
    }
  }
  function move(event) {
    if (!geometry) return;
    const { plot } = geometry;
    const fraction = (event.clientX - canvas.getBoundingClientRect().left - plot.left) / (plot.right - plot.left);
    show(Math.round(fraction * (model.dates.length - 1)));
  }
  function keydown(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    show(event.key === 'Home' ? 0 : event.key === 'End' ? model.dates.length - 1
      : selected === null ? 0 : selected + (event.key === 'ArrowRight' ? 1 : -1));
  }
  function leave() {
    selected = null;
    tooltip.hidden = true;
    draw();
  }

  const observer = new ResizeObserver(draw);
  observer.observe(canvas);
  const handlers = { pointermove: move, pointerleave: leave, keydown, blur: leave };
  for (const [event, handler] of Object.entries(handlers)) canvas.addEventListener(event, handler);
  draw();
  return () => {
    observer.disconnect();
    for (const [event, handler] of Object.entries(handlers)) canvas.removeEventListener(event, handler);
  };
}
