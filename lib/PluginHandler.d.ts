export = PluginHandler;
/**
 * Base handler for ioBroker Plugins
 */
declare class PluginHandler {
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
    constructor(settings: object);
    settings: object;
    log: import("./NamespaceLogger");
    plugins: {};
    /**
     * Add plugins to the handler, resolve and require the plugin code and create instance
     *
     * @param configs {object} object with keys for plugin names and their configuration
     * @param resolveDirs {array|string} Resolve Directories for plugins
     */
    addPlugins(configs: object, resolveDirs: any): void;
    /**
     * Resole, Require and Instanciate Plugins
     *
     * @param name {string} name of the plugin
     * @param config {object} plugin configuration
     * @param resolveDirs {string|Array} Resolve directories
     */
    instanciatePlugin(name: string, config: object, resolveDirs: string | any[]): void;
    /**
     * Set Objects and States databases for all isActive plugins
     *
     * @param name {object} name of the plugin
     * @param objectsDb {object} Objects DB instance
     * @param statesDb {object} States DB instance
     */
    setDatabaseForPlugin(name: object, objectsDb: object, statesDb: object): void;
    /**
     * Set Objects and States databases for all isActive plugins
     *
     * @param objectsDb {object} Objects DB instance
     * @param statesDb {object} States DB instance
     */
    setDatabaseForPlugins(objectsDb: object, statesDb: object): void;
    /**
     * Initialize one Plugins
     *
     * @param name {string} name of the plugin
     * @param parentConfig {object} io-package of the parent module that uses the plugins (adapter/controller)
     * @param callback {function} callback function which is called after initialization is done for all plugins
     */
    initPlugin(name: string, parentConfig: object, callback: Function): void;
    /**
     * Initialize all Plugins that are registered
     *
     * @param parentConfig {object} io-package of the parent module that uses the plugins (adapter/controller)
     * @param callback {function} callback function which is called after initialization is done for all plugins
     */
    initPlugins(parentConfig: object, callback: Function): void;
    /**
     * Destroy one plugin instance
     *
     * @param name {string} name of the plugin to destroy
     * @param force {boolean} optional true to consider plugin as destroyed also if false is returned from plugin
     */
    destroy(name: string, force: boolean): boolean;
    /**
     * Destroy all plugin instances
     */
    destroyAll(): void;
    /**
     * Return plugin instance
     *
     * @param name {string} name of the plugin to return
     * @returns {object} plugin instance or null if not existent or not isActive
     */
    getPluginInstance(name: string): object;
    /**
     * Return plugin configuration
     *
     * @param name {string} name of the plugin to return
     * @returns {object} plugin configuration or null if not existent or not isActive
     */
    getPluginConfig(name: string): object;
    /**
     * Return if plugin exists
     *
     * @param name {string} name of the plugin to check
     * @returns {boolean} true/false if plugin was configured somewhere
     */
    pluginExists(name: string): boolean;
    /**
     * Return if plugin is isActive
     *
     * @param name {string} name of the plugin to check
     * @returns {boolean} true/false if plugin is successfully isActive
     */
    isPluginInstanciated(name: string): boolean;
    /**
     * Return if plugin is active
     *
     * @param name {string} name of the plugin to check
     * @returns {boolean} true/false if plugin is successfully isActive
     */
    isPluginActive(name: string): boolean;
}
