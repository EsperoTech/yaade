package com.postman.collection;
/**
 * 
 * Thrown when a collection is not found in Postman, or if a 404 is thrown attempting to retrieve
 * a collection from Postman by URI
 * 
 */
public class CollectionNotFoundException extends Exception{
    
    /**
     * 
     * Default constructor
     * @param message The message to pass with the exception
     */
    public CollectionNotFoundException(String message) {
        super(message);
    }
}
