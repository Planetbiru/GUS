"use strict";

/* ---------- Konstanta ---------- */
const MAGIC = "GF1PATCH110", GRAVIS_ID = "ID#000002";
const M16=0x01, MUNS=0x02, MLOOP=0x04, MPING=0x08, MREV=0x10, MSUS=0x20, MENV=0x40, MCLAMP=0x80;
const MODE_LABELS=[[M16,"mode_16_bit"],[MUNS,"mode_unsigned"],[MLOOP,"mode_loop"],[MPING,"mode_ping_pong"],[MREV,"mode_reverse"],[MSUS,"mode_sustain"],[MENV,"mode_envelope"],[MCLAMP,"mode_clamped_release"]];
const $ = id => document.getElementById(id);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const midiToFreq = n => 440 * Math.pow(2, (n-69)/12);

/* ---------- Localization ---------- */
let locale = "id";
try {
  locale = localStorage.getItem("gus-patch-editor-locale") || "id";
} catch (err) {
  console.warn("Unable to read saved language preference:", err);
}
let translations = {};
let localePacks = {};
let lastTranslation = null;
let currentStatusTranslation = null;
let currentMidiStatusTranslation = null;
let currentBank = 0; // ← TAMBAHKAN BARIS INI

function t(key, values = {}) {
  const template = translations[key];
  if (typeof template !== "string") {
    console.error(`Missing localization key: ${key}`);
    return `{{${key}}}`;
  }
  const text = template.replace(/\{([a-z_]+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match
  );
  lastTranslation = {key, values, text};
  return text;
}
function localizeElement(element) {
  if (element.dataset.i18nContent) {
    element.innerHTML = "";
    if (element.dataset.i18nBefore) element.appendChild(document.createTextNode(element.dataset.i18nBefore));
    const content = document.createElement("template");
    content.innerHTML = t(element.dataset.i18nContent);
    element.appendChild(content.content);
    if (element.dataset.i18nAfter) element.appendChild(document.createTextNode(element.dataset.i18nAfter));
  }
  for (const [attribute, key] of Object.entries({
    title: element.dataset.i18nTitle,
    placeholder: element.dataset.i18nPlaceholder,
    "aria-label": element.dataset.i18nAriaLabel
  })) {
    if (key) element.setAttribute(attribute, t(key));
  }
}
function applyLocalization() {
  document.documentElement.lang = locale;
  document.title = t("app_title");
  const languageSelect = $("languageSelect");
  languageSelect.value = locale;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) textNodes.push(node);
  for (node of textNodes) {
    const match = node.nodeValue.match(/^([\s\S]*?)\{\{([a-z0-9_]+)\}\}([\s\S]*)$/);
    if (!match || node.parentElement.closest("[data-i18n-content]")) continue;
    if (node.parentElement.tagName === "OPTION") {
      const option = node.parentElement;
      option.dataset.i18nContent = match[2];
      option.dataset.i18nBefore = match[1];
      option.dataset.i18nAfter = match[3];
      localizeElement(option);
    } else {
      const wrapper = document.createElement("span");
      wrapper.dataset.i18nContent = match[2];
      wrapper.dataset.i18nBefore = match[1];
      wrapper.dataset.i18nAfter = match[3];
      node.parentNode.replaceChild(wrapper, node);
      localizeElement(wrapper);
    }
  }
  document.querySelectorAll("[title], [placeholder], [aria-label]").forEach(element => {
    for (const attribute of ["title", "placeholder", "aria-label"]) {
      const match = element.getAttribute(attribute)?.match(/^\{\{([a-z0-9_]+)\}\}$/);
      if (!match) continue;
      const dataAttribute = `i18n${attribute[0].toUpperCase()}${attribute.slice(1).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}`;
      element.dataset[dataAttribute] = match[1];
    }
    localizeElement(element);
  });
}
async function initLocalization() {
  if (locale !== "id" && locale !== "en") locale = "id";
  const [idResponse, enResponse] = await Promise.all([
    fetch("assets/locales/id.json"),
    fetch("assets/locales/en.json")
  ]);
  if (!idResponse.ok || !enResponse.ok) {
    throw new Error(`Failed to load locale files (id: ${idResponse.status}, en: ${enResponse.status})`);
  }
  [localePacks.id, localePacks.en] = await Promise.all([idResponse.json(), enResponse.json()]);
  translations = localePacks[locale];
  applyLocalization();
  $("languageSelect").addEventListener("change", event => {
    setLanguage(event.target.value);
  });
}
function setLanguage(nextLocale) {
  if (!localePacks[nextLocale] || nextLocale === locale) return;
  const previousLocale = locale;
  const defaultProjectName = t("create_project_default", {number: state.projects.length + 1});
  const defaultDemoProjectName = t("demo_project_name");
  locale = nextLocale;
  translations = localePacks[locale];

  for (const proj of state.projects) {
    if (proj.locale) {
      proj.name = t("recovered_library_project");
    }
  }

  let preferenceSaved = true;
  try {
    localStorage.setItem("gus-patch-editor-locale", locale);
  } catch (err) {
    console.error("Unable to save language preference:", err);
    preferenceSaved = false;
  }
  applyLocalization();
  document.querySelectorAll("[data-i18n-content], [data-i18n-title], [data-i18n-placeholder], [data-i18n-aria-label]")
    .forEach(localizeElement);
  if ($("newProjectDialog") && !$("newProjectDialog").hidden && $("newProjectName").value === defaultProjectName) {
    $("newProjectName").value = t("create_project_default", {number: state.projects.length + 1});
  }
  if ($("demoProjectDialog") && !$("demoProjectDialog").hidden && $("demoProjectName").value === defaultDemoProjectName) {
    $("demoProjectName").value = t("demo_project_name");
  }
  render(false);
  $("btnMidi").textContent = t(state.midi.enabled ? "disable" : "enable");
  $("btnPlayMidi").innerHTML = `<svg class="icon"><use href="#i-play"></use></svg> ${t("play")}`;
  $("btnPauseMidi").innerHTML = `<svg class="icon"><use href="#i-pause"></use></svg> ${t("pause")}`;
  if (currentStatusTranslation) {
    showStatus(t(currentStatusTranslation.key, currentStatusTranslation.values), currentStatusTranslation.kind);
  }
  if (currentMidiStatusTranslation) {
    $("midiStatus").textContent = t(currentMidiStatusTranslation.key, currentMidiStatusTranslation.values);
  }
  if (pendingProjectDeletionId) {
    const project = state.projects.find(entry => entry.id === pendingProjectDeletionId);
    if (project) $("deleteProjectMessage").textContent = t("confirm_delete_project", {name: project.name});
  }
  if (activeAlert) {
    $("alertTitle").textContent = t("alert_title");
    $("alertMessage").textContent = t(activeAlert.key, activeAlert.values);
  }
  if (!preferenceSaved) {
    showStatus(t("language_preference_save_failed"), "bad");
  }
  if (previousLocale !== locale) $("languageSelect").value = locale;
}

/* ---------- State ---------- */
const state = {
  patch:null, selInst:0, selSample:null, selStart:0, selEnd:0,
  tool:'select', undo:[], drag:null,
  audio:{ctx:null, master:null, voices:new Set(), hold:null},
  midi:{access:null, input:null, enabled:false},
  keyNote:new Map(),
  zoom: 1, offset: 0, panning: null,
  patches: [],
  currentPatchId: null,
  projects: [],
  currentProjectId: null,
  libraryView: "project",
  libraryBankFilter: "all",
  midiData: null,
  midiFileName: null,
  saveTimer: null,
  db: null
};

let timidityPlayer = null;
let isMidiRendering = false;
let isDemoGenerating = false;
let pendingProjectDeletionId = null;
let pendingConfirmationAction = null;
let activeAlert = null;
const queuedAlerts = [];
let projectPatchGenerator = null;
let addSampleTarget = null;
let pendingSampleDraft = null;
let sampleRecording = null;
let sampleImportGeneration = 0;

/* ---------- Utilitas ---------- */
function decodeAscii(b){let s="";for(let i=0;i<b.length;i++){if(b[i]===0)break;s+=String.fromCharCode(b[i]);}return s.replace(/\s+$/,"");}
function encodeAscii(s,len){const o=new Uint8Array(len);s=String(s??"");for(let i=0;i<len;i++)o[i]=i<s.length?s.charCodeAt(i)&255:0;return o;}
function showStatus(m,k){
  const translated = lastTranslation && lastTranslation.text === m ? lastTranslation : null;
  currentStatusTranslation = translated ? {...translated, kind:k} : null;
  $("statusBar").textContent=m;
  $("statusBar").style.color=k==="bad"?"#f87171":k==="ok"?"#34d399":"";
}
function setMidiStatus(key, values = {}) {
  currentMidiStatusTranslation = {key, values};
  $("midiStatus").textContent = t(key, values);
}
function fmtBytes(n){return n<1024?n+" B":n<1048576?(n/1024).toFixed(1)+" KB":(n/1048576).toFixed(2)+" MB";}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function uid(prefix){return (prefix||"patch")+"-"+Date.now()+"-"+Math.random().toString(36).substr(2,8);}
// Fungsi sanitasi nama file yang konsisten
function sanitizeFilename(name) { return (name || "patch").replace(/[^\w\-]+/g, "_"); }

/* ---------- IndexedDB ---------- */
const DB_NAME="gus-patch-editor-2", DB_VER=2, STORE="patches", STORE_PROJECTS="projects";
function openDB(){
  if(state.db) return Promise.resolve(state.db);
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VER);
    req.onupgradeneeded=e=>{
      const db=e.target.result;
      if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE,{keyPath:"id"});
      if(!db.objectStoreNames.contains(STORE_PROJECTS)) db.createObjectStore(STORE_PROJECTS,{keyPath:"id"});
    };
    req.onsuccess=e=>{state.db=e.target.result; resolve(state.db);};
    req.onerror=e=>reject(e.target.error);
  });
}
async function dbPutMany(store, entries){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,"readwrite");
    const st=tx.objectStore(store);
    for(const entry of entries) st.put(entry);
    tx.oncomplete=()=>resolve();
    tx.onerror=e=>reject(e.target.error);
  });
}
async function dbGetAll(store){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,"readonly");
    const req=tx.objectStore(store).getAll();
    req.onsuccess=()=>resolve(req.result||[]);
    req.onerror=e=>reject(e.target.error);
  });
}
async function dbDeleteProjectAndPatches(projectId, patchIds){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction([STORE_PROJECTS,STORE],"readwrite");
    tx.objectStore(STORE_PROJECTS).delete(projectId);
    const patches=tx.objectStore(STORE);
    for(const id of patchIds) patches.delete(id);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error || new Error("Unable to delete project data."));
    tx.onabort=()=>reject(tx.error || new Error("Project deletion transaction was aborted."));
  });
}
async function dbDeletePatchAndUpdateProjects(patchId, projects){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction([STORE,STORE_PROJECTS],"readwrite");
    tx.objectStore(STORE).delete(patchId);
    const projectStore=tx.objectStore(STORE_PROJECTS);
    for(const project of projects) projectStore.put(project);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error || new Error("Unable to delete patch data."));
    tx.onabort=()=>reject(tx.error || new Error("Patch deletion transaction was aborted."));
  });
}
async function dbSaveProjectAndPatches(project, entries){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction([STORE_PROJECTS,STORE],"readwrite");
    tx.objectStore(STORE_PROJECTS).put(project);
    const patches=tx.objectStore(STORE);
    for(const entry of entries) patches.put(cleanEntryForStorage(entry));
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error || new Error("Unable to save project patches."));
    tx.onabort=()=>reject(tx.error || new Error("Saving project patches was aborted."));
  });
}
async function dbClearLibraryAndProjects(projects){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction([STORE,STORE_PROJECTS],"readwrite");
    tx.objectStore(STORE).clear();
    const projectStore=tx.objectStore(STORE_PROJECTS);
    for(const project of projects) projectStore.put(project);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error || new Error("Unable to clear library data."));
    tx.onabort=()=>reject(tx.error || new Error("Clearing library data was aborted."));
  });
}

function cleanSampleForStorage(s){
  return {
    name: s.name||"", fractions: s.fractions||0, dataSize: s.dataSize||0,
    loopStart: s.loopStart||0, loopEnd: s.loopEnd||0, sampleRate: s.sampleRate||0,
    lowFreq: s.lowFreq||0, highFreq: s.highFreq||0, rootFreq: s.rootFreq||0,
    tune: s.tune||0, balance: s.balance??7,
    envRates: s.envRates?[...s.envRates]:[0,0,0,0,0,0],
    envOffsets: s.envOffsets?[...s.envOffsets]:[0,0,0,0,0,0],
    tremoloSweep: s.tremoloSweep||0, tremoloRate: s.tremoloRate||0, tremoloDepth: s.tremoloDepth||0,
    vibratoSweep: s.vibratoSweep||0, vibratoRate: s.vibratoRate||0, vibratoDepth: s.vibratoDepth||0,
    modes: s.modes||0, scaleFreq: s.scaleFreq||60, scaleFactor: s.scaleFactor||1024,
    reserved: s.reserved?new Uint8Array(s.reserved):new Uint8Array(36),
    pcm: new Uint8Array(s.pcm||[])
  };
}
function cleanPatchForStorage(p){
  return {
    header:{
      magic: p.header.magic||MAGIC, gravisId: p.header.gravisId||GRAVIS_ID,
      description: p.header.description||"", voices: p.header.voices??14,
      channels: p.header.channels??0, waveForms: p.header.waveForms??0,
      masterVolume: p.header.masterVolume??127, dataSize: p.header.dataSize??0,
      reserved: p.header.reserved?new Uint8Array(p.header.reserved):new Uint8Array(36)
    },
    instruments:(p.instruments||[]).map(inst=>({
      instrument: inst.instrument||0, name: inst.name||"", size: inst.size||0,
      reserved: inst.reserved?new Uint8Array(inst.reserved):new Uint8Array(40),
      layers:(inst.layers||[]).map(layer=>({
        duplicate: layer.duplicate||0, layer: layer.layer||0, layerSize: layer.layerSize||0,
        reserved: layer.reserved?new Uint8Array(layer.reserved):new Uint8Array(40),
        samples:(layer.samples||[]).map(cleanSampleForStorage)
      }))
    }))
  };
}
function cleanEntryForStorage(entry){
  return { 
    id: entry.id, 
    name: entry.name, 
    source: entry.source||"pat", 
    gmProgram: entry.gmProgram ?? -1,
    gmBank: entry.gmBank ?? 0,
    drumSet: entry.drumSet ?? (entry.gmBank === 128 ? 0 : undefined),
    originalOrder: entry.originalOrder ?? 0,
    userOrder: entry.userOrder ?? 0,
    targetBank: entry.targetBank ?? 0,
    exportSelected: entry.exportSelected !== false,
    patch: cleanPatchForStorage(entry.patch) 
  };
}

/* ---------- Parse PAT ---------- */
function parsePAT(ab){
  const bytes=new Uint8Array(ab), dv=new DataView(ab); let p=0;
  const u8=()=>{const v=dv.getUint8(p);p+=1;return v;};
  const u16=()=>{const v=dv.getUint16(p,true);p+=2;return v;};
  const u32=()=>{const v=dv.getUint32(p,true);p+=4;return v;};
  const rB=n=>{const v=bytes.slice(p,p+n);p+=n;return v;};
  const rS=n=>decodeAscii(rB(n));
  if(bytes.length<129)throw new Error(t("file_too_small"));
  const magic=rS(12); if(!magic.startsWith("GF1PATCH"))throw new Error(t("not_pat_file"));
  const gravisId=rS(10), description=rS(60);
  let ic=u8(); if(ic===0)ic=1;
  const voices=u8(), channels=u8(), waveForms=u16(), masterVolume=u16(), dataSize=u32();
  const reserved=rB(36);
  const instruments=[];
  for(let i=0;i<ic;i++){
    if(p+63>bytes.length)throw new Error(t("truncated_instrument_header"));
    const instrument=u16(), name=rS(16), size=u32();
    let lc=u8(); if(lc===0)lc=1;
    const rI=rB(40), layers=[];
    for(let j=0;j<lc;j++){
      if(p+47>bytes.length)throw new Error(t("truncated_layer_header"));
      const duplicate=u8(), layer=u8(), layerSize=u32(), sc=u8(), rL=rB(40);
      const samples=[];
      for(let k=0;k<sc;k++){
        if(p+96>bytes.length)throw new Error(t("truncated_sample_header"));
        const waveName=rS(7), fractions=u8(), ws=u32(), loopStart=u32(), loopEnd=u32();
        
        let srRaw = u16();
        const stdRates = [8000, 11025, 16000, 22050, 24000, 32000, 44100, 48000, 96000];
        if (!stdRates.includes(srRaw)) {
        // Heuristic: jika bukan rate standar, kemungkinan file lama (period ns)
        const converted = Math.round(1e9 / srRaw);
        if (stdRates.includes(converted) || (converted > 8000 && converted < 192000)) {
            srRaw = converted;
        }
        }
        const sampleRate = srRaw;



        const lowFreq=u32();
        const highFreq=u32();
        const rootFreq=u32();
        const tune=u16(), balance=u8();
        const envRates=Array.from(rB(6)), envOffsets=Array.from(rB(6));
        const tremoloSweep=u8(), tremoloRate=u8(), tremoloDepth=u8();
        const vibratoSweep=u8(), vibratoRate=u8(), vibratoDepth=u8();
        const modes=u8(), scaleFreq=u16(), scaleFactor=u16(), rS2=rB(36);
        if(ws>bytes.length-p)throw new Error(t("sample_data_exceeds_file"));
        const pcm=bytes.slice(p,p+ws);p+=ws;
        samples.push({name:waveName,fractions,dataSize:ws,loopStart,loopEnd,sampleRate,lowFreq,highFreq,rootFreq,tune,balance,envRates,envOffsets,tremoloSweep,tremoloRate,tremoloDepth,vibratoSweep,vibratoRate,vibratoDepth,modes,scaleFreq,scaleFactor,reserved:rS2,pcm,_float:null});
      }
      layers.push({duplicate,layer,layerSize,samples,reserved:rL});
    }
    instruments.push({instrument,name,size,layers,reserved:rI});
  }
  return {header:{magic,gravisId,description,voices,channels,waveForms,masterVolume,dataSize,reserved},instruments};
}

// TAMBAH helper di dekat sanitizeFilename
function hzToPeriod(hz){
  hz = clamp(hz|0, 1, 65535);
  return clamp(Math.round(1e9 / hz), 1, 65535);
}
function periodToHz(p){
  p = p|0;
  return p > 0 ? Math.round(1e9 / p) : 22050;
}

const TIMIDITY_TARGET_RATE = 22050;   // harus ≥ 15258 (jangan 11025)

function writeTimidityPatch(patch) {
  const norm = cleanPatchForStorage(patch);
  const inst = norm.instruments[0];
  if (!inst) throw new Error(t("empty_patch"));

  const samples = norm.instruments.flatMap(i =>
    i.layers.flatMap(l => l.samples)
  );
  if (samples.length === 0) throw new Error(t("no_samples"));
  if (samples.length > 255) {
    throw new Error(t("too_many_samples", {count: samples.length}));
  }

  // === RESAMPLE ke TARGET (fix pitch) ===
  for (const s of samples) {
    if (!s.sampleRate || s.sampleRate === TIMIDITY_TARGET_RATE) continue;
    const is16 = (s.modes & 0x01) !== 0;
    const ratio = TIMIDITY_TARGET_RATE / s.sampleRate;
    s.pcm = resamplePcmTo(s.pcm, s.sampleRate, TIMIDITY_TARGET_RATE, is16);
    s.dataSize  = s.pcm.length;
    s.loopStart = Math.round(s.loopStart * ratio);
    s.loopEnd   = Math.round(s.loopEnd   * ratio);
    s.sampleRate = TIMIDITY_TARGET_RATE;
    s._float = null;
  }
  // ======================================

  // === Opsional: kalau masih ada error pitch sistematis, kalibrasi manual ===
  // (mis. jika playback C4 kedengaran D4 → set PITCH_TUNING = 9/8 = 1.125)
  const PITCH_TUNING = 1.0;
  if (PITCH_TUNING !== 1.0) {
    for (const s of samples) {
      if (s.rootFreq > 0) s.rootFreq = Math.round(s.rootFreq * PITCH_TUNING);
    }
  }
  // ==========================================================================

  return writePAT({
    header: norm.header,
    instruments: [{
      instrument: 0,
      name: inst.name || "Inst",
      size: 0,
      reserved: new Uint8Array(40),
      layers: [{
        duplicate: 0, layer: 0, layerSize: 0,
        reserved: new Uint8Array(40),
        samples
      }]
    }]
  });
}

/* ---------- Write PAT ---------- */
function writePAT(patch){
  let totalData=0, totalSamples=0;
  for(const inst of patch.instruments){
    let iSize=63;
    for(const layer of inst.layers){
      let lSize=47;
      for(const s of layer.samples){s.dataSize=s.pcm.length;lSize+=96+s.pcm.length;totalSamples++;}
      layer.layerSize=lSize; iSize+=lSize;
    }
    inst.size=iSize; totalData+=iSize;
  }
  patch.header.dataSize=totalData; patch.header.waveForms=totalSamples;
  const buf=new ArrayBuffer(129+totalData), dv=new DataView(buf), bytes=new Uint8Array(buf);
  let p=0;
  const wS=(s,n)=>{bytes.set(encodeAscii(s,n),p);p+=n;};
  const w8=v=>{dv.setUint8(p,v&255);p+=1;};
  const w16=v=>{dv.setUint16(p,v&65535,true);p+=2;};
  const w32=v=>{dv.setUint32(p,v>>>0,true);p+=4;};
  const wB=(a,n)=>{if(a&&a.length)bytes.set(a.slice(0,n),p);p+=n;};
  wS(patch.header.magic||MAGIC,12); wS(patch.header.gravisId||GRAVIS_ID,10);
  wS(patch.header.description||"",60);
  w8(patch.instruments.length); w8(patch.header.voices??14); w8(patch.header.channels??0);
  w16(totalSamples); w16(patch.header.masterVolume??127); w32(totalData);
  wB(patch.header.reserved,36);
  for(const inst of patch.instruments){
    w16(inst.instrument); wS(inst.name,16); w32(inst.size); w8(inst.layers.length); wB(inst.reserved,40);
    for(const layer of inst.layers){
      w8(layer.duplicate); w8(layer.layer); w32(layer.layerSize); w8(layer.samples.length); wB(layer.reserved,40);
      for(const s of layer.samples){
        wS(s.name,7); w8(s.fractions); w32(s.pcm.length); w32(s.loopStart); w32(s.loopEnd);
        w16(clamp(s.sampleRate || 22050, 1, 65535));  
        w32(s.lowFreq); w32(s.highFreq); w32(s.rootFreq);
        w16(s.tune); w8(s.balance);
        for(let i=0;i<6;i++)w8(s.envRates[i]??0);
        for(let i=0;i<6;i++)w8(s.envOffsets[i]??0);
        w8(s.tremoloSweep);w8(s.tremoloRate);w8(s.tremoloDepth);
        w8(s.vibratoSweep);w8(s.vibratoRate);w8(s.vibratoDepth);
        w8(s.modes); w16(s.scaleFreq); w16(s.scaleFactor); wB(s.reserved,36);
        bytes.set(s.pcm,p);p+=s.pcm.length;
      }
    }
  }
  return bytes;
}

/* ---------- PCM <-> Float ---------- */
function fmt(s){return{is16:(s.modes&M16)!==0,unsigned:(s.modes&MUNS)!==0,bps:(s.modes&M16)?2:1};}
function pcmToFloat(s){
  const {is16,unsigned,bps}=fmt(s), n=Math.floor(s.pcm.length/bps), o=new Float32Array(n);
  if(is16){
    for(let i=0;i<n;i++){
      let v=s.pcm[i*2]|(s.pcm[i*2+1]<<8);
      if(unsigned)v-=32768; else if(v>=32768)v-=65536;
      o[i]=v/32768;
    }
  }else{
    for(let i=0;i<n;i++){
      let v=s.pcm[i];
      if(unsigned)v-=128; else if(v>=128)v-=256;
      o[i]=v/128;
    }
  }
  return o;
}
function floatToPcm(s,f){
  const {is16,unsigned}=fmt(s), n=f.length, b=new Uint8Array(n*(is16?2:1));
  if(is16){
    for(let i=0;i<n;i++){
      let v=clamp(f[i],-1,1), iv=Math.round(v*32767);
      if(unsigned)iv+=32768; else if(iv<0)iv+=65536;
      b[i*2]=iv&255; b[i*2+1]=(iv>>8)&255;
    }
  }else{
    for(let i=0;i<n;i++){
      let v=clamp(f[i],-1,1), iv=Math.round(v*127);
      if(unsigned)iv+=128; else if(iv<0)iv+=256;
      b[i]=iv&255;
    }
  }
  s.pcm=b; s.dataSize=b.length;
}
function ensureFloat(s){ if(!s._float)s._float=pcmToFloat(s); return s._float; }
function commitFloat(s){ if(s._float)floatToPcm(s,s._float); }

function loopInfo(s){
  const bps=fmt(s).bps, total=Math.floor(s.pcm.length/bps);
  const sf=(s.fractions&0x0f)/16, ef=((s.fractions>>4)&0x0f)/16;
  let a=(s.loopStart+sf)/bps, b=(s.loopEnd+ef)/bps;
  a=clamp(a,0,total); b=clamp(b,0,total);
  const enabled=(s.modes&MLOOP)!==0;
  if(b<=a+1)b=Math.min(total,a+1);
  return {enabled:enabled&&b>a+1, start:a, end:b, total};
}

/* ---------- WAV ---------- */
function encodeWav(s){
  const f=ensureFloat(s), sr=clamp(s.sampleRate||22050,1,192000), n=f.length;
  const dataBytes=n*2, loop=loopInfo(s), hasLoop=loop.enabled&&loop.end>loop.start;
  const smplSize=hasLoop?60:0, total=12+8+16+8+dataBytes+(hasLoop?8+smplSize:0);
  const buf=new ArrayBuffer(total), dv=new DataView(buf); let p=0;
  const wS=str=>{for(let i=0;i<str.length;i++)dv.setUint8(p+i,str.charCodeAt(i));p+=str.length;};
  const w32=v=>{dv.setUint32(p,v>>>0,true);p+=4;};
  const w16=v=>{dv.setUint16(p,v&65535,true);p+=2;};
  wS("RIFF");w32(total-8);wS("WAVE");wS("fmt ");w32(16);w16(1);w16(1);w32(sr);w32(sr*2);w16(2);w16(16);
  wS("data");w32(dataBytes);
  for(let i=0;i<n;i++){
    let v=clamp(f[i],-1,1), iv=Math.round(v*32767);
    if(iv<0)iv+=65536;
    dv.setUint16(p,iv,true); p+=2;
  }
  if(hasLoop){
    wS("smpl");w32(smplSize);w32(0);w32(0);w32(Math.round(1e9/sr));
    w32(60);w32(0);w32(0);w32(0);w32(1);w32(0);w32(0);w32(0);
    w32(Math.max(0,Math.round(loop.start)));w32(Math.max(0,Math.round(loop.end)));
    w32(0);w32(0);
  }
  return new Blob([buf],{type:"audio/wav"});
}

