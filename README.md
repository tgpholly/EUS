<h1 align="center">
  <img width="150" height="150" src="http://ethanus.ml/images/logo.png">
</h1>
<p align="center">readme soon™</p>
<h1 align="center">
  Setup
</h1>

EUS has extra dependencies other than those of [Revolution](https://github.com/tgpethan/Revolution)'s base, of which include:
 - [connect-busboy](https://www.npmjs.com/package/connect-busboy)
 - [randomstring](https://www.npmjs.com/package/randomstring)
 - [get-folder-size](https://www.npmjs.com/package/get-folder-size)
 
Install the dependencies and then simply drop the EUS.js into a Revolution instance's modules folder **(If you still have [example_request_handler.js](https://github.com/tgpethan/Revolution/blob/master/modules/example_request_handler.js) be sure to delete it!)**

If this is running at a URL then you can define the url to build from in the config with the **baseURL** property. Remember to put a / at the end or the url will be malformed!

If you want to expand the files that the server allows to be sent to it this can be done in the **allowedTypes** array
