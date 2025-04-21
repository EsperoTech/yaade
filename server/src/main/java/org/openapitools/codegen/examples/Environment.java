package org.openapitools.codegen.examples;

import com.espero.yaade.db.DaoManager;
import com.espero.yaade.model.db.CollectionDb;
import org.graalvm.polyglot.HostAccess;

import java.util.List;
import java.util.Map;

// TODO: check why @HostAccess.Export is not working with kotlin fields
public class Environment {

    private CollectionDb collection;
    private DaoManager daoManager;

    private List<CollectionDb> parentTree;

    private Map<String, String> additionalEnvData;

    @HostAccess.Export
    public String name;

    public Environment(CollectionDb collection, String name, DaoManager daoManager, Map<String, String> additionalEnvData) {
        this.collection = collection;
        this.name = name;
        this.daoManager = daoManager;
        this.additionalEnvData = additionalEnvData;

    }

    @HostAccess.Export
    public String get(String key) {
        if (additionalEnvData.containsKey(key)) {
            return additionalEnvData.get(key);
        }
        var c = collection;
        for (var i = 0; i < 10; i++) {
            if (c == null) {
                break;
            }
            var r = collection.getEnvVar(name, key);
            if (r != null) {
                return r;
            }
            var parentId = c.jsonData().getLong("parentId");
            if (parentId == null) {
                break;
            }
            var parentEnvName = c.getParentEnvName(name);
            if (parentEnvName == null) {
                break;
            }
            var parentCollection = daoManager.getCollectionDao().getById(parentId);
            if (parentCollection == null) {
                break;
            }
            c = parentCollection;
        }

        return null;
    }

    @HostAccess.Export
    public void set(String key, String value) {
        if (additionalEnvData.containsKey(key)) {
            additionalEnvData.put(key, value);
        }
        collection.setEnvVar(name, key, value);
        daoManager.getCollectionDao().update(collection);
    }
}

