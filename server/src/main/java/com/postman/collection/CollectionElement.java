package com.postman.collection;

import com.google.gson.Gson;

import java.util.UUID;

/**
 * Abstract Base Class for all objects which are part of a collection
 */
public abstract class CollectionElement {
    private static final String defaultCollectionSchema = "https://schema.getpostman.com/json/collection/v2.1.0/collection.json";
    private static final String defaultValidationSchema = "https://schema.postman.com/collection/json/v2.1.0/draft-07/collection.json";
    private transient UUID uuid = UUID.randomUUID();
    private transient CollectionElement parent;

    public abstract String getKey();


    /**
     * Validate the gson produced by this element against the PostmanSchema.  Schema version is currently hardcoded to
     * <a href="https://schema.postman.com/collection/json/v2.1.0/draft-07/collection.json">v2.1.0</a>.  Validation is provided by the <a href="https://github.com/networknt/json-schema-validator">NetworkNT json-schema-validator</a>
     *
     * @return boolean <code>true</code> if valid, <code>false</code> if not.  If the schema is invalid, calling {@link com.postman.collection.Collection#getValidationMessages()  } will return an  containing the diffs
     * @throws ValidationException If an error is encountered accessing the schema or mapping the underlying JSON.
     */
    public boolean validate() throws ValidationException {
        return this.validate(null);
    }


    /**
     * Set the parent of this element, allowing for traversal up the chain of elements
     *
     * @param parent The parent element
     */
    public void setParent(CollectionElement parent) {
        this.parent = parent;
    }


    /**
     * Get the parent element, or null if it is not set.
     *
     * @return CollectionElement The parent of this element
     */
    public CollectionElement getParent() {
        return this.parent;
    }

    /**
     * Convenience method allowing validation against a user-provided schema
     *
     * @param altSchemaJSON String containing the alternate schema JSON
     * @return boolean <code>true</code> if valid, <code>false</code> if not.  If the schema is invalid, calling {@link com.postman.collection.Collection#getValidationMessages()  } will return an  containing the diffs
     * @throws ValidationException If there is an error in the validation process
     */
    public boolean validate(String altSchemaJSON) throws ValidationException {

        return true;

    }


    /**
     * Render this element to JSON using the Gson conversion library.
     *
     * @return String The JSON rendered by Gson
     */
    public String toJson() {
        return this.toJson(false, false);
    }


    /**
     * Render this element to JSON using the Gson conversion library. The <code>escape</code> and <code>resolveVariable</code> arguments are currently not implemented
     *
     * @param escape           NOT IMPLEMENTED: Escaping scheme for JSON
     * @param resolveVariables NOT IMPLEMENTED: Whether to resolve variables to their corresponding values.
     * @return String The rendered JSON
     */
    public String toJson(boolean escape, boolean resolveVariables) {
        return new Gson().toJson(this);
    }


    /**
     * Get a unique UUID for this element.  UUIDs are not persisted/serialized
     *
     * @return UUID A unique UUID
     */
    public UUID getUUID() {
        return this.uuid;
    }


    /**
     * Set a new unique UUID for this element.
     *
     * @param newID A new UUID
     */
    public void setUUID(UUID newID) {
        this.uuid = newID;
    }


    /**
     * Traverse the chain of parent elements upwards until a Collection is reached, or null if this element is not part of a collection.
     *
     * @return Collection The collection at the top of the parent tree, or null.
     */
    public Collection getCollection() {
        CollectionElement result = null;
        CollectionElement curItem = null;
        // recursively traverse items looking for name == key
        if (this.getParent() == null) {
            return this instanceof Collection ? (Collection) this : null;
        }
        while (result == null) {
            curItem = this.getParent();
            if (curItem instanceof Collection) {
                result = curItem;
                break;
            } else {
                try {
                    result = curItem.getCollection();
                    if (result == null) {
                        return null;
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }

                if (result instanceof Collection) {
                    break;
                }
            }
        }


        return (Collection) result;
    }


    /**
     * <p>Return the default schema appearing in the <code>schema</code> property in exported collections.  </p>
     * <p>
     * <p>Current: https://schema.getpostman.com/json/collection/v2.1.0/collection.json</p>
     *
     * @return The URI for default schema used to validate schemas
     */
    public static String getDefaultCollectionSchema() {
        return defaultCollectionSchema;
    }

    /**
     * <p>Return the default schema used to validate schemas.  NOTE: AS of version Version 10.8.9 this is not the same
     * appearing in the <code>schema</code> property in exported collections.  </p>
     * <p>
     * <p>Current: https://schema.postman.com/collection/json/v2.1.0/draft-07/collection.json</p>
     *
     * @return The URI for default schema used to validate schemas
     */
    public static String getDefaultValidationSchema() {
        return defaultValidationSchema;
    }
}
