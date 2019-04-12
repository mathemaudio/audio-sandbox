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
define("au/AuNode", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AuNode = (function () {
        function AuNode() {
            this.child = null;
            this.parent = null;
        }
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
define("au/AuMidi", ["require", "exports", "tools/Calc", "au/AuEngine"], function (require, exports, Calc_1, AuEngine_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var L = function (s) { return console.log(s); };
    var AuMidi = (function () {
        function AuMidi() {
            var _this = this;
            this.onMessage = function (e) {
                var rawMsg = _this._lastEvent = e.data, cmd = rawMsg[0] >> 4, note = rawMsg[1];
                if (_this.onMidiEvent)
                    _this.onMidiEvent(rawMsg);
                var getHqNumber = function (msb, lsb) {
                    var l = msb << 7 | lsb;
                    var low = 21, mid = 8192, hi = 16266;
                    if (l < mid)
                        return Math.max(0, Calc_1.Calc.remix(low, mid, l, 0, .5));
                    else
                        return Math.min(Calc_1.Calc.remix(mid, hi, l, .5, 1), 1);
                };
                var velHQ = getHqNumber(rawMsg[2], rawMsg[1]);
                switch (cmd) {
                    case 8:
                    case 9:
                        var velRaw = rawMsg[2];
                        var noteOn = cmd == 9 && velRaw != 0;
                        if (noteOn)
                            _this.keys[note] = {
                                note: note,
                                vel: velRaw / 127,
                                freqBase: _this.noteToFreq(note),
                                freqPitched: _this.findPitchedFreq(note),
                            };
                        else
                            delete _this.keys[note];
                        break;
                    case 14:
                        _this.pitch = Calc_1.Calc.mix(-1, 1, velHQ);
                        _this.pitchAllNotes();
                        break;
                    case 11:
                        if (note == 1)
                            _this.modulationRaw = velHQ;
                        else if (note == 74)
                            _this.brightness = Calc_1.Calc.remix(.5, 1, velHQ, 0, 1);
                        break;
                    default:
                        L('not parsed');
                        break;
                }
                var R = function (n) { return n; };
                console.log(JSON.stringify(_this.keys) + ("\npitch: " + R(_this.pitch) + ", mod: " + R(_this.modulation) + ", br: " + R(_this.brightness)));
            };
            this.pitch = 0;
            this.modulationGlide = 0;
            this.modulationRaw = 0;
            this.brightness = 0;
            this.keys = {};
            this.connect();
        }
        AuMidi.prototype.info = function (msg, clr) {
            if (AuEngine_1.AuEngine.LEARN_MODE)
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
            return n2f(Calc_1.Calc.mix(note, note + 2, p));
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
                this.modulationGlide = Calc_1.Calc.mix(this.modulationRaw, this.modulationGlide, .1);
                return this.modulationGlide;
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
                node.sampleRate = this.sampleRate;
                node.process(buf);
                node = node.child;
            }
            this.setVolume(buf, this.volume);
            this.lastBuffer = buf;
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
        AuEngine.prototype.attachNodes = function () {
            var _this = this;
            var node = this.mainScriptNode = this.audioCtx.createScriptProcessor(AuEngine.BUF_SZ, this.channels, this.channels);
            this.sampleRate = this.audioCtx.sampleRate;
            node.onaudioprocess = function (e) { return _this.process(e.outputBuffer); };
            node.connect(this.audioCtx.destination);
            this.lastAttachedNode = node;
        };
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
define("au/WaveForm", ["require", "exports", "tools/Calc"], function (require, exports, Calc_2) {
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
                return Math.cos(I) * radius / Calc_2.Calc.mix(1, radius * 2, _this.compensate);
            };
            while (exa <= this.targetExact) {
                result = find(lastI, exa);
                exa *= 5;
            }
            return result;
        };
        return Trohoid;
    }());
    var remix = Calc_2.Calc.remix;
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
            var v = Calc_2.Calc.unmix(-1, 1, fn(phase));
            v = Math.pow(v, strength);
            return v;
            return Calc_2.Calc.mix(-1, 1, v);
        };
        WaveForm.simpleFM = function (phase, secondModulationLevel) {
            var s = WaveForm.sine(phase + WaveForm.sine(phase) * secondModulationLevel);
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
        function Oscillator(frequency) {
            var _this = _super.call(this) || this;
            _this.frequency = frequency;
            _this.position = 0.;
            _this.on = true;
            return _this;
        }
        Oscillator.prototype.incPosition = function (step) {
            this.position += step;
            if (this.position > 1)
                this.position -= 1;
        };
        Oscillator.prototype.process = function (buffer) {
            for (var i = 0; i < buffer.length; ++i) {
                var step = this.frequency / this.sampleRate;
                this.incPosition(step);
                if (this.position > 1)
                    this.position -= 1;
                var val = this.on ? WaveForm_1.WaveForm.sine(this.position) : 0;
                for (var channel = 0; channel < buffer.numberOfChannels; ++channel)
                    buffer.getChannelData(channel)[i] += val;
            }
        };
        Oscillator.prototype.toStr = function () { return "Osc(" + this.frequency + ")"; };
        return Oscillator;
    }(AuNode_2.AuNode));
    exports.Oscillator = Oscillator;
});
define("au/examples/NoteOscillator", ["require", "exports", "au/examples/Oscillator", "au/AuMidi", "au/WaveForm", "tools/Calc"], function (require, exports, Oscillator_1, AuMidi_2, WaveForm_2, Calc_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var NoteOscillator = (function (_super) {
        __extends(NoteOscillator, _super);
        function NoteOscillator(multiplier) {
            var _this = _super.call(this, 0) || this;
            _this.multiplier = multiplier;
            return _this;
        }
        NoteOscillator.prototype.process = function (buffer) {
            var midi = AuMidi_2.AuMidi._;
            for (var i = 0; i < buffer.length; ++i) {
                var n = midi.keyIdx(0);
                var on = this.on = n != null;
                if (this.on)
                    this.frequency = (on ? (n.freqPitched) : 0) * this.multiplier;
                var step = this.frequency / this.sampleRate;
                this.incPosition(step);
                var val = this.on ?
                    WaveForm_2.WaveForm.pow(WaveForm_2.WaveForm.sine, this.position, Calc_3.Calc.mix(8, 2048, Math.pow(midi.modulation, 4)))
                    : 0;
                for (var channel = 0; channel < buffer.numberOfChannels; ++channel)
                    buffer.getChannelData(channel)[i] += val;
            }
        };
        NoteOscillator.prototype.toStr = function () { return "NoteOsc(" + this.frequency + ")"; };
        return NoteOscillator;
    }(Oscillator_1.Oscillator));
    exports.NoteOscillator = NoteOscillator;
});
define("display/DispGraph", ["require", "exports", "tools/Calc", "au/AuEngine"], function (require, exports, Calc_4, AuEngine_2) {
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
            _this.samplesToDraw = Math.floor(AuEngine_2.AuEngine.BUF_SZ);
            _this.startFromSilenceUp = false;
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
                var buffer = _this.engine.lastBuffer;
                var epsilon = .01, izZero = function (v) { return Math.abs(v) < epsilon; };
                var loudestIdx = 0, loudestMax = 0;
                var dat = buffer.getChannelData(channel);
                for (var i = 0; i < buffer.length; ++i) {
                    var spl = dat[i];
                    if (spl > loudestMax) {
                        loudestMax = spl;
                        loudestIdx = i;
                    }
                }
                return loudestIdx;
            };
            return _this;
        }
        Object.defineProperty(DispGraph.prototype, "engine", {
            get: function () { return AuEngine_2.AuEngine._; },
            enumerable: true,
            configurable: true
        });
        DispGraph.prototype.drawBorder = function (sz) {
            this.lineStyle(2, 0x777777, 1);
            this.drawRect(0, 0, sz.w, sz.h);
        };
        ;
        DispGraph.prototype.drawChannel = function (channel) {
            var sz = { w: this.size.w, h: this.size.h, x: 0, y: 0 };
            var buffer = this.engine.lastBuffer;
            if (buffer) {
                var startSampleIdx = 0;
                if (this.startFromSilenceUp)
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
define("display/MainScreen", ["require", "exports", "display/DispGraph", "au/AuEngine"], function (require, exports, DispGraph_1, AuEngine_3) {
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
            get: function () { return AuEngine_3.AuEngine._; },
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
define("Main", ["require", "exports", "au/AuEngine", "au/examples/NoteOscillator", "display/MainScreen"], function (require, exports, AuEngine_4, NoteOscillator_1, MainScreen_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Main = (function () {
        function Main() {
            var _this = this;
            this.run = function () {
                $('#forCanvas').html('');
                _this.engine = AuEngine_4.AuEngine._;
                _this.screen = new MainScreen_1.MainScreen();
                _this.connectMyDevices();
                setTimeout(function () { return $('#wait').remove(); }, 300);
                console.log(_this.engine.getDebugList());
            };
            Main.me = this;
            $(document).ready(this.run);
        }
        Main.prototype.connectMyDevices = function () {
            var o1 = new NoteOscillator_1.NoteOscillator(1);
            o1.outTo(this.engine);
        };
        return Main;
    }());
    exports.Main = Main;
    new Main();
});
define("au/AuConvolution", ["require", "exports", "au/AuEngine"], function (require, exports, AuEngine_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AuConvolution = (function () {
        function AuConvolution() {
            this.url = '';
            this.convolver = this.ctx.createConvolver();
        }
        Object.defineProperty(AuConvolution.prototype, "ctx", {
            get: function () { return AuEngine_5.AuEngine._.audioCtx; },
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
            AuEngine_5.AuEngine._.insertJSAudioNodeToEnd(this.convolver);
        };
        return AuConvolution;
    }());
    exports.AuConvolution = AuConvolution;
});
//# sourceMappingURL=bin.js.map