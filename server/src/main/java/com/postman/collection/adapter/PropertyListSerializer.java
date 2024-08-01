package com.postman.collection.adapter;

import com.postman.collection.*;
import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonSerializer;
import com.google.gson.JsonSerializationContext;
import java.lang.reflect.Type;
import java.util.Iterator;
import java.util.HashMap;




public class PropertyListSerializer implements JsonSerializer<HashMap<String, Property>> {
    
    /** 
     * @param src
     * @param typeOfSrc
     * @param context
     * @return JsonElement
     */
    public JsonElement serialize(HashMap<String, Property> src, Type typeOfSrc,
            JsonSerializationContext context) {
        JsonArray varArray = new JsonArray();
        JsonObject varElement;
        String curKey;
        Property curVar = null;
        Iterator<String> keys = src.keySet().iterator();
        while (keys.hasNext()) {
            curKey = keys.next();
            varElement = new JsonObject();
            curVar = src.get(curKey);
            varElement.addProperty("key", curVar.getKey());
            varElement.addProperty("value", curVar.getValue());
            if (curVar.getDescription() != null) {
                varElement.addProperty("description", curVar.getDescription());
            }
            if (curVar.getType() != null) {
                varElement.addProperty("type", curVar.getType());
            }
            varArray.add(varElement);
        }

        return varArray;

    }

}
