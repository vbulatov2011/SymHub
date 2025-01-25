import {
    isDefined,
    getParam,
} from './modules.js';


import {
    ColormapFragments
} from './Colormaps2.glsl.mjs';

const DEBUG = false;


export function createDataTexture(gl){
    
  const alignment = 1;
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);

  const sampler = gl.createTexture();
  
  gl.bindTexture(gl.TEXTURE_2D, sampler);  
  // turn off filtering 
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);                  
  
  return sampler;
  
}


export function getColormapTexture(gl, options){
    
  let colormap;
  if(isDefined(options.name))
      colormap = getColormap(options.name);
  else if(isDefined(options.colormap))
      colormap = options.colormap;
  else 
      colormap = defaultColormap;
 
  let cmdata = colormap.data;
  
  //console.log(`   cmdata: `, cmdata);  

  let tex = cmdata.tex;
  
  if(isDefined(tex)){
    // already allocated 
    return tex;
  }
  if(DEBUG)console.log('creating new colormapTexture: ', colormap.name);
  let newTex = createDataTexture(gl);
  let count = cmdata.length;
  if(DEBUG)console.log('colormap entries count: ', count);
  
  var data = new Float32Array(4*count);
  //premult(cmdata)? 
  vec4arrayToArray(cmdata,data);
  if(false)console.log(`   data: `, data);  
  
  gl.bindTexture(gl.TEXTURE_2D, newTex);  
  const level = 0;
  const internalFormat = gl.RGBA32F; 
  const width = data.length/4;
  const height = 1;
  const border = 0;
  const format = gl.RGBA; 
  const type = gl.FLOAT;
  if(DEBUG)console.log(` colormap texture:  ${width} x ${height}`);
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,format, type, data);  
  cmdata.tex = newTex;
  
  return newTex;
  
}

//
// convenient vec4 initialization to make colormap data 
// compatible with glsl syntax 
//
function vec4(r, g, b, a){
    let out = [];
    [r,g,b,a].forEach((key) => {
        if(isDefined(key))
            out.push(key);
        else 
            out.push(1.);
        }
    )
            
    return out;
}


function vec4arrayToArray(cmdata, array){
  
  let count = cmdata.length; 
  
  for(let k = 0; k < count; k++){
    let outOff = k*4;
    let v = cmdata[k];
    for(let i = 0; i < 4; i++){
      array[outOff+i] = v[i];
    }
  }
  return array;
}

//
//  convert gencm format into fomat 
//
function gen2cm(gen, options){
    
    let cm = {};
    cm.name = gen.Name;
    let smooth = getParam(options, 'smooth', true);
    cm.data = [];
    const data = gen.RGBPoints;
    const alpha = getParam(options.alpha, 1.0);;
    let dig = getParam(options.digits, 6);;
    let len = data.length/4;
    for(let i = 0; i < len; i++){
        let off = i*4;
        let offL = (smooth) ? off: Math.max(0, off-4);
        let offR = off;
        let v = Number(data[off].toFixed(dig));        
        // left color 
        let rl = Number(data[offL+1].toFixed(dig));
        let gl = Number(data[offL+2].toFixed(dig));
        let bl = Number(data[offL+3].toFixed(dig));
        // right color
        let rr = Number(data[offR+1].toFixed(dig));
        let gr = Number(data[offR+2].toFixed(dig));
        let br = Number(data[offR+3].toFixed(dig));
        
        cm.data.push(vec4(v));
        cm.data.push(vec4(rl,gl,bl,alpha));
        cm.data.push(vec4(rr,gr,br,alpha));              
    }
    return cm;
}

//
//
function cm2str(cm){
    let s = '{\n';
    s += '    name:\'' + cm.name + '\',\n';
    s += '    data: [\n';
    let n = cm.data.length/3;
    let d = 6;
    for(let i = 0; i < n; i++){
        let off = i*3;
        let v  = cm.data[off];
        let cl = cm.data[off+1];
        let cr = cm.data[off+2];
        s += 'vec4(' + v[0].toFixed(d) + '),vec4('+cl + '),vec4('+ cr + '),\n'
    }
    s += ']';
    s += '};';
    
    if(DEBUG)console.log('cm:', s);
    //console.log('cm:', JSON.stringify(cm, null, 2));
}

