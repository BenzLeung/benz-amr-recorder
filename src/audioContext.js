/**
 * @file 公共的 Web Audio API Context
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/11/12
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

import Recorder from 'recorderjs';
import remix from 'audio-buffer-remix';

const AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;

let ctx = null;
let curSourceNode = null;

if (AudioContext) {
    ctx = new AudioContext();
} else {
    console.error(new Error('Web Audio API is Unsupported.'));
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

export const playPcm = function (samples, sampleRate, onEnded) {
    sampleRate = sampleRate || 8000;
    stopPcm();
    curSourceNode = ctx['createBufferSource']();
    let _samples = samples;
    let buffer, channelBuffer;
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
        buffer['copyToChannel'](_samples, 0, 0)
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

export const stopPcm = function () {
    if (curSourceNode) {
        curSourceNode.stop();
        curSourceNode = null;
    }
};

let recorderStream = null;
let recorder = null;
let recording = false;

export const initRecorder = function () {
    return new Promise((resolve, reject) => {
        let s = (stream) => {
            recorderStream = ctx['createMediaStreamSource'](stream);
            recorder = new Recorder(recorderStream);
            recording = false;
            resolve();
        };
        let j = (e) => {
            reject(e);
        };
        if (!recorder) {
            if (window.navigator.mediaDevices.getUserMedia) {
                window.navigator.mediaDevices.getUserMedia({audio: true}).then(s).catch(j);
            } else if (window.navigator.getUserMedia) {
                window.navigator.getUserMedia({audio: true}, s, j);
            } else {
                j();
            }
        } else {
            resolve();
        }
    });
};

export const isRecording = function () {
    return recorder && recording;
};

export const startRecord = function () {
    if (recorder) {
        recorder.clear();
        recorder.record();
        recording = true;
    }
};

export const stopRecord = function () {
    if (recorder) {
        recorder.stop();
        recording = false;
    }
};

export const getCtxSampleRate = function () {
    return ctx.sampleRate;
};

export const generateRecordSamples = function () {
    return new Promise((resolve) => {
        if (recorder) {
            recorder.getBuffer((buffers) => {
                resolve(buffers[0]);
            });
        }
    });
};

export const decodeAudioArrayBufferByContext = function (array) {
    return new Promise((resolve, reject) => {
        ctx['decodeAudioData'](array, (audioBuf) => {
            // 把多声道音频 mix 成单声道
            const oneChannel = remix(audioBuf, 1);
            resolve(oneChannel['getChannelData'](0));
        }, reject);
    });
};
