package com.postman.collection.adapter;

import com.google.gson.JsonObject;
import com.google.gson.JsonElement;
import com.google.gson.JsonSerializer;
import java.util.HashMap;
import com.google.gson.JsonSerializationContext;
import java.util.Iterator;

import java.lang.reflect.Type;

public class StringMapSerializer implements JsonSerializer<HashMap<String, String>> {
     
        
        /** 
         * @param src
         * @param typeOfSrc
         * @param context
         * @return JsonElement
         */
        @Override
        public JsonElement serialize(HashMap<String, String> src, Type typeOfSrc, JsonSerializationContext context) {
            
            JsonObject jsonMap = new JsonObject();
            Iterator<String> keys = src.keySet().iterator();
            String curKey;
            while (keys.hasNext()) {
                curKey = keys.next();
                jsonMap.addProperty(curKey, src.get(curKey));
            }

            return jsonMap;
        }
    
}
