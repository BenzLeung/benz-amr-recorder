/**
 * @file 公共的 Web Audio API Context
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/11/12
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

import Recorder from '../lib/recorder';

const AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;

let ctx = null;
let curSourceNode = null;

if (AudioContext) {
    ctx = new AudioContext();
} else {
    throw 'Web Audio API is Unsupported.'
}

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

export const playPcm = function (samples, sampleRate) {
    sampleRate = sampleRate || 8000;
    stopPcm();
    curSourceNode = ctx['createBufferSource']();
    let _samples = samples;
    let buffer, channelBuffer;
    try {
        buffer = ctx['createBuffer'](1, samples.length, sampleRate);
    } catch (e) {
        if (sampleRate < 11025) {
            buffer = ctx['createBuffer'](1, samples.length * 3, sampleRate * 3);
            _samples = increaseSampleRate(samples, 3);
        } else {
            buffer = ctx['createBuffer'](1, samples.length * 2, sampleRate * 2);
            _samples = increaseSampleRate(samples, 2);
        }
    }
    if (buffer['copyToChannel']) {
        buffer['copyToChannel'](_samples, 0, 0)
    } else {
        channelBuffer = buffer['getChannelData'](0);
        channelBuffer.set(_samples);
    }
    curSourceNode['buffer'] = buffer;
    curSourceNode['connect'](ctx['destination']);
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

export const initRecorder = function () {
    return new Promise((resolve, reject) => {
        if (!recorder) {
            window.navigator.getUserMedia({audio: true}, (stream) => {
                recorderStream = ctx['createMediaStreamSource'](stream);
                recorder = new Recorder(recorderStream);
                resolve();
            }, (e) => {
                reject(e);
            });
        } else {
            resolve();
        }
    });
};

export const isRecording = function () {
    return recorder.recording;
};

export const startRecord = function () {
    if (recorder) {
        recorder.clear();
        recorder.record();
    }
};

export const stopRecord = function () {
    if (recorder) {
        recorder.stop();
    }
};

export const getRecordSampleRate = function () {
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
