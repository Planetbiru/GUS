"use strict";

/* ---------- Konstanta ---------- */
const MAGIC = "GF1PATCH110", GRAVIS_ID = "ID#000002";
const M16=0x01, MUNS=0x02, MLOOP=0x04, MPING=0x08, MREV=0x10, MSUS=0x20, MENV=0x40, MCLAMP=0x80;
const MODE_LABELS=[[M16,"mode_16_bit"],[MUNS,"mode_unsigned"],[MLOOP,"mode_loop"],[MPING,"mode_ping_pong"],[MREV,"mode_reverse"],[MSUS,"mode_sustain"],[MENV,"mode_envelope"],[MCLAMP,"mode_clamped_release"]];
const $ = id => document.getElementById(id);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const midiToFreq = n => 440 * Math.pow(2, (n-69)/12);
let editingProjectPropertiesId = null;


/* ---------- GM Instrument Name Lists ---------- */
const GM_MELODIC_NAMES = [
  "Acoustic Grand Piano", "Bright Acoustic Piano", "Electric Grand Piano", "Honky-tonk Piano",
  "Electric Piano 1", "Electric Piano 2", "Harpsichord", "Clavinet",
  "Celesta", "Glockenspiel", "Music Box", "Vibraphone",
  "Marimba", "Xylophone", "Tubular Bells", "Dulcimer",
  "Drawbar Organ", "Percussive Organ", "Rock Organ", "Church Organ",
  "Reed Organ", "Accordion", "Harmonica", "Tango Accordion",
  "Acoustic Guitar (nylon)", "Acoustic Guitar (steel)", "Electric Guitar (jazz)", "Electric Guitar (clean)",
  "Electric Guitar (muted)", "Overdriven Guitar", "Distortion Guitar", "Guitar Harmonics",
  "Acoustic Bass", "Electric Bass (finger)", "Electric Bass (pick)", "Fretless Bass",
  "Slap Bass 1", "Slap Bass 2", "Synth Bass 1", "Synth Bass 2",
  "Violin", "Viola", "Cello", "Contrabass",
  "Tremolo Strings", "Pizzicato Strings", "Orchestral Harp", "Timpani",
  "String Ensemble 1", "String Ensemble 2", "Synth Strings 1", "Synth Strings 2",
  "Choir Aahs", "Voice Oohs", "Synth Voice", "Orchestra Hit",
  "Trumpet", "Trombone", "Tuba", "Muted Trumpet",
  "French Horn", "Brass Section", "Synth Brass 1", "Synth Brass 2",
  "Soprano Sax", "Alto Sax", "Tenor Sax", "Baritone Sax",
  "Oboe", "English Horn", "Bassoon", "Clarinet",
  "Piccolo", "Flute", "Recorder", "Pan Flute",
  "Blown Bottle", "Shakuhachi", "Whistle", "Ocarina",
  "Lead 1 (square)", "Lead 2 (sawtooth)", "Lead 3 (calliope)", "Lead 4 (chiff)",
  "Lead 5 (charang)", "Lead 6 (voice)", "Lead 7 (fifths)", "Lead 8 (bass + lead)",
  "Pad 1 (new age)", "Pad 2 (warm)", "Pad 3 (polysynth)", "Pad 4 (choir)",
  "Pad 5 (bowed)", "Pad 6 (metallic)", "Pad 7 (halo)", "Pad 8 (sweep)",
  "FX 1 (rain)", "FX 2 (soundtrack)", "FX 3 (crystal)", "FX 4 (atmosphere)",
  "FX 5 (brightness)", "FX 6 (goblins)", "FX 7 (echoes)", "FX 8 (sci-fi)",
  "Sitar", "Banjo", "Shamisen", "Koto",
  "Kalimba", "Bag pipe", "Fiddle", "Shanai",
  "Tinkle Bell", "Agogo", "Steel Drums", "Woodblock",
  "Taiko Drum", "Melodic Tom", "Synth Drum", "Reverse Cymbal",
  "Guitar Fret Noise", "Breath Noise", "Seashore", "Bird Tweet",
  "Telephone Ring", "Helicopter", "Applause", "Gunshot"
];

const GM_DRUM_NAMES = {
  35: "Acoustic Bass Drum", 36: "Bass Drum 1", 37: "Side Stick", 38: "Acoustic Snare",
  39: "Hand Clap", 40: "Electric Snare", 41: "Low Floor Tom", 42: "Closed Hi Hat",
  43: "High Floor Tom", 44: "Pedal Hi Hat", 45: "Low Tom", 46: "Open Hi Hat",
  47: "Low-Mid Tom", 48: "Hi-Mid Tom", 49: "Crash Cymbal 1", 50: "High Tom",
  51: "Ride Cymbal 1", 52: "Chinese Cymbal", 53: "Ride Bell", 54: "Tambourine",
  55: "Splash Cymbal", 56: "Cowbell", 57: "Crash Cymbal 2", 58: "Vibraslap",
  59: "Ride Cymbal 2", 60: "Hi Bongo", 61: "Low Bongo", 62: "Mute Hi Conga",
  63: "Open Hi Conga", 64: "Low Conga", 65: "High Timbale", 66: "Low Timbale",
  67: "High Agogo", 68: "Low Agogo", 69: "Cabasa", 70: "Maracas",
  71: "Short Whistle", 72: "Long Whistle", 73: "Short Guiro", 74: "Long Guiro",
  75: "Claves", 76: "Hi Wood Block", 77: "Low Wood Block", 78: "Mute Cuica",
  79: "Open Cuica", 80: "Mute Triangle", 81: "Open Triangle"
};

const IMPORT_NAME_MAX_LEN = 16;

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
let currentBankStatusTranslation = null;
let currentBankStatusElement = null;
let currentBank = null;

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
  document.querySelectorAll("[data-bank-patch-count]").forEach(element => {
    const count = Number(element.dataset.bankPatchCount);
    element.textContent = t(count === 1 ? "patch_count_one" : "patch_count_many", {count});
  });
  document.querySelectorAll("[data-bank-broken-count]").forEach(element => {
    element.textContent = t("broken_patch_count", {count: Number(element.dataset.bankBrokenCount)});
  });
  if ($("newProjectDialog") && !$("newProjectDialog").hidden && $("newProjectName").value === defaultProjectName) {
    $("newProjectName").value = t("create_project_default", {number: state.projects.length + 1});
  }
  if ($("demoProjectDialog") && !$("demoProjectDialog").hidden && $("demoProjectName").value === defaultDemoProjectName) {
    $("demoProjectName").value = t("demo_project_name");
  }
  render(false);
  $("btnMidi").textContent = t(state.midi.enabled ? "disable" : "enable");
  $("btnPlayMidi").innerHTML = `<svg class="icon"><use href="#i-play"></use></svg> ${t("play")}`;
  if (currentStatusTranslation) {
    showStatus(t(currentStatusTranslation.key, currentStatusTranslation.values), currentStatusTranslation.kind);
  }
  if (currentMidiStatusTranslation) {
    $("midiStatus").textContent = t(currentMidiStatusTranslation.key, currentMidiStatusTranslation.values);
  }
  if (currentBankStatusTranslation && currentBankStatusElement?.isConnected) {
    currentBankStatusElement.textContent = t(currentBankStatusTranslation.key, currentBankStatusTranslation.values);
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
  libraryTypeFilter: "all",
  libraryNameFilter: "",
  midiData: null,
  midiFileName: null,
  midiUsedPatches: new Map(),
  saveTimer: null,
  db: null
};

let timidityPlayer = null;
let timelinePlayheadEl = null; // Hanya satu playhead
let timelineTotalTicks = 0;     // Total tick dari lagu yang sedang ditampilkan
let isMidiRendering = false;
let isDemoGenerating = false;

