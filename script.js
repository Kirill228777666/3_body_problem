(function(){
  "use strict";

  window.MathJax = {
    tex: { inlineMath: [['\\(','\\)']], displayMath: [['\\[','\\]']] },
    svg: { fontCache: 'global' }
  };

  function SickSlider(sliderElementSelector) {
    var that = {
      onSliderChange: null,
      previousSliderValue: -42,
      didRequestUpdateOnNextFrame: false
    };
    
    that.init = function(sliderElementSelector) {
      that.slider = document.querySelector(sliderElementSelector);
      that.sliderHead = that.slider.querySelector(".SickSlider-head");
      var sliding = false;
      
      that.slider.addEventListener("mousedown", function(e) {
        sliding = true;
        that.updateHeadPositionOnTouch(e);
      });
      
      that.slider.addEventListener("touchstart", function(e) {
        sliding = true;
        that.updateHeadPositionOnTouch(e);
      });
      
      that.slider.onselectstart = function () { return false; };
      document.addEventListener("mouseup", function(){ sliding = false; });
      document.addEventListener("dragend", function(){ sliding = false; });
      document.addEventListener("touchend", function(e) { sliding = false; });
      
      document.addEventListener("mousemove", function(e) {
        if (!sliding) { return; }
        that.updateHeadPositionOnTouch(e);
      });
      
      document.addEventListener("touchmove", function(e) {
        if (!sliding) { return; }
        that.updateHeadPositionOnTouch(e);
      });
      
      that.slider.addEventListener("touchmove", function(e) {
        if (typeof e.preventDefault !== 'undefined' && e.preventDefault !== null) {
          e.preventDefault();
        }
      });
    };
    
    that.sliderValueFromCursor = function(e) {
      var pointerX = e.pageX;
      if (e.touches && e.touches.length > 0) { pointerX = e.touches[0].pageX; }
      pointerX = pointerX - that.slider.offsetLeft;
      var headLeft = (pointerX - 16);
      if (headLeft < 0) { headLeft = 0; }
      if ((headLeft + that.sliderHead.offsetWidth) > that.slider.offsetWidth) {
        headLeft = that.slider.offsetWidth - that.sliderHead.offsetWidth;
      }
      var sliderWidthWithoutHead = that.slider.offsetWidth - that.sliderHead.offsetWidth;
      var sliderValue = 1;
      if (sliderWidthWithoutHead !== 0) {
        sliderValue = headLeft / sliderWidthWithoutHead;
      }
      return sliderValue;
    };
    
    that.changePosition = function(sliderValue) {
      var headLeft = (that.slider.offsetWidth - that.sliderHead.offsetWidth) * sliderValue;
      that.sliderHead.style.left = headLeft + "px";
    };
    
    that.updateHeadPositionOnTouch = function(e) {
      var sliderValue = that.sliderValueFromCursor(e);
      if (Math.round(that.previousSliderValue * 10000) === Math.round(sliderValue * 10000)) { return; }
      that.previousSliderValue = sliderValue;
      if (!that.didRequestUpdateOnNextFrame) {
        that.didRequestUpdateOnNextFrame = true;
        window.requestAnimationFrame(that.updateOnFrame);
      }
    };
    
    that.updateOnFrame = function() {
      that.changePosition(that.previousSliderValue);
      if (that.onSliderChange) { that.onSliderChange(that.previousSliderValue); }
      that.didRequestUpdateOnNextFrame = false;
    };
    
    that.init(sliderElementSelector);
    return that;
  }

  var debug = (function(){
    var debugOutput = document.querySelector(".ThreeBodyProblem-debugOutput");
    function print(text) {
      var date = new Date();
      debugOutput.innerHTML = text + " " + date.getMilliseconds();
    }
    return { print: print };
  })();

  var rungeKutta = (function() {
    function calculate(h, u, derivative) {
      var a = [h/2, h/2, h, 0];
      var b = [h/6, h/3, h/3, h/6];
      var u0 = [];
      var ut = [];
      var dimension = u.length;
      
      for (var i = 0; i < dimension; i++) {
        u0.push(u[i]);
        ut.push(0);
      }
      
      for (var j = 0; j < 4; j++) {
        var du = derivative();
        for (i = 0; i < dimension; i++) {
          u[i] = u0[i] + a[j]*du[i];
          ut[i] = ut[i] + b[j]*du[i];
        }
      }
      
      for (i = 0; i < dimension; i++) {
        u[i] = u0[i] + ut[i];
      }
    }
    return { calculate: calculate };
  })();

  window.SickSlider = SickSlider;
  window.debug = debug;
  window.rungeKutta = rungeKutta;

})();
