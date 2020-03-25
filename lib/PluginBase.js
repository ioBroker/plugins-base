const NamespaceLogger = require('./NamespaceLogger');

/**
 * Base class for ioBroker Plugins
 */
class PluginBase {

    /**
     * Constructor for Plugin class
     * This method is called by js-controller/adapter process internally when initializing the plugin.
     *
     * @param settings {object} object with configuration:
     *                  {
     *                      pluginScope: 'adapter', // or 'controller'
     *                      pluginNamespace: 'system.adapter.myname.0.plugins.name', // or 'system.host.name.plugins.name'
     *                      pluginLogNamespace: 'myname.0 Plugin Name',
     *                      log: {...}, // logger object
     *                      iobrokerConfig: {...}, // ioBroker configuration
     *                      parentPackage: {...} // package.json from "parent" which uses the plugin (adapter/controller)
     *                  }
     */
    constructor(settings) {
        this.pluginScope = settings.pluginScope; // 'adapter' or 'controller' depending where included
        this.pluginNamespace = settings.pluginNamespace; // e.g. "system.adapter.name.instance.plugins.name" or "system.host.name.name"
        this.log = new NamespaceLogger(settings.pluginLogNamespace, settings.log);
        this.iobrokerConfig = settings.iobrokerConfig;
        this.parentPackage = settings.parentPackage || {};

        this.objectsDb = null;
        this.statesDb = null;

        this.isActive = false;

        this.SCOPES = {
            'ADAPTER': 'adapter',
            'CONTROLLER': 'controller'
        };
    }

    /**
     * Method for Plugin developer to initialize his Plugin
     *
     * @param pluginConfig {object} plugin configuration from config files
     * @param callback {function} callback when done, signature "(err, initSuccessful)". On err or initSuccessful===false the plugin instance will be discarded
     */
    init(pluginConfig, callback) {
        // Implement in your Plugin instance if needed
        callback('Not implemented');
    }

    /**
     * Method which is called on a clean end of the process to pot. clean up used resources
     *
     * @return {boolean} true/false depending on if exit was successful/is supported
     */
    destroy() {
        // Implement in your Plugin instance if needed
        return true;
    }

    /**
     * Get a State from State DB
     *
     * @param id {string} id of state to retrieve
     * @param callback {function} function to be called with the result. Signature for callback is (err, state)
     */
    getState(id, callback) {
        if (!this.statesDb) {
            throw new Error('States Database not initialized.');
        }
        return void this.statesDb.getState(id, callback);
    }

    /**
     * Set a State in State DB
     *
     * @param id {string} id of state to set
     * @param callback {function} function to be called with the result. Signature for callback is (err, id)
     */
    setState(id, state, callback) {
        if (!this.statesDb) {
            throw new Error('States Database not initialized.');
        }
        return void this.statesDb.setState(id, state, callback);
    }

    /**
     * Get an Object from Objects DB
     *
     * @param id {string} id of object to retrieve
     * @param callback {function} function to be called with the result. Signature for callback is (err, obj)
     */
    getObject(id, callback) {
        if (!this.objectsDb) {
            throw new Error('Objects Database not initialized.');
        }
        return void this.objectsDb.getObject(id, callback);
    }

    /**
     * Set an Object in Objects DB
     *
     * @param id {string} id of object to set
     * @param callback {function} function to be called with the result. Signature for callback is (err, {id})
     */
    setObject(id, obj, callback) {
        if (!this.objectsDb) {
            throw new Error('Objects Database not initialized.');
        }
        return void this.objectsDb.setObject(id, obj, callback);
    }

    /**
     * Set/Extend an Object in Objects DB
     *
     * @param id {string} id of object to set/extend
     * @param callback {function} function to be called with the result. Signature for callback is (err, {id})
     */
    extendObject(id, obj, callback) {
        if (!this.objectsDb) {
            throw new Error('Objects Database not initialized.');
        }
        return void this.objectsDb.extendObject(id, obj, callback);
    }

    /****************************************
     * Internal methods!!
     ****************************************/

    /**
     * set The Active flag for the plugin
     *
     * @param active {boolean} true/false if active
     */
    setActive(active) {
        this.isActive = !!active;
        this.setState(this.pluginNamespace + '.enabled', {
            val: !!active,
            ack: true,
            from: this.pluginNamespace
        });
    }

    /**
     * Set the objects and states database to be used internally
     * This method is called by js-controller/adapter process internally when initializing the plugin.
     *
     * @private
     * @param objectsDb {object} objects DB instance
     * @param statesDb {object} states DB instance
     */
    setDatabase(objectsDb, statesDb) {
        this.objectsDb = objectsDb;
        this.statesDb = statesDb;
    }

    /**
     * Initialize plugin, internal method
     *
     * @private
     * @param pluginConfig {object} plugin configuration from config files
     * @param parentConfig {object} io-package from parent module where plugin is used in
     * @param callback {function} callback when done, signature "(err, initSuccessful)". On err or initSuccessful===false the plugin instance will be discarded
     */
    initPlugin(pluginConfig, parentConfig, callback) {
        if (!pluginConfig) {
            return void callback('No configuration for plugin');
        }
        this.parentIoPackage = parentConfig;

        this.extendObject(this.pluginNamespace, {
            type:      'folder',
            common: {
                name:  'Plugin States',
            },
            native: {}
        }, () => {
            this.extendObject(this.pluginNamespace + '.enabled', {
                type:      'state',
                common: {
                    name:  'Plugin - enabled',
                    type:  'boolean',
                    read:  true,
                    write: true,
                    role:  'value'
                },
                native: {}
            }, (err) => {
                this.getState(this.pluginNamespace + '.enabled', (err, state) => {
                    let active;
                    if (err || !state || typeof state.val === 'object' || state.val === undefined) {
                        active = pluginConfig.enabled === undefined ? true : !!pluginConfig.enabled;
                    } else {
                        active = !!state.val;
                    }
                    if (active) {
                        this.log.debug('Initialize Plugin (enabled=' + active + ')');
                        pluginConfig.enabled = active;
                        this.init(pluginConfig, (err, success) => {
                            if (!err && success) {
                                this.setActive(true);
                            } else {
                                this.setActive(false);
                            }
                            callback(err, success);
                        });
                    } else {
                        this.log.debug('Do not initialize Plugin (enabled=' + active + ')');
                        this.setActive(false);
                        callback(null, false);
                    }
                });
            });
        });
    }
}

module.exports = PluginBase;