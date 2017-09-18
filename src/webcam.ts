/**
 * Modern-Webcam
 *
 * @author waiting
 */


let _: boolean = false;    // browser supported
let modInited: boolean = false;     // module initialized
let mediaDevices: MediaDevices;
const devList: MediaDeviceInfo[] = [];   // available device
/**
 * defined device's label
 * [
 *  ['Scanner', 'USB Camema'],  // [master, slave] of device
 *  ['S920A3', 'USB CAM2'],  // [master, slave] of optional other device
 * ]
 */
let labelList: string[][] = [];



interface cam {
    guid: Guid;
    _instances: Map<Guid, Inst>;
    config: Config;
    streamConfig: StreamConfig;
}

const cam: cam = {
    guid: 1,
    _instances: new Map(),  // guid:Inst
    config: <Config> {
        debug: false,
        useDefault: true,
        ctx: '',
        fps: 30,
        previewWidth: 320,
        previewHeight: 280,
        flipHoriz: false,
        width:    640,
        height:   480,
        imageFormat:  'jpeg',
        jpegQuality:  95,
    },
    streamConfig: <StreamConfig> {
        streamIdx: -1,
        deviceName:    '',
    },
};


// static method
export interface Cam {
    (this: Cam, config: Config): Inst;
    _init(config: Config): Inst | void;
    get_device_list(): Promise<MediaDeviceInfo[] | void>;
    get_inst_by_guid(guid: Guid): Inst | void;
    get_insts(): Inst[] | void;
    destroy(): void;
    fn: CamFn;
    v: string;
}
export interface CamFn {
    init: Init;
    [s: string]: any;
}

export interface Init {
    new(config: Config): Inst;
    (this: Inst, config: Config): Inst;
    fn: InitFn;
}

export const Cam: Cam = <Cam> function(config) {
    return Cam._init(config);
};
Cam.v = '1.0.0';

const init = <Init> function(config): Inst {
    if (config && typeof config === 'object') {
        const inst = this;

        inst.guid = cam.guid;
        inst.ctx = null;
        inst.video = null;
        inst.config = <Config> Object.assign({}, cam.config, config);
        inst.inited = false;
        inst.live = false;
        inst.streamMap = new Map();
        inst.streamConfigMap = new Map();
        inst.currStreamIdx = -1;
        cam.guid++;

        if (inst.config.ctx) {
            if (typeof inst.config.ctx === 'string') {
                inst.ctx = <HTMLElement> document.body.querySelector(inst.config.ctx);
            }
            else if (inst.config.ctx instanceof HTMLElement) {
                if (document.body.contains(<HTMLElement> inst.config.ctx)) {
                    inst.ctx = <HTMLElement> inst.config.ctx;
                }
            }
        }
        else {
            throw new Error('video container ctx not exists');
        }

        _init(inst);
        cam._instances.set(inst.guid, inst);
        // devList maybe empty at this time
        return inst;
    }
    else {
        throw new Error('initialize params missing');
    }
};

function _init(inst: Inst): void {
    const config = inst.config;
    const ctx = <HTMLFormElement> inst.ctx;

    ctx.innerHTML = '';

    const div = <HTMLDivElement> document.createElement('div');

    ctx.appendChild(div);
    inst.holder = div;

    // set previewWidth previewHeight if not set
    if ( ! config.previewWidth) {
        config.previewWidth = ctx.offsetWidth;
    }
    if ( ! config.previewHeight) {
        config.previewHeight = ctx.offsetHeight;
    }

    if (config.previewWidth <= 0 || config.previewHeight <= 0) {
        console.error('previewWidth or previewHeight of preview container invalie');
        return;
    }

    if (config.width <= 0) {
        config.width = config.previewWidth;
    }
    if (config.height <= 0) {
        config.height = config.previewHeight;
    }
    let scaleX = config.previewWidth / config.width;
    let scaleY = config.previewHeight / config.height;

    if (typeof config.fps !== 'number') {
        config.fps = 30;
    }

    const video = <HTMLVideoElement> document.createElement('video');

    video.setAttribute('autoplay', 'autoplay');
    if (video.style) {
        video.style.width = '' + config.width + 'px';
        video.style.height = '' + config.height + 'px';
    }

    if ((scaleX !== 1.0) || (scaleY !== 1.0)) {
        if (ctx.style) {
            ctx.style.overflow = 'hidden';
        }

        if (video.style) {
            video.style.transformOrigin = '0px 0px';
            video.style.transform = 'scaleX(' + scaleX + ') scaleY(' + scaleY + ')';
        }
    }

    ctx.appendChild( video );
    inst.video = video;
    inst.inited = true;
    inst.live = false;
}