function array2object(array){
    let obj = {};
    for(const [key, value] of Object.entries(array))
        obj[value.name] = value;
    return obj;
}

function getNamesArray(obj){
    let names = [];
    for(const [key, value] of Object.entries(obj))
        names.push(value.name);
    return names;
}


const red_green = {
    name: "red green",
    tex: null,    
    data: [ 
        vec4(0),      vec4(0, 0,0,1),   vec4(0,0,0,1),
        vec4(0.2),    vec4(0, 1,0,1),   vec4(1,1,0,1), 
        vec4(0.4),    vec4(1, 0,0,1),   vec4(1,0,0,1), 
        vec4(0.6),    vec4(1, 1, 1, 1), vec4(1,1,1,1)
        ]
}

const black_red = {
    name: "black red",
    tex: null,    
    data: [ 
      vec4(0),   vec4(0,   0,   0.,  1.), vec4(0,   0,   0.,  1.),
      vec4(0.1), vec4(0,   0,   0.,  1.), vec4(0,   0,   0.,  1.),
      vec4(0.2), vec4(1,   1,   0.,  0.), vec4(1,   1,   0.,  0.),
      vec4(0.3), vec4(1,   1,   0.,  0.), vec4(1,   1,   0.,  0.),
      vec4(0.4), vec4(1,   0.0, 0.0, 1.), vec4(1,   0.0, 0.0, 1.),
      vec4(0.5), vec4(1.,  0.0, 0.0, 1.), vec4(1.,  0.0, 0.0, 1.),
      vec4(0.6), vec4(0,   1.0, 0.0, 0.), vec4(0,   1.0, 0.0, 0.),
      vec4(0.7), vec4(0,   1.0, 0.0, 0.), vec4(0,   1.0, 0.0, 0.),
      vec4(0.8), vec4(0,   0.0, 0.4, 1.), vec4(0,   0.0, 0.4, 1.),
      vec4(0.9), vec4(0,   0.0, 1.0, 1.), vec4(0,   0.0, 1.0, 1.),
      vec4(1.0), vec4(0,   0.0, 0.0, 0.), vec4(0,   0.0, 0.0, 0.),
      ]
};

export const colormap_band2 = {
    name: "band2",
    tex: null,
    data: [
        vec4(0.),  vec4(0.5,0.5, 0.8,0), vec4(0,  0.9, 0.1,1),
        vec4(0.5), vec4(0,  0.9, 0.1,1), vec4(0.2,0.0, 0.9,1.),
        vec4(1.),  vec4(0,  0.0, 0.9,1), vec4(0.0,0.0, 0.5,0)

    ]
};

export const colormap_band12 = {
    name: 'band12',
    tex: null,
    data: [
         vec4(0),               vec4(0.000,0.500,0.900,1.), vec4(0.996,0.152,0.070,1.),
         vec4(1./12., 0, 0, 0), vec4(0.996,0.152,0.070,1.), vec4(0.988,0.376,0.039,1.),
         vec4(2./12., 0, 0, 0), vec4(0.988,0.376,0.039,1.), vec4(0.984,0.600,0.007,1.),
         vec4(3./12., 0, 0, 0), vec4(0.984,0.600,0.007,1.), vec4(0.988,0.800,0.101,1.),
         vec4(4./12., 0, 0, 0), vec4(0.988,0.800,0.101,1.), vec4(0.996,0.996,0.200,1.),
         vec4(5./12., 0, 0, 0), vec4(0.996,0.996,0.200,1.), vec4(0.698,0.843,0.196,1.),
         vec4(6./12., 0, 0, 0), vec4(0.698,0.843,0.196,1.), vec4(0.400,0.690,0.196,1.),
         vec4(7./12., 0, 0, 0), vec4(0.400,0.690,0.196,1.), vec4(0.203,0.486,0.596,1.),
         vec4(8./12., 0, 0, 0), vec4(0.203,0.486,0.596,1.), vec4(0.007,0.278,0.996,1.),
         vec4(9./12., 0, 0, 0), vec4(0.007,0.278,0.996,1.), vec4(0.266,0.141,0.839,1.),
         vec4(10./12., 0, 0, 0),vec4(0.266,0.141,0.839,1.), vec4(0.525,0.003,0.686,1.),
         vec4(11./12., 0, 0, 0),vec4(0.525,0.003,0.686,1.), vec4(0.760,0.070,0.370,1.),
         vec4(1., 0, 0, 0),     vec4(0.760,0.070,0.370,1.), vec4(0.900, 0.00,0.100,1.)
    ],
};

