// 在原型上挂载 事件模型 on, once, off, emit
export function eventsMixin(Vue) {
	Vue.prototype.$on = function () {}
	Vue.prototype.$once = function () {}
	Vue.prototype.$off = function () {}
	Vue.prototype.$emit = function () {}
}
