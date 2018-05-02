'use strict'

var container = document.getElementById( 'container' );

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, .1, 1000 );
camera.position.set( 0, 0, -10 );

var renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true });
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
container.appendChild( renderer.domElement );

var controls = new THREE.OrbitControls( camera, renderer.domElement );
var clock = new THREE.Clock();

var lines = [];
var resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );
var strokeTexture;

var Params = function() {
	this.curves = true;
	this.circles = false;
	this.amount = 100;
	this.lineWidth = 10;
	this.dashArray = 0.6;
	this.dashOffset = 0;
	this.dashRatio = 0.5;
	this.taper = 'parabolic';
	this.strokes = false;
	this.sizeAttenuation = false;
	this.animateWidth = false;
	this.spread = false;
	this.autoRotate = true;
	this.autoUpdate = true;
	this.animateVisibility = false;
	this.animateDashOffset = false;
	this.update = function() {
		clearLines();
		createLines();
	}
};

var params = new Params();
var gui = new dat.GUI();

window.addEventListener( 'load', function() {

	function update() {
		if( params.autoUpdate ) {
			clearLines();
			createLines();
		}
	}

	gui.add( params, 'curves' ).onChange( update );
	gui.add( params, 'circles' ).onChange( update );
	gui.add( params, 'amount', 1, 1000 ).onChange( update );
	gui.add( params, 'lineWidth', 1, 20 ).onChange( update );
	gui.add( params, 'dashArray', 0, 3 ).onChange( update );
	gui.add( params, 'dashRatio', 0, 1 ).onChange( update );
	gui.add( params, 'taper', [ 'none', 'linear', 'parabolic', 'wavy' ] ).onChange( update );
	gui.add( params, 'strokes' ).onChange( update );
	gui.add( params, 'sizeAttenuation' ).onChange( update );
	gui.add( params, 'autoUpdate' ).onChange( update );
	gui.add( params, 'update' );
	gui.add( params, 'animateWidth' );
	gui.add( params, 'spread' );
	gui.add( params, 'autoRotate' );
	gui.add( params, 'animateVisibility' );
	gui.add( params, 'animateDashOffset' );

	var loader = new THREE.TextureLoader();
	loader.load( 'assets/stroke.png', function( texture ) {
		strokeTexture = texture;
		init()
	} );

} );

var TAU = 2 * Math.PI;
var hexagonGeometry = new THREE.Geometry();
for( var j = 0; j < TAU - .1; j += TAU / 100 ) {
	var v = new THREE.Vector3();
	v.set( Math.cos( j ), Math.sin( j ), 0 );
	hexagonGeometry.vertices.push( v );
}
hexagonGeometry.vertices.push( hexagonGeometry.vertices[ 0 ].clone() );

function createCurve() {

	var s = new THREE.ConstantSpline();
	var rMin = 5;
	var rMax = 10;
	var origin = new THREE.Vector3( Maf.randomInRange( -rMin, rMin ), Maf.randomInRange( -rMin, rMin ), Maf.randomInRange( -rMin, rMin ) );

	s.inc = .001;
	s.p0 = new THREE.Vector3( .5 - Math.random(), .5 - Math.random(), .5 - Math.random() );
	s.p0.set( 0, 0, 0 );
	s.p1 = s.p0.clone().add( new THREE.Vector3( .5 - Math.random(), .5 - Math.random(), .5 - Math.random() ) );
	s.p2 = s.p1.clone().add( new THREE.Vector3( .5 - Math.random(), .5 - Math.random(), .5 - Math.random() ) );
	s.p3 = s.p2.clone().add( new THREE.Vector3( .5 - Math.random(), .5 - Math.random(), .5 - Math.random() ) );
	s.p0.multiplyScalar( rMin + Math.random() * rMax );
	s.p1.multiplyScalar( rMin + Math.random() * rMax );
	s.p2.multiplyScalar( rMin + Math.random() * rMax );
	s.p3.multiplyScalar( rMin + Math.random() * rMax );

	s.calculate();
	var geometry = new THREE.Geometry();
	s.calculateDistances();
	//s.reticulate( { distancePerStep: .1 });
	s.reticulate( { steps: 500 } );
 	var geometry = new THREE.Geometry();

	for( var j = 0; j < s.lPoints.length - 1; j++ ) {
		geometry.vertices.push( s.lPoints[ j ].clone() );
	}

	return geometry;

}

