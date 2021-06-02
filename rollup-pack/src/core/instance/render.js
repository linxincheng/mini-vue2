// 挂载nextick 和 _render方法
export function renderMixin(Vue) {
	Vue.prototype.$nextTick = function (fn) {
		return procss.nextTick(fn, this)
	}

	Vue.prototype._render = function () {}
}
