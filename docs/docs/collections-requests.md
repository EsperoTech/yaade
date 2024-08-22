# Collections & Requests

Yaade organizes your requests in collections. A collection is a group of requests that are related to each other. For example, you could have a collection for your backend API and another one for your frontend API.

## Collections

Collections are like folders in Yaade. They include environments, collection-level headers, request scripts and response scripts. To create a new collection click **+** in the sidebar.

Collections can themselve contain other collections. This is useful if you have multiple APIs that are related to each other. For example, you could have a collection for your backend API and multiple sub collections for your different microservices. 

::: info
Links to a specific collection or request don't break when you move a collection to a new parent collection. But links do break if you move a request to a new collection.
:::


### Collection-level Headers

Collection-level headers are headers that are sent with every request in the collection. This is useful if you have an API that requires an `Authorization` or `Content-Type` header for every request. Request Headers have priority over collection-level headers.

## Requests

Requests are the core of Yaade. They are the actual HTTP requests that are sent to your proxy. To create a new request, first create a new collection, then select the collection and click **+ New Request**.

## Documentation

Both collections and request can have documentation. This is useful if you want to document your API. Documentation is written in markdown. To add documentation to a collection or request, open the **Documentation** tab and click the edit button in the top right corner. Save the documentation by clicking the save button.