var colors = [
	0xed6a5a,
	0xf4f1bb,
	0x9bc1bc,
	0x5ca4a9,
	0xe6ebe0,
	0xf0b67f,
	0xfe5f55,
	0xd6d1b1,
	0xc7efcf,
	0xeef5db,
	0x50514f,
	0xf25f5c,
	0xffe066,
	0x247ba0,
	0x70c1b3
];

function clearLines() {

	lines.forEach( function( l ) {
		scene.remove( l );
	} );
	lines = [];

}

function makeLine( geo ) {

	var g = new MeshLine();

	switch( params.taper ) {
		case 'none': g.setGeometry( geo ); break;
		case 'linear': g.setGeometry( geo, function( p ) { return 1 - p; } ); break;
		case 'parabolic': g.setGeometry( geo, function( p ) { return 1 * Maf.parabola( p, 1 )} ); break;
		case 'wavy': g.setGeometry( geo, function( p ) { return 2 + Math.sin( 50 * p ) } ); break;
	}

	var material = new MeshLineMaterial( {
		map: strokeTexture,
		useMap: params.strokes,
		color: new THREE.Color( colors[ ~~Maf.randomInRange( 0, colors.length ) ] ),
		opacity: 1,//params.strokes ? .5 : 1,
		dashArray: params.dashArray,
		dashOffset: params.dashOffset,
		dashRatio: params.dashRatio,
		resolution: resolution,
		sizeAttenuation: params.sizeAttenuation,
		lineWidth: params.lineWidth,
		near: camera.near,
		far: camera.far,
		depthWrite: false,
		depthTest: !params.strokes,
		alphaTest: params.strokes ? .5 : 0,
		transparent: true,
		side: THREE.DoubleSide
	});
	var mesh = new THREE.Mesh( g.geometry, material );
	if( params.spread || params.circles ) {
		var r = 50;
		mesh.position.set( Maf.randomInRange( -r, r ), Maf.randomInRange( -r, r ), Maf.randomInRange( -r, r ) );
		var s = 10 + 10 * Math.random();
		mesh.scale.set( s,s,s );
		mesh.rotation.set( Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI );
	}
	scene.add( mesh );

	lines.push( mesh );

}

function init() {

	createLines();
	onWindowResize();
	render();

}

function createLine() {
	if( params.circles ) makeLine( hexagonGeometry );
	if( params.curves ) makeLine( createCurve() );
	//makeLine( makeVerticalLine() );
	//makeLine( makeSquare() );
}

function createLines() {
	for( var j = 0; j < params.amount; j++ ) {
		createLine();
	}
}

function makeVerticalLine() {
	var g = new THREE.Geometry()
	var x = ( .5 - Math.random() ) * 100;
	g.vertices.push( new THREE.Vector3( x, -10, 0 ) );
	g.vertices.push( new THREE.Vector3( x, 10, 0 ) );
	return g;
}

function makeSquare() {
	var g = new THREE.Geometry()
	var x = ( .5 - Math.random() ) * 100;
	g.vertices.push( new THREE.Vector3( -1, -1, 0 ) );
	g.vertices.push( new THREE.Vector3( 1, -1, 0 ) );
	g.vertices.push( new THREE.Vector3( 1, 1, 0 ) );
	g.vertices.push( new THREE.Vector3( -1, 1, 0 ) );
	g.vertices.push( new THREE.Vector3( -1, -1, 0 ) );
	return g;
}

function onWindowResize() {

	var w = container.clientWidth;
	var h = container.clientHeight;

	camera.aspect = w / h;
	camera.updateProjectionMatrix();

	renderer.setSize( w, h );

	resolution.set( w, h );

}

window.addEventListener( 'resize', onWindowResize );

var tmpVector = new THREE.Vector3();

function render(time) {

	requestAnimationFrame( render );
	controls.update();

	var delta = clock.getDelta();
	var t = clock.getElapsedTime();
	lines.forEach( function( l, i ) {
		if( params.animateWidth ) l.material.uniforms.lineWidth.value = params.lineWidth * ( 1 + .5 * Math.sin( 5 * t + i ) );
		if( params.autoRotate ) l.rotation.y += .125 * delta;
			l.material.uniforms.visibility.value= params.animateVisibility ? (time/3000) % 1.0 : 1.0;
			l.material.uniforms.dashOffset.value -= params.animateDashOffset ? 0.01 : 0;
	} );

	renderer.render( scene, camera );

}
