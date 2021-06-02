import { toArray } from "../util/index"

export function initUse(Vue) {
	Vue.use = function (plugin) {
		// 已经被安装的插件会在Vue._installedPlugins找到
		const installedPlugins =
			this._installedPlugins || (this._installedPlugins = [])

		// 如果已经安装直接返回
		if (installedPlugins.indexOf(plugin) > -1) {
			return this
		}

		// additional parameters
		const args = toArray(arguments, 1)
		args.unshift(this)

		// 如果有install方法就执行
		// 插件的初始化就在这儿
		if (typeof plugin.install === "function") {
			plugin.install.apply(plugin, args)
		} else if (typeof plugin === "function") {
			plugin.apply(null, args)
		}
		installedPlugins.push(plugin)
		return this
	}
}
