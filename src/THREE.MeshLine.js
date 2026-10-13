import {
	BufferAttribute,
	BufferGeometry,
	Color,
	Matrix4,
	Ray,
	ShaderMaterial,
	Sphere,
	UniformsLib,
	UniformsUtils,
	Vector2,
	Vector3
} from 'three';

class MeshLine extends BufferGeometry {

	constructor() {

		super();

		this.isMeshLine = true;
		this.type = 'MeshLine';

		this.positions = [];
		this.previous = [];
		this.next = [];
		this.side = [];
		this.width = [];
		this.indices_array = [];
		this.uvs = [];
		this.counters = [];

		this._points = [];
		this._geometry = null;
		this._attributes = null;

		this.widthCallback = null;

		this.matrixWorld = new Matrix4();

	}

	// a MeshLine is the geometry, this is here for the code that asks for it
	get geometry() {

		return this;

	}

	get geom() {

		return this._geometry;

	}

	set geom( value ) {

		this.setGeometry( value, this.widthCallback );

	}

	get points() {

		return this._points;

	}

	set points( value ) {

		this.setPoints( value, this.widthCallback );

	}

	setMatrixWorld( matrixWorld ) {

		this.matrixWorld = matrixWorld;

	}

	setGeometry( g, c ) {

		if ( g && g.isBufferGeometry ) {

			this._geometry = g;
			this.setPoints( g.getAttribute( 'position' ), c );

		} else {

			this.setPoints( g, c );

		}

	}

	setPoints( points, wcb ) {

		let count, read;

		if ( points && points.isBufferAttribute ) {

			count = points.count;
			read = ( j, target, offset ) => {

				target[ offset ] = points.getX( j );
				target[ offset + 1 ] = points.getY( j );
				target[ offset + 2 ] = points.getZ( j );

			};

		} else if ( Array.isArray( points ) && points.length > 0 && typeof points[ 0 ] !== 'number' ) {

			count = points.length;
			read = ( j, target, offset ) => {

				target[ offset ] = points[ j ].x;
				target[ offset + 1 ] = points[ j ].y;
				target[ offset + 2 ] = points[ j ].z || 0;

			};

		} else if ( Array.isArray( points ) || ArrayBuffer.isView( points ) ) {

			count = Math.floor( points.length / 3 );
			read = ( j, target, offset ) => {

				target[ offset ] = points[ j * 3 ];
				target[ offset + 1 ] = points[ j * 3 + 1 ];
				target[ offset + 2 ] = points[ j * 3 + 2 ];

			};

		} else {

			throw new TypeError( 'THREE.MeshLine: points must be an array of numbers, an array of vectors, a typed array, a BufferAttribute or a BufferGeometry' );

		}

		this._points = points;
		this.widthCallback = wcb;

		// every point is there twice, one vertex for each side of the line
		const positions = new Float32Array( count * 6 );
		const counters = new Float32Array( count * 2 );

		for ( let j = 0; j < count; j ++ ) {

			read( j, positions, j * 6 );
			positions.copyWithin( j * 6 + 3, j * 6, j * 6 + 3 );

			counters[ j * 2 ] = counters[ j * 2 + 1 ] = j / count;

		}

		this.positions = positions;
		this.counters = counters;

		this.process();

	}

	compareV3( a, b ) {

		const aa = a * 6;
		const ab = b * 6;

		return (
			this.positions[ aa ] === this.positions[ ab ] &&
			this.positions[ aa + 1 ] === this.positions[ ab + 1 ] &&
			this.positions[ aa + 2 ] === this.positions[ ab + 2 ]
		);

	}

	copyV3( a ) {

		const aa = a * 6;

		return [ this.positions[ aa ], this.positions[ aa + 1 ], this.positions[ aa + 2 ] ];

	}

