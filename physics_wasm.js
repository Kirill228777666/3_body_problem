
(function(global){
  "use strict";

  var Module = global.Module || (global.Module = {});

  function refreshViews(memory) {
    Module.memory = memory;
    Module.HEAPU8 = new Uint8Array(memory.buffer);
    Module.HEAPF64 = new Float64Array(memory.buffer);
  }

  function locateWasm() {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].getAttribute('src') || '';
      if (src.indexOf('physics_wasm.js') !== -1) {
        return src.replace(/physics_wasm\.js(?:\?.*)?$/, 'physics_wasm.wasm');
      }
    }
    return 'physics_wasm.wasm';
  }

  if (!Module.ready) {
    Module.ready = fetch(locateWasm())
      .then(function(resp){
        if (!resp.ok) throw new Error('Не удалось загрузить physics_wasm.wasm');
        return resp.arrayBuffer();
      })
      .then(function(bytes){
        return WebAssembly.instantiate(bytes, {});
      })
      .then(function(result){
        var exports = result.instance.exports;
        refreshViews(exports.memory);
        Module._malloc = exports.malloc;
        Module._free = exports.free || function(){};
        Module._integrate = exports.integrate;
        Module._integrate_extrapolated = exports.integrate_extrapolated;
        Module.instance = result.instance;
        return Module;
      })
      .catch(function(err){
        console.error('WASM loader error:', err);
        throw err;
      });
  }
})(typeof window !== 'undefined' ? window : globalThis);
