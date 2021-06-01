// import Vue from "core/index"
function Vue() {}
import { patch } from "./patch"
Vue.prototype.__patch__ = patch

export default Vue
