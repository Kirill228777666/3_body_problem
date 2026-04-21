(function(){
  "use strict";

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

  window.SickSlider = SickSlider;
})();
