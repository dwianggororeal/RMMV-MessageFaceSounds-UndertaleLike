/*:
 * @plugindesc Play SE in messages based on the character's face image, with per-face speed and pitch control.
 * @author DuiDwi
 *
 * @param Sound Settings
 * @desc FaceName:SoundName:RandomPitch(1/0):Range(m/l). Separate entries with commas.
 * @default Actor1:Cancel2:1:l, Actor2:Cancel1:1:m
 *
 * @param Default Sound
 * @desc Fallback SE when face has no Sound Settings entry.
 * @default Applause3
 *
 * @param Default Random Pitch
 * @desc Fallback random pitch when omitted in Sound Settings, and for Default Sound. 1 = yes, 0 = no (fixed).
 * @default 0
 *
 * @param Default Pitch Range
 * @desc Fallback pitch range when omitted in Sound Settings, and for Default Sound. m = mid (88-112), l = large (70-130).
 * @default m
 *
 * @param Speed Settings
 * @desc Per-face message speed. FaceName:Frames. Overrides Default Speed for that face.
 * @default Actor1:10, Actor2:2
 *
 * @param Default Speed
 * @desc Frames per character when no face-specific speed is set. 1=fast, higher=slower.
 * @default 4
 *
 * @param SE Play Mode
 * @desc How SE is played per character. cut = stop previous and restart (good for short clicks). overlap = allow layering (full playback).
 * @default cut
 *
 * @help
 * =============================================================================
 * MessageFaceSounds
 * =============================================================================
 *
 * Plays an SE and controls typing speed based on the face image shown,
 * with per-character pitch variation support.
 *
 * --- Sound Settings format ---
 * FaceName:SoundName:RandomPitch:PitchRange
 *
 *   FaceName    - Exact face image filename (no extension)
 *   SoundName   - SE filename in audio/se/ (no extension)
 *   RandomPitch - 1 = random pitch per character, 0 = fixed pitch (100)
 *   PitchRange  - m = mid range (88-112), l = large range (70-130)
 *
 * Example:
 *   Actor1:Cancel2:1:l, Actor2:Cancel1:1:m
 *
 * --- Speed Settings format ---
 * FaceName:Frames
 *   Frames = frames per character. 1=very fast, 10=moderate, 30=very slow.
 *
 * Example:
 *   Actor1:10, Actor2:2
 *
 * --- In-Message Overrides (in Show Text editor) ---
 * These tags are invisible in-game and override settings for that message box only.
 *
 *   {spd:N}               Override typing speed (frames per character)
 *   {se:Sound:Rand:Range} Override SE sound, random pitch, and pitch range
 *
 * {se:...} uses the same format as Sound Settings:
 *   {se:Cancel2:1:l}   - play Cancel2 with large random pitch  
 *   {se:Cancel1:1:m}   - play Cancel1 with mid random pitch
 *   {se:Decision1:0}   - play Decision1 with fixed pitch
 *   {se:Bell1}         - play Bell1 (inherits face pitch settings)
 *
 * Tags can be combined in one message:
 *   {spd:5}{se:Cancel2:1:l}Hey, nice to meet you!
 *
 * =============================================================================
 */

