package nl.k4u.resourcemapper.model;

/**
 * Enum representing different types of connections between services.
 */
public enum ConnectionType {
    /**
     * TCP/IP network connection
     */
    TCP,

    /**
     * Message publishing (e.g., pub/sub, message queue)
     */
    PUBLISHES,

    /**
     * Direct API/RPC call
     */
    CALLS,

    /**
     * Event trigger or webhook
     */
    TRIGGERS
}

