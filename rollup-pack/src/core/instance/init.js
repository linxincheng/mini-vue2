// 在vue原型上挂载_init方法
export function initMixin(Vue) {
	Vue.prototype._init = function (options) {}
}
