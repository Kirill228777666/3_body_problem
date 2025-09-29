# Three-Body Problem Simulator

This project is a **web-based simulation of the classical three-body problem** in physics.  
It shows how three massive bodies interact through gravity and how their orbits evolve over time. Unlike the two-body problem, the three-body problem has no general analytic solution and often produces chaotic motion.

The simulator includes several predefined scenarios such as:
- **Figure Eight** – a periodic orbit where three equal masses move in a figure-eight path.  
- **Sun, Earth, and Jupiter** – a simplified solar system model.  
- **Lagrange Point L5** – a demonstration of orbital equilibrium.  
- **Kepler-16** – a real binary star system with a planet.  
- **Chaotic** – an example of unstable three-body dynamics.  

---

## 🚀 Features
- Interactive UI with adjustable parameters:
  - Mass of each body  
  - Simulation speed  
  - Gravitational softening (epsilon parameter)  
- Multiple preset scenarios  
- Pause/Resume functionality  
- Real-time visualization with orbital trails  

---

## 📂 Project Structure
- `index.html` – main entry point with UI and instructions  
- `style.css` – styling and animations  
- `graphics.js` – rendering bodies and orbital paths  
- `physics.js` – core physics and numerical integration  
- `simulation.js` – simulation loop and boundary handling  
- `ui.js` – sliders, buttons, and Runge-Kutta integration method  
- `script.js` – presets, user interaction, and input handling  

---

## 🖥️ How to Run
1. Clone or download this repository.  
2. Open **`index.html`** in any modern browser (Chrome, Firefox, Edge, Safari).  
3. Select one of the presets or adjust parameters using the control buttons and slider.  

⚠️ No installation is required. Just open the file locally, everything runs in the browser.  

---

## 📖 Controls
- **Mass 1 / 2 / 3 buttons** → change the mass of each body  
- **Speed button** → adjust simulation speed  
- **Softening button** → set gravitational softening to avoid singularities  
- **Reload button** → restart simulation with current parameters  
- **Pause button** → pause/resume the animation  

---

## 🧮 Math Behind
The simulation is based on classical mechanics:
- Newton’s law of universal gravitation — bodies attract each other with a force proportional to their masses and inversely proportional to the square of the distance between them.  
- A softening parameter is added to avoid infinite forces when bodies get too close.  
- Newton’s second law of motion connects force, mass, and acceleration.  
- The system of differential equations is solved numerically using the **Runge–Kutta 4th order method**, which provides good accuracy and performance.  

---

## 📜 License
This project is open-source and free to use for educational and personal purposes.
