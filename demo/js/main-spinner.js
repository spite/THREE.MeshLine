'use strict'

var container = document.getElementById( 'container' );

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, .1, 1000 );
camera.position.z = -50;
camera.lookAt( scene.position );

var renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true });
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
container.appendChild( renderer.domElement );

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

var loader = new THREE.TextureLoader();
var strokeTexture;
loader.load( 'assets/stroke.png', function( texture ) { strokeTexture = texture; init(); } );
var resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );

var resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );
var geo = new Float32Array( 100 * 3 );
for( var j = 0; j < geo.length; j += 3 ) {
	geo[ j ] = geo[ j + 1 ] = geo[ j + 2 ] = 0;
}

var g = new THREE.MeshLine();
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var angle = 0;
var mesh, plane;
var material;
var center = new THREE.Vector2( .5, .5 );

function init() {

	g.setGeometry( geo, function( p ) { return p; } );

	material = new THREE.MeshLineMaterial( { 
		useMap: true,
		map: strokeTexture,
		color: new THREE.Color( colors[ ~~Maf.randomInRange( 0, colors.length ) ] ),
		opacity: 1,
		resolution: resolution,
		sizeAttenuation: true,
		lineWidth: 5,
		near: camera.near,
		far: camera.far,
		depthTest: false,
		blending: THREE.AdditiveAlphaBlending,
		transparent: true
	});
	mesh = new THREE.Mesh( g.geometry, material );
	scene.add( mesh );
	
	plane = new THREE.Mesh( new THREE.PlaneBufferGeometry( 1000, 1000 ), new THREE.MeshNormalMaterial( { side: THREE.DoubleSide,  } ) );
	plane.material.visible = false;
	scene.add( plane );

	window.addEventListener( 'mousemove', onMouseMove );
	window.addEventListener( 'touchmove', onTouchMove );
	window.addEventListener( 'click', changeColor );
	window.addEventListener( 'touchstart', changeColor );

	window.addEventListener( 'resize', onWindowResize );

	onWindowResize();
	render();

}

function changeColor() {

	mesh.material.uniforms.color.value = new THREE.Color( colors[ ~~Maf.randomInRange( 0, colors.length ) ] );

}

function onMouseMove ( e ) {

	mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

	checkIntersection();

	e.preventDefault();

}

function onTouchMove ( e ) {

	mouse.x = ( event.touches[ 0 ].clientX / renderer.domElement.clientWidth ) * 2 - 1;
	mouse.y = - ( event.touches[ 0 ].clientY / renderer.domElement.clientHeight ) * 2 + 1;

	checkIntersection();

	e.preventDefault();

}

function checkIntersection() {

	raycaster.setFromCamera( mouse, camera );

	// See if the ray from the camera into the world hits one of our meshes
	var intersects = raycaster.intersectObject( plane );

	// Toggle rotation bool for meshes that we clicked
	if ( intersects.length > 0 ) {

		for( var j = 0; j < geo.length; j+= 3 ) {
			geo[ j ] = geo[ j + 3 ] * 1.01;
			geo[ j + 1 ] = geo[ j + 4 ] * 1.01;
			geo[ j + 2 ] = geo[ j + 5 ] * 1.01;
		}
		var d = intersects[ 0 ].point.x;
		geo[ geo.length - 3 ] = d * Math.cos( angle );
		geo[ geo.length - 2 ] = intersects[ 0 ].point.y;
		geo[ geo.length - 1 ] = d * Math.sin( angle );

		g.setGeometry( geo, function( p ) { return p } );

	}

}

function onWindowResize() {

	var w = container.clientWidth;
	var h = container.clientHeight;

	camera.aspect = w / h;
	camera.updateProjectionMatrix();

	renderer.setSize( w, h );

	resolution.set( w, h );

}

var tmpVector = new THREE.Vector3();

function render() {

	requestAnimationFrame( render );
	
	angle += .05;
	mesh.rotation.y = angle;

	renderer.render( scene, camera );
	//manager.render( scene, camera );

}
