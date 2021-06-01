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

	function Vue(option) {
		if (!(this instanceof Vue)) console.log("Vue 必须是被new出来的");
		// this._init(option)
	}

	function defineReactive(obj, key, value) {}

	function set(target, key, val) {}

	function del(target, key) {}

	function initGlobalAPI(Vue) {
		// 设置只读 config
		const configDef = {};
		configDef.get = () => config;
		Object.defineProperty(Vue, "config", configDef);

		// 增加Vue util上 def 能力
		Vue.util = {
			defineReactive,
		};

		// 增加 Vue set del nextTick 能力
		Vue.set = set;
		Vue.delete = del;
		// Vue.nextTick = nextTick

		Vue.options = Object.create(null);

		Vue.options._base = Vue;
	}

	// 初始化全局api
	initGlobalAPI(Vue);

	const createPatchFunction = function () {};

	const patch = createPatchFunction();

	Vue.prototype.__patch__ = patch;

	/*  */

	function query(el) {
		const selected = document.querySelector(el);
		return selected
	}

	/*  */

	const idToTemplate = cached((id) => {
		const el = query(id);
		return el && el.innerHTML
	});

	Vue.prototype.$mount;
	Vue.prototype.$mount = function (el) {
		el = el && query(el);

		const options = this.$options;

		/**
		 * 获取模板
		 * 生成 render 函数
		 */
		if (!options.render) {
			let template = options.template;
			if (template) {
				if (typeof template === "string") {
					if (template.charAt(0) !== "#") console.log("警告下");
					template = idToTemplate(template);
				} else if (template.nodeType) {
					//这是走.vue 文件的模板渲染
					template = template.innerHTML;
				} else {
					return this
				}
			} else if (el) {
				template = getOuterHTML(el);
			}

			if (template) {
				// 模板转 render 函数
				compileToFunctions(template, this);
			}
		}
	};

	function getOuterHTML(el) {
		if (el.outerHTML) {
			return el.outerHTML
		} else {
			const container = document.createElement("div");
			container.appendChild(el.cloneNode(true));
			return container.innerHTML
		}
	}

	return Vue;

})));