	process() {

		const positions = this.positions;
		const l = positions.length / 6;

		const previous = new Float32Array( l * 6 );
		const next = new Float32Array( l * 6 );
		const side = new Float32Array( l * 2 );
		const width = new Float32Array( l * 2 );
		const uvs = new Float32Array( l * 4 );
		const indices = new ( l * 2 > 65535 ? Uint32Array : Uint16Array )( Math.max( 0, l - 1 ) * 6 );

		// a line that ends where it starts is closed, so its ends know about each other
		const closed = l > 2 && this.compareV3( 0, l - 1 );

		for ( let j = 0; j < l; j ++ ) {

			const p = l > 1 ? j / ( l - 1 ) : 0;
			const w = this.widthCallback ? this.widthCallback( p ) : 1;

			side[ j * 2 ] = 1;
			side[ j * 2 + 1 ] = - 1;

			width[ j * 2 ] = width[ j * 2 + 1 ] = w;

			uvs[ j * 4 ] = uvs[ j * 4 + 2 ] = p;
			uvs[ j * 4 + 1 ] = 0;
			uvs[ j * 4 + 3 ] = 1;

			const before = j > 0 ? j - 1 : ( closed ? l - 2 : 0 );
			const after = j < l - 1 ? j + 1 : ( closed ? 1 : l - 1 );

			previous.set( positions.subarray( before * 6, before * 6 + 6 ), j * 6 );
			next.set( positions.subarray( after * 6, after * 6 + 6 ), j * 6 );

			if ( j < l - 1 ) {

				const n = j * 2;
				indices.set( [ n, n + 1, n + 2, n + 2, n + 1, n + 3 ], j * 6 );

			}

		}

		this.previous = previous;
		this.next = next;
		this.side = side;
		this.width = width;
		this.uvs = uvs;
		this.indices_array = indices;

		const attributes = this._attributes;

		if ( attributes && attributes.position.count === l * 2 ) {

			// same number of points: the buffers are kept and filled again
			attributes.position.array.set( positions );
			attributes.previous.array.set( previous );
			attributes.next.array.set( next );
			attributes.side.array.set( side );
			attributes.width.array.set( width );
			attributes.uv.array.set( uvs );
			attributes.counters.array.set( this.counters );

			for ( const name in attributes ) attributes[ name ].needsUpdate = true;

		} else {

			// the buffers of the size it had are released, they can't be resized
			if ( attributes ) this.dispose();

			this._attributes = {
				position: new BufferAttribute( positions, 3 ),
				previous: new BufferAttribute( previous, 3 ),
				next: new BufferAttribute( next, 3 ),
				side: new BufferAttribute( side, 1 ),
				width: new BufferAttribute( width, 1 ),
				uv: new BufferAttribute( uvs, 2 ),
				counters: new BufferAttribute( this.counters, 1 ),
				index: new BufferAttribute( indices, 1 )
			};

			this.setAttribute( 'position', this._attributes.position );
			this.setAttribute( 'previous', this._attributes.previous );
			this.setAttribute( 'next', this._attributes.next );
			this.setAttribute( 'side', this._attributes.side );
			this.setAttribute( 'width', this._attributes.width );
			this.setAttribute( 'uv', this._attributes.uv );
			this.setAttribute( 'counters', this._attributes.counters );

			this.setIndex( this._attributes.index );

		}

		this.computeBoundingSphere();
		this.computeBoundingBox();

	}

	// moves the line one point forward: the oldest point goes, the given position is the new end
	advance( position ) {

		const positions = this._attributes.position.array;
		const previous = this._attributes.previous.array;
		const next = this._attributes.next.array;
		const l = positions.length;

		previous.set( positions );

		positions.copyWithin( 0, 6 );

		positions[ l - 6 ] = positions[ l - 3 ] = position.x;
		positions[ l - 5 ] = positions[ l - 2 ] = position.y;
		positions[ l - 4 ] = positions[ l - 1 ] = position.z;

		next.set( positions.subarray( 6 ) );
		next.set( positions.subarray( l - 6 ), l - 6 );

		this._attributes.position.needsUpdate = true;
		this._attributes.previous.needsUpdate = true;
		this._attributes.next.needsUpdate = true;

		// computed again when something asks for them
		this.boundingSphere = null;
		this.boundingBox = null;

	}

}

const _inverseMatrix = new Matrix4();
const _ray = new Ray();
const _sphere = new Sphere();
const _start = new Vector3();
const _end = new Vector3();
const _onRay = new Vector3();
const _onSegment = new Vector3();
const _closest = new Vector3();
const _scale = new Vector3();
const _view = new Vector3();

