# MessageFaceSounds for RPG Maker MV
**Author:** DuiDwi  
**Version:** 1.0  
**Engine:** RPG Maker MV

A flexible "Typewriter / Talk Sound" plugin that brings characters to life by assigning unique sounds, pitch variation, and custom typing speeds to specific face graphics — all configurable per-face in the Plugin Manager, and overridable per-dialogue right inside the Show Text editor.

---

## 🚀 Features

- **Face-Specific Audio:** Assign a different `.ogg` SE to each face image.
- **Undertale-Style Pitch Variation:** Optional random pitch per character so voices sound natural and alive.
- **Two Pitch Ranges:** Mid (subtle) or Large (dramatic) variation.
- **Variable Typing Speed:** Set custom frames-per-character for each face — slow mystic talkers, fast-paced action scenes, anything.
- **Inline Overrides:** Use `{spd:N}` and `{se:...}` tags directly inside the Show Text editor to override settings for one specific message box.
- **Input Skipping:** Pressing OK/Return immediately cancels the per-character wait and fast-forwards the text (sounds also stop during fast-forward).
- **SE Play Mode:** Choose between `cut` (short click-style, restarts per character) or `overlap` (full playback, sounds layer).

---

## 🛠️ Installation

1. Download `MessageFaceSounds.js`.
2. Place it inside your project's `js/plugins/` folder.
3. In RPG Maker MV, open the **Plugin Manager** (`F10`).
4. Click an empty row, select `MessageFaceSounds`, and set it to **ON**.
5. Configure the parameters (see below).

---

## 📖 Plugin Parameters — Full Reference

Open the plugin in the Plugin Manager and set each parameter:

---

### Sound Settings
**Format:** `FaceName:SoundName:RandomPitch:Range`  
Separate multiple entries with commas.

| Field | Required? | Values | Description |
|---|---|---|---|
| `FaceName` | ✅ Yes | e.g. `Actor1` | Exact filename of the face image (no `.png`) |
| `SoundName` | ✅ Yes | e.g. `Cancel2` | SE filename inside `audio/se/` (no `.ogg`) |
| `RandomPitch` | ❌ Optional | `1` or `0` | `1` = random pitch per character, `0` = fixed at 100. Falls back to **Default Random Pitch** if omitted. |
| `Range` | ❌ Optional | `m` or `l` | Pitch variation range. `m` = mid (88–112), `l` = large (70–130). Falls back to **Default Pitch Range** if omitted. Only relevant when RandomPitch is `1`. |

**Examples:**
```
Actor1:Cancel2:1:l            → Actor1 plays Cancel2, random pitch, large range
Actor2:Cancel1:1:m            → Actor2 plays Cancel1, random pitch, mid range
Hero:Decision1:0              → Hero plays Decision1, fixed pitch always
Villain:Buzzer1               → Villain plays Buzzer1, pitch follows plugin defaults
Actor1:Cancel2:1:l, Actor2:Cancel1:1:m, Hero:Decision1:0
```

---