Cam.fn = Cam.prototype;
// init.fn = init.prototype = Cam.fn;
init.fn = init.prototype;
Cam.fn.init = init;

Cam._init = function(config) {
    try {
        return new Cam.fn.init(config);
    }
    catch(ex) {
        console.error(ex);
        return;
    }
};

function init_mod(): Promise<boolean> {
    if (modInited) {
        return Promise.resolve(true);
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        mediaDevices = navigator.mediaDevices;
    }
    else {
        return Promise.resolve(false);
    }

    window.addEventListener('beforeunload', (event) => {
        Cam.destroy();
    });

    return mediaDevices.enumerateDevices()
    .then((devices: MediaDeviceInfo[]) => {
        gotDevices(devices);
        return true;
    })
    .catch(handleError);
}
const pms = init_mod();


function handleError(err) {
    console.error(err);
}

function gotDevices(deviceInfos: MediaDeviceInfo[]): void {
    for (let i = 0; i < deviceInfos.length; i++) {
        const dev = deviceInfos[i];

        if (dev.kind === 'videoinput') {
            devList.push(dev);
        }
    }
}

Cam.get_device_list = function() {
    return pms.then(res => {
        if (res) {
            return devList;
        }
    });
};


Cam.get_inst_by_guid = function(guid) {
    const inst = cam._instances.get(+guid);

    if ( ! inst) {
        console.info('inst empty guid:' + guid);
        return;
    }
    return inst;
};

Cam.get_insts = function() {
    if ( ! cam._instances.size) {
        return;
    }
    return Array.from(cam._instances.values());
};

// destroy Cam module
Cam.destroy = function() {
    const insts = this.get_insts();

    if (insts) {
        for (let inst of insts) {
            inst.reset();
        }
    }
};


/* ---------- static method END -------------- */

/* ---------- init method START -------------- */

init.fn.set = function(sconfig) {
    const inst = this;

    if ( ! sconfig || (Array.isArray(sconfig) && ! sconfig.length)) {
        console.error('set() sconfig empty', sconfig);
        return inst;
    }
    if (Array.isArray(sconfig)) {
        for (let i = 0, len = sconfig.length; i < len; i++) {
            inst._set(sconfig[i]);
        }
    }
    else {
        inst._set(sconfig);
    }

    return inst;
};
init.fn._set = function(sconfig) {
    const inst = this;

    if ( ! sconfig) {
        return;
    }
    const defaults = Object.assign({}, cam.config, cam.streamConfig);
    const sidx = +sconfig.streamIdx;

    if (Number.isNaN(sidx)) {
        console.error('set() param streamIdx invalid');
        return;
    }

    let p = <StreamConfig> {};

    for (let x in sconfig) {
        if ( ! {}.hasOwnProperty.call(sconfig, x)) {
            continue;
        }
        p[x] = sconfig[x];
    }
    p.streamIdx = sidx;
    p.ctx = inst.config.ctx;
    p = Object.assign({}, defaults, p);

    set_stream_config(inst, sidx, p);
};


init.fn.get_stream_config = function(sidx) {
    return this.streamConfigMap.get(sidx);
};

