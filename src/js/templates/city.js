import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import CAMERA_PHYSICS from "@/js/templates/components/camera";

let buildings = [];
let roadSegments = [];
let roadLines = [];
let lightStreaks = [];
let sun;
let sunMat;
let glitchGrid;

let roadMat;
let lineMat;
let buildingMat;

let t = 0;
let globalZ = 0; 
let totalDepth = 3200;
let currentScene;
let currentCamera;

// Pre-allocated objects
const _tempVec3 = new BABYLON.Vector3();
const _tempTarget = new BABYLON.Vector3();
const _primaryColor = new BABYLON.Color3();
const _accentColor = new BABYLON.Color3();

const CONFIG = {
    rows: 100, 
    cols: 14,
    streetWidth: 140, 
    blockSize: 16,
    gap: 16,
    speed: 6.0,
    skyColor: new BABYLON.Color4(0.01, 0.0, 0.02, 1),
};

const getPath = (z) => {
    const depth = totalDepth || 3200;
    const freq = (2 * Math.PI) / depth;
    
    const xAmp1 = 180, xAmp2 = 80, xAmp3 = 40;
    const x = Math.sin(z * freq) * xAmp1 + 
              Math.sin(z * freq * 2) * xAmp2 + 
              Math.cos(z * freq * 3) * xAmp3;
    
    const dx = freq * xAmp1 * Math.cos(z * freq) + 
               freq * 2 * xAmp2 * Math.cos(z * freq * 2) - 
               freq * 3 * xAmp3 * Math.sin(z * freq * 3);
               
    const yAmp1 = 60, yAmp2 = 20;
    const y = Math.cos(z * freq) * yAmp1 + 
              Math.sin(z * freq * 2.5) * yAmp2;
              
    const dy = -freq * yAmp1 * Math.sin(z * freq) + 
                freq * 2.5 * yAmp2 * Math.cos(z * freq * 2.5);

    const yaw = Math.atan(dx) || 0;
    const pitch = Math.atan(dy) || 0;
    const bank = -dx * 0.45 || 0; 

    return { x: x || 0, y: y || 0, dx: dx || 0, dy: dy || 0, yaw, pitch, bank };
};

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        currentScene = scene;
        currentCamera = camera;
        globalZ = 0;
        t = 0;
        
        // EXCLUSIVELY claim the camera to prevent orbit logic from crashing it
        CAMERA_PHYSICS.lock();

        totalDepth = CONFIG.rows * (CONFIG.blockSize + CONFIG.gap) || 3200;

        scene.clearColor = CONFIG.skyColor;
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        scene.fogDensity = 0.004;
        scene.fogColor = new BABYLON.Color3(0.01, 0, 0.02);

        _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        // --- Camera Setup ---
        if (camera) {
            if (camera.upVector) camera.upVector.set(0, 1, 0);
            
            // Get path position for Z=0 (Plane) and Z=-80 (Camera)
            const pPlaneStart = getPath(0);
            const pCamStart = getPath(-80);
            
            // HARD RESET
            camera.alpha = Math.PI / 2;
            camera.beta = Math.PI / 2;
            camera.radius = 80;
            camera.inertialAlphaOffset = 0;
            camera.inertialBetaOffset = 0;
            camera.inertialRadiusOffset = 0;
            camera.panningInertia = 0;
            
            // Set initial position and target - MUCH LOWER
            _tempTarget.set(pPlaneStart.x, pPlaneStart.y + 10, 0); 
            _tempVec3.set(pCamStart.x, pCamStart.y + 18, -80);
            
            camera.setTarget(_tempTarget);
            camera.setPosition(_tempVec3);
        }

        // --- Plane (Logo) ---
        PLANE.setScale(40, 40);
        PLANE.setCoordinates(0, 10, 0);
        PLANE.init(scene, config);

        // --- Terrain Grid ---
        glitchGrid = BABYLON.MeshBuilder.CreateGround("glitchGrid", { width: 10000, height: 10000, subdivisions: 60 }, scene);
        const gridMat = new BABYLON.StandardMaterial("gridMat", scene);
        gridMat.wireframe = true;
        gridMat.emissiveColor = _primaryColor.scale(0.2);
        gridMat.disableLighting = true;
        glitchGrid.material = gridMat;

        // --- Retro Sun ---
        sun = BABYLON.MeshBuilder.CreateDisc("sun", { radius: 300, tessellation: 64 }, scene);
        sunMat = new BABYLON.StandardMaterial("sunMat", scene);
        sunMat.emissiveColor.copyFrom(_primaryColor);
        sunMat.disableLighting = true;
        sun.material = sunMat;

        for(let i=0; i<6; i++) {
            const ring = BABYLON.MeshBuilder.CreateTorus("sunRing"+i, { diameter: 600 + i*25, thickness: 2.5, tessellation: 64 }, scene);
            ring.rotation.x = Math.PI / 2;
            ring.material = sunMat;
            ring.parent = sun;
        }

        // --- Road & Center Lines ---
        roadMat = new BABYLON.StandardMaterial("roadMat", scene);
        roadMat.emissiveColor = _primaryColor.scale(0.12);
        roadMat.disableLighting = true;

        lineMat = new BABYLON.StandardMaterial("lineMat", scene);
        lineMat.emissiveColor.copyFrom(_accentColor);
        lineMat.disableLighting = true;

        roadSegments = [];
        roadLines = [];
        const numRoadSegments = 160;
        const segDepth = totalDepth / numRoadSegments;
        
        const roadBase = BABYLON.MeshBuilder.CreateBox("roadBase", { width: CONFIG.streetWidth, height: 0.5, depth: segDepth + 1.5 }, scene);
        roadBase.isVisible = false;
        roadBase.material = roadMat;
        
        const lineBase = BABYLON.MeshBuilder.CreateBox("lineBase", { width: 1.5, height: 0.6, depth: segDepth * 0.5 }, scene);
        lineBase.isVisible = false;
        lineBase.material = lineMat;

        for (let i = 0; i < numRoadSegments; i++) {
            const rs = roadBase.createInstance("rs" + i);
            roadSegments.push({ mesh: rs, baseZ: i * segDepth });

            const line = lineBase.createInstance("line" + i);
            roadLines.push({ mesh: line, baseZ: i * segDepth });
        }

        // --- Buildings & Trees ---
        buildingMat = new BABYLON.StandardMaterial("bMat", scene);
        buildingMat.disableLighting = true;
        buildingMat.emissiveColor.set(1, 1, 1);

        const baseBox = BABYLON.MeshBuilder.CreateBox("baseBox", { size: 1 }, scene);
        baseBox.isVisible = false;
        baseBox.material = buildingMat;
        baseBox.registerInstancedBuffer("color", 4);

        const baseTree = BABYLON.MeshBuilder.CreateCylinder("baseTree", { height: 1, diameterTop: 0, diameterBottom: 1, tessellation: 4 }, scene);
        baseTree.isVisible = false;
        baseTree.material = buildingMat;
        baseTree.registerInstancedBuffer("color", 4);

        buildings = [];
        for (let row = 0; row < CONFIG.rows; row++) {
            const baseZ = row * (CONFIG.blockSize + CONFIG.gap);
            for (let col = 0; col < CONFIG.cols; col++) {
                const isLeft = col < CONFIG.cols / 2;
                const lateral = isLeft ? 
                    -(CONFIG.streetWidth/2 + 10) - (col) * 16 : 
                    (CONFIG.streetWidth/2 + 10) + (col - CONFIG.cols/2) * 16;
                
                const isTree = Math.random() > 0.7;
                const mesh = isTree ? baseTree.createInstance("t"+row+"_"+col) : baseBox.createInstance("b"+row+"_"+col);
                
                mesh.instancedBuffers.color = new BABYLON.Color4(_primaryColor.r, _primaryColor.g, _primaryColor.b, 1);
                
                buildings.push({
                    mesh,
                    baseZ,
                    offsetX: lateral + (Math.random()-0.5)*8,
                    isTree,
                    fftIdx: Math.floor(Math.random() * 64),
                    heightMult: isTree ? 15 + Math.random()*20 : 25 + Math.random()*50,
                    widthMult: isTree ? 6 + Math.random()*4 : CONFIG.blockSize + Math.random()*12
                });
            }
        }

        // --- High-Speed Light Streaks ---
        lightStreaks = [];
        const streakBase = BABYLON.MeshBuilder.CreateBox("streak", { width: 1.5, height: 0.4, depth: 80 }, scene);
        streakBase.isVisible = false;
        streakBase.material = lineMat;
        for (let i = 0; i < 20; i++) {
            const streak = streakBase.createInstance("streak" + i);
            const isLeft = Math.random() > 0.5;
            lightStreaks.push({
                mesh: streak,
                baseX: isLeft ? -15 : 15,
                baseZ: Math.random() * totalDepth,
                speedMult: 2 + Math.random() * 3
            });
        }

        if (!scene.glowLayer) {
            const glow = new BABYLON.GlowLayer("glow", scene);
            glow.intensity = 1.2;
        }
    },

    render(fft, config) {
        if (!fft) fft = new Uint8Array(256).fill(0);
        t += 0.012;
        PLANE.render(fft, config);

        const boost = config.sensitivity ? config.sensitivity.bassBoost : 1.0;

        let bass = 0;
        for (let i = 0; i < 8; i++) bass += fft[i];
        bass = ((bass / 8) / 255) * boost;
        if (isNaN(bass)) bass = 0;

        if (config.dynamicColors) {
            _primaryColor.set(0.2, 0.3 + bass * 0.4, 0.9);
            _accentColor.set(1.0, 0.2, 0.6 + bass * 0.4);
        } else {
            _primaryColor.set(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
            _accentColor.set(config.light.r / 255, config.light.g / 255, config.light.b / 255);
        }

        globalZ += CONFIG.speed * (1 + bass * 1.5);
        if (globalZ > totalDepth) {
            globalZ %= totalDepth;
        }
        if (isNaN(globalZ)) globalZ = 0;

        const camZ = globalZ - 80;
        const pCam = getPath(camZ);

        if (currentCamera && !currentCamera.isDisposed) {
            // Constant distance: Plane is exactly 80 units ahead of camera
            const planeZ = camZ + 80; 
            const pPlane = getPath(planeZ);
            
            // 1. Calculate base camera position - STREETVIEW HEIGHT (approx 15 units above road)
            _tempVec3.set(pCam.x, pCam.y + 15, camZ);
            
            // 2. Target the plane exactly to keep it centered on screen
            _tempTarget.set(pPlane.x, pPlane.y + 10, planeZ);

            try {
                // Force target and position every frame to prevent camera from getting "stuck"
                currentCamera.setTarget(_tempTarget);
                currentCamera.setPosition(_tempVec3);
                
                // Stable FOV and UpVector based on road banking
                currentCamera.fov = 1.1; // Wider FOV for more speed sensation
                const camBank = pCam.bank * 0.8;
                if (currentCamera.upVector) {
                    currentCamera.upVector.set(Math.sin(camBank), Math.cos(camBank), 0);
                }
                
                // Reset inertias every frame to prevent any control drift
                currentCamera.inertialAlphaOffset = 0;
                currentCamera.inertialBetaOffset = 0;
                currentCamera.inertialRadiusOffset = 0;
            } catch (e) {
                console.warn("City camera update failed", e);
            }
        }

        const planeMesh = PLANE.getPlane();
        if (planeMesh) {
            const planeZ = camZ + 80; 
            const pPlane = getPath(planeZ);
            
            planeMesh.position.set(pPlane.x, pPlane.y + 10, planeZ);
            
            planeMesh.rotation.y = pPlane.yaw;
            planeMesh.rotation.x = -pPlane.pitch;
            planeMesh.rotation.z = pPlane.bank; 
        }

        const updateMesh = (item, isBuilding) => {
            let relZ = item.baseZ - globalZ;
            // Loop items around the camera (at -80). 
            // We want items to exist from roughly -100 to totalDepth-100
            relZ = ((relZ + 100) % totalDepth + totalDepth) % totalDepth - 100;
            
            const evalZ = globalZ + relZ;
            const p = getPath(evalZ);

            if (!isBuilding) {
                item.mesh.position.set(p.x, p.y + (item.yOffset || 0), evalZ);
                item.mesh.rotation.set(-p.pitch, p.yaw, p.bank);
            } else {
                const lateral = item.offsetX;
                // Buildings should be sitting on the road level
                const cosY = Math.cos(p.yaw);
                const sinY = Math.sin(p.yaw);
                const yShift = lateral * Math.sin(p.bank);
                
                let val = (fft[item.fftIdx % fft.length] / 255) * boost;
                if (isNaN(val)) val = 0;
                const currentHeight = item.heightMult * (0.4 + val * 1.6);
                
                item.mesh.scaling.set(item.widthMult, currentHeight, item.widthMult);
                
                item.mesh.position.set(
                    p.x + lateral * cosY,
                    p.y + yShift + currentHeight / 2,
                    evalZ - lateral * sinY
                );
                
                item.mesh.rotation.set(item.isTree ? -p.pitch : 0, p.yaw, p.bank * 0.6);
                
                const baseCol = item.isTree ? _accentColor : _primaryColor;
                const intensity = item.isTree ? 0.6 + val : 0.3 + val * 0.7;
                
                if (item.mesh.instancedBuffers && item.mesh.instancedBuffers.color) {
                    item.mesh.instancedBuffers.color.set(baseCol.r * intensity, baseCol.g * intensity, baseCol.b * intensity, 1);
                }
            }
        };

        if (roadMat) {
            roadMat.emissiveColor.set(_primaryColor.r * 0.12, _primaryColor.g * 0.12, _primaryColor.b * 0.12);
        }
        
        roadSegments.forEach(rs => {
            rs.yOffset = 0;
            updateMesh(rs, false);
        });

        if (lineMat) {
            lineMat.emissiveColor.set(_accentColor.r * (0.5+bass), _accentColor.g * (0.5+bass), _accentColor.b * (0.5+bass));
        }

        roadLines.forEach(line => {
            line.yOffset = 0.3;
            updateMesh(line, false);
        });

        buildings.forEach(b => updateMesh(b, true));

        lightStreaks.forEach(s => {
            s.baseZ += CONFIG.speed * s.speedMult;
            if (s.baseZ > totalDepth) s.baseZ %= totalDepth;
            
            let relZ = s.baseZ - globalZ;
            relZ = ((relZ + 200) % totalDepth + totalDepth) % totalDepth - 200;
            
            const evalZ = globalZ + relZ;
            const p = getPath(evalZ);
            
            const cosY = Math.cos(p.yaw);
            const sinY = Math.sin(p.yaw);
            
            s.mesh.position.set(
                p.x + s.baseX * cosY,
                p.y + 1.5,
                evalZ - s.baseX * sinY
            );
            s.mesh.rotation.set(-p.pitch, p.yaw, p.bank);
        });

        if (sunMat) {
            sun.scaling.setAll(1.0 + bass * 0.1);
            sunMat.emissiveColor.set(_primaryColor.r * (0.7 + bass), _primaryColor.g * (0.5 + bass), _primaryColor.b * (0.7 + bass));
            
            sun.position.z = globalZ + 4000;
            sun.position.x = pCam.x * 0.2;
            sun.position.y = 500 + pCam.y;
        }

        if (glitchGrid) {
            glitchGrid.position.z = globalZ + 2000;
            glitchGrid.position.x = pCam.x;
            glitchGrid.position.y = pCam.y - 120;
        }
    },

    dispose() {
        currentCamera = null;
        currentScene = null;
        buildings = [];
        roadSegments = [];
        roadLines = [];
        lightStreaks = [];
    }
};

export default template;
