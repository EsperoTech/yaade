package com.postman.collection.adapter;

import com.google.gson.JsonObject;
import com.google.gson.JsonElement;
import com.google.gson.JsonSerializer;
import com.google.gson.JsonSerializationContext;
import com.postman.collection.*;
import java.lang.reflect.Type;


/**
 * 
 * Custom serializer for the collection element.  JSON does not require a particular order in order to be valid.  However, Postman always outputs collections in the same order.  
 * This serializer replicates that order.
 * 
 */
public class CollectionSerializer implements JsonSerializer<Collection> {
    
    
    /** 
     * @param src The Collection passed in by Gson
     * @param typeOfSrc The Java Type of the object being parsed
     * @param context Serialization context passed in by Gson
     * @return JsonElement The resulting Json
     */
    @Override
    public JsonElement serialize(Collection src, Type typeOfSrc, JsonSerializationContext context) {
        
        JsonObject collJsonMap = new JsonObject();
        
        collJsonMap.add("info", context.serialize(src.getInfo()));
        collJsonMap.add("item",context.serialize(src.getItems()));
        collJsonMap.add("event", context.serialize(src.getEvents()));
        collJsonMap.add("variable", context.serialize(src.getVariables()));
        collJsonMap.add("auth",context.serialize(src.getAuth()));

        return collJsonMap;
    }

}