init.fn.get_all_stream_idx = function() {
    return Array.from(this.streamConfigMap.keys());
};



// connect selected vedio
init.fn.connect = function(sidx) {
    const inst = this;

    sidx = +sidx;
    if (Number.isNaN(sidx) || sidx < 0) {
        console.error('connect() param sidx invalid');
        return Promise.resolve(inst);
    }

    return pms.then(res => {
        if (res) {
            const sconfig = inst.get_stream_config(sidx);

            if (sconfig) {
                inst._set_stream_device_label(sconfig);
                return _switch_stream(inst, sidx).then(() => {
                    return inst;
                }).catch(err => {
                    console.error(err);
                    return inst;
                });

            }
        }
        return inst;
    });

};


init.fn._set_stream_device_label = function(sconfig) {
    const inst = this;
    if ( ! devList || ! devList.length) {
        return inst;
    }
    const sidx = +sconfig.streamIdx;
    const arr = get_devices_by_sidx(sidx);
    let name;

    if ( ! arr && inst.config.useDefault) {
        name = devList[sidx] ? devList[sidx].label : devList[0].label;    // maybe empty during file opened directly insteadof through URL
    }
    else if (arr && arr.length) {
        for (let i = 0, len = arr.length; i < len; i++) {
            let gotten = false;

            for (let j = 0; j < devList.length; j++) {
                const label = devList[j].label;

                if (label && label.indexOf(arr[i]) > -1) {
                    name = label;
                    break;
                }
            }
            if (gotten) {
                break;
            }
        }
    }
    sconfig.deviceName = name;

    return inst;
};


init.fn.reset = function() {
    const inst = this;
    const arr = inst.get_all_stream_idx();
    if (arr && arr.length) {
        for (let i = 0, len = arr.length; i < len; i++) {
            inst._reset(arr[i]);
        }
    }

    if (inst.ctx) {
        inst.ctx.innerHTML = '';
        inst.ctx = null;
    }
    inst.live = true;

    return inst;
};

init.fn._reset = function(sidx) {
    const inst = this;

    inst.release_stream(sidx);

    return inst;
};

init.fn.release_stream = function(sidx) {
    const inst = this;
    const sconfig = inst.get_stream_config(sidx);

    if (sconfig) {
        inst.stop_media(sidx)
            .streamMap.delete(sidx);
    }

    return inst;
};

init.fn.stop_media = function(sidx) {
    const inst = this;
    const stream = inst.streamMap.get(sidx);

    if (stream) {
        if (typeof stream.getVideoTracks === 'function') {
            try {
                const tracks: MediaStreamTrack[] = stream.getVideoTracks();

                for (let i = 0, len = tracks.length; i < len; i++) {
                    if (tracks[i] && typeof tracks[i].stop === 'function') {
                        tracks[i].stop();
                    }
                }
            }
            catch(ex) {
                console.error(ex);
            }
        }
    }

    return inst;
};


init.fn.snap = function(opts) {
    const inst = this;
    let sidx: number;
    let sopts: SnapParams;  // snap opts

    if (typeof opts === 'undefined') {
        sidx = inst.currStreamIdx;
        sopts = <StreamConfig> inst.get_stream_config(sidx);
    }
    else if (typeof opts === 'number') {
        sidx = opts;
        sopts = <StreamConfig> inst.get_stream_config(sidx);
    }
    else if (typeof opts === 'object' && opts) {
        sidx = +opts.streamIdx;
        const sconfig = inst.get_stream_config(sidx);

        sopts = Object.assign({}, (sconfig ? sconfig : {}) , opts);
    }
    else {
        assert_never(opts);
        return Promise.resolve('');
    }

    if (typeof sopts === 'undefined' ||  ! sopts ) {
        console.error('snap opts invalid');
        return Promise.resolve('');
    }
    if (Number.isNaN(+sopts.streamIdx) || sopts.streamIdx < 0) {
        console.error('streamIdx invalid');
        return Promise.resolve('');
    }

    if ( ! inst.live) {
        console.error('stream not lived');
        return Promise.resolve('');
    }

    return snap(inst, sopts);
};

