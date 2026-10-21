// UI + persistence only. All data-structure logic is the Python in the editor (js/templates.js).
let pyodideInstance = null;
let savedCode = JSON.parse(localStorage.getItem("savedDSACode")) || {};
let unlocked = JSON.parse(localStorage.getItem("unlockedTopics")) || [];
const $ = (id) => document.getElementById(id);
const FEATURE = { 1: "resources", 2: "stack", 3: "queue", 4: "grid", 5: "tree", 6: "traversal", 7: "bst" };
const VERSION = "0.7.0";
if (localStorage.getItem("templateVersion") !== VERSION) { // templates changed in this version
  delete savedCode[2]; delete savedCode[4]; delete savedCode[7]; // topics 2 and 4 got BST hooks, topic 7 is new
  unlocked = unlocked.filter((k) => k !== 7);
  localStorage.setItem("savedDSACode", JSON.stringify(savedCode)); localStorage.setItem("unlockedTopics", JSON.stringify(unlocked)); localStorage.setItem("templateVersion", VERSION);
}
const CAT_COLOR = { Garden: "#16a34a", Vegetable: "#dc2626", Herb: "#65a30d", Flower: "#ca8a04", Grain: "#d97706" };
let treeData = null, bstData = null, anim = null, animB = null;
const BARS = [["water", "Water Reserves", 200, "L", "from-blue-500 to-cyan-400", "text-blue-300"],
  ["seeds", "Seed Inventory", 100, "", "from-emerald-500 to-lime-400", "text-emerald-300"],
  ["energy", "Solar Energy", 120, "Wh", "from-amber-500 to-yellow-300", "text-amber-300"],
  ["hope", "Community Hope", 100, "", "from-rose-500 to-pink-400", "text-rose-300"]];

