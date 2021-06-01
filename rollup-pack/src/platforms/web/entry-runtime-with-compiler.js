/* @flow */
//  入口文件
import Vue from "web/runtime/index"
import { query } from "./util"

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
		}
	}
}

function getOuterHTML(el) {
	if (el.outerHTML) {
		return el.outerHTML
	} else {
		const container = document.createElement("div")
		container.appendChild(el.cloneNode(true))
		return container.innerHTML
	}
}

export default Vue
