const practicals = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
let pid = 2;
let currentFile = null;
let currentCode = "";
let previewUrl = null;

const $ = (s) => document.querySelector(s);
const toast = (msg) => {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove("show"), 2500);
};

const configs = {
  2:{ops:[["grayscale","Grayscale"],["rgb","RGB"],["bgr","BGR"],["binary","Binary"],["addition","Addition (two images)"],["subtraction","Subtraction (two images)"],["multiplication","Multiplication"],["and","Bitwise AND (two images)"],["or","Bitwise OR (two images)"],["not","Bitwise NOT"],["xor","Bitwise XOR (two images)"]]},
  3:{ops:[["translation","Translation"],["rotation","Rotation"],["scaling","Scaling"],["shear","Shearing X/Y"],["reflection","Reflection"],["crop","Cropping"]]},
  4:{ops:[["negative","Negative Image"],["brightness_contrast","Brightness & Contrast"],["sharpen","Custom Sharpening"],["laplacian","Laplacian Sharpening"],["histogram","Histogram Equalization"],["threshold","Thresholding"]]},
  5:{ops:[["average","Averaging Filter"],["gaussian","Gaussian Filter"],["median","Median Filter"],["bilateral","Bilateral Filter"]]},
  6:{ops:[["noise","Add Noise"],["gaussian_denoise","Gaussian Denoising"],["median_denoise","Median Denoising"],["nlm","Non-local Means"],["telea","Telea Inpainting"],["navier_stokes","Navier-Stokes Inpainting"]]},
  7:{ops:[["png","PNG Lossless"],["jpeg","JPEG Quality"],["rle","RLE Analysis"],["lzw","LZW Analysis"]]},
  8:{ops:[["erosion","Erosion"],["dilation","Dilation"],["opening","Opening"],["closing","Closing"],["hitmiss","Hit-or-Miss"],["gradient","Morphological Gradient"],["tophat","Top-Hat"],["blackhat","Black-Hat"],["skeleton","Skeletonization"],["pruning","Pruning"]]},
  9:{ops:[["correlation","Object Detection using Correlation"]]},
  10:{ops:[
    ["rgb","RGB"],["hsv","HSV"],["ycrcb","YCrCb"],["lab","Lab"],["grayscale","Grayscale"],
    ["rgb_r","RGB - Red Channel"],["rgb_g","RGB - Green Channel"],["rgb_b","RGB - Blue Channel"],
    ["hsv_h","HSV - Hue"],["hsv_s","HSV - Saturation"],["hsv_v","HSV - Value"],
    ["ycrcb_y","YCrCb - Y"],["ycrcb_cr","YCrCb - Cr"],["ycrcb_cb","YCrCb - Cb"],
    ["lab_l","Lab - L*"],["lab_a","Lab - a*"],["lab_b","Lab - b*"]
  ]},
  11:{ops:[["canny","Canny"],["sobel","Sobel"],["prewitt","Prewitt"]]}
};

function renderControls() {
  const c = $("#controls");
  if (!c) return;
  c.innerHTML = "";
  const ops = configs[pid].ops;
  c.insertAdjacentHTML("beforeend", `<div class="control"><label>Operation</label><select id="operation">${ops.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join("")}</select></div>`);
  $("#operation").addEventListener("change", extraControls);
  c.insertAdjacentHTML("beforeend", `<div class="sample-box"><label>Built-in Sample Images</label><div class="sample-grid">
    <button type="button" class="sample-btn" data-sample="color_sample.png">🎨 Color</button>
    <button type="button" class="sample-btn" data-sample="grayscale_sample.png">◐ Grayscale</button>
    <button type="button" class="sample-btn" data-sample="noisy_sample.png">✦ Noisy</button>
    <button type="button" class="sample-btn" data-sample="damaged_sample.png">▧ Damaged</button>
    <button type="button" class="sample-btn" data-sample="binary_sample.png">▦ Binary</button>
    <button type="button" class="sample-btn correlation-target-sample" data-sample="color_sample.png">◎ Correlation Target</button>
  </div></div>`);
  document.querySelectorAll(".sample-btn").forEach(b => b.addEventListener("click", () => useSample(b.dataset.sample)));
  extraControls();
}

function addControl(html) { $("#controls").insertAdjacentHTML("beforeend", `<div class="control extra">${html}</div>`); }

