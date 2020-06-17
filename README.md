⠀
<img align="right" width="120" src="http://ethanus.ml/images/logo.png">
=======

[![CodeFactor](https://www.codefactor.io/repository/github/tgpethan/eus/badge/master)](https://www.codefactor.io/repository/github/tgpethan/eus/overview/master)
[![Discord](https://img.shields.io/discord/477024246959308810?color=7289da&label=Discord&logo=discord&logoColor=ffffff)](https://discord.gg/BV8QGn6)

EUS is my public screenshot server built using [Revolution](https://github.com/tgpethan/Revolution)

## Setup

EUS has extra dependencies other than those of [Revolution](https://github.com/tgpethan/Revolution), the server EUS is made on, of which include:
 - [connect-busboy](https://www.npmjs.com/package/connect-busboy)
 - [randomstring](https://www.npmjs.com/package/randomstring)
 - [get-folder-size](https://www.npmjs.com/package/get-folder-size)
 
Install the dependencies and then simply drop the EUS.js into a Revolution instance's modules folder **(If you still have [example_request_handler.js](https://github.com/tgpethan/Revolution/blob/master/modules/example_request_handler.js) be sure to delete it!)**

## Config
On first startup EUS will create a new config file in the **modules/EUS/** folder, some of these values may need to be changed depending on your use case.

The value of **baseURL** will need to be changed to what you access the server from, for example if the server's ip is 192.168.1.100 and you are not planning to use EUS at a url you would change the value to **http://192.168.1.100/**. **baseURL** is used to construct the response url for file uploads, for example the value of **baseURL** on my instance of EUS is **https://ethanus.ml/**.

If you want to expand the files that the server allows to be sent to it this can be done in the **allowedTypes** array. By default the array contains **png, jpg and gif**.

The value of **uploadKey** is used to restrict who can upload to your server, set this to something and the server will restrict who can upload depending on if they provided the key or not. If this field is left blank EUS will asume you don't want an upload key and uploads to it will be unrestricted

## API
EUS has 3 apis, they are located at **[/api/get-stats](https://ethanus.ml/api/get-stats)**, **[/api/get-info](https://ethanus.ml/api/get-info)** and **[/api/get-server-status](https://ethanus.ml/api/get-server-status)**

[These are better documented on EUS Docs](https://docs.ethanus.ml)

## Websites that use EUS
[EUS](https://ethanus.ml)

[Jack Images](https://jackimages.ml)
