import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI, signal, effect } from 'https://cdn.jsdelivr.net/npm/guspira@0.2.0/dist/guspira.min.js';
import { MeshLine, MeshLineMaterial } from '../../src/THREE.MeshLine.js';
import { ConstantSpline } from './ConstantSpline.js';
import { colors } from './colors.js';

const container = document.getElementById( 'container' );

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, .1, 1000 );
camera.position.set( 0, 0, - 10 );

const renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
container.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );

let lines = [];
let strokeTexture;

const params = {
	curves: signal( true ),
	circles: signal( false ),
	amount: signal( 100 ),
	lineWidth: signal( 5 ),
	dashArray: signal( 0.6 ),
	dashRatio: signal( 0.5 ),
	taper: signal( 'parabolic' ),
	strokes: signal( false ),
	sizeAttenuation: signal( false ),
	autoUpdate: signal( true ),
	animateWidth: signal( false ),
	spread: signal( false ),
	autoRotate: signal( true ),
	animateVisibility: signal( false ),
	animateDashOffset: signal( false )
};

function rebuild() {

	clearLines();
	createLines();

}

const gui = new GUI( 'Controls', document.getElementById( 'gui-container' ) );
gui.addCheckbox( 'curves', params.curves );
gui.addCheckbox( 'circles', params.circles );
gui.addSlider( 'amount', params.amount, 1, 1000, 1 );
gui.addSlider( 'lineWidth', params.lineWidth, 1, 20, .1 );
gui.addSlider( 'dashArray', params.dashArray, 0, 3, .01 );
gui.addSlider( 'dashRatio', params.dashRatio, 0, 1, .01 );
gui.addSelect( 'taper', params.taper, [ 'none', 'linear', 'parabolic', 'wavy' ] );
gui.addCheckbox( 'strokes', params.strokes );
gui.addCheckbox( 'sizeAttenuation', params.sizeAttenuation );
gui.addCheckbox( 'autoUpdate', params.autoUpdate );
gui.addButton( 'update', rebuild );
gui.addCheckbox( 'animateWidth', params.animateWidth );
gui.addCheckbox( 'spread', params.spread );
gui.addCheckbox( 'autoRotate', params.autoRotate );
gui.addCheckbox( 'animateVisibility', params.animateVisibility );
gui.addCheckbox( 'animateDashOffset', params.animateDashOffset );

const TAU = 2 * Math.PI;
const circle = [];
for ( let j = 0; j < TAU - .1; j += TAU / 100 ) {

	circle.push( new THREE.Vector3( Math.cos( j ), Math.sin( j ), 0 ) );

}

circle.push( circle[ 0 ].clone() );

const randomInRange = ( min, max ) => min + Math.random() * ( max - min );
const parabola = ( x, k ) => Math.pow( 4 * x * ( 1 - x ), k );
const randomVector = () => new THREE.Vector3( .5 - Math.random(), .5 - Math.random(), .5 - Math.random() );

function createCurve() {

	const s = new ConstantSpline();
	const rMin = 5;
	const rMax = 10;

	s.inc = .001;
	s.p0.set( 0, 0, 0 );
	s.p1 = s.p0.clone().add( randomVector() );
	s.p2 = s.p1.clone().add( randomVector() );
	s.p3 = s.p2.clone().add( randomVector() );
	s.p0.multiplyScalar( rMin + Math.random() * rMax );
	s.p1.multiplyScalar( rMin + Math.random() * rMax );
	s.p2.multiplyScalar( rMin + Math.random() * rMax );
	s.p3.multiplyScalar( rMin + Math.random() * rMax );

	s.calculate();
	s.calculateDistances();
	s.reticulate( { steps: 500 } );

	return s.lPoints.slice( 0, - 1 );

}

function clearLines() {

	lines.forEach( function ( l ) {

		scene.remove( l );
		l.geometry.dispose();
		l.material.dispose();

	} );
	lines = [];

}

function makeLine( points ) {

	const g = new MeshLine();

	switch ( params.taper() ) {

		case 'none': g.setPoints( points ); break;
		case 'linear': g.setPoints( points, p => 1 - p ); break;
		case 'parabolic': g.setPoints( points, p => parabola( p, 1 ) ); break;
		case 'wavy': g.setPoints( points, p => 2 + Math.sin( 50 * p ) ); break;

	}

	const strokes = params.strokes();

	const material = new MeshLineMaterial( {
		map: strokeTexture,
		useMap: strokes,
		color: colors[ ~ ~ randomInRange( 0, colors.length ) ],
		opacity: 1,
		dashArray: params.dashArray(),
		dashRatio: params.dashRatio(),
		sizeAttenuation: params.sizeAttenuation(),
		lineWidth: params.lineWidth(),
		depthWrite: false,
		depthTest: ! strokes,
		alphaTest: strokes ? .5 : 0,
		transparent: true,
		side: THREE.DoubleSide
	} );

	const mesh = new THREE.Mesh( g, material );

	if ( params.spread() || params.circles() ) {

		const r = 50;
		mesh.position.set( randomInRange( - r, r ), randomInRange( - r, r ), randomInRange( - r, r ) );
		const s = 10 + 10 * Math.random();
		mesh.scale.set( s, s, s );
		mesh.rotation.set( Math.random() * TAU, Math.random() * TAU, Math.random() * TAU );

	}

	scene.add( mesh );
	lines.push( mesh );

}

function createLines() {

	for ( let j = 0; j < params.amount(); j ++ ) {

		if ( params.circles() ) makeLine( circle );
		if ( params.curves() ) makeLine( createCurve() );

	}

}

function onWindowResize() {

	const w = container.clientWidth;
	const h = container.clientHeight;

	camera.aspect = w / h;
	camera.updateProjectionMatrix();

	renderer.setSize( w, h );

}

window.addEventListener( 'resize', onWindowResize );

let last = performance.now();

function render( time ) {

	requestAnimationFrame( render );
	controls.update();

	const delta = Math.min( .1, ( time - last ) / 1000 );
	const t = time / 1000;
	last = time;

	lines.forEach( function ( l, i ) {

		if ( params.animateWidth() ) l.material.lineWidth = params.lineWidth() * ( 1 + .5 * Math.sin( 5 * t + i ) );
		if ( params.autoRotate() ) l.rotation.y += .125 * delta;
		l.material.visibility = params.animateVisibility() ? ( time / 3000 ) % 1.0 : 1.0;
		if ( params.animateDashOffset() ) l.material.dashOffset -= 0.01;

	} );

	renderer.render( scene, camera );

}

new THREE.TextureLoader().load( 'assets/stroke.png', function ( texture ) {

	texture.colorSpace = THREE.SRGBColorSpace;
	strokeTexture = texture;

	// the lines are made again when any of the settings they are built from changes
	let first = true;
	effect( () => {

		const settings = [ params.curves(), params.circles(), params.amount(), params.lineWidth(), params.dashArray(), params.dashRatio(), params.taper(), params.strokes(), params.sizeAttenuation(), params.spread() ];

		if ( first || params.autoUpdate() ) rebuild( settings );
		first = false;

	} );

	onWindowResize();
	requestAnimationFrame( render );

} );
