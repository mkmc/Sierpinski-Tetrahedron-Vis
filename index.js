/* global dat, THREE */

!function () {

    const MAX_TIME = 8;

    const options = {
        time: 1.5,
        speed: 0.5,
        animate: false,
        loop: false,
        useColor: true,
        useLambert: true,
        useDepth: true
    };

    const playstopButtonElement = document.getElementById('playstop-button');
    const progressBackgroundElement = document.getElementById('progress-background');
    const progressValueElement = document.getElementById('progress-value');

    const canvasElement = document.getElementById('main-canvas');
    const renderer = new THREE.WebGLRenderer({
        canvas: canvasElement,
        alpha: true,
        antialias: true
    });
    renderer.sortObjects = false;

    const scene = new THREE.Scene();

    const material = new THREE.ShaderMaterial({
        uniforms: {
            useColor: {value: options.useColor},
            useDepth: {value: options.useDepth},
            useLambert: {value: options.useLambert}
        },
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent,
        side: THREE.DoubleSide
    });

    const camera = new THREE.PerspectiveCamera(45, canvasElement.clientWidth / canvasElement.clientHeight, 0.0001, 10);
    camera.position.set(0, 0, 3);
    camera.lookAt(0, 0, 0);

    const controls = new THREE.OrbitControls(camera, canvasElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    //controls.maxPolarAngle = Math.PI / 2;
    controls.target = new THREE.Vector3(0, 0.3, 0);

    options['reset camera'] = function () {
        camera.position.set(0, 3, 0);
        camera.lookAt(0, 0, 0);
        controls.target = new THREE.Vector3(0, 0.3, 0);
    };

    const createBaseVertices = function () {
        const vecA = new THREE.Vector3().setFromCylindrical(new THREE.Cylindrical(1, 0));
        const vecB = new THREE.Vector3().setFromCylindrical(new THREE.Cylindrical(1, 2 * Math.PI / 3));
        const vecC = new THREE.Vector3().setFromCylindrical(new THREE.Cylindrical(1, 4 * Math.PI / 3));

        const vecAB = vecA.clone().add(vecB).divideScalar(2);
        const vecBC = vecB.clone().add(vecC).divideScalar(2);
        const vecCA = vecC.clone().add(vecA).divideScalar(2);

        return {
            vertices: [
                vecA, vecCA, vecAB,
                vecB, vecAB.clone(), vecBC,
                vecC, vecBC.clone(), vecCA.clone(),
                vecAB.clone(), vecCA.clone(), vecBC.clone()
            ],
            colors: ['r', 'g', 'b', 'k']
        };
    };

    const foldBasicVerticesUp = function (vertices, percentage) {
        for (let i = 0; i < vertices.length; i = i + 3) {
            if ((i / 3) % 4 === 3) {
                // skip the bottom
                continue;
            }

            const vecA = vertices[i];
            const vecB = vertices[i + 1];
            const vecC = vertices[i + 2];

            const vecBC = vecB.clone().add(vecC).divideScalar(2);
            const axis = vecC.clone().sub(vecB).normalize();

            const vecABC = vecA.clone().sub(vecBC);
            vecABC.applyAxisAngle(axis, -percentage * (Math.PI - Math.acos(1 / 3)));

            vecA.copy(vecBC).add(vecABC);
        }
    };

    const split = function (vertices, colors) {
        const newVertices = [];
        const newColors = [];

        for (let i = 0; i < vertices.length; i = i + 3) {
            const vecA = vertices[i];
            const vecB = vertices[i + 1];
            const vecC = vertices[i + 2];

            const vecAB = vecA.clone().add(vecB).divideScalar(2);
            const vecBC = vecB.clone().add(vecC).divideScalar(2);
            const vecCA = vecC.clone().add(vecA).divideScalar(2);
            const vecABC = vecA.clone().add(vecB).add(vecC).divideScalar(3);

            newVertices.push(
                vecA.clone(), vecAB.clone(), vecCA.clone(),
                vecAB.clone(), vecB.clone(), vecBC.clone(),
                vecCA.clone(), vecBC.clone(), vecC.clone(),
                vecABC.clone(), vecCA.clone(), vecAB.clone(),
                vecABC.clone(), vecAB.clone(), vecBC.clone(),
                vecABC.clone(), vecBC.clone(), vecCA.clone()
            );

            const c0 = colors[i / 3];
            let c1, c2, c3;
            switch (c0) {
                case 'r':
                    c1 = 'k';
                    c2 = 'g';
                    c3 = 'b';
                    break;
                case 'g':
                    c1 = 'k';
                    c2 = 'b';
                    c3 = 'r';
                    break;
                case 'b':
                    c1 = 'k';
                    c2 = 'r';
                    c3 = 'g';
                    break;
                case 'k':
                    c1 = 'b';
                    c2 = 'g';
                    c3 = 'r';
                    break;
                default:
                    c1 = '?';
                    c2 = '?';
                    c3 = '?';
            }

            newColors.push(c0, c0, c0, c1, c2, c3);
        }
        return {vertices: newVertices, colors: newColors};
    };

    const positionsCache = {};

    const foldInTriangle = function (vertices, i0, i1, i2, percentage) {
        const vecA = vertices[i0];
        const vecB = vertices[i1];
        const vecC = vertices[i2];

        const vecBC = vecB.clone().add(vecC).divideScalar(2);
        const axis = vecB.clone().sub(vecC).normalize();

        const vecABC = vecA.clone().sub(vecBC);
        vecABC.applyAxisAngle(axis, percentage * (Math.PI - Math.acos(1 / 3)));

        vecA.copy(vecBC).add(vecABC);
    };

    const foldIn = function (vertices, percentage) {
        for (let i = 0; i < vertices.length; i = i + 3 * 6) {
            foldInTriangle(vertices, i + 9, i + 10, i + 11, percentage);
            foldInTriangle(vertices, i + 12, i + 13, i + 14, percentage);
            foldInTriangle(vertices, i + 15, i + 16, i + 17, percentage);
        }
    };

    const calculateSubPositions = function (depth, bases = [new THREE.Vector3()]) {
        if (depth < 1) {
            return bases;
        }

        const height = 0.7071067811865477;
        const fraction = 1 / Math.pow(2, depth);
        const newBases = [];
        bases.forEach(base => {
            newBases.push(
                new THREE.Vector3(0, height * fraction, 0).add(base),
                new THREE.Vector3().setFromCylindrical(new THREE.Cylindrical(0.5 * fraction, Math.PI / 3)).add(base),
                new THREE.Vector3().setFromCylindrical(new THREE.Cylindrical(0.5 * fraction, 3 * Math.PI / 3)).add(base),
                new THREE.Vector3().setFromCylindrical(new THREE.Cylindrical(0.5 * fraction, 5 * Math.PI / 3)).add(base)
            );
        });

        return depth > 1 ? calculateSubPositions(depth - 1, newBases) : newBases;
    };

    const clearScene = function () {
        scene.children = [];
    };

    const setTime = function (time) {
        clearScene();

        if (!time) {
            time = 0;
        }

        time = Math.min(MAX_TIME, Math.max(0, time));

        options.time = time;
        progressValueElement.style.width = time / MAX_TIME * 100 + '%';

        let {vertices, colors} = createBaseVertices();
        foldBasicVerticesUp(vertices, Math.min(1, time));

        const depth = Math.floor(time) - 1;
        let positions = positionsCache[depth];
        if (!positions) {
            positions = positionsCache[depth] = calculateSubPositions(depth);
        }

        if (time > 1) {
            if (time % 1 !== 0) {
                ({vertices, colors} = split(vertices, colors));
                foldIn(vertices, ((time - 1) % 1));
            }

            vertices.forEach(v => {
                v.divideScalar(Math.pow(2, Math.floor(time) - 1));
            });
        }

        let normals = [];
        for (let i = 0; i < vertices.length; i = i + 3) {
            const vecA = vertices[i];
            const vecB = vertices[i + 1];
            const vecC = vertices[i + 2];

            const n = vecA.clone().sub(vecB).normalize().cross(vecA.clone().sub(vecC).normalize()).normalize();
            normals.push(n);
        }

        const bufferVertices = new Array(positions.length * vertices.length * 3);
        const bufferColors = new Array(positions.length * vertices.length * 3);
        const bufferNormals = new Array(positions.length * vertices.length * 3);
        positions.forEach((p, i) => {
            vertices.forEach((v, j) => {
                const offset = (i * vertices.length + j) * 3;
                bufferVertices[offset] = v.x + p.x;
                bufferVertices[offset + 1] = v.y + p.y;
                bufferVertices[offset + 2] = v.z + p.z;

                bufferNormals[offset] = normals[Math.floor(j / 3)].x;
                bufferNormals[offset + 1] = normals[Math.floor(j / 3)].y;
                bufferNormals[offset + 2] = normals[Math.floor(j / 3)].z;

                switch (colors[Math.floor(j / 3)]) {
                    case 'r':
                        bufferColors[offset] = 1;
                        bufferColors[offset + 1] = 0;
                        bufferColors[offset + 2] = 0;
                        break;
                    case 'g':
                        bufferColors[offset] = 0;
                        bufferColors[offset + 1] = 1;
                        bufferColors[offset + 2] = 0;
                        break;
                    case 'b':
                        bufferColors[offset] = 0;
                        bufferColors[offset + 1] = 0;
                        bufferColors[offset + 2] = 1;
                        break;
                    case 'k':
                        bufferColors[offset] = 0;
                        bufferColors[offset + 1] = 0;
                        bufferColors[offset + 2] = 0;
                        break;
                    default:
                        bufferColors[offset] = 1;
                        bufferColors[offset + 1] = 1;
                        bufferColors[offset + 2] = 1;
                }
            });
        });

        const geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(bufferVertices), 3));
        geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(bufferColors), 3));
        geometry.addAttribute('cnormal', new THREE.BufferAttribute(new Float32Array(bufferNormals), 3));
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
    };

    setTime(options.time);

    options['floor'] = function () {
        setTime(options.time = Math.floor(options.time));
    };
    options['ceiling'] = function () {
        setTime(options.time = Math.ceil(options.time));
    };

    const togglePlay = function () {
        options.animate = !options.animate;

        if (options.animate) {
            playstopButtonElement.classList.remove('fa-play');
            playstopButtonElement.classList.add('fa-pause');
        } else {
            playstopButtonElement.classList.remove('fa-pause');
            playstopButtonElement.classList.add('fa-play');
        }
    };

    const pause = function () {
        options.animate = 0;

        playstopButtonElement.classList.remove('fa-pause');
        playstopButtonElement.classList.add('fa-play');
    };

    playstopButtonElement.addEventListener('click', togglePlay);
    progressBackgroundElement.addEventListener('click', function (e) {
        setTime(e.offsetX / e.target.offsetWidth * MAX_TIME);
    });

    // === GUI ===

    const gui = new dat.GUI();
    gui.add(options, 'useColor').onChange(v => {
        material.uniforms.useColor.value = v;
    });
    gui.add(options, 'useDepth').onChange(v => {
        material.uniforms.useDepth.value = v;
    });
    gui.add(options, 'useLambert').onChange(v => {
        material.uniforms.useLambert.value = v;
    });
    gui.add(options, 'speed', 0, 1, 0.01);
    gui.add(options, 'loop');
    gui.add(options, 'reset camera');

    // === RENDER / ANIMATION LOOP ===

    let lastTime = 0;
    const animate = function () {
        const now = performance.now();
        if (!lastTime) {
            lastTime = now;
        }

        if (options.animate) {
            const dt = now - lastTime;

            let newTime = options.time + options.speed * dt / 1000;
            while (newTime > MAX_TIME) {
                if (options.loop) {
                    newTime -= MAX_TIME;
                } else {
                    newTime = MAX_TIME;
                    pause();
                }
            }

            if (options.time !== newTime) {
                setTime(newTime);
            }
        }

        if (renderer.getSize().width !== canvasElement.clientWidth
            || renderer.getSize().height !== canvasElement.clientHeight) {
            renderer.setSize(canvasElement.clientWidth, canvasElement.clientHeight);

            camera.aspect = canvasElement.clientWidth / canvasElement.clientHeight;
            camera.updateProjectionMatrix();

            controls.update();
        }

        renderer.render(scene, camera);

        lastTime = now;

        requestAnimationFrame(animate);
    };

    animate();
}();