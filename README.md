# Modern-WebcamJS
A JavaScript library for capturing still images from camera(s) via modern browsers.

[![Version](https://img.shields.io/npm/v/modern-webcamjs.svg)](https://www.npmjs.com/package/modern-webcamjs)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## What can I do with this?
Modern-WebcamJS is a JavaScript library for capturing still images from camera(s) attached by your computer, and delivering them to you as JPEG or PNG [Data URIs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs).  The images data also can be [objectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL) .  It uses [HTML5 getUserMedia](http://dev.w3.org/2011/webrtc/editor/getusermedia.html), so only modern browser such as FireFox, Chrome, Edge which supports navigator.mediaDevices.getUserMedia of HTML5 API supported.

## Installing
```powershell
npm install --save modern-webcamjs
```

## DEMO:
- basic: https://webcam.waitingsong.com/basic.html
- basic async/await: https://webcam.waitingsong.com/basic_await.html
- large: https://webcam.waitingsong.com/large.html
- capture: https://webcam.waitingsong.com/auto_capture.html
- capture options: https://webcam.waitingsong.com/snap_opts.html
- capture objectURL: https://webcam.waitingsong.com/snap_objecturl.html
- dynamic capture options: https://webcam.waitingsong.com/dynamic_snap_opts.html
- multiple camera: https://webcam.waitingsong.com/multi_camera.html
- custome sidx: https://webcam.waitingsong.com/custome_sidx.html
- double preview: https://webcam.waitingsong.com/double_preview.html
- white list: https://webcam.waitingsong.com/camera_whitelist.html



## License
[MIT](LICENSE)