### Default Sound
The SE to play when the current face has **no entry in Sound Settings** (e.g. a face-less message, or a face you haven't mapped).

```
Default Sound = Applause3
```

---

### Default Random Pitch
Whether to apply random pitch when using the **Default Sound**, or when `RandomPitch` is **omitted** in a Sound Settings entry.

| Value | Meaning |
|---|---|
| `0` | Fixed pitch (100) — default |
| `1` | Random pitch |

---

### Default Pitch Range
The pitch range to use when `Range` is **omitted** in a Sound Settings entry, or when using the Default Sound with random pitch enabled.

| Value | Pitch Range | Effect |
|---|---|---|
| `m` | 88 – 112 | Subtle, natural variation — default |
| `l` | 70 – 130 | Wide, very noticeable variation |

---

### Speed Settings
**Format:** `FaceName:Frames`  
Frames to wait between each character for a given face. Separate entries with commas.

| Value | Feel |
|---|---|
| `1` | Near-instant |
| `4` | Very snappy |
| `10` | Moderate, readable |
| `20` | Slow, dramatic |
| `30+` | Very slow, one-letter-at-a-time |

**Examples:**
```
Actor1:10           → Actor1 types at 10 frames per character
Actor2:2            → Actor2 types very fast
Actor1:10, Actor2:2, Hero:6
```

---

### Default Speed
Frames per character for any face **not in Speed Settings**.

```
Default Speed = 4
```

---

### SE Play Mode
Controls how the SE is triggered for each character typed.

| Value | Behavior | Best For |
|---|---|---|
| `cut` | Stops the previous playback of the same SE and restarts it from the beginning. | Short click/tick sounds (under ~200ms) |
| `overlap` | Creates a new independent playback — previous sounds continue playing. | Longer sounds that shouldn't be cut off |

> ⚠️ **Note:** `cut` uses `playStaticSe` (ignores the in-game SE volume slider).  
> `overlap` uses `playSe` (respects the in-game SE volume slider).

```
SE Play Mode = cut
```

---

## ✏️ In-Message Overrides (Show Text Editor)

These special tags can be typed anywhere inside a **Show Text** event message box. They are completely **invisible in-game** and apply only to that message box. Other message boxes are unaffected.

---

### `{spd:N}` — Override Typing Speed

Overrides the typing speed for this message box only, ignoring both Speed Settings and Default Speed.

| Example | Effect |
|---|---|
| `{spd:1}` | Blazing fast |
| `{spd:3}` | Quick |
| `{spd:15}` | Slow and dramatic |
| `{spd:30}` | Very slow |

**Usage in Show Text:**
```
{spd:15}I... am... speaking... very... slowly...
```

---

### `{se:SoundName:RandomPitch:Range}` — Override SE Settings

Overrides the SE sound, random pitch flag, and pitch range for this message box only.  
Uses the exact same format as Sound Settings. **All fields after `SoundName` are optional.**

| Syntax | What gets overridden |
|---|---|
| `{se:Bell1}` | Sound only — pitch settings inherited from face/defaults |
| `{se:Bell1:0}` | Sound + fixed pitch |
| `{se:Bell1:1}` | Sound + random pitch, range from face/defaults |
| `{se:Bell1:1:m}` | Sound + random pitch, mid range |
| `{se:Bell1:1:l}` | Sound + random pitch, large range |

**Usage in Show Text:**
```
{se:Cancel2:1:l}Hey! How are you?
```
```
{se:Decision1:0}I have made my decision.
```

---

### Combining Both Tags

Both tags can be used together in the same message box. Order doesn't matter — place them at the start to keep things clean.

```
{spd:5}{se:Cancel2:1:l}Hey, nice to meet you!
```
```
{spd:20}{se:Bell1:1:m}This character speaks very slowly with bell sounds...
```

---

## 🧠 Priority / Override Order

When resolving which value to use, the plugin always follows this order (highest priority first):

### For Speed:
```
{spd:N} in message  →  Face Speed Settings  →  Default Speed
```

### For Sound / Pitch:
```
{se:...} in message  →  Face Sound Settings  →  Default Sound + Default Pitch settings
```

Each property in `{se:...}` is resolved **independently**. So `{se:Bell1}` only overrides the sound name — the pitch settings still come from the face's Sound Settings entry or the defaults.

---

## 💡 Tips & Best Practices

- **Short SE files work best** with `cut` mode. Keep sounds under 200ms for clean typewriter-style clicks.
- **Use `overlap` mode** if your SE files are longer and you don't want them getting cut off mid-play.
- **Spacebar and invisible characters** are **silenced** — the SE only plays for visible text characters.
- **Fast-forwarding** (holding OK/Return) **silences all SE** and bypasses per-character delay completely.
- **Single OK press** is enough to skip — you don't need to mash. One press cancels the current character wait immediately.
- The face name used in parameters must **exactly match** the face image filename in your project (case-sensitive on some systems). Check the `img/faces/` folder for exact filenames.

---

## 📜 License

Released under the **MIT License**.  
Free to use in both free and commercial projects. Credit appreciated but not required.
