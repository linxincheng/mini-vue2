class Dep {
    constructor() {
        this.sub = []; // 存储的是与 当前Dep 关联的watcher
    }

    /* 增加一个watcher */
    addSub(sub) {

    }

    /** 移除 */
    removeSub(sub) {

    }

    /**将当前的Dep 与当前的watcher （暂时渲染watcher）关联 */
    depend() {

    }

    /**触发与之关联的watcher的update 方法，起到更新的作用 */
    notify () {
        // 在真实的Vue中依次触发 this.subs 中的watcher 的 update 方法
        if(Dep.target) {
            Dep.target.update();
        }
    }
}

// 全局的容器存储渲染 Watcher
// let globalWatcher
Dep.target = null;

