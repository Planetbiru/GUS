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
  midiData: null,
  midiFileName: null,
  saveTimer: null,
  db: null
};

let timidityPlayer = null;
let isMidiRendering = false;
let pendingProjectDeletionId = null;
let pendingConfirmationAction = null;
let activeAlert = null;
const queuedAlerts = [];
let projectPatchGenerator = null;

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
    drumSet: entry.drumSet ?? (entry.gmBank === 128 ? 0 : undefined),   // ← TAMBAHKAN
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
      patch
    });
  }
}
  return entries;
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

function writeTimidityPatch(patch) {
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

/* ---------- Timidity Integration ---------- */
/* ---------- Timidity Integration ---------- */
function generateProjectTimidityCfg(project) {
  const patches = getProjectPatches(project);
  const melodic = patches.filter(p => (p.gmBank ?? 0) !== 128 && (p.gmProgram ?? -1) !== -1);
  const drums   = patches.filter(p => (p.gmBank ?? 0) === 128 && (p.gmProgram ?? -1) !== -1);

  let cfg = "# Generated by GUS Patch Editor\n";
  cfg += "dir /gus-patch\n\n";

  // Melodic
  const melodicByBank = {};
  for (const p of melodic) {
    const b = p.gmBank ?? 0;
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

  // Drums — group per drumSet
  if (drums.length > 0) {
    const drumGroups = {};
    for (const p of drums) {
      const kitId = p.drumSet ?? 0;
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

  // Fallback (tidak berubah)
  if (melodic.length === 0 && drums.length === 0 && patches.length > 0) {
    cfg += "bank 0\n";
    patches.slice(0, 128).forEach((p, i) => {
      cfg += `${i} ${sanitizeFilename(p.name)}.pat\n`;
    });
  }

  return cfg;
}

function generateProjectTimidityCfgForZip(project, patchPaths, drumSetMap, bankMap) {
  const patches = getProjectPatches(project);
  const melodic = patches.filter(p => (p.gmBank ?? 0) !== 128 && (p.gmProgram ?? -1) !== -1);
  const drums   = patches.filter(p => (p.gmBank ?? 0) === 128 && (p.gmProgram ?? -1) !== -1);

  let cfg = "# Generated by GUS Patch Editor\n";
  cfg += "dir .\n\n";

  const pathFor = (p) => {
    const pp = patchPaths.get(p.id);
    if (pp) return pp.folderPath + pp.filename;
    return sanitizeFilename(p.name) + ".pat";
  };

  // Melodic (folder: {seqBank}/tone/)
  const melodicByBank = {};
  for (const p of melodic) {
    const b = p.gmBank ?? 0;
    if (!melodicByBank[b]) melodicByBank[b] = [];
    melodicByBank[b].push(p);
  }
  for (const origBank of Object.keys(melodicByBank).map(Number).sort((a,b)=>a-b)) {
    const seqBank = bankMap ? (bankMap.get(origBank) ?? origBank) : origBank;
    cfg += `bank ${seqBank}\n`;
    for (const p of melodicByBank[origBank]) {
      cfg += `${p.gmProgram} ${pathFor(p)}\n`;
    }
    cfg += "\n";
  }

  // Drums (folder: {seqDrumSet}/drum/)
  if (drums.length > 0) {
    const drumGroups = {};
    for (const p of drums) {
      const kitId = p.drumSet ?? 0;
      if (!drumGroups[kitId]) drumGroups[kitId] = [];
      drumGroups[kitId].push(p);
    }
    const kitIds = Object.keys(drumGroups).map(Number).sort((a,b)=>a-b);
    for (const origKit of kitIds) {
      const seqKit = drumSetMap ? (drumSetMap.get(origKit) ?? origKit) : origKit;
      cfg += `drumset ${seqKit}\n`;
      for (const p of drumGroups[origKit].sort((a,b)=>a.gmProgram - b.gmProgram)) {
        cfg += `${p.gmProgram} ${pathFor(p)}\n`;
      }
      cfg += "\n";
    }
  }

  return cfg;
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

  // 2) Match by bank/program
  if (!target) {
    target = patches.find(p =>
      isDrum
        ? (p.gmBank === 128 && p.gmProgram === program)
        : ((p.gmBank ?? 0) === bank && (p.gmProgram ?? -1) === program)
    );
  }

  // 3) Fallback
  if (!target) target = patches.find(p =>
    isDrum ? p.gmBank === 128 : (p.gmProgram ?? -1) !== -1
  ) || patches[0];

  try {
    const bytes = writeTimidityPatch(target.patch);
    return bytes.buffer;   // ← ArrayBuffer, bukan Uint8Array
  } catch (e) {
    console.error("[TiMidity] writeTimidityPatch failed:", e);
    return null;
  }
}

function invalidateTimidityPlayer() {
  if (timidityPlayer) {
    try { timidityPlayer.shutdown(); } catch(e) {}
    timidityPlayer = null;
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
  raf: null
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
  const cur = midiProgress.current;
  const dur = midiProgress.duration;
  
  $("midiTimeCur").textContent = formatTime(cur);
  $("midiTimeTotal").textContent = formatTime(dur);
  
  if (!midiProgress.playing && !midiProgress.paused) {
    $("midiSeek").value = 0;
  } else {
    $("midiSeek").value = Math.floor((cur / dur) * 1000);
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
  const project = state.projects.find(p => p.id === projectId);
  if (!project) return;
  const patches = getProjectPatches(project);
  if (patches.length === 0) {
    showStatus(t("empty_project"), "bad");
    return;
  }

  try {
    const zipFiles = [];
    const usedPaths = new Set();
    const patchPaths = new Map();

    // === BUAT MAPPING URUTAN (0, 1, 2, ...) ===
    const drums = patches.filter(p => (p.gmBank ?? 0) === 128);
    const melodic = patches.filter(p => (p.gmBank ?? 0) !== 128);
    
    const uniqueDrumSets = [...new Set(drums.map(p => p.drumSet ?? 0))].sort((a, b) => a - b);
    const drumSetMap = new Map(uniqueDrumSets.map((id, idx) => [id, idx]));
    
    const uniqueBanks = [...new Set(melodic.map(p => p.gmBank ?? 0))].sort((a, b) => a - b);
    const bankMap = new Map(uniqueBanks.map((id, idx) => [id, idx]));
    // ==========================================

    for (const entry of patches) {
      const clean = cleanPatchForStorage(entry.patch);
      const bytes = writePAT(clean);

      const isDrum = (entry.gmBank ?? 0) === 128;
      
      // Gunakan ID berurutan dari mapping
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

    // Kirim mapping ke fungsi timidity.cfg
    zipFiles.push({
      name: "timidity.cfg",
      data: new TextEncoder().encode(generateProjectTimidityCfgForZip(project, patchPaths, drumSetMap, bankMap))
    });

    // ... (sisa kode createZip & download tetap sama)
    const zipBytes = createZip(zipFiles);
    const blob = new Blob([zipBytes], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/[^\w\-]+/g, "_")}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showStatus(t("project_exported", {name: project.name}), "ok");
  } catch (err) {
    console.error(err);
    showStatus(t("project_export_failed", {message: err.message}), "bad");
  }
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
    
    const isDupe = entry.gmProgram !== -1 && entry.gmProgram !== undefined && 
                   state.patches.filter(p => p.gmProgram === entry.gmProgram && p.gmBank === entry.gmBank).length > 1;
    
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

function renderProjects() {
  const list = $("projectList");
  list.innerHTML = "";
  $("projCount").textContent = state.projects.length;
  if (state.projects.length === 0) {
    list.innerHTML = `<div style="padding:6px;color:var(--dim);font-size:11px;text-align:center">${t("no_project")}</div>`;
    $("btnAddToProject").disabled = true;
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

      // Simpan state MIDI saat ini
      const wasPlaying = midiProgress.playing;
      const wasPaused = midiProgress.paused;
      const resumeTime = midiProgress.current;

      // Ganti proyek aktif
      state.currentProjectId = proj.id;
      state.libraryView = "project";
      
      // Hancurkan player lama (jika ada)
      invalidateTimidityPlayer(); 
      
      // Update UI Proyek
      renderProjects();
      renderLibrary();
      $("btnAddToProject").disabled = false;
      $("btnDeleteProject").disabled = false;
      $("btnExportProject").disabled = false;

      // Jika user sedang memutar atau pause lagu, lanjutkan secara transparan dengan instrumen baru
      if (state.midiData && (wasPlaying || wasPaused)) {
        setTimeout(() => {
          if (wasPaused) {
            // Tetap dalam keadaan pause, tapi diam-diam muat instrumen baru
            midiProgress.playing = false;
            midiProgress.paused = true;
            midiProgress.current = resumeTime;
            midiProgress.startTime = performance.now() - (resumeTime * 1000);
            updateMidiUI();
            setMidiStatus("midi_paused_at", {time: formatTime(resumeTime)});
          } else {
            // Mulai putar dari detik terakhir dengan instrumen baru
            playMidi(resumeTime);
          }
        }, 50); // Beri jeda sedikit agar UI tidak freeze
      }
    });
    list.appendChild(d);
  });
  const hasActive = !!state.currentProjectId;
  $("btnAddToProject").disabled = !hasActive;
  $("btnDeleteProject").disabled = !hasActive;
  $("btnExportProject").disabled = !hasActive;
}

function render(save=true){
  const has=!!state.patch;
  $("welcome").hidden=has; $("workspace").hidden=!has; $("btnSave").disabled=!has;
  $("btnExportInst").disabled=!has;
  renderLibrary();
  renderProjects();
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

/* ---------- Demo Patch ---------- */
function makeDemoPatch(){
  function makeSamples(rate,count,type){
    const f=new Float32Array(count), freq=440;
    for(let i=0;i<count;i++){
      const t=i/rate;
      let v=0;
      if(type==="sine")v=Math.sin(2*Math.PI*freq*t);
      else if(type==="saw")v=2*((t*freq)%1)-1;
      else if(type==="square")v=(t*freq)%1<0.5?1:-1;
      const env=Math.min(1,i/(rate*0.02));
      f[i]=v*env*0.6;
    }
    return f;
  }
  function makeSample(name,rate,count,type,rootFreq,loopStart,loopEnd){
    const floats=makeSamples(rate,count,type);
    const pcm=new Uint8Array(count);
    for(let i=0;i<count;i++){const v=clamp(floats[i],-1,1); pcm[i]=Math.round(v*127)+128;}
    return {
      name, fractions:0, dataSize:count, loopStart, loopEnd, sampleRate:rate,
      lowFreq:0, highFreq:rate/2, rootFreq, tune:0, balance:7,
      envRates:[0,0,0,0,0,0], envOffsets:[255,255,255,0,0,0],
      tremoloSweep:0, tremoloRate:0, tremoloDepth:0,
      vibratoSweep:0, vibratoRate:0, vibratoDepth:0,
      modes:MUNS|MLOOP, scaleFreq:60, scaleFactor:1024,
      reserved:new Uint8Array(36), pcm, _float:null
    };
  }
  const rate=22050;
  const s1=makeSample("SINE",rate,rate,"sine",440,220,22000);
  const s2=makeSample("SAW",rate,rate,"saw",440,220,22000);
  const s3=makeSample("SQR",rate,rate/2,"square",440,220,11000);
  return {
    header:{magic:MAGIC,gravisId:GRAVIS_ID,description:"Demo GUS Patch",voices:14,channels:0,waveForms:3,masterVolume:120,dataSize:0,reserved:new Uint8Array(36)},
    instruments:[
      {instrument:0,name:"Sine Lead",size:0,reserved:new Uint8Array(40),layers:[{duplicate:0,layer:0,layerSize:0,reserved:new Uint8Array(40),samples:[s1]}]},
      {instrument:1,name:"Saw Bass",size:0,reserved:new Uint8Array(40),layers:[{duplicate:0,layer:0,layerSize:0,reserved:new Uint8Array(40),samples:[s2]}]},
      {instrument:2,name:"Square Pad",size:0,reserved:new Uint8Array(40),layers:[{duplicate:0,layer:0,layerSize:0,reserved:new Uint8Array(40),samples:[s3]}]}
    ]
  };
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
  $("projectPatchFile").addEventListener("change", handleProjectPatchFile);

  const loadDemo=async()=>{
    if(!state.projects.some(project => project.id === state.currentProjectId)) {
      requestProjectForImport();
      return;
    }
    const patch=makeDemoPatch();
    const entry={ id:uid("demo"), name:"Demo Patch", source:"demo", gmProgram:0, gmBank:0, patch };
    try {
      if(await addPatchEntries([entry])) showStatus(t("demo_loaded"),"ok");
    } catch(err) {
      console.error("Demo patch error:", err);
      showStatus(t("patch_add_failed", {message: err.message}), "bad");
    }
  };
  $("btnDemo").addEventListener("click",loadDemo);
  const b2=$("btnDemo2"); if(b2)b2.addEventListener("click",loadDemo);

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

$("midiSeek").addEventListener("change", (e) => {
    if (!state.midiData) return;
    const pct = parseInt(e.target.value) / 1000;
    const targetTime = pct * midiProgress.duration;
    
    // Tambahkan if (timidityPlayer)
    if (timidityPlayer) timidityPlayer.stop(); 
    
    midiProgress.current = targetTime;
    midiProgress.startTime = performance.now() - (targetTime * 1000);
    
    if (midiProgress.paused) {
      updateMidiUI();
      setMidiStatus("midi_paused_at", {time: formatTime(targetTime)});
    } else {
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