export const colormap_rainbow = {
    name: 'rainbow',
    tex: null,
    data: [
         vec4(0),               vec4(0.000,0.500,0.900,1.), vec4(0.996,0.152,0.070,1.),
         vec4(1./12., 0, 0, 0), vec4(0.996,0.152,0.070,1.), vec4(0.988,0.376,0.039,1.),
         vec4(2./12., 0, 0, 0), vec4(0.988,0.376,0.039,1.), vec4(0.984,0.600,0.007,1.),
         vec4(3./12., 0, 0, 0), vec4(0.984,0.600,0.007,1.), vec4(0.988,0.800,0.101,1.),
         vec4(4./12., 0, 0, 0), vec4(0.988,0.800,0.101,1.), vec4(0.996,0.996,0.200,1.),
         vec4(5./12., 0, 0, 0), vec4(0.996,0.996,0.200,1.), vec4(0.698,0.843,0.196,1.),
         vec4(6./12., 0, 0, 0), vec4(0.698,0.843,0.196,1.), vec4(0.400,0.690,0.196,1.),
         vec4(7./12., 0, 0, 0), vec4(0.400,0.690,0.196,1.), vec4(0.203,0.486,0.596,1.),
         vec4(8./12., 0, 0, 0), vec4(0.203,0.486,0.596,1.), vec4(0.007,0.278,0.996,1.),
         vec4(9./12., 0, 0, 0), vec4(0.007,0.278,0.996,1.), vec4(0.266,0.141,0.839,1.),
         vec4(10./12., 0, 0, 0),vec4(0.266,0.141,0.839,1.), vec4(0.525,0.003,0.686,1.),
         vec4(11./12., 0, 0, 0),vec4(0.525,0.003,0.686,1.), vec4(0.760,0.070,0.370,1.),
         vec4(1., 0, 0, 0),     vec4(0.760,0.070,0.370,1.), vec4(0.900, 0.00,0.100,1.)
    ],
};


let red_blue = {
    name: 'red blue',
    data: [
        vec4(0.0), vec4(0.229,0.298,0.754,1),vec4(0.229,0.298,0.754,1),
        vec4(0.1), vec4(0.406,0.537,0.934,1),vec4(0.406,0.537,0.934,1),
        vec4(0.2), vec4(0.602,0.731,0.999,1),vec4(0.602,0.731,0.999,1),
        vec4(0.3), vec4(0.788,0.845,0.939,1),vec4(0.788,0.845,0.939,1),
        vec4(0.4), vec4(0.930,0.820,0.761,1),vec4(0.930,0.820,0.761,1),
        vec4(0.5), vec4(0.967,0.657,0.537,1),vec4(0.967,0.657,0.537,1),
        vec4(0.6), vec4(0.887,0.413,0.324,1),vec4(0.887,0.413,0.324,1),
        vec4(0.7), vec4(0.706,0.015,0.150,1),vec4(0.706,0.015,0.150,1),
     ]
};

