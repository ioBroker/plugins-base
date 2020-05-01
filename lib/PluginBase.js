/// <reference path="./types.d.ts" />
const NamespaceLogger = require('./NamespaceLogger');

/**
 * Base class for ioBroker Plugins
 */
class PluginBase {

    /**
     * Constructor for Plugin class
     * This method is called by js-controller/adapter process internally when initializing the plugin.
     *
     * @param {import("@iobroker/plugin-base/types").PluginSettings} settings
     */
    constructor(settings) {
        this.pluginScope = settings.pluginScope;
        this.pluginNamespace = settings.pluginNamespace;
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
     * @param {Record<string, any>} pluginConfig plugin configuration from config files
     * @param {import("@iobroker/plugin-base/types").InitCallback} callback Will be called when done. On err or `initSuccessful === false` the plugin instance will be discarded.
     */
    init(pluginConfig, callback) {
        // Implement in your Plugin instance if needed
        callback('Not implemented');
    }

    /**
     * Method which is called on a clean end of the process to pot. clean up used resources
     *
     * @return {boolean} The return value indicates if the exit was successful. If no action needs to be taken, you should return true.
     */
    destroy() {
        // Implement in your Plugin instance if needed
        return true;
    }

    /**
     * Get a State from State DB
     *
     * @param {string} id id of the state to retrieve
     * @param {ioBroker.GetStateCallback} callback Will be called with the result
     */
    getState(id, callback) {
        if (!this.statesDb) {
            throw new Error('States Database not initialized.');
        }
        this.statesDb.getState(id, callback);
    }

    /**
     * Set a State in State DB
     *
     * @param {string} id id of the state to set
     * @param {ioBroker.SetStateCallback} [callback] Will be called with the result
     */
    setState(id, state, callback) {
        if (!this.statesDb) {
            throw new Error('States Database not initialized.');
        }
        this.statesDb.setState(id, state, callback);
    }

    /**
     * Get an Object from Objects DB
     *
     * @param {string} id id of the object to retrieve
     * @param {ioBroker.GetObjectCallback} callback Will be called with the result
     */
    getObject(id, callback) {
        if (!this.objectsDb) {
            throw new Error('Objects Database not initialized.');
        }
        this.objectsDb.getObject(id, callback);
    }

    /**
     * Set an Object in Objects DB
     *
     * @param {string} id id of the object to set
     * @param {ioBroker.SetObjectCallback} [callback] Will be called with the result
     */
    setObject(id, obj, callback) {
        if (!this.objectsDb) {
            throw new Error('Objects Database not initialized.');
        }
        this.objectsDb.setObject(id, obj, callback);
    }

    /**
     * Set/Extend an Object in Objects DB
     *
     * @param {string} id id of the object to set/extend
     * @param {ioBroker.ExtendObjectCallback} [callback] Will be called with the result
     */
    extendObject(id, obj, callback) {
        if (!this.objectsDb) {
            throw new Error('Objects Database not initialized.');
        }
        this.objectsDb.extendObject(id, obj, callback);
    }

    /****************************************
     * Internal methods!!
     ****************************************/

    /**
     * set The Active flag for the plugin
     *
     * @param {boolean} active true/false if active
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
     * @param {obj} objectsDb objects DB instance
     * @param {obj} statesDb states DB instance
     */
    setDatabase(objectsDb, statesDb) {
        this.objectsDb = objectsDb;
        this.statesDb = statesDb;
    }

    /**
     * Initialize plugin, internal method
     *
     * @private
     * @param {Record<string, any>} pluginConfig plugin configuration from config files
     * @param {Record<string, any>} parentConfig io-package from parent module where plugin is used in
     * @param {import("@iobroker/plugin-base/types").InitCallback} callback Will be called when done. On err or `initSuccessful === false` the plugin instance will be discarded.
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
            }, (_err) => {
                this.getState(this.pluginNamespace + '.enabled', (err, state) => {
                    if (err || !state || typeof state.val === 'object' || state.val === undefined) {
                        // We have first start and no enabled flag is set
                        if (this.pluginScope === this.SCOPES.ADAPTER && parentConfig && parentConfig.common && parentConfig.common.host) {
                            // We check if the host has a sentry enabled flag
                            const hostNamespace = this.pluginNamespace.replace(new RegExp('system\.adapter\.' + parentConfig.common.name + '\.[0-9]+\.'), 'system.host.' + parentConfig.common.host + '.');
                            this.getState(hostNamespace + '.enabled', (err, hostState) => {
                                if (err || !hostState || typeof hostState.val !== 'boolean' || hostState.val === undefined) {
                                    // No host enabled flag is set, so we use default
                                    this._initialize(pluginConfig, pluginConfig.enabled === undefined ? true : !!pluginConfig.enabled, callback);
                                } else {
                                    // We simply use the host enabled flag state
                                    this._initialize(pluginConfig, !!hostState.val, callback);
                                }
                            });

                        } else {
                            //use default value
                            this._initialize(pluginConfig, pluginConfig.enabled === undefined ? true : !!pluginConfig.enabled, callback);
                        }
                    } else {
                        // We already have a enabled flag state, use it
                        this._initialize(pluginConfig, !!state.val, callback);
                    }
                });
            });
        });
    }

    _initialize(pluginConfig, activate, callback) {
        if (activate) {
            this.log.debug('Initialize Plugin (enabled=' + activate + ')');
            pluginConfig.enabled = activate;
            this.init(pluginConfig, (err, success) => {
                if (!err && success) {
                    this.setActive(true);
                } else {
                    this.setActive(false);
                }
                callback(err, success);
            });
        } else {
            this.log.debug('Do not initialize Plugin (enabled=' + activate + ')');
            this.setActive(false);
            callback(null, false);
        }
    }
}

module.exports = PluginBase;