function decodeWav(ab){
  const dv=new DataView(ab), bytes=new Uint8Array(ab);
  const s4=o=>String.fromCharCode(bytes[o],bytes[o+1],bytes[o+2],bytes[o+3]);
  if(s4(0)!=="RIFF"||s4(8)!=="WAVE")throw new Error(t("not_wav_file"));
  let p=12, fmtC=null, dataC=null, smplC=null;
  while(p+8<=bytes.length){
    const id=s4(p), sz=dv.getUint32(p+4,true); p+=8;
    if(p+sz>bytes.length)break;
    const c=bytes.slice(p,p+sz);
    if(id==="fmt ")fmtC=c; else if(id==="data")dataC=c; else if(id==="smpl")smplC=c;
    p+=sz+(sz&1);
  }
  if(!fmtC||!dataC)throw new Error(t("incomplete_wav"));
  const fd=new DataView(fmtC.buffer,fmtC.byteOffset,fmtC.byteLength);
  const tag=fd.getUint16(0,true), ch=fd.getUint16(2,true), sr=fd.getUint32(4,true), bits=fd.getUint16(14,true);
  const bps=Math.ceil(bits/8), frameB=bps*ch, frames=Math.floor(dataC.length/frameB);
  const out=new Float32Array(frames);
  const rd=(o)=>{
    if(tag===3){if(bits===32)return dv.getFloat32(o,true);return 0;}
    if(bits===8)return (dataC[o]-128)/128;
    if(bits===16){let v=dataC[o]|(dataC[o+1]<<8);if(v>=32768)v-=65536;return v/32768;}
    if(bits===24){let v=dataC[o]|(dataC[o+1]<<8)|(dataC[o+2]<<16);if(v>=0x800000)v-=0x1000000;return v/8388608;}
    if(bits===32){let v=(dataC[o]|(dataC[o+1]<<8)|(dataC[o+2]<<16)|(dataC[o+3]<<24))>>>0;if(v>=0x80000000)v-=0x100000000;return v/2147483648;}
    return 0;
  };
  for(let i=0;i<frames;i++){
    let sum=0, base=i*frameB;
    for(let c=0;c<ch;c++)sum+=rd(base+c*bps);
    out[i]=sum/ch;
  }
  let ls=0, le=frames, hasLoop=false;
  if(smplC&&smplC.length>=60){
    const sd=new DataView(smplC.buffer,smplC.byteOffset,smplC.byteLength);
    if(sd.getUint32(28,true)>0){
      const a=sd.getUint32(44,true), b=sd.getUint32(48,true);
      if(b>a&&b<=frames){ls=a;le=b;hasLoop=true;}
    }
  }
  return {sampleRate:sr, samples:out, loopStart:ls, loopEnd:le, hasLoop};
}

/* ---------- SF2 Parser ---------- */
function parseSF2(ab){
  const bytes=new Uint8Array(ab), dv=new DataView(ab);
  const s4=o=>String.fromCharCode(bytes[o]||0,bytes[o+1]||0,bytes[o+2]||0,bytes[o+3]||0);
  const u16=o=>dv.getUint16(o,true), u32=o=>dv.getUint32(o,true);
  if(s4(0)!=="RIFF"||s4(8)!=="sfbk")throw new Error(t("not_sf2_file"));

  const chunks={info:{},sdta:{},pdta:{}};
  let p=12;
  while(p+8<=bytes.length){
    const id=s4(p), sz=u32(p+4), start=p+8;
    if(id==="LIST"){
      const type=s4(start);
      let q=start+4; const end=start+sz;
      while(q+8<=end){
        const cid=s4(q), csz=u32(q+4);
        const cdata=bytes.subarray(q+8,q+8+csz);
        if(type==="INFO")chunks.info[cid]=cdata;
        else if(type==="sdta")chunks.sdta[cid]=cdata;
        else if(type==="pdta")chunks.pdta[cid]=cdata;
        q=q+8+csz+(csz&1);
      }
    }
    p=start+sz+(sz&1);
  }

  if(!chunks.sdta.smpl)throw new Error(t("sf2_missing_sample_data"));
  const smplData = chunks.sdta.smpl;

  const getDV=name=>{
    const d=chunks.pdta[name];
    if(!d)throw new Error(t("sf2_missing_chunk", {name}));
    return new DataView(d.buffer,d.byteOffset,d.byteLength);
  };
  const getName=(d,off,len)=>{
    let s="";
    for(let i=0;i<len;i++){const c=d[off+i];if(c===0)break;s+=String.fromCharCode(c);}
    return s.replace(/\s+$/,"");
  };

  const shdrData=chunks.pdta.shdr, shdrDV=getDV("shdr"), shdr=[];
  for(let i=0;i+46<=shdrData.length;i+=46){
    shdr.push({
      name:getName(shdrData,i,20),
      dwStart:shdrDV.getUint32(i+20,true),
      dwEnd:shdrDV.getUint32(i+24,true),
      dwStartloop:shdrDV.getUint32(i+28,true),
      dwEndloop:shdrDV.getUint32(i+32,true),
      dwSampleRate:shdrDV.getUint32(i+36,true),
      byOriginalPitch:shdrDV.getUint8(i+40),
      chPitchCorrection:shdrDV.getInt8(i+41),
      wSampleLink:shdrDV.getUint16(i+42,true),
      sfSampleType:shdrDV.getUint16(i+44,true)
    });
  }
  if(shdr.length)shdr.pop();

  const phdrData=chunks.pdta.phdr, phdrDV=getDV("phdr"), phdr=[];
  for(let i=0;i+38<=phdrData.length;i+=38){
    phdr.push({
      name:getName(phdrData,i,20),
      preset:phdrDV.getUint16(i+20,true),
      bank:phdrDV.getUint16(i+22,true),
      bagIdx:phdrDV.getUint16(i+24,true)
    });
  }
  if(phdr.length)phdr.pop();

  const pbagData=chunks.pdta.pbag, pbagDV=getDV("pbag"), pbag=[];
  for(let i=0;i+4<=pbagData.length;i+=4){
    pbag.push({genIdx:pbagDV.getUint16(i,true),modIdx:pbagDV.getUint16(i+2,true)});
  }
  if(pbag.length)pbag.pop();

  const pgenData=chunks.pdta.pgen, pgenDV=getDV("pgen"), pgen=[];
  for(let i=0;i+4<=pgenData.length;i+=4){
    pgen.push({genOper:pgenDV.getUint16(i,true),genAmount:pgenDV.getUint16(i+2,true)});
  }

  const instData=chunks.pdta.inst, instDV=getDV("inst"), inst=[];
  for(let i=0;i+22<=instData.length;i+=22){
    inst.push({name:getName(instData,i,20),bagIdx:instDV.getUint16(i+20,true)});
  }
  if(inst.length)inst.pop();

  const ibagData=chunks.pdta.ibag, ibagDV=getDV("ibag"), ibag=[];
  for(let i=0;i+4<=ibagData.length;i+=4){
    ibag.push({genIdx:ibagDV.getUint16(i,true),modIdx:ibagDV.getUint16(i+2,true)});
  }
  if(ibag.length)ibag.pop();

  const igenData=chunks.pdta.igen, igenDV=getDV("igen"), igen=[];
  for(let i=0;i+4<=igenData.length;i+=4){
    igen.push({genOper:igenDV.getUint16(i,true),genAmount:igenDV.getUint16(i+2,true)});
  }

  return {shdr,phdr,pbag,pgen,inst,ibag,igen,smplData};
}

function sf2ToGusPatches(sf2, fileName){
  const {shdr,phdr,pbag,pgen,inst,ibag,igen,smplData}=sf2;
  const s16=v=>v>32767?v-65536:v;

  function getGens(genArr,startIdx,endIdx){
    const out=[];
    const safeEnd = Math.min(endIdx, genArr.length);
    for(let i=startIdx;i<safeEnd;i++)out.push({op:genArr[i].genOper,amt:genArr[i].genAmount});
    return out;
  }
  function findGen(gens,op){for(const g of gens)if(g.op===op)return g;return null;}

  const sampleCache = new Map();

  function getKeyRange(gens){
    const range=findGen(gens,43);
    return range?[range.amt&0xff,(range.amt>>8)&0xff]:[0,127];
  }

  function convertSample(sIdx, overrideRoot, coarseSemis, fineCents, keyLow, keyHigh){
    const cacheKey = `${sIdx}_${overrideRoot}_${coarseSemis}_${fineCents}_${keyLow}_${keyHigh}`;
    let cached = sampleCache.get(cacheKey);
    
    if (!cached) {
      const sh=shdr[sIdx]; if(!sh)return null;
      const startByte = sh.dwStart * 2;
      const endByte = Math.min(sh.dwEnd * 2, smplData.length);
      if (endByte <= startByte) return null;

      const pcm = smplData.slice(startByte, endByte); 
      const start=sh.dwStart, end=endByte / 2;
      const loopStartSmp=sh.dwStartloop-start, loopEndSmp=sh.dwEndloop-start;
      const hasLoop=(sh.sfSampleType&1)&&loopEndSmp>loopStartSmp&&loopStartSmp>=0;

      let rootNote = (overrideRoot !== undefined && overrideRoot > 0 && overrideRoot < 128)
               ? overrideRoot
               : sh.byOriginalPitch;
      if (!rootNote || rootNote <= 0 || rootNote >= 128) rootNote = 60; // fallback C4
      const pitchCorr=sh.chPitchCorrection||0;
      let rootFreq=440*Math.pow(2,(rootNote-69)/12)*Math.pow(2,pitchCorr/1200);
      if(coarseSemis) rootFreq*=Math.pow(2,coarseSemis/12);
      if(fineCents) rootFreq*=Math.pow(2,fineCents/1200);
      rootFreq=Math.round(rootFreq*1000);
      const lowFreq=Math.floor(440*Math.pow(2,(keyLow-69)/12)*1000);
      const highFreq=Math.ceil(440*Math.pow(2,(keyHigh-69)/12)*1000);

      let modes=M16;
      if(hasLoop) modes|=MLOOP;

      const safeName=(sh.name||"SMP").replace(/[^\x20-\x7E]/g,"").trim().substring(0,7)||"SMP";

      cached = {
        name:safeName, fractions:0, dataSize:pcm.length,
        loopStart:hasLoop?loopStartSmp*2:0, loopEnd:hasLoop?loopEndSmp*2:0,
        sampleRate:clamp(sh.dwSampleRate||22050,1,192000),
        lowFreq, highFreq,
        rootFreq, tune:0, balance:7,
        envRates:[0,0,0,0,0,0], envOffsets:[255,255,255,0,0,0],
        tremoloSweep:0,tremoloRate:0,tremoloDepth:0,
        vibratoSweep:0,vibratoRate:0,vibratoDepth:0,
        modes, scaleFreq: rootNote, scaleFactor:1024,   // ← pakai rootNote
        reserved:new Uint8Array(36), pcm, _float:null
      };
      sampleCache.set(cacheKey, cached);
    }
    
    return {
      ...cached,
      envRates: [...cached.envRates],
      envOffsets: [...cached.envOffsets],
      reserved: new Uint8Array(cached.reserved),
      _float: null
    };
  }

  const entries=[];
  for(let pi=0;pi<phdr.length;pi++){
    const preset=phdr[pi];
    const nextPreset=phdr[pi+1];
    const pbagStart=preset.bagIdx;
    const pbagEnd=nextPreset?nextPreset.bagIdx:pbag.length;

    const gusInstruments=[];
    for(let pb=pbagStart;pb<pbagEnd;pb++){
      const pzone=pbag[pb];
      const nextPzone=pbag[pb+1];
      const pgenEnd=nextPzone?nextPzone.genIdx:pgen.length;
      const pgens=getGens(pgen,pzone.genIdx,pgenEnd);
      const [presetKeyLow,presetKeyHigh]=getKeyRange(pgens);

      const instGen=findGen(pgens,41);
      if(!instGen)continue;
      const instIdx=instGen.amt;
      if(instIdx>=inst.length)continue;

      const sf2inst=inst[instIdx];
      const nextInst=inst[instIdx+1];
      const ibagStart=sf2inst.bagIdx;
      const ibagEnd=nextInst?nextInst.bagIdx:ibag.length;

      const layers=[];
      for(let ib=ibagStart;ib<ibagEnd;ib++){
        const izone=ibag[ib];
        const nextIzone=ibag[ib+1];
        const igenEnd=nextIzone?nextIzone.genIdx:igen.length;
        const igens=getGens(igen,izone.genIdx,igenEnd);
        const [instrumentKeyLow,instrumentKeyHigh]=getKeyRange(igens);
        const keyLow=Math.max(presetKeyLow,instrumentKeyLow);
        const keyHigh=Math.min(presetKeyHigh,instrumentKeyHigh);
        if(keyLow>keyHigh)continue;

        const sampGen=findGen(igens,53);
        if(!sampGen)continue;

        const rootKeyGen=findGen(igens,58);
        const coarseGen=findGen(igens,51);
        const fineGen=findGen(igens,52);
        const coarseSemis=coarseGen?s16(coarseGen.amt):0;
        const fineCents=fineGen?s16(fineGen.amt):0;

        const gusSample=convertSample(sampGen.amt, rootKeyGen?rootKeyGen.amt:undefined, coarseSemis, fineCents, keyLow, keyHigh);
        if(!gusSample)continue;

        layers.push({
          duplicate:0, layer:layers.length, layerSize:0,
          reserved:new Uint8Array(40),
          samples:[gusSample]
        });
      }
      if(layers.length===0)continue;

      gusInstruments.push({
        instrument:instIdx,
        name:(sf2inst.name||("Inst "+instIdx)).substring(0,16),
        size:0, reserved:new Uint8Array(40),
        layers
      });
    }
    if(gusInstruments.length===0)continue;

    if (preset.bank === 128) {
  // === DRUM KIT: split per note ===
  const zones = [];
  for (let pb = pbagStart; pb < pbagEnd; pb++) {
    const pzone = pbag[pb];
    const nextPzone = pbag[pb + 1];
    const pgens = getGens(pgen, pzone.genIdx, nextPzone ? nextPzone.genIdx : pgen.length);

    // (1) Baca key range dari preset level (pgen 43) — sering dipakai di drum SF2
    const [presetKeyLow, presetKeyHigh] = getKeyRange(pgens);

    const instGen = findGen(pgens, 41);
    if (!instGen) continue;
    const instIdx = instGen.amt;
    const sf2inst = inst[instIdx];
    if (!sf2inst) continue;

    const ibagStart = sf2inst.bagIdx;
    const nextInst = inst[instIdx + 1];
    const ibagEnd = nextInst ? nextInst.bagIdx : ibag.length;

    for (let ib = ibagStart; ib < ibagEnd; ib++) {
      const izone = ibag[ib];
      const nextIzone = ibag[ib + 1];
      const igens = getGens(igen, izone.genIdx, nextIzone ? nextIzone.genIdx : igen.length);

      const sampGen = findGen(igens, 53);
      if (!sampGen) continue;

      // (2) Baca key range dari instrument level (igen 43) — PERBAIKAN UTAMA
      const [instKeyLow, instKeyHigh] = getKeyRange(igens);

      // (3) Intersect kedua range (persis seperti di PHP)
      const keyLo = Math.max(presetKeyLow, instKeyLow);
      const keyHi = Math.min(presetKeyHigh, instKeyHigh);
      if (keyLo > keyHi) continue;

      const rootGen = findGen(igens, 58);
      const coarseGen = findGen(igens, 51);
      const fineGen = findGen(igens, 52);
      const coarseSemis = coarseGen ? s16(coarseGen.amt) : 0;
      const fineCents = fineGen ? s16(fineGen.amt) : 0;

      const sample = convertSample(
        sampGen.amt,
        rootGen ? rootGen.amt : undefined,
        coarseSemis, fineCents,
        keyLo, keyHi
      );
      if (!sample) continue;
      zones.push({ keyLo, keyHi, sample, sampIdx: sampGen.amt });
    }
  }

  // Buat SATU patch per MIDI note (35..81) yang tercakup
  for (let note = 0; note < 128; note++) {
    const z = zones.find(zz => note >= zz.keyLo && note <= zz.keyHi);
    if (!z) continue;

    const noteSample = {
      ...z.sample,
      envRates: [...z.sample.envRates],
      envOffsets: [...z.sample.envOffsets],
      reserved: new Uint8Array(z.sample.reserved),
      _float: null
    };

    const drumPatch = {
      header: {
        magic: MAGIC, gravisId: GRAVIS_ID,
        description: `${preset.name||"Drum"} N${note}`.substring(0, 60),
        voices: 14, channels: 0, waveForms: 0, masterVolume: 127, dataSize: 0,
        reserved: new Uint8Array(36)
      },
      instruments: [{
        instrument: 0,
        name: (preset.name || "Drum").substring(0, 16),
        size: 0, reserved: new Uint8Array(40),
        layers: [{
          duplicate: 0, layer: 0, layerSize: 0,
          reserved: new Uint8Array(40),
          samples: [noteSample]
        }]
      }]
    };

    entries.push({
      id: uid("sf2drum"),
      name: `drum_${String(note).padStart(2, "0")}_${preset.name||"Kit"}`.substring(0, 48),
      source: "sf2:" + fileName,
      gmProgram: note,     // ← pakai NOTE sebagai "program" untuk lookup
      gmBank: 128,         // ← tandai sebagai drum
      drumSet: preset.preset,   // ← TAMBAHKAN BARIS INI
      originalOrder: preset.preset,   // ← tambahkan
      patch: drumPatch
    });
  }
} else {
    const patch={
      header:{
        magic:MAGIC, gravisId:GRAVIS_ID,
        description:(preset.name||("Preset "+preset.preset)).substring(0,60),
        voices:14, channels:0, waveForms:0, masterVolume:127, dataSize:0,
        reserved:new Uint8Array(36)
      },
      instruments:gusInstruments
    };

    let displayName=preset.name||("Preset "+preset.preset);
    if(preset.bank>0) displayName+=" [bank "+preset.bank+"]";
    if(preset.preset!==undefined) displayName+=" #"+preset.preset;

    entries.push({
      id: uid("sf2"),
      name: displayName.substring(0,48),
      source: "sf2:"+fileName,
      gmProgram: preset.preset,
      gmBank: preset.bank,
      originalOrder: preset.bank,     // ← tambahkan
      patch
    });
  }
}
  return entries;
}

/* ---------- Bank Management ---------- */
function initBankFields(entries, project) {
  const existing = (project.patchIds || [])
    .map(id => state.patches.find(p => p.id === id))
    .filter(Boolean);
  const all = [...existing, ...entries];

  for (const p of all) {
    if (typeof p.originalOrder !== "number") {
      p.originalOrder = (p.gmBank ?? 0) === 128 ? (p.drumSet ?? 0) : (p.gmBank ?? 0);
    }
    if (typeof p.targetBank !== "number") p.targetBank = p.originalOrder;
    if (typeof p.exportSelected !== "boolean") p.exportSelected = true;
  }

  const withoutOrder = all.filter(p => typeof p.userOrder !== "number");
  if (withoutOrder.length > 0) {
    withoutOrder.sort((a, b) => {
      const aDrum = (a.gmBank ?? 0) === 128 ? 1 : 0;
      const bDrum = (b.gmBank ?? 0) === 128 ? 1 : 0;
      if (aDrum !== bDrum) return aDrum - bDrum;
      const aProg = a.gmProgram ?? -1;
      const bProg = b.gmProgram ?? -1;
      if (aProg !== bProg) return aProg - bProg;
      return (a.originalOrder ?? 0) - (b.originalOrder ?? 0);
    });
    const existingOrders = all.filter(p => typeof p.userOrder === "number").map(p => p.userOrder);
    let next = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 0;
    for (const p of withoutOrder) p.userOrder = next++;
  }
}

function getProjectPatchEntries() {
  const project = state.projects.find(p => p.id === state.currentProjectId);
  if (!project) return [];
  return project.patchIds
    .map(id => state.patches.find(p => p.id === id))
    .filter(Boolean)
    .sort((a, b) => (a.userOrder ?? 0) - (b.userOrder ?? 0));
}

function renderBankManager() {
  const card = $("bankManagerCard");
  if (!card) return;
  
  const project = state.projects.find(p => p.id === state.currentProjectId);
  const currentPatch = state.patches.find(p => p.id === state.currentPatchId);

  // Sembunyikan jika tidak ada proyek atau tidak ada patch yang dipilih
  if (!project || !currentPatch) {
    card.hidden = true;
    return;
  }

  // Tentukan filter berdasarkan patch yang sedang dipilih
  const isDrum = (currentPatch.gmBank ?? 0) === 128;
  const prog = currentPatch.gmProgram ?? -1;

  // Ambil semua patch di proyek, lalu filter berdasarkan Program & Tipe
  let entries = getProjectPatchEntries().filter(p => {
    const pIsDrum = (p.gmBank ?? 0) === 128;
    return pIsDrum === isDrum && (p.gmProgram ?? -1) === prog;
  });

  if (entries.length === 0) {
    card.hidden = true;
    return;
  }
  card.hidden = false;

  const selectedCount = entries.filter(p => p.exportSelected !== false).length;
  $("bankSummaryPill").textContent = t("bank_filtered_summary", {
    count: entries.length,
    selected: selectedCount
  });
  $("bankSelectAll").checked = selectedCount === entries.length;
  $("exportSelectedLabel").textContent = t("export_selected_only") + ` (${selectedCount})`;

  // Tampilkan info filter di judul
  const typeLabel = isDrum ? t("drum") : t("non_drum");
  const titleEl = card.querySelector("h2");
  let titleText = t("bank_management");
  if (currentPatch) {
    titleText += " - " + t("bank_filter_active", { program: prog, type: typeLabel });
  }
  titleEl.textContent = titleText;

  const list = $("bankList");
  list.innerHTML = "";

  let lastType = null;
  for (const p of entries) {
    const rowIsDrum = (p.gmBank ?? 0) === 128;
    const typeKey = rowIsDrum ? "drum" : "melodic";
    
    if (typeKey !== lastType) {
      const header = document.createElement("div");
      header.className = "bank-group-header";
      header.textContent = rowIsDrum ? t("drum") : t("non_drum");
      list.appendChild(header);
      lastType = typeKey;
    }

    const row = document.createElement("div");
    row.className = "bank-row" + (p.exportSelected === false ? " disabled" : "");
    row.draggable = true;
    row.dataset.id = p.id;
    const targetChanged = (p.targetBank ?? 0) !== (p.originalOrder ?? 0);
    
    row.innerHTML = `
      <input type="checkbox" data-act="select" ${p.exportSelected !== false ? "checked" : ""} aria-label="${t("export_selected_only")}">
      <span class="bank-handle" title="${t("drag_to_reorder")}">☰</span>
      <span class="bank-type ${typeKey}">${rowIsDrum ? "D" : "M"}</span>
      <span class="bank-program">${String(p.gmProgram ?? -1).padStart(3, "0")}</span>
      <span class="bank-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</span>
      <span class="bank-original" title="${t("original_order")}">${p.originalOrder ?? 0}</span>
      <span class="bank-order" title="${t("user_order")}">${p.userOrder ?? 0}</span>
      <input type="number" class="bank-target${targetChanged ? " changed" : ""}" data-act="target"
             min="0" max="999" value="${p.targetBank ?? 0}" title="${t("target_bank")}" aria-label="${t("target_bank")}">
    `;
    list.appendChild(row);
  }

  bindBankManagerEvents(list);
}

// Update Drag & Drop agar hanya menukar urutan antar item yang terlihat (satu program)
function updateUserOrderFromDom(list) {
  const rows = Array.from(list.querySelectorAll(".bank-row"));
  const visiblePatches = rows.map(r => state.patches.find(p => p.id === r.dataset.id)).filter(Boolean);

  // Ekstrak nilai userOrder yang ada, lalu urutkan
  const orders = visiblePatches.map(p => p.userOrder ?? 0).sort((a, b) => a - b);

  // Terapkan kembali ke patch sesuai urutan DOM yang baru
  visiblePatches.forEach((p, i) => {
    p.userOrder = orders[i];
    const orderEl = rows[i].querySelector(".bank-order");
    if (orderEl) orderEl.textContent = p.userOrder;
  });

  saveProjectBankConfig();
}

// Perbarui fungsi refresh agar hanya mereset urutan pada program yang sedang aktif
function refreshBankOrder() {
  const currentPatch = state.patches.find(p => p.id === state.currentPatchId);
  if (!currentPatch) return;

  const isDrum = (currentPatch.gmBank ?? 0) === 128;
  const prog = currentPatch.gmProgram ?? -1;

  const entries = getProjectPatchEntries().filter(p =>
    ((p.gmBank ?? 0) === 128) === isDrum && (p.gmProgram ?? -1) === prog
  );

  const sorted = [...entries].sort((a, b) => (a.originalOrder ?? 0) - (b.originalOrder ?? 0));
  const orders = entries.map(p => p.userOrder ?? 0).sort((a, b) => a - b);

  sorted.forEach((p, i) => { p.userOrder = orders[i]; });
  renderBankManager();
  saveProjectBankConfig();
  showStatus(t("bank_order_refreshed"), "ok");
}

let bankDragSource = null;

let bankConfigSaveTimer = null;
let pendingBankConfigPatches = new Set();

function scheduleBankConfigSave(patch) {
  if (patch) pendingBankConfigPatches.add(patch);
  
  if (bankConfigSaveTimer) clearTimeout(bankConfigSaveTimer);
  bankConfigSaveTimer = setTimeout(async () => {
    const entries = Array.from(pendingBankConfigPatches);
    pendingBankConfigPatches.clear();
    
    if (entries.length === 0) return;
    
    try {
      // Menggunakan dbPutMany langsung ke STORE (patch) tanpa menulis ulang data proyek
      await dbPutMany(STORE, entries.map(cleanEntryForStorage));
    } catch (err) {
      console.error("Save bank config failed:", err);
    }
  }, 500); // Tunda 500ms agar UI tidak terblokir saat drag/klik cepat
}

