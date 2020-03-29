/// <reference path="types.d.ts" />
export = PluginBase;
/**
 * Base class for ioBroker Plugins
 */
declare class PluginBase {
    /**
     * Constructor for Plugin class
     * This method is called by js-controller/adapter process internally when initializing the plugin.
     *
     * @param {import("@iobroker/plugin-base/types").PluginSettings} settings
     */
    constructor(settings: import("@iobroker/plugin-base/types").PluginSettings);
    pluginScope: "adapter" | "controller";
    pluginNamespace: string;
    log: import("./NamespaceLogger");
    iobrokerConfig: Record<string, any>;
    parentPackage: Record<string, any>;
    objectsDb: object | null;
    statesDb: object | null;
    isActive: boolean;
    SCOPES: {
        ADAPTER: string;
        CONTROLLER: string;
    };
    /**
     * Method for Plugin developer to initialize his Plugin
     *
     * @param {Record<string, any>} pluginConfig plugin configuration from config files
     * @param {import("@iobroker/plugin-base/types").InitCallback} callback Will be called when done. On err or `initSuccessful === false` the plugin instance will be discarded.
     */
    init(pluginConfig: Record<string, any>, callback: import("@iobroker/plugin-base/types").InitCallback): void;
    /**
     * Method which is called on a clean end of the process to pot. clean up used resources
     *
     * @return {boolean} The return value indicates if the exit was successful. If no action needs to be taken, you should return true.
     */
    destroy(): boolean;
    /**
     * Get a State from State DB
     *
     * @param {string} id id of the state to retrieve
     * @param {ioBroker.GetStateCallback} callback Will be called with the result
     */
    getState(id: string, callback: ioBroker.GetStateCallback): void;
    /**
     * Set a State in State DB
     *
     * @param {string} id id of the state to set
     * @param {ioBroker.SetStateCallback} [callback] Will be called with the result
     */
    setState(id: string, state: any, callback?: ioBroker.SetStateCallback | undefined): void;
    /**
     * Get an Object from Objects DB
     *
     * @param {string} id id of the object to retrieve
     * @param {ioBroker.GetObjectCallback} callback Will be called with the result
     */
    getObject(id: string, callback: ioBroker.GetObjectCallback): void;
    /**
     * Set an Object in Objects DB
     *
     * @param {string} id id of the object to set
     * @param {ioBroker.SetObjectCallback} [callback] Will be called with the result
     */
    setObject(id: string, obj: any, callback?: ioBroker.SetObjectCallback | undefined): void;
    /**
     * Set/Extend an Object in Objects DB
     *
     * @param {string} id id of the object to set/extend
     * @param {ioBroker.ExtendObjectCallback} [callback] Will be called with the result
     */
    extendObject(id: string, obj: any, callback?: ioBroker.ExtendObjectCallback | undefined): void;
    /****************************************
     * Internal methods!!
     ****************************************/
    /**
     * set The Active flag for the plugin
     *
     * @param active {boolean} true/false if active
     */
    setActive(active: boolean): void;
    /**
     * Set the objects and states database to be used internally
     * This method is called by js-controller/adapter process internally when initializing the plugin.
     *
     * @private
     * @param objectsDb {object} objects DB instance
     * @param statesDb {object} states DB instance
     */
    private setDatabase;
    /**
     * Initialize plugin, internal method
     *
     * @private
     * @param pluginConfig {object} plugin configuration from config files
     * @param parentConfig {object} io-package from parent module where plugin is used in
     * @param callback {function} callback when done, signature "(err, initSuccessful)". On err or initSuccessful===false the plugin instance will be discarded
     */
    private initPlugin;
    parentIoPackage: object | undefined;
}
