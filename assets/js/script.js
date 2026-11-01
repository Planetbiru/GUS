"use strict";

/* ---------- Konstanta ---------- */
const MAGIC = "GF1PATCH110", GRAVIS_ID = "ID#000002";
const M16=0x01, MUNS=0x02, MLOOP=0x04, MPING=0x08, MREV=0x10, MSUS=0x20, MENV=0x40, MCLAMP=0x80;
const MODE_LABELS=[[M16,"mode_16_bit"],[MUNS,"mode_unsigned"],[MLOOP,"mode_loop"],[MPING,"mode_ping_pong"],[MREV,"mode_reverse"],[MSUS,"mode_sustain"],[MENV,"mode_envelope"],[MCLAMP,"mode_clamped_release"]];
const $ = id => document.getElementById(id);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const midiToFreq = n => 440 * Math.pow(2, (n-69)/12);

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

let editingProjectPropertiesId = null;

/* ---------- Localization ---------- */
let locale = "en";
try {
  locale = localStorage.getItem("gus-patch-editor-locale") || "en";
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
const activeDrumPreviewNotes = new Map();
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


/* ---------- IndexedDB ---------- */
const DB_NAME="gus-patch-editor-2", DB_VER=2, STORE="patches", STORE_PROJECTS="projects";
let bankDragSource = null;
let bankConfigSaveTimer = null;
let pendingBankConfigPatches = new Set();
let cctx=null;
let activeCustomPrompt = null;
const patchBufferCache = new Map();

const midiProgress = {
  playing: false,
  paused: false,
  startTime: 0,
  current: 0,
  duration: 0,
  raf: null,
  seeking: false
};


let midiUsedPatchesRerenderScheduled = false;
const crcTable = new Uint32Array(256);

for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[i] = c;
}

let lastBank = 0;
const MIN_PAT_SIZE = 100;
let applyBankGeneration = 0;
let bankSwitchTimer = null;
let isLoadingBank = false;

