/**
 * @fileOverview 描述文件
 * @author benz@youme.im
 * @date 2018/7/5
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

export default class BenzAMRRecorder {
    constructor();

    public isInit(): boolean;

    public initWithArrayBuffer(array: Float32Array): Promise<void>;
    public initWithBlob(blob: Blob): Promise<void>;
    public initWithUrl(url: string): Promise<void>;
    public initWithRecord(): Promise<void>;

    public play(): void;
    public stop(): void;
    public isPlaying(): boolean;

    public startRecord(): void;
    public finishRecord(): Promise<void>;
    public cancelRecord(): void;
    public isRecording(): boolean;

    public on(action: string, fn: () => void): void;
    public onPlay(fn: () => void): void;
    public onStop(fn: () => void): void;
    public onEnded(fn: () => void): void;

    public onStartRecord(fn: () => void): void;
    public onFinishRecord(fn: () => void): void;
    public onCancelRecord(fn: () => void): void;

    public getDuration(): number;
    public getBlob(): Blob;

    public encodeAMRAsync(samples: Float32Array): Promise<Uint8Array>;
    public decodeAMRAsync(u8Array: Uint8Array): Promise<Float32Array>;

    public static rawAMRData2Blob(data: Uint8Array): Blob;
}

