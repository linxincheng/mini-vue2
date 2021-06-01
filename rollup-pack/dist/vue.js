/*!
 * Vue.js v1.0.0
 * (c) 2014-2021 Evan You
 * Released under the MIT License.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
}(this, (function () { 'use strict';

	const createPatchFunction = function () {};

	const patch = createPatchFunction();

	// import Vue from "core/index"
	function Vue() {}
	Vue.prototype.__patch__ = patch;

	/*  */

	return Vue;

})));
