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
var svg = new THREE.Object3D();
scene.add( svg );

init()
render();

var material = new MeshLineMaterial( {
	map: THREE.ImageUtils.loadTexture( 'assets/stroke.png' ),
	useMap: false,
	color: new THREE.Color( colors[ 3 ] ),
	opacity: 1,
	resolution: resolution,
	sizeAttenuation: false,
	lineWidth: 1,
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

	readSVG().then( drawSVG );

}

function readSVG() {

	return new Promise( function( resolve, reject ) {
		var ajax = new XMLHttpRequest();
		ajax.open("GET", "assets/worldLow.svg", true);
		ajax.send();
		ajax.addEventListener( 'load', function(e) {
			resolve( ajax.responseText );
		} );
	});

}

function drawSVG( source ) {

	var lines = [];
    var parser = new DOMParser();
    var doc = parser.parseFromString( source, "image/svg+xml");

    var pathNodes = doc.querySelectorAll('path');
    [].forEach.call( pathNodes, function( p ) {

    	if( p instanceof SVGPathElement && p.pathSegList ) {

    		var line = new THREE.Geometry();
    		var vertices = line.vertices;
    		var x, y;
    		var ox, oy;
    		var px, py;

            var segments = p.pathSegList;
            for( var i = 0; i < segments.numberOfItems; i++ ) {

                var segment = segments.getItem( i );

                var types = [ SVGPathSegMovetoAbs, SVGPathSegLinetoRel, SVGPathSegLinetoVerticalRel, SVGPathSegLinetoHorizontalRel, SVGPathSegLinetoHorizontalAbs, SVGPathSegLinetoVerticalAbs, SVGPathSegClosePath, SVGPathSegLinetoAbs ];
                var found = false;
                types.forEach( function( t ) {
                    if( segment instanceof t ) {
                        found = true;
                    }
                } );
                if( !found ) {
                    console.log( segment );
                }

                if( segment instanceof SVGPathSegMovetoAbs ) {
                    x = segment.x;
                    y = segment.y;
                    ox = x;
                    oy = y;
                    // add line;
    				lines.push( line );
    				line = new THREE.Geometry();
                    line.vertices.push( new THREE.Vector3( x, y, 0 ) );
                }
                if( segment instanceof SVGPathSegLinetoRel ) {
                    x = px + segment.x;
                    y = py + segment.y;
                    line.vertices.push( new THREE.Vector3( x, y, 0 ) );
                }
                if( segment instanceof SVGPathSegLinetoAbs ) {
                    x = segment.x;
                    y = segment.y;
                    line.vertices.push( new THREE.Vector3( x, y, 0 ) );
                }
                if( segment instanceof SVGPathSegLinetoVerticalRel ) {
                    x = px;
                    y = py + segment.y;
                    line.vertices.push( new THREE.Vector3( x, y, 0 ) );
                }
                if( segment instanceof SVGPathSegLinetoHorizontalRel ) {
                    x = px + segment.x;
                    y = py;
                    line.vertices.push( new THREE.Vector3( x, y, 0 ) );
                }
                if( segment instanceof SVGPathSegLinetoHorizontalAbs ) {
                    x = segment.x;
                    y = py;
                    line.vertices.push( new THREE.Vector3( x, y, 0 ) );
                }
                if( segment instanceof SVGPathSegLinetoVerticalAbs ) {
                    x = px;
                    y = segment.y;
                    line.vertices.push( new THREE.Vector3( x, y, 0 ) );
                }
                if( segment instanceof SVGPathSegClosePath ) {
                    x = ox;
                    y = oy;
                    line.vertices.push( new THREE.Vector3( x, y, 0 ) );
                    // add line
    				lines.push( line );
    				line = new THREE.Geometry();
                }

                px = x;
                py = y;

            }

    	}

    } );

	lines.forEach( function( l ) {
		makeLine( l );
	})

}

function addLine( line ) {

	console.log( line );

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
