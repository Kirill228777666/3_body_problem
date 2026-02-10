# Three-Body Problem Simulator

A web simulator of the classic three-body problem with interactive visualization.
The physics core is implemented in **C++ + WebAssembly (WASM)** for high-performance computation using the RK4 integrator.

## 🚀 Features
- **Presets:** Figure Eight, Sun–Earth–Jupiter, Lagrange Point L5, Kepler-16, Chaotic.
- **Controls:** Adjust body masses, simulation speed, and the softening parameter (ε) in real-time.
- **Tools:** Pause/resume, restart, save/load scenes.
- **Analysis:** Real-time charts of velocities and accelerations, plus a log of local approximation formulas.
- **Education:** Lab Works and interactive tasks with automatic verification

---

## 🏃 How to Run

**You cannot simply open `index.html` in your browser.**
Because this project uses WebAssembly (`.wasm`), browsers block loading the binary file from the local file system (`file://` protocol) due to security policies.

To run the simulator, you must use a local web server. Choose one of the methods below:

### Method 1: Visual Studio Code
1. Install the **Live Server** extension by Ritwick Dey.
2. Open the project folder in VS Code.
3. Right-click on `index.html` and select **"Open with Live Server"**.

### Method 2: Python
1. Open your terminal or command prompt.
2. Navigate to the project folder.
3. Run one of the following commands:
   ```bash
   # For Python 3
   python -m http.server
   # OR
   python3 -m http.server
   ```
4. Open `http://localhost:8000` in your browser.

### Method 3: Node.js
1. Open your terminal in the project folder.
2. Run `npx http-server`.
3. Open the link shown in the terminal (usually `http://127.0.0.1:8080`).

---

## 📂 Project Structure
All files are located in the root directory:

- `index.html` — Main entry point; HTML structure.
- `style.css` — Styles for UI and canvas.
- `graphics.js` — Canvas rendering and visual scaling.
- `physics.js` — Physics logic, state management, and the bridge between JS and WASM.
- `physics_wasm.js` — Emscripten glue code to load the WASM binary.
- `physics_wasm.wasm` — Compiled C++ binary (the physics engine).
- `simulation.js` — Main game loop (`requestAnimationFrame`), updates visualization and charts.
- `ui.js` — UI event handlers, sliders, presets, import/export logic.
- `script.js` — Helper utilities and a fallback JS integrator (used if WASM fails).
- `physics_wasm.cpp` — C++ source code for the RK4 integrator.

---

## 🔧 Advanced: Re-building WebAssembly
*Skip this section if you just want to run the simulator. Only needed if you modify `physics_wasm.cpp`.*

To recompile the C++ code into WASM, you need **Emscripten**.

### 1. Install Emscripten SDK
```bash
# macOS/Linux:
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# Windows PowerShell:
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
emsdk install latest
emsdk activate latest
emsdk_env.ps1
```

### 2. Compile
Run the following command in the project root:
```bash
emcc physics_wasm.cpp -o physics_wasm.js \
    -s WASM=1 \
    -s "EXPORTED_FUNCTIONS=['_integrate', '_malloc', '_free']" \
    -s "EXPORTED_RUNTIME_METHODS=['ccall', 'cwrap']" \
    -O3
```
This will generate updated `physics_wasm.js` and `physics_wasm.wasm` files.