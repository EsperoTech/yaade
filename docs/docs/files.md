# Files

Files are a common part of many APIs. Yaade allows you to upload files to the Yaade-Server and reference them in your requests. This is especially useful when you are testing file uploads to your API.

::: info
Files are stored on the Yaade-Server directly. They are not stored in the database. This means that a backup does not contain files. Files can by sent by both the Server and Exension proxy.
:::

## Upload

To upload a file, select the **Body** tab of a request. Then change the content type to `multipart/form-data`. A form data field can either be a file or a text field. To add a file, change the type from **Text** to **File**. After that, the value-part of the form data field will change to a file input. Click on the file input to open a dialog and select the file you want to upload. Uploaded files are accessible globally and can be used in any request of any collection.

## Select a file

To select a file, simply click the filename in the file input dialog. This will add the file to the request.

## Delete a file

To delete a file from the server, simply click on the trash icon next to the file name in the file input dialog. This will remove the file from the server and from the request.

## Limiting File Access

Just like collections, file-access can be restricted to certain groups. Groups are selected when uploading the file. Once uploaded, groups cannot be changed.

## Changing the storage location

The storage location of files on the server can be changed by setting the `YAADE_FILE_STORAGE_PATH` environment variable when starting the Docker Container. This can be helpful when you want to store files on a different machine by mounting a network drive or something like s3fs.