function extraControls() {
  document.querySelectorAll(".extra").forEach(e => e.remove());
  const op = $("#operation")?.value;
  if (!op) return;
  if (pid===2 && ["addition","subtraction","and","or","xor"].includes(op)) addControl(`<label>Second Image</label><input id="file2" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp">`);
  if (pid===2 && op==="binary") addControl(`<label>Threshold <span id="thresholdv">127</span></label><input id="threshold" type="range" min="0" max="255" value="127">`);
  if (pid===2 && op==="multiplication") addControl(`<label>Multiplier</label><input id="value" type="number" step=".1" value="1.5">`);
  if (pid===3) {
    if(op==="translation") addControl(`<label>X</label><input id="x" type="number" value="30"><label>Y</label><input id="y" type="number" value="30">`);
    if(op==="rotation") addControl(`<label>Angle <span id="anglev">30°</span></label><input id="angle" type="range" min="-180" max="180" value="30">`);
    if(op==="scaling") addControl(`<label>Scale <span id="scalev">100%</span></label><input id="scale" type="range" min="10" max="200" value="100">`);
    if(op==="shear") addControl(`<label>X Shear</label><input id="sx" type="number" step=".05" value=".1"><label>Y Shear</label><input id="sy" type="number" step=".05" value="0">`);
    if(op==="reflection") addControl(`<label>Direction</label><select id="direction"><option value="horizontal">Horizontal</option><option value="vertical">Vertical</option></select>`);
    if(op==="crop") addControl(`<label>X</label><input id="x" type="number" value="0"><label>Y</label><input id="y" type="number" value="0"><label>Width</label><input id="width" type="number" value="300"><label>Height</label><input id="height" type="number" value="300">`);
  }
  if(pid===4 && op==="brightness_contrast") addControl(`<label>Brightness</label><input id="brightness" type="range" min="-100" max="100" value="0"><label>Contrast</label><input id="contrast" type="range" min=".2" max="3" step=".1" value="1">`);
  if(pid===4 && op==="threshold") addControl(`<label>Threshold</label><input id="threshold" type="range" min="0" max="255" value="127"><label>Mode</label><select id="mode"><option value="binary">Binary</option><option value="binary_inverse">Binary Inverse</option><option value="truncate">Truncate</option><option value="to_zero">To Zero</option><option value="to_zero_inverse">To Zero Inverted</option></select>`);
  if(pid===5) {
    if(["average","gaussian","median"].includes(op)) addControl(`<label>Kernel</label><select id="kernel"><option>3</option><option selected>5</option><option>7</option></select>`);
    if(op==="gaussian") addControl(`<label>Sigma</label><input id="sigma" type="number" step=".1" value="0">`);
    if(op==="bilateral") addControl(`<label>Diameter</label><input id="diameter" type="number" value="9"><label>Sigma Color</label><input id="sigma_color" type="number" value="75"><label>Sigma Space</label><input id="sigma_space" type="number" value="75">`);
  }
  if(pid===6 && op==="noise") addControl(`<label>Noise Type</label><select id="noise_type"><option value="gaussian">Gaussian</option><option value="salt_pepper">Salt & Pepper</option></select><label>Amount</label><input id="amount" type="range" min="5" max="100" value="25">`);
  if(pid===6 && ["telea","navier_stokes"].includes(op)) addControl(`<label>Mask Image</label><input id="mask" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"><small>Use a black/white mask; white marks the damaged region.</small>`);
  if(pid===7 && op==="png") addControl(`<label>Compression Level <span id="levelv">6</span></label><input id="level" type="range" min="0" max="9" value="6">`);
  if(pid===7 && op==="jpeg") addControl(`<label>JPEG Quality <span id="qualityv">90</span></label><input id="quality" type="range" min="0" max="100" value="90">`);
  if(pid===11 && op==="canny") addControl(`<label>Lower Threshold <span id="lowerv">50</span></label><input id="lower" type="range" min="0" max="255" value="50"><label>Upper Threshold <span id="upperv">150</span></label><input id="upper" type="range" min="0" max="255" value="150"><label>Aperture</label><select id="aperture"><option selected>3</option><option>5</option><option>7</option></select><label>L2 Gradient</label><select id="l2"><option value="false" selected>False</option><option value="true">True</option></select>`);
  if(pid===11 && ["sobel"].includes(op)) addControl(`<label>Sobel Kernel</label><select id="kernel"><option selected>3</option><option>5</option><option>7</option></select>`);
  if(pid===9) {
    addControl(`<label>Template Image</label><input id="template" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp">
      <small>Upload a small image containing the object to detect.</small>
      <button type="button" class="ghost sample-template" style="margin-top:8px">Use Built-in Template</button>
      <label>Match Threshold <span id="match_thresholdv">0.80</span></label>
      <input id="match_threshold" type="range" min="0.50" max="1.00" step="0.01" value="0.80">`);
    const sb = $(".sample-template");
    sb?.addEventListener("click", async () => {
      try {
        const r = await fetch("/static/images/samples/template_sample.png", {cache:"no-store"});
        if (!r.ok) throw new Error();
        const b = await r.blob();
        const input = $("#template");
        const dt = new DataTransfer();
        dt.items.add(new File([b], "template_sample.png", {type:b.type || "image/png"}));
        input.files = dt.files;
        toast("Built-in template loaded.");
      } catch(e) { toast("Could not load built-in template."); }
    });
  }
  if(pid===8) addControl(`<label>Structuring Element</label><select id="shape"><option value="rectangle">Rectangle</option><option value="ellipse">Ellipse</option><option value="cross">Cross</option></select><label>Kernel Size</label><select id="kernel"><option>3</option><option selected>5</option><option>7</option></select>`);
  document.querySelectorAll('#controls input[type="range"]').forEach(r => r.addEventListener("input", () => {
    const v = $("#" + r.id + "v");
    if (v) v.textContent = r.value + (r.id === "angle" ? "°" : r.id === "scale" ? "%" : "");
  }));
}

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[ch])); }

