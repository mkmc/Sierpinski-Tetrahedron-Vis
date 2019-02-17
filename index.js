/* global THREE */

!function () {

    const MAX_TIME = 8;
    const MAX_SPEED = 2;

    const options = {
        time: 3.3,
        speed: 0.3,
        animate: false,
        forward: true,
        loop: false
    };

    const playbackButton = document.getElementById('playback-button');
    const pauseButton = document.getElementById('pause-button');
    const playforwardButton = document.getElementById('playforward-button');

    const progressBarElement = document.getElementById('progress-bar');
    const progressValueElement = document.getElementById('progress-value');

    const loopButton = document.getElementById('loop-button');

    const speedBarElement = document.getElementById('speed-bar');
    const speedValueElement = document.getElementById('speed-value');

    const toStartButton = document.getElementById('tostart-button');
    const stepBackButton = document.getElementById('stepback-button');
    const stepForwardButton = document.getElementById('stepforward-button');
    const toEndButton = document.getElementById('toend-button');

    const useColorButton = document.getElementById('usecolor-button');
    const useDepthButton = document.getElementById('usedepth-button');
    const useLambertButton = document.getElementById('uselambert-button');

    const resetCamButton = document.getElementById('resetcam-button');

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
        uniforms: {useColor: {value: false}, useDepth: {value: true}, useLambert: {value: true}},
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
        options.animate = false;

        playbackButton.classList.remove('active');
        playbackButton.classList.add('inactive');
        pauseButton.classList.remove('inactive');
        pauseButton.classList.add('active');
        playforwardButton.classList.remove('active');
        playforwardButton.classList.add('inactive');
    };

    // === UI ===

    !function () {
        const playForward = function () {
            options.animate = true;
            options.forward = true;

            if (options.time === MAX_TIME) {
                options.time = 0;
            }

            playbackButton.classList.remove('active');
            playbackButton.classList.add('inactive');
            pauseButton.classList.remove('active');
            pauseButton.classList.add('inactive');
            playforwardButton.classList.remove('inactive');
            playforwardButton.classList.add('active');
        };

        const playBack = function () {
            options.animate = true;
            options.forward = false;

            if (options.time === 0) {
                options.time = MAX_TIME;
            }

            playbackButton.classList.remove('inactive');
            playbackButton.classList.add('active');
            pauseButton.classList.remove('active');
            pauseButton.classList.add('inactive');
            playforwardButton.classList.remove('active');
            playforwardButton.classList.add('inactive');
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

        playbackButton.addEventListener('click', playBack);
        pauseButton.addEventListener('click', pause);
        playforwardButton.addEventListener('click', playForward);

        loopButton.addEventListener('click', toggleLoop);
        useColorButton.addEventListener('click', toggleColor);
        useDepthButton.addEventListener('click', toggleDepth);
        useLambertButton.addEventListener('click', toggleLambert);
        resetCamButton.addEventListener('click', resetCamera);

        toStartButton.addEventListener('click', function () {
            setTime(0);
        });
        stepBackButton.addEventListener('click', function () {
            setTime(Math.floor(options.time - 0.01));
        });
        stepForwardButton.addEventListener('click', function () {
            setTime(Math.ceil(options.time + 0.01));
        });
        toEndButton.addEventListener('click', function () {
            setTime(MAX_TIME);
        });

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

                let newTime = 0;
                if (options.forward) {
                    newTime = options.time + options.speed * dt / 1000;
                    while (newTime > MAX_TIME) {
                        if (options.loop) {
                            newTime -= MAX_TIME;
                        } else {
                            newTime = MAX_TIME;
                            pause();
                        }
                    }
                } else {
                    newTime = options.time - options.speed * dt / 1000;
                    while (newTime < 0) {
                        if (options.loop) {
                            newTime += MAX_TIME;
                        } else {
                            newTime = 0;
                            pause();
                        }
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