(function () {
    const parameters = PluginManager.parameters('MessageFaceSounds');
    const defaultSound = parameters['Default Sound'] || 'Applause3';
    const defaultRandPitch = (parseInt(parameters['Default Random Pitch']) || 0) === 1;
    const defaultPitchRange = (parameters['Default Pitch Range'] || 'm').trim().toLowerCase();
    const defaultSpeed = Math.max(1, parseInt(parameters['Default Speed']) || 4);
    const sePlayMode = (parameters['SE Play Mode'] || 'cut').trim().toLowerCase();
    const soundMapRaw = parameters['Sound Settings'] || '';
    const speedMapRaw = parameters['Speed Settings'] || '';

    // --- Parse face→{sound, randomPitch, range} ---
    // Format: FaceName:SoundName[:RandomPitch[:Range]]  — all fields after Sound are optional
    // Omitted RandomPitch falls back to Default Random Pitch param (default: fixed/0)
    // Omitted Range falls back to Default Pitch Range param (default: m)
    const soundMap = {};
    soundMapRaw.split(',').forEach(entry => {
        const parts = entry.split(':').map(s => s.trim());
        if (parts[0] && parts[1]) {
            soundMap[parts[0]] = {
                sound: parts[1],
                randomPitch: (parts[2] !== undefined && parts[2] !== '') ? parts[2] === '1' : defaultRandPitch,
                range: (parts[3] && parts[3] !== '') ? parts[3].toLowerCase() : defaultPitchRange
            };
        }
    });

    // --- Parse face→speed ---
    const speedMap = {};
    speedMapRaw.split(',').forEach(entry => {
        const [face, speed] = entry.split(':');
        if (face && speed) speedMap[face.trim()] = Math.max(1, parseInt(speed.trim()) || defaultSpeed);
    });

    // --- Pitch helpers ---
    const PITCH_RANGES = {
        m: { min: 88, max: 112 },  // mid:   ±12
        l: { min: 70, max: 130 }   // large: ±30
    };

    function getRandomPitch(range) {
        const r = PITCH_RANGES[range] || PITCH_RANGES.m;
        return r.min + Math.floor(Math.random() * (r.max - r.min + 1));
    }

    // --- Custom escape string reader [text inside brackets] ---
    function obtainEscapeString(textState) {
        const arr = /^\[([^\]]*)\]/.exec(textState.text.slice(textState.index));
        if (arr) {
            textState.index += arr[0].length;
            return arr[1];
        }
        return '';
    }

    // -----------------------------------------------------------------------
    // Convert inline tags to internal escape codes
    //   {spd:N}               → \x1bSPD[N]
    //   {se:Sound:Rand:Range} → \x1bMFSSE[Sound|Rand|Range]
    // -----------------------------------------------------------------------
    const _convertEscapeCharacters = Window_Base.prototype.convertEscapeCharacters;
    Window_Base.prototype.convertEscapeCharacters = function (text) {
        text = text.replace(/\{spd:(\d+)\}/gi, '\x1bSPD[$1]');
        text = text.replace(/\{se:([^}]*)\}/gi, (_, inner) => {
            return '\x1bMFSSE[' + inner.replace(/:/g, '|') + ']';
        });
        return _convertEscapeCharacters.call(this, text);
    };

    // -----------------------------------------------------------------------
    // Reset per-message overrides when a new message starts
    // -----------------------------------------------------------------------
    const _startMessage = Window_Message.prototype.startMessage;
    Window_Message.prototype.startMessage = function () {
        this._messageSpeedOverride = null;
        this._seOverride = null;  // { sound, randomPitch, range }
        _startMessage.call(this);
    };

    // -----------------------------------------------------------------------
    // Handle escape codes: SPD and MFSSE
    // -----------------------------------------------------------------------
    const _processEscapeCharacter = Window_Message.prototype.processEscapeCharacter;
    Window_Message.prototype.processEscapeCharacter = function (code, textState) {
        if (code === 'SPD') {
            this._messageSpeedOverride = Math.max(1, this.obtainEscapeParam(textState));
        } else if (code === 'MFSSE') {
            const raw = obtainEscapeString(textState);
            const parts = raw.split('|').map(s => s.trim());
            this._seOverride = {
                sound: parts[0] || null,
                randomPitch: parts[1] !== undefined ? parts[1] === '1' : null,
                range: (parts[2] || '').toLowerCase() || null
            };
        } else {
            _processEscapeCharacter.call(this, code, textState);
        }
    };

    // -----------------------------------------------------------------------
    // processNormalCharacter — fires once per visible character drawn.
    //
    // Priority for each setting:
    //   {se:...} override  →  face Sound Settings  →  Default Sound/Pitch
    //   {spd:N} override   →  face Speed Settings  →  Default Speed
    // -----------------------------------------------------------------------
    const _processNormalCharacter = Window_Message.prototype.processNormalCharacter;
    Window_Message.prototype.processNormalCharacter = function (textState) {
        _processNormalCharacter.call(this, textState);

        const faceName = $gameMessage.faceName();
        const faceEntry = soundMap[faceName] || null;
        const seOvr = this._seOverride;

        // --- Resolve speed ---
        const speed = (this._messageSpeedOverride != null)
            ? this._messageSpeedOverride
            : (faceEntry == null && speedMap[faceName] !== undefined)
                ? speedMap[faceName]
                : (speedMap[faceName] !== undefined ? speedMap[faceName] : defaultSpeed);

        if (!this._showFast) this.startWait(speed);

        // --- Play SE (skip spaces and fast-forward) ---
        const lastChar = textState.text[textState.index - 1];
        if (lastChar && lastChar.trim().length > 0 && !this._showFast) {

            // Resolve each SE property independently
            const seName = (seOvr && seOvr.sound)
                ? seOvr.sound
                : (faceEntry ? faceEntry.sound : defaultSound);

            const useRand = (seOvr && seOvr.randomPitch !== null)
                ? seOvr.randomPitch
                : (faceEntry ? faceEntry.randomPitch : defaultRandPitch);

            const range = (seOvr && seOvr.range)
                ? seOvr.range
                : (faceEntry ? faceEntry.range : defaultPitchRange);

            const pitch = useRand ? getRandomPitch(range) : 100;

            const seParams = { name: seName, pan: 0, pitch: pitch, volume: 80 };
            if (sePlayMode === 'overlap') {
                AudioManager.playSe(seParams);
            } else {
                AudioManager.playStaticSe(seParams);
            }
        }
    };

    // -----------------------------------------------------------------------
    // Override updateWait so pressing OK/Return instantly cancels the wait.
    // -----------------------------------------------------------------------
    Window_Message.prototype.updateWait = function () {
        if (this._waitCount > 0) {
            if (this.isTriggered()) {
                this._showFast = true;
                this._waitCount = 0;
                return false;
            }
            this._waitCount--;
            return true;
        }
        return false;
    };

})();