function resetResult() {
  const result = $("#resultPreview");
  if (result) result.removeAttribute("src");
  const dl = $("#downloadBtn");
  if (dl) dl.classList.add("hidden");
  const metrics = $("#metrics");
  if (metrics) metrics.innerHTML = "";
}

function showFile(file, silent=false) {
  if (!file) { if(!silent) toast("Please select an image."); return false; }
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  const extOk = /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!allowed.includes(file.type) && !extOk) { toast("Unsupported format. Use JPG, JPEG, PNG or WEBP."); return false; }
  if (file.size > 12 * 1024 * 1024) { toast("Image is too large. Maximum size is 12 MB."); return false; }
  currentFile = file;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  const img = $("#originalPreview");
  if (img) { img.src = previewUrl; img.alt = file.name; }
  const meta = $("#fileMeta");
  if (meta) {
    meta.classList.remove("hidden");
    meta.textContent = "Loading image details…";
    const probe = new Image();
    probe.onload = () => {
      const sizeKB = file.size / 1024;
      const sizeText = sizeKB < 1024 ? `${sizeKB.toFixed(1)} KB` : `${(sizeKB/1024).toFixed(2)} MB`;
      meta.innerHTML = `<b>${escapeHtml(file.name)}</b><br>${probe.naturalWidth} × ${probe.naturalHeight}px · ${sizeText}`;
    };
    probe.onerror = () => meta.textContent = file.name;
    probe.src = previewUrl;
  }
  resetResult();
  return true;
}

async function useSample(filename) {
  try {
    const r = await fetch(`/static/images/samples/${encodeURIComponent(filename)}`, {cache:"no-store"});
    if (!r.ok) throw new Error("Sample image not found");
    const blob = await r.blob();
    const file = new File([blob], filename, {type: blob.type || "image/png"});
    if (showFile(file, true)) toast(`Loaded sample: ${filename.replace("_sample.png", "").replace(".png", "")}`);
  } catch(e) { console.error(e); toast("Could not load sample image."); }
}

// ---------------- IMAGE UPLOADER ----------------
const fileInput = $("#fileInput");
const dropzone = $("#dropzone");
const browseBtn = $("#browseBtn");

