package com.postman.collection.adapter;

import com.google.gson.*;
import com.postman.collection.Property;

import java.lang.reflect.Type;

public class PropertyDeserializer implements JsonDeserializer<Property> {

    /**
     * Custom <a href=
     * "https://www.javadoc.io/doc/com.google.code.gson/gson/2.6.2/com/google/gson/JsonDeserializer.html">
     * GSON deserializer</a> for the {@link com.postman.collection.RequestAuth} object.
     *
     * @param jElement
     * @param typeOfT
     * @param context
     * @return Property
     * @throws JsonParseException
     */
    @Override
    public Property deserialize(JsonElement jElement, Type typeOfT, JsonDeserializationContext context) {
        Property pvVar = null;
        JsonObject jObj = jElement.getAsJsonObject();
        String curVal = "";

        curVal = jObj.get("value") == null || jObj.get("value").isJsonNull() ? null : jObj.get("value").getAsString();
        pvVar = new Property(jObj.get("key").getAsString(), curVal);

        if (jObj.get("type") != null) {
            pvVar.setType(jObj.get("type").getAsString());
        }
        if (jObj.get("description") != null) {
            pvVar.setDescription(jObj.get("description").getAsString());
        }

        return pvVar;
    }
}
