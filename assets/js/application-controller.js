class ApplicationController {
  static t(key, values = {}) {
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

  static localizeElement(element) {
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

  static applyLocalization() {
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

  static async initLocalization() {
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

  static setLanguage(nextLocale) {
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

  static decodeAscii(b){let s="";for(let i=0;i<b.length;i++){if(b[i]===0)break;s+=String.fromCharCode(b[i]);}return s.replace(/\s+$/,"");}

  static encodeAscii(s,len){const o=new Uint8Array(len);s=String(s??"");for(let i=0;i<len;i++)o[i]=i<s.length?s.charCodeAt(i)&255:0;return o;}

  static showStatus(m,k){
    const translated = lastTranslation && lastTranslation.text === m ? lastTranslation : null;
    currentStatusTranslation = translated ? {...translated, kind:k} : null;
    $("statusBar").textContent=m;
    $("statusBar").style.color=k==="bad"?"#f87171":k==="ok"?"#34d399":"";
  }

  static setMidiStatus(key, values = {}) {
    currentMidiStatusTranslation = {key, values};
    $("midiStatus").textContent = t(key, values);
  }

  static setBankStatus(statusEl, key, values = {}) {
    currentBankStatusElement = statusEl;
    currentBankStatusTranslation = {key, values};
    statusEl.textContent = t(key, values);
  }

  static fmtBytes(n){return n<1024?n+" B":n<1048576?(n/1024).toFixed(1)+" KB":(n/1048576).toFixed(2)+" MB";}

  static escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

  static uid(prefix){return (prefix||"patch")+"-"+Date.now()+"-"+Math.random().toString(36).substr(2,8);}

  static sanitizeFilename(name) { return (name || "patch").replace(/[^\w\-]+/g, "_"); }

  static openDB(){
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

  static async dbPutMany(store, entries){
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(store,"readwrite");
      const st=tx.objectStore(store);
      for(const entry of entries) st.put(entry);
      tx.oncomplete=()=>resolve();
      tx.onerror=e=>reject(e.target.error);
    });
  }

  static async dbGetAll(store){
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(store,"readonly");
      const req=tx.objectStore(store).getAll();
      req.onsuccess=()=>resolve(req.result||[]);
      req.onerror=e=>reject(e.target.error);
    });
  }

  static async dbDeleteProjectAndPatches(projectId, patchIds){
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

  static async dbDeletePatchAndUpdateProjects(patchId, projects){
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

  static async dbSaveProjectAndPatches(project, entries){
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

  static async dbClearLibraryAndProjects(projects){
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

  static cleanSampleForStorage(s){
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
      pcm: new Uint8Array(s.pcm||[]),
      _autoGenerated: s._autoGenerated || false,
      _generatorInfo: s._generatorInfo ? { ...s._generatorInfo } : undefined
    };
  }

  static cleanPatchForStorage(p){
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

  static cleanEntryForStorage(entry){
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

  static bind(){
  
  
    /* ── GM Map Dialog ── */
    $("btnShowGmMap").addEventListener("click", openGmMapDialog);
    $("btnCloseGmMap").addEventListener("click", closeGmMapDialog);
    $("btnCloseGmMapX").addEventListener("click", closeGmMapDialog);
    $("gmMapDialog").addEventListener("click", e => {
      if (e.target === $("gmMapDialog")) closeGmMapDialog();
    });
    $("gmMapDialog").addEventListener("keydown", e => {
      if (e.key === "Escape") closeGmMapDialog();
    });
  
  
  
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

    $("btnShowDrumKitPreview").addEventListener("click", openDrumKitPreviewDialog);
    $("btnCloseDrumKitPreview").addEventListener("click", closeDrumKitPreviewDialog);
    $("btnCloseDrumKitPreviewX").addEventListener("click", closeDrumKitPreviewDialog);
    $("drumKitPreviewBank").addEventListener("change", renderDrumKitPreviewNotes);
    $("drumKitPreviewBody").addEventListener("click", handleDrumKitPreviewClick);
    $("drumKitPreviewDialog").addEventListener("click", e => {
      if (e.target === $("drumKitPreviewDialog")) closeDrumKitPreviewDialog();
    });
    $("drumKitPreviewDialog").addEventListener("keydown", e => {
      if (e.key === "Escape") closeDrumKitPreviewDialog();
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
  
    // === BARU: Regenerate waveform buttons ===
    document.getElementById("regenerateWaveformRow")?.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-waveform]");
      if (!btn) return;
      regenerateSample(btn.dataset.waveform);
    });
  
    $("addSampleGeneratorType").addEventListener("change", (e) => {
      const isDrum = e.target.value === "drum";
      populateAddSampleProgramOptions(isDrum, null);
    });
  
    document.getElementById("btnGenerateSampleWaveform")?.addEventListener("click", () => {
      const waveform = document.getElementById("addSampleWaveform").value;
      const isDrum = document.getElementById("addSampleGeneratorType").value === "drum";
      const program = parseInt(document.getElementById("addSampleGeneratorProgram").value, 10);
      
      try {
        const draft = generateWaveformDraft(waveform, {
          program: isNaN(program) ? null : program,
          isDrum: isDrum
        });
  
        pendingSampleDraft = draft;
        populateAddSampleParameters(draft.sample, draft.duration);
        document.getElementById("addSamplePreview").hidden = false;
        
        const instName = isDrum ? GM_DRUM_NAMES[program] : GM_MELODIC_NAMES[program];
        const variantKey = {
          default: "sample_variant_a",
          sine: "sample_variant_b",
          triangle: "sample_variant_c",
          saw: "sample_variant_d",
          square: "sample_variant_e"
        }[waveform];
        document.getElementById("addSampleGeneratorStatus").textContent =
          t("sample_generator_ready", {
            instrument: instName,
            variant: t(variantKey),
            duration: draft.duration.toFixed(2)
          });
        document.getElementById("btnConfirmAddSample").disabled = false;
      } catch (err) {
        console.error("Generate waveform error:", err);
        document.getElementById("addSampleError").textContent = err.message;
      }
    });
  
    bindCanvas();
  }

  static makeModalDraggable(panel) {
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

  static initModalDragging() {
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

  static hideAppLoadingOverlay() {
    const overlay = document.getElementById("appLoadingOverlay");
    if (!overlay) return;
    overlay.setAttribute("aria-hidden", "true");
    setTimeout(() => overlay.remove(), 400);
  }
}
