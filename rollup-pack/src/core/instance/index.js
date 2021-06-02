import { initMixin } from "./init"
import { stateMixin } from "./state"
import { renderMixin } from "./render"
import { eventsMixin } from "./events"
import { lifecycleMixin } from "./lifecycle"

function Vue(option) {
	if (!(this instanceof Vue)) console.log("Vue 必须是被new出来的")
	this._init(option)
}

initMixin(Vue) // 挂载初始化方法（_init）
stateMixin(Vue) // 挂载状态处理方法
eventsMixin(Vue) // 挂载事件的方法
lifecycleMixin(Vue) // 挂载节点更新,强制更新,销毁的方法
renderMixin(Vue) // 挂载与渲染有关的方法

export default Vue