function bindBankManagerEvents(list) {
  // Avoid duplicate listeners
  if (list.dataset.bound === "1") return;
  list.dataset.bound = "1";

  list.addEventListener("dragstart", e => {
    const row = e.target.closest(".bank-row");
    if (!row) return;
    bankDragSource = row;
    row.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", row.dataset.id); } catch (_) {}
  });

  list.addEventListener("dragend", e => {
    const row = e.target.closest(".bank-row");
    if (row) row.classList.remove("dragging");
    list.querySelectorAll(".bank-row.drag-over").forEach(r => r.classList.remove("drag-over"));
    bankDragSource = null;
  });

  list.addEventListener("dragover", e => {
    e.preventDefault();
    const row = e.target.closest(".bank-row");
    if (!row || row === bankDragSource) return;
    e.dataTransfer.dropEffect = "move";
    list.querySelectorAll(".bank-row.drag-over").forEach(r => r !== row && r.classList.remove("drag-over"));
    row.classList.add("drag-over");
  });

  list.addEventListener("dragleave", e => {
    const row = e.target.closest(".bank-row");
    if (row) row.classList.remove("drag-over");
  });

  list.addEventListener("drop", e => {
    e.preventDefault();
    const target = e.target.closest(".bank-row");
    if (!target || !bankDragSource || target === bankDragSource) return;
    target.classList.remove("drag-over");

    const rect = target.getBoundingClientRect();
    const after = e.clientY > rect.top + rect.height / 2;
    list.insertBefore(bankDragSource, after ? target.nextSibling : target);

    updateUserOrderFromDom(list);
  });

  list.addEventListener("change", e => {
    const row = e.target.closest(".bank-row");
    if (!row) return;
    const patch = state.patches.find(p => p.id === row.dataset.id);
    if (!patch) return;

    if (e.target.dataset.act === "select") {
      patch.exportSelected = e.target.checked;
      row.classList.toggle("disabled", !patch.exportSelected);
      scheduleBankConfigSave(patch); // ← Gunakan fungsi debounce
    } else if (e.target.dataset.act === "target") {
      patch.targetBank = clamp(parseInt(e.target.value, 10) || 0, 0, 999);
      e.target.value = patch.targetBank;
      e.target.classList.toggle("changed", patch.targetBank !== (patch.originalOrder ?? 0));
      scheduleBankConfigSave(patch); // ← Gunakan fungsi debounce
    }

    // Update ringkasan berdasarkan item yang SEDANG DIFILTER
    const currentPatch = state.patches.find(p => p.id === state.currentPatchId);
    if (currentPatch) {
      const isDrum = (currentPatch.gmBank ?? 0) === 128;
      const prog = currentPatch.gmProgram ?? -1;
      const visibleEntries = getProjectPatchEntries().filter(p => {
        const pIsDrum = (p.gmBank ?? 0) === 128;
        return pIsDrum === isDrum && (p.gmProgram ?? -1) === prog;
      });
      const selectedCount = visibleEntries.filter(p => p.exportSelected !== false).length;
      
      $("bankSummaryPill").textContent = t("bank_filtered_summary", {count: visibleEntries.length, selected: selectedCount});
      $("bankSelectAll").checked = selectedCount === visibleEntries.length;
      $("exportSelectedLabel").textContent = t("export_selected_only") + ` (${selectedCount})`;
    }
  });
}

function updateUserOrderFromDom(list) {
  const rows = Array.from(list.querySelectorAll(".bank-row"));
  const visiblePatches = rows.map(r => state.patches.find(p => p.id === r.dataset.id)).filter(Boolean);
  const orders = visiblePatches.map(p => p.userOrder ?? 0).sort((a, b) => a - b);

  visiblePatches.forEach((p, i) => {
    p.userOrder = orders[i];
    scheduleBankConfigSave(p); // ← Gunakan fungsi debounce
    const orderEl = rows[i].querySelector(".bank-order");
    if (orderEl) orderEl.textContent = p.userOrder;
  });
}

async function saveProjectBankConfig() {
  const project = state.projects.find(p => p.id === state.currentProjectId);
  if (!project) return;
  const entries = project.patchIds
    .map(id => state.patches.find(p => p.id === id))
    .filter(Boolean);
  try {
    await dbSaveProjectAndPatches(project, entries);
  } catch (err) {
    console.error("Save bank config failed:", err);
  }
}

function refreshBankOrder() {
  const currentPatch = state.patches.find(p => p.id === state.currentPatchId);
  if (!currentPatch) return;
  const isDrum = (currentPatch.gmBank ?? 0) === 128;
  const prog = currentPatch.gmProgram ?? -1;
  const entries = getProjectPatchEntries().filter(p =>
    ((p.gmBank ?? 0) === 128) === isDrum && (p.gmProgram ?? -1) === prog
  );

  const sorted = [...entries].sort((a, b) => (a.originalOrder ?? 0) - (b.originalOrder ?? 0));
  const orders = entries.map(p => p.userOrder ?? 0).sort((a, b) => a - b);

  sorted.forEach((p, i) => { 
    p.userOrder = orders[i]; 
    scheduleBankConfigSave(p); // ← Gunakan fungsi debounce
  });
  
  renderBankManager();
  showStatus(t("bank_order_refreshed"), "ok");
}

function compactBanks() {
  const currentPatch = state.patches.find(p => p.id === state.currentPatchId);
  if (!currentPatch) return;
  const isDrum = (currentPatch.gmBank ?? 0) === 128;
  const prog = currentPatch.gmProgram ?? -1;
  const entries = getProjectPatchEntries().filter(p =>
    ((p.gmBank ?? 0) === 128) === isDrum && (p.gmProgram ?? -1) === prog
  );

  const uniq = [...new Set(entries.map(p => p.originalOrder ?? 0))].sort((a, b) => a - b);
  const map = new Map(uniq.map((v, i) => [v, i]));
  
  for (const p of entries) {
    p.targetBank = map.get(p.originalOrder ?? 0) ?? 0;
    scheduleBankConfigSave(p); // ← Gunakan fungsi debounce
  }

  renderBankManager();
  showStatus(t("bank_compacted"), "ok");
}

function exportBanks(mode) {
  const project = state.projects.find(p => p.id === state.currentProjectId);
  if (!project) return;
  let patches = getProjectPatchEntries();
  if (mode === "selected") {
    patches = patches.filter(p => p.exportSelected !== false);
  }
  if (patches.length === 0) {
    showStatus(t("export_nothing_selected"), "bad");
    return;
  }
  exportProjectWithConfig(project, patches, mode);
}

/* ---------- Audio Engine ---------- */
function ensureAudio(){
  if(!state.audio.ctx){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)throw new Error(t("web_audio_unsupported"));
    state.audio.ctx=new AC();
    state.audio.master=state.audio.ctx.createGain();
    state.audio.master.gain.value=0.8;
    state.audio.master.connect(state.audio.ctx.destination);
  }
  if(state.audio.ctx.state==="suspended")state.audio.ctx.resume();
}

function gusEnvMs(rate,start,end){
  let r=(3-((rate>>6)&3))*3, p=rate&0x3f;
  if(!p)p=1;
  let t=Math.abs(end-start);
  t=13>r?t<<(13-r):t>>(r-13);
  return (t*10)/(p*441);
}

function computeEnv(s){
  if(!(s.modes&MENV))return {attack:0.005,decay:0.001,sustain:1,release:0.03};
  const r=s.envRates, o=s.envOffsets;
  const attack=clamp(gusEnvMs(r[0],0,o[0])/1000,0.001,8);
  const decay=clamp(gusEnvMs(r[1],o[0],o[1])/1000,0.001,8);
  const sustain=clamp(o[2]/255,0.001,1);
  let release=clamp(gusEnvMs(r[3],o[2],0)/1000,0.005,8);
  if(s.modes&MCLAMP)release=Math.min(release,0.06);
  return {attack,decay,sustain,release};
}

function rootHz(s){
  let f=s.rootFreq;
  if(!f||f<=0)f=s.sampleRate||22050;
  if(f>100000)f/=1000;
  return clamp(f,1,200000);
}

function playSample(s, note=60, velocity=100, hold=false){
  ensureAudio();
  const ctx=state.audio.ctx;
  let floats=ensureFloat(s);
  const sr=clamp(s.sampleRate||22050,4000,192000);
  let li=loopInfo(s);

  if(s.modes&MREV){
    const r=new Float32Array(floats.length);
    for(let i=0;i<floats.length;i++)r[i]=floats[floats.length-1-i];
    floats=r;
    if(li.enabled){
      const t=floats.length;
      li={enabled:true,start:t-li.end,end:t-li.start,total:t};
    }
  }

  const buf=ctx.createBuffer(1,floats.length,sr);
  buf.copyToChannel(floats,0);
  const src=ctx.createBufferSource(); src.buffer=buf;
  const rate=clamp(midiToFreq(note)/rootHz(s),0.01,32);
  src.playbackRate.value=rate;

  if(li.enabled){
    src.loop=true;
    src.loopStart=clamp(li.start/sr,0,buf.duration);
    src.loopEnd=clamp(li.end/sr,0.0001,buf.duration);
  }

  const gain=ctx.createGain(); src.connect(gain).connect(state.audio.master);
  const env=computeEnv(s);
  const now=ctx.currentTime+0.005;
  const patchVol=state.patch?(state.patch.header.masterVolume??127)/127:1;
  const peak=Math.max(0.0001,(velocity/127)*patchVol);
  gain.gain.setValueAtTime(0.0001,now);
  gain.gain.exponentialRampToValueAtTime(peak,now+env.attack);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001,peak*env.sustain),now+env.attack+env.decay);

  const voice={src,gain,sample:s,note,velocity,env,released:false};
  src.onended=()=>{
    state.audio.voices.delete(voice);
    if(state.audio.hold===voice)state.audio.hold=null;
    try{gain.disconnect();}catch(_){}
  };
  src.start(now);
  state.audio.voices.add(voice);
  if(hold)state.audio.hold=voice;
  return voice;
}

function releaseVoice(v,fast=false){
  if(!v||v.released)return;
  v.released=true;
  const ctx=state.audio.ctx; if(!ctx)return;
  const now=ctx.currentTime, g=v.gain.gain;
  let cur=0.0001;
  try{cur=Math.max(0.0001,g.value);}catch(_){}
  g.cancelScheduledValues(now);
  g.setValueAtTime(cur,now);
  const rel=Math.max(0.005,fast?Math.min(v.env.release,0.04):v.env.release);
  g.exponentialRampToValueAtTime(0.0001,now+rel);
  try{v.src.stop(now+rel+0.06);}catch(_){}
}

function releaseAllVoices(fast=false){ for(const v of Array.from(state.audio.voices))releaseVoice(v,fast); }
function stopAllVoices(){
  for(const v of Array.from(state.audio.voices)){
    try{v.src.stop();}catch(_){}
    try{v.gain.disconnect();}catch(_){}
    state.audio.voices.delete(v);
  }
  state.audio.hold=null;
}

/* ---------- Canvas ---------- */
let cctx=null;
function clampView(n){
  if(!n)return;
  const visible=n/state.zoom;
  state.offset=clamp(state.offset,0,Math.max(0,n-visible));
  if(state.zoom===1)state.offset=0;
}
function updateZoomUI(){const el=$("zoomLevelText"); if(el)el.textContent=state.zoom.toFixed(1)+"x";}
function zoomCanvas(factor, centerX=null){
  const s=state.selSample; if(!s)return;
  const n=ensureFloat(s).length;
  const oldZoom=state.zoom;
  state.zoom=clamp(state.zoom*factor,1,1000);
  if(oldZoom===state.zoom)return;
  const w=$("waveCanvas").getBoundingClientRect().width;
  const mouseRatio=centerX!==null?centerX/w:0.5;
  const oldVisible=n/oldZoom;
  const newVisible=n/state.zoom;
  const mouseSmp=state.offset+mouseRatio*oldVisible;
  state.offset=mouseSmp-mouseRatio*newVisible;
  clampView(n); updateZoomUI(); drawWave();
}
function smpToX(smp,w,n){const v=n/state.zoom; return ((smp-state.offset)/v)*w;}
function xToSmp(x,w,n){const v=n/state.zoom; const idx=state.offset+(x/Math.max(1,w))*v; return clamp(Math.round(idx),0,Math.max(0,n-1));}

function drawWave(){
  const cv=$("waveCanvas");
  if(!cctx)cctx=cv.getContext("2d");
  const rect=cv.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
  if(cv.width!==Math.floor(rect.width*dpr)||cv.height!==Math.floor(rect.height*dpr)){
    cv.width=Math.floor(rect.width*dpr); cv.height=Math.floor(rect.height*dpr);
  }
  const ctx=cctx; ctx.setTransform(dpr,0,0,dpr,0,0);
  const w=rect.width, h=rect.height;
  ctx.clearRect(0,0,w,h);
  const grad=ctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0,"#08101e"); grad.addColorStop(1,"#060b14");
  ctx.fillStyle=grad; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle="rgba(56,189,248,0.06)";
  for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(0,h/4*i);ctx.lineTo(w,h/4*i);ctx.stroke();}

  const s=state.selSample; if(!s){$("waveInfo").textContent="—";$("selInfo").textContent=t("selection_empty");return;}
  const floats=ensureFloat(s), n=floats.length;
  if(!n)return;
  clampView(n);
  const visibleCount=n/state.zoom, startSmp=state.offset, mid=h/2, amp=h/2*0.92;

  const li=loopInfo(s);
  if(li.enabled){
    const x1=smpToX(li.start,w,n), x2=smpToX(li.end,w,n);
    if(x2>0&&x1<w){
      const drawX1=Math.max(0,x1), drawX2=Math.min(w,x2);
      ctx.fillStyle="rgba(56,189,248,0.075)";
      ctx.fillRect(drawX1,0,Math.max(1,drawX2-drawX1),h);
      ctx.strokeStyle="rgba(56,189,248,0.55)"; ctx.setLineDash([4,4]);
      if(x1>=0&&x1<=w){ctx.beginPath();ctx.moveTo(x1,0);ctx.lineTo(x1,h);ctx.stroke();}
      if(x2>=0&&x2<=w){ctx.beginPath();ctx.moveTo(x2,0);ctx.lineTo(x2,h);ctx.stroke();}
      ctx.setLineDash([]);
    }
  }
  const selS=Math.min(state.selStart,state.selEnd), selE=Math.max(state.selStart,state.selEnd);
  if(selE>selS){
    const sx=smpToX(selS,w,n), ex=smpToX(selE,w,n);
    if(ex>0&&sx<w){
      const drawSx=Math.max(0,sx), drawEx=Math.min(w,ex);
      ctx.fillStyle="rgba(167,139,250,0.14)";
      ctx.fillRect(drawSx,0,Math.max(1,drawEx-drawSx),h);
      ctx.strokeStyle="rgba(167,139,250,0.8)";
      if(sx>=0&&sx<=w){ctx.beginPath();ctx.moveTo(sx,0);ctx.lineTo(sx,h);ctx.stroke();}
      if(ex>=0&&ex<=w){ctx.beginPath();ctx.moveTo(ex,0);ctx.lineTo(ex,h);ctx.stroke();}
    }
  }
  ctx.strokeStyle="#7dd3fc"; ctx.lineWidth=1; ctx.beginPath();
  for(let x=0;x<w;x++){
    const s0=Math.floor(startSmp+(x/w)*visibleCount);
    const s1=Math.floor(startSmp+((x+1)/w)*visibleCount);
    let mn=1, mx=-1;
    for(let i=s0;i<s1;i++){const v=floats[i];if(v<mn)mn=v;if(v>mx)mx=v;}
    if(mn>mx){mn=0;mx=0;}
    ctx.moveTo(x+0.5,mid-mx*amp); ctx.lineTo(x+0.5,mid-mn*amp);
  }
  ctx.stroke();
  ctx.strokeStyle="rgba(148,163,184,0.25)";
  ctx.beginPath();ctx.moveTo(0,mid);ctx.lineTo(w,mid);ctx.stroke();

  $("waveInfo").textContent=t("wave_info", {count: n.toLocaleString(), duration: (n/(s.sampleRate||1)).toFixed(2), bit_depth: fmt(s).is16?"16-bit":"8-bit"});
  $("selInfo").textContent=selE>selS?t("selection_count", {count: (selE-selS).toLocaleString()}):t("selection_empty");
}
function canvasPt(e){const cv=$("waveCanvas"), r=cv.getBoundingClientRect(); return {x:clamp(e.clientX-r.left,0,r.width),y:clamp(e.clientY-r.top,0,r.height),w:r.width,h:r.height};}
function yToAmp(y,h){return clamp((h/2-y)/(h/2*0.92),-1,1);}

function pushUndo(s){
  state.undo.push({ref:{sample:s},floats:ensureFloat(s).slice()});
  if(state.undo.length>16)state.undo.shift();
}
function undo(){
  const it=state.undo.pop();
  if(!it){showStatus(t("no_undo"),"bad");return;}
  it.ref.sample._float=it.floats;
  commitFloat(it.ref.sample);
  state.selStart=state.selEnd=0;
  renderSampleEditor(); render();
  showStatus(t("undo_done"),"ok");
}
function editRange(s){
  const n=ensureFloat(s).length;
  let a=Math.min(state.selStart,state.selEnd), b=Math.max(state.selStart,state.selEnd);
  if(b<=a){a=0;b=n;}
  return {a:clamp(a,0,n),b:clamp(b,0,n)};
}
function applyEdit(kind,param){
  const s=state.selSample; if(!s)return;
  const f=ensureFloat(s), n=f.length; if(!n)return;
  pushUndo(s);
  const {a,b}=editRange(s);
  if(kind==="normalize"){
    let pk=0;
    for(let i=a;i<b;i++)pk=Math.max(pk,Math.abs(f[i]));
    if(pk>1e-5){const g=0.98/pk;for(let i=a;i<b;i++)f[i]=clamp(f[i]*g,-1,1);}
  } else if(kind==="fadeIn"||kind==="fadeOut"){
    const len=Math.max(1,b-a);
    for(let i=0;i<len;i++){
      const idx=a+i, t=i/(len-1||1);
      f[idx]=clamp(f[idx]*(kind==="fadeIn"?t:1-t),-1,1);
    }
  } else if(kind==="silence"){
    for(let i=a;i<b;i++)f[i]=0;
  } else if(kind==="reverse"){
    for(let i=0;i<Math.floor((b-a)/2);i++){const x=a+i, y=b-1-i, t=f[x]; f[x]=f[y]; f[y]=t;}
    if(a===0&&b===n){
      const lp=loopInfo(s), bps=fmt(s).bps;
      s.loopStart=Math.round((n-lp.end)*bps); s.loopEnd=Math.round((n-lp.start)*bps);
    }
  } else if(kind==="amplify"){
    const g=Number(param); if(!isFinite(g))return;
    for(let i=a;i<b;i++)f[i]=clamp(f[i]*g,-1,1);
  } else if(kind==="dc"){
    let sum=0;
    for(let i=a;i<b;i++)sum+=f[i];
    const avg=sum/Math.max(1,b-a);
    for(let i=a;i<b;i++)f[i]=clamp(f[i]-avg,-1,1);
  }
  commitFloat(s);
  renderSampleEditor(); render();
  const operationKey = {fadeIn: "fade_in", fadeOut: "fade_out", dc: "remove_dc"}[kind] || kind;
  showStatus(t("edit_done", {operation: t(operationKey)}),"ok");
}

function bindCanvas(){
  const cv=$("waveCanvas");
  cv.addEventListener("wheel",e=>{
    if(!state.selSample)return;
    e.preventDefault();
    if(e.shiftKey){
      const n=ensureFloat(state.selSample).length;
      const visible=n/state.zoom;
      const delta=(e.deltaY||e.deltaX)/cv.getBoundingClientRect().width;
      state.offset+=delta*visible; clampView(n); drawWave();
    } else {
      const rect=cv.getBoundingClientRect();
      const mouseX=e.clientX-rect.left;
      const factor=e.deltaY<0?1.15:1/1.15;
      zoomCanvas(factor,mouseX);
    }
  },{passive:false});

  cv.addEventListener("mousedown",e=>{
    const s=state.selSample; if(!s)return;
    if(e.button===1||(e.button===0&&e.altKey)){
      e.preventDefault();
      state.panning={startX:e.clientX,startOffset:state.offset};
      cv.style.cursor="grabbing"; return;
    }
    const f=ensureFloat(s), n=f.length; if(!n)return;
    ensureAudio();
    const pt=canvasPt(e), idx=xToSmp(pt.x,pt.w,n);
    if(state.tool==="select"){
      state.selStart=idx; state.selEnd=idx;
      state.drag={mode:"sel",s,f,n};
    } else {
      pushUndo(s);
      state.drag={mode:"pen",s,f,n,last:idx};
      f[idx]=yToAmp(pt.y,pt.h);
    }
    drawWave();
  });
  cv.addEventListener("mousemove",e=>{
    if(state.panning){
      const n=ensureFloat(state.selSample).length;
      const dx=e.clientX-state.panning.startX;
      const w=cv.getBoundingClientRect().width;
      const visible=n/state.zoom;
      state.offset=state.panning.startOffset-(dx/w)*visible;
      clampView(n); drawWave(); return;
    }
    if(!state.drag)return;
    const {mode,s,f,n}=state.drag;
    const pt=canvasPt(e), idx=xToSmp(pt.x,pt.w,n);
    if(mode==="sel"){ state.selEnd=idx; }
    else {
      const amp=yToAmp(pt.y,pt.h);
      let a=state.drag.last, b=idx;
      if(a>b)[a,b]=[b,a];
      const steps=Math.max(1,b-a);
      for(let i=a;i<=b;i++)f[i]=amp;
      state.drag.last=idx;
    }
    drawWave();
  });
  cv.addEventListener("mouseup",e=>{
    if(state.panning){state.panning=null; cv.style.cursor="crosshair"; return;}
    if(!state.drag)return;
    if(state.drag.mode==="pen"){ commitFloat(state.drag.s); renderSampleEditor(); showStatus(t("waveform_drawn"),"ok"); }
    state.drag=null; drawWave();
  });
  cv.addEventListener("mouseleave",e=>{
    if(state.panning){state.panning=null; cv.style.cursor="crosshair";}
    if(state.drag){ if(state.drag.mode==="pen"){ commitFloat(state.drag.s); renderSampleEditor(); } state.drag=null; drawWave(); }
  });
  cv.addEventListener("touchstart",e=>{
    if(e.touches.length===1){const t=e.touches[0];cv.dispatchEvent(new MouseEvent("mousedown",{clientX:t.clientX,clientY:t.clientY,bubbles:true}));e.preventDefault();}
  },{passive:false});
  cv.addEventListener("touchmove",e=>{
    if(e.touches.length===1){const t=e.touches[0];cv.dispatchEvent(new MouseEvent("mousemove",{clientX:t.clientX,clientY:t.clientY,bubbles:true}));e.preventDefault();}
  },{passive:false});
  cv.addEventListener("touchend",e=>{cv.dispatchEvent(new MouseEvent("mouseup",{bubbles:true}));e.preventDefault();},{passive:false});
  window.addEventListener("resize",drawWave);
}

/* ---------- Library ---------- */
async function addPatchEntries(entries){
  const project = state.projects.find(p => p.id === state.currentProjectId);
  if(!project) {
    requestProjectForImport();
    return false;
  }

  for(const entry of entries){
    if(!entry.id) entry.id=uid(entry.source&&entry.source.startsWith("sf2")?"sf2":"pat");
    if(!entry.source) entry.source="pat";
  }

  initBankFields(entries, project);   // ← tambahkan

  const updatedProject = {...project, patchIds: [...(project.patchIds || [])]};
  for(const entry of entries) {
    if(!updatedProject.patchIds.includes(entry.id)) updatedProject.patchIds.push(entry.id);
  }

  await dbSaveProjectAndPatches(updatedProject, entries);
  project.patchIds = updatedProject.patchIds;
  state.patches.push(...entries);
  if(entries.length>0) selectPatch(entries[0].id);
  else render();
  renderProjects();
  renderBankManager();   // ← tambahkan
  return true;
}

function selectPatch(id){
  const entry=state.patches.find(p=>p.id===id);
  if(!entry)return;
  state.currentPatchId=id;
  state.patch=entry.patch;
  state.selInst=0;
  state.selSample=null;
  state.selStart=state.selEnd=0;
  state.zoom=1; state.offset=0;
  updateZoomUI();
  render();
}

function deletePatchById(id){
  const entry=state.patches.find(p=>p.id===id);
  if(!entry)return;
  openConfirmationDialog(t("delete_patch_title"),t("confirm_delete_patch", {name: entry.name}),t("delete"),()=>removePatchById(id));
}

async function removePatchById(id){
  const entry=state.patches.find(p=>p.id===id);
  if(!entry)return;
  const projects=state.projects.map(project=>({
    ...project,
    patchIds:(project.patchIds || []).filter(patchId=>patchId!==id)
  }));
  await dbDeletePatchAndUpdateProjects(id,projects);
  state.patches=state.patches.filter(p=>p.id!==id);
  state.projects=projects;
  if(state.currentPatchId===id){
    if(state.patches.length>0) selectPatch(state.patches[0].id);
    else { state.currentPatchId=null; state.patch=null; render(); }
  } else {
    renderLibrary();
  }
  renderProjects();
}

function openConfirmationDialog(title,message,confirmLabel,action){
  pendingConfirmationAction=action;
  $("confirmationTitle").textContent=title;
  $("confirmationMessage").textContent=message;
  $("confirmationError").textContent="";
  $("btnConfirmAction").textContent=confirmLabel;
  $("confirmActionDialog").hidden=false;
  $("btnCancelAction").focus();
}

function closeConfirmationDialog(force=false){
  if(!force && $("btnConfirmAction").disabled)return;
  pendingConfirmationAction=null;
  $("confirmActionDialog").hidden=true;
}

function showAlert(key,values={}){
  queuedAlerts.push({key,values});
  if(!activeAlert)openNextAlert();
}

function openNextAlert(){
  activeAlert=queuedAlerts.shift() || null;
  if(!activeAlert){
    $("alertDialog").hidden=true;
    return;
  }
  $("alertTitle").textContent=t("alert_title");
  $("alertMessage").textContent=t(activeAlert.key,activeAlert.values);
  $("alertDialog").hidden=false;
  $("btnCloseAlert").focus();
}

function closeAlert(){
  activeAlert=null;
  openNextAlert();
}

async function runConfirmationAction(){
  if(!pendingConfirmationAction || $("btnConfirmAction").disabled)return;
  const confirmButton=$("btnConfirmAction");
  const cancelButton=$("btnCancelAction");
  confirmButton.disabled=true;
  cancelButton.disabled=true;
  $("confirmationError").textContent="";
  try{
    await pendingConfirmationAction();
    closeConfirmationDialog(true);
  }catch(err){
    console.error("Confirmation action failed:",err);
    $("confirmationError").textContent=t("confirmation_action_failed");
  }finally{
    confirmButton.disabled=false;
    cancelButton.disabled=false;
  }
}

async function clearLibrary(){
  if(state.patches.length===0)return;
  $("clearLibraryMessage").textContent = t("confirm_clear_library", {count: state.patches.length});
  $("clearLibraryError").textContent = "";
  $("clearLibraryDialog").hidden = false;
  $("btnCancelClearLibrary").focus();
}

function closeClearLibraryDialog(force = false){
  if(!force && $("btnConfirmClearLibrary").disabled)return;
  $("clearLibraryDialog").hidden = true;
}

async function confirmClearLibrary(){
  if(state.patches.length===0){
    closeClearLibraryDialog(true);
    return;
  }
  const confirmButton=$("btnConfirmClearLibrary");
  const cancelButton=$("btnCancelClearLibrary");
  confirmButton.disabled=true;
  cancelButton.disabled=true;
  $("clearLibraryError").textContent="";
  try{
    const projects=state.projects.map(project=>({...project,patchIds:[]}));
    await dbClearLibraryAndProjects(projects);
    state.projects=projects;
    state.patches=[];
    state.currentPatchId=null;
    state.patch=null;
    closeClearLibraryDialog(true);
    render();
    renderProjects();
    showStatus(t("library_cleared"),"ok");
  }catch(err){
    console.error("Clear library error:",err);
    $("clearLibraryError").textContent=t("library_clear_failed");
  }finally{
    confirmButton.disabled=false;
    cancelButton.disabled=false;
  }
}

