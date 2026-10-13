import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
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

const material = new MeshLineMaterial( {
	color: colors[ 3 ],
	opacity: .5,
	sizeAttenuation: false,
	lineWidth: 5,
	depthWrite: false,
	depthTest: false,
	transparent: true
} );

new OBJLoader().load( 'assets/LeePerrySmith.obj', collectPoints );

function collectPoints( source ) {

	// the model centred and 1000 times bigger
	const centre = new THREE.Box3().setFromObject( source ).getCenter( new THREE.Vector3() );
	source.scale.setScalar( 1000 );
	source.position.copy( centre ).multiplyScalar( - 1000 );
	source.updateMatrixWorld( true );

	const raycaster = new THREE.Raycaster();

	const points = [];

	let y = - 200;
	let a = 0;
	const r = 1000;
	const origin = new THREE.Vector3();
	const direction = new THREE.Vector3();

	// a spiral around the model, cast towards its axis
	for ( let j = 0; j < 6000; j ++ ) {

		a += .1;
		y += .075;
		origin.set( r * Math.cos( a ), y, r * Math.sin( a ) );
		direction.set( - origin.x, 0, - origin.z ).normalize();
		raycaster.set( origin, direction );

		const i = raycaster.intersectObject( source, true );
		if ( i.length ) points.push( i[ 0 ].point.x, i[ 0 ].point.y, i[ 0 ].point.z );

	}

	const l = new MeshLine();
	l.setPoints( points, p => p );
	scene.add( new THREE.Mesh( l, material ) );

	document.querySelector( '#title p' ).style.display = 'none';

}

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
