# GUS
GUS Patch Editor

## Languages

The editor supports Indonesian and English. Language strings are stored in `assets/locales/id.json` and `assets/locales/en.json`; add matching snake_case keys to both files when introducing translatable UI text.

In `index.html`, use `{{key}}` for translatable content. Translatable attributes use an explicit `data-i18n-<attribute>` marker, such as `data-i18n-placeholder="project_name_placeholder"`. Runtime-generated messages use the `t()` helper in `assets/js/script.js`.

Run the editor from a local web server so the browser can fetch the locale JSON files.