const red_blue2 = {
    name: 'red blue 2',
    data: [
vec4(0.0), vec4(0.229,0.298,0.754, 0),vec4(0.229,0.298,0.754, 1),
vec4(0.1), vec4(0.229,0.298,0.754, 1),vec4(0.406,0.537,0.934, 1),
vec4(0.2), vec4(0.406,0.537,0.934, 1),vec4(0.602,0.731,0.999, 1),
vec4(0.3), vec4(0.602,0.731,0.999, 1),vec4(0.788,0.845,0.939, 1),
vec4(0.4), vec4(0.788,0.845,0.939, 1),vec4(0.930,0.820,0.761, 1),
vec4(0.5), vec4(0.930,0.820,0.761, 1),vec4(0.967,0.657,0.537, 1),
vec4(0.6), vec4(0.967,0.657,0.537, 1),vec4(0.887,0.413,0.324, 1),
vec4(0.7), vec4(0.887,0.413,0.324, 1),vec4(0.706,0.015,0.150, 1),
vec4(0.8), vec4(0.706,0.015,0.150, 1),vec4(0.606,0.015,0.150, 1),
vec4(0.9), vec4(0.706,0.015,0.150, 1),vec4(0.606,0.015,0.150, 0),
]
};

const cold_hot  = {
    name: 'cold_hot',
    data: [
vec4(0.0), vec4(1.0, 1.0, 1.0, 1.0), vec4(0.8, 0.8, 1.0, 1.0), 
vec4(0.1), vec4(0.8, 0.8, 1.0, 1.0), vec4(0.5, 0.5, 1.0, 1.0), 
vec4(0.2), vec4(0.5, 0.5, 1.0, 1.0), vec4(0.3, 0.3, 1.0, 1.0), 
vec4(0.3), vec4(0.3, 0.3, 1.0, 1.0), vec4(0.1, 0.1, 0.7, 1.0), 
vec4(0.4), vec4(0.1, 0.1, 0.7, 1.0), vec4(0.0, 0.0, 0.4, 1.0),
vec4(0.5), vec4(0.0, 0.0, 0.4, 1.0), vec4(0.4, 0.0, 0.0, 1.0),
vec4(0.6), vec4(0.4, 0.0, 0.0, 1.0), vec4(0.6, 0.0, 0.0, 1.0),
vec4(0.7), vec4(0.6, 0.0, 0.0, 1.0), vec4(0.9, 0.0, 0.0, 1.0),
vec4(0.8), vec4(0.9, 0.1, 0.1, 1.0), vec4(1.0, 0.4, 0.4, 1.0),
vec4(0.9), vec4(1.0, 0.4, 0.4, 1.0), vec4(1.0, 0.8, 0.8, 1.0),
vec4(1.0), vec4(1.0, 0.8, 0.8, 1.0), vec4(1.0, 1.0, 1.0, 1.0),

]
};

const inferno8_smooth = {
    name: 'inferno 8 smooth',
    data: [
vec4(0.000), vec4(0.000,0.000,0.000),vec4(0.001,0.000,0.013),
vec4(0.142), vec4(0.158,0.044,0.328),vec4(0.158,0.044,0.328),
vec4(0.285), vec4(0.396,0.082,0.433),vec4(0.396,0.082,0.433),
vec4(0.428), vec4(0.623,0.164,0.388),vec4(0.623,0.164,0.388),
vec4(0.571), vec4(0.830,0.282,0.258),vec4(0.830,0.282,0.258),
vec4(0.714), vec4(0.961,0.489,0.083),vec4(0.961,0.489,0.083),
vec4(0.857), vec4(0.981,0.755,0.152),vec4(0.981,0.755,0.152),
vec4(1.000), vec4(0.988,0.998,0.644),vec4(1.000,1.000,1.000),
]
};


