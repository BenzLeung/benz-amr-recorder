# AMR Recorder

Play, record, reformat AMR audio, in pure Javascript, without any server.

This project is based on [amr.js](https://github.com/jpemartins/amr.js) and [RecorderJs](https://github.com/jergason/Recorderjs).

## Feature

 - Simple API for playing and recording AMR audio.
 - Supported url or blob (e.g. `<input type="file">`) to initialize AMR.
 - Supported reformat audio which browser is supported (such as MP3 or OGG) to AMR audio.
 - AMR that is encoded could be downloaded, without any server.
 
## Demo

[demo-en.html](https://benzleung.github.io/benz-amr-recorder/demo-en.html)

## Usage

Play an AMR:

```javascript
var amr = new BenzAMRRecorder();
amr.initWithUrl('path/to/voice.amr').then(function() {
  amr.play();
});
amr.onEnded(function() {
  alert('播放完毕');
})
```

Play a local file:

```html
<input type="file" id="amr-file" accept=".amr">
```

```javascript
var amr = new BenzAMRRecorder();
var amrFileObj = document.getElementById('amr-file');
amrFileObj.onchange = function() {
  amr.initWithBlob(this.files[0]).then(function() {
    amr.play();
  });
}
```

Record AMR:

```javascript
var amrRec = new BenzAMRRecorder();
amrRec.initWithRecord().then(function() {
  amrRec.startRecord();
});
```

Download AMR:

```javascript
window.location.href = window.URL.createObjectURL(amr.getBlob());
```

Reformat MP3 to AMR (Need browser support MP3 format):

```javascript
var amrFromMp3 = new BenzAMRRecorder();
amrFromMp3.initWithUrl('path/to/file.mp3').then(function() {
  // 下载 amr 文件
  window.location.href = window.URL.createObjectURL(amrFromMp3.getBlob());
})
```

## API

#### Initialize

```javascript
/**
 * If AMR was initialized
 * @return {boolean}
 */
amr.isInit();
```

```javascript
/**
 * Init with Float32Array
 * @param {Float32Array} array
 * @return {Promise}
 */
amr.initWithArrayBuffer(array);
```

```javascript
/**
 * Init with Blob object ( <input type="file"> )
 * @param {Blob} blob
 * @return {Promise}
 */
amr.initWithBlob(blob);
```

```javascript
/**
 * Init with URL
 * @param {string} url
 * @return {Promise}
 */
amr.initWithUrl(url);
```

```javascript
/**
 * Initialize record
 * @return {Promise}
 */
amr.initWithRecord();
```

#### Event listeners

**Notice: They will NOT add the event listener. They simply cover the old listener only.**

```javascript
/**
 * On play
 * @param {Function} fn
 */
amr.onPlay(function() {
  console.log('开始播放');
});
```

```javascript
/**
 * On stop (Include onEnded)
 * @param {Function} fn
 */
amr.onStop(function() {
  console.log('停止播放');
});
```

```javascript
/**
 * on play ended
 * @param {Function} fn
 */
amr.onEnded(function() {
  console.log('播放结束');
});
```

```javascript
/**
 * on start record
 * @param {Function} fn
 */
amr.onStartRecord(function() {
  console.log('开始录音');
});
```

```javascript
/**
 * on finish record
 * @param {Function} fn
 */
amr.onFinishRecord(function() {
  console.log('结束录音');
});
```

#### Playing controls

```javascript
/**
 * play
 */
amr.play();
```

```javascript
/**
 * stop
 */
amr.stop();
```

```javascript
/**
 * If AMR was playing
 * @return {boolean}
 */
amr.isPlaying();
```

#### Recording controls

```javascript
/**
 * Start record
 */
amr.startRecord();
```

```javascript
/**
 * Finish record, and then reformat to AMR
 * @return {Promise}
 */
amr.finishRecord();
```

```javascript
/**
 * Cancel record
 */
amr.cancelRecord();
```

```javascript
/**
 * If it was recording
 * @return {boolean}
 */
amr.isRecording();
```

#### Other APIs

```javascript
/**
 * Get duration of the AMR (by second)
 * @return {Number}
 */
amr.getDuration();
```

```javascript
/**
 * Get the Blob object of the AMR file (Use for download)
 * @return {Blob}
 */
amr.getBlob();
```

# Todo list

 - Encode & decode with WebWorker.
 - Pause function.
 - Playing progress and jump to a position.

# License

MIT.
