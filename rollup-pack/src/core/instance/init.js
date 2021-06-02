import { initLifecycle, callHook } from "./lifecycle"
import { initEvents } from "./events"
import { initRender } from "./render"
import { initState } from "./state"

let uid = 0
// 在vue原型上挂载_init方法
export function initMixin(Vue) {
	Vue.prototype._init = function (options) {
		// 当前vue实例
		const vm = this
		// 唯一标识
		vm.uid = uid++
		// merge options
		if (options && options._isComponent) {
			// 是不是一个组件
			// 开始进行源码分析，一般都是使用简单的Vue实例，这里针对组件，暂时略
			initInternalComponent(vm, options)
		} else {
			vm.$options = mergeOptions(
				// mergerOptions 可以简单理解为配置合并
				resolveConstructorOptions(vm.constructor),
				options || {},
				vm
			)
		}

		initLifecycle(vm) // 初始化组件的状态变量
		initEvents(vm) // 初始化事件的容器
		initRender(vm) // 初始化创建元素的方法
		callHook(vm, "beforeCreate") // 调用生命周期函数
		// 这个不重要 注入器相关
		// initInjections(vm) // resolve injections before data/props // 初始化注入器
		// 这块重要
		initState(vm) // 初始化状态数据 （data，property等）
		// 这个不重要 注入器相关
		// initProvide(vm) // resolve provide after data/props
		callHook(vm, "created") // 生命周期函数的调用

		if (vm.$options.el) {
			vm.$mount(vm.$options.el) // 组件的挂载，将组件挂载el的元素上
			// 先调用 扩展的那个$mount 方法 ，生成render
			// 再调用原始的 $mount 方法， 获得元素，再调用mountComponent 方法
			// 这两个都定义在platform/web里面
		}
	}
}

// 这个函数主要将父元素的一些属性挂载到$options上
export function initInternalComponent(vm, options) {
	const opts = (vm.$options = Object.create(vm.constructor.options))
	// doing this because it's faster than dynamic enumeration.
	const parentVnode = options._parentVnode
	opts.parent = options.parent
	opts._parentVnode = parentVnode

	const vnodeComponentOptions = parentVnode.componentOptions
	opts.propsData = vnodeComponentOptions.propsData
	opts._parentListeners = vnodeComponentOptions.listeners
	opts._renderChildren = vnodeComponentOptions.children
	opts._componentTag = vnodeComponentOptions.tag

	// 在这里获取render函数
	if (options.render) {
		opts.render = options.render
		opts.staticRenderFns = options.staticRenderFns
	}
}

// 合并父组件的options
// 这块不用深入，直接过
export function resolveConstructorOptions(Ctor) {
	let options = Ctor.options
	if (Ctor.super) {
		const superOptions = resolveConstructorOptions(Ctor.super)
		const cachedSuperOptions = Ctor.superOptions
		if (superOptions !== cachedSuperOptions) {
			// super option changed,
			// need to resolve new options.
			Ctor.superOptions = superOptions
			// check if there are any late-modified/attached options (#4976)
			const modifiedOptions = resolveModifiedOptions(Ctor)
			// update base extend options
			if (modifiedOptions) {
				extend(Ctor.extendOptions, modifiedOptions)
			}
			options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
			if (options.name) {
				options.components[options.name] = Ctor
			}
		}
	}
	return options
}

function resolveModifiedOptions(Ctor) {
	let modified
	const latest = Ctor.options
	const sealed = Ctor.sealedOptions
	for (const key in latest) {
		if (latest[key] !== sealed[key]) {
			if (!modified) modified = {}
			modified[key] = latest[key]
		}
	}
	return modified
}
