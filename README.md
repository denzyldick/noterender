# Noterender

Real-time, audio-reactive 3D music visualizer ([Babylon.js](https://www.babylonjs.com/)) with Studio and Live modes, plus built-in TikTok Live streaming.

- **Web app:** [https://denzyldick.github.io/noterender/](https://denzyldick.github.io/noterender/) (GitHub Pages)
- **Backend API:** `https://api.noterender.denzyl.io` (Oracle Always-Free VPS, Symfony + FrankenPHP)
- **Main site:** [https://noterender.denzyl.io](https://noterender.denzyl.io)

![example](https://github.com/denzyldick/noterender/blob/main/example.gif)

---

## Architecture

```
┌──────────────────────┐    /api/*     ┌───────────────────────────────┐
│ Browser (Vue app)    │─────────────►│ api.noterender.denzyl.io      │
│ Babylon.js visuals   │              │  Symfony + FrankenPHP + SQLite │
│                      │              │  (Oracle Always-Free VPS)     │
│  TikTok Live mode:   │   WS chunks  │                               │
│  MediaRecorder ──────┼─────────────►│ rtmp-relay (Node)             │
│  (canvas + audio)    │              │  -> ffmpeg -> RTMP ───────────► TikTok Live
└──────────────────────┘              └───────────────────────────────┘
```

- Frontend is a **static build** deployed to GitHub Pages (hash routing, `/#/`).
- The API and the RTMP relay run in Docker on the VPS / your machine.
- The RTMP relay can't be replaced by a pure browser call (browsers can't push RTMP), so it lives next to the app and pipes WebSocket chunks into `ffmpeg`.

## Project setup

```
yarn install --ignore-engines
```

### Compiles and hot-reloads for development

```
yarn serve
```

### Compiles and minifies for production

```
yarn build
```

## Deploy the frontend to GitHub Pages

The production build uses `publicPath: /noterender/` and hash routing, so it can live under a sub-path on a static host.

**Locally (one-off):**

```
yarn build && yarn gh-pages -d dist
```

**Automatically:** push to `main` — `.github/workflows/pages.yml` builds and publishes `dist` to the `gh-pages` branch. In the repo settings enable GitHub Pages → Source: **Deploy from a branch → `gh-pages`**.

> The app calls the API at `VUE_APP_API_URL` (`src/store/index.ts`). In production this points at the backend — GH Pages only hosts the static UI. After payment/checkout, Stripe redirects back to the requesting origin automatically.

## TikTok Live streaming

1. Open the app, go to **Live mode → TikTok Live**, and switch on "Stream to TikTok Live".
2. In the TikTok app: profile → **LIVE → tools → Stream Key**. Paste the **Server URL** and **Stream Key** into the app (they persist locally).
3. Start the relay once (the machine that streams — usually your laptop or the VPS):

   ```
   cd rtmp-relay && yarn install && yarn start
   # optional: RELAY_HOST=0.0.0.0 RELAY_PORT=8090 yarn start
   ```

   It listens on `ws://localhost:8090` and needs `ffmpeg` on `PATH`.
4. Click **START LIVE SESSION**. The browser captures the canvas + audio as MPEG-TS chunks, streams them to the relay, and `ffmpeg` pushes them to TikTok via RTMP. A red **LIVE** badge appears in the header while streaming.
5. Watch your stream in the TikTok LIVE dashboard. Stop everything with the play/stop button in the HUD.

> **Mixed content note:** GH Pages is HTTPS, so the frontend at `denzyldick.github.io` cannot reach `ws://localhost` (an insecure WebSocket is blocked from a secure page). For streaming, run the app locally (`yarn serve` → `http://localhost:8080`), which talks to the relay fine. The published GH Pages copy is for others to browse/preview. When you later stream from the VPS, run the relay there (`RELAY_HOST=0.0.0.0`) and set the relay URL in the app to `wss://…`.

## Backend (Symfony API) on the VPS

The production API is the Symfony app in `api/` (FrankenPHP, SQLite), not the `api-server.php` dev fallback.

1. Provision an Oracle Cloud **Always-Free "Ampere A1"** instance (Ubuntu 22.04, ARM). Open ports **80, 443, 22** in the security list.
2. Install Docker + compose plugin, clone the repo.
3. Create `api/env.local.file` (gitignored) with secrets. **Never** put secrets in `api/.env` (it is tracked by git):

   ```dotenv
   STRIPE_SECRET_KEY=sk_test_...
   CORS_ALLOW_ORIGIN='^https?://(localhost|127\.0\.0\.1|noterender\.denzyl\.io|api\.noterender\.denzyl\.io|denzyldick\.github\.io)(:[0-9]+)?$'
   ```

4. Copy your existing database to `api/data/data.db` so accounts/projects/shoutouts survive.
5. Point DNS `api` → the VPS IP, then:

   ```
   cd api && docker compose up -d --build
   ```

   FrankenPHP auto-provisions the Let's Encrypt certificate for `api.noterender.denzyl.io` (exposes `:80` + `:443`).
6. Test: `curl https://api.noterender.denzyl.io/api/waitlist -X POST -H 'Content-Type: application/json' -d '{"email":"a@b.c"}'`

### Stripe

- Test keys: `sk_test_…` in `api/env.local.file` → restart the API. `CheckoutController` reads `STRIPE_SECRET_KEY`.
- The frontend can fall back to the lightweight JSON-storage dev server (`api-server.php`) via the root `docker-compose.yml` — that one has **no Stripe/auth** and is only for local prototyping.

---

## How to create a template

The 3D rendering works with [babylonjs](https://www.babylonjs.com/). If you do not know how to work with
babylonjs I will recommend you to read their documentation. In the code below you can see a working example of the
immersive template.

The are 2 important methods/functions you should implement. The `init` and the `render` function.
The `init` function will be called 1 time when the template is loaded into the dom.
The `render` function is where you should add your animation logic.

```js
import * as BABYLON from "babylonjs";
import PLANE from "./components/plane";
import LIGHTS from "./components/lights";

const bar = [];
let particleSystem;
let t = 0;
let camera = null;
let plane;
const template = {
  render(fft, config) {
    if (camera === null) {
      return;
    }
    PLANE.render(fft);
    const fftElement1 = fft[fft.length - Math.ceil(fft.length / 10)];

    if (config.options.camera.move === false) {
      t += 0.02;
      const number = fftElement1 * 0.00005;
      console.log(number, "number");
      camera.radius = this.initialRadius - fftElement1;
      camera.alpha = this.initialAlpha + number;
      camera.beta = this.initialBeta + number;
    }
    const colors = config.colors;
    const fftElement = null;

    for (let i = 0; i < this.bar.length; i++) {
      const barElement = this.bar[i];
      if (barElement.vertical === true) {
        barElement.scaling.y = fft[i] * 0.9;
      } else {
        barElement.scaling.x = fft[i] * 0.9;
      }

      if (fftElement1 <= 255 && fftElement1 > 0) {
        const r = Math.ceil(fftElement1 + config.colors.r);
        const g = Math.ceil(fftElement1 + config.colors.g);
        const b = Math.ceil(fftElement1 + config.colors.b);
        barElement.material.diffuseColor = BABYLON.Color3.FromInts(r, g, b);
        barElement.material.specularColor = BABYLON.Color3.FromInts(r, g, b);
      } else {
        barElement.material.ambientColor = BABYLON.Color3.FromInts(
          config.colors.r,
          config.colors.g,
          config.colors.b
        );
      }
    }
    for (let i = 0; i < this.lights.length; i++) {
      const light = this.lights[i];
      if (fftElement1 <= 255 && fftElement1 > 0) {
        const r = Math.ceil(fftElement1 + config.light.r);
        const g = Math.ceil(fftElement1 + config.light.g);
        const b = Math.ceil(fftElement1 + config.light.b);
        console.log(fftElement1, r, g, b);
        light.difuse = BABYLON.Color3.FromInts(r, g, b);
        light.specular = BABYLON.Color3.FromInts(r, g, b);
      }
    }
  },
  init(c, r, nb, scene, width, height, d, config) {
    this.initialRadius = c.radius;
    this.initialAlpha = c.alpha;
    this.initialBeta = c.beta;
    camera = c;
    this.bar = [];
    this.lights = [];
    const light = new BABYLON.DirectionalLight(
      "light1",
      new BABYLON.Vector3(0, 250, -10),
      scene
    );
    light.position = new BABYLON.Vector3(0, 250, 10);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.1;
    this.lights.push(light);
    this.lights.push(
      new BABYLON.PointLight(
        "HemiLight",
        new BABYLON.Vector3(0, 0, 100),
        scene
      ),
      new BABYLON.PointLight("HemiLight", new BABYLON.Vector3(0, 0, 10), scene)
    );

    PLANE.setCoordinates(0, 250, 0);
    PLANE.init(scene, config);

    camera.lockedTarget = PLANE.getPlane();
    height = 500;
    const boxInstance = BABYLON.MeshBuilder.CreateBox("box", {}, scene);
    const materialBox = new BABYLON.StandardMaterial("texture1", scene);
    materialBox.ambientColor = BABYLON.Color3.FromInts(
      config.colors.r,
      config.colors.g,
      config.colors.b
    );
    boxInstance.material = materialBox;
    const amountbars = 10;
    const depth = 100;
    /// Right
    for (let i = 0; i < amountbars; i++) {
      // Add and manipulate meshes in the scene
      const box = boxInstance.createInstance("box" + 1);

      box.position = new BABYLON.Vector3(+width / 2 + 20, 50 * i, depth / 2);
      box.scaling = new BABYLON.Vector3(10, 10, depth);
      this.bar.push(box);
    }

    //LEFT
    for (let i = 0; i < amountbars; i++) {
      // Add and manipulate meshes in the scene
      const box = boxInstance.createInstance("box" + 1);

      box.position = new BABYLON.Vector3(-width / 2 - 20, 50 * i, depth / 2);
      box.scaling = new BABYLON.Vector3(10, 10, depth);
      this.bar.push(box);
    }
    ///  TOP
    for (let i = 0; i < amountbars; i++) {
      // Add and manipulate meshes in the scene
      const box = boxInstance.createInstance("box" + 1);

      box.position = new BABYLON.Vector3(
        -width / 2 + 50 * i,
        height + 20,
        depth / 2
      );
      box.scaling = new BABYLON.Vector3(10, 10, depth);
      box.vertical = true;
      this.bar.push(box);
    }
    /// BOTTOM
    for (let i = 0; i < amountbars; i++) {
      // Add and manipulate meshes in the scene
      const box = boxInstance.createInstance("box" + 1);

      box.position = new BABYLON.Vector3(-width / 2 + 50 * i, -20, depth / 2);
      box.scaling = new BABYLON.Vector3(10, 10, depth);
      box.vertical = true;
      this.bar.push(box);
    }
  },
};
export default template;
```