// ─── Mute / Solo per MIDI channel ─────────────────────────────────────
const midiChannelMute = new Array(16).fill(false);
const midiChannelSolo = new Array(16).fill(false);
const midiChannelMuteBtnRefs = new Array(16).fill(null);
const midiChannelSoloBtnRefs = new Array(16).fill(null);
let muteReapplyTimer = null;
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
function setBankStatus(statusEl, key, values = {}) {
  currentBankStatusElement = statusEl;
  currentBankStatusTranslation = {key, values};
  statusEl.textContent = t(key, values);
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

function capSampleRateTo65535(sample) {
  if (!sample.sampleRate || sample.sampleRate <= 65535) return sample;
  const is16 = (sample.modes & M16) !== 0;
  const targetRate = sample.sampleRate > 48000 ? 44100 : 48000;
  const resampled = resamplePcmTo(sample.pcm, sample.sampleRate, targetRate, is16);
  if (!resampled) {
    // fallback: paksa rate (lebih baik daripada clamp korup)
    sample.sampleRate = targetRate;
    return sample;
  }
  const bps = is16 ? 2 : 1;
  const ratio = targetRate / sample.sampleRate;
  const wasLoop = (sample.modes & MLOOP) !== 0;
  const oldStart = sample.loopStart;
  const oldEnd = sample.loopEnd;
  sample.pcm = resampled;
  sample.dataSize = sample.pcm.length;
  sample.sampleRate = targetRate;
  sample._float = null;
  if (wasLoop) {
    const total = sample.pcm.length;
    let ns = clamp(Math.round(oldStart * ratio), 0, total);
    let ne = clamp(Math.round(oldEnd * ratio), 0, total);
    if (ne > ns && (ne - ns) >= 4 * bps) {
      sample.loopStart = ns;
      sample.loopEnd = ne;
    } else {
      sample.modes &= ~MLOOP;
      sample.loopStart = 0;
      sample.loopEnd = 0;
    }
  }
  return sample;
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
          // Perbaikan bug biola
          // Heuristic: jika bukan rate standar, kemungkinan file lama (period ns)
          const converted = Math.round(1e9 / srRaw);
            if (stdRates.includes(converted)) {
              srRaw = converted;
            } else if (srRaw < 4000) {
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

function hzToPeriod(hz){
  hz = clamp(hz|0, 1, 65535);
  return clamp(Math.round(1e9 / hz), 1, 65535);
}
function periodToHz(p){
  p = p|0;
  return p > 0 ? Math.round(1e9 / p) : 22050;
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
        
        // Perbaikan bug biola
        let outRate = s.sampleRate || 22050;
        if (outRate > 65535) {
          console.warn(`[writePAT] Sample "${s.name}" rate ${outRate} melebihi u16; clamp ke 65535.`);
          outRate = 65535;
        }
        w16(outRate);
        
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
      let v=clamp(f[i],-1,1);
      let iv = Math.round(v * 32768);
      if (iv > 32767) iv = 32767;
      if (iv < -32768) iv = -32768;
      if(unsigned) iv += 32768;
      else if(iv < 0) iv += 65536;
      b[i*2]=iv&255;
      b[i*2+1]=(iv>>8)&255;
    }
  }else{
    for(let i=0;i<n;i++){
      let v=clamp(f[i],-1,1);
      let iv = Math.round(v * 128);
      if (iv > 127) iv = 127;
      if (iv < -128) iv = -128;
      if(unsigned) iv += 128;
      else if(iv < 0) iv += 256;
      b[i]=iv&255;
    }
  }
  s.pcm=b;
  s.dataSize=b.length;
}

function computeSf2Pitch(rootFreq, scaleFreq) {
  let rootHz = (rootFreq && rootFreq > 0) ? rootFreq / 1000 : null;

  if (rootHz === null) {
    const scaleNote = (scaleFreq >= 0 && scaleFreq <= 127) ? scaleFreq : 60;
    rootHz = 440 * Math.pow(2, (scaleNote - 69) / 12);
  }

  const midiNoteFloat = 69 + 12 * Math.log2(rootHz / 440);
  let originalPitch = Math.round(midiNoteFloat);
  if (originalPitch < 0) originalPitch = 0;
  if (originalPitch > 127) originalPitch = 127;

  const freqOfOriginalPitch = 440 * Math.pow(2, (originalPitch - 69) / 12);
  let pitchCorrection = Math.round(1200 * Math.log2(rootHz / freqOfOriginalPitch));

  // Clamp defensif (tidak akan pernah kena karena originalPitch = round(midiNoteFloat))
  if (pitchCorrection < -128) pitchCorrection = -128;
  if (pitchCorrection > 127) pitchCorrection = 127;

  return { originalPitch, pitchCorrection };
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

  function convertSample(sIdx, overrideRoot, coarseSemis, fineCents, keyLow, keyHigh, loopFromZone){
    const cacheKey = `${sIdx}_${overrideRoot}_${coarseSemis}_${fineCents}_${keyLow}_${keyHigh}_${loopFromZone}`;
    let cached = sampleCache.get(cacheKey);
    
    if (!cached) {
      const sh=shdr[sIdx]; if(!sh)return null;
      const startByte = sh.dwStart * 2;
      const endByte = Math.min(sh.dwEnd * 2, smplData.length);
      if (endByte <= startByte) return null;

      const pcm = smplData.slice(startByte, endByte); 
      const start=sh.dwStart, end=endByte / 2;
      const loopStartSmp=sh.dwStartloop-start, loopEndSmp=sh.dwEndloop-start;
      const hasLoop = loopFromZone === true
        && loopEndSmp > loopStartSmp
        && loopStartSmp >= 0;

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

      let modes = M16;
      let envRates   = [0, 0, 0, 0, 0, 0];
      let envOffsets = [255, 255, 255, 0, 0, 0];

      if (hasLoop) {
        modes |= MLOOP;

        // FIX: tanpa MENV, TiMidity mengabaikan envRates/envOffsets dan memutar
        // sampel loop selamanya setelah note-off → "reverb panjang".
        modes |= MENV;

        // Envelope default ringan: attack ~10ms, sustain 100%, release ~148ms.
        // Nilai rate mengikuti kurva gusEnvMs().
        envRates   = [9, 0, 0, 69, 0, 0];
        envOffsets = [255, 255, 255, 0, 0, 0];
      }

      const safeName=(sh.name||"SMP").replace(/[^\x20-\x7E]/g,"").trim().substring(0,7)||"SMP";

      cached = {
        name:safeName, fractions:0, dataSize:pcm.length,
        loopStart:hasLoop?loopStartSmp*2:0, loopEnd:hasLoop?loopEndSmp*2:0,
        sampleRate:clamp(sh.dwSampleRate||22050,1,192000),
        lowFreq, highFreq,
        rootFreq, tune:0, balance:7,
        envRates,
        envOffsets,
        tremoloSweep:0,tremoloRate:0,tremoloDepth:0,
        vibratoSweep:0,vibratoRate:0,vibratoDepth:0,
        modes, scaleFreq: rootNote, scaleFactor:1024,
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

        // Baca generator sampleModes (op 54) — sumber kebenaran loop
        const sampleModesGen = findGen(igens, 54);
        const loopFromZone = sampleModesGen ? (sampleModesGen.amt & 0x03) !== 0 : false;

        const rootKeyGen=findGen(igens,58);
        const coarseGen=findGen(igens,51);
        const fineGen=findGen(igens,52);
        const coarseSemis=coarseGen?s16(coarseGen.amt):0;
        const fineCents=fineGen?s16(fineGen.amt):0;

        const gusSample=convertSample(
          sampGen.amt,
          rootKeyGen?rootKeyGen.amt:undefined,
          coarseSemis, fineCents,
          keyLow, keyHigh,
          loopFromZone                       // <-- parameter ke-7 (BARU)
        );
        if(!gusSample) continue;

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

      const sampleModesGen = findGen(igens, 54);
      const loopFromZone = sampleModesGen ? (sampleModesGen.amt & 0x03) !== 0 : false;

      const [instKeyLow, instKeyHigh] = getKeyRange(igens);
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
        keyLo, keyHi,
        loopFromZone                       // <-- parameter ke-7 (BARU)
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
      gmProgram: note,
      gmBank: 128,
      drumSet: preset.preset,  
      originalOrder: preset.preset,
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
      originalOrder: preset.bank,
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

function generateProjectTimidityCfgForZip(project, patchPaths, patches, drumSetMap = null, bankMap = null) {
  // Hapus baris: const patches = getProjectPatches(project);
  
  const melodic = patches.filter(p => (p.gmBank ?? 0) !== 128 && (p.gmProgram ?? -1) !== -1);
  const drums   = patches.filter(p => (p.gmBank ?? 0) === 128 && (p.gmProgram ?? -1) !== -1);

  let cfg = "# Generated by Planetbiru Instrument Editor for Player\n# Visit: https://composer.planetbiru.com/instrument-editor/\n\n";
  cfg += "dir .\n\n";

  const pathFor = (p) => {
    const pp = patchPaths.get(p.id);
    if (pp) return pp.folderPath + pp.filename;
    return sanitizeFilename(p.name) + ".pat";
  };

  // Melodic
  const melodicByBank = {};
  for (const p of melodic) {
    const originalBank = (!bankMap && p.targetBank !== undefined) ? p.targetBank : (p.gmBank ?? 0);
    if (!melodicByBank[originalBank]) melodicByBank[originalBank] = [];
    melodicByBank[originalBank].push(p);
  }

  for (const origBank of Object.keys(melodicByBank).map(Number).sort((a,b)=>a-b)) {
    const seqBank = bankMap ? (bankMap.get(origBank) ?? origBank) : origBank;
    cfg += `bank ${seqBank}\n`;
    for (const p of melodicByBank[origBank]) {
      cfg += `${p.gmProgram} ${pathFor(p)}\n`;
    }
    cfg += "\n";
  }

  // Drums
  if (drums.length > 0) {
    const drumGroups = {};
    for (const p of drums) {
      const originalKit = (!drumSetMap && p.targetBank !== undefined) ? p.targetBank : (p.drumSet ?? 0);
      if (!drumGroups[originalKit]) drumGroups[originalKit] = [];
      drumGroups[originalKit].push(p);
    }

    for (const origKit of Object.keys(drumGroups).map(Number).sort((a,b)=>a-b)) {
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

function renderBankManager() {
  const card = $("bankManagerCard");
  if (!card) return;

  const project = state.projects.find(p => p.id === state.currentProjectId);
  const currentPatch = state.patches.find(p => p.id === state.currentPatchId);

  if (!project || !currentPatch) {
    card.hidden = true;
    return;
  }

  const isDrum = (currentPatch.gmBank ?? 0) === 128;
  const prog = currentPatch.gmProgram ?? -1;

  const entries = getProjectPatchEntries().filter(p => {
    const pIsDrum = (p.gmBank ?? 0) === 128;
    return pIsDrum === isDrum && (p.gmProgram ?? -1) === prog;
  });

  if (entries.length === 0) {
    card.hidden = true;
    return;
  }
  card.hidden = false;

  const selectedCount = entries.filter(p => p.exportSelected !== false).length;
  const summaryPill = $("bankSummaryPill");
  if (summaryPill) {
    summaryPill.textContent = t("bank_filtered_summary", {
      count: entries.length,
      selected: selectedCount
    });
  }
  const selectAll = $("bankSelectAll");
  if (selectAll) selectAll.checked = selectedCount === entries.length;

  const typeLabel = isDrum ? t("drum") : t("non_drum");
  const titleEl = card.querySelector("h2");
  let titleText = t("bank_management");
  if (currentPatch) {
    titleText += " - " + t("bank_filter_active", { program: prog, type: typeLabel });
  }
  if (titleEl) titleEl.textContent = titleText;

  const list = $("bankList");
  if (!list) return;

  // ← Bersihkan state drag SEBELUM render ulang (defensif)
  bankDragSource = null;
  list.querySelectorAll(".bank-row.dragging, .bank-row.drag-over").forEach(r => {
    r.classList.remove("dragging", "drag-over");
  });
  list.innerHTML = "";

  // Sort flat: Bank pertama, lalu userOrder. Tidak ada grup/header per bank.
  const sortedEntries = [...entries].sort((a, b) => {
    const bankA = a.targetBank ?? 0;
    const bankB = b.targetBank ?? 0;
    if (bankA !== bankB) return bankA - bankB;
    return (a.userOrder ?? 0) - (b.userOrder ?? 0);
  });

  // Satu header baris untuk label kolom (bukan per bank)
  const headerRow = document.createElement("div");
  headerRow.className = "bank-col-header";
  headerRow.innerHTML = `
    <span></span>
    <span></span>
    <span>${t("bank_label") || "Bank"}</span>
    <span>${t("type_label_short") || "T"}</span>
    <span>${t("program_label_short") || "Prog"}</span>
    <span class="bank-col-header-left">${t("name_label") || "Name"}</span>
    <span>${t("original_label_short") || "Orig"}</span>
    <span>${t("order_label_short") || "Order"}</span>
    <span></span>
  `;
  list.appendChild(headerRow);

  const selectPatchLabel = typeof translations["select_patch"] === "string"
    ? t("select_patch")
    : "Pilih patch";
  const typeKey = isDrum ? "drum" : "melodic";

  for (const p of sortedEntries) {
    const bankId = p.targetBank ?? 0;
    const isCurrent = p.id === state.currentPatchId;

    const row = document.createElement("div");
    row.className = "bank-row"
      + (p.exportSelected === false ? " disabled" : "")
      + (isCurrent ? " bank-row-current" : "");
    row.draggable = true;
    row.dataset.id = p.id;
    row.dataset.bank = String(bankId);

    if (isCurrent) {
      row.style.background = "rgba(56, 189, 248, 0.08)";
      row.style.borderLeft = "2px solid var(--accent, #38bdf8)";
    }

    const targetChanged = bankId !== (p.originalOrder ?? 0);

    // Kolom Bank sekarang berupa input langsung (editable) — tidak ada header grup.
    row.innerHTML = `
      <input type="checkbox" data-act="select" ${p.exportSelected !== false ? "checked" : ""} aria-label="${t("export_selected_only")}">
      <span class="bank-handle" title="${t("drag_to_reorder")}">
        <svg class="icon" style="width: 14px; height: 14px;"><use href="#i-grip"></use></svg>
      </span>
      <input type="number" class="bank-target${targetChanged ? " changed" : ""}" data-act="target"
             min="0" max="999" value="${bankId}" title="${t("target_bank")}" aria-label="${t("target_bank")}">
      <span class="bank-type ${typeKey}">${isDrum ? "D" : "M"}</span>
      <span class="bank-program">${String(p.gmProgram ?? -1).padStart(3, "0")}</span>
      <span class="bank-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}${isCurrent ? ' <span style="color:var(--accent, #38bdf8);">●</span>' : ''}</span>
      <span class="bank-original" title="${t("original_order")}">${p.originalOrder ?? 0}</span>
      <span class="bank-order" title="${t("user_order")}">${p.userOrder ?? 0}</span>
      <button class="icon-btn bank-select-btn" data-act="select-patch"
              title="${selectPatchLabel}" aria-label="${selectPatchLabel}">
        <svg class="icon"><use href="#i-play"></use></svg>
      </button>
    `;

    row.addEventListener("click", (e) => {
      if (e.target.closest("input, button, .bank-handle")) return;
      if (p.id !== state.currentPatchId) selectPatch(p.id);
    });

    row.querySelector(".bank-select-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      if (p.id !== state.currentPatchId) selectPatch(p.id);
    });

    list.appendChild(row);
  }

  bindBankManagerEvents(list);
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

  // ═══════════════════════════════════════════════════════════════
  // Kunci utama: cegah drag dimulai dari elemen interaktif.
  // Dengan draggable=false saat mousedown pada input/button, browser
  // memperlakukan interaksi tersebut sebagai klik/selection normal,
  // bukan sebagai awal drag dari row.
  // ═══════════════════════════════════════════════════════════════
  list.addEventListener("mousedown", (e) => {
    const row = e.target.closest(".bank-row");
    if (!row) return;
    const isInteractive = !!e.target.closest(
      "input, button, select, textarea, a, [contenteditable='true']"
    );
    row.draggable = !isInteractive;
  });

  list.addEventListener("dragstart", e => {
    const row = e.target.closest(".bank-row");
    if (!row) return;
    // Jika draggable dimatikan pada mousedown (karena klik di input),
    // batalkan drag sepenuhnya.
    if (!row.draggable) {
      e.preventDefault();
      return;
    }
    bankDragSource = row;
    row.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", row.dataset.id); } catch (_) {}
  });

  list.addEventListener("dragend", e => {
    const row = e.target.closest(".bank-row");
    if (row) row.classList.remove("dragging");
    // Pulihkan draggable untuk semua row agar interaksi berikutnya normal
    list.querySelectorAll(".bank-row").forEach(r => {
      r.classList.remove("drag-over");
      r.draggable = true;
    });
    bankDragSource = null;
  });

  list.addEventListener("dragover", e => {
    e.preventDefault();
    if (!bankDragSource) {
      e.dataTransfer.dropEffect = "none";
      return;
    }
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
    if (!target || !bankDragSource || target === bankDragSource) {
      list.querySelectorAll(".bank-row.drag-over").forEach(r => r.classList.remove("drag-over"));
      return;
    }
    target.classList.remove("drag-over");

    try {
      const rect = target.getBoundingClientRect();
      const dropAfter = e.clientY > rect.top + rect.height / 2;
      list.insertBefore(bankDragSource, dropAfter ? target.nextSibling : target);

      const sourcePatch = state.patches.find(p => p.id === bankDragSource.dataset.id);
      const targetBankId = parseInt(target.dataset.bank, 10) || 0;
      const sourceBankId = sourcePatch ? (sourcePatch.targetBank ?? 0) : 0;

      if (sourcePatch && targetBankId !== sourceBankId) {
        sourcePatch.targetBank = targetBankId;
        bankDragSource.dataset.bank = String(targetBankId);
        const targetInput = bankDragSource.querySelector(".bank-target");
        if (targetInput) {
          targetInput.value = targetBankId;
          targetInput.classList.toggle(
            "changed",
            targetBankId !== (sourcePatch.originalOrder ?? 0)
          );
        }
        scheduleBankConfigSave(sourcePatch);
      }

      updateUserOrderFromDom(list);
      renderBankManager();
      renderLibrary();
    } catch (err) {
      console.error("Drag/drop failed:", err);
    } finally {
      bankDragSource = null;
      list.querySelectorAll(".bank-row.dragging, .bank-row.drag-over").forEach(r => {
        r.classList.remove("dragging", "drag-over");
      });
    }
  });

  list.addEventListener("change", e => {
    const row = e.target.closest(".bank-row");
    if (!row) return;
    const patch = state.patches.find(p => p.id === row.dataset.id);
    if (!patch) return;

    if (e.target.dataset.act === "select") {
      patch.exportSelected = e.target.checked;
      row.classList.toggle("disabled", !patch.exportSelected);
      scheduleBankConfigSave(patch);
    } else if (e.target.dataset.act === "target") {
      const oldBank = patch.targetBank ?? 0;
      patch.targetBank = clamp(parseInt(e.target.value, 10) || 0, 0, 999);
      e.target.value = patch.targetBank;
      e.target.classList.toggle("changed", patch.targetBank !== (patch.originalOrder ?? 0));
      scheduleBankConfigSave(patch);

      if (oldBank !== patch.targetBank) {
        renderBankManager();
        renderLibrary();
        return;
      }
    }

    const currentPatch = state.patches.find(p => p.id === state.currentPatchId);
    if (!currentPatch) return;

    const isDrum = (currentPatch.gmBank ?? 0) === 128;
    const prog = currentPatch.gmProgram ?? -1;
    const visibleEntries = getProjectPatchEntries().filter(p => {
      const pIsDrum = (p.gmBank ?? 0) === 128;
      return pIsDrum === isDrum && (p.gmProgram ?? -1) === prog;
    });
    const selectedCount = visibleEntries.filter(p => p.exportSelected !== false).length;

    const summaryPill = $("bankSummaryPill");
    if (summaryPill) {
      summaryPill.textContent = t("bank_filtered_summary", {
        count: visibleEntries.length,
        selected: selectedCount
      });
    }
    const selectAll = $("bankSelectAll");
    if (selectAll) selectAll.checked = selectedCount === visibleEntries.length;
    const exportLabel = $("exportSelectedLabel");
    if (exportLabel) {
      exportLabel.textContent = t("export_selected_only") + ` (${selectedCount})`;
    }
  });
}

function updateUserOrderFromDom(list) {
  const groups = new Map();
  list.querySelectorAll(".bank-row").forEach(row => {
    const bankId = row.dataset.bank ?? "0";
    if (!groups.has(bankId)) groups.set(bankId, []);
    groups.get(bankId).push(row);
  });

  for (const rows of groups.values()) {
    const patches = rows.map(r => state.patches.find(p => p.id === r.dataset.id)).filter(Boolean);
    const orders = patches.map(p => p.userOrder ?? 0).sort((a, b) => a - b);

    patches.forEach((p, i) => {
      p.userOrder = orders[i];
      scheduleBankConfigSave(p);
      const orderEl = rows[i].querySelector(".bank-order");
      if (orderEl) orderEl.textContent = p.userOrder;
    });
  }
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
    scheduleBankConfigSave(p);
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
    scheduleBankConfigSave(p);
  }

  renderBankManager();
  showStatus(t("bank_compacted"), "ok");
}

function exportBanks(mode) {
  const project = state.projects.find(p => p.id === state.currentProjectId);
  if (!project) return;
  
  const entries = getProjectPatchEntries();
  if (entries.length === 0) {
    showStatus(t("empty_project"), "bad");
    return;
  }

  // Jika user klik "Ekspor Semua", centang semua patch terlebih dahulu
  if (mode === "all") {
    entries.forEach(p => p.exportSelected = true);
    renderBankManager(); // Update tampilan di belakang
  }

  openExportBanksDialog();
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

  // =====================================================================
  // PERBAIKAN DI SINI: Sesuaikan lineWidth berdasarkan zoom & cegah gap
  // =====================================================================
  let lineWidth = 1;
  if (state.zoom >= 2) lineWidth = 1.2;
  if (state.zoom >= 4) lineWidth = 1.5;
  if (state.zoom >= 8) lineWidth = 2.0;
  if (state.zoom >= 16) lineWidth = 2.5;
  if (state.zoom >= 32) lineWidth = 3.0;

  // =====================================================================
  // PERBAIKAN FINAL: lineWidth = 1 + Logika Penyambung Horizontal
  // =====================================================================
  ctx.strokeStyle = "#7dd3fc"; 
  ctx.lineWidth = 1; 
  ctx.lineJoin = "round"; // Mencegah sudut tajam yang patah
  ctx.lineCap = "round";  // Mencegah ujung garis yang patah/titik hilang
  ctx.beginPath();

  let prevX = -1;
  let prevTopY = 0;
  let prevBotY = 0;

  for(let x=0; x<w; x++){
    const s0 = Math.floor(startSmp + (x / w) * visibleCount);
    let s1 = Math.floor(startSmp + ((x + 1) / w) * visibleCount);
    
    // Pastikan minimal membaca 1 sampel
    if (s1 <= s0) s1 = s0 + 1;
    if (s0 >= n) break;

    let mn = 1, mx = -1;
    for(let i = s0; i < s1; i++){
      const v = floats[i];
      if(v < mn) mn = v;
      if(v > mx) mx = v;
    }
    if(mn > mx){ mn = 0; mx = 0; }
    
    // Konversi nilai amplitudo ke koordinat Y layar
    const yTop = mid - mx * amp;
    const yBot = mid - mn * amp;

    // 1. Gambar batang vertikal (badan gelombang di kolom ini)
    ctx.moveTo(x + 0.5, yTop); 
    ctx.lineTo(x + 0.5, yBot);

    // 2. Gambar garis penyambung ke kolom sebelumnya (agar tidak putus)
    if (prevX !== -1) {
      // Sambungkan bagian atas (puncak)
      ctx.moveTo(prevX + 0.5, prevTopY);
      ctx.lineTo(x + 0.5, yTop);
      // Sambungkan bagian bawah (lembah)
      ctx.moveTo(prevX + 0.5, prevBotY);
      ctx.lineTo(x + 0.5, yBot);
    }

    // Simpan posisi saat ini untuk iterasi kolom berikutnya
    prevX = x;
    prevTopY = yTop;
    prevBotY = yBot;
  }
  ctx.stroke();
  // =====================================================================

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

  initBankFields(entries, project);

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
  renderBankManager();
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
  state.midiUsedPatches.delete(id);
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

/* ---------- Custom Prompt (replaces window.prompt) ---------- */
let activeCustomPrompt = null;

function customPrompt(options = {}) {
  return new Promise(resolve => {
    const {
      title = "",
      message = "",
      label = "",
      defaultValue = "",
      placeholder = "",
      inputType = "text",
      inputMode = "",
      min,
      max,
      okLabel = t("ok_button"),
      cancelLabel = t("cancel"),
      validate = null
    } = options;

    // Batalkan prompt sebelumnya jika masih terbuka
    if (activeCustomPrompt) {
      const prev = activeCustomPrompt;
      activeCustomPrompt = null;
      prev.resolve(null);
    }

    const dialog = $("customPromptDialog");
    const titleEl = $("customPromptTitle");
    const messageEl = $("customPromptMessage");
    const fieldEl = $("customPromptField");
    const labelEl = $("customPromptLabel");
    const inputEl = $("customPromptInput");
    const errorEl = $("customPromptError");
    const okBtn = $("btnCustomPromptOk");
    const cancelBtn = $("btnCustomPromptCancel");

    titleEl.textContent = title || t("prompt_title");
    messageEl.textContent = message || "";
    messageEl.style.display = message ? "" : "none";

    fieldEl.style.display = "";
    labelEl.textContent = label || "";
    labelEl.style.display = label ? "" : "none";
    errorEl.textContent = "";

    inputEl.type = inputType;
    if (inputMode) inputEl.setAttribute("inputmode", inputMode);
    else inputEl.removeAttribute("inputmode");
    if (inputType === "number") {
      if (typeof min === "number") inputEl.min = String(min);
      else inputEl.removeAttribute("min");
      if (typeof max === "number") inputEl.max = String(max);
      else inputEl.removeAttribute("max");
    } else {
      inputEl.removeAttribute("min");
      inputEl.removeAttribute("max");
    }
    inputEl.value = String(defaultValue ?? "");
    inputEl.placeholder = placeholder || "";

    okBtn.textContent = okLabel;
    cancelBtn.textContent = cancelLabel;

    const finish = (value) => {
      if (!activeCustomPrompt || activeCustomPrompt.resolve !== resolve) return;
      activeCustomPrompt = null;
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      inputEl.onkeydown = null;
      dialog.onclick = null;
      dialog.hidden = true;
      resolve(value);
    };

    const tryConfirm = () => {
      const value = inputEl.value;
      if (typeof validate === "function") {
        let result;
        try { result = validate(value); }
        catch (err) { result = String(err?.message || err); }
        if (result !== true && result !== undefined && result !== null) {
          errorEl.textContent = String(result);
          inputEl.focus();
          return;
        }
      }
      errorEl.textContent = "";
      finish(value);
    };

    okBtn.onclick = tryConfirm;
    cancelBtn.onclick = () => finish(null);
    inputEl.onkeydown = (e) => {
      if (e.key === "Enter") { e.preventDefault(); tryConfirm(); }
      else if (e.key === "Escape") { e.preventDefault(); finish(null); }
      else { errorEl.textContent = ""; }
    };
    dialog.onclick = (e) => { if (e.target === dialog) finish(null); };

    activeCustomPrompt = { resolve };

    dialog.hidden = false;
    requestAnimationFrame(() => {
      if (!activeCustomPrompt || activeCustomPrompt.resolve !== resolve) return;
      inputEl.focus();
      if (inputEl.value) inputEl.select();
    });
  });
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
    currentBank = null;
    state.midiUsedPatches.clear();
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
  currentBank = null; 
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

/* ---------- Project Properties Modal ---------- */
function openProjectPropertiesDialog(projectId) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) return;

  editingProjectPropertiesId = projectId;

  $("projectPropName").value        = project.name || "";
  $("projectPropAuthor").value      = project.author || "";
  $("projectPropSource").value      = project.sourceFile || "";
  $("projectPropStartDate").value   = project.startDate || "";
  $("projectPropEndDate").value     = project.endDate || "";
  $("projectPropDescription").value = project.description || "";
  $("projectPropertiesError").textContent = "";

  // Auto-isi source jika masih kosong
  if (!project.sourceFile) {
    const detected = detectProjectSourceFile(project);
    if (detected) $("projectPropSource").value = detected;
  }

  $("projectPropertiesDialog").hidden = false;
  requestAnimationFrame(() => {
    $("projectPropName").focus();
    $("projectPropName").select();
  });
}

function closeProjectPropertiesDialog(force = false) {
  if (!force && $("btnSaveProjectProperties").disabled) return;
  editingProjectPropertiesId = null;
  $("projectPropertiesDialog").hidden = true;
}

async function saveProjectProperties() {
  const projectId = editingProjectPropertiesId;
  if (!projectId) return;

  const project = state.projects.find(p => p.id === projectId);
  if (!project) {
    closeProjectPropertiesDialog(true);
    return;
  }

  const name = $("projectPropName").value.trim();
  if (!name) {
    $("projectPropertiesError").textContent = t("project_name_required");
    $("projectPropName").focus();
    return;
  }

  const startDate = $("projectPropStartDate").value || "";
  const endDate   = $("projectPropEndDate").value   || "";
  if (startDate && endDate && endDate < startDate) {
    $("projectPropertiesError").textContent = t("project_end_date_before_start");
    $("projectPropEndDate").focus();
    return;
  }

  const saveButton = $("btnSaveProjectProperties");
  saveButton.disabled = true;
  $("projectPropertiesError").textContent = "";

  try {
    const updated = {
      ...project,
      name,
      author:      $("projectPropAuthor").value.trim()      || undefined,
      sourceFile:  $("projectPropSource").value.trim()      || undefined,
      startDate:   startDate                                || undefined,
      endDate:     endDate                                  || undefined,
      description: $("projectPropDescription").value.trim() || undefined
    };

    // Jika proyek "recovered" di-rename oleh user, lepaskan flag locale
    // agar nama baru tidak ditimpa saat ganti bahasa.
    if (project.locale && name !== t("recovered_library_project")) {
      delete updated.locale;
    }

    await saveProject(updated);
    Object.assign(project, updated);

    closeProjectPropertiesDialog(true);
    renderProjects();
    showStatus(t("project_properties_saved", { name: updated.name }), "ok");
  } catch (err) {
    console.error("Save project properties error:", err);
    $("projectPropertiesError").textContent = t("project_save_failed");
  } finally {
    saveButton.disabled = false;
  }
}

/**
 * Deteksi otomatis nama file sumber dari daftar patch dalam proyek.
 * Mengembalikan string gabungan nama file (tanpa prefix "sf2:", "zip:", dst).
 */
function detectProjectSourceFile(project) {
  const sources = new Set();
  for (const patchId of project.patchIds || []) {
    const patch = state.patches.find(p => p.id === patchId);
    if (!patch || !patch.source) continue;
    const src = patch.source;
    if (src === "pat" || src === "generated" || src === "demo-generated") continue;
    const match = src.match(/^(?:sf2|zip|midijs):(.+)$/);
    if (match) sources.add(match[1]);
  }
  return Array.from(sources).sort().join(", ");
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
      name: getPatchDisplayName(patch, file.name.replace(/\.pat$/i, "")),
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

  // ---------------------------------------------------------------------
  // Legacy normalization: patch lama mungkin menyimpan rootFreq/lowFreq/highFreq
  // sebagai nomor nada MIDI (<=127) atau Hz (<8000), bukan mHz.
  // JANGAN dihapus — dibutuhkan untuk backward compatibility patch lama.
  // ---------------------------------------------------------------------
  for (const sample of samples) {
    if (sample.rootFreq > 0 && sample.rootFreq < 8000) {
      sample.rootFreq = sample.rootFreq <= 127
        ? Math.round(440 * Math.pow(2, (sample.rootFreq - 69) / 12) * 1000)
        : Math.round(sample.rootFreq * 1000);
      if (sample.lowFreq > 0) sample.lowFreq = Math.round(sample.lowFreq * 1000);
      if (sample.highFreq > 0) sample.highFreq = Math.round(sample.highFreq * 1000);
    }
  }

  // ---------------------------------------------------------------------
  // Resample ke 22050 Hz (fix pitch 2x)
  // ---------------------------------------------------------------------
  const OUT_RATE = 22050;
  for (const s of samples) {
    if (!s.sampleRate || s.sampleRate === OUT_RATE) continue;
    const is16 = (s.modes & M16) !== 0;
    const bps = is16 ? 2 : 1;
    const ratio = OUT_RATE / s.sampleRate;
    const wasLoop = (s.modes & MLOOP) !== 0;
    const oldStart = s.loopStart;
    const oldEnd = s.loopEnd;
    const resampled = resamplePcmTo(s.pcm, s.sampleRate, OUT_RATE, is16);

    if (!resampled) continue;

    s.pcm = resampled;
    s.dataSize = s.pcm.length;
    s.sampleRate = OUT_RATE;
    s._float = null;

    if (wasLoop) {
      const totalBytes = s.pcm.length; // penting: byte, bukan frame
      let ns = Math.round(oldStart * ratio);
      let ne = Math.round(oldEnd * ratio);

      ns = clamp(ns, 0, totalBytes);
      ne = clamp(ne, 0, totalBytes);

      // loopStart/loopEnd pada PAT adalah byte offset.
      // Panjang loop minimal 4 byte, sama seperti validateAndSanitizePatch.
      if (ne > ns && (ne - ns) >= 4 * bps) {
        s.loopStart = ns;
        s.loopEnd = ne;
      } else {
        s.modes &= ~MLOOP;
        s.loopStart = 0;
        s.loopEnd = 0;
      }
    }
  }

  // =====================================================================
  // === FIX: SAFETY NET — loop tanpa MENV ===
  // Sampel yang ber-loop tapi tidak punya envelope akan berputar selamanya
  // di TiMidity setelah note-off → gejala "reverb panjang".
  // Pasang MENV + envelope default ringan (attack ~10ms, sustain 100%,
  // release ~148ms) bila belum ada envelope yang bermakna.
  //
  // Diletakkan SETELAH resample, karena resample bisa menonaktifkan MLOOP
  // untuk loop yang terlalu pendek — dalam hal itu sampel tidak lagi
  // butuh release envelope.
  // =====================================================================
  for (const s of samples) {
    if ((s.modes & MLOOP) && !(s.modes & MENV)) {
      s.modes |= MENV;
      if (!Array.isArray(s.envRates) || s.envRates.every(r => r === 0)) {
        s.envRates = [9, 0, 0, 69, 0, 0];
      }
      if (!Array.isArray(s.envOffsets) ||
          (s.envOffsets.every(o => o === 0))) {
        s.envOffsets = [255, 255, 255, 0, 0, 0];
      }
    }
  }
  // === END SAFETY NET ===

  // ---------------------------------------------------------------------
  // Distribusi pitch-range untuk sampel "unrestricted range"
  // ---------------------------------------------------------------------
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

function generateProjectTimidityCfg(project, bankFilter = null) {
  const allPatches = getProjectPatches(project);

  // Jika filter bank aktif, hanya ambil patch dari bank tersebut.
  // Semua di-remap ke bank 0 (bank default TiMidity).
  let patches = allPatches;
  if (bankFilter !== null) {
    patches = allPatches.filter(p => (p.targetBank ?? 0) === bankFilter);
  }

  const melodic = patches.filter(p => (p.gmBank ?? 0) !== 128 && (p.gmProgram ?? -1) !== -1);
  const drums   = patches.filter(p => (p.gmBank ?? 0) === 128 && (p.gmProgram ?? -1) !== -1);

  let cfg = "# Generated by Planetbiru Instrument Editor for Player\n# Visit: https://composer.planetbiru.com/instrument-editor/\n\n";
  cfg += "dir /gus-patch\n\n";

  const usedPaths = new Set();
  const allocatePath = (p) => {
    const bank = (bankFilter !== null) ? 0 : (p.targetBank ?? 0);
    const kind = (p.gmBank ?? 0) === 128 ? "drum" : "tone";
    const prog = String(p.gmProgram ?? 0).padStart(3, "0");
    const basePath = `${bank}/${kind}/${prog}_${sanitizeFilename(p.name)}.pat`;
    let path = basePath;
    let suffix = 1;
    while (usedPaths.has(path)) {
      path = basePath.replace(/\.pat$/, `_${suffix++}.pat`);
    }
    usedPaths.add(path);
    return path;
  };

  // Melodic
  const melodicByBank = {};
  for (const p of melodic) {
    const b = (bankFilter !== null) ? 0 : (p.targetBank ?? 0);
    if (!melodicByBank[b]) melodicByBank[b] = [];
    melodicByBank[b].push(p);
  }
  for (const b of Object.keys(melodicByBank).map(Number).sort((a, b) => a - b)) {
    cfg += `bank ${b}\n`;
    for (const p of melodicByBank[b]) {
      cfg += `${p.gmProgram} ${allocatePath(p)}\n`;
    }
    cfg += "\n";
  }

  // Drums
  if (drums.length > 0) {
    const drumGroups = {};
    for (const p of drums) {
      const kitId = (bankFilter !== null) ? 0 : (p.targetBank ?? 0);
      if (!drumGroups[kitId]) drumGroups[kitId] = [];
      drumGroups[kitId].push(p);
    }
    const kitIds = Object.keys(drumGroups).map(Number).sort((a, b) => a - b);
    for (const kitId of kitIds) {
      cfg += `drumset ${kitId}\n`;
      for (const p of drumGroups[kitId].sort((a, b) => a.gmProgram - b.gmProgram)) {
        cfg += `${p.gmProgram} ${allocatePath(p)}\n`;
      }
      cfg += "\n";
    }
  }

  // Fallback
  if (melodic.length === 0 && drums.length === 0 && patches.length > 0) {
    cfg += "bank 0\n";
    patches.slice(0, 128).forEach((p, i) => {
      cfg += `${i} ${allocatePath(p)}\n`;
    });
  }

  return cfg;
}

async function exportProjectToSF2(project, patches) {
  try {
    showStatus(t("export_sf2_processing") || "Menyiapkan SF2...", "ok");

    const sampleData = [];
    const shdr = [];
    let currentOffset = 0;
    const processedPatches = [];

    // 1. Kumpulkan Data Sampel
    for (let idx = 0; idx < patches.length; idx++) {
      const entry = patches[idx];
      const patch = cleanPatchForStorage(entry.patch);
      const inst = patch.instruments[0];
      if (!inst) continue;

      const samples = [];
      for (const layer of inst.layers) {
        for (const s of layer.samples) {
          // === FIX PITCH ===
          // Hitung originalPitch & pitchCorrection dari rootFreq (prioritas utama)
          // dan scaleFreq (fallback). Inilah satu-satunya sumber kebenaran pitch
          // yang akan dibaca balik oleh convertSample saat import SF2 -> PAT.
          const { originalPitch, pitchCorrection } = computeSf2Pitch(s.rootFreq, s.scaleFreq);

          // Konversi PCM ke 16-bit signed. Skala 32768 + clamp menjaga roundtrip
          // PCM agar identik dengan pcmToFloat (tidak kehilangan 1 LSB).
          const f = pcmToFloat(s);
          const pcm16 = new Int16Array(f.length);
          for (let i = 0; i < f.length; i++) {
            let v = Math.round(f[i] * 32768);
            if (v > 32767) v = 32767;
            if (v < -32768) v = -32768;
            pcm16[i] = v;
          }

          const bps = (s.modes & M16) ? 2 : 1;
          let startFrame = 0, endFrame = 0;
          if (s.modes & MLOOP) {
            const bps = (s.modes & M16) ? 2 : 1;
            startFrame = Math.round(s.loopStart / bps);
            endFrame   = Math.round(s.loopEnd   / bps);
            if (startFrame >= endFrame || endFrame > pcm16.length) {
              startFrame = 0; endFrame = 0;
            }
          }

          sampleData.push(pcm16);

          const sr = s.sampleRate || 22050;

          shdr.push({
            name: (s.name || "SMP").substring(0, 20),
            start: currentOffset,
            end: currentOffset + pcm16.length,
            startloop: currentOffset + startFrame,
            endloop: currentOffset + endFrame,
            sampleRate: sr,
            originalPitch: originalPitch,         // <-- dari computeSf2Pitch
            pitchCorrection: pitchCorrection,     // <-- dari computeSf2Pitch (BUKAN 0)
            sampleLink: 0,
            sampleType: 1
          });

          currentOffset += pcm16.length;

          let keyLow = s.lowFreq
            ? Math.max(0, Math.min(127, Math.round(69 + 12 * Math.log2((s.lowFreq / 1000) / 440))))
            : 0;
          let keyHigh = s.highFreq
            ? Math.max(0, Math.min(127, Math.round(69 + 12 * Math.log2((s.highFreq / 1000) / 440))))
            : 127;

          samples.push({
            shdrIndex: shdr.length - 1,
            keyLow,
            keyHigh,
            loopMode: (s.modes & MLOOP) ? 1 : 0
          });
        }
      }

      processedPatches.push({ entry, samples });
      if (idx % 8 === 0) await new Promise(r => setTimeout(r, 0));
    }

    // 2. Susun Preset (Gunakan Target Bank & Tangani Program Kosong)
    const presets = new Map();
    const bankProgramTracker = new Map();

    // Daftarkan dulu semua program eksplisit (selain -1) agar tidak bentrok
    for (const p of processedPatches) {
      const entry = p.entry;
      const isDrum = (entry.gmBank ?? 0) === 128;
      if (isDrum) continue;
      const targetBank = entry.targetBank ?? 0;
      const program = entry.gmProgram ?? -1;

      if (program !== -1) {
        if (!bankProgramTracker.has(targetBank)) bankProgramTracker.set(targetBank, new Set());
        bankProgramTracker.get(targetBank).add(program);
      }
    }

    for (const p of processedPatches) {
      const entry = p.entry;
      const isDrum = (entry.gmBank ?? 0) === 128;

      if (isDrum) {
        // Drum Kit digabung menjadi 1 Preset (Bank 128, Program = ID Kit)
        const kitId = entry.targetBank ?? 0;
        const key = `128:${kitId}`;

        if (!presets.has(key)) {
          presets.set(key, {
            name: (entry.name || "Drum Kit").substring(0, 20),
            bank: 128,
            program: kitId,
            zones: []
          });
        }

        const preset = presets.get(key);
        for (const s of p.samples) {
          preset.zones.push({
            keyLow: entry.gmProgram ?? 0,   // Note drum dijadikan batas nada
            keyHigh: entry.gmProgram ?? 0,
            sampleIndex: s.shdrIndex,
            loopMode: s.loopMode
          });
        }
      } else {
        // Melodic
        const targetBank = entry.targetBank ?? 0;
        let program = entry.gmProgram ?? -1;

        if (program === -1) {
          if (!bankProgramTracker.has(targetBank)) bankProgramTracker.set(targetBank, new Set());
          const used = bankProgramTracker.get(targetBank);
          program = 0;
          while (used.has(program) && program < 128) program++;
          used.add(program);
        }

        const key = `${targetBank}:${program}`;
        if (!presets.has(key)) {
          presets.set(key, {
            name: (entry.name || "Preset").substring(0, 20),
            bank: targetBank,
            program: program,
            zones: []
          });
        }

        const preset = presets.get(key);
        for (const s of p.samples) {
          preset.zones.push({
            keyLow: s.keyLow,
            keyHigh: s.keyHigh,
            sampleIndex: s.shdrIndex,
            loopMode: s.loopMode
          });
        }
      }
    }

    // 3. Bangun PDTA (Instrument, Bag, Generator)
    const instHeaders = [];
    const ibag = [];
    const igen = [];
    let instBagIndex = 0;
    let instGenIndex = 0;

    const phdr = [];
    const pbag = [];
    const pgen = [];

    for (const preset of presets.values()) {
      const instIdx = instHeaders.length;
      instHeaders.push({
        name: preset.name,
        bagIdx: instBagIndex
      });

      for (const zone of preset.zones) {
        ibag.push({ genIdx: instGenIndex, modIdx: 0 });
        igen.push({ op: 43, amt: (zone.keyHigh << 8) | zone.keyLow }); // keyRange
        if (zone.loopMode) igen.push({ op: 54, amt: 1 });              // sampleModes
        igen.push({ op: 53, amt: zone.sampleIndex });                  // sampleID
        instGenIndex = igen.length;
      }

      ibag.push({ genIdx: instGenIndex, modIdx: 0 }); // Terminal ibag
      instBagIndex = ibag.length;

      pbag.push({ genIdx: pgen.length, modIdx: 0 });
      pgen.push({ op: 41, amt: instIdx }); // instrument

      phdr.push({
        name: preset.name,
        program: preset.program,
        bank: preset.bank,
        bagIdx: pbag.length - 1
      });
    }

    // Terminal record
    phdr.push({ name: "EOP", program: 0, bank: 0, bagIdx: pbag.length });
    pbag.push({ genIdx: pgen.length, modIdx: 0 });
    pgen.push({ op: 0, amt: 0 });

    instHeaders.push({ name: "EOI", bagIdx: ibag.length });
    ibag.push({ genIdx: igen.length, modIdx: 0 });
    igen.push({ op: 0, amt: 0 });

    shdr.push({
      name: "EOS", start: 0, end: 0, startloop: 0, endloop: 0,
      sampleRate: 0, originalPitch: 0, pitchCorrection: 0, sampleLink: 0, sampleType: 0
    });

    // 4. Encoder Biner SF2
    const encoder = new TextEncoder();

    const makeChunk = (id, dataArray) => {
      const size = dataArray.length;
      const buf = new Uint8Array(8 + size + (size % 2));
      buf.set(encoder.encode(id), 0);
      new DataView(buf.buffer).setUint32(4, size, true);
      buf.set(dataArray, 8);
      return buf;
    };

    const makeList = (type, chunks) => {
      let totalSize = 4;
      for (const c of chunks) totalSize += c.length;
      const buf = new Uint8Array(8 + totalSize);
      buf.set(encoder.encode("LIST"), 0);
      new DataView(buf.buffer).setUint32(4, totalSize, true);
      buf.set(encoder.encode(type), 8);
      let offset = 12;
      for (const c of chunks) {
        buf.set(c, offset);
        offset += c.length;
      }
      return buf;
    };

    const encodePhdr = (list) => {
      const buf = new Uint8Array(list.length * 38);
      const dv = new DataView(buf.buffer);
      let offset = 0;
      for (const p of list) {
        buf.set(encoder.encode(p.name.padEnd(20, '\0').substring(0, 20)), offset); offset += 20;
        dv.setUint16(offset, p.program, true); offset += 2;
        dv.setUint16(offset, p.bank, true); offset += 2;
        dv.setUint16(offset, p.bagIdx, true); offset += 2;
        dv.setUint32(offset, 0, true); offset += 4;
        dv.setUint32(offset, 0, true); offset += 4;
        dv.setUint32(offset, 0, true); offset += 4;
      }
      return buf;
    };

    const encodePbag = (list) => {
      const buf = new Uint8Array(list.length * 4);
      const dv = new DataView(buf.buffer);
      let offset = 0;
      for (const p of list) {
        dv.setUint16(offset, p.genIdx, true); offset += 2;
        dv.setUint16(offset, p.modIdx, true); offset += 2;
      }
      return buf;
    };

    const encodePmod = (list) => new Uint8Array(list.length * 10);

    const encodePgen = (list) => {
      const buf = new Uint8Array(list.length * 4);
      const dv = new DataView(buf.buffer);
      let offset = 0;
      for (const p of list) {
        dv.setUint16(offset, p.op, true); offset += 2;
        dv.setUint16(offset, p.amt, true); offset += 2;
      }
      return buf;
    };

    const encodeInst = (list) => {
      const buf = new Uint8Array(list.length * 22);
      const dv = new DataView(buf.buffer);
      let offset = 0;
      for (const p of list) {
        buf.set(encoder.encode(p.name.padEnd(20, '\0').substring(0, 20)), offset); offset += 20;
        dv.setUint16(offset, p.bagIdx, true); offset += 2;
      }
      return buf;
    };

    const encodeShdr = (list) => {
      const buf = new Uint8Array(list.length * 46);
      const dv = new DataView(buf.buffer);
      let offset = 0;
      for (const p of list) {
        buf.set(encoder.encode(p.name.padEnd(20, '\0').substring(0, 20)), offset); offset += 20;
        dv.setUint32(offset, p.start, true); offset += 4;
        dv.setUint32(offset, p.end, true); offset += 4;
        dv.setUint32(offset, p.startloop, true); offset += 4;
        dv.setUint32(offset, p.endloop, true); offset += 4;
        dv.setUint32(offset, p.sampleRate, true); offset += 4;
        dv.setUint8(offset, p.originalPitch); offset += 1;
        dv.setInt8(offset, p.pitchCorrection); offset += 1;
        dv.setUint16(offset, p.sampleLink, true); offset += 2;
        dv.setUint16(offset, p.sampleType, true); offset += 2;
      }
      return buf;
    };

    let totalSamples = 0;
    for (const s of sampleData) totalSamples += s.length;
    const smplBytes = new Uint8Array(totalSamples * 2);
    const smplDv = new DataView(smplBytes.buffer);
    let smplOffset = 0;
    for (const s of sampleData) {
      for (let i = 0; i < s.length; i++) {
        smplDv.setInt16(smplOffset, s[i], true);
        smplOffset += 2;
      }
    }

    const infoChunks = [];
    const ifilBuf = new Uint8Array(4);
    new DataView(ifilBuf.buffer).setUint16(0, 2, true);
    new DataView(ifilBuf.buffer).setUint16(2, 1, true);
    infoChunks.push(makeChunk("ifil", ifilBuf));
    infoChunks.push(makeChunk("isng", encoder.encode("EMU8000\0")));
    infoChunks.push(makeChunk("INAM", encoder.encode(project.name + "\0")));

    const infoList = makeList("INFO", infoChunks);
    const sdtaList = makeList("sdta", [makeChunk("smpl", smplBytes)]);

    const pdtaChunks = [
      makeChunk("phdr", encodePhdr(phdr)),
      makeChunk("pbag", encodePbag(pbag)),
      makeChunk("pmod", encodePmod([{}])),
      makeChunk("pgen", encodePgen(pgen)),
      makeChunk("inst", encodeInst(instHeaders)),
      makeChunk("ibag", encodePbag(ibag)),
      makeChunk("imod", encodePmod([{}])),
      makeChunk("igen", encodePgen(igen)),
      makeChunk("shdr", encodeShdr(shdr))
    ];
    const pdtaList = makeList("pdta", pdtaChunks);

    const finalSize = 4 + infoList.length + sdtaList.length + pdtaList.length;
    const result = new Uint8Array(8 + finalSize);
    result.set(encoder.encode("RIFF"), 0);
    new DataView(result.buffer).setUint32(4, finalSize, true);
    result.set(encoder.encode("sfbk"), 8);

    let offset = 12;
    result.set(infoList, offset); offset += infoList.length;
    result.set(sdtaList, offset); offset += sdtaList.length;
    result.set(pdtaList, offset);

    const blob = new Blob([result], { type: "audio/x-soundfont" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/[^\w\-]+/g, "_")}.sf2`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    showStatus(t("export_sf2_done") || "SF2 berhasil diekspor", "ok");
  } catch (err) {
    console.error("SF2 export error:", err);
    showStatus(t("export_sf2_failed") || "Gagal ekspor SF2", "bad");
  }
}

async function exportProjectWithConfig(project, patches) {
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

      // Gunakan getPatchDisplayName untuk mengambil nama paling baru
      const exportName = getPatchDisplayName(entry.patch, entry.name);
      const programNum = (entry.gmProgram >= 0 && entry.gmProgram <= 127) ? entry.gmProgram : 0;
      const programPrefix = String(programNum).padStart(3, "0");
      
      let filename = `${programPrefix}_${sanitizeFilename(exportName)}.pat`;

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
      patchName: getPatchDisplayName(zf.entry.patch, zf.entry.name),
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
      // HAPUS drumSetMap dan bankMap dari sini
      data: new TextEncoder().encode(generateProjectTimidityCfgForZip(project, patchPaths, patches))
    });

    const zipBytes = createZip(zipFiles);
    const blob = new Blob([zipBytes], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/[^\w\-]+/g, "_")}.zip`; // Hapus akhiran mode
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showStatus(t("export_banks_done", {count: patches.length}), "ok");
  } catch (err) {
    console.error(err);
    showStatus(t("project_export_failed", {message: err.message}), "bad");
  }
}

const patchBufferCache = new Map(); // Tambahkan di dekat deklarasi state

function invalidateTimidityPlayer(clearPatchCache = true) {
  if (timidityPlayer) {
    try { timidityPlayer.shutdown(); } catch (e) {}
    timidityPlayer = null;
  }
  if (clearPatchCache) {
    patchBufferCache.clear();
  }
}

function getProjectPatchData(bank, isDrum, program, file) {
  if (!state.currentProjectId) return null;
  const project = state.projects.find(p => p.id === state.currentProjectId);
  if (!project) return null;
  const patches = getProjectPatches(project);
  if (patches.length === 0) return null;

  // --- 1) Filter utama: type + bank (targetBank) + program ---
  let candidates = patches.filter(p => {
    const pIsDrum = (p.gmBank ?? 0) === 128;
    if (pIsDrum !== isDrum) return false;

    if (isDrum) {
      return p.gmProgram === program && (p.targetBank ?? 0) === bank;
    } else {
      return (p.gmProgram ?? -1) === program && (p.targetBank ?? 0) === bank;
    }
  });

  // --- 2) Fallback: gunakan originalOrder jika targetBank belum diset ---
  if (candidates.length === 0) {
    candidates = patches.filter(p => {
      const pIsDrum = (p.gmBank ?? 0) === 128;
      if (pIsDrum !== isDrum) return false;

      if (isDrum) {
        return p.gmProgram === program && (p.originalOrder ?? 0) === bank;
      } else {
        return (p.gmProgram ?? -1) === program && (p.gmBank ?? 0) === bank;
      }
    });
  }

  if (candidates.length === 0) {
    // Tidak ada patch yang cocok — jangan memutar patch acak.
    return null;
  }

  // --- 3) Filter terakhir: hanya jika lebih dari 1 kandidat, gunakan nama file ---
  let target = candidates[0];
  if (candidates.length > 1) {
    const reqName = String(file || "")
      .split(/[\\/]/)
      .pop()
      .replace(/\.pat$/i, "")
      .toLowerCase();

    if (reqName) {
      const byName = candidates.find(p =>
        sanitizeFilename(p.name).toLowerCase() === reqName
      );
      if (byName) target = byName;
    }
  }

  // --- 4) Cache & bangun .pat biner ---
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
      // SELALU hasilkan cfg untuk semua bank, abaikan currentBank
      return generateProjectTimidityCfg(project, null);
    },
    instrumentLoader: (bank, isDrum, program, file) => {
      // Gunakan 'bank' langsung dari engine, bukan currentBank
      return getProjectPatchData(bank, isDrum, program, file);
    },
    bufferSize: 4096,
    sampleRate: 96000
  });

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
    // ═══════════════════════════════════════════════════════════════
    // Guard kritis: hanya proses jika kita MASIH di state playing.
    // Jika playing=false, berarti user baru saja pause/stop/seek —
    // onEnded ini adalah efek samping dari timidityPlayer.stop(),
    // bukan akhir lagu yang sesungguhnya.
    // ═══════════════════════════════════════════════════════════════
    if (!midiProgress.playing) return;

    midiProgress.playing = false;
    midiProgress.paused = false;
    midiProgress.current = midiProgress.duration;
    cancelAnimationFrame(midiProgress.raf);

    $("btnPlayMidi").disabled = false;
    $("btnPlayMidi").innerHTML = `<svg class="icon"><use href="#i-play"></use></svg> ${t("play")}`;
    $("btnStopMidi").disabled = true;

    $("btnTimelinePlay").disabled = false;
    $("btnTimelinePlay").innerHTML = `<svg class="icon"><use href="#i-play"></use></svg>`;



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

  resetMidiUsedPatches();              // (1) reset daftar
  invalidateTimidityPlayer(false);     // shutdown WASM, cache .pat dipertahankan
  closeMidiTimelineDialog();

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
  $("btnStopMidi").disabled = true;
  $("btnRenderMidi").disabled = false;
  $("midiSeek").disabled = false;

  $("btnShowMidiUsedPatches").disabled = false;
  $("btnShowMidiTimeline").disabled = false;
  
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

function resetMidiUsedPatches() {
  state.midiUsedPatches.clear();
  if ($("midiUsedPatchesDialog") && !$("midiUsedPatchesDialog").hidden) {
    renderMidiUsedPatchesList();
  }
}

let midiUsedPatchesRerenderScheduled = false;
function scheduleMidiUsedPatchesRerender() {
  if (midiUsedPatchesRerenderScheduled) return;
  midiUsedPatchesRerenderScheduled = true;
  requestAnimationFrame(() => {
    midiUsedPatchesRerenderScheduled = false;
    if ($("midiUsedPatchesDialog") && !$("midiUsedPatchesDialog").hidden) {
      renderMidiUsedPatchesList();
    }
  });
}

function renderMidiUsedPatchesList() {
  const list = $("midiUsedPatchesList");
  if (!list) return;
  list.innerHTML = "";

  const entries = Array.from(state.midiUsedPatches.values())
    .filter(entry => state.patches.some(p => p.id === entry.id));

  $("midiUsedPatchesCount").textContent = entries.length;

  $("midiUsedPatchesDesc").textContent = state.midiFileName
    ? `${t("midi_used_patches_desc")} (${state.midiFileName})`
    : t("midi_used_patches_desc");

  if (entries.length === 0) {
    list.innerHTML = `<div style="padding:12px;color:var(--dim);text-align:center;font-size:11px">${t("midi_used_patches_empty")}</div>`;
    return;
  }

  entries.forEach(entry => {
    const d = document.createElement("div");
    d.className = "li" + (entry.id === state.currentPatchId ? " active" : "");
    const isDrum = (entry.gmBank ?? 0) === 128;
    const typeLabel = isDrum ? t("drum") : t("non_drum");

    d.innerHTML = `
      <span class="name" title="${escapeHtml(entry.name)}">${escapeHtml(entry.name)}</span>
      <span class="meta">${typeLabel} · #${String(entry.gmProgram ?? -1).padStart(3, "0")} · Bank ${entry.targetBank ?? 0}</span>
    `;

    d.addEventListener("click", () => {
      closeMidiUsedPatchesDialog();
      selectPatch(entry.id);
      setTimeout(() => {
        const activeLi = document.querySelector("#patchList .li.active");
        if (activeLi) activeLi.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    });

    list.appendChild(d);
  });
}

function openMidiUsedPatchesDialog() {
  renderMidiUsedPatchesList();
  $("midiUsedPatchesDialog").hidden = false;
}

function closeMidiUsedPatchesDialog() {
  $("midiUsedPatchesDialog").hidden = true;
}

function getUsedMidiPrograms(midiData) {
  const used = new Set();   // format key: "bank:program:isDrum"
  let p = 0;
  if (!(midiData[p] === 0x4D && midiData[p+1] === 0x54 &&
        midiData[p+2] === 0x68 && midiData[p+3] === 0x64)) return used;
  p += 4;
  const headerLength = (midiData[p]<<24) | (midiData[p+1]<<16) | (midiData[p+2]<<8) | midiData[p+3];
  p += 4;
  const numTracks = (midiData[p+2]<<8) | midiData[p+3];
  p += headerLength;

  const channelBanks   = new Array(16).fill(0);
  const channelPrograms = new Array(16).fill(0);
  const channelHadPC    = new Array(16).fill(false);

  const recordProgram = (ch, program) => {
    const isDrum = ch === 9;
    const bank = channelBanks[ch];   // GUS drumkit id juga 0..N, jadi tidak perlu +128
    used.add(`${bank}:${program}:${isDrum ? 1 : 0}`);
  };

  for (let t = 0; t < numTracks; t++) {
    if (p+4 > midiData.length) break;
    if (!(midiData[p] === 0x4D && midiData[p+1] === 0x54 &&
          midiData[p+2] === 0x72 && midiData[p+3] === 0x6B)) break;
    p += 4;
    const trackLen = (midiData[p]<<24) | (midiData[p+1]<<16) | (midiData[p+2]<<8) | midiData[p+3];
    p += 4;
    const trackEnd = p + trackLen;
    let runningStatus = 0;

    while (p < trackEnd) {
      let b;
      do { b = midiData[p++]; } while (b & 0x80);      // skip delta time

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
        p += len;
      } else if (status === 0xF0 || status === 0xF7) {
        let len = 0;
        do { b = midiData[p++]; len = (len << 7) | (b & 0x7F); } while (b & 0x80);
        p += len;
      } else {
        const type = status & 0xF0;
        const ch = status & 0x0F;

        if (type === 0x90) {
          const vel = midiData[p+1];
          p += 2;
          if (vel > 0 && !channelHadPC[ch]) {
            // Catatan dimainkan tanpa PC → program default 0
            recordProgram(ch, 0);
          }
        } else if (type === 0x80) {
          p += 2;
        } else if (type === 0xB0) {
          const cc  = midiData[p];
          const val = midiData[p+1];
          p += 2;
          if (cc === 0) channelBanks[ch] = val;
        } else if (type === 0xC0) {
          channelPrograms[ch] = midiData[p++];
          channelHadPC[ch] = true;
          recordProgram(ch, channelPrograms[ch]);
        } else if (type === 0xA0 || type === 0xE0) {
          p += 2;
        } else if (type === 0xD0) {
          p += 1;
        }
      }
    }
    p = trackEnd;
  }
  return used;
}

/* ---------- MIDI Timeline ---------- */
function getNiceTickStep(totalTicks) {
  if (!totalTicks || totalTicks <= 0) return 1;
  const target = totalTicks / 6;
  const magnitude = Math.pow(10, Math.floor(Math.log10(target)));
  const norm = target / magnitude;
  let nice;
  if (norm < 1.5) nice = 1;
  else if (norm < 3.5) nice = 2;
  else if (norm < 7.5) nice = 5;
  else nice = 10;
  return nice * magnitude;
}

/**
 * Parse MIDI untuk timeline: menggabungkan semua track, mengumpulkan event
 * bank/program per channel, lalu membentuk segmen bar.
 *
 * Aturan:
 * - Bar dimulai saat event Program Change.
 * - Bar berakhir saat: Program Change berikutnya, Bank Change (jika segment
 *   sudah aktif), atau akhir lagu.
 */
function parseMidiTimeline(midiData) {
  const result = {
    ticksPerQuarter: 480,
    totalTicks: 0,
    segments: []
  };

  if (!midiData || midiData.length < 14) return result;
  if (!(midiData[0]===0x4D && midiData[1]===0x54 && midiData[2]===0x68 && midiData[3]===0x64)) return result;

  let p = 4;
  const headerLen = (midiData[p]<<24) | (midiData[p+1]<<16) | (midiData[p+2]<<8) | midiData[p+3];
  p += 4;
  const numTracks = (midiData[p+2]<<8) | midiData[p+3];
  const division = (midiData[p+4]<<8) | midiData[p+5];
  p += headerLen;

  if (division & 0x8000) return result; // SMPTE tidak didukung
  result.ticksPerQuarter = division;

  // --- Kumpulkan semua event dari semua track (dengan tick absolut) ---
  const events = [];

  for (let t = 0; t < numTracks; t++) {
    if (p + 8 > midiData.length) break;
    if (!(midiData[p]===0x4D && midiData[p+1]===0x54 && midiData[p+2]===0x72 && midiData[p+3]===0x6B)) break;
    p += 4;
    const trackLen = (midiData[p]<<24) | (midiData[p+1]<<16) | (midiData[p+2]<<8) | midiData[p+3];
    p += 4;
    const trackEnd = p + trackLen;
    let tick = 0;
    let runningStatus = 0;

    while (p < trackEnd) {
      let delta = 0, b;
      do { b = midiData[p++]; delta = (delta << 7) | (b & 0x7F); } while (b & 0x80);
      tick += delta;
      if (tick > result.totalTicks) result.totalTicks = tick;
      if (p >= trackEnd) break;

      let status = midiData[p];
      if (status & 0x80) {
        p++;
        if (status < 0xF0) runningStatus = status;
      } else {
        status = runningStatus;
      }

      if (status === 0xFF) {
        const metaType = midiData[p++];
        let len = 0;
        do { b = midiData[p++]; len = (len << 7) | (b & 0x7F); } while (b & 0x80);
        p += len;
      } else if (status === 0xF0 || status === 0xF7) {
        let len = 0;
        do { b = midiData[p++]; len = (len << 7) | (b & 0x7F); } while (b & 0x80);
        p += len;
      } else {
        const type = status & 0xF0;
        const ch = status & 0x0F;
        if (type === 0xB0) {
          const cc = midiData[p], val = midiData[p+1];
          p += 2;
          if (cc === 0) events.push({ tick, type: 'bank', ch, bank: val });
        } else if (type === 0xC0) {
          const program = midiData[p];
          p += 1;
          events.push({ tick, type: 'program', ch, program });
        } else if (type === 0x90 || type === 0x80 || type === 0xA0 || type === 0xE0) {
          p += 2;
        } else if (type === 0xD0) {
          p += 1;
        } else {
          break;
        }
      }
    }
    p = trackEnd;
  }

  // --- Urutkan: tick ascending, bank before program pada tick sama ---
  events.sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    const order = { bank: 0, program: 1 };
    return (order[a.type] || 0) - (order[b.type] || 0);
  });

  // --- Bangun segmen per channel ---
  const channelBank = new Array(16).fill(0);
  const channelProgram = new Array(16).fill(null);
  const channelActiveSeg = new Array(16).fill(null);

  for (const ev of events) {
    const ch = ev.ch;
    if (ev.type === 'bank') {
      if (channelProgram[ch] !== null && channelActiveSeg[ch] !== null) {
        const seg = result.segments[channelActiveSeg[ch]];
        seg.endTick = ev.tick;
        channelBank[ch] = ev.bank;
        result.segments.push({
          channel: ch, startTick: ev.tick, endTick: null,
          program: channelProgram[ch], bank: ev.bank, isDrum: ch === 9
        });
        channelActiveSeg[ch] = result.segments.length - 1;
      } else {
        channelBank[ch] = ev.bank;
      }
    } else if (ev.type === 'program') {
      if (channelActiveSeg[ch] !== null) {
        const seg = result.segments[channelActiveSeg[ch]];
        seg.endTick = ev.tick;
      }
      channelProgram[ch] = ev.program;
      result.segments.push({
        channel: ch, startTick: ev.tick, endTick: null,
        program: ev.program, bank: channelBank[ch], isDrum: ch === 9
      });
      channelActiveSeg[ch] = result.segments.length - 1;
    }
  }

  // Tutup segmen yang masih terbuka di akhir lagu
  for (let ch = 0; ch < 16; ch++) {
    if (channelActiveSeg[ch] !== null) {
      const seg = result.segments[channelActiveSeg[ch]];
      if (seg.endTick === null) {
        seg.endTick = Math.max(result.totalTicks, seg.startTick + 1);
      }
    }
  }

  // Buang segmen zero-length (proteksi terakhir)
  result.segments = result.segments.filter(s => {
    if (s.endTick === null || s.endTick <= s.startTick) return false;
    
    // BUANG segmen yang mulai tepat di atau melewati akhir lagu.
    // Segmen ini biasanya artefak dari event Program/Bank Change 
    // yang menempel di tick terakhir tanpa ada not yang dimainkan.
    if (s.startTick >= result.totalTicks) return false;
    
    return true;
  });
  return result;
}

function openMidiTimelineDialog() {
  if (!state.midiData) {
    showAlert("midi_timeline_no_midi");
    return;
  }

  const dialog = $("midiTimelineDialog");
  const container = $("midiTimelineContainer");
  if (!dialog || !container) {
    console.error("[Timeline] Modal elemen tidak ditemukan di DOM");
    return;
  }

  const timeline = parseMidiTimeline(state.midiData);
  if (timeline.segments.length === 0) {
    showAlert("midi_timeline_empty");
    return;
  }

  container.innerHTML = "";

  // ─── reset referensi tombol M/S ───
  midiChannelMuteBtnRefs.fill(null);
  midiChannelSoloBtnRefs.fill(null);
  
  const totalTicks = Math.max(1, timeline.totalTicks);

  timelineTotalTicks = totalTicks; 

  const palette = [
    "#38bdf8", "#a78bfa", "#34d399", "#fbbf24", "#f87171",
    "#fb7185", "#c084fc", "#22d3ee", "#f59e0b", "#10b981",
    "#60a5fa", "#e879f9", "#facc15", "#4ade80", "#f472b6",
    "#2dd4bf", "#818cf8", "#fdba74", "#5eead4", "#fcd34d"
  ];
  const colorMap = new Map();
  let colorIndex = 0;
  const getColor = (seg) => {
    const key = `${seg.isDrum}:${seg.bank}:${seg.program}`;
    if (!colorMap.has(key)) {
      colorMap.set(key, palette[colorIndex++ % palette.length]);
    }
    return colorMap.get(key);
  };

  // --- Ruler (tick markers) ---
  const rulerRow = document.createElement("div");
  rulerRow.className = "midi-timeline-row";
  rulerRow.style.marginBottom = "6px";
  const rulerSpacer = document.createElement("div");
  rulerSpacer.className = "midi-timeline-label";
  const rulerTrack = document.createElement("div");
  rulerTrack.className = "midi-timeline-track";
  rulerTrack.style.height = "16px";
  rulerTrack.style.background = "transparent";
  rulerTrack.style.border = "none";

  const step = getNiceTickStep(totalTicks);
  for (let t = 0; t <= totalTicks; t += step) {
    const tickEl = document.createElement("span");
    tickEl.className = "midi-timeline-tick";
    tickEl.style.left = `${(t / totalTicks) * 100}%`;
    tickEl.textContent = t.toLocaleString();
    if (t === 0) tickEl.style.transform = "translateX(0)"; // Rata kiri untuk tick 0
    rulerTrack.appendChild(tickEl);
  }
  if (totalTicks % step !== 0) {
    const tickEl = document.createElement("span");
    tickEl.className = "midi-timeline-tick";
    tickEl.style.left = "100%";
    tickEl.style.transform = "translateX(-100%)";
    tickEl.textContent = totalTicks.toLocaleString();
    rulerTrack.appendChild(tickEl);
  }
  rulerRow.appendChild(rulerSpacer);
  rulerRow.appendChild(rulerTrack);
  container.appendChild(rulerRow);

  // --- 16 channel rows ---
  for (let ch = 0; ch < 16; ch++) {
    const row = document.createElement("div");
    row.className = "midi-timeline-row";
    row.dataset.channel = String(ch);          // ← untuk updateTimelineMutedVisuals()

    const label = document.createElement("div");
    label.className = "midi-timeline-label";
    label.style.display = "flex";
    label.style.alignItems = "center";
    label.style.gap = "2px";
    label.style.overflow = "hidden";

    // ─── Tombol Mute ───
    const muteBtn = document.createElement("button");
    muteBtn.type = "button";
    muteBtn.textContent = "M";
    muteBtn.title = "Mute channel " + ch;
    muteBtn.style.cssText =
      "width:14px;height:14px;padding:0;font-size:9px;font-weight:700;" +
      "border-radius:2px;border:1px solid #334155;background:#1e293b;" +
      "color:#94a3b8;cursor:pointer;display:inline-flex;" +
      "align-items:center;justify-content:center;line-height:1;flex:0 0 auto;";
    muteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      midiChannelMute[ch] = !midiChannelMute[ch];
      refreshMuteSoloButtons();
      applyMidiMuteSolo();
      updateTimelineMutedVisuals();
    });
    midiChannelMuteBtnRefs[ch] = muteBtn;

    // ─── Tombol Solo ───
    const soloBtn = document.createElement("button");
    soloBtn.type = "button";
    soloBtn.textContent = "S";
    soloBtn.title = "Solo channel " + ch;
    soloBtn.style.cssText =
      "width:14px;height:14px;padding:0;font-size:9px;font-weight:700;" +
      "border-radius:2px;border:1px solid #334155;background:#1e293b;" +
      "color:#94a3b8;cursor:pointer;display:inline-flex;" +
      "align-items:center;justify-content:center;line-height:1;flex:0 0 auto;";
    soloBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      midiChannelSolo[ch] = !midiChannelSolo[ch];
      refreshMuteSoloButtons();
      applyMidiMuteSolo();
      updateTimelineMutedVisuals();
    });
    midiChannelSoloBtnRefs[ch] = soloBtn;

    // ─── Label nama channel ───
    const nameSpan = document.createElement("span");
    nameSpan.textContent = ch === 9 ? "Drum" : `CH ${ch}`;
    nameSpan.style.cssText =
      "font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
    if (ch === 9) nameSpan.style.color = "var(--accent2, #a78bfa)";

    label.appendChild(muteBtn);
    label.appendChild(soloBtn);
    label.appendChild(nameSpan);

    const track = document.createElement("div");
    track.className = "midi-timeline-track";

    const chSegs = timeline.segments.filter(s => s.channel === ch);
    for (const seg of chSegs) {
      const bar = document.createElement("div");
      bar.className = "midi-timeline-bar";
      const leftPct = (seg.startTick / totalTicks) * 100;
      const widthPct = ((seg.endTick - seg.startTick) / totalTicks) * 100;
      bar.style.left = `${leftPct}%`;
      bar.style.width = `${Math.max(0.5, widthPct)}%`;
      bar.style.background = getColor(seg);
      
      // Ambil nama GM berdasarkan program
      const gmName = GM_MELODIC_NAMES[seg.program] || t("unknown_instrument", { program: seg.program });
      
      bar.title =
        t("timeline_tooltip_channel", { channel: seg.channel }) + 
        (seg.isDrum ? ` ${t("timeline_tooltip_drum")}` : "") + `\n` +
        t("timeline_tooltip_program", { program: seg.program }) + `\n` +
        t("timeline_tooltip_instrument", { name: gmName }) + `\n` +
        t("timeline_tooltip_bank", { bank: seg.bank }) + `\n` +
        t("timeline_tooltip_tick", { 
          start: seg.startTick.toLocaleString(), 
          end: seg.endTick.toLocaleString() 
        });
      
      if (widthPct > 2) bar.textContent = String(seg.program);
      
      bar.addEventListener("click", (e) => {
        e.stopPropagation(); // Cegah event bocor ke parent
        selectPatchFromTimeline(seg);
      });
      track.appendChild(bar);
    }

    row.appendChild(label);
    row.appendChild(track);
    container.appendChild(row);
  }

  refreshMuteSoloButtons();
  updateTimelineMutedVisuals();

  timelinePlayheadEl = document.createElement("div");
  timelinePlayheadEl.className = "midi-timeline-playhead";
  container.appendChild(timelinePlayheadEl);

  // Di akhir openMidiTimelineDialog, setelah dialog.hidden = false;

  dialog.hidden = false;

  updateTimelinePlayButton();

  // ⬇️ TAMBAHKAN INI UNTUK SINKRONISASI AWAL ⬇️
  const curPct = midiProgress.duration > 0 ? (midiProgress.current / midiProgress.duration) * 1000 : 0;
  $("timelineSeek").value = curPct;
  // ⬆️ -------------------------------------- ⬆️

  requestAnimationFrame(() => {
    updateTimelinePlayhead(getPlayheadTick());
  });
  
}

