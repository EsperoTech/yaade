package com.postman.collection;
/**
 * 
 * 
 * Exception thrown when an invalid action is taken against an object property, eg., an attempt to see an {@link com.postman.collection.Event}'s <code>exec</code> property to null, etc.
 * 
 * 
 */
public class InvalidPropertyException extends Exception {
    public InvalidPropertyException(String msg) {
        super(msg);
    }
        
}

