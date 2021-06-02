/* @flow */
//  入口文件
import Vue from "web/runtime/index"
import { query } from "./util"
import { cached } from "core/util/index"

// 是用来生成 render 的工具方法
import { compileToFunctions } from "./compiler/index"

const idToTemplate = cached((id) => {
	const el = query(id)
	return el && el.innerHTML
})

const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (el) {
	el = el && query(el)

	const options = this.$options

	/**
	 * 获取模板
	 * 生成 render 函数
	 */
	if (!options.render) {
		let template = options.template
		if (template) {
			if (typeof template === "string") {
				if (template.charAt(0) !== "#") console.log("警告下")
				template = idToTemplate(template)
			} else if (template.nodeType) {
				//这是走.vue 文件的模板渲染
				template = template.innerHTML
			} else {
				return this
			}
		} else if (el) {
			template = getOuterHTML(el)
		}

		if (template) {
			// 模板转 render 函数
			const { render, staticRenderFns } = compileToFunctions(template, this)

			// 将 render fn  放到组件的option上
			options.render = render
			options.staticRenderFns = staticRenderFns
		}
	}

	return mount.call(this, el)
}

// 获取 外部 dom标签
function getOuterHTML(el) {
	if (el.outerHTML) {
		return el.outerHTML
	} else {
		const container = document.createElement("div")
		container.appendChild(el.cloneNode(true))
		return container.innerHTML
	}
}

Vue.compile = compileToFunctions

export default Vue
