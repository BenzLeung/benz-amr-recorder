let WORKER_ENABLED = !!(window && window.URL && window.Blob && window.Worker);

function InlineWorker(func, self) {
    let _this = this;
    let functionBody;

    self = self || {};

    if (WORKER_ENABLED) {
        functionBody = func.toString().trim().match(
            /^function\s*\w*\s*\([\w\s,]*\)\s*{([\w\W]*?)}$/
        )[1];

        return new window.Worker(window.URL.createObjectURL(
            new window.Blob([ functionBody ], { type: "text/javascript" })
        ));
    }

    function postMessage(data) {
        setTimeout(function() {
            _this.onmessage({ data: data });
        }, 0);
    }

    this.self = self;
    this.self.postMessage = postMessage;

    setTimeout(func.bind(self, self), 0);
}

InlineWorker.prototype.postMessage = function postMessage(data) {
    let _this = this;

    setTimeout(function() {
        _this.self.onmessage({ data: data });
    }, 0);
};

export default InlineWorker;
