# Collections & Requests

Yaade organizes your requests in collections. A collection is a group of requests that are related to each other. For example, you could have a collection for your backend API and another one for your frontend API.

## Collections

Collections are the top-level entities in Yaade. They include environments, collection-level headers, request scripts and response scripts. To create a new collection click **+** in the sidebar.

### Collection-level Headers

Collection-level headers are headers that are sent with every request in the collection. This is useful if you have an API that requires an `Authorization` or `Content-Type` header for every request. Request Headers have priority over collection-level headers.

## Requests

Requests are the core of Yaade. They are the actual HTTP requests that are sent to your proxy. To create a new request, first create a new collection, then select the collection and click **+ New Request**.