const kindlman_16 = 
{
    name:'kindlman 16',
    data: [
vec4(0.000000),vec4(0,0,0,1),vec4(0,0,0,1),
vec4(0.066667),vec4(0.143288,0.010654,0.223051,1),vec4(0.143288,0.010654,0.223051,1),
vec4(0.133333),vec4(0.145968,0.020393,0.427937,1),vec4(0.145968,0.020393,0.427937,1),
vec4(0.200000),vec4(0.093082,0.030438,0.637651,1),vec4(0.093082,0.030438,0.637651,1),
vec4(0.266667),vec4(0.030339,0.200361,0.628913,1),vec4(0.030339,0.200361,0.628913,1),
vec4(0.333333),vec4(0.023830,0.324144,0.496099,1),vec4(0.023830,0.324144,0.496099,1),
vec4(0.400000),vec4(0.020203,0.413439,0.413325,1),vec4(0.020203,0.413439,0.413325,1),
vec4(0.466667),vec4(0.023715,0.496955,0.324599,1),vec4(0.023715,0.496955,0.324599,1),
vec4(0.533333),vec4(0.028189,0.579444,0.183448,1),vec4(0.028189,0.579444,0.183448,1),
vec4(0.600000),vec4(0.058795,0.658827,0.031752,1),vec4(0.058795,0.658827,0.031752,1),
vec4(0.666667),vec4(0.247030,0.729413,0.035074,1),vec4(0.247030,0.729413,0.035074,1),
vec4(0.733333),vec4(0.520198,0.779100,0.037844,1),vec4(0.520198,0.779100,0.037844,1),
vec4(0.800000),vec4(0.804790,0.803800,0.038931,1),vec4(0.804790,0.803800,0.038931,1),
vec4(0.866667),vec4(0.982773,0.824714,0.639575,1),vec4(0.982773,0.824714,0.639575,1),
vec4(0.933333),vec4(0.993888,0.907882,0.874370,1),vec4(0.993888,0.907882,0.874370,1),
vec4(1.000000),vec4(1,1,1,1),vec4(1,1,1,1),
]};

const extkindlman_16 =
{
    name:'ext kindlman 16',
    data: [
vec4(0.000000),vec4(0,0,0,1),vec4(0,0,0,1),
vec4(0.066667),vec4(0,0,0,1),vec4(0.114622,0.012117,0.254301,1),
vec4(0.133333),vec4(0.114622,0.012117,0.254301,1),vec4(0.032722,0.022252,0.466354,1),
vec4(0.200000),vec4(0.032722,0.022252,0.466354,1),vec4(0.016370,0.193452,0.340869,1),
vec4(0.266667),vec4(0.016370,0.193452,0.340869,1),vec4(0.013577,0.281313,0.239592,1),
vec4(0.333333),vec4(0.013577,0.281313,0.239592,1),vec4(0.017506,0.359608,0.103056,1),
vec4(0.400000),vec4(0.017506,0.359608,0.103056,1),vec4(0.088086,0.430359,0.020766,1),
vec4(0.466667),vec4(0.088086,0.430359,0.020766,1),vec4(0.345901,0.475652,0.022699,1),
vec4(0.533333),vec4(0.345901,0.475652,0.022699,1),vec4(0.647380,0.471951,0.031044,1),
vec4(0.600000),vec4(0.647380,0.471951,0.031044,1),vec4(0.963164,0.38293,0.227509,1),
vec4(0.666667),vec4(0.963164,0.38293,0.227509,1),vec4(0.9756180,0.489413,0.530265,1),
vec4(0.733333),vec4(0.975618,0.489413,0.530265,1),vec4(0.979247,0.564484,0.884151,1),
vec4(0.800000),vec4(0.979247,0.564484,0.884151,1),vec4(0.882321,0.714077,0.986233,1),
vec4(0.866667),vec4(0.882321,0.714077,0.986233,1),vec4(0.890857,0.82071,0.991331,1),
vec4(0.933333),vec4(0.890857,0.820710,0.991331,1),vec4(0.915472,0.919226,0.995941,1),
vec4(1.000000),vec4(0.915472,0.919226,0.995941,1),vec4(1,1,1,1),
]};
    
