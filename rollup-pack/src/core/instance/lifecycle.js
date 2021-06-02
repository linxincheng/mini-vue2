import { createEmptyVNode } from "../vdom/vnode"
import Watcher from "../observer/watcher"

import { noop } from "../util/index"

export let activeInstance = null

export function setActiveInstance(vm) {
	const prevActiveInstance = activeInstance
	activeInstance = vm
	return () => {
		activeInstance = prevActiveInstance
	}
}

export function lifrcycleMixin(Vue) {
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
