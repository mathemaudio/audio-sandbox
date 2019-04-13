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
define("au/AuSample", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AuSample = (function () {
        function AuSample(l, r) {
            if (l === void 0) { l = 0; }
            if (r === void 0) { r = 0; }
            this.l = l;
            this.r = r;
        }
        Object.defineProperty(AuSample.prototype, "c", {
            get: function () { return this.l; },
            set: function (val) { this.l = this.r = val; },
            enumerable: true,
            configurable: true
        });
        return AuSample;
    }());
    exports.AuSample = AuSample;
});
define("au/AuNode", ["require", "exports", "au/AuSample", "au/AuEngine"], function (require, exports, AuSample_1, AuEngine_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AuNode = (function () {
        function AuNode() {
            this.child = null;
            this.parent = null;
        }
        AuNode.prototype.onSample = function (s) {
            s.l *= .5;
            s.r *= .5;
        };
        AuNode.prototype.process = function (buffer) {
            AuEngine_1.AuEngine._.assertChannels(buffer.numberOfChannels);
            var spl = new AuSample_1.AuSample(), l = buffer.getChannelData(0), r = buffer.getChannelData(1);
            spl.rate = buffer.sampleRate;
            for (var i = 0; i < buffer.length; ++i) {
                spl.l = l[i];
                spl.r = r[i];
                this.onSample(spl);
                l[i] = spl.l;
                r[i] = spl.r;
            }
        };
        AuNode.prototype.outTo = function (child) {
            this.child = child;
            child.parent = this;
        };
        AuNode.prototype.toStr = function () { return 'AuNode'; };
        return AuNode;
    }());
    exports.AuNode = AuNode;
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
define("au/AuSmoother", ["require", "exports", "tools/Calc"], function (require, exports, Calc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AuSmoother = (function () {
        function AuSmoother(inputFn, strength) {
            if (strength === void 0) { strength = .0006; }
            this.inputFn = inputFn;
            this.strength = strength;
            this.currVal = this.inputFn();
        }
        Object.defineProperty(AuSmoother.prototype, "nextSmoothed", {
            get: function () {
                return this.currVal = Calc_1.Calc.mix(this.currVal, this.inputFn(), this.strength);
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
define("au/AuMidi", ["require", "exports", "tools/Calc", "au/AuEngine", "au/AuSmoother"], function (require, exports, Calc_2, AuEngine_2, AuSmoother_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AuMidi = (function () {
        function AuMidi() {
            var _this = this;
            this.onMessage = function (e) {
                var rawMsg = _this._lastEvent = e.data, cmd = rawMsg[0] >> 4, channel = rawMsg[0] & 0xf, note = rawMsg[1];
                if (_this.onMidiEvent)
                    _this.onMidiEvent(rawMsg);
                var getHqNumber = function (msb, lsb) {
                    var l = msb << 7 | lsb;
                    var low = 21, mid = 8192, hi = 16266;
                    if (l < mid)
                        return Math.max(0, Calc_2.Calc.remix(low, mid, l, 0, .5));
                    else
                        return Math.min(Calc_2.Calc.remix(mid, hi, l, .5, 1), 1);
                };
                var velHQ = getHqNumber(rawMsg[2], rawMsg[1]);
                var velRaw = rawMsg[2];
                var velLofi01 = velRaw / 127;
                switch (cmd) {
                    case 8:
                    case 9:
                        var noteOn = cmd == 9 && velRaw != 0;
                        if (noteOn)
                            _this.keys[note] = {
                                note: note,
                                vel: velLofi01,
                                freqBase: _this.noteToFreq(note),
                                freqPitched: _this.findPitchedFreq(note),
                            };
                        else
                            delete _this.keys[note];
                        break;
                    case 14:
                        _this.pitch = Calc_2.Calc.mix(-1, 1, velHQ);
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
                console.log("cmd=" + cmd + ", ch=" + channel + ", note=" + note + ", vel=" + velRaw);
            };
            this.pitch = 0;
            this.modulationRaw = 0;
            this.attackRaw = 0;
            this.decayRaw = 0;
            this.releaseRaw = 0;
            this.cutoffRaw = 0;
            this.resonanceRaw = 0;
            this.keys = {};
            this.connect();
        }
        AuMidi.prototype.info = function (msg, clr) {
            if (AuEngine_2.AuEngine.LEARN_MODE)
                return;
            $('#midiInfo').html("<b style=\"color:#" + clr + "\">" + msg + "</b>");
        };
        AuMidi.prototype.connect = function () {
            var _this = this;
            var onMIDISuccess = function (midiAccess) {
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
            return n2f(Calc_2.Calc.mix(note, note + 2, p));
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
        AuMidi.prototype.keyIdx = function (idx) {
            var i = 0;
            for (var k in this.keys) {
                if (idx == i)
                    return this.keys[k];
                i++;
            }
            return null;
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
define("au/AuEngine", ["require", "exports", "tools/Stor", "au/AuNode", "au/AuMidi"], function (require, exports, Stor_1, AuNode_1, AuMidi_1) {
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
            _this.channels = 2;
            _this.volume = 1;
            _this.getFirstNode = function (fin) {
                if (typeof fin == 'undefined')
                    fin = _this;
                var n = fin;
                while (n.parent != null)
                    n = n.parent;
                return n;
            };
            _this.totalSamplesProcssed = 0;
            _this.audioCtx = new AudioContext();
            _this.attachNodes();
            _this.midi = AuMidi_1.AuMidi._;
            $(document).keydown(_this.switchSkip);
            _this.switchSkip({ keyCode: 0 });
            return _this;
        }
        AuEngine.prototype.process = function (buf) {
            this.erease(buf);
            if (this.skipProcessing)
                return;
            var fin = this;
            var node = this.getFirstNode(fin);
            while (node != fin && node.child != null) {
                node.process(buf);
                node = node.child;
            }
            this.setVolume(buf, this.volume);
            this.lastBuffer = buf;
            this.totalSamplesProcssed += buf.length;
        };
        AuEngine.prototype.toStr = function () { return "AuEngine"; };
        AuEngine.prototype.getDebugList = function () {
            var r = [];
            var fin = this;
            var node = this.getFirstNode(fin);
            while (node != fin && node.child != null) {
                r.push(node.toStr());
                node = node.child;
            }
            return r.join(' => \n');
        };
        AuEngine.prototype.setVolume = function (buf, vol) {
            for (var i = 0; i < buf.length; ++i)
                for (var channel = 0; channel < buf.numberOfChannels; ++channel)
                    buf.getChannelData(channel)[i] *= vol;
        };
        AuEngine.prototype.erease = function (buf) {
            for (var i = 0; i < buf.length; ++i)
                for (var channel = 0; channel < buf.numberOfChannels; ++channel)
                    buf.getChannelData(channel)[i] = 0;
        };
        AuEngine.prototype.assertChannels = function (num) {
            if (num != 2) {
                var msg = 'Number of channels must be exactly 2, otherwise this engine will not be able to work';
                alert(msg);
                throw msg;
            }
        };
        AuEngine.prototype.attachNodes = function () {
            var _this = this;
            this.assertChannels(this.channels);
            var node = this.mainScriptNode = this.audioCtx.createScriptProcessor(AuEngine.BUF_SZ, this.channels, this.channels);
            node.onaudioprocess = function (e) { return _this.process(e.outputBuffer); };
            node.connect(this.audioCtx.destination);
            this.lastAttachedNode = node;
        };
        Object.defineProperty(AuEngine.prototype, "sampleRateGlobal", {
            get: function () { return this.audioCtx.sampleRate; },
            enumerable: true,
            configurable: true
        });
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
    }(AuNode_1.AuNode));
    exports.AuEngine = AuEngine;
});
define("au/WaveForm", ["require", "exports", "tools/Calc"], function (require, exports, Calc_3) {
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
                return Math.cos(I) * radius / Calc_3.Calc.mix(1, radius * 2, _this.compensate);
            };
            while (exa <= this.targetExact) {
                result = find(lastI, exa);
                exa *= 5;
            }
            return result;
        };
        return Trohoid;
    }());
    var remix = Calc_3.Calc.remix;
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
        WaveForm.saw = function (phase) { return -phase; };
        WaveForm.triSawFolded = function (phase, fold) {
            var top = (1 - fold) * .25;
            var bottom = 1 - top;
            return phase < top ? remix(0, top, phase, 0, 1) :
                phase < bottom ? remix(top, bottom, phase, 1, -1) :
                    remix(bottom, 1, phase, -1, 0);
        };
        WaveForm.pow = function (fn, phase, strength) {
            var v = Calc_3.Calc.unmix(-1, 1, fn(phase));
            v = Math.pow(v, strength);
            return Calc_3.Calc.mix(-1, 1, v);
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
define("au/examples/Oscillator", ["require", "exports", "au/AuNode", "au/WaveForm"], function (require, exports, AuNode_2, WaveForm_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Oscillator = (function (_super) {
        __extends(Oscillator, _super);
        function Oscillator(frequency, waveGenerator) {
            if (waveGenerator === void 0) { waveGenerator = null; }
            var _this = _super.call(this) || this;
            _this.frequency = frequency;
            _this.waveGenerator = waveGenerator;
            _this.position = 0.;
            _this.on = true;
            if (_this.waveGenerator == null)
                _this.waveGenerator = function (pos) { return WaveForm_1.WaveForm.triangle(pos); };
            return _this;
        }
        Oscillator.prototype.incPosition = function (step) {
            this.position += step;
            if (this.position > 1)
                this.position -= 1;
        };
        Oscillator.prototype.onSample = function (s) {
            var step = this.frequency / s.rate;
            this.incPosition(step);
            s.c = this.on ? this.waveGenerator(this.position) : 0;
        };
        Oscillator.prototype.toStr = function () { return "Osc(" + this.frequency + ")"; };
        return Oscillator;
    }(AuNode_2.AuNode));
    exports.Oscillator = Oscillator;
});
define("au/examples/NoteOscillator", ["require", "exports", "au/examples/Oscillator", "au/AuMidi", "au/WaveForm", "Main"], function (require, exports, Oscillator_1, AuMidi_2, WaveForm_2, Main_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var NoteOscillator = (function (_super) {
        __extends(NoteOscillator, _super);
        function NoteOscillator(multiplier) {
            var _this = _super.call(this, 0) || this;
            _this.multiplier = multiplier;
            Main_1.Main.me.screen.signalOutput.baseFrequencyProvider = function () { return _this.frequency; };
            _this.midi = AuMidi_2.AuMidi._;
            _this.cutoff = _this.midi.cutoff;
            _this.attack = _this.midi.attack;
            _this.modulation = _this.midi.modulation;
            _this.waveGenerator = function (pos) {
                var n = _this.midi.keyIdx(0);
                return WaveForm_2.WaveForm.triSawFolded(pos, 1 - _this.modulation.nextSmoothed);
            };
            return _this;
        }
        NoteOscillator.prototype.onSample = function (s) {
            var n = this.midi.keyIdx(0);
            this.on = n != null;
            this.frequency = (this.on ? (n.freqPitched) : 0) * this.multiplier;
            _super.prototype.onSample.call(this, s);
        };
        NoteOscillator.prototype.toStr = function () { return "NoteOsc(" + this.frequency + ")"; };
        return NoteOscillator;
    }(Oscillator_1.Oscillator));
    exports.NoteOscillator = NoteOscillator;
});
define("display/DispGraph", ["require", "exports", "tools/Calc", "au/AuEngine"], function (require, exports, Calc_4, AuEngine_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Graphics = PIXI.Graphics;
    var rmx = Calc_4.Calc.remix;
    var mx = Calc_4.Calc.mix;
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
                    var I = Calc_4.Calc.unmix(0, sz.w, i);
                    var sampleIdx = Math.floor(mx(0, this.samplesToDraw, I));
                    var dat = buffer.getChannelData(channel);
                    var idx = startSampleIdx + sampleIdx;
                    if (idx >= buffer.length)
                        continue;
                    var spl = idx < buffer.length ? dat[idx] : -1;
                    var splCurrent = Calc_4.Calc.unmix(-1, 1, spl);
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
define("TheCoolOscillator", ["require", "exports", "au/AuNode"], function (require, exports, AuNode_3) {
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
    }(AuNode_3.AuNode));
    exports.TheCoolOscillator = TheCoolOscillator;
});
define("au/fx/AuBiquadFilter", ["require", "exports", "au/AuNode"], function (require, exports, AuNode_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AuBiquadFilter = (function (_super) {
        __extends(AuBiquadFilter, _super);
        function AuBiquadFilter(params) {
            var _this = _super.call(this) || this;
            _this.initOnSampleAction();
            _this.coefficients = [];
            _this.numberOfCascade = 1;
            _this.resetMemories();
            _this.params = params;
            return _this;
        }
        Object.defineProperty(AuBiquadFilter.prototype, "params", {
            get: function () { return this._params; },
            set: function (p) {
                var coef = this.calcBiquad(p.type, p.frequency, p.sampleRate, p.Q, p.peakGain);
                this.setCoefficients([coef.a0, coef.a1, coef.a2, coef.b1, coef.b2]);
            },
            enumerable: true,
            configurable: true
        });
        AuBiquadFilter.prototype.calcBiquad = function (type, frequency, sampleRate, Q, peakGain) {
            var a0, a1, a2, b1, b2, norm;
            var ymin, ymax, minVal, maxVal;
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
        AuBiquadFilter.prototype.setCoefficients = function (coef) {
            if (coef) {
                this.numberOfCascade = this.getNumberOfCascadeFilters(coef);
                this.coefficients = [];
                this.coeffGain = coef[0];
                for (var i = 0; i < this.numberOfCascade; i++) {
                    this.coefficients[i] = {
                        b1: coef[1 + i * 4],
                        b2: coef[2 + i * 4],
                        a0: 1,
                        a1: coef[3 + i * 4],
                        a2: coef[4 + i * 4]
                    };
                }
                this.resetMemories();
                return true;
            }
            else {
                throw new Error("No coefficients are set");
            }
        };
        AuBiquadFilter.prototype.getNumberOfCascadeFilters = function (coef) { return (coef.length - 1) / 4; };
        AuBiquadFilter.prototype.resetMemories = function () {
            this.memories = [{
                    xi1: 0,
                    xi2: 0,
                    yi1: 0,
                    yi2: 0
                }];
            for (var i = 1; i < this.numberOfCascade; i++) {
                this.memories[i] = {
                    yi1: 0,
                    yi2: 0
                };
            }
        };
        AuBiquadFilter.prototype.onSample = function (s) {
            if (this.onSampleAction != null)
                this.onSampleAction(s);
        };
        AuBiquadFilter.prototype.initOnSampleAction = function () {
            var _this = this;
            var x;
            var y = [];
            var b1, b2, a1, a2;
            var xi1, xi2, yi1, yi2, y1i1, y1i2;
            this.onSampleAction = function (sample) {
                x = sample.c;
                b1 = _this.coefficients[0].b1;
                b2 = _this.coefficients[0].b2;
                a1 = _this.coefficients[0].a1;
                a2 = _this.coefficients[0].a2;
                xi1 = _this.memories[0].xi1;
                xi2 = _this.memories[0].xi2;
                yi1 = _this.memories[0].yi1;
                yi2 = _this.memories[0].yi2;
                y[0] = x + b1 * xi1 + b2 * xi2 - a1 * yi1 - a2 * yi2;
                for (var e = 1; e < _this.numberOfCascade; e++) {
                    b1 = _this.coefficients[e].b1;
                    b2 = _this.coefficients[e].b2;
                    a1 = _this.coefficients[e].a1;
                    a2 = _this.coefficients[e].a2;
                    y1i1 = _this.memories[e - 1].yi1;
                    y1i2 = _this.memories[e - 1].yi2;
                    yi1 = _this.memories[e].yi1;
                    yi2 = _this.memories[e].yi2;
                    y[e] = y[e - 1] + b1 * y1i1 + b2 * y1i2 - a1 * yi1 - a2 * yi2;
                }
                sample.c = y[_this.numberOfCascade - 1] * _this.coeffGain;
                _this.memories[0].xi2 = _this.memories[0].xi1;
                _this.memories[0].xi1 = x;
                for (var p = 0; p < _this.numberOfCascade; p++) {
                    _this.memories[p].yi2 = _this.memories[p].yi1;
                    _this.memories[p].yi1 = y[p];
                }
            };
        };
        AuBiquadFilter.prototype.ssssprocesss = function (inputBuffer, outputBuffer) {
            var x;
            var y = [];
            var b1, b2, a1, a2;
            var xi1, xi2, yi1, yi2, y1i1, y1i2;
            for (var i = 0; i < inputBuffer.length; i++) {
                x = inputBuffer[i];
                b1 = this.coefficients[0].b1;
                b2 = this.coefficients[0].b2;
                a1 = this.coefficients[0].a1;
                a2 = this.coefficients[0].a2;
                xi1 = this.memories[0].xi1;
                xi2 = this.memories[0].xi2;
                yi1 = this.memories[0].yi1;
                yi2 = this.memories[0].yi2;
                y[0] = x + b1 * xi1 + b2 * xi2 - a1 * yi1 - a2 * yi2;
                for (var e = 1; e < this.numberOfCascade; e++) {
                    b1 = this.coefficients[e].b1;
                    b2 = this.coefficients[e].b2;
                    a1 = this.coefficients[e].a1;
                    a2 = this.coefficients[e].a2;
                    y1i1 = this.memories[e - 1].yi1;
                    y1i2 = this.memories[e - 1].yi2;
                    yi1 = this.memories[e].yi1;
                    yi2 = this.memories[e].yi2;
                    y[e] = y[e - 1] + b1 * y1i1 + b2 * y1i2 - a1 * yi1 - a2 * yi2;
                }
                outputBuffer[i] = y[this.numberOfCascade - 1] * this.coeffGain;
                this.memories[0].xi2 = this.memories[0].xi1;
                this.memories[0].xi1 = x;
                for (var p = 0; p < this.numberOfCascade; p++) {
                    this.memories[p].yi2 = this.memories[p].yi1;
                    this.memories[p].yi1 = y[p];
                }
            }
        };
        return AuBiquadFilter;
    }(AuNode_4.AuNode));
    exports.AuBiquadFilter = AuBiquadFilter;
});
define("Main", ["require", "exports", "au/AuEngine", "au/examples/NoteOscillator", "display/MainScreen", "au/fx/AuBiquadFilter"], function (require, exports, AuEngine_5, NoteOscillator_1, MainScreen_1, AuBiquadFilter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Main = (function () {
        function Main() {
            var _this = this;
            this.run = function () {
                $('#forCanvas').html('');
                _this.engine = AuEngine_5.AuEngine._;
                _this.screen = new MainScreen_1.MainScreen();
                _this.connectMyDevices();
                setTimeout(function () { return $('#wait').remove(); }, 300);
                console.log(_this.engine.getDebugList());
            };
            Main.me = this;
            $(document).ready(this.run);
        }
        Main.prototype.connectMyDevices = function () {
            var osc = new NoteOscillator_1.NoteOscillator(1);
            var lowpass = new AuBiquadFilter_1.AuBiquadFilter({
                type: 'lowpass',
                frequency: 1000, sampleRate: AuEngine_5.AuEngine._.sampleRateGlobal,
                Q: 22, peakGain: 6
            });
            osc.outTo(lowpass);
            lowpass.outTo(this.engine);
        };
        return Main;
    }());
    exports.Main = Main;
    new Main();
});
define("au/AuConvolution", ["require", "exports", "au/AuEngine"], function (require, exports, AuEngine_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AuConvolution = (function () {
        function AuConvolution() {
            this.url = '';
            this.convolver = this.ctx.createConvolver();
        }
        Object.defineProperty(AuConvolution.prototype, "ctx", {
            get: function () { return AuEngine_6.AuEngine._.audioCtx; },
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
            AuEngine_6.AuEngine._.insertJSAudioNodeToEnd(this.convolver);
        };
        return AuConvolution;
    }());
    exports.AuConvolution = AuConvolution;
});
//# sourceMappingURL=bin.js.map