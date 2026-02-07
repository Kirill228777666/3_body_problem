(function(){
  "use strict";

  window.MathJax = window.MathJax || {
    tex: { inlineMath: [['\\(','\\)']], displayMath: [['\\[','\\]']] },
    svg: { fontCache: 'global' }
  };

  function SickSlider(sliderElementSelector) {
    var that = {
      onSliderChange: null,
      previousSliderValue: -42,
      didRequestUpdateOnNextFrame: false,
      valueNorm: 0
    };

    that.init = function(selector) {
      that.slider = document.querySelector(selector);
      if (!that.slider) throw new Error("SickSlider: .slider not found");
      that.sliderHead = that.slider.querySelector(".SickSlider-head");
      that.stripe = that.slider.querySelector(".SickSlider-stripe");
      if (!that.sliderHead) throw new Error("SickSlider: .SickSlider-head not found");

      that.sliding = false;

      that.slider.addEventListener("mousedown", function(e) {
        that.sliding = true;
        that.updateOnPointer(e.clientX);
        e.preventDefault();
      });
      document.addEventListener("mousemove", function(e) {
        if (!that.sliding) return;
        that.updateOnPointer(e.clientX);
        e.preventDefault();
      });
      document.addEventListener("mouseup", function() {
        that.sliding = false;
      });

      that.slider.addEventListener("touchstart", function(e) {
        that.sliding = true;
        var t = e.touches[0];
        that.updateOnPointer(t.clientX);
        e.preventDefault();
      }, { passive: false });
      document.addEventListener("touchmove", function(e) {
        if (!that.sliding) return;
        var t = e.touches[0];
        that.updateOnPointer(t.clientX);
        e.preventDefault();
      }, { passive: false });
      document.addEventListener("touchend", function() {
        that.sliding = false;
      });

      window.addEventListener("resize", that.relayout);
      that.relayout();

      return that;
    };

    that.relayout = function(){
      var rect = that.slider.getBoundingClientRect();
      that.sliderLeft = rect.left + window.scrollX;
      that.sliderWidth = rect.width;
      that.placeHeadByNorm();
    };

    that.updateOnPointer = function(clientX){
      var x = clientX - that.sliderLeft;
      var headWidth = that.sliderHead.getBoundingClientRect().width || 0;
      var usable = Math.max(1, that.sliderWidth - headWidth);
      var norm = (x - headWidth/2) / usable;
      if (!isFinite(norm)) norm = 0;
      if (norm < 0) norm = 0; if (norm > 1) norm = 1;
      that.setNormalizedValue(norm, true);
      if (typeof that.onSliderChange === "function") that.onSliderChange(norm);
    };

    that.placeHeadByNorm = function(){
      var headWidth = that.sliderHead.getBoundingClientRect().width || 0;
      var usable = Math.max(1, that.sliderWidth - headWidth);
      var left = usable * that.valueNorm;
      that.sliderHead.style.left = left + "px";
    };

    that.setNormalizedValue = function(norm, silent){
      if (!isFinite(norm)) norm = 0;
      if (norm < 0) norm = 0; if (norm > 1) norm = 1;
      that.valueNorm = norm;
      that.placeHeadByNorm();
      if (!silent && typeof that.onSliderChange === "function") {
        that.onSliderChange(norm);
      }
    };

    return that.init(sliderElementSelector);
  }

  function debug(text){
    var output = document.querySelector(".ThreeBodyProblem-debugOutput");
    if (output) output.textContent = text;
    else console.log(text);
  }

  var rungeKutta = (function(){
    function calculate(h, u, derivative) {
      var n = u.length;
      var u0 = u.slice();
      var k1 = derivative();
      var tmp = new Array(n);

      for (var i=0;i<n;i++) tmp[i] = u0[i] + (h/2) * k1[i];
      var save = u.slice();
      for (var i2=0;i2<n;i2++) u[i2] = tmp[i2];
      var k2 = derivative();

      for (var j=0;j<n;j++) tmp[j] = u0[j] + (h/2) * k2[j];
      for (var i3=0;i3<n;i3++) u[i3] = tmp[i3];
      var k3 = derivative();

      for (var j2=0;j2<n;j2++) tmp[j2] = u0[j2] + h * k3[j2];
      for (var i4=0;i4<n;i4++) u[i4] = tmp[i4];
      var k4 = derivative();

      for (var m=0;m<n;m++) {
        u[m] = u0[m] + (h/6) * (k1[m] + 2*k2[m] + 2*k3[m] + k4[m]);
      }
    }
    return { calculate: calculate };
  })();

  window.SickSlider = SickSlider;
  window.debug = debug;
  window.rungeKutta = rungeKutta;

})();