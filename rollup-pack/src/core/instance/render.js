import { createElement } from "../vdom/create-element"

// 初始化创建元素的方法
export function initRender(vm) {
	vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false) // 系统创建元素的方法
	vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true) // 用户提供了render 属性时创建元素的方法
}

// 挂载nextick 和 _render方法
export function renderMixin(Vue) {
	Vue.prototype.$nextTick = function (fn) {
		return procss.nextTick(fn, this)
	}

	Vue.prototype._render = function () {}
}