/* ---------- init method END -------------- */


function set_stream_config(inst: Inst, sidx: StreamIdx, sconfig: StreamConfig): void {
    inst.streamConfigMap.set(sidx, sconfig);
}


function _switch_stream(inst, sidx): Promise<string | void> {
    sidx = +sidx;
    if (sidx && inst.currStreamIdx && sidx === inst.currStreamIdx) {
        console.log('switch the same stream. skipped');
        return Promise.resolve();
    }
    const sconfig = inst.get_stream_config(sidx);

    if ( ! sconfig) {
        return Promise.reject('streamConfig empty');
    }
    // inst.stop_media(inst.currStreamIdx);

    return _switch_stream_html(inst, sidx, sconfig);
}

function _switch_stream_html(inst: Inst, sidx: StreamIdx, sconfig: StreamConfig): Promise<string | void> {
    if ( ! sconfig.deviceName) {
        return Promise.reject('_switch_stream_html() deviceName empty');
    }
    const deviceId = get_deviceid_by_label(sconfig.deviceName);
    if ( ! deviceId) {
        return Promise.resolve('deviceId empty');
    }

    const last = inst.streamMap.get(sidx);

    if (last) {
        return attach_stream(inst, sidx, last);
    }

    // ask user for access to their camera
    const vOpts = <VideoConstraints> {
        width: {
            ideal: sconfig.width,
        },
        height: {
            ideal: sconfig.height,
        },
    };

    if (deviceId) {
        vOpts.deviceId = {exact: deviceId};
    }

    return mediaDevices.getUserMedia({
        'audio': false,
        'video': vOpts,
    })
    .then( function(stream) {
        if (stream && inst.video) {
            return attach_stream(inst, sidx, stream);
        }
        else {
            console.error('vedio or stream blank during switch camera');
            return Promise.reject('no_retry');
        }
    })
    .catch( function(err) {
        if (err === 'no_retry') {
            console.error(err);
            return;
        }
    });
}



// get tracks label have the same index from pre defined label list
function get_devices_by_sidx(sidx: StreamIdx): DevLabel[] | void {
    sidx = +sidx;
    if (Number.isNaN(sidx) || sidx < 0) {
        return;
    }
    if ( ! labelList || ! labelList.length) {
        return;
    }
    const res: DevLabel[] = [];

    for (let i = 0, len = labelList.length; i < len; i++) {
        const row = labelList[i];

        if (row && Array.isArray(row) && typeof row[sidx] === 'string') {
            res.push(row[sidx]);
        }
    }

    return res;
}


function get_deviceid_by_label(name: string): string | void {
    if (typeof name !== 'string' || ! name || ! devList.length) {
        return;
    }
    const arr = name.split(',');

    for (let i = 0, len = arr.length; i < len; i++) {
        arr[i] = arr[i].trim();
    }
    for (let i = 0, len = devList.length; i < len; i++) {
        const dev = devList[i];
        const label = dev && dev.label ? dev.label : '';
        let matched = false;

        if ( ! label) {
            continue;
        }
        for (let j = 0; j < arr.length; j++) {
            const needle = arr[j];

            if (needle) {
                if (label.indexOf(needle) > -1) {
                    matched = true;
                }
                else {
                    matched = false;
                }
            }
        }
        if (matched) {
            return dev.deviceId;
        }
    }
}

