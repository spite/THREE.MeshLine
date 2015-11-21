(function() {

    // Module code from underscore.js

    // Establish the root object, `window` (`self`) in the browser, `global`
    // on the server, or `this` in some virtual machines. We use `self`
    // instead of `window` for `WebWorker` support.
    var root = typeof self == 'object' && self.self === self && self ||
            typeof global == 'object' && global.global === global && global ||
            this;

    var Maf = function(obj) {
        if (obj instanceof Maf ) return obj;
        if (!(this instanceof Maf )) return new Maf(obj);
        this._wrapped = obj;
    };

    // Export the Underscore object for **Node.js**, with
    // backwards-compatibility for their old module API. If we're in
    // the browser, add `Maf` as a global object.
    // (`nodeType` is checked to ensure that `module`
    // and `exports` are not HTML elements.)
    if (typeof exports != 'undefined' && !exports.nodeType) {
        if (typeof module != 'undefined' && !module.nodeType && module.exports) {
        exports = module.exports = Maf;
        }
        exports.Maf = Maf;
    } else {
        root.Maf = Maf;
    }

    // Current version.
    Maf.VERSION = '1.0.0';

    Maf.PI = Math.PI;

    // https://www.opengl.org/sdk/docs/man/html/clamp.xhtml

    Maf.clamp = function( v, minVal, maxVal ) {
        return Math.min( maxVal, Math.max( minVal, v ) );
    };

    // https://www.opengl.org/sdk/docs/man/html/step.xhtml

    Maf.step = function( edge, v ) {
        return ( v < edge ) ? 0 : 1;
    }

    // https://www.opengl.org/sdk/docs/man/html/smoothstep.xhtml

    Maf.smoothStep = function ( edge0, edge1, v ) {
        var t = Maf.clamp( ( v - edge0 ) / ( edge1 - edge0 ), 0.0, 1.0 );
        return t * t * ( 3.0 - 2.0 * t );
    };

    // http://docs.unity3d.com/ScriptReference/Mathf.html
    // http://www.shaderific.com/glsl-functions/
    // https://www.opengl.org/sdk/docs/man4/html/
    // https://msdn.microsoft.com/en-us/library/windows/desktop/ff471376(v=vs.85).aspx
    // http://moutjs.com/docs/v0.11/math.html#map
    // https://code.google.com/p/kuda/source/browse/public/js/hemi/utils/mathUtils.js?r=8d581c02651077c4ac3f5fc4725323210b6b13cc

    // Converts from degrees to radians.
    Maf.deg2Rad = function( degrees ) {
      return degrees * Math.PI / 180;
    };
    
    Maf.toRadians = Maf.deg2Rad;

    // Converts from radians to degrees.
    Maf.rad2Deg = function(radians) {
      return radians * 180 / Math.PI;
    };

    Maf.toDegrees = Maf.rad2Deg;

    Maf.clamp01 = function( v ) {
        return Maf.clamp( v, 0, 1 );
    };

    // https://www.opengl.org/sdk/docs/man/html/mix.xhtml

    Maf.mix = function( x, y, a ) {
        if( a <= 0 ) return x;
        if( a >= 1 ) return y;
        return x + a * (y - x)
    };

    Maf.lerp = Maf.mix;

    Maf.inverseMix = function( a, b, v ) {
        return ( v - a ) / ( b - a );
    };

    Maf.inverseLerp = Maf.inverseMix;

    Maf.mixUnclamped = function( x, y, a ) {
        if( a <= 0 ) return x;
        if( a >= 1 ) return y;
        return x + a * (y - x)
    };

    Maf.lerpUnclamped = Maf.mixUnclamped;

    // https://www.opengl.org/sdk/docs/man/html/fract.xhtml

    Maf.fract = function( v ) {
        return v - Math.floor( v );
    };

    Maf.frac = Maf.fract;

    // http://stackoverflow.com/questions/4965301/finding-if-a-number-is-a-power-of-2

    Maf.isPowerOfTwo = function( v ) {
        return ( ( ( v - 1) & v ) == 0 );
    };

    // https://bocoup.com/weblog/find-the-closest-power-of-2-with-javascript

    Maf.closestPowerOfTwo = function( v ) {
        return Math.pow( 2, Math.round( Math.log( v ) / Math.log( 2 ) ) ); 
    };

    Maf.nextPowerOfTwo = function( v ) {
        return Math.pow( 2, Math.ceil( Math.log( v ) / Math.log( 2 ) ) );    
    }

    // http://stackoverflow.com/questions/1878907/the-smallest-difference-between-2-angles

    //function mod(a, n) { return a - Math.floor(a/n) * n; }
    Maf.mod = function(a, n) { return (a % n + n) % n; }

    Maf.deltaAngle = function( a, b ) {
        var d = Maf.mod( b - a, 360 );
        if( d > 180 ) d = Math.abs( d - 360 );
        return d;
    };

    Maf.deltaAngleDeg = Maf.deltaAngle;

    Maf.deltaAngleRad = function( a, b ) {
        return Maf.toRadians( Maf.deltaAngle( Maf.toDegrees( a ), Maf.toDegrees( b ) ) );
    };

    Maf.lerpAngle = function( a, b, t ) {
        var angle = Maf.deltaAngle( a, b );
        return Maf.mod( a + Maf.lerp( 0, angle, t ), 360 );
    };

    Maf.lerpAngleDeg = Maf.lerpAngle;

    Maf.lerpAngleRad = function( a, b, t ) {
        return Maf.toRadians( Maf.lerpAngleDeg( Maf.toDegrees( a ), Maf.toDegrees( b ), t ) );
    };

    // http://gamedev.stackexchange.com/questions/74324/gamma-space-and-linear-space-with-shader

    Maf.gammaToLinearSpace = function( v ) {
        return Math.pow( v, 2.2 );
    };

    Maf.linearToGammaSpace = function( v ) {
        return Math.pow( v, 1 / 2.2 );
    };

    Maf.map = function( from1, to1, from2, to2, v ) {
        return from2 + ( v - from1 ) * ( to2 - from2 ) / ( to1 - from1 );
    }

    Maf.scale = Maf.map;

    // http://www.iquilezles.org/www/articles/functions/functions.htm

    Maf.almostIdentity = function( x, m, n ) {
        
        if( x > m ) return x;

        var a = 2 * n - m;
        var b = 2 * m - 3 * n;
        var t = x / m;

        return ( a * t + b) * t * t + n;
    }

    Maf.impulse = function( k, x ) {
        var h = k * x;
        return h * Math.exp( 1 - h );
    };

    Maf.cubicPulse = function( c, w, x ) {
        x = Math.abs( x - c );
        if( x > w ) return 0;
        x /= w;
        return 1 - x * x * ( 3 - 2 * x );
    }

    Maf.expStep = function( x, k, n ) {
        return Math.exp( -k * Math.pow( x, n ) );
    }

    Maf.parabola = function( x, k ) {
        return Math.pow( 4 * x * ( 1 - x ), k );
    }

    Maf.powerCurve = function( x, a, b ) {
        var k = Math.pow( a + b, a + b ) / ( Math.pow( a, a ) * Math.pow( b, b ) );
        return k * Math.pow( x, a ) * Math.pow( 1 - x, b );
    }

    // http://iquilezles.org/www/articles/smin/smin.htm ?

    Maf.latLonToCartesian = function( lat, lon ) {

        lon += 180;
        lat = Maf.clamp( lat, -85, 85 );
        var phi = Maf.toRadians( 90 - lat );
        var theta = Maf.toRadians( 180 - lon );
        var x = Math.sin( phi ) * Math.cos( theta );
        var y = Math.cos( phi );
        var z = Math.sin( phi ) * Math.sin( theta );

        return { x: x, y: y, z: z }

    }

    Maf.cartesianToLatLon = function( x, y, z ) {
        var n = Math.sqrt( x * x + y * y + z * z );
        return{ lat: Math.asin( z / n ), lon: Math.atan2( y, x ) };
    }

    Maf.randomInRange = function( min, max ) {
        return min + Math.random() * ( max - min );
    }

    Maf.norm = function( v, minVal, maxVal ) {
        return ( v - minVal ) / ( maxVal - minVal );
    }

    Maf.hash = function( n ) {
        return Maf.fract( (1.0 + Math.cos(n)) * 415.92653);
    }

    Maf.noise2d = function( x, y ) {
        var xhash = Maf.hash( x * 37.0 );
        var yhash = Maf.hash( y * 57.0 );
        return Maf.fract( xhash + yhash );
    }

    // http://iquilezles.org/www/articles/smin/smin.htm

    Maf.smoothMin = function( a, b, k ) {
        var res = Math.exp( -k*a ) + Math.exp( -k*b );
        return - Math.log( res )/k;
    }

    Maf.smoothMax = function( a, b, k ){
        return Math.log( Math.exp(a) + Math.exp(b) )/k;
    }

    Maf.almost = function( a, b ) {
        return ( Math.abs( a - b ) < .0001 );
    }

}());