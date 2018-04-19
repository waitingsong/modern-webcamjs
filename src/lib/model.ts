export type Guid = number
export type CamIdx = number // index of multi cameras
export type StreamIdx = number // the track index of camera output. 0 for primaray/master, 1 for secondary/slave
export type DevLabel = string
export type stor = string | HTMLElement
export type ImgDataType = 'dataURL' | 'dataurl' | 'objectURL' | 'objecturl'


export interface BaseConfig {
  debug: boolean
  useDefault: boolean    // use default camera during labelList empty
  ctx: stor
  fps: number
  previewWidth: number
  previewHeight: number
  flipHoriz: boolean
  width: number
  height: number
  imageFormat: 'jpeg' | 'png'
  jpegQuality: number
  dataType: ImgDataType
  switchDelay: number
  snapDelay: number
  devLabels: string[] | null
}
export interface Config extends BaseConfig {
  multiOptions?: StreamConfig[] | null
}

export interface StreamConfig extends BaseConfig {
  streamIdx: StreamIdx
  deviceName?: string
  deviceId?: string  // MediaTrackConstraints.deviceId
  [prop: string]: any
}

export interface SnapParams {
  streamIdx: StreamIdx
  width: number
  height: number
  flipHoriz: boolean
  imageFormat: 'jpeg' | 'png'
  jpegQuality: number
  dataType: ImgDataType
  switchDelay: number
  snapDelay: number
}
