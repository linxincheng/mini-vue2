import { observe, defineReactive } from "../observer/index"

// 设置一些属性访问
// 在原型上挂载 $watch 方法
export function stateMixin(Vue) {
	// 设置默认proxy
	const dataDef = {}
	dataDef.get = function () {
		return this._data
	}
	const propsDef = {}
	propsDef.get = function () {
		return this._props
	}

	// 设置访问 $data 访问到 _data
	// 设置访问 $props 访问到 _props
	// 一般 $ 开头都是内部只读属性, _ 开头是内部可读可写
	Object.defineProperty(Vue.prototype, "$data", dataDef)
	Object.defineProperty(Vue.prototype, "$props", propsDef)

	// 这块先过. 等等回来写
	// Vue.prototype.$set = set;
	// Vue.prototype.$delete = del;

	Vue.prototype.$watch = function (expOrFn, cb, options) {}
}

export function initState(vm) {
	vm._watchers = []
	const opts = vm.$options
	// 处理options.props的成员, 一般定义组件的时候， 用于定义对外的成员
	if (opts.props) initProps(vm, opts.props)

	// 处理options.method的成员，处理方法成员
	if (opts.methods) initMethods(vm, opts.methods)

	// 处理options.data (响应式)
	if (opts.data) {
		initData(vm)
	} else {
		observe((vm._data = {}), true /* asRootData */)
	}

	// 处理options.computed 计算属性
	if (opts.computed) initComputed(vm, opts.computed)

	// 处理 options.watch
	if (opts.watch && opts.watch !== nativeWatch) {
		initWatch(vm, opts.watch)
	}
}

function initData(vm) {
	let data = vm.$options.data
	// 将data 挂载 实例上
	// 判断是不是函数获得值，并获得函数的返回值
	data = vm._data = typeof data === "function" ? getData(data, vm) : data || {}
	if (!isPlainObject(data)) {
		data = {}
		process.env.NODE_ENV !== "production" &&
			warn(
				"data functions should return an object:\n" +
					"https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function",
				vm
			)
	}

	// proxy data on instance
	const keys = Object.keys(data)
	const props = vm.$options.props
	const methods = vm.$options.methods
	let i = keys.length
	while (i--) {
		const key = keys[i]

		// 这里的判断只是为了避免 props，data， method 等数据发生同名冲突问题
		if (process.env.NODE_ENV !== "production") {
			if (methods && hasOwn(methods, key)) {
				// warn(
				//   `Method "${key}" has already been defined as a data property.`,
				//   vm
				// );
			}
		}
		if (props && hasOwn(props, key)) {
			// process.env.NODE_ENV !== "production" &&
			// warn(
			//   `The data property "${key}" is already declared as a prop. ` +
			//     `Use prop default value instead.`,
			//   vm
			// );
		} else if (!isReserved(key)) {
			// 循环了data的所有属性，映射到vue实例上
			// 就不需要使用app._data.xxx来访问
			// 而是使用app.xxx 来访问
			proxy(vm, `_data`, key)
		}
	}
	// observe data
	observe(data, true /* asRootData */) // 响应式化
}

// 初始化computed
function initComputed(vm, computed) {
	// $flow-disable-line
	const watchers = (vm._computedWatchers = Object.create(null))
	// computed properties are just getters during SSR

	for (const key in computed) {
		const userDef = computed[key]
		const getter = typeof userDef === "function" ? userDef : userDef.get
		if (process.env.NODE_ENV !== "production" && getter == null) {
			warn(`Getter is missing for computed property "${key}".`, vm)
		}
		watchers[key] = new Watcher(
			vm,
			getter || noop,
			noop,
			computedWatcherOptions
		)

		// component-defined computed properties are already defined on the
		// component prototype. We only need to define computed properties defined
		// at instantiation here.
		if (!(key in vm)) {
			// 重点关注这个函数
			defineComputed(vm, key, userDef)
		} else if (process.env.NODE_ENV !== "production") {
			// 检查是不是重复名字了
			// if (key in vm.$data) {
			//   // warn(`The computed property "${key}" is already defined in data.`, vm);
			// } else if (vm.$options.props && key in vm.$options.props) {
			//   // warn(
			//   //   `The computed property "${key}" is already defined as a prop.`,
			//   //   vm
			//   // );
			// } else if (vm.$options.methods && key in vm.$options.methods) {
			//   // warn(
			//   //   `The computed property "${key}" is already defined as a method.`,
			//   //   vm
			//   // );
			// }
		}
	}
}

// 将props属性响应式化
//  _props 做proxy
function initProps(vm, propsOptions) {
	const propsData = vm.$options.propsData || {}
	const props = (vm._props = {})
	const keys = (vm.$options._propKeys = [])

	for (const key in propsOptions) {
		keys.push(key)
		const value = validateProp(key, propsOptions, propsData, vm)
		defineReactive(props, key, value) // 将属性响应式化

		if (!(key in vm)) {
			proxy(vm, `_props`, key) // 将_props 上的成员 映射到 Vue 实例上
		}
	}
}

// 检查名字是否重复
// method绑定上下文
function initMethods(vm, methods) {
	const props = vm.$options.props
	for (const key in methods) {
		// 检查这个method 名字是否已经存在
		if (process.env.NODE_ENV !== "production") {
			if (typeof methods[key] !== "function") {
				// warn(
				//   `Method "${key}" has type "${typeof methods[
				//     key
				//   ]}" in the component definition. ` +
				//     `Did you reference the function correctly?`,
				//   vm
				// );
			}
			if (props && hasOwn(props, key)) {
				warn(`Method "${key}" has already been defined as a prop.`, vm)
			}
			if (key in vm && isReserved(key)) {
				warn(
					`Method "${key}" conflicts with an existing Vue instance method. ` +
						`Avoid defining component methods that start with _ or $.`
				)
			}
		}
		//  将methods 属性中方法， 绑定上下文后， 挂载 vue 实例上
		vm[key] = methods[key].bind(vm)
	}
}

// 这块也不细揪
// 主要是 是 生成 user watch
function initWatch(vm, watch) {
	for (const key in watch) {
		const handler = watch[key]
		if (Array.isArray(handler)) {
			for (let i = 0; i < handler.length; i++) {
				createWatcher(vm, key, handler[i])
			}
		} else {
			createWatcher(vm, key, handler)
		}
	}
}

function createWatcher(vm, expOrFn, handler, options) {
	if (isPlainObject(handler)) {
		options = handler
		handler = handler.handler
	}
	if (typeof handler === "string") {
		handler = vm[handler]
	}
	// new了 Watcher
	return vm.$watch(expOrFn, handler, options)
}