async function initPyodide() {
  if (pyodideInstance) return;
  pyodideInstance = await loadPyodide();
  pyodideInstance.setStdout({ batched: (t) => { $("output-console").innerHTML += t + "<br>"; } });
  const bridge = { unlockFeature, updateResources, addPlantsToDropdown, setStack, setQueue, setGrid, setTree, setBST, setDay, setScore };
  for (const [k, f] of Object.entries(bridge)) pyodideInstance.globals.set(k, f);
}
function unlockFeature(f) {
  const id = { resources: "resources-section", stack: "stack-panel", queue: "climate-queue-panel", grid: "view-game", tree: "tree-panel", traversal: "trav-controls", bst: "bst-panel" }[f];
  $(id).classList.remove("locked"); $(id).classList.add("unlocked");
}
function updateResources(json) {
  const r = JSON.parse(json);
  $("res-bars").innerHTML = BARS.map(([k, label, max, unit, grad, txt]) => `
    <div><div class="flex justify-between text-xs font-semibold"><span class="${txt}">${label}</span><span>${r[k]} / ${max} ${unit}</span></div>
    <div class="bar"><div class="bg-gradient-to-r ${grad}" style="width:${(r[k] / max) * 100}%"></div></div></div>`).join("")
    + `<div class="flex justify-between text-xs font-semibold text-yellow-200"><span>Coins / Dues</span><span>${r.coins} Coins</span></div>`;
}
function addPlantsToDropdown(json) {
  $("crop-selector").innerHTML = JSON.parse(json).map(([n, e, c]) => `<option value="${n}">${e} ${n} (${c}c)</option>`).join("");
}
function setStack(json) {
  const items = JSON.parse(json).reverse();
  $("action-stack").innerHTML = items.map((a, i) => `<div class="item">${i === 0 ? "TOP → " : "→ "}${a.label}</div>`).join("") || "<i class='text-emerald-300/60'>Stack is empty</i>";
}
function setQueue(json) {
  $("climate-queue").innerHTML = JSON.parse(json).map((e, i) => `<div class="item"><b class="text-amber-400">${e}</b><div class="text-emerald-300/80">${i === 0 ? "Next out (front)" : "Waiting #" + (i + 1)}</div></div>`).join("");
}
function setGrid(json) {
  const cells = JSON.parse(json), grid = $("garden-grid");
  grid.innerHTML = "";
  cells.forEach((row, r) => row.forEach((p, c) => {
    const b = document.createElement("button");
    b.className = "tile" + (p && p.ripe ? " ripe" : "");
    b.textContent = p ? p.e : "⬜"; b.title = `grid[${r}][${c}]`;
    b.onclick = () => callPy(p ? `harvest_at(${r},${c})` : `plant_at(${r},${c},${JSON.stringify($("crop-selector").value)})`);
    grid.appendChild(b);
  }));
}
function setTree(json) {
  treeData = JSON.parse(json); clearInterval(anim);
  $("t-size").textContent = treeData.size; $("t-height").textContent = treeData.height;
  $("tree-title").textContent = treeData.expected ? "(Lesson example A–F)" : "(Garden)";
  $("t-out").textContent = ""; $("t-check").textContent = "";
  drawTree();
}
function drawBinary(svgId, root, height, visited = []) {   // draws ANY binary tree as circles and lines
  const el = $(svgId);
  if (!root) { el.setAttribute("width", 420); el.setAttribute("height", 60);
    el.innerHTML = `<text x="20" y="35" fill="#6ee7b7" font-size="13">Empty tree. Plant something (or use the Demo tree).</text>`; return; }
  const pos = {}; let i = 0;
  (function lay(n, d) { if (!n) return; lay(n.left, d + 1); pos[n.id] = { x: i++, y: d, n, p: null }; lay(n.right, d + 1); })(root, 0);
  (function link(n) { if (!n) return; for (const c of [n.left, n.right]) if (c) { pos[c.id].p = n; link(c); } })(root);
  const GX = 46, GY = 62, R = 18, W = Math.max(i * GX + 20, 320), H = (height + 1) * GY + 20;
  const px = (id) => 20 + pos[id].x * GX, py = (id) => 24 + pos[id].y * GY;
  let svg = "";
  for (const id in pos) if (pos[id].p) svg += `<line x1="${px(pos[id].p.id)}" y1="${py(pos[id].p.id)}" x2="${px(id)}" y2="${py(id)}" stroke="#6ee7b7" stroke-opacity=".5" stroke-width="3"/>`;
  for (const id in pos) {
    const n = pos[id].n, k = visited.indexOf(+id), cur = k === visited.length - 1 && k >= 0;
    const fill = k < 0 ? (CAT_COLOR[n.cat] || "#3b82f6") : cur ? "#facc15" : "#38bdf8";
    svg += `<g><title>${n.name} · depth ${pos[id].y}</title><circle cx="${px(id)}" cy="${py(id)}" r="${R}" fill="${fill}" stroke="#fff" stroke-width="${cur ? 3 : 1.5}"/>
      <text x="${px(id)}" y="${py(id) + 5}" text-anchor="middle" font-size="15" font-weight="700" fill="#0b1220">${n.label}</text>
      ${k >= 0 ? `<text x="${px(id) + R - 2}" y="${py(id) - R + 2}" font-size="11" font-weight="700" fill="#fde68a">${k + 1}</text>` : ""}</g>`;
  }
  el.setAttribute("width", W); el.setAttribute("height", H); el.innerHTML = svg;
}
function drawTree(visited = []) { drawBinary("tree-svg", treeData.root, treeData.height, visited); }
function runTraversal(kind) {
  const seq = treeData && treeData.orders[kind]; if (!seq) return showToast("Run topics 5 and 6 first.");
  clearInterval(anim); let k = 0; $("t-check").textContent = "";
  anim = setInterval(() => {
    k++; drawTree(seq.slice(0, k).map((s) => s[0]));
    $("t-out").textContent = kind.toUpperCase() + ": " + seq.slice(0, k).map((s) => s[1]).join(" → ");
    if (k >= seq.length) {
      clearInterval(anim);
      if (treeData.expected) { const ok = seq.map((s) => s[1]).join(" ") === treeData.expected[kind];
        $("t-check").innerHTML = ok ? `<span class="text-emerald-300">✔ Matches lesson: ${treeData.expected[kind]}</span>` : `<span class="text-red-400">✘ Expected ${treeData.expected[kind]}</span>`; }
    }
  }, 500);
}
function setBST(json) {
  bstData = JSON.parse(json); clearInterval(animB);
  $("b-size").textContent = bstData.size; $("b-height").textContent = Math.max(0, bstData.height);
  $("bst-title").textContent = bstData.which === "garden" ? "(Garden tree: key = row×5 + col)" : "(Demo tree: practice insert / delete)";
  $("b-out").textContent = bstData.msg || ""; $("b-check").textContent = "";
  drawBinary("bst-svg", bstData.root, bstData.height, []);
  if (bstData.path.length) animateSeq(bstData.path, () => {});   // show the search path step by step
}
function animateSeq(ids, done) {                                 // light up nodes one by one
  clearInterval(animB); let k = 0;
  animB = setInterval(() => {
    k++; drawBinary("bst-svg", bstData.root, bstData.height, ids.slice(0, k));
    if (k >= ids.length) { clearInterval(animB); done(); }
  }, 500);
}
function bstOp(op) {
  const v = parseInt($("bst-key").value);
  if (isNaN(v) || v < 0 || v > 99) return showToast("Type a number from 0 to 99.");
  callPy(`bst_op("${op}", ${v})`);
}
function showBST(which) { callPy(`show_bst("${which}")`); }
function runBST(kind) {
  const seq = bstData && bstData.orders[kind]; if (!seq) return showToast("Run topic 7 first.");
  if (!seq.length) return showToast("The tree is empty.");
  $("b-check").textContent = "";
  animateSeq(seq.map((s) => s[0]), () => {
    const keys = seq.map((s) => +s[1]);
    if (kind === "inorder") $("b-check").innerHTML = keys.every((x, i) => i === 0 || keys[i - 1] < x)
      ? `<span class="text-emerald-300">✔ Inorder gives the keys in ascending (sorted) order. That is the BST property.</span>` : `<span class="text-red-400">✘ Not sorted</span>`;
  });
  let k = 0; const t = setInterval(() => { k++; $("b-out").textContent = kind.toUpperCase() + ": " + seq.slice(0, k).map((s) => s[1]).join(" → "); if (k >= seq.length) clearInterval(t); }, 500);
}
function setDay(n) { $("day-counter").textContent = n; }
function setScore(n) { $("stewardship-counter").textContent = n + "%"; }
function showToast(msg) {
  const t = document.createElement("div");
  t.className = "fixed bottom-6 right-6 bg-emerald-900 border border-emerald-400 text-white px-5 py-3 rounded-2xl shadow-2xl z-50 text-sm";
  t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2500);
}
function callPy(code) {
  try { const msg = pyodideInstance.runPython(code); if (msg) showToast(msg); }
  catch (e) { showToast("Run topics 1–7 in the Code Editor first."); console.error(e); }
}
function triggerUndo() { callPy("undo_last()"); }