function scheduleSave(){
  if(!state.currentPatchId)return;
  if(state.saveTimer)clearTimeout(state.saveTimer);
  state.saveTimer=setTimeout(async()=>{
    const entry=state.patches.find(p=>p.id===state.currentPatchId);
    if(!entry)return;
    entry.name=(state.patch.header.description||entry.name||t("patch")).substring(0,64);
    try{
      await dbPutMany(STORE, [cleanEntryForStorage(entry)]);
    }catch(err){
      console.error("Auto-save error:",err);
    }
  },500);
}

/* ---------- Projects ---------- */
async function loadProjects() {
  const entries = await dbGetAll(STORE_PROJECTS);
  state.projects = entries;
}

async function saveProject(project) {
  await dbPutMany(STORE_PROJECTS, [project]);
}

async function createProject(name) {
  const project = {
    id: uid("proj"),
    name: name || t("create_project_default", {number: state.projects.length + 1}),
    patchIds: []
  };
  await saveProject(project);
  state.projects.push(project);
  state.currentProjectId = project.id;
  state.libraryView = "project";
  invalidateTimidityPlayer();
  renderProjects();
  renderLibrary();
  showStatus(t("project_created", {name: project.name}), "ok");
}

async function confirmNewProject() {
  const dialog = $("newProjectDialog");
  const nameInput = $("newProjectName");
  const error = $("newProjectError");
  const confirmButton = $("btnConfirmNewProject");
  const name = nameInput.value.trim();
  if (!name) {
    error.textContent = t("project_name_required");
    nameInput.focus();
    return;
  }

  confirmButton.disabled = true;
  error.textContent = "";
  try {
    await createProject(name);
    dialog.hidden = true;
  } catch (err) {
    console.error("Create project error:", err);
    error.textContent = t("project_save_failed");
  } finally {
    confirmButton.disabled = false;
  }
}

async function deleteProject(id) {
  const project = state.projects.find(p => p.id === id);
  if (!project) return;
  const projectPatchIds = [...new Set(Array.isArray(project.patchIds) ? project.patchIds : [])];
  const exclusivePatchIds = projectPatchIds.filter(patchId =>
    !state.projects.some(other =>
      other.id !== id && Array.isArray(other.patchIds) && other.patchIds.includes(patchId)
    )
  );

  if (exclusivePatchIds.includes(state.currentPatchId) && state.saveTimer) {
    clearTimeout(state.saveTimer);
    state.saveTimer = null;
  }
  await dbDeleteProjectAndPatches(id, exclusivePatchIds);
  if (state.currentProjectId === id && (midiProgress.playing || midiProgress.paused)) {
    stopMidi();
  }
  state.projects = state.projects.filter(p => p.id !== id);
  state.patches = state.patches.filter(patch => !exclusivePatchIds.includes(patch.id));
  if (state.currentProjectId === id) {
    state.currentProjectId = state.projects.length > 0 ? state.projects[0].id : null;
    state.libraryView = "project";
    invalidateTimidityPlayer();
  }

  if (exclusivePatchIds.includes(state.currentPatchId)) {
    if (state.patches.length > 0) {
      selectPatch(state.patches[0].id);
    } else {
      state.currentPatchId = null;
      state.patch = null;
      render();
    }
  } else {
    renderLibrary();
  }
  renderProjects();
  showStatus(t("project_deleted"), "ok");
}

function requestDeleteProject(id) {
  if (isMidiRendering) return;
  const project = state.projects.find(entry => entry.id === id);
  if (!project) return;
  pendingProjectDeletionId = id;
  $("deleteProjectMessage").textContent = t("confirm_delete_project", {name: project.name});
  $("deleteProjectError").textContent = "";
  $("deleteProjectDialog").hidden = false;
  $("btnCancelDeleteProject").focus();
}

function closeDeleteProjectDialog(force = false) {
  if (!force && $("btnConfirmDeleteProject").disabled) return;
  pendingProjectDeletionId = null;
  $("deleteProjectDialog").hidden = true;
}

async function confirmDeleteProject() {
  if (!pendingProjectDeletionId) return;
  const confirmButton = $("btnConfirmDeleteProject");
  const cancelButton = $("btnCancelDeleteProject");
  confirmButton.disabled = true;
  cancelButton.disabled = true;
  $("deleteProjectError").textContent = "";
  try {
    await deleteProject(pendingProjectDeletionId);
    closeDeleteProjectDialog(true);
  } catch (err) {
    console.error("Delete project error:", err);
    $("deleteProjectError").textContent = t("project_delete_failed");
  } finally {
    confirmButton.disabled = false;
    cancelButton.disabled = false;
  }
}

function addCurrentPatchToProject() {
  if (!state.projects.some(project => project.id === state.currentProjectId)) {
    requestProjectForImport();
    return;
  }
  openAddPatchDialog();
}

function populateGeneratedProgramOptions() {
  if (!projectPatchGenerator) projectPatchGenerator = new ProjectPatchGenerator();
  const isDrum = $("patchGeneratorType").value === "drum";
  const select = $("patchGeneratorProgram");
  const previousValue = select.value;
  select.replaceChildren();
  for (const program of projectPatchGenerator.getPrograms(isDrum)) {
    const option = document.createElement("option");
    option.value = String(program.id);
    option.textContent = `${String(program.id).padStart(isDrum ? 2 : 3, "0")} - ${program.name}`;
    select.appendChild(option);
  }
  if ([...select.options].some(option => option.value === previousValue)) {
    select.value = previousValue;
  }
}

function openAddPatchDialog() {
  $("addPatchError").textContent = "";
  populateGeneratedProgramOptions();
  $("addPatchDialog").hidden = false;
  $("btnChooseProjectPatchFile").focus();
}

function closeAddPatchDialog() {
  if ($("btnGenerateProjectPatch").disabled) return;
  $("addPatchDialog").hidden = true;
}

async function generateProjectPatch() {
  if ($("btnGenerateProjectPatch").disabled) return;
  const project = state.projects.find(entry => entry.id === state.currentProjectId);
  if (!project) {
    closeAddPatchDialog();
    requestProjectForImport();
    return;
  }

  const generateButton = $("btnGenerateProjectPatch");
  generateButton.disabled = true;
  $("addPatchError").textContent = "";
  try {
    if (!projectPatchGenerator) projectPatchGenerator = new ProjectPatchGenerator();
    const isDrum = $("patchGeneratorType").value === "drum";
    const generated = projectPatchGenerator.generate({
      isDrum,
      program: $("patchGeneratorProgram").value
    });
    const entry = {
      id: uid("generated"),
      name: generated.name,
      source: "generated",
      gmProgram: generated.program,
      gmBank: isDrum ? 128 : 0,
      ...(isDrum ? {drumSet: 0} : {}),
      patch: generated.patch
    };
    if (await addPatchEntries([entry])) {
      $("addPatchDialog").hidden = true;
      showStatus(t("patch_generated", {name: generated.name}), "ok");
    }
  } catch(err) {
    console.error("Generated patch error:", err);
    $("addPatchError").textContent = t("patch_generation_failed", {message: err.message});
  } finally {
    generateButton.disabled = false;
  }
}

async function handleProjectPatchFile(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  e.target.value = "";
  if (!state.projects.some(project => project.id === state.currentProjectId)) {
    closeAddPatchDialog();
    requestProjectForImport();
    return;
  }

  try {
    const bytes = await file.arrayBuffer();
    if (detectFileType(bytes) !== "pat") {
      throw new Error(t("pat_file_required"));
    }
    const patch = parsePAT(bytes);
    const entry = {
      id: uid("pat"),
      name: (patch.header.description || file.name.replace(/\.pat$/i, "")).substring(0, 64),
      source: "pat",
      gmProgram: -1,
      gmBank: 0,
      patch
    };
    if (await addPatchEntries([entry])) {
      $("addPatchDialog").hidden = true;
      const count = allSamples().length;
      showStatus(t("file_loading", {
        filename: file.name,
        samples: t(count === 1 ? "sample_count_one" : "sample_count_many", {count})
      }), "ok");
    }
  } catch(err) {
    console.error("Project PAT import error:", err);
    $("addPatchError").textContent = t("patch_import_failed", {message: err.message});
  }
}

function requestProjectForImport() {
  $("projectRequiredDialog").hidden = false;
  $("btnCreateProjectFromRequired").focus();
}

function closeProjectRequiredDialog() {
  $("projectRequiredDialog").hidden = true;
}

function openNewProjectDialog() {
  const newProjectName = $("newProjectName");
  $("newProjectError").textContent = "";
  newProjectName.value = t("create_project_default", {number: state.projects.length + 1});
  $("newProjectDialog").hidden = false;
  newProjectName.focus();
  newProjectName.select();
}

function removePatchFromProject(projectId, patchId) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) return;
  project.patchIds = project.patchIds.filter(id => id !== patchId);
  saveProject(project);
  renderProjects();
renderLibrary();
}

function getProjectPatches(project) {
  return project.patchIds.map(id => state.patches.find(p => p.id === id)).filter(Boolean);
}

function resamplePcmTo(pcm, fromRate, toRate, is16) {
  if (!fromRate || !toRate || fromRate === toRate) return null;
  const bps = is16 ? 2 : 1;
  const fromN = Math.floor(pcm.length / bps);
  if (fromN < 16) return null;                       // terlalu pendek
  const toN = Math.floor(fromN * toRate / fromRate);
  if (toN < 16) return null;                         // hasil terlalu pendek
  const out = new Uint8Array(toN * bps);
  const ratio = fromRate / toRate;

  if (is16) {
    const src = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
    const dst = new DataView(out.buffer);
    for (let i = 0; i < toN; i++) {
      const s = i * ratio, s0 = s | 0, frac = s - s0;
      const s1 = Math.min(s0 + 1, fromN - 1);
      const a = src.getInt16(s0 * 2, true);
      const b = src.getInt16(s1 * 2, true);
      dst.setInt16(i * 2, Math.round(a + (b - a) * frac), true);
    }
  } else {
    for (let i = 0; i < toN; i++) {
      const s = i * ratio, s0 = s | 0, frac = s - s0;
      const s1 = Math.min(s0 + 1, fromN - 1);
      const a = pcm[s0], b = pcm[s1];
      out[i] = Math.round(a + (b - a) * frac);
    }
  }
  return out;
}

/* ---------- Validasi Patch untuk TiMidity ---------- */
function validateAndSanitizePatch(patch) {
  if (!patch) throw new Error("Invalid patch object");
  if (!patch.header) {
    patch.header = { 
      magic: MAGIC, gravisId: GRAVIS_ID, description: "Recovered", 
      voices: 14, channels: 0, waveForms: 0, masterVolume: 127, dataSize: 0, 
      reserved: new Uint8Array(36) 
    };
  }
  
  // Pastikan voices dan masterVolume valid
  if (typeof patch.header.voices !== 'number' || patch.header.voices <= 0 || patch.header.voices > 64) {
    patch.header.voices = 14;
  }
  if (typeof patch.header.masterVolume !== 'number' || patch.header.masterVolume < 0 || patch.header.masterVolume > 127) {
    patch.header.masterVolume = 127;
  }

  if (!patch.instruments || !Array.isArray(patch.instruments) || patch.instruments.length === 0) {
    throw new Error("Patch has no instruments");
  }

  let totalSamples = 0;
  for (const inst of patch.instruments) {
    if (!inst.layers || !Array.isArray(inst.layers) || inst.layers.length === 0) {
      throw new Error("Instrument has no layers");
    }
    for (const layer of inst.layers) {
      if (!layer.samples || !Array.isArray(layer.samples) || layer.samples.length === 0) {
        throw new Error("Layer has no samples");
      }
      for (const s of layer.samples) {
        if (!s.pcm || !(s.pcm instanceof Uint8Array) || s.pcm.length === 0) {
          throw new Error("Sample has empty or invalid PCM data");
        }
        
        const bps = (s.modes & M16) ? 2 : 1;
        const totalFrames = Math.floor(s.pcm.length / bps);
        if (totalFrames === 0) {
          throw new Error("Sample PCM data too short");
        }

        // Perbaiki sampleRate (Cegah pembagian nol / resampling ekstrem)
        if (typeof s.sampleRate !== 'number' || s.sampleRate <= 0 || s.sampleRate > 192000) {
          s.sampleRate = 22050;
        } else if (s.sampleRate < 4000) {
          s.sampleRate = 4000; 
        }

        // Perbaiki rootFreq
        if (typeof s.rootFreq !== 'number' || s.rootFreq <= 0) {
          s.rootFreq = 440 * 1000;
        }

        // Perbaiki scaleFactor
        if (typeof s.scaleFactor !== 'number' || s.scaleFactor <= 0) {
          s.scaleFactor = 1024;
        }
        if (typeof s.scaleFreq !== 'number') {
          s.scaleFreq = 60;
        }

        // Perbaiki array envelope
        if (!Array.isArray(s.envRates) || s.envRates.length !== 6) {
          s.envRates = [0, 0, 0, 0, 0, 0];
        }
        if (!Array.isArray(s.envOffsets) || s.envOffsets.length !== 6) {
          s.envOffsets = [0, 0, 0, 0, 0, 0];
        }

        // Validasi loop (cegah infinite loop di TiMidity)
        if (s.modes & MLOOP) {
          if (s.loopStart >= s.loopEnd || s.loopEnd > s.pcm.length) {
            s.modes &= ~MLOOP;
            s.loopStart = 0;
            s.loopEnd = 0;
          } else if (s.loopEnd - s.loopStart < 4 * bps) {
            s.modes &= ~MLOOP;
            s.loopStart = 0;
            s.loopEnd = 0;
          }
        }
        totalSamples++;
      }
    }
  }
  
  if (totalSamples > 255) {
    throw new Error(`Too many samples (${totalSamples}), max is 255`);
  }
  
  return patch;
}

function isPatchSafeForTimidity(patch) {
  if (!patch || !patch.instruments || !Array.isArray(patch.instruments) || patch.instruments.length === 0) return false;
  let totalSamples = 0;
  for (const inst of patch.instruments) {
    if (!inst.layers || !Array.isArray(inst.layers) || inst.layers.length === 0) return false;
    for (const layer of inst.layers) {
      if (!layer.samples || !Array.isArray(layer.samples) || layer.samples.length === 0) return false;
      for (const s of layer.samples) {
        if (!s.pcm || !(s.pcm instanceof Uint8Array) || s.pcm.length === 0) return false;
        const bps = (s.modes & M16) ? 2 : 1;
        const totalFrames = Math.floor(s.pcm.length / bps);
        if (totalFrames === 0) return false;
        totalSamples++;
      }
    }
  }
  return totalSamples > 0 && totalSamples <= 255;
}

function createSilentPatch() {
  const silentPcm = new Uint8Array(64); // 32 frame hening
  const sample = {
    name: "SILENT", fractions: 0, dataSize: silentPcm.length,
    loopStart: 0, loopEnd: silentPcm.length, sampleRate: 22050,
    lowFreq: 0, highFreq: 20000000, rootFreq: 440000,
    tune: 0, balance: 7, envRates: [0,0,0,0,0,0], envOffsets: [255,255,255,0,0,0],
    tremoloSweep: 0, tremoloRate: 0, tremoloDepth: 0,
    vibratoSweep: 0, vibratoRate: 0, vibratoDepth: 0,
    modes: M16, scaleFreq: 60, scaleFactor: 1024,
    reserved: new Uint8Array(36), pcm: silentPcm
  };
  const patch = {
    header: {
      magic: MAGIC, gravisId: GRAVIS_ID, description: "Silent Fallback",
      voices: 14, channels: 0, waveForms: 0, masterVolume: 127, dataSize: 0,
      reserved: new Uint8Array(36)
    },
    instruments: [{
      instrument: 0, name: "Silent", size: 0, reserved: new Uint8Array(40),
      layers: [{ duplicate: 0, layer: 0, layerSize: 0, reserved: new Uint8Array(40), samples: [sample] }]
    }]
  };
  return writePAT(patch);
}

function writeTimidityPatch(patch) {
  validateAndSanitizePatch(patch);
  const norm = cleanPatchForStorage(patch);
  const inst = norm.instruments[0];
  if (!inst) throw new Error(t("empty_patch"));

  const samples = norm.instruments.flatMap(instrument =>
    instrument.layers.flatMap(layer => layer.samples)
  );
  if (samples.length === 0) throw new Error(t("no_samples"));
  if (samples.length > 255) {
    throw new Error(t("too_many_samples", {count: samples.length}));
  }

  for (const sample of samples) {
    if (sample.rootFreq > 0 && sample.rootFreq < 8000) {
      sample.rootFreq = sample.rootFreq <= 127
        ? Math.round(440 * Math.pow(2, (sample.rootFreq - 69) / 12) * 1000)
        : Math.round(sample.rootFreq * 1000);
      if (sample.lowFreq > 0) sample.lowFreq = Math.round(sample.lowFreq * 1000);
      if (sample.highFreq > 0) sample.highFreq = Math.round(sample.highFreq * 1000);
    }
  }

    // === RESAMPLE ke 44100 Hz (fix pitch 2x) ===
  const OUT_RATE = 22050;
  for (const s of samples) {
    if (!s.sampleRate || s.sampleRate === OUT_RATE) continue;
    const is16 = (s.modes & M16) !== 0;
    const ratio = OUT_RATE / s.sampleRate;
    const wasLoop = (s.modes & MLOOP) !== 0;
    const oldStart = s.loopStart, oldEnd = s.loopEnd;

    const resampled = resamplePcmTo(s.pcm, s.sampleRate, OUT_RATE, is16);
    if (!resampled) continue;    // tidak bisa resample, biarkan apa adanya

    s.pcm = resampled;
    s.dataSize = s.pcm.length;
    s.sampleRate = OUT_RATE;
    s._float = null;

    if (wasLoop) {
      const bps = is16 ? 2 : 1;
      const totalN = Math.floor(s.pcm.length / bps);
      const ns = Math.round(oldStart * ratio);
      const ne = Math.round(oldEnd * ratio);
      if (ne - ns >= 4 && ne <= totalN) {
        s.loopStart = ns;
        s.loopEnd = ne;
      } else {
        // Loop collapse → matikan agar tidak hang
        s.modes &= ~MLOOP;
        s.loopStart = 0;
        s.loopEnd = 0;
      }
    }
  }
  // === END RESAMPLE ===

  const usesUnrestrictedSampleRanges = samples.length > 1 && samples.every(sample =>
    sample.lowFreq === 0 &&
    sample.sampleRate > 0 &&
    sample.highFreq >= sample.sampleRate * 500
  );
  if (usesUnrestrictedSampleRanges) {
    const rootFrequencies = [...new Set(samples
      .map(sample => sample.rootFreq)
      .filter(frequency => Number.isFinite(frequency) && frequency > 0))]
      .sort((a, b) => a - b);
    if (rootFrequencies.length > 1) {
      const ranges = new Map();
      rootFrequencies.forEach((frequency, index) => {
        const previous = rootFrequencies[index - 1];
        const next = rootFrequencies[index + 1];
        ranges.set(frequency, {
          lowFreq: previous ? Math.floor(Math.sqrt(previous * frequency)) : 0,
          highFreq: next ? Math.ceil(Math.sqrt(frequency * next)) : 200000
        });
      });
      for (const sample of samples) {
        const range = ranges.get(sample.rootFreq);
        if (range) Object.assign(sample, range);
      }
    }
  }

  return writePAT({
    header: norm.header,
    instruments: [{
      instrument: 0,
      name: inst.name || "Inst",
      size: 0,
      reserved: new Uint8Array(40),
      layers: [{
        duplicate: 0, layer: 0, layerSize: 0,
        reserved: new Uint8Array(40),
        samples
      }]
    }]
  });
}

function generateProjectTimidityCfg(project) {
  const patches = getProjectPatches(project);
  const melodic = patches.filter(p => (p.gmBank ?? 0) !== 128 && (p.gmProgram ?? -1) !== -1);
  const drums   = patches.filter(p => (p.gmBank ?? 0) === 128 && (p.gmProgram ?? -1) !== -1);

  let cfg = "# Generated by GUS Patch Editor for Player\n";
  cfg += "dir /gus-patch\n\n";

  // Melodic (Menggunakan targetBank)
  const melodicByBank = {};
  for (const p of melodic) {
    const b = p.targetBank ?? 0;
    if (!melodicByBank[b]) melodicByBank[b] = [];
    melodicByBank[b].push(p);
  }
  for (const b of Object.keys(melodicByBank).sort((a,b)=>a-b)) {
    cfg += `bank ${b}\n`;
    for (const p of melodicByBank[b]) {
      cfg += `${p.gmProgram} ${sanitizeFilename(p.name)}.pat\n`;
    }
    cfg += "\n";
  }

  // Drums (Menggunakan targetBank sebagai Drum Set)
  if (drums.length > 0) {
    const drumGroups = {};
    for (const p of drums) {
      const kitId = p.targetBank ?? 0;
      if (!drumGroups[kitId]) drumGroups[kitId] = [];
      drumGroups[kitId].push(p);
    }
    const kitIds = Object.keys(drumGroups).map(Number).sort((a,b)=>a-b);
    for (const kitId of kitIds) {
      cfg += `drumset ${kitId}\n`;
      for (const p of drumGroups[kitId].sort((a,b)=>a.gmProgram - b.gmProgram)) {
        cfg += `${p.gmProgram} ${sanitizeFilename(p.name)}.pat\n`;
      }
      cfg += "\n";
    }
  }

  // Fallback
  if (melodic.length === 0 && drums.length === 0 && patches.length > 0) {
    cfg += "bank 0\n";
    patches.slice(0, 128).forEach((p, i) => {
      cfg += `${i} ${sanitizeFilename(p.name)}.pat\n`;
    });
  }

  return cfg;
}

async function exportProjectWithConfig(project, patches, mode) {
  try {
    const zipFiles = [];
    const usedPaths = new Set();
    const patchPaths = new Map();

    for (const entry of patches) {
      const clean = cleanPatchForStorage(entry.patch);
      const bytes = writePAT(clean);

      const isDrum = (entry.gmBank ?? 0) === 128;
      const groupId = entry.targetBank ?? entry.originalOrder ?? 0;
      const kind = isDrum ? "drum" : "tone";
      const folderPath = `${groupId}/${kind}/`;

      let filename = sanitizeFilename(entry.name) + ".pat";
      let suffix = 1;
      const original = filename;
      while (usedPaths.has(folderPath + filename)) {
        filename = original.replace(".pat", `_${suffix++}.pat`);
      }
      usedPaths.add(folderPath + filename);

      patchPaths.set(entry.id, { folderPath, filename });
      zipFiles.push({ name: folderPath + filename, data: bytes, entry });
    }

    zipFiles.sort((a, b) => {
      const bankA = a.entry.targetBank ?? 0;
      const bankB = b.entry.targetBank ?? 0;
      if (bankA !== bankB) return bankA - bankB;
      return (a.entry.gmProgram ?? -1) - (b.entry.gmProgram ?? -1);
    });

    const manifestData = zipFiles.map(zf => ({
      filename: zf.name,
      patchName: zf.entry.name,
      gmProgram: zf.entry.gmProgram ?? -1,
      originalOrder: zf.entry.originalOrder ?? 0,
      userOrder: zf.entry.userOrder ?? 0,
      targetBank: zf.entry.targetBank ?? 0,
      description: zf.entry.patch.header.description || ""
    }));
    zipFiles.push({
      name: "manifest.json",
      data: new TextEncoder().encode(JSON.stringify(manifestData, null, 2))
    });

    zipFiles.push({
      name: "timidity.cfg",
      data: new TextEncoder().encode(generateProjectTimidityCfgForZip(project, patchPaths))
    });

    const zipBytes = createZip(zipFiles);
    const blob = new Blob([zipBytes], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/[^\w\-]+/g, "_")}_${mode}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showStatus(t("export_banks_done", {count: patches.length}), "ok");
  } catch (err) {
    console.error(err);
    showStatus(t("project_export_failed", {message: err.message}), "bad");
  }
}

const patchBufferCache = new Map(); // Tambahkan di dekat deklarasi state

function invalidateTimidityPlayer() {
  if (timidityPlayer) {
    try { timidityPlayer.shutdown(); } catch(e) {}
    timidityPlayer = null;
  }
  patchBufferCache.clear(); // Bersihkan cache saat player di-reset
}

function getProjectPatchData(bank, isDrum, program, file) {
  if (!state.currentProjectId) return null;
  const project = state.projects.find(p => p.id === state.currentProjectId);
  if (!project) return null;
  const patches = getProjectPatches(project);
  if (patches.length === 0) return null;

  // 1) Match by filename dulu
  const reqName = String(file||"").split(/[\\/]/).pop().replace(/\.pat$/i,"").toLowerCase();
  let target = patches.find(p => sanitizeFilename(p.name).toLowerCase() === reqName);

  // 2) Match by targetBank/program (Sesuai dengan timidity.cfg preview)
  if (!target) {
    target = patches.find(p =>
      isDrum
        ? (p.gmBank === 128 && p.gmProgram === program && (p.targetBank ?? 0) === bank)
        : ((p.targetBank ?? 0) === bank && (p.gmProgram ?? -1) === program)
    );
  }

  // 3) Fallback ke original bank jika tidak ditemukan
  if (!target) {
    target = patches.find(p =>
      isDrum
        ? (p.gmBank === 128 && p.gmProgram === program && (p.originalOrder ?? 0) === bank)
        : ((p.gmBank ?? 0) === bank && (p.gmProgram ?? -1) === program)
    );
  }

  // 4) Fallback terakhir
  if (!target) target = patches.find(p =>
    isDrum ? p.gmBank === 128 : (p.gmProgram ?? -1) !== -1
  ) || patches[0];

  if (!target) return null;

  // --- LOGIKA CACHE DIMULAI DI SINI ---
  const cacheKey = target.id;
  if (patchBufferCache.has(cacheKey)) {
    return patchBufferCache.get(cacheKey);
  }

  try {
    const bytes = writeTimidityPatch(target.patch);
    const buffer = bytes.buffer;
    patchBufferCache.set(cacheKey, buffer);
    return buffer;
  } catch (e) {
    console.error(`[TiMidity] Patch "${target.name}" rusak, menggunakan silent:`, e);
    try {
      const silentBytes = createSilentPatch();
      const buffer = silentBytes.buffer;
      patchBufferCache.set(cacheKey, buffer);
      return buffer;
    } catch (silentErr) {
      return null;
    }
  }
}

async function ensureTimidityPlayer() {
  if (timidityPlayer) return;
  if (typeof TimidityPlayer === 'undefined') {
    throw new Error(t("player_library_missing"));
  }
  timidityPlayer = new TimidityPlayer({
    patchUrlBase: '', 
    timidityCfgLoader: () => {
      if (!state.currentProjectId) return "";
      const project = state.projects.find(p => p.id === state.currentProjectId);
      if (!project) return "";
      return generateProjectTimidityCfg(project);
    },
    instrumentLoader: (bank, isDrum, program, file) => {
      return getProjectPatchData(bank, isDrum, program, file);
    }
  });

  timidityPlayer.onPlay(() => {
    applyBankToPlayer(currentBank);
  });
  
  // PERBAIKAN: Tambahkan event listener untuk debugging
  timidityPlayer.onError((err) => {
    console.error("TiMidity Error:", err);
    setMidiStatus("midi_error", {message: err});
    showStatus(t("timidity_error", {message: err}), "bad");
  });
  timidityPlayer.onInstrumentLoading((loaded, total, filename) => {
    setMidiStatus("loading_patch", {loaded, total});
  });
  timidityPlayer.onInstrumentLoaded((total) => {
    setMidiStatus("all_patches_loaded", {total});
  });
  timidityPlayer.on("onRenderProgress", (progress) => {
    if (isMidiRendering) {
      setMidiStatus("offline_render_progress", {progress: Math.round(progress)});
    }
  });
  timidityPlayer.onEnded(() => {
    midiProgress.playing = false;
    midiProgress.paused = false;
    midiProgress.current = midiProgress.duration;
    cancelAnimationFrame(midiProgress.raf);
    $("btnPlayMidi").disabled = false;
    $("btnPauseMidi").disabled = true;
    $("btnStopMidi").disabled = true;
    setMidiStatus("midi_finished");
    updateMidiUI();
  });

  await timidityPlayer.init();
}

