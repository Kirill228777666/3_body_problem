var uiModals = (function(){
  function create(context) {
    var infoButton = context.infoButton;
    var infoModal = context.infoModal;
    var errorModal = context.errorModal;
    var trainerBtn = context.trainerBtn;
    var labSelectionModal = context.labSelectionModal;
    var labModal = context.labModal;
    var labTitle = context.labTitle;
    var labDesc = context.labDesc;
    var labSteps = context.labSteps;
    var startLabBtn = context.startLabBtn;

    function showErrorModal(title, message) {
      if (!errorModal) { alert(title + ": " + message); return; }
      var titleEl = errorModal.querySelector('.error-title');
      var msgEl = errorModal.querySelector('.error-message');
      if (titleEl) titleEl.textContent = title;
      if (msgEl) msgEl.textContent = message;
      cssHelper.removeClass(errorModal, 'is-hidden');
    }

    function showBriefing(activity){
      if (!activity) return;
      context.forcePause();

      if (startLabBtn) startLabBtn.textContent = "Перейти к настройке";
      if (labTitle) labTitle.textContent = activity.title || "Активность";
      if (labDesc) labDesc.textContent = activity.description || "";
      if (labSteps) {
        labSteps.innerHTML = '';
        (activity.steps || []).forEach(function(step){
          var li = document.createElement('li');
          li.textContent = step;
          labSteps.appendChild(li);
        });
      }
      if (labModal) cssHelper.removeClass(labModal, 'is-hidden');
    }

    function bindStaticModals(){
      if (infoButton && infoModal) {
        var closeInfoModalButton = infoModal.querySelector('.modal-close-button');

        infoButton.addEventListener('click', function(e) {
          e.preventDefault();
          cssHelper.removeClass(infoModal, 'is-hidden');
        });

        if (closeInfoModalButton) {
          closeInfoModalButton.addEventListener('click', function() {
            cssHelper.addClass(infoModal, 'is-hidden');
          });
        }

        infoModal.addEventListener('click', function(e) {
          if (e.target === infoModal) cssHelper.addClass(infoModal, 'is-hidden');
        });
      }

      if (errorModal) {
        var okButton = errorModal.querySelector('.error-ok-button');
        var closeFunc = function(){ cssHelper.addClass(errorModal, 'is-hidden'); };
        if (okButton) okButton.onclick = closeFunc;
        errorModal.addEventListener('click', function(e){ if (e.target === errorModal) closeFunc(); });
      }

      if (trainerBtn && labSelectionModal) {
        var closeSelBtn = labSelectionModal.querySelector('.modal-close-button');

        trainerBtn.addEventListener('click', function(){
          context.forcePause();
          cssHelper.removeClass(labSelectionModal, 'is-hidden');
        });

        if (closeSelBtn) closeSelBtn.addEventListener('click', function(){ cssHelper.addClass(labSelectionModal, 'is-hidden'); });

        labSelectionModal.addEventListener('click', function(e) {
          if (e.target === labSelectionModal) cssHelper.addClass(labSelectionModal, 'is-hidden');
        });
      }

      if (startLabBtn) {
        startLabBtn.onclick = function(){
          if (labModal) cssHelper.addClass(labModal, 'is-hidden');
          context.forcePause();
          return false;
        };
      }

      if (labModal) {
        var closeLabModalBtn = labModal.querySelector('.modal-close-button');
        if (closeLabModalBtn) closeLabModalBtn.addEventListener('click', function(){ cssHelper.addClass(labModal, 'is-hidden'); });
        labModal.addEventListener('click', function(e){ if (e.target === labModal) cssHelper.addClass(labModal, 'is-hidden'); });
      }

      window.addEventListener('keydown', function(e){
        if (e.key !== 'Escape') return;

        if (infoModal && !cssHelper.hasClass(infoModal, 'is-hidden')) cssHelper.addClass(infoModal, 'is-hidden');
        if (errorModal && !cssHelper.hasClass(errorModal, 'is-hidden')) cssHelper.addClass(errorModal, 'is-hidden');
        if (labModal && !cssHelper.hasClass(labModal, 'is-hidden')) cssHelper.addClass(labModal, 'is-hidden');
        if (labSelectionModal && !cssHelper.hasClass(labSelectionModal, 'is-hidden')) cssHelper.addClass(labSelectionModal, 'is-hidden');

        var resultModal = document.getElementById('activity-result-modal');
        if (resultModal && !cssHelper.hasClass(resultModal, 'is-hidden')) cssHelper.addClass(resultModal, 'is-hidden');
      });
    }

    function bindTrainerSelection(startLab, startTask){
      var selectLabBtns = document.querySelectorAll('.select-lab-btn');
      for (var i=0; i<selectLabBtns.length; i++) {
        selectLabBtns[i].addEventListener('click', function(){
          var labId = this.getAttribute('data-lab-id');
          cssHelper.addClass(labSelectionModal, 'is-hidden');
          startLab(labId);
        });
      }

      var selectTaskBtns = document.querySelectorAll('.select-task-btn');
      for (var t=0; t<selectTaskBtns.length; t++) {
        selectTaskBtns[t].addEventListener('click', function(){
          var taskId = this.getAttribute('data-task-id');
          cssHelper.addClass(labSelectionModal, 'is-hidden');
          startTask(taskId);
        });
      }
    }

    return {
      showErrorModal: showErrorModal,
      showBriefing: showBriefing,
      bindStaticModals: bindStaticModals,
      bindTrainerSelection: bindTrainerSelection
    };
  }

  return { create: create };
})();
