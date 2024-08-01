package com.postman.collection.adapter;

import com.postman.collection.*;
import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonParseException;
import com.google.gson.JsonElement;
import com.google.gson.JsonDeserializer;
import java.lang.reflect.Type;
/**
 * 
 * 
 * 
 * 
 * Custom deserializer for the <code>auth</code> property object.  
 * 
 * 
 * 
 */
public class AuthDeserializer implements JsonDeserializer<RequestAuth> {

    /**
     * 
     * Custom <a href=
     * "https://www.javadoc.io/doc/com.google.code.gson/gson/2.6.2/com/google/gson/JsonDeserializer.html">
     * GSON deserializer</a> for the {@link com.postman.collection.RequestAuth} object.
     * 
     * 
     * @param jElement The JSON element passed in by Gson
     * @param typeOfT The type for the adapter, {@link com.postman.collection.RequestAuth}
     * @param context Deserialization context
     * @return {@link com.postman.collection.RequestAuth} The assembed {@link com.postman.collection.RequestAuth} object 
     * @throws JsonParseException IF there are errors in the JSON element
     */
    @Override
    public RequestAuth deserialize(JsonElement jElement, Type typeOfT, JsonDeserializationContext context) throws JsonParseException {
        JsonObject jObject = jElement.getAsJsonObject();
        JsonObject curVar;
        String type = jObject.get("type").getAsString();
        JsonArray vars = jObject.get(type).getAsJsonArray();
        Property pvVar;
        RequestAuth auth = new RequestAuth(jObject.get("type").getAsString());
        String curKey;
        String curVal;
        String curType;
        for (int i = 0; i < vars.size(); i++) {
            curVar = vars.get(i).getAsJsonObject();
            curVar.get("key");
            
            curKey = curVar.get("key") == null ? null : curVar.get("key").getAsString();
            curVal = curVar.get("value") == null ? null : curVar.get("value").getAsString();
            curType = curVar.get("type") == null ? null : curVar.get("type").getAsString();
            
            pvVar = new Property(curKey, curVal, null,curType);
            try {
                auth.addProperty(pvVar);
            } catch (Exception e) {
                e.printStackTrace();
            }

        }
        
        return auth;

    }
}
