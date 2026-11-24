# GUS Patch Generator User Manual

## Overview

GUS Patch Generator creates Gravis Ultrasound `.pat` patches for 128 General MIDI melodic instruments and the available drum instruments. Use the instrument preview, edit presets, play MIDI files, or test an instrument with the built-in sequencer.

## Projects

Projects keep instrument selections, generator settings, and custom preset changes separate from one another. Project data is saved in IndexedDB in the browser and site origin where JSGUS is running. It is separate from the project data used by the application at the workspace root.

- Use the **Project** selector to switch projects.
- Select **New project**, enter a name, and choose **Create** to make a project with default settings.
- Select **Edit Project** to update the active project's name, description, year created, and creator name. The name is required; the other details are optional.
- Select **Reset saved state** to clear generator settings and custom presets in the active project while keeping the project itself. Solve the arithmetic challenge to confirm.
- Select **Delete project** to remove the active project and its saved settings. Solve the arithmetic challenge to confirm. The last remaining project cannot be deleted.

Do not clear the browser's site data if you want to keep locally stored projects.

## Choose and Preview an Instrument

Use the **Melodic** and **Drum Kit** tabs in the instrument list. Search by instrument name with the search field, then select an instrument to load it into the editor.

Press **F2** anywhere in the app to focus the instrument search and select its current text. The search query is restored after a page reload.

For melodic instruments, choose a base waveform, sample rate, root frequency, and duration. Waveform selection is unavailable for drums. Available harmonic profiles include sine, triangle, square, saw, pulse, organ, flute, clarinet, reed, string, bell, pluck, hammer, bow, and breath. The waveform canvas shows the generated preview. Use **Zoom In** and **Zoom Out** to double or halve the vertical scale (1× to 64×); **Reset** returns it to 1×. The zoom level is saved across instrument changes and page reloads.

- **Play C4** previews the selected instrument. For a drum, it plays the selected drum sound.
- **Scale** plays a short scale for melodic instruments or a sequence of drum sounds for a drum selection.
- **Stop** stops the preview.
- **Download .pat** downloads a patch for the selected instrument with multiple pitch zones. Melodic programs use the melodic ranges, bass programs use the bass ranges, and drum patches cover MIDI pitches 1–127.
- **Download All (ZIP)** generates a ZIP containing the melodic and drum patches and their configuration files.
- **Download SF2** builds a SoundFont 2 file from the active project's melodic and drum presets and generator settings. It contains the 128 melodic programs and a GM drum bank. The download uses the active project name.
- **Export Melodic Preset** and **Export Drum Preset** download the corresponding preset sets as JSON.
- **Import Melodic Preset** and **Import Drum Preset** load JSON archives created by the matching export buttons into the active project. Matching instrument presets are replaced; presets not present in the file are kept. Invalid or unknown entries are skipped, and an import with no valid entries is rejected. If the currently selected instrument is included, its editor, preview, and loaded MIDI patch are refreshed.

## Edit Presets

The **Instrument Preset** editor displays JSON for the selected instrument. Edit the JSON and choose **Apply preset** to validate it, regenerate the patch, and update MIDI playback. Invalid JSON cannot be applied.

Use **Copy** and **Paste** below the JSON editor to transfer its text. **Export JSON** and **Import JSON** are in the instrument action row and are available in both Form and JSON modes. Importing replaces the editor draft and updates the form view; apply it with **Apply Preset** unless Auto Apply is on. If clipboard read access is denied, focus the JSON editor and use Ctrl+V.

Turn **Auto apply** on to apply valid edits automatically after a short pause. Turn it off to return to manual application. **Reset to factory preset** restores only the selected instrument's factory preset.

Preset edits are saved in the active project.

## Use the Graphic Equalizer

Select **Graphic Equalizer** in the instrument editor to adjust the selected instrument's rendered sound. The button is available when the preset contains a `graphicEqualizer` property. The MIDI mixer also has an equalizer icon beside each channel's instrument; it selects that channel's instrument in the editor and opens its equalizer.

The equalizer has ten bands, from 31 Hz to 16 kHz. Each band ranges from -12 dB to +12 dB in 0.01 dB steps. Built-in presets start with every band at 0 dB.

- Select **Reset to 0 dB** and confirm to return all bands to zero.
- Select **Apply EQ** to apply the changes to the preset and regenerate its samples. This updates the rendered PCM used for playback and for `.pat`, ZIP, and SF2 exports; the equalizer is not limited to playback.
- **Apply EQ** leaves the equalizer open. Select **Close** when you are done.

The applied equalizer settings are saved with the preset in the active project.

## Play a MIDI File

In **MIDI Playback**, select the **MIDI file** mode and choose a `.mid` or `.midi` file.

- **Play** starts playback; while playing, the button becomes **Pause**.
- **Stop** stops playback and returns the position to the beginning.
- Use the seek slider to move through the song.
- Adjust **Volume** from 0% to 100%; changes take effect during playback.
- Choose **Render WAV** to render and download the loaded MIDI file as a WAV.
- Choose **Render Stem Stereo (FLAC)** or **Render Stem Mono (FLAC)** to download a ZIP of individual FLAC files. MIDI Type 1 files are split by track; Type 0 files are split by channel. Mono stems contain one audio channel, with MIDI pan (CC 10) events removed.

After a MIDI file loads, **Instruments used** lists the melodic instruments and drum sounds it uses. The **Channels** list provides two controls for each channel:

- **M** mutes that channel.
- **S** solos that channel. Multiple channels can be soloed; while any Solo is active, non-solo channels are muted. Mute remains in effect on a channel even if it is also soloed.

## Use the MIDI Mixer

The MIDI mixer is a supplementary tool for auditioning channel levels. **Its primary purpose is to determine the appropriate gain for each instrument in a song—not to remix the song.** Start with a MIDI file whose arrangement and mix are already the ones you want, and use that as the reference. Use the mixer's **Volume** and **Expression** controls to audition each instrument/channel and find a suitable gain. **Pan** is also available as a playback control, but the mixer is not intended to rebuild or replace the song's arrangement or mix.

Open **Mixer** after loading a MIDI file. The mixer shows the channels used by that file. Its controls follow the MIDI's Volume, Expression, and Pan automation during playback and when seeking. Manual slider changes are sent to the player for auditioning; they do not modify the source MIDI file.

Use the **M** and **S** buttons beside a channel to mute or solo it. These buttons share their state with the corresponding controls in the **Channels** list, so changes in either location are reflected in the other.

## Use the Sequencer

Select **Sequencer** in MIDI Playback. The sequencer uses the instrument currently selected in the instrument list.

- For a melodic instrument, it repeats C4, D4, E4, and F4.
- For a drum instrument, it repeatedly plays that instrument's MIDI pitch.
- Set **Tempo** from 40 to 240 BPM and **Velocity** from 1 to 127 before starting.
- The **Play Sequence** button changes to **Pause** while playing and **Resume** while paused.
- Each note lasts one beat. Tempo is locked while the sequencer is running; velocity remains adjustable.
- You can change the selected instrument during playback. The sequencer switches to it without requiring a stop.
- Select **Stop** to end the sequence.

## Tips

- Choose the instrument before editing its preset so the editor applies changes to the intended instrument.
- Use separate projects for different preset experiments.
- If a project is missing, check that JSGUS is open under the same browser origin and that the browser's site data has not been cleared.