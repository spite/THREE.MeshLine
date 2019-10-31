'use strict'

var container = document.getElementById( 'container' );

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );
camera.position.set( 500, 0, 0 );

var renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true });
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
container.appendChild( renderer.domElement );

var controls = new THREE.OrbitControls( camera, renderer.domElement );
var clock = new THREE.Clock();

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

var resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );

init()
render();

var material = new MeshLineMaterial( {
	map: THREE.ImageUtils.loadTexture( 'assets/stroke.png' ),
	useMap: false,
	color: new THREE.Color( colors[ 3 ] ),
	opacity: .5,
	resolution: resolution,
	sizeAttenuation: false,
	lineWidth: 10,
	near: camera.near,
	far: camera.far,
	depthWrite: false,
	depthTest: false,
	transparent: true
});

function makeLine( geo ) {

	var g = new MeshLine();
	g.setGeometry( geo );

	var mesh = new THREE.Mesh( g.geometry, material );
	mesh.position.z += 500;
	mesh.position.y += 300;
	mesh.rotation.y = -Math.PI / 2;
	mesh.rotation.z = Math.PI;
	scene.add( mesh );

	return mesh;

}

function init() {

	readModel().then( collectPoints );

}

function readModel() {

    return new Promise( function( resolve, reject ) {

        var loader = new THREE.OBJLoader();
        loader.load( 'assets/LeePerrySmith.obj', function( res ) {
            resolve( res );
        } )

    });

}

function collectPoints( source ) {

	var total = 0;
	source.children.forEach( function( o ) {
		total += o.geometry.attributes.position.count;
	})
	var g = new THREE.BufferGeometry();
	g.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( total * 3 ), 3 ) );

	var offset = 0;
	source.children.forEach( function( o ) {
		g.merge( o.geometry, offset );
		offset += o.geometry.attributes.position.count;
	})

    g.center( g );
    var scaleMatrix = new THREE.Matrix4();
    scaleMatrix.makeScale( 1000, 1000, 1000 );
    g.applyMatrix( scaleMatrix );

    var o = new THREE.Mesh( g, new THREE.MeshNormalMaterial() );
    scene.add( o );

    var raycaster = new THREE.Raycaster();

    var points = [];

    var y = -200;
    var a = 0;
    var r = 1000;
    var origin = new THREE.Vector3();
    var direction = new THREE.Vector3();
    for( var j = 0; j < 6000; j++ ) {
        a += .1;
        y += .075;
        origin.set( r * Math.cos( a ), y, r * Math.sin( a ) );
        direction.set( -origin.x, 0, -origin.z );
        direction = direction.normalize();
        raycaster.set( origin, direction );

        var i = raycaster.intersectObject( o, true );
        if( i.length ) {
            points.push( i[ 0 ].point.x, i[ 0 ].point.y, i[ 0 ].point.z );
        }
    }

    scene.remove( o );

    var l = new MeshLine();
    l.setGeometry( points, function( p ) { return p } );
    var line = new THREE.Mesh( l.geometry, material );
    scene.add( line );

    document.querySelector( '#title p' ).style.display = 'none';

}

onWindowResize();

function onWindowResize() {

	var w = container.clientWidth;
	var h = container.clientHeight;

	camera.aspect = w / h;
	camera.updateProjectionMatrix();

	renderer.setSize( w, h );

	resolution.set( w, h );

}

window.addEventListener( 'resize', onWindowResize );

function render() {

	requestAnimationFrame( render );
	controls.update();

	renderer.render( scene, camera );

}
