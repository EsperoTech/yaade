package org.openapitools.codegen.examples;

import com.espero.yaade.db.DaoManager;
import com.espero.yaade.model.db.CollectionDb;
import org.graalvm.polyglot.HostAccess;

// TODO: check why @HostAccess.Export is not working with kotlin fields
public class Environment {

    private CollectionDb collection;
    private DaoManager daoManager;

    @HostAccess.Export
    public String name;

    public Environment(CollectionDb collection, String name, DaoManager daoManager) {
        this.collection = collection;
        this.name = name;
        this.daoManager = daoManager;
    }

    @HostAccess.Export
    public String get(String key) {
        return collection.getEnvVar(name, key);
    }

    @HostAccess.Export
    public void set(String key, String value) {
        collection.setEnvVar(name, key, value);
        daoManager.getCollectionDao().update(collection);
    }
}