if (browseBtn && fileInput) browseBtn.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); fileInput.click(); });
if (fileInput) fileInput.addEventListener("change", e => { const f=e.target.files?.[0]; if(f) showFile(f); });
if (dropzone) {
  dropzone.addEventListener("click", e => { if(e.target !== browseBtn && e.target !== fileInput) fileInput?.click(); });
  dropzone.addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); fileInput?.click(); } });
  ["dragenter","dragover"].forEach(type => dropzone.addEventListener(type, e => { e.preventDefault(); e.stopPropagation(); dropzone.classList.add("drag-active"); }));
  ["dragleave","dragend"].forEach(type => dropzone.addEventListener(type, e => { e.preventDefault(); e.stopPropagation(); dropzone.classList.remove("drag-active"); }));
  dropzone.addEventListener("drop", e => { e.preventDefault(); e.stopPropagation(); dropzone.classList.remove("drag-active"); const f=e.dataTransfer?.files?.[0]; if(f) showFile(f); else toast("Please drop an image file here."); });
}

// ---------------- PROCESSING ----------------
$("#applyBtn")?.addEventListener("click", async () => {
  const btn = $("#applyBtn");
  if (!currentFile) { toast("Please upload an image first."); return; }
  btn.disabled = true; btn.textContent = "Processing…";
  try {
    const op = $("#operation")?.value;
    if (!op) throw new Error("Please select an operation.");
    const fd = new FormData();
    fd.append("image", currentFile, currentFile.name);
    fd.append("practical", String(pid));
    fd.append("operation", op);
    document.querySelectorAll("#controls input, #controls select").forEach(el => { if(el.type !== "file" && el.id !== "operation") fd.append(el.id, el.value); });
    const f2 = $("#file2"); if(f2?.files?.[0]) fd.append("image2", f2.files[0], f2.files[0].name);
    const templateInput = $("#template"); if(templateInput?.files?.[0]) fd.append("template", templateInput.files[0], templateInput.files[0].name);
    const mask = $("#mask");
    if(mask?.files?.[0]) fd.append("mask", mask.files[0], mask.files[0].name);
    else if(pid===6 && ["telea","navier_stokes"].includes(op) && currentFile.name === "damaged_sample.png") {
      const mr = await fetch("/static/images/samples/damaged_mask.png", {cache:"no-store"});
      if(!mr.ok) throw new Error("Could not load the built-in damaged mask.");
      const mb = await mr.blob();
      fd.append("mask", new File([mb], "damaged_mask.png", {type:mb.type || "image/png"}));
    }
    const r = await fetch("/api/process", {method:"POST", body:fd});
    const d = await r.json().catch(() => ({success:false,error:"Server returned an invalid response."}));
    if(!r.ok || !d.success) throw new Error(d.error || "Processing failed.");
    $("#resultPreview").src = d.url + "?t=" + Date.now();
    $("#downloadBtn").classList.remove("hidden");
    $("#downloadBtn").onclick = () => { const a=document.createElement("a"); a.href=d.url; a.download=d.filename || "processed_image.png"; document.body.appendChild(a); a.click(); a.remove(); };
    let m = "";
    if(d.metrics) m = Object.entries(d.metrics).map(([k,v]) => `<div class="metric"><b>${typeof v === "number" ? v.toFixed(2) : v}</b>${k.replaceAll("_"," ")}</div>`).join("");
    if(d.meta) {
      m += Object.entries(d.meta).map(([k,v]) => {
        const label = k.replaceAll("_", " ");
        const value = typeof v === "boolean" ? (v ? "Yes" : "No") : typeof v === "number" ? (k === "best_score" || k === "threshold" ? v.toFixed(2) : v) : v;
        return `<div class="metric"><b>${escapeHtml(value)}</b>${escapeHtml(label)}</div>`;
      }).join("");
    }
    $("#metrics").innerHTML = m;
    toast("Operation completed successfully.");
  } catch(e) { console.error(e); toast(e.message || "Processing failed."); }
  finally { btn.disabled=false; btn.textContent="Apply Operation"; }
});

$("#resetBtn")?.addEventListener("click", () => {
  currentFile=null;
  if(previewUrl){ URL.revokeObjectURL(previewUrl); previewUrl=null; }
  if(fileInput) fileInput.value="";
  $("#originalPreview")?.removeAttribute("src");
  $("#fileMeta")?.classList.add("hidden");
  $("#fileMeta").textContent="";
  resetResult();
  loadInfo();
});

