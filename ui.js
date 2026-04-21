userInput.init();

document.addEventListener('DOMContentLoaded', function() {
  var loaderWrapper = document.getElementById('loader-wrapper');
  if(loaderWrapper){
    loaderWrapper.classList.add('hidden');
    setTimeout(function(){
      if(loaderWrapper.parentNode){
        loaderWrapper.parentNode.removeChild(loaderWrapper);
      }
    }, 500);
  }

  var container = document.querySelector('.ThreeBodyProblem-container');
  if (container) container.classList.add('visible');
  simulation.start();
});