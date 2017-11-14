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

    play() {
        if (!this._isInit) {
            throw new Error('Please init AMR first.');
        }
        playPcm(this._samples, this._isInitRecorder ? getRecordSampleRate() : 8000);
    }

    static stop() {
        stopPcm();
    }

    startRecord() {
        startRecord();
    }

    finishRecord() {
        return new Promise((resolve) => {
            stopRecord();
            generateRecordSamples().then((samples) => {
                this._samples = samples;
                this._blob = BenzAMRRecorder.encodeAMR(samples, getRecordSampleRate());
                this._isInit = true;
                resolve();
            })
        });
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
