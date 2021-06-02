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

	const cached = function (fn) {
		const cache = Object.create(null);
		return function cachedFn(str) {
			const hit = cache[str];
			return hit || (cache[str] = fn(str))
		}
	};

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

	/*  */

	function query(el) {
		const selected = document.querySelector(el);
		return selected
	}

	const createPatchFunction = function () {};

	const patch = createPatchFunction();

	Vue.prototype.__patch__ = patch;

	Vue.prototype.$mount = function (el) {
		el = el && query(el);
		return mountComponent(this, el)
	};

	const baseOptions = {
		expectHTML: true,
		// modules,
		// directives,
		// isPreTag,
		// isUnaryTag,
		// mustUseProp,
		// canBeLeftOpenTag,
		// isReservedTag,
		// getTagNamespace,
		// staticKeys: genStaticKeys(modules)
	};

	function createFunction(code, errors) {
		try {
			return new Function(code)
		} catch (err) {
			errors.push({ err, code });
			return noop
		}
	}

	function createCompileToFunctionFn(compiler) {
		const cache = Object.create(null);

		return function compileToFunctions(template, options, vm) {
			options = extend({}, options);

			// 编译的时候缓存
			const key = options.delimiters
				? String(options.delimiters) + template
				: template;
			if (cache[key]) {
				return cache[key]
			}

			// compile
			const compiled = compile(template, options);

			// turn code into functions
			// 生成render funciton
			const res = {};
			const fnGenErrors = [];
			res.render = createFunction(compiled.render, fnGenErrors);
			res.staticRenderFns = compiled.staticRenderFns.map((code) => {
				return createFunction(code, fnGenErrors)
			});

			return (cache[key] = res)
		}
	}

	const createCompilerCreator = function (baseCompile) {
		return function createCompiler(baseOptions) {
			function compile(template, options) {
				const finalOptions = Object.create(baseOptions);

				const compiled = baseCompile(template.trim(), finalOptions);
				return compiled
			}

			return {
				compile,
				compileToFunctions: createCompileToFunctionFn(),
			}
		}
	};

	//  返回 Ast
	const createCompiler = createCompilerCreator(function baseCompile(
		template,
		options
	) {
		// 生成 ast
		const ast = parse(template.trim(), options);
		if (options.optimize !== false) {
			/**
			 * 优化
			 * 标记非静态
			 * 标记静态根
			 */
			optimize(ast, options);
		}

		// 生成 render 函数
		const code = generate(ast, options);
		return {
			ast,
			render: code.render,
			staticRenderFns: code.staticRenderFns,
		}
	});

	const { compile: compile$1, compileToFunctions } = createCompiler(baseOptions);

	/*  */

	const idToTemplate = cached((id) => {
		const el = query(id);
		return el && el.innerHTML
	});

	const mount = Vue.prototype.$mount;
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
				const { render, staticRenderFns } = compileToFunctions(template, this);

				// 将 render fn  放到组件的option上
				options.render = render;
				options.staticRenderFns = staticRenderFns;
			}
		}

		return mount.call(this, el)
	};

	// 获取 外部 dom标签
	function getOuterHTML(el) {
		if (el.outerHTML) {
			return el.outerHTML
		} else {
			const container = document.createElement("div");
			container.appendChild(el.cloneNode(true));
			return container.innerHTML
		}
	}

	Vue.compile = compileToFunctions;

	return Vue;

})));
