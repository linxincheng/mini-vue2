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
