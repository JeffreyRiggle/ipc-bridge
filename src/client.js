import {EventEmitter} from 'events';

let ipcRenderer;
let subscriptions = new Map();
let cid = 1;
let available = false;

if (window.require) {
    const electron = window.require('electron');
    ipcRenderer = electron.ipcRenderer;
}

function setupIPCBridge(callback) {
    ipcRenderer.on('heartbeat', () => {
        available = true;
        callback();
    });

    ipcRenderer.send('healthcheck');
}

function handleEvent(event) {
    return (sender, message) => {
        let subs = subscriptions.get(event);

        if (!subs) {
            return;
        }

        subs.forEach(subscription => {
            subscription(message);
        });
    }
}

class Client extends EventEmitter {
    constructor() {
        super();

        if (ipcRenderer) {
            setupIPCBridge(() => {
                this.emit(this.availableChanged, true);
            });
        }
    }

    get availableChanged() {
        return 'availableChanged';
    }

    sendMessage(event, message) {
        return new Promise((resolve, reject) => {
            if (!available) {
                reject('IPC Service not available');
                return;
            }
    
            let corid = cid++;
            const cbevent = `cid${corid}`;
            ipcRenderer.on(cbevent, (event, data) => {
                ipcRenderer.off(cbevent);
                resolve(data);
            });
    
            ipcRenderer.send('request', {
                id: event, 
                data: message,
                correlationId: corid
            });
        });
    }

    subscribeEvent(event, callback) {
        if (!available) {
            return;
        }

        let sub = subscriptions.get(event);

        if (!sub) {
            ipcRenderer.on(event, handleEvent(event).bind(this));
            subscriptions.set(event, [callback]);
        }
        else {
            sub.push(callback);
        }

        ipcRenderer.send('subscribe', event);
    }

    unsubcribeEvent(event, callback) {
        if (!this.available) {
            return;
        }

        let sub = subscriptions.get(event);

        if (!sub) {
            return;
        }

        let ind = sub.indexOf(callback);

        if (ind !== -1) {
            sub.splice(ind, 1);
        }

        if (sub.length !== 0) {
            return;
        }

        subscriptions.delete(event);
        ipcRenderer.removeListener(event, callback);
        ipcRenderer.send('unsubscribe', event);
    }
}

export default new Client();