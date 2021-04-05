const Tool = {
    options: {
        scale: 10
    },
    Monitor: class {
        constructor() {
            this.id = new Date().getTime();
            this.element = document.createElement("div");
            this.element.classList.add("monitor");
            this.element.addEventListener("click", event => {
                event.preventDefault();
                this.active = !this.active;
            });
            this.active = true;
            this.canvas = document.createElement("canvas");
            this.element.appendChild(this.canvas);
            this.label = document.createElement("p");
            this.element.appendChild(this.label);
            document.getElementById("preview").appendChild(this.element);
            this.position = [0, 0];
            this.size = [16, 9];
            Tool.monitors.push(this);
            Tool.monitors.forEach(e => e.refresh());
        }
        refresh() {
            this.label.innerText = Tool.monitors.findIndex(e => e.id === this.id) + 1;
            if (this.active) {
                let properties = document.forms[0];
                [properties.elements["actual-width"].value, properties.elements["actual-height"].value] = this.size;
                [properties.elements["actual-x"].value, properties.elements["actual-y"].value] = this.position;
            }
            if (Tool.wallpaper !== null) {
                [this.canvas.width, this.canvas.height] = [this.size[0] * Tool.calibration.getPixelsPerInch()[0], this.size[1] * Tool.calibration.getPixelsPerInch()[1]];
                let ctx = this.canvas.getContext("2d");
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                ctx.drawImage(Tool.wallpaper,
                    Tool.wallpaper.width / 2 - (this.size[0] * Tool.calibration.getPixelsPerInch()[0]) / 2 + this.position[0] * Tool.calibration.getPixelsPerInch()[0],
                    Tool.wallpaper.height / 2 - (this.size[1] * Tool.calibration.getPixelsPerInch()[1]) / 2 - this.position[1] * Tool.calibration.getPixelsPerInch()[1],
                    this.canvas.width, this.canvas.height,
                    0, 0, this.canvas.width, this.canvas.height
                )
            }
        }
        get active() {
            return this.element.classList.contains("active");
        }
        set active(value) {
            let properties = document.forms[0];
            if (value === true) {
                Tool.monitors.forEach(e => e.active = false);
                properties.hidden = false;
                properties.dataset.monitor = this.id;  
                [properties.elements["actual-width"].value, properties.elements["actual-height"].value] = this.size;
                [properties.elements["actual-x"].value, properties.elements["actual-y"].value] = this.position;         
                this.element.classList.add("active");
                document.getElementById("help").hidden = true;
                document.forms[1].hidden = true;
            } else {
                properties.hidden = true;
                properties.dataset.monitor = -1;
                this.element.classList.remove("active");
            }
        }
        get position() {
            return [Number(this.element.style.marginLeft.slice(0, -2)) / Tool.options.scale / 2 || 0, Number(- this.element.style.marginTop.slice(0, -2)) / Tool.options.scale / 2 || 0];
        }
        set position([x, y]) {
            this.element.style.marginLeft = x * Tool.options.scale * 2 + "px";
            this.element.style.marginTop = -y * Tool.options.scale * 2 + "px";
            this.refresh();
        }
        get size() {
            return [Number(this.element.style.width.slice(0, -2)) / Tool.options.scale || 0, Number(this.element.style.height.slice(0, -2)) / Tool.options.scale || 0];
        }
        set size([x, y]) {
            this.element.style.width = x * Tool.options.scale + "px";
            this.element.style.height = y * Tool.options.scale + "px";
            this.refresh();
        }
        destruct() {
            this.active = false;
            Tool.monitors.splice(Tool.monitors.findIndex(e => e.id === this.id), 1);
            this.element.parentElement.removeChild(this.element);
            Tool.monitors.forEach(e => e.refresh());
        }
    },
    monitors: [],
    calibrate: () => {
        Tool.monitors.forEach(e => e.active = false);
        let calibration = document.forms[1];
        document.getElementById("help").hidden = true;
        calibration.hidden = false;
    },
    calibration: {
        actual: [0, 0],
        virtual: [0, 0],
        getPixelsPerInch() {
            return [this.virtual[0] / this.actual[0], this.virtual[1] / this.actual[1]]
        }
    },
    wallpaper: null,
    logger: {
        info: (message) => {
            document.getElementsByName("message")[0].style.color = "#000";
            document.getElementsByName("message")[0].innerText = message;
        },
        error: (message) => {
            document.getElementsByName("message")[0].style.color = "#e10000";
            document.getElementsByName("message")[0].innerText = message;
        },
        warn: (message) => {
            document.getElementsByName("message")[0].style.color = "#f29900";
            document.getElementsByName("message")[0].innerText = message;
        },
    },
    init: () => {
        let properties = document.forms[0];
        let calibration = document.forms[1];
        document.getElementsByName("help")[0].addEventListener("click", event => {
            Tool.monitors.forEach(e => e.active = false);
            calibration.hidden = true;
            document.getElementById("help").hidden = false;
        });
        document.getElementsByName("add-monitor")[0].addEventListener("click", event => {
            if (Tool.calibration.getPixelsPerInch().join() === "NaN,NaN") {
                Tool.logger.error("Please calibrate first.")
            } else {
                new Tool.Monitor();
            }
        });
        document.getElementsByName("remove-monitor")[0].addEventListener("click", event => {
            let id = properties.dataset.monitor;
            if (id == -1) {
                Tool.logger.error("Please select a monitor to delete.")
            } else {
                Tool.monitors.find(e => e.id == id).destruct();
            }
        });
        document.getElementsByName("calibration")[0].addEventListener("click", event => {
            Tool.calibrate();
        });
        document.getElementsByName("wallpaper")[0].addEventListener("click", event => {
            try {
                event.target.querySelector("input").click();
            } catch (e) { }
        });
        document.getElementsByName("wallpaper")[0].querySelector("input").addEventListener("change", event => {
            let image = new Image();
            image.onload = () => {
                Tool.wallpaper = image;
                Tool.monitors.forEach(e => e.refresh());
            }
            image.onerror = () => {
                Tool.logger.error("The provided file couldn't be loaded.");
            }
            image.src = URL.createObjectURL(event.target.files[0]);
        });
        calibration.addEventListener("submit", event => {
            Tool.calibration.actual = [calibration.elements["actual-width"].value, calibration.elements["actual-height"].value];
            Tool.calibration.virtual = [calibration.elements["virtual-width"].value, calibration.elements["virtual-height"].value];
            calibration.hidden = true;
            if (Tool.monitors.length === 0) {
                let monitor = new Tool.Monitor();
                monitor.size = Tool.calibration.actual;
            }
        });
        properties.elements["actual-height"].addEventListener("change", event => {
            let id = properties.dataset.monitor;
            if (id == -1) return;
            let monitor = Tool.monitors.find(e => e.id == id);
            monitor.size = [monitor.size[0], event.target.value];
        });
        properties.elements["actual-width"].addEventListener("change", event => {
            let id = properties.dataset.monitor;
            if (id == -1) return;
            let monitor = Tool.monitors.find(e => e.id == id);
            monitor.size = [event.target.value, monitor.size[1]];
        });
        properties.elements["actual-x"].addEventListener("change", event => {
            let id = properties.dataset.monitor;
            if (id == -1) return;
            let monitor = Tool.monitors.find(e => e.id == id);
            monitor.position = [event.target.value, monitor.position[1]];
        });
        properties.elements["actual-y"].addEventListener("change", event => {
            let id = properties.dataset.monitor;
            if (id == -1) return;
            let monitor = Tool.monitors.find(e => e.id == id);
            monitor.position = [monitor.position[0], event.target.value];
        });
    }
}

Tool.init();