# MessageFaceSounds for RPG Maker MV

A flexible "Typewriter/Talk Sound" plugin for RPG Maker MV that brings your characters to life by assigning unique sounds and typing speeds to specific face graphics.

## 🚀 Features
- **Face-Specific Audio:** Assign different `.ogg` files to different character faces.
- **Undertale-Style Pitch:** Optional random pitch variation per character to make voices sound natural.
- **Variable Typing Speed:** Set custom text speeds for slow talkers or fast-paced dialogue.
- **Inline Overrides:** Use tags like `{spd:2}` or `{se:SoundName}` directly inside the "Show Text" editor to change behavior on the fly.
- **Input Skipping:** Smart detection that stops sounds when the player fast-forwards text.

## 🛠️ Installation
1. Download the `MessageFaceSounds.js` file.
2. Place it into your project's folder: `js/plugins/`.
3. Open RPG Maker MV and go to the **Plugin Manager** (F10).
4. Add `MessageFaceSounds` to the list and ensure it is set to **ON**.

## 📖 How to Use

### 1. Plugin Parameters
Open the plugin settings in the Plugin Manager to configure:
- **Sound Settings:** Map faces to sounds (e.g., `Actor1:tick:1:m`).
- **Speed Settings:** Map faces to frames (e.g., `Actor1:2`).
- **Default Sound:** The fallback sound if no face is assigned.

### 2. In-Game Tags
You can override settings inside any "Show Text" event:
- `{spd:10}` - Makes the current message very slow.
- `{se:Bell1:1:l}` - Changes the sound to "Bell1" with a large random pitch range.

## 📜 License
This plugin is released under the MIT License. Feel free to use it in both free and commercial projects.
