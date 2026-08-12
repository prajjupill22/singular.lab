# SINGULARITY.LAB — fixed build

Upload the contents of this folder to a GitHub repository and enable GitHub Pages.

## Important camera requirement
Web camera APIs require a secure context. GitHub Pages provides HTTPS automatically. Do not test by double-clicking `index.html` (`file://`), because browsers normally block camera access there.

## What is fixed
- Camera startup waits for metadata and handles common permission/device errors.
- Hand tracking uses MediaPipe Hand Landmarker with GPU → CPU fallback.
- Tracking runs only on new video frames, reducing inference load.
- Responsive renderer resizing and post-processing are handled correctly.
- The singularity is built from layered 3D geometry, orbital instanced icosahedron grains, 3D spiral filaments, multiple photon rings, a volumetric dust field and a 3D particle shell.
- Hand gestures drive the field in real time.
- Camera feed remains visible behind the 3D experiment at low opacity so the interaction is understandable.
- No build step or server is required.

## External runtime dependencies
Three.js and MediaPipe Tasks Vision are loaded from jsDelivr, and the hand model is loaded from Google's model storage. The deployed site therefore needs network access on first load.
