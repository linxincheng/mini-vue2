import { mergeOptions } from "../util/index"

export function initExtend(Vue) {
	Vue.cid = 0
	let cid = 1

	// 初始化组件
	// 拿到全局的被指
	Vue.extend = function (extendOptions) {
		const Super = this
		const SuperId = Super.cid // 拿到组件cid，第一次加载时undefined
		const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
		// 缓存有就访问缓存
		if (cachedCtors[SuperId]) {
			return cachedCtors[SuperId]
		}

		const name = extendOptions.name || Super.options.name
		// 这儿会校验下name属性，具体实现略...
		if (name) {
			// validateComponentName(name)
		}

		const Sub = function VueComponent(options) {
			this._init(options)
		}
		Sub.prototype = Object.create(Super.prototype)
		Sub.prototype.constructor = Sub
		Sub.cid = cid++
		Sub.options = mergeOptions(Super.options, extendOptions)
		Sub["super"] = Super

		if (Sub.options.props) {
			// 设置访问 proxy，可以this.xxx 访问到this._props.xxx
			initProps(Sub) // initProps方法的源码我不导入了
		}
		//
		if (Sub.options.computed) {
			// 创建computed watcher
			initComputed(Sub) // initComputed方法的源码我不导入了
		}
	}
}
