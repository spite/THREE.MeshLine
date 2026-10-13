import * as THREE from 'three';
import { MeshLine, MeshLineMaterial } from '../../src/THREE.MeshLine.js';
import { colors } from './colors.js';

const container = document.getElementById( 'container' );

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, .1, 1000 );
camera.position.z = - 50;
camera.lookAt( scene.position );

const renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
container.appendChild( renderer.domElement );

const directions = document.getElementById( 'directions' );

const raycaster = new THREE.Raycaster();
const mouse = {};
const nMouse = {};
const meshes = {};
const tmpVector = new THREE.Vector2();
let angle = 0;
let strokeTexture, plane;
let userInteracting = false;

function prepareMesh() {

	const geo = new Float32Array( 200 * 3 );

	const g = new MeshLine();
	g.setPoints( geo, p => p );

	const material = new MeshLineMaterial( {
		useMap: true,
		map: strokeTexture,
		color: colors[ ~ ~ ( Math.random() * colors.length ) ],
		opacity: 1,
		sizeAttenuation: true,
		lineWidth: 5,
		depthTest: false,
		blending: THREE.NormalBlending,
		transparent: true,
		repeat: new THREE.Vector2( 1, 2 )
	} );

	const mesh = new THREE.Mesh( g, material );
	mesh.frustumCulled = false;
	mesh.geo = geo;
	mesh.g = g;

	scene.add( mesh );

	return mesh;

}

function start( id ) {

	if ( meshes[ id ] ) return;

	meshes[ id ] = prepareMesh();
	nMouse[ id ] = new THREE.Vector2();
	mouse[ id ] = new THREE.Vector2();

}

function end( id ) {

	const m = meshes[ id ];
	if ( ! m ) return;

	scene.remove( m );
	m.geometry.dispose();
	m.material.dispose();
	delete meshes[ id ];
	delete nMouse[ id ];
	delete mouse[ id ];

}

function point( id, e ) {

	if ( ! nMouse[ id ] ) return;

	nMouse[ id ].x = ( e.clientX / renderer.domElement.clientWidth ) * 2 - 1;
	nMouse[ id ].y = - ( e.clientY / renderer.domElement.clientHeight ) * 2 + 1;

}

function onMouseDown( e ) {

	directions.style.opacity = 0;
	start( 0 );
	userInteracting = true;
	e.preventDefault();

}

function onMouseEnd( e ) {

	userInteracting = false;
	end( 0 );
	e.preventDefault();

}

function onMouseMove( e ) {

	if ( userInteracting ) point( 0, e );
	e.preventDefault();

}

function onTouchStart( e ) {

	directions.style.opacity = 0;
	for ( const touch of e.touches ) start( touch.identifier );
	e.preventDefault();

}

function onTouchEnd( e ) {

	for ( const touch of e.changedTouches ) end( touch.identifier );
	e.preventDefault();

}

function onTouchMove( e ) {

	for ( const touch of e.changedTouches ) point( touch.identifier, touch );
	e.preventDefault();

}

function checkIntersection( id ) {

	tmpVector.copy( nMouse[ id ] ).sub( mouse[ id ] ).multiplyScalar( .1 );
	mouse[ id ].add( tmpVector );

	raycaster.setFromCamera( mouse[ id ], camera );

	const intersects = raycaster.intersectObject( plane );

	if ( intersects.length > 0 ) {

		const mesh = meshes[ id ];
		const geo = mesh.geo;
		const d = intersects[ 0 ].point.x;

		// every point moves one place towards the start, and away from the centre
		for ( let j = 0; j < geo.length - 3; j += 3 ) {

			geo[ j ] = geo[ j + 3 ] * 1.001;
			geo[ j + 1 ] = geo[ j + 4 ] * 1.001;
			geo[ j + 2 ] = geo[ j + 5 ] * 1.001;

		}

		geo[ geo.length - 3 ] = d * Math.cos( angle );
		geo[ geo.length - 2 ] = intersects[ 0 ].point.y;
		geo[ geo.length - 1 ] = d * Math.sin( angle );

		mesh.g.setPoints( geo );

	}

}

function onWindowResize() {

	const w = container.clientWidth;
	const h = container.clientHeight;

	camera.aspect = w / h;
	camera.updateProjectionMatrix();

	renderer.setSize( w, h );

}

function check() {

	for ( const i in nMouse ) checkIntersection( i );
	setTimeout( check, 20 );

}

function render() {

	requestAnimationFrame( render );

	angle += .05;

	for ( const i in meshes ) meshes[ i ].rotation.y = angle;

	renderer.render( scene, camera );

}

new THREE.TextureLoader().load( 'assets/stroke.png', function ( texture ) {

	strokeTexture = texture;
	strokeTexture.colorSpace = THREE.SRGBColorSpace;
	strokeTexture.wrapS = strokeTexture.wrapT = THREE.RepeatWrapping;

	plane = new THREE.Mesh( new THREE.PlaneGeometry( 1000, 1000 ), new THREE.MeshBasicMaterial( { side: THREE.DoubleSide } ) );
	plane.material.visible = false;
	scene.add( plane );

	const active = { passive: false };
	window.addEventListener( 'mousemove', onMouseMove );
	window.addEventListener( 'touchmove', onTouchMove, active );
	window.addEventListener( 'mousedown', onMouseDown );
	window.addEventListener( 'touchstart', onTouchStart, active );
	window.addEventListener( 'mouseup', onMouseEnd );
	window.addEventListener( 'mouseout', onMouseEnd );
	window.addEventListener( 'touchend', onTouchEnd, active );
	window.addEventListener( 'touchcancel', onTouchEnd, active );
	window.addEventListener( 'resize', onWindowResize );

	onWindowResize();
	check();
	render();

} );