function attach_stream(inst: Inst, sidx: StreamIdx, stream): Promise<string | void> {
    return new Promise((resolve, reject) => {
        if (inst && inst.video && stream) {
            inst.video.onloadedmetadata = function(e) {
                inst.streamMap.set(sidx, stream);
                inst.currStreamIdx = sidx;
                inst.live = true;
                resolve();
            };
            inst.video.srcObject = stream;
        }
        else {
            if (inst) {
                inst.live = false;
            }
            reject('attach_stream() params inst or stream invalid');
        }
    });
}

function snap(inst: Inst, sopts: SnapParams): Promise<string> {
    const cvs: HTMLCanvasElement = document.createElement('canvas');

    cvs.width = sopts.width;
    cvs.height = sopts.height;
    const ctx = cvs.getContext('2d');

    if ( ! ctx) {
        console.error('ctx empty');
        return Promise.resolve('');
    }

    // flip canvas horizontally if desired
    if (sopts.flipHoriz) {
        ctx.translate(sopts.width, 0);
        ctx.scale(-1, 1);
    }
    const video = inst.video;

    if (video) {
        ctx.drawImage(video, 0, 0, sopts.width, sopts.height);

        return new Promise<string>((resolve, reject) => {
            const durl = cvs.toDataURL('image/' + sopts.imageFormat, sopts.jpegQuality / 100);

            return resolve(durl ? durl : '');
        }).catch(err => {
            console.error(err);
            return '';
        });
    }
    else {
        console.error('video empty');
        return Promise.resolve('');
    }
}

function assert_never(x: never): never {
    throw new Error('Unexpected object: ' + x);
}


/* ---------- other declaration ------- */

export type Guid = number;
export type CamIdx = number;    // index of multi cameras
export type StreamIdx = number;    // the track index of camera output. 0 for primaray/master, 1 for secondary/slave
export type DevLabel = string;
export type stor = string | HTMLElement;
export type ImgDataType = 'dataURL' | 'objectURL';
export interface BaseConfig {
    debug: boolean;
    useDefault: boolean;    // use default camera during labelList empty
    ctx: stor;
    fps: number;
    previewWidth: number;
    previewHeight: number;
    flipHoriz: boolean;
    width: number;
    height:  number;
    imageFormat:  string;
    dataType:   ImgDataType;
    jpegQuality:  number;
}
export interface Config extends BaseConfig {}
export interface StreamConfig extends BaseConfig {
    streamIdx: StreamIdx;
    deviceName?:   string;
}
export interface SnapParams {
    streamIdx: StreamIdx
    width: number;
    height: number;
    flipHoriz: boolean;
    imageFormat:  string;
    dataType:   ImgDataType;
    jpegQuality:  number;
}

export interface VideoConstraints {
    width: {
        ideal: number;
    };
    height: {
        ideal: number;
    };
    deviceId?: {
        exact: string;
    };
}

export interface InitFn {
    reset(this: Inst): Inst;
    _reset(this: Inst, sidx: StreamIdx): Inst;
    set(this: Inst, sconfig: StreamConfig | StreamConfig[]): Inst;
    _set(this: Inst, sconfig: StreamConfig): void;
    _set_stream_device_label(this: Inst, sconfig: StreamConfig): Inst;
    get_stream_config(this: Inst, sidx: StreamIdx): StreamConfig | void;
    get_all_stream_idx(this: Inst): StreamIdx[];
    release_stream(this: Inst, sidx: StreamIdx): Inst;
    stop_media(this: Inst, sidx: StreamIdx): Inst;
    connect(this: Inst, sidx: StreamIdx): Promise<Inst>;
    snap(this: Inst, opts?: StreamIdx | SnapParams): Promise<string>;
}
export interface Inst extends InitFn {
    guid: Guid;
    ctx: HTMLElement | null;
    holder: HTMLDivElement | null;
    video: HTMLVideoElement | null;
    streamMap: Map<StreamIdx, MediaStream>;
    streamConfigMap: Map<StreamIdx, StreamConfig>;
    config: Config;
    inited: boolean;
    live: boolean;
    currStreamIdx: number;
}


export default Cam;
