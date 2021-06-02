export default class VNode {
	tag
	data
	children
	text
	context //rendered in this component's scope

	constructor(tag, data, children, text, context) {
		this.tag = tag
		this.data = data
		this.children = children
		this.text = text
		this.context = context
	}
}
export const createEmptyVNode = (text = "") => {
	const node = new VNode()
	node.text = text
	node.isComment = true
	return node
}
