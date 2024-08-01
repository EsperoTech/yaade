package com.postman.collection;

/**
 * 
 * 
 * Convenience class to enable TypeSafe references to Postman UUIDs.  
 * 
 * <p>NOTE: This class does not provide any validation.  </p>
 * 
 * 
 * 
 */


public class PostmanID {
    private String ID;
    public PostmanID(String ID) {
        this.ID = ID;
    }

    
    /** 
     * @return String
     */
    public String toString() {
        return this.ID;
    }

    
    /** 
     * @return String
     */
    public String getID() {
        return this.ID;
    }
}
