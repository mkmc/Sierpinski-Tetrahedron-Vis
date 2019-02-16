/* global dat, THREE */

!function () {

    const MAX_TIME = 8;
    const MAX_SPEED = 1;

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
    const progressBarElement = document.getElementById('progress-bar');
    const progressValueElement = document.getElementById('progress-value');
    const speedBarElement = document.getElementById('speed-bar');
    const speedValueElement = document.getElementById('speed-value');

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

    const clearScene = function () {
        scene.children.forEach(c => {
            c.geometry.dispose();
        });
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

        const mesh = new THREE.Mesh(GeometryHelper.generate(time), material);
        scene.add(mesh);
    };

    const setSpeed = function (speed) {
        if (!speed) {
            speed = 0;
        }

        speed = Math.min(MAX_SPEED, Math.max(0, speed));
        options.speed = speed;
        speedValueElement.style.width = speed / MAX_SPEED * 100 + '%';
    };

    setTime(options.time);
    setSpeed(options.speed);

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
    progressBarElement.addEventListener('click', function (e) {
        setTime(e.offsetX / e.target.offsetWidth * MAX_TIME);
    });
    speedBarElement.addEventListener('click', function (e) {
        setSpeed(e.offsetX / e.target.offsetWidth * MAX_SPEED);
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