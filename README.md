# audio-sandbox
A small TS engine for building audio synths and more - in a browser

# description
This engine allows you to speed up creating any audio-related project, that is aimed to run on any browser, be it mobile or desktop. 
It includes:

- synths
- sampled based apps
- convolution and deconvolution processors, written entirely in TS and totally controlled by you (as opposed to a black box built in [convolver](https://developer.mozilla.org/en-US/docs/Web/API/ConvolverNode))
- many other useful things that even don't exist in [Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)!

# Uncompressing big files

Also, it will allow you to play a large compressed audio files without uncompressing it entirely - it will seamlesslly decode data piece by piece.
You don't have to worry about tricky "bit resorvoirs" - this tool will glue the piece to some last frames of the previous piece, that 
might contain a bit reservoir and will guarantee smooth, precise audio decoding. No more limitations of 45 seconds sample of [decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData)!