async function runTopic(key, code) {
  await initPyodide();
  await pyodideInstance.runPythonAsync(code);
  if (!pyodideInstance.globals.has(topicTemplates[key].expect))
    throw new Error(`Your code must create "${topicTemplates[key].expect}".`);
  unlockFeature(FEATURE[key]);
  if (!unlocked.includes(key)) { unlocked.push(key); localStorage.setItem("unlockedTopics", JSON.stringify(unlocked)); }
}
async function runPythonCode() {
  const key = parseInt($("topic-selector").value), out = $("output-console");
  out.innerHTML = `<span class="text-amber-400">Running…</span><br>`;
  try { await runTopic(key, $("code-editor").value); out.innerHTML += `<span class="text-emerald-300">✔ Topic ${key} unlocked</span>`; }
  catch (e) { out.innerHTML += `<span class="text-red-400">Error: ${e.message}</span>`; }
}
async function runAll() {
  $("output-console").innerHTML = "";
  for (const k of Object.keys(topicTemplates)) {
    try { await runTopic(+k, savedCode[k] || topicTemplates[k].code); }
    catch (e) { $("output-console").innerHTML += `<span class="text-red-400">Topic ${k} error: ${e.message}</span>`; return; }
  }
  showToast("All topics running. Go play!"); switchTab("game");
}
function saveCode() { savedCode[$("topic-selector").value] = $("code-editor").value; localStorage.setItem("savedDSACode", JSON.stringify(savedCode)); }
function loadTopic() { const k = $("topic-selector").value; $("code-editor").value = savedCode[k] || topicTemplates[k].code; }
function resetTopic() { const k = $("topic-selector").value; delete savedCode[k]; localStorage.setItem("savedDSACode", JSON.stringify(savedCode)); loadTopic(); }
function switchTab(tab) {
  $("view-game").classList.toggle("hidden", tab !== "game");
  $("view-code").classList.toggle("hidden", tab !== "code");
  for (const t of ["game", "code"]) { $("tab-" + t).classList.toggle("bg-[#283623]", tab === t); $("tab-" + t).classList.toggle("text-emerald-100", tab === t); }
}
window.onload = async () => {
  Object.keys(topicTemplates).forEach((k) => { const o = document.createElement("option"); o.value = k; o.textContent = topicTemplates[k].title; $("topic-selector").appendChild(o); });
  lucide.createIcons(); loadTopic(); switchTab("game");
  $("status").textContent = "Loading Python…";
  await initPyodide();
  // restore unlocked features after refresh using the saved code
  for (const k of [...unlocked].sort()) { try { await runTopic(+k, savedCode[k] || topicTemplates[k].code); } catch (e) { console.error(e); } }
  $("status").textContent = "Python ready";
};