/* ---------- Class delegates ---------- */
function t(...args) { return ApplicationController.t.apply(this, args); }
function localizeElement(...args) { return ApplicationController.localizeElement.apply(this, args); }
function applyLocalization(...args) { return ApplicationController.applyLocalization.apply(this, args); }
function initLocalization(...args) { return ApplicationController.initLocalization.apply(this, args); }
function setLanguage(...args) { return ApplicationController.setLanguage.apply(this, args); }
function decodeAscii(...args) { return ApplicationController.decodeAscii.apply(this, args); }
function encodeAscii(...args) { return ApplicationController.encodeAscii.apply(this, args); }
function showStatus(...args) { return ApplicationController.showStatus.apply(this, args); }
function setMidiStatus(...args) { return ApplicationController.setMidiStatus.apply(this, args); }
function setBankStatus(...args) { return ApplicationController.setBankStatus.apply(this, args); }
function fmtBytes(...args) { return ApplicationController.fmtBytes.apply(this, args); }
function escapeHtml(...args) { return ApplicationController.escapeHtml.apply(this, args); }
function uid(...args) { return ApplicationController.uid.apply(this, args); }
function sanitizeFilename(...args) { return ApplicationController.sanitizeFilename.apply(this, args); }
function openDB(...args) { return ApplicationController.openDB.apply(this, args); }
function dbPutMany(...args) { return ApplicationController.dbPutMany.apply(this, args); }
function dbGetAll(...args) { return ApplicationController.dbGetAll.apply(this, args); }
function dbDeleteProjectAndPatches(...args) { return ApplicationController.dbDeleteProjectAndPatches.apply(this, args); }
function dbDeletePatchAndUpdateProjects(...args) { return ApplicationController.dbDeletePatchAndUpdateProjects.apply(this, args); }
function dbSaveProjectAndPatches(...args) { return ApplicationController.dbSaveProjectAndPatches.apply(this, args); }
function dbClearLibraryAndProjects(...args) { return ApplicationController.dbClearLibraryAndProjects.apply(this, args); }
function cleanSampleForStorage(...args) { return ApplicationController.cleanSampleForStorage.apply(this, args); }
function cleanPatchForStorage(...args) { return ApplicationController.cleanPatchForStorage.apply(this, args); }
function cleanEntryForStorage(...args) { return ApplicationController.cleanEntryForStorage.apply(this, args); }
function capSampleRateTo65535(...args) { return PatchDataService.capSampleRateTo65535.apply(this, args); }
function parsePAT(...args) { return PatchDataService.parsePAT.apply(this, args); }
function hzToPeriod(...args) { return PatchDataService.hzToPeriod.apply(this, args); }
function periodToHz(...args) { return PatchDataService.periodToHz.apply(this, args); }
function writePAT(...args) { return PatchDataService.writePAT.apply(this, args); }
function fmt(...args) { return PatchDataService.fmt.apply(this, args); }
function pcmToFloat(...args) { return PatchDataService.pcmToFloat.apply(this, args); }
function floatToPcm(...args) { return PatchDataService.floatToPcm.apply(this, args); }
function computeSf2Pitch(...args) { return PatchDataService.computeSf2Pitch.apply(this, args); }
function ensureFloat(...args) { return PatchDataService.ensureFloat.apply(this, args); }
function commitFloat(...args) { return PatchDataService.commitFloat.apply(this, args); }
function loopInfo(...args) { return PatchDataService.loopInfo.apply(this, args); }
function encodeWav(...args) { return PatchDataService.encodeWav.apply(this, args); }
function decodeWav(...args) { return PatchDataService.decodeWav.apply(this, args); }
function parseSF2(...args) { return PatchDataService.parseSF2.apply(this, args); }
function sf2ToGusPatches(...args) { return PatchDataService.sf2ToGusPatches.apply(this, args); }
function initBankFields(...args) { return BankController.initBankFields.apply(this, args); }
function getProjectPatchEntries(...args) { return BankController.getProjectPatchEntries.apply(this, args); }
function generateProjectTimidityCfgForZip(...args) { return BankController.generateProjectTimidityCfgForZip.apply(this, args); }
function renderBankManager(...args) { return BankController.renderBankManager.apply(this, args); }
function refreshBankOrder(...args) { return BankController.refreshBankOrder.apply(this, args); }
function scheduleBankConfigSave(...args) { return BankController.scheduleBankConfigSave.apply(this, args); }
function bindBankManagerEvents(...args) { return BankController.bindBankManagerEvents.apply(this, args); }
function updateUserOrderFromDom(...args) { return BankController.updateUserOrderFromDom.apply(this, args); }
function saveProjectBankConfig(...args) { return BankController.saveProjectBankConfig.apply(this, args); }
function compactBanks(...args) { return BankController.compactBanks.apply(this, args); }
function exportBanks(...args) { return BankController.exportBanks.apply(this, args); }
function ensureAudio(...args) { return EditorController.ensureAudio.apply(this, args); }
function gusEnvMs(...args) { return EditorController.gusEnvMs.apply(this, args); }
function computeEnv(...args) { return EditorController.computeEnv.apply(this, args); }
function rootHz(...args) { return EditorController.rootHz.apply(this, args); }
function playSample(...args) { return EditorController.playSample.apply(this, args); }
function releaseVoice(...args) { return EditorController.releaseVoice.apply(this, args); }
function releaseAllVoices(...args) { return EditorController.releaseAllVoices.apply(this, args); }
function stopAllVoices(...args) { return EditorController.stopAllVoices.apply(this, args); }
function clampView(...args) { return EditorController.clampView.apply(this, args); }
function updateZoomUI(...args) { return EditorController.updateZoomUI.apply(this, args); }
function zoomCanvas(...args) { return EditorController.zoomCanvas.apply(this, args); }
function smpToX(...args) { return EditorController.smpToX.apply(this, args); }
function xToSmp(...args) { return EditorController.xToSmp.apply(this, args); }
function drawWave(...args) { return EditorController.drawWave.apply(this, args); }
function canvasPt(...args) { return EditorController.canvasPt.apply(this, args); }
function yToAmp(...args) { return EditorController.yToAmp.apply(this, args); }
function pushUndo(...args) { return EditorController.pushUndo.apply(this, args); }
function undo(...args) { return EditorController.undo.apply(this, args); }
function editRange(...args) { return EditorController.editRange.apply(this, args); }
function applyEdit(...args) { return EditorController.applyEdit.apply(this, args); }
function generatePureWaveformSample(...args) { return EditorController.generatePureWaveformSample.apply(this, args); }
function generateWaveformDraft(...args) { return EditorController.generateWaveformDraft.apply(this, args); }
function regenerateSample(...args) { return EditorController.regenerateSample.apply(this, args); }
function bindCanvas(...args) { return EditorController.bindCanvas.apply(this, args); }
function addPatchEntries(...args) { return ProjectController.addPatchEntries.apply(this, args); }
function selectPatch(...args) { return ProjectController.selectPatch.apply(this, args); }
function deletePatchById(...args) { return ProjectController.deletePatchById.apply(this, args); }
function removePatchById(...args) { return ProjectController.removePatchById.apply(this, args); }
function openConfirmationDialog(...args) { return ProjectController.openConfirmationDialog.apply(this, args); }
function closeConfirmationDialog(...args) { return ProjectController.closeConfirmationDialog.apply(this, args); }
function showAlert(...args) { return ProjectController.showAlert.apply(this, args); }
function openNextAlert(...args) { return ProjectController.openNextAlert.apply(this, args); }
function closeAlert(...args) { return ProjectController.closeAlert.apply(this, args); }
function customPrompt(...args) { return ProjectController.customPrompt.apply(this, args); }
function runConfirmationAction(...args) { return ProjectController.runConfirmationAction.apply(this, args); }
function clearLibrary(...args) { return ProjectController.clearLibrary.apply(this, args); }
function closeClearLibraryDialog(...args) { return ProjectController.closeClearLibraryDialog.apply(this, args); }
function confirmClearLibrary(...args) { return ProjectController.confirmClearLibrary.apply(this, args); }
function scheduleSave(...args) { return ProjectController.scheduleSave.apply(this, args); }
function loadProjects(...args) { return ProjectController.loadProjects.apply(this, args); }
function saveProject(...args) { return ProjectController.saveProject.apply(this, args); }
function createProject(...args) { return ProjectController.createProject.apply(this, args); }
function confirmNewProject(...args) { return ProjectController.confirmNewProject.apply(this, args); }
function deleteProject(...args) { return ProjectController.deleteProject.apply(this, args); }
function requestDeleteProject(...args) { return ProjectController.requestDeleteProject.apply(this, args); }
function openProjectPropertiesDialog(...args) { return ProjectController.openProjectPropertiesDialog.apply(this, args); }
function closeProjectPropertiesDialog(...args) { return ProjectController.closeProjectPropertiesDialog.apply(this, args); }
function saveProjectProperties(...args) { return ProjectController.saveProjectProperties.apply(this, args); }
function detectProjectSourceFile(...args) { return ProjectController.detectProjectSourceFile.apply(this, args); }
function closeDeleteProjectDialog(...args) { return ProjectController.closeDeleteProjectDialog.apply(this, args); }
function confirmDeleteProject(...args) { return ProjectController.confirmDeleteProject.apply(this, args); }
function addCurrentPatchToProject(...args) { return ProjectController.addCurrentPatchToProject.apply(this, args); }
function populateGeneratedProgramOptions(...args) { return ProjectController.populateGeneratedProgramOptions.apply(this, args); }
function openAddPatchDialog(...args) { return ProjectController.openAddPatchDialog.apply(this, args); }
function closeAddPatchDialog(...args) { return ProjectController.closeAddPatchDialog.apply(this, args); }
function generateProjectPatch(...args) { return ProjectController.generateProjectPatch.apply(this, args); }
function handleProjectPatchFile(...args) { return ProjectController.handleProjectPatchFile.apply(this, args); }
function requestProjectForImport(...args) { return ProjectController.requestProjectForImport.apply(this, args); }
function closeProjectRequiredDialog(...args) { return ProjectController.closeProjectRequiredDialog.apply(this, args); }
function openNewProjectDialog(...args) { return ProjectController.openNewProjectDialog.apply(this, args); }
function removePatchFromProject(...args) { return ProjectController.removePatchFromProject.apply(this, args); }
function getProjectPatches(...args) { return ProjectController.getProjectPatches.apply(this, args); }
function resamplePcmTo(...args) { return PatchDataService.resamplePcmTo.apply(this, args); }
function validateAndSanitizePatch(...args) { return PatchDataService.validateAndSanitizePatch.apply(this, args); }
function isPatchSafeForTimidity(...args) { return PatchDataService.isPatchSafeForTimidity.apply(this, args); }
function createSilentPatch(...args) { return PatchDataService.createSilentPatch.apply(this, args); }
function writeTimidityPatch(...args) { return PatchDataService.writeTimidityPatch.apply(this, args); }
function generateProjectTimidityCfg(...args) { return MidiController.generateProjectTimidityCfg.apply(this, args); }
function exportProjectToSF2(...args) { return MidiController.exportProjectToSF2.apply(this, args); }
function exportProjectWithConfig(...args) { return MidiController.exportProjectWithConfig.apply(this, args); }
function invalidateTimidityPlayer(...args) { return MidiController.invalidateTimidityPlayer.apply(this, args); }
function getProjectPatchData(...args) { return MidiController.getProjectPatchData.apply(this, args); }
function ensureTimidityPlayer(...args) { return MidiController.ensureTimidityPlayer.apply(this, args); }
function loadMidiFile(...args) { return MidiController.loadMidiFile.apply(this, args); }
function renderMidiToWav(...args) { return MidiController.renderMidiToWav.apply(this, args); }
function resetMidiUsedPatches(...args) { return MidiController.resetMidiUsedPatches.apply(this, args); }
function scheduleMidiUsedPatchesRerender(...args) { return MidiController.scheduleMidiUsedPatchesRerender.apply(this, args); }
function renderMidiUsedPatchesList(...args) { return MidiController.renderMidiUsedPatchesList.apply(this, args); }
function openMidiUsedPatchesDialog(...args) { return MidiController.openMidiUsedPatchesDialog.apply(this, args); }
function closeMidiUsedPatchesDialog(...args) { return MidiController.closeMidiUsedPatchesDialog.apply(this, args); }
function openDrumKitPreviewDialog(...args) { return MidiController.openDrumKitPreviewDialog.apply(this, args); }
function closeDrumKitPreviewDialog(...args) { return MidiController.closeDrumKitPreviewDialog.apply(this, args); }
function renderDrumKitPreviewNotes(...args) { return MidiController.renderDrumKitPreviewNotes.apply(this, args); }
function handleDrumKitPreviewClick(...args) { return MidiController.handleDrumKitPreviewClick.apply(this, args); }
function getUsedMidiPrograms(...args) { return MidiController.getUsedMidiPrograms.apply(this, args); }
function getNiceTickStep(...args) { return MidiController.getNiceTickStep.apply(this, args); }
function parseMidiTimeline(...args) { return MidiController.parseMidiTimeline.apply(this, args); }
function openMidiTimelineDialog(...args) { return MidiController.openMidiTimelineDialog.apply(this, args); }
function onNoteOn(...args) { return MidiController.onNoteOn.apply(this, args); }
function onNoteOff(...args) { return MidiController.onNoteOff.apply(this, args); }
function allChannelOff(...args) { return MidiController.allChannelOff.apply(this, args); }
function selectPatchFromTimeline(...args) { return MidiController.selectPatchFromTimeline.apply(this, args); }
function closeMidiTimelineDialog(...args) { return MidiController.closeMidiTimelineDialog.apply(this, args); }
function getPlayheadTick(...args) { return MidiController.getPlayheadTick.apply(this, args); }
function seekToTick(...args) { return MidiController.seekToTick.apply(this, args); }
function updateTimelinePlayhead(...args) { return MidiController.updateTimelinePlayhead.apply(this, args); }
function populateMidiUsedPatchesFromScan(...args) { return MidiController.populateMidiUsedPatchesFromScan.apply(this, args); }
function calculateMidiDuration(...args) { return MidiController.calculateMidiDuration.apply(this, args); }
function formatTime(...args) { return MidiController.formatTime.apply(this, args); }
function updateTimelinePlayButton(...args) { return MidiController.updateTimelinePlayButton.apply(this, args); }
function updateMidiUI(...args) { return MidiController.updateMidiUI.apply(this, args); }
function applyMidiVolume(...args) { return MidiController.applyMidiVolume.apply(this, args); }
function isMidiChannelAudible(...args) { return MidiController.isMidiChannelAudible.apply(this, args); }
function applyMidiMuteSolo(...args) { return MidiController.applyMidiMuteSolo.apply(this, args); }
function scheduleMuteReapply(...args) { return MidiController.scheduleMuteReapply.apply(this, args); }
function refreshMuteSoloButtons(...args) { return MidiController.refreshMuteSoloButtons.apply(this, args); }
function updateTimelineMutedVisuals(...args) { return MidiController.updateTimelineMutedVisuals.apply(this, args); }
function togglePauseMidi(...args) { return MidiController.togglePauseMidi.apply(this, args); }
function playMidi(...args) { return MidiController.playMidi.apply(this, args); }
function stopMidi(...args) { return MidiController.stopMidi.apply(this, args); }
function exportPatchById(...args) { return BankController.exportPatchById.apply(this, args); }
function exportProject(...args) { return BankController.exportProject.apply(this, args); }
function openExportBanksDialog(...args) { return BankController.openExportBanksDialog.apply(this, args); }
function updateExportSelectAll(...args) { return BankController.updateExportSelectAll.apply(this, args); }
function closeExportBanksDialog(...args) { return BankController.closeExportBanksDialog.apply(this, args); }
function exportAllPatches(...args) { return BankController.exportAllPatches.apply(this, args); }
function exportInstrument(...args) { return BankController.exportInstrument.apply(this, args); }
function crc32(...args) { return BankController.crc32.apply(this, args); }
function writeU16(...args) { return BankController.writeU16.apply(this, args); }
function writeU32(...args) { return BankController.writeU32.apply(this, args); }
function createZip(...args) { return BankController.createZip.apply(this, args); }
function getAvailableBanks(...args) { return BankController.getAvailableBanks.apply(this, args); }
function openBankSelectDialog(...args) { return BankController.openBankSelectDialog.apply(this, args); }
function openBankBreakdownDialog(...args) { return BankController.openBankBreakdownDialog.apply(this, args); }
function isPatchBroken(...args) { return BankController.isPatchBroken.apply(this, args); }
function deletePatchFromBreakdown(...args) { return BankController.deletePatchFromBreakdown.apply(this, args); }
function getPatchSize(...args) { return BankController.getPatchSize.apply(this, args); }
function closeBankBreakdownDialog(...args) { return BankController.closeBankBreakdownDialog.apply(this, args); }
function applyBankToPlayer(...args) { return BankController.applyBankToPlayer.apply(this, args); }
function closeBankSelectDialog(...args) { return BankController.closeBankSelectDialog.apply(this, args); }
function applyBankToPlayerAsync(...args) { return BankController.applyBankToPlayerAsync.apply(this, args); }
function getPatchesForBank(...args) { return BankController.getPatchesForBank.apply(this, args); }
function allSamples(...args) { return BankController.allSamples.apply(this, args); }
function renderLibrary(...args) { return ProjectController.renderLibrary.apply(this, args); }
function selectProject(...args) { return ProjectController.selectProject.apply(this, args); }
function renderProjects(...args) { return ProjectController.renderProjects.apply(this, args); }
function render(...args) { return ProjectController.render.apply(this, args); }
function freqToNoteName(...args) { return ProjectController.freqToNoteName.apply(this, args); }
function openFreqMapDialog(...args) { return ProjectController.openFreqMapDialog.apply(this, args); }
function renderSampleEditor(...args) { return EditorController.renderSampleEditor.apply(this, args); }
function populateAddSampleProgramOptions(...args) { return EditorController.populateAddSampleProgramOptions.apply(this, args); }
function openAddSampleDialog(...args) { return EditorController.openAddSampleDialog.apply(this, args); }
function clearSampleRecordingTimer(...args) { return EditorController.clearSampleRecordingTimer.apply(this, args); }
function stopSampleRecordingTracks(...args) { return EditorController.stopSampleRecordingTracks.apply(this, args); }
function closeAddSampleDialog(...args) { return EditorController.closeAddSampleDialog.apply(this, args); }
function updateSampleRecordingTimer(...args) { return EditorController.updateSampleRecordingTimer.apply(this, args); }
function decodeSampleBlob(...args) { return EditorController.decodeSampleBlob.apply(this, args); }
function monoSampleBuffer(...args) { return EditorController.monoSampleBuffer.apply(this, args); }
function estimateEnvelopeOffsets(...args) { return EditorController.estimateEnvelopeOffsets.apply(this, args); }
function estimateRootFrequency(...args) { return EditorController.estimateRootFrequency.apply(this, args); }
function buildSampleDraft(...args) { return EditorController.buildSampleDraft.apply(this, args); }
function populateAddSampleParameters(...args) { return EditorController.populateAddSampleParameters.apply(this, args); }
function loadSampleDraft(...args) { return EditorController.loadSampleDraft.apply(this, args); }
function startSampleRecording(...args) { return EditorController.startSampleRecording.apply(this, args); }
function stopSampleRecording(...args) { return EditorController.stopSampleRecording.apply(this, args); }
function addSampleToPatch(...args) { return EditorController.addSampleToPatch.apply(this, args); }
function requestMidiDemoProject(...args) { return MidiController.requestMidiDemoProject.apply(this, args); }
function closeDemoProjectDialog(...args) { return MidiController.closeDemoProjectDialog.apply(this, args); }
function confirmDemoProject(...args) { return MidiController.confirmDemoProject.apply(this, args); }
function createMidiDemoProject(...args) { return MidiController.createMidiDemoProject.apply(this, args); }
function readZip(...args) { return PatchDataService.readZip.apply(this, args); }
function extractFile(...args) { return PatchDataService.extractFile.apply(this, args); }
function normalizePath(...args) { return PatchDataService.normalizePath.apply(this, args); }
function resolvePath(...args) { return PatchDataService.resolvePath.apply(this, args); }
function zipDirname(...args) { return PatchDataService.zipDirname.apply(this, args); }
function detectWrapperFolder(...args) { return PatchDataService.detectWrapperFolder.apply(this, args); }
function parseTimidityCfg(...args) { return PatchDataService.parseTimidityCfg.apply(this, args); }
function parseUltramidIni(...args) { return PatchDataService.parseUltramidIni.apply(this, args); }
function zipBasename(...args) { return PatchDataService.zipBasename.apply(this, args); }
function normalizeBasenameKey(...args) { return PatchDataService.normalizeBasenameKey.apply(this, args); }
function findConfigFileCandidates(...args) { return PatchDataService.findConfigFileCandidates.apply(this, args); }
function findPatchFileInZip(...args) { return PatchDataService.findPatchFileInZip.apply(this, args); }
function tokenizeSfzLine(...args) { return PatchDataService.tokenizeSfzLine.apply(this, args); }
function parseSfzText(...args) { return PatchDataService.parseSfzText.apply(this, args); }
function mergeSfzOpcodes(...args) { return PatchDataService.mergeSfzOpcodes.apply(this, args); }
function detectSfzDrumKit(...args) { return PatchDataService.detectSfzDrumKit.apply(this, args); }
function findAudioFileInZip(...args) { return PatchDataService.findAudioFileInZip.apply(this, args); }
function applySfzToSample(...args) { return PatchDataService.applySfzToSample.apply(this, args); }
function sfzToGusEntries(...args) { return PatchDataService.sfzToGusEntries.apply(this, args); }
function handleSfzZip(...args) { return PatchDataService.handleSfzZip.apply(this, args); }
function handleZipOpen(...args) { return PatchDataService.handleZipOpen.apply(this, args); }
function detectFileType(...args) { return PatchDataService.detectFileType.apply(this, args); }
function getImportedPatchName(...args) { return PatchDataService.getImportedPatchName.apply(this, args); }
function getPatchDisplayName(...args) { return PatchDataService.getPatchDisplayName.apply(this, args); }
function handleFileOpen(...args) { return PatchDataService.handleFileOpen.apply(this, args); }
function savePAT(...args) { return EditorController.savePAT.apply(this, args); }
function exportWav(...args) { return EditorController.exportWav.apply(this, args); }
function importWav(...args) { return EditorController.importWav.apply(this, args); }
function enableMidi(...args) { return EditorController.enableMidi.apply(this, args); }
function disableMidi(...args) { return EditorController.disableMidi.apply(this, args); }
function refreshMidiInputs(...args) { return EditorController.refreshMidiInputs.apply(this, args); }
function handleMidiMessage(...args) { return EditorController.handleMidiMessage.apply(this, args); }
function bytesToBase64(...args) { return EditorController.bytesToBase64.apply(this, args); }
function base64ToBytes(...args) { return EditorController.base64ToBytes.apply(this, args); }
function exportSampleToJson(...args) { return EditorController.exportSampleToJson.apply(this, args); }
function parseSampleJsonText(...args) { return EditorController.parseSampleJsonText.apply(this, args); }
function exportCurrentSampleJson(...args) { return EditorController.exportCurrentSampleJson.apply(this, args); }
function addImportedSampleToPatch(...args) { return EditorController.addImportedSampleToPatch.apply(this, args); }
function importSampleFromJsonFile(...args) { return EditorController.importSampleFromJsonFile.apply(this, args); }
function midiJsNoteToNumber(...args) { return PatchDataService.midiJsNoteToNumber.apply(this, args); }
function midiJsSampleName(...args) { return PatchDataService.midiJsSampleName.apply(this, args); }
function findMatchingBrace(...args) { return PatchDataService.findMatchingBrace.apply(this, args); }
function parseMidiJsSoundfont(...args) { return PatchDataService.parseMidiJsSoundfont.apply(this, args); }
function createDecodeContext(...args) { return PatchDataService.createDecodeContext.apply(this, args); }
function decodeBase64AudioToMono16(...args) { return PatchDataService.decodeBase64AudioToMono16.apply(this, args); }
function midiJsInstrumentToEntry(...args) { return PatchDataService.midiJsInstrumentToEntry.apply(this, args); }
function handleMidiJsImport(...args) { return PatchDataService.handleMidiJsImport.apply(this, args); }
function importMidiJsFromUrl(...args) { return MidiController.importMidiJsFromUrl.apply(this, args); }
function findPatchInBank0(...args) { return MidiController.findPatchInBank0.apply(this, args); }
function renderGmMap(...args) { return MidiController.renderGmMap.apply(this, args); }
function openGmMapDialog(...args) { return MidiController.openGmMapDialog.apply(this, args); }
function closeGmMapDialog(...args) { return MidiController.closeGmMapDialog.apply(this, args); }
function bind(...args) { return ApplicationController.bind.apply(this, args); }
function makeModalDraggable(...args) { return ApplicationController.makeModalDraggable.apply(this, args); }
function initModalDragging(...args) { return ApplicationController.initModalDragging.apply(this, args); }
function hideAppLoadingOverlay(...args) { return ApplicationController.hideAppLoadingOverlay.apply(this, args); }

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