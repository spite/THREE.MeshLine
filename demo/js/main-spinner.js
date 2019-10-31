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

var directions = document.getElementById( 'directions' );

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
loader.load( 'assets/stroke.png', function( texture ) {
	strokeTexture = texture;
	strokeTexture.wrapS = strokeTexture.wrapT = THREE.RepeatWrapping;
	init(); } );
var resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );

var resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );
var geo = [];

var raycaster = new THREE.Raycaster();
var mouse = {};
var nMouse = {};
var tmpVector = new THREE.Vector2();
var angle = 0;
var meshes = {}, plane;
var material;
var center = new THREE.Vector2( .5, .5 );

function prepareMesh() {

	var geo = new Float32Array( 200 * 3 );
	for( var j = 0; j < geo.length; j += 3 ) {
		geo[ j ] = geo[ j + 1 ] = geo[ j + 2 ] = 0;
	}

	var g = new MeshLine();
	g.setGeometry( geo, function( p ) { return p; } );

	material = new MeshLineMaterial( {
		useMap: true,
		map: strokeTexture,
		color: new THREE.Color( new THREE.Color( colors[ ~~Maf.randomInRange( 0, colors.length ) ] ) ),
		opacity: 1,
		resolution: resolution,
		sizeAttenuation: true,
		lineWidth: 5,
		near: camera.near,
		far: camera.far,
		depthTest: false,
		blending: THREE.NormalBlending,
		transparent: true,
		repeat: new THREE.Vector2( 1,2 )
	});

	var mesh = new THREE.Mesh( g.geometry, material );
	mesh.geo = geo;
	mesh.g = g;

	scene.add( mesh );

	return mesh;

}

function init() {

	plane = new THREE.Mesh( new THREE.PlaneBufferGeometry( 1000, 1000 ), new THREE.MeshNormalMaterial( { side: THREE.DoubleSide,  } ) );
	plane.material.visible = false;
	scene.add( plane );

	window.addEventListener( 'mousemove', onMouseMove );
	window.addEventListener( 'touchmove', onTouchMove );
	window.addEventListener( 'mousedown', onMouseDown );
	window.addEventListener( 'touchstart', onTouchStart );
	window.addEventListener( 'mouseup', onMouseEnd );
	window.addEventListener( 'mouseout', onMouseEnd );
	window.addEventListener( 'touchend', onTouchEnd );
	window.addEventListener( 'touchcancel', onTouchEnd );

	window.addEventListener( 'resize', onWindowResize );

	onWindowResize();
	render();

}

var userInteracting = false;

function onMouseDown( e ) {

	directions.style.opacity = 0;

	if( !meshes[ 0 ] ) {
		meshes[ 0 ] = prepareMesh();
		nMouse[ 0 ] = new THREE.Vector2();
		mouse[ 0 ] = new THREE.Vector2();
	}

	userInteracting = true;

	e.preventDefault();

}

function onMouseEnd( e ) {

	userInteracting = false;

	var id = 0;
	var m = meshes[ id ];
	scene.remove( m );
	delete meshes[ id ];
	delete nMouse[ id ];
	delete mouse[ id ];

	e.preventDefault();

}

function onTouchStart( e ) {

	directions.style.opacity = 0;

	for( var j = 0; j < e.touches.length; j++ ) {
		if( !meshes[ e.touches[ j ].identifier ] ) {
			meshes[ e.touches[ j ].identifier ] = prepareMesh();
			nMouse[ e.touches[ j ].identifier ] = new THREE.Vector2();
			mouse[ e.touches[ j ].identifier ] = new THREE.Vector2();
		}
	}

	e.preventDefault();

}

function onTouchEnd( e ) {

	userInteracting = false;

	for( var j = 0; j < e.changedTouches.length; j++ ) {
		var id = e.changedTouches[ j ].identifier;
		var m = meshes[ id ];
		scene.remove( m );
		delete meshes[ id ];
		delete nMouse[ id ];
		delete mouse[ id ];
	}

	e.preventDefault();

}

function onMouseMove ( e ) {

	if( userInteracting ) {

		nMouse[ 0 ].x = ( e.clientX / renderer.domElement.clientWidth ) * 2 - 1;
		nMouse[ 0 ].y = - ( e.clientY / renderer.domElement.clientHeight ) * 2 + 1;

		//checkIntersection( 0 );

	}

	e.preventDefault();

}

function onTouchMove ( e ) {

	for( var j = 0; j < e.changedTouches.length; j++ ) {
		nMouse[ e.changedTouches[ j ].identifier ].x = ( e.changedTouches[ j ].clientX / renderer.domElement.clientWidth ) * 2 - 1;
		nMouse[ e.changedTouches[ j ].identifier ].y = - ( e.changedTouches[ j ].clientY / renderer.domElement.clientHeight ) * 2 + 1;
		//checkIntersection( e.changedTouches[ j ].identifier );
	}

	e.preventDefault();

}

function checkIntersection( id ) {

	tmpVector.copy( nMouse[ id ] ).sub( mouse[ id ] ).multiplyScalar( .1 );
	Maf.clamp( tmpVector.x, -1, 1 );
	Maf.clamp( tmpVector.y, -1, 1 );

	mouse[ id ].add( tmpVector );

	raycaster.setFromCamera( mouse[ id ], camera );

	// See if the ray from the camera into the world hits one of our meshes
	var intersects = raycaster.intersectObject( plane );

	// Toggle rotation bool for meshes that we clicked
	if ( intersects.length > 0 ) {

		var mesh = meshes[ id ];
		var geo = mesh.geo;
		var g = mesh.g;

		var d = intersects[ 0 ].point.x;

		for( var j = 0; j < geo.length; j+= 3 ) {
			geo[ j ] = geo[ j + 3 ] * 1.001;
			geo[ j + 1 ] = geo[ j + 4 ] * 1.001;
			geo[ j + 2 ] = geo[ j + 5 ] * 1.001;
		}

		geo[ geo.length - 3 ] = d * Math.cos( angle );
		geo[ geo.length - 2 ] = intersects[ 0 ].point.y;
		geo[ geo.length - 1 ] = d * Math.sin( angle );

		g.setGeometry( geo );

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

function check() {

	for( var i in nMouse ) { checkIntersection( i ); }
	setTimeout( check, 20 );

}
check();

function render() {

	requestAnimationFrame( render );

	angle += .05;

	for( var i in meshes ) {
      var mesh = meshes[ i ];
      mesh.rotation.y = angle;
    }

	/*for( var i in meshes ) {
		var geo = meshes[ i ].geo;
		for( var j = 0; j < geo.length; j+= 3 ) {
			geo[ j ] *= 1.01;
			geo[ j + 1 ] *= 1.01;
			geo[ j + 2 ] *= 1.01;
		}
		meshes[ i ].g.setGeometry( geo );
	}*/

	renderer.render( scene, camera );

}
