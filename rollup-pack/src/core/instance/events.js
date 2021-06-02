export function initEvents(vm) {
	vm._events = Object.create(null)
	// 初始化父组件的事件
	const listeners = vm.$options._parentListeners
	if (listeners) {
		// 略
		updateComponentListeners(vm, listeners)
	}
}

// 可以理解为 实例增加 $no $off $once
export function updateComponentListeners(vm, listeners) {
	// target = vm
	// updateListeners(listeners, {}, add, remove, createOnceHandler, vm)
	// target = undefined
}

// 在原型上挂载 事件模型 on, once, off, emit
export function eventsMixin(Vue) {
	Vue.prototype.$on = function () {}
	Vue.prototype.$once = function () {}
	Vue.prototype.$off = function () {}
	Vue.prototype.$emit = function () {}
}