function selectPatchFromTimeline(seg) {
  if (!state.currentProjectId) {
    showAlert("midi_timeline_no_project");
    return;
  }
  const project = state.projects.find(p => p.id === state.currentProjectId);
  if (!project) {
    showAlert("midi_timeline_no_project");
    return;
  }
  const patches = getProjectPatches(project);

  let target = null;

  if (seg.isDrum) {
    const drumPatches = patches.filter(p =>
      (p.gmBank ?? 0) === 128 && (p.targetBank ?? 0) === seg.bank
    );
    if (drumPatches.length > 0) {
      target = drumPatches.find(p => p.gmProgram === seg.program) || drumPatches[0];
    }
  } else {
    target = patches.find(p => {
      if ((p.gmBank ?? 0) === 128) return false;
      if ((p.gmProgram ?? -1) !== seg.program) return false;
      return (p.targetBank ?? 0) === seg.bank;
    });
  }

  if (target) {
    closeMidiTimelineDialog();
    selectPatch(target.id);
    setTimeout(() => {
      const activeLi = document.querySelector("#patchList .li.active");
      if (activeLi) activeLi.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  } else {
    // Tampilkan alert dialog agar user sadar kenapa tidak ada yang terjadi
    showAlert("midi_timeline_patch_not_found", {
      program: seg.program, bank: seg.bank, channel: seg.channel
    });
  }
}

function closeMidiTimelineDialog() {
  const dialog = $("midiTimelineDialog");
  if (dialog) dialog.hidden = true;
  timelinePlayheadEl = null; // Hapus referensi
}

function getPlayheadTick() {
  // 1. Coba ambil dari engine TiMidity
  if (timidityPlayer && typeof timidityPlayer.getCurrentTick === 'function') {
    try {
      const t = timidityPlayer.getCurrentTick();
      if (typeof t === 'number' && !isNaN(t) && isFinite(t) && t > 0) {
        return t;
      }
    } catch (e) { /* Abaikan jika player belum siap */ }
  }

  // 2. Fallback: Estimasi dari waktu (jika engine gagal)
  if (midiProgress.duration > 0 && timelineTotalTicks > 0) {
    const pct = Math.max(0, Math.min(1, midiProgress.current / midiProgress.duration));
    return pct * timelineTotalTicks;
  }
  
  return 0;
}

/**
 * Seek ke posisi tick tertentu menggunakan API goTo() dari player.
 * Tick → posisi audio dan UI, tanpa konversi ke detik untuk seek-nya.
 * @param {number} tick - Posisi tick absolut pada MIDI saat ini
 */
function seekToTick(tick) {
  if (!state.midiData || !timelineTotalTicks) return;

  const clampedTick = Math.max(0, Math.min(timelineTotalTicks, Math.round(tick)));
  const pct = clampedTick / timelineTotalTicks;

  // Perkiraan waktu HANYA untuk sinkronisasi UI (bukan untuk seek audio).
  const approxTime = pct * midiProgress.duration;

  midiProgress.current = approxTime;
  midiProgress.startTime = performance.now() - (approxTime * 1000);

  const sliderValue = Math.floor(pct * 1000);
  if ($("midiSeek")) $("midiSeek").value = sliderValue;
  if ($("timelineSeek")) $("timelineSeek").value = sliderValue;

  updateTimelinePlayhead(clampedTick);
  updateMidiUI();

  // Seek audio via goTo(ticks) — tanpa konversi ke detik
  if (timidityPlayer && typeof timidityPlayer.goTo === "function") {
    try {
      timidityPlayer.goTo(clampedTick);
      // ─── Reapply setelah seek (file mungkin menimpa CC 7) ───
      scheduleMuteReapply();
    } catch (err) {
      console.warn("TiMidity goTo failed:", err);
    }
  }
}

/**
 * Memperbarui posisi playhead berdasarkan tick saat ini.
 * @param {number} tick - Posisi tick absolut dari timidityPlayer
 */
function updateTimelinePlayhead(tick) {
  
  if (!timelinePlayheadEl || !timelineTotalTicks) return;
  
  if (typeof tick !== 'number' || isNaN(tick)) tick = 0;
  const pct = Math.max(0, Math.min(1, tick / timelineTotalTicks));

  const trackEl = document.querySelector(".midi-timeline-track");
  if (!trackEl) return;

  // Gunakan offsetWidth & offsetLeft agar akurat meski modal baru dibuka
  const trackWidth = trackEl.offsetWidth;
  const offsetLeft = trackEl.offsetLeft - 7;

  // Jika lebar 0 (modal belum dirender sempurna), jangan hitung dulu
  if (trackWidth === 0) return;

  const x = offsetLeft + (trackWidth * pct);
  
  timelinePlayheadEl.style.display = "block";
  timelinePlayheadEl.style.transform = `translateX(${x}px)`;
}

/**
 * Dipanggil saat user klik bar di timeline. Mencari patch di proyek aktif
 * yang cocok dengan (isDrum, program, bank) pada segmen, lalu memilihnya.
 */
function selectPatchFromTimeline(seg) {
  if (!state.currentProjectId) return;
  const project = state.projects.find(p => p.id === state.currentProjectId);
  if (!project) return;
  const patches = getProjectPatches(project);


  if (seg.isDrum) {
    // Drum: patch dikunci per note (35..81), jadi pencocokan program
    // tidak cocok. Cari kit berdasarkan targetBank.
    const drumPatches = patches.filter(p =>
      (p.gmBank ?? 0) === 128 && (p.targetBank ?? 0) === seg.bank
    );
    if (drumPatches.length === 0) {
      showStatus(t("midi_timeline_drum_kit_not_found", { bank: seg.bank }), "bad");
      return;
    }
    // Prioritaskan patch dengan gmProgram = program (jarang, tapi mungkin),
    // jika tidak ada, ambil patch pertama dari kit tersebut.
    const match = drumPatches.find(p => p.gmProgram === seg.program) || drumPatches[0];
    selectPatch(match.id);
    closeMidiTimelineDialog();
    setTimeout(() => {
      const activeLi = document.querySelector("#patchList .li.active");
      if (activeLi) activeLi.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
    return;
  }

  // Melodic: match by program + bank
  const target = patches.find(p => {
    if ((p.gmBank ?? 0) === 128) return false;
    if ((p.gmProgram ?? -1) !== seg.program) return false;
    return (p.targetBank ?? 0) === seg.bank;
  });

  if (target) {
    selectPatch(target.id);
    closeMidiTimelineDialog();
    setTimeout(() => {
      const activeLi = document.querySelector("#patchList .li.active");
      if (activeLi) activeLi.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  } else {
    showStatus(t("midi_timeline_patch_not_found", {
      program: seg.program, bank: seg.bank, channel: seg.channel
    }), "bad");
  }
}

function populateMidiUsedPatchesFromScan() {
  if (!state.midiData || !state.currentProjectId) return;
  const project = state.projects.find(p => p.id === state.currentProjectId);
  if (!project) return;
  const patches = getProjectPatches(project);
  if (patches.length === 0) return;

  const used = getUsedMidiPrograms(state.midiData);
  for (const key of used) {
    const [bankStr, programStr, isDrumStr] = key.split(":");
    const bank    = parseInt(bankStr, 10);
    const program = parseInt(programStr, 10);
    const isDrum  = isDrumStr === "1";

    const target = patches.find(p =>
      isDrum
        ? (p.gmBank === 128 && p.gmProgram === program && (p.targetBank ?? 0) === bank)
        : ((p.targetBank ?? 0) === bank && (p.gmProgram ?? -1) === program)
    );
    if (target) state.midiUsedPatches.set(target.id, target);
  }
  scheduleMidiUsedPatchesRerender();
}

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

function updateTimelinePlayButton() {
  const btn = $("btnTimelinePlay");
  if (!btn) return;
  
  if (midiProgress.playing) {
    btn.innerHTML = `<svg class="icon"><use href="#i-pause"></use></svg>`;
  } else {
    btn.innerHTML = `<svg class="icon"><use href="#i-play"></use></svg>`;
  }
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
      if ($("timelineSeek")) $("timelineSeek").value = 0;
    } else {
      const pct = Math.floor((cur / dur) * 1000);
      $("midiSeek").value = pct;
      if ($("timelineSeek")) $("timelineSeek").value = pct;
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

/* ---------- Mute / Solo Helper ---------- */
function isMidiChannelAudible(ch) {
  const anySolo = midiChannelSolo.some(v => v);
  if (anySolo) return midiChannelSolo[ch];
  return !midiChannelMute[ch];
}

function applyMidiMuteSolo() {
  if (!timidityPlayer || !state.midiData) return;
  try {
    for (let ch = 0; ch < 16; ch++) {
      timidityPlayer.setChannelMute(ch, !isMidiChannelAudible(ch));
    }
  } catch (err) {
    console.warn("[Mute/Solo] setChannelMute gagal:", err);
  }
}

/** Debounce — hindari spam saat user drag slider/seek cepat. */
function scheduleMuteReapply() {
  if (muteReapplyTimer) clearTimeout(muteReapplyTimer);
  muteReapplyTimer = setTimeout(() => {
    muteReapplyTimer = null;
    applyMidiMuteSolo();
  }, 60);
}

/** Debounce — hindari spam CC 7 saat user drag slider/seek cepat. */
function scheduleMuteReapply() {
  if (muteReapplyTimer) clearTimeout(muteReapplyTimer);
  muteReapplyTimer = setTimeout(() => {
    muteReapplyTimer = null;
    applyMidiMuteSolo();
  }, 60);
}

function refreshMuteSoloButtons() {
  for (let ch = 0; ch < 16; ch++) {
    const mBtn = midiChannelMuteBtnRefs[ch];
    const sBtn = midiChannelSoloBtnRefs[ch];
    if (mBtn) {
      const on = midiChannelMute[ch];
      mBtn.style.background  = on ? "#dc2626" : "var(--bg2, #1e293b)";
      mBtn.style.color       = on ? "#ffffff" : "var(--dim, #94a3b8)";
      mBtn.style.borderColor = on ? "#dc2626" : "var(--border, #334155)";
    }
    if (sBtn) {
      const on = midiChannelSolo[ch];
      sBtn.style.background  = on ? "#eab308" : "var(--bg2, #1e293b)";
      sBtn.style.color       = on ? "#000000" : "var(--dim, #94a3b8)";
      sBtn.style.borderColor = on ? "#eab308" : "var(--border, #334155)";
    }
  }
}

function updateTimelineMutedVisuals() {
  document.querySelectorAll(".midi-timeline-row[data-channel]").forEach(row => {
    const ch = parseInt(row.dataset.channel, 10);
    if (isNaN(ch)) return;
    row.style.opacity = isMidiChannelAudible(ch) ? "" : "0.35";
  });
}

function togglePauseMidi() {
  if (!state.midiData) return;
  if (midiProgress.playing) {
    // Aksi Pause
    midiProgress.playing = false;
    midiProgress.paused = true;
    timidityPlayer.stop();
    cancelAnimationFrame(midiProgress.raf);
    
    const btn = $("btnPlayMidi");
    btn.innerHTML = `<svg class="icon"><use href="#i-play"></use></svg> ${t("play")}`;
    btn.classList.remove("danger"); // Keep primary class
    btn.classList.add("primary");
    setMidiStatus("midi_paused");
    updateTimelinePlayButton(); // <-- Tambahkan ini
  } else if (midiProgress.paused) {
    // Aksi Resume
    playMidi(midiProgress.current);
  }
}

async function playMidi(fromTime = 0) {
  if (!state.midiData) return;
  if (typeof fromTime !== 'number') fromTime = 0;

  try {
    await ensureTimidityPlayer();
    setMidiStatus("midi_loading_patch");

    midiProgress.playing = true;
    midiProgress.paused = false;
    midiProgress.current = fromTime;

    populateMidiUsedPatchesFromScan();

    if (timidityPlayer) timidityPlayer.stop();
    await timidityPlayer.loadAndPlay(state.midiData, fromTime);

    if (timidityPlayer) timidityPlayer.stop();
    await timidityPlayer.loadAndPlay(state.midiData, fromTime);

    // ─── Reapply mute/solo setelah patch dimuat ───
    applyMidiMuteSolo();

    // ═══════════════════════════════════════════════════════════════
    // Clock UI dimulai SETELAH loadAndPlay selesai.
    // Patch loading (1–3 detik) tidak lagi membuat timer berjalan
    // "di depan" audio. Inilah penyebab utama lagu terpotong.
    // ═══════════════════════════════════════════════════════════════
    midiProgress.startTime = performance.now() - (fromTime * 1000);

    setMidiStatus("midi_playing");

    updateTimelinePlayButton(); 

    $("btnPlayMidi").disabled = false;
    $("btnPlayMidi").innerHTML = `<svg class="icon"><use href="#i-pause"></use></svg> ${t("pause")}`;
    $("btnStopMidi").disabled = false;
    $("midiSeek").disabled = false;

    cancelAnimationFrame(midiProgress.raf);
    const tick = () => {
      if (!midiProgress.playing) return;

      const elapsed = (performance.now() - midiProgress.startTime) / 1000;
      midiProgress.current = Math.min(elapsed, midiProgress.duration);

      // ⬇️ PASTIKAN BARIS INI ADA ⬇️
      updateTimelinePlayhead(getPlayheadTick());

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

  updateTimelinePlayhead(0);
  
  
  $("btnPlayMidi").disabled = false;
  // PERBAIKAN: Kembalikan ikon play
  $("btnPlayMidi").innerHTML = `<svg class="icon"><use href="#i-play"></use></svg> ${t("play")}`;
  $("btnStopMidi").disabled = true;
  setMidiStatus("midi_stopped");
  updateTimelinePlayButton(); // <-- Tambahkan ini
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
  const list = $("exportBanksList");
  list.innerHTML = "";
  
  const project = state.projects.find(p => p.id === state.currentProjectId);
  if (!project) return;
  
  const patches = getProjectPatchEntries();

  // 1. Kelompokkan HANYA berdasarkan Target Bank
  const groups = new Map();
  
  patches.forEach(p => {
    const targetBank = p.targetBank ?? 0;
    
    if (!groups.has(targetBank)) {
      groups.set(targetBank, {
        targetBank,
        patches: []
      });
    }
    groups.get(targetBank).patches.push(p);
  });

  // 2. Render tabel
  const sortedGroups = Array.from(groups.values()).sort((a, b) => {
    return a.targetBank - b.targetBank;
  });

  sortedGroups.forEach(group => {
    const allSelected = group.patches.every(p => p.exportSelected !== false);
    
    const tr = document.createElement("tr");
    // Kolom Tipe dihilangkan dari template
    tr.innerHTML = `
      <td class="text-center">
        <input type="checkbox" class="export-group-checkbox" ${allSelected ? 'checked' : ''}>
      </td>
      <td class="text-dim">
        ${group.targetBank}
      </td>
      <td class="text-dim">
        ${group.patches.length} patch
      </td>
      <td>
        <input type="number" class="export-group-target export-target-input" min="0" max="999" value="${group.targetBank}">
      </td>
    `;

    // Event: Checkbox Group
    const cb = tr.querySelector(".export-group-checkbox");
    cb.addEventListener("change", (e) => {
      const checked = e.target.checked;
      group.patches.forEach(p => {
        p.exportSelected = checked;
        scheduleBankConfigSave(p);
      });
      updateExportSelectAll();
      renderBankManager(); 
    });

    // Event: Target Bank Group
    const inputTarget = tr.querySelector(".export-group-target");
    inputTarget.addEventListener("change", (e) => {
      const newTarget = clamp(parseInt(e.target.value, 10) || 0, 0, 999);
      e.target.value = newTarget;
      
      group.patches.forEach(p => {
        p.targetBank = newTarget;
        scheduleBankConfigSave(p);
      });
      
      openExportBanksDialog(); 
      renderBankManager();
      renderLibrary();
    });

    list.appendChild(tr);
  });

  // Handle Select All
  $("exportSelectAll").checked = patches.length > 0 && patches.every(p => p.exportSelected !== false);
  $("exportSelectAll").onchange = (e) => {
    const checked = e.target.checked;
    list.querySelectorAll(".export-group-checkbox").forEach(cb => cb.checked = checked);
    patches.forEach(p => {
      p.exportSelected = checked;
      scheduleBankConfigSave(p);
    });
    renderBankManager();
  };

  $("exportBanksDialog").hidden = false;
  $("btnConfirmExportBanks").focus();
}

function updateExportSelectAll() {
  const list = $("exportBanksList");
  const allCheckboxes = list.querySelectorAll(".export-checkbox");
  const checkedCheckboxes = list.querySelectorAll(".export-checkbox:checked");
  $("exportSelectAll").checked = allCheckboxes.length > 0 && allCheckboxes.length === checkedCheckboxes.length;
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

      // Gunakan getPatchDisplayName untuk mengambil nama paling baru
      const exportName = getPatchDisplayName(entry.patch, entry.name);
      const programNum = (entry.gmProgram >= 0 && entry.gmProgram <= 127) ? entry.gmProgram : 0;
      const programPrefix = String(programNum).padStart(3, "0");
      
      let filename = `${programPrefix}_${sanitizeFilename(exportName)}.pat`;

      // ======================================

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
      patchName: getPatchDisplayName(zf.entry.patch, zf.entry.name),
      gmBank: zf.entry.gmBank ?? 0,
      gmProgram: zf.entry.gmProgram ?? -1,
      drumSet: zf.entry.drumSet,
      description: zf.entry.patch.header.description || ""
    }));
    zipFiles.push({
      name: "manifest.json",
      data: new TextEncoder().encode(JSON.stringify(manifestData, null, 2))
    });

    zipFiles.push({
      name: "timidity.cfg",
      // HAPUS drumSetMap dan bankMap dari sini
      data: new TextEncoder().encode(generateProjectTimidityCfgForZip(project, patchPaths, patches))
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
let lastBank = 0;
function openBankSelectDialog() {
  const banks = getAvailableBanks();
  const list = $("bankSelectList");
  const statusEl = $("bankLoadingStatus");
  
  list.innerHTML = "";
  if (currentBankStatusElement === statusEl) {
    currentBankStatusElement = null;
    currentBankStatusTranslation = null;
  }
  statusEl.style.display = "none";
  statusEl.textContent = "";
  isLoadingBank = false;

  banks.forEach(bank => {
    const patches = getPatchesForBank(bank);
    const totalSize = patches.reduce((acc, p) => acc + getPatchSize(p), 0);
    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    
    // Deteksi patch rusak: Anggap < 1024 byte sebagai file kosong/rusak
    const brokenPatches = patches.filter(p => getPatchSize(p) < MIN_PAT_SIZE);
    const hasBrokenPatch = brokenPatches.length > 0;
    const brokenLabel = hasBrokenPatch
      ? `<span data-bank-broken-count="${brokenPatches.length}">${t("broken_patch_count", {count: brokenPatches.length})}</span>`
      : "";
    const patchCount = t(patches.length === 1 ? "patch_count_one" : "patch_count_many", {count: patches.length});

    const d = document.createElement("div");
    d.className = "li" + (bank === currentBank ? " active" : "");
    
    d.innerHTML = `
      <div class="bank-item-row ${hasBrokenPatch ? 'bank-item-broken-row' : ''}">
        <span class="name ${hasBrokenPatch ? 'bank-broken' : ''}">Bank ${bank} ${hasBrokenPatch ? `⚠️ (${brokenLabel})` : ""}</span>
        <div class="bank-item-actions">
          <span class="bank-item-info"><span data-bank-patch-count="${patches.length}">${patchCount}</span> (${sizeMB} MB)</span>
          <button class="icon-btn bank-info-btn" data-bank="${bank}" data-i18n-title="view_bank_details" title="${t("view_bank_details")}">
            <svg class="icon"><use href="#i-folder"></use></svg>
          </button>
        </div>
      </div>
    `;
    localizeElement(d.querySelector(".bank-info-btn"));
    
    d.onclick = (e) => {
      applyBankToPlayer(bank);   // ini yang men-set currentBank
      list.querySelectorAll(".li").forEach(el => el.classList.remove("active"));
      d.classList.add("active");
    };

    d.querySelector('button').onclick = (e) => {
      e.stopPropagation();
      openBankBreakdownDialog(bank, patches);
    };
    
    list.appendChild(d);
  });
  
  $("bankSelectDialog").hidden = false;
}

const MIN_PAT_SIZE = 100;

function openBankBreakdownDialog(bank, patches) {
  const list = $("bankBreakdownList");
  list.innerHTML = "";
  
  // Urutkan: Patch rusak (paling atas), lalu sisanya berdasarkan ukuran terbesar
  const sorted = [...patches].sort((a, b) => {
    const aBroken = getPatchSize(a) < MIN_PAT_SIZE;
    const bBroken = getPatchSize(b) < MIN_PAT_SIZE;
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
      state.midiUsedPatches.delete(patchId);
    };

    list.appendChild(row);
  });

  $("bankBreakdownDialog").hidden = false;
}

function isPatchBroken(p) {
  if (!p || !p.patch || !p.patch.instruments) return true;
  return getPatchSize(p) < MIN_PAT_SIZE;
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
        closeBankSelectDialog(false);
      } else {
        // Render ulang modal breakdown dengan list terbaru
        openBankBreakdownDialog(currentBank, remainingPatches);
        // Render ulang modal pemilihan bank di belakangnya agar tanda merah hilang jika sudah aman
        openBankSelectDialog(); 
      }
      
      showStatus(t("patch_deleted"), "ok");
      
    } catch (err) {
      console.error("Gagal menghapus patch:", err);
      showStatus(t("patch_delete_failed"), "bad");
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

let applyBankGeneration = 0;

/**
 * Ganti bank instrumen secara real-time pada semua channel MIDI
 * tanpa menghentikan playback.
 *
 * @param {number} bank - Target bank number yang akan diterapkan.
 */
async function applyBankToPlayer(bank) {
  // Gunakan generation untuk mencegah race condition jika dipanggil cepat
  const generation = ++applyBankGeneration;

  // 1. Set state global
  currentBank = bank;

  // 2. Pastikan player sudah siap. Jika belum, inisialisasi.
  //    (init hanya terjadi sekali; pemanggilan berikutnya akan return early)
  await ensureTimidityPlayer();

  // Cek apakah ada panggilan yang lebih baru yang menggantikan kita
  if (generation !== applyBankGeneration) return;

  applyMidiMuteSolo();

  // Jika tidak ada MIDI yang sedang dimuat/diputar, tidak ada yang perlu di-swap.
  if (!state.midiData) {
    showStatus(t("bank_ready", { bank }), "ok");
    return;
  }

  showStatus(t("bank_loading_simple", { bank }), "ok");

  try {

    // 3. Iterasi semua 16 channel MIDI
    for (let ch = 0; ch < 16; ch++) {
      // tick terus berjalan karena proses secara keseluruhan mungkin memerlukan waktu cukup lama
      const tick = timidityPlayer.getCurrentTick();
      // Dapatkan program yang aktif pada channel ini di tick saat ini
      const program = timidityPlayer.getProgram(ch, tick);

      // -1 berarti tidak ada program change yang valid untuk channel ini.
      // Lewati channel tanpa program.
      if (program === -1) continue;

      // 4. Muat instrumen baru ke engine untuk channel ini.
      //    Karena instrumentLoader kita sudah menggunakan 'bank' dari argumen,
      //    patch yang benar akan diambil dan di-cache.
      await timidityPlayer.loadInstrumentForSong(ch, program, bank);

      // 5. Kirim event bank & program agar engine langsung menerapkan
      //    instrumen baru pada playback yang sedang berjalan.
      timidityPlayer.sendEvent(timidityPlayer.ME_TONE_BANK, ch, bank);
      timidityPlayer.sendEvent(timidityPlayer.ME_PROGRAM, ch, program);
    }

    // Cek lagi apakah kita masih relevan setelah semua proses async
    if (generation !== applyBankGeneration) return;

    showStatus(t("bank_ready", { bank }), "ok");
  } catch (err) {
    if (generation !== applyBankGeneration) return;
    console.error("applyBankToPlayer error:", err);
    showStatus(t("timidity_error", { message: err.message }), "bad");
  }
}


function closeBankSelectDialog(rollback = false) {
  if (rollback) {
    // Cancel: kembalikan ke bank yang terakhir dikonfirmasi via OK
    currentBank = lastBank;
    applyBankToPlayer(currentBank);
  } else {
    // OK: simpan bank saat ini sebagai "bank terakhir yang dikonfirmasi"
    // agar Cancel berikutnya bisa rollback ke sini.
    lastBank = currentBank;
  }
  $("bankSelectDialog").hidden = true;
}

function applyBankToPlayerAsync(bank, statusEl, patches) {
  if (!timidityPlayer) return;
  
  isLoadingBank = true;
  if (bankSwitchTimer) clearTimeout(bankSwitchTimer);
  
  statusEl.style.display = "block";
  statusEl.style.color = "var(--accent)";
  setBankStatus(statusEl, "bank_loading", {
    bank,
    patches: patches.length
  });

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
        setBankStatus(statusEl, "bank_loaded_success", {bank});
        
        if (heavyPatches.length > 0) {
          statusEl.style.color = "var(--bad)"; // Warna merah/kuning
          setBankStatus(statusEl, "bank_large_patch_warning", {
            patches: heavyPatches.map(p => p.name).join(", ")
          });
        }
        return;
      }
      
      try {
        timidityPlayer.sendEvent(ME_TONE_BANK, ch, bank, 0);
      } catch (e) {
        console.warn("Error applying bank to channel", ch, e);
        statusEl.style.color = "var(--bad)";
        setBankStatus(statusEl, "bank_channel_load_failed", {channel: ch});
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
    let optionsHtml = `<option value="all">${t("all_banks")}</option>`;
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


  // === FITUR FILTER TIPE (BARU) ===
  const typeFilterSelect = $("libraryTypeFilter");
  if (typeFilterSelect) {
    typeFilterSelect.value = state.libraryTypeFilter;
  }
  if (state.libraryTypeFilter !== "all") {
    const isDrumFilter = state.libraryTypeFilter === "drum";
    displayPatches = displayPatches.filter(p => {
      const pIsDrum = (p.gmBank ?? 0) === 128;
      return pIsDrum === isDrumFilter;
    });
  }
  // ================================

  // === FITUR FILTER NAMA (BARU) ===
  const nameFilterInput = $("libraryNameFilter");
  if (nameFilterInput) {
    nameFilterInput.value = state.libraryNameFilter;
  }
  if (state.libraryNameFilter && state.libraryNameFilter.trim() !== "") {
    const searchStr = state.libraryNameFilter.toLowerCase().trim();
    displayPatches = displayPatches.filter(p => {
      const patchName = (p.name || "").toLowerCase();
      const patchDesc = (p.patch?.header?.description || "").toLowerCase();
      return patchName.includes(searchStr) || patchDesc.includes(searchStr);
    });
  }
  // ================================

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
  let listCount = 0;
  list.innerHTML = "";
  $("libCount").textContent = displayPatches.length;
  const showAll = state.libraryView === "all";
  $("btnLibraryScope").textContent = t(showAll ? "show_project_library" : "show_all_library");
  $("btnLibraryScope").disabled = !state.currentProjectId;

  if (displayPatches.length === 0) {
    list.innerHTML = `<div style="padding:6px;color:var(--dim);font-size:11px;text-align:center">${t("no_patch")}</div>`;
    $("libraryCountLabel").textContent = t("list_cont_label", {count: 0});
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
    listCount++;
  });

  $("libraryCountLabel").textContent = t("list_cont_label", {count: listCount});


}

function selectProject(projectId) {
  if (isMidiRendering) return;
  const project = state.projects.find(entry => entry.id === projectId);
  if (!project) return;

  const wasPlaying = midiProgress.playing;
  const wasPaused = midiProgress.paused;
  const resumeTime = midiProgress.current;

  state.currentProjectId = project.id;
  currentBank = null;               // ← reset filter saat ganti proyek
  state.libraryView = "project";
  invalidateTimidityPlayer();
  renderProjects();
  renderLibrary();
  renderBankManager();

  // Reset daftar hanya jika MIDI sedang diputar (atau dijeda)
  if (state.midiData && (wasPlaying || wasPaused)) {
    resetMidiUsedPatches();
  }

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
    $("btnExportProjectSf2").disabled = true;
    return;
  }
  state.projects.forEach(proj => {
    const d = document.createElement("div");
    d.className = "li" + (proj.id === state.currentProjectId ? " active" : "");
    const patchCount = proj.patchIds.length;

    const metaParts = [
      t(patchCount === 1 ? "patch_count_one" : "patch_count_many", { count: patchCount })
    ];
    // if (proj.author) metaParts.push(proj.author);
    const metaText = metaParts.join(" · ");

    const displayName = proj.locale ? t("recovered_library_project") : proj.name;

    d.innerHTML = `
      <span class="name"${proj.locale ? ` data-i18n-content="recovered_library_project"` : ""}
            title="${escapeHtml(proj.name || "")}">${escapeHtml(displayName || "")}</span>
      <span class="meta">${escapeHtml(metaText)}</span>
      <span class="tools">
        <button class="icon-btn" data-act="edit"
                title="${t("edit_project_properties")}"
                aria-label="${t("edit_project_properties")}">
          <svg class="icon"><use href="#i-pencil"></use></svg>
        </button>
        <button class="icon-btn" data-act="export"
                title="${t("export_project_zip")}">
          <svg class="icon"><use href="#i-download"></use></svg>
        </button>
        <button class="icon-btn danger" data-act="delete"
                title="${t("delete")}">
          <svg class="icon"><use href="#i-close"></use></svg>
        </button>
      </span>`;

    d.addEventListener("click", ev => {
      if (isMidiRendering) return;
      const btn = ev.target.closest("button");
      if (btn) {
        ev.stopPropagation();
        if (btn.dataset.act === "edit")       openProjectPropertiesDialog(proj.id);
        else if (btn.dataset.act === "export") exportProject(proj.id);
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
  $("btnExportProjectSf2").disabled = !hasActive;
}

function render(save=true){
  const has=!!state.patch;
  $("welcome").hidden=has; $("workspace").hidden=!has; $("btnSave").disabled=!has;
  $("btnExportInst").disabled=!has;
  renderLibrary();
  renderProjects();
  renderBankManager();
  
  if(!has){
    state.selInst = 0;
    state.selSample = null;
    state.selStart = state.selEnd = 0;
    state.undo = [];

    const il = $("instrumentList");
    if (il) il.innerHTML = "";

    const sl = $("sampleList");
    if (sl) sl.innerHTML = "";

    const se = $("sampleEditor");
    if (se) se.hidden = true;

    // Info patch di sidebar
    $("patchNameSide").textContent = "—";
    $("statInst").textContent = "0";
    $("statSamples").textContent = "0";
    $("statVoices").textContent = "—";
    $("statVol").textContent = "—";

    // Judul section instrument & pill
    const instTitle = $("instTitle");
    if (instTitle) instTitle.textContent = t("instruments");
    const instPill = $("instPill");
    if (instPill) instPill.textContent = "—";
    const scp = $("sampleCountPill");
    if (scp) scp.textContent = "0";

    $("footerInfo").textContent = "";
    return;
  }

  const p=state.patch, samples=allSamples();
  const currentEntry = state.patches.find(p=>p.id===state.currentPatchId);
  $("patchNameSide").textContent = currentEntry?.name || p.header.description || t("unnamed");
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
    
    // Tambahkan baris ini untuk mendapatkan nama pitch
    const pitchRangeText = `${freqToNoteName(s.lowFreq)} - ${freqToNoteName(s.highFreq)}`;

    const d=document.createElement("div");
    d.className="sc"+(state.selSample===s?" active":"");
    d.innerHTML=`
      <div class="n">${escapeHtml(s.name||t("unnamed"))}</div>
      <div class="m">
        <span class="tag">${fmt(s).is16?"16-bit":"8-bit"}</span>
        <span class="tag">${(s.sampleRate||0).toLocaleString()} Hz</span>
        <span class="tag">${t(n === 1 ? "sample_count_one" : "sample_count_many", {count: n.toLocaleString()})}</span>
        <span class="tag" style="color: var(--accent2); border-color: rgba(167,139,250,0.4);">${pitchRangeText}</span>
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

function freqToNoteName(freq) {
  if (!freq || freq <= 0) return "—";
  const hz = freq / 1000;
  // Konversi Hz ke MIDI Note Number (A4 = 69 = 440Hz)
  const midiNote = Math.round(69 + 12 * Math.log2(hz / 440));
  
  // Batasi note antara 0-127 (standar MIDI)
  const safeNote = Math.max(0, Math.min(127, midiNote));
  
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const noteName = noteNames[safeNote % 12];
  const octave = Math.floor(safeNote / 12) - 1;
  
  return `${noteName}${octave}`;
}

function openFreqMapDialog() {
  if (!state.patch || !state.patch.instruments[state.selInst]) return;
  
  const inst = state.patch.instruments[state.selInst];
  const samples = [];
  inst.layers.forEach(layer => layer.samples.forEach(s => samples.push(s)));
  
  if (samples.length === 0) return;

  let minFreq = Infinity;
  let maxFreq = -Infinity;

  samples.forEach(s => {
    const lo = s.lowFreq > 0 ? s.lowFreq : 1000; 
    const hi = s.highFreq > 0 ? s.highFreq : 20000000;
    
    if (lo < minFreq) minFreq = lo;
    if (hi > maxFreq) maxFreq = hi;
  });

  const logMin = Math.log2(Math.max(1, minFreq));
  const logMax = Math.log2(Math.max(logMin + 1, maxFreq));
  const range = logMax - logMin;

  const container = $("freqMapContainer");
  container.innerHTML = "";

  samples.forEach(s => {
    const row = document.createElement("div");
    row.className = "freq-map-row";
    row.style.cursor = "pointer";

    const lo = s.lowFreq > 0 ? s.lowFreq : 1000;
    const hi = s.highFreq > 0 ? s.highFreq : 20000000;
    
    const logLo = Math.log2(Math.max(1, lo));
    const logHi = Math.log2(Math.max(logLo + 1, hi));

    const leftPercent = ((logLo - logMin) / range) * 100;
    const widthPercent = ((logHi - logLo) / range) * 100;

    const pitchRange = document.createElement("span");
    pitchRange.className = "freq-label";
    pitchRange.textContent = `${freqToNoteName(lo)} - ${freqToNoteName(hi)}`;

    const barWrapper = document.createElement("div");
    barWrapper.className = "freq-bar-wrapper";

    const bar = document.createElement("div");
    bar.className = "freq-map-bar";
    bar.style.left = Math.max(0, leftPercent) + "%";
    bar.style.width = Math.max(1, widthPercent) + "%";
    
    bar.textContent = s.name || "SMP";
    
    // --- LOKALISASI TOOLTIP ---
    bar.title = `${t("freq_map_sample")}: ${s.name}\n${t("freq_map_low_freq")}: ${lo.toLocaleString()} mHz\n${t("freq_map_high_freq")}: ${hi.toLocaleString()} mHz\n${t("freq_map_root_freq")}: ${s.rootFreq.toLocaleString()} mHz\n\n${t("freq_map_click_to_select")}`;
    // ---------------------------

    // --- EVENT CLICK UNTUK MEMILIH SAMPEL ---
    row.onclick = () => {
      $("freqMapDialog").hidden = true;
      
      state.selSample = s; 
      state.selStart = state.selEnd = 0; 
      state.undo = [];
      state.zoom = 1; 
      state.offset = 0; 
      updateZoomUI();
      
      render();

      setTimeout(() => {
        const activeCard = document.querySelector('.sc.active');
        if (activeCard) activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    };

    barWrapper.appendChild(bar);
    row.appendChild(pitchRange);
    row.appendChild(barWrapper);
    container.appendChild(row);
  });

  $("freqMapDialog").hidden = false;
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

/* ---------- ZIP Reader & TiMidity CFG Parser ---------- */

async function readZip(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const bytes = new Uint8Array(arrayBuffer);
  let eocdOffset = -1;
  
  // Cari End of Central Directory (EOCD)
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i; break;
    }
  }
  if (eocdOffset === -1) throw new Error("Invalid zip format");

  const cdEntries = view.getUint16(eocdOffset + 10, true);
  let cdOffset = view.getUint32(eocdOffset + 16, true);
  const files = new Map();

  for (let i = 0; i < cdEntries; i++) {
    if (view.getUint32(cdOffset, true) !== 0x02014b50) break;
    const method = view.getUint16(cdOffset + 10, true);
    const compSize = view.getUint32(cdOffset + 20, true);
    const uncompSize = view.getUint32(cdOffset + 24, true);
    const nameLen = view.getUint16(cdOffset + 28, true);
    const extraLen = view.getUint16(cdOffset + 30, true);
    const commentLen = view.getUint16(cdOffset + 32, true);
    const localOffset = view.getUint32(cdOffset + 42, true);

    const nameBytes = bytes.slice(cdOffset + 46, cdOffset + 46 + nameLen);
    const name = new TextDecoder().decode(nameBytes);

    files.set(name, { method, compSize, uncompSize, localOffset, name });
    cdOffset += 46 + nameLen + extraLen + commentLen;
  }
  return { files, bytes, view };
}

async function extractFile(zip, file) {
  const { bytes, view } = zip;
  const off = file.localOffset;
  if (view.getUint32(off, true) !== 0x04034b50) throw new Error("Invalid zip header");
  const nameLen = view.getUint16(off + 26, true);
  const extraLen = view.getUint16(off + 28, true);
  const dataOffset = off + 30 + nameLen + extraLen;

  const compData = bytes.slice(dataOffset, dataOffset + file.compSize);

  if (file.method === 0) {
    return compData.buffer;
  } else if (file.method === 8) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error("Your browser does not support DecompressionStream (Deflate). Please use a modern browser.");
    }
    const ds = new DecompressionStream('deflate-raw');
    const stream = new Blob([compData]).stream().pipeThrough(ds);
    return await new Response(stream).arrayBuffer();
  }
  throw new Error("Unsupported ZIP compression method: " + file.method);
}

function normalizePath(p) {
  return p.replace(/^\/+/, '').replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\.\//, '');
}

/**
 * Ambil direktori dari path file di dalam ZIP (dengan trailing slash).
 * "timidity.cfg"        -> ""
 * "wrapper/timidity.cfg"-> "wrapper/"
 * "a/b/c/cfg.ini"       -> "a/b/c/"
 */
function zipDirname(path) {
  const norm = String(path).replace(/\\/g, '/');
  const idx = norm.lastIndexOf('/');
  return idx < 0 ? "" : norm.slice(0, idx + 1);
}

/**
 * Deteksi folder wrapper: bila root ZIP hanya berisi folder (tidak ada file
 * langsung di root) dan hanya ada satu folder top-level, kembalikan path
 * folder itu dengan trailing slash. Selain itu, kembalikan "".
 *
 * Ini menangani ZIP seperti:
 *   package/
 *     timidity.cfg
 *     piano.pat
 *
 * Jika root punya file (mis. timidity.cfg langsung di root), fungsi
 * mengembalikan "" karena tidak ada wrapper yang perlu ditembus.
 */
function detectWrapperFolder(zip) {
  const roots = new Set();
  let hasRootFile = false;

  for (const name of zip.files.keys()) {
    const parts = name.replace(/\\/g, '/').split('/').filter(Boolean);
    if (parts.length === 0) continue;

    if (parts.length === 1) {
      // Entry langsung di root — folder (trailing /) atau file?
      if (name.endsWith('/')) {
        roots.add(parts[0]);
      } else {
        hasRootFile = true;
      }
    } else {
      // Entry di dalam subfolder → parts[0] adalah folder top-level
      roots.add(parts[0]);
    }
  }

  if (hasRootFile) return "";
  if (roots.size === 1) return Array.from(roots)[0] + "/";
  return "";
}

function parseTimidityCfg(text) {
  const patches = [];
  let currentBank = null;
  let currentDrumSet = null;
  let currentDir = "";

  const lines = text.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    const dirMatch = line.match(/^dir\s+(.+)$/i);
    if (dirMatch) {
      currentDir = normalizePath(dirMatch[1]);
      if (currentDir && !currentDir.endsWith('/')) currentDir += '/';
      continue;
    }

    const bankMatch = line.match(/^bank\s+(\d+)$/i);
    if (bankMatch) {
      currentBank = parseInt(bankMatch[1], 10);
      currentDrumSet = null;
      continue;
    }

    const drumMatch = line.match(/^drumset\s+(\d+)$/i);
    if (drumMatch) {
      currentDrumSet = parseInt(drumMatch[1], 10);
      currentBank = null;
      continue;
    }

    const progMatch = line.match(/^(\d+)\s+(.+)$/);
    if (progMatch && (currentBank !== null || currentDrumSet !== null)) {
      const program = parseInt(progMatch[1], 10);
      let filename = progMatch[2].trim();
      
      let fullPath = normalizePath(filename);
      if (currentDir && !filename.startsWith('/')) {
        // PERBAIKAN: Bersihkan kembali path setelah digabung
        fullPath = normalizePath(currentDir + fullPath);
      }

      patches.push({
        program,
        filename: fullPath,
        isDrum: currentDrumSet !== null,
        targetBank: currentDrumSet !== null ? currentDrumSet : currentBank
      });
    }
  }
  return patches;
}

/**
 * Parse file ultramid.ini (UltraMID / GUS patch collection).
 *
 * Format per baris (CSV):
 *   <program>, <256K>, <512K>, <768K>, <1024K>, <name>
 *
 * Mapping program:
 *   0..127   -> melodic  (gmBank=0,   gmProgram=program)
 *   128      -> placeholder "blank", dilewati
 *   129..255 -> drum     (gmBank=128, gmProgram=program-128)
 *
 * Kolom remap ukuran library diabaikan — kita impor koleksi penuh.
 * Kolom `name` menjadi nama file patch (name + ".pat"); pencocokan
 * sebenarnya ditangani oleh findPatchFileInZip (case-insensitive,
 * abaikan ekstensi).
 */
function parseUltramidIni(text) {
  const patches = [];
  const lines = text.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('#') || line.startsWith(';')) continue;
    // Baris data harus diawali angka (nomor program)
    if (!/^\d/.test(line)) continue;

    const parts = line.split(',').map(s => s.trim());
    if (parts.length < 2) continue;

    const program = parseInt(parts[0], 10);
    const name = parts[parts.length - 1];

    if (!Number.isFinite(program) || !name) continue;
    if (program < 0 || program > 255) continue;

    // Program 128 = placeholder "blank" — jangan diimpor
    if (program === 128) continue;

    let isDrum, gmProgram, gmBank;
    if (program < 128) {
      isDrum = false;
      gmProgram = program;
      gmBank = 0;
    } else {
      // 129..255 -> drum note 1..127
      isDrum = true;
      gmProgram = program - 128;
      gmBank = 128;
      if (gmProgram > 127) continue; // safety
    }

    patches.push({
      program: gmProgram,
      filename: name + ".pat",
      isDrum,
      targetBank: 0
    });
  }

  return patches;
}

/* ---------- ZIP filename helpers (case-insensitive, extension-agnostic) ---------- */
function zipBasename(path) {
  return String(path).split(/[\\/]/).pop() || "";
}

// "Piano.PAT" -> "piano", "sub/Drums.pat" -> "drums"
function normalizeBasenameKey(name) {
  return zipBasename(name).toLowerCase().replace(/\.[^.]+$/, "");
}

/**
 * Kandidat file konfigurasi (urut prioritas):
 *   1. timidity.cfg  (format "timidity")
 *   2. *.cfg         (format "timidity")
 *   3. *.ini         (coba "timidity" dulu, lalu "ultramid")
 *
 * Setiap kandidat = { name, format }.
 */
function findConfigFileCandidates(zip) {
  const names = Array.from(zip.files.keys());
  const candidates = [];
  const seen = new Set();
  const push = (name, format) => {
    const key = name + "|" + format;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ name, format });
  };

  // Prioritas 1: timidity.cfg
  names.forEach(name => {
    if (zipBasename(name).toLowerCase() === "timidity.cfg") push(name, "timidity");
  });
  // Prioritas 2: *.cfg (selain timidity.cfg yang sudah masuk)
  names.forEach(name => {
    if (/\.cfg$/i.test(name) && zipBasename(name).toLowerCase() !== "timidity.cfg") {
      push(name, "timidity");
    }
  });
  // Prioritas 3: *.ini — coba sebagai TiMidity dulu, lalu sebagai UltraMID
  names.forEach(name => {
    if (/\.ini$/i.test(name)) {
      push(name, "timidity");
      push(name, "ultramid");
    }
  });

  return candidates;
}

/**
 * Cari file patch di dalam ZIP yang cocok dengan path yang direferensikan
 * oleh cfg. Pencocokan dilakukan berlapis (paling ketat → paling longgar):
 *   1. Path ternormalisasi persis (case-insensitive)
 *   2. Suffix "/<target>" (case-insensitive)
 *   3. Basename persis (case-insensitive, dengan ekstensi)
 *   4. Basename tanpa ekstensi (case-insensitive), preferensi .pat
 */
function findPatchFileInZip(zip, targetPath) {
  const targetNorm = normalizePath(targetPath).toLowerCase();
  const targetBasename = zipBasename(targetPath).toLowerCase();
  const targetKey = normalizeBasenameKey(targetPath);

  // Pass 1: exact normalized path
  for (const [name, entry] of zip.files) {
    if (normalizePath(name).toLowerCase() === targetNorm) return entry;
  }
  // Pass 2: endsWith (folder berbeda di root ZIP)
  for (const [name, entry] of zip.files) {
    const normName = normalizePath(name).toLowerCase();
    if (normName.endsWith("/" + targetNorm)) return entry;
  }
  // Pass 3: exact basename (case-insensitive, dengan ekstensi)
  for (const [name, entry] of zip.files) {
    if (zipBasename(name).toLowerCase() === targetBasename) return entry;
  }
  // Pass 4: basename tanpa ekstensi — preferensi file .pat
  const candidates = [];
  for (const [name, entry] of zip.files) {
    if (normalizeBasenameKey(name) === targetKey) candidates.push({ name, entry });
  }
  if (candidates.length > 0) {
    const patMatch = candidates.find(c => /\.pat$/i.test(c.name));
    return (patMatch || candidates[0]).entry;
  }
  return null;
}

async function handleZipOpen(ab) {
  showStatus(t("reading_zip"));
  const zip = await readZip(ab);

  // 1) Cari kandidat config: timidity.cfg → *.cfg → *.ini (+ultramid)
  const cfgCandidates = findConfigFileCandidates(zip);
  if (cfgCandidates.length === 0) throw new Error(t("zip_no_cfg"));

  // 2) Coba tiap kandidat hingga menghasilkan >= 1 patch
  let cfgName = null;
  let parsed = null;
  for (const candidate of cfgCandidates) {
    try {
      const cfgData = await extractFile(zip, zip.files.get(candidate.name));
      const text = new TextDecoder().decode(cfgData);
      const result = (candidate.format === "ultramid")
        ? parseUltramidIni(text)
        : parseTimidityCfg(text);
      if (result.length > 0) {
        cfgName = candidate.name;
        parsed = result;
        break;
      }
    } catch (e) {
      console.warn(
        `Gagal parse kandidat config "${candidate.name}" (${candidate.format}):`,
        e
      );
    }
  }

  if (!parsed) throw new Error(t("zip_no_patches"));

  // 3) Tentukan base directory untuk resolusi path patch.
  //    - Jika config berada di subfolder → pakai direktori config sebagai basis.
  //    - Jika config di root → baseDir = "" (cari dari root, seperti biasa).
  //    - Jika config di root tapi patch berada di wrapper folder → wrapperFolder
  //      dipakai sebagai hint tambahan.
  const cfgDir = zipDirname(cfgName);
  const wrapperFolder = detectWrapperFolder(zip);
  const baseDir = cfgDir || ""; // prioritas: direktori config

  const entries = [];
  let processed = 0;

  for (const item of parsed) {
    const targetPath = normalizePath(item.filename);

    let zipFileEntry = null;

    // (a) Coba dengan prefix baseDir — pencocokan persis (Pass 1 di
    //     findPatchFileInZip memakai exact match, jadi paling presisi).
    if (baseDir) {
      const prefixed = normalizePath(baseDir + targetPath);
      zipFileEntry = findPatchFileInZip(zip, prefixed);
    }

    // (b) Fallback: path asli. findPatchFileInZip akan mencoba 4 lapis
    //     (exact → suffix / → basename → basename tanpa ekstensi),
    //     yang menangani wrapper folder secara implisit.
    if (!zipFileEntry) {
      zipFileEntry = findPatchFileInZip(zip, targetPath);
    }

    // (c) Fallback terakhir: bila config di root tapi ada wrapper folder
    //     yang berbeda dari cfgDir, coba prefix wrapperFolder secara eksplisit.
    if (!zipFileEntry && wrapperFolder && wrapperFolder !== baseDir) {
      const wrapped = normalizePath(wrapperFolder + targetPath);
      zipFileEntry = findPatchFileInZip(zip, wrapped);
    }

    if (!zipFileEntry) {
      console.warn(`File tidak ditemukan di ZIP: ${targetPath}`);
      continue;
    }

    try {
      const patData = await extractFile(zip, zipFileEntry);
      const patch = parsePAT(patData);
      const fallbackName = item.filename.split('/').pop().replace(/\.pat$/i, "");
      const entryName = getImportedPatchName(patch, item, fallbackName);

      // Auto-fill nama instrumen jika kosong
      if (patch.instruments && patch.instruments.length > 0) {
        for (const inst of patch.instruments) {
          if (!inst.name || !inst.name.trim()) {
            inst.name = entryName.substring(0, 16);
          }
        }
      }

      const entry = {
        id: uid("pat"),
        name: entryName,
        source: "zip:" + cfgName,
        gmProgram: item.program,
        gmBank: item.isDrum ? 128 : 0,
        ...(item.isDrum ? { drumSet: item.targetBank } : {}),
        originalOrder: item.targetBank,
        targetBank: item.targetBank,
        patch
      };
      entries.push(entry);
      processed++;
      if (processed % 10 === 0) {
        showStatus(t("importing_zip", { current: processed, total: parsed.length }));
        await new Promise(r => setTimeout(r, 0));
      }
    } catch (e) {
      console.warn(`Gagal memproses ${targetPath}:`, e);
    }
  }

  if (entries.length === 0) throw new Error(t("zip_no_valid_patches"));

  await addPatchEntries(entries);
  showStatus(t("zip_import_success", { count: entries.length }), "ok");
}

/* ---------- File Detection & Handler ---------- */
function detectFileType(ab) {
  if (!ab || ab.byteLength < 12) return null;
  const b = new Uint8Array(ab, 0, 12);
  let s = "";
  for (let i = 0; i < 12; i++) s += String.fromCharCode(b[i]);
  if (s.startsWith("GF1PATCH")) return "pat";
  if (s.startsWith("RIFF") && s.substring(8, 12) === "sfbk") return "sf2";
  if (b[0] === 0x50 && b[1] === 0x4B) return "zip"; // ZIP signature 'PK'

  // MIDI.js Soundfont: file teks yang mengandung "MIDI.Soundfont"
  const probeLen = Math.min(512, ab.byteLength);
  const head = new TextDecoder("utf-8").decode(new Uint8Array(ab, 0, probeLen));
  if (head.includes("MIDI.Soundfont") || head.includes("MIDI.SoundFont")) return "midijs";

  return null;
}

/**
 * Nama untuk entry hasil import ZIP.
 * Prioritas: nama instrumen (PAT) → deskripsi (PAT) → nama GM (dari cfg) → nama file.
 * Semua hasil dipotong 16 karakter sesuai konvensi nama instrumen PAT.
 */
function getImportedPatchName(patch, cfgItem, fallbackFilename) {

  if (patch?.instruments?.length === 1) {
    const instName = (patch.instruments[0]?.name || "").trim();
    if (instName) return instName.substring(0, IMPORT_NAME_MAX_LEN);
  }

  if (cfgItem) {
    const prog = cfgItem.program;
    if (cfgItem.isDrum) {
      const drumName = GM_DRUM_NAMES[prog];
      if (drumName) return drumName.substring(0, IMPORT_NAME_MAX_LEN);
    } else if (Number.isInteger(prog) && prog >= 0 && prog < GM_MELODIC_NAMES.length) {
      return GM_MELODIC_NAMES[prog].substring(0, IMPORT_NAME_MAX_LEN);
    }
  }

  const desc = (patch?.header?.description || "").trim();
  if (desc && !/^\d+$/.test(desc)) {
    return desc.substring(0, IMPORT_NAME_MAX_LEN);
  }

  // 4. Fallback terakhir: nama file
  return (fallbackFilename || "patch").substring(0, IMPORT_NAME_MAX_LEN);
}

function getPatchDisplayName(patch, fallbackName) {
  if (!patch || !patch.instruments) return fallbackName || "patch";
  // Jika hanya ada 1 instrumen dan namanya tidak kosong, gunakan nama instrumen
  if (patch.instruments.length === 1) {
    const instName = patch.instruments[0]?.name?.trim();
    if (instName) return instName.substring(0, 64);
  }
  // Jika multi-instrumen atau nama instrumen kosong, gunakan deskripsi atau fallback
  return (patch.header.description || fallbackName || "patch").substring(0, 64);
}

function handleFileOpen(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (!state.projects.some(project => project.id === state.currentProjectId)) {
    e.target.value = "";
    requestProjectForImport();
    return;
  }

  // Gunakan FileReader untuk membaca ArrayBuffer
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const ab = reader.result;
      const type = detectFileType(ab);
      
      if (type === "zip") {
        await handleZipOpen(ab);
      } else if (type === "pat") {
        const patch = parsePAT(ab);
        const fallbackName = file.name.replace(/\.pat$/i, "");
        const entryName = getPatchDisplayName(patch, fallbackName);

        // Auto-fill nama instrumen jika kosong
        if (patch.instruments && patch.instruments.length > 0) {
          for (const inst of patch.instruments) {
            if (!inst.name || !inst.name.trim()) {
              inst.name = entryName.substring(0, 16);
            }
          }
        }

        const entry = {
          id: uid("pat"),
          name: entryName,
          source: "pat",
          gmProgram: -1,
          gmBank: 0,
          patch
        };
        if (await addPatchEntries([entry])) {
          const count = allSamples().length;
          showStatus(t("file_loading", { filename: file.name, samples: t(count === 1 ? "sample_count_one" : "sample_count_many", { count }) }), "ok");
        }
      } else if (type === "sf2") {
        showStatus(t("converting_sf2"));
        setTimeout(async () => {
          try {
            const sf2 = parseSF2(ab);
            const entries = sf2ToGusPatches(sf2, file.name);
            if (entries.length === 0) {
              showStatus(t("sf2_no_preset"), "bad");
              showAlert("sf2_no_samples_alert");
            } else {
              if (await addPatchEntries(entries)) {
                const count = entries.length;
                showStatus(t("sf2_added_to_project", { filename: file.name, patches: t(count === 1 ? "patch_count_one" : "patch_count_many", { count }) }), "ok");
              }
            }
          } catch (err) {
            console.error(err);
            showStatus(t("sf2_conversion_failed", { message: err.message }), "bad");
            showAlert("sf2_conversion_alert", { message: err.message });
          }
        }, 100);
      } else {
        throw new Error(t("unknown_file_format"));
      }
      e.target.value = "";
    } catch (err) {
      console.error(err);
      showStatus(t("file_parse_failed", { message: err.message }), "bad");
      showAlert("file_load_alert", { message: err.message });
      e.target.value = "";
    }
  };
  reader.onerror = () => { showStatus(t("file_read_failed"), "bad"); e.target.value = ""; };
  reader.readAsArrayBuffer(file);
}

async function handleFileOpen(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  
  if (!state.projects.some(project => project.id === state.currentProjectId)) {
    e.target.value = "";
    requestProjectForImport();
    return;
  }

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const ab = reader.result;
      const type = detectFileType(ab);

      if (type === "zip") {
        await handleZipOpen(ab);
        
      } else if (type === "pat") {
        const patch = parsePAT(ab);
        const entry = {
          id: uid("pat"),
          name: (patch.header.description || file.name.replace(/\.pat$/i, "")).substring(0, 64),
          source: "pat",
          gmProgram: -1,
          gmBank: 0,
          patch
        };
        
        const added = await addPatchEntries([entry]);
        if (added) {
          const count = allSamples().length;
          showStatus(t("file_loading", {
            filename: file.name,
            samples: t(count === 1 ? "sample_count_one" : "sample_count_many", { count })
          }), "ok");
        }
        
      } else if (type === "sf2") {
        // Menangani file SF2 (SoundFont)
        showStatus(t("converting_sf2"));
        await new Promise(resolve => setTimeout(resolve, 50));
        try {
          const sf2 = parseSF2(ab);
          const entries = sf2ToGusPatches(sf2, file.name);
          if (entries.length === 0) {
            showStatus(t("sf2_no_preset"), "bad");
            showAlert("sf2_no_samples_alert");
          } else {
            const added = await addPatchEntries(entries);
            if (added) {
              const count = entries.length;
              showStatus(t("sf2_added_to_project", {
                filename: file.name,
                patches: t(count === 1 ? "patch_count_one" : "patch_count_many", { count })
              }), "ok");
            }
          }
        } catch (err) {
          console.error("SF2 conversion error:", err);
          showStatus(t("sf2_conversion_failed", { message: err.message }), "bad");
          showAlert("sf2_conversion_alert", { message: err.message });
        }

      } else if (type === "midijs") {
        // MIDI.js Soundfont (.js dengan base64 OGG/MP3)
        try {
          const text = new TextDecoder("utf-8").decode(ab);
          await handleMidiJsImport(text, file.name);
        } catch (err) {
          console.error("MIDI.js import error:", err);
          showStatus(t("midijs_failed", { message: err.message }), "bad");
          showAlert("midijs_alert", { message: err.message });
        }

      } else {
        throw new Error(t("unknown_file_format"));
      }
      
      e.target.value = ""; // Reset input
      
    } catch (err) {
      console.error("File Open Error:", err);
      showStatus(t("file_parse_failed", { message: err.message }), "bad");
      showAlert("file_load_alert", { message: err.message });
      e.target.value = "";
    }
  };
  
  reader.onerror = () => {
    showStatus(t("file_read_failed"), "bad");
    e.target.value = "";
  };
  
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

/* ---------- Sample JSON (Base64 PCM) ---------- */
function bytesToBase64(u8) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < u8.length; i += chunkSize) {
    const chunk = u8.subarray(i, Math.min(i + chunkSize, u8.length));
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  const u8 = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) u8[i] = binary.charCodeAt(i);
  return u8;
}

function exportSampleToJson(sample) {
  const clean = cleanSampleForStorage(sample);
  return JSON.stringify({
    format: "gus-sample-json",
    version: 1,
    exportedAt: new Date().toISOString(),
    sample: {
      ...clean,
      reserved: bytesToBase64(clean.reserved),
      pcm: bytesToBase64(clean.pcm)
    }
  }, null, 2);
}

function parseSampleJsonText(text) {
  let obj;
  try { obj = JSON.parse(text); }
  catch (e) { throw new Error(t("sample_json_invalid")); }

  if (!obj || obj.format !== "gus-sample-json" || !obj.sample) {
    throw new Error(t("sample_json_invalid"));
  }
  const s = obj.sample;
  if (typeof s.pcm !== "string" || s.pcm.length === 0) {
    throw new Error(t("sample_json_invalid"));
  }

  let pcm, reserved;
  try {
    pcm = base64ToBytes(s.pcm);
    reserved = typeof s.reserved === "string" ? base64ToBytes(s.reserved) : new Uint8Array(36);
  } catch (e) {
    throw new Error(t("sample_json_invalid"));
  }
  if (pcm.length === 0) throw new Error(t("sample_json_invalid"));

  const num = (v, def, min, max) => {
    const n = Number(v);
    if (!isFinite(n)) return def;
    return clamp(n, min, max);
  };
  const safeReserved = new Uint8Array(36);
  safeReserved.set(reserved.subarray(0, 36));

  return {
    name: String(s.name || "SAMPLE").replace(/[^\w-]/g, "").slice(0, 7) || "SAMPLE",
    fractions: num(s.fractions, 0, 0, 255) | 0,
    dataSize: pcm.length,
    loopStart: Math.max(0, num(s.loopStart, 0, 0, pcm.length)),
    loopEnd: Math.max(0, num(s.loopEnd, 0, 0, pcm.length)),
    sampleRate: num(s.sampleRate, 22050, 1, 192000),
    lowFreq: Math.max(0, num(s.lowFreq, 0, 0, 0xFFFFFFFF)),
    highFreq: Math.max(0, num(s.highFreq, 0, 0, 0xFFFFFFFF)),
    rootFreq: Math.max(0, num(s.rootFreq, 0, 0, 0xFFFFFFFF)),
    tune: num(s.tune, 0, 0, 65535) | 0,
    balance: num(s.balance, 7, 0, 15) | 0,
    envRates: Array.isArray(s.envRates)
      ? Array.from({ length: 6 }, (_, i) => num(s.envRates[i], 0, 0, 255) | 0)
      : [0, 0, 0, 0, 0, 0],
    envOffsets: Array.isArray(s.envOffsets)
      ? Array.from({ length: 6 }, (_, i) => num(s.envOffsets[i], 0, 0, 255) | 0)
      : [0, 0, 0, 0, 0, 0],
    tremoloSweep: num(s.tremoloSweep, 0, 0, 255) | 0,
    tremoloRate: num(s.tremoloRate, 0, 0, 255) | 0,
    tremoloDepth: num(s.tremoloDepth, 0, 0, 255) | 0,
    vibratoSweep: num(s.vibratoSweep, 0, 0, 255) | 0,
    vibratoRate: num(s.vibratoRate, 0, 0, 255) | 0,
    vibratoDepth: num(s.vibratoDepth, 0, 0, 255) | 0,
    modes: num(s.modes, 0, 0, 65535) | 0,
    scaleFreq: num(s.scaleFreq, 60, 0, 65535) | 0,
    scaleFactor: num(s.scaleFactor, 1024, 0, 65535) | 0,
    reserved: safeReserved,
    pcm,
    _float: null
  };
}

function exportCurrentSampleJson() {
  const s = state.selSample;
  if (!s) return;
  try {
    const json = exportSampleToJson(s);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (sanitizeFilename(s.name || "sample")) + ".sample.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showStatus(t("sample_json_exported", { name: s.name }), "ok");
  } catch (err) {
    console.error("Export sample JSON error:", err);
    showStatus(t("sample_json_export_failed", { message: err.message }), "bad");
  }
}

function addImportedSampleToPatch(sample) {
  const patch = state.patch;
  if (!patch) throw new Error(t("sample_json_no_patch"));
  const inst = patch.instruments[state.selInst];
  if (!inst) throw new Error(t("sample_json_no_instrument"));

  if (inst.layers.length === 0) {
    inst.layers.push({ duplicate: 0, layer: 0, layerSize: 0, reserved: new Uint8Array(40), samples: [] });
  }
  const layer = inst.layers[0];
  if (layer.samples.length >= 255) throw new Error(t("sample_json_layer_limit"));

  layer.samples.push(sample);

  state.selSample = sample;
  state.selStart = state.selEnd = 0;
  state.undo = [];
  state.zoom = 1;
  state.offset = 0;
  updateZoomUI();

  const samples = allSamples();
  patch.header.waveForms = samples.length;
  patch.header.dataSize = samples.reduce((sum, ref) => sum + ref.sample.pcm.length, 0);

  render();
}

function importSampleFromJsonFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const sample = parseSampleJsonText(String(reader.result || ""));
      addImportedSampleToPatch(sample);
      showStatus(t("sample_json_imported", { name: sample.name }), "ok");
    } catch (err) {
      console.error("Import sample JSON error:", err);
      showStatus(t("sample_json_import_failed", { message: err.message }), "bad");
      showAlert("sample_json_import_alert", { message: err.message });
    }
  };
  reader.onerror = () => {
    showStatus(t("sample_json_import_failed", { message: t("file_read_failed") }), "bad");
  };
  reader.readAsText(file);
}


/* ---------- MIDI.js Soundfont Import ---------- */
function midiJsNoteToNumber(name) {
  const m = String(name).match(/^([A-G])([#b]?)(-?\d+)$/);
  if (!m) return null;
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]];
  let semi = base;
  if (m[2] === "#") semi += 1;
  else if (m[2] === "b") semi -= 1;
  const octave = parseInt(m[3], 10);
  const n = (octave + 1) * 12 + semi;
  return n >= 0 && n <= 127 ? n : null;
}

function midiJsSampleName(noteName) {
  return String(noteName).replace(/#/g, "s").replace(/b/g, "f").replace(/[^\w-]/g, "").slice(0, 7) || "SMP";
}

/**
 * Parse file .js MIDI.js secara aman (tanpa eval).
 * Mengembalikan array { instrumentName, notes: { "A0": "<base64>", ... } }.
 */
/**
 * Cari posisi '}' pasangan dari '{' pada index openBrace,
 * dengan menghormati string literal (tanda kutip) dan escape.
 */
function findMatchingBrace(text, openBrace) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = openBrace; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function parseMidiJsSoundfont(text) {
  const results = [];
  // Dot notation:  MIDI.Soundfont.acoustic_grand_piano = {
  // Bracket notation (jaga-jaga): MIDI.Soundfont["acoustic_grand_piano"] = {
  const assignRe = /MIDI\.Soundfont\s*(?:\.([A-Za-z0-9_]+)|\[\s*["']([^"']+)["']\s*\])\s*=\s*\{/g;
  let m;
  while ((m = assignRe.exec(text))) {
    const instrumentName = m[1] || m[2];
    const openBrace = m.index + m[0].length - 1;        // posisi '{'
    const closeBrace = findMatchingBrace(text, openBrace);
    if (closeBrace < 0) continue;

    const body = text.slice(openBrace + 1, closeBrace);
    const notes = {};
    const noteRe = /"([A-G][#b]?-?\d+)"\s*:\s*"data:audio\/[^;"]+;base64,([A-Za-z0-9+/=]+)"/g;
    let nm;
    while ((nm = noteRe.exec(body))) notes[nm[1]] = nm[2];
    if (Object.keys(notes).length > 0) results.push({ instrumentName, notes });
  }
  if (results.length === 0) throw new Error(t("midijs_invalid"));
  return results;
}

function createDecodeContext(targetRate = 22050) {
  const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (OfflineCtx) {
    try { return new OfflineCtx(1, 1, targetRate); } catch (_) {}
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) throw new Error(t("web_audio_unsupported"));
  try { return new AC({ sampleRate: targetRate }); } catch (_) { return new AC(); }
}

async function decodeBase64AudioToMono16(base64, decodeCtx) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const audioBuf = await decodeCtx.decodeAudioData(bytes.buffer);
  const ch = audioBuf.numberOfChannels;
  const n = audioBuf.length;
  const mono = new Float32Array(n);
  for (let c = 0; c < ch; c++) {
    const data = audioBuf.getChannelData(c);
    for (let i = 0; i < n; i++) mono[i] += data[i] / ch;
  }
  const pcm = new Uint8Array(n * 2);
  for (let i = 0; i < n; i++) {
    let v = Math.round(clamp(mono[i], -1, 1) * 32767);
    if (v < 0) v += 65536;
    pcm[i * 2] = v & 255;
    pcm[i * 2 + 1] = (v >> 8) & 255;
  }
  return { pcm, sampleRate: audioBuf.sampleRate, frames: n };
}

/**
 * Konversi satu instrumen MIDI.js menjadi entry patch GUS.
 */
async function midiJsInstrumentToEntry(parsed, fileName, decodeCtx, onProgress) {
  const noteList = Object.entries(parsed.notes)
    .map(([name, b64]) => ({ name, note: midiJsNoteToNumber(name), b64 }))
    .filter(x => x.note !== null)
    .sort((a, b) => a.note - b.note);

  if (noteList.length === 0) throw new Error(t("midijs_no_notes"));

  const samples = [];
  for (let i = 0; i < noteList.length; i++) {
    const { name, note, b64 } = noteList[i];
    onProgress?.(i + 1, noteList.length, name);
    let decoded;
    try {
      decoded = await decodeBase64AudioToMono16(b64, decodeCtx);
    } catch (err) {
      console.warn(`[MIDI.js] Failed to decode note ${name}:`, err);
      continue;
    }
    // Beri napas ke UI setiap beberapa note
    if (i % 8 === 7) await new Promise(r => setTimeout(r, 0));

    const rootFreq = Math.round(midiToFreq(note) * 1000);
    samples.push({
      name: midiJsSampleName(name),
      fractions: 0,
      dataSize: decoded.pcm.length,
      loopStart: 0,
      loopEnd: 0,
      sampleRate: decoded.sampleRate,
      lowFreq: 0,
      highFreq: 0,
      rootFreq,
      tune: 0,
      balance: 7,
      envRates: [0, 0, 0, 0, 0, 0],
      envOffsets: [255, 255, 255, 0, 0, 0],
      tremoloSweep: 0, tremoloRate: 0, tremoloDepth: 0,
      vibratoSweep: 0, vibratoRate: 0, vibratoDepth: 0,
      modes: M16,                       // 16-bit signed, tanpa loop, tanpa envelope
      scaleFreq: 60,
      scaleFactor: 1024,
      reserved: new Uint8Array(36),
      pcm: decoded.pcm,
      _float: null,
      _midiNote: note
    });
  }

  if (samples.length === 0) throw new Error(t("midijs_no_notes"));

  // Rentang frekuensi: batas antar-note = rata-rata geometrik root frequency tetangga
  for (let i = 0; i < samples.length; i++) {
    const f = samples[i].rootFreq;
    const prev = i > 0 ? samples[i - 1].rootFreq : null;
    const next = i < samples.length - 1 ? samples[i + 1].rootFreq : null;
    samples[i].lowFreq = prev ? Math.floor(Math.sqrt(prev * f)) : Math.max(1, Math.floor(f / 2));
    samples[i].highFreq = next ? Math.ceil(Math.sqrt(f * next)) : Math.min(20000000, Math.ceil(f * 2));
  }

  const instrumentName = parsed.instrumentName;
  const totalBytes = samples.reduce((s, x) => s + x.pcm.length, 0);

  const patch = {
    header: {
      magic: MAGIC, gravisId: GRAVIS_ID,
      description: `MIDI.js ${instrumentName}`.substring(0, 60),
      voices: 14, channels: 0, waveForms: samples.length,
      masterVolume: 127, dataSize: totalBytes,
      reserved: new Uint8Array(36)
    },
    instruments: [{
      instrument: 0,
      name: instrumentName.substring(0, 16),
      size: 0,
      reserved: new Uint8Array(40),
      layers: [{
        duplicate: 0, layer: 0, layerSize: 0,
        reserved: new Uint8Array(40),
        samples
      }]
    }]
  };

  return {
    id: uid("midijs"),
    name: instrumentName.substring(0, 48),
    source: "midijs:" + fileName,
    gmProgram: -1,
    gmBank: 0,
    patch
  };
}

/**
 * Handler utama: parse teks MIDI.js, decode semua note, lalu tambahkan ke proyek.
 */
async function handleMidiJsImport(text, fileName) {
  if (!state.projects.some(p => p.id === state.currentProjectId)) {
    requestProjectForImport();
    return;
  }

  const parsedList = parseMidiJsSoundfont(text);
  const decodeCtx = createDecodeContext(22050);
  const entries = [];

  try {
    for (const parsed of parsedList) {
      const entry = await midiJsInstrumentToEntry(parsed, fileName, decodeCtx, (cur, total, note) => {
        showStatus(t("midijs_converting", { current: cur, total, note }));
      });
      entries.push(entry);
    }
  } finally {
    if (typeof decodeCtx.close === "function") {
      try { decodeCtx.close(); } catch (_) {}
    }
  }

  if (entries.length === 0) throw new Error(t("midijs_no_notes"));

  const added = await addPatchEntries(entries);
  if (added) {
    const first = entries[0];
    const sampleCount = first.patch.instruments[0].layers[0].samples.length;
    showStatus(t("midijs_done", { name: first.name, count: sampleCount }), "ok");
  }
}

/**
 * Impor dari URL (mis. CDN jsDelivr). Dipicu oleh tombol #btnMidiJsUrl.
 */
async function importMidiJsFromUrl() {
  const example = "";
  const url = await customPrompt({
    title: t("midijs_url_button"),
    label: t("midijs_url_prompt"),
    defaultValue: example,
    placeholder: "",
    inputType: "text",
    inputMode: "url",
    validate: (v) => {
      const trimmed = String(v || "").trim();
      if (!trimmed) return t("custom_prompt_required");
      try { new URL(trimmed); return true; }
      catch (_) { return t("custom_prompt_invalid_url"); }
    }
  });
  if (url === null || url === undefined) return;
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return;

  if (!state.projects.some(p => p.id === state.currentProjectId)) {
    requestProjectForImport();
    return;
  }

  try {
    showStatus(t("midijs_fetching", { url }));
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const fileName = (url.split("/").pop() || "soundfont.js").split("?")[0];
    await handleMidiJsImport(text, fileName);
  } catch (err) {
    console.error("MIDI.js URL import error:", err);
    showStatus(t("midijs_failed", { message: err.message }), "bad");
    showAlert("midijs_alert", { message: err.message });
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

  const midiJsUrlBtn = $("btnMidiJsUrl");
  midiJsUrlBtn.addEventListener("click", importMidiJsFromUrl);

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

  // === Project Properties Modal ===
  $("btnCloseProjectProperties").addEventListener("click", () => closeProjectPropertiesDialog());
  $("btnCancelProjectProperties").addEventListener("click", () => closeProjectPropertiesDialog());
  $("btnSaveProjectProperties").addEventListener("click", saveProjectProperties);
  $("projectPropertiesDialog").addEventListener("click", e => {
    if (e.target === $("projectPropertiesDialog")) closeProjectPropertiesDialog();
  });
  $("projectPropertiesDialog").addEventListener("keydown", e => {
    if (e.key === "Escape") closeProjectPropertiesDialog();
  });
  ["projectPropName", "projectPropAuthor", "projectPropSource"].forEach(id => {
    $(id).addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); saveProjectProperties(); }
    });
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
    state.libraryBankFilter = "all"; // Reset filter bank
    state.libraryTypeFilter = "all"; // <-- Reset filter tipe juga
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
    if (midiProgress.playing) {
      togglePauseMidi(); // Will act as Pause
    } else if (midiProgress.paused) {
      togglePauseMidi(); // Will act as Resume
    } else {
      playMidi(0);
    }
  });

  $("btnStopMidi").addEventListener("click", stopMidi);
  $("btnRenderMidi").addEventListener("click", renderMidiToWav);

    $("midiSeek").addEventListener("input", e => {
    if (!state.midiData) return;
    midiProgress.seeking = true;
    
    // Hitung persentase dan waktu target
    const pct = parseInt(e.target.value, 10) / 1000;
    const targetTime = pct * midiProgress.duration;
    $("midiTimeCur").textContent = formatTime(targetTime);
    
    // Update playhead secara live menggunakan estimasi tick
    if (timelinePlayheadEl && timelineTotalTicks > 0) {
      const estimatedTick = pct * timelineTotalTicks;
      updateTimelinePlayhead(estimatedTick);
    }
  });

  $("midiSeek").addEventListener("change", (e) => {
    if (!state.midiData) return;
    const pct = parseInt(e.target.value, 10) / 1000;
    const targetTime = pct * midiProgress.duration;
    const wasPaused = midiProgress.paused;

    midiProgress.seeking = false;
    cancelAnimationFrame(midiProgress.raf);

    midiProgress.playing = false;
    if (timidityPlayer) timidityPlayer.stop();

    midiProgress.current = targetTime;
    midiProgress.startTime = performance.now() - (targetTime * 1000);

    // Update playhead segera setelah seek selesai
    if (timelinePlayheadEl && timelineTotalTicks > 0) {
      const estimatedTick = pct * timelineTotalTicks;
      updateTimelinePlayhead(estimatedTick);
    }

    if (wasPaused) {
      midiProgress.paused = true;
      updateMidiUI();
      setMidiStatus("midi_paused_at", {time: formatTime(targetTime)});
    } else {
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
      const entry=state.patches.find(p=>p.id===state.currentPatchId);
      
      if(entry){ 
          // Hanya update entry.name dari deskripsi JIKA instrumen tidak punya nama
          const hasInstName = state.patch.instruments.length === 1 && state.patch.instruments[0].name?.trim();
          if (!hasInstName) {
              entry.name = state.patch.header.description || t("unnamed");
              $("patchNameSide").textContent = entry.name;
              renderLibrary(); 
          }
      }
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
    
    // SINKRONISASI BARU: Jika patch ini hanya punya 1 instrumen, update entry.name
    if (state.patch.instruments.length === 1) {
        const entry = state.patches.find(p=>p.id===state.currentPatchId);
        if (entry) {
            entry.name = inst.name || t("unnamed");
            $("patchNameSide").textContent = entry.name;
            renderLibrary();
        }
    }
    
    scheduleSave();
  });

  $("btnSelectBank").addEventListener("click", openBankSelectDialog);
  $("btnCancelBankSelect").addEventListener("click", () => {closeBankSelectDialog(true);});
  $("btnConfirmBankSelect").addEventListener("click", () => {closeBankSelectDialog(false);});

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
    $(id).addEventListener("click", async () => {
      if(kind==="amplify"){
        const titleText = t("amplify_factor_prompt").replace(/[:\s]+$/, "");
        const input = await customPrompt({
          title: titleText,
          label: t("amplify_factor_label"),
          defaultValue: "1.5",
          inputType: "number",
          inputMode: "decimal",
          min: 0.01,
          max: 100,
          validate: (v) => {
            const n = parseFloat(v);
            if (!isFinite(n) || n <= 0) return t("custom_prompt_invalid_number");
            return true;
          }
        });
        if (input === null) return;
        const g = parseFloat(input);
        if (isFinite(g)) applyEdit("amplify", g);
      } else {
        applyEdit(kind,param);
      }
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
        scheduleBankConfigSave(p);
      }
    }
    renderBankManager();
  });

  // === Export dialog ===
  $("btnCancelExportBanks").addEventListener("click", closeExportBanksDialog);
  $("btnConfirmExportBanks").addEventListener("click", async () => {
    const project = state.projects.find(p => p.id === state.currentProjectId);
    if (!project) { closeExportBanksDialog(); return; }
    
    // Ambil patch yang dicentang saja
    let patches = getProjectPatchEntries().filter(p => p.exportSelected !== false);
    
    if (patches.length === 0) {
      $("exportBanksError").textContent = t("export_nothing_selected");
      return;
    }
    
    // Validasi apakah ada Target Bank yang bentrok (misal Melodi & Drum punya target sama)
    // (Opsional, tapi bagus untuk peringatan)
    const drumBanks = new Set(patches.filter(p => (p.gmBank ?? 0) === 128).map(p => p.targetBank));
    const melodicBanks = new Set(patches.filter(p => (p.gmBank ?? 0) !== 128).map(p => p.targetBank));
    
    // (Pengecekan bentrok bisa ditambahkan di sini jika diperlukan)
    
    closeExportBanksDialog();
    await exportProjectWithConfig(project, patches);
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

  $("libraryBankFilter").addEventListener("change", (e) => {
    state.libraryBankFilter = e.target.value;
    renderLibrary();
  });

  // TAMBAHKAN EVENT LISTENER INI
  $("libraryTypeFilter").addEventListener("change", (e) => {
    state.libraryTypeFilter = e.target.value;
    renderLibrary();
  });

  $("libraryNameFilter").addEventListener("input", (e) => {
    state.libraryNameFilter = e.target.value;
    renderLibrary();
  });

  $("btnShowFreqMap").addEventListener("click", openFreqMapDialog);
  $("btnCloseFreqMap").addEventListener("click", () => { $("freqMapDialog").hidden = true; });
  $("freqMapDialog").addEventListener("click", e => {
    if (e.target === $("freqMapDialog")) $("freqMapDialog").hidden = true;
  });

  $("btnExportSampleJson").addEventListener("click", exportCurrentSampleJson);
  $("btnImportSampleJson").addEventListener("click", () => {
    $("sampleJsonFile").value = "";
    $("sampleJsonFile").click();
  });
  $("sampleJsonFile").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) importSampleFromJsonFile(file);
    e.target.value = "";
  });


  $("btnShowMidiTimeline").addEventListener("click", openMidiTimelineDialog);
  $("btnCloseMidiTimeline").addEventListener("click", closeMidiTimelineDialog);
  $("btnCloseMidiTimelineX").addEventListener("click", closeMidiTimelineDialog);
  $("midiTimelineDialog").addEventListener("click", e => {
    if (e.target === $("midiTimelineDialog")) closeMidiTimelineDialog();
  });
  $("midiTimelineDialog").addEventListener("keydown", e => {
    if (e.key === "Escape") closeMidiTimelineDialog();
  });


  $("btnShowMidiUsedPatches").addEventListener("click", openMidiUsedPatchesDialog);
  $("btnCloseMidiUsedPatches").addEventListener("click", closeMidiUsedPatchesDialog);
  $("btnCloseMidiUsedPatchesX").addEventListener("click", closeMidiUsedPatchesDialog);
  $("midiUsedPatchesDialog").addEventListener("click", e => {
    if (e.target === $("midiUsedPatchesDialog")) closeMidiUsedPatchesDialog();
  });
  $("midiUsedPatchesDialog").addEventListener("keydown", e => {
    if (e.key === "Escape") closeMidiUsedPatchesDialog();
  });

  // Tambahkan di dalam bind()
  $("btnExportProjectSf2").addEventListener("click", async () => {
    const project = state.projects.find(p => p.id === state.currentProjectId);
    if (!project) return;
    
    // Ekspor semua patch di proyek
    const patches = getProjectPatchEntries();
    if (patches.length === 0) {
      showStatus(t("empty_project"), "bad");
      return;
    }
    
    await exportProjectToSF2(project, patches);
  });

    // === Timeline Footer Controls ===
  $("btnTimelinePlay").addEventListener("click", () => {
    if (midiProgress.playing) {
      togglePauseMidi();
    } else if (midiProgress.paused) {
      togglePauseMidi();
    } else {
      playMidi(0);
    }
  });

  $("timelineSeek").addEventListener("input", e => {
    if (!state.midiData) return;
    midiProgress.seeking = true;
    const pct = parseInt(e.target.value, 10) / 1000;
    const targetTime = pct * midiProgress.duration;
    
    // Update display waktu utama
    $("midiTimeCur").textContent = formatTime(targetTime);
    
    // Update playhead secara live
    if (timelinePlayheadEl && timelineTotalTicks > 0) {
      const estimatedTick = pct * timelineTotalTicks;
      updateTimelinePlayhead(estimatedTick);
    }
  });

  $("timelineSeek").addEventListener("change", (e) => {
    if (!state.midiData) return;
    const pct = parseInt(e.target.value, 10) / 1000;
    const targetTime = pct * midiProgress.duration;
    const wasPaused = midiProgress.paused;

    // Sinkronkan dengan slider utama
    $("midiSeek").value = e.target.value;
    
    midiProgress.seeking = false;
    cancelAnimationFrame(midiProgress.raf);

    midiProgress.playing = false;
    if (timidityPlayer) timidityPlayer.stop();

    midiProgress.current = targetTime;
    midiProgress.startTime = performance.now() - (targetTime * 1000);

    if (timelinePlayheadEl && timelineTotalTicks > 0) {
      const estimatedTick = pct * timelineTotalTicks;
      updateTimelinePlayhead(estimatedTick);
    }

    if (wasPaused) {
      midiProgress.paused = true;
      updateMidiUI();
      setMidiStatus("midi_paused_at", {time: formatTime(targetTime)});
    } else {
      midiProgress.paused = false;
      playMidi(targetTime);
    }
  });

  // Klik pada track timeline untuk seek ke posisi tersebut (menggunakan goTo(tick))
  $("midiTimelineContainer").addEventListener("click", (e) => {
    // Abaikan jika yang diklik adalah segmen bar
    // (bar punya handler sendiri → selectPatchFromTimeline + stopPropagation)
    if (e.target.closest(".midi-timeline-bar")) return;

    const track = e.target.closest(".midi-timeline-track");
    if (!track) return;
    if (!state.midiData || !timelineTotalTicks) return;

    const rect = track.getBoundingClientRect();
    if (rect.width === 0) return;

    const pct = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const tick = Math.round(pct * timelineTotalTicks);

    seekToTick(tick);
  });

  bindCanvas();
}

/* ---------- Draggable Modals (header + footer only) ---------- */
function makeModalDraggable(panel) {
  const header = panel.querySelector(".modal-header");
  const footer = panel.querySelector(".modal-footer");
  if (!header && !footer) return;

  let drag = null;

  // Elemen interaktif tidak boleh memulai drag
  const isInteractive = (el) => !!el.closest(
    "button, input, select, textarea, a, label, [contenteditable='true'], [data-no-drag]"
  );

  const beginDrag = (e) => {
    if (e.type === "mousedown" && e.button !== 0) return;
    const target = e.target;

    // Harus dari header atau footer
    const inHeader = header && header.contains(target);
    const inFooter = footer && footer.contains(target);
    if (!inHeader && !inFooter) return;

    // Bukan dari tombol / input / dsb.
    if (isInteractive(target)) return;

    const point = e.touches ? (e.touches[0] || e.changedTouches[0]) : e;
    if (!point) return;

    // Baca translate saat ini (dalam px)
    const cs = window.getComputedStyle(panel);
    let originX = 0, originY = 0;
    if (cs.transform && cs.transform !== "none") {
      try {
        const m = new DOMMatrixReadOnly(cs.transform);
        originX = m.m41;
        originY = m.m42;
      } catch (_) {}
    }

    const rect = panel.getBoundingClientRect();
    drag = {
      startX: point.clientX,
      startY: point.clientY,
      originX, originY,
      baseLeft: rect.left - originX,
      baseTop:  rect.top  - originY,
      savedTransition: panel.style.transition
    };

    panel.style.transition = "none";
    panel.style.userSelect = "none";


    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);

    e.preventDefault();
  };

  const onMove = (e) => {
    if (!drag) return;
    const point = e.touches ? (e.touches[0] || e.changedTouches[0]) : e;
    if (!point) return;

    const dx = point.clientX - drag.startX;
    const dy = point.clientY - drag.startY;
    let nx = drag.originX + dx;
    let ny = drag.originY + dy;

    // Batasi agar tetap terlihat di viewport (margin 32 px)
    const rect = panel.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    const m = 32;
    const vw = window.innerWidth, vh = window.innerHeight;
    const minX = m - drag.baseLeft;
    const maxX = vw - w - m - drag.baseLeft;
    const minY = m - drag.baseTop;
    const maxY = vh - h - m - drag.baseTop;

    if (maxX >= minX) nx = Math.max(minX, Math.min(maxX, nx));
    if (maxY >= minY) ny = Math.max(minY, Math.min(maxY, ny));

    panel.style.transform = `translate(${nx}px, ${ny}px)`;
    if (e.cancelable) e.preventDefault();
  };

  const onEnd = () => {
    if (!drag) return;
    panel.style.transition = drag.savedTransition || "";
    panel.style.userSelect = "";
    drag = null;

    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onEnd);
    document.removeEventListener("touchmove", onMove);
    document.removeEventListener("touchend", onEnd);
    document.removeEventListener("touchcancel", onEnd);
  };

  panel.addEventListener("mousedown", beginDrag);
  panel.addEventListener("touchstart", beginDrag, { passive: false });

  panel._resetDragPosition = () => { panel.style.transform = ""; };
}

function initModalDragging() {
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    const panel = overlay.querySelector(".modal-panel");
    if (!panel) return;

    makeModalDraggable(panel);

    // Reset posisi setiap kali modal dibuka
    const observer = new MutationObserver(mutations => {
      for (const mut of mutations) {
        if (mut.attributeName === "hidden" && !overlay.hidden) {
          panel._resetDragPosition?.();
        }
      }
    });
    observer.observe(overlay, { attributes: true, attributeFilter: ["hidden"] });
  });
}

function hideAppLoadingOverlay() {
  const overlay = document.getElementById("appLoadingOverlay");
  if (!overlay) return;
  overlay.setAttribute("aria-hidden", "true");
  setTimeout(() => overlay.remove(), 400);
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
  initModalDragging(); 
  hideAppLoadingOverlay();
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