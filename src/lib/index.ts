
const cam: Cam = {
  guid: 1,
  _instances: new Map(),  // guid:Inst
  config: {
    debug: false,
    useDefault: true,
    ctx: '',
    fps: 30,
    previewWidth: 320,
    previewHeight: 240,
    flipHoriz: false,
    width: 0,
    height: 0,
    imageFormat: 'jpeg',
    jpegQuality: 95,
    dataType: 'dataURL',
    // msec. waiting time for vedio ready to snap() when camera switching needed.
    // no switching no snap delay
    switchDelay: 100,
    snapDelay: 0,        // msec. waiting time before snap()
    /**
     * defined device's label
     *  ['Scanner', 'USB Camema', ...]
     */
    devLabels: null,
    multiOptions: null,
  },
  streamConfig: <StreamConfig> {
    streamIdx: -1,
    deviceName: '',
    deviceId: '',
  },
}
