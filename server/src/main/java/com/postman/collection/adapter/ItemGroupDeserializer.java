package com.postman.collection.adapter;

import com.google.gson.*;
import com.google.gson.reflect.TypeToken;
import com.postman.collection.Folder;
import com.postman.collection.Item;
import com.postman.collection.ItemGroup;

import java.lang.reflect.Type;
import java.util.ArrayList;

/**
 * Deserializes ItemGroup objects, the <code>item</code> propertyList in a collection
 */
public class ItemGroupDeserializer implements JsonDeserializer<ItemGroup> {

    /**
     * Deserialize a {@link com.postman.collection.ItemGroup} from the <code>item</code> propertyList
     *
     * @param jElement The JSON element passed in by Gson
     * @param typeOfT  The type for the adapter, {@link com.postman.collection.RequestAuth}
     * @param context  Deserialization context
     * @return ItemGroup The assembed {@link com.postman.collection.ItemGroup}
     * @throws JsonParseException IF there are errors in the JSON element
     */
    @Override
    public ItemGroup deserialize(JsonElement jElement, Type typeOfT, JsonDeserializationContext context) {
        JsonObject jObject = jElement.getAsJsonObject();
        Type typeItem = new TypeToken<ArrayList<Item>>() {
        }.getType();
        Folder newFolder = new Folder("default");
        if (jObject.get("name") != null) {
            newFolder.setName(jObject.getAsJsonPrimitive("name").getAsString());
        }
        if (jObject.get("description") != null) {
            newFolder.setDescription(jObject.getAsJsonPrimitive("description").getAsString());
        }
        if (jObject.get("item") != null) {
            ArrayList<Item> items = context.deserialize(jObject.getAsJsonArray("item"), typeItem);
            newFolder.setItems(items);
        }
        
        return newFolder;

    }
}
