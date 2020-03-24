const NamespaceLogger = require('./NamespaceLogger');

/**
 * Base handler for ioBroker Plugins
 */
class PluginHandler {
    /**
     * Constructore for PluginHandler
     *
     * @param settings {object} object with configuration:
     *                  {
     *                      scope: 'adapter', // or 'controller'
     *                      namespace: 'system.adapter.myname.0.plugins.name', // or 'system.host.name.plugins.name'
     *                      logNamespace: 'myname.0',
     *                      log: {...}, // logger object
     *                      iobrokerConfig: {...}, // ioBroker configuration
     *                      parentPackage: {...} // package.json from "parent" which uses the plugin (adapter/controller)
     *                  }
     */
    constructor(settings) {
        this.settings = settings;
        this.log = new NamespaceLogger(this.settings.logNamespace, settings.log);

        this.plugins = {};
    }

    /**
     * add plugins to the handler, resolve and require the plugin code and create instance
     *
     * @param configs {object} object with keys for plugin names and their configuration
     * @param resolveDirs {array|string} Resolve Directories for plugins
     */
    addPlugins(configs, resolveDirs) {
        if (!configs) return;
        if (resolveDirs && !Array.isArray(resolveDirs)) {
            resolveDirs = [resolveDirs];
        }

        Object.keys(configs).forEach(plugin => {
            if (this.plugins[plugin]) {
                this.log.info('Ignore duplicate plugin ' + plugin);
                return;
            }

            const pluginPath = require.resolve('@iobroker/plugin-' + plugin, {
                paths: resolveDirs
            });
            if (!pluginPath) {
                this.log.info('Plugin ' + plugin + ' could not be resolved');
                return;
            }

            let ResolvedPlugin;
            try {
                ResolvedPlugin = require(pluginPath);
            } catch (err) {
                this.log.info('Plugin ' + plugin + ' could not be required: ' + err);
                return;
            }

            const pluginSettings = {
                pluginScope: this.settings.scope,
                pluginNamespace: this.settings.namespace + '.plugins.' + plugin,
                pluginLogNamespace: this.settings.logNamespace + ' Plugin ' + plugin,
                log: this.settings.log,
                iobrokerConfig: this.settings.iobrokerConfig,
                parentPackage: this.settings.parentPackage // package.json from "parent" which uses the plugin (adapter/controller)
            };
            this.plugins[plugin] = {
                config: configs[plugin],
            };

            try {
                this.plugins[plugin].instance = new ResolvedPlugin(pluginSettings);
            } catch (err) {
                this.log.info('Plugin ' + plugin + ' could not be ininitialized: ' + err);
                this.plugins[plugin].instance = null;
            }
        });
    }

    /**
     * Set Objects and States databases for all initialized plugins
     *
     * @param objectsDb {object} Objects DB instance
     * @param statesDb {object} States DB instance
     */
    setDatabaseForPlugins(objectsDb, statesDb) {
        Object.keys(this.plugins).forEach(plugin => this.plugins[plugin].instance && this.plugins[plugin].instance.setDatabase(objectsDb, statesDb));
    }

    /**
     * Initialize all Plugins that are registered
     *
     * @param parentConfig {object} io-package of the parent module that uses the plugins (adapter/controller)
     * @param callback {function} callback function which is called after initialization is done for all plugins
     */
    initPlugins(parentConfig, callback) {
        let callbackCnt = 0;
        Object.keys(this.plugins).forEach(plugin => {
            if (!this.plugins[plugin].instance) return;
            callbackCnt++;
            this.plugins[plugin].instance.initPlugin(this.plugins[plugin].config, parentConfig, (err, initSuccessful) => {
                if (err || !initSuccessful) {
                    this.log.debug('Plugin ' + plugin + ' destroyed because not initialized');

                    this.plugins[plugin].instance.destroy();
                    delete this.plugins[plugin].instance;
                }
                !--callbackCnt && callback();
            })
        });
        callbackCnt === 0 && callback();
    }

    /**
     * Destroy all plugin instances
     */
    destroy() {
        Object.keys(this.plugins).forEach(plugin => {
            if (this.plugins[plugin].instance) {
                this.log.debug('Plugin ' + plugin + ' destroyed');

                this.plugins[plugin].instance.destroy();
                delete this.plugins[plugin].instance;
            }
        });
    }

    /**
     * Return plugin instance
     *
     * @param name {string} name of the plugin to return
     * @returns {object} plugin instance or null if not existent or not initialized
     */
    getPluginInstance(name) {
        if (!this.plugins[name] || !this.plugins[name].instance) {
            return null;
        }
        return this.plugins[name].instance;
    }

    /**
     * Return plugin configuration
     *
     * @param name {string} name of the plugin to return
     * @returns {object} plugin configuration or null if not existent or not initialized
     */
    getPluginConfig(name) {
        if (!this.plugins[name] || !this.plugins[name].config) {
            return null;
        }
        return this.plugins[name].config;
    }

    /**
     * Return if plugin exists
     *
     * @param name {string} name of the plugin to check
     * @returns {boolean} true/false if plugin was configured somewhere
     */
    pluginExists(name) {
        return !!this.plugins[name];
    }

    /**
     * Return if plugin is initialized
     *
     * @param name {string} name of the plugin to check
     * @returns {boolean} true/false if plugin is successfully initialized
     */
    isPluginInitialized(name) {
        return !!(this.plugins[name] && this.plugins[name].instance);
    }
}

module.exports = PluginHandler;