// assign it to the raycast of the mesh that uses a MeshLine: mesh.raycast = MeshLineRaycast
function MeshLineRaycast( raycaster, intersects ) {

	const geometry = this.geometry;
	const material = this.material;
	const position = geometry.attributes.position;

	if ( ! position || position.count < 4 ) return;

	const widths = geometry.attributes.width.array;
	const count = position.count / 2;
	const threshold = raycaster.params.Line ? raycaster.params.Line.threshold : 0;

	const lineWidth = material.lineWidth !== undefined ? material.lineWidth : 1;
	const sizeAttenuation = material.sizeAttenuation === undefined || Number( material.sizeAttenuation ) !== 0;

	let widest = 0;

	for ( let i = 0; i < widths.length; i += 2 ) widest = Math.max( widest, Math.abs( widths[ i ] ) );

	// how many world units a pixel is, at a distance, for the lines that have their width in pixels
	const camera = raycaster.camera;
	const width = material.resolution ? material.resolution.x : 1;
	const height = material.resolution ? material.resolution.y : 1;
	const inPixels = ! sizeAttenuation && camera !== undefined && camera !== null;

	function unitsPerPixel( distance ) {

		if ( ! camera ) return 0;
		if ( camera.isOrthographicCamera ) return ( camera.top - camera.bottom ) / camera.zoom / height;

		return 2 * distance * Math.tan( camera.fov * Math.PI / 360 ) / camera.zoom / height;

	}

	if ( geometry.boundingSphere === null ) geometry.computeBoundingSphere();

	_sphere.copy( geometry.boundingSphere ).applyMatrix4( this.matrixWorld );

	const reach = sizeAttenuation ? lineWidth * widest / 2 : unitsPerPixel( raycaster.ray.origin.distanceTo( _sphere.center ) + _sphere.radius ) * lineWidth * widest / 2;

	_sphere.radius += threshold + reach;

	if ( raycaster.ray.intersectsSphere( _sphere ) === false ) return;

	_inverseMatrix.copy( this.matrixWorld ).invert();
	_ray.copy( raycaster.ray ).applyMatrix4( _inverseMatrix );

	// the width is not scaled with the mesh, the ray is
	_scale.setFromMatrixScale( this.matrixWorld );
	const scale = ( _scale.x + _scale.y + _scale.z ) / 3 || 1;

	const dashArray = material.dashArray || 0;
	const dashOffset = material.dashOffset || 0;
	const dashRatio = material.dashRatio !== undefined ? material.dashRatio : 0.5;
	const visibility = material.visibility !== undefined ? material.visibility : 1;

	let found = null;

	for ( let j = 0; j < count - 1; j ++ ) {

		_start.fromBufferAttribute( position, j * 2 );
		_end.fromBufferAttribute( position, j * 2 + 2 );

		const distanceSq = _ray.distanceSqToSegment( _start, _end, _onRay, _onSegment );

		// how far along the segment, to know the width and the part of the line that is there
		const length = _start.distanceTo( _end );
		const t = length > 0 ? _start.distanceTo( _onSegment ) / length : 0;
		const segmentWidth = widths[ j * 2 ] + ( widths[ j * 2 + 2 ] - widths[ j * 2 ] ) * t;

		_closest.copy( _onSegment ).applyMatrix4( this.matrixWorld );

		const distance = raycaster.ray.origin.distanceTo( _closest );

		if ( distance < raycaster.near || distance > raycaster.far ) continue;

		const half = Math.abs( lineWidth * segmentWidth ) / 2;

		if ( inPixels ) {

			// measured on the screen, which is where the width is
			_view.copy( _closest ).applyMatrix4( camera.matrixWorldInverse );

			if ( camera.isPerspectiveCamera && _view.z >= 0 ) continue;

			const reachInPixels = half + threshold / unitsPerPixel( - _view.z );

			_onRay.applyMatrix4( this.matrixWorld ).project( camera );
			_view.copy( _closest ).project( camera );

			const dx = ( _onRay.x - _view.x ) * width / 2;
			const dy = ( _onRay.y - _view.y ) * height / 2;

			if ( dx * dx + dy * dy > reachInPixels * reachInPixels ) continue;

		} else {

			const precision = ( threshold + ( sizeAttenuation ? half : 0 ) ) / scale;

			if ( distanceSq > precision * precision ) continue;

		}

		// the parts that are not drawn can't be hit: what is past the visibility, and the gaps between dashes
		const counter = ( j + t ) / count;

		if ( counter > visibility ) continue;
		if ( dashArray !== 0 && ( ( ( counter + dashOffset ) % dashArray ) + dashArray ) % dashArray < dashArray * dashRatio ) continue;

		if ( found === null || distance < found.distance ) {

			found = { distance, point: _closest.clone(), index: j, face: null, faceIndex: null, object: this };

		}

	}

	if ( found !== null ) intersects.push( found );

}