const violet_green_16 = {    
    name:'violet green 16',
    data: [
vec4(0.000000),vec4(0.203922,0.047059,0.552941,1),vec4(0.203922,0.047059,0.552941,1),
vec4(0.066667),vec4(0.203922,0.047059,0.552941,1),vec4(0.423529,0.172549,0.654902,1),
vec4(0.133333),vec4(0.423529,0.172549,0.654902,1),vec4(0.603922,0.301961,0.741176,1),
vec4(0.200000),vec4(0.603922,0.301961,0.741176,1),vec4(0.74902,0.431373,0.807843,1),
vec4(0.266667),vec4(0.74902,0.431373,0.807843,1),vec4(0.858824,0.556863,0.854902,1),
vec4(0.333333),vec4(0.858824,0.556863,0.854902,1),vec4(0.92549,0.670588,0.878431,1),
vec4(0.400000),vec4(0.92549,0.670588,0.878431,1),vec4(0.941176,0.764706,0.886275,1),
vec4(0.466667),vec4(0.941176,0.764706,0.886275,1),vec4(0.901961,0.839216,0.87451,1),
vec4(0.533333),vec4(0.901961,0.839216,0.87451,1),vec4(0.823529,0.870588,0.847059,1),
vec4(0.600000),vec4(0.823529,0.870588,0.847059,1),vec4(0.737255,0.866667,0.788235,1),
vec4(0.666667),vec4(0.737255,0.866667,0.788235,1),vec4(0.647059,0.843137,0.713726,1),
vec4(0.733333),vec4(0.647059,0.843137,0.713726,1),vec4(0.556863,0.807843,0.623529,1),
vec4(0.800000),vec4(0.556863,0.807843,0.623529,1),vec4(0.466667,0.756863,0.517647,1),
vec4(0.866667),vec4(0.466667,0.756863,0.517647,1),vec4(0.376471,0.694118,0.403922,1),
vec4(0.933333),vec4(0.376471,0.694118,0.403922,1),vec4(0.286275,0.619608,0.278431,1),
vec4(1.000000),vec4(0.286275,0.619608,0.278431,1),vec4(0.196078,0.541176,0.145098,1),
]};

const violet_green_10 = {    
    name:'violet green 10',
    data: [
vec4(0.0),vec4(0.203922,0.047059,0.552941,1),vec4(0.203922,0.047059,0.552941,1),
vec4(0.1),vec4(0.423529,0.172549,0.654902,1),vec4(0.603922,0.301961,0.741176,1),
vec4(0.2),vec4(0.74902,0.431373,0.807843,1),vec4(0.858824,0.556863,0.854902,1),
vec4(0.3),vec4(0.92549,0.670588,0.878431,1),vec4(0.941176,0.764706,0.886275,1),
vec4(0.4),vec4(0.901961,0.839216,0.87451,1),vec4(0.823529,0.870588,0.847059,1),
vec4(0.5),vec4(0.737255,0.866667,0.788235,1),vec4(0.647059,0.843137,0.713726,1),
vec4(0.6),vec4(0.647059,0.843137,0.713726,1),vec4(0.556863,0.807843,0.623529,1),
vec4(0.7),vec4(0.556863,0.807843,0.623529,1),vec4(0.466667,0.756863,0.517647,1),
vec4(0.8),vec4(0.466667,0.756863,0.517647,1),vec4(0.376471,0.694118,0.403922,1),
vec4(0.9),vec4(0.376471,0.694118,0.403922,1),vec4(0.286275,0.619608,0.278431,1),
vec4(1.0),vec4(0.286275,0.619608,0.278431,1),vec4(0.196078,0.541176,0.145098,1),
]};


const blue_yellow_10_ = 
{
    "Name" : "blue yellow 10",
    "RGBPoints" : [
    0.000000, 0.035294, 0.184314, 0.298039,
    0.111111, 0.129412, 0.313726, 0.466667,
    0.222222, 0.235294, 0.435294, 0.603922,
    0.333333, 0.349020, 0.545098, 0.705882,
    0.444444, 0.470588, 0.643137, 0.768627,
    0.555556, 0.584314, 0.729412, 0.796078,
    0.666667, 0.690196, 0.803922, 0.792157,
    0.777778, 0.788235, 0.870588, 0.768627,
    0.888889, 0.874510, 0.929412, 0.721569,
    1.000000, 0.952941, 0.980392, 0.658824
    ]
}

