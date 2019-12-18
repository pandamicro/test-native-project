(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* Blob.js
 * A Blob implementation.
 * 2017-11-15
 *
 * By Eli Grey, http://eligrey.com
 * By Devin Samarin, https://github.com/dsamarin
 * License: MIT
 *   See https://github.com/eligrey/Blob.js/blob/master/LICENSE.md
 */

/*global self, unescape */
/*jslint bitwise: true, regexp: true, confusion: true, es5: true, vars: true, white: true,
  plusplus: true */

/*! @source http://purl.eligrey.com/github/Blob.js/blob/master/Blob.js */

(function (global) {
	(function (factory) {
		if (typeof define === "function" && define.amd) {
			// AMD. Register as an anonymous module.
			define(["exports"], factory);
		} else if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === "object" && typeof exports.nodeName !== "string") {
			// CommonJS
			factory(exports);
		} else {
			// Browser globals
			factory(global);
		}
	})(function (exports) {
		"use strict";

		exports.URL = global.URL || global.webkitURL;

		if (global.Blob && global.URL) {
			try {
				new Blob();
				return;
			} catch (e) {}
		}

		// Internally we use a BlobBuilder implementation to base Blob off of
		// in order to support older browsers that only have BlobBuilder
		var BlobBuilder = global.BlobBuilder || global.WebKitBlobBuilder || global.MozBlobBuilder || function () {
			var get_class = function get_class(object) {
				return Object.prototype.toString.call(object).match(/^\[object\s(.*)\]$/)[1];
			},
			    FakeBlobBuilder = function BlobBuilder() {
				this.data = [];
			},
			    FakeBlob = function Blob(data, type, encoding) {
				this.data = data;
				this.size = data.length;
				this.type = type;
				this.encoding = encoding;
			},
			    FBB_proto = FakeBlobBuilder.prototype,
			    FB_proto = FakeBlob.prototype,
			    FileReaderSync = global.FileReaderSync,
			    FileException = function FileException(type) {
				this.code = this[this.name = type];
			},
			    file_ex_codes = ("NOT_FOUND_ERR SECURITY_ERR ABORT_ERR NOT_READABLE_ERR ENCODING_ERR " + "NO_MODIFICATION_ALLOWED_ERR INVALID_STATE_ERR SYNTAX_ERR").split(" "),
			    file_ex_code = file_ex_codes.length,
			    real_URL = global.URL || global.webkitURL || exports,
			    real_create_object_URL = real_URL.createObjectURL,
			    real_revoke_object_URL = real_URL.revokeObjectURL,
			    URL = real_URL,
			    btoa = global.btoa,
			    atob = global.atob,
			    ArrayBuffer = global.ArrayBuffer,
			    Uint8Array = global.Uint8Array,
			    origin = /^[\w-]+:\/*\[?[\w\.:-]+\]?(?::[0-9]+)?/;
			FakeBlob.fake = FB_proto.fake = true;
			while (file_ex_code--) {
				FileException.prototype[file_ex_codes[file_ex_code]] = file_ex_code + 1;
			}
			// Polyfill URL
			if (!real_URL.createObjectURL) {
				URL = exports.URL = function (uri) {
					var uri_info = document.createElementNS("http://www.w3.org/1999/xhtml", "a"),
					    uri_origin;
					uri_info.href = uri;
					if (!("origin" in uri_info)) {
						if (uri_info.protocol.toLowerCase() === "data:") {
							uri_info.origin = null;
						} else {
							uri_origin = uri.match(origin);
							uri_info.origin = uri_origin && uri_origin[1];
						}
					}
					return uri_info;
				};
			}
			URL.createObjectURL = function (blob) {
				var type = blob.type,
				    data_URI_header;
				if (type === null) {
					type = "application/octet-stream";
				}
				if (blob instanceof FakeBlob) {
					data_URI_header = "data:" + type;
					if (blob.encoding === "base64") {
						return data_URI_header + ";base64," + blob.data;
					} else if (blob.encoding === "URI") {
						return data_URI_header + "," + decodeURIComponent(blob.data);
					}if (btoa) {
						return data_URI_header + ";base64," + btoa(blob.data);
					} else {
						return data_URI_header + "," + encodeURIComponent(blob.data);
					}
				} else if (real_create_object_URL) {
					return real_create_object_URL.call(real_URL, blob);
				}
			};
			URL.revokeObjectURL = function (object_URL) {
				if (object_URL.substring(0, 5) !== "data:" && real_revoke_object_URL) {
					real_revoke_object_URL.call(real_URL, object_URL);
				}
			};
			FBB_proto.append = function (data /*, endings*/) {
				var bb = this.data;
				// decode data to a binary string
				if (Uint8Array && (data instanceof ArrayBuffer || data instanceof Uint8Array)) {
					var str = "",
					    buf = new Uint8Array(data),
					    i = 0,
					    buf_len = buf.length;
					for (; i < buf_len; i++) {
						str += String.fromCharCode(buf[i]);
					}
					bb.push(str);
				} else if (get_class(data) === "Blob" || get_class(data) === "File") {
					if (FileReaderSync) {
						var fr = new FileReaderSync();
						bb.push(fr.readAsBinaryString(data));
					} else {
						// async FileReader won't work as BlobBuilder is sync
						throw new FileException("NOT_READABLE_ERR");
					}
				} else if (data instanceof FakeBlob) {
					if (data.encoding === "base64" && atob) {
						bb.push(atob(data.data));
					} else if (data.encoding === "URI") {
						bb.push(decodeURIComponent(data.data));
					} else if (data.encoding === "raw") {
						bb.push(data.data);
					}
				} else {
					if (typeof data !== "string") {
						data += ""; // convert unsupported types to strings
					}
					// decode UTF-16 to binary string
					bb.push(unescape(encodeURIComponent(data)));
				}
			};
			FBB_proto.getBlob = function (type) {
				if (!arguments.length) {
					type = null;
				}
				return new FakeBlob(this.data.join(""), type, "raw");
			};
			FBB_proto.toString = function () {
				return "[object BlobBuilder]";
			};
			FB_proto.slice = function (start, end, type) {
				var args = arguments.length;
				if (args < 3) {
					type = null;
				}
				return new FakeBlob(this.data.slice(start, args > 1 ? end : this.data.length), type, this.encoding);
			};
			FB_proto.toString = function () {
				return "[object Blob]";
			};
			FB_proto.close = function () {
				this.size = 0;
				delete this.data;
			};
			return FakeBlobBuilder;
		}();

		exports.Blob = function (blobParts, options) {
			var type = options ? options.type || "" : "";
			var builder = new BlobBuilder();
			if (blobParts) {
				for (var i = 0, len = blobParts.length; i < len; i++) {
					if (Uint8Array && blobParts[i] instanceof Uint8Array) {
						builder.append(blobParts[i].buffer);
					} else {
						builder.append(blobParts[i]);
					}
				}
			}
			var blob = builder.getBlob(type);
			if (!blob.slice && blob.webkitSlice) {
				blob.slice = blob.webkitSlice;
			}
			return blob;
		};

		var getPrototypeOf = Object.getPrototypeOf || function (object) {
			return object.__proto__;
		};
		exports.Blob.prototype = getPrototypeOf(new exports.Blob());
	});
})(typeof self !== "undefined" && self || typeof window !== "undefined" && window || typeof global !== "undefined" && global || undefined.content || undefined);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
"use strict";

