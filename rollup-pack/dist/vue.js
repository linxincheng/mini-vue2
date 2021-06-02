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

	function noop$1(a, b, c) {} // 什么都不做，用来占位置的空函数

	// 将类数组对象转换为真正的数组
	function toArray(list, start) {
		start = start || 0;
		let i = list.length - start;
		const ret = new Array(i);
		while (i--) {
			ret[i] = list[i + start];
		}
		return ret
	}

	// import config from '../config'
	// const strats = config.optionMergeStrategies
	const strats = Object.create(null);
	/**
	 *将两个选项对象合并为一个新对象。
	 *用于实例化和继承的核心实用程序。
	 */
	function mergeOptions(parent, child, vm) {
		if (typeof child === "function") {
			child = child.options;
		}

		// 这块标准化Props，Inject， Directives，这块我注释掉
		// normalizeProps(child, vm)
		// normalizeInject(child, vm)
		// normalizeDirectives(child)

		//在子选项上应用扩展和混合，
		//但前提是它是一个原始选项对象，而不是
		//另一个 mergeOptions 调用的结果。
		//只有合并选项具有 _base 属性。
		if (!child._base) {
			// 如果有 extends 就深入合并
			if (child.extends) {
				parent = mergeOptions(parent, child.extends, vm);
			}
			// 如果有 mixins 就深入合并
			if (child.mixins) {
				for (let i = 0, l = child.mixins.length; i < l; i++) {
					parent = mergeOptions(parent, child.mixins[i], vm);
				}
			}
		}

		// child的属性优先级比parent高
		// 如有同名，使用child的属性
		const options = {};
		let key;
		for (key in parent) {
			mergeField(key);
		}
		for (key in child) {
			if (!hasOwn(parent, key)) {
				mergeField(key);
			}
		}
		function mergeField(key) {
			// 通过Object.create 合并
			const strat = strats[key] || defaultStrat;
			options[key] = strat(parent[key], child[key], vm, key);
		}
		return options
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

	const unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;
	const bailRE = new RegExp(`[^${unicodeRegExp.source}.$_\\d]`);
	// 简化版本 export const unicodeRegExp = /a-zA-Z/;
	function parsePath(path) {
		// 用于匹配xxx.xxx.xx 正则表达式
		// 'xxx.xxx.xxx' return xxx.xxx.xxx
		if (bailRE.test(path)) {
			return
		}
		const segments = path.split(".");
		return function (obj) {
			for (let i = 0; i < segments.length; i++) {
				if (!obj) return
				obj = obj[segments[i]];
			}
			return obj
		}
	}

	function initUse(Vue) {
		Vue.use = function (plugin) {
			// 已经被安装的插件会在Vue._installedPlugins找到
			const installedPlugins =
				this._installedPlugins || (this._installedPlugins = []);

			// 如果已经安装直接返回
			if (installedPlugins.indexOf(plugin) > -1) {
				return this
			}

			// additional parameters
			const args = toArray(arguments, 1);
			args.unshift(this);

			// 如果有install方法就执行
			// 插件的初始化就在这儿
			if (typeof plugin.install === "function") {
				plugin.install.apply(plugin, args);
			} else if (typeof plugin === "function") {
				plugin.apply(null, args);
			}
			installedPlugins.push(plugin);
			return this
		};
	}

	function initMixin(Vue) {
		// vue 的mixin 逻辑很简单就是option合并
		Vue.mixin = function (mixin) {
			this.options = mergeOptions(this.options, mixin);
			return this
		};
	}

	function initExtend(Vue) {
		Vue.cid = 0;
		let cid = 1;

		// 初始化组件
		// 拿到全局的被指
		Vue.extend = function (extendOptions) {
			const Super = this;
			const SuperId = Super.cid; // 拿到组件cid，第一次加载时undefined
			const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {});
			// 缓存有就访问缓存
			if (cachedCtors[SuperId]) {
				return cachedCtors[SuperId]
			}

			extendOptions.name || Super.options.name;

			const Sub = function VueComponent(options) {
				this._init(options);
			};
			Sub.prototype = Object.create(Super.prototype);
			Sub.prototype.constructor = Sub;
			Sub.cid = cid++;
			Sub.options = mergeOptions(Super.options, extendOptions);
			Sub["super"] = Super;

			if (Sub.options.props) {
				// 设置访问 proxy，可以this.xxx 访问到this._props.xxx
				initProps(Sub); // initProps方法的源码我不导入了
			}
			//
			if (Sub.options.computed) {
				// 创建computed watcher
				initComputed(Sub); // initComputed方法的源码我不导入了
			}
		};
	}

	// 每一个vue组件都会挂载的成员
	const ASSET_TYPES = ["component", "directive", "filter"];

	function initAssetRegisters(Vue) {
		// [
		//    'component',
		//    'directive',
		//    'filter'
		// ]
		// 创建注册方法
		// options 里的 components, directives, filters
		ASSET_TYPES.forEach((type) => {
			Vue[type] = function (id, definition) {
				if (!definition) {
					return this.options[type + "s"][id]
				} else {
					if (type === "component") {
						definition.name = definition.name || id;
						definition = this.options._base.extend(definition);
					}
					if (type === "directive" && typeof definition === "function") {
						definition = { bind: definition, update: definition };
					}
					this.options[type + "s"][id] = definition;
					return definition
				}
			};
		});
	}

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

		initUse(Vue);
		initMixin(Vue);
		initExtend(Vue);
		initAssetRegisters(Vue);
	}

	// 初始化全局api
	initGlobalAPI(Vue);

	class VNode {
		tag
		data
		children
		text
		context //rendered in this component's scope

		constructor(tag, data, children, text, context) {
			this.tag = tag;
			this.data = data;
			this.children = children;
			this.text = text;
			this.context = context;
		}
	}
	const createEmptyVNode = (text = "") => {
		const node = new VNode();
		node.text = text;
		node.isComment = true;
		return node
	};

	const seenObjects = new Set();

	function traverse(val) {
		_traverse(val, seenObjects);
		seenObjects.clear();
	}

	// 进行深度依赖收集
	function _traverse(val, seen) {
		let i, keys;
		const isA = Array.isArray(val);

		// 如果数据不是响应式的就不需要递归
		// if (
		// (!isA && !isObject(val)) ||
		// Object.isFrozen(val) ||
		// val instanceof VNode
		// ) {
		// 	return
		// }

		// __ob__ 表示这个对象是响应式对象， ob 就是 observer
		if (val.__ob__) {
			const depId = val.__ob__.dep.id;

			// 保证了循环引用不会递归遍历
			if (seen.has(depId)) {
				return
			}
			seen.add(depId);
		}
		if (isA) {
			i = val.length;
			while (i--) _traverse(val[i], seen); // 对每一个数组项进行访问
		} else {
			keys = Object.keys(val);
			i = keys.length;
			while (i--) _traverse(val[keys[i]], seen); // 对每一个对象的属性进行访问
		}
	}

	// watcher 队列
	const queue = [];

	let has = {};

	// 开关标记
	// 异步的触发没有开始，类比setTimeout还没有执行
	let waiting = false;
	// 开始渲染，清空队列，执行队列中的watcher的run方法
	let flushing = false;

	// 触发更新
	function flushSchedulerQueue() {
		flushing = true;
		let watcher, id;

		// 对watcher进行排序
		queue.sort((a, b) => a.id - b.id);

		for (index = 0; index < queue.length; index++) {
			watcher = queue[index];
			if (watcher.before) {
				watcher.before();
			}
			id = watcher.id;
			has[id] = null;
			watcher.run();
		}
	}

	function queueWatcher(watcher) {
		const id = watcher.id;

		// 检查下是否在队列里
		if (has[id] == null) {
			has[id] = true;
			if (!flushing) {
				queue.push(watcher);
			} else {
				// if already flushing, splice the watcher based on its id
				// if already past its id, it will be run next immediately.
				let i = queue.length - 1;
				while (i > index && queue[i].id > watcher.id) {
					i--;
				}
				queue.splice(i + 1, 0, watcher);
			}
			// queue the flush
			if (!waiting) {
				waiting = true;

				if (!config.async) {
					// 同步情况下
					flushSchedulerQueue();
					return
				}
				// 让任务队列中的watcher 在下 ‘一个事件循环’中触发
				// 不阻塞当前的处理逻辑
				process.nextTick(flushSchedulerQueue);
			}
		}
	}

	let uid = 0;
	class Watcher {
		vm // 实例
		expression // 渲染函数 或者关联表达式
		cb // user watch的callback
		id
		lazy // 计算属性和watch 来控制不要让watcher 立即执行
		user // 是不是user watch
		deep // 是否深度监听

		// 在 Vue 中使用了二次提交的概念
		// 每次在数据渲染或计算的时候 就会访问响应式的数据，就会进行依赖收集
		// 就将关联的Watcher 与 dep 相关联
		// 在数据发生变化的时候，根据dep 找到关联的watcher，依次调用 update
		// 执行完成后清空 watcher
		deps // 依赖的当前dep list
		newDeps // 依赖的最新dep list

		// 下面两个属性，主要为了做比较，去重
		depIds
		newDepIds

		before // 用于before生命周期

		getter // 就是渲染函数（模板或组件的渲染） 或计算属性（watch）

		value // 如果是渲染函数，value无效，如果是计算属性，缓存的值

		constructor(vm, expOrFn, cb, options, isRenderWatcher) {
			this.vm = vm;
			if (isRenderWatcher) {
				vm._watcher = this;
			}

			// options
			if (options) {
				this.user = !!options.user;
				this.lazy = !!options.lazy;
				this.before = options.before;
				this.deep = options.deep;
			} else {
				this.user = this.lazy = false;
			}

			this.cb = cb;
			this.id = ++uid; // uid for batching
			this.active = true;
			this.deps = [];
			this.newDeps = [];
			this.depIds = new Set();
			this.newDepIds = new Set();

			this.expression = expOrFn.toString();

			if (typeof expOrFn === "function") {
				// 就是render函数
				this.getter = expOrFn;
			} else {
				this.getter = parsePath(expOrFn);
			}

			// 如果是lazy就什么也不做，否则就立即调用getter函数求值（expOfFn）
			this.value = this.lazy ? undefined : this.get();
		}

		get() {

			value = this.getter.call(vm, vm);

			// 去访问每一个属性，收集依赖
			if (this.deep) {
				traverse(value);
			}
			this.cleanupDeps(); // “清空（归档）” 关联的dep 属性
		}

		addDep(dep) {
			const id = dep.id;
			if (!this.newDepIds.has(id)) {
				this.newDepIds.add(id);
				this.newDeps.push(dep); // 让 watcher 关联 dep

				if (!this.depIds.has(id)) {
					dep.addSub(this); // 让 dep 关联到 watcher
				}
			}
		}

		// 更新 dep相关的四个属性， 删除旧的， 新的变旧的
		cleanupDeps() {
			let i = this.deps.length;
			while (i--) {
				const dep = this.deps[i];

				// 在二次提交中 归档 就是让旧的deps 和新的 newDeps 一致
				if (!this.newDepIds.has(dep.id)) {
					dep.removeSub(this);
				}
			}
			let tmp = this.depIds;
			this.depIds = this.newDepIds;
			this.newDepIds = tmp;
			this.newDepIds.clear();
			tmp = this.deps;
			this.deps = this.newDeps; // 同步
			this.newDeps = tmp;
			this.newDeps.length = 0;
		}

		// 说明 watcher 的数据（eg: 属性修改）有变化
		update() {
			/* istanbul ignore else */
			if (this.lazy) {
				// 主要针对计算属性，一般用于求值计算
				this.dirty = true;
			} else if (this.sync) {
				// 同步，主要用于ssr， 同步就表示立即计算
				this.run();
			} else {
				// 加入到一个队列里
				// 一般的浏览器中的异步运行， 本质上就是异步执行 run
				// 类比 setTimeout(() => this.run, 0)
				queueWatcher(this);
			}
		}

		// 依赖收集
		depend() {
			let i = this.deps.length;
			// watcher 和 dep 之前互存
			while (i--) {
				this.deps[i].depend();
			}
		}

		/**
		 * 调用get求值或渲染，如果求值，新旧值不一样，就触发cb
		 */
		run() {
			if (this.active) {
				const value = this.get(); // 要么渲染，要么求值
				if (
					value !== this.value ||
					// Deep watchers and watchers on Object/Arrays should fire even
					// when the value is the same, because the value may
					// have mutated.
					isObject(value) ||
					this.deep
				) {
					// set new value
					const oldValue = this.value;
					this.value = value;
					// if (this.user) {
					//   const info = `callback for watcher "${this.expression}"`;
					//   invokeWithErrorHandling(
					//     this.cb,
					//     this.vm,
					//     [value, oldValue],
					//     this.vm,
					//     info
					//   );
					// } else {

					// 就在这儿
					this.cb.call(this.vm, value, oldValue);

					// }
				}
			}
		}

		/**
		 * 移除数据，相当于remove
		 * 一般用于销毁组件的时候调用
		 */
		teardown() {
			if (this.active) {
				if (!this.vm._isBeingDestroyed) {
					remove(this.vm._watchers, this);
				}
				let i = this.deps.length;
				while (i--) {
					this.deps[i].removeSub(this);
				}
				this.active = false;
			}
		}
	}

	// 挂载组件
	const mountComponent = function (vm, el) {
		vm.$el = el;
		// 如果没有render fn
		// 先将render fn设置为 创建空的vnode
		if (!vm.$options.render) {
			vm.$options.render = createEmptyVNode;
		}

		callHook(vm, "beforeMount");

		let updateComponent = () => {
			// _render 用来生成虚拟DOM
			// _update 内部调用patch 方法 将虚拟DOM与真实的DOM同步（diff）
			vm._update(vm._render());
		};

		new Watcher(
			vm,
			updateComponent,
			noop$1, // 非 user watcher:callback 为空函数
			{
				before() {
					if (vm._isMounted && !vm._isDestroyed) {
						callHook(vm, "beforeUpdate");
					}
				},
			},
			true /* is Render Watcher */
		);
	};

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
