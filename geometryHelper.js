const GeometryHelper = function () {

    /**
     * Generates the vertices of the base triangle, already split into four triangles representing the sides of the
     * tetrahedron.
     */
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
            colors: [[1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, 0]]
        };
    };

    /**
     * Folds the base triangle into a tetrahedron.
     */
    const foldBasicVerticesUp = function (percentage) {
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

    /**
     * Splits all four sides of the tetrahedron into 6 triangles. The colors of the inner 3, which will be folded into
     * the inside, are interpolated between the color of the origin side and the color of the destination.
     */
    const split = function (vertices, colors, fraction) {
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
            if (c0[0] === 1) {
                c1 = [1 - fraction, 0, 0]; // red => black
                c2 = [1 - fraction, fraction, 0]; // red => green
                c3 = [1 - fraction, 0, fraction]; // red => blue
            } else if (c0[1] === 1) {
                c1 = [0, 1 - fraction, 0]; // green => black
                c2 = [0, 1 - fraction, fraction]; // green => blue
                c3 = [fraction, 1 - fraction, 0]; // green => red
            } else if (c0[2] === 1) {
                c1 = [0, 0, 1 - fraction]; // blue => black
                c2 = [fraction, 0, 1 - fraction]; // blue => red
                c3 = [0, fraction, 1 - fraction]; // blue => green
            } else {
                c1 = [0, 0, fraction]; // black => blue
                c2 = [0, fraction, 0]; // black => green
                c3 = [fraction, 0, 0]; // black => red
            }

            newColors.push(c0, c0, c0, c1, c2, c3);
        }
        return {vertices: newVertices, colors: newColors};
    };

    /**
     * Folds in a single triangle.
     */
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

    /**
     * Folds in the three inner triangles on all sides.
     */
    const foldIn = function (vertices, percentage) {
        for (let i = 0; i < vertices.length; i = i + 3 * 6) {
            foldInTriangle(vertices, i + 9, i + 10, i + 11, percentage);
            foldInTriangle(vertices, i + 12, i + 13, i + 14, percentage);
            foldInTriangle(vertices, i + 15, i + 16, i + 17, percentage);
        }
    };

    /**
     * Recursively calculates the positions of the sub-tetrahedrons.
     */
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

    // this caches precalculated positions of the sub-tetrahedrons
    const positionsCache = {};

    return {
        /**
         * Generates the geometry of the sierpinski tetrahedron.
         */
        generate: function (time) {
            // generate the base triangle and fold it up to a tetrahedron
            let {vertices, colors} = createBaseVertices();
            foldBasicVerticesUp(vertices, Math.min(1, time));

            // calulate the positions of all sub-tetrahedrons
            const depth = Math.floor(time) - 1;
            let positions = positionsCache[depth];
            if (!positions) {
                positions = positionsCache[depth] = calculateSubPositions(depth);
            }

            // time > 1 means, we need to fold in the sides of the tetrahedron
            if (time > 1) {
                if (time % 1 !== 0) {
                    ({vertices, colors} = split(vertices, colors, time % 1));
                    foldIn(vertices, time % 1);
                }

                vertices.forEach(v => {
                    v.divideScalar(Math.pow(2, Math.floor(time) - 1));
                });
            }

            // calculate the normals
            let normals = [];
            for (let i = 0; i < vertices.length; i = i + 3) {
                const vecA = vertices[i];
                const vecB = vertices[i + 1];
                const vecC = vertices[i + 2];

                const n = vecA.clone().sub(vecB).normalize().cross(vecA.clone().sub(vecC).normalize()).normalize();
                normals.push(n);
            }

            // repeat the geometry at every position and store it into attribute buffer
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

                    bufferColors[offset] = colors[Math.floor(j / 3)][0];
                    bufferColors[offset + 1] = colors[Math.floor(j / 3)][1];
                    bufferColors[offset + 2] = colors[Math.floor(j / 3)][2];
                });
            });

            const geometry = new THREE.BufferGeometry();
            geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(bufferVertices), 3));
            geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(bufferColors), 3));
            geometry.addAttribute('cnormal', new THREE.BufferAttribute(new Float32Array(bufferNormals), 3));

            return geometry;
        }
    };
}();