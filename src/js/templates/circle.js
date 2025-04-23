import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

let camera;
let circles = [];
let time = 0;

const template = {
  render(fft, config) {
    console.log("Circle template render function called");

    const fftLength = fft.length;
    const baseRadius = 50; // Base radius of the circles
    const maxRadius = 200; // Maximum radius of the circles
    const waveSpeed = 0.05; // Speed of the wave motion

    for (let i = 0; i < fftLength; i++) {
      const circle = circles[i];
      const fftValue = fft[i] || 0; // Get FFT value or default to 0
      const normalizedRadius = baseRadius + (fftValue / 255) * maxRadius; // Scale radius based on FFT value

      // Apply wave-like motion
      const waveOffset = Math.sin(time + i * waveSpeed) * 10; // Wave offset for smooth motion
      circle.scaling.x = normalizedRadius + waveOffset; // Adjust circle size
      circle.scaling.y = normalizedRadius + waveOffset;

      // Dynamically change the color of the circles
      circle.material.diffuseColor = new BABYLON.Color3(
        fftValue / 255, // Red component
        1 - fftValue / 255, // Green component
        Math.random() // Random blue component for variety
      );
    }

    time += 0.02; // Increment time for smooth animation
    PLANE.render(fft); // Render the plane
  },

  init(c, r, nb, scene, width, height, depth, config) {
    camera = c;

    // Create lights
    const light = new BABYLON.HemisphericLight(
      "light1",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    light.intensity = 1.0; // Increase intensity for better visibility

    // Initialize the central plane
    PLANE.setCoordinates(0, 0, 0); // Center the plane in the viewport
    PLANE.init(scene, config);

    // Create circles
    const fftLength = 64; // Number of circles (matches FFT length)
    for (let i = 0; i < fftLength; i++) {
      const circle = BABYLON.MeshBuilder.CreateDisc(
        `circle${i}`,
        { radius: 1, tessellation: 32 }, // Initial dimensions of the circle
        scene
      );
      const material = new BABYLON.StandardMaterial(`circleMat${i}`, scene);
      material.diffuseColor = new BABYLON.Color3(
        Math.random(), // Random red component
        Math.random(), // Random green component
        Math.random()  // Random blue component
      );
      material.alpha = 1.0; // Set initial opacity to fully opaque
      circle.material = material;

      // Position circles in a grid
      circle.position.x = (i % 8) * 50 - 200; // Grid layout
      circle.position.y = 0; // Align circles on the plane
      circle.position.z = Math.floor(i / 8) * 50 - 200;

      circles.push(circle);
    }

    console.log("Circle template initialized with 64 circles and a plane.");
  }
};

export default template;
