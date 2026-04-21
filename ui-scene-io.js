var uiSceneIO = (function(){
  function create(context) {
    function buildCustomPreset(data) {
      var isArenstorf = data.presetMode === 'arenstorf';
      var derivedArenstorfState = data.arenstorfState;
      if (isArenstorf && !derivedArenstorfState && data.positions && data.velocities && data.positions[2] && data.velocities[2]) {
        derivedArenstorfState = {
          x: data.positions[2].r * Math.cos(data.positions[2].theta),
          y: data.positions[2].r * Math.sin(data.positions[2].theta),
          vx: data.velocities[2].r * Math.cos(data.velocities[2].theta),
          vy: data.velocities[2].r * Math.sin(data.velocities[2].theta)
        };
      }

      return {
        name: "Custom",
        dimensionless: data.dimensionless,
        presetMode: data.presetMode || null,
        mu: (typeof data.mu === 'number') ? data.mu : 0.012277471,
        masses: data.masses,
        positions: data.positions,
        velocities: data.velocities,
        arenstorfState: derivedArenstorfState || null,
        integrator: data.integrator || ((typeof physics.getIntegrator === 'function') ? physics.getIntegrator() : 'rk4'),
        timeScaleFactor: data.timeScaleFactor,
        softeningParameterSquared: data.softeningParameterSquared,
        largestDistanceOverride: data.largestDistanceOverride,
        massSlider: isArenstorf ? { min: 0.001, max: 1, power: 2 } : (data.dimensionless ? { min: 0.1, max: 10, power: 3 } : { min: 3e10, max: 3e31, power: 5 }),
        timeScaleFactorSlider: isArenstorf ? { min: 0.01, max: 3, power: 1 } : (data.dimensionless ? { min: 0.00, max: 20, power: 1 } : { min: 0, max: 3600*24*365*1000, power: 5 }),
        densities: null,
        paleOrbitalPaths: false,
        lockedMasses: data.lockedMasses || (isArenstorf ? [true, true, true] : null),
        lockedControls: data.lockedControls || (isArenstorf ? { speed: false, softening: true } : null)
      };
    }

    function downloadScene() {
      var currentModel = context.getCurrentModel();
      var sceneData = {
        name: "Custom Scene",
        dimensionless: physics.initialConditions.dimensionless,
        presetMode: physics.initialConditions.presetMode || null,
        mu: physics.initialConditions.mu,
        masses: physics.initialConditions.masses,
        positions: physics.initialConditions.positions,
        velocities: physics.initialConditions.velocities,
        arenstorfState: physics.initialConditions.arenstorfState,
        integrator: (typeof physics.getIntegrator === 'function') ? physics.getIntegrator() : (physics.initialConditions.integrator || 'rk4'),
        wallsEnabled: (window.simulation && typeof simulation.isWallsEnabled === 'function') ? simulation.isWallsEnabled() : true,
        trailLimitEnabled: (window.graphics && typeof graphics.isTrailLimitEnabled === 'function') ? graphics.isTrailLimitEnabled() : false,
        timeScaleFactor: physics.initialConditions.timeScaleFactor,
        softeningParameterSquared: physics.initialConditions.softeningParameterSquared,
        largestDistanceOverride: physics.initialConditions.largestDistanceOverride,
        lockedMasses: currentModel && currentModel.lockedMasses ? currentModel.lockedMasses : null,
        lockedControls: currentModel && currentModel.lockedControls ? currentModel.lockedControls : null
      };

      var jsonString = JSON.stringify(sceneData, null, 2);
      var blob = new Blob([jsonString], { type: "application/json" });
      var url = URL.createObjectURL(blob);

      var a = document.createElement('a');
      a.href = url;
      a.download = 'three-body-scene.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return false;
    }

    function uploadScene() {
      if (context.sceneUploader) context.sceneUploader.click();
      return false;
    }

    function handleFileUpload(event) {
      var file = event.target.files[0];
      if (!file) return;

      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        context.showErrorModal("Ошибка формата", "Пожалуйста, выберите корректный JSON файл.");
        return;
      }

      var reader = new FileReader();
      reader.onload = function(e) {
        try {
          var data = JSON.parse(e.target.result);
          var customPreset = buildCustomPreset(data);
          context.didChangeModel(customPreset);
          if (context.wallsToggle) {
            context.wallsToggle.checked = (typeof data.wallsEnabled === 'boolean') ? data.wallsEnabled : true;
            context.syncWallsToggle();
          }
          if (context.trailLimitToggle) {
            context.trailLimitToggle.checked = !!data.trailLimitEnabled;
            context.syncTrailLimitToggle();
          }
          context.forcePause();
        } catch (error) {
          context.showErrorModal("Ошибка данных", "Ошибка при обработке файла: " + error.message);
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    }

    return {
      downloadScene: downloadScene,
      uploadScene: uploadScene,
      handleFileUpload: handleFileUpload
    };
  }

  return { create: create };
})();
