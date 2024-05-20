# Certificates

You can upload your SSL certificates to the server to use them in your requests. This is useful if you have a self-signed certificate or a certificate that is not trusted by the system. To upload a certificate, go to the **⚙️ > Certificates**. Select the certificate file and specify for which hostname it should be used. The hostname is the domain name of the server that the certificate is used for.

::: warning
If multiple certificates are uploaded for the same hostname, the last uploaded certificate will be used.
:::

You can restrict the access to certificates via groups. This works the same way as for collections. Only users that are in the specified groups can use the certificate in their requests. If no group is specified, the certificate is available to all users.

Note that the certificate, once uploaded, is not readable by any user directly and can therefore only be deleted and reuploaded.

::: info
Currently only certificates in the PEM format are supported.
:::
