THREE.MeshLine = function() {

	this.positions = [];

	this.previous = [];
	this.next = [];
	this.side = [];
	this.width = [];
	this.indices_array = [];
	this.uvs = [];

	this.geometry = new THREE.BufferGeometry();
	
	this.widthCallback = null;

}

THREE.MeshLine.prototype.setGeometry = function( g, c ) {

	this.widthCallback = c;

	this.positions = [];

	for( var j = 0; j < g.vertices.length; j++ ) {
		var v = g.vertices[ j ];
		this.positions.push( v.x, v.y, v.z );
		this.positions.push( v.x, v.y, v.z );
	}

	this.process();

}

THREE.MeshLine.prototype.compareV3 = function( a, b ) {

	var aa = a * 6;
	var ab = b * 6;
	return ( this.positions[ aa ] === this.positions[ ab ] ) && ( this.positions[ aa + 1 ] === this.positions[ ab + 1 ] ) && ( this.positions[ aa + 2 ] === this.positions[ ab + 2 ] );

}

THREE.MeshLine.prototype.copyV3 = function( a ) {

	var aa = a * 6;
	return [ this.positions[ aa ], this.positions[ aa + 1 ], this.positions[ aa + 2 ] ];

}

THREE.MeshLine.prototype.process = function() {

	var l = this.positions.length / 6;

	this.previous = [];
	this.next = [];
	this.side = [];
	this.width = [];
	this.indices_array = [];
	this.uvs = [];

	for( var j = 0; j < l; j++ ) {
		this.side.push( 1 );
		this.side.push( -1 );
	}

	var w;
	for( var j = 0; j < l; j++ ) {
		if( this.widthCallback ) w = this.widthCallback( j / ( l -1 ) );
		else w = 1;
		this.width.push( w );
		this.width.push( w );
	}

	for( var j = 0; j < l; j++ ) {
		this.uvs.push( j / ( l - 1 ), 0 );
		this.uvs.push( j / ( l - 1 ), 1 );
	}

	var v;

	if( this.compareV3( 0, l - 1 ) ){
		v = this.copyV3( l - 2 );
	} else {
		v = this.copyV3( 0 );
	}
	this.previous.push( v[ 0 ], v[ 1 ], v[ 2 ] );
	this.previous.push( v[ 0 ], v[ 1 ], v[ 2 ] );
	for( var j = 0; j < l - 1; j++ ) {
		v = this.copyV3( j );
		this.previous.push( v[ 0 ], v[ 1 ], v[ 2 ] );
		this.previous.push( v[ 0 ], v[ 1 ], v[ 2 ] );
	}

	for( var j = 1; j < l; j++ ) {	
		v = this.copyV3( j );
		this.next.push( v[ 0 ], v[ 1 ], v[ 2 ] );
		this.next.push( v[ 0 ], v[ 1 ], v[ 2 ] );
	}

	if( this.compareV3( l - 1, 0 ) ){
		v = this.copyV3( 1 );
	} else {
		v = this.copyV3( l - 1 );
	}
	this.next.push( v[ 0 ], v[ 1 ], v[ 2 ] );
	this.next.push( v[ 0 ], v[ 1 ], v[ 2 ] );

	for( var j = 0; j < l - 1; j++ ) {
		var n = j * 2;
		this.indices_array.push( n, n + 1, n + 2 );
		this.indices_array.push( n + 2, n + 1, n + 3 );
	}

	this.attributes = {
		position: new THREE.BufferAttribute( new Float32Array( this.positions ), 3 ),
		previous: new THREE.BufferAttribute( new Float32Array( this.previous ), 3 ),
		next: new THREE.BufferAttribute( new Float32Array( this.next ), 3 ),
		side: new THREE.BufferAttribute( new Float32Array( this.side ), 1 ),
		width: new THREE.BufferAttribute( new Float32Array( this.width ), 1 ),
		uv: new THREE.BufferAttribute( new Float32Array( this.uvs ), 2 ),
		index: new THREE.BufferAttribute( new Uint16Array( this.indices_array ), 1 )
	}

	this.geometry.addAttribute( 'position', this.attributes.position );
	this.geometry.addAttribute( 'previous', this.attributes.previous );
	this.geometry.addAttribute( 'next', this.attributes.next );
	this.geometry.addAttribute( 'side', this.attributes.side );
	this.geometry.addAttribute( 'width', this.attributes.width );
	this.geometry.addAttribute( 'uv', this.attributes.uv );

	this.geometry.setIndex( this.attributes.index );

}

THREE.MeshLineMaterial = function() {

	this.material = new THREE.RawShaderMaterial( { 
		uniforms:{
			lineWidth: { type: 'f', value: 1 },
			map: { type: 't', value: strokeTexture },
			useMap: { type: 'f', value: 0 },
			color: { type: 'c', value: new THREE.Color( colors[ ~~Maf.randomInRange( 0, colors.length ) ] ) },
			resolution: { type: 'v2', value: resolution },
			sizeAttenuation: { type: 'f', value: 1 },
			near: { type: 'f', value: camera.near },
			far: { type: 'f', value: camera.far }	
		},
		vertexShader: document.getElementById( 'vs-line' ).textContent,
		fragmentShader: document.getElementById( 'fs-line' ).textContent,
		/*side: THREE.DoubleSide,
		transparent: true,
		depthTest: false,
		blending: THREE.AdditiveAlphaBlending*/
	});

}

THREE.MeshLineMaterial = function ( parameters ) {

	THREE.Material.call( this );

	var material = new THREE.RawShaderMaterial( { 
		uniforms:{
			lineWidth: { type: 'f', value: 1 },
			map: { type: 't', value: parameters.uniforms.map },
			useMap: { type: 'f', value: 0 },
			color: { type: 'c', value: new THREE.Color( colors[ ~~Maf.randomInRange( 0, colors.length ) ] ) },
			resolution: { type: 'v2', value: resolution },
			sizeAttenuation: { type: 'f', value: 1 },
			near: { type: 'f', value: camera.near },
			far: { type: 'f', value: camera.far }	
		},
		vertexShader: document.getElementById( 'vs-line' ).textContent,
		fragmentShader: document.getElementById( 'fs-line' ).textContent
	});

	material.type = 'MeshLineMaterial';

/*	this.color = new THREE.Color( 0xffffff );

	this.linewidth = 1;
	this.linecap = 'round';
	this.linejoin = 'round';

	this.vertexColors = THREE.NoColors;

	this.fog = true;*/

	delete parameters.uniforms;

	material.setValues( parameters );

	return material;

};

THREE.MeshLineMaterial.prototype = Object.create( THREE.Material.prototype );
THREE.MeshLineMaterial.prototype.constructor = THREE.MeshLineMaterial;

THREE.MeshLineMaterial.prototype.copy = function ( source ) {

	THREE.Material.prototype.copy.call( this, source );

	this.color.copy( source.color );

	this.linewidth = source.linewidth;
	this.linecap = source.linecap;
	this.linejoin = source.linejoin;

	this.vertexColors = source.vertexColors;

	this.fog = source.fog;

	return this;

};