!function () {
  function e(e) {
    this.message = e;
  }var t = "undefined" != typeof exports ? exports : "undefined" != typeof self ? self : $.global,
      r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";e.prototype = new Error(), e.prototype.name = "InvalidCharacterError", t.btoa || (t.btoa = function (t) {
    for (var o, n, a = String(t), i = 0, f = r, c = ""; a.charAt(0 | i) || (f = "=", i % 1); c += f.charAt(63 & o >> 8 - i % 1 * 8)) {
      if (n = a.charCodeAt(i += .75), n > 255) throw new e("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");o = o << 8 | n;
    }return c;
  }), t.atob || (t.atob = function (t) {
    var o = String(t).replace(/[=]+$/, "");if (o.length % 4 == 1) throw new e("'atob' failed: The string to be decoded is not correctly encoded.");for (var n, a, i = 0, f = 0, c = ""; a = o.charAt(f++); ~a && (n = i % 4 ? 64 * n + a : a, i++ % 4) ? c += String.fromCharCode(255 & n >> (-2 * i & 6)) : 0) {
      a = r.indexOf(a);
    }return c;
  });
}();

},{}],3:[function(require,module,exports){
'use strict';

var GL_COMMAND_ACTIVE_TEXTURE = 0;
var GL_COMMAND_ATTACH_SHADER = 1;
var GL_COMMAND_BIND_ATTRIB_LOCATION = 2;
var GL_COMMAND_BIND_BUFFER = 3;
var GL_COMMAND_BIND_FRAME_BUFFER = 4;
var GL_COMMAND_BIND_RENDER_BUFFER = 5;
var GL_COMMAND_BIND_TEXTURE = 6;
var GL_COMMAND_BLEND_COLOR = 7;
var GL_COMMAND_BLEND_EQUATION = 8;
var GL_COMMAND_BLEND_EQUATION_SEPARATE = 9;
var GL_COMMAND_BLEND_FUNC = 10;
var GL_COMMAND_BLEND_FUNC_SEPARATE = 11;
var GL_COMMAND_BUFFER_DATA = 12;
var GL_COMMAND_BUFFER_SUB_DATA = 13;
var GL_COMMAND_CLEAR = 14;
var GL_COMMAND_CLEAR_COLOR = 15;
var GL_COMMAND_CLEAR_DEPTH = 16;
var GL_COMMAND_CLEAR_STENCIL = 17;
var GL_COMMAND_COLOR_MASK = 18;
var GL_COMMAND_COMMIT = 19;
var GL_COMMAND_COMPILE_SHADER = 20;
var GL_COMMAND_COMPRESSED_TEX_IMAGE_2D = 21;
var GL_COMMAND_COMPRESSED_TEX_SUB_IMAGE_2D = 22;
var GL_COMMAND_COPY_TEX_IMAGE_2D = 23;
var GL_COMMAND_COPY_TEX_SUB_IMAGE_2D = 24;
var GL_COMMAND_CULL_FACE = 25;
var GL_COMMAND_DELETE_BUFFER = 26;
var GL_COMMAND_DELETE_FRAME_BUFFER = 27;
var GL_COMMAND_DELETE_PROGRAM = 28;
var GL_COMMAND_DELETE_RENDER_BUFFER = 29;
var GL_COMMAND_DELETE_SHADER = 30;
var GL_COMMAND_DELETE_TEXTURE = 31;
var GL_COMMAND_DEPTH_FUNC = 32;
var GL_COMMAND_DEPTH_MASK = 33;
var GL_COMMAND_DEPTH_RANGE = 34;
var GL_COMMAND_DETACH_SHADER = 35;
var GL_COMMAND_DISABLE = 36;
var GL_COMMAND_DISABLE_VERTEX_ATTRIB_ARRAY = 37;
var GL_COMMAND_DRAW_ARRAYS = 38;
var GL_COMMAND_DRAW_ELEMENTS = 39;
var GL_COMMAND_ENABLE = 40;
var GL_COMMAND_ENABLE_VERTEX_ATTRIB_ARRAY = 41;
var GL_COMMAND_FINISH = 42;
var GL_COMMAND_FLUSH = 43;
var GL_COMMAND_FRAME_BUFFER_RENDER_BUFFER = 44;
var GL_COMMAND_FRAME_BUFFER_TEXTURE_2D = 45;
var GL_COMMAND_FRONT_FACE = 46;
var GL_COMMAND_GENERATE_MIPMAP = 47;
var GL_COMMAND_HINT = 48;
var GL_COMMAND_LINE_WIDTH = 49;
var GL_COMMAND_LINK_PROGRAM = 50;
var GL_COMMAND_PIXEL_STOREI = 51;
var GL_COMMAND_POLYGON_OFFSET = 52;
var GL_COMMAND_RENDER_BUFFER_STORAGE = 53;
var GL_COMMAND_SAMPLE_COVERAGE = 54;
var GL_COMMAND_SCISSOR = 55;
var GL_COMMAND_SHADER_SOURCE = 56;
var GL_COMMAND_STENCIL_FUNC = 57;
var GL_COMMAND_STENCIL_FUNC_SEPARATE = 58;
var GL_COMMAND_STENCIL_MASK = 59;
var GL_COMMAND_STENCIL_MASK_SEPARATE = 60;
var GL_COMMAND_STENCIL_OP = 61;
var GL_COMMAND_STENCIL_OP_SEPARATE = 62;
var GL_COMMAND_TEX_IMAGE_2D = 63;
var GL_COMMAND_TEX_PARAMETER_F = 64;
var GL_COMMAND_TEX_PARAMETER_I = 65;
var GL_COMMAND_TEX_SUB_IMAGE_2D = 66;
var GL_COMMAND_UNIFORM_1F = 67;
var GL_COMMAND_UNIFORM_1FV = 68;
var GL_COMMAND_UNIFORM_1I = 69;
var GL_COMMAND_UNIFORM_1IV = 70;
var GL_COMMAND_UNIFORM_2F = 71;
var GL_COMMAND_UNIFORM_2FV = 72;
var GL_COMMAND_UNIFORM_2I = 73;
var GL_COMMAND_UNIFORM_2IV = 74;
var GL_COMMAND_UNIFORM_3F = 75;
var GL_COMMAND_UNIFORM_3FV = 76;
var GL_COMMAND_UNIFORM_3I = 77;
var GL_COMMAND_UNIFORM_3IV = 78;
var GL_COMMAND_UNIFORM_4F = 79;
var GL_COMMAND_UNIFORM_4FV = 80;
var GL_COMMAND_UNIFORM_4I = 81;
var GL_COMMAND_UNIFORM_4IV = 82;
var GL_COMMAND_UNIFORM_MATRIX_2FV = 83;
var GL_COMMAND_UNIFORM_MATRIX_3FV = 84;
var GL_COMMAND_UNIFORM_MATRIX_4FV = 85;
var GL_COMMAND_USE_PROGRAM = 86;
var GL_COMMAND_VALIDATE_PROGRAM = 87;
var GL_COMMAND_VERTEX_ATTRIB_1F = 88;
var GL_COMMAND_VERTEX_ATTRIB_2F = 89;
var GL_COMMAND_VERTEX_ATTRIB_3F = 90;
var GL_COMMAND_VERTEX_ATTRIB_4F = 91;
var GL_COMMAND_VERTEX_ATTRIB_1FV = 92;
var GL_COMMAND_VERTEX_ATTRIB_2FV = 93;
var GL_COMMAND_VERTEX_ATTRIB_3FV = 94;
var GL_COMMAND_VERTEX_ATTRIB_4FV = 95;
var GL_COMMAND_VERTEX_ATTRIB_POINTER = 96;
var GL_COMMAND_VIEW_PORT = 97;

var gl = __gl;

// _gl save the orignal gl functions.
var _gl = {};
for (var k in gl) {
    _gl[k] = gl[k];
}

var total_size = 100000;
var next_index = 0;
var buffer_data;
var commandCount = 0;

// Batch GL commands is enabled by default.
function batchGLCommandsToNative() {
    if (gl._flushCommands) {
        if (isSupportTypeArray()) {
            console.log('Enable batch GL commands optimization!');
            attachMethodOpt();
            buffer_data = new Float32Array(total_size);
        } else {
            console.log('Disable batch GL commands, TypedArray Native API isn\'t supported!');
        }
    } else {
        console.log('Disable batch GL commands, _flushCommands isn\'t binded!');
    }
}

function disableBatchGLCommandsToNative() {
    // Reset __gl variable to the default one.
    flushCommands();
    for (var k in _gl) {
        __gl[k] = _gl[k];
    }
    console.log('Disable batch GL commands optimization！');
    jsb.disableBatchGLCommandsToNative();
}

function flushCommands() {
    if (next_index > 0) {
        gl._flushCommands(next_index, buffer_data, commandCount);
        next_index = 0;
        commandCount = 0;
    }
}

function activeTextureOpt(texture) {
    // console.log('GLOpt: activeTexture');
    if (next_index + 2 > total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_ACTIVE_TEXTURE;
    buffer_data[next_index + 1] = texture;
    next_index += 2;
    ++commandCount;
}

function attachShaderOpt(program, shader) {
    // console.log('GLOpt: attachShader');
    if (next_index + 3 > total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_ATTACH_SHADER;
    buffer_data[next_index + 1] = program ? program._id : 0;
    buffer_data[next_index + 2] = shader ? shader._id : 0;
    next_index += 3;
    ++commandCount;
}

function bindAttribLocationOpt(program, index, name) {
    // console.log('GLOpt: bindAttribLocation');
    flushCommands();
    _gl.bindAttribLocation(program, index, name);
}

function bindBufferOpt(target, buffer) {
    // console.log('GLOpt: bindBuffer: ' + (buffer? buffer._id : null));
    if (next_index + 3 > total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_BIND_BUFFER;
    buffer_data[next_index + 1] = target;
    buffer_data[next_index + 2] = buffer ? buffer._id : 0;
    next_index += 3;
    ++commandCount;
}

function bindFramebufferOpt(target, framebuffer) {
    // console.log('GLOpt: bindFramebuffer');
    if (next_index + 3 > total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_BIND_FRAME_BUFFER;
    buffer_data[next_index + 1] = target;
    buffer_data[next_index + 2] = framebuffer ? framebuffer._id : 0;
    next_index += 3;
    ++commandCount;
}

function bindRenderbufferOpt(target, renderbuffer) {
    // console.log('GLOpt: bindRenderbuffer');
    if (next_index + 3 > total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_BIND_RENDER_BUFFER;
    buffer_data[next_index + 1] = target;
    buffer_data[next_index + 2] = renderbuffer ? renderbuffer._id : 0;
    next_index += 3;
    ++commandCount;
}

function bindTextureOpt(target, texture) {
    // console.log('GLOpt: bindTexture');
    if (next_index + 3 > total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_BIND_TEXTURE;
    buffer_data[next_index + 1] = target;
    buffer_data[next_index + 2] = texture ? texture._id : 0;
    next_index += 3;
    ++commandCount;
}

function blendColorOpt(red, green, blue, alpha) {
    // console.log('GLOpt: blendColor');
    if (next_index + 5 > total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_BLEND_COLOR;
    buffer_data[next_index + 1] = red;
    buffer_data[next_index + 2] = green;
    buffer_data[next_index + 3] = blue;
    buffer_data[next_index + 4] = alpha;
    next_index += 5;
    ++commandCount;
}

function blendEquationOpt(mode) {
    // console.log('GLOpt: blendEquation');
    if (next_index + 2 > total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_BLEND_EQUATION;
    buffer_data[next_index + 1] = mode;
    next_index += 2;
    ++commandCount;
}

function blendEquationSeparateOpt(modeRGB, modeAlpha) {
    // console.log('GLOpt: blendEquationSeparate');
    if (next_index + 3 > total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_BLEND_EQUATION_SEPARATE;
    buffer_data[next_index + 1] = modeRGB;
    buffer_data[next_index + 2] = modeAlpha;
    next_index += 3;
    ++commandCount;
}

function blendFuncOpt(sfactor, dfactor) {
    // console.log('GLOpt: blendFunc');
    if (next_index + 3 > total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_BLEND_FUNC;
    buffer_data[next_index + 1] = sfactor;
    buffer_data[next_index + 2] = dfactor;
    next_index += 3;
    ++commandCount;
}

function blendFuncSeparateOpt(srcRGB, dstRGB, srcAlpha, dstAlpha) {
    // console.log('GLOpt: blendFuncSeparate');
    if (next_index + 5 > total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_BLEND_FUNC_SEPARATE;
    buffer_data[next_index + 1] = srcRGB;
    buffer_data[next_index + 2] = dstRGB;
    buffer_data[next_index + 3] = srcAlpha;
    buffer_data[next_index + 4] = dstAlpha;
    next_index += 5;
    ++commandCount;
}

function bufferDataOpt(target, data, usage) {
    flushCommands();
    // console.log('GLOpt: bufferData');
    _gl.bufferData(target, data, usage);
}

function bufferSubDataOpt(target, offset, data) {
    flushCommands();
    // console.log('GLOpt: bufferSubData');
    _gl.bufferSubData(target, offset, data);
}

function checkFramebufferStatusOpt(target) {
    flushCommands();
    // console.log('GLOpt: checkFramebufferStatus');
    return _gl.checkFramebufferStatus(target);
}

function clearOpt(mask) {
    // console.log('GLOpt: clear');
    if (next_index + 2 > total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_CLEAR;
    buffer_data[next_index + 1] = mask;
    next_index += 2;
    ++commandCount;
}

function clearColorOpt(red, green, blue, alpha) {
    // console.log('GLOpt: clearColor');
    if (next_index + 5 > total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_CLEAR_COLOR;
    buffer_data[next_index + 1] = red;
    buffer_data[next_index + 2] = green;
    buffer_data[next_index + 3] = blue;
    buffer_data[next_index + 4] = alpha;
    next_index += 5;
    ++commandCount;
}

function clearDepthOpt(depth) {
    // console.log('GLOpt: clearDepth');
    if (next_index + 2 > total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_CLEAR_DEPTH;
    buffer_data[next_index + 1] = depth;
    next_index += 2;
    ++commandCount;
}

function clearStencilOpt(s) {
    // console.log('GLOpt: clearStencil');
    if (next_index + 2 > total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_CLEAR_STENCIL;
    buffer_data[next_index + 1] = s;
    next_index += 2;
    ++commandCount;
}

function colorMaskOpt(red, green, blue, alpha) {
    // console.log('GLOpt: colorMask');
    if (next_index + 5 > total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_COLOR_MASK;
    buffer_data[next_index + 1] = red ? 1 : 0;
    buffer_data[next_index + 2] = green ? 1 : 0;
    buffer_data[next_index + 3] = blue ? 1 : 0;
    buffer_data[next_index + 4] = alpha ? 1 : 0;
    next_index += 5;
    ++commandCount;
}

function compileShaderOpt(shader) {
    // console.log('GLOpt: compileShader');
    if (next_index + 2 > total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_COMPILE_SHADER;
    buffer_data[next_index + 1] = shader ? shader._id : 0;
    next_index += 2;
    ++commandCount;
}

function compressedTexImage2DOpt(target, level, internalformat, width, height, border, data) {
    // console.log('GLOpt: compressedTexImage2D');
    flushCommands();
    _gl.compressedTexImage2D(target, level, internalformat, width, height, border, data);
}

function compressedTexSubImage2DOpt(target, level, xoffset, yoffset, width, height, format, data) {
    // console.log('GLOpt: compressedTexSubImage2D');
    flushCommands();
    _gl.compressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, data);
}

function copyTexImage2DOpt(target, level, internalformat, x, y, width, height, border) {
    // console.log('GLOpt: copyTexImage2D');
    if (next_index + 9 > total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_COPY_TEX_IMAGE_2D;
    buffer_data[next_index + 1] = target;
    buffer_data[next_index + 2] = level;
    buffer_data[next_index + 3] = internalformat;
    buffer_data[next_index + 4] = x;
    buffer_data[next_index + 5] = y;
    buffer_data[next_index + 6] = width;
    buffer_data[next_index + 7] = height;
    buffer_data[next_index + 8] = border;
    next_index += 9;
    ++commandCount;
}

function copyTexSubImage2DOpt(target, level, xoffset, yoffset, x, y, width, height) {
    // console.log('GLOpt: copyTexSubImage2D');
    if (next_index + 9 > total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_COPY_TEX_SUB_IMAGE_2D;
    buffer_data[next_index + 1] = target;
    buffer_data[next_index + 2] = level;
    buffer_data[next_index + 3] = xoffset;
    buffer_data[next_index + 4] = yoffset;
    buffer_data[next_index + 5] = x;
    buffer_data[next_index + 6] = y;
    buffer_data[next_index + 7] = width;
    buffer_data[next_index + 8] = height;
    next_index += 9;
    ++commandCount;
}

function createBufferOpt() {
    flushCommands();

    var ret = _gl.createBuffer();
    // console.log('GLOpt: createBuffer: ' + ret._id);
    return ret;
}

function createFramebufferOpt() {
    flushCommands();
    // console.log('GLOpt: createFramebuffer');
    return _gl.createFramebuffer();
}

function createProgramOpt() {
    flushCommands();
    // console.log('GLOpt: createProgram');
    return _gl.createProgram();
}

function createRenderbufferOpt() {
    flushCommands();
    // console.log('GLOpt: createRenderbuffer');
    return _gl.createRenderbuffer();
}

function createShaderOpt(type) {
    // console.log('GLOpt: createShader');
    flushCommands();
    return _gl.createShader(type);
}

function createTextureOpt() {
    flushCommands();
    // console.log('GLOpt: createTexture');
    return _gl.createTexture();
}

function cullFaceOpt(mode) {
    // console.log('GLOpt: cullFace');
    if (next_index + 2 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_CULL_FACE;
    buffer_data[next_index + 1] = mode;
    next_index += 2;
    ++commandCount;
}

function deleteBufferOpt(buffer) {
    // console.log('GLOpt: deleteBuffer');
    if (next_index + 2 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_DELETE_BUFFER;
    buffer_data[next_index + 1] = buffer ? buffer._id : 0;
    next_index += 2;
    ++commandCount;
}

function deleteFramebufferOpt(framebuffer) {
    // console.log('GLOpt: deleteFramebuffer');
    if (next_index + 2 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_DELETE_FRAME_BUFFER;
    buffer_data[next_index + 1] = framebuffer ? framebuffer._id : 0;
    next_index += 2;
    ++commandCount;
}

function deleteProgramOpt(program) {
    // console.log('GLOpt: deleteProgram');
    if (next_index + 2 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_DELETE_PROGRAM;
    buffer_data[next_index + 1] = program ? program._id : 0;
    next_index += 2;
    ++commandCount;
}

function deleteRenderbufferOpt(renderbuffer) {
    // console.log('GLOpt: deleteRenderbuffer');
    if (next_index + 2 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_DELETE_RENDER_BUFFER;
    buffer_data[next_index + 1] = renderbuffer ? renderbuffer._id : 0;
    next_index += 2;
    ++commandCount;
}

function deleteShaderOpt(shader) {
    // console.log('GLOpt: deleteShader');
    if (next_index + 2 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_DELETE_SHADER;
    buffer_data[next_index + 1] = shader ? shader._id : 0;
    next_index += 2;
    ++commandCount;
}

function deleteTextureOpt(texture) {
    // console.log('GLOpt: deleteTexture');
    if (next_index + 2 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_DELETE_TEXTURE;
    buffer_data[next_index + 1] = texture ? texture._id : 0;
    next_index += 2;
    ++commandCount;
}

function depthFuncOpt(func) {
    // console.log('GLOpt: depthFunc');
    if (next_index + 2 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_DEPTH_FUNC;
    buffer_data[next_index + 1] = func;
    next_index += 2;
    ++commandCount;
}

function depthMaskOpt(flag) {
    // console.log('GLOpt: depthMask');
    if (next_index + 2 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_DEPTH_MASK;
    buffer_data[next_index + 1] = flag ? 1 : 0;
    next_index += 2;
    ++commandCount;
}

function depthRangeOpt(zNear, zFar) {
    // console.log('GLOpt: depthRange');
    if (next_index + 3 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_DEPTH_RANGE;
    buffer_data[next_index + 1] = zNear;
    buffer_data[next_index + 2] = zFar;
    next_index += 3;
    ++commandCount;
}

function detachShaderOpt(program, shader) {
    // console.log('GLOpt: detachShader');
    if (next_index + 3 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_DETACH_SHADER;
    buffer_data[next_index + 1] = program ? program._id : 0;
    buffer_data[next_index + 2] = shader ? shader._id : 0;
    next_index += 3;
    ++commandCount;
}

function disableOpt(cap) {
    // console.log('GLOpt: disable');
    if (next_index + 2 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_DISABLE;
    buffer_data[next_index + 1] = cap;
    next_index += 2;
    ++commandCount;
}

function disableVertexAttribArrayOpt(index) {
    // console.log('GLOpt: disableVertexAttribArray');
    if (next_index + 2 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_DISABLE_VERTEX_ATTRIB_ARRAY;
    buffer_data[next_index + 1] = index;
    next_index += 2;
    ++commandCount;
}

function drawArraysOpt(mode, first, count) {
    // console.log('GLOpt: drawArrays');
    if (next_index + 4 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_DRAW_ARRAYS;
    buffer_data[next_index + 1] = mode;
    buffer_data[next_index + 2] = first;
    buffer_data[next_index + 3] = count;
    next_index += 4;
    ++commandCount;
}

function drawElementsOpt(mode, count, type, offset) {
    // console.log('GLOpt: drawElements');
    if (next_index + 5 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_DRAW_ELEMENTS;
    buffer_data[next_index + 1] = mode;
    buffer_data[next_index + 2] = count;
    buffer_data[next_index + 3] = type;
    buffer_data[next_index + 4] = offset ? offset : 0;
    next_index += 5;
    ++commandCount;
}

function enableOpt(cap) {
    // console.log('GLOpt: enable');
    if (next_index + 2 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_ENABLE;
    buffer_data[next_index + 1] = cap;
    next_index += 2;
    ++commandCount;
}

function enableVertexAttribArrayOpt(index) {
    // console.log('GLOpt: enableVertexAttribArray');
    if (next_index + 2 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_ENABLE_VERTEX_ATTRIB_ARRAY;
    buffer_data[next_index + 1] = index;
    next_index += 2;
    ++commandCount;
}

function finishOpt() {
    // console.log('GLOpt: finish');
    if (next_index + 1 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_FINISH;
    next_index += 1;
    ++commandCount;
}

function flushOpt() {
    // console.log('GLOpt: flush');
    if (next_index + 1 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_FLUSH;
    next_index += 1;
    ++commandCount;
}

function framebufferRenderbufferOpt(target, attachment, renderbuffertarget, renderbuffer) {
    // console.log('GLOpt: framebufferRenderbuffer');
    if (next_index + 5 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_FRAME_BUFFER_RENDER_BUFFER;
    buffer_data[next_index + 1] = target;
    buffer_data[next_index + 2] = attachment;
    buffer_data[next_index + 3] = renderbuffertarget;
    buffer_data[next_index + 4] = renderbuffer ? renderbuffer._id : 0;
    next_index += 5;
    ++commandCount;
}

function framebufferTexture2DOpt(target, attachment, textarget, texture, level) {
    // console.log('GLOpt: framebufferTexture2D');
    if (next_index + 6 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_FRAME_BUFFER_TEXTURE_2D;
    buffer_data[next_index + 1] = target;
    buffer_data[next_index + 2] = attachment;
    buffer_data[next_index + 3] = textarget;
    buffer_data[next_index + 4] = texture ? texture._id : 0;
    buffer_data[next_index + 5] = level;
    next_index += 6;
    ++commandCount;
}

function frontFaceOpt(mode) {
    // console.log('GLOpt: frontFace');
    if (next_index + 2 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_FRONT_FACE;
    buffer_data[next_index + 1] = mode;
    next_index += 2;
    ++commandCount;
}

function generateMipmapOpt(target) {
    // console.log('GLOpt: generateMipmap');
    if (next_index + 2 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_GENERATE_MIPMAP;
    buffer_data[next_index + 1] = target;
    next_index += 2;
    ++commandCount;
}

function getActiveAttribOpt(program, index) {
    // console.log('GLOpt: getActiveAttrib');
    flushCommands();
    return _gl.getActiveAttrib(program, index);
}

function getActiveUniformOpt(program, index) {
    // console.log('GLOpt: getActiveUniform');
    flushCommands();
    return _gl.getActiveUniform(program, index);
}

function getAttachedShadersOpt(program) {
    // console.log('GLOpt: getAttachedShaders');
    flushCommands();
    return _gl.getAttachedShaders(program);
}

function getAttribLocationOpt(program, name) {
    // console.log('GLOpt: getAttribLocation');
    flushCommands();
    return _gl.getAttribLocation(program, name);
}

function getBufferParameterOpt(target, pname) {
    // console.log('GLOpt: getBufferParameter');
    flushCommands();
    return _gl.getBufferParameter(target, pname);
}

function getParameterOpt(pname) {
    // console.log('GLOpt: getParameter');
    flushCommands();
    return _gl.getParameter(pname);
}

function getErrorOpt() {
    // console.log('GLOpt: getError');
    flushCommands();
    return _gl.getError();
}

function getFramebufferAttachmentParameterOpt(target, attachment, pname) {
    // console.log('GLOpt: getFramebufferAttachmentParameter');
    flushCommands();
    return _gl.getFramebufferAttachmentParameter(target, attachment, pname);
}

function getProgramParameterOpt(program, pname) {
    // console.log('GLOpt: getProgramParameter');
    flushCommands();
    return _gl.getProgramParameter(program, pname);
}

function getProgramInfoLogOpt(program) {
    // console.log('GLOpt: getProgramInfoLog');
    flushCommands();
    return _gl.getProgramInfoLog(program);
}

function getRenderbufferParameterOpt(target, pname) {
    // console.log('GLOpt: getRenderbufferParameter');
    flushCommands();
    return _gl.getRenderbufferParameter(target, pname);
}

function getShaderParameterOpt(shader, pname) {
    // console.log('GLOpt: getShaderParameter');
    flushCommands();
    return _gl.getShaderParameter(shader, pname);
}

function getShaderPrecisionFormatOpt(shadertype, precisiontype) {
    // console.log('GLOpt: getShaderPrecisionFormat');
    flushCommands();
    return _gl.getShaderPrecisionFormat(shadertype, precisiontype);
}

function getShaderInfoLogOpt(shader) {
    // console.log('GLOpt: getShaderInfoLog');
    flushCommands();
    return _gl.getShaderInfoLog(shader);
}

function getShaderSourceOpt(shader) {
    // console.log('GLOpt: getShaderSource');
    flushCommands();
    return _gl.getShaderSource(shader);
}

function getTexParameterOpt(target, pname) {
    // console.log('GLOpt: getTexParameter');
    flushCommands();
    return _gl.getTexParameter(target, pname);
}

function getUniformOpt(program, location) {
    // console.log('GLOpt: getUniform');
    flushCommands();
    return _gl.getUniform(program, location);
}

function getUniformLocationOpt(program, name) {
    // console.log('GLOpt: getUniformLocation');
    flushCommands();
    return _gl.getUniformLocation(program, name);
}

function getVertexAttribOpt(index, pname) {
    // console.log('GLOpt: getVertexAttrib');
    flushCommands();
    return _gl.getVertexAttrib(index, pname);
}

function getVertexAttribOffsetOpt(index, pname) {
    // console.log('GLOpt: getVertexAttribOffset');
    flushCommands();
    return _gl.getVertexAttribOffset(index, pname);
}

function hintOpt(target, mode) {
    // console.log('GLOpt: hint');
    if (next_index + 3 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_HINT;
    buffer_data[next_index + 1] = target;
    buffer_data[next_index + 2] = mode;
    next_index += 3;
    ++commandCount;
}

function isBufferOpt(buffer) {
    // console.log('GLOpt: isBuffer');
    flushCommands();
    return _gl.isBuffer(buffer);
}

function isEnabledOpt(cap) {
    // console.log('GLOpt: isEnabled');
    flushCommands();
    return _gl.isEnabled(cap);
}

function isFramebufferOpt(framebuffer) {
    // console.log('GLOpt: isFramebuffer');
    flushCommands();
    return _gl.isFramebuffer(framebuffer);
}

function isProgramOpt(program) {
    // console.log('GLOpt: isProgram');
    flushCommands();
    return _gl.isProgram(program);
}

function isRenderbufferOpt(renderbuffer) {
    // console.log('GLOpt: isRenderbuffer');
    flushCommands();
    return _gl.isRenderbuffer(renderbuffer);
}

function isShaderOpt(shader) {
    // console.log('GLOpt: isShader');
    flushCommands();
    return _gl.isShader(shader);
}

function isTextureOpt(texture) {
    // console.log('GLOpt: isTexture');
    flushCommands();
    return _gl.isTexture(texture);
}

function lineWidthOpt(width) {
    // console.log('GLOpt: lineWidth');
    if (next_index + 2 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_LINE_WIDTH;
    buffer_data[next_index + 1] = width;
    next_index += 2;
    ++commandCount;
}

function linkProgramOpt(program) {
    // console.log('GLOpt: linkProgram');
    if (next_index + 2 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_LINK_PROGRAM;
    buffer_data[next_index + 1] = program ? program._id : 0;
    next_index += 2;
    ++commandCount;
}

function pixelStoreiOpt(pname, param) {
    // console.log('GLOpt: pixelStorei');
    if (next_index + 3 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_PIXEL_STOREI;
    buffer_data[next_index + 1] = pname;
    buffer_data[next_index + 2] = param;
    next_index += 3;
    ++commandCount;
}

function polygonOffsetOpt(factor, units) {
    // console.log('GLOpt: polygonOffset');
    if (next_index + 3 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_POLYGON_OFFSET;
    buffer_data[next_index + 1] = factor;
    buffer_data[next_index + 2] = units;
    next_index += 3;
    ++commandCount;
}

function readPixelsOpt(x, y, width, height, format, type, pixels) {
    // console.log('GLOpt: readPixels');
    flushCommands();
    _gl.readPixels(x, y, width, height, format, type, pixels);
}

function renderbufferStorageOpt(target, internalFormat, width, height) {
    // console.log('GLOpt: renderbufferStorage');
    if (next_index + 5 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_RENDER_BUFFER_STORAGE;
    buffer_data[next_index + 1] = target;
    buffer_data[next_index + 2] = internalFormat;
    buffer_data[next_index + 3] = width;
    buffer_data[next_index + 4] = height;
    next_index += 5;
    ++commandCount;
}

function sampleCoverageOpt(value, invert) {
    // console.log('GLOpt: sampleCoverage');
    if (next_index + 3 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_SAMPLE_COVERAGE;
    buffer_data[next_index + 1] = value;
    buffer_data[next_index + 2] = invert ? 1 : 0;
    next_index += 3;
    ++commandCount;
}

function scissorOpt(x, y, width, height) {
    // console.log('GLOpt: scissor');
    if (next_index + 5 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_SCISSOR;
    buffer_data[next_index + 1] = x;
    buffer_data[next_index + 2] = y;
    buffer_data[next_index + 3] = width;
    buffer_data[next_index + 4] = height;
    next_index += 5;
    ++commandCount;
}

function shaderSourceOpt(shader, source) {
    // console.log('GLOpt: shaderSource');
    flushCommands();
    _gl.shaderSource(shader, source);
}

function stencilFuncOpt(func, ref, mask) {
    // console.log('GLOpt: stencilFunc');
    if (next_index + 4 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_STENCIL_FUNC;
    buffer_data[next_index + 1] = func;
    buffer_data[next_index + 2] = ref;
    buffer_data[next_index + 3] = mask;
    next_index += 4;
    ++commandCount;
}

function stencilFuncSeparateOpt(face, func, ref, mask) {
    // console.log('GLOpt: stencilFuncSeparate');
    if (next_index + 5 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_STENCIL_FUNC_SEPARATE;
    buffer_data[next_index + 1] = face;
    buffer_data[next_index + 2] = func;
    buffer_data[next_index + 3] = ref;
    buffer_data[next_index + 4] = mask;
    next_index += 5;
    ++commandCount;
}

function stencilMaskOpt(mask) {
    // console.log('GLOpt: stencilMask');
    if (next_index + 2 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_STENCIL_MASK;
    buffer_data[next_index + 1] = mask;
    next_index += 2;
    ++commandCount;
}

function stencilMaskSeparateOpt(face, mask) {
    // console.log('GLOpt: stencilMaskSeparate');
    if (next_index + 3 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_STENCIL_MASK_SEPARATE;
    buffer_data[next_index + 1] = face;
    buffer_data[next_index + 2] = mask;
    next_index += 3;
    ++commandCount;
}

function stencilOpOpt(fail, zfail, zpass) {
    // console.log('GLOpt: stencilOp');
    if (next_index + 4 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_STENCIL_OP;
    buffer_data[next_index + 1] = fail;
    buffer_data[next_index + 2] = zfail;
    buffer_data[next_index + 3] = zpass;
    next_index += 4;
    ++commandCount;
}

function stencilOpSeparateOpt(face, fail, zfail, zpass) {
    // console.log('GLOpt: stencilOpSeparate');
    if (next_index + 5 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_STENCIL_OP_SEPARATE;
    buffer_data[next_index + 1] = face;
    buffer_data[next_index + 2] = fail;
    buffer_data[next_index + 3] = zfail;
    buffer_data[next_index + 4] = zpass;
    next_index += 5;
    ++commandCount;
}

function texImage2DOpt() {
    flushCommands();
    // console.log('GLOpt: texImage2D');
    var argCount = arguments.length;
    if (argCount === 6) {
        _gl.texImage2D(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
    } else if (argCount === 9) {
        _gl.texImage2D(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7], arguments[8]);
    } else {
        console.log('texImage2DOpt: Wrong number of arguments, expected 6 or 9 but got ' + argCount);
    }
}

function texParameterfOpt(target, pname, param) {
    // console.log('GLOpt: texParameterf');
    if (next_index + 4 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_TEX_PARAMETER_F;
    buffer_data[next_index + 1] = target;
    buffer_data[next_index + 2] = pname;
    buffer_data[next_index + 3] = param;
    next_index += 4;
    ++commandCount;
}

function texParameteriOpt(target, pname, param) {
    // console.log('GLOpt: texParameteri');
    if (next_index + 4 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_TEX_PARAMETER_I;
    buffer_data[next_index + 1] = target;
    buffer_data[next_index + 2] = pname;
    buffer_data[next_index + 3] = param;
    next_index += 4;
    ++commandCount;
}

function texSubImage2DOpt(target, level, xoffset, yoffset, width, height, format, type, pixels) {
    flushCommands();
    // console.log('GLOpt: texSubImage2D');
    var argCount = arguments.length;
    if (argCount === 7) {
        _gl.texSubImage2D(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6]);
    } else if (argCount === 9) {
        _gl.texSubImage2D(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7], arguments[8]);
    } else {
        console.log('texSubImage2DOpt: Wrong number of arguments, expected 7 or 9 but got ' + argCount);
    }
}

function uniform1fOpt(location, x) {
    // console.log('GLOpt: uniform1f');
    if (next_index + 3 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_UNIFORM_1F;
    buffer_data[next_index + 1] = location;
    buffer_data[next_index + 2] = x;
    next_index += 3;
    ++commandCount;
}

function uniform2fOpt(location, x, y) {
    // console.log('GLOpt: uniform2f');
    if (next_index + 4 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_UNIFORM_2F;
    buffer_data[next_index + 1] = location;
    buffer_data[next_index + 2] = x;
    buffer_data[next_index + 3] = y;
    next_index += 4;
    ++commandCount;
}

function uniform3fOpt(location, x, y, z) {
    // console.log('GLOpt: uniform3f');
    if (next_index + 5 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_UNIFORM_3F;
    buffer_data[next_index + 1] = location;
    buffer_data[next_index + 2] = x;
    buffer_data[next_index + 3] = y;
    buffer_data[next_index + 4] = z;
    next_index += 5;
    ++commandCount;
}

function uniform4fOpt(location, x, y, z, w) {
    // console.log('GLOpt: uniform4f');
    if (next_index + 6 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_UNIFORM_4F;
    buffer_data[next_index + 1] = location;
    buffer_data[next_index + 2] = x;
    buffer_data[next_index + 3] = y;
    buffer_data[next_index + 4] = z;
    buffer_data[next_index + 5] = w;
    next_index += 6;
    ++commandCount;
}

function uniform1iOpt(location, x) {
    // console.log('GLOpt: uniform1i');
    if (next_index + 3 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_UNIFORM_1I;
    buffer_data[next_index + 1] = location;
    buffer_data[next_index + 2] = x;
    next_index += 3;
    ++commandCount;
}

function uniform2iOpt(location, x, y) {
    // console.log('GLOpt: uniform2i');
    if (next_index + 4 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_UNIFORM_2I;
    buffer_data[next_index + 1] = location;
    buffer_data[next_index + 2] = x;
    buffer_data[next_index + 3] = y;
    next_index += 4;
    ++commandCount;
}

function uniform3iOpt(location, x, y, z) {
    // console.log('GLOpt: uniform3i');
    if (next_index + 5 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_UNIFORM_3I;
    buffer_data[next_index + 1] = location;
    buffer_data[next_index + 2] = x;
    buffer_data[next_index + 3] = y;
    buffer_data[next_index + 4] = z;
    next_index += 5;
    ++commandCount;
}

function uniform4iOpt(location, x, y, z, w) {
    // console.log('GLOpt: uniform4i');
    if (next_index + 6 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_UNIFORM_4I;
    buffer_data[next_index + 1] = location;
    buffer_data[next_index + 2] = x;
    buffer_data[next_index + 3] = y;
    buffer_data[next_index + 4] = z;
    buffer_data[next_index + 5] = w;
    next_index += 6;
    ++commandCount;
}

function uniform1fvOpt(location, value) {
    // console.log('GLOpt: uniform1fv');
    if (next_index + 3 + value.length >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_UNIFORM_1FV;
    buffer_data[next_index + 1] = location;
    buffer_data[next_index + 2] = value.length;
    buffer_data.set(value, next_index + 3);
    next_index += 3 + value.length;
    ++commandCount;
}

function uniform2fvOpt(location, value) {
    // console.log('GLOpt: uniform2fv');
    if (next_index + 3 + value.length >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_UNIFORM_2FV;
    buffer_data[next_index + 1] = location;
    buffer_data[next_index + 2] = value.length;
    buffer_data.set(value, next_index + 3);
    next_index += 3 + value.length;
    ++commandCount;
}

function uniform3fvOpt(location, value) {
    // console.log('GLOpt: uniform3fv');
    if (next_index + 3 + value.length >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_UNIFORM_3FV;
    buffer_data[next_index + 1] = location;
    buffer_data[next_index + 2] = value.length;
    buffer_data.set(value, next_index + 3);
    next_index += 3 + value.length;
    ++commandCount;
}

function uniform4fvOpt(location, value) {
    // console.log('GLOpt: uniform4fv');
    if (next_index + 3 + value.length >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_UNIFORM_4FV;
    buffer_data[next_index + 1] = location;
    buffer_data[next_index + 2] = value.length;
    buffer_data.set(value, next_index + 3);
    next_index += 3 + value.length;
    ++commandCount;
}

function uniform1ivOpt(location, value) {
    // console.log('GLOpt: uniform1iv');
    if (next_index + 3 + value.length >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_UNIFORM_1IV;
    buffer_data[next_index + 1] = location;
    buffer_data[next_index + 2] = value.length;
    buffer_data.set(value, next_index + 3);
    next_index += 3 + value.length;
    ++commandCount;
}

function uniform2ivOpt(location, value) {
    // console.log('GLOpt: uniform2iv');
    if (next_index + 3 + value.length >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_UNIFORM_2IV;
    buffer_data[next_index + 1] = location;
    buffer_data[next_index + 2] = value.length;
    buffer_data.set(value, next_index + 3);
    next_index += 3 + value.length;
    ++commandCount;
}

function uniform3ivOpt(location, value) {
    // console.log('GLOpt: uniform3iv');
    if (next_index + 3 + value.length >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_UNIFORM_3IV;
    buffer_data[next_index + 1] = location;
    buffer_data[next_index + 2] = value.length;
    buffer_data.set(value, next_index + 3);
    next_index += 3 + value.length;
    ++commandCount;
}

function uniform4ivOpt(location, value) {
    // console.log('GLOpt: uniform4iv');
    if (next_index + 3 + value.length >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_UNIFORM_4IV;
    buffer_data[next_index + 1] = location;
    buffer_data[next_index + 2] = value.length;
    buffer_data.set(value, next_index + 3);
    next_index += 3 + value.length;
    ++commandCount;
}

function uniformMatrix2fvOpt(location, transpose, value) {
    // console.log('GLOpt: uniformMatrix2fv');
    if (next_index + 4 + value.length >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_UNIFORM_MATRIX_2FV;
    buffer_data[next_index + 1] = location;
    buffer_data[next_index + 2] = transpose;
    buffer_data[next_index + 3] = value.length;
    buffer_data.set(value, next_index + 4);
    next_index += 4 + value.length;
    ++commandCount;
}

function uniformMatrix3fvOpt(location, transpose, value) {
    // console.log('GLOpt: uniformMatrix3fv');
    if (next_index + 4 + value.length >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_UNIFORM_MATRIX_3FV;
    buffer_data[next_index + 1] = location;
    buffer_data[next_index + 2] = transpose;
    buffer_data[next_index + 3] = value.length;
    buffer_data.set(value, next_index + 4);
    next_index += 4 + value.length;
    ++commandCount;
}

function uniformMatrix4fvOpt(location, transpose, value) {
    // console.log('GLOpt: uniformMatrix4fv');
    if (next_index + 4 + value.length >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_UNIFORM_MATRIX_4FV;
    buffer_data[next_index + 1] = location;
    buffer_data[next_index + 2] = transpose;
    buffer_data[next_index + 3] = value.length;
    buffer_data.set(value, next_index + 4);
    next_index += 4 + value.length;
    ++commandCount;
}

function useProgramOpt(program) {
    // console.log('GLOpt: useProgram');
    if (next_index + 2 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_USE_PROGRAM;
    buffer_data[next_index + 1] = program ? program._id : 0;
    next_index += 2;
    ++commandCount;
}

function validateProgramOpt(program) {
    // console.log('GLOpt: validateProgram');
    if (next_index + 2 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_VALIDATE_PROGRAM;
    buffer_data[next_index + 1] = program ? program._id : 0;
    next_index += 2;
    ++commandCount;
}

function vertexAttrib1fOpt(index, x) {
    // console.log('GLOpt: vertexAttrib1f');
    if (next_index + 3 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_VERTEX_ATTRIB_1F;
    buffer_data[next_index + 1] = index;
    buffer_data[next_index + 2] = x;
    next_index += 3;
    ++commandCount;
}

function vertexAttrib2fOpt(index, x, y) {
    // console.log('GLOpt: vertexAttrib2f');
    if (next_index + 4 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_VERTEX_ATTRIB_2F;
    buffer_data[next_index + 1] = index;
    buffer_data[next_index + 2] = x;
    buffer_data[next_index + 3] = y;
    next_index += 4;
    ++commandCount;
}

function vertexAttrib3fOpt(index, x, y, z) {
    // console.log('GLOpt: vertexAttrib3f');
    if (next_index + 5 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_VERTEX_ATTRIB_3F;
    buffer_data[next_index + 1] = index;
    buffer_data[next_index + 2] = x;
    buffer_data[next_index + 3] = y;
    buffer_data[next_index + 4] = z;
    next_index += 5;
    ++commandCount;
}

function vertexAttrib4fOpt(index, x, y, z, w) {
    // console.log('GLOpt: vertexAttrib4f');
    if (next_index + 6 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_VERTEX_ATTRIB_4F;
    buffer_data[next_index + 1] = index;
    buffer_data[next_index + 2] = x;
    buffer_data[next_index + 3] = y;
    buffer_data[next_index + 4] = z;
    buffer_data[next_index + 5] = w;
    next_index += 6;
    ++commandCount;
}

function vertexAttrib1fvOpt(index, value) {
    // console.log('GLOpt: vertexAttrib1fv');
    if (next_index + 3 + value.length >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_VERTEX_ATTRIB_1FV;
    buffer_data[next_index + 1] = index;
    buffer_data[next_index + 2] = value.length;
    buffer_data.set(value, next_index + 3);
    next_index += 3 + value.length;
    ++commandCount;
}

function vertexAttrib2fvOpt(index, value) {
    // console.log('GLOpt: vertexAttrib2fv');
    if (next_index + 3 + value.length >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_VERTEX_ATTRIB_2FV;
    buffer_data[next_index + 1] = index;
    buffer_data[next_index + 2] = value.length;
    buffer_data.set(value, next_index + 3);
    next_index += 3 + value.length;
    ++commandCount;
}

function vertexAttrib3fvOpt(index, value) {
    // console.log('GLOpt: vertexAttrib3fv');
    if (next_index + 3 + value.length >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_VERTEX_ATTRIB_3FV;
    buffer_data[next_index + 1] = index;
    buffer_data[next_index + 2] = value.length;
    buffer_data.set(value, next_index + 3);
    next_index += 3 + value.length;
    ++commandCount;
}

function vertexAttrib4fvOpt(index, value) {
    // console.log('GLOpt: vertexAttrib4fv');
    if (next_index + 3 + value.length >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_VERTEX_ATTRIB_4FV;
    buffer_data[next_index + 1] = index;
    buffer_data[next_index + 2] = value.length;
    buffer_data.set(value, next_index + 3);
    next_index += 3 + value.length;
    ++commandCount;
}

function vertexAttribPointerOpt(index, size, type, normalized, stride, offset) {
    // console.log('GLOpt: vertexAttribPointer');
    if (next_index + 7 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_VERTEX_ATTRIB_POINTER;
    buffer_data[next_index + 1] = index;
    buffer_data[next_index + 2] = size;
    buffer_data[next_index + 3] = type;
    buffer_data[next_index + 4] = normalized ? 1 : 0;
    buffer_data[next_index + 5] = stride;
    buffer_data[next_index + 6] = offset;
    next_index += 7;
    ++commandCount;
}

function viewportOpt(x, y, width, height) {
    // console.log('GLOpt: viewport');
    if (next_index + 5 >= total_size) {
        flushCommands();
    }
    buffer_data[next_index] = GL_COMMAND_VIEW_PORT;
    buffer_data[next_index + 1] = x;
    buffer_data[next_index + 2] = y;
    buffer_data[next_index + 3] = width;
    buffer_data[next_index + 4] = height;
    next_index += 5;
    ++commandCount;
}

function isSupportTypeArray() {
    //FIXME:
    // if (GameStatusInfo.platform == 'android') {
    return true;
    // }
    // var info = BK.Director.queryDeviceInfo();
    // var vers = info.version.split('.');
    // if (info.platform == 'ios' && Number(vers[0]) >= 10) {
    //     return true;
    // }
    // return false;
}

function attachMethodOpt() {
    gl.activeTexture = activeTextureOpt;
    gl.attachShader = attachShaderOpt;
    gl.bindAttribLocation = bindAttribLocationOpt;
    gl.bindBuffer = bindBufferOpt;
    gl.bindFramebuffer = bindFramebufferOpt;
    gl.bindRenderbuffer = bindRenderbufferOpt;
    gl.bindTexture = bindTextureOpt;
    gl.blendColor = blendColorOpt;
    gl.blendEquation = blendEquationOpt;
    gl.blendEquationSeparate = blendEquationSeparateOpt;
    gl.blendFunc = blendFuncOpt;
    gl.blendFuncSeparate = blendFuncSeparateOpt;
    gl.bufferData = bufferDataOpt;
    gl.bufferSubData = bufferSubDataOpt;
    gl.checkFramebufferStatus = checkFramebufferStatusOpt;
    gl.clear = clearOpt;
    gl.clearColor = clearColorOpt;
    gl.clearDepth = clearDepthOpt;
    gl.clearStencil = clearStencilOpt;
    gl.colorMask = colorMaskOpt;
    gl.compileShader = compileShaderOpt;
    gl.compressedTexImage2D = compressedTexImage2DOpt;
    gl.compressedTexSubImage2D = compressedTexSubImage2DOpt;
    gl.copyTexImage2D = copyTexImage2DOpt;
    gl.copyTexSubImage2D = copyTexSubImage2DOpt;
    gl.createBuffer = createBufferOpt;
    gl.createFramebuffer = createFramebufferOpt;
    gl.createProgram = createProgramOpt;
    gl.createRenderbuffer = createRenderbufferOpt;
    gl.createShader = createShaderOpt;
    gl.createTexture = createTextureOpt;
    gl.cullFace = cullFaceOpt;
    gl.deleteBuffer = deleteBufferOpt;
    gl.deleteFramebuffer = deleteFramebufferOpt;
    gl.deleteProgram = deleteProgramOpt;
    gl.deleteRenderbuffer = deleteRenderbufferOpt;
    gl.deleteShader = deleteShaderOpt;
    gl.deleteTexture = deleteTextureOpt;
    gl.depthFunc = depthFuncOpt;
    gl.depthMask = depthMaskOpt;
    gl.depthRange = depthRangeOpt;
    gl.detachShader = detachShaderOpt;
    gl.disable = disableOpt;
    gl.disableVertexAttribArray = disableVertexAttribArrayOpt;
    gl.drawArrays = drawArraysOpt;
    gl.drawElements = drawElementsOpt;
    gl.enable = enableOpt;
    gl.enableVertexAttribArray = enableVertexAttribArrayOpt;
    gl.finish = finishOpt;
    gl.flush = flushOpt;
    gl.framebufferRenderbuffer = framebufferRenderbufferOpt;
    gl.framebufferTexture2D = framebufferTexture2DOpt;
    gl.frontFace = frontFaceOpt;
    gl.generateMipmap = generateMipmapOpt;
    gl.getActiveAttrib = getActiveAttribOpt;
    gl.getActiveUniform = getActiveUniformOpt;
    gl.getAttachedShaders = getAttachedShadersOpt;
    gl.getAttribLocation = getAttribLocationOpt;
    gl.getBufferParameter = getBufferParameterOpt;
    gl.getParameter = getParameterOpt;
    gl.getError = getErrorOpt;
    gl.getFramebufferAttachmentParameter = getFramebufferAttachmentParameterOpt;
    gl.getProgramParameter = getProgramParameterOpt;
    gl.getProgramInfoLog = getProgramInfoLogOpt;
    gl.getRenderbufferParameter = getRenderbufferParameterOpt;
    gl.getShaderParameter = getShaderParameterOpt;
    gl.getShaderPrecisionFormat = getShaderPrecisionFormatOpt;
    gl.getShaderInfoLog = getShaderInfoLogOpt;
    gl.getShaderSource = getShaderSourceOpt;
    gl.getTexParameter = getTexParameterOpt;
    gl.getUniform = getUniformOpt;
    gl.getUniformLocation = getUniformLocationOpt;
    gl.getVertexAttrib = getVertexAttribOpt;
    gl.getVertexAttribOffset = getVertexAttribOffsetOpt;
    gl.hint = hintOpt;
    gl.isBuffer = isBufferOpt;
    gl.isEnabled = isEnabledOpt;
    gl.isFramebuffer = isFramebufferOpt;
    gl.isProgram = isProgramOpt;
    gl.isRenderbuffer = isRenderbufferOpt;
    gl.isShader = isShaderOpt;
    gl.isTexture = isTextureOpt;
    gl.lineWidth = lineWidthOpt;
    gl.linkProgram = linkProgramOpt;
    gl.pixelStorei = pixelStoreiOpt;
    gl.polygonOffset = polygonOffsetOpt;
    gl.readPixels = readPixelsOpt;
    gl.renderbufferStorage = renderbufferStorageOpt;
    gl.sampleCoverage = sampleCoverageOpt;
    gl.scissor = scissorOpt;
    gl.shaderSource = shaderSourceOpt;
    gl.stencilFunc = stencilFuncOpt;
    gl.stencilFuncSeparate = stencilFuncSeparateOpt;
    gl.stencilMask = stencilMaskOpt;
    gl.stencilMaskSeparate = stencilMaskSeparateOpt;
    gl.stencilOp = stencilOpOpt;
    gl.stencilOpSeparate = stencilOpSeparateOpt;
    gl.texImage2D = texImage2DOpt;
    gl.texParameterf = texParameterfOpt;
    gl.texParameteri = texParameteriOpt;
    gl.texSubImage2D = texSubImage2DOpt;
    gl.uniform1f = uniform1fOpt;
    gl.uniform2f = uniform2fOpt;
    gl.uniform3f = uniform3fOpt;
    gl.uniform4f = uniform4fOpt;
    gl.uniform1i = uniform1iOpt;
    gl.uniform2i = uniform2iOpt;
    gl.uniform3i = uniform3iOpt;
    gl.uniform4i = uniform4iOpt;
    gl.uniform1fv = uniform1fvOpt;
    gl.uniform2fv = uniform2fvOpt;
    gl.uniform3fv = uniform3fvOpt;
    gl.uniform4fv = uniform4fvOpt;
    gl.uniform1iv = uniform1ivOpt;
    gl.uniform2iv = uniform2ivOpt;
    gl.uniform3iv = uniform3ivOpt;
    gl.uniform4iv = uniform4ivOpt;
    gl.uniformMatrix2fv = uniformMatrix2fvOpt;
    gl.uniformMatrix3fv = uniformMatrix3fvOpt;
    gl.uniformMatrix4fv = uniformMatrix4fvOpt;
    gl.useProgram = useProgramOpt;
    gl.validateProgram = validateProgramOpt;
    gl.vertexAttrib1f = vertexAttrib1fOpt;
    gl.vertexAttrib2f = vertexAttrib2fOpt;
    gl.vertexAttrib3f = vertexAttrib3fOpt;
    gl.vertexAttrib4f = vertexAttrib4fOpt;
    gl.vertexAttrib1fv = vertexAttrib1fvOpt;
    gl.vertexAttrib2fv = vertexAttrib2fvOpt;
    gl.vertexAttrib3fv = vertexAttrib3fvOpt;
    gl.vertexAttrib4fv = vertexAttrib4fvOpt;
    gl.vertexAttribPointer = vertexAttribPointerOpt;
    gl.viewport = viewportOpt;
}

batchGLCommandsToNative();

module.exports = {
    disableBatchGLCommandsToNative: disableBatchGLCommandsToNative,
    flushCommands: flushCommands
};

},{}],4:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

window.CanvasRenderingContext2D = jsb.CanvasRenderingContext2D;
delete jsb.CanvasRenderingContext2D;

jsb.device = jsb.Device; // cc namespace will be reset to {} in creator, use jsb namespace instead.

var _require = require('./base64/base64.min'),
    btoa = _require.btoa,
    atob = _require.atob;

window.btoa = btoa;
window.atob = atob;

var _require2 = require('./Blob'),
    Blob = _require2.Blob,
    URL = _require2.URL;

window.Blob = Blob;
window.URL = URL;
// window.DOMParser = require('./xmldom/dom-parser').DOMParser;

require('./jsb_prepare');
require('./jsb_opengl');
require('./jsb-adapter');
// require('./jsb_audioengine');
require('./jsb_input');
// external interface of native renderer
// require('./renderer/enums');
// require('./renderer/jsb-vertex-format');
// require('./renderer/jsb-gfx');
// require('./renderer/jsb-renderer');

var _oldRequestFrameCallback = null;
var _requestAnimationFrameID = 0;
var _requestAnimationFrameCallbacks = {};
var _firstTick = true;

window.requestAnimationFrame = function (cb) {
    var id = ++_requestAnimationFrameID;
    _requestAnimationFrameCallbacks[id] = cb;
    return id;
};

window.cancelAnimationFrame = function (id) {
    delete _requestAnimationFrameCallbacks[id];
};

var _require3 = require('./glOptMode'),
    disableBatchGLCommandsToNative = _require3.disableBatchGLCommandsToNative,
    flushCommands = _require3.flushCommands;

window.optConfig = {
    disableBatchGLCommandsToNative: disableBatchGLCommandsToNative
};

function tick(nowMilliSeconds) {
    if (_firstTick) {
        _firstTick = false;
        if (window.onload) {
            var event = new Event('load');
            event._target = window;
            window.onload(event);
        }
    }
    fireTimeout(nowMilliSeconds);

    for (var id in _requestAnimationFrameCallbacks) {
        _oldRequestFrameCallback = _requestAnimationFrameCallbacks[id];
        if (_oldRequestFrameCallback) {
            delete _requestAnimationFrameCallbacks[id];
            _oldRequestFrameCallback(nowMilliSeconds);
        }
    }
    flushCommands();
}

var _timeoutIDIndex = 0;

var TimeoutInfo = function TimeoutInfo(cb, delay, isRepeat, target, args) {
    _classCallCheck(this, TimeoutInfo);

    this.cb = cb;
    this.id = ++_timeoutIDIndex;
    this.start = performance.now();
    this.delay = delay;
    this.isRepeat = isRepeat;
    this.target = target;
    this.args = args;
};

var _timeoutInfos = {};

function fireTimeout(nowMilliSeconds) {
    var info = void 0;
    for (var id in _timeoutInfos) {
        info = _timeoutInfos[id];
        if (info && info.cb) {
            if (nowMilliSeconds - info.start >= info.delay) {
                // console.log(`fireTimeout: id ${id}, start: ${info.start}, delay: ${info.delay}, now: ${nowMilliSeconds}`);
                if (typeof info.cb === 'string') {
                    Function(info.cb)();
                } else if (typeof info.cb === 'function') {
                    info.cb.apply(info.target, info.args);
                }
                if (info.isRepeat) {
                    info.start = nowMilliSeconds;
                } else {
                    delete _timeoutInfos[id];
                }
            }
        }
    }
}

function createTimeoutInfo(prevFuncArgs, isRepeat) {
    var cb = prevFuncArgs[0];
    if (!cb) {
        console.error("createTimeoutInfo doesn't pass a callback ...");
        return 0;
    }

    var delay = prevFuncArgs.length > 1 ? prevFuncArgs[1] : 0;
    var args = void 0;

    if (prevFuncArgs.length > 2) {
        args = Array.prototype.slice.call(prevFuncArgs, 2);
    }

    var info = new TimeoutInfo(cb, delay, isRepeat, this, args);
    _timeoutInfos[info.id] = info;
    return info.id;
}

window.setTimeout = function (cb) {
    return createTimeoutInfo(arguments, false);
};

window.clearTimeout = function (id) {
    delete _timeoutInfos[id];
};

window.setInterval = function (cb) {
    return createTimeoutInfo(arguments, true);
};

window.clearInterval = window.clearTimeout;
window.alert = console.error.bind(console);

var __motionCallbackID = 0;
var __motionEnabled = false;
var __motionInterval = 16.6; // milliseconds

jsb.device.setMotionInterval = function (milliseconds) {
    __motionInterval = milliseconds;
    // convert to seconds
    jsb.device.setAccelerometerInterval(__motionInterval / 1000);
    if (__motionEnabled) {
        jsb.device.setMotionEnabled(false);
        jsb.device.setMotionEnabled(true);
    }
};

jsb.device.setMotionEnabled = function (enabled) {
    if (__motionEnabled === enabled) return;

    jsb.device.setAccelerometerEnabled(enabled);
    if (enabled) {
        var motionValue;
        var event = new DeviceMotionEvent();
        __motionCallbackID = window.setInterval(function () {
            motionValue = jsb.device.getDeviceMotionValue();

            event._acceleration.x = motionValue[0];
            event._acceleration.y = motionValue[1];
            event._acceleration.z = motionValue[2];

            event._accelerationIncludingGravity.x = motionValue[3];
            event._accelerationIncludingGravity.y = motionValue[4];
            event._accelerationIncludingGravity.z = motionValue[5];

            event._rotationRate.alpha = motionValue[6];
            event._rotationRate.beta = motionValue[7];
            event._rotationRate.gamma = motionValue[8];

            event._interval = __motionInterval;

            jsb.device.dispatchDeviceMotionEvent(event);
        }, __motionInterval);
    } else {
        window.clearInterval(__motionCallbackID);
        __motionCallbackID = 0;
    }

    __motionEnabled = enabled;
};

// File utils (Temporary, won't be accessible)
if (typeof jsb.FileUtils !== 'undefined') {
    jsb.fileUtils = jsb.FileUtils.getInstance();
    delete jsb.FileUtils;
}

XMLHttpRequest.prototype.addEventListener = function (eventName, listener, options) {
    this['on' + eventName] = listener;
};

XMLHttpRequest.prototype.removeEventListener = function (eventName, listener, options) {
    this['on' + eventName] = null;
};

// SocketIO
if (window.SocketIO) {
    window.io = window.SocketIO;
    SocketIO.prototype._Emit = SocketIO.prototype.emit;
    SocketIO.prototype.emit = function (uri, delegate) {
        if ((typeof delegate === 'undefined' ? 'undefined' : _typeof(delegate)) === 'object') {
            delegate = JSON.stringify(delegate);
        }
        this._Emit(uri, delegate);
    };
}

window.gameTick = tick;

// generate get set function
jsb.generateGetSet = function (moduleObj) {
    for (var classKey in moduleObj) {
        var classProto = moduleObj[classKey] && moduleObj[classKey].prototype;
        if (!classProto) continue;

        var _loop = function _loop(getName) {
            var getPos = getName.search(/^get/);
            if (getPos == -1) return 'continue';
            var propName = getName.replace(/^get/, '');
            var nameArr = propName.split('');
            var lowerFirst = nameArr[0].toLowerCase();
            var upperFirst = nameArr[0].toUpperCase();
            nameArr.splice(0, 1);
            var left = nameArr.join('');
            propName = lowerFirst + left;
            var setName = 'set' + upperFirst + left;
            if (classProto.hasOwnProperty(propName)) return 'continue';
            var setFunc = classProto[setName];
            var hasSetFunc = typeof setFunc === 'function';
            if (hasSetFunc) {
                Object.defineProperty(classProto, propName, {
                    get: function get() {
                        return this[getName]();
                    },
                    set: function set(val) {
                        this[setName](val);
                    },

                    configurable: true
                });
            } else {
                Object.defineProperty(classProto, propName, {
                    get: function get() {
                        return this[getName]();
                    },

                    configurable: true
                });
            }
        };

        for (var getName in classProto) {
            var _ret = _loop(getName);

            if (_ret === 'continue') continue;
        }
    }
};

// promise polyfill relies on setTimeout implementation
require('./promise.min');

},{"./Blob":1,"./base64/base64.min":2,"./glOptMode":3,"./jsb-adapter":28,"./jsb_input":33,"./jsb_opengl":34,"./jsb_prepare":36,"./promise.min":37}],5:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DOMRect = function DOMRect(x, y, width, height) {
	_classCallCheck(this, DOMRect);

	this.x = x ? x : 0;
	this.y = y ? y : 0;
	this.width = width ? width : 0;
	this.height = height ? height : 0;
	this.left = this.x;
	this.top = this.y;
	this.right = this.x + this.width;
	this.bottom = this.y + this.height;
};

module.exports = DOMRect;

},{}],6:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Event = require('./Event');

var DeviceMotionEvent = function (_Event) {
    _inherits(DeviceMotionEvent, _Event);

    function DeviceMotionEvent(initArgs) {
        _classCallCheck(this, DeviceMotionEvent);

        var _this = _possibleConstructorReturn(this, (DeviceMotionEvent.__proto__ || Object.getPrototypeOf(DeviceMotionEvent)).call(this, 'devicemotion'));

        if (initArgs) {
            _this._acceleration = initArgs.acceleration ? initArgs.acceleration : { x: 0, y: 0, z: 0 };
            _this._accelerationIncludingGravity = initArgs.accelerationIncludingGravity ? initArgs.accelerationIncludingGravity : { x: 0, y: 0, z: 0 };
            _this._rotationRate = initArgs.rotationRate ? initArgs.rotationRate : { alpha: 0, beta: 0, gamma: 0 };
            _this._interval = initArgs.interval;
        } else {
            _this._acceleration = { x: 0, y: 0, z: 0 };
            _this._accelerationIncludingGravity = { x: 0, y: 0, z: 0 };
            _this._rotationRate = { alpha: 0, beta: 0, gamma: 0 };
            _this._interval = 0;
        }
        return _this;
    }

    _createClass(DeviceMotionEvent, [{
        key: 'acceleration',
        get: function get() {
            return this._acceleration;
        }
    }, {
        key: 'accelerationIncludingGravity',
        get: function get() {
            return this._accelerationIncludingGravity;
        }
    }, {
        key: 'rotationRate',
        get: function get() {
            return this._rotationRate;
        }
    }, {
        key: 'interval',
        get: function get() {
            return this._interval;
        }
    }]);

    return DeviceMotionEvent;
}(Event);

module.exports = DeviceMotionEvent;

},{"./Event":8}],7:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Node = require('./Node');
var DOMRect = require('./DOMRect');

var Element = function (_Node) {
    _inherits(Element, _Node);

    function Element() {
        _classCallCheck(this, Element);

        var _this = _possibleConstructorReturn(this, (Element.__proto__ || Object.getPrototypeOf(Element)).call(this));

        _this.className = '';
        _this.children = [];
        _this.clientLeft = 0;
        _this.clientTop = 0;
        _this.scrollLeft = 0;
        _this.scrollTop = 0;
        return _this;
    }

    _createClass(Element, [{
        key: 'getBoundingClientRect',
        value: function getBoundingClientRect() {
            return new DOMRect(0, 0, window.innerWidth, window.innerHeight);
        }

        // attrName is a string that names the attribute to be removed from element.

    }, {
        key: 'removeAttribute',
        value: function removeAttribute(attrName) {}
    }, {
        key: 'clientWidth',
        get: function get() {
            return 0;
        }
    }, {
        key: 'clientHeight',
        get: function get() {
            return 0;
        }
    }]);

    return Element;
}(Node);

module.exports = Element;

},{"./DOMRect":5,"./Node":24}],8:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @see https://dom.spec.whatwg.org/#interface-event
 * @private
 */
/**
 * The event wrapper.
 * @constructor
 * @param {EventTarget} eventTarget The event target of this dispatching.
 * @param {Event|{type:string}} event The original event to wrap.
 */
var Event = function () {
  function Event(type, eventInit) {
    _classCallCheck(this, Event);

    this._type = type;
    this._target = null;
    this._eventPhase = 2;
    this._currentTarget = null;
    this._canceled = false;
    this._stopped = false; // The flag to stop propagation immediately.
    this._passiveListener = null;
    this._timeStamp = Date.now();
  }

  /**
   * The type of this event.
   * @type {string}
   */


  _createClass(Event, [{
    key: "composedPath",


    /**
     * @returns {EventTarget[]} The composed path of this event.
     */
    value: function composedPath() {
      var currentTarget = this._currentTarget;
      if (currentTarget === null) {
        return [];
      }
      return [currentTarget];
    }

    /**
     * The target of this event.
     * @type {number}
     */

  }, {
    key: "stopPropagation",


    /**
     * Stop event bubbling.
     * @returns {void}
     */
    value: function stopPropagation() {}

    /**
     * Stop event bubbling.
     * @returns {void}
     */

  }, {
    key: "stopImmediatePropagation",
    value: function stopImmediatePropagation() {
      this._stopped = true;
    }

    /**
     * The flag to be bubbling.
     * @type {boolean}
     */

  }, {
    key: "preventDefault",


    /**
     * Cancel this event.
     * @returns {void}
     */
    value: function preventDefault() {
      if (this._passiveListener !== null) {
        console.warn("Event#preventDefault() was called from a passive listener:", this._passiveListener);
        return;
      }
      if (!this.cancelable) {
        return;
      }

      this._canceled = true;
    }

    /**
     * The flag to indicate cancellation state.
     * @type {boolean}
     */

  }, {
    key: "type",
    get: function get() {
      return this._type;
    }

    /**
     * The target of this event.
     * @type {EventTarget}
     */

  }, {
    key: "target",
    get: function get() {
      return this._target;
    }

    /**
     * The target of this event.
     * @type {EventTarget}
     */

  }, {
    key: "currentTarget",
    get: function get() {
      return this._currentTarget;
    }
  }, {
    key: "isTrusted",
    get: function get() {
      // https://heycam.github.io/webidl/#Unforgeable
      return false;
    }
  }, {
    key: "timeStamp",


    /**
     * The unix time of this event.
     * @type {number}
     */
    get: function get() {
      return this._timeStamp;
    }
  }, {
    key: "eventPhase",
    get: function get() {
      return this._eventPhase;
    }
  }, {
    key: "bubbles",
    get: function get() {
      return false;
    }

    /**
     * The flag to be cancelable.
     * @type {boolean}
     */

  }, {
    key: "cancelable",
    get: function get() {
      return true;
    }
  }, {
    key: "defaultPrevented",
    get: function get() {
      return this._canceled;
    }

    /**
     * The flag to be composed.
     * @type {boolean}
     */

  }, {
    key: "composed",
    get: function get() {
      return false;
    }
  }]);

  return Event;
}();

/**
 * Constant of NONE.
 * @type {number}
 */


Event.NONE = 0;

/**
 * Constant of CAPTURING_PHASE.
 * @type {number}
 */
Event.CAPTURING_PHASE = 1;

/**
 * Constant of AT_TARGET.
 * @type {number}
 */
Event.AT_TARGET = 2;

/**
 * Constant of BUBBLING_PHASE.
 * @type {number}
 */
Event.BUBBLING_PHASE = 3;

module.exports = Event;

},{}],9:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var __targetID = 0;

var __listenerMap = {
    touch: {},
    mouse: {},
    keyboard: {},
    devicemotion: {}
};

var __listenerCountMap = {
    touch: 0,
    mouse: 0,
    keyboard: 0,
    devicemotion: 0
};

var __enableCallbackMap = {
    touch: null,
    mouse: null,
    keyboard: null,
    //FIXME: Cocos Creator invokes addEventListener('devicemotion') when engine initializes, it will active sensor hardware.
    // In that case, CPU and temperature cost will increase. Therefore, we require developer to invoke 'jsb.device.setMotionEnabled(true)'
    // on native platforms since most games will not listen motion event.
    devicemotion: null
    // devicemotion: function() {
    //     jsb.device.setMotionEnabled(true);
    // }
};

var __disableCallbackMap = {
    touch: null,
    mouse: null,
    //FIXME: Cocos Creator invokes addEventListener('devicemotion') when engine initializes, it will active sensor hardware.
    // In that case, CPU and temperature cost will increase. Therefore, we require developer to invoke 'jsb.device.setMotionEnabled(true)'
    // on native platforms since most games will not listen motion event.
    keyboard: null,
    devicemotion: null
    // devicemotion: function() {
    //     jsb.device.setMotionEnabled(false);
    // }
};

var __handleEventNames = {
    touch: ['touchstart', 'touchmove', 'touchend', 'touchcancel'],
    mouse: ['mousedown', 'mousemove', 'mouseup', 'mousewheel'],
    keyboard: ['keydown', 'keyup', 'keypress'],
    devicemotion: ['devicemotion']

    // Listener types
};var CAPTURE = 1;
var BUBBLE = 2;
var ATTRIBUTE = 3;

/**
 * Check whether a given value is an object or not.
 * @param {any} x The value to check.
 * @returns {boolean} `true` if the value is an object.
 */
function isObject(x) {
    return x && (typeof x === 'undefined' ? 'undefined' : _typeof(x)) === "object"; //eslint-disable-line no-restricted-syntax
}

/**
 * EventTarget.
 * 
 * - This is constructor if no arguments.
 * - This is a function which returns a CustomEventTarget constructor if there are arguments.
 * 
 * For example:
 * 
 *     class A extends EventTarget {}
 */

var EventTarget = function () {
    function EventTarget() {
        _classCallCheck(this, EventTarget);

        this._targetID = ++__targetID;
        this._listenerCount = {
            touch: 0,
            mouse: 0,
            keyboard: 0,
            devicemotion: 0
        };
        this._listeners = new Map();
    }

    _createClass(EventTarget, [{
        key: '_associateSystemEventListener',
        value: function _associateSystemEventListener(eventName) {
            var handleEventNames;
            for (var key in __handleEventNames) {
                handleEventNames = __handleEventNames[key];
                if (handleEventNames.indexOf(eventName) > -1) {
                    if (__enableCallbackMap[key] && __listenerCountMap[key] === 0) {
                        __enableCallbackMap[key]();
                    }

                    if (this._listenerCount[key] === 0) __listenerMap[key][this._targetID] = this;
                    ++this._listenerCount[key];
                    ++__listenerCountMap[key];
                    break;
                }
            }
        }
    }, {
        key: '_dissociateSystemEventListener',
        value: function _dissociateSystemEventListener(eventName) {
            var handleEventNames;
            for (var key in __handleEventNames) {
                handleEventNames = __handleEventNames[key];
                if (handleEventNames.indexOf(eventName) > -1) {
                    if (this._listenerCount[key] <= 0) delete __listenerMap[key][this._targetID];
                    --__listenerCountMap[key];

                    if (__disableCallbackMap[key] && __listenerCountMap[key] === 0) {
                        __disableCallbackMap[key]();
                    }
                    break;
                }
            }
        }

        /**
         * Add a given listener to this event target.
         * @param {string} eventName The event name to add.
         * @param {Function} listener The listener to add.
         * @param {boolean|{capture?:boolean,passive?:boolean,once?:boolean}} [options] The options for this listener.
         * @returns {boolean} `true` if the listener was added actually.
         */

    }, {
        key: 'addEventListener',
        value: function addEventListener(eventName, listener, options) {
            if (!listener) {
                return false;
            }
            if (typeof listener !== "function" && !isObject(listener)) {
                throw new TypeError("'listener' should be a function or an object.");
            }

            var listeners = this._listeners;
            var optionsIsObj = isObject(options);
            var capture = optionsIsObj ? Boolean(options.capture) : Boolean(options);
            var listenerType = capture ? CAPTURE : BUBBLE;
            var newNode = {
                listener: listener,
                listenerType: listenerType,
                passive: optionsIsObj && Boolean(options.passive),
                once: optionsIsObj && Boolean(options.once),
                next: null

                // Set it as the first node if the first node is null.
            };var node = listeners.get(eventName);
            if (node === undefined) {
                listeners.set(eventName, newNode);
                this._associateSystemEventListener(eventName);
                return true;
            }

            // Traverse to the tail while checking duplication..
            var prev = null;
            while (node) {
                if (node.listener === listener && node.listenerType === listenerType) {
                    // Should ignore duplication.
                    return false;
                }
                prev = node;
                node = node.next;
            }

            // Add it.
            prev.next = newNode;
            this._associateSystemEventListener(eventName);
            return true;
        }

        /**
         * Remove a given listener from this event target.
         * @param {string} eventName The event name to remove.
         * @param {Function} listener The listener to remove.
         * @param {boolean|{capture?:boolean,passive?:boolean,once?:boolean}} [options] The options for this listener.
         * @returns {boolean} `true` if the listener was removed actually.
         */

    }, {
        key: 'removeEventListener',
        value: function removeEventListener(eventName, listener, options) {
            if (!listener) {
                return false;
            }

            var listeners = this._listeners;
            var capture = isObject(options) ? Boolean(options.capture) : Boolean(options);
            var listenerType = capture ? CAPTURE : BUBBLE;

            var prev = null;
            var node = listeners.get(eventName);
            while (node) {
                if (node.listener === listener && node.listenerType === listenerType) {
                    if (prev) {
                        prev.next = node.next;
                    } else if (node.next) {
                        listeners.set(eventName, node.next);
                    } else {
                        listeners.delete(eventName);
                    }

                    this._dissociateSystemEventListener(eventName);

                    return true;
                }

                prev = node;
                node = node.next;
            }

            return false;
        }

        /**
         * Dispatch a given event.
         * @param {Event|{type:string}} event The event to dispatch.
         * @returns {boolean} `false` if canceled.
         */

    }, {
        key: 'dispatchEvent',
        value: function dispatchEvent(event) {
            if (!event || typeof event.type !== "string") {
                throw new TypeError("\"event.type\" should be a string.");
            }

            var eventName = event.type;
            var onFunc = this['on' + eventName];
            if (onFunc && typeof onFunc === 'function') {
                event._target = event._currentTarget = this;
                onFunc.call(this, event);
                event._target = event._currentTarget = null;
                event._eventPhase = 0;
                event._passiveListener = null;

                if (event.defaultPrevented) return false;
            }

            // If listeners aren't registered, terminate.
            var listeners = this._listeners;

            var node = listeners.get(eventName);
            if (!node) {
                return true;
            }

            event._target = event._currentTarget = this;

            // This doesn't process capturing phase and bubbling phase.
            // This isn't participating in a tree.
            var prev = null;
            while (node) {
                // Remove this listener if it's once
                if (node.once) {
                    if (prev) {
                        prev.next = node.next;
                    } else if (node.next) {
                        listeners.set(eventName, node.next);
                    } else {
                        listeners.delete(eventName);
                    }
                } else {
                    prev = node;
                }

                // Call this listener
                event._passiveListener = node.passive ? node.listener : null;
                if (typeof node.listener === "function") {
                    node.listener.call(this, event);
                }

                // Break if `event.stopImmediatePropagation` was called.
                if (event._stopped) {
                    break;
                }

                node = node.next;
            }
            event._target = event._currentTarget = null;
            event._eventPhase = 0;
            event._passiveListener = null;

            return !event.defaultPrevented;
        }
    }]);

    return EventTarget;
}();

function touchEventHandlerFactory(type) {
    return function (touches) {
        var touchEvent = new TouchEvent(type);

        touchEvent.touches = touches;
        touchEvent.targetTouches = Array.prototype.slice.call(touchEvent.touches);
        touchEvent.changedTouches = touches; //event.changedTouches
        // touchEvent.timeStamp = event.timeStamp

        var i = 0,
            touchCount = touches.length;
        var target;
        var touchListenerMap = __listenerMap.touch;
        for (var key in touchListenerMap) {
            target = touchListenerMap[key];
            for (i = 0; i < touchCount; ++i) {
                touches[i].target = target;
            }
            target.dispatchEvent(touchEvent);
        }
    };
}

jsb.onTouchStart = touchEventHandlerFactory('touchstart');
jsb.onTouchMove = touchEventHandlerFactory('touchmove');
jsb.onTouchEnd = touchEventHandlerFactory('touchend');
jsb.onTouchCancel = touchEventHandlerFactory('touchcancel');

function mouseEventHandlerFactory(type) {
    return function (event) {
        var button = event.button;
        var x = event.x;
        var y = event.y;

        var mouseEvent = new MouseEvent(type, {
            button: button,
            which: button + 1,
            wheelDelta: event.wheelDeltaY,
            clientX: x,
            clientY: y,
            screenX: x,
            screenY: y,
            pageX: x,
            pageY: y
        });

        var target;
        var mouseListenerMap = __listenerMap.mouse;
        for (var key in mouseListenerMap) {
            target = mouseListenerMap[key];
            target.dispatchEvent(mouseEvent);
        }
    };
}

jsb.onMouseDown = mouseEventHandlerFactory('mousedown');
jsb.onMouseMove = mouseEventHandlerFactory('mousemove');
jsb.onMouseUp = mouseEventHandlerFactory('mouseup');
jsb.onMouseWheel = mouseEventHandlerFactory('mousewheel');

function keyboardEventHandlerFactory(type) {
    return function (event) {
        var keyboardEvent = new KeyboardEvent(type, {
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey,
            repeat: event.repeat,
            keyCode: event.keyCode
        });
        var target;
        var keyboardListenerMap = __listenerMap.keyboard;
        for (var key in keyboardListenerMap) {
            target = keyboardListenerMap[key];
            target.dispatchEvent(keyboardEvent);
        }
    };
}

jsb.onKeyDown = keyboardEventHandlerFactory('keydown');
jsb.onKeyUp = keyboardEventHandlerFactory('keyup');

jsb.device.dispatchDeviceMotionEvent = function (event) {
    var target;
    var devicemotionListenerMap = __listenerMap.devicemotion;
    for (var key in devicemotionListenerMap) {
        target = devicemotionListenerMap[key];
        target.dispatchEvent(event);
    }
};

module.exports = EventTarget;

},{}],10:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventTarget = require('./EventTarget');

var FileReader = function (_EventTarget) {
	_inherits(FileReader, _EventTarget);

	function FileReader() {
		_classCallCheck(this, FileReader);

		return _possibleConstructorReturn(this, (FileReader.__proto__ || Object.getPrototypeOf(FileReader)).apply(this, arguments));
	}

	_createClass(FileReader, [{
		key: 'construct',
		value: function construct() {
			this.result = null;
		}

		// Aborts the read operation. Upon return, the readyState will be DONE.

	}, {
		key: 'abort',
		value: function abort() {}

		// Starts reading the contents of the specified Blob, once finished, the result attribute contains an ArrayBuffer representing the file's data.

	}, {
		key: 'readAsArrayBuffer',
		value: function readAsArrayBuffer() {}

		// Starts reading the contents of the specified Blob, once finished, the result attribute contains a data: URL representing the file's data.

	}, {
		key: 'readAsDataURL',
		value: function readAsDataURL(blob) {
			this.result = 'data:image/png;base64,' + window.btoa(blob);
			var event = new Event('load');
			this.dispatchEvent(event);
		}

		// Starts reading the contents of the specified Blob, once finished, the result attribute contains the contents of the file as a text string.

	}, {
		key: 'readAsText',
		value: function readAsText() {}
	}]);

	return FileReader;
}(EventTarget);

module.exports = FileReader;

},{"./EventTarget":9}],11:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FontFace = function () {
    function FontFace(family, source, descriptors) {
        var _this = this;

        _classCallCheck(this, FontFace);

        this.family = family;
        this.source = source;
        this.descriptors = descriptors;

        this._status = 'unloaded';

        this._loaded = new Promise(function (resolve, reject) {
            _this._resolveCB = resolve;
            _this._rejectCB = reject;
        });
    }

    _createClass(FontFace, [{
        key: 'load',
        value: function load() {
            // class FontFaceSet, add(fontFace) have done the load work
        }
    }, {
        key: 'status',
        get: function get() {
            return this._status;
        }
    }, {
        key: 'loaded',
        get: function get() {
            return this._loaded;
        }
    }]);

    return FontFace;
}();

module.exports = FontFace;

},{}],12:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventTarget = require('./EventTarget');
var Event = require('./Event');

var FontFaceSet = function (_EventTarget) {
    _inherits(FontFaceSet, _EventTarget);

    function FontFaceSet() {
        _classCallCheck(this, FontFaceSet);

        var _this = _possibleConstructorReturn(this, (FontFaceSet.__proto__ || Object.getPrototypeOf(FontFaceSet)).call(this));

        _this._status = 'loading';
        return _this;
    }

    _createClass(FontFaceSet, [{
        key: 'add',
        value: function add(fontFace) {
            var _this2 = this;

            this._status = fontFace._status = 'loading';
            this.dispatchEvent(new Event('loading'));
            // Call native binding method to set the ttf font to native platform.
            var family = jsb.loadFont(fontFace.family, fontFace.source);
            setTimeout(function () {
                if (family) {
                    fontFace._status = _this2._status = 'loaded';
                    fontFace._resolveCB();
                    _this2.dispatchEvent(new Event('loadingdone'));
                } else {
                    fontFace._status = _this2._status = 'error';
                    fontFace._rejectCB();
                    _this2.dispatchEvent(new Event('loadingerror'));
                }
            }, 0);
        }
    }, {
        key: 'clear',
        value: function clear() {}
    }, {
        key: 'delete',
        value: function _delete() {}
    }, {
        key: 'load',
        value: function load() {}
    }, {
        key: 'ready',
        value: function ready() {}
    }, {
        key: 'status',
        get: function get() {
            return this._status;
        }
    }, {
        key: 'onloading',
        set: function set(listener) {
            this.addEventListener('loading', listener);
        }
    }, {
        key: 'onloadingdone',
        set: function set(listener) {
            this.addEventListener('loadingdone', listener);
        }
    }, {
        key: 'onloadingerror',
        set: function set(listener) {
            this.addEventListener('loadingerror', listener);
        }
    }]);

    return FontFaceSet;
}(EventTarget);

module.exports = FontFaceSet;

},{"./Event":8,"./EventTarget":9}],13:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HTMLElement = require('./HTMLElement');
var ImageData = require('./ImageData');
var DOMRect = require('./DOMRect');

var clamp = function clamp(value) {
    value = Math.round(value);
    return value < 0 ? 0 : value < 255 ? value : 255;
};

var CanvasGradient = function () {
    function CanvasGradient() {
        _classCallCheck(this, CanvasGradient);

        console.log("==> CanvasGradient constructor");
    }

    _createClass(CanvasGradient, [{
        key: 'addColorStop',
        value: function addColorStop(offset, color) {
            console.log("==> CanvasGradient addColorStop");
        }
    }]);

    return CanvasGradient;
}();

var TextMetrics = function () {
    function TextMetrics(width) {
        _classCallCheck(this, TextMetrics);

        this._width = width;
    }

    _createClass(TextMetrics, [{
        key: 'width',
        get: function get() {
            return this._width;
        }
    }]);

    return TextMetrics;
}();

var HTMLCanvasElement = function (_HTMLElement) {
    _inherits(HTMLCanvasElement, _HTMLElement);

    function HTMLCanvasElement(width, height) {
        _classCallCheck(this, HTMLCanvasElement);

        var _this = _possibleConstructorReturn(this, (HTMLCanvasElement.__proto__ || Object.getPrototypeOf(HTMLCanvasElement)).call(this, 'canvas'));

        _this.id = 'glcanvas';
        _this.type = 'canvas';

        _this.top = 0;
        _this.left = 0;
        _this._width = width ? Math.ceil(width) : 0;
        _this._height = height ? Math.ceil(height) : 0;
        _this._context2D = null;
        _this._data = null;
        _this._alignment = 4; // Canvas is used for rendering text only and we make sure the data format is RGBA.
        // Whether the pixel data is premultiplied.
        _this._premultiplied = false;
        return _this;
    }

    //REFINE: implement opts.


    _createClass(HTMLCanvasElement, [{
        key: 'getContext',
        value: function getContext(name, opts) {
            var self = this;
            // console.log(`==> Canvas getContext(${name})`);
            if (name === 'webgl' || name === 'experimental-webgl') {
                if (this === window.__canvas) return window.__gl;else return null;
            } else if (name === '2d') {
                if (!this._context2D) {
                    this._context2D = new CanvasRenderingContext2D(this._width, this._height);
                    this._data = new ImageData(this._width, this._height);
                    this._context2D._canvas = this;
                    this._context2D._setCanvasBufferUpdatedCallback(function (data) {
                        // FIXME: Canvas's data will take 2x memory size, one in C++, another is obtained by Uint8Array here.
                        self._data = new ImageData(data, self._width, self._height);
                        // If the width of canvas could be divided by 2, it means that the bytes per row could be divided by 8.
                        self._alignment = self._width % 2 === 0 ? 8 : 4;
                    });
                }
                return this._context2D;
            }

            return null;
        }
    }, {
        key: 'getBoundingClientRect',
        value: function getBoundingClientRect() {
            return new DOMRect(0, 0, this._width, this._height);
        }
    }, {
        key: 'width',
        set: function set(width) {
            width = Math.ceil(width);
            if (this._width !== width) {
                this._width = width;
                if (this._context2D) {
                    this._context2D._width = width;
                }
            }
        },
        get: function get() {
            return this._width;
        }
    }, {
        key: 'height',
        set: function set(height) {
            height = Math.ceil(height);
            if (this._height !== height) {
                this._height = height;
                if (this._context2D) {
                    this._context2D._height = height;
                }
            }
        },
        get: function get() {
            return this._height;
        }
    }, {
        key: 'clientWidth',
        get: function get() {
            return this._width;
        }
    }, {
        key: 'clientHeight',
        get: function get() {
            return this._height;
        }
    }, {
        key: 'data',
        get: function get() {
            if (this._data) {
                return this._data.data;
            }
            return null;
        }
    }]);

    return HTMLCanvasElement;
}(HTMLElement);

var ctx2DProto = CanvasRenderingContext2D.prototype;

// ImageData ctx.createImageData(imagedata);
// ImageData ctx.createImageData(width, height);
ctx2DProto.createImageData = function (args1, args2) {
    if (typeof args1 === 'number' && typeof args2 == 'number') {
        return new ImageData(args1, args2);
    } else if (args1 instanceof ImageData) {
        return new ImageData(args1.data, args1.width, args1.height);
    }
};

// void ctx.putImageData(imagedata, dx, dy);
// void ctx.putImageData(imagedata, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight);
ctx2DProto.putImageData = function (imageData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
    if (typeof loadRuntime === "function") {
        var height = imageData.height;
        var width = imageData.width;
        var canvasWidth = this._canvas._width;
        var canvasHeight = this._canvas._height;
        dirtyX = dirtyX || 0;
        dirtyY = dirtyY || 0;
        dirtyWidth = dirtyWidth !== undefined ? dirtyWidth : width;
        dirtyHeight = dirtyHeight !== undefined ? dirtyHeight : height;
        var limitBottom = dirtyY + dirtyHeight;
        var limitRight = dirtyX + dirtyWidth;
        // shrink dirty rect if next image rect bigger than canvas rect
        dirtyHeight = limitBottom < canvasHeight ? dirtyHeight : dirtyHeight - (limitBottom - canvasHeight);
        dirtyWidth = limitRight < canvasWidth ? dirtyWidth : dirtyWidth - (limitRight - canvasWidth);
        // collect data needed to put
        dirtyWidth = Math.floor(dirtyWidth);
        dirtyHeight = Math.floor(dirtyHeight);
        var imageToFill = new ImageData(dirtyWidth, dirtyHeight);
        for (var y = dirtyY; y < limitBottom; y++) {
            for (var x = dirtyX; x < limitRight; x++) {
                var imgPos = y * width + x;
                var toPos = (y - dirtyY) * dirtyWidth + (x - dirtyX);
                imageToFill.data[toPos * 4 + 0] = imageData.data[imgPos * 4 + 0];
                imageToFill.data[toPos * 4 + 1] = imageData.data[imgPos * 4 + 1];
                imageToFill.data[toPos * 4 + 2] = imageData.data[imgPos * 4 + 2];
                imageToFill.data[toPos * 4 + 3] = imageData.data[imgPos * 4 + 3];
            }
        }
        // do image data write operation at Native (only impl on Android)
        this._fillImageData(imageToFill.data, dirtyWidth, dirtyHeight, dx, dy);
    } else {
        this._canvas._data = imageData;
    }
};

// ImageData ctx.getImageData(sx, sy, sw, sh);
ctx2DProto.getImageData = function (sx, sy, sw, sh) {
    var canvasWidth = this._canvas._width;
    var canvasHeight = this._canvas._height;
    var canvasBuffer = this._canvas._data.data;
    // image rect may bigger that canvas rect
    var maxValidSH = sh + sy < canvasHeight ? sh : canvasHeight - sy;
    var maxValidSW = sw + sx < canvasWidth ? sw : canvasWidth - sx;
    var imgBuffer = new Uint8ClampedArray(sw * sh * 4);
    for (var y = 0; y < maxValidSH; y++) {
        for (var x = 0; x < maxValidSW; x++) {
            var canvasPos = (y + sy) * canvasWidth + (x + sx);
            var imgPos = y * sw + x;
            imgBuffer[imgPos * 4 + 0] = canvasBuffer[canvasPos * 4 + 0];
            imgBuffer[imgPos * 4 + 1] = canvasBuffer[canvasPos * 4 + 1];
            imgBuffer[imgPos * 4 + 2] = canvasBuffer[canvasPos * 4 + 2];
            imgBuffer[imgPos * 4 + 3] = canvasBuffer[canvasPos * 4 + 3];
        }
    }
    return new ImageData(imgBuffer, sw, sh);
};

module.exports = HTMLCanvasElement;

},{"./DOMRect":5,"./HTMLElement":14,"./ImageData":20}],14:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Element = require('./Element');

var _require = require('./util'),
    noop = _require.noop;

var HTMLElement = function (_Element) {
  _inherits(HTMLElement, _Element);

  function HTMLElement() {
    var tagName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    _classCallCheck(this, HTMLElement);

    var _this = _possibleConstructorReturn(this, (HTMLElement.__proto__ || Object.getPrototypeOf(HTMLElement)).call(this));

    _this.tagName = tagName.toUpperCase();

    _this.className = '';
    _this.children = [];
    _this.style = {
      width: window.innerWidth + 'px',
      height: window.innerHeight + 'px'
    };

    _this.innerHTML = '';
    _this.parentElement = window.__canvas;
    return _this;
  }

  _createClass(HTMLElement, [{
    key: 'setAttribute',
    value: function setAttribute(name, value) {
      this[name] = value;
    }
  }, {
    key: 'getAttribute',
    value: function getAttribute(name) {
      return this[name];
    }
  }, {
    key: 'focus',
    value: function focus() {}
  }]);

  return HTMLElement;
}(Element);

module.exports = HTMLElement;

},{"./Element":7,"./util":31}],15:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var HTMLElement = require('./HTMLElement');
var Event = require('./Event');
var gl = window.__gl;

var HTMLImageElement = function (_HTMLElement) {
    _inherits(HTMLImageElement, _HTMLElement);

    function HTMLImageElement(width, height, isCalledFromImage) {
        _classCallCheck(this, HTMLImageElement);

        if (!isCalledFromImage) {
            throw new TypeError("Illegal constructor, use 'new Image(w, h); instead!'");
            return _possibleConstructorReturn(_this);
        }

        var _this = _possibleConstructorReturn(this, (HTMLImageElement.__proto__ || Object.getPrototypeOf(HTMLImageElement)).call(this, 'img'));

        _this.width = width ? width : 0;
        _this.height = height ? height : 0;
        _this._data = null;
        _this._src = null;
        _this.complete = false;
        _this._glFormat = _this._glInternalFormat = gl.RGBA;
        _this.crossOrigin = null;
        return _this;
    }

    _createClass(HTMLImageElement, [{
        key: 'getBoundingClientRect',
        value: function getBoundingClientRect() {
            return new DOMRect(0, 0, this.width, this.height);
        }
    }, {
        key: 'src',
        set: function set(src) {
            var _this2 = this;

            this._src = src;
            jsb.loadImage(src, function (info) {
                if (!info) {
                    _this2._data = null;
                    var event = new Event('error');
                    _this2.dispatchEvent(event);
                    return;
                }
                _this2.width = _this2.naturalWidth = info.width;
                _this2.height = _this2.naturalHeight = info.height;
                _this2._data = info.data;
                // console.log(`glFormat: ${info.glFormat}, glInternalFormat: ${info.glInternalFormat}, glType: ${info.glType}`);
                _this2._glFormat = info.glFormat;
                _this2._glInternalFormat = info.glInternalFormat;
                _this2._glType = info.glType;
                _this2._numberOfMipmaps = info.numberOfMipmaps;
                _this2._compressed = info.compressed;
                _this2._bpp = info.bpp;
                _this2._premultiplyAlpha = info.premultiplyAlpha;

                _this2._alignment = 1;
                // Set the row align only when mipmapsNum == 1 and the data is uncompressed
                if ((_this2._numberOfMipmaps == 0 || _this2._numberOfMipmaps == 1) && !_this2._compressed) {
                    var bytesPerRow = _this2.width * _this2._bpp / 8;
                    if (bytesPerRow % 8 == 0) _this2._alignment = 8;else if (bytesPerRow % 4 == 0) _this2._alignment = 4;else if (bytesPerRow % 2 == 0) _this2._alignment = 2;
                }

                _this2.complete = true;

                var event = new Event('load');
                _this2.dispatchEvent(event);
            });
        },
        get: function get() {
            return this._src;
        }
    }, {
        key: 'clientWidth',
        get: function get() {
            return this.width;
        }
    }, {
        key: 'clientHeight',
        get: function get() {
            return this.height;
        }
    }]);

    return HTMLImageElement;
}(HTMLElement);

module.exports = HTMLImageElement;

},{"./Event":8,"./HTMLElement":14}],16:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var HTMLElement = require('./HTMLElement');
var MediaError = require('./MediaError');

var HAVE_NOTHING = 0;
var HAVE_METADATA = 1;
var HAVE_CURRENT_DATA = 2;
var HAVE_FUTURE_DATA = 3;
var HAVE_ENOUGH_DATA = 4;

var HTMLMediaElement = function (_HTMLElement) {
    _inherits(HTMLMediaElement, _HTMLElement);

    function HTMLMediaElement(type) {
        _classCallCheck(this, HTMLMediaElement);

        var _this = _possibleConstructorReturn(this, (HTMLMediaElement.__proto__ || Object.getPrototypeOf(HTMLMediaElement)).call(this, type));

        _this._volume = 1.0;
        _this._duration = 0;
        _this._isEnded = false;
        _this._isMute = false;
        _this._readyState = HAVE_NOTHING;
        _this._error = new MediaError();
        return _this;
    }

    _createClass(HTMLMediaElement, [{
        key: 'addTextTrack',
        value: function addTextTrack() {}
    }, {
        key: 'captureStream',
        value: function captureStream() {}
    }, {
        key: 'fastSeek',
        value: function fastSeek() {}
    }, {
        key: 'load',
        value: function load() {}
    }, {
        key: 'pause',
        value: function pause() {}
    }, {
        key: 'play',
        value: function play() {}
    }, {
        key: 'canPlayType',
        value: function canPlayType(mediaType) {
            return '';
        }
    }, {
        key: 'volume',
        set: function set(volume) {
            this._volume = volume;
        },
        get: function get() {
            return this._volume;
        }
    }, {
        key: 'duration',
        get: function get() {
            return this._duration;
        }
    }, {
        key: 'ended',
        get: function get() {
            return this._isEnded;
        }
    }, {
        key: 'muted',
        get: function get() {
            return this._isMute;
        }
    }, {
        key: 'readyState',
        get: function get() {
            return this._readyState;
        }
    }, {
        key: 'error',
        get: function get() {
            return this._error;
        }
    }, {
        key: 'currentTime',
        get: function get() {
            return 0;
        }
    }]);

    return HTMLMediaElement;
}(HTMLElement);

module.exports = HTMLMediaElement;

},{"./HTMLElement":14,"./MediaError":22}],17:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var HTMLElement = require('./HTMLElement');
var Event = require('./Event');

var _importmaps = [];

var HTMLScriptElement = function (_HTMLElement) {
    _inherits(HTMLScriptElement, _HTMLElement);

    function HTMLScriptElement(width, height) {
        _classCallCheck(this, HTMLScriptElement);

        return _possibleConstructorReturn(this, (HTMLScriptElement.__proto__ || Object.getPrototypeOf(HTMLScriptElement)).call(this, 'script'));
    }

    _createClass(HTMLScriptElement, [{
        key: 'type',
        set: function set(type) {
            if (type === "systemjs-importmap") {
                if (_importmaps.indexOf(this) === -1) {
                    _importmaps.push(this);
                }
            }
        }
    }, {
        key: 'src',
        set: function set(url) {
            var _this2 = this;

            setTimeout(function () {
                require(url);
                _this2.dispatchEvent(new Event('load'));
            }, 0);
        }
    }]);

    return HTMLScriptElement;
}(HTMLElement);

HTMLScriptElement._getAllScriptElementsSystemJSImportType = function () {
    return _importmaps;
};

module.exports = HTMLScriptElement;

},{"./Event":8,"./HTMLElement":14}],18:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var HTMLMediaElement = require('./HTMLMediaElement');

var HTMLVideoElement = function (_HTMLMediaElement) {
  _inherits(HTMLVideoElement, _HTMLMediaElement);

  function HTMLVideoElement() {
    _classCallCheck(this, HTMLVideoElement);

    return _possibleConstructorReturn(this, (HTMLVideoElement.__proto__ || Object.getPrototypeOf(HTMLVideoElement)).call(this, 'video'));
  }

  _createClass(HTMLVideoElement, [{
    key: 'canPlayType',
    value: function canPlayType(type) {
      if (type === 'video/mp4') return true;
      return false;
    }
  }]);

  return HTMLVideoElement;
}(HTMLMediaElement);

module.exports = HTMLVideoElement;

},{"./HTMLMediaElement":16}],19:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var HTMLImageElement = require('./HTMLImageElement');

var Image = function (_HTMLImageElement) {
    _inherits(Image, _HTMLImageElement);

    function Image(width, height) {
        _classCallCheck(this, Image);

        return _possibleConstructorReturn(this, (Image.__proto__ || Object.getPrototypeOf(Image)).call(this, width, height, true));
    }

    return Image;
}(HTMLImageElement);

module.exports = Image;

},{"./HTMLImageElement":15}],20:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ImageData = function () {

    // var imageData = new ImageData(array, width, height);
    // var imageData = new ImageData(width, height);
    function ImageData(array, width, height) {
        _classCallCheck(this, ImageData);

        if (typeof array === 'number' && typeof width == 'number') {
            height = width;
            width = array;
            array = null;
        }
        if (array === null) {
            this._data = new Uint8ClampedArray(width * height * 4);
        } else {
            this._data = array;
        }
        this._width = width;
        this._height = height;
    }

    _createClass(ImageData, [{
        key: 'data',
        get: function get() {
            return this._data;
        }
    }, {
        key: 'width',
        get: function get() {
            return this._width;
        }
    }, {
        key: 'height',
        get: function get() {
            return this._height;
        }
    }]);

    return ImageData;
}();

module.exports = ImageData;

},{}],21:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Event = require('./Event');

var __numberShiftMap = {
    '48': ')', // 0
    '49': '!', // 1
    '50': '@', // 2
    '51': '#', // 3
    '52': '$', // 4
    '53': '%', // 5
    '54': '^', // 6
    '55': '&', // 7
    '56': '*', // 8
    '57': '(' // 9
};

var __capsLockActive = false;

var KeyboardEvent = function (_Event) {
    _inherits(KeyboardEvent, _Event);

    function KeyboardEvent(type, KeyboardEventInit) {
        _classCallCheck(this, KeyboardEvent);

        var _this = _possibleConstructorReturn(this, (KeyboardEvent.__proto__ || Object.getPrototypeOf(KeyboardEvent)).call(this, type));

        if ((typeof KeyboardEventInit === 'undefined' ? 'undefined' : _typeof(KeyboardEventInit)) === 'object') {
            _this._altKeyActive = KeyboardEventInit.altKey ? KeyboardEventInit.altKey : false;
            _this._ctrlKeyActive = KeyboardEventInit.ctrlKey ? KeyboardEventInit.ctrlKey : false;
            _this._metaKeyActive = KeyboardEventInit.metaKey ? KeyboardEventInit.metaKey : false;
            _this._shiftKeyActive = KeyboardEventInit.shiftKey ? KeyboardEventInit.shiftKey : false;
            _this._keyCode = KeyboardEventInit.keyCode ? KeyboardEventInit.keyCode : -1;
            _this._repeat = KeyboardEventInit.repeat ? KeyboardEventInit.repeat : false;
        } else {
            _this._altKeyActive = false;
            _this._ctrlKeyActive = false;
            _this._metaKeyActive = false;
            _this._shiftKeyActive = false;
            _this._keyCode = -1;
            _this._repeat = false;
        }

        var keyCode = _this._keyCode;
        if (keyCode >= 48 && keyCode <= 57) {
            // 0 ~ 9
            var number = keyCode - 48;
            _this._code = 'Digit' + number;
            _this._key = _this._shiftKeyActive ? __numberShiftMap[keyCode] : '' + number;
        } else if (keyCode >= 10048 && keyCode <= 10057) {
            // Numberpad 0 ~ 9
            // reset to web keyCode since it's a hack in C++ for distinguish numbers in Numberpad.
            keyCode = _this._keyCode = keyCode - 10000;
            var number = keyCode - 48;
            _this._code = 'Numpad' + number;
            _this._key = '' + number;
        } else if (keyCode >= 65 && keyCode <= 90) {
            // A ~ Z
            var charCode = String.fromCharCode(keyCode);
            _this._code = 'Key' + charCode;
            _this._key = _this._shiftKeyActive || __capsLockActive ? charCode : charCode.toLowerCase();
        } else if (keyCode >= 112 && keyCode <= 123) {
            // F1 ~ F12
            _this._code = _this._key = 'F' + (keyCode - 111);
        } else if (keyCode === 27) {
            _this._code = _this._key = 'Escape';
        } else if (keyCode === 189) {
            _this._code = 'Minus';
            _this._key = _this._shiftKeyActive ? '_' : '-';
        } else if (keyCode === 187) {
            _this._code = 'Equal';
            _this._key = _this._shiftKeyActive ? '+' : '=';
        } else if (keyCode === 220) {
            _this._code = 'Backslash';
            _this._key = _this._shiftKeyActive ? '|' : '\\';
        } else if (keyCode === 192) {
            _this._code = 'Backquote';
            _this._key = _this._shiftKeyActive ? '~' : '`';
        } else if (keyCode === 8) {
            _this._code = _this._key = 'Backspace';
        } else if (keyCode === 13) {
            _this._code = _this._key = 'Enter';
        } else if (keyCode === 219) {
            _this._code = 'BracketLeft';
            _this._key = _this._shiftKeyActive ? '{' : '[';
        } else if (keyCode === 221) {
            _this._code = 'BracketRight';
            _this._key = _this._shiftKeyActive ? '}' : ']';
        } else if (keyCode === 186) {
            _this._code = 'Semicolon';
            _this._key = _this._shiftKeyActive ? ':' : ';';
        } else if (keyCode === 222) {
            _this._code = 'Quote';
            _this._key = _this._shiftKeyActive ? '"' : "'";
        } else if (keyCode === 9) {
            _this._code = _this._key = 'Tab';
        } else if (keyCode === 17) {
            _this._code = 'ControlLeft';
            _this._key = 'Control';
        } else if (keyCode === 20017) {
            _this._keyCode = 17; // Reset to the real value.
            _this._code = 'ControlRight';
            _this._key = 'Control';
        } else if (keyCode === 16) {
            _this._code = 'ShiftLeft';
            _this._key = 'Shift';
        } else if (keyCode === 20016) {
            _this._keyCode = 16; // Reset to the real value.
            _this._code = 'ShiftRight';
            _this._key = 'Shift';
        } else if (keyCode === 18) {
            _this._code = 'AltLeft';
            _this._key = 'Alt';
        } else if (keyCode === 20018) {
            _this._keyCode = 18; // Reset to the real value.
            _this._code = 'AltRight';
            _this._key = 'Alt';
        } else if (keyCode === 91) {
            _this._code = 'MetaLeft';
            _this._key = 'Meta';
        } else if (keyCode === 93) {
            _this._code = 'MetaRight';
            _this._key = 'Meta';
        } else if (keyCode === 37) {
            _this._code = _this._key = 'ArrowLeft';
        } else if (keyCode === 38) {
            _this._code = _this._key = 'ArrowUp';
        } else if (keyCode === 39) {
            _this._code = _this._key = 'ArrowRight';
        } else if (keyCode === 40) {
            _this._code = _this._key = 'ArrowDown';
        } else if (keyCode === 20093) {
            _this._keyCode = 93; // Bug of brower since its keycode is the same as MetaRight.
            _this._code = _this._key = 'ContextMenu';
        } else if (keyCode === 20013) {
            _this._keyCode = 13;
            _this._code = 'NumpadEnter';
            _this._key = 'Enter';
        } else if (keyCode === 107) {
            _this._code = 'NumpadAdd';
            _this._key = '+';
        } else if (keyCode === 109) {
            _this._code = 'NumpadSubtract';
            _this._key = '-';
        } else if (keyCode === 106) {
            _this._code = 'NumpadMultiply';
            _this._key = '*';
        } else if (keyCode === 111) {
            _this._code = 'NumpadDivide';
            _this._key = '/';
        } else if (keyCode === 12) {
            _this._code = 'NumLock';
            _this._key = 'Clear';
        } else if (keyCode === 124) {
            _this._code = _this._key = 'F13';
        } else if (keyCode === 36) {
            _this._code = _this._key = 'Home';
        } else if (keyCode === 33) {
            _this._code = _this._key = 'PageUp';
        } else if (keyCode === 34) {
            _this._code = _this._key = 'PageDown';
        } else if (keyCode === 35) {
            _this._code = _this._key = 'End';
        } else if (keyCode === 188) {
            _this._code = 'Comma';
            _this._key = _this._shiftKeyActive ? '<' : ',';
        } else if (keyCode === 190) {
            _this._code = 'Period';
            _this._key = _this._shiftKeyActive ? '>' : '.';
        } else if (keyCode === 191) {
            _this._code = 'Slash';
            _this._key = _this._shiftKeyActive ? '?' : '/';
        } else if (keyCode === 32) {
            _this._code = 'Space';
            _this._key = ' ';
        } else if (keyCode === 46) {
            _this._code = _this._key = 'Delete';
        } else if (keyCode === 110) {
            _this._code = 'NumpadDecimal';
            _this._key = '.';
        } else if (keyCode === 20) {
            _this._code = _this._key = 'CapsLock';
            if (type === 'keyup') {
                __capsLockActive = !__capsLockActive;
            }
        } else {
            console.log("Unknown keyCode: " + _this._keyCode);
        }
        return _this;
    }

    // Returns a Boolean indicating if the modifier key, like Alt, Shift, Ctrl, or Meta, was pressed when the event was created.


    _createClass(KeyboardEvent, [{
        key: 'getModifierState',
        value: function getModifierState() {
            return false;
        }

        // Returns a Boolean that is true if the Alt ( Option or ⌥ on OS X) key was active when the key event was generated.

    }, {
        key: 'altKey',
        get: function get() {
            return this._altKeyActive;
        }

        // Returns a DOMString with the code value of the key represented by the event.

    }, {
        key: 'code',
        get: function get() {
            return this._code;
        }

        // Returns a Boolean that is true if the Ctrl key was active when the key event was generated.

    }, {
        key: 'ctrlKey',
        get: function get() {
            return this._ctrlKeyActive;
        }

        // Returns a Boolean that is true if the event is fired between after compositionstart and before compositionend.

    }, {
        key: 'isComposing',
        get: function get() {
            return false;
        }

        // Returns a DOMString representing the key value of the key represented by the event.

    }, {
        key: 'key',
        get: function get() {
            return this._key;
        }
    }, {
        key: 'keyCode',
        get: function get() {
            return this._keyCode;
        }

        // Returns a Number representing the location of the key on the keyboard or other input device.

    }, {
        key: 'location',
        get: function get() {
            return 0;
        }

        // Returns a Boolean that is true if the Meta key (on Mac keyboards, the ⌘ Command key; on Windows keyboards, the Windows key (⊞)) was active when the key event was generated.

    }, {
        key: 'metaKey',
        get: function get() {
            return this._metaKeyActive;
        }

        // Returns a Boolean that is true if the key is being held down such that it is automatically repeating.

    }, {
        key: 'repeat',
        get: function get() {
            return this._repeat;
        }

        // Returns a Boolean that is true if the Shift key was active when the key event was generated.

    }, {
        key: 'shiftKey',
        get: function get() {
            return this._shiftKeyActive;
        }
    }]);

    return KeyboardEvent;
}(Event);

module.exports = KeyboardEvent;

},{"./Event":8}],22:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MEDIA_ERR_ABORTED = 1;
var MEDIA_ERR_NETWORK = 2;
var MEDIA_ERR_DECODE = 3;
var MEDIA_ERR_SRC_NOT_SUPPORTED = 4;

var MediaError = function () {
	function MediaError() {
		_classCallCheck(this, MediaError);
	}

	_createClass(MediaError, [{
		key: "code",
		get: function get() {
			return MEDIA_ERR_ABORTED;
		}
	}, {
		key: "message",
		get: function get() {
			return "";
		}
	}]);

	return MediaError;
}();

module.exports = MediaError;

},{}],23:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Event = require('./Event');

var MouseEvent = function (_Event) {
    _inherits(MouseEvent, _Event);

    function MouseEvent(type, initArgs) {
        _classCallCheck(this, MouseEvent);

        var _this = _possibleConstructorReturn(this, (MouseEvent.__proto__ || Object.getPrototypeOf(MouseEvent)).call(this, type));

        _this._button = initArgs.button;
        _this._which = initArgs.which;
        _this._wheelDelta = initArgs.wheelDelta;
        _this._clientX = initArgs.clientX;
        _this._clientY = initArgs.clientY;
        _this._screenX = initArgs.screenX;
        _this._screenY = initArgs.screenY;
        _this._pageX = initArgs.pageX;
        _this._pageY = initArgs.pageY;
        return _this;
    }

    _createClass(MouseEvent, [{
        key: 'button',
        get: function get() {
            return this._button;
        }
    }, {
        key: 'which',
        get: function get() {
            return this._which;
        }
    }, {
        key: 'wheelDelta',
        get: function get() {
            return this._wheelDelta;
        }
    }, {
        key: 'clientX',
        get: function get() {
            return this._clientX;
        }
    }, {
        key: 'clientY',
        get: function get() {
            return this._clientY;
        }
    }, {
        key: 'screenX',
        get: function get() {
            return this._screenX;
        }
    }, {
        key: 'screenY',
        get: function get() {
            return this._screenY;
        }
    }, {
        key: 'pageX',
        get: function get() {
            return this._pageX;
        }
    }, {
        key: 'pageY',
        get: function get() {
            return this._pageY;
        }
    }]);

    return MouseEvent;
}(Event);

module.exports = MouseEvent;

},{"./Event":8}],24:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventTarget = require('./EventTarget');

var Node = function (_EventTarget) {
  _inherits(Node, _EventTarget);

  function Node() {
    _classCallCheck(this, Node);

    var _this = _possibleConstructorReturn(this, (Node.__proto__ || Object.getPrototypeOf(Node)).call(this));

    _this.childNodes = [];
    _this.parentNode = window.__canvas;
    return _this;
  }

  _createClass(Node, [{
    key: 'appendChild',
    value: function appendChild(node) {
      if (node instanceof Node) {
        this.childNodes.push(node);
      } else {
        throw new TypeError('Failed to executed \'appendChild\' on \'Node\': parameter 1 is not of type \'Node\'.');
      }
    }
  }, {
    key: 'insertBefore',
    value: function insertBefore(newNode, referenceNode) {
      //REFINE:
      return newNode;
    }
  }, {
    key: 'replaceChild',
    value: function replaceChild(newChild, oldChild) {
      //REFINE:
      return oldChild;
    }
  }, {
    key: 'cloneNode',
    value: function cloneNode() {
      var copyNode = Object.create(this);

      Object.assign(copyNode, this);
      return copyNode;
    }
  }, {
    key: 'removeChild',
    value: function removeChild(node) {
      var index = this.childNodes.findIndex(function (child) {
        return child === node;
      });

      if (index > -1) {
        return this.childNodes.splice(index, 1);
      }
      return null;
    }
  }, {
    key: 'contains',
    value: function contains(node) {
      return this.childNodes.indexOf(node) > -1;
    }
  }]);

  return Node;
}(EventTarget);

module.exports = Node;

},{"./EventTarget":9}],25:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Event = require('./Event');

var TouchEvent = function (_Event) {
    _inherits(TouchEvent, _Event);

    function TouchEvent(type, touchEventInit) {
        _classCallCheck(this, TouchEvent);

        var _this = _possibleConstructorReturn(this, (TouchEvent.__proto__ || Object.getPrototypeOf(TouchEvent)).call(this, type));

        _this.touches = [];
        _this.targetTouches = [];
        _this.changedTouches = [];
        return _this;
    }

    return TouchEvent;
}(Event);

module.exports = TouchEvent;

},{"./Event":8}],26:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var HTMLElement = require('./HTMLElement');
var Image = require('./Image');
var HTMLCanvasElement = require('./HTMLCanvasElement');
var HTMLVideoElement = require('./HTMLVideoElement');
var HTMLScriptElement = require('./HTMLScriptElement');
var Node = require('./Node');
var FontFaceSet = require('./FontFaceSet');

var Document = function (_Node) {
  _inherits(Document, _Node);

  function Document() {
    _classCallCheck(this, Document);

    var _this = _possibleConstructorReturn(this, (Document.__proto__ || Object.getPrototypeOf(Document)).call(this));

    _this.readyState = 'complete';
    _this.visibilityState = 'visible';
    _this.documentElement = window;
    _this.hidden = false;
    _this.style = {};
    _this.location = require('./location');

    _this.head = new HTMLElement('head');
    _this.body = new HTMLElement('body');

    _this.fonts = new FontFaceSet();

    _this.scripts = [];
    return _this;
  }

  _createClass(Document, [{
    key: 'createElementNS',
    value: function createElementNS(namespaceURI, qualifiedName, options) {
      return this.createElement(qualifiedName);
    }
  }, {
    key: 'createElement',
    value: function createElement(tagName) {
      if (tagName === 'canvas') {
        return new HTMLCanvasElement();
      } else if (tagName === 'img') {
        return new Image();
      } else if (tagName === 'video') {
        return new HTMLVideoElement();
      } else if (tagName === 'script') {
        return new HTMLScriptElement();
      }

      return new HTMLElement(tagName);
    }
  }, {
    key: 'getElementById',
    value: function getElementById(id) {
      if (id === window.__canvas.id || id === 'canvas') {
        return window.__canvas;
      }
      return new HTMLElement(id);
    }
  }, {
    key: 'getElementsByTagName',
    value: function getElementsByTagName(tagName) {
      if (tagName === 'head') {
        return [document.head];
      } else if (tagName === 'body') {
        return [document.body];
      } else if (tagName === 'canvas') {
        return [window.__canvas];
      }
      return [new HTMLElement(tagName)];
    }
  }, {
    key: 'getElementsByName',
    value: function getElementsByName(tagName) {
      if (tagName === 'head') {
        return [document.head];
      } else if (tagName === 'body') {
        return [document.body];
      } else if (tagName === 'canvas') {
        return [window.__canvas];
      }
      return [new HTMLElement(tagName)];
    }
  }, {
    key: 'querySelector',
    value: function querySelector(query) {
      if (query === 'head') {
        return document.head;
      } else if (query === 'body') {
        return document.body;
      } else if (query === 'canvas') {
        return window.__canvas;
      } else if (query === '#' + window.__canvas.id) {
        return window.__canvas;
      }
      return new HTMLElement(query);
    }
  }, {
    key: 'querySelectorAll',
    value: function querySelectorAll(query) {
      if (query === 'head') {
        return [document.head];
      } else if (query === 'body') {
        return [document.body];
      } else if (query === 'canvas') {
        return [window.__canvas];
      } else if (query.startsWith('script[type="systemjs-importmap"]')) {
        return HTMLScriptElement._getAllScriptElementsSystemJSImportType();
      }
      return [new HTMLElement(query)];
    }
  }, {
    key: 'createTextNode',
    value: function createTextNode() {
      return new HTMLElement('text');
    }
  }, {
    key: 'elementFromPoint',
    value: function elementFromPoint() {
      return window.canvas;
    }
  }, {
    key: 'createEvent',
    value: function createEvent(type) {
      if (window[type]) {
        return new window[type]();
      }
      return null;
    }
  }]);

  return Document;
}(Node);

var document = new Document();

module.exports = document;

},{"./FontFaceSet":12,"./HTMLCanvasElement":13,"./HTMLElement":14,"./HTMLScriptElement":17,"./HTMLVideoElement":18,"./Image":19,"./Node":24,"./location":29}],27:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Headers = Headers;
exports.Request = Request;
exports.Response = Response;
exports.fetch = fetch;
var self = window;
var support = {
  searchParams: 'URLSearchParams' in self,
  iterable: 'Symbol' in self && 'iterator' in Symbol,
  blob: 'FileReader' in self && 'Blob' in self && function () {
    try {
      new Blob();
      return true;
    } catch (e) {
      return false;
    }
  }(),
  formData: 'FormData' in self,
  arrayBuffer: 'ArrayBuffer' in self
};

function isDataView(obj) {
  return obj && DataView.prototype.isPrototypeOf(obj);
}

if (support.arrayBuffer) {
  var viewClasses = ['[object Int8Array]', '[object Uint8Array]', '[object Uint8ClampedArray]', '[object Int16Array]', '[object Uint16Array]', '[object Int32Array]', '[object Uint32Array]', '[object Float32Array]', '[object Float64Array]'];

  var isArrayBufferView = ArrayBuffer.isView || function (obj) {
    return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;
  };
}

function normalizeName(name) {
  if (typeof name !== 'string') {
    name = String(name);
  }
  if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name) || name === '') {
    throw new TypeError('Invalid character in header field name');
  }
  return name.toLowerCase();
}

function normalizeValue(value) {
  if (typeof value !== 'string') {
    value = String(value);
  }
  return value;
}

// Build a destructive iterator for the value list
function iteratorFor(items) {
  var iterator = {
    next: function next() {
      var value = items.shift();
      return { done: value === undefined, value: value };
    }
  };

  if (support.iterable) {
    iterator[Symbol.iterator] = function () {
      return iterator;
    };
  }

  return iterator;
}

function Headers(headers) {
  this.map = {};

  if (headers instanceof Headers) {
    headers.forEach(function (value, name) {
      this.append(name, value);
    }, this);
  } else if (Array.isArray(headers)) {
    headers.forEach(function (header) {
      this.append(header[0], header[1]);
    }, this);
  } else if (headers) {
    Object.getOwnPropertyNames(headers).forEach(function (name) {
      this.append(name, headers[name]);
    }, this);
  }
}

Headers.prototype.append = function (name, value) {
  name = normalizeName(name);
  value = normalizeValue(value);
  var oldValue = this.map[name];
  this.map[name] = oldValue ? oldValue + ', ' + value : value;
};

Headers.prototype['delete'] = function (name) {
  delete this.map[normalizeName(name)];
};

Headers.prototype.get = function (name) {
  name = normalizeName(name);
  return this.has(name) ? this.map[name] : null;
};

Headers.prototype.has = function (name) {
  return this.map.hasOwnProperty(normalizeName(name));
};

Headers.prototype.set = function (name, value) {
  this.map[normalizeName(name)] = normalizeValue(value);
};

Headers.prototype.forEach = function (callback, thisArg) {
  for (var name in this.map) {
    if (this.map.hasOwnProperty(name)) {
      callback.call(thisArg, this.map[name], name, this);
    }
  }
};

Headers.prototype.keys = function () {
  var items = [];
  this.forEach(function (value, name) {
    items.push(name);
  });
  return iteratorFor(items);
};

Headers.prototype.values = function () {
  var items = [];
  this.forEach(function (value) {
    items.push(value);
  });
  return iteratorFor(items);
};

Headers.prototype.entries = function () {
  var items = [];
  this.forEach(function (value, name) {
    items.push([name, value]);
  });
  return iteratorFor(items);
};

if (support.iterable) {
  Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
}

function consumed(body) {
  if (body.bodyUsed) {
    return Promise.reject(new TypeError('Already read'));
  }
  body.bodyUsed = true;
}

function fileReaderReady(reader) {
  return new Promise(function (resolve, reject) {
    reader.onload = function () {
      resolve(reader.result);
    };
    reader.onerror = function () {
      reject(reader.error);
    };
  });
}

function readBlobAsArrayBuffer(blob) {
  var reader = new FileReader();
  var promise = fileReaderReady(reader);
  reader.readAsArrayBuffer(blob);
  return promise;
}

function readBlobAsText(blob) {
  var reader = new FileReader();
  var promise = fileReaderReady(reader);
  reader.readAsText(blob);
  return promise;
}

function readArrayBufferAsText(buf) {
  var view = new Uint8Array(buf);
  var chars = new Array(view.length);

  for (var i = 0; i < view.length; i++) {
    chars[i] = String.fromCharCode(view[i]);
  }
  return chars.join('');
}

function bufferClone(buf) {
  if (buf.slice) {
    return buf.slice(0);
  } else {
    var view = new Uint8Array(buf.byteLength);
    view.set(new Uint8Array(buf));
    return view.buffer;
  }
}

function Body() {
  this.bodyUsed = false;

  this._initBody = function (body) {
    this._bodyInit = body;
    if (!body) {
      this._bodyText = '';
    } else if (typeof body === 'string') {
      this._bodyText = body;
    } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
      this._bodyBlob = body;
    } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
      this._bodyFormData = body;
    } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
      this._bodyText = body.toString();
    } else if (support.arrayBuffer && support.blob && isDataView(body)) {
      this._bodyArrayBuffer = bufferClone(body.buffer);
      // IE 10-11 can't handle a DataView body.
      this._bodyInit = new Blob([this._bodyArrayBuffer]);
    } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
      this._bodyArrayBuffer = bufferClone(body);
    } else {
      this._bodyText = body = Object.prototype.toString.call(body);
    }

    if (!this.headers.get('content-type')) {
      if (typeof body === 'string') {
        this.headers.set('content-type', 'text/plain;charset=UTF-8');
      } else if (this._bodyBlob && this._bodyBlob.type) {
        this.headers.set('content-type', this._bodyBlob.type);
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
      }
    }
  };

  if (support.blob) {
    this.blob = function () {
      var rejected = consumed(this);
      if (rejected) {
        return rejected;
      }

      if (this._bodyBlob) {
        return Promise.resolve(this._bodyBlob);
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(new Blob([this._bodyArrayBuffer]));
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as blob');
      } else {
        return Promise.resolve(new Blob([this._bodyText]));
      }
    };

    this.arrayBuffer = function () {
      if (this._bodyArrayBuffer) {
        return consumed(this) || Promise.resolve(this._bodyArrayBuffer);
      } else {
        return this.blob().then(readBlobAsArrayBuffer);
      }
    };
  }

  this.text = function () {
    var rejected = consumed(this);
    if (rejected) {
      return rejected;
    }

    if (this._bodyBlob) {
      return readBlobAsText(this._bodyBlob);
    } else if (this._bodyArrayBuffer) {
      return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer));
    } else if (this._bodyFormData) {
      throw new Error('could not read FormData body as text');
    } else {
      return Promise.resolve(this._bodyText);
    }
  };

  if (support.formData) {
    this.formData = function () {
      return this.text().then(decode);
    };
  }

  this.json = function () {
    return this.text().then(JSON.parse);
  };

  return this;
}

// HTTP methods whose capitalization should be normalized
var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

function normalizeMethod(method) {
  var upcased = method.toUpperCase();
  return methods.indexOf(upcased) > -1 ? upcased : method;
}

function Request(input, options) {
  options = options || {};
  var body = options.body;

  if (input instanceof Request) {
    if (input.bodyUsed) {
      throw new TypeError('Already read');
    }
    this.url = input.url;
    this.credentials = input.credentials;
    if (!options.headers) {
      this.headers = new Headers(input.headers);
    }
    this.method = input.method;
    this.mode = input.mode;
    this.signal = input.signal;
    if (!body && input._bodyInit != null) {
      body = input._bodyInit;
      input.bodyUsed = true;
    }
  } else {
    this.url = String(input);
  }

  this.credentials = options.credentials || this.credentials || 'same-origin';
  if (options.headers || !this.headers) {
    this.headers = new Headers(options.headers);
  }
  this.method = normalizeMethod(options.method || this.method || 'GET');
  this.mode = options.mode || this.mode || null;
  this.signal = options.signal || this.signal;
  this.referrer = null;

  if ((this.method === 'GET' || this.method === 'HEAD') && body) {
    throw new TypeError('Body not allowed for GET or HEAD requests');
  }
  this._initBody(body);
}

Request.prototype.clone = function () {
  return new Request(this, { body: this._bodyInit });
};

function decode(body) {
  var form = new FormData();
  body.trim().split('&').forEach(function (bytes) {
    if (bytes) {
      var split = bytes.split('=');
      var name = split.shift().replace(/\+/g, ' ');
      var value = split.join('=').replace(/\+/g, ' ');
      form.append(decodeURIComponent(name), decodeURIComponent(value));
    }
  });
  return form;
}

function parseHeaders(rawHeaders) {
  var headers = new Headers();
  // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
  // https://tools.ietf.org/html/rfc7230#section-3.2
  var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
  preProcessedHeaders.split(/\r?\n/).forEach(function (line) {
    var parts = line.split(':');
    var key = parts.shift().trim();
    if (key) {
      var value = parts.join(':').trim();
      headers.append(key, value);
    }
  });
  return headers;
}

Body.call(Request.prototype);

function Response(bodyInit, options) {
  if (!options) {
    options = {};
  }

  this.type = 'default';
  this.status = options.status === undefined ? 200 : options.status;
  this.ok = this.status >= 200 && this.status < 300;
  this.statusText = 'statusText' in options ? options.statusText : 'OK';
  this.headers = new Headers(options.headers);
  this.url = options.url || '';
  this._initBody(bodyInit);
}

Body.call(Response.prototype);

Response.prototype.clone = function () {
  return new Response(this._bodyInit, {
    status: this.status,
    statusText: this.statusText,
    headers: new Headers(this.headers),
    url: this.url
  });
};

Response.error = function () {
  var response = new Response(null, { status: 0, statusText: '' });
  response.type = 'error';
  return response;
};

var redirectStatuses = [301, 302, 303, 307, 308];

Response.redirect = function (url, status) {
  if (redirectStatuses.indexOf(status) === -1) {
    throw new RangeError('Invalid status code');
  }

  return new Response(null, { status: status, headers: { location: url } });
};

var DOMException = exports.DOMException = self.DOMException;
try {
  new DOMException();
} catch (err) {
  exports.DOMException = DOMException = function DOMException(message, name) {
    this.message = message;
    this.name = name;
    var error = Error(message);
    this.stack = error.stack;
  };
  DOMException.prototype = Object.create(Error.prototype);
  DOMException.prototype.constructor = DOMException;
}

function fetch(input, init) {
  return new Promise(function (resolve, reject) {
    var request = new Request(input, init);

    if (request.signal && request.signal.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'));
    }

    var xhr = new XMLHttpRequest();

    function abortXhr() {
      xhr.abort();
    }

    xhr.onload = function () {
      var options = {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: parseHeaders(xhr.getAllResponseHeaders() || '')
      };
      options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
      var body = 'response' in xhr ? xhr.response : xhr.responseText;
      resolve(new Response(body, options));
    };

    xhr.onerror = function () {
      reject(new TypeError('Network request failed'));
    };

    xhr.ontimeout = function () {
      reject(new TypeError('Network request failed'));
    };

    xhr.onabort = function () {
      reject(new DOMException('Aborted', 'AbortError'));
    };

    xhr.open(request.method, request.url, true);

    if (request.credentials === 'include') {
      xhr.withCredentials = true;
    } else if (request.credentials === 'omit') {
      xhr.withCredentials = false;
    }

    if ('responseType' in xhr && support.blob) {
      xhr.responseType = 'blob';
    }

    request.headers.forEach(function (value, name) {
      xhr.setRequestHeader(name, value);
    });

    if (request.signal) {
      request.signal.addEventListener('abort', abortXhr);

      xhr.onreadystatechange = function () {
        // DONE (success or failure)
        if (xhr.readyState === 4) {
          request.signal.removeEventListener('abort', abortXhr);
        }
      };
    }

    xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
  });
}

fetch.polyfill = true;

},{}],28:[function(require,module,exports){
'use strict';

require('./window');

},{"./window":32}],29:[function(require,module,exports){
'use strict';

var location = {
    href: 'game.js',
    pathname: 'game.js',
    search: '',
    hash: '',
    reload: function reload() {}
};

module.exports = location;

},{}],30:[function(require,module,exports){
'use strict';

var _require = require('./util'),
    noop = _require.noop;

var navigator = {
  platform: __getOS(),
  language: __getCurrentLanguage(),
  appVersion: '5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Mobile/14E8301 NetType/WIFI Language/zh_CN',
  onLine: true, //FIXME:

  geolocation: {
    getCurrentPosition: noop,
    watchPosition: noop,
    clearWatch: noop
  },

  maxTouchPoints: 10 //FIXME: getting the number from OS.
};

module.exports = navigator;

},{"./util":31}],31:[function(require,module,exports){
"use strict";

function noop() {}

module.exports = noop;

},{}],32:[function(require,module,exports){
'use strict';

function inject() {
    window.top = window.parent = window;

    window.ontouchstart = null;
    window.ontouchmove = null;
    window.ontouchend = null;
    window.ontouchcancel = null;

    window.pageXOffset = window.pageYOffset = window.clientTop = window.clientLeft = 0;
    window.outerWidth = window.innerWidth;
    window.outerHeight = window.innerHeight;

    window.location = require('./location');
    window.document = require('./document');
    window.Element = require('./Element');
    window.HTMLElement = require('./HTMLElement');
    window.HTMLCanvasElement = require('./HTMLCanvasElement');
    window.HTMLImageElement = require('./HTMLImageElement');
    window.HTMLMediaElement = require('./HTMLMediaElement');
    window.HTMLVideoElement = require('./HTMLVideoElement');
    window.HTMLScriptElement = require('./HTMLScriptElement');
    window.__canvas = new HTMLCanvasElement();
    window.__canvas._width = window.innerWidth;
    window.__canvas._height = window.innerHeight;
    window.__gl.canvas = window.__canvas;
    window.navigator = require('./navigator');
    window.Image = require('./Image');
    window.FileReader = require('./FileReader');
    window.FontFace = require('./FontFace');
    window.FontFaceSet = require('./FontFaceSet');
    window.EventTarget = require('./EventTarget');
    window.Event = require('./Event');
    window.TouchEvent = require('./TouchEvent');
    window.MouseEvent = require('./MouseEvent');
    window.KeyboardEvent = require('./KeyboardEvent');
    window.DeviceMotionEvent = require('./DeviceMotionEvent');

    // ES6
    var m_fetch = require('./fetch');
    window.fetch = m_fetch.fetch;
    window.Headers = m_fetch.Headers;
    window.Request = m_fetch.Request;
    window.Response = m_fetch.Response;

    var ROTATION_0 = 0;
    var ROTATION_90 = 1;
    var ROTATION_180 = 2;
    var ROTATION_270 = 3;
    var orientation = 0;
    var rotation = jsb.device.getDeviceRotation();
    switch (rotation) {
        case ROTATION_90:
            orientation = 90;
            break;
        case ROTATION_180:
            orientation = 180;
            break;
        case ROTATION_270:
            orientation = -90;
            break;
        default:
            break;
    }

    //FIXME: The value needs to be updated when device orientation changes.
    window.orientation = orientation;

    window.devicePixelRatio = 1.0;
    window.screen = {
        availTop: 0,
        availLeft: 0,
        availHeight: window.innerWidth,
        availWidth: window.innerHeight,
        colorDepth: 8,
        pixelDepth: 8,
        left: 0,
        top: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        orientation: { //FIXME:cjh
            type: 'portrait-primary' // portrait-primary, portrait-secondary, landscape-primary, landscape-secondary
        },
        onorientationchange: function onorientationchange(event) {}
    };

    window.addEventListener = function (eventName, listener, options) {
        window.__canvas.addEventListener(eventName, listener, options);
    };

    window.removeEventListener = function (eventName, listener, options) {
        window.__canvas.removeEventListener(eventName, listener, options);
    };

    window.dispatchEvent = function (event) {
        window.__canvas.dispatchEvent(event);
    };

    window.getComputedStyle = function (element) {
        return {
            position: 'absolute',
            left: '0px',
            top: '0px',
            height: '0px'
        };
    };

    window.resize = function (width, height) {
        window.innerWidth = width;
        window.innerHeight = height;
        window.outerWidth = window.innerWidth;
        window.outerHeight = window.innerHeight;
        window.__canvas._width = window.innerWidth;
        window.__canvas._height = window.innerHeight;
        window.screen.availWidth = window.innerWidth;
        window.screen.availHeight = window.innerHeight;
        window.screen.width = window.innerWidth;
        window.screen.height = window.innerHeight;
    };

    window.focus = function () {};
    window.scroll = function () {};

    window._isInjected = true;
}

if (!window._isInjected) {
    inject();
}

window.localStorage = sys.localStorage;

},{"./DeviceMotionEvent":6,"./Element":7,"./Event":8,"./EventTarget":9,"./FileReader":10,"./FontFace":11,"./FontFaceSet":12,"./HTMLCanvasElement":13,"./HTMLElement":14,"./HTMLImageElement":15,"./HTMLMediaElement":16,"./HTMLScriptElement":17,"./HTMLVideoElement":18,"./Image":19,"./KeyboardEvent":21,"./MouseEvent":23,"./TouchEvent":25,"./document":26,"./fetch":27,"./location":29,"./navigator":30}],33:[function(require,module,exports){
'use strict';

var EventTarget = require('./jsb-adapter/EventTarget');
var Event = require('./jsb-adapter/Event');

var eventTarget = new EventTarget();

var callbackWrappers = {};
var callbacks = {};
var index = 1;
var callbackWrapper = function callbackWrapper(cb) {
	if (!cb) return null;

	var func = function func(event) {
		cb({ value: event.text });
	};
	cb.___index = index++;
	callbackWrappers[cb.___index] = func;

	return func;
};
var getCallbackWrapper = function getCallbackWrapper(cb) {
	if (cb && cb.___index) {
		var ret = callbackWrappers[cb.___index];
		delete callbackWrappers[cb.___index];
		return ret;
	} else return null;
};
var removeListener = function removeListener(name, cb) {
	if (cb) eventTarget.removeEventListener(name, getCallbackWrapper(cb));else {
		// remove all listeners of name
		var cbs = callbacks[name];
		if (!cbs) return;

		for (var i = 0, len = cbs.length; i < len; ++i) {
			eventTarget.removeEventListener(name, cbs[i]);
		}delete callbacks[name];
	}
};
var recordCallback = function recordCallback(name, cb) {
	if (!cb || !name || name === '') return;

	if (!callbacks[name]) callbacks[name] = [];

	callbacks[name].push(cb);
};

jsb.inputBox = {
	onConfirm: function onConfirm(cb) {
		var newCb = callbackWrapper(cb);
		eventTarget.addEventListener('confirm', newCb);
		recordCallback('confirm', newCb);
	},
	offConfirm: function offConfirm(cb) {
		removeListener('confirm', cb);
	},

	onComplete: function onComplete(cb) {
		var newCb = callbackWrapper(cb);
		eventTarget.addEventListener('complete', newCb);
		recordCallback('complete', newCb);
	},
	offComplete: function offComplete(cb) {
		removeListener('complete', cb);
	},

	onInput: function onInput(cb) {
		var newCb = callbackWrapper(cb);
		eventTarget.addEventListener('input', newCb);
		recordCallback('input', newCb);
	},
	offInput: function offInput(cb) {
		removeListener('input', cb);
	},

	/**
  * @param {string}		options.defaultValue
  * @param {number}		options.maxLength
  * @param {bool}        options.multiple
  * @param {bool}        options.confirmHold
  * @param {string}      options.confirmType
  * @param {string}      options.inputType
  * 
  * Values of options.confirmType can be [done|next|search|go|send].
  * Values of options.inputType can be [text|email|number|phone|password].
  */
	show: function show(options) {
		jsb.showInputBox(options);
	},
	hide: function hide() {
		jsb.hideInputBox();
	}
};

jsb.onTextInput = function (eventName, text) {
	var event = new Event(eventName);
	event.text = text;
	eventTarget.dispatchEvent(event);
};

},{"./jsb-adapter/Event":8,"./jsb-adapter/EventTarget":9}],34:[function(require,module,exports){
'use strict';

require('./jsb_opengl_constants');

var gl = __gl;

gl.drawingBufferWidth = window.innerWidth;
gl.drawingBufferHeight = window.innerHeight;

//
// Extensions
//

var WebGLCompressedTextureS3TC = {
    COMPRESSED_RGB_S3TC_DXT1_EXT: 0x83F0, // A DXT1-compressed image in an RGB image format.
    COMPRESSED_RGBA_S3TC_DXT1_EXT: 0x83F1, // A DXT1-compressed image in an RGB image format with a simple on/off alpha value.
    COMPRESSED_RGBA_S3TC_DXT3_EXT: 0x83F2, // A DXT3-compressed image in an RGBA image format. Compared to a 32-bit RGBA texture, it offers 4:1 compression.
    COMPRESSED_RGBA_S3TC_DXT5_EXT: 0x83F3 // A DXT5-compressed image in an RGBA image format. It also provides a 4:1 compression, but differs to the DXT3 compression in how the alpha compression is done.
};

var WebGLCompressedTextureETC1 = {
    COMPRESSED_RGB_ETC1_WEBGL: 0x8D64 // Compresses 24-bit RGB data with no alpha channel.
};

var WebGLCompressedTexturePVRTC = {
    COMPRESSED_RGB_PVRTC_4BPPV1_IMG: 0x8C00, //  RGB compression in 4-bit mode. One block for each 4×4 pixels.
    COMPRESSED_RGBA_PVRTC_4BPPV1_IMG: 0x8C02, //  RGBA compression in 4-bit mode. One block for each 4×4 pixels.
    COMPRESSED_RGB_PVRTC_2BPPV1_IMG: 0x8C01, //  RGB compression in 2-bit mode. One block for each 8×4 pixels.
    COMPRESSED_RGBA_PVRTC_2BPPV1_IMG: 0x8C03 //  RGBA compression in 2-bit mode. One block for each 8×4 pixe
};

var extensionPrefixArr = ['MOZ_', 'WEBKIT_'];

var extensionMap = {
    WEBGL_compressed_texture_s3tc: WebGLCompressedTextureS3TC,
    WEBGL_compressed_texture_pvrtc: WebGLCompressedTexturePVRTC,
    WEBGL_compressed_texture_etc1: WebGLCompressedTextureETC1
};

// From the WebGL spec:
// Returns an object if, and only if, name is an ASCII case-insensitive match [HTML] for one of the names returned from getSupportedExtensions;
// otherwise, returns null. The object returned from getExtension contains any constants or functions provided by the extension.
// A returned object may have no constants or functions if the extension does not define any, but a unique object must still be returned.
// That object is used to indicate that the extension has been enabled.
// XXX: The returned object must return the functions and constants.

var supportedExtensions = gl.getSupportedExtensions();

gl.getExtension = function (extension) {
    var prefix;
    for (var i = 0, len = extensionPrefixArr.length; i < len; ++i) {
        prefix = extensionPrefixArr[i];
        if (extension.startsWith(prefix)) {
            extension = extension.substring(prefix.length);
            break;
        }
    }

    if (supportedExtensions.indexOf(extension) > -1) {
        if (extension in extensionMap) {
            return extensionMap[extension];
        }
        return {}; //REFINE: Return an empty object to indicate this platform supports the extension. But we should not return an empty object actually.
    }

    return null;
};

var HTMLCanvasElement = require('./jsb-adapter/HTMLCanvasElement');
var HTMLImageElement = require('./jsb-adapter/HTMLImageElement');
var ImageData = require('./jsb-adapter/ImageData');

var _glTexImage2D = gl.texImage2D;

/*
// WebGL1:
void gl.texImage2D(target, level, internalformat, width, height, border, format, type, ArrayBufferView? pixels);
void gl.texImage2D(target, level, internalformat, format, type, ImageData? pixels);
void gl.texImage2D(target, level, internalformat, format, type, HTMLImageElement? pixels);
void gl.texImage2D(target, level, internalformat, format, type, HTMLCanvasElement? pixels);
void gl.texImage2D(target, level, internalformat, format, type, HTMLVideoElement? pixels);
void gl.texImage2D(target, level, internalformat, format, type, ImageBitmap? pixels);
*/
gl.texImage2D = function (target, level, internalformat, width, height, border, format, type, pixels) {
    var argCount = arguments.length;
    if (argCount == 6) {

        var image = border;
        type = height;
        format = width;

        if (image instanceof HTMLImageElement) {
            _glTexImage2D(target, level, image._glInternalFormat, image.width, image.height, 0, image._glFormat, image._glType, image._data, image._alignment);
        } else if (image instanceof HTMLCanvasElement) {
            var data = image.data;
            _glTexImage2D(target, level, internalformat, image.width, image.height, 0, format, type, data, image._alignment);
        } else if (image instanceof ImageData) {
            _glTexImage2D(target, level, internalformat, image.width, image.height, 0, format, type, image._data, 0);
        } else {
            console.error("Invalid pixel argument passed to gl.texImage2D!");
        }
    } else if (argCount == 9) {
        _glTexImage2D(target, level, internalformat, width, height, border, format, type, pixels, 0);
    } else {
        console.error("gl.texImage2D: invalid argument count!");
    }
};

var _glTexSubImage2D = gl.texSubImage2D;
/*
 // WebGL 1:
 void gl.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, ArrayBufferView? pixels);
 void gl.texSubImage2D(target, level, xoffset, yoffset, format, type, ImageData? pixels);
 void gl.texSubImage2D(target, level, xoffset, yoffset, format, type, HTMLImageElement? pixels);
 void gl.texSubImage2D(target, level, xoffset, yoffset, format, type, HTMLCanvasElement? pixels);
 void gl.texSubImage2D(target, level, xoffset, yoffset, format, type, HTMLVideoElement? pixels);
 void gl.texSubImage2D(target, level, xoffset, yoffset, format, type, ImageBitmap? pixels);
 */
gl.texSubImage2D = function (target, level, xoffset, yoffset, width, height, format, type, pixels) {
    var argCount = arguments.length;
    if (argCount == 7) {
        var image = format;
        type = height;
        format = width;

        if (image instanceof HTMLImageElement) {
            _glTexSubImage2D(target, level, xoffset, yoffset, image.width, image.height, image._glFormat, image._glType, image._data, image._alignment);
        } else if (image instanceof HTMLCanvasElement) {
            var data = image.data;
            _glTexSubImage2D(target, level, xoffset, yoffset, image.width, image.height, format, type, data, image._alignment);
        } else if (image instanceof ImageData) {
            _glTexSubImage2D(target, level, xoffset, yoffset, image.width, image.height, format, type, image._data, 0);
        } else {
            console.error("Invalid pixel argument passed to gl.texImage2D!");
        }
    } else if (argCount == 9) {
        _glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels, 0);
    } else {
        console.error(new Error("gl.texImage2D: invalid argument count!").stack);
    }
};

//REFINE:cjh get the real value
gl.getContextAttributes = function () {
    return {
        alpha: true,
        antialias: false,
        depth: true,
        failIfMajorPerformanceCaveat: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        stencil: true
    };
};

gl.isContextLost = function () {
    return false;
};

},{"./jsb-adapter/HTMLCanvasElement":13,"./jsb-adapter/HTMLImageElement":15,"./jsb-adapter/ImageData":20,"./jsb_opengl_constants":35}],35:[function(require,module,exports){
"use strict";

var gl = __gl;

gl.GCCSO_SHADER_BINARY_FJ = 0x9260;
gl._3DC_XY_AMD = 0x87fa;
gl._3DC_X_AMD = 0x87f9;
gl.ACTIVE_ATTRIBUTES = 0x8b89;
gl.ACTIVE_ATTRIBUTE_MAX_LENGTH = 0x8b8a;
gl.ACTIVE_PROGRAM_EXT = 0x8259;
gl.ACTIVE_TEXTURE = 0x84e0;
gl.ACTIVE_UNIFORMS = 0x8b86;
gl.ACTIVE_UNIFORM_MAX_LENGTH = 0x8b87;
gl.ALIASED_LINE_WIDTH_RANGE = 0x846e;
gl.ALIASED_POINT_SIZE_RANGE = 0x846d;
gl.ALL_COMPLETED_NV = 0x84f2;
gl.ALL_SHADER_BITS_EXT = 0xffffffff;
gl.ALPHA = 0x1906;
gl.ALPHA16F_EXT = 0x881c;
gl.ALPHA32F_EXT = 0x8816;
gl.ALPHA8_EXT = 0x803c;
gl.ALPHA8_OES = 0x803c;
gl.ALPHA_BITS = 0xd55;
gl.ALPHA_TEST_FUNC_QCOM = 0xbc1;
gl.ALPHA_TEST_QCOM = 0xbc0;
gl.ALPHA_TEST_REF_QCOM = 0xbc2;
gl.ALREADY_SIGNALED_APPLE = 0x911a;
gl.ALWAYS = 0x207;
gl.AMD_compressed_3DC_texture = 0x1;
gl.AMD_compressed_ATC_texture = 0x1;
gl.AMD_performance_monitor = 0x1;
gl.AMD_program_binary_Z400 = 0x1;
gl.ANGLE_depth_texture = 0x1;
gl.ANGLE_framebuffer_blit = 0x1;
gl.ANGLE_framebuffer_multisample = 0x1;
gl.ANGLE_instanced_arrays = 0x1;
gl.ANGLE_pack_reverse_row_order = 0x1;
gl.ANGLE_program_binary = 0x1;
gl.ANGLE_texture_compression_dxt3 = 0x1;
gl.ANGLE_texture_compression_dxt5 = 0x1;
gl.ANGLE_texture_usage = 0x1;
gl.ANGLE_translated_shader_source = 0x1;
gl.ANY_SAMPLES_PASSED_CONSERVATIVE_EXT = 0x8d6a;
gl.ANY_SAMPLES_PASSED_EXT = 0x8c2f;
gl.APPLE_copy_texture_levels = 0x1;
gl.APPLE_framebuffer_multisample = 0x1;
gl.APPLE_rgb_422 = 0x1;
gl.APPLE_sync = 0x1;
gl.APPLE_texture_format_BGRA8888 = 0x1;
gl.APPLE_texture_max_level = 0x1;
gl.ARM_mali_program_binary = 0x1;
gl.ARM_mali_shader_binary = 0x1;
gl.ARM_rgba8 = 0x1;
gl.ARRAY_BUFFER = 0x8892;
gl.ARRAY_BUFFER_BINDING = 0x8894;
gl.ATC_RGBA_EXPLICIT_ALPHA_AMD = 0x8c93;
gl.ATC_RGBA_INTERPOLATED_ALPHA_AMD = 0x87ee;
gl.ATC_RGB_AMD = 0x8c92;
gl.ATTACHED_SHADERS = 0x8b85;
gl.BACK = 0x405;
gl.BGRA8_EXT = 0x93a1;
gl.BGRA_EXT = 0x80e1;
gl.BGRA_IMG = 0x80e1;
gl.BINNING_CONTROL_HINT_QCOM = 0x8fb0;
gl.BLEND = 0xbe2;
gl.BLEND_COLOR = 0x8005;
gl.BLEND_DST_ALPHA = 0x80ca;
gl.BLEND_DST_RGB = 0x80c8;
gl.BLEND_EQUATION = 0x8009;
gl.BLEND_EQUATION_ALPHA = 0x883d;
gl.BLEND_EQUATION_RGB = 0x8009;
gl.BLEND_SRC_ALPHA = 0x80cb;
gl.BLEND_SRC_RGB = 0x80c9;
gl.BLUE_BITS = 0xd54;
gl.BOOL = 0x8b56;
gl.BOOL_VEC2 = 0x8b57;
gl.BOOL_VEC3 = 0x8b58;
gl.BOOL_VEC4 = 0x8b59;
gl.BUFFER = 0x82e0;
gl.BUFFER_ACCESS_OES = 0x88bb;
gl.BUFFER_MAPPED_OES = 0x88bc;
gl.BUFFER_MAP_POINTER_OES = 0x88bd;
gl.BUFFER_OBJECT_EXT = 0x9151;
gl.BUFFER_SIZE = 0x8764;
gl.BUFFER_USAGE = 0x8765;
gl.BYTE = 0x1400;
gl.CCW = 0x901;
gl.CLAMP_TO_BORDER_NV = 0x812d;
gl.CLAMP_TO_EDGE = 0x812f;
gl.COLOR_ATTACHMENT0 = 0x8ce0;
gl.COLOR_ATTACHMENT0_NV = 0x8ce0;
gl.COLOR_ATTACHMENT10_NV = 0x8cea;
gl.COLOR_ATTACHMENT11_NV = 0x8ceb;
gl.COLOR_ATTACHMENT12_NV = 0x8cec;
gl.COLOR_ATTACHMENT13_NV = 0x8ced;
gl.COLOR_ATTACHMENT14_NV = 0x8cee;
gl.COLOR_ATTACHMENT15_NV = 0x8cef;
gl.COLOR_ATTACHMENT1_NV = 0x8ce1;
gl.COLOR_ATTACHMENT2_NV = 0x8ce2;
gl.COLOR_ATTACHMENT3_NV = 0x8ce3;
gl.COLOR_ATTACHMENT4_NV = 0x8ce4;
gl.COLOR_ATTACHMENT5_NV = 0x8ce5;
gl.COLOR_ATTACHMENT6_NV = 0x8ce6;
gl.COLOR_ATTACHMENT7_NV = 0x8ce7;
gl.COLOR_ATTACHMENT8_NV = 0x8ce8;
gl.COLOR_ATTACHMENT9_NV = 0x8ce9;
gl.COLOR_ATTACHMENT_EXT = 0x90f0;
gl.COLOR_BUFFER_BIT = 0x4000;
gl.COLOR_BUFFER_BIT0_QCOM = 0x1;
gl.COLOR_BUFFER_BIT1_QCOM = 0x2;
gl.COLOR_BUFFER_BIT2_QCOM = 0x4;
gl.COLOR_BUFFER_BIT3_QCOM = 0x8;
gl.COLOR_BUFFER_BIT4_QCOM = 0x10;
gl.COLOR_BUFFER_BIT5_QCOM = 0x20;
gl.COLOR_BUFFER_BIT6_QCOM = 0x40;
gl.COLOR_BUFFER_BIT7_QCOM = 0x80;
gl.COLOR_CLEAR_VALUE = 0xc22;
gl.COLOR_EXT = 0x1800;
gl.COLOR_WRITEMASK = 0xc23;
gl.COMPARE_REF_TO_TEXTURE_EXT = 0x884e;
gl.COMPILE_STATUS = 0x8b81;
gl.COMPRESSED_RGBA_ASTC_10x10_KHR = 0x93bb;
gl.COMPRESSED_RGBA_ASTC_10x5_KHR = 0x93b8;
gl.COMPRESSED_RGBA_ASTC_10x6_KHR = 0x93b9;
gl.COMPRESSED_RGBA_ASTC_10x8_KHR = 0x93ba;
gl.COMPRESSED_RGBA_ASTC_12x10_KHR = 0x93bc;
gl.COMPRESSED_RGBA_ASTC_12x12_KHR = 0x93bd;
gl.COMPRESSED_RGBA_ASTC_4x4_KHR = 0x93b0;
gl.COMPRESSED_RGBA_ASTC_5x4_KHR = 0x93b1;
gl.COMPRESSED_RGBA_ASTC_5x5_KHR = 0x93b2;
gl.COMPRESSED_RGBA_ASTC_6x5_KHR = 0x93b3;
gl.COMPRESSED_RGBA_ASTC_6x6_KHR = 0x93b4;
gl.COMPRESSED_RGBA_ASTC_8x5_KHR = 0x93b5;
gl.COMPRESSED_RGBA_ASTC_8x6_KHR = 0x93b6;
gl.COMPRESSED_RGBA_ASTC_8x8_KHR = 0x93b7;
gl.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG = 0x8c03;
gl.COMPRESSED_RGBA_PVRTC_2BPPV2_IMG = 0x9137;
gl.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8c02;
gl.COMPRESSED_RGBA_PVRTC_4BPPV2_IMG = 0x9138;
gl.COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83f1;
gl.COMPRESSED_RGBA_S3TC_DXT3_ANGLE = 0x83f2;
gl.COMPRESSED_RGBA_S3TC_DXT5_ANGLE = 0x83f3;
gl.COMPRESSED_RGB_PVRTC_2BPPV1_IMG = 0x8c01;
gl.COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 0x8c00;
gl.COMPRESSED_RGB_S3TC_DXT1_EXT = 0x83f0;
gl.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR = 0x93db;
gl.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR = 0x93d8;
gl.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR = 0x93d9;
gl.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR = 0x93da;
gl.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR = 0x93dc;
gl.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR = 0x93dd;
gl.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR = 0x93d0;
gl.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR = 0x93d1;
gl.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR = 0x93d2;
gl.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR = 0x93d3;
gl.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR = 0x93d4;
gl.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR = 0x93d5;
gl.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR = 0x93d6;
gl.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR = 0x93d7;
gl.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_NV = 0x8c4d;
gl.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_NV = 0x8c4e;
gl.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_NV = 0x8c4f;
gl.COMPRESSED_SRGB_S3TC_DXT1_NV = 0x8c4c;
gl.COMPRESSED_TEXTURE_FORMATS = 0x86a3;
gl.CONDITION_SATISFIED_APPLE = 0x911c;
gl.CONSTANT_ALPHA = 0x8003;
gl.CONSTANT_COLOR = 0x8001;
gl.CONTEXT_FLAG_DEBUG_BIT = 0x2;
gl.CONTEXT_ROBUST_ACCESS_EXT = 0x90f3;
gl.COUNTER_RANGE_AMD = 0x8bc1;
gl.COUNTER_TYPE_AMD = 0x8bc0;
gl.COVERAGE_ALL_FRAGMENTS_NV = 0x8ed5;
gl.COVERAGE_ATTACHMENT_NV = 0x8ed2;
gl.COVERAGE_AUTOMATIC_NV = 0x8ed7;
gl.COVERAGE_BUFFERS_NV = 0x8ed3;
gl.COVERAGE_BUFFER_BIT_NV = 0x8000;
gl.COVERAGE_COMPONENT4_NV = 0x8ed1;
gl.COVERAGE_COMPONENT_NV = 0x8ed0;
gl.COVERAGE_EDGE_FRAGMENTS_NV = 0x8ed6;
gl.COVERAGE_SAMPLES_NV = 0x8ed4;
gl.CPU_OPTIMIZED_QCOM = 0x8fb1;
gl.CULL_FACE = 0xb44;
gl.CULL_FACE_MODE = 0xb45;
gl.CURRENT_PROGRAM = 0x8b8d;
gl.CURRENT_QUERY_EXT = 0x8865;
gl.CURRENT_VERTEX_ATTRIB = 0x8626;
gl.CW = 0x900;
gl.DEBUG_CALLBACK_FUNCTION = 0x8244;
gl.DEBUG_CALLBACK_USER_PARAM = 0x8245;
gl.DEBUG_GROUP_STACK_DEPTH = 0x826d;
gl.DEBUG_LOGGED_MESSAGES = 0x9145;
gl.DEBUG_NEXT_LOGGED_MESSAGE_LENGTH = 0x8243;
gl.DEBUG_OUTPUT = 0x92e0;
gl.DEBUG_OUTPUT_SYNCHRONOUS = 0x8242;
gl.DEBUG_SEVERITY_HIGH = 0x9146;
gl.DEBUG_SEVERITY_LOW = 0x9148;
gl.DEBUG_SEVERITY_MEDIUM = 0x9147;
gl.DEBUG_SEVERITY_NOTIFICATION = 0x826b;
gl.DEBUG_SOURCE_API = 0x8246;
gl.DEBUG_SOURCE_APPLICATION = 0x824a;
gl.DEBUG_SOURCE_OTHER = 0x824b;
gl.DEBUG_SOURCE_SHADER_COMPILER = 0x8248;
gl.DEBUG_SOURCE_THIRD_PARTY = 0x8249;
gl.DEBUG_SOURCE_WINDOW_SYSTEM = 0x8247;
gl.DEBUG_TYPE_DEPRECATED_BEHAVIOR = 0x824d;
gl.DEBUG_TYPE_ERROR = 0x824c;
gl.DEBUG_TYPE_MARKER = 0x8268;
gl.DEBUG_TYPE_OTHER = 0x8251;
gl.DEBUG_TYPE_PERFORMANCE = 0x8250;
gl.DEBUG_TYPE_POP_GROUP = 0x826a;
gl.DEBUG_TYPE_PORTABILITY = 0x824f;
gl.DEBUG_TYPE_PUSH_GROUP = 0x8269;
gl.DEBUG_TYPE_UNDEFINED_BEHAVIOR = 0x824e;
gl.DECR = 0x1e03;
gl.DECR_WRAP = 0x8508;
gl.DELETE_STATUS = 0x8b80;
gl.DEPTH24_STENCIL8_OES = 0x88f0;
gl.DEPTH_ATTACHMENT = 0x8d00;
gl.DEPTH_STENCIL_ATTACHMENT = 0x821a;
gl.DEPTH_BITS = 0xd56;
gl.DEPTH_BUFFER_BIT = 0x100;
gl.DEPTH_BUFFER_BIT0_QCOM = 0x100;
gl.DEPTH_BUFFER_BIT1_QCOM = 0x200;
gl.DEPTH_BUFFER_BIT2_QCOM = 0x400;
gl.DEPTH_BUFFER_BIT3_QCOM = 0x800;
gl.DEPTH_BUFFER_BIT4_QCOM = 0x1000;
gl.DEPTH_BUFFER_BIT5_QCOM = 0x2000;
gl.DEPTH_BUFFER_BIT6_QCOM = 0x4000;
gl.DEPTH_BUFFER_BIT7_QCOM = 0x8000;
gl.DEPTH_CLEAR_VALUE = 0xb73;
gl.DEPTH_COMPONENT = 0x1902;
gl.DEPTH_COMPONENT16 = 0x81a5;
gl.DEPTH_COMPONENT16_NONLINEAR_NV = 0x8e2c;
gl.DEPTH_COMPONENT16_OES = 0x81a5;
gl.DEPTH_COMPONENT24_OES = 0x81a6;
gl.DEPTH_COMPONENT32_OES = 0x81a7;
gl.DEPTH_EXT = 0x1801;
gl.DEPTH_FUNC = 0xb74;
gl.DEPTH_RANGE = 0xb70;
gl.DEPTH_STENCIL = 0x84f9;
gl.DEPTH_STENCIL_OES = 0x84f9;
gl.DEPTH_TEST = 0xb71;
gl.DEPTH_WRITEMASK = 0xb72;
gl.DITHER = 0xbd0;
gl.DMP_shader_binary = 0x1;
gl.DONT_CARE = 0x1100;
gl.DRAW_BUFFER0_NV = 0x8825;
gl.DRAW_BUFFER10_NV = 0x882f;
gl.DRAW_BUFFER11_NV = 0x8830;
gl.DRAW_BUFFER12_NV = 0x8831;
gl.DRAW_BUFFER13_NV = 0x8832;
gl.DRAW_BUFFER14_NV = 0x8833;
gl.DRAW_BUFFER15_NV = 0x8834;
gl.DRAW_BUFFER1_NV = 0x8826;
gl.DRAW_BUFFER2_NV = 0x8827;
gl.DRAW_BUFFER3_NV = 0x8828;
gl.DRAW_BUFFER4_NV = 0x8829;
gl.DRAW_BUFFER5_NV = 0x882a;
gl.DRAW_BUFFER6_NV = 0x882b;
gl.DRAW_BUFFER7_NV = 0x882c;
gl.DRAW_BUFFER8_NV = 0x882d;
gl.DRAW_BUFFER9_NV = 0x882e;
gl.DRAW_BUFFER_EXT = 0xc01;
gl.DRAW_FRAMEBUFFER_ANGLE = 0x8ca9;
gl.DRAW_FRAMEBUFFER_APPLE = 0x8ca9;
gl.DRAW_FRAMEBUFFER_BINDING_ANGLE = 0x8ca6;
gl.DRAW_FRAMEBUFFER_BINDING_APPLE = 0x8ca6;
gl.DRAW_FRAMEBUFFER_BINDING_NV = 0x8ca6;
gl.DRAW_FRAMEBUFFER_NV = 0x8ca9;
gl.DST_ALPHA = 0x304;
gl.DST_COLOR = 0x306;
gl.DYNAMIC_DRAW = 0x88e8;
gl.ELEMENT_ARRAY_BUFFER = 0x8893;
gl.ELEMENT_ARRAY_BUFFER_BINDING = 0x8895;
gl.EQUAL = 0x202;
gl.ES_VERSION_2_0 = 0x1;
gl.ETC1_RGB8_OES = 0x8d64;
gl.ETC1_SRGB8_NV = 0x88ee;
gl.EXTENSIONS = 0x1f03;
gl.EXT_blend_minmax = 0x1;
gl.EXT_color_buffer_half_float = 0x1;
gl.EXT_debug_label = 0x1;
gl.EXT_debug_marker = 0x1;
gl.EXT_discard_framebuffer = 0x1;
gl.EXT_map_buffer_range = 0x1;
gl.EXT_multi_draw_arrays = 0x1;
gl.EXT_multisampled_render_to_texture = 0x1;
gl.EXT_multiview_draw_buffers = 0x1;
gl.EXT_occlusion_query_boolean = 0x1;
gl.EXT_read_format_bgra = 0x1;
gl.EXT_robustness = 0x1;
gl.EXT_sRGB = 0x1;
gl.EXT_separate_shader_objects = 0x1;
gl.EXT_shader_framebuffer_fetch = 0x1;
gl.EXT_shader_texture_lod = 0x1;
gl.EXT_shadow_samplers = 0x1;
gl.EXT_texture_compression_dxt1 = 0x1;
gl.EXT_texture_filter_anisotropic = 0x1;
gl.EXT_texture_format_BGRA8888 = 0x1;
gl.EXT_texture_rg = 0x1;
gl.EXT_texture_storage = 0x1;
gl.EXT_texture_type_2_10_10_10_REV = 0x1;
gl.EXT_unpack_subimage = 0x1;
gl.FALSE = 0x0;
gl.FASTEST = 0x1101;
gl.FENCE_CONDITION_NV = 0x84f4;
gl.FENCE_STATUS_NV = 0x84f3;
gl.FIXED = 0x140c;
gl.FJ_shader_binary_GCCSO = 0x1;
gl.FLOAT = 0x1406;
gl.FLOAT_MAT2 = 0x8b5a;
gl.FLOAT_MAT3 = 0x8b5b;
gl.FLOAT_MAT4 = 0x8b5c;
gl.FLOAT_VEC2 = 0x8b50;
gl.FLOAT_VEC3 = 0x8b51;
gl.FLOAT_VEC4 = 0x8b52;
gl.FRAGMENT_SHADER = 0x8b30;
gl.FRAGMENT_SHADER_BIT_EXT = 0x2;
gl.FRAGMENT_SHADER_DERIVATIVE_HINT_OES = 0x8b8b;
gl.FRAGMENT_SHADER_DISCARDS_SAMPLES_EXT = 0x8a52;
gl.FRAMEBUFFER = 0x8d40;
gl.FRAMEBUFFER_ATTACHMENT_ANGLE = 0x93a3;
gl.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT = 0x8210;
gl.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT = 0x8211;
gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME = 0x8cd1;
gl.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE = 0x8cd0;
gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_3D_ZOFFSET_OES = 0x8cd4;
gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE = 0x8cd3;
gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL = 0x8cd2;
gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_SAMPLES_EXT = 0x8d6c;
gl.FRAMEBUFFER_BINDING = 0x8ca6;
gl.FRAMEBUFFER_COMPLETE = 0x8cd5;
gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT = 0x8cd6;
gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS = 0x8cd9;
gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT = 0x8cd7;
gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE_ANGLE = 0x8d56;
gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE_APPLE = 0x8d56;
gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE_EXT = 0x8d56;
gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE_IMG = 0x9134;
gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE_NV = 0x8d56;
gl.FRAMEBUFFER_UNDEFINED_OES = 0x8219;
gl.FRAMEBUFFER_UNSUPPORTED = 0x8cdd;
gl.FRONT = 0x404;
gl.FRONT_AND_BACK = 0x408;
gl.FRONT_FACE = 0xb46;
gl.FUNC_ADD = 0x8006;
gl.FUNC_REVERSE_SUBTRACT = 0x800b;
gl.FUNC_SUBTRACT = 0x800a;
gl.GENERATE_MIPMAP_HINT = 0x8192;
gl.GEQUAL = 0x206;
gl.GPU_OPTIMIZED_QCOM = 0x8fb2;
gl.GREATER = 0x204;
gl.GREEN_BITS = 0xd53;
gl.GUILTY_CONTEXT_RESET_EXT = 0x8253;
gl.HALF_FLOAT_OES = 0x8d61;
gl.HIGH_FLOAT = 0x8df2;
gl.HIGH_INT = 0x8df5;
gl.IMG_multisampled_render_to_texture = 0x1;
gl.IMG_program_binary = 0x1;
gl.IMG_read_format = 0x1;
gl.IMG_shader_binary = 0x1;
gl.IMG_texture_compression_pvrtc = 0x1;
gl.IMG_texture_compression_pvrtc2 = 0x1;
gl.IMPLEMENTATION_COLOR_READ_FORMAT = 0x8b9b;
gl.IMPLEMENTATION_COLOR_READ_TYPE = 0x8b9a;
gl.INCR = 0x1e02;
gl.INCR_WRAP = 0x8507;
gl.INFO_LOG_LENGTH = 0x8b84;
gl.INNOCENT_CONTEXT_RESET_EXT = 0x8254;
gl.INT = 0x1404;
gl.INT_10_10_10_2_OES = 0x8df7;
gl.INT_VEC2 = 0x8b53;
gl.INT_VEC3 = 0x8b54;
gl.INT_VEC4 = 0x8b55;
gl.INVALID_ENUM = 0x500;
gl.INVALID_FRAMEBUFFER_OPERATION = 0x506;
gl.INVALID_OPERATION = 0x502;
gl.INVALID_VALUE = 0x501;
gl.INVERT = 0x150a;
gl.KEEP = 0x1e00;
gl.KHR_debug = 0x1;
gl.KHR_texture_compression_astc_ldr = 0x1;
gl.LEFT = 0x0406;
gl.LEQUAL = 0x203;
gl.LESS = 0x201;
gl.LINEAR = 0x2601;
gl.LINEAR_MIPMAP_LINEAR = 0x2703;
gl.LINEAR_MIPMAP_NEAREST = 0x2701;
gl.LINES = 0x1;
gl.LINE_LOOP = 0x2;
gl.LINE_STRIP = 0x3;
gl.LINE_WIDTH = 0xb21;
gl.LINK_STATUS = 0x8b82;
gl.LOSE_CONTEXT_ON_RESET_EXT = 0x8252;
gl.LOW_FLOAT = 0x8df0;
gl.LOW_INT = 0x8df3;
gl.LUMINANCE = 0x1909;
gl.LUMINANCE16F_EXT = 0x881e;
gl.LUMINANCE32F_EXT = 0x8818;
gl.LUMINANCE4_ALPHA4_OES = 0x8043;
gl.LUMINANCE8_ALPHA8_EXT = 0x8045;
gl.LUMINANCE8_ALPHA8_OES = 0x8045;
gl.LUMINANCE8_EXT = 0x8040;
gl.LUMINANCE8_OES = 0x8040;
gl.LUMINANCE_ALPHA = 0x190a;
gl.LUMINANCE_ALPHA16F_EXT = 0x881f;
gl.LUMINANCE_ALPHA32F_EXT = 0x8819;
gl.MALI_PROGRAM_BINARY_ARM = 0x8f61;
gl.MALI_SHADER_BINARY_ARM = 0x8f60;
gl.MAP_FLUSH_EXPLICIT_BIT_EXT = 0x10;
gl.MAP_INVALIDATE_BUFFER_BIT_EXT = 0x8;
gl.MAP_INVALIDATE_RANGE_BIT_EXT = 0x4;
gl.MAP_READ_BIT_EXT = 0x1;
gl.MAP_UNSYNCHRONIZED_BIT_EXT = 0x20;
gl.MAP_WRITE_BIT_EXT = 0x2;
gl.MAX_3D_TEXTURE_SIZE_OES = 0x8073;
gl.MAX_COLOR_ATTACHMENTS_NV = 0x8cdf;
gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS = 0x8b4d;
gl.MAX_CUBE_MAP_TEXTURE_SIZE = 0x851c;
gl.MAX_DEBUG_GROUP_STACK_DEPTH = 0x826c;
gl.MAX_DEBUG_LOGGED_MESSAGES = 0x9144;
gl.MAX_DEBUG_MESSAGE_LENGTH = 0x9143;
gl.MAX_DRAW_BUFFERS_NV = 0x8824;
gl.MAX_EXT = 0x8008;
gl.MAX_FRAGMENT_UNIFORM_VECTORS = 0x8dfd;
gl.MAX_LABEL_LENGTH = 0x82e8;
gl.MAX_MULTIVIEW_BUFFERS_EXT = 0x90f2;
gl.MAX_RENDERBUFFER_SIZE = 0x84e8;
gl.MAX_SAMPLES_ANGLE = 0x8d57;
gl.MAX_SAMPLES_APPLE = 0x8d57;
gl.MAX_SAMPLES_EXT = 0x8d57;
gl.MAX_SAMPLES_IMG = 0x9135;
gl.MAX_SAMPLES_NV = 0x8d57;
gl.MAX_SERVER_WAIT_TIMEOUT_APPLE = 0x9111;
gl.MAX_TEXTURE_IMAGE_UNITS = 0x8872;
gl.MAX_TEXTURE_MAX_ANISOTROPY_EXT = 0x84ff;
gl.MAX_TEXTURE_SIZE = 0xd33;
gl.MAX_VARYING_VECTORS = 0x8dfc;
gl.MAX_VERTEX_ATTRIBS = 0x8869;
gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS = 0x8b4c;
gl.MAX_VERTEX_UNIFORM_VECTORS = 0x8dfb;
gl.MAX_VIEWPORT_DIMS = 0xd3a;
gl.MEDIUM_FLOAT = 0x8df1;
gl.MEDIUM_INT = 0x8df4;
gl.MIN_EXT = 0x8007;
gl.MIRRORED_REPEAT = 0x8370;
gl.MULTISAMPLE_BUFFER_BIT0_QCOM = 0x1000000;
gl.MULTISAMPLE_BUFFER_BIT1_QCOM = 0x2000000;
gl.MULTISAMPLE_BUFFER_BIT2_QCOM = 0x4000000;
gl.MULTISAMPLE_BUFFER_BIT3_QCOM = 0x8000000;
gl.MULTISAMPLE_BUFFER_BIT4_QCOM = 0x10000000;
gl.MULTISAMPLE_BUFFER_BIT5_QCOM = 0x20000000;
gl.MULTISAMPLE_BUFFER_BIT6_QCOM = 0x40000000;
gl.MULTISAMPLE_BUFFER_BIT7_QCOM = 0x80000000;
gl.MULTIVIEW_EXT = 0x90f1;
gl.NEAREST = 0x2600;
gl.NEAREST_MIPMAP_LINEAR = 0x2702;
gl.NEAREST_MIPMAP_NEAREST = 0x2700;
gl.NEVER = 0x200;
gl.NICEST = 0x1102;
gl.NONE = 0x0;
gl.NOTEQUAL = 0x205;
gl.NO_ERROR = 0x0;
gl.NO_RESET_NOTIFICATION_EXT = 0x8261;
gl.NUM_COMPRESSED_TEXTURE_FORMATS = 0x86a2;
gl.NUM_PROGRAM_BINARY_FORMATS_OES = 0x87fe;
gl.NUM_SHADER_BINARY_FORMATS = 0x8df9;
gl.NV_coverage_sample = 0x1;
gl.NV_depth_nonlinear = 0x1;
gl.NV_draw_buffers = 0x1;
gl.NV_draw_instanced = 0x1;
gl.NV_fbo_color_attachments = 0x1;
gl.NV_fence = 0x1;
gl.NV_framebuffer_blit = 0x1;
gl.NV_framebuffer_multisample = 0x1;
gl.NV_generate_mipmap_sRGB = 0x1;
gl.NV_instanced_arrays = 0x1;
gl.NV_read_buffer = 0x1;
gl.NV_read_buffer_front = 0x1;
gl.NV_read_depth = 0x1;
gl.NV_read_depth_stencil = 0x1;
gl.NV_read_stencil = 0x1;
gl.NV_sRGB_formats = 0x1;
gl.NV_shadow_samplers_array = 0x1;
gl.NV_shadow_samplers_cube = 0x1;
gl.NV_texture_border_clamp = 0x1;
gl.NV_texture_compression_s3tc_update = 0x1;
gl.NV_texture_npot_2D_mipmap = 0x1;
gl.OBJECT_TYPE_APPLE = 0x9112;
gl.OES_EGL_image = 0x1;
gl.OES_EGL_image_external = 0x1;
gl.OES_compressed_ETC1_RGB8_texture = 0x1;
gl.OES_compressed_paletted_texture = 0x1;
gl.OES_depth24 = 0x1;
gl.OES_depth32 = 0x1;
gl.OES_depth_texture = 0x1;
gl.OES_element_index_uint = 0x1;
gl.OES_fbo_render_mipmap = 0x1;
gl.OES_fragment_precision_high = 0x1;
gl.OES_get_program_binary = 0x1;
gl.OES_mapbuffer = 0x1;
gl.OES_packed_depth_stencil = 0x1;
gl.OES_required_internalformat = 0x1;
gl.OES_rgb8_rgba8 = 0x1;
gl.OES_standard_derivatives = 0x1;
gl.OES_stencil1 = 0x1;
gl.OES_stencil4 = 0x1;
gl.OES_surfaceless_context = 0x1;
gl.OES_texture_3D = 0x1;
gl.OES_texture_float = 0x1;
gl.OES_texture_float_linear = 0x1;
gl.OES_texture_half_float = 0x1;
gl.OES_texture_half_float_linear = 0x1;
gl.OES_texture_npot = 0x1;
gl.OES_vertex_array_object = 0x1;
gl.OES_vertex_half_float = 0x1;
gl.OES_vertex_type_10_10_10_2 = 0x1;
gl.ONE = 0x1;
gl.ONE_MINUS_CONSTANT_ALPHA = 0x8004;
gl.ONE_MINUS_CONSTANT_COLOR = 0x8002;
gl.ONE_MINUS_DST_ALPHA = 0x305;
gl.ONE_MINUS_DST_COLOR = 0x307;
gl.ONE_MINUS_SRC_ALPHA = 0x303;
gl.ONE_MINUS_SRC_COLOR = 0x301;
gl.OUT_OF_MEMORY = 0x505;
gl.PACK_ALIGNMENT = 0xd05;
gl.PACK_REVERSE_ROW_ORDER_ANGLE = 0x93a4;
gl.PALETTE4_R5_G6_B5_OES = 0x8b92;
gl.PALETTE4_RGB5_A1_OES = 0x8b94;
gl.PALETTE4_RGB8_OES = 0x8b90;
gl.PALETTE4_RGBA4_OES = 0x8b93;
gl.PALETTE4_RGBA8_OES = 0x8b91;
gl.PALETTE8_R5_G6_B5_OES = 0x8b97;
gl.PALETTE8_RGB5_A1_OES = 0x8b99;
gl.PALETTE8_RGB8_OES = 0x8b95;
gl.PALETTE8_RGBA4_OES = 0x8b98;
gl.PALETTE8_RGBA8_OES = 0x8b96;
gl.PERCENTAGE_AMD = 0x8bc3;
gl.PERFMON_GLOBAL_MODE_QCOM = 0x8fa0;
gl.PERFMON_RESULT_AMD = 0x8bc6;
gl.PERFMON_RESULT_AVAILABLE_AMD = 0x8bc4;
gl.PERFMON_RESULT_SIZE_AMD = 0x8bc5;
gl.POINTS = 0x0;
gl.POLYGON_OFFSET_FACTOR = 0x8038;
gl.POLYGON_OFFSET_FILL = 0x8037;
gl.POLYGON_OFFSET_UNITS = 0x2a00;
gl.PROGRAM = 0x82e2;
gl.PROGRAM_BINARY_ANGLE = 0x93a6;
gl.PROGRAM_BINARY_FORMATS_OES = 0x87ff;
gl.PROGRAM_BINARY_LENGTH_OES = 0x8741;
gl.PROGRAM_OBJECT_EXT = 0x8b40;
gl.PROGRAM_PIPELINE_BINDING_EXT = 0x825a;
gl.PROGRAM_PIPELINE_OBJECT_EXT = 0x8a4f;
gl.PROGRAM_SEPARABLE_EXT = 0x8258;
gl.QCOM_alpha_test = 0x1;
gl.QCOM_binning_control = 0x1;
gl.QCOM_driver_control = 0x1;
gl.QCOM_extended_get = 0x1;
gl.QCOM_extended_get2 = 0x1;
gl.QCOM_perfmon_global_mode = 0x1;
gl.QCOM_tiled_rendering = 0x1;
gl.QCOM_writeonly_rendering = 0x1;
gl.QUERY = 0x82e3;
gl.QUERY_OBJECT_EXT = 0x9153;
gl.QUERY_RESULT_AVAILABLE_EXT = 0x8867;
gl.QUERY_RESULT_EXT = 0x8866;
gl.R16F_EXT = 0x822d;
gl.R32F_EXT = 0x822e;
gl.R8_EXT = 0x8229;
gl.READ_BUFFER_EXT = 0xc02;
gl.READ_BUFFER_NV = 0xc02;
gl.READ_FRAMEBUFFER_ANGLE = 0x8ca8;
gl.READ_FRAMEBUFFER_APPLE = 0x8ca8;
gl.READ_FRAMEBUFFER_BINDING_ANGLE = 0x8caa;
gl.READ_FRAMEBUFFER_BINDING_APPLE = 0x8caa;
gl.READ_FRAMEBUFFER_BINDING_NV = 0x8caa;
gl.READ_FRAMEBUFFER_NV = 0x8ca8;
gl.RED_BITS = 0xd52;
gl.RED_EXT = 0x1903;
gl.RENDERBUFFER = 0x8d41;
gl.RENDERBUFFER_ALPHA_SIZE = 0x8d53;
gl.RENDERBUFFER_BINDING = 0x8ca7;
gl.RENDERBUFFER_BLUE_SIZE = 0x8d52;
gl.RENDERBUFFER_DEPTH_SIZE = 0x8d54;
gl.RENDERBUFFER_GREEN_SIZE = 0x8d51;
gl.RENDERBUFFER_HEIGHT = 0x8d43;
gl.RENDERBUFFER_INTERNAL_FORMAT = 0x8d44;
gl.RENDERBUFFER_RED_SIZE = 0x8d50;
gl.RENDERBUFFER_SAMPLES_ANGLE = 0x8cab;
gl.RENDERBUFFER_SAMPLES_APPLE = 0x8cab;
gl.RENDERBUFFER_SAMPLES_EXT = 0x8cab;
gl.RENDERBUFFER_SAMPLES_IMG = 0x9133;
gl.RENDERBUFFER_SAMPLES_NV = 0x8cab;
gl.RENDERBUFFER_STENCIL_SIZE = 0x8d55;
gl.RENDERBUFFER_WIDTH = 0x8d42;
gl.RENDERER = 0x1f01;
gl.RENDER_DIRECT_TO_FRAMEBUFFER_QCOM = 0x8fb3;
gl.REPEAT = 0x2901;
gl.REPLACE = 0x1e01;
gl.REQUIRED_TEXTURE_IMAGE_UNITS_OES = 0x8d68;
gl.RESET_NOTIFICATION_STRATEGY_EXT = 0x8256;
gl.RG16F_EXT = 0x822f;
gl.RG32F_EXT = 0x8230;
gl.RG8_EXT = 0x822b;
gl.RGB = 0x1907;
gl.RGB10_A2_EXT = 0x8059;
gl.RGB10_EXT = 0x8052;
gl.RGB16F_EXT = 0x881b;
gl.RGB32F_EXT = 0x8815;
gl.RGB565 = 0x8d62;
gl.RGB565_OES = 0x8d62;
gl.RGB5_A1 = 0x8057;
gl.RGB5_A1_OES = 0x8057;
gl.RGB8_OES = 0x8051;
gl.RGBA = 0x1908;
gl.RGBA16F_EXT = 0x881a;
gl.RGBA32F_EXT = 0x8814;
gl.RGBA4 = 0x8056;
gl.RGBA4_OES = 0x8056;
gl.RGBA8_OES = 0x8058;
gl.RGB_422_APPLE = 0x8a1f;
gl.RG_EXT = 0x8227;
gl.RIGHT = 0x0407;
gl.SAMPLER = 0x82e6;
gl.SAMPLER_2D = 0x8b5e;
gl.SAMPLER_2D_ARRAY_SHADOW_NV = 0x8dc4;
gl.SAMPLER_2D_SHADOW_EXT = 0x8b62;
gl.SAMPLER_3D_OES = 0x8b5f;
gl.SAMPLER_CUBE = 0x8b60;
gl.SAMPLER_CUBE_SHADOW_NV = 0x8dc5;
gl.SAMPLER_EXTERNAL_OES = 0x8d66;
gl.SAMPLES = 0x80a9;
gl.SAMPLE_ALPHA_TO_COVERAGE = 0x809e;
gl.SAMPLE_BUFFERS = 0x80a8;
gl.SAMPLE_COVERAGE = 0x80a0;
gl.SAMPLE_COVERAGE_INVERT = 0x80ab;
gl.SAMPLE_COVERAGE_VALUE = 0x80aa;
gl.SCISSOR_BOX = 0xc10;
gl.SCISSOR_TEST = 0xc11;
gl.SGX_BINARY_IMG = 0x8c0a;
gl.SGX_PROGRAM_BINARY_IMG = 0x9130;
gl.SHADER = 0x82e1;
gl.SHADER_BINARY_DMP = 0x9250;
gl.SHADER_BINARY_FORMATS = 0x8df8;
gl.SHADER_BINARY_VIV = 0x8fc4;
gl.SHADER_COMPILER = 0x8dfa;
gl.SHADER_OBJECT_EXT = 0x8b48;
gl.SHADER_SOURCE_LENGTH = 0x8b88;
gl.SHADER_TYPE = 0x8b4f;
gl.SHADING_LANGUAGE_VERSION = 0x8b8c;
gl.SHORT = 0x1402;
gl.SIGNALED_APPLE = 0x9119;
gl.SLUMINANCE8_ALPHA8_NV = 0x8c45;
gl.SLUMINANCE8_NV = 0x8c47;
gl.SLUMINANCE_ALPHA_NV = 0x8c44;
gl.SLUMINANCE_NV = 0x8c46;
gl.SRC_ALPHA = 0x302;
gl.SRC_ALPHA_SATURATE = 0x308;
gl.SRC_COLOR = 0x300;
gl.SRGB8_ALPHA8_EXT = 0x8c43;
gl.SRGB8_NV = 0x8c41;
gl.SRGB_ALPHA_EXT = 0x8c42;
gl.SRGB_EXT = 0x8c40;
gl.STACK_OVERFLOW = 0x503;
gl.STACK_UNDERFLOW = 0x504;
gl.STATE_RESTORE = 0x8bdc;
gl.STATIC_DRAW = 0x88e4;
gl.STENCIL_ATTACHMENT = 0x8d20;
gl.STENCIL_BACK_FAIL = 0x8801;
gl.STENCIL_BACK_FUNC = 0x8800;
gl.STENCIL_BACK_PASS_DEPTH_FAIL = 0x8802;
gl.STENCIL_BACK_PASS_DEPTH_PASS = 0x8803;
gl.STENCIL_BACK_REF = 0x8ca3;
gl.STENCIL_BACK_VALUE_MASK = 0x8ca4;
gl.STENCIL_BACK_WRITEMASK = 0x8ca5;
gl.STENCIL_BITS = 0xd57;
gl.STENCIL_BUFFER_BIT = 0x400;
gl.STENCIL_BUFFER_BIT0_QCOM = 0x10000;
gl.STENCIL_BUFFER_BIT1_QCOM = 0x20000;
gl.STENCIL_BUFFER_BIT2_QCOM = 0x40000;
gl.STENCIL_BUFFER_BIT3_QCOM = 0x80000;
gl.STENCIL_BUFFER_BIT4_QCOM = 0x100000;
gl.STENCIL_BUFFER_BIT5_QCOM = 0x200000;
gl.STENCIL_BUFFER_BIT6_QCOM = 0x400000;
gl.STENCIL_BUFFER_BIT7_QCOM = 0x800000;
gl.STENCIL_CLEAR_VALUE = 0xb91;
gl.STENCIL_EXT = 0x1802;
gl.STENCIL_FAIL = 0xb94;
gl.STENCIL_FUNC = 0xb92;
gl.STENCIL_INDEX1_OES = 0x8d46;
gl.STENCIL_INDEX4_OES = 0x8d47;
gl.STENCIL_INDEX = 0x1901;
gl.STENCIL_INDEX8 = 0x8d48;
gl.STENCIL_PASS_DEPTH_FAIL = 0xb95;
gl.STENCIL_PASS_DEPTH_PASS = 0xb96;
gl.STENCIL_REF = 0xb97;
gl.STENCIL_TEST = 0xb90;
gl.STENCIL_VALUE_MASK = 0xb93;
gl.STENCIL_WRITEMASK = 0xb98;
gl.STREAM_DRAW = 0x88e0;
gl.SUBPIXEL_BITS = 0xd50;
gl.SYNC_CONDITION_APPLE = 0x9113;
gl.SYNC_FENCE_APPLE = 0x9116;
gl.SYNC_FLAGS_APPLE = 0x9115;
gl.SYNC_FLUSH_COMMANDS_BIT_APPLE = 0x1;
gl.SYNC_GPU_COMMANDS_COMPLETE_APPLE = 0x9117;
gl.SYNC_OBJECT_APPLE = 0x8a53;
gl.SYNC_STATUS_APPLE = 0x9114;
gl.TEXTURE = 0x1702;
gl.TEXTURE0 = 0x84c0;
gl.TEXTURE1 = 0x84c1;
gl.TEXTURE10 = 0x84ca;
gl.TEXTURE11 = 0x84cb;
gl.TEXTURE12 = 0x84cc;
gl.TEXTURE13 = 0x84cd;
gl.TEXTURE14 = 0x84ce;
gl.TEXTURE15 = 0x84cf;
gl.TEXTURE16 = 0x84d0;
gl.TEXTURE17 = 0x84d1;
gl.TEXTURE18 = 0x84d2;
gl.TEXTURE19 = 0x84d3;
gl.TEXTURE2 = 0x84c2;
gl.TEXTURE20 = 0x84d4;
gl.TEXTURE21 = 0x84d5;
gl.TEXTURE22 = 0x84d6;
gl.TEXTURE23 = 0x84d7;
gl.TEXTURE24 = 0x84d8;
gl.TEXTURE25 = 0x84d9;
gl.TEXTURE26 = 0x84da;
gl.TEXTURE27 = 0x84db;
gl.TEXTURE28 = 0x84dc;
gl.TEXTURE29 = 0x84dd;
gl.TEXTURE3 = 0x84c3;
gl.TEXTURE30 = 0x84de;
gl.TEXTURE31 = 0x84df;
gl.TEXTURE4 = 0x84c4;
gl.TEXTURE5 = 0x84c5;
gl.TEXTURE6 = 0x84c6;
gl.TEXTURE7 = 0x84c7;
gl.TEXTURE8 = 0x84c8;
gl.TEXTURE9 = 0x84c9;
gl.TEXTURE_2D = 0xde1;
gl.TEXTURE_3D_OES = 0x806f;
gl.TEXTURE_BINDING_2D = 0x8069;
gl.TEXTURE_BINDING_3D_OES = 0x806a;
gl.TEXTURE_BINDING_CUBE_MAP = 0x8514;
gl.TEXTURE_BINDING_EXTERNAL_OES = 0x8d67;
gl.TEXTURE_BORDER_COLOR_NV = 0x1004;
gl.TEXTURE_COMPARE_FUNC_EXT = 0x884d;
gl.TEXTURE_COMPARE_MODE_EXT = 0x884c;
gl.TEXTURE_CUBE_MAP = 0x8513;
gl.TEXTURE_CUBE_MAP_NEGATIVE_X = 0x8516;
gl.TEXTURE_CUBE_MAP_NEGATIVE_Y = 0x8518;
gl.TEXTURE_CUBE_MAP_NEGATIVE_Z = 0x851a;
gl.TEXTURE_CUBE_MAP_POSITIVE_X = 0x8515;
gl.TEXTURE_CUBE_MAP_POSITIVE_Y = 0x8517;
gl.TEXTURE_CUBE_MAP_POSITIVE_Z = 0x8519;
gl.TEXTURE_DEPTH_QCOM = 0x8bd4;
gl.TEXTURE_EXTERNAL_OES = 0x8d65;
gl.TEXTURE_FORMAT_QCOM = 0x8bd6;
gl.TEXTURE_HEIGHT_QCOM = 0x8bd3;
gl.TEXTURE_IMAGE_VALID_QCOM = 0x8bd8;
gl.TEXTURE_IMMUTABLE_FORMAT_EXT = 0x912f;
gl.TEXTURE_INTERNAL_FORMAT_QCOM = 0x8bd5;
gl.TEXTURE_MAG_FILTER = 0x2800;
gl.TEXTURE_MAX_ANISOTROPY_EXT = 0x84fe;
gl.TEXTURE_MAX_LEVEL_APPLE = 0x813d;
gl.TEXTURE_MIN_FILTER = 0x2801;
gl.TEXTURE_NUM_LEVELS_QCOM = 0x8bd9;
gl.TEXTURE_OBJECT_VALID_QCOM = 0x8bdb;
gl.TEXTURE_SAMPLES_IMG = 0x9136;
gl.TEXTURE_TARGET_QCOM = 0x8bda;
gl.TEXTURE_TYPE_QCOM = 0x8bd7;
gl.TEXTURE_USAGE_ANGLE = 0x93a2;
gl.TEXTURE_WIDTH_QCOM = 0x8bd2;
gl.TEXTURE_WRAP_R_OES = 0x8072;
gl.TEXTURE_WRAP_S = 0x2802;
gl.TEXTURE_WRAP_T = 0x2803;
gl.TIMEOUT_EXPIRED_APPLE = 0x911b;
gl.TIMEOUT_IGNORED_APPLE = 0xffffffffffffffff;
gl.TRANSLATED_SHADER_SOURCE_LENGTH_ANGLE = 0x93a0;
gl.TRIANGLES = 0x4;
gl.TRIANGLE_FAN = 0x6;
gl.TRIANGLE_STRIP = 0x5;
gl.TRUE = 0x1;
gl.UNKNOWN_CONTEXT_RESET_EXT = 0x8255;
gl.UNPACK_ALIGNMENT = 0xcf5;
gl.UNPACK_ROW_LENGTH = 0xcf2;
gl.UNPACK_SKIP_PIXELS = 0xcf4;
gl.UNPACK_SKIP_ROWS = 0xcf3;
gl.UNSIGNALED_APPLE = 0x9118;
gl.UNSIGNED_BYTE = 0x1401;
gl.UNSIGNED_INT = 0x1405;
gl.UNSIGNED_INT64_AMD = 0x8bc2;
gl.UNSIGNED_INT_10_10_10_2_OES = 0x8df6;
gl.UNSIGNED_INT_24_8_OES = 0x84fa;
gl.UNSIGNED_INT_2_10_10_10_REV_EXT = 0x8368;
gl.UNSIGNED_NORMALIZED_EXT = 0x8c17;
gl.UNSIGNED_SHORT = 0x1403;
gl.UNSIGNED_SHORT_1_5_5_5_REV_EXT = 0x8366;
gl.UNSIGNED_SHORT_4_4_4_4 = 0x8033;
gl.UNSIGNED_SHORT_4_4_4_4_REV_EXT = 0x8365;
gl.UNSIGNED_SHORT_4_4_4_4_REV_IMG = 0x8365;
gl.UNSIGNED_SHORT_5_5_5_1 = 0x8034;
gl.UNSIGNED_SHORT_5_6_5 = 0x8363;
gl.UNSIGNED_SHORT_8_8_APPLE = 0x85ba;
gl.UNSIGNED_SHORT_8_8_REV_APPLE = 0x85bb;
gl.VALIDATE_STATUS = 0x8b83;
gl.VENDOR = 0x1f00;
gl.VERSION = 0x1f02;
gl.VERTEX_ARRAY_BINDING_OES = 0x85b5;
gl.VERTEX_ARRAY_OBJECT_EXT = 0x9154;
gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING = 0x889f;
gl.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE = 0x88fe;
gl.VERTEX_ATTRIB_ARRAY_DIVISOR_NV = 0x88fe;
gl.VERTEX_ATTRIB_ARRAY_ENABLED = 0x8622;
gl.VERTEX_ATTRIB_ARRAY_NORMALIZED = 0x886a;
gl.VERTEX_ATTRIB_ARRAY_POINTER = 0x8645;
gl.VERTEX_ATTRIB_ARRAY_SIZE = 0x8623;
gl.VERTEX_ATTRIB_ARRAY_STRIDE = 0x8624;
gl.VERTEX_ATTRIB_ARRAY_TYPE = 0x8625;
gl.VERTEX_SHADER = 0x8b31;
gl.VERTEX_SHADER_BIT_EXT = 0x1;
gl.VIEWPORT = 0xba2;
gl.VIV_shader_binary = 0x1;
gl.WAIT_FAILED_APPLE = 0x911d;
gl.WRITEONLY_RENDERING_QCOM = 0x8823;
gl.WRITE_ONLY_OES = 0x88b9;
gl.Z400_BINARY_AMD = 0x8740;
gl.ZERO = 0x0;

gl.RASTERIZER_DISCARD = 0x8C89;
gl.UNPACK_FLIP_Y_WEBGL = 0x9240;
gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL = 0x9241;
gl.CONTEXT_LOST_WEBGL = 0x9242;
gl.UNPACK_COLORSPACE_CONVERSION_WEBGL = 0x9243;
gl.BROWSER_DEFAULT_WEBGL = 0x9244;

},{}],36:[function(require,module,exports){
"use strict";

jsb.__obj_ref_id = 0;

jsb.registerNativeRef = function (owner, target) {
    if (owner && target && owner !== target) {
        var targetID = target.__jsb_ref_id;
        if (targetID === undefined) targetID = target.__jsb_ref_id = jsb.__obj_ref_id++;

        var refs = owner.__nativeRefs;
        if (!refs) {
            refs = owner.__nativeRefs = {};
        }

        refs[targetID] = target;
    }
};

jsb.unregisterNativeRef = function (owner, target) {
    if (owner && target && owner !== target) {
        var targetID = target.__jsb_ref_id;
        if (targetID === undefined) return;

        var refs = owner.__nativeRefs;
        if (!refs) {
            return;
        }

        delete refs[targetID];
    }
};

jsb.unregisterAllNativeRefs = function (owner) {
    if (!owner) return;
    delete owner.__nativeRefs;
};

jsb.unregisterChildRefsForNode = function (node, recursive) {
    recursive = !!recursive;
    var children = node.getChildren(),
        i = void 0,
        l = void 0,
        child = void 0;
    for (i = 0, l = children.length; i < l; ++i) {
        child = children[i];
        jsb.unregisterNativeRef(node, child);
        if (recursive) {
            jsb.unregisterChildRefsForNode(child, recursive);
        }
    }
};

},{}],37:[function(require,module,exports){
(function (global){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* promise.min.js
 * A Promise polyfill implementation.
 * 2018-11-16
 *
 * By taylorhakes, https://github.com/taylorhakes
 * License: MIT
 *   See https://github.com/taylorhakes/promise-polyfill/blob/master/LICENSE
 */

/*! @source https://cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.js */
!function (e, n) {
  "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) && "undefined" != typeof module ? n() : "function" == typeof define && define.amd ? define(n) : n();
}(0, function () {
  "use strict";
  function e(e) {
    var n = this.constructor;return this.then(function (t) {
      return n.resolve(e()).then(function () {
        return t;
      });
    }, function (t) {
      return n.resolve(e()).then(function () {
        return n.reject(t);
      });
    });
  }function n() {}function t(e) {
    if (!(this instanceof t)) throw new TypeError("Promises must be constructed via new");if ("function" != typeof e) throw new TypeError("not a function");this._state = 0, this._handled = !1, this._value = undefined, this._deferreds = [], u(e, this);
  }function o(e, n) {
    for (; 3 === e._state;) {
      e = e._value;
    }0 !== e._state ? (e._handled = !0, t._immediateFn(function () {
      var t = 1 === e._state ? n.onFulfilled : n.onRejected;if (null !== t) {
        var o;try {
          o = t(e._value);
        } catch (f) {
          return void i(n.promise, f);
        }r(n.promise, o);
      } else (1 === e._state ? r : i)(n.promise, e._value);
    })) : e._deferreds.push(n);
  }function r(e, n) {
    try {
      if (n === e) throw new TypeError("A promise cannot be resolved with itself.");if (n && ("object" == (typeof n === "undefined" ? "undefined" : _typeof(n)) || "function" == typeof n)) {
        var o = n.then;if (n instanceof t) return e._state = 3, e._value = n, void f(e);if ("function" == typeof o) return void u(function (e, n) {
          return function () {
            e.apply(n, arguments);
          };
        }(o, n), e);
      }e._state = 1, e._value = n, f(e);
    } catch (r) {
      i(e, r);
    }
  }function i(e, n) {
    e._state = 2, e._value = n, f(e);
  }function f(e) {
    2 === e._state && 0 === e._deferreds.length && t._immediateFn(function () {
      e._handled || t._unhandledRejectionFn(e._value);
    });for (var n = 0, r = e._deferreds.length; r > n; n++) {
      o(e, e._deferreds[n]);
    }e._deferreds = null;
  }function u(e, n) {
    var t = !1;try {
      e(function (e) {
        t || (t = !0, r(n, e));
      }, function (e) {
        t || (t = !0, i(n, e));
      });
    } catch (o) {
      if (t) return;t = !0, i(n, o);
    }
  }var c = setTimeout;t.prototype["catch"] = function (e) {
    return this.then(null, e);
  }, t.prototype.then = function (e, t) {
    var r = new this.constructor(n);return o(this, new function (e, n, t) {
      this.onFulfilled = "function" == typeof e ? e : null, this.onRejected = "function" == typeof n ? n : null, this.promise = t;
    }(e, t, r)), r;
  }, t.prototype["finally"] = e, t.all = function (e) {
    return new t(function (n, t) {
      function o(e, f) {
        try {
          if (f && ("object" == (typeof f === "undefined" ? "undefined" : _typeof(f)) || "function" == typeof f)) {
            var u = f.then;if ("function" == typeof u) return void u.call(f, function (n) {
              o(e, n);
            }, t);
          }r[e] = f, 0 == --i && n(r);
        } catch (c) {
          t(c);
        }
      }if (!e || "undefined" == typeof e.length) throw new TypeError("Promise.all accepts an array");var r = Array.prototype.slice.call(e);if (0 === r.length) return n([]);for (var i = r.length, f = 0; r.length > f; f++) {
        o(f, r[f]);
      }
    });
  }, t.resolve = function (e) {
    return e && "object" == (typeof e === "undefined" ? "undefined" : _typeof(e)) && e.constructor === t ? e : new t(function (n) {
      n(e);
    });
  }, t.reject = function (e) {
    return new t(function (n, t) {
      t(e);
    });
  }, t.race = function (e) {
    return new t(function (n, t) {
      for (var o = 0, r = e.length; r > o; o++) {
        e[o].then(n, t);
      }
    });
  }, t._immediateFn = "function" == typeof setImmediate && function (e) {
    setImmediate(e);
  } || function (e) {
    c(e, 0);
  }, t._unhandledRejectionFn = function (e) {
    void 0 !== console && console && console.warn("Possible Unhandled Promise Rejection:", e);
  };var l = function () {
    if ("undefined" != typeof self) return self;if ("undefined" != typeof window) return window;if ("undefined" != typeof global) return global;throw Error("unable to locate global object");
  }();"Promise" in l ? l.Promise.prototype["finally"] || (l.Promise.prototype["finally"] = e) : l.Promise = t;
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[4]);