const helix_1_ = 
{
"Name" : "helix 1",
"RGBPoints" : [
0.000000, 0.058824, 0.019608, 0.023529,
0.066667, 0.152941, 0.078431, 0.023529,
0.133333, 0.180392, 0.172549, 0.015686,
0.200000, 0.152941, 0.282353, 0.054902,
0.266667, 0.113725, 0.384314, 0.176471,
0.333333, 0.121569, 0.450980, 0.368627,
0.400000, 0.211765, 0.474510, 0.572549,
0.466667, 0.380392, 0.466667, 0.725490,
0.533333, 0.584314, 0.454902, 0.788235,
0.600000, 0.764706, 0.474510, 0.760784,
0.666667, 0.874510, 0.541176, 0.678431,
0.733333, 0.901961, 0.647059, 0.615686,
0.800000, 0.870588, 0.764706, 0.615686,
0.866667, 0.843137, 0.870588, 0.701961,
0.933333, 0.858824, 0.945098, 0.835294,
1.000000, 0.941176, 0.984314, 0.960784
]
}

const helix_2_ = 
{
"Name" : "Helix 2",
"RGBPoints" : [
0.000000, 0.031373, 0.007843, 0.011765,
0.032258, 0.078431, 0.039216, 0.007843,
0.064516, 0.090196, 0.086275, 0.000000,
0.096774, 0.070588, 0.145098, 0.015686,
0.129032, 0.039216, 0.203922, 0.078431,
0.161290, 0.031373, 0.239216, 0.188235,
0.193548, 0.070588, 0.247059, 0.313726,
0.225806, 0.168627, 0.231373, 0.419608,
0.258065, 0.305882, 0.207843, 0.466667,
0.290323, 0.443137, 0.196078, 0.439216,
0.322581, 0.541176, 0.215686, 0.352941,
0.354839, 0.568627, 0.274510, 0.243137,
0.387097, 0.517647, 0.368627, 0.160784,
0.419355, 0.419608, 0.474510, 0.156863,
0.451613, 0.313726, 0.560784, 0.247059,
0.483871, 0.254902, 0.615686, 0.407843,
0.516129, 0.274510, 0.623529, 0.596078,
0.548387, 0.376471, 0.596078, 0.756863,
0.580645, 0.533333, 0.549020, 0.843137,
0.612903, 0.701961, 0.517647, 0.835294,
0.645161, 0.831373, 0.521569, 0.756863,
0.677419, 0.890196, 0.564706, 0.647059,
0.709677, 0.870588, 0.643137, 0.560784,
0.741935, 0.803922, 0.737255, 0.533333,
0.774194, 0.729412, 0.819608, 0.580392,
0.806452, 0.682353, 0.874510, 0.686275,
0.838710, 0.690196, 0.901961, 0.811765,
0.870968, 0.749020, 0.901961, 0.921569,
0.903226, 0.839216, 0.898039, 0.984314,
0.935484, 0.921569, 0.905882, 1.000000,
0.967742, 0.976471, 0.933333, 0.992157,
1.000000, 1.000000, 0.976471, 0.988235
]
}
const violet_yellow_10_ = 

{
"Name" : "violet yellow 10",
"RGBPoints" : [
0.000000, 0.294118, 0.109804, 0.505882,
0.111111, 0.545098, 0.380392, 0.815686,
0.222222, 0.713726, 0.623529, 0.929412,
0.333333, 0.839216, 0.807843, 0.980392,
0.444444, 0.933333, 0.949020, 1.000000,
0.555556, 0.984314, 0.960784, 0.698039,
0.666667, 0.878431, 0.843137, 0.431373,
0.777778, 0.717647, 0.686275, 0.250980,
0.888889, 0.501961, 0.478431, 0.117647,
1.000000, 0.235294, 0.223529, 0.011765
]
}


