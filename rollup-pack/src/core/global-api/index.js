import { initUse } from "./use"
import { initMixin } from "./mixin"
import { initExtend } from "./extend"
import { initAssetRegisters } from "./assets"

import { set, del } from "../observer/index"
import { defineReactive } from "../util/index"

export function initGlobalAPI(Vue) {
	// 设置只读 config
	const configDef = {}
	configDef.get = () => config
	Object.defineProperty(Vue, "config", configDef)

	// 增加Vue util上 def 能力
	Vue.util = {
		defineReactive,
	}

	// 增加 Vue set del nextTick 能力
	Vue.set = set
	Vue.delete = del
	// Vue.nextTick = nextTick

	Vue.options = Object.create(null)

	Vue.options._base = Vue

	initUse(Vue)
	initMixin(Vue)
	initExtend(Vue)
	initAssetRegisters(Vue)
}
