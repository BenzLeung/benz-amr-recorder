# AMR 录音机

([README in English](./README-EN.md))

纯前端解码、播放、录音、编码 AMR 音频，无须服务器支持，基于 [amr.js](https://github.com/jpemartins/amr.js) 和 [RecorderJs](https://github.com/jergason/Recorderjs)。

注意：由于使用了 amr.js 做编码和解码，因此 js 文件（压缩后，未 gzip）接近 500 KB，使用前请考虑。

**2019-10-05 更新 (v1.1.0)：**增加浏览器支持检测功能，增加暂停播放、设置播放进度功能。

## 特性

 - 方便的 API 实现解码、播放、录音、编码 AMR 文件。
 - 支持 url 和 blob （即`<input type="file">`）方式获取 AMR。
 - 支持将浏览器 `<audio>` 所支持的音频格式（例如 MP3 或 OGG 音频）转换成 AMR 音频。
 - 编码后的 AMR 文件可下载，无须服务器。

## Demo

[demo.html](https://benzleung.github.io/benz-amr-recorder/demo.html)

## 浏览器兼容性

最新的浏览器兼容性请参阅 [Can I Use](https://caniuse.com/#feat=stream) 。

 - 仅播放：[https://caniuse.com/#feat=audio-api](https://caniuse.com/#feat=audio-api)
 - 播放+录音：[https://caniuse.com/#feat=stream](https://caniuse.com/#feat=stream)

## 安装

方法一：引入 js 文件

```html
<script type="text/javascript" src="./BenzAMRRecorder.min.js"></script>
```

方法二：使用 npm

```
npm install benz-amr-recorder
```

```javascript
var BenzAMRRecorder = require('benz-amr-recorder');
```

## 用法

**注意：** 建议把 `initWithXXX()` 或 `play()` 方法绑定到一个用户事件中（例如 `click`、`touchstart`）。因为几乎所有移动设备（以及桌面版 Chrome 70+）都禁止页面自动播放音频。参考：

 - [https://webkit.org/blog/6784/new-video-policies-for-ios/](https://webkit.org/blog/6784/new-video-policies-for-ios/)
 - [https://developers.google.com/web/updates/2017/09/autoplay-policy-changes](https://developers.google.com/web/updates/2017/09/autoplay-policy-changes)

播放 AMR：

```javascript
var amr = new BenzAMRRecorder();
amr.initWithUrl('path/to/voice.amr').then(function() {
  amr.play();
});
amr.onEnded(function() {
  alert('播放完毕');
})
```

播放本地文件：

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

录制 AMR：

```javascript
var amrRec = new BenzAMRRecorder();
amrRec.initWithRecord().then(function() {
  amrRec.startRecord();
});
```

下载 AMR：

```javascript
window.location.href = window.URL.createObjectURL(amr.getBlob());
```

把 MP3 转换成 AMR （需要浏览器原生支持 MP3）：

```javascript
var amrFromMp3 = new BenzAMRRecorder();
amrFromMp3.initWithUrl('path/to/file.mp3').then(function() {
  // 下载 amr 文件
  window.location.href = window.URL.createObjectURL(amrFromMp3.getBlob());
})
```

## API

#### 初始化对象

```javascript
/**
 * 是否已经初始化
 * @return {boolean}
 */
amr.isInit();
```

```javascript
/**
 * 使用浮点数据初始化
 * @param {Float32Array} array
 * @return {Promise}
 */
amr.initWithArrayBuffer(array);
```

```javascript
/**
 * 使用 Blob 对象初始化（ <input type="file">）
 * @param {Blob} blob
 * @return {Promise}
 */
amr.initWithBlob(blob);
```

```javascript
/**
 * 使用 url 初始化
 * @param {string} url
 * @return {Promise}
 */
amr.initWithUrl(url);
```

```javascript
/**
 * 初始化录音
 * @return {Promise}
 */
amr.initWithRecord();
```

#### 事件

**注意：事件不会叠加，也就是说，新注册的事件将覆盖掉旧的事件。**

```javascript
/**
 * 播放
 * @param {Function} fn
 */
amr.onPlay(function() {
  console.log('开始播放');
});
```

```javascript
/**
 * 停止（包括播放结束）
 * @param {Function} fn
 */
amr.onStop(function() {
  console.log('停止播放');
});

```javascript
/**
 * 暂停
 * @param {Function} fn
 */
amr.onPause(function() {
  console.log('暂停');
});
```

```javascript
/**
 * （暂停状态中）继续播放
 * @param {Function} fn
 */
amr.onResume(function() {
  console.log('继续播放');
});
```

```javascript
/**
 * 播放结束
 * @param {Function} fn
 */
amr.onEnded(function() {
  console.log('播放结束');
});
```

```javascript
/**
 * 播放到结尾自动结束
 * @param {Function} fn
 */
amr.onAutoEnded(function() {
  console.log('播放自动结束');
});
```

```javascript
/**
 * 开始录音
 * @param {Function} fn
 */
amr.onStartRecord(function() {
  console.log('开始录音');
});
```

```javascript
/**
 * 结束录音
 * @param {Function} fn
 */
amr.onFinishRecord(function() {
  console.log('结束录音');
});
```

#### 播放控制

```javascript
/**
 * 播放（无视暂停状态）
 * @param {number?} startTime 可指定播放开始位置（秒，浮点数，可选）
 */
amr.play();
```

```javascript
/**
 * 停止
 */
amr.stop();
```

```javascript
/**
 * 暂停
 * @since 1.1.0
 */
amr.pause();
```

```javascript
/**
 * 从暂停状态中继续播放
 * @since 1.1.0
 */
amr.resume();
```

```javascript
/**
 * 整合 play() 和 resume()，若在暂停状态则继续，否则从头播放
 * @since 1.1.0
 */
amr.playOrResume();
```

```javascript
/**
 * 整合 resume() 和 pause()，切换暂停状态
 * @since 1.1.0
 */
amr.pauseOrResume();
```

```javascript
/**
 * 整合 play() 和 resume() 和 pause()
 * @since 1.1.0
 */
amr.playOrPauseOrResume();
```

```javascript
/**
 * 跳转到音频指定位置，不改变播放状态（若停止状态则等同于 `play(time)`） 
 * @since 1.1.0
 * @param {Number} time 指定位置（秒，浮点数）
 */
amr.setPosition(12.34);
```

```javascript
/**
 * 获取当前播放位置（秒） 
 * @since 1.1.0
 * @return {Number} 位置，秒，浮点数
 */
amr.getCurrentPosition();
```

```javascript
/**
 * 是否正在播放
 * @return {boolean}
 */
amr.isPlaying();
```

```javascript
/**
 * 是否暂停中
 * @since 1.1.0
 * @return {boolean}
 */
amr.isPaused();
```

#### 录音控制

```javascript
/**
 * 开始录音
 */
amr.startRecord();
```

```javascript
/**
 * 结束录音，并把录制的音频转换成 AMR
 * @return {Promise}
 */
amr.finishRecord();
```

```javascript
/**
 * 放弃录音
 */
amr.cancelRecord();
```

```javascript
/**
 * 是否正在录音
 * @return {boolean}
 */
amr.isRecording();
```

#### 其他

```javascript
/**
 * 获取音频的时间长度（单位：秒）
 * @return {Number}
 */
amr.getDuration();
```

```javascript
/**
 * 获取 AMR 文件的 Blob 对象（用于下载文件）
 * @return {Blob}
 */
amr.getBlob();
```

```javascript
/**
 * 判断浏览器是否支持播放
 * 注意这是静态(static)方法
 * @since 1.1.0
 * @return {boolean}
 */
BenzAMRRecorder.isPlaySupported();
// 不是 amr.isPlaySupported();
```

```javascript
/**
 * 判断浏览器是否支持录音
 * 注意这是静态(static)方法
 * @since 1.1.0
 * @return {boolean}
 */
BenzAMRRecorder.isRecordSupported();
// 不是 amr.isRecordSupported();
```

# 尚未完成的特性

 - [x] ~~使用 Worker 编码解码 AMR。~~
 - [x] ~~暂停播放功能。~~
 - [ ] 暂停录音功能。
 - [x] ~~播放进度控制。~~
 - [x] ~~浏览器兼容性检查（[#9](https://github.com/BenzLeung/benz-amr-recorder/issues/9) [#11](https://github.com/BenzLeung/benz-amr-recorder/issues/11)）。~~

# 许可

MIT.