const violet_orange_1_ = 
{
"Name" : "violet-orange 1",
"NanColor" : [ -1, -1, -1 ],
"RGBPoints" : [
0./15., 0.921569, 0.917647, 1.000000,
1./15., 0.776471, 0.768627, 1.000000,
2./15., 0.639216, 0.623529, 0.945098,
3./15., 0.498039, 0.482353, 0.890196,
4./15., 0.372549, 0.352941, 0.756863,
5./15., 0.266667, 0.250980, 0.552941,
6./15., 0.164706, 0.152941, 0.356863,
7./15., 0.070588, 0.062745, 0.180392,
8./15., 0.141176, 0.054902, 0.003922,
9./15., 0.290196, 0.137255, 0.015686,
10./15., 0.450980, 0.231373, 0.043137,
11./15., 0.623529, 0.325490, 0.074510,
12./15., 0.768627, 0.447059, 0.250980,
13./15., 0.870588, 0.592157, 0.462745,
14./15., 0.964706, 0.741176, 0.650980,
15./15., 1.000000, 0.898039, 0.839216,
]
}


const violet_orange_2_ =  
{
"Name" : "violet-orange 2",
"RGBPoints" : [
0./15., 0.956863, 0.956863, 0.992157,
1./15., 0.882353, 0.882353, 0.976471,
2./15., 0.800000, 0.800000, 0.952941,
3./15., 0.698039, 0.698039, 0.925490,
4./15., 0.576471, 0.576471, 0.886275,
5./15., 0.431373, 0.431373, 0.843137,
6./15., 0.250980, 0.247059, 0.788235,
7./15., 0.074510, 0.066667, 0.533333,
8./15., 0.278431, 0.121569, 0.003922,
9./15., 0.521569, 0.254902, 0.054902,
10./15., 0.733333, 0.380392, 0.137255,
11./15., 0.901961, 0.498039, 0.262745,
12./15., 0.992157, 0.627451, 0.462745,
13./15., 1.000000, 0.745098, 0.639216,
14./15., 1.000000, 0.850980, 0.792157,
15./15., 1.000000, 0.941176, 0.921569,
]
};


const blue_yellow_10 = gen2cm(blue_yellow_10_, {name:'blue yellow 10'});
const helix_1 = gen2cm(helix_1_, {name:'helix 1'});
const helix_2 = gen2cm(helix_2_, {name:'helix 2'});
const violet_yellow_10 = gen2cm(violet_yellow_10_,{});
const violet_orange_1 = gen2cm(violet_orange_1_,{});
const violet_orange_2 = gen2cm(violet_orange_2_,{});

let getColormap = (name)=> {return colormaps[name];}


const colormapsArray = [
    red_blue2,    
    red_blue,
    red_green,
    black_red,
    colormap_rainbow,
    colormap_band2,
    colormap_band12,
    cold_hot,
    inferno8_smooth,
    kindlman_16,
    extkindlman_16,
    violet_green_10,
    violet_green_16,
    violet_yellow_10,
    violet_orange_1,
    violet_orange_2,
    blue_yellow_10,
    helix_2,
    helix_1,
];

const defaultColormap = colormap_band12;

const colormapNames = getNamesArray(colormapsArray);
const colormaps = array2object(colormapsArray);


const CMfragmentsName = 'Colormaps2Fragments';

const Fragments = {
    name: CMfragmentsName,
    getName:  ()=>{return CMfragmentsName;},
    
    'colormap': ColormapFragments.cm_fragment,
    
}
const shader_cm = {obj: Fragments, id: 'colormap'}
const shaders = {
    'colormap': shader_cm
};


export const Colormaps2 =  {
    shaders: shaders,
    getNames:    ()=>{return colormapNames;},
    getColormap: getColormap,
    getColormapTexture: getColormapTexture,
    getWrapValue: (name)=>{return (name === 'repeat') ? (0):(1);},
    wrapNames: ['clamp', 'repeat'],
    
}
