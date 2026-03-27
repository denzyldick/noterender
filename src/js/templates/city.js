import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";

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
let totalDepth = 0;
let currentScene;
let currentCamera;

const CONFIG = {
    rows: 100, 
    cols: 14,
    streetWidth: 90,
    blockSize: 16,
    gap: 16,
    speed: 4.5,
    skyColor: new BABYLON.Color4(0.01, 0.0, 0.02, 1),
};

const getPath = (z) => {
    const freq = (2 * Math.PI) / totalDepth;
    
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

    const yaw = Math.atan(dx);
    const pitch = Math.atan(dy);
    const bank = -dx * 0.45; 

    return { x, y, dx, dy, yaw, pitch, bank };
};

const template = {
    init(camera, renderer, nb, scene, width, height, d, config) {
        currentScene = scene;
        currentCamera = camera;
        globalZ = 0;
        totalDepth = CONFIG.rows * (CONFIG.blockSize + CONFIG.gap);

        scene.clearColor = CONFIG.skyColor;
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        scene.fogDensity = 0.004;
        scene.fogColor = new BABYLON.Color3(0.01, 0, 0.02);

        const primary = new BABYLON.Color3(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        const accent = new BABYLON.Color3(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        // --- Camera Setup ---
        camera.position = new BABYLON.Vector3(0, 30, -120);

        // --- Plane (Logo) ---
        PLANE.setScale(45, 45);
        PLANE.setCoordinates(0, 30, 60);
        PLANE.init(scene, config);

        // --- Terrain Grid ---
        glitchGrid = BABYLON.MeshBuilder.CreateGround("glitchGrid", { width: 10000, height: 10000, subdivisions: 60 }, scene);
        const gridMat = new BABYLON.StandardMaterial("gridMat", scene);
        gridMat.wireframe = true;
        gridMat.emissiveColor = primary.scale(0.2);
        gridMat.disableLighting = true;
        glitchGrid.material = gridMat;

        // --- Retro Sun ---
        sun = BABYLON.MeshBuilder.CreateDisc("sun", { radius: 300, tessellation: 64 }, scene);
        sunMat = new BABYLON.StandardMaterial("sunMat", scene);
        sunMat.emissiveColor = primary;
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
        roadMat.emissiveColor = primary.scale(0.12);
        roadMat.disableLighting = true;

        lineMat = new BABYLON.StandardMaterial("lineMat", scene);
        lineMat.emissiveColor = accent;
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
        buildingMat.emissiveColor = BABYLON.Color3.White();

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
                
                mesh.instancedBuffers.color = new BABYLON.Color4(primary.r, primary.g, primary.b, 1);
                
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
        t += 0.012;
        PLANE.render(fft);

        const boost = config.sensitivity ? config.sensitivity.bassBoost : 1.0;

        let bass = 0;
        for (let i = 0; i < 8; i++) bass += fft[i];
        bass = ((bass / 8) / 255) * boost;

        const primary = config.dynamicColors ? 
            new BABYLON.Color3(0.2, 0.3 + bass * 0.4, 0.9) : 
            new BABYLON.Color3(config.colors.r / 255, config.colors.g / 255, config.colors.b / 255);
        
        const accent = config.dynamicColors ? 
            new BABYLON.Color3(1.0, 0.2, 0.6 + bass * 0.4) : 
            new BABYLON.Color3(config.light.r / 255, config.light.g / 255, config.light.b / 255);

        globalZ += CONFIG.speed * (1 + bass * 1.5);
        if (globalZ > totalDepth) {
            globalZ -= totalDepth;
        }

        const camZ = globalZ - 120;
        const pCam = getPath(camZ);

        if (currentCamera) {
            currentCamera.position.set(pCam.x, pCam.y + 20 + bass * 8, camZ);
            
            const lookZ = camZ + 180;
            const pLook = getPath(lookZ);
            currentCamera.setTarget(new BABYLON.Vector3(pLook.x, pLook.y + 15, lookZ));
            
            const camBank = pCam.bank * 0.7;
            currentCamera.upVector = new BABYLON.Vector3(Math.sin(camBank), Math.cos(camBank), 0);
            currentCamera.fov = 0.85 + bass * 0.1;
        }

        const planeMesh = PLANE.getPlane();
        if (planeMesh) {
            const planeZ = camZ + 80;
            const pPlane = getPath(planeZ);
            
            planeMesh.position.set(pPlane.x, pPlane.y + 35, planeZ);
            
            planeMesh.rotation.y = pPlane.yaw;
            planeMesh.rotation.x = -pPlane.pitch;
            planeMesh.rotation.z += pPlane.bank; 
        }

        const updateMesh = (item, isBuilding) => {
            let relZ = item.baseZ - globalZ;
            while(relZ < -200) relZ += totalDepth;
            while(relZ > totalDepth - 200) relZ -= totalDepth;
            
            const evalZ = globalZ + relZ;
            const p = getPath(evalZ);

            if (!isBuilding) {
                item.mesh.position.set(p.x, p.y + (item.yOffset || 0), evalZ);
                item.mesh.rotation.set(-p.pitch, p.yaw, p.bank);
            } else {
                const lateral = item.offsetX;
                const cosY = Math.cos(p.yaw);
                const sinY = Math.sin(p.yaw);
                const yShift = lateral * Math.sin(p.bank);
                
                let val = (fft[item.fftIdx % fft.length] / 255) * boost;
                const currentHeight = item.heightMult * (0.4 + val * 1.6);
                
                item.mesh.scaling.set(item.widthMult, currentHeight, item.widthMult);
                
                item.mesh.position.set(
                    p.x + lateral * cosY,
                    p.y + yShift + currentHeight / 2,
                    evalZ - lateral * sinY
                );
                
                item.mesh.rotation.set(item.isTree ? -p.pitch : 0, p.yaw, p.bank * 0.6);
                
                const baseCol = item.isTree ? accent : primary;
                const intensity = item.isTree ? 0.6 + val : 0.3 + val * 0.7;
                const finalCol = baseCol.scale(intensity);
                item.mesh.instancedBuffers.color = new BABYLON.Color4(finalCol.r, finalCol.g, finalCol.b, 1);
            }
        };

        if (roadMat) {
            roadMat.emissiveColor.set(primary.r * 0.12, primary.g * 0.12, primary.b * 0.12);
        }
        
        roadSegments.forEach(rs => {
            rs.yOffset = 0;
            updateMesh(rs, false);
        });

        if (lineMat) {
            lineMat.emissiveColor.set(accent.r * (0.5+bass), accent.g * (0.5+bass), accent.b * (0.5+bass));
        }

        roadLines.forEach(line => {
            line.yOffset = 0.3;
            updateMesh(line, false);
        });

        buildings.forEach(b => updateMesh(b, true));

        lightStreaks.forEach(s => {
            s.baseZ += CONFIG.speed * s.speedMult;
            if (s.baseZ > totalDepth) s.baseZ -= totalDepth;
            
            let relZ = s.baseZ - globalZ;
            while(relZ < -200) relZ += totalDepth;
            while(relZ > totalDepth - 200) relZ -= totalDepth;
            
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
            sunMat.emissiveColor.set(primary.r * (0.7 + bass), primary.g * (0.5 + bass), primary.b * (0.7 + bass));
            
            sun.position.z = globalZ + 4000;
            sun.position.x = pCam.x * 0.2;
            sun.position.y = 500 + pCam.y;
        }

        if (glitchGrid) {
            glitchGrid.position.z = globalZ + 2000;
            glitchGrid.position.x = pCam.x;
            glitchGrid.position.y = pCam.y - 120;
        }
    }
};

export default template;