MeshLine.prototype.raycast = MeshLineRaycast;

const vertexShader = /* glsl */`

	#include <common>
	#include <logdepthbuf_pars_vertex>
	#include <fog_pars_vertex>
	#include <clipping_planes_pars_vertex>

	attribute vec3 previous;
	attribute vec3 next;
	attribute float side;
	attribute float width;
	attribute float counters;

	uniform vec2 resolution;
	uniform float lineWidth;
	uniform vec3 color;
	uniform float opacity;
	uniform float sizeAttenuation;

	varying vec2 vUV;
	varying vec4 vColor;
	varying float vCounters;

	vec2 fix( vec4 i, float aspect ) {

		vec2 res = i.xy / i.w;
		res.x *= aspect;
		return res;

	}

	void main() {

		float aspect = resolution.x / resolution.y;

		vColor = vec4( color, opacity );
		vUV = uv;
		vCounters = counters;

		mat4 m = projectionMatrix * modelViewMatrix;
		vec4 finalPosition = m * vec4( position, 1.0 );
		vec4 prevPos = m * vec4( previous, 1.0 );
		vec4 nextPos = m * vec4( next, 1.0 );

		vec2 currentP = fix( finalPosition, aspect );
		vec2 prevP = fix( prevPos, aspect );
		vec2 nextP = fix( nextPos, aspect );

		float w = lineWidth * width;

		vec2 dir;
		if ( nextP == currentP ) dir = normalize( currentP - prevP );
		else if ( prevP == currentP ) dir = normalize( nextP - currentP );
		else {

			vec2 dir1 = normalize( currentP - prevP );
			vec2 dir2 = normalize( nextP - currentP );
			dir = normalize( dir1 + dir2 );

		}

		vec2 normal = vec2( - dir.y, dir.x ) * 0.5 * w;

		if ( sizeAttenuation == 0.0 ) {

			// the width is in pixels of the resolution
			normal *= 2.0 * finalPosition.w / resolution.y;
			normal.x /= aspect;

		} else {

			// the width is in units of the scene
			normal.x *= projectionMatrix[ 0 ][ 0 ];
			normal.y *= projectionMatrix[ 1 ][ 1 ];

		}

		finalPosition.xy += normal * side;

		gl_Position = finalPosition;

		vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

		#include <logdepthbuf_vertex>
		#include <clipping_planes_vertex>
		#include <fog_vertex>

	}

`;

const fragmentShader = /* glsl */`

	#include <common>
	#include <fog_pars_fragment>
	#include <logdepthbuf_pars_fragment>
	#include <clipping_planes_pars_fragment>

	uniform sampler2D map;
	uniform sampler2D alphaMap;
	uniform float useMap;
	uniform float useAlphaMap;
	uniform float useDash;
	uniform float dashArray;
	uniform float dashOffset;
	uniform float dashRatio;
	uniform float visibility;
	uniform float alphaTest;
	uniform vec2 repeat;

	varying vec2 vUV;
	varying vec4 vColor;
	varying float vCounters;

	void main() {

		#include <clipping_planes_fragment>
		#include <logdepthbuf_fragment>

		vec4 c = vColor;
		if ( useMap == 1.0 ) c *= texture2D( map, vUV * repeat );
		if ( useAlphaMap == 1.0 ) c.a *= texture2D( alphaMap, vUV * repeat ).a;
		if ( c.a < alphaTest ) discard;

		// the gaps between dashes and what is past the visibility are not drawn at all, so they don't hide what is behind
		if ( useDash == 1.0 && mod( vCounters + dashOffset, dashArray ) <= dashArray * dashRatio ) discard;
		if ( vCounters > visibility ) discard;

		gl_FragColor = c;

		#include <tonemapping_fragment>
		#include <colorspace_fragment>
		#include <fog_fragment>

	}

`;

