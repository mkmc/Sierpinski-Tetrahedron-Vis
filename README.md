# Sierpinski-Tetrahedron-Vis

A simple visualization of a [Sierpinski Tetrahedron](https://en.wikipedia.org/wiki/Sierpinski_triangle#Analogues_in_higher_dimensions) being folded from a two-dimensional triangle. [three.js](https://threejs.org) is used for rendering.

## Demo guide

[Demo](https://mkmc.github.io/Sierpinski-Tetrahedron-Vis/)

The camera can be ...
* rotated around the fractal using left mousebutton (or dragging with one finger)
* zoomed using mouse wheel (or pinching / spreading with two fingers)
* panned using the right mousebutton (or dragging with two fingers)

The animation can be played (forward or backward) or paused using the top-left controls. The progress bar indicates the timestamp of the animation. It can be clicked to jump to a timestep.

It is possible to jump between complete iterations using the bottom left buttons. The bar next to it sets the animation speed and the last button toggles animation looping.

The buttons in the bottom right set the following options/actions:
* Coloring the triangles depending on their side. The color of triangles still being folded is interpolated between the two sided.
* Shading the triangles depending on their distance to the camera.
* Shading the triangles using Lambert shading.
* Resetting the camera to the initial position.
