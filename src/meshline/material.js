import * as THREE from 'three'

THREE.ShaderChunk['meshline_vert'] = [
  '',
  '#include <common>',
  '',
  THREE.ShaderChunk.logdepthbuf_pars_vertex,
  THREE.ShaderChunk.fog_pars_vertex,
  '',
  'attribute vec3 previous;',
  'attribute vec3 next;',
  'attribute float side;',
  'attribute float width;',
  'attribute float counters;',
  '',
  'uniform vec2 resolution;',
  'uniform float lineWidth;',
  'uniform vec3 color;',
  'uniform float opacity;',
  'uniform float sizeAttenuation;',
  '',
  'varying vec2 vUV;',
  'varying vec4 vColor;',
  'varying float vCounters;',
  '',
  'vec2 fix( vec4 i, float aspect ) {',
  '',
  '    vec2 res = i.xy / i.w;',
  '    res.x *= aspect;',
  '	 vCounters = counters;',
  '    return res;',
  '',
  '}',
  '',
  'void main() {',
  '',
  '    float aspect = resolution.x / resolution.y;',
  '',
  '    vColor = vec4( color, opacity );',
  '    vUV = uv;',
  '',
  '    mat4 m = projectionMatrix * modelViewMatrix;',
  '    vec4 finalPosition = m * vec4( position, 1.0 );',
  '    vec4 prevPos = m * vec4( previous, 1.0 );',
  '    vec4 nextPos = m * vec4( next, 1.0 );',
  '',
  '    vec2 currentP = fix( finalPosition, aspect );',
  '    vec2 prevP = fix( prevPos, aspect );',
  '    vec2 nextP = fix( nextPos, aspect );',
  '',
  '    float w = lineWidth * width;',
  '',
  '    vec2 dir;',
  '    if( nextP == currentP ) dir = normalize( currentP - prevP );',
  '    else if( prevP == currentP ) dir = normalize( nextP - currentP );',
  '    else {',
  '        vec2 dir1 = normalize( currentP - prevP );',
  '        vec2 dir2 = normalize( nextP - currentP );',
  '        dir = normalize( dir1 + dir2 );',
  '',
  '        vec2 perp = vec2( -dir1.y, dir1.x );',
  '        vec2 miter = vec2( -dir.y, dir.x );',
  '        //w = clamp( w / dot( miter, perp ), 0., 4. * lineWidth * width );',
  '',
  '    }',
  '',
  '    //vec2 normal = ( cross( vec3( dir, 0. ), vec3( 0., 0., 1. ) ) ).xy;',
  '    vec4 normal = vec4( -dir.y, dir.x, 0., 1. );',
  '    normal.xy *= .5 * w;',
  '    normal *= projectionMatrix;',
  '    if( sizeAttenuation == 0. ) {',
  '        normal.xy *= finalPosition.w;',
  '        normal.xy /= ( vec4( resolution, 0., 1. ) * projectionMatrix ).xy;',
  '    }',
  '',
  '    finalPosition.xy += normal.xy * side;',
  '',
  '    gl_Position = finalPosition;',
  '',
  THREE.ShaderChunk.logdepthbuf_vertex,
  THREE.ShaderChunk.fog_vertex && '    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
  THREE.ShaderChunk.fog_vertex,
  '}'
].join('\n')

THREE.ShaderChunk['meshline_frag'] = [
  '',
  THREE.ShaderChunk.fog_pars_fragment,
  THREE.ShaderChunk.logdepthbuf_pars_fragment,
  '',
  'uniform sampler2D map;',
  'uniform sampler2D alphaMap;',
  'uniform float useMap;',
  'uniform float useAlphaMap;',
  'uniform float useDash;',
  'uniform float dashArray;',
  'uniform float dashOffset;',
  'uniform float dashRatio;',
  'uniform float visibility;',
  'uniform float alphaTest;',
  'uniform vec2 repeat;',
  '',
  'varying vec2 vUV;',
  'varying vec4 vColor;',
  'varying float vCounters;',
  '',
  'void main() {',
  '',
  THREE.ShaderChunk.logdepthbuf_fragment,
  '',
  '    vec4 c = vColor;',
  '    if( useMap == 1. ) c *= texture2D( map, vUV * repeat );',
  '    if( useAlphaMap == 1. ) c.a *= texture2D( alphaMap, vUV * repeat ).a;',
  '    if( c.a < alphaTest ) discard;',
  '    if( useDash == 1. ){',
  '        c.a *= ceil(mod(vCounters + dashOffset, dashArray) - (dashArray * dashRatio));',
  '    }',
  '    gl_FragColor = c;',
  '    gl_FragColor.a *= step(vCounters, visibility);',
  '',
  THREE.ShaderChunk.fog_fragment,
  '}'
].join('\n')

