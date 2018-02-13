/**
 * @file amr 编码解码的 Worker
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2018/2/12
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

self.onmessage = function (e) {
    switch(e.data.command){
        case 'encode':
            encode(e.data.samples, e.data.sampleRate, e.data.seq);
            break;
        case 'decode':
            decode(e.data.buffer, e.data.seq);
            break;
    }
};

function encode(samples, sampleRate, seq) {
    sampleRate = sampleRate || 8000;
    self.postMessage({
        command: 'encode',
        amr: AMR.encode(samples, sampleRate, 7),
        seq: seq
    });
}

function decode(u8Array, seq) {
    self.postMessage({
        command: 'decode',
        amr: AMR.decode(u8Array),
        seq: seq
    });
}
