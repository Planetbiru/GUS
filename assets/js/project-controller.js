class ProjectController {
  static async addPatchEntries(entries){
    const project = state.projects.find(p => p.id === state.currentProjectId);
    if(!project) {
      requestProjectForImport();
      return false;
    }
  
    for(const entry of entries){
      if(!entry.id) entry.id=uid(entry.source&&/^(sf2|soundfont|fxp)/.test(entry.source)?"sf2":"pat");
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
    if(entries.length>0) selectProject(state.currentProjectId);
    return true;
  }

  static selectPatch(id){
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

  static deletePatchById(id){
    const entry=state.patches.find(p=>p.id===id);
    if(!entry)return;
    openConfirmationDialog(t("delete_patch_title"),t("confirm_delete_patch", {name: entry.name}),t("delete"),()=>removePatchById(id));
  }

  static async removePatchById(id){
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

  static openConfirmationDialog(title,message,confirmLabel,action){
    pendingConfirmationAction=action;
    $("confirmationTitle").textContent=title;
    $("confirmationMessage").textContent=message;
    $("confirmationError").textContent="";
    $("btnConfirmAction").textContent=confirmLabel;
    $("confirmActionDialog").hidden=false;
    $("btnCancelAction").focus();
  }

  static closeConfirmationDialog(force=false){
    if(!force && $("btnConfirmAction").disabled)return;
    pendingConfirmationAction=null;
    $("confirmActionDialog").hidden=true;
  }

  static showAlert(key,values={}){
    queuedAlerts.push({key,values});
    if(!activeAlert)openNextAlert();
  }

  static openNextAlert(){
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

  static closeAlert(){
    activeAlert=null;
    openNextAlert();
  }

  static customPrompt(options = {}) {
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

  static async runConfirmationAction(){
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

  static async clearLibrary(){
    if(state.patches.length===0)return;
    $("clearLibraryMessage").textContent = t("confirm_clear_library", {count: state.patches.length});
    $("clearLibraryError").textContent = "";
    $("clearLibraryDialog").hidden = false;
    $("btnCancelClearLibrary").focus();
  }

  static closeClearLibraryDialog(force = false){
    if(!force && $("btnConfirmClearLibrary").disabled)return;
    $("clearLibraryDialog").hidden = true;
  }

  static async confirmClearLibrary(){
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

  static scheduleSave(){
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

  static async loadProjects() {
    const entries = await dbGetAll(STORE_PROJECTS);
    state.projects = entries;
  }

  static async saveProject(project) {
    await dbPutMany(STORE_PROJECTS, [project]);
  }

  static async createProject(name, metadata = {}) {
    const project = {
      id: uid("proj"),
      name: name || t("create_project_default", {number: state.projects.length + 1}),
      patchIds: [],
      startDate: metadata.startDate || undefined,
      endDate: metadata.endDate || undefined,
      description: metadata.description || undefined
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

  static async confirmNewProject() {
    const dialog = $("newProjectDialog");
    const nameInput = $("newProjectName");
    const error = $("newProjectError");
    const confirmButton = $("btnConfirmNewProject");
    const name = nameInput.value.trim();
    const creationMode = document.querySelector('input[name="projectCreationMode"]:checked')?.value || "empty";
    const metadata = {
      startDate: $("newProjectStartDate").value,
      endDate: $("newProjectEndDate").value,
      description: $("newProjectDescription").value.trim()
    };
    if (!name) {
      error.textContent = t("project_name_required");
      nameInput.focus();
      return;
    }
    if (metadata.startDate && metadata.endDate && metadata.endDate < metadata.startDate) {
      error.textContent = t("project_end_date_before_start");
      $("newProjectEndDate").focus();
      return;
    }
    if (creationMode === "generated" && $("btnDemo2")?.disabled) {
      error.textContent = t("demo_generation_busy");
      return;
    }
  
    confirmButton.disabled = true;
    error.textContent = "";
    try {
      if (creationMode === "generated") {
        dialog.hidden = true;
        await createMidiDemoProject(
          [confirmButton, $("btnCancelNewProject"), $("btnDemo2")].filter(Boolean),
          name,
          metadata
        );
      } else {
        await createProject(name, metadata);
        dialog.hidden = true;
      }
    } catch (err) {
      console.error("Create project error:", err);
      error.textContent = t("project_save_failed");
    } finally {
      confirmButton.disabled = false;
    }
  }

  static async deleteProject(id) {
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

  static requestDeleteProject(id) {
    if (isMidiRendering) return;
    const project = state.projects.find(entry => entry.id === id);
    if (!project) return;
    pendingProjectDeletionId = id;
    const first = Math.floor(Math.random() * 40) + 10;
    const second = Math.floor(Math.random() * 40) + 10;
    pendingProjectDeletionChallenge = {first, second, result: first + second};
    $("deleteProjectMessage").textContent = t("confirm_delete_project", {name: project.name});
    $("deleteProjectChallengePrompt").textContent = t("delete_project_challenge_prompt", {first, second});
    $("deleteProjectChallengeAnswer").value = "";
    $("deleteProjectError").textContent = "";
    $("btnConfirmDeleteProject").disabled = true;
    $("deleteProjectDialog").hidden = false;
    $("deleteProjectChallengeAnswer").focus();
  }

  static openProjectPropertiesDialog(projectId) {
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

  static closeProjectPropertiesDialog(force = false) {
    if (!force && $("btnSaveProjectProperties").disabled) return;
    editingProjectPropertiesId = null;
    $("projectPropertiesDialog").hidden = true;
  }

  static async saveProjectProperties() {
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

  static detectProjectSourceFile(project) {
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

  static closeDeleteProjectDialog(force = false) {
    if (!force && $("btnCancelDeleteProject").disabled) return;
    pendingProjectDeletionId = null;
    pendingProjectDeletionChallenge = null;
    $("deleteProjectChallengeAnswer").value = "";
    $("deleteProjectError").textContent = "";
    $("btnConfirmDeleteProject").disabled = false;
    $("deleteProjectDialog").hidden = true;
  }

  static async confirmDeleteProject() {
    if (!pendingProjectDeletionId || !pendingProjectDeletionChallenge) return;
    const answer = $("deleteProjectChallengeAnswer").value.trim();
    if (!answer || !Number.isInteger(Number(answer)) ||
        Number(answer) !== pendingProjectDeletionChallenge.result) {
      $("deleteProjectError").textContent = t("delete_project_challenge_incorrect");
      $("btnConfirmDeleteProject").disabled = true;
      return;
    }
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

  static addCurrentPatchToProject() {
    if (!state.projects.some(project => project.id === state.currentProjectId)) {
      requestProjectForImport();
      return;
    }
    openAddPatchDialog();
  }

  static populateGeneratedProgramOptions() {
    if (!projectPatchGenerator) projectPatchGenerator = new ProjectPatchGenerator();
    const isDrum = $("patchGeneratorType").value === "drum";
    $("patchGeneratorPitchRange").hidden = isDrum;
    $("patchGeneratorPitchHint").hidden = isDrum;
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

  static openAddPatchDialog() {
    $("addPatchError").textContent = "";
    $("patchGeneratorPitchFrom").value = 0;
    $("patchGeneratorPitchTo").value = 127;
    populateGeneratedProgramOptions();
    $("addPatchDialog").hidden = false;
    $("btnChooseProjectPatchFile").focus();
  }

  static closeAddPatchDialog() {
    if ($("btnGenerateProjectPatch").disabled) return;
    $("addPatchDialog").hidden = true;
  }

  static async generateProjectPatch() {
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
      const pitchFromInput = $("patchGeneratorPitchFrom").value.trim();
      const pitchToInput = $("patchGeneratorPitchTo").value.trim();
      const pitchFrom = isDrum ? 0 : (pitchFromInput === "" ? NaN : Number(pitchFromInput));
      const pitchTo = isDrum ? 127 : (pitchToInput === "" ? NaN : Number(pitchToInput));
      const generated = projectPatchGenerator.generate({
        isDrum,
        program: $("patchGeneratorProgram").value,
        pitchFrom,
        pitchTo
      });
      // Tandai semua sampel sebagai auto-generated
      for (const inst of generated.patch.instruments) {
        for (const layer of inst.layers) {
          for (const sample of layer.samples) {
            sample._autoGenerated = true;
            sample._generatorInfo = {
              isDrum: !!isDrum,
              program: generated.program,
              waveform: null,
              pitchFrom: generated.pitchFrom,
              pitchTo: generated.pitchTo
            };
          }
        }
      }
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

  static async handleProjectPatchFile(e) {
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

  static requestProjectForImport() {
    $("projectRequiredDialog").hidden = false;
    $("btnCreateProjectFromRequired").focus();
  }

  static closeProjectRequiredDialog() {
    $("projectRequiredDialog").hidden = true;
  }

  static openNewProjectDialog() {
    const newProjectName = $("newProjectName");
    $("newProjectError").textContent = "";
    document.querySelector('input[name="projectCreationMode"][value="empty"]').checked = true;
    newProjectName.value = t("create_project_default", {number: state.projects.length + 1});
    $("newProjectStartDate").value = "";
    $("newProjectEndDate").value = "";
    $("newProjectDescription").value = "";
    $("newProjectDialog").hidden = false;
    newProjectName.focus();
    newProjectName.select();
  }

  static removePatchFromProject(projectId, patchId) {
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;
    project.patchIds = project.patchIds.filter(id => id !== patchId);
    saveProject(project);
    renderProjects();
  renderLibrary();
  }

  static getProjectPatches(project) {
    return project.patchIds.map(id => state.patches.find(p => p.id === id)).filter(Boolean);
  }

  static renderLibrary(filterProjectId = undefined) {
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

  static selectProject(projectId) {
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

  static renderProjects() {
    const list = $("projectList");
    list.innerHTML = "";
    $("projCount").textContent = state.projects.length;
    if (state.projects.length === 0) {
      list.innerHTML = `<div style="padding:6px;color:var(--dim);font-size:11px;text-align:center">${t("no_project")}</div>`;
      $("btnAddToProject").disabled = true;
      $("btnImportSoundfont").disabled = true;
      $("btnDeleteProject").disabled = true;
      $("btnExportProject").disabled = true;
      $("btnExportProjectSfz").disabled = true;
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
    $("btnExportProjectSfz").disabled = !hasActive;
    $("btnExportProjectSf2").disabled = !hasActive;
  }

  static render(save=true){
    const has=!!state.patch;
    $("welcome").hidden=has; $("workspace").hidden=!has; 
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
      const generatedBadge = s._autoGenerated
        ? `<span class="tag" style="color:#10b981;border-color:#064e3b;">GENERATED</span>`
        : "";
      d.innerHTML=`
        <div class="n">${escapeHtml(s.name||t("unnamed"))}</div>
        <div class="m">
          ${generatedBadge}
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

  static freqToNoteName(freq) {
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

  static openFreqMapDialog() {
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
}
