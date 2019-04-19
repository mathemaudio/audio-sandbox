var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define("tools/Stor", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Stor = (function () {
        function Stor() {
        }
        Stor.can = function () { return (typeof (Storage) !== "undefined"); };
        Stor.has = function (key) {
            console.log('stor.has ' + key + ' => ' + (Stor.get(key) != null));
            return Stor.get(key) != null;
        };
        Stor.get = function (key) {
            console.log('stor.get ' + key + ' => ' + JSON.parse(localStorage.getItem(key)));
            return JSON.parse(localStorage.getItem(key));
        };
        Stor.set = function (key, val) {
            console.log('stor.set ' + key + ' => ' + val);
            return localStorage.setItem(key, JSON.stringify(val));
        };
        return Stor;
    }());
    exports.Stor = Stor;
});
define("tools/Calc", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Calc = (function () {
        function Calc() {
        }
        Calc.log = function (base, val) { return Math.log(val) / Math.log(base); };
        Calc.mix = function (a, b, val) { return a * (1 - val) + b * val; };
        Calc.diff = function (a, b) { return Math.max(a, b) - Math.min(a, b); };
        Calc.remix = function (fromStart, fromEnd, fromPos, toStart, toEnd) {
            return Calc.mix(toStart, toEnd, Calc.unmix(fromStart, fromEnd, fromPos));
        };
        Calc.unmix = function (a, b, pos) {
            if (b == a)
                return a;
            else
                return 1 - ((b - pos) / (b - a));
        };
        Calc.limit = function (num, min, max) {
            return num > max ? max : num < min ? min : num;
        };
        return Calc;
    }());
    exports.Calc = Calc;
});
define("au/WaveForm", ["require", "exports", "tools/Calc"], function (require, exports, Calc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Trohoid = (function () {
        function Trohoid() {
            this.auxRadius = .0;
            this.radiusVal = .3;
            this.compensate = .9;
            this.targetExact = 88200;
            this.iterationsTotal = 0;
        }
        Trohoid.prototype.funcRude = function (x) { return this.funcRudeAux(x, 1); };
        Trohoid.prototype.funcRudeAux = function (x, amountOfAux) {
            var _this = this;
            var radiusVal = this.radiusVal, auxRadius = this.auxRadius;
            var iterationsTotal = this.iterationsTotal, lastI = .0, result = 0., exa = 2.;
            var radius = Math.min(1, radiusVal + auxRadius * amountOfAux);
            var Pi2 = Math.PI * 2;
            iterationsTotal = 0;
            x -= ~~x;
            var find = function (start, roughness) {
                var step = 1 / roughness;
                var i = start, I = .0, X = 0;
                while (i < 1) {
                    I = i * Pi2;
                    X = x * Pi2;
                    if (X < I + Math.sin(I) * radius)
                        break;
                    lastI = i;
                    i += step;
                    iterationsTotal++;
                }
                return Math.cos(I) * radius / Calc_1.Calc.mix(1, radius * 2, _this.compensate);
            };
            while (exa <= this.targetExact) {
                result = find(lastI, exa);
                exa *= 5;
            }
            return result;
        };
        return Trohoid;
    }());
    var remix = Calc_1.Calc.remix;
    var WaveForm = (function () {
        function WaveForm() {
        }
        WaveForm.sine = function (phase) { return Math.sin(phase * Math.PI * 2); };
        WaveForm.square = function (phase) { return phase < .5 ? 1 : -1; };
        WaveForm.triangle = function (phase) {
            return phase < .25 ? remix(0, .25, phase, 0, 1) :
                phase < .75 ? remix(.25, .75, phase, 1, -1) :
                    remix(.75, 1, phase, -1, 0);
        };
        WaveForm.saw = function (phase) { return Calc_1.Calc.mix(1, -1, phase); };
        WaveForm.pulse = function (phase, size) {
            if (size === void 0) { size = .05; }
            var sz = size;
            if (phase < sz)
                return 1;
            if (phase < sz * 2)
                return -1;
            return 0;
        };
        WaveForm.triSawFolded = function (phase, fold) {
            var top = (1 - fold) * .25;
            var bottom = 1 - top;
            return phase < top ? remix(0, top, phase, 0, 1) :
                phase < bottom ? remix(top, bottom, phase, 1, -1) :
                    remix(bottom, 1, phase, -1, 0);
        };
        WaveForm.pow = function (fn, phase, strength) {
            var v = Calc_1.Calc.unmix(-1, 1, fn(phase));
            v = Math.pow(v, strength);
            return Calc_1.Calc.mix(-1, 1, v);
        };
        WaveForm.simplePhaseModulation = function (phase, secondModulationLevel, secondPhaseChanger) {
            if (secondPhaseChanger === void 0) { secondPhaseChanger = 0; }
            var s = WaveForm.sine(phase + WaveForm.sine(phase + secondPhaseChanger) * secondModulationLevel);
            return s;
        };
        WaveForm.trohoid = function (phase, radius) {
            var tro = WaveForm.tro;
            tro.radiusVal = radius;
            return tro.funcRude(phase);
        };
        WaveForm.tro = new Trohoid();
        return WaveForm;
    }());
    exports.WaveForm = WaveForm;
});
define("au/examples/Oscillator", ["require", "exports", "au/AuNode", "au/WaveForm"], function (require, exports, AuNode_1, WaveForm_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Oscillator = (function (_super) {
        __extends(Oscillator, _super);
        function Oscillator(frequency, waveGenerator) {
            if (waveGenerator === void 0) { waveGenerator = null; }
            var _this = _super.call(this) || this;
            _this.frequency = frequency;
            _this.waveGenerator = waveGenerator;
            _this.on = true;
            _this.parentFm = null;
            if (_this.waveGenerator == null)
                _this.waveGenerator = WaveForm_1.WaveForm.sine;
            return _this;
        }
        Oscillator.prototype.processSample = function (s) {
            var freqMul = 1 + (this.parentFm ? (this.parentFm.getNextSample(0) * 10) : 0);
            var step = (this.frequency * freqMul) / this.sampleRate;
            this.incPosition(step);
            return s + (this.on ? this.waveGenerator(this.position) : 0);
        };
        return Oscillator;
    }(AuNode_1.AuNode));
    exports.Oscillator = Oscillator;
});
define("au/AuNode", ["require", "exports", "au/AuEngine"], function (require, exports, AuEngine_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AuNode = (function () {
        function AuNode() {
            this.position = 0.;
            this.beforeOnSample = function () { };
            this.child = null;
            this.parent = null;
            this.initSampleRate();
        }
        AuNode.prototype.initSampleRate = function () { this.sampleRate = AuEngine_1.AuEngine._.sampleRate; };
        AuNode.prototype.incPosition = function (step) {
            this.position += step;
            if (this.position > 1)
                this.position -= 1;
        };
        AuNode.prototype.processSample = function (s) {
            return s;
        };
        AuNode.prototype.getNextSample = function (s) {
            if (this.parent)
                s = this.parent.getNextSample(s);
            this.beforeOnSample();
            s = this.processSample(s);
            return s;
        };
        AuNode.prototype.outTo = function (child) {
            this.child = child;
            child.parent = this;
            return child;
        };
        AuNode.prototype.fmTo = function (child) {
            this.child = child;
            child.parentFm = this;
            return child;
        };
        return AuNode;
    }());
    exports.AuNode = AuNode;
});
define("au/AuSmoother", ["require", "exports", "tools/Calc"], function (require, exports, Calc_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AuSmoother = (function () {
        function AuSmoother(inputFn, strength) {
            if (strength === void 0) { strength = .0006; }
            this.inputFn = inputFn;
            this.strength = strength;
            this.currVal = this.inputFn();
        }
        Object.defineProperty(AuSmoother.prototype, "next", {
            get: function () {
                return this.currVal = this.inputFn();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AuSmoother.prototype, "nextSmoothed", {
            get: function () {
                return this.currVal = Calc_2.Calc.mix(this.currVal, this.inputFn(), this.strength);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AuSmoother.prototype, "nextSmoothedRound", {
            get: function () { return Math.round(this.nextSmoothed * 1000) / 1000; },
            enumerable: true,
            configurable: true
        });
        return AuSmoother;
    }());
    exports.AuSmoother = AuSmoother;
});
define("au/Utils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Utils = (function () {
        function Utils() {
        }
        Utils.trig = function (event, param) {
            $(document).trigger(event, [param]);
        };
        Utils.on = function (event, handler) {
            $(document).on(event, function (evt, param) { return handler(param); });
        };
        Utils.dec2bin = function (dec) { return '0b:' + (dec >>> 0).toString(2).padStart(8, '0'); };
        Utils.dec2hex = function (dec) { return '0x:' + (dec >>> 0).toString(16).padStart(2, '0'); };
        Utils.debugNum = function (n) { return Utils.dec2hex(n) + " == " + Utils.dec2bin(n) + " == " + n; };
        Utils.debugNumArray = function (ns) { return ns.map(function (n) { return Utils.debugNum(n); }).join('\n') + '\n<=======>'; };
        return Utils;
    }());
    exports.Utils = Utils;
});
define("au/Note", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("au/AuMidi", ["require", "exports", "tools/Calc", "au/AuEngine", "au/AuSmoother", "au/Utils"], function (require, exports, Calc_3, AuEngine_2, AuSmoother_1, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AuMidi = (function () {
        function AuMidi() {
            var _this = this;
            this.msgCount = 0;
            this._lastEvent = [];
            this.onMessage = function (e) {
                _this.msgCount++;
                var _data = [];
                for (var i = 0; i < e.data.length; ++i)
                    _data.push(e.data[i]);
                var le = _this._lastEvent;
                if (le[0] == _data[0] && le[1] == _data[1] && le[2] == _data[2])
                    return;
                var rawMsg = _this._lastEvent = _data, cmd = rawMsg[0] >> 4, channel = rawMsg[0] & 0xf, note = rawMsg[1];
                var getHqNumber = function (msb, lsb) {
                    var l = msb << 7 | lsb;
                    var low = 21, mid = 8192, hi = 16266;
                    if (l < mid)
                        return Math.max(0, Calc_3.Calc.remix(low, mid, l, 0, .5));
                    else
                        return Math.min(Calc_3.Calc.remix(mid, hi, l, .5, 1), 1);
                };
                var velHQ = getHqNumber(rawMsg[2], rawMsg[1]);
                var velRaw = rawMsg[2];
                var velLofi01 = velRaw / 127;
                switch (cmd) {
                    case 8:
                    case 9:
                        var noteOn = cmd == 9 && velRaw != 0;
                        if (noteOn) {
                            _this.keysArr.push(_this.keys[note] = {
                                note: note,
                                vel: velLofi01,
                                freqBase: _this.noteToFreq(note),
                                freqPitched: _this.findPitchedFreq(note),
                            });
                        }
                        else {
                            delete _this.keys[note];
                            _this.keysArr = _this.keysArr.filter(function (k) { return k.note != note; });
                        }
                        break;
                    case 14:
                        _this.pitch = Calc_3.Calc.mix(-1, 1, velHQ);
                        _this.pitchAllNotes();
                        break;
                    case 11:
                        switch (note) {
                            case 1:
                                _this.modulationRaw = velHQ;
                                break;
                            case 73:
                                _this.attackRaw = velLofi01;
                                break;
                            case 75:
                                _this.decayRaw = velLofi01;
                                break;
                            case 72:
                                _this.releaseRaw = velLofi01;
                                break;
                            case 74:
                                _this.cutoffRaw = velLofi01;
                                break;
                            case 71:
                                _this.resonanceRaw = velLofi01;
                                break;
                            default: break;
                        }
                        break;
                    default:
                        console.log('not parsed');
                        break;
                }
                var R = function (n) { return n; };
                Utils_1.Utils.trig('midi.msg', rawMsg);
                _this.emitTopMonoEvent();
            };
            this.pitch = 0;
            this.modulationRaw = 0;
            this.attackRaw = 0;
            this.decayRaw = 0;
            this.releaseRaw = .5;
            this.cutoffRaw = 0.5;
            this.resonanceRaw = .5;
            this.keys = {};
            this.keysArr = [];
            this.connect();
        }
        AuMidi.prototype.info = function (msg, clr) {
            if (AuEngine_2.AuEngine.LEARN_MODE)
                return;
            $('#midiInfo').html("<b style=\"color:#" + clr + "\">" + msg + "</b>");
        };
        AuMidi.prototype.connect = function () {
            var _this = this;
            var assigned = false;
            var onMIDISuccess = function (midiAccess) {
                if (assigned)
                    return;
                assigned = true;
                console.log('MIDI Access Object', midiAccess);
                _this.info('MIDI ON', '0a0');
                var inputs = midiAccess.inputs.values();
                for (var input = inputs.next(); input && !input.done; input = inputs.next())
                    input.value.onmidimessage = _this.onMessage;
            };
            var onMIDIFailure = function (e) {
                _this.info('No access to MIDI devices or your browser doesn\'t support WebMIDI API. Please use WebMIDIAPIShim' + e, 'f70');
            };
            if (navigator.requestMIDIAccess) {
                navigator.requestMIDIAccess({
                    sysex: false
                }).then(onMIDISuccess, onMIDIFailure);
            }
            else
                this.info('Browser does not support MIDI', 'f70');
        };
        AuMidi.prototype.findPitchedFreq = function (note) {
            var p = this.pitch, n2f = this.noteToFreq;
            if (Math.abs(p) < 1 / 126)
                return n2f(note);
            return n2f(Calc_3.Calc.mix(note, note + 2, p));
        };
        AuMidi.prototype.pitchAllNotes = function () {
            for (var k in this.keys) {
                var n = this.keys[k];
                n.freqPitched = this.findPitchedFreq(n.note);
            }
        };
        Object.defineProperty(AuMidi.prototype, "lastEvent", {
            get: function () { return this._lastEvent; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AuMidi.prototype, "modulation", {
            get: function () {
                var _this = this;
                return new AuSmoother_1.AuSmoother(function () { return _this.modulationRaw; });
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AuMidi.prototype, "attack", {
            get: function () {
                var _this = this;
                return new AuSmoother_1.AuSmoother(function () { return _this.attackRaw; });
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AuMidi.prototype, "decay", {
            get: function () {
                var _this = this;
                return new AuSmoother_1.AuSmoother(function () { return _this.decayRaw; });
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AuMidi.prototype, "release", {
            get: function () {
                var _this = this;
                return new AuSmoother_1.AuSmoother(function () { return _this.releaseRaw; });
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AuMidi.prototype, "cutoff", {
            get: function () {
                var _this = this;
                return new AuSmoother_1.AuSmoother(function () { return _this.cutoffRaw; });
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AuMidi.prototype, "resonance", {
            get: function () {
                var _this = this;
                return new AuSmoother_1.AuSmoother(function () { return _this.resonanceRaw; });
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AuMidi.prototype, "on", {
            get: function () {
                for (var i in this.keys)
                    return true;
                return false;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AuMidi.prototype, "topMonoNote", {
            get: function () { return this.keysArr.length ? this.keysArr[this.keysArr.length - 1] : null; },
            enumerable: true,
            configurable: true
        });
        AuMidi.prototype.emitTopMonoEvent = function () {
            var n = this.topMonoNote, p = this.prevTopMonoNote;
            if (n == null && p == null || (p != null && n != null && p.note == n.note))
                return;
            this.prevTopMonoNote = n;
            Utils_1.Utils.trig('midi.topNote', n);
        };
        AuMidi.prototype.noteToFreq = function (note) {
            var a = 440 * .9857;
            return (a / 32) * Math.pow(2, ((note - 9) / 12));
        };
        Object.defineProperty(AuMidi, "_", {
            get: function () {
                return this.__self || (this.__self = new this());
            },
            enumerable: true,
            configurable: true
        });
        return AuMidi;
    }());
    exports.AuMidi = AuMidi;
});
define("au/AuEngine", ["require", "exports", "tools/Stor", "au/AuNode", "au/AuMidi"], function (require, exports, Stor_1, AuNode_2, AuMidi_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AuEngine = (function (_super) {
        __extends(AuEngine, _super);
        function AuEngine() {
            var _this = _super.call(this) || this;
            _this.nameSkip = 'skipAudio__';
            _this.switchSkip = function (k) {
                if (k.keyCode == 32) {
                    _this.skipProcessing = !_this.skipProcessing;
                    Stor_1.Stor.set(_this.nameSkip, _this.skipProcessing);
                }
                var sk = _this.skipProcessing;
                if (AuEngine.LEARN_MODE)
                    return;
                $('#engineInfo').html('<b style="color:' + (sk ? '#f00' : '#090') + '">'
                    + (sk ? 'Audio OFF' : 'Audio ON') + ' (press Space to Switch)</b>');
            };
            _this.skipProcessing = Stor_1.Stor.has(_this.nameSkip) ? Stor_1.Stor.get(_this.nameSkip) : false;
            _this.veryFirst = true;
            _this.channels = 1;
            _this.getFirstNode = function (fin) {
                if (typeof fin == 'undefined')
                    fin = _this;
                var n = fin;
                while (n.parent != null)
                    n = n.parent;
                return n;
            };
            _this.totalSamplesProcssed = 0;
            _this.sec2spl = function (sec) { return Math.floor(sec * _this.sampleRate); };
            _this.spl2sec = function (spl) { return spl / _this.sampleRate; };
            _this.audioCtx = new AudioContext();
            _this.attachNodes();
            _this.midi = AuMidi_1.AuMidi._;
            $(document).keydown(_this.switchSkip);
            _this.switchSkip({ keyCode: 0 });
            return _this;
        }
        AuEngine.prototype.process = function (buffer) {
            if (this.skipProcessing) {
                this.erease(buffer);
                return;
            }
            AuEngine._.assertChannels(buffer.numberOfChannels);
            this.sampleRate = buffer.sampleRate;
            var spl = 0, data = buffer.getChannelData(0);
            for (var i = 0; i < buffer.length; ++i)
                data[i] = this.getNextSample(0);
            this.lastBuffer = buffer;
            this.totalSamplesProcssed += buffer.length;
        };
        AuEngine.prototype.erease = function (buf) {
            for (var i = 0; i < buf.length; ++i)
                for (var channel = 0; channel < buf.numberOfChannels; ++channel)
                    buf.getChannelData(channel)[i] = 0;
        };
        AuEngine.prototype.assertChannels = function (num) {
            if (num != 1) {
                var msg = 'Number of channels must be exactly 1, otherwise this engine will not be able to work';
                alert(msg);
                throw msg;
            }
        };
        AuEngine.prototype.attachNodes = function () {
            var _this = this;
            this.assertChannels(this.channels);
            var node = this.mainScriptNode = this.audioCtx.createScriptProcessor(AuEngine.BUF_SZ, this.channels, this.channels);
            this.initSampleRate();
            node.onaudioprocess = function (e) { return _this.process(e.outputBuffer); };
            node.connect(this.audioCtx.destination);
            this.lastAttachedNode = node;
        };
        AuEngine.prototype.initSampleRate = function () { if (this.audioCtx)
            this.sampleRate = this.audioCtx.sampleRate; };
        AuEngine.prototype.insertJSAudioNodeToEnd = function (node) {
            this.lastAttachedNode.connect(node);
            node.connect(this.audioCtx.destination);
            this.lastAttachedNode = node;
        };
        Object.defineProperty(AuEngine, "_", {
            get: function () { return this.__self || (this.__self = new this()); },
            enumerable: true,
            configurable: true
        });
        AuEngine.LEARN_MODE = false;
        AuEngine.BUF_SZ = 1024;
        return AuEngine;
    }(AuNode_2.AuNode));
    exports.AuEngine = AuEngine;
});
define("au/examples/NoteOscillator", ["require", "exports", "au/examples/Oscillator", "Main", "tools/Calc"], function (require, exports, Oscillator_1, Main_1, Calc_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var NoteOscillator = (function (_super) {
        __extends(NoteOscillator, _super);
        function NoteOscillator(multiplier, waveGenerator) {
            if (waveGenerator === void 0) { waveGenerator = null; }
            var _this = _super.call(this, 0, waveGenerator) || this;
            _this.multiplier = multiplier;
            _this.count = 0;
            Main_1.Main.me.screen.signalOutput.baseFrequencyProvider = function () { return _this.frequency; };
            return _this;
        }
        NoteOscillator.prototype.processSample = function (s) {
            var n = this.note;
            this.on = n != null;
            var targetFreq = (this.on ? (n.freqPitched) : 0) * this.multiplier;
            this.frequency = Calc_4.Calc.mix(targetFreq, this.frequency, this.porto2coef(this.portamento));
            var r = function (n) { return Math.round(n * 100) / 100; };
            return _super.prototype.processSample.call(this, s);
        };
        NoteOscillator.prototype.porto2coef = function (porto) {
            var r = Calc_4.Calc.remix;
            if (porto == 0)
                return 0;
            if (porto < .1)
                return r(0, .1, porto, 0, .999);
            if (porto < .5)
                return r(.1, .5, porto, .99, .9993);
            if (porto < 1)
                return r(.5, .1, porto, .999, .9999);
            return .99999;
        };
        return NoteOscillator;
    }(Oscillator_1.Oscillator));
    exports.NoteOscillator = NoteOscillator;
});
define("au/examples/MidiNoteOscillator", ["require", "exports", "au/examples/NoteOscillator"], function (require, exports, NoteOscillator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MidiNoteOscillator = (function (_super) {
        __extends(MidiNoteOscillator, _super);
        function MidiNoteOscillator(multiplier, waveGenerator) {
            if (waveGenerator === void 0) { waveGenerator = null; }
            var _this = _super.call(this, multiplier, waveGenerator) || this;
            $(document).on('midi.topNote', function (e, note) {
                if (note != null)
                    _this.note = note;
            });
            return _this;
        }
        return MidiNoteOscillator;
    }(NoteOscillator_1.NoteOscillator));
    exports.MidiNoteOscillator = MidiNoteOscillator;
});
define("display/DispGraph", ["require", "exports", "tools/Calc", "au/AuEngine"], function (require, exports, Calc_5, AuEngine_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Graphics = PIXI.Graphics;
    var rmx = Calc_5.Calc.remix;
    var mx = Calc_5.Calc.mix;
    var DispGraph = (function (_super) {
        __extends(DispGraph, _super);
        function DispGraph(size) {
            var _this = _super.call(this) || this;
            _this.size = size;
            _this.samplesToDraw = Math.floor(AuEngine_3.AuEngine.BUF_SZ / 2);
            _this.wasZero = false;
            _this.fadeTick = 0;
            _this.resolution = 2;
            _this.drawFrame = function () {
                var isZero = _this.isSilense();
                var doChange = true;
                if (isZero && _this.wasZero) {
                    if (_this.fadeTick > 0) {
                        _this.fadeTick--;
                        doChange = true;
                    }
                    else
                        doChange = false;
                }
                else
                    _this.fadeTick = 30;
                _this.clear();
                if (doChange) {
                    _this.drawBorder(_this.size);
                    _this.drawChannel(0);
                }
                _this.wasZero = isZero;
                return doChange;
            };
            _this.isSilense = function () {
                var buffer = _this.engine.lastBuffer;
                if (typeof buffer == 'undefined')
                    return true;
                for (var i = 0; i < buffer.length; ++i) {
                    if (buffer.getChannelData(0)[i] != 0)
                        return false;
                }
                return true;
            };
            _this.findTheLoudestFirstSample = function (channel) {
                var freq = _this.baseFrequencyProvider();
                $('#freqInfo').html((freq == 0 ? '...' : (Math.round(freq * 100) / 100) + ' Hz'));
                if (freq == 0)
                    return 0;
                var buffer = _this.engine.lastBuffer, totalSamples = _this.engine.totalSamplesProcssed;
                var period = buffer.sampleRate / freq;
                return Math.round(period - (totalSamples / period - Math.floor(totalSamples / period)) * period);
            };
            if (!_this.baseFrequencyProvider)
                _this.baseFrequencyProvider = function () { return 0; };
            return _this;
        }
        Object.defineProperty(DispGraph.prototype, "engine", {
            get: function () { return AuEngine_3.AuEngine._; },
            enumerable: true,
            configurable: true
        });
        DispGraph.prototype.drawBorder = function (sz) {
            this.lineStyle(2, 0x777777, 1);
            this.drawRect(0, 0, sz.w, sz.h);
        };
        ;
        DispGraph.prototype.modulusFloat = function (a, b) {
            var div = (a / b);
            return (div - Math.floor(div)) * b;
        };
        DispGraph.prototype.drawChannel = function (channel) {
            var sz = { w: this.size.w, h: this.size.h, x: 0, y: 0 };
            var buffer = this.engine.lastBuffer;
            if (buffer) {
                var startSampleIdx = 0;
                startSampleIdx = this.findTheLoudestFirstSample(channel);
                this.lineStyle(2, 0x33ccff, 1);
                for (var i = 0; i < sz.w; i += this.resolution) {
                    var I = Calc_5.Calc.unmix(0, sz.w, i);
                    var sampleIdx = Math.floor(mx(0, this.samplesToDraw, I));
                    var dat = buffer.getChannelData(channel);
                    var idx = startSampleIdx + sampleIdx;
                    if (idx >= buffer.length)
                        continue;
                    var spl = idx < buffer.length ? dat[idx] : -1;
                    var splCurrent = Calc_5.Calc.unmix(-1, 1, spl);
                    var y = rmx(1, -1, spl, sz.y, sz.y + sz.h);
                    if (i == 0)
                        this.moveTo(i, y);
                    else
                        this.lineTo(i, y);
                }
                this.endFill();
            }
        };
        return DispGraph;
    }(Graphics));
    exports.DispGraph = DispGraph;
});
define("display/MainScreen", ["require", "exports", "display/DispGraph", "au/AuEngine"], function (require, exports, DispGraph_1, AuEngine_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Container = PIXI.Container;
    var MainScreen = (function () {
        function MainScreen() {
            var _this = this;
            this.skipRender = false;
            this.changed = false;
            this.animate = function () {
                if (_this.skipRender)
                    return;
                _this.changed = false;
                _this.changed = _this.changed || _this.signalOutput.drawFrame();
                if (_this.changed) {
                    _this.renderer.render(_this.stage);
                }
                _this.reqNext();
            };
            this.reqNext = function () { return requestAnimationFrame(_this.animate); };
            var sz = this.size = {
                w: Math.round(window.innerWidth * .8),
                h: Math.round(window.innerHeight * .8)
            };
            this.renderer = PIXI.autoDetectRenderer(sz.w, sz.h);
            document.body.appendChild(this.renderer.view);
            this.stage = new Container();
            this.stage.interactive = true;
            this.reqNext();
            this.stage.addChild(this.signalOutput = new DispGraph_1.DispGraph({ w: sz.w, h: sz.h * .35 }));
        }
        Object.defineProperty(MainScreen.prototype, "engine", {
            get: function () { return AuEngine_4.AuEngine._; },
            enumerable: true,
            configurable: true
        });
        return MainScreen;
    }());
    exports.MainScreen = MainScreen;
});
define("au/fx/AuVolume", ["require", "exports", "au/AuNode"], function (require, exports, AuNode_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AuVolume = (function (_super) {
        __extends(AuVolume, _super);
        function AuVolume(volume) {
            var _this = _super.call(this) || this;
            _this.volume = volume;
            return _this;
        }
        AuVolume.prototype.processSample = function (s) {
            return s * this.volume;
        };
        return AuVolume;
    }(AuNode_3.AuNode));
    exports.AuVolume = AuVolume;
});
define("au/envelope/ADSR", ["require", "exports", "au/AuNode", "au/AuEngine"], function (require, exports, AuNode_4, AuEngine_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var fromSec = function (sec) { return AuEngine_5.AuEngine._.sec2spl(sec); };
    var toSec = function (spl) { return AuEngine_5.AuEngine._.spl2sec(spl); };
    var ADSRStage;
    (function (ADSRStage) {
        ADSRStage[ADSRStage["nothing"] = -1] = "nothing";
        ADSRStage[ADSRStage["attack"] = 0] = "attack";
        ADSRStage[ADSRStage["decay"] = 1] = "decay";
        ADSRStage[ADSRStage["sustain"] = 2] = "sustain";
        ADSRStage[ADSRStage["release"] = 3] = "release";
    })(ADSRStage || (ADSRStage = {}));
    var ADSR = (function (_super) {
        __extends(ADSR, _super);
        function ADSR(attack, decay, sustain, release) {
            if (attack === void 0) { attack = .1; }
            if (decay === void 0) { decay = .5; }
            if (sustain === void 0) { sustain = .6; }
            if (release === void 0) { release = .7; }
            var _this = _super.call(this) || this;
            _this.val = 0;
            _this.step = 0;
            _this.stage = ADSRStage.nothing;
            _this.start = function () {
                _this.position = 0;
                _this.switchStage(ADSRStage.attack);
            };
            _this.end = function () {
                _this.switchStage(ADSRStage.release);
            };
            _this.attack = attack;
            _this.decay = decay;
            _this.sustain = sustain;
            _this.release = release;
            return _this;
        }
        ADSR.prototype.processSample = function (s) {
            var _this = this;
            if (this.stage != ADSRStage.nothing)
                this.position++;
            this.val += this.step;
            var sw = function (to) { return _this.switchStage(to); };
            switch (this.stage) {
                case ADSRStage.attack:
                    if (this.val >= 1) {
                        this.val = 1;
                        sw(ADSRStage.decay);
                    }
                    break;
                case ADSRStage.decay:
                    if (this.val <= this.sustain) {
                        this.val = this.sustain;
                        sw(ADSRStage.sustain);
                    }
                    break;
                case ADSRStage.release:
                    if (this.val <= 0) {
                        this.val = 0;
                        sw(ADSRStage.nothing);
                    }
                    break;
            }
            return this.val * s;
        };
        ADSR.prototype.switchStage = function (newStage) {
            var _this = this;
            if (this == undefined)
                debugger;
            this.stage = newStage;
            var updateStep = function (sec, targetVal) {
                var gap = targetVal - _this.val;
                _this.step = ((sec == 0 ? 1 : Math.min(1, 1 / _this.sampleRate / sec)) * gap);
            };
            switch (this.stage) {
                case ADSRStage.attack:
                    updateStep(this.attack, 1);
                    break;
                case ADSRStage.decay:
                    updateStep(this.decay, this.sustain);
                    break;
                case ADSRStage.sustain:
                    this.step = 0;
                    break;
                case ADSRStage.release:
                    updateStep(this.release, 0);
                    break;
                case ADSRStage.nothing:
                    this.step = 0;
                    break;
            }
        };
        return ADSR;
    }(AuNode_4.AuNode));
    exports.ADSR = ADSR;
});
define("au/envelope/MidiADSR", ["require", "exports", "au/envelope/ADSR"], function (require, exports, ADSR_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MidiADSR = (function (_super) {
        __extends(MidiADSR, _super);
        function MidiADSR(attack, decay, sustain, release) {
            if (attack === void 0) { attack = .01; }
            if (decay === void 0) { decay = .75; }
            if (sustain === void 0) { sustain = .36; }
            if (release === void 0) { release = .4; }
            var _this = _super.call(this, attack, decay, sustain, release) || this;
            $(document).on('midi.topNote', function (e, note) {
                if (note != null)
                    _this.start();
                else
                    _this.end();
            });
            return _this;
        }
        return MidiADSR;
    }(ADSR_1.ADSR));
    exports.MidiADSR = MidiADSR;
});
define("TheCoolOscillator", ["require", "exports", "au/AuNode"], function (require, exports, AuNode_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TheCoolOscillator = (function (_super) {
        __extends(TheCoolOscillator, _super);
        function TheCoolOscillator() {
            var _this = _super.call(this) || this;
            _this.phase = 0;
            _this.frequency = 500;
            return _this;
        }
        TheCoolOscillator.prototype.process = function (buffer) {
            for (var sample = 0; sample < buffer.length; ++sample) {
                this.phase += this.frequency / buffer.sampleRate;
                this.frequency += .005;
                if (this.phase > 1)
                    this.phase -= 1;
                for (var channel = 0; channel < buffer.numberOfChannels; ++channel)
                    buffer.getChannelData(channel)[sample] = Math.sin(this.phase * Math.PI * 2);
            }
        };
        return TheCoolOscillator;
    }(AuNode_5.AuNode));
    exports.TheCoolOscillator = TheCoolOscillator;
});
define("au/fx/AuBiquadFilter", ["require", "exports", "au/AuNode"], function (require, exports, AuNode_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AuBiquadFilter = (function (_super) {
        __extends(AuBiquadFilter, _super);
        function AuBiquadFilter(type, frequency, sampleRate, Q, peakGain) {
            var _this = _super.call(this) || this;
            _this.appliedTimes = 0;
            _this.memories = { xi1: 0, xi2: 0, yi1: 0, yi2: 0 };
            _this.initOnSampleAction();
            _this.resetMemories();
            _this._type = type;
            _this._frequency = frequency;
            _this._sampleRate = sampleRate;
            _this._Q = Q;
            _this._peakGain = peakGain;
            _this.apply(true);
            return _this;
        }
        Object.defineProperty(AuBiquadFilter.prototype, "type", {
            get: function () { return this._type; },
            set: function (t) { if (this._type == t)
                return; this._type = t; this.apply(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AuBiquadFilter.prototype, "frequency", {
            get: function () { return this._frequency; },
            set: function (t) { if (this._frequency == t)
                return; this._frequency = t; this.apply(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AuBiquadFilter.prototype, "sampleRate", {
            get: function () { return this._sampleRate; },
            set: function (t) { if (this._sampleRate == t)
                return; this._sampleRate = t; this.apply(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AuBiquadFilter.prototype, "Q", {
            get: function () { return this._Q; },
            set: function (t) { if (this._Q == t)
                return; this._Q = t; this.apply(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AuBiquadFilter.prototype, "peakGain", {
            get: function () { return this._peakGain; },
            set: function (t) { if (this._peakGain == t)
                return; this._peakGain = t; this.apply(); },
            enumerable: true,
            configurable: true
        });
        AuBiquadFilter.prototype.apply = function (reset) {
            if (reset === void 0) { reset = false; }
            this.appliedTimes++;
            var p = this;
            var coef = this.calcBiquad(p.type, p.frequency, p.sampleRate, p.Q, p.peakGain);
            this.setCoefficients(coef, reset);
        };
        AuBiquadFilter.prototype.calcBiquad = function (type, frequency, sampleRate, Q, peakGain) {
            var a0, a1, a2, b1, b2, norm;
            var V = Math.pow(10, Math.abs(peakGain) / 20);
            var K = Math.tan(Math.PI * frequency / sampleRate);
            switch (type) {
                case "one-pole lp":
                    b1 = Math.exp(-2.0 * Math.PI * (frequency / sampleRate));
                    a0 = 1.0 - b1;
                    b1 = -b1;
                    a1 = a2 = b2 = 0;
                    break;
                case "one-pole hp":
                    b1 = -Math.exp(-2.0 * Math.PI * (0.5 - frequency / sampleRate));
                    a0 = 1.0 + b1;
                    b1 = -b1;
                    a1 = a2 = b2 = 0;
                    break;
                case "lowpass":
                    norm = 1 / (1 + K / Q + K * K);
                    a0 = K * K * norm;
                    a1 = 2 * a0;
                    a2 = a0;
                    b1 = 2 * (K * K - 1) * norm;
                    b2 = (1 - K / Q + K * K) * norm;
                    break;
                case "highpass":
                    norm = 1 / (1 + K / Q + K * K);
                    a0 = 1 * norm;
                    a1 = -2 * a0;
                    a2 = a0;
                    b1 = 2 * (K * K - 1) * norm;
                    b2 = (1 - K / Q + K * K) * norm;
                    break;
                case "bandpass":
                    norm = 1 / (1 + K / Q + K * K);
                    a0 = K / Q * norm;
                    a1 = 0;
                    a2 = -a0;
                    b1 = 2 * (K * K - 1) * norm;
                    b2 = (1 - K / Q + K * K) * norm;
                    break;
                case "notch":
                    norm = 1 / (1 + K / Q + K * K);
                    a0 = (1 + K * K) * norm;
                    a1 = 2 * (K * K - 1) * norm;
                    a2 = a0;
                    b1 = a1;
                    b2 = (1 - K / Q + K * K) * norm;
                    break;
                case "peak":
                    if (peakGain >= 0) {
                        norm = 1 / (1 + 1 / Q * K + K * K);
                        a0 = (1 + V / Q * K + K * K) * norm;
                        a1 = 2 * (K * K - 1) * norm;
                        a2 = (1 - V / Q * K + K * K) * norm;
                        b1 = a1;
                        b2 = (1 - 1 / Q * K + K * K) * norm;
                    }
                    else {
                        norm = 1 / (1 + V / Q * K + K * K);
                        a0 = (1 + 1 / Q * K + K * K) * norm;
                        a1 = 2 * (K * K - 1) * norm;
                        a2 = (1 - 1 / Q * K + K * K) * norm;
                        b1 = a1;
                        b2 = (1 - V / Q * K + K * K) * norm;
                    }
                    break;
                case "lowShelf":
                    if (peakGain >= 0) {
                        norm = 1 / (1 + Math.SQRT2 * K + K * K);
                        a0 = (1 + Math.sqrt(2 * V) * K + V * K * K) * norm;
                        a1 = 2 * (V * K * K - 1) * norm;
                        a2 = (1 - Math.sqrt(2 * V) * K + V * K * K) * norm;
                        b1 = 2 * (K * K - 1) * norm;
                        b2 = (1 - Math.SQRT2 * K + K * K) * norm;
                    }
                    else {
                        norm = 1 / (1 + Math.sqrt(2 * V) * K + V * K * K);
                        a0 = (1 + Math.SQRT2 * K + K * K) * norm;
                        a1 = 2 * (K * K - 1) * norm;
                        a2 = (1 - Math.SQRT2 * K + K * K) * norm;
                        b1 = 2 * (V * K * K - 1) * norm;
                        b2 = (1 - Math.sqrt(2 * V) * K + V * K * K) * norm;
                    }
                    break;
                case "highShelf":
                    if (peakGain >= 0) {
                        norm = 1 / (1 + Math.SQRT2 * K + K * K);
                        a0 = (V + Math.sqrt(2 * V) * K + K * K) * norm;
                        a1 = 2 * (K * K - V) * norm;
                        a2 = (V - Math.sqrt(2 * V) * K + K * K) * norm;
                        b1 = 2 * (K * K - 1) * norm;
                        b2 = (1 - Math.SQRT2 * K + K * K) * norm;
                    }
                    else {
                        norm = 1 / (V + Math.sqrt(2 * V) * K + K * K);
                        a0 = (1 + Math.SQRT2 * K + K * K) * norm;
                        a1 = 2 * (K * K - 1) * norm;
                        a2 = (1 - Math.SQRT2 * K + K * K) * norm;
                        b1 = 2 * (K * K - V) * norm;
                        b2 = (V - Math.sqrt(2 * V) * K + K * K) * norm;
                    }
                    break;
            }
            return { a0: a0, a1: a1, a2: a2, b1: b1, b2: b2, };
        };
        AuBiquadFilter.prototype.setCoefficients = function (coef, reset) {
            if (coef) {
                this.coefficients = {
                    b1: coef.a1,
                    b2: coef.a2,
                    a0: coef.a0,
                    a1: coef.b1,
                    a2: coef.b2
                };
                if (reset)
                    this.resetMemories();
                return true;
            }
            else {
                throw new Error("No coefficients are set");
            }
        };
        AuBiquadFilter.prototype.resetMemories = function () {
            var mem = this.memories;
            mem.xi1 = mem.xi2 = mem.yi1 = mem.yi2 = 0;
        };
        AuBiquadFilter.prototype.processSample = function (s) {
            if (this.onSampleAction != null)
                return this.onSampleAction(s);
            return s;
        };
        AuBiquadFilter.prototype.initOnSampleAction = function () {
            var _this = this;
            var y;
            var mem = this.memories;
            this.onSampleAction = function (x) {
                var coef = _this.coefficients;
                y = x
                    + coef.b1 * mem.xi1
                    + coef.b2 * mem.xi2
                    - coef.a1 * mem.yi1
                    - coef.a2 * mem.yi2;
                mem.xi2 = mem.xi1;
                mem.xi1 = x;
                mem.yi2 = mem.yi1;
                mem.yi1 = y;
                return y * coef.a0;
            };
        };
        return AuBiquadFilter;
    }(AuNode_6.AuNode));
    exports.AuBiquadFilter = AuBiquadFilter;
});
define("au/fx/AuSillyFilter", ["require", "exports", "au/AuNode"], function (require, exports, AuNode_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AuSillyFilter = (function (_super) {
        __extends(AuSillyFilter, _super);
        function AuSillyFilter() {
            var _this = _super.call(this) || this;
            _this.curr = 0;
            _this.delta = 0;
            _this.speed = 0.03;
            return _this;
        }
        AuSillyFilter.prototype.processSample = function (s) {
            var diff = s - this.curr;
            this.delta += (diff > 0 ? 1 : -1) * this.speed;
            if (this.delta > 0 && diff < 0 || this.delta < 0 && diff > 0)
                this.delta *= (1 - (this.speed * 1));
            this.curr += this.delta;
            return this.curr * .3;
        };
        return AuSillyFilter;
    }(AuNode_7.AuNode));
    exports.AuSillyFilter = AuSillyFilter;
});
define("Main", ["require", "exports", "au/AuEngine", "au/examples/MidiNoteOscillator", "display/MainScreen", "au/fx/AuVolume", "au/AuMidi", "au/envelope/MidiADSR", "TheCoolOscillator", "tools/Calc", "au/WaveForm", "au/fx/AuBiquadFilter", "au/fx/AuSillyFilter"], function (require, exports, AuEngine_6, MidiNoteOscillator_1, MainScreen_1, AuVolume_1, AuMidi_2, MidiADSR_1, TheCoolOscillator_1, Calc_6, WaveForm_2, AuBiquadFilter_1, AuSillyFilter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Main = (function () {
        function Main() {
            var _this = this;
            this.run = function () {
                $('#forCanvas').html('');
                _this.engine = AuEngine_6.AuEngine._;
                _this.screen = new MainScreen_1.MainScreen();
                _this.connectMyDevices();
                setTimeout(function () { return $('#wait').remove(); }, 300);
            };
            Main.me = this;
            $(document).ready(this.run);
        }
        Main.prototype.connectMyDevices = function () {
            this.subtrSynth();
        };
        Main.prototype.coolOne = function () {
            var coolOne = new TheCoolOscillator_1.TheCoolOscillator();
            coolOne.outTo(this.engine);
        };
        Main.prototype.subtrSynth = function () {
            var note = null;
            var envFilter = new MidiADSR_1.MidiADSR(.1, .5, .02);
            $(document).on('midi.topNote', function (e, _note) {
                if (_note != null) {
                    note = _note;
                    envFilter.decay = Calc_6.Calc.mix(.1, 1, note.vel);
                }
            });
            var osc = new MidiNoteOscillator_1.MidiNoteOscillator(1, WaveForm_2.WaveForm.saw), envVol = new MidiADSR_1.MidiADSR(.01, .75, .5, .9);
            var filter = new AuBiquadFilter_1.AuBiquadFilter('lowpass', 1000, this.engine.sampleRate, 3, 6);
            var sillyFilter = new AuSillyFilter_1.AuSillyFilter();
            var res = AuMidi_2.AuMidi._.resonance;
            osc.portamento = .0;
            osc
                .outTo(filter)
                .outTo(envVol)
                .outTo(this.engine);
            sillyFilter.beforeOnSample = function () {
                var vol = note != null ? Calc_6.Calc.mix(.4, 1, note.vel) : .8;
                sillyFilter.speed = Calc_6.Calc.mix(.007, .2, envFilter.getNextSample(vol));
            };
            filter.beforeOnSample = function () {
                var vol = note != null ? Calc_6.Calc.mix(.2, 1, note.vel) : .8;
                filter.frequency = Calc_6.Calc.mix(300, 4000, envFilter.getNextSample(vol));
                filter.Q = Calc_6.Calc.mix(1, 6, res.nextSmoothed);
            };
        };
        Main.prototype.simpleFm = function () {
            var fmStrength;
            var osc = new MidiNoteOscillator_1.MidiNoteOscillator(3);
            osc.outTo(fmStrength = new AuVolume_1.AuVolume(0))
                .outTo(new MidiADSR_1.MidiADSR(.00005, 2.4, .1, .1))
                .fmTo(new MidiNoteOscillator_1.MidiNoteOscillator(1))
                .outTo(new MidiADSR_1.MidiADSR(0.001, 2, .5, .3))
                .outTo(new AuVolume_1.AuVolume(.7))
                .outTo(this.engine);
            var res = AuMidi_2.AuMidi._.resonance;
            var freq = AuMidi_2.AuMidi._.cutoff;
            fmStrength.beforeOnSample = function () {
                fmStrength.volume = res.nextSmoothed * 3;
                osc.multiplier = Calc_6.Calc.mix(0, 2, freq.nextSmoothed);
            };
        };
        return Main;
    }());
    exports.Main = Main;
    new Main();
});
define("au/AuConvolution", ["require", "exports", "au/AuEngine"], function (require, exports, AuEngine_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AuConvolution = (function () {
        function AuConvolution() {
            this.url = '';
            this.convolver = this.ctx.createConvolver();
        }
        Object.defineProperty(AuConvolution.prototype, "ctx", {
            get: function () { return AuEngine_7.AuEngine._.audioCtx; },
            enumerable: true,
            configurable: true
        });
        AuConvolution.prototype.loadImpulseResponse = function (url, done) {
            var _this = this;
            this.url = url;
            var ajaxRequest = new XMLHttpRequest();
            ajaxRequest.open('GET', 'concert-crowd.ogg', true);
            ajaxRequest.responseType = 'arraybuffer';
            ajaxRequest.onload = function () {
                var audioData = ajaxRequest.response;
                _this.ctx.decodeAudioData(audioData, function (buffer) {
                    _this.impulseResponse = buffer;
                    _this.source = _this.ctx.createBufferSource();
                    _this.source.buffer = _this.impulseResponse;
                    _this.convolver.buffer = _this.impulseResponse;
                    if (done)
                        done();
                }, function (e) { throw "Error with decoding audio data" + e; });
            };
            ajaxRequest.send();
        };
        AuConvolution.prototype.loadAndPlug = function (url, done) {
            var _this = this;
            this.loadImpulseResponse(url, function () {
                _this.plugToEngine();
                if (done)
                    done();
            });
        };
        AuConvolution.prototype.plugToEngine = function () {
            AuEngine_7.AuEngine._.insertJSAudioNodeToEnd(this.convolver);
        };
        return AuConvolution;
    }());
    exports.AuConvolution = AuConvolution;
});
//# sourceMappingURL=bin.js.map