/* ---------- MIDI Preview ---------- */
// Ganti fungsi loadMidiFile lama dengan yang ini:
async function loadMidiFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  state.midiData = new Uint8Array(await file.arrayBuffer());
  state.midiFileName = file.name;
  
  midiProgress.duration = calculateMidiDuration(state.midiData);
  midiProgress.current = 0;
  midiProgress.playing = false;
  midiProgress.paused = false;
  midiProgress.seeking = false;
  
  setMidiStatus("midi_ready", {filename: file.name});
  $("btnPlayMidi").disabled = false;
  $("btnPlayMidi").innerHTML = `<svg class="icon"><use href="#i-play"></use></svg> ${t("play")}`;
  $("btnPauseMidi").disabled = true;
  $("btnPauseMidi").innerHTML = `<svg class="icon"><use href="#i-pause"></use></svg> ${t("pause")}`;
  $("btnStopMidi").disabled = true;
  $("btnRenderMidi").disabled = false;
  $("midiSeek").disabled = false;
  
  updateMidiUI();
}

async function renderMidiToWav() {
  if (!state.midiData || isMidiRendering) return;
  if (!state.currentProjectId) {
    setMidiStatus("select_project_before_render");
    return;
  }

  isMidiRendering = true;
  $("btnRenderMidi").disabled = true;
  $("btnLoadMidi").disabled = true;
  $("btnPlayMidi").disabled = true;
  $("btnPauseMidi").disabled = true;
  $("btnStopMidi").disabled = true;
  $("midiSeek").disabled = true;
  try {
    if (midiProgress.playing || midiProgress.paused) stopMidi();
    setMidiStatus("offline_rendering");
    await ensureTimidityPlayer();
    const loaded = await timidityPlayer.load(state.midiData);
    if (!loaded) {
      throw new Error(t("midi_load_failed"));
    }

    setMidiStatus("offline_rendering");
    const wavBlob = await timidityPlayer.renderOffline();
    if (!(wavBlob instanceof Blob)) {
      throw new Error(t("offline_render_failed"));
    }

    const fileBaseName = (state.midiFileName || "midi").replace(/\.(mid|midi)$/i, "");
    const downloadUrl = URL.createObjectURL(wavBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = `${sanitizeFilename(fileBaseName)}.wav`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    setMidiStatus("offline_render_complete");
  } catch (err) {
    console.error("Offline MIDI render failed:", err);
    setMidiStatus("offline_render_failed", {message: err.message});
  } finally {
    isMidiRendering = false;
    $("btnLoadMidi").disabled = false;
    $("btnPlayMidi").disabled = !state.midiData;
    $("btnPauseMidi").disabled = true;
    $("btnStopMidi").disabled = true;
    $("midiSeek").disabled = !state.midiData;
    $("btnRenderMidi").disabled = !state.midiData;
  }
}



/* ---------- MIDI Preview State ---------- */
const midiProgress = {
  playing: false,
  paused: false,
  startTime: 0,
  current: 0,
  duration: 0,
  raf: null,
  seeking: false
};

// Parser durasi MIDI (menghitung tempo, tick, dan waktu secara akurat)
function calculateMidiDuration(midiData) {
  let p = 0;
  if (midiData[p] !== 0x4D || midiData[p+1] !== 0x54 || midiData[p+2] !== 0x68 || midiData[p+3] !== 0x64) return 180;
  p += 4;
  const headerLength = (midiData[p]<<24) | (midiData[p+1]<<16) | (midiData[p+2]<<8) | midiData[p+3];
  p += 4;
  const numTracks = (midiData[p+2]<<8) | midiData[p+3];
  const division = (midiData[p+4]<<8) | midiData[p+5];
  p += headerLength;

  if (division & 0x8000) return 180; // SMPTE time, fallback
  const ticksPerQuarter = division;

  const events = [];
  let maxTick = 0;
  
  for (let t = 0; t < numTracks; t++) {
    if (p+4 > midiData.length) break;
    if (midiData[p] !== 0x4D || midiData[p+1] !== 0x54 || midiData[p+2] !== 0x72 || midiData[p+3] !== 0x6B) break;
    p += 4;
    const trackLen = (midiData[p]<<24) | (midiData[p+1]<<16) | (midiData[p+2]<<8) | midiData[p+3];
    p += 4;
    let trackEnd = p + trackLen;
    let trackTicks = 0;
    let runningStatus = 0;

    while (p < trackEnd) {
      let delta = 0;
      let b;
      do { b = midiData[p++]; delta = (delta << 7) | (b & 0x7F); } while (b & 0x80);
      trackTicks += delta;
      if (trackTicks > maxTick) maxTick = trackTicks;

      let status = midiData[p];
      if (status & 0x80) {
        p++;
        if (status < 0xF0) runningStatus = status;
      } else {
        status = runningStatus;
      }

      if (status === 0xFF) {
        const type = midiData[p++];
        let len = 0;
        do { b = midiData[p++]; len = (len << 7) | (b & 0x7F); } while (b & 0x80);
        if (type === 0x51 && len === 3) {
          const tempo = (midiData[p]<<16) | (midiData[p+1]<<8) | midiData[p+2];
          events.push({ tick: trackTicks, tempo });
        }
        p += len;
      } else if (status === 0xF0 || status === 0xF7) {
        let len = 0;
        do { b = midiData[p++]; len = (len << 7) | (b & 0x7F); } while (b & 0x80);
        p += len;
      } else {
        const type = status & 0xF0;
        if (type === 0xC0 || type === 0xD0) p += 1; else p += 2;
      }
    }
    p = trackEnd;
  }

  events.sort((a, b) => a.tick - b.tick);
  
  let totalSeconds = 0;
  let lastTick = 0;
  let currentTempo = 500000; // Default 120 BPM
  
  for (const ev of events) {
    const ticks = ev.tick - lastTick;
    totalSeconds += (ticks / ticksPerQuarter) * (currentTempo / 1000000);
    lastTick = ev.tick;
    currentTempo = ev.tempo;
  }
  totalSeconds += ((maxTick - lastTick) / ticksPerQuarter) * (currentTempo / 1000000);
  
  return Math.max(totalSeconds, 1);
}

function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateMidiUI() {
  if (!state.midiData) return;
  const dur = midiProgress.duration;
  const cur = midiProgress.seeking
    ? (parseInt($("midiSeek").value, 10) / 1000) * dur
    : midiProgress.current;
  
  $("midiTimeCur").textContent = formatTime(cur);
  $("midiTimeTotal").textContent = formatTime(dur);
  
  if (!midiProgress.seeking) {
    if (!midiProgress.playing && !midiProgress.paused) {
      $("midiSeek").value = 0;
    } else {
      $("midiSeek").value = Math.floor((cur / dur) * 1000);
    }
  }
}

function applyMidiVolume() {
  const vol = parseInt($("midiVolume").value) / 100;
  $("midiVolVal").textContent = Math.round(vol * 100) + "%";
  
  if (!timidityPlayer) return;
  
  try {
    // HANYA gunakan API aman. Jangan kirim MIDI CC langsung, karena akan crash di WASM!
    if (typeof timidityPlayer.setVolume === 'function') {
      timidityPlayer.setVolume(vol * 100);
    } 
  } catch (err) { 
    console.warn("Gagal mengubah volume:", err);
  }
}

function togglePauseMidi() {
  if (!state.midiData) return;
  if (midiProgress.playing) {
    // Aksi Pause
    midiProgress.playing = false;
    midiProgress.paused = true;
    timidityPlayer.stop();
    cancelAnimationFrame(midiProgress.raf);
    
    $("btnPlayMidi").disabled = false;
    $("btnPauseMidi").innerHTML = `<svg class="icon"><use href="#i-play"></use></svg> ${t("resume")}`;
    setMidiStatus("midi_paused");
  } else if (midiProgress.paused) {
    // Aksi Resume
    playMidi(midiProgress.current);
    $("btnPauseMidi").innerHTML = `<svg class="icon"><use href="#i-pause"></use></svg> ${t("pause")}`;
  }
}

async function playMidi(fromTime = 0) {
  if (!state.midiData) return;
  if (typeof fromTime !== 'number') fromTime = 0; // <-- TAMBAHKAN BARIS INI (Pencegah Error)

  try {
    await ensureTimidityPlayer();
    setMidiStatus("midi_loading_patch");
    
    midiProgress.playing = true;
    midiProgress.paused = false;
    midiProgress.startTime = performance.now() - (fromTime * 1000);
    midiProgress.current = fromTime;
    
    if (timidityPlayer) timidityPlayer.stop();
    await timidityPlayer.loadAndPlay(state.midiData, fromTime);
    
    // Terapkan volume saat mulai play

    setMidiStatus("midi_playing");
    $("btnPlayMidi").disabled = true;
    $("btnPlayMidi").innerHTML = `<svg class="icon"><use href="#i-play"></use></svg> ${t("play")}`;
    $("btnPauseMidi").disabled = false;
    $("btnPauseMidi").innerHTML = `<svg class="icon"><use href="#i-pause"></use></svg> ${t("pause")}`;
    $("btnStopMidi").disabled = false;
    $("midiSeek").disabled = false;

    // Loop UI Timer
    cancelAnimationFrame(midiProgress.raf);
    const tick = () => {
      if (!midiProgress.playing) return;
      
      const elapsed = (performance.now() - midiProgress.startTime) / 1000;
      midiProgress.current = elapsed;
      
      if (elapsed >= midiProgress.duration) {
        stopMidi();
        return;
      }
      
      updateMidiUI();
      midiProgress.raf = requestAnimationFrame(tick);
    };
    midiProgress.raf = requestAnimationFrame(tick);

  } catch (err) {
    console.error(err);
    setMidiStatus("midi_error", {message: err.message});
    stopMidi();
  }
}

function stopMidi() {
  midiProgress.playing = false;
  midiProgress.paused = false;
  midiProgress.seeking = false;
  midiProgress.current = 0;
  cancelAnimationFrame(midiProgress.raf);
  
  if (timidityPlayer) {
    timidityPlayer.stop();
  }
  
  $("btnPlayMidi").disabled = false;
  $("btnPauseMidi").disabled = true;
  $("btnPauseMidi").innerHTML = `<svg class="icon"><use href="#i-pause"></use></svg> ${t("pause")}`;
  $("btnStopMidi").disabled = true;
  setMidiStatus("midi_stopped");
  updateMidiUI();
}


/* ---------- Export ---------- */
function exportPatchById(id){
  const entry=state.patches.find(p=>p.id===id);
  if(!entry)return;
  try{
    const clean=cleanPatchForStorage(entry.patch);
    const bytes=writePAT(clean);
    const blob=new Blob([bytes],{type:"application/octet-stream"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=(entry.name||"patch").replace(/[^\w\-]+/g,"_")+".pat";
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    showStatus(t("patch_exported", {name: entry.name}),"ok");
  }catch(err){
    console.error(err);
    showStatus(t("export_failed", {message: err.message}),"bad");
  }
}

async function exportProject(projectId) {
  // Legacy: dipanggil dari sidebar — buka dialog
  const project = state.projects.find(p => p.id === projectId);
  if (!project) return;
  if (getProjectPatchEntries().length === 0) {
    showStatus(t("empty_project"), "bad");
    return;
  }
  state.currentProjectId = projectId;
  openExportBanksDialog();
}

function openExportBanksDialog() {
  $("exportBanksError").textContent = "";
  $("exportBanksDialog").hidden = false;
  $("btnConfirmExportBanks").focus();
}

function closeExportBanksDialog() {
  $("exportBanksDialog").hidden = true;
}

async function exportAllPatches(){
  if(state.patches.length===0){showStatus(t("empty_library"),"bad");return;}
  try {
    const zipFiles = [];
    const usedPaths = new Set();
    const patchPaths = new Map();

    // === BUAT MAPPING URUTAN (0, 1, 2, ...) ===
    const drums = state.patches.filter(p => (p.gmBank ?? 0) === 128);
    const melodic = state.patches.filter(p => (p.gmBank ?? 0) !== 128);
    
    const uniqueDrumSets = [...new Set(drums.map(p => p.drumSet ?? 0))].sort((a, b) => a - b);
    const drumSetMap = new Map(uniqueDrumSets.map((id, idx) => [id, idx]));
    
    const uniqueBanks = [...new Set(melodic.map(p => p.gmBank ?? 0))].sort((a, b) => a - b);
    const bankMap = new Map(uniqueBanks.map((id, idx) => [id, idx]));
    // ==========================================

    for (const entry of state.patches) {
      const clean = cleanPatchForStorage(entry.patch);
      const bytes = writePAT(clean);

      const isDrum = (entry.gmBank ?? 0) === 128;
      const groupId = isDrum 
        ? drumSetMap.get(entry.drumSet ?? 0) 
        : bankMap.get(entry.gmBank ?? 0);
        
      const kind = isDrum ? "drum" : "tone";
      const folderPath = `${groupId}/${kind}/`;

      let filename = sanitizeFilename(entry.name) + ".pat";
      let suffix = 1;
      let original = filename;
      while (usedPaths.has(folderPath + filename)) {
        filename = original.replace(".pat", `_${suffix++}.pat`);
      }
      usedPaths.add(folderPath + filename);

      patchPaths.set(entry.id, { folderPath, filename });
      zipFiles.push({ name: folderPath + filename, data: bytes, entry });
    }

    zipFiles.sort((a, b) => {
      const bankA = a.entry.gmBank ?? 0;
      const bankB = b.entry.gmBank ?? 0;
      if (bankA !== bankB) return bankA - bankB;
      const progA = a.entry.gmProgram ?? -1;
      const progB = b.entry.gmProgram ?? -1;
      if (progA !== progB) return progA - progB;
      return a.name.localeCompare(b.name);
    });

    const manifestData = zipFiles.map(zf => ({
      filename: zf.name,
      patchName: zf.entry.name,
      gmBank: zf.entry.gmBank ?? 0,
      gmProgram: zf.entry.gmProgram ?? -1,
      drumSet: zf.entry.drumSet,
      description: zf.entry.patch.header.description || ""
    }));
    zipFiles.push({
      name: "manifest.json",
      data: new TextEncoder().encode(JSON.stringify(manifestData, null, 2))
    });

    const fakeProject = { patchIds: state.patches.map(p => p.id) };
    zipFiles.push({
      name: "timidity.cfg",
      data: new TextEncoder().encode(generateProjectTimidityCfgForZip(fakeProject, patchPaths, drumSetMap, bankMap))
    });

    const zipBytes = createZip(zipFiles);
    const blob = new Blob([zipBytes], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gus_patches.zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showStatus(t("zip_exported", {count: zipFiles.length}), "ok");
  } catch (err) {
    console.error(err);
    showStatus(t("zip_failed", {message: err.message}), "bad");
  }
}

function exportInstrument(instIdx){
  if(!state.patch)return;
  const inst=state.patch.instruments[instIdx];
  if(!inst){showStatus(t("instrument_not_found"),"bad");return;}
  try{
    const newPatch={
      header: cleanPatchForStorage(state.patch).header,
      instruments: [cleanPatchForStorage(state.patch).instruments[instIdx]]
    };
    const bytes=writePAT(newPatch);
    const blob=new Blob([bytes],{type:"application/octet-stream"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=(inst.name||("instrument_"+inst.instrument)).replace(/[^\w\-]+/g,"_")+".pat";
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    showStatus(t("instrument_exported"),"ok");
  }catch(err){
    console.error(err);
    showStatus(t("instrument_export_failed"),"bad");
  }
}

/* ---------- ZIP Writer (No Compression) ---------- */
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[i] = c;
}
function crc32(data) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < data.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0;
}
function writeU16(arr, offset, val) { arr[offset] = val & 0xFF; arr[offset+1] = (val >>> 8) & 0xFF; }
function writeU32(arr, offset, val) { arr[offset] = val & 0xFF; arr[offset+1] = (val >>> 8) & 0xFF; arr[offset+2] = (val >>> 16) & 0xFF; arr[offset+3] = (val >>> 24) & 0xFF; }

function createZip(files) {
  const encoder = new TextEncoder();
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const crc = crc32(file.data);
    const size = file.data.length;

    const lh = new Uint8Array(30 + nameBytes.length + size);
    writeU32(lh, 0, 0x04034b50);
    writeU16(lh, 4, 20); writeU16(lh, 6, 0); writeU16(lh, 8, 0);
    writeU16(lh, 10, dosTime); writeU16(lh, 12, dosDate);
    writeU32(lh, 14, crc);
    writeU32(lh, 18, size); writeU32(lh, 22, size);
    writeU16(lh, 26, nameBytes.length); writeU16(lh, 28, 0);
    lh.set(nameBytes, 30); lh.set(file.data, 30 + nameBytes.length);
    localHeaders.push(lh);

    const ch = new Uint8Array(46 + nameBytes.length);
    writeU32(ch, 0, 0x02014b50);
    writeU16(ch, 4, 20); writeU16(ch, 6, 20); writeU16(ch, 8, 0); writeU16(ch, 10, 0);
    writeU16(ch, 12, dosTime); writeU16(ch, 14, dosDate);
    writeU32(ch, 16, crc);
    writeU32(ch, 20, size); writeU32(ch, 24, size);
    writeU16(ch, 28, nameBytes.length); writeU16(ch, 30, 0); writeU16(ch, 32, 0);
    writeU16(ch, 34, 0); writeU16(ch, 36, 0); writeU32(ch, 38, 0);
    writeU32(ch, 42, offset);
    ch.set(nameBytes, 46);
    centralHeaders.push(ch);

    offset += lh.length;
  }

  let centralDirSize = 0;
  for (const ch of centralHeaders) centralDirSize += ch.length;

  const eocd = new Uint8Array(22);
  writeU32(eocd, 0, 0x06054b50);
  writeU16(eocd, 4, 0); writeU16(eocd, 6, 0);
  writeU16(eocd, 8, files.length); writeU16(eocd, 10, files.length);
  writeU32(eocd, 12, centralDirSize); writeU32(eocd, 16, offset); writeU16(eocd, 20, 0);

  const totalSize = offset + centralDirSize + 22;
  const zip = new Uint8Array(totalSize);
  let p = 0;
  for (const lh of localHeaders) { zip.set(lh, p); p += lh.length; }
  for (const ch of centralHeaders) { zip.set(ch, p); p += ch.length; }
  zip.set(eocd, p);

  return zip;
}

function getAvailableBanks() {
  const project = state.projects.find(p => p.id === state.currentProjectId);
  if (!project) return [0];
  const patches = getProjectPatches(project);
  const banks = new Set();
  patches.forEach(p => {
    banks.add(p.targetBank ?? 0);
  });
  banks.add(0); // pastikan 0 selalu ada
  return Array.from(banks).sort((a, b) => a - b);
}

function openBankSelectDialog() {
  const banks = getAvailableBanks();
  const list = $("bankSelectList");
  const statusEl = $("bankLoadingStatus");
  
  list.innerHTML = "";
  statusEl.style.display = "none";
  statusEl.textContent = "";
  isLoadingBank = false;

  banks.forEach(bank => {
    const patches = getPatchesForBank(bank);
    const totalSize = patches.reduce((acc, p) => acc + getPatchSize(p), 0);
    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    
    // Deteksi patch rusak: Anggap < 1024 byte sebagai file kosong/rusak
    const brokenPatches = patches.filter(p => getPatchSize(p) < 1024);
    const hasBrokenPatch = brokenPatches.length > 0;
    const icon = hasBrokenPatch ? `⚠️ (${brokenPatches.length} rusak)` : "";

    const d = document.createElement("div");
    d.className = "li" + (bank === currentBank ? " active" : "");
    
    d.innerHTML = `
      <div class="bank-item-row ${hasBrokenPatch ? 'bank-item-broken-row' : ''}">
        <span class="name ${hasBrokenPatch ? 'bank-broken' : ''}">Bank ${bank} ${icon}</span>
        <div class="bank-item-actions">
          <span class="bank-item-info">${patches.length} patch (${sizeMB} MB)</span>
          <button class="icon-btn bank-info-btn" data-bank="${bank}" title="Lihat Rincian">
            <svg class="icon"><use href="#i-folder"></use></svg>
          </button>
        </div>
      </div>
    `;
    
    d.onclick = (e) => {
      if (isLoadingBank) return;
      if (e.target.closest('button')) return; 
      
      if (hasBrokenPatch) {
        // Hanya beri peringatan, jangan blokir
        showStatus(t("bank_zero_size_warning"), "bad");
      }
      
      currentBank = bank;
      list.querySelectorAll(".li").forEach(el => el.classList.remove("active"));
      d.classList.add("active");
      
      loadBankAsync(bank, patches, statusEl);
    };

    d.querySelector('button').onclick = (e) => {
      e.stopPropagation();
      openBankBreakdownDialog(bank, patches);
    };
    
    list.appendChild(d);
  });
  
  $("bankSelectDialog").hidden = false;
}

function openBankBreakdownDialog(bank, patches) {
  const list = $("bankBreakdownList");
  list.innerHTML = "";
  
  // Urutkan: Patch rusak (paling atas), lalu sisanya berdasarkan ukuran terbesar
  const sorted = [...patches].sort((a, b) => {
    const aBroken = getPatchSize(a) < 1024;
    const bBroken = getPatchSize(b) < 1024;
    if (aBroken !== bBroken) return aBroken ? -1 : 1; 
    return getPatchSize(b) - getPatchSize(a);
  });

  sorted.forEach(p => {
    const size = getPatchSize(p);
    const sizeMB = (size / (1024 * 1024)).toFixed(2);
    
    // Gunakan ambang batas < 1024 byte (mencakup file 0 byte dan file sangat kecil)
    const isZero = size < 1024;

    const row = document.createElement("div");
    row.className = "breakdown-row";
    
    if (isZero) {
      row.classList.add("broken");
      row.title = t("patch_zero_size_tooltip");
    }

    row.innerHTML = `
      <span class="name ${isZero ? 'bank-broken' : ''}" title="${escapeHtml(p.name)}">
        ${p.gmProgram >= 0 ? `#${p.gmProgram} - ` : ''}${escapeHtml(p.name)}
      </span>
      <div class="breakdown-actions">
        <span class="breakdown-size ${isZero ? 'bank-broken' : ''}">${sizeMB} MB</span>
        <button class="btn-delete-patch" data-id="${p.id}">${t("delete")}</button>
      </div>
    `;
    
    const btnDelete = row.querySelector(".btn-delete-patch");
    btnDelete.onclick = (e) => {
      e.stopPropagation();
      deletePatchFromBreakdown(p.id, bank);
    };

    list.appendChild(row);
  });

  $("bankBreakdownDialog").hidden = false;
}

function isPatchBroken(p) {
  if (!p || !p.patch || !p.patch.instruments) return true;
  // Anggap rusak jika ukurannya di bawah 1 KB (karena header saja 129 byte)
  return getPatchSize(p) < 1024;
}

// Fungsi baru untuk menghapus patch dari Rincian Bank
function deletePatchFromBreakdown(patchId, currentBank) {
  const entry = state.patches.find(p => p.id === patchId);
  if (!entry) return;
  
  openConfirmationDialog(t("delete_patch_title"), t("confirm_delete_patch", {name: entry.name}), t("delete"), async () => {
    try {
      // 1. Update data proyek (hapus ID dari semua proyek)
      const updatedProjects = state.projects.map(project => ({
        ...project,
        patchIds: (project.patchIds || []).filter(id => id !== patchId)
      }));

      // 2. Simpan ke Database
      await dbDeletePatchAndUpdateProjects(patchId, updatedProjects);
      
      // 3. Update state
      state.patches = state.patches.filter(p => p.id !== patchId);
      state.projects = updatedProjects;
      
      // Jika patch yang dihapus sedang aktif diedit
      if (state.currentPatchId === patchId) {
        if (state.patches.length > 0) selectPatch(state.patches[0].id);
        else { state.currentPatchId = null; state.patch = null; }
      }

      // 4. Invalidasi TimidityPlayer (agar timidity.cfg digenerate ulang saat play berikutnya)
      invalidateTimidityPlayer();

      // 5. Update semua UI
      renderProjects();
      renderLibrary();
      renderBankManager();
      render(); // Refresh editor jika perlu

      // 6. Perbarui Modal Rincian Bank
      const remainingPatches = getPatchesForBank(currentBank);
      if (remainingPatches.length === 0) {
        closeBankBreakdownDialog();
        closeBankSelectDialog();
      } else {
        // Render ulang modal breakdown dengan list terbaru
        openBankBreakdownDialog(currentBank, remainingPatches);
        // Render ulang modal pemilihan bank di belakangnya agar tanda merah hilang jika sudah aman
        openBankSelectDialog(); 
      }
      
      showStatus(t("patch_deleted"), "ok");
      
    } catch (err) {
      console.error("Gagal menghapus patch:", err);
      showStatus("Failed to delete patch.", "bad");
    }
  });
}

function getPatchSize(p) {
  return p.patch.instruments.reduce((a, i) =>
    a + i.layers.reduce((b, l) =>
      b + l.samples.reduce((c, s) => c + (s.pcm ? s.pcm.length : 0), 0), 0), 0);
}


function closeBankBreakdownDialog() {
  $("bankBreakdownDialog").hidden = true;
}

async function loadBankAsync(bank, patches, statusEl) {
  if (!timidityPlayer) return;
  
  isLoadingBank = true;
  if (bankSwitchTimer) clearTimeout(bankSwitchTimer);
  
  statusEl.style.display = "block";
  statusEl.style.color = "var(--accent)";
  
  let fallbackCount = 0;

  for (let i = 0; i < patches.length; i++) {
    const p = patches[i];
    statusEl.textContent = `Memuat patch ${i + 1}/${patches.length}: ${p.name}...`;
    await new Promise(resolve => setTimeout(resolve, 10));
    
    if (!patchBufferCache.has(p.id)) {
      try {
        const bytes = writeTimidityPatch(p.patch);
        patchBufferCache.set(p.id, bytes.buffer);
      } catch (e) {
        console.error(`[loadBankAsync] Patch "${p.name}" rusak, menggunakan silent:`, e);
        try {
          const silentBytes = createSilentPatch();
          patchBufferCache.set(p.id, silentBytes.buffer);
          fallbackCount++;
        } catch (silentErr) {
          console.error("[loadBankAsync] Gagal membuat silent patch:", silentErr);
        }
      }
    }
  }

  statusEl.textContent = `Menerapkan Bank ${bank}...`;
  const ME_TONE_BANK = 15;
  let ch = 0;
  
  const sendNext = () => {
    if (ch >= 16) {
      isLoadingBank = false;
      statusEl.style.color = "var(--ok)";
      statusEl.textContent = `Bank ${bank} berhasil dimuat.`;
      
      const heavyPatches = patches.filter(p => getPatchSize(p) > 1 * 1024 * 1024);
      if (heavyPatches.length > 0 || fallbackCount > 0) {
        statusEl.style.color = "var(--bad)";
        let msg = `<b>Perhatian:</b> `;
        if (heavyPatches.length > 0) msg += `Ada patch >1MB. `;
        if (fallbackCount > 0) msg += `${fallbackCount} patch rusak diganti dengan silent.`;
        statusEl.innerHTML = msg;
      }
      return;
    }
    
    try {
      timidityPlayer.sendEvent(ME_TONE_BANK, ch, bank, 0);
    } catch (e) {
      console.warn("Error applying bank to channel", ch, e);
    }
    ch++;
    bankSwitchTimer = setTimeout(sendNext, 50);
  };
  
  sendNext();
}

function closeBankSelectDialog() {
  $("bankSelectDialog").hidden = true;
}

function applyBankToPlayerAsync(bank, statusEl, patches) {
  if (!timidityPlayer) return;
  
  isLoadingBank = true;
  if (bankSwitchTimer) clearTimeout(bankSwitchTimer);
  
  statusEl.style.display = "block";
  statusEl.style.color = "var(--accent)";
  statusEl.textContent = `Memuat Bank ${bank} (${patches.length} patch)...`;

  // Cek peringatan patch berat (> 5MB)
  const heavyPatches = patches.filter(p => {
    const size = p.patch.instruments.reduce((a, i) => a + i.layers.reduce((b, l) => b + l.samples.reduce((c, s) => c + (s.pcm ? s.pcm.length : 0), 0), 0), 0);
    return size > 5 * 1024 * 1024;
  });

  const ME_TONE_BANK = 15;
  let ch = 0;
  
  // Jeda awal agar UI sempat merender status "Memuat..."
  setTimeout(() => {
    const sendNext = () => {
      if (ch >= 16) {
        isLoadingBank = false;
        statusEl.style.color = "var(--ok)";
        statusEl.textContent = `Bank ${bank} berhasil dimuat.`;
        
        if (heavyPatches.length > 0) {
          statusEl.style.color = "var(--bad)"; // Warna merah/kuning
          statusEl.innerHTML = `<b>Peringatan:</b> Patch berikut berukuran sangat besar (>5MB) dan dapat memperlambat browser: <br><i>${heavyPatches.map(p=>p.name).join(', ')}</i>.<br>Sebaiknya kurangi ukuran sampel atau hapus patch tersebut.`;
        }
        return;
      }
      
      try {
        timidityPlayer.sendEvent(ME_TONE_BANK, ch, bank, 0);
      } catch (e) {
        console.warn("Error applying bank to channel", ch, e);
        statusEl.style.color = "var(--bad)";
        statusEl.textContent = `Gagal memuat di channel ${ch}. Coba hapus patch terberat di bank ini.`;
        isLoadingBank = false;
        return;
      }
      
      ch++;
      // Jeda 100ms per channel. Ini memberi waktu browser untuk "bernapas" 
      // dan menyelesaikan resampling WASM di background.
      bankSwitchTimer = setTimeout(sendNext, 100);
    };
    
    sendNext();
  }, 50);
}

let bankSwitchTimer = null;
let isLoadingBank = false;

// Fungsi untuk mengambil patch berdasarkan targetBank
function getPatchesForBank(bank) {
  const project = state.projects.find(p => p.id === state.currentProjectId);
  if (!project) return [];
  const patches = getProjectPatches(project);
  return patches.filter(p => (p.targetBank ?? 0) === bank);
}

function applyBankToPlayer(bank) {
  if (!timidityPlayer) return;
  
  // Hentikan antrean sebelumnya jika pengguna mengganti bank secara cepat
  if (bankSwitchTimer) clearTimeout(bankSwitchTimer);
  
  const ME_TONE_BANK = 15;
  let ch = 0;
  
  const sendNext = () => {
    if (ch >= 16) {
      showStatus(`Bank ${bank} siap`, "ok");
      return;
    }
    try {
      timidityPlayer.sendEvent(ME_TONE_BANK, ch, bank, 0);
    } catch (e) {
      console.warn("Error applying bank to channel", ch, e);
    }
    ch++;
    // Jeda 50ms antar channel agar WebAssembly (Timidity) bisa bernapas
    bankSwitchTimer = setTimeout(sendNext, 50);
  };
  
  showStatus(`Memuat Bank ${bank}...`, "ok");
  sendNext();
}

/* ---------- Rendering ---------- */
function allSamples(){
  const o=[];
  if(!state.patch)return o;
  for(const inst of state.patch.instruments)
    for(const layer of inst.layers)
      for(const s of layer.samples)o.push({inst,layer,sample:s});
  return o;
}

function renderLibrary(filterProjectId = undefined) {
    const projectId = filterProjectId !== undefined ? filterProjectId : state.currentProjectId;
  let displayPatches = state.patches;

  if (state.libraryView === "project" && projectId) {
    const project = state.projects.find(p => p.id === projectId);
    if (project) {
      displayPatches = state.patches.filter(p => (project.patchIds || []).includes(p.id));
    } else {
      displayPatches = [];
    }
  }

  // === FITUR FILTER BANK ===
  const bankFilterSelect = $("libraryBankFilter");
  if (bankFilterSelect) {
    const availableBanks = [...new Set(displayPatches.map(p => p.targetBank ?? 0))].sort((a, b) => a - b);
    let optionsHtml = `<option value="all">Semua Bank</option>`;
    availableBanks.forEach(b => {
      optionsHtml += `<option value="${b}">Bank ${b}</option>`;
    });
    bankFilterSelect.innerHTML = optionsHtml;
    
    // Kembalikan pilihan filter jika masih tersedia
    if (availableBanks.map(String).includes(state.libraryBankFilter)) {
      bankFilterSelect.value = state.libraryBankFilter;
    } else {
      state.libraryBankFilter = "all";
      bankFilterSelect.value = "all";
    }
  }

  if (state.libraryBankFilter !== "all") {
    displayPatches = displayPatches.filter(p => String(p.targetBank ?? 0) === state.libraryBankFilter);
  }
  // ==========================

  // === URUTAN YANG BENAR ===
  displayPatches = [...displayPatches].sort((a, b) => {
    // 1. Melodi (0) selalu di atas Drum (1)
    const aIsDrum = (a.gmBank ?? 0) === 128 ? 1 : 0;
    const bIsDrum = (b.gmBank ?? 0) === 128 ? 1 : 0;
    if (aIsDrum !== bIsDrum) return aIsDrum - bIsDrum;

    // 2. Jika sama-sama Drum, kelompokkan berdasarkan Drum Set (drumSet)
    if (aIsDrum === 1) {
      const aSet = a.drumSet ?? 0;
      const bSet = b.drumSet ?? 0;
      if (aSet !== bSet) return aSet - bSet;
    }

    // 3. Urutkan berdasarkan Nomor Program (atau MIDI Note untuk drum)
    const aProg = a.gmProgram ?? -1;
    const bProg = b.gmProgram ?? -1;
    if (aProg !== bProg) return aProg - bProg;

    // 4. Urutkan berdasarkan userOrder (urutan buatan pengguna)
    const aOrder = a.userOrder ?? 0;
    const bOrder = b.userOrder ?? 0;
    if (aOrder !== bOrder) return aOrder - bOrder;

    // 5. Pengaman terakhir jika masih sama, urutkan berdasarkan nama (A-Z)
    return (a.name || "").localeCompare(b.name || "");
  });
  // ========================================

  const list = $("patchList");
  list.innerHTML = "";
  $("libCount").textContent = displayPatches.length;
  const showAll = state.libraryView === "all";
  $("btnLibraryScope").textContent = t(showAll ? "show_project_library" : "show_all_library");
  $("btnLibraryScope").disabled = !state.currentProjectId;

  if (displayPatches.length === 0) {
    list.innerHTML = `<div style="padding:6px;color:var(--dim);font-size:11px;text-align:center">${t("no_patch")}</div>`;
    return;
  }

  displayPatches.forEach(entry => {
    const d = document.createElement("div");
    d.className = "li" + (entry.id === state.currentPatchId ? " active" : "");
    const totalSamples = entry.patch.instruments.reduce((a, i) => a + i.layers.reduce((b, l) => b + l.samples.length, 0), 0);
    
    // === PERBAIKAN LOGIKA DUPLIKAT ===
    const isDupe = entry.gmProgram !== -1 && entry.gmProgram !== undefined && 
                   state.patches.filter(p => {
                     if (p.gmBank !== entry.gmBank) return false;
                     if (p.gmProgram !== entry.gmProgram) return false;
                     // Jika ini adalah drum, pastikan ia juga berada di Drum Set yang sama
                     if ((entry.gmBank ?? 0) === 128) {
                       return (p.drumSet ?? 0) === (entry.drumSet ?? 0);
                     }
                     return true;
                   }).length > 1;
    // ==================================

    const gmInfo = entry.gmProgram !== -1 && entry.gmProgram !== undefined ? `GM #${entry.gmProgram}` : '';
    const dupeBadge = isDupe ? `<span class="tag" style="color:#f59e0b;border-color:#78350f;margin-right:4px;display:inline-flex;align-items:center;" title="${t("duplicate")}"><svg class="icon" style="width:10px;height:10px;"><use href="#i-warning"></use></svg></span>` : '';

    d.innerHTML = `
      <span class="name" title="${escapeHtml(entry.name)}">${escapeHtml(entry.name)}</span>
      <span class="meta">${dupeBadge}${gmInfo ? gmInfo + ' · ' : ''}${t(totalSamples === 1 ? "sample_count_one" : "sample_count_many", {count: totalSamples})}</span>
      <span class="tools">
        <button class="icon-btn" data-act="export" title="${t("export_pat")}"><svg class="icon"><use href="#i-download"></use></svg></button>
        <button class="icon-btn danger" data-act="delete" title="${t("delete")}"><svg class="icon"><use href="#i-close"></use></svg></button>
      </span>`;
      
    d.addEventListener("click", ev => {
      const btn = ev.target.closest("button");
      if (btn) {
        ev.stopPropagation();
        if (btn.dataset.act === "export") exportPatchById(entry.id);
        else if (btn.dataset.act === "delete") deletePatchById(entry.id);
        return;
      }
      selectPatch(entry.id);
    });
    list.appendChild(d);
  });
}

function selectProject(projectId) {
  if (isMidiRendering) return;
  const project = state.projects.find(entry => entry.id === projectId);
  if (!project) return;

  const wasPlaying = midiProgress.playing;
  const wasPaused = midiProgress.paused;
  const resumeTime = midiProgress.current;

  state.currentProjectId = project.id;
  state.libraryView = "project";
  invalidateTimidityPlayer();
  renderProjects();
  renderLibrary();
  renderBankManager();   // ← tambahkan

  if (state.midiData && (wasPlaying || wasPaused)) {
    setTimeout(() => {
      if (wasPaused) {
        midiProgress.playing = false;
        midiProgress.paused = true;
        midiProgress.current = resumeTime;
        midiProgress.startTime = performance.now() - (resumeTime * 1000);
        updateMidiUI();
        setMidiStatus("midi_paused_at", {time: formatTime(resumeTime)});
      } else {
        playMidi(resumeTime);
      }
    }, 50);
  }
}

function renderProjects() {
  const list = $("projectList");
  list.innerHTML = "";
  $("projCount").textContent = state.projects.length;
  if (state.projects.length === 0) {
    list.innerHTML = `<div style="padding:6px;color:var(--dim);font-size:11px;text-align:center">${t("no_project")}</div>`;
    $("btnAddToProject").disabled = true;
    $("btnImportSoundfont").disabled = true;
    $("btnDeleteProject").disabled = true;
    $("btnExportProject").disabled = true;
    return;
  }
  state.projects.forEach(proj => {
    const d = document.createElement("div");
    d.className = "li" + (proj.id === state.currentProjectId ? " active" : "");
    const patchCount = proj.patchIds.length;
    d.innerHTML = `
      <span class="name"${proj.locale ? ` data-i18n-content="recovered_library_project"` : ""} title="${proj.locale ? t("recovered_library_project") : escapeHtml(proj.name)}">${proj.locale ? t("recovered_library_project") : escapeHtml(proj.name)}</span>
      <span class="meta">${t(patchCount === 1 ? "patch_count_one" : "patch_count_many", {count: patchCount})}</span>
      <span class="tools">
  <button class="icon-btn" data-act="export" title="${t("export_project_zip")}"><svg class="icon"><use href="#i-download"></use></svg></button>
  <button class="icon-btn danger" data-act="delete" title="${t("delete")}"><svg class="icon"><use href="#i-close"></use></svg></button>
</span>`;
    d.addEventListener("click", ev => {
  if (isMidiRendering) return;
  const btn = ev.target.closest("button");
  if (btn) {
        ev.stopPropagation();
        if (btn.dataset.act === "export") exportProject(proj.id);
        else if (btn.dataset.act === "delete") requestDeleteProject(proj.id);
        return;
      }
      selectProject(proj.id);
    });
    list.appendChild(d);
  });
  const hasActive = !!state.currentProjectId;
  $("btnAddToProject").disabled = !hasActive;
  $("btnImportSoundfont").disabled = !hasActive;
  $("btnDeleteProject").disabled = !hasActive;
  $("btnExportProject").disabled = !hasActive;
}

function render(save=true){
  const has=!!state.patch;
  $("welcome").hidden=has; $("workspace").hidden=!has; $("btnSave").disabled=!has;
  $("btnExportInst").disabled=!has;
  renderLibrary();
  renderProjects();
  renderBankManager(); // ← TAMBAHKAN BARIS INI
  if(!has)return;

  const p=state.patch, samples=allSamples();
  $("patchNameSide").textContent=p.header.description||t("unnamed");
  $("statInst").textContent=p.instruments.length;
  $("statSamples").textContent=samples.length;
  $("statVoices").textContent=p.header.voices??"—";
  $("statVol").textContent=p.header.masterVolume??"—";

  $("pMagic").value=p.header.magic;
  $("pGravisId").value=p.header.gravisId;
  $("pVoices").value=p.header.voices??14;
  $("pChannels").value=p.header.channels??0;
  $("pDescription").value=p.header.description||"";
  $("pMasterVolume").value=p.header.masterVolume??127;
  $("pDataSize").value=p.header.dataSize??0;

  const il=$("instrumentList"); il.innerHTML="";
  p.instruments.forEach((inst,i)=>{
    const d=document.createElement("div");
    d.className="li"+(i===state.selInst?" active":"");
    const count=inst.layers.reduce((a,l)=>a+l.samples.length,0);
    d.innerHTML=`<span class="name">${escapeHtml(inst.name||t("unnamed"))}</span><span class="meta">${t("instrument_info", {number: inst.instrument, count})}</span>`;
    d.onclick=()=>{state.selInst=i;state.selSample=null;state.selStart=state.selEnd=0;state.zoom=1;state.offset=0;updateZoomUI();render();};
    il.appendChild(d);
  });

  const inst=p.instruments[state.selInst];
  if(inst){
    $("instTitle").textContent=inst.name||t("instrument_default");
    $("instPill").textContent=`#${inst.instrument} · ${t(inst.layers.length === 1 ? "layer_count_one" : "layer_count_many", {count: inst.layers.length})}`;
    $("iNumber").value=inst.instrument;
    $("iName").value=inst.name||"";
  }

  const sl=$("sampleList"); sl.innerHTML="";
  const instSamples=[];
  if(inst)for(const layer of inst.layers)for(const s of layer.samples)instSamples.push({inst,layer,sample:s});
  $("sampleCountPill").textContent=t(instSamples.length === 1 ? "sample_count_one" : "sample_count_many", {count: instSamples.length});
  instSamples.forEach(ref=>{
    const s=ref.sample, bps=fmt(s).bps, n=Math.floor(s.pcm.length/bps), li=loopInfo(s);
    const d=document.createElement("div");
    d.className="sc"+(state.selSample===s?" active":"");
    d.innerHTML=`
      <div class="n">${escapeHtml(s.name||t("unnamed"))}</div>
      <div class="m">
        <span class="tag">${fmt(s).is16?"16-bit":"8-bit"}</span>
        <span class="tag">${(s.sampleRate||0).toLocaleString()} Hz</span>
        <span class="tag">${t(n === 1 ? "sample_count_one" : "sample_count_many", {count: n.toLocaleString()})}</span>
        ${li.enabled?`<span class="tag loop">${t("loop_range", {start: Math.round(li.start), end: Math.round(li.end)})}</span>`:""}
      </div>`;
    d.onclick=()=>{
      state.selSample=s; state.selStart=state.selEnd=0; state.undo=[];
      state.zoom=1; state.offset=0; updateZoomUI();
      render();
    };
    sl.appendChild(d);
  });
  const addSampleCard=document.createElement("button");
  const targetLayer=inst?.layers[0];
  addSampleCard.type="button";
  addSampleCard.className="sc add-sample-card";
  addSampleCard.disabled=!!targetLayer&&targetLayer.samples.length>=255;
  addSampleCard.setAttribute("aria-label",t("add_sample"));
  addSampleCard.innerHTML=`<span class="add-sample-plus" aria-hidden="true">+</span><span>${t("add_sample")}</span>`;
  addSampleCard.addEventListener("click",openAddSampleDialog);
  sl.appendChild(addSampleCard);

  renderSampleEditor(save);
  const totalBytes=p.instruments.reduce((a,i)=>a+i.size,0);
  $("footerInfo").textContent=t("footer_summary", {
    instruments: t(p.instruments.length === 1 ? "instrument_count_one" : "instrument_count_many", {count: p.instruments.length}),
    samples: t(samples.length === 1 ? "sample_count_one" : "sample_count_many", {count: samples.length}),
    size: fmtBytes(totalBytes)
  });
  if(save) scheduleSave();

  const entry = state.patches.find(p=>p.id===state.currentPatchId);
  if (entry) {
    $("pGMProgram").value = entry.gmProgram ?? -1;
    $("pGMBank").value = entry.gmBank ?? 0;
  }
}

function renderSampleEditor(save=true){
  const s=state.selSample;
  if(!s){$("sampleEditor").hidden=true; if(save) scheduleSave(); return;}
  $("sampleEditor").hidden=false;

  $("sampleTitle").textContent=s.name||t("sample");
  $("sampleFormatPill").textContent=`${fmt(s).is16?"16-bit":"8-bit"} ${t(fmt(s).unsigned?"format_unsigned":"format_signed")} · ${(s.sampleRate||0).toLocaleString()} Hz`;

  $("sName").value=s.name||"";
  $("sRate").value=s.sampleRate||0;
  $("sRoot").value=s.rootFreq||0;
  $("sBalance").value=s.balance??7;
  $("sLow").value=s.lowFreq||0;
  $("sHigh").value=s.highFreq||0;
  const bps=fmt(s).bps, total=Math.floor(s.pcm.length/bps);
  const li=loopInfo(s);
  $("sLoopStart").value=Math.round(li.start);
  $("sLoopEnd").value=Math.round(li.end);
  $("sLoopStart").max=total; $("sLoopEnd").max=total;
  $("sFractions").value=s.fractions??0;
  $("sTune").value=s.tune??0;
  $("sScaleFreq").value=s.scaleFreq??60;
  $("sScaleFactor").value=s.scaleFactor??1024;

  const names=["env_attack","env_decay","env_sustain","env_rate_1","env_rate_2","env_rate_3"];
  const rg=$("envRatesGrid"), og=$("envOffsetsGrid");
  rg.innerHTML=""; og.innerHTML="";
  for(let i=0;i<6;i++){
    const rf=document.createElement("div"); rf.className="field";
    rf.innerHTML=`<label>${t("rate_label", {name: t(names[i])})}</label><input type="number" min="0" max="255" data-er="${i}" value="${s.envRates[i]??0}">`;
    rg.appendChild(rf);
    const of=document.createElement("div"); of.className="field";
    of.innerHTML=`<label>${t("offset_label", {name: t(names[i])})}</label><input type="number" min="0" max="255" data-eo="${i}" value="${s.envOffsets[i]??0}">`;
    og.appendChild(of);
  }

  $("sTremSweep").value=s.tremoloSweep??0;
  $("sTremRate").value=s.tremoloRate??0;
  $("sTremDepth").value=s.tremoloDepth??0;
  $("sVibSweep").value=s.vibratoSweep??0;
  $("sVibRate").value=s.vibratoRate??0;
  $("sVibDepth").value=s.vibratoDepth??0;

  const mr=$("modesRow"); mr.innerHTML="";
  for(const [bit,label] of MODE_LABELS){
    const l=document.createElement("label"); l.className="check";
    l.innerHTML=`<input type="checkbox" data-mb="${bit}" ${(s.modes&bit)?"checked":""}><span>${t(label)}</span>`;
    mr.appendChild(l);
  }

  const pr=$("pianoRow"); pr.innerHTML="";
  const keys=[["A",57],["W",58],["S",59],["E",60],["D",61],["F",62],["T",63],["G",64],["Y",65],["H",66],["U",67],["J",68],["K",69]];
  for(const [k,note] of keys){
    const b=document.createElement("button");
    b.className="btn small"; b.textContent=t("play_instrument_key", {key: k, note});
    b.onmousedown=()=>{ensureAudio();playSample(s,note,100,false);};
    b.onmouseup=()=>releaseAllVoices(true);
    b.onmouseleave=()=>releaseAllVoices(true);
    pr.appendChild(b);
  }

  $("toolSelect").classList.toggle("active",state.tool==="select");
  $("toolPencil").classList.toggle("active",state.tool==="pencil");
  updateZoomUI();
  requestAnimationFrame(drawWave);
}

function openAddSampleDialog(){
  const instrument=state.patch?.instruments[state.selInst];
  if(!state.patch||!instrument)return;
  sampleImportGeneration++;
  addSampleTarget={patchId:state.currentPatchId,instrumentIndex:state.selInst};
  pendingSampleDraft=null;
  $("addSampleError").textContent="";
  $("addSampleFileName").textContent="";
  $("addSampleRecordingStatus").textContent="";
  $("addSampleRecordingTimer").textContent="00:00";
  $("addSamplePreview").hidden=true;
  $("addSampleName").value="";
  $("btnConfirmAddSample").disabled=true;
  $("btnChooseSampleFile").disabled=false;
  $("btnStartSampleRecording").disabled=false;
  $("btnStopSampleRecording").disabled=true;
  $("addSampleDialog").hidden=false;
  $("btnChooseSampleFile").focus();
}

function clearSampleRecordingTimer(recording=sampleRecording){
  if(recording?.timer){
    clearInterval(recording.timer);
    recording.timer=null;
  }
}

function stopSampleRecordingTracks(recording){
  clearSampleRecordingTimer(recording);
  for(const track of recording.stream.getTracks())track.stop();
}

function closeAddSampleDialog(){
  sampleImportGeneration++;
  if(sampleRecording){
    const recording=sampleRecording;
    recording.cancelled=true;
    sampleRecording=null;
    if(recording.recorder.state!=="inactive")recording.recorder.stop();
    stopSampleRecordingTracks(recording);
  }
  $("addSampleDialog").hidden=true;
  $("addSampleError").textContent="";
  pendingSampleDraft=null;
  addSampleTarget=null;
}

function updateSampleRecordingTimer(recording){
  if(sampleRecording!==recording)return;
  const seconds=Math.floor((performance.now()-recording.startedAt)/1000);
  $("addSampleRecordingTimer").textContent=
    `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
}

async function decodeSampleBlob(blob){
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  if(!AudioContextClass)throw new Error(t("web_audio_unsupported"));
  const context=state.audio.ctx||new AudioContextClass();
  const closeContext=!state.audio.ctx;
  try{
    return await context.decodeAudioData(await blob.arrayBuffer());
  }catch(err){
    throw new Error(t("sample_audio_decode_failed"));
  }finally{
    if(closeContext)await context.close();
  }
}

async function monoSampleBuffer(audioBuffer){
  const sourceRate=audioBuffer.sampleRate;
  const targetRate=clamp(Math.min(sourceRate,48000),4000,48000);
  const mono=new Float32Array(audioBuffer.length);
  for(let channel=0;channel<audioBuffer.numberOfChannels;channel++){
    const samples=audioBuffer.getChannelData(channel);
    for(let i=0;i<samples.length;i++)mono[i]+=samples[i]/audioBuffer.numberOfChannels;
  }
  if(targetRate===sourceRate)return {samples:mono,sampleRate:targetRate};

  const OfflineContextClass=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  if(OfflineContextClass){
    const length=Math.max(1,Math.ceil(mono.length*targetRate/sourceRate));
    const offline=new OfflineContextClass(1,length,targetRate);
    const sourceBuffer=offline.createBuffer(1,mono.length,sourceRate);
    sourceBuffer.copyToChannel(mono,0);
    const source=offline.createBufferSource();
    source.buffer=sourceBuffer;
    source.connect(offline.destination);
    source.start();
    const rendered=await offline.startRendering();
    return {samples:rendered.getChannelData(0).slice(),sampleRate:targetRate};
  }

  const length=Math.max(1,Math.ceil(mono.length*targetRate/sourceRate));
  const resampled=new Float32Array(length);
  for(let i=0;i<length;i++){
    const position=i*sourceRate/targetRate;
    const left=Math.min(Math.floor(position),mono.length-1);
    const right=Math.min(left+1,mono.length-1);
    const fraction=position-left;
    resampled[i]=mono[left]*(1-fraction)+mono[right]*fraction;
  }
  return {samples:resampled,sampleRate:targetRate};
}

function estimateEnvelopeOffsets(samples,sampleRate){
  const windowSize=Math.max(1,Math.round(sampleRate*0.01));
  const levels=[];
  for(let start=0;start<samples.length;start+=windowSize){
    const end=Math.min(samples.length,start+windowSize);
    let energy=0;
    for(let i=start;i<end;i++)energy+=samples[i]*samples[i];
    levels.push(Math.sqrt(energy/(end-start)));
  }
  if(levels.length===0)return {offsets:[255,192,160,128,96,0],rates:[0,0,0,0,0,0]};

  let peak=0,peakIndex=0;
  for(let i=0;i<levels.length;i++){
    if(levels[i]>peak){peak=levels[i];peakIndex=i;}
  }
  if(peak<0.00001)return {offsets:[255,192,160,128,96,0],rates:[0,0,0,0,0,0]};
  const endIndex=levels.length-1;
  const attackIndex=levels.findIndex((level,index)=>index<=peakIndex&&level>=peak*0.9);
  const sustainStart=Math.min(endIndex,Math.max(peakIndex+1,Math.round(peakIndex+(endIndex-peakIndex)*0.35)));
  const sustainEnd=Math.max(sustainStart,Math.round(endIndex*0.75));
  const sustainSlice=levels.slice(sustainStart,sustainEnd+1);
  const sustainLevel=sustainSlice.length
    ? sustainSlice.reduce((sum,level)=>sum+level,0)/sustainSlice.length
    : levels[sustainStart];
  const toOffset=level=>clamp(Math.round(level/peak*255),0,255);
  const at=position=>levels[clamp(Math.round(endIndex*position),0,endIndex)];
  const offsets=[
    255,
    toOffset(levels[sustainStart]),
    toOffset(sustainLevel),
    toOffset(at(0.72)),
    toOffset(at(0.86)),
    toOffset(at(0.98))
  ];
  const durations=[
    Math.max(1,(attackIndex<0?peakIndex:attackIndex)*windowSize*1000/sampleRate),
    Math.max(1,(sustainStart-peakIndex)*windowSize*1000/sampleRate),
    Math.max(1,(sustainEnd-sustainStart)*windowSize*1000/sampleRate),
    Math.max(1,(endIndex-sustainEnd)*windowSize*1000/sampleRate),
    Math.max(1,(endIndex-sustainEnd)*windowSize*500/sampleRate),
    Math.max(1,(endIndex-sustainEnd)*windowSize*500/sampleRate)
  ];
  const rateStarts=[0,offsets[0],offsets[1],offsets[2],offsets[3],offsets[4]];
  const rateEnds=[offsets[0],offsets[1],offsets[2],0,offsets[4],offsets[5]];
  const rates=rateEnds.map((end,index)=>{
    let bestRate=0,bestDifference=Infinity;
    for(let rate=0;rate<=255;rate++){
      const difference=Math.abs(gusEnvMs(rate,rateStarts[index],end)-durations[index]);
      if(difference<bestDifference){bestDifference=difference;bestRate=rate;}
    }
    return bestRate;
  });
  return {offsets,rates};
}

function estimateRootFrequency(samples,sampleRate){
  const stride=Math.max(1,Math.floor(sampleRate/8000));
  const analyzedRate=sampleRate/stride;
  const length=Math.min(Math.floor(samples.length/stride),Math.floor(analyzedRate*0.12));
  if(length<32)return 440;
  const data=new Float32Array(length);
  let mean=0;
  for(let i=0;i<length;i++){data[i]=samples[i*stride];mean+=data[i];}
  mean/=length;
  for(let i=0;i<length;i++)data[i]-=mean;
  let energy=0;
  for(const value of data)energy+=value*value;
  if(energy<0.000001)return 440;

  const minLag=Math.max(2,Math.floor(analyzedRate/2000));
  const maxLag=Math.min(Math.floor(analyzedRate/40),Math.floor(length/2));
  let bestLag=0,bestCorrelation=0;
  for(let lag=minLag;lag<=maxLag;lag++){
    let correlation=0,referenceEnergy=0;
    for(let i=0;i<length-lag;i++){
      correlation+=data[i]*data[i+lag];
      referenceEnergy+=data[i]*data[i];
    }
    const normalized=referenceEnergy?correlation/referenceEnergy:0;
    if(normalized>bestCorrelation){bestCorrelation=normalized;bestLag=lag;}
  }
  return bestCorrelation>=0.55&&bestLag?clamp(analyzedRate/bestLag,40,2000):440;
}

function buildSampleDraft(audioBuffer,name){
  return monoSampleBuffer(audioBuffer).then(({samples,sampleRate})=>{
    if(samples.length===0)throw new Error(t("sample_audio_empty"));
    const envelope=estimateEnvelopeOffsets(samples,sampleRate);
    const pcm=new Uint8Array(samples.length*2);
    for(let i=0;i<samples.length;i++){
      let value=Math.round(clamp(samples[i],-1,1)*32767);
      if(value<0)value+=65536;
      pcm[i*2]=value&255;
      pcm[i*2+1]=(value>>8)&255;
    }
    const rootFrequency=estimateRootFrequency(samples,sampleRate);
    const safeName=String(name||"SAMPLE").replace(/\.[^.]+$/,"").replace(/[^\w-]/g,"").substring(0,7)||"SAMPLE";
    const sample={
      name:safeName,fractions:0,dataSize:pcm.length,loopStart:0,loopEnd:pcm.length,sampleRate,
      lowFreq:8176,highFreq:12543854,rootFreq:Math.round(rootFrequency*1000),
      tune:0,balance:7,envRates:envelope.rates,envOffsets:envelope.offsets,
      tremoloSweep:0,tremoloRate:0,tremoloDepth:0,
      vibratoSweep:0,vibratoRate:0,vibratoDepth:0,
      modes:M16|MENV,scaleFreq:60,scaleFactor:1024,
      reserved:new Uint8Array(36),pcm,_float:samples
    };
    return {sample,duration:samples.length/sampleRate,sourceName:name||"SAMPLE"};
  });
}

function populateAddSampleParameters(sample,duration){
  const bps=fmt(sample).bps;
  const fields={
    addSampleName:sample.name,
    addSampleRate:sample.sampleRate,
    addSampleRoot:sample.rootFreq,
    addSampleBalance:sample.balance,
    addSampleLow:sample.lowFreq,
    addSampleHigh:sample.highFreq,
    addSampleLoopStart:Math.round(sample.loopStart/bps),
    addSampleLoopEnd:Math.round(sample.loopEnd/bps),
    addSampleFractions:sample.fractions,
    addSampleTune:sample.tune,
    addSampleScaleFreq:sample.scaleFreq,
    addSampleScaleFactor:sample.scaleFactor,
    addSampleTremSweep:sample.tremoloSweep,
    addSampleTremRate:sample.tremoloRate,
    addSampleTremDepth:sample.tremoloDepth,
    addSampleVibSweep:sample.vibratoSweep,
    addSampleVibRate:sample.vibratoRate,
    addSampleVibDepth:sample.vibratoDepth
  };
  for(const [id,value] of Object.entries(fields))$(id).value=value??0;
  $("addSampleLoopStart").max=Math.floor(sample.pcm.length/bps);
  $("addSampleLoopEnd").max=Math.floor(sample.pcm.length/bps);
  $("addSampleDuration").textContent=`${duration.toFixed(2)} s`;

  const names=["env_attack","env_decay","env_sustain","env_rate_1","env_rate_2","env_rate_3"];
  for(const [kind,values] of [["rate",sample.envRates],["offset",sample.envOffsets]]){
    const grid=kind==="rate"?$("addSampleRates"):$("addSampleOffsets");
    const attribute=kind==="rate"?"data-add-sample-rate":"data-add-sample-offset";
    grid.innerHTML="";
    values.forEach((value,index)=>{
      const field=document.createElement("div");
      field.className="field";
      field.innerHTML=`<label>${t(`${kind}_label`,{name:t(names[index])})}</label><input type="number" min="0" max="255" ${attribute}="${index}" value="${value}">`;
      grid.appendChild(field);
    });
  }

  const modes=$("addSampleModes");
  modes.innerHTML="";
  for(const [bit,label] of MODE_LABELS){
    const field=document.createElement("label");
    field.className="check";
    field.innerHTML=`<input type="checkbox" data-add-sample-mode="${bit}" ${(sample.modes&bit)?"checked":""}><span>${t(label)}</span>`;
    modes.appendChild(field);
  }
}

async function loadSampleDraft(blob,name){
  const generation=++sampleImportGeneration;
  $("addSampleError").textContent="";
  $("btnConfirmAddSample").disabled=true;
  $("btnChooseSampleFile").disabled=true;
  $("btnStartSampleRecording").disabled=true;
  $("addSampleRecordingStatus").textContent=t("sample_processing");
  try{
    const audioBuffer=await decodeSampleBlob(blob);
    const draft=await buildSampleDraft(audioBuffer,name);
    if(generation!==sampleImportGeneration||$("addSampleDialog").hidden)return;
    pendingSampleDraft=draft;
    populateAddSampleParameters(draft.sample,draft.duration);
    $("addSamplePreview").hidden=false;
    $("addSampleRecordingStatus").textContent=t("sample_audio_ready");
    $("btnChooseSampleFile").disabled=false;
    $("btnStartSampleRecording").disabled=false;
    $("btnConfirmAddSample").disabled=false;
  }catch(err){
    if(generation!==sampleImportGeneration||$("addSampleDialog").hidden)return;
    console.error("Sample audio conversion failed:",err);
    $("addSampleError").textContent=err.message||t("sample_audio_decode_failed");
    $("addSampleRecordingStatus").textContent="";
    $("btnChooseSampleFile").disabled=false;
    $("btnStartSampleRecording").disabled=false;
  }
}

function startSampleRecording(){
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){
    $("addSampleError").textContent=t("sample_microphone_unsupported");
    return;
  }
  pendingSampleDraft=null;
  $("addSamplePreview").hidden=true;
  $("addSampleFileName").textContent="";
  $("btnConfirmAddSample").disabled=true;
  $("addSampleError").textContent="";
  $("btnStartSampleRecording").disabled=true;
  $("btnChooseSampleFile").disabled=true;
  $("addSampleRecordingStatus").textContent=t("sample_microphone_permission");
  const generation=sampleImportGeneration;
  let requestedStream=null;
  navigator.mediaDevices.getUserMedia({audio:{
    channelCount:1,echoCancellation:false,noiseSuppression:false,autoGainControl:false
  }}).then(stream=>{
    requestedStream=stream;
    if(generation!==sampleImportGeneration||$("addSampleDialog").hidden){
      for(const track of stream.getTracks())track.stop();
      return;
    }
    const mimeType=typeof MediaRecorder.isTypeSupported==="function"
      ?["audio/webm;codecs=opus","audio/ogg;codecs=opus"].find(type=>MediaRecorder.isTypeSupported(type))
      :null;
    const recorder=mimeType?new MediaRecorder(stream,{mimeType}):new MediaRecorder(stream);
    const recording={stream,recorder,chunks:[],startedAt:performance.now(),timer:null,cancelled:false};
    sampleRecording=recording;
    recorder.addEventListener("dataavailable",event=>{
      if(event.data.size)recording.chunks.push(event.data);
    });
    recorder.addEventListener("error",event=>{
      console.error("Microphone recording failed:",event.error||event);
      recording.failed=true;
      $("addSampleError").textContent=event.error?.message||t("sample_recording_failed");
      if(recorder.state!=="inactive")recorder.stop();
    });
    recorder.addEventListener("stop",async()=>{
      stopSampleRecordingTracks(recording);
      if(sampleRecording!==recording||recording.cancelled)return;
      sampleRecording=null;
      $("btnStartSampleRecording").disabled=false;
      $("btnStopSampleRecording").disabled=true;
      $("btnChooseSampleFile").disabled=false;
      if(recording.failed){
        $("addSampleRecordingStatus").textContent="";
        return;
      }
      const blob=new Blob(recording.chunks,{type:recorder.mimeType||"audio/webm"});
      await loadSampleDraft(blob,"RECORDING");
    });
    recorder.start(250);
    $("btnStartSampleRecording").disabled=true;
    $("btnStopSampleRecording").disabled=false;
    $("btnChooseSampleFile").disabled=true;
    $("addSampleRecordingStatus").textContent=t("sample_recording");
    recording.timer=setInterval(()=>updateSampleRecordingTimer(recording),250);
  }).catch(err=>{
    if(requestedStream)for(const track of requestedStream.getTracks())track.stop();
    if(generation!==sampleImportGeneration||$("addSampleDialog").hidden)return;
    console.error("Unable to access microphone:",err);
    $("addSampleError").textContent=t("sample_microphone_failed",{message:err.message});
    $("btnStartSampleRecording").disabled=false;
    $("btnChooseSampleFile").disabled=false;
    $("addSampleRecordingStatus").textContent="";
  });
}

function stopSampleRecording(){
  if(sampleRecording&&sampleRecording.recorder.state!=="inactive"){
    $("btnStopSampleRecording").disabled=true;
    sampleRecording.recorder.stop();
  }
}

function addSampleToPatch(){
  const target=addSampleTarget;
  const draft=pendingSampleDraft;
  if(!target||!draft)return;
  if(target.patchId!==state.currentPatchId||!state.patch?.instruments[target.instrumentIndex]){
    $("addSampleError").textContent=t("sample_patch_changed");
    return;
  }
  const instrument=state.patch.instruments[target.instrumentIndex];
  if(instrument.layers.length===0){
    instrument.layers.push({
      duplicate:0,layer:0,layerSize:0,reserved:new Uint8Array(40),samples:[]
    });
  }
  const layer=instrument.layers[0];
  if(layer.samples.length>=255){
    $("addSampleError").textContent=t("sample_layer_limit");
    return;
  }
  const sample=draft.sample;
  const readNumber=(id,min,max,fallback=0)=>{
    const parsed=parseInt($(id).value,10);
    return clamp(Number.isFinite(parsed)?parsed:fallback,min,max);
  };
  sample.name=String($("addSampleName").value||"SAMPLE").replace(/[^\w-]/g,"").substring(0,7)||"SAMPLE";
  sample.sampleRate=readNumber("addSampleRate",1,65535,22050);
  sample.rootFreq=readNumber("addSampleRoot",0,0xFFFFFFFF);
  sample.balance=readNumber("addSampleBalance",0,15,7);
  sample.lowFreq=readNumber("addSampleLow",0,0xFFFFFFFF);
  sample.highFreq=readNumber("addSampleHigh",0,0xFFFFFFFF);
  sample.fractions=readNumber("addSampleFractions",0,255);
  sample.tune=readNumber("addSampleTune",0,65535);
  sample.scaleFreq=readNumber("addSampleScaleFreq",0,65535,60);
  sample.scaleFactor=readNumber("addSampleScaleFactor",0,65535,1024);
  sample.tremoloSweep=readNumber("addSampleTremSweep",0,255);
  sample.tremoloRate=readNumber("addSampleTremRate",0,255);
  sample.tremoloDepth=readNumber("addSampleTremDepth",0,255);
  sample.vibratoSweep=readNumber("addSampleVibSweep",0,255);
  sample.vibratoRate=readNumber("addSampleVibRate",0,255);
  sample.vibratoDepth=readNumber("addSampleVibDepth",0,255);
  sample.envRates=Array.from($("addSampleRates").querySelectorAll("[data-add-sample-rate]"))
    .map(input=>clamp(parseInt(input.value,10)||0,0,255));
  sample.envOffsets=Array.from($("addSampleOffsets").querySelectorAll("[data-add-sample-offset]"))
    .map(input=>clamp(parseInt(input.value,10)||0,0,255));
  sample.modes=0;
  for(const input of $("addSampleModes").querySelectorAll("[data-add-sample-mode]")){
    if(input.checked)sample.modes|=parseInt(input.dataset.addSampleMode,10);
  }
  commitFloat(sample);
  const bps=fmt(sample).bps;
  const total=Math.floor(sample.pcm.length/bps);
  const loopStart=clamp(parseInt($("addSampleLoopStart").value,10)||0,0,total);
  let loopEnd=clamp(parseInt($("addSampleLoopEnd").value,10)||0,0,total);
  if(loopEnd<=loopStart)loopEnd=Math.min(total,loopStart+1);
  sample.loopStart=loopStart*bps;
  sample.loopEnd=loopEnd*bps;
  sample.dataSize=sample.pcm.length;
  $("addSampleName").value=sample.name;
  $("addSampleLoopStart").value=loopStart;
  $("addSampleLoopEnd").value=loopEnd;
  layer.samples.push(sample);
  state.selInst=target.instrumentIndex;
  state.selSample=sample;
  state.selStart=state.selEnd=0;
  state.undo=[];
  state.zoom=1; state.offset=0;
  const samples=allSamples();
  state.patch.header.waveForms=samples.length;
  state.patch.header.dataSize=samples.reduce((size,ref)=>size+ref.sample.pcm.length,0);
  closeAddSampleDialog();
  render();
  showStatus(t("sample_added"),"ok");
}

/* ---------- MIDI Demo Project ---------- */
function requestMidiDemoProject(buttons){
  if(isDemoGenerating)return;
  if(state.projects.some(entry=>entry.demoGenerated===true)){
    createMidiDemoProject(buttons);
    return;
  }
  $("demoProjectError").textContent="";
  $("demoProjectName").value=t("demo_project_name");
  $("demoProjectDialog").hidden=false;
  $("demoProjectName").focus();
  $("demoProjectName").select();
}

function closeDemoProjectDialog(){
  if($("btnConfirmDemoProject").disabled)return;
  $("demoProjectDialog").hidden=true;
  $("demoProjectError").textContent="";
}

async function confirmDemoProject(buttons){
  if($("btnConfirmDemoProject").disabled)return;
  const name=$("demoProjectName").value.trim();
  if(!name){
    $("demoProjectError").textContent=t("project_name_required");
    $("demoProjectName").focus();
    return;
  }
  const confirmButton=$("btnConfirmDemoProject");
  const cancelButton=$("btnCancelDemoProject");
  confirmButton.disabled=true;
  cancelButton.disabled=true;
  $("demoProjectError").textContent="";
  $("demoProjectDialog").hidden=true;
  try{
    await createMidiDemoProject(buttons,name);
  }finally{
    confirmButton.disabled=false;
    cancelButton.disabled=false;
  }
}

async function createMidiDemoProject(buttons,projectName){
  if(isDemoGenerating)return;
  isDemoGenerating=true;
  buttons.forEach(button=>button.disabled=true);
  try{
    if(!projectPatchGenerator)projectPatchGenerator=new ProjectPatchGenerator();
    const melodic=projectPatchGenerator.getPrograms(false);
    const drums=projectPatchGenerator.getPrograms(true);
    if(melodic.length!==128 || drums.length===0){
      throw new Error("The demo instrument library is incomplete.");
    }

    let project=state.projects.find(entry=>entry.demoGenerated===true);
    const isNewProject=!project;
    if(!project){
      project={
        id:uid("demo-project"),
        name:projectName || t("demo_project_name"),
        patchIds:[],
        demoGenerated:true
      };
    }

    const existingPatches=getProjectPatches(project);
    const existingPrograms=new Set(existingPatches
      .filter(entry=>entry.gmProgram!==undefined && entry.gmProgram!==-1)
      .map(entry=>`${entry.gmBank===128 ? 128 : 0}:${entry.gmProgram}`));
    const tasks=[
      ...melodic.map(instrument=>({instrument,isDrum:false,bank:0})),
      ...drums.map(instrument=>({instrument,isDrum:true,bank:128}))
    ];
    const missingTasks=tasks.filter(({instrument,bank})=>
      !existingPrograms.has(`${bank}:${instrument.id}`)
    );

    if(missingTasks.length===0){
      if(isNewProject)throw new Error("No demo instruments were generated.");
      selectProject(project.id);
      showStatus(t("demo_project_ready",{count:tasks.length}),"ok");
      return;
    }

    const entries=[];
    let completed=tasks.length-missingTasks.length;
    showStatus(t("demo_generation_progress",{completed,total:tasks.length}));
    for(let index=0;index<missingTasks.length;index++){
      const {instrument,isDrum,bank}=missingTasks[index];
      const generated=projectPatchGenerator.generate({isDrum,program:instrument.id});
      entries.push({
        id:uid("demo-patch"),
        name:generated.name,
        source:"demo-generated",
        gmProgram:generated.program,
        gmBank:bank,
        ...(isDrum ? {drumSet:0} : {}),
        patch:generated.patch
      });
      completed++;
      if((index+1)%8===0 || index===missingTasks.length-1){
        showStatus(t("demo_generation_progress",{
          completed,
          total:tasks.length
        }));
        await new Promise(resolve=>setTimeout(resolve,0));
      }
    }

    const updatedProject={
      ...project,
      patchIds:[...(project.patchIds||[]),...entries.map(entry=>entry.id)],
      demoGenerated:true
    };
    await dbSaveProjectAndPatches(updatedProject,entries);
    if(isNewProject)state.projects.push(updatedProject);
    else state.projects=state.projects.map(entry=>entry.id===updatedProject.id ? updatedProject : entry);
    state.patches.push(...entries);
    selectProject(updatedProject.id);
    if(entries.length>0)selectPatch(entries[0].id);
    showStatus(t("demo_project_ready",{count:tasks.length}),"ok");
  }catch(err){
    console.error("Demo project generation failed:",err);
    showStatus(t("demo_generation_failed",{message:err.message}),"bad");
  }finally{
    isDemoGenerating=false;
    buttons.forEach(button=>button.disabled=false);
  }
}

/* ---------- File Detection & Handler ---------- */
function detectFileType(ab){
  if(ab.byteLength<12)return null;
  const b=new Uint8Array(ab,0,12);
  let s="";
  for(let i=0;i<12;i++)s+=String.fromCharCode(b[i]);
  if(s.startsWith("GF1PATCH"))return "pat";
  if(s.startsWith("RIFF")&&s.substring(8,12)==="sfbk")return "sf2";
  return null;
}

function handleFileOpen(e){
  const file=e.target.files&&e.target.files[0];
  if(!file)return;
  if(!state.projects.some(project => project.id === state.currentProjectId)) {
    e.target.value="";
    requestProjectForImport();
    return;
  }
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const ab=reader.result;
      const type=detectFileType(ab);
      if(type==="pat"){
        const patch=parsePAT(ab);
        const entry={
          id: uid("pat"),
          name: (patch.header.description||file.name.replace(/\.pat$/i,"")).substring(0,64),
          source: "pat",
          gmProgram: -1,
          gmBank: 0,
          patch
        };
        addPatchEntries([entry]).then(added=>{
          if(!added)return;
          const count = allSamples().length;
          showStatus(t("file_loading", {filename: file.name, samples: t(count === 1 ? "sample_count_one" : "sample_count_many", {count})}),"ok");
        }).catch(err=>{
          console.error("PAT import error:", err);
          showStatus(t("patch_add_failed", {message: err.message}), "bad");
        });
      } else if(type==="sf2"){
        showStatus(t("converting_sf2"));
        setTimeout(() => {
          try {
            const sf2=parseSF2(ab);
            const entries=sf2ToGusPatches(sf2,file.name);
            if(entries.length===0){
              showStatus(t("sf2_no_preset"),"bad");
              showAlert("sf2_no_samples_alert");
            } else {
              addPatchEntries(entries).then(added=>{
                if(!added)return;
                const count = entries.length;
                showStatus(t("sf2_added_to_project", {filename: file.name, patches: t(count === 1 ? "patch_count_one" : "patch_count_many", {count})}),"ok");
              }).catch(err=>{
                console.error("SF2 import error:", err);
                showStatus(t("patch_add_failed", {message: err.message}), "bad");
              });
            }
          } catch(err) {
            console.error(err);
            showStatus(t("sf2_conversion_failed", {message: err.message}), "bad");
            showAlert("sf2_conversion_alert", {message: err.message});
          }
          e.target.value="";
        }, 100);
        return;
      } else {
        throw new Error(t("unknown_file_format"));
      }
      e.target.value="";
    }catch(err){
      console.error(err);
      showStatus(t("file_parse_failed", {message: err.message}),"bad");
      showAlert("file_load_alert", {message: err.message});
      e.target.value="";
    }
  };
  reader.onerror=()=>{showStatus(t("file_read_failed"),"bad");e.target.value="";};
  reader.readAsArrayBuffer(file);
}

/* ---------- Save current patch ---------- */
function savePAT(){
  if(!state.patch)return;
  try{
    const clean=cleanPatchForStorage(state.patch);
    const bytes=writePAT(clean);
    const blob=new Blob([bytes],{type:"application/octet-stream"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    const name=(state.patch.header.description||"patch").replace(/[^\w\-]+/g,"_");
    a.download=name+".pat";
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    showStatus(t("pat_downloaded"),"ok");
  }catch(err){
    showAlert("save_alert", {message: err.message});
    showStatus(t("save_failed_short"),"bad");
  }
}

/* ---------- WAV Handlers ---------- */
function exportWav(){
  const s=state.selSample; if(!s)return;
  const blob=encodeWav(s);
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=(s.name||"sample")+".wav";
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  showStatus(t("wav_downloaded"),"ok");
}

function importWav(e){
  const file=e.target.files&&e.target.files[0]; if(!file)return;
  const s=state.selSample; if(!s){showAlert("select_sample_first");e.target.value="";return;}
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const wav=decodeWav(reader.result);
      pushUndo(s);
      s._float=wav.samples;
      commitFloat(s);
      s.sampleRate=wav.sampleRate;
      if(wav.hasLoop){
        const bps=fmt(s).bps;
        s.loopStart=Math.round(wav.loopStart*bps);
        s.loopEnd=Math.round(wav.loopEnd*bps);
        s.modes|=MLOOP;
      }
      renderSampleEditor(); render();
      const count = s._float.length;
      showStatus(t("wav_imported", {samples: t(count === 1 ? "sample_count_one" : "sample_count_many", {count: count.toLocaleString()})}),"ok");
    }catch(err){
      showAlert("wav_import_alert", {message: err.message});
      showStatus(t("wav_import_failed"),"bad");
    }
    e.target.value="";
  };
  reader.readAsArrayBuffer(file);
}

/* ---------- MIDI ---------- */
async function enableMidi(){
  if(state.midi.enabled){disableMidi();return;}
  if(!navigator.requestMIDIAccess){showAlert("midi_not_supported");return;}
  try{
    const access=await navigator.requestMIDIAccess();
    state.midi.access=access;
    state.midi.enabled=true;
    refreshMidiInputs();
    access.onstatechange=refreshMidiInputs;
    $("midiDot").classList.add("on");
    $("btnMidi").textContent=t("disable");
    showStatus(t("midi_enabled"),"ok");
  }catch(err){ showAlert("midi_enable_failed", {message: err.message}); }
}
function disableMidi(){
  if(state.midi.input)state.midi.input.onmidimessage=null;
  state.midi.enabled=false; state.midi.input=null;
  $("midiDot").classList.remove("on");
  $("btnMidi").textContent=t("enable");
  $("midiSelect").innerHTML=`<option>${t("midi_off")}</option>`;
  $("midiSelect").disabled=true;
  showStatus(t("midi_disabled"));
  releaseAllVoices(true);
}
function refreshMidiInputs(){
  const access=state.midi.access; if(!access)return;
  const sel=$("midiSelect"); sel.innerHTML="";
  const inputs=Array.from(access.inputs.values());
  if(inputs.length===0){sel.innerHTML=`<option>${t("no_midi_input")}</option>`; return;}
  inputs.forEach(inp=>{
    const o=document.createElement("option");
    o.value=inp.id; o.textContent=inp.name||inp.id;
    sel.appendChild(o);
  });
  sel.disabled=false;
  const first=inputs[0];
  if(first){state.midi.input=first; first.onmidimessage=handleMidiMessage;}
}
function handleMidiMessage(e){
  const data=e.data, [st,d1,d2]=data;
  const cmd=st&0xf0;
  $("midiMonitor").textContent=`${new Date().toLocaleTimeString()} | ${cmd.toString(16).padStart(2,"0")} ${d1} ${d2??""}`;
  if(cmd===0x90&&d2>0){
    const s=state.selSample;
    if(s){ensureAudio(); playSample(s,d1,d2,true);}
  } else if(cmd===0x80||(cmd===0x90&&d2===0)){
    releaseAllVoices(true);
  } else if(cmd===0xC0){
    if(state.patch&&state.patch.instruments[d1]){
      state.selInst=d1; state.selSample=null;
      state.zoom=1; state.offset=0; updateZoomUI();
      render();
    }
  } else if(cmd===0xB0&&d1===7){
    if(state.patch)state.patch.header.masterVolume=clamp(d2,0,127);
  }
}

/* ---------- Bind UI ---------- */
function bind(){
  const patInput=$("patFile");
  const sf2Input=$("sf2File");
  [$("btnOpen"),$("btnOpen2")].forEach(b=>{
    if(b) b.addEventListener("click",()=>{
      if(!state.projects.some(project => project.id === state.currentProjectId)) {
        requestProjectForImport();
        return;
      }
      patInput.value="";
      patInput.click();
    });
  });
  patInput.addEventListener("change",handleFileOpen);
  $("btnImportSoundfont").addEventListener("click",()=>{
    if(!state.projects.some(project=>project.id===state.currentProjectId)){
      requestProjectForImport();
      return;
    }
    sf2Input.value="";
    sf2Input.click();
  });
  sf2Input.addEventListener("change",handleFileOpen);
  $("projectPatchFile").addEventListener("change", handleProjectPatchFile);

  const demoButtons=[$("btnDemo"),$("btnDemo2")].filter(Boolean);
  demoButtons.forEach(button=>button.addEventListener("click",()=>requestMidiDemoProject(demoButtons)));
  $("btnCancelDemoProject").addEventListener("click",closeDemoProjectDialog);
  $("btnConfirmDemoProject").addEventListener("click",()=>confirmDemoProject(demoButtons));
  $("demoProjectName").addEventListener("input",()=>$("demoProjectError").textContent="");
  $("demoProjectName").addEventListener("keydown",event=>{
    if(event.key==="Enter"){
      event.preventDefault();
      confirmDemoProject(demoButtons);
    }else if(event.key==="Escape"){
      closeDemoProjectDialog();
    }
  });
  $("demoProjectDialog").addEventListener("click",event=>{
    if(event.target===$("demoProjectDialog"))closeDemoProjectDialog();
  });
  $("demoProjectDialog").addEventListener("keydown",event=>{
    if(event.key==="Escape")closeDemoProjectDialog();
  });

  $("btnSave").addEventListener("click",savePAT);

  $("btnExportAll").addEventListener("click",exportAllPatches);
  $("btnClearLib").addEventListener("click",clearLibrary);
  $("btnExportInst").addEventListener("click",()=>exportInstrument(state.selInst));

  $("btnMidi").addEventListener("click",enableMidi);
  $("midiSelect").addEventListener("change",e=>{
    const inps=Array.from(state.midi.access.inputs.values());
    const inp=inps.find(i=>i.id===e.target.value);
    if(inp){if(state.midi.input)state.midi.input.onmidimessage=null; state.midi.input=inp; inp.onmidimessage=handleMidiMessage;}
  });

  const newProjectDialog = $("newProjectDialog");
  const newProjectName = $("newProjectName");
  const newProjectError = $("newProjectError");
  $("btnNewProject").addEventListener("click", () => {
    openNewProjectDialog();
  });
  $("btnCancelNewProject").addEventListener("click", () => {
    newProjectDialog.hidden = true;
  });
  $("btnConfirmNewProject").addEventListener("click", confirmNewProject);
  newProjectName.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      confirmNewProject();
    } else if (event.key === "Escape") {
      newProjectDialog.hidden = true;
    }
  });
  $("btnCancelDeleteProject").addEventListener("click", closeDeleteProjectDialog);
  $("btnConfirmDeleteProject").addEventListener("click", confirmDeleteProject);
  $("deleteProjectDialog").addEventListener("click", event => {
    if (event.target === $("deleteProjectDialog")) closeDeleteProjectDialog();
  });
  $("deleteProjectDialog").addEventListener("keydown", event => {
    if (event.key === "Escape" && !$("btnConfirmDeleteProject").disabled) {
      closeDeleteProjectDialog();
    }
  });
  $("btnCancelAction").addEventListener("click",closeConfirmationDialog);
  $("btnConfirmAction").addEventListener("click",runConfirmationAction);
  $("confirmActionDialog").addEventListener("click",event=>{
    if(event.target===$("confirmActionDialog"))closeConfirmationDialog();
  });
  $("confirmActionDialog").addEventListener("keydown",event=>{
    if(event.key==="Escape" && !$("btnConfirmAction").disabled)closeConfirmationDialog();
  });
  $("btnCloseAlert").addEventListener("click",closeAlert);
  $("alertDialog").addEventListener("click",event=>{
    if(event.target===$("alertDialog"))closeAlert();
  });
  $("alertDialog").addEventListener("keydown",event=>{
    if(event.key==="Escape")closeAlert();
  });
  $("btnCancelClearLibrary").addEventListener("click", closeClearLibraryDialog);
  $("btnConfirmClearLibrary").addEventListener("click", confirmClearLibrary);
  $("clearLibraryDialog").addEventListener("click", event => {
    if (event.target === $("clearLibraryDialog")) closeClearLibraryDialog();
  });
  $("clearLibraryDialog").addEventListener("keydown", event => {
    if (event.key === "Escape" && !$("btnConfirmClearLibrary").disabled) {
      closeClearLibraryDialog();
    }
  });
  $("btnCloseProjectRequired").addEventListener("click", closeProjectRequiredDialog);
  $("btnCreateProjectFromRequired").addEventListener("click", () => {
    closeProjectRequiredDialog();
    openNewProjectDialog();
  });
  newProjectName.addEventListener("input", () => {
    newProjectError.textContent = "";
  });
  newProjectDialog.addEventListener("click", event => {
    if (event.target === newProjectDialog) newProjectDialog.hidden = true;
  });
  $("btnDeleteProject").addEventListener("click", () => {
    if (state.currentProjectId) requestDeleteProject(state.currentProjectId);
  });
  $("btnLibraryScope").addEventListener("click", () => {
    if (!state.currentProjectId) return;
    state.libraryView = state.libraryView === "all" ? "project" : "all";
    renderLibrary();
  });
  $("btnChooseProjectPatchFile").addEventListener("click", () => {
    const input = $("projectPatchFile");
    input.value = "";
    input.click();
  });
  $("patchGeneratorType").addEventListener("change", populateGeneratedProgramOptions);
  $("btnGenerateProjectPatch").addEventListener("click", generateProjectPatch);
  $("btnCancelAddPatch").addEventListener("click", closeAddPatchDialog);
  $("addPatchDialog").addEventListener("click", event => {
    if (event.target === $("addPatchDialog")) closeAddPatchDialog();
  });
  $("addPatchDialog").addEventListener("keydown", event => {
    if (event.key === "Escape" && !$("btnGenerateProjectPatch").disabled) {
      closeAddPatchDialog();
    }
  });
  $("btnChooseSampleFile").addEventListener("click",()=>$("addSampleFile").click());
  $("addSampleFile").addEventListener("change",async event=>{
    const file=event.target.files&&event.target.files[0];
    if(!file)return;
    pendingSampleDraft=null;
    $("addSamplePreview").hidden=true;
    $("btnConfirmAddSample").disabled=true;
    $("addSampleFileName").textContent="";
    const supported=/\.(wav|mp3)$/i.test(file.name)
      ||file.type==="audio/wav"||file.type==="audio/x-wav"||file.type==="audio/mpeg";
    if(!supported){
      $("addSampleError").textContent=t("sample_file_format");
      event.target.value="";
      return;
    }
    $("addSampleError").textContent="";
    $("addSampleFileName").textContent=file.name;
    await loadSampleDraft(file,file.name);
    if(pendingSampleDraft)$("addSampleFileName").textContent=t("sample_file_ready",{filename:file.name});
    event.target.value="";
  });
  $("btnStartSampleRecording").addEventListener("click",startSampleRecording);
  $("btnStopSampleRecording").addEventListener("click",stopSampleRecording);
  $("btnCancelAddSample").addEventListener("click",closeAddSampleDialog);
  $("btnCloseAddSample").addEventListener("click",closeAddSampleDialog);
  $("btnConfirmAddSample").addEventListener("click",addSampleToPatch);
  $("addSampleDialog").addEventListener("click",event=>{
    if(event.target===$("addSampleDialog"))closeAddSampleDialog();
  });
  $("addSampleDialog").addEventListener("keydown",event=>{
    if(event.key==="Escape")closeAddSampleDialog();
  });
  $("btnExportProject").addEventListener("click", () => {
    if (state.currentProjectId) exportProject(state.currentProjectId);
  });
  $("btnAddToProject").addEventListener("click", addCurrentPatchToProject);

  $("btnLoadMidi").addEventListener("click", () => $("midiFile").click());

  // Bind MIDI Player Controls
  $("midiFile").addEventListener("change", loadMidiFile);
  
  $("btnPlayMidi").addEventListener("click", () => {
    if (midiProgress.paused) {
      togglePauseMidi(); // Jika sedang pause, tombol Play berfungsi sebagai Resume
    } else {
      playMidi(0);
    }
  });

  $("btnPauseMidi").addEventListener("click", togglePauseMidi);
  $("btnStopMidi").addEventListener("click", stopMidi);
  $("btnRenderMidi").addEventListener("click", renderMidiToWav);

  $("midiSeek").addEventListener("input", e => {
    if (!state.midiData) return;
    midiProgress.seeking = true;
    const targetTime = (parseInt(e.target.value, 10) / 1000) * midiProgress.duration;
    $("midiTimeCur").textContent = formatTime(targetTime);
  });

  $("midiSeek").addEventListener("change", (e) => {
    if (!state.midiData) return;
    const pct = parseInt(e.target.value, 10) / 1000;
    const targetTime = pct * midiProgress.duration;
    const wasPaused = midiProgress.paused;
    
    midiProgress.seeking = false;
    cancelAnimationFrame(midiProgress.raf);
    if (timidityPlayer) timidityPlayer.stop();
    midiProgress.current = targetTime;
    midiProgress.startTime = performance.now() - (targetTime * 1000);
    
    if (wasPaused) {
      midiProgress.playing = false;
      midiProgress.paused = true;
      updateMidiUI();
      setMidiStatus("midi_paused_at", {time: formatTime(targetTime)});
    } else {
      midiProgress.playing = false;
      midiProgress.paused = false;
      playMidi(targetTime);
    }
  });

  $("midiVolume").addEventListener("input", (e) => {
    const vol = parseInt(e.target.value);
    $("midiVolVal").textContent = vol + "%";
    
    // Jangan panggil applyMidiVolume() secara langsung jika audio belum di-load
    if (midiProgress.playing || midiProgress.paused) {
      applyMidiVolume();
    }
  });


  $("pVoices").addEventListener("change",e=>{
    if(!state.patch)return;
    state.patch.header.voices=clamp(parseInt(e.target.value)||14,1,32);
    e.target.value=state.patch.header.voices; scheduleSave();
  });
  $("pChannels").addEventListener("change",e=>{
    if(!state.patch)return;
    state.patch.header.channels=clamp(parseInt(e.target.value)||0,0,32);
    e.target.value=state.patch.header.channels; scheduleSave();
  });
  $("pDescription").addEventListener("input",e=>{
    if(!state.patch)return;
    state.patch.header.description=e.target.value.slice(0,60);
    $("patchNameSide").textContent=state.patch.header.description||t("unnamed");
    const entry=state.patches.find(p=>p.id===state.currentPatchId);
    if(entry){ entry.name=state.patch.header.description||t("patch"); renderLibrary(); }
    scheduleSave();
  });
  $("pMasterVolume").addEventListener("change",e=>{
    if(!state.patch)return;
    state.patch.header.masterVolume=clamp(parseInt(e.target.value)||0,0,127);
    e.target.value=state.patch.header.masterVolume;
    $("statVol").textContent=state.patch.header.masterVolume;
    scheduleSave();
  });

  $("pGMProgram").addEventListener("change", e => {
    const entry = state.patches.find(p=>p.id===state.currentPatchId);
    if (!entry) return;
    entry.gmProgram = clamp(parseInt(e.target.value) || -1, -1, 127);
    e.target.value = entry.gmProgram;
    renderLibrary();
    scheduleSave();
  });
  $("pGMBank").addEventListener("change", e => {
    const entry = state.patches.find(p=>p.id===state.currentPatchId);
    if (!entry) return;
    entry.gmBank = clamp(parseInt(e.target.value) || 0, 0, 127);
    e.target.value = entry.gmBank;
    renderLibrary();
    scheduleSave();
  });

  $("iNumber").addEventListener("change",e=>{
    const inst=state.patch?.instruments[state.selInst]; if(!inst)return;
    inst.instrument=clamp(parseInt(e.target.value)||0,0,65535);
    e.target.value=inst.instrument; render();
  });
  $("iName").addEventListener("input",e=>{
    const inst=state.patch?.instruments[state.selInst]; if(!inst)return;
    inst.name=e.target.value.slice(0,16);
    $("instTitle").textContent=inst.name||t("instrument_default");
    const items=$("instrumentList").children;
    if(items[state.selInst])items[state.selInst].querySelector(".name").textContent=inst.name||t("unnamed");
    scheduleSave();
  });

  $("btnSelectBank").addEventListener("click", openBankSelectDialog);
  $("btnCancelBankSelect").addEventListener("click", closeBankSelectDialog);
  $("btnConfirmBankSelect").addEventListener("click", () => {
    closeBankSelectDialog();
  });

  const bindProp=(id,prop,tf)=>{
    $(id).addEventListener("change",e=>{
      const s=state.selSample; if(!s)return;
      s[prop]=tf?tf(e.target.value):e.target.value;
      renderSampleEditor(); render();
    });
  };
  bindProp("sName","name",v=>String(v).slice(0,7));
  bindProp("sRate","sampleRate",v=>clamp(parseInt(v)||0,0,192000));
  bindProp("sRoot","rootFreq",v=>Math.max(0,parseInt(v)||0));
  bindProp("sBalance","balance",v=>clamp(parseInt(v)||0,0,15));
  bindProp("sLow","lowFreq",v=>Math.max(0,parseInt(v)||0));
  bindProp("sHigh","highFreq",v=>Math.max(0,parseInt(v)||0));
  bindProp("sFractions","fractions",v=>clamp(parseInt(v)||0,0,255));
  bindProp("sTune","tune",v=>clamp(parseInt(v)||0,0,65535));
  bindProp("sScaleFreq","scaleFreq",v=>clamp(parseInt(v)||0,0,65535));
  bindProp("sScaleFactor","scaleFactor",v=>clamp(parseInt(v)||0,0,65535));
  bindProp("sTremSweep","tremoloSweep",v=>clamp(parseInt(v)||0,0,255));
  bindProp("sTremRate","tremoloRate",v=>clamp(parseInt(v)||0,0,255));
  bindProp("sTremDepth","tremoloDepth",v=>clamp(parseInt(v)||0,0,255));
  bindProp("sVibSweep","vibratoSweep",v=>clamp(parseInt(v)||0,0,255));
  bindProp("sVibRate","vibratoRate",v=>clamp(parseInt(v)||0,0,255));
  bindProp("sVibDepth","vibratoDepth",v=>clamp(parseInt(v)||0,0,255));

  const updLoop=()=>{
    const s=state.selSample; if(!s)return;
    const bps=fmt(s).bps, total=Math.floor(s.pcm.length/bps);
    let a=clamp(parseInt($("sLoopStart").value)||0,0,total);
    let b=clamp(parseInt($("sLoopEnd").value)||0,0,total);
    if(b<=a+1)b=Math.min(total,a+1);
    s.loopStart=Math.round(a*bps); s.loopEnd=Math.round(b*bps); s.fractions=0;
    renderSampleEditor(); render();
  };
  $("sLoopStart").addEventListener("change",updLoop);
  $("sLoopEnd").addEventListener("change",updLoop);

  document.addEventListener("change",e=>{
    const s=state.selSample; if(!s)return;
    const er=e.target.getAttribute("data-er"), eo=e.target.getAttribute("data-eo");
    if(er!==null)s.envRates[+er]=clamp(parseInt(e.target.value)||0,0,255);
    if(eo!==null)s.envOffsets[+eo]=clamp(parseInt(e.target.value)||0,0,255);
    if(er!==null||eo!==null) scheduleSave();
  });
  document.addEventListener("change",e=>{
    const s=state.selSample; if(!s)return;
    const mb=e.target.getAttribute("data-mb");
    if(mb!==null){
      const bit=+mb;
      if(e.target.checked)s.modes|=bit; else s.modes&=~bit;
      renderSampleEditor(); scheduleSave();
    }
  });

  $("toolSelect").addEventListener("click",()=>{state.tool="select";$("toolSelect").classList.add("active");$("toolPencil").classList.remove("active");});
  $("toolPencil").addEventListener("click",()=>{state.tool="pencil";$("toolPencil").classList.add("active");$("toolSelect").classList.remove("active");});
  $("btnZoomIn").addEventListener("click",()=>zoomCanvas(1.25));
  $("btnZoomOut").addEventListener("click",()=>zoomCanvas(1/1.25));
  $("btnZoomReset").addEventListener("click",()=>{
    state.zoom=1; state.offset=0;
    const s=state.selSample; if(s) clampView(ensureFloat(s).length);
    drawWave(); updateZoomUI();
  });

  $("btnSelectAll").addEventListener("click",()=>{
    const s=state.selSample; if(!s)return;
    state.selStart=0; state.selEnd=ensureFloat(s).length; drawWave();
  });
  const editBtn=(id,kind,param)=>{
    $(id).addEventListener("click",()=>{
      if(kind==="amplify"){
        const g=parseFloat(prompt(t("amplify_factor_prompt"),"1.5"));
        if(isFinite(g))applyEdit("amplify",g);
      } else applyEdit(kind,param);
    });
  };
  editBtn("btnNormalize","normalize");
  editBtn("btnFadeIn","fadeIn");
  editBtn("btnFadeOut","fadeOut");
  editBtn("btnSilence","silence");
  editBtn("btnReverse","reverse");
  editBtn("btnAmplify","amplify");
  editBtn("btnDc","dc");
  $("btnUndo").addEventListener("click",undo);

  $("btnLoopSel").addEventListener("click",()=>{
    const s=state.selSample; if(!s)return;
    const a=Math.min(state.selStart,state.selEnd), b=Math.max(state.selStart,state.selEnd);
    if(b<=a){showStatus(t("select_range_first"),"bad");return;}
    const bps=fmt(s).bps;
    s.loopStart=Math.round(a*bps); s.loopEnd=Math.round(b*bps);
    s.modes|=MLOOP;
    renderSampleEditor(); render();
    showStatus(t("loop_set_selection"),"ok");
  });
  $("btnLoopAll").addEventListener("click",()=>{
    const s=state.selSample; if(!s)return;
    const n=ensureFloat(s).length, bps=fmt(s).bps;
    s.loopStart=0; s.loopEnd=n*bps; s.modes|=MLOOP;
    renderSampleEditor(); render();
    showStatus(t("loop_set_all"),"ok");
  });

  $("btnPlay").addEventListener("click",()=>{
    const s=state.selSample; if(!s)return;
    ensureAudio(); playSample(s,60,100,false);
  });
  const hold=$("btnHold");
  const startHold=(e)=>{e.preventDefault();const s=state.selSample;if(!s)return;ensureAudio();playSample(s,60,100,true);};
  const endHold=(e)=>{e.preventDefault();if(state.audio.hold)releaseVoice(state.audio.hold,false);};
  hold.addEventListener("mousedown",startHold);
  hold.addEventListener("mouseup",endHold);
  hold.addEventListener("mouseleave",endHold);
  hold.addEventListener("touchstart",startHold,{passive:false});
  hold.addEventListener("touchend",endHold,{passive:false});
  $("btnStop").addEventListener("click",()=>{stopAllVoices();showStatus(t("status_stopped"));});

  $("btnExportWav").addEventListener("click",exportWav);
  $("btnImportWav").addEventListener("click",()=>{$("wavFile").value="";$("wavFile").click();});
  $("wavFile").addEventListener("change",importWav);

  $("btnDeleteSample").addEventListener("click",()=>{
    const s=state.selSample; if(!s)return;
    openConfirmationDialog(t("delete_sample_title"),t("delete_sample_confirm"),t("delete"),()=>{
      for(const inst of state.patch.instruments){
        for(const layer of inst.layers){
          const idx=layer.samples.indexOf(s);
          if(idx>=0){
            layer.samples.splice(idx,1);
            if(inst.layers.every(l=>l.samples.length===0)){
              const iIdx=state.patch.instruments.indexOf(inst);
              if(iIdx>=0)state.patch.instruments.splice(iIdx,1);
            }
            state.selSample=null; state.selStart=state.selEnd=0;
            state.selInst=clamp(state.selInst,0,Math.max(0,state.patch.instruments.length-1));
            render(); showStatus(t("sample_deleted"),"ok");
            return;
          }
        }
      }
    });
  });

  window.addEventListener("keydown",e=>{
    if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA")return;
    if(state.keyNote.has(e.key.toLowerCase()))return;
    const s=state.selSample; if(!s)return;
    const map={a:57,w:58,s:59,e:60,d:61,f:62,t:63,g:64,y:65,h:66,u:67,j:68,k:69};
    const note=map[e.key.toLowerCase()];
    if(note!==undefined){
      ensureAudio();
      const v=playSample(s,note,100,true);
      state.keyNote.set(e.key.toLowerCase(),v);
      e.preventDefault();
    }
  });
  window.addEventListener("keyup",e=>{
    const v=state.keyNote.get(e.key.toLowerCase());
    if(v){releaseVoice(v,false);state.keyNote.delete(e.key.toLowerCase());}
  });

  // === Bank Manager ===
  $("btnExportAllBanks").addEventListener("click", () => exportBanks("all"));
  $("btnExportSelectedBanks").addEventListener("click", () => exportBanks("selected"));
  $("btnCompactBanks").addEventListener("click", compactBanks);
  $("btnRefreshBankOrder").addEventListener("click", refreshBankOrder);
  
  $("bankSelectAll").addEventListener("change", e => {
    const checked = e.target.checked;
    const currentPatch = state.patches.find(p => p.id === state.currentPatchId);
    if (currentPatch) {
      const isDrum = (currentPatch.gmBank ?? 0) === 128;
      const prog = currentPatch.gmProgram ?? -1;
      const visibleEntries = getProjectPatchEntries().filter(p => {
        const pIsDrum = (p.gmBank ?? 0) === 128;
        return pIsDrum === isDrum && (p.gmProgram ?? -1) === prog;
      });
      for (const p of visibleEntries) {
        p.exportSelected = checked;
        scheduleBankConfigSave(p); // ← Gunakan fungsi debounce
      }
    }
    renderBankManager();
  });

  // === Export dialog ===
  $("btnCancelExportBanks").addEventListener("click", closeExportBanksDialog);
  $("btnConfirmExportBanks").addEventListener("click", async () => {
    const mode = document.querySelector('input[name="exportBanksMode"]:checked')?.value || "selected";
    const project = state.projects.find(p => p.id === state.currentProjectId);
    if (!project) { closeExportBanksDialog(); return; }
    let patches = getProjectPatchEntries();
    if (mode === "selected") patches = patches.filter(p => p.exportSelected !== false);
    if (patches.length === 0) {
      $("exportBanksError").textContent = t("export_nothing_selected");
      return;
    }
    closeExportBanksDialog();
    await exportProjectWithConfig(project, patches, mode);
  });
  $("exportBanksDialog").addEventListener("click", e => {
    if (e.target === $("exportBanksDialog")) closeExportBanksDialog();
  });
  $("exportBanksDialog").addEventListener("keydown", e => {
    if (e.key === "Escape") closeExportBanksDialog();
  });

  $("btnCloseBankBreakdown").addEventListener("click", closeBankBreakdownDialog);
  $("bankBreakdownDialog").addEventListener("click", e => {
    if (e.target === $("bankBreakdownDialog")) closeBankBreakdownDialog();
  });

  $("btnLibraryScope").addEventListener("click", () => {
    if (!state.currentProjectId) return;
    state.libraryView = state.libraryView === "all" ? "project" : "all";
    state.libraryBankFilter = "all"; // Reset filter saat ganti view
    renderLibrary();
  });

  // TAMBAHKAN EVENT LISTENER INI
  $("libraryBankFilter").addEventListener("change", (e) => {
    state.libraryBankFilter = e.target.value;
    renderLibrary();
  });

  bindCanvas();
}

/* ---------- Init ---------- */
(async function init(){
  try {
    await initLocalization();
  } catch (err) {
    console.error("Localization load error:", err);
    $("statusBar").textContent = locale === "en"
      ? `Failed to load language resources: ${err.message}`
      : `Gagal memuat berkas bahasa: ${err.message}`;
    return;
  }
  bind();
  showStatus(t("library_loading"));
  try{
    const [entries, projects] = await Promise.all([
      dbGetAll(STORE),
      dbGetAll(STORE_PROJECTS)
    ]);
    
    for(const entry of entries){
      if(!entry.patch||!entry.patch.instruments) entry.patch={header:{magic:MAGIC,gravisId:GRAVIS_ID,description:entry.name||"",voices:14,channels:0,waveForms:0,masterVolume:127,dataSize:0,reserved:new Uint8Array(36)},instruments:[]};
      if(!entry.id) entry.id=uid("patch");
    }

    for (const entry of entries) {
      if (typeof entry.originalOrder !== "number") {
        entry.originalOrder = (entry.gmBank ?? 0) === 128 ? (entry.drumSet ?? 0) : (entry.gmBank ?? 0);
      }
      if (typeof entry.targetBank !== "number") entry.targetBank = entry.originalOrder;
      if (typeof entry.exportSelected !== "boolean") entry.exportSelected = true;
      // userOrder dibiarkan kosong → akan diisi oleh initBankFields per proyek
    }


    state.patches=entries;
    
    let projectMigrationFailed = false;
    const projectsNeedingSave = [];
    for(const proj of projects){
      if(!Array.isArray(proj.patchIds)) proj.patchIds = [];
      if(proj.locale || proj.name === "{{recovered_library_project}}") {
        proj.locale = true;
        proj.name = t("recovered_library_project");
        projectsNeedingSave.push(proj);
      }
    }
    state.projects = projects;

    if(projectsNeedingSave.length > 0) {
      try {
        await dbPutMany(STORE_PROJECTS, projectsNeedingSave);
      } catch(err) {
        console.error("Unable to repair recovered project name:", err);
        projectMigrationFailed = true;
      }
    }
    const assignedPatchIds = new Set(projects.flatMap(project => project.patchIds));
    const unassignedEntries = entries.filter(entry => !assignedPatchIds.has(entry.id));
    if(unassignedEntries.length > 0) {
      const recoveredProject = {
        id: uid("proj"),
        name: t("recovered_library_project"),
        locale: true,
        patchIds: unassignedEntries.map(entry => entry.id)
      };
      try {
        await dbSaveProjectAndPatches(recoveredProject, unassignedEntries);
        state.projects.push(recoveredProject);
      } catch(err) {
        console.error("Unable to assign existing patches to a project:", err);
        projectMigrationFailed = true;
      }
    }

    // Inisialisasi field bank untuk semua proyek
    for (const proj of state.projects) {
      const projEntries = (proj.patchIds || [])
        .map(id => state.patches.find(p => p.id === id))
        .filter(Boolean);
      initBankFields(projEntries, proj);
    }

    if(entries.length>0){
      selectPatch(entries[0].id);
    } else {
      render();
    }
    renderProjects();
    showStatus(projectMigrationFailed ? t("library_project_migration_failed") : t("library_loaded", {
      patches: t(entries.length === 1 ? "patch_count_one" : "patch_count_many", {count: entries.length}),
      projects: t(state.projects.length === 1 ? "project_count_one" : "project_count_many", {count: state.projects.length})
    }), projectMigrationFailed ? "bad" : "ok");
  }catch(err){
    console.error("Load DB error:",err);
    showStatus(t("library_load_failed"),"bad");
  }
})();