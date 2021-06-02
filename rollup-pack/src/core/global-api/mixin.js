import { mergeOptions } from "../util/index"

export function initMixin(Vue) {
	// vue 的mixin 逻辑很简单就是option合并
	Vue.mixin = function (mixin) {
		this.options = mergeOptions(this.options, mixin)
		return this
	}
}
