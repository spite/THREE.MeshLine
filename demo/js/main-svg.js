import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { MeshLine, MeshLineMaterial } from '../../src/THREE.MeshLine.js';
import { colors } from './colors.js';

const container = document.getElementById( 'container' );

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );
camera.position.set( 500, 0, 0 );

const renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
container.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );

// half a pixel of the page wide, whatever the distance
const material = new MeshLineMaterial( {
	color: colors[ 3 ],
	opacity: 1,
	sizeAttenuation: false,
	lineWidth: .5,
	depthWrite: false,
	depthTest: false,
	transparent: true
} );

function makeLine( points ) {

	const g = new MeshLine();
	g.setPoints( points );

	const mesh = new THREE.Mesh( g, material );
	mesh.position.z += 500;
	mesh.position.y += 300;
	mesh.rotation.y = - Math.PI / 2;
	mesh.rotation.z = Math.PI;
	scene.add( mesh );

	return mesh;

}

// one line per sub path of the drawing
new SVGLoader().load( 'assets/worldLow.svg', function ( data ) {

	for ( const path of data.paths ) {

		for ( const subPath of path.subPaths ) {

			const points = subPath.getPoints();
			if ( points.length > 1 ) makeLine( points.map( p => new THREE.Vector3( p.x, p.y, 0 ) ) );

		}

	}

} );

function onWindowResize() {

	const w = container.clientWidth;
	const h = container.clientHeight;

	camera.aspect = w / h;
	camera.updateProjectionMatrix();

	renderer.setSize( w, h );

}

window.addEventListener( 'resize', onWindowResize );
onWindowResize();

function render() {

	requestAnimationFrame( render );
	controls.update();

	renderer.render( scene, camera );

}

render();
