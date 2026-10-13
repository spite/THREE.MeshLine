import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MeshLine, MeshLineMaterial } from '../../src/THREE.MeshLine.js';
import { colors } from './colors.js';

const container = document.getElementById( 'container' );

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 1, 1000 );
camera.position.set( 50, 10, 0 );
camera.zoom = 10;
const frustumSize = 1000;

const renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
container.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );

const graph = new THREE.Object3D();
scene.add( graph );

function makeLine( points, c ) {

	const g = new MeshLine();
	g.setPoints( points );

	// the width is in pixels of the page
	const material = new MeshLineMaterial( {
		color: colors[ c ],
		sizeAttenuation: false,
		lineWidth: 5
	} );

	graph.add( new THREE.Mesh( g, material ) );

}

function plot( fn, z, c ) {

	const line = new Float32Array( 600 );
	for ( let j = 0; j < 200 * 3; j += 3 ) {

		line[ j ] = - 30 + .1 * j;
		line[ j + 1 ] = fn( j );
		line[ j + 2 ] = z;

	}

	makeLine( line, c );

}

plot( j => 5 * Math.sin( .01 * j ), - 20, 0 );
plot( j => 5 * Math.cos( .02 * j ), - 10, 1 );
plot( j => 5 * Math.sin( .01 * j ) * Math.cos( .005 * j ), 0, 2 );
plot( j => .02 * j + 5 * Math.sin( .01 * j ) * Math.cos( .005 * j ), 10, 4 );
plot( j => Math.exp( .005 * j ), 20, 5 );

makeLine( [ - 30, - 30, - 30, 30, - 30, - 30 ], 3 );
makeLine( [ - 30, - 30, - 30, - 30, 30, - 30 ], 3 );
makeLine( [ - 30, - 30, - 30, - 30, - 30, 30 ], 3 );

function onWindowResize() {

	const w = container.clientWidth;
	const h = container.clientHeight;
	const aspect = w / h;

	camera.left = - frustumSize * aspect / 2;
	camera.right = frustumSize * aspect / 2;
	camera.top = frustumSize / 2;
	camera.bottom = - frustumSize / 2;
	camera.updateProjectionMatrix();

	renderer.setSize( w, h );

}

window.addEventListener( 'resize', onWindowResize );
onWindowResize();

let last = performance.now();

function render( time ) {

	requestAnimationFrame( render );
	controls.update();
	graph.rotation.y += .25 * Math.min( .1, ( time - last ) / 1000 );
	last = time;

	renderer.render( scene, camera );

}

requestAnimationFrame( render );