$("#prevBtn")?.addEventListener("click", () => { const i=practicals.indexOf(pid); pid=practicals[(i+practicals.length-1)%practicals.length]; syncNav(); loadInfo(); });
$("#nextBtn")?.addEventListener("click", () => { const i=practicals.indexOf(pid); pid=practicals[(i+1)%practicals.length]; syncNav(); loadInfo(); });
document.querySelectorAll(".topic-card[data-topic-pid]").forEach(b=>b.addEventListener("click",()=>{pid=+b.dataset.topicPid;syncNav();$("#lab")?.scrollIntoView({behavior:"smooth"});loadInfo();}));
document.querySelectorAll(".nav-item[data-pid]").forEach(b=>b.addEventListener("click",()=>{pid=+b.dataset.pid;syncNav();$("#lab")?.scrollIntoView({behavior:"smooth"});loadInfo();}));
$("#startBtn")?.addEventListener("click",()=>$("#lab")?.scrollIntoView({behavior:"smooth"}));
$("#menuBtn")?.addEventListener("click",()=>$("#sidebar")?.classList.toggle("open"));
$("#themeBtn")?.addEventListener("click",()=>document.body.classList.toggle("dark"));

async function loadCode() {
  const op=$("#operation")?.value;
  if(!op) throw new Error("Please select an operation.");
  const r=await fetch(`/api/code/${pid}/${encodeURIComponent(op)}`);
  const d=await r.json();
  if(!r.ok || !d.code) throw new Error(d.error || "Could not load Python code.");
  currentCode=d.code;
  $("#codeBox").textContent=currentCode;
  $("#codeModal").classList.remove("hidden");
}

$("#codeBtn")?.addEventListener("click",async()=>{try{await loadCode();}catch(e){console.error(e);toast(e.message);}});
$("#closeModal")?.addEventListener("click",()=>$("#codeModal")?.classList.add("hidden"));
$("#copyBtn")?.addEventListener("click",async()=>{
  try {
    if(!currentCode) { const op=$("#operation")?.value; const r=await fetch(`/api/code/${pid}/${encodeURIComponent(op)}`); const d=await r.json(); if(!r.ok) throw new Error(d.error||"Could not load code."); currentCode=d.code; }
    if(navigator.clipboard?.writeText) await navigator.clipboard.writeText(currentCode);
    else { const ta=document.createElement("textarea"); ta.value=currentCode; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); }
    toast("Python code copied.");
  } catch(e) { console.error(e); toast(e.message || "Could not copy code."); }
});

$("#saveStudent")?.addEventListener("click",()=>{["studentName","rollNo","semester","session","department","college"].forEach(id=>localStorage.setItem(id,$("#"+id).value));toast("Student information saved locally.");});
["studentName","rollNo","semester","session","department","college"].forEach(id=>{const v=localStorage.getItem(id);if(v && $("#"+id)) $("#"+id).value=v;});

function syncNav(){
  document.querySelectorAll(".nav-item[data-pid]").forEach(x=>x.classList.toggle("active",+x.dataset.pid===pid));
}

async function loadInfo(){
  try {
    renderControls();
    const r=await fetch(`/api/info/${pid}`);
    const d=await r.json();
    if(!r.ok) throw new Error(d.error||"Could not load practical information.");
    $("#pLabel").textContent=`PRACTICAL ${String(pid).padStart(2,"0")} / ${String(practicals.length+1).padStart(2,"0")}`;
    $("#pTitle").textContent=d.title||"";
    $("#pShort").textContent=d.short||"";
    $("#aim").textContent=d.aim||"";
    $("#objectives").innerHTML=(d.objectives||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
    $("#theory").textContent=d.theory||"";
    $("#conclusion").textContent=d.conclusion||"";
    const steps=(d.algorithm||[]).length ? d.algorithm : ["Upload or select an image.","Choose the required operation and parameters.","Click Apply Operation.","Observe and compare the result.","Download the processed result if required."];
    $("#algorithm").innerHTML=steps.map(x=>`<li>${escapeHtml(x)}</li>`).join("");
    $("#viva").innerHTML=(d.viva||[]).map(x=>`<details><summary>${escapeHtml(x[0])}</summary><p>${escapeHtml(x[1])}</p></details>`).join("");
    const idx=practicals.indexOf(pid); $("#progressBar").style.width=`${((idx+1)/practicals.length)*100}%`;
  } catch(e) { console.error(e); toast(e.message || "Could not load practical."); }
}

loadInfo();
