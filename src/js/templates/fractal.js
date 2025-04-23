import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

let camera;
let fractalBoxes = [];
let time = 0;
let frameCounter = 0; // Counter to throttle updates
let environmentLight; // Declare environment light
let spotlights = []; // Array to hold spotlights
let strings = []; // Array to hold the strings

const template = {
  render(fft, config) {
    console.log("Render function called"); // Debug log to verify render execution

    // Define rows and iterationsPerRow
    const rows = 30; // Increase the number of rows
    const squaresPerRow = 50; // Increase the number of squares per row
    const baseRadius = 500; // Base radius for circular motion
    const rowSpacing = 100; // Distance between rows along the Z-axis
    const planeSize = config.planeSize || 200; // Use a configurable plane size or default to 200
    const minDistanceFromPlane = planeSize + 50; // Ensure squares are always at least 50 units away from the plane
    const rotationSpeed = 0.01; // Speed of rotation for the rows

    // Normalize the FFT to a single value
    const fftSum = fft.reduce((sum, value) => sum + value, 0); // Sum of all FFT values
    const fftNormalized = Math.max(fftSum / (fft.length * 255), 0.1); // Normalize and ensure a minimum value

    const dynamicSpeed = fftNormalized * 20; // Define dynamicSpeed based on FFT

    for (let row = 0; row < rows; row++) {
      const rowOffset = (row - rows / 2) * rowSpacing + Math.sin(time + row * 0.2) * fftNormalized * 50; 
      // Add wave-like motion based on FFT and time
      const rowRotationSpeed = rotationSpeed * (1 + row * 0.05); // Each row rotates at a slightly different speed
      const rowTimeOffset = time + row * 0.1; // Unique time offset for each row

      // Calculate a unique scaling factor for the row
      const rowScaleFactor = 1 + Math.sin(rowTimeOffset + row * 0.2) * 0.5; // Dynamic scaling per row

      for (let i = 0; i < squaresPerRow; i++) {
        const index = row * squaresPerRow + i;

        // Calculate dynamic radius and angle for each square
        const dynamicRadius = Math.max(
          baseRadius * (1 + fftNormalized * 0.5 + row * 0.1), // Add row-based spacing to avoid overlap
          minDistanceFromPlane
        );
        const angle = (i / squaresPerRow) * Math.PI * 2 + rowTimeOffset * rowRotationSpeed; // Independent rotation for each row

        // Calculate position for each square
        const posX = Math.cos(angle) * dynamicRadius;
        const posY = Math.sin(angle) * dynamicRadius * 0.5; // Reduce vertical movement
        const posZ = rowOffset; // Position rows along the Z-axis

        // Dynamically change the color and size based on FFT value
        fractalBoxes[index].material.diffuseColor = new BABYLON.Color3(
          fftNormalized, // Red component
          1 - fftNormalized, // Green component
          Math.random() // Random blue component for variety
        );

        // Transform the square into a rectangle to create a bar effect
        const barHeight = 1 + fftNormalized * 5; // Height scales with FFT, making rectangles shorter
        const barWidth = 1 + fftNormalized * 0.5; // Width remains smaller for bar effect
        fractalBoxes[index].scaling.set(barWidth, barHeight, barWidth); // Apply scaling

        // Update the position of the square
        fractalBoxes[index].position.set(posX, posY, posZ);
      }
    }

    // Update camera position based on FFT
    const fftCameraOffset = fftNormalized * 50; // Scale camera movement with FFT
    camera.position.x = Math.sin(time) * 100 + fftCameraOffset; // Add horizontal movement
    camera.position.y = Math.cos(time) * 50 + fftCameraOffset * 0.5; // Add vertical movement
    camera.position.z = -1000; // Ensure the plane is in the viewport
    camera.setTarget(new BABYLON.Vector3(0, 0, 0)); // Always look at the center

    time += 0.002; // Increment time for smooth, slow motion
    PLANE.render(fft);

    // Update strings (space snakes) and synchronize with the plane
    strings.forEach((string, index) => {
      const { tube, path } = string;
      const dynamicRadius = baseRadius * (1 + fftNormalized * 0.5 + Math.sin(time + index) * 0.1); // Expand based on FFT and time
      const dynamicSpeed = fftNormalized * 20; // Increase movement speed based on FFT
      const dynamicColorFactor = Math.abs(Math.sin(time + index)); // Dynamic color factor

      for (let i = 0; i < path.length; i++) {
        const angle = (time * dynamicSpeed + i * 0.2 + index) % (Math.PI * 2); // Faster circular motion around the plane
        const radius = dynamicRadius * 0.8; // Keep within the bounds of the rows
        path[i].x = Math.cos(angle) * radius; // Circular X position
        path[i].y = Math.sin(angle) * radius * 0.5; // Circular Y position (flattened vertically)
        path[i].z = Math.sin(time * dynamicSpeed + i * 0.1 + index) * rowSpacing; // Oscillate along Z-axis within rows
      }

      // Update the tube with the new path
      BABYLON.MeshBuilder.CreateTube(
        null,
        { path, instance: tube },
        null
      );

      // Change the color dynamically
      tube.material.diffuseColor = new BABYLON.Color3(
        dynamicColorFactor, // Red component
        1 - dynamicColorFactor, // Green component
        Math.random() * 0.5 + 0.5 // Random blue component
      );
    });

    // Synchronize the plane's position with the strings
    const planeOffset = Math.sin(time * dynamicSpeed) * 50; // Dynamic offset for the plane
    PLANE.setCoordinates(0, planeOffset, 0); // Move the plane vertically to touch the lines
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

    // Add dynamic environment light
    environmentLight = new BABYLON.PointLight("environmentLight", new BABYLON.Vector3(0, 500, 0), scene);
    environmentLight.intensity = 1.0; // Initial intensity
    environmentLight.diffuse = new BABYLON.Color3(1, 1, 1); // Initial white light

    // Add four spotlights
    const spotlightPositions = [
      new BABYLON.Vector3(-200, 300, 200),
      new BABYLON.Vector3(200, 300, 200),
      new BABYLON.Vector3(-200, 300, -200),
      new BABYLON.Vector3(200, 300, -200)
    ];
    spotlightPositions.forEach((position, index) => {
      const spotlight = new BABYLON.SpotLight(
        `spotlight${index}`,
        position,
        new BABYLON.Vector3(0, -1, 0), // Pointing downward
        Math.PI / 3, // Angle of the spotlight
        2, // Exponent for light decay
        scene
      );
      spotlight.diffuse = new BABYLON.Color3(1, 1, 1); // Initial white light
      spotlight.specular = new BABYLON.Color3(1, 1, 1); // Specular highlight
      spotlight.intensity = 1.0; // Initial intensity
      spotlights.push(spotlight);
    });

    // Initialize the central plane
    PLANE.setCoordinates(0, 0, 0); // Center the plane in the viewport
    PLANE.init(scene, config);

    // Pre-create more squares for 30 rows of circles
    const rows = 30; // Total number of rows
    const squaresPerRow = 50; // Number of squares per row
    const totalSquares = rows * squaresPerRow; // Total squares
    for (let i = 0; i < totalSquares; i++) {
      const box = BABYLON.MeshBuilder.CreateBox(
        `box${i}`,
        { size: 10 }, // Size of the box
        scene
      );
      const material = new BABYLON.StandardMaterial(`mat${i}`, scene);
      material.diffuseColor = new BABYLON.Color3(
        Math.random(), // Random red component
        Math.random(), // Random green component
        Math.random()  // Random blue component
      );
      material.alpha = 1.0; // Set initial opacity to fully opaque
      box.material = material;
      fractalBoxes.push(box);
    }

    // Add dynamic smoke effect using a particle system
    const particleSystem = new BABYLON.ParticleSystem("smoke", 2000, scene);
    particleSystem.emitter = new BABYLON.Vector3(0, 0, -100); // Emit particles from behind the plane
    particleSystem.minEmitBox = new BABYLON.Vector3(-500, -500, 0); // Minimum emission area
    particleSystem.maxEmitBox = new BABYLON.Vector3(500, 500, 0); // Maximum emission area

    // Particle properties
    particleSystem.color1 = new BABYLON.Color4(0.8, 0.8, 0.8, 0.5); // Light gray smoke
    particleSystem.color2 = new BABYLON.Color4(0.5, 0.5, 0.5, 0.3); // Darker gray smoke
    particleSystem.minSize = 10;
    particleSystem.maxSize = 30;
    particleSystem.minLifeTime = 2;
    particleSystem.maxLifeTime = 4;
    particleSystem.emitRate = 500;

    // Particle movement
    particleSystem.direction1 = new BABYLON.Vector3(-1, 1, 0);
    particleSystem.direction2 = new BABYLON.Vector3(1, 1, 0);
    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 3;
    particleSystem.updateSpeed = 0.01;

    // Procedural smoke effect using random colors and sizes
    particleSystem.updateFunction = function (particles) {
      for (let particle of particles) {
        particle.color.r = Math.random() * 0.5 + 0.5; // Random light gray
        particle.color.g = Math.random() * 0.5 + 0.5;
        particle.color.b = Math.random() * 0.5 + 0.5;
        particle.size = Math.random() * 20 + 10; // Random size between 10 and 30
      }
    };

    // Start the particle system
    particleSystem.start();

    // Create strings (space snakes)
    const stringCount = 10; // Number of strings
    for (let i = 0; i < stringCount; i++) {
      const path = []; // Path for the string
      for (let j = 0; j < 20; j++) {
        path.push(new BABYLON.Vector3(j * 10, 0, 0)); // Initial straight path
      }
      const tube = BABYLON.MeshBuilder.CreateTube(
        `string${i}`,
        { path, radius: 2, updatable: true },
        scene
      );
      const material = new BABYLON.StandardMaterial(`stringMat${i}`, scene);
      material.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random()); // Random color
      tube.material = material;
      strings.push({ tube, path });
    }

    console.log("Fractal template initialized"); // Debug log to verify initialization

    console.log("Initialized with 800 rectangles in circular motion around the plane, ensuring minimum distance, dynamic procedural smoke effect, environment light, and spotlights.");
  }
};

export default template;