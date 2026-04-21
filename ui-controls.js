var userInput = (function(){
  var sliderLabelElement = document.querySelector(".ThreeBodyProblem-sliderLabel");
  var restartButton = document.querySelector(".ThreeBodyProblem-reload");
  var mass1Button = document.querySelector(".ThreeBodyProblem-mass1Button");
  var mass2Button = document.querySelector(".ThreeBodyProblem-mass2Button");
  var mass3Button = document.querySelector(".ThreeBodyProblem-mass3Button");
  var speedButton = document.querySelector(".ThreeBodyProblem-speedButton");
  var softeningButton = document.querySelector(".ThreeBodyProblem-softeningButton");
  var integratorSelect = document.getElementById('integrator-select');
  var wallsToggle = document.getElementById('walls-toggle');
  var trailLimitToggle = document.getElementById('trail-limit-toggle');
  var sliderElement = document.querySelector(".ThreeBodyProblem-slider");
  var sceneContainer = document.querySelector(".ThreeBodyProblem-container");

  var downloadSceneButton = document.getElementById('download-scene-button');
  var uploadSceneButton = document.getElementById('upload-scene-button');
  var sceneUploader = document.getElementById('scene-uploader');
  var downloadLogButton = document.getElementById('download-log-button');

  var labSelectionModal = document.getElementById('lab-selection-modal');
  var labModal = document.getElementById('lab-modal');
  var labTitle = document.getElementById('lab-title');
  var labDesc = document.getElementById('lab-description');
  var labSteps = document.getElementById('lab-steps');
  var startLabBtn = document.getElementById('start-lab-button');
  var trainerBtn = document.getElementById('labs-menu-button');

  var infoButton = document.getElementById('info-button');
  var infoModal = document.getElementById('info-modal');
  var errorModal = document.getElementById('error-modal');

  var currentModel;
  var currentTrainerActivity = null;
  var sliderController, modalController, sceneIO;

  function forcePause() {
    try { simulation.pause(); } catch(e) {}
    var pauseButton = document.querySelector('.ThreeBodyProblem-pause');
    if (pauseButton) pauseButton.textContent = 'Продолжить';
  }

  function populateIntegratorOptions() {
    if (!integratorSelect || !window.physics || typeof physics.getAvailableIntegrators !== 'function') return;

    var list = physics.getAvailableIntegrators();
    integratorSelect.innerHTML = '';

    list.forEach(function(item) {
      var option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.label;
      integratorSelect.appendChild(option);
    });
  }

  function updateIntegratorControl() {
    if (!integratorSelect || !window.physics) return;

    var isArenstorf = physics.initialConditions.presetMode === 'arenstorf';
    var currentId = (typeof physics.getIntegrator === 'function') ? physics.getIntegrator() : 'rk4';
    var description = (typeof physics.getIntegratorDescription === 'function')
      ? physics.getIntegratorDescription(currentId)
      : '';

    integratorSelect.value = currentId;
    integratorSelect.disabled = !!isArenstorf;
    integratorSelect.title = isArenstorf
      ? 'Для орбиты Аренсторфа используется отдельный специализированный RK4-интегратор.'
      : description;
  }

  function syncWallsToggle() {
    if (!wallsToggle || !window.simulation || typeof simulation.setWallsEnabled !== 'function') return;
    simulation.setWallsEnabled(!!wallsToggle.checked);
  }

  function syncTrailLimitToggle() {
    if (!trailLimitToggle || !window.graphics || typeof graphics.setTrailLimitEnabled !== 'function') return;
    graphics.setTrailLimitEnabled(!!trailLimitToggle.checked);
  }

  function didChangeWallsToggle() {
    syncWallsToggle();
    if (window.chartManager && typeof window.chartManager.resetEnergyReference === 'function') {
      window.chartManager.resetEnergyReference();
    }
    return false;
  }

  function didChangeTrailLimitToggle() {
    syncTrailLimitToggle();
    return false;
  }

  function didChangeIntegrator() {
    if (!integratorSelect || !window.physics) return false;

    physics.setIntegrator(integratorSelect.value);
    updateIntegratorControl();
    didClickRestart();
    return false;
  }

  function didClickRestart(){
    logManager.clear();

    physics.resetStateToInitialConditions();
    if (window.simulation && typeof simulation.redrawCurrentState === 'function') {
      simulation.redrawCurrentState();
    } else {
      if (graphics.resetTrails) graphics.resetTrails();
      graphics.clearScene(physics.largestDistanceMeters());
      graphics.updateObjectSizes(physics.calculateDiameters());
      graphics.calculateNewPositions(physics.state.u);
      graphics.drawBodies();
    }

    if (window.chartManager && typeof window.chartManager.reset === 'function') window.chartManager.reset();
    if (window.simulation && typeof simulation.resetEnergyReference === 'function') simulation.resetEnergyReference();

    if (currentTrainerActivity) {
      modalController.showBriefing(currentTrainerActivity);
    }

    if (window.labEngine && typeof labEngine.onRestart === 'function') {
      try { labEngine.onRestart(); } catch(e) {}
    }

    return false;
  }

  function didChangeModel(model){
    currentTrainerActivity = null;

    if (window.labEngine && typeof labEngine.stop === 'function') {
      try { labEngine.stop(); } catch(e) {}
    }

    currentModel = model;
    physics.changeInitialConditions(currentModel);

    graphics.calculateNewPositions(physics.state.u);
    graphics.drawBodies();

    sliderController.updateMassButtonsAppearance(model.dimensionless === true);
    sliderController.updateLockedButtons(model.lockedMasses, model.lockedControls);
    updateIntegratorControl();
    sliderController.switchToFirstUnlockedMass();

    didClickRestart();
    sliderController.resetSlider();
  }

  function markTrainerButtonSelected() {
    var presetEls = document.querySelectorAll(".ThreeBodyProblem-preset");
    for (var i=0; i<presetEls.length; i++) cssHelper.removeClass(presetEls[i],'ThreeBodyProblem-button--isSelected');
    if (trainerBtn) cssHelper.addClass(trainerBtn, 'ThreeBodyProblem-button--isSelected');
  }

  function startLab(labId) {
    forcePause();
    var labData = simulations.getLab(labId);
    if (!labData) return;

    var physicsConfig = labData.physics || labData;
    if (!physicsConfig.name) physicsConfig.name = "Lab";
    physicsConfig.currentPresetName = physicsConfig.name;

    didChangeModel(physicsConfig);
    forcePause();

    currentTrainerActivity = {
      kind: "lab",
      id: labId,
      title: labData.title,
      description: labData.description,
      steps: labData.steps
    };

    markTrainerButtonSelected();
    modalController.showBriefing(currentTrainerActivity);
  }

  function startTask(taskId) {
    forcePause();
    var taskData = simulations.getTask(taskId);
    if (!taskData) {
      modalController.showErrorModal("Задание не найдено", "taskId=" + taskId);
      return;
    }

    var physicsConfig = taskData.physics || taskData;
    if (!physicsConfig.name) physicsConfig.name = "Task";
    physicsConfig.currentPresetName = physicsConfig.name;

    didChangeModel(physicsConfig);
    forcePause();

    if (window.labEngine && typeof labEngine.startTask === "function") {
      labEngine.startTask({
        id: taskData.id,
        title: taskData.title,
        goal: taskData.goal,
        fail: taskData.fail
      });
    }

    currentTrainerActivity = {
      kind: "task",
      id: taskId,
      title: taskData.title,
      description: taskData.description,
      steps: taskData.steps
    };

    markTrainerButtonSelected();
    modalController.showBriefing(currentTrainerActivity);
  }

  function bindPauseButton() {
    var pauseButton = document.querySelector('.ThreeBodyProblem-pause');
    if (!pauseButton) return;

    pauseButton.onclick = function(){
      if (simulation.isPaused()){ simulation.resume(); pauseButton.textContent='Пауза'; }
      else { simulation.pause(); pauseButton.textContent='Продолжить'; }
      return false;
    };
  }

  function createContext() {
    return {
      sliderLabelElement: sliderLabelElement,
      sliderElement: sliderElement,
      sceneContainer: sceneContainer,
      mass1Button: mass1Button,
      mass2Button: mass2Button,
      mass3Button: mass3Button,
      speedButton: speedButton,
      softeningButton: softeningButton,
      wallsToggle: wallsToggle,
      trailLimitToggle: trailLimitToggle,
      sceneUploader: sceneUploader,
      infoButton: infoButton,
      infoModal: infoModal,
      errorModal: errorModal,
      trainerBtn: trainerBtn,
      labSelectionModal: labSelectionModal,
      labModal: labModal,
      labTitle: labTitle,
      labDesc: labDesc,
      labSteps: labSteps,
      startLabBtn: startLabBtn,
      forcePause: forcePause,
      syncWallsToggle: syncWallsToggle,
      syncTrailLimitToggle: syncTrailLimitToggle,
      didChangeModel: didChangeModel,
      showErrorModal: function(title, message){ modalController.showErrorModal(title, message); },
      getCurrentModel: function(){ return currentModel; }
    };
  }

  function init(){
    sliderController = uiSliderControls.create(createContext());
    modalController = uiModals.create(createContext());
    sceneIO = uiSceneIO.create(createContext());

    currentModel = simulations.init();
    physics.changeInitialConditions(currentModel);
    simulations.content.didChangeModel = didChangeModel;

    var slider = SickSlider(".ThreeBodyProblem-slider");
    slider.onSliderChange = sliderController.didUpdateSlider;
    sliderController.setSliderInstance(slider);

    populateIntegratorOptions();
    updateIntegratorControl();
    if (integratorSelect) integratorSelect.onchange = didChangeIntegrator;
    if (wallsToggle) {
      wallsToggle.checked = !(window.simulation && typeof simulation.isWallsEnabled === 'function') || simulation.isWallsEnabled();
      wallsToggle.onchange = didChangeWallsToggle;
      syncWallsToggle();
    }
    if (trailLimitToggle) {
      trailLimitToggle.checked = !!(window.graphics && typeof graphics.isTrailLimitEnabled === 'function' && graphics.isTrailLimitEnabled());
      trailLimitToggle.onchange = didChangeTrailLimitToggle;
      syncTrailLimitToggle();
    }

    sliderController.resetSlider();
    sliderController.attachSliderEditEvents();

    if (restartButton) restartButton.onclick = didClickRestart;
    if (mass1Button) mass1Button.onclick = sliderController.didClickMass1;
    if (mass2Button) mass2Button.onclick = sliderController.didClickMass2;
    if (mass3Button) mass3Button.onclick = sliderController.didClickMass3;
    if (speedButton) speedButton.onclick = sliderController.didClickSpeed;
    if (softeningButton) softeningButton.onclick = sliderController.didClickSoftening;

    if (downloadSceneButton) downloadSceneButton.onclick = sceneIO.downloadScene;
    if (uploadSceneButton) uploadSceneButton.onclick = sceneIO.uploadScene;
    if (sceneUploader) sceneUploader.onchange = sceneIO.handleFileUpload;
    if (downloadLogButton) downloadLogButton.onclick = function(){ logManager.download(); return false; };

    bindPauseButton();
    sliderController.updateMassButtonsAppearance(currentModel.dimensionless === true);
    modalController.bindStaticModals();
    modalController.bindTrainerSelection(startLab, startTask);
  }

  return { init:init, bodyNameFromIndex: function(i){ return sliderController.bodyNameFromIndex(i); } };
})();
