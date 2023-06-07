import * as THREE from 'three';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {MTLLoader} from 'three/addons/loaders/MTLLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
function render(time) {
    time *= 0.001;

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

function makeInstance(geometry, color, x) {

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    cube.position.x = 0;
    cube.position.y = 0;
    cube.position.z = -1;
    return cube;
}

const objLoader = new OBJLoader();
const mtlLoader = new MTLLoader();
mtlLoader.load('public/models/SaturnV/Saturn V.mtl', (mtl) => {
    mtl.preload();
    objLoader.setMaterials(mtl);
    objLoader.load('public/models/SaturnV/Saturn V.obj', (root) => {
        root.position.z = 0;
        root.position.y = 0;
        root.castShadow = true;
        root.receiveShadow = true;
        scene.add(root);
    });
});
const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
renderer.shadowMap.enabled = true;
const loadManager = new THREE.LoadingManager();
const loader = new THREE.TextureLoader(loadManager);
const fov = 75;
const aspect = 2;  // the canvas default
const near = 0.1;
const far = 50000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 2;
const scene = new THREE.Scene();
const boxWidth = 1;
const boxHeight = 1;
const boxDepth = 1;
const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 5, 0);
controls.update();
const groundMat = new THREE.MeshPhongMaterial({map: loader.load('public/images/1.jpg')});
const ground = new THREE.Mesh(geometry, groundMat);
ground.scale.x = 100;
ground.scale.z = 100;
ground.receiveShadow = true;
scene.add(ground);


renderer.render(scene, camera);
/*const materials = [
    new THREE.MeshBasicMaterial({map: loader.load('public/images/1.jpg')}),
    new THREE.MeshBasicMaterial({map: loader.load('public/images/2.jpg')}),
    new THREE.MeshBasicMaterial({map: loader.load('public/images/3.jpg')}),
    new THREE.MeshBasicMaterial({map: loader.load('public/images/4.jpg')}),
    new THREE.MeshBasicMaterial({map: loader.load('public/images/5.jpg')}),
    new THREE.MeshBasicMaterial({map: loader.load('public/images/6.jpg')}),
];*/
const material = new THREE.MeshBasicMaterial({map : loader.load('public/images/test.jpg')});
const cubes = [
    //makeInstance(geometry, 0x44aa88, 0)
    //makeInstance(geometry, 0x8844aa, -2),
    //makeInstance(geometry, 0xaa8844, 2),
];

{
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.SpotLight(color, intensity);
    light.castShadow = true;
    light.position.set(0, 100, 200);
    scene.add(light);
    const cameraHelper = new THREE.CameraHelper(light.shadow.camera);
    scene.add(cameraHelper);
}

{
    const color = 0xFFFFFF;
    const intensity = 0.0;
    const light = new THREE.AmbientLight(color, intensity);
    scene.add(light);
}

loadManager.onLoad = () => {
    requestAnimationFrame(render);
}
