function prepareGeometry( g ) {

	var geometry = new THREE.BufferGeometry();

	var positions = [];
	var previous = [];
	var next = [];
	var side = [];
	var width = [];
	var indices_array = [];
	var uvs = [];

	for( var j = 0; j < g.vertices.length; j++ ) {
		var v = g.vertices[ j ];
		positions.push( v.x, v.y, v.z );
		positions.push( v.x, v.y, v.z );
		side.push( 1 );
		side.push( -1 );
		var w = 1 - j / ( g.vertices.length );
		w = 1 * Maf.parabola( w, 2 );
		//w = 1;
		//w = Maf.smoothStep( 0, 1, j );
		width.push( w );
		width.push( w );
		uvs.push( j / g.vertices.length, 0 );
		uvs.push( j / g.vertices.length, 1 );
	}

	var v = g.vertices[ 0 ];
	if( v.equals( g.vertices[ g.vertices.length - 1 ] ) ){
		v = g.vertices[ g.vertices.length - 2 ];
	}
	previous.push( v.x, v.y, v.z );
	previous.push( v.x, v.y, v.z );
	for( var j = 0; j < g.vertices.length - 1; j++ ) {
		var v = g.vertices[ j ];
		previous.push( v.x, v.y, v.z );
		previous.push( v.x, v.y, v.z );
	}

	for( var j = 1; j < g.vertices.length; j++ ) {
		var v = g.vertices[ j ];
		next.push( v.x, v.y, v.z );
		next.push( v.x, v.y, v.z );
	}
	var v = g.vertices[ g.vertices.length - 1 ];
	if( v.equals( g.vertices[ 0 ] ) ){
		v = g.vertices[ 1 ];
	}
	next.push( v.x, v.y, v.z );
	next.push( v.x, v.y, v.z );

	for( var j = 0; j < g.vertices.length - 1; j++ ) {
		var n = j * 2;
		indices_array.push( n, n + 1, n + 2 );
		indices_array.push( n + 2, n + 1, n + 3 );
	}

	geometry.setIndex( new THREE.BufferAttribute( new Uint16Array( indices_array ), 1 ) );
	geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( positions ), 3 ) );
	geometry.addAttribute( 'previous', new THREE.BufferAttribute( new Float32Array( previous ), 3 ) );
	geometry.addAttribute( 'next', new THREE.BufferAttribute( new Float32Array( next ), 3 ) );
	geometry.addAttribute( 'side', new THREE.BufferAttribute( new Float32Array( side ), 1 ) );
	geometry.addAttribute( 'width', new THREE.BufferAttribute( new Float32Array( width ), 1 ) );
	geometry.addAttribute( 'uv', new THREE.BufferAttribute( new Float32Array( uvs ), 2 ) );
	return geometry;

}