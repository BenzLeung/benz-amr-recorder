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
    generateRecordSamples, getRecordSampleRate, initRecorder, isRecording, playPcm, startRecord, stopPcm,
    stopRecord
} from "./audioContext";

window.AMR = window.AMR || {};

export default class BenzAMRRecorder {

    _isInit = false;

    _isInitRecorder = false;

    _samples = new Float32Array(0);

    _blob = null;

    _onEnded = null;

    _onPlay = null;

    _onStop = null;

    _onStartRecord = null;

    _onFinishRecord = null;

    isInit() {
        return this._isInit;
    }

    initWithAMRArray(array) {
        this._samples = AMR.decode(array);
        this._isInit = true;

        return new Promise((resolve, reject) => {
            if (!this._samples) {
                reject(new Error('Failed to decode.'));
            } else {
                resolve();
            }
        });
    }

    initWithBlob(blob) {
        this._blob = blob;
        const p = new Promise((resolve) => {
            let reader = new FileReader();
            reader.onload = function(e) {
                let data = new Uint8Array(e.target.result);
                resolve(data);
            };
            reader.readAsArrayBuffer(blob);
        });
        return p.then((data) => {
            return this.initWithAMRArray(data);
        });
    }

    initWithUrl(url) {
        const p = new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = 'blob';
            xhr.onload = function() {
                resolve(this.response);
            };
            xhr.onerror = function() {
                reject(new Error('Failed to fetch ' + url));
            };
            xhr.send();
        });
        return p.then((blob) => {
            return this.initWithBlob(blob);
        });
    }

    initWithRecord() {
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
        playPcm(this._samples, this._isInitRecorder ? getRecordSampleRate() : 8000, this._onEndCallback.bind(this));
    }

    stop() {
        stopPcm();
        if (this._onStop) {
            this._onStop();
        }
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
                this._blob = BenzAMRRecorder.encodeAMR(samples, getRecordSampleRate());
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

    getBlob() {
        return this._blob;
    }

    static encodeAMR(samples, sampleRate) {
        sampleRate = sampleRate || 8000;
        let rawData = AMR.encode(samples, sampleRate, 7);
        let amrBlob = new Blob([rawData.buffer], {type: 'audio/amr'});
        return amrBlob;
    }
}
