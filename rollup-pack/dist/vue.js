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

	class VNode$1 {
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
		const node = new VNode$1();
		node.text = text;
		node.isComment = true;
		return node
	};

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
	function mergeOptions$1(parent, child, vm) {
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
				parent = mergeOptions$1(parent, child.extends, vm);
			}
			// 如果有 mixins 就深入合并
			if (child.mixins) {
				for (let i = 0, l = child.mixins.length; i < l; i++) {
					parent = mergeOptions$1(parent, child.mixins[i], vm);
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

	const arrayProto = Array.prototype;
	// arrayMethods 就是继承自 Array.prototype的数组
	// 只需要让响应式数组继承自 arrayMethods
	const arrayMethods = Object.create(arrayProto);

	const methodsToPatch = [
		"push",
		"pop",
		"shift",
		"unshift",
		"splice",
		"sort",
		"reverse",
	];

	methodsToPatch.forEach(function (method) {
		// cache original method
		const original = arrayProto[method];
		def(arrayMethods, method, function mutator(...args) {
			// 先调用
			const result = original.apply(this, args);
			// let inserted;
			// switch (method) {
			//   case "push":
			//   case "unshift":
			//     inserted = args;
			//     break;
			//   case "splice":
			//     inserted = args.slice(2);
			//     break;
			// }
			// if (inserted) ob.observeArray(inserted);
			// 派发更新
			const ob = this.__ob__;
			ob.dep.notify();
			return result
		});
	});

	class Observer {
		value // 循环引用：对象.__ob__，ob.value
		dep // 属性的Dep, 属性依赖的问题
		// 计数的
		vmCount

		constructor(value) {
			this.value = value;
			this.dep = new Dep();
			this.vmCount = 0;
			def(value, "__ob__", this); // 技巧：Object.defineProperty 逻辑上等价于 value.__ob__ = this；

			// 响应式化的逻辑
			if (Array.isArray(value)) {
				// 如何进行浏览器的能力检查

				// 判断浏览器是否兼容 __prop__
				if (hasProto) {
					// protoAugment(value, arrayMethods)
					target.__proto__ = arrayMethods;
				} else {
					copyAugment(value, arrayMethods, arrayKeys);
				}
				this.observeArray(value); // 遍历数组的元素，进行递归observe
			} else {
				this.walk(value); // 遍历对象的属性，递归observe
			}
		}

		/**
		 *
		 * 遍历 对象 做 def
		 */
		walk(obj) {
			const keys = Object.keys(obj);
			for (let i = 0; i < keys.length; i++) {
				defineReactive(obj, keys[i]);
			}
		}

		/**
		 * Observe a list of Array items.
		 *
		 * 遍历数组做 def
		 */
		observeArray(items) {
			for (let i = 0, l = items.length; i < l; i++) {
				observe(items[i]);
			}
		}
	}

	/**
	 * 将传入的数据value变成响应式对象
	 *
	 * 算法描述
	 *
	 *  - 先看 对象是否含有__ob__,并且是Observer的实例（Vue中响应式对象的标记）
	 * 有，忽略
	 * 没有，调用new Obserrver, 进行响应式话
	 */
	function observe(value, asRoot) {
		// 如果不满足响应式条件就跳出
		if (!isObject(value) || value instanceof VNode) {
			return
		}
		let ob;
		if (hasOwn(value, "__ob__") && value.__ob__ instanceof Observer) {
			ob = value.__ob__; // 已经是observer
		} else if (
			shouldObserve &&
			!isServerRendering() &&
			(Array.isArray(value) || isPlainObject(value)) && // 是不是对象或者数组
			Object.isExtensible(value) &&
			!value._isVue
		) {
			ob = new Observer(value);
		}
		if (asRootData && ob) {
			ob.vmCount++;
		}
		return ob
	}

	// 对属性进行做响应式
	function defineReactive(obj, key, value, customSetter, shallow) {
		const dep = new Dep();

		// 获得对象的属性描述， 就是定义Object.defineProperty需要传入对象 ({enumerable, writable, ...})
		const property = Object.getOwnPropertyDescriptor(obj, key);
		if (property && property.configurable === false) {
			return
		}

		// cater for pre-defined getter/setters
		const getter = property && property.get;
		const setter = property && property.set;
		if ((!getter || setter) && arguments.length === 2) {
			val = obj[key];
		}

		let childOb = observe(val);

		Object.defineProperty(obj, key, {
			enumerable: true,
			configurable: true,
			get: function reactiveGetter() {
				const value = getter ? getter.call(obj) : val; // 保证了如果已经定义的get 方法可以被继承下来，不会被丢失

				if (Dep.target) {
					// 判断全局是否有watcher
					dep.depend(); // 关联的当前属性

					// 收集子属性
					if (childOb) {
						childOb.dep.depend();
						if (Array.isArray(value)) {
							dependArray(value);
						}
					}
				}
				return value
			},
			set: function reactiveSetter(newVal) {
				const value = getter ? getter.call(obj) : val;
				// 如果数据没有发生变化，就不会发生派发更新
				if (newVal === value || (newVal !== newVal && value !== value)) {
					return
				}
				/* eslint-enable no-self-compare */
				// if (customSetter) {
				// 	customSetter()
				// }

				// #7981: for accessor properties without setter
				// if (getter && !setter) return
				// if (setter) {
				// 	setter.call(obj, newVal) // 保证了如果已经定义了set方法可以被继承下来，不会丢失
				// } else {
				// 	val = newVal
				// }
				childOb = !shallow && observe(newVal); // 对新值就行响应式化
				dep.notify(); // 派发更新
			},
		});
	}

	function set(target, key, val) {}

	function del(target, key) {}

	/**
	 * 对数组进行依赖收集
	 */
	function dependArray(value) {
		for (let e, i = 0, l = value.length; i < l; i++) {
			e = value[i];
			e && e.__ob__ && e.__ob__.dep.depend();
			if (Array.isArray(e)) {
				dependArray(e);
			}
		}
	}

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

	let uid$1 = 0;
	class Watcher$1 {
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
			this.id = ++uid$1; // uid for batching
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

	function initLifecycle(vm) {
		const options = vm.$options;

		// locate first non-abstract parent
		let parent = options.parent;
		// 给所有祖先组件的$children增加vm实例
		if (parent && !options.abstract) {
			while (parent.$options.abstract && parent.$parent) {
				parent = parent.$parent;
			}
			parent.$children.push(vm);
		}

		// 以下是增加初始化属性
		vm.$parent = parent;
		vm.$root = parent ? parent.$root : vm;

		vm.$children = [];
		vm.$refs = {};

		vm._watcher = null;
		vm._inactive = null;
		vm._directInactive = false;
		vm._isMounted = false;
		vm._isDestroyed = false;
		vm._isBeingDestroyed = false;
	}

	// 挂载Vue原型上_update 方法
	function lifecycleMixin(Vue) {
		Vue.prototype._update = function (vnode) {
			const vm = this;

			const prevEl = vm.$el;
			const prevVnode = vm._vnode;
			vm._vnode = vnode;

			// Vue.prototype.__patch__ 在入口点注入
			if (!prevVnode) {
				// 首次渲染
				vm.$el = vm.__patch__(vm.$el, vnode, false /* removeOnly */);
			} else {
				// 更新
				vm.$el = vm.__patch__(prevVnode, vnode);
			}

			// update __vue__ reference 到时候可以被GC
			if (prevEl) {
				prevEl.__vue__ = null;
			}
			if (vm.$el) {
				vm.$el.__vue__ = vm;
			}
		};

		Vue.prototype.$forceUpdate = function () {};

		Vue.prototype.$destroy = function () {};
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

		new Watcher$1(
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

	function callHook(vm, hook) {
		const handlers = vm.$options[hook];
		if (handlers) {
			for (let i = 0, j = handlers.length; i < j; i++) {
				// invoke hook
				// invokeWithErrorHandling(handlers[i], vm, null, vm, info);
			}
		}
		if (vm._hasHookEvent) {
			vm.$emit("hook:" + hook);
		}
	}

	function initEvents(vm) {
		vm._events = Object.create(null);
		// 初始化父组件的事件
		vm.$options._parentListeners;
	}

	// 在原型上挂载 事件模型 on, once, off, emit
	function eventsMixin(Vue) {
		Vue.prototype.$on = function () {};
		Vue.prototype.$once = function () {};
		Vue.prototype.$off = function () {};
		Vue.prototype.$emit = function () {};
	}

	// 返回一个创建vnode的render函数
	function createElement(
		context,
		tag,
		data,
		children,
		normalizationType,
		alwaysNormalize
	) {
		// return _createElement(context, tag, data, children, normalizationType)
	}

	// 初始化创建元素的方法
	function initRender(vm) {
		vm._c = (a, b, c, d) => createElement(); // 系统创建元素的方法
		vm.$createElement = (a, b, c, d) => createElement(); // 用户提供了render 属性时创建元素的方法
	}

	// 挂载nextick 和 _render方法
	function renderMixin(Vue) {
		Vue.prototype.$nextTick = function (fn) {
			return procss.nextTick(fn, this)
		};

		Vue.prototype._render = function () {};
	}

	// 设置一些属性访问
	// 在原型上挂载 $watch 方法
	function stateMixin(Vue) {
		// 设置默认proxy
		const dataDef = {};
		dataDef.get = function () {
			return this._data
		};
		const propsDef = {};
		propsDef.get = function () {
			return this._props
		};

		// 设置访问 $data 访问到 _data
		// 设置访问 $props 访问到 _props
		// 一般 $ 开头都是内部只读属性, _ 开头是内部可读可写
		Object.defineProperty(Vue.prototype, "$data", dataDef);
		Object.defineProperty(Vue.prototype, "$props", propsDef);

		// 这块先过. 等等回来写
		// Vue.prototype.$set = set;
		// Vue.prototype.$delete = del;

		Vue.prototype.$watch = function (expOrFn, cb, options) {};
	}

	function initState(vm) {
		vm._watchers = [];
		const opts = vm.$options;
		// 处理options.props的成员, 一般定义组件的时候， 用于定义对外的成员
		if (opts.props) initProps$1(vm, opts.props);

		// 处理options.method的成员，处理方法成员
		if (opts.methods) initMethods(vm, opts.methods);

		// 处理options.data (响应式)
		if (opts.data) {
			initData(vm);
		} else {
			observe((vm._data = {}));
		}

		// 处理options.computed 计算属性
		if (opts.computed) initComputed$1(vm, opts.computed);

		// 处理 options.watch
		if (opts.watch && opts.watch !== nativeWatch) {
			initWatch(vm, opts.watch);
		}
	}

	function initData(vm) {
		let data = vm.$options.data;
		// 将data 挂载 实例上
		// 判断是不是函数获得值，并获得函数的返回值
		data = vm._data = typeof data === "function" ? getData(data, vm) : data || {};
		if (!isPlainObject(data)) {
			data = {};
			process.env.NODE_ENV !== "production" &&
				warn(
					"data functions should return an object:\n" +
						"https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function",
					vm
				);
		}

		// proxy data on instance
		const keys = Object.keys(data);
		const props = vm.$options.props;
		const methods = vm.$options.methods;
		let i = keys.length;
		while (i--) {
			const key = keys[i];

			// 这里的判断只是为了避免 props，data， method 等数据发生同名冲突问题
			if (process.env.NODE_ENV !== "production") {
				if (methods && hasOwn(methods, key)) ;
			}
			if (props && hasOwn(props, key)) ; else if (!isReserved(key)) {
				// 循环了data的所有属性，映射到vue实例上
				// 就不需要使用app._data.xxx来访问
				// 而是使用app.xxx 来访问
				proxy(vm, `_data`, key);
			}
		}
		// observe data
		observe(data); // 响应式化
	}

	// 初始化computed
	function initComputed$1(vm, computed) {
		// $flow-disable-line
		const watchers = (vm._computedWatchers = Object.create(null));
		// computed properties are just getters during SSR

		for (const key in computed) {
			const userDef = computed[key];
			const getter = typeof userDef === "function" ? userDef : userDef.get;
			if (process.env.NODE_ENV !== "production" && getter == null) {
				warn(`Getter is missing for computed property "${key}".`, vm);
			}
			watchers[key] = new Watcher(
				vm,
				getter || noop,
				noop,
				computedWatcherOptions
			);

			// component-defined computed properties are already defined on the
			// component prototype. We only need to define computed properties defined
			// at instantiation here.
			if (!(key in vm)) {
				// 重点关注这个函数
				defineComputed(vm, key, userDef);
			} else if (process.env.NODE_ENV !== "production") ;
		}
	}

	// 将props属性响应式化
	//  _props 做proxy
	function initProps$1(vm, propsOptions) {
		const propsData = vm.$options.propsData || {};
		const props = (vm._props = {});
		const keys = (vm.$options._propKeys = []);

		for (const key in propsOptions) {
			keys.push(key);
			const value = validateProp(key, propsOptions, propsData, vm);
			defineReactive(props, key, value); // 将属性响应式化

			if (!(key in vm)) {
				proxy(vm, `_props`, key); // 将_props 上的成员 映射到 Vue 实例上
			}
		}
	}

	// 检查名字是否重复
	// method绑定上下文
	function initMethods(vm, methods) {
		const props = vm.$options.props;
		for (const key in methods) {
			// 检查这个method 名字是否已经存在
			if (process.env.NODE_ENV !== "production") {
				if (typeof methods[key] !== "function") ;
				if (props && hasOwn(props, key)) {
					warn(`Method "${key}" has already been defined as a prop.`, vm);
				}
				if (key in vm && isReserved(key)) {
					warn(
						`Method "${key}" conflicts with an existing Vue instance method. ` +
							`Avoid defining component methods that start with _ or $.`
					);
				}
			}
			//  将methods 属性中方法， 绑定上下文后， 挂载 vue 实例上
			vm[key] = methods[key].bind(vm);
		}
	}

	// 这块也不细揪
	// 主要是 是 生成 user watch
	function initWatch(vm, watch) {
		for (const key in watch) {
			const handler = watch[key];
			if (Array.isArray(handler)) {
				for (let i = 0; i < handler.length; i++) {
					createWatcher(vm, key, handler[i]);
				}
			} else {
				createWatcher(vm, key, handler);
			}
		}
	}

	function createWatcher(vm, expOrFn, handler, options) {
		if (isPlainObject(handler)) {
			options = handler;
			handler = handler.handler;
		}
		if (typeof handler === "string") {
			handler = vm[handler];
		}
		// new了 Watcher
		return vm.$watch(expOrFn, handler, options)
	}

	let uid = 0;
	// 在vue原型上挂载_init方法
	function initMixin$1(Vue) {
		Vue.prototype._init = function (options) {
			// 当前vue实例
			const vm = this;
			// 唯一标识
			vm.uid = uid++;
			// merge options
			if (options && options._isComponent) {
				// 是不是一个组件
				// 开始进行源码分析，一般都是使用简单的Vue实例，这里针对组件，暂时略
				initInternalComponent(vm, options);
			} else {
				vm.$options = mergeOptions(
					// mergerOptions 可以简单理解为配置合并
					resolveConstructorOptions(vm.constructor),
					options || {},
					vm
				);
			}

			initLifecycle(vm); // 初始化组件的状态变量
			initEvents(vm); // 初始化事件的容器
			initRender(vm); // 初始化创建元素的方法
			callHook(vm, "beforeCreate"); // 调用生命周期函数
			// 这个不重要 注入器相关
			// initInjections(vm) // resolve injections before data/props // 初始化注入器
			// 这块重要
			initState(vm); // 初始化状态数据 （data，property等）
			// 这个不重要 注入器相关
			// initProvide(vm) // resolve provide after data/props
			callHook(vm, "created"); // 生命周期函数的调用

			if (vm.$options.el) {
				// 在entry-runtime-with-compiler.js挂载的$mount 方法
				vm.$mount(vm.$options.el); // 组件的挂载，将组件挂载el的元素上
				// 先调用 扩展的那个$mount 方法 ，生成render
				// 再调用原始的 $mount 方法， 获得元素，再调用mountComponent 方法
				// 这两个都定义在platform/web里面
			}
		};
	}

	// 这个函数主要将父元素的一些属性挂载到$options上
	function initInternalComponent(vm, options) {
		const opts = (vm.$options = Object.create(vm.constructor.options));
		// doing this because it's faster than dynamic enumeration.
		const parentVnode = options._parentVnode;
		opts.parent = options.parent;
		opts._parentVnode = parentVnode;

		const vnodeComponentOptions = parentVnode.componentOptions;
		opts.propsData = vnodeComponentOptions.propsData;
		opts._parentListeners = vnodeComponentOptions.listeners;
		opts._renderChildren = vnodeComponentOptions.children;
		opts._componentTag = vnodeComponentOptions.tag;

		// 在这里获取render函数
		if (options.render) {
			opts.render = options.render;
			opts.staticRenderFns = options.staticRenderFns;
		}
	}

	// 合并父组件的options
	// 这块不用深入，直接过
	function resolveConstructorOptions(Ctor) {
		let options = Ctor.options;
		if (Ctor.super) {
			const superOptions = resolveConstructorOptions(Ctor.super);
			const cachedSuperOptions = Ctor.superOptions;
			if (superOptions !== cachedSuperOptions) {
				// super option changed,
				// need to resolve new options.
				Ctor.superOptions = superOptions;
				// check if there are any late-modified/attached options (#4976)
				const modifiedOptions = resolveModifiedOptions(Ctor);
				// update base extend options
				if (modifiedOptions) {
					extend(Ctor.extendOptions, modifiedOptions);
				}
				options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
				if (options.name) {
					options.components[options.name] = Ctor;
				}
			}
		}
		return options
	}

	function resolveModifiedOptions(Ctor) {
		let modified;
		const latest = Ctor.options;
		const sealed = Ctor.sealedOptions;
		for (const key in latest) {
			if (latest[key] !== sealed[key]) {
				if (!modified) modified = {};
				modified[key] = latest[key];
			}
		}
		return modified
	}

	function Vue(option) {
		if (!(this instanceof Vue)) console.log("Vue 必须是被new出来的");
		this._init(option);
	}

	initMixin$1(Vue); // 挂载初始化方法（_init）
	stateMixin(Vue); // 挂载状态处理方法
	eventsMixin(Vue); // 挂载事件的方法
	lifecycleMixin(Vue); // 挂载节点更新,强制更新,销毁的方法
	renderMixin(Vue); // 挂载与渲染有关的方法

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
			this.options = mergeOptions$1(this.options, mixin);
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
			Sub.options = mergeOptions$1(Super.options, extendOptions);
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