// the properties that are a uniform of the shader
const properties = [ 'lineWidth', 'map', 'useMap', 'alphaMap', 'useAlphaMap', 'opacity', 'sizeAttenuation', 'dashOffset', 'dashRatio', 'useDash', 'visibility', 'alphaTest' ];

const _size = new Vector2();

class MeshLineMaterial extends ShaderMaterial {

	constructor( parameters ) {

		super( {
			uniforms: Object.assign( UniformsUtils.clone( UniformsLib.fog ), {
				lineWidth: { value: 1 },
				map: { value: null },
				useMap: { value: 0 },
				alphaMap: { value: null },
				useAlphaMap: { value: 0 },
				color: { value: new Color( 0xffffff ) },
				opacity: { value: 1 },
				resolution: { value: new Vector2( 1, 1 ) },
				sizeAttenuation: { value: 1 },
				dashArray: { value: 0 },
				dashOffset: { value: 0 },
				dashRatio: { value: 0.5 },
				useDash: { value: 0 },
				visibility: { value: 1 },
				alphaTest: { value: 0 },
				repeat: { value: new Vector2( 1, 1 ) }
			} ),
			vertexShader,
			fragmentShader
		} );

		this.isMeshLineMaterial = true;
		this.type = 'MeshLineMaterial';

		this.fog = true;
		this.clipping = true;

		// the resolution follows what is being rendered to, until one is given
		this.autoResolution = true;

		// read from this.uniforms every time: copy() replaces the object
		const definitions = {};

		for ( const name of properties ) {

			definitions[ name ] = {
				enumerable: true,
				get: () => this.uniforms[ name ].value,
				set: value => {

					// true and false are fine for the ones the shader compares with 1.0
					this.uniforms[ name ].value = typeof value === 'boolean' ? Number( value ) : value;

				}
			};

		}

		definitions.color = {
			enumerable: true,
			get: () => this.uniforms.color.value,
			set: value => {

				this.uniforms.color.value = value && value.isColor ? value : new Color( value );

			}
		};

		definitions.resolution = {
			enumerable: true,
			get: () => this.uniforms.resolution.value,
			set: value => {

				this.uniforms.resolution.value.copy( value );
				this.autoResolution = false;

			}
		};

		definitions.repeat = {
			enumerable: true,
			get: () => this.uniforms.repeat.value,
			set: value => {

				this.uniforms.repeat.value.copy( value );

			}
		};

		definitions.dashArray = {
			enumerable: true,
			get: () => this.uniforms.dashArray.value,
			set: value => {

				this.uniforms.dashArray.value = value;
				this.uniforms.useDash.value = value !== 0 ? 1 : 0;

			}
		};

		Object.defineProperties( this, definitions );

		this.setValues( parameters );

	}

	onBeforeRender( renderer ) {

		if ( ! this.autoResolution ) return;

		const target = renderer.getRenderTarget();

		if ( target ) this.uniforms.resolution.value.set( target.width, target.height );
		else this.uniforms.resolution.value.copy( renderer.getSize( _size ) );

	}

	copy( source ) {

		super.copy( source );

		this.lineWidth = source.lineWidth;
		this.map = source.map;
		this.useMap = source.useMap;
		this.alphaMap = source.alphaMap;
		this.useAlphaMap = source.useAlphaMap;
		this.color = source.color.clone();
		this.opacity = source.opacity;
		this.uniforms.resolution.value.copy( source.resolution );
		this.autoResolution = source.autoResolution;
		this.sizeAttenuation = source.sizeAttenuation;
		this.dashArray = source.dashArray;
		this.dashOffset = source.dashOffset;
		this.dashRatio = source.dashRatio;
		this.useDash = source.useDash;
		this.visibility = source.visibility;
		this.alphaTest = source.alphaTest;
		this.repeat = source.repeat;

		return this;

	}

}

export { MeshLine, MeshLineMaterial, MeshLineRaycast };