export class MeshLineMaterial extends THREE.ShaderMaterial {

  constructor(parameters) {
    super({
      uniforms: Object.assign({}, THREE.UniformsLib.fog, {
        lineWidth: { value: 1 },
        map: { value: null },
        useMap: { value: 0 },
        alphaMap: { value: null },
        useAlphaMap: { value: 0 },
        color: { value: new THREE.Color(0xffffff) },
        opacity: { value: 1 },
        resolution: { value: new THREE.Vector2(1, 1) },
        sizeAttenuation: { value: 1 },
        dashArray: { value: 0 },
        dashOffset: { value: 0 },
        dashRatio: { value: 0.5 },
        useDash: { value: 0 },
        visibility: { value: 1 },
        alphaTest: { value: 0 },
        repeat: { value: new THREE.Vector2(1, 1) }
      }),

      vertexShader: THREE.ShaderChunk.meshline_vert,

      fragmentShader: THREE.ShaderChunk.meshline_frag
    })

    this.type = 'MeshLineMaterial'
    Object.defineProperties(this, {
      lineWidth: {
        enumerable: true,
        get() {
          return this.uniforms.lineWidth.value
        },
        set(value) {
          this.uniforms.lineWidth.value = value
        }
      },
      map: {
        enumerable: true,
        get() {
          return this.uniforms.map.value
        },
        set(value) {
          this.uniforms.map.value = value
        }
      },
      useMap: {
        enumerable: true,
        get() {
          return this.uniforms.useMap.value
        },
        set(value) {
          this.uniforms.useMap.value = value
        }
      },
      alphaMap: {
        enumerable: true,
        get() {
          return this.uniforms.alphaMap.value
        },
        set(value) {
          this.uniforms.alphaMap.value = value
        }
      },
      useAlphaMap: {
        enumerable: true,
        get() {
          return this.uniforms.useAlphaMap.value
        },
        set(value) {
          this.uniforms.useAlphaMap.value = value
        }
      },
      color: {
        enumerable: true,
        get() {
          return this.uniforms.color.value
        },
        set(value) {
          this.uniforms.color.value = value
        }
      },
      opacity: {
        enumerable: true,
        get() {
          return this.uniforms.opacity.value
        },
        set(value) {
          this.uniforms.opacity.value = value
        }
      },
      resolution: {
        enumerable: true,
        get() {
          return this.uniforms.resolution.value
        },
        set(value) {
          this.uniforms.resolution.value.copy(value)
        }
      },
      sizeAttenuation: {
        enumerable: true,
        get() {
          return this.uniforms.sizeAttenuation.value
        },
        set(value) {
          this.uniforms.sizeAttenuation.value = value
        }
      },
      dashArray: {
        enumerable: true,
        get() {
          return this.uniforms.dashArray.value
        },
        set(value) {
          this.uniforms.dashArray.value = value
          this.useDash = value !== 0 ? 1 : 0
        }
      },
      dashOffset: {
        enumerable: true,
        get() {
          return this.uniforms.dashOffset.value
        },
        set(value) {
          this.uniforms.dashOffset.value = value
        }
      },
      dashRatio: {
        enumerable: true,
        get() {
          return this.uniforms.dashRatio.value
        },
        set(value) {
          this.uniforms.dashRatio.value = value
        }
      },
      useDash: {
        enumerable: true,
        get() {
          return this.uniforms.useDash.value
        },
        set(value) {
          this.uniforms.useDash.value = value
        }
      },
      visibility: {
        enumerable: true,
        get() {
          return this.uniforms.visibility.value
        },
        set(value) {
          this.uniforms.visibility.value = value
        }
      },
      alphaTest: {
        enumerable: true,
        get() {
          return this.uniforms.alphaTest.value
        },
        set(value) {
          this.uniforms.alphaTest.value = value
        }
      },
      repeat: {
        enumerable: true,
        get() {
          return this.uniforms.repeat.value
        },
        set(value) {
          this.uniforms.repeat.value.copy(value)
        }
      }
    })

    this.setValues(parameters)
  }

  copy(source) {
    super.copy(source)

    this.lineWidth = source.lineWidth
    this.map = source.map
    this.useMap = source.useMap
    this.alphaMap = source.alphaMap
    this.useAlphaMap = source.useAlphaMap
    this.color.copy(source.color)
    this.opacity = source.opacity
    this.resolution.copy(source.resolution)
    this.sizeAttenuation = source.sizeAttenuation
    this.dashArray.copy(source.dashArray)
    this.dashOffset.copy(source.dashOffset)
    this.dashRatio.copy(source.dashRatio)
    this.useDash = source.useDash
    this.visibility = source.visibility
    this.alphaTest = source.alphaTest
    this.repeat.copy(source.repeat)

    return this
  }
}
