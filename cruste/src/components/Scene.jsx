import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FL, STOPS } from "../data/flavors.js";

export default function Scene({
  flavor,
  deliveryId,
  skipDeliveryId,
  onDeliveryStageChange,
  onDeliveryComplete,
}) {
  const canvasRef = useRef(null);
  const toppingsApiRef = useRef(null);
  const callbacksRef = useRef({});
  const [error, setError] = useState("");
  callbacksRef.current = { onDeliveryStageChange, onDeliveryComplete };

  useEffect(() => {
    const canvas = canvasRef.current;
    let renderer;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
      });
    } catch (initializationError) {
      setError(
        `WebGL renderer could not be initialized: ${initializationError.message}`,
      );
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.z = 8;
    scene.add(new THREE.AmbientLight(0xffe2c4, 0.55));

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(3, 5, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xff7a1a, 2.4, 22);
    pointLight.position.set(-3, -1, 4);
    scene.add(pointLight);

    const material = (color, roughness = 0.65) =>
      new THREE.MeshStandardMaterial({ color, roughness });
    const pizza = new THREE.Group();
    scene.add(pizza);
    const addToPizza = (geometry, meshMaterial, y) => {
      const mesh = new THREE.Mesh(geometry, meshMaterial);
      mesh.position.y = y;
      pizza.add(mesh);
      return mesh;
    };

    renderer.shadowMap.enabled = false;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    directionalLight.castShadow = false;
    directionalLight.shadow.mapSize.set(1024, 1024);
    directionalLight.shadow.bias = -0.0006;
    Object.assign(directionalLight.shadow.camera, {
      left: -5,
      right: 5,
      top: 5,
      bottom: -5,
      near: 1,
      far: 20,
    });

    let randomSeed = 5;
    const random = () => {
      randomSeed = Math.sin(randomSeed) * 10000;
      return randomSeed - Math.floor(randomSeed);
    };
    const createTextureCanvas = () => {
      const textureCanvas = document.createElement("canvas");
      textureCanvas.width = textureCanvas.height = 1024;
      return textureCanvas;
    };

    const colorCanvas = createTextureCanvas();
    const bumpCanvas = createTextureCanvas();
    const colorContext = colorCanvas.getContext("2d");
    const bumpContext = bumpCanvas.getContext("2d");
    if (!colorContext || !bumpContext) {
      renderer.dispose();
      setError("The browser could not create the pizza texture canvases.");
      return undefined;
    }

    colorContext.fillStyle = "#9c2410";
    colorContext.fillRect(0, 0, 1024, 1024);
    bumpContext.fillStyle = "#1c1c1c";
    bumpContext.fillRect(0, 0, 1024, 1024);
    const addRadialBlend = (context, x, y, radius, color) => {
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color.replace(/[\d.]+\)$/, "0)"));
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, radius, 0, 7);
      context.fill();
    };
    const bakeMark = (radius, color, highlight) => {
      const angle = random() * 6.283;
      const distance = Math.sqrt(random()) * 470;
      const x = 512 + Math.cos(angle) * distance;
      const y = 512 + Math.sin(angle) * distance;
      addRadialBlend(colorContext, x, y, radius, color);
      if (highlight) addRadialBlend(bumpContext, x, y, radius, highlight);
    };

    for (let i = 0; i < 50; i += 1) bakeMark(60, "rgba(110,18,6,.5)");
    for (let i = 0; i < 115; i += 1) {
      bakeMark(
        40 + random() * 55,
        random() > 0.5 ? "rgba(232,158,56,.9)" : "rgba(212,128,38,.9)",
        "rgba(255,255,255,.55)",
      );
    }
    for (let i = 0; i < 60; i += 1) {
      bakeMark(18 + random() * 34, "rgba(244,200,116,.5)", "rgba(255,255,255,.4)");
    }
    for (let i = 0; i < 55; i += 1) bakeMark(8 + random() * 16, "rgba(138,62,16,.6)");
    for (let i = 0; i < 80; i += 1) bakeMark(7 + random() * 14, "rgba(255,105,28,.5)");
    colorContext.strokeStyle = "rgba(160,34,12,.85)";
    colorContext.lineWidth = 46;
    colorContext.beginPath();
    colorContext.arc(512, 512, 505, 0, 7);
    colorContext.stroke();

    const colorTexture = new THREE.CanvasTexture(colorCanvas);
    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    colorTexture.anisotropy = 8;
    const cheeseGeometry = new THREE.CircleGeometry(1.42, 96);
    cheeseGeometry.rotateX(-Math.PI / 2);
    const cheese = new THREE.Mesh(
      cheeseGeometry,
      new THREE.MeshStandardMaterial({
        map: colorTexture,
        bumpScale: 0,
        roughness: 0.45,
        metalness: 0.05,
      }),
    );
    cheese.position.y = 0.19;
    cheese.receiveShadow = true;
    pizza.add(cheese);
    addToPizza(new THREE.CylinderGeometry(1.5, 1.55, 0.2, 64), material(0xd4a05a, 0.8), 0.05);

    const crustGeometry = new THREE.TorusGeometry(1.55, 0.23, 28, 110);
    const crustPositions = crustGeometry.attributes.position;
    const crustColors = new Float32Array(crustPositions.count * 3);
    for (let i = 0; i < crustPositions.count; i += 1) {
      const x = crustPositions.getX(i);
      const y = crustPositions.getY(i);
      const z = crustPositions.getZ(i);
      const angle = Math.atan2(y, x);
      const noise =
        Math.sin(angle * 7) * 0.014 +
        Math.sin(angle * 19 + 1) * 0.01 +
        Math.sin(angle * 43) * 0.004;
      const scale = 1 + noise;
      crustPositions.setXYZ(i, x * scale, y * scale, z * (1 + noise * 2.2));
      const blend = Math.max(0, Math.min(1, z / 0.23));
      const color = new THREE.Color(0xc98a3e).lerp(
        new THREE.Color(0x8e4c18),
        blend * 0.95,
      );
      const char = Math.sin(angle * 37) * Math.sin(angle * 13 + z * 18) +
        Math.sin(angle * 71 + 3) * 0.4;
      if (char > 0.7 && z > 0) {
        color.lerp(new THREE.Color(0x45200b), Math.min(1, (char - 0.7) * 3));
      }
      color.toArray(crustColors, i * 3);
    }
    crustGeometry.setAttribute("color", new THREE.BufferAttribute(crustColors, 3));
    crustGeometry.computeVertexNormals();
    const crust = addToPizza(
      crustGeometry,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }),
      0.12,
    );
    crust.rotation.x = Math.PI / 2;
    crust.castShadow = true;
    crust.receiveShadow = true;

    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.bezierCurveTo(0.15, 0.07, 0.17, 0.24, 0, 0.4);
    leafShape.bezierCurveTo(-0.17, 0.24, -0.15, 0.07, 0, 0);
    const leafGeometry = new THREE.ShapeGeometry(leafShape, 14);
    leafGeometry.translate(0, -0.2, 0);
    const leafPositions = leafGeometry.attributes.position;
    for (let i = 0; i < leafPositions.count; i += 1) {
      leafPositions.setZ(
        i,
        Math.abs(leafPositions.getX(i)) * 0.7 +
          (leafPositions.getY(i) + 0.2) * 0.15,
      );
    }
    leafGeometry.rotateX(-Math.PI / 2);
    leafGeometry.scale(1.25, 1.25, 1.25);
    leafGeometry.computeVertexNormals();
    const pepperoniGeometry = new THREE.LatheGeometry(
      [
        [0, 0],
        [0.1, 0.003],
        [0.18, 0.015],
        [0.24, 0.05],
        [0.255, 0.08],
        [0.225, 0.075],
        [0.17, 0.04],
        [0.1, 0.026],
        [0, 0.022],
      ].map(([radius, height]) => new THREE.Vector2(radius, height)),
      28,
    );
    const toppings = new THREE.Group();
    pizza.add(toppings);
    const toppingGeometry = {
      pep: pepperoniGeometry,
      leaf: leafGeometry,
      sph: new THREE.SphereGeometry(0.2, 12, 8),
      mush: new THREE.CylinderGeometry(0.22, 0.12, 0.09, 16),
      tom: new THREE.CylinderGeometry(0.2, 0.2, 0.04, 20),
      ring: new THREE.TorusGeometry(0.08, 0.035, 8, 16),
      chili: new THREE.TorusGeometry(0.07, 0.026, 8, 16),
    };
    const toppingMaterial = {
      pep: material(0x9a2016, 0.4),
      basil: new THREE.MeshStandardMaterial({
        color: 0x2c7a30,
        roughness: 0.55,
        side: THREE.DoubleSide,
      }),
      moz: material(0xe9e2d2, 0.45),
      mush: material(0xe2cda6),
      tom: material(0xe8452c, 0.4),
      olive: material(0x1c1a1a, 0.4),
      chili: material(0xff2d2d, 0.4),
    };
    let toppingStart = 0;
    let flavorKick = 0;

    const buildToppings = (flavorIndex, accentColor) => {
      while (toppings.children.length) {
        toppings.remove(toppings.children[0]);
      }
      let seed = 7 + flavorIndex * 13;
      const toppingRandom = () => {
        seed = Math.sin(seed) * 10000;
        return seed - Math.floor(seed);
      };
      FL[flavorIndex].t.forEach(([kind, count]) => {
        for (let i = 0; i < count; i += 1) {
          const angle = toppingRandom() * 6.283;
          const distance = Math.sqrt(toppingRandom()) * 1.15;
          let topping;
          if (kind === "basil") {
            topping = new THREE.Mesh(toppingGeometry.leaf, toppingMaterial.basil);
            topping.userData.scale = [1, 1, 1];
          } else if (kind === "moz") {
            topping = new THREE.Mesh(toppingGeometry.sph, toppingMaterial.moz);
            topping.userData.scale = [1.3, 0.35, 1.3];
          } else if (kind === "olive") {
            topping = new THREE.Mesh(toppingGeometry.ring, toppingMaterial.olive);
            topping.rotation.x = Math.PI / 2;
            topping.userData.scale = [1, 1, 1];
          } else if (kind === "chili") {
            topping = new THREE.Mesh(toppingGeometry.chili, toppingMaterial.chili);
            topping.rotation.x = Math.PI / 2;
            topping.userData.scale = [1, 1, 1];
          } else {
            topping = new THREE.Mesh(toppingGeometry[kind], toppingMaterial[kind]);
            topping.userData.scale = [1, 1, 1];
          }
          topping.position.set(Math.cos(angle) * distance, 0.2, Math.sin(angle) * distance);
          if (kind === "basil") topping.rotation.y = toppingRandom() * 6;
          topping.userData.delay = toppingRandom() * 0.6;
          topping.castShadow = true;
          topping.receiveShadow = true;
          topping.scale.set(0, 0, 0);
          toppings.add(topping);
        }
      });
      toppingStart = performance.now() / 1000;
      flavorKick = 0.35;
      pointLight.color.set(accentColor);
    };

    toppingsApiRef.current = buildToppings;
    buildToppings(0, FL[0].c);

    const oven = new THREE.Group();
    oven.visible = false;
    scene.add(oven);
    const ovenBodyMaterial = material(0x342016, 0.78);
    const ovenTrimMaterial = material(0x9b5430, 0.7);
    const ovenBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 1.22, 0.82),
      ovenBodyMaterial,
    );
    ovenBody.position.y = -0.12;
    oven.add(ovenBody);
    const ovenTop = new THREE.Mesh(
      new THREE.BoxGeometry(1.78, 0.12, 0.9),
      ovenTrimMaterial,
    );
    ovenTop.position.y = 0.52;
    oven.add(ovenTop);
    const ovenChimney = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.52, 0.32),
      ovenBodyMaterial,
    );
    ovenChimney.position.set(-0.49, 0.82, -0.1);
    oven.add(ovenChimney);
    const ovenMouth = new THREE.Mesh(
      new THREE.CircleGeometry(0.43, 36),
      new THREE.MeshBasicMaterial({ color: 0x170b07 }),
    );
    ovenMouth.position.set(0, 0.01, 0.418);
    oven.add(ovenMouth);
    const ovenFireMaterial = new THREE.MeshBasicMaterial({
      color: 0xff5418,
      transparent: true,
      opacity: 0.75,
    });
    const ovenFire = new THREE.Mesh(
      new THREE.CircleGeometry(0.31, 32),
      ovenFireMaterial,
    );
    ovenFire.position.set(0, -0.03, 0.425);
    oven.add(ovenFire);
    const ovenDoor = new THREE.Mesh(
      new THREE.TorusGeometry(0.46, 0.075, 12, 40),
      ovenTrimMaterial,
    );
    ovenDoor.position.set(0, 0.01, 0.45);
    oven.add(ovenDoor);
    const ovenLight = new THREE.PointLight(0xff5b20, 0, 3.5);
    ovenLight.position.set(0, -0.02, 0.8);
    oven.add(ovenLight);

    const scooter = new THREE.Group();
    scooter.visible = false;
    scene.add(scooter);
    const rubberMaterial = material(0x171414, 0.82);
    const scooterBodyMaterial = material(0xe9e0d4, 0.44);
    const scooterOrangeMaterial = material(0xff7a1a, 0.48);
    const wheelGeometry = new THREE.TorusGeometry(0.23, 0.065, 12, 28);
    [-0.62, 0.61].forEach((x) => {
      const wheel = new THREE.Mesh(wheelGeometry, rubberMaterial);
      wheel.position.set(x, -0.12, 0.04);
      scooter.add(wheel);
      const hub = new THREE.Mesh(
        new THREE.CircleGeometry(0.105, 20),
        scooterBodyMaterial,
      );
      hub.position.set(x, -0.12, 0.11);
      scooter.add(hub);
    });
    const addScooterPart = (geometry, partMaterial, x, y, z = 0) => {
      const part = new THREE.Mesh(geometry, partMaterial);
      part.position.set(x, y, z);
      scooter.add(part);
      return part;
    };
    addScooterPart(new THREE.BoxGeometry(0.95, 0.12, 0.28), scooterOrangeMaterial, 0, 0.02);
    addScooterPart(new THREE.BoxGeometry(0.27, 0.48, 0.24), scooterBodyMaterial, 0.31, 0.25);
    addScooterPart(new THREE.BoxGeometry(0.38, 0.12, 0.3), rubberMaterial, 0.02, 0.38);
    addScooterPart(new THREE.BoxGeometry(0.5, 0.4, 0.4), scooterOrangeMaterial, -0.48, 0.5);
    addScooterPart(new THREE.BoxGeometry(0.55, 0.06, 0.06), rubberMaterial, 0.47, 0.55);
    addScooterPart(new THREE.BoxGeometry(0.08, 0.31, 0.08), scooterBodyMaterial, 0.39, 0.39);
    const deliveryMark = new THREE.Mesh(
      new THREE.CircleGeometry(0.105, 24),
      new THREE.MeshBasicMaterial({ color: 0x1a0d02 }),
    );
    deliveryMark.position.set(-0.48, 0.5, 0.205);
    scooter.add(deliveryMark);

    const particleCount = 90;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 1) {
      particlePositions[i] = (Math.random() - 0.5) * 14;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3),
    );
    const sparks = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0xffa84a,
        size: 0.05,
        transparent: true,
        opacity: 0.7,
      }),
    );
    scene.add(sparks);

    let mouseX = 0;
    let mouseY = 0;
    let sectionTops = [];
    let previousScrollY = window.scrollY;
    let scrollVelocity = 0;
    let deliveryTimeline = null;
    let deliveryCompletionTimer;
    let lastDeliveryPhase = null;
    let worldHalfWidth = 3;
    let deliveryScale = 1;
    const notifyDeliveryPhase = (phase) => {
      if (lastDeliveryPhase === phase) return;
      lastDeliveryPhase = phase;
      callbacksRef.current.onDeliveryStageChange?.(phase);
    };
    const restoreSceneAfterDelivery = () => {
      deliveryTimeline = null;
      oven.visible = false;
      scooter.visible = false;
      pizza.visible = true;
    };
    const finishDelivery = () => {
      window.clearTimeout(deliveryCompletionTimer);
      restoreSceneAfterDelivery();
      notifyDeliveryPhase("delivered");
      deliveryCompletionTimer = window.setTimeout(() => {
        callbacksRef.current.onDeliveryComplete?.();
      }, 1100);
    };
    const startDelivery = () => {
      window.clearTimeout(deliveryCompletionTimer);
      lastDeliveryPhase = null;
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (prefersReducedMotion) {
        finishDelivery();
        return;
      }
      deliveryTimeline = {
        startedAt: performance.now(),
        start: {
          x: current.x,
          y: current.y,
          rotationX: current.rotationX,
          scale: current.scale,
        },
      };
      oven.visible = true;
      scooter.visible = false;
      pizza.visible = true;
      notifyDeliveryPhase("to-oven");
    };
    const skipDelivery = () => {
      window.clearTimeout(deliveryCompletionTimer);
      finishDelivery();
    };
    const onPointerMove = (event) => {
      mouseX = event.clientX / window.innerWidth - 0.5;
      mouseY = event.clientY / window.innerHeight - 0.5;
    };
    const resize = () => {
      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      worldHalfWidth =
        camera.aspect * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      deliveryScale = Math.min(1, camera.aspect / 0.85);
      oven.position.set(Math.min(worldHalfWidth * 0.45, 2.1), 0.16, -0.25);
      oven.scale.setScalar(deliveryScale);
      scooter.scale.setScalar(Math.min(1, camera.aspect / 1.1));
      sectionTops = Array.from(document.querySelectorAll("section"), (section) =>
        section.offsetTop,
      );
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("resize", resize);
    resize();
    const resizeTimer = window.setTimeout(resize, 500);

    let animationFrame;
    const current = { x: 1.9, y: 0, rotationX: 1.1, scale: 1 };
    const api = {
      setToppings: buildToppings,
      startDelivery,
      skipDelivery,
    };
    toppingsApiRef.current = api;
    const animate = () => {
      animationFrame = window.requestAnimationFrame(animate);
      const time = performance.now() / 1000;
      const scrollPosition = window.scrollY + window.innerHeight * 0.25;
      scrollVelocity += ((window.scrollY - previousScrollY) * 0.0015 - scrollVelocity) * 0.1;
      previousScrollY = window.scrollY;
      let sectionIndex = 0;
      while (
        sectionIndex < sectionTops.length - 1 &&
        scrollPosition >= sectionTops[sectionIndex + 1]
      ) {
        sectionIndex += 1;
      }
      const nextSection = Math.min(sectionIndex + 1, STOPS.length - 1);
      const progress =
        sectionIndex === nextSection
          ? 0
          : Math.min(
              1,
              (scrollPosition - sectionTops[sectionIndex]) /
                (sectionTops[nextSection] - sectionTops[sectionIndex]),
            );
      const easedProgress = progress * progress * (3 - 2 * progress);
      const from = STOPS[sectionIndex];
      const to = STOPS[nextSection];
      const isMobile = camera.aspect < 0.9;
      const widthScale = Math.min(1, camera.aspect / 1.6);
      const targetX = isMobile ? 0 : (from.x + (to.x - from.x) * easedProgress) * widthScale;
      const targetY = isMobile
        ? from.my + (to.my - from.my) * easedProgress
        : 0;
      const targetRotationX = from.ry + (to.ry - from.ry) * easedProgress;
      const targetScale =
        (from.s + (to.s - from.s) * easedProgress) *
        (isMobile ? 0.62 : Math.min(1, camera.aspect / 1.3));
      current.x += (targetX - current.x) * 0.07;
      current.y += (targetY - current.y) * 0.07;
      current.rotationX += (targetRotationX - current.rotationX) * 0.07;
      current.scale += (targetScale - current.scale) * 0.07;
      if (!(current.x + current.y + current.rotationX + current.scale < 1e9)) {
        current.x = 0;
        current.y = 0;
        current.rotationX = 1.1;
        current.scale = 1;
      }
      if (deliveryTimeline) {
        const elapsed = (performance.now() - deliveryTimeline.startedAt) / 1000;
        const ease = (progress) => {
          const value = Math.max(0, Math.min(1, progress));
          return value * value * (3 - 2 * value);
        };
        const ovenX = oven.position.x;
        const pickupStartX = -worldHalfWidth - 1.6;
        const pickupEndX = ovenX - 0.55;

        if (elapsed < 1.55) {
          const progress = ease(elapsed / 1.55);
          notifyDeliveryPhase("to-oven");
          pizza.visible = true;
          oven.visible = true;
          scooter.visible = false;
          pizza.position.set(
            deliveryTimeline.start.x +
              (ovenX - deliveryTimeline.start.x) * progress,
            deliveryTimeline.start.y +
              (oven.position.y - deliveryTimeline.start.y) * progress,
            progress * 0.58,
          );
          pizza.rotation.set(
            deliveryTimeline.start.rotationX +
              (0.25 - deliveryTimeline.start.rotationX) * progress,
            pizza.rotation.y,
            pizza.rotation.z,
          );
          pizza.scale.setScalar(
            deliveryTimeline.start.scale +
              (0.28 * deliveryScale - deliveryTimeline.start.scale) * progress,
          );
        } else if (elapsed < 3.75) {
          notifyDeliveryPhase("baking");
          pizza.visible = false;
          oven.visible = true;
          scooter.visible = false;
          ovenFireMaterial.opacity = 0.63 + Math.sin(time * 8) * 0.2;
          ovenLight.intensity = 2.4 + (Math.sin(time * 8) + 1) * 1.2;
        } else if (elapsed < 4.65) {
          notifyDeliveryPhase("pickup");
          pizza.visible = false;
          oven.visible = true;
          scooter.visible = true;
          scooter.position.set(
            pickupStartX + (pickupEndX - pickupStartX) * ease((elapsed - 3.75) / 0.9),
            -0.33,
            0.25,
          );
          ovenFireMaterial.opacity = 0.55;
          ovenLight.intensity = 1.7;
        } else if (elapsed < 7.05) {
          notifyDeliveryPhase("delivering");
          oven.visible = false;
          scooter.visible = true;
          pizza.visible = true;
          const progress = ease((elapsed - 4.65) / 2.4);
          scooter.position.set(
            pickupEndX + (worldHalfWidth + 2.1 - pickupEndX) * progress,
            -0.33 + Math.sin(progress * Math.PI) * 0.06,
            0.25,
          );
          pizza.position.set(
            scooter.position.x - 0.48 * scooter.scale.x,
            scooter.position.y + 0.89 * scooter.scale.y,
            0.82,
          );
          pizza.rotation.set(1.1, pizza.rotation.y, 0);
          pizza.scale.setScalar(0.27 * scooter.scale.x);
        } else if (elapsed < 8.2) {
          notifyDeliveryPhase("delivered");
          pizza.visible = false;
          oven.visible = false;
          scooter.visible = false;
        } else {
          restoreSceneAfterDelivery();
          window.clearTimeout(deliveryCompletionTimer);
          deliveryCompletionTimer = window.setTimeout(() => {
            callbacksRef.current.onDeliveryComplete?.();
          }, 0);
        }
        sparks.rotation.y = time * 0.03;
        sparks.position.y = Math.sin(time * 0.4) * 0.2;
        renderer.render(scene, camera);
        return;
      }
      pizza.position.set(
        current.x + mouseX * 0.3,
        current.y - mouseY * 0.2 + Math.sin(time * 1.2) * 0.08,
        0,
      );
      pizza.rotation.x = current.rotationX + mouseY * 0.35;
      pizza.rotation.z = -mouseX * 0.3;
      pizza.scale.setScalar(current.scale);
      flavorKick *= 0.95;
      pizza.rotation.y += 0.004 + flavorKick * 0.2 + scrollVelocity;
      toppings.children.forEach((topping) => {
        const progress = Math.max(
          0,
          Math.min(1, (time - toppingStart - topping.userData.delay) * 2.5),
        );
        const bounce =
          1 +
          2.2 * Math.pow(progress - 1, 3) +
          1.2 * Math.pow(progress - 1, 2);
        const scale = progress <= 0 ? 0 : bounce;
        const [x, y, z] = topping.userData.scale;
        topping.scale.set(x * scale, y * scale, z * scale);
      });
      sparks.rotation.y = time * 0.03;
      sparks.position.y = Math.sin(time * 0.4) * 0.2;
      renderer.render(scene, camera);
    };
    const onContextLost = (event) => {
      event.preventDefault();
      setError("WebGL context lost. Reload the page to restore the 3D pizza.");
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    animate();
    setError("");

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(resizeTimer);
      window.clearTimeout(deliveryCompletionTimer);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      toppingsApiRef.current = null;
      const disposedGeometries = new Set();
      const disposedMaterials = new Set();
      const disposedTextures = new Set([colorTexture, bumpTexture]);
      scene.traverse((object) => {
        if (object.geometry && !disposedGeometries.has(object.geometry)) {
          disposedGeometries.add(object.geometry);
          object.geometry.dispose();
        }
        const materials = Array.isArray(object.material)
          ? object.material
          : object.material
            ? [object.material]
            : [];
        materials.forEach((meshMaterial) => {
          if (disposedMaterials.has(meshMaterial)) return;
          disposedMaterials.add(meshMaterial);
          Object.values(meshMaterial).forEach((value) => {
            if (value && value.isTexture) disposedTextures.add(value);
          });
          meshMaterial.dispose();
        });
      });
      disposedTextures.forEach((texture) => texture.dispose());
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    toppingsApiRef.current?.setToppings(flavor, FL[flavor].c);
    document.documentElement.style.setProperty("--or", FL[flavor].c);
  }, [flavor]);

  useEffect(() => {
    if (deliveryId > 0) toppingsApiRef.current?.startDelivery();
  }, [deliveryId]);

  useEffect(() => {
    if (skipDeliveryId > 0) toppingsApiRef.current?.skipDelivery();
  }, [skipDeliveryId]);

  return (
    <>
      <canvas ref={canvasRef} aria-hidden="true" />
      {error && (
        <div className="scene-error" role="alert">
          3D problem: {error}
        </div>
      )}
    </>
  );
}
