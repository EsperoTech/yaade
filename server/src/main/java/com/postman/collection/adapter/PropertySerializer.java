package com.postman.collection.adapter;

import com.postman.collection.*;
import com.google.gson.JsonObject;
import com.google.gson.JsonElement;
import com.google.gson.JsonSerializer;

import com.google.gson.JsonSerializationContext;


import java.lang.reflect.Type;

public class PropertySerializer implements JsonSerializer<Property> {
     
    
    /** 
     * @param src
     * @param typeOfSrc
     * @param context
     * @return JsonElement
     */
    @Override
    public JsonElement serialize(Property src, Type typeOfSrc, JsonSerializationContext context) {
        
        JsonObject jsonMap = new JsonObject();
        jsonMap.addProperty("key", src.getKey());
        String strKey = "value";
        if(src.getKey() == null && src.getValue() == null) {
            return null;
        }
        if(src.getType() != null && src.getType().equals("boolean") && src.getValue() != null) {
            switch (src.getValue()) {
                case "true": {
                    jsonMap.addProperty(strKey,true);
                    break;
                }
                case "false": {
                    jsonMap.addProperty(strKey,false);
                    break;
                }
                default: {
                    jsonMap.addProperty(strKey, src.getValue());
                    break;
                }
                    
                    
                }
            
        }
        else {
            if(src.getValue() == null) {
                jsonMap.addProperty(strKey, "");
            }
            jsonMap.addProperty(strKey, src.getValue());
        }
        if(src.getType() != null) {
            jsonMap.addProperty("type", src.getType());
        }
        if(src.getDescription() != null) {
            jsonMap.addProperty("description", src.getDescription());
        }

        return jsonMap;
    }

}
