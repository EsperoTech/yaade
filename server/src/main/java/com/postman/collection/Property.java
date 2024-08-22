package com.postman.collection;
/**
 * 
 * 
 * Postman SDK analog: Not directly related, but probably close to <code><a href="http://www.postmanlabs.com/postman-collection/PropertyBase.html">PropertyBase</a></code>
 * 
 * 
 * <p>Utility class to store key-value pairs with additional, optional <code>description</code> and <code>type</code> properties</p>
 * 
 * 
 */
public class Property extends CollectionElement {
    private String key = "";
    private String value = "";
    private String description;
    private String type = "string";

    
    /** 
     * 
     * Returns the Postman token for a variable, eg. the <code>key</code> surrounded by double curly braces <code>{{}}</code>
     * 
     * 
     * @return String  The postman token
     */
    public String getToken() {
        return "{{" + key + "}}";
    }


/**
 * 
 * Constructs a Property with the specified properties.  The <code>type</code> property is set to <code>null</code>
 * 
 * @param key Value for the <code>key</code> property.  NOTE: If a null key is provided it will be transformed to an empty string ("");
 * @param value Value for the <code>value</code> property
 * @param description Value for the <code>description</code> proptery
 */

    public Property(String key, String value, String description) {
        this(key, value, description, null);

    }
/**
 * 
 * Constructs a Property with all specified properties.
 * 
 * @param key Value for the <code>key</code> property.  NOTE: If a null key is provided it will be transformed to an empty string ("");
 * @param value Value for the <code>value</code> property
 * @param description Value for the <code>description</code> property
 * @param type Value for the <code>type</code> property
 */
    public Property(String key, String value, String description, String type) {
        this.key = key;
        this.value = value;
        this.description = description;
        this.type = type;
    }

    /**
 * 
 * Constructs a Property with with just <code>key</code> and <code>value</code> properties
 * 
 * @param key Value for the <code>key</code> property.  NOTE: If a null key is provided it will be transformed to an empty string ("");
 * @param value Value for the <code>value</code> property
 */
    
    public Property(String key, String value) {
        this(key, value, null, null);
    }

    
    /** 
     * 
     * returns the value of the <code>key</code> property
     * 
     * @return String
     */
    @Override
    public String getKey() {
        return key;
    }

    
    /** 
     * 
     * Sets the <code>description</code> property
     * 
     * 
     * @param desc
     */
    public void setDescription(String desc) {
        this.description = desc;
    }

    
    /** 
     * 
     * Returns the <code>description</code> property, or null if it is not set
     * 
     * @return String
     */
    public String getDescription() {
        return this.description;
    }

    
    /** 
     * 
     * Sets the <code>key</code> value for this property
     * 
     * @param key
     */
    public void setKey(String key) {
        this.key = key;
    }

    
    /** 
     * 
     * Sets the <code>value</code> property for this property
     * @return String
     */
    public String getValue() {
        return value;
    }

    
    /** 
     * 
     * Sets the <code>value</code> property for this variable
     * 
     * @param value  The value
     */
    public void setValue(String value) {
        this.value = value;
    }

    
    /** 
     * 
     * Returns the <code>type</code> property for this variable
     * 
     * @return String the type
     */
    public String getType() {
        return this.type;
    }

    
    /** 
     * 
     * Sets the <code>type</code> property for this variable
     * 
     * @param type  The type, e.g., "string" or "boolean"
     */
    public void setType(String type) {
        this.type = type;
    }
    
    
    /** 
     * @param obj
     * @return boolean
     */
    @Override
    public boolean equals(Object obj) {
        if(! (obj instanceof Property)) {
            return false;
        }
        Property varComp = (Property)obj;
        return (this.getKey().equals(varComp.getKey())
                && (this.getValue() + "").equals(varComp.getValue() + "")
                && (this.getType() + "").equals(varComp.getType() + "")
                && (this.getDescription() + "").equals(varComp.getDescription() + ""));
    }

}
