# Interactive 3D Particle System

A real-time interactive 3D particle system controlled by hand gestures, built with **React**, **Three.js**, and **MediaPipe**.

## Features

- **Hand Tracking**: Control particles with your webcam.
  - **Scale**: Open/close your hand to expand/contract the system.
  - **Implode**: Close your fist to collapse the particles.
  - **Rotate**: Move your hand left/right to rotate the object.
- **Templates**:
  - ❤️ Hearts
  - 🌸 Flowers
  - 🪐 Saturn
  - 🧘 Buddha
  - ✨ Fireworks
  - 🏎️ F1 Car (with road effect)
  - 🦖 Dinosaur
  - 🚀 Starship
  - ⚙️ Ferrari Engine
  - 🌌 Milky Way Galaxy
- **Customization**: Change colors and templates via the glassmorphism UI.

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Interact**
   - Allow camera access when prompted.
   - Show your hand to the camera.
   - Use the control panel to switch templates and colors.

## Tech Stack

- [React](https://reactjs.org/)
- [Three.js](https://threejs.org/) / [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [MediaPipe Hands](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)
- [Vite](https://vitejs.dev/)
