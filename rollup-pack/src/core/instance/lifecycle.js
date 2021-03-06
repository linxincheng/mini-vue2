import { createEmptyVNode } from "../vdom/vnode"
import Watcher from "../observer/watcher"
import { pushTarget, popTarget } from "../observer/dep"

import { noop } from "../util/index"

export let activeInstance = null

export function setActiveInstance(vm) {
	const prevActiveInstance = activeInstance
	activeInstance = vm
	return () => {
		activeInstance = prevActiveInstance
	}
}

export function initLifecycle(vm) {
	const options = vm.$options

	// locate first non-abstract parent
	let parent = options.parent
	// 给所有祖先组件的$children增加vm实例
	if (parent && !options.abstract) {
		while (parent.$options.abstract && parent.$parent) {
			parent = parent.$parent
		}
		parent.$children.push(vm)
	}

	// 以下是增加初始化属性
	vm.$parent = parent
	vm.$root = parent ? parent.$root : vm

	vm.$children = []
	vm.$refs = {}

	vm._watcher = null
	vm._inactive = null
	vm._directInactive = false
	vm._isMounted = false
	vm._isDestroyed = false
	vm._isBeingDestroyed = false
}

// 挂载Vue原型上_update 方法
export function lifecycleMixin(Vue) {
	Vue.prototype._update = function (vnode) {
		const vm = this

		const prevEl = vm.$el
		const prevVnode = vm._vnode

		// 设置当前活动的vue实例
		// 相当于执行栈
		const restoreActiveInstance = setActiveInstance(vm)
		vm._vnode = vnode

		// Vue.prototype.__patch__ 在入口点注入
		if (!prevVnode) {
			// 首次渲染
			vm.$el = vm.__patch__(vm.$el, vnode, false /* removeOnly */)
		} else {
			// 更新
			vm.$el = vm.__patch__(prevVnode, vnode)
		}

		// 更新完之后设置恢复为之前的vue实例
		restoreActiveInstance()

		// update __vue__ reference 到时候可以被GC
		if (prevEl) {
			prevEl.__vue__ = null
		}
		if (vm.$el) {
			vm.$el.__vue__ = vm
		}
	}

	Vue.prototype.$forceUpdate = function () {}

	Vue.prototype.$destroy = function () {}
}

// 挂载组件
export const mountComponent = function (vm, el) {
	vm.$el = el
	// 如果没有render fn
	// 先将render fn设置为 创建空的vnode
	if (!vm.$options.render) {
		vm.$options.render = createEmptyVNode
	}

	callHook(vm, "beforeMount")

	let updateComponent = () => {
		// _render 用来生成虚拟DOM
		// _update 内部调用patch 方法 将虚拟DOM与真实的DOM同步（diff）
		vm._update(vm._render())
	}

	new Watcher(
		vm,
		updateComponent,
		noop, // 非 user watcher:callback 为空函数
		{
			before() {
				if (vm._isMounted && !vm._isDestroyed) {
					callHook(vm, "beforeUpdate")
				}
			},
		},
		true /* is Render Watcher */
	)
}

export function callHook(vm, hook) {
	pushTarget()
	const handlers = vm.$options[hook]
	const info = `${hook} hook`
	if (handlers) {
		for (let i = 0, j = handlers.length; i < j; i++) {
			// invoke hook
			// invokeWithErrorHandling(handlers[i], vm, null, vm, info);
		}
	}
	if (vm._hasHookEvent) {
		vm.$emit("hook:" + hook)
	}
	popTarget()
}
