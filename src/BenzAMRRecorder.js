/**
 * @file AMR 录音、转换、播放器
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/11/12
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

import {
    decodeAudioArrayBufferByContext,
    generateRecordSamples,
    getCtxSampleRate,
    initRecorder,
    isRecording,
    playPcm,
    startRecord,
    stopPcm,
    stopRecord
} from "./audioContext";

import AMR from "../lib/amrnb";

export default class BenzAMRRecorder {

    _isInit = false;

    _isInitRecorder = false;

    _samples = new Float32Array(0);

    _rawData = new Uint8Array(0);

    _blob = null;

    _onEnded = null;

    _onPlay = null;

    _onStop = null;

    _onStartRecord = null;

    _onFinishRecord = null;

    _isPlaying = false;

    isInit() {
        return this._isInit;
    }

    initWithArrayBuffer(array) {
        if (this._isInit || this._isInitRecorder) {
            throw new Error('AMR has been initialized. For a new AMR, please generate a new BenzAMRRecorder().');
        }
        return new Promise((resolve, reject) => {
            let u8Array = new Uint8Array(array);
            this._samples = AMR.decode(u8Array);
            this._isInit = true;

            if (!this._samples) {
                decodeAudioArrayBufferByContext(array).then((data) => {
                    this._isInit = true;
                    this._rawData = BenzAMRRecorder.encodeAMR(new Float32Array(data), getCtxSampleRate());
                    this._samples = AMR.decode(this._rawData);
                    this._blob = BenzAMRRecorder.rawAMRData2Blob(this._rawData);
                    resolve();
                }).catch(() => {
                    reject(new Error('Failed to decode.'));
                });
            } else {
                this._rawData = u8Array;
                resolve();
            }

        });
    }

    initWithBlob(blob) {
        if (this._isInit || this._isInitRecorder) {
            throw new Error('AMR has been initialized. For a new AMR, please generate a new BenzAMRRecorder().');
        }
        this._blob = blob;
        const p = new Promise((resolve) => {
            let reader = new FileReader();
            reader.onload = function(e) {
                resolve(e.target.result);
            };
            reader.readAsArrayBuffer(blob);
        });
        return p.then((data) => {
            return this.initWithArrayBuffer(data);
        });
    }

    initWithUrl(url) {
        if (this._isInit || this._isInitRecorder) {
            throw new Error('AMR has been initialized. For a new AMR, please generate a new BenzAMRRecorder().');
        }
        // 先播放一个空音频，
        // 因为有些环境（如iOS）播放首个音频时禁止自动、异步播放，
        // 播放空音频防止加载后立即播放的功能失效。
        // 但即使如此，initWithUrl 仍然须放入一个用户事件中
        playPcm(new Float32Array(10), 24000);

        const p = new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function() {
                resolve(this.response);
            };
            xhr.onerror = function() {
                reject(new Error('Failed to fetch ' + url));
            };
            xhr.send();
        });
        return p.then((array) => {
            return this.initWithArrayBuffer(array);
        });
    }

    initWithRecord() {
        if (this._isInit || this._isInitRecorder) {
            throw new Error('AMR has been initialized. For a new AMR, please generate a new BenzAMRRecorder().');
        }
        return new Promise((resolve, reject) => {
            initRecorder().then(() => {
                this._isInitRecorder = true;
                resolve();
            }).catch((e) => {
                reject(e);
            });
        });
    }

    on(action, fn) {
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

    onPlay(fn) {
        this.on('play', fn);
    }

    onStop(fn) {
        this.on('stop', fn);
    }

    onEnded(fn) {
        this.on('ended', fn);
    }

    onStartRecord(fn) {
        this.on('startRecord', fn);
    }

    onFinishRecord(fn) {
        this.on('finishRecord', fn);
    }

    _onEndCallback() {
        this._isPlaying = false;
        if (this._onStop) {
            this._onStop();
        }
        if (this._onEnded) {
            this._onEnded();
        }
    }

    play() {
        if (!this._isInit) {
            throw new Error('Please init AMR first.');
        }
        if (this._onPlay) {
            this._onPlay();
        }
        this._isPlaying = true;
        playPcm(this._samples, this._isInitRecorder ? getCtxSampleRate() : 8000, this._onEndCallback.bind(this));
    }

    stop() {
        stopPcm();
        this._isPlaying = false;
        if (this._onStop) {
            this._onStop();
        }
    }

    isPlaying() {
        return this._isPlaying;
    }

    startRecord() {
        startRecord();
        if (this._onStartRecord) {
            this._onStartRecord();
        }
    }

    finishRecord() {
        return new Promise((resolve) => {
            stopRecord();
            generateRecordSamples().then((samples) => {
                this._samples = samples;
                this._rawData = BenzAMRRecorder.encodeAMR(samples, getCtxSampleRate());
                this._blob = BenzAMRRecorder.rawAMRData2Blob(this._rawData);
                this._isInit = true;
                if (this._onFinishRecord) {
                    this._onFinishRecord();
                }
                resolve();
            })
        });
    }

    cancelRecord() {
        stopRecord();
    }

    isRecording() {
        return isRecording();
    }

    getDuration() {
        let rate = this._isInitRecorder ? getCtxSampleRate() : 8000;
        return this._samples.length / rate;
    }

    getBlob() {
        return this._blob;
    }

    static encodeAMR(samples, sampleRate) {
        sampleRate = sampleRate || 8000;
        return AMR.encode(samples, sampleRate, 7);
    }

    static rawAMRData2Blob(data) {
        return new Blob([data.buffer], {type: 'audio/amr'});
    }
}
