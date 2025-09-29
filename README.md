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
  - Gravitational softening (ε parameter)  
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

## 📖 Controls
- **Mass 1 / 2 / 3 buttons** → change the mass of each body  
- **Speed button** → adjust simulation speed  
- **Softening button** → set gravitational softening to avoid singularities  
- **Reload button** → restart simulation with current parameters  
- **Pause button** → pause/resume the animation  

---

## 🧮 Physics Background
- Newton’s law of gravitation:  
  \[
  F = G \dfrac{m_1 m_2}{r^2}
  \]
- Modified with softening parameter ε to avoid infinite forces:  
  \[
  F = G \dfrac{m_1 m_2}{(r^2 + \varepsilon^2)^{3/2}}
  \]
- Second law of motion:  
  \[
  F = m a
  \]
- Numerical integration: **Runge–Kutta 4th order method**  

---

## 🖥️ How to Run
1. Clone or download this repository.  
2. Open **`index.html`** in any modern browser (Chrome, Firefox, Edge, Safari).  
3. Select one of the presets or adjust parameters using the control buttons and slider.  

⚠️ No installation is required. Just open the file locally, everything runs in the browser. 
