var BenzAMRRecorder = (function () {
'use strict';

var WORKER_ENABLED = !!(window && window.URL && window.Blob && window.Worker);

function InlineWorker(func, self) {
    var _this = this;
    var functionBody = void 0;

    self = self || {};

    if (WORKER_ENABLED) {
        functionBody = func.toString().trim().match(/^function\s*\w*\s*\([\w\s,]*\)\s*{([\w\W]*?)}$/)[1];

        return new window.Worker(window.URL.createObjectURL(new window.Blob([functionBody], { type: "text/javascript" })));
    }

    function postMessage(data) {
        setTimeout(function () {
            _this.onmessage({ data: data });
        }, 0);
    }

    this.self = self;
    this.self.postMessage = postMessage;

    setTimeout(func.bind(self, self), 0);
}

InlineWorker.prototype.postMessage = function postMessage(data) {
    var _this = this;

    setTimeout(function () {
        _this.self.onmessage({ data: data });
    }, 0);
};

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();





var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var Recorder = function () {
    function Recorder(source, cfg) {
        var _this = this;

        classCallCheck(this, Recorder);
        this.config = {
            bufferLen: 4096,
            numChannels: 1,
            mimeType: 'audio/wav'
        };
        this.recording = false;
        this.callbacks = {
            getBuffer: [],
            exportWAV: []
        };

        Object.assign(this.config, cfg);
        this.context = source.context;
        this.node = (this.context.createScriptProcessor || this.context.createJavaScriptNode).call(this.context, this.config.bufferLen, this.config.numChannels, this.config.numChannels);

        this.node.onaudioprocess = function (e) {
            if (!_this.recording) return;

            var buffer = [];
            for (var channel = 0; channel < _this.config.numChannels; channel++) {
                buffer.push(e.inputBuffer.getChannelData(channel));
            }
            _this.worker.postMessage({
                command: 'record',
                buffer: buffer
            });
        };

        source.connect(this.node);
        this.node.connect(this.context.destination); //this should not be necessary

        var self = {};
        this.worker = new InlineWorker(function () {
            var recLength = 0,
                recBuffers = [],
                sampleRate = void 0,
                numChannels = void 0;

            this.onmessage = function (e) {
                switch (e.data.command) {
                    case 'init':
                        init(e.data.config);
                        break;
                    case 'record':
                        record(e.data.buffer);
                        break;
                    case 'getBuffer':
                        getBuffer();
                        break;
                    case 'clear':
                        clear();
                        break;
                }
            };

            function init(config) {
                numChannels = config.numChannels;
                initBuffers();
            }

            function record(inputBuffer) {
                for (var channel = 0; channel < numChannels; channel++) {
                    recBuffers[channel].push(inputBuffer[channel]);
                }
                recLength += inputBuffer[0].length;
            }

            function getBuffer() {
                var buffers = [];
                for (var channel = 0; channel < numChannels; channel++) {
                    buffers.push(mergeBuffers(recBuffers[channel], recLength));
                }
                this.postMessage({ command: 'getBuffer', data: buffers });
            }

            function clear() {
                recLength = 0;
                recBuffers = [];
                initBuffers();
            }

            function initBuffers() {
                for (var channel = 0; channel < numChannels; channel++) {
                    recBuffers[channel] = [];
                }
            }

            function mergeBuffers(recBuffers, recLength) {
                var result = new Float32Array(recLength);
                var offset = 0;
                for (var i = 0; i < recBuffers.length; i++) {
                    result.set(recBuffers[i], offset);
                    offset += recBuffers[i].length;
                }
                return result;
            }
        }, self);

        this.worker.postMessage({
            command: 'init',
            config: {
                sampleRate: this.context.sampleRate,
                numChannels: this.config.numChannels
            }
        });

        this.worker.onmessage = function (e) {
            var cb = _this.callbacks[e.data.command].pop();
            if (typeof cb === 'function') {
                cb(e.data.data);
            }
        };
    }

    createClass(Recorder, [{
        key: 'record',
        value: function record() {
            this.recording = true;
        }
    }, {
        key: 'stop',
        value: function stop() {
            this.recording = false;
        }
    }, {
        key: 'clear',
        value: function clear() {
            this.worker.postMessage({ command: 'clear' });
        }
    }, {
        key: 'getBuffer',
        value: function getBuffer(cb) {
            cb = cb || this.config.callback;
            if (!cb) throw new Error('Callback not set');

            this.callbacks.getBuffer.push(cb);

            this.worker.postMessage({ command: 'getBuffer' });
        }
    }]);
    return Recorder;
}();

/**
 * @file 公共的 Web Audio API Context
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/11/12
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

var AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;

var ctx = null;
var curSourceNode = null;

if (AudioContext) {
    ctx = new AudioContext();
} else {
    throw 'Web Audio API is Unsupported.';
}
/*
const increaseSampleRate = function (samples, multiple) {
    let sampleLen = samples.length;
    let newSamples = new Float32Array(sampleLen * multiple);
    for (let i = 0; i < sampleLen; i ++) {
        for (let j = 0; j < multiple; j ++) {
            newSamples[i * multiple + j] = samples[i];
        }
    }
    return newSamples;
};
*/

var playPcm = function playPcm(samples, sampleRate, onEnded) {
    sampleRate = sampleRate || 8000;
    stopPcm();
    curSourceNode = ctx['createBufferSource']();
    var _samples = samples;
    var buffer = void 0,
        channelBuffer = void 0;
    try {
        buffer = ctx['createBuffer'](1, samples.length, sampleRate);
    } catch (e) {
        // iOS 不支持 22050 以下的采样率，于是先提升采样率，然后用慢速播放
        if (sampleRate < 11025) {
            /*buffer = ctx['createBuffer'](1, samples.length * 3, sampleRate * 3);
            _samples = increaseSampleRate(samples, 3);*/
            buffer = ctx['createBuffer'](1, samples.length, sampleRate * 4);
            curSourceNode['playbackRate'].value = 0.25;
        } else {
            /*buffer = ctx['createBuffer'](1, samples.length * 2, sampleRate * 2);
            _samples = increaseSampleRate(samples, 2);*/
            buffer = ctx['createBuffer'](1, samples.length, sampleRate * 2);
            curSourceNode['playbackRate'].value = 0.5;
        }
    }
    if (buffer['copyToChannel']) {
        buffer['copyToChannel'](_samples, 0, 0);
    } else {
        channelBuffer = buffer['getChannelData'](0);
        channelBuffer.set(_samples);
    }
    curSourceNode['buffer'] = buffer;
    curSourceNode['loop'] = false;
    curSourceNode['connect'](ctx['destination']);
    curSourceNode.onended = onEnded;
    curSourceNode.start();
};

var stopPcm = function stopPcm() {
    if (curSourceNode) {
        curSourceNode.stop();
        curSourceNode = null;
    }
};

var recorderStream = null;
var recorder = null;

var initRecorder = function initRecorder() {
    return new Promise(function (resolve, reject) {
        if (!recorder) {
            window.navigator.getUserMedia({ audio: true }, function (stream) {
                recorderStream = ctx['createMediaStreamSource'](stream);
                recorder = new Recorder(recorderStream);
                resolve();
            }, function (e) {
                reject(e);
            });
        } else {
            resolve();
        }
    });
};

var isRecording = function isRecording() {
    return recorder && recorder.recording;
};

var startRecord = function startRecord() {
    if (recorder) {
        recorder.clear();
        recorder.record();
    }
};

var stopRecord = function stopRecord() {
    if (recorder) {
        recorder.stop();
    }
};

var getRecordSampleRate = function getRecordSampleRate() {
    return ctx.sampleRate;
};

var generateRecordSamples = function generateRecordSamples() {
    return new Promise(function (resolve) {
        if (recorder) {
            recorder.getBuffer(function (buffers) {
                resolve(buffers[0]);
            });
        }
    });
};

/**
 * @file AMR 录音、转换、播放器
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/11/12
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

window.AMR = window.AMR || {};

var BenzAMRRecorder = function () {
    function BenzAMRRecorder() {
        classCallCheck(this, BenzAMRRecorder);
        this._isInit = false;
        this._isInitRecorder = false;
        this._samples = new Float32Array(0);
        this._blob = null;
        this._onEnded = null;
        this._onPlay = null;
        this._onStop = null;
        this._onStartRecord = null;
        this._onFinishRecord = null;
    }

    createClass(BenzAMRRecorder, [{
        key: 'isInit',
        value: function isInit() {
            return this._isInit;
        }
    }, {
        key: 'initWithAMRArray',
        value: function initWithAMRArray(array) {
            var _this = this;

            this._samples = AMR.decode(array);
            this._isInit = true;

            return new Promise(function (resolve, reject) {
                if (!_this._samples) {
                    reject(new Error('Failed to decode.'));
                } else {
                    resolve();
                }
            });
        }
    }, {
        key: 'initWithBlob',
        value: function initWithBlob(blob) {
            var _this2 = this;

            this._blob = blob;
            var p = new Promise(function (resolve) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    var data = new Uint8Array(e.target.result);
                    resolve(data);
                };
                reader.readAsArrayBuffer(blob);
            });
            return p.then(function (data) {
                return _this2.initWithAMRArray(data);
            });
        }
    }, {
        key: 'initWithUrl',
        value: function initWithUrl(url) {
            var _this3 = this;

            var p = new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url);
                xhr.responseType = 'blob';
                xhr.onload = function () {
                    resolve(this.response);
                };
                xhr.onerror = function () {
                    reject(new Error('Failed to fetch ' + url));
                };
                xhr.send();
            });
            return p.then(function (blob) {
                return _this3.initWithBlob(blob);
            });
        }
    }, {
        key: 'initWithRecord',
        value: function initWithRecord() {
            var _this4 = this;

            return new Promise(function (resolve, reject) {
                initRecorder().then(function () {
                    _this4._isInitRecorder = true;
                    resolve();
                }).catch(function (e) {
                    reject(e);
                });
            });
        }
    }, {
        key: 'on',
        value: function on(action, fn) {
            if (typeof fn === 'function') {
                switch (action) {
                    case 'play':
                        this._onPlay = fn;
                        break;
                    case 'stop':
                        this._onStop = fn;
                        break;
                    case 'ended':
                        this._onEnded = fn;
                        break;
                    case 'startRecord':
                        this._onStartRecord = fn;
                        break;
                    case 'finishRecord':
                        this._onFinishRecord = fn;
                        break;
                    default:
                }
            }
        }
    }, {
        key: 'onPlay',
        value: function onPlay(fn) {
            this.on('play', fn);
        }
    }, {
        key: 'onStop',
        value: function onStop(fn) {
            this.on('stop', fn);
        }
    }, {
        key: 'onEnded',
        value: function onEnded(fn) {
            this.on('ended', fn);
        }
    }, {
        key: 'onStartRecord',
        value: function onStartRecord(fn) {
            this.on('startRecord', fn);
        }
    }, {
        key: 'onFinishRecord',
        value: function onFinishRecord(fn) {
            this.on('finishRecord', fn);
        }
    }, {
        key: '_onEndCallback',
        value: function _onEndCallback() {
            if (this._onEnded) {
                this._onEnded();
            }
        }
    }, {
        key: 'play',
        value: function play() {
            if (!this._isInit) {
                throw new Error('Please init AMR first.');
            }
            if (this._onPlay) {
                this._onPlay();
            }
            playPcm(this._samples, this._isInitRecorder ? getRecordSampleRate() : 8000, this._onEndCallback.bind(this));
        }
    }, {
        key: 'stop',
        value: function stop() {
            stopPcm();
            if (this._onStop) {
                this._onStop();
            }
        }
    }, {
        key: 'startRecord',
        value: function startRecord$$1() {
            startRecord();
            if (this._onStartRecord) {
                this._onStartRecord();
            }
        }
    }, {
        key: 'finishRecord',
        value: function finishRecord() {
            var _this5 = this;

            return new Promise(function (resolve) {
                stopRecord();
                generateRecordSamples().then(function (samples) {
                    _this5._samples = samples;
                    _this5._blob = BenzAMRRecorder.encodeAMR(samples, getRecordSampleRate());
                    _this5._isInit = true;
                    if (_this5._onFinishRecord) {
                        _this5._onFinishRecord();
                    }
                    resolve();
                });
            });
        }
    }, {
        key: 'cancelRecord',
        value: function cancelRecord() {
            stopRecord();
        }
    }, {
        key: 'isRecording',
        value: function isRecording$$1() {
            return isRecording();
        }
    }, {
        key: 'getBlob',
        value: function getBlob() {
            return this._blob;
        }
    }], [{
        key: 'encodeAMR',
        value: function encodeAMR(samples, sampleRate) {
            sampleRate = sampleRate || 8000;
            var rawData = AMR.encode(samples, sampleRate, 7);
            var amrBlob = new Blob([rawData.buffer], { type: 'audio/amr' });
            return amrBlob;
        }
    }]);
    return BenzAMRRecorder;
}();

return BenzAMRRecorder;

}());
