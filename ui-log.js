var logManager = (function() {
  var approximationLog = [];
  var simulationTime = 0;
  var lastLogTimestamp = 0;
  var logInterval = 100;
  var colors = ['#ff8b22', '#6c81ff', '#4ccd7a'];

  function clear() {
    approximationLog = [];
    simulationTime = 0;
    lastLogTimestamp = 0;
    for (let i = 0; i < 3; i++) {
      const formulaEl = document.getElementById('formula-text-' + i);
      if (formulaEl) formulaEl.innerHTML = '';
    }
  }

  function fmt(n) {
    if (!Number.isFinite(n)) return "0";
    if (Math.abs(n) < 1e-9) return "0";
    if (Math.abs(n) >= 0.01 && Math.abs(n) < 10000) return parseFloat(n.toFixed(4)).toString();
    return n.toExponential(2);
  }

  function buildPolynomial(p, v, aHalf) {
    let s = fmt(p);
    let vStr = fmt(v);
    if (vStr !== "0") {
      let sign = vStr.startsWith("-") ? " - " : " + ";
      let val = vStr.replace("-", "");
      s += `${sign}${val}t`;
    }
    let aStr = fmt(aHalf);
    if (aStr !== "0") {
      let sign = aStr.startsWith("-") ? " - " : " + ";
      let val = aStr.replace("-", "");
      s += `${sign}${val}t<sup>2</sup>`;
    }
    return s;
  }

  function update(currentTime) {
    if (currentTime - lastLogTimestamp < logInterval) return;
    lastLogTimestamp = currentTime;

    const allAccs = physics.getAccelerations();
    if (!allAccs || allAccs.length === 0) return;

    var currentLogBlock = `Time: ${(simulationTime / 1000).toFixed(3)}s\n`;

    for (let i = 0; i < 3; i++) {
      const formulaEl = document.getElementById('formula-text-' + i);
      const idx = i * 4;

      const px = physics.state.u[idx];
      const py = physics.state.u[idx + 1];
      const vx = physics.state.u[idx + 2];
      const vy = physics.state.u[idx + 3];
      const axHalf = 0.5 * allAccs[i].ax;
      const ayHalf = 0.5 * allAccs[i].ay;

      const strX = buildPolynomial(px, vx, axHalf);
      const strY = buildPolynomial(py, vy, ayHalf);
      const bodyName = userInput.bodyNameFromIndex(i);

      const txtX = strX.replace(/<sup>2<\/sup>/g, "^2");
      const txtY = strY.replace(/<sup>2<\/sup>/g, "^2");
      currentLogBlock += `${bodyName}:\n  x ≈ ${txtX}\n  y ≈ ${txtY}\n`;

      if (formulaEl) {
        formulaEl.style.fontFamily = "Consolas, monospace";
        formulaEl.style.fontSize = "13px";
        formulaEl.style.lineHeight = "1.3";
        formulaEl.style.padding = "5px 10px";
        formulaEl.style.margin = "5px auto";
        formulaEl.style.whiteSpace = "normal";
        formulaEl.style.textAlign = "center";

        formulaEl.innerHTML =
          '<div style="font-weight:bold; margin:0 0 4px 0; color:' + colors[i] + '">' + bodyName + '</div>' +
          '<div style="margin:0;">x(Δt) ≈ ' + strX + '</div>' +
          '<div style="margin:0;">y(Δt) ≈ ' + strY + '</div>';
      }
    }

    approximationLog.push(currentLogBlock);
    simulationTime += logInterval;
  }

  function download() {
    if (approximationLog.length === 0) { alert("Лог пуст."); return; }
    const fileContent = approximationLog.join('\n' + '-'.repeat(40) + '\n\n');
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'approximation_log.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return { clear: clear, update: update, download: download };
})();
