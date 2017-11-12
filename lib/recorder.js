import InlineWorker from './inlineWorker';

export class Recorder {
    config = {
        bufferLen: 4096,
        numChannels: 1,
        mimeType: 'audio/wav'
    };

    recording = false;

    callbacks = {
        getBuffer: [],
        exportWAV: []
    };

    constructor(source, cfg) {
        Object.assign(this.config, cfg);
        this.context = source.context;
        this.node = (this.context.createScriptProcessor ||
        this.context.createJavaScriptNode).call(this.context,
            this.config.bufferLen, this.config.numChannels, this.config.numChannels);

        this.node.onaudioprocess = (e) => {
            if (!this.recording) return;

            let buffer = [];
            for (let channel = 0; channel < this.config.numChannels; channel++) {
                buffer.push(e.inputBuffer.getChannelData(channel));
            }
            this.worker.postMessage({
                command: 'record',
                buffer: buffer
            });
        };

        source.connect(this.node);
        this.node.connect(this.context.destination);    //this should not be necessary

        let self = {};
        this.worker = new InlineWorker(function () {
            let recLength = 0,
                recBuffers = [],
                sampleRate,
                numChannels;

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
                sampleRate = config.sampleRate;
                numChannels = config.numChannels;
                initBuffers();
            }

            function record(inputBuffer) {
                for (let channel = 0; channel < numChannels; channel++) {
                    recBuffers[channel].push(inputBuffer[channel]);
                }
                recLength += inputBuffer[0].length;
            }


            function getBuffer() {
                let buffers = [];
                for (let channel = 0; channel < numChannels; channel++) {
                    buffers.push(mergeBuffers(recBuffers[channel], recLength));
                }
                this.postMessage({command: 'getBuffer', data: buffers});
            }

            function clear() {
                recLength = 0;
                recBuffers = [];
                initBuffers();
            }

            function initBuffers() {
                for (let channel = 0; channel < numChannels; channel++) {
                    recBuffers[channel] = [];
                }
            }

            function mergeBuffers(recBuffers, recLength) {
                let result = new Float32Array(recLength);
                let offset = 0;
                for (let i = 0; i < recBuffers.length; i++) {
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

        this.worker.onmessage = (e) => {
            let cb = this.callbacks[e.data.command].pop();
            if (typeof cb === 'function') {
                cb(e.data.data);
            }
        };
    }


    record() {
        this.recording = true;
    }

    stop() {
        this.recording = false;
    }

    clear() {
        this.worker.postMessage({command: 'clear'});
    }

    getBuffer(cb) {
        cb = cb || this.config.callback;
        if (!cb) throw new Error('Callback not set');

        this.callbacks.getBuffer.push(cb);

        this.worker.postMessage({command: 'getBuffer'});
    }

}

export default Recorder;
