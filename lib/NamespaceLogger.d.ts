export = NamespaceLogger;
declare class NamespaceLogger {
    /**
     * @param {string} namespaceLog Logging namespace to prefix
     * @param {object} logger logger instance
     */
    constructor(namespaceLog: string, logger: object);
    namespaceLog: string;
    logger: object;
    silly(msg: any): void;
    debug(msg: any): void;
    info(msg: any): void;
    error(msg: any): void;
    warn(msg: any): void;
}
