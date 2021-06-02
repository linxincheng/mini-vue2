import { ASSET_TYPES } from "shared/constants"

export function initAssetRegisters(Vue) {
	// [
	//    'component',
	//    'directive',
	//    'filter'
	// ]
	// 创建注册方法
	// options 里的 components, directives, filters
	ASSET_TYPES.forEach((type) => {
		Vue[type] = function (id, definition) {
			if (!definition) {
				return this.options[type + "s"][id]
			} else {
				if (type === "component") {
					// 校验名称
					// validateComponentName(id)
				}
				if (type === "component") {
					definition.name = definition.name || id
					definition = this.options._base.extend(definition)
				}
				if (type === "directive" && typeof definition === "function") {
					definition = { bind: definition, update: definition }
				}
				this.options[type + "s"][id] = definition
				return definition
			}
		}
	})
}
