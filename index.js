/* global THREE */

!function () {

    const MAX_TIME = 8;
    const MAX_SPEED = 2;

    const options = {
        time: 1.5,
        speed: 0.5,
        animate: false,
        loop: false
    };

    const playstopButton = document.getElementById('playstop-button');
    const loopButton = document.getElementById('loop-button');
    const useColorButton = document.getElementById('usecolor-button');
    const useDepthButton = document.getElementById('usedepth-button');
    const useLambertButton = document.getElementById('uselambert-button');
    const resetCamButton = document.getElementById('resetcam-button');

    const progressBarElement = document.getElementById('progress-bar');
    const progressValueElement = document.getElementById('progress-value');
    const speedBarElement = document.getElementById('speed-bar');
    const speedValueElement = document.getElementById('speed-value');

    const canvasElement = document.getElementById('main-canvas');

    // === INIT RENDERER & SCENE ===

    const renderer = new THREE.WebGLRenderer({
        canvas: canvasElement,
        alpha: true,
        antialias: true
    });
    renderer.sortObjects = false;

    const scene = new THREE.Scene();

    const material = new THREE.ShaderMaterial({
        uniforms: {useColor: {value: true}, useDepth: {value: true}, useLambert: {value: true}},
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent,
        side: THREE.DoubleSide
    });

    const camera = new THREE.PerspectiveCamera(45, canvasElement.clientWidth / canvasElement.clientHeight, 0.0001, 10);

    const controls = new THREE.OrbitControls(camera, canvasElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    //controls.maxPolarAngle = Math.PI / 2;

    // === ANIMATION METHODS ===

    const resetCamera = function () {
        camera.position.set(1.5, 1, 1.5);
        camera.lookAt(0, 0.3, 0);
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

    const pause = function () {
        options.animate = 0;

        playstopButton.classList.remove('fa-pause');
        playstopButton.classList.add('fa-play');
    };

    // === UI ===

    !function () {
        const togglePlay = function () {
            options.animate = !options.animate;

            if (options.animate) {
                if (options.time === MAX_TIME) {
                    options.time = 0;
                }

                playstopButton.classList.remove('fa-play');
                playstopButton.classList.add('fa-pause');
            } else {
                playstopButton.classList.remove('fa-pause');
                playstopButton.classList.add('fa-play');
            }
        };

        const toggleLoop = function () {
            if (options.loop) {
                options.loop = false;
                loopButton.classList.remove('active');
                loopButton.classList.add('inactive');
            } else {
                options.loop = true;
                loopButton.classList.remove('inactive');
                loopButton.classList.add('active');
            }
        };

        const toggleColor = function () {
            if (material.uniforms.useColor.value) {
                material.uniforms.useColor.value = false;
                useColorButton.classList.remove('active');
                useColorButton.classList.add('inactive');
            } else {
                material.uniforms.useColor.value = true;
                useColorButton.classList.remove('inactive');
                useColorButton.classList.add('active');
            }
        };

        const toggleDepth = function () {
            if (material.uniforms.useDepth.value) {
                material.uniforms.useDepth.value = false;
                useDepthButton.classList.remove('active');
                useDepthButton.classList.add('inactive');
            } else {
                material.uniforms.useDepth.value = true;
                useDepthButton.classList.remove('inactive');
                useDepthButton.classList.add('active');
            }
        };

        const toggleLambert = function () {
            if (material.uniforms.useLambert.value) {
                material.uniforms.useLambert.value = false;
                useLambertButton.classList.remove('active');
                useLambertButton.classList.add('inactive');
            } else {
                material.uniforms.useLambert.value = true;
                useLambertButton.classList.remove('inactive');
                useLambertButton.classList.add('active');
            }
        };

        playstopButton.addEventListener('click', togglePlay);
        loopButton.addEventListener('click', toggleLoop);
        useColorButton.addEventListener('click', toggleColor);
        useDepthButton.addEventListener('click', toggleDepth);
        useLambertButton.addEventListener('click', toggleLambert);
        resetCamButton.addEventListener('click', resetCamera);

        let isBoundToProgress = false;
        let isBoundToSpeed = false;

        progressBarElement.addEventListener('mousedown', function (e) {
            setTime(e.offsetX / progressBarElement.offsetWidth * MAX_TIME);
            isBoundToProgress = true;
        });
        speedBarElement.addEventListener('mousedown', function (e) {
            setSpeed(e.offsetX / speedBarElement.offsetWidth * MAX_SPEED);
            isBoundToSpeed = true;
        });
        document.addEventListener('mousemove', function (e) {
            if (isBoundToProgress) {
                setTime((e.pageX - progressBarElement.offsetLeft) / progressBarElement.offsetWidth * MAX_TIME);
            } else if (isBoundToSpeed) {
                setSpeed((e.pageX - speedBarElement.offsetLeft) / speedBarElement.offsetWidth * MAX_SPEED);
            }
        });
        document.addEventListener('mouseup', function (e) {
            isBoundToProgress = false;
            isBoundToSpeed = false;
        });
    }();

    // === RENDER / ANIMATION LOOP ===

    !function () {
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
                renderer.setPixelRatio(window.devicePixelRatio);
                renderer.setSize(canvasElement.clientWidth, canvasElement.clientHeight);

                camera.aspect = canvasElement.clientWidth / canvasElement.clientHeight;
                camera.updateProjectionMatrix();

                controls.update();
            }

            renderer.render(scene, camera);

            lastTime = now;

            requestAnimationFrame(animate);
        };

        // initial camera position
        resetCamera();

        // create initial geometry
        setTime(options.time);
        setSpeed(options.speed);

        // trigger render loop
        animate();
    }();
}();