package com.postman.collection;
/**
 * 
 * 
 * 
 * Exception thrown when an invalid action is taken against  PropertyList, eg., IndexOutOfBounds, attempts to set the <code>raw</code> property of a {@link com.postman.collection.BodyElement} when that body's mode is not <code>raw</code> etc.
 * 
 * 
 */
public class IllegalPropertyAccessException extends Exception  {
    public IllegalPropertyAccessException(String message) {
        super(message);
    }
}
